import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server

class MockHandler(server.DashboardHandler):
    def __init__(self):
        self.last_json = None
        self.last_status = None
    def send_json(self, data, status=200):
        self.last_json = data
        self.last_status = status

def test_api_endpoints():
    h = MockHandler()

    print("=== TEST 1: /api/gestantes ===")
    g1 = h.handle_gestantes({})
    assert 'kpis' in g1 and 'trend' in g1 and 'ut_ranking' in g1, "Missing keys in /api/gestantes"
    assert 'bpn_pct' not in g1['trend'][0], "bpn_pct in gestantes trend"
    assert 'bpn_pct' not in g1['ut_ranking'][0], "bpn_pct in gestantes ut_ranking"
    print(f"[PASS] /api/gestantes default: {g1['kpis']['total_gestantes']} total gestantes, {len(g1['trend'])} trend periods.")

    print("\n=== TEST 2: /api/gestantes with UT filter ===")
    g2 = h.handle_gestantes({'ut': 'AMAZONAS'})
    assert 'kpis' in g2 and g2['kpis']['total_gestantes'] > 0, "UT filter returned 0 gestantes"
    print(f"[PASS] /api/gestantes (AMAZONAS): {g2['kpis']['total_gestantes']} total gestantes.")

    print("\n=== TEST 3: /api/ninos default ===")
    n1 = h.handle_ninos({})
    assert 'kpis' in n1 and 'trend' in n1 and 'ut_ranking' in n1, "Missing keys in /api/ninos"
    assert n1['kpis']['dni_30d'] == {'pct': 0.0, 'num': 0, 'den': 0}, "dni_30d improperly populated"
    assert n1['kpis']['dni_30d'] != n1['kpis']['bpn'], "dni_30d duplicates bpn"
    assert len(n1['trend']) == 42, f"Expected 42 trend periods in /api/ninos, got {len(n1['trend'])}"
    print(f"[PASS] /api/ninos default: {n1['kpis']['total_ninos']} total ninos, {len(n1['trend'])} trend periods.")

    print("\n=== TEST 4: /api/ninos with Servicio & Age filters ===")
    n2 = h.handle_ninos({'servicio': 'SCD', 'grupo_edad': '[06-11] Meses'})
    assert 'kpis' in n2, "Missing kpis in filtered /api/ninos"
    print(f"[PASS] /api/ninos (SCD, [06-11] Meses): {n2['kpis']['total_ninos']} total ninos.")

    print("\n=== TEST 5: /api/filters for tabGestantes ===")
    f1 = h.handle_filters({'tab': 'tabGestantes'})
    assert len(f1['departamentos']) > 1 and len(f1['uts']) > 1, "Filters empty for Gestantes"
    print(f"[PASS] /api/filters (tabGestantes): {len(f1['departamentos'])-1} departments, {len(f1['uts'])-1} UTs.")

    print("\n=== TEST 6: /api/filters for tabNinos (optimized) ===")
    f2 = h.handle_filters({'tab': 'tabNinos'})
    assert len(f2['departamentos']) > 1 and len(f2['uts']) > 1, "Filters empty for Niños"
    print(f"[PASS] /api/filters (tabNinos): {len(f2['departamentos'])-1} departments, {len(f2['uts'])-1} UTs.")

    print("\n=== TEST 7: /api/map ===")
    m1 = h.handle_map({'tab': 'tabGestantes'})
    m2 = h.handle_map({'tab': 'tabNinos'})
    assert len(m1['departments']) == 25, f"Expected 25 depts in map for gestantes, got {len(m1['departments'])}"
    assert len(m2['departments']) == 25, f"Expected 25 depts in map for ninos, got {len(m2['departments'])}"
    print(f"[PASS] /api/map: 25 departments returned for both tabs.")

    print("\nALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_api_endpoints()
