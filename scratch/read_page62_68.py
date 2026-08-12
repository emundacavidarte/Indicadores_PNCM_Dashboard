import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

for p_num in [61, 62, 63, 67, 68, 69]:
    print(f"\n================ PAGE {p_num} ================")
    text = reader.pages[p_num - 1].extract_text()
    print(text)
