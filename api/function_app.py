"""
Azure Function App - Secure RAG API
With rate limiting, request validation, and origin protection.
"""

import os
import json
import logging
import azure.functions as func
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from security import (
    secure_endpoint,
    validate_chat_request,
    get_cors_headers,
    sanitize_input,
    RATE_LIMIT_CHAT_MAX,
)

# Initialize Function App
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# AZURE OPENAI CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
CHAT_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
EMBEDDING_DEPLOYMENT = os.environ.get("AZURE_EMBEDDING_DEPLOYMENT", "text-embedding-3-large")


def get_openai_client() -> AzureOpenAI:
    """Azure OpenAI client oluştur (Managed Identity ile)."""
    # Try Managed Identity first, fallback to API key for local dev
    api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")

    if api_key and not api_key.startswith("@Microsoft.KeyVault"):
        # Local development with API key
        logger.info("Using API key for Azure OpenAI authentication")
        return AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=api_key,
            api_version=AZURE_OPENAI_API_VERSION,
        )
    else:
        # Production: Use Managed Identity
        logger.info("Using Managed Identity for Azure OpenAI authentication")
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential,
            "https://cognitiveservices.azure.com/.default"
        )
        return AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            azure_ad_token_provider=token_provider,
            api_version=AZURE_OPENAI_API_VERSION,
        )


def get_data_source_config() -> dict:
    """Azure AI Search 'On Your Data' yapılandırması (Managed Identity ile)."""
    # Check if we're using API key (local dev) or Managed Identity (production)
    search_key = os.environ.get("AZURE_SEARCH_KEY", "")
    use_managed_identity = not search_key or search_key.startswith("@Microsoft.KeyVault")

    auth_config = {
        "type": "system_assigned_managed_identity" if use_managed_identity else "api_key"
    }
    if not use_managed_identity:
        auth_config["key"] = search_key
        logger.info("Using API key for Azure AI Search authentication")
    else:
        logger.info("Using Managed Identity for Azure AI Search authentication")

    return {
        "type": "azure_search",
        "parameters": {
            "endpoint": os.environ["AZURE_SEARCH_ENDPOINT"],
            "index_name": os.environ.get("AZURE_SEARCH_INDEX", "documents-index"),
            "authentication": auth_config,
            "query_type": "vector_semantic_hybrid",
            "semantic_configuration": "default",
            "embedding_dependency": {
                "type": "deployment_name",
                "deployment_name": EMBEDDING_DEPLOYMENT,
            },
            "top_n_documents": 5,
            "in_scope": True,
            "strictness": 3,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════
# RAG CHAT ENDPOINT (Secured)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="chat", methods=["POST", "OPTIONS"])
@secure_endpoint(max_requests=RATE_LIMIT_CHAT_MAX, require_signature=False)
def chat(req: func.HttpRequest) -> func.HttpResponse:
    """
    RAG Chat - Azure AI Search'teki dokümanlarda arayarak cevap verir.
    Rate limited to 10 requests per minute per IP.
    """
    headers = get_cors_headers(req)

    # Validate request
    is_valid, error, body = validate_chat_request(req)
    if not is_valid:
        return func.HttpResponse(
            json.dumps({"error": error}),
            status_code=400,
            headers=headers,
        )

    try:
        user_message = body["message"]
        conversation_history = body["conversation_history"]

        # Build messages
        messages = [
            {
                "role": "system",
                "content": (
                    "Sen yardımcı bir asistansın. Soruları sadece sağlanan dokümanlara dayanarak cevapla. "
                    "Eğer cevap dokümanlarda yoksa, bunu açıkça belirt. "
                    "Kaynaklarını belirt."
                ),
            }
        ]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        # Azure OpenAI call
        client = get_openai_client()
        response = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=messages,
            max_tokens=800,
            temperature=0.7,
            extra_body={
                "data_sources": [get_data_source_config()],
            },
        )

        # Extract response
        choice = response.choices[0]
        answer = choice.message.content

        # Extract citations
        citations = []
        if hasattr(choice.message, "context") and choice.message.context:
            for citation in choice.message.context.get("citations", []):
                citations.append({
                    "title": sanitize_input(citation.get("title", ""), 200),
                    "content": sanitize_input(citation.get("content", ""), 300),
                    "filepath": sanitize_input(citation.get("filepath", ""), 500),
                })

        return func.HttpResponse(
            json.dumps({
                "answer": answer,
                "citations": citations,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            }),
            status_code=200,
            headers=headers,
        )

    except KeyError as e:
        logger.error(f"Missing environment variable: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Server configuration error"}),
            status_code=500,
            headers=headers,
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "An error occurred processing your request"}),
            status_code=500,
            headers=headers,
        )


# ═══════════════════════════════════════════════════════════════════════════
# SIMPLE CHAT (Secured, stricter rate limit)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="chat-simple", methods=["POST", "OPTIONS"])
@secure_endpoint(max_requests=RATE_LIMIT_CHAT_MAX, require_signature=False)
def chat_simple(req: func.HttpRequest) -> func.HttpResponse:
    """
    Simple Chat - Direct GPT chat without RAG.
    Rate limited to 10 requests per minute per IP.
    """
    headers = get_cors_headers(req)

    # Validate request
    is_valid, error, body = validate_chat_request(req)
    if not is_valid:
        return func.HttpResponse(
            json.dumps({"error": error}),
            status_code=400,
            headers=headers,
        )

    try:
        user_message = body["message"]
        conversation_history = body["conversation_history"]

        messages = [{"role": "system", "content": "Sen yardımcı bir asistansın."}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        client = get_openai_client()
        response = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )

        return func.HttpResponse(
            json.dumps({
                "answer": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            }),
            status_code=200,
            headers=headers,
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "An error occurred processing your request"}),
            status_code=500,
            headers=headers,
        )


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH CHECK (More lenient rate limit)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="health", methods=["GET", "OPTIONS"])
@secure_endpoint(max_requests=60, require_signature=False)
def health(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint."""
    headers = get_cors_headers(req)

    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_KEY",
    ]

    missing = [var for var in required_vars if not os.environ.get(var)]

    if missing:
        return func.HttpResponse(
            json.dumps({
                "status": "unhealthy",
                "message": "Service not fully configured",
            }),
            status_code=503,
            headers=headers,
        )

    return func.HttpResponse(
        json.dumps({
            "status": "healthy",
            "version": "2.0.0",
        }),
        status_code=200,
        headers=headers,
    )


# ═══════════════════════════════════════════════════════════════════════════
# INDEX INITIALIZATION (Admin only - strictest protection)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="init-index", methods=["POST", "OPTIONS"])
@secure_endpoint(max_requests=2, require_signature=True)
def init_index(req: func.HttpRequest) -> func.HttpResponse:
    """
    Create Azure AI Search index.
    PROTECTED: Requires valid signature and has strict rate limit.
    """
    headers = get_cors_headers(req)

    try:
        from azure.search.documents.indexes import SearchIndexClient
        from azure.search.documents.indexes.models import (
            SearchIndex,
            SearchField,
            SearchFieldDataType,
            VectorSearch,
            HnswAlgorithmConfiguration,
            VectorSearchProfile,
            SemanticConfiguration,
            SemanticField,
            SemanticPrioritizedFields,
            SemanticSearch,
        )
        from azure.core.credentials import AzureKeyCredential

        # Use Managed Identity for production, API key for local dev
        search_key = os.environ.get("AZURE_SEARCH_KEY", "")
        if search_key and not search_key.startswith("@Microsoft.KeyVault"):
            logger.info("Using API key for Search index creation")
            credential = AzureKeyCredential(search_key)
        else:
            logger.info("Using Managed Identity for Search index creation")
            credential = DefaultAzureCredential()

        index_client = SearchIndexClient(
            endpoint=os.environ["AZURE_SEARCH_ENDPOINT"],
            credential=credential,
        )

        index_name = os.environ.get("AZURE_SEARCH_INDEX", "documents-index")

        fields = [
            SearchField(name="id", type=SearchFieldDataType.String, key=True, filterable=True),
            SearchField(name="content", type=SearchFieldDataType.String, searchable=True),
            SearchField(name="title", type=SearchFieldDataType.String, searchable=True, filterable=True),
            SearchField(name="source", type=SearchFieldDataType.String, filterable=True),
            SearchField(name="chunk_id", type=SearchFieldDataType.Int32, filterable=True),
            SearchField(
                name="content_vector",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=3072,
                vector_search_profile_name="vector-profile",
            ),
        ]

        vector_search = VectorSearch(
            algorithms=[HnswAlgorithmConfiguration(name="hnsw-config")],
            profiles=[
                VectorSearchProfile(
                    name="vector-profile",
                    algorithm_configuration_name="hnsw-config",
                ),
            ],
        )

        semantic_config = SemanticConfiguration(
            name="default",
            prioritized_fields=SemanticPrioritizedFields(
                content_fields=[SemanticField(field_name="content")],
                title_field=SemanticField(field_name="title"),
            ),
        )

        semantic_search = SemanticSearch(configurations=[semantic_config])

        index = SearchIndex(
            name=index_name,
            fields=fields,
            vector_search=vector_search,
            semantic_search=semantic_search,
        )

        result = index_client.create_or_update_index(index)

        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": f"Index '{result.name}' created successfully",
            }),
            status_code=200,
            headers=headers,
        )

    except Exception as e:
        logger.error(f"Index creation error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to create index"}),
            status_code=500,
            headers=headers,
        )


# ═══════════════════════════════════════════════════════════════════════════
# AGENT CHAT ENDPOINT (with tool orchestration)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="agent", methods=["POST", "OPTIONS"])
@secure_endpoint(max_requests=RATE_LIMIT_CHAT_MAX, require_signature=False)
def agent_chat(req: func.HttpRequest) -> func.HttpResponse:
    """
    Agent Chat - Orchestrated chat with multiple tools (RAG, Web Search, etc.)
    Returns response with tool execution status.
    Rate limited to 10 requests per minute per IP.
    """
    headers = get_cors_headers(req)

    # Validate request
    is_valid, error, body = validate_chat_request(req)
    if not is_valid:
        return func.HttpResponse(
            json.dumps({"error": error}),
            status_code=400,
            headers=headers,
        )

    try:
        from agent import get_agent_service

        user_message = body["message"]
        conversation_history = body["conversation_history"]

        # Invoke the agent
        agent_service = get_agent_service()
        result = agent_service.invoke(user_message, conversation_history)

        if result.error:
            logger.error(f"Agent error: {result.error}")
            return func.HttpResponse(
                json.dumps({"error": "An error occurred processing your request"}),
                status_code=500,
                headers=headers,
            )

        return func.HttpResponse(
            json.dumps({
                "answer": result.answer,
                "tool_calls": result.tool_calls,
                "citations": result.citations,
            }),
            status_code=200,
            headers=headers,
        )

    except ImportError as e:
        logger.error(f"Agent module import error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Agent module not available. Please check dependencies."}),
            status_code=500,
            headers=headers,
        )
    except Exception as e:
        logger.error(f"Agent chat error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "An error occurred processing your request"}),
            status_code=500,
            headers=headers,
        )


# ═══════════════════════════════════════════════════════════════════════════
# AGENT CHAT WITH STATUS UPDATES (Server-Sent Events style in JSON)
# ═══════════════════════════════════════════════════════════════════════════
@app.route(route="agent-stream", methods=["POST", "OPTIONS"])
@secure_endpoint(max_requests=RATE_LIMIT_CHAT_MAX, require_signature=False)
def agent_chat_stream(req: func.HttpRequest) -> func.HttpResponse:
    """
    Agent Chat with Status - Returns events for tool usage and final response.
    Returns a JSON array of events for easier frontend parsing.
    """
    headers = get_cors_headers(req)

    # Validate request
    is_valid, error, body = validate_chat_request(req)
    if not is_valid:
        return func.HttpResponse(
            json.dumps({"events": [{"type": "error", "error": error}]}),
            status_code=400,
            headers=headers,
        )

    try:
        from agent import get_agent_service

        user_message = body["message"]
        conversation_history = body["conversation_history"]

        # Invoke the agent with status updates
        agent_service = get_agent_service()
        events = list(agent_service.invoke_with_status(user_message, conversation_history))

        return func.HttpResponse(
            json.dumps({"events": events}),
            status_code=200,
            headers=headers,
        )

    except ImportError as e:
        logger.error(f"Agent module import error: {e}")
        return func.HttpResponse(
            json.dumps({"events": [{"type": "error", "error": "Agent module not available"}]}),
            status_code=500,
            headers=headers,
        )
    except Exception as e:
        logger.error(f"Agent stream error: {e}")
        return func.HttpResponse(
            json.dumps({"events": [{"type": "error", "error": str(e)}]}),
            status_code=500,
            headers=headers,
        )
