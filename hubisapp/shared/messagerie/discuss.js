// ============================================================
//  HUBISOCCER — DISCUSS.JS (VERSION CORRIGÉE & COMPLÈTE)
//  Chat intérieur — Tous rôles
//  Autonome : dépend de session.js et utils.js locaux
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
let pendingAudio = null;

// Contexte menu
let ctxMsgId = null;

// Frappe
let typingTimeout = null;
let isTyping = false;

// Recherche dans messages
let searchMatches = [];
let searchIdx = 0;

// Audio recorder
let mediaRecorder = null;
let audioChunks = [];
let recInterval = null;
let recSeconds = 0;

// Émojis (liste simplifiée)
const EMOJI_LIST = ['😊','😂','❤️','👍','😢','😮','🔥','⚽','👏','🎉','🙏','😡'];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await window.requireAuth();
        if (!auth) return false;

        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Erreur de profil. Veuillez vous reconnecter.', 'error');
            window.location.href = 'feed-setup.html';
            return false;
        }
        return true;
    } catch (err) {
        toast('Erreur de session : ' + err.message, 'error');
        return false;
    }
}
// ========== FIN : INITIALISATION SESSION & PROFIL ==========

// ========== DEBUT : INITIALISATION DE LA CONVERSATION ==========
async function loadConversation(convId) {
    const { data, error } = await sb
        .from('supabaseAuthPrive_conversations')
        .select(`
            id, is_group, group_name, group_avatar, updated_at,
            participants:supabaseAuthPrive_conversation_participants (
                user_hubisoccer_id,
                profile:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )
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
        document.getElementById('contactStatus').textContent = `${count} participant${count > 1 ? 's' : ''}`;
        document.title = `${data.group_name} | HubISoccer`;
        document.getElementById('optViewProfile').style.display = 'none';
        document.getElementById('optBlockUser').style.display = 'none';
    } else {
        const other = data.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
        const prof = other?.profile || {};
        const name = prof.full_name || prof.display_name || 'Utilisateur';
        document.getElementById('contactName').textContent = name;
        updateAvatarDisplay(prof.avatar_url, name, 'contactAvatar', 'contactAvatarInitials');
        document.getElementById('contactStatus').textContent = 'Hors ligne';
        document.title = `${name} | HubISoccer`;
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
// ========== FIN : INITIALISATION DE LA CONVERSATION ==========

// ========== DEBUT : CHARGEMENT DES MESSAGES ==========
async function loadMessages(before = null) {
    let query = sb
        .from('supabaseAuthPrive_messages')
        .select(`
            id, conversation_id, user_hubisoccer_id, content, media_url, media_type,
            reply_to_id, deleted_for, reactions, edited, pinned, read_by, created_at,
            author:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )
        `)
        .eq('conversation_id', currentConvId)
        .not('deleted_for', 'cs', `{${currentProfile.hubisoccer_id}}`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) {
        toast('Erreur chargement messages', 'error');
        return [];
    }

    hasMoreMsgs = data.length > PAGE_SIZE;
    const msgs = hasMoreMsgs ? data.slice(1) : data;
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
}

function makeDateSeparator(label) {
    const el = document.createElement('div');
    el.className = 'date-separator';
    el.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    return el;
}

function makeMessageRow(msg, hideAvatar = false) {
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

    if (msg.reply_to_id) {
        const replyEl = makeReplyQuote(msg.reply_to_id, isOwn);
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
    }

    if (msg.media_url) {
        const mediaEl = makeMediaElement(msg);
        if (mediaEl) bubble.appendChild(mediaEl);
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
    if (msg.read_by && msg.read_by.length > 0) return `<i class="fas fa-check-double seen" title="Vu"></i>`;
    return `<i class="fas fa-check sent" title="Envoyé"></i>`;
}

function makeReplyQuote(replyToId, isOwn) {
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
        wrap.innerHTML = `<video src="${msg.media_url}" controls preload="metadata"></video>`;
    } else if (msg.media_type === 'audio') {
        wrap.innerHTML = `<audio controls src="${msg.media_url}"></audio>`;
    } else if (msg.media_type === 'file') {
        wrap.innerHTML = `
            <a class="msg-file-link" href="${msg.media_url}" target="_blank" download>
                <i class="fas fa-file-alt"></i>
                <span>${escapeHtml(msg.content || 'Fichier')}</span>
                <i class="fas fa-download"></i>
            </a>`;
    } else {
        return null;
    }
    return wrap;
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
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="text-decoration:underline;opacity:0.85">$1</a>')
        .replace(/\n/g, '<br>');
}
// ========== FIN : RENDU DES MESSAGES ==========

// ========== DEBUT : ENVOI DE MESSAGE ==========
async function sendMessage() {
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    const btn = document.getElementById('sendBtn');

    if (!content && !pendingFile && !pendingAudio) return;

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

        if (pendingAudio) {
            const fileName = `${currentProfile.hubisoccer_id}_audio_${Date.now()}.webm`;
            const { error: upErr } = await sb.storage.from('message_attachments').upload(fileName, pendingAudio);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('message_attachments').getPublicUrl(fileName);
            mediaUrl = urlData.publicUrl;
            mediaType = 'audio';
            pendingAudio = null;
            stopAudioRecorder();
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
                read_by: []
            };
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
    } catch (err) {
        toast('Erreur envoi : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}
// ========== FIN : ENVOI DE MESSAGE ==========

// ========== DEBUT : ACTIONS SUR MESSAGES ==========
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

// ========== FIN : ACTIONS SUR MESSAGES ==========

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
// ========== FIN : RÉACTIONS ==========

// ========== DEBUT : CONTEXT MENU ==========
function showContextMenu(e, msg) {
    e.preventDefault();
    const menu = document.getElementById('contextMenu');
    ctxMsgId = msg.id;
    const isOwn = msg.user_hubisoccer_id === currentProfile.hubisoccer_id;
    document.getElementById('ctxEdit').style.display = isOwn && msg.content ? 'flex' : 'none';
    document.getElementById('ctxDeleteAll').style.display = isOwn ? 'flex' : 'none';
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
// ========== FIN : CONTEXT MENU ==========

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
                const { data: author } = await sb.from('supabaseAuthPrive_profiles')
                    .select('hubisoccer_id, full_name, display_name, avatar_url')
                    .eq('hubisoccer_id', msg.user_hubisoccer_id)
                    .single();
                appendMessage({ ...msg, author });
                markAsRead();
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
async function startAudioRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        recSeconds = 0;
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            pendingAudio = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            document.getElementById('audioRecorderBar').style.display = 'none';
            sendMessage();
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
    pendingAudio = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.ondataavailable = null;
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
    }
    clearInterval(recInterval);
    document.getElementById('audioRecorderBar').style.display = 'none';
}
// ========== FIN : AUDIO RECORDER ==========

// ========== DEBUT : MODALES & NAVIGATION ==========
function openMediaZoom(url, type) {
    const modal = document.getElementById('modalMedia');
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'image' ? `<img src="${url}" alt="Image">` : `<video src="${url}" controls autoplay></video>`;
    openModal('modalMedia');
}
window.openMediaZoom = openMediaZoom;

function goBack() {
    window.location.href = 'conversation.html';
}

async function markAsRead() {
    await sb.from('supabaseAuthPrive_conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', currentConvId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
}
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

    // Écouteurs
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('msgInput').addEventListener('input', () => { autoResizeInput(); startTyping(); });
    document.getElementById('msgInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('attachBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('audioBtn').addEventListener('click', startAudioRecorder);
    document.getElementById('recStopBtn').addEventListener('click', stopAudioRecorder);
    document.getElementById('recCancelBtn').addEventListener('click', cancelAudioRecorder);
    document.getElementById('replyBarClose').addEventListener('click', cancelReply);
    document.getElementById('editBarClose').addEventListener('click', cancelEdit);

    // Menu contextuel
    document.getElementById('ctxReply').addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg) startReply(msg); });
    document.getElementById('ctxCopy').addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg?.content) { navigator.clipboard.writeText(msg.content); toast('Copié !', 'success'); } });
    document.getElementById('ctxEdit').addEventListener('click', () => { const msg = messages.find(m => m.id === ctxMsgId); if (msg) startEdit(msg); });
    document.getElementById('ctxPin').addEventListener('click', () => { if (ctxMsgId) togglePin(ctxMsgId); });
    document.getElementById('ctxDeleteMe').addEventListener('click', () => { if (ctxMsgId) deleteMessage(ctxMsgId, false); });
    document.getElementById('ctxDeleteAll').addEventListener('click', () => { if (ctxMsgId) deleteMessage(ctxMsgId, true); });

    document.getElementById('scrollBottomBtn').addEventListener('click', () => scrollToBottom(true));
    document.getElementById('loadMoreMsgs').addEventListener('click', async () => {
        if (!hasMoreMsgs) return;
        const older = await loadMessages(oldestMsgDate);
        if (older.length > 0) {
            oldestMsgDate = older[0].created_at;
            messages = [...older, ...messages];
            renderAllMessages();
        }
        document.getElementById('loadMoreBtn').style.display = hasMoreMsgs ? 'block' : 'none';
    });

    // Options du header
    document.getElementById('moreOptionsBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('optionsMenu').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('optionsMenu')?.classList.remove('show'));
    document.getElementById('optViewProfile').addEventListener('click', () => {
        if (!currentConv || currentConv.is_group) return;
        const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
        if (other) window.location.href = `profil-feed.html?id=${other.user_hubisoccer_id}`;
    });
    document.getElementById('optBlockUser').addEventListener('click', async () => {
        if (!currentConv || currentConv.is_group) return;
        const other = currentConv.participants?.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
        if (!other) return;
        await sb.from('supabaseAuthPrive_blocked_users').upsert({ user_hubisoccer_id: currentProfile.hubisoccer_id, blocked_hubisoccer_id: other.user_hubisoccer_id });
        toast('Utilisateur bloqué', 'success');
    });

    // Émojis
    document.getElementById('emojiBtn').addEventListener('click', () => {
        const picker = document.getElementById('emojiPicker');
        picker.innerHTML = EMOJI_LIST.map(e => `<span>${e}</span>`).join('');
        picker.style.display = 'flex';
        picker.querySelectorAll('span').forEach(el => el.addEventListener('click', () => {
            document.getElementById('msgInput').value += el.textContent;
            picker.style.display = 'none';
            autoResizeInput();
        }));
    });

    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========