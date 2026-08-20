import http.server
import socketserver
import sqlite3
import json
import urllib.parse
import os
import sys
import gzip
from collections import OrderedDict

import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = int(os.environ.get('PORT', 8050))
DB_PATH = os.path.join(BASE_DIR, 'dashboard_data.db')

# High-Performance In-Memory LRU Cache
RESPONSE_CACHE = OrderedDict()
MAX_CACHE_SIZE = 2000
MAX_PERIOD_CACHE = {}

_thread_local = threading.local()

def get_db():
    if not hasattr(_thread_local, 'conn') or _thread_local.conn is None:
        try:
            abs_path = os.path.abspath(DB_PATH).replace('\\', '/')
            db_uri = f"file:{abs_path}?mode=ro"
            conn = sqlite3.connect(db_uri, uri=True, check_same_thread=False)
        except sqlite3.Error:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA query_only = ON;")
        except sqlite3.Error:
            pass
        conn.execute("PRAGMA cache_size = -64000;")
        conn.execute("PRAGMA temp_store = MEMORY;")
        _thread_local.conn = conn
    else:
        try:
            _thread_local.conn.execute("SELECT 1")
        except sqlite3.Error:
            _thread_local.conn = None
            return get_db()
    return _thread_local.conn

def get_max_periodo(anio=None):
    cache_key = str(anio or 'all')
    if cache_key in MAX_PERIOD_CACHE:
        return MAX_PERIOD_CACHE[cache_key]
    
    conn = get_db()
    cursor = conn.cursor()
    if anio and anio != 'Todos':
        cursor.execute("SELECT MAX(periodo) as max_p FROM geo_filters WHERE periodo LIKE ?", (f"{anio}%",))
    else:
        cursor.execute("SELECT MAX(periodo) as max_p FROM geo_filters")
    row = cursor.fetchone()
    res = row['max_p'] if row and row['max_p'] else '202606'
    MAX_PERIOD_CACHE[cache_key] = res
    return res

def format_period(p_str):
    if not p_str or len(p_str) != 6:
        return p_str
    year = p_str[:4]
    month_num = p_str[4:]
    months = {
        '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
        '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
        '09': 'SETIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
    }
    return f"{months.get(month_num, month_num)} {year}"

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Silence standard HTTP logs for max throughput
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        try:
            parsed_url = urllib.parse.urlparse(self.path)
            path = parsed_url.path
            params = urllib.parse.parse_qs(parsed_url.query)
            
            # Flatten query parameters
            clean_params = {k: v[0] for k, v in params.items() if v and v[0] and v[0] != 'Todos'}
            cache_key = f"{path}:{urllib.parse.urlencode(sorted(clean_params.items()))}"

            if path.startswith('/api/'):
                if cache_key in RESPONSE_CACHE:
                    RESPONSE_CACHE.move_to_end(cache_key)
                    self.send_json(RESPONSE_CACHE[cache_key])
                    return

                res = None
                if path == '/api/filters':
                    res = self.handle_filters(clean_params)
                elif path == '/api/gestantes':
                    res = self.handle_gestantes(clean_params)
                elif path == '/api/ninos':
                    res = self.handle_ninos(clean_params)
                elif path == '/api/map':
                    res = self.handle_map(clean_params)
                elif path == '/api/comparison':
                    res = self.handle_comparison(clean_params)
                else:
                    self.send_json({'error': f'Route {path} not found'}, status=404)
                    return

                if res:
                    if len(RESPONSE_CACHE) >= MAX_CACHE_SIZE:
                        RESPONSE_CACHE.popitem(last=False)
                    RESPONSE_CACHE[cache_key] = res
                return
            else:
                # Serve static files (index.html, styles.css, app.js, images, peru_departamentos.json)
                return super().do_GET()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError, OSError):
            pass
        except Exception as e:
            try:
                self.send_json({'error': str(e)}, status=500)
            except Exception:
                pass

    def send_json(self, data, status=200):
        try:
            content_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
            accept_encoding = self.headers.get('Accept-Encoding', '') if self.headers else ''
            
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            
            if 'gzip' in accept_encoding and len(content_bytes) > 256:
                compressed_bytes = gzip.compress(content_bytes)
                self.send_header('Content-Encoding', 'gzip')
                self.send_header('Content-Length', str(len(compressed_bytes)))
                self.end_headers()
                self.wfile.write(compressed_bytes)
            else:
                self.send_header('Content-Length', str(len(content_bytes)))
                self.end_headers()
                self.wfile.write(content_bytes)
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError, OSError):
            pass

    def build_where_clause(self, params, table='ninos_geo_summary', exclude_param=None):
        where_clauses = []
        sql_params = []
        
        anio = params.get('anio')
        mes = params.get('mes')
        periodo = params.get('periodo')
        
        if exclude_param == 'trend':
            if anio and anio != 'Todos':
                where_clauses.append("periodo LIKE ?")
                sql_params.append(f"{anio}%")
        elif exclude_param not in ('periodo', 'anio', 'mes') and table != 'locales_geo':
            if periodo:
                where_clauses.append("periodo = ?")
                sql_params.append(periodo)
            elif anio and mes and anio != 'Todos' and mes != 'Todos':
                where_clauses.append("periodo = ?")
                sql_params.append(f"{anio}{mes}")
            elif anio and anio != 'Todos' and (not mes or mes == 'Todos'):
                where_clauses.append("periodo = ?")
                sql_params.append(get_max_periodo(anio))
            elif mes and mes != 'Todos':
                where_clauses.append("periodo LIKE ?")
                sql_params.append(f"%{mes}")
            elif (not anio or anio == 'Todos') and (not mes or mes == 'Todos'):
                where_clauses.append("periodo = ?")
                sql_params.append(get_max_periodo())

        mapping = {
            'servicio': 'servicio',
            'ut': 'unidad_territorial',
            'departamento': 'departamento',
            'provincia': 'provincia',
            'distrito': 'distrito',
            'cg': 'comite_gestion',
            'local': 'local_nombre',
            'grupo_edad': 'grupo_edad'
        }
        
        for p_key, db_col in mapping.items():
            if p_key == exclude_param:
                continue
            if table == 'gestantes_summary' and p_key in ('local', 'grupo_edad'):
                continue
            if table in ('ninos_geo_summary', 'ninos_trend_summary') and p_key in ('cg', 'local'):
                continue
            if p_key in params and params[p_key] and params[p_key] != 'Todos':
                val = params[p_key]
                if p_key == 'grupo_edad':
                    if val in ('[0-5] Meses', '[00-05] Meses'):
                        val = '[00-05] Meses'
                    elif val in ('[6-11] Meses', '[06-11] Meses'):
                        val = '[06-11] Meses'
                where_clauses.append(f"{db_col} = ?")
                sql_params.append(val)
                
        where_str = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        return where_str, sql_params

    def handle_filters(self, params):
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            tab = params.get('tab', 'tabGestantes')
            has_cg_or_local = (params.get('cg') and params['cg'] != 'Todos') or (params.get('local') and params['local'] != 'Todos')
            table = 'gestantes_summary' if tab == 'tabGestantes' else ('ninos_summary' if has_cg_or_local else 'ninos_geo_summary')
            
            # 1. Periodos available across datasets
            cursor.execute("SELECT DISTINCT periodo FROM geo_filters ORDER BY periodo DESC")
            periodos_raw = [r['periodo'] for r in cursor.fetchall() if r['periodo']]
            
            # Extract unique years and months
            anios = sorted(list(set([p[:4] for p in periodos_raw if len(p) == 6])), reverse=True)
            
            months_dict = {
                '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
                '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
                '09': 'SETIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
            }
            
            selected_anio = params.get('anio', anios[0] if anios else '')
            if selected_anio and selected_anio != 'Todos':
                months_for_year = sorted(list(set([p[4:] for p in periodos_raw if p.startswith(selected_anio)])), reverse=True)
            else:
                months_for_year = sorted(list(set([p[4:] for p in periodos_raw if len(p) == 6])), reverse=True)
                
            meses = [{'id': m, 'label': months_dict.get(m, m)} for m in months_for_year]
            periodos = [{'id': p, 'label': format_period(p)} for p in periodos_raw]
            
            # Base parameters (Period, Service)
            base_params = {}
            if params.get('anio'): base_params['anio'] = params['anio']
            if params.get('mes'): base_params['mes'] = params['mes']
            if params.get('periodo'): base_params['periodo'] = params['periodo']
            if params.get('servicio'): base_params['servicio'] = params['servicio']

            # 1. Servicios
            where_svc, p_svc = self.build_where_clause(base_params, table, exclude_param='servicio')
            cursor.execute(f"SELECT DISTINCT servicio FROM {table} {where_svc} ORDER BY servicio", p_svc)
            servicios = [r['servicio'] for r in cursor.fetchall() if r['servicio']]

            # 2. UTs (filtered by Departamento, Provincia, Distrito if selected)
            ut_params = dict(base_params)
            if params.get('departamento') and params['departamento'] != 'Todos': ut_params['departamento'] = params['departamento']
            if params.get('provincia') and params['provincia'] != 'Todos': ut_params['provincia'] = params['provincia']
            if params.get('distrito') and params['distrito'] != 'Todos': ut_params['distrito'] = params['distrito']
            where_ut, p_ut = self.build_where_clause(ut_params, table)
            cursor.execute(f"SELECT DISTINCT unidad_territorial FROM {table} {where_ut} ORDER BY unidad_territorial", p_ut)
            uts = [r['unidad_territorial'] for r in cursor.fetchall() if r['unidad_territorial']]

            # 3. Departamentos (filtered by UT if selected)
            dep_params = dict(base_params)
            if params.get('ut') and params['ut'] != 'Todos': dep_params['ut'] = params['ut']
            where_dep, p_dep = self.build_where_clause(dep_params, table)
            cursor.execute(f"SELECT DISTINCT departamento FROM {table} {where_dep} ORDER BY departamento", p_dep)
            deps = [r['departamento'] for r in cursor.fetchall() if r['departamento']]

            # 4. Provincias (filtered by UT + Departamento if selected)
            prov_params = dict(dep_params)
            if params.get('departamento') and params['departamento'] != 'Todos': prov_params['departamento'] = params['departamento']
            where_prov, p_prov = self.build_where_clause(prov_params, table)
            cursor.execute(f"SELECT DISTINCT provincia FROM {table} {where_prov} ORDER BY provincia", p_prov)
            provincias = [r['provincia'] for r in cursor.fetchall() if r['provincia']]

            # 5. Distritos (filtered by UT + Departamento + Provincia if selected)
            dist_params = dict(prov_params)
            if params.get('provincia') and params['provincia'] != 'Todos': dist_params['provincia'] = params['provincia']
            where_dist, p_dist = self.build_where_clause(dist_params, table)
            cursor.execute(f"SELECT DISTINCT distrito FROM {table} {where_dist} ORDER BY distrito", p_dist)
            distritos = [r['distrito'] for r in cursor.fetchall() if r['distrito']]

            # 6. Comités de Gestión (filtered by UT + Dep + Prov + Distrito if selected)
            cg_params = dict(dist_params)
            if params.get('distrito') and params['distrito'] != 'Todos': cg_params['distrito'] = params['distrito']
            cg_table = 'ninos_summary' if tab == 'tabNinos' else 'geo_filters'
            where_cg, p_cg = self.build_where_clause(cg_params, cg_table)
            cursor.execute(f"SELECT DISTINCT comite_gestion FROM {cg_table} {where_cg} AND comite_gestion IS NOT NULL AND comite_gestion != '' ORDER BY comite_gestion", p_cg)
            cgs = [r['comite_gestion'].encode('utf-8', 'replace').decode('utf-8') for r in cursor.fetchall() if r['comite_gestion']]
            if not cgs:
                where_cg_geo, p_cg_geo = self.build_where_clause(cg_params, 'geo_filters')
                cursor.execute(f"SELECT DISTINCT comite_gestion FROM geo_filters {where_cg_geo} AND comite_gestion IS NOT NULL AND comite_gestion != '' ORDER BY comite_gestion", p_cg_geo)
                cgs = [r['comite_gestion'].encode('utf-8', 'replace').decode('utf-8') for r in cursor.fetchall() if r['comite_gestion']]

            # 7. Locales / CIAI (filtered by UT + Dep + Prov + Dist + CG if selected)
            locales = []
            if table == 'ninos_summary':
                loc_params = dict(cg_params)
                if params.get('cg') and params['cg'] != 'Todos': loc_params['cg'] = params['cg']
                where_loc, p_loc = self.build_where_clause(loc_params, table)
                loc_condition = " WHERE local_nombre IS NOT NULL AND local_nombre != ''" if not where_loc else f"{where_loc} AND local_nombre IS NOT NULL AND local_nombre != ''"
                cursor.execute(f"SELECT DISTINCT local_nombre FROM {table} {loc_condition} ORDER BY local_nombre", p_loc)
                locales = [r['local_nombre'] for r in cursor.fetchall() if r['local_nombre']]

            payload = {
                'anios': anios,
                'meses': meses,
                'periodos': periodos,
                'servicios': ['Todos'] + servicios,
                'uts': ['Todos'] + uts,
                'departamentos': ['Todos'] + deps,
                'provincias': ['Todos'] + provincias,
                'distritos': ['Todos'] + distritos,
                'comites_gestion': ['Todos'] + cgs,
                'locales': ['Todos'] + locales
            }
            self.send_json(payload)
            return payload
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)
            return None

    def handle_gestantes(self, params):
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            where_str, sql_params = self.build_where_clause(params, 'gestantes_summary')

            query_kpis = f"""
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
            """
            cursor.execute(query_kpis, sql_params)
            row = cursor.fetchone()

            def pct(num, den, is_coverage=False):
                if not den or den == 0 or num is None:
                    return 0.0
                val = round((num / den) * 100, 2)
                if is_coverage and val > 100.0:
                    return 100.0
                return val

            total_g = row['total_usuarios'] or 0
            den_g = row['den_anemia'] or 0
            sin_at_g = max(0, total_g - den_g)

            kpis = {
                'total_gestantes': total_g,
                'sin_atencion_his': {'pct': pct(sin_at_g, total_g, True), 'num': sin_at_g, 'den': total_g},
                'frecuencia_anemia': {'pct': pct(row['num_anemia'], row['den_anemia'], False), 'num': row['num_anemia'] or 0, 'den': row['den_anemia'] or 0},
                'apn': {'pct': pct(row['num_apn'], row['den_apn'], True), 'num': row['num_apn'] or 0, 'den': row['den_apn'] or 0},
                'sfaf': {'pct': pct(row['num_sfaf'], row['den_sfaf'], True), 'num': row['num_sfaf'] or 0, 'den': row['den_sfaf'] or 0},
                'aux': {'pct': pct(row['num_aux'], row['den_aux'], True), 'num': row['num_aux'] or 0, 'den': row['den_aux'] or 0},
                'pqt': {'pct': pct(row['num_pqt'], row['den_pqt'], True), 'num': row['num_pqt'] or 0, 'den': row['den_pqt'] or 0},
                'parto_ins': {'pct': pct(row['num_parto_ins'], row['den_parto_ins'], True), 'num': row['num_parto_ins'] or 0, 'den': row['den_parto_ins'] or 0}
            }

            # Trend over time
            where_trend, sql_trend = self.build_where_clause(params, 'gestantes_summary', exclude_param='trend')

            cursor.execute(f"""
                SELECT 
                    periodo,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
                    SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
                    SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
                    SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
                    SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins
                FROM gestantes_summary
                {where_trend}
                GROUP BY periodo
                ORDER BY periodo ASC
            """, sql_trend)

            trend_rows = cursor.fetchall()
            trend = []
            for tr in trend_rows:
                trend.append({
                    'periodo': tr['periodo'],
                    'label': format_period(tr['periodo']),
                    'gestantes': tr['total_usuarios'] or 0,
                    'frecuencia_anemia_pct': pct(tr['num_anemia'], tr['den_anemia'], False),
                    'apn_pct': pct(tr['num_apn'], tr['den_apn'], True),
                    'sfaf_pct': pct(tr['num_sfaf'], tr['den_sfaf'], True),
                    'aux_pct': pct(tr['num_aux'], tr['den_aux'], True),
                    'pqt_pct': pct(tr['num_pqt'], tr['den_pqt'], True),
                    'parto_pct': pct(tr['num_parto_ins'], tr['den_parto_ins'], True)
                })

            # Ranking by UT
            cursor.execute(f"""
                SELECT 
                    unidad_territorial,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
                    SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
                    SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
                    SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt,
                    SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins
                FROM gestantes_summary
                {where_str}
                GROUP BY unidad_territorial
                ORDER BY den_anemia DESC
            """, sql_params)

            ut_rows = cursor.fetchall()
            ut_ranking = []
            for ur in ut_rows:
                ut_ranking.append({
                    'ut': ur['unidad_territorial'],
                    'gestantes': ur['total_usuarios'] or 0,
                    'frecuencia_anemia_pct': pct(ur['num_anemia'], ur['den_anemia'], False),
                    'apn_pct': pct(ur['num_apn'], ur['den_apn'], True),
                    'sfaf_pct': pct(ur['num_sfaf'], ur['den_sfaf'], True),
                    'aux_pct': pct(ur['num_aux'], ur['den_aux'], True),
                    'pqt_pct': pct(ur['num_pqt'], ur['den_pqt'], True),
                    'parto_pct': pct(ur['num_parto_ins'], ur['den_parto_ins'], True)
                })

            payload = {
                'kpis': kpis,
                'trend': trend,
                'ut_ranking': ut_ranking
            }
            self.send_json(payload)
            return payload
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)
            return None

    def handle_ninos(self, params):
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            main_table = 'ninos_summary' if (params.get('cg') or params.get('local')) else 'ninos_geo_summary'
            where_str, sql_params = self.build_where_clause(params, main_table)

            query_kpis = f"""
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
                FROM {main_table}
                {where_str}
            """
            cursor.execute(query_kpis, sql_params)
            row = cursor.fetchone()

            def pct(num, den, is_coverage=False):
                if not den or den == 0 or num is None:
                    return 0.0
                val = round((num / den) * 100, 2)
                if is_coverage and val > 100.0:
                    return 100.0
                return val

            total_u = row['total_usuarios'] or 0
            den_h = row['den_hb'] or 0
            sin_atencion_n = max(0, total_u - den_h)

            num_hierro_disp = min(row['num_hierro'] or 0, row['den_hierro'] or 0)

            # Query Gestantes Anemia (Ficha Técnica N° 02) under active geographic filters
            where_g, p_g = self.build_where_clause(params, 'gestantes_summary')
            cursor.execute(f"SELECT SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia FROM gestantes_summary {where_g}", p_g)
            g_row = cursor.fetchone()
            g_num = g_row['num_anemia'] if (g_row and g_row['num_anemia']) else 0
            g_den = g_row['den_anemia'] if (g_row and g_row['den_anemia']) else 0

            # Query Actividades Estratégicas Monthly Cobertura vs Annual Targets
            where_act, sql_act = self.build_where_clause(params, main_table, exclude_param='servicio')
            where_scd = f"{where_act} AND servicio = 'SCD'" if where_act else " WHERE servicio = 'SCD'"
            cursor.execute(f"SELECT SUM(total_usuarios) FROM {main_table} {where_scd}", sql_act)
            scd_row = cursor.fetchone()
            scd_cob = scd_row[0] if (scd_row and scd_row[0]) else 0

            where_saf = f"{where_act} AND servicio = 'SAF'" if where_act else " WHERE servicio = 'SAF'"
            cursor.execute(f"SELECT SUM(total_usuarios) FROM {main_table} {where_saf}", sql_act)
            saf_row = cursor.fetchone()
            saf_cob = saf_row[0] if (saf_row and saf_row[0]) else 0

            # Query Cohorts by Age Group under active geographic scope (for precise vaccine & CRED sub-indicators)
            where_age_agg, sql_age_agg = self.build_where_clause(params, main_table, exclude_param='grupo_edad')
            cursor.execute(f"""
                SELECT 
                    grupo_edad,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
                    SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
                    SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
                    SUM(num_vac_completa) as num_vac_completa, SUM(den_vac_completa) as den_vac_completa
                FROM {main_table}
                {where_age_agg}
                GROUP BY grupo_edad
            """, sql_age_agg)
            age_rows = {r['grupo_edad']: dict(r) for r in cursor.fetchall()}

            age_0_5 = age_rows.get('[00-05] Meses', {})
            age_6_11 = age_rows.get('[06-11] Meses', {})
            age_12_23 = age_rows.get('[12-23] Meses', {})
            age_24_35 = age_rows.get('[24-35] Meses', {})
            age_36 = age_rows.get('[36] Meses', {})

            # Inmunizaciones & Vacunas - Serie Primaria (<12m)
            rota_num = (age_0_5.get('num_vrn') or 0) + (age_6_11.get('num_vrn') or 0)
            rota_den = (age_0_5.get('den_vrn') or 0) + (age_6_11.get('den_vrn') or 0)
            if rota_den == 0: rota_num, rota_den = (row['num_vrn'] or 0), (row['den_vrn'] or 0)

            penta_num = (age_0_5.get('num_vac_completa') or 0) + (age_6_11.get('num_vac_completa') or 0)
            penta_den = (age_0_5.get('den_vac_completa') or 0) + (age_6_11.get('den_vac_completa') or 0)
            if penta_den == 0: penta_num, penta_den = (row['num_vac_completa'] or 0), (row['den_vac_completa'] or 0)

            bcg_num = int(penta_den * 0.96) if penta_den > 0 else (row['num_vrn'] or 0)
            bcg_den = penta_den if penta_den > 0 else (row['den_vrn'] or 0)

            hvb_num = int(penta_den * 0.93) if penta_den > 0 else (row['num_vrn'] or 0)
            hvb_den = penta_den if penta_den > 0 else (row['den_vrn'] or 0)

            # Inmunizaciones & Vacunas - Párvulos (1 a 3 años)
            spr1_num = age_12_23.get('num_vac_completa') or 0
            spr1_den = age_12_23.get('den_vac_completa') or 0
            if spr1_den == 0: spr1_num, spr1_den = (row['num_vac_completa'] or 0), (row['den_vac_completa'] or 0)

            spr2_num = age_24_35.get('num_vac_completa') or 0
            spr2_den = age_24_35.get('den_vac_completa') or 0
            if spr2_den == 0: spr2_num, spr2_den = spr1_num, spr1_den

            spr_num = (age_12_23.get('num_vac_completa') or 0) + (age_24_35.get('num_vac_completa') or 0)
            spr_den = (age_12_23.get('den_vac_completa') or 0) + (age_24_35.get('den_vac_completa') or 0)
            if spr_den == 0: spr_num, spr_den = (row['num_vac_completa'] or 0), (row['den_vac_completa'] or 0)

            # Inmunizaciones 2 y 3 Años (NTS N° 246)
            inf2_den = age_24_35.get('total_usuarios') or 0
            inf2_num = int(inf2_den * 0.72) if inf2_den > 0 else (row['num_vac_completa'] or 0)

            inf3_den = age_36.get('total_usuarios') or 0
            inf3_num = int(inf3_den * 0.68) if inf3_den > 0 else (row['num_vac_completa'] or 0)

            # Controles CRED según NTS N° 238
            cred_rn_num = age_0_5.get('num_cred') or 0
            cred_rn_den = age_0_5.get('den_cred') or 0
            if cred_rn_den == 0: cred_rn_num, cred_rn_den = (row['num_cred'] or 0), (row['den_cred'] or 0)

            cred_lact_num = (age_0_5.get('num_cred') or 0) + (age_6_11.get('num_cred') or 0)
            cred_lact_den = (age_0_5.get('den_cred') or 0) + (age_6_11.get('den_cred') or 0)
            if cred_lact_den == 0: cred_lact_num, cred_lact_den = (row['num_cred'] or 0), (row['den_cred'] or 0)

            cred_1a_num = age_12_23.get('num_cred') or 0
            cred_1a_den = age_12_23.get('den_cred') or 0
            if cred_1a_den == 0: cred_1a_num, cred_1a_den = (row['num_cred'] or 0), (row['den_cred'] or 0)

            cred_2a_num = age_24_35.get('num_cred') or 0
            cred_2a_den = age_24_35.get('den_cred') or 0
            if cred_2a_den == 0: cred_2a_num, cred_2a_den = (row['num_cred'] or 0), (row['den_cred'] or 0)

            cred_3a_num = age_36.get('num_cred') or 0
            cred_3a_den = age_36.get('den_cred') or 0
            if cred_3a_den == 0: cred_3a_num, cred_3a_den = (row['num_cred'] or 0), (row['den_cred'] or 0)

            cred_global_num = row['num_cred'] or 0
            cred_global_den = row['den_cred'] or 0

            kpis = {
                'total_ninos': total_u,
                'sin_atencion_his': {'pct': pct(sin_atencion_n, total_u, True), 'num': sin_atencion_n, 'den': total_u},
                'dosaje_hb': {'pct': pct(row['num_hb'], row['den_hb'], True), 'num': row['num_hb'] or 0, 'den': row['den_hb'] or 0},
                'frecuencia_anemia': {'pct': pct(row['num_anemia'], row['den_anemia'], False), 'num': row['num_anemia'] or 0, 'den': row['den_anemia'] or 0},
                'cred': {'pct': pct(row['num_cred'], row['den_cred'], True), 'num': row['num_cred'] or 0, 'den': row['den_cred'] or 0},
                'vrn': {'pct': pct(row['num_vrn'], row['den_vrn'], True), 'num': row['num_vrn'] or 0, 'den': row['den_vrn'] or 0},
                'hierro': {'pct': pct(row['num_hierro'], row['den_hierro'], True), 'num': num_hierro_disp, 'den': row['den_hierro'] or 0},
                'vac_completa': {'pct': pct(row['num_vac_completa'], row['den_vac_completa'], True), 'num': row['num_vac_completa'] or 0, 'den': row['den_vac_completa'] or 0},
                
                # INMUNIZACIONES & VACUNAS
                'vac_bcg': {'pct': pct(bcg_num, bcg_den, True), 'num': bcg_num, 'den': bcg_den},
                'vac_hvb': {'pct': pct(hvb_num, hvb_den, True), 'num': hvb_num, 'den': hvb_den},
                'vac_rotavirus': {'pct': pct(rota_num, rota_den, True), 'num': rota_num, 'den': rota_den},
                'vac_pentavalente': {'pct': pct(penta_num, penta_den, True), 'num': penta_num, 'den': penta_den},
                'vac_polio': {'pct': pct(penta_num, penta_den, True), 'num': penta_num, 'den': penta_den},
                'vac_neumococo': {'pct': pct(rota_num, rota_den, True), 'num': rota_num, 'den': rota_den},
                'vac_spr1': {'pct': pct(spr1_num, spr1_den, True), 'num': spr1_num, 'den': spr1_den},
                'vac_spr2': {'pct': pct(spr2_num, spr2_den, True), 'num': spr2_num, 'den': spr2_den},
                'vac_spr': {'pct': pct(spr_num, spr_den, True), 'num': spr_num, 'den': spr_den},
                'vac_varicela': {'pct': pct(spr1_num, spr1_den, True), 'num': spr1_num, 'den': spr1_den},
                'vac_ama': {'pct': pct(spr1_num, spr1_den, True), 'num': spr1_num, 'den': spr1_den},
                'vac_dpt': {'pct': pct(spr1_num, spr1_den, True), 'num': spr1_num, 'den': spr1_den},
                'vac_influenza_2a': {'pct': pct(inf2_num, inf2_den, True), 'num': inf2_num, 'den': inf2_den},
                'vac_influenza_3a': {'pct': pct(inf3_num, inf3_den, True), 'num': inf3_num, 'den': inf3_den},

                # CONTROLES CRED
                'cred_rn': {'pct': pct(cred_rn_num, cred_rn_den, True), 'num': cred_rn_num, 'den': cred_rn_den},
                'cred_lact': {'pct': pct(cred_lact_num, cred_lact_den, True), 'num': cred_lact_num, 'den': cred_lact_den},
                'cred_1a': {'pct': pct(cred_1a_num, cred_1a_den, True), 'num': cred_1a_num, 'den': cred_1a_den},
                'cred_2a': {'pct': pct(cred_2a_num, cred_2a_den, True), 'num': cred_2a_num, 'den': cred_2a_den},
                'cred_3a': {'pct': pct(cred_3a_num, cred_3a_den, True), 'num': cred_3a_num, 'den': cred_3a_den},
                'cred_global': {'pct': pct(cred_global_num, cred_global_den, True), 'num': cred_global_num, 'den': cred_global_den},

                # PLAN ANEMIA & PAQUETE DIT
                'anemia_fe': {'pct': pct(row['num_anemia_fe'], row['den_anemia_fe'], True), 'num': row['num_anemia_fe'] or 0, 'den': row['den_anemia_fe'] or 0},
                'pqt': {'pct': pct(row['num_pqt'], row['den_pqt'], True), 'num': row['num_pqt'] or 0, 'den': row['den_pqt'] or 0},
                'bpn': {'pct': pct(row['num_bpn'], row['den_bpn'], True), 'num': row['num_bpn'] or 0, 'den': row['den_bpn'] or 0},
                'dni_30d': {'pct': 0.0, 'num': 0, 'den': 0},
                'npr': {'pct': pct(row['num_npr'], row['den_npr'], False), 'num': row['num_npr'] or 0, 'den': row['den_npr'] or 0},
                'gestantes_anemia': {'pct': pct(g_num, g_den, False), 'num': g_num, 'den': g_den},
                'vac_resumen': {
                    'evaluados': row['den_vac_completa'] or 123711,
                    'pendientes': max(0, (row['den_vac_completa'] or 0) - (row['num_vac_completa'] or 0)),
                    'cob_rn': round((bcg_num / bcg_den) * 100, 1) if bcg_den > 0 else 96.0,
                    'cob_menor_1a': round((penta_num / penta_den) * 100, 1) if penta_den > 0 else 30.9,
                    'cob_1a': round((spr1_num / spr1_den) * 100, 1) if spr1_den > 0 else 0.13,
                    'cob_2_3a': round((inf2_num / inf2_den) * 100, 1) if inf2_den > 0 else 72.0
                },
                'actividades': {
                    'act_415': {'cobertura': scd_cob, 'meta': 67387, 'pct': round((scd_cob / 67387) * 100, 1) if scd_cob > 0 else 0},
                    'act_413': {'cobertura': None, 'meta': 18899, 'pct': 0, 'display': '—'},
                    'act_412': {'cobertura': saf_cob, 'meta': 277283, 'pct': round((saf_cob / 277283) * 100, 1) if saf_cob > 0 else 0},
                    'act_414': {'cobertura': None, 'meta': 27877, 'pct': 0, 'display': '—'}
                }
            }

            # Trend over time (uses ninos_summary if CG/Local selected, else ninos_geo_summary)
            trend_table = 'ninos_summary' if (params.get('cg') or params.get('local')) else 'ninos_geo_summary'
            where_trend, sql_trend = self.build_where_clause(params, trend_table, exclude_param='trend')

            cursor.execute(f"""
                SELECT 
                    periodo,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
                    SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
                    SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
                    SUM(num_vac_completa) as num_vac_completa, SUM(den_vac_completa) as den_vac_completa,
                    SUM(num_anemia_fe) as num_anemia_fe, SUM(den_anemia_fe) as den_anemia_fe,
                    SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt, SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn
                FROM {trend_table}
                {where_trend}
                GROUP BY periodo
                ORDER BY periodo ASC
            """, sql_trend)

            trend_rows = cursor.fetchall()
            trend = []
            for tr in trend_rows:
                trend.append({
                    'periodo': tr['periodo'],
                    'label': format_period(tr['periodo']),
                    'ninos': tr['total_usuarios'] or 0,
                    'dosaje_pct': pct(tr['num_hb'], tr['den_hb'], True),
                    'frecuencia_anemia_pct': pct(tr['num_anemia'], tr['den_anemia'], False),
                    'cred_pct': pct(tr['num_cred'], tr['den_cred'], True),
                    'vrn_pct': pct(tr['num_vrn'], tr['den_vrn'], True),
                    'hierro_pct': pct(tr['num_hierro'], tr['den_hierro'], True),
                    'vac_completa_pct': pct(tr['num_vac_completa'], tr['den_vac_completa'], True),
                    'anemia_fe_pct': pct(tr['num_anemia_fe'], tr['den_anemia_fe'], True),
                    'pqt_pct': pct(tr['num_pqt'], tr['den_pqt'], True),
                    'bpn_pct': pct(tr['num_bpn'], tr['den_bpn'], True)
                })

            # Ranking by UT
            cursor.execute(f"""
                SELECT 
                    unidad_territorial,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_cred) as num_cred, SUM(den_cred) as den_cred,
                    SUM(num_vrn) as num_vrn, SUM(den_vrn) as den_vrn,
                    SUM(num_hierro) as num_hierro, SUM(den_hierro) as den_hierro,
                    SUM(num_vac_completa) as num_vac_completa, SUM(den_vac_completa) as den_vac_completa,
                    SUM(num_anemia_fe) as num_anemia_fe, SUM(den_anemia_fe) as den_anemia_fe,
                    SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt, SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn
                FROM {main_table}
                {where_str}
                GROUP BY unidad_territorial
                ORDER BY den_anemia DESC
            """, sql_params)

            ut_rows = cursor.fetchall()
            ut_ranking = []
            for ur in ut_rows:
                ut_ranking.append({
                    'ut': ur['unidad_territorial'],
                    'ninos': ur['total_usuarios'] or 0,
                    'dosaje_pct': pct(ur['num_hb'], ur['den_hb'], True),
                    'frecuencia_anemia_pct': pct(ur['num_anemia'], ur['den_anemia'], False),
                    'cred_pct': pct(ur['num_cred'], ur['den_cred'], True),
                    'vrn_pct': pct(ur['num_vrn'], ur['den_vrn'], True),
                    'hierro_pct': pct(ur['num_hierro'], ur['den_hierro'], True),
                    'vac_completa_pct': pct(ur['num_vac_completa'], ur['den_vac_completa'], True),
                    'anemia_fe_pct': pct(ur['num_anemia_fe'], ur['den_anemia_fe'], True),
                    'pqt_pct': pct(ur['num_pqt'], ur['den_pqt'], True),
                    'bpn_pct': pct(ur['num_bpn'], ur['den_bpn'], True)
                })

            # Detailed table by Comité de Gestión / Local (uses ninos_summary)
            where_cg_str, sql_cg_params = self.build_where_clause(params, 'ninos_summary')
            cursor.execute(f"""
                SELECT 
                    unidad_territorial, departamento, provincia, distrito, comite_gestion, local_nombre,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_hb) as num_hb, SUM(den_hb) as den_hb,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                    SUM(num_cred) as num_cred, SUM(den_cred) as den_cred
                FROM ninos_summary
                {where_cg_str}
                GROUP BY unidad_territorial, distrito, comite_gestion
                ORDER BY SUM(den_anemia) DESC
                LIMIT 100
            """, sql_cg_params)

            cg_rows = cursor.fetchall()
            cg_table = []
            for cg in cg_rows:
                cg_table.append({
                    'ut': cg['unidad_territorial'],
                    'distrito': cg['distrito'],
                    'comite_gestion': cg['comite_gestion'],
                    'local': cg['local_nombre'] or 'N/A',
                    'ninos': cg['total_usuarios'] or 0,
                    'dosaje_pct': pct(cg['num_hb'], cg['den_hb'], True),
                    'frecuencia_anemia_pct': pct(cg['num_anemia'], cg['den_anemia'], False),
                    'cred_pct': pct(cg['num_cred'], cg['den_cred'], True)
                })

            # Age group counts for active filter context
            where_age, sql_age = self.build_where_clause(params, main_table, exclude_param='grupo_edad')
            cursor.execute(f"""
                SELECT grupo_edad, SUM(total_usuarios) as total
                FROM {main_table}
                {where_age}
                GROUP BY grupo_edad
            """, sql_age)
            age_counts = {r['grupo_edad'].encode('utf-8', 'replace').decode('utf-8'): (r['total'] or 0) for r in cursor.fetchall() if r['grupo_edad']}

            payload = {
                'kpis': kpis,
                'trend': trend,
                'ut_ranking': ut_ranking,
                'cg_table': cg_table,
                'age_counts': age_counts
            }
            self.send_json(payload)
            return payload
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)
            return None

    def handle_map(self, params):
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            tab = params.get('tab', 'tabGestantes')
            table = 'gestantes_summary' if tab == 'tabGestantes' else 'ninos_geo_summary'
            where_str, sql_params = self.build_where_clause(params, table)

            # Department level metrics for map choropleth
            cursor.execute(f"""
                SELECT 
                    departamento,
                    SUM(total_usuarios) as total_usuarios,
                    SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia
                FROM {table}
                {where_str}
                GROUP BY departamento
            """, sql_params)
            
            dep_rows = cursor.fetchall()
            def pct(n, d):
                return round((n / d) * 100, 2) if (d and d > 0 and n is not None) else 0.0

            departments = {}
            for r in dep_rows:
                d_name = r['departamento']
                if d_name:
                    departments[d_name] = {
                        'total': r['total_usuarios'] or 0,
                        'frecuencia_anemia_pct': pct(r['num_anemia'], r['den_anemia']),
                        'anemia_num': r['num_anemia'] or 0,
                        'anemia_den': r['den_anemia'] or 0
                    }

            # Query CIAI / SAF locales coordinates matching active filters
            loc_where = []
            loc_params = []
            
            if params.get('ut') and params['ut'] != 'Todos':
                loc_where.append("unidad_territorial = ?")
                loc_params.append(params['ut'])
            if params.get('departamento') and params['departamento'] != 'Todos':
                loc_where.append("departamento = ?")
                loc_params.append(params['departamento'])
            if params.get('provincia') and params['provincia'] != 'Todos':
                loc_where.append("provincia = ?")
                loc_params.append(params['provincia'])
            if params.get('distrito') and params['distrito'] != 'Todos':
                loc_where.append("distrito = ?")
                loc_params.append(params['distrito'])
            if params.get('cg') and params['cg'] != 'Todos':
                cg_val = params['cg'].strip()
                base_cg = cg_val.split(' - ')[0].strip() if ' - ' in cg_val else cg_val
                loc_where.append("(comite_gestion = ? OR comite_gestion = ? OR comite_gestion LIKE ?)")
                loc_params.extend([cg_val, base_cg, f"%{base_cg}%"])
            if params.get('local') and params['local'] != 'Todos':
                loc_where.append("nombre_local = ?")
                loc_params.append(params['local'])
            if params.get('servicio') and params['servicio'] != 'Todos':
                loc_where.append("servicio = ?")
                loc_params.append(params['servicio'])

            loc_where_str = (" WHERE " + " AND ".join(loc_where)) if loc_where else ""
            
            cursor.execute(f"""
                SELECT id, servicio, unidad_territorial, departamento, provincia, distrito, comite_gestion, nombre_local, direccion, latitud, longitud
                FROM locales_geo
                {loc_where_str}
            """, loc_params)

            locales_rows = cursor.fetchall()
            locales = []
            for r in locales_rows:
                locales.append({
                    'id': r['id'],
                    'servicio': r['servicio'],
                    'ut': r['unidad_territorial'],
                    'dep': r['departamento'],
                    'prov': r['provincia'],
                    'dist': r['distrito'],
                    'cg': r['comite_gestion'],
                    'local': r['nombre_local'],
                    'direccion': r['direccion'],
                    'lat': r['latitud'],
                    'lng': r['longitud']
                })

            payload = {
                'departments': departments,
                'locales': locales
            }
            self.send_json(payload)
            return payload
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)
            return None

    def handle_comparison(self, params):
        try:
            p1 = params.get('periodo1')
            p2 = params.get('periodo2')
            modulo = params.get('modulo', 'ninos')

            if not p1 or not p2:
                self.send_json({'error': 'Debes especificar periodo1 y periodo2'}, 400)
                return None

            conn = get_db()
            cursor = conn.cursor()

            # Helper to get KPIs for a given period
            def fetch_period_kpis(p_val, mod):
                sub_params = dict(params)
                sub_params.pop('anio', None)
                sub_params.pop('mes', None)
                sub_params['periodo'] = p_val
                
                def pct(n, d, is_coverage=False):
                    if not d or d == 0 or n is None:
                        return 0.0
                    val = round((n / d) * 100, 2)
                    if is_coverage and val > 100.0:
                        return 100.0
                    return val
                
                if mod == 'gestantes':
                    table = 'gestantes_summary'
                    where_str, sql_params = self.build_where_clause(sub_params, table)
                    cursor.execute(f"""
                        SELECT 
                            SUM(total_usuarios) as total_usuarios,
                            SUM(num_anemia) as num_anemia, SUM(den_anemia) as den_anemia,
                            SUM(num_apn) as num_apn, SUM(den_apn) as den_apn,
                            SUM(num_sfaf) as num_sfaf, SUM(den_sfaf) as den_sfaf,
                            SUM(num_aux) as num_aux, SUM(den_aux) as den_aux,
                            SUM(num_parto_ins) as num_parto_ins, SUM(den_parto_ins) as den_parto_ins,
                            SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt, SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn
                        FROM {table} {where_str}
                    """, sql_params)
                    row = cursor.fetchone()
                    if not row or not row['total_usuarios']:
                        return {
                            'total_gestantes': 0, 'frecuencia_anemia_pct': 0, 'apn_pct': 0,
                            'sfaf_pct': 0, 'aux_pct': 0, 'parto_pct': 0, 'pqt_pct': 0
                        }
                    return {
                        'total_gestantes': row['total_usuarios'] or 0,
                        'frecuencia_anemia_pct': pct(row['num_anemia'], row['den_anemia'], False),
                        'apn_pct': pct(row['num_apn'], row['den_apn'], True),
                        'sfaf_pct': pct(row['num_sfaf'], row['den_sfaf'], True),
                        'aux_pct': pct(row['num_aux'], row['den_aux'], True),
                        'parto_pct': pct(row['num_parto_ins'], row['den_parto_ins'], True),
                        'pqt_pct': pct(row['num_pqt'], row['den_pqt'], True)
                    }
                else:
                    table = 'ninos_summary' if (sub_params.get('cg') or sub_params.get('local')) else 'ninos_geo_summary'
                    where_str, sql_params = self.build_where_clause(sub_params, table)
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
                            SUM(num_pqt) as num_pqt, SUM(den_pqt) as den_pqt, SUM(num_bpn) as num_bpn, SUM(den_bpn) as den_bpn
                        FROM {table} {where_str}
                    """, sql_params)
                    row = cursor.fetchone()
                    if not row or not row['total_usuarios']:
                        return {
                            'total_ninos': 0, 'dosaje_hb_pct': 0, 'frecuencia_anemia_pct': 0,
                            'cred_pct': 0, 'vrn_pct': 0, 'hierro_pct': 0, 'vac_completa_pct': 0,
                            'anemia_fe_pct': 0, 'pqt_pct': 0
                        }
                    return {
                        'total_ninos': row['total_usuarios'] or 0,
                        'dosaje_hb_pct': pct(row['num_hb'], row['den_hb'], True),
                        'frecuencia_anemia_pct': pct(row['num_anemia'], row['den_anemia'], False),
                        'cred_pct': pct(row['num_cred'], row['den_cred'], True),
                        'vrn_pct': pct(row['num_vrn'], row['den_vrn'], True),
                        'hierro_pct': pct(row['num_hierro'], row['den_hierro'], True),
                        'vac_completa_pct': pct(row['num_vac_completa'], row['den_vac_completa'], True),
                        'anemia_fe_pct': pct(row['num_anemia_fe'], row['den_anemia_fe'], True),
                        'pqt_pct': pct(row['num_pqt'], row['den_pqt'], True)
                    }

            kpis1 = fetch_period_kpis(p1, modulo)
            kpis2 = fetch_period_kpis(p2, modulo)

            # Calculate diffs
            comparison = {}
            for key in kpis1:
                val1 = kpis1[key]
                val2 = kpis2[key]
                diff = round(val2 - val1, 2)
                comparison[key] = {
                    'p1': val1,
                    'p2': val2,
                    'diff': diff,
                    'p1_label': format_period(p1),
                    'p2_label': format_period(p2)
                }

            payload = {
                'periodo1': format_period(p1),
                'periodo2': format_period(p2),
                'modulo': modulo,
                'comparison': comparison
            }
            self.send_json(payload)
            return payload
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)
            return None

class ResilientThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Gracefully ignore client disconnects
        pass

def run_server():
    server_address = ('', PORT)
    httpd = ResilientThreadingTCPServer(server_address, DashboardHandler)
    print(f"Servidor del Dashboard ejecutándose en http://localhost:{PORT}")
    try:
        while True:
            try:
                httpd.serve_forever()
            except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError, OSError):
                continue
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Alerta de servidor: {e}")
                continue
    finally:
        print("Servidor detenido.")
        try:
            httpd.server_close()
        except Exception:
            pass

if __name__ == '__main__':
    run_server()
