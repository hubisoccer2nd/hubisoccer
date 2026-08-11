/* ============================================================
   HubISoccer -- gt-retours.js
   Retours & Evaluations - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Le selecteur de tournoi propose les statuts 'published' et
   'completed' -- pas 'draft' (rien a evaluer avant publication)
   ni 'cancelled'. Pas de contrainte d'unicite : plusieurs
   participants peuvent evaluer le meme tournoi.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const RETOURS_TABLE = 'supabaseAuthPrive_gt_perso_retours';
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allEntries = [];
let myTournaments = [];
let editingId = null;

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
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function renderStars(note) {
    let html = '';
    for (let i = 1; i <= 5; i++) html += '<i class="fas fa-star' + (i <= note ? '' : '-o') + '"></i>';
    return html;
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

/* ---------- 9. CHARGEMENT DES TOURNOIS (pour le selecteur) ---------- */
async function loadMyTournaments() {
    const { data, error } = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .select('id, name')
        .eq('created_by', currentUser.id)
        .in('status', ['published', 'completed'])
        .order('name');
    if (error) { myTournaments = []; return; }
    myTournaments = data || [];
    const select = document.getElementById('f_tournament_id');
    if (select) {
        myTournaments.forEach(function(t) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            select.appendChild(opt);
        });
    }
}

/* ---------- 10. CHARGEMENT DES ENTREES ---------- */
async function loadEntries() {
    if (!userProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(RETOURS_TABLE)
        .select('*')
        .eq('gestionnaire_id', userProfile.hubisoccer_id)
        .order('date_retour', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + RETOURS_TABLE + ' absente :', error.message);
        showToast('Table absente. Exécutez le script SQL <b>gt-retours-table.sql</b> dans Supabase.', 'warning');
        allEntries = [];
        return;
    }
    allEntries = data || [];
    renderAll();
    updateStats();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    document.getElementById('statTotal').textContent = allEntries.length;

    const moyenne = allEntries.length
        ? (allEntries.reduce(function(sum, e) { return sum + e.note; }, 0) / allEntries.length).toFixed(1)
        : '—';
    document.getElementById('statMoyenne').textContent = moyenne;

    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const mois = allEntries.filter(function(e) {
        if (!e.date_retour) return false;
        const d = new Date(e.date_retour);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('statMois').textContent = mois;

    document.getElementById('statCinqEtoiles').textContent = allEntries.filter(function(e) { return e.note === 5; }).length;
}

/* ---------- 12. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allEntries.filter(function(e) {
        const tournoiNom = (myTournaments.find(function(t) { return String(t.id) === String(e.tournament_id); }) || {}).name || '';
        return !search ||
            (e.participant_nom || '').toLowerCase().includes(search) ||
            tournoiNom.toLowerCase().includes(search);
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-comment-dots"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';

        const tournoiNom = (myTournaments.find(function(t) { return String(t.id) === String(item.tournament_id); }) || {}).name || 'Tournoi';
        const dateStr = item.date_retour ? new Date(item.date_retour).toLocaleDateString('fr-FR') : '';

        let meta = '<span><i class="fas fa-trophy"></i>' + escapeHtml(tournoiNom) + '</span>';
        if (dateStr) meta += '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>';

        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + escapeHtml(item.participant_nom || 'Participant anonyme') + '</span>' +
            '<span class="star-rating">' + renderStars(item.note) + '</span>' +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            (item.commentaire ? '<div class="entry-notes">' + escapeHtml(item.commentaire) + '</div>' : '') +
            '<div class="entry-actions">' +
            '<button class="btn-edit" onclick="openEdit(\'' + item.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
            '<button class="btn-del" onclick="deleteEntry(\'' + item.id + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });
}

/* ---------- 13. AJOUTER ---------- */
function openAdd() {
    editingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouveau retour';
    document.getElementById('entryForm').reset();
    document.getElementById('f__id').value = '';
    document.getElementById('f_date_retour').value = new Date().toISOString().substring(0, 10);
    document.getElementById('entryModal').classList.add('show');
}

/* ---------- 14. MODIFIER ---------- */
function openEdit(id) {
    const item = allEntries.find(function(e) { return e.id === id; });
    if (!item) return;
    editingId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('f__id').value = id;
    document.getElementById('f_tournament_id').value = item.tournament_id || '';
    document.getElementById('f_participant_nom').value = item.participant_nom || '';
    document.getElementById('f_date_retour').value = item.date_retour || '';
    document.getElementById('f_note').value = item.note || 5;
    document.getElementById('f_commentaire').value = item.commentaire || '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;

/* ---------- 15. SUPPRIMER ---------- */
async function deleteEntry(id) {
    if (!confirm('Supprimer ce retour ?')) return;
    showLoader();
    const r = await supabaseClient.from(RETOURS_TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Retour supprimé', 'info');
    allEntries = allEntries.filter(function(e) { return e.id !== id; });
    renderAll();
    updateStats();
}
window.deleteEntry = deleteEntry;

/* ---------- 16. ENREGISTRER (ajout ou modification) ---------- */
async function saveEntry() {
    if (!userProfile) return;
    if (!document.getElementById('f_tournament_id').value) { showToast('Sélectionnez un tournoi.', 'warning'); return; }

    const data = {
        tournament_id     : document.getElementById('f_tournament_id').value,
        participant_nom      : document.getElementById('f_participant_nom').value.trim() || null,
        date_retour              : document.getElementById('f_date_retour').value || new Date().toISOString().substring(0, 10),
        note                        : parseInt(document.getElementById('f_note').value, 10),
        commentaire                    : document.getElementById('f_commentaire').value.trim() || null
    };
    data.gestionnaire_id = userProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();

    showLoader();
    let r;
    if (editingId) {
        r = await supabaseClient.from(RETOURS_TABLE).update(data).eq('id', editingId);
    } else {
        data.created_at = new Date().toISOString();
        r = await supabaseClient.from(RETOURS_TABLE).insert([data]).select().single();
    }
    hideLoader();
    if (r.error) { showToast('Erreur enregistrement : ' + r.error.message, 'error'); return; }
    showToast(editingId ? 'Retour modifié !' : 'Retour enregistré !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}

/* ---------- 17. MODALE ---------- */
function initModal() {
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

/* ---------- 18. RECHERCHE ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
}

/* ---------- 19. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 20. SIDEBAR + SWIPE ---------- */
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

/* ---------- 21. DECONNEXION ---------- */
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

/* ---------- 22. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    const profile = await loadProfile();
    if (!profile) return;

    initUserMenu();
    initSidebar();
    initLogout();
    initModal();
    initFilters();

    document.getElementById('btnAdd')?.addEventListener('click', openAdd);

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadMyTournaments();
    await loadEntries();
});
