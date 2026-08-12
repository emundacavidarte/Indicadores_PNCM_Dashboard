import re

with open('index.html', 'r', encoding='utf-8') as f:
    code = f.read()

pos_start = code.find('<section id="tabGestantes"')
pos_end = code.find('</section>', pos_start)

section = code[pos_start:pos_end]
matches = re.findall(r'data-kpi="([^"]+)"', section)
print('Gestantes tab data-kpi list:', matches)
