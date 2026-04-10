// ============================================================
//  HUBISOCCER — POST-VIEW.JS
//  Vue détaillée d'une publication
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
let currentPost       = null;
let isLiked           = false;
let isDisliked        = false;
let isSaved           = false;
let comments          = [];
let commentOffset     = 0;
const COMMENT_PAGE    = 15;
let hasMoreComments   = false;
let commentMediaFile  = null;
let commentSubscription = null;
// Fin état global

// Début mapping rôles
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};
// Fin mapping rôles

// Début session et profil
async function initSessionAndProfile() {
    const user = await checkSession();
    if (!user) return false;
    currentUser = user;

    const profile = await loadProfile(user.id);
    if (!profile) return false;
    currentProfile = profile;

    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Utilisateur';
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name, 'user');
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name, 'composer');

    const dash = ROLE_DASHBOARD_MAP[profile.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;
    document.getElementById('backBtn').addEventListener('click', () => window.history.back() || window.location.href = 'feed.html');

    return true;
}

function updateAvatarDisplay(avatarUrl, fullName, type) {
    const avatar = document.getElementById(type === 'user' ? 'userAvatar' : 'composerAvatar');
    const initials = document.getElementById(type === 'user' ? 'userAvatarInitials' : 'composerAvatarInitials');
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

// Début chargement post
async function loadPost(postId) {
    const { data, error } = await sb
        .from('supabaseAuthPrive_posts')
        .select(`
            *,
            author:author_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, role_code, feed_id, certified, bio),
            community:community_id(name, feed_id, avatar_url, followers_count, posts_count)
        `)
        .eq('id', postId)
        .single();

    if (error || !data) {
        document.getElementById('postFullCard').innerHTML = `<div class="c-empty"><h3>Publication introuvable</h3></div>`;
        return null;
    }
    currentPost = data;
    document.title = `${data.author?.full_name || 'Publication'} | HubISoccer`;

    const [likeRes, dislikeRes, saveRes] = await Promise.all([
        sb.from('supabaseAuthPrive_post_likes').select('id').eq('post_id', postId).eq('user_hubisoccer_id', currentProfile.hubisoccer_id).maybeSingle(),
        sb.from('supabaseAuthPrive_post_dislikes').select('id').eq('post_id', postId).eq('user_hubisoccer_id', currentProfile.hubisoccer_id).maybeSingle(),
        sb.from('supabaseAuthPrive_saved_posts').select('id').eq('post_id', postId).eq('user_hubisoccer_id', currentProfile.hubisoccer_id).maybeSingle()
    ]);
    isLiked = !!likeRes.data;
    isDisliked = !!dislikeRes.data;
    isSaved = !!saveRes.data;

    renderPost(data);
    loadAuthorCard(data.author, data.community);
    loadRelatedPosts(data.author_hubisoccer_id, postId);

    await sb.from('supabaseAuthPrive_post_views').upsert({
        post_id: postId,
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        viewed_at: new Date().toISOString()
    }, { onConflict: 'post_id, user_hubisoccer_id' });

    return data;
}

function renderPost(post) {
    const isOwn = post.author_hubisoccer_id === currentProfile.hubisoccer_id;
    const author = post.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorHandle = author.feed_id ? '@' + author.feed_id : '';
    const authorRole = author.role_code || '';
    const certified = author.certified ? '<i class="fas fa-check-circle" style="color:var(--primary);margin-left:4px;"></i>' : '';

    let mediaHtml = '';
    if (post.media_url) {
        if (post.media_type === 'video') {
            mediaHtml = `<div class="pv-media"><video src="${post.media_url}" controls preload="metadata"></video></div>`;
        } else {
            mediaHtml = `<div class="pv-media"><img src="${post.media_url}" alt="Media" loading="lazy" onclick="openMediaZoom('${post.media_url}','image')"></div>`;
        }
    }

    let pollHtml = '';
    if (post.poll_data) {
        const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
        const total = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
        const voted = poll.voted_by?.includes(currentProfile.hubisoccer_id);
        const expired = poll.ends_at && new Date(poll.ends_at) < new Date();
        pollHtml = `
            <div class="pv-poll">
                <div class="pv-poll-q"><i class="fas fa-chart-pie" style="color:var(--primary);margin-right:8px"></i>${escapeHtml(poll.question)}</div>
                ${poll.options.map((opt, i) => {
                    const v = poll.votes?.[i] || 0;
                    const pct = total > 0 ? Math.round(v / total * 100) : 0;
                    const isMyVote = voted && poll.my_vote === i;
                    return `
                        <div class="pv-poll-opt ${voted || expired ? 'voted' : ''} ${isMyVote ? 'my-vote' : ''}" data-opt="${i}" onclick="${!voted && !expired ? `votePoll(${i})` : ''}">
                            <div class="pv-poll-bar" style="width:${voted || expired ? pct : 0}%"></div>
                            <span class="pv-poll-txt">${escapeHtml(opt)}</span>
                            ${voted || expired ? `<span class="pv-poll-pct">${pct}%</span>` : ''}
                            <i class="fas fa-check pv-poll-check"></i>
                        </div>
                    `;
                }).join('')}
                <div class="pv-poll-meta">
                    <span><i class="fas fa-users"></i> ${total} vote${total !== 1 ? 's' : ''}</span>
                    ${poll.ends_at ? `<span><i class="fas fa-clock"></i> ${expired ? 'Terminé' : new Date(poll.ends_at).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    }

    let eventHtml = '';
    if (post.event_data) {
        const evt = typeof post.event_data === 'string' ? JSON.parse(post.event_data) : post.event_data;
        const d = new Date(evt.date);
        eventHtml = `
            <div class="pv-event">
                <div class="pv-event-card">
                    <div class="pv-event-date">
                        <div class="pv-event-day">${d.getDate()}</div>
                        <div class="pv-event-month">${d.toLocaleString('fr-FR', { month: 'short' })}</div>
                    </div>
                    <div class="pv-event-info">
                        <h4>${escapeHtml(evt.title)}</h4>
                        <div class="pv-event-detail"><i class="fas fa-clock"></i>${d.toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                        ${evt.location ? `<div class="pv-event-detail"><i class="fas fa-map-marker-alt"></i>${escapeHtml(evt.location)}</div>` : ''}
                        ${evt.description ? `<div class="pv-event-desc">${escapeHtml(evt.description)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    const authorInitials = getInitials(authorName);
    const authorAvatarHtml = author.avatar_url
        ? `<img class="pv-avatar" src="${author.avatar_url}" alt="" onclick="openUserProfile('${post.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="pv-avatar-initials" onclick="openUserProfile('${post.author_hubisoccer_id}')">${authorInitials}</div>`;

    document.getElementById('postFullCard').innerHTML = `
        <div class="pv-post-header">
            ${authorAvatarHtml}
            <div class="pv-meta">
                <div class="pv-author" onclick="openUserProfile('${post.author_hubisoccer_id}')">
                    ${escapeHtml(authorName)}${certified}
                </div>
                <div class="pv-author-sub">
                    ${authorRole ? `<span class="pv-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    ${authorHandle ? `<span class="pv-handle">${authorHandle}</span>` : ''}
                    <span class="pv-time">${new Date(post.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    ${post.edited ? '<span class="pv-edited">(modifié)</span>' : ''}
                    ${post.pinned ? '<span class="pv-pinned-icon"><i class="fas fa-thumbtack"></i></span>' : ''}
                </div>
            </div>
            <div class="pv-menu-wrap">
                <button class="pv-menu-btn" onclick="togglePostMenu(this)"><i class="fas fa-ellipsis-h"></i></button>
                <div class="pv-dropdown" id="pvDropdown">
                    ${isOwn ? `<button class="pv-drop-item" onclick="editCurrentPost()"><i class="fas fa-pen"></i> Modifier</button>` : ''}
                    ${isOwn ? `<button class="pv-drop-item danger" onclick="deleteCurrentPost()"><i class="fas fa-trash-alt"></i> Supprimer</button>` : ''}
                    <button class="pv-drop-item" onclick="openModal('modalShare')"><i class="fas fa-share-alt"></i> Partager</button>
                    ${!isOwn ? `<button class="pv-drop-item danger" onclick="openModal('modalReport')"><i class="fas fa-flag"></i> Signaler</button>` : ''}
                </div>
            </div>
        </div>

        ${post.content ? `<div class="pv-body"><div class="pv-text">${formatText(post.content)}</div></div>` : ''}
        ${mediaHtml}
        ${pollHtml}
        ${eventHtml}

        <div class="pv-stats-bar">
            <button class="pv-stat-btn" onclick="showLikes()"><strong id="pvLikeCount">${post.likes_count || 0}</strong> J'aime</button>
            <button class="pv-stat-btn" onclick="showDislikes()"><strong id="pvDislikeCount">${post.dislikes_count || 0}</strong> Je n'aime pas</button>
            <span><strong>${post.comments_count || 0}</strong> commentaire${(post.comments_count || 0) !== 1 ? 's' : ''}</span>
            <span><strong>${post.shares_count || 0}</strong> partage${(post.shares_count || 0) !== 1 ? 's' : ''}</span>
            <span><strong>${post.reposts_count || 0}</strong> repost${(post.reposts_count || 0) !== 1 ? 's' : ''}</span>
        </div>

        <div class="pv-actions">
            <button class="pv-action ${isLiked ? 'liked' : ''}" id="pvLikeBtn" onclick="toggleLike()">
                <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i> <span>J'aime</span>
            </button>
            <button class="pv-action ${isDisliked ? 'disliked' : ''}" id="pvDislikeBtn" onclick="toggleDislike()">
                <i class="fa${isDisliked ? 's' : 'r'} fa-heart-broken"></i> <span>Je n'aime pas</span>
            </button>
            <button class="pv-action" onclick="focusCommentInput()">
                <i class="far fa-comment"></i> <span>Commenter</span>
            </button>
            <button class="pv-action" onclick="openModal('modalShare')">
                <i class="fas fa-share"></i> <span>Partager</span>
            </button>
            <button class="pv-action ${isSaved ? 'saved' : ''}" id="pvSaveBtn" onclick="toggleSave()">
                <i class="fa${isSaved ? 's' : 'r'} fa-bookmark"></i> <span>Enregistrer</span>
            </button>
        </div>
    `;

    document.getElementById('commentsSection').style.display = 'block';
}

function togglePostMenu(btn) {
    const menu = document.getElementById('pvDropdown');
    menu.classList.toggle('show');
    document.addEventListener('click', () => menu.classList.remove('show'), { once: true });
}
// Fin chargement post

// Début interactions
async function toggleLike() {
    const btn = document.getElementById('pvLikeBtn');
    const countEl = document.getElementById('pvLikeCount');
    if (isLiked) {
        isLiked = false; btn.classList.remove('liked'); btn.querySelector('i').className = 'far fa-heart';
        currentPost.likes_count = Math.max(0, (currentPost.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_likes').delete().eq('post_id', currentPost.id).eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        isLiked = true; btn.classList.add('liked'); btn.querySelector('i').className = 'fas fa-heart';
        currentPost.likes_count = (currentPost.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_likes').insert({ post_id: currentPost.id, user_hubisoccer_id: currentProfile.hubisoccer_id });
        if (currentPost.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: currentPost.author_hubisoccer_id, type: 'like',
                title: 'Nouveau J\'aime', message: `${currentProfile.full_name} a aimé votre publication.`,
                data: { link: `post-view.html?id=${currentPost.id}` }
            });
        }
    }
    countEl.textContent = currentPost.likes_count;
    await sb.from('supabaseAuthPrive_posts').update({ likes_count: currentPost.likes_count }).eq('id', currentPost.id);
}

async function toggleDislike() {
    const btn = document.getElementById('pvDislikeBtn');
    const countEl = document.getElementById('pvDislikeCount');
    if (isDisliked) {
        isDisliked = false; btn.classList.remove('disliked'); btn.querySelector('i').className = 'far fa-heart-broken';
        currentPost.dislikes_count = Math.max(0, (currentPost.dislikes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_dislikes').delete().eq('post_id', currentPost.id).eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        isDisliked = true; btn.classList.add('disliked'); btn.querySelector('i').className = 'fas fa-heart-broken';
        currentPost.dislikes_count = (currentPost.dislikes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_dislikes').insert({ post_id: currentPost.id, user_hubisoccer_id: currentProfile.hubisoccer_id });
    }
    countEl.textContent = currentPost.dislikes_count;
    await sb.from('supabaseAuthPrive_posts').update({ dislikes_count: currentPost.dislikes_count }).eq('id', currentPost.id);
}

async function toggleSave() {
    const btn = document.getElementById('pvSaveBtn');
    if (isSaved) {
        isSaved = false; btn.classList.remove('saved'); btn.querySelector('i').className = 'far fa-bookmark';
        await sb.from('supabaseAuthPrive_saved_posts').delete().eq('post_id', currentPost.id).eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        toast('Publication retirée', 'info');
    } else {
        isSaved = true; btn.classList.add('saved'); btn.querySelector('i').className = 'fas fa-bookmark';
        await sb.from('supabaseAuthPrive_saved_posts').insert({ post_id: currentPost.id, user_hubisoccer_id: currentProfile.hubisoccer_id });
        toast('Publication enregistrée ✅', 'success');
    }
}

async function votePoll(optionIdx) {
    if (!currentPost.poll_data) return;
    const poll = typeof currentPost.poll_data === 'string' ? JSON.parse(currentPost.poll_data) : currentPost.poll_data;
    if (poll.voted_by?.includes(currentProfile.hubisoccer_id)) return;
    poll.votes = poll.votes || {};
    poll.votes[optionIdx] = (poll.votes[optionIdx] || 0) + 1;
    poll.voted_by = [...(poll.voted_by || []), currentProfile.hubisoccer_id];
    poll.my_vote = optionIdx;
    currentPost.poll_data = poll;
    await sb.from('supabaseAuthPrive_posts').update({ poll_data: poll }).eq('id', currentPost.id);
    renderPost(currentPost);
}
// Fin interactions

// Début commentaires
async function loadComments(append = false) {
    const sort = document.getElementById('commentSort').value;
    let query = sb.from('supabaseAuthPrive_comments')
        .select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('post_id', currentPost.id)
        .is('parent_id', null)
        .range(commentOffset, commentOffset + COMMENT_PAGE - 1);

    if (sort === 'popular') query = query.order('likes_count', { ascending: false });
    else query = query.order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) { toast('Erreur commentaires', 'error'); return; }

    hasMoreComments = data.length === COMMENT_PAGE;
    commentOffset += data.length;

    if (append) comments = [...comments, ...(data || [])];
    else comments = data || [];

    document.getElementById('commentCount').textContent = currentPost.comments_count || 0;

    const feed = document.getElementById('commentsFeed');
    if (!append) feed.innerHTML = '';

    for (const c of data || []) {
        const { data: replies } = await sb.from('supabaseAuthPrive_comments')
            .select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('parent_id', c.id)
            .order('created_at', { ascending: true })
            .limit(3);
        feed.insertAdjacentHTML('beforeend', makeCommentCard(c, replies || []));
    }

    if (comments.length === 0 && !append) {
        feed.innerHTML = `<div class="c-empty"><p>Aucun commentaire. Soyez le premier !</p></div>`;
    }

    document.getElementById('loadMoreCommentsWrap').style.display = hasMoreComments ? 'block' : 'none';
}

function makeCommentCard(c, replies = []) {
    const author = c.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const isOwn = c.author_hubisoccer_id === currentProfile.hubisoccer_id;
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);

    const avatarBlock = avatarUrl
        ? `<img class="cm-avatar" src="${avatarUrl}" alt="" onclick="openUserProfile('${c.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="cm-avatar-initials" onclick="openUserProfile('${c.author_hubisoccer_id}')">${initials}</div>`;

    return `
        <div class="comment-card" id="cm_${c.id}">
            ${avatarBlock}
            <div class="cm-body">
                <div class="cm-bubble">
                    <div class="cm-author">
                        ${escapeHtml(authorName)}
                        ${author.role_code ? `<span class="cm-role-badge">${escapeHtml(author.role_code)}</span>` : ''}
                    </div>
                    <div class="cm-text">${formatText(c.content)}</div>
                    ${c.media_url ? `<div class="cm-media"><img src="${c.media_url}" alt="" onclick="openMediaZoom('${c.media_url}','image')"></div>` : ''}
                    ${c.audio_url ? `<div class="cm-audio"><audio controls src="${c.audio_url}"></audio></div>` : ''}
                </div>
                <div class="cm-footer">
                    <button class="cm-action-btn ${c.liked_by_me ? 'liked' : ''}" onclick="likeComment('${c.id}', this)">
                        <i class="fa${c.liked_by_me ? 's' : 'r'} fa-heart"></i> <span id="cmLike_${c.id}">${c.likes_count || 0}</span>
                    </button>
                    <button class="cm-action-btn" onclick="toggleReplyCompose('${c.id}')"><i class="fas fa-reply"></i> Répondre</button>
                    ${isOwn ? `<button class="cm-action-btn" style="color:var(--danger)" onclick="deleteComment('${c.id}')"><i class="fas fa-trash-alt"></i> Supprimer</button>` : ''}
                    <span class="cm-time">${timeSince(c.created_at)}</span>
                    ${c.edited ? '<span class="cm-edited">(modifié)</span>' : ''}
                </div>
                ${replies.length ? `<div class="cm-replies" id="replies_${c.id}">${replies.map(r => makeReplyCard(r)).join('')}</div>` : `<div class="cm-replies" id="replies_${c.id}"></div>`}
                <div id="replyCompose_${c.id}" style="display:none; margin-top:8px;">
                    <div class="cm-reply-compose">
                        <div class="cm-reply-avatar-initials">${getInitials(currentProfile.full_name || '')}</div>
                        <img src="${currentProfile.avatar_url || ''}" alt="" style="display:${currentProfile.avatar_url ? 'block' : 'none'}; width:26px;height:26px;border-radius:50%;">
                        <textarea rows="1" id="replyInput_${c.id}" placeholder="Répondre à ${escapeHtml(authorName)}..."></textarea>
                        <button onclick="sendReply('${c.id}')"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function makeReplyCard(r) {
    const author = r.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    return `
        <div class="cm-reply-card" id="cm_${r.id}">
            <div class="cm-reply-avatar-initials" onclick="openUserProfile('${r.author_hubisoccer_id}')" style="display:${avatarUrl ? 'none' : 'flex'};">
                ${initials}
            </div>
            <img class="cm-reply-avatar" src="${avatarUrl || ''}" alt="" onclick="openUserProfile('${r.author_hubisoccer_id}')" style="display:${avatarUrl ? 'block' : 'none'};">
            <div class="cm-reply-bubble">
                <div class="cm-reply-author">${escapeHtml(authorName)}</div>
                <div class="cm-reply-text">${formatText(r.content)}</div>
                <div class="cm-footer">
                    <button class="cm-action-btn" onclick="likeComment('${r.id}', this)"><i class="far fa-heart"></i> ${r.likes_count || 0}</button>
                    <span class="cm-time">${timeSince(r.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

function toggleReplyCompose(commentId) {
    const el = document.getElementById(`replyCompose_${commentId}`);
    if (!el) return;
    const isOpen = el.style.display !== 'none';
    document.querySelectorAll('[id^="replyCompose_"]').forEach(e => e.style.display = 'none');
    if (!isOpen) { el.style.display = 'block'; document.getElementById(`replyInput_${commentId}`)?.focus(); }
}

async function sendReply(parentId) {
    const input = document.getElementById(`replyInput_${parentId}`);
    const content = input?.value.trim();
    if (!content) return;
    input.value = '';

    const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
        post_id: currentPost.id,
        author_hubisoccer_id: currentProfile.hubisoccer_id,
        content,
        parent_id: parentId
    }).select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url)').single();

    if (error) { toast('Erreur envoi réponse', 'error'); return; }

    const repliesContainer = document.getElementById(`replies_${parentId}`);
    if (repliesContainer) repliesContainer.insertAdjacentHTML('beforeend', makeReplyCard(data));
    document.getElementById(`replyCompose_${parentId}`).style.display = 'none';
    toast('Réponse envoyée ✅', 'success');

    const parentComment = comments.find(c => c.id === parentId);
    if (parentComment && parentComment.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
        await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: parentComment.author_hubisoccer_id, type: 'reply',
            title: 'Nouvelle réponse', message: `${currentProfile.full_name} a répondu à votre commentaire.`,
            data: { link: `post-view.html?id=${currentPost.id}` }
        });
    }
}

async function sendComment() {
    const input = document.getElementById('mainCommentInput');
    const content = input.value.trim();
    if (!content && !commentMediaFile) { toast('Écris un commentaire', 'warning'); return; }

    const btn = document.getElementById('sendCommentBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        let mediaUrl = null;
        if (commentMediaFile) {
            const ext = commentMediaFile.name.split('.').pop();
            const path = `comments/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, commentMediaFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
                mediaUrl = urlData.publicUrl;
            }
            commentMediaFile = null;
            document.getElementById('commentMediaPreview').style.display = 'none';
        }

        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: currentPost.id,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl,
            parent_id: null
        }).select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        document.getElementById('commentsFeed').insertAdjacentHTML('afterbegin', makeCommentCard(data, []));
        input.value = ''; input.style.height = 'auto';
        currentPost.comments_count = (currentPost.comments_count || 0) + 1;
        document.getElementById('commentCount').textContent = currentPost.comments_count;
        await sb.from('supabaseAuthPrive_posts').update({ comments_count: currentPost.comments_count }).eq('id', currentPost.id);

        if (currentPost.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: currentPost.author_hubisoccer_id, type: 'comment',
                title: 'Nouveau commentaire', message: `${currentProfile.full_name} a commenté votre publication.`,
                data: { link: `post-view.html?id=${currentPost.id}` }
            });
        }
    } catch (err) {
        toast('Erreur commentaire : ' + err.message, 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Commenter';
    }
}

async function likeComment(commentId, btn) {
    const liked = btn.classList.contains('liked');
    const countEl = btn.querySelector('span');
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (liked) {
        btn.classList.remove('liked'); btn.querySelector('i').className = 'far fa-heart';
        if (countEl) countEl.textContent = Math.max(0, (comment.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete().eq('comment_id', commentId).eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        btn.classList.add('liked'); btn.querySelector('i').className = 'fas fa-heart';
        if (countEl) countEl.textContent = (comment.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_comment_likes').insert({ comment_id: commentId, user_hubisoccer_id: currentProfile.hubisoccer_id });
    }
    const newLikes = parseInt(countEl?.textContent || '0');
    comment.likes_count = newLikes;
    await sb.from('supabaseAuthPrive_comments').update({ likes_count: newLikes }).eq('id', commentId);
}

async function deleteComment(commentId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await sb.from('supabaseAuthPrive_comments').delete().eq('id', commentId);
    document.getElementById(`cm_${commentId}`)?.remove();
    currentPost.comments_count = Math.max(0, (currentPost.comments_count || 1) - 1);
    document.getElementById('commentCount').textContent = currentPost.comments_count;
    await sb.from('supabaseAuthPrive_posts').update({ comments_count: currentPost.comments_count }).eq('id', currentPost.id);
    toast('Commentaire supprimé', 'success');
}

function focusCommentInput() {
    document.getElementById('mainCommentInput')?.focus();
    window.scrollTo({ top: document.getElementById('commentsSection').offsetTop - 80, behavior: 'smooth' });
}
// Fin commentaires

// Début auteur et posts liés
async function loadAuthorCard(author, community) {
    if (!author) return;
    const isOwn = author.hubisoccer_id === currentProfile.hubisoccer_id;

    document.getElementById('authorName').textContent = author.full_name || author.display_name || 'Utilisateur';
    document.getElementById('authorHandle').textContent = author.feed_id ? '@' + author.feed_id : '';
    document.getElementById('authorRole').textContent = author.role_code || '';
    document.getElementById('authorBio').textContent = author.bio || '';
    document.getElementById('authorFollowers').textContent = community?.followers_count || 0;
    document.getElementById('authorPosts').textContent = community?.posts_count || 0;

    const avatarUrl = author.avatar_url;
    const avatar = document.getElementById('authorAvatar');
    const initials = document.getElementById('authorAvatarInitials');
    if (avatarUrl && avatarUrl !== '') {
        avatar.src = avatarUrl;
        avatar.style.display = 'block';
        initials.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = getInitials(author.full_name || '');
    }

    document.getElementById('authorActions').innerHTML = isOwn
        ? `<a class="btn-outline" href="feed.html" style="flex:1;text-align:center"><i class="fas fa-edit"></i> Mon feed</a>`
        : `<button class="btn-primary" id="authorFollowBtn" onclick="toggleFollow('${author.hubisoccer_id}', this)" style="flex:1"><i class="fas fa-user-plus"></i> S'abonner</button>
           <a class="btn-outline" href="../messagerie/conversation.html?to=${author.hubisoccer_id}"><i class="fas fa-envelope"></i></a>`;

    const { data: follow } = await sb.from('supabaseAuthPrive_follows')
        .select('id').eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('following_hubisoccer_id', author.hubisoccer_id).maybeSingle();
    if (follow) {
        const fb = document.getElementById('authorFollowBtn');
        if (fb) { fb.innerHTML = '<i class="fas fa-user-check"></i> Abonné'; fb.classList.remove('btn-primary'); fb.classList.add('btn-outline'); }
    }

    document.getElementById('authorCard').style.display = 'block';
}

async function loadRelatedPosts(userId, excludeId) {
    const { data } = await sb.from('supabaseAuthPrive_posts')
        .select('id, content, media_url, created_at, likes_count')
        .eq('author_hubisoccer_id', userId)
        .neq('id', excludeId)
        .order('created_at', { ascending: false })
        .limit(4);

    if (!data || data.length === 0) return;
    document.getElementById('relatedPosts').innerHTML = data.map(p => `
        <div class="related-post-item" onclick="window.location.href='post-view.html?id=${p.id}'">
            ${p.media_url && p.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                ? `<img class="related-thumb" src="${p.media_url}" alt="" onerror="this.style.display='none'">`
                : `<div class="related-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem">📝</div>`}
            <div class="related-info">
                <h5>${escapeHtml(p.content?.substring(0, 80) || 'Publication')}</h5>
                <div class="related-meta"><i class="fas fa-heart" style="color:var(--danger)"></i> ${p.likes_count || 0} · ${timeSince(p.created_at)}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('relatedCard').style.display = 'block';
}

async function toggleFollow(userId, btn) {
    const { data: existing } = await sb.from('supabaseAuthPrive_follows')
        .select('id').eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('following_hubisoccer_id', userId).maybeSingle();

    if (existing) {
        await sb.from('supabaseAuthPrive_follows').delete().eq('id', existing.id);
        btn.innerHTML = '<i class="fas fa-user-plus"></i> S\'abonner';
        btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
    } else {
        await sb.from('supabaseAuthPrive_follows').insert({ follower_hubisoccer_id: currentProfile.hubisoccer_id, following_hubisoccer_id: userId });
        btn.innerHTML = '<i class="fas fa-user-check"></i> Abonné';
        btn.classList.remove('btn-primary'); btn.classList.add('btn-outline');
        await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: userId, type: 'follow',
            title: 'Nouvel abonné', message: `${currentProfile.full_name} s'est abonné à votre communauté.`,
            data: { link: `profil-feed.html?id=${currentProfile.hubisoccer_id}` }
        });
    }
}
// Fin auteur et posts liés

// Début modales et actions
function showLikes() {
    const list = document.getElementById('likesList');
    list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Chargement...</li>';
    openModal('modalLikes');
    sb.from('supabaseAuthPrive_post_likes')
        .select('user_hubisoccer_id, profiles:supabaseAuthPrive_profiles!user_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('post_id', currentPost.id)
        .limit(30)
        .then(({ data }) => {
            list.innerHTML = (data || []).map(l => {
                const p = l.profiles || {};
                const name = p.full_name || p.display_name || 'Utilisateur';
                const avatarUrl = p.avatar_url;
                return `<li class="pv-user-item" onclick="openUserProfile('${l.user_hubisoccer_id}')">
                    ${avatarUrl ? `<img src="${avatarUrl}" alt="">` : `<div class="pv-user-avatar-initials">${getInitials(name)}</div>`}
                    <span class="pv-user-item-name">${escapeHtml(name)}</span>
                </li>`;
            }).join('') || '<li style="padding:16px;color:var(--gray);text-align:center">Aucun j\'aime</li>';
        });
}

function showDislikes() {
    const list = document.getElementById('dislikesList');
    list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Chargement...</li>';
    openModal('modalDislikes');
    sb.from('supabaseAuthPrive_post_dislikes')
        .select('user_hubisoccer_id, profiles:supabaseAuthPrive_profiles!user_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('post_id', currentPost.id)
        .limit(30)
        .then(({ data }) => {
            list.innerHTML = (data || []).map(l => {
                const p = l.profiles || {};
                const name = p.full_name || p.display_name || 'Utilisateur';
                const avatarUrl = p.avatar_url;
                return `<li class="pv-user-item" onclick="openUserProfile('${l.user_hubisoccer_id}')">
                    ${avatarUrl ? `<img src="${avatarUrl}" alt="">` : `<div class="pv-user-avatar-initials">${getInitials(name)}</div>`}
                    <span class="pv-user-item-name">${escapeHtml(name)}</span>
                </li>`;
            }).join('') || '<li style="padding:16px;color:var(--gray);text-align:center">Aucun dislike</li>';
        });
}

async function editCurrentPost() {
    document.getElementById('pvDropdown').classList.remove('show');
    const newContent = prompt('Modifier la publication :', currentPost.content || '');
    if (newContent === null) return;
    await sb.from('supabaseAuthPrive_posts').update({ content: newContent, edited: true }).eq('id', currentPost.id);
    currentPost.content = newContent; currentPost.edited = true;
    renderPost(currentPost);
    toast('Publication modifiée ✅', 'success');
}

async function deleteCurrentPost() {
    document.getElementById('pvDropdown').classList.remove('show');
    document.getElementById('confirmTitle').textContent = 'Supprimer la publication';
    document.getElementById('confirmDesc').textContent = 'Cette action est irréversible.';
    document.getElementById('confirmActionBtn').onclick = async () => {
        await sb.from('supabaseAuthPrive_posts').delete().eq('id', currentPost.id);
        closeModal('modalConfirm');
        toast('Publication supprimée', 'success');
        setTimeout(() => window.location.href = 'feed.html', 1000);
    };
    openModal('modalConfirm');
}

function sharePost(network) {
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentPost.id}`;
    const text = currentPost.content?.substring(0, 100) || 'Découvrez cette publication sur HubISoccer';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === 'copy') { navigator.clipboard.writeText(url); toast('Lien copié !', 'success'); }
    else { window.open(shareUrls[network], '_blank'); }
    closeModal('modalShare');
    sb.from('supabaseAuthPrive_posts').update({ shares_count: (currentPost.shares_count || 0) + 1 }).eq('id', currentPost.id);
}

async function submitReport() {
    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
    if (!reason) { toast('Sélectionne une raison', 'warning'); return; }
    const details = document.getElementById('reportDetails').value.trim();
    await sb.from('supabaseAuthPrive_reports').insert({
        post_id: currentPost.id,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason,
        details
    });
    closeModal('modalReport');
    toast('Signalement envoyé. Merci !', 'success');
}

function openMediaZoom(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video'
        ? `<video src="${url}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px"></video>`
        : `<img src="${url}" alt="" style="max-width:90vw;max-height:80vh;border-radius:8px">`;
    openModal('modalMedia');
}

function openUserProfile(userId) {
    window.location.href = `profil-feed.html?id=${userId}`;
}

function removeCommentMedia() {
    commentMediaFile = null;
    document.getElementById('commentMediaPreview').style.display = 'none';
}
// Fin modales et actions

// Début initialisation
async function init() {
    setLoader(true, 'Chargement du profil...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    if (!postId) { window.location.href = 'feed.html'; return; }

    setLoader(true, 'Chargement de la publication...', 60);
    const post = await loadPost(postId);
    setLoader(false);
    if (!post) return;

    await loadComments();
    subscribeComments();

    const ta = document.getElementById('mainCommentInput');
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendComment(); } });

    document.getElementById('sendCommentBtn').addEventListener('click', sendComment);
    document.getElementById('loadMoreCommentsBtn').addEventListener('click', () => loadComments(true));
    document.getElementById('commentSort').addEventListener('change', () => { commentOffset = 0; comments = []; loadComments(false); });

    document.getElementById('commentMediaBtn').addEventListener('click', () => document.getElementById('commentMediaInput').click());
    document.getElementById('commentMediaInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        commentMediaFile = file;
        const url = URL.createObjectURL(file);
        const preview = document.getElementById('commentMediaPreview');
        preview.innerHTML = `<div style="position:relative"><img src="${url}" style="max-height:120px;border-radius:8px"><button class="remove-comment-media" onclick="removeCommentMedia()"><i class="fas fa-times"></i></button></div>`;
        preview.style.display = 'block';
    });

    document.querySelectorAll('.share-btn-pv').forEach(btn => btn.addEventListener('click', () => sharePost(btn.dataset.network)));
    document.getElementById('submitReportBtn').addEventListener('click', submitReport);

    document.getElementById('userMenu').addEventListener('click', e => { e.stopPropagation(); document.getElementById('userDropdown').classList.toggle('show'); });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    document.querySelectorAll('.c-modal').forEach(m => { m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); }); });
}

function subscribeComments() {
    commentSubscription = sb.channel(`post_comments_${currentPost.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_comments', filter: `post_id=eq.${currentPost.id}` }, async payload => {
            const c = payload.new;
            if (c.author_hubisoccer_id === currentProfile.hubisoccer_id) return;
            if (!c.parent_id) {
                const { data: author } = await sb.from('supabaseAuthPrive_profiles').select('full_name, display_name, avatar_url, role_code').eq('hubisoccer_id', c.author_hubisoccer_id).single();
                document.getElementById('commentsFeed').insertAdjacentHTML('afterbegin', makeCommentCard({ ...c, author }, []));
                currentPost.comments_count = (currentPost.comments_count || 0) + 1;
                document.getElementById('commentCount').textContent = currentPost.comments_count;
            }
        })
        .subscribe();
}
// Fin initialisation

// Exposer fonctions globales
window.openUserProfile = openUserProfile;
window.toggleFollow = toggleFollow;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
window.togglePostMenu = togglePostMenu;
window.toggleReplyCompose = toggleReplyCompose;
window.sendReply = sendReply;
window.likeComment = likeComment;
window.deleteComment = deleteComment;
window.editCurrentPost = editCurrentPost;
window.deleteCurrentPost = deleteCurrentPost;
window.votePoll = votePoll;
window.openMediaZoom = openMediaZoom;
window.showLikes = showLikes;
window.showDislikes = showDislikes;
window.removeCommentMedia = removeCommentMedia;

document.addEventListener('DOMContentLoaded', init);