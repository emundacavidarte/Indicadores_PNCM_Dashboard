import sqlite3

db_path = "dashboard_data.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("==========================================================")
print("1. LOCAL_NOMBRE MISSING BY SERVICIO (SCD vs SAF)")
print("==========================================================")

cursor.execute("""
    SELECT servicio, 
           COUNT(*) as total_rows,
           SUM(CASE WHEN local_nombre IS NULL OR local_nombre = '' OR TRIM(local_nombre) = '' THEN 1 ELSE 0 END) as missing_local_nombre,
           SUM(CASE WHEN local_nombre IS NOT NULL AND local_nombre != '' AND TRIM(local_nombre) != '' THEN 1 ELSE 0 END) as present_local_nombre
    FROM ninos
    GROUP BY servicio
""")

for r in cursor.fetchall():
    print(f"Servicio {r[0]}: Total rows = {r[1]:,d} | Missing local_nombre = {r[2]:,d} ({r[2]/r[1]*100:.1f}%) | Present = {r[3]:,d} ({r[3]/r[1]*100:.1f}%)")

print("\n==========================================================")
print("2. ROWS & USERS BY SERVICIO AND AGE GROUP")
print("==========================================================")

cursor.execute("""
    SELECT servicio, grupo_edad, COUNT(*), SUM(total_usuarios)
    FROM ninos
    GROUP BY servicio, grupo_edad
    ORDER BY servicio, grupo_edad
""")

for r in cursor.fetchall():
    print(f"Servicio {r[0]:<4} | Grupo Edad {r[1]:<15} | Rows: {r[2]:<8,d} | Total Usuarios: {r[3]:<10,d}")

print("\n==========================================================")
print("3. SEARCH FOR DNI / REGISTER INDICATORS ACROSS ALL TABLES & SCHEMAS")
print("==========================================================")

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]

for tbl in tables:
    cursor.execute(f"PRAGMA table_info({tbl})")
    cols = [c[1] for c in cursor.fetchall()]
    dni_cols = [c for c in cols if 'dni' in c.lower() or '30' in c.lower() or 'nac' in c.lower() or 'ident' in c.lower()]
    if dni_cols:
        print(f"Table '{tbl}' has DNI/registration columns: {dni_cols}")

conn.close()
