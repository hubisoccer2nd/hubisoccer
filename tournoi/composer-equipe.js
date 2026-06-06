// ========== DEBUT : tournoi/composer-equipe.js (version multi‑formats, design épuré) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   TRADUCTIONS
   ============================================================ */
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'composer.logout': 'Déconnexion',
        'composer.dashboard': 'Tableau de bord',
        'composer.equipe': 'Mon équipe',
        'composer.matchs': 'Matchs',
        'composer.classement': 'Classement',
        'composer.messagerie': 'Messages',
        'composer.portefeuille': 'Portefeuille',
        'composer.title': 'Composition d\'équipe',
        'composer.select_match': 'Sélectionnez un match à composer',
        'composer.composer_btn': 'Composer',
        'composer.saved': 'Composition enregistrée avec succès',
        'composer.error': 'Erreur lors de l\'enregistrement',
        'composer.not_capitaine': 'Vous devez être capitaine pour composer l\'équipe',
        'composer.match_passe': 'Ce match est déjà terminé, vous ne pouvez pas modifier la composition',
        'composer.no_players': 'Aucun joueur dans cette équipe. Veuillez d\'abord ajouter des joueurs via "Gérer mon équipe".',
        'composer.reset': 'Réinitialiser',
        'composer.save': 'Enregistrer la composition',
        'composer.titulaires_count': '{count}/{nb} titulaires',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'composer.logout': 'Logout',
        'composer.dashboard': 'Dashboard',
        'composer.equipe': 'My team',
        'composer.matchs': 'Matches',
        'composer.classement': 'Ranking',
        'composer.messagerie': 'Messages',
        'composer.portefeuille': 'Wallet',
        'composer.title': 'Team lineup',
        'composer.select_match': 'Select a match to compose',
        'composer.composer_btn': 'Compose',
        'composer.saved': 'Lineup saved successfully',
        'composer.error': 'Error saving lineup',
        'composer.not_capitaine': 'You must be the captain to set the lineup',
        'composer.match_passe': 'This match is already finished, you cannot change the lineup',
        'composer.no_players': 'No players in this team. Please add players via "Manage my team".',
        'composer.reset': 'Reset',
        'composer.save': 'Save lineup',
        'composer.titulaires_count': '{count}/{nb} starters',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    }
};

let currentLang = localStorage.getItem('composer_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('composer_lang', lang);
        applyTranslations();
        initialiserPage();
    }
}
/* FIN TRADUCTIONS */

/* ============================================================
   SESSION
   ============================================================ */
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const userLogin = sessionStorage.getItem('tournoi_login');
const userRole = sessionStorage.getItem('tournoi_role');

if (!userId) window.location.href = 'connexion-tournoi.html';
document.getElementById('userName').textContent = userNom || userLogin;

const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');
/* FIN SESSION */

/* ============================================================
   VARIABLES GLOBALES
   ============================================================ */
let equipeId = null;
let joueurs = [];            // tous les joueurs de l'équipe (objets complets)
let titulairesIds = [];      // tableau d'IDs des joueurs titulaires
let nbTitulairesRequis = 0;  // nombre de titulaires attendus (format_equipe)
let matchData = null;
/* FIN VARIABLES */

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
   INITIALISATION
   ============================================================ */
async function initialiserPage() {
    if (userRole !== 'capitaine') {
        showToast(t('composer.not_capitaine'), 'error');
        return;
    }
    const { data: equipe, error: eqErr } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe, tournoi_id')
        .eq('capitaine_id', userId)
        .single();
    if (eqErr || !equipe) {
        showToast('Vous n\'êtes capitaine d\'aucune équipe', 'error');
        return;
    }
    equipeId = equipe.id;

    const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');
    const { data: tournoi } = await supabasePublic
        .from('public_tournois')
        .select('format_equipe')
        .eq('id', tournoiId)
        .single();
    nbTitulairesRequis = tournoi?.format_equipe || 11; // valeur par défaut 11 si non défini

    document.getElementById('nbTitulairesRequis').textContent = nbTitulairesRequis;

    if (matchId) {
        await chargerCompositionMatch(matchId);
    } else {
        await afficherProchainsMatchs();
    }
}

/* ============================================================
   AFFICHAGE LISTE DES MATCHS À VENIR
   ============================================================ */
async function afficherProchainsMatchs() {
    showLoader();
    try {
        const { data: matchs, error } = await supabasePublic
            .from('public_matchs')
            .select('id, date_match, equipe_domicile_id, equipe_exterieur_id, statut')
            .or(`equipe_domicile_id.eq.${equipeId},equipe_exterieur_id.eq.${equipeId}`)
            .eq('statut', 'a_venir')
            .order('date_match', { ascending: true });

        if (error) throw error;

        document.getElementById('selectMatchSection').style.display = 'block';
        document.getElementById('compositionSection').style.display = 'none';

        const container = document.getElementById('matchsList');
        if (!matchs || matchs.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun match à venir.</p>';
            return;
        }

        const ids = new Set();
        matchs.forEach(m => { ids.add(m.equipe_domicile_id); ids.add(m.equipe_exterieur_id); });
        const { data: equipes } = await supabasePublic
            .from('public_equipes')
            .select('id, nom_equipe')
            .in('id', Array.from(ids));
        const equipeMap = {};
        equipes.forEach(e => equipeMap[e.id] = e.nom_equipe);

        let html = '';
        matchs.forEach(m => {
            const dom = equipeMap[m.equipe_domicile_id] || '?';
            const ext = equipeMap[m.equipe_exterieur_id] || '?';
            html += `
                <div class="match-item">
                    <div class="teams">${escapeHtml(dom)} vs ${escapeHtml(ext)}</div>
                    <div class="date">${new Date(m.date_match).toLocaleDateString()}</div>
                    <a href="composer-equipe.html?id=${m.id}" class="btn-composer">${t('composer.composer_btn')}</a>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
    } finally {
        hideLoader();
    }
}

/* ============================================================
   CHARGEMENT COMPOSITION POUR UN MATCH DONNÉ
   ============================================================ */
async function chargerCompositionMatch(idMatch) {
    showLoader();
    try {
        const { data: match, error: matchErr } = await supabasePublic
            .from('public_matchs')
            .select('*, equipe_domicile:equipe_domicile_id (id, nom_equipe), equipe_exterieur:equipe_exterieur_id (id, nom_equipe)')
            .eq('id', idMatch)
            .single();
        if (matchErr || !match) { showToast('Match non trouvé', 'error'); return; }
        if (match.statut === 'termine') { showToast(t('composer.match_passe'), 'warning'); return; }
        if (match.equipe_domicile_id !== equipeId && match.equipe_exterieur_id !== equipeId) {
            showToast('Votre équipe ne participe pas à ce match', 'error');
            return;
        }
        matchData = match;

        document.getElementById('matchInfo').innerHTML = `
            <h2>${escapeHtml(match.equipe_domicile?.nom_equipe)} vs ${escapeHtml(match.equipe_exterieur?.nom_equipe)}</h2>
            <p>Date : ${new Date(match.date_match).toLocaleDateString()} | Format : ${nbTitulairesRequis} joueurs</p>
        `;

        const { data: sportifs } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('numero_maillot', { ascending: true });
        joueurs = sportifs || [];

        // Charger les compositions existantes
        const { data: comps } = await supabasePublic
            .from('public_compositions_match')
            .select('joueur_id, titulaire')
            .eq('match_id', idMatch)
            .eq('equipe_id', equipeId);
        titulairesIds = (comps || []).filter(c => c.titulaire).map(c => c.joueur_id);
        // Limiter au nombre requis
        titulairesIds = titulairesIds.slice(0, nbTitulairesRequis);

        document.getElementById('selectMatchSection').style.display = 'none';
        document.getElementById('compositionSection').style.display = 'block';
        renderComposition();
    } catch (err) {
        console.error(err);
        showToast(t('composer.error'), 'error');
    } finally {
        hideLoader();
    }
}

/* ============================================================
   RENDU DES LISTES (TITULAIRES / REMPLAÇANTS)
   ============================================================ */
function renderComposition() {
    const titulairesList = document.getElementById('titulairesList');
    const remplacantsList = document.getElementById('remplacantsList');

    // Joueurs titulaires (ceux dont l'ID est dans titulairesIds)
    const titulaires = joueurs.filter(j => titulairesIds.includes(j.id));
    // Joueurs remplaçants (les autres)
    const remplacants = joueurs.filter(j => !titulairesIds.includes(j.id));

    // Rendu des titulaires
    let titulairesHTML = '';
    if (titulaires.length === 0) {
        titulairesHTML = '<p class="empty-message">Aucun titulaire. Faites glisser des joueurs ici.</p>';
    } else {
        titulaires.forEach(j => {
            titulairesHTML += `
                <div class="joueur-card titulaire" draggable="true" data-joueur-id="${j.id}" ondragstart="drag(event, ${j.id})">
                    ${j.numero_maillot ? `<span class="joueur-numero">#${j.numero_maillot}</span>` : ''}
                    <span class="joueur-nom">${escapeHtml(j.prenom)} ${escapeHtml(j.nom)}</span>
                </div>
            `;
        });
    }
    titulairesList.innerHTML = titulairesHTML;
    titulairesList.setAttribute('data-droppable', 'true');

    // Rendu des remplaçants
    let remplacantsHTML = '';
    if (remplacants.length === 0) {
        remplacantsHTML = '<p class="empty-message">Tous les joueurs sont titulaires.</p>';
    } else {
        remplacants.forEach(j => {
            remplacantsHTML += `
                <div class="joueur-card remplacant" draggable="true" data-joueur-id="${j.id}" ondragstart="drag(event, ${j.id})">
                    ${j.numero_maillot ? `<span class="joueur-numero">#${j.numero_maillot}</span>` : ''}
                    <span class="joueur-nom">${escapeHtml(j.prenom)} ${escapeHtml(j.nom)}</span>
                </div>
            `;
        });
    }
    remplacantsList.innerHTML = remplacantsHTML;
    remplacantsList.setAttribute('data-droppable', 'true');

    // Mettre à jour le compteur
    updateCompteur();
}

function updateCompteur() {
    const count = titulairesIds.length;
    const nb = nbTitulairesRequis;
    const compteurEl = document.getElementById('titulairesCount');
    if (compteurEl) {
        compteurEl.textContent = t('composer.titulaires_count', { count, nb });
        compteurEl.className = count === nb ? 'compteur ok' : 'compteur pas-ok';
    }
    const saveBtn = document.getElementById('saveCompositionBtn');
    if (saveBtn) {
        saveBtn.disabled = (count !== nb);
    }
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
function allowDrop(ev) { ev.preventDefault(); }

function drag(ev, joueurId) {
    ev.dataTransfer.setData("text/plain", joueurId);
}

// Rendre les zones de dépôt fonctionnelles
document.addEventListener('DOMContentLoaded', () => {
    const titulairesZone = document.getElementById('titulairesList');
    const remplacantsZone = document.getElementById('remplacantsList');

    if (titulairesZone) {
        titulairesZone.addEventListener('dragover', allowDrop);
        titulairesZone.addEventListener('drop', (ev) => {
            ev.preventDefault();
            const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
            if (!joueurId) return;
            // Ajouter aux titulaires si pas déjà présent et si le quota n'est pas atteint
            if (!titulairesIds.includes(joueurId)) {
                if (titulairesIds.length < nbTitulairesRequis) {
                    titulairesIds.push(joueurId);
                } else {
                    showToast(`Vous ne pouvez avoir que ${nbTitulairesRequis} titulaires.`, 'warning');
                    return;
                }
            }
            renderComposition();
        });
    }

    if (remplacantsZone) {
        remplacantsZone.addEventListener('dragover', allowDrop);
        remplacantsZone.addEventListener('drop', (ev) => {
            ev.preventDefault();
            const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
            if (!joueurId) return;
            // Retirer des titulaires (le joueur devient remplaçant)
            titulairesIds = titulairesIds.filter(id => id !== joueurId);
            renderComposition();
        });
    }
});

/* ============================================================
   RÉINITIALISER
   ============================================================ */
document.getElementById('resetCompositionBtn').addEventListener('click', () => {
    titulairesIds = [];
    renderComposition();
    showToast('Composition réinitialisée', 'info');
});

/* ============================================================
   SAUVEGARDE
   ============================================================ */
document.getElementById('saveCompositionBtn').addEventListener('click', async () => {
    if (titulairesIds.length !== nbTitulairesRequis) {
        showToast(`Vous devez avoir exactement ${nbTitulairesRequis} titulaires.`, 'warning');
        return;
    }
    if (!equipeId || !matchId) return;
    showLoader();
    try {
        // Supprimer les anciennes compositions
        const { error: delErr } = await supabasePublic
            .from('public_compositions_match')
            .delete()
            .eq('match_id', matchId)
            .eq('equipe_id', equipeId);
        if (delErr) throw delErr;

        // Préparer les nouvelles compositions
        const compositions = [];
        joueurs.forEach(j => {
            compositions.push({
                match_id: parseInt(matchId),
                equipe_id: equipeId,
                joueur_id: j.id,
                titulaire: titulairesIds.includes(j.id),
                poste: j.role_sportif || null
            });
        });

        if (compositions.length) {
            const { error: insErr } = await supabasePublic
                .from('public_compositions_match')
                .insert(compositions);
            if (insErr) throw insErr;
        }
        showToast(t('composer.saved'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('composer.error'), 'error');
    } finally {
        hideLoader();
    }
});

/* ============================================================
   DÉCONNEXION
   ============================================================ */
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

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

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    initialiserPage();
});
// ========== FIN : tournoi/composer-equipe.js ==========