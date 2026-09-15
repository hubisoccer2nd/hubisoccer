/* ============================================================
   HubISoccer — my-registrations.js
   Système Gestion Tournois — Mes inscriptions
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Jointure imbriquee (participants -> tournois -> sports)
     remplacee par deux requetes separees fusionnees en JS. Cette
     jointure precise n'a jamais cause de probleme observe, mais
     apres l'incident sur manage-tournament (une jointure similaire
     qui a rendu deux listes silencieusement vides), le principe
     retenu est de ne plus dependre d'une relation de cle etrangere
     non verifiee, meme quand elle semble plausible.
   - Routage dynamique profil/parametres + niveaux de sidebar,
     comme sur toutes les pages deja reprises.
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
const TBL_PARTICIPANTS = 'supabaseAuthPrive_gt_participants';
const TBL_TOURNAMENTS   = 'supabaseAuthPrive_gt_tournaments';
const TBL_SPORTS          = 'supabaseAuthPrive_gt_sports';

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
let allRegistrations = [];

const STATUS_LABELS = { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' };
const STATUS_CLASSES = { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected' };

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
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) return null;
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
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (!userProfile) return;
    if (userName) userName.textContent = userProfile.full_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES INSCRIPTIONS (deux requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadRegistrations() {
    showLoader();

    const { data: regs, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id, status, created_at, tournament_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        hideLoader();
        console.error('Erreur chargement inscriptions:', error.message);
        showToast('Erreur lors du chargement des inscriptions', 'error');
        return;
    }

    if (!regs.length) {
        hideLoader();
        allRegistrations = [];
        applyFilters();
        return;
    }

    // Requete separee pour les tournois -- ne depend d'aucune
    // relation de cle etrangere a deviner
    const tournamentIds = [...new Set(regs.map(function(r) { return r.tournament_id; }))];
    const { data: tournaments, error: tError } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, start_date, end_date, location, sport_id')
        .in('id', tournamentIds);

    if (tError) {
        hideLoader();
        console.error('Erreur chargement tournois:', tError.message);
        showToast('Erreur lors du chargement des tournois', 'error');
        return;
    }

    // Requete separee pour les sports -- meme principe
    const sportIds = [...new Set((tournaments || []).map(function(t) { return t.sport_id; }).filter(Boolean))];
    let sportsById = {};
    if (sportIds.length) {
        const { data: sports } = await supabaseClient.from(TBL_SPORTS).select('id, name').in('id', sportIds);
        (sports || []).forEach(function(s) { sportsById[s.id] = s; });
    }

    const tournamentsById = {};
    (tournaments || []).forEach(function(t) {
        t.sport = sportsById[t.sport_id] || null;
        tournamentsById[t.id] = t;
    });

    regs.forEach(function(r) { r.tournament = tournamentsById[r.tournament_id] || null; });

    hideLoader();
    allRegistrations = regs;
    updateStats();
    applyFilters();
}

// ═══════════════════════════════════════════════════════════
// 12. STATS RAPIDES
// ═══════════════════════════════════════════════════════════
function updateStats() {
    document.getElementById('statTotal').textContent = allRegistrations.length;
    document.getElementById('statPending').textContent = allRegistrations.filter(function(r) { return r.status === 'pending'; }).length;
    document.getElementById('statApproved').textContent = allRegistrations.filter(function(r) { return r.status === 'approved'; }).length;
    document.getElementById('statRejected').textContent = allRegistrations.filter(function(r) { return r.status === 'rejected'; }).length;
}

// ═══════════════════════════════════════════════════════════
// 13. APPLICATION DES FILTRES
// ═══════════════════════════════════════════════════════════
function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const period = document.getElementById('periodFilter').value;
    const now = new Date();

    let filtered = allRegistrations.filter(function(reg) {
        if (status !== 'all' && reg.status !== status) return false;
        const tournament = reg.tournament;
        if (!tournament) return false;
        const start = new Date(tournament.start_date);
        const end = new Date(tournament.end_date);
        if (period === 'upcoming') return start > now;
        if (period === 'ongoing') return start <= now && end >= now;
        if (period === 'past') return end < now;
        return true;
    });

    renderRegistrations(filtered);
}

// ═══════════════════════════════════════════════════════════
// 14. RENDU DES INSCRIPTIONS
// ═══════════════════════════════════════════════════════════
function renderRegistrations(registrations) {
    const container = document.getElementById('registrationsList');

    if (!registrations.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Aucune inscription trouvée.</p></div>';
        return;
    }

    container.innerHTML = registrations.map(function(reg) {
        const tournament = reg.tournament;
        if (!tournament) return '';
        const start = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('fr-FR') : '—';
        const end = tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('fr-FR') : '—';
        const sport = tournament.sport ? tournament.sport.name : '—';
        const statusLabel = STATUS_LABELS[reg.status] || reg.status;
        const statusClass = STATUS_CLASSES[reg.status] || '';

        return '<div class="registration-card">' +
               '<div class="registration-header">' +
               '<h3>' + escapeHtml(tournament.name) + '</h3>' +
               '<span class="registration-status ' + statusClass + '">' + statusLabel + '</span>' +
               '</div>' +
               '<div class="registration-info">' +
               '<div class="info-row"><i class="fas fa-calendar-alt"></i> ' + start + ' → ' + end + '</div>' +
               '<div class="info-row"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(tournament.location || 'Non spécifié') + '</div>' +
               '<div class="info-row"><i class="fas fa-futbol"></i> ' + escapeHtml(sport) + '</div>' +
               '</div>' +
               '<button class="btn-details" onclick="window.location.href=\'tournament-details.html?id=' + tournament.id + '\'">Voir les détails</button>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 16. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('periodFilter')?.addEventListener('change', applyFilters);

    await loadRegistrations();
});
