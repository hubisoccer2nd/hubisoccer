/* ============================================================
   HubISoccer -- acceuil.js
   Gestion des tournois -- Page d'accueil (refonte)
   ------------------------------------------------------------
   Corrige : profil/parametres fixes sur footballeur (maintenant
   routes dynamiquement selon le role), aucune notion de niveau
   d'acces (maintenant les elements data-tier="gestionnaire" sont
   masques aux non-organisateurs), tables renommees vers la
   convention supabaseAuthPrive_gt_*, et n'affiche
   que les tournois publies (jamais les brouillons d'un autre).
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES (convention supabaseAuthPrive_gt_*)
// ═══════════════════════════════════════════════════════════
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS        = 'supabaseAuthPrive_gt_sports';
const TBL_PARTICIPANTS   = 'supabaseAuthPrive_gt_participants';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ------------------------------------------------------------
// Seuls les roles dont l'espace personnel est deja construit
// figurent ici. Un role absent de cette table verra "Mon profil"
// et "Parametres" masques plutot que rediriges vers un lien
// casse -- a completer au fur et a mesure que d'autres espaces
// sont livres (les 9 autres sportifs, les 10 artistes, Formateur,
// et Gestionnaire de Tournoi lui-meme des que son propre espace
// personnel existera).
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' }
};

// Roles autorises a voir les elements marques data-tier="gestionnaire"
const GESTIONNAIRE_ROLE_CODES = ['TOURN']; // confirme depuis login.html ligne 423

// ═══════════════════════════════════════════════════════════
// 4. ETAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let allTournaments = [];

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 20000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

// Le nom du tournoi accepte du HTML/CSS ecrit par l'organisateur
// (voir create-tournament.js), stocke tel quel en base. Assaini ici
// avant tout rendu -- jamais injecte brut, meme sur une simple carte.
function sanitizeHtml(raw) {
    return window.DOMPurify ? DOMPurify.sanitize(raw || '') : escapeHtml(raw);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

function formatMoney(n) {
    if (!n) return '0';
    return Number(n).toLocaleString('fr-FR');
}

function formatDateShort(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Statut temporel reel d'un tournoi, calcule a partir des dates
// (distinct du champ "status" en base qui indique brouillon/publie/annule)
function computeTimeState(t) {
    const now = new Date();
    const start = new Date(t.start_date);
    const end = new Date(t.end_date);
    if (start > now) return 'upcoming';
    if (end < now) return 'past';
    return 'ongoing';
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DU PROFIL + APPLICATION DU NIVEAU D'ACCES
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error || !data) {
        hideLoader();
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    // Le masquage des elements gestionnaire doit etre applique
    // AVANT que le voile de chargement ne disparaisse -- sinon la
    // page reelle (menu complet inclus) est visible un court
    // instant avant que le role ne soit verifie.
    applyRoleTier();
    updateNavbarUI();
    hideLoader();
    return userProfile;
}

// Masque les elements data-tier="gestionnaire" pour tout le monde
// sauf le role Gestionnaire de Tournoi lui-meme
function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) {
            el.style.display = 'none';
        });
    }
}

// Route "Mon profil" / "Parametres" vers l'espace du role connecte
// plutot que vers une page fixe (l'ancien bug pointait toujours
// vers le footballeur, quel que soit le role reellement connecte)
function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        // Espace personnel pas encore construit pour ce role :
        // on masque plutot que de pointer vers un lien casse
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 10. MISE A JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    }

    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }

    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES TOURNOIS (uniquement publies/termines --
//     jamais un brouillon d'un autre organisateur)
// ═══════════════════════════════════════════════════════════
async function loadTournamentsList() {
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, description, start_date, end_date, location, registration_code, prize_pool, stream_url, status, type_id, sport_id, logo_url, banner_url, video_url, participation_type, participation_price, ' + TBL_TYPES + '(name, label), ' + TBL_SPORTS + '(name)')
        .in('status', ['published', 'completed'])
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Erreur chargement tournois:', error);
        throw error;
    }

    return data.map(function(t) {
        return {
            id: t.id,
            name: t.name,
            description: t.description,
            start_date: t.start_date,
            end_date: t.end_date,
            location: t.location,
            registration_code: t.registration_code,
            prize_pool: t.prize_pool,
            stream_url: t.stream_url,
            status: t.status,
            type: t[TBL_TYPES] ? t[TBL_TYPES].name : '',
            typeLabel: t[TBL_TYPES] ? t[TBL_TYPES].label : '',
            sport: t[TBL_SPORTS] ? t[TBL_SPORTS].name : ''
        };
    });
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES SPORTS / TYPES (filtres)
// ═══════════════════════════════════════════════════════════
async function loadSportsList() {
    const { data, error } = await supabaseClient.from(TBL_SPORTS).select('id, name').order('name');
    if (error) throw error;
    return data;
}

async function loadTournamentTypes() {
    const { data, error } = await supabaseClient.from(TBL_TYPES).select('id, name, label').order('label');
    if (error) throw error;
    return data;
}

async function loadFilters() {
    try {
        const sports = await loadSportsList();
        const types = await loadTournamentTypes();

        const sportSelect = document.getElementById('sportFilter');
        sports.forEach(function(sport) {
            const opt = document.createElement('option');
            opt.value = sport.name;
            opt.textContent = sport.name;
            sportSelect.appendChild(opt);
        });

        const typeSelect = document.getElementById('typeFilter');
        types.forEach(function(type) {
            const opt = document.createElement('option');
            opt.value = type.name;
            opt.textContent = type.label;
            typeSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Erreur chargement filtres', err);
        showToast('Erreur lors du chargement des filtres', 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT + AFFICHAGE GENERAL
// ═══════════════════════════════════════════════════════════
async function loadAndDisplayTournaments() {
    try {
        showLoader();
        const tournaments = await loadTournamentsList();
        allTournaments = tournaments;
        renderHeroStats();
        renderLiveStrip();
        applyFilters();
        hideLoader();
    } catch (err) {
        console.error('Erreur chargement tournois', err);
        document.getElementById('loader').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erreur de chargement</p></div>';
        hideLoader();
    }
}

// ═══════════════════════════════════════════════════════════
// 14. STATS RAPIDES (bandeau hero)
// ═══════════════════════════════════════════════════════════
async function renderHeroStats() {
    const ongoing = allTournaments.filter(function(t) { return computeTimeState(t) === 'ongoing'; });
    const upcoming = allTournaments.filter(function(t) { return computeTimeState(t) === 'upcoming'; });
    const cagnotte = allTournaments.reduce(function(sum, t) { return sum + (Number(t.prize_pool) || 0); }, 0);

    document.getElementById('statActifs').textContent = ongoing.length;
    document.getElementById('statAVenir').textContent = upcoming.length;
    document.getElementById('statCagnotte').textContent = formatMoney(cagnotte) + ' FCFA';

    // Participants approuves, tous tournois publies confondus
    const ids = allTournaments.map(function(t) { return t.id; });
    if (!ids.length) {
        document.getElementById('statParticipants').textContent = '0';
        return;
    }
    const { count, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id', { count: 'exact', head: true })
        .in('tournament_id', ids)
        .eq('status', 'approved');
    document.getElementById('statParticipants').textContent = error ? '—' : (count || 0);
}

// ═══════════════════════════════════════════════════════════
// 15. BANDEAU EN DIRECT (element signature)
// ═══════════════════════════════════════════════════════════
function renderLiveStrip() {
    const track = document.getElementById('liveStripTrack');
    const empty = document.getElementById('liveStripEmpty');
    const live = allTournaments.filter(function(t) { return computeTimeState(t) === 'ongoing'; });

    if (!live.length) {
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    track.innerHTML = live.map(function(t) {
        return '<a class="live-pill" href="tournament-details.html?id=' + t.id + '">' +
               '<span class="live-dot small"></span>' +
               (t.logo_url ? '<img class="live-pill-logo" src="' + t.logo_url + '" alt="">' : '') +
               '<span class="live-pill-name">' + sanitizeHtml(t.name) + '</span>' +
               '<span class="live-pill-sport">' + escapeHtml(t.sport) + '</span>' +
               '</a>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 16. APPLICATION DES FILTRES
// ═══════════════════════════════════════════════════════════
function applyFilters() {
    const sport = document.getElementById('sportFilter').value;
    const period = document.getElementById('periodFilter').value;
    const type = document.getElementById('typeFilter').value;
    const search = document.getElementById('searchInput').value.trim().toLowerCase();

    let filtered = allTournaments.filter(function(t) {
        if (sport !== 'all' && t.sport !== sport) return false;
        if (type !== 'all' && t.type !== type) return false;
        if (search && t.name.toLowerCase().indexOf(search) === -1) return false;

        const state = computeTimeState(t);
        if (period === 'live' && state !== 'ongoing') return false;
        if (period === 'upcoming' && state !== 'upcoming') return false;
        if (period === 'ongoing' && state !== 'ongoing') return false;
        if (period === 'past' && state !== 'past') return false;
        return true;
    });

    renderTournaments(filtered);
}

// ═══════════════════════════════════════════════════════════
// 17. RENDU DES CARTES TOURNOI (design redesigne)
// ═══════════════════════════════════════════════════════════
function renderTournaments(tournaments) {
    const grid = document.getElementById('tournamentsGrid');
    grid.innerHTML = '';

    if (!tournaments.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Aucun tournoi correspondant</p></div>';
        return;
    }

    tournaments.forEach(function(t) {
        const card = document.createElement('div');
        const state = computeTimeState(t);
        card.className = 'tournament-card state-' + state;

        const start = formatDateShort(t.start_date);
        const end = formatDateShort(t.end_date);

        let badgeClass = '';
        if (t.type === 'public_show') badgeClass = 'badge-show';
        else if (t.type === 'public_detection') badgeClass = 'badge-detection';
        else if (t.type === 'private_hubisoccer') badgeClass = 'badge-private';
        else if (t.type === 'private_simple') badgeClass = 'badge-simple';

        const stateLabel = state === 'ongoing' ? '<span class="state-pill ongoing"><span class="live-dot small"></span> En cours</span>'
                          : state === 'upcoming' ? '<span class="state-pill upcoming"><i class="fas fa-clock"></i> À venir</span>'
                          : '<span class="state-pill past"><i class="fas fa-flag-checkered"></i> Terminé</span>';

        if (t.banner_url) {
            card.style.backgroundImage = 'linear-gradient(180deg, rgba(22,22,31,.15), rgba(22,22,31,.75)), url(' + t.banner_url + ')';
            card.classList.add('has-banner');
        }

        card.innerHTML =
            '<div class="card-top-row">' +
            '<div class="card-badge ' + badgeClass + '">' + escapeHtml(t.typeLabel) + '</div>' +
            stateLabel +
            '</div>' +
            (t.logo_url ? '<div class="card-logo"><img src="' + t.logo_url + '" alt=""></div>' : '') +
            '<div class="card-sport"><i class="fas fa-futbol"></i> ' + escapeHtml(t.sport) + '</div>' +
            '<h3 class="card-title">' + sanitizeHtml(t.name) + '</h3>' +
            '<div class="card-meta-row">' +
            '<span class="card-date"><i class="fas fa-calendar-alt"></i> ' + start + ' → ' + end + '</span>' +
            '<span class="card-location"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(t.location || 'Non précisé') + '</span>' +
            '</div>' +
            (t.prize_pool ? '<div class="card-prize"><i class="fas fa-coins"></i> <span class="tabular">' + formatMoney(t.prize_pool) + '</span> FCFA</div>' : '') +
            '<button class="btn-details" data-id="' + t.id + '">Voir les détails <i class="fas fa-arrow-right"></i></button>';

        grid.appendChild(card);
    });

    document.querySelectorAll('.btn-details').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.location.href = 'tournament-details.html?id=' + btn.dataset.id;
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 18. UI : SIDEBAR, MENU, DECONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() {
                window.location.href = '../../../index.html';
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 19. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('createTournamentBtn')?.addEventListener('click', function() {
        window.location.href = 'create-tournament.html';
    });

    await loadFilters();
    await loadAndDisplayTournaments();

    document.getElementById('sportFilter')?.addEventListener('change', applyFilters);
    document.getElementById('periodFilter')?.addEventListener('change', applyFilters);
    document.getElementById('typeFilter')?.addEventListener('change', applyFilters);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
});
