import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_pqt_section = """                    <!-- PANEL 4: PAQUETE INTEGRADO DE SERVICIOS DIT (<24 MESES) -->
                    <div class="kpi-group-section">
                        <div class="group-title-bar">
                            <i class="fa-solid fa-cubes icon-green"></i>
                            <span>Evaluación del Paquete Integrado de Servicios DIT (&lt;24 Meses)</span>
                        </div>
                        <div class="kpi-grid grid-6col">
                            <!-- 1. PAQUETE INTEGRADO CONSOLIDADO -->
                            <div class="kpi-card bg-green active-kpi" data-kpi="pqt">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-cubes"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Técnica Código 36: Indicador 16. Porcentaje de niños <24m que cumplen los 6 componentes: CRED, Neumo, Rota, Hierro, Dosaje Hb y DNI <= 30d">
                                        Paquete Integrado (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtSub" class="kpi-sub">0 de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 2. DOSAJE DE HEMOGLOBINA (COMPONENTE E) -->
                            <div class="kpi-card bg-cyan" data-kpi="dosaje_hb">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-notes-medical"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Código 36 Comp. e): Dosaje de Hemoglobina realizado entre los 6 y 8 meses. HIS: Z017 (D), 85018 (D)">
                                        Dosaje Hb (6-8m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtDosajePct" class="kpi-value">—</span>
                                    </div>
                                    <span id="nPqtDosajeSub" class="kpi-sub">Evaluado en Paquete Integrado</span>
                                </div>
                            </div>

                            <!-- 3. SUPLEMENTACIÓN CON HIERRO (COMPONENTE D) -->
                            <div class="kpi-card bg-pink" data-kpi="hierro">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-pills"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Código 36 Comp. d): Suplementación acumulada con hierro a menores de 24 meses. HIS: Z298, U310 con LAB (SF1-11, P01-11, MN1-11)">
                                        Suplementación Hierro (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtHierroPct" class="kpi-value">—</span>
                                    </div>
                                    <span id="nPqtHierroSub" class="kpi-sub">Evaluado en Paquete Integrado</span>
                                </div>
                            </div>

                            <!-- 4. VACUNAS NEUMO Y ROTA (COMPONENTES B Y C) -->
                            <div class="kpi-card bg-blue" data-kpi="vrn">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-syringe"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Código 36 Comp. b y c): Vacunas Antineumocócica (90669, 90670) y Rotavirus (90681) acumuladas a menores de 12 meses">
                                        Vacunas (Neumo/Rota &lt;12m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtVrnPct" class="kpi-value">—</span>
                                    </div>
                                    <span id="nPqtVrnSub" class="kpi-sub">Evaluado en Paquete Integrado</span>
                                </div>
                            </div>

                            <!-- 5. VACUNA COMPLETA (HASTA LOS 18 MESES - CÓDIGO 41) -->
                            <div class="kpi-card bg-purple-dark" data-kpi="vac_completa">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-shield-virus"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Técnica Código 41 (Indicador 21): Porcentaje de niñas y niños usuarios del PNCM hasta 18 meses con vacunas completas y oportunas para su edad">
                                        Vacunas Completas (hasta 18m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtVacCompPct" class="kpi-value">—</span>
                                    </div>
                                    <span id="nPqtVacCompSub" class="kpi-sub">Evaluado en Paquete Integrado</span>
                                </div>
                            </div>

                            <!-- 6. CONTROL CRED COMPLETO Y OPORTUNO (COMPONENTE A) -->
                            <div class="kpi-card bg-green" data-kpi="cred">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-child-reaching"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ficha Código 36 Comp. a): Controles CRED oportunos acumulados a menores de 24 meses. HIS: Z001">
                                        Control CRED (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtCredPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtCredSub" class="kpi-sub">0 de 0 evaluados</span>
                                </div>
                            </div>
                        </div>
                    </div>"""

new_pqt_section = """                    <!-- PANEL 4: PAQUETE INTEGRADO DE SERVICIOS DIT (<24 MESES - TABLERO DE CONTROL DGSE-MIDIS) -->
                    <div class="kpi-group-section">
                        <div class="group-title-bar">
                            <i class="fa-solid fa-cubes icon-green"></i>
                            <span>Evaluación del Paquete Integrado de Servicios DIT (&lt;24 Meses - Tablero de Control DGSE-MIDIS)</span>
                        </div>
                        <div class="kpi-grid grid-6col">
                            <!-- 1. PAQUETE INTEGRADO DE SERVICIOS (IND. 16 - CÓD. 36) -->
                            <div class="kpi-card bg-green active-kpi" data-kpi="pqt">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-cubes"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 16 - Cód. 36: % de niñas y niños PNCM < 24m con PAQUETE INTEGRADO DE SERVICIOS">
                                        Paquete Integrado (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtSub" class="kpi-sub">0 de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 2. DOSAJE DE HEMOGLOBINA 170-250 DÍAS (IND. 15 - CÓD. 35) -->
                            <div class="kpi-card bg-cyan" data-kpi="dosaje_hb">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-notes-medical"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 15 - Cód. 35: % de niñas y niños PNCM de 170–250 días con dosaje de hemoglobina">
                                        Dosaje Hb (170-250d) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtDosajePct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtDosajeSub" class="kpi-sub">0 con dosaje de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 3. SUPLEMENTACIÓN CON HIERRO (IND. 14 - CÓD. 34) -->
                            <div class="kpi-card bg-pink" data-kpi="hierro">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-pills"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 14 - Cód. 34: % de niñas y niños PNCM < 24m que reciben suplementación con hierro">
                                        Suplementación Hierro (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtHierroPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtHierroSub" class="kpi-sub">0 suplementados de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 4. VACUNAS NEUMO Y ROTA HASTA 12M (IND. 11 - CÓD. 31) -->
                            <div class="kpi-card bg-blue" data-kpi="vrn">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-syringe"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 11 - Cód. 31: % de niñas y niños PNCM hasta 12m con vacunas de neumococo y rotavirus">
                                        Vacunas Neumo/Rota (&le;12m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtVrnPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtVrnSub" class="kpi-sub">0 con vacunas de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 5. EMISIÓN DNI HASTA 30 DÍAS DE NACIDO (IND. 9 - CÓD. 29) -->
                            <div class="kpi-card bg-purple-dark" data-kpi="dni_30d">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-id-card"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 9 - Cód. 29: % de niñas y niños PNCM < 12m con DNI emitido hasta los 30 días de nacido">
                                        Emisión DNI (&le;30 días) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtDniPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtDniSub" class="kpi-sub">0 con DNI oportuno de 0 evaluados</span>
                                </div>
                            </div>

                            <!-- 6. CONTROL CRED COMPLETO Y OPORTUNO (IND. 10 - CÓD. 30) -->
                            <div class="kpi-card bg-green" data-kpi="cred">
                                <button type="button" class="kpi-info-btn" title="Ver Ficha Técnica" aria-label="Ver Ficha Técnica"><i class="fa-solid fa-circle-info"></i></button>
                                <div class="kpi-icon"><i class="fa-solid fa-child-reaching"></i></div>
                                <div class="kpi-content">
                                    <span class="kpi-label" title="Ind. 10 - Cód. 30: % de niñas y niños PNCM < 24m con CRED completo y oportuno">
                                        Control CRED (&lt;24m) <i class="fa-solid fa-circle-info tooltip-icon"></i>
                                    </span>
                                    <div class="kpi-val-row">
                                        <span id="nPqtCredPct" class="kpi-value">0.0%</span>
                                    </div>
                                    <span id="nPqtCredSub" class="kpi-sub">0 con CRED de 0 evaluados</span>
                                </div>
                            </div>
                        </div>
                    </div>"""

if old_pqt_section in html:
    html = html.replace(old_pqt_section, new_pqt_section)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated index.html Panel 4.")
else:
    print("WARNING: old_pqt_section not found exact match in index.html.")
