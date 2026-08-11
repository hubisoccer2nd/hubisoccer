/* ============================================================
   HubISoccer -- gt-historique.js
   Historique & Archives - Espace Personnel Gestionnaire
   ------------------------------------------------------------
   Lit les tournois "completed" depuis le systeme partage
   (gt_tournaments) et les fusionne avec l'annotation personnelle
   de gt_perso_archives (vainqueur, moments forts, photo) si elle
   existe. Un seul enregistrement d'archive par tournoi -- upsert
   sur tournament_id.
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
const ARCHIVES_TABLE = 'supabaseAuthPrive_gt_perso_archives';
const PHOTO_BUCKET = 'gt-perso-archives-photos';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser = null;
let userProfile = null;
let allEntries = [];
let selectedPhotoFile = null;

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

/* ---------- 9. CHARGEMENT DES TOURNOIS TERMINES + ARCHIVES ---------- */
async function loadEntries() {
    if (!userProfile) return;
    showLoader();

    const { data: tournaments, error: tError } = await supabaseClient
        .from(TOURNAMENTS_TABLE)
        .select('id, name, sport_id, start_date, end_date, prize_pool')
        .eq('created_by', currentUser.id)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

    if (tError) {
        console.warn('Erreur chargement tournois termines :', tError.message);
        showToast('Erreur lors du chargement.', 'error');
        hideLoader();
        allEntries = [];
        return;
    }

    const { data: archives, error: aError } = await supabaseClient
        .from(ARCHIVES_TABLE)
        .select('*')
        .eq('gestionnaire_id', userProfile.hubisoccer_id);

    if (aError) {
        console.warn('Table ' + ARCHIVES_TABLE + ' absente :', aError.message);
        showToast('Table absente. Exécutez le script SQL <b>gt-historique-table.sql</b> dans Supabase.', 'warning');
    }

    const archivesByTournament = {};
    (archives || []).forEach(function(a) { archivesByTournament[a.tournament_id] = a; });

    // Comptes de participants
    for (const t of tournaments) {
        const { count } = await supabaseClient
            .from(PARTICIPANTS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', t.id)
            .eq('status', 'approved');
        t.participant_count = count || 0;
        t.archive = archivesByTournament[t.id] || null;
    }

    allEntries = tournaments;
    hideLoader();
    renderAll();
    updateStats();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    document.getElementById('statTotal').textContent = allEntries.length;
    document.getElementById('statVainqueurs').textContent = allEntries.filter(function(t) { return t.archive && t.archive.vainqueur; }).length;
    document.getElementById('statMomentsForts').textContent = allEntries.filter(function(t) { return t.archive && t.archive.moments_forts; }).length;

    const totalParticipants = allEntries.reduce(function(sum, t) { return sum + (t.participant_count || 0); }, 0);
    document.getElementById('statParticipants').textContent = totalParticipants;
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allEntries.filter(function(t) {
        return !search ||
            (t.name || '').toLowerCase().includes(search) ||
            (t.archive && t.archive.vainqueur && t.archive.vainqueur.toLowerCase().includes(search));
    });

    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-archive"></i><p>Aucun résultat.</p></div>';
        return;
    }

    filtered.forEach(function(t) {
        const card = document.createElement('div');
        card.className = 'entry-card' + (t.archive ? ' documented' : '');

        const start = formatDateShort(t.start_date);
        const end = formatDateShort(t.end_date);

        const photoHtml = t.archive && t.archive.photo_url
            ? '<img src="' + t.archive.photo_url + '" class="archive-photo" alt="Photo souvenir">'
            : '';

        let meta = '<span><i class="fas fa-calendar-alt"></i>' + start + ' → ' + end + '</span>';
        meta += '<span><i class="fas fa-users"></i>' + t.participant_count + ' participants</span>';
        if (t.prize_pool) meta += '<span class="tabular"><i class="fas fa-coins"></i>' + formatMoney(t.prize_pool) + ' FCFA</span>';

        const vainqueurHtml = t.archive && t.archive.vainqueur
            ? '<div class="archive-winner"><i class="fas fa-trophy"></i> ' + escapeHtml(t.archive.vainqueur) + '</div>'
            : '';
        const momentsHtml = t.archive && t.archive.moments_forts
            ? '<div class="archive-highlights">' + escapeHtml(t.archive.moments_forts) + '</div>'
            : '<div class="archive-empty">Pas encore documenté</div>';

        card.innerHTML =
            photoHtml +
            '<div class="entry-card-body">' +
            '<span class="entry-card-title">' + escapeHtml(t.name) + '</span>' +
            '<div class="entry-meta">' + meta + '</div>' +
            vainqueurHtml +
            momentsHtml +
            '<button class="btn-manage" onclick="openAnnotate(' + t.id + ')"><i class="fas fa-edit"></i> ' + (t.archive ? 'Modifier' : 'Documenter') + '</button>' +
            '</div>';

        grid.appendChild(card);
    });
}

/* ---------- 12. OUVRIR L'ANNOTATION ---------- */
function openAnnotate(tournamentId) {
    const t = allEntries.find(function(e) { return e.id === tournamentId; });
    if (!t) return;
    selectedPhotoFile = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-archive"></i> ' + escapeHtml(t.name);
    document.getElementById('f_tournament_id').value = tournamentId;
    document.getElementById('f_vainqueur').value = (t.archive && t.archive.vainqueur) || '';
    document.getElementById('f_moments_forts').value = (t.archive && t.archive.moments_forts) || '';
    document.getElementById('photoPreview').innerHTML = (t.archive && t.archive.photo_url) ? '<img src="' + t.archive.photo_url + '" alt="Photo actuelle">' : '';
    document.getElementById('entryModal').classList.add('show');
}
window.openAnnotate = openAnnotate;

/* ---------- 13. UPLOAD DE LA PHOTO ---------- */
async function uploadPhoto(file) {
    const ext = file.name.split('.').pop();
    const path = userProfile.hubisoccer_id + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/* ---------- 14. ENREGISTRER (upsert) ---------- */
async function saveEntry() {
    if (!userProfile) return;
    const tournamentId = document.getElementById('f_tournament_id').value;
    const t = allEntries.find(function(e) { return String(e.id) === String(tournamentId); });

    showLoader();

    let photoUrl = t.archive ? t.archive.photo_url : null;
    if (selectedPhotoFile) {
        try {
            photoUrl = await uploadPhoto(selectedPhotoFile);
        } catch (err) {
            hideLoader();
            showToast('Erreur envoi de la photo : ' + err.message, 'error');
            return;
        }
    }

    const payload = {
        gestionnaire_id : userProfile.hubisoccer_id,
        tournament_id   : tournamentId,
        vainqueur       : document.getElementById('f_vainqueur').value.trim() || null,
        moments_forts   : document.getElementById('f_moments_forts').value.trim() || null,
        photo_url       : photoUrl,
        updated_at      : new Date().toISOString()
    };

    const r = await supabaseClient
        .from(ARCHIVES_TABLE)
        .upsert(payload, { onConflict: 'tournament_id' })
        .select()
        .single();

    hideLoader();
    if (r.error) { showToast('Erreur enregistrement : ' + r.error.message, 'error'); return; }
    showToast('Archive mise à jour !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}

/* ---------- 15. MODALE + PHOTO ---------- */
function initModal() {
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });

    document.getElementById('f_photo_file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedPhotoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('photoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">';
        };
        reader.readAsDataURL(file);
    });
}

/* ---------- 16. RECHERCHE ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
}

/* ---------- 17. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 18. SIDEBAR + SWIPE ---------- */
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

/* ---------- 19. DECONNEXION ---------- */
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

/* ---------- 20. INITIALISATION ---------- */
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

    await loadEntries();
});
