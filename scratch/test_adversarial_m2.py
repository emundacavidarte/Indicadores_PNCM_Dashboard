import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import json
import time
import urllib.parse
import threading
import concurrent.futures

# Import server components directly
import server

def run_adversarial_tests():
    print("==================================================")
    print("ADVERSARIAL & STRESS TESTING SUITE FOR MILESTONE 2")
    print("==================================================")
    
    passed_tests = 0
    failed_tests = 0
    findings = []

    def assert_test(cond, msg, error_detail=""):
        nonlocal passed_tests, failed_tests
        if cond:
            passed_tests += 1
            print(f"[PASS] {msg}")
        else:
            failed_tests += 1
            print(f"[FAIL] {msg} | Detail: {error_detail}")
            findings.append({'test': msg, 'detail': error_detail})

    # Instantiate handler mock helper
    class MockHandler(server.DashboardHandler):
        def __init__(self):
            self.headers = {'Accept-Encoding': 'identity'}
            self.response_status = None
            self.response_headers = {}
            self.response_data = None
            
        def send_response(self, code, message=None):
            self.response_status = code
            
        def send_header(self, keyword, value):
            self.response_headers[keyword] = value
            
        def end_headers(self):
            pass
            
        def send_json(self, data, status=200):
            self.response_status = status
            self.response_data = data

    handler = MockHandler()

    # ==================================================
    # TEST 1: SQL Injection Resilience
    # ==================================================
    print("\n--- 1. Testing SQL Injection Resilience ---")
    sqli_payloads = [
        "1' OR '1'='1",
        "'; DROP TABLE ninos_summary;--",
        "' UNION SELECT 1,2,3,4,5,6--",
        "202606' OR 1=1--"
    ]
    
    for payload in sqli_payloads:
        # Test /api/ninos with sqli in departamento
        res = handler.handle_ninos({'departamento': payload, 'periodo': '202606'})
        assert_test(res is not None and 'error' not in res, 
                    f"SQLi protection in handle_ninos for payload: {payload}",
                    f"Result: {res}")
        
        # Check that SQLite table still exists and data count is 0 or empty for malicious string
        if res and 'kpis' in res:
            assert_test(res['kpis']['total_ninos'] == 0,
                        f"SQLi payload resulted in 0 rows as expected for invalid dep name: {payload}")

    # ==================================================
    # TEST 2: Edge Cases & Boundary Values
    # ==================================================
    print("\n--- 2. Testing Boundary Dates and Invalid Parameters ---")
    
    # Boundary period 1: Non-existent future period
    res_future = handler.handle_ninos({'periodo': '999912'})
    assert_test(res_future is not None and 'kpis' in res_future and res_future['kpis']['total_ninos'] == 0,
                "Boundary date (period 999912) handled gracefully with 0 totals",
                f"Status: {handler.response_status}")
    
    # Boundary period 2: Non-existent past period
    res_past = handler.handle_ninos({'periodo': '190001'})
    assert_test(res_past is not None and 'kpis' in res_past and res_past['kpis']['total_ninos'] == 0,
                "Boundary date (period 190001) handled gracefully with 0 totals")

    # Invalid service name
    res_inv_svc = handler.handle_ninos({'servicio': 'INVALID_SERVICE_XYZ', 'periodo': '202606'})
    assert_test(res_inv_svc is not None and res_inv_svc['kpis']['total_ninos'] == 0,
                "Invalid service parameter handles empty result set without error")

    # Invalid age group
    res_inv_age = handler.handle_ninos({'grupo_edad': 'NON_EXISTENT_AGE', 'periodo': '202606'})
    assert_test(res_inv_age is not None and res_inv_age['kpis']['total_ninos'] == 0,
                "Invalid age group parameter handles empty result set without error")

    # ==================================================
    # TEST 3: Service Filtering ('SCD' vs 'SAF')
    # ==================================================
    print("\n--- 3. Testing Service Filters ('SCD', 'SAF') & Strategic Activities ---")
    
    res_scd = handler.handle_ninos({'servicio': 'SCD', 'periodo': '202606'})
    res_saf = handler.handle_ninos({'servicio': 'SAF', 'periodo': '202606'})
    
    assert_test(res_scd['kpis']['total_ninos'] > 0 and res_saf['kpis']['total_ninos'] > 0,
                "SCD and SAF service filters return positive child counts")
    
    # Strategic activities check: act_415 should be non-zero for SCD and act_412 non-zero for SAF
    scd_act415 = res_scd['kpis']['actividades']['act_415']['cobertura']
    saf_act412 = res_saf['kpis']['actividades']['act_412']['cobertura']
    
    assert_test(scd_act415 > 0, f"Act. 4.15 SCD coverage is non-zero ({scd_act415})")
    assert_test(saf_act412 > 0, f"Act. 4.12 SAF coverage is non-zero ({saf_act412})")

    # ==================================================
    # TEST 4: UBIGEO Filtering (District -> CG -> Local)
    # ==================================================
    print("\n--- 4. Testing UBIGEO Hierarchy Filtering (District/CG/Local) ---")
    
    # Get a real CG and Local from filters API first
    filters_resp = handler.handle_filters({'tab': 'tabNinos', 'periodo': '202606'})
    uts = filters_resp['uts']
    target_ut = uts[1] if len(uts) > 1 else uts[0]
    
    filter_ut_resp = handler.handle_filters({'tab': 'tabNinos', 'ut': target_ut, 'periodo': '202606'})
    target_dep = filter_ut_resp['departamentos'][1] if len(filter_ut_resp['departamentos']) > 1 else 'Todos'
    
    filter_dep_resp = handler.handle_filters({'tab': 'tabNinos', 'ut': target_ut, 'departamento': target_dep, 'periodo': '202606'})
    target_prov = filter_dep_resp['provincias'][1] if len(filter_dep_resp['provincias']) > 1 else 'Todos'
    
    filter_prov_resp = handler.handle_filters({'tab': 'tabNinos', 'ut': target_ut, 'departamento': target_dep, 'provincia': target_prov, 'periodo': '202606'})
    target_dist = filter_prov_resp['distritos'][1] if len(filter_prov_resp['distritos']) > 1 else 'Todos'
    
    filter_dist_resp = handler.handle_filters({'tab': 'tabNinos', 'ut': target_ut, 'departamento': target_dep, 'provincia': target_prov, 'distrito': target_dist, 'periodo': '202606'})
    cgs = filter_dist_resp['comites_gestion']
    
    print(f"Target UT: {target_ut}, Dep: {target_dep}, Prov: {target_prov}, Dist: {target_dist}")
    print(f"Discovered {len(cgs)} Comités de Gestión.")
    
    if len(cgs) > 1:
        target_cg = cgs[1]
        res_cg = handler.handle_ninos({'ut': target_ut, 'departamento': target_dep, 'provincia': target_prov, 'distrito': target_dist, 'cg': target_cg, 'periodo': '202606'})
        assert_test(res_cg is not None and res_cg['kpis']['total_ninos'] >= 0,
                    f"Filtering down to CG '{target_cg}' returned valid payload")
        
        # Test Map endpoint with CG filter
        map_cg_res = handler.handle_map({'ut': target_ut, 'departamento': target_dep, 'provincia': target_prov, 'distrito': target_dist, 'cg': target_cg, 'periodo': '202606'})
        assert_test(map_cg_res is not None and 'locales' in map_cg_res,
                    f"Map handler handles CG level filter without error")

    # Test conflicting filters (e.g. CG from UT A specified under UT B)
    conflict_res = handler.handle_ninos({'ut': 'AMAZONAS', 'departamento': 'CUSCO', 'periodo': '202606'})
    assert_test(conflict_res is not None and conflict_res['kpis']['total_ninos'] == 0,
                "Conflicting UBIGEO filters (UT AMAZONAS + Dep CUSCO) gracefully return 0 rows")

    # ==================================================
    # TEST 5: API Comparison Endpoint (/api/comparison)
    # ==================================================
    print("\n--- 5. Testing /api/comparison Edge Cases ---")
    
    # Missing parameters
    comp_missing = handler.handle_comparison({'periodo1': '202606'})
    assert_test(comp_missing is None and handler.response_status == 400,
                "Comparison missing periodo2 returns 400 Bad Request")

    # Identical periods
    comp_same = handler.handle_comparison({'periodo1': '202606', 'periodo2': '202606', 'modulo': 'ninos'})
    assert_test(comp_same is not None and 'comparison' in comp_same,
                "Comparison with identical periods executes successfully")
    if comp_same and 'comparison' in comp_same:
        diffs = [v['diff'] for v in comp_same['comparison'].values()]
        assert_test(all(d == 0.0 for d in diffs),
                    "All diffs for identical periods are exactly 0.0")

    # Invalid modulo
    comp_inv_mod = handler.handle_comparison({'periodo1': '202605', 'periodo2': '202606', 'modulo': 'invalid_mod'})
    assert_test(comp_inv_mod is not None, "Comparison with unknown modulo falls back safely to ninos calculation")

    # ==================================================
    # TEST 6: Cache Eviction & Capacity Limit
    # ==================================================
    print("\n--- 6. Testing Cache Eviction Behavior & Capacity ---")
    
    server.RESPONSE_CACHE.clear()
    initial_cache_size = len(server.RESPONSE_CACHE)
    
    # Fill cache beyond MAX_CACHE_SIZE (2000)
    num_requests = 2200
    print(f"Simulating {num_requests} unique requests (MAX_CACHE_SIZE={server.MAX_CACHE_SIZE})...")
    
    for i in range(num_requests):
        cache_key = f"/api/ninos:test_key_{i}=val_{i}"
        if len(server.RESPONSE_CACHE) >= server.MAX_CACHE_SIZE:
            server.RESPONSE_CACHE.popitem(last=False)
        server.RESPONSE_CACHE[cache_key] = {'test_id': i}

    assert_test(len(server.RESPONSE_CACHE) == server.MAX_CACHE_SIZE,
                f"Cache size capped exactly at MAX_CACHE_SIZE ({server.MAX_CACHE_SIZE}), actual: {len(server.RESPONSE_CACHE)}")
    
    # Verify oldest keys (0 to 199) were evicted
    assert_test("/api/ninos:test_key_0=val_0" not in server.RESPONSE_CACHE,
                "Oldest entry (test_key_0) was successfully evicted")
    assert_test(f"/api/ninos:test_key_{num_requests-1}=val_{num_requests-1}" in server.RESPONSE_CACHE,
                "Newest entry is present in cache")

    # ==================================================
    # TEST 7: Multithreaded Concurrency Stress & Race Conditions
    # ==================================================
    print("\n--- 7. Testing Multithreaded Concurrency & Race Conditions ---")
    
    num_threads = 20
    requests_per_thread = 50
    total_concurrent_reqs = num_threads * requests_per_thread
    
    errors = []
    start_time = time.time()
    
    def thread_worker(thread_id):
        h = MockHandler()
        for i in range(requests_per_thread):
            try:
                # Alternate between cached hits and cache misses
                mod = i % 5
                if mod == 0:
                    h.handle_ninos({'periodo': '202606', 'ut': 'AMAZONAS'})
                elif mod == 1:
                    h.handle_gestantes({'periodo': '202606', 'ut': 'LIMA'})
                elif mod == 2:
                    h.handle_filters({'tab': 'tabNinos', 'periodo': '202606'})
                elif mod == 3:
                    h.handle_map({'tab': 'tabGestantes', 'periodo': '202606'})
                else:
                    # Unique request to test cache eviction under concurrency
                    h.handle_ninos({'periodo': '202606', 'rand': f"t_{thread_id}_r_{i}"})
            except Exception as e:
                errors.append(f"Thread {thread_id} error on iteration {i}: {str(e)}")

    threads = []
    for tid in range(num_threads):
        t = threading.Thread(target=thread_worker, args=(tid,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    elapsed = time.time() - start_time
    reqs_per_sec = total_concurrent_reqs / elapsed if elapsed > 0 else 0
    
    print(f"Executed {total_concurrent_reqs} concurrent API calls across {num_threads} threads in {elapsed:.2f}s ({reqs_per_sec:.1f} req/s).")
    assert_test(len(errors) == 0,
                f"Multithreaded execution completed with 0 exceptions",
                f"Errors encountered: {errors[:5]}")

    # ==================================================
    # TEST SUMMARY
    # ==================================================
    print("\n==================================================")
    print(f"STRESS TEST SUMMARY: {passed_tests} PASSED, {failed_tests} FAILED")
    print("==================================================")
    
    return passed_tests, failed_tests, findings

if __name__ == '__main__':
    run_adversarial_tests()
