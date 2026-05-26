/* ============================================================
   HubISoccer — parrain-proteges.js
   Espace Parrain · Mes Protégés
   ============================================================ */

'use strict';

/* DEBUT : CONFIGURATION SUPABASE */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
/* FIN : CONFIGURATION SUPABASE */

/* DEBUT : ÉTAT GLOBAL */
let currentUser  = null;
let userProfile  = null;
let allEntries   = [];
let editingId    = null;
const TABLE      = 'supabaseAuthPrive_parrain_proteges';
const FK         = 'parrain_id';
/* FIN : ÉTAT GLOBAL */

/* DEBUT : FONCTION SHOWLOADER */
function showLoader() {
    var l = document.getElementById('globalLoader');
    if (l) l.style.display = 'flex';
}
/* FIN : FONCTION SHOWLOADER */

/* DEBUT : FONCTION HIDELOADER */
function hideLoader() {
    var l = document.getElementById('globalLoader');
    if (l) l.style.display = 'none';
}
/* FIN : FONCTION HIDELOADER */

/* DEBUT : FONCTION SHOWTOAST */
function showToast(msg, type, dur) {
    type = type || 'info';
    dur   = dur || 30000;
    var c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    var ic = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    var t = document.createElement('div');
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
/* FIN : FONCTION SHOWTOAST */

/* DEBUT : FONCTION GETINITIALS */
function getInitials(n) {
    if (!n) return '?';
    var p = n.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : n[0]).toUpperCase();
}
/* FIN : FONCTION GETINITIALS */

/* DEBUT : FONCTION CHECKSESSION */
async function checkSession() {
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        hideLoader();
        return null;
    }
    currentUser = user;
    return currentUser;
}
/* FIN : FONCTION CHECKSESSION */

/* DEBUT : FONCTION LOADPROFILE */
async function loadProfile() {
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) {
        showToast('Erreur profil', 'error');
        hideLoader();
        return;
    }
    userProfile = data;
    document.getElementById('userName').textContent = userProfile.full_name || 'Parrain';
    var ni = document.getElementById('userAvatar'),
        nn = document.getElementById('userAvatarInitials');
    var url = userProfile.avatar_url;
    if (url && url !== '') {
        if (ni) { ni.src = url; ni.style.display = 'block'; }
        if (nn) nn.style.display = 'none';
    } else {
        var init = getInitials(userProfile.full_name || 'P');
        if (nn) { nn.textContent = init; nn.style.display = 'flex'; }
        if (ni) ni.style.display = 'none';
    }
}
/* FIN : FONCTION LOADPROFILE */

/* DEBUT : FONCTION LOADENTRIES */
async function loadEntries() {
    if (!userProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .eq(FK, userProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        showToast('Erreur chargement : ' + error.message, 'error');
        return;
    }
    allEntries = data || [];
    renderAll();
    updateStats();
}
/* FIN : FONCTION LOADENTRIES */

/* DEBUT : FONCTION UPDATESTATS */
function updateStats() {
    document.getElementById('statTotal').textContent = allEntries.length;
    var now = new Date();
    var m   = now.getMonth();
    var y   = now.getFullYear();
    var mois = allEntries.filter(function(e) {
        if (!e.created_at) return false;
        var d = new Date(e.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('statMois').textContent   = mois;
    document.getElementById('statActifs').textContent  = allEntries.length;
    var last = allEntries[0];
    document.getElementById('statVedette').textContent = last ? (last.nom_protege || '—').substring(0, 16) : '—';
}
/* FIN : FONCTION UPDATESTATS */

/* DEBUT : FONCTION RENDERALL */
function renderAll() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filter = document.getElementById('filterSelect').value;
    var filtered = allEntries.filter(function(e) {
        var txt = JSON.stringify(e).toLowerCase();
        var matchSearch = !search || txt.includes(search);
        var matchFilter = !filter || (e.statut_protege === filter);
        return matchSearch && matchFilter;
    });
    var grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        var mrole_protege       = item.role_protege       ? '<span><i class="fas fa-circle" style="font-size:.5rem;"></i> Rôle / Discipline : ' + item.role_protege + '</span>' : '';
        var mdebut_parrainage   = item.debut_parrainage   ? '<span><i class="fas fa-circle" style="font-size:.5rem;"></i> Date début parrainage : ' + item.debut_parrainage + '</span>' : '';
        var mclub_protege       = item.club_protege       ? '<span><i class="fas fa-circle" style="font-size:.5rem;"></i> Club / Académie : ' + item.club_protege + '</span>' : '';
        var mstatut_protege     = item.statut_protege     ? '<span><i class="fas fa-circle" style="font-size:.5rem;"></i> Statut : ' + item.statut_protege + '</span>' : '';

        var card = document.createElement('div');
        card.className = 'entry-card';
        var dateStr   = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '';
        var badgeVal  = item.statut_protege || '';
        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + (item.nom_protege || 'Sans titre') + '</span>' +
            (badgeVal ? '<span class="entry-badge">' + badgeVal + '</span>' : '') +
            '</div>' +
            '<div class="entry-meta">' +
            (item.prenom_protege ? '<span><i class="fas fa-building"></i>' + item.prenom_protege + '</span>' : '') +
            (dateStr ? '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>' : '') +
            (mrole_protege + mdebut_parrainage + mclub_protege + mstatut_protege || '') +
            '</div>' +
            '<div class="entry-actions">' +
            '<button class="btn-edit" onclick="openEdit(\'' + item.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
            '<button class="btn-del" onclick="deleteEntry(\'' + item.id + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });
}
/* FIN : FONCTION RENDERALL */

/* DEBUT : FONCTION OPENADD */
function openAdd() {
    editingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Ajouter — Mes Protégés';
    document.getElementById('entryForm').reset();
    document.getElementById('f__id').value = '';
    document.getElementById('entryModal').classList.add('show');
}
/* FIN : FONCTION OPENADD */

/* DEBUT : FONCTION OPENEDIT */
function openEdit(id) {
    var item = allEntries.find(function(e) { return e.id === id; });
    if (!item) return;
    editingId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('f__id').value = id;
    var el0 = document.getElementById('f_nom_protege');       if (el0) el0.value = item.nom_protege || '';
    var el1 = document.getElementById('f_prenom_protege');    if (el1) el1.value = item.prenom_protege || '';
    var el2 = document.getElementById('f_role_protege');      if (el2) el2.value = item.role_protege || '';
    var el3 = document.getElementById('f_debut_parrainage');  if (el3) el3.value = item.debut_parrainage || '';
    var el4 = document.getElementById('f_club_protege');      if (el4) el4.value = item.club_protege || '';
    var el5 = document.getElementById('f_statut_protege');    if (el5) el5.value = item.statut_protege || '';
    var el6 = document.getElementById('f_montant_bourse');    if (el6) el6.value = item.montant_bourse || '';
    var el7 = document.getElementById('f_niveau_scolaire');   if (el7) el7.value = item.niveau_scolaire || '';
    var el8 = document.getElementById('f_resultats_protege'); if (el8) el8.value = item.resultats_protege || '';
    var el9 = document.getElementById('f_notes_protege');     if (el9) el9.value = item.notes_protege || '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;
/* FIN : FONCTION OPENEDIT */

/* DEBUT : FONCTION DELETEENTRY */
async function deleteEntry(id) {
    if (!confirm('Supprimer cette entrée ?')) return;
    showLoader();
    var r = await supabaseClient.from(TABLE).delete().eq('id', id);
    hideLoader();
    if (r.error) {
        showToast('Erreur suppression', 'error');
        return;
    }
    showToast('Entrée supprimée', 'info');
    allEntries = allEntries.filter(function(e) { return e.id !== id; });
    renderAll();
    updateStats();
}
window.deleteEntry = deleteEntry;
/* FIN : FONCTION DELETEENTRY */

/* DEBUT : FONCTION SAVEENTRY */
async function saveEntry() {
    if (!userProfile) return;
    var data = {
        nom_protege:        document.getElementById('f_nom_protege').value,
        prenom_protege:     document.getElementById('f_prenom_protege').value,
        role_protege:       document.getElementById('f_role_protege').value,
        debut_parrainage:   document.getElementById('f_debut_parrainage').value,
        club_protege:       document.getElementById('f_club_protege').value,
        statut_protege:     document.getElementById('f_statut_protege').value,
        montant_bourse:     document.getElementById('f_montant_bourse').value,
        niveau_scolaire:    document.getElementById('f_niveau_scolaire').value,
        resultats_protege:  document.getElementById('f_resultats_protege').value,
        notes_protege:      document.getElementById('f_notes_protege').value
    };
    data[FK] = userProfile.hubisoccer_id;
    data.updated_at = new Date().toISOString();
    showLoader();
    var r;
    if (editingId) {
        r = await supabaseClient.from(TABLE).update(data).eq('id', editingId);
    } else {
        data.created_at = new Date().toISOString();
        r = await supabaseClient.from(TABLE).insert([data]).select().single();
    }
    hideLoader();
    if (r.error) {
        showToast('Erreur enregistrement : ' + r.error.message, 'error');
        return;
    }
    showToast(editingId ? 'Entrée modifiée !' : 'Entrée ajoutée !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}
/* FIN : FONCTION SAVEENTRY */

/* DEBUT : FONCTION INITMODAL */
function initModal() {
    document.getElementById('btnAdd').addEventListener('click', openAdd);
    document.getElementById('modalClose').addEventListener('click', function() {
        document.getElementById('entryModal').classList.remove('show');
    });
    document.getElementById('modalCancel').addEventListener('click', function() {
        document.getElementById('entryModal').classList.remove('show');
    });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
}
/* FIN : FONCTION INITMODAL */

/* DEBUT : FONCTION INITFILTERS */
function initFilters() {
    var filterSelect = document.getElementById('filterSelect');
    ['En cours', 'Diplômé', 'Pro', 'Abandonné'].forEach(function(status) {
        var opt = document.createElement('option');
        opt.value = status;
        opt.textContent = status;
        filterSelect.appendChild(opt);
    });
    document.getElementById('searchInput').addEventListener('input', renderAll);
    filterSelect.addEventListener('change', renderAll);
}
/* FIN : FONCTION INITFILTERS */

/* DEBUT : FONCTION INITUSERMENU */
function initUserMenu() {
    var m = document.getElementById('userMenu'),
        d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}
/* FIN : FONCTION INITUSERMENU */

/* DEBUT : FONCTION INITSIDEBAR */
function initSidebar() {
    var sb = document.getElementById('leftSidebar'),
        ov = document.getElementById('sidebarOverlay'),
        mb = document.getElementById('menuToggle'),
        cb = document.getElementById('closeSidebar');
    function open()  { if (sb) sb.classList.add('active'); if (ov) ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { if (sb) sb.classList.remove('active'); if (ov) ov.classList.remove('active'); document.body.style.overflow = ''; }
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    var sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].screenX - sx,
            dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}
/* FIN : FONCTION INITSIDEBAR */

/* DEBUT : FONCTION INITLOGOUT */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        });
    });
}
/* FIN : FONCTION INITLOGOUT */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    var user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!userProfile) {
        hideLoader();
        showToast('Profil introuvable', 'error');
        return;
    }
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
/* FIN : INITIALISATION */