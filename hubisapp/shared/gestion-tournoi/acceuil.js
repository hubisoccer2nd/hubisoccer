/* ============================================================
   HubISoccer — acceuil.js
   Gestion des tournois – Page d'accueil
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
let allTournaments = [];

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
async function loadTournamentsList() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name, description, start_date, end_date, location, registration_code, prize_pool, stream_url, requires_first_pas, has_agreed_to_rules, type_id, sport_id, gestionnairetournoi_types!inner(name, label), gestionnairetournoi_sports!inner(name)')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Erreur chargement tournois:', error);
        throw error;
    }

    return data.map(function(t) {
        return {
            id: t.id,
            name: t.name,
            description: t.description,
            start_date: t.start_date,
            end_date: t.end_date,
            location: t.location,
            registration_code: t.registration_code,
            prize_pool: t.prize_pool,
            stream_url: t.stream_url,
            requires_first_pas: t.requires_first_pas,
            has_agreed_to_rules: t.has_agreed_to_rules,
            type: t.gestionnairetournoi_types ? t.gestionnairetournoi_types.name : '',
            typeLabel: t.gestionnairetournoi_types ? t.gestionnairetournoi_types.label : '',
            sport: t.gestionnairetournoi_sports ? t.gestionnairetournoi_sports.name : ''
        };
    });
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES SPORTS
// ═══════════════════════════════════════════════════════════
async function loadSportsList() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_sports')
        .select('id, name')
        .order('name');

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES TYPES
// ═══════════════════════════════════════════════════════════
async function loadTournamentTypes() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_types')
        .select('id, name, label');

    if (error) throw error;
    return data;
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES FILTRES
// ═══════════════════════════════════════════════════════════
async function loadFilters() {
    try {
        const sports = await loadSportsList();
        const types = await loadTournamentTypes();

        const sportSelect = document.getElementById('sportFilter');
        sports.forEach(function(sport) {
            const opt = document.createElement('option');
            opt.value = sport.name;
            opt.textContent = sport.name;
            sportSelect.appendChild(opt);
        });

        const typeSelect = document.getElementById('typeFilter');
        types.forEach(function(type) {
            const opt = document.createElement('option');
            opt.value = type.name;
            opt.textContent = type.label;
            typeSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Erreur chargement filtres', err);
        showToast('Erreur lors du chargement des filtres', 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT ET AFFICHAGE
// ═══════════════════════════════════════════════════════════
async function loadAndDisplayTournaments() {
    try {
        showLoader();
        const tournaments = await loadTournamentsList();
        allTournaments = tournaments;
        applyFilters();
        hideLoader();
    } catch (err) {
        console.error('Erreur chargement tournois', err);
        document.getElementById('loader').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erreur de chargement</p></div>';
        hideLoader();
    }
}

// ═══════════════════════════════════════════════════════════
// 14. APPLICATION DES FILTRES
// ═══════════════════════════════════════════════════════════
function applyFilters() {
    const sport = document.getElementById('sportFilter').value;
    const period = document.getElementById('periodFilter').value;
    const type = document.getElementById('typeFilter').value;
    const now = new Date();

    let filtered = allTournaments.filter(function(t) {
        if (sport !== 'all' && t.sport !== sport) return false;
        if (type !== 'all' && t.type !== type) return false;
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        if (period === 'upcoming') return start > now;
        if (period === 'ongoing') return start <= now && end >= now;
        if (period === 'past') return end < now;
        return true;
    });

    renderTournaments(filtered);
}

// ═══════════════════════════════════════════════════════════
// 15. RENDU DES CARTES TOURNOI
// ═══════════════════════════════════════════════════════════
function renderTournaments(tournaments) {
    const grid = document.getElementById('tournamentsGrid');
    grid.innerHTML = '';

    if (!tournaments.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Aucun tournoi correspondant</p></div>';
        return;
    }

    tournaments.forEach(function(t) {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        const start = new Date(t.start_date).toLocaleDateString('fr-FR');
        const end = new Date(t.end_date).toLocaleDateString('fr-FR');
        let badgeClass = '';
        if (t.type === 'public_show') badgeClass = 'badge-show';
        else if (t.type === 'public_detection') badgeClass = 'badge-detection';
        else if (t.type === 'private_hubisoccer') badgeClass = 'badge-private';
        else if (t.type === 'private_simple') badgeClass = 'badge-simple';

        card.innerHTML =
            '<div class="card-badge ' + badgeClass + '">' + escapeHtml(t.typeLabel) + '</div>' +
            '<div class="card-sport"><i class="fas fa-futbol"></i> ' + escapeHtml(t.sport) + '</div>' +
            '<h3 class="card-title">' + escapeHtml(t.name) + '</h3>' +
            '<div class="card-date"><i class="fas fa-calendar-alt"></i> ' + start + ' - ' + end + '</div>' +
            '<div class="card-location"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(t.location) + '</div>' +
            (t.prize_pool ? '<div class="card-prize"><i class="fas fa-trophy"></i> ' + t.prize_pool.toLocaleString() + ' FCFA</div>' : '') +
            '<button class="btn-details" data-id="' + t.id + '">Voir les détails</button>';

        grid.appendChild(card);
    });

    document.querySelectorAll('.btn-details').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.location.href = 'tournament-details.html?id=' + btn.dataset.id;
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

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('createTournamentBtn')?.addEventListener('click', function() {
        window.location.href = 'create-tournament.html';
    });

    await loadFilters();
    await loadAndDisplayTournaments();

    document.getElementById('sportFilter')?.addEventListener('change', applyFilters);
    document.getElementById('periodFilter')?.addEventListener('change', applyFilters);
    document.getElementById('typeFilter')?.addEventListener('change', applyFilters);
});