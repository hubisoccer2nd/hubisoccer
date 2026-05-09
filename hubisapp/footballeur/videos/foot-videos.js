/* ============================================================
   HubISoccer — foot-videos.js
   Espace Footballeur · Mes vidéos & photos
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser = null;
let userProfile = null;
let mediaList = [];
let currentFilter = 'all';
const MEDIA_BUCKET = 'media-footballeur';
// Fin état global

// Début fonctions utilitaires
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => t.remove(), 300);
    });
    setTimeout(() => {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }
    }, duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const url = userProfile?.avatar_url;
    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
    } else {
        const init = getInitials(userProfile?.full_name || userProfile?.display_name || 'F');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
    }
}
// Fin fonctions utilitaires

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadProfile
async function loadProfile() {
    if (!currentUser) return null;
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, display_name, avatar_url, role_code')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement profil', 'error');
        return null;
    }
    if (data.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    userProfile = data;
    document.getElementById('userName').textContent = userProfile.full_name || userProfile.display_name || 'Footballeur';
    updateAvatarUI();
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction loadMedia
async function loadMedia() {
    if (!userProfile) return;
    showLoader();
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_media')
            .select('*')
            .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        mediaList = data || [];
        renderMedia();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement médias', 'error');
    } finally {
        hideLoader();
    }
}
// Fin fonction loadMedia

// Début fonction renderMedia
function renderMedia() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    const filtered = currentFilter === 'all' ? mediaList : mediaList.filter(m => m.status === currentFilter);

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-message">Aucun média pour le moment.</p>';
        return;
    }

    grid.innerHTML = filtered.map(media => {
        const statusText = {
            pending: 'En attente',
            approved: 'Validé',
            rejected: 'Rejeté'
        }[media.status] || 'En attente';

        const typeIcon = media.type === 'video' ? 'fa-video' : 'fa-image';
        const thumbnailHtml = media.thumbnail_url 
            ? `<img src="${media.thumbnail_url}" alt="${escapeHtml(media.title)}">` 
            : `<i class="fas ${typeIcon}"></i>`;

        return `
            <div class="media-card" onclick="showMediaDetail(${media.id})">
                <div class="media-thumbnail">${thumbnailHtml}</div>
                <div class="media-info">
                    <div class="media-title">${escapeHtml(media.title)}</div>
                    <div class="media-date">${new Date(media.created_at).toLocaleDateString('fr-FR')}</div>
                    <span class="media-status ${media.status}">${statusText}</span>
                    <span class="media-type"><i class="fas ${typeIcon}"></i> ${media.type}</span>
                </div>
            </div>
        `;
    }).join('');
}
// Fin fonction renderMedia

// Début fonction initFilters
function initFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderMedia();
        });
    });
}
// Fin fonction initFilters

// Début fonction openUploadModal
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
    document.getElementById('mediaFile').value = '';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('videoPreview').style.display = 'none';
}
function closeUploadModal() { document.getElementById('uploadModal').style.display = 'none'; }
function closeDetailModal() { document.getElementById('detailModal').style.display = 'none'; }
// Fin fonctions modales

// Début fonction previewFile
function previewFile() {
    const file = document.getElementById('mediaFile').files[0];
    if (!file) return;
    const previewContainer = document.getElementById('previewContainer');
    const imgPreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');

    imgPreview.style.display = 'none';
    videoPreview.style.display = 'none';

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
            videoPreview.style.display = 'none';
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        imgPreview.style.display = 'none';
        previewContainer.style.display = 'block';
        videoPreview.onloadeddata = () => URL.revokeObjectURL(url);
    } else {
        previewContainer.style.display = 'none';
    }
}
document.getElementById('mediaFile').addEventListener('change', previewFile);
// Fin fonction previewFile

// Début fonction submitUpload
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('mediaTitle').value.trim();
    const description = document.getElementById('mediaDesc').value.trim();
    const type = document.getElementById('mediaType').value;
    const file = document.getElementById('mediaFile').files[0];

    if (!title || !file) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Type de fichier non autorisé. Utilisez MP4, JPEG, PNG ou GIF.', 'error');
        return;
    }

    const maxSize = 500 * 1024 * 1024; // 500 Mo
    if (file.size > maxSize) {
        showToast('Le fichier ne doit pas dépasser 500 Mo.', 'error');
        return;
    }

    const submitBtn = document.querySelector('#uploadForm .btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    showLoader();

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfile.hubisoccer_id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from(MEDIA_BUCKET)
            .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
            .from(MEDIA_BUCKET)
            .getPublicUrl(fileName);
        const mediaUrl = urlData.publicUrl;

        const thumbnailUrl = type === 'photo' ? mediaUrl : null;

        const { error: insertError } = await supabaseClient
            .from('supabaseAuthPrive_media')
            .insert([{
                user_hubisoccer_id: userProfile.hubisoccer_id,
                title,
                description,
                type,
                url: mediaUrl,
                thumbnail_url: thumbnailUrl,
                status: 'pending'
            }]);
        if (insertError) throw insertError;

        showToast('Média soumis avec succès ! En attente de validation.', 'success');
        closeUploadModal();
        document.getElementById('uploadForm').reset();
        document.getElementById('previewContainer').style.display = 'none';
        await loadMedia();
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        hideLoader();
    }
});
// Fin fonction submitUpload

// Début fonction showMediaDetail
async function showMediaDetail(mediaId) {
    showLoader();
    try {
        const { data: media, error: mediaError } = await supabaseClient
            .from('supabaseAuthPrive_media')
            .select('*')
            .eq('id', mediaId)
            .single();
        if (mediaError) throw mediaError;

        const { data: comments, error: commentsError } = await supabaseClient
            .from('supabaseAuthPrive_media_comments')
            .select(`
                *,
                author:author_hubisoccer_id ( full_name, avatar_url )
            `)
            .eq('media_id', mediaId)
            .order('created_at', { ascending: true });
        if (commentsError) throw commentsError;

        const modalContent = document.getElementById('detailContent');
        const statusText = {
            pending: 'En attente',
            approved: 'Validé',
            rejected: 'Rejeté'
        }[media.status] || 'En attente';

        const mediaHtml = media.type === 'video'
            ? `<video controls src="${media.url}" style="width:100%; max-height:400px;"></video>`
            : `<img src="${media.url}" alt="${escapeHtml(media.title)}" style="max-width:100%; max-height:400px;">`;

        const commentsHtml = (comments || []).map(c => `
            <div class="comment">
                <div class="comment-author">
                    <img src="${c.author?.avatar_url || '../../img/user-default.jpg'}" alt="${escapeHtml(c.author?.full_name)}">
                    <span>${escapeHtml(c.author?.full_name || 'Anonyme')}</span>
                </div>
                <div class="comment-text">${escapeHtml(c.content)}</div>
                <div class="comment-date">${new Date(c.created_at).toLocaleString('fr-FR')}</div>
            </div>
        `).join('');

        modalContent.innerHTML = `
            <div class="media-detail">
                ${mediaHtml}
                <h2>${escapeHtml(media.title)}</h2>
                <p>${escapeHtml(media.description || '')}</p>
                <div class="media-meta">
                    <span>Soumis le ${new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
                    <span class="media-status ${media.status}">${statusText}</span>
                </div>
                <div class="comments-section">
                    <h3>Commentaires</h3>
                    <div id="commentsList">${commentsHtml || '<p>Aucun commentaire.</p>'}</div>
                    <div class="add-comment">
                        <textarea id="newComment" placeholder="Ajouter un commentaire..." rows="2"></textarea>
                        <button onclick="addComment(${media.id})">Envoyer</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('detailModal').style.display = 'flex';
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du chargement du média', 'error');
    } finally {
        hideLoader();
    }
}
// Fin fonction showMediaDetail

// Début fonction addComment
async function addComment(mediaId) {
    const textarea = document.getElementById('newComment');
    const content = textarea.value.trim();
    if (!content) return;

    showLoader();
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_media_comments')
            .insert([{
                media_id: mediaId,
                author_hubisoccer_id: userProfile.hubisoccer_id,
                content
            }]);
        if (error) throw error;
        showToast('Commentaire ajouté', 'success');
        textarea.value = '';
        await showMediaDetail(mediaId);
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'ajout du commentaire', 'error');
    } finally {
        hideLoader();
    }
}
// Fin fonction addComment

// Début UI Sidebar
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open(); else if (dx < 0) close();
    }, { passive: false });
}
// Fin UI Sidebar

// Début UI Menu utilisateur
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin UI Menu utilisateur

// Début UI Déconnexion
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin UI Déconnexion

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!userProfile) return;
    await loadMedia();
    initFilters();
    initSidebar();
    initUserMenu();
    initLogout();

    document.getElementById('openUploadModal').addEventListener('click', openUploadModal);
    window.closeUploadModal = closeUploadModal;
    window.closeDetailModal = closeDetailModal;
    window.showMediaDetail = showMediaDetail;
    window.addComment = addComment;

    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation DOM
