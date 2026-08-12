import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Paquete_Priorizado\Fichas_Indicadores_Paquete_Priorizado.pdf'
reader = pypdf.PdfReader(pdf_path)

for p_num in range(1, 5):
    print(f"\n================ PAGE {p_num} ================")
    print(reader.pages[p_num - 1].extract_text())
