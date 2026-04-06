// ========== DASHBOARD-TOURNOI.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'dashboard.logout': 'Déconnexion',
        'dashboard.title': 'Tableau de bord',
        'dashboard.equipe': 'Mon équipe',
        'dashboard.matchs': 'Matchs',
        'dashboard.classement': 'Classement',
        'dashboard.messagerie': 'Messages',
        'dashboard.portefeuille': 'Portefeuille',
        'dashboard.welcome': 'Tableau de bord',
        'dashboard.prochains_matchs': 'Prochains matchs',
        'dashboard.derniers_resultats': 'Derniers résultats',
        'dashboard.live.title': 'Live du match',
        'dashboard.pas_match': 'Aucun match à venir.',
        'dashboard.pas_resultat': 'Aucun résultat récent.',
        'dashboard.pas_classement': 'Classement non disponible.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.non_connecte': 'Vous devez être connecté.',
        'toast.erreur_chargement': 'Erreur chargement des données.'
    },
    en: {
        'loader.message': 'Loading...',
        'dashboard.logout': 'Logout',
        'dashboard.title': 'Dashboard',
        'dashboard.equipe': 'My team',
        'dashboard.matchs': 'Matches',
        'dashboard.classement': 'Ranking',
        'dashboard.messagerie': 'Messages',
        'dashboard.portefeuille': 'Wallet',
        'dashboard.welcome': 'Dashboard',
        'dashboard.prochains_matchs': 'Upcoming matches',
        'dashboard.derniers_resultats': 'Recent results',
        'dashboard.live.title': 'Live match',
        'dashboard.pas_match': 'No upcoming matches.',
        'dashboard.pas_resultat': 'No recent results.',
        'dashboard.pas_classement': 'Ranking not available.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.non_connecte': 'You must be logged in.',
        'toast.erreur_chargement': 'Error loading data.'
    }
};

let currentLang = localStorage.getItem('dashboard_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('dashboard_lang', lang);
        applyTranslations();
        chargerDonnees();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userLogin = sessionStorage.getItem('tournoi_login');
const userRole = sessionStorage.getItem('tournoi_role');
const userNom = sessionStorage.getItem('tournoi_nom');
const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}

document.getElementById('userName').textContent = userNom || userLogin;

// ========== VARIABLES GLOBALES ==========
let equipeId = null;
let participantId = null;
let typeTournoi = null;
let monIdentifiant = null;

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

// ========== DÉTERMINER LE TYPE DE TOURNOI ET L'IDENTIFIANT ==========
async function getTypeEtIdentifiant() {
    const { data: tournoi, error: tErr } = await supabasePublic
        .from('public_tournois')
        .select('type_tournoi')
        .eq('id', tournoiId)
        .single();
    if (tErr) { console.error(tErr); return; }
    typeTournoi = tournoi.type_tournoi;

    if (typeTournoi === 'collectif') {
        let { data: equipe, error: eqErr } = await supabasePublic
            .from('public_equipes')
            .select('id')
            .eq('capitaine_id', userId)
            .single();
        if (eqErr && eqErr.code !== 'PGRST116') console.error(eqErr);
        if (equipe) {
            equipeId = equipe.id;
            monIdentifiant = equipeId;
            const equipeLink = document.getElementById('gererEquipeLink');
            if (equipeLink) equipeLink.style.display = 'inline-block';
            return;
        }
        const { data: user, error: uErr } = await supabasePublic
            .from('public_utilisateurs_tournoi')
            .select('equipe_id')
            .eq('id', userId)
            .single();
        if (uErr && uErr.code !== 'PGRST116') console.error(uErr);
        if (user && user.equipe_id) {
            equipeId = user.equipe_id;
            monIdentifiant = equipeId;
            const equipeLink = document.getElementById('gererEquipeLink');
            if (equipeLink) equipeLink.style.display = 'none';
            return;
        }
    } else {
        const { data: user, error: uErr } = await supabasePublic
            .from('public_utilisateurs_tournoi')
            .select('inscription_id')
            .eq('id', userId)
            .single();
        if (uErr) { console.error(uErr); return; }
        if (user && user.inscription_id) {
            const { data: participant, error: pErr } = await supabasePublic
                .from('public_participants_individuels')
                .select('id')
                .eq('inscription_id', user.inscription_id)
                .single();
            if (pErr && pErr.code !== 'PGRST116') console.error(pErr);
            if (participant) {
                participantId = participant.id;
                monIdentifiant = participantId;
            }
        }
        const equipeLink = document.getElementById('gererEquipeLink');
        if (equipeLink) equipeLink.style.display = 'none';
        document.getElementById('prochainsTitle').textContent = t('dashboard.prochains_matchs');
    }
}

// ========== CHARGEMENT DES DONNÉES ==========
async function chargerDonnees() {
    showLoader();
    try {
        const { data: tournoi, error: errTournoi } = await supabasePublic
            .from('public_tournois')
            .select('titre, sport, ville, quartier, date_debut, date_fin, type_tournoi')
            .eq('id', tournoiId)
            .single();
        if (!errTournoi && tournoi) {
            document.getElementById('tournoiInfo').innerHTML = `
                <h2>${escapeHtml(tournoi.titre)}</h2>
                <p><strong>Sport :</strong> ${escapeHtml(tournoi.sport)} | <strong>Type :</strong> ${tournoi.type_tournoi === 'collectif' ? 'Collectif' : 'Individuel'} | <strong>Lieu :</strong> ${escapeHtml(tournoi.ville)}${tournoi.quartier ? ' - ' + escapeHtml(tournoi.quartier) : ''}</p>
                <p><strong>Dates :</strong> ${new Date(tournoi.date_debut).toLocaleDateString()} - ${new Date(tournoi.date_fin).toLocaleDateString()}</p>
            `;
        }

        if (!monIdentifiant) {
            document.getElementById('prochainsMatchs').innerHTML = '<p class="empty-message">' + t('dashboard.pas_match') + '</p>';
            document.getElementById('derniersResultats').innerHTML = '<p class="empty-message">' + t('dashboard.pas_resultat') + '</p>';
            document.getElementById('classementList').innerHTML = '<p class="empty-message">' + t('dashboard.pas_classement') + '</p>';
            hideLoader();
            return;
        }

        if (typeTournoi === 'collectif') {
            await chargerMatchsCollectif();
            await chargerClassementCollectif();
            await chargerLiveCollectif();
        } else {
            await chargerMatchsIndividuel();
            await chargerClassementIndividuel();
            await chargerLiveIndividuel();
        }
    } catch (err) {
        console.error(err);
        showToast(t('toast.erreur_chargement'), 'error');
    } finally {
        hideLoader();
    }
}

// ========== COLLECTIF ==========
async function chargerMatchsCollectif() {
    const { data: aVenir, error: err1 } = await supabasePublic
        .from('public_matchs')
        .select('id, date_match, equipe_domicile_id, equipe_exterieur_id, score_domicile, score_exterieur, statut')
        .or(`equipe_domicile_id.eq.${monIdentifiant},equipe_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'a_venir')
        .order('date_match', { ascending: true })
        .limit(5);
    if (!err1) renderMatchsCollectif(aVenir, monIdentifiant, 'prochainsMatchs', true);
    else console.error(err1);

    const { data: termines, error: err2 } = await supabasePublic
        .from('public_matchs')
        .select('id, date_match, equipe_domicile_id, equipe_exterieur_id, score_domicile, score_exterieur, statut')
        .or(`equipe_domicile_id.eq.${monIdentifiant},equipe_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'termine')
        .order('date_match', { ascending: false })
        .limit(5);
    if (!err2) renderMatchsCollectif(termines, monIdentifiant, 'derniersResultats', false);
    else console.error(err2);
}

async function renderMatchsCollectif(matchs, equipeId, containerId, isUpcoming) {
    const container = document.getElementById(containerId);
    if (!matchs || matchs.length === 0) {
        container.innerHTML = '<p class="empty-message">' + (isUpcoming ? t('dashboard.pas_match') : t('dashboard.pas_resultat')) + '</p>';
        return;
    }
    const equipesIds = new Set();
    matchs.forEach(m => { equipesIds.add(m.equipe_domicile_id); equipesIds.add(m.equipe_exterieur_id); });
    const { data: equipes } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe')
        .in('id', Array.from(equipesIds));
    const equipeMap = {};
    equipes.forEach(e => equipeMap[e.id] = e.nom_equipe);

    let html = '';
    for (const m of matchs) {
        const estDomicile = (m.equipe_domicile_id == equipeId);
        const adversaireId = estDomicile ? m.equipe_exterieur_id : m.equipe_domicile_id;
        const adversaire = equipeMap[adversaireId] || '?';
        const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
        const dateMatch = new Date(m.date_match).toLocaleDateString();
        html += `
            <div class="match-item">
                <div class="teams">${estDomicile ? '🏠 ' + (equipeMap[m.equipe_domicile_id] || '?') : '✈️ ' + (equipeMap[m.equipe_exterieur_id] || '?')} vs ${adversaire}</div>
                <div class="score">${score}</div>
                <div class="date">${dateMatch}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function chargerClassementCollectif() {
    const { data, error } = await supabasePublic
        .from('public_classements')
        .select('*, public_equipes(nom_equipe)')
        .eq('tournoi_id', tournoiId)
        .order('points', { ascending: false })
        .order('difference_buts', { ascending: false });
    if (error) { console.error(error); return; }
    renderClassement(data);
}

// ========== INDIVIDUEL ==========
async function chargerMatchsIndividuel() {
    const { data: aVenir, error: err1 } = await supabasePublic
        .from('public_matchs_individuels')
        .select('id, date_match, participant_domicile_id, participant_exterieur_id, score_domicile, score_exterieur, statut')
        .or(`participant_domicile_id.eq.${monIdentifiant},participant_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'a_venir')
        .order('date_match', { ascending: true })
        .limit(5);
    if (!err1) renderMatchsIndividuel(aVenir, monIdentifiant, 'prochainsMatchs', true);
    else console.error(err1);

    const { data: termines, error: err2 } = await supabasePublic
        .from('public_matchs_individuels')
        .select('id, date_match, participant_domicile_id, participant_exterieur_id, score_domicile, score_exterieur, statut')
        .or(`participant_domicile_id.eq.${monIdentifiant},participant_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'termine')
        .order('date_match', { ascending: false })
        .limit(5);
    if (!err2) renderMatchsIndividuel(termines, monIdentifiant, 'derniersResultats', false);
    else console.error(err2);
}

async function renderMatchsIndividuel(matchs, participantId, containerId, isUpcoming) {
    const container = document.getElementById(containerId);
    if (!matchs || matchs.length === 0) {
        container.innerHTML = '<p class="empty-message">' + (isUpcoming ? t('dashboard.pas_match') : t('dashboard.pas_resultat')) + '</p>';
        return;
    }
    const participantsIds = new Set();
    matchs.forEach(m => { participantsIds.add(m.participant_domicile_id); participantsIds.add(m.participant_exterieur_id); });
    const { data: participants } = await supabasePublic
        .from('public_participants_individuels')
        .select('id, nom_complet')
        .in('id', Array.from(participantsIds));
    const participantMap = {};
    participants.forEach(p => participantMap[p.id] = p.nom_complet);

    let html = '';
    for (const m of matchs) {
        const estDomicile = (m.participant_domicile_id == participantId);
        const adversaireId = estDomicile ? m.participant_exterieur_id : m.participant_domicile_id;
        const adversaire = participantMap[adversaireId] || '?';
        const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
        const dateMatch = new Date(m.date_match).toLocaleDateString();
        html += `
            <div class="match-item">
                <div class="teams">${estDomicile ? '🏠 ' + (participantMap[m.participant_domicile_id] || '?') : '✈️ ' + (participantMap[m.participant_exterieur_id] || '?')} vs ${adversaire}</div>
                <div class="score">${score}</div>
                <div class="date">${dateMatch}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function chargerClassementIndividuel() {
    const { data, error } = await supabasePublic
        .from('public_classements_individuels')
        .select('*, public_participants_individuels(nom_complet)')
        .eq('tournoi_id', tournoiId)
        .order('points', { ascending: false })
        .order('difference', { ascending: false });
    if (error) { console.error(error); return; }
    renderClassementIndividuel(data);
}

function renderClassement(classement) {
    const container = document.getElementById('classementList');
    if (!classement || classement.length === 0) {
        container.innerHTML = '<p class="empty-message">' + t('dashboard.pas_classement') + '</p>';
        return;
    }
    let html = '';
    classement.forEach((c, idx) => {
        const estMonEquipe = (c.equipe_id === equipeId);
        const rowClass = estMonEquipe ? 'my-team' : '';
        html += `
            <div class="classement-item ${rowClass}">
                <span class="rank">${idx+1}</span>
                <span class="equipe">${escapeHtml(c.public_equipes?.nom_equipe || '?')}</span>
                <span class="points">${c.points} pts</span>
                <span>${c.matchs_joues} m</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderClassementIndividuel(classement) {
    const container = document.getElementById('classementList');
    if (!classement || classement.length === 0) {
        container.innerHTML = '<p class="empty-message">' + t('dashboard.pas_classement') + '</p>';
        return;
    }
    let html = '';
    classement.forEach((c, idx) => {
        const estMoi = (c.participant_id === participantId);
        const rowClass = estMoi ? 'my-team' : '';
        html += `
            <div class="classement-item ${rowClass}">
                <span class="rank">${idx+1}</span>
                <span class="equipe">${escapeHtml(c.public_participants_individuels?.nom_complet || '?')}</span>
                <span class="points">${c.points} pts</span>
                <span>${c.matchs_joues} m</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ========== LIVE ==========
async function chargerLiveCollectif() {
    const { data: liveMatch, error } = await supabasePublic
        .from('public_matchs')
        .select('id, live_url, equipe_domicile_id, equipe_exterieur_id, score_domicile, score_exterieur')
        .or(`equipe_domicile_id.eq.${monIdentifiant},equipe_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'en_cours')
        .single();
    afficherLive(liveMatch, error);
}

async function chargerLiveIndividuel() {
    const { data: liveMatch, error } = await supabasePublic
        .from('public_matchs_individuels')
        .select('id, live_url, participant_domicile_id, participant_exterieur_id, score_domicile, score_exterieur')
        .or(`participant_domicile_id.eq.${monIdentifiant},participant_exterieur_id.eq.${monIdentifiant}`)
        .eq('statut', 'en_cours')
        .single();
    afficherLive(liveMatch, error);
}

async function afficherLive(liveMatch, error) {
    const liveSection = document.getElementById('liveSection');
    const liveContainer = document.getElementById('liveContainer');
    if (!error && liveMatch && liveMatch.live_url) {
        let adversaireNom = '';
        if (typeTournoi === 'collectif') {
            const estDomicile = (liveMatch.equipe_domicile_id == monIdentifiant);
            const adversaireId = estDomicile ? liveMatch.equipe_exterieur_id : liveMatch.equipe_domicile_id;
            const { data: adv } = await supabasePublic.from('public_equipes').select('nom_equipe').eq('id', adversaireId).single();
            adversaireNom = adv?.nom_equipe || '?';
        } else {
            const estDomicile = (liveMatch.participant_domicile_id == monIdentifiant);
            const adversaireId = estDomicile ? liveMatch.participant_exterieur_id : liveMatch.participant_domicile_id;
            const { data: adv } = await supabasePublic.from('public_participants_individuels').select('nom_complet').eq('id', adversaireId).single();
            adversaireNom = adv?.nom_complet || '?';
        }
        const score = (liveMatch.score_domicile !== null && liveMatch.score_exterieur !== null) ? `${liveMatch.score_domicile} - ${liveMatch.score_exterieur}` : '? - ?';
        liveContainer.innerHTML = `
            <h3>${adversaireNom} (${score})</h3>
            <iframe src="${liveMatch.live_url}" frameborder="0" allowfullscreen></iframe>
        `;
        liveSection.style.display = 'block';
    } else {
        liveSection.style.display = 'none';
        liveContainer.innerHTML = '';
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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await getTypeEtIdentifiant();
    await chargerDonnees();
});