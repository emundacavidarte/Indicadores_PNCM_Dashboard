import os
import pandas as pd
import pypdf

base_dir = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard'

print("--- SEARCHING FILES IN WORKSPACE FOR PRIORITIZED DISTRICT LISTS ---")

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.startswith('~$') or file.startswith('.'):
            continue
        ext = os.path.splitext(file)[1].lower()
        full_path = os.path.join(root, file)
        
        if ext in ['.csv', '.xlsx', '.parquet', '.json']:
            file_size_mb = os.path.getsize(full_path) / (1024 * 1024)
            if '1011' in file or 'prioriz' in file.lower() or 'focaliz' in file.lower() or 'distrito' in file.lower():
                print(f"Match File: {full_path} ({file_size_mb:.2f} MB)")
