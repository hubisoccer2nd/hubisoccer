/* ============================================================
   HubISoccer -- gt-communaute.js
   Communaute des Organisateurs - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Repertoire en lecture seule des autres utilisateurs role_code
   'TOURN' -- pas de CRUD, pas de modale. Contact reel via la
   Messagerie de la plateforme, pas un systeme separe ici.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE = 'supabaseAuthPrive_gt_perso_scouting';
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allOrganizers = [];

/* ---------- 4. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

/* ---------- 5. TOAST (duree 30 secondes) ---------- */
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

/* ---------- 6. UTILITAIRES ---------- */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}

const VERIF_LABELS = { non_soumise: null, en_attente: null, approuvee: 'Vérifié', rejetee: null };

/* ---------- 7. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html?role=TOURN';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 8. CHARGEMENT PROFIL + VERROU DE ROLE ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;

    if (GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) === -1) {
        showToast('Cette page est réservée au Gestionnaire de Tournoi.', 'warning');
        window.location.href = '../../shared/gestion-tournoi/acceuil.html';
        return null;
    }

    updateNavbarUI();
    return userProfile;
}

function updateNavbarUI() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Gestionnaire';

    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'G');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}

/* ---------- 9. CHARGEMENT DES AUTRES ORGANISATEURS ---------- */
async function loadOrganizers() {
    showLoader();

    const { data: profiles, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('auth_uuid, hubisoccer_id, full_name, display_name, avatar_url, created_at')
        .eq('role_code', 'TOURN')
        .neq('auth_uuid', currentUser.id)
        .order('full_name');

    if (error) {
        console.warn('Erreur chargement organisateurs :', error.message);
        showToast('Erreur lors du chargement de la communauté.', 'error');
        hideLoader();
        allOrganizers = [];
        return;
    }

    for (const p of profiles) {
        const { data: scouting } = await supabaseClient
            .from(SCOUTING_TABLE)
            .select('statut_verification')
            .eq('gestionnaire_id', p.hubisoccer_id)
            .maybeSingle();
        p.statut_verification = scouting ? scouting.statut_verification : null;

        const { count } = await supabaseClient
            .from(TOURNAMENTS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('created_by', p.auth_uuid);
        p.tournois_count = count || 0;
    }

    allOrganizers = profiles || [];
    hideLoader();
    renderAll();
    updateStats();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    document.getElementById('statTotal').textContent = allOrganizers.length;

    const totalTournois = allOrganizers.reduce(function(sum, o) { return sum + (o.tournois_count || 0); }, 0);
    document.getElementById('statTournois').textContent = totalTournois;

    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const nouveaux = allOrganizers.filter(function(o) {
        if (!o.created_at) return false;
        const d = new Date(o.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('statNouveaux').textContent = nouveaux;
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allOrganizers.filter(function(o) {
        const nom = o.full_name || o.display_name || '';
        return !search || nom.toLowerCase().includes(search);
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(o) {
        const card = document.createElement('div');
        card.className = 'organizer-card';

        const nom = o.full_name || o.display_name || 'Organisateur';
        const avatarHtml = o.avatar_url
            ? '<img src="' + o.avatar_url + '" class="organizer-avatar" alt="' + escapeHtml(nom) + '">'
            : '<div class="organizer-avatar-placeholder">' + getInitials(nom) + '</div>';

        const verifLabel = VERIF_LABELS[o.statut_verification];
        const verifBadge = verifLabel
            ? '<span class="verif-badge-mini"><i class="fas fa-check-circle"></i> ' + verifLabel + '</span>'
            : '';

        card.innerHTML =
            avatarHtml +
            '<div class="organizer-name">' + escapeHtml(nom) + '</div>' +
            verifBadge +
            '<div class="organizer-stat"><i class="fas fa-trophy"></i> ' + o.tournois_count + ' tournoi' + (o.tournois_count !== 1 ? 's' : '') + ' organisé' + (o.tournois_count !== 1 ? 's' : '') + '</div>' +
            '<a class="btn-contact" href="../../shared/messagerie/conversation.html"><i class="fas fa-comment"></i> Contacter</a>';

        grid.appendChild(card);
    });
}

/* ---------- 12. RECHERCHE ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
}

/* ---------- 13. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 14. SIDEBAR + SWIPE ---------- */
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
        if (dx > 0 && sx < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}

/* ---------- 15. DECONNEXION ---------- */
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

/* ---------- 16. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    const profile = await loadProfile();
    if (!profile) return;

    initUserMenu();
    initSidebar();
    initLogout();
    initFilters();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadOrganizers();
});
