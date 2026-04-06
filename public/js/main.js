// ===== GESTION DU MENU MOBILE ET DE LA LANGUE =====
// Ces fonctions seront appelées après le chargement des composants
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (!menuToggle || !navLinks) return;
    
    const toggleMenu = (e) => {
        e.preventDefault();
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    };
    menuToggle.removeEventListener('click', toggleMenu);
    menuToggle.addEventListener('click', toggleMenu);
    
    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#menuToggle') && !e.target.closest('.nav-links')) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}

function initLanguage() {
    const translations = {
        fr: {
            footer_conformite: "Conformité APDP Bénin",
            footer_reglementation: "Règlementation FIFA",
            footer_double_projet: "Triple Projet Sport-Études-Carrière",
            contact_tel: "📞 +229 01 95 97 31 57",
            contact_email: "📧 contacthubisoccer@gmail.com",
            rccm: "RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236",
            copyright: "© 2026 HubISoccer - Ozawa. Tous droits réservés.",
            connexion: "Connexion",
            inscrire: "S'inscrire",
            hub_market: "HUBISOCCER MARKET",
            hub_community: "HUB COMMUNITY",
            scouting: "SCOUTING",
            processus: "PROCESSUS",
            affiliation: "AFFILIATION",
            premier_pas: "PREMIER-PAS",
            parrain: "DEVENEZ UN ACTEUR",
            tournoi_public: "TOURNOI PUBLIC",
            esp: "SAVOIR+"
        },
        en: {
            footer_conformite: "APDP Benin Compliance",
            footer_reglementation: "FIFA Regulations",
            footer_double_projet: "Triple Sport-Study-Career Project",
            contact_tel: "📞 +229 01 95 97 31 57",
            contact_email: "📧 contacthubisoccer@gmail.com",
            rccm: "RCCM: RB/ABC/24 A 111814 | TIN: 0201910800236",
            copyright: "© 2026 HubISoccer - Ozawa. All rights reserved.",
            connexion: "Login",
            inscrire: "Sign up",
            hub_market: "HUBISOCCER MARKET",
            hub_community: "HUB COMMUNITY",
            scouting: "SCOUTING",
            processus: "PROCESS",
            affiliation: "AFFILIATION",
            premier_pas: "FIRST STEPS",
            parrain: "BECOME AN ACTOR",
            tournoi_public: "PUBLIC TOURNAMENT",
            esp: "MORE"
        }
        // Ajoutez les autres langues ici si nécessaire
    };
    
    function applyTranslations(lang) {
        const t = translations[lang];
        if (!t) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.innerHTML.includes('<')) el.innerHTML = t[key];
                else el.textContent = t[key];
            }
        });
    }
    
    function loadLanguage(lang) {
        if (translations[lang]) {
            applyTranslations(lang);
            localStorage.setItem('hubiLang', lang);
        } else {
            console.warn('Langue non disponible, fallback français');
            if (lang !== 'fr') loadLanguage('fr');
        }
    }
    
    const savedLang = localStorage.getItem('hubiLang') || 'fr';
    loadLanguage(savedLang);
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => loadLanguage(e.target.value));
    }
}

// Exposer les fonctions pour qu'elles soient appelées après injection des composants
window.initComponents = function() {
    initMobileMenu();
    initLanguage();
};