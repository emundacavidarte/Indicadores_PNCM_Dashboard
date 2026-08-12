import pypdf
import os

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Paquete_Priorizado\Fichas_Indicadores_Paquete_Priorizado.pdf'
reader = pypdf.PdfReader(pdf_path)

fichas = []

for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    fichas.append({
        'page': idx + 1,
        'full_text': text
    })

print(f"Loaded {len(fichas)} pages from PDF.")

# Let's search for "CÓDIGO" or "INDICADOR" or "NOMBRE DEL INDICADOR" on each page
for f in fichas:
    print(f"\n--- PAGE {f['page']} ---")
    lines = f['full_text'].split('\n')
    for line in lines[:15]:
        if any(w in line.upper() for w in ["INDICADOR", "CÓDIGO", "CODIGO", "NOMBRE", "FICHA"]):
            print(f"  {line.strip()}")
