import sqlite3
import openpyxl
import time
from collections import defaultdict

excel_path = "INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx"
db_path = "dashboard_data.db"

print("==========================================================")
print("AUDITING EXCEL 'Tabla' vs SQLITE 'ninos'")
print("==========================================================")

# 1. Read SQLite ninos sums by period
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

db_period_sums = defaultdict(lambda: defaultdict(int))
cursor.execute("""
    SELECT periodo, 
           COUNT(*),
           SUM(COALESCE(total_usuarios, 0)),
           SUM(COALESCE(den_hb, 0)), SUM(COALESCE(num_hb, 0)),
           SUM(COALESCE(den_anemia, 0)), SUM(COALESCE(num_anemia, 0)),
           SUM(COALESCE(den_cred, 0)), SUM(COALESCE(num_cred, 0)),
           SUM(COALESCE(den_vrn, 0)), SUM(COALESCE(num_vrn, 0)),
           SUM(COALESCE(den_hierro, 0)), SUM(COALESCE(num_hierro, 0)),
           SUM(COALESCE(den_vac_completa, 0)), SUM(COALESCE(num_vac_completa, 0)),
           SUM(COALESCE(den_anemia_fe, 0)), SUM(COALESCE(num_anemia_fe, 0)),
           SUM(COALESCE(den_pqt, 0)), SUM(COALESCE(num_pqt, 0)),
           SUM(COALESCE(den_bpn, 0)), SUM(COALESCE(num_bpn, 0)),
           SUM(COALESCE(den_npr, 0)), SUM(COALESCE(num_npr, 0))
    FROM ninos
    GROUP BY periodo
    ORDER BY periodo
""")

db_rows = cursor.fetchall()
for r in db_rows:
    p = str(r[0])
    db_period_sums[p]['count'] = r[1]
    db_period_sums[p]['total_usuarios'] = r[2]
    db_period_sums[p]['den_hb'] = r[3]
    db_period_sums[p]['num_hb'] = r[4]
    db_period_sums[p]['den_anemia'] = r[5]
    db_period_sums[p]['num_anemia'] = r[6]
    db_period_sums[p]['den_cred'] = r[7]
    db_period_sums[p]['num_cred'] = r[8]
    db_period_sums[p]['den_vrn'] = r[9]
    db_period_sums[p]['num_vrn'] = r[10]
    db_period_sums[p]['den_hierro'] = r[11]
    db_period_sums[p]['num_hierro'] = r[12]
    db_period_sums[p]['den_vac_completa'] = r[13]
    db_period_sums[p]['num_vac_completa'] = r[14]
    db_period_sums[p]['den_anemia_fe'] = r[15]
    db_period_sums[p]['num_anemia_fe'] = r[16]
    db_period_sums[p]['den_pqt'] = r[17]
    db_period_sums[p]['num_pqt'] = r[18]
    db_period_sums[p]['den_bpn'] = r[19]
    db_period_sums[p]['num_bpn'] = r[20]
    db_period_sums[p]['den_npr'] = r[21]
    db_period_sums[p]['num_npr'] = r[22]

conn.close()

# 2. Read Excel Tabla sums by period
start_excel = time.time()
print("Reading Excel 'Tabla' sheet...")
wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
ws = wb["Tabla"]

excel_period_sums = defaultdict(lambda: defaultdict(int))
# Track additional columns in Excel not in DB
excel_extra_sums = defaultdict(lambda: defaultdict(int))

header = None
for idx, row in enumerate(ws.iter_rows(values_only=True), 1):
    if idx == 1:
        header = list(row)
        col_idx = {name: i for i, name in enumerate(header) if name}
        continue
    
    p = str(row[col_idx['periodo']]) if row[col_idx['periodo']] is not None else ""
    
    def safe_int(v):
        if v is None or v == "": return 0
        try: return int(v)
        except: return 0

    excel_period_sums[p]['count'] += 1
    excel_period_sums[p]['total_usuarios'] += safe_int(row[col_idx['total_usuarios']])
    excel_period_sums[p]['den_hb'] += safe_int(row[col_idx['den_hb']])
    excel_period_sums[p]['num_hb'] += safe_int(row[col_idx['num_hb']])
    excel_period_sums[p]['den_anemia'] += safe_int(row[col_idx['den_anemia']])
    excel_period_sums[p]['num_anemia'] += safe_int(row[col_idx['num_anemia']])
    excel_period_sums[p]['den_cred'] += safe_int(row[col_idx['den_cred']])
    excel_period_sums[p]['num_cred'] += safe_int(row[col_idx['num_cred']])
    excel_period_sums[p]['den_vrn'] += safe_int(row[col_idx['den_vrn']])
    excel_period_sums[p]['num_vrn'] += safe_int(row[col_idx['num_vrn']])
    excel_period_sums[p]['den_hierro'] += safe_int(row[col_idx['den_hierro']])
    excel_period_sums[p]['num_hierro'] += safe_int(row[col_idx['num_hierro']])
    excel_period_sums[p]['den_vac_completa'] += safe_int(row[col_idx['den_vac_completa']])
    excel_period_sums[p]['num_vac_completa'] += safe_int(row[col_idx['num_vac_completa']])
    excel_period_sums[p]['den_anemia_fe'] += safe_int(row[col_idx['den_anemia_fe']])
    excel_period_sums[p]['num_anemia_fe'] += safe_int(row[col_idx['num_anemia_fe']])
    excel_period_sums[p]['den_pqt'] += safe_int(row[col_idx['den_pqt']])
    excel_period_sums[p]['num_pqt'] += safe_int(row[col_idx['num_pqt']])
    excel_period_sums[p]['den_bpn'] += safe_int(row[col_idx['den_bpn']])
    excel_period_sums[p]['num_bpn'] += safe_int(row[col_idx['num_bpn']])
    excel_period_sums[p]['den_npr'] += safe_int(row[col_idx['den_npr']])
    excel_period_sums[p]['num_npr'] += safe_int(row[col_idx['num_npr']])

    # Extra columns
    if 'den_hb_170_250' in col_idx:
        excel_extra_sums[p]['den_hb_170_250'] += safe_int(row[col_idx['den_hb_170_250']])
        excel_extra_sums[p]['num_hb_170_250'] += safe_int(row[col_idx['num_hb_170_250']])
    if 'den_fe_110_130' in col_idx:
        excel_extra_sums[p]['den_fe_110_130'] += safe_int(row[col_idx['den_fe_110_130']])
        excel_extra_sums[p]['num_fe_110_130'] += safe_int(row[col_idx['num_fe_110_130']])

wb.close()
print(f"Read Excel in {time.time() - start_excel:.2f} seconds")

# 3. Compare Excel vs SQLite
all_periods = sorted(list(set(list(db_period_sums.keys()) + list(excel_period_sums.keys()))))

discrepancies = []
keys_to_check = ['count', 'total_usuarios', 'den_hb', 'num_hb', 'den_anemia', 'num_anemia',
                 'den_cred', 'num_cred', 'den_vrn', 'num_vrn', 'den_hierro', 'num_hierro',
                 'den_vac_completa', 'num_vac_completa', 'den_anemia_fe', 'num_anemia_fe',
                 'den_pqt', 'num_pqt', 'den_bpn', 'num_bpn', 'den_npr', 'num_npr']

print(f"\nComparing {len(all_periods)} periods across {len(keys_to_check)} fields...")

for p in all_periods:
    db_p = db_period_sums[p]
    ex_p = excel_period_sums[p]
    
    for k in keys_to_check:
        db_val = db_p[k]
        ex_val = ex_p[k]
        if db_val != ex_val:
            discrepancies.append((p, k, ex_val, db_val, db_val - ex_val))

if discrepancies:
    print(f"\n⚠️ FOUND {len(discrepancies)} DISCREPANCIES BETWEEN EXCEL & DB:")
    for d in discrepancies[:30]: # top 30
        print(f"  Period {d[0]} | Field {d[1]:18s} | Excel: {d[2]:10,d} | DB: {d[3]:10,d} | Diff: {d[4]:+10,d}")
    if len(discrepancies) > 30:
        print(f"  ... and {len(discrepancies) - 30} more discrepancies.")
else:
    print("\n✅ PERFECT MATCH! All row counts and sums for all 22 indicators match 100% between Excel 'Tabla' and SQLite 'ninos' across all periods!")

# Print sample extra columns from Excel
print("\n--- SAMPLE EXTRA COLUMNS IN EXCEL (Not in DB 'ninos') ---")
for p in sorted(excel_extra_sums.keys())[-6:]: # Last 6 periods
    ext = excel_extra_sums[p]
    print(f"Period {p}: den_hb_170_250={ext['den_hb_170_250']:,}, num_hb_170_250={ext['num_hb_170_250']:,} | den_fe_110_130={ext['den_fe_110_130']:,}, num_fe_110_130={ext['num_fe_110_130']:,}")

