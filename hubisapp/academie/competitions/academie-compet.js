/* ============================================================
   HubISoccer — academie-compet.js
   Page Compétitions · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles           → partagée (lecture)
   - supabaseAuthPrive_academie_compet    → table de CETTE page
     (SQL : academie-compet-table.sql, sans RLS)
   ------------------------------------------------------------
   Statut calculé côté client à partir de date_debut/date_fin
   (jamais stocké, jamais périmé) :
   - aujourd'hui < date_debut                → 'a_venir'
   - date_debut <= aujourd'hui <= date_fin   → 'en_cours'
   - aujourd'hui > date_fin (ou date_debut)  → 'terminee'
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const COMPET_TABLE   = 'supabaseAuthPrive_academie_compet';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser      = null;
let academieProfile  = null;
let allCompets        = [];
let editingId          = null;
let currentFilter      = 'all';

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
const STATUT_LABELS    = { a_venir: 'À venir', en_cours: 'En cours', terminee: 'Terminée' };
const STATUT_ICONS     = { a_venir: 'fa-hourglass-half', en_cours: 'fa-running', terminee: 'fa-flag-checkered' };

/* ---------- 7. STATUT CALCULÉ (jamais stocké) ---------- */
function statutCompetition(dateDebut, dateFin) {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const debut = new Date(dateDebut);
    const fin = dateFin ? new Date(dateFin) : debut;

    if (aujourdHui < debut) { return 'a_venir'; }
    if (aujourdHui > fin) { return 'terminee'; }
    return 'en_cours';
}

/* ---------- 8. SESSION ---------- */
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

/* ---------- 9. CHARGEMENT PROFIL ACADÉMIE ---------- */
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

/* ---------- 10. CHARGEMENT DES COMPÉTITIONS ---------- */
async function loadCompets() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(COMPET_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .order('date_debut', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + COMPET_TABLE + ' :', error.message);
        showToast('Table des compétitions absente. Exécutez le script SQL <b>academie-compet-table.sql</b> dans Supabase.', 'warning');
        allCompets = [];
        return;
    }
    allCompets = data || [];
    updateStats();
    renderCompets();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const avecStatut = allCompets.map(function(c) {
        return { c: c, s: statutCompetition(c.date_debut, c.date_fin) };
    });

    setText('statVenir', avecStatut.filter(function(x) { return x.s === 'a_venir'; }).length);
    setText('statEnCours', avecStatut.filter(function(x) { return x.s === 'en_cours'; }).length);
    setText('statTerminees', avecStatut.filter(function(x) { return x.s === 'terminee'; }).length);
    setText('statTotal', allCompets.length);
}

/* ---------- 12. CONSTRUCTION D'UNE CARTE ---------- */
function buildCompetCard(c) {
    const statut = statutCompetition(c.date_debut, c.date_fin);
    const card = document.createElement('div');
    card.className = 'compet-card statut-' + statut;

    const periode = c.date_fin && c.date_fin !== c.date_debut
        ? formatDateFr(c.date_debut) + ' — ' + formatDateFr(c.date_fin)
        : formatDateFr(c.date_debut);

    card.innerHTML =
        '<div>' +
            '<div class="compet-nom">' + escapeHtml(c.nom) + '</div>' +
            (c.lieu ? '<div class="compet-lieu"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(c.lieu) + '</div>' : '') +
        '</div>' +
        '<div class="compet-badges">' +
            '<span class="compet-cat-badge ' + c.categorie + '"><i class="fas ' + CATEGORIE_ICONS[c.categorie] + '"></i> ' + CATEGORIE_LABELS[c.categorie] + '</span>' +
            '<span class="compet-status-badge statut-' + statut + '"><i class="fas ' + STATUT_ICONS[statut] + '"></i> ' + STATUT_LABELS[statut] + '</span>' +
        '</div>' +
        '<div class="compet-meta">' +
            '<span><i class="fas fa-calendar"></i>' + periode + '</span>' +
            (c.niveau ? '<span><i class="fas fa-layer-group"></i>Niveau ' + escapeHtml(c.niveau) + '</span>' : '') +
            (c.nb_participants ? '<span><i class="fas fa-users"></i>' + c.nb_participants + ' talent(s) engagé(s)</span>' : '') +
        '</div>' +
        (c.resultat ? '<div class="compet-resultat"><i class="fas fa-medal"></i> ' + escapeHtml(c.resultat) + '</div>' : '') +
        (c.description ? '<div class="compet-desc">' + escapeHtml(c.description) + '</div>' : '') +
        '<div class="compet-actions">' +
            '<button class="btn-edit" data-id="' + c.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + c.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 13. RENDU DE LA LISTE ---------- */
function renderCompets() {
    const grid  = document.getElementById('competGrid');
    const empty = document.getElementById('competEmpty');
    if (!grid) { return; }

    let filtrees = allCompets;
    if (currentFilter !== 'all') {
        filtrees = allCompets.filter(function(c) { return statutCompetition(c.date_debut, c.date_fin) === currentFilter; });
    }

    grid.querySelectorAll('.compet-card').forEach(function(c) { c.remove(); });

    if (filtrees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    filtrees.forEach(function(c) { grid.appendChild(buildCompetCard(c)); });
    attachCardListeners(grid);
}

function attachCardListeners(container) {
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerCompet(btn.dataset.id); });
    });
}

/* ---------- 14. CHARGER DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(competId) {
    const c = allCompets.find(function(x) { return String(x.id) === String(competId); });
    if (!c) { return; }
    editingId = c.id;

    document.getElementById('competNom').value = c.nom || '';
    document.querySelectorAll('input[name="competCategorie"]').forEach(function(r) {
        r.checked = (r.value === c.categorie);
    });
    document.getElementById('competNiveau').value = c.niveau || '';
    document.getElementById('competLieu').value = c.lieu || '';
    document.getElementById('competDateDebut').value = c.date_debut || '';
    document.getElementById('competDateFin').value = c.date_fin || '';
    document.getElementById('competParticipants').value = c.nb_participants || '';
    document.getElementById('competResultat').value = c.resultat || '';
    document.getElementById('competDescription').value = c.description || '';

    const panel = document.getElementById('competFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(c.nom) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 15. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('competNom').value = '';
    document.querySelectorAll('input[name="competCategorie"]').forEach(function(r) {
        r.checked = (r.value === 'sportif');
    });
    document.getElementById('competNiveau').value = '';
    document.getElementById('competLieu').value = '';
    document.getElementById('competDateDebut').value = '';
    document.getElementById('competDateFin').value = '';
    document.getElementById('competParticipants').value = '';
    document.getElementById('competResultat').value = '';
    document.getElementById('competDescription').value = '';

    const panel = document.getElementById('competFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une compétition'; }
}

/* ---------- 16. ENREGISTRER (création ou édition) ---------- */
async function enregistrerCompet() {
    const nom = (document.getElementById('competNom')?.value || '').trim();
    const dateDebut = document.getElementById('competDateDebut')?.value || '';

    if (!nom) {
        showToast('Le nom de la compétition est obligatoire.', 'warning');
        return;
    }
    if (!dateDebut) {
        showToast('La date de début est obligatoire.', 'warning');
        return;
    }

    const dateFin = document.getElementById('competDateFin')?.value || null;
    if (dateFin && dateFin < dateDebut) {
        showToast('La date de fin ne peut pas être avant la date de début.', 'warning');
        return;
    }

    const participantsRaw = document.getElementById('competParticipants')?.value;

    const payload = {
        academie_id     : academieProfile.hubisoccer_id,
        nom             : nom,
        categorie       : document.querySelector('input[name="competCategorie"]:checked')?.value || 'sportif',
        niveau          : document.getElementById('competNiveau')?.value || null,
        lieu            : (document.getElementById('competLieu')?.value || '').trim() || null,
        date_debut      : dateDebut,
        date_fin        : dateFin || null,
        nb_participants : participantsRaw ? parseInt(participantsRaw, 10) : null,
        resultat        : (document.getElementById('competResultat')?.value || '').trim() || null,
        description     : (document.getElementById('competDescription')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingId) {
        const res = await supabaseClient.from(COMPET_TABLE).update(payload).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(COMPET_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast(editingId ? 'Compétition mise à jour. ✅' : 'Compétition ajoutée. 🏆', 'success');
    resetFormulaire();
    await loadCompets();
}

/* ---------- 17. SUPPRIMER ---------- */
async function supprimerCompet(competId) {
    const c = allCompets.find(function(x) { return String(x.id) === String(competId); });
    const nom = c ? c.nom : 'cette compétition';
    if (!confirm('Supprimer définitivement « ' + nom + ' » ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(COMPET_TABLE).delete().eq('id', competId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(competId)) { resetFormulaire(); }
    showToast('Compétition supprimée.', 'info');
    await loadCompets();
}

/* ---------- 18. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#competFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#competFilters .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderCompets();
        });
    });
}

/* ---------- 19. MENU UTILISATEUR ---------- */
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

/* ---------- 20. SIDEBAR + SWIPE ---------- */
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

/* ---------- 21. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 22. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!academieProfile) { return; }
    await loadCompets();

    initFilters();
    initUserMenu();
    initSidebar();

    const btnSave = document.getElementById('btnSaveCompet');
    if (btnSave) { btnSave.addEventListener('click', enregistrerCompet); }
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
