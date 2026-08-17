/* ============================================================
   HubISoccer — club-draw.js
   Système Gestion Tournois — Tirage des Clubs (Roulette Numérique)
   ------------------------------------------------------------
   Base : le moteur de roue (decoupage 2π/n, animation easeOutCubic
   sur 4 secondes, calcul de l'angle gagnant sous le pointeur a
   3π/2) reprend fidelement la logique fournie par Ozawa -- elle
   fonctionnait deja et n'avait pas besoin d'etre changee.
   Mis en developpement reel :
   - "Nom de l'equipe" (texte libre) remplace par un vrai
     selecteur de tournoi puis d'equipe (gt_teams), plus nom +
     role du representant (capitaine/president/coach), comme
     demande -- l'equipe existe deja, on ne la re-nomme pas.
   - Les 16 clubs sont dessines avec leurs VRAIS logos (chargement
     asynchrone des images avant tout rendu), pas juste du texte.
   - Un club ne peut etre attribue qu'une fois par tournoi : les
     clubs deja pris sont retires de la roue au fur et a mesure
     (UNIQUE(tournament_id, club_slug) cote base, mais aussi
     filtre cote client pour que la roue reste honnete visuellement).
   - Le resultat est reellement enregistre (gt_club_draws), plus
     un tableau des tirages deja effectues pour ce tournoi.
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
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TEAMS          = 'supabaseAuthPrive_gt_teams';
const TBL_DRAWS              = 'supabaseAuthPrive_gt_club_draws';
const TBL_PROFILES              = 'supabaseAuthPrive_profiles';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

// ═══════════════════════════════════════════════════════════
// 4. LES 16 CLUBS (slug, nom, logo, couleur d'accent)
// ═══════════════════════════════════════════════════════════
const ALL_CLUBS = [
    { slug: 'real-madrid',     name: 'Real Madrid',      logo: 'img/real-madrid.png' },
    { slug: 'barcelone',       name: 'FC Barcelone',     logo: 'img/barcelone.png' },
    { slug: 'atletico-madrid', name: 'Atlético Madrid',  logo: 'img/atletico-madrid.png' },
    { slug: 'man-city',        name: 'Man City',         logo: 'img/man-city.png' },
    { slug: 'liverpool',       name: 'Liverpool',        logo: 'img/liverpool.jpg' },
    { slug: 'arsenal',         name: 'Arsenal',          logo: 'img/arsenal.png' },
    { slug: 'chelsea',         name: 'Chelsea',          logo: 'img/chelsea.jpg' },
    { slug: 'man-united',      name: 'Man United',       logo: 'img/man-united.png' },
    { slug: 'psg',             name: 'PSG',              logo: 'img/psg.png' },
    { slug: 'om',              name: 'OM',               logo: 'img/om.jpg' },
    { slug: 'juventus',        name: 'Juventus',         logo: 'img/juventus.png' },
    { slug: 'ac-milan',        name: 'AC Milan',         logo: 'img/ac-milan.png' },
    { slug: 'inter-milan',     name: 'Inter Milan',      logo: 'img/inter-milan.png' },
    { slug: 'bayern-munich',   name: 'Bayern Munich',    logo: 'img/bayern-munich.png' },
    { slug: 'dortmund',        name: 'Dortmund',         logo: 'img/dortmund.png' },
    { slug: 'benfica',         name: 'Benfica',          logo: 'img/benfica.webp' }
];
const SLICE_COLORS = ['#1c2541', '#ffb703', '#3a506b', '#fb8500'];

// ═══════════════════════════════════════════════════════════
// 5. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournamentId = null;
let currentTeamId = null;
let availableClubs = [];
let loadedImages = {};
let canvas, ctx;
let currentAngle = 0;
let isSpinning = false;

// ═══════════════════════════════════════════════════════════
// 6. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 7. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 30000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
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
// 8. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 9. SESSION
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
// 10. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 11. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
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
// 12. CHARGEMENT DES TOURNOIS
// ═══════════════════════════════════════════════════════════
async function loadTournaments() {
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name')
        .eq('status', 'published')
        .order('start_date', { ascending: false });

    if (error) { showToast('Erreur chargement des tournois', 'error'); return; }

    const select = document.getElementById('tournamentSelect');
    select.innerHTML = '<option value="">-- Sélectionnez un tournoi --</option>';
    (data || []).forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT DES ÉQUIPES DU TOURNOI (celles sans club déjà attribué)
// ═══════════════════════════════════════════════════════════
async function loadTeams() {
    const teamSelect = document.getElementById('teamSelect');
    teamSelect.innerHTML = '<option value="">Chargement…</option>';
    teamSelect.disabled = true;

    if (!currentTournamentId) {
        teamSelect.innerHTML = '<option value="">-- Sélectionnez d\'abord un tournoi --</option>';
        return;
    }

    const { data: teams, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('id, name')
        .eq('tournament_id', currentTournamentId)
        .order('name');

    if (error) { showToast('Erreur chargement des équipes', 'error'); return; }

    const { data: draws } = await supabaseClient
        .from(TBL_DRAWS)
        .select('team_id')
        .eq('tournament_id', currentTournamentId);
    const teamsWithClub = new Set((draws || []).map(function(d) { return d.team_id; }));

    const eligibleTeams = (teams || []).filter(function(t) { return !teamsWithClub.has(t.id); });

    if (!eligibleTeams.length) {
        teamSelect.innerHTML = '<option value="">Toutes les équipes ont déjà un club</option>';
        return;
    }

    teamSelect.innerHTML = '<option value="">-- Sélectionnez une équipe --</option>';
    eligibleTeams.forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        teamSelect.appendChild(opt);
    });
    teamSelect.disabled = false;
}

// ═══════════════════════════════════════════════════════════
// 14. CLUBS DISPONIBLES POUR CE TOURNOI (déjà pris = retirés de la roue)
// ═══════════════════════════════════════════════════════════
async function loadAvailableClubs() {
    if (!currentTournamentId) {
        availableClubs = ALL_CLUBS.slice();
        return;
    }

    const { data: draws } = await supabaseClient
        .from(TBL_DRAWS)
        .select('club_slug')
        .eq('tournament_id', currentTournamentId);

    const takenSlugs = new Set((draws || []).map(function(d) { return d.club_slug; }));
    availableClubs = ALL_CLUBS.filter(function(c) { return !takenSlugs.has(c.slug); });

    const clubsLeftEl = document.getElementById('clubsLeft');
    clubsLeftEl.textContent = availableClubs.length + ' club' + (availableClubs.length !== 1 ? 's' : '') + ' disponible' + (availableClubs.length !== 1 ? 's' : '') + ' sur 16';

    document.getElementById('spinBtn').disabled = availableClubs.length === 0;
    if (availableClubs.length === 0) {
        document.getElementById('spinBtn').innerHTML = '<i class="fas fa-check-double"></i> Tous les clubs sont attribués';
    }

    await preloadImages();
    drawWheel();
}

// ═══════════════════════════════════════════════════════════
// 15. CHARGEMENT DES IMAGES (asynchrone, avant tout rendu)
// ═══════════════════════════════════════════════════════════
function preloadImages() {
    const promises = availableClubs.map(function(club) {
        if (loadedImages[club.slug]) return Promise.resolve();
        return new Promise(function(resolve) {
            const img = new Image();
            img.onload = function() { loadedImages[club.slug] = img; resolve(); };
            img.onerror = function() { resolve(); };
            img.src = club.logo;
        });
    });
    return Promise.all(promises);
}

// ═══════════════════════════════════════════════════════════
// 16. DESSIN DE LA ROUE (avec vrais logos)
// ═══════════════════════════════════════════════════════════
function drawWheel() {
    if (!ctx) return;
    const radius = canvas.width / 2;
    const numSlices = availableClubs.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (numSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / numSlices;

    for (let i = 0; i < numSlices; i++) {
        const club = availableClubs[i];
        const angle = currentAngle + i * sliceAngle;
        const color = SLICE_COLORS[i % SLICE_COLORS.length];

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + sliceAngle);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.strokeStyle = '#0b132b';
        ctx.lineWidth = 2;
        ctx.stroke();

        const img = loadedImages[club.slug];
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + sliceAngle / 2);
        if (img) {
            const logoSize = 42;
            const logoDist = radius - 60;
            ctx.save();
            ctx.translate(logoDist, 0);
            ctx.rotate(-(angle + sliceAngle / 2));
            ctx.beginPath();
            ctx.arc(0, 0, logoSize / 2 + 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.drawImage(img, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
            ctx.restore();
        } else {
            ctx.textAlign = 'right';
            ctx.fillStyle = (color === '#ffb703' || color === '#fb8500') ? '#000000' : '#ffffff';
            ctx.font = "bold 12px 'Poppins', sans-serif";
            ctx.fillText(club.name, radius - 15, 5);
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════
// 17. ANIMATION DU TIRAGE (physique identique à la référence)
// ═══════════════════════════════════════════════════════════
async function spinWheel() {
    if (isSpinning) return;
    if (!currentTournamentId || !currentTeamId) {
        showToast('Veuillez sélectionner un tournoi et une équipe.', 'warning');
        return;
    }
    const repName = document.getElementById('representativeName').value.trim();
    if (!repName) {
        showToast('Veuillez entrer le nom du représentant.', 'warning');
        return;
    }
    if (!availableClubs.length) {
        showToast('Tous les clubs sont déjà attribués pour ce tournoi.', 'warning');
        return;
    }

    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;

    const numSlices = availableClubs.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    const spinRounds = 5 + Math.floor(Math.random() * 5);
    const randomTargetAngle = Math.random() * 2 * Math.PI;
    const totalRotation = spinRounds * 2 * Math.PI + randomTargetAngle;

    let start = null;
    const duration = 4000;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        const easeOut = 1 - Math.pow(1 - Math.min(progress, 1), 3);
        currentAngle = easeOut * totalRotation;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            finalizeDraw(repName, sliceAngle, numSlices);
        }
    }

    requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════
// 18. FINALISATION DU TIRAGE (calcul + enregistrement réel)
// ═══════════════════════════════════════════════════════════
async function finalizeDraw(repName, sliceAngle, numSlices) {
    const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI)) + (3 * Math.PI / 2)) % (2 * Math.PI);
    const winningIndex = Math.floor(normalizedAngle / sliceAngle) % numSlices;
    const winningClub = availableClubs[winningIndex];

    const repRole = document.getElementById('representativeRole').value;

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_DRAWS)
        .insert([{
            tournament_id: currentTournamentId,
            team_id: currentTeamId,
            club_slug: winningClub.slug,
            club_name: winningClub.name,
            club_logo: winningClub.logo,
            representative_name: repName,
            representative_role: repRole,
            drawn_by: currentUser.id
        }]);
    hideLoader();

    if (error) {
        if (error.code === '23505') {
            showToast('Ce club vient d\'être pris, ou cette équipe a déjà un club. Rafraîchissez et réessayez.', 'warning');
        } else {
            showToast('Erreur lors de l\'enregistrement du tirage : ' + error.message, 'error');
        }
        await loadAvailableClubs();
        return;
    }

    showResultModal(repName, winningClub);
    await loadTeams();
    await loadAvailableClubs();
    await loadDrawsBoard();

    document.getElementById('representativeName').value = '';
    document.getElementById('teamSelect').value = '';
    currentTeamId = null;
}

// ═══════════════════════════════════════════════════════════
// 19. MODALE RÉSULTAT
// ═══════════════════════════════════════════════════════════
function showResultModal(repName, club) {
    document.getElementById('resultLogo').src = club.logo;
    document.getElementById('resultText').innerHTML =
        escapeHtml(repName) + ' représentera le club <strong>' + escapeHtml(club.name) + '</strong> durant la compétition !';
    document.getElementById('resultModal').classList.add('show');
}
function closeResultModal() {
    document.getElementById('resultModal').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════
// 20. TABLEAU DES TIRAGES DÉJÀ EFFECTUÉS
// ═══════════════════════════════════════════════════════════
async function loadDrawsBoard() {
    const container = document.getElementById('drawsList');
    if (!currentTournamentId) {
        container.innerHTML = '<p class="empty-hint">Sélectionnez un tournoi pour voir les tirages.</p>';
        return;
    }

    const { data, error } = await supabaseClient
        .from(TBL_DRAWS)
        .select('team_id, club_name, club_logo, representative_name, representative_role, drawn_at')
        .eq('tournament_id', currentTournamentId)
        .order('drawn_at', { ascending: false });

    if (error) { container.innerHTML = '<p class="empty-hint">Erreur de chargement.</p>'; return; }
    if (!data || !data.length) { container.innerHTML = '<p class="empty-hint">Aucun tirage effectué pour ce tournoi.</p>'; return; }

    const teamIds = data.map(function(d) { return d.team_id; });
    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', teamIds);
    const teamNameMap = {};
    (teams || []).forEach(function(t) { teamNameMap[t.id] = t.name; });

    const roleLabels = { capitaine: 'Capitaine', president: 'Président', coach: 'Coach' };

    container.innerHTML = data.map(function(d) {
        return '<div class="draw-item">' +
               '<img class="draw-item-logo" src="' + d.club_logo + '" alt="">' +
               '<div class="draw-item-info">' +
               '<span class="draw-item-club">' + escapeHtml(d.club_name) + '</span>' +
               '<span class="draw-item-team">' + escapeHtml(teamNameMap[d.team_id] || 'Équipe inconnue') + '</span>' +
               '</div>' +
               '<div class="draw-item-rep">' +
               '<span>' + escapeHtml(d.representative_name) + '</span>' +
               '<span class="draw-item-role">' + (roleLabels[d.representative_role] || d.representative_role) + '</span>' +
               '</div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 21. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 22. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    initUserMenu();
    initSidebar();
    initLogout();

    canvas = document.getElementById('wheelCanvas');
    ctx = canvas.getContext('2d');

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournaments();

    document.getElementById('tournamentSelect')?.addEventListener('change', async function() {
        currentTournamentId = this.value || null;
        currentTeamId = null;
        await loadTeams();
        await loadAvailableClubs();
        await loadDrawsBoard();
    });

    document.getElementById('teamSelect')?.addEventListener('change', function() {
        currentTeamId = this.value || null;
    });

    document.getElementById('spinBtn')?.addEventListener('click', spinWheel);
    document.getElementById('closeResultBtn')?.addEventListener('click', closeResultModal);
    document.getElementById('resultModal')?.addEventListener('click', function(e) { if (e.target === this) closeResultModal(); });

    await loadAvailableClubs();
});
