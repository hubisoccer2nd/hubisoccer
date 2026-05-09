// ========== DEBUT : 404.js ==========

// ========== DEBUT : GESTION DU MENU MOBILE ==========
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
// ========== FIN : GESTION DU MENU MOBILE ==========

// ========== DEBUT : TRADUCTIONS ==========
let currentLang = localStorage.getItem('hubiLang') || 'fr';

function applyTranslations(lang) {
    const t = window.translations?.[lang] || window.translations?.fr;
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.innerHTML.includes('<')) {
                el.innerHTML = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
}

function loadLanguage(lang) {
    if (window.translations?.[lang]) {
        currentLang = lang;
        applyTranslations(lang);
        localStorage.setItem('hubiLang', lang);
    } else {
        console.warn('Langue non disponible, fallback vers français');
        if (lang !== 'fr') loadLanguage('fr');
    }
}
// ========== FIN : TRADUCTIONS ==========

// ========== DEBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('hubiLang') || 'fr';
    loadLanguage(savedLang);

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            loadLanguage(e.target.value);
        });
    }
});
// ========== FIN : INITIALISATION ==========

// ========== FIN : 404.js ==========