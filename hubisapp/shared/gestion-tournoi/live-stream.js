/* ============================================================
   HubISoccer — live-stream.js
   Système Gestion Tournois — Diffusion en direct (organisateur)
   ------------------------------------------------------------
   Le fichier source ne contenait AUCUNE logique video -- c'etait
   deja un suivi de stats en direct (score/tirs/possession/corners
   via abonnements Supabase Realtime), conserve tel quel car
   genuinement utile et adapte a ce type de synchronisation
   (petites charges JSON, pas de video).
   Nouveau dans cette version : vraie capture camera (avant/
   arriere) via getUserMedia -- apercu LOCAL uniquement, honnete
   sur ce que ça represente (voir note dans l'interface). La
   diffusion reellement vue par les spectateurs, elle, passe par
   stream_url (YouTube/Twitch/Facebook Live) -- c'est la seule
   maniere de tenir a grande echelle avec cette architecture,
   puisque Supabase ne fait ni video ni CDN.
   Tables migrees vers supabaseAuthPrive_gt_*, routage dynamique
   profil + niveaux de sidebar ajoutes.
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
const TBL_MATCHES        = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS             = 'supabaseAuthPrive_gt_teams';
const TBL_TOURNAMENTS          = 'supabaseAuthPrive_gt_tournaments';
const TBL_LIVE_STATS               = 'supabaseAuthPrive_gt_match_live_stats';
const TBL_MATCH_EVENTS                = 'supabaseAuthPrive_gt_match_events';
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
let selectedMatch = null;
let selectedTournamentId = null;
let liveStatsSubscription = null;
let matchEventsSubscription = null;
let scoreSubscription = null;

let cameraStream = null;
let currentFacingMode = 'user';
let micEnabled = true;

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
// 11. CHARGEMENT DES MATCHS EN DIRECT
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, match_date, status, team_a_id, team_b_id, score_a, score_b, tournament_id')
        .eq('status', 'live')
        .order('match_date', { ascending: false });

    const select = document.getElementById('matchSelect');

    if (error) {
        console.error('Erreur chargement matchs:', error);
        showToast('Erreur chargement des matchs', 'error');
        return;
    }

    select.innerHTML = '<option value="">-- Choisir un match --</option>';

    if (!data || data.length === 0) {
        select.innerHTML = '<option value="">Aucun match en direct</option>';
        return;
    }

    const teamIds = new Set();
    data.forEach(function(m) { if (m.team_a_id) teamIds.add(m.team_a_id); if (m.team_b_id) teamIds.add(m.team_b_id); });
    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', Array.from(teamIds));
    const teamNameMap = {};
    (teams || []).forEach(function(t) { teamNameMap[t.id] = t.name; });

    data.forEach(function(match) {
        const teamAName = teamNameMap[match.team_a_id] || 'Équipe A';
        const teamBName = teamNameMap[match.team_b_id] || 'Équipe B';
        const option = document.createElement('option');
        option.value = match.id;
        option.textContent = teamAName + ' vs ' + teamBName + ' (' + (match.score_a || 0) + '-' + (match.score_b || 0) + ')';
        option.dataset.teamA = teamAName;
        option.dataset.teamB = teamBName;
        option.dataset.tournamentId = match.tournament_id || '';
        select.appendChild(option);
    });
}

// ═══════════════════════════════════════════════════════════
// 12. SÉLECTION D'UN MATCH
// ═══════════════════════════════════════════════════════════
async function selectMatch(matchId) {
    unsubscribeAll();
    stopCamera();

    const sections = ['cameraSection', 'streamUrlSection', 'scoreSection', 'statsSection', 'eventsSection'];

    if (!matchId) {
        sections.forEach(function(id) { document.getElementById(id).style.display = 'none'; });
        selectedMatch = null;
        selectedTournamentId = null;
        return;
    }

    const option = document.querySelector('#matchSelect option[value="' + matchId + '"]');
    selectedMatch = matchId;
    selectedTournamentId = option ? option.dataset.tournamentId : null;

    document.getElementById('homeTeamName').textContent = option ? option.dataset.teamA : '—';
    document.getElementById('awayTeamName').textContent = option ? option.dataset.teamB : '—';

    sections.forEach(function(id) { document.getElementById(id).style.display = 'block'; });

    // La section camera/lien de diffusion n'a de sens que pour
    // l'organisateur du tournoi -- verifie via tournament.created_by
    await checkOrganizerPermission();

    resetStatsDisplay();
    await loadMatchEvents(matchId);
    subscribeToLiveStats(matchId);
    subscribeToMatchEvents(matchId);
}

async function checkOrganizerPermission() {
    if (!selectedTournamentId) {
        document.getElementById('cameraSection').style.display = 'none';
        document.getElementById('streamUrlSection').style.display = 'none';
        return;
    }

    const { data: tournament } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('created_by, stream_url')
        .eq('id', selectedTournamentId)
        .maybeSingle();

    const isOrganizer = !!(tournament && tournament.created_by === currentUser.id);

    document.getElementById('cameraSection').style.display = isOrganizer ? 'block' : 'none';
    document.getElementById('streamUrlSection').style.display = isOrganizer ? 'block' : 'none';

    if (isOrganizer) {
        document.getElementById('streamUrlInput').value = (tournament && tournament.stream_url) || '';
    }
}

// ═══════════════════════════════════════════════════════════
// 13. CAMÉRA (getUserMedia — aperçu local réel)
// ═══════════════════════════════════════════════════════════
async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: true
        });
    } catch (err) {
        showToast('Impossible d\'accéder à la caméra : ' + err.message, 'error');
        return;
    }

    const video = document.getElementById('cameraPreview');
    video.srcObject = cameraStream;

    document.getElementById('cameraLiveBadge').style.display = 'flex';
    document.getElementById('switchCameraBtn').disabled = false;
    document.getElementById('toggleMicBtn').disabled = false;

    const toggleBtn = document.getElementById('toggleCameraBtn');
    toggleBtn.innerHTML = '<i class="fas fa-stop"></i> Arrêter la caméra';
    toggleBtn.classList.add('active');
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) { track.stop(); });
        cameraStream = null;
    }
    const video = document.getElementById('cameraPreview');
    if (video) video.srcObject = null;

    const badge = document.getElementById('cameraLiveBadge');
    if (badge) badge.style.display = 'none';
    const switchBtn = document.getElementById('switchCameraBtn');
    if (switchBtn) switchBtn.disabled = true;
    const micBtn = document.getElementById('toggleMicBtn');
    if (micBtn) micBtn.disabled = true;

    const toggleBtn = document.getElementById('toggleCameraBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-video"></i> Démarrer la caméra';
        toggleBtn.classList.remove('active');
    }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    if (cameraStream) {
        stopCamera();
        await startCamera();
    }
}

function toggleMic() {
    if (!cameraStream) return;
    micEnabled = !micEnabled;
    cameraStream.getAudioTracks().forEach(function(track) { track.enabled = micEnabled; });
    const micBtn = document.getElementById('toggleMicBtn');
    micBtn.innerHTML = micEnabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
    micBtn.classList.toggle('muted', !micEnabled);
}

// ═══════════════════════════════════════════════════════════
// 14. PUBLICATION DU LIEN DE DIFFUSION
// ═══════════════════════════════════════════════════════════
async function saveStreamUrl() {
    if (!selectedTournamentId) return;
    const url = document.getElementById('streamUrlInput').value.trim();

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .update({ stream_url: url || null })
        .eq('id', selectedTournamentId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la publication du lien.', 'error');
        return;
    }
    showToast('Lien de diffusion publié ! Visible dans Direct intégré.', 'success');
}

// ═══════════════════════════════════════════════════════════
// 15. AFFICHAGE DU SCORE ET DES STATS
// ═══════════════════════════════════════════════════════════
function updateScoreDisplay(match) {
    document.getElementById('homeScore').textContent = match.score_a ?? 0;
    document.getElementById('awayScore').textContent = match.score_b ?? 0;
}

function updateLiveStatsUI(stats) {
    document.getElementById('shotsHome').textContent = stats.shots_home || 0;
    document.getElementById('shotsAway').textContent = stats.shots_away || 0;
    document.getElementById('shotsOnTargetHome').textContent = stats.shots_on_target_home || 0;
    document.getElementById('shotsOnTargetAway').textContent = stats.shots_on_target_away || 0;
    document.getElementById('foulsHome').textContent = stats.fouls_home || 0;
    document.getElementById('foulsAway').textContent = stats.fouls_away || 0;
    document.getElementById('cornersHome').textContent = stats.corners_home || 0;
    document.getElementById('cornersAway').textContent = stats.corners_away || 0;

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
    updateLiveStatsUI({
        shots_home: 0, shots_away: 0,
        shots_on_target_home: 0, shots_on_target_away: 0,
        fouls_home: 0, fouls_away: 0,
        corners_home: 0, corners_away: 0,
        possession_home: 50, possession_away: 50
    });
}

// ═══════════════════════════════════════════════════════════
// 16. ÉVÉNEMENTS DU MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchEvents(matchId) {
    const { data } = await supabaseClient
        .from(TBL_MATCH_EVENTS)
        .select('*')
        .eq('match_id', matchId)
        .order('minute', { ascending: true });

    renderEventsList(data || []);
}

function renderEventsList(events) {
    const container = document.getElementById('eventsList');
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="empty-hint">Aucun événement pour le moment.</p>';
        return;
    }

    const iconMap = { goal: '⚽', yellow_card: '🟨', red_card: '🟥', substitution: '🔄', penalty: '🥅' };

    container.innerHTML = events.map(function(event) {
        const icon = iconMap[event.event_type] || '📌';
        return '<div class="event-item">' +
               '<span class="event-minute tabular">' + (event.minute || '') + '\'</span>' +
               '<span class="event-icon">' + icon + '</span>' +
               '<span class="event-desc">' + escapeHtml(event.description || event.event_type) + '</span>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 17. SOUSCRIPTIONS TEMPS RÉEL
// ═══════════════════════════════════════════════════════════
function subscribeToLiveStats(matchId) {
    liveStatsSubscription = supabaseClient
        .channel('live_stats_' + matchId)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: TBL_LIVE_STATS,
            filter: 'match_id=eq.' + matchId
        }, function(payload) { updateLiveStatsUI(payload.new); })
        .subscribe();
}

function subscribeToMatchEvents(matchId) {
    matchEventsSubscription = supabaseClient
        .channel('match_events_' + matchId)
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: TBL_MATCH_EVENTS,
            filter: 'match_id=eq.' + matchId
        }, async function() { await loadMatchEvents(matchId); })
        .subscribe();

    scoreSubscription = supabaseClient
        .channel('match_score_' + matchId)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: TBL_MATCHES,
            filter: 'id=eq.' + matchId
        }, function(payload) { if (payload.new) updateScoreDisplay(payload.new); })
        .subscribe();
}

function unsubscribeAll() {
    if (liveStatsSubscription) { liveStatsSubscription.unsubscribe(); liveStatsSubscription = null; }
    if (matchEventsSubscription) { matchEventsSubscription.unsubscribe(); matchEventsSubscription = null; }
    if (scoreSubscription) { scoreSubscription.unsubscribe(); scoreSubscription = null; }
}

// ═══════════════════════════════════════════════════════════
// 18. UI : SIDEBAR, MENU, DÉCONNEXION
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
            stopCamera();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 19. INITIALISATION
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
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { stopCamera(); window.history.back(); });

    await loadMatches();

    document.getElementById('matchSelect')?.addEventListener('change', function() { selectMatch(this.value); });

    document.getElementById('toggleCameraBtn')?.addEventListener('click', function() {
        if (cameraStream) stopCamera(); else startCamera();
    });
    document.getElementById('switchCameraBtn')?.addEventListener('click', switchCamera);
    document.getElementById('toggleMicBtn')?.addEventListener('click', toggleMic);
    document.getElementById('saveStreamUrlBtn')?.addEventListener('click', saveStreamUrl);

    window.addEventListener('beforeunload', stopCamera);
});
