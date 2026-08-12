import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

for p_num in range(98, 117):
    print(f"\n================ PAGE {p_num+1} ================")
    text = reader.pages[p_num].extract_text()
    print(text[:1500])
