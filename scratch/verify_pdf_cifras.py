import pypdf
import os

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'

reader = pypdf.PdfReader(pdf_path)
print(f"Total PDF pages: {len(reader.pages)}")

keywords = ["277,283", "277283", "18,899", "18899", "27,877", "27877", "67,387", "67387", "1,011", "1011", "4.12", "4.13", "4.14", "4.15", "4.16"]

found = {}
for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    for kw in keywords:
        if kw in text:
            if kw not in found:
                found[kw] = []
            found[kw].append(idx + 1)

for kw, pages in found.items():
    print(f"Keyword '{kw}' found on PDF pages: {pages}")
