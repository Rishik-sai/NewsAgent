import re
import httpx
import sys

sys.stdout.reconfigure(encoding='utf-8')

html = httpx.get('https://html.duckduckgo.com/html/?q=breaking+news+today&df=d&kl=in-en', headers={'User-Agent': 'Mozilla/5.0'}).text
pattern = r'class="result__title">.*?<a[^>]*>([^<]{10,120})</a>'
titles = re.findall(pattern, html, re.IGNORECASE | re.DOTALL)

print(f"Regex found {len(titles)} titles")

seen = set()
trending = []
stopwords = {'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'says', 'said', 'after', 'over', 'were', 'what', 'when', 'which', 'there', 'their', 'about', 'news', 'report', 'latest', 'today', 'times', 'live', 'channel', 'free', 'online', 'watch', 'updates', 'headlines', 'breaking', 'world', 'service'}

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
    if len(trending) >= 6:
        break

print(trending)
