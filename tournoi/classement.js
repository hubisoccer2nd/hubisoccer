// ========== DEBUT : tournoi/classement.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   TRADUCTIONS
   ============================================================ */
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'classement.logout': 'Déconnexion',
        'classement.dashboard': 'Tableau de bord',
        'classement.equipe': 'Mon équipe',
        'classement.matchs': 'Matchs',
        'classement.title': 'Classement',
        'classement.messagerie': 'Messages',
        'classement.portefeuille': 'Portefeuille',
        'classement.rank': 'Rang',
        'classement.equipe_nom': 'Équipe',
        'classement.participant': 'Participant',
        'classement.points': 'Pts',
        'classement.matchs_joues': 'MJ',
        'classement.victoires': 'V',
        'classement.nuls': 'N',
        'classement.defaites': 'D',
        'classement.buts_pour': 'BP',
        'classement.buts_contre': 'BC',
        'classement.diff': 'Diff',
        'classement.sets_pour': 'SP',
        'classement.sets_contre': 'SC',
        'classement.aucune': 'Aucun classement disponible pour ce tournoi.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.chargement_erreur': 'Erreur chargement du classement',
        'toast.non_connecte': 'Vous devez être connecté'
    },
    en: {
        'loader.message': 'Loading...',
        'classement.logout': 'Logout',
        'classement.dashboard': 'Dashboard',
        'classement.equipe': 'My team',
        'classement.matchs': 'Matches',
        'classement.title': 'Ranking',
        'classement.messagerie': 'Messages',
        'classement.portefeuille': 'Wallet',
        'classement.rank': 'Rank',
        'classement.equipe_nom': 'Team',
        'classement.participant': 'Participant',
        'classement.points': 'Pts',
        'classement.matchs_joues': 'MP',
        'classement.victoires': 'W',
        'classement.nuls': 'D',
        'classement.defaites': 'L',
        'classement.buts_pour': 'GF',
        'classement.buts_contre': 'GA',
        'classement.diff': 'GD',
        'classement.sets_pour': 'SW',
        'classement.sets_contre': 'SL',
        'classement.aucune': 'No ranking available for this tournament.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.chargement_erreur': 'Error loading ranking',
        'toast.non_connecte': 'You must be logged in'
    }
};

let currentLang = localStorage.getItem('classement_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('classement_lang', lang);
        applyTranslations();
        chargerClassement();
    }
}
/* FIN TRADUCTIONS */

/* ============================================================
   GESTION SESSION
   ============================================================ */
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const userLogin = sessionStorage.getItem('tournoi_login');
const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');
const userRole = sessionStorage.getItem('tournoi_role');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || userLogin;

let typeTournoi = sessionStorage.getItem('tournoi_type') || null;
let monIdentifiant = null;  // equipe_id ou participant_id
let equipeId = sessionStorage.getItem('tournoi_equipe_id') || null;
let participantId = sessionStorage.getItem('tournoi_participant_id') || null;

// Affichage conditionnel du lien "Mon équipe"
const gererEquipeLink = document.getElementById('gererEquipeLink');
if (equipeId) {
    gererEquipeLink.style.display = 'inline-block';
} else {
    gererEquipeLink.style.display = 'none';
}
/* FIN SESSION */

/* ============================================================
   UTILITAIRES
   ============================================================ */
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

function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }
/* FIN UTILITAIRES */

/* ============================================================
   DÉTERMINATION TYPE TOURNOI & IDENTIFIANT
   ============================================================ */
async function getTypeEtIdentifiant() {
    if (typeTournoi && (equipeId || participantId)) {
        monIdentifiant = equipeId || participantId;
        return;
    }

    const { data: tournoi, error: tErr } = await supabasePublic
        .from('public_tournois')
        .select('type_tournoi')
        .eq('id', tournoiId)
        .single();
    if (tErr) { console.error(tErr); return; }
    typeTournoi = tournoi.type_tournoi;
    sessionStorage.setItem('tournoi_type', typeTournoi);

    if (typeTournoi === 'collectif') {
        let { data: equipe, error: eqErr } = await supabasePublic
            .from('public_equipes')
            .select('id')
            .eq('capitaine_id', userId)
            .single();
        if (eqErr && eqErr.code !== 'PGRST116') console.error(eqErr);
        if (equipe) {
            equipeId = equipe.id;
            sessionStorage.setItem('tournoi_equipe_id', equipeId);
            monIdentifiant = equipeId;
            gererEquipeLink.style.display = 'inline-block';
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
            sessionStorage.setItem('tournoi_equipe_id', equipeId);
            monIdentifiant = equipeId;
            gererEquipeLink.style.display = 'inline-block';
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
                sessionStorage.setItem('tournoi_participant_id', participantId);
                monIdentifiant = participantId;
            }
        }
        gererEquipeLink.style.display = 'none';
    }
}
/* FIN DÉTERMINATION */

/* ============================================================
   CHARGEMENT DU CLASSEMENT
   ============================================================ */
async function chargerClassement() {
    if (!tournoiId) return;
    showLoader();
    try {
        await getTypeEtIdentifiant();
        if (typeTournoi === 'collectif') {
            await chargerClassementCollectif();
        } else {
            await chargerClassementIndividuel();
        }
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

async function chargerClassementCollectif() {
    const { data, error } = await supabasePublic
        .from('public_classements')
        .select('*, public_equipes(nom_equipe)')
        .eq('tournoi_id', tournoiId)
        .order('points', { ascending: false })
        .order('difference_buts', { ascending: false })
        .order('buts_pour', { ascending: false });
    if (error) throw error;
    renderClassementCollectif(data || []);
}

function renderClassementCollectif(classement) {
    const container = document.getElementById('classementTable');
    if (!classement.length) {
        container.innerHTML = `<div class="empty-message">${t('classement.aucune')}</div>`;
        return;
    }
    let html = `
        <div class="classement-table">
            <table>
                <thead>
                    <tr>
                        <th>${t('classement.rank')}</th>
                        <th>${t('classement.equipe_nom')}</th>
                        <th>${t('classement.points')}</th>
                        <th>${t('classement.matchs_joues')}</th>
                        <th>${t('classement.victoires')}</th>
                        <th>${t('classement.nuls')}</th>
                        <th>${t('classement.defaites')}</th>
                        <th>${t('classement.buts_pour')}</th>
                        <th>${t('classement.buts_contre')}</th>
                        <th>${t('classement.diff')}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    for (let i = 0; i < classement.length; i++) {
        const c = classement[i];
        const estMonEquipe = (c.equipe_id === monIdentifiant);
        const rowClass = estMonEquipe ? 'my-team' : '';
        html += `
            <tr class="${rowClass}">
                <td>${i+1}</td>
                <td class="equipe-col">${escapeHtml(c.public_equipes?.nom_equipe || '?')}</td>
                <td><strong>${c.points}</strong></td>
                <td>${c.matchs_joues}</td>
                <td>${c.victoires}</td>
                <td>${c.nuls}</td>
                <td>${c.defaites}</td>
                <td>${c.buts_pour}</td>
                <td>${c.buts_contre}</td>
                <td>${c.difference_buts}</td>
            </tr>
        `;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function chargerClassementIndividuel() {
    const { data, error } = await supabasePublic
        .from('public_classements_individuels')
        .select('*, public_participants_individuels(nom_complet)')
        .eq('tournoi_id', tournoiId)
        .order('points', { ascending: false })
        .order('difference', { ascending: false })
        .order('buts_pour', { ascending: false });
    if (error) throw error;
    renderClassementIndividuel(data || []);
}

function renderClassementIndividuel(classement) {
    const container = document.getElementById('classementTable');
    if (!classement.length) {
        container.innerHTML = `<div class="empty-message">${t('classement.aucune')}</div>`;
        return;
    }
    let html = `
        <div class="classement-table">
            <table>
                <thead>
                    <tr>
                        <th>${t('classement.rank')}</th>
                        <th>${t('classement.participant')}</th>
                        <th>${t('classement.points')}</th>
                        <th>${t('classement.matchs_joues')}</th>
                        <th>${t('classement.victoires')}</th>
                        <th>${t('classement.nuls')}</th>
                        <th>${t('classement.defaites')}</th>
                        <th>${t('classement.buts_pour')}</th>
                        <th>${t('classement.buts_contre')}</th>
                        <th>${t('classement.diff')}</th>
                        <th>${t('classement.sets_pour')}</th>
                        <th>${t('classement.sets_contre')}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    for (let i = 0; i < classement.length; i++) {
        const c = classement[i];
        const estMoi = (c.participant_id === monIdentifiant);
        const rowClass = estMoi ? 'my-team' : '';
        html += `
            <tr class="${rowClass}">
                <td>${i+1}</td>
                <td>${escapeHtml(c.public_participants_individuels?.nom_complet || '?')}</td>
                <td><strong>${c.points}</strong></td>
                <td>${c.matchs_joues}</td>
                <td>${c.victoires}</td>
                <td>${c.nuls}</td>
                <td>${c.defaites}</td>
                <td>${c.buts_pour}</td>
                <td>${c.buts_contre}</td>
                <td>${c.difference}</td>
                <td>${c.sets_pour || 0}</td>
                <td>${c.sets_contre || 0}</td>
            </tr>
        `;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
}
/* FIN CLASSEMENT */

/* ============================================================
   DÉCONNEXION
   ============================================================ */
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});
/* FIN DÉCONNEXION */

/* ============================================================
   MENU MOBILE & LANGUE
   ============================================================ */
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
/* FIN MENU & LANGUE */

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await getTypeEtIdentifiant();
    await chargerClassement();
});
/* FIN INITIALISATION */
// ========== FIN : tournoi/classement.js ==========