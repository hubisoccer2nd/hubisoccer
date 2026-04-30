// ========== COMMUNITY-ADMIN.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allPosts = [];
let allComments = [];
let allReports = [];
let currentPostId = null;
let postQuill = null;
let uploadedMediaUrl = null;
let deleteTarget = { type: null, id: null };
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : ÉDITEUR QUILL ==========
function initPostEditor() {
    if (postQuill) {
        postQuill = null;
    }
    document.getElementById('postEditor').innerHTML = '';
    postQuill = new Quill('#postEditor', {
        theme: 'snow',
        placeholder: 'Contenu de la publication...',
        modules: {
            toolbar: [
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });
}
// ========== FIN : ÉDITEUR QUILL ==========

// ========== DÉBUT : CHARGEMENT DES DONNÉES ==========
async function loadPosts() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_posts')
            .select('*')
            .order('epingle', { ascending: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        allPosts = data || [];
        renderPostsTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement posts', 'error');
    } finally {
        hideLoader();
    }
}

async function loadComments() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_comments')
            .select('*, post:post_id(id, content)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allComments = data || [];
        renderCommentsTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement commentaires', 'error');
    } finally {
        hideLoader();
    }
}

async function loadReports() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_reports')
            .select('*, post:post_id(id, content), comment:comment_id(id, content)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allReports = data || [];
        renderReportsTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement signalements', 'error');
    } finally {
        hideLoader();
    }
}

function updateStats() {
    document.getElementById('statPosts').textContent = allPosts.length;
    document.getElementById('statCommentaires').textContent = allComments.length;
    document.getElementById('statLikes').textContent = allPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    document.getElementById('statReports').textContent = allReports.length;
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : RENDU TABLEAU POSTS ==========
function renderPostsTable() {
    const tbody = document.getElementById('postsBody');
    if (!tbody) return;
    const search = document.getElementById('searchPost')?.value.toLowerCase() || '';
    const entity = document.getElementById('entityFilter')?.value || 'all';

    const filtered = allPosts.filter(p => {
        const matchSearch = (p.content || '').toLowerCase().includes(search);
        const matchEntity = entity === 'all' || p.entity_type === entity;
        return matchSearch && matchEntity;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">Aucune publication trouvée.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(p => `
        <tr data-postid="${p.id}">
            <td class="id-cell">${p.id}</td>
            <td>${escapeHtml(p.user_id || 'Admin')}</td>
            <td class="content-cell">${escapeHtml((p.content || '').substring(0, 80))}...</td>
            <td>${p.entity_type ? escapeHtml(p.entity_type + ' #' + p.entity_id) : '-'}</td>
            <td>${p.media_url ? '<i class="fas fa-check-circle" style="color: var(--success);"></i>' : '<i class="fas fa-times-circle" style="color: var(--gray);"></i>'}</td>
            <td><i class="fas fa-thumbs-up"></i> ${p.likes_count || 0} <i class="fas fa-thumbs-down"></i> ${p.dislikes_count || 0} <i class="fas fa-comment"></i> ${p.comments_count || 0}</td>
            <td>${new Date(p.created_at).toLocaleDateString()}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-postid="${p.id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-edit" data-postid="${p.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-pin ${p.epingle ? 'pinned' : ''}" data-postid="${p.id}" title="${p.epingle ? 'Désépingler' : 'Épingler'}"><i class="fas fa-thumbtack"></i></button>
                <button class="btn-icon btn-lock ${p.commentaires_actifs ? '' : 'locked'}" data-postid="${p.id}" title="${p.commentaires_actifs ? 'Bloquer commentaires' : 'Activer commentaires'}"><i class="fas ${p.commentaires_actifs ? 'fa-lock-open' : 'fa-lock'}"></i></button>
                <button class="btn-icon btn-delete" data-postid="${p.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewPostModal(b.dataset.postid)));
    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openEditPostModal(b.dataset.postid)));
    tbody.querySelectorAll('.btn-pin').forEach(b => b.addEventListener('click', () => togglePin(b.dataset.postid)));
    tbody.querySelectorAll('.btn-lock').forEach(b => b.addEventListener('click', () => toggleComments(b.dataset.postid)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => openDeleteModal('post', b.dataset.postid)));
}

async function togglePin(postId) {
    const post = allPosts.find(p => p.id == postId);
    if (!post) return;
    const newVal = !post.epingle;
    const { error } = await supabaseAdmin
        .from('public_community_posts')
        .update({ epingle: newVal, updated_at: new Date().toISOString() })
        .eq('id', postId);
    if (!error) {
        post.epingle = newVal;
        renderPostsTable();
        showToast(newVal ? 'Post épinglé' : 'Post désépinglé', 'success');
    } else {
        showToast('Erreur', 'error');
    }
}

async function toggleComments(postId) {
    const post = allPosts.find(p => p.id == postId);
    if (!post) return;
    const newVal = !post.commentaires_actifs;
    const { error } = await supabaseAdmin
        .from('public_community_posts')
        .update({ commentaires_actifs: newVal, updated_at: new Date().toISOString() })
        .eq('id', postId);
    if (!error) {
        post.commentaires_actifs = newVal;
        renderPostsTable();
        showToast(newVal ? 'Commentaires activés' : 'Commentaires bloqués', 'success');
    } else {
        showToast('Erreur', 'error');
    }
}
// ========== FIN : TABLEAU POSTS ==========

// ========== DÉBUT : MODALE CRÉATION / MODIFICATION POST ==========
function openCreatePostModal() {
    currentPostId = null;
    uploadedMediaUrl = null;
    document.getElementById('postModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nouvelle publication';
    document.getElementById('postId').value = '';
    document.getElementById('entityType').value = '';
    document.getElementById('entityId').value = '';
    document.getElementById('entityName').value = '';
    document.getElementById('postEpingle').checked = false;
    document.getElementById('postCommentairesActifs').checked = true;
    resetMediaUpload();
    initPostEditor();
    document.getElementById('postModal').classList.add('active');
}

async function openEditPostModal(postId) {
    const post = allPosts.find(p => p.id == postId);
    if (!post) return;
    currentPostId = post.id;
    uploadedMediaUrl = post.media_url || null;
    document.getElementById('postModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier la publication';
    document.getElementById('postId').value = post.id;
    document.getElementById('entityType').value = post.entity_type || '';
    document.getElementById('entityId').value = post.entity_id || '';
    document.getElementById('entityName').value = post.entity_name || '';
    document.getElementById('postEpingle').checked = post.epingle || false;
    document.getElementById('postCommentairesActifs').checked = post.commentaires_actifs !== false;
    resetMediaUpload();
    initPostEditor();
    if (post.content) {
        postQuill.root.innerHTML = post.content;
    }
    document.getElementById('postModal').classList.add('active');
}

function resetMediaUpload() {
    document.getElementById('uploadStatusPostMedia').style.display = 'none';
    document.getElementById('uploadSuccessPostMedia').style.display = 'none';
    document.getElementById('postMediaFile').value = '';
}

async function uploadPostMedia(file) {
    const statusDiv = document.getElementById('uploadStatusPostMedia');
    const successDiv = document.getElementById('uploadSuccessPostMedia');
    statusDiv.style.display = 'flex';
    successDiv.style.display = 'none';

    const safeName = `post_${currentPostId || 'new'}_${Date.now()}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}.${fileExt}`;

    try {
        const { error } = await supabaseAdmin.storage.from('community_medias').upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabaseAdmin.storage.from('community_medias').getPublicUrl(fileName);
        statusDiv.style.display = 'none';
        successDiv.style.display = 'flex';
        return urlData.publicUrl;
    } catch (err) {
        statusDiv.style.display = 'none';
        showToast('Erreur upload : ' + err.message, 'error');
        throw err;
    }
}

document.getElementById('postMediaFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        uploadedMediaUrl = await uploadPostMedia(file);
    } catch (err) { /* déjà toasté */ }
});

document.getElementById('uploadPostMedia').addEventListener('click', () => {
    document.getElementById('postMediaFile').click();
});

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = postQuill ? postQuill.root.innerHTML : '';
    const entityType = document.getElementById('entityType').value || null;
    const entityId = document.getElementById('entityId').value?.trim() || null;
    const entityName = document.getElementById('entityName').value?.trim() || null;
    const epingle = document.getElementById('postEpingle').checked;
    const commentairesActifs = document.getElementById('postCommentairesActifs').checked;

    const postData = {
        content: content,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        media_url: uploadedMediaUrl,
        epingle: epingle,
        commentaires_actifs: commentairesActifs,
        is_public: true,
        updated_at: new Date().toISOString()
    };

    showLoader();
    try {
        if (currentPostId) {
            const { error } = await supabaseAdmin.from('public_community_posts').update(postData).eq('id', currentPostId);
            if (error) throw error;
            showToast('Publication modifiée.', 'success');
        } else {
            const { error } = await supabaseAdmin.from('public_community_posts').insert([{
                ...postData,
                user_id: 'admin',
                created_at: new Date().toISOString()
            }]);
            if (error) throw error;
            showToast('Publication créée.', 'success');
        }
        closeAllModals();
        loadPosts();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : MODALE POST ==========

// ========== DÉBUT : MODALE VISUALISATION ==========
async function openViewPostModal(postId) {
    const post = allPosts.find(p => p.id == postId);
    if (!post) return;

    const { data: comments } = await supabaseAdmin
        .from('public_community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    let html = `
        <div class="view-post-detail">
            <div class="post-content-full">${post.content || 'Aucun contenu.'}</div>
            ${post.media_url ? `<div class="post-media-large">${post.media_url.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? `<video src="${escapeHtml(post.media_url)}" controls style="max-width:100%;"></video>` : `<img src="${escapeHtml(post.media_url)}" alt="media" style="max-width:100%;">`}</div>` : ''}
            <div class="comments-admin-list">
                <h4><i class="fas fa-comments"></i> Commentaires (${comments?.length || 0})</h4>
                ${comments?.map(c => `<div class="comment-admin-item"><strong>${escapeHtml(c.user_id)}</strong>: ${escapeHtml(c.content)} <small>${new Date(c.created_at).toLocaleString()}</small></div>`).join('') || '<p>Aucun commentaire.</p>'}
            </div>
        </div>
    `;
    document.getElementById('viewPostContent').innerHTML = html;
    document.getElementById('viewPostModal').classList.add('active');
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : SUPPRESSION ==========
function openDeleteModal(type, id) {
    deleteTarget = { type, id };
    document.getElementById('deleteModalText').textContent = type === 'post' ? 'Supprimer ce post et tous ses commentaires ?' : 'Supprimer ce commentaire ?';
    document.getElementById('deleteModal').classList.add('active');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteTarget.id) return;
    showLoader();
    try {
        if (deleteTarget.type === 'post') {
            await supabaseAdmin.from('public_community_posts').delete().eq('id', deleteTarget.id);
        } else if (deleteTarget.type === 'comment') {
            await supabaseAdmin.from('public_community_comments').delete().eq('id', deleteTarget.id);
        }
        showToast('Supprimé avec succès.', 'success');
        closeAllModals();
        loadPosts();
        loadComments();
        loadReports();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : SUPPRESSION ==========

// ========== DÉBUT : TABLEAUX DÉPENDANTS ==========
function renderCommentsTable() {
    const tbody = document.getElementById('commentsBody');
    if (!tbody) return;
    const search = document.getElementById('searchComment')?.value.toLowerCase() || '';
    const filtered = allComments.filter(c => (c.content || '').toLowerCase().includes(search));
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Aucun commentaire.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td>${escapeHtml(c.user_id)}</td>
            <td>${escapeHtml((c.content || '').substring(0, 100))}</td>
            <td>Post #${c.post_id}</td>
            <td>${new Date(c.created_at).toLocaleDateString()}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-commentid="${c.id}" data-postid="${c.post_id}" title="Voir le post"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-delete" data-commentid="${c.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewPostModal(b.dataset.postid)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => openDeleteModal('comment', b.dataset.commentid)));
}

function renderReportsTable() {
    const tbody = document.getElementById('reportsBody');
    if (!tbody) return;
    if (allReports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Aucun signalement.</td></tr>';
        return;
    }
    tbody.innerHTML = allReports.map(r => `
        <tr>
            <td>${r.post_id ? 'Post' : 'Commentaire'}</td>
            <td>${escapeHtml((r.post?.content || r.comment?.content || '').substring(0, 80))}</td>
            <td>${escapeHtml(r.reason || '-')}</td>
            <td>${new Date(r.created_at).toLocaleDateString()}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-postid="${r.post_id || ''}" data-commentid="${r.comment_id || ''}" title="Voir le contenu"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-ignore" data-reportid="${r.id}" title="Ignorer"><i class="fas fa-check"></i></button>
                <button class="btn-icon btn-delete" data-reportid="${r.id}" data-type="${r.post_id ? 'post' : 'comment'}" data-targetid="${r.post_id || r.comment_id}" title="Supprimer le contenu"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.postid) openViewPostModal(b.dataset.postid);
        else if (b.dataset.commentid) {
            const comment = allComments.find(c => c.id == b.dataset.commentid);
            if (comment) openViewPostModal(comment.post_id);
        }
    }));
    tbody.querySelectorAll('.btn-ignore').forEach(b => b.addEventListener('click', async () => {
        await supabaseAdmin.from('public_community_reports').delete().eq('id', b.dataset.reportid);
        loadReports();
        showToast('Signalement ignoré', 'success');
    }));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
        const type = b.dataset.type;
        const targetId = b.dataset.targetid;
        if (type === 'post') {
            await supabaseAdmin.from('public_community_posts').delete().eq('id', targetId);
        } else if (type === 'comment') {
            await supabaseAdmin.from('public_community_comments').delete().eq('id', targetId);
        }
        await supabaseAdmin.from('public_community_reports').delete().eq('id', b.dataset.reportid);
        loadReports();
        loadPosts();
        loadComments();
        showToast('Contenu supprimé', 'success');
    }));
}
// ========== FIN : TABLEAUX DÉPENDANTS ==========

// ========== DÉBUT : FERMETURE DES MODALES ==========
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeAllModals(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });
// ========== FIN : FERMETURE DES MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('newPostBtn').addEventListener('click', openCreatePostModal);
document.getElementById('searchPost').addEventListener('input', renderPostsTable);
document.getElementById('entityFilter').addEventListener('change', renderPostsTable);
document.getElementById('searchComment').addEventListener('input', renderCommentsTable);
document.getElementById('refreshStatsBtn').addEventListener('click', () => { loadPosts(); loadComments(); loadReports(); showToast('Rafraîchi', 'info'); });
// ========== FIN : ÉVÉNEMENTS ==========

// ========== DÉBUT : MENU MOBILE & ONGLETS ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active'); menuToggle.classList.remove('open');
        }
    });
}
document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); showToast('Déconnexion', 'info'); });

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'posts') loadPosts();
        else if (tabId === 'commentaires') loadComments();
        else if (tabId === 'reports') loadReports();
    });
});
// ========== FIN : MENU MOBILE & ONGLETS ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadComments();
    loadReports();
});
// ========== FIN DE COMMUNITY-ADMIN.JS ==========
