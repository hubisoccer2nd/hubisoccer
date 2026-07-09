/* ============================================================
   HubISoccer — mon-equipe.js
   Gestion des tournois – Page "Mon équipe"
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
// 2. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let userTeams = [];
let selectedTeam = null;
let selectedPlayerId = null; // pour l'ajout d'un joueur trouvé via recherche

// ═══════════════════════════════════════════════════════════
// 3. LOADER
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
// 4. TOAST (30 secondes)
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
// 5. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 6. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    const error = !session;
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 7. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
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
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 8. MISE À JOUR DE LA NAVBAR
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
}

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DES ÉQUIPES DE L'UTILISATEUR
// ═══════════════════════════════════════════════════════════
async function loadUserTeams() {
    // Récupérer les équipes où l'utilisateur est membre (table team_players) ou créateur (via un champ creator_id dans gestionnairetournoi_teams)
    // Pour l'instant, nous utilisons une colonne creator_id que nous allons ajouter à la table gestionnairetournoi_teams
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .select('*')
        .eq('creator_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur chargement équipes:', error);
        showToast('Erreur lors du chargement de vos équipes', 'error');
        return;
    }

    userTeams = data || [];
    populateTeamSelect();
    if (userTeams.length > 0) {
        selectTeam(userTeams[0].id);
    }
}

// ═══════════════════════════════════════════════════════════
// 10. SÉLECTEUR D'ÉQUIPE
// ═══════════════════════════════════════════════════════════
function populateTeamSelect() {
    const select = document.getElementById('teamSelect');
    select.innerHTML = '<option value="">-- Sélectionnez une équipe --</option>';
    userTeams.forEach(function(team) {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        select.appendChild(option);
    });

    if (userTeams.length === 0) {
        select.innerHTML = '<option value="">Aucune équipe trouvée</option>';
    }
}

async function selectTeam(teamId) {
    selectedTeam = userTeams.find(function(t) { return t.id == teamId; });
    if (!selectedTeam) {
        document.getElementById('teamInfo').style.display = 'none';
        document.getElementById('addPlayerBtn').style.display = 'none';
        document.getElementById('editTeamBtn').style.display = 'none';
        document.getElementById('playersList').innerHTML = '<div class="loader"><i class="fas fa-spinner fa-pulse"></i> Chargement...</div>';
        return;
    }

    document.getElementById('teamInfo').style.display = 'flex';
    document.getElementById('addPlayerBtn').style.display = 'inline-flex';
    document.getElementById('editTeamBtn').style.display = 'inline-flex';

    document.getElementById('teamName').textContent = selectedTeam.name;
    document.getElementById('teamCategory').textContent = selectedTeam.age_category || 'Non spécifiée';
    document.getElementById('teamSport').textContent = selectedTeam.sport || 'Non spécifié';
    document.getElementById('teamCreator').textContent = userProfile?.full_name || 'Vous';
    document.getElementById('teamCreated').textContent = selectedTeam.created_at
        ? new Date(selectedTeam.created_at).toLocaleDateString('fr-FR')
        : '-';

    const logoDiv = document.getElementById('teamLogo');
    if (selectedTeam.logo_url) {
        logoDiv.innerHTML = '<img src="' + selectedTeam.logo_url + '" alt="Logo de l\'équipe">';
    } else {
        logoDiv.innerHTML = '<i class="fas fa-users"></i>';
    }

    await loadTeamPlayers(teamId);
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES JOUEURS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamPlayers(teamId) {
    const { data: playersData, error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .select('id, user_id, jersey_number, position, is_captain')
        .eq('team_id', teamId);

    if (error) {
        console.error('Erreur chargement joueurs:', error);
        return;
    }

    if (!playersData || playersData.length === 0) {
        document.getElementById('playersList').innerHTML = '<p style="text-align:center;color:var(--gray);">Aucun joueur dans l\'effectif.</p>';
        return;
    }

    // Récupérer les profils des joueurs
    const userIds = playersData.map(function(p) { return p.user_id; });
    const { data: profilesData } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, full_name, avatar_url, position')
        .in('auth_uuid', userIds);

    const profileMap = {};
    if (profilesData) {
        profilesData.forEach(function(profile) {
            profileMap[profile.auth_uuid] = profile;
        });
    }

    const playersListDiv = document.getElementById('playersList');
    playersListDiv.innerHTML = '';

    playersData.forEach(function(player) {
        const profile = profileMap[player.user_id] || {};
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-info">' +
                '<div class="player-name">' + (profile.full_name || 'Joueur inconnu') + '</div>' +
                '<div class="player-details">' +
                    (player.jersey_number ? '<span class="jersey">#' + player.jersey_number + '</span>' : '') +
                    (player.position ? '<span class="position">' + player.position + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<button class="btn-remove-player" data-player-id="' + player.id + '">' +
                '<i class="fas fa-trash"></i> Retirer' +
            '</button>';
        playersListDiv.appendChild(playerDiv);
    });

    // Attacher les événements de suppression
    document.querySelectorAll('.btn-remove-player').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removePlayerFromTeam(btn.dataset.playerId);
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 12. CRÉATION / ÉDITION D'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadSportsListForSelect() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_sports')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Erreur chargement sports:', error);
        return;
    }

    const select = document.getElementById('teamSportInput');
    select.innerHTML = '<option value="">Sélectionnez un sport</option>';
    data.forEach(function(sport) {
        const option = document.createElement('option');
        option.value = sport.name;
        option.textContent = sport.name;
        select.appendChild(option);
    });
}

function openTeamModal(team = null) {
    if (team) {
        document.getElementById('teamModalTitle').textContent = 'Modifier l\'équipe';
        document.getElementById('teamNameInput').value = team.name || '';
        document.getElementById('teamAgeCategoryInput').value = team.age_category || '';
        document.getElementById('teamLogoInput').value = team.logo_url || '';
        document.getElementById('teamSportInput').value = team.sport || '';
    } else {
        document.getElementById('teamModalTitle').textContent = 'Créer une équipe';
        document.getElementById('teamForm').reset();
    }
    document.getElementById('teamModal').style.display = 'flex';
}

function closeTeamModal() {
    document.getElementById('teamModal').style.display = 'none';
}

async function saveTeam(event) {
    event.preventDefault();

    const name = document.getElementById('teamNameInput').value.trim();
    const ageCategory = document.getElementById('teamAgeCategoryInput').value.trim();
    const logoUrl = document.getElementById('teamLogoInput').value.trim();
    const sport = document.getElementById('teamSportInput').value;

    if (!name) {
        showToast('Le nom de l\'équipe est obligatoire', 'warning');
        return;
    }

    const payload = {
        name: name,
        age_category: ageCategory || null,
        logo_url: logoUrl || null,
        sport: sport || null,
        creator_id: currentUser.id,
        updated_at: new Date().toISOString()
    };

    showLoader();
    let error;
    if (selectedTeam && document.getElementById('teamModalTitle').textContent.includes('Modifier')) {
        // Mise à jour
        const { error: updateError } = await supabaseClient
            .from('gestionnairetournoi_teams')
            .update(payload)
            .eq('id', selectedTeam.id);
        error = updateError;
    } else {
        // Création
        payload.created_at = new Date().toISOString();
        const { error: insertError } = await supabaseClient
            .from('gestionnairetournoi_teams')
            .insert([payload]);
        error = insertError;
    }
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'enregistrement de l\'équipe', 'error');
        console.error(error);
        return;
    }

    showToast('Équipe enregistrée avec succès', 'success');
    closeTeamModal();
    await loadUserTeams();
}

// ═══════════════════════════════════════════════════════════
// 13. AJOUT DE JOUEUR
// ═══════════════════════════════════════════════════════════
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.getElementById('playerSearch').value = '';
    document.getElementById('playerSearchResults').innerHTML = '';
    selectedPlayerId = null;
    document.getElementById('addPlayerModal').style.display = 'flex';
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

async function searchPlayers(query) {
    if (!query || query.length < 2) {
        document.getElementById('playerSearchResults').innerHTML = '';
        return;
    }

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, full_name, avatar_url, position')
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) {
        console.error('Erreur recherche joueurs:', error);
        return;
    }

    const resultsDiv = document.getElementById('playerSearchResults');
    resultsDiv.innerHTML = '';

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p>Aucun joueur trouvé.</p>';
        return;
    }

    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-name">' + (profile.full_name || 'Joueur inconnu') + '</div>' +
            '<div class="player-position">' + (profile.position || '') + '</div>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            document.getElementById('playerSearch').value = profile.full_name || '';
            resultsDiv.innerHTML = '';
            showToast('Joueur sélectionné : ' + profile.full_name, 'success');
        });
        resultsDiv.appendChild(item);
    });
}

async function addPlayerToTeam(event) {
    event.preventDefault();

    if (!selectedPlayerId) {
        showToast('Veuillez rechercher et sélectionner un joueur', 'warning');
        return;
    }

    if (!selectedTeam) {
        showToast('Veuillez d\'abord sélectionner une équipe', 'warning');
        return;
    }

    const jersey = document.getElementById('playerJersey').value.trim();
    const position = document.getElementById('playerPosition').value.trim();
    const isCaptain = document.getElementById('playerIsCaptain').checked;

    const payload = {
        team_id: selectedTeam.id,
        user_id: selectedPlayerId,
        jersey_number: jersey || null,
        position: position || null,
        is_captain: isCaptain || false,
        created_at: new Date().toISOString()
    };

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'ajout du joueur (peut-être déjà dans l\'équipe)', 'error');
        console.error(error);
        return;
    }

    showToast('Joueur ajouté avec succès', 'success');
    closeAddPlayerModal();
    await loadTeamPlayers(selectedTeam.id);
}

// ═══════════════════════════════════════════════════════════
// 14. SUPPRESSION D'UN JOUEUR DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function removePlayerFromTeam(playerId) {
    if (!confirm('Retirer ce joueur de l\'équipe ?')) return;

    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_team_players')
        .delete()
        .eq('id', playerId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la suppression du joueur', 'error');
        console.error(error);
        return;
    }

    showToast('Joueur retiré de l\'équipe', 'info');
    await loadTeamPlayers(selectedTeam.id);
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 16. INITIALISATION
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

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    await loadSportsListForSelect();
    await loadUserTeams();

    // Événements
    document.getElementById('teamSelect')?.addEventListener('change', function() {
        selectTeam(this.value);
    });

    document.getElementById('createTeamBtn')?.addEventListener('click', function() {
        openTeamModal(null);
    });

    document.getElementById('editTeamBtn')?.addEventListener('click', function() {
        openTeamModal(selectedTeam);
    });

    document.getElementById('teamForm')?.addEventListener('submit', saveTeam);

    document.querySelectorAll('#teamModal .close-modal, #teamModal .btn-cancel').forEach(function(el) {
        el.addEventListener('click', closeTeamModal);
    });

    document.getElementById('addPlayerBtn')?.addEventListener('click', openAddPlayerModal);

    document.querySelectorAll('#addPlayerModal .close-modal, #addPlayerModal .btn-cancel').forEach(function(el) {
        el.addEventListener('click', closeAddPlayerModal);
    });

    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayerToTeam);

    const playerSearchInput = document.getElementById('playerSearch');
    if (playerSearchInput) {
        let searchTimeout;
        playerSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            searchTimeout = setTimeout(function() {
                searchPlayers(query);
            }, 400);
        });
    }
});