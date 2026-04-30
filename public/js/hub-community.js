// ========== HUB-COMMUNITY.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (FRANÇAIS & ANGLAIS) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER-PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'nos_clubs': 'NOS CLUBS',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Connexion',
        'inscrire': 'S\'inscrire',
        'community.title': 'Hub Community',
        'community.subtitle': 'Découvrez les talents du monde entier. Interagissez sans limite (100 commentaires max sans compte).',
        'post.like': 'J\'aime',
        'post.dislike': 'Je n\'aime pas',
        'post.share': 'Partager',
        'post.reply': 'Répondre',
        'post.report': 'Signaler',
        'post.see_more': 'Voir plus',
        'post.see_less': 'Voir moins',
        'post.entity_link': 'Accéder à {entity}',
        'toast.error_load': 'Erreur chargement des posts',
        'toast.error_like': 'Erreur lors du like',
        'toast.error_comment': 'Erreur lors de l\'ajout du commentaire',
        'toast.error_report': 'Erreur lors du signalement',
        'toast.limit_reached': 'Limite de 100 commentaires atteinte. Connectez-vous pour continuer.',
        'toast.need_login': 'Veuillez vous connecter pour commenter',
        'toast.comment_success': 'Commentaire ajouté',
        'toast.report_success': 'Signalement envoyé',
        'toast.share_success': 'Lien copié !',
        'toast.share_error': 'Erreur lors du partage',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'FIRST STEP',
        'acteurs': 'BECOME AN ACTOR',
        'artiste': 'BECOME AN ARTIST',
        'nos_clubs': 'OUR CLUBS',
        'tournoi_public': 'PUBLIC TOURNAMENT',
        'esp': 'LEARN MORE',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'community.title': 'Hub Community',
        'community.subtitle': 'Discover talents from around the world. Interact without limits (100 comments max without account).',
        'post.like': 'Like',
        'post.dislike': 'Dislike',
        'post.share': 'Share',
        'post.reply': 'Reply',
        'post.report': 'Report',
        'post.see_more': 'See more',
        'post.see_less': 'See less',
        'post.entity_link': 'Go to {entity}',
        'toast.error_load': 'Error loading posts',
        'toast.error_like': 'Error liking post',
        'toast.error_comment': 'Error adding comment',
        'toast.error_report': 'Error reporting',
        'toast.limit_reached': 'Limit of 100 comments reached. Please login to continue.',
        'toast.need_login': 'Please login to comment',
        'toast.comment_success': 'Comment added',
        'toast.report_success': 'Report sent',
        'toast.share_success': 'Link copied!',
        'toast.share_error': 'Error sharing',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    }
};

let currentLang = localStorage.getItem('hubiLang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        loadPosts();
    }
}
// ========== FIN : TRADUCTIONS ==========

// ========== DÉBUT : ÉTAT ==========
let currentUserId = null;
let currentUserNom = 'Visiteur';
let commentCount = parseInt(localStorage.getItem('visitor_comment_count_hub')) || 0;
let isLoggedIn = false;
const MAX_COMMENTS = 100;
// ========== FIN : ÉTAT ==========

// ========== DÉBUT : VÉRIFICATION CONNEXION ==========
async function checkAuth() {
    const userId = sessionStorage.getItem('tournoi_user_id') || localStorage.getItem('hubisoccer_user_id');
    const userNom = sessionStorage.getItem('tournoi_nom') || localStorage.getItem('hubisoccer_user_nom');
    if (userId && userNom) {
        currentUserId = userId;
        currentUserNom = userNom;
        isLoggedIn = true;
    } else {
        currentUserId = 'visitor';
        isLoggedIn = false;
    }
}
// ========== FIN : VÉRIFICATION CONNEXION ==========

// ========== DÉBUT : CHARGEMENT DES POSTS ==========
async function loadPosts() {
    showLoader();
    try {
        const { data: posts, error } = await supabasePublic
            .from('public_community_posts')
            .select(`
                *,
                profiles:user_id (id, nom, avatar_url),
                comments:public_community_comments(
                    id, content, created_at, parent_id, user_id,
                    profiles:user_id (id, nom, avatar_url)
                ),
                likes:public_community_likes(user_id)
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderPosts(posts || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load'), 'error');
        document.getElementById('postsFeed').innerHTML = '<p class="error-message">' + t('toast.error_load') + '</p>';
    } finally {
        hideLoader();
    }
}

function renderPosts(posts) {
    const container = document.getElementById('postsFeed');
    if (!posts.length) {
        container.innerHTML = '<p class="empty-message">Aucun post pour le moment.</p>';
        return;
    }
    let html = '';
    for (const post of posts) {
        const userLiked = post.likes?.some(l => l.user_id === currentUserId) || false;
        const commentsTree = buildCommentsTree(post.comments || []);
        html += `
            <div class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <img src="${post.profiles?.avatar_url || 'img/user-default.jpg'}" alt="Avatar">
                    <div class="post-author">
                        <h4>${escapeHtml(post.profiles?.nom || 'Anonyme')}</h4>
                        <small>${new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="post-content" id="post-text-${post.id}">
                    ${renderPostContent(post.content)}
                </div>
                ${post.media_url ? `
                <div class="post-media" data-media-url="${escapeHtml(post.media_url)}" data-media-type="${getMediaType(post.media_url)}">
                    ${getMediaPreview(post.media_url)}
                </div>` : ''}
                ${post.entity_type && post.entity_name ? `
                <div class="post-entity-link">
                    <a href="${getEntityLink(post.entity_type, post.entity_id)}" class="btn-entity">
                        <i class="fas fa-external-link-alt"></i> ${t('post.entity_link', { entity: post.entity_name })}
                    </a>
                </div>` : ''}
                <div class="post-stats">
                    <span><i class="fas fa-thumbs-up"></i> ${post.likes_count || 0}</span>
                    <span><i class="fas fa-thumbs-down"></i> ${post.dislikes_count || 0}</span>
                    <span><i class="fas fa-comment"></i> ${countAllComments(post.comments || [])}</span>
                    <span><i class="fas fa-share"></i> ${post.shares_count || 0}</span>
                </div>
                <div class="post-actions">
                    <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post.id}"><i class="fas fa-thumbs-up"></i> ${t('post.like')}</button>
                    <button class="dislike-btn" data-id="${post.id}"><i class="fas fa-thumbs-down"></i> ${t('post.dislike')}</button>
                    <button class="share-btn" data-id="${post.id}"><i class="fas fa-share"></i> ${t('post.share')}</button>
                    <button class="report-btn" data-id="${post.id}" data-type="post"><i class="fas fa-flag"></i> ${t('post.report')}</button>
                </div>
                <div class="comments-section">
                    ${renderComments(commentsTree, post.id)}
                    ${!isLoggedIn && commentCount >= MAX_COMMENTS ? renderLimitMessage() : renderAddComment(post.id)}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderPostContent(content) {
    if (!content) return '';
    const maxLength = 300;
    if (content.length <= maxLength) return escapeHtml(content);
    const truncated = escapeHtml(content.substring(0, maxLength)) + '...';
    const full = escapeHtml(content);
    const postId = 'post-text-' + Math.random().toString(36).substr(2, 9);
    return `
        <span class="post-text-short">${truncated}</span>
        <span class="post-text-full" style="display: none;">${full}</span>
        <button class="btn-see-more" data-action="more">${t('post.see_more')}</button>
    `;
}

function getMediaType(url) {
    if (!url) return 'image';
    const ext = url.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
    return 'image';
}

function getMediaPreview(url) {
    const type = getMediaType(url);
    if (type === 'video') {
        return `<video src="${escapeHtml(url)}" muted preload="metadata" controls></video>`;
    }
    return `<img src="${escapeHtml(url)}" alt="media" loading="lazy">`;
}

function getEntityLink(type, id) {
    const links = {
        club: `nos-clubs/presentation/fiche-club.html?id=${id}`,
        tournoi: `tournoi.html?id=${id}`,
        scouting: `scouting.html?id=${id}`,
        market: `e-marketing-hubisoccer.html?id=${id}`,
        artiste: `artiste-adhesion.html?id=${id}`,
        sportif: `premier-pas.html?id=${id}`
    };
    return links[type] || '#';
}

function buildCommentsTree(comments) {
    const map = {};
    const roots = [];
    comments.forEach(c => { c.replies = []; map[c.id] = c; });
    comments.forEach(c => {
        if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(c);
        else roots.push(c);
    });
    return roots;
}

function renderComments(comments, postId) {
    let html = '';
    for (const c of comments) {
        html += `
            <div class="comment" data-id="${c.id}">
                <div class="comment-main">
                    <img src="${c.profiles?.avatar_url || 'img/user-default.jpg'}" alt="Avatar">
                    <div class="comment-content">
                        <span class="comment-author">${escapeHtml(c.profiles?.nom || 'Anonyme')}</span>
                        <span class="comment-text">${escapeHtml(c.content)}</span>
                    </div>
                </div>
                <div class="comment-footer">
                    <button class="reply-btn" data-id="${c.id}" data-post="${postId}">${t('post.reply')}</button>
                    <button class="report-btn" data-id="${c.id}" data-type="comment">${t('post.report')}</button>
                </div>
                ${renderReplies(c.replies, postId)}
            </div>
        `;
    }
    return html;
}

function renderReplies(replies, postId) {
    if (!replies.length) return '';
    let html = '<div class="comment-child">';
    for (const r of replies) {
        html += `
            <div class="comment">
                <div class="comment-main">
                    <img src="${r.profiles?.avatar_url || 'img/user-default.jpg'}" alt="Avatar">
                    <div class="comment-content">
                        <span class="comment-author">${escapeHtml(r.profiles?.nom || 'Anonyme')}</span>
                        <span class="comment-text">${escapeHtml(r.content)}</span>
                    </div>
                </div>
                <div class="comment-footer">
                    <button class="reply-btn" data-id="${r.id}" data-post="${postId}">${t('post.reply')}</button>
                    <button class="report-btn" data-id="${r.id}" data-type="comment">${t('post.report')}</button>
                </div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

function renderAddComment(postId) {
    return `
        <div class="add-comment">
            <img src="img/user-default.jpg" alt="Avatar">
            <input type="text" class="comment-input" data-id="${postId}" placeholder="Votre commentaire...">
            <button class="send-comment" data-id="${postId}">Envoyer</button>
        </div>
    `;
}

function renderLimitMessage() {
    return `
        <div class="comment-limit-message">
            <p>${t('toast.limit_reached')}</p>
            <a href="public/auth/login.html" class="btn-auth">${t('connexion')}</a>
            <a href="public/auth/signup.html" class="btn-auth gold">${t('inscrire')}</a>
        </div>
    `;
}

function countAllComments(comments) {
    let total = comments.length;
    for (const c of comments) {
        if (c.replies) total += c.replies.length;
    }
    return total;
}
// ========== FIN : RENDU ==========

// ========== DÉBUT : AJOUT DE COMMENTAIRE ==========
async function addComment(postId, content, parentId = null) {
    if (!isLoggedIn && commentCount >= MAX_COMMENTS) {
        showToast(t('toast.limit_reached'), 'warning');
        return false;
    }
    if (!content.trim()) return false;
    const payload = {
        post_id: postId,
        user_id: isLoggedIn ? currentUserId : 'visitor',
        content: content.trim(),
        parent_id: parentId
    };
    try {
        const { error } = await supabasePublic.from('public_community_comments').insert([payload]);
        if (error) throw error;
        if (!isLoggedIn) {
            commentCount++;
            localStorage.setItem('visitor_comment_count_hub', commentCount);
        }
        loadPosts();
        return true;
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_comment'), 'error');
        return false;
    }
}
// ========== FIN : COMMENTAIRE ==========

// ========== DÉBUT : LIKES / DISLIKES / SHARES / REPORTS ==========
async function toggleLike(postId) {
    if (!currentUserId || currentUserId === 'visitor') {
        showToast(t('toast.need_login'), 'warning');
        return;
    }
    try {
        // Vérifier si l'utilisateur a déjà liké
        const { data: existingLike } = await supabasePublic
            .from('public_community_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .maybeSingle();

        if (existingLike) {
            // Retirer le like
            await supabasePublic.from('public_community_likes').delete().eq('id', existingLike.id);
            await supabasePublic.rpc('decrement_likes_count', { p_post_id: postId }).catch(() => {
                // Fallback si RPC inexistante
                supabasePublic
                    .from('public_community_posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single()
                    .then(({ data }) => {
                        const count = Math.max(0, (data?.likes_count || 0) - 1);
                        supabasePublic.from('public_community_posts').update({ likes_count: count }).eq('id', postId);
                    });
            });
        } else {
            // Ajouter le like
            await supabasePublic.from('public_community_likes').insert([{ post_id: postId, user_id: currentUserId }]);
            await supabasePublic.rpc('increment_likes_count', { p_post_id: postId }).catch(() => {
                supabasePublic
                    .from('public_community_posts')
                    .select('likes_count')
                    .eq('id', postId)
                    .single()
                    .then(({ data }) => {
                        const count = (data?.likes_count || 0) + 1;
                        supabasePublic.from('public_community_posts').update({ likes_count: count }).eq('id', postId);
                    });
            });
        }
        loadPosts();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_like'), 'error');
    }
}

async function addDislike(postId) {
    if (!currentUserId || currentUserId === 'visitor') {
        showToast(t('toast.need_login'), 'warning');
        return;
    }
    try {
        const { data: existingDislike } = await supabasePublic
            .from('public_community_dislikes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .maybeSingle();

        if (existingDislike) {
            await supabasePublic.from('public_community_dislikes').delete().eq('id', existingDislike.id);
            const { data: post } = await supabasePublic.from('public_community_posts').select('dislikes_count').eq('id', postId).single();
            const newCount = Math.max(0, (post?.dislikes_count || 0) - 1);
            await supabasePublic.from('public_community_posts').update({ dislikes_count: newCount }).eq('id', postId);
        } else {
            await supabasePublic.from('public_community_dislikes').insert([{ post_id: postId, user_id: currentUserId }]);
            const { data: post } = await supabasePublic.from('public_community_posts').select('dislikes_count').eq('id', postId).single();
            const newCount = (post?.dislikes_count || 0) + 1;
            await supabasePublic.from('public_community_posts').update({ dislikes_count: newCount }).eq('id', postId);
        }
        loadPosts();
    } catch (err) {
        console.error(err);
        showToast('Erreur dislike', 'error');
    }
}

async function sharePost(postId) {
    const shareUrl = window.location.origin + '/hubisoccer/public/hub-community.html?post=' + postId;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'HubISoccer Community',
                text: 'Découvrez ce post sur la communauté HubISoccer !',
                url: shareUrl,
            });
        } catch (err) {
            // Annulation par l'utilisateur, on ne fait rien
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast(t('toast.share_success'), 'success');
        } catch (err) {
            showToast(t('toast.share_error'), 'error');
        }
    }

    // Incrémenter le compteur de partages
    try {
        const { data: post } = await supabasePublic.from('public_community_posts').select('shares_count').eq('id', postId).single();
        const newCount = (post?.shares_count || 0) + 1;
        await supabasePublic.from('public_community_posts').update({ shares_count: newCount }).eq('id', postId);
        loadPosts();
    } catch (err) {
        console.error(err);
    }
}

async function reportContent(type, id) {
    const reason = prompt('Motif du signalement (optionnel) :');
    try {
        const payload = { reason: reason || null };
        if (type === 'post') payload.post_id = id;
        else payload.comment_id = id;
        const { error } = await supabasePublic.from('public_community_reports').insert([payload]);
        if (error) throw error;
        showToast(t('toast.report_success'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_report'), 'error');
    }
}
// ========== FIN : ACTIONS ==========

// ========== DÉBUT : VISIONNEUSE PLEIN ÉCRAN ==========
function openMediaViewer(mediaUrl, mediaType) {
    const viewer = document.getElementById('mediaViewer');
    const img = document.getElementById('viewerImage');
    const video = document.getElementById('viewerVideo');

    img.style.display = 'none';
    video.style.display = 'none';

    if (mediaType === 'video') {
        video.src = mediaUrl;
        video.style.display = 'block';
    } else {
        img.src = mediaUrl;
        img.style.display = 'block';
    }
    viewer.style.display = 'flex';
}

function closeMediaViewer() {
    document.getElementById('mediaViewer').style.display = 'none';
    const video = document.getElementById('viewerVideo');
    if (video) video.pause();
}
// ========== FIN : VISIONNEUSE ==========

// ========== DÉBUT : GESTION DES ÉVÉNEMENTS ==========
document.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
        e.preventDefault();
        await toggleLike(likeBtn.dataset.id);
        return;
    }
    const dislikeBtn = e.target.closest('.dislike-btn');
    if (dislikeBtn) {
        e.preventDefault();
        await addDislike(dislikeBtn.dataset.id);
        return;
    }
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
        e.preventDefault();
        await sharePost(shareBtn.dataset.id);
        return;
    }
    const reportBtn = e.target.closest('.report-btn');
    if (reportBtn) {
        e.preventDefault();
        await reportContent(reportBtn.dataset.type, reportBtn.dataset.id);
        return;
    }
    const replyBtn = e.target.closest('.reply-btn');
    if (replyBtn) {
        e.preventDefault();
        const parent = replyBtn.closest('.comment');
        const postId = replyBtn.dataset.post;
        const commentId = replyBtn.dataset.id;
        const existingForm = parent.querySelector('.reply-form');
        if (existingForm) {
            existingForm.remove();
            replyBtn.style.display = 'inline-block';
            return;
        }
        const form = document.createElement('div');
        form.className = 'reply-form';
        form.innerHTML = `
            <input type="text" placeholder="Votre réponse...">
            <button data-post="${postId}" data-parent="${commentId}">Répondre</button>
        `;
        parent.appendChild(form);
        replyBtn.style.display = 'none';
        return;
    }
    const replyFormBtn = e.target.closest('.reply-form button');
    if (replyFormBtn) {
        e.preventDefault();
        const form = replyFormBtn.closest('.reply-form');
        const input = form.querySelector('input');
        const content = input.value.trim();
        if (content) {
            await addComment(replyFormBtn.dataset.post, content, replyFormBtn.dataset.parent);
            form.remove();
            const parentComment = form.closest('.comment');
            if (parentComment) {
                const replyBtn = parentComment.querySelector('.reply-btn');
                if (replyBtn) replyBtn.style.display = 'inline-block';
            }
            loadPosts();
        }
        return;
    }
    const sendCommentBtn = e.target.closest('.send-comment');
    if (sendCommentBtn) {
        e.preventDefault();
        const input = document.querySelector(`.comment-input[data-id="${sendCommentBtn.dataset.id}"]`);
        if (input && input.value.trim()) {
            await addComment(sendCommentBtn.dataset.id, input.value.trim());
            input.value = '';
        }
        return;
    }
    const seeMoreBtn = e.target.closest('.btn-see-more');
    if (seeMoreBtn) {
        e.preventDefault();
        const parentDiv = seeMoreBtn.parentElement;
        const shortText = parentDiv.querySelector('.post-text-short');
        const fullText = parentDiv.querySelector('.post-text-full');
        if (seeMoreBtn.dataset.action === 'more') {
            shortText.style.display = 'none';
            fullText.style.display = 'inline';
            seeMoreBtn.textContent = t('post.see_less');
            seeMoreBtn.dataset.action = 'less';
        } else {
            shortText.style.display = 'inline';
            fullText.style.display = 'none';
            seeMoreBtn.textContent = t('post.see_more');
            seeMoreBtn.dataset.action = 'more';
        }
        return;
    }
    const mediaElement = e.target.closest('.post-media');
    if (mediaElement) {
        const url = mediaElement.dataset.mediaUrl;
        const type = mediaElement.dataset.mediaType;
        openMediaViewer(url, type);
        return;
    }
    if (e.target.id === 'mediaViewer' || e.target.classList.contains('close-viewer')) {
        closeMediaViewer();
        return;
    }
});
// ========== FIN : ÉVÉNEMENTS ==========

// ========== DÉBUT : UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}
function showToast(message, type = 'info', duration = 15000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : MENU MOBILE & LANGUE ==========
function initMenuMobile() {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
        toggle.addEventListener('click', () => { links.classList.toggle('active'); toggle.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!links.contains(e.target) && !toggle.contains(e.target)) { links.classList.remove('active'); toggle.classList.remove('open'); } });
    }
}
function initLangSelector() {
    const sel = document.getElementById('langSelect');
    if (sel) { sel.value = currentLang; sel.addEventListener('change', (e) => changeLanguage(e.target.value)); }
}
// ========== FIN : MENU MOBILE & LANGUE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadPosts();
});
// ========== FIN DE HUB-COMMUNITY.JS ==========
