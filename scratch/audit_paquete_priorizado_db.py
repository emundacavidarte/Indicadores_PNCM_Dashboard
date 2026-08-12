import sqlite3

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- NINOS_GEO_SUMMARY COLUMNS ---")
cursor.execute("PRAGMA table_info(ninos_geo_summary);")
cols = cursor.fetchall()
for c in cols:
    print(f" - {c[1]} ({c[2]})")

print("\n--- SAMPLE VALUES FOR 202606 IN NINOS_GEO_SUMMARY ---")
cursor.execute("""
    SELECT 
        SUM(total_usuarios) as total_u,
        SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
        SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
        SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
        SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
        SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
        SUM(num_vac_completa) as num_vac_comp, SUM(den_vac_completa) as den_vac_comp,
        SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt
    FROM ninos_geo_summary
    WHERE periodo = '202606'
""")
r = cursor.fetchone()
print(f"Total Usuarios: {r[0]:,}")
print(f"Dosaje Hb (6-8m): {r[1]:,} / {r[2]:,} ({r[1]/r[2]*100:.2f}%)")
print(f"Anemia (6-35m): {r[3]:,} / {r[4]:,} ({r[3]/r[4]*100:.2f}%)")
print(f"CRED (<24m): {r[5]:,} / {r[6]:,} ({r[5]/r[6]*100:.2f}%)")
print(f"Vacunas VRN (<12m): {r[7]:,} / {r[8]:,} ({r[7]/r[8]*100:.2f}%)")
print(f"Suplementación Hierro: {r[9]:,} / {r[10]:,} ({r[9]/r[10]*100:.2f}%)")
print(f"Vacuna Completa / DNI 30d: {r[11]:,} / {r[12]:,} ({r[11]/r[12]*100:.2f}%)")
print(f"PAQUETE INTEGRADO (Indicador 16): {r[13]:,} / {r[14]:,} ({r[13]/r[14]*100:.2f}%)")

conn.close()
