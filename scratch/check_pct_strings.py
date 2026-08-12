import re

for fname in ['app.js', 'index.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        code = f.read()
    
    matches = [m.start() for m in re.finditer(r'% de|title:\s*\'%|title:\s*"%', code)]
    print(f"=== {fname} matches count: {len(matches)} ===")
    for m in matches:
        print(code[m-20:m+120].replace('\n', ' '))
