/* ============================================================
   HubISoccer — mon-equipe.js (v2 — composition complète d'équipe)
   Système Gestion Tournois — Mon équipe
   ------------------------------------------------------------
   Reprend la version corrigee (is_captain, terminologie footballeur,
   apercu du footballeur selectionne) et l'etend pour une VRAIE
   equipe complete : footballeurs (60 postes precis groupes en 8
   familles) + encadrement technique + medical + direction +
   entourage (agent, parrain), a niveau de detail egal -- aucune
   categorie traitee comme "membre simple".
   Chaque membre porte age/taille/langue(s), quelle que soit sa
   categorie. Les roles relies a un vrai type de compte HubISoccer
   (footballeur/coach/staff medical/agent/parrain) se recherchent
   parmi les comptes reels ; la direction (President, Delegue,
   Directeur sportif) n'a pas de type de compte dedie -- saisie
   libre avec photo televersee directement.
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
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS       = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS           = 'supabaseAuthPrive_gt_tournaments';
const TBL_SPORTS                   = 'supabaseAuthPrive_gt_sports';
const TBL_PROFILES                    = 'supabaseAuthPrive_profiles';
const LOGO_BUCKET                        = 'gt-team-logos';

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
const POSITION_ROWS = { 'Attaquant': 'rowAttaquants', 'Milieu': 'rowMilieux', 'Défenseur': 'rowDefenseurs', 'Gardien': 'rowGardien' };

// ═══════════════════════════════════════════════════════════
// 4. TAXONOMIE COMPLÈTE DES CATÉGORIES ET POSTES
// ------------------------------------------------------------
// Chaque poste de footballeur porte un pitchGroup (le regroupement
// large deja utilise par la vue terrain : Gardien/Defenseur/Milieu/
// Attaquant) en plus de son libelle precis.
// searchRole = code de role a chercher parmi les vrais comptes ;
// null = pas de type de compte dedie, saisie libre.
// ═══════════════════════════════════════════════════════════
const MEMBER_CATEGORIES = {
    footballeur: {
        label: 'Footballeur',
        icon: 'fa-running',
        searchRole: 'FOOT',
        groups: [
            { label: '🧤 Gardien de but', pitchGroup: 'Gardien', positions: [
                'Gardien de but (GK)', 'Gardien-libéro / Sweeper Keeper', 'Gardien de ligne', 'Gardien relanceur'
            ]},
            { label: '🛡️ Défense centrale', pitchGroup: 'Défenseur', positions: [
                'Défenseur central droit (DC)', 'Défenseur central gauche (DC)', 'Défenseur central axial',
                'Libéro', 'Stoppeur', 'Défenseur central relanceur'
            ]},
            { label: '🛡️ Défense latérale', pitchGroup: 'Défenseur', positions: [
                'Arrière droit (DD/RB)', 'Arrière gauche (DG/LB)', 'Latéral droit offensif', 'Latéral gauche offensif',
                'Latéral inversé droit', 'Latéral inversé gauche', 'Piston droit (RWB)', 'Piston gauche (LWB)'
            ]},
            { label: '🎯 Milieux défensifs', pitchGroup: 'Milieu', positions: [
                'Milieu défensif (MDC/DM)', 'Sentinelle', 'Milieu récupérateur', 'Milieu défensif relayeur',
                'Regista', 'Meneur de jeu en retrait'
            ]},
            { label: '⚙️ Milieux centraux', pitchGroup: 'Milieu', positions: [
                'Milieu central (MC/CM)', 'Relayeur droit', 'Relayeur gauche', 'Box-to-box',
                'Meneur de jeu', 'Milieu organisateur', 'Milieu travailleur'
            ]},
            { label: '🎨 Milieux offensifs', pitchGroup: 'Milieu', positions: [
                'Milieu offensif central (MOC/CAM)', 'Meneur de jeu avancé', 'Numéro 10',
                'Milieu offensif droit (MOD/RAM)', 'Milieu offensif gauche (MOG/LAM)'
            ]},
            { label: '🪽 Ailiers', pitchGroup: 'Attaquant', positions: [
                'Ailier droit (AD/RW)', 'Ailier gauche (AG/LW)', 'Ailier droit inversé', 'Ailier gauche inversé',
                'Ailier intérieur droit', 'Ailier intérieur gauche'
            ]},
            { label: '⚡ Attaquants', pitchGroup: 'Attaquant', positions: [
                'Avant-centre (AC/ST)', 'Buteur', 'Attaquant de pointe', 'Attaquant complet', 'Attaquant avancé',
                'Renard des surfaces', 'Pivot', 'Faux 9', 'Second attaquant', 'Attaquant de soutien'
            ]},
            { label: '🔥 Postes hybrides', pitchGroup: null, positions: [
                'Défenseur central / Milieu défensif', 'Latéral / Piston', 'Latéral / Ailier',
                'Milieu défensif / Milieu central', 'Milieu central / Milieu offensif',
                'Milieu offensif / Ailier', 'Ailier / Second attaquant', 'Attaquant / Ailier'
            ]}
        ]
    },
    technique: {
        label: 'Encadrement technique',
        icon: 'fa-user-tie',
        searchRole: 'COACH',
        groups: [{ label: null, pitchGroup: null, positions: [
            'Entraîneur principal', 'Entraîneur adjoint', 'Entraîneur des gardiens', 'Préparateur physique', 'Analyste vidéo'
        ]}]
    },
    medical: {
        label: 'Encadrement médical',
        icon: 'fa-briefcase-medical',
        searchRole: 'MEDIC',
        groups: [{ label: null, pitchGroup: null, positions: [
            "Médecin de l'équipe", 'Kinésithérapeute', 'Masseur'
        ]}]
    },
    direction: {
        label: 'Direction',
        icon: 'fa-user-shield',
        searchRole: null,
        groups: [{ label: null, pitchGroup: null, positions: [
            'Président / Dirigeant', 'Délégué', 'Directeur sportif'
        ]}]
    },
    entourage: {
        label: "Autour de l'équipe",
        icon: 'fa-handshake',
        searchRole: null,
        groups: [{ label: null, pitchGroup: null, positions: [
            { label: 'Agent', searchRole: 'AGENT' },
            { label: 'Parrain / Sponsor', searchRole: 'PARRAIN' }
        ]}]
    }
};

// Position precise -> pitchGroup (calcule une fois, pour la vue terrain)
const POSITION_TO_PITCH_GROUP = {};
MEMBER_CATEGORIES.footballeur.groups.forEach(function(g) {
    g.positions.forEach(function(p) { POSITION_TO_PITCH_GROUP[p] = g.pitchGroup || 'Milieu'; });
});

// ═══════════════════════════════════════════════════════════
// 5. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let myTeams = [];
let currentTeam = null;
let isTeamOwner = false;
let selectedPlayerId = null;
let selectedPlayerProfile = null;
let selectedTeamLogoFile = null;
let selectedMemberPhotoFile = null;
let currentCategory = 'footballeur';
let currentSearchRole = 'FOOT';

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
function memberDisplayName(p) {
    return (p._profile && p._profile.full_name) || p.member_name || 'Membre';
}
function memberDisplayPhoto(p) {
    return (p._profile && p._profile.avatar_url) || p.member_photo_url || null;
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
    if (error || !data) {
        hideLoader();
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    applyRoleTier();
    updateNavbarUI();
    hideLoader();
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
// 12. CHARGEMENT DE MES ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadMyTeams() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('creator_id', currentUser.id)
        .order('created_at', { ascending: false });
    hideLoader();

    if (error) {
        console.error('Erreur chargement équipes:', error.message);
        showToast('Erreur lors du chargement de vos équipes.', 'error');
        return;
    }

    myTeams = data || [];
    const select = document.getElementById('teamSelect');

    if (!myTeams.length) {
        select.innerHTML = '<option value="">Aucune équipe — créez-en une</option>';
        document.getElementById('teamInfo').style.display = 'none';
        document.getElementById('pitchSection').style.display = 'none';
        document.getElementById('encadrementSection').style.display = 'none';
        document.getElementById('benchSection').style.display = 'none';
        document.getElementById('rosterSection').style.display = 'none';
        return;
    }

    select.innerHTML = myTeams.map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
    await selectTeam(myTeams[0].id);
}

// ═══════════════════════════════════════════════════════════
// 13. SÉLECTION D'UNE ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function selectTeam(teamId) {
    currentTeam = myTeams.find(function(t) { return String(t.id) === String(teamId); });
    if (!currentTeam) return;

    isTeamOwner = currentTeam.creator_id === currentUser.id;

    document.getElementById('teamSelect').value = teamId;
    document.getElementById('teamName').textContent = currentTeam.name;
    document.getElementById('teamCategory').textContent = currentTeam.age_category || 'Catégorie non précisée';
    document.getElementById('teamCreated').textContent = currentTeam.created_at ? new Date(currentTeam.created_at).toLocaleDateString('fr-FR') : '—';

    const logoDiv = document.getElementById('teamLogo');
    logoDiv.innerHTML = currentTeam.logo_url ? '<img src="' + currentTeam.logo_url + '" alt="Logo">' : '<i class="fas fa-shield-alt"></i>';

    if (currentTeam.tournament_id) {
        const { data: tournament } = await supabaseClient.from(TBL_TOURNAMENTS).select('name, sport_id').eq('id', currentTeam.tournament_id).maybeSingle();
        document.getElementById('teamTournament').textContent = tournament ? tournament.name : 'Tournoi inconnu';
        if (tournament && tournament.sport_id) {
            const { data: sport } = await supabaseClient.from(TBL_SPORTS).select('name').eq('id', tournament.sport_id).maybeSingle();
            document.getElementById('teamSport').textContent = sport ? sport.name : 'Non précisé';
        }
    }

    document.getElementById('teamInfo').style.display = 'block';
    document.getElementById('editTeamBtn').style.display = isTeamOwner ? 'inline-flex' : 'none';
    document.getElementById('addPlayerBtn').style.display = isTeamOwner ? 'inline-flex' : 'none';
    document.getElementById('rosterSection').style.display = 'block';

    await loadRoster();
}

// ═══════════════════════════════════════════════════════════
// 14. CHARGEMENT DE L'EFFECTIF COMPLET (requêtes séparées)
// ═══════════════════════════════════════════════════════════
async function loadRoster() {
    if (!currentTeam) return;

    const { data: membersData, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, jersey_number, position, position_detail, position_category, is_captain, is_starting, is_coach, member_category, age, height_cm, languages_spoken, member_name, member_photo_url')
        .eq('team_id', currentTeam.id);

    if (error) {
        console.error('Erreur chargement effectif:', error.message);
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Erreur de chargement de l\'effectif.</p>';
        return;
    }

    if (!membersData || membersData.length === 0) {
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Aucun membre dans l\'effectif.</p>';
        document.getElementById('pitchSection').style.display = 'none';
        document.getElementById('encadrementSection').style.display = 'none';
        document.getElementById('benchSection').style.display = 'none';
        return;
    }

    const userIds = membersData.filter(function(p) { return p.user_id; }).map(function(p) { return p.user_id; });
    let profileMap = {};
    if (userIds.length) {
        const { data: profilesData } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', userIds);
        (profilesData || []).forEach(function(p) { profileMap[p.auth_uuid] = p; });
    }
    membersData.forEach(function(p) { p._profile = p.user_id ? (profileMap[p.user_id] || {}) : null; });

    const footballeurs = membersData.filter(function(p) { return (p.member_category || 'footballeur') === 'footballeur'; });
    const encadrement = membersData.filter(function(p) { return (p.member_category || 'footballeur') !== 'footballeur'; });

    renderPitch(footballeurs.filter(function(p) { return p.is_starting; }));
    renderBench(footballeurs.filter(function(p) { return !p.is_starting; }));
    renderEncadrement(encadrement);
    renderFullRoster(membersData);
}

// ═══════════════════════════════════════════════════════════
// 15. VUE TERRAIN (groupée par poste large)
// ═══════════════════════════════════════════════════════════
function playerCard(p) {
    const name = memberDisplayName(p);
    const photo = memberDisplayPhoto(p);
    const avatar = photo ? '<img src="' + photo + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(name) + '</div>';
    return '<div class="pitch-player">' +
           '<div class="pitch-player-avatar">' + avatar + '</div>' +
           '<div class="pitch-player-info">' + (p.jersey_number ? '<span class="pitch-player-num tabular">' + escapeHtml(String(p.jersey_number)) + '.</span> ' : '') + escapeHtml(name) + (p.is_captain ? ' <i class="fas fa-star captain-star" title="Capitaine"></i>' : '') + '</div>' +
           (p.position_detail ? '<div class="pitch-player-pos">' + escapeHtml(p.position_detail) + '</div>' : '') +
           '</div>';
}

function renderPitch(starters) {
    const section = document.getElementById('pitchSection');
    if (!starters.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    ['rowAttaquants', 'rowMilieux', 'rowDefenseurs', 'rowGardien'].forEach(function(id) { document.getElementById(id).innerHTML = ''; });
    starters.forEach(function(p) {
        const category = p.position_category || POSITION_TO_PITCH_GROUP[p.position_detail] || 'Milieu';
        const rowId = POSITION_ROWS[category] || 'rowMilieux';
        const row = document.getElementById(rowId);
        if (row) row.insertAdjacentHTML('beforeend', playerCard(p));
    });
}

// ═══════════════════════════════════════════════════════════
// 16. REMPLAÇANTS (footballeurs hors composition de départ)
// ═══════════════════════════════════════════════════════════
function renderBench(bench) {
    const section = document.getElementById('benchSection');
    const container = document.getElementById('benchList');
    if (!bench.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    container.innerHTML = bench.map(function(p) { return memberItemHtml(p); }).join('');
}

// ═══════════════════════════════════════════════════════════
// 17. ENCADREMENT (technique, médical, direction, entourage —
//     regroupés par catégorie, même niveau de détail que les
//     footballeurs)
// ═══════════════════════════════════════════════════════════
function renderEncadrement(members) {
    const section = document.getElementById('encadrementSection');
    const container = document.getElementById('encadrementList');
    if (!members.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const byCategory = {};
    members.forEach(function(p) {
        const cat = p.member_category || 'technique';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
    });

    let html = '';
    ['technique', 'medical', 'direction', 'entourage'].forEach(function(cat) {
        if (!byCategory[cat] || !byCategory[cat].length) return;
        const catDef = MEMBER_CATEGORIES[cat];
        html += '<div class="encadrement-group">' +
                '<h4 class="encadrement-group-title"><i class="fas ' + catDef.icon + '"></i> ' + escapeHtml(catDef.label) + '</h4>' +
                byCategory[cat].map(function(p) { return memberItemHtml(p); }).join('') +
                '</div>';
    });
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 18. RENDU D'UNE LIGNE MEMBRE (détails complets : âge, taille,
//     langue, poste précis — même gabarit pour toutes catégories)
// ═══════════════════════════════════════════════════════════
function memberItemHtml(p) {
    const name = memberDisplayName(p);
    const photo = memberDisplayPhoto(p);
    const avatar = photo ? '<img src="' + photo + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(name) + '</div>';
    const roleLabel = p.position_detail || (p.member_category === 'footballeur' ? (p.is_starting ? 'Titulaire' : 'Remplaçant') : '');

    const detailBits = [];
    if (roleLabel) detailBits.push('<span>' + escapeHtml(roleLabel) + '</span>');
    if (p.age) detailBits.push('<span><i class="fas fa-birthday-cake"></i> ' + escapeHtml(String(p.age)) + ' ans</span>');
    if (p.height_cm) detailBits.push('<span><i class="fas fa-ruler-vertical"></i> ' + escapeHtml(String(p.height_cm)) + ' cm</span>');
    if (p.languages_spoken) detailBits.push('<span><i class="fas fa-comment"></i> ' + escapeHtml(p.languages_spoken) + '</span>');
    if (p.is_captain) detailBits.push('<span class="captain"><i class="fas fa-star"></i> Capitaine</span>');

    return '<div class="player-item"><div class="player-avatar">' + avatar + '</div>' +
           '<div class="player-info"><div class="player-name">' + (p.jersey_number ? escapeHtml(String(p.jersey_number)) + '. ' : '') + escapeHtml(name) + '</div>' +
           '<div class="player-details">' + detailBits.join('') + '</div></div>' +
           (isTeamOwner ? '<button class="btn-remove-player" onclick="removePlayer(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
}

// ═══════════════════════════════════════════════════════════
// 19. LISTE COMPLÈTE (gestion — tout le monde, toutes catégories)
// ═══════════════════════════════════════════════════════════
function renderFullRoster(members) {
    document.getElementById('playersList').innerHTML = members.map(function(p) { return memberItemHtml(p); }).join('');
}

// ═══════════════════════════════════════════════════════════
// 20. SÉLECTEUR DE CATÉGORIE → PEUPLE LE SÉLECTEUR DE POSTE
// ═══════════════════════════════════════════════════════════
function populateCategorySelect() {
    const select = document.getElementById('memberCategorySelect');
    select.innerHTML = Object.keys(MEMBER_CATEGORIES).map(function(key) {
        return '<option value="' + key + '">' + escapeHtml(MEMBER_CATEGORIES[key].label) + '</option>';
    }).join('');
}

function populatePositionSelect(categoryKey) {
    const category = MEMBER_CATEGORIES[categoryKey];
    const select = document.getElementById('playerPosition');
    let html = '';
    category.groups.forEach(function(g) {
        const opts = g.positions.map(function(pos) {
            if (typeof pos === 'string') return '<option value="' + escapeHtml(pos) + '">' + escapeHtml(pos) + '</option>';
            return '<option value="' + escapeHtml(pos.label) + '" data-search-role="' + escapeHtml(pos.searchRole || '') + '">' + escapeHtml(pos.label) + '</option>';
        }).join('');
        html += g.label ? '<optgroup label="' + escapeHtml(g.label) + '">' + opts + '</optgroup>' : opts;
    });
    select.innerHTML = html;
}

function updateSearchModeForCategory(categoryKey) {
    const category = MEMBER_CATEGORIES[categoryKey];
    const searchSection = document.getElementById('memberSearchSection');
    const freeTextSection = document.getElementById('memberFreeTextSection');

    const firstPositionOpt = document.getElementById('playerPosition').selectedOptions[0];
    const perPositionRole = firstPositionOpt ? firstPositionOpt.dataset.searchRole : null;
    currentSearchRole = perPositionRole || category.searchRole;

    const connectable = !!currentSearchRole;
    searchSection.style.display = connectable ? 'block' : 'none';
    freeTextSection.style.display = connectable ? 'none' : 'block';

    document.getElementById('playerSearchResults').innerHTML = '';
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    selectedPlayerId = null;
    selectedPlayerProfile = null;
}

// ═══════════════════════════════════════════════════════════
// 21. RECHERCHE DE FOOTBALLEUR / MEMBRE (par role_code réel)
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) { document.getElementById('playerSearchResults').innerHTML = ''; return; }
    if (!currentSearchRole) return;

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .eq('role_code', currentSearchRole)
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) { console.error('Erreur recherche:', error.message); return; }

    const resultsDiv = document.getElementById('playerSearchResults');
    if (!data || !data.length) { resultsDiv.innerHTML = '<p class="empty-hint">Aucun footballeur trouvé.</p>'; return; }

    resultsDiv.innerHTML = '';
    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'F') + '</div>';
        item.innerHTML = '<div class="player-avatar">' + avatar + '</div><span class="player-name">' + escapeHtml(profile.full_name || 'Footballeur') + '</span>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            selectedPlayerProfile = profile;
            document.getElementById('playerSearch').value = '';
            resultsDiv.innerHTML = '';
            showSelectedPlayerPreview(profile);
        });
        resultsDiv.appendChild(item);
    });
}

function showSelectedPlayerPreview(profile) {
    const preview = document.getElementById('selectedPlayerPreview');
    const avatarDiv = document.getElementById('selectedPlayerAvatar');
    avatarDiv.innerHTML = profile.avatar_url
        ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
        : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'F') + '</div>';
    document.getElementById('selectedPlayerName').textContent = profile.full_name || 'Footballeur';
    preview.style.display = 'flex';
}

function clearSelectedPlayer() {
    selectedPlayerId = null;
    selectedPlayerProfile = null;
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    document.getElementById('playerSearch').value = '';
}

// ═══════════════════════════════════════════════════════════
// 22. AJOUT / SUPPRESSION D'UN MEMBRE
// ═══════════════════════════════════════════════════════════
async function addPlayer(e) {
    e.preventDefault();
    if (!currentTeam) return;

    const categoryKey = document.getElementById('memberCategorySelect').value;
    const positionDetail = document.getElementById('playerPosition').value;
    const isFootballeur = categoryKey === 'footballeur';
    const connectable = !!currentSearchRole;

    let memberName = null;
    let memberPhotoUrl = null;

    if (connectable) {
        if (!selectedPlayerId) { showToast('Veuillez rechercher et sélectionner un footballeur.', 'warning'); return; }
    } else {
        memberName = document.getElementById('memberFreeTextName').value.trim();
        if (!memberName) { showToast('Veuillez indiquer le nom de la personne.', 'warning'); return; }
        if (selectedMemberPhotoFile) {
            showLoader();
            try { memberPhotoUrl = await uploadTeamLogo(selectedMemberPhotoFile, 'mon-equipe-membre-' + currentTeam.id); }
            catch (err) { hideLoader(); showToast('Erreur envoi photo : ' + err.message, 'error'); return; }
            hideLoader();
        }
    }

    const payload = {
        team_id: currentTeam.id,
        user_id: connectable ? selectedPlayerId : null,
        member_category: categoryKey,
        position_detail: positionDetail || null,
        position: isFootballeur ? positionDetail : null,
        position_category: isFootballeur ? (POSITION_TO_PITCH_GROUP[positionDetail] || 'Milieu') : null,
        jersey_number: isFootballeur && document.getElementById('playerJersey').value ? parseInt(document.getElementById('playerJersey').value, 10) : null,
        is_captain: isFootballeur ? document.getElementById('playerIsCaptain').checked : false,
        is_starting: isFootballeur ? document.getElementById('playerIsStarting').checked : false,
        is_coach: categoryKey === 'technique',
        age: document.getElementById('memberAge').value ? parseInt(document.getElementById('memberAge').value, 10) : null,
        height_cm: document.getElementById('memberHeight').value ? parseInt(document.getElementById('memberHeight').value, 10) : null,
        languages_spoken: document.getElementById('memberLanguages').value.trim() || null,
        member_name: memberName,
        member_photo_url: memberPhotoUrl
    };

    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAM_PLAYERS).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'ajout (peut-être déjà dans l\'équipe) : ' + error.message, 'error');
        return;
    }

    showToast('Ajouté avec succès', 'success');
    closeModal('addPlayerModal');
    resetAddMemberForm();
    await loadRoster();
}

function resetAddMemberForm() {
    document.getElementById('addPlayerForm').reset();
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    document.getElementById('playerSearchResults').innerHTML = '';
    document.getElementById('memberPhotoPreview').innerHTML = '';
    selectedPlayerId = null;
    selectedPlayerProfile = null;
    selectedMemberPhotoFile = null;
}

async function removePlayer(playerId) {
    if (!confirm('Retirer cette personne de l\'équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAM_PLAYERS).delete().eq('id', playerId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); return; }
    showToast('Retiré de l\'équipe', 'info');
    await loadRoster();
}
window.removePlayer = removePlayer;

// ═══════════════════════════════════════════════════════════
// 23. CRÉATION / MODIFICATION D'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTournamentOptions() {
    const { data } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').order('start_date', { ascending: false });
    const select = document.getElementById('teamTournamentInput');
    select.innerHTML = (data || []).map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
}

function openCreateTeamModal() {
    document.getElementById('teamModalTitle').innerHTML = '<i class="fas fa-shield-alt"></i> Créer une équipe';
    document.getElementById('teamForm').reset();
    document.getElementById('teamLogoPreview').innerHTML = '';
    selectedTeamLogoFile = null;
    document.getElementById('teamForm').dataset.mode = 'create';
    openModal('teamModal');
}

function openEditTeamModal() {
    if (!currentTeam) return;
    document.getElementById('teamModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'équipe';
    document.getElementById('teamNameInput').value = currentTeam.name || '';
    document.getElementById('teamAgeCategoryInput').value = currentTeam.age_category || '';
    document.getElementById('teamTournamentInput').value = currentTeam.tournament_id || '';
    document.getElementById('teamLogoPreview').innerHTML = currentTeam.logo_url ? '<img src="' + currentTeam.logo_url + '" alt="Aperçu">' : '';
    selectedTeamLogoFile = null;
    document.getElementById('teamForm').dataset.mode = 'edit';
    openModal('teamModal');
}

async function uploadTeamLogo(file, teamRef) {
    const ext = file.name.split('.').pop();
    const path = teamRef + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

async function saveTeam(e) {
    e.preventDefault();
    const mode = document.getElementById('teamForm').dataset.mode;
    const name = document.getElementById('teamNameInput').value.trim();
    const tournamentId = document.getElementById('teamTournamentInput').value;
    const ageCategory = document.getElementById('teamAgeCategoryInput').value.trim() || null;

    if (!name || !tournamentId) { showToast('Le nom et le tournoi sont requis.', 'warning'); return; }

    showLoader();
    let logoUrl = mode === 'edit' ? currentTeam.logo_url : null;
    if (selectedTeamLogoFile) {
        try { logoUrl = await uploadTeamLogo(selectedTeamLogoFile, 'mon-equipe-' + currentUser.id); }
        catch (err) { hideLoader(); showToast('Erreur envoi logo : ' + err.message, 'error'); return; }
    }

    if (mode === 'create') {
        const { error } = await supabaseClient.from(TBL_TEAMS).insert([{
            tournament_id: tournamentId, name: name, age_category: ageCategory, logo_url: logoUrl, creator_id: currentUser.id
        }]);
        hideLoader();
        if (error) { showToast('Erreur création : ' + error.message, 'error'); return; }
        showToast('Équipe créée !', 'success');
    } else {
        const { error } = await supabaseClient.from(TBL_TEAMS).update({
            name: name, age_category: ageCategory, logo_url: logoUrl, tournament_id: tournamentId
        }).eq('id', currentTeam.id);
        hideLoader();
        if (error) { showToast('Erreur modification : ' + error.message, 'error'); return; }
        showToast('Équipe modifiée', 'success');
    }

    closeModal('teamModal');
    await loadMyTeams();
}

// ═══════════════════════════════════════════════════════════
// 24. MODALES GÉNÉRALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 25. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 26. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    populateCategorySelect();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    document.getElementById('teamSelect')?.addEventListener('change', function() { selectTeam(this.value); });

    document.getElementById('createTeamBtn')?.addEventListener('click', async function() {
        await loadTournamentOptions();
        openCreateTeamModal();
    });
    document.getElementById('editTeamBtn')?.addEventListener('click', async function() {
        await loadTournamentOptions();
        openEditTeamModal();
    });
    document.getElementById('teamForm')?.addEventListener('submit', saveTeam);

    document.getElementById('addPlayerBtn')?.addEventListener('click', function() {
        resetAddMemberForm();
        document.getElementById('memberCategorySelect').value = 'footballeur';
        currentCategory = 'footballeur';
        populatePositionSelect('footballeur');
        updateSearchModeForCategory('footballeur');
        document.getElementById('footballeurOnlyFields').style.display = 'block';
        openModal('addPlayerModal');
    });
    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayer);
    document.getElementById('clearPlayerSelectionBtn')?.addEventListener('click', clearSelectedPlayer);

    document.getElementById('memberCategorySelect')?.addEventListener('change', function() {
        currentCategory = this.value;
        populatePositionSelect(currentCategory);
        updateSearchModeForCategory(currentCategory);
        document.getElementById('footballeurOnlyFields').style.display = currentCategory === 'footballeur' ? 'block' : 'none';
    });
    document.getElementById('playerPosition')?.addEventListener('change', function() {
        updateSearchModeForCategory(currentCategory);
    });

    const playerSearchInput = document.getElementById('playerSearch');
    if (playerSearchInput) {
        let searchTimeout;
        playerSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            searchTimeout = setTimeout(function() { searchPlayers(query); }, 400);
        });
    }

    document.getElementById('teamLogoDropArea')?.addEventListener('click', function() { document.getElementById('teamLogoFile').click(); });
    document.getElementById('teamLogoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedTeamLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('teamLogoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });

    document.getElementById('memberPhotoDropArea')?.addEventListener('click', function() { document.getElementById('memberPhotoFile').click(); });
    document.getElementById('memberPhotoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedMemberPhotoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('memberPhotoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });

    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.querySelector('.close-modal')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.querySelector('.btn-cancel')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    });

    await loadMyTeams();
});
