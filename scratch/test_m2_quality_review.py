import json
import sqlite3
import urllib.parse
import os
import sys

# Import DashboardHandler from server.py
sys.path.insert(0, os.path.abspath('.'))
import server

def run_tests():
    print("==================================================")
    print("MILESTONE 2 REVIEW & VERIFICATION SUITE")
    print("==================================================")
    
    # 1. VERIFY STATIC JSON VALIDITY & ACCURACY FOR PERIOD 202606
    print("\n--- 1. Testing Static JSON Files (ninos.json & gestantes.json) ---")
    conn = sqlite3.connect('dashboard_data.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Check ninos.json
    with open('data/ninos.json', 'r', encoding='utf-8') as f:
        n_data = json.load(f)
    print("[PASS] ninos.json is valid JSON.")
    
    # DB 202606 ninos
    c.execute('''
        SELECT 
            SUM(total_usuarios) as total_usuarios,
            SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
            SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
            SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
            SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
            SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
            SUM(num_vac_completa) as num_vac_completa, SUM(den_vac_completa) as den_vac_completa,
            SUM(num_anemia_fe) as num_anemia_fe, SUM(den_anemia_fe) as den_anemia_fe,
            SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
            SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn,
            SUM(num_npr) as num_npr, SUM(den_npr) as den_npr
        FROM ninos_geo_summary
        WHERE periodo = '202606'
    ''')
    n_row = c.fetchone()
    
    # Verify ninos KPIs match DB
    n_kpis = n_data['kpis']
    assert n_kpis['total_ninos'] == n_row['total_usuarios'], "total_ninos mismatch!"
    assert n_kpis['dosaje_hb']['num'] == n_row['num_hb'], "dosaje_hb num mismatch!"
    assert n_kpis['dosaje_hb']['den'] == n_row['den_hb'], "dosaje_hb den mismatch!"
    assert n_kpis['frecuencia_anemia']['num'] == n_row['num_anemia'], "frecuencia_anemia num mismatch!"
    assert n_kpis['frecuencia_anemia']['den'] == n_row['den_anemia'], "frecuencia_anemia den mismatch!"
    print("[PASS] ninos.json KPIs numerically match SQLite DB (period 202606).")
    
    # Check gestantes.json
    with open('data/gestantes.json', 'r', encoding='utf-8') as f:
        g_data = json.load(f)
    print("[PASS] gestantes.json is valid JSON.")
    
    c.execute('''
        SELECT 
            SUM(total_usuarios) as total_usuarios,
            SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
            SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
            SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
            SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
            SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
            SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins
        FROM gestantes_summary
        WHERE periodo = '202606'
    ''')
    g_row = c.fetchone()
    
    g_kpis = g_data['kpis']
    assert g_kpis['total_gestantes'] == g_row['total_usuarios'], "total_gestantes mismatch!"
    assert g_kpis['frecuencia_anemia']['num'] == g_row['num_anemia'], "frecuencia_anemia num mismatch!"
    assert g_kpis['frecuencia_anemia']['den'] == g_row['den_anemia'], "frecuencia_anemia den mismatch!"
    print("[PASS] gestantes.json KPIs numerically match SQLite DB (period 202606).")

    # 2. CHECK API HANDLERS IN SERVER.PY
    print("\n--- 2. Auditing server.py Handlers ---")
    
    # Instantiate handler mock class
    class MockRequest:
        def makefile(self, *args, **kwargs):
            return None
    
    # Check LRU cache behavior
    print("\n[Audit Item 2.1] LRU Cache Implementation:")
    if hasattr(server, 'MAX_CACHE_SIZE') and hasattr(server, 'RESPONSE_CACHE'):
        print(f"  MAX_CACHE_SIZE defined as: {server.MAX_CACHE_SIZE}")
        print(f"  RESPONSE_CACHE type: {type(server.RESPONSE_CACHE)}")
        # Inspect code to see if len check / eviction exists
        with open('server.py', 'r', encoding='utf-8') as f:
            code = f.read()
        if 'len(RESPONSE_CACHE)' in code or 'popitem' in code or 'del RESPONSE_CACHE' in code:
            print("  [PASS] Cache eviction logic detected.")
        else:
            print("  [FAIL - CRITICAL INTEGRITY VIOLATION] Cache facade detected: MAX_CACHE_SIZE is declared but RESPONSE_CACHE is an unbounded dictionary without eviction logic!")

    # Check OPTIONS / CORS Support
    print("\n[Audit Item 2.2] CORS Preflight Support (do_OPTIONS):")
    if hasattr(server.DashboardHandler, 'do_OPTIONS'):
        print("  [PASS] do_OPTIONS handler implemented.")
    else:
        print("  [FAIL - MAJOR] do_OPTIONS handler missing! Browsers sending CORS preflight requests will receive HTTP 501 Unsupported Method.")

    # Check Exception Handling in do_GET / Handlers
    print("\n[Audit Item 2.3] Exception Handling in API Handlers:")
    with open('server.py', 'r', encoding='utf-8') as f:
        code = f.read()
    if 'try:' in code and ('except Exception' in code or 'except sqlite3' in code):
        # check if do_GET or handlers have try/except
        if 'try:' in code[code.find('def handle_ninos'):code.find('def handle_map')]:
            print("  [PASS] Exception handling present in handle_ninos.")
        else:
            print("  [FAIL - MEDIUM] Missing try...except error handling inside handle_ninos, handle_gestantes, handle_filters.")
    else:
        print("  [FAIL - MEDIUM] Missing exception handling in API handlers.")

    # Check Coverage Capping in Trend, Ranking, Gestantes
    print("\n[Audit Item 2.4] Coverage Capping (100% cap):")
    # Test handle_ninos capping in trend & ranking
    # We create a dummy handler instance
    class DummyServer:
        pass
    handler = server.DashboardHandler.__new__(server.DashboardHandler)
    
    # Mock send_json to capture response
    captured = {}
    def mock_send_json(data, status=200):
        captured['data'] = data
        captured['status'] = status
    handler.send_json = mock_send_json

    # Test handle_ninos with default params
    res_ninos = handler.handle_ninos({'periodo': '202606'})
    trend_item = res_ninos['trend'][0]
    print(f"  Sample trend item keys: {list(trend_item.keys())}")
    
    # Check if handle_ninos trend uses capping
    # Let's inspect server.py source for trend / ut_ranking call to pct
    with open('server.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    trend_uncapped = False
    for i, l in enumerate(lines):
        if 'trend.append({' in l:
            # inspect next 15 lines
            block = "".join(lines[i:i+15])
            if 'pct(' in block and 'True' not in block:
                trend_uncapped = True
                break
    
    if trend_uncapped:
        print("  [FAIL - MAJOR] Coverage Capping missing in handle_ninos trend & ut_ranking! Call to pct() does not pass is_coverage=True.")
    else:
        print("  [PASS] Coverage Capping applied to trend.")

    # Check Actividades when service filter is active
    print("\n[Audit Item 2.5] Strategic Activities Filter Interaction:")
    res_scd = handler.handle_ninos({'periodo': '202606', 'servicio': 'SCD'})
    act_scd = res_scd['kpis']['actividades']
    print(f"  When servicio='SCD': act_415 (SCD)={act_scd['act_415']['cobertura']}, act_412 (SAF)={act_scd['act_412']['cobertura']}")
    if act_scd['act_412']['cobertura'] == 0:
        print("  [FAIL - MAJOR] Strategic Activities bug confirmed: filtering by servicio='SCD' zeroes out SAF activity cobertura (act_412) due to conflicting SQL WHERE clauses (servicio='SCD' AND servicio='SAF')!")
    else:
        print("  [PASS] Strategic Activities handles service filter correctly.")

    print("\n==================================================")
    print("VERIFICATION SUITE COMPLETE")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
