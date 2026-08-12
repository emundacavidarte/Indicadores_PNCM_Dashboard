import sqlite3
import json

def audit_json_vs_db():
    conn = sqlite3.connect('dashboard_data.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Load JSON files
    with open('data/gestantes.json', 'r', encoding='utf-8') as f:
        gest_json = json.load(f)
    with open('data/ninos.json', 'r', encoding='utf-8') as f:
        ninos_json = json.load(f)

    print("=== AUDIT: GESTANTES (JSON vs DB for max period 202606) ===")
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

    def pct(n, d):
        return round((n / d) * 100, 2) if d and d > 0 and n is not None else 0.0

    print("DB Gestantes (202606):")
    print("  total_gestantes:", g_db['total_usuarios'])
    print("  den_anemia:", g_db['den_anemia'], "num_anemia:", g_db['num_anemia'], "pct:", pct(g_db['num_anemia'], g_db['den_anemia']))
    print("  den_apn:", g_db['den_apn'], "num_apn:", g_db['num_apn'], "pct:", pct(g_db['num_apn'], g_db['den_apn']))
    print("  den_sfaf:", g_db['den_sfaf'], "num_sfaf:", g_db['num_sfaf'], "pct:", pct(g_db['num_sfaf'], g_db['den_sfaf']))
    print("  den_aux:", g_db['den_aux'], "num_aux:", g_db['num_aux'], "pct:", pct(g_db['num_aux'], g_db['den_aux']))
    print("  den_pqt:", g_db['den_pqt'], "num_pqt:", g_db['num_pqt'], "pct:", pct(g_db['num_pqt'], g_db['den_pqt']))
    print("  den_parto_ins:", g_db['den_parto_ins'], "num_parto_ins:", g_db['num_parto_ins'], "pct:", pct(g_db['num_parto_ins'], g_db['den_parto_ins']))
    
    sin_at_g = max(0, g_db['total_usuarios'] - g_db['den_anemia'])
    print("  sin_atencion_his: num:", sin_at_g, "den:", g_db['total_usuarios'], "pct:", pct(sin_at_g, g_db['total_usuarios']))

    print("\nJSON gestantes.json kpis:")
    print(json.dumps(gest_json['kpis'], indent=2))

    print("\n=== AUDIT: NIÑOS (JSON vs DB for max period 202606) ===")
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

    total_u = n_db['total_usuarios'] or 0
    den_h = n_db['den_hb'] or 0
    sin_atencion_n = max(0, total_u - den_h)

    print("DB Niños (202606):")
    print("  total_ninos:", total_u)
    print("  sin_atencion_his: num:", sin_atencion_n, "den:", total_u, "pct:", pct(sin_atencion_n, total_u))
    print("  dosaje_hb: num:", n_db['num_hb'], "den:", n_db['den_hb'], "pct:", pct(n_db['num_hb'], n_db['den_hb']))
    print("  frecuencia_anemia: num:", n_db['num_anemia'], "den:", n_db['den_anemia'], "pct:", pct(n_db['num_anemia'], n_db['den_anemia']))
    print("  cred: num:", n_db['num_cred'], "den:", n_db['den_cred'], "pct:", pct(n_db['num_cred'], n_db['den_cred']))
    print("  vrn: num:", n_db['num_vrn'], "den:", n_db['den_vrn'], "pct:", pct(n_db['num_vrn'], n_db['den_vrn']))
    print("  hierro: num:", n_db['num_hierro'], "den:", n_db['den_hierro'], "pct:", pct(n_db['num_hierro'], n_db['den_hierro']))
    print("  vac_completa: num:", n_db['num_vac_completa'], "den:", n_db['den_vac_completa'], "pct:", pct(n_db['num_vac_completa'], n_db['den_vac_completa']))
    print("  anemia_fe: num:", n_db['num_anemia_fe'], "den:", n_db['den_anemia_fe'], "pct:", pct(n_db['num_anemia_fe'], n_db['den_anemia_fe']))
    print("  pqt: num:", n_db['num_pqt'], "den:", n_db['den_pqt'], "pct:", pct(n_db['num_pqt'], n_db['den_pqt']))
    print("  bpn: num:", n_db['num_bpn'], "den:", n_db['den_bpn'], "pct:", pct(n_db['num_bpn'], n_db['den_bpn']))
    print("  npr: num:", n_db['num_npr'], "den:", n_db['den_npr'], "pct:", pct(n_db['num_npr'], n_db['den_npr']))

    print("\nJSON ninos.json kpis:")
    print(json.dumps(ninos_json['kpis'], indent=2))

    # Compare periods available in DB vs JSON trend
    cursor.execute("SELECT DISTINCT periodo FROM gestantes_summary ORDER BY periodo")
    g_periods_db = [r[0] for r in cursor.fetchall()]
    g_periods_json = [t['periodo'] for t in gest_json['trend']]
    print(f"\nGestantes DB periods ({len(g_periods_db)}):", g_periods_db)
    print(f"Gestantes JSON trend periods ({len(g_periods_json)}):", g_periods_json)

    cursor.execute("SELECT DISTINCT periodo FROM ninos_geo_summary ORDER BY periodo")
    n_periods_db = [r[0] for r in cursor.fetchall()]
    n_periods_json = [t['periodo'] for t in ninos_json['trend']]
    print(f"\nNiños DB periods ({len(n_periods_db)}):", n_periods_db)
    print(f"Niños JSON trend periods ({len(n_periods_json)}):", n_periods_json)

    conn.close()

if __name__ == '__main__':
    audit_json_vs_db()
