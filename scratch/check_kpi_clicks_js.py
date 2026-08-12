with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'Gestantes KPI cards click' in line or 'Niños KPI cards click' in line or 'openFichaTecnicaModal' in line:
        print(f"Line {idx+1}:")
        print(''.join(lines[max(0, idx-5):min(len(lines), idx+30)]))
