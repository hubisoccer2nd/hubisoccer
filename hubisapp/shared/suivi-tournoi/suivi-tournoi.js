/* ============================================================
   HubISoccer — suivi-tournoi.js
   Page Suivi Tournoi (Live) – Version adaptée
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
let tournaments = [];
let currentTournament = null;
let messages = [];
let starredPlayers = new Set();
let messagesSubscription = null;
const profileCache = new Map();

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
function showToast(message, type = 'info', duration = 30000) {
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
        setTimeout(function() {
            if (toast.parentNode) toast.remove();
        }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (toast.parentNode) toast.remove();
            }, 300);
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
async function loadPlayerProfile() {
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
// 8. MISE À JOUR NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Footballeur';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'F');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DES TOURNOIS
// ═══════════════════════════════════════════════════════════
async function loadTournaments() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('tournaments')
        .select('*')
        .order('date', { ascending: true });

    hideLoader();

    if (error) {
        console.error('Erreur chargement tournois:', error);
        showToast('Erreur lors du chargement des tournois', 'error');
        return;
    }

    tournaments = data || [];
    if (tournaments.length === 0) {
        showToast('Aucun tournoi disponible', 'info');
        return;
    }

    currentTournament = tournaments[0];
    await loadTournamentDetails(currentTournament.id);
    await loadStarredPlayers(currentTournament.id);
    renderTournamentList();
    renderLiveTournament();
}

// ═══════════════════════════════════════════════════════════
// 10. DÉTAILS D'UN TOURNOI (JOUEURS)
// ═══════════════════════════════════════════════════════════
async function loadTournamentDetails(tournamentId) {
    try {
        const { data: playersData, error } = await supabaseClient
            .from('tournament_players')
            .select('id, position, jersey_number, player_id')
            .eq('tournament_id', tournamentId);

        if (error) throw error;

        // Pour chaque joueur, récupérer le profil correspondant
        const playerIds = playersData.map(function(p) { return p.player_id; });
        const { data: profilesData } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('hubisoccer_id, full_name, avatar_url')
            .in('hubisoccer_id', playerIds);

        const profileMap = {};
        if (profilesData) {
            profilesData.forEach(function(profile) {
                profileMap[profile.hubisoccer_id] = profile;
            });
        }

        currentTournament.players = (playersData || []).map(function(p) {
            const profile = profileMap[p.player_id] || {};
            return {
                id: p.id,
                playerId: p.player_id,
                name: profile.full_name || 'Joueur inconnu',
                avatar: profile.avatar_url,
                position: p.position,
                jersey_number: p.jersey_number
            };
        });
    } catch (error) {
        console.error('Erreur chargement joueurs:', error);
        showToast('Erreur lors du chargement des joueurs', 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// 11. ÉTOILES
// ═══════════════════════════════════════════════════════════
async function loadStarredPlayers(tournamentId) {
    if (!userProfile) return;
    const { data, error } = await supabaseClient
        .from('player_stars')
        .select('player_id')
        .eq('user_id', currentUser.id)
        .eq('tournament_id', tournamentId);

    if (error) {
        console.error('Erreur chargement étoiles:', error);
        return;
    }

    starredPlayers = new Set(data.map(function(s) { return s.player_id; }));
}

// ═══════════════════════════════════════════════════════════
// 12. LISTE DES TOURNOIS (MODALE)
// ═══════════════════════════════════════════════════════════
function renderTournamentList() {
    const list = document.getElementById('tournamentList');
    if (!list) return;

    if (tournaments.length === 0) {
        list.innerHTML = '<p class="no-data">Aucun tournoi disponible</p>';
        return;
    }

    list.innerHTML = tournaments.map(function(t) {
        return '<div class="tournament-item" data-tournament-id="' + t.id + '">' +
               '<span class="tournament-item-name">' + t.name + '</span>' +
               '<span class="tournament-item-date">' + new Date(t.date).toLocaleDateString('fr-FR') + '</span>' +
               '</div>';
    }).join('');

    document.querySelectorAll('.tournament-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const tournamentId = parseInt(item.dataset.tournamentId);
            selectTournament(tournamentId);
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 13. AFFICHAGE DU TOURNOI LIVE
// ═══════════════════════════════════════════════════════════
function renderLiveTournament() {
    if (!currentTournament) return;

    const container = document.getElementById('liveTournament');

    let videoHtml = '';
    if (currentTournament.stream_url) {
        videoHtml = '<iframe src="' + currentTournament.stream_url + '" frameborder="0" allowfullscreen></iframe>';
    } else {
        videoHtml = '<div class="no-stream">Aucun stream disponible pour le moment</div>';
    }

    container.innerHTML =
        '<div class="tournament-video">' + videoHtml + '</div>' +
        '<div class="tournament-info">' +
        '<h2 class="tournament-name">' + currentTournament.name + '</h2>' +
        '<span class="tournament-date">' + new Date(currentTournament.date).toLocaleDateString('fr-FR') + '</span>' +
        '</div>' +
        '<div class="tournament-actions">' +
        '<button class="btn-players" onclick="openPlayersModal()"><i class="fas fa-users"></i> Voir les joueurs</button>' +
        '</div>' +
        '<div class="chat-section">' +
        '<h3>Chat en direct</h3>' +
        '<div class="chat-messages" id="chatMessages"></div>' +
        '<div class="chat-input-area">' +
        '<input type="text" id="chatInput" placeholder="Votre message..." onkeypress="if(event.key===\'Enter\') sendMessage()">' +
        '<button onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>' +
        '<button id="refreshChatBtn" class="btn-refresh" style="margin-left: 5px;"><i class="fas fa-sync-alt"></i></button>' +
        '</div>' +
        '</div>';

    renderChatMessages();
}

// ═══════════════════════════════════════════════════════════
// 14. MESSAGES
// ═══════════════════════════════════════════════════════════
async function loadMessages(tournamentId) {
    try {
        const { data, error } = await supabaseClient
            .from('tournament_messages')
            .select('id, user_id, message, created_at')
            .eq('tournament_id', tournamentId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Récupérer les noms des auteurs via les profils
        const userIds = data.map(function(m) { return m.user_id; });
        const { data: profilesData } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('auth_uuid, full_name')
            .in('auth_uuid', userIds);

        const profileMap = {};
        if (profilesData) {
            profilesData.forEach(function(p) {
                profileMap[p.auth_uuid] = p.full_name || 'Inconnu';
            });
        }

        messages = (data || []).map(function(m) {
            return {
                id: m.id,
                userId: m.user_id,
                author: profileMap[m.user_id] || 'Inconnu',
                text: m.message,
                time: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };
        });

        renderChatMessages();
    } catch (error) {
        console.error('Erreur chargement messages:', error);
        showToast('Erreur lors du chargement des messages', 'error');
    }
}

function renderChatMessages() {
    const chatDiv = document.getElementById('chatMessages');
    if (!chatDiv) return;

    chatDiv.innerHTML = messages.map(function(msg) {
        const isOwn = msg.userId === currentUser.id;
        return '<div class="chat-message ' + (isOwn ? 'own' : '') + '">' +
               '<div class="author">' + msg.author + '</div>' +
               '<div class="text">' + msg.text + '</div>' +
               '<div class="time">' + msg.time + '</div>' +
               '</div>';
    }).join('');

    chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function refreshMessages() {
    if (!currentTournament) return;
    const refreshBtn = document.getElementById('refreshChatBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        const originalIcon = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        await loadMessages(currentTournament.id);
        refreshBtn.innerHTML = originalIcon;
        refreshBtn.disabled = false;
    } else {
        await loadMessages(currentTournament.id);
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentTournament) return;

    input.disabled = true;
    const sendBtn = document.querySelector('.chat-input-area button');
    const originalHtml = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    sendBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('tournament_messages')
            .insert([{
                tournament_id: currentTournament.id,
                user_id: currentUser.id,
                message: text
            }]);

        if (error) {
            console.error('Erreur envoi message:', error);
            showToast('Erreur lors de l\'envoi du message', 'error');
            return;
        }

        input.value = '';
    } catch (err) {
        console.error('Erreur inattendue:', err);
        showToast('Erreur lors de l\'envoi du message', 'error');
    } finally {
        input.disabled = false;
        sendBtn.innerHTML = originalHtml;
        sendBtn.disabled = false;
        input.focus();
    }
}

// ═══════════════════════════════════════════════════════════
// 15. SOUSCRIPTION TEMPS RÉEL
// ═══════════════════════════════════════════════════════════
function subscribeToMessages(tournamentId) {
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }

    messagesSubscription = supabaseClient
        .channel('tournament_messages_' + tournamentId)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'tournament_messages',
                filter: 'tournament_id=eq.' + tournamentId
            },
            async function(payload) {
                let authorName = profileCache.get(payload.new.user_id);
                if (!authorName) {
                    const { data } = await supabaseClient
                        .from('supabaseAuthPrive_profiles')
                        .select('full_name')
                        .eq('auth_uuid', payload.new.user_id)
                        .single();
                    authorName = data?.full_name || 'Inconnu';
                    profileCache.set(payload.new.user_id, authorName);
                }

                const newMsg = {
                    id: payload.new.id,
                    userId: payload.new.user_id,
                    author: authorName,
                    text: payload.new.message,
                    time: new Date(payload.new.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                };
                messages.push(newMsg);
                renderChatMessages();
            }
        )
        .subscribe(function(status, err) {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Souscription Realtime établie pour le tournoi', tournamentId);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Erreur de canal Realtime :', err);
            } else if (status === 'TIMED_OUT') {
                console.warn('⚠️ Timeout de la souscription, tentative de reconnexion...');
                setTimeout(function() {
                    subscribeToMessages(tournamentId);
                }, 3000);
            }
        });
}

// ═══════════════════════════════════════════════════════════
// 16. SÉLECTION D'UN TOURNOI
// ═══════════════════════════════════════════════════════════
async function selectTournament(tournamentId) {
    const container = document.getElementById('liveTournament');
    if (container) container.innerHTML = '<div class="spinner" style="margin:50px auto;"></div>';

    currentTournament = tournaments.find(function(t) { return t.id === tournamentId; });
    await loadTournamentDetails(tournamentId);
    await loadStarredPlayers(tournamentId);
    await loadMessages(tournamentId);
    subscribeToMessages(tournamentId);
    renderLiveTournament();
    closeTournamentModal();
}

// ═══════════════════════════════════════════════════════════
// 17. MODALES
// ═══════════════════════════════════════════════════════════
function openTournamentModal() {
    document.getElementById('tournamentModal').style.display = 'flex';
}
function closeTournamentModal() {
    document.getElementById('tournamentModal').style.display = 'none';
}
function openPlayersModal() {
    renderPlayersList();
    document.getElementById('playersModal').style.display = 'flex';
}
function closePlayersModal() {
    document.getElementById('playersModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 18. LISTE DES JOUEURS DANS LA MODALE
// ═══════════════════════════════════════════════════════════
function renderPlayersList() {
    const list = document.getElementById('playersList');
    if (!list || !currentTournament?.players) return;

    list.innerHTML = currentTournament.players.map(function(p) {
        const isStarred = starredPlayers.has(p.playerId);
        return '<div class="player-item">' +
               '<div class="player-avatar">' +
               '<img src="' + (p.avatar || '../../img/user-default.jpg') + '" alt="' + p.name + '">' +
               '</div>' +
               '<div class="player-info">' +
               '<div class="player-name">' + p.name + '</div>' +
               '<div class="player-position">' + (p.position || 'Poste inconnu') + '</div>' +
               '</div>' +
               '<div class="player-star ' + (isStarred ? 'active' : '') + '" onclick="toggleStar(\'' + p.playerId + '\')">' +
               '<i class="fas fa-star"></i>' +
               '</div>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 19. ÉTOILER / DÉSÉTOILER UN JOUEUR
// ═══════════════════════════════════════════════════════════
async function toggleStar(playerId) {
    if (!userProfile || !currentTournament) return;

    if (starredPlayers.has(playerId)) {
        const { error } = await supabaseClient
            .from('player_stars')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('tournament_id', currentTournament.id)
            .eq('player_id', playerId);
        if (error) {
            showToast('Erreur lors de la suppression de l\'étoile', 'error');
            console.error(error);
            return;
        }
        starredPlayers.delete(playerId);
    } else {
        const { error } = await supabaseClient
            .from('player_stars')
            .insert([{
                user_id: currentUser.id,
                tournament_id: currentTournament.id,
                player_id: playerId
            }]);
        if (error) {
            showToast('Erreur lors de l\'ajout de l\'étoile', 'error');
            console.error(error);
            return;
        }
        starredPlayers.add(playerId);
    }
    renderPlayersList();
}

// ═══════════════════════════════════════════════════════════
// 20. INTERFACE UTILISATEUR (SIDEBAR, MENU, DÉCONNEXION)
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
// 21. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadPlayerProfile();
    if (!userProfile) return;

    await loadTournaments();

    if (currentTournament) {
        await loadMessages(currentTournament.id);
        subscribeToMessages(currentTournament.id);
    }

    document.getElementById('openTournamentModal')?.addEventListener('click', openTournamentModal);
    const refreshBtn = document.getElementById('refreshChatBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshMessages);

    window.closeTournamentModal = closeTournamentModal;
    window.closePlayersModal = closePlayersModal;
    window.openPlayersModal = openPlayersModal;
    window.toggleStar = toggleStar;
    window.sendMessage = sendMessage;
    window.refreshMessages = refreshMessages;

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });
});