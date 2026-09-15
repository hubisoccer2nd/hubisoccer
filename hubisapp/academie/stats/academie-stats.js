/* ============================================================
   HubISoccer — academie-stats.js
   Page Statistiques · Espace Académie
   ------------------------------------------------------------
   AUCUNE NOUVELLE TABLE. Lecture résiliente des 5 tables déjà
   créées — chacune est indépendante : si une table est absente
   ou vide, la page continue avec des zéros plutôt que d'échouer.
   - supabaseAuthPrive_profiles              (partagée)
   - supabaseAuthPrive_academie_scouting     (talents_limite)
   - supabaseAuthPrive_academie_athletes
   - supabaseAuthPrive_academie_formateurs
   - supabaseAuthPrive_academie_programmes
   - supabaseAuthPrive_academie_compet
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE   = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE   = 'supabaseAuthPrive_academie_scouting';
const ATHLETES_TABLE   = 'supabaseAuthPrive_academie_athletes';
const FORMATEURS_TABLE = 'supabaseAuthPrive_academie_formateurs';
const PROGRAMMES_TABLE = 'supabaseAuthPrive_academie_programmes';
const COMPET_TABLE     = 'supabaseAuthPrive_academie_compet';
const QUOTA_DEFAUT     = 160;

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser     = null;
let academieProfile = null;
let chartInstances    = {};

const MOIS_FR = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

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

/* Requête résiliente : ne bloque jamais le reste de la page */
async function lireTableResiliente(table, filtreColonnes, academieId) {
    try {
        const { data, error } = await supabaseClient
            .from(table)
            .select(filtreColonnes)
            .eq('academie_id', academieId);
        if (error) {
            console.warn('⚠️ Table ' + table + ' non disponible :', error.message);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
}

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

/* ---------- 9. CHARGEMENT & CALCULS ---------- */
async function loadAllStats() {
    if (!academieProfile) { return; }
    showLoader();

    const academieId = academieProfile.hubisoccer_id;

    const [scoutingRes, athletes, formateurs, programmes, compets] = await Promise.all([
        supabaseClient.from(SCOUTING_TABLE).select('talents_limite').eq('academie_id', academieId).maybeSingle(),
        lireTableResiliente(ATHLETES_TABLE, 'talent_type, statut, created_at', academieId),
        lireTableResiliente(FORMATEURS_TABLE, 'specialite, statut', academieId),
        lireTableResiliente(PROGRAMMES_TABLE, 'categorie, statut, nom, nb_inscrits, capacite_max', academieId),
        lireTableResiliente(COMPET_TABLE, 'nom, date_debut, date_fin', academieId)
    ]);

    hideLoader();

    const quotaLimite = (scoutingRes.data && scoutingRes.data.talents_limite) ? scoutingRes.data.talents_limite : QUOTA_DEFAUT;

    renderKpis(athletes, formateurs, programmes, compets, quotaLimite);
    renderChartComposition(athletes);
    renderChartProgrammesCategorie(programmes);
    renderChartActivite(athletes);
    renderChartRemplissage(programmes);
}

/* ---------- 10. KPI ---------- */
function renderKpis(athletes, formateurs, programmes, compets, quotaLimite) {
    const effectif = athletes.filter(function(a) { return a.statut === 'accepte'; }).length;
    const formateursActifs = formateurs.filter(function(f) { return f.statut === 'accepte'; }).length;
    const programmesActifs = programmes.filter(function(p) { return p.statut === 'actif'; }).length;

    setText('kpiEffectif', effectif + ' / ' + quotaLimite);
    setText('kpiFormateurs', formateursActifs);
    setText('kpiProgrammes', programmesActifs);
    setText('kpiCompetitions', compets.length);
}

/* ---------- 11. GRAPHIQUE — COMPOSITION EFFECTIF ---------- */
function renderChartComposition(athletes) {
    const acceptes = athletes.filter(function(a) { return a.statut === 'accepte'; });
    const sportifs = acceptes.filter(function(a) { return a.talent_type === 'sportif'; }).length;
    const artistes = acceptes.filter(function(a) { return a.talent_type === 'artiste'; }).length;

    const canvas = document.getElementById('chartComposition');
    const note = document.getElementById('noteComposition');
    if (!canvas) { return; }

    if (sportifs === 0 && artistes === 0) {
        canvas.style.display = 'none';
        if (note) { note.style.display = 'flex'; }
        return;
    }
    if (note) { note.style.display = 'none'; }

    if (chartInstances.composition) { chartInstances.composition.destroy(); }
    chartInstances.composition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Sportifs', 'Artistes'],
            datasets: [{
                data: [sportifs, artistes],
                backgroundColor: ['#e74c3c', '#27ae60'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins' }, padding: 16 } } }
        }
    });
}

/* ---------- 12. GRAPHIQUE — PROGRAMMES PAR CATÉGORIE ---------- */
function renderChartProgrammesCategorie(programmes) {
    const sportif = programmes.filter(function(p) { return p.categorie === 'sportif'; }).length;
    const artiste = programmes.filter(function(p) { return p.categorie === 'artiste'; }).length;
    const mixte   = programmes.filter(function(p) { return p.categorie === 'mixte'; }).length;

    const canvas = document.getElementById('chartProgrammes');
    const note = document.getElementById('noteProgrammes');
    if (!canvas) { return; }

    if (sportif === 0 && artiste === 0 && mixte === 0) {
        canvas.style.display = 'none';
        if (note) { note.style.display = 'flex'; }
        return;
    }
    if (note) { note.style.display = 'none'; }

    if (chartInstances.programmes) { chartInstances.programmes.destroy(); }
    chartInstances.programmes = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Sportif', 'Artistique', 'Mixte'],
            datasets: [{
                data: [sportif, artiste, mixte],
                backgroundColor: ['#e74c3c', '#27ae60', '#3498db'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins' }, padding: 16 } } }
        }
    });
}

/* ---------- 13. GRAPHIQUE — ACTIVITÉ 6 DERNIERS MOIS ---------- */
function renderChartActivite(athletes) {
    const acceptes = athletes.filter(function(a) { return a.statut === 'accepte' && a.created_at; });

    const labels = [];
    const cles = [];
    const aujourdHui = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1);
        labels.push(MOIS_FR[d.getMonth()]);
        cles.push(d.getFullYear() + '-' + d.getMonth());
    }

    const compteurs = cles.map(function(cle) {
        return acceptes.filter(function(a) {
            const d = new Date(a.created_at);
            return (d.getFullYear() + '-' + d.getMonth()) === cle;
        }).length;
    });

    const canvas = document.getElementById('chartActivite');
    if (!canvas) { return; }

    if (chartInstances.activite) { chartInstances.activite.destroy(); }
    chartInstances.activite = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nouveaux talents',
                data: compteurs,
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
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins' } } }, x: { ticks: { font: { family: 'Poppins' } } } }
        }
    });
}

/* ---------- 14. GRAPHIQUE — TAUX DE REMPLISSAGE DES PROGRAMMES ---------- */
function renderChartRemplissage(programmes) {
    const avecCapacite = programmes
        .filter(function(p) { return p.capacite_max && p.capacite_max > 0; })
        .map(function(p) { return { nom: p.nom, pct: Math.min(Math.round((p.nb_inscrits / p.capacite_max) * 100), 100) }; })
        .sort(function(a, b) { return b.pct - a.pct; })
        .slice(0, 8);

    const canvas = document.getElementById('chartRemplissage');
    const note = document.getElementById('noteRemplissage');
    if (!canvas) { return; }

    if (avecCapacite.length === 0) {
        canvas.style.display = 'none';
        if (note) { note.style.display = 'flex'; }
        return;
    }
    if (note) { note.style.display = 'none'; }

    const couleurs = avecCapacite.map(function(p) {
        if (p.pct >= 90) { return '#e74c3c'; }
        if (p.pct >= 60) { return '#FFCC00'; }
        return '#27ae60';
    });

    if (chartInstances.remplissage) { chartInstances.remplissage.destroy(); }
    chartInstances.remplissage = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: avecCapacite.map(function(p) { return p.nom; }),
            datasets: [{
                label: 'Taux de remplissage (%)',
                data: avecCapacite.map(function(p) { return p.pct; }),
                backgroundColor: couleurs,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, max: 100, ticks: { font: { family: 'Poppins' } } }, y: { ticks: { font: { family: 'Poppins' } } } }
        }
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

/* ---------- 17. DÉCONNEXION ---------- */
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
    if (!academieProfile) { return; }
    await loadAllStats();

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
