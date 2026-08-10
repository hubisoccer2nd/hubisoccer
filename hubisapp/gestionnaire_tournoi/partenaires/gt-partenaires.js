/* ============================================================
   HubISoccer -- gt-partenaires.js
   Mes Partenaires & Sponsors - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Ecrit directement (pas de copie+sed depuis un autre espace)
   pour ce fichier -- une ligne = une relation de partenariat,
   liee optionnellement a un tournoi du systeme partage. Logo
   televerse vers le bucket gt-perso-logos.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const TABLE = 'supabaseAuthPrive_gt_perso_partenaires';
const TOURNAMENTS_TABLE = 'supabaseAuthPrive_gt_tournaments';
const LOGO_BUCKET = 'gt-perso-logos';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allEntries = [];
let myTournaments = [];
let editingId = null;
let selectedLogoFile = null;

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
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}

const STATUT_LABELS = { actif: 'Actif', termine: 'Terminé', en_negociation: 'En négociation' };
const STATUT_ICONS  = { actif: 'fa-check-circle', termine: 'fa-flag-checkered', en_negociation: 'fa-hourglass-half' };

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
        .from(TABLE)
        .select('*')
        .eq('gestionnaire_id', userProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + TABLE + ' absente :', error.message);
        showToast('Table absente. Exécutez le script SQL <b>gt-partenaires-table.sql</b> dans Supabase.', 'warning');
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
    document.getElementById('statActifs').textContent = allEntries.filter(function(e) { return e.statut === 'actif'; }).length;
    document.getElementById('statNegociation').textContent = allEntries.filter(function(e) { return e.statut === 'en_negociation'; }).length;

    const total = allEntries.reduce(function(sum, e) { return sum + (Number(e.montant_contribution) || 0); }, 0);
    document.getElementById('statContributions').textContent = formatMoney(total) + ' FCFA';
}

/* ---------- 12. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterSelect').value;

    const filtered = allEntries.filter(function(e) {
        const matchSearch = !search || (e.nom_partenaire || '').toLowerCase().includes(search);
        const matchFilter = !filter || (e.statut === filter);
        return matchSearch && matchFilter;
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-handshake"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';

        const tournoiNom = item.tournament_id ? (myTournaments.find(function(t) { return String(t.id) === String(item.tournament_id); }) || {}).name : null;

        let meta = '';
        meta += '<span><i class="fas fa-tag"></i>' + escapeHtml(item.type_partenariat) + '</span>';
        if (tournoiNom) meta += '<span><i class="fas fa-trophy"></i>' + escapeHtml(tournoiNom) + '</span>';
        if (item.montant_contribution) meta += '<span class="tabular"><i class="fas fa-coins"></i>' + formatMoney(item.montant_contribution) + ' FCFA</span>';
        if (item.contact_nom) meta += '<span><i class="fas fa-user"></i>' + escapeHtml(item.contact_nom) + '</span>';

        const logoHtml = item.logo_url
            ? '<img src="' + item.logo_url + '" class="partner-logo" alt="Logo">'
            : '<div class="partner-logo-placeholder"><i class="fas fa-handshake"></i></div>';

        card.innerHTML =
            '<div class="entry-card-header">' +
            logoHtml +
            '<div class="entry-card-header-text">' +
            '<span class="entry-card-title">' + escapeHtml(item.nom_partenaire) + '</span>' +
            '<span class="entry-badge"><i class="fas ' + (STATUT_ICONS[item.statut] || 'fa-question-circle') + '"></i> ' + (STATUT_LABELS[item.statut] || item.statut) + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            (item.notes ? '<div class="entry-notes">' + escapeHtml(item.notes) + '</div>' : '') +
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
    selectedLogoFile = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouveau partenaire';
    document.getElementById('entryForm').reset();
    document.getElementById('f__id').value = '';
    document.getElementById('logoPreview').innerHTML = '';
    document.getElementById('entryModal').classList.add('show');
}

/* ---------- 14. MODIFIER ---------- */
function openEdit(id) {
    const item = allEntries.find(function(e) { return e.id === id; });
    if (!item) return;
    editingId = id;
    selectedLogoFile = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('f__id').value = id;
    document.getElementById('f_nom_partenaire').value = item.nom_partenaire || '';
    document.getElementById('f_type_partenariat').value = item.type_partenariat || 'Autre';
    document.getElementById('f_tournament_id').value = item.tournament_id || '';
    document.getElementById('f_contact_nom').value = item.contact_nom || '';
    document.getElementById('f_contact_telephone').value = item.contact_telephone || '';
    document.getElementById('f_contact_email').value = item.contact_email || '';
    document.getElementById('f_montant_contribution').value = item.montant_contribution ?? '';
    document.getElementById('f_statut').value = item.statut || 'actif';
    document.getElementById('f_date_debut').value = item.date_debut || '';
    document.getElementById('f_date_fin').value = item.date_fin || '';
    document.getElementById('f_notes').value = item.notes || '';
    document.getElementById('logoPreview').innerHTML = item.logo_url ? '<img src="' + item.logo_url + '" alt="Logo actuel">' : '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;

/* ---------- 15. SUPPRIMER ---------- */
async function deleteEntry(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    showLoader();
    const r = await supabaseClient.from(TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Partenaire supprimé', 'info');
    allEntries = allEntries.filter(function(e) { return e.id !== id; });
    renderAll();
    updateStats();
}
window.deleteEntry = deleteEntry;

/* ---------- 16. UPLOAD DU LOGO ---------- */
async function uploadLogo(file) {
    const ext = file.name.split('.').pop();
    const path = userProfile.hubisoccer_id + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/* ---------- 17. ENREGISTRER (ajout ou modification) ---------- */
async function saveEntry() {
    if (!userProfile) return;
    if (!document.getElementById('f_nom_partenaire').value.trim()) { showToast('Le nom du partenaire est obligatoire.', 'warning'); return; }

    showLoader();

    let logoUrl = null;
    if (selectedLogoFile) {
        try {
            logoUrl = await uploadLogo(selectedLogoFile);
        } catch (err) {
            hideLoader();
            showToast('Erreur envoi du logo : ' + err.message, 'error');
            return;
        }
    } else if (editingId) {
        const existing = allEntries.find(function(e) { return e.id === editingId; });
        logoUrl = existing ? existing.logo_url : null;
    }

    const data = {
        nom_partenaire        : document.getElementById('f_nom_partenaire').value.trim(),
        type_partenariat         : document.getElementById('f_type_partenariat').value,
        tournament_id                : document.getElementById('f_tournament_id').value || null,
        contact_nom                     : document.getElementById('f_contact_nom').value || null,
        contact_telephone                  : document.getElementById('f_contact_telephone').value || null,
        contact_email                         : document.getElementById('f_contact_email').value || null,
        montant_contribution                     : document.getElementById('f_montant_contribution').value || null,
        statut                                      : document.getElementById('f_statut').value,
        date_debut                                     : document.getElementById('f_date_debut').value || null,
        date_fin                                          : document.getElementById('f_date_fin').value || null,
        notes                                                : document.getElementById('f_notes').value || null,
        logo_url                                                : logoUrl
    };
    data.gestionnaire_id = userProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();

    let r;
    if (editingId) {
        r = await supabaseClient.from(TABLE).update(data).eq('id', editingId);
    } else {
        data.created_at = new Date().toISOString();
        r = await supabaseClient.from(TABLE).insert([data]).select().single();
    }
    hideLoader();
    if (r.error) { showToast('Erreur enregistrement : ' + r.error.message, 'error'); return; }
    showToast(editingId ? 'Partenaire modifié !' : 'Partenaire enregistré !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}

/* ---------- 18. MODALE + LOGO ---------- */
function initModal() {
    document.getElementById('btnAdd').addEventListener('click', openAdd);
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });

    document.getElementById('f_logo_file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('logoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">';
        };
        reader.readAsDataURL(file);
    });
}

/* ---------- 19. RECHERCHE + FILTRE ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterSelect').addEventListener('change', renderAll);
}

/* ---------- 20. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 21. SIDEBAR + SWIPE ---------- */
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

/* ---------- 22. DECONNEXION ---------- */
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

/* ---------- 23. INITIALISATION ---------- */
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

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadMyTournaments();
    await loadEntries();
});
