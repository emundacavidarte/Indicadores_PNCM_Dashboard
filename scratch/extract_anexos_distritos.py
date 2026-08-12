import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

pages_to_extract = [62, 68, 84, 85, 93, 104]

for page_num in pages_to_extract:
    print(f"\n================ PAGE {page_num} ================")
    text = reader.pages[page_num - 1].extract_text()
    print(text[:2000])
