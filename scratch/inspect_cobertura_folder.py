import pandas as pd
import os

folder = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Cobertura PNCM'

print("--- INSPECTING LOCALES MAYO 2026 ---")
loc_df = pd.read_parquet(os.path.join(folder, 'LOCALES_MAYO_2026_v1.parquet'))
print("Locales shape:", loc_df.shape)
print("Locales columns:", loc_df.columns.tolist()[:15])

if 'distrito' in loc_df.columns or 'DISTRITO' in loc_df.columns:
    dist_col = 'distrito' if 'distrito' in loc_df.columns else 'DISTRITO'
    dep_col = 'departamento' if 'departamento' in loc_df.columns else 'DEPARTAMENTO'
    prov_col = 'provincia' if 'provincia' in loc_df.columns else 'PROVINCIA'
    
    unique_dist = loc_df[[dep_col, prov_col, dist_col]].drop_duplicates()
    print(f"Total Unique Distritos (Dep-Prov-Dist) in Locales MAYO 2026: {len(unique_dist)}")

print("\n--- INSPECTING SA_MAYO_2026 ---")
sa_df = pd.read_parquet(os.path.join(folder, 'SA_MAYO_2026_v1.0.parquet'))
print("SA_MAYO shape:", sa_df.shape)
print("SA_MAYO columns:", sa_df.columns.tolist())

print("\n--- INSPECTING SCD 202606 PARQUET ---")
scd_df = pd.read_parquet(os.path.join(folder, 'SCD_202606_PADRON_JUNIO_2026_v1_Enriquecido.parquet'))
print("SCD 202606 shape:", scd_df.shape)
print("SCD 202606 columns sample:", scd_df.columns.tolist()[:15])

print("\n--- INSPECTING SAF 202606 PARQUET ---")
saf_df = pd.read_parquet(os.path.join(folder, 'SAF_202606_PADRON_JUNIO_2026_v1.0.parquet'))
print("SAF 202606 shape:", saf_df.shape)
print("SAF 202606 columns sample:", saf_df.columns.tolist()[:15])

