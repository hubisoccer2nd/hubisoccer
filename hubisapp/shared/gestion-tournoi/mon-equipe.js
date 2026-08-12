/* ============================================================
   HubISoccer — mon-equipe.js
   Système Gestion Tournois — Mon équipe
   ------------------------------------------------------------
   Fichier construit entierement (aucun JS fourni pour cette
   page). Points cles :
   - team.creator_id est desormais REELLEMENT ecrit a la creation
     ici -- jusqu'ici seule sa LECTURE existait (team-details.js,
     avec repli sur l'organisateur du tournoi). Cette page est le
     modele complementaire : un joueur cree et gere SA PROPRE
     equipe, independamment de qui organise le tournoi.
   - Vue terrain : joueurs groupes par position_category
     (Gardien/Defenseur/Milieu/Attaquant), uniquement ceux avec
     is_starting=true. Entraineur (is_coach=true) et remplacants
     (is_starting=false) affiches dans des sections separees,
     conformement aux captures fournies.
   - Recherche de joueur + insertion dans team_players : meme
     principe deja valide sur team-details.js (comptes reels,
     requetes separees, jamais de jointure non verifiee).
   - Logo d'equipe : vrai televersement (reprend gt-team-logos,
     deja cree pour manage-tournament.js).
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
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let myTeams = [];
let currentTeam = null;
let isTeamOwner = false;
let selectedPlayerId = null;
let selectedTeamLogoFile = null;

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
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
// 7. UTILITAIRES
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
// 9. CHARGEMENT DU PROFIL
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
// 10. MISE À JOUR DE LA NAVBAR
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
// 11. CHARGEMENT DE MES ÉQUIPES
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
        document.getElementById('coachSection').style.display = 'none';
        document.getElementById('benchSection').style.display = 'none';
        document.getElementById('rosterSection').style.display = 'none';
        return;
    }

    select.innerHTML = myTeams.map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
    await selectTeam(myTeams[0].id);
}

// ═══════════════════════════════════════════════════════════
// 12. SÉLECTION D'UNE ÉQUIPE
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

    // Tournoi + sport -- requetes separees
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
// 13. CHARGEMENT DE L'EFFECTIF (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadRoster() {
    if (!currentTeam) return;

    const { data: playersData, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, jersey_number, position, is_captain, is_starting, is_coach, position_category')
        .eq('team_id', currentTeam.id);

    if (error) {
        console.error('Erreur chargement effectif:', error.message);
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Erreur de chargement de l\'effectif.</p>';
        return;
    }

    if (!playersData || playersData.length === 0) {
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Aucun joueur dans l\'effectif.</p>';
        document.getElementById('pitchSection').style.display = 'none';
        document.getElementById('coachSection').style.display = 'none';
        document.getElementById('benchSection').style.display = 'none';
        return;
    }

    const userIds = playersData.map(function(p) { return p.user_id; });
    const { data: profilesData } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', userIds);
    const profileMap = {};
    (profilesData || []).forEach(function(p) { profileMap[p.auth_uuid] = p; });

    playersData.forEach(function(p) { p._profile = profileMap[p.user_id] || {}; });

    renderPitch(playersData.filter(function(p) { return !p.is_coach && p.is_starting; }));
    renderCoach(playersData.filter(function(p) { return p.is_coach; }));
    renderBench(playersData.filter(function(p) { return !p.is_coach && !p.is_starting; }));
    renderFullRoster(playersData);
}

// ═══════════════════════════════════════════════════════════
// 14. VUE TERRAIN (groupee par poste)
// ═══════════════════════════════════════════════════════════
function playerCard(p, small) {
    const profile = p._profile || {};
    const avatar = profile.avatar_url
        ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
        : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>';
    return '<div class="pitch-player' + (small ? ' small' : '') + '">' +
           '<div class="pitch-player-avatar">' + avatar + '</div>' +
           '<div class="pitch-player-info">' + (p.jersey_number ? '<span class="pitch-player-num tabular">' + escapeHtml(String(p.jersey_number)) + '.</span> ' : '') + escapeHtml(profile.full_name || 'Joueur') + (p.is_captain ? ' <i class="fas fa-star captain-star" title="Capitaine"></i>' : '') + '</div>' +
           '</div>';
}

function renderPitch(starters) {
    const section = document.getElementById('pitchSection');
    if (!starters.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    Object.values(POSITION_ROWS).forEach(function(rowId) { document.getElementById(rowId).innerHTML = ''; });

    starters.forEach(function(p) {
        const category = p.position_category || 'Milieu';
        const rowId = POSITION_ROWS[category] || 'rowMilieux';
        const row = document.getElementById(rowId);
        if (row) row.insertAdjacentHTML('beforeend', playerCard(p, false));
    });
}

// ═══════════════════════════════════════════════════════════
// 15. ENTRAÎNEUR & REMPLAÇANTS
// ═══════════════════════════════════════════════════════════
function renderCoach(coaches) {
    const section = document.getElementById('coachSection');
    const container = document.getElementById('coachList');
    if (!coaches.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    container.innerHTML = coaches.map(function(c) {
        const profile = c._profile || {};
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'E') + '</div>';
        return '<div class="player-item"><div class="player-avatar">' + avatar + '</div><div class="player-info"><div class="player-name">' + escapeHtml(profile.full_name || 'Entraîneur') + '</div></div>' +
               (isTeamOwner ? '<button class="btn-remove-player" onclick="removePlayer(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
    }).join('');
}

function renderBench(bench) {
    const section = document.getElementById('benchSection');
    const container = document.getElementById('benchList');
    if (!bench.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    container.innerHTML = bench.map(function(p) {
        const profile = p._profile || {};
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>';
        return '<div class="player-item"><div class="player-avatar">' + avatar + '</div><div class="player-info"><div class="player-name">' + (p.jersey_number ? escapeHtml(String(p.jersey_number)) + '. ' : '') + escapeHtml(profile.full_name || 'Joueur') + '</div><div class="player-details">' + (p.position ? '<span>' + escapeHtml(p.position) + '</span>' : '') + '</div></div>' +
               (isTeamOwner ? '<button class="btn-remove-player" onclick="removePlayer(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 16. LISTE COMPLÈTE (gestion)
// ═══════════════════════════════════════════════════════════
function renderFullRoster(players) {
    const container = document.getElementById('playersList');
    container.innerHTML = players.map(function(p) {
        const profile = p._profile || {};
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>';
        const roleTag = p.is_coach ? 'Entraîneur' : (p.is_starting ? 'Titulaire' : 'Remplaçant');
        return '<div class="player-item"><div class="player-avatar">' + avatar + '</div><div class="player-info"><div class="player-name">' + (p.jersey_number ? escapeHtml(String(p.jersey_number)) + '. ' : '') + escapeHtml(profile.full_name || 'Joueur') + '</div><div class="player-details"><span>' + roleTag + '</span>' + (p.position && !p.is_coach ? '<span>' + escapeHtml(p.position) + '</span>' : '') + (p.is_captain ? '<span class="captain"><i class="fas fa-star"></i> Capitaine</span>' : '') + '</div></div>' +
               (isTeamOwner ? '<button class="btn-remove-player" onclick="removePlayer(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 17. RECHERCHE DE JOUEUR
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) { document.getElementById('playerSearchResults').innerHTML = ''; return; }

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) { console.error('Erreur recherche:', error.message); return; }

    const resultsDiv = document.getElementById('playerSearchResults');
    if (!data || !data.length) { resultsDiv.innerHTML = '<p class="empty-hint">Aucun joueur trouvé.</p>'; return; }

    resultsDiv.innerHTML = '';
    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>';
        item.innerHTML = '<div class="player-avatar">' + avatar + '</div><span class="player-name">' + escapeHtml(profile.full_name || 'Joueur') + '</span>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            document.getElementById('playerSearch').value = profile.full_name || '';
            resultsDiv.innerHTML = '';
        });
        resultsDiv.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════
// 18. AJOUT / SUPPRESSION D'UN JOUEUR
// ═══════════════════════════════════════════════════════════
async function addPlayer(e) {
    e.preventDefault();
    if (!selectedPlayerId) { showToast('Veuillez rechercher et sélectionner un joueur.', 'warning'); return; }
    if (!currentTeam) return;

    const isCoach = document.getElementById('playerIsCoach').checked;
    const payload = {
        team_id: currentTeam.id,
        user_id: selectedPlayerId,
        jersey_number: document.getElementById('playerJersey').value ? parseInt(document.getElementById('playerJersey').value, 10) : null,
        position: isCoach ? null : document.getElementById('playerPosition').value,
        position_category: isCoach ? null : document.getElementById('playerPosition').value,
        is_captain: document.getElementById('playerIsCaptain').checked,
        is_starting: document.getElementById('playerIsStarting').checked,
        is_coach: isCoach
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
    document.getElementById('addPlayerForm').reset();
    selectedPlayerId = null;
    await loadRoster();
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
// 19. CRÉATION / MODIFICATION D'ÉQUIPE
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
// 20. MODALES GÉNÉRALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

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
    initUserMenu();
    initSidebar();
    initLogout();

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
        document.getElementById('addPlayerForm').reset();
        document.getElementById('playerSearchResults').innerHTML = '';
        selectedPlayerId = null;
        openModal('addPlayerModal');
    });
    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayer);

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

    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.querySelector('.close-modal')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.querySelector('.btn-cancel')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    });

    await loadMyTeams();
});
