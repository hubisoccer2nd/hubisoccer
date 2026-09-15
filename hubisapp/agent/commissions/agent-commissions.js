/* ============================================================
   HubISoccer -- agent-revenus.js
   Page Mes Revenus - Espace Agent FIFA
   ------------------------------------------------------------
   AUCUNE NOUVELLE TABLE. Les revenus sont calcules cote client a
   partir des contrats signes deja enregistres : montant fois
   taux de commission. Une seule source de verite (agent_contrats) --
   aucune saisie separee, aucun risque de desynchronisation.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const CONTRATS_TABLE = 'supabaseAuthPrive_agent_contrats';

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser  = null;
let agentProfile = null;
let contratsAvecRevenu = []; // contrats signes, avec revenu calcule
let chartInstances = {};

const MOIS_FR = ['Janv','Fevr','Mars','Avr','Mai','Juin','Juil','Aout','Sept','Oct','Nov','Dec'];

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

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
    if (!iso) { return '\u2014'; }
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatMoney(v) {
    if (!v || isNaN(v)) { return '0 \u20ac'; }
    const n = Number(v);
    if (n >= 1000000) { return (n / 1000000).toFixed(1) + ' M\u20ac'; }
    if (n >= 1000) { return (n / 1000).toFixed(1) + ' K\u20ac'; }
    return Math.round(n).toLocaleString('fr-FR') + ' \u20ac';
}

const TYPE_LABELS = { transfert: 'Transfert', sponsoring: 'Sponsoring', representation: 'Representation', publicite: 'Publicite' };

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

/* ---------- 8. CHARGEMENT PROFIL AGENT ---------- */
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
    agentProfile = data;
    setText('userName', agentProfile.full_name || 'Agent FIFA');
    updateNavbarAvatar();
    return agentProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = agentProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(agentProfile?.full_name || 'A');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. CHARGEMENT & CALCUL DES REVENUS ---------- */
async function loadRevenus() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(CONTRATS_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .eq('statut', 'signe')
        .order('date_signature', { ascending: false });
    hideLoader();

    if (error) {
        console.warn('Table ' + CONTRATS_TABLE + ' absente :', error.message);
        showToast('Table des contrats absente. Voir la page Mes Contrats.', 'warning');
        contratsAvecRevenu = [];
    } else {
        contratsAvecRevenu = (data || [])
            .filter(function(c) { return c.montant && c.commission_pourcentage; })
            .map(function(c) {
                return Object.assign({}, c, {
                    revenu: (Number(c.montant) * Number(c.commission_pourcentage)) / 100
                });
            });
    }

    renderKpis();
    renderChartEvolution();
    renderChartRepartition();
    renderChartTopTalents();
    renderTable();
}

/* ---------- 10. KPI ---------- */
function renderKpis() {
    const maintenant = new Date();
    const anneeCourante = maintenant.getFullYear();
    const moisCourant = maintenant.getMonth();

    let total = 0, revenuAnnee = 0, revenuMois = 0;
    let sommeCommission = 0, nbAvecCommission = 0;

    contratsAvecRevenu.forEach(function(c) {
        total += c.revenu;
        sommeCommission += Number(c.commission_pourcentage);
        nbAvecCommission++;

        if (c.date_signature) {
            const d = new Date(c.date_signature);
            if (d.getFullYear() === anneeCourante) { revenuAnnee += c.revenu; }
            if (d.getFullYear() === anneeCourante && d.getMonth() === moisCourant) { revenuMois += c.revenu; }
        }
    });

    setText('kpiTotal', formatMoney(total));
    setText('kpiAnnee', formatMoney(revenuAnnee));
    setText('kpiMois', formatMoney(revenuMois));
    setText('kpiTaux', nbAvecCommission > 0 ? (sommeCommission / nbAvecCommission).toFixed(1) + '%' : '0%');
}

/* ---------- 11. GRAPHIQUE -- EVOLUTION 6 MOIS ---------- */
function renderChartEvolution() {
    const labels = [];
    const cles = [];
    const aujourdHui = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1);
        labels.push(MOIS_FR[d.getMonth()]);
        cles.push(d.getFullYear() + '-' + d.getMonth());
    }

    const totaux = cles.map(function(cle) {
        return contratsAvecRevenu
            .filter(function(c) {
                if (!c.date_signature) { return false; }
                const d = new Date(c.date_signature);
                return (d.getFullYear() + '-' + d.getMonth()) === cle;
            })
            .reduce(function(sum, c) { return sum + c.revenu; }, 0);
    });

    const canvas = document.getElementById('chartEvolution');
    if (!canvas) { return; }

    if (chartInstances.evolution) { chartInstances.evolution.destroy(); }
    chartInstances.evolution = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenus',
                data: totaux,
                borderColor: '#551B8C',
                backgroundColor: 'rgba(85, 27, 140, 0.1)',
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#FFCC00',
                pointBorderColor: '#551B8C',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx) { return formatMoney(ctx.parsed.y); } } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: function(v) { return formatMoney(v); }, font: { family: 'Poppins' } } },
                x: { ticks: { font: { family: 'Poppins' } } }
            }
        }
    });
}

/* ---------- 12. GRAPHIQUE -- REPARTITION PAR TYPE ---------- */
function renderChartRepartition() {
    const parType = { transfert: 0, sponsoring: 0, representation: 0, publicite: 0 };
    contratsAvecRevenu.forEach(function(c) { parType[c.type_contrat] = (parType[c.type_contrat] || 0) + c.revenu; });

    const canvas = document.getElementById('chartRepartition');
    const note = document.getElementById('noteRepartition');
    if (!canvas) { return; }

    const total = Object.values(parType).reduce(function(a, b) { return a + b; }, 0);
    if (total === 0) {
        canvas.style.display = 'none';
        if (note) { note.style.display = 'flex'; }
        return;
    }
    if (note) { note.style.display = 'none'; }
    canvas.style.display = 'block';

    if (chartInstances.repartition) { chartInstances.repartition.destroy(); }
    chartInstances.repartition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Transfert', 'Sponsoring', 'Representation', 'Publicite'],
            datasets: [{
                data: [parType.transfert, parType.sponsoring, parType.representation, parType.publicite],
                backgroundColor: ['#27ae60', '#e6b800', '#551B8C', '#3498db'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Poppins' }, padding: 14, boxWidth: 12 } },
                tooltip: { callbacks: { label: function(ctx) { return ctx.label + ' : ' + formatMoney(ctx.parsed); } } }
            }
        }
    });
}

/* ---------- 13. GRAPHIQUE -- MEILLEURS TALENTS ---------- */
function renderChartTopTalents() {
    const parTalent = {};
    contratsAvecRevenu.forEach(function(c) {
        parTalent[c.talent_nom] = (parTalent[c.talent_nom] || 0) + c.revenu;
    });

    const tries = Object.keys(parTalent)
        .map(function(nom) { return { nom: nom, revenu: parTalent[nom] }; })
        .sort(function(a, b) { return b.revenu - a.revenu; })
        .slice(0, 6);

    const canvas = document.getElementById('chartTopTalents');
    const note = document.getElementById('noteTopTalents');
    if (!canvas) { return; }

    if (tries.length === 0) {
        canvas.style.display = 'none';
        if (note) { note.style.display = 'flex'; }
        return;
    }
    if (note) { note.style.display = 'none'; }
    canvas.style.display = 'block';

    if (chartInstances.topTalents) { chartInstances.topTalents.destroy(); }
    chartInstances.topTalents = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: tries.map(function(t) { return t.nom; }),
            datasets: [{
                label: 'Revenus',
                data: tries.map(function(t) { return t.revenu; }),
                backgroundColor: '#551B8C',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx) { return formatMoney(ctx.parsed.x); } } }
            },
            scales: {
                x: { beginAtZero: true, ticks: { callback: function(v) { return formatMoney(v); }, font: { family: 'Poppins' } } },
                y: { ticks: { font: { family: 'Poppins' } } }
            }
        }
    });
}

/* ---------- 14. TABLE DETAILLEE ---------- */
function renderTable() {
    const tbody = document.getElementById('revenusTableBody');
    const empty = document.getElementById('detailEmpty');
    const table = document.querySelector('.revenus-table');
    if (!tbody) { return; }

    tbody.innerHTML = '';

    if (contratsAvecRevenu.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        if (table) { table.style.display = 'none'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }
    if (table) { table.style.display = 'table'; }

    contratsAvecRevenu.forEach(function(c) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + escapeHtml(c.partie) + '</td>' +
            '<td>' + escapeHtml(c.talent_nom) + '</td>' +
            '<td><span class="cell-type-badge ' + c.type_contrat + '">' + TYPE_LABELS[c.type_contrat] + '</span></td>' +
            '<td>' + formatMoney(c.montant) + '</td>' +
            '<td>' + c.commission_pourcentage + '%</td>' +
            '<td class="cell-revenu">' + formatMoney(c.revenu) + '</td>' +
            '<td>' + formatDateFr(c.date_signature) + '</td>';
        tbody.appendChild(tr);
    });
}

/* ---------- 15. MENU UTILISATEUR ---------- */
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

/* ---------- 16. SIDEBAR + SWIPE ---------- */
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

/* ---------- 17. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 18. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadRevenus();

    initUserMenu();
    initSidebar();

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
