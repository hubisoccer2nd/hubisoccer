/* ============================================================
   HubISoccer — player-stats.js
   Statistiques d'un joueur (détail par match)
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
// 9. CHARGEMENT DES STATISTIQUES GLOBALES
// ═══════════════════════════════════════════════════════════
async function loadGlobalStats() {
    if (!userProfile) return;

    // Agréger les statistiques du joueur sur tous les matchs
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_player_match_stats')
        .select('goals, assists, yellow_cards, red_cards')
        .eq('player_id', currentUser.id);

    if (error) {
        console.error('Erreur chargement stats:', error);
        showToast('Erreur chargement des statistiques', 'error');
        return;
    }

    if (!data || data.length === 0) {
        document.getElementById('totalGoals').textContent = '0';
        document.getElementById('totalAssists').textContent = '0';
        document.getElementById('totalYellow').textContent = '0';
        document.getElementById('totalRed').textContent = '0';
        document.getElementById('totalMatches').textContent = '0';
        return;
    }

    let totalGoals = 0, totalAssists = 0, totalYellow = 0, totalRed = 0;
    data.forEach(function(stat) {
        totalGoals += stat.goals || 0;
        totalAssists += stat.assists || 0;
        totalYellow += stat.yellow_cards || 0;
        totalRed += stat.red_cards || 0;
    });

    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('totalAssists').textContent = totalAssists;
    document.getElementById('totalYellow').textContent = totalYellow;
    document.getElementById('totalRed').textContent = totalRed;
    document.getElementById('totalMatches').textContent = data.length;
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES TOURNOIS DU JOUEUR (pour le filtre)
// ═══════════════════════════════════════════════════════════
async function loadPlayerTournaments() {
    if (!userProfile) return;

    // Récupérer les IDs des tournois où le joueur a des stats
    const { data: matchesData, error: matchesError } = await supabaseClient
        .from('gestionnairetournoi_player_match_stats')
        .select('match_id')
        .eq('player_id', currentUser.id);

    if (matchesError || !matchesData || matchesData.length === 0) {
        document.getElementById('tournamentSelect').innerHTML = '<option value="">Tous les tournois</option>';
        return;
    }

    const matchIds = matchesData.map(function(m) { return m.match_id; });

    // Récupérer les tournois correspondants
    const { data: tournaments, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('tournament_id')
        .in('id', matchIds);

    if (error || !tournaments) {
        document.getElementById('tournamentSelect').innerHTML = '<option value="">Tous les tournois</option>';
        return;
    }

    // Dédupliquer les IDs de tournois
    const tournamentIds = [...new Set(tournaments.map(function(t) { return t.tournament_id; }))];

    // Charger les noms des tournois
    const { data: tournamentsData, error: tError } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name')
        .in('id', tournamentIds)
        .order('start_date', { ascending: false });

    if (tError || !tournamentsData) {
        document.getElementById('tournamentSelect').innerHTML = '<option value="">Tous les tournois</option>';
        return;
    }

    const select = document.getElementById('tournamentSelect');
    select.innerHTML = '<option value="">Tous les tournois</option>';
    tournamentsData.forEach(function(t) {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        select.appendChild(option);
    });
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DU DÉTAIL PAR MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchDetails(tournamentId) {
    if (!userProfile) return;

    let query = supabaseClient
        .from('gestionnairetournoi_player_match_stats')
        .select('id, match_id, goals, assists, yellow_cards, red_cards, created_at, matches:match_id ( tournament_id, team_a_id, team_b_id, match_date )')
        .eq('player_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (tournamentId) {
        // Filtrer par tournoi : on filtre après avoir récupéré les matchs
        // On va récupérer les matchs du tournoi d'abord, puis les stats
        const { data: matchesInTournament } = await supabaseClient
            .from('gestionnairetournoi_matches')
            .select('id')
            .eq('tournament_id', tournamentId);
        if (matchesInTournament && matchesInTournament.length > 0) {
            const matchIds = matchesInTournament.map(function(m) { return m.id; });
            query = query.in('match_id', matchIds);
        } else {
            // Aucun match dans ce tournoi
            document.getElementById('matchesStatsList').innerHTML = '<p>Aucun match dans ce tournoi.</p>';
            return;
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erreur chargement détails matchs:', error);
        showToast('Erreur chargement des détails', 'error');
        return;
    }

    const listContainer = document.getElementById('matchesStatsList');
    if (!data || data.length === 0) {
        listContainer.innerHTML = '<p>Aucune statistique de match trouvée.</p>';
        return;
    }

    // Pour chaque stat, récupérer les noms des équipes et du tournoi
    let html = '<div class="matches-list">';
    for (const stat of data) {
        const match = stat.matches;
        if (!match) continue;

        // Récupérer les noms des équipes
        let teamAName = 'Équipe A', teamBName = 'Équipe B';
        if (match.team_a_id) {
            const { data: teamA } = await supabaseClient
                .from('gestionnairetournoi_teams')
                .select('name')
                .eq('id', match.team_a_id)
                .single();
            if (teamA) teamAName = teamA.name;
        }
        if (match.team_b_id) {
            const { data: teamB } = await supabaseClient
                .from('gestionnairetournoi_teams')
                .select('name')
                .eq('id', match.team_b_id)
                .single();
            if (teamB) teamBName = teamB.name;
        }

        // Récupérer le nom du tournoi
        let tournamentName = '';
        if (match.tournament_id) {
            const { data: tData } = await supabaseClient
                .from('gestionnairetournoi_tournaments')
                .select('name')
                .eq('id', match.tournament_id)
                .single();
            if (tData) tournamentName = tData.name;
        }

        const matchDate = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';

        html += '<div class="match-stat-item">' +
                '<div class="match-header">' +
                '<span class="match-date"><i class="fas fa-calendar-alt"></i> ' + matchDate + '</span>' +
                '<span class="match-teams">' + teamAName + ' vs ' + teamBName + '</span>' +
                (tournamentName ? '<span class="match-tournament"><i class="fas fa-trophy"></i> ' + tournamentName + '</span>' : '') +
                '</div>' +
                '<div class="match-stats">' +
                '<span><i class="fas fa-futbol"></i> Buts : ' + (stat.goals || 0) + '</span>' +
                '<span><i class="fas fa-handshake"></i> Passes : ' + (stat.assists || 0) + '</span>' +
                '<span><i class="fas fa-square" style="color:#f39c12;"></i> Jaunes : ' + (stat.yellow_cards || 0) + '</span>' +
                '<span><i class="fas fa-square" style="color:#dc3545;"></i> Rouges : ' + (stat.red_cards || 0) + '</span>' +
                '</div>' +
                '</div>';
    }
    html += '</div>';
    listContainer.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 12. MISE À JOUR DE LA CARTE INFO JOUEUR
// ═══════════════════════════════════════════════════════════
function updatePlayerInfoCard() {
    if (!userProfile) return;

    document.getElementById('playerName').textContent = userProfile.full_name || 'Joueur';
    // Avatar
    const avatarContainer = document.getElementById('playerAvatar');
    if (avatarContainer) {
        if (userProfile.avatar_url) {
            avatarContainer.innerHTML = '<img src="' + userProfile.avatar_url + '" alt="Avatar">';
        } else {
            avatarContainer.innerHTML = '<div class="avatar-initials-large">' + getInitials(userProfile.full_name || 'J') + '</div>';
        }
    }

    // Pour l'instant, les détails position, numéro, équipe, membre depuis sont à compléter avec d'autres tables
    document.getElementById('playerPosition').textContent = userProfile.position || '-';
    document.getElementById('playerNumber').textContent = userProfile.jersey_number || '-';
    document.getElementById('playerTeam').textContent = userProfile.club || '-';
    document.getElementById('playerSince').textContent = userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('fr-FR') : '-';
}

// ═══════════════════════════════════════════════════════════
// 13. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 14. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    // Mettre à jour la carte info joueur
    updatePlayerInfoCard();

    // Charger les statistiques globales
    await loadGlobalStats();

    // Charger les tournois du joueur et peupler le filtre
    await loadPlayerTournaments();

    // Afficher tous les matchs par défaut
    await loadMatchDetails(null);

    // Écouter le changement de filtre tournoi
    document.getElementById('tournamentSelect')?.addEventListener('change', function() {
        const tournamentId = this.value;
        loadMatchDetails(tournamentId || null);
    });
});