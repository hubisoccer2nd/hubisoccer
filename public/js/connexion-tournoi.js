// ========== CONNEXION-TOURNOI.JS ==========
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
        'connexion.title': 'Espace tournoi',
        'connexion.subtitle': 'Connectez-vous avec vos identifiants reçus après validation.',
        'connexion.login': 'Login *',
        'connexion.password': 'Mot de passe *',
        'connexion.submit': 'Se connecter',
        'connexion.register_text': 'Pas encore de compte ?',
        'connexion.register_link': 'Inscrivez-vous à un tournoi',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.login_error': 'Login ou mot de passe incorrect.',
        'toast.connexion_error': 'Erreur lors de la connexion.'
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
        'connexion.title': 'Tournament area',
        'connexion.subtitle': 'Login with your credentials received after validation.',
        'connexion.login': 'Login *',
        'connexion.password': 'Password *',
        'connexion.submit': 'Login',
        'connexion.register_text': 'No account yet?',
        'connexion.register_link': 'Register for a tournament',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.login_error': 'Incorrect login or password.',
        'toast.connexion_error': 'Connection error.'
    }
};

let currentLang = localStorage.getItem('connexion_lang') || navigator.language.split('-')[0];
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
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('connexion_lang', lang);
        applyTranslations();
    }
}

// ========== FONCTIONS UTILITAIRES ==========
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// Hash simple (identique à celui utilisé dans l'admin)
function hashPassword(password) {
    return btoa(password); // ⚠️ À remplacer par bcrypt en production
}

// ========== GESTION DE LA CONNEXION ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!login || !password) {
            showToast(t('toast.fill_fields'), 'warning');
            return;
        }

        showLoader();
        try {
            const passwordHash = hashPassword(password);
            const { data, error } = await supabasePublic
                .from('public_utilisateurs_tournoi')
                .select('id, inscription_id, role, public_inscriptions_tournoi(statut, nom_complet, public_codes_tournoi(tournoi_id))')
                .eq('login', login)
                .eq('mot_de_passe_hash', passwordHash)
                .single();

            if (error || !data) {
                showToast(t('toast.login_error'), 'error');
                return;
            }

            // Vérifier que l'inscription est bien validée (statut = 'valide')
            const inscription = data.public_inscriptions_tournoi;
            if (!inscription || inscription.statut !== 'valide') {
                showToast('Votre compte n\'est pas encore activé.', 'warning');
                return;
            }

            // Stocker les informations de session
            sessionStorage.setItem('tournoi_user_id', data.id);
            sessionStorage.setItem('tournoi_login', login);
            sessionStorage.setItem('tournoi_role', data.role);
            sessionStorage.setItem('tournoi_inscription_id', data.inscription_id);
            sessionStorage.setItem('tournoi_nom', inscription.nom_complet);
            if (inscription.public_codes_tournoi && inscription.public_codes_tournoi.tournoi_id) {
                sessionStorage.setItem('tournoi_tournoi_id', inscription.public_codes_tournoi.tournoi_id);
            }

            showToast('Connexion réussie, redirection...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard-tournoi.html';
            }, 1500);
        } catch (err) {
            console.error(err);
            showToast(t('toast.connexion_error'), 'error');
        } finally {
            hideLoader();
        }
    });
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
    // Si déjà connecté, rediriger vers dashboard
    if (sessionStorage.getItem('tournoi_user_id')) {
        window.location.href = 'dashboard-tournoi.html';
    }
});