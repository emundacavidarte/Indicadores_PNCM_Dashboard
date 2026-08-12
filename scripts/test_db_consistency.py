import os
import sys
import sqlite3

def test_database_consistency():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db1_path = os.path.join(base_dir, 'dashboard_data.db')
    db2_path = os.path.join(base_dir, 'api_data.db')

    conn1 = sqlite3.connect(db1_path)
    conn2 = sqlite3.connect(db2_path)

    tables = ['gestantes_summary', 'ninos_summary', 'ninos_geo_summary', 'ninos_trend_summary', 'geo_filters', 'locales_geo']

    for t in tables:
        # 1. Compare row counts
        cnt1 = conn1.cursor().execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        cnt2 = conn2.cursor().execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        assert cnt1 == cnt2, f"Table {t} row count mismatch: dashboard_data.db={cnt1} vs api_data.db={cnt2}"

        # 2. Compare schema columns
        cols1 = [r[1] for r in conn1.cursor().execute(f"PRAGMA table_info({t})").fetchall()]
        cols2 = [r[1] for r in conn2.cursor().execute(f"PRAGMA table_info({t})").fetchall()]
        assert cols1 == cols2, f"Table {t} schema mismatch between DBs"

        # 3. Compare aggregate sums for numeric columns
        num_cols = [c for c in cols1 if 'num' in c or 'den' in c or 'total' in c]
        if num_cols:
            select_str = ", ".join([f"SUM({c})" for c in num_cols])
            sums1 = conn1.cursor().execute(f"SELECT {select_str} FROM {t}").fetchone()
            sums2 = conn2.cursor().execute(f"SELECT {select_str} FROM {t}").fetchone()
            assert sums1 == sums2, f"Table {t} aggregate sums mismatch: {sums1} vs {sums2}"

        print(f"[PASS] Table '{t}' is 100% consistent between dashboard_data.db and api_data.db ({cnt1} rows, {len(cols1)} columns).")

    conn1.close()
    conn2.close()

if __name__ == '__main__':
    test_database_consistency()
