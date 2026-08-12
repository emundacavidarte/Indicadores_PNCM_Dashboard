import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Gestantes Fichas to FICHAS_TECNICAS_DB
gestantes_fichas_block = """    'gestantes_anemia': {
        code: 'CÓDIGO 10 (INDICADOR I.4.3)',
        area: 'MIDIS-PNCM CUNA MÁS',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MIDIS) • Ficha Técnica Cód. 10 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM',
        title: 'Porcentaje de gestantes usuarias del PNCM con anemia',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del PNCM con diagnóstico definitivo de anemia durante el último trimestre de gestación.',
        numerator: 'A = Número de gestantes usuarias del PNCM (SAF) con parto en el período que presentan diagnóstico definitivo de anemia en el último trimestre (código O990, D509, D500, D649 con tipo D).',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_pqt': {
        code: 'CÓDIGO 27 (INDICADOR 7 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        title: 'Porcentaje de gestantes usuarias del SAF que recibieron paquete integrado de servicios priorizados',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del SAF que reciben el paquete integrado de salud: 4 exámenes auxiliares en el 1er trimestre (hemoglobina, VIH, sífilis y examen de orina) + 4 o más atenciones prenatales (APN) con entregas de sulfato ferroso y ácido fólico.',
        numerator: 'A = Número de gestantes usuarias del SAF que recibieron el paquete integrado de servicios priorizados durante el transcurso del embarazo.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_apn': {
        code: 'CÓDIGO 25 (INDICADOR 5 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        title: 'Porcentaje de gestantes usuarias del SAF que recibieron al menos 4 atenciones prenatales con suplemento de hierro y ácido fólico',
        definition: 'Este indicador permite medir el porcentaje de gestantes usuarias del SAF que recibieron al menos 4 atenciones prenatales oportunas con entrega de suplemento de hierro y ácido fólico.',
        numerator: 'A = Número de gestantes usuarias del SAF que recibieron 4 o más APN con entrega de suplemento de hierro y ácido fólico.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_sfaf': {
        code: 'SUPLEMENTACIÓN GESTANTE',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        title: 'Porcentaje de gestantes usuarias del SAF que reciben suplementación con sulfato ferroso y ácido fólico',
        definition: 'Este indicador permite medir el porcentaje de gestantes usuarias del SAF que reciben suplementación preventiva de hierro y ácido fólico durante la gestación.',
        numerator: 'A = Número de gestantes usuarias del SAF que reciben entregas de sulfato ferroso y ácido fólico.',
        denominator: 'B = Número de gestantes usuarias del SAF evaluadas en el período.'
    },
    'g_aux': {
        code: 'EXÁMENES AUXILIARES GESTANTE',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        title: 'Porcentaje de gestantes usuarias del SAF con 4 exámenes auxiliares en el primer trimestre',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del SAF que en el primer trimestre reciben los 4 exámenes auxiliares: dosaje de hemoglobina/hematocrito, tamizaje de sífilis, tamizaje de VIH y examen de orina (o perfil obstétrico).',
        numerator: 'A = Número de gestantes usuarias del SAF que cuentan con los 4 exámenes auxiliares completos en el 1er trimestre.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del SAF.'
    },
    'g_parto_ins': {
        code: 'CÓDIGO 28 (INDICADOR 8 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Base de datos HIS MINSA / CNV (Certificado de Nacido Vivo) • Fichas Técnicas DGSE-MIDIS',
        title: 'Porcentaje de partos institucionales en el último nacimiento de gestantes usuarias del SAF',
        definition: 'Este indicador permite medir el porcentaje de partos institucionales (atendidos en un establecimiento de salud IPRESS) en el último nacimiento de las gestantes usuarias del SAF.',
        numerator: 'A = Número de mujeres con parto institucional (en IPRESS MINSA/Gobierno Regional) que durante su gestación fueron usuarias del SAF.',
        denominator: 'B = Número de mujeres con parto que fueron reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_sin_atencion_his': {
        code: 'BRECHA REGISTRO SALUD GESTANTES',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Cruce Nominal Padrón PNCM (SAF) vs. Base de Datos HIS MINSA',
        title: 'Porcentaje de gestantes usuarias del SAF sin registro de atenciones en la base HIS MINSA',
        definition: 'Este indicador permite medir la proporción de gestantes registradas en el Padrón Nominal del servicio SAF que no cuentan con registros de atenciones de salud en la base HIS MINSA para el período evaluado.',
        numerator: 'A = Número de gestantes usuarias del SAF que no registran atenciones de salud en HIS MINSA.',
        denominator: 'B = Número total de gestantes registradas en el Padrón Nominal del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_total': {
        code: 'PADRÓN NOMINAL SAF',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Padrón Nominal PNCM (Servicio de Acompañamiento a Familias - SAF)',
        title: 'Gestantes usuarias registradas en el Servicio de Acompañamiento a Familias (SAF)',
        definition: 'Este indicador muestra la población total de gestantes usuarias atendidas y registradas activamente en el Padrón Nominal del servicio SAF.',
        numerator: 'A = Total de gestantes usuarias registradas en el Padrón Nominal SAF.',
        denominator: 'B = Padrón Nominal SAF.'
    },"""

# Insert before 'act_414'
pos_act414 = code.find("'act_414':")
if pos_act414 != -1:
    code = code[:pos_act414] + gestantes_fichas_block + "\n    " + code[pos_act414:]

# 2. Update openFichaTecnicaModal to map gestantes keys dynamically
old_open_func_start = code.find('function openFichaTecnicaModal(kpiKey) {')
old_open_func_end = code.find('modal.style.display = \'flex\';', old_open_func_start) + 30

old_open_func = code[old_open_func_start:old_open_func_end]

new_open_func = """function openFichaTecnicaModal(kpiKey) {
    let actualKey = kpiKey;
    if (currentTab === 'tabGestantes') {
        const gestantesKeyMap = {
            'pqt': 'g_pqt',
            'frecuencia_anemia': 'gestantes_anemia',
            'total': 'g_total',
            'sin_atencion_his': 'g_sin_atencion_his',
            'apn': 'g_apn',
            'sfaf': 'g_sfaf',
            'aux': 'g_aux',
            'parto_ins': 'g_parto_ins'
        };
        actualKey = gestantesKeyMap[kpiKey] || kpiKey;
    }

    const ficha = FICHAS_TECNICAS_DB[actualKey] || FICHAS_TECNICAS_DB[kpiKey];
    if (!ficha) return;

    const modal = document.getElementById('modalFichaTecnicaContainer');
    if (!modal) return;

    document.getElementById('fCodeBadge').textContent = ficha.code;
    document.getElementById('fAreaBadge').textContent = ficha.area || 'PNCM / MIDIS';
    document.getElementById('fSourceFooter').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${ficha.source || 'Fuente Oficial: Padrón Nominal PNCM / Base HIS MINSA'}`;
    document.getElementById('fTitle').textContent = ficha.title;
    document.getElementById('fDefinition').textContent = ficha.definition;
    document.getElementById('fNumerator').textContent = ficha.numerator;
    document.getElementById('fDenominator').textContent = ficha.denominator;

    // Direct lookup from data state (lastNinosData / lastGestantesData)
    let kpiData = null;
    if (currentTab === 'tabGestantes' && lastGestantesData && lastGestantesData.kpis) {
        kpiData = lastGestantesData.kpis[kpiKey] || lastGestantesData.kpis[actualKey];
        if (!kpiData && kpiKey === 'total') {
            const tot = lastGestantesData.kpis.total_gestantes || 0;
            kpiData = { pct: 100, num: tot, den: tot };
        }
    } else if (lastNinosData && lastNinosData.kpis) {
        kpiData = lastNinosData.kpis[kpiKey];
    }

    if (kpiData) {
        document.getElementById('fCurrentPct').textContent = `${kpiData.pct}%`;
        document.getElementById('fCurrentNum').textContent = `${(kpiData.num || 0).toLocaleString()} cumplieron`;
        document.getElementById('fCurrentDen').textContent = `${(kpiData.den || 0).toLocaleString()} evaluados`;
    } else {
        const kpiCard = document.querySelector(`.kpi-card[data-kpi="${kpiKey}"]`);
        const kpiValEl = kpiCard ? kpiCard.querySelector('.kpi-value') : null;
        const kpiSubEl = kpiCard ? kpiCard.querySelector('.kpi-sub') : null;
        document.getElementById('fCurrentPct').textContent = kpiValEl ? kpiValEl.textContent : '—';
        document.getElementById('fCurrentNum').textContent = kpiSubEl ? kpiSubEl.textContent : '—';
        document.getElementById('fCurrentDen').textContent = 'Padrón Nominal';
    }

    const codesContainer = document.getElementById('fHisCodes');
    if (codesContainer) {
        codesContainer.innerHTML = '';
    }

    modal.style.display = 'flex';"""

code = code.replace(old_open_func, new_open_func)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js with Gestantes Fichas Técnicas mapping.")
