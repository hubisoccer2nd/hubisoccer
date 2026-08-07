/* ============================================================
   HubISoccer -- staff-honoraires.js
   Mes Honoraires - Espace Staff Medical
   ------------------------------------------------------------
   AUCUNE ecriture de montant ici. Cette page lit uniquement
   supabaseAuthPrive_staff_medical_consultations (meme table que
   la page Consultations), agrege les tarifs, et permet de
   basculer statut_paiement -- la seule colonne ajoutee par
   staff-honoraires-table.sql. Meme logique que Mes Commissions
   chez l'agent, calculee depuis Mes Contrats sans dupliquer les
   montants.
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
let allConsults  = [];
const TABLE      = 'supabaseAuthPrive_staff_medical_consultations';

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
function formatMoney(v) {
    if (!v || isNaN(v)) return '0 €';
    return Number(v).toLocaleString('fr-FR') + ' €';
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

/* ---------- 8. CHARGEMENT DES CONSULTATIONS FACTURABLES ---------- */
async function loadConsults() {
    if (!staffProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
        .not('tarif', 'is', null)
        .order('date_consultation', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Erreur ou colonne statut_paiement absente :', error.message);
        showToast('Colonne de paiement absente. Exécutez le script SQL <b>staff-honoraires-table.sql</b> dans Supabase.', 'warning');
        allConsults = [];
        return;
    }
    allConsults = data || [];
    updateStats();
    renderBreakdown();
    renderAll();
}

/* ---------- 9. STATS RAPIDES ---------- */
function updateStats() {
    const totalGeneral = allConsults.reduce(function(s, e) { return s + (parseFloat(e.tarif) || 0); }, 0);
    document.getElementById('statTotal').textContent = formatMoney(totalGeneral);

    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const totalMois = allConsults.filter(function(e) {
        if (!e.date_consultation) return false;
        const d = new Date(e.date_consultation);
        return d.getMonth() === m && d.getFullYear() === y;
    }).reduce(function(s, e) { return s + (parseFloat(e.tarif) || 0); }, 0);
    document.getElementById('statMois').textContent = formatMoney(totalMois);

    const totalPayes = allConsults.filter(function(e) { return e.statut_paiement === 'paye'; })
        .reduce(function(s, e) { return s + (parseFloat(e.tarif) || 0); }, 0);
    document.getElementById('statPayes').textContent = formatMoney(totalPayes);

    const totalNonPayes = allConsults.filter(function(e) { return e.statut_paiement !== 'paye'; })
        .reduce(function(s, e) { return s + (parseFloat(e.tarif) || 0); }, 0);
    document.getElementById('statNonPayes').textContent = formatMoney(totalNonPayes);
}

/* ---------- 10. REPARTITION PAR ATHLETE ---------- */
function renderBreakdown() {
    const container = document.getElementById('breakdownList');
    const empty = document.getElementById('breakdownEmpty');
    container.querySelectorAll('.breakdown-item').forEach(function(el) { el.remove(); });

    if (!allConsults.length) {
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    const parAthlete = {};
    allConsults.forEach(function(e) {
        const key = e.athlete_nom || 'Inconnu';
        parAthlete[key] = (parAthlete[key] || 0) + (parseFloat(e.tarif) || 0);
    });
    const entries = Object.entries(parAthlete).sort(function(a, b) { return b[1] - a[1]; });
    const maxVal = entries.length ? entries[0][1] : 1;

    entries.forEach(function(pair) {
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        const pct = maxVal > 0 ? Math.round((pair[1] / maxVal) * 100) : 0;
        item.innerHTML =
            '<span class="breakdown-name">' + pair[0] + '</span>' +
            '<div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:' + pct + '%;"></div></div>' +
            '<span class="breakdown-amount">' + formatMoney(pair[1]) + '</span>';
        container.appendChild(item);
    });
}

/* ---------- 11. RENDU DE LA LISTE ---------- */
function renderAll() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filter = document.getElementById('filterSelect').value;
    const filtered = allConsults.filter(function(e) {
        const matchSearch = !search || (e.athlete_nom || '').toLowerCase().includes(search);
        const matchFilter = !filter || (e.statut_paiement === filter) || (filter === 'non_paye' && e.statut_paiement !== 'paye');
        return matchSearch && matchFilter;
    });
    const grid = document.getElementById('entriesGrid');
    grid.innerHTML = '';
    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-file-invoice-dollar"></i><p>Aucun résultat.</p></div>';
        return;
    }
    filtered.forEach(function(item) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        const dateStr = item.date_consultation ? new Date(item.date_consultation).toLocaleDateString('fr-FR') : '';
        const estPaye = item.statut_paiement === 'paye';
        card.innerHTML =
            '<div class="entry-card-header">' +
            '<span class="entry-card-title">' + item.athlete_nom + '</span>' +
            '<span class="payment-badge ' + (estPaye ? 'paye' : 'non_paye') + '">' + (estPaye ? 'Payé' : 'Non payé') + '</span>' +
            '</div>' +
            '<div class="entry-meta">' +
            (dateStr ? '<span><i class="fas fa-calendar-alt"></i>' + dateStr + '</span>' : '') +
            '<span><i class="fas fa-tag"></i>' + item.type_consultation + '</span>' +
            '<span><i class="fas fa-coins"></i>' + formatMoney(item.tarif) + '</span>' +
            '</div>' +
            '<div class="entry-actions">' +
            '<button class="btn-toggle-payment ' + (estPaye ? 'mark-unpaid' : '') + '" data-id="' + item.id + '" data-current="' + item.statut_paiement + '">' +
            '<i class="fas ' + (estPaye ? 'fa-undo' : 'fa-check') + '"></i> ' + (estPaye ? 'Marquer non payé' : 'Marquer payé') +
            '</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-toggle-payment').forEach(function(btn) {
        btn.addEventListener('click', function() { togglePaiement(btn.dataset.id, btn.dataset.current); });
    });
}

/* ---------- 12. BASCULER LE STATUT DE PAIEMENT ---------- */
async function togglePaiement(id, statutActuel) {
    const nouveauStatut = statutActuel === 'paye' ? 'non_paye' : 'paye';
    showLoader();
    const { error } = await supabaseClient.from(TABLE).update({ statut_paiement: nouveauStatut }).eq('id', id);
    hideLoader();
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast(nouveauStatut === 'paye' ? 'Marqué comme payé ✅' : 'Marqué comme non payé', 'info');
    await loadConsults();
}

/* ---------- 13. FILTRES ---------- */
function initFilters() {
    document.getElementById('searchInput').addEventListener('input', renderAll);
    document.getElementById('filterSelect').addEventListener('change', renderAll);
}

/* ---------- 14. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}

/* ---------- 15. SIDEBAR + SWIPE ---------- */
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

/* ---------- 16. DECONNEXION ---------- */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=MEDIC';
        });
    });
}

/* ---------- 17. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!staffProfile) {
        hideLoader();
        showToast('Profil introuvable', 'error');
        return;
    }
    await loadConsults();
    initFilters();
    initUserMenu();
    initSidebar();
    initLogout();
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
