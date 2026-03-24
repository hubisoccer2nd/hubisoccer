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

// ===== GESTION DES LANGUES (uniquement pour les textes présents dans cette page) =====
const translations = {
    fr: {
        titre_esp: "En savoir plus | HubISoccer",
        esp_titre: "En savoir plus sur HubISoccer",
        esp_sous_titre: "Toutes les informations utiles pour mieux nous connaître.",
        faq_titre: "FAQ",
        faq_desc: "Questions fréquentes sur le fonctionnement de la plateforme.",
        cgu_titre: "CGU",
        cgu_desc: "Conditions générales d'utilisation du site.",
        mentions_titre: "Mentions légales",
        mentions_desc: "Informations juridiques et éditeur du site.",
        contact_titre: "Contact",
        contact_desc: "Comment nous joindre par email ou téléphone.",
        partenaires_titre: "Partenaires",
        partenaires_desc: "Nos partenaires et soutiens.",
        actualites_titre: "Actualités",
        actualites_desc: "Les dernières nouvelles du projet.",
        resultats_titre: "Résultats",
        resultats_desc: "Classements et résultats des tournois.",
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
        parrain: "PARRAINS",
        tournoi_public: "TOURNOI PUBLIC",
        esp: "SAVOIR+"
    },
    en: {
        titre_esp: "Learn more | HubISoccer",
        esp_titre: "Learn more about HubISoccer",
        esp_sous_titre: "All the useful information to get to know us better.",
        faq_titre: "FAQ",
        faq_desc: "Frequently asked questions about how the platform works.",
        cgu_titre: "Terms of use",
        cgu_desc: "General terms and conditions of use of the site.",
        mentions_titre: "Legal notices",
        mentions_desc: "Legal information and publisher of the site.",
        contact_titre: "Contact",
        contact_desc: "How to contact us by email or phone.",
        partenaires_titre: "Partners",
        partenaires_desc: "Our partners and supporters.",
        actualites_titre: "News",
        actualites_desc: "The latest news about the project.",
        resultats_titre: "Results",
        resultats_desc: "Tournament standings and results.",
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
        parrain: "SPONSORS",
        tournoi_public: "PUBLIC TOURNAMENT",
        esp: "MORE"
    },
    // Les autres langues peuvent être ajoutées de la même manière, mais on peut aussi les importer depuis un fichier JSON plus tard.
};

let currentLang = 'fr';

function applyTranslations(lang) {
    const t = translations[lang];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            // Si l'élément contient du HTML, on remplace le HTML, sinon le texte
            if (el.innerHTML.includes('<')) {
                el.innerHTML = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
}

function loadLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations(lang);
        localStorage.setItem('hubiLang', lang);
    } else {
        console.warn('Langue non disponible, fallback vers français');
        if (lang !== 'fr') loadLanguage('fr');
    }
}

// Initialisation
const savedLang = localStorage.getItem('hubiLang') || 'fr';
loadLanguage(savedLang);

// Écouter le changement de langue
document.getElementById('langSelect').addEventListener('change', (e) => {
    loadLanguage(e.target.value);
});