with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Add dni_30d to FICHAS_TECNICAS_DB if not present
if "'dni_30d':" not in code:
    old_db_anchor = "const FICHAS_TECNICAS_DB = {"
    new_db_anchor = """const FICHAS_TECNICAS_DB = {
    'dni_30d': {
        code: 'CÓDIGO 29 (INDICADOR 9)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Anexo 1 Fichas Técnicas Tablero de Control DGSE-MIDIS (Cód. 29) • Padrón Nominal / RENIEC',
        title: 'Porcentaje de niñas y niños usuarios del PNCM menores de 12 meses de edad con DNI emitido hasta los 30 días de nacido',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM menores de 12 meses de edad con Documento Nacional de Identidad (DNI) emitido hasta los 30 días de nacido.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM menores de 12 meses de edad con DNI emitido hasta los 30 días de nacido.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM menores de 12 meses de edad.',
        his_codes: ['RENIEC / Padrón Nominal: Fecha Emisión DNI - Fecha Nacimiento <= 30 días']
    },"""
    code = code.replace(old_db_anchor, new_db_anchor)

# Add dni_30d to NINOS_KPI_CONFIG
if "'dni_30d':" not in code or "'bpn':" not in code:
    old_cfg_anchor = "const NINOS_KPI_CONFIG = {"
    new_cfg_anchor = """const NINOS_KPI_CONFIG = {
    'dni_30d': {
        title: 'DNI Emitido hasta 30 días de nacido (Ind. 9 - Cód. 29) - Evolución Histórica',
        subtitle: 'Porcentaje de niños menores de 12 meses con DNI emitido dentro de los 30 días posteriores al nacimiento',
        field: 'bpn_pct',
        label: 'DNI Emitido (<=30d) (%)',
        color: '#6B21A8',
        isPct: true
    },
    'bpn': {
        title: 'DNI Emitido hasta 30 días de nacido (Ind. 9 - Cód. 29) - Evolución Histórica',
        subtitle: 'Porcentaje de niños menores de 12 meses con DNI emitido dentro de los 30 días posteriores al nacimiento',
        field: 'bpn_pct',
        label: 'DNI Emitido (<=30d) (%)',
        color: '#6B21A8',
        isPct: true
    },"""
    code = code.replace(old_cfg_anchor, new_cfg_anchor)

# Update renderNinosKPIs for DNI in Panel 4
old_render_pqt = """    if (kpis.vac_completa) {
        setEl('nPqtVacCompPct', `${kpis.vac_completa.pct}%`);
        setEl('nPqtVacCompSub', `${kpis.vac_completa.num.toLocaleString()} compl. de ${kpis.vac_completa.den.toLocaleString()} evaluados`);
    }
    if (kpis.cred) {
        setEl('nPqtCredPct', `${kpis.cred.pct}%`);
        setEl('nPqtCredSub', `${kpis.cred.num.toLocaleString()} con CRED de ${kpis.cred.den.toLocaleString()} evaluados (<24m)`);
    }"""

new_render_pqt = """    const dniData = kpis.dni_30d || kpis.bpn;
    if (dniData) {
        setEl('nPqtDniPct', `${dniData.pct}%`);
        setEl('nPqtDniSub', `${dniData.num.toLocaleString()} con DNI <=30d de ${dniData.den.toLocaleString()} evaluados`);
    }
    if (kpis.cred) {
        setEl('nPqtCredPct', `${kpis.cred.pct}%`);
        setEl('nPqtCredSub', `${kpis.cred.num.toLocaleString()} con CRED de ${kpis.cred.den.toLocaleString()} evaluados`);
    }"""

if old_render_pqt in code:
    code = code.replace(old_render_pqt, new_render_pqt)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js successfully.")
