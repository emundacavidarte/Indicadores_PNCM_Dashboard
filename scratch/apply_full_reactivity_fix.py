import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add gestantes_anemia to NINOS_KPI_CONFIG
if "'gestantes_anemia':" not in code[code.find('const NINOS_KPI_CONFIG ='):code.find('};', code.find('const NINOS_KPI_CONFIG ='))]:
    pos_cfg_end = code.find('};', code.find('const NINOS_KPI_CONFIG ='))
    gestantes_ninos_config = """,
    'gestantes_anemia': {
        title: 'Frecuencia de Anemia en Gestantes (SAF) - Evolución Histórica',
        subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia',
        field: 'frecuencia_anemia_pct',
        label: 'Anemia Gestantes (%)',
        color: '#772A91',
        isPct: true
    }"""
    code = code[:pos_cfg_end] + gestantes_ninos_config + "\n" + code[pos_cfg_end:]

# 2. Update updateKpiCardsVisibilityByAge
old_vis_func_start = code.find('function updateKpiCardsVisibilityByAge() {')
old_vis_func_end = code.find('function initAgeFilterEvents() {', old_vis_func_start)

new_vis_func = """function updateKpiCardsVisibilityByAge() {
    const age = currentAgeGroup;
    const servicioSelect = document.getElementById('filterServicio');
    const selectedService = servicioSelect ? servicioSelect.value : 'Todos';

    const kpiAgeRules = {
        'frecuencia_anemia': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'dosaje_hb': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'hierro': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'anemia_fe': ['Todos', '[06-11] Meses'],
        'vrn': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_completa': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'cred': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'pqt': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'npr': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses'],
        'gestantes_anemia': ['Todos']
    };

    const cards = document.querySelectorAll('#tabNinos .kpi-card');
    let activeCardStillVisible = false;
    let firstVisibleCardKey = null;

    cards.forEach(card => {
        const kpiKey = card.dataset.kpi;
        if (!kpiKey) return;

        let visible = true;

        // Age rule check
        const allowedAges = kpiAgeRules[kpiKey];
        if (allowedAges && !allowedAges.includes(age)) {
            visible = false;
        }

        // Service rule check
        if (selectedService === 'SCD') {
            if (['gestantes_anemia', 'act_412', 'act_414'].includes(kpiKey)) {
                visible = false;
            }
        } else if (selectedService === 'SAF') {
            if (['act_415', 'act_413'].includes(kpiKey)) {
                visible = false;
            }
        }

        if (visible) {
            card.style.display = '';
            if (!firstVisibleCardKey) firstVisibleCardKey = kpiKey;
            if (card.classList.contains('active-kpi')) {
                activeCardStillVisible = true;
            }
        } else {
            card.style.display = 'none';
            card.classList.remove('active-kpi');
        }
    });

    // Auto fallback active card if current active card was hidden
    if (!activeCardStillVisible && firstVisibleCardKey) {
        selectedNinosKpiKey = firstVisibleCardKey;
        const targetCard = document.querySelector(`#tabNinos .kpi-card[data-kpi="${firstVisibleCardKey}"]`);
        if (targetCard) targetCard.classList.add('active-kpi');
        if (lastNinosData) {
            renderNinosTrendChart(lastNinosData.trend);
            renderNinosUTChart(lastNinosData.ut_ranking);
        }
    }
}

"""

code = code[:old_vis_func_start] + new_vis_func + code[old_vis_func_end:]

# 3. Update renderNinosTrendChart & renderNinosUTChart for gestantes_anemia fallback
old_trend_chart_head = "function renderNinosTrendChart(trend) {\n    const config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];"
new_trend_chart_head = """function renderNinosTrendChart(trend) {
    let targetTrend = trend;
    let config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];

    if (selectedNinosKpiKey === 'gestantes_anemia' && lastGestantesData && lastGestantesData.trend) {
        targetTrend = lastGestantesData.trend;
    }"""

code = code.replace("const labels = trend.map(t => t.label);", "const labels = targetTrend.map(t => t.label);")
code = code.replace("const metricData = trend.map(t => t[config.field] !== undefined ? t[config.field] : 0);", "const metricData = targetTrend.map(t => t[config.field] !== undefined ? t[config.field] : 0);")
code = code.replace(old_trend_chart_head, new_trend_chart_head)

old_ut_chart_head = "function renderNinosUTChart(ranking) {\n    const config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];"
new_ut_chart_head = """function renderNinosUTChart(ranking) {
    let targetRanking = ranking;
    let config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];

    if (selectedNinosKpiKey === 'gestantes_anemia' && lastGestantesData && lastGestantesData.ut_ranking) {
        targetRanking = lastGestantesData.ut_ranking;
    }"""

code = code.replace("const topRanking = ranking.slice(0, 10);", "const topRanking = targetRanking.slice(0, 10);")
code = code.replace(old_ut_chart_head, new_ut_chart_head)

# 4. Call updateKpiCardsVisibilityByAge in fetchNinosData
code = code.replace("renderNinosKPIs(data.kpis);", "renderNinosKPIs(data.kpis);\n        updateKpiCardsVisibilityByAge();")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied full reactivity and card visibility fix in app.js.")
