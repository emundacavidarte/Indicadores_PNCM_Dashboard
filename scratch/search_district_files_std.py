import os
import sqlite3

base_dir = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard'

print("--- LISTING ALL FILES IN WORKSPACE ---")

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.startswith('~$') or file.startswith('.'):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), base_dir)
        print(f"File: {rel_path} ({os.path.getsize(os.path.join(root, file)) / 1024:.1f} KB)")
