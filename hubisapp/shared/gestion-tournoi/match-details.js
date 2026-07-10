/* ============================================================
   HubISoccer — match-details.js
   Détails d'un match (score, événements, rapports)
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
let matchId = null;

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
// 9. RÉCUPÉRATION DE L'ID DU MATCH DEPUIS L'URL
// ═══════════════════════════════════════════════════════════
function getMatchIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES DÉTAILS DU MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchDetails(matchId) {
    if (!matchId) {
        showToast('Aucun match spécifié.', 'error');
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('*, team_a:team_a_id (name, logo_url), team_b:team_b_id (name, logo_url), tournament:tournament_id (name, stream_url)')
        .eq('id', matchId)
        .single();
    hideLoader();

    if (error || !match) {
        showToast('Match introuvable.', 'error');
        return;
    }

    // Mise à jour du titre et des infos
    document.getElementById('matchTitle').textContent =
        match.team_a.name + ' vs ' + match.team_b.name + ' — ' + match.tournament.name;
    document.getElementById('homeTeamName').textContent = match.team_a.name;
    document.getElementById('awayTeamName').textContent = match.team_b.name;
    document.getElementById('homeScore').textContent = match.score_a || 0;
    document.getElementById('awayScore').textContent = match.score_b || 0;

    // Statut du match
    const statusMap = {
        'scheduled': 'Programmé',
        'live': 'En direct',
        'completed': 'Terminé'
    };
    const statusLabel = statusMap[match.status] || match.status;
    const statusClass = match.status === 'live' ? 'status-live' : (match.status === 'completed' ? 'status-completed' : 'status-scheduled');
    document.getElementById('matchStatus').innerHTML =
        '<span class="' + statusClass + '">' + statusLabel + '</span>';
    document.getElementById('matchMeta').textContent =
        'Tournoi : ' + match.tournament.name + ' — ' + (match.match_date ? new Date(match.match_date).toLocaleString('fr-FR') : '');

    // Stream
    const streamDiv = document.getElementById('matchStream');
    if (match.tournament.stream_url) {
        streamDiv.innerHTML = '<iframe src="' + match.tournament.stream_url + '" frameborder="0" allowfullscreen></iframe>';
    } else {
        streamDiv.innerHTML = '<p>Aucun stream disponible.</p>';
    }

    // Événements / statistiques des joueurs
    await loadMatchEvents(matchId);
    await loadMatchReports(matchId);
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES ÉVÉNEMENTS (STATISTIQUES JOUEURS)
// ═══════════════════════════════════════════════════════════
async function loadMatchEvents(matchId) {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_player_match_stats')
        .select('id, player_id, goals, assists, yellow_cards, red_cards')
        .eq('match_id', matchId);

    const eventsContainer = document.getElementById('matchEvents');
    if (error || !data || data.length === 0) {
        eventsContainer.innerHTML = '<p>Aucun événement enregistré.</p>';
        return;
    }

    // Récupérer les noms des joueurs
    const playerIds = data.map(function(stat) { return stat.player_id; });
    const { data: profiles } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, full_name')
        .in('auth_uuid', playerIds);

    const profileMap = {};
    if (profiles) {
        profiles.forEach(function(p) {
            profileMap[p.auth_uuid] = p.full_name || 'Joueur inconnu';
        });
    }

    let html = '';
    data.forEach(function(stat) {
        const playerName = profileMap[stat.player_id] || 'Joueur inconnu';
        let events = '';
        if (stat.goals > 0) events += '⚽ ' + stat.goals + ' but(s) ';
        if (stat.assists > 0) events += '🎯 ' + stat.assists + ' passe(s) ';
        if (stat.yellow_cards > 0) events += '🟨 ' + stat.yellow_cards + ' jaune(s) ';
        if (stat.red_cards > 0) events += '🟥 ' + stat.red_cards + ' rouge(s) ';

        if (events) {
            html += '<div class="event-item">' +
                    '<span class="event-player">' + playerName + '</span>' +
                    '<span class="event-details">' + events + '</span>' +
                    '</div>';
        }
    });

    if (!html) {
        html = '<p>Aucun événement enregistré.</p>';
    }

    eventsContainer.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES RAPPORTS (placeholder)
// ═══════════════════════════════════════════════════════════
async function loadMatchReports(matchId) {
    const container = document.getElementById('matchReports');
    // Pour l'instant, il n'y a pas de table de rapports ; on affiche un message par défaut.
    container.innerHTML = '<p>Aucun rapport pour ce match.</p>';
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

    document.getElementById('refreshBtn')?.addEventListener('click', function() {
        if (matchId) loadMatchDetails(matchId);
    });

    matchId = getMatchIdFromURL();
    if (matchId) {
        await loadMatchDetails(matchId);
    } else {
        document.getElementById('matchTitle').textContent = 'Match non spécifié.';
    }
});