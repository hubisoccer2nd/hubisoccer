/* ============================================================
   HubISoccer — live-embed.js
   Système Gestion Tournois — Direct intégré (spectateurs)
   ------------------------------------------------------------
   Corrections appliquees :
   - stream_url etait lu depuis MATCHES, alors que live-stream.js
     (page organisateur) l'ecrit sur le TOURNOI -- un seul flux
     par tournoi, pas par match. Corrige pour lire au meme endroit
     que l'ecriture.
   - home_score/away_score n'existent nulle part ailleurs sur la
     plateforme -- toujours score_a/score_b. Corrige.
   - Jointure imbriquee team_a:team_a_id(...)/team_b:team_b_id(...)
     jamais verifiee -> requetes separees, meme discipline
     qu'ailleurs.
   - event_minute -> minute (le seul nom confirme, deja utilise
     par live-stream.js sur la meme table). La recherche de profil
     par evenement (user_id) n'etait pas plus confirmee -- alignee
     sur live-stream.js qui utilise directement description.
   - Tables migrees vers supabaseAuthPrive_gt_*. Chrome standard
     (navbar/sidebar/footer) ajoute -- absent du fichier source.
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
let currentMatchId = null;
let eventsSubscription = null;
let statsSubscription = null;
let scoreSubscription = null;

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
// 11. CHARGEMENT DU MATCH (requêtes séparées, stream_url via tournoi)
// ═══════════════════════════════════════════════════════════
async function loadMatch() {
    const params = new URLSearchParams(window.location.search);
    currentMatchId = params.get('match_id');

    if (!currentMatchId) {
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'match',
            parametre: 'match_id',
            portee: 'matchsEnCours',
            icone: 'fa-tv',
            titre: 'Quel match voulez-vous suivre en direct ?',
            aide: 'Rencontres en cours ou programmées, tournoi par tournoi.',
            messageVide: 'Aucun tournoi disponible pour le moment.'
        });
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, team_a_id, team_b_id, score_a, score_b, tournament_id')
        .eq('id', currentMatchId)
        .single();
    hideLoader();

    if (error || !match) {
        showToast('Match introuvable.', 'error');
        return;
    }

    let homeName = 'Domicile', awayName = 'Extérieur';
    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_a_id).maybeSingle();
        if (teamA) homeName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_b_id).maybeSingle();
        if (teamB) awayName = teamB.name;
    }

    document.getElementById('homeTeamName').textContent = homeName;
    document.getElementById('awayTeamName').textContent = awayName;
    document.getElementById('homeScore').textContent = match.score_a ?? 0;
    document.getElementById('awayScore').textContent = match.score_b ?? 0;

    // stream_url vit sur le TOURNOI (un seul flux pour tout le
    // tournoi), pas sur le match -- coherent avec ce qu'ecrit
    // live-stream.js
    if (match.tournament_id) {
        const { data: tournament } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('stream_url')
            .eq('id', match.tournament_id)
            .maybeSingle();
        embedStream(tournament ? tournament.stream_url : null);
    } else {
        embedStream(null);
    }

    await loadMatchEvents();
    subscribeRealtime();
}

// ═══════════════════════════════════════════════════════════
// 12. INTÉGRATION DU FLUX VIDÉO (YouTube / Twitch)
// ═══════════════════════════════════════════════════════════
function embedStream(streamUrl) {
    const player = document.getElementById('player');
    const noStreamMsg = document.getElementById('noStreamMsg');

    if (!streamUrl) {
        player.style.display = 'none';
        noStreamMsg.style.display = 'flex';
        return;
    }

    let embedUrl = streamUrl;
    if (streamUrl.includes('youtube.com/watch') || streamUrl.includes('youtu.be')) {
        const match = streamUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        if (match && match[1]) embedUrl = 'https://www.youtube.com/embed/' + match[1] + '?autoplay=1&mute=0';
    } else if (streamUrl.includes('twitch.tv')) {
        const channel = streamUrl.split('/').pop();
        embedUrl = 'https://player.twitch.tv/?channel=' + channel + '&parent=' + window.location.hostname + '&autoplay=true';
    }

    player.src = embedUrl;
    player.style.display = 'block';
    noStreamMsg.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 13. STATISTIQUES EN DIRECT
// ═══════════════════════════════════════════════════════════
function updateStatsDisplay(stats) {
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
    document.getElementById('possessionHome').style.width = possessionHome + '%';
    document.getElementById('possessionHome').textContent = possessionHome + '%';
    document.getElementById('possessionAway').style.width = possessionAway + '%';
    document.getElementById('possessionAway').textContent = possessionAway + '%';
}

// ═══════════════════════════════════════════════════════════
// 14. ÉVÉNEMENTS DU MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchEvents() {
    const { data } = await supabaseClient
        .from(TBL_MATCH_EVENTS)
        .select('*')
        .eq('match_id', currentMatchId)
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

    container.innerHTML = events.slice(-10).reverse().map(function(event) {
        const icon = iconMap[event.event_type] || '📌';
        return '<div class="event-item">' +
               '<span class="event-minute tabular">' + (event.minute || '') + '\'</span>' +
               '<span class="event-icon">' + icon + '</span>' +
               '<span class="event-desc">' + escapeHtml(event.description || event.event_type) + '</span>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. SOUSCRIPTIONS TEMPS RÉEL
// ═══════════════════════════════════════════════════════════
function subscribeRealtime() {
    scoreSubscription = supabaseClient
        .channel('embed_score_' + currentMatchId)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: TBL_MATCHES,
            filter: 'id=eq.' + currentMatchId
        }, function(payload) {
            if (payload.new) {
                document.getElementById('homeScore').textContent = payload.new.score_a ?? 0;
                document.getElementById('awayScore').textContent = payload.new.score_b ?? 0;
            }
        })
        .subscribe();

    statsSubscription = supabaseClient
        .channel('embed_stats_' + currentMatchId)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: TBL_LIVE_STATS,
            filter: 'match_id=eq.' + currentMatchId
        }, function(payload) { updateStatsDisplay(payload.new); })
        .subscribe();

    eventsSubscription = supabaseClient
        .channel('embed_events_' + currentMatchId)
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: TBL_MATCH_EVENTS,
            filter: 'match_id=eq.' + currentMatchId
        }, async function() { await loadMatchEvents(); })
        .subscribe();
}

function unsubscribeAll() {
    if (scoreSubscription) { scoreSubscription.unsubscribe(); scoreSubscription = null; }
    if (statsSubscription) { statsSubscription.unsubscribe(); statsSubscription = null; }
    if (eventsSubscription) { eventsSubscription.unsubscribe(); eventsSubscription = null; }
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
            unsubscribeAll();
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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { unsubscribeAll(); window.history.back(); });

    await loadMatch();

    window.addEventListener('beforeunload', unsubscribeAll);
});
