with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add dni_30d alias to kpis
old_kpi_bpn = "'bpn': {'pct': pct(row['num_bpn'], row['den_bpn'], True), 'num': row['num_bpn'] or 0, 'den': row['den_bpn'] or 0},"
new_kpi_bpn = """'bpn': {'pct': pct(row['num_bpn'], row['den_bpn'], True), 'num': row['num_bpn'] or 0, 'den': row['den_bpn'] or 0},
            'dni_30d': {'pct': pct(row['num_bpn'], row['den_bpn'], True), 'num': row['num_bpn'] or 0, 'den': row['den_bpn'] or 0},"""

if old_kpi_bpn in code:
    code = code.replace(old_kpi_bpn, new_kpi_bpn)

# Add SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn to trend query if missing
old_trend_query = "SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt"
new_trend_query = "SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt, SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn"

if old_trend_query in code:
    code = code.replace(old_trend_query, new_trend_query)

# Add bpn_pct to trend dict
old_trend_dict = "'pqt_pct': pct(tr['num_pqt'], tr['den_pqt'])"
new_trend_dict = "'pqt_pct': pct(tr['num_pqt'], tr['den_pqt']),\n                'bpn_pct': pct(tr['num_bpn'], tr['den_bpn'])"

if old_trend_dict in code:
    code = code.replace(old_trend_dict, new_trend_dict)

# Add bpn_pct to ut_ranking dict
old_ut_dict = "'pqt_pct': pct(ur['num_pqt'], ur['den_pqt'])"
new_ut_dict = "'pqt_pct': pct(ur['num_pqt'], ur['den_pqt']),\n                'bpn_pct': pct(ur['num_bpn'], ur['den_bpn'])"

if old_ut_dict in code:
    code = code.replace(old_ut_dict, new_ut_dict)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated server.py successfully.")
