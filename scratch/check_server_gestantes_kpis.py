with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

pos_g = code.find('def handle_gestantes')
print(code[pos_g:pos_g+1200])
