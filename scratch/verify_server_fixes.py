import os
import sys
import sqlite3
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server

class MockHandler(server.DashboardHandler):
    def __init__(self):
        pass
    def send_json(self, data, status=200):
        pass

def verify_fixes():
    h = MockHandler()
    
    print("--- 1. Testing handle_gestantes ---")
    g_res = h.handle_gestantes({})
    assert 'bpn_pct' not in g_res['trend'][0], "bpn_pct still present in gestantes trend!"
    assert 'bpn_pct' not in g_res['ut_ranking'][0], "bpn_pct still present in gestantes ut_ranking!"
    print("[PASS] handle_gestantes cleaned: bpn_pct removed from trend and ut_ranking.")
    print("Gestantes trend period count:", len(g_res['trend']))
    print("Gestantes trend range:", g_res['trend'][0]['periodo'], "to", g_res['trend'][-1]['periodo'])

    print("\n--- 2. Testing handle_ninos ---")
    n_res = h.handle_ninos({})
    assert n_res['kpis']['dni_30d'] == {'pct': 0.0, 'num': 0, 'den': 0}, f"Unexpected dni_30d: {n_res['kpis']['dni_30d']}"
    assert n_res['kpis']['dni_30d'] != n_res['kpis']['bpn'], "dni_30d still duplicates bpn!"
    print("[PASS] handle_ninos fixed: dni_30d does NOT duplicate bpn.")
    print("Niños trend period count:", len(n_res['trend']))
    print("Niños trend range:", n_res['trend'][0]['periodo'], "to", n_res['trend'][-1]['periodo'])

    print("\n--- 3. Testing handle_filters ---")
    f_res = h.handle_filters({'tab': 'tabNinos'})
    assert len(f_res['departamentos']) > 1, "Departamentos list empty in filters"
    assert len(f_res['uts']) > 1, "UTs list empty in filters"
    print("[PASS] handle_filters executed successfully with ninos_geo_summary optimization.")

if __name__ == '__main__':
    verify_fixes()
