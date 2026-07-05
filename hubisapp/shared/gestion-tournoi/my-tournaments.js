/* ============================================================
   HubISoccer — my-tournaments.js
   Page Mes tournois – Version adaptée
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
let allMyTournaments = [];
let currentFilter = 'all';

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
    hideLoader();
    if (!session) {
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
    if (error || !data) return null;
    userProfile = data;
    updateNavbarUI();
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 8. MISE À JOUR DE LA NAVBAR
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
}

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DES TOURNOIS DE L'UTILISATEUR
// ═══════════════════════════════════════════════════════════
async function loadMyTournaments() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name, description, start_date, end_date, location, status, type_id, sport_id, gestionnairetournoi_types!inner(name, label), gestionnairetournoi_sports!inner(name)')
        .eq('created_by', currentUser.id)
        .order('start_date', { ascending: false });

    hideLoader();

    if (error) {
        console.error('Erreur chargement tournois:', error);
        showToast('Erreur lors du chargement de vos tournois.', 'error');
        return;
    }

    allMyTournaments = data || [];
    applyFilter();
}

// ═══════════════════════════════════════════════════════════
// 10. APPLICATION DU FILTRE
// ═══════════════════════════════════════════════════════════
function applyFilter() {
    let filtered = allMyTournaments;
    if (currentFilter !== 'all') {
        filtered = allMyTournaments.filter(function(t) {
            if (currentFilter === 'draft') return t.status === 'draft';
            if (currentFilter === 'active') return t.status === 'active';
            if (currentFilter === 'finished') return t.status === 'finished';
            return true;
        });
    }
    renderTournaments(filtered);
}

// ═══════════════════════════════════════════════════════════
// 11. RENDU DE LA LISTE
// ═══════════════════════════════════════════════════════════
function renderTournaments(tournaments) {
    const container = document.getElementById('tournamentsList');
    if (!container) return;

    if (!tournaments.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>Aucun tournoi trouvé.</p></div>';
        return;
    }

    container.innerHTML = tournaments.map(function(t) {
        const start = new Date(t.start_date).toLocaleDateString('fr-FR');
        const end = new Date(t.end_date).toLocaleDateString('fr-FR');
        const typeLabel = t.gestionnairetournoi_types ? t.gestionnairetournoi_types.label : '—';
        const sportName = t.gestionnairetournoi_sports ? t.gestionnairetournoi_sports.name : '—';
        const statusLabel = t.status === 'draft' ? 'Brouillon' : t.status === 'active' ? 'Actif' : 'Terminé';
        return '<div class="my-tournament-card">' +
               '<div class="card-body">' +
               '<h3>' + escapeHtml(t.name) + '</h3>' +
               '<p class="card-info"><i class="fas fa-calendar"></i> ' + start + ' - ' + end + '</p>' +
               '<p class="card-info"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(t.location || 'Non spécifié') + '</p>' +
               '<p class="card-info"><i class="fas fa-tag"></i> ' + escapeHtml(typeLabel) + ' | <i class="fas fa-futbol"></i> ' + escapeHtml(sportName) + '</p>' +
               '<span class="status-badge status-' + t.status + '">' + statusLabel + '</span>' +
               '</div>' +
               '<div class="card-actions">' +
               '<a href="tournament-details.html?id=' + t.id + '" class="btn-action"><i class="fas fa-eye"></i> Voir</a>' +
               '<a href="create-tournament.html?edit=' + t.id + '" class="btn-action"><i class="fas fa-edit"></i> Modifier</a>' +
               '</div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 12. GESTION DES ONGLETS
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
    updateNavbarUI();

    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    await loadMyTournaments();
});