import pypdf

pdf_path = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard\Anemia_Plan_Multisectorial\DS -002-2024 Plan Multisectorial ANEMIA.pdf'
reader = pypdf.PdfReader(pdf_path)

print("--- CHECKING FOR DISTRICT NAMES OR LISTS IN PDF ---")
dist_count_per_page = {}
for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    if "distrito" in text.lower():
        words = text.split()
        dist_count_per_page[idx+1] = text.lower().count("distrito")

sorted_pages = sorted(dist_count_per_page.items(), key=lambda x: x[1], reverse=True)
print("Top pages with word 'distrito':", sorted_pages[:10])
