import re

files_to_search = ['server.py', 'api/index.py', 'app.js', 'index.html']

queries = ['ninos', 'ninos_summary', 'ninos_geo_summary', 'ninos_trend_summary', 'dni', 'bpn', 'npr', 'paquete', 'pqt']

for fpath in files_to_search:
    print(f"\n=================== SEARCH IN {fpath} ===================")
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        lines = content.split('\n')
        for idx, line in enumerate(lines, 1):
            for q in ['ninos_summary', 'ninos_geo_summary', 'ninos_trend_summary', 'den_hb_170_250', 'den_fe_110_130', 'dni', 'den_bpn', 'den_npr']:
                if q.lower() in line.lower():
                    print(f"Line {idx:4d} [{q}]: {line.strip()[:120]}")
    except Exception as e:
        print(f"Error reading {fpath}: {e}")
