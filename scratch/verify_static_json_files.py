import json

print("=== 1. CHECKING data/gestantes.json ===")
with open('data/gestantes.json', 'r', encoding='utf-8') as f:
    g_json = json.load(f)

print("Gestantes KPIs in static fallback:")
print(json.dumps(g_json['kpis'], indent=2, ensure_ascii=False))

print("\n=== 2. CHECKING data/ninos.json ===")
with open('data/ninos.json', 'r', encoding='utf-8') as f:
    n_json = json.load(f)

print("Niños KPIs in static fallback:")
print(json.dumps(n_json['kpis'], indent=2, ensure_ascii=False))
