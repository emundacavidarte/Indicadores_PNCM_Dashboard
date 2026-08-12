import base64
import json
import os

def get_base64_img(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            ext = file_path.split('.')[-1].lower()
            mime = 'image/png' if ext == 'png' else 'image/jpeg'
            return f'data:{mime};base64,{encoded}'
    return ''

root_dir = os.path.dirname(os.path.abspath(__file__))

logo_midis_b64 = get_base64_img(os.path.join(root_dir, 'Logo MIDIS - transparente.png'))
logo_cuidador_b64 = get_base64_img(os.path.join(root_dir, 'Logo Cuidador 360°-04.png'))

with open(os.path.join(root_dir, 'index.html'), 'r', encoding='utf-8') as f:
    html_content = f.read()

with open(os.path.join(root_dir, 'styles.css'), 'r', encoding='utf-8') as f:
    css_content = f.read()

with open(os.path.join(root_dir, 'app.js'), 'r', encoding='utf-8') as f:
    js_content = f.read()

with open(os.path.join(root_dir, 'peru_departamentos.json'), 'r', encoding='utf-8') as f:
    peru_geo = f.read()

with open(os.path.join(root_dir, 'data', 'filters.json'), 'r', encoding='utf-8') as f:
    filters_data = f.read()

with open(os.path.join(root_dir, 'data', 'gestantes.json'), 'r', encoding='utf-8') as f:
    gestantes_data = f.read()

with open(os.path.join(root_dir, 'data', 'ninos.json'), 'r', encoding='utf-8') as f:
    ninos_data = f.read()

with open(os.path.join(root_dir, 'data', 'map.json'), 'r', encoding='utf-8') as f:
    map_data = f.read()

# Replace image paths with embedded Base64 strings
html_content = html_content.replace('src="Logo MIDIS - transparente.png"', f'src="{logo_midis_b64}"')
html_content = html_content.replace('src="Logo Cuidador 360°-04.png"', f'src="{logo_cuidador_b64}"')

# Replace external CSS link with embedded <style>
html_content = html_content.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css_content}\n</style>')

# Replace app.js script tag with embedded script
target_app_js_tag = '<script src="app.js"></script>'
if target_app_js_tag in html_content:
    html_content = html_content.replace(target_app_js_tag, '')

# Embed static JSON datasets as global window objects
embedded_data_script = f'''
<script>
window.EMBEDDED_PERU_GEO = {peru_geo};
window.EMBEDDED_FILTERS_DATA = {filters_data};
window.EMBEDDED_GESTANTES_DATA = {gestantes_data};
window.EMBEDDED_NINOS_DATA = {ninos_data};
window.EMBEDDED_MAP_DATA = {map_data};
</script>
'''

target_peru_geo_fetch = "const res = await fetch('peru_departamentos.json');\n        peruDepartmentsGeoJson = await res.json();"
replacement_peru_geo_fetch = "if (window.EMBEDDED_PERU_GEO) { peruDepartmentsGeoJson = window.EMBEDDED_PERU_GEO; } else { const res = await fetch('peru_departamentos.json'); peruDepartmentsGeoJson = await res.json(); }"

target_filters_fetch = "const res = await fetch('data/filters.json');\n            data = await res.json();"
replacement_filters_fetch = "if (window.EMBEDDED_FILTERS_DATA) { data = window.EMBEDDED_FILTERS_DATA; } else { const res = await fetch('data/filters.json'); data = await res.json(); }"

target_gestantes_fetch = "const res = await fetch('data/gestantes.json');\n            const data = await res.json();"
replacement_gestantes_fetch = "if (window.EMBEDDED_GESTANTES_DATA) { const data = window.EMBEDDED_GESTANTES_DATA; lastGestantesData = data; renderGestantesKPIs(data.kpis); renderGestantesTrendChart(data.trend); renderGestantesUTChart(data.ut_ranking); return; } else { const res = await fetch('data/gestantes.json'); const data = await res.json(); lastGestantesData = data; renderGestantesKPIs(data.kpis); renderGestantesTrendChart(data.trend); renderGestantesUTChart(data.ut_ranking); }"

target_ninos_fetch = "const res = await fetch('data/ninos.json');\n            const data = await res.json();"
replacement_ninos_fetch = "if (window.EMBEDDED_NINOS_DATA) { const data = window.EMBEDDED_NINOS_DATA; ninosDataCache[cacheKey] = data; lastNinosData = data; renderNinosKPIs(data.kpis); renderNinosTrendChart(data.trend); renderNinosUTChart(data.ut_ranking); ninosTableFullData = data.cg_table || []; renderNinosTable(ninosTableFullData); return; } else { const res = await fetch('data/ninos.json'); const data = await res.json(); ninosDataCache[cacheKey] = data; lastNinosData = data; renderNinosKPIs(data.kpis); renderNinosTrendChart(data.trend); renderNinosUTChart(data.ut_ranking); ninosTableFullData = data.cg_table || []; renderNinosTable(ninosTableFullData); }"

target_map_fetch = "const res = await fetch('data/map.json');\n                data = await res.json();"
replacement_map_fetch = "if (window.EMBEDDED_MAP_DATA) { data = window.EMBEDDED_MAP_DATA; } else { const res = await fetch('data/map.json'); data = await res.json(); }"

modified_js = js_content.replace(target_peru_geo_fetch, replacement_peru_geo_fetch)
modified_js = modified_js.replace(target_filters_fetch, replacement_filters_fetch)
modified_js = modified_js.replace(target_gestantes_fetch, replacement_gestantes_fetch)
modified_js = modified_js.replace(target_ninos_fetch, replacement_ninos_fetch)
modified_js = modified_js.replace(target_map_fetch, replacement_map_fetch)

final_html = html_content.replace('</body>', f'{embedded_data_script}\n<script>\n{modified_js}\n</script>\n</body>')

output_path = os.path.join(root_dir, 'borrador_presentacion_dashboard.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f'borrador_presentacion_dashboard.html updated successfully! Size: {os.path.getsize(output_path) / 1024:.2f} KB')
