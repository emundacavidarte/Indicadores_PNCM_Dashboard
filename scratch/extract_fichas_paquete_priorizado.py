import pypdf
import os

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Paquete_Priorizado\Fichas_Indicadores_Paquete_Priorizado.pdf'

reader = pypdf.PdfReader(pdf_path)
print(f"Total pages in Fichas_Indicadores_Paquete_Priorizado.pdf: {len(reader.pages)}")

for idx, page in enumerate(reader.pages):
    print(f"\n================ PAGE {idx+1} ================")
    text = page.extract_text()
    print(text)
