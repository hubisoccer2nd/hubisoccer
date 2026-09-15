/* ============================================================
   HubISoccer -- staff-athletes.js
   Page Mes Athletes Suivis - Espace Staff Medical
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles               -> partagee (recherche)
   - supabaseAuthPrive_staff_medical_athletes -> table de CETTE page
     (SQL : staff-athletes-table.sql, sans RLS)
   ------------------------------------------------------------
   Meme mecanique de liaison que Mes Talents/Mes Proteges (statut
   pending/accepted/rejected, initiateur staff/athlete). Le badge
   Pass Medical (vert/orange/rouge) est un resume de disponibilite
   -- categorie_raison est une liste fermee, jamais un diagnostic ;
   notes_generales reste volontairement logistique.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const ATHLETES_TABLE = 'supabaseAuthPrive_staff_medical_athletes';

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser     = null;
let staffProfile    = null;
let allLinks           = [];
let foundAthlete         = null;
let currentFilter          = 'all';
let editingLinkId            = null;

/* ---------- 4. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'flex'; } }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'none'; } }

/* ---------- 5. TOAST (duree 30 secondes) ---------- */
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
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
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
    if (el) { el.textContent = (value !== null && value !== undefined && value !== '') ? value : '\u2014'; }
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

const DISPO_LABELS = { vert: 'Vert', orange: 'Orange', rouge: 'Rouge' };
const DISPO_ICONS  = { vert: 'fa-check-circle', orange: 'fa-exclamation-triangle', rouge: 'fa-times-circle' };

/* ---------- 7. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    hideLoader();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=MEDIC';
        return null;
    }
    currentUser = user;
    return currentUser;
}

/* ---------- 8. CHARGEMENT PROFIL STAFF ---------- */
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
    staffProfile = data;
    setText('userName', staffProfile.full_name || 'Staff Médical');
    updateNavbarAvatar();
    return staffProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = staffProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(staffProfile?.full_name || 'M');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. CHARGEMENT DES LIAISONS ---------- */
async function loadLinks() {
    if (!staffProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(ATHLETES_TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + ATHLETES_TABLE + ' absente :', error.message);
        showToast('Table des athlètes absente. Exécutez le script SQL <b>staff-athletes-table.sql</b> dans Supabase.', 'warning');
        allLinks = [];
        return;
    }
    allLinks = data || [];
    updateStats();
    renderReceived();
    renderSent();
    renderRoster();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    const acceptes = allLinks.filter(function(l) { return l.statut === 'accepted'; });
    const attente  = allLinks.filter(function(l) { return l.statut === 'pending'; }).length;
    const orange   = acceptes.filter(function(l) { return l.statut_dispo === 'orange'; }).length;
    const rouge    = acceptes.filter(function(l) { return l.statut_dispo === 'rouge'; }).length;

    setText('statTotal', acceptes.length);
    setText('statAttente', attente);
    setText('statOrange', orange);
    setText('statRouge', rouge);
    setText('notifBadge', attente);
}

/* ================================================================
   RECHERCHE & INVITATION
   ================================================================ */
async function rechercherAthlete() {
    const id = (document.getElementById('searchAthleteId')?.value || '').trim();
    if (!id) {
        showToast('Entrez un ID HubISoccer à rechercher.', 'warning');
        return;
    }

    const dejaLie = allLinks.find(function(l) { return l.athlete_id === id; });
    if (dejaLie) {
        const labels = { pending: 'en attente de réponse', accepted: 'déjà dans votre roster', rejected: 'précédemment refusée' };
        showToast('Cet athlète a déjà une liaison ' + (labels[dejaLie.statut] || '') + ' avec vous.', 'warning');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('hubisoccer_id', id)
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        showToast('Aucun athlète trouvé avec cet ID. Vérifiez l\'orthographe.', 'error');
        document.getElementById('searchResult').style.display = 'none';
        foundAthlete = null;
        return;
    }

    foundAthlete = data;
    document.getElementById('foundName').textContent = data.full_name || 'Athlète';
    document.getElementById('foundId').textContent = 'ID : ' + data.hubisoccer_id;
    document.getElementById('foundRole').textContent = data.position || data.role || 'Discipline non renseignée';

    const av = document.getElementById('foundAvatar');
    const ini = document.getElementById('foundInitials');
    if (data.avatar_url) {
        av.src = data.avatar_url; av.style.display = 'block'; ini.style.display = 'none';
    } else {
        ini.textContent = getInitials(data.full_name); ini.style.display = 'flex'; av.style.display = 'none';
    }

    document.getElementById('searchResult').style.display = 'block';
    document.getElementById('searchResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function annulerRecherche() {
    foundAthlete = null;
    document.getElementById('searchResult').style.display = 'none';
    document.getElementById('searchAthleteId').value = '';
}

async function envoyerInvitation() {
    if (!foundAthlete) { return; }

    const payload = {
        staff_medical_id : staffProfile.hubisoccer_id,
        athlete_id         : foundAthlete.hubisoccer_id,
        athlete_nom          : foundAthlete.full_name || 'Athlète',
        athlete_discipline     : foundAthlete.position || null,
        photo_url                : foundAthlete.avatar_url || null,
        initiateur                 : 'staff',
        statut                      : 'pending',
        date_debut_suivi              : new Date().toISOString().substring(0, 10)
    };

    showLoader();
    const { error } = await supabaseClient.from(ATHLETES_TABLE).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast('Proposition de suivi envoyée à ' + payload.athlete_nom + '.', 'success');
    annulerRecherche();
    await loadLinks();
}

/* ================================================================
   DEMANDES RECUES (initiateur = athlete)
   ================================================================ */
function renderReceived() {
    const grid  = document.getElementById('receivedList');
    const empty = document.getElementById('receivedEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.initiateur === 'athlete' && l.statut === 'pending'; });
    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-top">' +
                '<div class="request-avatar">' + (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.athlete_nom))) + '</div>' +
                '<div><div class="request-name">' + escapeHtml(l.athlete_nom) + '</div><div class="request-discipline">' + escapeHtml(l.athlete_discipline || '—') + '</div></div>' +
            '</div>' +
            '<div class="request-actions">' +
                '<button class="btn-accept" data-id="' + l.id + '"><i class="fas fa-check"></i> Accepter</button>' +
                '<button class="btn-decline" data-id="' + l.id + '"><i class="fas fa-times"></i> Refuser</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-accept').forEach(function(btn) { btn.addEventListener('click', function() { repondreDemande(btn.dataset.id, 'accepted'); }); });
    grid.querySelectorAll('.btn-decline').forEach(function(btn) { btn.addEventListener('click', function() { repondreDemande(btn.dataset.id, 'rejected'); }); });
}

async function repondreDemande(linkId, statut) {
    if (statut === 'rejected' && !confirm('Refuser cette demande ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(ATHLETES_TABLE).update({ statut: statut }).eq('id', linkId);
    hideLoader();
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast(statut === 'accepted' ? 'Athlète ajouté à votre roster.' : 'Demande refusée.', statut === 'accepted' ? 'success' : 'info');
    await loadLinks();
}

/* ================================================================
   DEMANDES ENVOYEES (initiateur = staff, en attente)
   ================================================================ */
function renderSent() {
    const grid  = document.getElementById('sentList');
    const empty = document.getElementById('sentEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.initiateur === 'staff' && l.statut === 'pending'; });
    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-top">' +
                '<div class="request-avatar">' + (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.athlete_nom))) + '</div>' +
                '<div><div class="request-name">' + escapeHtml(l.athlete_nom) + '</div><div class="request-discipline">' + escapeHtml(l.athlete_discipline || '—') + '</div></div>' +
            '</div>' +
            '<span class="request-pending-tag"><i class="fas fa-clock"></i> En attente de sa réponse</span>';
        grid.appendChild(card);
    });
}

/* ================================================================
   MON ROSTER (statut = accepted) + PASS MEDICAL
   ================================================================ */
function renderRoster() {
    const grid  = document.getElementById('athletesList');
    const empty = document.getElementById('athletesEmpty');
    if (!grid) { return; }

    let liste = allLinks.filter(function(l) { return l.statut === 'accepted'; });
    if (currentFilter !== 'all') {
        liste = liste.filter(function(l) { return l.statut_dispo === currentFilter; });
    }

    grid.querySelectorAll('.athlete-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const dispo = l.statut_dispo || 'vert';
        const card = document.createElement('div');
        card.className = 'athlete-card';
        card.innerHTML =
            '<div class="athlete-avatar">' + (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.athlete_nom))) + '</div>' +
            '<div class="athlete-name">' + escapeHtml(l.athlete_nom) + '</div>' +
            '<div class="athlete-discipline">' + escapeHtml(l.athlete_discipline || '—') + '</div>' +
            '<span class="dispo-badge ' + dispo + '"><i class="fas ' + DISPO_ICONS[dispo] + '"></i> ' + DISPO_LABELS[dispo] + '</span>' +
            (l.categorie_raison ? '<div class="athlete-raison">' + escapeHtml(l.categorie_raison) + '</div>' : '') +
            '<button class="athlete-remove btn-update-dispo" data-id="' + l.id + '"><i class="fas fa-notes-medical"></i> Mettre à jour</button>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-update-dispo').forEach(function(btn) {
        btn.addEventListener('click', function() { ouvrirModaleStatut(btn.dataset.id); });
    });
}

/* ---------- 11. MODALE PASS MEDICAL ---------- */
function ouvrirModaleStatut(linkId) {
    const link = allLinks.find(function(l) { return String(l.id) === String(linkId); });
    if (!link) { return; }
    editingLinkId = linkId;

    document.getElementById('modalAthleteNom').textContent = link.athlete_nom;
    document.querySelectorAll('input[name="statutDispo"]').forEach(function(r) { r.checked = (r.value === (link.statut_dispo || 'vert')); });
    document.getElementById('categorieRaison').value = link.categorie_raison || '';
    document.getElementById('dateRetour').value = link.date_prevue_retour || '';
    document.getElementById('notesGenerales').value = link.notes_generales || '';

    toggleRaisonFields();
    document.getElementById('statutModal').classList.add('show');
}

function toggleRaisonFields() {
    const val = document.querySelector('input[name="statutDispo"]:checked')?.value || 'vert';
    const raisonFields = document.getElementById('raisonFields');
    if (raisonFields) { raisonFields.style.display = (val === 'vert') ? 'none' : 'block'; }
}

function fermerModaleStatut() {
    document.getElementById('statutModal').classList.remove('show');
    editingLinkId = null;
}

async function enregistrerStatut() {
    if (!editingLinkId) { return; }
    const dispo = document.querySelector('input[name="statutDispo"]:checked')?.value || 'vert';

    const payload = {
        statut_dispo       : dispo,
        categorie_raison     : dispo !== 'vert' ? (document.getElementById('categorieRaison')?.value || null) : null,
        date_prevue_retour     : dispo !== 'vert' ? (document.getElementById('dateRetour')?.value || null) : null,
        notes_generales           : (document.getElementById('notesGenerales')?.value || '').trim() || null
    };

    showLoader();
    const { error } = await supabaseClient.from(ATHLETES_TABLE).update(payload).eq('id', editingLinkId);
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Pass Médical mis à jour. ✅', 'success');
    fermerModaleStatut();
    await loadLinks();
}

/* ---------- 12. FILTRES ROSTER ---------- */
function initFilters() {
    document.querySelectorAll('#filterTabs .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#filterTabs .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderRoster();
        });
    });
}

/* ---------- 13. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) { return; }
    menu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 14. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() { if (sb) { sb.classList.add('active'); } if (ov) { ov.classList.add('active'); } document.body.style.overflow = 'hidden'; }
    function close() { if (sb) { sb.classList.remove('active'); } if (ov) { ov.classList.remove('active'); } document.body.style.overflow = ''; }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) { return; }
        if (e.cancelable) { e.preventDefault(); }
        if (dx > 0 && sx < 40) { open(); } else if (dx < 0) { close(); }
    }, { passive: false });
}

/* ---------- 15. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html?role=MEDIC';
}

/* ---------- 16. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!staffProfile) { return; }
    await loadLinks();

    initFilters();
    initUserMenu();
    initSidebar();

    document.getElementById('btnSearchAthlete')?.addEventListener('click', rechercherAthlete);
    document.getElementById('searchAthleteId')?.addEventListener('keypress', function(e) { if (e.key === 'Enter') { rechercherAthlete(); } });
    document.getElementById('btnCancelSearch')?.addEventListener('click', annulerRecherche);
    document.getElementById('btnSendRequest')?.addEventListener('click', envoyerInvitation);

    document.getElementById('modalClose')?.addEventListener('click', fermerModaleStatut);
    document.getElementById('modalCancel')?.addEventListener('click', fermerModaleStatut);
    document.getElementById('modalSave')?.addEventListener('click', enregistrerStatut);
    document.getElementById('statutModal')?.addEventListener('click', function(e) { if (e.target === this) { fermerModaleStatut(); } });
    document.querySelectorAll('input[name="statutDispo"]').forEach(function(r) { r.addEventListener('change', toggleRaisonFields); });

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) { e.preventDefault(); logout(); });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
        });
    }

    /* Pre-remplissage depuis Scouting (?id=...) */
    const preselectedId = new URLSearchParams(window.location.search).get('id');
    const searchInput = document.getElementById('searchAthleteId');
    if (preselectedId && searchInput) {
        searchInput.value = preselectedId;
        rechercherAthlete();
    }
});
