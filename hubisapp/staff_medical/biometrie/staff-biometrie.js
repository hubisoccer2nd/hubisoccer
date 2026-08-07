/* ============================================================
   HubISoccer -- staff-biometrie.js
   Biometrie & Nutrition - Espace Staff Medical
   ------------------------------------------------------------
   Deux tables independantes (biometrie / nutrition), un seul
   roster partage. Donnees de performance sportive standard --
   jamais cadrees comme gestion du poids ou regime restrictif.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. ETAT GLOBAL ---------- */
let currentUser  = null;
let staffProfile = null;
let rosterList     = [];
let allBio            = [];
let allNut               = [];
let editingBioId            = null;
let editingNutId               = null;

const BIO_TABLE    = 'supabaseAuthPrive_staff_medical_biometrie';
const NUT_TABLE    = 'supabaseAuthPrive_staff_medical_nutrition';
const ROSTER_TABLE = 'supabaseAuthPrive_staff_medical_athletes';

/* ---------- 3. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

/* ---------- 4. TOAST (duree 30 secondes) ---------- */
function showToast(msg, type, dur) {
    type = type || 'info';
    dur   = dur || 30000;
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const ic = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (ic[type] || ic.info) + '"></i></div>' +
                  '<div class="toast-content">' + msg + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { t.remove(); }, 300);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { t.remove(); }, 300);
        }
    }, dur);
}

/* ---------- 5. UTILITAIRES ---------- */
function getInitials(n) {
    if (!n) return '?';
    const p = n.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : n[0]).toUpperCase();
}

/* ---------- 6. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=MEDIC';
        hideLoader();
        return null;
    }
    currentUser = user;
    return currentUser;
}

/* ---------- 7. CHARGEMENT PROFIL ---------- */
async function loadProfile() {
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) { showToast('Erreur profil', 'error'); hideLoader(); return; }
    staffProfile = data;
    document.getElementById('userName').textContent = staffProfile.full_name || 'Staff Médical';
    const ui = document.getElementById('userAvatar'), un = document.getElementById('userAvatarInitials');
    const url = staffProfile.avatar_url;
    if (url && url !== '') { if (ui) { ui.src = url; ui.style.display = 'block'; } if (un) un.style.display = 'none'; }
    else { const init = getInitials(staffProfile.full_name || 'M'); if (un) { un.textContent = init; un.style.display = 'flex'; } if (ui) ui.style.display = 'none'; }
}

/* ---------- 8. CHARGEMENT DU ROSTER (partage entre les 2 onglets) ---------- */
async function loadRoster() {
    if (!staffProfile) return;
    const { data, error } = await supabaseClient
        .from(ROSTER_TABLE)
        .select('athlete_id, athlete_nom')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .eq('statut', 'accepted');
    if (error) { rosterList = []; return; }
    rosterList = data || [];
    ['bio_athlete_id', 'nut_athlete_id'].forEach(function(selId) {
        const select = document.getElementById(selId);
        if (!select) return;
        rosterList.forEach(function(a) {
            const opt = document.createElement('option');
            opt.value = a.athlete_id;
            opt.textContent = a.athlete_nom;
            select.appendChild(opt);
        });
    });
}

/* ================================================================
   ONGLETS DE PAGE
   ================================================================ */
function initPageTabs() {
    document.querySelectorAll('.page-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.page-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-panel').classList.add('active');
        });
    });
}

/* ================================================================
   ONGLET BIOMETRIE
   ================================================================ */
async function loadBio() {
    if (!staffProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(BIO_TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .order('date_mesure', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + BIO_TABLE + ' absente :', error.message);
        showToast('Table biométrie absente. Exécutez <b>staff-biometrie-table.sql</b> dans Supabase.', 'warning');
        allBio = [];
        return;
    }
    allBio = data || [];
    renderBio();
    updateBioStats();
}

function updateBioStats() {
    document.getElementById('bioStatTotal').textContent = allBio.length;
    document.getElementById('bioStatAthletes').textContent = new Set(allBio.map(function(e) { return e.athlete_id; })).size;
    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const mois = allBio.filter(function(e) {
        if (!e.date_mesure) return false;
        const d = new Date(e.date_mesure);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('bioStatMois').textContent = mois;
}

function renderBio() {
    const search = document.getElementById('bioSearchInput').value.toLowerCase();
    const filtered = allBio.filter(function(e) { return !search || (e.athlete_nom || '').toLowerCase().includes(search); });
    const grid = document.getElementById('bioEntriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-weight"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        const dateStr = item.date_mesure ? new Date(item.date_mesure).toLocaleDateString('fr-FR') : '';
        let meta = '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>';
        if (item.poids_kg) meta += '<span><i class="fas fa-weight"></i>' + item.poids_kg + ' kg</span>';
        if (item.masse_grasse_pct) meta += '<span><i class="fas fa-percent"></i>Masse grasse : ' + item.masse_grasse_pct + '%</span>';
        if (item.masse_musculaire_pct) meta += '<span><i class="fas fa-dumbbell"></i>Masse musculaire : ' + item.masse_musculaire_pct + '%</span>';
        card.innerHTML =
            '<div class="entry-card-header"><span class="entry-card-title">' + item.athlete_nom + '</span></div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            '<div class="entry-actions">' +
            '<button class="btn-edit" onclick="openEditBio(\'' + item.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
            '<button class="btn-del" onclick="deleteBio(\'' + item.id + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });
}

function openAddBio() {
    editingBioId = null;
    document.getElementById('bioModalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouvelle mesure';
    document.getElementById('bioForm').reset();
    document.getElementById('bio__id').value = '';
    document.getElementById('bioModal').classList.add('show');
}

function openEditBio(id) {
    const item = allBio.find(function(e) { return e.id === id; });
    if (!item) return;
    editingBioId = id;
    document.getElementById('bioModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('bio__id').value = id;
    document.getElementById('bio_athlete_id').value = item.athlete_id || '';
    document.getElementById('bio_date_mesure').value = item.date_mesure || '';
    document.getElementById('bio_poids_kg').value = item.poids_kg || '';
    document.getElementById('bio_taille_cm').value = item.taille_cm || '';
    document.getElementById('bio_masse_musculaire_pct').value = item.masse_musculaire_pct || '';
    document.getElementById('bio_masse_grasse_pct').value = item.masse_grasse_pct || '';
    document.getElementById('bio_hydratation_pct').value = item.hydratation_pct || '';
    document.getElementById('bio_notes').value = item.notes || '';
    document.getElementById('bioModal').classList.add('show');
}
window.openEditBio = openEditBio;

async function deleteBio(id) {
    if (!confirm('Supprimer cette mesure ?')) return;
    showLoader();
    const r = await supabaseClient.from(BIO_TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Mesure supprimée', 'info');
    allBio = allBio.filter(function(e) { return e.id !== id; });
    renderBio(); updateBioStats();
}
window.deleteBio = deleteBio;

async function saveBio() {
    const athleteId = document.getElementById('bio_athlete_id').value;
    const athleteOpt = document.getElementById('bio_athlete_id').selectedOptions[0];
    if (!athleteId) { showToast('Sélectionnez un athlète.', 'warning'); return; }

    const data = {
        athlete_id                : athleteId,
        athlete_nom                  : athleteOpt ? athleteOpt.textContent : '',
        date_mesure                    : document.getElementById('bio_date_mesure').value,
        poids_kg                          : document.getElementById('bio_poids_kg').value || null,
        taille_cm                            : document.getElementById('bio_taille_cm').value || null,
        masse_musculaire_pct                    : document.getElementById('bio_masse_musculaire_pct').value || null,
        masse_grasse_pct                           : document.getElementById('bio_masse_grasse_pct').value || null,
        hydratation_pct                               : document.getElementById('bio_hydratation_pct').value || null,
        notes                                            : document.getElementById('bio_notes').value || null
    };
    data.staff_medical_id = staffProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();

    showLoader();
    let r;
    if (editingBioId) { r = await supabaseClient.from(BIO_TABLE).update(data).eq('id', editingBioId); }
    else { data.created_at = new Date().toISOString(); r = await supabaseClient.from(BIO_TABLE).insert([data]).select().single(); }
    hideLoader();
    if (r.error) { showToast('Erreur : ' + r.error.message, 'error'); return; }
    showToast(editingBioId ? 'Mesure modifiée !' : 'Mesure enregistrée !', 'success');
    document.getElementById('bioModal').classList.remove('show');
    await loadBio();
}

/* ================================================================
   ONGLET NUTRITION
   ================================================================ */
async function loadNut() {
    if (!staffProfile) return;
    const { data, error } = await supabaseClient
        .from(NUT_TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    if (error) {
        console.warn('Table ' + NUT_TABLE + ' absente :', error.message);
        allNut = [];
        return;
    }
    allNut = data || [];
    renderNut();
    updateNutStats();
    initNutFilter();
}

function updateNutStats() {
    document.getElementById('nutStatTotal').textContent = allNut.length;
    document.getElementById('nutStatAthletes').textContent = new Set(allNut.map(function(e) { return e.athlete_id; })).size;
    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const mois = allNut.filter(function(e) {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('nutStatMois').textContent = mois;
}

let nutFilterInitialized = false;
function initNutFilter() {
    if (nutFilterInitialized) return;
    nutFilterInitialized = true;
    const sel = document.getElementById('nutFilterSelect');
    ["Charge d'entraînement", 'Veille de match', 'Jour de match', 'Récupération', 'Repos'].forEach(function(phase) {
        const opt = document.createElement('option');
        opt.value = phase;
        opt.textContent = phase;
        sel.appendChild(opt);
    });
    sel.addEventListener('change', renderNut);
}

function renderNut() {
    const search = document.getElementById('nutSearchInput').value.toLowerCase();
    const filter = document.getElementById('nutFilterSelect').value;
    const filtered = allNut.filter(function(e) {
        const matchSearch = !search || (e.athlete_nom || '').toLowerCase().includes(search);
        const matchFilter = !filter || (e.phase === filter);
        return matchSearch && matchFilter;
    });
    const grid = document.getElementById('nutEntriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-apple-alt"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        let meta = '<span><i class="fas fa-tag"></i>' + item.phase + '</span>';
        if (item.supplementation) meta += '<span><i class="fas fa-pills"></i>' + item.supplementation + '</span>';
        if (item.date_debut) meta += '<span><i class="fas fa-calendar-alt"></i>Depuis le ' + new Date(item.date_debut).toLocaleDateString('fr-FR') + '</span>';
        card.innerHTML =
            '<div class="entry-card-header"><span class="entry-card-title">' + item.athlete_nom + '</span><span class="entry-badge">' + item.phase + '</span></div>' +
            '<div class="entry-meta">' + meta + '</div>' +
            '<div class="entry-desc" style="font-size:.8rem;color:var(--gray-dark);margin-top:6px;">' + item.recommandations + '</div>' +
            '<div class="entry-actions">' +
            '<button class="btn-edit" onclick="openEditNut(\'' + item.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
            '<button class="btn-del" onclick="deleteNut(\'' + item.id + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });
}

function openAddNut() {
    editingNutId = null;
    document.getElementById('nutModalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouveau plan nutritionnel';
    document.getElementById('nutForm').reset();
    document.getElementById('nut__id').value = '';
    document.getElementById('nutModal').classList.add('show');
}

function openEditNut(id) {
    const item = allNut.find(function(e) { return e.id === id; });
    if (!item) return;
    editingNutId = id;
    document.getElementById('nutModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('nut__id').value = id;
    document.getElementById('nut_athlete_id').value = item.athlete_id || '';
    document.getElementById('nut_phase').value = item.phase || '';
    document.getElementById('nut_recommandations').value = item.recommandations || '';
    document.getElementById('nut_supplementation').value = item.supplementation || '';
    document.getElementById('nut_date_debut').value = item.date_debut || '';
    document.getElementById('nut_date_fin').value = item.date_fin || '';
    document.getElementById('nutModal').classList.add('show');
}
window.openEditNut = openEditNut;

async function deleteNut(id) {
    if (!confirm('Supprimer ce plan ?')) return;
    showLoader();
    const r = await supabaseClient.from(NUT_TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Plan supprimé', 'info');
    allNut = allNut.filter(function(e) { return e.id !== id; });
    renderNut(); updateNutStats();
}
window.deleteNut = deleteNut;

async function saveNut() {
    const athleteId = document.getElementById('nut_athlete_id').value;
    const athleteOpt = document.getElementById('nut_athlete_id').selectedOptions[0];
    const recommandations = document.getElementById('nut_recommandations').value.trim();

    if (!athleteId) { showToast('Sélectionnez un athlète.', 'warning'); return; }
    if (!recommandations) { showToast('Les recommandations sont obligatoires.', 'warning'); return; }

    const data = {
        athlete_id      : athleteId,
        athlete_nom       : athleteOpt ? athleteOpt.textContent : '',
        phase               : document.getElementById('nut_phase').value,
        recommandations       : recommandations,
        supplementation          : document.getElementById('nut_supplementation').value || null,
        date_debut                  : document.getElementById('nut_date_debut').value || null,
        date_fin                       : document.getElementById('nut_date_fin').value || null
    };
    data.staff_medical_id = staffProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();

    showLoader();
    let r;
    if (editingNutId) { r = await supabaseClient.from(NUT_TABLE).update(data).eq('id', editingNutId); }
    else { data.created_at = new Date().toISOString(); r = await supabaseClient.from(NUT_TABLE).insert([data]).select().single(); }
    hideLoader();
    if (r.error) { showToast('Erreur : ' + r.error.message, 'error'); return; }
    showToast(editingNutId ? 'Plan modifié !' : 'Plan enregistré !', 'success');
    document.getElementById('nutModal').classList.remove('show');
    await loadNut();
}

/* ---------- 9. MODALES ---------- */
function initModals() {
    document.getElementById('bioBtnAdd').addEventListener('click', openAddBio);
    document.getElementById('bioModalClose').addEventListener('click', function() { document.getElementById('bioModal').classList.remove('show'); });
    document.getElementById('bioModalCancel').addEventListener('click', function() { document.getElementById('bioModal').classList.remove('show'); });
    document.getElementById('bioModalSave').addEventListener('click', saveBio);
    document.getElementById('bioModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
    document.getElementById('bioSearchInput').addEventListener('input', renderBio);

    document.getElementById('nutBtnAdd').addEventListener('click', openAddNut);
    document.getElementById('nutModalClose').addEventListener('click', function() { document.getElementById('nutModal').classList.remove('show'); });
    document.getElementById('nutModalCancel').addEventListener('click', function() { document.getElementById('nutModal').classList.remove('show'); });
    document.getElementById('nutModalSave').addEventListener('click', saveNut);
    document.getElementById('nutModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
    document.getElementById('nutSearchInput').addEventListener('input', renderNut);
}

/* ---------- 10. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}

/* ---------- 11. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeLeftSidebar');
    function open()  { if (sb) sb.classList.add('active'); if (ov) ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { if (sb) sb.classList.remove('active'); if (ov) ov.classList.remove('active'); document.body.style.overflow = ''; }
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}

/* ---------- 12. DECONNEXION ---------- */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=MEDIC';
        });
    });
}

/* ---------- 13. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!staffProfile) { hideLoader(); showToast('Profil introuvable', 'error'); return; }

    await loadRoster();
    await loadBio();
    await loadNut();

    initPageTabs();
    initModals();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
