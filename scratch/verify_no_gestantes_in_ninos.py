with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

pos_ninos = html.find('<section id="tabNinos"')
pos_ninos_end = html.find('</section>', pos_ninos)

ninos_section = html[pos_ninos:pos_ninos_end]

if 'gestantes_anemia' in ninos_section or 'Anemia Gestantes' in ninos_section:
    print('WARNING: gestantes_anemia still found in #tabNinos in index.html!')
else:
    print('VERIFIED: No gestantes_anemia in #tabNinos in index.html.')

with open('borrador_presentacion_dashboard.html', 'r', encoding='utf-8') as f:
    draft = f.read()

pos_draft_ninos = draft.find('<section id="tabNinos"')
pos_draft_ninos_end = draft.find('</section>', pos_draft_ninos)

draft_ninos_section = draft[pos_draft_ninos:pos_draft_ninos_end]

if 'gestantes_anemia' in draft_ninos_section or 'Anemia Gestantes' in draft_ninos_section:
    print('WARNING: gestantes_anemia still found in #tabNinos in borrador_presentacion_dashboard.html!')
else:
    print('VERIFIED: No gestantes_anemia in #tabNinos in borrador_presentacion_dashboard.html.')
