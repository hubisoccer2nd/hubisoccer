/* ============================================================
   HubISoccer — coach-stats.js
   Page Statistiques du Groupe · Espace Coach
   ------------------------------------------------------------
   AUCUNE NOUVELLE TABLE : cette page AGRÈGE en lecture les
   tables des autres pages de l'espace coach :
   - supabaseAuthPrive_profiles        (partagée)
   - supabaseAuthPrive_coach_talents   (page Mes Talents)
   - supabaseAuthPrive_coach_eval      (page Évaluations)
   - supabaseAuthPrive_coach_planning  (page Planning)
   - supabaseAuthPrive_coach_video     (page Analyse Vidéo)
   - supabaseAuthPrive_coach_triple    (page Triple Projet)
   - supabaseAuthPrive_coach_recos     (page Recommandations)
   Chaque lecture est résiliente : si une table manque, la page
   continue avec des zéros (toast d'avertissement unique).
   Graphiques : Chart.js 4 (CDN).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES (toutes en LECTURE seule ici) ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const TALENTS_TABLE  = 'supabaseAuthPrive_coach_talents';
const EVAL_TABLE     = 'supabaseAuthPrive_coach_eval';
const PLANNING_TABLE = 'supabaseAuthPrive_coach_planning';
const VIDEO_TABLE    = 'supabaseAuthPrive_coach_video';
const TRIPLE_TABLE   = 'supabaseAuthPrive_coach_triple';
const RECOS_TABLE    = 'supabaseAuthPrive_coach_recos';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser   = null;
let coachProfile  = null;
let dTalents      = [];    // liaisons acceptées
let dEvals        = [];
let dPlanning     = [];
let dVideos       = [];
let dTriple       = [];
let dRecos        = [];
let tablesManquantes = [];  // noms de tables absentes (toast unique)

/* Instances Chart.js (pour destruction propre si re-rendu) */
let chartRepartition = null;
let chartTriple      = null;
let chartActivite    = null;
let chartTopNotes    = null;

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'flex';
    }
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'none';
    }
}

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
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
        setTimeout(function() {
            if (t.parentNode) {
                t.remove();
            }
        }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (t.parentNode) {
                    t.remove();
                }
            }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (value !== null && value !== undefined) {
            el.textContent = value;
        } else {
            el.textContent = '—';
        }
    }
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function escapeHtml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* Minutes → "12h30" / "45 min" */
function formatDuree(minutes) {
    const m = parseInt(minutes, 10);
    if (!m || isNaN(m)) {
        return '0h';
    }
    const h   = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) {
        return min + ' min';
    }
    if (min === 0) {
        return h + 'h';
    }
    return h + 'h' + String(min).padStart(2, '0');
}

/* Couleurs de la charte (synchro avec le CSS) */
const C = {
    primary : '#551B8C',
    primaryLight : '#7e3db0',
    gold    : '#FFCC00',
    goldDark: '#e6b800',
    corps   : '#e74c3c',
    ame     : '#3498db',
    esprit  : '#27ae60',
    gray    : '#7c7c9e'
};

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

/* ---------- 8. CHARGEMENT PROFIL COACH ---------- */
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
    coachProfile = data;
    setText('userName', coachProfile.full_name || 'Coach / Entraîneur');
    updateNavbarAvatar();
    return coachProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = coachProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(coachProfile?.full_name || 'C');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. LECTURE RÉSILIENTE D'UNE TABLE ----------
   Retourne toujours un tableau ; note les tables absentes.  */
async function lireTable(nomTable, colonnes) {
    const { data, error } = await supabaseClient
        .from(nomTable)
        .select(colonnes)
        .eq('coach_id', coachProfile.hubisoccer_id);
    if (error) {
        console.warn('⚠️ Table ' + nomTable + ' :', error.message);
        tablesManquantes.push(nomTable);
        return [];
    }
    return data || [];
}

/* ---------- 10. CHARGEMENT DE TOUTES LES DONNÉES ---------- */
async function loadToutesLesDonnees() {
    showLoader();
    tablesManquantes = [];

    /* Talents : uniquement les liaisons ACCEPTÉES */
    const talentsBruts = await lireTable(TALENTS_TABLE, 'talent_id, talent_nom, talent_type, talent_role, statut');
    dTalents = talentsBruts.filter(function(t) { return t.statut === 'accepted'; });

    dEvals    = await lireTable(EVAL_TABLE,     'talent_id, talent_nom, statut, note_globale, created_at');
    dPlanning = await lireTable(PLANNING_TABLE, 'date_seance, duree_minutes, statut');
    dVideos   = await lireTable(VIDEO_TABLE,    'talent_id, statut, certifiee, annotations');
    dTriple   = await lireTable(TRIPLE_TABLE,   'talent_id, volet, statut');
    dRecos    = await lireTable(RECOS_TABLE,    'talent_id, statut');

    hideLoader();

    if (tablesManquantes.length > 0) {
        showToast('Certaines tables sont absentes (' + tablesManquantes.length + ') : les chiffres correspondants restent à zéro. Exécutez les scripts SQL des pages concernées.', 'warning');
    }
}

/* ---------- 11. KPI + MINI-STATS ---------- */
function renderKpis() {
    /* Talents encadrés */
    setText('kpiTalents', dTalents.length);

    /* Note moyenne du groupe (évals terminées) */
    const done = dEvals.filter(function(e) {
        return e.statut === 'done' && e.note_globale !== null && e.note_globale !== undefined;
    });
    if (done.length > 0) {
        let somme = 0;
        done.forEach(function(e) { somme += Number(e.note_globale) || 0; });
        setText('kpiNoteMoyenne', Math.round(somme / done.length) + '/100');
    } else {
        setText('kpiNoteMoyenne', '—');
    }

    /* Séances terminées + volume total */
    const terminees = dPlanning.filter(function(s) { return s.statut === 'terminee'; });
    setText('kpiSeances', terminees.length);
    let minutes = 0;
    terminees.forEach(function(s) { minutes += parseInt(s.duree_minutes, 10) || 0; });
    setText('kpiVolume', formatDuree(minutes));

    /* Mini-stats */
    setText('miniEvals',  done.length);
    setText('miniVideos', dVideos.filter(function(v) { return v.statut === 'analysee'; }).length);
    const alertesActives = dTriple.filter(function(a) { return a.statut === 'active'; }).length;
    setText('miniAlertes', alertesActives);
    setText('miniRecos',  dRecos.filter(function(r) { return r.statut === 'publiee'; }).length);

    /* Badge de notification = alertes actives (points d'attention du groupe) */
    setText('notifBadge', alertesActives);
}

/* ---------- 12. OUTIL : AFFICHER/MASQUER UN GRAPHIQUE VIDE ---------- */
function toggleChartEmpty(canvasId, emptyId, estVide) {
    const canvas = document.getElementById(canvasId);
    const empty  = document.getElementById(emptyId);
    if (canvas) { canvas.style.display = estVide ? 'none' : 'block'; }
    if (empty)  { empty.style.display  = estVide ? 'flex' : 'none'; }
}

/* ---------- 13. GRAPHIQUE : COMPOSITION DU GROUPE ---------- */
function renderChartRepartition() {
    const nbSportifs = dTalents.filter(function(t) { return t.talent_type !== 'artiste'; }).length;
    const nbArtistes = dTalents.filter(function(t) { return t.talent_type === 'artiste'; }).length;
    const total = nbSportifs + nbArtistes;

    toggleChartEmpty('chartRepartition', 'emptyRepartition', total === 0);
    if (total === 0) {
        return;
    }

    const ctx = document.getElementById('chartRepartition').getContext('2d');
    if (chartRepartition) {
        chartRepartition.destroy();
    }
    chartRepartition = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['⚽ Sportifs', '🎵 Artistes'],
            datasets: [{
                data: [nbSportifs, nbArtistes],
                backgroundColor: [C.primary, C.gold],
                borderColor: '#ffffff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, font: { size: 12 } }
                }
            }
        }
    });
}

/* ---------- 14. GRAPHIQUE : ALERTES TRIPLE PROJET ---------- */
function renderChartTriple() {
    const actives = dTriple.filter(function(a) { return a.statut === 'active'; });
    const nSport    = actives.filter(function(a) { return a.volet === 'sport'; }).length;
    const nEtude    = actives.filter(function(a) { return a.volet === 'etude'; }).length;
    const nCarriere = actives.filter(function(a) { return a.volet === 'carriere'; }).length;
    const total = nSport + nEtude + nCarriere;

    toggleChartEmpty('chartTriple', 'emptyTriple', total === 0);
    if (total === 0) {
        return;
    }

    const ctx = document.getElementById('chartTriple').getContext('2d');
    if (chartTriple) {
        chartTriple.destroy();
    }
    chartTriple = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sport', 'Étude', 'Carrière'],
            datasets: [{
                data: [nSport, nEtude, nCarriere],
                backgroundColor: [C.corps, C.ame, C.esprit],
                borderColor: '#ffffff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, font: { size: 12 } }
                }
            }
        }
    });
}

/* ---------- 15. GRAPHIQUE : ACTIVITÉ DES 6 DERNIERS MOIS ---------- */
function renderChartActivite() {
    /* Construire les 6 derniers mois (du plus ancien au plus récent) */
    const mois = [];
    const maintenant = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
        mois.push({
            annee : d.getFullYear(),
            mois  : d.getMonth(),
            label : d.toLocaleDateString('fr-FR', { month: 'short' })
        });
    }

    function compterParMois(liste, champDate, filtre) {
        return mois.map(function(m) {
            return liste.filter(function(item) {
                if (filtre && !filtre(item)) {
                    return false;
                }
                const d = new Date(item[champDate]);
                return d.getFullYear() === m.annee && d.getMonth() === m.mois;
            }).length;
        });
    }

    const seancesParMois = compterParMois(dPlanning, 'date_seance', function(s) {
        return s.statut === 'terminee';
    });
    const evalsParMois = compterParMois(dEvals, 'created_at', function(e) {
        return e.statut === 'done';
    });

    const ctx = document.getElementById('chartActivite').getContext('2d');
    if (chartActivite) {
        chartActivite.destroy();
    }
    chartActivite = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mois.map(function(m) { return m.label; }),
            datasets: [
                {
                    label: 'Séances terminées',
                    data: seancesParMois,
                    borderColor: C.primary,
                    backgroundColor: 'rgba(85, 27, 140, 0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: C.primary
                },
                {
                    label: 'Évaluations réalisées',
                    data: evalsParMois,
                    borderColor: C.goldDark,
                    backgroundColor: 'rgba(255, 204, 0, 0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: C.goldDark
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, font: { size: 12 } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

/* ---------- 16. GRAPHIQUE : MEILLEURES NOTES MOYENNES ---------- */
function calculerMoyennesParTalent() {
    /* Map talent_id → { nom, somme, nb } sur les évals terminées */
    const map = {};
    dEvals.forEach(function(e) {
        if (e.statut !== 'done' || e.note_globale === null || e.note_globale === undefined) {
            return;
        }
        if (!map[e.talent_id]) {
            map[e.talent_id] = { nom: e.talent_nom || e.talent_id, somme: 0, nb: 0 };
        }
        map[e.talent_id].somme += Number(e.note_globale) || 0;
        map[e.talent_id].nb += 1;
    });
    const resultats = [];
    Object.keys(map).forEach(function(id) {
        resultats.push({
            talent_id : id,
            nom       : map[id].nom,
            moyenne   : Math.round(map[id].somme / map[id].nb),
            nbEvals   : map[id].nb
        });
    });
    resultats.sort(function(a, b) { return b.moyenne - a.moyenne; });
    return resultats;
}

function renderChartTopNotes(moyennes) {
    const top = moyennes.slice(0, 8);

    toggleChartEmpty('chartTopNotes', 'emptyTopNotes', top.length === 0);
    if (top.length === 0) {
        return;
    }

    const couleurs = top.map(function(t) {
        if (t.moyenne >= 75) { return C.esprit; }
        if (t.moyenne >= 50) { return C.goldDark; }
        return C.corps;
    });

    const ctx = document.getElementById('chartTopNotes').getContext('2d');
    if (chartTopNotes) {
        chartTopNotes.destroy();
    }
    chartTopNotes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(function(t) { return t.nom; }),
            datasets: [{
                label: 'Note moyenne /100',
                data: top.map(function(t) { return t.moyenne; }),
                backgroundColor: couleurs,
                borderRadius: 8,
                maxBarThickness: 34
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 25 }
                }
            }
        }
    });
}

/* ---------- 17. CLASSEMENT DES TALENTS ---------- */
function renderClassement(moyennes) {
    const list  = document.getElementById('rankingList');
    const empty = document.getElementById('rankingEmpty');
    if (!list) {
        return;
    }
    list.querySelectorAll('.ranking-row').forEach(function(r) { r.remove(); });

    if (dTalents.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    /* Index des moyennes par talent */
    const moyMap = {};
    moyennes.forEach(function(m) { moyMap[m.talent_id] = m; });

    /* Compteurs annexes par talent */
    function nbVideosDe(id) {
        return dVideos.filter(function(v) { return v.talent_id === id && v.statut === 'analysee'; }).length;
    }
    function nbAlertesDe(id) {
        return dTriple.filter(function(a) { return a.talent_id === id && a.statut === 'active'; }).length;
    }

    /* Trier : évalués (par moyenne desc) puis non évalués (ordre alpha) */
    const evalues    = [];
    const nonEvalues = [];
    dTalents.forEach(function(t) {
        if (moyMap[t.talent_id]) {
            evalues.push(t);
        } else {
            nonEvalues.push(t);
        }
    });
    evalues.sort(function(a, b) {
        return moyMap[b.talent_id].moyenne - moyMap[a.talent_id].moyenne;
    });
    nonEvalues.sort(function(a, b) {
        return String(a.talent_nom || '').localeCompare(String(b.talent_nom || ''));
    });
    const ordonnes = evalues.concat(nonEvalues);

    ordonnes.forEach(function(t, index) {
        const rang = index + 1;
        const m    = moyMap[t.talent_id] || null;
        const nom  = t.talent_nom || t.talent_id;

        let badgeCls = '';
        if (m) {
            if (rang === 1) { badgeCls = ' gold'; }
            else if (rang === 2) { badgeCls = ' silver'; }
            else if (rang === 3) { badgeCls = ' bronze'; }
        }

        let noteHtml;
        if (m) {
            let noteCls = 'low';
            if (m.moyenne >= 75) { noteCls = 'high'; }
            else if (m.moyenne >= 50) { noteCls = 'mid'; }
            noteHtml = '<span class="note-pill ' + noteCls + '">' + m.moyenne + '</span>';
        } else {
            noteHtml = '<span class="note-pill none">—</span>';
        }

        const nbEvals   = m ? m.nbEvals : 0;
        const nbVideos  = nbVideosDe(t.talent_id);
        const nbAlertes = nbAlertesDe(t.talent_id);

        const row = document.createElement('div');
        row.className = 'ranking-row';
        row.innerHTML =
            '<span class="rank-badge' + badgeCls + '">' + rang + '</span>' +
            '<span class="rank-initials">' + getInitials(nom) + '</span>' +
            '<div class="rank-identity">' +
                '<div class="rank-name">' + escapeHtml(nom) + '</div>' +
                '<div class="rank-type">' +
                    (t.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                    (t.talent_role ? ' · ' + escapeHtml(t.talent_role) : '') +
                '</div>' +
            '</div>' +
            '<div class="rank-metrics">' +
                noteHtml +
                '<span class="rank-chip"><i class="fas fa-clipboard-check"></i> ' + nbEvals + ' éval(s)</span>' +
                '<span class="rank-chip"><i class="fas fa-film"></i> ' + nbVideos + ' vidéo(s)</span>' +
                (nbAlertes > 0
                    ? '<span class="rank-chip alert"><i class="fas fa-exclamation-circle"></i> ' + nbAlertes + ' alerte(s)</span>'
                    : '') +
            '</div>';
        list.appendChild(row);
    });
}

/* ---------- 18. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) {
        return;
    }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

/* ---------- 19. SIDEBAR + SWIPE ---------- */
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
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        if (dx > 0 && sx < 40) {
            open();
        } else if (dx < 0) {
            close();
        }
    }, { passive: false });
}

/* ---------- 20. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 21. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }

    /* Police des graphiques alignée sur la charte */
    if (window.Chart) {
        Chart.defaults.font.family = "'Poppins', sans-serif";
        Chart.defaults.color = '#4a4a6a';
    }

    await loadToutesLesDonnees();

    /* Rendu complet */
    renderKpis();
    renderChartRepartition();
    renderChartTriple();
    renderChartActivite();
    const moyennes = calculerMoyennesParTalent();
    renderChartTopNotes(moyennes);
    renderClassement(moyennes);

    initUserMenu();
    initSidebar();

    /* Déconnexion */
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    /* Sélecteur de langue */
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
