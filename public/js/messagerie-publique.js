// ========== MESSAGERIE-PUBLIQUE.JS ==========
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
        'contact.title': 'Contactez-nous',
        'contact.subtitle': 'Une question sur les tournois, une suggestion ? Écrivez-nous, nous vous répondrons rapidement.',
        'contact.nom': 'Nom complet *',
        'contact.email': 'Email *',
        'contact.sujet': 'Sujet *',
        'contact.message': 'Message *',
        'contact.envoyer': 'Envoyer',
        'contact.tel': '+229 01 95 97 31 57',
        'contact.email_adresse': 'contacthubisoccer@gmail.com',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.invalid_email': 'Email invalide.',
        'toast.message_sent': 'Message envoyé avec succès. Nous vous répondrons rapidement.',
        'toast.send_error': 'Erreur lors de l\'envoi. Veuillez réessayer.'
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
        'contact.title': 'Contact us',
        'contact.subtitle': 'A question about tournaments, a suggestion? Write to us, we will answer quickly.',
        'contact.nom': 'Full name *',
        'contact.email': 'Email *',
        'contact.sujet': 'Subject *',
        'contact.message': 'Message *',
        'contact.envoyer': 'Send',
        'contact.tel': '+229 01 95 97 31 57',
        'contact.email_adresse': 'contacthubisoccer@gmail.com',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.invalid_email': 'Invalid email.',
        'toast.message_sent': 'Message sent successfully. We will answer you shortly.',
        'toast.send_error': 'Error sending message. Please try again.'
    }
};

let currentLang = localStorage.getItem('contact_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('contact_lang', lang);
        applyTranslations();
    }
}

// ========== ÉLÉMENTS DOM ==========
const form = document.getElementById('contactForm');
const nomInput = document.getElementById('contactNom');
const emailInput = document.getElementById('contactEmail');
const sujetInput = document.getElementById('contactSujet');
const messageInput = document.getElementById('contactMessage');

// ========== ENVOI DU MESSAGE ==========
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim();
    const sujet = sujetInput.value.trim();
    const message = messageInput.value.trim();

    if (!nom || !email || !sujet || !message) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_contact_messages')
            .insert([{
                nom: nom,
                email: email,
                sujet: sujet,
                message: message,
                lu: false,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.message_sent'), 'success');
        form.reset();
    } catch (err) {
        console.error(err);
        showToast(t('toast.send_error'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== UTILITAIRES ==========
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
});