"""
Web Search Plugin - Real-time web search using Tavily API.
"""

import os
import logging
from typing import Annotated
from semantic_kernel.functions import kernel_function

logger = logging.getLogger(__name__)


class WebSearchPlugin:
    """Plugin for real-time web search using Tavily."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        """Lazy initialization of Tavily client."""
        if self._client is None:
            try:
                from tavily import TavilyClient

                api_key = os.environ.get("TAVILY_API_KEY")
                if not api_key:
                    raise ValueError("TAVILY_API_KEY not configured")
                self._client = TavilyClient(api_key=api_key)
            except ImportError:
                raise ImportError("tavily-python package is not installed")
        return self._client

    @kernel_function(
        name="search_web",
        description="Search the internet for real-time information. Use for current events, recent news, technology updates, or when the document search doesn't have the answer. Also useful for verifying or supplementing information.",
    )
    def search_web(
        self,
        query: Annotated[str, "The search query for web search"],
        max_results: Annotated[int, "Maximum number of results to return (1-10)"] = 5,
    ) -> Annotated[str, "Web search results with titles, snippets, and URLs"]:
        """Perform web search using Tavily API."""
        try:
            client = self._get_client()

            # Cap max_results between 1 and 10
            max_results = max(1, min(max_results, 10))

            response = client.search(
                query=query,
                search_depth="basic",
                max_results=max_results,
                include_answer=True,
            )

            # Format results
            results = []

            # Include Tavily's AI-generated answer if available
            if response.get("answer"):
                results.append(f"**Quick Answer:** {response['answer']}\n")

            results.append("**Web Sources:**")
            for idx, item in enumerate(response.get("results", [])[:max_results], 1):
                title = item.get("title", "Untitled")
                url = item.get("url", "")
                snippet = item.get("content", "")[:250]
                results.append(f"{idx}. **{title}**\n   {snippet}...\n   Source: {url}")

            if not response.get("results"):
                return "No web results found for this query."

            return "\n\n".join(results)

        except ValueError as e:
            logger.warning(f"Tavily not configured: {e}")
            return "Web search is not available. TAVILY_API_KEY is not configured."
        except ImportError:
            logger.warning("Tavily package not installed")
            return "Web search is not available. The tavily-python package is not installed."
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return f"Error searching the web: {str(e)}"
