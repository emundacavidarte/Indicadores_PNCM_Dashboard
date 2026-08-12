import sqlite3

conn = sqlite3.connect('dashboard_data.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(ninos_summary)")
cols = cursor.fetchall()
print("Columns in ninos_summary:")
for c in cols:
    print(c[1], c[2])

cursor.execute("SELECT num_bpn, den_bpn, num_pqt, den_pqt FROM ninos_summary LIMIT 5")
print("Sample rows:", cursor.fetchall())
