// ========== SCOUTING.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (extrait pour éviter la longueur) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.home': 'Accueil',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournoi': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'scouting.header.title': 'Scouting',
        'scouting.header.highlight': 'HubISoccer',
        'scouting.header.subtitle': 'Découvrez les talents du monde entier, vérifiés et certifiés.',
        'scouting.filter.continent': 'Tous les continents',
        'scouting.filter.category': 'Toutes catégories',
        'scouting.filter.placeholder': 'Pays (ex: Bénin, Brésil...)',
        'scouting.filter.search': 'Rechercher',
        'scouting.results.title': 'Talents récents',
        'scouting.no_results': 'Aucun sportif trouvé.',
        'scouting.view_profile': 'Voir le profil',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load': 'Erreur chargement des sportifs'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Become an actor',
        'nav.tournoi': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'scouting.header.title': 'Scouting',
        'scouting.header.highlight': 'HubISoccer',
        'scouting.header.subtitle': 'Discover talents from around the world, verified and certified.',
        'scouting.filter.continent': 'All continents',
        'scouting.filter.category': 'All categories',
        'scouting.filter.placeholder': 'Country (ex: Benin, Brazil...)',
        'scouting.filter.search': 'Search',
        'scouting.results.title': 'Recent talents',
        'scouting.no_results': 'No athletes found.',
        'scouting.view_profile': 'View profile',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load': 'Error loading athletes'
    }
};

let currentLang = localStorage.getItem('scouting_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) el.placeholder = t(key);
            else el.innerHTML = t(key);
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
    const grid = document.getElementById('playersGrid');
    if (grid && grid.innerHTML.includes('no-results')) {
        const emptyDiv = grid.querySelector('.no-results');
        if (emptyDiv) emptyDiv.textContent = t('scouting.no_results');
    }
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('scouting_lang', lang);
        applyTranslations();
        renderPlayers(allPlayers);
    }
}

// ========== ÉLÉMENTS DOM ==========
const playersGrid = document.getElementById('playersGrid');
const resultCount = document.getElementById('resultCount');
const continentFilter = document.getElementById('continentFilter');
const categoryFilter = document.getElementById('categoryFilter');
const countrySearch = document.getElementById('countrySearch');
const searchBtn = document.getElementById('searchBtn');

let allPlayers = [];

// ========== CHARGEMENT DES SPORTIFS ==========
async function loadAllPlayers() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_scouting_sportifs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allPlayers = data || [];
        renderPlayers(allPlayers);
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load'), 'error');
        playersGrid.innerHTML = `<div class="no-results">${t('toast.error_load')}</div>`;
    } finally {
        hideLoader();
    }
}

function filterPlayers() {
    const continent = continentFilter.value;
    const category = categoryFilter.value;
    const search = countrySearch.value.toLowerCase().trim();
    const filtered = allPlayers.filter(p => {
        const matchContinent = continent === 'all' || p.continent === continent;
        const matchCategory = category === 'all' || p.cat === category;
        const matchSearch = !search || (p.pays && p.pays.toLowerCase().includes(search)) || (p.nom && p.nom.toLowerCase().includes(search));
        return matchContinent && matchCategory && matchSearch;
    });
    renderPlayers(filtered);
}

function renderPlayers(players) {
    if (!playersGrid) return;
    if (players.length === 0) {
        playersGrid.innerHTML = `<div class="no-results">${t('scouting.no_results')}</div>`;
        resultCount.textContent = '0 ' + (currentLang === 'fr' ? 'sportif' : 'athlete');
        return;
    }
    let html = '';
    for (const p of players) {
        const badgeClass = p.cat === 'mineur' ? 'mineur' : 'adulte';
        const badgeText = p.cat === 'mineur' ? (currentLang === 'fr' ? 'U17' : 'U17') : (currentLang === 'fr' ? '18+' : '18+');
        const age = p.age ? `${p.age} ${currentLang === 'fr' ? 'ans' : 'yrs'}` : '';
        html += `
            <div class="player-card">
                <div class="card-image">
                    <img src="${p.image_url || 'img/player-placeholder.jpg'}" alt="${escapeHtml(p.nom)}" onerror="this.src='img/player-placeholder.jpg'">
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-content">
                    <h3>${escapeHtml(p.nom)}</h3>
                    <p>${escapeHtml(p.poste || '')}</p>
                    <div class="card-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(p.pays || '')}</span>
                        ${age ? `<span><i class="fas fa-calendar-alt"></i> ${age}</span>` : ''}
                        <span><i class="fas fa-futbol"></i> ${escapeHtml(p.club || '')}</span>
                    </div>
                    <div class="card-cert">
                        <i class="fas fa-graduation-cap"></i> ${escapeHtml(p.cert || '')}
                    </div>
                    <a href="profil-scouting.html?id=${p.id}" class="btn-view">${t('scouting.view_profile')}</a>
                </div>
            </div>
        `;
    }
    playersGrid.innerHTML = html;
    const count = players.length;
    resultCount.textContent = `${count} ${currentLang === 'fr' ? (count > 1 ? 'sportifs' : 'sportif') : (count > 1 ? 'athletes' : 'athlete')}`;
}

// ========== UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function initMenuMobile() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
    }
}
function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

searchBtn.addEventListener('click', filterPlayers);
continentFilter.addEventListener('change', filterPlayers);
categoryFilter.addEventListener('change', filterPlayers);
countrySearch.addEventListener('input', filterPlayers);

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadAllPlayers();
});