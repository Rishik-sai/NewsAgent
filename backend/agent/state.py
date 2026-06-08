from typing import TypedDict, List, Dict, Any, Sequence
from langchain_core.messages import BaseMessage

class NewsAgentState(TypedDict):
    messages: Sequence[BaseMessage]
    agent_type: str                  # Type of agent: finance, tech, sports, etc.
    intent: str                      # 'search', 'preference', 'chat'
    topic: str                       # Extracted topic from user query (e.g. "AI in Healthcare")
    queries: List[str]               # Keywords extracted for NewsAPI query
    date_from: str                   # Optional ISO date string for filtering (e.g. "2026-05-25")
    date_to: str                     # Optional ISO date string for filtering (e.g. "2026-05-30")
    language: str                    # User's preferred language code (e.g. "hi", "en-in", "ta")
    raw_articles: List[Dict[str, Any]]
    translated_articles: List[Dict[str, Any]]  # Articles translated to user's preferred language
    response: Dict[str, Any]         # The final formatted JSON response for the UI
    client_id: str                   # Unique identifier for the user session
