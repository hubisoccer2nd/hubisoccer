/* ============================================================
   HubISoccer — public-register.js
   Système Gestion Tournois — S'inscrire à un tournoi
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Recherche par code utilisait is_active (colonne obsolete) au
     lieu de status='published' -- meme classe de bug que
     create-tournament et my-tournaments.
   - Routage dynamique profil/parametres + niveaux de sidebar.
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
const TBL_PARTICIPANTS  = 'supabaseAuthPrive_gt_participants';
const TBL_PROFILES         = 'supabaseAuthPrive_profiles';

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
let verifiedTournament = null;

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
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
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
// 11. VÉRIFICATION DU CODE D'INSCRIPTION
// ═══════════════════════════════════════════════════════════
async function verifyRegistrationCode() {
    const codeInput = document.getElementById('registrationCode');
    const code = codeInput ? codeInput.value.trim() : '';
    const errorDiv = document.getElementById('codeError');

    if (!code) {
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Veuillez entrer un code.'; }
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*')
        .eq('registration_code', code)
        .eq('status', 'published')
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Code invalide ou tournoi introuvable.'; }
        return;
    }

    const now = new Date();
    const endDate = new Date(data.end_date);
    if (endDate < now) {
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Ce tournoi est déjà terminé.'; }
        return;
    }

    verifiedTournament = data;
    if (errorDiv) errorDiv.style.display = 'none';

    displayTournamentInfo();
    showStep('stepForm');
}

// ═══════════════════════════════════════════════════════════
// 12. AFFICHAGE DES INFOS DU TOURNOI
// ═══════════════════════════════════════════════════════════
function displayTournamentInfo() {
    if (!verifiedTournament) return;
    const container = document.getElementById('tournamentInfo');
    if (!container) return;

    const start = new Date(verifiedTournament.start_date).toLocaleDateString('fr-FR');
    const end = new Date(verifiedTournament.end_date).toLocaleDateString('fr-FR');

    container.innerHTML =
        '<div class="tournoi-detail">' +
        '<h3><i class="fas fa-trophy"></i> ' + escapeHtml(verifiedTournament.name) + '</h3>' +
        '<p><i class="fas fa-calendar-alt"></i> ' + start + ' — ' + end + '</p>' +
        '<p><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(verifiedTournament.location || 'Lieu non précisé') + '</p>' +
        (verifiedTournament.prize_pool ? '<p class="tabular"><i class="fas fa-coins"></i> ' + Number(verifiedTournament.prize_pool).toLocaleString('fr-FR') + ' FCFA</p>' : '') +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 13. CHANGEMENT D'ÉTAPE
// ═══════════════════════════════════════════════════════════
function showStep(stepId) {
    ['stepCode', 'stepForm', 'stepSuccess'].forEach(function(id) {
        document.getElementById(id).classList.remove('active');
        document.getElementById(id).style.display = 'none';
    });
    const target = document.getElementById(stepId);
    if (target) { target.style.display = 'block'; target.classList.add('active'); }
}

// ═══════════════════════════════════════════════════════════
// 14. SOUMISSION DU FORMULAIRE
// ═══════════════════════════════════════════════════════════
async function submitRegistration(e) {
    e.preventDefault();

    if (!verifiedTournament) {
        showToast('Veuillez d\'abord vérifier un code tournoi.', 'error');
        return;
    }

    const agreeCheck = document.getElementById('agreeRules');
    if (!agreeCheck || !agreeCheck.checked) {
        showToast('Vous devez accepter le règlement.', 'warning');
        return;
    }

    const name = document.getElementById('playerName')?.value.trim();
    const email = document.getElementById('playerEmail')?.value.trim();
    const phone = document.getElementById('playerPhone')?.value.trim();
    const birthDate = document.getElementById('playerBirthDate')?.value;
    const club = document.getElementById('playerClub')?.value.trim();

    if (!name || !email || !phone || !birthDate) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .insert([{
            tournament_id: verifiedTournament.id,
            user_id: currentUser.id,
            team_name: club || null,
            status: 'pending',
            created_at: new Date().toISOString()
        }]);
    hideLoader();

    if (error) {
        console.error('Erreur inscription:', error);
        if (error.code === '23505') {
            showToast('Vous êtes déjà inscrit à ce tournoi.', 'warning');
        } else {
            showToast('Erreur lors de l\'inscription : ' + error.message, 'error');
        }
        return;
    }

    showStep('stepSuccess');
}

// ═══════════════════════════════════════════════════════════
// 15. MODALE RÈGLEMENT
// ═══════════════════════════════════════════════════════════
function openRulesModal(e) {
    e.preventDefault();
    if (!verifiedTournament) return;
    const rulesContent = document.getElementById('rulesContent');
    if (rulesContent) {
        rulesContent.innerHTML = '<h3>' + escapeHtml(verifiedTournament.name) + '</h3><p>' + escapeHtml(verifiedTournament.description || 'Aucun règlement détaillé pour ce tournoi.') + '</p>';
    }
    document.getElementById('rulesModal').style.display = 'flex';
}
function closeRulesModal() { document.getElementById('rulesModal').style.display = 'none'; }

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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    document.getElementById('verifyCodeBtn')?.addEventListener('click', verifyRegistrationCode);
    document.getElementById('publicRegistrationForm')?.addEventListener('submit', submitRegistration);
    document.getElementById('rulesLink')?.addEventListener('click', openRulesModal);
    document.getElementById('backToHomeBtn')?.addEventListener('click', function() { window.location.href = 'acceuil.html'; });

    document.getElementById('rulesModal')?.addEventListener('click', function(e) { if (e.target === this) closeRulesModal(); });
    window.closeRulesModal = closeRulesModal;
});
