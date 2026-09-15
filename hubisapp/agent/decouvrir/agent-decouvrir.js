/* ============================================================
   HubISoccer -- agent-decouvrir.js
   Page Decouvrez mes talents - Espace Agent FIFA
   ------------------------------------------------------------
   AUCUNE NOUVELLE TABLE. Lit supabaseAuthPrive_profiles (role_code
   = 'FOOT') pour la liste de base -- champs confirmes et surs.
   Le detail des competences (footballeur_scouting) est lu
   uniquement a l'ouverture de la fiche d'un profil, en lecture
   defensive : si les noms de colonnes ne correspondent pas
   exactement, la fiche affiche "non disponible" plutot que des
   donnees fausses.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE   = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE    = 'supabaseAuthPrive_footballeur_scouting';

/* Correspondance possible des champs de competences -- lecture
   defensive : on essaie chaque nom plausible, on garde le premier
   trouve. */
const SKILLS_PROBABLES = [
    { label: 'Technique',        cles: ['comp_technique', 'skill_technique', 'technique'] },
    { label: 'Physique',          cles: ['comp_physique', 'skill_physique', 'physique'] },
    { label: 'Mental',             cles: ['comp_mental', 'skill_mental', 'mental'] },
    { label: 'Tactique',            cles: ['comp_tactique', 'skill_tactique', 'tactique'] },
    { label: 'Vitesse',              cles: ['comp_vitesse', 'skill_vitesse', 'vitesse'] },
    { label: 'Endurance',             cles: ['comp_endurance', 'skill_endurance', 'endurance'] }
];

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser      = null;
let agentProfile     = null;
let allFootballeurs    = [];
let selectedProfile      = null;

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
function calculerAge(d) {
    if (!d) { return null; }
    const today = new Date();
    const birth = new Date(d);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) { age--; }
    return age >= 0 ? age : null;
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

/* ---------- 9. CHARGEMENT DES PROFILS FOOTBALLEURS ---------- */
async function loadFootballeurs() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('role_code', 'FOOT');
    hideLoader();

    if (error) {
        console.warn('Lecture profils footballeurs :', error.message);
        showToast('Impossible de charger les profils pour le moment.', 'warning');
        allFootballeurs = [];
        return;
    }
    allFootballeurs = data || [];
    setText('statTotal', allFootballeurs.length);
    appliquerFiltres();
}

/* ---------- 10. FILTRES ---------- */
function appliquerFiltres() {
    const nom = (document.getElementById('filtreNom')?.value || '').toLowerCase().trim();
    const poste = document.getElementById('filtrePoste')?.value || '';
    const ageMin = document.getElementById('filtreAgeMin')?.value;
    const ageMax = document.getElementById('filtreAgeMax')?.value;

    let resultats = allFootballeurs.filter(function(p) {
        if (nom && !(p.full_name || '').toLowerCase().includes(nom)) { return false; }
        if (poste && p.position !== poste) { return false; }
        const age = calculerAge(p.date_of_birth);
        if (ageMin && (age === null || age < parseInt(ageMin, 10))) { return false; }
        if (ageMax && (age === null || age > parseInt(ageMax, 10))) { return false; }
        return true;
    });

    renderResultats(resultats);
    renderStatsFiltrees(resultats);
}

function renderStatsFiltrees(resultats) {
    setText('statFiltres', resultats.length);

    const ages = resultats.map(function(p) { return calculerAge(p.date_of_birth); }).filter(function(a) { return a !== null; });
    const moyenne = ages.length > 0 ? Math.round(ages.reduce(function(s, a) { return s + a; }, 0) / ages.length) : null;
    setText('statAge', moyenne !== null ? moyenne : '\u2014');

    const postes = new Set(resultats.map(function(p) { return p.position; }).filter(function(x) { return !!x; }));
    setText('statPostes', postes.size);
}

/* ---------- 11. RENDU DES RESULTATS ---------- */
function renderResultats(resultats) {
    const grid = document.getElementById('resultsGrid');
    const empty = document.getElementById('resultsEmpty');
    if (!grid) { return; }

    grid.innerHTML = '';

    if (resultats.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    resultats.forEach(function(p) {
        const age = calculerAge(p.date_of_birth);
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML =
            '<div class="profile-avatar">' +
                (p.avatar_url ? '<img src="' + escapeHtml(p.avatar_url) + '">' : escapeHtml(getInitials(p.full_name))) +
            '</div>' +
            '<div class="profile-name">' + escapeHtml(p.full_name || 'Talent') + '</div>' +
            (p.position ? '<span class="profile-poste">' + escapeHtml(p.position) + '</span>' : '') +
            '<div class="profile-meta">' + (age !== null ? age + ' ans' : '') + (p.nationality ? (age !== null ? ' &middot; ' : '') + escapeHtml(p.nationality) : '') + '</div>';
        card.addEventListener('click', function() { ouvrirModaleProfil(p); });
        grid.appendChild(card);
    });
}

/* ---------- 12. MODALE DETAIL PROFIL ---------- */
async function ouvrirModaleProfil(p) {
    selectedProfile = p;
    const age = calculerAge(p.date_of_birth);

    const avatarEl = document.getElementById('modalAvatar');
    avatarEl.innerHTML = p.avatar_url ? '<img src="' + escapeHtml(p.avatar_url) + '">' : escapeHtml(getInitials(p.full_name));

    setText('modalName', p.full_name || 'Talent');
    document.getElementById('modalMeta').textContent =
        [p.position, age !== null ? age + ' ans' : null, p.nationality, p.city].filter(Boolean).join(' \u00b7 ') || '\u2014';

    document.getElementById('profileModal').style.display = 'flex';
    await chargerCompetencesDefensif(p.hubisoccer_id);
}

async function chargerCompetencesDefensif(footballeurId) {
    const container = document.getElementById('modalSkills');
    const empty = document.getElementById('modalSkillsEmpty');
    container.innerHTML = '';

    let d = null;
    try {
        const { data, error } = await supabaseClient
            .from(SCOUTING_TABLE)
            .select('*')
            .eq('footballeur_id', footballeurId)
            .maybeSingle();
        if (!error && data) { d = data; }
    } catch (e) {
        d = null;
    }

    if (!d) {
        empty.style.display = 'flex';
        return;
    }

    const trouves = SKILLS_PROBABLES
        .map(function(s) {
            const cle = s.cles.find(function(c) { return d[c] !== undefined && d[c] !== null; });
            return cle ? { label: s.label, valeur: d[cle] } : null;
        })
        .filter(Boolean);

    if (trouves.length === 0) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    trouves.forEach(function(s) {
        const item = document.createElement('div');
        item.className = 'modal-skill-item';
        item.innerHTML =
            '<span class="modal-skill-label">' + escapeHtml(s.label) + '</span>' +
            '<div class="modal-skill-track"><div class="modal-skill-fill" style="width:' + Math.min(s.valeur, 100) + '%;"></div></div>' +
            '<span class="modal-skill-value">' + s.valeur + '</span>';
        container.appendChild(item);
    });
}

function fermerModaleProfil() {
    document.getElementById('profileModal').style.display = 'none';
    selectedProfile = null;
}

function recruterTalent() {
    if (!selectedProfile) { return; }
    window.location.href = '../talents/agent-talents.html?id=' + encodeURIComponent(selectedProfile.hubisoccer_id);
}

/* ---------- 13. MENU UTILISATEUR ---------- */
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

/* ---------- 14. SIDEBAR + SWIPE ---------- */
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

/* ---------- 15. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 16. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadFootballeurs();

    initUserMenu();
    initSidebar();

    ['filtreNom', 'filtrePoste', 'filtreAgeMin', 'filtreAgeMax'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', appliquerFiltres); el.addEventListener('change', appliquerFiltres); }
    });

    document.getElementById('btnResetFiltres')?.addEventListener('click', function() {
        document.getElementById('filtreNom').value = '';
        document.getElementById('filtrePoste').value = '';
        document.getElementById('filtreAgeMin').value = '';
        document.getElementById('filtreAgeMax').value = '';
        appliquerFiltres();
    });

    document.getElementById('closeProfileModal')?.addEventListener('click', fermerModaleProfil);
    document.getElementById('closeProfileModalBtn')?.addEventListener('click', fermerModaleProfil);
    document.getElementById('btnInviterTalent')?.addEventListener('click', recruterTalent);

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
