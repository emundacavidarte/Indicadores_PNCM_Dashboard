import os

base_dir = r'd:\OneDrive - PROGRAMA NACIONAL CUNA MAS\PNCM - Edward\Agente\Indicadores_PNCM_Dashboard'
handover_path = os.path.join(base_dir, 'COWORK_HANDOVER_CLAUDE.md')

handover_content = """# 🚀 GUÍA DE RELEVO Y EVALUACIÓN COWORK PARA CLAUDE
**PROYECTO: DASHBOARD DE INDICADORES NOMINALES PNCM (SEGUIMIENTO DE ANEMIA Y PAQUETE INTEGRADO DIT)**
*Programa Nacional Cuna Más (PNCM) - Ministerio de Desarrollo e Inclusión Social (MIDIS)*
*Última actualización de estado: 10 de Agosto de 2026*

---

## 📌 1. RESUMEN EJECUTIVO Y ESTADO ACTUAL DEL SISTEMA

Este proyecto es el **Dashboard Oficial de Control Nominal HIS de Gestantes y Niños del Programa Nacional Cuna Más (PNCM)**. 
Actualmente el proyecto está en estado **PROD-READY / COMPLETAMENTE FUNCIONAL**, probado y verificado localmente en el servidor HTTP Python.

* **Servidor Local Activo**: `python server.py` en `http://localhost:8050/` (HTTP 200 OK).
* **Bundle Autónomo para Presentaciones**: `borrador_presentacion_dashboard.html` (2.66 MB con assets, estilos y logos incrustados en Base64).
* **Documento Técnico de Referencia**: `Anemia_Plan_Multisectorial/Resumen_Plan_Multisectorial_Anemia_PNCM.md` y `.html`.

---

## 📜 2. MARCOS NORMATIVOS DE LOS INDICADORES

El dashboard se sustenta rigurosamente en dos cuerpos normativos oficiales del Estado Peruano:

### A. INDICADORES DE ANEMIA:
* **Norma Base**: **Plan Multisectorial para la Prevención y Reducción de la Anemia Materno Infantil en el Perú (Periodo 2024-2030)**, aprobado por **Decreto Supremo N° 002-2024-MIDIS** *(Archivo local: `Anemia_Plan_Multisectorial/DS -002-2024 Plan Multisectorial ANEMIA.pdf`)*.
* **Métrica Principal**: Frecuencia de Anemia Nominal registrada en el sistema HIS MINSA.
* **Gestantes**: Cobertura del Servicio de Acompañamiento a Familias (SAF).
* **Niños (6 a 36 meses)**: Cobertura en SAF y Servicio de Cuidado Diurno (SCD).

### B. INDICADORES DEL PAQUETE INTEGRADO DE SERVICIOS DIT:
* **Norma Base**: **Decreto Legislativo DIT / Indicador 16 (Fondo de Estímulo al Desempeño - FED)**.
* **Métrica Principal**: Porcentaje de niños menores de 24 meses que reciben el paquete integral completo de servicios (CRED según edad, Vacunas Neumo/Rota, Dosaje de Hemoglobina, Suplementación con Hierro, Vacuna Completa / DNI).

---

## 📋 3. FICHAS TÉCNICAS OPERATIVAS DE ANEMIA (D.S. N° 002-2024-MIDIS)

Cada KPI de Anemia implementado en el backend (`server.py`) y frontend (`app.js`) sigue strictly las Fichas Técnicas del Plan Multisectorial:

1. **Ficha Técnica N° 01: Frecuencia de Anemia en Niños (6-36m)**:
   $$\text{Frecuencia Anemia (\%)} = \left( \frac{\text{num\_anemia}}{\text{den\_anemia}} \right) \times 100$$
   *Denominador (`den_anemia`)*: Niños evaluados con dosaje de Hb efectuado en el HIS MINSA.  
   *Numerador (`num_anemia`)*: Niños con resultado de Hb < 11.0 g/dL.

2. **Ficha Técnica N° 02: Anemia en Gestantes Usuarias del PNCM (SAF)**:
   $$\text{Anemia Gestantes (\%)} = \left( \frac{\text{num\_anemia}}{\text{den\_anemia}} \right) \times 100 \quad \text{en } \texttt{gestantes\_summary}$$
   *Denominador (`den_anemia`)*: Gestantes SAF evaluadas con dosaje de Hb.  
   *Numerador (`num_anemia`)*: Gestantes SAF registradas con anemia en HIS MINSA.

3. **Ficha Técnica N° 03: Recuperación de Anemia en Niños (12 a 18m)**:
   $$\text{Recuperación Anemia (\%)} = \left( \frac{\text{num\_npr}}{\text{den\_npr}} \right) \times 100$$
   *Denominador (`den_npr`)*: Niños con anemia previa reevaluados con 2do dosaje post-tratamiento.  
   *Numerador (`num_npr`)*: Niños que logran la recuperación de anemia (Hb ≥ 11.0 g/dL en 2do dosaje).

4. **Ficha Técnica N° 04: Suplementación Preventiva con Hierro (<36m)**:
   $$\text{Suplementación Hierro (\%)} = \left( \frac{\text{num\_hierro}}{\text{den\_hierro}} \right) \times 100$$
   *Denominador (`den_hierro`)*: Total niños usuarios evaluados para suplementación.  
   *Numerador (`num_hierro`)*: Niños que reciben entregas de suplemento de hierro.

5. **Ficha Técnica N° 05: Cumplimiento de Tratamiento Terapéutico (con 2 Dosajes)**:
   $$\text{Tratamiento Hierro (\%)} = \left( \frac{\text{num\_anemia\_fe}}{\text{den\_anemia\_fe}} \right) \times 100$$
   *Denominador (`den_anemia_fe`)*: Total niños diagnosticados con anemia.  
   *Numerador (`num_anemia_fe`)*: Niños con anemia que cumplen tratamiento con hierro.

---

## 🎨 4. ESTRUCTURA Y ORDEN EXACTO DE PANELES EN EL FRONTEND (`index.html`)

El layout de la pestaña **Niños y Niñas** está estructurado en 4 paneles de KPIs claramente delimitados:

1. **Panel 1**: Población Total Evaluada y Brecha Sin Atención HIS.
2. **Panel 2**: **Plan Multisectorial de Lucha Contra la Anemia (D.S. N° 002-2024-MIDIS)**:
   * Grid de 6 tarjetas (`grid-6col`):
     1. `Frecuencia de Anemia (6-35m)` (`data-kpi="frecuencia_anemia"`)
     2. `Dosaje Hemoglobina (Hb)` (`data-kpi="dosaje_hb"`)
     3. `Suplementación Hierro` (`data-kpi="hierro"`)
     4. `Tratamiento Hierro` (`data-kpi="anemia_fe"`)
     5. `Recuperación de Anemia` (`data-kpi="npr"`)
     6. `Anemia Gestantes PNCM` (`data-kpi="gestantes_anemia"`)
3. **Panel 2.5**: **Actividades Estratégicas y Metas Físicas del PNCM (Plan Multisectorial D.S. N° 002-2024-MIDIS)**:
   * Grid de 5 tarjetas alineadas en 1 sola fila horizontal (`grid-5col`):
     1. `Act. 4.12: Visitas Acompañamiento` (Meta: 277,283 familias SAF)
     2. `Act. 4.13: Capacitación SCD` (Meta: 18,899 actores comunales SCD)
     3. `Act. 4.14: Capacitación SAF` (Meta: 27,877 actores comunales SAF)
     4. `Act. 4.15: Atención Integral SCD` (Meta: 67,387 usuarios en CIAI)
     5. `Act. 4.16: Distritos Focalizados` (Meta: 1,011 a 1,576 distritos)
4. **Panel 3**: Seguimiento de Vacunación (Neumo/Rota, Completa) y Control CRED según Edad (`grid-3col`).
5. **Panel 4**: **Evaluación del Paquete Integrado de Servicios DIT (<24 Meses) - Indicador 16 (Desglose por Componente)**:
   * Grid de 6 tarjetas (`grid-6col`) en el **ORDEN ESTRICTO SOLICITADO POR EL USUARIO (DE IZQUIERDA A DERECHA)**:
     1. 🟩 `Paquete Integrado (<24m)` (`data-kpi="pqt"`)
     2. 🩵 `Dosaje Hemoglobina` (`data-kpi="dosaje_hb"`)
     3. 🩷 `Suplementación Hierro` (`data-kpi="hierro"`)
     4. 💙 `Vacunas (Neumo/Rota)` (`data-kpi="vrn"`)
     5. 💜 `Vacuna Completa / DNI` (`data-kpi="vac_completa"`)
     6. 💚 `Control CRED según Edad` (`data-kpi="cred"`)

---

## ⚠️ 5. HISTORIAL DE ERRORES RESUELTOS Y REGLAS INVIOLABLES DE DISEÑO/CÓDIGO

Claude o cualquier desarrollador que continúe este trabajo **DEBE RESPETAR ESTAS REGLAS STRICTAMENTE**:

### 🚫 1. Regla del Término Sanitario:
* **NUNCA** usar la palabra "Prevalencia de Anemia" para referirse a los datos del HIS MINSA. El término técnico normativo exacto exigido por el usuario es **"Frecuencia de Anemia"** (ya que se calcula sobre la población atendida en el programa).

### 🚫 2. Regla de la Cabecera Adhesiva (`position: sticky`):
* La cabecera `.app-header` contiene la barra de logotipos e insignias en la Fila 1 y la barra de navegación de herramientas `.header-nav-toolbar` (con el botón `≡ Filtros` y las pestañas de módulo) en la Fila 2.
* La cabecera está fijada en `position: sticky; top: 0; z-index: 9000;`. **NUNCA** separar el botón de filtros del encabezado ni moverlo fuera, ya que provocaría que se pierda al desplazarse hacia abajo.

### 🚫 3. Regla del Cierre Automático al Hacer Clic Afuera:
* En `app.js` (`initSidebarToggle`) existe un evento global `document.addEventListener('click')` junto al evento de `#sidebarBackdrop`. Al hacer clic fuera de `#sidebarFilters` y de `#btnToggleSidebar`, el panel lateral de filtros **se cierra automáticamente**. NUNCA eliminar o desactivar este manejador.

### 🚫 4. Regla del Filtro del Servicio SCD (Desactivación de Edades):
* Al seleccionar el filtro de servicio `SCD` (Servicio de Cuidado Diurno), las píldoras de grupo de edad `[0-5] Meses` y `[6-11] Meses` **deben desactivarse y ocultarse (`display: none`)**, ya que SCD solo atiende a niños a partir de los 6 u 8 meses en CIAI.

### 🚫 5. Regla del Periodo Predeterminado:
* El badge informativo del header debe indicar por defecto **`Cierre de Evaluación: JUNIO 2026`** (sin la etiqueta obsoleta de "Acumulado Anual").

### 🚫 6. Regla del Botón de Filtros Único:
* **NUNCA** volver a agregar botones flotantes duplicados ni botones adjuntos. Solo existe **UN ÚNICO botón de filtros** (`#btnToggleSidebar`) en el encabezado.

### 🚫 7. Regla del Orden del Paquete Integrado (<24m):
* **NUNCA** alterar el orden de las 6 tarjetas del Panel 4. El orden horizontal exacto es: 1. Paquete Integrado → 2. Dosaje Hb → 3. Suplementación Hierro → 4. Vacunas (Neumo/Rota) → 5. Vacuna Completa / DNI → 6. Control CRED según Edad.

---

## 🛠️ 6. COMANDOS DE DESARROLLO, VERIFICACIÓN Y COMPILACIÓN

```bash
# 1. Iniciar servidor local HTTP (Puerto 8050):
python server.py

# 2. Verificar respuesta HTTP local 200 OK:
python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8050/').status)"

# 3. Re-compilar el paquete standalone HTML autónomo:
python generate_rich_draft.py
# Genera: borrador_presentacion_dashboard.html (2.66 MB)

# 4. Actualizar/Re-generar los documentos técnicos del Plan Multisectorial:
python scratch/update_doc_fichas.py
```

---

## 📂 7. ÁRBOL DE ARCHIVOS CLAVE EN EL REPOSITORIO

```
Indicadores_PNCM_Dashboard/
├── index.html                   # Estructura HTML5 con cabecera sticky y paneles de KPIs
├── styles.css                   # CSS Vanilla con grid-6col, grid-5col, variables pastel y media queries
├── app.js                       # Reactividad JS, consulta API REST, renderizado Chart.js y mapa Leaflet
├── server.py                    # Servidor Python HTTP (Puerto 8050) y motor de consultas SQLite
├── dashboard_data.db            # Base de datos SQLite (tablas gestantes_summary, ninos_summary, etc.)
├── borrador_presentacion_dashboard.html # Presentación Base64 independiente lista para producción
├── COWORK_HANDOVER_CLAUDE.md    # Este documento de relevo y evaluación cowork
└── Anemia_Plan_Multisectorial/  # Documentación técnica del D.S. N° 002-2024-MIDIS
    ├── DS -002-2024 Plan Multisectorial ANEMIA.pdf # PDF Oficial
    ├── Resumen_Plan_Multisectorial_Anemia_PNCM.md # Informe técnico con superíndices y Fichas Técnicas
    └── Resumen_Plan_Multisectorial_Anemia_PNCM.html # Informe técnico en formato Web para imprimir/PDF
```
"""

with open(handover_path, 'w', encoding='utf-8') as f:
    f.write(handover_content)

print('Handover doc generated successfully at:', handover_path)
