/* ============================================================
   HubISoccer — rankings.js
   Système Gestion Tournois — Classements
   ------------------------------------------------------------
   Corrections appliquees :
   - Buteurs/Passeurs/Cartons etaient de simples messages
     statiques "bientot disponible", alors que gt_player_match_stats
     existe et contient deja goals/assists/yellow_cards/red_cards
     (saisis via match-report.html). Implemente reellement,
     agrege par footballeur sur le tournoi selectionne.
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - is_active remplace par status='published' (meme classe de
     bug que sur les toutes premieres pages reprises).
   - Jointure equipes!inner sur standings jamais verifiee ->
     convertie en requete separee, meme discipline qu'ailleurs.
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
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TEAMS          = 'supabaseAuthPrive_gt_teams';
const TBL_STANDINGS         = 'supabaseAuthPrive_gt_standings';
const TBL_MATCHES              = 'supabaseAuthPrive_gt_matches';
const TBL_PLAYER_STATS            = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_PROFILES                   = 'supabaseAuthPrive_profiles';

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
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
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
// 11. CHARGEMENT DES TOURNOIS
// ═══════════════════════════════════════════════════════════
async function loadTournaments() {
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name')
        .eq('status', 'published')
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Erreur chargement tournois:', error);
        showToast('Erreur chargement tournois', 'error');
        return;
    }

    const select = document.getElementById('tournamentSelect');
    select.innerHTML = '<option value="">-- Sélectionnez un tournoi --</option>';
    (data || []).forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

// ═══════════════════════════════════════════════════════════
// 12. CLASSEMENT ÉQUIPES (requête séparée, pas de jointure imbriquée)
// ------------------------------------------------------------
// Sensible au format du tournoi : un seul tableau si 'league' ou
// 'knockout', un tableau SEPARE par groupe si 'groups_knockout' --
// avec une ligne de qualification visible apres la position
// configuree par l'organisateur (qualifiers_per_group), plus la
// mention des "meilleurs troisiemes" si cette regle est activee.
// ═══════════════════════════════════════════════════════════
async function loadTeamsRanking() {
    const { data: tournament } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('format_type, qualifiers_per_group, best_third_place_count, qualification_explainer')
        .eq('id', currentTournamentId)
        .maybeSingle();

    const formatType = (tournament && tournament.format_type) || 'league';
    const qualifiersPerGroup = (tournament && tournament.qualifiers_per_group) || 2;
    const bestThirdPlaces = (tournament && tournament.best_third_place_count) || 0;

    renderFormatExplanation(tournament, formatType, qualifiersPerGroup, bestThirdPlaces);

    const { data: standings, error } = await supabaseClient
        .from(TBL_STANDINGS)
        .select('team_id, played, wins, draws, losses, goals_for, goals_against, points')
        .eq('tournament_id', currentTournamentId)
        .order('points', { ascending: false });

    const container = document.getElementById('teamsRanking');
    if (error) { container.innerHTML = '<p class="empty-hint">Erreur de chargement.</p>'; return; }
    if (!standings || !standings.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>Aucun classement disponible pour ce tournoi</p></div>';
        return;
    }

    const teamIds = standings.map(function(s) { return s.team_id; });
    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name, logo_url, group_name').in('id', teamIds);
    const teamMap = {};
    (teams || []).forEach(function(t) { teamMap[t.id] = t; });

    if (formatType !== 'groups_knockout') {
        container.innerHTML = renderStandingsTable(standings, teamMap, null, 0);
        return;
    }

    // Format groupes+elimination : un tableau separe par group_name.
    // Les equipes sans groupe assigne (group_name NULL) vont dans
    // "Sans groupe assigné" -- visible plutot que silencieusement
    // absentes, le temps que l'organisateur les repartisse.
    const byGroup = {};
    standings.forEach(function(s) {
        const groupName = (teamMap[s.team_id] && teamMap[s.team_id].group_name) || 'Sans groupe assigné';
        if (!byGroup[groupName]) byGroup[groupName] = [];
        byGroup[groupName].push(s);
    });

    const groupNames = Object.keys(byGroup).sort();
    let allHtml = '';
    groupNames.forEach(function(groupName) {
        const groupStandings = byGroup[groupName].slice().sort(function(a, b) { return b.points - a.points; });
        allHtml += '<div class="group-block"><h3 class="group-title"><i class="fas fa-layer-group"></i> Groupe ' + escapeHtml(groupName) + '</h3>' +
                   renderStandingsTable(groupStandings, teamMap, groupName, qualifiersPerGroup) + '</div>';
    });
    container.innerHTML = allHtml;

    if (bestThirdPlaces > 0) {
        renderBestThirdPlaces(byGroup, teamMap, qualifiersPerGroup, bestThirdPlaces);
    }
}

function renderStandingsTable(standings, teamMap, groupName, qualifiersLine) {
    let html = '<table class="ranking-table"><thead><tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Pts</th></tr></thead><tbody>';
    standings.forEach(function(s, index) {
        const team = teamMap[s.team_id] || {};
        const isQualified = qualifiersLine > 0 && (index + 1) <= qualifiersLine;
        html += '<tr class="' + (isQualified ? 'qualified-row' : '') + '">' +
                '<td class="tabular">' + (index + 1) + '</td>' +
                '<td class="team-cell">' + (team.logo_url ? '<img src="' + team.logo_url + '" alt="">' : '') + escapeHtml(team.name || 'Équipe inconnue') + '</td>' +
                '<td class="tabular">' + s.played + '</td>' +
                '<td class="tabular">' + s.wins + '</td>' +
                '<td class="tabular">' + s.draws + '</td>' +
                '<td class="tabular">' + s.losses + '</td>' +
                '<td class="tabular">' + s.goals_for + '</td>' +
                '<td class="tabular">' + s.goals_against + '</td>' +
                '<td class="tabular points-col">' + s.points + '</td>' +
                '</tr>';
        if (isQualified && (index + 1) === qualifiersLine && (index + 1) < standings.length) {
            html += '<tr class="qualif-line-row"><td colspan="9"><i class="fas fa-arrow-up"></i> Qualifié(s) pour la suite</td></tr>';
        }
    });
    html += '</tbody></table>';
    return html;
}

// Meilleurs troisiemes tous groupes confondus (regle Coupe du
// Monde / Euro) -- affiches en plus des qualifies directs de
// chaque groupe.
function renderBestThirdPlaces(byGroup, teamMap, qualifiersPerGroup, bestThirdPlaces) {
    const thirdPlaceRank = qualifiersPerGroup + 1;
    const thirds = [];
    Object.keys(byGroup).forEach(function(groupName) {
        const sorted = byGroup[groupName].slice().sort(function(a, b) { return b.points - a.points; });
        if (sorted[thirdPlaceRank - 1]) thirds.push({ standing: sorted[thirdPlaceRank - 1], groupName: groupName });
    });
    thirds.sort(function(a, b) { return b.standing.points - a.standing.points; });
    const bestThirds = thirds.slice(0, bestThirdPlaces);

    if (!bestThirds.length) return;

    let html = '<div class="best-thirds-block"><h3 class="group-title"><i class="fas fa-medal"></i> Meilleurs ' + bestThirdPlaces + ' troisièmes (qualifiés en plus)</h3>' +
               '<table class="ranking-table"><thead><tr><th>#</th><th>Équipe</th><th>Groupe</th><th>Pts</th></tr></thead><tbody>';
    bestThirds.forEach(function(entry, index) {
        const team = teamMap[entry.standing.team_id] || {};
        html += '<tr class="qualified-row"><td class="tabular">' + (index + 1) + '</td>' +
                '<td class="team-cell">' + escapeHtml(team.name || 'Équipe inconnue') + '</td>' +
                '<td>' + escapeHtml(entry.groupName) + '</td>' +
                '<td class="tabular points-col">' + entry.standing.points + '</td></tr>';
    });
    html += '</tbody></table></div>';
    document.getElementById('teamsRanking').insertAdjacentHTML('beforeend', html);
}

// Explication publique et lisible des regles de qualification pour
// CE tournoi -- pour que les visiteurs comprennent comment ça
// fonctionne sans avoir a deviner.
function renderFormatExplanation(tournament, formatType, qualifiersPerGroup, bestThirdPlaces) {
    const el = document.getElementById('formatExplanation');
    if (!el) return;

    const formatLabels = { league: 'Championnat (un seul classement général)', groups_knockout: 'Phase de groupes puis élimination directe', knockout: 'Élimination directe' };
    let text = '<strong>' + (formatLabels[formatType] || formatType) + '</strong>';

    if (formatType === 'groups_knockout') {
        text += ' — les ' + qualifiersPerGroup + ' premier(s) de chaque groupe se qualifient directement';
        if (bestThirdPlaces > 0) text += ', ainsi que les ' + bestThirdPlaces + ' meilleur(s) troisième(s) tous groupes confondus';
        text += '.';
    } else if (formatType === 'knockout') {
        text += ' — chaque rencontre élimine directement le perdant.';
    } else {
        text += ' — le classement final se fait sur l\'ensemble des rencontres.';
    }

    if (tournament && tournament.qualification_explainer) {
        text += '<br><span class="format-extra-note">' + escapeHtml(tournament.qualification_explainer) + '</span>';
    }

    el.innerHTML = text;
    el.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════
// 13. CLASSEMENTS INDIVIDUELS (buteurs, passeurs, cartons — implémentation réelle)
// ═══════════════════════════════════════════════════════════
async function loadPlayerRankings() {
    // Matchs du tournoi -- pour ne compter que les stats de CE tournoi
    const { data: matches } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id')
        .eq('tournament_id', currentTournamentId);

    const matchIds = (matches || []).map(function(m) { return m.id; });
    if (!matchIds.length) {
        renderEmptyPlayerRankings('Aucun match joué pour ce tournoi.');
        return;
    }

    const { data: stats, error } = await supabaseClient
        .from(TBL_PLAYER_STATS)
        .select('player_id, goals, assists, yellow_cards, red_cards')
        .in('match_id', matchIds);

    if (error || !stats || !stats.length) {
        renderEmptyPlayerRankings('Aucune statistique de footballeur pour ce tournoi.');
        return;
    }

    // Agregation par footballeur
    const agg = {};
    stats.forEach(function(s) {
        if (!agg[s.player_id]) agg[s.player_id] = { goals: 0, assists: 0, cards: 0 };
        agg[s.player_id].goals += s.goals || 0;
        agg[s.player_id].assists += s.assists || 0;
        agg[s.player_id].cards += (s.yellow_cards || 0) + (s.red_cards || 0);
    });

    const playerIds = Object.keys(agg);
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', playerIds);
    const profileMap = {};
    (profiles || []).forEach(function(p) { profileMap[p.auth_uuid] = p; });

    renderPlayerRanking('scorersRanking', playerIds, agg, profileMap, 'goals', 'But(s)', 'fa-futbol');
    renderPlayerRanking('assistsRanking', playerIds, agg, profileMap, 'assists', 'Passe(s)', 'fa-hands-helping');
    renderPlayerRanking('cardsRanking', playerIds, agg, profileMap, 'cards', 'Carton(s)', 'fa-square');
}

function renderPlayerRanking(containerId, playerIds, agg, profileMap, statKey, label, icon) {
    const container = document.getElementById(containerId);
    const ranked = playerIds.filter(function(id) { return agg[id][statKey] > 0; });
    ranked.sort(function(a, b) { return agg[b][statKey] - agg[a][statKey]; });

    if (!ranked.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas ' + icon + '"></i><p>Aucune donnée pour l\'instant</p></div>';
        return;
    }

    let html = '<table class="ranking-table player-ranking"><thead><tr><th>#</th><th>Footballeur</th><th>' + label + '</th></tr></thead><tbody>';
    ranked.forEach(function(playerId, index) {
        const profile = profileMap[playerId] || {};
        html += '<tr>' +
                '<td class="tabular">' + (index + 1) + '</td>' +
                '<td class="player-cell">' +
                (profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="">' : '<span class="avatar-initials-small">' + getInitials(profile.full_name || '?') + '</span>') +
                escapeHtml(profile.full_name || 'Footballeur inconnu') +
                '</td>' +
                '<td class="tabular points-col">' + agg[playerId][statKey] + '</td>' +
                '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderEmptyPlayerRankings(message) {
    ['scorersRanking', 'assistsRanking', 'cardsRanking'].forEach(function(id) {
        document.getElementById(id).innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>' + escapeHtml(message) + '</p></div>';
    });
}

// ═══════════════════════════════════════════════════════════
// 14. CHARGEMENT GLOBAL
// ═══════════════════════════════════════════════════════════
async function loadRankings() {
    if (!currentTournamentId) return;
    showLoader();
    await loadTeamsRanking();
    await loadPlayerRankings();
    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, ONGLETS, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });
}

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
    initTabs();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournaments();

    document.getElementById('tournamentSelect')?.addEventListener('change', function() {
        currentTournamentId = this.value;
        if (currentTournamentId) loadRankings();
    });
});
