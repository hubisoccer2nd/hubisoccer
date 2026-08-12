/* ============================================================
   HubISoccer — match-report.js
   Système Gestion Tournois — Saisir un rapport de match
   ------------------------------------------------------------
   Correction critique : un caractere "r" isole trainait juste
   avant ce bloc de commentaire dans le fichier source. En JS
   c'est syntaxiquement valide (identifiant seul comme
   instruction), mais r n'est jamais declare -- provoque une
   ReferenceError des le chargement, avant que la moindre
   fonction n'ait la moindre chance de s'executer. Le fichier
   entier etait donc casse. Retire.
   Tables migrees vers supabaseAuthPrive_gt_*. Routage dynamique
   profil/parametres + niveaux de sidebar ajoutes.
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
const TBL_MATCHES        = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS             = 'supabaseAuthPrive_gt_teams';
const TBL_TOURNAMENTS          = 'supabaseAuthPrive_gt_tournaments';
const TBL_REPORTS                 = 'supabaseAuthPrive_gt_match_reports';
const TBL_PROFILES                   = 'supabaseAuthPrive_profiles';
const REPORT_BUCKET                     = 'tournament-reports';

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
let currentMatchId = null;

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
// 11. RÉCUPÉRATION DE L'ID DU MATCH DANS L'URL
// ═══════════════════════════════════════════════════════════
function getMatchIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match_id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES INFOS DU MATCH (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadMatchInfo() {
    if (!currentMatchId) {
        showToast('Aucun match spécifié.', 'error');
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, team_a_id, team_b_id, match_date, tournament_id')
        .eq('id', currentMatchId)
        .single();

    if (error || !match) {
        hideLoader();
        showToast('Match introuvable.', 'error');
        return;
    }

    let teamAName = 'Équipe A', teamBName = 'Équipe B', tournamentName = '';

    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_a_id).maybeSingle();
        if (teamA) teamAName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_b_id).maybeSingle();
        if (teamB) teamBName = teamB.name;
    }
    if (match.tournament_id) {
        const { data: tData } = await supabaseClient.from(TBL_TOURNAMENTS).select('name, location').eq('id', match.tournament_id).maybeSingle();
        if (tData) {
            tournamentName = tData.name;
            document.getElementById('matchLocation').textContent = tData.location || 'Lieu non précisé';
        }
    }

    document.getElementById('matchTeams').textContent = teamAName + ' vs ' + teamBName + (tournamentName ? ' (' + tournamentName + ')' : '');
    document.getElementById('matchDate').textContent = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';

    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 13. GESTION DU CHANGEMENT DE TYPE DE RAPPORT
// ═══════════════════════════════════════════════════════════
function onReportTypeChange() {
    const type = document.getElementById('reportType').value;
    document.getElementById('refereeForm').style.display = 'none';
    document.getElementById('commissionerForm').style.display = 'none';
    document.getElementById('medicalForm').style.display = 'none';
    if (type === 'referee') document.getElementById('refereeForm').style.display = 'block';
    else if (type === 'commissioner') document.getElementById('commissionerForm').style.display = 'block';
    else if (type === 'medical') document.getElementById('medicalForm').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════
// 14. COLLECTE DES DONNÉES DU FORMULAIRE SELON LE TYPE
// ═══════════════════════════════════════════════════════════
function collectReportData() {
    const type = document.getElementById('reportType').value;
    if (!type) return null;

    const content = {};
    if (type === 'referee') {
        content.homeScore = parseInt(document.getElementById('homeScore').value) || 0;
        content.awayScore = parseInt(document.getElementById('awayScore').value) || 0;
        content.yellowHome = document.getElementById('yellowHome').value || '';
        content.yellowAway = document.getElementById('yellowAway').value || '';
        content.redCards = document.getElementById('redCards').value || '';
        content.remarks = document.getElementById('refereeRemarks').value || '';
    } else if (type === 'commissioner') {
        content.attendance = parseInt(document.getElementById('attendance').value) || 0;
        content.orgRating = parseInt(document.getElementById('orgRating').value) || 1;
        content.remarks = document.getElementById('commissionerRemarks').value || '';
    } else if (type === 'medical') {
        content.injuriesHome = document.getElementById('injuriesHome').value || '';
        content.injuriesAway = document.getElementById('injuriesAway').value || '';
        content.medicalInterventions = document.getElementById('medicalInterventions').value || '';
        content.advice = document.getElementById('medicalAdvice').value || '';
    }
    return content;
}

// ═══════════════════════════════════════════════════════════
// 15. SOUMISSION DU RAPPORT
// ═══════════════════════════════════════════════════════════
async function submitReport() {
    const type = document.getElementById('reportType').value;
    if (!type) {
        showToast('Veuillez sélectionner un type de rapport.', 'warning');
        return;
    }

    const content = collectReportData();
    if (!content) {
        showToast('Données du rapport incomplètes.', 'warning');
        return;
    }

    let fileUrl = null;
    const fileInput = document.getElementById('reportFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        showLoader();
        const filePath = currentMatchId + '/' + Date.now() + '_' + file.name;
        const { error: uploadError } = await supabaseClient.storage.from(REPORT_BUCKET).upload(filePath, file, { upsert: true });
        hideLoader();
        if (uploadError) {
            showToast('Erreur lors de l\'upload du fichier : ' + uploadError.message, 'error');
            return;
        }
        const { data: urlData } = supabaseClient.storage.from(REPORT_BUCKET).getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_REPORTS)
        .insert([{
            match_id: currentMatchId,
            report_type: type,
            user_id: currentUser.id,
            content: content,
            file_url: fileUrl,
            created_at: new Date().toISOString()
        }]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'enregistrement du rapport : ' + error.message, 'error');
        return;
    }

    showToast('Rapport enregistré avec succès !', 'success');
    setTimeout(function() { window.history.back(); }, 2000);
}

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

    currentMatchId = getMatchIdFromUrl();
    await loadMatchInfo();

    document.getElementById('reportType')?.addEventListener('change', onReportTypeChange);
    document.getElementById('submitReport')?.addEventListener('click', submitReport);
    document.getElementById('cancelBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
});
