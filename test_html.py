import re

with open('ddg.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Original regex
pattern1 = r'class="result__title">.*?<a[^>]*>([^<]{10,120})</a>'
print('Original regex matches:')
print(re.findall(pattern1, html, re.IGNORECASE | re.DOTALL)[:5])

# New regex checking result__a
pattern2 = r'class="result__a"[^>]*>([^<]+)</a>'
print('\nNew regex matches:')
print(re.findall(pattern2, html, re.IGNORECASE | re.DOTALL)[:5])

# Snippet regex
pattern3 = r'class="result__snippet"[^>]*>([^<]+)</a>'
print('\nSnippet regex matches:')
print(re.findall(pattern3, html, re.IGNORECASE | re.DOTALL)[:5])
