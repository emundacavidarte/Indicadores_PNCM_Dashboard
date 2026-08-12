import pypdf
import os

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'

reader = pypdf.PdfReader(pdf_path)
print(f"Total pages in PDF: {len(reader.pages)}")

search_terms = ["1011", "1,011", "priorizado", "focalizado", "alto riesgo", "Criterios", "Quintil", "Anexo"]

for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    for term in search_terms:
        if term.lower() in text.lower():
            lines = text.split('\n')
            for line in lines:
                if term.lower() in line.lower() or "1011" in line or "1,011" in line:
                    print(f"Pág {idx+1} [{term}]: {line.strip()}")
