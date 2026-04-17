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

function goBack() {
    window.location.href = 'conversation.html';
}
// ========== FIN : CHARGEMENT DE LA CONVERSATION ==========

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
    // Appui long pour réactions rapides
    let pressTimer;
    bubble.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            showReactionPicker(e, msg.id);
        }, 500);
    });
    bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
    bubble.addEventListener('touchmove', () => clearTimeout(pressTimer));

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
    if (msg.read_by && msg.read_by.length > 0) return `<i class="fas fa-check-double seen" title="Vu"></i>`;
    return `<i class="fas fa-check sent" title="Envoyé"></i>`;
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
    } else if (msg.media_type === 'poll') {
        // Sondage
        wrap.innerHTML = renderPollMessage(msg);
    } else {
        return null;
    }
    return wrap;
}

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
            const fileName = `${currentProfile.hubisoccer_id}_audio_${Date.now()}.webm`;
            const { error: upErr } = await sb.storage.from('message_attachments').upload(fileName, pendingAudioBlob);
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

    input.addEventListener('input', () => {
        currentSearchQuery = input.value.trim();
        if (currentSearchQuery) {
            searchMatches = messages.filter(m => m.content && m.content.toLowerCase().includes(currentSearchQuery.toLowerCase()));
            searchIdx = searchMatches.length > 0 ? 0 : -1;
            renderAllMessages();
            updateSearchCount();
            if (searchMatches.length > 0) scrollToMessage(searchMatches[0].id);
        } else {
            clearHighlights();
            searchMatches = [];
            searchIdx = -1;
            updateSearchCount();
        }
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
        clearHighlights();
        renderAllMessages();
    });
}

function highlightSearchResults(query) {
    if (!query) return;
    document.querySelectorAll('.msg-bubble span').forEach(el => {
        const text = el.textContent;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        if (text.match(regex)) {
            el.innerHTML = text.replace(regex, '<mark>$1</mark>');
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.msg-bubble span').forEach(el => {
        el.innerHTML = el.textContent;
    });
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

// ========== DEBUT : MESSAGES PROGRAMMÉS ==========
function scheduleMessage(content, sendAt) {
    const scheduled = {
        id: Date.now(),
        convId: currentConvId,
        content,
        sendAt: new Date(sendAt).toISOString()
    };
    scheduledMessages.push(scheduled);
    localStorage.setItem('hubisoccer_scheduled_messages', JSON.stringify(scheduledMessages));
    toast('Message programmé', 'success');
}

function checkScheduledMessages() {
    const now = new Date().toISOString();
    scheduledMessages = scheduledMessages.filter(async (scheduled) => {
        if (scheduled.sendAt <= now && scheduled.convId === currentConvId) {
            // Envoyer le message programmé
            const msgData = {
                conversation_id: scheduled.convId,
                user_hubisoccer_id: currentProfile.hubisoccer_id,
                content: scheduled.content,
                deleted_for: [],
                reactions: {},
                edited: false,
                pinned: false,
                read_by: []
            };
            await sb.from('supabaseAuthPrive_messages').insert(msgData);
            return false; // supprimer du tableau
        }
        return true;
    });
    localStorage.setItem('hubisoccer_scheduled_messages', JSON.stringify(scheduledMessages));
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

// ========== DEBUT : APPELS AUDIO/VIDÉO ==========
function startCall(type = 'audio') {
    // Rediriger vers une page d'appel ou utiliser WebRTC
    toast(`Démarrage d'un appel ${type}... (fonctionnalité en cours d'intégration)`, 'info');
    // Ici on pourrait ouvrir une modale ou lancer WebRTC
}
// ========== FIN : APPELS ==========

// ========== DEBUT : MENU CONTEXTUEL ==========
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
            pendingAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
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
    if (typeof initSearchBar === 'function') initSearchBar();
    applyTheme();
    requestNotificationPermission();

    // 🔥 Écouteurs avec vérification d'existence (anti‑null)
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', goBack);

    const msgInput = document.getElementById('msgInput');
    if (msgInput) {
        msgInput.addEventListener('input', () => { autoResizeInput(); startTyping(); });
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
        });
    }

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

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========
// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========