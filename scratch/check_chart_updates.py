with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re
pos_g = code.find('function updateGestantesCharts')
pos_n = code.find('function updateNinosCharts')

print("=== GESTANTES CHARTS FUNCTION ===")
print(code[pos_g:pos_g+1000])

print("\n=== NINOS CHARTS FUNCTION ===")
print(code[pos_n:pos_n+1000])
