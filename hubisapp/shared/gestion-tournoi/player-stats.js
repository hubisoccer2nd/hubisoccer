/* ============================================================
   HubISoccer — player-stats.js
   Système Gestion Tournois — Statistiques footballeur
   ------------------------------------------------------------
   Correction structurelle : la page ne pouvait afficher QUE les
   statistiques de l'utilisateur connecte (currentUser.id partout).
   Aucun moyen de consulter le profil d'un AUTRE footballeur --
   ce qui rend impossible le parcours "cliquer sur un footballeur
   depuis un match pour voir ses stats" illustre par les captures
   de reference. Corrige : lit ?id= dans l'URL, avec repli sur
   l'utilisateur connecte si absent (comportement d'origine
   preserve comme cas par defaut).
   - userProfile.position/jersey_number/club n'etaient jamais
     confirmes comme colonnes reelles de gt_participants ou
     profiles -- affiches uniquement si presents, jamais supposes.
   - Categories Passes/Tirs/Physique/Defense ajoutees, utilisant
     l'extension de schema (voir player-stats-detail-table.sql).
     Comme aucune page ne saisit encore ces champs, un message
     honnete s'affiche tant qu'ils sont vides plutot que de
     montrer des zeros silencieux.
   - Tables migrees vers supabaseAuthPrive_gt_*.
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
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_PLAYER_STATS = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_MATCHES         = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS               = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS           = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS               = 'supabaseAuthPrive_gt_tournaments';
const TBL_PROFILES                     = 'supabaseAuthPrive_profiles';

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
let viewedPlayerId = null;
let viewedPlayerProfile = null;
let allStatsRows = [];

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
// 9. CHARGEMENT DU PROFIL CONNECTÉ (navbar)
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
// 10. DÉTERMINATION DU FOOTBALLEUR CONSULTÉ (?id= ou soi-même)
// ═══════════════════════════════════════════════════════════
function resolveViewedPlayerId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || currentUser.id;
}

async function loadViewedPlayerProfile() {
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', viewedPlayerId)
        .maybeSingle();

    if (error || !data) {
        showToast('Footballeur introuvable.', 'error');
        return;
    }
    viewedPlayerProfile = data;
    updatePlayerHero();
}

// ═══════════════════════════════════════════════════════════
// 11. CARTE IDENTITÉ (requêtes séparées pour équipe/poste)
// ═══════════════════════════════════════════════════════════
async function updatePlayerHero() {
    if (!viewedPlayerProfile) return;

    document.getElementById('playerName').textContent = viewedPlayerProfile.full_name || 'Footballeur';

    const avatarContainer = document.getElementById('playerAvatar');
    avatarContainer.innerHTML = viewedPlayerProfile.avatar_url
        ? '<img src="' + viewedPlayerProfile.avatar_url + '" alt="Avatar">'
        : '<div class="avatar-initials-large">' + getInitials(viewedPlayerProfile.full_name || 'F') + '</div>';

    document.getElementById('playerSince').textContent = viewedPlayerProfile.created_at
        ? new Date(viewedPlayerProfile.created_at).toLocaleDateString('fr-FR')
        : '—';

    // Poste/numero/equipe -- cherches dans une equipe reelle (team_players),
    // jamais suppose depuis profiles qui n'a pas ces colonnes confirmees
    const { data: membership } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('team_id, jersey_number, position')
        .eq('user_id', viewedPlayerId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (membership) {
        document.getElementById('playerPosition').textContent = membership.position || 'Non précisé';
        document.getElementById('playerNumber').textContent = membership.jersey_number ? '#' + membership.jersey_number : '—';
        if (membership.team_id) {
            const { data: team } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', membership.team_id).maybeSingle();
            document.getElementById('playerTeam').textContent = team ? team.name : 'Équipe inconnue';
        }
    } else {
        document.getElementById('playerPosition').textContent = 'Non précisé';
        document.getElementById('playerNumber').textContent = '—';
        document.getElementById('playerTeam').textContent = 'Aucune équipe';
    }
}

// ═══════════════════════════════════════════════════════════
// 12. STATISTIQUES GLOBALES
// ═══════════════════════════════════════════════════════════
async function loadGlobalStats() {
    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_STATS)
        .select('*')
        .eq('player_id', viewedPlayerId);

    if (error) {
        console.error('Erreur chargement stats:', error);
        showToast('Erreur chargement des statistiques', 'error');
        return;
    }

    allStatsRows = data || [];

    let totalGoals = 0, totalAssists = 0, totalYellow = 0, totalRed = 0, ratingSum = 0, ratingCount = 0;
    allStatsRows.forEach(function(stat) {
        totalGoals += stat.goals || 0;
        totalAssists += stat.assists || 0;
        totalYellow += stat.yellow_cards || 0;
        totalRed += stat.red_cards || 0;
        if (stat.match_rating != null) { ratingSum += Number(stat.match_rating); ratingCount++; }
    });

    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('totalAssists').textContent = totalAssists;
    document.getElementById('totalYellow').textContent = totalYellow;
    document.getElementById('totalRed').textContent = totalRed;
    document.getElementById('totalMatches').textContent = allStatsRows.length;
    document.getElementById('avgRating').textContent = ratingCount ? (ratingSum / ratingCount).toFixed(1) : '—';

    renderCategoryDetail('passing');
}

// ═══════════════════════════════════════════════════════════
// 13. DÉTAIL PAR CATÉGORIE (passes/tirs/physique/défense)
// ═══════════════════════════════════════════════════════════
const CATEGORY_FIELDS = {
    passing: [
        { key: 'passes_completed', label: 'Passes réussies' },
        { key: 'passes_attempted', label: 'Passes tentées' },
        { key: 'key_passes', label: 'Passes clés' }
    ],
    shooting: [
        { key: 'shots_total', label: 'Tirs totaux' },
        { key: 'shots_on_target', label: 'Tirs cadrés' },
        { key: 'goals', label: 'Buts' }
    ],
    physical: [
        { key: 'distance_km', label: 'Distance parcourue', suffix: ' km' },
        { key: 'sprints', label: 'Sprints' },
        { key: 'top_speed_kmh', label: 'Vitesse maximale', suffix: ' km/h' },
        { key: 'minutes_played', label: 'Minutes jouées', suffix: "'" }
    ],
    defense: [
        { key: 'tackles_won', label: 'Tacles gagnés' },
        { key: 'interceptions', label: 'Interceptions' },
        { key: 'duels_won', label: 'Duels gagnés' },
        { key: 'duels_total', label: 'Duels totaux' }
    ]
};

function renderCategoryDetail(category) {
    const fields = CATEGORY_FIELDS[category];
    const container = document.getElementById('categoryDetail');
    const hint = document.getElementById('detailHint');

    let anyData = false;
    const sums = {};
    fields.forEach(function(f) { sums[f.key] = 0; });

    allStatsRows.forEach(function(stat) {
        fields.forEach(function(f) {
            if (stat[f.key] != null) { sums[f.key] += Number(stat[f.key]); anyData = true; }
        });
    });

    if (!anyData) {
        container.innerHTML = '';
        hint.style.display = 'block';
        return;
    }

    hint.style.display = 'none';
    container.innerHTML = '<div class="detail-grid">' + fields.map(function(f) {
        return '<div class="detail-item"><span class="detail-label">' + f.label + '</span>' +
               '<span class="detail-value tabular">' + sums[f.key] + (f.suffix || '') + '</span></div>';
    }).join('') + '</div>';
}

function initCategoryTabs() {
    document.querySelectorAll('.cat-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cat-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderCategoryDetail(btn.dataset.cat);
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 14. TOURNOIS DU FOOTBALLEUR (filtre)
// ═══════════════════════════════════════════════════════════
async function loadPlayerTournaments() {
    if (!allStatsRows.length) {
        document.getElementById('tournamentSelect').innerHTML = '<option value="">Tous les tournois</option>';
        return;
    }

    const matchIds = allStatsRows.map(function(s) { return s.match_id; });
    const { data: matches } = await supabaseClient.from(TBL_MATCHES).select('id, tournament_id').in('id', matchIds);
    const tournamentIds = [...new Set((matches || []).map(function(m) { return m.tournament_id; }).filter(Boolean))];

    if (!tournamentIds.length) {
        document.getElementById('tournamentSelect').innerHTML = '<option value="">Tous les tournois</option>';
        return;
    }

    const { data: tournaments } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').in('id', tournamentIds);
    const select = document.getElementById('tournamentSelect');
    select.innerHTML = '<option value="">Tous les tournois</option>';
    (tournaments || []).forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

// ═══════════════════════════════════════════════════════════
// 15. LISTE DES MATCHS (requêtes séparées)
// ═══════════════════════════════════════════════════════════
async function loadMatchDetails(tournamentId) {
    const listContainer = document.getElementById('matchesStatsList');

    if (!allStatsRows.length) {
        listContainer.innerHTML = '<p class="empty-hint">Aucune statistique de match trouvée.</p>';
        return;
    }

    const matchIds = allStatsRows.map(function(s) { return s.match_id; });
    const { data: matches } = await supabaseClient.from(TBL_MATCHES).select('id, team_a_id, team_b_id, tournament_id, match_date').in('id', matchIds);
    const matchMap = {};
    (matches || []).forEach(function(m) { matchMap[m.id] = m; });

    const relevantRows = tournamentId
        ? allStatsRows.filter(function(s) { const m = matchMap[s.match_id]; return m && String(m.tournament_id) === String(tournamentId); })
        : allStatsRows;

    if (!relevantRows.length) {
        listContainer.innerHTML = '<p class="empty-hint">Aucune statistique pour ce tournoi.</p>';
        return;
    }

    const teamIds = new Set();
    const tournamentIds = new Set();
    relevantRows.forEach(function(s) {
        const m = matchMap[s.match_id];
        if (!m) return;
        if (m.team_a_id) teamIds.add(m.team_a_id);
        if (m.team_b_id) teamIds.add(m.team_b_id);
        if (m.tournament_id) tournamentIds.add(m.tournament_id);
    });

    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', Array.from(teamIds));
    const teamNameMap = {};
    (teams || []).forEach(function(t) { teamNameMap[t.id] = t.name; });

    const { data: tournaments } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').in('id', Array.from(tournamentIds));
    const tournamentNameMap = {};
    (tournaments || []).forEach(function(t) { tournamentNameMap[t.id] = t.name; });

    let html = '<div class="matches-list">';
    relevantRows.forEach(function(stat) {
        const match = matchMap[stat.match_id];
        if (!match) return;

        const teamAName = teamNameMap[match.team_a_id] || 'Équipe A';
        const teamBName = teamNameMap[match.team_b_id] || 'Équipe B';
        const tournamentName = tournamentNameMap[match.tournament_id] || '';
        const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';

        html += '<div class="match-stat-item">' +
                '<div class="match-header">' +
                '<span class="match-date"><i class="fas fa-calendar-alt"></i> ' + matchDate + '</span>' +
                '<span class="match-teams">' + escapeHtml(teamAName) + ' vs ' + escapeHtml(teamBName) + '</span>' +
                (tournamentName ? '<span class="match-tournament"><i class="fas fa-trophy"></i> ' + escapeHtml(tournamentName) + '</span>' : '') +
                '</div>' +
                '<div class="match-stats">' +
                '<span><i class="fas fa-futbol"></i> Buts : ' + (stat.goals || 0) + '</span>' +
                '<span><i class="fas fa-handshake"></i> Passes déc. : ' + (stat.assists || 0) + '</span>' +
                '<span><i class="fas fa-square yellow"></i> Jaunes : ' + (stat.yellow_cards || 0) + '</span>' +
                '<span><i class="fas fa-square red"></i> Rouges : ' + (stat.red_cards || 0) + '</span>' +
                (stat.match_rating != null ? '<span class="match-rating tabular">' + Number(stat.match_rating).toFixed(1) + '</span>' : '') +
                '</div>' +
                '</div>';
    });
    html += '</div>';
    listContainer.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 16. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 17. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    initUserMenu();
    initSidebar();
    initLogout();
    initCategoryTabs();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    viewedPlayerId = resolveViewedPlayerId();
    await loadViewedPlayerProfile();
    await loadGlobalStats();
    await loadPlayerTournaments();
    await loadMatchDetails(null);

    document.getElementById('tournamentSelect')?.addEventListener('change', function() {
        loadMatchDetails(this.value || null);
    });
});
