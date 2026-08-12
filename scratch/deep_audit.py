import sqlite3
import json

def deep_audit():
    conn = sqlite3.connect('dashboard_data.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Load static JSONs
    with open('data/gestantes.json', 'r', encoding='utf-8') as f:
        g_json = json.load(f)
    with open('data/ninos.json', 'r', encoding='utf-8') as f:
        n_json = json.load(f)

    print("=== DEEP AUDIT 1: GESTANTES KPI VERIFICATION (202606) ===")
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
    g_row = cursor.fetchone()

    # Compare each KPI in gestantes.json vs DB
    g_kpis_json = g_json['kpis']
    print("Gestantes Total:", g_row['total_usuarios'], "vs JSON:", g_kpis_json['total_gestantes'])
    print("Anemia num/den:", g_row['num_anemia'], g_row['den_anemia'], "vs JSON:", g_kpis_json['frecuencia_anemia'])
    print("APN num/den:", g_row['num_apn'], g_row['den_apn'], "vs JSON:", g_kpis_json['apn'])
    print("SFAF num/den:", g_row['num_sfaf'], g_row['den_sfaf'], "vs JSON:", g_kpis_json['sfaf'])
    print("AUX num/den:", g_row['num_aux'], g_row['den_aux'], "vs JSON:", g_kpis_json['aux'])
    print("PQT num/den:", g_row['num_pqt'], g_row['den_pqt'], "vs JSON:", g_kpis_json['pqt'])
    print("Parto num/den:", g_row['num_parto_ins'], g_row['den_parto_ins'], "vs JSON:", g_kpis_json['parto_ins'])

    print("\n=== DEEP AUDIT 2: NIÑOS KPI VERIFICATION (202606) ===")
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
    n_row = cursor.fetchone()
    n_kpis_json = n_json['kpis']
    print("Niños Total:", n_row['total_usuarios'], "vs JSON:", n_kpis_json['total_ninos'])
    print("Dosaje HB num/den:", n_row['num_hb'], n_row['den_hb'], "vs JSON:", n_kpis_json['dosaje_hb'])
    print("Anemia num/den:", n_row['num_anemia'], n_row['den_anemia'], "vs JSON:", n_kpis_json['frecuencia_anemia'])
    print("CRED num/den:", n_row['num_cred'], n_row['den_cred'], "vs JSON:", n_kpis_json['cred'])
    print("VRN num/den:", n_row['num_vrn'], n_row['den_vrn'], "vs JSON:", n_kpis_json['vrn'])
    print("Hierro num/den:", n_row['num_hierro'], n_row['den_hierro'], "vs JSON:", n_kpis_json['hierro'])
    print("Vac Completa num/den:", n_row['num_vac_completa'], n_row['den_vac_completa'], "vs JSON:", n_kpis_json['vac_completa'])
    print("Anemia FE num/den:", n_row['num_anemia_fe'], n_row['den_anemia_fe'], "vs JSON:", n_kpis_json['anemia_fe'])
    print("PQT num/den:", n_row['num_pqt'], n_row['den_pqt'], "vs JSON:", n_kpis_json['pqt'])
    print("BPN num/den:", n_row['num_bpn'], n_row['den_bpn'], "vs JSON:", n_kpis_json['bpn'])
    print("NPR num/den:", n_row['num_npr'], n_row['den_npr'], "vs JSON:", n_kpis_json['npr'])

    print("\n=== DEEP AUDIT 3: TREND SPAN IN DATA/NINOS.JSON VS DB ===")
    cursor.execute("SELECT MIN(periodo), MAX(periodo), COUNT(DISTINCT periodo) FROM ninos_geo_summary")
    n_min, n_max, n_cnt = cursor.fetchone()
    print(f"DB Niños period range: {n_min} to {n_max} ({n_cnt} periods)")
    print(f"JSON Niños trend periods: {len(n_json['trend'])} periods ({n_json['trend'][0]['periodo']} to {n_json['trend'][-1]['periodo']})")

    print("\n=== DEEP AUDIT 4: ACTIVIDADES ESTRATEGICAS COMPUTATIONS ===")
    # SCD cobertura for 202606
    cursor.execute("SELECT SUM(total_usuarios) FROM ninos_geo_summary WHERE periodo = '202606' AND servicio = 'SCD'")
    scd_cob = cursor.fetchone()[0] or 0
    # SAF cobertura for 202606
    cursor.execute("SELECT SUM(total_usuarios) FROM ninos_geo_summary WHERE periodo = '202606' AND servicio = 'SAF'")
    saf_cob = cursor.fetchone()[0] or 0
    print(f"SCD Total Users (202606): {scd_cob} (Meta: 67387, pct: {round((scd_cob/67387)*100, 1)}%)")
    print(f"SAF Total Users (202606): {saf_cob} (Meta: 277283, pct: {round((saf_cob/277283)*100, 1)}%)")

    # Check Act 4.13 and Act 4.14 in server.py
    print("Act 4.13 (Actores SCD) and Act 4.14 (Actores SAF) in server.py:")
    print("  Act 4.13: cobertura=None, display='—', meta=18899")
    print("  Act 4.14: cobertura=None, display='—', meta=27877")

    print("\n=== DEEP AUDIT 5: GESTANTES ANEMIA IN PANEL 3 (FT 02) INSIDE SERVER.PY ===")
    cursor.execute("SELECT SUM(num_anemia), SUM(den_anemia) FROM gestantes_summary WHERE periodo = '202606'")
    g_anemia_row = cursor.fetchone()
    print("gestantes_anemia for 202606 in handle_ninos:")
    print("  num:", g_anemia_row[0], "den:", g_anemia_row[1], "pct:", round((g_anemia_row[0]/g_anemia_row[1])*100, 2))

    conn.close()

if __name__ == '__main__':
    deep_audit()
