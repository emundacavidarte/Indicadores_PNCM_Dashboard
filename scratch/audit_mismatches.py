import sys
import os
sys.path.insert(0, os.path.abspath('.'))

import json
from server import DashboardHandler

class TestHandler(DashboardHandler):
    def __init__(self):
        pass

    def send_json(self, data, status=200):
        pass

handler = TestHandler()
gest_resp = handler.handle_gestantes({})
with open('data/gestantes.json', 'r', encoding='utf-8') as f:
    gest_json = json.load(f)

print("=== GESTANTES TREND DIFFERENCE ===")
for i, (t_api, t_json) in enumerate(zip(gest_resp['trend'], gest_json['trend'])):
    if t_api != t_json:
        print(f"Diff at index {i} ({t_api.get('periodo')}):")
        print("  API :", t_api)
        print("  JSON:", t_json)
        break

print("\n=== GESTANTES UT RANKING DIFFERENCE ===")
for i, (u_api, u_json) in enumerate(zip(gest_resp['ut_ranking'], gest_json['ut_ranking'])):
    if u_api != u_json:
        print(f"Diff at index {i} ({u_api.get('ut')}):")
        print("  API :", u_api)
        print("  JSON:", u_json)
        break

ninos_resp = handler.handle_ninos({})
with open('data/ninos.json', 'r', encoding='utf-8') as f:
    ninos_json = json.load(f)

print("\n=== NIÑOS TREND DIFFERENCE (LAST 6 PERIODS) ===")
for i, (t_api, t_json) in enumerate(zip(ninos_resp['trend'][-6:], ninos_json['trend'])):
    if t_api != t_json:
        print(f"Diff at index {i} ({t_api.get('periodo')}):")
        print("  API :", t_api)
        print("  JSON:", t_json)
        break

print("\n=== NIÑOS UT RANKING DIFFERENCE ===")
for i, (u_api, u_json) in enumerate(zip(ninos_resp['ut_ranking'], ninos_json['ut_ranking'])):
    if u_api != u_json:
        print(f"Diff at index {i} ({u_api.get('ut')}):")
        print("  API :", u_api)
        print("  JSON:", u_json)
        break
