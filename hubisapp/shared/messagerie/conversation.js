// ============================================================
//  HUBISOCCER — CONVERSATION.JS (VERSION CORRIGÉE & COMPLÈTE)
//  Liste des conversations — Tous rôles
//  Dépendances internes : sb, currentUser, currentProfile
//  Utilitaires inclus (toast, modales, etc.)
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let conversations = [];
let onlineUsers = new Set();
let showArchives = false;
let activeFilter = 'all';
let searchQuery = '';
let convSubscription = null;
let presenceChannel = null;
let selectedGroupMembers = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : UTILITAIRES INTERNES (SI NON FOURNIS PAR ../community/) ==========
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i><span>${escapeHtml(message)}</span><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 30000); // 🔥 30 secondes
}

function setLoader(show, message = 'Chargement...') {
    const loader = document.getElementById('globalLoader');
    const text = document.getElementById('loaderText');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (text) text.textContent = message;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(fullName) {
    if (!fullName) return '?';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function timeSince(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} an${interval > 1 ? 's' : ''}`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} mois`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} j`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} h`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} min`;
    return `À l'instant`;
}

async function logout() {
    await sb.auth.signOut();
    window.location.href = '../index.html';
}
// ========== FIN : UTILITAIRES INTERNES ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;

        if (typeof currentProfile === 'undefined' || !currentProfile?.hubisoccer_id) {
            const { data: profiles } = await sb
                .from('supabaseAuthPrive_profiles')
                .select('*')
                .eq('email', auth.email)
                .single();
            if (profiles) {
                window.currentProfile = profiles;
                window.currentUser = auth;
            } else {
                toast('Profil introuvable', 'error');
                window.location.href = 'feed-setup.html';
                return false;
            }
        }

        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Erreur de profil. Veuillez vous reconnecter.', 'error');
            window.location.href = 'feed-setup.html';
            return false;
        }

        document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');

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

// ========== DEBUT : CHARGEMENT DES CONVERSATIONS ==========
async function loadConversations() {
    showSkeleton(true);
    try {
        const { data: participations, error: pErr } = await sb
            .from('supabaseAuthPrive_conversation_participants')
            .select('conversation_id, last_read_at')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        if (pErr) throw pErr;

        if (!participations || participations.length === 0) {
            conversations = [];
            renderConversations();
            return;
        }

        const allConvIds = participations.map(p => p.conversation_id);
        const readMap = Object.fromEntries(participations.map(p => [p.conversation_id, p.last_read_at]));

        let convIds = allConvIds;
        const { data: archived } = await sb
            .from('supabaseAuthPrive_archived_conversations')
            .select('conversation_id')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        const archivedIds = new Set((archived || []).map(a => a.conversation_id));

        if (showArchives) {
            convIds = allConvIds.filter(id => archivedIds.has(id));
        } else {
            convIds = allConvIds.filter(id => !archivedIds.has(id));
        }

        if (convIds.length === 0) {
            conversations = [];
            renderConversations();
            return;
        }

        const { data: convData, error: cErr } = await sb
            .from('supabaseAuthPrive_conversations')
            .select(`
                id, is_group, group_name, group_avatar, created_at, updated_at,
                participants:supabaseAuthPrive_conversation_participants (
                    user_hubisoccer_id,
                    profile:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )
                )
            `)
            .in('id', convIds)
            .order('updated_at', { ascending: false });
        if (cErr) throw cErr;

        const { data: lastMsgs } = await sb
            .from('supabaseAuthPrive_messages')
            .select('id, conversation_id, content, media_type, created_at, user_hubisoccer_id')
            .in('conversation_id', convIds)
            .not('deleted_for', 'cs', `{${currentProfile.hubisoccer_id}}`)
            .order('created_at', { ascending: false });

        const lastMsgMap = {};
        if (lastMsgs) {
            for (const msg of lastMsgs) {
                if (!lastMsgMap[msg.conversation_id]) {
                    lastMsgMap[msg.conversation_id] = msg;
                }
            }
        }

        const unreadCounts = {};
        for (const cid of convIds) {
            const lastRead = readMap[cid];
            let query = sb
                .from('supabaseAuthPrive_messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', cid)
                .neq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                .not('deleted_for', 'cs', `{${currentProfile.hubisoccer_id}}`);
            if (lastRead) {
                query = query.gt('created_at', lastRead);
            }
            const { count } = await query;
            unreadCounts[cid] = count || 0;
        }

        conversations = (convData || []).map(conv => {
            const participants = conv.participants || [];
            let name, avatarUrl, otherUserId = null;

            if (conv.is_group) {
                name = conv.group_name || 'Groupe';
                avatarUrl = conv.group_avatar || null;
            } else {
                const other = participants.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
                const prof = other?.profile || {};
                name = prof.full_name || prof.display_name || 'Utilisateur';
                avatarUrl = prof.avatar_url || null;
                otherUserId = other?.user_hubisoccer_id || null;
            }

            const lastMsg = lastMsgMap[conv.id];
            return {
                id: conv.id,
                is_group: conv.is_group,
                group_name: conv.group_name,
                name,
                avatarUrl,
                otherUserId,
                participants,
                lastMsg,
                lastMsgTime: lastMsg?.created_at || conv.updated_at,
                unreadCount: unreadCounts[conv.id] || 0,
                archived: archivedIds.has(conv.id)
            };
        });

        renderConversations();
    } catch (err) {
        console.error('Erreur chargement conversations:', err);
        toast('Erreur lors du chargement des conversations', 'error');
    } finally {
        showSkeleton(false);
    }
}

function renderConversations() {
    const list = document.getElementById('conversationsList');
    const skeleton = document.getElementById('skeletonList');
    const emptyEl = document.getElementById('emptyState');
    const totalBadge = document.getElementById('totalConvBadge');

    skeleton.style.display = 'none';
    list.style.display = 'flex';

    let filtered = conversations.filter(conv => {
        if (searchQuery && !conv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeFilter === 'unread' && conv.unreadCount === 0) return false;
        if (activeFilter === 'groups' && !conv.is_group) return false;
        if (activeFilter === 'direct' && conv.is_group) return false;
        return true;
    });

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    totalBadge.textContent = `${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}`;

    const notifBadge = document.getElementById('notifBadge');
    if (totalUnread > 0) {
        notifBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        notifBadge.style.display = 'block';
        document.title = `(${totalUnread}) Messages | HubISoccer`;
    } else {
        notifBadge.style.display = 'none';
        document.title = 'Messages | HubISoccer';
    }

    if (filtered.length === 0) {
        list.style.display = 'none';
        emptyEl.style.display = 'block';
        document.getElementById('emptyTitle').textContent = showArchives ? 'Aucune conversation archivée' : 'Aucune conversation';
        document.getElementById('emptyDesc').textContent = showArchives ? 'Vous n\'avez pas encore archivé de conversations.' : 'Allez sur la communauté et envoyez un message à quelqu\'un !';
        return;
    }

    emptyEl.style.display = 'none';
    list.style.display = 'flex';

    list.innerHTML = filtered.map(conv => {
        const isOnline = conv.otherUserId && onlineUsers.has(conv.otherUserId);
        const lastMsgText = getLastMsgPreview(conv.lastMsg);
        const timeText = conv.lastMsgTime ? timeSince(conv.lastMsgTime) : '';
        const hasUnread = conv.unreadCount > 0;
        const initials = getInitials(conv.name);
        const avatarUrl = conv.avatarUrl;

        return `
        <div class="conv-item ${hasUnread ? 'unread' : ''}" data-conv-id="${conv.id}">
            <div class="conv-avatar-wrap">
                ${avatarUrl ? `<img class="conv-avatar" src="${avatarUrl}" alt="${conv.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="conv-avatar-initials" style="display:${avatarUrl ? 'none' : 'flex'};">${initials}</div>
                ${conv.is_group
                    ? `<div class="group-icon"><i class="fas fa-users"></i></div>`
                    : `<div class="online-dot ${isOnline ? 'visible' : ''}"></div>`
                }
            </div>
            <div class="conv-info">
                <div class="conv-name-row">
                    <span class="conv-name">${escapeHtml(conv.name)}</span>
                    <span class="conv-time">${timeText}</span>
                </div>
                <div class="conv-last-row">
                    <span class="conv-last">${lastMsgText}</span>
                    ${hasUnread ? `<span class="unread-count">${conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>` : ''}
                </div>
            </div>
            <div class="conv-actions">
                <button class="conv-action-btn archive-btn" data-conv-id="${conv.id}" title="${showArchives ? 'Désarchiver' : 'Archiver'}">
                    <i class="fas ${showArchives ? 'fa-undo' : 'fa-archive'}"></i>
                </button>
                <button class="conv-action-btn danger delete-btn" data-conv-id="${conv.id}" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function getLastMsgPreview(msg) {
    if (!msg) return '<em>Aucun message</em>';
    if (msg.media_type === 'image') return '<i class="fas fa-image"></i> Photo';
    if (msg.media_type === 'video') return '<i class="fas fa-video"></i> Vidéo';
    if (msg.media_type === 'audio') return '<i class="fas fa-microphone"></i> Message vocal';
    if (msg.media_type === 'file') return '<i class="fas fa-file"></i> Fichier';
    return escapeHtml(msg.content?.substring(0, 60) || '');
}

function showSkeleton(show) {
    document.getElementById('skeletonList').style.display = show ? 'flex' : 'none';
    document.getElementById('conversationsList').style.display = show ? 'none' : 'flex';
    document.getElementById('emptyState').style.display = 'none';
}
// ========== FIN : CHARGEMENT DES CONVERSATIONS ==========

// ========== DEBUT : ACTIONS SUR CONVERSATIONS ==========
async function toggleArchive(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    if (conv.archived) {
        await sb.from('supabaseAuthPrive_archived_conversations')
            .delete()
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('conversation_id', convId);
        toast('Conversation désarchivée', 'success');
    } else {
        await sb.from('supabaseAuthPrive_archived_conversations')
            .insert({ user_hubisoccer_id: currentProfile.hubisoccer_id, conversation_id: convId });
        toast('Conversation archivée', 'success');
    }
    await loadConversations();
}

function promptDeleteConv(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    if (!confirm(`Supprimer la conversation avec ${conv.name} ?`)) return;

    deleteConversation(convId);
}

async function deleteConversation(convId) {
    await sb.from('supabaseAuthPrive_conversation_participants')
        .delete()
        .eq('conversation_id', convId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    const { count } = await sb.from('supabaseAuthPrive_conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId);
    if ((count || 0) === 0) {
        await sb.from('supabaseAuthPrive_messages').delete().eq('conversation_id', convId);
        await sb.from('supabaseAuthPrive_conversations').delete().eq('id', convId);
    }
    toast('Conversation supprimée', 'success');
    await loadConversations();
}

function openConversation(convId) {
    window.location.href = `discuss.html?conv=${convId}`;
}
// ========== FIN : ACTIONS SUR CONVERSATIONS ==========

// ========== DEBUT : PRÉSENCE ==========
function initPresence() {
    presenceChannel = sb.channel('hubisoccer_presence');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            onlineUsers = new Set(Object.values(state).flat().map(p => p.user_id));
            renderConversations();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: currentProfile.hubisoccer_id, online_at: new Date().toISOString() });
            }
        });
}
// ========== FIN : PRÉSENCE ==========

// ========== DEBUT : GESTION DES GROUPES ==========
async function loadFollowersForGroup() {
    const { data: follows } = await sb
        .from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id, profile:supabaseAuthPrive_profiles!following_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);

    const listEl = document.getElementById('membersList');
    if (!follows || follows.length === 0) {
        listEl.innerHTML = `<div class="members-loading">Aucun abonné trouvé</div>`;
        return;
    }

    const followers = follows.map(f => ({
        id: f.following_hubisoccer_id,
        name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
        avatar: f.profile?.avatar_url || null
    }));

    renderMembersList(followers, '');
    document.getElementById('memberSearch').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderMembersList(followers, q);
    });
}

function renderMembersList(followers, query) {
    const filtered = query
        ? followers.filter(f => f.name.toLowerCase().includes(query))
        : followers;

    const listEl = document.getElementById('membersList');
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="members-loading">Aucun résultat</div>`;
        return;
    }
    listEl.innerHTML = filtered.map(f => {
        const initials = getInitials(f.name);
        const isSelected = selectedGroupMembers.some(m => m.id === f.id);
        return `
        <div class="member-item ${isSelected ? 'selected' : ''}" data-uid="${f.id}">
            ${f.avatar ? `<img src="${f.avatar}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
            <div class="member-avatar-initials" style="display:${f.avatar ? 'none' : 'flex'};">${initials}</div>
            <span class="member-name">${escapeHtml(f.name)}</span>
            <i class="fas fa-check member-check"></i>
        </div>
    `}).join('');

    listEl.querySelectorAll('.member-item').forEach(el => {
        el.addEventListener('click', () => {
            const uid = el.dataset.uid;
            const member = filtered.find(f => f.id === uid);
            if (member) toggleMemberSelection(el, member);
        });
    });
}

function toggleMemberSelection(el, member) {
    const idx = selectedGroupMembers.findIndex(m => m.id === member.id);
    if (idx >= 0) {
        selectedGroupMembers.splice(idx, 1);
        el.classList.remove('selected');
    } else {
        selectedGroupMembers.push(member);
        el.classList.add('selected');
    }
    renderSelectedChips();
}

function renderSelectedChips() {
    const container = document.getElementById('selectedMembers');
    container.innerHTML = selectedGroupMembers.map(m => {
        const initials = getInitials(m.name);
        return `
        <div class="selected-chip" data-uid="${m.id}">
            ${m.avatar ? `<img src="${m.avatar}" alt="">` : `<div class="chip-initials">${initials}</div>`}
            <span>${escapeHtml(m.name)}</span>
            <i class="fas fa-times chip-remove"></i>
        </div>
    `}).join('');
    container.querySelectorAll('.chip-remove').forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const uid = btn.parentElement.dataset.uid;
            selectedGroupMembers = selectedGroupMembers.filter(m => m.id !== uid);
            renderSelectedChips();
            document.querySelector(`.member-item[data-uid="${uid}"]`)?.classList.remove('selected');
        });
    });
}

async function createGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    if (!groupName) { toast('Donnez un nom au groupe', 'warning'); return; }
    if (selectedGroupMembers.length < 2) { toast('Sélectionnez au moins 2 participants', 'warning'); return; }

    const btn = document.getElementById('createGroupBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

    try {
        const { data: conv, error: convErr } = await sb
            .from('supabaseAuthPrive_conversations')
            .insert({ is_group: true, group_name: groupName })
            .select().single();
        if (convErr) throw convErr;

        const participants = [...selectedGroupMembers.map(m => m.id), currentProfile.hubisoccer_id];
        await sb.from('supabaseAuthPrive_conversation_participants')
            .insert(participants.map(uid => ({ conversation_id: conv.id, user_hubisoccer_id: uid })));

        await sb.from('supabaseAuthPrive_messages').insert({
            conversation_id: conv.id,
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            content: `👋 Groupe "${groupName}" créé ! Bienvenue à tous.`,
            deleted_for: []
        });

        toast(`Groupe "${groupName}" créé`, 'success');
        closeModal('modalGroup');
        await loadConversations();
    } catch (err) {
        toast('Erreur création groupe', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Créer le groupe';
    }
}
// ========== FIN : GESTION DES GROUPES ==========

// ========== DEBUT : BLOCAGE ==========
async function loadBlockedUsers() {
    const { data } = await sb
        .from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id, profile:supabaseAuthPrive_profiles!blocked_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    const listEl = document.getElementById('blockedList');
    if (!data || data.length === 0) {
        listEl.innerHTML = `<div class="blocked-empty">Aucun utilisateur bloqué</div>`;
        return;
    }
    listEl.innerHTML = data.map(b => {
        const p = b.profile || {};
        const name = p.full_name || p.display_name || 'Utilisateur';
        const initials = getInitials(name);
        const avatar = p.avatar_url;
        return `
        <div class="blocked-item">
            ${avatar ? `<img src="${avatar}" alt="">` : `<div class="blocked-avatar-initials">${initials}</div>`}
            <span class="blocked-name">${escapeHtml(name)}</span>
            <button class="btn-unblock" data-uid="${b.blocked_hubisoccer_id}">Débloquer</button>
        </div>
    `}).join('');

    listEl.querySelectorAll('.btn-unblock').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sb.from('supabaseAuthPrive_blocked_users')
                .delete()
                .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('blocked_hubisoccer_id', btn.dataset.uid);
            toast('Utilisateur débloqué', 'success');
            loadBlockedUsers();
        });
    });
}
// ========== FIN : BLOCAGE ==========

// ========== DEBUT : OUVERTURE / CRÉATION CONVERSATION DIRECTE ==========
async function openOrCreateDirectConversation(targetMsgId) {
    const { data: community } = await sb
        .from('supabaseAuthPrive_communities')
        .select('hubisoccer_id')
        .or(`msg_id.eq.${targetMsgId},feed_id.eq.${targetMsgId}`)
        .maybeSingle();

    if (!community) {
        toast('Utilisateur introuvable', 'error');
        return;
    }

    const targetHubisoccerId = community.hubisoccer_id;

    const { data: myParts } = await sb.from('supabaseAuthPrive_conversation_participants')
        .select('conversation_id').eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const myIds = (myParts || []).map(p => p.conversation_id);

    for (const cid of myIds) {
        const { data: parts } = await sb.from('supabaseAuthPrive_conversation_participants')
            .select('user_hubisoccer_id').eq('conversation_id', cid);
        if (parts?.length === 2 && parts.some(p => p.user_hubisoccer_id === targetHubisoccerId)) {
            window.location.href = `discuss.html?conv=${cid}`;
            return;
        }
    }

    const { data: newConv } = await sb.from('supabaseAuthPrive_conversations')
        .insert({ is_group: false }).select().single();
    if (!newConv) return;

    await sb.from('supabaseAuthPrive_conversation_participants').insert([
        { conversation_id: newConv.id, user_hubisoccer_id: currentProfile.hubisoccer_id },
        { conversation_id: newConv.id, user_hubisoccer_id: targetHubisoccerId }
    ]);

    window.location.href = `discuss.html?conv=${newConv.id}`;
}
// ========== FIN : OUVERTURE / CRÉATION CONVERSATION DIRECTE ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement des conversations...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    await loadConversations();
    initPresence();
    setLoader(false);

    // Écouteurs d'événements
    document.getElementById('conversationsList').addEventListener('click', (e) => {
        const archiveBtn = e.target.closest('.archive-btn');
        if (archiveBtn) {
            e.stopPropagation();
            toggleArchive(archiveBtn.dataset.convId);
            return;
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            promptDeleteConv(deleteBtn.dataset.convId);
            return;
        }
        const item = e.target.closest('.conv-item');
        if (item) {
            openConversation(item.dataset.convId);
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        document.getElementById('clearSearch').style.display = searchQuery ? 'block' : 'none';
        renderConversations();
    });
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        document.getElementById('clearSearch').style.display = 'none';
        renderConversations();
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.dataset.filter;
            renderConversations();
        });
    });

    document.getElementById('archiveToggleBtn').addEventListener('click', async () => {
        showArchives = !showArchives;
        document.getElementById('archiveToggleText').textContent = showArchives ? 'Conversations' : 'Archives';
        document.getElementById('archiveToggleBtn').classList.toggle('active-archive', showArchives);
        await loadConversations();
    });

    document.getElementById('newGroupBtn').addEventListener('click', () => {
        selectedGroupMembers = [];
        document.getElementById('groupName').value = '';
        document.getElementById('selectedMembers').innerHTML = '';
        openModal('modalGroup');
        loadFollowersForGroup();
    });

    document.getElementById('createGroupBtn').addEventListener('click', createGroup);

    document.getElementById('blockedBtn').addEventListener('click', () => {
        loadBlockedUsers();
        openModal('modalBlocked');
    });

    // Dropdown utilisateur
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));

    // Liens dropdown
    document.getElementById('dropProfile').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `profil-feed.html?id=${currentProfile.hubisoccer_id}`;
    });
    document.getElementById('dropDashboard').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
    document.getElementById('dropSettings').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'settings-feed.html';
    });
    document.getElementById('dropLogout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Lien communauté vide
    document.getElementById('emptyCommunityLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'feed.html';
    });

    // Sidebar dynamique simple (selon rôle)
    buildSidebar();

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });

    // Paramètre ?to=msgId
    const params = new URLSearchParams(window.location.search);
    const toMsgId = params.get('to');
    if (toMsgId) {
        openOrCreateDirectConversation(toMsgId);
    }
}

function buildSidebar() {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;
    const role = currentProfile?.role_code || 'member';
    let links = [
        { href: 'feed.html', icon: 'fa-newspaper', text: 'Fil d\'actualité' },
        { href: 'conversation.html', icon: 'fa-comments', text: 'Messages' },
        { href: 'stories.html', icon: 'fa-clock', text: 'Stories' },
        { href: `profil-feed.html?id=${currentProfile?.hubisoccer_id}`, icon: 'fa-user', text: 'Mon Profil' },
    ];
    if (role === 'admin' || role === 'staff') {
        links.push({ href: 'admin.html', icon: 'fa-cog', text: 'Administration' });
    }
    sidebarNav.innerHTML = links.map(link => `
        <a href="${link.href}">
            <i class="fas ${link.icon}"></i>
            <span>${link.text}</span>
        </a>
    `).join('');
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========