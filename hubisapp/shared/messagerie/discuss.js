// ============================================================
//  HUBISOCCER — DISCUSS.JS (VERSION FINALE EXHAUSTIVE)
//  Chat intérieur — Tous rôles
//  TOUTES les fonctionnalités sont implémentées et fonctionnelles
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let currentConvId = null;
let currentConv = null;
let messages = [];
let pinnedMessages = [];
let msgSubscription = null;
let typingSubscription = null;
let presenceChannel = null;
let onlineUsers = new Set();

// Pagination
const PAGE_SIZE = 40;
let oldestMsgDate = null;
let hasMoreMsgs = false;

// Saisie en cours
let pendingReply = null;
let editingMsgId = null;
let pendingFile = null;
let pendingAudioBlob = null;

// Contexte menu
let ctxMsgId = null;

// Frappe
let typingTimeout = null;
let isTyping = false;

// Recherche dans messages
let searchMatches = [];
let searchIdx = -1;
let currentSearchQuery = '';

// Audio recorder
let mediaRecorder = null;
let audioChunks = [];
let recInterval = null;
let recSeconds = 0;
let recAudioDuration = 0;      // durée du vocal en cours (envoyée avec le message)
let recAudioMime = '';         // format réellement utilisé par MediaRecorder

// Blocage (1-à-1)
let conversationBlocked = false;

// Marquage "distribué / lu" (anti-doublons)
let deliveryMarked = new Set();
let readMarked = new Set();

// Mode sombre
let darkMode = localStorage.getItem('hubisoccer_dark_mode') === 'true';

// Émojis
const EMOJI_LIST = ['😊','😂','❤️','👍','😢','😮','🔥','⚽','👏','🎉','🙏','😡','🥳','🌟','💪','🏆','🤔','🎵','📷','🎬','🏀','🏈','⚾','🎾','🏐'];

// Messages programmés
let scheduledMessages = JSON.parse(localStorage.getItem('hubisoccer_scheduled_messages') || '[]');

// Sondages
let activePoll = null;

// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await window.requireAuth();
        if (!auth) return false;
        
        // 🔥 Attendre que currentProfile soit chargé par session.js
        let attempts = 0;
        while ((!currentProfile || !currentProfile.hubisoccer_id) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Profil non chargé. Redirection...', 'error');
            window.location.href = '../community/feed-setup.html';
            return false;
        }
        return true;
    } catch (err) {
        toast('Erreur de session : ' + err.message, 'error');
        return false;
    }
}

function updateAvatarDisplay(avatarUrl, fullName, imgId, initialsId) {
    const img = document.getElementById(imgId);
    const initials = document.getElementById(initialsId);
    if (!img || !initials) return;
    const text = getInitials(fullName);
    if (avatarUrl && avatarUrl !== '') {
        img.src = avatarUrl;
        img.style.display = 'block';
        initials.style.display = 'none';
    } else {
        img.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = text;
    }
}
// ========== FIN : SESSION & PROFIL ==========

// ========== DEBUT : CHARGEMENT DE LA CONVERSATION ==========
async function loadConversation(convId) {
    const { data, error } = await sb
        .from('supabaseAuthPrive_conversations')
        .select(`
            id, is_group, group_name, group_avatar, group_description, created_by, updated_at,
            participants:supabaseAuthPrive_conversation_participants (
                user_hubisoccer_id, is_admin,
                profile:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url, last_seen )
            )
        `)
        .eq('id', convId)
        .single();

    if (error || !data) {
        toast('Conversation introuvable', 'error');
        goBack();
        return;
    }
    currentConv = data;

    const isMember = data.participants?.some(p => p.user_hubisoccer_id === currentProfile.hubisoccer_id);
    if (!isMember) {
        toast('Accès refusé', 'error');
        goBack();
        return;
    }

    if (data.is_group) {
        document.getElementById('contactName').textContent = data.group_name || 'Groupe';
        updateAvatarDisplay(data.group_avatar, data.group_name || 'Groupe', 'contactAvatar', 'contactAvatarInitials');
        const count = data.participants?.length || 0;
        document.getElementById('contactStatus').textContent = `${count} participant${count > 1 ? 's' : ''} · toucher pour infos`;
        document.title = `${data.group_name} | HubISoccer`;
        document.getElementById('optViewProfile').style.display = 'none';
        document.getElementById('optBlockUser').style.display = 'none';
        const optGroupInfo = document.getElementById('optGroupInfo');
        if (optGroupInfo) optGroupInfo.style.display = 'flex';
    } else {
        const other = data.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
        const prof = other?.profile || {};
        const name = prof.full_name || prof.display_name || 'Utilisateur';
        document.getElementById('contactName').textContent = name;
        updateAvatarDisplay(prof.avatar_url, name, 'contactAvatar', 'contactAvatarInitials');
        document.getElementById('contactStatus').textContent = prof.last_seen ? `Vu il y a ${timeSince(prof.last_seen)}` : 'Hors ligne';
        document.title = `${name} | HubISoccer`;
        await checkBlockedState(other?.user_hubisoccer_id);
    }

    // Clic sur l'en-tête : infos du groupe, ou profil du contact
    const chatContact = document.getElementById('chatContact');
    if (chatContact && !chatContact.dataset.wired) {
        chatContact.dataset.wired = '1';
        chatContact.addEventListener('click', () => {
            if (currentConv?.is_group) {
                openGroupInfo();
            } else {
                const other = currentConv?.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
                if (other) window.location.href = `../community/profil-feed.html?id=${other.user_hubisoccer_id}`;
            }
        });
    }
}

// Vérifie si un blocage existe dans un sens ou dans l'autre (1-à-1)
async function checkBlockedState(otherId) {
    if (!otherId) return;
    const { data } = await sb
        .from('supabaseAuthPrive_blocked_users')
        .select('user_hubisoccer_id, blocked_hubisoccer_id')
        .or(`and(user_hubisoccer_id.eq.${currentProfile.hubisoccer_id},blocked_hubisoccer_id.eq.${otherId}),and(user_hubisoccer_id.eq.${otherId},blocked_hubisoccer_id.eq.${currentProfile.hubisoccer_id})`);

    conversationBlocked = (data || []).length > 0;
    const notice = document.getElementById('blockedNotice');
    if (notice) notice.style.display = conversationBlocked ? 'flex' : 'none';
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = conversationBlocked;
}

function goBack() {
    window.location.href = 'conversation.html';
}
// ========== FIN : CHARGEMENT DE LA CONVERSATION ==========

// ========== DEBUT : CHARGEMENT DES MESSAGES ==========
async function loadMessages(before = null) {
    // 🔥 Correction : on récupère tous les messages SANS le filtre deleted_for
    let query = sb
        .from('supabaseAuthPrive_messages')
        .select(`
            id, conversation_id, user_hubisoccer_id, content, media_url, media_type,
            reply_to_id, deleted_for, reactions, edited, pinned, read_by, created_at,
            delivered_to, listened_by, duration_seconds, expires_at,
            author:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )
        `)
        .eq('conversation_id', currentConvId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) {
        toast('Erreur chargement messages', 'error');
        return [];
    }

    // Filtrage JavaScript : messages supprimés pour moi + messages éphémères expirés
    const now = Date.now();
    const visibleMsgs = (data || []).filter(msg => {
        const deleted = msg.deleted_for || [];
        if (deleted.includes(currentProfile.hubisoccer_id)) return false;
        if (msg.expires_at && new Date(msg.expires_at).getTime() < now) {
            // Message éphémère expiré : purge en arrière-plan
            sb.from('supabaseAuthPrive_messages').delete().eq('id', msg.id).then(() => {});
            return false;
        }
        return true;
    });

    hasMoreMsgs = visibleMsgs.length > PAGE_SIZE;
    const msgs = hasMoreMsgs ? visibleMsgs.slice(1) : visibleMsgs;
    return msgs.reverse();
}

async function initMessages() {
    document.getElementById('msgLoader').style.display = 'flex';
    document.getElementById('messagesContainer').innerHTML = '';

    messages = await loadMessages();
    if (messages.length > 0) oldestMsgDate = messages[0].created_at;

    document.getElementById('loadMoreBtn').style.display = hasMoreMsgs ? 'block' : 'none';
    renderAllMessages();
    scrollToBottom(false);

    await markDeliveredForLoaded();
    await markAsRead();
    loadPinnedMessages();
    document.getElementById('msgLoader').style.display = 'none';
}
// ========== FIN : CHARGEMENT DES MESSAGES ==========

// ========== DEBUT : RENDU DES MESSAGES ==========
function renderAllMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    if (messages.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray);font-size:0.88rem">
            <i class="fas fa-comment-dots" style="font-size:2rem;margin-bottom:10px;opacity:0.3"></i>
            <p>Aucun message. Soyez le premier à écrire !</p>
        </div>`;
        return;
    }

    let lastDate = null;
    let lastSender = null;

    messages.forEach((msg, idx) => {
        const msgDate = new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        if (msgDate !== lastDate) {
            container.appendChild(makeDateSeparator(msgDate));
            lastDate = msgDate;
            lastSender = null;
        }
        const isSameSender = msg.user_hubisoccer_id === lastSender;
        container.appendChild(makeMessageRow(msg, isSameSender));
        lastSender = msg.user_hubisoccer_id;
    });

    // Surligner les résultats de recherche s'il y en a
    if (currentSearchQuery) {
        highlightSearchResults(currentSearchQuery);
    }
}

function makeDateSeparator(label) {
    const el = document.createElement('div');
    el.className = 'date-separator';
    el.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    return el;
}

function makeMessageRow(msg, hideAvatar = false) {
    // Messages système (créations, ajouts, départs de groupe...)
    if (msg.media_type === 'system') {
        const sys = document.createElement('div');
        sys.className = 'system-msg';
        sys.dataset.msgId = msg.id;
        sys.innerHTML = `<span>${escapeHtml(msg.content || '')}</span>`;
        return sys;
    }

    const isOwn = msg.user_hubisoccer_id === currentProfile.hubisoccer_id;
    const row = document.createElement('div');
    row.className = `msg-row ${isOwn ? 'outgoing' : 'incoming'}`;
    row.dataset.msgId = msg.id;

    if (!isOwn) {
        const author = msg.author || {};
        const name = author.full_name || author.display_name || 'Utilisateur';
        const avatarUrl = author.avatar_url;
        const initials = getInitials(name);

        const avatarWrap = document.createElement('div');
        avatarWrap.className = `msg-avatar-wrap ${hideAvatar ? 'hidden' : ''}`;
        if (avatarUrl) {
            avatarWrap.innerHTML = `<img class="msg-avatar" src="${avatarUrl}" alt="${escapeHtml(name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        const initialsDiv = document.createElement('div');
        initialsDiv.className = 'msg-avatar-initials';
        initialsDiv.style.display = avatarUrl ? 'none' : 'flex';
        initialsDiv.textContent = initials;
        avatarWrap.appendChild(initialsDiv);
        row.appendChild(avatarWrap);
    }

    const wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap';

    if (!isOwn && currentConv?.is_group && !hideAvatar) {
        const author = msg.author || {};
        const name = author.full_name || author.display_name || 'Utilisateur';
        const nameEl = document.createElement('div');
        nameEl.className = 'msg-sender-name';
        nameEl.textContent = name;
        wrap.appendChild(nameEl);
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.dataset.msgId = msg.id;
    bubble.addEventListener('contextmenu', (e) => { e.preventDefault(); showContextMenu(e, msg); });

    // Clic simple : sélection quand le mode multiple est actif
    bubble.addEventListener('click', (e) => {
        if (msgSelectionMode) {
            e.preventDefault();
            e.stopPropagation();
            toggleMsgSelection(msg.id);
        }
    });

    // Tactile : appui long = sélection multiple, glisser vers la droite = répondre
    let pressTimer = null;
    let touchStartX = 0, touchStartY = 0, swiping = false, longPressFired = false;

    bubble.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        swiping = false;
        longPressFired = false;
        pressTimer = setTimeout(() => {
            longPressFired = true;
            if (!msgSelectionMode) enterMsgSelection(msg.id);
            else toggleMsgSelection(msg.id);
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    }, { passive: true });

    bubble.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = Math.abs(t.clientY - touchStartY);
        if (Math.abs(dx) > 8 || dy > 8) clearTimeout(pressTimer);
        // Glissement horizontal vers la droite pour répondre
        if (!msgSelectionMode && dx > 12 && dy < 40) {
            swiping = true;
            const shift = Math.min(dx - 12, 70);
            bubble.style.transform = `translateX(${shift}px)`;
            bubble.style.transition = 'none';
            bubble.classList.toggle('swipe-ready', shift >= 55);
        }
    }, { passive: true });

    const endTouch = () => {
        clearTimeout(pressTimer);
        if (swiping) {
            const ready = bubble.classList.contains('swipe-ready');
            bubble.style.transition = 'transform 0.2s ease';
            bubble.style.transform = '';
            bubble.classList.remove('swipe-ready');
            if (ready) {
                startReply(msg);
                if (navigator.vibrate) navigator.vibrate(20);
            }
            swiping = false;
        }
    };
    bubble.addEventListener('touchend', endTouch);
    bubble.addEventListener('touchcancel', endTouch);

    if (msg.reply_to_id) {
        const replyEl = makeReplyQuote(msg.reply_to_id);
        bubble.appendChild(replyEl);
    }

    if (msg.content) {
        const textEl = document.createElement('span');
        textEl.innerHTML = formatMsgText(msg.content);
        if (msg.edited) {
            textEl.innerHTML += ` <span class="msg-edited">(modifié)</span>`;
        }
        if (msg.pinned) {
            textEl.innerHTML += ` <i class="fas fa-thumbtack pin-icon"></i>`;
        }
        bubble.appendChild(textEl);

        // Bouton "Voir plus / Voir moins" pour les longs messages
        const plainText = stripFormatting(msg.content);
        if (plainText.length > 500) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'msg-expand-btn';
            toggleBtn.textContent = 'Voir plus';
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const span = bubble.querySelector('span');
                if (span.classList.contains('expanded')) {
                    span.classList.remove('expanded');
                    toggleBtn.textContent = 'Voir plus';
                } else {
                    span.classList.add('expanded');
                    toggleBtn.textContent = 'Voir moins';
                }
            });
            bubble.appendChild(toggleBtn);
            bubble.querySelector('span').classList.add('collapsed');
        }
    }

    if (msg.media_url) {
        const mediaEl = makeMediaElement(msg);
        if (mediaEl) bubble.appendChild(mediaEl);
    }

    // Aperçu des liens enrichi (Open Graph simple)
    if (msg.content) {
        const links = extractLinks(msg.content);
        links.forEach(link => {
            const preview = createLinkPreview(link);
            if (preview) bubble.appendChild(preview);
        });
    }

    wrap.appendChild(bubble);

    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        wrap.appendChild(makeReactionsBar(msg));
    }

    const metaEl = document.createElement('div');
    metaEl.className = 'msg-meta';
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    metaEl.innerHTML = `<span class="msg-time">${time}</span>`;
    if (isOwn) {
        metaEl.innerHTML += `<span class="msg-status">${getMsgStatusIcon(msg)}</span>`;
    }
    wrap.appendChild(metaEl);

    row.appendChild(wrap);
    return row;
}

function getMsgStatusIcon(msg) {
    // Nombre de destinataires (tous les participants sauf moi)
    const totalRecipients = Math.max(1, (currentConv?.participants?.length || 2) - 1);
    const readCount = (msg.read_by || []).filter(id => id !== currentProfile.hubisoccer_id).length;
    const deliveredCount = (msg.delivered_to || []).filter(id => id !== currentProfile.hubisoccer_id).length;
    const listenedCount = (msg.listened_by || []).filter(id => id !== currentProfile.hubisoccer_id).length;

    // Statut média : "Écouté" pour l'audio, "Vu" pour la vidéo
    let mediaStatus = '';
    if (msg.media_type === 'audio' && listenedCount >= totalRecipients) {
        mediaStatus = ` <i class="fas fa-headphones media-played" title="Écouté"></i>`;
    } else if (msg.media_type === 'video' && listenedCount >= totalRecipients) {
        mediaStatus = ` <i class="fas fa-eye media-played" title="Vue"></i>`;
    }

    if (readCount >= totalRecipients) {
        return `<i class="fas fa-check-double seen" title="Lu"></i>${mediaStatus}`;
    }
    if (deliveredCount >= totalRecipients || readCount > 0 || deliveredCount > 0) {
        return `<i class="fas fa-check-double delivered" title="Distribué"></i>${mediaStatus}`;
    }
    return `<i class="fas fa-check sent" title="Envoyé"></i>${mediaStatus}`;
}

function makeReplyQuote(replyToId) {
    const div = document.createElement('div');
    div.className = 'reply-quote';
    const original = messages.find(m => m.id === replyToId);
    if (original) {
        const author = original.author || {};
        const name = author.full_name || author.display_name || 'Utilisateur';
        div.innerHTML = `
            <div class="reply-quote-name">${escapeHtml(name)}</div>
            <div class="reply-quote-text">${escapeHtml(original.content?.substring(0, 80) || '📎 Média')}</div>
        `;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => scrollToMessage(replyToId));
    } else {
        div.innerHTML = `<div class="reply-quote-text">Message introuvable</div>`;
    }
    return div;
}

function makeMediaElement(msg) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-media';
    if (msg.media_type === 'image') {
        wrap.innerHTML = `<img src="${msg.media_url}" alt="Image" loading="lazy">`;
        wrap.querySelector('img').addEventListener('click', () => openMediaZoom(msg.media_url, 'image'));
    } else if (msg.media_type === 'video') {
        wrap.innerHTML = `<video src="${msg.media_url}" controls preload="metadata" playsinline></video>`;
        // Marquage "Vue" quand le destinataire lance la vidéo
        wrap.querySelector('video').addEventListener('play', () => markMediaListened(msg), { once: true });
    } else if (msg.media_type === 'audio') {
        wrap.appendChild(buildAudioPlayer(msg));
    } else if (msg.media_type === 'file') {
        wrap.innerHTML = `
            <a class="msg-file-link" href="${msg.media_url}" target="_blank" download>
                <i class="fas fa-file-alt"></i>
                <span>${escapeHtml(msg.content || 'Fichier')}</span>
                <i class="fas fa-download"></i>
            </a>`;
    } else if (msg.media_type === 'poll') {
        // Sondage
        wrap.innerHTML = renderPollMessage(msg);
    } else {
        return null;
    }
    return wrap;
}

// ========== DEBUT : LECTEUR AUDIO CUSTOM (play/pause, progression, durée, vitesse) ==========
const AUDIO_SPEEDS = [1, 1.5, 2];

function formatAudioTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildAudioPlayer(msg) {
    const player = document.createElement('div');
    player.className = 'audio-player';

    const knownDuration = msg.duration_seconds || 0;
    player.innerHTML = `
        <button class="ap-play" title="Écouter"><i class="fas fa-play"></i></button>
        <div class="ap-track">
            <div class="ap-progress-wrap">
                <div class="ap-progress"></div>
            </div>
            <div class="ap-times">
                <span class="ap-current">0:00</span>
                <span class="ap-total">${formatAudioTime(knownDuration)}</span>
            </div>
        </div>
        <button class="ap-speed" title="Vitesse de lecture">1×</button>
    `;

    const audio = new Audio();
    audio.preload = 'none';
    audio.src = msg.media_url;

    const playBtn = player.querySelector('.ap-play');
    const progressWrap = player.querySelector('.ap-progress-wrap');
    const progress = player.querySelector('.ap-progress');
    const currentEl = player.querySelector('.ap-current');
    const totalEl = player.querySelector('.ap-total');
    const speedBtn = player.querySelector('.ap-speed');
    let speedIdx = 0;
    let listenedMarked = false;

    audio.addEventListener('loadedmetadata', () => {
        if (isFinite(audio.duration) && audio.duration > 0) {
            totalEl.textContent = formatAudioTime(audio.duration);
        }
    });

    audio.addEventListener('timeupdate', () => {
        const dur = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : knownDuration;
        if (dur > 0) progress.style.width = `${(audio.currentTime / dur) * 100}%`;
        currentEl.textContent = formatAudioTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        progress.style.width = '0%';
        currentEl.textContent = '0:00';
    });

    audio.addEventListener('error', () => {
        playBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        toast('Impossible de lire cet audio (format non supporté par votre navigateur)', 'warning');
    });

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            // Met en pause tous les autres lecteurs de la page
            document.querySelectorAll('.audio-player').forEach(p => {
                if (p !== player && p._audio && !p._audio.paused) {
                    p._audio.pause();
                    p.querySelector('.ap-play').innerHTML = '<i class="fas fa-play"></i>';
                }
            });
            audio.play().then(() => {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (!listenedMarked) {
                    listenedMarked = true;
                    markMediaListened(msg);
                }
            }).catch(() => {
                toast('Lecture impossible — format audio non supporté', 'warning');
            });
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    progressWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        const dur = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : knownDuration;
        if (dur <= 0) return;
        const rect = progressWrap.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * dur;
    });

    speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedIdx = (speedIdx + 1) % AUDIO_SPEEDS.length;
        audio.playbackRate = AUDIO_SPEEDS[speedIdx];
        speedBtn.textContent = `${AUDIO_SPEEDS[speedIdx]}×`;
    });

    player._audio = audio;
    return player;
}

// Marque un média audio/vidéo comme "écouté / vu" par le destinataire
async function markMediaListened(msg) {
    if (msg.user_hubisoccer_id === currentProfile.hubisoccer_id) return;
    const listened = msg.listened_by || [];
    if (listened.includes(currentProfile.hubisoccer_id)) return;
    const updated = [...listened, currentProfile.hubisoccer_id];
    msg.listened_by = updated;
    await sb.from('supabaseAuthPrive_messages').update({ listened_by: updated }).eq('id', msg.id);
}
// ========== FIN : LECTEUR AUDIO CUSTOM ==========

function renderPollMessage(msg) {
    try {
        const poll = JSON.parse(msg.content);
        const totalVotes = Object.values(poll.options).reduce((a, b) => a + b, 0);
        const hasVoted = poll.voters && poll.voters.includes(currentProfile.hubisoccer_id);
        let html = `<div class="poll-container" data-msg-id="${msg.id}"><div class="poll-question">${escapeHtml(poll.question)}</div>`;
        for (const [opt, count] of Object.entries(poll.options)) {
            const percent = totalVotes > 0 ? (count / totalVotes * 100).toFixed(0) : 0;
            html += `<div class="poll-option ${hasVoted ? '' : 'votable'}" data-opt="${opt}">
                <span>${escapeHtml(opt)}</span>
                <span class="poll-bar"><span style="width:${percent}%"></span></span>
                <span class="poll-count">${count}</span>
            </div>`;
        }
        html += `<div class="poll-footer">${totalVotes} vote${totalVotes > 1 ? 's' : ''}</div></div>`;
        return html;
    } catch { return '<div>Sondage invalide</div>'; }
}

function makeReactionsBar(msg) {
    const div = document.createElement('div');
    div.className = 'msg-reactions';
    const counts = {};
    for (const [uid, emoji] of Object.entries(msg.reactions || {})) {
        if (!counts[emoji]) counts[emoji] = { count: 0, users: [] };
        counts[emoji].count++;
        counts[emoji].users.push(uid);
    }
    for (const [emoji, info] of Object.entries(counts)) {
        const chip = document.createElement('div');
        chip.className = `reaction-chip ${info.users.includes(currentProfile.hubisoccer_id) ? 'my-reaction' : ''}`;
        chip.innerHTML = `${emoji} <span class="reaction-count">${info.count}</span>`;
        chip.addEventListener('click', () => toggleReaction(msg.id, emoji));
        div.appendChild(chip);
    }
    return div;
}

function formatMsgText(text) {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/@([\wÀ-ſ]+(?:\s+[A-ZÀ-Ý][\wÀ-ſ]*)?)/g, '<span class="mention-tag">@$1</span>')
        .replace(/\n/g, '<br>');
}

function stripFormatting(text) {
    return text.replace(/[*_~`]/g, '');
}

function extractLinks(text) {
    const regex = /(https?:\/\/[^\s]+)/g;
    return text.match(regex) || [];
}

function createLinkPreview(url) {
    // Version simplifiée : afficher une carte avec favicon et titre
    const div = document.createElement('div');
    div.className = 'link-preview';
    div.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener">
            <div class="link-preview-content">
                <i class="fas fa-globe"></i>
                <span>${escapeHtml(url.replace(/^https?:\/\//, '').split('/')[0])}</span>
            </div>
        </a>
    `;
    return div;
}
// ========== FIN : RENDU DES MESSAGES ==========

// ========== DEBUT : ENVOI DE MESSAGE ==========
async function sendMessage() {
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    const btn = document.getElementById('sendBtn');

    if (!content && !pendingFile && !pendingAudioBlob) return;

    if (conversationBlocked) {
        toast('Envoi impossible : un blocage est actif dans cette conversation', 'warning');
        return;
    }

    btn.disabled = true;

    try {
        let mediaUrl = null, mediaType = null;

        if (pendingFile) {
            const file = pendingFile;
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('video/')) mediaType = 'video';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';
            else mediaType = 'file';

            const fileName = `${currentProfile.hubisoccer_id}_${Date.now()}.${file.name.split('.').pop()}`;
            const { error: upErr } = await sb.storage.from('message_attachments').upload(fileName, file);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('message_attachments').getPublicUrl(fileName);
            mediaUrl = urlData.publicUrl;
            clearAttachmentPreview();
        }

        if (pendingAudioBlob) {
            // Extension et contentType alignés sur le VRAI format d'enregistrement
            const audioMime = pendingAudioBlob.type || 'audio/webm';
            const ext = audioExtFromMime(audioMime);
            const fileName = `${currentProfile.hubisoccer_id}_audio_${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('message_attachments')
                .upload(fileName, pendingAudioBlob, { contentType: audioMime });
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('message_attachments').getPublicUrl(fileName);
            mediaUrl = urlData.publicUrl;
            mediaType = 'audio';
            pendingAudioBlob = null;
            document.getElementById('audioPreviewBar').style.display = 'none';
        }

        if (editingMsgId) {
            const { error } = await sb.from('supabaseAuthPrive_messages')
                .update({ content, edited: true })
                .eq('id', editingMsgId)
                .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
            if (error) throw error;
            const idx = messages.findIndex(m => m.id === editingMsgId);
            if (idx >= 0) {
                messages[idx].content = content;
                messages[idx].edited = true;
                updateMessageInDOM(messages[idx]);
            }
            cancelEdit();
        } else {
            const msgData = {
                conversation_id: currentConvId,
                user_hubisoccer_id: currentProfile.hubisoccer_id,
                content: content || null,
                media_url: mediaUrl,
                media_type: mediaType,
                reply_to_id: pendingReply?.id || null,
                deleted_for: [],
                reactions: {},
                edited: false,
                pinned: false,
                read_by: [],
                delivered_to: [],
                listened_by: [],
                duration_seconds: (mediaType === 'audio' && recAudioDuration > 0) ? recAudioDuration : null
            };
            if (mediaType === 'audio') recAudioDuration = 0;
            const { data: inserted, error } = await sb.from('supabaseAuthPrive_messages')
                .insert(msgData)
                .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )')
                .single();
            if (error) throw error;
            appendMessage(inserted);
            cancelReply();
            await sb.from('supabaseAuthPrive_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentConvId);
        }

        input.value = '';
        autoResizeInput();
        stopTyping();
        deleteDraft();
    } catch (err) {
        toast('Erreur envoi : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

function appendMessage(msg) {
    const container = document.getElementById('messagesContainer');
    const lastMsg = messages[messages.length - 1];
    const msgDate = new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const lastDate = lastMsg ? new Date(lastMsg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
    if (msgDate !== lastDate) container.appendChild(makeDateSeparator(msgDate));
    const isSameSender = lastMsg && lastMsg.user_hubisoccer_id === msg.user_hubisoccer_id;
    container.appendChild(makeMessageRow(msg, isSameSender));
    messages.push(msg);
    const area = document.getElementById('messagesArea');
    const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
    if (atBottom) scrollToBottom(true);
    else showScrollBadge();
}

function updateMessageInDOM(msg) {
    const row = document.querySelector(`.msg-row[data-msg-id="${msg.id}"]`);
    if (!row) { renderAllMessages(); return; }
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx >= 0) messages[idx] = { ...messages[idx], ...msg };
    const isSameSender = idx > 0 && messages[idx - 1]?.user_hubisoccer_id === msg.user_hubisoccer_id;
    const newRow = makeMessageRow(messages[idx] || msg, isSameSender);
    row.replaceWith(newRow);
}

function removeMessageFromDOM(msgId) {
    document.querySelector(`.msg-row[data-msg-id="${msgId}"]`)?.remove();
    messages = messages.filter(m => m.id !== msgId);
}
// ========== FIN : ENVOI DE MESSAGE ==========

// ========== DEBUT : RÉPONSE & ÉDITION ==========
function startReply(msg) {
    pendingReply = msg;
    cancelEdit();
    const author = msg.author || {};
    document.getElementById('replyBarName').textContent = author.full_name || author.display_name || 'Utilisateur';
    document.getElementById('replyBarText').textContent = msg.content?.substring(0, 60) || '📎 Média';
    document.getElementById('replyBar').style.display = 'flex';
    document.getElementById('msgInput').focus();
}

function cancelReply() {
    pendingReply = null;
    document.getElementById('replyBar').style.display = 'none';
}

function startEdit(msg) {
    if (msg.user_hubisoccer_id !== currentProfile.hubisoccer_id) return;
    editingMsgId = msg.id;
    cancelReply();
    document.getElementById('editBar').style.display = 'flex';
    const input = document.getElementById('msgInput');
    input.value = msg.content || '';
    input.focus();
    autoResizeInput();
}

function cancelEdit() {
    editingMsgId = null;
    document.getElementById('editBar').style.display = 'none';
    document.getElementById('msgInput').value = '';
    autoResizeInput();
}
// ========== FIN : RÉPONSE & ÉDITION ==========

// ========== DEBUT : SUPPRESSION ==========
async function deleteMessage(msgId, forEveryone) {
    if (forEveryone) {
        await sb.from('supabaseAuthPrive_messages').delete().eq('id', msgId);
        removeMessageFromDOM(msgId);
    } else {
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
            const newDeleted = [...(msg.deleted_for || []), currentProfile.hubisoccer_id];
            await sb.from('supabaseAuthPrive_messages').update({ deleted_for: newDeleted }).eq('id', msgId);
            removeMessageFromDOM(msgId);
        }
    }
    toast('Message supprimé', 'success');
}
// ========== FIN : SUPPRESSION ==========

// ========== DEBUT : ÉPINGLAGE ==========
async function togglePin(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const newPinned = !msg.pinned;
    await sb.from('supabaseAuthPrive_messages').update({ pinned: newPinned }).eq('id', msgId);
    msg.pinned = newPinned;
    updateMessageInDOM(msg);
    loadPinnedMessages();
    toast(newPinned ? 'Message épinglé' : 'Message désépinglé', 'success');
}

async function loadPinnedMessages() {
    const { data } = await sb.from('supabaseAuthPrive_messages')
        .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id ( full_name, display_name )')
        .eq('conversation_id', currentConvId)
        .eq('pinned', true)
        .order('created_at', { ascending: false });
    pinnedMessages = data || [];
    const banner = document.getElementById('pinnedBanner');
    if (pinnedMessages.length > 0) {
        banner.style.display = 'flex';
        document.getElementById('pinnedBannerText').textContent = pinnedMessages[0].content?.substring(0, 50) || '📎 Média';
    } else {
        banner.style.display = 'none';
    }
}
// ========== FIN : ÉPINGLAGE ==========

// ========== DEBUT : RÉACTIONS ==========
async function toggleReaction(msgId, emoji) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    if (reactions[currentProfile.hubisoccer_id] === emoji) {
        delete reactions[currentProfile.hubisoccer_id];
    } else {
        reactions[currentProfile.hubisoccer_id] = emoji;
    }
    await sb.from('supabaseAuthPrive_messages').update({ reactions }).eq('id', msgId);
    msg.reactions = reactions;
    updateMessageInDOM(msg);
}

function showReactionPicker(e, msgId) {
    e.preventDefault();
    const picker = document.getElementById('reactionPicker');
    picker.dataset.msgId = msgId;
    picker.style.left = `${e.clientX}px`;
    picker.style.top = `${e.clientY - 50}px`;
    picker.style.display = 'flex';
    document.addEventListener('click', function hide() {
        picker.style.display = 'none';
        document.removeEventListener('click', hide);
    }, { once: true });
}
// ========== FIN : RÉACTIONS ==========

// ========== DEBUT : TRANSFERT ==========
async function showForwardModal(msgId) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    ctxMsgId = msgId;
    const { data: participations } = await sb
        .from('supabaseAuthPrive_conversation_participants')
        .select('conversation_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const convIds = (participations || []).map(p => p.conversation_id).filter(id => id !== currentConvId);

    const { data: convs } = await sb
        .from('supabaseAuthPrive_conversations')
        .select('id, is_group, group_name, participants:supabaseAuthPrive_conversation_participants(user_hubisoccer_id, profile:supabaseAuthPrive_profiles!user_hubisoccer_id(full_name, display_name, avatar_url))')
        .in('id', convIds);

    const list = document.getElementById('forwardList');
    list.innerHTML = (convs || []).map(conv => {
        let name;
        if (conv.is_group) name = conv.group_name || 'Groupe';
        else {
            const other = conv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
            name = other?.profile?.full_name || other?.profile?.display_name || 'Utilisateur';
        }
        return `<div class="forward-item" data-conv-id="${conv.id}">
            <span>${escapeHtml(name)}</span>
        </div>`;
    }).join('');

    list.querySelectorAll('.forward-item').forEach(el => {
        el.addEventListener('click', () => forwardToConversation(el.dataset.convId, msg));
    });

    openModal('modalForward');
}

async function forwardToConversation(convId, msg) {
    const { error } = await sb.from('supabaseAuthPrive_messages').insert({
        conversation_id: convId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content: msg.content,
        media_url: msg.media_url,
        media_type: msg.media_type,
        deleted_for: [],
        reactions: {},
        edited: false,
        pinned: false,
        read_by: []
    });
    if (error) {
        toast('Erreur transfert', 'error');
    } else {
        toast('Message transféré', 'success');
        closeModal('modalForward');
    }
}
// ========== FIN : TRANSFERT ==========

// ========== DEBUT : RECHERCHE DANS LA CONVERSATION ==========
function initSearchBar() {
    const searchBar = document.getElementById('msgSearchBar');
    const input = document.getElementById('msgSearchInput');
    const countSpan = document.getElementById('msgSearchCount');
    const prevBtn = document.getElementById('msgSearchPrev');
    const nextBtn = document.getElementById('msgSearchNext');
    const closeBtn = document.getElementById('msgSearchClose');

    document.getElementById('searchMsgBtn').addEventListener('click', () => {
        searchBar.style.display = 'flex';
        input.focus();
    });

    let searchDebounce = null;
    input.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            currentSearchQuery = input.value.trim();
            if (currentSearchQuery) {
                searchMatches = messages.filter(m => m.content && m.content.toLowerCase().includes(currentSearchQuery.toLowerCase()));
                searchIdx = searchMatches.length > 0 ? 0 : -1;
                renderAllMessages();
                updateSearchCount();
                if (searchMatches.length > 0) scrollToMessage(searchMatches[0].id);
            } else {
                searchMatches = [];
                searchIdx = -1;
                renderAllMessages();
                updateSearchCount();
            }
        }, 250);
    });

    prevBtn.addEventListener('click', () => {
        if (searchMatches.length === 0) return;
        searchIdx = (searchIdx - 1 + searchMatches.length) % searchMatches.length;
        scrollToMessage(searchMatches[searchIdx].id);
        updateSearchCount();
    });

    nextBtn.addEventListener('click', () => {
        if (searchMatches.length === 0) return;
        searchIdx = (searchIdx + 1) % searchMatches.length;
        scrollToMessage(searchMatches[searchIdx].id);
        updateSearchCount();
    });

    closeBtn.addEventListener('click', () => {
        searchBar.style.display = 'none';
        input.value = '';
        currentSearchQuery = '';
        renderAllMessages();
    });
}

function highlightSearchResults(query) {
    if (!query) return;
    const regex = new RegExp(`(${escapeRegex(escapeHtml(query))})`, 'gi');
    document.querySelectorAll('.msg-bubble > span').forEach(el => {
        // Surlignage non destructif : on travaille sur le HTML déjà formaté,
        // uniquement dans les portions de texte (pas dans les balises)
        el.innerHTML = el.innerHTML.replace(/(>[^<]+<|^[^<]+$|^[^<]+<|>[^<]+$)/g, (segment) =>
            segment.replace(regex, '<mark>$1</mark>')
        );
    });
}

function clearHighlights() {
    // Le rendu complet restaure le formatage d'origine
    renderAllMessages();
}

function updateSearchCount() {
    const countSpan = document.getElementById('msgSearchCount');
    if (searchMatches.length === 0) {
        countSpan.textContent = '0/0';
    } else {
        countSpan.textContent = `${searchIdx + 1}/${searchMatches.length}`;
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// ========== FIN : RECHERCHE ==========

// ========== DEBUT : MESSAGES PROGRAMMÉS (stockés en base — plus de renvoi infini) ==========
async function scheduleMessage(content, sendAt) {
    const sendDate = new Date(sendAt);
    if (isNaN(sendDate.getTime()) || sendDate.getTime() <= Date.now()) {
        toast('Date invalide ou déjà passée', 'warning');
        return;
    }
    const { error } = await sb.from('supabaseAuthPrive_scheduled_messages').insert({
        conversation_id: String(currentConvId),
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content,
        send_at: sendDate.toISOString(),
        sent: false
    });
    if (error) {
        toast('Erreur de programmation', 'error');
    } else {
        toast(`Message programmé pour le ${sendDate.toLocaleString('fr-FR')}`, 'success');
        document.getElementById('msgInput').value = '';
        autoResizeInput();
    }
}

let scheduledCheckRunning = false;
async function checkScheduledMessages() {
    if (scheduledCheckRunning || !currentProfile?.hubisoccer_id) return;
    scheduledCheckRunning = true;
    try {
        // Messages dus, pas encore envoyés, appartenant à MOI (toutes conversations)
        const { data: due } = await sb.from('supabaseAuthPrive_scheduled_messages')
            .select('id, conversation_id, content')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('sent', false)
            .lte('send_at', new Date().toISOString())
            .limit(10);

        for (const s of (due || [])) {
            // Marquer "envoyé" AVANT l'insertion (empêche tout double envoi)
            const { data: claimed } = await sb.from('supabaseAuthPrive_scheduled_messages')
                .update({ sent: true })
                .eq('id', s.id)
                .eq('sent', false)
                .select();
            if (!claimed || claimed.length === 0) continue;

            await sb.from('supabaseAuthPrive_messages').insert({
                conversation_id: s.conversation_id,
                user_hubisoccer_id: currentProfile.hubisoccer_id,
                content: s.content,
                deleted_for: [],
                reactions: {},
                edited: false,
                pinned: false,
                read_by: [],
                delivered_to: [],
                listened_by: []
            });
            await sb.from('supabaseAuthPrive_conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', s.conversation_id);
            if (String(s.conversation_id) === String(currentConvId)) {
                toast('📅 Message programmé envoyé', 'success');
            }
        }
    } catch (e) {
        console.warn('Vérification messages programmés :', e);
    } finally {
        scheduledCheckRunning = false;
    }
}
setInterval(checkScheduledMessages, 60000); // vérifier chaque minute
// ========== FIN : MESSAGES PROGRAMMÉS ==========

// ========== DEBUT : SONDAGES ==========
function createPoll(question, options) {
    const poll = {
        question,
        options: Object.fromEntries(options.map(opt => [opt, 0])),
        voters: []
    };
    const msgData = {
        conversation_id: currentConvId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content: JSON.stringify(poll),
        media_type: 'poll',
        deleted_for: [],
        reactions: {},
        edited: false,
        pinned: false,
        read_by: []
    };
    sb.from('supabaseAuthPrive_messages').insert(msgData).then(() => toast('Sondage créé', 'success'));
}

async function votePoll(msgId, option) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const poll = JSON.parse(msg.content);
    if (poll.voters.includes(currentProfile.hubisoccer_id)) {
        toast('Vous avez déjà voté', 'warning');
        return;
    }
    poll.options[option] = (poll.options[option] || 0) + 1;
    poll.voters.push(currentProfile.hubisoccer_id);
    await sb.from('supabaseAuthPrive_messages')
        .update({ content: JSON.stringify(poll) })
        .eq('id', msgId);
    msg.content = JSON.stringify(poll);
    updateMessageInDOM(msg);
}
// ========== FIN : SONDAGES ==========

// ========== DEBUT : MESSAGES ÉPHÉMÈRES ==========
async function sendEphemeralMessage(content, ttlSeconds = 60) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const msgData = {
        conversation_id: currentConvId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content,
        deleted_for: [],
        reactions: {},
        edited: false,
        pinned: false,
        read_by: [],
        expires_at: expiresAt
    };
    await sb.from('supabaseAuthPrive_messages').insert(msgData);
    toast(`Message éphémère (${ttlSeconds}s) envoyé`, 'success');
}
// ========== FIN : MESSAGES ÉPHÉMÈRES ==========

// ========== DEBUT : TRADUCTION AUTOMATIQUE ==========
async function translateMessage(msgId, targetLang = 'en') {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.content) return;
    try {
        // Utilisation d'une API gratuite (MyMemory)
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(msg.content)}&langpair=fr|${targetLang}`);
        const data = await res.json();
        const translated = data.responseData.translatedText;
        toast(`Traduction : ${translated}`, 'info');
    } catch (err) {
        toast('Erreur de traduction', 'error');
    }
}
// ========== FIN : TRADUCTION ==========

// ========== DEBUT : APPELS AUDIO/VIDÉO (WebRTC via PeerJS) ==========
let callPeer = null;             // instance PeerJS
let callConnection = null;       // appel média en cours
let callLocalStream = null;
let callChannel = null;          // canal Supabase de signalisation
let callState = 'idle';          // idle | outgoing | incoming | active
let callType = 'audio';          // audio | video
let callPartnerId = null;
let callPartnerName = '';
let callStartTime = null;
let callTimerInterval = null;
let ringInterval = null;
let ringCtx = null;
let incomingCallData = null;
let callMicEnabled = true;
let callCamEnabled = true;
let callFacingMode = 'user';

// Identifiant PeerJS unique et déterministe par utilisateur et conversation
function peerIdFor(userId) {
    return `hubis-${String(userId).replace(/[^a-zA-Z0-9]/g, '')}-${String(currentConvId).replace(/[^a-zA-Z0-9]/g, '')}`;
}

// ----- Sonnerie (générée sans fichier externe) -----
function startRingtone(incoming = true) {
    stopRingtone();
    try {
        ringCtx = new (window.AudioContext || window.webkitAudioContext)();
        const beep = () => {
            if (!ringCtx) return;
            const osc = ringCtx.createOscillator();
            const gain = ringCtx.createGain();
            osc.connect(gain);
            gain.connect(ringCtx.destination);
            osc.frequency.value = incoming ? 880 : 440;
            gain.gain.setValueAtTime(0.0001, ringCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(incoming ? 0.15 : 0.07, ringCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ringCtx.currentTime + 0.7);
            osc.start();
            osc.stop(ringCtx.currentTime + 0.75);
        };
        beep();
        ringInterval = setInterval(beep, incoming ? 1400 : 2500);
    } catch (e) { /* audio indisponible */ }
}

function stopRingtone() {
    clearInterval(ringInterval);
    ringInterval = null;
    if (ringCtx) { try { ringCtx.close(); } catch (e) {} ringCtx = null; }
}

// ----- Signalisation : écoute des appels entrants -----
function subscribeCalls() {
    if (!currentConvId || !currentProfile?.hubisoccer_id) return;
    callChannel = sb.channel(`calls:${currentConvId}`)
        .on('broadcast', { event: 'call_offer' }, (payload) => {
            const d = payload.payload || {};
            if (d.to !== currentProfile.hubisoccer_id) return;
            if (callState !== 'idle') {
                // Déjà en ligne : on renvoie occupé
                callChannel?.send({ type: 'broadcast', event: 'call_busy', payload: { to: d.from } });
                return;
            }
            showIncomingCall(d);
        })
        .on('broadcast', { event: 'call_cancel' }, (payload) => {
            const d = payload.payload || {};
            if (d.to !== currentProfile.hubisoccer_id) return;
            if (callState === 'incoming') {
                closeCallUI();
                toast('Appel manqué', 'info');
            }
        })
        .on('broadcast', { event: 'call_reject' }, (payload) => {
            const d = payload.payload || {};
            if (d.to !== currentProfile.hubisoccer_id) return;
            if (callState === 'outgoing') {
                endCall(false, 'Appel refusé');
            }
        })
        .on('broadcast', { event: 'call_busy' }, (payload) => {
            const d = payload.payload || {};
            if (d.to !== currentProfile.hubisoccer_id) return;
            if (callState === 'outgoing') endCall(false, 'Correspondant occupé');
        })
        .on('broadcast', { event: 'call_end' }, (payload) => {
            const d = payload.payload || {};
            if (d.to !== currentProfile.hubisoccer_id) return;
            if (callState !== 'idle') endCall(false, 'Appel terminé');
        })
        .subscribe();
}

// ----- Démarrer un appel -----
async function startCall(type = 'audio') {
    if (!currentConv) return;
    if (currentConv.is_group) {
        toast('Les appels de groupe arrivent bientôt — appels 1 à 1 disponibles', 'info');
        return;
    }
    if (conversationBlocked) { toast('Appel impossible : conversation bloquée', 'warning'); return; }
    if (callState !== 'idle') { toast('Un appel est déjà en cours', 'warning'); return; }
    if (typeof Peer === 'undefined') { toast('Module d\'appel non chargé, rechargez la page', 'error'); return; }

    const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
    if (!other) { toast('Correspondant introuvable', 'error'); return; }

    callType = type;
    callPartnerId = other.user_hubisoccer_id;
    callPartnerName = other.profile?.full_name || other.profile?.display_name || 'Utilisateur';
    callState = 'outgoing';
    callMicEnabled = true;
    callCamEnabled = true;

    openCallUI('outgoing');

    try {
        callLocalStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: type === 'video' ? { facingMode: callFacingMode } : false
        });
    } catch (err) {
        toast(err.name === 'NotAllowedError'
            ? 'Autorisez l\'accès au micro / à la caméra'
            : 'Micro ou caméra indisponible', 'warning');
        closeCallUI();
        return;
    }

    if (type === 'video') {
        const localVid = document.getElementById('callLocalVideo');
        localVid.srcObject = callLocalStream;
        localVid.style.display = 'block';
    }

    // Création du pair local
    callPeer = new Peer(peerIdFor(currentProfile.hubisoccer_id), { host: '0.peerjs.com', port: 443, secure: true });

    callPeer.on('open', () => {
        // Signale l'appel au correspondant
        callChannel?.send({
            type: 'broadcast', event: 'call_offer',
            payload: {
                from: currentProfile.hubisoccer_id,
                to: callPartnerId,
                fromName: currentProfile.full_name || currentProfile.display_name || 'Utilisateur',
                fromAvatar: currentProfile.avatar_url || null,
                callType: type,
                peerId: peerIdFor(currentProfile.hubisoccer_id)
            }
        });
        startRingtone(false);
    });

    // L'appelé nous rappelle : on répond avec notre flux
    callPeer.on('call', (incoming) => {
        incoming.answer(callLocalStream);
        callConnection = incoming;
        incoming.on('stream', (remoteStream) => attachRemoteStream(remoteStream));
        incoming.on('close', () => endCall(false, 'Appel terminé'));
    });

    callPeer.on('error', (err) => {
        console.warn('Erreur PeerJS :', err.type);
        if (callState === 'outgoing') endCall(false, 'Connexion impossible');
    });

    // Expiration si personne ne répond (45 s)
    setTimeout(() => {
        if (callState === 'outgoing') {
            callChannel?.send({ type: 'broadcast', event: 'call_cancel', payload: { from: currentProfile.hubisoccer_id, to: callPartnerId } });
            endCall(true, 'Pas de réponse');
        }
    }, 45000);
}

// ----- Appel entrant -----
function showIncomingCall(data) {
    incomingCallData = data;
    callState = 'incoming';
    callType = data.callType || 'audio';
    callPartnerId = data.from;
    callPartnerName = data.fromName || 'Utilisateur';

    document.getElementById('callPartnerName').textContent = callPartnerName;
    document.getElementById('callStatusText').textContent = callType === 'video' ? 'Appel vidéo entrant…' : 'Appel audio entrant…';

    const av = document.getElementById('callAvatar');
    const ini = document.getElementById('callAvatarInitials');
    if (data.fromAvatar) {
        av.src = data.fromAvatar; av.style.display = 'block'; ini.style.display = 'none';
    } else {
        av.style.display = 'none'; ini.style.display = 'flex'; ini.textContent = getInitials(callPartnerName);
    }

    openCallUI('incoming');
    startRingtone(true);
}

async function acceptCall() {
    if (callState !== 'incoming' || !incomingCallData) return;
    stopRingtone();

    try {
        callLocalStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video' ? { facingMode: callFacingMode } : false
        });
    } catch (err) {
        toast('Micro ou caméra indisponible', 'warning');
        rejectCall();
        return;
    }

    if (callType === 'video') {
        const localVid = document.getElementById('callLocalVideo');
        localVid.srcObject = callLocalStream;
        localVid.style.display = 'block';
    }

    callPeer = new Peer(peerIdFor(currentProfile.hubisoccer_id), { host: '0.peerjs.com', port: 443, secure: true });
    callPeer.on('open', () => {
        // On appelle l'émetteur avec notre flux
        const conn = callPeer.call(incomingCallData.peerId, callLocalStream);
        callConnection = conn;
        conn.on('stream', (remoteStream) => attachRemoteStream(remoteStream));
        conn.on('close', () => endCall(false, 'Appel terminé'));
    });
    callPeer.on('error', () => endCall(false, 'Connexion impossible'));

    setCallActive();
}

function rejectCall() {
    stopRingtone();
    callChannel?.send({
        type: 'broadcast', event: 'call_reject',
        payload: { from: currentProfile.hubisoccer_id, to: callPartnerId }
    });
    logCall('missed');
    closeCallUI();
    toast('Appel refusé', 'info');
}

function attachRemoteStream(remoteStream) {
    const remoteVid = document.getElementById('callRemoteVideo');
    const remoteAud = document.getElementById('callRemoteAudio');
    if (callType === 'video') {
        remoteVid.srcObject = remoteStream;
        remoteVid.style.display = 'block';
    } else {
        remoteAud.srcObject = remoteStream;
    }
    setCallActive();
}

function setCallActive() {
    if (callState === 'active') return;
    stopRingtone();
    callState = 'active';
    callStartTime = Date.now();
    document.getElementById('callStatusText').textContent = 'En communication';
    document.getElementById('callAcceptBtn').style.display = 'none';
    document.getElementById('callRejectBtn').style.display = 'none';
    document.getElementById('callHangupBtn').style.display = 'flex';
    document.getElementById('callMicBtn').style.display = 'flex';
    document.getElementById('callCamBtn').style.display = callType === 'video' ? 'flex' : 'none';
    document.getElementById('callFlipBtn').style.display = callType === 'video' ? 'flex' : 'none';
    document.getElementById('callDuration').style.display = 'block';

    clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
        const s = Math.floor((Date.now() - callStartTime) / 1000);
        document.getElementById('callDuration').textContent =
            `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }, 1000);
}

function hangUpCall() {
    callChannel?.send({
        type: 'broadcast', event: 'call_end',
        payload: { from: currentProfile.hubisoccer_id, to: callPartnerId }
    });
    endCall(true, 'Appel terminé');
}

function endCall(iEnded, reason) {
    const wasActive = callState === 'active';
    const duration = wasActive && callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;

    if (callState === 'outgoing' && !wasActive) {
        callChannel?.send({ type: 'broadcast', event: 'call_cancel', payload: { from: currentProfile.hubisoccer_id, to: callPartnerId } });
    }

    if (wasActive) logCall('done', duration);
    else if (iEnded) logCall('cancelled');

    closeCallUI();
    if (reason) toast(reason, 'info');
}

function closeCallUI() {
    stopRingtone();
    clearInterval(callTimerInterval);
    callTimerInterval = null;
    try { callConnection?.close(); } catch (e) {}
    try { callPeer?.destroy(); } catch (e) {}
    callLocalStream?.getTracks().forEach(t => t.stop());
    callConnection = null;
    callPeer = null;
    callLocalStream = null;
    callState = 'idle';
    callStartTime = null;
    incomingCallData = null;

    const modal = document.getElementById('modalCall');
    if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }
    ['callLocalVideo', 'callRemoteVideo'].forEach(id => {
        const v = document.getElementById(id);
        if (v) { v.srcObject = null; v.style.display = 'none'; }
    });
    const ra = document.getElementById('callRemoteAudio');
    if (ra) ra.srcObject = null;
    const dur = document.getElementById('callDuration');
    if (dur) { dur.style.display = 'none'; dur.textContent = '0:00'; }
}

function openCallUI(mode) {
    const modal = document.getElementById('modalCall');
    if (!modal) return;

    document.getElementById('callPartnerName').textContent = callPartnerName;
    document.getElementById('callTypeIcon').className = callType === 'video' ? 'fas fa-video' : 'fas fa-phone';

    if (mode === 'outgoing') {
        document.getElementById('callStatusText').textContent = 'Appel en cours…';
        const other = currentConv?.participants?.find(p => p.user_hubisoccer_id === callPartnerId);
        const avatarUrl = other?.profile?.avatar_url;
        const av = document.getElementById('callAvatar');
        const ini = document.getElementById('callAvatarInitials');
        if (avatarUrl) { av.src = avatarUrl; av.style.display = 'block'; ini.style.display = 'none'; }
        else { av.style.display = 'none'; ini.style.display = 'flex'; ini.textContent = getInitials(callPartnerName); }
    }

    document.getElementById('callAcceptBtn').style.display = mode === 'incoming' ? 'flex' : 'none';
    document.getElementById('callRejectBtn').style.display = mode === 'incoming' ? 'flex' : 'none';
    document.getElementById('callHangupBtn').style.display = mode === 'outgoing' ? 'flex' : 'none';
    document.getElementById('callMicBtn').style.display = 'none';
    document.getElementById('callCamBtn').style.display = 'none';
    document.getElementById('callFlipBtn').style.display = 'none';
    document.getElementById('callDuration').style.display = 'none';
    document.getElementById('callVideoZone').style.display = callType === 'video' ? 'block' : 'none';

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function toggleCallMic() {
    if (!callLocalStream) return;
    callMicEnabled = !callMicEnabled;
    callLocalStream.getAudioTracks().forEach(t => t.enabled = callMicEnabled);
    const btn = document.getElementById('callMicBtn');
    btn.classList.toggle('off', !callMicEnabled);
    btn.innerHTML = callMicEnabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
}

function toggleCallCam() {
    if (!callLocalStream) return;
    callCamEnabled = !callCamEnabled;
    callLocalStream.getVideoTracks().forEach(t => t.enabled = callCamEnabled);
    const btn = document.getElementById('callCamBtn');
    btn.classList.toggle('off', !callCamEnabled);
    btn.innerHTML = callCamEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
}

async function flipCallCamera() {
    if (!callLocalStream || callType !== 'video') return;
    callFacingMode = callFacingMode === 'user' ? 'environment' : 'user';
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: callFacingMode } });
        const newTrack = newStream.getVideoTracks()[0];
        const sender = callConnection?.peerConnection?.getSenders?.().find(s => s.track && s.track.kind === 'video');
        if (sender && newTrack) await sender.replaceTrack(newTrack);
        callLocalStream.getVideoTracks().forEach(t => t.stop());
        callLocalStream = newStream;
        document.getElementById('callLocalVideo').srcObject = newStream;
    } catch (err) {
        toast('Impossible de changer de caméra', 'warning');
    }
}

// Trace de l'appel dans la conversation
async function logCall(status, duration = 0) {
    let text;
    if (status === 'done') {
        const m = Math.floor(duration / 60), s = duration % 60;
        text = `${callType === 'video' ? '📹 Appel vidéo' : '📞 Appel audio'} · ${m}:${s.toString().padStart(2, '0')}`;
    } else if (status === 'missed') {
        text = `${callType === 'video' ? '📹' : '📞'} Appel manqué`;
    } else {
        text = `${callType === 'video' ? '📹' : '📞'} Appel annulé`;
    }
    try {
        const { data } = await sb.from('supabaseAuthPrive_messages').insert({
            conversation_id: currentConvId,
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            content: text,
            media_type: 'system',
            deleted_for: [], reactions: {}, edited: false, pinned: false,
            read_by: [], delivered_to: [], listened_by: []
        }).select().single();
        if (data) appendMessage(data);
    } catch (e) { /* trace facultative */ }
}
// ========== FIN : APPELS AUDIO/VIDÉO ==========

// ========== DEBUT : MESSAGES ÉPHÉMÈRES — BALAYAGE ==========
// Retire du fil (et purge en base) les messages éphémères arrivés à expiration
function sweepExpiredMessages() {
    const now = Date.now();
    const expired = messages.filter(m => m.expires_at && new Date(m.expires_at).getTime() < now);
    for (const m of expired) {
        removeMessageFromDOM(m.id);
        sb.from('supabaseAuthPrive_messages').delete().eq('id', m.id).then(() => {});
    }
}
setInterval(sweepExpiredMessages, 15000);
// ========== FIN : MESSAGES ÉPHÉMÈRES — BALAYAGE ==========

// ========== DEBUT : INFOS & GESTION DU GROUPE ==========
let groupContactsCache = [];
let selectedNewMembers = [];

// Suis-je admin ? (si le groupe n'a AUCUN admin — anciens groupes — tout le monde l'est)
function isGroupAdmin() {
    if (!currentConv?.is_group) return false;
    const anyAdmin = currentConv.participants?.some(p => p.is_admin);
    if (!anyAdmin) return true; // groupe hérité sans admin : mode ouvert
    const me = currentConv.participants?.find(p => p.user_hubisoccer_id === currentProfile.hubisoccer_id);
    return !!me?.is_admin;
}

async function sendSystemMessage(text) {
    await sb.from('supabaseAuthPrive_messages').insert({
        conversation_id: currentConvId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        content: text,
        media_type: 'system',
        deleted_for: [],
        reactions: {},
        edited: false,
        pinned: false,
        read_by: [],
        delivered_to: [],
        listened_by: []
    });
    await sb.from('supabaseAuthPrive_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConvId);
}

function openGroupInfo() {
    if (!currentConv?.is_group) return;
    const admin = isGroupAdmin();
    const members = currentConv.participants || [];
    const memberCount = members.length;

    // En-tête : avatar + nom + description
    const avatarBlock = document.getElementById('giAvatarBlock');
    const gAvatar = currentConv.group_avatar;
    avatarBlock.innerHTML = `
        ${gAvatar
            ? `<img src="${escapeHtml(gAvatar)}" alt="" class="gi-avatar">`
            : `<div class="gi-avatar-initials">${getInitials(currentConv.group_name || 'G')}</div>`}
        ${admin ? '<button class="gi-avatar-edit" id="giAvatarEditBtn" title="Changer la photo"><i class="fas fa-camera"></i></button>' : ''}
    `;
    if (admin) {
        document.getElementById('giAvatarEditBtn').addEventListener('click', () => {
            document.getElementById('giAvatarInput').click();
        });
    }

    document.getElementById('giName').textContent = currentConv.group_name || 'Groupe';
    document.getElementById('giMemberCount').textContent = `${memberCount} participant${memberCount > 1 ? 's' : ''}`;
    document.getElementById('giDescription').textContent = currentConv.group_description || 'Aucune description';
    document.getElementById('giEditNameBtn').style.display = admin ? 'inline-flex' : 'none';
    document.getElementById('giEditDescBtn').style.display = admin ? 'inline-flex' : 'none';
    document.getElementById('giAddMemberBtn').style.display = admin ? 'flex' : 'none';

    // Liste des membres
    const list = document.getElementById('giMembersList');
    list.innerHTML = members.map(p => {
        const prof = p.profile || {};
        const name = prof.full_name || prof.display_name || 'Utilisateur';
        const isMe = p.user_hubisoccer_id === currentProfile.hubisoccer_id;
        const online = onlineUsers.has(p.user_hubisoccer_id);
        const canManage = admin && !isMe;
        return `
        <div class="gi-member" data-uid="${escapeHtml(p.user_hubisoccer_id)}">
            <div class="gi-member-avatar-wrap">
                ${prof.avatar_url
                    ? `<img src="${escapeHtml(prof.avatar_url)}" alt="">`
                    : `<div class="gi-member-initials">${getInitials(name)}</div>`}
                <span class="gi-online-dot ${online ? 'online' : ''}"></span>
            </div>
            <div class="gi-member-info">
                <span class="gi-member-name">${escapeHtml(name)}${isMe ? ' (vous)' : ''}</span>
                ${p.is_admin ? '<span class="gi-admin-badge">Admin</span>' : ''}
            </div>
            ${canManage ? `
            <div class="gi-member-actions">
                <button class="gi-action-btn gi-toggle-admin" title="${p.is_admin ? 'Retirer admin' : 'Nommer admin'}">
                    <i class="fas ${p.is_admin ? 'fa-user-minus' : 'fa-user-shield'}"></i>
                </button>
                <button class="gi-action-btn danger gi-remove-member" title="Retirer du groupe">
                    <i class="fas fa-times"></i>
                </button>
            </div>` : ''}
        </div>`;
    }).join('');

    list.querySelectorAll('.gi-toggle-admin').forEach(btn => {
        btn.addEventListener('click', () => toggleMemberAdmin(btn.closest('.gi-member').dataset.uid));
    });
    list.querySelectorAll('.gi-remove-member').forEach(btn => {
        btn.addEventListener('click', () => removeGroupMember(btn.closest('.gi-member').dataset.uid));
    });

    openModal('modalGroupInfo');
}

async function reloadGroupAndRefresh() {
    await loadConversation(currentConvId);
    openGroupInfo();
}

async function editGroupName() {
    const newName = prompt('Nouveau nom du groupe :', currentConv.group_name || '');
    if (!newName || !newName.trim()) return;
    const { error } = await sb.from('supabaseAuthPrive_conversations')
        .update({ group_name: newName.trim() })
        .eq('id', currentConvId);
    if (error) { toast('Erreur lors du renommage', 'error'); return; }
    await sendSystemMessage(`✏️ ${currentProfile.full_name || 'Un membre'} a renommé le groupe en "${newName.trim()}"`);
    toast('Groupe renommé', 'success');
    await reloadGroupAndRefresh();
}

async function editGroupDescription() {
    const newDesc = prompt('Description du groupe :', currentConv.group_description || '');
    if (newDesc === null) return;
    const { error } = await sb.from('supabaseAuthPrive_conversations')
        .update({ group_description: newDesc.trim() || null })
        .eq('id', currentConvId);
    if (error) { toast('Erreur', 'error'); return; }
    toast('Description mise à jour', 'success');
    await reloadGroupAndRefresh();
}

async function changeGroupAvatar(file) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast('Image trop lourde (max 3 Mo)', 'warning'); return; }
    setLoader(true, 'Mise à jour de la photo du groupe...');
    try {
        const ext = file.name.split('.').pop();
        const fileName = `group_${currentConvId}_${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('message_attachments')
            .upload(fileName, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from('message_attachments').getPublicUrl(fileName);
        await sb.from('supabaseAuthPrive_conversations')
            .update({ group_avatar: urlData.publicUrl })
            .eq('id', currentConvId);
        await sendSystemMessage(`🖼️ ${currentProfile.full_name || 'Un membre'} a changé la photo du groupe`);
        toast('Photo du groupe mise à jour', 'success');
        await reloadGroupAndRefresh();
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}

async function toggleMemberAdmin(uid) {
    const member = currentConv.participants?.find(p => p.user_hubisoccer_id === uid);
    if (!member) return;
    const newState = !member.is_admin;
    await sb.from('supabaseAuthPrive_conversation_participants')
        .update({ is_admin: newState })
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', uid);
    const name = member.profile?.full_name || member.profile?.display_name || 'Un membre';
    await sendSystemMessage(newState ? `⭐ ${name} est maintenant admin` : `⭐ ${name} n'est plus admin`);
    toast(newState ? 'Membre nommé admin' : 'Droits admin retirés', 'success');
    await reloadGroupAndRefresh();
}

async function removeGroupMember(uid) {
    const member = currentConv.participants?.find(p => p.user_hubisoccer_id === uid);
    if (!member) return;
    const name = member.profile?.full_name || member.profile?.display_name || 'ce membre';
    if (!confirm(`Retirer ${name} du groupe ?`)) return;
    await sb.from('supabaseAuthPrive_conversation_participants')
        .delete()
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', uid);
    await sendSystemMessage(`👋 ${name} a été retiré du groupe par ${currentProfile.full_name || 'un admin'}`);
    toast('Membre retiré', 'success');
    await reloadGroupAndRefresh();
}

async function leaveGroup() {
    if (!confirm('Quitter ce groupe ? Vous ne recevrez plus ses messages.')) return;

    // Si je suis le dernier admin, promouvoir automatiquement un autre membre
    const others = (currentConv.participants || []).filter(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
    const otherAdmins = others.filter(p => p.is_admin);
    if (isGroupAdmin() && otherAdmins.length === 0 && others.length > 0) {
        await sb.from('supabaseAuthPrive_conversation_participants')
            .update({ is_admin: true })
            .eq('conversation_id', currentConvId)
            .eq('user_hubisoccer_id', others[0].user_hubisoccer_id);
    }

    await sendSystemMessage(`👋 ${currentProfile.full_name || 'Un membre'} a quitté le groupe`);
    await sb.from('supabaseAuthPrive_conversation_participants')
        .delete()
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    toast('Vous avez quitté le groupe', 'info');
    setTimeout(goBack, 800);
}

// ----- Ajout de participants -----
async function openAddMembers() {
    selectedNewMembers = [];
    document.getElementById('amSelectedChips').innerHTML = '';
    document.getElementById('amSearch').value = '';
    openModal('modalAddMembers');

    // Contacts = abonnements + abonnés fusionnés, moins les membres actuels
    const uid = currentProfile.hubisoccer_id;
    const [followingRes, followersRes] = await Promise.all([
        sb.from('supabaseAuthPrive_follows')
            .select('following_hubisoccer_id, profile:supabaseAuthPrive_profiles!following_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('follower_hubisoccer_id', uid).limit(50),
        sb.from('supabaseAuthPrive_follows')
            .select('follower_hubisoccer_id, profile:supabaseAuthPrive_profiles!follower_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('following_hubisoccer_id', uid).limit(50)
    ]);

    const map = new Map();
    for (const f of (followingRes.data || [])) {
        map.set(f.following_hubisoccer_id, {
            id: f.following_hubisoccer_id,
            name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
            avatar: f.profile?.avatar_url || null
        });
    }
    for (const f of (followersRes.data || [])) {
        if (!map.has(f.follower_hubisoccer_id)) {
            map.set(f.follower_hubisoccer_id, {
                id: f.follower_hubisoccer_id,
                name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
                avatar: f.profile?.avatar_url || null
            });
        }
    }
    const currentIds = new Set((currentConv.participants || []).map(p => p.user_hubisoccer_id));
    groupContactsCache = Array.from(map.values()).filter(c => !currentIds.has(c.id));

    renderAddMembersList('');
}

function renderAddMembersList(query) {
    const listEl = document.getElementById('amList');
    const filtered = query
        ? groupContactsCache.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        : groupContactsCache;

    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="members-loading">Aucun contact disponible</div>';
        return;
    }

    listEl.innerHTML = filtered.map(c => {
        const selected = selectedNewMembers.some(m => m.id === c.id);
        return `
        <div class="member-item ${selected ? 'selected' : ''}" data-uid="${escapeHtml(c.id)}">
            ${c.avatar ? `<img src="${escapeHtml(c.avatar)}" alt="">` : `<div class="member-avatar-initials">${getInitials(c.name)}</div>`}
            <span class="member-name">${escapeHtml(c.name)}</span>
            <i class="fas fa-check member-check"></i>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.member-item').forEach(el => {
        el.addEventListener('click', () => {
            const uid = el.dataset.uid;
            const contact = groupContactsCache.find(c => c.id === uid);
            if (!contact) return;
            const idx = selectedNewMembers.findIndex(m => m.id === uid);
            if (idx >= 0) {
                selectedNewMembers.splice(idx, 1);
                el.classList.remove('selected');
            } else {
                selectedNewMembers.push(contact);
                el.classList.add('selected');
            }
            renderAddMembersChips();
        });
    });
}

function renderAddMembersChips() {
    const container = document.getElementById('amSelectedChips');
    container.innerHTML = selectedNewMembers.map(m => `
        <div class="selected-chip" data-uid="${escapeHtml(m.id)}">
            ${m.avatar ? `<img src="${escapeHtml(m.avatar)}" alt="">` : `<div class="chip-initials">${getInitials(m.name)}</div>`}
            <span>${escapeHtml(m.name)}</span>
            <i class="fas fa-times chip-remove"></i>
        </div>
    `).join('');
    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const uid = btn.parentElement.dataset.uid;
            selectedNewMembers = selectedNewMembers.filter(m => m.id !== uid);
            renderAddMembersChips();
            document.querySelector(`#amList .member-item[data-uid="${uid}"]`)?.classList.remove('selected');
        });
    });
}

async function confirmAddMembers() {
    if (selectedNewMembers.length === 0) { toast('Sélectionnez au moins un contact', 'warning'); return; }
    const btn = document.getElementById('amConfirmBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ajout...';
    try {
        await sb.from('supabaseAuthPrive_conversation_participants')
            .insert(selectedNewMembers.map(m => ({
                conversation_id: currentConvId,
                user_hubisoccer_id: m.id,
                is_admin: false
            })));
        const names = selectedNewMembers.map(m => m.name).join(', ');
        await sendSystemMessage(`➕ ${currentProfile.full_name || 'Un admin'} a ajouté ${names}`);
        toast(`${selectedNewMembers.length} membre(s) ajouté(s)`, 'success');
        closeModal('modalAddMembers');
        closeModal('modalGroupInfo');
        await reloadGroupAndRefresh();
    } catch (err) {
        toast('Erreur lors de l\'ajout', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Ajouter';
    }
}
// ========== FIN : INFOS & GESTION DU GROUPE ==========

// ========== DEBUT : ACTIONS DE CONVERSATION (sourdine, archive, suppression) ==========
async function toggleMuteConversation() {
    const cid = String(currentConvId);
    const { data: existing } = await sb.from('supabaseAuthPrive_muted_conversations')
        .select('conversation_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('conversation_id', cid)
        .maybeSingle();
    if (existing) {
        await sb.from('supabaseAuthPrive_muted_conversations').delete()
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('conversation_id', cid);
        toast('Notifications réactivées 🔔', 'success');
    } else {
        await sb.from('supabaseAuthPrive_muted_conversations')
            .upsert({ user_hubisoccer_id: currentProfile.hubisoccer_id, conversation_id: cid, muted_until: null },
                    { onConflict: 'user_hubisoccer_id, conversation_id' });
        toast('Conversation en sourdine 🔕', 'success');
    }
}

async function archiveCurrentConversation() {
    const cid = String(currentConvId);
    const { data: existing } = await sb.from('supabaseAuthPrive_archived_conversations')
        .select('conversation_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('conversation_id', cid)
        .maybeSingle();
    if (existing) {
        await sb.from('supabaseAuthPrive_archived_conversations').delete()
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('conversation_id', cid);
        toast('Conversation désarchivée', 'success');
    } else {
        await sb.from('supabaseAuthPrive_archived_conversations')
            .insert({ user_hubisoccer_id: currentProfile.hubisoccer_id, conversation_id: cid });
        toast('Conversation archivée 📥', 'success');
        setTimeout(goBack, 800);
    }
}

async function deleteCurrentConversation() {
    if (!confirm('Supprimer cette conversation ? Elle disparaîtra de votre liste.')) return;
    await sb.from('supabaseAuthPrive_conversation_participants')
        .delete()
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    const { count } = await sb.from('supabaseAuthPrive_conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', currentConvId);
    if ((count || 0) === 0) {
        await sb.from('supabaseAuthPrive_messages').delete().eq('conversation_id', currentConvId);
        await sb.from('supabaseAuthPrive_conversations').delete().eq('id', currentConvId);
    }
    toast('Conversation supprimée', 'success');
    setTimeout(goBack, 600);
}

// ----- Modale des messages épinglés -----
function openPinnedModal() {
    const list = document.getElementById('pinnedList');
    if (pinnedMessages.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px">Aucun message épinglé</p>';
    } else {
        list.innerHTML = pinnedMessages.map(m => {
            const author = m.author || {};
            const name = author.full_name || author.display_name || 'Utilisateur';
            return `
            <div class="pinned-msg-item" data-msg-id="${m.id}">
                <div class="pinned-msg-text">${escapeHtml(m.content?.substring(0, 100) || '📎 Média')}</div>
                <div class="pinned-msg-meta">${escapeHtml(name)} · ${timeSince(m.created_at)}</div>
            </div>`;
        }).join('');
        list.querySelectorAll('.pinned-msg-item').forEach(el => {
            el.addEventListener('click', () => {
                closeModal('modalPinned');
                scrollToMessage(el.dataset.msgId);
            });
        });
    }
    openModal('modalPinned');
}
// ========== FIN : ACTIONS DE CONVERSATION ==========

// ========== DEBUT : MENU CONTEXTUEL ==========
function showContextMenu(e, msg) {
    e.preventDefault();
    const menu = document.getElementById('contextMenu');
    ctxMsgId = msg.id;
    const isOwn = msg.user_hubisoccer_id === currentProfile.hubisoccer_id;
    document.getElementById('ctxEdit').style.display = isOwn && msg.content ? 'flex' : 'none';
    document.getElementById('ctxDeleteAll').style.display = isOwn ? 'flex' : 'none';
    // « Qui a lu ? » : seulement sur mes messages, en groupe
    const ctxInfo = document.getElementById('ctxReadInfo');
    if (ctxInfo) ctxInfo.style.display = (isOwn && currentConv?.is_group) ? 'flex' : 'none';
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
    document.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
    ctxMsgId = null;
}
// ========== FIN : MENU CONTEXTUEL ==========

// ========== DEBUT : SCROLL ==========
function scrollToBottom(smooth = true) {
    const area = document.getElementById('messagesArea');
    area.scrollTo({ top: area.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
    document.getElementById('scrollBottomBtn').style.display = 'none';
    document.getElementById('scrollUnreadBadge').style.display = 'none';
}

function scrollToMessage(msgId) {
    const el = document.querySelector(`.msg-row[data-msg-id="${msgId}"]`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.querySelector('.msg-bubble')?.classList.add('highlighted');
        setTimeout(() => el.querySelector('.msg-bubble')?.classList.remove('highlighted'), 1500);
    }
}

function showScrollBadge() {
    const btn = document.getElementById('scrollBottomBtn');
    btn.style.display = 'flex';
}
// ========== FIN : SCROLL ==========

// ========== DEBUT : INPUT & TYPING ==========
function autoResizeInput() {
    const el = document.getElementById('msgInput');
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    const previewBtn = document.getElementById('previewMsgBtn');
    if (previewBtn) {
        previewBtn.style.display = el.value.length > 1500 ? 'flex' : 'none';
    }
}

function startTyping() {
    if (!isTyping) { isTyping = true; sendTypingEvent(); }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 2500);
}

function stopTyping() {
    isTyping = false;
    clearTimeout(typingTimeout);
}

function sendTypingEvent() {
    typingSubscription?.send({
        type: 'broadcast', event: 'typing',
        payload: { user_id: currentProfile.hubisoccer_id }
    });
}
// ========== FIN : INPUT & TYPING ==========

// ========== DEBUT : PRÉSENCE & REALTIME ==========
function subscribeMessages() {
    if (msgSubscription) msgSubscription.unsubscribe();
    msgSubscription = sb.channel(`discuss:${currentConvId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_messages', filter: `conversation_id=eq.${currentConvId}` },
            async (payload) => {
                const msg = payload.new;
                if (msg.user_hubisoccer_id === currentProfile.hubisoccer_id) return;
                if (msg.deleted_for?.includes(currentProfile.hubisoccer_id)) return;
                if (msg.expires_at && new Date(msg.expires_at).getTime() < Date.now()) return;
                const { data: author } = await sb.from('supabaseAuthPrive_profiles')
                    .select('hubisoccer_id, full_name, display_name, avatar_url')
                    .eq('hubisoccer_id', msg.user_hubisoccer_id)
                    .single();
                const fullMsg = { ...msg, author };
                appendMessage(fullMsg);
                // ✓✓ distribué : le message vient d'atteindre mon appareil
                markDeliveredSingle(fullMsg);
                // ✓✓ bleu : seulement si l'onglet est réellement visible
                markAsRead();
                // Notification navigateur si l'onglet est en arrière-plan
                notifyNewMessage(fullMsg);
                stopTypingIndicator();
            })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'supabaseAuthPrive_messages', filter: `conversation_id=eq.${currentConvId}` },
            (payload) => {
                const msg = payload.new;
                if (msg.deleted_for?.includes(currentProfile.hubisoccer_id)) {
                    removeMessageFromDOM(msg.id);
                    return;
                }
                const existing = messages.find(m => m.id === msg.id);
                if (existing) updateMessageInDOM({ ...existing, ...msg });
                if (msg.pinned !== undefined) loadPinnedMessages();
            })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'supabaseAuthPrive_messages', filter: `conversation_id=eq.${currentConvId}` },
            (payload) => removeMessageFromDOM(payload.old.id))
        .subscribe();
}

function subscribeTyping() {
    typingSubscription = sb.channel(`typing:${currentConvId}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
            if (payload.payload.user_id === currentProfile.hubisoccer_id) return;
            showTypingIndicator();
            clearTimeout(typingSubscription._typingHide);
            typingSubscription._typingHide = setTimeout(stopTypingIndicator, 3000);
        })
        .subscribe();
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'flex';
    const area = document.getElementById('messagesArea');
    area.scrollTop = area.scrollHeight;
}

function stopTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

function initPresence() {
    presenceChannel = sb.channel('hubisoccer_presence');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            onlineUsers = new Set(Object.values(state).flat().map(p => p.user_id));
            updateOnlineStatus();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: currentProfile.hubisoccer_id });
            }
        });
}

function updateOnlineStatus() {
    if (!currentConv || currentConv.is_group) return;
    const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
    if (!other) return;
    const isOnline = onlineUsers.has(other.user_hubisoccer_id);
    document.getElementById('onlineIndicator').classList.toggle('online', isOnline);
    const status = document.getElementById('contactStatus');
    status.textContent = isOnline ? 'En ligne' : 'Hors ligne';
    status.className = `contact-status ${isOnline ? 'online' : ''}`;
}
// ========== FIN : PRÉSENCE & REALTIME ==========

// ========== DEBUT : PIÈCES JOINTES ==========
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) { toast('Fichier trop volumineux (max 500 Mo)', 'warning'); return; }
    pendingFile = file;
    showAttachmentPreview(file);
}

function showAttachmentPreview(file) {
    const el = document.getElementById('attachmentPreview');
    const size = (file.size / 1024 / 1024).toFixed(1) + ' Mo';
    let thumbHtml = '';
    if (file.type.startsWith('image/')) {
        thumbHtml = `<img class="preview-thumb" src="${URL.createObjectURL(file)}" alt="">`;
    } else {
        thumbHtml = `<div class="preview-icon"><i class="fas fa-file"></i></div>`;
    }
    el.innerHTML = `
        ${thumbHtml}
        <div class="preview-info">
            <div class="preview-name">${escapeHtml(file.name)}</div>
            <div class="preview-size">${size}</div>
        </div>
        <button class="preview-remove" id="removePreviewBtn"><i class="fas fa-times"></i></button>
    `;
    el.style.display = 'flex';
    document.getElementById('removePreviewBtn').addEventListener('click', clearAttachmentPreview);
}

function clearAttachmentPreview() {
    pendingFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('attachmentPreview').style.display = 'none';
}
// ========== FIN : PIÈCES JOINTES ==========

// ========== DEBUT : AUDIO RECORDER ==========
// 🔥 CORRECTION DU BUG AUDIO : détection du format réellement supporté par
// l'appareil. Safari (iPhone/iPad/Mac) ne lit PAS le webm — il enregistre en
// mp4/AAC. On choisit le format natif de l'appareil et on garde extension +
// contentType cohérents pour que TOUT LE MONDE puisse lire le vocal.
function pickAudioFormat() {
    const candidates = [
        { mime: 'audio/mp4',              ext: 'm4a'  },  // Safari iOS/macOS
        { mime: 'audio/webm;codecs=opus', ext: 'webm' },  // Chrome / Edge / Android
        { mime: 'audio/webm',             ext: 'webm' },
        { mime: 'audio/ogg;codecs=opus',  ext: 'ogg'  }   // Firefox
    ];
    if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
        for (const c of candidates) {
            if (MediaRecorder.isTypeSupported(c.mime)) return c;
        }
    }
    return { mime: '', ext: 'webm' };
}

function audioExtFromMime(mime) {
    if (!mime) return 'webm';
    if (mime.includes('mp4')) return 'm4a';
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mpeg')) return 'mp3';
    return 'webm';
}

async function startAudioRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const format = pickAudioFormat();
        try {
            mediaRecorder = format.mime
                ? new MediaRecorder(stream, { mimeType: format.mime })
                : new MediaRecorder(stream);
        } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
        }
        recAudioMime = mediaRecorder.mimeType || format.mime || 'audio/webm';
        audioChunks = [];
        recSeconds = 0;
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            // Le blob garde le VRAI type produit par l'appareil (plus jamais un faux "webm")
            pendingAudioBlob = new Blob(audioChunks, { type: recAudioMime.split(';')[0] });
            recAudioDuration = recSeconds;
            stream.getTracks().forEach(t => t.stop());
            document.getElementById('audioRecorderBar').style.display = 'none';
            showAudioPreview(pendingAudioBlob);
        };
        mediaRecorder.start();
        document.getElementById('audioRecorderBar').style.display = 'flex';
        document.getElementById('recTime').textContent = '0:00';
        recInterval = setInterval(() => {
            recSeconds++;
            const m = Math.floor(recSeconds / 60);
            const s = recSeconds % 60;
            document.getElementById('recTime').textContent = `${m}:${s.toString().padStart(2, '0')}`;
            if (recSeconds >= 300) stopAudioRecorder();
        }, 1000);
    } catch (err) {
        toast('Micro non disponible', 'error');
    }
}

function stopAudioRecorder() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    clearInterval(recInterval);
    document.getElementById('audioRecorderBar').style.display = 'none';
}

function cancelAudioRecorder() {
    pendingAudioBlob = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.ondataavailable = null;
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
    }
    clearInterval(recInterval);
    document.getElementById('audioRecorderBar').style.display = 'none';
}

function showAudioPreview(blob) {
    const bar = document.getElementById('audioPreviewBar');
    const player = document.getElementById('audioPreviewPlayer');
    player.src = URL.createObjectURL(blob);
    bar.style.display = 'flex';
}

function discardRecordedAudio() {
    pendingAudioBlob = null;
    document.getElementById('audioPreviewBar').style.display = 'none';
    document.getElementById('audioPreviewPlayer').src = '';
}

function sendRecordedAudio() {
    if (pendingAudioBlob) {
        sendMessage();
    }
}
// ========== FIN : AUDIO RECORDER ==========

// ========== DEBUT : FORMATAGE ==========
function applyFormatting(tag) {
    const input = document.getElementById('msgInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const selected = text.substring(start, end);
    let formatted = '';
    if (tag === 'bold') formatted = `**${selected}**`;
    else if (tag === 'italic') formatted = `*${selected}*`;
    else if (tag === 'underline') formatted = `__${selected}__`;
    else if (tag === 'strike') formatted = `~~${selected}~~`;
    else if (tag === 'code') formatted = `\`${selected}\``;
    else if (tag === 'link') {
        const url = prompt('Entrez l\'URL :', 'https://');
        if (url) formatted = `[${selected}](${url})`;
    }
    if (formatted) {
        input.value = text.substring(0, start) + formatted + text.substring(end);
        input.focus();
        input.setSelectionRange(start + formatted.length, start + formatted.length);
    }
    autoResizeInput();
}
// ========== FIN : FORMATAGE ==========

// ========== DEBUT : APERÇU MESSAGE ==========
function showMessagePreview() {
    const content = document.getElementById('msgInput').value;
    const previewDiv = document.getElementById('previewContent');
    previewDiv.innerHTML = formatMsgText(content);
    openModal('modalMessagePreview');
}

function confirmPreviewAndSend() {
    closeModal('modalMessagePreview');
    sendMessage();
}
// ========== FIN : APERÇU MESSAGE ==========

// ========== DEBUT : MODE SOMBRE ==========
function applyTheme() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('hubisoccer_dark_mode', darkMode);
}

function toggleDarkMode() {
    darkMode = !darkMode;
    applyTheme();
    toast(darkMode ? 'Mode sombre activé' : 'Mode clair activé', 'info');
}

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
systemDark.addEventListener('change', (e) => {
    if (localStorage.getItem('hubisoccer_dark_mode') === null) {
        darkMode = e.matches;
        applyTheme();
    }
});
if (localStorage.getItem('hubisoccer_dark_mode') === null) {
    darkMode = systemDark.matches;
}
// ========== FIN : MODE SOMBRE ==========

// ========== DEBUT : THÈMES & ARRIÈRE-PLANS DE CONVERSATION ==========
const CHAT_BACKGROUNDS = [
    { id: 'default',   label: 'Par défaut',  css: '' },
    { id: 'violet',    label: 'Violet doux', css: 'linear-gradient(160deg,#f0ebf8,#e4d9f5)' },
    { id: 'or',        label: 'Or',          css: 'linear-gradient(160deg,#fdf7e3,#f7ecc9)' },
    { id: 'menthe',    label: 'Menthe',      css: 'linear-gradient(160deg,#e8f7f0,#d5efe4)' },
    { id: 'ciel',      label: 'Ciel',        css: 'linear-gradient(160deg,#e8f1fb,#d6e6f7)' },
    { id: 'rose',      label: 'Rosé',        css: 'linear-gradient(160deg,#fbecf2,#f5dae6)' },
    { id: 'sable',     label: 'Sable',       css: 'linear-gradient(160deg,#f7f2ea,#efe5d6)' },
    { id: 'nuit',      label: 'Nuit',        css: 'linear-gradient(160deg,#1e1e2f,#12121c)' },
    { id: 'stade',     label: 'Stade',       css: 'linear-gradient(160deg,#e9f5e9,#d7ecd7)' },
    { id: 'terrain',   label: 'Terrain',     css: 'repeating-linear-gradient(90deg,#e8f3e8 0 40px,#dfeedf 40px 80px)' },
    { id: 'pois',      label: 'Pois',        css: 'radial-gradient(circle at 12px 12px, rgba(85,27,140,0.09) 2px, transparent 3px) 0 0/24px 24px, #f4f0fa' },
    { id: 'lignes',    label: 'Rayures',     css: 'repeating-linear-gradient(45deg, #f4f0fa 0 12px, #ece5f6 12px 24px)' }
];

let currentChatBackground = 'default';

async function loadChatPrefs() {
    // Fond propre à cette conversation
    try {
        const { data } = await sb.from('supabaseAuthPrive_chat_prefs')
            .select('background')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('conversation_id', String(currentConvId))
            .maybeSingle();
        currentChatBackground = data?.background || 'default';
    } catch (e) { currentChatBackground = 'default'; }
    applyChatBackground(currentChatBackground);

    // Réglages globaux venus de settings-msg (taille de police, forme des bulles)
    try {
        const { data } = await sb.from('supabaseAuthPrive_user_msg_settings')
            .select('settings')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        applyMessagingSettings(data?.settings || {});
    } catch (e) { /* réglages facultatifs */ }
}

function applyChatBackground(bgId) {
    currentChatBackground = bgId;
    const area = document.getElementById('messagesArea');
    if (!area) return;
    if (!bgId || bgId === 'default') {
        area.style.background = '';
        return;
    }
    if (bgId.startsWith('http')) {
        area.style.background = `url("${bgId}") center/cover fixed`;
        return;
    }
    const bg = CHAT_BACKGROUNDS.find(b => b.id === bgId);
    area.style.background = bg ? bg.css : '';
}

async function saveChatBackground(bgId) {
    applyChatBackground(bgId);
    await sb.from('supabaseAuthPrive_chat_prefs').upsert({
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        conversation_id: String(currentConvId),
        background: bgId,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_hubisoccer_id, conversation_id' });
    toast('Arrière-plan mis à jour', 'success');
}

// Applique enfin les réglages de settings-msg (ils étaient sauvegardés mais ignorés)
function applyMessagingSettings(s) {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.body.style.fontSize = sizes[s.fontSize] || '16px';

    const radii = { rounded: '18px', slightly: '8px', square: '2px' };
    document.documentElement.style.setProperty('--bubble-radius', radii[s.bubbleStyle] || '18px');
    document.body.classList.toggle('bubbles-square', s.bubbleStyle === 'square');
    document.body.classList.toggle('bubbles-slightly', s.bubbleStyle === 'slightly');

    if (s.theme === 'dark') { darkMode = true; applyTheme(); }
    else if (s.theme === 'light') { darkMode = false; applyTheme(); }
}

function openBackgroundModal() {
    const grid = document.getElementById('bgGrid');
    grid.innerHTML = CHAT_BACKGROUNDS.map(b => `
        <div class="bg-choice ${currentChatBackground === b.id ? 'active' : ''}" data-bg="${b.id}">
            <div class="bg-preview" style="background:${b.css || 'var(--bg-page)'}"></div>
            <span>${b.label}</span>
        </div>`).join('');

    grid.querySelectorAll('.bg-choice').forEach(el => {
        el.addEventListener('click', () => {
            saveChatBackground(el.dataset.bg);
            grid.querySelectorAll('.bg-choice').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
        });
    });
    openModal('modalBackground');
}

async function uploadCustomBackground(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('Image trop lourde (max 4 Mo)', 'warning'); return; }
    setLoader(true, 'Envoi de l\'arrière-plan...');
    try {
        const ext = file.name.split('.').pop();
        const fileName = `bg_${currentProfile.hubisoccer_id}_${Date.now()}.${ext}`;
        const { error } = await sb.storage.from('message_attachments')
            .upload(fileName, file, { contentType: file.type });
        if (error) throw error;
        const { data } = sb.storage.from('message_attachments').getPublicUrl(fileName);
        await saveChatBackground(data.publicUrl);
        closeModal('modalBackground');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}
// ========== FIN : THÈMES & ARRIÈRE-PLANS ==========

// ========== DEBUT : SÉLECTION MULTIPLE DE MESSAGES ==========
let msgSelectionMode = false;
let selectedMsgIds = new Set();

function enterMsgSelection(firstId = null) {
    msgSelectionMode = true;
    selectedMsgIds = new Set();
    if (firstId) selectedMsgIds.add(String(firstId));
    document.getElementById('msgSelectionBar').style.display = 'flex';
    document.body.classList.add('msg-selecting');
    updateMsgSelectionUI();
}

function exitMsgSelection() {
    msgSelectionMode = false;
    selectedMsgIds = new Set();
    document.getElementById('msgSelectionBar').style.display = 'none';
    document.body.classList.remove('msg-selecting');
    document.querySelectorAll('.msg-row.msg-selected').forEach(el => el.classList.remove('msg-selected'));
}

function toggleMsgSelection(msgId) {
    const id = String(msgId);
    if (selectedMsgIds.has(id)) selectedMsgIds.delete(id);
    else selectedMsgIds.add(id);
    if (selectedMsgIds.size === 0) { exitMsgSelection(); return; }
    updateMsgSelectionUI();
}

function updateMsgSelectionUI() {
    document.getElementById('msgSelectionCount').textContent =
        `${selectedMsgIds.size} message${selectedMsgIds.size > 1 ? 's' : ''}`;
    document.querySelectorAll('.msg-row').forEach(el => {
        el.classList.toggle('msg-selected', selectedMsgIds.has(String(el.dataset.msgId)));
    });
}

function copySelectedMessages() {
    const texts = messages
        .filter(m => selectedMsgIds.has(String(m.id)) && m.content)
        .map(m => {
            const a = m.author || {};
            return `${a.full_name || a.display_name || 'Utilisateur'} : ${m.content}`;
        });
    if (texts.length === 0) { toast('Aucun texte à copier', 'warning'); return; }
    navigator.clipboard.writeText(texts.join('\n'));
    toast(`${texts.length} message(s) copié(s)`, 'success');
    exitMsgSelection();
}

async function deleteSelectedMessages() {
    if (!confirm(`Supprimer ${selectedMsgIds.size} message(s) pour vous ?`)) return;
    for (const id of selectedMsgIds) {
        const msg = messages.find(m => String(m.id) === id);
        if (!msg) continue;
        const newDeleted = [...(msg.deleted_for || []), currentProfile.hubisoccer_id];
        await sb.from('supabaseAuthPrive_messages').update({ deleted_for: newDeleted }).eq('id', msg.id);
        removeMessageFromDOM(msg.id);
    }
    exitMsgSelection();
    toast('Messages supprimés', 'success');
}

async function forwardSelectedMessages() {
    if (selectedMsgIds.size === 0) return;
    // Réutilise la modale de transfert existante, en mode multiple
    const { data: participations } = await sb
        .from('supabaseAuthPrive_conversation_participants')
        .select('conversation_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const convIds = (participations || []).map(p => p.conversation_id).filter(id => id !== currentConvId);

    const { data: convs } = await sb
        .from('supabaseAuthPrive_conversations')
        .select('id, is_group, group_name, participants:supabaseAuthPrive_conversation_participants(user_hubisoccer_id, profile:supabaseAuthPrive_profiles!user_hubisoccer_id(full_name, display_name))')
        .in('id', convIds);

    const list = document.getElementById('forwardList');
    list.innerHTML = (convs || []).map(conv => {
        let name;
        if (conv.is_group) name = conv.group_name || 'Groupe';
        else {
            const other = conv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
            name = other?.profile?.full_name || other?.profile?.display_name || 'Utilisateur';
        }
        return `<div class="forward-item" data-conv-id="${conv.id}"><span>${escapeHtml(name)}</span></div>`;
    }).join('');

    list.querySelectorAll('.forward-item').forEach(el => {
        el.addEventListener('click', async () => {
            const targetId = el.dataset.convId;
            const toSend = messages.filter(m => selectedMsgIds.has(String(m.id)));
            for (const m of toSend) {
                await sb.from('supabaseAuthPrive_messages').insert({
                    conversation_id: targetId,
                    user_hubisoccer_id: currentProfile.hubisoccer_id,
                    content: m.content,
                    media_url: m.media_url,
                    media_type: m.media_type === 'system' ? null : m.media_type,
                    duration_seconds: m.duration_seconds || null,
                    deleted_for: [], reactions: {}, edited: false, pinned: false,
                    read_by: [], delivered_to: [], listened_by: []
                });
            }
            closeModal('modalForward');
            exitMsgSelection();
            toast(`${toSend.length} message(s) transféré(s)`, 'success');
        });
    });

    openModal('modalForward');
}
// ========== FIN : SÉLECTION MULTIPLE DE MESSAGES ==========

// ========== DEBUT : MENTIONS @ EN GROUPE ==========
let mentionActive = false;
let mentionStartPos = -1;

function handleMentionInput() {
    if (!currentConv?.is_group) return;
    const input = document.getElementById('msgInput');
    const pos = input.selectionStart;
    const before = input.value.substring(0, pos);
    const match = before.match(/@([\wÀ-ſ]*)$/);

    if (!match) { hideMentionBox(); return; }

    mentionActive = true;
    mentionStartPos = pos - match[0].length;
    const query = match[1].toLowerCase();

    const candidates = (currentConv.participants || [])
        .filter(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id)
        .map(p => ({
            id: p.user_hubisoccer_id,
            name: p.profile?.full_name || p.profile?.display_name || 'Utilisateur',
            avatar: p.profile?.avatar_url || null
        }))
        .filter(c => !query || c.name.toLowerCase().includes(query))
        .slice(0, 6);

    if (candidates.length === 0) { hideMentionBox(); return; }

    const box = document.getElementById('mentionBox');
    box.innerHTML = candidates.map(c => `
        <div class="mention-item" data-name="${escapeHtml(c.name)}">
            ${c.avatar
                ? `<img src="${escapeHtml(c.avatar)}" alt="">`
                : `<div class="mention-initials">${getInitials(c.name)}</div>`}
            <span>${escapeHtml(c.name)}</span>
        </div>`).join('');

    box.querySelectorAll('.mention-item').forEach(el => {
        el.addEventListener('click', () => insertMention(el.dataset.name));
    });
    box.style.display = 'block';
}

function insertMention(name) {
    const input = document.getElementById('msgInput');
    const pos = input.selectionStart;
    const after = input.value.substring(pos);
    const before = input.value.substring(0, mentionStartPos);
    input.value = `${before}@${name} ${after}`;
    const newPos = before.length + name.length + 2;
    input.setSelectionRange(newPos, newPos);
    input.focus();
    hideMentionBox();
    autoResizeInput();
}

function hideMentionBox() {
    mentionActive = false;
    const box = document.getElementById('mentionBox');
    if (box) box.style.display = 'none';
}
// ========== FIN : MENTIONS ==========

// ========== DEBUT : QUI A LU ? (groupes) ==========
async function showReadReceipts(msgId) {
    const msg = messages.find(m => String(m.id) === String(msgId));
    if (!msg) return;
    if (msg.user_hubisoccer_id !== currentProfile.hubisoccer_id) {
        toast('Disponible uniquement sur vos propres messages', 'info');
        return;
    }

    const readIds = (msg.read_by || []).filter(id => id !== currentProfile.hubisoccer_id);
    const deliveredIds = (msg.delivered_to || []).filter(id => id !== currentProfile.hubisoccer_id && !readIds.includes(id));
    const others = (currentConv?.participants || []).filter(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
    const pending = others.filter(p => !readIds.includes(p.user_hubisoccer_id) && !deliveredIds.includes(p.user_hubisoccer_id));

    const nameOf = (uid) => {
        const p = others.find(o => o.user_hubisoccer_id === uid);
        return p?.profile?.full_name || p?.profile?.display_name || 'Utilisateur';
    };
    const avatarOf = (uid) => others.find(o => o.user_hubisoccer_id === uid)?.profile?.avatar_url || null;

    const section = (title, icon, ids) => {
        if (ids.length === 0) return '';
        return `
        <div class="rr-section">
            <h4><i class="fas ${icon}"></i> ${title} <span>${ids.length}</span></h4>
            ${ids.map(uid => {
                const n = nameOf(uid), a = avatarOf(uid);
                return `<div class="rr-item">
                    ${a ? `<img src="${escapeHtml(a)}" alt="">` : `<div class="rr-initials">${getInitials(n)}</div>`}
                    <span>${escapeHtml(n)}</span>
                </div>`;
            }).join('')}
        </div>`;
    };

    document.getElementById('readReceiptsBody').innerHTML =
        section('Lu par', 'fa-check-double', readIds) +
        section('Reçu par', 'fa-check', deliveredIds.filter(id => others.some(o => o.user_hubisoccer_id === id))) +
        section('En attente', 'fa-clock', pending.map(p => p.user_hubisoccer_id))
        || '<p class="empty-text-sm">Aucune information disponible</p>';

    openModal('modalReadReceipts');
}
// ========== FIN : QUI A LU ? ==========

// ========== DEBUT : NOTIFICATIONS PUSH ==========
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service worker enregistré', registration);
                } catch (err) {
                    console.warn('Service worker non enregistré', err);
                }
            }
        }
    }
}

function notifyNewMessage(msg) {
    if (Notification.permission === 'granted' && document.hidden) {
        const author = msg.author || {};
        const title = author.full_name || author.display_name || 'Nouveau message';
        const options = {
            body: msg.content || '📎 Fichier média',
            icon: author.avatar_url || '../../img/logo-navbar.png',
            tag: `msg-${msg.id}`,
            renotify: true
        };
        new Notification(title, options);
    }
}
// ========== FIN : NOTIFICATIONS PUSH ==========

// ========== DEBUT : MODALES & NAVIGATION ==========
function openMediaZoom(url, type) {
    const modal = document.getElementById('modalMedia');
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'image' ? `<img src="${url}" alt="Image">` : `<video src="${url}" controls autoplay></video>`;
    openModal('modalMedia');
}
window.openMediaZoom = openMediaZoom;

async function markAsRead() {
    // Ne pas marquer "lu" si l'onglet est en arrière-plan (le vrai "lu" attend le retour)
    if (document.visibilityState !== 'visible') return;

    await sb.from('supabaseAuthPrive_conversation_participants')
        .update({ last_read_at: new Date().toISOString(), manually_unread: false })
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    // Remplir read_by des messages reçus non encore lus (alimente les coches ✓✓ bleues)
    const toMark = messages.filter(m =>
        m.user_hubisoccer_id !== currentProfile.hubisoccer_id &&
        !(m.read_by || []).includes(currentProfile.hubisoccer_id) &&
        !readMarked.has(m.id)
    );
    for (const m of toMark) {
        readMarked.add(m.id);
        const updated = [...(m.read_by || []), currentProfile.hubisoccer_id];
        m.read_by = updated;
        sb.from('supabaseAuthPrive_messages').update({ read_by: updated }).eq('id', m.id).then(() => {});
    }
}

// Marque "distribué" les messages reçus (dès qu'ils atteignent mon appareil)
async function markDeliveredForLoaded() {
    const toMark = messages.filter(m =>
        m.user_hubisoccer_id !== currentProfile.hubisoccer_id &&
        !(m.delivered_to || []).includes(currentProfile.hubisoccer_id) &&
        !deliveryMarked.has(m.id)
    );
    for (const m of toMark) {
        deliveryMarked.add(m.id);
        const updated = [...(m.delivered_to || []), currentProfile.hubisoccer_id];
        m.delivered_to = updated;
        sb.from('supabaseAuthPrive_messages').update({ delivered_to: updated }).eq('id', m.id).then(() => {});
    }
}

function markDeliveredSingle(msg) {
    if (msg.user_hubisoccer_id === currentProfile.hubisoccer_id) return;
    if ((msg.delivered_to || []).includes(currentProfile.hubisoccer_id)) return;
    if (deliveryMarked.has(msg.id)) return;
    deliveryMarked.add(msg.id);
    const updated = [...(msg.delivered_to || []), currentProfile.hubisoccer_id];
    msg.delivered_to = updated;
    sb.from('supabaseAuthPrive_messages').update({ delivered_to: updated }).eq('id', msg.id).then(() => {});
}

// ========== DEBUT : BROUILLONS (lus par conversation.html) ==========
let draftSaveTimer = null;

async function loadDraft() {
    const { data } = await sb.from('supabaseAuthPrive_msg_drafts')
        .select('content')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('conversation_id', String(currentConvId))
        .maybeSingle();
    const input = document.getElementById('msgInput');
    if (data?.content && input && !input.value) {
        input.value = data.content;
        autoResizeInput();
    }
}

function saveDraftDebounced() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(async () => {
        const content = document.getElementById('msgInput')?.value || '';
        if (content.trim() === '') {
            await deleteDraft();
            return;
        }
        await sb.from('supabaseAuthPrive_msg_drafts').upsert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            conversation_id: String(currentConvId),
            content,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_hubisoccer_id, conversation_id' });
    }, 800);
}

async function deleteDraft() {
    clearTimeout(draftSaveTimer);
    await sb.from('supabaseAuthPrive_msg_drafts').delete()
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('conversation_id', String(currentConvId));
}
// ========== FIN : BROUILLONS ==========
// ========== FIN : MODALES & NAVIGATION ==========


// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement de la conversation...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) { setLoader(false); return; }

    const params = new URLSearchParams(window.location.search);
    currentConvId = params.get('conv');
    if (!currentConvId) { toast('Conversation non spécifiée', 'error'); goBack(); return; }

    await loadConversation(currentConvId);
    await initMessages();
    initPresence();
    subscribeMessages();
    subscribeTyping();
    if (typeof initSearchBar === 'function') initSearchBar();
    applyTheme();
    requestNotificationPermission();
    loadDraft();

    // Saut direct vers un message (arrivée depuis la recherche globale de conversation.html)
    const targetMsgId = params.get('msg');
    if (targetMsgId) {
        setTimeout(() => scrollToMessage(targetMsgId), 600);
    }

    // 🔥 Écouteurs avec vérification d'existence (anti‑null)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', goBack);

    const msgInput = document.getElementById('msgInput');
    if (msgInput) {
        msgInput.addEventListener('input', () => { autoResizeInput(); startTyping(); saveDraftDebounced(); });
        msgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
    }

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) attachBtn.addEventListener('click', () => document.getElementById('fileInput')?.click());

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);

    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) audioBtn.addEventListener('click', startAudioRecorder);

    const recStopBtn = document.getElementById('recStopBtn');
    if (recStopBtn) recStopBtn.addEventListener('click', stopAudioRecorder);

    const recCancelBtn = document.getElementById('recCancelBtn');
    if (recCancelBtn) recCancelBtn.addEventListener('click', cancelAudioRecorder);

    const discardAudioBtn = document.getElementById('discardAudioBtn');
    if (discardAudioBtn) discardAudioBtn.addEventListener('click', discardRecordedAudio);

    const sendAudioBtn = document.getElementById('sendAudioBtn');
    if (sendAudioBtn) sendAudioBtn.addEventListener('click', sendRecordedAudio);

    const replyBarClose = document.getElementById('replyBarClose');
    if (replyBarClose) replyBarClose.addEventListener('click', cancelReply);

    const editBarClose = document.getElementById('editBarClose');
    if (editBarClose) editBarClose.addEventListener('click', cancelEdit);

    const previewMsgBtn = document.getElementById('previewMsgBtn');
    if (previewMsgBtn) previewMsgBtn.addEventListener('click', showMessagePreview);

    const confirmPreviewBtn = document.getElementById('confirmPreviewBtn');
    if (confirmPreviewBtn) confirmPreviewBtn.addEventListener('click', confirmPreviewAndSend);

    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
        formatBtn.addEventListener('click', () => {
            const toolbar = document.getElementById('formatToolbar');
            if (toolbar) toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
        });
    }

    document.querySelectorAll('[data-format]').forEach(btn => {
        btn.addEventListener('click', () => applyFormatting(btn.dataset.format));
    });

    // Menu contextuel
    const ctxReply = document.getElementById('ctxReply');
    if (ctxReply) ctxReply.addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg) startReply(msg); });
    const ctxCopy = document.getElementById('ctxCopy');
    if (ctxCopy) ctxCopy.addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg?.content) { navigator.clipboard.writeText(msg.content); toast('Copié !', 'success'); } });
    const ctxEdit = document.getElementById('ctxEdit');
    if (ctxEdit) ctxEdit.addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg) startEdit(msg); });
    const ctxPin = document.getElementById('ctxPin');
    if (ctxPin) ctxPin.addEventListener('click', () => { if (ctxMsgId) togglePin(ctxMsgId); });
    const ctxForward = document.getElementById('ctxForward');
    if (ctxForward) ctxForward.addEventListener('click', () => { if (ctxMsgId) showForwardModal(ctxMsgId); });
    const ctxDeleteMe = document.getElementById('ctxDeleteMe');
    if (ctxDeleteMe) ctxDeleteMe.addEventListener('click', () => { if (ctxMsgId) deleteMessage(ctxMsgId, false); });
    const ctxDeleteAll = document.getElementById('ctxDeleteAll');
    if (ctxDeleteAll) ctxDeleteAll.addEventListener('click', () => { if (ctxMsgId) deleteMessage(ctxMsgId, true); });
    const ctxTranslate = document.getElementById('ctxTranslate');
    if (ctxTranslate) ctxTranslate.addEventListener('click', () => { if (ctxMsgId) translateMessage(ctxMsgId); });

    const scrollBottomBtn = document.getElementById('scrollBottomBtn');
    if (scrollBottomBtn) scrollBottomBtn.addEventListener('click', () => scrollToBottom(true));

    const loadMoreMsgs = document.getElementById('loadMoreMsgs');
    if (loadMoreMsgs) {
        loadMoreMsgs.addEventListener('click', async () => {
            if (!hasMoreMsgs) return;
            const older = await loadMessages(oldestMsgDate);
            if (older.length > 0) {
                oldestMsgDate = older[0].created_at;
                messages = [...older, ...messages];
                renderAllMessages();
            }
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) loadMoreBtn.style.display = hasMoreMsgs ? 'block' : 'none';
        });
    }

    // Options du header
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('optionsMenu')?.classList.toggle('show');
        });
    }
    document.addEventListener('click', () => document.getElementById('optionsMenu')?.classList.remove('show'));

    const optViewProfile = document.getElementById('optViewProfile');
    if (optViewProfile) {
        optViewProfile.addEventListener('click', () => {
            if (!currentConv || currentConv.is_group) return;
            const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
            if (other) window.location.href = `../community/profil-feed.html?id=${other.user_hubisoccer_id}`;
        });
    }

    const optToggleDarkMode = document.getElementById('optToggleDarkMode');
    if (optToggleDarkMode) optToggleDarkMode.addEventListener('click', toggleDarkMode);

    const optBlockUser = document.getElementById('optBlockUser');
    if (optBlockUser) {
        optBlockUser.addEventListener('click', async () => {
            if (!currentConv || currentConv.is_group) return;
            const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
            if (!other) return;
            await sb.from('supabaseAuthPrive_blocked_users').upsert({ user_hubisoccer_id: currentProfile.hubisoccer_id, blocked_hubisoccer_id: other.user_hubisoccer_id });
            toast('Utilisateur bloqué', 'success');
            await checkBlockedState(other.user_hubisoccer_id);
        });
    }

    // ----- Boutons du menu enfin branchés (sourdine / archiver / supprimer) -----
    const optMuteConv = document.getElementById('optMuteConv');
    if (optMuteConv) optMuteConv.addEventListener('click', toggleMuteConversation);

    const optArchiveConv = document.getElementById('optArchiveConv');
    if (optArchiveConv) optArchiveConv.addEventListener('click', archiveCurrentConversation);

    const optDeleteConv = document.getElementById('optDeleteConv');
    if (optDeleteConv) optDeleteConv.addEventListener('click', deleteCurrentConversation);

    // ----- Messages épinglés (icône du header + bouton « Voir » du bandeau) -----
    const pinnedMsgBtn = document.getElementById('pinnedMsgBtn');
    if (pinnedMsgBtn) pinnedMsgBtn.addEventListener('click', openPinnedModal);

    const viewPinnedBtn = document.getElementById('viewPinnedBtn');
    if (viewPinnedBtn) viewPinnedBtn.addEventListener('click', openPinnedModal);

    // ----- Infos du groupe -----
    const optGroupInfo = document.getElementById('optGroupInfo');
    if (optGroupInfo) optGroupInfo.addEventListener('click', openGroupInfo);

    const giEditNameBtn = document.getElementById('giEditNameBtn');
    if (giEditNameBtn) giEditNameBtn.addEventListener('click', editGroupName);

    const giEditDescBtn = document.getElementById('giEditDescBtn');
    if (giEditDescBtn) giEditDescBtn.addEventListener('click', editGroupDescription);

    const giAvatarInput = document.getElementById('giAvatarInput');
    if (giAvatarInput) giAvatarInput.addEventListener('change', (e) => changeGroupAvatar(e.target.files[0]));

    const giAddMemberBtn = document.getElementById('giAddMemberBtn');
    if (giAddMemberBtn) giAddMemberBtn.addEventListener('click', openAddMembers);

    const giLeaveBtn = document.getElementById('giLeaveBtn');
    if (giLeaveBtn) giLeaveBtn.addEventListener('click', leaveGroup);

    const amSearch = document.getElementById('amSearch');
    if (amSearch) amSearch.addEventListener('input', (e) => renderAddMembersList(e.target.value.trim()));

    const amConfirmBtn = document.getElementById('amConfirmBtn');
    if (amConfirmBtn) amConfirmBtn.addEventListener('click', confirmAddMembers);

    // ----- Réagir depuis le menu contextuel (souris) -----
    const ctxReact = document.getElementById('ctxReact');
    if (ctxReact) {
        ctxReact.addEventListener('click', (e) => {
            if (!ctxMsgId) return;
            const picker = document.getElementById('reactionPicker');
            const row = document.querySelector(`.msg-row[data-msg-id="${ctxMsgId}"]`);
            const rect = row ? row.getBoundingClientRect() : { left: e.clientX, top: e.clientY };
            picker.dataset.msgId = ctxMsgId;
            picker.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
            picker.style.top = `${Math.max(60, rect.top - 56)}px`;
            picker.style.display = 'flex';
            setTimeout(() => {
                document.addEventListener('click', function hide() {
                    picker.style.display = 'none';
                    document.removeEventListener('click', hide);
                }, { once: true });
            }, 10);
        });
    }

    // ----- Appels audio / vidéo -----
    const callAudioBtn = document.getElementById('callAudioBtn');
    if (callAudioBtn) callAudioBtn.addEventListener('click', () => startCall('audio'));

    const callVideoBtn = document.getElementById('callVideoBtn');
    if (callVideoBtn) callVideoBtn.addEventListener('click', () => startCall('video'));

    // ----- Vote aux sondages (délégation sur la zone des messages) -----
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.addEventListener('click', (e) => {
            const opt = e.target.closest('.poll-option.votable');
            if (!opt) return;
            const container = opt.closest('.poll-container');
            if (!container) return;
            votePoll(container.dataset.msgId, opt.dataset.opt);
        });
    }

    // Marquer "lu" au retour sur l'onglet (et pas quand il est en arrière-plan)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') markAsRead();
    });

    // Émojis
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            const picker = document.getElementById('emojiPicker');
            if (!picker) return;
            picker.innerHTML = EMOJI_LIST.map(e => `<span>${e}</span>`).join('');
            picker.style.display = 'flex';
            picker.querySelectorAll('span').forEach(el => el.addEventListener('click', () => {
                document.getElementById('msgInput').value += el.textContent;
                picker.style.display = 'none';
                autoResizeInput();
            }));
        });
    }

    // Réactions rapides
    document.querySelectorAll('#reactionPicker span').forEach(el => {
        el.addEventListener('click', () => {
            const msgId = document.getElementById('reactionPicker')?.dataset.msgId;
            if (msgId) {
                toggleReaction(msgId, el.dataset.emoji);
                const reactionPicker = document.getElementById('reactionPicker');
                if (reactionPicker) reactionPicker.style.display = 'none';
            }
        });
    });

    // Sondage
    const optCreatePoll = document.getElementById('optCreatePoll');
    if (optCreatePoll) {
        optCreatePoll.addEventListener('click', () => {
            const question = prompt('Question du sondage :');
            if (!question) return;
            const options = prompt('Options (séparées par des virgules) :', 'Oui,Non,Peut-être');
            if (options) {
                createPoll(question, options.split(',').map(s => s.trim()));
            }
        });
    }

    // Message programmé
    const optScheduleMsg = document.getElementById('optScheduleMsg');
    if (optScheduleMsg) {
        optScheduleMsg.addEventListener('click', () => {
            const content = document.getElementById('msgInput').value.trim();
            if (!content) { toast('Écrivez un message d\'abord', 'warning'); return; }
            const dateStr = prompt('Date et heure d\'envoi (AAAA-MM-JJ HH:MM) :');
            if (dateStr) {
                scheduleMessage(content, dateStr);
            }
        });
    }

    // Message éphémère
    const optEphemeral = document.getElementById('optEphemeral');
    if (optEphemeral) {
        optEphemeral.addEventListener('click', () => {
            const content = document.getElementById('msgInput').value.trim();
            if (!content) { toast('Écrivez un message d\'abord', 'warning'); return; }
            const ttl = prompt('Durée de vie en secondes :', '60');
            if (ttl) {
                sendEphemeralMessage(content, parseInt(ttl));
            }
        });
    }

    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));

    // ============================================================
    //  VAGUE 2 — chaque bloc est isolé : si l'un échoue, les autres
    //  et le chargement de la page continuent de fonctionner.
    // ============================================================
    const wire = (label, fn) => {
        try { fn(); }
        catch (err) { console.warn(`[HubISoccer] Bloc « ${label} » non initialisé :`, err); }
    };

    // ----- Appels audio / vidéo -----
    wire('appels', () => {
        subscribeCalls();
        document.getElementById('callAcceptBtn')?.addEventListener('click', acceptCall);
        document.getElementById('callRejectBtn')?.addEventListener('click', rejectCall);
        document.getElementById('callHangupBtn')?.addEventListener('click', hangUpCall);
        document.getElementById('callMicBtn')?.addEventListener('click', toggleCallMic);
        document.getElementById('callCamBtn')?.addEventListener('click', toggleCallCam);
        document.getElementById('callFlipBtn')?.addEventListener('click', flipCallCamera);
        window.addEventListener('beforeunload', () => { if (callState !== 'idle') closeCallUI(); });
    });

    // ----- Arrière-plans & réglages d'affichage -----
    wire('arrière-plans', () => {
        loadChatPrefs();
        document.getElementById('optBackground')?.addEventListener('click', openBackgroundModal);
        document.getElementById('bgUploadBtn')?.addEventListener('click', () => document.getElementById('bgFileInput')?.click());
        document.getElementById('bgFileInput')?.addEventListener('change', (e) => uploadCustomBackground(e.target.files[0]));
    });

    // ----- Sélection multiple de messages -----
    wire('sélection multiple', () => {
        document.getElementById('msgSelCancelBtn')?.addEventListener('click', exitMsgSelection);
        document.getElementById('msgSelCopyBtn')?.addEventListener('click', copySelectedMessages);
        document.getElementById('msgSelForwardBtn')?.addEventListener('click', forwardSelectedMessages);
        document.getElementById('msgSelDeleteBtn')?.addEventListener('click', deleteSelectedMessages);
        document.getElementById('ctxSelect')?.addEventListener('click', () => {
            if (ctxMsgId) enterMsgSelection(ctxMsgId);
        });
    });

    // ----- Mentions @ en groupe -----
    wire('mentions', () => {
        const input = document.getElementById('msgInput');
        if (!input) return;
        input.addEventListener('input', handleMentionInput);
        input.addEventListener('blur', () => setTimeout(hideMentionBox, 200));
        input.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMentionBox(); });
    });

    // ----- Qui a lu ? -----
    wire('accusés de lecture', () => {
        document.getElementById('ctxReadInfo')?.addEventListener('click', () => {
            if (ctxMsgId) showReadReceipts(ctxMsgId);
        });
    });

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========
// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========