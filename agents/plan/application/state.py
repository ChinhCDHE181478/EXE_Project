from typing import Any, Dict, Optional, List

from langgraph.managed.is_last_step import RemainingSteps
from langgraph.prebuilt.chat_agent_executor import AgentState

from shared.models import Plan, ItineraryResponse


class PlanAgentState(AgentState):
    plan: Optional[Plan]
    itinerary: Optional[ItineraryResponse]
    language: str
    attractions: List[Dict[str, Any]]
    restaurants: List[Dict[str, Any]]
    destination_image_url: Optional[str]
    remaining_steps: RemainingSteps
