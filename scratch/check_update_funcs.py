import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

matches = [m.start() for m in re.finditer(r'function update', code)]
print('Matches count:', len(matches))
for m in matches:
    print('---')
    print(code[m:m+200].replace('\n', ' '))
