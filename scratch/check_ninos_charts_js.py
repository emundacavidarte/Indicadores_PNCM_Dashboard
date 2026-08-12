with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re
pos_n = code.find('function renderNinosTrendChart')
print(code[pos_n:pos_n+1500])
