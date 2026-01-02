"""
Agent module for Semantic Kernel orchestration.
Provides ReAct-style agent with multiple tools.
"""

from .agent_service import get_agent_service, AgentService

__all__ = ["get_agent_service", "AgentService"]
