/* ============================================================
   HubISoccer — transfer-request.js
   Système Gestion Tournois — Demande de transfert
   ------------------------------------------------------------
   Logique de fond deja saine (aucune jointure imbriquee risquee,
   requetes deja separees et fusionnees en JS). Corrections :
   tables migrees vers supabaseAuthPrive_gt_*, terminologie
   footballeur (pas "joueur"), routage dynamique profil/parametres
   + niveaux de sidebar ajoutes.
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
const TBL_TEAMS       = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS   = 'supabaseAuthPrive_gt_team_players';
const TBL_TRANSFERS         = 'supabaseAuthPrive_gt_transfer_requests';
const TBL_PROFILES             = 'supabaseAuthPrive_profiles';

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
let userTeams = [];
let allTeams = [];
let playersMap = {};

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
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION & PROFIL
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

async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) { showToast('Erreur chargement profil', 'error'); return null; }
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

function updateNavbarUI() {
    if (!userProfile) return;
    document.getElementById('userName').textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (avatarUrl) {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DES DONNÉES
// ═══════════════════════════════════════════════════════════
async function loadUserTeamsAndPlayers() {
    const { data: teams, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('creator_id', currentUser.id)
        .order('name');

    if (error) { console.error('Erreur chargement équipes:', error); return; }

    userTeams = teams || [];
    const teamIds = userTeams.map(t => t.id);
    if (teamIds.length === 0) return;

    const { data: players, error: playersError } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('user_id, team_id')
        .in('team_id', teamIds);

    if (playersError) { console.error('Erreur chargement effectif:', playersError); return; }

    const userIds = [...new Set(players.map(p => p.user_id))];
    const { data: profiles } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name')
        .in('auth_uuid', userIds);

    const profileMap = {};
    if (profiles) profiles.forEach(p => { profileMap[p.auth_uuid] = p.full_name || 'Inconnu'; });

    playersMap = {};
    players.forEach(p => {
        const team = userTeams.find(t => t.id === p.team_id);
        playersMap[p.user_id] = {
            name: profileMap[p.user_id] || 'Footballeur inconnu',
            fromTeamId: p.team_id,
            fromTeamName: team ? team.name : 'Équipe inconnue'
        };
    });

    populatePlayerSelect();
}

function populatePlayerSelect() {
    const select = document.getElementById('playerSelect');
    select.innerHTML = '<option value="">Sélectionnez votre footballeur</option>';
    Object.keys(playersMap).forEach(userId => {
        const player = playersMap[userId];
        const option = document.createElement('option');
        option.value = userId;
        option.textContent = player.name + ' (' + player.fromTeamName + ')';
        option.dataset.fromTeamId = player.fromTeamId;
        option.dataset.fromTeamName = player.fromTeamName;
        select.appendChild(option);
    });
}

async function loadAllTeams() {
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .order('name');

    if (error) { console.error('Erreur chargement de toutes les équipes:', error); return; }

    allTeams = data || [];
    populateTargetTeamSelect();
}

function populateTargetTeamSelect() {
    const select = document.getElementById('targetTeamSelect');
    select.innerHTML = '<option value="">Sélectionnez une équipe</option>';
    allTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        select.appendChild(option);
    });
}

// ═══════════════════════════════════════════════════════════
// 10. GESTION DU FORMULAIRE DE DEMANDE
// ═══════════════════════════════════════════════════════════
async function submitTransferRequest(event) {
    event.preventDefault();

    const playerId = document.getElementById('playerSelect').value;
    const targetTeamId = document.getElementById('targetTeamSelect').value;
    const reason = document.getElementById('transferReason').value.trim();

    if (!playerId || !targetTeamId) {
        showToast('Veuillez sélectionner un footballeur et une équipe de destination', 'warning');
        return;
    }

    const player = playersMap[playerId];
    if (!player) return;

    if (player.fromTeamId == targetTeamId) {
        showToast('Ce footballeur est déjà dans cette équipe', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TRANSFERS)
        .insert([{
            player_id: playerId,
            from_team_id: player.fromTeamId,
            to_team_id: targetTeamId,
            reason: reason || null,
            status: 'pending',
            requested_by: currentUser.id
        }]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'envoi de la demande', 'error');
        console.error(error);
        return;
    }

    showToast('Demande de transfert envoyée avec succès', 'success');
    document.getElementById('transferForm').reset();
    document.getElementById('currentTeamDisplay').value = '';
    loadMyRequests();
}

// ═══════════════════════════════════════════════════════════
// 11. AFFICHAGE DES DEMANDES
// ═══════════════════════════════════════════════════════════
async function loadMyRequests() {
    const listDiv = document.getElementById('myRequestsList');
    listDiv.innerHTML = '<div class="loader-inline"><i class="fas fa-spinner fa-pulse"></i> Chargement…</div>';

    const { data, error } = await supabaseClient
        .from(TBL_TRANSFERS)
        .select('*')
        .eq('requested_by', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        listDiv.innerHTML = '<p class="empty-hint">Erreur de chargement</p>';
        return;
    }
    if (!data || data.length === 0) {
        listDiv.innerHTML = '<p class="empty-hint">Aucune demande de transfert</p>';
        return;
    }

    const teamIds = [...new Set([...data.map(r => r.from_team_id), ...data.map(r => r.to_team_id)].filter(Boolean))];
    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', teamIds);
    const teamNameMap = {};
    if (teams) teams.forEach(t => { teamNameMap[t.id] = t.name; });

    const userIds = [...new Set(data.map(r => r.player_id))];
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', userIds);
    const profileMap = {};
    if (profiles) profiles.forEach(p => { profileMap[p.auth_uuid] = p.full_name || 'Inconnu'; });

    listDiv.innerHTML = '';
    data.forEach(req => {
        const card = document.createElement('div');
        card.className = 'request-card';
        const statusLabels = { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' };
        const statusClass = req.status === 'approved' ? 'approved' : (req.status === 'rejected' ? 'rejected' : 'pending');
        card.innerHTML =
            '<div class="request-header">' +
                '<span class="player-name">' + escapeHtml(profileMap[req.player_id] || 'Footballeur inconnu') + '</span>' +
                '<span class="request-status ' + statusClass + '">' + (statusLabels[req.status] || req.status) + '</span>' +
            '</div>' +
            '<div class="request-teams">' +
                '<span>' + escapeHtml(teamNameMap[req.from_team_id] || 'Équipe inconnue') + '</span>' +
                '<i class="fas fa-arrow-right"></i>' +
                '<span>' + escapeHtml(teamNameMap[req.to_team_id] || 'Équipe inconnue') + '</span>' +
            '</div>' +
            (req.reason ? '<div class="request-reason">' + escapeHtml(req.reason) + '</div>' : '') +
            '<div class="request-date">Demandé le ' + new Date(req.created_at).toLocaleDateString('fr-FR') + '</div>';
        listDiv.appendChild(card);
    });
}

async function loadPendingRequests() {
    const listDiv = document.getElementById('pendingRequestsList');
    listDiv.innerHTML = '<div class="loader-inline"><i class="fas fa-spinner fa-pulse"></i> Chargement…</div>';

    const { data, error } = await supabaseClient
        .from(TBL_TRANSFERS)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        listDiv.innerHTML = '<p class="empty-hint">Erreur de chargement</p>';
        return;
    }
    if (!data || data.length === 0) {
        listDiv.innerHTML = '<p class="empty-hint">Aucune demande en attente</p>';
        return;
    }

    const teamIds = [...new Set([...data.map(r => r.from_team_id), ...data.map(r => r.to_team_id)].filter(Boolean))];
    const { data: teams } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', teamIds);
    const teamNameMap = {};
    if (teams) teams.forEach(t => { teamNameMap[t.id] = t.name; });

    const userIds = [...new Set(data.map(r => r.player_id))];
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', userIds);
    const profileMap = {};
    if (profiles) profiles.forEach(p => { profileMap[p.auth_uuid] = p.full_name || 'Inconnu'; });

    listDiv.innerHTML = '';
    data.forEach(req => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-header">' +
                '<span class="player-name">' + escapeHtml(profileMap[req.player_id] || 'Footballeur inconnu') + '</span>' +
            '</div>' +
            '<div class="request-teams">' +
                '<span>' + escapeHtml(teamNameMap[req.from_team_id] || 'Équipe inconnue') + '</span>' +
                '<i class="fas fa-arrow-right"></i>' +
                '<span>' + escapeHtml(teamNameMap[req.to_team_id] || 'Équipe inconnue') + '</span>' +
            '</div>' +
            (req.reason ? '<div class="request-reason">' + escapeHtml(req.reason) + '</div>' : '') +
            '<div class="request-date">Demandé le ' + new Date(req.created_at).toLocaleDateString('fr-FR') + '</div>' +
            '<div class="request-actions">' +
                '<button class="btn-approve" data-id="' + req.id + '"><i class="fas fa-check"></i> Approuver</button>' +
                '<button class="btn-reject" data-id="' + req.id + '"><i class="fas fa-times"></i> Rejeter</button>' +
            '</div>';
        listDiv.appendChild(card);
    });

    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => handleTransferDecision(btn.dataset.id, 'approved'));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => handleTransferDecision(btn.dataset.id, 'rejected'));
    });
}

async function handleTransferDecision(requestId, newStatus) {
    showLoader();
    const { data: request } = await supabaseClient
        .from(TBL_TRANSFERS)
        .select('*')
        .eq('id', requestId)
        .single();

    if (!request) {
        hideLoader();
        showToast('Demande introuvable', 'error');
        return;
    }

    if (newStatus === 'approved') {
        if (request.from_team_id) {
            await supabaseClient
                .from(TBL_TEAM_PLAYERS)
                .delete()
                .eq('team_id', request.from_team_id)
                .eq('user_id', request.player_id);
        }
        if (request.to_team_id) {
            const { error: insertError } = await supabaseClient
                .from(TBL_TEAM_PLAYERS)
                .insert([{
                    team_id: request.to_team_id,
                    user_id: request.player_id
                }]);
            if (insertError) {
                hideLoader();
                showToast('Erreur lors du transfert du footballeur', 'error');
                return;
            }
        }
    }

    const { error } = await supabaseClient
        .from(TBL_TRANSFERS)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

    hideLoader();

    if (error) {
        showToast('Erreur lors de la mise à jour', 'error');
        return;
    }

    showToast('Demande ' + (newStatus === 'approved' ? 'approuvée' : 'rejetée'), 'success');
    loadPendingRequests();
}

// ═══════════════════════════════════════════════════════════
// 12. UI (sidebar, menu, tabs, logout)
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

function initUI() {
    initTabs();
    document.getElementById('playerSelect')?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const fromTeamName = selectedOption.dataset?.fromTeamName || '';
        document.getElementById('currentTeamDisplay').value = fromTeamName;
    });
    document.getElementById('backBtn')?.addEventListener('click', () => window.history.back());
    document.getElementById('transferForm')?.addEventListener('submit', submitTransferRequest);
}

function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
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
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) open(); else if (dx < 0) close();
    }, { passive: false });
}
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            supabaseClient.auth.signOut().then(() => window.location.href = '../../../index.html');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 13. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    initUI();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadUserTeamsAndPlayers();
    await loadAllTeams();
    await loadMyRequests();
    await loadPendingRequests();
});
