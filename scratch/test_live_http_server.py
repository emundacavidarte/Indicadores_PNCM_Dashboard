import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import time
import json
import socketserver
import threading
import urllib.request
import gzip

import server

def test_live_http_server():
    print("Testing live HTTP server over TCP socket...")
    
    # Start server on alternate port 8059 to avoid port conflicts
    server_port = 8059
    server.PORT = server_port
    
    server_address = ('127.0.0.1', server_port)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(server_address, server.DashboardHandler)
    httpd.daemon_threads = True
    
    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    time.sleep(0.5)
    
    base_url = f"http://127.0.0.1:{server_port}"
    
    try:
        # Test 1: OPTIONS /api/ninos (CORS Preflight)
        req_opt = urllib.request.Request(f"{base_url}/api/ninos", method='OPTIONS')
        with urllib.request.urlopen(req_opt) as resp:
            print(f"[PASS] OPTIONS status: {resp.status}")
            headers = dict(resp.headers)
            assert headers.get('Access-Control-Allow-Origin') == '*', "CORS header missing"
            print("[PASS] CORS headers present on OPTIONS request.")

        # Test 2: GET /api/ninos with GZIP encoding
        req_gzip = urllib.request.Request(f"{base_url}/api/ninos?periodo=202606", headers={'Accept-Encoding': 'gzip'})
        with urllib.request.urlopen(req_gzip) as resp:
            print(f"[PASS] GET /api/ninos status: {resp.status}")
            assert resp.headers.get('Content-Encoding') == 'gzip', "GZIP header missing"
            raw_data = resp.read()
            decompressed = gzip.decompress(raw_data)
            json_data = json.loads(decompressed.decode('utf-8'))
            assert 'kpis' in json_data, "KPIs missing from JSON response"
            print("[PASS] GZIP decompression successful and valid JSON received.")

        # Test 3: GET /api/filters with tabGestantes
        req_filt = urllib.request.Request(f"{base_url}/api/filters?tab=tabGestantes&periodo=202606")
        with urllib.request.urlopen(req_filt) as resp:
            raw_data = resp.read()
            json_data = json.loads(raw_data.decode('utf-8'))
            assert 'departamentos' in json_data, "Departamentos missing from filter payload"
            print("[PASS] GET /api/filters returned valid payload.")

        # Test 4: GET /api/map
        req_map = urllib.request.Request(f"{base_url}/api/map?periodo=202606")
        with urllib.request.urlopen(req_map) as resp:
            raw_data = resp.read()
            json_data = json.loads(raw_data.decode('utf-8'))
            assert 'departments' in json_data and 'locales' in json_data, "Map payload incomplete"
            print("[PASS] GET /api/map returned valid payload with departments and locales.")

        # Test 5: GET /api/comparison
        req_comp = urllib.request.Request(f"{base_url}/api/comparison?periodo1=202506&periodo2=202606&modulo=ninos")
        with urllib.request.urlopen(req_comp) as resp:
            raw_data = resp.read()
            json_data = json.loads(raw_data.decode('utf-8'))
            assert 'comparison' in json_data, "Comparison key missing"
            print("[PASS] GET /api/comparison returned valid payload.")

    finally:
        httpd.shutdown()
        httpd.server_close()
        print("Live HTTP server test completed.")

if __name__ == '__main__':
    test_live_http_server()
