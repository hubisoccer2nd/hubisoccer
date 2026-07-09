/* ============================================================
   HubISoccer — stats-compare.js
   Comparaison de deux équipes ou joueurs – Gestion Tournois
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
let currentTournamentId = null;
let currentCompareType = 'teams'; // 'teams' ou 'players'
let allTeams = [];
let allPlayers = [];

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
// 9. CHARGEMENT DES TOURNOIS
// ═══════════════════════════════════════════════════════════
async function loadTournaments() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name')
        .eq('is_active', true)
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
// 10. CHARGEMENT DES ENTITÉS (ÉQUIPES OU JOUEURS)
// ═══════════════════════════════════════════════════════════
async function loadEntities() {
    if (!currentTournamentId) return;

    showLoader();
    const firstSelect = document.getElementById('firstSelect');
    const secondSelect = document.getElementById('secondSelect');

    firstSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';
    secondSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';

    if (currentCompareType === 'teams') {
        const { data, error } = await supabaseClient
            .from('gestionnairetournoi_teams')
            .select('id, name')
            .eq('tournament_id', currentTournamentId)
            .order('name');

        if (error) {
            showToast('Erreur chargement équipes', 'error');
            hideLoader();
            return;
        }

        allTeams = data || [];
        allTeams.forEach(function(team) {
            const opt1 = document.createElement('option');
            opt1.value = team.id;
            opt1.textContent = team.name;
            firstSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = team.id;
            opt2.textContent = team.name;
            secondSelect.appendChild(opt2);
        });
    } else {
        // Joueurs : on récupère tous les joueurs des équipes du tournoi
        const { data, error } = await supabaseClient
            .from('gestionnairetournoi_team_players')
            .select('user_id, gestionnairetournoi_teams!inner(tournament_id)')
            .eq('gestionnairetournoi_teams.tournament_id', currentTournamentId);

        if (error) {
            showToast('Erreur chargement joueurs', 'error');
            hideLoader();
            return;
        }

        // Récupérer les profils correspondants
        const userIds = data.map(function(p) { return p.user_id; });
        const { data: profiles } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('auth_uuid, full_name')
            .in('auth_uuid', userIds);

        const profileMap = {};
        if (profiles) {
            profiles.forEach(function(p) {
                profileMap[p.auth_uuid] = p.full_name || 'Inconnu';
            });
        }

        allPlayers = data.map(function(p) {
            return { id: p.user_id, name: profileMap[p.user_id] || 'Inconnu' };
        });

        allPlayers.forEach(function(player) {
            const opt1 = document.createElement('option');
            opt1.value = player.id;
            opt1.textContent = player.name;
            firstSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = player.id;
            opt2.textContent = player.name;
            secondSelect.appendChild(opt2);
        });
    }

    firstSelect.disabled = false;
    secondSelect.disabled = false;
    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 11. COMPARAISON
// ═══════════════════════════════════════════════════════════
async function compare() {
    const firstId = document.getElementById('firstSelect').value;
    const secondId = document.getElementById('secondSelect').value;

    if (!firstId || !secondId) {
        document.getElementById('comparisonResults').innerHTML =
            '<div class="empty-state"><i class="fas fa-chart-line"></i><p>Sélectionnez les deux entités à comparer</p></div>';
        return;
    }

    showLoader();
    const resultsDiv = document.getElementById('comparisonResults');

    if (currentCompareType === 'teams') {
        const teamA = allTeams.find(function(t) { return t.id == firstId; });
        const teamB = allTeams.find(function(t) { return t.id == secondId; });

        // Récupérer les statistiques des deux équipes (matchs)
        const { data: matchesA } = await supabaseClient
            .from('gestionnairetournoi_matches')
            .select('*')
            .eq('tournament_id', currentTournamentId)
            .or('team_a_id.eq.' + firstId + ',team_b_id.eq.' + firstId);

        const { data: matchesB } = await supabaseClient
            .from('gestionnairetournoi_matches')
            .select('*')
            .eq('tournament_id', currentTournamentId)
            .or('team_a_id.eq.' + secondId + ',team_b_id.eq.' + secondId);

        const statsA = computeTeamStats(matchesA, firstId);
        const statsB = computeTeamStats(matchesB, secondId);

        resultsDiv.innerHTML = renderComparisonHTML(teamA.name, teamB.name, statsA, statsB);
    } else {
        const playerA = allPlayers.find(function(p) { return p.id === firstId; });
        const playerB = allPlayers.find(function(p) { return p.id === secondId; });

        // Statistiques joueurs : nombre de matchs joués, buts (à adapter)
        const statsA = { matchs: 0, buts: 0, passes: 0 };
        const statsB = { matchs: 0, buts: 0, passes: 0 };

        resultsDiv.innerHTML = renderComparisonHTML(playerA.name, playerB.name, statsA, statsB);
    }

    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 12. CALCUL STATISTIQUES ÉQUIPE
// ═══════════════════════════════════════════════════════════
function computeTeamStats(matches, teamId) {
    if (!matches) return { matchs: 0, victoires: 0, nuls: 0, defaites: 0, butsPour: 0, butsContre: 0 };

    let stats = { matchs: 0, victoires: 0, nuls: 0, defaites: 0, butsPour: 0, butsContre: 0 };

    matches.forEach(function(m) {
        if (m.status !== 'completed') return;
        stats.matchs++;
        if (m.team_a_id == teamId) {
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
// 13. RENDU HTML DE LA COMPARAISON
// ═══════════════════════════════════════════════════════════
function renderComparisonHTML(nameA, nameB, statsA, statsB) {
    return '<div class="comparison-grid">' +
           '<div class="comparison-col">' +
           '<h3>' + escapeHtml(nameA) + '</h3>' +
           '<div class="stat-row"><span>Matchs</span><span>' + statsA.matchs + '</span></div>' +
           '<div class="stat-row"><span>Victoires</span><span>' + (statsA.victoires || statsA.buts || 0) + '</span></div>' +
           '</div>' +
           '<div class="comparison-col">' +
           '<h3>' + escapeHtml(nameB) + '</h3>' +
           '<div class="stat-row"><span>Matchs</span><span>' + statsB.matchs + '</span></div>' +
           '<div class="stat-row"><span>Victoires</span><span>' + (statsB.victoires || statsB.buts || 0) + '</span></div>' +
           '</div>' +
           '</div>';
}

// ═══════════════════════════════════════════════════════════
// 14. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 15. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();

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

    await loadTournaments();

    document.getElementById('tournamentSelect')?.addEventListener('change', function() {
        currentTournamentId = this.value;
        if (currentTournamentId) {
            loadEntities();
        }
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