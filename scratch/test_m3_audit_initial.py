import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import http.server
import socketserver
import threading
import json
import urllib.request
import urllib.parse
import sqlite3
import time

# Import server module
import server

PORT = 8055
BASE_URL = f"http://127.0.0.1:{PORT}"

def start_test_server():
    server.PORT = PORT
    server_address = ('127.0.0.1', PORT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(server_address, server.DashboardHandler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)
    return httpd

def http_get(path, query_params=None):
    url = BASE_URL + path
    if query_params:
        url += "?" + urllib.parse.urlencode(query_params)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        status = resp.status
        content_type = resp.headers.get('Content-Type')
        data = json.loads(resp.read().decode('utf-8'))
        return status, content_type, data

def run_tests():
    httpd = start_test_server()
    print("Test server started at", BASE_URL)

    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dashboard_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Test 1: Technical Sheet Formula Verification in server.py
    print("\n--- TEST 1: Technical Sheet Formula Verification in server.py ---")

    status, ctype, ninos_data = http_get('/api/ninos')
    print(f"/api/ninos status: {status}, content-type: {ctype}")
    kpis = ninos_data['kpis']
    
    print("\nNiños KPIs (Default National):")
    print(f"  Frecuencia Anemia: {kpis['frecuencia_anemia']}")
    print(f"  Gestantes Anemia: {kpis['gestantes_anemia']}")
    print(f"  Recuperación Anemia (NPR): {kpis['npr']}")
    print(f"  Suplementación Hierro: {kpis['hierro']}")
    print(f"  Anemia FE (Tratamiento): {kpis['anemia_fe']}")
    print(f"  Dosaje Hb: {kpis['dosaje_hb']}")
    print(f"  CRED: {kpis['cred']}")
    print(f"  Vacunas VRN: {kpis['vrn']}")
    print(f"  Vacunas Completa: {kpis['vac_completa']}")
    print(f"  Paquete Integrado (PQT): {kpis['pqt']}")
    print(f"  Actividades: {kpis['actividades']}")

    status_g, ctype_g, gestantes_data = http_get('/api/gestantes')
    print(f"\n/api/gestantes status: {status_g}, content-type: {ctype_g}")
    print(f"  Gestantes Frecuencia Anemia: {gestantes_data['kpis']['frecuencia_anemia']}")

    # Verification against direct SQL
    print("\n--- DB Reconciliation Check for Default Max Period ---")
    max_p = server.get_max_periodo()
    print(f"Max Period: {max_p}")

    cursor.execute("""
        SELECT 
            SUM(total_usuarios) as total_u,
            SUM(num_hb) as n_hb, SUM(den_hb) as d_hb,
            SUM(num_anemia) as n_anemia, SUM(den_anemia) as d_anemia,
            SUM(num_cred) as n_cred, SUM(den_cred) as d_cred,
            SUM(num_vrn) as n_vrn, SUM(den_vrn) as d_vrn,
            SUM(num_hierro) as n_hierro, SUM(den_hierro) as d_hierro,
            SUM(num_vac_completa) as n_vac, SUM(den_vac_completa) as d_vac,
            SUM(num_anemia_fe) as n_afe, SUM(den_anemia_fe) as d_afe,
            SUM(num_pqt) as n_pqt, SUM(den_pqt) as d_pqt,
            SUM(num_npr) as n_npr, SUM(den_npr) as d_npr
        FROM ninos_geo_summary
        WHERE periodo = ?
    """, (max_p,))
    row_n = cursor.fetchone()

    def calc_pct(n, d):
        return round((n / d) * 100, 2) if d and d > 0 and n is not None else 0.0

    print("SQL Niños Anemia Frecuencia:", calc_pct(row_n['n_anemia'], row_n['d_anemia']))
    print("API Niños Anemia Frecuencia:", kpis['frecuencia_anemia']['pct'])

    assert calc_pct(row_n['n_anemia'], row_n['d_anemia']) == kpis['frecuencia_anemia']['pct']
    assert row_n['n_anemia'] == kpis['frecuencia_anemia']['num']
    assert row_n['d_anemia'] == kpis['frecuencia_anemia']['den']
    print("✓ Niños Frecuencia Anemia exact match!")

    # Check gestantes anemia
    cursor.execute("""
        SELECT SUM(num_anemia) as n_anemia, SUM(den_anemia) as d_anemia
        FROM gestantes_summary
        WHERE periodo = ?
    """, (max_p,))
    row_g = cursor.fetchone()
    print("SQL Gestantes Anemia Frecuencia:", calc_pct(row_g['n_anemia'], row_g['d_anemia']))
    print("API Gestantes Anemia Frecuencia (in /api/gestantes):", gestantes_data['kpis']['frecuencia_anemia']['pct'])
    print("API Gestantes Anemia Frecuencia (in /api/ninos):", kpis['gestantes_anemia']['pct'])

    assert calc_pct(row_g['n_anemia'], row_g['d_anemia']) == gestantes_data['kpis']['frecuencia_anemia']['pct']
    assert calc_pct(row_g['n_anemia'], row_g['d_anemia']) == kpis['gestantes_anemia']['pct']
    print("✓ Gestantes Frecuencia Anemia exact match!")

    httpd.shutdown()

if __name__ == '__main__':
    run_tests()
