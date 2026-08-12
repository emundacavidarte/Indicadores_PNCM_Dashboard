import sqlite3

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- TABLES IN DATABASE ---")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(tables)

print("\n--- MONTHLY COBERTURA BY SERVICE (ninos_summary / ninos_geo_summary) FOR 202606 ---")
cursor.execute("""
    SELECT 
        servicio,
        SUM(total_usuarios) as total_usuarios,
        SUM(den_hb) as evaluados_hb
    FROM ninos_geo_summary
    WHERE periodo = '202606'
    GROUP BY servicio
""")
for row in cursor.fetchall():
    print(f"Servicio: {row[0]} | Total Usuarios (202606): {row[1]:,} | Evaluados HB: {row[2]:,}")

print("\n--- TOTAL DISTRICTS IN LOCALES_GEO ---")
cursor.execute("SELECT COUNT(DISTINCT distrito) FROM locales_geo;")
print("Distritos distintos en locales_geo:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(DISTINCT departamento || '-' || provincia || '-' || distrito) FROM locales_geo;")
print("Ubigeos (Dep-Prov-Dist) distintos en locales_geo:", cursor.fetchone()[0])

conn.close()
