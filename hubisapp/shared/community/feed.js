// ============================================================
//  HUBISOCCER — FEED.JS
//  Feed principal de la communauté
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
let myCommunity       = null;
let posts             = [];
let likedPosts        = new Set();
let dislikedPosts     = new Set();
let savedPosts        = new Set();
let activeFilter      = 'all';
let activeRoleFilter  = 'all';
let searchQuery       = '';
let newPostsCount     = 0;
let postOffset        = 0;
const PAGE_SIZE       = 20;
let hasMorePosts      = false;
let loadingPosts      = false;
let mediaFile         = null;
let pendingPoll       = null;
let pendingEvent      = null;
let scheduledAt       = null;
let currentReportPostId = null;
let currentBlockUserId  = null;
let currentSharePostId  = null;
let replyCommentId    = null;
let replyPostId       = null;
let pinPostActive     = false;
let feedSubscription  = null;
let storyGroups       = [];
let currentStoryGroupIdx = 0;
let currentStoryIdx   = 0;
let storyTimer        = null;
// Fin état global

// Début configuration des 28 rôles pour le mapping
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'BASK': '../../basketteur/dashboard/basketteur-dash.html',
    'TENN': '../../tennisman/dashboard/tennisman-dash.html',
    'ATHL': '../../athlete/dashboard/athlete-dash.html',
    'HANDB': '../../handballeur/dashboard/handballeur-dash.html',
    'VOLL': '../../volleyeur/dashboard/volleyeur-dash.html',
    'RUGBY': '../../rugbyman/dashboard/rugbyman-dash.html',
    'NATA': '../../nageur/dashboard/nageur-dash.html',
    'ARTSM': '../../arts_martiaux/dashboard/arts_martiaux-dash.html',
    'CYCL': '../../cycliste/dashboard/cycliste-dash.html',
    'CHAN': '../../chanteur/dashboard/chanteur-dash.html',
    'DANS': '../../danseur/dashboard/danseur-dash.html',
    'COMP': '../../compositeur/dashboard/compositeur-dash.html',
    'ACIN': '../../acteur_cinema/dashboard/acteur_cinema-dash.html',
    'ATHE': '../../acteur_theatre/dashboard/acteur_theatre-dash.html',
    'HUMO': '../../humoriste/dashboard/humoriste-dash.html',
    'SLAM': '../../slameur/dashboard/slameur-dash.html',
    'DJ': '../../dj/dashboard/dj-dash.html',
    'CIRQ': '../../cirque/dashboard/cirque-dash.html',
    'VISU': '../../artiste_visuel/dashboard/artiste_visuel-dash.html',
    'PARRAIN': '../../parrain/dashboard/parrain-dash.html',
    'AGENT': '../../agent_fifa/dashboard/agent_fifa-dash.html',
    'COACH': '../../coach/dashboard/coach-dash.html',
    'MEDIC': '../../staff_medical/dashboard/staff_medical-dash.html',
    'ARBIT': '../../corps_arbitral/dashboard/corps_arbitral-dash.html',
    'ACAD': '../../academie_sportive/dashboard/academie_sportive-dash.html',
    'FORM': '../../formateur/dashboard/formateur-dash.html',
    'TOURN': '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};
// Fin configuration des 28 rôles

// Début fonctions utilitaires
function toast(msg, type='info', dur=20000) {
    const c = document.getElementById('toastContainer');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${msg}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    c.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => el.remove(), 300);
    }, dur);
}

function timeSince(d) {
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'À l\'instant';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const j = Math.floor(h / 24);
    if (j < 7) return `${j}j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function formatText(t) {
    if (!t) return '';
    return escapeHtml(t)
        .replace(/@(\w+)/g, '<span class="mention" onclick="openUserByHandle(\'$1\')">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag" onclick="searchByHashtag(\'$1\')">#$1</span>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function setLoader(show, text='', pct=0) {
    const l = document.getElementById('globalLoader');
    if (!l) return;
    l.style.display = show ? 'flex' : 'none';
    if (text) document.getElementById('loaderText').textContent = text;
    document.getElementById('loaderBar').style.width = pct + '%';
}

function openModal(id) {
    const e = document.getElementById(id);
    if (e) {
        e.style.display = 'flex';
        setTimeout(() => e.classList.add('show'), 10);
    }
}

function closeModal(id) {
    const e = document.getElementById(id);
    if (e) {
        e.classList.remove('show');
        e.style.display = 'none';
    }
}
window.closeModal = closeModal;
// Fin fonctions utilitaires

// Début session et profil
async function checkSession() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

async function loadProfile() {
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) {
        toast('Erreur chargement profil', 'error');
        return null;
    }
    currentProfile = data;

    // UI utilisateur
    document.getElementById('userName').textContent = data.full_name || data.display_name || 'Utilisateur';
    updateAvatarDisplay(data.avatar_url, data.full_name || data.display_name);

    // Dashboard selon rôle
    const dash = ROLE_DASHBOARD_MAP[data.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;

    // Menu sidebar
    buildSidebarMenu(data.role_code);

    return data;
}

function updateAvatarDisplay(avatarUrl, fullName) {
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const publishAvatar = document.getElementById('publishAvatar');
    const publishInitials = document.getElementById('publishAvatarInitials');
    const storyAddAvatar = document.getElementById('storyAddAvatar');
    const storyAddInitials = document.getElementById('storyAddAvatarInitials');

    const initials = getInitials(fullName);

    if (avatarUrl && avatarUrl !== '') {
        userAvatar.src = avatarUrl;
        userAvatar.style.display = 'block';
        userInitials.style.display = 'none';
        publishAvatar.src = avatarUrl;
        publishAvatar.style.display = 'block';
        publishInitials.style.display = 'none';
        storyAddAvatar.src = avatarUrl;
        storyAddAvatar.style.display = 'block';
        storyAddInitials.style.display = 'none';
    } else {
        userAvatar.style.display = 'none';
        userInitials.style.display = 'flex';
        userInitials.textContent = initials;
        publishAvatar.style.display = 'none';
        publishInitials.style.display = 'flex';
        publishInitials.textContent = initials;
        storyAddAvatar.style.display = 'none';
        storyAddInitials.style.display = 'flex';
        storyAddInitials.textContent = initials;
    }
}

function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    const titleEl = document.getElementById('sidebarRoleTitle');

    const menuConfig = {
        'FOOT': {
            title: 'Menu Footballeur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../footballeur/dashboard/foot-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../footballeur/verification/foot-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../footballeur/edit-cv/foot-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../footballeur/certifications/foot-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../footballeur/videos/foot-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../footballeur/revenus/foot-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../footballeur/support/foot-supp.html' }
            ]
        },
        'ADMIN': {
            title: 'Menu Admin',
            items: [
                { icon: 'fa-chart-pie', label: 'Dashboard', href: '../../authprive/admin/admin-dashboard.html' },
                { icon: 'fa-users', label: 'Communauté', href: 'feed.html', active: true },
                { icon: 'fa-id-card', label: 'Gestion IDs', href: '../../authprive/admin/admin-ids.html' },
                { icon: 'fa-users-cog', label: 'Utilisateurs', href: '../../authprive/admin/admin-users.html' },
                { icon: 'fa-history', label: 'Logs', href: '../../authprive/admin/admin-logs.html' }
            ]
        }
    };

    const config = menuConfig[roleCode] || {
        title: 'Menu',
        items: [{ icon: 'fa-users', label: 'Communauté', href: 'feed.html', active: true }]
    };

    titleEl.textContent = config.title;
    nav.innerHTML = config.items.map(item => `
        <a href="${item.href}" class="${item.active ? 'active' : ''}">
            <i class="fas ${item.icon}"></i> ${item.label}
        </a>
    `).join('') + `
        <hr>
        <a href="#" id="sidebarLogout" style="color:var(--danger)">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
        </a>
    `;
    document.getElementById('sidebarLogout')?.addEventListener('click', logout);
}
// Fin session et profil

// Début chargement communauté
async function loadMyCommunity() {
    const { data, error } = await sb
        .from('supabaseAuthPrive_communities')
        .select('*')
        .eq('hubisoccer_id', currentProfile.hubisoccer_id)
        .maybeSingle();

    if (error || !data) {
        window.location.href = 'feed-setup.html';
        return null;
    }
    myCommunity = data;

    // Remplir la sidebar droite
    const cover = document.getElementById('myCommCover');
    if (data.cover_url) cover.style.background = `url(${data.cover_url}) center/cover`;

    const commAvatar = document.getElementById('myCommAvatar');
    const commInitials = document.getElementById('myCommAvatarInitials');
    if (data.avatar_url && data.avatar_url !== '') {
        commAvatar.src = data.avatar_url;
        commAvatar.style.display = 'block';
        commInitials.style.display = 'none';
    } else {
        commAvatar.style.display = 'none';
        commInitials.style.display = 'flex';
        commInitials.textContent = getInitials(data.name || 'Ma Communauté');
    }

    document.getElementById('myCommName').textContent = data.name || 'Ma Communauté';
    document.getElementById('myCommHandle').textContent = '@' + (data.feed_id || '');
    document.getElementById('myCommFollowers').textContent = data.followers_count || 0;
    document.getElementById('myCommFollowing').textContent = data.following_count || 0;
    document.getElementById('myCommPosts').textContent = data.posts_count || 0;

    return data;
}
// Fin chargement communauté

// Début posts
async function loadPosts(reset = false) {
    if (loadingPosts) return;
    loadingPosts = true;

    if (reset) {
        postOffset = 0;
        posts = [];
        document.getElementById('postsFeed').innerHTML = '';
        document.getElementById('feedSkeleton').style.display = 'block';
    }

    try {
        let query = sb.from('supabaseAuthPrive_posts')
            .select(`
                *,
                author:author_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, role_code, feed_id, certified),
                community:community_id(name, feed_id, avatar_url)
            `)
            .eq('is_scheduled', false)
            .order('created_at', { ascending: false })
            .range(postOffset, postOffset + PAGE_SIZE - 1);

        if (activeFilter === 'following') {
            const { data: follows } = await sb
                .from('supabaseAuthPrive_follows')
                .select('following_hubisoccer_id')
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
            const ids = (follows || []).map(f => f.following_hubisoccer_id);
            if (ids.length) query = query.in('author_hubisoccer_id', ids);
            else { posts = []; renderPosts(); return; }
        }
        if (activeFilter === 'saved') query = query.in('id', Array.from(savedPosts));
        if (activeFilter === 'media') query = query.not('media_url', 'is', null);
        if (activeFilter === 'polls') query = query.not('poll_data', 'is', null);
        if (activeRoleFilter !== 'all') query = query.eq('author.role_code', activeRoleFilter);
        if (searchQuery) query = query.ilike('content', '%' + searchQuery + '%');

        const { data, error } = await query;
        if (error) throw error;

        hasMorePosts = data.length === PAGE_SIZE;
        postOffset += data.length;

        if (reset) posts = data || [];
        else posts = [...posts, ...(data || [])];

        renderPosts();
        document.getElementById('loadMoreWrap').style.display = hasMorePosts ? 'block' : 'none';
    } catch (err) {
        console.error('Erreur chargement posts:', err);
        toast('Erreur chargement des posts', 'error');
    } finally {
        loadingPosts = false;
        document.getElementById('feedSkeleton').style.display = 'none';
    }
}

function renderPosts() {
    const feed = document.getElementById('postsFeed');
    if (posts.length === 0) {
        feed.innerHTML = `
            <div class="c-empty">
                <div class="c-empty-icon"><i class="fas fa-stream"></i></div>
                <h3>Aucune publication</h3>
                <p>Sois le premier à publier dans ta communauté !</p>
            </div>
        `;
        return;
    }
    feed.innerHTML = posts.map(p => makePostCard(p)).join('');
    attachPostEvents();
}

function makePostCard(post) {
    const isOwn = post.author_hubisoccer_id === currentProfile.hubisoccer_id;
    const liked = likedPosts.has(post.id);
    const disliked = dislikedPosts.has(post.id);
    const saved = savedPosts.has(post.id);
    const author = post.author || {};
    const community = post.community || {};

    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorHandle = author.feed_id ? '@' + author.feed_id : '';
    const authorRole = author.role_code || '';
    const certified = author.certified ? '<i class="fas fa-check-circle" style="color:var(--primary);margin-left:4px;"></i>' : '';

    let mediaHtml = '';
    if (post.media_url) {
        if (post.media_type === 'video') {
            mediaHtml = `<div class="post-media"><video src="${post.media_url}" controls preload="metadata"></video></div>`;
        } else {
            mediaHtml = `<div class="post-media"><img src="${post.media_url}" alt="Media" loading="lazy" onclick="openMediaModal('${post.media_url}','image')"></div>`;
        }
    }

    let pollHtml = '';
    if (post.poll_data) {
        const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
        const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
        const hasVoted = poll.voted_by?.includes(currentProfile.hubisoccer_id);
        pollHtml = `
            <div class="post-poll">
                <div class="poll-question">${escapeHtml(poll.question)}</div>
                ${poll.options.map((opt, i) => {
                    const votes = poll.votes?.[i] || 0;
                    const pct = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
                    return `
                        <div class="poll-option${hasVoted ? ' voted' : ''}" data-post-id="${post.id}" data-option="${i}">
                            <div class="poll-bar" style="width:${hasVoted ? pct : 0}%"></div>
                            <span class="poll-option-text">${escapeHtml(opt)}</span>
                            ${hasVoted ? `<span class="poll-pct">${pct}%</span>` : ''}
                        </div>
                    `;
                }).join('')}
                <div class="poll-meta">
                    <i class="fas fa-users"></i> ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }

    let eventHtml = '';
    if (post.event_data) {
        const evt = typeof post.event_data === 'string' ? JSON.parse(post.event_data) : post.event_data;
        const d = new Date(evt.date);
        eventHtml = `
            <div class="post-event">
                <div class="event-card">
                    <div class="event-date-block">
                        <div class="event-day">${d.getDate()}</div>
                        <div class="event-month">${d.toLocaleString('fr-FR', { month: 'short' })}</div>
                    </div>
                    <div class="event-info">
                        <h4>${escapeHtml(evt.title)}</h4>
                        <div class="event-meta">
                            <span><i class="fas fa-clock"></i>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ${evt.location ? `<span><i class="fas fa-map-marker-alt"></i>${escapeHtml(evt.location)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const content = post.content || '';
    const long = content.length > 280;

    return `
    <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
            <div class="post-avatar-initials" onclick="openUserProfile('${post.author_hubisoccer_id}')">
                ${getInitials(authorName)}
            </div>
            <img class="post-avatar" src="${author.avatar_url || '../../img/user-default.jpg'}"
                alt="" onclick="openUserProfile('${post.author_hubisoccer_id}')"
                onerror="this.style.display='none';this.previousElementSibling.style.display='flex';"
                style="display:${author.avatar_url ? 'block' : 'none'};">
            <div class="post-meta">
                <div class="post-author" onclick="openUserProfile('${post.author_hubisoccer_id}')">
                    ${escapeHtml(authorName)}${certified}
                </div>
                <div class="post-author-sub">
                    ${authorRole ? `<span class="post-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    ${authorHandle ? `<span>${authorHandle}</span>` : ''}
                    <span class="post-time">${timeSince(post.created_at)}</span>
                    ${post.pinned ? `<span class="post-pinned-icon"><i class="fas fa-thumbtack"></i></span>` : ''}
                </div>
            </div>
            <div class="post-menu-wrap">
                <button class="post-menu-btn" onclick="togglePostMenu(this, '${post.id}', ${isOwn})">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="post-dropdown" id="menu_${post.id}">
                    ${isOwn ? `<button class="post-drop-item" onclick="editPost('${post.id}')"><i class="fas fa-pen"></i> Modifier</button>` : ''}
                    ${isOwn ? `<button class="post-drop-item danger" onclick="deletePost('${post.id}')"><i class="fas fa-trash-alt"></i> Supprimer</button>` : ''}
                    <button class="post-drop-item" onclick="openShareModal('${post.id}')"><i class="fas fa-share-alt"></i> Partager</button>
                    ${!isOwn ? `<button class="post-drop-item danger" onclick="openReportModal('${post.id}')"><i class="fas fa-flag"></i> Signaler</button>` : ''}
                    ${!isOwn ? `<button class="post-drop-item danger" onclick="openBlockModal('${post.author_hubisoccer_id}')"><i class="fas fa-ban"></i> Bloquer</button>` : ''}
                    <button class="post-drop-item" onclick="hidePost('${post.id}')"><i class="fas fa-eye-slash"></i> Masquer</button>
                </div>
            </div>
        </div>

        <div class="post-body">
            ${content ? `
                <div class="post-text ${long ? 'collapsed' : ''}" id="txt_${post.id}.id}">
                    ${formatText(content)}
                    ${long">
                    ${formatText(content)}
                    ${long ? `<span class="post-see ? `<span class="post-see-more" onclick="expandPost('${post.id}')">-more" onclick="expandPost('${post.id}')">Voir plus</span>` : ''Voir plus</span>` : ''}
                </div>
            ` : ''}
        </div>

        ${mediaHtml}
        ${poll}
                </div>
            ` : ''}
        </div>

        ${mediaHtml}
        ${pollHtmlHtml}
        ${eventHtml}

        <div class="post}
        ${eventHtml}

        <div class="post-actions">
            <button class="post-action ${-actions">
            <button class="post-action ${liked ? 'liked' : ''}" onclick="toggleLikeliked ? 'liked' : ''}" onclick="toggleLike('${post.id}', this)">
                <i class="fa${('${post.id}', this)">
                <i class="fa${liked ? 's' : 'liked ? 's' : 'r'} fa-heart action-icon"></ir'} fa-heart action-icon"></i>
                <span class="post-action-count" id="like>
                <span class="post-action-count" id="likeCount_${post.id}">Count_${post.id}">${post.likes_count || 0}</span${post.likes_count || 0}</span>
            </button>
            <button class="post-action ${disliked ? 'dis>
            </button>
            <button class="post-action ${disliked ? 'disliked' : ''}" onclick="toggleDislike('${postliked' : ''}" onclick="toggleDislike('${post.id}', this)">
               .id}', this)">
                <i class="fa${disliked ? 's' : 'r'} <i class="fa${disliked ? 's' : 'r'} fa-heart-broken action-icon"></i fa-heart-broken action-icon"></i>
                <span>
                <span class="post-action-count" id="dislikeCount_${post.id}">${post.dislikes class="post-action-count" id="dislikeCount_${post.id}">${post.dislikes_count || 0}</span>
            </button>
            <button class="post-action_count || 0}</span>
            </button>
            <button class="post-action" onclick="toggleComments('${post.id}', this" onclick="toggleComments('${post.id}', this)">
               )">
                <i class="far fa-comment action-icon"></i <i class="far fa-comment action-icon"></i>
                <span class="post-action-count">${>
                <span class="postpost.comments_count || 0}</span>
            </button>
           -action-count">${post.comments_count || 0}</span>
            </button>
            <button class="post-action" onclick="repost <button class="post-action" onclick="Post('${post.id}')">
                <i class="fas fa-retweet action-icon"></i>
               repostPost('${post.id}')">
                <i class="fas fa-retweet action-icon"></i <span class="post-action-count" id="repostCount_${>
                <span class="post-action-count" id="repostCount_${post.id}">${post.reposts_count || 0}</span>
            </button>
            <button class="post.id}">${post.reposts_count || 0}</span>
            </button>
            <button class="post-action" onclick="openShareModal('${post-action" onclick="openShareModal('${post.id}')">
                <i class="fas fa-share action-icon"></ipost.id}')">
                <i class="fas fa-share action-icon"></i>
                <span class="post-action-count">>
                <span class="post-action-count">${post.shares_count || 0}</span>
            </button${post.shares_count || 0}</span>
            </button>
            <button class="post-action ${saved ? 'saved' : ''}" onclick=">
            <button class="post-action ${saved ? 'saved' : ''}" onclick="toggleSavetoggleSave('${post.id}', this)" title="Enregistrer">
               ('${post.id}', this)" title="Enregistrer">
                <i class="fa${saved ? ' <i class="fa${saved ? 's' : 'r'} fa-bookmark action-icon"></i>
            </button>
        </divs' : 'r'} fa-bookmark action-icon"></i>
            </button>
        </>

        <div class="post-comments" id="comments_${post.id}" style="displaydiv>

        <div class="post-comments" id="comments_${post.id}" style="display:none"></div>
    </div>`;
}

function attachPostEvents() {
    document.querySelector:none"></div>
    </div>`;
}

function attachPostEvents() {
    document.querySelectorAll('.poll-option:not(.votedAll('.poll-option:not(.voted)').)').forEach(opt => {
        opt.addEventListener('click', () => votePoll(forEach(opt => {
        opt.addEventListener('click', () => votePoll(opt.dataset.postId, parseInt(opt.dataset.opt.dataset.postId, parseInt(opt.dataset.option)));
    });
}
// Fin posts

// Début interactions (option)));
    });
}
// Fin posts

// Début interactions (like, dislike, save, repost)
async function toggleLike(postId, btn) {
    const isLikedlike, dislike, save, repost)
async function toggleLike(postId, btn) {
    const isLiked = liked = likedPosts.has(postId);
    const post = posts.find(p => p.id === postId);
   Posts.has(postId);
    const post = posts.find(p => p.id === postId);
    const countEl = document.getElementById(`likeCount_${post const countEl = document.getElementById(`likeCount_${postId}`);

   Id}`);

    if ( if (isLiked) {
        likedPosts.delete(postisLiked) {
        likedPosts.delete(postId);
        btn.classList.remove('likId);
        btn.classList.remove('liked');
        btn.querySelector('i').className =ed');
        btn.querySelector('i').className = 'far fa-heart action-icon';
        if (post) post.likes 'far fa-heart action-icon';
        if (post) post.likes_count = Math.max(0, (post.likes_count || _count = Math.max(0, (post.likes_count1) - 1);
        await sb.from('supabaseAuth || 1) - 1);
        await sb.from('supabaseAuthPrive_post_likes').delete()
            .Prive_post_likes').delete()
            .eq('post_id', postId)
            .eq('user_heq('post_id', postId)
            .eq('user_hubisubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        likedPosts.add(postId);
        btn.classList.addoccer_id', currentProfile.hubisoccer_id);
    } else {
        likedPosts.add(postId);
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart action-icon';
        if (post('liked');
        btn.querySelector('i').className = 'fas fa-heart action-icon';
        if) post.likes_count = (post.likes_count || 0) + 1;
        await sb (post) post.likes_count = (post.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_likes').insert.from('supabaseAuthPrive_post_likes').insert({
           ({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
       
        });
        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from });
        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_h sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: postubisoccer_id,
                type: 'like',
                title: 'Nouveau J\'aime',
               .author_hubisoccer_id,
                type: 'like',
                title: 'Nouveau J\'aime',
                message: `${currentProfile.full_name || currentProfile.display_name message: `${currentProfile.full_name || currentProfile.display_name} a} a aimé votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            aimé votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
 });
        }
    }
    if (countEl) countEl.textContent = post?.lik            });
        }
    }
    if (countEl) countEl.textContent = postes_count || 0;
    await sb.from('supabaseAuthPrive_posts?.likes_count || 0;
    await sb.from('supabaseAuthPrive_posts').update({ likes_count: post?.likes_count || 0').update({ likes_count: post?.likes_count || 0 }).eq('id', postId }).eq('id', postId);
}

async function toggleDislike(postId, btn) {
    const isDis);
}

async function toggleDislike(postId, btn) {
    const isDisliked = dislikedPosts.has(postId);
    const postliked = dislikedPosts.has(postId);
    const post = posts = posts.find(p => p.id === postId);
    const countEl = document.getElementById(`dis.find(p => p.id === postId);
    const countEl = document.getElementById(`dislikeCount_${postId}`);

    if (isDisliked)likeCount_${postId}`);

    if (isDisliked) {
        dislikedPosts.delete(postId);
        btn {
        dislikedPosts.delete(postId);
        btn.classList.remove('disliked');
        btn.querySelector.classList.remove('disliked');
        btn.querySelector('i').className = 'far fa-heart-broken action('i').className = 'far fa-heart-broken action-icon-icon';
        if (post) post.dislikes_count = Math.max(0, (post.dislik';
        if (post) post.dislikes_count = Math.max(0, (post.dislikes_count || 1) - 1);
        await sb.fromes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_dislikes').delete()
            .eq('post_id', postId('supabaseAuthPrive_post_dislikes').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        disliked)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } elsePosts.add(postId);
        btn.classList.add('disliked');
        btn.querySelector(' {
        dislikedPosts.add(postId);
        btn.classList.add('disliked');
        btn.querySelector('i').i').className = 'fas fa-heart-broken action-icon';
        if (post)className = 'fas fa-heart-broken action-icon';
        if (post) post.dis post.dislikes_count = (post.dislikes_countlikes_count = (post.dislikes_count || 0) + 1;
        await sb.from('supabaseAuthPrive || 0) + 1;
        await sb.from('supabaseAuthPrive_post_dislikes').insert({
            post_id_post_dislikes').insert({
            post_id: postId,
            user_hubisoccer_id:: postId,
            user_hubisoccer_id: currentProfile.hub currentProfile.hubisoccer_id
        });
    }
    if (countEl) countEl.textContentisoccer_id
        });
    }
    if (countEl) countEl.textContent = post?.dislikes_count || 0;
    = post?.dislikes_count || 0 await sb.from('supabaseAuthPrive_posts').update({ dislikes;
    await sb.from('supabaseAuthPrive_posts').update({ dislikes_count: post?.dislikes_count || 0 })._count: post?.dislikes_count || 0 }).eq('eq('id', postId);
}

async function toggleSave(postId, btn) {
    const isSaved = savedid', postId);
}

async function toggleSave(postId, btn) {
    const isSaved = savedPosts.hasPosts.has(postId);
    if (isSaved) {
        savedPosts.delete(postId);
       (postId);
    if (isSaved) {
        savedPosts.delete(postId);
        btn.classList btn.classList.remove('saved');
        btn.querySelector('i').className = '.remove('saved');
        btn.querySelector('i').className = 'far fa-bookmark action-icon';
       far fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').delete await sb.from('supabase()
            .eq('post_id', postId)
            .eq('user_hubisoccer_idAuthPrive_saved_posts').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        toast('', currentProfile.hubisoccer_id);
        toast('Publication retPublication retirée', 'info');
    } else {
        savedPosts.add(postId);
       irée', 'info');
    } else {
        savedPosts.add(postId);
        btn.classList.add('saved');
        btn.querySelector('i btn.classList.add('saved');
        btn.querySelector('i').className').className = 'fas fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').insert({
            post = 'fas fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
       _id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
        toast('Publication enregistrée ✅', 'success');
    }
 toast('Publication enregistrée ✅', 'success');
    }
}

async function repostPost(postId) {
    const post = posts.find(p => p.id === postId);
   }

async function repostPost(postId) {
    const post = posts.find(p => p.id === postId if (!post) return;
    const { data: newPost, error } = await);
    if (!post) return;
    const { data: newPost, error } sb.from('supabaseAuthPrive_posts').insert({
        author_hubisoccer_id = await sb.from('supabaseAuthPrive_posts').insert({
        author_hubisoccer_id: currentProfile.hubisoccer_id,
       : currentProfile.hubisoccer_id,
        community_id: myCommunity?.id,
        content: post.content,
        media_url: post.media_url,
        community_id: myCommunity?.id,
        content: post.content,
        media_url: post.media_url,
        media_type: post media_type: post.media_type,
        reposted_from_id: postId
    }).select().single();
    if (error.media_type,
        reposted_from_id: postId
    }).select().single();
    if (error) {
        toast('Erreur repost', 'error');
        return) {
        toast('Erreur repost', 'error;
    }
    toast('Repost effectué ✅', 'success');
    posts.unshift(newPost);
    renderPosts();
    await');
        return;
    }
    toast('Repost effectué ✅', 'success');
    posts.unshift(newPost);
    renderPosts();
    await sb.from('supabaseAuthPrive_posts').update({ rep sb.from('supabaseAuthPrive_posts').update({ reposts_count: (post.reposts_count || 0) + 1 }).eq('id', postId);
}
// Finosts_count: (post.reposts_count || 0) + 1 }).eq('id', postId);
}
// Fin interactions

// Début commentaires
async function toggleComments(postId, btn) {
    const section = document.getElementById(`comments interactions

// Début commentaires
async function toggleComments(postId, btn) {
    const section = document.getElementById(`comments_${postId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block_${postId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postId);
    } else {
        section.style.display = 'none';
        await loadComments(postId);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId)';
    }
}

async function loadComments(postId) {
    const section = document.getElementById(`comments_${postId}`);
    const { data, {
    const section = document.getElementById(`comments_${postId}`);
    const { data, error } = await sb
        .from('supabaseAuthPrive_com error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('*, authorments')
        .select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('post:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('post_id', postId_id', postId)
        .is('parent_id', null)
        .order(')
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(created_at', { ascending: true })
        .limit(1010);

    if (error) { toast('Erreur commentaires', 'error);

    if (error) { toast('Erreur commentaires', 'error'); return; }

    section.innerHTML = `
        <div class="comments-list">
           '); return; }

    section.innerHTML = `
        <div class="comments-list ${(data || []).map(c => makeCommentHtml(c, postId)).join">
            ${(data || []).map(c => makeCommentHtml(c, postId)).join('')}
            ${(data || []).length === 10('')}
            ${(data || []).length === 10 ? `<div class="load-comments-btn" onclick="loadMore ? `<div class="load-comments-btn" onclick="loadMoreComments('${postId}')">VoirComments('${postId}')">Voir plus de commentaires</div plus de commentaires</div>` : ''}
        </div>
       >` : ''}
        </div>
        <div class="comment-input-row">
            <div class="comment-input-avatar <div class="comment-input-row">
            <div class="comment-input-avatar-initials">${getInitials(currentProfile.full_name-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
            <img class=" || currentProfile.display_name)}</div>
            <img class="comment-inputcomment-input-avatar" src="${currentProfile.avatar_url || '../../img/user-default.jpg'}" alt=""
                style="display:-avatar" src="${currentProfile.avatar_url || '../../img/user-default.jpg'}" alt=""
               ${currentProfile.avatar_url ? 'block' : 'none'};"
                onerror="this.style style="display:${currentProfile.avatar_url ? 'block' : 'none'};"
                onerror="this.style.display='none';this.previousElementSibling.style.display='flex';">
           .display='none';this.previousElementSibling.style.display='flex';">
            <div class="comment-input-wrap">
                <textarea class="comment-input" id="comment <div class="comment-input-wrap">
                <textarea class="comment-input" id="commentInput_${postId}" rows="1"
                    placeholder="Écrire un commentaire..." style="resize:none;maxInput_${postId}" rows="1"
                    placeholder="Écrire un commentaire..." style="resize:none;max-height:80px"></textarea>
                <button class="comment-send-btn" onclick-height:80px"></textarea>
                <button class="comment-send-btn" onclick="sendComment('${postId}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
       ="sendComment('${postId}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    const ta = document.getElementById(`commentInput_${postId </div>
    `;

    const ta = document.getElementById(`commentInput_${postId}`);
    ta?.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight,}`);
    ta?.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
    });
    ta?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey 80) + 'px';
    });
    ta?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            sendComment(postId);
        }
    });
}

function makeCommentHtml(c, postId) {
            e.preventDefault();
            sendComment(postId);
        }
    });
}

function makeCommentHtml(c {
    const author = c.author || {};
    const authorName = author.full_name || author.display_name ||, postId) {
    const author = c.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorRole = author. 'Utilisateur';
    const authorRole = author.role_coderole_code || '';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    const isOwn = c.author || '';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    const isOwn = c.author_hub_hubisoccer_id === currentProfile.hubisoccer_id;

    return `
        <div class="comment-item" id="commentisoccer_id === currentProfile.hubisoccer_id;

    return `
        <div class="comment-item" id="comment_${c.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('_${c.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('${c.author_h${c.author_hubisoccer_id}')"
                style="display:${avatarUrl ?ubisoccer_id}')"
                style="display:${avatarUrl ? 'none' : 'flex'};">
                ${initials 'none' : 'flex'};">
                ${initials}
            </div>
            <img class="comment-avatar" src="${avatarUrl || '../../img/user-default.jpg'}"
                alt="" onclick="}
            </div>
            <img class="comment-avatar" src="${avatarUrl || '../../img/user-default.jpg'}"
                alt=""openUserProfile('${c.author_hubisoccer_id}')"
                onerror="this.style.display='none';this.previous onclick="openUserProfile('${c.author_hubisoccer_id}')"
                onerror="this.style.display='none';this.previousElementSibling.style.display='flex';"
                style="display:ElementSibling.style.display='flex';"
                style="display:${avatarUrl ? 'block' : 'none'};">
            <div>
                <div class="comment-b${avatarUrl ? 'block' : 'none'};">
            <div>
                <div class="comment-bubbleubble">
                    <div class="comment-author">
                        ${escapeHtml(authorName)}
                        ${authorRole ? `<span class="cm-role">
                    <div class="comment-author">
                        ${escapeHtml(authorName)}
                        ${authorRole ? `<span class="cm-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    </div>
                    <div class="comment-text">-badge">${escapeHtml(authorRole)}</span>` : ''}
                    </div>
                    <div class="comment${formatText(c.content)}</div>
                    ${c.media_url ? `
                        <div class="comment-media">
                           -text">${formatText(c.content)}</div>
                    ${c.media_url ? `
                        <div class="comment-media">
                            <img src="${c.media_url}" alt="" onclick="openMediaZoom('${c. <img src="${c.media_url}" alt="" onclick="openMediaZoom('${c.media_url}','image')">
                        </div>
                    ` : ''}
                    ${c.audio_url ? `
                        <div class="commentmedia_url}','image')">
                        </div>
                    ` : ''}
                    ${c.audio_url ? `
                        <div class="comment-audio">
                           -audio">
                            <audio controls src="${c.audio_url}"></audio>
                        </div <audio controls src="${c.audio_url}"></audio>
                        </div>
                    ` : ''}
                </div>
                <div class="comment>
                    ` : ''}
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn ${c.liked_by_me ? 'liked' : ''}"-actions">
                    <button class="comment-action-btn ${c.liked_by_me ? 'liked' : ''}" onclick="likeComment('${c.id}', this)">
                        <i class="fa${c.liked_by_me ? 's' : 'r'} fa-heart"></i onclick="likeComment('${c.id}', this)">
                        <i class="fa${c.liked_by_me ? 's' : 'r'} fa-heart"></i>
                        <span id="cmLike_${c.id}">${c.likes_count>
                        <span id="cmLike_${c.id}">${c.likes_count || 0}</span>
                    </button>
                    <button class="comment-action-btn" onclick="openReplyModal('${c.id}', '${post || 0}</span>
                    </button>
                    <button class="comment-action-btn" onclick="openReplyModal('${c.id}', '${postId}')">
                        <i class="fas fa-reId}')">
                        <i class="fas fa-reply"></i>ply"></i> Répondre
                    </button>
                    ${isOwn ? `
                        <button class="comment-action-btn" style="color:var Répondre
                    </button>
                    ${isOwn ? `
                        <button class="comment-action-btn" style="color:var(--danger)" onclick="deleteComment('${c.id}', '${postId}')">
                            <i class="fas fa-trash-alt"></(--danger)" onclick="deleteComment('${c.id}', '${postId}')">
                            <i class="fas fa-trash-alt"></i>i> Supprimer
                        </button>
                    ` Supprimer
                        </button>
                    ` : ''}
                    <span class="comment-time : ''}
                    <span class="comment-time">${timeSince(c.created_at)}</span>
                   ">${timeSince(c.created_at)}</span ${c.edited ?>
                    ${c.edited ? '<span class="cm-edited '<span class="cm-edited">(modifié">(modifié)</span>' : ''}
               )</span>' : '' </div>
                <div class="cm}
                </div>
                <div class="cm-replies-replies" id="replies_${c.id}"></div>
                <div id="" id="replies_${c.id}"></div>
                <div id="replyCompose_${c.id}"replyCompose_${c.id}" style="display:none; margin-top style="display:none; margin-top:8:8px;">
                    <div class="cmpx;">
                    <div class="cm-reply-compose">
                        <div-reply-compose">
                        class="comment-avatar-initials">${getInitial <div class="comment-avatar-initials">${getInitials(currentProfile.full_name || currentProfiles(currentProfile.full_name || currentProfile.display_name)}</div>
                       .display_name)}</div>
                        <img src="${currentProfile.avatar_url <img src="${currentProfile.avatar_url || '../../img/user-default.jpg'}" alt=""
                            || '../../img/user-default.jpg'}" alt=""
                            style="display:${currentProfile.avatar_url ? 'block' : ' style="display:${currentProfile.avatar_url ? 'block' : 'none'}; width:26px;height:26px;border-radius:50%;">
                        <textarea rows="1" id="none'}; width:26px;height:26px;border-radius:50%;">
                        <textarea rows="1" id="replyInput_${c.id}" placeholder="Répondre à ${escapeHtml(authorName)}..."></textareareplyInput_${c.id}" placeholder="Répondre à ${escapeHtml(authorName)}..."></textarea>
                        <button onclick="sendReply('${c.id}', '${postId}')>
                        <button onclick="sendReply('${c.id}', '${"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `postId}')"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
;
}

async function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    const content =}

async function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    const input?.value.trim();
    if (!content && !mediaFile) return;
    input.value = '';
    content = input?.value.trim();
    if (!content && !mediaFile) return;
    input.value = '';
    input.style.height = 'auto';

    const btn = document.querySelector(`#comments input.style.height = 'auto';

    const btn = document.querySelector(`#comments_${postId} .comment-send-btn`);
    btn.disabled = true;
    btn_${postId} .comment-send-btn`);
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        let mediaUrl = null;
        if (.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        let mediaUrl = null;
        if (mediaFile) {
            const ext = mediaFile.name.splitmediaFile) {
            const ext = mediaFile.name.split('.').pop();
            const path = `comments/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error('.').pop();
            const path = `comments/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (!upErr) {
                const { data: url: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').Data } = sb.storage.from('post_media').getPublicUrl(path);
                mediaUrl = urlData.publicUrl;
            }
            mediaFile = nullgetPublicUrl(path);
                mediaUrl = urlData.publicUrl;
            }
            mediaFile = null;
            document.getElementById;
            document.getElementById('mediaPreview').style.display = 'none';
        }

        const { data, error } = await sb.from('supabase('mediaPreview').style.display = 'none';
        }

        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: postIdAuthPrive_comments').insert({
            post_id: postId,
           ,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl,
            parent_id author_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl,
            parent_id: null
        }).select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').: null
        }).select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        const list = document.querySelectorsingle();

        if (error) throw error;

        const list = document.querySelector(`#comments_${postId} .comments-list`);
        if (list) list.insertAdj(`#comments_${postId} .comments-list`);
        if (list) list.insertAdjacentHTML('beforeend', makeCommentHtml(data, postId));

        const post =acentHTML('beforeend', makeCommentHtml(data, postId));

        const post = posts.find(p => p.id === postId);
        if (post) post.comments posts.find(p => p.id === postId);
        if (post) post.comments_count = (post.comments_count || 0_count = (post.comments_count || 0) + 1;
        await sb.from('supabaseAuthPrive_p) + 1;
        await sb.from('supabaseAuthPrive_posts').update({ comments_countosts').update({ comments_count: post?.comments_count || 0 }).eq('id', postId);

        if (post && post.author_h: post?.comments_count || 0 }).eq('id', postId);

        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            awaitubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubis sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubisoccer_id,
                type: 'comment',
                title: 'Nouveau commentaire',
                message: `${currentoccer_id,
                type: 'comment',
                title: 'Nouveau commentaire',
                message: `${currentProfile.full_name || currentProfile.display_nameProfile.full_name || currentProfile.display_name} a commenté votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }
    } catch (err) {
        toast('Erre} a commenté votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }
    } catch (err) {
        toast('Erreur enur envoi commentaire : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<ivoi commentaire : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function likeComment(commentId, btn) {
    const liked = class="fas fa-paper-plane"></i>';
    }
}

async function likeComment(commentId, btn) {
    const btn.classList.contains('liked');
    const countEl = btn.querySelector('span');
    const comment = comments.find(c => c.id === commentId);
    liked = btn.classList.contains('liked');
    const countEl = btn.querySelector('span');
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (liked) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart';
        if (countEl if (!comment) return;

    if (liked) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart';
        if (countEl) countEl.text) countEl.textContent = Math.max(0, (comment.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete()
            .eq('comment_id',Content = Math.max(0, (comment.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete()
            .eq('comment_id', commentId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id commentId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas);
    } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart';
        if (countEl) countEl.textContent = (comment.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive fa-heart';
        if (countEl) countEl.textContent = (comment.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_comment_likes').insert({
            comment_id: commentId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
    }
    const newLikes =_comment_likes').insert({
            comment_id: commentId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
    }
    const newLikes = parseInt(countEl?.textContent || '0');
    comment.likes_count = newLikes;
    await sb.from('supabaseAuthPrive_comments').update parseInt(countEl?.textContent || '0');
    comment.likes_count = newLikes;
    await sb.from('supabaseAuthPrive_comments').update({ likes_count: newLikes }).eq('id', commentId);
}

async function deleteComment(commentId, postId) {
    if (!confirm({ likes_count: newLikes }).eq('id', commentId);
}

async function('Supprimer ce commentaire ?')) return;
    await sb.from('supabaseAuthPrive_comments').delete().eq('id', deleteComment(commentId, postId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await sb.from('supabaseAuthPrive_comments').delete().eq('id', commentId);
    document.getElementById(`comment_${commentId}`)?.remove();
    commentId);
    document.getElementById(`comment_${commentId}`)?.remove();
    const post = posts.find(p => p.id === postId);
    if (post) post.comments_count = Math.max(0, (post const post = posts.find(p => p.id === postId);
    if (post) post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
    await sb.from('supabaseAuthPrive_p.comments_count || 1) - 1);
    await sb.from('supabaseAuthPrive_posts').update({ comments_count: post?.comments_count || 0 }).eq('id', postId);
    toast('Commentaire suppriméosts').update({ comments_count: post?.comments_count || 0 }).eq('id', postId);
    toast('Commentaire supprimé', 'success');
}

async function openReplyModal(commentId, postId) {
    replyCommentId = comment', 'success');
}

async function openReplyModal(commentId, postId) {
    replyCommentId = commentId;
    replyPostId = postId;
    const c = document.querySelector(`#comment_${commentId} .comment-text`);
    document.getElementById('originalCommentQuote').Id;
    replyPostId = postId;
    const c = document.querySelector(`#comment_${commentId} .comment-text`);
    document.getElementById('originalCommentQuote').textContent = c?.textContent?.substring(0, 80) ||textContent = c?.textContent?.substring(0, 80) '';
    document.getElementById('replyContent').value = '';
    openModal('modalReply');
}

async function sendReply(commentId, postId) || '';
    document.getElementById('replyContent').value = '';
    openModal('modalReply');
}

async function sendReply(commentId, postId) {
    const input = document.getElementById(`replyInput_${commentId}`);
    const content = input?. {
    const input = document.getElementById(`replyInput_${commentId}`);
    const content = input?.value.trimvalue.trim();
    if (!content) return;
    input.value = '';

    const { data, error } = await sb.from('supabaseAuthPrive_com();
    if (!content) return;
    input.value = '';

    const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
        post_id: postId,
        author_hubisoccer_id: currentProfile.hubisments').insert({
        post_id: postId,
        author_hubisoccer_id: currentoccer_id,
        content,
        parent_id: commentId
    }).select('*, author:author_hubisoccer_id(full_name,Profile.hubisoccer_id,
        content,
        parent_id: commentId
    }).select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

    if (error) { toast('Erreur envoi display_name, avatar_url, role_code)').single();

    if (error) { toast('Erreur envoi réponse', 'error'); return; }

    const repliesContainer = document.getElementById(`replies_${commentId}`);
    if (repliesContainer) {
        repliesContainer.insertAdjacentHTML('beforeend', réponse', 'error'); return; }

    const repliesContainer = document.getElementById(`replies_${commentId}`);
    if (repliesContainer) {
        repliesContainer.insertAdjacentHTML('beforeend', makeReplyCard(data));
    }
    document.getElementById(`replyCompose_${commentId}`).style.display = 'none';

    const parentComment makeReplyCard(data));
    }
    document.getElementById(`replyCompose_${commentId}`).style.display = 'none';

    const = comments.find(c => c.id === commentId);
    if (parentComment && parentComment.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
        parentComment = comments.find(c => c.id === commentId);
    if (parentComment && parentComment.author_hubisoccer_id !== currentProfile.hubisoccer_id) await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: parentComment.author_hubisoccer_id,
            type: {
        await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: parentComment.author_hubisoccer_id,
            type: 'reply',
            title: 'Nouvelle réponse',
            message: `${currentProfile.full_name || currentProfile.display_name} a répondu à votre commentaire.`,
            data 'reply',
            title: 'Nouvelle réponse',
            message: `${currentProfile.full_name || currentProfile.display_name} a répondu à votre commentaire.`,
            data: {: { link: `post-view.html?id=${postId}` }
        });
    }
    toast('Réponse envoyée ✅', 'success');
}

function makeReplyCard(r) {
    const link: `post-view.html?id=${postId}` }
        });
    }
    toast('Réponse envoyée ✅', 'success');
}

function makeReplyCard(r) {
    const author = r.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const avatarUrl = author author = r.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(a.avatar_url;
    const initials = getInitials(authorName);
    return `
        <div class="cm-reply-card" id="cm_${r.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'none' : 'flex'}; width:28px;height:28px;font-size:0.7rem;">
                ${initials}
            </divuthorName);
    return `
        <div class="cm-reply-card" id="cm_${r.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'none' : 'flex'}; width:28px;height:28px;font-size:0.7rem;">
                ${initials}
            </div>
            <img class>
            <img class="cm-reply-avatar" src="${avatarUrl || '../../img/user-default.jpg'}"
                alt="" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                onerror="this.style.display='none';this.previousElementSibling.style.display='flex';"
                style="display:${avatarUrl ? 'block' : 'none'};">
            <div class="cm-reply-bubble">
                <div class="cm-reply-author">${escapeHtml(authorName)}</div>
                <div class="cm-reply-text">${formatText(r.content)}</div>
                <div class="cm-footer">
                    <button class="cm-action="cm-reply-avatar" src="${avatarUrl || '../../img/user-default.jpg'}"
                alt="" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                onerror="this.style.display='none';this.previousElementSibling.style.display='flex';"
                style="display:${avatarUrl ? 'block' : 'none'};">
            <div class="cm-reply-bubble">
                <div class="cm-reply-author">${escapeHtml(authorName)}</div>
                <div class="cm-reply-text">${formatText(r.content)}</div>
                <div class="cm-footer">
                    <button class="cm-action-btn" onclick="likeComment('${r.id}', this)">
                        <i class="far fa-heart"></i> ${r.likes_count || 0}
                    </button>
                    <span class="cm-time">${time-btn" onclick="likeComment('${r.id}', this)">
                        <i class="far fa-heart"></i> ${r.likes_count || 0}
                    </button>
                    <span class="cm-time">${timeSince(r.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadMoreComments(postId) {
    toast('Chargement des commentaires supplémentaires...', 'info');
}
// Fin commentaires

// Début autres fonctions (publish, vote, storiesSince(r.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadMoreComments(postId) {
    toast('Chargement des commentaires supplémentaires...', 'info');
}
// Fin commentaires

// Début autres fonctions (publish, vote, stories, suggestions, lives, etc.)
async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaFile && !pendingPoll && !pendingEvent) {
        toast('Écris quelque chose avant de publier', 'warning');
        return;
    }

    const btn, suggestions, lives, etc.)
async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaFile && !pendingPoll && !pendingEvent) {
        toast('Écris quelque chose avant de publier', 'warning');
        return;
    }

    const btn = document = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
        let mediaUrl = null, mediaType = null;
        if (mediaFile) {
            const ext = mediaFile.name.split('.').pop();
            const path = `posts/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
            mediaFile = null;
            document.getElementById('mediaPreview').style.display = 'none';
        }

        const postData = {
            author.getElementById('publishBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
        let mediaUrl = null, mediaType = null;
        if (mediaFile) {
            const ext = mediaFile.name.split('.').pop();
            const path = `posts/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
            mediaFile = null;
            document.getElementById('mediaPreview').style.display = 'none';
        }

        const postData = {
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            community_id: myCommunity?.id || null,
            content: content || null,
            media_url: mediaUrl,
            media_type: mediaType,
            poll_data: pendingPoll || null,
            event_data: pendingEvent || null,
            is_pinned: pinPostActive,
            is_scheduled: !!scheduledAt,
           _hubisoccer_id: currentProfile.hubisoccer_id,
            community_id: myCommunity?.id || null,
            content: content || null,
            media_url: mediaUrl,
            media_type: mediaType,
            poll_data: pendingPoll || null,
            event_data: pendingEvent || null,
            is_pinned: pinPostActive,
            is_scheduled: !!scheduledAt,
            scheduled_at: scheduledAt || null,
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            shares_count: 0,
            reposts_count: 0,
            views_count: 0
        };

        const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert(postData)
            .select('*, author:author_hubis scheduled_at: scheduledAt || null,
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            shares_count: 0,
            reposts_count: 0,
            views_count: 0
        };

        const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert(postData)
            .select('*, author:author_hubisoccer_id(full_name, display_name, avatar_url, role_code, feed_id, certified)')
            .single();
        if (error) throw error;

        if (myCommunity) {
            await sb.from('supabaseAuthPrive_communities')
                .update({ posts_count: (myCommunity.posts_count || 0) + 1 })
               occer_id(full_name, display_name, avatar_url, role_code, feed_id, certified)')
            .single();
        if (error) throw error;

        if (myCommunity) {
            await sb.from('supabaseAuthPrive_communities')
                .update({ posts_count: (myCommunity.posts_count || 0) + 1 })
                .eq('id', myCommunity.id);
            document.getElementById('myCommPosts').textContent = (myCommunity.posts_count || 0) + 1;
            myCommunity.posts_count = (myCommunity.posts_count || 0) + 1;
        }

        document.getElementById('postContent').value = '';
        pendingPoll = null;
        pendingEvent = null;
        scheduledAt = null;
        pinPostActive = false;

        if (!scheduledAt) {
            posts.unshift(newPost .eq('id', myCommunity.id);
            document.getElementById('myCommPosts').textContent = (myCommunity.posts_count || 0) + 1;
            myCommunity.posts_count = (myCommunity.posts_count || 0) + 1;
        }

        document.getElementById('postContent').value = '';
        pendingPoll = null;
        pendingEvent = null;
        scheduledAt = null;
        pinPostActive = false;

        if (!scheduledAt) {
            posts.unshift(newPost);
            renderPosts();
            toast('Publication réussie ! 🎉', 'success');
        } else {
            toast('Publication programmée ✅', 'success');
        }
    } catch (err) {
        console.error('Erreur publication:', err);
        toast(');
            renderPosts();
            toast('Publication réussie ! 🎉', 'success');
        } else {
            toast('Publication programmée ✅', 'success');
        }
    } catch (err) {
        console.error('Erreur publication:', err);
        toast('Erreur lors de la publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
    }
}

async function votePoll(postId,Erreur lors de la publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
    }
}

async function votePoll(postId, optionIdx) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll_data) return;
    const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    if optionIdx) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll_data) return;
    const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    if (poll.voted_by?.includes(currentProfile.hubisoccer_id)) return;

    poll.votes = poll.votes || {};
    poll.votes[optionIdx] = (poll.votes[optionIdx] || 0) +  (poll.voted_by?.includes(currentProfile.hubisoccer_id)) return;

    poll.votes = poll.votes || {};
    poll.votes[optionIdx] = (poll.votes[optionIdx] || 0) + 1;
    poll.voted_by = [...(poll.voted_by || []), currentProfile.hubisoccer_id];
    poll.my_vote = optionIdx;
    post.poll_data1;
    poll.voted_by = [...(poll.voted_by || []), currentProfile.hubisoccer_id];
    poll.my_vote = optionIdx;
    post.poll_data = poll;

    await sb.from('supabaseAuthPrive_posts').update({ poll_data: poll }).eq('id', postId);
    renderPosts();
}

function togglePostMenu(btn, postId, isOwn) {
    const menu = poll;

    await sb.from('supabaseAuthPrive_posts').update({ poll_data: poll }).eq('id', postId);
    renderPosts();
}

function togglePostMenu(btn, postId, isOwn) {
    const menu = document.getElementById(`menu_${postId}`);
    document.querySelectorAll('.post-dropdown.show').forEach(m => { if (m !== menu) m.classList.remove('show'); });
    menu?.classList = document.getElementById(`menu_${postId}`);
    document.querySelectorAll('.post-dropdown.show').forEach(m => { if (m !== menu) m.classList.remove('show'); });
    menu?.classList.toggle.toggle('show');
    document.addEventListener('click', () => menu?.classList.remove('show'), { once: true });
}

function expandPost(postId) {
    const el = document.getElementById(`txt('show');
    document.addEventListener('click', () => menu?.classList.remove('show'), { once: true });
}

function expandPost(postId) {
    const el = document.getElementById(`txt_${postId}`);
    if (el) { el.classList.remove('collapsed'); el.querySelector('.post-see-more')?.remove(); }
}

async function editPost_${postId}`);
    if (el) { el.classList.remove('collapsed'); el.querySelector('.post-see-more')?.remove(); }
}

async function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newContent = prompt('Modifier la publication :', post.content || '');
    if (newContent === null) return(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newContent = prompt('Modifier la publication :', post.content || '');
    if (newContent === null) return;
    await sb.from('supabaseAuthPrive_posts').update({ content: newContent, edited: true }).eq('id', postId);
    post.content = newContent;
    post.ed;
    await sb.from('supabaseAuthPrive_posts').update({ content: newContent, edited: true }).eq('id', postId);
    post.content = newContent;
    post.edited = true;
    renderPosts();
    toast('Publication modifiée ✅', 'success');
}

async function deletePost(postId) {
    if (!confirm('Supprimer cette publication ?ited = true;
    renderPosts();
    toast('Publication modifiée ✅', 'success');
}

async function deletePost(postId) {
    if (!confirm('Supprimer cette publication ?')) return;
    await sb.from('supabaseAuthPrive_posts').delete().eq('id', postId);
    posts =')) return;
    await sb.from('supabaseAuthPrive_posts').delete().eq('id', postId);
    posts = posts.filter(p => p.id !== postId);
    renderPosts();
    toast('Publication supprimée', 'success');
}

function openShareModal posts.filter(p => p.id !== postId);
    renderPosts();
    toast('Publication supprimée', 'success');
}

function openShareModal(postId)(postId) {
    currentSharePostId = postId;
    openModal('modalShare');
}

function sharePost(network) {
    const post = posts.find(p => p.id === {
    currentSharePostId = postId;
    openModal('modalShare');
}

function sharePost(network) {
    const post = posts.find(p => p.id === currentSharePostId);
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentSharePostId}`;
    const text currentSharePostId);
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentSharePostId}`;
    const text = post?.content?.substring(0, 100) || '';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/s = post?.content?.substring(0, 100) || '';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharerharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === 'copy')`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === ' {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
    } else {
        window.open(shareUrls[network], '_blank');
    }
    closeModal('modalSharecopy') {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
    } else {
        window.open(shareUrls[network], '_blank');
    }
    closeModal('modalShare');
    sb.from('supabaseAuthPrive_posts').update({ shares_count: (post?.shares_count || 0) + 1 }).eq('id', currentSharePostId);
}

function openReportModal(postId)');
    sb.from('supabaseAuthPrive_posts').update({ shares_count: (post?.shares_count || 0) + 1 }).eq('id', currentSharePostId);
}

function openReportModal(postId) {
    currentReportPostId = postId;
    document.getElementById('reportReason').value = '';
    openModal('modalReport');
}

async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim {
    currentReportPostId = postId;
    document.getElementById('reportReason').value = '';
    openModal('modalReport');
}

async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
   ();
    if (!reason) { toast('Écris la raison', 'warning'); return; }
    await sb.from('supabaseAuthPrive_reports').insert({
        post_id: currentReportPostId,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason
    });
    closeModal(' if (!reason) { toast('Écris la raison', 'warning'); return; }
    await sb.from('supabaseAuthPrive_reports').insert({
        post_id: currentReportPostId,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason
    });
    closemodalReport');
    toast('Signalement envoyé. Merci !', 'success');
}

function openBlockModal(userId) {
    currentBlockUserId = userId;
    openModal('modalBlock');
}

async function confirmBlock() {
    await sb.from('supabaseAuthPrive_blocked_users').insert({
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        blocked_hubisoccer_id: currentBlockUserId
    });
    closeModal('Modal('modalReport');
    toast('Signalement envoyé. Merci !', 'success');
}

function openBlockModal(userId) {
    currentBlockUserId = userId;
    openModal('modalBlock');
}

async function confirmBlock() {
    await sb.from('supabaseAuthPrive_blocked_users').insert({
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        blocked_hubisoccer_id: currentBlockUserId
    });
    closemodalBlock');
    toast('Utilisateur bloqué', 'success');
    posts = posts.filter(p => p.author_hubisoccer_id !== currentBlockUserId);
    renderPosts();
}

async function hidePost(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts').insert({
        post_id: postId,
        user_hubisoccer_id: currentProfile.hubisoccer_id
    });
    posts = posts.filter(p => p.id !== postModal('modalBlock');
    toast('Utilisateur bloqué', 'success');
    posts = posts.filter(p => p.author_hubisoccer_id !== currentBlockUserId);
    renderPosts();
}

async function hidePost(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts').insert({
        post_id: postId,
        user_hubisoccer_id: currentProfile.hubisoccer_id
    });
    posts = posts.filter(p => p.id !== postId);
    renderPosts();
    toast('Publication masquée', 'info');
}

async function openUserProfile(userId) {
    window.location.href = `profil-feed.html?id=${userId}`Id);
    renderPosts();
    toast('Publication masquée', 'info');
}

async function openUserProfile(userId) {
    window.location.href = `profil-feed.html?id=${userId}`;
}

function openUserByHandle(handle) {
    window.location.href = `profil-feed.html?handle=${handle}`;
}

function searchByHashtag(tag) {
    document.getElementById('feedSearch').value = '#' + tag;
    searchQuery = '#' + tag;
    loadPosts(true);
}

function open;
}

function openUserByHandle(handle) {
    window.location.href = `profil-feed.html?handle=${handle}`;
}

function searchByHashtag(tag) {
    document.getElementById('feedSearch').value = '#' + tag;
    searchQuery = '#' + tag;
    loadPosts(true);
MediaModal(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video'
        ? `<video src="${url}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px"></video}

function openMediaModal(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video'
        ? `<video src="${url}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px"></video>`
        : `<img src="${url}" alt="" style="max-width:90vw;max-height:80vh;border-radius:8px">`;
    openModal('modal>`
        : `<img src="${url}" alt="" style="max-width:90vw;max-height:80vh;border-radius:8px">`;
    openModal('modalMedia');
}

// Fonctions stories
async function loadStories() {
    document.getElementById('storiesContainer').innerHTML = '';
Media');
}

// Fonctions stories
async function loadStories() {
    document.getElementById('storiesContainer').innerHTML = '';
}

async function uploadStory() {
    const file = document.getElementById('storyFileInput}

async function uploadStory() {
    const file = document.getElementById('storyFileInput').files[0];
    if (!file) { toast('Sélectionne un fichier', 'warning'); return; }
    toast('Story publiée ! ✅', 'success');
    closeModal('modalStoryUpload');
}

function closeStory() {
    document.getElementById('storyModal').classList.remove('').files[0];
    if (!file) { toast('Sélectionne un fichier', 'warning'); return; }
    toast('Story publiée ! ✅', 'success');
    closeModal('modalshow');
}

function prevStory() {}
function nextStory() {}

// Fonctions lives
async function loadLives() {
    document.getElementById('livesList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live enStoryUpload');
}

function closeStory() {
    document.getElementById('storyModal').classList.remove('show');
}

function prevStory() {}
function nextStory() {}

// Fonctions lives
async function loadLives() {
    document.getElementById('livesList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live en ce moment</p>';
}

// Fonctions suggestions
async function loadSuggestions() {
    document ce moment</p>';
}

// Fonctions suggestions
async function loadSuggestions() {
    document.getElementById('suggestionsList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune suggestion</p.getElementById('suggestionsList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune suggestion</p>';
}

//>';
}

// Fonctions followers
async function loadFollowers() {
    document.getElementById('followersList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore Fonctions followers
async function loadFollowers() {
    document.getElementById('followersList').innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
}

// Fonctions tendances
async function loadTrends() {
    document.getElementById('trendsList').innerHTML = '<p style=" d\'abonnés</p>';
}

// Fonctions tendances
async function loadTrends() {
    document.getElementById('trendsList').innerHTML = '<pfont-size:0.78rem;color:var(--gray);">Aucune tendance</p>';
}

// Fonctions notifications
async function loadNotifications() {
    const { data } = await style="font-size:0.78rem;color:var(--gray);">Aucune tendance</p>';
}

// Fonctions notifications
async function loadNotifications() {
    const { data } = await sb.from('supabaseAuthPrive_notifications')
        .select('*', { count: 'exact', head: false })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer sb.from('supabaseAuthPrive_notifications')
        .select('*', { count: 'exact', head: false })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

    const badge = document.getElementById('notifBadge_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = data?.length || 0;
        badge.style.display =');
    if (badge) {
        badge.textContent = data?.length || 0;
        badge.style.display = (data?.length || 0) > 0 ? 'block' : 'none';
    }
}

async function markAllNotifsRead() {
    await sb.from(' (data?.length || 0) > 0 ? 'block' : 'none';
    }
}

async function markAllNotifsRead() {
    await sb.from('supabasesupabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('AuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false);
    loadNotifications();
    toast('Toutes les notifications lues', 'success');
}

// Déconnexion
async function logout() {
    await sbread', false);
    loadNotifications();
    toast('Toutes les notifications lues', 'success');
}

// Déconnexion
async function logout() {
    await sb.auth.signOut();
    window.location.href = '../../authprive/users/login.html';
}

// Initialisation
async function init() {
    const.auth.signOut();
    window.location.href = '../../authprive/users/login.html';
}

// Initialisation
async function init() {
    const user = await checkSession();
    if (!user) return;

    setLoader(true, 'Chargement user = await checkSession();
    if (!user) return;

    setLoader(true, 'Chargement du profil...', 20);
    await loadProfile();

    setLoader(true, 'Vérification de ta communauté...', 40 du profil...', 20);
    await loadProfile();

    setLoader(true, 'Vérification de ta communauté...', 40);
    const comm = await loadMyCommunity();
    if (!comm) return;

    setLoader(true, 'Chargement du feed...', 60);
    await loadPosts(true);

    setLoader(true,);
    const comm = await loadMyCommunity();
    if (!comm) return;

    setLoader(true, 'Chargement du feed...', 60);
    await loadPosts(true);

    setLoader(true, 'Chargement de la communauté...', 80);
    await Promise.all([
        loadStories(),
        loadSuggestions(),
        loadFollowers 'Chargement de la communauté...', 80);
    await Promise.all([
        loadStories(),
        loadSuggestions(),
        loadFollowers(),
        loadLives(),
        loadTrends(),
        loadNotifications()
    ]);

    setLoader(false);
    subscribeToNewPosts();

    // Event listeners(),
        loadLives(),
        loadTrends(),
        loadNotifications()
    ]);

    setLoader(false);
    subscribeToNewPosts();

    // Event listeners
    document.getElementById('publishBtn').addEventListener('click', publishPost);
    document.getElementById('attachMediaBtn').addEventListener('
    document.getElementById('publishBtn').addEventListener('click', publishPost);
    document.getElementById('attachMediaBtn').addEventListener('click', () => document.getElementById('mediaInput').click());
    document.getElementById('mediaInput').addEventListener('change', (e) => {
        const file = eclick', () => document.getElementById('mediaInput').click());
    document.getElementById('mediaInput').addEventListener('change', (e) => {
        const file = e.target.f.target.files[0];
        if (!file) return;
        mediaFile = file;
        const url = URL.createObjectURL(fileiles[0];
        if (!file) return;
        mediaFile = file;
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        document.getElementById('mediaPreview').style.display = 'block';
        document.getElementById('media);
        const isVideo = file.type.startsWith('video/');
        document.getElementById('mediaPreview').style.display = 'block';
        document.getElementById('mediaPreview').Preview').innerHTML = `
            <div class="preview-media-wrap" style="position:relative">
                ${isVideo ? `<video src="${url}" controls></videoinnerHTML = `
            <div class="preview-media-wrap" style="position:relative">
                ${isVideo ? `<video src="${url}" controls></video>` :>` : `<img src="${url}" alt="">`}
                <button class="remove-media-btn" onclick="cancelMedia()"><i class="fas fa-times"></i></ `<img src="${url}" alt="">`}
                <button class="remove-media-btn" onclick="cancelMedia()"><i class="fas fa-times"></i></button>
            </div>`;
    });

    document.getElementById('pollBtn').addEventListener('click', () => openModal('modalPoll'));
    document.getElementById('eventBtn').addEventListener('click', () => openModal('modalbutton>
            </div>`;
    });

    document.getElementById('pollBtn').addEventListener('click', () => openModal('modalPoll'));
    document.getElementById('eventBtn').addEventListener('click', () => openModal('modalEvent'));
    document.getElementById('scheduleBtn').addEventListener('click', () => openModal('modalSchedule'));
    document.getElementById('startLiveBtn').addEventListener('click', () => window.location.href = 'live.html');
    document.getElementById('pinPostBtn').Event'));
    document.getElementById('scheduleBtn').addEventListener('click', () => openModal('modalSchedule'));
    document.getElementById('startLiveBtn').addEventListener('click', () => window.location.href = 'live.html');
    document.getElementById('pinPostaddEventListener('click', () => {
        pinPostActive = !pinPostActive;
        document.getElementById('pinPostBtn').style.background = pinPostActive ? 'var(--goldBtn').addEventListener('click', () => {
        pinPostActive = !pinPostActive;
        document.getElementById('pinPostBtn').style.background = pinPostActive ? 'var(--gold-light)' : '';
        toast(pinPostActive ? 'Post épinglé activé' : 'Épinglage désactivé', 'info');
    });
    document.getElementById-light)' : '';
        toast(pinPostActive ? 'Post épinglé activé' : 'Épinglage désactivé', 'info');
    });
    document.getElementById('previewPostBtn').addEventListener('click', showPreview);

    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('createEventBtn').('previewPostBtn').addEventListener('click', showPreview);

    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('createEventBtn').addEventListener('click', createEvent);
    document.getElementById('confirmScheduleBtn').addEventListener('click', confirmSchedule);

    document.getElementById('submitReportBtn').addEventListener('click', createEvent);
    document.getElementById('confirmScheduleBtn').addEventListener('click', confirmSchedule);

    document.getElementById('submitReportBtn').addEventListener('click', submitReport);
    document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlock);
    document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('clickaddEventListener('click', submitReport);
    document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlock);
    document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', ()', () => sharePost(btn.dataset.network)));

    document.getElementById('sendReplyBtn').addEventListener('click', () => sendReply(reply => sharePost(btn.dataset.network)));

    document.getElementById('sendReplyBtn').addEventListener('click', () => sendReply(replyCommentId, replyCommentId, replyPostId));

    document.getElementById('addStoryBtn').addEventListener('click', () => openModal('modalStoryUpload'));
    document.getElementById('uploadStoryBtn').addEventListener('click', uploadStory);
    document.getElementById('storyCloseBtnPostId));

    document.getElementById('addStoryBtn').addEventListener('click', () => openModal('modalStoryUpload'));
    document.getElementById('uploadStoryBtn').addEventListener('click', uploadStory);
    document.getElementById('storyCloseBtn').addEventListener('click', closeStory);
    document.getElementById('storyPrev').addEventListener('click', prevStory);
    document.getElementById('storyNext').addEventListener('click', nextStory);

    document.querySelectorAll('.').addEventListener('click', closeStory);
    document.getElementById('storyPrev').addEventListener('click', prevStory);
    document.getElementById('storyNext').addEventListener('click', nextStory);

    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            loadfeed-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            loadPosts(truePosts(true);
        });
    });

    document.querySelectorAll('.role-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active);
        });
    });

    document.querySelectorAll('.role-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeRoleFilter = chip.dataset.role;
            loadPosts(true);
        });
    });

    let searchTimer = null;
    document.getElementById('feedSearch').addEventListener(''));
            chip.classList.add('active');
            activeRoleFilter = chip.dataset.role;
            loadPosts(true);
        });
    });

    let searchTimer = null;
    document.getElementById('feedSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
           input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchQuery = e.target.value.trim();
            loadPosts(true);
        }, 500);
    searchQuery = e.target.value.trim();
            loadPosts(true);
        }, 500);
    });

    document.getElementById('loadMoreBtn').addEventListener('click', () => loadPosts(false));
    document.getElementById('newPostsBarBtn').addEventListener });

    document.getElementById('loadMoreBtn').addEventListener('click', () => loadPosts(false));
    document.getElementById('newPostsBarBtn').addEventListener('click', () => {
        newPostsCount = 0;
        document.getElementById('newPostsBar').style.display = 'none';
        loadPosts(true);
    });

    document.getElementById('notifBtn').add('click', () => {
        newPostsCount = 0;
        document.getElementById('newPostsBar').style.display = 'none';
        loadPosts(true);
    });

    document.getElementById('notifBtn').addEventListener('click', () => {
        openModal('modalNotifs');
        loadNotifications();
    });
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotifsRead);
    document.getElementById('refreshSuggestions').addEventListener('click', () => {
        openModal('modalNotifs');
        loadNotifications();
    });
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotifsRead);
    document.getElementById('refreshSuggestions').addEventListener('click', loadSuggestions);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    document.getElementById('userMenu').addEventListener('click', (e) => {
       EventListener('click', loadSuggestions);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSide e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('showbar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.style');
    });
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.style.display = rs.style.display === 'none' ? 'block' : 'none';
    });
    const close.display = rs.style.display === 'none' ? 'block' : 'none';
    });
    const closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (Sidebar);

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });
}

function cancelMedia() {
    mediaFile = null;
    document.getElementById('mediaInput').value = '';
   e) => { if (e.target === m) closeModal(m.id); });
    });
}

function cancelMedia() {
    mediaFile = null;
    document.getElementById('mediaInput').value = '';
    document.getElementById document.getElementById('mediaPreview').style.display = 'none';
}

function showPreview() {
    const content = document.getElementById('postContent').value.trim();
    document.getElementById('previewBody').innerHTML = `
       ('mediaPreview').style.display = 'none';
}

function showPreview() {
    const content = document.getElementById('postContent').value.trim();
    document.getElementById('previewBody').innerHTML = `
        <div <div class="post-card" style="box-shadow:none;border:none">
            <div class="post-header">
                <div class="post-avatar-initials">${getInitials(currentProfile class="post-card" style="box-shadow:none;border:none">
            <div class="post-header">
                <div class="post-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
                <div class="post-meta">
                    <div class="post-author">${escapeHtml(currentProfile.full_name || '')}</div>
                   .full_name || currentProfile.display_name)}</div>
                <div class="post-meta">
                    <div class="post-author">${escapeHtml(currentProfile.full_name || '')}</div>
                    <div class="post-author-sub"><span class="post-time">À l'instant</span></div>
                </div>
            </div>
            <div class="post-body"><div class="post-text">${formatText(content)}</div></div>
        </div>`;
    openModal('modalPreview <div class="post-author-sub"><span class="post-time">À l'instant</span></div>
                </div>
            </div>
            <div class="post-body"><div class="post-text">${formatText(content)}</div></div>
        </div>`;
    openModal('modalPreview');
}

function createPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const opts = document.getElementById('pollOptions').value.trim().split('\n').map(o => o.trim');
}

function createPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const opts = document.getElementById('pollOptions').value.trim().split('\n').map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) { toast('Question et au moins 2 options requises', '()).filter(Boolean);
    if (!q || opts.length < 2) { toast('Question et au moins 2 options requises', 'warning'); return; }
    const dur = parseInt(document.getElementById('pollDuration').value) || warning'); return; }
    const dur = parseInt(document.getElementById('pollDuration').value) || 3;
    pendingPoll = { question: q, options: opts, votes: {}, voted_by: [], ends_at3;
    pendingPoll = { question: q, options: opts, votes: {}, voted_by: [], ends_at: new Date(Date.now() + dur * 86400000).toISOString() };
    closeModal('modalPoll');
    toast('Sondage prêt. Publie maintenant !', 'success');
}

function createEvent() {
    const title = document.getElementById(': new Date(Date.now() + dur * 86400000).toISOString() };
    closeModal('modalPoll');
    toast('Sondage prêt. Publie maintenanteventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!title || !date) { toast('Titre et date requis !', 'success');
}

function createEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!title || !date) { toast('Titre et date requis', 'warning'); return; }
    pendingEvent = {
        title,
        date,
        location: document', 'warning'); return; }
    pendingEvent = {
        title,
        date,
        location: document.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDesc').value.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDesc').value.trim()
    };
    closeModal('modalEvent');
    toast('Événement prêt. Publie maintenant !', 'success');
.trim()
    };
    closeModal('modalEvent');
    toast('Événement prêt. Publie maintenant !', 'success');
}

function confirmSchedule() {
    const dt = document.getElementById('scheduleDateTime').value;
    if (!dt) { toast('Sélectionne une date', 'warning'); return; }
    scheduledAt = new Date(d}

function confirmSchedule() {
    const dt = document.getElementById('scheduleDateTime').value;
    if (!dt) { toast('Sélectionne une date', 'warning'); return; }
    scheduledAt = newt).toISOString();
    closeModal('modalSchedule');
    toast(`Publication programmée pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`, 'success');
}

async function saveProfile() {
    const name = document.getElementById Date(dt).toISOString();
    closeModal('modalSchedule');
    toast(`Publication programmée pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`, 'success');
}

async function saveProfile() {
    const name = document.getElementById('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    if (!name) { toast('Le nom est requis', 'warning'); return; }
    await sb.from('supabaseAuthPrive_communities').update('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    if (!name) { toast('Le nom est requis', 'warning'); return; }
    await sb.from('supabaseAuthPrive_communities({ name, bio }).eq('id', myCommunity.id);
    myCommunity.name = name;
    myCommunity.bio = bio;
    document.getElementById('myCommName').textContent = name;
    closeModal('modalEditProfile').update({ name, bio }).eq('id', myCommunity.id);
    myCommunity.name = name;
    myCommunity.bio = bio;
    document.getElementById('myCommName').textContent = name;
    closeModal('modalEditProfile');
    toast('Profil mis à jour ✅', 'success');
}

function subscribeToNewPosts() {
    feedSubscription = sb.channel('new_posts')
        .on('postgres_changes', {');
    toast('Profil mis à jour ✅', 'success');
}

function subscribeToNewPosts() {
    feedSubscription = event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_posts' }, async (payload) => {
            const msg = payload.new;
            if (msg.author_hubisoccer_id === currentProfile.hubisoccer_id) sb.channel('new_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_posts' }, async (payload) => {
            const msg = payload.new;
            if (msg.author_hubisoccer_id === currentProfile.hubisoccer_id) return;
            newPostsCount++;
            const bar = document.getElementById('newPostsBar');
            bar.style.display = 'block';
            document.getElementById('newPostsCount').textContent = newPostsCount;
        })
        return;
            newPostsCount++;
            const bar = document.getElementById('newPostsBar');
            bar.style.display = 'block';
            document.getElementById('newPostsCount').textContent = newPostsCount;
        })
        .subscribe();
 .subscribe();
}

// Exposer fonctions globales
window.openUserProfile = openUserProfile;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
window}

// Exposer fonctions globales
window.openUserProfile = openUserProfile;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
window.repostPost = repostPost;
window.toggleComments = toggleComments;
window.openShareModal = openShareModal;
window.openReportModal = openReportModal;
window.openBlockModal = openBlockModal;
window.repostPost = repostPost;
window.toggleComments = toggleComments;
window.openShareModal = openShareModal;
window.openReportModal = openReportModal;
window.openBlockModal = openBlockModal;
window.hidePost = hidePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.togglePostMenu = togglePostMenu;
window.expandPost = expandPost;
window.openReplyModal = openReplyModal;
window.likeComment = likeComment.hidePost = hidePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.togglePostMenu = togglePostMenu;
window.expandPost = expandPost;
window.openReplyModal = openReplyModal;
window.likeComment = likeComment;
window.deleteComment = deleteComment;
window.searchByHashtag = searchByHashtag;
window.openMediaModal = openMediaModal;
window.cancelMedia = cancelMedia;

document.addEventListener('DOMContent;
window.deleteComment = deleteComment;
window.searchByHashtag = searchByHashtag;
window.openMediaModal = openMediaModal;
window.cancelMedia = cancelMedia;

document.addEventListener('Loaded', init);
```DOMContentLoaded', init);
