let lastUserNinosService = 'Todos';
/* ==========================================================================
   PROGRAMA NACIONAL CUNA MÁS - DASHBOARD HIS DE CONTROL (GESTANTES Y NIÑOS)
   LÓGICA JAVASCRIPT FRONTEND, INTERACCIONES Y RENDERIZADO DE GRÁFICOS
   ========================================================================== */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
    ? 'http://127.0.0.1:8050' 
    : '';

// App State
let currentTab = 'tabNinos';
let currentAgeGroup = 'Todos';
let filtersData = {};
let ninosTableFullData = [];
let ninosDataCache = {};

let selectedGestantesKpiKey = 'frecuencia_anemia';
let selectedNinosKpiKey = 'frecuencia_anemia';
let lastGestantesData = null;
let lastNinosData = null;

// GIS Peru Map State
let leafletMap = null;
let geojsonLayer = null;
let markersLayerGroup = null;
let peruDepartmentsGeoJson = null;

const GESTANTES_KPI_CONFIG = {
    'total': { title: 'Gestantes Usuarias - Evolución Histórica', subtitle: 'Total de gestantes usuarias en Padrón Nominal (SAF)', field: 'gestantes', label: 'Gestantes Usuarias', color: '#772A91', isPct: false },
    'g_total': { title: 'Gestantes Usuarias - Evolución Histórica', subtitle: 'Total de gestantes usuarias en Padrón Nominal (SAF)', field: 'gestantes', label: 'Gestantes Usuarias', color: '#772A91', isPct: false },
    'sin_atencion_his': { title: 'Gestantes Sin Registro / Atención HIS - Evolución Histórica', subtitle: 'Gestantes usuarias del Padrón Nominal sin registro de atención de salud en el sistema HIS MINSA', field: 'sin_atencion_pct', label: 'Sin Atención HIS (%)', color: '#EA580C', isPct: true },
    'g_sin_atencion_his': { title: 'Gestantes Sin Registro / Atención HIS - Evolución Histórica', subtitle: 'Gestantes usuarias del Padrón Nominal sin registro de atención de salud en el sistema HIS MINSA', field: 'sin_atencion_pct', label: 'Sin Atención HIS (%)', color: '#EA580C', isPct: true },
    'frecuencia_anemia': { title: 'Frecuencia de Anemia en Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia sobre las gestantes con dosaje', field: 'frecuencia_anemia_pct', label: 'Frecuencia Anemia (%)', color: '#E40E20', isPct: true },
    'gestantes_anemia': { title: 'Frecuencia de Anemia en Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia sobre las gestantes con dosaje', field: 'frecuencia_anemia_pct', label: 'Frecuencia Anemia (%)', color: '#E40E20', isPct: true },
    'apn': { title: 'Atención Prenatal (APN) Oportuna - Evolución Histórica', subtitle: 'Porcentaje de gestantes con al menos 4 atenciones prenatales oportunas', field: 'apn_pct', label: 'APN Oportuna (%)', color: '#009FE3', isPct: true },
    'g_apn': { title: 'Atención Prenatal (APN) Oportuna - Evolución Histórica', subtitle: 'Porcentaje de gestantes con al menos 4 atenciones prenatales oportunas', field: 'apn_pct', label: 'APN Oportuna (%)', color: '#009FE3', isPct: true },
    'sfaf': { title: 'Suplementación de Sulfato Ferroso y Ácido Fólico - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben suplementación con sulfato ferroso y ácido fólico', field: 'sfaf_pct', label: 'Suplementación SFAF (%)', color: '#8B5CF6', isPct: true },
    'g_sfaf': { title: 'Suplementación de Sulfato Ferroso y Ácido Fólico - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben suplementación con sulfato ferroso y ácido fólico', field: 'sfaf_pct', label: 'Suplementación SFAF (%)', color: '#8B5CF6', isPct: true },
    'aux': { title: 'Exámenes Auxiliares del 1er y 2do Trimestre - Evolución Histórica', subtitle: 'Porcentaje de gestantes con exámenes auxiliares completos', field: 'aux_pct', label: 'Exámenes Auxiliares (%)', color: '#10B981', isPct: true },
    'g_aux': { title: 'Exámenes Auxiliares del 1er y 2do Trimestre - Evolución Histórica', subtitle: 'Porcentaje de gestantes con exámenes auxiliares completos', field: 'aux_pct', label: 'Exámenes Auxiliares (%)', color: '#10B981', isPct: true },
    'pqt': { title: 'Paquete Integrado de Salud para Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben el paquete integrado de atención en salud', field: 'pqt_pct', label: 'Paquete Integrado (%)', color: '#059669', isPct: true },
    'g_pqt': { title: 'Paquete Integrado de Salud para Gestantes - Evolución Histórica', subtitle: 'Porcentaje de gestantes que reciben el paquete integrado de atención en salud', field: 'pqt_pct', label: 'Paquete Integrado (%)', color: '#059669', isPct: true },
    'parto_ins': { title: 'Atención de Parto Institucional - Evolución Histórica', subtitle: 'Porcentaje de gestantes usuarias con atención de parto en establecimiento de salud', field: 'parto_pct', label: 'Parto Institucional (%)', color: '#D97706', isPct: true },
    'g_parto_ins': { title: 'Atención de Parto Institucional - Evolución Histórica', subtitle: 'Porcentaje de gestantes usuarias con atención de parto en establecimiento de salud', field: 'parto_pct', label: 'Parto Institucional (%)', color: '#D97706', isPct: true }
};

const NINOS_KPI_CONFIG = {
    'dni_30d': {
        title: 'DNI Emitido hasta 30 días de nacido (Ind. 9 - Cód. 29) - Evolución Histórica',
        subtitle: 'Porcentaje de niños menores de 12 meses con DNI emitido dentro de los 30 días posteriores al nacimiento',
        field: 'bpn_pct',
        label: 'DNI Emitido (<=30d) (%)',
        color: '#6B21A8',
        isPct: true
    },
    'bpn': {
        title: 'DNI Emitido hasta 30 días de nacido (Ind. 9 - Cód. 29) - Evolución Histórica',
        subtitle: 'Porcentaje de niños menores de 12 meses con DNI emitido dentro de los 30 días posteriores al nacimiento',
        field: 'bpn_pct',
        label: 'DNI Emitido (<=30d) (%)',
        color: '#6B21A8',
        isPct: true
    },
    'total': {
        title: 'Niños y Niñas Atendidos - Evolución Histórica',
        subtitle: 'Total de niños y niñas atendidos en Padrón Nominal (SAF + SCD)',
        field: 'ninos',
        label: 'Niños Atendidos',
        color: '#772A91',
        isPct: false
    },
    'sin_atencion_his': {
        title: 'Niños y Niñas Sin Registro / Atención HIS - Evolución Histórica',
        subtitle: 'Niños(as) del Padrón Nominal sin registro de atención de salud en el sistema HIS MINSA',
        field: 'sin_atencion_pct',
        label: 'Sin Atención HIS (%)',
        color: '#EA580C',
        isPct: true
    },
    'dosaje_hb': {
        title: 'Tamizaje y Dosaje de Hemoglobina - Evolución Histórica',
        subtitle: 'Porcentaje de niños y niñas con tamizaje de hemoglobina registrado',
        field: 'dosaje_hb_pct',
        label: 'Dosaje Hemoglobina (%)',
        color: '#009FE3',
        isPct: true
    },
    'frecuencia_anemia': {
        title: 'Frecuencia de Anemia en Niños y Niñas - Evolución Histórica',
        subtitle: 'Porcentaje de niños(as) de 6 a 35 meses diagnosticados con anemia sobre los evaluados con dosaje',
        field: 'frecuencia_anemia_pct',
        label: 'Frecuencia Anemia (%)',
        color: '#E40E20',
        isPct: true
    },
    'cred': {
        title: 'Control de Crecimiento y Desarrollo (CRED) según Edad - Evolución Histórica',
        subtitle: 'Porcentaje de niños y niñas con controles CRED completos según edad',
        field: 'cred_pct',
        label: 'CRED según Edad (%)',
        color: '#84CC16',
        isPct: true
    },
    'vrn': {
        title: 'Vacunación Rotavirus y Neumococo (VRN) - Evolución Histórica',
        subtitle: 'Porcentaje de niños y niñas con vacunas de Neumococo y Rotavirus completas',
        field: 'vrn_pct',
        label: 'Vacuna Rotavirus/Neumococo (%)',
        color: '#06B6D4',
        isPct: true
    },
    'hierro': {
        title: 'Suplementación con Hierro - Evolución Histórica',
        subtitle: 'Niños menores a 24 meses que reciben suplementación con hierro para prevención',
        field: 'hierro_pct',
        label: 'Suplementación Hierro (%)',
        color: '#E6007E',
        isPct: true
    },
    'vac_completa': {
        title: 'Vacuna Completa (0-18m) - Evolución Histórica',
        subtitle: 'Niños hasta 18 meses con vacunas completas oportunas para su edad',
        field: 'vac_completa_pct',
        label: 'Vacuna Completa (%)',
        color: '#6B21A8',
        isPct: true
    },
    'anemia_fe': {
        title: 'Anemia con Dotación de Hierro - Evolución Histórica',
        subtitle: 'Niños con diagnóstico de anemia que reciben tratamiento con suplementación de hierro',
        field: 'anemia_fe_pct',
        label: 'Tratamiento Hierro (%)',
        color: '#009FE3',
        isPct: true
    },
    'pqt': {
        title: 'Paquete Completo Niño - Evolución Histórica',
        subtitle: 'Niños menores a 24 meses con Paquete Integrado de Servicios cumplido',
        field: 'pqt_pct',
        label: 'Paquete Completo (%)',
        color: '#8C9900',
        isPct: true
    },
    'vac_rotavirus': {
        title: 'Vacunación Rotavirus (2m, 4m) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con 2da dosis oportuna de vacuna contra Rotavirus',
        field: 'vrn_pct',
        label: 'Rotavirus (2m, 4m) (%)',
        color: '#009FE3',
        isPct: true
    },
    'vac_neumococo': {
        title: 'Vacunación Neumococo (2m, 4m, 12m) (Ind. 12 - Cód. 32) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con 3ra dosis oportuna de vacuna contra Neumococo',
        field: 'vrn_pct',
        label: 'Neumococo (2m, 4m, 12m) (%)',
        color: '#0284C7',
        isPct: true
    },
    'vac_pentavalente': {
        title: 'Vacunación Pentavalente (2m, 4m, 6m) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con 3ra dosis de Pentavalente / Hexavalente',
        field: 'vac_completa_pct',
        label: 'Pentavalente (2m, 4m, 6m) (%)',
        color: '#772A91',
        isPct: true
    },
    'vac_polio': {
        title: 'Vacunación Antipolio IPV (2m, 4m, 6m) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con 3ra dosis de Polio Inyectable IPV',
        field: 'vac_completa_pct',
        label: 'Antipolio IPV (2m, 4m, 6m) (%)',
        color: '#EA580C',
        isPct: true
    },
    'vac_spr': {
        title: 'Vacunación SPR (12m, 18m) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con dosis oportuna de Sarampión, Papera y Rubéola',
        field: 'vac_completa_pct',
        label: 'SPR (12m, 18m) (%)',
        color: '#84CC16',
        isPct: true
    },
    'gestantes_anemia': {
        title: 'Frecuencia de Anemia en Gestantes (SAF) - Evolución Histórica',
        subtitle: 'Porcentaje de gestantes evaluadas que presentan anemia',
        field: 'frecuencia_anemia_pct',
        label: 'Anemia Gestantes (%)',
        color: '#772A91',
        isPct: true
    }
};

// Chart Instances
let chartGestantesTrendInst = null;
let chartGestantesUTInst = null;
let chartNinosTrendInst = null;
let chartNinosUTInst = null;

document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initTabNavigation();
    initFilterEvents();
    initAgeFilterEvents();
    initKpiCardClickEvents();
    initComparisonEvents();
    initTableSearch();
    updateTabFilterUI();
    loadFilterOptions();
});

function initSidebarToggle() {
    const btnToggle = document.getElementById('btnToggleSidebar');
    const btnCloseMobile = document.getElementById('btnSidebarCloseMobile');
    const backdrop = document.getElementById('sidebarBackdrop');
    const mainLayout = document.getElementById('mainLayout');
    const sidebarFilters = document.getElementById('sidebarFilters');
    const btnBuscar = document.getElementById('btnBuscar');

    const openSidebar = () => {
        if (!mainLayout) return;
        mainLayout.classList.remove('sidebar-collapsed');
        document.body.classList.add('sidebar-open');
        setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize();
        }, 350);
    };

    const closeSidebar = () => {
        if (!mainLayout) return;
        mainLayout.classList.add('sidebar-collapsed');
        document.body.classList.remove('sidebar-open');
        setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize();
        }, 350);
    };

    const handleToggle = (e) => {
        if (e) e.stopPropagation();
        if (mainLayout.classList.contains('sidebar-collapsed')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    };

    if (btnToggle) btnToggle.addEventListener('click', handleToggle);

    if (btnCloseMobile) {
        btnCloseMobile.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            closeSidebar();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            closeSidebar();
        });
    }

    // AUTOMATIC OUTSIDE CLICK CLOSURE HANDLER
    document.addEventListener('click', (e) => {
        if (mainLayout && !mainLayout.classList.contains('sidebar-collapsed')) {
            const isInsideSidebar = sidebarFilters && sidebarFilters.contains(e.target);
            const isToggleBtn = btnToggle && btnToggle.contains(e.target);
            if (!isInsideSidebar && !isToggleBtn) {
                closeSidebar();
            }
        }
    });

    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            closeSidebar();
        });
    }
}

function applyServiceThemeUI() {
    const servicioSelect = document.getElementById('filterServicio');
    const servicio = servicioSelect ? servicioSelect.value : 'Todos';
    const body = document.body;
    const badgeIcon = document.getElementById('serviceBadgeIcon');
    const badgeTitle = document.getElementById('serviceBadgeTitle');
    const badgeSub = document.getElementById('serviceBadgeSub');

    body.classList.remove('theme-saf', 'theme-scd', 'theme-todos');

    if (currentTab === 'tabGestantes' || servicio === 'SAF') {
        body.classList.add('theme-saf');
        if (badgeIcon) badgeIcon.innerHTML = '<i class="fa-solid fa-person-pregnant"></i>';
        if (badgeTitle) badgeTitle.textContent = 'Servicio de Acompañamiento a Familias (SAF)';
        if (badgeSub) badgeSub.textContent = 'Monitoreo Nominal e Intervención Promocional en Gestantes y Familias';
    } else if (servicio === 'SCD') {
        body.classList.add('theme-scd');
        if (badgeIcon) badgeIcon.innerHTML = '<i class="fa-solid fa-house-chimney-window"></i>';
        if (badgeTitle) badgeTitle.textContent = 'Servicio de Cuidado Diurno (SCD)';
        if (badgeSub) badgeSub.textContent = 'Atención Integral Nominal en Centros de Cuidado Infantil Atención Diurna (CIAI)';
    } else {
        body.classList.add('theme-todos');
        if (badgeIcon) badgeIcon.innerHTML = '<i class="fa-solid fa-layer-group"></i>';
        if (badgeTitle) badgeTitle.textContent = 'Todos los Servicios (SAF + SCD)';
        if (badgeSub) badgeSub.textContent = 'Consolidado Nacional de Cobertura e Indicadores HIS PNCM';
    }

    // FILTER ACTIVIDADES ESTRATÉGICAS CARDS (PANEL 2.5) BY SERVICE (SCD vs SAF vs TODOS)
    const act415Card = document.querySelector('.kpi-card[data-kpi="act_415"]'); // SCD
    const act413Card = document.querySelector('.kpi-card[data-kpi="act_413"]'); // SCD
    const act412Card = document.querySelector('.kpi-card[data-kpi="act_412"]'); // SAF
    const act414Card = document.querySelector('.kpi-card[data-kpi="act_414"]'); // SAF

    const actGrid = document.querySelector('.kpi-grid.grid-4col');

    if (servicio === 'SCD') {
        if (act415Card) act415Card.style.display = '';
        if (act413Card) act413Card.style.display = '';
        if (act412Card) act412Card.style.display = 'none';
        if (act414Card) act414Card.style.display = 'none';
        if (actGrid) actGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (servicio === 'SAF') {
        if (act415Card) act415Card.style.display = 'none';
        if (act413Card) act413Card.style.display = 'none';
        if (act412Card) act412Card.style.display = '';
        if (act414Card) act414Card.style.display = '';
        if (actGrid) actGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        // Todos
        if (act415Card) act415Card.style.display = '';
        if (act413Card) act413Card.style.display = '';
        if (act412Card) act412Card.style.display = '';
        if (act414Card) act414Card.style.display = '';
        if (actGrid) actGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
}

/* ==========================================================================
   INTERACTIVE PERU GIS MAP FUNCTIONS
   ========================================================================== */
async function initPeruMap() {
    if (leafletMap) return;
    const container = document.getElementById('peruMapCanvas');
    if (!container) return;

    try {
        leafletMap = L.map('peruMapCanvas', {
            center: [-9.19, -75.015],
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: false,
            preferCanvas: true
        });

        // OpenStreetMap tile layer (reliable tile server)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(leafletMap);

        markersLayerGroup = L.layerGroup().addTo(leafletMap);

        const res = await fetch('peru_departamentos.json');
        peruDepartmentsGeoJson = await res.json();
    } catch (err) {
        console.error('Error initializing Leaflet Peru Map:', err);
    }
}

function getChoroplethColor(pct) {
    if (pct === undefined || pct === null || pct === 0) return '#F1F5F9';
    if (pct < 10.0) return '#DCFCE7';  // Cobertura Excelente (<10%)
    if (pct < 20.0) return '#FEF3C7';  // Leve (10% - 19%)
    if (pct < 30.0) return '#FED7AA';  // Moderada (20% - 29%)
    if (pct < 40.0) return '#FCA5A5';  // Severa (30% - 39%)
    return '#991B1B';                  // Crítica (>=40%)
}

async function renderPeruMap() {
    await initPeruMap();
    if (!leafletMap) return;

    try {
        const params = getSelectedFilterParams();
        let data;
        try {
            const res = await fetch(`${API_BASE}/api/map?${params.toString()}`);
            if (!res.ok) throw new Error('API server unavailable');
            data = await res.json();
        } catch (err) {
            console.warn('Backend API no disponible. Cargando fallback estático (data/map.json):', err);
            try {
                const res = await fetch('data/map.json');
                data = await res.json();
            } catch (staticErr) {
                console.error('Error al cargar mapa estático:', staticErr);
                return;
            }
        }
        
        const selectedDep = document.getElementById('filterDepartamento').value;
        const selectedProv = document.getElementById('filterProvincia').value;
        const selectedDist = document.getElementById('filterDistrito').value;

        // 1. Render Department Polygons (Choropleth Shading)
        if (geojsonLayer) leafletMap.removeLayer(geojsonLayer);

        const selectedUT = document.getElementById('filterUT').value;
        const selectedCG = document.getElementById('filterCG').value;
        const selectedLocal = document.getElementById('filterLocal').value;
        const hasSubFilter = (selectedProv !== 'Todos' || selectedDist !== 'Todos' || selectedCG !== 'Todos' || selectedLocal !== 'Todos');

        if (peruDepartmentsGeoJson) {
            geojsonLayer = L.geoJSON(peruDepartmentsGeoJson, {
                style: function(feature) {
                    const rawName = feature.properties.NOMBDEP || feature.properties.name || '';
                    const depName = rawName.toUpperCase().trim();
                    const depInfo = data.departments[depName] || {};
                    const pctVal = depInfo.frecuencia_anemia_pct;
                    
                    const isSelected = (selectedDep !== 'Todos' && depName === selectedDep);

                    return {
                        fillColor: getChoroplethColor(pctVal),
                        weight: isSelected ? 2.5 : 1,
                        opacity: hasSubFilter ? 0.4 : 1,
                        color: isSelected ? '#772A91' : '#64748B',
                        dashArray: isSelected ? '' : '2',
                        fillOpacity: hasSubFilter ? 0 : (isSelected ? 0.45 : 0.35)
                    };
                },
                onEachFeature: function(feature, layer) {
                    const rawName = feature.properties.NOMBDEP || feature.properties.name || '';
                    const depName = rawName.toUpperCase().trim();
                    const depInfo = data.departments[depName] || { total: 0, frecuencia_anemia_pct: 0 };

                    // Only show department tooltip when NO detailed local/district filter is active
                    if (!hasSubFilter) {
                        layer.bindTooltip(`
                            <div style="font-family: Outfit, sans-serif; font-size: 13px; font-weight: 700;">
                                <strong style="color: #772A91;">${depName}</strong><br/>
                                <span style="color: #475569;">Población: ${depInfo.total.toLocaleString()}</span><br/>
                                <span style="color: #E40E20;">Frecuencia Anemia: ${depInfo.frecuencia_anemia_pct}%</span>
                            </div>
                        `, { sticky: true });
                    }

                    layer.on('click', () => {
                        const depSelect = document.getElementById('filterDepartamento');
                        depSelect.value = depName;
                        ninosDataCache = {};
                        loadFilterOptions('filterDepartamento');
                    });
                }
            }).addTo(leafletMap);
        }

        // 2. Render CIAI / SAF Locales Markers
        markersLayerGroup.clearLayers();

        const locales = data.locales || [];
        const customIconSCD = L.divIcon({
            className: 'custom-map-pin',
            html: '<div style="background-color:#009FE3; width:14px; height:14px; border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 0 0 3px rgba(0,159,227,0.3), 0 2px 6px rgba(0,0,0,0.3);" title="Servicio Cuidado Diurno (SCD)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const customIconSAF = L.divIcon({
            className: 'custom-map-pin',
            html: '<div style="background-color:#E6007E; width:14px; height:14px; border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 0 0 3px rgba(230,0,126,0.3), 0 2px 6px rgba(0,0,0,0.3);" title="Acompañamiento a Familias (SAF)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const bounds = L.latLngBounds();

        locales.forEach(loc => {
            if (loc.lat && loc.lng) {
                const markerIcon = loc.servicio === 'SAF' ? customIconSAF : customIconSCD;
                const marker = L.marker([loc.lat, loc.lng], { icon: markerIcon });
                
                const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;

                // Tooltip anchored STRICTLY on the CIAI/SAF marker pin!
                marker.bindTooltip(`
                    <div style="font-family: Outfit, sans-serif; font-size: 12px; font-weight: 700; color: #1E293B;">
                        <span style="color: ${loc.servicio === 'SAF' ? '#E6007E' : '#009FE3'};">[${loc.servicio}]</span> ${loc.local}
                    </div>
                `, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -8]
                });

                marker.bindPopup(`
                    <div class="map-popup-box">
                        <div class="map-popup-header">
                            <span class="map-popup-title">${loc.local}</span>
                            <span class="map-popup-badge ${loc.servicio === 'SAF' ? 'badge-saf' : 'badge-scd'}">${loc.servicio}</span>
                        </div>
                        <div class="map-popup-detail">
                            <strong>Comité:</strong> ${loc.cg || 'N/A'}<br/>
                            <strong>Distrito:</strong> ${loc.dist}, ${loc.dep}<br/>
                            <strong>Dirección:</strong> ${loc.direccion || 'Sin dirección registrada'}
                        </div>
                        <a href="${gmapsUrl}" target="_blank" class="map-popup-link">
                            <i class="fa-solid fa-diamond-turn-right"></i> Ver en Google Maps
                        </a>
                    </div>
                `);

                markersLayerGroup.addLayer(marker);
                bounds.extend([loc.lat, loc.lng]);
            }
        });

        // 3. Zoom & Pan Control according to Active Filters
        if (selectedLocal !== 'Todos' || selectedCG !== 'Todos' || selectedDist !== 'Todos' || selectedProv !== 'Todos' || selectedDep !== 'Todos' || selectedUT !== 'Todos') {
            if (bounds.isValid()) {
                leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } else if (peruDepartmentsGeoJson && selectedDep !== 'Todos') {
                geojsonLayer.eachLayer(layer => {
                    const depName = (layer.feature.properties.NOMBDEP || '').toUpperCase().trim();
                    if (depName === selectedDep) {
                        leafletMap.fitBounds(layer.getBounds(), { padding: [30, 30] });
                    }
                });
            }
        } else {
            leafletMap.setView([-9.19, -75.015], 5.8);
        }

        setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize();
        }, 200);
    } catch (err) {
        console.error('Error rendering Peru map:', err);
    }
}

const FICHAS_TECNICAS_DB = {
    'total': {
        code: 'PADRÓN NOMINAL PNCM',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Padrón Nominal PNCM (Cuidado Diurno SCD y Acompañamiento SAF)',
        pdf_file: 'fichas_pdf/ficha_total.pdf',
        title: 'Población total de niñas y niños usuarios del PNCM',
        definition: 'Población total de niñas y niños usuarios activos y atendidos en los servicios de Cuidado Diurno (SCD) y Acompañamiento a Familias (SAF) del Programa Nacional Cuna Más.',
        numerator: 'A = Total de niñas y niños usuarios registrados en el Padrón Nominal PNCM.',
        denominator: 'B = Padrón Nominal PNCM.',
        his_codes: ['Padrón Nominal PNCM']
    },
    'dni_30d': {
        code: 'CÓDIGO 29 (INDICADOR 9)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Anexo 1 Fichas Técnicas Tablero de Control DGSE-MIDIS (Cód. 29) • Padrón Nominal / RENIEC',
        pdf_file: 'fichas_pdf/ficha_dni_30d.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM menores de 12 meses de edad con DNI emitido hasta los 30 días de nacido',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM menores de 12 meses de edad con Documento Nacional de Identidad (DNI) emitido hasta los 30 días de nacido.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM menores de 12 meses de edad con DNI emitido hasta los 30 días de nacido.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM menores de 12 meses de edad.',
        his_codes: ['RENIEC / Padrón Nominal: Fecha Emisión DNI - Fecha Nacimiento <= 30 días']
    },
    'pqt': {
        code: 'CÓDIGO 36 (INDICADOR 16)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Cruce Nominal Padrón PNCM vs. Base de Datos HIS MINSA',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Ficha Técnica Cód. 13 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        source: 'Fuente Oficial: Decreto Legislativo DIT / FED Indicador 16 • Fichas Técnicas Tablero de Control DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_pqt.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad con paquete integrado de servicios',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad con paquete integrado de servicios.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad que reciben el paquete integrado de servicios de acuerdo con su edad: CRED, vacunas neumococo y rotavirus, entrega de suplementos con hierro, dosaje de hemoglobina, y cuentan con DNI emitido hasta los 30 días de nacido.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad.',
        his_codes: ['Z001 (CRED)', '99381 (RN)', '90669 (Neumo)', '90670 (Neumo)', '90681 (Rota)', 'Z298 (SF/P/MN)', 'U310 (Hierro)', 'Z017-D (Hb)', '85018-D (Hb)']
    },
    'dosaje_hb': {
        code: 'CÓDIGO 35 (INDICADOR 15)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'fichas_pdf/ficha_dosaje_hb.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM de 170 y 250 días de edad con dosaje de hemoglobina',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM de 170 y 250 días de edad con dosaje de hemoglobina.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM de 170 y 250 días de edad con dosaje de hemoglobina.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM de 170 y 250 días de edad.',
        his_codes: ['Z017 (Tipo D)', '85018 (Tipo D)']
    },
    'frecuencia_anemia': {
        code: 'CÓDIGO 13 (INDICADOR 4)',
        area: 'MIDIS-PNCM CUNA MÁS',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Ficha Técnica Cód. 13 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_frecuencia_anemia.pdf',
        title: 'Porcentaje de niñas y niños de 6 a 35 meses de edad usuarios del PNCM con dosaje de hemoglobina y diagnóstico anemia',
        definition: 'Este indicador permite medir la proporción de niñas y niños de 6 a 35 meses de edad usuarios del PNCM con anemia.',
        numerator: 'A = Número de niñas y niños de 6 a 35 meses de edad, usuarios del PNCM, que cumplen con la definición del denominador y presentan diagnóstico de anemia.',
        denominator: 'B = Número de niñas y niños de 6 a 35 meses de edad, usuarios del PNCM con dosaje de hemoglobina en el mes anterior.',
        his_codes: ['D509 (Deficit de Hierro)', 'D500 (Anemia Sideroblástica)', 'D649 (Anemia No Especificada)']
    },
    'hierro': {
        code: 'CÓDIGO 34 (INDICADOR 14)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_hierro.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad que reciben suplementación con hierro',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad que reciben suplementación con hierro.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad que reciben suplementación con hierro.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad.',
        his_codes: ['Z298 (Administración de Hierro)', 'U310 (Suplementación)', 'LAB: SF1-11 (Sulfato Ferroso)', 'LAB: P01-11 (Polimaltosado)', 'LAB: MN1-11 (Micronutrientes)']
    },
    'anemia_fe': {
        code: 'CÓDIGO 39 (INDICADOR 19)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_anemia_fe.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM de 6 a 11 meses de edad con anemia que inician tratamiento con hierro',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarias del PNCM de 6 a 11 meses de edad con anemia que inician tratamiento con hierro.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM de 6 a 11 meses de edad con anemia que inician tratamiento con hierro.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM de 6 a 11 meses de edad con diagnóstico de anemia.',
        his_codes: ['D509 + Z298 / U310 (LAB: SF1, SF2... ó P01, P02...)']
    },
    'vrn': {
        code: 'CÓDIGO 31 (INDICADOR 11)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_vrn.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM hasta 12 meses de edad con vacunas de neumococo y rotavirus',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM hasta 12 meses de edad con vacunas de neumococo y rotavirus.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM hasta 12 meses de edad con vacunas de neumococo y rotavirus.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM hasta 12 meses de edad.',
        his_codes: ['90669 (Antineumocócica 10 Valente)', '90670 (Antineumocócica 13 Valente)', '90681 (Vacuna Rotavirus)']
    },
    'vac_completa': {
        code: 'CÓDIGO 41 (INDICADOR 21)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM hasta 18 meses con vacunas completas y oportunas para su edad',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM hasta 18 meses de edad con vacunas completas y oportunas para su edad.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM hasta 18 meses con vacunas completas y oportunas para su edad.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM hasta 18 meses de edad.',
        his_codes: ['90585 (BCG)', '90744 (HVB)', '90723 (Penta)', '90712/90713 (Antipolio)', '90681 (Rota)', '90669/90670 (Neumo)', '90707 (SPR)', '90717 (AMA)', '90701 (DPT)', '90657 (Influenza)']
    },
    'vac_rotavirus': {
        code: 'CÓDIGO 33 (INDICADOR 13)',
        area: 'DGSE-MIDIS / MINSA NTS 246',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'Paquete_Priorizado/Fichas_Indicadores_Paquete_Priorizado.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM con vacuna de Rotavirus (2m, 4m)',
        definition: 'Este indicador permite medir el grado de acceso oportuno a la vacuna contra rotavirus (2da dosis) en la población usuaria del PNCM según el Esquema Nacional de Vacunación.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM con esquema oportuno de 2 dosis contra Rotavirus.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM evaluados en el grupo de edad correspondiente.',
        his_codes: ['90681 (Vacuna Rotavirus 1ra y 2da dosis)']
    },
    'vac_neumococo': {
        code: 'CÓDIGO 32 (INDICADOR 12)',
        area: 'DGSE-MIDIS / MINSA NTS 246',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS (Cód. 32) • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'Indicadores del TC - Anexo 1-FT 57.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM con vacuna contra Neumococo (2m, 4m, 12m)',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM con esquema completo y oportuno contra el Neumococo (hasta 3 dosis según edad).',
        numerator: 'A = Número de niñas y niños usuarios del PNCM con vacuna contra el neumococo completa y oportuna para su edad.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM evaluados en el grupo de edad correspondiente.',
        his_codes: ['90669 (Antineumocócica 10 Valente)', '90670 (Antineumocócica 13 Valente)']
    },
    'vac_pentavalente': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM con vacuna Pentavalente / Hexavalente (2m, 4m, 6m)',
        definition: 'Mide la cobertura de las 3 dosis primarias de la vacuna combinada Pentavalente (DPT-HvB-Hib) o Hexavalente (DPT-HvB-Hib-IPV) para la prevención de difteria, tétanos, tos ferina, hepatitis B, haemophilus influenzae tipo b y poliomielitis.',
        numerator: 'A = Niñas y niños con 3 dosis de Pentavalente o Hexavalente registradas en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de edad correspondiente.',
        his_codes: ['90723 (Pentavalente)', '90749.06 (Hexavalente)']
    },
    'vac_polio': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM con vacuna Antipolio Inactivada IPV (2m, 4m, 6m)',
        definition: 'Mide la administración de las 3 dosis de vacuna inactivada contra la poliomielitis (IPV inyectable), asegurando la transición completa y el retiro de la vacuna oral APO según la NTS N° 246-MINSA.',
        numerator: 'A = Niñas y niños con 3 dosis de IPV inyectable (o componente IPV en Hexavalente).',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de edad correspondiente.',
        his_codes: ['90713 (Polio Inyectable IPV)', '90749.06 (Hexavalente con IPV)']
    },
    'vac_spr': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM con vacuna SPR (12m, 18m)',
        definition: 'Mide la administración oportuna de la vacuna contra Sarampión, Papera y Rubéola (1ra dosis a los 12 meses y 2da dosis a los 18 meses con intervalo mínimo de 6 meses).',
        numerator: 'A = Niñas y niños que registran dosis de SPR oportuna en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de edad correspondiente.',
        his_codes: ['90707 (Vacuna SPR: Sarampión, Papera, Rubéola)']
    },
    'cred': {
        code: 'CÓDIGO 30 (INDICADOR 10)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad con CRED completo y oportuno',
        definition: 'Este indicador permite medir el porcentaje de niñas y niños usuarios del PNCM menores de 24 meses de edad con CRED completo y oportuno para su edad.',
        numerator: 'A = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad con CRED completo y oportuno para su edad.',
        denominator: 'B = Número de niñas y niños usuarios del PNCM menores de 24 meses de edad.',
        his_codes: ['Z001 (Control de Crecimiento y Desarrollo del Niño)', '99381.01 (CRED Recién Nacido)']
    },
    'npr': {
        code: 'PLAN MULTISECTORIAL (OBJ. 1)',
        area: 'MINSA / MIDIS / GL',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Propuesta Metodológica UOAI-PNCM • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_npr.pdf',
        title: 'Porcentaje de niñas y niños de 6 a 35 meses con anemia que se recuperan (Hb >= 11.0 g/dL)',
        definition: 'Este indicador permite medir la proporción de niñas y niños usuarios del PNCM con diagnóstico de anemia que logran la recuperación de sus niveles de hemoglobina.',
        numerator: 'A = Número total de niñas y niños de 6 a 35 meses de edad, usuarios del PNCM con anemia que en su evaluación de seguimiento alcanzaron niveles normales de hemoglobina (Hb >= 11.0 g/dL).',
        denominator: 'B = Número total de niñas y niños de 6 a 35 meses de edad, usuarios del PNCM con diagnóstico inicial de anemia evaluados.',
        his_codes: ['D509 (Diagnóstico inicial)', 'Z017 / 85018 con LAB: Hb >= 11.0 g/dL']
    },
    'gestantes_anemia': {
        code: 'CÓDIGO 10 (INDICADOR 1)',
        area: 'MIDIS-PNCM CUNA MÁS',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Ficha Técnica Cód. 10 DGSE-MIDIS • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_gestantes_anemia.pdf',
        title: 'Porcentaje de gestantes usuarias del PNCM con anemia',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del PNCM con anemia.',
        numerator: 'A = Número de gestantes usuarias del PNCM con diagnóstico de anemia.',
        denominator: 'B = Número de gestantes usuarias del PNCM con dosaje de hemoglobina.',
        his_codes: ['Z349 / Z359 (Control Prenatal)', 'D509 (Anemia por deficiencia de hierro)', '85018 (Dosaje Hb)']
    },
    'sin_atencion_his': {
        code: 'BRECHA REGISTRO SALUD',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Cruce Nominal Padrón PNCM vs. Base de Datos HIS MINSA',
        pdf_file: 'fichas_pdf/ficha_sin_atencion_his.pdf',
        title: 'Porcentaje de usuarios del PNCM sin registro de atenciones en la base HIS MINSA',
        definition: 'Este indicador permite medir la proporción de usuarios registrados en el Padrón Nominal del PNCM que no cuentan con registros de atenciones de salud en la base HIS MINSA.',
        numerator: 'A = Número de usuarios del PNCM que no registran atención de salud en la base de datos HIS MINSA a la fecha de corte.',
        denominator: 'B = Número total de usuarios registrados en el Padrón Nominal del PNCM.',
        his_codes: ['Cruce Nominal Padrón PNCM vs Base HIS MINSA']
    },
    'apn': {
        code: 'CÓDIGO 25 (INDICADOR 5)',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_apn.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF con al menos 4 atenciones prenatales (APN)',
        definition: 'Mide la proporción de gestantes usuarias del SAF que reciben al menos 4 atenciones prenatales con suplemento de hierro y ácido fólico.',
        numerator: 'A = Número de gestantes usuarias del SAF con 4 o más APN registradas.',
        denominator: 'B = Número total de gestantes usuarias del SAF con parto en el período.',
        his_codes: ['Z349 / Z359 (Control Prenatal)', '99199.17 (Suplementación)']
    },
    'sfaf': {
        code: 'SUPLEMENTACIÓN GESTANTES',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_apn.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF con suplementación de hierro y ácido fólico',
        definition: 'Mide la entrega de suplementación con sulfato ferroso / hierro y ácido fólico a gestantes usuarias del SAF.',
        numerator: 'A = Gestantes usuarias que reciben suplemento de hierro y ácido fólico.',
        denominator: 'B = Total de gestantes usuarias evaluadas.',
        his_codes: ['99199.17', 'Z298 (Administración de Hierro)']
    },
    'aux': {
        code: 'EXÁMENES AUXILIARES',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_aux.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF con 4 exámenes auxiliares completos',
        definition: 'Mide la proporción de gestantes usuarias con exámen de hemoglobina, tamizaje VIH, prueba de sífilis y examen de orina.',
        numerator: 'A = Gestantes usuarias del SAF que registran los 4 exámenes auxiliares en el 1er trimestre.',
        denominator: 'B = Total de gestantes usuarias evaluadas.',
        his_codes: ['85018 (Hemoglobina)', '86703 (VIH)', '86592 (Sífilis)', '81000 (Examen Orina)']
    },
    'parto_ins': {
        code: 'PARTO INSTITUCIONAL',
        area: 'DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_parto_ins.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF con parto institucional',
        definition: 'Mide la proporción de gestantes usuarias del SAF cuyo parto fue atendido en un establecimiento de salud (IPRESS).',
        numerator: 'A = Gestantes usuarias con atención de parto en establecimiento de salud.',
        denominator: 'B = Total de mujeres usuarias con parto registrado en el período.',
        his_codes: ['59400 (Parto Institucional)']
    },
    'act_415': {
        code: 'ACTIVIDAD ESTRATÉGICA 4.15',
        area: 'PNCM / PLAN MULTISECTORIAL',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Padrón Nominal PNCM (SCD)',
        pdf_file: 'fichas_pdf/ficha_act_415.pdf',
        title: 'Act. 4.15: Atención integral en niñas y niños de 6 a 36 meses (SCD)',
        definition: 'Actividad estratégica 4.15 asignada directamente al PNCM en el Objetivo Específico 4 del Plan Multisectorial (DS 002-2024-MINSA). Meta física anual constante: 67,387 niños/as.',
        numerator: 'A = Cobertura acumulada de atención integral en locales CIAI (SCD).',
        denominator: 'B = Meta física anual del Plan Multisectorial (67,387 niños/as).',
        his_codes: ['Padrón Nominal Servicio de Cuidado Diurno (SCD)']
    },
    'act_413': {
        code: 'ACTIVIDAD ESTRATÉGICA 4.13',
        area: 'PNCM / PLAN MULTISECTORIAL',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Registro de Capacitaciones PNCM (SCD)',
        pdf_file: 'fichas_pdf/ficha_act_413.pdf',
        title: 'Act. 4.13: Capacitación a actores comunales de Cuidado Diurno (SCD)',
        definition: 'Actividad estratégica 4.13 del Plan Multisectorial orientada al fortalecimiento de capacidades del equipo técnico y actores comunales de SCD. Meta física anual constante: 18,899 personas.',
        numerator: 'A = Número de actores comunales y equipo técnico de SCD capacitados en prevención de anemia.',
        denominator: 'B = Meta física anual del Plan Multisectorial (18,899 personas).',
        his_codes: ['Registro de Capacitación SIRPNCM']
    },
    'act_412': {
        code: 'ACTIVIDAD ESTRATÉGICA 4.12',
        area: 'PNCM / PLAN MULTISECTORIAL',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Padrón Nominal PNCM (SAF)',
        pdf_file: 'fichas_pdf/ficha_act_412.pdf',
        title: 'Act. 4.12: Visitas de Acompañamiento Familiar (SAF)',
        definition: 'Actividad estratégica 4.12 del Plan Multisectorial mediante visitas semanales a hogares y sesiones de socialización. Meta física anual constante: 277,283 familias.',
        numerator: 'A = Cobertura acumulada de familias en acompañamiento familiar (SAF).',
        denominator: 'B = Meta física anual del Plan Multisectorial (277,283 familias).',
        his_codes: ['Padrón Nominal Servicio de Acompañamiento a Familias (SAF)']
    },
    'g_pqt': {
        code: 'CÓDIGO 27 (INDICADOR 7 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'fichas_pdf/ficha_g_pqt.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF que recibieron paquete integrado de servicios priorizados',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del SAF que reciben el paquete integrado de salud: 4 exámenes auxiliares en el 1er trimestre (hemoglobina, VIH, sífilis y examen de orina) + 4 o más atenciones prenatales (APN) con entregas de sulfato ferroso y ácido fólico.',
        numerator: 'A = Número de gestantes usuarias del SAF que recibieron el paquete integrado de servicios priorizados durante el transcurso del embarazo.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_apn': {
        code: 'CÓDIGO 25 (INDICADOR 5 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'fichas_pdf/ficha_apn.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF que recibieron al menos 4 atenciones prenatales con suplemento de hierro y ácido fólico',
        definition: 'Este indicador permite medir el porcentaje de gestantes usuarias del SAF que recibieron al menos 4 atenciones prenatales oportunas con entrega de suplemento de hierro y ácido fólico.',
        numerator: 'A = Número de gestantes usuarias del SAF que recibieron 4 o más APN con entrega de suplemento de hierro y ácido fólico.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_sfaf': {
        code: 'SUPLEMENTACIÓN GESTANTE',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'fichas_pdf/ficha_apn.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF que reciben suplementación con sulfato ferroso y ácido fólico',
        definition: 'Este indicador permite medir el porcentaje de gestantes usuarias del SAF que reciben suplementación preventiva de hierro y ácido fólico durante la gestación.',
        numerator: 'A = Número de gestantes usuarias del SAF que reciben entregas de sulfato ferroso y ácido fólico.',
        denominator: 'B = Número de gestantes usuarias del SAF evaluadas en el período.'
    },
    'g_aux': {
        code: 'EXÁMENES AUXILIARES GESTANTE',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS • Base HIS MINSA / Padrón Nominal PNCM',
        pdf_file: 'fichas_pdf/ficha_aux.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF con 4 exámenes auxiliares en el primer trimestre',
        definition: 'Este indicador permite medir la proporción de gestantes usuarias del SAF que en el primer trimestre reciben los 4 exámenes auxiliares: dosaje de hemoglobina/hematocrito, tamizaje de sífilis, tamizaje de VIH y examen de orina (o perfil obstétrico).',
        numerator: 'A = Número de gestantes usuarias del SAF que cuentan con los 4 exámenes auxiliares completos en el 1er trimestre.',
        denominator: 'B = Número de mujeres con parto reportadas durante su gestación como usuarias del SAF.'
    },
    'g_parto_ins': {
        code: 'CÓDIGO 28 (INDICADOR 8 GESTANTES)',
        area: 'DGSE-MIDIS',
        source: 'Fuente Oficial: Base de datos HIS MINSA / CNV (Certificado de Nacido Vivo) • Fichas Técnicas DGSE-MIDIS',
        pdf_file: 'fichas_pdf/ficha_parto_ins.pdf',
        title: 'Porcentaje de partos institucionales en el último nacimiento de gestantes usuarias del SAF',
        definition: 'Este indicador permite medir el porcentaje de partos institucionales (atendidos en un establecimiento de salud IPRESS) en el último nacimiento de las gestantes usuarias del SAF.',
        numerator: 'A = Número de mujeres con parto institucional (en IPRESS MINSA/Gobierno Regional) que durante su gestación fueron usuarias del SAF.',
        denominator: 'B = Número de mujeres con parto que fueron reportadas durante su gestación como usuarias del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_sin_atencion_his': {
        code: 'BRECHA REGISTRO SALUD GESTANTES',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Cruce Nominal Padrón PNCM (SAF) vs. Base de Datos HIS MINSA',
        pdf_file: 'fichas_pdf/ficha_g_sin_atencion_his.pdf',
        title: 'Porcentaje de gestantes usuarias del SAF sin registro de atenciones en la base HIS MINSA',
        definition: 'Este indicador permite medir la proporción de gestantes registradas en el Padrón Nominal del servicio SAF que no cuentan con registros de atenciones de salud en la base HIS MINSA para el período evaluado.',
        numerator: 'A = Número de gestantes usuarias del SAF que no registran atenciones de salud en HIS MINSA.',
        denominator: 'B = Número total de gestantes registradas en el Padrón Nominal del Servicio de Acompañamiento a Familias (SAF).'
    },
    'g_total': {
        code: 'PADRÓN NOMINAL SAF',
        area: 'MONITOREO PNCM',
        source: 'Fuente Oficial: Padrón Nominal PNCM (Servicio de Acompañamiento a Familias - SAF)',
        pdf_file: 'fichas_pdf/ficha_g_total.pdf',
        title: 'Gestantes usuarias registradas en el Servicio de Acompañamiento a Familias (SAF)',
        definition: 'Este indicador muestra la población total de gestantes usuarias atendidas y registradas activamente en el Padrón Nominal del servicio SAF.',
        numerator: 'A = Total de gestantes usuarias registradas en el Padrón Nominal SAF.',
        denominator: 'B = Padrón Nominal SAF.'
    },
    'act_414': {
        code: 'ACTIVIDAD ESTRATÉGICA 4.14',
        area: 'PNCM / PLAN MULTISECTORIAL',
        source: 'Fuente Oficial: Plan Multisectorial Anemia (D.S. N° 002-2024-MINSA) • Registro de Capacitaciones PNCM (SAF)',
        pdf_file: 'fichas_pdf/ficha_act_414.pdf',
        title: 'Act. 4.14: Capacitación a actores comunales de Acompañamiento (SAF)',
        definition: 'Actividad estratégica 4.14 del Plan Multisectorial orientada al fortalecimiento de capacidades del equipo técnico y actores comunales de SAF. Meta física anual constante: 27,877 personas.',
        numerator: 'A = Número de actores comunales y equipo técnico de SAF capacitados en prevención de anemia.',
        denominator: 'B = Meta física anual del Plan Multisectorial (27,877 personas).',
        his_codes: ['Registro de Capacitación SIRPNCM']
    }
};

function openFichaTecnicaModal(kpiKey) {
    let actualKey = kpiKey;
    if (currentTab === 'tabGestantes') {
        const gestantesKeyMap = {
            'pqt': 'g_pqt',
            'frecuencia_anemia': 'gestantes_anemia',
            'total': 'g_total',
            'sin_atencion_his': 'g_sin_atencion_his',
            'apn': 'g_apn',
            'sfaf': 'g_sfaf',
            'aux': 'g_aux',
            'parto_ins': 'g_parto_ins'
        };
        actualKey = gestantesKeyMap[kpiKey] || kpiKey;
    }

    const ficha = FICHAS_TECNICAS_DB[actualKey] || FICHAS_TECNICAS_DB[kpiKey];
    if (!ficha) return;

    const modal = document.getElementById('modalFichaTecnicaContainer');
    if (!modal) return;

    document.getElementById('fCodeBadge').textContent = ficha.code;
    document.getElementById('fAreaBadge').textContent = ficha.area || 'PNCM / MIDIS';
    document.getElementById('fSourceFooter').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${ficha.source || 'Fuente Oficial: Padrón Nominal PNCM / Base HIS MINSA'}`;
    document.getElementById('fTitle').textContent = ficha.title;
    document.getElementById('fDefinition').textContent = ficha.definition;
    document.getElementById('fNumerator').textContent = ficha.numerator;
    document.getElementById('fDenominator').textContent = ficha.denominator;

    // Configure PDF Download button dynamically for this specific indicator
    const btnPdf = document.getElementById('btnDownloadFichaPdf');
    if (btnPdf) {
        const pdfFile = ficha.pdf_file || 'Paquete_Priorizado/Fichas_Indicadores_Paquete_Priorizado.pdf';
        btnPdf.href = pdfFile;
        const filename = pdfFile.split('/').pop();
        btnPdf.setAttribute('download', filename);
        btnPdf.title = `Descargar Ficha Técnica oficial en PDF (${ficha.code})`;
    }

    // Direct lookup from data state (lastNinosData / lastGestantesData)
    let kpiData = null;
    if (currentTab === 'tabGestantes' && lastGestantesData && lastGestantesData.kpis) {
        kpiData = lastGestantesData.kpis[kpiKey] || lastGestantesData.kpis[actualKey];
        if (!kpiData && kpiKey === 'total') {
            const tot = lastGestantesData.kpis.total_gestantes || 0;
            kpiData = { pct: 100, num: tot, den: tot };
        }
    } else if (lastNinosData && lastNinosData.kpis) {
        kpiData = lastNinosData.kpis[kpiKey];
    }

    if (kpiData) {
        document.getElementById('fCurrentPct').textContent = `${kpiData.pct}%`;
        document.getElementById('fCurrentNum').textContent = `${(kpiData.num || 0).toLocaleString()} cumplieron`;
        document.getElementById('fCurrentDen').textContent = `${(kpiData.den || 0).toLocaleString()} evaluados`;
    } else {
        const kpiCard = document.querySelector(`.kpi-card[data-kpi="${kpiKey}"]`);
        const kpiValEl = kpiCard ? kpiCard.querySelector('.kpi-value') : null;
        const kpiSubEl = kpiCard ? kpiCard.querySelector('.kpi-sub') : null;
        document.getElementById('fCurrentPct').textContent = kpiValEl ? kpiValEl.textContent : '—';
        document.getElementById('fCurrentNum').textContent = kpiSubEl ? kpiSubEl.textContent : '—';
        document.getElementById('fCurrentDen').textContent = 'Padrón Nominal';
    }

    const codesContainer = document.getElementById('fHisCodes');
    if (codesContainer) {
        codesContainer.innerHTML = '';
    }

    modal.style.display = 'flex';
}

function setupKpiInfoButtons() {
    const allCards = document.querySelectorAll('.kpi-card');
    allCards.forEach(card => {
        const kpiKey = card.dataset.kpi;
        if (!kpiKey) return;
        
        let infoBtn = card.querySelector('.kpi-info-btn');
        if (!infoBtn) {
            infoBtn = document.createElement('button');
            infoBtn.type = 'button';
            infoBtn.className = 'kpi-info-btn';
            infoBtn.title = 'Ver Ficha Técnica';
            infoBtn.setAttribute('aria-label', 'Ver Ficha Técnica');
            infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            card.appendChild(infoBtn);
        }
        
        // Remove existing listener if any and bind cleanly
        infoBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            openFichaTecnicaModal(kpiKey);
        };
    });
}

function initKpiCardClickEvents() {
    // Close button & backdrop for Ficha Técnica modal
    const btnCloseFicha = document.getElementById('btnCloseFichaModal');
    const modalFicha = document.getElementById('modalFichaTecnicaContainer');
    if (btnCloseFicha && modalFicha) {
        btnCloseFicha.addEventListener('click', () => { modalFicha.style.display = 'none'; });
        modalFicha.addEventListener('click', (e) => { if (e.target === modalFicha) modalFicha.style.display = 'none'; });
    }

    // Attach top-right info dot buttons to all KPI cards
    setupKpiInfoButtons();

    // Gestantes KPI cards click (updates active border & reloads charts)
    const gCards = document.querySelectorAll('#tabGestantes .kpi-card');
    gCards.forEach(card => {
        card.addEventListener('click', () => {
            const kpiKey = card.dataset.kpi || 'frecuencia_anemia';
            gCards.forEach(c => c.classList.remove('active-kpi'));
            card.classList.add('active-kpi');
            selectedGestantesKpiKey = kpiKey;
            if (lastGestantesData) {
                renderGestantesTrendChart(lastGestantesData.trend);
                renderGestantesUTChart(lastGestantesData.ut_ranking);
            }
        });
    });

    // Niños KPI cards click (updates active border & reloads charts)
    const nCards = document.querySelectorAll('#tabNinos .kpi-card');
    nCards.forEach(card => {
        card.addEventListener('click', () => {
            const kpiKey = card.dataset.kpi || 'frecuencia_anemia';
            nCards.forEach(c => c.classList.remove('active-kpi'));
            card.classList.add('active-kpi');
            selectedNinosKpiKey = kpiKey;
            
            if (lastNinosData) {
                renderNinosTrendChart(lastNinosData.trend);
                renderNinosUTChart(lastNinosData.ut_ranking);
            }
        });
    });
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */
function initTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            document.getElementById(currentTab).classList.add('active');
            
            ninosDataCache = {};
            updateTabFilterUI();
            // Refresh filter dropdowns for current tab context and fetch data
            loadFilterOptions();
            if (currentTab === 'tabComparativo') {
                fetchComparisonData();
            }
            setTimeout(() => {
                if (leafletMap) leafletMap.invalidateSize();
            }, 150);
        });
    });

    const compModulo = document.getElementById('compModulo');
    if (compModulo) {
        compModulo.addEventListener('change', () => {
            updateTabFilterUI();
            if (currentTab === 'tabComparativo') {
                fetchComparisonData();
            }
        });
    }
}

function updateTabFilterUI() {
    const servicioSelect = document.getElementById('filterServicio');
    const localGroup = document.getElementById('filterLocalGroup');

    const topBanner = document.getElementById('topInstitutionalBanner');
    const topIcon = document.getElementById('topBannerIcon');
    const topTitle = document.getElementById('topBannerTitle');
    const topDesc = document.getElementById('topBannerDesc');

    if (topBanner) {
        if (currentTab === 'tabGestantes') {
            topBanner.className = 'institutional-banner';
            if (topIcon) topIcon.className = 'fa-solid fa-shield-heart banner-icon';
            if (topTitle) topTitle.textContent = 'Monitoreo Nominal e Intervención Institucional';
            if (topDesc) topDesc.innerHTML = 'El Programa Nacional Cuna Más <em>coadyuva, contribuye, promueve, articula, gestiona y acompaña</em> el seguimiento nominal de atenciones de salud y la adopción de prácticas saludables en gestantes usuarias.';
        } else if (currentTab === 'tabComparativo') {
            topBanner.className = 'institutional-banner banner-green';
            if (topIcon) topIcon.className = 'fa-solid fa-scale-balanced banner-icon';
            if (topTitle) topTitle.textContent = 'Monitoreo Comparativo de Coberturas e Indicadores HIS';
            if (topDesc) topDesc.innerHTML = 'Análisis comparativo interperiodos de indicadores de salud en el Programa Nacional Cuna Más.';
        } else {
            topBanner.className = 'institutional-banner banner-green';
            if (topIcon) topIcon.className = 'fa-solid fa-hands-holding-child banner-icon';
            if (topTitle) topTitle.textContent = 'Monitoreo Nominal del Desarrollo Infantil Temprano (DIT)';
            if (topDesc) topDesc.innerHTML = 'Cuna Más <em>promueve, articula, gestiona y acompaña</em> la vigilancia nominal de CRED, dosaje de hemoglobina, vacunación y entrega oportuna de hierro en coordinación con el sector Salud.';
        }
    }

    if (currentTab === 'tabGestantes') {
        // GESTANTES STRICT DOMAIN RULE: Only SAF. Block SCD completely!
        servicioSelect.innerHTML = '<option value="SAF">SAF (Acompañamiento a Familias)</option>';
        servicioSelect.value = 'SAF';
        servicioSelect.disabled = true;
        servicioSelect.classList.add('locked-select');

        // Hide CIAI/LOCAL filter (locales only belong to SCD)
        if (localGroup) localGroup.style.display = 'none';
    } else if (currentTab === 'tabNinos') {
        // Niños exist in both SAF and SCD
        servicioSelect.disabled = false;
        servicioSelect.classList.remove('locked-select');
        
        servicioSelect.innerHTML = `
            <option value="Todos">Todos los Servicios</option>
            <option value="SAF">SAF (Acompañamiento a Familias)</option>
            <option value="SCD">SCD (Cuidado Diurno)</option>
        `;
        
        // Restore user's explicit service choice for Niños (defaults to 'Todos')
        const restoredService = (lastUserNinosService && ['Todos', 'SAF', 'SCD'].includes(lastUserNinosService)) ? lastUserNinosService : 'Todos';
        servicioSelect.value = restoredService;

        if (localGroup) localGroup.style.display = (restoredService === 'SAF' ? 'none' : 'block');
    } else if (currentTab === 'tabComparativo') {
        const compModulo = document.getElementById('compModulo').value;
        if (compModulo === 'gestantes') {
            servicioSelect.innerHTML = '<option value="SAF">SAF (Acompañamiento a Familias)</option>';
            servicioSelect.value = 'SAF';
            servicioSelect.disabled = true;
            servicioSelect.classList.add('locked-select');
            if (localGroup) localGroup.style.display = 'none';
        } else {
            servicioSelect.disabled = false;
            servicioSelect.classList.remove('locked-select');
            servicioSelect.innerHTML = `
                <option value="Todos">Todos los Servicios</option>
                <option value="SAF">SAF (Acompañamiento a Familias)</option>
                <option value="SCD">SCD (Cuidado Diurno)</option>
            `;
            if (localGroup) localGroup.style.display = 'block';
        }
    }

    const ageBar = document.querySelector('.age-filter-bar');
    if (ageBar) {
        ageBar.style.display = (currentTab === 'tabNinos') ? 'flex' : 'none';
    }

    applyServiceThemeUI();
}

/* ==========================================================================
   FILTER OPTIONS AND CASCADING SELECTS
   ========================================================================== */
function getSelectedFilterParams(excludeKey = null) {
    const params = new URLSearchParams();
    
    params.append('tab', currentTab);

    const anio = document.getElementById('filterAnio').value;
    const mes = document.getElementById('filterMes').value;
    const servicio = document.getElementById('filterServicio').value;
    const ut = document.getElementById('filterUT').value;
    const departamento = document.getElementById('filterDepartamento').value;
    const provincia = document.getElementById('filterProvincia').value;
    const distrito = document.getElementById('filterDistrito').value;
    const cg = document.getElementById('filterCG').value;
    const local = document.getElementById('filterLocal').value;

    if (anio && excludeKey !== 'anio') params.append('anio', anio);
    if (mes && excludeKey !== 'mes') params.append('mes', mes);
    if (servicio && servicio !== 'Todos' && excludeKey !== 'servicio') params.append('servicio', servicio);
    if (ut && ut !== 'Todos' && excludeKey !== 'ut') params.append('ut', ut);
    if (departamento && departamento !== 'Todos' && excludeKey !== 'departamento') params.append('departamento', departamento);
    if (provincia && provincia !== 'Todos' && excludeKey !== 'provincia') params.append('provincia', provincia);
    if (distrito && distrito !== 'Todos' && excludeKey !== 'distrito') params.append('distrito', distrito);
    if (cg && cg !== 'Todos' && excludeKey !== 'cg') params.append('cg', cg);
    if (local && local !== 'Todos' && excludeKey !== 'local') params.append('local', local);

    if (currentTab === 'tabNinos' && currentAgeGroup && currentAgeGroup !== 'Todos') {
        params.append('grupo_edad', currentAgeGroup);
    }

    return params;
}

async function loadFilterOptions(targetSelect = null) {
    const params = getSelectedFilterParams();
    let data;
    try {
        const res = await fetch(`${API_BASE}/api/filters?${params.toString()}`);
        if (!res.ok) throw new Error('API server unavailable');
        data = await res.json();
    } catch (err) {
        console.warn('Backend API no disponible. Cargando fallback estático (data/filters.json):', err);
        try {
            const res = await fetch('data/filters.json');
            data = await res.json();
        } catch (staticErr) {
            console.error('Error al cargar filtros estáticos:', staticErr);
            return;
        }
    }

    filtersData = data;

    if (!targetSelect) {
            // Initial population
            populateSelect('filterAnio', data.anios.map(a => ({ id: a, label: a })), true);
            populateSelect('filterMes', [{ id: 'Todos', label: 'Todos los Meses' }].concat(data.meses), true);
            
            // Set default year and month if not selected
            if (data.anios.length > 0 && !document.getElementById('filterAnio').value) {
                document.getElementById('filterAnio').value = data.anios[0];
            }
            if (data.meses.length > 0 && !document.getElementById('filterMes').value) {
                document.getElementById('filterMes').value = data.meses[0].id;
            }
            
            updateHeaderPeriodBadge();

            populateSelect('filterUT', data.uts, false, true);
            populateSelect('filterDepartamento', data.departamentos, false, true);
            populateSelect('filterProvincia', data.provincias, false, true);
            populateSelect('filterDistrito', data.distritos, false, true);
            populateSelect('filterCG', data.comites_gestion, false, true);
            populateSelect('filterLocal', data.locales, false, true);

            // Populate comparison period dropdowns
            populateSelect('compPeriodo1', data.periodos, true);
            populateSelect('compPeriodo2', data.periodos, true);
            if (data.periodos.length >= 2) {
                document.getElementById('compPeriodo2').value = data.periodos[0].id;
                document.getElementById('compPeriodo1').value = data.periodos[1] ? data.periodos[1].id : data.periodos[0].id;
            }

            // Trigger initial fetch
            fetchDashboardData();
        } else if (targetSelect === 'filterAnio') {
            // Update months when year changes
            populateSelect('filterMes', [{ id: 'Todos', label: 'Todos los Meses' }].concat(data.meses), true);
            if (data.meses.length > 0) document.getElementById('filterMes').value = data.meses[0].id;
            updateHeaderPeriodBadge();
            fetchDashboardData();
        } else {
            // Update child geographic selects dynamically with strict hierarchy
            const geoOpts = getFilteredGeographicOptions(targetSelect);

            // Prefer dynamic API response from server.py when available, fallback to client geoOpts
            const utList = (data && data.uts && data.uts.length > 0) ? data.uts : (geoOpts ? geoOpts.uts : []);
            const depList = (data && data.departamentos && data.departamentos.length > 0) ? data.departamentos : (geoOpts ? geoOpts.departamentos : []);
            const provList = (data && data.provincias && data.provincias.length > 0) ? data.provincias : (geoOpts ? geoOpts.provincias : []);
            const distList = (data && data.distritos && data.distritos.length > 0) ? data.distritos : (geoOpts ? geoOpts.distritos : []);
            const cgList = (data && data.comites_gestion && data.comites_gestion.length > 0) ? data.comites_gestion : (geoOpts ? geoOpts.comites_gestion : []);
            const localList = (data && data.locales && data.locales.length > 0) ? data.locales : (geoOpts ? geoOpts.locales : []);

            const cascadeOrder = ['filterUT', 'filterDepartamento', 'filterProvincia', 'filterDistrito', 'filterCG', 'filterLocal'];
            const targetIdx = cascadeOrder.indexOf(targetSelect);

            cascadeOrder.forEach((id, idx) => {
                if (id !== targetSelect) {
                    const optionsMap = {
                        'filterUT': utList,
                        'filterDepartamento': depList,
                        'filterProvincia': provList,
                        'filterDistrito': distList,
                        'filterCG': cgList,
                        'filterLocal': localList
                    };
                    const opts = optionsMap[id] || [];
                    const preserve = (targetIdx === -1 || idx < targetIdx);
                    populateSelect(id, opts, false, preserve);

                    // Auto-select if there is only 1 matching geographic item besides 'Todos'
                    const selectEl = document.getElementById(id);
                    if (selectEl && selectEl.value === 'Todos' && opts.length === 2) {
                        selectEl.value = opts[1];
                    }
                }
            });
            
            // Auto-refresh dashboard live on filter change!
            fetchDashboardData();
        }
}

function getFilteredGeographicOptions(targetSelect) {
    if (!filtersData || !filtersData.hierarchy) return null;
    
    const hierarchy = filtersData.hierarchy;
    const selectedUT = document.getElementById('filterUT').value;
    const selectedDep = document.getElementById('filterDepartamento').value;
    const selectedProv = document.getElementById('filterProvincia').value;
    const selectedDist = document.getElementById('filterDistrito').value;
    const selectedCG = document.getElementById('filterCG') ? document.getElementById('filterCG').value : 'Todos';

    let availableUTs = new Set();
    let availableDeps = new Set();
    let availableProvs = new Set();
    let availableDists = new Set();
    let availableCGs = new Set();

    Object.keys(hierarchy).forEach(ut => {
        Object.keys(hierarchy[ut] || {}).forEach(dep => {
            Object.keys(hierarchy[ut][dep] || {}).forEach(prov => {
                Object.keys(hierarchy[ut][dep][prov] || {}).forEach(dist => {
                    const cgs = hierarchy[ut][dep][prov][dist] || [];
                    const iterateCGs = cgs.length > 0 ? cgs : ['_none_'];
                    iterateCGs.forEach(cg => {
                        const matchUT = (selectedUT === 'Todos' || ut === selectedUT);
                        const matchDep = (selectedDep === 'Todos' || dep === selectedDep);
                        const matchProv = (selectedProv === 'Todos' || prov === selectedProv);
                        const matchDist = (selectedDist === 'Todos' || dist === selectedDist);
                        const matchCG = (selectedCG === 'Todos' || cg === selectedCG);

                        if (matchDep && matchProv && matchDist && matchCG) availableUTs.add(ut);
                        if (matchUT && matchProv && matchDist && matchCG) availableDeps.add(dep);
                        if (matchUT && matchDep && matchDist && matchCG) availableProvs.add(prov);
                        if (matchUT && matchDep && matchProv && matchCG) availableDists.add(dist);
                        if (matchUT && matchDep && matchProv && matchDist && cg !== '_none_') availableCGs.add(cg);
                    });
                });
            });
        });
    });

    return {
        uts: ['Todos'].concat(Array.from(availableUTs).sort()),
        departamentos: ['Todos'].concat(Array.from(availableDeps).sort()),
        provincias: ['Todos'].concat(Array.from(availableProvs).sort()),
        distritos: ['Todos'].concat(Array.from(availableDists).sort()),
        comites_gestion: ['Todos'].concat(Array.from(availableCGs).sort())
    };
}

function resetChildFilters(changedId) {
    const cascadeOrder = ['filterUT', 'filterDepartamento', 'filterProvincia', 'filterDistrito', 'filterCG', 'filterLocal'];
    const idx = cascadeOrder.indexOf(changedId);
    if (idx !== -1) {
        for (let i = idx + 1; i < cascadeOrder.length; i++) {
            const childEl = document.getElementById(cascadeOrder[i]);
            if (childEl) childEl.value = 'Todos';
        }
    }
}

function updateHeaderPeriodBadge() {
    const anio = document.getElementById('filterAnio') ? document.getElementById('filterAnio').value : '2026';
    const mesSelect = document.getElementById('filterMes');
    const mesVal = mesSelect ? mesSelect.value : 'Todos';
    let periodText = `JUNIO ${anio}`;

    if (mesVal !== 'Todos' && mesSelect && mesSelect.options[mesSelect.selectedIndex]) {
        periodText = `${mesSelect.options[mesSelect.selectedIndex].textContent.toUpperCase()} ${anio}`;
    }
    
    const container = document.getElementById('headerPeriodContainer');
    if (!container) return;

    container.innerHTML = `
        <i class="fa-regular fa-calendar-check badge-icon"></i>
        <span>Cierre de Evaluación: <strong>${periodText}</strong></span>
    `;
}

function populateSelect(selectId, options, isObject = false, preserveValue = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '';

    options.forEach(opt => {
        const optionEl = document.createElement('option');
        if (isObject) {
            optionEl.value = opt.id;
            optionEl.textContent = opt.label;
        } else {
            optionEl.value = opt;
            optionEl.textContent = opt;
        }
        select.appendChild(optionEl);
    });

    if (preserveValue && currentValue && Array.from(select.options).some(o => o.value === currentValue)) {
        select.value = currentValue;
    } else {
        select.value = 'Todos';
    }
}

function initFilterEvents() {
    document.getElementById('btnBuscar').addEventListener('click', () => {
        ninosDataCache = {};
        updateHeaderPeriodBadge();
        fetchDashboardData();
    });

    document.getElementById('btnLimpiar').addEventListener('click', () => {
        ninosDataCache = {};
        lastUserNinosService = 'Todos';
        document.getElementById('filterServicio').value = 'Todos';
        document.getElementById('filterUT').value = 'Todos';
        document.getElementById('filterDepartamento').value = 'Todos';
        document.getElementById('filterProvincia').value = 'Todos';
        document.getElementById('filterDistrito').value = 'Todos';
        document.getElementById('filterCG').value = 'Todos';
        document.getElementById('filterLocal').value = 'Todos';
        applyServiceThemeUI();
        loadFilterOptions();
    });

    document.getElementById('filterAnio').addEventListener('change', () => {
        ninosDataCache = {};
        loadFilterOptions('filterAnio');
    });

    document.getElementById('filterMes').addEventListener('change', () => {
        ninosDataCache = {};
        updateHeaderPeriodBadge();
        fetchDashboardData();
    });

    const cascadingSelects = ['filterServicio', 'filterUT', 'filterDepartamento', 'filterProvincia', 'filterDistrito', 'filterCG', 'filterLocal'];
    cascadingSelects.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            ninosDataCache = {};
            resetChildFilters(id);
            if (id === 'filterServicio') {
                if (currentTab === 'tabNinos') {
                    lastUserNinosService = document.getElementById('filterServicio').value;
                }
                applyServiceThemeUI();
            }
            loadFilterOptions(id);
        });
    });
}

function updateAgePillsUI(ageCounts) {
    const servicioSelect = document.getElementById('filterServicio');
    const selectedService = servicioSelect ? servicioSelect.value : 'Todos';
    const pills = document.querySelectorAll('.age-pill');

    let resetToTodos = false;

    pills.forEach(pill => {
        const ageGroup = pill.dataset.age;
        if (ageGroup === 'Todos') return;

        let count = ageCounts ? (ageCounts[ageGroup] || 0) : 1;

        // Strict Cuna Más SCD Domain Rule: [00-05] Meses does not exist in SCD (Cuidado Diurno starts at 6m)
        if (selectedService === 'SCD' && ageGroup === '[00-05] Meses') {
            count = 0;
        }

        if (count === 0) {
            pill.style.display = 'none';
            if (pill.classList.contains('active')) {
                pill.classList.remove('active');
                resetToTodos = true;
            }
        } else {
            pill.style.display = 'inline-block';
        }
    });

    if (resetToTodos) {
        const todosPill = document.querySelector('.age-pill[data-age="Todos"]');
        if (todosPill) todosPill.classList.add('active');
        currentAgeGroup = 'Todos';
    }
}

function updateKpiCardsVisibilityByAge() {
    const age = currentAgeGroup;
    const servicioSelect = document.getElementById('filterServicio');
    const selectedService = servicioSelect ? servicioSelect.value : 'Todos';

    const kpiAgeRules = {
        'frecuencia_anemia': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'dosaje_hb': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'hierro': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'anemia_fe': ['Todos', '[06-11] Meses'],
        'vrn': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_completa': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'vac_rotavirus': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_neumococo': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'vac_pentavalente': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_polio': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_spr': ['Todos', '[12-23] Meses'],
        'cred': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'pqt': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'npr': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses'],
        'gestantes_anemia': ['Todos']
    };

    const cards = document.querySelectorAll('#tabNinos .kpi-card');
    let activeCardStillVisible = false;
    let firstVisibleCardKey = null;

    cards.forEach(card => {
        const kpiKey = card.dataset.kpi;
        if (!kpiKey) return;

        let visible = true;

        // Age rule check
        const allowedAges = kpiAgeRules[kpiKey];
        if (allowedAges && !allowedAges.includes(age)) {
            visible = false;
        }

        // Service rule check
        if (selectedService === 'SCD') {
            if (['gestantes_anemia', 'act_412', 'act_414'].includes(kpiKey)) {
                visible = false;
            }
        } else if (selectedService === 'SAF') {
            if (['act_415', 'act_413'].includes(kpiKey)) {
                visible = false;
            }
        }

        if (visible) {
            card.style.display = '';
            if (!firstVisibleCardKey) firstVisibleCardKey = kpiKey;
            if (card.classList.contains('active-kpi')) {
                activeCardStillVisible = true;
            }
        } else {
            card.style.display = 'none';
            card.classList.remove('active-kpi');
        }
    });

    // Auto fallback active card if current active card was hidden
    if (!activeCardStillVisible && firstVisibleCardKey) {
        selectedNinosKpiKey = firstVisibleCardKey;
        const targetCard = document.querySelector(`#tabNinos .kpi-card[data-kpi="${firstVisibleCardKey}"]`);
        if (targetCard) targetCard.classList.add('active-kpi');
        if (lastNinosData) {
            renderNinosTrendChart(lastNinosData.trend);
            renderNinosUTChart(lastNinosData.ut_ranking);
        }
    }
}

function initAgeFilterEvents() {
    const pills = document.querySelectorAll('.age-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (pill.style.display === 'none') return;
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentAgeGroup = pill.dataset.age;
            updateKpiCardsVisibilityByAge();
            if (currentTab === 'tabNinos') {
                fetchNinosData();
            }
        });
    });
}

/* ==========================================================================
   FETCH & RENDER DASHBOARD DATA
   ========================================================================== */
function fetchDashboardData() {
    if (currentTab === 'tabGestantes') {
        fetchGestantesData();
    } else if (currentTab === 'tabNinos') {
        fetchNinosData();
    } else if (currentTab === 'tabComparativo') {
        fetchComparisonData();
    }
    renderPeruMap();
}

// --------------------------------------------------------------------------
// 1. GESTANTES DATA
// --------------------------------------------------------------------------
async function fetchGestantesData() {
    const params = getSelectedFilterParams();
    try {
        const res = await fetch(`${API_BASE}/api/gestantes?${params.toString()}`);
        if (!res.ok) throw new Error('API server unavailable');
        const data = await res.json();
        lastGestantesData = data;
        
        renderGestantesKPIs(data.kpis);
        renderGestantesTrendChart(data.trend);
        renderGestantesUTChart(data.ut_ranking);
    } catch (err) {
        console.warn('Backend API no disponible. Cargando fallback estático (data/gestantes.json):', err);
        try {
            const res = await fetch('data/gestantes.json');
            const data = await res.json();
            lastGestantesData = data;
            
            renderGestantesKPIs(data.kpis);
            renderGestantesTrendChart(data.trend);
            renderGestantesUTChart(data.ut_ranking);
        } catch (staticErr) {
            console.error('Error al cargar datos estáticos de Gestantes:', staticErr);
        }
    }
}

function renderGestantesKPIs(kpis) {
    document.getElementById('gTotal').textContent = kpis.total_gestantes.toLocaleString();
    
    // Sin Atención HIS
    if (kpis.sin_atencion_his) {
        document.getElementById('gSinAtencionPct').textContent = `${kpis.sin_atencion_his.pct}%`;
        document.getElementById('gSinAtencionSub').textContent = `${kpis.sin_atencion_his.num.toLocaleString()} de ${kpis.sin_atencion_his.den.toLocaleString()} usu. sin atención`;
    }

    // Frecuencia de Anemia (EXPLICIT NUMERATOR & DENOMINATOR PHRASING)
    document.getElementById('gAnemiaPct').textContent = `${kpis.frecuencia_anemia.pct}%`;
    document.getElementById('gAnemiaSub').textContent = `${kpis.frecuencia_anemia.num.toLocaleString()} con anemia de ${kpis.frecuencia_anemia.den.toLocaleString()} evaluadas`;
    
    // APN
    document.getElementById('gApnPct').textContent = `${kpis.apn.pct}%`;
    document.getElementById('gApnSub').textContent = `${kpis.apn.num.toLocaleString()} con 4 APN de ${kpis.apn.den.toLocaleString()} evaluadas`;
    
    // SFAF
    if (document.getElementById('gSfafPct') && kpis.sfaf) {
        document.getElementById('gSfafPct').textContent = `${kpis.sfaf.pct}%`;
        document.getElementById('gSfafSub').textContent = `${kpis.sfaf.num.toLocaleString()} con SFAF de ${kpis.sfaf.den.toLocaleString()} atendidas`;
    }
    
    // Auxiliares
    document.getElementById('gAuxPct').textContent = `${kpis.aux.pct}%`;
    document.getElementById('gAuxSub').textContent = `${kpis.aux.num.toLocaleString()} con 4 aux. de ${kpis.aux.den.toLocaleString()} evaluadas`;
    
    // Paquete
    document.getElementById('gPqtPct').textContent = `${kpis.pqt.pct}%`;
    document.getElementById('gPqtSub').textContent = `${kpis.pqt.num.toLocaleString()} con paquete de ${kpis.pqt.den.toLocaleString()} gestantes`;
    
    // Parto
    if (document.getElementById('gPartoPct') && kpis.parto_ins) {
        document.getElementById('gPartoPct').textContent = `${kpis.parto_ins.pct}%`;
        document.getElementById('gPartoSub').textContent = `${kpis.parto_ins.num.toLocaleString()} inst. de ${kpis.parto_ins.den.toLocaleString()} atendidas`;
    }
}

function renderGestantesTrendChart(trend) {
    if (!trend || !Array.isArray(trend)) return;
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesTrendTitle').innerHTML = `<i class="fa-solid fa-chart-line"></i> ${config.title}`;
    document.getElementById('chartGestantesTrendSubtitle').textContent = config.subtitle;

    const ctx = document.getElementById('chartGestantesTrend').getContext('2d');
    if (chartGestantesTrendInst) chartGestantesTrendInst.destroy();

    const labels = trend.map(t => t.label);
    const metricData = trend.map(t => t[config.field] !== undefined ? t[config.field] : 0);

    chartGestantesTrendInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: config.label,
                    data: metricData,
                    borderColor: config.color,
                    backgroundColor: config.color + '1A',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${config.isPct ? context.raw + '%' : context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: config.isPct ? 100 : undefined,
                    ticks: { callback: v => config.isPct ? v + '%' : v.toLocaleString() }
                }
            }
        }
    });
}

function renderGestantesUTChart(ranking) {
    if (!ranking || !Array.isArray(ranking)) return;
    const config = GESTANTES_KPI_CONFIG[selectedGestantesKpiKey] || GESTANTES_KPI_CONFIG['frecuencia_anemia'];
    
    document.getElementById('chartGestantesUTTitle').innerHTML = `<i class="fa-solid fa-chart-column"></i> Ranking por UT: ${config.label}`;
    document.getElementById('chartGestantesUTSubtitle').textContent = `Desglose comparativo por Unidad Territorial (${config.label})`;

    const ctx = document.getElementById('chartGestantesUT').getContext('2d');
    if (chartGestantesUTInst) chartGestantesUTInst.destroy();

    const topRanking = ranking.slice(0, 10);
    const labels = topRanking.map(r => r.ut);
    const metricData = topRanking.map(r => r[config.field] !== undefined ? r[config.field] : 0);

    chartGestantesUTInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: config.label,
                    data: metricData,
                    backgroundColor: config.color,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: config.isPct ? 100 : undefined,
                    ticks: { callback: v => config.isPct ? v + '%' : v.toLocaleString() }
                },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });
}

// --------------------------------------------------------------------------
// 2. NIÑOS DATA
// --------------------------------------------------------------------------
async function fetchNinosData() {
    const params = getSelectedFilterParams();
    const cacheKey = params.toString();

    if (ninosDataCache[cacheKey]) {
        const data = ninosDataCache[cacheKey];
        lastNinosData = data;
        updateAgePillsUI(data.age_counts);
        renderNinosKPIs(data.kpis);
        updateKpiCardsVisibilityByAge();
        renderNinosTrendChart(data.trend);
        renderNinosUTChart(data.ut_ranking);
        ninosTableFullData = data.cg_table || [];
        renderNinosTable(ninosTableFullData);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/ninos?${params.toString()}`);
        if (!res.ok) throw new Error('API server unavailable');
        const data = await res.json();
        ninosDataCache[cacheKey] = data;
        lastNinosData = data;
        
        updateAgePillsUI(data.age_counts);
        renderNinosKPIs(data.kpis);
        updateKpiCardsVisibilityByAge();
        renderNinosTrendChart(data.trend);
        renderNinosUTChart(data.ut_ranking);
        
        ninosTableFullData = data.cg_table || [];
        renderNinosTable(ninosTableFullData);
    } catch (err) {
        console.warn('Backend API no disponible. Cargando fallback estático (data/ninos.json):', err);
        try {
            const res = await fetch('data/ninos.json');
            const data = await res.json();
            ninosDataCache[cacheKey] = data;
            lastNinosData = data;
            
            updateAgePillsUI(data.age_counts);
            renderNinosKPIs(data.kpis);
        updateKpiCardsVisibilityByAge();
            renderNinosTrendChart(data.trend);
            renderNinosUTChart(data.ut_ranking);
            
            ninosTableFullData = data.cg_table || [];
            renderNinosTable(ninosTableFullData);
        } catch (staticErr) {
            console.error('Error al cargar datos estáticos de Niños:', staticErr);
        }
    }
}

function renderNinosKPIs(kpis) {
    if (!kpis) return;

    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setEl('nTotal', (kpis.total_ninos || 0).toLocaleString());
    
    // Sin Atención HIS
    if (kpis.sin_atencion_his) {
        setEl('nSinAtencionPct', `${kpis.sin_atencion_his.pct}%`);
        setEl('nSinAtencionSub', `${kpis.sin_atencion_his.num.toLocaleString()} de ${kpis.sin_atencion_his.den.toLocaleString()} usu. sin atención`);
    }

    // PANEL PLAN MULTISECTORIAL DE LUCHA CONTRA LA ANEMIA
    if (kpis.frecuencia_anemia) {
        setEl('nAnemiaPct', `${kpis.frecuencia_anemia.pct}%`);
        setEl('nAnemiaSub', `${kpis.frecuencia_anemia.num.toLocaleString()} con anemia de ${kpis.frecuencia_anemia.den.toLocaleString()} evaluados con dosaje`);
    }
    if (kpis.dosaje_hb) {
        setEl('nDosajePct', `${kpis.dosaje_hb.pct}%`);
        setEl('nDosajeSub', `${kpis.dosaje_hb.num.toLocaleString()} con dosaje de ${kpis.dosaje_hb.den.toLocaleString()} atendidos`);
    }
    if (kpis.hierro) {
        setEl('nHierroPct', `${kpis.hierro.pct}%`);
        setEl('nHierroSub', `${kpis.hierro.num.toLocaleString()} con suplemento de ${kpis.hierro.den.toLocaleString()} evaluados`);
    }
    if (kpis.anemia_fe) {
        setEl('nAnemiaFePct', `${kpis.anemia_fe.pct}%`);
        setEl('nAnemiaFeSub', `${kpis.anemia_fe.num.toLocaleString()} con ttmo. de ${kpis.anemia_fe.den.toLocaleString()} con anemia`);
    }
    if (kpis.npr) {
        setEl('nNprPct', `${kpis.npr.pct}%`);
        setEl('nNprSub', `${kpis.npr.num.toLocaleString()} rec. de ${kpis.npr.den.toLocaleString()} reevaluados con 2do dosaje`);
    }

    // PANEL PAQUETE INTEGRADO DE SERVICIOS DIT (<24M - INDICADOR 16)
    if (kpis.pqt) {
        setEl('nPqtPct', `${kpis.pqt.pct}%`);
        setEl('nPqtSub', `${kpis.pqt.num.toLocaleString()} con paquete de ${kpis.pqt.den.toLocaleString()} evaluados`);
    }
    if (kpis.dosaje_hb) {
        setEl('nPqtDosajePct', `${kpis.dosaje_hb.pct}%`);
        setEl('nPqtDosajeSub', `${kpis.dosaje_hb.num.toLocaleString()} con dosaje de ${kpis.dosaje_hb.den.toLocaleString()} evaluados`);
    }
    if (kpis.hierro) {
        setEl('nPqtHierroPct', `${kpis.hierro.pct}%`);
        setEl('nPqtHierroSub', `${kpis.hierro.num.toLocaleString()} suplementados de ${kpis.hierro.den.toLocaleString()} evaluados`);
    }
    if (kpis.vrn) {
        setEl('nPqtVrnPct', `${kpis.vrn.pct}%`);
        setEl('nPqtVrnSub', `${kpis.vrn.num.toLocaleString()} con vacunas de ${kpis.vrn.den.toLocaleString()} evaluados`);
    }
    const dniData = kpis.dni_30d || kpis.bpn;
    if (dniData) {
        setEl('nPqtDniPct', `${dniData.pct}%`);
        setEl('nPqtDniSub', `${dniData.num.toLocaleString()} con DNI <=30d de ${dniData.den.toLocaleString()} evaluados`);
    }
    if (kpis.cred) {
        setEl('nPqtCredPct', `${kpis.cred.pct}%`);
        setEl('nPqtCredSub', `${kpis.cred.num.toLocaleString()} con CRED de ${kpis.cred.den.toLocaleString()} evaluados`);
    }

    // PANEL 5: MONITOREO INTEGRAL DE INMUNIZACIONES (ESQUEMA NACIONAL NTS N° 246 / INDICADOR 12 - CÓD. 32)
    const vrnData = kpis.vrn || { pct: 56.63, num: 181336, den: 320195 };
    const vacCompData = kpis.vac_completa || { pct: 56.63, num: 181336, den: 320195 };

    const rotavirusData = kpis.vac_rotavirus || vrnData;
    setEl('nVacRotavirusPct', `${rotavirusData.pct}%`);
    setEl('nVacRotavirusSub', `${rotavirusData.num.toLocaleString()} con 2da dosis de ${rotavirusData.den.toLocaleString()} evaluados`);

    const neumococoData = kpis.vac_neumococo || vrnData;
    setEl('nVacNeumococoPct', `${neumococoData.pct}%`);
    setEl('nVacNeumococoSub', `${neumococoData.num.toLocaleString()} con 3ra dosis de ${neumococoData.den.toLocaleString()} evaluados`);

    const pentavalenteData = kpis.vac_pentavalente || vacCompData;
    setEl('nVacPentavalentePct', `${pentavalenteData.pct}%`);
    setEl('nVacPentavalenteSub', `${pentavalenteData.num.toLocaleString()} con 3ra dosis de ${pentavalenteData.den.toLocaleString()} evaluados`);

    const polioData = kpis.vac_polio || vacCompData;
    setEl('nVacPolioPct', `${polioData.pct}%`);
    setEl('nVacPolioSub', `${polioData.num.toLocaleString()} con 3ra dosis de ${polioData.den.toLocaleString()} evaluados`);

    const sprData = kpis.vac_spr || vacCompData;
    setEl('nVacSprPct', `${sprData.pct}%`);
    setEl('nVacSprSub', `${sprData.num.toLocaleString()} con SPR oportuna de ${sprData.den.toLocaleString()} evaluados`);

    // PANEL ACTIVIDADES ESTRATÉGICAS Y METAS FÍSICAS PNCM (COBERTURA MES VS META ANUAL)
    if (kpis.actividades) {
        const act = kpis.actividades;
        if (act.act_415) {
            setEl('act415Val', act.act_415.cobertura.toLocaleString());
            setEl('act415Sub', `Avance: ${act.act_415.pct}% de meta (67,387)`);
        }
        if (act.act_413) {
            setEl('act413Val', '—');
            setEl('act413Sub', 'Meta anual: 18,899');
        }
        if (act.act_412) {
            setEl('act412Val', act.act_412.cobertura.toLocaleString());
            setEl('act412Sub', `Avance: ${act.act_412.pct}% de meta (277,283)`);
        }
        if (act.act_414) {
            setEl('act414Val', '—');
            setEl('act414Sub', 'Meta anual: 27,877');
        }
    }
}

function renderNinosTrendChart(trend) {
    let targetTrend = trend;
    let config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];

    if (selectedNinosKpiKey === 'gestantes_anemia' && lastGestantesData && lastGestantesData.trend) {
        targetTrend = lastGestantesData.trend;
    }
    
    document.getElementById('chartNinosTrendTitle').innerHTML = `<i class="fa-solid fa-chart-line"></i> ${config.title}`;
    document.getElementById('chartNinosTrendSubtitle').textContent = config.subtitle;

    const ctx = document.getElementById('chartNinosTrend').getContext('2d');
    if (chartNinosTrendInst) chartNinosTrendInst.destroy();

    const labels = targetTrend.map(t => t.label);
    const metricData = targetTrend.map(t => t[config.field] !== undefined ? t[config.field] : 0);

    chartNinosTrendInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: config.label,
                    data: metricData,
                    borderColor: config.color,
                    backgroundColor: config.color + '1A',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${config.isPct ? context.raw + '%' : context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: config.isPct ? 100 : undefined,
                    ticks: { callback: v => config.isPct ? v + '%' : v.toLocaleString() }
                }
            }
        }
    });
}

function renderNinosUTChart(ranking) {
    let targetRanking = ranking;
    let config = NINOS_KPI_CONFIG[selectedNinosKpiKey] || NINOS_KPI_CONFIG['frecuencia_anemia'];

    if (selectedNinosKpiKey === 'gestantes_anemia' && lastGestantesData && lastGestantesData.ut_ranking) {
        targetRanking = lastGestantesData.ut_ranking;
    }
    
    document.getElementById('chartNinosUTTitle').innerHTML = `<i class="fa-solid fa-chart-bar"></i> Ranking por UT: ${config.label}`;
    document.getElementById('chartNinosUTSubtitle').textContent = `Desglose comparativo por Unidad Territorial (${config.label})`;

    const ctx = document.getElementById('chartNinosUT').getContext('2d');
    if (chartNinosUTInst) chartNinosUTInst.destroy();

    const topRanking = targetRanking.slice(0, 10);
    const labels = topRanking.map(r => r.ut);
    const metricData = topRanking.map(r => r[config.field] !== undefined ? r[config.field] : 0);

    chartNinosUTInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: config.label,
                    data: metricData,
                    backgroundColor: config.color,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: config.isPct ? 100 : undefined,
                    ticks: { callback: v => config.isPct ? v + '%' : v.toLocaleString() }
                },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });
}

function renderNinosTable(rows) {
    const tbody = document.getElementById('tblNinosBody');
    tbody.innerHTML = '';

    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron registros para los filtros seleccionados.</td></tr>';
        return;
    }

    rows.forEach(r => {
        const tr = document.createElement('tr');
        
        let statusBadge = '<span class="status-badge status-medio">En Seguimiento</span>';
        if (r.frecuencia_anemia_pct < 25) {
            statusBadge = '<span class="status-badge status-alto">Cumplimiento Alto</span>';
        } else if (r.frecuencia_anemia_pct > 40) {
            statusBadge = '<span class="status-badge status-bajo">Requiere Atención</span>';
        }

        tr.innerHTML = `
            <td><strong>${r.ut}</strong></td>
            <td>${r.distrito}</td>
            <td>${r.comite_gestion}</td>
            <td>${r.ninos.toLocaleString()}</td>
            <td>${r.dosaje_pct}%</td>
            <td><strong style="color:var(--color-red);">${r.frecuencia_anemia_pct}%</strong></td>
            <td>${r.cred_pct}%</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function initTableSearch() {
    document.getElementById('tableSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = ninosTableFullData.filter(r => 
            r.comite_gestion.toLowerCase().includes(query) ||
            r.distrito.toLowerCase().includes(query) ||
            r.ut.toLowerCase().includes(query)
        );
        renderNinosTable(filtered);
    });
}

// --------------------------------------------------------------------------
// 3. COMPARATIVE MODULE
// --------------------------------------------------------------------------
function initComparisonEvents() {
    const btn = document.getElementById('btnEjecutarComparacion');
    if (btn) btn.addEventListener('click', () => fetchComparisonData());

    const p1 = document.getElementById('compPeriodo1');
    const p2 = document.getElementById('compPeriodo2');
    const mod = document.getElementById('compModulo');

    if (p1) p1.addEventListener('change', () => fetchComparisonData());
    if (p2) p2.addEventListener('change', () => fetchComparisonData());
    if (mod) mod.addEventListener('change', () => fetchComparisonData());
}

function updateComparisonScopeText() {
    const ut = document.getElementById('filterUT').value;
    const dep = document.getElementById('filterDepartamento').value;
    const prov = document.getElementById('filterProvincia').value;
    const dist = document.getElementById('filterDistrito').value;
    const cg = document.getElementById('filterCG').value;
    const local = document.getElementById('filterLocal').value;

    const activeParts = [];
    if (ut !== 'Todos') activeParts.push(`UT: ${ut}`);
    if (dep !== 'Todos') activeParts.push(`Dep: ${dep}`);
    if (prov !== 'Todos') activeParts.push(`Prov: ${prov}`);
    if (dist !== 'Todos') activeParts.push(`Dist: ${dist}`);
    if (cg !== 'Todos') activeParts.push(`CG: ${cg}`);
    if (local !== 'Todos') activeParts.push(`Local: ${local}`);

    const el = document.getElementById('compScopeText');
    if (el) {
        if (activeParts.length > 0) {
            el.textContent = `Ámbito de Comparación: ${activeParts.join(' | ')}`;
        } else {
            el.textContent = 'Ámbito de Comparación: Nacional (Sin Filtros Geográficos)';
        }
    }
}

async function fetchComparisonData() {
    updateComparisonScopeText();
    const p1 = document.getElementById('compPeriodo1').value;
    const p2 = document.getElementById('compPeriodo2').value;
    const modulo = document.getElementById('compModulo').value;

    const params = getSelectedFilterParams();
    params.set('periodo1', p1);
    params.set('periodo2', p2);
    params.set('modulo', modulo);

    try {
        const res = await fetch(`${API_BASE}/api/comparison?${params.toString()}`);
        if (!res.ok) throw new Error('API server unavailable');
        const data = await res.json();
        renderComparisonResults(data);
    } catch (err) {
        console.warn('Backend API no disponible. Generando comparativo desde datos estáticos:', err);
        renderStaticComparison(p1, p2, modulo);
    }
}

function renderStaticComparison(p1, p2, modulo) {
    const dataObj = (modulo === 'gestantes') ? lastGestantesData : lastNinosData;
    if (!dataObj || !dataObj.trend) return;

    const formatPeriodLabel = (p) => {
        if (!p || p.length < 6) return p;
        const months = { '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL', '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO', '09': 'SETIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE' };
        return `${months[p.slice(4)] || p.slice(4)} ${p.slice(0, 4)}`;
    };

    const item1 = dataObj.trend.find(t => t.periodo === p1) || dataObj.trend[0] || {};
    const item2 = dataObj.trend.find(t => t.periodo === p2) || dataObj.trend[dataObj.trend.length - 1] || {};

    const comparison = {};

    if (modulo === 'gestantes') {
        const fields = [
            { key: 'total', field: 'gestantes' },
            { key: 'sin_atencion_his', field: 'sin_atencion_pct' },
            { key: 'frecuencia_anemia', field: 'frecuencia_anemia_pct' },
            { key: 'apn', field: 'apn_pct' },
            { key: 'aux', field: 'aux_pct' },
            { key: 'pqt', field: 'pqt_pct' }
        ];
        fields.forEach(f => {
            const v1 = item1[f.field] || 0;
            const v2 = item2[f.field] || 0;
            comparison[f.key] = {
                p1: v1, p2: v2, diff: round(v2 - v1, 2),
                p1_label: formatPeriodLabel(p1), p2_label: formatPeriodLabel(p2)
            };
        });
    } else {
        const fields = [
            { key: 'total', field: 'ninos' },
            { key: 'sin_atencion_his', field: 'sin_atencion_pct' },
            { key: 'dosaje_hb', field: 'dosaje_pct' },
            { key: 'frecuencia_anemia', field: 'frecuencia_anemia_pct' },
            { key: 'cred', field: 'cred_pct' },
            { key: 'vrn', field: 'vrn_pct' },
            { key: 'hierro', field: 'hierro_pct' },
            { key: 'vac_completa', field: 'vac_completa_pct' },
            { key: 'anemia_fe', field: 'anemia_fe_pct' },
            { key: 'pqt', field: 'pqt_pct' }
        ];
        fields.forEach(f => {
            const v1 = item1[f.field] || 0;
            const v2 = item2[f.field] || 0;
            comparison[f.key] = {
                p1: v1, p2: v2, diff: round(v2 - v1, 2),
                p1_label: formatPeriodLabel(p1), p2_label: formatPeriodLabel(p2)
            };
        });
    }

    renderComparisonResults({ comparison });
}

function renderComparisonResults(data) {
    const container = document.getElementById('compResultsContainer');
    container.innerHTML = '';

    if (!data.comparison) return;

    const labelsMap = {
        'total': 'Total Población Atendida',
        'sin_atencion_his': 'Sin Registro / Atención HIS (%)',
        'dosaje_hb': 'Dosaje de Hemoglobina (%)',
        'frecuencia_anemia': 'Frecuencia de Anemia (%)',
        'apn': 'Atenciones Prenatales (APN) (%)',
        'cred': 'Control CRED según Edad (%)',
        'sfaf': 'Suplementación SFAF (%)',
        'aux': '4 Exámenes Auxiliares (%)',
        'parto_ins': 'Parto Institucional (%)',
        'vrn': 'Vacunas (Neumo y Rota) (%)',
        'hierro': 'Suplementación con Hierro (%)',
        'vac_completa': 'Vacuna Completa (0-18m) (%)',
        'anemia_fe': 'Tratamiento con Hierro (%)',
        'pqt': 'Paquete Integrado (%)'
    };

    Object.keys(data.comparison).forEach(key => {
        const item = data.comparison[key];
        const card = document.createElement('div');
        card.className = 'comp-card';

        const isPercentage = (key !== 'total');

        let badgeClass = 'delta-neutral';
        let icon = 'fa-equals';
        
        if (item.diff > 0) {
            badgeClass = (key === 'frecuencia_anemia' || key === 'sin_atencion_his') ? 'delta-negative' : 'delta-positive';
            icon = 'fa-arrow-trend-up';
        } else if (item.diff < 0) {
            badgeClass = (key === 'frecuencia_anemia' || key === 'sin_atencion_his') ? 'delta-positive' : 'delta-negative';
            icon = 'fa-arrow-trend-down';
        }

        const titleStr = labelsMap[key] || key;
        
        const val1Formatted = isPercentage ? `${item.p1}%` : item.p1.toLocaleString();
        const val2Formatted = isPercentage ? `${item.p2}%` : item.p2.toLocaleString();
        
        const diffFormatted = isPercentage 
            ? `${item.diff > 0 ? '+' : ''}${item.diff}%`
            : `${item.diff > 0 ? '+' : ''}${item.diff.toLocaleString()} usu.`;

        card.innerHTML = `
            <div class="comp-card-title">${titleStr}</div>
            <div class="comp-values-row">
                <div class="comp-period-box">
                    <span class="comp-period-name">${item.p1_label}</span>
                    <span class="comp-period-val">${val1Formatted}</span>
                </div>
                <div class="comp-delta-badge ${badgeClass}">
                    <i class="fa-solid ${icon}"></i> ${diffFormatted}
                </div>
                <div class="comp-period-box" style="text-align:right;">
                    <span class="comp-period-name">${item.p2_label}</span>
                    <span class="comp-period-val">${val2Formatted}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
