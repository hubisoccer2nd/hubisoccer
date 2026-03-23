// Configuration Supabase (espace public)
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseSpacePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GESTION DU MENU MOBILE =====
document.addEventListener('click', function(e) {
    const menuToggle = e.target.closest('#menuToggle');
    if (menuToggle) {
        e.preventDefault();
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        }
        return;
    }
    if (!e.target.closest('.nav-links') && !e.target.closest('#menuToggle')) {
        const navLinks = document.getElementById('navLinks');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const toggle = document.getElementById('menuToggle');
            if (toggle) toggle.classList.remove('open');
        }
    }
});

// ===== GESTION DES LANGUES (exemple simplifié) =====
const translations = {
    fr: {
        titre_page: "Processus HubISoccer – De la détection locale à la communauté privée",
        // ... d'autres traductions si besoin
    },
    // les autres langues seraient définies ici
};
let currentLang = 'fr';
function loadLanguage(lang) {
    // à compléter si vous souhaitez traduire le contenu dynamique
}
const savedLang = localStorage.getItem('hubiLang') || 'fr';
loadLanguage(savedLang);
document.getElementById('langSelect').addEventListener('change', (e) => {
    loadLanguage(e.target.value);
});

// ===== CHARGEMENT DES ÉTAPES =====
async function loadTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const { data: etapes, error } = await supabaseSpacePublic
        .from('public_processus_etapes')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Erreur chargement étapes:', error);
        container.innerHTML = '<p class="error">Impossible de charger le processus.</p>';
        return;
    }

    if (!etapes.length) {
        container.innerHTML = '<p>Aucune étape pour le moment.</p>';
        return;
    }

    let html = '';
    etapes.forEach(e => {
        html += `
            <div class="timeline-item">
                <div class="timeline-icon">
                    <i class="fas ${e.icone}"></i>
                </div>
                <div class="timeline-content">
                    <h2>${escapeHtml(e.titre)}</h2>
                    <p>${escapeHtml(e.description)}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== CHARGEMENT DES STATISTIQUES =====
async function loadStats() {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    const { data: stats, error } = await supabaseSpacePublic
        .from('public_processus_stats')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Erreur chargement stats:', error);
        container.innerHTML = '<p class="error">Impossible de charger les statistiques.</p>';
        return;
    }

    if (!stats.length) {
        container.innerHTML = '<p>Aucune statistique.</p>';
        return;
    }

    let html = '';
    stats.forEach(s => {
        html += `
            <div class="stat-item">
                <span class="stat-number">${escapeHtml(s.nombre)}</span>
                <span class="stat-label">${escapeHtml(s.label)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== UTILITAIRE =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadTimeline();
    loadStats();
});