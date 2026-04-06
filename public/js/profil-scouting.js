// ========== PROFIL-SCOUTING.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
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
        'profil.title': 'Profil du sportif',
        'profil.nom': 'Nom',
        'profil.poste': 'Poste',
        'profil.age': 'Âge',
        'profil.pays': 'Pays',
        'profil.continent': 'Continent',
        'profil.categorie': 'Catégorie',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Vidéo de présentation',
        'profil.retour': '← Retour à la liste',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.not_found': 'Sportif non trouvé',
        'toast.error_load': 'Erreur chargement du profil'
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
        'profil.title': 'Athlete profile',
        'profil.nom': 'Name',
        'profil.poste': 'Position',
        'profil.age': 'Age',
        'profil.pays': 'Country',
        'profil.continent': 'Continent',
        'profil.categorie': 'Category',
        'profil.club': 'Club',
        'profil.certification': 'Certification',
        'profil.video': 'Highlight video',
        'profil.retour': '← Back to list',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.not_found': 'Athlete not found',
        'toast.error_load': 'Error loading profile'
    }
};

let currentLang = localStorage.getItem('profil_scouting_lang') || navigator.language.split('-')[0];
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
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('profil_scouting_lang', lang);
        applyTranslations();
        chargerProfil();
    }
}

// ========== RÉCUPÉRATION ID ==========
const urlParams = new URLSearchParams(window.location.search);
const sportifId = urlParams.get('id');
if (!sportifId) {
    window.location.href = 'scouting.html';
}

// ========== CHARGEMENT DU PROFIL ==========
async function chargerProfil() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_scouting_sportifs')
            .select('*')
            .eq('id', sportifId)
            .single();
        if (error || !data) throw new Error('not found');
        afficherProfil(data);
    } catch (err) {
        console.error(err);
        showToast(t('toast.not_found'), 'error');
        document.getElementById('profilContainer').innerHTML = '<div class="error-message">' + t('toast.not_found') + '</div>';
    } finally {
        hideLoader();
    }
}

function afficherProfil(sportif) {
    const container = document.getElementById('profilContainer');
    const ageText = sportif.age ? `${sportif.age} ${currentLang === 'fr' ? 'ans' : 'yrs'}` : '-';
    const categorieText = sportif.cat === 'mineur' ? (currentLang === 'fr' ? 'U17 (Mineur)' : 'U17 (Minor)') : (currentLang === 'fr' ? '18+ (Adulte)' : '18+ (Adult)');
    const continentMap = {
        'Afrique': currentLang === 'fr' ? 'Afrique' : 'Africa',
        'Europe': 'Europe',
        'Amérique': currentLang === 'fr' ? 'Amérique' : 'America',
        'Asie': 'Asia'
    };
    const continentLabel = continentMap[sportif.continent] || sportif.continent;
    const imageUrl = sportif.image_url || 'img/player-placeholder.jpg';
    const videoHtml = sportif.video_url ? `
        <div class="profil-video">
            <h3><i class="fas fa-video"></i> ${t('profil.video')}</h3>
            <div class="video-container">
                ${sportif.video_url.includes('youtube.com') || sportif.video_url.includes('vimeo.com') ? 
                    `<iframe src="${sportif.video_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` :
                    `<video controls><source src="${sportif.video_url}" type="video/mp4"></video>`
                }
            </div>
        </div>
    ` : '';

    const html = `
        <div class="profil-card">
            <div class="profil-header">
                <h1>${escapeHtml(sportif.nom)}</h1>
                <p>${escapeHtml(sportif.poste || '')}</p>
            </div>
            <div class="profil-body">
                <div class="profil-image">
                    <img src="${imageUrl}" alt="${escapeHtml(sportif.nom)}" onerror="this.src='img/player-placeholder.jpg'">
                </div>
                <div class="profil-info">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <label>${t('profil.nom')}</label>
                        <span>${escapeHtml(sportif.nom)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-futbol"></i>
                        <label>${t('profil.poste')}</label>
                        <span>${escapeHtml(sportif.poste || '-')}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <label>${t('profil.age')}</label>
                        <span>${ageText}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <label>${t('profil.pays')}</label>
                        <span>${escapeHtml(sportif.pays || '-')}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-globe"></i>
                        <label>${t('profil.continent')}</label>
                        <span>${escapeHtml(continentLabel)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-tag"></i>
                        <label>${t('profil.categorie')}</label>
                        <span>${categorieText}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-building"></i>
                        <label>${t('profil.club')}</label>
                        <span>${escapeHtml(sportif.club || '-')}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-certificate"></i>
                        <label>${t('profil.certification')}</label>
                        <span>${escapeHtml(sportif.cert || '-')}</span>
                    </div>
                </div>
                ${videoHtml}
                <div style="text-align: center; margin-top: 30px;">
                    <a href="scouting.html" class="back-link"><i class="fas fa-arrow-left"></i> ${t('profil.retour')}</a>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
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

// ========== MENU MOBILE ET LANGUE ==========
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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    chargerProfil();
});