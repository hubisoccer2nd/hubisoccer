// ============================================================
//  HUBISOCCER — LIVE.JS
//  Page Lives en direct — PeerJS + Supabase Realtime
//  Utilise utils.js et session.js
// ============================================================

'use strict';

// Début configuration Supabase
const SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb;
// Fin configuration Supabase

// Début état global
let currentUser       = null;
let currentProfile    = null;
let peer              = null;
let localStream       = null;
let currentCall       = null;
let currentLiveId     = null;
let isHost            = false;
let liveStartTime     = null;
let durationTimer     = null;
let viewersTimer      = null;
let chatChannel       = null;
let cameraStream      = null;
let micEnabled        = true;
let camEnabled        = true;
let facingMode        = 'user';
let strengthCount     = 0;
// Fin état global

// Début configuration des cadeaux
const GIFTS = [
    { id:'ball', emoji:'⚽', name:'Ballon', price:10 },
    { id:'trophy', emoji:'🏆', name:'Trophée', price:50 },
    { id:'star', emoji:'⭐', name:'Étoile', price:20 },
    { id:'fire', emoji:'🔥', name:'Feu', price:5 },
    { id:'medal', emoji:'🏅', name:'Médaille', price:30 },
    { id:'diamond', emoji:'💎', name:'Diamant', price:100 },
    { id:'crown', emoji:'👑', name:'Couronne', price:200 },
    { id:'rocket', emoji:'🚀', name:'Fusée', price:75 }
];
// Fin configuration des cadeaux

// Début session et profil
async function initSessionAndProfile() {
    const user = await checkSession();
    if (!user) return false;
    currentUser = user;

    const profile = await loadProfile(user.id);
    if (!profile) return false;
    currentProfile = profile;

    document.getElementById('liveUserName').textContent = profile.full_name || profile.display_name || 'Utilisateur';
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name, 'liveUser');
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name, 'chatUser');

    return true;
}

function updateAvatarDisplay(avatarUrl, fullName, type) {
    const avatar = document.getElementById(type === 'liveUser' ? 'liveUserAvatar' : 'chatUserAvatar');
    const initials = document.getElementById(type === 'liveUser' ? 'liveUserAvatarInitials' : 'chatUserAvatarInitials');
    if (!avatar || !initials) return;
    const text = getInitials(fullName);
    if (avatarUrl && avatarUrl !== '') {
        avatar.src = avatarUrl;
        avatar.style.display = 'block';
        initials.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = text;
    }
}
// Fin session et profil

// Début chargement des lives
async function loadLives() {
    const { data, error } = await sb
        .from('supabaseAuthPrive_live_sessions')
        .select('*, host:host_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('is_active', true)
        .order('started_at', { ascending: false });

    const grid = document.getElementById('livesGrid');
    if (error || !data || data.length === 0) {
        grid.innerHTML = `<div class="lives-empty"><i class="fas fa-broadcast-tower" style="font-size:2.5rem;opacity:0.2"></i><p>Aucun live en ce moment.<br>Sois le premier à démarrer !</p></div>`;
    } else {
        grid.innerHTML = data.map(l => makeLiveCard(l)).join('');
        grid.querySelectorAll('.live-card').forEach((card, i) => {
            card.addEventListener('click', () => joinLive(data[i]));
        });
    }
    loadPastLives();
}

function makeLiveCard(l) {
    const host = l.host || {};
    const hostName = host.full_name || host.display_name || 'Hôte';
    const avatarUrl = host.avatar_url;
    const initials = getInitials(hostName);
    return `
        <div class="live-card">
            <div class="live-card-thumb">
                ${avatarUrl ? `<img src="${avatarUrl}" alt="" style="display:block;">` : ''}
                <div class="live-card-thumb-placeholder"><i class="fas fa-video"></i></div>
                <div class="live-card-overlay"></div>
                <div class="live-card-badge"><i class="fas fa-circle" style="font-size:0.5rem"></i> LIVE</div>
                <div class="live-card-viewers"><i class="fas fa-eye"></i> ${l.viewers_count || 0}</div>
            </div>
            <div class="live-card-body">
                <div class="live-card-title">${escapeHtml(l.title || 'Live sans titre')}</div>
                <div class="live-card-host">
                    ${avatarUrl ? `<img src="${avatarUrl}" alt="">` : `<div class="live-card-host-initials">${initials}</div>`}
                    <span class="live-card-host-name">${escapeHtml(hostName)}</span>
                </div>
                ${host.role_code ? `<div class="live-card-sport">${escapeHtml(host.role_code)}</div>` : ''}
            </div>
        </div>
    `;
}

async function loadPastLives() {
    const { data } = await sb
        .from('supabaseAuthPrive_live_sessions')
        .select('*, host:host_hubisoccer_id(full_name, display_name)')
        .eq('is_active', false)
        .order('ended_at', { ascending: false })
        .limit(8);

    const grid = document.getElementById('pastLivesGrid');
    if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:0.8rem">Aucun live récent</p>';
        return;
    }
    grid.innerHTML = data.map(l => `
        <div class="past-live-item">
            <div class="past-live-title">${escapeHtml(l.title || 'Live terminé')}</div>
            <div class="past-live-meta">
                ${l.host?.full_name || '—'} · ${l.max_viewers || 0} spectateurs max
                ${l.ended_at ? ` · ${new Date(l.ended_at).toLocaleDateString('fr-FR')}` : ''}
            </div>
        </div>
    `).join('');
}
// Fin chargement des lives

// Début gestion des lives
async function startLive() {
    const title = document.getElementById('liveTitle').value.trim();
    if (!title) { toast('Donne un titre à ton live', 'warning'); return; }

    const btn = document.getElementById('goLiveBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Démarrage...';

    try {
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        }

        const { data: session, error } = await sb.from('supabaseAuthPrive_live_sessions').insert({
            host_hubisoccer_id: currentProfile.hubisoccer_id,
            title,
            description: document.getElementById('liveDescription').value.trim() || null,
            category: document.getElementById('liveCategory').value,
            is_active: true,
            viewers_count: 0,
            max_viewers: 0,
            started_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;
        currentLiveId = session.id;
        isHost = true;

        peer = new Peer(currentLiveId);
        peer.on('open', (id) => {
            console.log('Peer ID:', id);
            closeModal('modalStartLive');
            enterLiveRoom(session, localStream, true);
        });
        peer.on('call', (call) => {
            call.answer(localStream);
            call.on('stream', (stream) => {
                document.getElementById('remoteVideo').srcObject = stream;
            });
        });
        peer.on('error', (err) => { toast('Erreur PeerJS : ' + err.type, 'error'); });

        await notifyFollowers(session);
    } catch (err) {
        console.error('Erreur démarrage live:', err);
        if (err.name === 'NotAllowedError') toast('Autorise l\'accès à la caméra et au micro', 'warning');
        else toast('Erreur démarrage : ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-circle"></i> Go Live !';
    }
}

async function notifyFollowers(session) {
    const { data: followers } = await sb
        .from('supabaseAuthPrive_follows')
        .select('follower_hubisoccer_id')
        .eq('following_hubisoccer_id', currentProfile.hubisoccer_id)
        .limit(100);
    if (!followers || !followers.length) return;
    const notifs = followers.map(f => ({
        recipient_hubisoccer_id: f.follower_hubisoccer_id,
        type: 'live',
        title: 'Nouveau live',
        message: `${currentProfile.full_name || currentProfile.display_name} est en live : "${session.title}"`,
        data: { link: `live.html?room=${session.id}` }
    }));
    await sb.from('supabaseAuthPrive_notifications').insert(notifs);
}

async function joinLive(liveSession) {
    try {
        currentLiveId = liveSession.id;
        isHost = false;

        peer = new Peer();
        peer.on('open', () => {
            const call = peer.call(liveSession.id, null);
            call.on('stream', (stream) => {
                currentCall = call;
                enterLiveRoom(liveSession, stream, false);
            });
            call.on('close', () => { toast('Le live est terminé', 'info'); leaveLive(); });
        });
        peer.on('error', () => { toast('Impossible de rejoindre ce live', 'error'); });

        const newCount = (liveSession.viewers_count || 0) + 1;
        await sb.from('supabaseAuthPrive_live_sessions').update({
            viewers_count: newCount,
            max_viewers: Math.max(liveSession.max_viewers || 0, newCount)
        }).eq('id', liveSession.id);
    } catch (err) {
        toast('Erreur connexion au live : ' + err.message, 'error');
    }
}

function enterLiveRoom(session, stream, host) {
    document.getElementById('livesListView').style.display = 'none';
    document.getElementById('liveRoomView').style.display = 'block';

    if (host) {
        const localVid = document.getElementById('localVideo');
        localVid.srcObject = stream;
        localVid.style.display = 'block';
        document.getElementById('stopLiveBtn').style.display = 'flex';
        document.getElementById('toggleCamBtn').style.display = 'flex';
        document.getElementById('toggleMicBtn').style.display = 'flex';
        document.getElementById('flipCamBtn').style.display = 'flex';
    } else {
        document.getElementById('remoteVideo').srcObject = stream;
    }

    const hostProfile = session.host || {};
    const hostName = hostProfile.full_name || hostProfile.display_name || 'Hôte';
    document.getElementById('liveHostName').textContent = hostName;
    document.getElementById('liveHostTitle').textContent = session.title || '';

    const hostAvatar = document.getElementById('liveHostAvatar');
    const hostInitials = document.getElementById('liveHostAvatarInitials');
    if (hostProfile.avatar_url && hostProfile.avatar_url !== '') {
        hostAvatar.src = hostProfile.avatar_url;
        hostAvatar.style.display = 'block';
        hostInitials.style.display = 'none';
    } else {
        hostAvatar.style.display = 'none';
        hostInitials.style.display = 'flex';
        hostInitials.textContent = getInitials(hostName);
    }

    liveStartTime = Date.now();
    durationTimer = setInterval(updateDuration, 1000);
    viewersTimer = setInterval(refreshViewers, 10000);

    subscribeToChat(session.id);
    addSystemMessage(`${host ? 'Tu as démarré' : 'Tu as rejoint'} le live de ${hostName}. Bienvenue ! 👋`);
    toast(host ? '🔴 Tu es en live !' : 'Live rejoint !', host ? 'error' : 'success');
}

function updateDuration() {
    const elapsed = Math.floor((Date.now() - liveStartTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById('liveDuration').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

async function refreshViewers() {
    if (!currentLiveId) return;
    const { data } = await sb.from('supabaseAuthPrive_live_sessions').select('viewers_count').eq('id', currentLiveId).single();
    if (data) document.getElementById('viewersCount').textContent = data.viewers_count || 0;
}
// Fin gestion des lives

// Début chat temps réel
function subscribeToChat(liveId) {
    chatChannel = sb.channel(`live_chat_${liveId}`)
        .on('broadcast', { event: 'chat_message' }, (payload) => {
            if (payload.payload.user_id !== currentProfile.hubisoccer_id) {
                addChatMessage(payload.payload);
            }
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
            spawnFloatingEmoji(payload.payload.emoji);
        })
        .on('broadcast', { event: 'gift' }, (payload) => {
            addGiftMessage(payload.payload);
        })
        .on('broadcast', { event: 'strength' }, (payload) => {
            strengthCount = payload.payload.count || 0;
            document.getElementById('strengthCount').textContent = strengthCount;
        })
        .subscribe();
}

async function sendChatMessage() {
    const input = document.getElementById('liveChatInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';

    const msg = {
        user_id: currentProfile.hubisoccer_id,
        author: currentProfile.full_name || currentProfile.display_name || 'Utilisateur',
        avatar: currentProfile.avatar_url,
        text: content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addChatMessage(msg, true);
    await chatChannel?.send({ type: 'broadcast', event: 'chat_message', payload: msg });
    await sb.from('supabaseAuthPrive_live_chat_messages').insert({
        live_session_id: currentLiveId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content
    });
}

function addChatMessage(msg, isOwn = false) {
    const area = document.getElementById('liveChatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${isOwn ? 'own' : ''}`;
    div.innerHTML = `
        ${!isOwn ? (msg.avatar ? `<img class="chat-msg-avatar" src="${msg.avatar}" alt="">` : `<div class="chat-msg-avatar-initials">${getInitials(msg.author)}</div>`) : ''}
        <div class="chat-msg-bubble">
            ${!isOwn ? `<div class="chat-msg-author">${escapeHtml(msg.author)}</div>` : ''}
            <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
            <div class="chat-msg-time">${msg.time || ''}</div>
        </div>
    `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

function addSystemMessage(text) {
    const area = document.getElementById('liveChatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg system';
    div.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(text)}</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

function addGiftMessage(payload) {
    const area = document.getElementById('liveChatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg gift';
    div.innerHTML = `<div class="chat-msg-bubble">🎁 <strong>${escapeHtml(payload.author)}</strong> a envoyé ${payload.emoji} ${payload.giftName} (${payload.price} HubiCoins) !</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    spawnFloatingEmoji(payload.emoji);
}

function spawnFloatingEmoji(emoji) {
    const container = document.getElementById('floatingReactions');
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = (10 + Math.random() * 60) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

async function sendReaction(emoji) {
    closeModal('modalReact');
    spawnFloatingEmoji(emoji);
    await chatChannel?.send({ type: 'broadcast', event: 'reaction', payload: { emoji, user_id: currentProfile.hubisoccer_id } });
}
window.sendReaction = sendReaction;

async function sendStrength() {
    strengthCount++;
    document.getElementById('strengthCount').textContent = strengthCount;
    spawnFloatingEmoji('💪');
    await chatChannel?.send({ type: 'broadcast', event: 'strength', payload: { count: strengthCount, user_id: currentProfile.hubisoccer_id } });
    addSystemMessage(`💪 Énergie envoyée ! Total : ${strengthCount}`);
}
// Fin chat temps réel

// Début contrôles caméra/micro
function toggleMic() {
    if (!localStream) return;
    micEnabled = !micEnabled;
    localStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
    const btn = document.getElementById('toggleMicBtn');
    btn.classList.toggle('muted', !micEnabled);
    btn.innerHTML = micEnabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
    toast(micEnabled ? 'Micro activé' : 'Micro coupé', 'info');
}

function toggleCam() {
    if (!localStream) return;
    camEnabled = !camEnabled;
    localStream.getVideoTracks().forEach(t => t.enabled = camEnabled);
    const btn = document.getElementById('toggleCamBtn');
    btn.classList.toggle('muted', !camEnabled);
    btn.innerHTML = camEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
    toast(camEnabled ? 'Caméra activée' : 'Caméra coupée', 'info');
}

async function flipCamera() {
    if (!localStream || !isHost) return;
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    localStream.getTracks().forEach(t => t.stop());
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        toast('Caméra retournée', 'info');
    } catch (err) {
        toast('Impossible de retourner la caméra', 'error');
    }
}

async function stopLive() {
    if (!confirm('Terminer ton live ?')) return;
    await sb.from('supabaseAuthPrive_live_sessions').update({
        is_active: false,
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - liveStartTime) / 1000)
    }).eq('id', currentLiveId);
    addSystemMessage('Le live est terminé. Merci à tous ! 👋');
    setTimeout(leaveLive, 2000);
}

function leaveLive() {
    clearInterval(durationTimer);
    clearInterval(viewersTimer);
    localStream?.getTracks().forEach(t => t.stop());
    currentCall?.close();
    peer?.destroy();
    chatChannel?.unsubscribe();

    if (!isHost && currentLiveId) {
        sb.from('supabaseAuthPrive_live_sessions').select('viewers_count').eq('id', currentLiveId).single().then(({ data }) => {
            if (data) sb.from('supabaseAuthPrive_live_sessions').update({ viewers_count: Math.max(0, (data.viewers_count || 1) - 1) }).eq('id', currentLiveId);
        });
    }

    document.getElementById('liveRoomView').style.display = 'none';
    document.getElementById('livesListView').style.display = 'block';
    currentLiveId = null; isHost = false; peer = null; localStream = null;
    loadLives();
    toast('Live quitté', 'info');
}
// Fin contrôles caméra/micro

// Début preview caméra
async function previewCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        document.getElementById('cameraPreview').srcObject = cameraStream;
        localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        document.querySelector('.camera-preview-overlay').style.display = 'none';
        document.getElementById('goLiveBtn').disabled = false;
        toast('Caméra prête ✅', 'success');
    } catch (err) {
        if (err.name === 'NotAllowedError') toast('Autorise l\'accès à la caméra', 'warning');
        else toast('Erreur caméra : ' + err.message, 'error');
    }
}

function appendEmoji(emoji) {
    const input = document.getElementById('liveChatInput');
    input.value += emoji;
    input.focus();
}
window.appendEmoji = appendEmoji;

function shareLive() {
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/live.html?room=${currentLiveId}`;
    navigator.clipboard.writeText(url);
    toast('Lien du live copié !', 'success');
}

async function sendGift(gift) {
    closeModal('modalGifts');
    spawnFloatingEmoji(gift.emoji);
    const msg = {
        author: currentProfile.full_name || currentProfile.display_name,
        avatar: currentProfile.avatar_url,
        emoji: gift.emoji,
        giftName: gift.name,
        price: gift.price
    };
    addGiftMessage(msg);
    await chatChannel?.send({ type: 'broadcast', event: 'gift', payload: msg });
    await sb.from('supabaseAuthPrive_live_gifts').insert({
        live_session_id: currentLiveId,
        sender_hubisoccer_id: currentProfile.hubisoccer_id,
        gift_type: gift.id,
        gift_price: gift.price,
        emoji: gift.emoji
    });
    toast(`${gift.emoji} Cadeau envoyé !`, 'success');
}
window.sendGift = sendGift;

function buildGiftsGrid() {
    const grid = document.getElementById('giftsGrid');
    grid.innerHTML = GIFTS.map(g => `
        <div class="gift-item" onclick="sendGift(${JSON.stringify(g).replace(/"/g, '&quot;')})">
            <div class="gift-emoji">${g.emoji}</div>
            <div class="gift-name">${g.name}</div>
            <div class="gift-price">${g.price} 🪙</div>
        </div>
    `).join('');
}
// Fin preview caméra

// Début initialisation
async function init() {
    setLoader(true, 'Chargement du profil...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    await loadLives();
    buildGiftsGrid();
    setLoader(false);

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
        const { data } = await sb.from('supabaseAuthPrive_live_sessions')
            .select('*, host:host_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
            .eq('id', roomId).eq('is_active', true).single();
        if (data) joinLive(data);
        else toast('Ce live est terminé ou introuvable', 'warning');
    }

    document.getElementById('startLiveBtn').addEventListener('click', () => {
        document.getElementById('liveTitle').value = '';
        document.getElementById('liveDescription').value = '';
        document.getElementById('goLiveBtn').disabled = true;
        document.querySelector('.camera-preview-overlay').style.display = 'flex';
        openModal('modalStartLive');
    });

    document.getElementById('previewCamBtn').addEventListener('click', previewCamera);
    document.getElementById('goLiveBtn').addEventListener('click', startLive);

    document.getElementById('toggleMicBtn').addEventListener('click', toggleMic);
    document.getElementById('toggleCamBtn').addEventListener('click', toggleCam);
    document.getElementById('flipCamBtn').addEventListener('click', flipCamera);
    document.getElementById('stopLiveBtn').addEventListener('click', stopLive);
    document.getElementById('leaveLiveBtn').addEventListener('click', leaveLive);

    document.getElementById('strengthBtn').addEventListener('click', sendStrength);
    document.getElementById('openGiftBtn').addEventListener('click', () => openModal('modalGifts'));
    document.getElementById('shareBtn').addEventListener('click', shareLive);
    document.getElementById('reactBtn').addEventListener('click', () => openModal('modalReact'));

    const chatInput = document.getElementById('liveChatInput');
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });
    document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
    document.getElementById('clearChatBtn').addEventListener('click', () => {
        document.getElementById('liveChatMessages').innerHTML = '';
    });

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });

    window.addEventListener('beforeunload', () => {
        if (currentLiveId && isHost) {
            sb.from('supabaseAuthPrive_live_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', currentLiveId);
        }
        localStream?.getTracks().forEach(t => t.stop());
        peer?.destroy();
    });
}

document.addEventListener('DOMContentLoaded', init);
// Fin initialisation