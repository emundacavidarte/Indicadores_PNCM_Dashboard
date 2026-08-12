import os
import sys
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server

class MockHandler(server.DashboardHandler):
    def __init__(self):
        pass
    def send_json(self, data, status=200):
        pass

def main():
    h = MockHandler()
    
    print("Generating data/gestantes.json...")
    g_data = h.handle_gestantes({})
    gestantes_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'gestantes.json')
    with open(gestantes_path, 'w', encoding='utf-8') as f:
        json.dump(g_data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(g_data['trend'])} periods to data/gestantes.json ({g_data['trend'][0]['periodo']} to {g_data['trend'][-1]['periodo']})")

    print("Generating data/ninos.json...")
    n_data = h.handle_ninos({})
    ninos_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'ninos.json')
    with open(ninos_path, 'w', encoding='utf-8') as f:
        json.dump(n_data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(n_data['trend'])} periods to data/ninos.json ({n_data['trend'][0]['periodo']} to {n_data['trend'][-1]['periodo']})")

if __name__ == '__main__':
    main()
