import re

# 1. Update index.html data-kpi attributes in #tabGestantes
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos_start = html.find('<section id="tabGestantes"')
pos_end = html.find('</section>', pos_start)

section = html[pos_start:pos_end]

# Replace data-kpi in section
replacements = {
    'data-kpi="total"': 'data-kpi="g_total"',
    'data-kpi="sin_atencion_his"': 'data-kpi="g_sin_atencion_his"',
    'data-kpi="frecuencia_anemia"': 'data-kpi="gestantes_anemia"',
    'data-kpi="sfaf"': 'data-kpi="g_sfaf"',
    'data-kpi="apn"': 'data-kpi="g_apn"',
    'data-kpi="aux"': 'data-kpi="g_aux"',
    'data-kpi="parto_ins"': 'data-kpi="g_parto_ins"',
    'data-kpi="pqt"': 'data-kpi="g_pqt"'
}

new_section = section
for old_k, new_k in replacements.items():
    new_section = new_section.replace(old_k, new_k)

html = html[:pos_start] + new_section + html[pos_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html Gestantes tab data-kpis.")

# 2. Update app.js GESTANTES_KPI_CONFIG and FICHAS_TECNICAS_DB
with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Update GESTANTES_KPI_CONFIG
pos_cfg = code.find('const GESTANTES_KPI_CONFIG = {')
pos_end_cfg = code.find('};', pos_cfg)

gestantes_cfg = """const GESTANTES_KPI_CONFIG = {
    'total': { title: 'Gestantes Usuarias - Evolución Histórica', subtitle: 'Total de gestantes usuarias en Padrón Nominal (SAF)', field: 'gestantes', label: 'Gestantes Usuarias', color: '#772A91', isPct: false },
    'g_total': { title: 'Gestantes Usuarias - Evolución Histórica', subtitle: 'Total de gestantes usuarias en Padrón Nominal (SAF)', field: 'gestantes', label: 'Gestantes Usuarias', color: '#772A91', isPct: false },
    'sin_atencion_his': { title: 'Gestantes Sin Registro / Atención HIS - Evolución Histórica', subtitle: 'Gestantes usuarias del Padrón Nominal sin registro de atención de salud en el sistema HIS MINSA', field: 'sin_atencion_pct', label: 'Sin Atención HIS (%)', color: '#EA580C', isPct: true },
    'g_sin_atencion_his': { title: 'Gestantes Sin Registro / Atención HIS - Evolución Histórica', subtitle: 'Gestantes usuarias del Padrón Nominal sin registro de atención de salud en el sistema HIS MINSA', field: 'sin_atencion_pct', label: 'Sin Atención HIS (%)', color: '#EA580C', isPct: true },
    'frecuencia_anemia': { title: 'Frecuencia de Anemia en Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia sobre las gestantes con dosaje', field: 'frecuencia_anemia_pct', label: 'Frecuencia Anemia (%)', color: '#E40E20', isPct: true },
    'gestantes_anemia': { title: 'Frecuencia de Anemia en Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia sobre las gestantes con dosaje', field: 'frecuencia_anemia_pct', label: 'Frecuencia Anemia (%)', color: '#E40E20', isPct: true },
    'apn': { title: 'Atención Prenatal (APN) Oportuna - Evolución Histórica', subtitle: 'Porcentaje de gestantes con al menos 4 atenciones prenatales oportunas', field: 'apn_pct', label: 'APN Oportuna (%)', color: '#009FE3', isPct: true },
    'g_apn': { title: 'Atención Prenatal (APN) Oportuna - Evolución Histórica', subtitle: 'Porcentaje de gestantes con al menos 4 atenciones prenatales oportunas', field: 'apn_pct', label: 'APN Oportuna (%)', color: '#009FE3', isPct: true },
    'sfaf': { title: 'Suplementación de Sulfato Ferroso y Ácido Fólico - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben suplementación con sulfato ferroso y ácido fólico', field: 'sfaf_pct', label: 'Suplementación SFAF (%)', color: '#8B5CF6', isPct: true },
    'g_sfaf': { title: 'Suplementación de Sulfato Ferroso y Ácido Fólico - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben suplementación con sulfato ferroso y ácido fólico', field: 'sfaf_pct', label: 'Suplementación SFAF (%)', color: '#8B5CF6', isPct: true },
    'aux': { title: 'Exámenes Auxiliares del 1er y 2do Trimestre - Evolución Histórica', subtitle: 'Porcentaje de gestantes con exámenes auxiliares completos', field: 'aux_pct', label: 'Exámenes Auxiliares (%)', color: '#10B981', isPct: true },
    'g_aux': { title: 'Exámenes Auxiliares del 1er y 2do Trimestre - Evolución Histórica', subtitle: 'Porcentaje de gestantes con exámenes auxiliares completos', field: 'aux_pct', label: 'Exámenes Auxiliares (%)', color: '#10B981', isPct: true },
    'pqt': { title: 'Paquete Integrado de Salud para Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben el paquete integrado de atención en salud', field: 'pqt_pct', label: 'Paquete Integrado (%)', color: '#059669', isPct: true },
    'g_pqt': { title: 'Paquete Integrado de Salud para Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben el paquete integrado de atención en salud', field: 'pqt_pct', label: 'Paquete Integrado (%)', color: '#059669', isPct: true },
    'parto_ins': { title: 'Atención de Parto Institucional - Evolución Histórica', subtitle: 'Porcentaje de gestantes usuarias con atención de parto en establecimiento de salud', field: 'parto_pct', label: 'Parto Institucional (%)', color: '#D97706', isPct: true },
    'g_parto_ins': { title: 'Atención de Parto Institucional - Evolución Histórica', subtitle: 'Porcentaje de gestantes usuarias con atención de parto en establecimiento de salud', field: 'parto_pct', label: 'Parto Institucional (%)', color: '#D97706', isPct: true }
};"""

code = code[:pos_cfg] + gestantes_cfg + code[pos_end_cfg+2:]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js GESTANTES_KPI_CONFIG.")
