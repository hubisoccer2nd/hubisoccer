/* ============================================================
   HubISoccer -- parrain-impact.js
   Espace Parrain - Mon Impact
   ------------------------------------------------------------
   Corrections apportees a la version recue :
   - Le 3e stat recopiait simplement le total -- relabellise en
     "Score moyen /10", calcule a partir de score_impact (le champ
     existait deja dans le formulaire mais n'etait jamais agrege
     nulle part). Plus pertinent pour une page de rapports d'impact.
   - ID sidebar harmonise (closeLeftSidebar).
   - Le reste (CRUD, recherche, filtre par domaine) est conserve.
   ============================================================ */

'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. ETAT GLOBAL ---------- */
let currentUser  = null;
let userProfile  = null;
let allEntries   = [];
let editingId    = null;
const TABLE      = 'supabaseAuthPrive_parrain_impact';
const FK         = 'parrain_id';

/* ---------- 3. LOADER ---------- */
function showLoader() {
    var l = document.getElementById('globalLoader');
    if (l) l.style.display = 'flex';
}
function hideLoader() {
    var l = document.getElementById('globalLoader');
    if (l) l.style.display = 'none';
}

/* ---------- 4. TOAST (duree 30 secondes) ---------- */
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

/* ---------- 5. UTILITAIRES ---------- */
function getInitials(n) {
    if (!n) return '?';
    var p = n.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : n[0]).toUpperCase();
}

/* ---------- 6. SESSION ---------- */
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

/* ---------- 7. CHARGEMENT PROFIL ---------- */
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

/* ---------- 8. CHARGEMENT DES RAPPORTS ---------- */
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

/* ---------- 9. STATS RAPIDES ---------- */
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
    document.getElementById('statMois').textContent = mois;

    var scores = allEntries
        .map(function(e) { return parseFloat(e.score_impact); })
        .filter(function(v) { return !isNaN(v); });
    var moyenne = scores.length ? (scores.reduce(function(s, v) { return s + v; }, 0) / scores.length) : 0;
    document.getElementById('statActifs').textContent = scores.length ? moyenne.toFixed(1) : '—';

    var last = allEntries[0];
    document.getElementById('statLast').textContent = last ? (last.periode_impact || '—').substring(0, 14) : '—';
}

/* ---------- 10. RENDU DE LA LISTE ---------- */
function renderAll() {
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filter = document.getElementById('filterSelect').value;
    var filtered = allEntries.filter(function(e) {
        var txt = JSON.stringify(e).toLowerCase();
        var matchSearch = !search || txt.includes(search);
        var matchFilter = !filter || (e.domaines_impact === filter);
        return matchSearch && matchFilter;
    });
    var grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'entry-card';
        var dateStr   = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '';
        var badgeVal  = item.domaines_impact || '';
        var meta = '';
        if (item.nb_proteges_impact) meta += '<span><i class="fas fa-user-friends"></i>' + item.nb_proteges_impact + ' protégé(s) suivi(s)</span>';
        if (item.score_impact) meta += '<span><i class="fas fa-tachometer-alt"></i>Score : ' + item.score_impact + '/10</span>';
        if (dateStr) meta += '<span><i class="fas fa-calendar-alt"></i>Ajouté le ' + dateStr + '</span>';
        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + (item.periode_impact || 'Sans titre') + '</span>' +
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

/* ---------- 11. AJOUTER ---------- */
function openAdd() {
    editingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Ajouter — Mon Impact';
    document.getElementById('entryForm').reset();
    document.getElementById('f__id').value = '';
    document.getElementById('entryModal').classList.add('show');
}

/* ---------- 12. MODIFIER ---------- */
function openEdit(id) {
    var item = allEntries.find(function(e) { return e.id === id; });
    if (!item) return;
    editingId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier';
    document.getElementById('f__id').value = id;
    var el0 = document.getElementById('f_periode_impact');       if (el0) el0.value = item.periode_impact || '';
    var el1 = document.getElementById('f_nb_proteges_impact');   if (el1) el1.value = item.nb_proteges_impact || '';
    var el2 = document.getElementById('f_nb_reussites_impact');  if (el2) el2.value = item.nb_reussites_impact || '';
    var el3 = document.getElementById('f_montant_total_impact'); if (el3) el3.value = item.montant_total_impact || '';
    var el4 = document.getElementById('f_nb_bourses_impact');    if (el4) el4.value = item.nb_bourses_impact || '';
    var el5 = document.getElementById('f_nb_sessions_impact');   if (el5) el5.value = item.nb_sessions_impact || '';
    var el6 = document.getElementById('f_score_impact');         if (el6) el6.value = item.score_impact || '';
    var el7 = document.getElementById('f_domaines_impact');      if (el7) el7.value = item.domaines_impact || '';
    var el8 = document.getElementById('f_temoignage_impact');    if (el8) el8.value = item.temoignage_impact || '';
    document.getElementById('entryModal').classList.add('show');
}
window.openEdit = openEdit;

/* ---------- 13. SUPPRIMER ---------- */
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

/* ---------- 14. ENREGISTRER (ajout ou modification) ---------- */
async function saveEntry() {
    if (!userProfile) return;
    var data = {
        periode_impact:        document.getElementById('f_periode_impact').value,
        nb_proteges_impact:    document.getElementById('f_nb_proteges_impact').value,
        nb_reussites_impact:   document.getElementById('f_nb_reussites_impact').value,
        montant_total_impact:  document.getElementById('f_montant_total_impact').value,
        nb_bourses_impact:     document.getElementById('f_nb_bourses_impact').value,
        nb_sessions_impact:    document.getElementById('f_nb_sessions_impact').value,
        score_impact:          document.getElementById('f_score_impact').value,
        domaines_impact:       document.getElementById('f_domaines_impact').value,
        temoignage_impact:     document.getElementById('f_temoignage_impact').value
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

/* ---------- 15. INTERFACE ---------- */
function initUI() {
    document.getElementById('btnAdd').addEventListener('click', openAdd);
    document.getElementById('modalClose').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalCancel').addEventListener('click', function() { document.getElementById('entryModal').classList.remove('show'); });
    document.getElementById('modalSave').addEventListener('click', saveEntry);
    document.getElementById('entryModal').addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show'); });

    var fs = document.getElementById('filterSelect');
    ['Sport', 'Éducation', 'Artistique', 'Professionnel', 'Social', 'Mixte'].forEach(function(dom) {
        var o = document.createElement('option');
        o.value = dom;
        o.textContent = dom;
        fs.appendChild(o);
    });
    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterSelect').addEventListener('change', renderAll);
}

/* ---------- 16. MENU UTILISATEUR ---------- */
function initUserMenu() {
    var m = document.getElementById('userMenu'),
        d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}

/* ---------- 17. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    var sb = document.getElementById('leftSidebar'),
        ov = document.getElementById('sidebarOverlay'),
        mb = document.getElementById('menuToggle'),
        cb = document.getElementById('closeLeftSidebar');
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

/* ---------- 18. DECONNEXION ---------- */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        });
    });
}

/* ---------- 19. INITIALISATION ---------- */
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
