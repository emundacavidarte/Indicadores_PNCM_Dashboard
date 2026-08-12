import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import threading
import time
from collections import OrderedDict
import server

def test_cache_race_condition():
    print("Testing OrderedDict thread safety under high concurrency...")
    
    server.RESPONSE_CACHE.clear()
    server.MAX_CACHE_SIZE = 50  # Small cache size to force frequent popitem calls
    
    errors = []
    stop_event = threading.Event()
    
    # Thread 1: Mutator threads adding new keys and triggering popitem
    def mutator(tid):
        i = 0
        while not stop_event.is_set():
            key = f"/api/ninos:param_{tid}_{i}"
            try:
                if len(server.RESPONSE_CACHE) >= server.MAX_CACHE_SIZE:
                    server.RESPONSE_CACHE.popitem(last=False)
                server.RESPONSE_CACHE[key] = {'data': i}
            except Exception as e:
                errors.append(f"Mutator {tid} exception: {type(e).__name__}: {e}")
            i += 1
            if i % 100 == 0:
                time.sleep(0.001)

    # Thread 2: Reader threads performing move_to_end
    def reader(tid):
        i = 0
        while not stop_event.is_set():
            keys = list(server.RESPONSE_CACHE.keys())
            if keys:
                key = keys[i % len(keys)]
                try:
                    if key in server.RESPONSE_CACHE:
                        server.RESPONSE_CACHE.move_to_end(key)
                        _ = server.RESPONSE_CACHE.get(key)
                except Exception as e:
                    errors.append(f"Reader {tid} exception: {type(e).__name__}: {e}")
            i += 1

    threads = []
    for t in range(10):
        tm = threading.Thread(target=mutator, args=(t,))
        tr = threading.Thread(target=reader, args=(t,))
        threads.append(tm)
        threads.append(tr)
        tm.start()
        tr.start()

    time.sleep(3.0)  # Run for 3 seconds under heavy race conditions
    stop_event.set()

    for t in threads:
        t.join()

    print(f"Total concurrent cache errors detected: {len(errors)}")
    if errors:
        print("Sample errors:")
        for err in errors[:10]:
            print(f"  - {err}")
    else:
        print("No errors detected during cache race test.")

    return len(errors)

if __name__ == '__main__':
    test_cache_race_condition()
