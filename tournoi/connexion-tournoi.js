// ========== DEBUT : tournoi/connexion-tournoi.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DEBUT : HACHAGE NATIF (SHA-256) ==========
async function hashPasswordNative(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
// ========== FIN : HACHAGE NATIF ==========

// ========== DEBUT : TRADUCTIONS ==========
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
        'toast.connexion_error': 'Erreur lors de la connexion.',
        'toast.compte_inactif': 'Votre compte n\'est pas encore activé.',
        'toast.connexion_reussie': 'Connexion réussie, redirection...'
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
        'toast.connexion_error': 'Connection error.',
        'toast.compte_inactif': 'Your account is not yet activated.',
        'toast.connexion_reussie': 'Login successful, redirecting...'
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
// ========== FIN : TRADUCTIONS ==========

// ========== DEBUT : UTILITAIRES ==========
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
// ========== FIN : UTILITAIRES ==========

// ========== DEBUT : GESTION DE LA CONNEXION ==========
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
            // 1. Récupérer l'utilisateur par login
            const { data: user, error: userError } = await supabasePublic
                .from('public_utilisateurs_tournoi')
                .select('id, inscription_id, role, mot_de_passe_hash')
                .eq('login', login)
                .single();

            if (userError || !user) {
                showToast(t('toast.login_error'), 'error');
                return;
            }

            // 2. Vérifier le mot de passe avec SHA-256
            const hashedInput = await hashPasswordNative(password);
            if (hashedInput !== user.mot_de_passe_hash) {
                showToast(t('toast.login_error'), 'error');
                return;
            }

            // 3. Récupérer l'inscription associée
            const { data: inscription, error: inscriptionError } = await supabasePublic
                .from('public_inscriptions_tournoi')
                .select('statut, nom_complet, code_id')
                .eq('id', user.inscription_id)
                .single();

            if (inscriptionError || !inscription) {
                showToast('Erreur lors de la vérification du compte.', 'error');
                return;
            }

            if (inscription.statut !== 'valide') {
                showToast(t('toast.compte_inactif'), 'warning');
                return;
            }

            // 4. Obtenir le tournoi_id via la table des codes
            const { data: code, error: codeError } = await supabasePublic
                .from('public_codes_tournoi')
                .select('tournoi_id')
                .eq('id', inscription.code_id)
                .single();

            if (codeError || !code) {
                showToast('Erreur lors de la récupération du tournoi.', 'error');
                return;
            }

            // 5. Stocker en session
            sessionStorage.setItem('tournoi_user_id', user.id);
            sessionStorage.setItem('tournoi_login', login);
            sessionStorage.setItem('tournoi_role', user.role);
            sessionStorage.setItem('tournoi_inscription_id', user.inscription_id);
            sessionStorage.setItem('tournoi_nom', inscription.nom_complet);
            sessionStorage.setItem('tournoi_tournoi_id', code.tournoi_id);

            showToast(t('toast.connexion_reussie'), 'success');
            window.location.href = 'dashboard-tournoi.html';
        } catch (err) {
            console.error(err);
            showToast(t('toast.connexion_error'), 'error');
        } finally {
            hideLoader();
        }
    });
}
// ========== FIN : GESTION DE LA CONNEXION ==========

// ========== DEBUT : MENU MOBILE ET LANGUE ==========
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
// ========== FIN : MENU MOBILE ET LANGUE ==========

// ========== DEBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    if (sessionStorage.getItem('tournoi_user_id')) {
        window.location.href = 'dashboard-tournoi.html';
    }
});
// ========== FIN : INITIALISATION ==========
// ========== FIN : tournoi/connexion-tournoi.js ==========