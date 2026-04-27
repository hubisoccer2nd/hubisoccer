// ========== HUBISOCCER-DESIGNER.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DÉBUT : TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESSUS',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'DEVENIR ACTEUR',
        'nav.tournoi': 'TOURNOIS PUBLIC',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-MARKET',
        'nav.designer': 'DESIGNER',
        'nav.login': 'CONNEXION',
        'nav.signup': 'INSCRIPTION',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'form.register': 'INSCRIPTION',
        'form.login': 'CONNEXION',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.passwords_mismatch': 'Les mots de passe ne correspondent pas.',
        'toast.invalid_email': 'Adresse email invalide.',
        'toast.register_success': 'Inscription envoyée ! Vous recevrez vos identifiants après validation.',
        'toast.register_error': 'Erreur lors de l\'inscription. Veuillez réessayer.',
        'toast.login_success': 'Connexion réussie ! Redirection...',
        'toast.login_error': 'Email ou mot de passe incorrect, ou compte non validé.',
        'toast.waiting_validation': 'Votre compte est en attente de validation par l\'administration.'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESS',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'BECOME AN ACTOR',
        'nav.tournoi': 'PUBLIC TOURNAMENTS',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-MARKET',
        'nav.designer': 'DESIGNER',
        'nav.login': 'LOGIN',
        'nav.signup': 'SIGN UP',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'form.register': 'SIGN UP',
        'form.login': 'LOGIN',
        'toast.fill_fields': 'Please fill in all required fields.',
        'toast.passwords_mismatch': 'Passwords do not match.',
        'toast.invalid_email': 'Invalid email address.',
        'toast.register_success': 'Registration submitted! You will receive your credentials after validation.',
        'toast.register_error': 'Registration error. Please try again.',
        'toast.login_success': 'Login successful! Redirecting...',
        'toast.login_error': 'Incorrect email or password, or account not validated.',
        'toast.waiting_validation': 'Your account is pending admin validation.'
    }
};

let currentLang = localStorage.getItem('designer_lang') || navigator.language.split('-')[0];
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
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('designer_lang', lang);
        applyTranslations();
    }
}
// ========== FIN : TRADUCTIONS ==========

// ========== DÉBUT : ÉLÉMENTS DOM ==========
const globalLoader = document.getElementById('globalLoader');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const langSelect = document.getElementById('langSelect');
const tabBtns = document.querySelectorAll('.tab-btn');
const registerTab = document.getElementById('registerTab');
const loginTab = document.getElementById('loginTab');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
// ========== FIN : ÉLÉMENTS DOM ==========

// ========== DÉBUT : UTILITAIRES ==========
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function showToast(message, type = 'info', duration = 4000) {
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

function hashPassword(password) {
    // Simple encodage (évolution future : bcrypt)
    return btoa(password);
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : MENU MOBILE & LANGUE ==========
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

langSelect.value = currentLang;
langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
// ========== FIN : MENU MOBILE & LANGUE ==========

// ========== DÉBUT : GESTION DES ONGLETS ==========
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (tab === 'register') {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
        } else {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        }
        // Efface les messages
        registerMessage.innerHTML = '';
        loginMessage.innerHTML = '';
    });
});
// ========== FIN : GESTION DES ONGLETS ==========

// ========== DÉBUT : INSCRIPTION ==========
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prenom = document.getElementById('regPrenom').value.trim();
    const nom = document.getElementById('regNom').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const telephone = document.getElementById('regTelephone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Validation
    if (!prenom || !nom || !email || !telephone || !password || !confirmPassword) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (password !== confirmPassword) {
        showToast(t('toast.passwords_mismatch'), 'warning');
        return;
    }
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    showLoader();
    try {
        const passwordHash = hashPassword(password);
        const { error } = await supabasePublic
            .from('designer_users')
            .insert([{
                prenom,
                nom,
                email,
                telephone,
                mot_de_passe_hash: passwordHash,
                statut: 'en_attente'
            }]);

        if (error) {
            // Gérer les contraintes d'unicité (email, telephone)
            if (error.code === '23505') {
                showToast('Cet email ou téléphone est déjà utilisé.', 'warning');
            } else {
                throw error;
            }
        } else {
            showToast(t('toast.register_success'), 'success');
            registerForm.reset();
            registerMessage.innerHTML = '<p style="color: var(--primary);">Votre demande a été envoyée. Vous recevrez vos identifiants par email/WhatsApp après validation.</p>';
        }
    } catch (err) {
        console.error(err);
        showToast(t('toast.register_error'), 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : INSCRIPTION ==========

// ========== DÉBUT : CONNEXION ==========
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }

    showLoader();
    try {
        const passwordHash = hashPassword(password);
        const { data, error } = await supabasePublic
            .from('designer_users')
            .select('id, statut, prenom')
            .eq('email', email)
            .eq('mot_de_passe_hash', passwordHash)
            .single();

        if (error || !data) {
            showToast(t('toast.login_error'), 'error');
            return;
        }

        if (data.statut === 'en_attente') {
            showToast(t('toast.waiting_validation'), 'warning');
            return;
        }

        if (data.statut === 'approuve') {
            // Stocker l'utilisateur en session
            sessionStorage.setItem('designer_user', JSON.stringify({ id: data.id, prenom: data.prenom }));
            showToast(t('toast.login_success'), 'success');
            setTimeout(() => {
                window.location.href = 'dashboard-designer.html';
            }, 1000);
        } else {
            showToast(t('toast.login_error'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast(t('toast.login_error'), 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : CONNEXION ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});
// ========== FIN : INITIALISATION ==========
// ========== FIN DE HUBISOCCER-DESIGNER.JS ==========
