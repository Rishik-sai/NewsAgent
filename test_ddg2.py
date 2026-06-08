import httpx
resp = httpx.get('https://html.duckduckgo.com/html/?q=breaking+news+today&df=d&kl=wt-wt', headers={'User-Agent': 'Mozilla/5.0'})
with open('ddg.html', 'w', encoding='utf-8') as f:
    f.write(resp.text)
