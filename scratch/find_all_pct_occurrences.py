import re

with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

print("=== APP.JS '%' matches ===")
for line_no, line in enumerate(app_js.splitlines(), 1):
    if '%' in line and ('title' in line or 'label' in line or 'definition' in line or 'Indicador' in line or 'Ficha' in line):
        print(f"L{line_no}: {line.strip()}")

print("\n=== INDEX.HTML '%' matches in title/label attributes ===")
for line_no, line in enumerate(index_html.splitlines(), 1):
    if '%' in line and ('title=' in line or 'Indicador' in line or 'Ficha' in line):
        print(f"L{line_no}: {line.strip()}")
