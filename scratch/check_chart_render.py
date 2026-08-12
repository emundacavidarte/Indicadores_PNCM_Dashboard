import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

matches = [m.start() for m in re.finditer(r'renderGestantesCharts|renderNinosCharts|Chart\(|renderChart', code)]
print('Matches count:', len(matches))
for m in matches[:10]:
    print('---')
    print(code[m-50:m+250].replace('\n', ' '))
