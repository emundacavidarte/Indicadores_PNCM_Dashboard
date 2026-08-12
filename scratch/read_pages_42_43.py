import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

for p in [42, 43]:
    print(f"\n================ PAGE {p} ================")
    print(reader.pages[p-1].extract_text())
