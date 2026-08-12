import re

for filename in ['app.js', 'index.html']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    matches = [m.start() for m in re.finditer(r'openFichaTecnicaModal', code)]
    print(f"=== {filename} matches count: {len(matches)} ===")
    for m in matches:
        print(code[m-50:m+200].replace('\n', ' '))
