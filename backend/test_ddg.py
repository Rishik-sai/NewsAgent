import httpx
import re

def test():
    url = "https://html.duckduckgo.com/html/?q=news&df=d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    }
    resp = httpx.get(url, headers=headers)
    
    pattern = r'class="result__a"[^>]*>([^<]{10,120})<'
    titles = re.findall(pattern, resp.text)
    
    trending = []
    seen = set()
    stopwords = {'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'says', 'said', 'after', 'over', 'were', 'what', 'when', 'which', 'there', 'their', 'about', 'news', 'report', 'latest', 'today', 'times', 'live', 'channel', 'free', 'online', 'watch', 'updates', 'headlines'}
    
    for title in titles[:20]:
        title = re.sub(r'[^\w\s-]', '', title).strip()
        words = [w for w in title.split() if len(w) > 3 and w.lower() not in stopwords]
        if len(words) >= 2:
            tag = '#' + ''.join(w.capitalize() for w in words[:2]).replace('-', '')
            if tag not in seen:
                seen.add(tag)
                trending.append({
                    "tag": tag,
                    "label": ' '.join(w.capitalize() for w in words[:4])
                })
                
    for t in trending:
        try:
            print(t)
        except Exception:
            pass

test()
