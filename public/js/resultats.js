// ========== RESULTATS.JS ==========
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
        'resultats.title': 'Résultats des tournois',
        'resultats.pas_resultat': 'Aucun résultat disponible pour le moment.',
        'resultats.podium.1er': '1er',
        'resultats.podium.2e': '2e',
        'resultats.podium.3e': '3e',
        'resultats.classement': 'Classement complet',
        'resultats.en_cours': 'Tournoi en cours',
        'resultats.a_venir': 'À venir',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load': 'Erreur chargement des résultats'
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
        'resultats.title': 'Tournament results',
        'resultats.pas_resultat': 'No results available at the moment.',
        'resultats.podium.1er': '1st',
        'resultats.podium.2e': '2nd',
        'resultats.podium.3e': '3rd',
        'resultats.classement': 'Full ranking',
        'resultats.en_cours': 'Ongoing tournament',
        'resultats.a_venir': 'Upcoming',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load': 'Error loading results'
    }
};

let currentLang = localStorage.getItem('resultats_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('resultats_lang', lang);
        applyTranslations();
        chargerResultats();
    }
}

// ========== CHARGEMENT DES RÉSULTATS ==========
const resultatsList = document.getElementById('resultatsList');

async function chargerResultats() {
    showLoader();
    try {
        // Récupérer les tournois terminés (date_fin < aujourd'hui)
        const today = new Date().toISOString().split('T')[0];
        const { data: tournois, error } = await supabasePublic
            .from('public_tournois')
            .select('*')
            .lt('date_fin', today)
            .order('date_fin', { ascending: false });
        if (error) throw error;
        if (!tournois || tournois.length === 0) {
            resultatsList.innerHTML = `<div class="empty-message">${t('resultats.pas_resultat')}</div>`;
            return;
        }
        let html = '';
        for (const tournoi of tournois) {
            // Récupérer le classement pour ce tournoi (collectif ou individuel)
            let classement = [];
            if (tournoi.type_tournoi === 'collectif') {
                const { data: classementData } = await supabasePublic
                    .from('public_classements')
                    .select('*, public_equipes(nom_equipe)')
                    .eq('tournoi_id', tournoi.id)
                    .order('points', { ascending: false })
                    .order('difference_buts', { ascending: false });
                if (classementData) {
                    classement = classementData.map(c => ({
                        nom: c.public_equipes?.nom_equipe || '?',
                        points: c.points
                    }));
                }
            } else {
                const { data: classementData } = await supabasePublic
                    .from('public_classements_individuels')
                    .select('*, public_participants_individuels(nom_complet)')
                    .eq('tournoi_id', tournoi.id)
                    .order('points', { ascending: false })
                    .order('difference', { ascending: false });
                if (classementData) {
                    classement = classementData.map(c => ({
                        nom: c.public_participants_individuels?.nom_complet || '?',
                        points: c.points
                    }));
                }
            }
            const premier = classement[0] || null;
            const deuxieme = classement[1] || null;
            const troisieme = classement[2] || null;
            const reste = classement.slice(3);
            html += `
                <div class="tournoi-card">
                    <div class="tournoi-header">
                        <h2>${escapeHtml(tournoi.titre)}</h2>
                        <div class="tournoi-date"><i class="fas fa-calendar-alt"></i> ${formatDate(tournoi.date_debut)} - ${formatDate(tournoi.date_fin)}</div>
                    </div>
                    ${classement.length > 0 ? `
                    <div class="podium">
                        ${deuxieme ? `<div class="podium-item podium-2">
                            <div class="place">🥈</div>
                            <div class="nom">${escapeHtml(deuxieme.nom)}</div>
                            <div class="club">${deuxieme.points} pts</div>
                        </div>` : ''}
                        ${premier ? `<div class="podium-item podium-1">
                            <div class="place">🥇</div>
                            <div class="nom">${escapeHtml(premier.nom)}</div>
                            <div class="club">${premier.points} pts</div>
                        </div>` : ''}
                        ${troisieme ? `<div class="podium-item podium-3">
                            <div class="place">🥉</div>
                            <div class="nom">${escapeHtml(troisieme.nom)}</div>
                            <div class="club">${troisieme.points} pts</div>
                        </div>` : ''}
                    </div>
                    ${reste.length > 0 ? `
                    <div class="classement-complet">
                        <h3><i class="fas fa-list-ol"></i> ${t('resultats.classement')}</h3>
                        <ul>
                            ${reste.map((item, idx) => `<li><span>${idx+4}. ${escapeHtml(item.nom)}</span><span>${item.points} pts</span></li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ` : `<div class="empty-message" style="padding:20px;">${t('resultats.pas_resultat')}</div>`}
                </div>
            `;
        }
        resultatsList.innerHTML = html;
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load'), 'error');
        resultatsList.innerHTML = `<div class="empty-message">${t('toast.error_load')}</div>`;
    } finally {
        hideLoader();
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US');
}

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

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    chargerResultats();
});