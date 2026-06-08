from langchain_core.messages import SystemMessage, HumanMessage
from agent.llm import get_llm
from agent.state import NewsAgentState
import json

# Language code to full name mapping for LLM prompts
LANGUAGE_NAMES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "ur": "Urdu",
    "gu": "Gujarati",
    "kn": "Kannada",
    "or": "Odia",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "as": "Assamese",
    "en": "English",
    "en-in": "English",
}

def _map_article(art: dict) -> dict:
    """Map a raw article to the standardized output format."""
    return {
        "headline": art.get("title", "Untitled Article"),
        "source": art.get("source", {}).get("name") if isinstance(art.get("source"), dict) else str(art.get("source") or "News Source"),
        "timestamp": art.get("publishedAt") or "2026-05-30T12:00:00Z",
        "summary": art.get("description") or "No description available.",
        "url": art.get("url", "#")
    }

def translate_news(state: NewsAgentState) -> dict:
    """Translate news articles into the user's preferred language."""
    raw = state.get("raw_articles", [])
    intent = state.get("intent", "chat")
    language = state.get("language", "en-in")
    
    if intent != "search" or not raw:
        return {"translated_articles": []}

    # Map all raw articles to standardized format (take top 8 to keep things manageable)
    mapped = [_map_article(a) for a in raw[:8]]
    
    # If user's language is English, skip translation entirely
    if language in ("en", "en-in", ""):
        return {"translated_articles": mapped}

    lang_name = LANGUAGE_NAMES.get(language, language)
    
    llm = get_llm(temperature=0.3)
    if not llm:
        # Without LLM, return articles untranslated
        return {"translated_articles": mapped}

    # Batch translate all articles in a single LLM call
    articles_for_llm = []
    for idx, art in enumerate(mapped):
        articles_for_llm.append({
            "index": idx,
            "headline": art["headline"],
            "summary": art["summary"]
        })

    system_prompt = (
        f"You are a professional translator. Translate the following news article headlines and summaries into {lang_name}.\n"
        "Keep the translation natural and readable. Do NOT transliterate — use the native script of the language.\n"
        "Return ONLY a valid JSON array with the translated content. Each item must have:\n"
        '  - "index": the original article index number\n'
        '  - "headline": translated headline\n'
        '  - "summary": translated summary\n\n'
        "Return ONLY the JSON array. No markdown, no explanation, no text before or after.\n"
        "Example:\n"
        '[{"index": 0, "headline": "translated headline...", "summary": "translated summary..."}]'
    )

    user_payload = json.dumps(articles_for_llm, ensure_ascii=False)

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_payload)
        ])
        
        content = response.content.strip()
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.split("```")[0].strip()

        translations = json.loads(content)
        
        # Merge translations back into the mapped articles
        translation_map = {t["index"]: t for t in translations}
        for idx, art in enumerate(mapped):
            if idx in translation_map:
                art["headline"] = translation_map[idx].get("headline", art["headline"])
                art["summary"] = translation_map[idx].get("summary", art["summary"])
        
        return {"translated_articles": mapped}
    except Exception as e:
        print(f"Error translating articles with LLM: {e}")
        # Return untranslated articles on error
        return {"translated_articles": mapped}
