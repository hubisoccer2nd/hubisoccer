/* DEBUT : faq/faq.js */
// ========== FAQ.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

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
        'faq.title': 'Foire aux Questions',
        'faq.subtitle': 'Trouvez rapidement une réponse à votre question.',
        'faq.no_items': 'Aucune question pour le moment.',
        'faq.error_load': 'Erreur lors du chargement des questions.',
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
        'faq.title': 'Frequently Asked Questions',
        'faq.subtitle': 'Find an answer to your question quickly.',
        'faq.no_items': 'No questions yet.',
        'faq.error_load': 'Error loading questions.',
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
        'faq.title': 'Preguntas Frecuentes',
        'faq.subtitle': 'Encuentre rápidamente una respuesta a su pregunta.',
        'faq.no_items': 'Ninguna pregunta por el momento.',
        'faq.error_load': 'Error al cargar las preguntas.',
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
        'faq.title': 'Perguntas Frequentes',
        'faq.subtitle': 'Encontre rapidamente uma resposta à sua pergunta.',
        'faq.no_items': 'Nenhuma pergunta no momento.',
        'faq.error_load': 'Erro ao carregar as perguntas.',
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
        loadFAQ();
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

// ========== DÉBUT : CHARGEMENT DE LA FAQ ==========
async function loadFAQ() {
    const container = document.getElementById('faqList');
    if (!container) return;
    container.innerHTML = `<div class="loader">${t('loader.message')}</div>`;
    try {
        const { data, error } = await supabasePublic
            .from('public_pages')
            .select('titre, contenu, ordre')
            .eq('slug', 'faq')
            .order('ordre', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="no-faq">${t('faq.no_items')}</p>`;
            return;
        }
        let html = '';
        data.forEach(item => {
            html += `
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>${escapeHtml(item.titre)}</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>${item.contenu}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Accordéon
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="error-faq">${t('faq.error_load')}</p>`;
    }
}
// ========== FIN : CHARGEMENT DE LA FAQ ==========

// ========== DÉBUT : UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    loadFAQ();
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
/* FIN : faq/faq.js */