// ========== COMMUNITY-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function showToast(message, type = 'info') {
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
    setTimeout(() => toast.remove(), 3000);
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== CHARGEMENT DES PROFILS ==========
async function loadProfiles() {
    const { data, error } = await supabaseAdmin
        .from('public_profiles')
        .select('id, nom')
        .order('nom');
    if (error) {
        console.error('Erreur chargement profils:', error);
        return [];
    }
    return data || [];
}

// ========== AFFICHAGE DES POSTS ==========
const postsList = document.getElementById('postsList');
async function loadPosts() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_posts')
            .select(`
                *,
                profiles:user_id (id, nom)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderPosts(data || []);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement posts', 'error');
        postsList.innerHTML = '<p class="empty-message">Erreur de chargement.</p>';
    } finally {
        hideLoader();
    }
}

function renderPosts(posts) {
    if (!posts.length) {
        postsList.innerHTML = '<p class="empty-message">Aucun post.</p>';
        return;
    }
    let html = '';
    for (const p of posts) {
        html += `
            <div class="item-card" data-id="${p.id}">
                <div class="item-info">
                    <strong>${escapeHtml(p.profiles?.nom || 'Anonyme')}</strong>
                    <div class="item-details">${escapeHtml(p.content.substring(0, 100))}${p.content.length > 100 ? '...' : ''}</div>
                    <div class="item-meta">
                        <span><i class="fas fa-thumbs-up"></i> ${p.likes_count || 0}</span>
                        <span><i class="fas fa-thumbs-down"></i> ${p.dislikes_count || 0}</span>
                        <span><i class="fas fa-share"></i> ${p.shares_count || 0}</span>
                        <span><i class="fas fa-comment"></i> ${p.comments_count || 0}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="edit" data-id="${p.id}" data-type="post"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${p.id}" data-type="post"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }
    postsList.innerHTML = html;
    attachPostEvents();
}

function attachPostEvents() {
    document.querySelectorAll('#postsList .edit').forEach(btn => {
        btn.addEventListener('click', () => openEditPost(btn.dataset.id));
    });
    document.querySelectorAll('#postsList .delete').forEach(btn => {
        btn.addEventListener('click', () => deletePost(btn.dataset.id));
    });
}

// ========== AFFICHAGE DES COMMENTAIRES ==========
const commentsList = document.getElementById('commentsList');
async function loadComments() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_comments')
            .select(`
                *,
                profiles:user_id (id, nom),
                post:post_id (id, content)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderComments(data || []);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement commentaires', 'error');
        commentsList.innerHTML = '<p class="empty-message">Erreur de chargement.</p>';
    } finally {
        hideLoader();
    }
}

function renderComments(comments) {
    if (!comments.length) {
        commentsList.innerHTML = '<p class="empty-message">Aucun commentaire.</p>';
        return;
    }
    let html = '';
    for (const c of comments) {
        const postPreview = c.post?.content ? c.post.content.substring(0, 50) + '...' : 'Post #' + c.post_id;
        html += `
            <div class="item-card" data-id="${c.id}">
                <div class="item-info">
                    <strong>${escapeHtml(c.profiles?.nom || 'Anonyme')}</strong>
                    <div class="item-details">${escapeHtml(c.content)}</div>
                    <div class="item-meta">
                        <span><i class="fas fa-newspaper"></i> Post: ${escapeHtml(postPreview)}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="edit" data-id="${c.id}" data-type="comment"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${c.id}" data-type="comment"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }
    commentsList.innerHTML = html;
    attachCommentEvents();
}

function attachCommentEvents() {
    document.querySelectorAll('#commentsList .edit').forEach(btn => {
        btn.addEventListener('click', () => openEditComment(btn.dataset.id));
    });
    document.querySelectorAll('#commentsList .delete').forEach(btn => {
        btn.addEventListener('click', () => deleteComment(btn.dataset.id));
    });
}

// ========== CRUD POSTS ==========
const modal = document.getElementById('itemModal');
const modalTitle = document.getElementById('modalTitle');
const itemForm = document.getElementById('itemForm');
const itemType = document.getElementById('itemType');
const itemId = document.getElementById('itemId');
const dynamicFields = document.getElementById('dynamicFields');
let currentItemId = null;

function closeModal() {
    modal.classList.remove('active');
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
});
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

async function openAddPost() {
    const profiles = await loadProfiles();
    if (!profiles.length) {
        showToast('Aucun profil trouvé. Créez d\'abord un profil.', 'warning');
        return;
    }
    itemType.value = 'post';
    itemId.value = '';
    currentItemId = null;
    modalTitle.textContent = 'Ajouter un post';
    dynamicFields.innerHTML = `
        <div class="form-group">
            <label>Auteur *</label>
            <select id="userId" required>
                <option value="">-- Choisir --</option>
                ${profiles.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nom)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Contenu *</label>
            <textarea id="content" rows="4" required></textarea>
        </div>
        <div class="form-group">
            <label>URL du média (image/vidéo)</label>
            <input type="text" id="mediaUrl" placeholder="https://...">
        </div>
    `;
    modal.classList.add('active');
}

async function openEditPost(postId) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_posts')
            .select('*')
            .eq('id', postId)
            .single();
        if (error) throw error;
        const profiles = await loadProfiles();
        itemType.value = 'post';
        itemId.value = postId;
        currentItemId = postId;
        modalTitle.textContent = 'Modifier le post';
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label>Auteur *</label>
                <select id="userId" required>
                    <option value="">-- Choisir --</option>
                    ${profiles.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === data.user_id ? 'selected' : ''}>${escapeHtml(p.nom)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Contenu *</label>
                <textarea id="content" rows="4" required>${escapeHtml(data.content)}</textarea>
            </div>
            <div class="form-group">
                <label>URL du média (image/vidéo)</label>
                <input type="text" id="mediaUrl" value="${escapeHtml(data.media_url || '')}">
            </div>
        `;
        modal.classList.add('active');
    } catch (err) {
        showToast('Erreur chargement post', 'error');
    } finally {
        hideLoader();
    }
}

async function deletePost(postId) {
    if (!confirm('Supprimer définitivement ce post ? Tous les commentaires associés seront supprimés.')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_community_posts')
            .delete()
            .eq('id', postId);
        if (error) throw error;
        showToast('Post supprimé', 'success');
        loadPosts();
        loadComments();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
}

// ========== CRUD COMMENTAIRES ==========
async function openAddComment() {
    const profiles = await loadProfiles();
    if (!profiles.length) {
        showToast('Aucun profil trouvé.', 'warning');
        return;
    }
    itemType.value = 'comment';
    itemId.value = '';
    currentItemId = null;
    modalTitle.textContent = 'Ajouter un commentaire';
    dynamicFields.innerHTML = `
        <div class="form-group">
            <label>Post ID *</label>
            <input type="number" id="postId" required>
        </div>
        <div class="form-group">
            <label>Auteur *</label>
            <select id="userId" required>
                <option value="">-- Choisir --</option>
                ${profiles.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nom)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Contenu *</label>
            <textarea id="content" rows="3" required></textarea>
        </div>
        <div class="form-group">
            <label>Parent ID (réponse à un commentaire)</label>
            <input type="number" id="parentId" placeholder="Optionnel">
        </div>
    `;
    modal.classList.add('active');
}

async function openEditComment(commentId) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_community_comments')
            .select('*')
            .eq('id', commentId)
            .single();
        if (error) throw error;
        const profiles = await loadProfiles();
        itemType.value = 'comment';
        itemId.value = commentId;
        currentItemId = commentId;
        modalTitle.textContent = 'Modifier le commentaire';
        dynamicFields.innerHTML = `
            <div class="form-group">
                <label>Post ID *</label>
                <input type="number" id="postId" value="${data.post_id}" required>
            </div>
            <div class="form-group">
                <label>Auteur *</label>
                <select id="userId" required>
                    <option value="">-- Choisir --</option>
                    ${profiles.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === data.user_id ? 'selected' : ''}>${escapeHtml(p.nom)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Contenu *</label>
                <textarea id="content" rows="3" required>${escapeHtml(data.content)}</textarea>
            </div>
            <div class="form-group">
                <label>Parent ID (réponse)</label>
                <input type="number" id="parentId" value="${data.parent_id || ''}">
            </div>
        `;
        modal.classList.add('active');
    } catch (err) {
        showToast('Erreur chargement commentaire', 'error');
    } finally {
        hideLoader();
    }
}

async function deleteComment(commentId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_community_comments')
            .delete()
            .eq('id', commentId);
        if (error) throw error;
        showToast('Commentaire supprimé', 'success');
        loadComments();
        loadPosts(); // pour mettre à jour le compteur de commentaires
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
}

// ========== SOUMISSION FORMULAIRE ==========
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = itemType.value;
    const id = itemId.value;
    const userId = document.getElementById('userId')?.value;
    const content = document.getElementById('content')?.value.trim();
    if (!userId || !content) {
        showToast('Auteur et contenu requis', 'warning');
        return;
    }
    showLoader();
    try {
        if (type === 'post') {
            const mediaUrl = document.getElementById('mediaUrl')?.value.trim() || null;
            if (id) {
                const { error } = await supabaseAdmin
                    .from('public_community_posts')
                    .update({ user_id: userId, content, media_url: mediaUrl, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) throw error;
                showToast('Post modifié', 'success');
            } else {
                const { error } = await supabaseAdmin
                    .from('public_community_posts')
                    .insert([{ user_id: userId, content, media_url: mediaUrl, is_public: true }]);
                if (error) throw error;
                showToast('Post ajouté', 'success');
            }
            loadPosts();
        } else if (type === 'comment') {
            const postId = document.getElementById('postId')?.value;
            const parentId = document.getElementById('parentId')?.value || null;
            if (!postId) {
                showToast('Post ID requis', 'warning');
                return;
            }
            if (id) {
                const { error } = await supabaseAdmin
                    .from('public_community_comments')
                    .update({ user_id: userId, content, parent_id: parentId, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) throw error;
                showToast('Commentaire modifié', 'success');
            } else {
                const { error } = await supabaseAdmin
                    .from('public_community_comments')
                    .insert([{ post_id: postId, user_id: userId, content, parent_id: parentId }]);
                if (error) throw error;
                showToast('Commentaire ajouté', 'success');
            }
            loadComments();
            loadPosts(); // mettre à jour le compteur
        }
        closeModal();
    } catch (err) {
        console.error(err);
        showToast('Erreur sauvegarde', 'error');
    } finally {
        hideLoader();
    }
});

// ========== BOUTONS ==========
document.getElementById('addPostBtn').addEventListener('click', openAddPost);
document.getElementById('addCommentBtn').addEventListener('click', openAddComment);

// ========== DÉCONNEXION ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '../../../index.html';
});

// ========== MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}

// ========== INITIALISATION ==========
loadPosts();
loadComments();