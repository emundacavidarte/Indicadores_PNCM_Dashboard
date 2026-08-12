import re

with open('index.html', 'r', encoding='utf-8') as f:
    code = f.read()

matches = [m.start() for m in re.finditer(r'class="kpi-card', code)]
print('Found KPI cards count:', len(matches))
for m in matches[:10]:
    print('---')
    print(code[m:m+300].replace('\n', ' '))
