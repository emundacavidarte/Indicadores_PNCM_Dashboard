import re

with open('index.html', 'r', encoding='utf-8') as f:
    code = f.read()

kpis = re.findall(r'data-kpi="([^"]+)"', code)
print("Unique data-kpi in index.html:", sorted(list(set(kpis))))
