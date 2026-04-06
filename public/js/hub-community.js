// ========== HUB-COMMUNITY.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (extrait complet) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.home': 'Accueil',
        'nav.market': 'Market',
        'nav.community': 'Community',
        'nav.scouting': 'Scouting',
        'nav.affiliation': 'Affiliation',
        'nav.process': 'Processus',
        'nav.actors': 'Devenir acteur',
        'nav.tournoi': 'Tournois',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'community.title': 'Hub Community',
        'community.subtitle': 'Découvrez les talents du monde entier. Interagissez sans limite (10 commentaires max sans compte).',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load': 'Erreur chargement des posts',
        'toast.error_like': 'Erreur lors du like',
        'toast.error_comment': 'Erreur lors de l\'ajout du commentaire',
        'toast.limit_reached': 'Limite de 10 commentaires atteinte. Connectez-vous pour continuer.',
        'toast.need_login': 'Veuillez vous connecter pour commenter',
        'post.like': 'J\'aime',
        'post.dislike': 'Je n\'aime pas',
        'post.share': 'Partager',
        'post.reply': 'Répondre'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.home': 'Home',
        'nav.market': 'Market',
        'nav.community': 'Community',
        'nav.scouting': 'Scouting',
        'nav.affiliation': 'Affiliation',
        'nav.process': 'Process',
        'nav.actors': 'Become an actor',
        'nav.tournoi': 'Tournaments',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'community.title': 'Hub Community',
        'community.subtitle': 'Discover talents from around the world. Interact without limits (10 comments max without account).',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load': 'Error loading posts',
        'toast.error_like': 'Error liking post',
        'toast.error_comment': 'Error adding comment',
        'toast.limit_reached': 'Limit of 10 comments reached. Please login to continue.',
        'toast.need_login': 'Please login to comment',
        'post.like': 'Like',
        'post.dislike': 'Dislike',
        'post.share': 'Share',
        'post.reply': 'Reply'
    }
};

let currentLang = localStorage.getItem('community_lang') || navigator.language.split('-')[0];
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
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) el.placeholder = t(key);
            else el.innerHTML = t(key);
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
        localStorage.setItem('community_lang', lang);
        applyTranslations();
        loadPosts();
    }
}

// ========== ÉTAT ==========
let currentUserId = null;
let currentUserNom = 'Visiteur';
let commentCount = parseInt(localStorage.getItem('visitor_comment_count')) || 0;
let isLoggedIn = false;

// ========== VÉRIFIER CONNEXION (sessionStorage de l'espace tournoi) ==========
async function checkAuth() {
    const userId = sessionStorage.getItem('tournoi_user_id');
    const userNom = sessionStorage.getItem('tournoi_nom');
    if (userId && userNom) {
        currentUserId = userId;
        currentUserNom = userNom;
        isLoggedIn = true;
    } else {
        // Essayer de récupérer un ID visiteur (créé en base si besoin)
        currentUserId = 'visitor';
        isLoggedIn = false;
    }
}

// ========== CHARGEMENT DES POSTS ==========
async function loadPosts() {
    showLoader();
    try {
        const { data: posts, error } = await supabasePublic
            .from('public_community_posts')
            .select(`
                *,
                profiles:user_id (id, nom, avatar_url),
                comments:public_community_comments(
                    id, content, created_at, parent_id,
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
                <div class="post-content">${escapeHtml(post.content)}</div>
                ${post.media_url ? `<div class="post-media">${post.media_url.includes('youtube') ? `<iframe src="${post.media_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` : `<img src="${post.media_url}" alt="media">`}</div>` : ''}
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
                </div>
                <div class="comments-section">
                    ${renderComments(commentsTree, post.id)}
                    ${!isLoggedIn && commentCount >= 10 ? renderLimitMessage() : renderAddComment(post.id)}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
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
                    <span class="reply-count">${c.replies.length} réponse(s)</span>
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
            <a href="public/auth/login.html" class="btn-auth">${t('nav.login')}</a>
            <a href="public/auth/signup.html" class="btn-auth gold">${t('nav.signup')}</a>
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

// ========== AJOUTER UN COMMENTAIRE ==========
async function addComment(postId, content, parentId = null) {
    if (!isLoggedIn && commentCount >= 10) {
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
            localStorage.setItem('visitor_comment_count', commentCount);
        }
        loadPosts();
        return true;
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_comment'), 'error');
        return false;
    }
}

// ========== LIKES / DISLIKES / SHARES ==========
async function toggleLike(postId) {
    if (!currentUserId) {
        showToast(t('toast.need_login'), 'warning');
        return;
    }
    try {
        const { error } = await supabasePublic.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });
        if (error) throw error;
        loadPosts();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_like'), 'error');
    }
}

async function addDislike(postId) {
    if (!currentUserId) {
        showToast(t('toast.need_login'), 'warning');
        return;
    }
    try {
        const { error } = await supabasePublic.rpc('add_post_dislike', { p_post_id: postId });
        if (error) throw error;
        loadPosts();
    } catch (err) {
        console.error(err);
        showToast('Erreur', 'error');
    }
}

async function sharePost(postId) {
    try {
        await supabasePublic.rpc('increment_post_shares', { p_post_id: postId });
        navigator.clipboard?.writeText(window.location.href);
        showToast('Lien copié !', 'success');
        loadPosts();
    } catch (err) {
        console.error(err);
    }
}

// ========== GESTION DES ÉVÉNEMENTS ==========
document.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn && !likeBtn.classList.contains('liked')) {
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
    const replyBtn = e.target.closest('.reply-btn');
    if (replyBtn) {
        e.preventDefault();
        const parent = replyBtn.closest('.comment');
        const postId = replyBtn.dataset.post;
        const commentId = replyBtn.dataset.id;
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
});

// ========== UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }
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

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadPosts();
});