/* ============================================================
   HubISoccer — parrain-mentorat.js
   Espace Parrain · Sessions de Mentorat
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
const TABLE      = 'supabaseAuthPrive_parrain_mentorat';
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
        nn = document.getElementById('userAvatarInitials'),
        url = userProfile.avatar_url;
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
        showToast('Erreur : ' + error.message, 'error');
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
    var now = new Date(),
        m   = now.getMonth(),
        y   = now.getFullYear();
    var mois = allEntries.filter(function(e) {
        if (!e.created_at) return false;
        var d = new Date(e.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('statMois').textContent   = mois;
    document.getElementById('statActifs').textContent  = allEntries.length;
    var last = allEntries[0];
    document.getElementById('statLast').textContent = last ? (last.nom_protege_session || '—').substring(0, 14) : '—';
}
/* FIN : FONCTION UPDATESTATS */

/* DEBUT : FONCTION RENDERALL */
function renderAll() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filter = document.getElementById('filterSelect').value;
    var filtered = allEntries.filter(function(e) {
        var txt = JSON.stringify(e).toLowerCase();
        var matchSearch = !search || txt.includes(search);
        var matchFilter = !filter || (e.mode_session === filter);
        return matchSearch && matchFilter;
    });
    var grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'entry-card';
        var dateStr   = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '';
        var badgeVal  = item.mode_session || '';
        var meta = '';
        if (item.date_session) meta += '<span><i class="fas fa-info-circle"></i>' + item.date_session + '</span>';
        if (dateStr) meta += '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>';
        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + (item.nom_protege_session || 'Sans titre') + '</span>' +
            (badgeVal ? '<span class="entry-badge">' + badgeVal + '</span>' : '') +
            '</div>' +
            '<div class="entry-meta">' + meta + '</div>' +
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
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Ajouter — Sessions de Mentorat';
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
    var el0 = document.getElementById('f_nom_protege_session');   if (el0) el0.value = item.nom_protege_session || '';
    var el1 = document.getElementById('f_date_session');          if (el1) el1.value = item.date_session || '';
    var el2 = document.getElementById('f_duree_session');         if (el2) el2.value = item.duree_session || '';
    var el3 = document.getElementById('f_mode_session');          if (el3) el3.value = item.mode_session || '';
    var el4 = document.getElementById('f_theme_session');         if (el4) el4.value = item.theme_session || '';
    var el5 = document.getElementById('f_objectifs_session');     if (el5) el5.value = item.objectifs_session || '';
    var el6 = document.getElementById('f_prochaine_session');     if (el6) el6.value = item.prochaine_session || '';
    var el7 = document.getElementById('f_resume_session');        if (el7) el7.value = item.resume_session || '';
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
        showToast('Erreur', 'error');
        return;
    }
    showToast('Supprimée', 'info');
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
        nom_protege_session:  document.getElementById('f_nom_protege_session').value,
        date_session:         document.getElementById('f_date_session').value,
        duree_session:        document.getElementById('f_duree_session').value,
        mode_session:         document.getElementById('f_mode_session').value,
        theme_session:        document.getElementById('f_theme_session').value,
        objectifs_session:    document.getElementById('f_objectifs_session').value,
        prochaine_session:    document.getElementById('f_prochaine_session').value,
        resume_session:       document.getElementById('f_resume_session').value
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
        if (!r.error && r.data) allEntries.unshift(r.data);
    }
    hideLoader();
    if (r.error) {
        showToast('Erreur : ' + r.error.message, 'error');
        return;
    }
    showToast(editingId ? 'Modifié !' : 'Ajouté !', 'success');
    document.getElementById('entryModal').classList.remove('show');
    await loadEntries();
}
/* FIN : FONCTION SAVEENTRY */

/* DEBUT : FONCTION INITUI */
function initUI() {
    document.getElementById('btnAdd').addEventListener('click', openAdd);
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });

    var fs = document.getElementById('filterSelect');
    ['Présentiel', 'Visio', 'Téléphone', 'Sur le terrain'].forEach(function(mode) {
        var o = document.createElement('option');
        o.value = mode;
        o.textContent = mode;
        fs.appendChild(o);
    });
    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterSelect').addEventListener('change', renderAll);
}
/* FIN : FONCTION INITUI */

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
    initUI();
    initUserMenu();
    initSidebar();
    initLogout();
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */