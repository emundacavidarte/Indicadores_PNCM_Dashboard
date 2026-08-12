import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

matches = [m.start() for m in re.finditer(r'kpi-card|\.kpi-card|openFichaTecnicaModal', code)]
print('Matches count:', len(matches))
for m in matches:
    print('---')
    print(code[m-50:m+250].replace('\n', ' '))
