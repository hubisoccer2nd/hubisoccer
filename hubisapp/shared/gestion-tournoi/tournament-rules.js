/* ============================================================
   HubISoccer — tournament-rules.js
   Système Gestion Tournois — Règlement
   ------------------------------------------------------------
   Corrections appliquees :
   - Le contenu du reglement etait entierement code en dur (7
     paragraphes generiques identiques pour tous les tournois),
     ignorant totalement le champ rules propre a chaque tournoi.
     Desormais lu et affiche reellement, assaini via DOMPurify
     (meme principe que create-tournament/tournament-details).
   - La page exigeait un ?id= et redirigeait sinon -- desormais
     fonctionne aussi SANS id, affichant uniquement le reglement
     general (utile depuis le menu, sans contexte de tournoi
     precis).
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Routage dynamique profil/parametres + niveaux de sidebar.
   - La signature electronique (fonctionnalite deja presente et
     sensee) est conservee -- sa dependance SignaturePad, jamais
     chargee dans le fichier source, l'empechait de fonctionner ;
     corrige au niveau du HTML.
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
// 2. TABLES
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
let signaturePad = null;
let currentTournamentId = null;

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
function sanitizeHtml(raw) {
    return window.DOMPurify ? DOMPurify.sanitize(raw || '') : String(raw || '').replace(/</g, '&lt;');
}
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
// 9. PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
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

function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
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
// 10. RÈGLEMENT SPÉCIFIQUE DU TOURNOI (si ?id= fourni)
// ═══════════════════════════════════════════════════════════
async function loadTournamentSpecificRules() {
    const params = new URLSearchParams(window.location.search);
    currentTournamentId = params.get('id');

    // Sans id : reglement general uniquement, page pleinement
    // utilisable (contrairement au fichier source qui redirigeait)
    if (!currentTournamentId) return;

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, start_date, end_date, rules')
        .eq('id', currentTournamentId)
        .single();
    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable — affichage du règlement général.', 'warning');
        currentTournamentId = null;
        return;
    }

    document.getElementById('tournamentName').textContent = 'Règlement — ' + data.name;
    const start = data.start_date ? new Date(data.start_date).toLocaleDateString('fr-FR') : '—';
    const end = data.end_date ? new Date(data.end_date).toLocaleDateString('fr-FR') : '—';
    document.getElementById('tournamentDates').textContent = start + ' → ' + end;

    if (data.rules) {
        document.getElementById('specificRulesContent').innerHTML = sanitizeHtml(data.rules);
        document.getElementById('specificRulesBlock').style.display = 'block';
    }

    await initSignatureSection();
}

// ═══════════════════════════════════════════════════════════
// 11. SIGNATURE ÉLECTRONIQUE (uniquement si un tournoi est en contexte)
// ═══════════════════════════════════════════════════════════
async function initSignatureSection() {
    if (!currentTournamentId) return;

    const signatureBlock = document.getElementById('signatureBlock');
    signatureBlock.style.display = 'block';

    const { data: existing } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('has_agreed_to_rules')
        .eq('tournament_id', currentTournamentId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (existing && existing.has_agreed_to_rules) {
        signatureBlock.innerHTML = '<div class="already-signed"><i class="fas fa-check-circle"></i> Vous avez déjà accepté le règlement de ce tournoi.</div>';
    } else {
        initSignaturePad();
    }
}

function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas || typeof SignaturePad === 'undefined') return;

    canvas.width = canvas.offsetWidth || 400;
    canvas.height = 200;

    signaturePad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });

    document.getElementById('clearSignatureBtn').addEventListener('click', function() {
        signaturePad.clear();
    });

    document.getElementById('acceptRulesBtn').addEventListener('click', async function() {
        if (signaturePad.isEmpty()) {
            showToast('Veuillez signer avant d\'accepter.', 'warning');
            return;
        }

        const signatureData = signaturePad.toDataURL();

        showLoader();
        const { error } = await supabaseClient
            .from(TBL_PARTICIPANTS)
            .upsert({
                tournament_id: currentTournamentId,
                user_id: currentUser.id,
                has_agreed_to_rules: true,
                signature_data: signatureData,
                agreed_at: new Date().toISOString()
            }, { onConflict: 'tournament_id, user_id' });
        hideLoader();

        if (error) {
            showToast('Erreur lors de l\'enregistrement de la signature.', 'error');
        } else {
            showToast('Règlement accepté avec succès !', 'success');
            document.getElementById('signatureBlock').innerHTML = '<div class="already-signed"><i class="fas fa-check-circle"></i> Vous avez accepté le règlement de ce tournoi.</div>';
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
// 13. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadTournamentSpecificRules();
});
