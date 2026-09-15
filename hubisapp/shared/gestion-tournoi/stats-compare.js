/* ============================================================
   HubISoccer — stats-compare.js
   Système Gestion Tournois — Comparer les stats
   ------------------------------------------------------------
   Correction critique : la comparaison individuelle etait un
   stub fige a zero -- { matchs: 0, buts: 0, passes: 0 } code en
   dur, commentaire "(a adapter)" dans le fichier source. allPlayers
   n'etait meme jamais peuple. Desormais reelle : charge l'effectif
   de chaque equipe du tournoi, agrege les stats depuis
   gt_player_match_stats sur les matchs du tournoi selectionne, et
   affiche une comparaison ligne par ligne (esprit des captures de
   reference : deux colonnes, une ligne par statistique).
   Tables migrees vers supabaseAuthPrive_gt_*, is_active corrige,
   jointure equipes jamais verifiee convertie en requete separee.
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
const TBL_TEAM_PLAYERS      = 'supabaseAuthPrive_gt_team_players';
const TBL_MATCHES              = 'supabaseAuthPrive_gt_matches';
const TBL_PLAYER_STATS            = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_SPORTS                     = 'supabaseAuthPrive_gt_sports';
const TBL_PROFILES                      = 'supabaseAuthPrive_profiles';

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

// Chantier 08 — la discipline suit le tournoi choisi dans le
// selecteur. On retient sport_id pour chaque tournoi charge :
// changer de tournoi change le vocabulaire de la page sans
// aucune requete supplementaire sur les tournois.
let sportParTournoi = {};
let nomSportTournoi = '';

function mot(gabarit) {
    if (!window.GTLexique) return gabarit;
    return GTLexique.remplir(gabarit, nomSportTournoi);
}
function appliquerLexique() {
    if (window.GTLexique) GTLexique.appliquer(nomSportTournoi);
}

async function suivreDiscipline(idTournoi) {
    nomSportTournoi = '';
    const idSport = sportParTournoi[idTournoi];
    if (idSport) {
        const { data: sport } = await supabaseClient
            .from(TBL_SPORTS).select('name').eq('id', idSport).maybeSingle();
        nomSportTournoi = sport ? (sport.name || '') : '';
    }
    appliquerLexique();
}
let currentCompareType = 'teams';
let allTeams = [];
let allPlayers = [];
let tournamentMatchIds = [];

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
    if (!duration) duration = 20000;
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
    if (str === null || str === undefined) return '';
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
// 11. CHARGEMENT DES TOURNOIS
// ═══════════════════════════════════════════════════════════
async function loadTournaments() {
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, sport_id')
        .eq('status', 'published')
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Erreur chargement tournois:', error);
        showToast('Erreur chargement tournois', 'error');
        return;
    }

    const select = document.getElementById('tournamentSelect');
    select.innerHTML = '<option value="">-- Sélectionnez un tournoi --</option>';
    sportParTournoi = {};
    (data || []).forEach(function(t) {
        sportParTournoi[t.id] = t.sport_id || null;
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

async function loadTournamentMatchIds() {
    const { data } = await supabaseClient.from(TBL_MATCHES).select('id').eq('tournament_id', currentTournamentId);
    tournamentMatchIds = (data || []).map(function(m) { return m.id; });
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES ENTITÉS (ÉQUIPES OU PRATIQUANTS)
// ═══════════════════════════════════════════════════════════
async function loadEntities() {
    if (!currentTournamentId) return;

    showLoader();
    await loadTournamentMatchIds();

    const firstSelect = document.getElementById('firstSelect');
    const secondSelect = document.getElementById('secondSelect');
    firstSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';
    secondSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';

    if (currentCompareType === 'teams') {
        const { data, error } = await supabaseClient
            .from(TBL_TEAMS)
            .select('id, name')
            .eq('tournament_id', currentTournamentId)
            .order('name');

        if (error) { showToast('Erreur chargement équipes', 'error'); hideLoader(); return; }

        allTeams = data || [];
        allTeams.forEach(function(team) {
            const opt1 = document.createElement('option');
            opt1.value = team.id; opt1.textContent = team.name;
            firstSelect.appendChild(opt1);
            const opt2 = opt1.cloneNode(true);
            secondSelect.appendChild(opt2);
        });
    } else {
        // Effectif de toutes les equipes du tournoi -- requetes separees
        const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id').eq('tournament_id', currentTournamentId);
        const teamIds = (teams || []).map(function(t) { return t.id; });

        if (!teamIds.length) {
            allPlayers = [];
            hideLoader();
            return;
        }

        const { data: teamPlayers } = await supabaseClient.from(TBL_TEAM_PLAYERS).select('user_id').in('team_id', teamIds);
        const playerIds = [...new Set((teamPlayers || []).map(function(p) { return p.user_id; }))];

        if (!playerIds.length) {
            allPlayers = [];
            hideLoader();
            return;
        }

        const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', playerIds);
        allPlayers = (profiles || []).map(function(p) { return { id: p.auth_uuid, name: p.full_name || mot('{Sportif} inconnu'), avatar_url: p.avatar_url }; });

        allPlayers.forEach(function(player) {
            const opt1 = document.createElement('option');
            opt1.value = player.id; opt1.textContent = player.name;
            firstSelect.appendChild(opt1);
            const opt2 = opt1.cloneNode(true);
            secondSelect.appendChild(opt2);
        });
    }

    firstSelect.disabled = false;
    secondSelect.disabled = false;
    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 13. COMPARAISON
// ═══════════════════════════════════════════════════════════
async function compare() {
    const firstId = document.getElementById('firstSelect').value;
    const secondId = document.getElementById('secondSelect').value;

    if (!firstId || !secondId) {
        document.getElementById('comparisonResults').innerHTML =
            '<div class="empty-state"><i class="fas fa-chart-line"></i><p>Sélectionnez les deux entités à comparer</p></div>';
        return;
    }
    if (firstId === secondId) {
        showToast('Veuillez sélectionner deux entités différentes.', 'warning');
        return;
    }

    showLoader();
    const resultsDiv = document.getElementById('comparisonResults');

    if (currentCompareType === 'teams') {
        const teamA = allTeams.find(function(t) { return String(t.id) === String(firstId); });
        const teamB = allTeams.find(function(t) { return String(t.id) === String(secondId); });

        const { data: matchesA } = await supabaseClient
            .from(TBL_MATCHES).select('*').eq('tournament_id', currentTournamentId)
            .or('team_a_id.eq.' + firstId + ',team_b_id.eq.' + firstId);
        const { data: matchesB } = await supabaseClient
            .from(TBL_MATCHES).select('*').eq('tournament_id', currentTournamentId)
            .or('team_a_id.eq.' + secondId + ',team_b_id.eq.' + secondId);

        const statsA = computeTeamStats(matchesA, firstId);
        const statsB = computeTeamStats(matchesB, secondId);

        resultsDiv.innerHTML = renderTeamComparisonHTML(teamA.name, teamB.name, statsA, statsB);
    } else {
        const playerA = allPlayers.find(function(p) { return p.id === firstId; });
        const playerB = allPlayers.find(function(p) { return p.id === secondId; });

        const statsA = await computePlayerStats(firstId);
        const statsB = await computePlayerStats(secondId);

        resultsDiv.innerHTML = renderPlayerComparisonHTML(playerA, playerB, statsA, statsB);
    }

    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 14. CALCUL STATISTIQUES ÉQUIPE
// ═══════════════════════════════════════════════════════════
function computeTeamStats(matches, teamId) {
    const stats = { matchs: 0, victoires: 0, nuls: 0, defaites: 0, butsPour: 0, butsContre: 0 };
    if (!matches) return stats;

    matches.forEach(function(m) {
        if (m.status !== 'completed') return;
        stats.matchs++;
        if (String(m.team_a_id) === String(teamId)) {
            stats.butsPour += m.score_a || 0;
            stats.butsContre += m.score_b || 0;
            if (m.score_a > m.score_b) stats.victoires++;
            else if (m.score_a === m.score_b) stats.nuls++;
            else stats.defaites++;
        } else {
            stats.butsPour += m.score_b || 0;
            stats.butsContre += m.score_a || 0;
            if (m.score_b > m.score_a) stats.victoires++;
            else if (m.score_b === m.score_a) stats.nuls++;
            else stats.defaites++;
        }
    });
    return stats;
}

// ═══════════════════════════════════════════════════════════
// 15. CALCUL DES STATISTIQUES INDIVIDUELLES (réel — remplace le stub)
// ═══════════════════════════════════════════════════════════
// Chantier 05 : la comparaison ne lisait que quatre colonnes.
// Le cumul passe maintenant par GTStats.agregerTournoi(), le meme
// moteur que la fiche du sportif et que l'onglet Statistiques de
// l'organisateur — les trois pages ne peuvent donc plus afficher
// des totaux differents pour le meme sportif.
async function computePlayerStats(playerId) {
    if (!tournamentMatchIds.length) {
        return GTStats.agregerTournoi([], { tournament_id: currentTournamentId, player_id: playerId });
    }

    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_STATS)
        .select('*')
        .eq('player_id', playerId)
        .in('match_id', tournamentMatchIds);

    if (error) {
        console.warn('Statistiques indisponibles :', error.message);
    }

    return GTStats.agregerTournoi(data || [], {
        tournament_id: currentTournamentId,
        player_id: playerId
    });
}

// ═══════════════════════════════════════════════════════════
// 16. RENDU HTML — ÉQUIPES
// ═══════════════════════════════════════════════════════════
function renderTeamComparisonHTML(nameA, nameB, statsA, statsB) {
    const rows = [
        { label: 'Matchs joués', a: statsA.matchs, b: statsB.matchs },
        { label: 'Victoires', a: statsA.victoires, b: statsB.victoires },
        { label: 'Nuls', a: statsA.nuls, b: statsB.nuls },
        { label: 'Défaites', a: statsA.defaites, b: statsB.defaites },
        { label: 'Buts pour', a: statsA.butsPour, b: statsB.butsPour },
        { label: 'Buts contre', a: statsA.butsContre, b: statsB.butsContre },
        { label: 'Différence de buts', a: statsA.butsPour - statsA.butsContre, b: statsB.butsPour - statsB.butsContre }
    ];
    return buildComparisonTable(nameA, nameB, rows);
}

// ═══════════════════════════════════════════════════════════
// 17. RENDU HTML — PRATIQUANTS
// ═══════════════════════════════════════════════════════════
// Les lignes comparees. Une ligne dont les deux colonnes sont a
// zero est retiree : afficher « 0 contre 0 » sur quarante
// statistiques noierait les trois qui comptent.
const LIGNES_COMPARAISON = [
    { label: 'Matchs joués',        cle: 'matches_played' },
    { label: 'Titularisations',     cle: 'matches_started' },
    { label: 'Minutes jouées',      cle: 'minutes_played', suffixe: "'" },
    { label: 'Note moyenne',        cle: 'average_rating', note: true },
    { label: 'Buts',                cle: 'goals' },
    { label: 'Passes décisives',    cle: 'assists' },
    { label: 'Buts attendus (xG)',  cle: 'expected_goals', decimal: true },
    { label: 'Tirs',                cle: 'shots_total' },
    { label: 'Tirs cadrés',         cle: 'shots_on_target' },
    { label: 'Passes réussies',     cle: 'passes_completed' },
    { label: 'Passes tentées',      cle: 'passes_attempted' },
    { label: 'Passes clés',         cle: 'key_passes' },
    { label: 'Centres réussis',     cle: 'crosses_completed' },
    { label: 'Dribbles réussis',    cle: 'dribbles_completed' },
    { label: 'Ballons récupérés',   cle: 'recoveries' },
    { label: 'Tacles gagnés',       cle: 'tackles_won' },
    { label: 'Interceptions',       cle: 'interceptions' },
    { label: 'Dégagements',         cle: 'clearances' },
    { label: 'Duels au sol gagnés', cle: 'ground_duels_won' },
    { label: 'Duels aériens gagnés',cle: 'aerial_duels_won' },
    { label: 'Fautes commises',     cle: 'fouls_committed' },
    { label: 'Fautes subies',       cle: 'fouls_suffered' },
    { label: 'Ballons perdus',      cle: 'possession_lost' },
    { label: 'Arrêts',              cle: 'saves' },
    { label: 'Buts encaissés',      cle: 'goals_conceded' },
    { label: 'Matchs sans encaisser', cle: 'clean_sheets' },
    { label: 'Distance parcourue',  cle: 'distance_km', decimal: true, suffixe: ' km' },
    { label: 'Cartons jaunes',      cle: 'yellow_cards' },
    { label: 'Cartons rouges',      cle: 'red_cards' },
    { label: 'Homme du match',      cle: 'motm_count' }
];

function renderPlayerComparisonHTML(playerA, playerB, statsA, statsB) {
    const rows = [];

    LIGNES_COMPARAISON.forEach(function(ligne) {
        const a = statsA[ligne.cle];
        const b = statsB[ligne.cle];
        const videA = a == null || Number(a) === 0;
        const videB = b == null || Number(b) === 0;
        if (videA && videB) return;

        function afficher(v) {
            if (v == null) return '—';
            if (ligne.note) return Number(v).toFixed(2);
            if (ligne.decimal) return Number(v).toFixed(2) + (ligne.suffixe || '');
            return v + (ligne.suffixe || '');
        }

        rows.push({ label: ligne.label, a: afficher(a), b: afficher(b) });
    });

    if (!rows.length) {
        rows.push({ label: 'Matchs joués', a: 0, b: 0 });
        rows.push({
            label: 'Aucune statistique enregistrée',
            a: '—',
            b: '—'
        });
    }

    return buildComparisonTable(playerA.name, playerB.name, rows, playerA.avatar_url, playerB.avatar_url);
}

// ═══════════════════════════════════════════════════════════
// 18. CONSTRUCTION DU TABLEAU COMPARATIF (ligne par ligne, façon SofaScore)
// ═══════════════════════════════════════════════════════════
function buildComparisonTable(nameA, nameB, rows, avatarA, avatarB) {
    let html = '<div class="compare-header-row">' +
               '<div class="compare-entity">' + (avatarA ? '<img src="' + avatarA + '" alt="">' : '') + '<span>' + escapeHtml(nameA) + '</span></div>' +
               '<div class="compare-entity">' + (avatarB ? '<img src="' + avatarB + '" alt="">' : '') + '<span>' + escapeHtml(nameB) + '</span></div>' +
               '</div>';

    rows.forEach(function(row) {
        const total = Math.abs(row.a) + Math.abs(row.b);
        const pctA = total > 0 ? (Math.abs(row.a) / total) * 100 : 50;
        const leadA = row.a > row.b;
        const leadB = row.b > row.a;
        html += '<div class="compare-stat-row">' +
                '<span class="compare-val ' + (leadA ? 'lead' : '') + ' tabular">' + row.a + '</span>' +
                '<div class="compare-bar-wrap"><span class="compare-label">' + escapeHtml(row.label) + '</span>' +
                '<div class="compare-bar"><div class="compare-bar-fill left" style="width:' + pctA + '%"></div><div class="compare-bar-fill right" style="width:' + (100 - pctA) + '%"></div></div></div>' +
                '<span class="compare-val ' + (leadB ? 'lead' : '') + ' tabular">' + row.b + '</span>' +
                '</div>';
    });

    return html;
}

// ═══════════════════════════════════════════════════════════
// 19. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 20. INITIALISATION
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

    await loadTournaments();

    document.getElementById('tournamentSelect')?.addEventListener('change', async function() {
        currentTournamentId = this.value;
        // Le vocabulaire d'abord, les donnees ensuite : sans cet
        // await, la liste s'ecrirait avec le mot du tournoi
        // precedent.
        await suivreDiscipline(currentTournamentId);
        if (currentTournamentId) loadEntities();
    });

    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentCompareType = btn.dataset.type;
            if (currentTournamentId) loadEntities();
        });
    });

    document.getElementById('firstSelect')?.addEventListener('change', compare);
    document.getElementById('secondSelect')?.addEventListener('change', compare);
});
