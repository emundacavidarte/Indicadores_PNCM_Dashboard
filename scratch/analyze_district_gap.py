import sqlite3
import json

db_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
    SELECT departamento, COUNT(DISTINCT distrito) as dist_atendidos
    FROM locales_geo
    GROUP BY departamento
    ORDER BY dist_atendidos DESC
""")
dep_dist = cursor.fetchall()
print("DISTRITOS ATENDIDOS POR DEPARTAMENTO:")
for d in dep_dist:
    print(f" - {d[0]}: {d[1]} distritos atendidos")

conn.close()
