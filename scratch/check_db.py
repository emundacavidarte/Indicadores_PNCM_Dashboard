import sqlite3

for db_name in ['dashboard_data.db', 'api_data.db']:
    try:
        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"=== {db_name} TABLES ===")
        for t in tables:
            tname = t[0]
            cursor.execute(f"PRAGMA table_info('{tname}')")
            cols = [c[1] for c in cursor.fetchall()]
            print(f"Table: {tname} -> Columns ({len(cols)}): {cols}")
    except Exception as e:
        print(f"Error reading {db_name}: {e}")
