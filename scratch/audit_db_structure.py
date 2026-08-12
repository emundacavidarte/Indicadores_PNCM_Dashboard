import sqlite3
import json
import os

db_path = 'dashboard_data.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in dashboard_data.db:", [t[0] for t in tables])

for t in [t[0] for t in tables]:
    cursor.execute(f"PRAGMA table_info({t});")
    cols = cursor.fetchall()
    print(f"\nTable: {t}")
    for c in cols:
        print(f"  {c[1]} ({c[2]})")
    cursor.execute(f"SELECT COUNT(*) FROM {t}")
    count = cursor.fetchone()[0]
    print(f"  Total rows: {count}")

conn.close()
