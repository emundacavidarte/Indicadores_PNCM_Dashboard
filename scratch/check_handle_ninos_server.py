with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

pos_start = code.find('def handle_ninos')
print(code[pos_start:pos_start+1500])
