/* ============================================================
   HubISoccer — academie-prog.js
   Page Programmes de formation · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles              → partagée (lecture)
   - supabaseAuthPrive_academie_formateurs   → lecture seule
     (alimente le menu déroulant "Formateur responsable")
   - supabaseAuthPrive_academie_programmes   → table de CETTE page
     (SQL : academie-prog-table.sql, sans RLS)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE    = 'supabaseAuthPrive_profiles';
const FORMATEURS_TABLE  = 'supabaseAuthPrive_academie_formateurs';
const PROGRAMMES_TABLE  = 'supabaseAuthPrive_academie_programmes';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser      = null;
let academieProfile  = null;
let allProgrammes     = [];
let editingId         = null;
let currentFilter     = 'all';

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

const CATEGORIE_LABELS = { sportif: 'Sportif', artiste: 'Artistique', mixte: 'Mixte' };
const CATEGORIE_ICONS  = { sportif: 'fa-futbol', artiste: 'fa-music', mixte: 'fa-seedling' };
const STATUT_LABELS    = { actif: 'Actif', a_venir: 'À venir', termine: 'Terminé' };
const STATUT_ICONS     = { actif: 'fa-play-circle', a_venir: 'fa-hourglass-half', termine: 'fa-flag-checkered' };

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

/* ---------- 9. LISTE DÉROULANTE DES FORMATEURS ACTIFS ---------- */
async function loadFormateursDropdown() {
    const select = document.getElementById('progFormateur');
    if (!select || !academieProfile) { return; }

    try {
        const { data, error } = await supabaseClient
            .from(FORMATEURS_TABLE)
            .select('formateur_id, formateur_nom')
            .eq('academie_id', academieProfile.hubisoccer_id)
            .eq('statut', 'accepte')
            .order('formateur_nom', { ascending: true });

        if (!error && data) {
            data.forEach(function(f) {
                const opt = document.createElement('option');
                opt.value = f.formateur_id;
                opt.textContent = f.formateur_nom;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        /* Table pas encore créée ou vide : seule l'option "Non assigné" reste disponible */
    }
}

/* ---------- 10. CHARGEMENT DES PROGRAMMES ---------- */
async function loadProgrammes() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROGRAMMES_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + PROGRAMMES_TABLE + ' :', error.message);
        showToast('Table des programmes absente. Exécutez le script SQL <b>academie-prog-table.sql</b> dans Supabase.', 'warning');
        allProgrammes = [];
        return;
    }
    allProgrammes = data || [];
    updateStats();
    renderProgrammes();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const actifs   = allProgrammes.filter(function(p) { return p.statut === 'actif'; });
    const venir    = allProgrammes.filter(function(p) { return p.statut === 'a_venir'; }).length;
    const termines = allProgrammes.filter(function(p) { return p.statut === 'termine'; }).length;
    const capaciteTotale = actifs.reduce(function(sum, p) { return sum + (p.capacite_max || 0); }, 0);

    setText('statActifs', actifs.length);
    setText('statVenir', venir);
    setText('statTermines', termines);
    setText('statCapacite', capaciteTotale);
}

/* ---------- 12. CONSTRUCTION D'UNE CARTE PROGRAMME ---------- */
function buildProgCard(p) {
    const card = document.createElement('div');
    card.className = 'prog-card statut-' + p.statut;

    const capacitePct = p.capacite_max ? Math.min(Math.round((p.nb_inscrits / p.capacite_max) * 100), 100) : 0;

    card.innerHTML =
        '<div class="prog-head">' +
            '<div>' +
                '<div class="prog-nom">' + escapeHtml(p.nom) + '</div>' +
                (p.discipline ? '<div class="prog-discipline">' + escapeHtml(p.discipline) + '</div>' : '') +
            '</div>' +
        '</div>' +
        '<div class="prog-badges">' +
            '<span class="prog-cat-badge ' + p.categorie + '"><i class="fas ' + CATEGORIE_ICONS[p.categorie] + '"></i> ' + CATEGORIE_LABELS[p.categorie] + '</span>' +
            '<span class="prog-status-badge statut-' + p.statut + '"><i class="fas ' + STATUT_ICONS[p.statut] + '"></i> ' + STATUT_LABELS[p.statut] + '</span>' +
        '</div>' +
        '<div class="prog-meta">' +
            (p.niveau ? '<span><i class="fas fa-layer-group"></i>Niveau ' + escapeHtml(p.niveau) + '</span>' : '') +
            (p.duree ? '<span><i class="fas fa-clock"></i>' + escapeHtml(p.duree) + '</span>' : '') +
            (p.formateur_nom ? '<span><i class="fas fa-chalkboard-teacher"></i>' + escapeHtml(p.formateur_nom) + '</span>' : '') +
        '</div>' +
        (p.capacite_max
            ? '<div class="prog-meta"><span><i class="fas fa-users"></i>' + p.nb_inscrits + ' / ' + p.capacite_max + ' places</span></div>' +
              '<div class="prog-capacite-track"><div class="prog-capacite-fill" style="width:' + capacitePct + '%;"></div></div>'
            : '') +
        (p.description ? '<div class="prog-desc">' + escapeHtml(p.description) + '</div>' : '') +
        '<div class="prog-actions">' +
            '<button class="btn-edit" data-id="' + p.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + p.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 13. RENDU DE LA LISTE ---------- */
function renderProgrammes() {
    const grid  = document.getElementById('progGrid');
    const empty = document.getElementById('progEmpty');
    if (!grid) { return; }

    let filtrees = allProgrammes;
    if (currentFilter !== 'all') {
        filtrees = allProgrammes.filter(function(p) { return p.statut === currentFilter; });
    }

    grid.querySelectorAll('.prog-card').forEach(function(c) { c.remove(); });

    if (filtrees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    filtrees.forEach(function(p) { grid.appendChild(buildProgCard(p)); });
    attachCardListeners(grid);
}

function attachCardListeners(container) {
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerProgramme(btn.dataset.id); });
    });
}

/* ---------- 14. CHARGER UN PROGRAMME DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(progId) {
    const p = allProgrammes.find(function(x) { return String(x.id) === String(progId); });
    if (!p) { return; }
    editingId = p.id;

    document.getElementById('progNom').value = p.nom || '';
    document.querySelectorAll('input[name="progCategorie"]').forEach(function(r) {
        r.checked = (r.value === p.categorie);
    });
    document.getElementById('progDiscipline').value = p.discipline || '';
    document.getElementById('progNiveau').value = p.niveau || '';
    document.getElementById('progDuree').value = p.duree || '';
    document.getElementById('progFormateur').value = p.formateur_id || '';
    document.getElementById('progCapacite').value = p.capacite_max || '';
    document.getElementById('progInscrits').value = p.nb_inscrits || 0;
    document.getElementById('progStatut').value = p.statut || 'actif';
    document.getElementById('progDescription').value = p.description || '';

    const panel = document.getElementById('progFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(p.nom) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 15. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('progNom').value = '';
    document.querySelectorAll('input[name="progCategorie"]').forEach(function(r) {
        r.checked = (r.value === 'sportif');
    });
    document.getElementById('progDiscipline').value = '';
    document.getElementById('progNiveau').value = '';
    document.getElementById('progDuree').value = '';
    document.getElementById('progFormateur').value = '';
    document.getElementById('progCapacite').value = '';
    document.getElementById('progInscrits').value = 0;
    document.getElementById('progStatut').value = 'actif';
    document.getElementById('progDescription').value = '';

    const panel = document.getElementById('progFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Créer un programme'; }
}

/* ---------- 16. ENREGISTRER (création ou édition) ---------- */
async function enregistrerProgramme() {
    const nom = (document.getElementById('progNom')?.value || '').trim();
    if (!nom) {
        showToast('Le nom du programme est obligatoire.', 'warning');
        return;
    }

    const formateurSelect = document.getElementById('progFormateur');
    const formateurId = formateurSelect?.value || null;
    const formateurNom = formateurId ? formateurSelect.options[formateurSelect.selectedIndex].textContent : null;

    const capaciteRaw = document.getElementById('progCapacite')?.value;
    const inscritsRaw = document.getElementById('progInscrits')?.value;

    const payload = {
        academie_id   : academieProfile.hubisoccer_id,
        nom           : nom,
        categorie     : document.querySelector('input[name="progCategorie"]:checked')?.value || 'sportif',
        discipline    : (document.getElementById('progDiscipline')?.value || '').trim() || null,
        niveau        : document.getElementById('progNiveau')?.value || null,
        duree         : (document.getElementById('progDuree')?.value || '').trim() || null,
        capacite_max  : capaciteRaw ? parseInt(capaciteRaw, 10) : null,
        nb_inscrits   : inscritsRaw ? parseInt(inscritsRaw, 10) : 0,
        formateur_id  : formateurId,
        formateur_nom : formateurNom,
        statut        : document.getElementById('progStatut')?.value || 'actif',
        description   : (document.getElementById('progDescription')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingId) {
        const res = await supabaseClient.from(PROGRAMMES_TABLE).update(payload).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(PROGRAMMES_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast(editingId ? 'Programme mis à jour. ✅' : 'Programme créé. 🎓', 'success');
    resetFormulaire();
    await loadProgrammes();
}

/* ---------- 17. SUPPRIMER UN PROGRAMME ---------- */
async function supprimerProgramme(progId) {
    const p = allProgrammes.find(function(x) { return String(x.id) === String(progId); });
    const nom = p ? p.nom : 'ce programme';
    if (!confirm('Supprimer définitivement « ' + nom + ' » ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(PROGRAMMES_TABLE).delete().eq('id', progId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(progId)) { resetFormulaire(); }
    showToast('Programme supprimé.', 'info');
    await loadProgrammes();
}

/* ---------- 18. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#progFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#progFilters .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderProgrammes();
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
    await loadFormateursDropdown();
    await loadProgrammes();

    initFilters();
    initUserMenu();
    initSidebar();

    const btnSave = document.getElementById('btnSaveProg');
    if (btnSave) { btnSave.addEventListener('click', enregistrerProgramme); }
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
