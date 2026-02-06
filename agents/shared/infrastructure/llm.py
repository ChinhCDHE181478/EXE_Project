from langchain_groq import ChatGroq
from shared.infrastructure.config.settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI


# llm = ChatOpenAI(
#     model=settings.MODEL_NAME,
#     max_completion_tokens=settings.MODEL_MAX_TOKENS,
#     temperature=settings.MODEL_TEMPERATURE,
#     max_retries=3,
# )

# planning_llm = ChatOpenAI(
#     model=settings.PLANNING_MODEL_NAME,
#     max_completion_tokens=settings.PLANNING_MODEL_MAX_TOKENS,
#     temperature=settings.PLANNING_MODEL_TEMPERATURE,
#     max_retries=2,
# )

# extract_llm = ChatOpenAI(
#     model="gpt-4o",
#     max_completion_tokens=settings.MODEL_MAX_TOKENS,
#     temperature=0,
#     max_retries=2,
# )


llm = ChatGroq(
    model=settings.MODEL_NAME,
    temperature=settings.MODEL_TEMPERATURE,
    max_tokens=settings.MODEL_MAX_TOKENS,
    max_retries=3,
)

planning_llm = ChatGroq(
    model=settings.PLANNING_MODEL_NAME,
    temperature=settings.PLANNING_MODEL_TEMPERATURE,
    max_tokens=settings.PLANNING_MODEL_MAX_TOKENS,
    max_retries=2,
)

extract_llm = ChatGroq(
    model=settings.MODEL_NAME,
    temperature=0,
    max_tokens=settings.MODEL_MAX_TOKENS,
    max_retries=2,
)

# llm = ChatGoogleGenerativeAI(
#     model=settings.MODEL_NAME,
#     google_api_key=settings.GOOGLE_API_KEY,
#     max_tokens=settings.MODEL_MAX_TOKENS,
#     temperature=settings.MODEL_TEMPERATURE,
#     streaming=True,
#     max_retries=3,
# )

# planning_llm = ChatGoogleGenerativeAI(
#     model=settings.PLANNING_MODEL_NAME,
#     google_api_key=settings.GOOGLE_API_KEY,
#     max_tokens=settings.PLANNING_MODEL_MAX_TOKENS,
#     temperature=settings.PLANNING_MODEL_TEMPERATURE,
#     streaming=True,
#     max_retries=2,
# )

# extract_llm = ChatGoogleGenerativeAI(
#     model=settings.MODEL_NAME,
#     google_api_key=settings.GOOGLE_API_KEY,
#     temperature=0,
#     max_tokens=settings.MODEL_MAX_TOKENS,
#     streaming=True,
#     max_retries=2,
# )
