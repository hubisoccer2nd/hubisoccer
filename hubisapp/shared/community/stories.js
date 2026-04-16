// ============================================================
//  HUBISOCCER — STORIES.JS (LISTE) – PARTIE 1/2
//  Page de liste des stories (My HubIS Mood + HubIS Enjoy)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let myStories = []; // Toutes mes stories actives
let storyGroups = []; // Groupes de stories des abonnements
let currentOptionsStory = null; // Story sélectionnée pour les options
let storyUploadFile = null;
let storyTextBg = 'linear-gradient(135deg,#551B8C,#3d1266)';
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : SESSION ET AVATAR ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;
        
        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Erreur de profil. Veuillez vous reconnecter.', 'error');
            window.location.href = 'feed-setup.html';
            return false;
        }
        
        const { data: comm } = await sb
            .from('supabaseAuthPrive_communities')
            .select('id')
            .eq('hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        if (!comm) {
            toast('Vous devez créer votre communauté pour accéder aux stories', 'warning');
            window.location.href = 'feed-setup.html';
            return false;
        }
        
        document.getElementById('navUserName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'navUserAvatar', 'navUserAvatarInitials');
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'myStoryAvatar', 'myStoryAvatarInitials');
        
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
// ========== FIN : SESSION ET AVATAR ==========

// ========== DEBUT : CHARGEMENT DES STORIES ==========
async function loadAllStories() {
    try {
        // 1. Mes propres stories (toutes, pas seulement la dernière)
        const { data: mine } = await sb
            .from('supabaseAuthPrive_stories')
            .select('*')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
        myStories = mine || [];
        
        // 2. Récupérer les abonnements
        const { data: follows } = await sb
            .from('supabaseAuthPrive_follows')
            .select('following_hubisoccer_id')
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
        const followIds = (follows || []).map(f => f.following_hubisoccer_id).filter(id => id !== currentProfile.hubisoccer_id);
        
        let allStories = [];
        if (followIds.length > 0) {
            const { data } = await sb
                .from('supabaseAuthPrive_stories')
                .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, feed_id, role_code)')
                .in('user_hubisoccer_id', followIds)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });
            allStories = data || [];
        }
        
        // Regrouper par auteur
        const groups = {};
        allStories.forEach(s => {
            if (s.hidden_for && s.hidden_for.includes(currentProfile.hubisoccer_id)) return;
            if (!groups[s.user_hubisoccer_id]) {
                groups[s.user_hubisoccer_id] = { profile: s.author, stories: [], userId: s.user_hubisoccer_id };
            }
            groups[s.user_hubisoccer_id].stories.push(s);
        });
        storyGroups = Object.values(groups);
        
        renderMyStories();
        renderFollowingStories();
    } catch (err) {
        toast('Erreur chargement stories : ' + err.message, 'error');
    }
}
// ========== FIN : CHARGEMENT DES STORIES ==========

// ========== DEBUT : RENDU DE MES STORIES ==========
function renderMyStories() {
    const addEl = document.getElementById('myStoryAdd');
    const existingEl = document.getElementById('myStoryExisting');
    const thumbsContainer = document.getElementById('myStoriesList');
    
    if (myStories.length === 0) {
        addEl.style.display = 'flex';
        existingEl.style.display = 'none';
    } else {
        addEl.style.display = 'none';
        existingEl.style.display = 'flex';
        
        // Afficher toutes les miniatures (max 5 visibles, mais on peut scroller)
        thumbsContainer.innerHTML = myStories.map(story => {
            const thumbUrl = story.media_url || '';
            const isVideo = story.media_type === 'video';
            const time = timeSince(story.created_at);
            return `
                <div class="my-story-thumb" onclick="viewMyStories('${story.id}')">
                    <div class="story-thumb-wrap active-story">
                        ${thumbUrl ? (isVideo ? `<video src="${thumbUrl}" muted></video>` : `<img src="${thumbUrl}" alt="">`) : ''}
                        <div class="story-thumb-overlay"><span>${time}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function viewMyStories(storyId) {
    // Redirige vers la visionneuse avec toutes mes stories
    window.location.href = `stories-view.html?user=${currentProfile.hubisoccer_id}&story=${storyId}`;
}
window.viewMyStories = viewMyStories;
// ========== FIN : RENDU DE MES STORIES ==========

// ========== DEBUT : RENDU DES STORIES DES ABONNÉS ==========
function renderFollowingStories() {
    const followList = document.getElementById('followingStoriesList');
    
    if (storyGroups.length === 0) {
        followList.innerHTML = '<p style="color:var(--gray);font-size:0.82rem;padding:10px 0">Aucune nouvelle story.</p>';
    } else {
        followList.innerHTML = storyGroups.map((g, i) => makeStoryListItem(g, i)).join('');
    }
    
    document.querySelectorAll('.story-list-item').forEach(el => {
        el.addEventListener('click', () => openStoryGroup(parseInt(el.dataset.groupIdx)));
    });
}

function makeStoryListItem(g, idx) {
    const p = g.profile || {};
    const name = p.full_name || p.display_name || 'Utilisateur';
    const avatarUrl = p.avatar_url;
    const initials = getInitials(name);
    return `
        <div class="story-list-item" data-group-idx="${idx}">
            <div class="story-list-avatar-wrap">
                ${avatarUrl ? `<img src="${avatarUrl}" alt="" style="display:block;">` : ''}
                <div class="story-list-avatar-initials" style="display:${avatarUrl ? 'none' : 'flex'};">${initials}</div>
            </div>
            <div class="story-list-info">
                <div class="story-list-name">${escapeHtml(name)}</div>
                <div class="story-list-meta">
                    ${g.stories.length} story${g.stories.length > 1 ? 's' : ''} ·
                    ${timeSince(g.stories[0].created_at)}
                </div>
            </div>
            <div class="story-list-count">${g.stories.length}</div>
        </div>
    `;
}

function openStoryGroup(groupIdx) {
    const group = storyGroups[groupIdx];
    if (!group) return;
    // Redirige vers la visionneuse avec la première story du groupe
    window.location.href = `stories-view.html?user=${group.userId}&story=${group.stories[0].id}`;
}
// ========== FIN : RENDU DES STORIES DES ABONNÉS ==========

// ========== DEBUT : OPTIONS (DEPUIS LA LISTE) ==========
let currentOptionsStoryId = null;

function openMyStoryOptions() {
    // On utilise la première story pour les options (ou on pourrait choisir)
    if (myStories.length === 0) return;
    currentOptionsStory = myStories[0];
    openModal('modalMyStoryOptions');
}
window.openMyStoryOptions = openMyStoryOptions;

async function showStoryViewers() {
    if (!currentOptionsStory) return;
    closeModal('modalMyStoryOptions');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_story_views')
            .select('*, viewer:supabaseAuthPrive_profiles!viewer_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('story_id', currentOptionsStory.id)
            .order('viewed_at', { ascending: false });
        const list = document.getElementById('storyViewsList');
        list.innerHTML = (data || []).map(v => {
            const viewer = v.viewer || {};
            const name = viewer.full_name || viewer.display_name || 'Utilisateur';
            const avatarUrl = viewer.avatar_url;
            return `<li class="users-list-item" onclick="window.location.href='profil-feed.html?id=${viewer.hubisoccer_id}'">
                ${avatarUrl ? `<img src="${avatarUrl}" alt="">` : `<div class="user-avatar-placeholder">${getInitials(name)}</div>`}
                <span class="users-list-item-name">${escapeHtml(name)}</span>
            </li>`;
        }).join('') || '<li style="padding:16px;color:var(--gray);text-align:center">Aucune vue</li>';
        openModal('modalStoryViews');
    } catch (err) {
        toast('Erreur chargement vues : ' + err.message, 'error');
    }
}
window.showStoryViewers = showStoryViewers;

async function downloadMyStory() {
    if (!currentOptionsStory) return;
    closeModal('modalMyStoryOptions');
    if (!currentOptionsStory.media_url) {
        toast('Téléchargement non disponible', 'info');
        return;
    }
    const a = document.createElement('a');
    a.href = currentOptionsStory.media_url;
    a.download = `hubisoccer_story_${Date.now()}.${currentOptionsStory.media_type === 'video' ? 'mp4' : 'jpg'}`;
    a.target = '_blank';
    a.click();
    toast('Téléchargement démarré', 'success');
}
window.downloadMyStory = downloadMyStory;

function openHideStoryOptions() {
    closeModal('modalMyStoryOptions');
    toast('Fonctionnalité à venir', 'info');
}
window.openHideStoryOptions = openHideStoryOptions;

async function deleteMyStory() {
    if (!currentOptionsStory) return;
    if (!confirm('Supprimer cette story ?')) return;
    try {
        await sb.from('supabaseAuthPrive_stories').delete().eq('id', currentOptionsStory.id);
        toast('Story supprimée', 'success');
        closeModal('modalMyStoryOptions');
        await loadAllStories();
    } catch (err) {
        toast('Erreur suppression : ' + err.message, 'error');
    }
}
window.deleteMyStory = deleteMyStory;
// ========== FIN : OPTIONS ==========
// ============================================================
//  HUBISOCCER — STORIES.JS (LISTE) – PARTIE 2/2
//  Upload de story, initialisation, fin du fichier
// ============================================================

// ========== DEBUT : UPLOAD DE STORY ==========
function handleStoryFileSelect(file) {
    const maxSize = file.type.startsWith('video/') ? 900 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`Fichier trop volumineux (max ${file.type.startsWith('video/') ? '900' : '10'} Mo)`, 'warning');
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
                ${isVideo ? `<video src="${url}" controls style="width:100%;max-height:240px;border-radius:8px"></video>` : `<img src="${url}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px">`}
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
    document.getElementById('storyFileInput').value = '';
};

function initTextStyleButtons() {
    document.querySelectorAll('.txt-style-btn').forEach(btn => {
        btn.style.background = btn.dataset.bg;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.txt-style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            storyTextBg = btn.dataset.bg;
            document.getElementById('storyTextCanvas').style.background = btn.dataset.bg;
        });
    });
}

async function publishStory() {
    const caption = document.getElementById('storyCaptionInput')?.value.trim() || '';
    const duration = parseInt(document.getElementById('storyDurationSelect').value) || 10;
    const visibility = document.getElementById('storyVisibilitySelect').value;
    const activeType = document.querySelector('.story-type-tab.active')?.dataset.type || 'photo';
    const btn = document.getElementById('publishStoryBtn');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        let storyData = {
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            caption: caption || null,
            duration: Math.min(3600, Math.max(5, duration)),
            visibility,
            expires_at: expires.toISOString(),
            hidden_for: []
        };

        if (activeType === 'text') {
            const textContent = document.getElementById('storyTextContent').value.trim();
            if (!textContent) {
                toast('Écris quelque chose', 'warning');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
                return;
            }
            storyData.media_type = 'text';
            storyData.text_content = textContent;
            storyData.text_bg = storyTextBg;
        } else {
            if (!storyUploadFile) {
                toast('Sélectionne un fichier', 'warning');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
                return;
            }
            const ext = storyUploadFile.name.split('.').pop();
            const path = `stories/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, storyUploadFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            storyData.media_url = urlData.publicUrl;
            storyData.media_type = storyUploadFile.type.startsWith('video/') ? 'video' : 'image';
        }

        const { error } = await sb.from('supabaseAuthPrive_stories').insert(storyData);
        if (error) throw error;

        closeModal('modalUploadStory');
        toast('Story publiée ! 🎉', 'success');

        // Nettoyage
        storyUploadFile = null;
        document.getElementById('storyCaptionInput').value = '';
        const textField = document.getElementById('storyTextContent');
        if (textField) textField.value = '';
        clearStoryFile();

        await loadAllStories();
    } catch (err) {
        toast('Erreur publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
    }
}
// ========== FIN : UPLOAD DE STORY ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement des stories...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    await loadAllStories();
    setLoader(false);

    // Écouteurs pour l'upload
    document.getElementById('myStoryAdd').addEventListener('click', () => openModal('modalUploadStory'));
    document.getElementById('myStoryOptionsBtn').addEventListener('click', openMyStoryOptions);

    // Modale options
    document.getElementById('viewStoryViewsBtn').addEventListener('click', showStoryViewers);
    document.getElementById('downloadStoryBtn').addEventListener('click', downloadMyStory);
    document.getElementById('hideStoryBtn').addEventListener('click', openHideStoryOptions);
    document.getElementById('deleteStoryBtn').addEventListener('click', deleteMyStory);

    // Upload
    const dropArea = document.getElementById('storyDropArea');
    const fileInput = document.getElementById('storyFileInput');

    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragging'); });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragging'));
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

    // Tabs (photo/vidéo/texte)
    document.querySelectorAll('.story-type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.story-type-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.type;
            document.getElementById('storyUploadZone').style.display = type === 'text' ? 'none' : 'block';
            document.getElementById('storyTextZone').style.display = type === 'text' ? 'block' : 'none';
        });
    });

    initTextStyleButtons();
    document.getElementById('publishStoryBtn').addEventListener('click', publishStory);

    // Fermeture des modales
    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========

// ============================================================
//  FIN DU FICHIER STORIES.JS
// ============================================================