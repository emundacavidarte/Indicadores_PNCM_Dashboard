with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'fHisCodes' in line or 'Códigos HIS MINSA' in line:
        print(f"Line {idx+1}:")
        print(''.join(lines[max(0, idx-10):min(len(lines), idx+15)]))
