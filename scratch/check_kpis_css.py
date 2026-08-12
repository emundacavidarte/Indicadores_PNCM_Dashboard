import re

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

matches = [m.start() for m in re.finditer(r'\.kpi-card', css)]
print('CSS Matches count:', len(matches))
for m in matches[:10]:
    print('---')
    print(css[m:m+300].replace('\n', ' '))
