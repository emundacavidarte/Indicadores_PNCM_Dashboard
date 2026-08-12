import sqlite3
import os

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- LOCALE COUNT BY DEPARTAMENTO IN LOCALES_GEO ---")
cursor.execute("""
    SELECT departamento, COUNT(DISTINCT distrito) as distritos, COUNT(*) as locales
    FROM locales_geo
    GROUP BY departamento
    ORDER BY distritos DESC
""")
for r in cursor.fetchall():
    print(f"Dep: {r[0]} | Distritos: {r[1]} | Locales: {r[2]}")

cursor.execute("SELECT COUNT(DISTINCT distrito), COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM locales_geo;")
tot_dist = cursor.fetchone()
print(f"\nTOTAL DISTRITOS ATENDIDOS EN LOCALES_GEO: {tot_dist[0]} (Ubigeos distintos: {tot_dist[1]})")

conn.close()
