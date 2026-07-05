/* ============================================================
   HubISoccer — create-tournament.js
   Page Création d'un tournoi privé– Version adaptée
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
// 9. CHARGEMENT DES SPORTS ET TYPES
// ═══════════════════════════════════════════════════════════
async function loadSports() {
    const { data } = await supabaseClient
        .from('gestionnairetournoi_sports')
        .select('id, name')
        .order('name');
    const select = document.getElementById('sportId');
    if (data) {
        data.forEach(function(sport) {
            const opt = document.createElement('option');
            opt.value = sport.id;
            opt.textContent = sport.name;
            select.appendChild(opt);
        });
    }
}

async function loadTypes() {
    const { data } = await supabaseClient
        .from('gestionnairetournoi_types')
        .select('id, name, label')
        .order('label');
    const select = document.getElementById('tournamentType');
    if (data) {
        data.forEach(function(type) {
            const opt = document.createElement('option');
            opt.value = type.id;
            opt.textContent = type.label;
            select.appendChild(opt);
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 10. SOUMISSION DU FORMULAIRE
// ═══════════════════════════════════════════════════════════
async function handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('tournamentName').value.trim();
    const sportId = parseInt(document.getElementById('sportId').value);
    const typeId = parseInt(document.getElementById('tournamentType').value);
    const registrationCode = document.getElementById('registrationCode').value.trim() || null;
    const description = document.getElementById('description').value.trim() || null;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const location = document.getElementById('tournamentLocation').value.trim() || null;
    const prizePool = parseFloat(document.getElementById('prizePool').value) || 0;
    const requiresFirstPas = document.getElementById('requiresFirstPas').value === 'true';
    const rules = document.getElementById('rules').value.trim() || null;
    const streamUrl = document.getElementById('streamUrl').value.trim() || null;

    if (!name || !sportId || !typeId || !startDate || !endDate) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    const btn = document.querySelector('#createTournamentForm button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .insert([{
            name: name,
            description: description,
            start_date: startDate,
            end_date: endDate,
            location: location,
            registration_code: registrationCode,
            prize_pool: prizePool,
            stream_url: streamUrl,
            requires_first_pas: requiresFirstPas,
            has_agreed_to_rules: false,
            type_id: typeId,
            sport_id: sportId,
            is_active: true,
            created_at: new Date().toISOString()
        }]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la création du tournoi : ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Créer le tournoi';
    } else {
        showToast('Tournoi créé avec succès !', 'success');
        setTimeout(function() {
            window.location.href = 'acceuil.html';
        }, 1500);
    }
}

// ═══════════════════════════════════════════════════════════
// 11. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 12. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    updateNavbarUI();

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    document.getElementById('cancelBtn')?.addEventListener('click', function() {
        window.location.href = 'acceuil.html';
    });

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    await loadSports();
    await loadTypes();

    document.getElementById('createTournamentForm')?.addEventListener('submit', handleSubmit);
});

//==ça marche pas==
