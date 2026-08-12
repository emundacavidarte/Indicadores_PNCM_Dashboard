import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import api.index as vercel_app

class MockVercelHandler(vercel_app.handler):
    def __init__(self):
        pass
    def send_json(self, data, status=200):
        pass

def test_vercel():
    h = MockVercelHandler()
    
    print("Testing Vercel Handler with api_data.db...")
    g_res = h.handle_gestantes({})
    n_res = h.handle_ninos({})
    
    assert g_res['kpis']['total_gestantes'] == 22673, "Gestantes total mismatch on Vercel handler"
    assert n_res['kpis']['total_ninos'] == 320195, "Niños total mismatch on Vercel handler"
    assert len(n_res['trend']) == 42, f"Niños trend period count mismatch on Vercel handler: {len(n_res['trend'])}"
    print("[PASS] Vercel handler initialized and returned exact expected data using api_data.db!")

if __name__ == '__main__':
    test_vercel()
