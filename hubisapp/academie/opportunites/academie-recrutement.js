/* ============================================================
   HubISoccer — academie-recrutement.js
   Page Recrutement & Opportunités · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles                 → partagée (lecture)
   - supabaseAuthPrive_academie_recrutement     → table de CETTE page
     (SQL : academie-recrutement-table.sql, sans RLS)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE     = 'supabaseAuthPrive_profiles';
const RECRUTEMENT_TABLE  = 'supabaseAuthPrive_academie_recrutement';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser      = null;
let academieProfile  = null;
let allCampagnes       = [];
let editingId           = null;
let currentFilter       = 'all';

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) { type = 'info'; }
    if (!duration) { duration = 30000; }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) { el.textContent = (value !== null && value !== undefined && value !== '') ? value : '—'; }
}
function getInitials(name) {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) { return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); }
    return name.charAt(0).toUpperCase();
}
function escapeHtml(str) {
    if (!str) { return ''; }
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function formatDateFr(iso) {
    if (!iso) { return '—'; }
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CATEGORIE_LABELS = { sportif: 'Sportif', artiste: 'Artistique', mixte: 'Mixte' };
const CATEGORIE_ICONS  = { sportif: 'fa-futbol', artiste: 'fa-music', mixte: 'fa-seedling' };
const STATUT_LABELS    = { ouverte: 'Ouverte', fermee: 'Fermée', pourvue: 'Pourvue' };
const STATUT_ICONS     = { ouverte: 'fa-bullhorn', fermee: 'fa-lock', pourvue: 'fa-check-circle' };

/* ---------- 7. SESSION ---------- */
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

/* ---------- 8. CHARGEMENT PROFIL ACADÉMIE ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    academieProfile = data;
    setText('userName', academieProfile.full_name || 'Académie Sportive');
    updateNavbarAvatar();
    return academieProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = academieProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(academieProfile?.full_name || 'A');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. CHARGEMENT DES CAMPAGNES ---------- */
async function loadCampagnes() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(RECRUTEMENT_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + RECRUTEMENT_TABLE + ' :', error.message);
        showToast('Table du recrutement absente. Exécutez le script SQL <b>academie-recrutement-table.sql</b> dans Supabase.', 'warning');
        allCampagnes = [];
        return;
    }
    allCampagnes = data || [];
    updateStats();
    renderCampagnes();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    const ouvertes = allCampagnes.filter(function(c) { return c.statut === 'ouverte'; });
    const pourvues = allCampagnes.filter(function(c) { return c.statut === 'pourvue'; }).length;
    const placesTotal = ouvertes.reduce(function(sum, c) { return sum + (c.places_disponibles || 0); }, 0);

    setText('statOuvertes', ouvertes.length);
    setText('statPlaces', placesTotal);
    setText('statPourvues', pourvues);
    setText('statTotal', allCampagnes.length);
}

/* ---------- 11. CONSTRUCTION D'UNE CARTE ---------- */
function buildCampagneCard(c) {
    const card = document.createElement('div');
    card.className = 'recrut-card statut-' + c.statut;

    let dateLimiteHtml = '';
    if (c.date_limite) {
        const diffJours = Math.round((new Date(c.date_limite) - new Date()) / 86400000);
        const urgent = c.statut === 'ouverte' && diffJours >= 0 && diffJours <= 7;
        dateLimiteHtml = '<span class="' + (urgent ? 'urgent' : '') + '"><i class="fas fa-clock"></i>' +
            'Candidatures jusqu\'au ' + formatDateFr(c.date_limite) +
            (urgent ? ' (bientôt !)' : '') + '</span>';
    }

    card.innerHTML =
        '<div class="recrut-titre">' + escapeHtml(c.titre) + '</div>' +
        '<div class="recrut-badges">' +
            '<span class="recrut-cat-badge ' + c.categorie + '"><i class="fas ' + CATEGORIE_ICONS[c.categorie] + '"></i> ' + CATEGORIE_LABELS[c.categorie] + '</span>' +
            '<span class="recrut-status-badge statut-' + c.statut + '"><i class="fas ' + STATUT_ICONS[c.statut] + '"></i> ' + STATUT_LABELS[c.statut] + '</span>' +
        '</div>' +
        '<div class="recrut-meta">' +
            (c.discipline ? '<span><i class="fas fa-running"></i>' + escapeHtml(c.discipline) + '</span>' : '') +
            (c.niveau_recherche ? '<span><i class="fas fa-layer-group"></i>Niveau ' + escapeHtml(c.niveau_recherche) + '</span>' : '') +
            (c.places_disponibles ? '<span><i class="fas fa-user-plus"></i>' + c.places_disponibles + ' place(s)</span>' : '') +
            dateLimiteHtml +
        '</div>' +
        (c.description ? '<div class="recrut-desc">' + escapeHtml(c.description) + '</div>' : '') +
        '<div class="recrut-actions">' +
            '<button class="btn-edit" data-id="' + c.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + c.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 12. RENDU DE LA LISTE ---------- */
function renderCampagnes() {
    const grid  = document.getElementById('recrutGrid');
    const empty = document.getElementById('recrutEmpty');
    if (!grid) { return; }

    let filtrees = allCampagnes;
    if (currentFilter !== 'all') {
        filtrees = allCampagnes.filter(function(c) { return c.statut === currentFilter; });
    }

    grid.querySelectorAll('.recrut-card').forEach(function(c) { c.remove(); });

    if (filtrees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    filtrees.forEach(function(c) { grid.appendChild(buildCampagneCard(c)); });
    attachCardListeners(grid);
}

function attachCardListeners(container) {
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerCampagne(btn.dataset.id); });
    });
}

/* ---------- 13. CHARGER DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(campagneId) {
    const c = allCampagnes.find(function(x) { return String(x.id) === String(campagneId); });
    if (!c) { return; }
    editingId = c.id;

    document.getElementById('recrutTitre').value = c.titre || '';
    document.querySelectorAll('input[name="recrutCategorie"]').forEach(function(r) {
        r.checked = (r.value === c.categorie);
    });
    document.getElementById('recrutDiscipline').value = c.discipline || '';
    document.getElementById('recrutNiveau').value = c.niveau_recherche || '';
    document.getElementById('recrutPlaces').value = c.places_disponibles || '';
    document.getElementById('recrutDateLimite').value = c.date_limite || '';
    document.getElementById('recrutStatut').value = c.statut || 'ouverte';
    document.getElementById('recrutDescription').value = c.description || '';

    const panel = document.getElementById('recrutFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(c.titre) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 14. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('recrutTitre').value = '';
    document.querySelectorAll('input[name="recrutCategorie"]').forEach(function(r) {
        r.checked = (r.value === 'sportif');
    });
    document.getElementById('recrutDiscipline').value = '';
    document.getElementById('recrutNiveau').value = '';
    document.getElementById('recrutPlaces').value = '';
    document.getElementById('recrutDateLimite').value = '';
    document.getElementById('recrutStatut').value = 'ouverte';
    document.getElementById('recrutDescription').value = '';

    const panel = document.getElementById('recrutFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Publier un appel à talents'; }
}

/* ---------- 15. ENREGISTRER (création ou édition) ---------- */
async function enregistrerCampagne() {
    const titre = (document.getElementById('recrutTitre')?.value || '').trim();
    if (!titre) {
        showToast('Le titre de l\'appel est obligatoire.', 'warning');
        return;
    }

    const placesRaw = document.getElementById('recrutPlaces')?.value;

    const payload = {
        academie_id        : academieProfile.hubisoccer_id,
        titre               : titre,
        categorie           : document.querySelector('input[name="recrutCategorie"]:checked')?.value || 'sportif',
        discipline          : (document.getElementById('recrutDiscipline')?.value || '').trim() || null,
        niveau_recherche    : document.getElementById('recrutNiveau')?.value || null,
        places_disponibles  : placesRaw ? parseInt(placesRaw, 10) : null,
        date_limite         : document.getElementById('recrutDateLimite')?.value || null,
        statut              : document.getElementById('recrutStatut')?.value || 'ouverte',
        description         : (document.getElementById('recrutDescription')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingId) {
        const res = await supabaseClient.from(RECRUTEMENT_TABLE).update(payload).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(RECRUTEMENT_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast(editingId ? 'Appel mis à jour. ✅' : 'Appel publié. 📢', 'success');
    resetFormulaire();
    await loadCampagnes();
}

/* ---------- 16. SUPPRIMER ---------- */
async function supprimerCampagne(campagneId) {
    const c = allCampagnes.find(function(x) { return String(x.id) === String(campagneId); });
    const titre = c ? c.titre : 'cet appel';
    if (!confirm('Supprimer définitivement « ' + titre + ' » ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(RECRUTEMENT_TABLE).delete().eq('id', campagneId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(campagneId)) { resetFormulaire(); }
    showToast('Appel supprimé.', 'info');
    await loadCampagnes();
}

/* ---------- 17. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#recrutFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#recrutFilters .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderCampagnes();
        });
    });
}

/* ---------- 18. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) { return; }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 19. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() {
        if (sb) { sb.classList.add('active'); }
        if (ov) { ov.classList.add('active'); }
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) { sb.classList.remove('active'); }
        if (ov) { ov.classList.remove('active'); }
        document.body.style.overflow = '';
    }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) { return; }
        if (e.cancelable) { e.preventDefault(); }
        if (dx > 0 && sx < 40) { open(); } else if (dx < 0) { close(); }
    }, { passive: false });
}

/* ---------- 20. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 21. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!academieProfile) { return; }
    await loadCampagnes();

    initFilters();
    initUserMenu();
    initSidebar();

    const btnSave = document.getElementById('btnSaveRecrut');
    if (btnSave) { btnSave.addEventListener('click', enregistrerCampagne); }
    const btnReset = document.getElementById('btnResetForm');
    if (btnReset) { btnReset.addEventListener('click', resetFormulaire); }

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
