import openpyxl

def inspect_sheet(filename, sheet_name):
    print(f"\n--- {filename} : {sheet_name} ---")
    wb = openpyxl.load_workbook(filename, data_only=True, read_only=True)
    ws = wb[sheet_name]
    row_idx = 0
    for r in ws.iter_rows(values_only=True):
        row_idx += 1
        non_empty = [(i, str(cell)) for i, cell in enumerate(r) if cell is not None and str(cell).strip() != '']
        if non_empty and row_idx <= 25:
            print(f"Row {row_idx}: {non_empty[:8]}")

inspect_sheet('INDICADORES HIS - GESTANTES v1.0 - Junio 2026.xlsx', 'INDICADORES')
inspect_sheet('INDICADORES HIS - GESTANTES v1.0 - Junio 2026.xlsx', 'Tabla')
inspect_sheet('INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx', 'INDICADORES')
inspect_sheet('INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx', 'Tabla')
