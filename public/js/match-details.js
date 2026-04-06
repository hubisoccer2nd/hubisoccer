// ========== MATCH-DETAILS.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'match.logout': 'Déconnexion',
        'match.dashboard': 'Tableau de bord',
        'match.equipe': 'Mon équipe',
        'match.matchs': 'Matchs',
        'match.classement': 'Classement',
        'match.messagerie': 'Messages',
        'match.portefeuille': 'Portefeuille',
        'match.composition': 'Composition',
        'match.actions': 'Actions du match',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.chargement_erreur': 'Erreur chargement des données',
        'toast.non_connecte': 'Vous devez être connecté'
    },
    en: {
        'loader.message': 'Loading...',
        'match.logout': 'Logout',
        'match.dashboard': 'Dashboard',
        'match.equipe': 'My team',
        'match.matchs': 'Matches',
        'match.classement': 'Ranking',
        'match.messagerie': 'Messages',
        'match.portefeuille': 'Wallet',
        'match.composition': 'Lineup',
        'match.actions': 'Match actions',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.chargement_erreur': 'Error loading data',
        'toast.non_connecte': 'You must be logged in'
    }
};

let currentLang = localStorage.getItem('match_details_lang') || navigator.language.split('-')[0];
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
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('match_details_lang', lang);
        applyTranslations();
        chargerDetails();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== RÉCUPÉRATION ID MATCH ==========
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');
if (!matchId) {
    window.location.href = 'matchs.html';
}

let matchData = null;
let isCollectif = false;

// ========== CHARGEMENT DES DÉTAILS ==========
async function chargerDetails() {
    showLoader();
    try {
        // Essayer collectif
        let { data: matchCollectif, error: errColl } = await supabasePublic
            .from('public_matchs')
            .select('*, equipe_domicile:equipe_domicile_id (id, nom_equipe), equipe_exterieur:equipe_exterieur_id (id, nom_equipe)')
            .eq('id', matchId)
            .single();
        if (errColl && errColl.code !== 'PGRST116') throw errColl;
        if (matchCollectif) {
            isCollectif = true;
            matchData = matchCollectif;
        } else {
            let { data: matchIndiv, error: errInd } = await supabasePublic
                .from('public_matchs_individuels')
                .select('*, participant_domicile:participant_domicile_id (id, nom_complet), participant_exterieur:participant_exterieur_id (id, nom_complet)')
                .eq('id', matchId)
                .single();
            if (errInd && errInd.code !== 'PGRST116') throw errInd;
            if (matchIndiv) {
                isCollectif = false;
                matchData = matchIndiv;
            } else {
                throw new Error('Match non trouvé');
            }
        }
        afficherHeader();
        await afficherComposition();
        await chargerActions();
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
        document.getElementById('matchHeader').innerHTML = '<div class="error-message">Match introuvable</div>';
    } finally {
        hideLoader();
    }
}

function afficherHeader() {
    const headerDiv = document.getElementById('matchHeader');
    if (isCollectif) {
        const domicile = matchData.equipe_domicile?.nom_equipe || '?';
        const exterieur = matchData.equipe_exterieur?.nom_equipe || '?';
        const score = (matchData.score_domicile !== null && matchData.score_exterieur !== null) ? `${matchData.score_domicile} - ${matchData.score_exterieur}` : '-';
        const dateMatch = new Date(matchData.date_match).toLocaleDateString();
        headerDiv.innerHTML = `
            <h2>${escapeHtml(domicile)} vs ${escapeHtml(exterieur)}</h2>
            <div class="score">${score}</div>
            <div class="date">${dateMatch}</div>
        `;
    } else {
        const domicile = matchData.participant_domicile?.nom_complet || '?';
        const exterieur = matchData.participant_exterieur?.nom_complet || '?';
        const score = (matchData.score_domicile !== null && matchData.score_exterieur !== null) ? `${matchData.score_domicile} - ${matchData.score_exterieur}` : '-';
        const dateMatch = new Date(matchData.date_match).toLocaleDateString();
        headerDiv.innerHTML = `
            <h2>${escapeHtml(domicile)} vs ${escapeHtml(exterieur)}</h2>
            <div class="score">${score}</div>
            <div class="date">${dateMatch}</div>
        `;
    }
}

async function afficherComposition() {
    const compDiv = document.getElementById('composition');
    if (isCollectif) {
        const equipeDomicileId = matchData.equipe_domicile_id;
        const equipeExterieurId = matchData.equipe_exterieur_id;
        const { data: sportifs, error } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*, public_equipes(nom_equipe)')
            .in('equipe_id', [equipeDomicileId, equipeExterieurId])
            .order('numero_maillot', { ascending: true });
        if (error) throw error;
        const domList = sportifs.filter(s => s.equipe_id === equipeDomicileId);
        const extList = sportifs.filter(s => s.equipe_id === equipeExterieurId);
        const domicileNom = matchData.equipe_domicile?.nom_equipe || '?';
        const exterieurNom = matchData.equipe_exterieur?.nom_equipe || '?';
        compDiv.innerHTML = `
            <div class="team-composition">
                <h3>${escapeHtml(domicileNom)}</h3>
                ${domList.map(s => `<div class="joueur-item"><span>${s.numero_maillot ? `#${s.numero_maillot} ` : ''}${escapeHtml(s.prenom)} ${escapeHtml(s.nom)}</span>${s.role_sportif ? `<span class="joueur-numero">${escapeHtml(s.role_sportif)}</span>` : ''}</div>`).join('') || '<div class="empty-message">Aucun sportif enregistré</div>'}
            </div>
            <div class="team-composition">
                <h3>${escapeHtml(exterieurNom)}</h3>
                ${extList.map(s => `<div class="joueur-item"><span>${s.numero_maillot ? `#${s.numero_maillot} ` : ''}${escapeHtml(s.prenom)} ${escapeHtml(s.nom)}</span>${s.role_sportif ? `<span class="joueur-numero">${escapeHtml(s.role_sportif)}</span>` : ''}</div>`).join('') || '<div class="empty-message">Aucun sportif enregistré</div>'}
            </div>
        `;
    } else {
        compDiv.innerHTML = `
            <div class="team-composition">
                <h3>Participants</h3>
                <div class="joueur-item">${escapeHtml(matchData.participant_domicile?.nom_complet || '?')}</div>
                <div class="joueur-item">${escapeHtml(matchData.participant_exterieur?.nom_complet || '?')}</div>
            </div>
        `;
    }
}

async function chargerActions() {
    const actionsDiv = document.getElementById('actions');
    try {
        const { data, error } = await supabasePublic
            .from('public_actions_match')
            .select('*, joueur:joueur_id (nom, prenom), equipe:equipe_id (nom_equipe)')
            .eq('match_id', matchId)
            .order('minute', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
            actionsDiv.innerHTML = '<div class="empty-message">Aucune action enregistrée pour ce match.</div>';
            return;
        }
        let html = '';
        for (const a of data) {
            const joueurNom = a.joueur ? `${a.joueur.prenom} ${a.joueur.nom}` : '?';
            let equipeNom = a.equipe?.nom_equipe || '?';
            if (!isCollectif && !equipeNom) {
                if (a.equipe_id === matchData.participant_domicile_id) equipeNom = matchData.participant_domicile?.nom_complet || '?';
                else if (a.equipe_id === matchData.participant_exterieur_id) equipeNom = matchData.participant_exterieur?.nom_complet || '?';
            }
            html += `
                <div class="action-item">
                    <span class="action-minute">${a.minute}'</span>
                    <span>${escapeHtml(joueurNom)} (${escapeHtml(equipeNom)})</span>
                    <span class="action-type">${escapeHtml(a.type_action)}</span>
                </div>
            `;
        }
        actionsDiv.innerHTML = html;
    } catch (err) {
        console.error(err);
        actionsDiv.innerHTML = '<div class="empty-message">Erreur chargement des actions.</div>';
    }
}

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
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    chargerDetails();
});