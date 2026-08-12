with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

pos_cfg = code.find('const GESTANTES_KPI_CONFIG =')
print('--- GESTANTES_KPI_CONFIG ---')
print(code[pos_cfg:pos_cfg+1200])

pos_trend = code.find('function renderGestantesTrendChart')
print('--- renderGestantesTrendChart ---')
print(code[pos_trend:pos_trend+1000])

pos_ut = code.find('function renderGestantesUTChart')
print('--- renderGestantesUTChart ---')
print(code[pos_ut:pos_ut+1000])
