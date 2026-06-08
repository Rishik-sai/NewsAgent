"""Shared LLM factory for the News Agent pipeline."""

from langchain_groq import ChatGroq
from config import settings


def get_llm(temperature: float = 0, streaming: bool = False) -> ChatGroq | None:
    """Create a ChatGroq LLM instance with the given parameters.
    
    Returns None if no valid API key is configured.
    
    Args:
        temperature: Controls randomness. 0 = deterministic, higher = more creative.
        streaming: Whether to enable streaming mode for token-by-token output.
    """
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
        return None
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
        temperature=temperature,
        streaming=streaming,
    )
