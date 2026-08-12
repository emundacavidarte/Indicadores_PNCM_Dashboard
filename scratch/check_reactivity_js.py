with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re
pos_start = code.find('function updateKpiCardsVisibilityByAge')
print(code[pos_start:pos_start+1500])
