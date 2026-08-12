import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

def add_btn_to_card(match):
    card_html = match.group(0)
    if 'class="kpi-info-btn"' in card_html:
        return card_html
    # Insert right after <div class="kpi-card ...">
    tag_end = card_html.find('>')
    btn_html = '\n                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>'
    return card_html[:tag_end+1] + btn_html + card_html[tag_end+1:]

# Replace all <div class="kpi-card..."> instances
new_html = re.sub(r'<div\s+class="kpi-card[^">]*"[^>]*>', add_btn_to_card, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Updated index.html successfully.")
