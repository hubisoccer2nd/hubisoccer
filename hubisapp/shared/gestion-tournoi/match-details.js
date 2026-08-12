/* ============================================================
   HubISoccer — match-details.js
   Système Gestion Tournois — Détails d'un match
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Jointures imbriquees (team_a/team_b/tournament) converties
     en requetes separees fusionnees en JS -- meme principe
     applique depuis l'incident sur manage-tournament, ne plus
     dependre d'une relation non verifiee.
   - loadMatchReports() etait un simple texte statique
     ("il n'y a pas de table de rapports") alors que la table
     existe bel et bien (gt_match_reports, deja utilisee par
     manage-tournament.js). Reecrite pour vraiment lire et
     afficher les rapports du match.
   - Ajout de liens vers "Rediger un rapport" et "Exporter",
     absents alors que les deux pages existent deja.
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
const TBL_MATCHES              = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS                   = 'supabaseAuthPrive_gt_teams';
const TBL_TOURNAMENTS                = 'supabaseAuthPrive_gt_tournaments';
const TBL_PLAYER_MATCH_STATS            = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_REPORTS                          = 'supabaseAuthPrive_gt_match_reports';
const TBL_PROFILES                            = 'supabaseAuthPrive_profiles';

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

const REPORT_TYPE_LABELS = { referee: 'Rapport arbitre', commissioner: 'Rapport commissaire', medical: 'Rapport médical' };

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let matchId = null;

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
// 11. RÉCUPÉRATION DE L'ID DU MATCH
// ═══════════════════════════════════════════════════════════
function getMatchIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES DÉTAILS DU MATCH (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadMatchDetails(matchId) {
    if (!matchId) {
        showToast('Aucun match spécifié.', 'error');
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*')
        .eq('id', matchId)
        .single();

    if (error || !match) {
        hideLoader();
        showToast('Match introuvable.', 'error');
        return;
    }

    // Equipes et tournoi -- requetes separees
    let teamAName = 'Équipe A', teamBName = 'Équipe B', tournamentName = '', streamUrl = null;

    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_a_id).maybeSingle();
        if (teamA) teamAName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_b_id).maybeSingle();
        if (teamB) teamBName = teamB.name;
    }
    if (match.tournament_id) {
        const { data: tournament } = await supabaseClient.from(TBL_TOURNAMENTS).select('name, stream_url').eq('id', match.tournament_id).maybeSingle();
        if (tournament) { tournamentName = tournament.name; streamUrl = tournament.stream_url; }
    }

    hideLoader();

    document.getElementById('matchTitle').textContent = teamAName + ' vs ' + teamBName + (tournamentName ? ' — ' + tournamentName : '');
    document.getElementById('homeTeamName').textContent = teamAName;
    document.getElementById('awayTeamName').textContent = teamBName;
    document.getElementById('homeScore').textContent = match.score_a ?? 0;
    document.getElementById('awayScore').textContent = match.score_b ?? 0;

    const statusMap = { scheduled: 'Programmé', live: 'En direct', completed: 'Terminé' };
    const statusLabel = statusMap[match.status] || match.status;
    const statusClass = match.status === 'live' ? 'status-live' : (match.status === 'completed' ? 'status-completed' : 'status-scheduled');
    document.getElementById('matchStatus').innerHTML = '<span class="' + statusClass + '">' + statusLabel + '</span>';
    document.getElementById('matchMeta').textContent = (tournamentName ? 'Tournoi : ' + tournamentName + ' — ' : '') + (match.match_date ? new Date(match.match_date).toLocaleString('fr-FR') : '');

    const streamDiv = document.getElementById('matchStream');
    streamDiv.innerHTML = streamUrl
        ? '<iframe src="' + streamUrl + '" frameborder="0" allowfullscreen></iframe>'
        : '<p class="empty-hint">Aucun stream disponible.</p>';

    // Liens vers rediger/exporter un rapport, avec l'id du match
    const writeLink = document.getElementById('writeReportLink');
    const exportLink = document.getElementById('exportReportLink');
    if (writeLink) writeLink.href = 'match-report.html?match_id=' + matchId;
    if (exportLink) exportLink.href = 'match-report-export.html?match_id=' + matchId;

    await loadMatchEvents(matchId);
    await loadMatchReports(matchId);
}

// ═══════════════════════════════════════════════════════════
// 13. ÉVÉNEMENTS (STATISTIQUES JOUEURS)
// ═══════════════════════════════════════════════════════════
async function loadMatchEvents(matchId) {
    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_MATCH_STATS)
        .select('id, player_id, goals, assists, yellow_cards, red_cards')
        .eq('match_id', matchId);

    const eventsContainer = document.getElementById('matchEvents');
    if (error || !data || data.length === 0) {
        eventsContainer.innerHTML = '<p class="empty-hint">Aucun événement enregistré.</p>';
        return;
    }

    const playerIds = data.map(function(stat) { return stat.player_id; });
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', playerIds);
    const profileMap = {};
    (profiles || []).forEach(function(p) { profileMap[p.auth_uuid] = p.full_name || 'Joueur inconnu'; });

    let html = '';
    data.forEach(function(stat) {
        const playerName = profileMap[stat.player_id] || 'Joueur inconnu';
        let events = '';
        if (stat.goals > 0) events += '⚽ ' + stat.goals + ' but(s) ';
        if (stat.assists > 0) events += '🎯 ' + stat.assists + ' passe(s) ';
        if (stat.yellow_cards > 0) events += '🟨 ' + stat.yellow_cards + ' jaune(s) ';
        if (stat.red_cards > 0) events += '🟥 ' + stat.red_cards + ' rouge(s) ';
        if (events) {
            html += '<div class="event-item"><span class="event-player">' + escapeHtml(playerName) + '</span><span class="event-details">' + events + '</span></div>';
        }
    });

    eventsContainer.innerHTML = html || '<p class="empty-hint">Aucun événement enregistré.</p>';
}

// ═══════════════════════════════════════════════════════════
// 14. RAPPORTS (lecture reelle depuis gt_match_reports)
// ═══════════════════════════════════════════════════════════
async function loadMatchReports(matchId) {
    const container = document.getElementById('matchReports');
    const { data, error } = await supabaseClient
        .from(TBL_REPORTS)
        .select('id, report_type, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Erreur chargement rapports:', error.message);
        container.innerHTML = '<p class="empty-hint">Rapports indisponibles pour l\'instant.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="empty-hint">Aucun rapport pour ce match. <a href="' + document.getElementById('writeReportLink').href + '">En rédiger un</a>.</p>';
        return;
    }

    container.innerHTML = data.map(function(r) {
        const label = REPORT_TYPE_LABELS[r.report_type] || r.report_type;
        const date = r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '';
        return '<div class="report-preview-item"><i class="fas fa-file-alt"></i> <span>' + escapeHtml(label) + '</span><span class="report-preview-date">' + date + '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 16. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('refreshBtn')?.addEventListener('click', function() { if (matchId) loadMatchDetails(matchId); });

    matchId = getMatchIdFromURL();
    if (matchId) {
        await loadMatchDetails(matchId);
    } else {
        document.getElementById('matchTitle').textContent = 'Match non spécifié.';
    }
});
