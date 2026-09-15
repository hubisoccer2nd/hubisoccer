/* ============================================================
   HubISoccer -- gt-dash.js
   Tableau de bord - Espace Personnel Gestionnaire de Tournoi
   ------------------------------------------------------------
   Cette page n'a de sens que pour le role TOURN -- si un autre
   role y accede directement par l'URL (le lien lui est deja
   masque dans acceuil.html), on le redirige vers le systeme
   partage plutot que de le laisser voir des donnees qui ne le
   concernent pas.
   Stats de pilotage calculees depuis les tables du systeme
   partage (supabaseAuthPrive_gt_*) -- note moyenne recue reste
   a "--" tant que la page Retours & Evaluations n'existe pas,
   plutot que d'interroger une table qui n'existe pas encore.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TBL_SCOUTING    = 'supabaseAuthPrive_gt_perso_scouting';
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_PARTICIPANTS = 'supabaseAuthPrive_gt_participants';

const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let scoutingData = null;

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

const COMPETENCIES = [
    { key: 'comp_planification_evenementielle', label: 'Planification événementielle', icon: 'fa-calendar-alt' },
    { key: 'comp_gestion_budgetaire',            label: 'Gestion budgétaire',            icon: 'fa-wallet' },
    { key: 'comp_negociation_partenariats',      label: 'Négociation partenariats',      icon: 'fa-handshake' },
    { key: 'comp_gestion_crise_litiges',         label: 'Gestion de crise & litiges',    icon: 'fa-life-ring' },
    { key: 'comp_communication_publique',        label: 'Communication publique',        icon: 'fa-bullhorn' },
    { key: 'comp_coordination_logistique',       label: 'Coordination logistique',       icon: 'fa-truck-loading' },
    { key: 'comp_gestion_equipe',                label: 'Gestion d\'équipe',              icon: 'fa-users-cog' },
    { key: 'comp_securite_conformite',           label: 'Sécurité & conformité',         icon: 'fa-shield-alt' },
    { key: 'comp_marketing_evenementiel',        label: 'Marketing événementiel',        icon: 'fa-ad' },
    { key: 'comp_gestion_inscriptions',          label: 'Gestion des inscriptions',      icon: 'fa-clipboard-check' },
    { key: 'comp_relation_federations',          label: 'Relation fédérations',          icon: 'fa-flag' },
    { key: 'comp_gestion_paiements',             label: 'Gestion des paiements',         icon: 'fa-credit-card' },
    { key: 'comp_animation_communautaire',       label: 'Animation communautaire',       icon: 'fa-comments' },
    { key: 'comp_innovation_evenementielle',     label: 'Innovation événementielle',     icon: 'fa-lightbulb' }
];

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

    // Cette page est exclusive au Gestionnaire de Tournoi -- un
    // autre role qui arrive ici directement par l'URL est renvoye
    // vers le systeme partage, qui est sa vue normale.
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

/* ---------- 9. CHARGEMENT / CREATION DE LA FICHE SCOUTING ---------- */
async function loadScouting() {
    const { data, error } = await supabaseClient
        .from(TBL_SCOUTING)
        .select('*')
        .eq('gestionnaire_id', userProfile.hubisoccer_id)
        .maybeSingle();

    if (error) {
        console.warn('Table ' + TBL_SCOUTING + ' absente ou erreur :', error.message);
        showToast('Table absente. Exécutez le script SQL <b>gt-dash-table.sql</b> dans Supabase.', 'warning');
        return;
    }

    if (data) {
        scoutingData = data;
        return;
    }

    // Premiere visite : creation de la fiche avec les valeurs par defaut
    const { data: created, error: createError } = await supabaseClient
        .from(TBL_SCOUTING)
        .insert([{ gestionnaire_id: userProfile.hubisoccer_id }])
        .select()
        .single();

    if (createError) {
        console.warn('Erreur creation fiche scouting :', createError.message);
        return;
    }
    scoutingData = created;
}

/* ---------- 10. BADGE DE VERIFICATION ---------- */
function renderVerifBadge() {
    const badge = document.getElementById('verifBadge');
    if (!badge || !scoutingData) return;
    const statutMap = {
        non_soumise: { icon: 'fa-circle', cls: 'non-soumise', label: 'Statut non soumis' },
        en_attente: { icon: 'fa-hourglass-half', cls: 'en-attente', label: 'Vérification en attente' },
        approuvee: { icon: 'fa-check-circle', cls: 'approuvee', label: 'Statut vérifié' },
        rejetee: { icon: 'fa-times-circle', cls: 'rejetee', label: 'Vérification rejetée' }
    };
    const s = statutMap[scoutingData.statut_verification] || statutMap.non_soumise;
    badge.className = 'verif-badge ' + s.cls;
    badge.innerHTML = '<i class="fas ' + s.icon + '"></i> ' + s.label;
}

/* ---------- 11. STATS DE PILOTAGE (depuis le systeme partage) ---------- */
async function loadPilotStats() {
    const { data: tournaments, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, prize_pool')
        .eq('created_by', currentUser.id);

    if (error) {
        console.warn('Erreur chargement tournois pour stats :', error.message);
        document.getElementById('statTournoisOrganises').textContent = '—';
        document.getElementById('statParticipantsTouches').textContent = '—';
        document.getElementById('statCagnotteDistribuee').textContent = '—';
        document.getElementById('statNoteMoyenne').textContent = '—';
        return;
    }

    document.getElementById('statTournoisOrganises').textContent = tournaments.length;

    const cagnotte = tournaments.reduce(function(sum, t) { return sum + (Number(t.prize_pool) || 0); }, 0);
    document.getElementById('statCagnotteDistribuee').textContent = formatMoney(cagnotte) + ' FCFA';

    const ids = tournaments.map(function(t) { return t.id; });
    if (!ids.length) {
        document.getElementById('statParticipantsTouches').textContent = '0';
    } else {
        const { count } = await supabaseClient
            .from(TBL_PARTICIPANTS)
            .select('id', { count: 'exact', head: true })
            .in('tournament_id', ids)
            .eq('status', 'approved');
        document.getElementById('statParticipantsTouches').textContent = count || 0;
    }

    // Pas encore de source de donnees pour la note moyenne --
    // la page Retours & Evaluations n'existe pas encore.
    document.getElementById('statNoteMoyenne').textContent = '—';
}

/* ---------- 12. RENDU DES COMPETENCES ---------- */
function renderCompetencies() {
    const grid = document.getElementById('competenciesGrid');
    if (!scoutingData) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Fiche compétences indisponible</p></div>';
        return;
    }
    grid.innerHTML = COMPETENCIES.map(function(c) {
        const value = scoutingData[c.key] != null ? scoutingData[c.key] : 50;
        return '<div class="comp-card">' +
               '<div class="comp-header"><i class="fas ' + c.icon + '"></i><span>' + c.label + '</span></div>' +
               '<div class="comp-bar-track"><div class="comp-bar-fill" style="width:' + value + '%"></div></div>' +
               '<span class="comp-value tabular">' + value + '</span>' +
               '</div>';
    }).join('');
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

    showLoader();
    await loadScouting();
    renderVerifBadge();
    renderCompetencies();
    await loadPilotStats();
    hideLoader();
});
