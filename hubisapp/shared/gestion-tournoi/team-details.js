/* ============================================================
   HubISoccer — team-details.js
   Gestion des tournois – Page "Détails de l'équipe"
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
// 2. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let teamData = null;
let teamId = null;
let selectedPlayerId = null;

// ═══════════════════════════════════════════════════════════
// 3. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 4. TOAST (30 secondes)
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
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
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
// 5. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 6. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    const error = !session;
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 7. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
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
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 8. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 9. RÉCUPÉRATION DE L'ID DE L'ÉQUIPE DANS L'URL
// ═══════════════════════════════════════════════════════════
function getTeamIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES DÉTAILS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamDetails() {
    if (!teamId) {
        showToast('Aucune équipe spécifiée', 'error');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .select('*')
        .eq('id', teamId)
        .single();
    hideLoader();

    if (error || !data) {
        showToast('Équipe introuvable', 'error');
        return;
    }

    teamData = data;

    // Affichage des infos
    document.getElementById('teamName').textContent = teamData.name || 'Équipe sans nom';
    document.getElementById('teamCategory').textContent = teamData.age_category || 'Non spécifiée';
    document.getElementById('teamSport').textContent = teamData.sport || 'Non spécifié';

    // Créateur
    if (teamData.creator_id) {
        const { data: creator } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('full_name')
            .eq('auth_uuid', teamData.creator_id)
            .single();
        document.getElementById('teamCreator').textContent = creator?.full_name || 'Inconnu';
    } else {
        document.getElementById('teamCreator').textContent = 'Inconnu';
    }

    document.getElementById('teamCreated').textContent = teamData.created_at
        ? new Date(teamData.created_at).toLocaleDateString('fr-FR')
        : '-';

    const logoDiv = document.getElementById('teamLogo');
    if (teamData.logo_url) {
        logoDiv.innerHTML = '<img src="' + teamData.logo_url + '" alt="Logo de l\'équipe">';
    } else {
        logoDiv.innerHTML = '<i class="fas fa-users"></i>';
    }

    // Bouton "Ajouter un joueur" visible uniquement si l'utilisateur est le créateur
    if (teamData.creator_id === currentUser.id) {
        document.getElementById('addPlayerBtn').style.display = 'inline-flex';
    } else {
        document.getElementById('addPlayerBtn').style.display = 'none';
    }

    // Charger les onglets
    await loadTeamPlayers();
    await loadTournamentsForStats();
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES JOUEURS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamPlayers() {
    if (!teamData) return;

    const { data: playersData, error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .select('id, user_id, jersey_number, position, is_captain')
        .eq('team_id', teamData.id);

    if (error) {
        console.error('Erreur chargement joueurs:', error);
        document.getElementById('playersList').innerHTML = '<p style="text-align:center;color:var(--gray);">Erreur de chargement des joueurs.</p>';
        return;
    }

    if (!playersData || playersData.length === 0) {
        document.getElementById('playersList').innerHTML = '<p style="text-align:center;color:var(--gray);">Aucun joueur dans l\'effectif.</p>';
        return;
    }

    const userIds = playersData.map(function(p) { return p.user_id; });
    const { data: profilesData } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, full_name, avatar_url')
        .in('auth_uuid', userIds);

    const profileMap = {};
    if (profilesData) {
        profilesData.forEach(function(profile) {
            profileMap[profile.auth_uuid] = profile;
        });
    }

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
                '<div class="player-name">' + (profile.full_name || 'Joueur inconnu') + '</div>' +
                '<div class="player-details">' +
                    (player.jersey_number ? '<span class="jersey">#' + player.jersey_number + '</span>' : '') +
                    (player.position ? '<span class="position">' + player.position + '</span>' : '') +
                    (player.is_captain ? '<span class="captain"><i class="fas fa-star"></i> Capitaine</span>' : '') +
                '</div>' +
            '</div>' +
            (teamData.creator_id === currentUser.id
                ? '<button class="btn-remove-player" data-player-id="' + player.id + '"><i class="fas fa-trash"></i> Retirer</button>'
                : '');
        playersListDiv.appendChild(playerDiv);
    });

    // Attacher les événements de suppression (si créateur)
    if (teamData.creator_id === currentUser.id) {
        document.querySelectorAll('.btn-remove-player').forEach(function(btn) {
            btn.addEventListener('click', function() {
                removePlayerFromTeam(btn.dataset.playerId);
            });
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 12. RECHERCHE DE JOUEUR POUR AJOUT
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) {
        document.getElementById('playerSearchResults').innerHTML = '';
        return;
    }

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, full_name, avatar_url, position')
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) {
        console.error('Erreur recherche joueurs:', error);
        return;
    }

    const resultsDiv = document.getElementById('playerSearchResults');
    resultsDiv.innerHTML = '';

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p>Aucun joueur trouvé.</p>';
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
            '<div class="player-name">' + (profile.full_name || 'Joueur inconnu') + '</div>' +
            '<div class="player-position">' + (profile.position || '') + '</div>';
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
// 13. AJOUT D'UN JOUEUR À L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function addPlayerToTeam(event) {
    event.preventDefault();

    if (!selectedPlayerId) {
        showToast('Veuillez rechercher et sélectionner un joueur', 'warning');
        return;
    }

    if (!teamData) return;

    const jersey = document.getElementById('playerJersey').value.trim();
    const position = document.getElementById('playerPosition').value.trim();
    const isCaptain = document.getElementById('playerIsCaptain').checked;

    const payload = {
        team_id: teamData.id,
        user_id: selectedPlayerId,
        jersey_number: jersey || null,
        position: position || null,
        is_captain: isCaptain || false,
        created_at: new Date().toISOString()
    };

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'ajout du joueur (peut-être déjà dans l\'équipe)', 'error');
        console.error(error);
        return;
    }

    showToast('Joueur ajouté avec succès', 'success');
    closeAddPlayerModal();
    await loadTeamPlayers();
}

// ═══════════════════════════════════════════════════════════
// 14. SUPPRESSION D'UN JOUEUR DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function removePlayerFromTeam(playerId) {
    if (!confirm('Retirer ce joueur de l\'équipe ?')) return;

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .delete()
        .eq('id', playerId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la suppression du joueur', 'error');
        console.error(error);
        return;
    }

    showToast('Joueur retiré de l\'équipe', 'info');
    await loadTeamPlayers();
}

// ═══════════════════════════════════════════════════════════
// 15. MODALE AJOUT DE JOUEUR
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
// 16. ONGLETS
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
// 17. STATISTIQUES
// ═══════════════════════════════════════════════════════════
async function loadTournamentsForStats() {
    const { data: tournoisData, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name')
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Erreur chargement tournois pour stats:', error);
        return;
    }

    const select = document.getElementById('tournamentStatsSelect');
    select.innerHTML = '<option value="">Sélectionnez un tournoi</option>';
    (tournoisData || []).forEach(function(t) {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        select.appendChild(option);
    });

    select.addEventListener('change', function() {
        loadTeamStats(this.value);
    });
}

async function loadTeamStats(tournamentId) {
    if (!tournamentId) {
        document.getElementById('teamStats').innerHTML = '<p style="text-align:center;color:var(--gray);">Veuillez sélectionner un tournoi.</p>';
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamData.id)
        .single();
    hideLoader();

    const statsDiv = document.getElementById('teamStats');
    if (error || !data) {
        statsDiv.innerHTML = '<p style="text-align:center;color:var(--gray);">Aucune statistique pour ce tournoi.</p>';
        return;
    }

    statsDiv.innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-box"><span>MJ</span><span class="stat-value">' + (data.played || 0) + '</span></div>' +
        '<div class="stat-box"><span>V</span><span class="stat-value">' + (data.wins || 0) + '</span></div>' +
        '<div class="stat-box"><span>N</span><span class="stat-value">' + (data.draws || 0) + '</span></div>' +
        '<div class="stat-box"><span>D</span><span class="stat-value">' + (data.losses || 0) + '</span></div>' +
        '<div class="stat-box"><span>BP</span><span class="stat-value">' + (data.goals_for || 0) + '</span></div>' +
        '<div class="stat-box"><span>BC</span><span class="stat-value">' + (data.goals_against || 0) + '</span></div>' +
        '<div class="stat-box highlight"><span>Pts</span><span class="stat-value">' + (data.points || 0) + '</span></div>' +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 18. MATCHS
// ═══════════════════════════════════════════════════════════
async function loadTeamMatches() {
    if (!teamData) return;

    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('id, round, team_a_id, team_b_id, score_a, score_b, match_date, status, tournament_id, gestionnairetournoi_tournaments!inner(name)')
        .or('team_a_id.eq.' + teamData.id + ',team_b_id.eq.' + teamData.id)
        .order('match_date', { ascending: false });

    const matchesDiv = document.getElementById('teamMatchesList');
    if (error) {
        matchesDiv.innerHTML = '<p style="text-align:center;color:var(--gray);">Erreur de chargement des matchs.</p>';
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        matchesDiv.innerHTML = '<p style="text-align:center;color:var(--gray);">Aucun match trouvé.</p>';
        return;
    }

    // Récupérer les noms des équipes
    const teamIds = new Set();
    data.forEach(function(m) {
        if (m.team_a_id) teamIds.add(m.team_a_id);
        if (m.team_b_id) teamIds.add(m.team_b_id);
    });
    const { data: teamsData } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .select('id, name')
        .in('id', Array.from(teamIds));
    const teamNameMap = {};
    if (teamsData) {
        teamsData.forEach(function(t) { teamNameMap[t.id] = t.name; });
    }

    matchesDiv.innerHTML = '';
    data.forEach(function(match) {
        const teamAName = teamNameMap[match.team_a_id] || 'Équipe A';
        const teamBName = teamNameMap[match.team_b_id] || 'Équipe B';
        const dateStr = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML =
            '<div class="match-header">' +
                '<span class="match-round">' + (match.round || '') + '</span>' +
                '<span class="match-date">' + dateStr + '</span>' +
            '</div>' +
            '<div class="match-teams">' +
                '<span class="team-a">' + teamAName + '</span>' +
                '<span class="match-score">' + (match.score_a || 0) + ' - ' + (match.score_b || 0) + '</span>' +
                '<span class="team-b">' + teamBName + '</span>' +
            '</div>' +
            '<div class="match-footer">' +
                '<span class="match-tournament">' + (match.gestionnairetournoi_tournaments?.name || '') + '</span>' +
                '<span class="match-status ' + match.status + '">' + match.status + '</span>' +
            '</div>';
        matchesDiv.appendChild(matchCard);
    });
}

// ═══════════════════════════════════════════════════════════
// 19. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() {
                window.location.href = '../../../index.html';
            });
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
    initTabs();

    teamId = getTeamIdFromUrl();
    if (!teamId) {
        showToast('Aucune équipe spécifiée dans l\'URL', 'error');
        return;
    }

    await loadTeamDetails();
    // Charger les matchs dès le début (l'onglet peut être caché, mais les données sont prêtes)
    await loadTeamMatches();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

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
            searchTimeout = setTimeout(function() {
                searchPlayers(query);
            }, 400);
        });
    }
});