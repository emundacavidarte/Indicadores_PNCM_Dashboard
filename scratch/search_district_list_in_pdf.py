import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

print("--- SEARCHING FOR ANEXOS AND DISTRICT LISTS ---")

for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    if "ANEXO" in text.upper() or "FOCALIZA" in text.upper() or "QUINTIL" in text.upper() or "PRIORIZAD" in text.upper():
        print(f"\n--- PAGE {idx+1} ---")
        lines = [line.strip() for line in text.split('\n') if any(w in line.upper() for w in ["ANEXO", "FOCALIZ", "DIST RITO", "DISTRITO", "QUINTIL", "1,011", "1011"])]
        for line in lines[:10]:
            print(f"  * {line}")
