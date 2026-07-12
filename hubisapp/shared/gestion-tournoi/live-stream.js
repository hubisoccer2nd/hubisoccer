/* ============================================================
   HubISoccer — live-stream.js
   Page Live Stream – Gestion des tournois
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
let selectedMatch = null;
let liveStatsSubscription = null;
let matchEventsSubscription = null;

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
// 9. CHARGEMENT DES MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('id, match_date, status, team_a_id, team_b_id, score_a, score_b')
        .eq('status', 'live')
        .order('match_date', { ascending: false });

    if (error) {
        console.error('Erreur chargement matchs:', error);
        showToast('Erreur chargement des matchs', 'error');
        return;
    }

    const select = document.getElementById('matchSelect');
    select.innerHTML = '<option value="">-- Choisir un match --</option>';

    if (!data || data.length === 0) {
        select.innerHTML = '<option value="">Aucun match en direct</option>';
        return;
    }

    // Récupérer les noms des équipes pour chaque match
    for (const match of data) {
        let teamAName = 'Équipe A';
        let teamBName = 'Équipe B';

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

        const option = document.createElement('option');
        option.value = match.id;
        option.textContent = teamAName + ' vs ' + teamBName + ' (' + (match.score_a || 0) + '-' + (match.score_b || 0) + ')';
        option.dataset.teamA = teamAName;
        option.dataset.teamB = teamBName;
        option.dataset.scoreA = match.score_a || 0;
        option.dataset.scoreB = match.score_b || 0;
        select.appendChild(option);
    }
}

// ═══════════════════════════════════════════════════════════
// 10. SÉLECTION D'UN MATCH
// ═══════════════════════════════════════════════════════════
async function selectMatch(matchId) {
    if (liveStatsSubscription) {
        liveStatsSubscription.unsubscribe();
        liveStatsSubscription = null;
    }
    if (matchEventsSubscription) {
        matchEventsSubscription.unsubscribe();
        matchEventsSubscription = null;
    }

    if (!matchId) {
        document.getElementById('playerContainer').innerHTML = '<div class="player-placeholder"><i class="fas fa-play-circle"></i><p>Sélectionnez un match pour voir le flux</p></div>';
        resetStatsDisplay();
        return;
    }

    // Récupérer les détails du match
    const { data: match } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (!match) {
        showToast('Match introuvable', 'error');
        return;
    }

    selectedMatch = match;

    // Afficher le stream si disponible
    displayStream(match);

    // Mettre à jour le score
    updateScoreDisplay(match);

    // Charger les statistiques live
    await loadLiveStats(matchId);
    subscribeToLiveStats(matchId);

    // Charger les événements
    await loadMatchEvents(matchId);
    subscribeToMatchEvents(matchId);
}

// ═══════════════════════════════════════════════════════════
// 11. AFFICHAGE DU STREAM
// ═══════════════════════════════════════════════════════════
function displayStream(match) {
    const container = document.getElementById('playerContainer');
    if (!match.stream_url) {
        container.innerHTML = '<div class="player-placeholder"><i class="fas fa-video-slash"></i><p>Aucun flux disponible pour ce match</p></div>';
        return;
    }
    container.innerHTML = '<iframe src="' + match.stream_url + '" frameborder="0" allowfullscreen></iframe>';
}

// ═══════════════════════════════════════════════════════════
// 12. AFFICHAGE DU SCORE
// ═══════════════════════════════════════════════════════════
function updateScoreDisplay(match) {
    document.getElementById('homeScore').textContent = match.score_a || 0;
    document.getElementById('awayScore').textContent = match.score_b || 0;

    const option = document.querySelector('#matchSelect option:checked');
    if (option) {
        document.getElementById('homeTeamName').textContent = option.dataset.teamA || 'Équipe A';
        document.getElementById('awayTeamName').textContent = option.dataset.teamB || 'Équipe B';
    }
}

// ═══════════════════════════════════════════════════════════
// 13. STATISTIQUES LIVE
// ═══════════════════════════════════════════════════════════
async function loadLiveStats(matchId) {
    const { data } = await supabaseClient
        .from('gestionnairetournoi_match_live_stats')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();

    if (data) {
        updateLiveStatsUI(data);
    } else {
        // Créer une entrée par défaut
        const { data: newData } = await supabaseClient
            .from('gestionnairetournoi_match_live_stats')
            .insert([{ match_id: matchId }])
            .select()
            .single();
        if (newData) updateLiveStatsUI(newData);
    }
}

function updateLiveStatsUI(stats) {
    if (!stats) return;

    document.getElementById('shotsHome').textContent = stats.shots_home || 0;
    document.getElementById('shotsAway').textContent = stats.shots_away || 0;
    document.getElementById('shotsOnTargetHome').textContent = stats.shots_on_target_home || 0;
    document.getElementById('shotsOnTargetAway').textContent = stats.shots_on_target_away || 0;
    document.getElementById('foulsHome').textContent = stats.fouls_home || 0;
    document.getElementById('foulsAway').textContent = stats.fouls_away || 0;
    document.getElementById('cornersHome').textContent = stats.corners_home || 0;
    document.getElementById('cornersAway').textContent = stats.corners_away || 0;

    // Possession
    const possessionHome = stats.possession_home || 50;
    const possessionAway = stats.possession_away || 50;
    document.querySelector('.possession-home').style.width = possessionHome + '%';
    document.querySelector('.possession-home').textContent = possessionHome + '%';
    document.querySelector('.possession-away').style.width = possessionAway + '%';
    document.querySelector('.possession-away').textContent = possessionAway + '%';
}

function resetStatsDisplay() {
    document.getElementById('homeScore').textContent = '0';
    document.getElementById('awayScore').textContent = '0';
    document.getElementById('homeTeamName').textContent = '-';
    document.getElementById('awayTeamName').textContent = '-';
    updateLiveStatsUI({
        shots_home: 0, shots_away: 0,
        shots_on_target_home: 0, shots_on_target_away: 0,
        fouls_home: 0, fouls_away: 0,
        corners_home: 0, corners_away: 0,
        possession_home: 50, possession_away: 50
    });
}

// ═══════════════════════════════════════════════════════════
// 14. ÉVÉNEMENTS DU MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchEvents(matchId) {
    const { data } = await supabaseClient
        .from('gestionnairetournoi_match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('minute', { ascending: true });

    const container = document.getElementById('eventsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p>Aucun événement pour le moment.</p>';
        return;
    }

    renderEventsList(data);
}

function renderEventsList(events) {
    const container = document.getElementById('eventsList');
    if (!events || events.length === 0) {
        container.innerHTML = '<p>Aucun événement pour le moment.</p>';
        return;
    }

    const iconMap = {
        goal: '⚽',
        yellow_card: '🟨',
        red_card: '🟥',
        substitution: '🔄',
        penalty: '🥅'
    };

    let html = '';
    events.forEach(function(event) {
        const icon = iconMap[event.event_type] || '📌';
        html += '<div class="event-item">' +
                '<span class="event-minute">' + (event.minute || '') + '\'</span>' +
                '<span class="event-icon">' + icon + '</span>' +
                '<span class="event-desc">' + (event.description || event.event_type) + '</span>' +
                '</div>';
    });

    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 15. SOUSCRIPTIONS TEMPS RÉEL
// ═══════════════════════════════════════════════════════════
function subscribeToLiveStats(matchId) {
    liveStatsSubscription = supabaseClient
        .channel('live_stats_' + matchId)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'gestionnairetournoi_match_live_stats',
            filter: 'match_id=eq.' + matchId
        }, function(payload) {
            updateLiveStatsUI(payload.new);
        })
        .subscribe();
}

function subscribeToMatchEvents(matchId) {
    matchEventsSubscription = supabaseClient
        .channel('match_events_' + matchId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'gestionnairetournoi_match_events',
            filter: 'match_id=eq.' + matchId
        }, async function() {
            await loadMatchEvents(matchId);
        })
        .subscribe();

    // Écouter aussi les mises à jour du score
    supabaseClient
        .channel('match_score_' + matchId)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'gestionnairetournoi_matches',
            filter: 'id=eq.' + matchId
        }, function(payload) {
            if (payload.new) {
                updateScoreDisplay(payload.new);
            }
        })
        .subscribe();
}

// ═══════════════════════════════════════════════════════════
// 16. UI : SIDEBAR, MENU, DÉCONNEXION
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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    await loadMatches();

    document.getElementById('matchSelect')?.addEventListener('change', function() {
        selectMatch(this.value);
    });
});