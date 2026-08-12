# Project: PNCM Dashboard Audit & Reconciliation Project

## Architecture
- **Data Layer**: Excel Files (`INDICADORES HIS - GESTANTES v1.0 - Junio 2026.xlsx`, `INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx`) vs SQLite DB (`dashboard_data.db`: `gestantes`, `ninos`, `gestantes_summary`, `ninos_summary`, `ninos_geo_summary`) vs Static JSONs (`data/gestantes.json`, `data/ninos.json`).
- **Backend Service**: `server.py` (Python HTTP Server serving REST API endpoints: `/api/ninos`, `/api/gestantes`, `/api/filters`).
- **Legal & Technical Standards**: Plan Multisectorial D.S. N° 002-2024-MIDIS & DL DIT Indicador 16.
- **Reporting**: Consolidated Audit Report in Markdown (`REPORTE_AUDITORIA_CONSOLIDADO.md`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Nominal & Geographic Audit | Audit 100% cell-by-cell Excel vs SQLite down to CIAI/Local level for Gestantes & Niños (2024-2026) | None | DONE |
| 2 | Automated Data & Cache Correction | Fix SQLite inconsistencies, sync static JSONs (`data/*.json`), update `server.py` logic | M1 | IN_PROGRESS |
| 3 | Technical Sheet & API Verification | Verify indicator formulas (D.S. 002-2024-MIDIS & DL DIT 16) and server endpoints status 200 & correct response data | M2 | PLANNED |
| 4 | Audit Report & Victory Report | Produce `REPORTE_AUDITORIA_CONSOLIDADO.md` with findings matrix, concordance table, corrections list | M3 | PLANNED |

## Interface Contracts
- **SQLite Database**: `dashboard_data.db` tables: `gestantes`, `ninos`, `gestantes_summary`, `ninos_summary`, `ninos_geo_summary`.
- **API Endpoints**:
  - `GET /api/ninos` -> JSON metrics for children indicators
  - `GET /api/gestantes` -> JSON metrics for pregnant women indicators
  - `GET /api/filters` -> JSON available geographical & service filter options

## Code Layout
- `dashboard_data.db`: Main SQLite database
- `data/gestantes.json`: Static JSON cache for gestantes
- `data/ninos.json`: Static JSON cache for ninos
- `server.py`: REST API server handler
- `INDICADORES HIS - GESTANTES v1.0 - Junio 2026.xlsx`: Official Excel workbook for pregnant women
- `INDICADORES HIS - NIÑOS v2.1 - Junio 2026.xlsx`: Official Excel workbook for children
