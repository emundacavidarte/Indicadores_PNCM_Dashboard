# 🤝 Documento de Relevo CoWork Claude & Antigravity (Cuna Más Dashboard)

> **Versión de Producción**: 2.5 (Junio 2026)  
> **Estado del Sistema**: 🟢 100% Funcional & Optimizado (Local HTTP & Vercel Serverless Function)  
> **Última Actualización**: 2026-08-10

---

## 📌 1. Visión General del Proyecto y Arquitectura

El **Dashboard de Indicadores Nominales del Programa Nacional Cuna Más (PNCM - MIDIS)** es una aplicación ejecutiva de alta precisión diseñada para el seguimiento de la **anemia materno-infantil** y la evaluación del **Paquete Integrado de Servicios DIT (<24 meses - Indicador 16 FED)**.

### 🏛️ Estructura del Proyecto
* **Frontend**: HTML5 Semántico + Vanilla CSS Glassmorphism (`styles.css`) + JavaScript Async modular (`app.js`).
* **Visualizaciones**: Chart.js (Tendencias históricas y Rankings por UT) + Leaflet.js (Mapa Temático Interactivo de Salud por Departamentos).
* **Backend**: Python `server.py` (Local HTTP en puerto 8050) & `api/index.py` (Vercel Serverless Function).
* **Base de Datos**: 
  - `dashboard_data.db` (555 MB - Entorno de Desarrollo Local con datos completos y agregados).
  - `api_data.db` (224 MB - Entorno de Producción Vercel optimizado con tablas de resumen agregadas e índices compuestos).

---

## 🚫 2. Reglas Inviolables de Negocio e Interfaz (1 a 20)

### 1. Término Sanitario Oficial:
* NUNCA usar la palabra "Prevalencia" en datos provistos por la base HIS. Usar estrictamente **"Frecuencia de Anemia"**.

### 2. Cabecera Sticky Integrada:
* La barra `.app-header` contiene los logotipos institucionales y la barra de navegación `.header-nav-toolbar` fijados en `position: sticky; top: 0; z-index: 9000;`. El botón `≡ Filtros` NUNCA debe separarse del encabezado.

### 3. Cierre Automático del Panel de Filtros:
* Al hacer clic fuera del panel lateral `#sidebarFilters` y del botón `#btnToggleSidebar`, el sidebar se cierra automáticamente.

### 4. Filtro por Servicio SCD vs SAF:
* Al seleccionar `SCD`, las píldoras de edad `[00-05]` y `[06-11]` meses se ocultan (`display: none`).
* Al seleccionar `SAF`, se muestran todas las píldoras de edad.

### 5. Periodo por Defecto:
* El badge de evaluación en el encabezado indica por defecto: **`Cierre de Evaluación: JUNIO 2026`**.

### 6. Estructura de Paneles en `index.html`:
* **Panel 1**: Población Total y Brecha Sin Atención HIS.
* **Panel 2.5**: Actividades Estratégicas y Metas Físicas del PNCM (4 actividades en `grid-4col`).
* **Panel 3**: Plan Multisectorial de Lucha Contra la Anemia (D.S. N° 002-2024-MIDIS).
* **Panel 4**: Evaluación del Paquete Integrado de Servicios DIT (<24 Meses) (6 componentes).

### 7. Comportamiento del Modal Ficha Técnica:
* Al hacer clic sobre cualquier tarjeta KPI, se actualizan los gráficos de tendencia y ranking de forma simultánea a la apertura de la ventana flotante Ficha Técnica.
* Al cerrar la ventana flotante, los gráficos permanecen cargados y visibles en la pantalla.

### 8. Transcripción Literal de Fichas Técnicas:
* El contenido de Numerador (A), Denominador (B), Definición Operativa y Propósito de cada ventana flotante proviene de la **transcripción 100% literal** de las Fichas Técnicas del documento oficial `Fichas_Indicadores_Paquete_Priorizado.pdf` (DGSE-MIDIS).

### 9. Lectura Directa de Estado en Memoria (`lastNinosData.kpis`):
* La ventana modal Ficha Técnica consulta los porcentajes y valores numéricos directamente desde el objeto en memoria (`lastNinosData.kpis[kpiKey]`), evitando selectores DOM propensos a duplicidad.

### 10. Etiquetado Explícito de Edades en KPIs:
* Todas las tarjetas exhiben en su título la cohorte normativamente evaluada (ej. `Frecuencia de Anemia (6-35m)`, `Dosaje Hb (6-8m / 6-35m)`, `Suplementación Hierro (<24m)`, `Tratamiento Hierro (6-11m)`, `Vacunas Neumo/Rota (<12m)`, `Vacunas Completas (hasta 18m)`, `Control CRED (<24m)`, `Paquete Integrado (<24m)`).

### 11. Ocultamiento Dinámico por Píldora de Edad:
* Al seleccionar una píldora de edad (`[24-35] Meses`), la interfaz oculta dinámicamente (`display: none`) las tarjetas KPI que no correspondan a esa cohorte (`<12m`, `<18m`, `<24m`, `6-11m`).

### 12. Exclusión de la Actividad 4.16 (Competencia Exclusiva MINSA):
* La Actividad 4.16 (*Meta 1,011 distritos focalizados*) es responsabilidad de la Secretaría Técnica Multisectorial y el MINSA. El Panel 2.5 de Cuna Más exhibe exclusivamente sus 4 actividades operativas directas: Act. 4.15 (Atención SCD), Act. 4.13 (Capacitación SCD), Act. 4.12 (Visitas SAF) y Act. 4.14 (Capacitación SAF).

### 13. Explicación Normativa de Denominadores:
* La diferencia entre el denominador de Anemia 6-35m (`271,173`) y Paquete Integrado `<24m` (`177,669`) responde a la restricción normativa de edad de la Ficha Técnica N° 36 (0-23m vs 6-35m), no a falta de DNI.

### 14. Compilación Standalone Autónomo:
* `generate_rich_draft.py` compila `borrador_presentacion_dashboard.html` incorporando CSS, JS e imágenes embebidas en Base64.

### 15. Despliegue en Vercel Serverless:
* Vercel utiliza `api/index.py` (función serverless) enrutada mediante `vercel.json` y la base optimizada `api_data.db` (224 MB). `dashboard_data.db` (555 MB) se encuentra ignorado en `.vercelignore`.

### 16. Optimización de Consultas SQL e Índices Compuestos:
* Todas las tablas de resumen cuentan con índices compuestos (`idx_ninos_geo_query`, `idx_ninos_trend_query`) acelerando los tiempos de respuesta a < 50ms.

### 17. Compresión GZIP y Cabeceras de Caché:
* Tanto el servidor local como la API Serverless emiten cabeceras `Content-Encoding: gzip` y `Cache-Control` optimizadas para cliente e intermediarios.

### 18. Retención de Estado de Navegación:
* Cambiar de pestaña entre Niños, Gestantes y Comparativo preserva el ámbito geográfico seleccionado.

### 19. Adaptabilidad Móvil (Responsive UI):
* La interfaz se ajusta fluidamente desde pantallas móviles (320px) hasta monitores 4K.

### 20. Auditoría de Compilación Sin Advertencias:
* Toda modificación en el código fuente debe ser verificada ejecutando la suite de pruebas locales (`test_vercel_handler.py` y comprobación en `http://localhost:8050/`).

---

## 🛠️ 3. Comandos Principales de Desarrollo

```bash
# Ejecutar Servidor Local (Desarrollo):
python server.py

# Probar Endpoint Vercel Serverless Localmente:
python scratch/test_vercel_handler.py

# Recompilar Presentación Standalone:
python generate_rich_draft.py
```
