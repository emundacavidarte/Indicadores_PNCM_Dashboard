import sqlite3

def check_api_db():
    print("=== API_DATA.DB TABLES ===")
    conn = sqlite3.connect('api_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables:", tables)

    for t in tables:
        if t == 'sqlite_sequence': continue
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        print(f"Table {t}: {cnt} rows")
    conn.close()

check_api_db()
