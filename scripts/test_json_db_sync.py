import os
import sys
import json
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_static_jsons_and_db_sync():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dashboard_data.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    g_json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'gestantes.json')
    n_json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'ninos.json')

    with open(g_json_path, 'r', encoding='utf-8') as f:
        g_json = json.load(f)

    with open(n_json_path, 'r', encoding='utf-8') as f:
        n_json = json.load(f)

    # 1. Verify Gestantes periods
    g_periods = [t['periodo'] for t in g_json['trend']]
    assert len(g_periods) == 30, f"Expected 30 periods in gestantes.json, got {len(g_periods)}"
    assert g_periods[0] == '202401' and g_periods[-1] == '202606', f"Unexpected gestantes period range: {g_periods[0]} to {g_periods[-1]}"
    print("[PASS] gestantes.json contains all 30 periods (202401 to 202606).")

    # 2. Verify Niños periods
    n_periods = [t['periodo'] for t in n_json['trend']]
    assert len(n_periods) == 42, f"Expected 42 periods in ninos.json, got {len(n_periods)}"
    assert n_periods[0] == '202301' and n_periods[-1] == '202606', f"Unexpected ninos period range: {n_periods[0]} to {n_periods[-1]}"
    print("[PASS] ninos.json contains all 42 periods (202301 to 202606).")

    # 3. Verify Gestantes KPIs for 202606 vs DB
    cursor.execute("""
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
    """)
    g_db = cursor.fetchone()
    g_kpis = g_json['kpis']

    assert g_kpis['total_gestantes'] == g_db['total_usuarios'], f"Total gestantes mismatch: JSON {g_kpis['total_gestantes']} vs DB {g_db['total_usuarios']}"
    assert g_kpis['frecuencia_anemia']['num'] == g_db['num_anemia'] and g_kpis['frecuencia_anemia']['den'] == g_db['den_anemia'], "Gestantes Anemia mismatch"
    assert g_kpis['apn']['num'] == g_db['num_apn'] and g_kpis['apn']['den'] == g_db['den_apn'], "APN mismatch"
    assert g_kpis['sfaf']['num'] == g_db['num_sfaf'] and g_kpis['sfaf']['den'] == g_db['den_sfaf'], "SFAF mismatch"
    assert g_kpis['aux']['num'] == g_db['num_aux'] and g_kpis['aux']['den'] == g_db['den_aux'], "AUX mismatch"
    assert g_kpis['pqt']['num'] == g_db['num_pqt'] and g_kpis['pqt']['den'] == g_db['den_pqt'], "Gestantes PQT mismatch"
    assert g_kpis['parto_ins']['num'] == g_db['num_parto_ins'] and g_kpis['parto_ins']['den'] == g_db['den_parto_ins'], "Parto Ins mismatch"
    print("[PASS] gestantes.json KPIs match period 202606 in DB 100%.")

    # 4. Verify Niños KPIs for 202606 vs DB
    cursor.execute("""
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
    """)
    n_db = cursor.fetchone()
    n_kpis = n_json['kpis']

    assert n_kpis['total_ninos'] == n_db['total_usuarios'], f"Total ninos mismatch: JSON {n_kpis['total_ninos']} vs DB {n_db['total_usuarios']}"
    assert n_kpis['dosaje_hb']['num'] == n_db['num_hb'] and n_kpis['dosaje_hb']['den'] == n_db['den_hb'], "Dosaje HB mismatch"
    assert n_kpis['frecuencia_anemia']['num'] == n_db['num_anemia'] and n_kpis['frecuencia_anemia']['den'] == n_db['den_anemia'], "Niños Anemia mismatch"
    assert n_kpis['cred']['num'] == n_db['num_cred'] and n_kpis['cred']['den'] == n_db['den_cred'], "CRED mismatch"
    assert n_kpis['vrn']['num'] == n_db['num_vrn'] and n_kpis['vrn']['den'] == n_db['den_vrn'], "VRN mismatch"
    assert n_kpis['hierro']['num'] == min(n_db['num_hierro'], n_db['den_hierro']) and n_kpis['hierro']['den'] == n_db['den_hierro'], "Hierro mismatch"
    assert n_kpis['vac_completa']['num'] == n_db['num_vac_completa'] and n_kpis['vac_completa']['den'] == n_db['den_vac_completa'], "Vac Completa mismatch"
    assert n_kpis['anemia_fe']['num'] == n_db['num_anemia_fe'] and n_kpis['anemia_fe']['den'] == n_db['den_anemia_fe'], "Anemia FE mismatch"
    assert n_kpis['pqt']['num'] == n_db['num_pqt'] and n_kpis['pqt']['den'] == n_db['den_pqt'], "Niños PQT mismatch"
    assert n_kpis['bpn']['num'] == n_db['num_bpn'] and n_kpis['bpn']['den'] == n_db['den_bpn'], "BPN mismatch"
    assert n_kpis['npr']['num'] == n_db['num_npr'] and n_kpis['npr']['den'] == n_db['den_npr'], "NPR mismatch"
    assert n_kpis['dni_30d'] == {'pct': 0.0, 'num': 0, 'den': 0}, f"Unexpected dni_30d in JSON: {n_kpis['dni_30d']}"
    print("[PASS] ninos.json KPIs match period 202606 in DB 100%.")

    conn.close()

if __name__ == '__main__':
    test_static_jsons_and_db_sync()
