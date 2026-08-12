with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if any(k in line for k in ['/api/', 'gestantes.json', 'ninos.json', 'filters.json', 'fetch']):
        print(f"Line {i}: {line.strip()[:100]}")
