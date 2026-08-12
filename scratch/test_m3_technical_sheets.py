import os
import sys
import json
import sqlite3
import threading
import socketserver
import time
import urllib.request
import urllib.parse

# Ensure UTF-8 output formatting for Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import server

TEST_PORT = 8059
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

def start_server():
    server.PORT = TEST_PORT
    server.RESPONSE_CACHE.clear()
    server.MAX_PERIOD_CACHE.clear()
    server_address = ('127.0.0.1', TEST_PORT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(server_address, server.DashboardHandler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)
    return httpd

def http_get(path, params=None):
    url = BASE_URL + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content_type = resp.headers.get('Content-Type')
            body = resp.read().decode('utf-8')
            return status, content_type, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            data = json.loads(body)
        except Exception:
            data = {'raw': body}
        return e.code, e.headers.get('Content-Type'), data

def calc_pct(n, d, is_coverage=False):
    if not d or d == 0 or n is None:
        return 0.0
    val = round((n / d) * 100, 2)
    if is_coverage and val > 100.0:
        return 100.0
    return val

def run_m3_verifications():
    print("=" * 80)
    print("  MILESTONE 3: TECHNICAL SHEET & API VERIFICATION SUITE")
    print("=" * 80)

    httpd = start_server()
    print(f"[+] Started test server on {BASE_URL}")

    db_path = os.path.join(PROJECT_ROOT, 'dashboard_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    total_tests = 0
    passed_tests = 0
    failed_tests = 0

    def assert_test(cond, desc, details=""):
        nonlocal total_tests, passed_tests, failed_tests
        total_tests += 1
        if cond:
            passed_tests += 1
            print(f"  [PASS] {desc}")
        else:
            failed_tests += 1
            print(f"  [FAIL] {desc}")
            if details:
                print(f"         Details: {details}")

    # -------------------------------------------------------------------------
    # SECTION 1: Technical Sheet Formula & Target Definition Verification
    # -------------------------------------------------------------------------
    print("\n--- SECTION 1: Technical Sheet Formula & Target Definitions Verification ---")

    # 1.1 Frecuencia de Anemia Niños (6-35m): num_anemia / den_anemia * 100
    # 1.2 Anemia Gestantes SAF: num_anemia / den_anemia * 100
    # 1.3 Recuperación de Anemia (6-35m): num_npr / den_npr * 100
    # 1.4 Suplementación Preventiva con Hierro (<24m): num_hierro / den_hierro * 100
    # 1.5 Tratamiento Terapéutico con Hierro (6-11m): num_anemia_fe / den_anemia_fe * 100
    # 1.6 Actividades Estratégicas Targets (4.15: 67387, 4.13: 18899, 4.12: 277283, 4.14: 27877)
    # 1.7 Paquete Integrado DIT (<24m) & 5 components (CRED, VRN, Dosaje Hb, Suplementación Hierro, Vacunas Completa)

    st, ctype, n_data = http_get('/api/ninos')
    st_g, ctype_g, g_data = http_get('/api/gestantes')

    kpis_n = n_data['kpis']
    kpis_g = g_data['kpis']

    # 1.1 Frecuencia Anemia Niños formula check
    assert_test('frecuencia_anemia' in kpis_n, "Niños KPI dictionary includes 'frecuencia_anemia'")
    n_fa = kpis_n['frecuencia_anemia']
    expected_fa_pct = calc_pct(n_fa['num'], n_fa['den'], is_coverage=False)
    assert_test(n_fa['pct'] == expected_fa_pct, f"Frecuencia Anemia Niños formula = num/den*100 ({n_fa['num']}/{n_fa['den']} = {n_fa['pct']} vs exp {expected_fa_pct})")

    # 1.2 Anemia Gestantes SAF formula check
    assert_test('frecuencia_anemia' in kpis_g, "Gestantes KPI dictionary includes 'frecuencia_anemia'")
    g_fa = kpis_g['frecuencia_anemia']
    expected_g_fa_pct = calc_pct(g_fa['num'], g_fa['den'], is_coverage=False)
    assert_test(g_fa['pct'] == expected_g_fa_pct, f"Anemia Gestantes SAF formula = num/den*100 ({g_fa['num']}/{g_fa['den']} = {g_fa['pct']} vs exp {expected_g_fa_pct})")

    # 1.3 Recuperación de Anemia (6-35m) formula check
    assert_test('npr' in kpis_n, "Niños KPI dictionary includes 'npr' (Recuperación de Anemia)")
    n_npr = kpis_n['npr']
    expected_npr_pct = calc_pct(n_npr['num'], n_npr['den'], is_coverage=False)
    assert_test(n_npr['pct'] == expected_npr_pct, f"Recuperación de Anemia formula = num_npr/den_npr*100 ({n_npr['num']}/{n_npr['den']} = {n_npr['pct']} vs exp {expected_npr_pct})")

    # 1.4 Suplementación Preventiva con Hierro (<24m) formula check
    assert_test('hierro' in kpis_n, "Niños KPI dictionary includes 'hierro'")
    n_fe = kpis_n['hierro']
    expected_fe_pct = calc_pct(n_fe['num'], n_fe['den'], is_coverage=True)
    assert_test(n_fe['pct'] == expected_fe_pct, f"Suplementación Hierro formula = num_hierro/den_hierro*100 ({n_fe['num']}/{n_fe['den']} = {n_fe['pct']} vs exp {expected_fe_pct})")

    # 1.5 Tratamiento Terapéutico con Hierro (6-11m) formula check
    assert_test('anemia_fe' in kpis_n, "Niños KPI dictionary includes 'anemia_fe'")
    n_afe = kpis_n['anemia_fe']
    expected_afe_pct = calc_pct(n_afe['num'], n_afe['den'], is_coverage=True)
    assert_test(n_afe['pct'] == expected_afe_pct, f"Tratamiento Terapéutico con Hierro formula = num_anemia_fe/den_anemia_fe*100 ({n_afe['num']}/{n_afe['den']} = {n_afe['pct']} vs exp {expected_afe_pct})")

    # 1.6 Actividades Estratégicas PNCM target check
    assert_test('actividades' in kpis_n, "Niños KPI dictionary includes 'actividades'")
    acts = kpis_n['actividades']
    assert_test(acts.get('act_415', {}).get('meta') == 67387, "Act 4.15 physical target == 67,387 (Niños SCD)")
    assert_test(acts.get('act_413', {}).get('meta') == 18899, "Act 4.13 physical target == 18,899 (Actores SCD)")
    assert_test(acts.get('act_412', {}).get('meta') == 277283, "Act 4.12 physical target == 277,283 (Familias SAF)")
    assert_test(acts.get('act_414', {}).get('meta') == 27877, "Act 4.14 physical target == 27,877 (Actores SAF)")

    # 1.7 Paquete Integrado DIT (<24m) & 5 components check
    assert_test('pqt' in kpis_n, "Paquete Integrado (PQT) KPI exists")
    assert_test('dosaje_hb' in kpis_n, "Component 1: Dosaje Hb KPI exists")
    assert_test('hierro' in kpis_n, "Component 2: Suplementación Hierro KPI exists")
    assert_test('vrn' in kpis_n, "Component 3: Vacunas Neumo/Rota (VRN) KPI exists")
    assert_test('vac_completa' in kpis_n, "Component 4: Vacunas Completas 18m KPI exists")
    assert_test('cred' in kpis_n, "Component 5: CRED KPI exists")

    # -------------------------------------------------------------------------
    # SECTION 2: Terminology Compliance Verification ("Frecuencia de Anemia")
    # -------------------------------------------------------------------------
    print("\n--- SECTION 2: Terminology Compliance Verification ---")

    code_files_to_check = ['server.py', 'api/index.py', 'app.js', 'index.html', 'generate_rich_draft.py']
    prevalencia_found = False
    for fname in code_files_to_check:
        fpath = os.path.join(PROJECT_ROOT, fname)
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                if 'prevalencia' in content.lower():
                    prevalencia_found = True
                    print(f"  [ERROR] Found 'prevalencia' in {fname}")

    assert_test(not prevalencia_found, "Strict terminology check: 'prevalencia' is NEVER used in source code/web templates")

    n_keys_str = json.dumps(kpis_n).lower()
    g_keys_str = json.dumps(kpis_g).lower()
    assert_test('frecuencia_anemia' in n_keys_str and 'prevalencia' not in n_keys_str, "API /api/ninos uses 'frecuencia_anemia' key and NO 'prevalencia'")
    assert_test('frecuencia_anemia' in g_keys_str and 'prevalencia' not in g_keys_str, "API /api/gestantes uses 'frecuencia_anemia' key and NO 'prevalencia'")

    # -------------------------------------------------------------------------
    # SECTION 3: API Endpoint Status, Content-Type & Route Verification
    # -------------------------------------------------------------------------
    print("\n--- SECTION 3: API Endpoint Status & Content-Type Verification ---")

    routes_to_test = [
        ('/api/ninos', 200),
        ('/api/gestantes', 200),
        ('/api/filters', 200),
        ('/api/map', 200),
        ('/api/comparison?periodo1=202512&periodo2=202606', 200),
        ('/api/comparison', 400), # missing params returns 400
        ('/api/nonexistent', 404)
    ]

    for path, expected_status in routes_to_test:
        status, ctype, res = http_get(path)
        assert_test(status == expected_status, f"Route GET {path} returned HTTP {status} (expected {expected_status})")
        if status == 200:
            assert_test('application/json' in (ctype or '').lower(), f"Route GET {path} returns Content-Type application/json")

    # -------------------------------------------------------------------------
    # SECTION 4: API Endpoint dynamic parameter filtering & exact DB reconciliation
    # -------------------------------------------------------------------------
    print("\n--- SECTION 4: Dynamic Parameter Filtering & SQLite DB Reconciliation ---")

    # 4.1 Test /api/ninos under various filter combinations
    test_cases_ninos = [
        ("National Default", {}),
        ("Specific Period (202512)", {'periodo': '202512'}),
        ("Anio and Mes (2025, 06)", {'anio': '2025', 'mes': '06'}),
        ("UT Filter (CUSCO)", {'ut': 'CUSCO'}),
        ("Departamento Filter (LIMA)", {'departamento': 'LIMA'}),
        ("Provincia Filter (CUSCO)", {'ut': 'CUSCO', 'departamento': 'CUSCO', 'provincia': 'CUSCO'}),
        ("Distrito Filter (CHACHAPOYAS)", {'ut': 'AMAZONAS', 'departamento': 'AMAZONAS', 'provincia': 'CHACHAPOYAS', 'distrito': 'CHACHAPOYAS'}),
        ("Service Filter SCD", {'servicio': 'SCD'}),
        ("Service Filter SAF", {'servicio': 'SAF'}),
        ("Comité de Gestión Filter (VIRGEN DEL CARMEN)", {'cg': 'VIRGEN DEL CARMEN'}),
        ("Local Filter (TRP_ALQUILER_CIAI1_VIRGEN DEL CARMEN)", {'cg': 'VIRGEN DEL CARMEN', 'local': 'TRP_ALQUILER_CIAI1_VIRGEN DEL CARMEN'})
    ]

    for name, params in test_cases_ninos:
        st, ct, resp = http_get('/api/ninos', params)
        assert_test(st == 200, f"/api/ninos [{name}] HTTP status 200")
        kpis = resp['kpis']

        has_cg_or_local = bool(params.get('cg') or params.get('local'))
        tbl = 'ninos_summary' if has_cg_or_local else 'ninos_geo_summary'

        where_clauses = []
        sql_p = []

        periodo = params.get('periodo')
        anio = params.get('anio')
        mes = params.get('mes')

        if periodo:
            where_clauses.append("periodo = ?")
            sql_p.append(periodo)
        elif anio and mes and anio != 'Todos' and mes != 'Todos':
            where_clauses.append("periodo = ?")
            sql_p.append(f"{anio}{mes}")
        else:
            max_p = server.get_max_periodo(anio)
            where_clauses.append("periodo = ?")
            sql_p.append(max_p)

        mapping = {
            'servicio': 'servicio',
            'ut': 'unidad_territorial',
            'departamento': 'departamento',
            'provincia': 'provincia',
            'distrito': 'distrito',
            'cg': 'comite_gestion',
            'local': 'local_nombre'
        }
        for pk, dbcol in mapping.items():
            if pk in params and params[pk] and params[pk] != 'Todos':
                where_clauses.append(f"{dbcol} = ?")
                sql_p.append(params[pk])

        where_str = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        cursor.execute(f"""
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
            FROM {tbl}
            {where_str}
        """, sql_p)

        sql_row = cursor.fetchone()

        sql_total = sql_row['total_usuarios'] or 0
        sql_anemia_num = sql_row['num_anemia'] or 0
        sql_anemia_den = sql_row['den_anemia'] or 0
        sql_anemia_pct = calc_pct(sql_anemia_num, sql_anemia_den, False)

        sql_hb_num = sql_row['num_hb'] or 0
        sql_hb_den = sql_row['den_hb'] or 0
        sql_hb_pct = calc_pct(sql_hb_num, sql_hb_den, True)

        sql_cred_num = sql_row['num_cred'] or 0
        sql_cred_den = sql_row['den_cred'] or 0
        sql_cred_pct = calc_pct(sql_cred_num, sql_cred_den, True)

        assert_test(kpis['total_ninos'] == sql_total, f"/api/ninos [{name}] total_ninos matches DB ({kpis['total_ninos']} == {sql_total})")
        assert_test(kpis['frecuencia_anemia']['num'] == sql_anemia_num and
                    kpis['frecuencia_anemia']['den'] == sql_anemia_den and
                    kpis['frecuencia_anemia']['pct'] == sql_anemia_pct,
                    f"/api/ninos [{name}] frecuencia_anemia matches DB ({kpis['frecuencia_anemia']['pct']} == {sql_anemia_pct})")
        assert_test(kpis['dosaje_hb']['num'] == sql_hb_num and
                    kpis['dosaje_hb']['den'] == sql_hb_den and
                    kpis['dosaje_hb']['pct'] == sql_hb_pct,
                    f"/api/ninos [{name}] dosaje_hb matches DB ({kpis['dosaje_hb']['pct']} == {sql_hb_pct})")
        assert_test(kpis['cred']['num'] == sql_cred_num and
                    kpis['cred']['den'] == sql_cred_den and
                    kpis['cred']['pct'] == sql_cred_pct,
                    f"/api/ninos [{name}] cred matches DB ({kpis['cred']['pct']} == {sql_cred_pct})")

    # 4.2 Test /api/gestantes under various filter combinations
    test_cases_gestantes = [
        ("National Default", {}),
        ("Specific Period (202512)", {'periodo': '202512'}),
        ("UT Filter (CUSCO)", {'ut': 'CUSCO'}),
        ("Departamento Filter (LIMA)", {'departamento': 'LIMA'}),
        ("Provincia Filter (CUSCO)", {'ut': 'CUSCO', 'departamento': 'CUSCO', 'provincia': 'CUSCO'}),
        ("Distrito Filter (CHACHAPOYAS)", {'ut': 'AMAZONAS', 'departamento': 'AMAZONAS', 'provincia': 'CHACHAPOYAS', 'distrito': 'CHACHAPOYAS'})
    ]

    for name, params in test_cases_gestantes:
        st, ct, resp = http_get('/api/gestantes', params)
        assert_test(st == 200, f"/api/gestantes [{name}] HTTP status 200")
        kpis = resp['kpis']

        where_clauses = []
        sql_p = []

        periodo = params.get('periodo')
        if periodo:
            where_clauses.append("periodo = ?")
            sql_p.append(periodo)
        else:
            max_p = server.get_max_periodo()
            where_clauses.append("periodo = ?")
            sql_p.append(max_p)

        mapping = {
            'servicio': 'servicio',
            'ut': 'unidad_territorial',
            'departamento': 'departamento',
            'provincia': 'provincia',
            'distrito': 'distrito',
            'cg': 'comite_gestion'
        }
        for pk, dbcol in mapping.items():
            if pk in params and params[pk] and params[pk] != 'Todos':
                where_clauses.append(f"{dbcol} = ?")
                sql_p.append(params[pk])

        where_str = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        cursor.execute(f"""
            SELECT 
                SUM(total_usuarios) as total_usuarios,
                SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
                SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
                SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
                SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
                SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins
            FROM gestantes_summary
            {where_str}
        """, sql_p)

        sql_row = cursor.fetchone()

        sql_total = sql_row['total_usuarios'] or 0
        sql_anemia_num = sql_row['num_anemia'] or 0
        sql_anemia_den = sql_row['den_anemia'] or 0
        sql_anemia_pct = calc_pct(sql_anemia_num, sql_anemia_den, False)

        sql_apn_num = sql_row['num_apn'] or 0
        sql_apn_den = sql_row['den_apn'] or 0
        sql_apn_pct = calc_pct(sql_apn_num, sql_apn_den, True)

        assert_test(kpis['total_gestantes'] == sql_total, f"/api/gestantes [{name}] total_gestantes matches DB ({kpis['total_gestantes']} == {sql_total})")
        assert_test(kpis['frecuencia_anemia']['num'] == sql_anemia_num and
                    kpis['frecuencia_anemia']['den'] == sql_anemia_den and
                    kpis['frecuencia_anemia']['pct'] == sql_anemia_pct,
                    f"/api/gestantes [{name}] frecuencia_anemia matches DB ({kpis['frecuencia_anemia']['pct']} == {sql_anemia_pct})")
        assert_test(kpis['apn']['num'] == sql_apn_num and
                    kpis['apn']['den'] == sql_apn_den and
                    kpis['apn']['pct'] == sql_apn_pct,
                    f"/api/gestantes [{name}] apn matches DB ({kpis['apn']['pct']} == {sql_apn_pct})")

    # 4.3 Test /api/filters dynamic cascade matching SQLite
    print("\n--- Testing /api/filters against SQLite DB ---")
    st, ct, filter_resp = http_get('/api/filters', {'ut': 'CUSCO'})
    assert_test(st == 200, "/api/filters with UT=CUSCO returns HTTP 200")
    deps_in_cusco = filter_resp['departamentos']

    cursor.execute("SELECT DISTINCT departamento FROM ninos_geo_summary WHERE unidad_territorial = 'CUSCO' AND periodo = ?", (server.get_max_periodo(),))
    db_deps = [r['departamento'] for r in cursor.fetchall() if r['departamento']]
    expected_deps = ['Todos'] + db_deps
    assert_test(deps_in_cusco == expected_deps, f"/api/filters departamentos for UT=CUSCO match DB exact list ({deps_in_cusco} == {expected_deps})")

    # 4.4 Test /api/map data matching SQLite DB
    print("\n--- Testing /api/map against SQLite DB ---")
    st, ct, map_resp = http_get('/api/map', {'tab': 'tabNinos'})
    assert_test(st == 200, "/api/map tabNinos returns HTTP 200")

    map_deps = map_resp['departments']
    cursor.execute("""
        SELECT departamento, SUM(total_usuarios) as total, SUM(num_anemia) as n_anemia, SUM(den_anemia) as d_anemia
        FROM ninos_geo_summary
        WHERE periodo = ?
        GROUP BY departamento
    """, (server.get_max_periodo(),))
    sql_map_rows = cursor.fetchall()
    
    map_match_all = True
    for mr in sql_map_rows:
        dname = mr['departamento']
        if dname and dname in map_deps:
            exp_pct = calc_pct(mr['n_anemia'], mr['d_anemia'])
            if map_deps[dname]['frecuencia_anemia_pct'] != exp_pct or map_deps[dname]['total'] != (mr['total'] or 0):
                map_match_all = False
                break
    assert_test(map_match_all, "/api/map department choropleth metrics match SQLite DB exact calculations")

    # 4.5 Test /api/comparison matching SQLite DB calculation
    print("\n--- Testing /api/comparison against SQLite DB ---")
    st, ct, comp_resp = http_get('/api/comparison', {'periodo1': '202512', 'periodo2': '202606', 'modulo': 'ninos'})
    assert_test(st == 200, "/api/comparison returns HTTP 200")
    comp_data = comp_resp['comparison']
    
    fa_comp = comp_data['frecuencia_anemia_pct']
    
    cursor.execute("SELECT SUM(num_anemia) as n, SUM(den_anemia) as d FROM ninos_geo_summary WHERE periodo = '202512'")
    r1 = cursor.fetchone()
    p1_pct = calc_pct(r1['n'], r1['d'])

    cursor.execute("SELECT SUM(num_anemia) as n, SUM(den_anemia) as d FROM ninos_geo_summary WHERE periodo = '202606'")
    r2 = cursor.fetchone()
    p2_pct = calc_pct(r2['n'], r2['d'])

    exp_diff = round(p2_pct - p1_pct, 2)
    assert_test(fa_comp['p1'] == p1_pct and fa_comp['p2'] == p2_pct and fa_comp['diff'] == exp_diff,
                f"/api/comparison p1 ({fa_comp['p1']}), p2 ({fa_comp['p2']}), diff ({fa_comp['diff']}) match DB exact ({p1_pct}, {p2_pct}, {exp_diff})")

    # Shutdown server
    httpd.shutdown()

    print("\n" + "=" * 80)
    print(f"  VERIFICATION COMPLETE: Total={total_tests}, Passed={passed_tests}, Failed={failed_tests}")
    print("=" * 80)

    if failed_tests > 0:
        print("\n[!] VERIFICATION FAILED with errors.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] 100% Technical Sheet & API Verification Passed!")
        sys.exit(0)

if __name__ == '__main__':
    run_m3_verifications()
