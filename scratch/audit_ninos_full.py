import sqlite3
import openpyxl
import json
import time

excel_path = "INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx"
db_path = "dashboard_data.db"

start_time = time.time()

print("==========================================================")
print("1. INSPECT EXCEL 'Tabla' SHEET COLUMNS & SAMPLE")
print("==========================================================")

wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
ws = wb["Tabla"]

header = []
sample_row = []
for idx, row in enumerate(ws.iter_rows(values_only=True), 1):
    if idx == 1:
        header = list(row)
    elif idx == 2:
        sample_row = list(row)
        break

wb.close()

print(f"Total columns in Tabla: {len(header)}")
for i, (col, val) in enumerate(zip(header, sample_row), 1):
    print(f"  Col {i:2d}: {col} | Sample: {val}")

print("\n==========================================================")
print("2. INSPECT SQLITE DB TABLES SCHEMA & COLUMNS")
print("==========================================================")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['ninos', 'ninos_summary', 'ninos_geo_summary', 'ninos_trend_summary']
db_schemas = {}

for tbl in tables:
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{tbl}'")
    if cursor.fetchone():
        cursor.execute(f"PRAGMA table_info({tbl})")
        cols = cursor.fetchall()
        col_names = [c[1] for c in cols]
        db_schemas[tbl] = col_names
        cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
        cnt = cursor.fetchone()[0]
        print(f"\nTable '{tbl}': {cnt:,} rows, {len(col_names)} columns")
        print(f"  Columns: {col_names}")
    else:
        print(f"\nTable '{tbl}' DOES NOT EXIST in database.")

print("\n==========================================================")
print("3. COMPARE COLUMNS: Excel 'Tabla' vs SQLite 'ninos'")
print("==========================================================")

excel_cols = [c for c in header if c is not None]
ninos_cols = db_schemas.get('ninos', [])

in_excel_not_ninos = set(excel_cols) - set(ninos_cols)
in_ninos_not_excel = set(ninos_cols) - set(excel_cols)

print(f"Columns in Excel 'Tabla' but NOT in SQLite 'ninos': {in_excel_not_ninos}")
print(f"Columns in SQLite 'ninos' but NOT in Excel 'Tabla': {in_ninos_not_excel}")

print("\n==========================================================")
print("4. PERIOD COVERAGE & DISTINCT VALUES")
print("==========================================================")

cursor.execute("SELECT DISTINCT periodo FROM ninos ORDER BY periodo")
periods = [r[0] for r in cursor.fetchall()]
print(f"Periods in DB 'ninos' ({len(periods)}): {periods}")

cursor.execute("SELECT DISTINCT servicio FROM ninos")
servicios = [r[0] for r in cursor.fetchall()]
print(f"Servicios in DB 'ninos': {servicios}")

cursor.execute("SELECT DISTINCT grupo_edad FROM ninos")
grupos_edad = [r[0] for r in cursor.fetchall()]
print(f"Grupo edad in DB 'ninos': {grupos_edad}")

if 'grupo_edad_oficial' in ninos_cols:
    cursor.execute("SELECT DISTINCT grupo_edad_oficial FROM ninos")
    grupos_edad_oficial = [r[0] for r in cursor.fetchall()]
    print(f"Grupo edad oficial in DB 'ninos': {grupos_edad_oficial}")

conn.close()
print(f"\nCompleted in {time.time() - start_time:.2f} seconds")
