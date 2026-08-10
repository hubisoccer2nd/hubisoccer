/* ============================================================
   HubISoccer -- gt-tournois-geres.js
   Mes Tournois Geres - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Page en lecture seule -- aucune creation/modification ici,
   celle-ci reste dans le systeme partage (create-tournament.html,
   manage-tournament.html). Cette page lit uniquement
   supabaseAuthPrive_gt_tournaments filtree par created_by, avec
   un bouton "Gerer" qui renvoie vers le systeme partage.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const PARTICIPANTS_TABLE = 'supabaseAuthPrive_gt_participants';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allTournaments = [];

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
function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }
function formatDateShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}

const STATUT_LABELS = { draft: 'Brouillon', published: 'Publié', completed: 'Terminé', cancelled: 'Annulé' };
const STATUT_ICONS  = { draft: 'fa-pencil-alt', published: 'fa-play-circle', completed: 'fa-flag-checkered', cancelled: 'fa-ban' };

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

/* ---------- 9. CHARGEMENT DES TOURNOIS ---------- */
async function loadTournaments() {
    if (!userProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .select('id, name, sport_id, start_date, end_date, prize_pool, status')
        .eq('created_by', currentUser.id)
        .order('start_date', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Erreur chargement tournois :', error.message);
        showToast('Erreur lors du chargement de vos tournois.', 'error');
        allTournaments = [];
        return;
    }
    allTournaments = data || [];
    await attachParticipantCounts();
    renderAll();
    updateStats();
}

/* ---------- 10. COMPTES DE PARTICIPANTS PAR TOURNOI ---------- */
async function attachParticipantCounts() {
    for (const t of allTournaments) {
        const { count } = await supabaseClient
            .from(PARTICIPANTS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', t.id)
            .eq('status', 'approved');
        t.participant_count = count || 0;
    }
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    document.getElementById('statTotal').textContent = allTournaments.length;
    document.getElementById('statActifs').textContent = allTournaments.filter(function(t) { return t.status === 'published'; }).length;
    document.getElementById('statTermines').textContent = allTournaments.filter(function(t) { return t.status === 'completed'; }).length;

    const cagnotte = allTournaments.reduce(function(sum, t) { return sum + (Number(t.prize_pool) || 0); }, 0);
    document.getElementById('statCagnotte').textContent = formatMoney(cagnotte) + ' FCFA';
}

/* ---------- 12. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statutFilter = document.getElementById('filterStatut').value;

    const filtered = allTournaments.filter(function(t) {
        const matchSearch = !search || (t.name || '').toLowerCase().includes(search);
        const matchStatut = !statutFilter || (t.status === statutFilter);
        return matchSearch && matchStatut;
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(t) {
        const card = document.createElement('div');
        card.className = 'entry-card';

        const start = formatDateShort(t.start_date);
        const end = formatDateShort(t.end_date);

        let meta = '<span><i class="fas fa-calendar-alt"></i>' + start + ' → ' + end + '</span>';
        meta += '<span><i class="fas fa-users"></i>' + t.participant_count + ' participants</span>';
        if (t.prize_pool) meta += '<span class="tabular"><i class="fas fa-coins"></i>' + formatMoney(t.prize_pool) + ' FCFA</span>';

        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + escapeHtml(t.name) + '</span>' +
            '<span class="status-pill ' + t.status + '"><i class="fas ' + (STATUT_ICONS[t.status] || 'fa-question-circle') + '"></i> ' + (STATUT_LABELS[t.status] || t.status) + '</span>' +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            '<a class="btn-manage" href="../../shared/gestion-tournoi/manage-tournament.html?id=' + t.id + '">Gérer ce tournoi <i class="fas fa-arrow-right"></i></a>';

        grid.appendChild(card);
    });
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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterStatut').addEventListener('change', renderAll);

    await loadTournaments();
});
