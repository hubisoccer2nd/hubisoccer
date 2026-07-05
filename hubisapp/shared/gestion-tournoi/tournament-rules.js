/* ============================================================
   HubISoccer — tournament-rules.js
   Page Règlement du tournoi – Version adaptée
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
let signaturePad = null;

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
// 6. RÉCUPÉRATION DE L'ID DU TOURNOI
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        showToast('Aucun identifiant de tournoi fourni.', 'error');
        window.location.href = 'acceuil.html';
        return null;
    }
    return parseInt(id);
}

// ═══════════════════════════════════════════════════════════
// 7. SESSION
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
// 8. CHARGEMENT DU PROFIL
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
// 9. MISE À JOUR DE LA NAVBAR
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
// 10. CHARGEMENT DU RÈGLEMENT
// ═══════════════════════════════════════════════════════════
async function loadTournamentRules(tournamentId) {
    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name, description, start_date, end_date')
        .eq('id', tournamentId)
        .single();

    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable', 'error');
        window.location.href = 'acceuil.html';
        return;
    }

    document.getElementById('tournamentName').textContent = 'Règlement — ' + data.name;
    const start = data.start_date ? new Date(data.start_date).toLocaleDateString('fr-FR') : '—';
    const end = data.end_date ? new Date(data.end_date).toLocaleDateString('fr-FR') : '—';
    document.getElementById('tournamentDates').textContent = start + ' - ' + end;

    // Contenu du règlement (basé sur la description ou un contenu fixe)
    const rulesContent = document.getElementById('rulesContent');
    rulesContent.innerHTML = '<div class="rules-text">' +
        '<h3>1. Généralités</h3>' +
        '<p>Le tournoi "' + escapeHtml(data.name) + '" est organisé par HubISoccer. En participant, vous acceptez de respecter l\'ensemble des règles énoncées ci-dessous.</p>' +
        '<h3>2. Participation</h3>' +
        '<p>Le tournoi est ouvert aux joueurs licenciés et aux équipes dûment inscrites. Toute inscription doit être validée par l\'organisation.</p>' +
        '<h3>3. Règles du jeu</h3>' +
        '<p>Les matchs se déroulent selon les règles officielles de la fédération concernée. Tout comportement antisportif sera sanctionné.</p>' +
        '<h3>4. Arbitrage</h3>' +
        '<p>Les arbitres sont désignés par l\'organisation. Leurs décisions sont sans appel.</p>' +
        '<h3>5. Récompenses</h3>' +
        '<p>Les prix sont attribués selon le classement final. Toute réclamation doit être faite dans les 24 heures suivant la fin du tournoi.</p>' +
        '<h3>6. Droit à l\'image</h3>' +
        '<p>Les participants autorisent HubISoccer à utiliser leur image à des fins promotionnelles liées au tournoi.</p>' +
        '<h3>7. Acceptation du règlement</h3>' +
        '<p>La signature électronique de ce règlement vaut acceptation pleine et entière des conditions ci-dessus.</p>' +
        '</div>';

    // Signature
    const signatureBlock = document.getElementById('signatureBlock');
    if (signatureBlock) {
        signatureBlock.style.display = 'block';

        // Vérifier si l'utilisateur a déjà signé
        const { data: existing } = await supabaseClient
            .from('gestionnairetournoi_participants')
            .select('has_agreed_to_rules')
            .eq('tournament_id', tournamentId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (existing && existing.has_agreed_to_rules) {
            signatureBlock.innerHTML = '<p>Vous avez déjà accepté le règlement de ce tournoi. <i class="fas fa-check-circle" style="color: var(--success);"></i></p>';
        } else {
            initSignaturePad();
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 11. SIGNATURE ÉLECTRONIQUE
// ═══════════════════════════════════════════════════════════
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'white',
        penColor: '#551B8C'
    });

    document.getElementById('clearSignatureBtn').addEventListener('click', function() {
        signaturePad.clear();
    });

    document.getElementById('acceptRulesBtn').addEventListener('click', async function() {
        if (signaturePad.isEmpty()) {
            showToast('Veuillez signer avant d\'accepter.', 'warning');
            return;
        }

        const tournamentId = getTournamentIdFromURL();
        if (!tournamentId) return;

        const signatureData = signaturePad.toDataURL();

        showLoader();
        const { error } = await supabaseClient
            .from('gestionnairetournoi_participants')
            .upsert({
                tournament_id: tournamentId,
                user_id: currentUser.id,
                has_agreed_to_rules: true,
                signature_data: signatureData
            }, { onConflict: 'tournament_id, user_id' });

        hideLoader();

        if (error) {
            showToast('Erreur lors de l\'enregistrement de la signature.', 'error');
        } else {
            showToast('Règlement accepté avec succès !', 'success');
            document.getElementById('signatureBlock').innerHTML = '<p>Vous avez accepté le règlement de ce tournoi. <i class="fas fa-check-circle" style="color: var(--success);"></i></p>';
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 12. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 13. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const tournamentId = getTournamentIdFromURL();
    if (!tournamentId) return;

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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    await loadTournamentRules(tournamentId);
});