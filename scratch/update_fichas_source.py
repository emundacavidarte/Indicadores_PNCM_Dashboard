import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Define sources for each key
sources_map = {
    'pqt': ("DGSE-MIDIS", "Fuente Oficial: Decreto Legislativo DIT / FED Indicador 16 • Fichas Técnicas Tablero de Control DGSE-MIDIS"),
    'dosaje_hb': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'frecuencia_anemia': ("MIDIS-PNCM CUNA MÁS", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Ficha Técnica Cód. 13 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM"),
    'hierro': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'anemia_fe': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'vrn': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'vac_completa': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'cred': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'npr': ("MINSA / MIDIS / GL", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Propuesta Metodológica UOAI-PNCM • Base HIS MINSA / Padrón PNCM"),
    'gestantes_anemia': ("MIDIS-PNCM CUNA MÁS", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Ficha Técnica Cód. 10 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM"),
    'sin_atencion_his': ("MONITOREO PNCM", "Fuente Oficial: Cruce Nominal Padrón PNCM vs. Base de Datos HIS MINSA"),
    'apn': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'sfaf': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'aux': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'parto_ins': ("DGSE-MIDIS", "Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM"),
    'act_415': ("PNCM / PLAN MULTISECTORIAL", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Padrón Nominal PNCM (SCD)"),
    'act_413': ("PNCM / PLAN MULTISECTORIAL", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Registro de Capacitaciones PNCM (SCD)"),
    'act_412': ("PNCM / PLAN MULTISECTORIAL", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Padrón Nominal PNCM (SAF)"),
    'act_414': ("PNCM / PLAN MULTISECTORIAL", "Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Registro de Capacitaciones PNCM (SAF)")
}

# Update FICHAS_TECNICAS_DB objects in code
for key, (area, src) in sources_map.items():
    # Replace area and add source
    pattern = rf"('{key}':\s*\{{[\s\S]*?area:\s*')[^']+"
    repl = rf"\1{area}"
    code = re.sub(pattern, repl, code)
    
    # Insert source if not present
    if f"source: '{src}'" not in code:
        pattern_src = rf"('{key}':\s*\{{[\s\S]*?area:\s*'[^']+',)"
        repl_src = rf"\1\n        source: '{src}',"
        code = re.sub(pattern_src, repl_src, code)

# Update openFichaTecnicaModal to set fAreaBadge and fSourceFooter
pos_open = code.find('function openFichaTecnicaModal(kpiKey) {')
pos_end_open = code.find('modal.style.display = \'flex\';', pos_open)

old_modal_chunk = code[pos_open:pos_end_open+30]

new_modal_chunk = old_modal_chunk.replace(
    "document.getElementById('fCodeBadge').textContent = ficha.code;",
    "document.getElementById('fCodeBadge').textContent = ficha.code;\n    document.getElementById('fAreaBadge').textContent = ficha.area || 'PNCM / MIDIS';\n    document.getElementById('fSourceFooter').innerHTML = `<i class=\"fa-solid fa-shield-halved\"></i> ${ficha.source || 'Fuente Oficial: Padrón Nominal PNCM / Base HIS MINSA'}`;"
)

code = code.replace(old_modal_chunk, new_modal_chunk)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js with dynamic area badges and sources.")
