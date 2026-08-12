with open('styles.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '.kpi-card {' in line:
        print(f"Line {idx+1}:")
        print(''.join(lines[idx:idx+35]))
