/* ============================================================
   HubISoccer — manage-tournament.js
   Système Gestion Tournois — Gérer un tournoi
   ------------------------------------------------------------
   Corrections critiques appliquees a ce fichier :
   - Toutes les tables migrees vers supabaseAuthPrive_gt_*.
   - gestionnairetournoi_reports (table qui n'existe plus depuis
     la migration, fusionnee dans match_reports) -> pointe
     desormais vers supabaseAuthPrive_gt_match_reports.
   - AUCUNE verification de permission n'existait -- n'importe
     quel utilisateur connecte pouvait gerer n'importe quel
     tournoi en changeant juste l'id dans l'URL. Ajout d'un
     controle created_by === currentUser.id, avec ecran "Acces
     refuse" si ce n'est pas le cas.
   - Fonctionnalite manquante depuis l'audit initial : aucun
     moyen d'enregistrer un resultat de match une fois joue.
     Ajoutee (bouton "Enregistrer resultat" par match, modale
     dediee, marque le match 'completed').
   - Inscriptions affichaient un UUID brut au lieu du nom -> jointure
     avec profiles.
   - Formulaire de modification utilisait uniquement is_active ->
     remplace par le vrai champ status (draft/published/completed/
     cancelled), coherent avec le reste du systeme partage.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES (convention supabaseAuthPrive_gt_*)
// ═══════════════════════════════════════════════════════════
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS        = 'supabaseAuthPrive_gt_sports';
const TBL_PARTICIPANTS   = 'supabaseAuthPrive_gt_participants';
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_MATCHES          = 'supabaseAuthPrive_gt_matches';
const TBL_REPORTS           = 'supabaseAuthPrive_gt_match_reports';
const TBL_PRIZES              = 'supabaseAuthPrive_gt_prizes';
const TBL_PROFILES              = 'supabaseAuthPrive_profiles';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournamentId = null;
let currentTournament = null;
let allTeams = [];

const STATUS_LABELS = { draft: 'Brouillon', published: 'Publié', completed: 'Terminé', cancelled: 'Annulé' };

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 30000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}
function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 10. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. RÉCUPÉRATION DE L'ID DU TOURNOI
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DU TOURNOI + VÉRIFICATION DE PROPRIÉTÉ
// ═══════════════════════════════════════════════════════════
async function loadTournament() {
    currentTournamentId = getTournamentIdFromURL();
    if (!currentTournamentId) {
        showToast('Aucun tournoi spécifié.', 'error');
        window.location.href = 'acceuil.html';
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*, sport:' + TBL_SPORTS + '(name), type:' + TBL_TYPES + '(name, label)')
        .eq('id', currentTournamentId)
        .single();
    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable.', 'error');
        window.location.href = 'acceuil.html';
        return;
    }

    // Verification de propriete : seul le createur peut gerer ce tournoi
    if (data.created_by !== currentUser.id) {
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('accessDenied').style.display = 'flex';
        return;
    }

    currentTournament = data;
    document.getElementById('tournamentName').innerHTML = '<i class="fas fa-sliders-h"></i> ' + escapeHtml(data.name || 'Gestion du tournoi');
    fillInfoTab(data);
    loadRegistrations();
    loadTeams();
    loadMatches();
    loadReports();
    loadPrizes();
}

// ═══════════════════════════════════════════════════════════
// 13. REMPLIR L'ONGLET INFOS
// ═══════════════════════════════════════════════════════════
function fillInfoTab(t) {
    document.getElementById('infoName').textContent = t.name || '—';
    document.getElementById('infoDates').textContent = (t.start_date ? new Date(t.start_date).toLocaleDateString('fr-FR') : '?') + ' → ' + (t.end_date ? new Date(t.end_date).toLocaleDateString('fr-FR') : '?');
    document.getElementById('infoLocation').textContent = t.location || '—';
    document.getElementById('infoSport').textContent = t.sport?.name || '—';
    document.getElementById('infoType').textContent = t.type?.label || t.type?.name || '—';
    document.getElementById('infoStatus').textContent = STATUS_LABELS[t.status] || t.status || '—';
    document.getElementById('infoPrize').textContent = t.prize_pool ? formatMoney(t.prize_pool) + ' FCFA' : '—';
    document.getElementById('infoDescription').textContent = t.description || 'Aucune description.';
}

// ═══════════════════════════════════════════════════════════
// 14. ONGLET INSCRIPTIONS
// ═══════════════════════════════════════════════════════════
async function loadRegistrations() {
    const { data, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id, status, user_id, created_at, ' + TBL_PROFILES + '(full_name, hubisoccer_id)')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });

    if (error) { console.error('Erreur inscriptions:', error.message); return; }

    const pending = data.filter(function(r) { return r.status === 'pending'; });
    const approved = data.filter(function(r) { return r.status === 'approved'; });
    renderPendingRegistrations(pending);
    renderApprovedRegistrations(approved);
}

function participantName(r) {
    const profile = r[TBL_PROFILES];
    return profile ? escapeHtml(profile.full_name || profile.hubisoccer_id || 'Participant') : 'Participant';
}

async function approveRegistration(registrationId) {
    const { error } = await supabaseClient.from(TBL_PARTICIPANTS).update({ status: 'approved' }).eq('id', registrationId);
    if (error) { showToast('Erreur lors de l\'approbation', 'error'); }
    else { showToast('Inscription approuvée', 'success'); loadRegistrations(); }
}

async function rejectRegistration(registrationId) {
    const { error } = await supabaseClient.from(TBL_PARTICIPANTS).update({ status: 'rejected' }).eq('id', registrationId);
    if (error) { showToast('Erreur lors du rejet', 'error'); }
    else { showToast('Inscription rejetée', 'warning'); loadRegistrations(); }
}

function renderPendingRegistrations(list) {
    const container = document.getElementById('pendingRegistrationsList');
    if (!container) return;
    if (!list.length) { container.innerHTML = '<p class="empty-hint">Aucune demande en attente.</p>'; return; }
    container.innerHTML = list.map(function(r) {
        return '<div class="registration-item">' +
               '<span class="reg-name"><i class="fas fa-user"></i> ' + participantName(r) + '</span>' +
               '<div class="actions">' +
               '<button class="btn-approve" onclick="approveRegistration(\'' + r.id + '\')"><i class="fas fa-check"></i> Approuver</button>' +
               '<button class="btn-reject" onclick="rejectRegistration(\'' + r.id + '\')"><i class="fas fa-times"></i> Rejeter</button>' +
               '</div></div>';
    }).join('');
}

function renderApprovedRegistrations(list) {
    const container = document.getElementById('approvedRegistrationsList');
    if (!container) return;
    if (!list.length) { container.innerHTML = '<p class="empty-hint">Aucune inscription validée.</p>'; return; }
    container.innerHTML = list.map(function(r) {
        return '<div class="registration-item approved"><span class="reg-name"><i class="fas fa-user-check"></i> ' + participantName(r) + '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. ONGLET ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadTeams() {
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('name');
    if (error) { console.error('Erreur chargement équipes:', error.message); return; }
    allTeams = data || [];
    renderTeams();
}

function renderTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    if (!allTeams.length) { container.innerHTML = '<p class="empty-hint">Aucune équipe pour ce tournoi.</p>'; return; }
    container.innerHTML = allTeams.map(function(team) {
        const logo = team.logo_url
            ? '<img src="' + team.logo_url + '" alt="logo" class="team-logo">'
            : '<div class="team-logo-placeholder"><i class="fas fa-shield-alt"></i></div>';
        return '<div class="team-card">' + logo +
               '<div class="team-name">' + escapeHtml(team.name) + '</div>' +
               (team.age_category ? '<div class="team-age">' + escapeHtml(team.age_category) + '</div>' : '') +
               '<button class="btn-delete" onclick="deleteTeam(\'' + team.id + '\')"><i class="fas fa-trash"></i></button>' +
               '</div>';
    }).join('');
}

async function addTeam(e) {
    e.preventDefault();
    const name = document.getElementById('teamName').value.trim();
    const ageCategory = document.getElementById('teamAgeCategory').value.trim() || null;
    const logo = document.getElementById('teamLogo').value.trim();
    if (!name) { showToast('Le nom de l\'équipe est requis.', 'warning'); return; }
    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TEAMS)
        .insert([{ tournament_id: currentTournamentId, name: name, age_category: ageCategory, logo_url: logo || null }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de l\'équipe : ' + error.message, 'error');
    } else {
        showToast('Équipe ajoutée', 'success');
        closeModal('addTeamModal');
        document.getElementById('addTeamForm').reset();
        loadTeams();
    }
}

async function deleteTeam(teamId) {
    if (!confirm('Supprimer cette équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAMS).delete().eq('id', teamId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); }
    else { showToast('Équipe supprimée', 'success'); loadTeams(); }
}

// ═══════════════════════════════════════════════════════════
// 16. ONGLET MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*, team_a:' + TBL_TEAMS + '!team_a_id(name), team_b:' + TBL_TEAMS + '!team_b_id(name)')
        .eq('tournament_id', currentTournamentId)
        .order('match_date', { ascending: true });
    if (error) { console.error('Erreur chargement matchs:', error.message); return; }
    renderMatches(data || []);
}

function renderMatches(matches) {
    const container = document.getElementById('matchesList');
    if (!container) return;
    if (!matches.length) { container.innerHTML = '<p class="empty-hint">Aucun match programmé.</p>'; return; }

    container.innerHTML = matches.map(function(m) {
        const date = m.match_date ? new Date(m.match_date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue';
        const isDone = m.status === 'completed';
        const scoreDisplay = isDone ? (m.score_a ?? 0) + ' - ' + (m.score_b ?? 0) : 'vs';
        const teamAName = m.team_a?.name || 'Équipe A';
        const teamBName = m.team_b?.name || 'Équipe B';

        return '<div class="match-item ' + (isDone ? 'done' : '') + '">' +
               '<div class="match-top-row">' +
               '<span class="match-date">' + (m.round ? escapeHtml(m.round) + ' — ' : '') + date + '</span>' +
               (isDone ? '<span class="match-done-badge"><i class="fas fa-check-circle"></i> Terminé</span>' : '') +
               '</div>' +
               '<div class="match-teams"><span>' + escapeHtml(teamAName) + '</span><span class="match-score tabular">' + scoreDisplay + '</span><span>' + escapeHtml(teamBName) + '</span></div>' +
               '<div class="match-actions">' +
               '<button class="btn-result" onclick="openRecordResult(\'' + m.id + '\', \'' + escapeHtml(teamAName).replace(/'/g, "\\'") + '\', \'' + escapeHtml(teamBName).replace(/'/g, "\\'") + '\', ' + (m.score_a ?? 0) + ', ' + (m.score_b ?? 0) + ')"><i class="fas fa-clipboard-check"></i> ' + (isDone ? 'Modifier le résultat' : 'Enregistrer résultat') + '</button>' +
               '<button class="btn-delete" onclick="deleteMatch(\'' + m.id + '\')"><i class="fas fa-trash"></i></button>' +
               '</div></div>';
    }).join('');
}

async function addMatch(e) {
    e.preventDefault();
    const homeTeam = document.getElementById('matchHomeTeam').value;
    const awayTeam = document.getElementById('matchAwayTeam').value;
    const date = document.getElementById('matchDate').value;
    const round = document.getElementById('matchRound').value.trim() || null;
    if (!homeTeam || !awayTeam) { showToast('Veuillez sélectionner les deux équipes.', 'warning'); return; }
    if (homeTeam === awayTeam) { showToast('Une équipe ne peut pas jouer contre elle-même.', 'warning'); return; }
    if (!date) { showToast('Veuillez choisir une date.', 'warning'); return; }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_MATCHES)
        .insert([{
            tournament_id: currentTournamentId,
            team_a_id: homeTeam,
            team_b_id: awayTeam,
            match_date: new Date(date).toISOString(),
            round: round,
            status: 'scheduled'
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout du match : ' + error.message, 'error');
    } else {
        showToast('Match ajouté', 'success');
        closeModal('addMatchModal');
        document.getElementById('addMatchForm').reset();
        loadMatches();
    }
}

async function deleteMatch(matchId) {
    if (!confirm('Supprimer ce match ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_MATCHES).delete().eq('id', matchId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); }
    else { showToast('Match supprimé', 'success'); loadMatches(); }
}

// ═══════════════════════════════════════════════════════════
// 17. ENREGISTRER UN RÉSULTAT (nouvelle fonctionnalité)
// ═══════════════════════════════════════════════════════════
function openRecordResult(matchId, teamAName, teamBName, currentScoreA, currentScoreB) {
    document.getElementById('resultMatchId').value = matchId;
    document.getElementById('resultTeamALabel').textContent = teamAName;
    document.getElementById('resultTeamBLabel').textContent = teamBName;
    document.getElementById('resultTeamsPreview').innerHTML =
        '<span>' + escapeHtml(teamAName) + '</span><i class="fas fa-futbol"></i><span>' + escapeHtml(teamBName) + '</span>';
    document.getElementById('resultScoreA').value = currentScoreA || 0;
    document.getElementById('resultScoreB').value = currentScoreB || 0;
    openModal('recordResultModal');
}
window.openRecordResult = openRecordResult;

async function saveMatchResult(e) {
    e.preventDefault();
    const matchId = document.getElementById('resultMatchId').value;
    const scoreA = parseInt(document.getElementById('resultScoreA').value, 10);
    const scoreB = parseInt(document.getElementById('resultScoreB').value, 10);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        showToast('Merci d\'entrer des scores valides.', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_MATCHES)
        .update({ score_a: scoreA, score_b: scoreB, status: 'completed' })
        .eq('id', matchId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'enregistrement : ' + error.message, 'error');
    } else {
        showToast('Résultat enregistré !', 'success');
        closeModal('recordResultModal');
        loadMatches();
    }
}

// ═══════════════════════════════════════════════════════════
// 18. ONGLET RAPPORTS
// ═══════════════════════════════════════════════════════════
async function loadReports() {
    const { data: matches } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id')
        .eq('tournament_id', currentTournamentId);

    if (!matches || matches.length === 0) {
        document.getElementById('reportsList').innerHTML = '<p class="empty-hint">Aucun match, donc aucun rapport.</p>';
        return;
    }

    const matchIds = matches.map(function(m) { return m.id; });
    const { data, error } = await supabaseClient
        .from(TBL_REPORTS)
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

    if (error) { console.error('Erreur rapports:', error.message); return; }
    renderReports(data || []);
}

function renderReports(reports) {
    const container = document.getElementById('reportsList');
    if (!container) return;
    if (!reports.length) { container.innerHTML = '<p class="empty-hint">Aucun rapport pour l\'instant.</p>'; return; }
    container.innerHTML = reports.map(function(r) {
        return '<div class="report-item"><h4>' + escapeHtml(r.title || 'Rapport de match') + '</h4><p>' + escapeHtml(r.content || '') + '</p></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 19. ONGLET PRIMES
// ═══════════════════════════════════════════════════════════
async function loadPrizes() {
    const { data, error } = await supabaseClient
        .from(TBL_PRIZES)
        .select('*, team:' + TBL_TEAMS + '!team_id(name)')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });
    if (error) { console.error('Erreur chargement primes:', error.message); return; }
    renderPrizes(data || []);
}

function renderPrizes(prizes) {
    const container = document.getElementById('prizesList');
    if (!container) return;
    if (!prizes.length) { container.innerHTML = '<p class="empty-hint">Aucune prime enregistrée.</p>'; return; }
    container.innerHTML = prizes.map(function(p) {
        const recipient = p.recipient_type === 'team'
            ? (p.team ? escapeHtml(p.team.name) : 'Équipe')
            : escapeHtml(p.recipient_id);
        return '<div class="prize-item">' +
               '<span class="prize-recipient"><i class="fas ' + (p.recipient_type === 'team' ? 'fa-shield-alt' : 'fa-user') + '"></i> ' + recipient + '</span>' +
               '<span class="prize-amount tabular">' + formatMoney(p.amount) + ' FCFA</span>' +
               (p.reason ? '<span class="prize-reason">' + escapeHtml(p.reason) + '</span>' : '') +
               '</div>';
    }).join('');
}

async function addPrize(e) {
    e.preventDefault();
    const recipientType = document.getElementById('prizeRecipientType').value;
    const recipientId = recipientType === 'team'
        ? document.getElementById('prizeTeamId').value
        : document.getElementById('prizePlayerId').value.trim();
    const amount = document.getElementById('prizeAmount').value;
    const reason = document.getElementById('prizeReason').value.trim();

    if (!recipientId || !amount) { showToast('Veuillez remplir tous les champs.', 'warning'); return; }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_PRIZES)
        .insert([{
            tournament_id: currentTournamentId,
            recipient_type: recipientType,
            recipient_id: recipientId,
            amount: parseFloat(amount),
            reason: reason || null
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de la prime : ' + error.message, 'error');
    } else {
        showToast('Prime ajoutée', 'success');
        closeModal('addPrizeModal');
        document.getElementById('addPrizeForm').reset();
        loadPrizes();
    }
}

// ═══════════════════════════════════════════════════════════
// 20. MODALE MODIFIER TOURNOI
// ═══════════════════════════════════════════════════════════
function openEditTournamentModal() {
    if (!currentTournament) return;
    document.getElementById('editName').value = currentTournament.name || '';
    document.getElementById('editStartDate').value = currentTournament.start_date ? currentTournament.start_date.substring(0, 16) : '';
    document.getElementById('editEndDate').value = currentTournament.end_date ? currentTournament.end_date.substring(0, 16) : '';
    document.getElementById('editLocation').value = currentTournament.location || '';
    document.getElementById('editDescription').value = currentTournament.description || '';
    document.getElementById('editPrizePool').value = currentTournament.prize_pool || '';
    document.getElementById('editRegistrationCode').value = currentTournament.registration_code || '';
    document.getElementById('editStreamUrl').value = currentTournament.stream_url || '';
    document.getElementById('editStatus').value = currentTournament.status || 'draft';
    openModal('editTournamentModal');
}

async function saveTournamentChanges(e) {
    e.preventDefault();

    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    if (new Date(endDate) <= new Date(startDate)) {
        showToast('La date de fin doit être après la date de début.', 'warning');
        return;
    }

    const updates = {
        name: document.getElementById('editName').value,
        start_date: startDate,
        end_date: endDate,
        location: document.getElementById('editLocation').value,
        description: document.getElementById('editDescription').value,
        prize_pool: parseFloat(document.getElementById('editPrizePool').value) || 0,
        registration_code: document.getElementById('editRegistrationCode').value,
        stream_url: document.getElementById('editStreamUrl').value,
        status: document.getElementById('editStatus').value,
        updated_at: new Date().toISOString()
    };

    showLoader();
    const { error } = await supabaseClient.from(TBL_TOURNAMENTS).update(updates).eq('id', currentTournamentId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la modification : ' + error.message, 'error');
    } else {
        showToast('Tournoi mis à jour', 'success');
        closeModal('editTournamentModal');
        const { data } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('*, sport:' + TBL_SPORTS + '(name), type:' + TBL_TYPES + '(name, label)')
            .eq('id', currentTournamentId)
            .single();
        if (data) {
            currentTournament = data;
            fillInfoTab(data);
            document.getElementById('tournamentName').innerHTML = '<i class="fas fa-sliders-h"></i> ' + escapeHtml(data.name || 'Gestion du tournoi');
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 21. MODALES GÉNÉRALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'flex'; }
function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'none'; }
window.closeModal = closeModal;

// ═══════════════════════════════════════════════════════════
// 22. GESTION DES ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            tabButtons.forEach(function(b) { b.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            const target = document.getElementById(this.dataset.tab + 'Tab');
            if (target) target.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 23. SÉLECTEURS (ÉQUIPES)
// ═══════════════════════════════════════════════════════════
async function loadTeamOptions() {
    if (!allTeams.length) await loadTeams();
    const homeSelect = document.getElementById('matchHomeTeam');
    const awaySelect = document.getElementById('matchAwayTeam');
    const prizeTeamSelect = document.getElementById('prizeTeamId');
    const html = allTeams.map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
    if (homeSelect) homeSelect.innerHTML = html;
    if (awaySelect) awaySelect.innerHTML = html;
    if (prizeTeamSelect) prizeTeamSelect.innerHTML = html;
}

function togglePrizeRecipient() {
    const type = document.getElementById('prizeRecipientType').value;
    document.getElementById('prizeTeamGroup').style.display = (type === 'team') ? 'block' : 'none';
    document.getElementById('prizePlayerGroup').style.display = (type === 'player') ? 'block' : 'none';
}

// ═══════════════════════════════════════════════════════════
// 24. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 25. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournament();

    document.getElementById('editTournamentBtn')?.addEventListener('click', openEditTournamentModal);
    document.getElementById('editTournamentForm')?.addEventListener('submit', saveTournamentChanges);

    document.getElementById('addTeamBtn')?.addEventListener('click', function() { openModal('addTeamModal'); });
    document.getElementById('addTeamForm')?.addEventListener('submit', addTeam);

    document.getElementById('addMatchBtn')?.addEventListener('click', async function() {
        await loadTeamOptions();
        openModal('addMatchModal');
    });
    document.getElementById('addMatchForm')?.addEventListener('submit', addMatch);
    document.getElementById('recordResultForm')?.addEventListener('submit', saveMatchResult);

    document.getElementById('addPrizeBtn')?.addEventListener('click', async function() {
        await loadTeamOptions();
        openModal('addPrizeModal');
    });
    document.getElementById('addPrizeForm')?.addEventListener('submit', addPrize);
    document.getElementById('prizeRecipientType')?.addEventListener('change', togglePrizeRecipient);

    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    });

    window.approveRegistration = approveRegistration;
    window.rejectRegistration = rejectRegistration;
    window.deleteTeam = deleteTeam;
    window.deleteMatch = deleteMatch;
});
