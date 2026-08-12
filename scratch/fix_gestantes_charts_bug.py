import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix renderGestantesTrendChart
old_g_trend = """function renderGestantesTrendChart(trend) {
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesTrendTitle').innerHTML = `<i class="fa-solid fa-chart-line"></i> ${config.title}`;
    document.getElementById('chartGestantesTrendSubtitle').textContent = config.subtitle;

    const ctx = document.getElementById('chartGestantesTrend').getContext('2d');
    if (chartGestantesTrendInst) chartGestantesTrendInst.destroy();

    const labels = targetTrend.map(t => t.label);
    const metricData = targetTrend.map(t => t[config.field] !== undefined ? t[config.field] : 0);"""

new_g_trend = """function renderGestantesTrendChart(trend) {
    if (!trend || !Array.isArray(trend)) return;
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesTrendTitle').innerHTML = `<i class="fa-solid fa-chart-line"></i> ${config.title}`;
    document.getElementById('chartGestantesTrendSubtitle').textContent = config.subtitle;

    const ctx = document.getElementById('chartGestantesTrend').getContext('2d');
    if (chartGestantesTrendInst) chartGestantesTrendInst.destroy();

    const labels = trend.map(t => t.label);
    const metricData = trend.map(t => t[config.field] !== undefined ? t[config.field] : 0);"""

code = code.replace(old_g_trend, new_g_trend)

# Fix renderGestantesUTChart
old_g_ut = """function renderGestantesUTChart(ranking) {
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesUTTitle').innerHTML = `<i class="fa-solid fa-chart-column"></i> Ranking por UT: ${config.label}`;
    document.getElementById('chartGestantesUTSubtitle').textContent = `Desglose comparativo por Unidad Territorial (${config.label})`;

    const ctx = document.getElementById('chartGestantesUT').getContext('2d');
    if (chartGestantesUTInst) chartGestantesUTInst.destroy();

    const topRanking = targetRanking.slice(0, 10);
    const labels = topRanking.map(r => r.ut);
    const metricData = topRanking.map(r => r[config.field] !== undefined ? r[config.field] : 0);"""

new_g_ut = """function renderGestantesUTChart(ranking) {
    if (!ranking || !Array.isArray(ranking)) return;
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesUTTitle').innerHTML = `<i class="fa-solid fa-chart-column"></i> Ranking por UT: ${config.label}`;
    document.getElementById('chartGestantesUTSubtitle').textContent = `Desglose comparativo por Unidad Territorial (${config.label})`;

    const ctx = document.getElementById('chartGestantesUT').getContext('2d');
    if (chartGestantesUTInst) chartGestantesUTInst.destroy();

    const topRanking = ranking.slice(0, 10);
    const labels = topRanking.map(r => r.ut);
    const metricData = topRanking.map(r => r[config.field] !== undefined ? r[config.field] : 0);"""

code = code.replace(old_g_ut, new_g_ut)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed renderGestantesTrendChart and renderGestantesUTChart in app.js.")
