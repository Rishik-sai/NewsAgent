from config import settings

TOP_DOMAINS = "bbc.co.uk,bbc.com,cnn.com,nytimes.com,theguardian.com,reuters.com,apnews.com,washingtonpost.com,bloomberg.com,wsj.com,cnbc.com,forbes.com,techcrunch.com,theverge.com,wired.com,ndtv.com,timesofindia.indiatimes.com,thehindu.com,indianexpress.com,hindustantimes.com"

def _get_newsapi_client():
    """Returns a NewsApiClient if a valid key is configured, else None."""
    if not settings.NEWS_API_KEY or settings.NEWS_API_KEY == "your_newsapi_key_here":
        return None
    try:
        from newsapi import NewsApiClient
        return NewsApiClient(api_key=settings.NEWS_API_KEY)
    except ImportError:
        return None

def _ddgs_fallback(query: str, max_results: int = 10):
    """Fallback: fetch news via DuckDuckGo search."""
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        results = ddgs.news(query, max_results=max_results)
        articles = []
        for r in results:
            articles.append({
                "title": r.get("title"),
                "url": r.get("url"),
                "description": r.get("body"),
                "source": {"name": r.get("source")},
                "publishedAt": r.get("date")
            })
        return articles
    except Exception as e:
        print(f"DDGS fallback also failed: {e}")
        return []

def fetch_top_headlines(query: str = None, category: str = None, country: str = "us"):
    client = _get_newsapi_client()
    if client:
        try:
            params = {}
            if query:
                params["q"] = query
            if category:
                params["category"] = category
            if not category and not query:
                params["country"] = country
            response = client.get_top_headlines(**params)
            articles = response.get("articles", [])
            if articles:
                return articles
        except Exception as e:
            print(f"NewsAPI top_headlines error: {e}")
    
    # Fallback to DuckDuckGo
    search_query = query or category or "world news"
    return _ddgs_fallback(search_query, max_results=10)

def fetch_everything(query: str, language: str = "en", date_from: str = "", date_to: str = "", restrict_domains: bool = True):
    """
    Fetch news articles. Uses NewsAPI as primary source, falls back to DuckDuckGo.
    """
    client = _get_newsapi_client()
    if client:
        try:
            params = {
                "q": query,
                "language": language,
                "page_size": 15,
                "sort_by": "relevancy"
            }
            if restrict_domains:
                params["domains"] = TOP_DOMAINS
            if date_from:
                params["from_param"] = date_from
            if date_to:
                params["to"] = date_to
            response = client.get_everything(**params)
            articles = response.get("articles", [])
            if articles:
                return articles
        except Exception as e:
            print(f"NewsAPI everything error: {e}")
    
    # Fallback to DuckDuckGo
    return _ddgs_fallback(query or "latest news", max_results=15)
