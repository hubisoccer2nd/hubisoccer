/* ============================================================
   HubISoccer -- gt-impact.js
   Statistiques & Impact - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Aucune nouvelle table -- agrege les tournois deja crees
   (supabaseAuthPrive_gt_tournaments) et leurs participants pour
   produire des vraies courbes/graphiques Chart.js. Rien a saisir
   ici, rien a modifier.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const PARTICIPANTS_TABLE = 'supabaseAuthPrive_gt_participants';
const SPORTS_TABLE = 'supabaseAuthPrive_gt_sports';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allTournaments = [];

const CHART_COLORS = ['#551B8C', '#3498db', '#27ae60', '#FFCC00', '#e74c3c', '#7A35B5', '#9797A3'];

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

/* ---------- 9. CHARGEMENT DES DONNEES ---------- */
async function loadImpactData() {
    showLoader();

    const { data: tournaments, error } = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .select('id, sport_id, start_date, prize_pool, status, ' + SPORTS_TABLE + '(name)')
        .eq('created_by', currentUser.id)
        .order('start_date', { ascending: true });

    if (error) {
        console.warn('Erreur chargement statistiques :', error.message);
        showToast('Erreur lors du chargement des statistiques.', 'error');
        hideLoader();
        allTournaments = [];
        renderEmptyState();
        return;
    }

    allTournaments = (tournaments || []).map(function(t) {
        return {
            id: t.id,
            sport: t[SPORTS_TABLE] ? t[SPORTS_TABLE].name : 'Non précisé',
            start_date: t.start_date,
            prize_pool: t.prize_pool,
            status: t.status
        };
    });

    if (!allTournaments.length) {
        hideLoader();
        renderEmptyState();
        return;
    }

    // Comptes de participants
    let totalParticipants = 0;
    for (const t of allTournaments) {
        const { count } = await supabaseClient
            .from(PARTICIPANTS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', t.id)
            .eq('status', 'approved');
        totalParticipants += (count || 0);
    }

    hideLoader();
    renderHeroStats(totalParticipants);
    renderChartEvolution();
    renderChartSports();
    renderChartStatuts();
}

/* ---------- 10. ETAT VIDE ---------- */
function renderEmptyState() {
    document.getElementById('emptyNote').style.display = 'flex';
    document.querySelector('.charts-grid').style.display = 'none';
    document.getElementById('statTournois').textContent = '0';
    document.getElementById('statParticipants').textContent = '0';
    document.getElementById('statCagnotte').textContent = '0 FCFA';
    document.getElementById('statSports').textContent = '0';
}

/* ---------- 11. STATS HERO ---------- */
function renderHeroStats(totalParticipants) {
    document.getElementById('statTournois').textContent = allTournaments.length;
    document.getElementById('statParticipants').textContent = totalParticipants;

    const cagnotte = allTournaments.reduce(function(sum, t) { return sum + (Number(t.prize_pool) || 0); }, 0);
    document.getElementById('statCagnotte').textContent = formatMoney(cagnotte) + ' FCFA';

    const sportsUniques = new Set(allTournaments.map(function(t) { return t.sport; }));
    document.getElementById('statSports').textContent = sportsUniques.size;
}

/* ---------- 12. GRAPHIQUE : EVOLUTION PAR MOIS ---------- */
function renderChartEvolution() {
    const parMois = {};
    allTournaments.forEach(function(t) {
        if (!t.start_date) return;
        const d = new Date(t.start_date);
        const key = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        parMois[key] = (parMois[key] || 0) + 1;
    });

    const labels = Object.keys(parMois);
    const values = Object.values(parMois);

    new Chart(document.getElementById('chartEvolution'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tournois organisés',
                data: values,
                borderColor: '#551B8C',
                backgroundColor: 'rgba(85,27,140,.08)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#551B8C',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: '#F2F2F6' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* ---------- 13. GRAPHIQUE : REPARTITION PAR SPORT ---------- */
function renderChartSports() {
    const parSport = {};
    allTournaments.forEach(function(t) {
        parSport[t.sport] = (parSport[t.sport] || 0) + 1;
    });

    const labels = Object.keys(parSport);
    const values = Object.values(parSport);

    new Chart(document.getElementById('chartSports'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: CHART_COLORS,
                borderRadius: 8,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: '#F2F2F6' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* ---------- 14. GRAPHIQUE : STATUTS ---------- */
function renderChartStatuts() {
    const labels_map = { draft: 'Brouillon', published: 'Publié', completed: 'Terminé', cancelled: 'Annulé' };
    const colors_map = { draft: '#9797A3', published: '#3498db', completed: '#27ae60', cancelled: '#e74c3c' };

    const parStatut = {};
    allTournaments.forEach(function(t) {
        parStatut[t.status] = (parStatut[t.status] || 0) + 1;
    });

    const keys = Object.keys(parStatut);
    const labels = keys.map(function(k) { return labels_map[k] || k; });
    const values = keys.map(function(k) { return parStatut[k]; });
    const colors = keys.map(function(k) { return colors_map[k] || '#9797A3'; });

    new Chart(document.getElementById('chartStatuts'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
            cutout: '65%'
        }
    });
}

/* ---------- 15. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 16. SIDEBAR + SWIPE ---------- */
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

/* ---------- 17. DECONNEXION ---------- */
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

/* ---------- 18. INITIALISATION ---------- */
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

    await loadImpactData();
});
