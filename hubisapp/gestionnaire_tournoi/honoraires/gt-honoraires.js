/* ============================================================
   HubISoccer -- gt-honoraires.js
   Mes Honoraires - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Vue calculee sur supabaseAuthPrive_gt_tournaments (created_by
   = utilisateur), filtree sur les tournois ayant un
   frais_organisation renseigne. Le seul bouton disponible bascule
   statut_paiement_gestionnaire -- rien d'autre a saisir ici.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allEntries = [];

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
function formatDateShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}

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

/* ---------- 9. CHARGEMENT DES HONORAIRES ---------- */
async function loadEntries() {
    if (!userProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .select('id, name, start_date, frais_organisation, statut_paiement_gestionnaire')
        .eq('created_by', currentUser.id)
        .not('frais_organisation', 'is', null)
        .order('start_date', { ascending: false });

    hideLoader();
    if (error) {
        console.warn('Erreur chargement honoraires :', error.message);
        showToast('Colonne absente. Exécutez le script SQL <b>gt-honoraires-table.sql</b> dans Supabase.', 'warning');
        allEntries = [];
        return;
    }
    allEntries = data || [];
    renderAll();
    updateStats();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    const total = allEntries.reduce(function(sum, e) { return sum + (Number(e.frais_organisation) || 0); }, 0);
    document.getElementById('statTotal').textContent = formatMoney(total) + ' FCFA';

    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const ceMois = allEntries.filter(function(e) {
        if (!e.start_date) return false;
        const d = new Date(e.start_date);
        return d.getMonth() === m && d.getFullYear() === y;
    }).reduce(function(sum, e) { return sum + (Number(e.frais_organisation) || 0); }, 0);
    document.getElementById('statMois').textContent = formatMoney(ceMois) + ' FCFA';

    const payes = allEntries.filter(function(e) { return e.statut_paiement_gestionnaire === 'paye'; })
        .reduce(function(sum, e) { return sum + (Number(e.frais_organisation) || 0); }, 0);
    document.getElementById('statPayes').textContent = formatMoney(payes) + ' FCFA';

    const nonPayes = total - payes;
    document.getElementById('statNonPayes').textContent = formatMoney(nonPayes) + ' FCFA';
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterSelect').value;

    const filtered = allEntries.filter(function(e) {
        const matchSearch = !search || (e.name || '').toLowerCase().includes(search);
        const matchFilter = !filter || (e.statut_paiement_gestionnaire === filter);
        return matchSearch && matchFilter;
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-file-invoice-dollar"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        const dateStr = item.start_date ? formatDateShort(item.start_date) : '';
        const estPaye = item.statut_paiement_gestionnaire === 'paye';

        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + escapeHtml(item.name) + '</span>' +
            '<span class="payment-badge ' + (estPaye ? 'paye' : 'non-paye') + '">' + (estPaye ? 'Payé' : 'Non payé') + '</span>' +
            '</div>' +
            '<div class="entry-meta">' +
            (dateStr ? '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>' : '') +
            '<span class="tabular"><i class="fas fa-coins"></i>' + formatMoney(item.frais_organisation) + ' FCFA</span>' +
            '</div>' +
            '<button class="btn-toggle-payment" onclick="togglePayment(\'' + item.id + '\', \'' + item.statut_paiement_gestionnaire + '\')">' +
            '<i class="fas fa-exchange-alt"></i> Marquer ' + (estPaye ? 'non payé' : 'payé') +
            '</button>';
        grid.appendChild(card);
    });
}

/* ---------- 12. BASCULER LE STATUT DE PAIEMENT ---------- */
async function togglePayment(id, currentStatus) {
    const newStatus = currentStatus === 'paye' ? 'non_paye' : 'paye';
    showLoader();
    const r = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .update({ statut_paiement_gestionnaire: newStatus })
        .eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur mise à jour : ' + r.error.message, 'error'); return; }
    showToast('Statut mis à jour !', 'success');
    await loadEntries();
}
window.togglePayment = togglePayment;

/* ---------- 13. RECHERCHE + FILTRE ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterSelect').addEventListener('change', renderAll);
}

/* ---------- 14. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 15. SIDEBAR + SWIPE ---------- */
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

/* ---------- 16. DECONNEXION ---------- */
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

/* ---------- 17. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    const profile = await loadProfile();
    if (!profile) return;

    initUserMenu();
    initSidebar();
    initLogout();
    initFilters();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadEntries();
});
