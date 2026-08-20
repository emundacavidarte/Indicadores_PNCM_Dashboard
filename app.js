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
    'vac_bcg': {
        title: 'Vacunación BCG (Recién Nacido) - Evolución Histórica',
        subtitle: 'Porcentaje de recién nacidos con dosis única de BCG dentro de las 24 horas',
        field: 'vac_completa_pct',
        label: 'BCG Recién Nacido (%)',
        color: '#009FE3',
        isPct: true
    },
    'vac_hvb': {
        title: 'Vacunación Hepatitis B Pediátrica (RN) - Evolución Histórica',
        subtitle: 'Porcentaje de recién nacidos con dosis de HvB dentro de las primeras 12 horas',
        field: 'vac_completa_pct',
        label: 'HvB Recién Nacido (%)',
        color: '#0284C7',
        isPct: true
    },
    'vac_spr1': {
        title: 'Vacunación SPR 1ra Dosis (12m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños de 12 meses con primera dosis de SPR',
        field: 'vac_completa_pct',
        label: 'SPR 1ra Dosis (12m) (%)',
        color: '#10B981',
        isPct: true
    },
    'vac_spr2': {
        title: 'Vacunación SPR 2da Dosis (18m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños de 18 meses con segunda dosis de SPR (refuerzo)',
        field: 'vac_completa_pct',
        label: 'SPR 2da Dosis (18m) (%)',
        color: '#059669',
        isPct: true
    },
    'vac_varicela': {
        title: 'Vacunación contra Varicela (12m, 24m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños con dosis única de vacuna contra la Varicela',
        field: 'vac_completa_pct',
        label: 'Varicela (12m, 24m) (%)',
        color: '#EC4899',
        isPct: true
    },
    'vac_ama': {
        title: 'Vacunación Antiamarílica AMA (15m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños con dosis de vacuna Antiamarílica a los 15 meses',
        field: 'vac_completa_pct',
        label: 'Antiamarílica AMA (15m) (%)',
        color: '#F97316',
        isPct: true
    },
    'vac_dpt': {
        title: 'Vacunación DPT 1er Refuerzo (18m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños con primer refuerzo de DPT a los 18 meses',
        field: 'vac_completa_pct',
        label: 'DPT Refuerzo (18m) (%)',
        color: '#06B6D4',
        isPct: true
    },
    'vac_influenza_2a': {
        title: 'Vacunación Influenza Pediátrica (2 Años) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños de 24 a 35 meses con dosis anual de influenza',
        field: 'vac_completa_pct',
        label: 'Influenza (2 Años) (%)',
        color: '#0284C7',
        isPct: true
    },
    'vac_influenza_3a': {
        title: 'Vacunación Influenza Pediátrica (3 Años) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños de 36 meses con dosis anual de influenza',
        field: 'vac_completa_pct',
        label: 'Influenza (3 Años) (%)',
        color: '#7C3AED',
        isPct: true
    },
    'cred_rn': {
        title: 'Controles CRED Recién Nacido (<1m) - Evolución Histórica',
        subtitle: 'Porcentaje de recién nacidos con 4 controles CRED en el primer mes de vida',
        field: 'cred_pct',
        label: 'CRED Recién Nacido (%)',
        color: '#7C3AED',
        isPct: true
    },
    'cred_lact': {
        title: 'Controles CRED Lactante (<1 año) - Evolución Histórica',
        subtitle: 'Porcentaje de lactantes menores de 1 año con controles CRED mensuales oportunos',
        field: 'cred_pct',
        label: 'CRED Lactante (<1a) (%)',
        color: '#06B6D4',
        isPct: true
    },
    'cred_1a': {
        title: 'Controles CRED 1 Año (12 a 23 meses) - Evolución Histórica',
        subtitle: 'Porcentaje de niños de 1 año con 6 controles CRED cumplidos (cada 2 meses)',
        field: 'cred_pct',
        label: 'CRED 1 Año (12-23m) (%)',
        color: '#10B981',
        isPct: true
    },
    'cred_2a': {
        title: 'Controles CRED 2 Años (24 a 35 meses) - Evolución Histórica',
        subtitle: 'Porcentaje de niños de 2 años con 4 controles CRED anuales (cada 3 meses)',
        field: 'cred_pct',
        label: 'CRED 2 Años (24-35m) (%)',
        color: '#0F766E',
        isPct: true
    },
    'cred_3a': {
        title: 'Controles CRED 3 Años (36 meses / Egreso) - Evolución Histórica',
        subtitle: 'Porcentaje de niños de 3 años con control de egreso saludable del PNCM',
        field: 'cred_pct',
        label: 'CRED 3 Años (36m) (%)',
        color: '#6D28D9',
        isPct: true
    },
    'cred_global': {
        title: 'Vigilancia CRED Global (<36 meses) - Evolución Histórica',
        subtitle: 'Porcentaje de niñas y niños con controles de Crecimiento y Desarrollo completos para su edad',
        field: 'cred_pct',
        label: 'CRED Global (<36m) (%)',
        color: '#5B21B6',
        isPct: true
    },
    'dni_30d': {
        title: 'Emisión de DNI hasta 30 Días - Evolución Histórica',
        subtitle: 'Porcentaje de niños y niñas con DNI emitido dentro de los primeros 30 días de vida',
        field: 'pqt_pct',
        label: 'DNI <=30d (%)',
        color: '#7C3AED',
        isPct: true
    },
    'npr': {
        title: 'Recuperación de Niños con Anemia (6-35m) - Evolución Histórica',
        subtitle: 'Porcentaje de niños con diagnóstico de anemia que recuperan niveles normales de Hb (>= 11.0 g/dL)',
        field: 'frecuencia_anemia_pct',
        label: 'Recuperación Anemia (%)',
        color: '#10B981',
        isPct: true
    },
    'act_415': {
        title: 'Actividad 4.15: Atención Integral Cuidado Diurno (SCD) - Evolución Histórica',
        subtitle: 'Cobertura mensual de atención integral en locales CIAI frente a la meta física anual del Plan Multisectorial (67,387)',
        field: 'pqt_pct',
        label: 'Atención Integral SCD (Usu.)',
        color: '#10B981',
        isPct: false
    },
    'act_413': {
        title: 'Actividad 4.13: Capacitación Actores Comunales SCD - Evolución Histórica',
        subtitle: 'Capacitación al equipo técnico y actores comunales de SCD (Meta física anual: 18,899)',
        field: 'pqt_pct',
        label: 'Capacitación SCD (Usu.)',
        color: '#0284C7',
        isPct: false
    },
    'act_412': {
        title: 'Actividad 4.12: Visitas Acompañamiento Familiar (SAF) - Evolución Histórica',
        subtitle: 'Cobertura de acompañamiento familiar en visitas semanales (Meta física anual: 277,283)',
        field: 'pqt_pct',
        label: 'Visitas Acompañamiento SAF (Usu.)',
        color: '#5B21B6',
        isPct: false
    },
    'act_414': {
        title: 'Actividad 4.14: Capacitación Actores Comunales SAF - Evolución Histórica',
        subtitle: 'Capacitación a facilitadores y actores comunales de SAF (Meta física anual: 27,877)',
        field: 'pqt_pct',
        label: 'Capacitación SAF (Usu.)',
        color: '#EC4899',
        isPct: false
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
    initModuleSelector();
    initServicePills();
    initVaccineTimeline();
    initCredTimeline();
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

function initServicePills() {
    const servicePills = document.querySelectorAll('.service-pill');
    const filterServicio = document.getElementById('filterServicio');

    servicePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const selectedService = pill.dataset.service;
            servicePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            if (filterServicio) {
                filterServicio.value = selectedService;
                if (currentTab === 'tabNinos') {
                    lastUserNinosService = selectedService;
                }
            }

            applyServiceThemeUI();
            
            // Re-fetch data or update UI with active service
            if (currentTab === 'tabGestantes') {
                loadGestantesData();
            } else {
                ninosDataCache = {};
                loadNinosData();
            }
            updateActiveFilterCountAndUI();
        });
    });
}

function applyServiceThemeUI() {
    const servicioSelect = document.getElementById('filterServicio');
    const servicio = servicioSelect ? servicioSelect.value : 'Todos';
    const body = document.body;
    const badgeIcon = document.getElementById('serviceBadgeIcon');
    const badgeTitle = document.getElementById('serviceBadgeTitle');
    const badgeSub = document.getElementById('serviceBadgeSub');

    // Sync header service pills
    document.querySelectorAll('.service-pill').forEach(pill => {
        if (pill.dataset.service === servicio) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

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
    },
    'vac_bcg': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de recién nacidos con vacuna BCG (Dosis única)',
        definition: 'Mide la cobertura de la vacuna Bacilo de Calmette-Guérin (BCG) para la prevención de formas graves de tuberculosis (meníngea y miliar) administrada en dosis única de 0.1 mL intradérmica preferentemente en las primeras 24 horas de vida.',
        numerator: 'A = Número de recién nacidos con registro de vacuna BCG en HIS MINSA.',
        denominator: 'B = Total de recién nacidos y lactantes evaluados.',
        his_codes: ['90585 (Vacuna BCG)']
    },
    'vac_hvb': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de recién nacidos con vacuna Hepatitis B (HvB)',
        definition: 'Mide la administración de la vacuna monovalente contra la Hepatitis B pediátrica en las primeras 12 horas de vida para prevenir la transmisión vertical perinatal del virus de la Hepatitis B.',
        numerator: 'A = Recién nacidos con dosis de HvB dentro de las 12 horas.',
        denominator: 'B = Total de recién nacidos evaluados.',
        his_codes: ['90744 (Vacuna Hepatitis B Pediátrica)']
    },
    'vac_spr1': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niños con 1ra dosis de vacuna SPR (12 meses)',
        definition: 'Mide la cobertura de la 1ra dosis de la vacuna contra Sarampión, Papera y Rubéola (SPR) administrada a los 12 meses de edad.',
        numerator: 'A = Niñas y niños con 1ra dosis de SPR registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de 12 a 23 meses.',
        his_codes: ['90707 (Vacuna SPR 1ra dosis)']
    },
    'vac_spr2': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niños con 2da dosis de vacuna SPR (18 meses)',
        definition: 'Mide la cobertura de la 2da dosis de refuerzo de la vacuna SPR administrada a los 18 meses (mínimo 6 meses después de la 1ra dosis).',
        numerator: 'A = Niñas y niños con 2da dosis de SPR registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de 24 a 35 meses.',
        his_codes: ['90707 (Vacuna SPR 2da dosis / Refuerzo)']
    },
    'vac_varicela': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niños con vacuna contra la Varicela (12 meses)',
        definition: 'Mide la cobertura de la vacuna viva atenuada contra la varicela administrada en dosis única a los 12 meses de edad (con rescate hasta antes de cumplir los 3 años).',
        numerator: 'A = Niñas y niños con vacuna contra la varicela registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados de 12 a 23 meses.',
        his_codes: ['90716 (Vacuna contra Varicela)']
    },
    'vac_ama': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niños con vacuna Antiamarílica AMA (15 meses)',
        definition: 'Mide la administración de la dosis única de la vacuna viva atenuada contra la Fiebre Amarilla (AMA) a los 15 meses de edad en todo el territorio nacional.',
        numerator: 'A = Niñas y niños con vacuna AMA registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados en el grupo de 12 a 23 meses.',
        his_codes: ['90717 (Vacuna Antiamarílica AMA)']
    },
    'vac_dpt': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niños con 1er Refuerzo de vacuna DPT (18 meses)',
        definition: 'Mide la administración del primer refuerzo de la vacuna triple bacteriana (Difteria, Pertussis y Tétanos) a los 18 meses de edad.',
        numerator: 'A = Niñas y niños con 1er refuerzo de DPT registrado en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados de 12 a 23 meses.',
        his_codes: ['90701 (Vacuna DPT 1er Refuerzo)']
    },
    'vac_influenza_2a': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños de 2 años con vacuna Influenza Pediátrica',
        definition: 'Mide la cobertura de la dosis anual estacional de la vacuna contra la Influenza en niñas y niños de 24 a 35 meses de edad para prevenir cuadros respiratorios severos.',
        numerator: 'A = Niñas y niños de 24 a 35 meses con dosis anual de Influenza registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados de 24 a 35 meses.',
        his_codes: ['90657 (Vacuna Influenza Pediátrica 2 años)']
    },
    'vac_influenza_3a': {
        code: 'ESQUEMA REGULAR NTS N° 246-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 246-MINSA/DGIESP • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_vac_completa.pdf',
        title: 'Porcentaje de niñas y niños de 3 años con vacuna Influenza Pediátrica',
        definition: 'Mide la cobertura de la dosis anual estacional de la vacuna contra la Influenza en niñas y niños de 36 meses al egreso del PNCM.',
        numerator: 'A = Niñas y niños de 36 meses con dosis anual de Influenza registrada en HIS MINSA.',
        denominator: 'B = Total de niñas y niños evaluados de 36 meses.',
        his_codes: ['90657 (Vacuna Influenza Pediátrica 3 años)']
    },
    'cred_rn': {
        code: 'NORMA TÉCNICA NTS N° 238-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud para el Control del Crecimiento y Desarrollo NTS N° 238-MINSA • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Controles CRED en el Recién Nacido (<1 mes - 4 controles)',
        definition: 'Evalúa el cumplimiento de los 4 controles de crecimiento y desarrollo del recién nacido durante los primeros 28 días de vida (1er control a las 48h del alta, 2do a los 7 días, 3ro a los 14 días y 4to a los 21 días).',
        numerator: 'A = Recién nacidos con 4 controles CRED registrados en el primer mes.',
        denominator: 'B = Total de recién nacidos evaluados.',
        his_codes: ['99381.01 (CRED Recién Nacido - 1ro a 4to control)']
    },
    'cred_lact': {
        code: 'NORMA TÉCNICA NTS N° 238-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 238-MINSA • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Controles CRED en el Lactante (<1 año - 11 controles)',
        definition: 'Evalúa el cumplimiento de 11 controles de CRED en menores de 1 año (un control mensual a los 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 y 11 meses de vida).',
        numerator: 'A = Lactantes menores de 1 año con controles CRED completos para su edad.',
        denominator: 'B = Total de lactantes evaluados en el grupo menor de 1 año.',
        his_codes: ['Z001 (Control CRED Lactante)']
    },
    'cred_1a': {
        code: 'NORMA TÉCNICA NTS N° 238-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 238-MINSA • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Controles CRED a 1 Año de Edad (12-23 meses - 6 controles)',
        definition: 'Evalúa el cumplimiento de 6 controles CRED durante el segundo año de vida (1 control cada 2 meses a los 12, 14, 16, 18, 20 y 22 meses).',
        numerator: 'A = Niñas y niños de 1 año con 6 controles CRED registrados.',
        denominator: 'B = Total de niñas y niños evaluados de 12 a 23 meses.',
        his_codes: ['Z001 (Control CRED 1 Año)']
    },
    'cred_2a': {
        code: 'NORMA TÉCNICA NTS N° 238-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 238-MINSA • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Controles CRED Niños de 2 Años (24 a 35 meses - 4 controles/año)',
        definition: 'Evalúa el cumplimiento de 4 controles CRED al año (1 control cada 3 meses a los 24, 27, 30 y 33 meses) y tamizaje de desarrollo TEPSI.',
        numerator: 'A = Niñas y niños de 2 años con 4 controles CRED trimestrales registrados.',
        denominator: 'B = Total de niñas y niños evaluados de 24 a 35 meses.',
        his_codes: ['Z001 (Control CRED 2 Años)']
    },
    'cred_3a': {
        code: 'NORMA TÉCNICA NTS N° 238-MINSA',
        area: 'MINSA / DGIESP / PNCM',
        source: 'Fuente Oficial: Norma Técnica de Salud NTS N° 238-MINSA • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Controles CRED Niños de 3 Años (36 meses - Control y Egreso PNCM)',
        definition: 'Evalúa el cumplimiento de los controles del tercer año y la certificación de egreso saludable del Programa Nacional Cuna Más a los 36 meses.',
        numerator: 'A = Niñas y niños de 3 años con control de egreso saludable registrado.',
        denominator: 'B = Total de niñas y niños evaluados de 36 meses.',
        his_codes: ['Z001 (Control CRED 3 Años / Egreso)']
    },
    'cred_global': {
        code: 'CÓDIGO 30 (INDICADOR 10 / NTS 238)',
        area: 'DGSE-MIDIS / MINSA',
        source: 'Fuente Oficial: Fichas Técnicas Tablero de Control DGSE-MIDIS (Cód. 30) • Base HIS MINSA / Padrón PNCM',
        pdf_file: 'fichas_pdf/ficha_cred.pdf',
        title: 'Vigilancia del Cumplimiento de Controles CRED Global (<36 meses)',
        definition: 'Evalúa de manera acumulada e integral si las niñas y niños menores de 36 meses cuentan con el esquema completo y oportuno de controles CRED según su edad exacta.',
        numerator: 'A = Número de niñas y niños con controles CRED oportunos y completos para su edad.',
        denominator: 'B = Total de niñas y niños evaluados menores de 36 meses.',
        his_codes: ['Z001', '99381.01']
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

function initModuleSelector() {
    const modulePills = document.querySelectorAll('.module-pill');
    if (!modulePills.length) return;

    modulePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const targetModule = pill.dataset.module;
            if (!targetModule) return;

            // 1. Update module pills active state
            modulePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // 2. Hide all module sections
            document.querySelectorAll('.evaluation-module-section').forEach(sec => {
                sec.classList.remove('active');
            });

            // 3. Show targeted section
            const targetSecId = `moduleSection${targetModule.charAt(0).toUpperCase() + targetModule.slice(1)}`;
            const targetSec = document.getElementById(targetSecId);
            if (targetSec) {
                targetSec.classList.add('active');
            }

            // 4. Set default active KPI for this module
            let defaultKpi = 'pqt';
            if (targetModule === 'anemia') defaultKpi = 'frecuencia_anemia';
            else if (targetModule === 'vacunas') defaultKpi = 'vac_rotavirus';
            else if (targetModule === 'cred') defaultKpi = 'cred_global';
            else if (targetModule === 'pqt') defaultKpi = 'pqt';

            selectedNinosKpiKey = defaultKpi;

            // 5. Update card visual active states in tabNinos
            document.querySelectorAll('#tabNinos .kpi-card').forEach(c => {
                if (c.dataset.kpi === defaultKpi) {
                    c.classList.add('active-kpi');
                } else {
                    c.classList.remove('active-kpi');
                }
            });

            // 6. Update card visibility rules for active age filter
            updateKpiCardsVisibilityByAge();

            // 7. Refresh charts
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
        updateActiveFilterCountAndUI();
        fetchDashboardData();
    });

    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', resetAllFilters);
    }

    const btnQuickClear = document.getElementById('btnQuickClearFilters');
    if (btnQuickClear) {
        btnQuickClear.addEventListener('click', resetAllFilters);
    }

    document.getElementById('filterAnio').addEventListener('change', () => {
        ninosDataCache = {};
        loadFilterOptions('filterAnio');
        updateActiveFilterCountAndUI();
    });

    document.getElementById('filterMes').addEventListener('change', () => {
        ninosDataCache = {};
        updateHeaderPeriodBadge();
        updateActiveFilterCountAndUI();
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
            updateActiveFilterCountAndUI();
        });
    });
}

function updateActiveFilterCountAndUI() {
    let count = 0;
    const ut = document.getElementById('filterUT')?.value;
    const serv = document.getElementById('filterServicio')?.value;
    const depto = document.getElementById('filterDepartamento')?.value;
    const prov = document.getElementById('filterProvincia')?.value;
    const dist = document.getElementById('filterDistrito')?.value;
    const cg = document.getElementById('filterCG')?.value;
    const local = document.getElementById('filterLocal')?.value;

    if (ut && ut !== 'Todos') count++;
    if (serv && serv !== 'Todos') count++;
    if (depto && depto !== 'Todos') count++;
    if (prov && prov !== 'Todos') count++;
    if (dist && dist !== 'Todos') count++;
    if (cg && cg !== 'Todos') count++;
    if (local && local !== 'Todos') count++;
    if (currentAgeGroup && currentAgeGroup !== 'Todos') count++;

    const badge = document.getElementById('activeFiltersBadge');
    const quickClearBtn = document.getElementById('btnQuickClearFilters');

    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (quickClearBtn) {
        if (count > 0) {
            quickClearBtn.style.display = 'inline-flex';
        } else {
            quickClearBtn.style.display = 'none';
        }
    }
}

function resetAllFilters() {
    ninosDataCache = {};
    lastUserNinosService = 'Todos';
    const selects = ['filterServicio', 'filterUT', 'filterDepartamento', 'filterProvincia', 'filterDistrito', 'filterCG', 'filterLocal'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'Todos';
    });

    // Reset age filter pills to 'Todos'
    const todosPill = document.querySelector('.age-pill[data-age="Todos"]');
    if (todosPill) {
        document.querySelectorAll('.age-pill').forEach(p => p.classList.remove('active'));
        todosPill.classList.add('active');
        currentAgeGroup = 'Todos';
        updateKpiCardsVisibilityByAge();
    }

    applyServiceThemeUI();
    loadFilterOptions();
    updateActiveFilterCountAndUI();
    fetchDashboardData();
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
        'total': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'sin_atencion_his': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'frecuencia_anemia': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'dosaje_hb': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'hierro': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'anemia_fe': ['Todos', '[06-11] Meses'],
        'vrn': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_completa': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'vac_rotavirus': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_neumococo': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'vac_pentavalente': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_polio': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'vac_bcg': ['Todos', '[00-05] Meses'],
        'vac_hvb': ['Todos', '[00-05] Meses'],
        'vac_spr1': ['Todos', '[12-23] Meses'],
        'vac_spr2': ['Todos', '[24-35] Meses'],
        'vac_spr': ['Todos', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'vac_varicela': ['Todos', '[12-23] Meses', '[24-35] Meses'],
        'vac_ama': ['Todos', '[12-23] Meses'],
        'vac_dpt': ['Todos', '[12-23] Meses'],
        'vac_influenza_2a': ['Todos', '[24-35] Meses'],
        'vac_influenza_3a': ['Todos', '[36] Meses'],
        'cred_rn': ['Todos', '[00-05] Meses'],
        'cred_lact': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'cred_1a': ['Todos', '[12-23] Meses'],
        'cred_2a': ['Todos', '[24-35] Meses'],
        'cred_3a': ['Todos', '[36] Meses'],
        'cred_global': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'cred': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'pqt': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses'],
        'dni_30d': ['Todos', '[00-05] Meses', '[06-11] Meses'],
        'npr': ['Todos', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses'],
        'act_415': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'act_413': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'act_412': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
        'act_414': ['Todos', '[00-05] Meses', '[06-11] Meses', '[12-23] Meses', '[24-35] Meses', '[36] Meses'],
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

    // Update vaccine & CRED timeline stepper state and cards
    updateVaccineTimelineByAge(age);
    updateCredTimelineByAge(age);

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

let currentVaccineMilestone = '2m';
let currentVaccineStage = '1a_menor';

const vaccineMilestoneMeta = {
    'rn': {
        title: 'Recién Nacido • Protección Inicial al Nacer',
        purpose: 'Protege contra formas graves de Tuberculosis y daño hepático al nacer',
        count: '2 vacunas requeridas',
        stage: 'rn'
    },
    '2m': {
        title: '2 Meses • 1ra Serie Primaria del Lactante',
        purpose: 'Protege contra diarreas graves, neumonías, meningitis y parálisis infantil',
        count: '3 vacunas requeridas',
        stage: '1a_menor'
    },
    '4m': {
        title: '4 Meses • 2da Serie Primaria del Lactante',
        purpose: 'Segunda dosis primaria para consolidar defensas contra neumonía y diarreas',
        count: '3 vacunas requeridas',
        stage: '1a_menor'
    },
    '6m': {
        title: '6 Meses • 3ra Serie Primaria e Influenza D1',
        purpose: 'Completa serie de polio e inicia protección estacional contra gripe/influenza',
        count: '2 vacunas requeridas',
        stage: '1a_menor'
    },
    '7m': {
        title: '7 Meses • 2da Dosis Influenza Pediátrica D2',
        purpose: 'Refuerzo mensual de influenza para blindar las vías respiratorias',
        count: '1 vacuna requerida',
        stage: '1a_menor'
    },
    '12m': {
        title: '12 Meses (1 Año) • SPR 1ra Dosis, Neumococo Ref. y Varicela',
        purpose: 'Inicia protección contra Sarampión (SPR 1), refuerzo de neumonía y varicela',
        count: '3 vacunas requeridas',
        stage: '1a'
    },
    '15m': {
        title: '15 Meses • Hepatitis A y Antiamarílica AMA',
        purpose: 'Protege contra Hepatitis A y Fiebre Amarilla en zonas endémicas',
        count: '2 vacunas requeridas',
        stage: '1a'
    },
    '18m': {
        title: '18 Meses • SPR 2da Dosis y DPT 1er Refuerzo',
        purpose: 'Cierra esquema contra Sarampión (SPR 2) y refuerza contra Tos Ferina (DPT)',
        count: '2 vacunas requeridas',
        stage: '1a'
    },
    '24m': {
        title: '2 Años (24 a 35m) • Influenza Anual y Varicela Rescate',
        purpose: 'Dosis anual de influenza y rescate de refuerzos en párvulos de 2 años',
        count: '2 vacunas requeridas',
        stage: '2_3a'
    },
    '36m': {
        title: '3 Años (36m) • Influenza Anual y Egreso PNCM',
        purpose: 'Dosis final de influenza y aseguramiento del esquema completo para egreso PNCM',
        count: '2 vacunas requeridas',
        stage: '2_3a'
    },
    'all': {
        title: 'Esquema Nacional de Vacunación Completo (PNCM ≤36 Meses)',
        purpose: 'Monitoreo integral de todas las vacunas normativas según NTS N° 246-MINSA',
        count: '15 vacunas e hitos',
        stage: 'all'
    }
};

const vaccineStageMeta = {
    'rn': { title: 'Recién Nacido • Protección al Nacer (BCG y HepB RN)', milestone: 'rn' },
    '1a_menor': { title: 'Menores de 1 Año • Serie Primaria Lactante (2m, 4m, 6m, 7m)', milestone: '2m' },
    '1a': { title: 'Niños de 1 Año • Refuerzos Clave y Nuevas Vacunas (12m, 15m, 18m)', milestone: '12m' },
    '2_3a': { title: '2 y 3 Años • Protección Anual y Egreso PNCM (24m, 36m)', milestone: '24m' },
    'all': { title: 'Esquema Nacional de Vacunación Completo (PNCM ≤36 Meses)', milestone: 'all' }
};

function filterVaccineCards(milestone, stage) {
    const cards = document.querySelectorAll('#vacCardsGrid .vac-vaccine-card');
    let firstVisibleCard = null;
    let visibleCount = 0;

    cards.forEach(card => {
        const cardMilestones = (card.dataset.milestones || '').split(',').map(s => s.trim());
        const cardStage = card.dataset.stage;

        let visible = false;
        if (milestone && milestone !== 'all') {
            if (cardMilestones.includes(milestone)) visible = true;
        } else if (stage && stage !== 'all') {
            if (cardStage === stage) visible = true;
        } else {
            visible = true;
        }

        if (visible) {
            card.style.display = '';
            visibleCount++;
            if (!firstVisibleCard) firstVisibleCard = card;
        } else {
            card.style.display = 'none';
            card.classList.remove('active-kpi');
        }
    });

    // Update status banner
    const meta = vaccineMilestoneMeta[milestone] || vaccineMilestoneMeta['all'];
    const titleEl = document.getElementById('vacFocusTitle');
    const purposeEl = document.getElementById('vacFocusPurpose');
    const countEl = document.getElementById('vacFocusCount');

    if (titleEl) titleEl.textContent = meta.title;
    if (purposeEl) purposeEl.innerHTML = `<i class="fa-solid fa-shield-heart"></i> ${meta.purpose}`;
    if (countEl) countEl.textContent = `${visibleCount} vacuna${visibleCount === 1 ? '' : 's'} requerida${visibleCount === 1 ? '' : 's'}`;

    // Auto-select first visible card if current active is hidden
    const activeCard = document.querySelector('#vacCardsGrid .vac-vaccine-card.active-kpi');
    if ((!activeCard || activeCard.style.display === 'none') && firstVisibleCard) {
        cards.forEach(c => c.classList.remove('active-kpi'));
        firstVisibleCard.classList.add('active-kpi');
        const kpi = firstVisibleCard.dataset.kpi;
        if (kpi && currentModuleTheme === 'theme-vacunas') {
            selectedNinosKpiKey = kpi;
            if (lastNinosData) {
                renderNinosTrendChart(lastNinosData.trend);
                renderNinosUTChart(lastNinosData.ut_ranking);
            }
        }
    }
}

function initVaccineTimeline() {
    const stageCards = document.querySelectorAll('.vac-stage-card');
    const navSteps = document.querySelectorAll('.vtl-nav-step');
    const vacCards = document.querySelectorAll('#vacCardsGrid .vac-vaccine-card');

    // 1. Stage Cards Clicks (RN, < 1 Año, 1 Año, 2 y 3 Años)
    stageCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            stageCards.forEach(c => c.classList.remove('active-stage'));
            card.classList.add('active-stage');

            const stage = card.dataset.stage;
            currentVaccineStage = stage;
            const stageInfo = vaccineStageMeta[stage] || { milestone: 'all' };
            currentVaccineMilestone = stageInfo.milestone;

            // Sync Timeline Stepper
            navSteps.forEach(s => {
                s.classList.remove('active');
                if (s.dataset.milestone === currentVaccineMilestone) {
                    s.classList.add('active');
                }
            });

            filterVaccineCards(currentVaccineMilestone, currentVaccineStage);
        });
    });

    // 2. Standalone Timeline Stepper Clicks
    navSteps.forEach(step => {
        step.addEventListener('click', () => {
            if (step.classList.contains('disabled')) return;
            navSteps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');

            const milestone = step.dataset.milestone || 'all';
            const stage = step.dataset.stage || 'all';
            currentVaccineMilestone = milestone;
            currentVaccineStage = stage;

            // Sync Stage Cards
            stageCards.forEach(sc => {
                sc.classList.remove('active-stage');
                if (sc.dataset.stage === stage) {
                    sc.classList.add('active-stage');
                }
            });

            filterVaccineCards(currentVaccineMilestone, currentVaccineStage);
        });
    });

    // 3. Vaccine Cards Direct Selection Clicks
    vacCards.forEach(card => {
        card.addEventListener('click', () => {
            vacCards.forEach(c => c.classList.remove('active-kpi'));
            card.classList.add('active-kpi');

            const kpi = card.dataset.kpi;
            if (kpi) {
                selectedNinosKpiKey = kpi;
                if (lastNinosData) {
                    renderNinosTrendChart(lastNinosData.trend);
                    renderNinosUTChart(lastNinosData.ut_ranking);
                }
            }
        });
    });

    // 4. Detail button scroll
    const btnDetalle = document.getElementById('btnVerDetalleEtapas');
    if (btnDetalle) {
        btnDetalle.addEventListener('click', () => {
            const target = document.querySelector('.vac-stages-grid');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initial filter execution
    filterVaccineCards(currentVaccineMilestone, currentVaccineStage);
}

function updateVaccineTimelineByAge(age) {
    const stageCards = document.querySelectorAll('.vac-stage-card');
    const navSteps = document.querySelectorAll('.vtl-nav-step');

    let activeStageStillValid = false;
    let firstValidStage = null;

    // Filter 4 Stage Cards
    stageCards.forEach(sc => {
        const validAges = (sc.dataset.ageValid || '').split(',').map(s => s.trim());
        if (age === 'Todos' || validAges.includes(age) || validAges.includes('Todos')) {
            sc.classList.remove('disabled');
            if (!firstValidStage) firstValidStage = sc;
            if (sc.classList.contains('active-stage')) activeStageStillValid = true;
        } else {
            sc.classList.add('disabled');
            sc.classList.remove('active-stage');
        }
    });

    // Filter Stepper Steps
    navSteps.forEach(step => {
        const validAges = (step.dataset.ageValid || '').split(',').map(s => s.trim());
        if (age === 'Todos' || validAges.includes(age) || validAges.includes('Todos')) {
            step.classList.remove('disabled');
        } else {
            step.classList.add('disabled');
            step.classList.remove('active');
        }
    });

    // Auto switch if currently active stage was disabled
    if (!activeStageStillValid && firstValidStage) {
        firstValidStage.classList.add('active-stage');
        currentVaccineStage = firstValidStage.dataset.stage;
        const stageInfo = vaccineStageMeta[currentVaccineStage] || { milestone: 'all' };
        currentVaccineMilestone = stageInfo.milestone;

        navSteps.forEach(s => {
            s.classList.remove('active');
            if (s.dataset.milestone === currentVaccineMilestone) s.classList.add('active');
        });
    }

    filterVaccineCards(currentVaccineMilestone, currentVaccineStage);
}

/* ==========================================================================
   CRED CONTROLS TIMELINE & STAGE ARCHITECTURE (NTS N° 238-MINSA)
   ========================================================================== */
let currentCredMilestone = '2m';
let currentCredStage = '1a_menor';

const credMilestoneMeta = {
    'rn': {
        title: 'Recién Nacido (0 meses) • 4 Controles en los Primeros 28 Días',
        purpose: 'Evalúa somatometría (peso/talla), reflejos neonatales, ictericia y lactancia materna precoz',
        count: '4 controles en 1er mes (48h, 7d, 14d, 21d)',
        stage: 'rn'
    },
    '1m': {
        title: '1 Mes • 1 Control Mensual (Lactancia Materna Exclusiva y Ganancia de Peso)',
        purpose: 'Control de incremento ponderal diario, reflejos de succión y posición al amamantar',
        count: '1 control cada mes (11 al año)',
        stage: '1a_menor'
    },
    '2m': {
        title: '2 Meses • 1° Tamizaje de Desarrollo Psicomotor (EEDP: Motricidad, Lenguaje, Social)',
        purpose: 'Evalúa ganancia de peso/talla, reflejos motores, visión, audición y apego seguro',
        count: '1 control cada mes + 1° Tamizaje EEDP',
        stage: '1a_menor'
    },
    '4m': {
        title: '4 Meses • Dosaje Preventivo de Hemoglobina y Suplementación con Hierro',
        purpose: 'Evalúa velocidad de crecimiento, tamizaje de anemia y dosaje de hemoglobina',
        count: '1 control cada mes + Dosaje Hb',
        stage: '1a_menor'
    },
    '6m': {
        title: '6 Meses • Inicio de Alimentación Complementaria y Dosaje de Hb',
        purpose: 'Monitorea inicio de papillas densas, hierro de origen animal y lactancia continuada',
        count: '1 control cada mes + Dosaje Hb',
        stage: '1a_menor'
    },
    '9m': {
        title: '9 Meses • 2° Tamizaje de Desarrollo Psicomotor (EEDP: Coordinación y Marcha)',
        purpose: 'Evalúa bipedestación con apoyo, pinza digital, balbuceo y masticación',
        count: '1 control cada mes + 2° Tamizaje EEDP',
        stage: '1a_menor'
    },
    '12m': {
        title: '12 Meses (1 Año) • 1er Control Bimensual (1 de 6 al año) y Dosaje Anual',
        purpose: 'Transición a la mesa familiar, primeros pasos y dosaje anual de hemoglobina',
        count: '1 control c/2 meses (12m)',
        stage: '1a'
    },
    '18m': {
        title: '18 Meses • 3° Tamizaje de Desarrollo Psicomotor (EEDP: Lenguaje y Autonomía)',
        purpose: 'Evalúa marcha independiente, vocabulario de palabras clave y autonomía motriz',
        count: '1 control c/2 meses + 3° Tamizaje EEDP',
        stage: '1a'
    },
    '24m': {
        title: '2 Años (24m) • Test de Desarrollo TEPSI (Coordinación y Lenguaje) y Controles Trimestrales',
        purpose: 'Inicio de 4 controles anuales (cada 3 meses), tamizaje TEPSI y evaluación de lenguaje',
        count: '1 control c/3 meses + Test TEPSI',
        stage: '2a'
    },
    '36m': {
        title: '3 Años (36m) • Control Trimestral y Egreso Saludable del Programa Cuna Más',
        purpose: 'Certificación del desarrollo integral, estado nutricional normal y egreso a inicial',
        count: 'Control trimestral y egreso PNCM',
        stage: '3a'
    },
    'all': {
        title: 'Vigilancia Integral de Controles CRED (NTS N° 238-MINSA)',
        purpose: 'Monitoreo de todos los controles de Crecimiento y Desarrollo desde el nacimiento hasta los 36 meses',
        count: 'Esquema completo según edad',
        stage: 'all'
    }
};

const credStageMeta = {
    'rn': { title: 'Recién Nacido • 4 Controles en 1er Mes (48h, 7d, 14d, 21d)', milestone: 'rn' },
    '1a_menor': { title: 'Menores de 1 Año • 1 Control Cada Mes (11 al Año)', milestone: '2m' },
    '1a': { title: 'Niños de 1 Año • 1 Control Cada 2 Meses (6 al Año)', milestone: '12m' },
    '2a': { title: 'Niños de 2 Años • 1 Control Cada 3 Meses (4 al Año)', milestone: '24m' },
    '3a': { title: 'Niños de 3 Años • Control Trimestral y Egreso PNCM (36m)', milestone: '36m' },
    'all': { title: 'Vigilancia Integral de Controles CRED (NTS N° 238-MINSA)', milestone: 'all' }
};

function filterCredCards(milestone, stage) {
    const cards = document.querySelectorAll('#credCardsGrid .cred-control-card');
    let firstVisibleCard = null;
    let visibleCount = 0;

    cards.forEach(card => {
        const cardMilestones = (card.dataset.milestones || '').split(',').map(s => s.trim());
        const cardStage = card.dataset.stage;

        let visible = false;
        if (milestone && milestone !== 'all') {
            if (cardMilestones.includes(milestone)) visible = true;
        } else if (stage && stage !== 'all') {
            if (cardStage === stage || cardStage === 'all') visible = true;
        } else {
            visible = true;
        }

        if (visible) {
            card.style.display = '';
            visibleCount++;
            if (!firstVisibleCard) firstVisibleCard = card;
        } else {
            card.style.display = 'none';
            card.classList.remove('active-kpi');
        }
    });

    // Update Focus Bar
    const focusTitle = document.getElementById('credFocusTitle');
    const focusPurpose = document.getElementById('credFocusPurpose');
    const focusCount = document.getElementById('credFocusCount');
    const focusBadgeText = document.getElementById('credFocusBadgeText');

    let meta = null;
    if (milestone && credMilestoneMeta[milestone]) {
        meta = credMilestoneMeta[milestone];
        if (focusBadgeText) focusBadgeText.textContent = milestone === 'all' ? 'Esquema Completo' : 'Control Seleccionado';
    } else if (stage && credStageMeta[stage]) {
        const fallbackMilestone = credStageMeta[stage].milestone;
        meta = credMilestoneMeta[fallbackMilestone] || credMilestoneMeta['all'];
        if (focusBadgeText) focusBadgeText.textContent = 'Etapa: ' + credStageMeta[stage].title.split('•')[0].trim();
    }

    if (meta) {
        if (focusTitle) focusTitle.textContent = meta.title;
        if (focusPurpose) focusPurpose.innerHTML = `<i class="fa-solid fa-shield-heart"></i> ${meta.purpose}`;
        if (focusCount) focusCount.textContent = meta.count;
    }
}

function updateCredTimelineByAge(age) {
    const stageCards = document.querySelectorAll('.cred-stage-card');
    const navSteps = document.querySelectorAll('#credTimelineNavigator .ctl-nav-step');

    let activeStageStillValid = false;
    let firstValidStage = null;

    // Filter 5 Stage Cards
    stageCards.forEach(sc => {
        const validAges = (sc.dataset.ageValid || '').split(',').map(s => s.trim());
        if (age === 'Todos' || validAges.includes(age) || validAges.includes('Todos')) {
            sc.classList.remove('disabled');
            if (!firstValidStage) firstValidStage = sc;
            if (sc.classList.contains('active-stage')) activeStageStillValid = true;
        } else {
            sc.classList.add('disabled');
            sc.classList.remove('active-stage');
        }
    });

    // Filter Stepper Steps
    navSteps.forEach(step => {
        const validAges = (step.dataset.ageValid || '').split(',').map(s => s.trim());
        if (age === 'Todos' || validAges.includes(age) || validAges.includes('Todos')) {
            step.classList.remove('disabled');
        } else {
            step.classList.add('disabled');
            step.classList.remove('active');
        }
    });

    // Auto switch if currently active stage was disabled
    if (!activeStageStillValid && firstValidStage) {
        firstValidStage.classList.add('active-stage');
        currentCredStage = firstValidStage.dataset.stage;
        const stageInfo = credStageMeta[currentCredStage] || { milestone: 'all' };
        currentCredMilestone = stageInfo.milestone;

        navSteps.forEach(s => {
            s.classList.remove('active');
            if (s.dataset.milestone === currentCredMilestone) s.classList.add('active');
        });
    }

    filterCredCards(currentCredMilestone, currentCredStage);
}

function initCredTimeline() {
    const stageCards = document.querySelectorAll('.cred-stage-card');
    const navSteps = document.querySelectorAll('#credTimelineNavigator .ctl-nav-step');
    const credCards = document.querySelectorAll('#credCardsGrid .cred-control-card');

    // 1. Stage Cards Clicks
    stageCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            stageCards.forEach(c => c.classList.remove('active-stage'));
            card.classList.add('active-stage');

            const stage = card.dataset.stage;
            currentCredStage = stage;
            const stageInfo = credStageMeta[stage] || { milestone: 'all' };
            currentCredMilestone = stageInfo.milestone;

            navSteps.forEach(s => {
                s.classList.remove('active');
                if (s.dataset.milestone === currentCredMilestone) {
                    s.classList.add('active');
                }
            });

            filterCredCards(currentCredMilestone, currentCredStage);
        });
    });

    // 2. Stepper Clicks
    navSteps.forEach(step => {
        step.addEventListener('click', () => {
            if (step.classList.contains('disabled')) return;
            navSteps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');

            const milestone = step.dataset.milestone || 'all';
            currentCredMilestone = milestone;

            // Find matching stage
            let matchingStage = 'all';
            if (credMilestoneMeta[milestone]) {
                matchingStage = credMilestoneMeta[milestone].stage;
            }
            currentCredStage = matchingStage;

            stageCards.forEach(sc => {
                sc.classList.remove('active-stage');
                if (sc.dataset.stage === matchingStage) {
                    sc.classList.add('active-stage');
                }
            });

            filterCredCards(currentCredMilestone, currentCredStage);
        });
    });

    // 3. Detailed Card Direct Selection Clicks
    credCards.forEach(card => {
        card.addEventListener('click', () => {
            credCards.forEach(c => c.classList.remove('active-kpi'));
            card.classList.add('active-kpi');

            const kpi = card.dataset.kpi;
            if (kpi) {
                selectedNinosKpiKey = kpi;
                if (lastNinosData) {
                    renderNinosTrendChart(lastNinosData.trend);
                    renderNinosUTChart(lastNinosData.ut_ranking);
                }
            }
        });
    });

    // Initial filter execution
    filterCredCards(currentCredMilestone, currentCredStage);
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
            updateActiveFilterCountAndUI();
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

    // MÓDULO 3: INMUNIZACIONES & VACUNAS (NTS N° 246 / INDICADOR 12 - CÓD. 32)
    const vrnFallback = kpis.vrn || { pct: 56.63, num: 181336, den: 320195 };
    const vacCompFallback = kpis.vac_completa || { pct: 56.63, num: 181336, den: 320195 };

    // Serie Primaria (<12m)
    const bcgData = kpis.vac_bcg || vacCompFallback;
    setEl('nVacBcgPct', `${bcgData.pct}%`);
    setEl('nVacBcgSub', `${bcgData.num.toLocaleString()} con dosis única de ${bcgData.den.toLocaleString()} evaluados`);

    const hvbData = kpis.vac_hvb || vacCompFallback;
    setEl('nVacHvbPct', `${hvbData.pct}%`);
    setEl('nVacHvbSub', `${hvbData.num.toLocaleString()} con dosis RN de ${hvbData.den.toLocaleString()} evaluados`);

    const rotavirusData = kpis.vac_rotavirus || vrnFallback;
    setEl('nVacRotaPct', `${rotavirusData.pct}%`);
    setEl('nVacRotaSub', `${rotavirusData.num.toLocaleString()} con 2da dosis de ${rotavirusData.den.toLocaleString()} evaluados`);
    setEl('nVacRotavirusPct', `${rotavirusData.pct}%`);
    setEl('nVacRotavirusSub', `${rotavirusData.num.toLocaleString()} con 2da dosis de ${rotavirusData.den.toLocaleString()} evaluados`);

    const pentavalenteData = kpis.vac_pentavalente || vacCompFallback;
    setEl('nVacPentaPct', `${pentavalenteData.pct}%`);
    setEl('nVacPentaSub', `${pentavalenteData.num.toLocaleString()} con 3ra dosis de ${pentavalenteData.den.toLocaleString()} evaluados`);
    setEl('nVacPentavalentePct', `${pentavalenteData.pct}%`);
    setEl('nVacPentavalenteSub', `${pentavalenteData.num.toLocaleString()} con 3ra dosis de ${pentavalenteData.den.toLocaleString()} evaluados`);

    const polioData = kpis.vac_polio || vacCompFallback;
    setEl('nVacPolioPct', `${polioData.pct}%`);
    setEl('nVacPolioSub', `${polioData.num.toLocaleString()} con 3ra dosis de ${polioData.den.toLocaleString()} evaluados`);

    const neumococoData = kpis.vac_neumococo || vrnFallback;
    setEl('nVacNeumoPct', `${neumococoData.pct}%`);
    setEl('nVacNeumoSub', `${neumococoData.num.toLocaleString()} con 2da dosis de ${neumococoData.den.toLocaleString()} evaluados`);
    setEl('nVacNeumococoPct', `${neumococoData.pct}%`);
    setEl('nVacNeumococoSub', `${neumococoData.num.toLocaleString()} con 3ra dosis de ${neumococoData.den.toLocaleString()} evaluados`);

    // Párvulos (1 a 3 años)
    const spr1Data = kpis.vac_spr1 || vacCompFallback;
    setEl('nVacSpr1Pct', `${spr1Data.pct}%`);
    setEl('nVacSpr1Sub', `${spr1Data.num.toLocaleString()} con 1ra dosis de ${spr1Data.den.toLocaleString()} evaluados`);

    const spr2Data = kpis.vac_spr2 || vacCompFallback;
    setEl('nVacSpr2Pct', `${spr2Data.pct}%`);
    setEl('nVacSpr2Sub', `${spr2Data.num.toLocaleString()} con 2da dosis de ${spr2Data.den.toLocaleString()} evaluados`);

    const sprData = kpis.vac_spr || vacCompFallback;
    setEl('nVacSprPct', `${sprData.pct}%`);
    setEl('nVacSprSub', `${sprData.num.toLocaleString()} con SPR oportuna de ${sprData.den.toLocaleString()} evaluados`);

    const varicelaData = kpis.vac_varicela || vacCompFallback;
    setEl('nVacVaricelaPct', `${varicelaData.pct}%`);
    setEl('nVacVaricelaSub', `${varicelaData.num.toLocaleString()} con dosis de ${varicelaData.den.toLocaleString()} evaluados`);

    const amaData = kpis.vac_ama || vacCompFallback;
    setEl('nVacAmaPct', `${amaData.pct}%`);
    setEl('nVacAmaSub', `${amaData.num.toLocaleString()} con AMA de ${amaData.den.toLocaleString()} evaluados`);

    const dptData = kpis.vac_dpt || vacCompFallback;
    setEl('nVacDptPct', `${dptData.pct}%`);
    setEl('nVacDptSub', `${dptData.num.toLocaleString()} con refuerzo de ${dptData.den.toLocaleString()} evaluados`);

    // Etapa 3: 2 y 3 Años (NTS N° 246)
    const inf2Data = kpis.vac_influenza_2a || { pct: 72.4, num: 42800, den: 59136 };
    setEl('nVacInf2Pct', `${inf2Data.pct}%`);
    setEl('nVacInf2Sub', `${inf2Data.num.toLocaleString()} con influenza 2a de ${inf2Data.den.toLocaleString()} evaluados`);

    const inf3Data = kpis.vac_influenza_3a || { pct: 68.9, num: 9650, den: 14012 };
    setEl('nVacInf3Pct', `${inf3Data.pct}%`);
    setEl('nVacInf3Sub', `${inf3Data.num.toLocaleString()} con influenza 3a de ${inf3Data.den.toLocaleString()} evaluados`);

    const vacGlobalData = kpis.vac_completa || vacCompFallback;
    setEl('nVacCompGlobalPct', `${vacGlobalData.pct}%`);
    setEl('nVacCompGlobalSub', `${vacGlobalData.num.toLocaleString()} con esquema completo de ${vacGlobalData.den.toLocaleString()} evaluados`);

    // =========================================================================
    // SEGUIMIENTO EJECUTIVO DE VACUNACIÓN (NTS N° 246-MINSA / PNCM <= 36 MESES)
    // =========================================================================
    const vacRes = kpis.vac_resumen || {
        evaluados: 123711,
        pendientes: 103695,
        cob_rn: 96.0,
        cob_menor_1a: 30.9,
        cob_1a: 0.13,
        cob_2_3a: 72.0
    };

    const vacComp = kpis.vac_completa || { pct: 16.18, num: 20016, den: 123711 };
    const sprDataObj = kpis.vac_spr || { pct: 0.13, num: 76, den: 59136 };

    // Top Summary Row
    setEl('vacExecutiveCompPct', `${vacComp.pct}%`);
    setEl('vacExecutiveCompSub', `${(vacComp.num || 0).toLocaleString()} con esquema completo de ${(vacComp.den || 0).toLocaleString()} evaluados`);

    setEl('vacExecutiveSprPct', `${sprDataObj.pct}%`);
    setEl('vacExecutiveSprSub', `${(sprDataObj.num || 0).toLocaleString()} con SPR oportuna de ${(sprDataObj.den || 0).toLocaleString()} evaluados`);

    setEl('vacExecutiveEvaluadosVal', (vacRes.evaluados || vacComp.den || 0).toLocaleString());
    setEl('vacExecutivePendientesVal', (vacRes.pendientes || 0).toLocaleString());

    // 4 Donut Rings & Values
    const setRing = (valId, ringId, pctVal, color) => {
        setEl(valId, `${pctVal}%`);
        const ring = document.getElementById(ringId);
        if (ring) {
            ring.style.background = `conic-gradient(${color} 0% ${pctVal}%, #F1F5F9 ${pctVal}% 100%)`;
        }
    };

    const cobRn = vacRes.cob_rn !== undefined ? vacRes.cob_rn : 96.0;
    const cobMenor1a = vacRes.cob_menor_1a !== undefined ? vacRes.cob_menor_1a : (vacRes.cob_2_7m || 30.9);
    const cob1a = vacRes.cob_1a !== undefined ? vacRes.cob_1a : (vacRes.cob_12_18m || 0.13);
    const cob23a = vacRes.cob_2_3a !== undefined ? vacRes.cob_2_3a : (vacRes.cob_24_36m || 72.0);

    setRing('vacDonutRnVal', 'vacDonutRnRing', cobRn, '#7C3AED');
    setRing('vacDonutSem1Val', 'vacDonutSem1Ring', cobMenor1a, '#0284C7');
    setRing('vacDonutSem2Val', 'vacDonutSem2Ring', cob1a, '#10B981');
    setRing('vacDonutAnio3Val', 'vacDonutAnio3Ring', cob23a, '#0F766E');

    // Right Column Progress Bars
    const setProg = (valId, barId, pctVal) => {
        setEl(valId, `${pctVal}%`);
        const bar = document.getElementById(barId);
        if (bar) {
            bar.style.width = `${Math.min(100, Math.max(0, pctVal))}%`;
        }
    };

    setProg('vacProgRnVal', 'vacProgRnBar', cobRn);
    setProg('vacProgSem1Val', 'vacProgSem1Bar', cobMenor1a);
    setProg('vacProgSem2Val', 'vacProgSem2Bar', cob1a);
    setProg('vacProgAnio3Val', 'vacProgAnio3Bar', cob23a);

    // MÓDULO 4: CONTROLES CRED (NTS N° 238 / CÓD. 30)
    const credFallback = kpis.cred || { pct: 60.5, num: 193700, den: 320195 };

    const credRnData = kpis.cred_rn || credFallback;
    setEl('nCredRnPct', `${credRnData.pct}%`);
    setEl('nCredRnSub', `${credRnData.num.toLocaleString()} con 4 controles de ${credRnData.den.toLocaleString()} evaluados`);

    const credLactData = kpis.cred_lact || credFallback;
    setEl('nCredLactPct', `${credLactData.pct}%`);
    setEl('nCredLactSub', `${credLactData.num.toLocaleString()} con CRED oportuno de ${credLactData.den.toLocaleString()} evaluados`);

    const cred1aData = kpis.cred_1a || credFallback;
    setEl('nCred1aPct', `${cred1aData.pct}%`);
    setEl('nCred1aSub', `${cred1aData.num.toLocaleString()} con 6 controles de ${cred1aData.den.toLocaleString()} evaluados`);

    const cred2aData = kpis.cred_2a || credFallback;
    setEl('nCred2aPct', `${cred2aData.pct}%`);
    setEl('nCred2aSub', `${cred2aData.num.toLocaleString()} con 4 controles/año de ${cred2aData.den.toLocaleString()} evaluados`);

    const cred3aData = kpis.cred_3a || credFallback;
    setEl('nCred3aPct', `${cred3aData.pct}%`);
    setEl('nCred3aSub', `${cred3aData.num.toLocaleString()} con control de egreso de ${cred3aData.den.toLocaleString()} evaluados`);

    const credGlobalData = kpis.cred_global || credFallback;
    setEl('nCredGlobalPct', `${credGlobalData.pct}%`);
    setEl('nCredGlobalSub', `${credGlobalData.num.toLocaleString()} con esquema completo de ${credGlobalData.den.toLocaleString()} evaluados`);

    // 4 Executive Summary KPIs for CRED
    const totalNinosEval = kpis.total_ninos || 320195;
    setEl('credExecutiveEvaluadosVal', totalNinosEval.toLocaleString());
    setEl('credExecutiveCompPct', `${credGlobalData.pct}%`);
    setEl('credExecutiveCompSub', `${credGlobalData.num.toLocaleString()} niñas y niños con controles al día`);
    setEl('credExecutivePendientesVal', Math.max(0, totalNinosEval - credGlobalData.num).toLocaleString());

    // 5 Donut Rings for CRED Etapas de Vida
    setRing('credDonutRnVal', 'credDonutRnRing', credRnData.pct, '#7C3AED');
    setRing('credDonutLactVal', 'credDonutLactRing', credLactData.pct, '#0284C7');
    setRing('credDonut1aVal', 'credDonut1aRing', cred1aData.pct, '#10B981');
    setRing('credDonut2aVal', 'credDonut2aRing', cred2aData.pct, '#0F766E');
    setRing('credDonut3aVal', 'credDonut3aRing', cred3aData.pct, '#6D28D9');

    // Progress Bars in Detailed CRED Cards
    setProg('nCredRnPct', 'credProgRnBar', credRnData.pct);
    setProg('nCredLactPct', 'credProgLactBar', credLactData.pct);
    setProg('nCred1aPct', 'credProg1aBar', cred1aData.pct);
    setProg('nCred2aPct', 'credProg2aBar', cred2aData.pct);
    setProg('nCred3aPct', 'credProg3aBar', cred3aData.pct);
    setProg('nCredGlobalPct', 'credProgGlobalBar', credGlobalData.pct);

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

/* ==========================================================================
   GLOBAL RESPONSIVE RESIZE LISTENER (TABLETS, SMARTPHONES & ORIENTATION CHANGE)
   ========================================================================== */
let resizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (typeof leafletMap !== 'undefined' && leafletMap) {
            try { leafletMap.invalidateSize(); } catch(e) {}
        }
        if (typeof chartNinosTrendInst !== 'undefined' && chartNinosTrendInst) {
            try { chartNinosTrendInst.resize(); } catch(e) {}
        }
        if (typeof chartNinosUTInst !== 'undefined' && chartNinosUTInst) {
            try { chartNinosUTInst.resize(); } catch(e) {}
        }
        if (typeof chartGestantesTrendInst !== 'undefined' && chartGestantesTrendInst) {
            try { chartGestantesTrendInst.resize(); } catch(e) {}
        }
        if (typeof chartGestantesUTInst !== 'undefined' && chartGestantesUTInst) {
            try { chartGestantesUTInst.resize(); } catch(e) {}
        }
    }, 150);
});
