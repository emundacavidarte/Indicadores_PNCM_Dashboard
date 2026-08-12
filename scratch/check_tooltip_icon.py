import re

with open('index.html', 'r', encoding='utf-8') as f:
    code = f.read()

matches = [m.start() for m in re.finditer(r'tooltip-icon', code)]
print('index.html tooltip-icon count:', len(matches))
for m in matches[:10]:
    print('---')
    print(code[m-30:m+150].replace('\n', ' '))
