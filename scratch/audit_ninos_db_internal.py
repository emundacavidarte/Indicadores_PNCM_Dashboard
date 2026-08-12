import sqlite3
import json
import time

db_path = "dashboard_data.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("==========================================================")
print("1. AGGREGATE SUMMARY COMPARISON: ninos vs ninos_summary vs ninos_geo_summary")
print("==========================================================")

indicators = [
    'total_usuarios', 'den_hb', 'num_hb', 'den_anemia', 'num_anemia',
    'den_cred', 'num_cred', 'den_vrn', 'num_vrn', 'den_hierro', 'num_hierro',
    'den_vac_completa', 'num_vac_completa', 'den_anemia_fe', 'num_anemia_fe',
    'den_pqt', 'num_pqt', 'den_bpn', 'num_bpn', 'den_npr', 'num_npr'
]

sum_cols = ", ".join([f"SUM(COALESCE({col}, 0))" for col in indicators])

def get_totals(table_name):
    cursor.execute(f"SELECT COUNT(*), {sum_cols} FROM {table_name}")
    row = cursor.fetchone()
    res = {'row_count': row[0]}
    for idx, col in enumerate(indicators, 1):
        res[col] = row[idx]
    return res

totals_ninos = get_totals('ninos')
totals_summary = get_totals('ninos_summary')
totals_geo_summary = get_totals('ninos_geo_summary')

print(f"{'Metric':<20} | {'ninos (raw)':<14} | {'ninos_summary':<14} | {'ninos_geo':<14} | {'Diff (summary-raw)':<18}")
print("-" * 88)
print(f"{'Rows':<20} | {totals_ninos['row_count']:<14,d} | {totals_summary['row_count']:<14,d} | {totals_geo_summary['row_count']:<14,d} | {totals_summary['row_count'] - totals_ninos['row_count']:<+18,d}")

for col in indicators:
    v1 = totals_ninos[col]
    v2 = totals_summary[col]
    v3 = totals_geo_summary[col]
    diff = v2 - v1
    flag = "⚠️ DIFF!" if diff != 0 or v3 != v1 else "OK"
    print(f"{col:<20} | {v1:<14,d} | {v2:<14,d} | {v3:<14,d} | {diff:<+18,d} {flag}")

print("\n==========================================================")
print("2. INDICATOR BREAKDOWN BY AGE GROUP IN 'ninos'")
print("==========================================================")

age_query_cols = ", ".join([f"SUM(COALESCE({col}, 0))" for col in indicators[1:]])
cursor.execute(f"SELECT grupo_edad, COUNT(*), {age_query_cols} FROM ninos GROUP BY grupo_edad ORDER BY grupo_edad")
rows = cursor.fetchall()

print(f"{'Grupo Edad':<16} | {'Rows':<8} | " + " | ".join([f"{col[:6]:>6}" for col in indicators[1:]]))
print("-" * 150)
for r in rows:
    age = r[0]
    cnt = r[1]
    vals = r[2:]
    val_strs = [f"{v:>6,d}" for v in vals]
    print(f"{age:<16} | {cnt:<8,d} | " + " | ".join(val_strs))

print("\n==========================================================")
print("3. MONTHLY TRENDS (202401 to 202606) IN 'ninos'")
print("==========================================================")

cursor.execute("""
    SELECT periodo,
           SUM(COALESCE(total_usuarios, 0)),
           SUM(COALESCE(den_anemia, 0)), SUM(COALESCE(num_anemia, 0)),
           SUM(COALESCE(den_cred, 0)), SUM(COALESCE(num_cred, 0)),
           SUM(COALESCE(den_vrn, 0)), SUM(COALESCE(num_vrn, 0)),
           SUM(COALESCE(den_hierro, 0)), SUM(COALESCE(num_hierro, 0)),
           SUM(COALESCE(den_pqt, 0)), SUM(COALESCE(num_pqt, 0))
    FROM ninos
    WHERE periodo >= '202401'
    GROUP BY periodo
    ORDER BY periodo
""")

monthly_rows = cursor.fetchall()
print(f"{'Periodo':<8} | {'Usuarios':<9} | {'Den Anemia':<10} | {'Num Anemia':<10} | {'% Anemia':<8} | {'Den CRED':<9} | {'Num CRED':<9} | {'% CRED':<7} | {'Den PQT':<8} | {'Num PQT':<8} | {'% PQT':<7}")
print("-" * 115)

for r in monthly_rows:
    p = r[0]
    u = r[1]
    d_an = r[2]; n_an = r[3]
    pct_an = (n_an / d_an * 100) if d_an > 0 else 0
    d_cr = r[4]; n_cr = r[5]
    pct_cr = (n_cr / d_cr * 100) if d_cr > 0 else 0
    d_pqt = r[10]; n_pqt = r[11]
    pct_pqt = (n_pqt / d_pqt * 100) if d_pqt > 0 else 0
    
    print(f"{p:<8} | {u:<9,d} | {d_an:<10,d} | {n_an:<10,d} | {pct_an:<8.2f}% | {d_cr:<9,d} | {n_cr:<9,d} | {pct_cr:<7.2f}% | {d_pqt:<8,d} | {n_pqt:<8,d} | {pct_pqt:<7.2f}%")

print("\n==========================================================")
print("4. GEOGRAPHIC LEVEL INTEGRITY & NULL CHECKS IN 'ninos'")
print("==========================================================")

geo_cols = ['unidad_territorial', 'departamento', 'provincia', 'ubigeo', 'distrito', 'servicio', 'cod_cg', 'comite_gestion', 'local_id', 'local_nombre']

for gc in geo_cols:
    cursor.execute(f"SELECT COUNT(*) FROM ninos WHERE {gc} IS NULL OR {gc} = '' OR TRIM({gc}) = ''")
    null_cnt = cursor.fetchone()[0]
    cursor.execute(f"SELECT COUNT(DISTINCT {gc}) FROM ninos")
    dist_cnt = cursor.fetchone()[0]
    print(f"Column '{gc:<18}': Distinct values = {dist_cnt:<6,d} | Missing/Null/Blank = {null_cnt:<6,d}")

conn.close()
