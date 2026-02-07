import json
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from langchain_core.prompts import ChatPromptTemplate
from langgraph.config import get_stream_writer
from langgraph.runtime import Runtime
from loguru import logger
from pydantic import BaseModel, Field

from plan.application.tools import transfer_to_chatbot
from shared.runtime import ContextSchema
from shared.infrastructure.llm import planning_llm, llm
from shared.models import ItineraryResponse
from plan.domain.prompt import CREATE_ITINERARY_TEMPLATE
from plan.application.state import PlanAgentState


class AttractionsSearchQuery(BaseModel):
    query: str = Field(description="The query to search for tourist attractions")


class RestaurantsSearchQuery(BaseModel):
    query: str = Field(description="The query to search for restaurants and local food")


async def create_itinerary_node(
    state: PlanAgentState, config: RunnableConfig
) -> PlanAgentState:
    """Create detailed itinerary based on plan."""
    plan = state["plan"]
    if plan is None:
        logger.warning("create_itinerary_node: Missing plan in state")
        return {**state}
    parser = JsonOutputParser(pydantic_object=ItineraryResponse)
    stream_writer = get_stream_writer()

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", CREATE_ITINERARY_TEMPLATE),
            ("human", "Plan: {plan}"),
        ]
    ).partial(
        language=state["language"],
        format_instructions=parser.get_format_instructions(),
        attractions=json.dumps(state["attractions"], ensure_ascii=False),
        restaurants=json.dumps(state["restaurants"], ensure_ascii=False),
    )
    chain = prompt | planning_llm | parser

    stream_writer(
        {
            "data-itinerary": {
                "data": {"status": "loading"},
                "metadata": {"langgraph_node": "create_itinerary_node"},
            }
        }
    )

    response = {}

    async for chunk in chain.astream(
        {
            "plan": plan.model_dump_json(),
        },
        config=config,
    ):
        stream_writer(
            {
                "data-itinerary": {
                    "data": chunk,
                    "metadata": {"langgraph_node": "create_itinerary_node"},
                }
            }
        )
        response.update(chunk)

    # Add destination_image_url to response before creating ItineraryResponse
    response["destination_image_url"] = state.get("destination_image_url")

    return {
        **state,
        "itinerary": ItineraryResponse(**response),
    }


async def get_attractions_node(
    state: PlanAgentState,
    config: RunnableConfig,
    runtime: Runtime[ContextSchema],
) -> dict:
    plan = state["plan"]
    if plan is None:
        logger.warning("get_attractions_node: Missing plan in state")
        return {**state}
    destinations = plan.destinations
    googlemaps_api = runtime.context.googlemaps_api

    structured_llm = llm.with_structured_output(AttractionsSearchQuery)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a helpful assistant that generate the search text query for Google Maps new Places API.
You must generate the query to search for **Tourist attractions** in the destinations.
You must response in {language}
            """,
            ),
            ("human", "Destinations: {destinations}\nPreferences: {preferences}"),
        ]
    ).partial(
        language=state["language"],
        destinations=", ".join(destinations),
        preferences=plan.user_preferences,
    )

    chain = prompt | structured_llm

    response = await chain.ainvoke(
        {
            "destinations": destinations,
        },
        config=config,
    )

    try:
        attractions = await googlemaps_api.search_attractions(
            text_query=response.query,  # type: ignore
            language=state["language"],
            page_size=20,  # type: ignore
        )

        return {"attractions": attractions}
    except Exception as e:
        logger.error(f"Error in get_attractions_node: {str(e)}")
        return {
            "attractions": [],
        }


async def transfer_node(
    state: PlanAgentState, config: RunnableConfig
) -> PlanAgentState:
    llm_with_tools = llm.bind_tools(
        [transfer_to_chatbot], tool_choice="transfer_to_chatbot"
    )

    response = await llm_with_tools.ainvoke("Transfer to Chatbot", config=config)

    return {**state, "messages": [response]}


async def get_restaurants_node(
    state: PlanAgentState,
    config: RunnableConfig,
    runtime: Runtime[ContextSchema],
) -> dict:
    plan = state["plan"]
    if plan is None:
        logger.warning("get_restaurants_node: Missing plan in state")
        return {**state}
    destinations = plan.destinations
    googlemaps_api = runtime.context.googlemaps_api

    structured_llm = llm.with_structured_output(RestaurantsSearchQuery)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Generate a concise text query for Google Maps Places API to find restaurants and local food.
Emphasize options aligned with user preferences and budget level.
Prefer notable local cuisine and well-rated venues.
Respond in {language}.
                """,
            ),
            ("human", "Destinations: {destinations}\nPreferences: {preferences}"),
        ]
    ).partial(
        language=state["language"],
        destinations=", ".join(destinations),
        preferences=plan.user_preferences,
    )

    chain = prompt | structured_llm

    response = await chain.ainvoke(
        {
            "destinations": destinations,
        },
        config=config,
    )

    try:
        restaurants = await googlemaps_api.search_restaurants(
            text_query=response.query,  # type: ignore
            language=state["language"],
            page_size=20,
        )

        return {
            "restaurants": restaurants,
        }
    except Exception as e:
        logger.error(f"Error in get_restaurants_node: {str(e)}")
        return {
            "restaurants": [],
        }


async def get_destination_image_node(
    state: PlanAgentState,
    config: RunnableConfig,
) -> dict:
    """Fetch a destination image from Unsplash."""
    from shared.tools.search_image import search_unsplash_image
    
    plan = state["plan"]
    if plan is None or not plan.destinations:
        logger.warning("get_destination_image_node: Missing plan or destinations")
        return {"destination_image_url": None}
    
    # Use the first destination as the primary destination
    primary_destination = plan.destinations[0]
    
    try:
        image_url = search_unsplash_image(
            query=f"{primary_destination}",
            per_page=1,
            orientation="landscape"
        )
        logger.info(f"Fetched image URL for {primary_destination}: {image_url}")
        return {"destination_image_url": image_url}
    except Exception as e:
        logger.error(f"Error fetching destination image: {e}")
        return {"destination_image_url": None}

