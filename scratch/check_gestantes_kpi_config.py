with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

pos_start = code.find('const GESTANTES_KPI_CONFIG =')
pos_end = code.find('};', pos_start)

print(code[pos_start:pos_end+2])
