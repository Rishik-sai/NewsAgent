from agent.state import NewsAgentState
from agent.tools.news_api import fetch_top_headlines, fetch_everything

def fetch_news(state: NewsAgentState) -> dict:
    queries = state.get("queries", [])
    intent = state.get("intent", "chat")
    date_from = state.get("date_from", "")
    date_to = state.get("date_to", "")
    topic = state.get("topic", "")
    agent_type = state.get("agent_type", "general")
    
    if intent != "search" or not queries:
        return {"raw_articles": []}
        
    # Focus queries based on agent_type
    if agent_type.lower() != "general":
        enriched_queries = []
        for q in queries:
            if agent_type.lower() not in q.lower():
                enriched_queries.append(f"{q} {agent_type}")
            else:
                enriched_queries.append(q)
        queries = enriched_queries
        
    all_articles = []
    seen_urls = set()
    
    for query in queries:
        # Fetch from /everything with date filters
        fetched = fetch_everything(query=query, date_from=date_from, date_to=date_to)
        
        # Also merge top headlines for broader coverage
        headlines = fetch_top_headlines(query=query)
        fetched.extend(headlines)
        
        for art in fetched:
            url = art.get("url")
            title = art.get("title", "")
            # De-duplicate articles by URL and filter out removed/null articles
            if url and url not in seen_urls and "[Removed]" not in title:
                seen_urls.add(url)
                all_articles.append({
                    "title": art.get("title"),
                    "url": url,
                    "description": art.get("description") or art.get("content") or "",
                    "source": art.get("source") or {"name": "News"},
                    "publishedAt": art.get("publishedAt")
                })
    
    # If we have fewer than 5 articles, try a broader fallback query
    if len(all_articles) < 5:
        fallback_query = topic if topic else "World News"
        fallback_articles = fetch_everything(query=fallback_query)
        for art in fallback_articles:
            url = art.get("url")
            title = art.get("title", "")
            if url and url not in seen_urls and "[Removed]" not in title:
                seen_urls.add(url)
                all_articles.append({
                    "title": art.get("title"),
                    "url": url,
                    "description": art.get("description") or art.get("content") or "",
                    "source": art.get("source") or {"name": "News"},
                    "publishedAt": art.get("publishedAt")
                })
            if len(all_articles) >= 5:
                break

    return {"raw_articles": all_articles}
