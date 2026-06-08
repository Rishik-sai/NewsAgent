from langchain_core.messages import SystemMessage, HumanMessage
from agent.llm import get_llm
from agent.state import NewsAgentState
from datetime import datetime, timedelta
import json
import re

def _parse_relative_date(text: str) -> dict:
    """Fallback: parse relative date references from user text for keyword-based mode."""
    today = datetime.utcnow().date()
    lower = text.lower()
    result = {}
    
    if "yesterday" in lower:
        yesterday = today - timedelta(days=1)
        result["date_from"] = yesterday.isoformat()
        result["date_to"] = yesterday.isoformat()
    elif "last week" in lower:
        result["date_from"] = (today - timedelta(days=7)).isoformat()
        result["date_to"] = today.isoformat()
    elif "last month" in lower:
        result["date_from"] = (today - timedelta(days=30)).isoformat()
        result["date_to"] = today.isoformat()
    elif "today" in lower:
        result["date_from"] = today.isoformat()
        result["date_to"] = today.isoformat()
    
    # Try to detect explicit dates like "May 25" or "25 May" or "2026-05-25"
    iso_match = re.search(r'\d{4}-\d{2}-\d{2}', text)
    if iso_match:
        result["date_from"] = iso_match.group()
        result["date_to"] = iso_match.group()
    
    return result

def classify_intent(state: NewsAgentState) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "chat", "topic": "", "queries": [], "date_from": "", "date_to": ""}
    
    last_message = messages[-1].content
    today_str = datetime.utcnow().date().isoformat()
    agent_type = state.get("agent_type", "general").capitalize()
    
    llm = get_llm()
    if not llm:
        # Keyword-based parsing fallback for development without API key
        intent = "chat"
        topic = ""
        queries = []
        lower_msg = last_message.lower().strip()
        
        # Simple heuristics
        search_words = ["news", "latest", "headlines", "search", "article", "find", "show", "tell", "what"]
        preference_words = ["preference", "interest", "category", "languages", "topics", "settings"]
        
        if any(w in lower_msg for w in preference_words):
            intent = "preference"
        elif any(w in lower_msg for w in search_words) or len(lower_msg.split()) > 2:
            intent = "search"
            # Extract topic by removing noise words
            stop_words = {"show", "me", "news", "latest", "about", "the", "on", "in", "for",
                          "search", "find", "today", "what", "is", "are", "tell", "give",
                          "yesterday", "last", "week", "month", "from", "of", "please", "can", "you"}
            words = [w for w in lower_msg.split() if w not in stop_words]
            topic = " ".join(words).strip() if words else "global headlines"
            queries = [topic] if topic else ["global headlines"]
        
        # Parse dates from message
        dates = _parse_relative_date(last_message)
            
        return {
            "intent": intent,
            "topic": topic,
            "queries": queries,
            "date_from": dates.get("date_from", ""),
            "date_to": dates.get("date_to", "")
        }

    system_prompt = (
        f"You are the intent classifier for a {agent_type} News AI Assistant. Today's date is {today_str}.\n"
        "Analyze the user's latest query and extract structured information.\n\n"
        "Categorize their intent as one of:\n"
        " - 'search': User wants to fetch or read news about a particular topic/region/event.\n"
        " - 'preference': User is attempting to customize interests, preferred topics, or categories.\n"
        " - 'chat': User is asking non-news questions, saying hi, or making general conversation.\n\n"
        "For 'search' intent, extract:\n"
        " - 'topic': The main subject the user is interested in (e.g. 'cricket', 'AI in healthcare', 'Indian elections')\n"
        " - 'queries': 1-3 optimal keywords/phrases for NewsAPI search\n"
        " - 'date_from': If the user mentions a specific date or time range (e.g. 'yesterday', 'last week', 'May 25th'), "
        f"convert it to an ISO date string (YYYY-MM-DD) relative to today ({today_str}). Empty string if not specified.\n"
        " - 'date_to': End date of the range in ISO format. Empty string if not specified.\n\n"
        "Return ONLY a clean JSON object. No preambles, no explanation, no markdown blocks. Example:\n"
        '{"intent": "search", "topic": "AI in Healthcare", "queries": ["AI healthcare", "artificial intelligence medicine"], '
        '"date_from": "2026-05-25", "date_to": "2026-05-30"}'
    )

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=last_message)
        ])
        
        content = response.content.strip()
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.split("```")[0].strip()

        data = json.loads(content)
        return {
            "intent": data.get("intent", "chat"),
            "topic": data.get("topic", ""),
            "queries": data.get("queries", []),
            "date_from": data.get("date_from", ""),
            "date_to": data.get("date_to", "")
        }
    except Exception as e:
        print(f"Error classifying intent with LLM: {e}")
        return {"intent": "chat", "topic": "", "queries": [], "date_from": "", "date_to": ""}
