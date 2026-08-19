/* ============================================================
   HubISoccer — live.js (reconstruction complète)
   Communauté — Lives en direct
   ------------------------------------------------------------
   Reconstruit entierement independant : plus de dependance a
   utils.js/session.js (jamais verifies, source possible de
   silence total si l'un des deux echoue avant que live.js ne
   s'execute). Sa propre session, son propre client Supabase, son
   propre toast, comme chaque page de Gestion Tournois.

   Journal de diagnostic VISIBLE A L'ECRAN (pas seulement en
   console) a chaque etape critique -- camera, session, connexion
   PeerJS, jointure -- pour que meme sur mobile sans acces aux
   outils de developpement, ce qui se passe reste toujours lisible
   et signalable.

   Corrections cumulees des tours precedents, integrees depuis le
   depart cette fois :
   - peer_id ALEATOIRE propre a HubISoccer des la creation, jamais
     l'id sequentiel de la ligne (0.peerjs.com est un serveur
     PUBLIC partage par n'importe quelle application au monde).
   - Relais TURN configure des les deux cotes (hote et spectateur).
   - Liste des lives abonnee en temps reel (plus de carte figee
     apres la fin reelle d'un live).
   - Verification de fraicheur avant toute tentative de connexion.
   - Delai d'attente reel avec message clair en cas d'echec.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE (autonome, aucune dependance externe)
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TBL_SESSIONS = 'supabaseAuthPrive_live_sessions';
const TBL_CHAT         = 'supabaseAuthPrive_live_chat_messages';
const TBL_GIFTS            = 'supabaseAuthPrive_live_gifts';
const TBL_PROFILES            = 'supabaseAuthPrive_profiles';

// ═══════════════════════════════════════════════════════════
// 2. CONFIGURATION ICE (STUN + TURN, relais gratuit de secours)
// ═══════════════════════════════════════════════════════════
const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
};

const GIFTS_CATALOG = [
    { emoji: '⚽', label: 'Ballon', coins: 10 },
    { emoji: '🧤', label: 'Gants', coins: 20 },
    { emoji: '👕', label: 'Maillot', coins: 50 },
    { emoji: '🏆', label: 'Trophée', coins: 100 },
    { emoji: '🚀', label: 'Fusée', coins: 200 },
    { emoji: '💎', label: 'Diamant', coins: 500 }
];

// ═══════════════════════════════════════════════════════════
// 3. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let currentProfile = null;
let currentLiveId = null;
let currentPeerId = null;
let isHost = false;
let localStream = null;
let peer = null;
let currentCall = null;
let facingMode = 'user';
let strengthCount = 0;
let liveStartTime = null;
let durationTimer = null;
let chatChannel = null;
let livesListChannel = null;
let previewStream = null;

// ═══════════════════════════════════════════════════════════
// 4. JOURNAL DE DIAGNOSTIC VISIBLE À L'ÉCRAN
// ------------------------------------------------------------
// Chaque etape critique s'ecrit ICI, pas seulement en console --
// visible et copiable directement depuis le telephone, sans outils
// de developpement. C'est le point central de cette reconstruction :
// plus jamais un echec silencieux qu'on ne peut ni voir ni signaler.
// ═══════════════════════════════════════════════════════════
function diag(message, level) {
    level = level || 'info';
    const time = new Date().toLocaleTimeString('fr-FR');
    console[level === 'error' ? 'error' : 'log']('[LIVE ' + time + ']', message);
    const log = document.getElementById('diagLog');
    if (!log) return;
    const line = document.createElement('div');
    line.className = 'diag-line diag-' + level;
    line.textContent = time + ' — ' + message;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    if (level === 'error') {
        document.getElementById('diagPanel').style.display = 'flex';
        document.getElementById('diagToggleBtn').classList.add('has-error');
    }
}

// ═══════════════════════════════════════════════════════════
// 5. LOADER / TOAST / UTILITAIRES
// ═══════════════════════════════════════════════════════════
function showLoader(text) {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; document.getElementById('loaderText').textContent = text || 'Chargement…'; }
}
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

function toast(message, type, duration) {
    type = type || 'info';
    duration = duration || 30000;
    let container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const el = document.createElement('div');
    el.className = 'c-toast c-toast-' + type;
    el.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span><button class="c-toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(el);
    el.querySelector('.c-toast-close').addEventListener('click', function() { el.remove(); });
    setTimeout(function() { if (el.parentNode) el.remove(); }, duration);
}

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
function formatDuration(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
}

// ═══════════════════════════════════════════════════════════
// 6. SESSION (autonome)
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    diag('Vérification de la session…');
    const { data, error } = await sb.auth.getSession();
    if (error) { diag('Erreur session Supabase : ' + error.message, 'error'); return null; }
    if (!data.session) {
        diag('Aucune session active — redirection vers la connexion.', 'warning');
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = data.session.user;
    diag('Session OK — utilisateur ' + currentUser.id);
    return currentUser;
}

async function loadProfile() {
    diag('Chargement du profil…');
    const { data, error } = await sb.from(TBL_PROFILES).select('*').eq('auth_uuid', currentUser.id).single();
    if (error || !data) { diag('Erreur chargement profil : ' + (error ? error.message : 'introuvable'), 'error'); return null; }
    currentProfile = data;
    diag('Profil chargé — ' + (currentProfile.full_name || currentProfile.hubisoccer_id));
    updateNavbarUI();
    return currentProfile;
}

function updateNavbarUI() {
    if (!currentProfile) return;
    document.getElementById('liveUserName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
    const avatar = document.getElementById('liveUserAvatar');
    const initials = document.getElementById('liveUserAvatarInitials');
    if (currentProfile.avatar_url) {
        avatar.src = currentProfile.avatar_url; avatar.style.display = 'block'; initials.style.display = 'none';
    } else {
        initials.textContent = getInitials(currentProfile.full_name); initials.style.display = 'flex'; avatar.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 7. LISTE DES LIVES
// ═══════════════════════════════════════════════════════════
async function loadLives() {
    diag('Chargement de la liste des lives actifs…');
    const { data, error } = await sb
        .from(TBL_SESSIONS)
        .select('*, host:' + TBL_PROFILES + '!host_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('is_active', true)
        .order('started_at', { ascending: false });

    const grid = document.getElementById('livesGrid');
    if (error) {
        diag('Erreur chargement des lives : ' + error.message, 'error');
        grid.innerHTML = '<div class="lives-empty"><p>Erreur de chargement.</p></div>';
        return;
    }

    diag((data || []).length + ' live(s) actif(s) trouvé(s).');
    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="lives-empty"><i class="fas fa-broadcast-tower" style="font-size:2.5rem;opacity:0.2"></i><p>Aucun live en ce moment.<br>Sois le premier à démarrer !</p></div>';
    } else {
        grid.innerHTML = data.map(makeLiveCard).join('');
        grid.querySelectorAll('.live-card').forEach(function(card, i) {
            card.addEventListener('click', function() { joinLive(data[i]); });
        });
    }
    loadPastLives();
}

function makeLiveCard(l) {
    const host = l.host || {};
    const name = host.full_name || host.display_name || 'HubISoccer';
    const avatar = host.avatar_url ? '<img src="' + host.avatar_url + '" alt="">' : '<div class="live-card-avatar-initials">' + getInitials(name) + '</div>';
    return '<div class="live-card">' +
           '<div class="live-card-thumb"><div class="live-card-badge"><i class="fas fa-circle"></i> LIVE</div><div class="live-card-viewers"><i class="fas fa-eye"></i> ' + (l.viewers_count || 0) + '</div></div>' +
           '<div class="live-card-info"><div class="live-card-avatar">' + avatar + '</div>' +
           '<div><div class="live-card-title">' + escapeHtml(l.title) + '</div><div class="live-card-host">' + escapeHtml(name) + '</div></div></div>' +
           (host.role_code ? '<div class="live-card-sport">' + escapeHtml(host.role_code) + '</div>' : '') +
           '</div>';
}

async function loadPastLives() {
    const { data } = await sb.from(TBL_SESSIONS).select('*, host:' + TBL_PROFILES + '!host_hubisoccer_id(full_name, display_name)').eq('is_active', false).order('ended_at', { ascending: false }).limit(8);
    const grid = document.getElementById('pastLivesGrid');
    if (!data || !data.length) { grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.8rem">Aucun live récent</p>'; return; }
    grid.innerHTML = data.map(function(l) {
        return '<div class="past-live-item"><div class="past-live-title">' + escapeHtml(l.title || 'Live terminé') + '</div>' +
               '<div class="past-live-meta">' + ((l.host && l.host.full_name) || '—') + ' · ' + (l.max_viewers || 0) + ' spectateurs max' +
               (l.ended_at ? ' · ' + new Date(l.ended_at).toLocaleDateString('fr-FR') : '') + '</div></div>';
    }).join('');
}

function subscribeToLivesList() {
    livesListChannel = sb.channel('lives_list_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: TBL_SESSIONS }, function() {
            diag('Changement détecté sur la liste des lives — rafraîchissement.');
            if (document.getElementById('livesListView').style.display !== 'none') loadLives();
        })
        .subscribe();
}

// ═══════════════════════════════════════════════════════════
// 8. APERÇU CAMÉRA (avant de démarrer)
// ═══════════════════════════════════════════════════════════
async function activateCameraPreview() {
    diag('Demande d\'accès à la caméra pour aperçu…');
    try {
        previewStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        document.getElementById('cameraPreview').srcObject = previewStream;
        document.getElementById('cameraPreviewOverlay').style.display = 'none';
        document.getElementById('goLiveBtn').disabled = false;
        diag('Caméra activée avec succès.', 'success');
    } catch (err) {
        diag('Échec accès caméra : ' + err.name + ' — ' + err.message, 'error');
        toast('Impossible d\'accéder à la caméra : ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════
// 9. DÉMARRER UN LIVE (hôte)
// ═══════════════════════════════════════════════════════════
async function startLive() {
    const title = document.getElementById('liveTitle').value.trim();
    if (!title) { toast('Donne un titre à ton live', 'warning'); return; }
    if (!previewStream) { toast('Active d\'abord ta caméra', 'warning'); return; }

    const btn = document.getElementById('goLiveBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Démarrage…';
    diag('=== DÉMARRAGE DU LIVE ===');

    try {
        localStream = previewStream;

        currentPeerId = 'hubisoccer-live-' + crypto.randomUUID();
        diag('Identifiant PeerJS unique généré : ' + currentPeerId);

        diag('Création de la session en base…');
        const { data: session, error } = await sb.from(TBL_SESSIONS).insert({
            host_hubisoccer_id: currentProfile.hubisoccer_id,
            peer_id: currentPeerId,
            title: title,
            description: document.getElementById('liveDescription').value.trim() || null,
            category: document.getElementById('liveCategory').value,
            is_active: true,
            viewers_count: 0,
            max_viewers: 0,
            started_at: new Date().toISOString()
        }).select().single();

        if (error) { diag('Erreur création session : ' + error.message, 'error'); throw error; }
        diag('Session créée en base — id=' + session.id, 'success');
        currentLiveId = session.id;
        isHost = true;

        diag('Connexion au serveur PeerJS (0.peerjs.com) avec relais TURN…');
        peer = new Peer(currentPeerId, { host: '0.peerjs.com', port: 443, secure: true, config: ICE_CONFIG, debug: 1 });

        const peerOpenTimeout = setTimeout(function() {
            diag('Aucune réponse du serveur PeerJS après 10s (peer.on(\'open\') jamais déclenché).', 'error');
            toast('Le serveur de connexion vidéo ne répond pas. Réessaie dans un instant.', 'error');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-circle"></i> Go Live !';
        }, 10000);

        peer.on('open', function(id) {
            clearTimeout(peerOpenTimeout);
            diag('Peer hôte ouvert avec succès : ' + id, 'success');
            closeModal('modalStartLive');
            enterLiveRoom(session, localStream, true);
        });

        peer.on('call', function(call) {
            diag('Appel entrant d\'un spectateur — réponse avec le flux vidéo.');
            call.answer(localStream);
            call.on('stream', function(stream) { document.getElementById('remoteVideo').srcObject = stream; });
            call.on('error', function(err) { diag('Erreur sur l\'appel entrant : ' + err, 'error'); });
        });

        peer.on('disconnected', function() { diag('Déconnecté du serveur de signalisation PeerJS.', 'warning'); });

        peer.on('error', function(err) {
            clearTimeout(peerOpenTimeout);
            diag('Erreur PeerJS (hôte) : ' + err.type, 'error');
            toast('Erreur de connexion caméra (' + err.type + '). Réessaie de démarrer le live.', 'error');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-circle"></i> Go Live !';
        });

        await notifyFollowers(session);
    } catch (err) {
        diag('Exception dans startLive() : ' + err.message, 'error');
        if (!String(err.message).includes('création session')) toast('Erreur démarrage : ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-circle"></i> Go Live !';
    }
}

async function notifyFollowers(session) {
    diag('Notification des abonnés (si applicable)…');
    // Placeholder volontairement neutre : le systeme de notifications
    // aux abonnes depend d'une table/mecanisme non confirme ici.
    // N'insere rien a l'aveugle -- a completer une fois la source
    // reelle des abonnements identifiee.
}

// ═══════════════════════════════════════════════════════════
// 10. REJOINDRE UN LIVE (spectateur)
// ═══════════════════════════════════════════════════════════
async function joinLive(liveSession) {
    diag('=== TENTATIVE DE CONNEXION À UN LIVE (id=' + liveSession.id + ') ===');
    document.getElementById('livesListView').style.display = 'none';
    document.getElementById('liveRoomView').style.display = 'flex';
    document.getElementById('connectingOverlay').style.display = 'flex';
    document.getElementById('connectingText').textContent = 'Vérification du live…';

    try {
        diag('Revérification que le live est toujours actif…');
        const { data: freshSession, error: freshErr } = await sb
            .from(TBL_SESSIONS)
            .select('*, host:' + TBL_PROFILES + '!host_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
            .eq('id', liveSession.id)
            .eq('is_active', true)
            .maybeSingle();

        if (freshErr) { diag('Erreur revérification : ' + freshErr.message, 'error'); }

        if (!freshSession) {
            diag('Ce live n\'est plus actif (déjà terminé).', 'warning');
            toast('Ce live vient de se terminer.', 'warning');
            leaveLive();
            loadLives();
            return;
        }
        liveSession = freshSession;
        diag('Live confirmé actif. peer_id de l\'hôte : ' + (liveSession.peer_id || 'MANQUANT'));

        if (!liveSession.peer_id) {
            diag('Ce live n\'a aucun peer_id enregistré (ancien format).', 'error');
            toast('Ce live utilise un ancien format et ne peut plus être rejoint. Demande à l\'hôte de relancer son live.', 'error');
            leaveLive();
            return;
        }

        currentLiveId = liveSession.id;
        isHost = false;

        document.getElementById('connectingText').textContent = 'Connexion au serveur vidéo…';
        diag('Connexion au serveur PeerJS (spectateur)…');
        peer = new Peer({ host: '0.peerjs.com', port: 443, secure: true, config: ICE_CONFIG, debug: 1 });

        const connectTimeout = setTimeout(function() {
            if (currentCall) return;
            diag('Timeout (15s) — aucune réponse du pair ' + liveSession.peer_id, 'error');
            toast('Connexion au live impossible pour le moment. Réessaie dans quelques instants.', 'error');
            peer?.destroy();
            leaveLive();
        }, 15000);

        peer.on('open', function(myId) {
            diag('Peer spectateur ouvert : ' + myId + ' — appel de l\'hôte ' + liveSession.peer_id + '…');
            document.getElementById('connectingText').textContent = 'Connexion à l\'hôte…';
            const call = peer.call(liveSession.peer_id, null);
            if (!call) { diag('peer.call() n\'a renvoyé aucun objet call.', 'error'); return; }

            call.on('stream', function(stream) {
                clearTimeout(connectTimeout);
                diag('Flux vidéo reçu avec succès.', 'success');
                currentCall = call;
                enterLiveRoom(liveSession, stream, false);
            });
            call.on('close', function() { diag('Appel fermé par l\'hôte.'); toast('Le live est terminé', 'info'); leaveLive(); });
            call.on('error', function(err) { clearTimeout(connectTimeout); diag('Erreur sur l\'appel (spectateur) : ' + err, 'error'); toast('Connexion au live interrompue.', 'error'); });
        });

        peer.on('disconnected', function() { diag('Déconnecté du serveur de signalisation PeerJS.', 'warning'); });

        peer.on('error', function(err) {
            clearTimeout(connectTimeout);
            diag('Erreur PeerJS (spectateur) : ' + err.type, 'error');
            toast('Impossible de rejoindre ce live (' + err.type + ')', 'error');
            leaveLive();
        });

        const newCount = (liveSession.viewers_count || 0) + 1;
        await sb.from(TBL_SESSIONS).update({ viewers_count: newCount, max_viewers: Math.max(liveSession.max_viewers || 0, newCount) }).eq('id', liveSession.id);
    } catch (err) {
        diag('Exception dans joinLive() : ' + err.message, 'error');
        toast('Erreur connexion au live : ' + err.message, 'error');
        leaveLive();
    }
}

// ═══════════════════════════════════════════════════════════
// 11. ENTRER DANS LA ROOM (commun hôte/spectateur)
// ═══════════════════════════════════════════════════════════
function enterLiveRoom(session, stream, hosting) {
    diag('Entrée dans la room live (rôle : ' + (hosting ? 'hôte' : 'spectateur') + ').', 'success');
    document.getElementById('connectingOverlay').style.display = 'none';

    if (hosting) {
        document.getElementById('localVideo').srcObject = stream;
        document.getElementById('localVideo').style.display = 'block';
        document.getElementById('remoteVideo').style.display = 'none';
        document.getElementById('stopLiveBtn').style.display = 'flex';
    } else {
        document.getElementById('remoteVideo').srcObject = stream;
        document.getElementById('remoteVideo').style.display = 'block';
        document.getElementById('localVideo').style.display = 'none';
        document.getElementById('stopLiveBtn').style.display = 'none';
    }

    const host = session.host || {};
    document.getElementById('liveHostName').textContent = host.full_name || host.display_name || 'HubISoccer';
    document.getElementById('liveHostTitle').textContent = session.title || '';
    if (host.avatar_url) {
        document.getElementById('liveHostAvatar').src = host.avatar_url;
        document.getElementById('liveHostAvatar').style.display = 'block';
        document.getElementById('liveHostAvatarInitials').style.display = 'none';
    } else {
        document.getElementById('liveHostAvatarInitials').textContent = getInitials(host.full_name);
        document.getElementById('liveHostAvatarInitials').style.display = 'flex';
    }

    updateNavbarUI();
    document.getElementById('chatUserAvatarInitials').textContent = getInitials(currentProfile.full_name);
    if (currentProfile.avatar_url) {
        document.getElementById('chatUserAvatar').src = currentProfile.avatar_url;
        document.getElementById('chatUserAvatar').style.display = 'block';
        document.getElementById('chatUserAvatarInitials').style.display = 'none';
    }

    liveStartTime = new Date(session.started_at).getTime();
    durationTimer = setInterval(function() {
        document.getElementById('liveDuration').textContent = formatDuration(Math.floor((Date.now() - liveStartTime) / 1000));
    }, 1000);

    loadChatHistory();
    subscribeToChat();
    buildGiftsGrid();
    diag('Room live prête. Chat et interactions branchés.', 'success');
}

// ═══════════════════════════════════════════════════════════
// 12. CHAT LIVE
// ═══════════════════════════════════════════════════════════
async function loadChatHistory() {
    const { data } = await sb.from(TBL_CHAT).select('*').eq('live_id', currentLiveId).order('created_at', { ascending: true }).limit(100);
    const box = document.getElementById('liveChatMessages');
    box.innerHTML = (data || []).map(chatMessageHtml).join('');
    box.scrollTop = box.scrollHeight;
}

function chatMessageHtml(m) {
    const avatar = m.avatar_url ? '<img src="' + m.avatar_url + '" alt="">' : '<div class="chat-msg-avatar-initials">' + getInitials(m.full_name) + '</div>';
    return '<div class="chat-message"><div class="chat-msg-avatar">' + avatar + '</div>' +
           '<div><span class="chat-msg-name">' + escapeHtml(m.full_name) + '</span><span class="chat-msg-text">' + escapeHtml(m.message) + '</span></div></div>';
}

function subscribeToChat() {
    chatChannel = sb.channel('live_chat_' + currentLiveId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TBL_CHAT, filter: 'live_id=eq.' + currentLiveId }, function(payload) {
            const box = document.getElementById('liveChatMessages');
            box.insertAdjacentHTML('beforeend', chatMessageHtml(payload.new));
            box.scrollTop = box.scrollHeight;
        })
        .on('broadcast', { event: 'reaction' }, function(payload) { spawnFloatingReaction(payload.payload.emoji); })
        .on('broadcast', { event: 'gift' }, function(payload) { handleIncomingGift(payload.payload); })
        .subscribe();
}

async function sendChatMessage() {
    const input = document.getElementById('liveChatInput');
    const message = input.value.trim();
    if (!message || !currentLiveId) return;
    input.value = '';
    const { error } = await sb.from(TBL_CHAT).insert([{
        live_id: currentLiveId, user_id: currentUser.id,
        full_name: currentProfile.full_name || 'Utilisateur',
        avatar_url: currentProfile.avatar_url || null,
        message: message
    }]);
    if (error) diag('Erreur envoi message chat : ' + error.message, 'error');
}

// ═══════════════════════════════════════════════════════════
// 13. RÉACTIONS FLOTTANTES
// ═══════════════════════════════════════════════════════════
function sendReaction(emoji) {
    if (!chatChannel) return;
    chatChannel.send({ type: 'broadcast', event: 'reaction', payload: { emoji: emoji } });
    spawnFloatingReaction(emoji);
    closeModal('modalReact');
}
function spawnFloatingReaction(emoji) {
    const container = document.getElementById('floatingReactions');
    const el = document.createElement('span');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = (20 + Math.random() * 60) + '%';
    container.appendChild(el);
    setTimeout(function() { el.remove(); }, 3000);
}

// ═══════════════════════════════════════════════════════════
// 14. CADEAUX
// ═══════════════════════════════════════════════════════════
function buildGiftsGrid() {
    document.getElementById('giftsGrid').innerHTML = GIFTS_CATALOG.map(function(g, i) {
        return '<div class="gift-item" data-index="' + i + '"><span class="gift-emoji">' + g.emoji + '</span><span class="gift-label">' + g.label + '</span><span class="gift-coins">' + g.coins + ' 🪙</span></div>';
    }).join('');
    document.querySelectorAll('.gift-item').forEach(function(el) {
        el.addEventListener('click', function() { sendGift(GIFTS_CATALOG[parseInt(this.dataset.index, 10)]); });
    });
}

async function sendGift(gift) {
    if (!currentLiveId) return;
    const { error } = await sb.from(TBL_GIFTS).insert([{
        live_id: currentLiveId, sender_id: currentUser.id,
        sender_name: currentProfile.full_name || 'Utilisateur',
        gift_emoji: gift.emoji, gift_label: gift.label, coins_amount: gift.coins
    }]);
    if (error) { diag('Erreur envoi cadeau : ' + error.message, 'error'); toast('Erreur envoi du cadeau', 'error'); return; }
    if (chatChannel) chatChannel.send({ type: 'broadcast', event: 'gift', payload: { emoji: gift.emoji, label: gift.label, sender: currentProfile.full_name } });
    closeModal('modalGifts');
    toast(gift.emoji + ' Cadeau envoyé !', 'success', 4000);
}
function handleIncomingGift(payload) {
    spawnFloatingReaction(payload.emoji);
    const box = document.getElementById('liveChatMessages');
    box.insertAdjacentHTML('beforeend', '<div class="chat-message chat-gift-message"><i class="fas fa-gift"></i> <strong>' + escapeHtml(payload.sender) + '</strong> a envoyé ' + payload.emoji + ' ' + escapeHtml(payload.label) + '</div>');
    box.scrollTop = box.scrollHeight;
}

// ═══════════════════════════════════════════════════════════
// 15. CONTRÔLES (caméra, micro, flip, force)
// ═══════════════════════════════════════════════════════════
function toggleCam() {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    document.getElementById('toggleCamBtn').classList.toggle('muted', !track.enabled);
}
function toggleMic() {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    document.getElementById('toggleMicBtn').classList.toggle('muted', !track.enabled);
}
async function flipCamera() {
    if (!isHost || !localStream) return;
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    diag('Changement de caméra (' + facingMode + ')…');
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        oldVideoTrack.stop();
        document.getElementById('localVideo').srcObject = localStream;
        if (peer && peer.connections) {
            Object.values(peer.connections).flat().forEach(function(conn) {
                const sender = conn.peerConnection?.getSenders().find(function(s) { return s.track && s.track.kind === 'video'; });
                if (sender) sender.replaceTrack(newVideoTrack);
            });
        }
        diag('Caméra changée avec succès.', 'success');
    } catch (err) {
        diag('Erreur changement de caméra : ' + err.message, 'error');
    }
}
function bumpStrength() {
    strengthCount++;
    document.getElementById('strengthCount').textContent = strengthCount;
    spawnFloatingReaction('💪');
}

// ═══════════════════════════════════════════════════════════
// 16. TERMINER / QUITTER
// ═══════════════════════════════════════════════════════════
async function stopLive() {
    if (!confirm('Terminer ton live ?')) return;
    diag('Fin du live (hôte)…');
    await sb.from(TBL_SESSIONS).update({
        is_active: false, ended_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - liveStartTime) / 1000)
    }).eq('id', currentLiveId);
    diag('Session marquée inactive en base.', 'success');
    leaveLive();
}

function leaveLive() {
    diag('Sortie de la room live.');
    if (durationTimer) clearInterval(durationTimer);
    if (chatChannel) { chatChannel.unsubscribe(); chatChannel = null; }
    if (currentCall) { currentCall.close(); currentCall = null; }
    if (peer) { peer.destroy(); peer = null; }
    if (localStream && isHost) { localStream.getTracks().forEach(function(t) { t.stop(); }); localStream = null; }
    if (previewStream) { previewStream.getTracks().forEach(function(t) { t.stop(); }); previewStream = null; }

    currentLiveId = null; currentPeerId = null; isHost = false; strengthCount = 0;
    document.getElementById('strengthCount').textContent = '0';
    document.getElementById('liveRoomView').style.display = 'none';
    document.getElementById('livesListView').style.display = 'block';
    document.getElementById('liveChatMessages').innerHTML = '';
    loadLives();
}

// ═══════════════════════════════════════════════════════════
// 17. MODALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ═══════════════════════════════════════════════════════════
// 18. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    showLoader('Chargement…');
    const user = await checkSession();
    if (!user) { hideLoader(); return; }
    await loadProfile();
    hideLoader();

    await loadLives();
    subscribeToLivesList();

    document.getElementById('diagToggleBtn').addEventListener('click', function() {
        const panel = document.getElementById('diagPanel');
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        this.classList.remove('has-error');
    });
    document.getElementById('diagCloseBtn').addEventListener('click', function() { document.getElementById('diagPanel').style.display = 'none'; });

    document.getElementById('startLiveBtn').addEventListener('click', function() { openModal('modalStartLive'); });
    document.getElementById('cancelStartLiveBtn').addEventListener('click', function() {
        if (previewStream) { previewStream.getTracks().forEach(function(t) { t.stop(); }); previewStream = null; }
        document.getElementById('cameraPreviewOverlay').style.display = 'flex';
        document.getElementById('goLiveBtn').disabled = true;
        closeModal('modalStartLive');
    });
    document.getElementById('closeStartLiveModalBtn').addEventListener('click', function() { document.getElementById('cancelStartLiveBtn').click(); });
    document.getElementById('previewCamBtn').addEventListener('click', activateCameraPreview);
    document.getElementById('goLiveBtn').addEventListener('click', startLive);

    document.getElementById('stopLiveBtn').addEventListener('click', stopLive);
    document.getElementById('leaveLiveBtn').addEventListener('click', leaveLive);
    document.getElementById('toggleCamBtn').addEventListener('click', toggleCam);
    document.getElementById('toggleMicBtn').addEventListener('click', toggleMic);
    document.getElementById('flipCamBtn').addEventListener('click', flipCamera);
    document.getElementById('strengthBtn').addEventListener('click', bumpStrength);
    document.getElementById('reactBtn').addEventListener('click', function() { openModal('modalReact'); });
    document.getElementById('openGiftBtn').addEventListener('click', function() { openModal('modalGifts'); });
    document.getElementById('shareBtn').addEventListener('click', function() {
        const url = window.location.href;
        navigator.clipboard?.writeText(url);
        toast('Lien copié !', 'success', 3000);
    });

    document.getElementById('closeGiftsModalBtn').addEventListener('click', function() { closeModal('modalGifts'); });
    document.getElementById('closeReactModalBtn').addEventListener('click', function() { closeModal('modalReact'); });
    document.getElementById('emojiReactGrid').querySelectorAll('span').forEach(function(el) {
        el.addEventListener('click', function() { sendReaction(this.dataset.emoji); });
    });

    document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
    document.getElementById('liveChatInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') sendChatMessage(); });
    document.getElementById('chatEmojiRow').querySelectorAll('span').forEach(function(el) {
        el.addEventListener('click', function() {
            const input = document.getElementById('liveChatInput');
            input.value += this.dataset.emoji;
            input.focus();
        });
    });
    document.getElementById('clearChatBtn').addEventListener('click', function() {
        if (confirm('Effacer le chat localement ?')) document.getElementById('liveChatMessages').innerHTML = '';
    });

    diag('Page prête. En attente d\'action.', 'success');

    window.addEventListener('beforeunload', function() {
        if (currentLiveId && isHost) {
            sb.from(TBL_SESSIONS).update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', currentLiveId);
        }
        localStream?.getTracks().forEach(function(t) { t.stop(); });
        previewStream?.getTracks().forEach(function(t) { t.stop(); });
        peer?.destroy();
        livesListChannel?.unsubscribe();
    });
});
