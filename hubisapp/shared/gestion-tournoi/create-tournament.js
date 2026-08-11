/* ============================================================
   HubISoccer — create-tournament.js
   Système Gestion Tournois — Créer un tournoi
   ------------------------------------------------------------
   Corrections appliquees a ce fichier (trouve non a jour) :
   - created_by JAMAIS ecrit a la creation -> "Mes Tournois Geres"
     restait toujours vide. Ajoute.
   - status JAMAIS ecrit -> tombait sur le defaut 'draft', invisible
     partout (accueil filtre published/completed). Ajoute
     explicitement 'published' (ce formulaire n'offre pas de
     choix brouillon/publie, il cree et publie directement).
   - Tables encore sur l'ancien nom gestionnairetournoi_* (avant
     la migration supabaseAuthPrive_gt_*) -> chaque appel echouait.
   - Profil/Parametres codes en dur vers footballeur -> routage
     dynamique par role, meme table que acceuil.js.
   - Systeme de niveaux (data-tier="gestionnaire") absent -> porte
     depuis acceuil.js pour une sidebar coherente sur tout le
     systeme partage.
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

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ------------------------------------------------------------
// Identique a acceuil.js -- roles pas encore dans cette table :
// liens masques plutot que pointes vers un lien casse.
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

// ═══════════════════════════════════════════════════════════
// 5. LOADER
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
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
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

// Masque les elements data-tier="gestionnaire" pour tout le monde
// sauf le role Gestionnaire de Tournoi lui-meme
function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) {
            el.style.display = 'none';
        });
    }
}

// Route "Mon profil" / "Parametres" vers l'espace du role connecte
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
// 11. CHARGEMENT DES SPORTS ET TYPES
// ═══════════════════════════════════════════════════════════
async function loadSports() {
    const { data, error } = await supabaseClient
        .from(TBL_SPORTS)
        .select('id, name')
        .order('name');
    if (error) { console.warn('Erreur chargement sports :', error.message); return; }
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
    const { data, error } = await supabaseClient
        .from(TBL_TYPES)
        .select('id, name, label')
        .order('label');
    if (error) { console.warn('Erreur chargement types :', error.message); return; }
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
// 12. SOUMISSION DU FORMULAIRE
// ═══════════════════════════════════════════════════════════
async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('Session expirée, merci de vous reconnecter.', 'error');
        return;
    }

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

    if (new Date(endDate) <= new Date(startDate)) {
        showToast('La date de fin doit être après la date de début.', 'warning');
        return;
    }

    const btn = document.querySelector('#createTournamentForm button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
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
            status: 'published',
            created_by: currentUser.id,
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
