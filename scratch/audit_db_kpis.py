import sqlite3
import os

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- AUDITING NINOS_GEO_SUMMARY ---")
cursor.execute("""
    SELECT 
        periodo,
        SUM(total_usuarios) as total_u,
        SUM(num_hb) as n_hb, SUM(den_hb) as d_hb,
        SUM(num_anemia) as n_ane, SUM(den_anemia) as d_ane,
        SUM(num_hierro) as n_h, SUM(den_hierro) as d_h,
        SUM(num_anemia_fe) as n_afe, SUM(den_anemia_fe) as d_afe,
        SUM(num_npr) as n_npr, SUM(den_npr) as d_npr,
        SUM(num_pqt) as n_pqt, SUM(den_pqt) as d_pqt,
        SUM(num_cred) as n_cred, SUM(den_cred) as d_cred,
        SUM(num_vrn) as n_vrn, SUM(den_vrn) as d_vrn,
        SUM(num_vac_completa) as n_vac, SUM(den_vac_completa) as d_vac
    FROM ninos_geo_summary
    GROUP BY periodo
""")
for row in cursor.fetchall():
    print(f"Periodo: {row[0]} | Total: {row[1]} | Hb: {row[2]}/{row[3]} | Ane: {row[4]}/{row[5]} | Hierro: {row[6]}/{row[7]} | AneFE: {row[8]}/{row[9]} | NPR: {row[10]}/{row[11]} | PQT: {row[12]}/{row[13]} | CRED: {row[14]}/{row[15]} | VRN: {row[16]}/{row[17]} | VAC: {row[18]}/{row[19]}")

print("\n--- AUDITING NINOS_SUMMARY ---")
cursor.execute("""
    SELECT 
        periodo,
        SUM(total_usuarios) as total_u,
        SUM(num_hb) as n_hb, SUM(den_hb) as d_hb,
        SUM(num_anemia) as n_ane, SUM(den_anemia) as d_ane,
        SUM(num_hierro) as n_h, SUM(den_hierro) as d_h,
        SUM(num_anemia_fe) as n_afe, SUM(den_anemia_fe) as d_afe,
        SUM(num_npr) as n_npr, SUM(den_npr) as d_npr,
        SUM(num_pqt) as n_pqt, SUM(den_pqt) as d_pqt
    FROM ninos_summary
    GROUP BY periodo
""")
for row in cursor.fetchall():
    print(f"Periodo: {row[0]} | Total: {row[1]} | Hb: {row[2]}/{row[3]} | Ane: {row[4]}/{row[5]} | Hierro: {row[6]}/{row[7]} | AneFE: {row[8]}/{row[9]} | NPR: {row[10]}/{row[11]} | PQT: {row[12]}/{row[13]}")

print("\n--- AUDITING GESTANTES_SUMMARY ---")
cursor.execute("""
    SELECT 
        periodo,
        SUM(total_usuarios) as total_u,
        SUM(num_anemia) as n_ane, SUM(den_anemia) as d_ane
    FROM gestantes_summary
    GROUP BY periodo
""")
for row in cursor.fetchall():
    print(f"Periodo: {row[0]} | Total: {row[1]} | Ane: {row[2]}/{row[3]}")

conn.close()
