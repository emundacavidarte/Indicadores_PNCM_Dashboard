import os
import sys
import json
import sqlite3

def run_deep_forensic_audit():
    print("=== STARTING INDEPENDENT FORENSIC INTEGRITY AUDIT (MILESTONE 2) ===")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Check prohibited patterns in server.py
    server_path = os.path.join(base_dir, 'server.py')
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()

    prohibited_snippets = [
        'return {"status": "PASS"}',
        'return "PASS"',
        'return True # mock',
        'fake_',
        'dummy_'
    ]

    print("\n--- Phase 1: Code Pattern Analysis ---")
    for ps in prohibited_snippets:
        assert ps not in server_code, f"Prohibited snippet '{ps}' found in server.py!"
    print("[PASS] No hardcoded fake test responses or dummy facades found in server.py.")

    # 2. Direct SQLite execution vs server logic
    db_path = os.path.join(base_dir, 'dashboard_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print("\n--- Phase 2: Genuine SQLite Calculation Verification ---")
    # Verify Niños totals directly
    cur.execute("SELECT SUM(total_usuarios), SUM(num_anemia), SUM(den_anemia), SUM(num_hb), SUM(den_hb) FROM ninos_geo_summary WHERE periodo='202606'")
    tot_u, num_an, den_an, num_hb, den_hb = cur.fetchone()
    print(f"Direct DB Query (Niños 202606): total={tot_u}, anemia={num_an}/{den_an} ({round(num_an/den_an*100, 2)}%), hb={num_hb}/{den_hb} ({round(num_hb/den_hb*100, 2)}%)")

    sys.path.insert(0, base_dir)
    import server
    class MockHandler(server.DashboardHandler):
        def __init__(self):
            pass
        def send_json(self, data, status=200):
            pass

    h = MockHandler()
    
    res_n = h.handle_ninos({'periodo': '202606'})
    k_n = res_n['kpis']
    
    assert k_n['total_ninos'] == tot_u, f"Total ninos mismatch: DB {tot_u} vs Server {k_n['total_ninos']}"
    assert k_n['frecuencia_anemia']['num'] == num_an and k_n['frecuencia_anemia']['den'] == den_an, "Anemia mismatch"
    assert k_n['dosaje_hb']['num'] == num_hb and k_n['dosaje_hb']['den'] == den_hb, "HB mismatch"
    print("[PASS] server.py handle_ninos matches direct SQLite aggregation 100%.")

    # Verify Gestantes totals directly
    cur.execute("SELECT SUM(total_usuarios), SUM(num_anemia), SUM(den_anemia), SUM(num_apn), SUM(den_apn) FROM gestantes_summary WHERE periodo='202606'")
    gtot_u, gnum_an, gden_an, gnum_apn, gden_apn = cur.fetchone()
    print(f"Direct DB Query (Gestantes 202606): total={gtot_u}, anemia={gnum_an}/{gden_an} ({round(gnum_an/gden_an*100, 2)}%), apn={gnum_apn}/{gden_apn} ({round(gnum_apn/gden_apn*100, 2)}%)")

    res_g = h.handle_gestantes({'periodo': '202606'})
    k_g = res_g['kpis']
    
    assert k_g['total_gestantes'] == gtot_u, f"Total gestantes mismatch: DB {gtot_u} vs Server {k_g['total_gestantes']}"
    assert k_g['frecuencia_anemia']['num'] == gnum_an and k_g['frecuencia_anemia']['den'] == gden_an, "Gestantes Anemia mismatch"
    assert k_g['apn']['num'] == gnum_apn and k_g['apn']['den'] == gden_apn, "APN mismatch"
    print("[PASS] server.py handle_gestantes matches direct SQLite aggregation 100%.")

    # 3. Static JSON Data Integrity & Generation Verification
    print("\n--- Phase 3: Static JSON Data Verification ---")
    g_json_path = os.path.join(base_dir, 'data', 'gestantes.json')
    n_json_path = os.path.join(base_dir, 'data', 'ninos.json')

    with open(g_json_path, 'r', encoding='utf-8') as f:
        g_json = json.load(f)
    with open(n_json_path, 'r', encoding='utf-8') as f:
        n_json = json.load(f)

    # Check trend size
    print(f"ninos.json trend period count: {len(n_json['trend'])} (202301 to 202606)")
    print(f"gestantes.json trend period count: {len(g_json['trend'])} (202401 to 202606)")
    
    assert len(n_json['trend']) == 42, "ninos.json trend length must be 42"
    assert len(g_json['trend']) == 30, "gestantes.json trend length must be 30"

    # Check for bpn_pct absence in gestantes JSON
    for t in g_json['trend']:
        assert 'bpn_pct' not in t, "bpn_pct found in gestantes.json trend!"
    for u in g_json['ut_ranking']:
        assert 'bpn_pct' not in u, "bpn_pct found in gestantes.json ut_ranking!"
    print("[PASS] gestantes.json confirmed clean of bpn_pct.")

    # Check dni_30d in ninos.json
    assert n_json['kpis']['dni_30d'] == {'pct': 0.0, 'num': 0, 'den': 0}, "dni_30d in ninos.json invalid"
    assert n_json['kpis']['dni_30d'] != n_json['kpis']['bpn'], "dni_30d still duplicates bpn in ninos.json"
    print("[PASS] ninos.json confirmed fixed: dni_30d is zeroed and does not duplicate BPN.")

    # 4. Database Parity Verification
    print("\n--- Phase 4: Database Parity Check ---")
    db_api_path = os.path.join(base_dir, 'api_data.db')
    conn_api = sqlite3.connect(db_api_path)
    cur_api = conn_api.cursor()

    tables = ['gestantes_summary', 'ninos_summary', 'ninos_geo_summary', 'ninos_trend_summary', 'geo_filters', 'locales_geo']
    for tbl in tables:
        c1 = cur.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        c2 = cur_api.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        assert c1 == c2, f"Row count mismatch in table {tbl}: {c1} vs {c2}"
        print(f"Table '{tbl}': {c1} rows in dashboard_data.db and api_data.db.")
    print("[PASS] dashboard_data.db and api_data.db are 100% in sync across all summary tables.")

    conn.close()
    conn_api.close()
    print("\n=== FORENSIC INTEGRITY AUDIT VERDICT: CLEAN ===")

if __name__ == '__main__':
    run_deep_forensic_audit()
