/* DEBUT : esp/esp.js */
// ========== ESP.JS ==========
// ========== DÉBUT : TRADUCTIONS (4 LANGUES) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER‑PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'NOS CLUBS',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Connexion',
        'inscrire': 'S\'inscrire',
        'esp.title': 'SAVOIR+',
        'esp.subtitle': 'Tout ce qu\'il faut savoir pour réussir dans l\'écosystème HubISoccer.',
        'esp.faq': 'FAQ',
        'esp.faq.desc': 'Questions fréquentes',
        'esp.cgu': 'CGU',
        'esp.cgu.desc': 'Conditions Générales d\'Utilisation',
        'esp.mentions': 'Mentions Légales',
        'esp.mentions.desc': 'Informations légales',
        'esp.contact': 'Contact',
        'esp.contact.desc': 'Nous contacter',
        'esp.partenaires': 'Partenaires',
        'esp.partenaires.desc': 'Nos partenaires',
        'esp.actualites': 'Actualités',
        'esp.actualites.desc': 'Dernières nouvelles',
        'esp.resultats': 'Résultats',
        'esp.resultats.desc': 'Résultats des tournois',
        'esp.parrains': 'PARRAINS',
        'esp.parrains.desc': 'Espace parrains',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'FIRST STEP',
        'acteurs': 'BECOME AN ACTOR',
        'artiste': 'BECOME AN ARTIST',
        'nos_clubs': 'OUR CLUBS',
        'tournoi_public': 'PUBLIC TOURNAMENT',
        'esp': 'LEARN MORE',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'esp.title': 'LEARN MORE',
        'esp.subtitle': 'Everything you need to know to succeed in the HubISoccer ecosystem.',
        'esp.faq': 'FAQ',
        'esp.faq.desc': 'Frequently asked questions',
        'esp.cgu': 'CGU',
        'esp.cgu.desc': 'Terms of Use',
        'esp.mentions': 'Legal Notice',
        'esp.mentions.desc': 'Legal information',
        'esp.contact': 'Contact',
        'esp.contact.desc': 'Contact us',
        'esp.partenaires': 'Partners',
        'esp.partenaires.desc': 'Our partners',
        'esp.actualites': 'News',
        'esp.actualites.desc': 'Latest news',
        'esp.resultats': 'Results',
        'esp.resultats.desc': 'Tournament results',
        'esp.parrains': 'SPONSORS',
        'esp.parrains.desc': 'Sponsors area',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    },
    es: {
        'loader.message': 'Cargando...',
        'hub_market': 'MERCADO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESO',
        'affiliation': 'AFILIACIÓN',
        'premier_pas': 'PRIMER PASO',
        'acteurs': 'CONVIÉRTETE EN ACTOR',
        'artiste': 'CONVIÉRTETE EN ARTISTA',
        'nos_clubs': 'NUESTROS CLUBES',
        'tournoi_public': 'TORNEO PÚBLICO',
        'esp': 'SABER MÁS',
        'connexion': 'Iniciar sesión',
        'inscrire': 'Registrarse',
        'esp.title': 'SABER MÁS',
        'esp.subtitle': 'Todo lo que necesitas saber para tener éxito en el ecosistema HubISoccer.',
        'esp.faq': 'FAQ',
        'esp.faq.desc': 'Preguntas frecuentes',
        'esp.cgu': 'CGU',
        'esp.cgu.desc': 'Términos de uso',
        'esp.mentions': 'Aviso legal',
        'esp.mentions.desc': 'Información legal',
        'esp.contact': 'Contacto',
        'esp.contact.desc': 'Contáctenos',
        'esp.partenaires': 'Socios',
        'esp.partenaires.desc': 'Nuestros socios',
        'esp.actualites': 'Noticias',
        'esp.actualites.desc': 'Últimas noticias',
        'esp.resultats': 'Resultados',
        'esp.resultats.desc': 'Resultados de torneos',
        'esp.parrains': 'PADRINOS',
        'esp.parrains.desc': 'Espacio de padrinos',
        'footer_conformite': 'Conformidad APDP Benín',
        'footer_reglementation': 'Reglamento FIFA',
        'footer_double_projet': 'Triple Proyecto Deporte-Estudios-Carrera',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.'
    },
    pt: {
        'loader.message': 'Carregando...',
        'hub_market': 'MERCADO',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSO',
        'affiliation': 'AFILIAÇÃO',
        'premier_pas': 'PRIMEIRO PASSO',
        'acteurs': 'TORNE-SE UM ATOR',
        'artiste': 'TORNE-SE UM ARTISTA',
        'nos_clubs': 'NOSSOS CLUBES',
        'tournoi_public': 'TORNEIO PÚBLICO',
        'esp': 'SAIBA MAIS',
        'connexion': 'Entrar',
        'inscrire': 'Inscrever-se',
        'esp.title': 'SAIBA MAIS',
        'esp.subtitle': 'Tudo o que precisa de saber para ter sucesso no ecossistema HubISoccer.',
        'esp.faq': 'FAQ',
        'esp.faq.desc': 'Perguntas frequentes',
        'esp.cgu': 'CGU',
        'esp.cgu.desc': 'Termos de Utilização',
        'esp.mentions': 'Aviso Legal',
        'esp.mentions.desc': 'Informações legais',
        'esp.contact': 'Contacto',
        'esp.contact.desc': 'Contacte-nos',
        'esp.partenaires': 'Parceiros',
        'esp.partenaires.desc': 'Os nossos parceiros',
        'esp.actualites': 'Notícias',
        'esp.actualites.desc': 'Últimas notícias',
        'esp.resultats': 'Resultados',
        'esp.resultats.desc': 'Resultados dos torneios',
        'esp.parrains': 'PATROCINADORES',
        'esp.parrains.desc': 'Espaço dos patrocinadores',
        'footer_conformite': 'Conformidade APDP Benim',
        'footer_reglementation': 'Regulamento FIFA',
        'footer_double_projet': 'Triplo Projeto Desporto-Estudos-Carreira',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Todos os direitos reservados.'
    }
};
// ========== FIN : TRADUCTIONS ==========

// ========== DÉBUT : FONCTIONS DE TRADUCTION ==========
let currentLang = localStorage.getItem('hubiLang') || navigator.language.split('-')[0];
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
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }

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
});
// ========== FIN : INITIALISATION ==========
/* FIN : esp/esp.js */