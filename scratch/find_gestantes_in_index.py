with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'gestantes_anemia' in line or 'Anemia Gestantes' in line:
        print(f"Line {i}: {line.strip()}")
