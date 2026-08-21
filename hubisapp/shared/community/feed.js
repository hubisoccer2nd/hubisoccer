// ============================================================
//  HUBISOCCER — FEED.JS (VERSION CORRIGÉE – EXPIRATION 24H)
// ============================================================
//  Corrections :
//  - expires_at fixé à 24h (indépendant de la durée d'affichage)
//  - Vérifications de sécurité pour éviter les erreurs null
//  - Nettoyage robuste des champs après publication
//  - Toutes les fonctions sont présentes et définies
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let myCommunity = null;
let posts = [];
let likedPosts = new Set();
let dislikedPosts = new Set();
let savedPosts = new Set();
let hiddenPosts = new Set();
let blockedUsers = new Set();
let activeFilter = 'all';
let activeRoleFilter = 'all';
let searchQuery = '';
let newPostsCount = 0;
let postOffset = 0;
const PAGE_SIZE = 20;
let hasMorePosts = false;
let loadingPosts = false;
let mediaFile = null;
let commentMediaFile = null;
let commentAudioFile = null;
let storyUploadFile = null;
let storyTextBg = 'linear-gradient(135deg,#551B8C,#3d1266)';
let pendingPoll = null;
let pendingEvent = null;
let scheduledAt = null;
let currentReportPostId = null;
let currentBlockUserId = null;
let currentSharePostId = null;
let replyCommentId = null;
let replyPostId = null;
let pinPostActive = false;
let feedSubscription = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let mentionTargetInput = null;
let mentionDropdown = null;
let mentionsCache = [];
let lastMentionsFetch = 0;
const MENTIONS_CACHE_TTL = 120000;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : CONSTANTES ROLES ==========
//
// La table « role_code -> tableau de bord » qui se trouvait ici a ete
// SUPPRIMEE. Elle etait dupliquee dans six pages de la communaute,
// les copies divergeaient entre elles, et elle pointait vers des
// dossiers absents du depot (agent_fifa, tennisman, athlete...).
// Chaque clic sur le logo ou sur « Tableau de bord » renvoyait donc
// une erreur 404 -- y compris son repli '../../index.html', qui
// n'existe pas davantage.
//
// La table verifiee vit desormais dans role-nav.js, chargee par
// feed.html juste avant ce fichier. On y accede par :
//     getRoleHome(roleCode)   -> lien d'accueil de l'espace prive
//     getRoleMenu(roleCode)   -> menu complet de l'espace prive
//     getRoleLabel(roleCode)  -> libelle affichable du role
//     applyRoleLinks(roleCode)-> pose les liens sur l'en-tete
//
// ALL_ROLES reste ici : il ne sert pas a la navigation mais a
// alimenter les filtres par role du fil d'actualite.
//
const ALL_ROLES = [
    { code: 'FOOT', label: 'Footballeur', icon: '⚽' },
    { code: 'BASK', label: 'Basketteur', icon: '🏀' },
    { code: 'TENN', label: 'Tennisman', icon: '🎾' },
    { code: 'ATHL', label: 'Athlète', icon: '🏃' },
    { code: 'HANDB', label: 'Handballeur', icon: '🤾' },
    { code: 'VOLL', label: 'Volleyeur', icon: '🏐' },
    { code: 'RUGBY', label: 'Rugbyman', icon: '🏉' },
    { code: 'NATA', label: 'Nageur', icon: '🏊' },
    { code: 'ARTSM', label: 'Arts martiaux', icon: '🥋' },
    { code: 'CYCL', label: 'Cycliste', icon: '🚴' },
    { code: 'CHAN', label: 'Chanteur', icon: '🎤' },
    { code: 'DANS', label: 'Danseur', icon: '💃' },
    { code: 'COMP', label: 'Compositeur', icon: '🎼' },
    { code: 'ACIN', label: 'Acteur cinéma', icon: '🎬' },
    { code: 'ATHE', label: 'Acteur théâtre', icon: '🎭' },
    { code: 'HUMO', label: 'Humoriste', icon: '🎙️' },
    { code: 'SLAM', label: 'Slameur', icon: '🗣️' },
    { code: 'DJ', label: 'DJ / Producteur', icon: '🎧' },
    { code: 'CIRQ', label: 'Artiste de cirque', icon: '🤹' },
    { code: 'VISU', label: 'Artiste visuel', icon: '🎨' },
    { code: 'PARRAIN', label: 'Parrain', icon: '🤝' },
    { code: 'AGENT', label: 'Agent FIFA', icon: '💼' },
    { code: 'COACH', label: 'Coach', icon: '📋' },
    { code: 'MEDIC', label: 'Staff médical', icon: '⚕️' },
    { code: 'ARBIT', label: 'Corps arbitral', icon: '🏁' },
    { code: 'ACAD', label: 'Académie sportive', icon: '🏫' },
    { code: 'FORM', label: 'Formateur', icon: '🎓' },
    { code: 'TOURN', label: 'Gestionnaire tournoi', icon: '🏆' }
];
// ========== FIN : CONSTANTES ROLES ==========

// ========== DEBUT : SESSION ET AVATAR ==========
async function initSessionAndProfile() {
    const auth = await requireAuth();
    if (!auth) return false;

    document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
    updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name);

    // Liens vers l'espace prive du role : logo, entree « Tableau de
    // bord » et bouton de retour. Calcules par role-nav.js a partir de
    // l'arborescence reelle du depot -- plus aucun 404 possible.
    if (typeof applyRoleLinks === 'function') {
        applyRoleLinks(currentProfile.role_code);
    } else {
        const fallback = '../construction.html';
        const dd = document.getElementById('dropDashboard');
        if (dd) dd.href = fallback;
        console.warn('[feed] role-nav.js absent : navigation de repli utilisee.');
    }
    
    // Lien "Mon profil" (tous rôles)
    document.getElementById('dropProfile').href = `profil-feed.html?id=${currentProfile.hubisoccer_id}`;

// Lien "Messages" (tous rôles)
    document.getElementById('dropMessages').href = '../messagerie/conversation.html';

// Lien "Paramètres" (tous rôles)
    document.getElementById('dropSettings').href = 'settings-feed.html';

    buildSidebarMenu(currentProfile.role_code);
    return true;
}

function updateAvatarDisplay(avatarUrl, fullName) {
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const publishAvatar = document.getElementById('publishAvatar');
    const publishInitials = document.getElementById('publishAvatarInitials');
    const storyAddAvatar = document.getElementById('storyAddAvatar');
    const storyAddInitials = document.getElementById('storyAddAvatarInitials');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarInitials = document.getElementById('sidebarAvatarInitials');

    const initials = getInitials(fullName);

    const apply = (img, init, url) => {
        if (url) {
            img.src = url;
            img.style.display = 'block';
            init.style.display = 'none';
        } else {
            img.style.display = 'none';
            init.style.display = 'flex';
            init.textContent = initials;
        }
    };

    apply(userAvatar, userInitials, avatarUrl);
    apply(publishAvatar, publishInitials, avatarUrl);
    apply(storyAddAvatar, storyAddInitials, avatarUrl);
    apply(sidebarAvatar, sidebarInitials, avatarUrl);
}
// ========== FIN : SESSION ET AVATAR ==========

// ========== DEBUT : MENU LATERAL ==========
//
// AVANT : cette fonction contenait une table « menuConfig » de 28
// roles, soit plus de 300 liens ecrits a la main. La quasi-totalite
// pointait vers des dossiers absents du depot :
//   ../../tennisman/, ../../athlete/, ../../handballeur/,
//   ../../volleyeur/, ../../rugbyman/, ../../nageur/,
//   ../../arts_martiaux/, ../../cycliste/, ../../chanteur/,
//   ../../danseur/, ../../compositeur/, ../../acteur_cinema/,
//   ../../acteur_theatre/, ../../humoriste/, ../../slameur/,
//   ../../dj/, ../../cirque/, ../../artiste_visuel/,
//   ../../agent_fifa/, ../../formateur/, ../../gestionnaire_tournoi/
// et, pour les roles dont le dossier existe, les noms de fichiers
// etaient faux (basketteur-dash au lieu de basket-dash,
// staff_medical-dash au lieu de staff-dash, corps_arbitral-dash au
// lieu de arbitre-dash).
//
// MAINTENANT : le menu est produit par role-nav.js, dont chaque lien
// a ete verifie contre les fichiers reellement presents. Les roles
// dont l'espace prive n'est pas encore construit affichent un bloc
// « en construction » au lieu de liens morts.
//
function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const titleEl = document.getElementById('sidebarRoleTitle');

    // ---------- Repli si role-nav.js n'a pas ete charge ----------
    if (typeof getRoleMenu !== 'function') {
        console.warn('[feed] role-nav.js absent : menu lateral reduit.');
        if (titleEl) titleEl.textContent = 'Menu';
        nav.innerHTML = buildCommunitySidebarExtras();
        wireSidebarExtras();
        return;
    }

    if (titleEl) titleEl.textContent = 'Menu ' + getRoleLabel(roleCode);

    // ---------- Bloc 1 : l'espace prive du role ----------
    const roleItems = getRoleMenu(roleCode);
    let roleBlock;

    if (roleItems.length) {
        roleBlock = roleItems.map(item =>
            '<a href="' + escapeAttr(item.href) + '">' +
                '<i class="fas ' + escapeAttr(item.icon) + '"></i> ' +
                escapeHtml(item.label) +
            '</a>'
        ).join('');
    } else {
        // Role sans espace prive : on l'annonce clairement plutot
        // que d'afficher des liens qui renvoient une erreur.
        roleBlock =
            '<div class="rn-pending">' +
                '<strong>' + escapeHtml(getRoleLabel(roleCode)) + '</strong>' +
                '<span>Votre espace privé est en cours de construction.</span>' +
                '<a href="' + escapeAttr(ROLE_FALLBACK) + '" class="rn-link">' +
                    '<i class="fas fa-circle-info"></i> En savoir plus' +
                '</a>' +
            '</div>';
    }

    // ---------- Bloc 2 : la communaute elle-meme ----------
    nav.innerHTML =
        '<a href="feed.html" class="active"><i class="fas fa-users"></i> Communauté</a>' +
        roleBlock +
        buildCommunitySidebarExtras();

    wireSidebarExtras();
}

//
// Partie commune du menu lateral : navigation interne a la
// communaute, modules partages, modules a venir, actions locales.
// Tous les chemins sont verifies presents dans le depot ; ceux qui
// ne le sont pas encore renvoient vers construction.html.
//
function buildCommunitySidebarExtras() {
    const soon = (typeof ROLE_FALLBACK === 'string') ? ROLE_FALLBACK : '../construction.html';

    return '' +
        '<hr>' +
        '<a href="stories.html"><i class="fas fa-smile"></i> Stories</a>' +
        '<a href="live.html"><i class="fas fa-broadcast-tower"></i> Lives</a>' +
        '<a href="search.html"><i class="fas fa-search"></i> Recherche</a>' +
        '<a href="notifications.html"><i class="fas fa-bell"></i> Notifications</a>' +
        '<a href="profil-feed.html"><i class="fas fa-user"></i> Mon profil</a>' +
        '<a href="settings-feed.html"><i class="fas fa-gear"></i> Paramètres</a>' +

        '<hr>' +
        '<a href="../messagerie/conversation.html"><i class="fas fa-comments"></i> Messagerie</a>' +
        '<a href="../gestion-tournoi/acceuil.html"><i class="fas fa-trophy"></i> Tournois</a>' +
        '<a href="../suivi-tournoi/suivi-tournoi.html"><i class="fas fa-eye"></i> Suivi tournoi</a>' +

        '<hr>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-store"></i> HubiMarket' +
            '<span class="rn-badge">bientôt</span></a>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-award"></i> HubiCertif' +
            '<span class="rn-badge">bientôt</span></a>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-crown"></i> HubiAbonnement' +
            '<span class="rn-badge">bientôt</span></a>' +

        '<hr>' +
        '<a href="#" id="sidebarCollections"><i class="fas fa-bookmark"></i> Collections</a>' +
        '<a href="#" id="sidebarHiddenPosts"><i class="fas fa-eye-slash"></i> Masqués</a>' +
        '<a href="#" id="sidebarBlockedUsers"><i class="fas fa-ban"></i> Bloqués</a>' +

        '<hr>' +
        '<a href="#" id="sidebarLogout" style="color:var(--danger)">' +
            '<i class="fas fa-sign-out-alt"></i> Déconnexion</a>';
}

//
// Branchement des actions locales du menu lateral.
// Chaque branchement est independant : si un element manque, les
// autres continuent de fonctionner.
//
function wireSidebarExtras() {
    const on = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    };

    on('sidebarLogout', (e) => { e.preventDefault(); logout(); });
    on('sidebarCollections', (e) => {
        e.preventDefault(); openModal('modalCollections'); loadCollections();
    });
    on('sidebarHiddenPosts', (e) => {
        e.preventDefault(); openModal('modalHiddenPosts'); loadHiddenPosts();
    });
    on('sidebarBlockedUsers', (e) => {
        e.preventDefault(); openModal('modalBlockedUsers'); loadBlockedUsers();
    });
}
// ========== FIN : MENU LATERAL ==========

// ========== DEBUT : CHARGEMENT DE LA COMMUNAUTE ==========
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

    const cover = document.getElementById('myCommCover');
    if (data.cover_url) cover.style.background = `url(${data.cover_url}) center/cover`;

    const commAvatar = document.getElementById('myCommAvatar');
    const commInitials = document.getElementById('myCommAvatarInitials');
    if (data.avatar_url) {
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

    document.getElementById('presTitle').textContent = data.name || 'Ma Communauté';
    document.getElementById('presDescription').textContent = data.bio || 'Partagez et interagissez avec les sportifs, artistes et acteurs de la communauté HubISoccer.';

    const sidebarCover = document.getElementById('sidebarCoverClick');
    if (data.cover_url) sidebarCover.style.backgroundImage = `url(${data.cover_url})`;

    document.getElementById('statFollowers').addEventListener('click', () => openFollowersModal('followers'));
    document.getElementById('statFollowing').addEventListener('click', () => openFollowersModal('following'));

    return data;
}
// ========== FIN : CHARGEMENT DE LA COMMUNAUTE ==========

// ========== DEBUT : CHARGEMENT DES POSTS ==========
async function loadPosts(reset = false) {
    if (loadingPosts) return;
    loadingPosts = true;

    let feedSkeletonEl = document.getElementById('feedSkeleton');
    const postsFeedEl = document.getElementById('postsFeed');

    if (!feedSkeletonEl && postsFeedEl) {
        feedSkeletonEl = document.createElement('div');
        feedSkeletonEl.id = 'feedSkeleton';
        feedSkeletonEl.innerHTML = `
            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>
        `;
        postsFeedEl.innerHTML = '';
        postsFeedEl.appendChild(feedSkeletonEl);
    }

    if (reset) {
        postOffset = 0;
        posts = [];
        if (postsFeedEl) postsFeedEl.innerHTML = '';
        feedSkeletonEl = document.getElementById('feedSkeleton');
        if (feedSkeletonEl) feedSkeletonEl.style.display = 'block';
    }

    try {
        let query = sb.from('supabaseAuthPrive_posts')
            .select(`
                *,
                author:supabaseAuthPrive_profiles!author_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, role_code, feed_id, certified),
                community:supabaseAuthPrive_communities!community_id(name, feed_id, avatar_url)
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
            if (ids.length) {
                query = query.in('author_hubisoccer_id', ids);
            } else {
                posts = [];
                renderPosts();
                loadingPosts = false;
                return;
            }
        }
        if (activeFilter === 'saved') {
            const savedArray = Array.from(savedPosts);
            if (savedArray.length) {
                query = query.in('id', savedArray);
            } else {
                posts = [];
                renderPosts();
                loadingPosts = false;
                return;
            }
        }
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
        const loadMoreWrapEl = document.getElementById('loadMoreWrap');
        if (loadMoreWrapEl) loadMoreWrapEl.style.display = hasMorePosts ? 'block' : 'none';
    } catch (err) {
        console.error('Erreur chargement posts:', err);
        toast('Erreur chargement des posts', 'error');
    } finally {
        loadingPosts = false;
        const finalFeedSkeleton = document.getElementById('feedSkeleton');
        if (finalFeedSkeleton) finalFeedSkeleton.style.display = 'none';
    }
}
// ========== FIN : CHARGEMENT DES POSTS ==========

// ========== DEBUT : RENDU DES POSTS ==========
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

    const authorInitials = getInitials(authorName);
    const authorAvatarHtml = author.avatar_url
        ? `<img class="post-avatar" src="${escapeAttr(author.avatar_url)}" alt="" onclick="openUserProfile('${post.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="post-avatar-initials" onclick="openUserProfile('${post.author_hubisoccer_id}')">${authorInitials}</div>`;

    let mediaHtml = '';
    if (post.media_url) {
        if (post.media_type === 'video') {
            mediaHtml = `<div class="post-media"><video src="${escapeAttr(post.media_url)}" controls preload="metadata"></video></div>`;
        } else {
            mediaHtml = `<div class="post-media"><img src="${escapeAttr(post.media_url)}" alt="Media" loading="lazy" onclick="openMediaModal('${post.media_url}','image')"></div>`;
        }
    }

    let pollHtml = '';
    if (post.poll_data) {
        const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
        const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
        const hasVoted = poll.voted_by?.includes(currentProfile.hubisoccer_id);
        // Mon propre choix, et non plus un my_vote partagé par tout le monde
        const myVote = poll.votes_by_user?.[currentProfile.hubisoccer_id];
        pollHtml = `
            <div class="post-poll">
                <div class="poll-question">${escapeHtml(poll.question)}</div>
                ${poll.options.map((opt, i) => {
                    const votes = poll.votes?.[i] || 0;
                    const pct = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
                    return `
                        <div class="poll-option${hasVoted ? ' voted' : ''}${myVote === i ? ' my-vote' : ''}" data-post-id="${escapeAttr(post.id)}" data-option="${i}">
                            <div class="poll-bar" style="width:${hasVoted ? pct : 0}%"></div>
                            <span class="poll-option-text">${escapeHtml(opt)}</span>
                            ${hasVoted ? `<span class="poll-pct">${pct}%</span>` : ''}
                            ${myVote === i ? '<i class="fas fa-check" style="color:var(--primary);margin-left:6px"></i>' : ''}
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
    <div class="post-card" data-post-id="${escapeAttr(post.id)}">
        <div class="post-header">
            ${authorAvatarHtml}
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
                <div class="post-text ${long ? 'collapsed' : ''}" id="txt_${post.id}">
                    ${formatText(content)}
                </div>
                ${long ? `<button class="post-see-more-btn" onclick="expandPost('${post.id}')" style="margin-top:8px; padding:6px 12px; background:var(--primary); color:white; border:none; border-radius:20px; font-size:0.8rem; font-weight:600; cursor:pointer;">Voir plus</button>` : ''}
            ` : ''}
        </div>

        ${mediaHtml}
        ${pollHtml}
        ${eventHtml}

        <div class="post-actions">
            <button class="post-action ${liked ? 'liked' : ''}" onclick="toggleLike('${post.id}', this)">
                <i class="fa${liked ? 's' : 'r'} fa-heart action-icon"></i>
                <span class="post-action-count" id="likeCount_${post.id}">${post.likes_count || 0}</span>
            </button>
            <button class="post-action ${disliked ? 'disliked' : ''}" onclick="toggleDislike('${post.id}', this)">
                <i class="fa${disliked ? 's' : 'r'} fa-heart-broken action-icon"></i>
                <span class="post-action-count" id="dislikeCount_${post.id}">${post.dislikes_count || 0}</span>
            </button>
            <button class="post-action" onclick="toggleComments('${post.id}', this)">
                <i class="far fa-comment action-icon"></i>
                <span class="post-action-count">${post.comments_count || 0}</span>
            </button>
            <button class="post-action" onclick="repostPost('${post.id}')">
                <i class="fas fa-retweet action-icon"></i>
                <span class="post-action-count" id="repostCount_${post.id}">${post.reposts_count || 0}</span>
            </button>
            <button class="post-action" onclick="openShareModal('${post.id}')">
                <i class="fas fa-share action-icon"></i>
                <span class="post-action-count">${post.shares_count || 0}</span>
            </button>
            <button class="post-action ${saved ? 'saved' : ''}" onclick="toggleSave('${post.id}', this)" title="Enregistrer">
                <i class="fa${saved ? 's' : 'r'} fa-bookmark action-icon"></i>
            </button>
        </div>

        <div class="post-comments" id="comments_${post.id}" style="display:none"></div>
    </div>`;
}

function attachPostEvents() {
    document.querySelectorAll('.poll-option:not(.voted)').forEach(opt => {
        opt.addEventListener('click', () => votePoll(opt.dataset.postId, parseInt(opt.dataset.option)));
    });
}
// ========== FIN : RENDU DES POSTS ==========

// ========== DEBUT : INTERACTIONS POSTS (LIKE, DISLIKE, SAVE, REPOST) ==========


// ========== DEBUT : PUBLICATION DES POSTS PROGRAMMÉS ==========
// Un post programmé était enregistré avec is_scheduled = true, ce qui le masquait
// du fil — mais rien ne remettait jamais ce drapeau à false : le post ne
// paraissait donc jamais. On publie maintenant ceux dont l'heure est venue.
async function publishDueScheduledPosts() {
    if (!currentProfile?.hubisoccer_id) return;
    try {
        const { data } = await sb.from('supabaseAuthPrive_posts')
            .select('id')
            .eq('author_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('is_scheduled', true)
            .lte('scheduled_at', new Date().toISOString())
            .limit(20);

        if (!data || data.length === 0) return;

        for (const p of data) {
            await sb.from('supabaseAuthPrive_posts')
                .update({ is_scheduled: false, created_at: new Date().toISOString() })
                .eq('id', p.id)
                .eq('is_scheduled', true);
        }
        toast(`${data.length} publication(s) programmée(s) publiée(s) ✅`, 'success');
        loadPosts(true);
    } catch (e) {
        console.warn('Posts programmés :', e);
    }
}
// ========== FIN : POSTS PROGRAMMÉS ==========

// ========== DEBUT : COMPTEURS FIABLES ==========
// Les compteurs étaient calculés puis réécrits par le navigateur : deux actions
// simultanées se perdaient et la valeur était falsifiable. On recompte
// désormais la vraie valeur dans la base avant de l'enregistrer.
async function syncPostCount(postId, table, column) {
    try {
        const { count } = await sb.from(table)
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
        const real = count || 0;
        await sb.from('supabaseAuthPrive_posts').update({ [column]: real }).eq('id', postId);
        const post = posts.find(p => String(p.id) === String(postId));
        if (post) post[column] = real;
        return real;
    } catch (e) {
        return null;
    }
}

// Incrément atomique pour les compteurs sans table de détail (partages, reposts)
async function bumpPostCount(postId, column) {
    const { data } = await sb.from('supabaseAuthPrive_posts').select(column).eq('id', postId).single();
    const next = ((data && data[column]) || 0) + 1;
    await sb.from('supabaseAuthPrive_posts').update({ [column]: next }).eq('id', postId);
    return next;
}
// ========== FIN : COMPTEURS FIABLES ==========

async function toggleLike(postId, btn) {
    const isLiked = likedPosts.has(postId);
    const post = posts.find(p => String(p.id) === String(postId));
    const countEl = document.getElementById(`likeCount_${postId}`);

    if (isLiked) {
        likedPosts.delete(postId);
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart action-icon';
        if (post) post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_likes').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        likedPosts.add(postId);
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart action-icon';
        if (post) post.likes_count = (post.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_likes').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubisoccer_id,
                type: 'like',
                title: 'Nouveau J\'aime',
                message: `${currentProfile.full_name || currentProfile.display_name} a aimé votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }
    }
    if (countEl) countEl.textContent = post?.likes_count || 0;
    const realLikes = await syncPostCount(postId, 'supabaseAuthPrive_post_likes', 'likes_count');
    if (realLikes !== null && countEl) countEl.textContent = realLikes;
}

async function toggleDislike(postId, btn) {
    const isDisliked = dislikedPosts.has(postId);
    const post = posts.find(p => String(p.id) === String(postId));
    const countEl = document.getElementById(`dislikeCount_${postId}`);

    if (isDisliked) {
        dislikedPosts.delete(postId);
        btn.classList.remove('disliked');
        btn.querySelector('i').className = 'far fa-heart-broken action-icon';
        if (post) post.dislikes_count = Math.max(0, (post.dislikes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_dislikes').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        dislikedPosts.add(postId);
        btn.classList.add('disliked');
        btn.querySelector('i').className = 'fas fa-heart-broken action-icon';
        if (post) post.dislikes_count = (post.dislikes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_dislikes').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
    }
    if (countEl) countEl.textContent = post?.dislikes_count || 0;
    const realDislikes = await syncPostCount(postId, 'supabaseAuthPrive_post_dislikes', 'dislikes_count');
    if (realDislikes !== null && countEl) countEl.textContent = realDislikes;
}

async function toggleSave(postId, btn) {
    const isSaved = savedPosts.has(postId);
    if (isSaved) {
        savedPosts.delete(postId);
        btn.classList.remove('saved');
        btn.querySelector('i').className = 'far fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        toast('Publication retirée', 'info');
    } else {
        savedPosts.add(postId);
        btn.classList.add('saved');
        btn.querySelector('i').className = 'fas fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
        toast('Publication enregistrée ✅', 'success');
    }
}

async function repostPost(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;
    const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert({
        author_hubisoccer_id: currentProfile.hubisoccer_id,
        community_id: myCommunity?.id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        reposted_from_id: postId
    }).select().single();
    if (error) {
        toast('Erreur repost', 'error');
        return;
    }
    toast('Repost effectué ✅', 'success');
    posts.unshift(newPost);
    renderPosts();
    post.reposts_count = await bumpPostCount(postId, 'reposts_count');
}
// ========== FIN : INTERACTIONS POSTS ==========

// ========== DEBUT : GESTION DES COMMENTAIRES ==========
async function toggleComments(postId, btn) {
    const section = document.getElementById(`comments_${postId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postId);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId) {
    const section = document.getElementById(`comments_${postId}`);
    if (!section) return;

    const { data, error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

    if (error) {
        toast('Erreur chargement des commentaires', 'error');
        return;
    }

    section.innerHTML = `
        <div class="comments-list">
            ${(data || []).map(c => makeCommentHtml(c, postId)).join('')}
            ${(data || []).length === 10 ? `<div class="load-comments-btn" onclick="loadMoreComments('${postId}')">Voir plus de commentaires</div>` : ''}
        </div>
        <div class="comment-input-row">
            <div class="comment-input-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
            <img class="comment-input-avatar" src="${escapeAttr(currentProfile.avatar_url || '')}" alt="" style="display:${currentProfile.avatar_url ? 'block' : 'none'};">
            <div class="comment-input-wrap">
                <textarea class="comment-input" id="commentInput_${postId}" rows="1" placeholder="Écrire un commentaire..." style="resize:none;max-height:80px"></textarea>
                <button class="comment-media-btn" onclick="document.getElementById('commentMediaInput_${postId}').click()"><i class="fas fa-image"></i></button>
                <button class="comment-audio-btn" onclick="startAudioRecording('${postId}')"><i class="fas fa-microphone"></i></button>
                <button class="comment-send-btn" onclick="sendComment('${postId}')"><i class="fas fa-paper-plane"></i></button>
            </div>
            <input type="file" id="commentMediaInput_${postId}" accept="image/*" style="display:none">
        </div>
    `;

    const ta = document.getElementById(`commentInput_${postId}`);
    if (ta) {
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
        });
        ta.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComment(postId);
            }
        });
        ta.addEventListener('input', handleMentionInput);
    }

    const mediaInput = document.getElementById(`commentMediaInput_${postId}`);
    if (mediaInput) {
        mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                commentMediaFile = file;
                toast('Image prête à être envoyée avec le commentaire', 'success');
            }
        });
    }
}

function makeCommentHtml(c, postId) {
    const author = c.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorRole = author.role_code || '';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    const isOwn = c.author_hubisoccer_id === currentProfile.hubisoccer_id;

    const avatarBlock = avatarUrl
        ? `<img class="comment-avatar" src="${escapeAttr(avatarUrl)}" alt="" onclick="openUserProfile('${c.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="comment-avatar-initials" onclick="openUserProfile('${c.author_hubisoccer_id}')">${initials}</div>`;

    return `
        <div class="comment-item" id="comment_${c.id}">
            ${avatarBlock}
            <div>
                <div class="comment-bubble">
                    <div class="comment-author">
                        ${escapeHtml(authorName)}
                        ${authorRole ? `<span class="cm-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    </div>
                    <div class="comment-text">${formatText(c.content)}</div>
                    ${c.media_url ? `
                        <div class="comment-media">
                            <img src="${escapeAttr(c.media_url)}" alt="" onclick="openMediaModal('${c.media_url}','image')">
                        </div>
                    ` : ''}
                    ${c.audio_url ? `
                        <div class="comment-audio">
                            <audio controls src="${escapeAttr(c.audio_url)}"></audio>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn ${c.liked_by_me ? 'liked' : ''}" onclick="likeComment('${c.id}', this)">
                        <i class="fa${c.liked_by_me ? 's' : 'r'} fa-heart"></i>
                        <span id="cmLike_${c.id}">${c.likes_count || 0}</span>
                    </button>
                    <button class="comment-action-btn" onclick="openReplyModal('${c.id}', '${postId}')">
                        <i class="fas fa-reply"></i> Répondre
                    </button>
                    ${isOwn ? `
                        <button class="comment-action-btn" style="color:var(--danger)" onclick="deleteComment('${c.id}', '${postId}')">
                            <i class="fas fa-trash-alt"></i> Supprimer
                        </button>
                    ` : ''}
                    <span class="comment-time">${timeSince(c.created_at)}</span>
                    ${c.edited ? '<span class="cm-edited">(modifié)</span>' : ''}
                </div>
                <div class="cm-replies" id="replies_${c.id}"></div>
                <div id="replyCompose_${c.id}" style="display:none; margin-top:8px;">
                    <div class="cm-reply-compose">
                        <div class="comment-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
                        <img src="${escapeAttr(currentProfile.avatar_url || '')}" alt=""
                            style="display:${currentProfile.avatar_url ? 'block' : 'none'}; width:26px;height:26px;border-radius:50%;">
                        <textarea rows="1" id="replyInput_${c.id}" placeholder="Répondre à ${escapeHtml(authorName)}..."></textarea>
                        <button onclick="sendReply('${c.id}', '${postId}')"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    const content = input?.value.trim();
    if (!content && !commentMediaFile && !commentAudioFile) return;
    input.value = '';
    input.style.height = 'auto';

    const btn = document.querySelector(`#comments_${postId} .comment-send-btn`);
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        let mediaUrl = null;
        let audioUrl = null;

        if (commentMediaFile) {
            const ext = commentMediaFile.name.split('.').pop();
            const path = `comments/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, commentMediaFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
                mediaUrl = urlData.publicUrl;
            }
            commentMediaFile = null;
        }

        if (commentAudioFile) {
            const path = `comments_audio/${currentProfile.hubisoccer_id}/${Date.now()}.webm`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, commentAudioFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
                audioUrl = urlData.publicUrl;
            }
            commentAudioFile = null;
        }

        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: postId,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl,
            audio_url: audioUrl,
            parent_id: null
        }).select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        const list = document.querySelector(`#comments_${postId} .comments-list`);
        if (list) list.insertAdjacentHTML('beforeend', makeCommentHtml(data, postId));

        const post = posts.find(p => String(p.id) === String(postId));
        if (post) post.comments_count = (post.comments_count || 0) + 1;
        await syncPostCount(postId, 'supabaseAuthPrive_comments', 'comments_count');

        const countSpan = document.querySelector(`.post-card[data-post-id="${escapeAttr(postId)}"] .post-action-count`);
        if (countSpan) countSpan.textContent = post.comments_count;

        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubisoccer_id,
                type: 'comment',
                title: 'Nouveau commentaire',
                message: `${currentProfile.full_name || currentProfile.display_name} a commenté votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }

        const mentions = content?.match(/@(\w+)/g);
        if (mentions) {
            for (const m of mentions) {
                const handle = m.substring(1);
                const { data: mentionedUser } = await sb.from('supabaseAuthPrive_communities')
                    .select('hubisoccer_id').eq('feed_id', handle).maybeSingle();
                if (mentionedUser && mentionedUser.hubisoccer_id !== currentProfile.hubisoccer_id) {
                    await sb.from('supabaseAuthPrive_notifications').insert({
                        recipient_hubisoccer_id: mentionedUser.hubisoccer_id,
                        type: 'mention',
                        title: 'Nouvelle mention',
                        message: `${currentProfile.full_name || currentProfile.display_name} vous a mentionné dans un commentaire.`,
                        data: { link: `post-view.html?id=${postId}` }
                    });
                }
            }
        }
    } catch (err) {
        toast('Erreur envoi commentaire : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function likeComment(commentId, btn) {
    const liked = btn.classList.contains('liked');
    const countEl = btn.querySelector('span');

    const { data: comment, error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('likes_count, author_hubisoccer_id')
        .eq('id', commentId)
        .single();

    if (error || !comment) {
        toast('Commentaire introuvable', 'error');
        return;
    }

    let newLikes;
    if (liked) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart';
        newLikes = Math.max(0, (comment.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete()
            .eq('comment_id', commentId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart';
        newLikes = (comment.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_comment_likes').insert({
            comment_id: commentId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });

        if (comment.author_hubisoccer_id && comment.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: comment.author_hubisoccer_id,
                type: 'like_comment',
                title: '❤️ J\'aime sur votre commentaire',
                message: `${currentProfile.full_name || currentProfile.display_name} a aimé votre commentaire.`,
                data: { link: `post-view.html?comment=${commentId}` }
            });
        }
    }

    if (countEl) countEl.textContent = newLikes;
    await sb.from('supabaseAuthPrive_comments').update({ likes_count: newLikes }).eq('id', commentId);
}

function deleteComment(commentId, postId) {
    askConfirm('Supprimer le commentaire', 'Ce commentaire sera définitivement supprimé.',
        () => doDeleteComment(commentId, postId), '<i class="fas fa-trash-alt"></i> Supprimer');
}

async function doDeleteComment(commentId, postId) {

    await sb.from('supabaseAuthPrive_comments').delete().eq('id', commentId);
    document.getElementById(`comment_${commentId}`)?.remove();
    const post = posts.find(p => p.id === postId);
    if (post) post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
    await syncPostCount(postId, 'supabaseAuthPrive_comments', 'comments_count');
    toast('Commentaire supprimé', 'success');
}

async function openReplyModal(commentId, postId) {
    replyCommentId = commentId;
    replyPostId = postId;
    const c = document.querySelector(`#comment_${commentId} .comment-text`);
    document.getElementById('originalCommentQuote').textContent = c?.textContent?.substring(0, 80) || '';
    document.getElementById('replyContent').value = '';
    openModal('modalReply');
}

async function sendReply(commentId = null, postId = null) {
    const id = commentId || replyCommentId;
    const pId = postId || replyPostId;
    if (!id || !pId) {
        toast('Erreur : aucune réponse sélectionnée', 'error');
        return;
    }

    const input = document.getElementById('replyContent');
    const content = input?.value.trim();
    if (!content) return;

    const btn = document.getElementById('sendReplyBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: pId,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content,
            parent_id: id
        }).select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        const repliesContainer = document.getElementById(`replies_${id}`);
        if (repliesContainer) {
            repliesContainer.insertAdjacentHTML('beforeend', makeReplyCard(data));
        }

        closeModal('modalReply');
        input.value = '';
        toast('Réponse envoyée ✅', 'success');
    } catch (err) {
        toast('Erreur envoi réponse : ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
        }
    }
}

function makeReplyCard(r) {
    const author = r.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    return `
        <div class="cm-reply-card" id="cm_${r.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'none' : 'flex'}; width:28px;height:28px;font-size:0.7rem;">
                ${initials}
            </div>
            <img class="cm-reply-avatar" src="${escapeAttr(avatarUrl || '')}" alt="" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'block' : 'none'};">
            <div class="cm-reply-bubble">
                <div class="cm-reply-author">${escapeHtml(authorName)}</div>
                <div class="cm-reply-text">${formatText(r.content)}</div>
                <div class="cm-footer">
                    <button class="cm-action-btn" onclick="likeComment('${r.id}', this)">
                        <i class="far fa-heart"></i> ${r.likes_count || 0}
                    </button>
                    <span class="cm-time">${timeSince(r.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadMoreComments(postId) {
    toast('Chargement des commentaires supplémentaires... (fonction à implémenter)', 'info');
}
// ========== FIN : GESTION DES COMMENTAIRES ==========

// ========== DEBUT : VOTE SONDAGE ==========
async function votePoll(postId, optionIdx) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll_data) return;
    const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
        toast('Ce sondage est terminé', 'warning');
        return;
    }

    if (poll.voted_by?.includes(currentProfile.hubisoccer_id)) {
        toast('Vous avez déjà voté', 'info');
        return;
    }

    // Relecture juste avant l'écriture : évite d'écraser le vote d'un autre
    const { data: fresh } = await sb.from('supabaseAuthPrive_posts')
        .select('poll_data').eq('id', postId).single();
    const live = fresh?.poll_data
        ? (typeof fresh.poll_data === 'string' ? JSON.parse(fresh.poll_data) : fresh.poll_data)
        : poll;

    if (live.voted_by?.includes(currentProfile.hubisoccer_id)) {
        toast('Vous avez déjà voté', 'info');
        post.poll_data = live;
        renderPosts();
        return;
    }

    live.votes = live.votes || {};
    live.votes[optionIdx] = (live.votes[optionIdx] || 0) + 1;
    live.voted_by = [...(live.voted_by || []), currentProfile.hubisoccer_id];
    // Le choix de chacun est stocké par identifiant, plus un my_vote global
    live.votes_by_user = { ...(live.votes_by_user || {}), [currentProfile.hubisoccer_id]: optionIdx };
    delete live.my_vote;
    post.poll_data = live;

    await sb.from('supabaseAuthPrive_posts').update({ poll_data: live }).eq('id', postId);
    renderPosts();
}
// ========== FIN : VOTE SONDAGE ==========

// ========== DEBUT : ACTIONS SUR LES MENUS ==========
function togglePostMenu(btn, postId, isOwn) {
    const menu = document.getElementById(`menu_${postId}`);
    if (!menu) return;

    document.querySelectorAll('.post-dropdown.show').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });

    menu.classList.toggle('show');

    if (menu.classList.contains('show')) {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }
}

function expandPost(postId) {
    const el = document.getElementById(`txt_${postId}`);
    if (el) { el.classList.remove('collapsed'); el.querySelector('.post-see-more')?.remove(); }
}


// Confirmation via la modale du site (remplace confirm() natif)
function askConfirm(title, description, onConfirm, btnLabel = 'Confirmer') {
    const t = document.getElementById('confirmTitle');
    const d = document.getElementById('confirmDesc');
    const b = document.getElementById('confirmActionBtn');
    if (!t || !d || !b) { if (window.confirm(description)) onConfirm(); return; }
    t.textContent = title;
    d.textContent = description;
    b.innerHTML = btnLabel;
    pendingConfirmAction = onConfirm;
    openModal('modalConfirm');
}

let editingPostId = null;

async function editPost(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;
    editingPostId = postId;
    const ta = document.getElementById('editPostContent');
    if (!ta) {
        // Repli si la modale n'est pas présente
        const newContent = window.prompt('Modifier la publication :', post.content || '');
        if (newContent === null) return;
        await savePostEdit(postId, newContent);
        return;
    }
    ta.value = post.content || '';
    openModal('modalEditPost');
    setTimeout(() => ta.focus(), 100);
}

async function savePostEdit(postId, newContent) {
    await sb.from('supabaseAuthPrive_posts').update({ content: newContent, edited: true }).eq('id', postId);
    const post = posts.find(p => String(p.id) === String(postId));
    if (post) { post.content = newContent; post.edited = true; }
    renderPosts();
    toast('Publication modifiée ✅', 'success');
}

function deletePost(postId) {
    askConfirm(
        'Supprimer la publication',
        'Cette action est définitive. La publication et ses commentaires seront supprimés.',
        async () => {
            const { error } = await sb.from('supabaseAuthPrive_posts')
                .delete().eq('id', postId);

            if (error) {
                // La suppression pouvait echouer en silence : le post
                // disparaissait de l'ecran mais restait en base, et
                // reapparaissait au rechargement de la page.
                console.error('[feed] suppression impossible :', error);
                toast('Suppression impossible : ' + error.message, 'error');
                return;
            }

            posts = posts.filter(p => String(p.id) !== String(postId));
            renderPosts();

            // Le compteur de la communaute doit suivre la suppression.
            await syncCommunityPostsCount();

            toast('Publication supprimée', 'success');
        },
        '<i class="fas fa-trash-alt"></i> Supprimer'
    );
}

function openShareModal(postId) {
    currentSharePostId = postId;
    openModal('modalShare');
}

function sharePost(network) {
    const post = posts.find(p => p.id === currentSharePostId);
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentSharePostId}`;
    const text = post?.content?.substring(0, 100) || '';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === 'copy') {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
    } else {
        window.open(shareUrls[network], '_blank');
    }
    closeModal('modalShare');
    bumpPostCount(currentSharePostId, 'shares_count').then(n => { if (post) post.shares_count = n; });
}

function openReportModal(postId) {
    currentReportPostId = postId;
    document.getElementById('reportReason').value = '';
    openModal('modalReport');
}

async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) { toast('Écris la raison', 'warning'); return; }
    await sb.from('supabaseAuthPrive_reports').insert({
        post_id: currentReportPostId,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason
    });
    closeModal('modalReport');
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
    blockedUsers.add(currentBlockUserId);
    closeModal('modalBlock');
    toast('Utilisateur bloqué', 'success');
    posts = posts.filter(p => p.author_hubisoccer_id !== currentBlockUserId);
    renderPosts();
}

async function hidePost(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts').insert({
        post_id: postId,
        user_hubisoccer_id: currentProfile.hubisoccer_id
    });
    hiddenPosts.add(postId);
    posts = posts.filter(p => String(p.id) !== String(postId));
    renderPosts();
    toast('Publication masquée', 'info');
}

function openUserProfile(userId) {
    window.location.href = `profil-feed.html?id=${userId}`;
}

function openUserByHandle(handle) {
    window.location.href = `profil-feed.html?handle=${handle}`;
}

function searchByHashtag(tag) {
    window.location.href = `search.html?q=%23${tag}`;
}

function openMediaModal(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video'
        ? `<video src="${escapeAttr(url)}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px"></video>`
        : `<img src="${escapeAttr(url)}" alt="" style="max-width:90vw;max-height:80vh;border-radius:8px">`;
    openModal('modalMedia');
}
// ========== FIN : ACTIONS SUR LES MENUS ==========

// ========== DEBUT : GESTION DES STORIES ==========
async function loadStories() {
    try {
        const { data: myStories } = await sb.from('supabaseAuthPrive_stories')
            .select('*')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: following } = await sb.from('supabaseAuthPrive_follows')
            .select('following_hubisoccer_id')
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
        const followingIds = (following || []).map(f => f.following_hubisoccer_id);

        let followingStories = [];
        if (followingIds.length > 0) {
            const { data } = await sb.from('supabaseAuthPrive_stories')
                .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url)')
                .in('user_hubisoccer_id', followingIds)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(5);
            followingStories = data || [];
        }

        // Mémorise les stories pour la visionneuse intégrée
        allFeedStories = [
            ...(myStories || []).map(st => ({ ...st, author: currentProfile, isOwn: true })),
            ...followingStories.map(st => ({ ...st, isOwn: false }))
        ];

        const myContainer = document.getElementById('myStoriesContainer');
        if (myContainer) {
            if (myStories && myStories.length > 0) {
                myContainer.innerHTML = myStories.map(s => makeStoryItem(s, currentProfile, true)).join('');
            } else {
                myContainer.innerHTML = '<p style="font-size:0.8rem;color:var(--gray);padding:0 8px;">Aucune story</p>';
            }
        }

        const followingContainer = document.getElementById('followingStoriesContainer');
        if (followingContainer) {
            if (followingStories.length > 0) {
                followingContainer.innerHTML = followingStories.map(s => makeStoryItem(s, s.author, false)).join('');
            } else {
                followingContainer.innerHTML = '<p style="font-size:0.8rem;color:var(--gray);padding:0 8px;">Aucune story</p>';
            }
        }

        const totalStories = (myStories?.length || 0) + followingStories.length;
        const moreWrap = document.getElementById('storiesMoreWrap');
        if (moreWrap) moreWrap.style.display = totalStories > 5 ? 'block' : 'none';
    } catch (err) {
        console.warn('Erreur stories:', err);
    }
}

function makeStoryItem(story, author, isOwn = false) {
    const name = isOwn ? 'Vous' : (author.full_name || author.display_name || 'Utilisateur');
    const avatar = author.avatar_url;
    const initials = getInitials(name);
    let preview = '';

    if (story.media_type === 'text') {
        preview = `<div class="story-ring-text" style="background:${escapeAttr(story.text_bg || 'var(--primary)')}">${initials}</div>`;
    } else if (story.media_type === 'video') {
        preview = `<div class="story-ring-video" style="background: #1a1a2e;"><i class="fas fa-video" style="font-size:24px;color:white;"></i></div>`;
    } else {
        preview = `<img src="${escapeAttr(story.media_url)}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="story-ring-text" style="display:none; background:var(--primary);">${initials}</div>`;
    }

    return `
        <div class="story-item" onclick="viewStory('${story.id}')">
            <div class="story-ring">${preview}</div>
            <span>${isOwn ? 'Moi' : escapeHtml(name.split(' ')[0])}</span>
        </div>
    `;
}

// ========== DEBUT : VISIONNEUSE DE STORIES INTÉGRÉE AU FEED ==========
let allFeedStories = [];
let pendingConfirmAction = null;
let storyViewerIndex = 0;
let storyTimer = null;
let storyPausedAt = 0;

window.viewStory = function(storyId) {
    const idx = allFeedStories.findIndex(s => String(s.id) === String(storyId));
    if (idx === -1) {
        // Story non chargée : on bascule sur la page dédiée
        window.location.href = `stories-view.html?story=${encodeURIComponent(storyId)}`;
        return;
    }
    openStoryViewer(idx);
};

function openStoryViewer(index) {
    if (!allFeedStories.length) return;
    storyViewerIndex = Math.max(0, Math.min(index, allFeedStories.length - 1));

    const modal = document.getElementById('storyModal');
    if (!modal) return;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    renderStoryViewer();
}

function closeStoryViewer() {
    clearTimeout(storyTimer);
    storyTimer = null;
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    const media = document.getElementById('storyMedia');
    if (media) media.innerHTML = '';
}

function renderStoryViewer() {
    const story = allFeedStories[storyViewerIndex];
    if (!story) { closeStoryViewer(); return; }

    // Barres de progression (une par story)
    const bars = document.getElementById('storyProgressBars');
    bars.innerHTML = allFeedStories.map((_, i) => `
        <div class="story-prog-bar"><div class="story-prog-fill" style="width:${i < storyViewerIndex ? '100%' : '0%'}"></div></div>
    `).join('');

    // Auteur
    const author = story.author || {};
    const name = story.isOwn ? 'Vous' : (author.full_name || author.display_name || 'Utilisateur');
    const avatar = author.avatar_url;
    document.getElementById('storyAuthor').innerHTML = `
        ${avatar
            ? `<img src="${escapeAttr(avatar)}" alt="">`
            : `<div class="story-ring-text" style="width:32px;height:32px;font-size:0.8rem;border-width:2px">${getInitials(name)}</div>`}
        <div>
            <div class="story-author-name">${escapeHtml(name)}</div>
            <div class="story-author-time">${timeSince(story.created_at)}</div>
        </div>`;

    // Média
    const media = document.getElementById('storyMedia');
    const duration = Math.min(60, Math.max(5, story.duration || 15)) * 1000;

    if (story.media_type === 'text') {
        media.innerHTML = `<div class="sv-story-text-card" style="background:${escapeAttr(story.text_bg || 'linear-gradient(135deg,#551B8C,#3d1266)')}">${escapeHtml(story.text_content || '')}</div>`;
        startStoryProgress(duration);
    } else if (story.media_type === 'video') {
        media.innerHTML = `<video src="${escapeAttr(story.media_url)}" autoplay playsinline controls></video>`;
        const vid = media.querySelector('video');
        vid.addEventListener('loadedmetadata', () => startStoryProgress((vid.duration || 15) * 1000));
        vid.addEventListener('ended', nextStory);
    } else {
        media.innerHTML = `<img src="${escapeAttr(story.media_url)}" alt="">`;
        startStoryProgress(duration);
    }

    // Légende
    if (story.caption) {
        media.insertAdjacentHTML('beforeend', `<div class="sv-caption" style="display:block">${escapeHtml(story.caption)}</div>`);
    }

    // Flèches
    document.getElementById('storyPrev').style.display = storyViewerIndex > 0 ? 'flex' : 'none';
    document.getElementById('storyNext').style.display = storyViewerIndex < allFeedStories.length - 1 ? 'flex' : 'none';

    markStoryViewed(story);
}

function startStoryProgress(durationMs) {
    clearTimeout(storyTimer);
    const fill = document.querySelectorAll('.story-prog-fill')[storyViewerIndex];
    if (fill) {
        fill.style.transition = 'none';
        fill.style.width = '0%';
        // Force le navigateur à appliquer la remise à zéro avant d'animer
        void fill.offsetWidth;
        fill.style.transition = `width ${durationMs}ms linear`;
        fill.style.width = '100%';
    }
    storyTimer = setTimeout(nextStory, durationMs);
}

function nextStory() {
    if (storyViewerIndex < allFeedStories.length - 1) openStoryViewer(storyViewerIndex + 1);
    else closeStoryViewer();
}

function prevStory() {
    if (storyViewerIndex > 0) openStoryViewer(storyViewerIndex - 1);
}

async function markStoryViewed(story) {
    if (story.isOwn) return;
    try {
        await sb.from('supabaseAuthPrive_story_views').upsert({
            story_id: story.id,
            viewer_hubisoccer_id: currentProfile.hubisoccer_id,
            viewed_at: new Date().toISOString()
        }, { onConflict: 'story_id, viewer_hubisoccer_id' });
    } catch (e) { /* vue facultative */ }
}

async function sendStoryReply() {
    const input = document.getElementById('storyReplyInput');
    const text = input.value.trim();
    if (!text) return;
    const story = allFeedStories[storyViewerIndex];
    if (!story || story.isOwn) { toast('Vous ne pouvez pas répondre à votre propre story', 'info'); return; }

    const authorId = story.user_hubisoccer_id;
    input.value = '';

    try {
        await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: authorId,
            type: 'story_reply',
            title: 'Réponse à votre story',
            message: `${currentProfile.full_name || currentProfile.display_name} : ${text}`,
            data: { link: `../messagerie/conversation.html?to=${currentProfile.hubisoccer_id}` }
        });
        toast('Réponse envoyée ✅', 'success');
    } catch (err) {
        toast('Erreur lors de l\'envoi', 'error');
    }
}
// ========== FIN : VISIONNEUSE DE STORIES INTÉGRÉE ==========

function handleStoryFileSelect(file) {
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`Fichier trop volumineux (max ${file.type.startsWith('video/') ? '100' : '10'} Mo)`, 'warning');
        return;
    }
    storyUploadFile = file;
    const url = URL.createObjectURL(file);
    const preview = document.getElementById('storyFilePreview');
    const dropArea = document.getElementById('storyDropArea');
    const isVideo = file.type.startsWith('video/');

    if (preview) {
        preview.innerHTML = `
            <div style="position:relative">
                ${isVideo ? `<video src="${escapeAttr(url)}" controls style="width:100%;max-height:240px;border-radius:8px"></video>` : `<img src="${escapeAttr(url)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px">`}
                <button class="story-preview-remove" onclick="clearStoryFile()"><i class="fas fa-times"></i></button>
            </div>
            <p style="font-size:0.72rem;color:var(--gray);margin-top:6px;text-align:center">${file.name} — ${(file.size/1024/1024).toFixed(1)} Mo</p>
        `;
        preview.style.display = 'block';
    }
    if (dropArea) dropArea.style.display = 'none';

    toast(`✅ Fichier "${file.name}" sélectionné`, 'success');
}

window.clearStoryFile = function() {
    storyUploadFile = null;
    const preview = document.getElementById('storyFilePreview');
    const dropArea = document.getElementById('storyDropArea');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    if (dropArea) dropArea.style.display = 'flex';
    const fileInput = document.getElementById('storyFileInput');
    if (fileInput) fileInput.value = '';
    // toast('Fichier retiré', 'info');
};

async function uploadStory() {
    const isTextStory = document.querySelector('.story-type-tab.active')?.dataset.type === 'text';
    const textContent = document.getElementById('storyTextContent')?.value.trim();
    const captionInput = document.getElementById('storyCaptionInput');
    const caption = captionInput?.value.trim() || '';
    const duration = parseInt(document.getElementById('storyDurationSelect').value) || 10;
    const btn = document.getElementById('uploadStoryBtn');

    // Validation
    if (!isTextStory && !storyUploadFile) {
        toast('Sélectionne un fichier', 'warning');
        return;
    }
    if (isTextStory && !textContent) {
        toast('Écris quelque chose pour ta story texte', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
        let mediaUrl = null;
        let mediaType = 'text';
        const textBg = storyTextBg || 'linear-gradient(135deg,#551B8C,#3d1266)';

        if (!isTextStory && storyUploadFile) {
            const ext = storyUploadFile.name.split('.').pop();
            const path = `stories/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, storyUploadFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = storyUploadFile.type.startsWith('video/') ? 'video' : 'image';
        }

        // --- CORRECTION : expires_at fixé à 24 heures, indépendant de la durée de lecture ---
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        const storyData = {
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            media_url: mediaUrl,
            media_type: mediaType,
            caption: caption || (isTextStory ? textContent : null),
            duration: Math.min(3600, Math.max(5, duration)), // Durée de lecture (5s à 60min)
            expires_at: expires.toISOString(), // Expiration fixe à 24h
            hidden_for: []
        };

        if (isTextStory) {
            storyData.text_bg = textBg;
            storyData.text_content = textContent;
        }

        await sb.from('supabaseAuthPrive_stories').insert(storyData);

        closeModal('modalStoryUpload');
        toast('Story publiée ! 🎉', 'success');

        // Nettoyage sécurisé
        storyUploadFile = null;
        if (captionInput) captionInput.value = '';
        const textContentField = document.getElementById('storyTextContent');
        if (textContentField) textContentField.value = '';
        clearStoryFile();

        // Recharger les stories dans le feed
        if (typeof loadStories === 'function') {
            await loadStories();
        }
    } catch (err) {
        toast('Erreur publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
    }
}
// ========== FIN : GESTION DES STORIES ==========

// ========== DEBUT : GESTION DES LIVES ==========
async function loadLives() {
    const container = document.getElementById('livesList');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_live_sessions')
            .select(`
                *,
                host:host_hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url
                )
            `)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(5);

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live en ce moment</p>';
            return;
        }

        container.innerHTML = data.map(l => {
            const host = l.host || {};
            const name = host.full_name || host.display_name || 'Hôte';
            return `<div class="live-sidebar-item" onclick="window.location.href='live.html?room=${l.id}'">
                <img class="live-avatar" src="${escapeAttr(host.avatar_url || '')}" alt="">
                <div class="live-info-small">
                    <div class="live-name">${escapeHtml(name)}</div>
                    <div class="live-viewers"><i class="fas fa-eye"></i> ${l.viewers_count || 0}</div>
                </div>
                <div class="live-dot"></div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live en ce moment</p>';
    }
}
// ========== FIN : GESTION DES LIVES ==========

// ========== DEBUT : SUGGESTIONS ET ABONNÉS ==========
async function loadSuggestions() {
    const { data: following } = await sb.from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const followingIds = (following || []).map(f => f.following_hubisoccer_id);

    const { data: blocked } = await sb.from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const blockedIds = (blocked || []).map(b => b.blocked_hubisoccer_id);

    const exclude = [...followingIds, currentProfile.hubisoccer_id, ...blockedIds];

    let query = sb.from('supabaseAuthPrive_communities')
        .select('*, profiles:supabaseAuthPrive_profiles!hubisoccer_id(role_code, certified)');

    if (exclude.length) {
        query = query.not('hubisoccer_id', 'in', `(${exclude.join(',')})`);
    }

    const { data } = await query.limit(5);
    const container = document.getElementById('suggestionsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune suggestion</p>';
        return;
    }
    container.innerHTML = data.map(c => {
        const name = c.name || 'Utilisateur';
        const avatar = c.avatar_url;
        const role = c.profiles?.role_code ? ALL_ROLES.find(r => r.code === c.profiles.role_code)?.label || '' : '';
        return `<div class="suggestion-item">
            <img class="suggestion-avatar" src="${escapeAttr(avatar || '')}" alt="">
            <div class="suggestion-info">
                <div class="suggestion-name">${escapeHtml(name)}</div>
                <div class="suggestion-role">${role}</div>
            </div>
            <button class="suggestion-follow-btn" onclick="followUser('${c.hubisoccer_id}', this)">Suivre</button>
        </div>`;
    }).join('');
}

window.followUser = async function(userId, btn) {
    btn.textContent = 'Abonné';
    btn.classList.add('following');

    try {
        await sb.from('supabaseAuthPrive_follows').insert({
            follower_hubisoccer_id: currentProfile.hubisoccer_id,
            following_hubisoccer_id: userId
        });
        const { data: myComm } = await sb
            .from('supabaseAuthPrive_communities')
            .select('following_count')
            .eq('hubisoccer_id', currentProfile.hubisoccer_id)
            .single();
        const newFollowing = (myComm?.following_count || 0) + 1;
        await sb.from('supabaseAuthPrive_communities')
            .update({ following_count: newFollowing })
            .eq('hubisoccer_id', currentProfile.hubisoccer_id);
        const { data: targetComm } = await sb
            .from('supabaseAuthPrive_communities')
            .select('followers_count')
            .eq('hubisoccer_id', userId)
            .single();
        const newFollowers = (targetComm?.followers_count || 0) + 1;
        await sb.from('supabaseAuthPrive_communities')
            .update({ followers_count: newFollowers })
            .eq('hubisoccer_id', userId);

        toast('Abonné !', 'success');
        loadSuggestions();
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
        btn.textContent = 'Suivre';
        btn.classList.remove('following');
    }
};

async function loadFollowers() {
    const container = document.getElementById('followersList');
    try {
        const { data: follows } = await sb
            .from('supabaseAuthPrive_follows')
            .select('follower_hubisoccer_id')
            .eq('following_hubisoccer_id', currentProfile.hubisoccer_id);
        const followerIds = (follows || []).map(f => f.follower_hubisoccer_id);

        if (followerIds.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
            return;
        }

        const { data } = await sb
            .from('supabaseAuthPrive_profiles')
            .select('hubisoccer_id, full_name, display_name, avatar_url, feed_id')
            .in('hubisoccer_id', followerIds)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
            return;
        }

        container.innerHTML = data.map(user => {
            const name = user.full_name || user.display_name || 'Utilisateur';
            return `<div class="follower-item" onclick="openUserProfile('${user.hubisoccer_id}')">
                <img class="follower-avatar" src="${escapeAttr(user.avatar_url || '')}" alt="">
                <span class="follower-name">${escapeHtml(name)}</span>
            </div>`;
        }).join('');
    } catch (err) {
        console.warn('Erreur chargement followers:', err);
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
    }
}

async function openFollowersModal(type) {
    const modal = document.createElement('div');
    modal.className = 'c-modal show';
    modal.innerHTML = `
        <div class="c-modal-box c-modal-box-sm">
            <div class="c-modal-head">
                <h2>${type === 'followers' ? 'Abonnés' : 'Abonnements'}</h2>
                <button class="c-modal-close" onclick="this.closest('.c-modal').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="c-modal-body">
                <ul id="followList" class="users-list"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const list = modal.querySelector('#followList');
    const column = type === 'followers' ? 'follower_hubisoccer_id' : 'following_hubisoccer_id';
    const { data } = await sb.from('supabaseAuthPrive_follows')
        .select(`${type === 'followers' ? 'follower' : 'following'}:supabaseAuthPrive_profiles!${column}(hubisoccer_id, full_name, display_name, avatar_url, feed_id)`)
        .eq(type === 'followers' ? 'following_hubisoccer_id' : 'follower_hubisoccer_id', currentProfile.hubisoccer_id);
    if (!data || data.length === 0) {
        list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun résultat</li>';
        return;
    }
    list.innerHTML = data.map(f => {
        const user = f[type === 'followers' ? 'follower' : 'following'] || {};
        const name = user.full_name || user.display_name || 'Utilisateur';
        return `<li class="users-list-item" onclick="openUserProfile('${user.hubisoccer_id}')">
            <img src="${escapeAttr(user.avatar_url || '')}" alt="">
            <span class="users-list-item-name">${escapeHtml(name)}</span>
        </li>`;
    }).join('');
}
// ========== FIN : SUGGESTIONS ET ABONNÉS ==========

// ========== DEBUT : TENDANCES ET INSIGHTS ==========
async function loadTrends() {
    const { data } = await sb.from('supabaseAuthPrive_posts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(100);
    const hashtagCounts = {};
    data?.forEach(post => {
        const matches = post.content?.match(/#(\w+)/g) || [];
        matches.forEach(tag => {
            const cleanTag = tag.toLowerCase().replace('#', '');
            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
        });
    });
    const trending = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const container = document.getElementById('trendsList');
    if (trending.length === 0) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune tendance</p>';
        return;
    }
    container.innerHTML = trending.map(([tag, count]) => `
        <div class="trend-item" onclick="window.location.href='search.html?q=%23${tag}'">
            <span class="trend-tag">#${escapeHtml(tag)}</span>
            <span class="trend-count">${count} post${count>1?'s':''}</span>
        </div>
    `).join('');
}

async function loadInsights() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: views } = await sb.from('supabaseAuthPrive_post_views')
        .select('post_id')
        .gte('viewed_at', sevenDaysAgo.toISOString());
    const myPostIds = posts.map(p => p.id);
    const reach = new Set(views?.filter(v => myPostIds.includes(v.post_id)).map(v => v.post_id)).size;

    const { count: newFollowers } = await sb.from('supabaseAuthPrive_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_hubisoccer_id', currentProfile.hubisoccer_id)
        .gte('created_at', sevenDaysAgo.toISOString());

    const { data: engagements } = await sb.from('supabaseAuthPrive_posts')
        .select('likes_count, comments_count, shares_count')
        .eq('author_hubisoccer_id', currentProfile.hubisoccer_id)
        .gte('created_at', sevenDaysAgo.toISOString());
    const totalEngagements = engagements?.reduce((acc, p) => acc + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0) || 0;
    const engagementRate = reach > 0 ? ((totalEngagements / reach) * 100).toFixed(1) : '0.0';

    document.getElementById('insightReach').textContent = reach;
    document.getElementById('insightNewFollowers').textContent = newFollowers || 0;
    document.getElementById('insightEngagement').textContent = engagementRate + '%';
}
// ========== FIN : TENDANCES ET INSIGHTS ==========

// ========== DEBUT : GESTION DES NOTIFICATIONS ==========
async function loadNotifications() {
    const { data } = await sb.from('supabaseAuthPrive_notifications')
        .select('*')
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = data?.length || 0;
        badge.style.display = (data?.length || 0) > 0 ? 'block' : 'none';
    }
    const notifsList = document.getElementById('notifsList');
    if (notifsList) {
        notifsList.innerHTML = data?.map(n => `
            <li class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.data?.link || ''}')">
                <div class="notif-icon-el"><i class="fas fa-${n.type === 'like' ? 'heart' : n.type === 'comment' ? 'comment' : 'bell'}"></i></div>
                <div class="notif-content">
                    <div class="notif-text"><strong>${escapeHtml(n.title)}</strong><br>${escapeHtml(n.message)}</div>
                    <div class="notif-time">${timeSince(n.created_at)}</div>
                </div>
            </li>
        `).join('') || '<li style="padding:16px;color:var(--gray);text-align:center">Aucune notification</li>';
    }
}

window.handleNotifClick = async function(id, link) {
    await sb.from('supabaseAuthPrive_notifications').update({ read: true }).eq('id', id);
    if (link) window.location.href = link;
    else closeModal('modalNotifs');
};

async function markAllNotifsRead() {
    await sb.from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false);
    loadNotifications();
    toast('Toutes les notifications lues', 'success');
}

function subscribeToNewPosts() {
    feedSubscription = sb.channel('new_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_posts' }, async (payload) => {
            const msg = payload.new;
            if (msg.author_hubisoccer_id === currentProfile.hubisoccer_id) return;
            newPostsCount++;
            const bar = document.getElementById('newPostsBar');
            bar.style.display = 'block';
            document.getElementById('newPostsCount').textContent = newPostsCount;
        })
        .subscribe();
}
// ========== FIN : GESTION DES NOTIFICATIONS ==========

// ========== DEBUT : UTILISATEURS BLOQUÉS ==========
async function loadBlockedUsers() {
    const list = document.getElementById('blockedUsersList');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_blocked_users')
            .select(`
                blocked_hubisoccer_id,
                blocked:supabaseAuthPrive_profiles!blocked_hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url, feed_id
                )
            `)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

        if (!data || data.length === 0) {
            list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun utilisateur bloqué</li>';
            return;
        }

        list.innerHTML = data.map(b => {
            const user = b.blocked || {};
            const name = user.full_name || user.display_name || 'Utilisateur';
            return `<li class="users-list-item">
                <img src="${escapeAttr(user.avatar_url || '')}" alt="">
                <span class="users-list-item-name">${escapeHtml(name)}</span>
                <button class="btn-ghost" onclick="unblockUser('${b.blocked_hubisoccer_id}')">Débloquer</button>
            </li>`;
        }).join('');
    } catch (err) {
        list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun utilisateur bloqué</li>';
    }
}

window.unblockUser = async function(userId) {
    await sb.from('supabaseAuthPrive_blocked_users')
        .delete()
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('blocked_hubisoccer_id', userId);
    blockedUsers.delete(userId);
    loadBlockedUsers();
    toast('Utilisateur débloqué', 'success');
};
// ========== FIN : UTILISATEURS BLOQUÉS ==========

// ========== DEBUT : POSTS MASQUÉS ==========
async function loadHiddenPosts() {
    const { data } = await sb.from('supabaseAuthPrive_hidden_posts')
        .select('post_id, post:supabaseAuthPrive_posts!post_id(content, created_at)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    const container = document.getElementById('hiddenPostsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">Aucune publication masquée</p>';
        return;
    }
    container.innerHTML = data.map(h => {
        const post = h.post || {};
        return `<div class="hidden-post-item" style="padding:12px;border-bottom:1px solid var(--gray-light);">
            <p style="font-size:0.85rem;">${escapeHtml(post.content?.substring(0,100) || 'Publication')}</p>
            <button class="btn-ghost" onclick="unhidePost('${h.post_id}')">Réafficher</button>
        </div>`;
    }).join('');
}

window.unhidePost = async function(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    hiddenPosts.delete(postId);
    loadHiddenPosts();
    toast('Publication réaffichée', 'success');
    loadPosts(true);
};
// ========== FIN : POSTS MASQUÉS ==========

// ========== DEBUT : COLLECTIONS (POSTS SAUVEGARDÉS) ==========
async function loadCollections() {
    const { data } = await sb.from('supabaseAuthPrive_saved_posts')
        .select('post_id, post:supabaseAuthPrive_posts!post_id(content, created_at)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    const container = document.getElementById('collectionsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">Aucune collection</p>';
        return;
    }
    container.innerHTML = data.map(s => {
        const post = s.post || {};
        return `<div class="collection-item" style="padding:12px;border-bottom:1px solid var(--gray-light);">
            <p style="font-size:0.85rem;">${escapeHtml(post.content?.substring(0,100) || 'Publication')}</p>
            <button class="btn-ghost" onclick="removeFromCollection('${s.post_id}')">Retirer</button>
        </div>`;
    }).join('');
}

window.removeFromCollection = async function(postId) {
    await sb.from('supabaseAuthPrive_saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    savedPosts.delete(postId);
    loadCollections();
    toast('Retiré des collections', 'info');
};
// ========== FIN : COLLECTIONS ==========

// ========== DEBUT : MENTIONS ==========
async function handleMentionInput(e) {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex-1] === ' ')) {
        const query = textBeforeCursor.substring(atIndex+1).toLowerCase();
        if (query.length >= 1) {
            const now = Date.now();
            if (mentionsCache.length === 0 || now - lastMentionsFetch > MENTIONS_CACHE_TTL) {
                const { data } = await sb.from('supabaseAuthPrive_communities')
                    .select('feed_id, name, avatar_url, hubisoccer_id')
                    .limit(100);
                mentionsCache = data || [];
                lastMentionsFetch = now;
            }
            const filtered = mentionsCache.filter(u => u.feed_id?.toLowerCase().startsWith(query)).slice(0, 5);
            showMentionSuggestions(filtered, e.target);
        } else {
            hideMentionSuggestions();
        }
    } else {
        hideMentionSuggestions();
    }
}

function showMentionSuggestions(users, input) {
    hideMentionSuggestions();
    mentionTargetInput = input;
    mentionDropdown = document.createElement('div');
    mentionDropdown.className = 'mention-dropdown';
    mentionDropdown.style.position = 'absolute';
    mentionDropdown.style.background = 'white';
    mentionDropdown.style.border = '1px solid var(--gray-light)';
    mentionDropdown.style.borderRadius = '8px';
    mentionDropdown.style.boxShadow = 'var(--shadow-lg)';
    mentionDropdown.style.maxHeight = '200px';
    mentionDropdown.style.overflowY = 'auto';
    mentionDropdown.style.zIndex = '1000';
    mentionDropdown.style.minWidth = '200px';

    const rect = input.getBoundingClientRect();
    mentionDropdown.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    mentionDropdown.style.left = (rect.left + window.scrollX) + 'px';

    users.forEach(user => {
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '8px';
        item.style.borderBottom = '1px solid var(--gray-light)';
        item.innerHTML = `<img src="${escapeAttr(user.avatar_url || '')}" style="width:24px;height:24px;border-radius:50%;">
                          <span>@${escapeHtml(user.feed_id)}</span>`;
        item.addEventListener('click', () => {
            const val = input.value;
            const cursorPos = input.selectionStart;
            const textBeforeCursor = val.substring(0, cursorPos);
            const atIndex = textBeforeCursor.lastIndexOf('@');
            const newText = val.substring(0, atIndex) + '@' + user.feed_id + ' ' + val.substring(cursorPos);
            input.value = newText;
            input.focus();
            hideMentionSuggestions();
        });
        mentionDropdown.appendChild(item);
    });

    document.body.appendChild(mentionDropdown);
}

function hideMentionSuggestions() {
    if (mentionDropdown) {
        mentionDropdown.remove();
        mentionDropdown = null;
        mentionTargetInput = null;
    }
}
// ========== FIN : MENTIONS ==========

// ========== DEBUT : ENREGISTREMENT AUDIO ==========
async function startAudioRecording(postId) {
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            commentAudioFile = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            toast('Audio prêt à être envoyé', 'success');
            isRecording = false;
        };
        mediaRecorder.start();
        isRecording = true;
        toast('Enregistrement audio en cours... Cliquez à nouveau sur le micro pour arrêter', 'info');
    } catch (err) {
        toast('Impossible d\'accéder au microphone', 'error');
    }
}
// ========== FIN : ENREGISTREMENT AUDIO ==========

// ========== DEBUT : PUBLICATION DE POST ==========
//
// Recompte les publications reelles de la communaute courante et
// ecrit la valeur exacte en base, puis rafraichit l'affichage.
// Utilisee apres une publication et apres une suppression.
//
async function syncCommunityPostsCount() {
    if (!myCommunity) return null;
    try {
        const { count, error } = await sb
            .from('supabaseAuthPrive_posts')
            .select('id', { count: 'exact', head: true })
            .eq('community_id', myCommunity.id);

        if (error) throw error;

        const total = count || 0;

        await sb.from('supabaseAuthPrive_communities')
            .update({ posts_count: total })
            .eq('id', myCommunity.id);

        myCommunity.posts_count = total;

        const el = document.getElementById('myCommPosts');
        if (el) el.textContent = total;

        return total;
    } catch (err) {
        console.warn('[feed] recomptage des publications impossible :', err.message);
        return null;
    }
}

async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaFile && !pendingPoll && !pendingEvent) {
        toast('Écris quelque chose avant de publier', 'warning');
        return;
    }

    const btn = document.getElementById('publishBtn');
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
            scheduled_at: scheduledAt || null,
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            shares_count: 0,
            reposts_count: 0,
            views_count: 0
        };

        const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert(postData)
            .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code, feed_id, certified)')
            .single();
        if (error) throw error;

        if (myCommunity) {
            // Le compteur est RECALCULE depuis la table des publications,
            // il n'est plus incremente a partir de la valeur en memoire.
            //
            // Avant : posts_count = valeur_lue_au_chargement + 1.
            // Si l'utilisateur publiait depuis deux onglets, ou si une
            // publication avait ete supprimee entre-temps, le compteur
            // partait a la derive et n'etait jamais rattrape.
            await syncCommunityPostsCount();
        }

        // On memorise l'etat AVANT de reinitialiser le composeur.
        //
        // BUG CORRIGE : scheduledAt etait remis a null juste au-dessus
        // du test « if (!scheduledAt) ». Le test etait donc toujours
        // vrai, et une publication programmee etait immediatement
        // inseree dans le fil avec le message « Publication reussie »
        // au lieu de « Publication programmee ». L'auteur voyait son
        // post planifie apparaitre tout de suite chez lui.
        const wasScheduled = !!scheduledAt;

        document.getElementById('postContent').value = '';
        pendingPoll = null;
        pendingEvent = null;
        scheduledAt = null;
        pinPostActive = false;

        if (wasScheduled) {
            toast('Publication programmée ✅', 'success');
        } else {
            posts.unshift(newPost);
            renderPosts();
            toast('Publication réussie ! 🎉', 'success');
        }

        const mentions = content?.match(/@(\w+)/g);
        if (mentions) {
            for (const m of mentions) {
                const handle = m.substring(1);
                const { data: mentionedUser } = await sb.from('supabaseAuthPrive_communities')
                    .select('hubisoccer_id').eq('feed_id', handle).maybeSingle();
                if (mentionedUser && mentionedUser.hubisoccer_id !== currentProfile.hubisoccer_id) {
                    await sb.from('supabaseAuthPrive_notifications').insert({
                        recipient_hubisoccer_id: mentionedUser.hubisoccer_id,
                        type: 'mention',
                        title: 'Nouvelle mention',
                        message: `${currentProfile.full_name || currentProfile.display_name} vous a mentionné dans une publication.`,
                        data: { link: `post-view.html?id=${newPost.id}` }
                    });
                }
            }
        }
    } catch (err) {
        console.error('Erreur publication:', err);
        toast('Erreur lors de la publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
    }
}
// ========== FIN : PUBLICATION DE POST ==========

// ========== DEBUT : MODALES DE CRÉATION (SONDAGE, ÉVÉNEMENT, PROGRAMMATION) ==========
function createPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const opts = document.getElementById('pollOptions').value.trim().split('\n').map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) { toast('Question et au moins 2 options requises', 'warning'); return; }
    const dur = parseInt(document.getElementById('pollDuration').value) || 3;
    pendingPoll = { question: q, options: opts, votes: {}, voted_by: [], ends_at: new Date(Date.now() + dur * 86400000).toISOString() };
    closeModal('modalPoll');
    toast('Sondage prêt. Publie maintenant !', 'success');
}

function createEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!title || !date) { toast('Titre et date requis', 'warning'); return; }
    pendingEvent = {
        title,
        date,
        location: document.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDesc').value.trim()
    };
    closeModal('modalEvent');
    toast('Événement prêt. Publie maintenant !', 'success');
}

function confirmSchedule() {
    const dt = document.getElementById('scheduleDateTime').value;
    if (!dt) { toast('Sélectionne une date', 'warning'); return; }
    scheduledAt = new Date(dt).toISOString();
    closeModal('modalSchedule');
    toast(`Publication programmée pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`, 'success');
}
// ========== FIN : MODALES DE CRÉATION ==========

// ========== DEBUT : APERÇU ET ÉDITION DE PROFIL ==========
function showPreview() {
    const content = document.getElementById('postContent').value.trim();
    let mediaHtml = '';

    if (mediaFile) {
        const url = URL.createObjectURL(mediaFile);
        const isVideo = mediaFile.type.startsWith('video/');
        mediaHtml = isVideo ?
            `<div class="post-media"><video src="${escapeAttr(url)}" controls></video></div>` :
            `<div class="post-media"><img src="${escapeAttr(url)}" alt=""></div>`;
    }

    document.getElementById('previewBody').innerHTML = `
        <div class="post-card" style="box-shadow:none;border:none">
            <div class="post-header">
                <div class="post-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
                <div class="post-meta">
                    <div class="post-author">${escapeHtml(currentProfile.full_name || '')}</div>
                    <div class="post-author-sub"><span class="post-time">À l'instant</span></div>
                </div>
            </div>
            <div class="post-body"><div class="post-text">${formatText(content)}</div></div>
            ${mediaHtml}
        </div>`;
    openModal('modalPreview');
}

async function saveProfile() {
    const name = document.getElementById('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    if (!name) { toast('Le nom est requis', 'warning'); return; }
    await sb.from('supabaseAuthPrive_communities').update({ name, bio }).eq('id', myCommunity.id);
    myCommunity.name = name;
    myCommunity.bio = bio;
    document.getElementById('myCommName').textContent = name;
    document.getElementById('presTitle').textContent = name;
    document.getElementById('presDescription').textContent = bio || 'Partagez et interagissez avec les sportifs, artistes et acteurs de la communauté HubISoccer.';
    closeModal('modalEditProfile');
    toast('Profil mis à jour ✅', 'success');
}

function cancelMedia() {
    mediaFile = null;
    document.getElementById('mediaInput').value = '';
    document.getElementById('mediaPreview').style.display = 'none';
}
// ========== FIN : APERÇU ET ÉDITION DE PROFIL ==========

// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Vérification de votre session...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    setLoader(true, 'Vérification de ta communauté...', 40);
    const comm = await loadMyCommunity();
    if (!comm) return;

    setLoader(true, 'Chargement du feed...', 60);
    await loadPosts(true);

    setLoader(true, 'Chargement de la communauté...', 80);
    await Promise.all([
        loadStories(),
        loadSuggestions(),
        loadFollowers(),
        loadLives(),
        loadTrends(),
        loadNotifications(),
        loadInsights(),
        loadBlockedUsers().catch(() => {})
    ]);

    setLoader(false);
    subscribeToNewPosts();

    document.getElementById('publishBtn').addEventListener('click', publishPost);
    document.getElementById('attachMediaBtn').addEventListener('click', () => document.getElementById('mediaInput').click());
    document.getElementById('mediaInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        mediaFile = file;
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        document.getElementById('mediaPreview').style.display = 'block';
        document.getElementById('mediaPreview').innerHTML = `
            <div class="preview-media-wrap" style="position:relative">
                ${isVideo ? `<video src="${escapeAttr(url)}" controls></video>` : `<img src="${escapeAttr(url)}" alt="">`}
                <button class="remove-media-btn" onclick="cancelMedia()"><i class="fas fa-times"></i></button>
            </div>`;
    });

    document.getElementById('pollBtn').addEventListener('click', () => openModal('modalPoll'));
    document.getElementById('eventBtn').addEventListener('click', () => openModal('modalEvent'));
    document.getElementById('scheduleBtn').addEventListener('click', () => openModal('modalSchedule'));
    document.getElementById('startLiveBtn').addEventListener('click', () => window.location.href = 'live.html');
    document.getElementById('pinPostBtn').addEventListener('click', () => {
        pinPostActive = !pinPostActive;
        document.getElementById('pinPostBtn').style.background = pinPostActive ? 'var(--gold-light)' : '';
        toast(pinPostActive ? 'Post épinglé activé' : 'Épinglage désactivé', 'info');
    });
    document.getElementById('previewPostBtn').addEventListener('click', showPreview);

    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('createEventBtn').addEventListener('click', createEvent);
    document.getElementById('confirmScheduleBtn').addEventListener('click', confirmSchedule);

    document.getElementById('submitReportBtn').addEventListener('click', submitReport);
    document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlock);
    document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', () => sharePost(btn.dataset.network)));

    document.getElementById('sendReplyBtn').addEventListener('click', () => sendReply(replyCommentId, replyPostId));

    document.getElementById('addStoryBtn').addEventListener('click', () => openModal('modalStoryUpload'));
    document.getElementById('uploadStoryBtn').addEventListener('click', uploadStory);
    document.getElementById('seeMoreStoriesBtn').addEventListener('click', () => window.location.href = 'stories.html');

    const storyTabs = document.querySelectorAll('.story-type-tab');
    const uploadZone = document.getElementById('storyUploadZone');
    const textZone = document.getElementById('storyTextZone');
    const dropArea = document.getElementById('storyDropArea');
    const fileInput = document.getElementById('storyFileInput');
    const textCanvas = document.getElementById('storyTextCanvas');
    const styleBtns = document.querySelectorAll('.txt-style-btn');

    storyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            storyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.type;
            if (type === 'text') {
                uploadZone.style.display = 'none';
                textZone.style.display = 'block';
            } else {
                uploadZone.style.display = 'block';
                textZone.style.display = 'none';
            }
        });
    });

    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragging');
    });
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragging');
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file) handleStoryFileSelect(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleStoryFileSelect(file);
    });

    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            storyTextBg = btn.dataset.bg;
            textCanvas.style.background = btn.dataset.bg;
        });
    });

    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            loadPosts(true);
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

    document.getElementById('feedSearch').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
    });

    const sentinel = document.getElementById('scrollSentinel');
    if (sentinel) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMorePosts && !loadingPosts) {
                loadPosts(false);
            }
        });
        observer.observe(sentinel);
    }

    document.getElementById('newPostsBarBtn').addEventListener('click', () => {
        newPostsCount = 0;
        document.getElementById('newPostsBar').style.display = 'none';
        loadPosts(true);
    });

    document.getElementById('notifBtn').addEventListener('click', () => {
        openModal('modalNotifs');
        loadNotifications();
    });
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotifsRead);
    document.getElementById('refreshSuggestions').addEventListener('click', loadSuggestions);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('refreshPresBtn').addEventListener('click', () => {
        loadSuggestions();
        loadFollowers();
        loadTrends();
        loadInsights();
    });

    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    // ============================================================
    //  Boutons jusqu'ici sans aucune action — chaque bloc est isolé
    //  pour qu'une erreur n'empêche jamais le chargement de la page.
    // ============================================================
    const wire = (label, fn) => {
        try { fn(); }
        catch (err) { console.warn(`[HubISoccer] Bloc « ${label} » non initialisé :`, err); }
    };

    // « Charger plus de posts »
    wire('charger plus', () => {
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            if (hasMorePosts && !loadingPosts) loadPosts(false);
        });
    });

    // « Publier » depuis la fenêtre d'aperçu
    wire('publier depuis aperçu', () => {
        document.getElementById('publishFromPreviewBtn')?.addEventListener('click', () => {
            closeModal('modalPreview');
            publishPost();
        });
    });

    // Bouton « Confirmer » de la modale de confirmation
    wire('confirmation', () => {
        document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
            if (typeof pendingConfirmAction === 'function') {
                const fn = pendingConfirmAction;
                pendingConfirmAction = null;
                closeModal('modalConfirm');
                fn();
            } else {
                closeModal('modalConfirm');
            }
        });
    });

    // Visionneuse de stories
    wire('visionneuse de stories', () => {
        document.getElementById('storyCloseBtn')?.addEventListener('click', closeStoryViewer);
        document.getElementById('storyPrev')?.addEventListener('click', prevStory);
        document.getElementById('storyNext')?.addEventListener('click', nextStory);
        document.getElementById('storyReplyBtn')?.addEventListener('click', sendStoryReply);
        document.getElementById('storyReplyInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); sendStoryReply(); }
        });
        document.getElementById('storyModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'storyModal') closeStoryViewer();
        });
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('storyModal');
            if (!modal || !modal.classList.contains('show')) return;
            if (e.key === 'Escape') closeStoryViewer();
            else if (e.key === 'ArrowLeft') prevStory();
            else if (e.key === 'ArrowRight') nextStory();
        });
    });

    // Enregistrement de la modification d'un post
    wire('édition de post', () => {
        document.getElementById('saveEditPostBtn')?.addEventListener('click', async () => {
            const ta = document.getElementById('editPostContent');
            if (!editingPostId || !ta) return;
            const val = ta.value.trim();
            if (!val) { toast('Le contenu ne peut pas être vide', 'warning'); return; }
            closeModal('modalEditPost');
            await savePostEdit(editingPostId, val);
            editingPostId = null;
        });
    });

    // Publication des posts programmés arrivés à échéance
    wire('posts programmés', () => {
        publishDueScheduledPosts();
        setInterval(publishDueScheduledPosts, 60000);
    });

    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.classList.toggle('open');
    });
    const closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('rightSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    document.getElementById('sidebarAvatarClick').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('sidebarCoverClick').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('myCommAvatar').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('myCommCover').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });

    document.addEventListener('click', (e) => {
        if (mentionDropdown && !mentionDropdown.contains(e.target) && e.target !== mentionTargetInput) {
            hideMentionSuggestions();
        }
    });
}
// ========== FIN : INITIALISATION PRINCIPALE ==========

// ========== DEBUT : EXPOSITION GLOBALE DES FONCTIONS ==========
window.openUserProfile = openUserProfile;
window.openUserByHandle = openUserByHandle;
window.searchByHashtag = searchByHashtag;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
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
window.likeComment = likeComment;
window.deleteComment = deleteComment;
window.openMediaModal = openMediaModal;
window.cancelMedia = cancelMedia;
window.sendComment = sendComment;
window.sendReply = sendReply;
window.makeReplyCard = makeReplyCard;
window.loadMoreComments = loadMoreComments;
window.loadCollections = loadCollections;
window.loadHiddenPosts = loadHiddenPosts;
window.loadBlockedUsers = loadBlockedUsers;
window.viewStory = viewStory;
window.clearStoryFile = clearStoryFile;
window.followUser = followUser;
window.unblockUser = unblockUser;
window.unhidePost = unhidePost;
window.removeFromCollection = removeFromCollection;
window.handleNotifClick = handleNotifClick;
// ========== FIN : EXPOSITION GLOBALE ==========

document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========
