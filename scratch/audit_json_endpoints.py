import sys
import os
sys.path.insert(0, os.path.abspath('.'))

import json
import sqlite3
from server import DashboardHandler

class TestHandler(DashboardHandler):
    def __init__(self):
        self.headers = {}
        self.response_data = None
        self.status = 200

    def send_json(self, data, status=200):
        self.response_data = data
        self.status = status

def test_endpoints_vs_jsons():
    handler = TestHandler()

    # Call handle_gestantes
    gest_resp = handler.handle_gestantes({})
    with open('data/gestantes.json', 'r', encoding='utf-8') as f:
        gest_json = json.load(f)

    # Call handle_ninos
    ninos_resp = handler.handle_ninos({})
    with open('data/ninos.json', 'r', encoding='utf-8') as f:
        ninos_json = json.load(f)

    print("=== COMPARE GESTANTES API RESPONSE vs DATA/GESTANTES.JSON ===")
    g_kpi_match = (gest_resp['kpis'] == gest_json['kpis'])
    print("KPIs match:", g_kpi_match)
    if not g_kpi_match:
        print("API KPIs:", json.dumps(gest_resp['kpis'], indent=2))
        print("JSON KPIs:", json.dumps(gest_json['kpis'], indent=2))

    g_trend_match = (gest_resp['trend'] == gest_json['trend'])
    print("Trend match:", g_trend_match)
    print(f"API trend length: {len(gest_resp['trend'])}, JSON trend length: {len(gest_json['trend'])}")

    g_ut_match = (gest_resp['ut_ranking'] == gest_json['ut_ranking'])
    print("UT ranking match:", g_ut_match)
    print(f"API ranking count: {len(gest_resp['ut_ranking'])}, JSON ranking count: {len(gest_json['ut_ranking'])}")

    print("\n=== COMPARE NIÑOS API RESPONSE vs DATA/NINOS.JSON ===")
    # Compare KPIs (ignoring keys present in API but missing in static JSON like actividades, age_counts, cg_table)
    n_api_kpis = {k: v for k, v in ninos_resp['kpis'].items() if k in ninos_json['kpis']}
    n_kpi_match = (n_api_kpis == ninos_json['kpis'])
    print("KPIs match (for common keys):", n_kpi_match)
    if not n_kpi_match:
        for k in ninos_json['kpis']:
            if n_api_kpis.get(k) != ninos_json['kpis'].get(k):
                print(f"  Mismatch in KPI {k}: API={n_api_kpis.get(k)} vs JSON={ninos_json['kpis'].get(k)}")

    print(f"\nNiños API trend periods count: {len(ninos_resp['trend'])} ({ninos_resp['trend'][0]['periodo']} to {ninos_resp['trend'][-1]['periodo']})")
    print(f"Niños JSON trend periods count: {len(ninos_json['trend'])} ({ninos_json['trend'][0]['periodo']} to {ninos_json['trend'][-1]['periodo']})")
    
    # Check if the 6 periods in ninos.json match the last 6 periods of API trend
    n_api_last_6_trend = ninos_resp['trend'][-6:]
    n_trend_last_6_match = (n_api_last_6_trend == ninos_json['trend'])
    print("Niños trend (last 6 periods) match:", n_trend_last_6_match)

    n_ut_match = (ninos_resp['ut_ranking'] == ninos_json['ut_ranking'])
    print("UT ranking match:", n_ut_match)
    print(f"API UT count: {len(ninos_resp['ut_ranking'])}, JSON UT count: {len(ninos_json['ut_ranking'])}")

test_endpoints_vs_jsons()
