"""
RAG Plugin - Search documents in Azure AI Search.
Wraps the existing RAG functionality as a Semantic Kernel plugin.
"""

import os
import logging
from typing import Annotated
from semantic_kernel.functions import kernel_function
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

logger = logging.getLogger(__name__)


class RAGPlugin:
    """Plugin for searching Mert's document knowledge base."""

    def __init__(self):
        self._client = None
        self._data_source_config = None

    def _get_client(self) -> AzureOpenAI:
        """Lazy initialization of Azure OpenAI client with Managed Identity support."""
        if self._client is None:
            api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")
            endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
            api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

            if api_key and not api_key.startswith("@Microsoft.KeyVault"):
                # Local development with API key
                self._client = AzureOpenAI(
                    azure_endpoint=endpoint,
                    api_key=api_key,
                    api_version=api_version,
                )
            else:
                # Production: Use Managed Identity
                credential = DefaultAzureCredential()
                token_provider = get_bearer_token_provider(
                    credential, "https://cognitiveservices.azure.com/.default"
                )
                self._client = AzureOpenAI(
                    azure_endpoint=endpoint,
                    azure_ad_token_provider=token_provider,
                    api_version=api_version,
                )
        return self._client

    def _get_data_source_config(self) -> dict:
        """Get Azure AI Search data source configuration."""
        if self._data_source_config is None:
            self._data_source_config = {
                "type": "azure_search",
                "parameters": {
                    "endpoint": os.environ["AZURE_SEARCH_ENDPOINT"],
                    "index_name": os.environ.get("AZURE_SEARCH_INDEX", "documents-index"),
                    "authentication": {
                        "type": "api_key",
                        "key": os.environ["AZURE_SEARCH_KEY"],
                    },
                    "query_type": "vector_semantic_hybrid",
                    "semantic_configuration": "default",
                    "embedding_dependency": {
                        "type": "deployment_name",
                        "deployment_name": os.environ.get(
                            "AZURE_EMBEDDING_DEPLOYMENT", "text-embedding-3-large"
                        ),
                    },
                    "top_n_documents": 5,
                    "in_scope": True,
                    "strictness": 3,
                },
            }
        return self._data_source_config

    @kernel_function(
        name="search_documents",
        description="Search Mert's personal knowledge base including academic papers, project documentation, notes, and publications. Returns relevant document excerpts with citations. Use this for any questions about Mert's work, research, projects, or personal notes.",
    )
    def search_documents(
        self,
        query: Annotated[str, "The search query to find relevant documents in the knowledge base"],
    ) -> Annotated[str, "Search results with document excerpts and source citations"]:
        """Search documents using Azure AI Search with RAG."""
        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
                messages=[
                    {
                        "role": "system",
                        "content": "Extract and summarize relevant information from the provided documents. Be concise but thorough. Include specific details. IMPORTANT: Always cite your sources using [doc1], [doc2], etc. inline notation when referencing information from documents.",
                    },
                    {"role": "user", "content": query},
                ],
                max_tokens=800,
                temperature=0.3,
                extra_body={"data_sources": [self._get_data_source_config()]},
            )

            answer = response.choices[0].message.content

            # Extract citations if available
            citations = []
            if hasattr(response.choices[0].message, "context"):
                context = response.choices[0].message.context or {}
                for cit in context.get("citations", []):
                    title = cit.get("title", "Untitled")
                    filepath = cit.get("filepath", "")
                    content_preview = cit.get("content", "")[:150]
                    citations.append(f"- **{title}** ({filepath}): {content_preview}...")

            result = f"**Document Search Results:**\n\n{answer}"
            if citations:
                result += f"\n\n**Sources:**\n" + "\n".join(citations[:3])  # Limit to 3 citations

            return result

        except KeyError as e:
            logger.error(f"Missing environment variable for RAG: {e}")
            return f"Error: RAG search is not properly configured. Missing: {e}"
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            return f"Error searching documents: {str(e)}"
