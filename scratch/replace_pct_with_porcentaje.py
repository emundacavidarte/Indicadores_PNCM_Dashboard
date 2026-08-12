import re

# 1. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    code_js = f.read()

# Replace '% de ' with 'Porcentaje de ' in FICHAS_TECNICAS_DB titles
new_code_js = re.sub(r"title:\s*'% de ", "title: 'Porcentaje de ", code_js)
new_code_js = re.sub(r'title:\s*"% de ', 'title: "Porcentaje de ', new_code_js)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_code_js)

# 2. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    code_html = f.read()

new_code_html = re.sub(r'%\s+de\s+', 'Porcentaje de ', code_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_code_html)

print("Replacement complete.")
