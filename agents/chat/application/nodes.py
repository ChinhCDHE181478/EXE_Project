from langchain_core.runnables import RunnableConfig
from shared.state import AgentState
from shared.infrastructure.llm import llm
from chat.application.summarize import SummarizeTool

async def summarize_node(state: AgentState, config: RunnableConfig):
    """Handles summarizing the message conversation."""
    summarize_tool = SummarizeTool(llm)

    return await summarize_tool.summarize(state, config)
