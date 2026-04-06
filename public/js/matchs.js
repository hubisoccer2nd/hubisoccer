// ========== MATCHS.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'matchs.logout': 'Déconnexion',
        'matchs.dashboard': 'Tableau de bord',
        'matchs.equipe': 'Mon équipe',
        'matchs.title': 'Matchs',
        'matchs.classement': 'Classement',
        'matchs.messagerie': 'Messages',
        'matchs.portefeuille': 'Portefeuille',
        'matchs.filtre.all': 'Tous',
        'matchs.filtre.a_venir': 'À venir',
        'matchs.filtre.termine': 'Terminés',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.chargement_erreur': 'Erreur chargement des matchs',
        'toast.non_connecte': 'Vous devez être connecté'
    },
    en: {
        'loader.message': 'Loading...',
        'matchs.logout': 'Logout',
        'matchs.dashboard': 'Dashboard',
        'matchs.equipe': 'My team',
        'matchs.title': 'Matches',
        'matchs.classement': 'Ranking',
        'matchs.messagerie': 'Messages',
        'matchs.portefeuille': 'Wallet',
        'matchs.filtre.all': 'All',
        'matchs.filtre.a_venir': 'Upcoming',
        'matchs.filtre.termine': 'Finished',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.chargement_erreur': 'Error loading matches',
        'toast.non_connecte': 'You must be logged in'
    }
};

let currentLang = localStorage.getItem('matchs_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('matchs_lang', lang);
        applyTranslations();
        chargerMatchs();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');
const userRole = sessionStorage.getItem('tournoi_role');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== VARIABLES GLOBALES ==========
let typeTournoi = null;   // 'collectif' ou 'individuel'

// ========== DÉTERMINER LE TYPE DE TOURNOI ==========
async function getTypeTournoi() {
    const { data, error } = await supabasePublic
        .from('public_tournois')
        .select('type_tournoi')
        .eq('id', tournoiId)
        .single();
    if (error) { console.error(error); return null; }
    typeTournoi = data.type_tournoi;
    // Cacher le lien "Mon équipe" pour les individuels
    const equipeLink = document.getElementById('gererEquipeLink');
    if (equipeLink) {
        if (typeTournoi === 'individuel') equipeLink.style.display = 'none';
        else equipeLink.style.display = 'inline-block';
    }
    return typeTournoi;
}

// ========== CHARGEMENT DES MATCHS ==========
async function chargerMatchs() {
    if (!tournoiId) return;
    showLoader();
    try {
        if (typeTournoi === 'collectif') {
            await chargerMatchsCollectif();
        } else {
            await chargerMatchsIndividuel();
        }
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

async function chargerMatchsCollectif() {
    let query = supabasePublic
        .from('public_matchs')
        .select('*, equipe_domicile:equipe_domicile_id (nom_equipe), equipe_exterieur:equipe_exterieur_id (nom_equipe)')
        .eq('tournoi_id', tournoiId)
        .order('date_match', { ascending: true });
    const filtre = document.getElementById('filtreStatut').value;
    if (filtre !== 'all') query = query.eq('statut', filtre);
    const { data, error } = await query;
    if (error) throw error;
    renderMatchsCollectif(data || []);
}

async function chargerMatchsIndividuel() {
    let query = supabasePublic
        .from('public_matchs_individuels')
        .select('*, participant_domicile:participant_domicile_id (nom_complet), participant_exterieur:participant_exterieur_id (nom_complet)')
        .eq('tournoi_id', tournoiId)
        .order('date_match', { ascending: true });
    const filtre = document.getElementById('filtreStatut').value;
    if (filtre !== 'all') query = query.eq('statut', filtre);
    const { data, error } = await query;
    if (error) throw error;
    renderMatchsIndividuel(data || []);
}

function renderMatchsCollectif(matchs) {
    const container = document.getElementById('matchsList');
    if (!matchs.length) {
        container.innerHTML = '<div class="empty-message">' + t('matchs.filtre.all') === 'all' ? 'Aucun match.' : 'Aucun match pour ce filtre.' + '</div>';
        return;
    }
    let html = '';
    for (const m of matchs) {
        const statutClass = m.statut === 'a_venir' ? 'status-a_venir' : 'status-termine';
        const statutLabel = m.statut === 'a_venir' ? t('matchs.filtre.a_venir') : t('matchs.filtre.termine');
        const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
        const dateMatch = new Date(m.date_match).toLocaleDateString();
        html += `
            <div class="match-card">
                <div class="match-info">
                    <div class="match-teams">
                        ${escapeHtml(m.equipe_domicile?.nom_equipe || '?')} <i class="fas fa-vs"></i> ${escapeHtml(m.equipe_exterieur?.nom_equipe || '?')}
                    </div>
                    <div class="match-date">${dateMatch}</div>
                </div>
                <div class="match-score">${score}</div>
                <div class="match-status ${statutClass}">${statutLabel}</div>
                <div class="match-actions">
                    <a href="match-details.html?id=${m.id}" class="btn-details">Détails</a>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderMatchsIndividuel(matchs) {
    const container = document.getElementById('matchsList');
    if (!matchs.length) {
        container.innerHTML = '<div class="empty-message">' + t('matchs.filtre.all') === 'all' ? 'Aucun match.' : 'Aucun match pour ce filtre.' + '</div>';
        return;
    }
    let html = '';
    for (const m of matchs) {
        const statutClass = m.statut === 'a_venir' ? 'status-a_venir' : 'status-termine';
        const statutLabel = m.statut === 'a_venir' ? t('matchs.filtre.a_venir') : t('matchs.filtre.termine');
        const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
        const dateMatch = new Date(m.date_match).toLocaleDateString();
        html += `
            <div class="match-card">
                <div class="match-info">
                    <div class="match-teams">
                        ${escapeHtml(m.participant_domicile?.nom_complet || '?')} <i class="fas fa-vs"></i> ${escapeHtml(m.participant_exterieur?.nom_complet || '?')}
                    </div>
                    <div class="match-date">${dateMatch}</div>
                </div>
                <div class="match-score">${score}</div>
                <div class="match-status ${statutClass}">${statutLabel}</div>
                <div class="match-actions">
                    <a href="match-details.html?id=${m.id}" class="btn-details">Détails</a>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ========== FILTRES ==========
document.getElementById('filtreStatut').addEventListener('change', () => {
    chargerMatchs();
});

// ========== DÉCONNEXION ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await getTypeTournoi();
    await chargerMatchs();
});