/* ============================================================
   HubISoccer — team-details.js
   Système Gestion Tournois — Détails d'une équipe
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Le controle de permission ("Ajouter un joueur" visible
     seulement pour le proprietaire) comparait a team.creator_id
     -- un champ que mon propre addTeam() (manage-tournament.js)
     n'ecrit jamais. Remplace par tournament.created_by, le meme
     modele de permission utilise partout ailleurs sur ce systeme.
   - teamData.sport n'existe pas sur la table equipes (le sport
     vit sur le tournoi) -- affichait toujours "Non specifie".
     Corrige : recupere via le tournoi de l'equipe.
   - Jointure matchs -> tournois convertie en deux requetes
     separees, meme principe applique partout depuis l'incident
     sur manage-tournament (ne plus dependre d'une relation non
     verifiee, meme quand elle semble plausible).
   - La logique joueurs (recherche par vrai compte utilisateur,
     deux requetes separees deja) etait deja correcte et deja
     sure -- conservee telle quelle.
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
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS      = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS         = 'supabaseAuthPrive_gt_tournaments';
const TBL_SPORTS                = 'supabaseAuthPrive_gt_sports';
const TBL_MATCHES                  = 'supabaseAuthPrive_gt_matches';
const TBL_STANDINGS                   = 'supabaseAuthPrive_gt_standings';
const TBL_PROFILES                       = 'supabaseAuthPrive_profiles';

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
let teamData = null;
let teamTournament = null;
let teamId = null;
let selectedPlayerId = null;
let isTeamOwner = false;

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
// 11. RÉCUPÉRATION DE L'ID DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
function getTeamIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES DÉTAILS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamDetails() {
    if (!teamId) {
        showToast('Aucune équipe spécifiée', 'error');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('id', teamId)
        .single();

    if (error || !data) {
        hideLoader();
        showToast('Équipe introuvable', 'error');
        return;
    }
    teamData = data;

    // Tournoi de l'equipe -- requete separee (donne le sport ET
    // sert de base au controle de permission)
    if (teamData.tournament_id) {
        const { data: tournament } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('id, name, created_by, sport_id')
            .eq('id', teamData.tournament_id)
            .maybeSingle();
        teamTournament = tournament || null;

        if (teamTournament && teamTournament.sport_id) {
            const { data: sport } = await supabaseClient
                .from(TBL_SPORTS)
                .select('name')
                .eq('id', teamTournament.sport_id)
                .maybeSingle();
            document.getElementById('teamSport').textContent = sport ? sport.name : 'Non spécifié';
        } else {
            document.getElementById('teamSport').textContent = 'Non spécifié';
        }
    } else {
        document.getElementById('teamSport').textContent = 'Non spécifié';
    }

    hideLoader();

    document.getElementById('teamName').textContent = teamData.name || 'Équipe sans nom';
    document.getElementById('teamCategory').textContent = teamData.age_category || 'Non spécifiée';
    document.getElementById('teamCreated').textContent = teamData.created_at
        ? new Date(teamData.created_at).toLocaleDateString('fr-FR')
        : '—';

    // Createur de l'equipe -- affiche l'organisateur du tournoi
    // (le champ team.creator_id n'est jamais renseigne par
    // manage-tournament.js, le vrai proprietaire est l'organisateur
    // du tournoi auquel l'equipe appartient)
    if (teamTournament && teamTournament.created_by) {
        const { data: creator } = await supabaseClient
            .from(TBL_PROFILES)
            .select('full_name')
            .eq('auth_uuid', teamTournament.created_by)
            .maybeSingle();
        document.getElementById('teamCreator').textContent = creator?.full_name || 'Inconnu';
    } else {
        document.getElementById('teamCreator').textContent = 'Inconnu';
    }

    const logoDiv = document.getElementById('teamLogo');
    logoDiv.innerHTML = teamData.logo_url
        ? '<img src="' + teamData.logo_url + '" alt="Logo de l\'équipe">'
        : '<i class="fas fa-users"></i>';

    // "Ajouter un joueur" visible uniquement pour l'organisateur
    // du tournoi (meme modele de permission que Gerer un tournoi)
    isTeamOwner = !!(teamTournament && teamTournament.created_by === currentUser.id);
    document.getElementById('addPlayerBtn').style.display = isTeamOwner ? 'inline-flex' : 'none';

    await loadTeamPlayers();
    await loadTournamentsForStats();
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT DES JOUEURS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamPlayers() {
    if (!teamData) return;

    const { data: playersData, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, jersey_number, position, is_captain')
        .eq('team_id', teamData.id);

    if (error) {
        console.error('Erreur chargement joueurs:', error.message);
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Erreur de chargement des joueurs.</p>';
        return;
    }

    if (!playersData || playersData.length === 0) {
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Aucun joueur dans l\'effectif.</p>';
        return;
    }

    const userIds = playersData.map(function(p) { return p.user_id; });
    const { data: profilesData } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .in('auth_uuid', userIds);

    const profileMap = {};
    (profilesData || []).forEach(function(profile) { profileMap[profile.auth_uuid] = profile; });

    const playersListDiv = document.getElementById('playersList');
    playersListDiv.innerHTML = '';

    playersData.forEach(function(player) {
        const profile = profileMap[player.user_id] || {};
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-info">' +
                '<div class="player-name">' + escapeHtml(profile.full_name || 'Joueur inconnu') + '</div>' +
                '<div class="player-details">' +
                    (player.jersey_number ? '<span class="jersey">#' + escapeHtml(String(player.jersey_number)) + '</span>' : '') +
                    (player.position ? '<span class="position">' + escapeHtml(player.position) + '</span>' : '') +
                    (player.is_captain ? '<span class="captain"><i class="fas fa-star"></i> Capitaine</span>' : '') +
                '</div>' +
            '</div>' +
            (isTeamOwner ? '<button class="btn-remove-player" data-player-id="' + player.id + '"><i class="fas fa-trash"></i></button>' : '');
        playersListDiv.appendChild(playerDiv);
    });

    if (isTeamOwner) {
        document.querySelectorAll('.btn-remove-player').forEach(function(btn) {
            btn.addEventListener('click', function() { removePlayerFromTeam(btn.dataset.playerId); });
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 14. RECHERCHE DE JOUEUR POUR AJOUT
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) {
        document.getElementById('playerSearchResults').innerHTML = '';
        return;
    }

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) { console.error('Erreur recherche joueurs:', error.message); return; }

    const resultsDiv = document.getElementById('playerSearchResults');
    resultsDiv.innerHTML = '';

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p class="empty-hint">Aucun joueur trouvé.</p>';
        return;
    }

    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-name">' + escapeHtml(profile.full_name || 'Joueur inconnu') + '</div>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            document.getElementById('playerSearch').value = profile.full_name || '';
            resultsDiv.innerHTML = '';
            showToast('Joueur sélectionné : ' + profile.full_name, 'success');
        });
        resultsDiv.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════
// 15. AJOUT / SUPPRESSION D'UN JOUEUR
// ═══════════════════════════════════════════════════════════
async function addPlayerToTeam(event) {
    event.preventDefault();

    if (!selectedPlayerId) { showToast('Veuillez rechercher et sélectionner un joueur.', 'warning'); return; }
    if (!teamData) return;

    const jersey = document.getElementById('playerJersey').value.trim();
    const position = document.getElementById('playerPosition').value.trim();
    const isCaptain = document.getElementById('playerIsCaptain').checked;

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .insert([{
            team_id: teamData.id,
            user_id: selectedPlayerId,
            jersey_number: jersey || null,
            position: position || null,
            is_captain: isCaptain || false
        }]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'ajout du joueur (peut-être déjà dans l\'équipe).', 'error');
        return;
    }

    showToast('Joueur ajouté avec succès', 'success');
    closeAddPlayerModal();
    await loadTeamPlayers();
}

async function removePlayerFromTeam(playerId) {
    if (!confirm('Retirer ce joueur de l\'équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAM_PLAYERS).delete().eq('id', playerId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); return; }
    showToast('Joueur retiré de l\'équipe', 'info');
    await loadTeamPlayers();
}

// ═══════════════════════════════════════════════════════════
// 16. MODALE AJOUT DE JOUEUR
// ═══════════════════════════════════════════════════════════
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.getElementById('playerSearch').value = '';
    document.getElementById('playerSearchResults').innerHTML = '';
    selectedPlayerId = null;
    document.getElementById('addPlayerModal').style.display = 'flex';
}
function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 17. ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 18. STATISTIQUES
// ═══════════════════════════════════════════════════════════
async function loadTournamentsForStats() {
    const { data: tournoisData, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name')
        .order('start_date', { ascending: false });

    if (error) { console.error('Erreur chargement tournois pour stats:', error.message); return; }

    const select = document.getElementById('tournamentStatsSelect');
    select.innerHTML = '<option value="">Sélectionnez un tournoi</option>';
    (tournoisData || []).forEach(function(t) {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        select.appendChild(option);
    });

    select.addEventListener('change', function() { loadTeamStats(this.value); });
}

async function loadTeamStats(tournamentId) {
    const statsDiv = document.getElementById('teamStats');
    if (!tournamentId) {
        statsDiv.innerHTML = '<p class="empty-hint">Veuillez sélectionner un tournoi.</p>';
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_STANDINGS)
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamData.id)
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        statsDiv.innerHTML = '<p class="empty-hint">Aucune statistique pour ce tournoi.</p>';
        return;
    }

    statsDiv.innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-box"><span class="stat-label">MJ</span><span class="stat-value tabular">' + (data.played || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">V</span><span class="stat-value tabular">' + (data.wins || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">N</span><span class="stat-value tabular">' + (data.draws || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">D</span><span class="stat-value tabular">' + (data.losses || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">BP</span><span class="stat-value tabular">' + (data.goals_for || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">BC</span><span class="stat-value tabular">' + (data.goals_against || 0) + '</span></div>' +
        '<div class="stat-box highlight"><span class="stat-label">Pts</span><span class="stat-value tabular">' + (data.points || 0) + '</span></div>' +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 19. MATCHS (deux requetes separees, pas de jointure imbriquee)
// ═══════════════════════════════════════════════════════════
async function loadTeamMatches() {
    if (!teamData) return;

    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, round, team_a_id, team_b_id, score_a, score_b, match_date, status, tournament_id')
        .or('team_a_id.eq.' + teamData.id + ',team_b_id.eq.' + teamData.id)
        .order('match_date', { ascending: false });

    const matchesDiv = document.getElementById('teamMatchesList');
    if (error) {
        matchesDiv.innerHTML = '<p class="empty-hint">Erreur de chargement des matchs.</p>';
        console.error(error.message);
        return;
    }
    if (!data || data.length === 0) {
        matchesDiv.innerHTML = '<p class="empty-hint">Aucun match trouvé.</p>';
        return;
    }

    // Noms d'equipes -- requete separee
    const teamIds = new Set();
    data.forEach(function(m) { if (m.team_a_id) teamIds.add(m.team_a_id); if (m.team_b_id) teamIds.add(m.team_b_id); });
    const { data: teamsData } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', Array.from(teamIds));
    const teamNameMap = {};
    (teamsData || []).forEach(function(t) { teamNameMap[t.id] = t.name; });

    // Noms de tournois -- requete separee (remplace la jointure imbriquee)
    const tournamentIds = [...new Set(data.map(function(m) { return m.tournament_id; }).filter(Boolean))];
    let tournamentNameMap = {};
    if (tournamentIds.length) {
        const { data: tournamentsData } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').in('id', tournamentIds);
        (tournamentsData || []).forEach(function(t) { tournamentNameMap[t.id] = t.name; });
    }

    matchesDiv.innerHTML = '';
    data.forEach(function(match) {
        const teamAName = teamNameMap[match.team_a_id] || 'Équipe A';
        const teamBName = teamNameMap[match.team_b_id] || 'Équipe B';
        const tournamentName = tournamentNameMap[match.tournament_id] || '';
        const dateStr = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML =
            '<div class="match-header">' +
                '<span class="match-round">' + escapeHtml(match.round || '') + '</span>' +
                '<span class="match-date">' + dateStr + '</span>' +
            '</div>' +
            '<div class="match-teams">' +
                '<span class="team-a">' + escapeHtml(teamAName) + '</span>' +
                '<span class="match-score tabular">' + (match.score_a ?? 0) + ' - ' + (match.score_b ?? 0) + '</span>' +
                '<span class="team-b">' + escapeHtml(teamBName) + '</span>' +
            '</div>' +
            '<div class="match-footer">' +
                '<span class="match-tournament">' + escapeHtml(tournamentName) + '</span>' +
                '<span class="match-status status-' + match.status + '">' + escapeHtml(match.status) + '</span>' +
            '</div>';
        matchesDiv.appendChild(matchCard);
    });
}

// ═══════════════════════════════════════════════════════════
// 20. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 21. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    teamId = getTeamIdFromUrl();
    if (!teamId) {
        showToast('Aucune équipe spécifiée dans l\'URL', 'error');
        return;
    }

    await loadTeamDetails();
    await loadTeamMatches();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('addPlayerBtn')?.addEventListener('click', openAddPlayerModal);

    document.querySelectorAll('#addPlayerModal .close-modal, #addPlayerModal .btn-cancel').forEach(function(el) {
        el.addEventListener('click', closeAddPlayerModal);
    });
    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayerToTeam);

    const playerSearchInput = document.getElementById('playerSearch');
    if (playerSearchInput) {
        let searchTimeout;
        playerSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            searchTimeout = setTimeout(function() { searchPlayers(query); }, 400);
        });
    }
});
