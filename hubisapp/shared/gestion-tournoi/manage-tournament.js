/* ============================================================
   HubISoccer — manage-tournament.js
   Gestion d'un tournoi (infos, inscriptions, équipes, matchs, rapports, primes)
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
let currentTournamentId = null;
let currentTournament = null;
let allTeams = [];

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
}

// ═══════════════════════════════════════════════════════════
// 9. RÉCUPÉRATION DE L'ID DU TOURNOI DEPUIS L'URL
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DU TOURNOI
// ═══════════════════════════════════════════════════════════
async function loadTournament() {
    currentTournamentId = getTournamentIdFromURL();
    if (!currentTournamentId) {
        showToast('Aucun tournoi spécifié.', 'error');
        window.location.href = 'acceuil.html';
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('*, sport:gestionnairetournoi_sports(name), type:gestionnairetournoi_types(name, label)')
        .eq('id', currentTournamentId)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Tournoi introuvable.', 'error');
        window.location.href = 'acceuil.html';
        return;
    }
    currentTournament = data;
    // Mettre à jour le titre
    document.getElementById('tournamentName').textContent = data.name || 'Gestion du tournoi';
    // Remplir l'onglet Infos
    fillInfoTab(data);
    // Charger les autres onglets
    loadRegistrations();
    loadTeams();
    loadMatches();
    loadReports();
    loadPrizes();
}

// ═══════════════════════════════════════════════════════════
// 11. REMPLIR L'ONGLET INFOS
// ═══════════════════════════════════════════════════════════
function fillInfoTab(t) {
    document.getElementById('infoName').textContent = t.name || '-';
    document.getElementById('infoDates').textContent = (t.start_date ? new Date(t.start_date).toLocaleDateString('fr-FR') : '?') + ' - ' + (t.end_date ? new Date(t.end_date).toLocaleDateString('fr-FR') : '?');
    document.getElementById('infoLocation').textContent = t.location || '-';
    document.getElementById('infoSport').textContent = t.sport?.name || '-';
    document.getElementById('infoType').textContent = t.type?.label || t.type?.name || '-';
    document.getElementById('infoPrize').textContent = t.prize_pool ? t.prize_pool.toLocaleString() + ' FCFA' : '-';
    document.getElementById('infoDescription').textContent = t.description || '-';
}

// ═══════════════════════════════════════════════════════════
// 12. ONGLET INSCRIPTIONS (pending / approved)
// ═══════════════════════════════════════════════════════════
async function loadRegistrations() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_participants')
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur inscriptions:', error);
        return;
    }

    const pending = data.filter(function(r) { return r.status === 'pending'; });
    const approved = data.filter(function(r) { return r.status === 'approved'; });

    renderPendingRegistrations(pending);
    renderApprovedRegistrations(approved);
}

async function approveRegistration(registrationId) {
    const { error } = await supabaseClient
        .from('gestionnairetournoi_participants')
        .update({ status: 'approved' })
        .eq('id', registrationId);
    if (error) {
        showToast('Erreur lors de l\'approbation', 'error');
    } else {
        showToast('Inscription approuvée', 'success');
        loadRegistrations();
    }
}

async function rejectRegistration(registrationId) {
    const { error } = await supabaseClient
        .from('gestionnairetournoi_participants')
        .update({ status: 'rejected' })
        .eq('id', registrationId);
    if (error) {
        showToast('Erreur lors du rejet', 'error');
    } else {
        showToast('Inscription rejetée', 'warning');
        loadRegistrations();
    }
}

function renderPendingRegistrations(list) {
    const container = document.getElementById('pendingRegistrationsList');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<p>Aucune demande en attente.</p>';
        return;
    }
    let html = '';
    list.forEach(function(r) {
        html += '<div class="registration-item">' +
                '<span>Joueur ID: ' + r.user_id + '</span>' +
                '<span>Équipe: ' + (r.team_name || '-') + '</span>' +
                '<div class="actions">' +
                '<button class="btn-approve" onclick="approveRegistration(\'' + r.id + '\')"><i class="fas fa-check"></i> Approuver</button>' +
                '<button class="btn-reject" onclick="rejectRegistration(\'' + r.id + '\')"><i class="fas fa-times"></i> Rejeter</button>' +
                '</div>' +
                '</div>';
    });
    container.innerHTML = html;
}

function renderApprovedRegistrations(list) {
    const container = document.getElementById('approvedRegistrationsList');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<p>Aucune inscription validée.</p>';
        return;
    }
    let html = '';
    list.forEach(function(r) {
        html += '<div class="registration-item approved">' +
                '<span>Joueur ID: ' + r.user_id + '</span>' +
                '<span>Équipe: ' + (r.team_name || '-') + '</span>' +
                '</div>';
    });
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 13. ONGLET ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadTeams() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('name');

    if (error) {
        console.error('Erreur chargement équipes:', error);
        return;
    }
    allTeams = data || [];
    renderTeams();
}

function renderTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    if (!allTeams.length) {
        container.innerHTML = '<p>Aucune équipe pour ce tournoi.</p>';
        return;
    }
    let html = '<div class="teams-grid">';
    allTeams.forEach(function(team) {
        html += '<div class="team-card">' +
                (team.logo_url ? '<img src="' + team.logo_url + '" alt="logo" class="team-logo">' : '<div class="team-logo-placeholder"><i class="fas fa-users"></i></div>') +
                '<div class="team-name">' + team.name + '</div>' +
                '<button class="btn-delete" onclick="deleteTeam(\'' + team.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

async function addTeam(e) {
    e.preventDefault();
    const name = document.getElementById('teamName').value.trim();
    const logo = document.getElementById('teamLogo').value.trim();
    if (!name) {
        showToast('Le nom de l\'équipe est requis.', 'warning');
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .insert([{ tournament_id: currentTournamentId, name: name, logo_url: logo || null }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de l\'équipe', 'error');
    } else {
        showToast('Équipe ajoutée', 'success');
        closeModal('addTeamModal');
        document.getElementById('addTeamForm').reset();
        loadTeams();
    }
}

async function deleteTeam(teamId) {
    if (!confirm('Supprimer cette équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .delete()
        .eq('id', teamId);
    hideLoader();
    if (error) {
        showToast('Erreur lors de la suppression', 'error');
    } else {
        showToast('Équipe supprimée', 'success');
        loadTeams();
    }
}

// ═══════════════════════════════════════════════════════════
// 14. ONGLET MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('*, team_a:gestionnairetournoi_teams!team_a_id(name), team_b:gestionnairetournoi_teams!team_b_id(name)')
        .eq('tournament_id', currentTournamentId)
        .order('match_date', { ascending: true });

    if (error) {
        console.error('Erreur chargement matchs:', error);
        return;
    }
    renderMatches(data || []);
}

function renderMatches(matches) {
    const container = document.getElementById('matchesList');
    if (!container) return;
    if (!matches.length) {
        container.innerHTML = '<p>Aucun match programmé.</p>';
        return;
    }
    let html = '<div class="matches-list">';
    matches.forEach(function(m) {
        const date = m.match_date ? new Date(m.match_date).toLocaleString('fr-FR') : 'Date inconnue';
        html += '<div class="match-item">' +
                '<div class="match-date">' + date + '</div>' +
                '<div class="match-teams">' + (m.team_a?.name || '?') + ' vs ' + (m.team_b?.name || '?') + '</div>' +
                '<div class="match-score">' + (m.score_a || 0) + ' - ' + (m.score_b || 0) + '</div>' +
                '<button class="btn-delete" onclick="deleteMatch(\'' + m.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

async function addMatch(e) {
    e.preventDefault();
    const homeTeam = document.getElementById('matchHomeTeam').value;
    const awayTeam = document.getElementById('matchAwayTeam').value;
    const date = document.getElementById('matchDate').value;
    if (!homeTeam || !awayTeam) {
        showToast('Veuillez sélectionner les deux équipes.', 'warning');
        return;
    }
    if (!date) {
        showToast('Veuillez choisir une date.', 'warning');
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .insert([{
            tournament_id: currentTournamentId,
            team_a_id: homeTeam,
            team_b_id: awayTeam,
            match_date: new Date(date).toISOString(),
            status: 'scheduled'
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout du match', 'error');
    } else {
        showToast('Match ajouté', 'success');
        closeModal('addMatchModal');
        document.getElementById('addMatchForm').reset();
        loadMatches();
    }
}

async function deleteMatch(matchId) {
    if (!confirm('Supprimer ce match ?')) return;
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .delete()
        .eq('id', matchId);
    hideLoader();
    if (error) {
        showToast('Erreur lors de la suppression', 'error');
    } else {
        showToast('Match supprimé', 'success');
        loadMatches();
    }
}

// ═══════════════════════════════════════════════════════════
// 15. ONGLET RAPPORTS
// ═══════════════════════════════════════════════════════════
async function loadReports() {
    // Les rapports sont liés aux matchs de ce tournoi
    const { data: matches } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('id')
        .eq('tournament_id', currentTournamentId);
    if (!matches || matches.length === 0) {
        document.getElementById('reportsList').innerHTML = '<p>Aucun match, donc aucun rapport.</p>';
        return;
    }
    const matchIds = matches.map(function(m) { return m.id; });
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_reports')
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Erreur rapports:', error);
        return;
    }
    renderReports(data || []);
}

function renderReports(reports) {
    const container = document.getElementById('reportsList');
    if (!container) return;
    if (!reports.length) {
        container.innerHTML = '<p>Aucun rapport pour l\'instant.</p>';
        return;
    }
    let html = '';
    reports.forEach(function(r) {
        html += '<div class="report-item">' +
                '<h4>' + (r.title || 'Rapport de match') + '</h4>' +
                '<p>' + (r.content || '') + '</p>' +
                '</div>';
    });
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 16. ONGLET PRIMES
// ═══════════════════════════════════════════════════════════
async function loadPrizes() {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_prizes')
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Erreur chargement primes:', error);
        return;
    }
    renderPrizes(data || []);
}

function renderPrizes(prizes) {
    const container = document.getElementById('prizesList');
    if (!container) return;
    if (!prizes.length) {
        container.innerHTML = '<p>Aucune prime enregistrée.</p>';
        return;
    }
    let html = '';
    prizes.forEach(function(p) {
        html += '<div class="prize-item">' +
                '<span>' + (p.recipient_type === 'team' ? 'Équipe' : 'Joueur') + ': ' + p.recipient_id + '</span>' +
                '<span>' + p.amount.toLocaleString() + ' FCFA</span>' +
                '<span>' + (p.reason || '') + '</span>' +
                '</div>';
    });
    container.innerHTML = html;
}

async function addPrize(e) {
    e.preventDefault();
    const recipientType = document.getElementById('prizeRecipientType').value;
    let recipientId;
    if (recipientType === 'team') {
        recipientId = document.getElementById('prizeTeamId').value;
    } else {
        recipientId = document.getElementById('prizePlayerId').value;
    }
    const amount = document.getElementById('prizeAmount').value;
    const reason = document.getElementById('prizeReason').value;
    if (!recipientId || !amount) {
        showToast('Veuillez remplir tous les champs.', 'warning');
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_prizes')
        .insert([{
            tournament_id: currentTournamentId,
            recipient_type: recipientType,
            recipient_id: recipientId,
            amount: parseFloat(amount),
            reason: reason || null
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de la prime', 'error');
    } else {
        showToast('Prime ajoutée', 'success');
        closeModal('addPrizeModal');
        document.getElementById('addPrizeForm').reset();
        loadPrizes();
    }
}

// ═══════════════════════════════════════════════════════════
// 17. MODALE MODIFIER TOURNOI
// ═══════════════════════════════════════════════════════════
function openEditTournamentModal() {
    if (!currentTournament) return;
    document.getElementById('editName').value = currentTournament.name || '';
    document.getElementById('editStartDate').value = currentTournament.start_date ? currentTournament.start_date.substring(0, 16) : '';
    document.getElementById('editEndDate').value = currentTournament.end_date ? currentTournament.end_date.substring(0, 16) : '';
    document.getElementById('editLocation').value = currentTournament.location || '';
    document.getElementById('editDescription').value = currentTournament.description || '';
    document.getElementById('editPrizePool').value = currentTournament.prize_pool || '';
    document.getElementById('editRegistrationCode').value = currentTournament.registration_code || '';
    document.getElementById('editStreamUrl').value = currentTournament.stream_url || '';
    document.getElementById('editIsActive').checked = currentTournament.is_active;
    openModal('editTournamentModal');
}

async function saveTournamentChanges(e) {
    e.preventDefault();
    const updates = {
        name: document.getElementById('editName').value,
        start_date: document.getElementById('editStartDate').value,
        end_date: document.getElementById('editEndDate').value,
        location: document.getElementById('editLocation').value,
        description: document.getElementById('editDescription').value,
        prize_pool: parseFloat(document.getElementById('editPrizePool').value) || 0,
        registration_code: document.getElementById('editRegistrationCode').value,
        stream_url: document.getElementById('editStreamUrl').value,
        is_active: document.getElementById('editIsActive').checked,
        updated_at: new Date().toISOString()
    };
    showLoader();
    const { error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .update(updates)
        .eq('id', currentTournamentId);
    hideLoader();
    if (error) {
        showToast('Erreur lors de la modification', 'error');
    } else {
        showToast('Tournoi mis à jour', 'success');
        closeModal('editTournamentModal');
        // Recharger les infos
        const { data } = await supabaseClient
            .from('gestionnairetournoi_tournaments')
            .select('*, sport:gestionnairetournoi_sports(name), type:gestionnairetournoi_types(name, label)')
            .eq('id', currentTournamentId)
            .single();
        if (data) {
            currentTournament = data;
            fillInfoTab(data);
            document.getElementById('tournamentName').textContent = data.name || 'Gestion du tournoi';
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 18. MODALES GÉNÉRALES (ouverture/fermeture)
// ═══════════════════════════════════════════════════════════
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

window.closeModal = closeModal; // pour les onclick dans HTML

// ═══════════════════════════════════════════════════════════
// 19. GESTION DES ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            tabButtons.forEach(function(b) { b.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            const target = document.getElementById(tabId + 'Tab');
            if (target) target.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 20. CHARGEMENT DES OPTIONS DES SÉLECTEURS (ÉQUIPES, JOUEURS)
// ═══════════════════════════════════════════════════════════
async function loadTeamOptions() {
    if (!allTeams.length) await loadTeams();
    const homeSelect = document.getElementById('matchHomeTeam');
    const awaySelect = document.getElementById('matchAwayTeam');
    const prizeTeamSelect = document.getElementById('prizeTeamId');
    const html = allTeams.map(function(t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('');
    if (homeSelect) homeSelect.innerHTML = html;
    if (awaySelect) awaySelect.innerHTML = html;
    if (prizeTeamSelect) prizeTeamSelect.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 21. CHANGEMENT BÉNÉFICIAIRE PRIME (équipe / joueur)
// ═══════════════════════════════════════════════════════════
function togglePrizeRecipient() {
    const type = document.getElementById('prizeRecipientType').value;
    document.getElementById('prizeTeamGroup').style.display = (type === 'team') ? 'block' : 'none';
    document.getElementById('prizePlayerGroup').style.display = (type === 'player') ? 'block' : 'none';
}

// ═══════════════════════════════════════════════════════════
// 22. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
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
// 23. INITIALISATION
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
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    await loadTournament();

    // Événements des boutons
    document.getElementById('editTournamentBtn')?.addEventListener('click', openEditTournamentModal);
    document.getElementById('editTournamentForm')?.addEventListener('submit', saveTournamentChanges);

    document.getElementById('addTeamBtn')?.addEventListener('click', function() { openModal('addTeamModal'); });
    document.getElementById('addTeamForm')?.addEventListener('submit', addTeam);

    document.getElementById('addMatchBtn')?.addEventListener('click', async function() {
        await loadTeamOptions(); // s'assurer que les sélecteurs sont remplis
        openModal('addMatchModal');
    });
    document.getElementById('addMatchForm')?.addEventListener('submit', addMatch);

    document.getElementById('addPrizeBtn')?.addEventListener('click', async function() {
        await loadTeamOptions();
        openModal('addPrizeModal');
    });
    document.getElementById('addPrizeForm')?.addEventListener('submit', addPrize);

    document.getElementById('prizeRecipientType')?.addEventListener('change', togglePrizeRecipient);

    // Fermeture des modales en cliquant sur l'overlay
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });

    // Exposer les fonctions nécessaires aux onclick dans le HTML
    window.approveRegistration = approveRegistration;
    window.rejectRegistration = rejectRegistration;
    window.deleteTeam = deleteTeam;
    window.deleteMatch = deleteMatch;
});