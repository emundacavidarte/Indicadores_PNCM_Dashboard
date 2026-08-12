import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

start = code.find('const FICHAS_TECNICAS_DB = {')
end = code.find('};', start)
block = code[start:end]

keys = re.findall(r"'([a-zA-Z0-9_]+)':\s*\{", block)
print("FICHAS_TECNICAS_DB keys:", keys)

for k in keys:
    sub_start = block.find(f"'{k}':")
    sub_end = block.find("},", sub_start)
    if sub_end == -1:
        sub_end = len(block)
    print(f"\n--- KEY: {k} ---")
    print(block[sub_start:sub_end+2])
