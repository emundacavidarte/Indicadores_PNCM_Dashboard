with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
matches = [m.start() for m in re.finditer(r'\.kpi-card|\.grid-6col|\.grid-4col|\.grid-2col', css)]
print('Matches count:', len(matches))
for m in matches[:10]:
    print('---')
    print(css[m-20:m+250].replace('\n', ' '))
