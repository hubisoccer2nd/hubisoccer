/* ============================================================
   HubISoccer — tournament-details.js
   Page Détails d'un tournoi – Version adaptée
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
let currentTournament = null;

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
// 6. RÉCUPÉRATION DE L'ID DU TOURNOI
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        showToast('Aucun identifiant de tournoi fourni.', 'error');
        window.location.href = 'acceuil.html';
        return null;
    }
    return parseInt(id);
}

// ═══════════════════════════════════════════════════════════
// 7. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    if (!session) {
        currentUser = null;
        userProfile = null;
        return false;
    }
    currentUser = session.user;
    return true;
}

// ═══════════════════════════════════════════════════════════
// 8. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    if (!currentUser) return null;
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) return null;
    userProfile = data;
    updateNavbarUI();
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 9. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userProfile) {
        if (userName) userName.textContent = userProfile.full_name || 'Utilisateur';
        if (userProfile.avatar_url) {
            if (userAvatar) { userAvatar.src = userProfile.avatar_url; userAvatar.style.display = 'block'; }
            if (userInitials) userInitials.style.display = 'none';
        } else {
            const initials = getInitials(userProfile.full_name || 'U');
            if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
            if (userAvatar) userAvatar.style.display = 'none';
        }
    } else {
        if (userName) userName.textContent = 'Invité';
        if (userAvatar) { userAvatar.src = ''; userAvatar.style.display = 'none'; }
        if (userInitials) { userInitials.textContent = 'I'; userInitials.style.display = 'flex'; }
    }
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES DÉTAILS DU TOURNOI
// ═══════════════════════════════════════════════════════════
async function loadTournamentDetails(tournamentId) {
    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_tournaments')
        .select('id, name, description, start_date, end_date, location, registration_code, prize_pool, stream_url, requires_first_pas, has_agreed_to_rules, type_id, sport_id, gestionnairetournoi_types!inner(name, label), gestionnairetournoi_sports!inner(name)')
        .eq('id', tournamentId)
        .single();

    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable', 'error');
        window.location.href = 'acceuil.html';
        return;
    }

    currentTournament = data;

    // Remplir les informations
    document.getElementById('tournamentName').textContent = data.name;
    document.getElementById('tournamentDescription').textContent = data.description || 'Aucune description.';
    document.getElementById('tournamentLocation').textContent = data.location || 'Non spécifié';
    document.getElementById('tournamentType').textContent = data.gestionnairetournoi_types ? data.gestionnairetournoi_types.label : 'Non spécifié';
    document.getElementById('tournamentSport').textContent = data.gestionnairetournoi_sports ? data.gestionnairetournoi_sports.name : 'Non spécifié';
    document.getElementById('tournamentPrize').textContent = data.prize_pool ? data.prize_pool.toLocaleString() + ' FCFA' : 'Non spécifié';

    if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).toLocaleDateString('fr-FR');
        const end = new Date(data.end_date).toLocaleDateString('fr-FR');
        document.getElementById('tournamentDates').textContent = start + ' - ' + end;
    } else {
        document.getElementById('tournamentDates').textContent = 'Dates non définies';
    }

    // Gérer le bloc d'inscription
    const registrationBlock = document.getElementById('registrationBlock');
    if (registrationBlock) {
        registrationBlock.style.display = 'block';
        if (!currentUser) {
            // Utilisateur non connecté
            registrationBlock.innerHTML = '<p>Connectez-vous pour vous inscrire à ce tournoi.</p><a href="../../authprive/users/login.html" class="btn-primary">Se connecter</a>';
        } else {
            // Vérifier si déjà inscrit
            const { data: existing } = await supabaseClient
                .from('gestionnairetournoi_participants')
                .select('id, status')
                .eq('tournament_id', tournamentId)
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (existing) {
                const statusLabel = existing.status === 'approved' ? 'Inscription approuvée' :
                                    existing.status === 'pending' ? 'Inscription en attente' : 'Inscription refusée';
                registrationBlock.innerHTML = '<p>Vous êtes déjà inscrit à ce tournoi. Statut : <strong>' + statusLabel + '</strong></p>';
            } else {
                registrationBlock.innerHTML = '<button id="registerBtn" class="btn-primary"><i class="fas fa-check-circle"></i> S\'inscrire au tournoi</button><div id="registrationMessage" class="registration-message"></div>';
                document.getElementById('registerBtn').addEventListener('click', function() {
                    registerForTournament(tournamentId);
                });
            }
        }
    }

    // Charger les autres sections
    await loadTeams(tournamentId);
    await loadMatches(tournamentId);
    await loadStandings(tournamentId);
}

// ═══════════════════════════════════════════════════════════
// 11. INSCRIPTION AU TOURNOI
// ═══════════════════════════════════════════════════════════
async function registerForTournament(tournamentId) {
    if (!currentUser) {
        showToast('Vous devez être connecté pour vous inscrire.', 'warning');
        return;
    }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

    const { error } = await supabaseClient
        .from('gestionnairetournoi_participants')
        .insert([{
            tournament_id: tournamentId,
            user_id: currentUser.id,
            status: 'pending'
        }]);

    if (error) {
        showToast('Erreur lors de l\'inscription : ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> S\'inscrire au tournoi';
    } else {
        showToast('Inscription réussie ! Votre demande est en attente de validation.', 'success');
        const registrationBlock = document.getElementById('registrationBlock');
        if (registrationBlock) {
            registrationBlock.innerHTML = '<p>Vous êtes déjà inscrit à ce tournoi. Statut : <strong>Inscription en attente</strong></p>';
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadTeams(tournamentId) {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_teams')
        .select('id, name, logo_url')
        .eq('tournament_id', tournamentId)
        .order('name');

    const container = document.getElementById('teamsList');
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p>Aucune équipe pour le moment.</p>';
        return;
    }

    container.innerHTML = data.map(function(team) {
        return '<div class="team-card">' +
               (team.logo_url ? '<img src="' + team.logo_url + '" alt="Logo" class="team-logo">' : '<div class="team-logo-placeholder"><i class="fas fa-shield-alt"></i></div>') +
               '<span class="team-name">' + escapeHtml(team.name) + '</span>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT DES MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches(tournamentId) {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('id, round, team_a_id, team_b_id, score_a, score_b, match_date, status, team_a:gestionnairetournoi_teams!team_a_id(name), team_b:gestionnairetournoi_teams!team_b_id(name)')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true });

    const container = document.getElementById('matchesList');
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p>Aucun match programmé pour le moment.</p>';
        return;
    }

    container.innerHTML = data.map(function(match) {
        const date = match.match_date ? new Date(match.match_date).toLocaleString('fr-FR') : 'Date à définir';
        const score = match.status === 'completed' ? match.score_a + ' - ' + match.score_b : 'vs';
        return '<div class="match-item">' +
               '<div class="match-round">' + (match.round || 'Match') + '</div>' +
               '<div class="match-teams">' +
               '<span>' + (match.team_a ? match.team_a.name : 'Équipe A') + '</span>' +
               '<span class="match-score">' + score + '</span>' +
               '<span>' + (match.team_b ? match.team_b.name : 'Équipe B') + '</span>' +
               '</div>' +
               '<div class="match-date">' + date + '</div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 14. CHARGEMENT DU CLASSEMENT
// ═══════════════════════════════════════════════════════════
async function loadStandings(tournamentId) {
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_standings')
        .select('id, played, wins, draws, losses, goals_for, goals_against, points, team:gestionnairetournoi_teams!team_id(name)')
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });

    const container = document.getElementById('standingsList');
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p>Aucun classement disponible pour le moment.</p>';
        return;
    }

    let html = '<table class="standings-table"><thead><tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Pts</th></tr></thead><tbody>';
    data.forEach(function(row, index) {
        html += '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + (row.team ? escapeHtml(row.team.name) : '—') + '</td>' +
                '<td>' + (row.played || 0) + '</td>' +
                '<td>' + (row.wins || 0) + '</td>' +
                '<td>' + (row.draws || 0) + '</td>' +
                '<td>' + (row.losses || 0) + '</td>' +
                '<td>' + (row.goals_for || 0) + '</td>' +
                '<td>' + (row.goals_against || 0) + '</td>' +
                '<td><strong>' + (row.points || 0) + '</strong></td>' +
                '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
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
    const tournamentId = getTournamentIdFromURL();
    if (!tournamentId) return;

    const isLoggedIn = await checkSession();
    if (isLoggedIn) {
        await loadProfile();
    }
    updateNavbarUI();

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    await loadTournamentDetails(tournamentId);
});