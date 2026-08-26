/* ============================================================
   HubISoccer — invite-participants.js
   Système Gestion Tournois — Inviter des participants
   ------------------------------------------------------------
   Correction de LOGIQUE (pas seulement technique) :
   loadPlayers() interrogeait gt_participants -- c'est-a-dire
   les personnes DEJA inscrites a ce tournoi -- avec un bouton
   "Inviter" dessus. Ca n'a aucun sens pour une page dont le but
   est d'aller chercher de NOUVELLES personnes : un organisateur
   ne pouvait jamais inviter quelqu'un qui n'avait pas deja
   candidate lui-meme. Reecrite pour chercher parmi TOUS les
   footballeurs de la plateforme (role_code='FOOT'), en excluant
   ceux deja participants a ce tournoi.
   ------------------------------------------------------------
   Autres corrections :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Jointure imbriquee (participants -> profiles !inner) --
     meme classe de risque que l'incident sur manage-tournament
     -- convertie en requetes separees.
   - Logo d'equipe en URL texte -> vrai televersement (reprend
     le bucket gt-team-logos deja cree).
   - Routage dynamique profil/parametres + niveaux de sidebar.
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
const TBL_TEAMS          = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS      = 'supabaseAuthPrive_gt_team_players';
const TBL_PARTICIPANTS         = 'supabaseAuthPrive_gt_participants';
const TBL_PROFILES                = 'supabaseAuthPrive_profiles';
const LOGO_BUCKET                    = 'gt-team-logos';

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
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournamentId = null;
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
// 11. INFOS DU TOURNOI
// ═══════════════════════════════════════════════════════════
async function loadTournamentInfo() {
    const params = new URLSearchParams(window.location.search);
    currentTournamentId = params.get('tournament_id');
    if (!currentTournamentId) {
        document.getElementById('tournamentName').textContent = 'Aucun tournoi sélectionné';
        document.getElementById('noTournamentWarning').style.display = 'flex';
        return;
    }
    const { data } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('name, start_date, end_date')
        .eq('id', currentTournamentId)
        .maybeSingle();
    if (data) {
        document.getElementById('tournamentName').textContent = data.name;
        document.getElementById('tournamentDetails').textContent =
            new Date(data.start_date).toLocaleDateString('fr-FR') + ' — ' + new Date(data.end_date).toLocaleDateString('fr-FR');
    }
}

// ═══════════════════════════════════════════════════════════
// 12. ÉQUIPES DU TOURNOI
// ═══════════════════════════════════════════════════════════
async function loadTeams(searchTerm) {
    if (!currentTournamentId) return;
    let query = supabaseClient.from(TBL_TEAMS).select('*').eq('tournament_id', currentTournamentId);
    if (searchTerm) query = query.ilike('name', '%' + searchTerm + '%');
    const { data, error } = await query;
    if (error) { showToast('Erreur chargement équipes', 'error'); return; }

    const container = document.getElementById('teamsList');
    if (!data || data.length === 0) { container.innerHTML = '<p class="empty-hint">Aucune équipe trouvée.</p>'; return; }

    container.innerHTML = data.map(function(team) {
        return '<div class="item-card">' +
               '<div class="item-avatar">' + (team.logo_url ? '<img src="' + team.logo_url + '" alt="">' : '<span class="avatar-initials-small">' + getInitials(team.name) + '</span>') + '</div>' +
               '<div class="item-info"><div class="item-name">' + escapeHtml(team.name) + '</div><div class="item-detail">Équipe</div></div>' +
               '<button class="btn-invite" onclick="inviteTeam(\'' + team.id + '\')"><i class="fas fa-plus"></i> Inviter</button>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 13. FOOTBALLEURS DE LA PLATEFORME (correction de logique)
// ------------------------------------------------------------
// Cherche parmi TOUS les footballeurs (role_code='FOOT'), pas
// parmi les participants deja inscrits. Exclut ceux deja
// candidats a ce tournoi -- deux requetes separees plutot
// qu'une jointure imbriquee, meme discipline que le reste.
// ═══════════════════════════════════════════════════════════
async function loadPlayers(searchTerm) {
    if (!currentTournamentId) return;

    if (!searchTerm || searchTerm.trim().length < 2) {
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Commencez à taper un nom pour rechercher.</p>';
        return;
    }

    // Deja participants a ce tournoi -- a exclure des resultats
    const { data: existingParticipants } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('user_id')
        .eq('tournament_id', currentTournamentId);
    const excludedIds = new Set((existingParticipants || []).map(function(p) { return p.user_id; }));

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url, role_code, hubisoccer_id')
        .eq('role_code', 'FOOT')
        .or('full_name.ilike.%' + searchTerm.trim() + '%,hubisoccer_id.ilike.%' + searchTerm.trim() + '%')
        .limit(20);

    if (error) { showToast('Erreur recherche footballeurs', 'error'); return; }

    const results = (data || []).filter(function(p) { return !excludedIds.has(p.auth_uuid); });

    const container = document.getElementById('playersList');
    if (!results.length) { container.innerHTML = '<p class="empty-hint">Aucun footballeur trouvé (ou déjà candidat à ce tournoi).</p>'; return; }

    container.innerHTML = results.map(function(p) {
        return '<div class="item-card">' +
               '<div class="item-avatar">' + (p.avatar_url ? '<img src="' + p.avatar_url + '" alt="">' : '<span class="avatar-initials-small">' + getInitials(p.full_name || '?') + '</span>') + '</div>' +
               '<div class="item-info"><div class="item-name">' + escapeHtml(p.full_name || 'Inconnu') + '</div><div class="item-detail">Footballeur</div></div>' +
               '<button class="btn-invite" onclick="invitePlayer(\'' + p.auth_uuid + '\')"><i class="fas fa-plus"></i> Inviter</button>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 14. INVITATIONS ENVOYÉES (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadInvitations() {
    if (!currentTournamentId) return;
    const { data, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('user_id, status, created_at')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });
    if (error) { showToast('Erreur chargement invitations', 'error'); return; }

    const container = document.getElementById('invitationsList');
    if (!data || data.length === 0) { container.innerHTML = '<p class="empty-hint">Aucune invitation envoyée.</p>'; return; }

    const userIds = [...new Set(data.map(function(inv) { return inv.user_id; }))];
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', userIds);
    const nameMap = {};
    (profiles || []).forEach(function(p) { nameMap[p.auth_uuid] = p.full_name; });

    const statusLabels = { approved: 'Acceptée', pending: 'En attente', rejected: 'Refusée' };
    container.innerHTML = data.map(function(inv) {
        return '<div class="item-card">' +
               '<div class="item-info"><div class="item-name">' + escapeHtml(nameMap[inv.user_id] || 'Inconnu') + '</div>' +
               '<div class="item-detail">' + (statusLabels[inv.status] || inv.status) + ' — ' + new Date(inv.created_at).toLocaleDateString('fr-FR') + '</div></div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. CRÉER UNE ÉQUIPE (vrai téléversement du logo)
// ═══════════════════════════════════════════════════════════
async function uploadTeamLogo(file) {
    const ext = file.name.split('.').pop();
    const path = currentTournamentId + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

async function createTeam(e) {
    e.preventDefault();
    if (!currentTournamentId) return;
    const name = document.getElementById('teamName').value.trim();
    const ageCategory = document.getElementById('teamAgeCategory').value.trim();
    if (!name) { showToast('Veuillez saisir un nom.', 'warning'); return; }

    showLoader();
    let logoUrl = null;
    if (selectedTeamLogoFile) {
        try { logoUrl = await uploadTeamLogo(selectedTeamLogoFile); }
        catch (err) { hideLoader(); showToast('Erreur envoi logo : ' + err.message, 'error'); return; }
    }

    const { error } = await supabaseClient
        .from(TBL_TEAMS)
        .insert([{ tournament_id: currentTournamentId, name: name, age_category: ageCategory || null, logo_url: logoUrl, creator_id: currentUser.id }]);
    hideLoader();

    if (error) {
        showToast('Erreur création équipe : ' + error.message, 'error');
    } else {
        showToast('Équipe créée !', 'success');
        closeModal('createTeamModal');
        document.getElementById('createTeamForm').reset();
        document.getElementById('teamLogoPreview').innerHTML = '';
        selectedTeamLogoFile = null;
        loadTeams('');
    }
}

// ═══════════════════════════════════════════════════════════
// 16. INVITER UN FOOTBALLEUR / UNE ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function invitePlayer(playerId) {
    if (!currentTournamentId) return;
    showLoader();
    const { error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .upsert([{ tournament_id: currentTournamentId, user_id: playerId, status: 'pending' }], { onConflict: 'tournament_id, user_id' });
    hideLoader();
    if (error) {
        showToast('Erreur invitation : ' + error.message, 'error');
    } else {
        showToast('Invitation envoyée !', 'success');
        loadPlayers(document.getElementById('playerSearch').value);
        loadInvitations();
    }
}
window.invitePlayer = invitePlayer;

async function inviteTeam(teamId) {
    const { data: members } = await supabaseClient.from(TBL_TEAM_PLAYERS).select('user_id').eq('team_id', teamId);
    if (!members || members.length === 0) {
        showToast('Cette équipe n\'a pas de joueurs.', 'warning');
        return;
    }
    showLoader();
    const inserts = members.map(function(m) { return { tournament_id: currentTournamentId, user_id: m.user_id, status: 'pending' }; });
    const { error } = await supabaseClient.from(TBL_PARTICIPANTS).upsert(inserts, { onConflict: 'tournament_id, user_id' });
    hideLoader();
    if (error) { showToast('Erreur invitation équipe : ' + error.message, 'error'); }
    else { showToast('Équipe invitée !', 'success'); loadInvitations(); }
}
window.inviteTeam = inviteTeam;

// ═══════════════════════════════════════════════════════════
// 17. MODALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 18. ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            if (btn.dataset.tab === 'teams') loadTeams('');
            else if (btn.dataset.tab === 'invitations') loadInvitations();
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 19. UI : SIDEBAR, MENU, DÉCONNEXION
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
    function open() { sidebar?.classList.add('active'); overlay?.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { sidebar?.classList.remove('active'); overlay?.classList.remove('active'); document.body.style.overflow = ''; }
    menuBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) open(); else if (dx < 0) close();
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
// 20. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournamentInfo();
    await loadTeams('');

    document.getElementById('teamSearch')?.addEventListener('input', function() { loadTeams(this.value); });

    let playerSearchTimeout;
    document.getElementById('playerSearch')?.addEventListener('input', function() {
        clearTimeout(playerSearchTimeout);
        const value = this.value;
        playerSearchTimeout = setTimeout(function() { loadPlayers(value); }, 400);
    });

    document.getElementById('createTeamBtn')?.addEventListener('click', function() { openModal('createTeamModal'); });
    document.getElementById('createTeamForm')?.addEventListener('submit', createTeam);
    document.getElementById('closeTeamModal')?.addEventListener('click', function() { closeModal('createTeamModal'); });
    document.getElementById('cancelTeamBtn')?.addEventListener('click', function() { closeModal('createTeamModal'); });
    document.getElementById('createTeamModal')?.addEventListener('click', function(e) { if (e.target === this) closeModal('createTeamModal'); });

    document.getElementById('teamLogoDropArea')?.addEventListener('click', function() { document.getElementById('teamLogoFile').click(); });
    document.getElementById('teamLogoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedTeamLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('teamLogoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });
});
