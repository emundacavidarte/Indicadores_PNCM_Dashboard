import sqlite3
import os

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- DISTRICT COUNTS IN NINOS_GEO_SUMMARY ---")
cursor.execute("SELECT COUNT(DISTINCT distrito) FROM ninos_geo_summary;")
print("Distinct distritos in ninos_geo_summary:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM ninos_geo_summary;")
print("Distinct ubigeos (Dep-Prov-Dist) in ninos_geo_summary:", cursor.fetchone()[0])

cursor.execute("SELECT servicio, COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM ninos_geo_summary GROUP BY servicio;")
for r in cursor.fetchall():
    print(f"Servicio: {r[0]} | Ubigeos Distritales Distintos: {r[1]}")

print("\n--- DISTRICT COUNTS IN NINOS_SUMMARY ---")
cursor.execute("SELECT COUNT(DISTINCT distrito) FROM ninos_summary;")
print("Distinct distritos in ninos_summary:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM ninos_summary;")
print("Distinct ubigeos (Dep-Prov-Dist) in ninos_summary:", cursor.fetchone()[0])

print("\n--- DISTRICT COUNTS IN GEO_FILTERS ---")
cursor.execute("SELECT COUNT(DISTINCT distrito) FROM geo_filters WHERE distrito IS NOT NULL AND distrito != '';")
print("Distinct distritos in geo_filters:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM geo_filters WHERE distrito IS NOT NULL AND distrito != '';")
print("Distinct ubigeos in geo_filters:", cursor.fetchone()[0])

conn.close()
