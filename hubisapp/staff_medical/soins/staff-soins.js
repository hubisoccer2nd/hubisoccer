/* ============================================================
   HubISoccer -- staff-soins.js
   Soins & Physiotherapie - Espace Staff Medical
   ------------------------------------------------------------
   Le selecteur d'athlete se remplit depuis le roster deja
   accepte, comme sur Traumatologie. Journal de seances simple,
   pas de protocole clinique detaille.
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
let allEntries   = [];
let rosterList     = [];
let editingId          = null;
const TABLE      = 'supabaseAuthPrive_staff_medical_soins';
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

/* ---------- 8. CHARGEMENT DU ROSTER (pour le selecteur) ---------- */
async function loadRoster() {
    if (!staffProfile) return;
    const { data, error } = await supabaseClient
        .from(ROSTER_TABLE)
        .select('athlete_id, athlete_nom')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .eq('statut', 'accepted');
    if (error) { rosterList = []; return; }
    rosterList = data || [];
    const select = document.getElementById('f_athlete_id');
    if (select) {
        rosterList.forEach(function(a) {
            const opt = document.createElement('option');
            opt.value = a.athlete_id;
            opt.textContent = a.athlete_nom;
            select.appendChild(opt);
        });
    }
}

/* ---------- 9. CHARGEMENT DES ENTREES ---------- */
async function loadEntries() {
    if (!staffProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .order('date_soin', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + TABLE + ' absente :', error.message);
        showToast('Table absente. Exécutez le script SQL <b>staff-soins-table.sql</b> dans Supabase.', 'warning');
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

    const now = new Date();
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - now.getDay());
    debutSemaine.setHours(0, 0, 0, 0);

    const semaine = allEntries.filter(function(e) {
        return e.date_soin && new Date(e.date_soin) >= debutSemaine;
    }).length;
    document.getElementById('statSemaine').textContent = semaine;

    const m = now.getMonth(), y = now.getFullYear();
    const mois = allEntries.filter(function(e) {
        if (!e.date_soin) return false;
        const d = new Date(e.date_soin);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('statMois').textContent = mois;

    document.getElementById('statAthletes').textContent = new Set(allEntries.map(function(e) { return e.athlete_id; })).size;
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterSelect').value;
    const filtered = allEntries.filter(function(e) {
        const matchSearch = !search || (e.athlete_nom || '').toLowerCase().includes(search);
        const matchFilter = !filter || (e.type_soin === filter);
        return matchSearch && matchFilter;
    });
    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-hand-holding-medical"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        const dateStr = item.date_soin ? new Date(item.date_soin).toLocaleDateString('fr-FR') : '';
        let meta = '';
        if (dateStr) meta += '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>';
        if (item.duree_minutes) meta += '<span><i class="fas fa-clock"></i>' + item.duree_minutes + ' min</span>';
        if (item.demande_par) meta += '<span><i class="fas fa-user"></i>Demandé par : ' + item.demande_par + '</span>';
        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + item.athlete_nom + '</span>' +
            '<span class="entry-badge">' + item.type_soin + '</span>' +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
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
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Nouvelle séance';
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
    document.getElementById('f_athlete_id').value = item.athlete_id || '';
    document.getElementById('f_type_soin').value = item.type_soin || '';
    document.getElementById('f_date_soin').value = item.date_soin || '';
    document.getElementById('f_duree_minutes').value = item.duree_minutes || '';
    document.getElementById('f_demande_par').value = item.demande_par || 'Staff médical';
    document.getElementById('f_notes').value = item.notes || '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;

/* ---------- 14. SUPPRIMER ---------- */
async function deleteEntry(id) {
    if (!confirm('Supprimer cette entrée ?')) return;
    showLoader();
    const r = await supabaseClient.from(TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) { showToast('Erreur suppression', 'error'); return; }
    showToast('Entrée supprimée', 'info');
    allEntries = allEntries.filter(function(e) { return e.id !== id; });
    renderAll();
    updateStats();
}
window.deleteEntry = deleteEntry;

/* ---------- 15. ENREGISTRER (ajout ou modification) ---------- */
async function saveEntry() {
    if (!staffProfile) return;
    const athleteId = document.getElementById('f_athlete_id').value;
    const athleteOpt = document.getElementById('f_athlete_id').selectedOptions[0];

    if (!athleteId) { showToast('Sélectionnez un athlète.', 'warning'); return; }
    if (!document.getElementById('f_type_soin').value) { showToast('Sélectionnez un type de soin.', 'warning'); return; }
    if (!document.getElementById('f_date_soin').value) { showToast('La date est obligatoire.', 'warning'); return; }

    const data = {
        athlete_id      : athleteId,
        athlete_nom       : athleteOpt ? athleteOpt.textContent : '',
        type_soin           : document.getElementById('f_type_soin').value,
        date_soin              : document.getElementById('f_date_soin').value,
        duree_minutes             : document.getElementById('f_duree_minutes').value || null,
        demande_par                 : document.getElementById('f_demande_par').value,
        notes                          : document.getElementById('f_notes').value || null
    };
    data.staff_medical_id = staffProfile.hubisoccer_id;
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
    showToast(editingId ? 'Entrée modifiée !' : 'Séance enregistrée !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}

/* ---------- 16. MODALE ---------- */
function initModal() {
    document.getElementById('btnAdd').addEventListener('click', openAdd);
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });
}

/* ---------- 17. RECHERCHE + FILTRE ---------- */
function initFilters() {
    const filterSelect = document.getElementById('filterSelect');
    ['Massage', 'Cryothérapie', 'Étirements', 'Électrostimulation', 'Bain froid / chaud', 'Ostéopathie', 'Kinésithérapie', 'Autre'].forEach(function(type) {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        filterSelect.appendChild(opt);
    });
    document.getElementById('searchInput').addEventListener('input', renderAll);
    filterSelect.addEventListener('change', renderAll);
}

/* ---------- 18. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}

/* ---------- 19. SIDEBAR + SWIPE ---------- */
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

/* ---------- 20. DECONNEXION ---------- */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=MEDIC';
        });
    });
}

/* ---------- 21. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!staffProfile) {
        hideLoader();
        showToast('Profil introuvable', 'error');
        return;
    }
    await loadRoster();
    await loadEntries();
    initModal();
    initFilters();
    initUserMenu();
    initSidebar();
    initLogout();
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
