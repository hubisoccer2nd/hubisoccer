/* ============================================================
   HubISoccer -- gt-formation.js
   Formation & Certification - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Journal de formation continue -- pas de selecteur externe,
   l'organisateur consigne ses propres formations.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TABLE = 'supabaseAuthPrive_gt_perso_formation';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allEntries = [];
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

const STATUT_LABELS = { completee: 'Complétée', en_cours: 'En cours', prevue: 'Prévue' };
const STATUT_ICONS  = { completee: 'fa-check-circle', en_cours: 'fa-spinner', prevue: 'fa-hourglass-half' };

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

/* ---------- 9. CHARGEMENT DES ENTREES ---------- */
async function loadEntries() {
    if (!userProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .eq('gestionnaire_id', userProfile.hubisoccer_id)
        .order('date_formation', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + TABLE + ' absente :', error.message);
        showToast('Table absente. Exécutez le script SQL <b>gt-formation-table.sql</b> dans Supabase.', 'warning');
        allEntries = [];
        return;
    }
    allEntries = data || [];
    renderAll();
    updateStats();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    document.getElementById('statTotal').textContent = allEntries.length;

    const y = new Date().getFullYear();
    const cetteAnnee = allEntries.filter(function(e) {
        return e.date_formation && new Date(e.date_formation).getFullYear() === y;
    }).length;
    document.getElementById('statAnnee').textContent = cetteAnnee;

    const heures = allEntries.reduce(function(s, e) { return s + (parseFloat(e.duree_heures) || 0); }, 0);
    document.getElementById('statHeures').textContent = heures;

    document.getElementById('statPrevues').textContent = allEntries.filter(function(e) { return e.statut === 'prevue'; }).length;
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const filter = document.getElementById('filterSelect').value;
    const filtered = allEntries.filter(function(e) { return !filter || (e.type_formation === filter); });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-graduation-cap"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';

        const dateStr = item.date_formation ? new Date(item.date_formation).toLocaleDateString('fr-FR') : '';
        let meta = '';
        if (dateStr) meta += '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>';
        if (item.organisme) meta += '<span><i class="fas fa-building"></i>' + escapeHtml(item.organisme) + '</span>';
        if (item.duree_heures) meta += '<span><i class="fas fa-clock"></i>' + item.duree_heures + ' h</span>';

        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + escapeHtml(item.titre) + '</span>' +
            '<span class="entry-badge"><i class="fas ' + (STATUT_ICONS[item.statut] || 'fa-question-circle') + '"></i> ' + (STATUT_LABELS[item.statut] || item.statut) + '</span>' +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            '<div class="entry-type">' + escapeHtml(item.type_formation) + '</div>' +
            (item.notes ? '<div class="entry-notes">' + escapeHtml(item.notes) + '</div>' : '') +
            '<div class="entry-actions">' +
            '<button class="btn-edit" onclick="openEdit(\'' + item.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
            '<button class="btn-del" onclick="deleteEntry(\'' + item.id + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });
}

/* ---------- 12. AJOUTER ---------- */
function openAdd() {
    editingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouvelle formation';
    document.getElementById('entryForm').reset();
    document.getElementById('f__id').value = '';
    document.getElementById('entryModal').classList.add('show');
}

/* ---------- 13. MODIFIER ---------- */
function openEdit(id) {
    const item = allEntries.find(function(e) { return e.id === id; });
    if (!item) return;
    editingId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('f__id').value = id;
    document.getElementById('f_type_formation').value = item.type_formation || '';
    document.getElementById('f_date_formation').value = item.date_formation || '';
    document.getElementById('f_titre').value = item.titre || '';
    document.getElementById('f_organisme').value = item.organisme || '';
    document.getElementById('f_duree_heures').value = item.duree_heures ?? '';
    document.getElementById('f_statut').value = item.statut || 'prevue';
    document.getElementById('f_notes').value = item.notes || '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;

/* ---------- 14. SUPPRIMER ---------- */
async function deleteEntry(id) {
    if (!confirm('Supprimer cette formation ?')) return;
    showLoader();
    const r = await supabaseClient.from(TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Formation supprimée', 'info');
    allEntries = allEntries.filter(function(e) { return e.id !== id; });
    renderAll();
    updateStats();
}
window.deleteEntry = deleteEntry;

/* ---------- 15. ENREGISTRER (ajout ou modification) ---------- */
async function saveEntry() {
    if (!userProfile) return;
    if (!document.getElementById('f_type_formation').value) { showToast('Sélectionnez un type.', 'warning'); return; }
    if (!document.getElementById('f_date_formation').value) { showToast('La date est obligatoire.', 'warning'); return; }
    if (!document.getElementById('f_titre').value.trim()) { showToast('Le titre est obligatoire.', 'warning'); return; }

    const data = {
        type_formation          : document.getElementById('f_type_formation').value,
        date_formation             : document.getElementById('f_date_formation').value,
        titre                         : document.getElementById('f_titre').value.trim(),
        organisme                       : document.getElementById('f_organisme').value || null,
        duree_heures                       : document.getElementById('f_duree_heures').value || null,
        statut                                : document.getElementById('f_statut').value,
        notes                                    : document.getElementById('f_notes').value || null
    };
    data.gestionnaire_id = userProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();

    showLoader();
    let r;
    if (editingId) {
        r = await supabaseClient.from(TABLE).update(data).eq('id', editingId);
    } else {
        data.created_at = new Date().toISOString();
        r = await supabaseClient.from(TABLE).insert([data]).select().single();
    }
    hideLoader();
    if (r.error) { showToast('Erreur enregistrement : ' + r.error.message, 'error'); return; }
    showToast(editingId ? 'Formation modifiée !' : 'Formation enregistrée !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}

/* ---------- 16. MODALE ---------- */
function initModal() {
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

/* ---------- 17. FILTRE ---------- */
function initFilters() {
    const filterSelect = document.getElementById('filterSelect');
    ['Logistique événementielle', 'Gestion de litiges', 'Sécurité & sûreté', 'Certification organisateur', 'Autre'].forEach(function(type) {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        filterSelect.appendChild(opt);
    });
    filterSelect.addEventListener('change', renderAll);
}

/* ---------- 18. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 19. SIDEBAR + SWIPE ---------- */
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

/* ---------- 20. DECONNEXION ---------- */
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

/* ---------- 21. INITIALISATION ---------- */
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

    await loadEntries();
});
