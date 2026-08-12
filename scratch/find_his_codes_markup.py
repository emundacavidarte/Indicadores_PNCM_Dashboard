import re

for fname in ['index.html', 'app.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        code = f.read()
    
    matches = [m.start() for m in re.finditer(r'Códigos HIS MINSA|fHisCodes', code, re.IGNORECASE)]
    print(f"=== {fname} matches count: {len(matches)} ===")
    for m in matches:
        print(code[m-50:m+250].replace('\n', ' '))
