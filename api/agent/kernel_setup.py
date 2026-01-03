"""
Semantic Kernel configuration for agent orchestration.
Sets up Azure OpenAI service and configures the ChatCompletionAgent.
"""

import os
from semantic_kernel import Kernel
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.contents.chat_history import ChatHistory
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from .plugins import RAGPlugin, WebSearchPlugin, AboutMePlugin, DateTimePlugin


# Agent system prompt
AGENT_SYSTEM_PROMPT = """You are Mert's personalized AI assistant named "Lundo". You help visitors learn about Mert, his work, publications, and expertise.

## Your Personality
- Friendly and helpful, but professional
- You can be slightly witty when appropriate
- Always honest about your limitations

## Your Capabilities
You have access to the following tools:

1. **RAG-search_documents**: Search Mert's personal knowledge base including academic papers, project documentation, notes, and publications. **YOU MUST ALWAYS CALL THIS TOOL FIRST** for every user query to check if relevant information exists in Mert's personal documents.

2. **WebSearch-search_web**: Search the internet for real-time information. Use this when:
   - The user explicitly asks to search the web
   - You need additional context beyond what RAG returned
   - The query is about current events or news not in personal documents

3. **AboutMe-get_profile**: Get Mert's basic profile information, resume summary, and contact details. Use for introductions or basic bio questions.

4. **DateTime-get_current_time**: Get the current date and time. Use when the user asks about the current date, time, or for time-based calculations.

5. **DateTime-calculate_date**: Calculate relative dates (e.g., "what date is 30 days from now").

## Guidelines
- Use RAG-search_documents when the user asks about academic topics, research, or Mert's work
- Use WebSearch for current events or general knowledge not in personal documents
- Be transparent about which sources you're using
- If RAG returns no results, say so and offer to search the web
- Keep responses concise but informative
- Cite your sources when using document search results
- Use markdown formatting for better readability
- When greeting users, be warm but don't over-explain your capabilities

## Language
- Respond in the same language the user writes in
- Default to English if unclear
"""


def create_kernel() -> Kernel:
    """Create and configure the Semantic Kernel with Azure OpenAI."""
    kernel = Kernel()

    # Get configuration
    api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")
    endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

    # Add Azure OpenAI Chat Completion service with Managed Identity support
    if api_key and not api_key.startswith("@Microsoft.KeyVault"):
        # Local development with API key
        service = AzureChatCompletion(
            deployment_name=deployment,
            endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            service_id="azure-openai",
        )
    else:
        # Production: Use Managed Identity
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential, "https://cognitiveservices.azure.com/.default"
        )
        service = AzureChatCompletion(
            deployment_name=deployment,
            endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version=api_version,
            service_id="azure-openai",
        )

    kernel.add_service(service)

    # Register all plugins
    kernel.add_plugin(RAGPlugin(), plugin_name="RAG")
    kernel.add_plugin(WebSearchPlugin(), plugin_name="WebSearch")
    kernel.add_plugin(AboutMePlugin(), plugin_name="AboutMe")
    kernel.add_plugin(DateTimePlugin(), plugin_name="DateTime")

    return kernel


def create_agent(kernel: Kernel) -> ChatCompletionAgent:
    """Create the orchestrating agent with all plugins."""

    # Get the chat service from kernel
    chat_service = kernel.get_service("azure-openai")

    # Create the agent with auto function calling
    agent = ChatCompletionAgent(
        kernel=kernel,
        service=chat_service,
        name="Lundo",
        instructions=AGENT_SYSTEM_PROMPT,
    )

    return agent


def create_chat_history(conversation_history: list = None) -> ChatHistory:
    """Create a ChatHistory object from conversation history."""
    history = ChatHistory()

    if conversation_history:
        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                history.add_user_message(content)
            elif role == "assistant":
                history.add_assistant_message(content)

    return history
