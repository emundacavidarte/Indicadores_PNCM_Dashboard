import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add let lastUserNinosService = 'Todos'; near top state variables
if 'let lastUserNinosService' not in code:
    code = "let lastUserNinosService = 'Todos';\n" + code

# 2. Update updateTabFilterUI in app.js
old_ninos_tab_block = """    } else if (currentTab === 'tabNinos') {
        // Niños exist in both SAF and SCD
        servicioSelect.disabled = false;
        servicioSelect.classList.remove('locked-select');
        const prevVal = servicioSelect.value;
        
        servicioSelect.innerHTML = `
            <option value="Todos">Todos los Servicios</option>
            <option value="SAF">SAF (Acompañamiento a Familias)</option>
            <option value="SCD">SCD (Cuidado Diurno)</option>
        `;
        if (['Todos', 'SAF', 'SCD'].includes(prevVal)) {
            servicioSelect.value = prevVal;
        } else {
            servicioSelect.value = 'Todos';
        }

        if (localGroup) localGroup.style.display = 'block';
    }"""

new_ninos_tab_block = """    } else if (currentTab === 'tabNinos') {
        // Niños exist in both SAF and SCD
        servicioSelect.disabled = false;
        servicioSelect.classList.remove('locked-select');
        
        servicioSelect.innerHTML = `
            <option value="Todos">Todos los Servicios</option>
            <option value="SAF">SAF (Acompañamiento a Familias)</option>
            <option value="SCD">SCD (Cuidado Diurno)</option>
        `;
        
        // Restore user's explicit service choice for Niños (defaults to 'Todos')
        const restoredService = (lastUserNinosService && ['Todos', 'SAF', 'SCD'].includes(lastUserNinosService)) ? lastUserNinosService : 'Todos';
        servicioSelect.value = restoredService;

        if (localGroup) localGroup.style.display = (restoredService === 'SAF' ? 'none' : 'block');
    }"""

code = code.replace(old_ninos_tab_block, new_ninos_tab_block)

# 3. Update filterServicio listener and btnLimpiar in app.js
old_limpiar = "document.getElementById('filterServicio').value = 'Todos';"
new_limpiar = "lastUserNinosService = 'Todos';\n        document.getElementById('filterServicio').value = 'Todos';"

code = code.replace(old_limpiar, new_limpiar)

old_serv_listener = "if (id === 'filterServicio') applyServiceThemeUI();"
new_serv_listener = """if (id === 'filterServicio') {
                if (currentTab === 'tabNinos') {
                    lastUserNinosService = document.getElementById('filterServicio').value;
                }
                applyServiceThemeUI();
            }"""

code = code.replace(old_serv_listener, new_serv_listener)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js for seamless tab return to Todos.")
