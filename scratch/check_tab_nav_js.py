with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

pos_start = code.find('function initTabNavigation')
print(code[pos_start:pos_start+1500])
