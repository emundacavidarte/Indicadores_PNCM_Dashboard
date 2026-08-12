import sqlite3

conn = sqlite3.connect('dashboard_data.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=== 1. GESTANTES SUMMARY (202606) ===")
cursor.execute("""
    SELECT 
        SUM(total_usuarios) as total_usuarios,
        SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
        SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
        SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
        SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
        SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
        SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins
    FROM gestantes_summary
    WHERE periodo = '202606'
""")
row = cursor.fetchone()
for k in row.keys():
    print(f"  {k}: {row[k]}")

print("\n=== 2. NIÑOS SUMMARY (202606) ===")
cursor.execute("""
    SELECT 
        SUM(total_usuarios) as total_usuarios,
        SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
        SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
        SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
        SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
        SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
        SUM(num_vac_completa) as num_vac_completa, SUM(den_vac_completa) as den_vac_completa,
        SUM(num_anemia_fe) as num_anemia_fe, SUM(den_anemia_fe) as den_anemia_fe,
        SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
        SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn,
        SUM(num_npr) as num_npr, SUM(den_npr) as den_npr
    FROM ninos_summary
    WHERE periodo = '202606'
""")
r2 = cursor.fetchone()
for k in r2.keys():
    print(f"  {k}: {r2[k]}")
