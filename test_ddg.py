import httpx
resp = httpx.get('https://html.duckduckgo.com/html/?q=breaking+news+today&df=d&kl=wt-wt', headers={'User-Agent': 'Mozilla/5.0'})
print('class="result__a"' in resp.text)
print('result__a' in resp.text)
