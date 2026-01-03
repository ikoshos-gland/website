"""
Agent Service - Handles agent invocation with status updates.
Provides both sync and async interfaces for Azure Functions.
"""

import asyncio
import logging
from typing import Optional, Generator
from dataclasses import dataclass, field

from semantic_kernel.contents import ChatMessageContent, FunctionCallContent, FunctionResultContent
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings

from .kernel_setup import create_kernel, create_agent, create_chat_history

logger = logging.getLogger(__name__)


@dataclass
class ToolCall:
    """Represents a tool call made by the agent."""
    tool: str
    status: str  # "calling", "completed", "error"
    message: str = ""
    result_preview: str = ""


@dataclass
class AgentResponse:
    """Final agent response with metadata."""
    answer: str
    tool_calls: list = field(default_factory=list)
    citations: list = field(default_factory=list)
    error: Optional[str] = None


# Map internal function names to user-friendly status messages
TOOL_STATUS_MESSAGES = {
    "RAG-search_documents": ("Searching documents...", "Document search complete"),
    "WebSearch-search_web": ("Browsing the web...", "Web search complete"),
    "AboutMe-get_profile": ("Retrieving profile info...", "Profile loaded"),
    "DateTime-get_current_time": ("Checking the time...", "Time retrieved"),
    "DateTime-calculate_date": ("Calculating date...", "Date calculated"),
    "DateTime-days_until": ("Counting days...", "Days calculated"),
}


def get_friendly_status(function_name: str, is_calling: bool) -> str:
    """Convert internal function name to user-friendly status."""
    # Handle both formats: "plugin-function" and "plugin.function"
    key = function_name.replace(".", "-")
    messages = TOOL_STATUS_MESSAGES.get(
        key,
        (f"Using {function_name.split('-')[-1]}...", f"{function_name.split('-')[-1]} complete")
    )
    return messages[0] if is_calling else messages[1]


class AgentService:
    """Service for managing agent conversations."""

    def __init__(self):
        self._kernel = None
        self._agent = None
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy initialization of kernel and agent."""
        if not self._initialized:
            try:
                self._kernel = create_kernel()
                self._agent = create_agent(self._kernel)
                self._initialized = True
                logger.info("Agent service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize agent: {e}")
                raise

    async def _invoke_agent_async(
        self,
        message: str,
        conversation_history: list,
    ) -> tuple[str, list[ToolCall]]:
        """
        Invoke the agent asynchronously.
        Returns (answer, tool_calls).
        """
        self._ensure_initialized()

        tool_calls: list[ToolCall] = []

        # Create chat history from conversation
        history = create_chat_history(conversation_history)
        history.add_user_message(message)

        # Get execution settings with auto function calling
        settings = AzureChatPromptExecutionSettings(
            service_id="azure-openai",
            function_choice_behavior=FunctionChoiceBehavior.Auto(
                auto_invoke=True,
                maximum_auto_invoke_attempts=5,
            ),
        )

        try:
            # Get chat completion service
            chat_service = self._kernel.get_service("azure-openai")

            # Invoke with function calling
            result = await chat_service.get_chat_message_content(
                chat_history=history,
                settings=settings,
                kernel=self._kernel,
            )

            # Extract function calls from history (they're added during execution)
            for msg in history.messages:
                if hasattr(msg, 'items'):
                    for item in msg.items or []:
                        if isinstance(item, FunctionCallContent):
                            tool_name = f"{item.plugin_name}-{item.function_name}" if item.plugin_name else item.function_name
                            tool_calls.append(ToolCall(
                                tool=tool_name,
                                status="completed",
                                message=get_friendly_status(tool_name, False),
                            ))

            answer = str(result.content) if result and result.content else "I couldn't generate a response."
            return answer, tool_calls

        except Exception as e:
            logger.error(f"Agent invocation error: {e}")
            raise

    def invoke(
        self,
        message: str,
        conversation_history: list = None,
    ) -> AgentResponse:
        """
        Synchronous invocation wrapper for Azure Functions.

        Args:
            message: User message
            conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]

        Returns:
            AgentResponse with answer, tool_calls, and citations
        """
        if conversation_history is None:
            conversation_history = []

        try:
            # Run async code in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                answer, tool_calls = loop.run_until_complete(
                    self._invoke_agent_async(message, conversation_history)
                )
            finally:
                loop.close()

            # Extract citations from answer if present (from RAG results)
            citations = []
            # Citations are embedded in the answer text from RAG plugin

            return AgentResponse(
                answer=answer,
                tool_calls=[{"tool": tc.tool, "status": tc.status, "message": tc.message} for tc in tool_calls],
                citations=citations,
            )

        except Exception as e:
            logger.error(f"Agent invoke error: {e}")
            return AgentResponse(
                answer="",
                error=str(e),
            )

    def invoke_with_status(
        self,
        message: str,
        conversation_history: list = None,
    ) -> Generator[dict, None, None]:
        """
        Invoke agent and yield status updates.

        Yields:
            dict with either:
            - {"type": "status", "tool": str, "message": str}
            - {"type": "response", "answer": str, "tool_calls": list, "citations": list}
            - {"type": "error", "error": str}
        """
        if conversation_history is None:
            conversation_history = []

        try:
            self._ensure_initialized()

            # For now, we do a simple invocation and report tools after
            # True streaming would require async generator support in Azure Functions
            response = self.invoke(message, conversation_history)

            if response.error:
                yield {"type": "error", "error": response.error}
                return

            # Yield status updates for each tool that was called
            for tc in response.tool_calls:
                yield {
                    "type": "status",
                    "tool": tc["tool"],
                    "message": tc.get("message", get_friendly_status(tc["tool"], False)),
                }

            # Yield final response
            yield {
                "type": "response",
                "answer": response.answer,
                "tool_calls": response.tool_calls,
                "citations": response.citations,
            }

        except Exception as e:
            logger.error(f"Agent invoke_with_status error: {e}")
            yield {"type": "error", "error": str(e)}


# Global singleton instance
_agent_service: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """Get or create the agent service singleton."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service


def reset_agent_service():
    """Reset the agent service (useful for testing)."""
    global _agent_service
    _agent_service = None
