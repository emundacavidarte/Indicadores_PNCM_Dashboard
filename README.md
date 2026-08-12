# 🚀 Tablero de Control de Indicadores HIS - Programa Nacional Cuna Más (MIDIS)

Paquete listo para la publicación en línea de la página web del **Dashboard de Control Cuidador 360°**.

---

## 📁 Archivos Incluidos en la Carpeta

- **`index.html`**: Estructura principal de la interfaz web.
- **`styles.css`**: Hoja de estilos con arquitectura de diseño responsiva sin espacios muertos.
- **`app.js`**: Lógica de aplicación frontend con soporte dual (API Backend Python o Modo Estático sin servidor).
- **`peru_departamentos.json`**: Polígonos GeoJSON de los 25 departamentos del Perú para el visor GIS.
- **`data/`**: Carpeta con los datos pre-agregados para funcionamiento 100% estático:
  - `data/filters.json` (Filtros regionales, de servicios y locales)
  - `data/gestantes.json` (KPIs, tendencias y ranking de gestantes)
  - `data/ninos.json` (KPIs, tendencias, ranking y tabla nominal de niños)
  - `data/map.json` (Capa de mapa choropleth y geolocalización de locales CIAI/SAF)
- **`Logo MIDIS - transparente.png`** / **`Logo Cuidador 360°-04.png`**: Identidad institucional.
- **`server.py` & `dashboard_data.db`**: Servidor Python SQLite para consultas dinámicas en vivo.
- **`.nojekyll`**: Asegura compatibilidad con GitHub Pages.

---

## 🌐 Opciones de Publicación en Línea

### Opción 1: GitHub Pages (Gratuito)
1. Sube el contenido de esta carpeta a un repositorio en GitHub.
2. Ingresa a **Settings** > **Pages**.
3. Selecciona la rama `main` y guarda.
4. En menos de 1 minuto tu web estará en línea en `https://<usuario>.github.io/<repositorio>/`.

### Opción 2: Netlify / Vercel (Recomendado para despliegue rápido)
1. Entra a [Netlify Drop](https://app.netlify.com/drop) o Vercel.
2. Arrastra esta carpeta completa (`Indicadores_PNCM_Dashboard`).
3. Obtendrás un enlace HTTPS en segundos.

### Opción 3: Servidor Web Institucional MIDIS (cPanel / Apache / Nginx / IIS)
1. Sube los archivos al directorio web público de tu servidor (`public_html` o `wwwroot`).
2. Abre la URL en cualquier navegador.

### Opción 4: Servidor Backend Python (Ejecución Dinámica SQL)
```bash
python server.py
```
Abre en el navegador: `http://localhost:8050/`
