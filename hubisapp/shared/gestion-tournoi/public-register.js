/* ============================================================
   HubISoccer — public-register.js
   Inscription publique à un tournoi
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
let verifiedTournament = null; // stocke le tournoi vérifié

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
// 9. VÉRIFICATION DU CODE D'INSCRIPTION
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
        .from('gestionnairetournoi_tournaments')
        .select('*')
        .eq('registration_code', code)
        .eq('is_active', true)
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Code invalide ou tournoi introuvable.'; }
        return;
    }

    // Vérifier que le tournoi n'est pas terminé
    const now = new Date();
    const endDate = new Date(data.end_date);
    if (endDate < now) {
        if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = 'Ce tournoi est déjà terminé.'; }
        return;
    }

    verifiedTournament = data;
    if (errorDiv) errorDiv.style.display = 'none';

    // Afficher les informations du tournoi
    displayTournamentInfo();
    showStep('stepForm');
}

// ═══════════════════════════════════════════════════════════
// 10. AFFICHAGE DES INFOS DU TOURNOI
// ═══════════════════════════════════════════════════════════
function displayTournamentInfo() {
    if (!verifiedTournament) return;
    const container = document.getElementById('tournamentInfo');
    if (!container) return;

    const start = new Date(verifiedTournament.start_date).toLocaleDateString('fr-FR');
    const end = new Date(verifiedTournament.end_date).toLocaleDateString('fr-FR');

    container.innerHTML =
        '<div class="tournoi-detail">' +
        '<h3><i class="fas fa-trophy"></i> ' + verifiedTournament.name + '</h3>' +
        '<p><i class="fas fa-calendar-alt"></i> ' + start + ' - ' + end + '</p>' +
        '<p><i class="fas fa-map-marker-alt"></i> ' + (verifiedTournament.location || 'Lieu non précisé') + '</p>' +
        (verifiedTournament.prize_pool ? '<p><i class="fas fa-coins"></i> ' + verifiedTournament.prize_pool.toLocaleString() + ' FCFA</p>' : '') +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 11. CHANGEMENT D'ÉTAPE
// ═══════════════════════════════════════════════════════════
function showStep(stepId) {
    document.getElementById('stepCode').classList.remove('active');
    document.getElementById('stepForm').classList.remove('active');
    document.getElementById('stepSuccess').classList.remove('active');

    document.getElementById('stepCode').style.display = 'none';
    document.getElementById('stepForm').style.display = 'none';
    document.getElementById('stepSuccess').style.display = 'none';

    const target = document.getElementById(stepId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
}

// ═══════════════════════════════════════════════════════════
// 12. SOUMISSION DU FORMULAIRE
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
    const position = document.getElementById('playerPosition')?.value.trim();
    const club = document.getElementById('playerClub')?.value.trim();
    const message = document.getElementById('playerMessage')?.value.trim();

    if (!name || !email || !phone || !birthDate) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_participants')
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
            showToast('Erreur lors de l\'inscription.', 'error');
        }
        return;
    }

    showStep('stepSuccess');
}

// ═══════════════════════════════════════════════════════════
// 13. MODALE RÈGLEMENT
// ═══════════════════════════════════════════════════════════
function openRulesModal(e) {
    e.preventDefault();
    if (!verifiedTournament) return;

    const rulesContent = document.getElementById('rulesContent');
    if (rulesContent) {
        rulesContent.innerHTML =
            '<h3>' + verifiedTournament.name + '</h3>' +
            '<p>' + (verifiedTournament.description || 'Aucun règlement détaillé pour ce tournoi.') + '</p>';
    }
    document.getElementById('rulesModal').style.display = 'flex';
}

function closeRulesModal() {
    document.getElementById('rulesModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 14. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 15. INITIALISATION
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

    document.getElementById('verifyCodeBtn')?.addEventListener('click', verifyRegistrationCode);
    document.getElementById('publicRegistrationForm')?.addEventListener('submit', submitRegistration);
    document.getElementById('rulesLink')?.addEventListener('click', openRulesModal);
    document.getElementById('backToHomeBtn')?.addEventListener('click', function() {
        window.location.href = 'acceuil.html';
    });

    document.getElementById('rulesModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeRulesModal();
    });

    window.closeRulesModal = closeRulesModal;
});