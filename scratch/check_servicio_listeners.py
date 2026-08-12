with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'filterServicio|btnLimpiar', code)]
print('Matches count:', len(matches))
for m in matches[:10]:
    print('---')
    print(code[m-30:m+200].replace('\n', ' '))
