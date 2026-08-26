/* ============================================================
   HubISoccer — SESSION-GT.JS
   Socle partagé du module « Gestion des tournois »
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Les 20 pages du module recréaient chacune :
     - son propre client Supabase (URL et clé dupliquées 20 fois)
     - sa propre vérification de session
     - ses propres utilitaires (toast, loader, échappement)

   Conséquences : un changement de projet Supabase demandait
   d'éditer 20 fichiers, et surtout AUCUNE règle d'accès ne
   pouvait être appliquée de façon centrale — d'où le fait que
   n'importe qui pouvait ouvrir la gestion du tournoi d'autrui
   avec un simple ?id= dans l'URL.

   IMPORTANT — RÈGLE DE COHABITATION
   Ce fichier est chargé AVANT le script de chaque page. Or deux
   scripts ne peuvent pas déclarer le même nom avec const ou let
   sans provoquer une SyntaxError qui tue la page entière.
   Tout ce qui est partagé ici est donc déclaré avec « var » ou
   posé sur « window » : une redéclaration par une page reste
   sans danger.
   ============================================================ */

'use strict';

// ============================================================
//  1) CLIENT SUPABASE UNIQUE
// ============================================================
var GT_SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
var GT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';

var supabaseClient = window.supabase.createClient(GT_SUPABASE_URL, GT_SUPABASE_ANON);
window.supabaseClient      = supabaseClient;
window.__SUPABASE_CLIENT   = supabaseClient;

// ============================================================
//  2) ÉTAT DE SESSION PARTAGÉ
// ============================================================
var currentUser = null;   // utilisateur authentifié Supabase
var userProfile = null;   // ligne de supabaseAuthPrive_profiles

window.currentUser = null;
window.userProfile = null;


// ============================================================
//  3) LOADER
// ============================================================
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'flex';
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'none';
}


// ============================================================
//  4) NOTIFICATIONS
// ------------------------------------------------------------
//  La durée était fixée à 30 000 ms dans les 23 fichiers du
//  module. Un message d'erreur restait donc affiché une demi-
//  minute, et comme plusieurs erreurs pouvaient survenir en
//  rafale, les bandeaux s'empilaient jusqu'à recouvrir la page.
//  Durée ramenée à 4 secondes, 6 pour les erreurs.
// ============================================================
function showToast(message, type, duration) {
    type = type || 'info';
    if (!duration) duration = (type === 'error') ? 6000 : 4000;

    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    const icon = document.createElement('i');
    icon.className = 'fas ' + (icons[type] || icons.info);

    const span = document.createElement('span');
    span.textContent = message;          // textContent : aucune injection possible

    const close = document.createElement('button');
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Fermer');
    close.innerHTML = '<i class="fas fa-times"></i>';
    close.addEventListener('click', () => toast.remove());

    toast.appendChild(icon);
    toast.appendChild(span);
    toast.appendChild(close);
    container.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
}


// ============================================================
//  5) ÉCHAPPEMENT
// ------------------------------------------------------------
//  L'ancien escapeHtml n'échappait ni les guillemets ni les
//  apostrophes. Or le module concatène des identifiants dans des
//  attributs onclick :
//      onclick="deleteTeam(\'' + t.id + '\')"
//  Une apostrophe dans la valeur cassait le HTML de tout le bloc.
// ============================================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getInitials(name) {
    if (!name) return '?';
    return String(name).trim().split(/\s+/).slice(0, 2)
        .map(w => w.charAt(0).toUpperCase()).join('');
}


// ============================================================
//  6) PARAMÈTRES D'URL — NOM UNIFIÉ
// ------------------------------------------------------------
//  Le module utilisait trois noms différents pour désigner la
//  même chose :
//      manage-tournament -> ?id=
//      match-details     -> ?id=
//      match-report      -> ?match_id=
//      payment           -> ?tournament_id=
//
//  Résultat : on arrivait sur la page de rapport depuis la fiche
//  du match, elle cherchait match_id, ne le trouvait pas, et
//  affichait « Aucun match spécifié » — l'erreur systématique.
//
//  getParam accepte plusieurs noms et renvoie le premier trouvé.
//  Les anciens liens continuent donc de fonctionner.
// ============================================================
function getParam() {
    const p = new URLSearchParams(window.location.search);
    for (let i = 0; i < arguments.length; i++) {
        const v = p.get(arguments[i]);
        if (v) return v;
    }
    return null;
}

function getTournamentId() {
    return getParam('tournament_id', 'tournoi', 'id');
}

function getMatchId() {
    return getParam('match_id', 'match', 'id');
}

function getTeamId() {
    return getParam('team_id', 'equipe', 'id');
}


// ============================================================
//  7) SESSION ET PROFIL
// ============================================================
async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    const session = data ? data.session : null;

    if (!session) {
        const retour = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = '../../authprive/users/login.html?next=' + retour;
        return null;
    }

    currentUser = session.user;
    window.currentUser = currentUser;
    return currentUser;
}

async function loadProfile() {
    if (!currentUser) return null;

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();

    if (error || !data) {
        showToast('Profil introuvable. Reconnectez-vous.', 'error');
        return null;
    }

    userProfile = data;
    window.userProfile = userProfile;
    return userProfile;
}


// ============================================================
//  8) CONTRÔLE D'ACCÈS AUX TOURNOIS
// ------------------------------------------------------------
//  LE POINT CENTRAL DE CE SOCLE.
//
//  Avant : manage-tournament.html?id=<n'importe quel tournoi>
//  ouvrait le panneau de gestion complet — inscriptions, équipes,
//  matchs, rapports, dotations — de n'importe quel organisateur.
//  Aucune vérification, et les RLS étant désactivés en
//  développement, la base ne s'y opposait pas non plus.
//
//  Trois niveaux de relation à un tournoi :
//      'owner'       organisateur : tous les droits
//      'participant' inscrit : voit ce qui le concerne
//      'public'      simple visiteur : données publiques
// ============================================================

/**
 * Charge un tournoi et détermine la relation de l'utilisateur
 * courant avec lui. Ne redirige pas : renvoie le contexte.
 */
async function loadTournamentContext(tournamentId) {
    if (!tournamentId) return { tournament: null, access: 'none' };

    const { data: t, error } = await supabaseClient
        .from('supabaseAuthPrive_gt_tournaments')
        .select('*, sport:supabaseAuthPrive_gt_sports(id, name), type:supabaseAuthPrive_gt_types(id, name, label)')
        .eq('id', tournamentId)
        .maybeSingle();

    if (error || !t) return { tournament: null, access: 'none' };

    // Organisateur ?
    // created_by (uuid) est la SEULE colonne de proprietaire de la
    // table gt_tournaments — verifie sur le schema reel de la base.
    // Il ne faut surtout pas interroger organizer_id ni user_id :
    // ces colonnes n'existent pas et toute requete les citant
    // echouerait en 42703.
    const moi = currentUser ? currentUser.id : null;
    const estProprietaire = !!moi && t.created_by === moi;

    if (estProprietaire) {
        return { tournament: t, access: 'owner' };
    }

    // Participant ?
    if (moi) {
        const { data: p } = await supabaseClient
            .from('supabaseAuthPrive_gt_participants')
            .select('id, status')
            .eq('tournament_id', tournamentId)
            .eq('user_id', moi)
            .maybeSingle();

        if (p) {
            return { tournament: t, access: 'participant', participation: p };
        }
    }

    return { tournament: t, access: 'public' };
}

/**
 * Exige le statut d'organisateur. Affiche un message clair et
 * renvoie vers l'accueil si l'utilisateur n'a rien à faire là.
 * Renvoie le tournoi si l'accès est légitime, sinon null.
 */
async function requireTournamentOwner(tournamentId) {
    const ctx = await loadTournamentContext(tournamentId);

    if (!ctx.tournament) {
        showToast('Tournoi introuvable.', 'error');
        setTimeout(() => { window.location.href = 'acceuil.html'; }, 1500);
        return null;
    }

    if (ctx.access !== 'owner') {
        showToast("Vous n'êtes pas l'organisateur de ce tournoi.", 'error');
        setTimeout(() => {
            window.location.href = 'tournament-details.html?id=' + encodeURIComponent(tournamentId);
        }, 1800);
        return null;
    }

    return ctx.tournament;
}

/**
 * Exige d'être organisateur OU participant inscrit.
 * Utilisé pour les pages qui montrent des données réservées aux
 * personnes réellement engagées dans le tournoi.
 */
async function requireTournamentMember(tournamentId) {
    const ctx = await loadTournamentContext(tournamentId);

    if (!ctx.tournament) {
        showToast('Tournoi introuvable.', 'error');
        setTimeout(() => { window.location.href = 'acceuil.html'; }, 1500);
        return null;
    }

    if (ctx.access === 'public') {
        showToast("Réservé aux participants de ce tournoi.", 'warning');
        setTimeout(() => {
            window.location.href = 'tournament-details.html?id=' + encodeURIComponent(tournamentId);
        }, 1800);
        return null;
    }

    return ctx;
}

/**
 * Vrai si l'utilisateur courant est l'organisateur du tournoi
 * déjà chargé (objet tournoi en mémoire). Sans requête réseau.
 */
function isTournamentOwner(tournament) {
    if (!tournament || !currentUser) return false;
    // created_by : seule colonne de proprietaire de gt_tournaments.
    return tournament.created_by === currentUser.id;
}

/**
 * Même logique pour une équipe.
 */
function isTeamOwner(team) {
    if (!team || !currentUser) return false;
    return team.creator_id === currentUser.id;
}


// ============================================================
//  9) DÉCONNEXION
// ============================================================
async function logoutGT() {
    try { await supabaseClient.auth.signOut(); }
    catch (e) { console.warn('Deconnexion :', e.message); }
    window.location.href = '../../authprive/users/login.html';
}


// ============================================================
//  10) DÉMARRAGE COMMUN D'UNE PAGE
// ------------------------------------------------------------
//  Vérifie la session, charge le profil, construit le menu.
//  Renvoie le profil, ou null si la session est invalide (dans
//  ce cas la redirection vers la connexion est déjà lancée).
// ============================================================
async function initPageGT(pageKey) {
    const u = await checkSession();
    if (!u) return null;

    const p = await loadProfile();

    try {
        if (typeof renderNavGT === 'function') renderNavGT(pageKey);
    } catch (e) {
        console.warn('[gestion-tournoi] menu non construit :', e.message);
    }

    try {
        if (typeof updateNavbarUI === 'function') updateNavbarUI();
    } catch (e) {
        console.warn('[gestion-tournoi] navbar non mise a jour :', e.message);
    }

    return p;
}


// ============================================================
//  11) EXPORTS
// ============================================================
window.showLoader              = showLoader;
window.hideLoader              = hideLoader;
window.showToast               = showToast;
window.escapeHtml              = escapeHtml;
window.escapeAttr              = escapeAttr;
window.getInitials             = getInitials;
window.getParam                = getParam;
window.getTournamentId         = getTournamentId;
window.getMatchId              = getMatchId;
window.getTeamId               = getTeamId;
window.checkSession            = checkSession;
window.loadProfile             = loadProfile;
window.loadTournamentContext   = loadTournamentContext;
window.requireTournamentOwner  = requireTournamentOwner;
window.requireTournamentMember = requireTournamentMember;
window.isTournamentOwner       = isTournamentOwner;
window.isTeamOwner             = isTeamOwner;
window.logoutGT                = logoutGT;
window.initPageGT              = initPageGT;
