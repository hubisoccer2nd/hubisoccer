/* ============================================================
   HubISoccer — my-tournaments.js
   Système Gestion Tournois — Mes tournois
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Vocabulaire de statut corrige : les onglets cherchaient
     'active'/'finished', des valeurs qui n'existent nulle part
     dans le schema reel (draft/published/completed/cancelled).
     Meme apres la correction des tables, les filtres restaient
     casses -- corrige separement.
   - Bouton "Modifier" renvoyait vers create-tournament.html?edit=X,
     une page qui n'a aucune logique de mode edition (elle aurait
     affiche un formulaire vide). Redirige vers
     manage-tournament.html?id=X, qui a deja un vrai formulaire
     d'edition fonctionnel -- evite de dupliquer cette logique
     sur deux pages differentes.
   - Ajout d'un onglet "Annules", absent alors que c'est une
     vraie valeur de statut sans aucune visibilite avant.
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
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS        = 'supabaseAuthPrive_gt_sports';
const TBL_PARTICIPANTS   = 'supabaseAuthPrive_gt_participants';

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
let allMyTournaments = [];
let currentFilter = 'all';

const STATUS_LABELS = { draft: 'Brouillon', published: 'Publié', completed: 'Terminé', cancelled: 'Annulé' };

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
function formatDateShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

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
// 11. CHARGEMENT DES TOURNOIS DE L'UTILISATEUR
// ═══════════════════════════════════════════════════════════
async function loadMyTournaments() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, description, start_date, end_date, location, status, prize_pool, type_id, sport_id, ' + TBL_TYPES + '(name, label), ' + TBL_SPORTS + '(name)')
        .eq('created_by', currentUser.id)
        .order('start_date', { ascending: false });

    hideLoader();

    if (error) {
        console.error('Erreur chargement tournois:', error.message);
        showToast('Erreur lors du chargement de vos tournois.', 'error');
        return;
    }

    allMyTournaments = data || [];

    // Comptes de participants : UNE seule requete pour tous les
    // tournois, puis comptage cote client. L'ancienne version
    // lancait une requete count par tournoi -- 31 requetes pour
    // 30 tournois.
    allMyTournaments.forEach(function(t) { t.participant_count = 0; });

    if (allMyTournaments.length) {
        const tournamentIds = allMyTournaments.map(function(t) { return t.id; });
        const { data: participants, error: errParticipants } = await supabaseClient
            .from(TBL_PARTICIPANTS)
            .select('tournament_id')
            .in('tournament_id', tournamentIds)
            .eq('status', 'approved');

        if (errParticipants) {
            console.warn('Comptage des participants indisponible :', errParticipants.message);
        } else {
            const compteurs = {};
            (participants || []).forEach(function(p) {
                compteurs[p.tournament_id] = (compteurs[p.tournament_id] || 0) + 1;
            });
            allMyTournaments.forEach(function(t) {
                t.participant_count = compteurs[t.id] || 0;
            });
        }
    }

    updateStats();
    applyFilter();
}

// ═══════════════════════════════════════════════════════════
// 12. STATS RAPIDES
// ═══════════════════════════════════════════════════════════
function updateStats() {
    document.getElementById('statTotal').textContent = allMyTournaments.length;
    document.getElementById('statPublished').textContent = allMyTournaments.filter(function(t) { return t.status === 'published'; }).length;
    document.getElementById('statCompleted').textContent = allMyTournaments.filter(function(t) { return t.status === 'completed'; }).length;
    document.getElementById('statDraft').textContent = allMyTournaments.filter(function(t) { return t.status === 'draft'; }).length;
}

// ═══════════════════════════════════════════════════════════
// 13. APPLICATION DU FILTRE
// ═══════════════════════════════════════════════════════════
function applyFilter() {
    let filtered = allMyTournaments;
    if (currentFilter !== 'all') {
        filtered = allMyTournaments.filter(function(t) { return t.status === currentFilter; });
    }
    renderTournaments(filtered);
}

// ═══════════════════════════════════════════════════════════
// 14. RENDU DE LA LISTE
// ═══════════════════════════════════════════════════════════
function renderTournaments(tournaments) {
    const container = document.getElementById('tournamentsList');
    if (!container) return;

    if (!tournaments.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>Aucun tournoi trouvé.</p></div>';
        return;
    }

    container.innerHTML = tournaments.map(function(t) {
        const start = formatDateShort(t.start_date);
        const end = formatDateShort(t.end_date);
        const typeLabel = t[TBL_TYPES] ? t[TBL_TYPES].label : '—';
        const sportName = t[TBL_SPORTS] ? t[TBL_SPORTS].name : '—';
        const statusLabel = STATUS_LABELS[t.status] || t.status;

        return '<div class="my-tournament-card">' +
               '<div class="card-top-row">' +
               '<span class="sport-tag"><i class="fas fa-futbol"></i> ' + escapeHtml(sportName) + '</span>' +
               '<span class="status-badge status-' + t.status + '">' + statusLabel + '</span>' +
               '</div>' +
               '<h3>' + escapeHtml(t.name) + '</h3>' +
               '<div class="card-meta">' +
               '<span><i class="fas fa-calendar-alt"></i> ' + start + ' → ' + end + '</span>' +
               '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(t.location || 'Non spécifié') + '</span>' +
               '<span><i class="fas fa-tag"></i> ' + escapeHtml(typeLabel) + '</span>' +
               '<span><i class="fas fa-users"></i> ' + t.participant_count + ' participants</span>' +
               (t.prize_pool ? '<span class="tabular"><i class="fas fa-coins"></i> ' + Number(t.prize_pool).toLocaleString('fr-FR') + ' FCFA</span>' : '') +
               '</div>' +
               '<div class="card-actions">' +
               '<a href="tournament-details.html?id=' + t.id + '" class="btn-action"><i class="fas fa-eye"></i> Voir</a>' +
               '<a href="manage-tournament.html?id=' + t.id + '" class="btn-action primary"><i class="fas fa-sliders-h"></i> Gérer</a>' +
               '</div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. GESTION DES ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            applyFilter();
        });
    });
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

    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadMyTournaments();
});
