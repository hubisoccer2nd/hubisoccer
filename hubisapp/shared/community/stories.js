// ============================================================
//  HUBISOCCER — STORIES.JS (VERSION CORRIGÉE – ROBUSTE)
//  PARTIE 1/3 : Variables globales, session, chargement liste
// ============================================================
//  Corrections :
//  - Vérification de currentProfile
//  - Liens dropdown universels
//  - Gestion des erreurs améliorée
//  - Durée par défaut 60 min (dans HTML)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let myStory = null;
let storyGroups = [];
let activeGroupIdx = 0;
let activeStoryIdx = 0;
let isPaused = false;
let isMuted = false;
let storyTimer = null;
let storyStartTime = null;
let groupStartTime = null;
const MAX_GROUP_DURATION = 10 * 60 * 1000; // 10 minutes par groupe
let currentStoryDuration = 10000;
let mediaRecorder = null;
let audioChunks = [];
let recInterval = null;
let recSeconds = 0;
let pendingAudioBlob = null;
let pendingMediaReplyFile = null;
let pendingMediaReplyType = null;
let selectedCoinsAmount = 0;
let storyUploadFile = null;
let storyTextBg = 'linear-gradient(135deg,#551B8C,#3d1266)';
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let longPressTimer = null;
let currentOptionsStory = null; // stocke la story courante pour les options
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : SESSION ET AVATAR ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;
        
        // Vérification que currentProfile est bien défini
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
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'svReplyAvatar', 'svReplyAvatarInitials');
        
        // Liens dropdown universels (tous rôles)
        // Note : stories.html n'a pas de dropdown, mais la navbar est différente. On laisse tel quel.
        // Si besoin, on pourra ajouter plus tard.
        
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
        // Ma story
        const { data: mine } = await sb
            .from('supabaseAuthPrive_stories')
            .select('*')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        myStory = mine;
        
        // Récupérer les abonnements
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
        
        renderStoriesList();
        setupMyStoryUI();
    } catch (err) {
        toast('Erreur chargement stories : ' + err.message, 'error');
    }
}
// ========== FIN : CHARGEMENT DES STORIES ==========

// ========== DEBUT : RENDU DE LA LISTE ==========
function renderStoriesList() {
    const followList = document.getElementById('followingStoriesList');
    
    if (storyGroups.length === 0) {
        followList.innerHTML = '<p style="color:var(--gray);font-size:0.82rem;padding:10px 0">Aucune nouvelle story.</p>';
    } else {
        followList.innerHTML = storyGroups.map((g, i) => makeStoryListItem(g, i)).join('');
    }
    
    const followingSectionTitle = document.querySelector('.following-stories-section h3');
    if (followingSectionTitle) followingSectionTitle.textContent = 'HubIS Enjoy';
    const mySectionTitle = document.querySelector('.my-story-section h3');
    if (mySectionTitle) mySectionTitle.textContent = 'My HubIS Mood';
    
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

function setupMyStoryUI() {
    const addEl = document.getElementById('myStoryAdd');
    const existingEl = document.getElementById('myStoryExisting');
    
    if (myStory) {
        addEl.style.display = 'none';
        existingEl.style.display = 'flex';
        const thumbImg = document.getElementById('myStoryThumbImg');
        if (myStory.media_url) {
            thumbImg.src = myStory.media_url;
            thumbImg.style.display = 'block';
        } else {
            thumbImg.style.display = 'none';
        }
        document.getElementById('myStoryTime').textContent = timeSince(myStory.created_at);
    } else {
        addEl.style.display = 'flex';
        existingEl.style.display = 'none';
    }
    
    addEl.removeEventListener('click', openUploadModal);
    addEl.addEventListener('click', openUploadModal);
}

function openUploadModal() {
    openModal('modalUploadStory');
}
// ========== FIN : RENDU DE LA LISTE ==========
// ============================================================
//  HUBISOCCER — STORIES.JS (VERSION CORRIGÉE – ROBUSTE)
//  PARTIE 2/3 : Visionneuse (ouverture, rendu, timers, navigation)
// ============================================================

// ========== DEBUT : OUVERTURE DE LA VISIONNEUSE ==========
function openStoryGroup(groupIdx) {
    if (groupIdx < 0 || groupIdx >= storyGroups.length) return;

    activeGroupIdx = groupIdx;
    activeStoryIdx = 0;
    groupStartTime = Date.now();

    document.getElementById('storiesListPage').style.display = 'none';
    document.getElementById('storyViewerPage').style.display = 'flex';

    renderCurrentStory();
    setupSwipeGestures();
}

function viewMyStory() {
    if (!myStory) {
        toast('Vous n\'avez pas de story active', 'info');
        return;
    }
    const tempGroup = {
        profile: currentProfile,
        stories: [myStory],
        userId: currentProfile.hubisoccer_id,
        isOwn: true
    };
    storyGroups.unshift(tempGroup);
    openStoryGroup(0);
}
window.viewMyStory = viewMyStory;
// ========== FIN : OUVERTURE DE LA VISIONNEUSE ==========

// ========== DEBUT : RENDU DE LA STORY COURANTE ==========
function renderCurrentStory() {
    const group = storyGroups[activeGroupIdx];
    if (!group) { closeViewer(); return; }

    if (groupStartTime && Date.now() - groupStartTime >= MAX_GROUP_DURATION) {
        toast('Limite de 10 minutes atteinte pour ce groupe', 'info');
        goToNextGroup();
        return;
    }

    const story = group.stories[activeStoryIdx];
    if (!story) { goToNextGroup(); return; }

    clearStoryTimer();
    buildProgressBars(group.stories.length);

    const p = group.profile || {};
    const name = p.full_name || p.display_name || 'Utilisateur';
    updateAvatarDisplay(p.avatar_url, name, 'svAuthorAvatar', 'svAuthorAvatarInitials');
    document.getElementById('svAuthorName').textContent = name;
    document.getElementById('svAuthorTime').textContent = timeSince(story.created_at);
    document.getElementById('svAuthorHandle').textContent = p.feed_id ? '@' + p.feed_id : '';

    const isOwn = story.user_hubisoccer_id === currentProfile.hubisoccer_id;
    document.getElementById('svOptionsBtn').style.display = isOwn ? 'flex' : 'none';
    document.getElementById('svOtherOptionsBtn').style.display = !isOwn ? 'flex' : 'none';

    const captionEl = document.getElementById('svCaption');
    if (story.caption) {
        captionEl.textContent = story.caption;
        captionEl.style.display = 'block';
    } else {
        captionEl.style.display = 'none';
    }

    const mediaArea = document.getElementById('svMediaArea');
    const mediaLoader = document.getElementById('svMediaLoader');
    mediaLoader.style.display = 'flex';
    while (mediaArea.children.length > 1) {
        mediaArea.removeChild(mediaArea.lastChild);
    }

    currentStoryDuration = Math.min(3600, Math.max(5, story.duration || 10)) * 1000;

    if (story.media_type === 'video') {
        const vid = document.createElement('video');
        vid.className = 'sv-story-video';
        vid.src = story.media_url;
        vid.autoplay = true;
        vid.playsInline = true;
        vid.muted = isMuted;
        vid.loop = false;
        vid.onloadeddata = () => {
            mediaLoader.style.display = 'none';
            const videoDuration = vid.duration * 1000;
            const finalDuration = Math.min(currentStoryDuration, videoDuration || currentStoryDuration);
            startStoryTimer(finalDuration);
        };
        vid.onerror = () => {
            mediaLoader.style.display = 'none';
            startStoryTimer(currentStoryDuration);
        };
        mediaArea.appendChild(vid);
        document.getElementById('svMuteBtn').style.display = 'flex';
    } else if (story.media_type === 'text') {
        const div = document.createElement('div');
        div.className = 'sv-story-text-card';
        div.style.background = story.text_bg || 'linear-gradient(135deg,#551B8C,#3d1266)';
        div.textContent = story.text_content || '';
        mediaArea.appendChild(div);
        mediaLoader.style.display = 'none';
        document.getElementById('svMuteBtn').style.display = 'none';
        startStoryTimer(currentStoryDuration);
    } else {
        const img = document.createElement('img');
        img.className = 'sv-story-img';
        img.src = story.media_url;
        img.alt = '';
        img.onload = () => {
            mediaLoader.style.display = 'none';
            startStoryTimer(currentStoryDuration);
        };
        img.onerror = () => {
            mediaLoader.style.display = 'none';
            startStoryTimer(currentStoryDuration);
        };
        mediaArea.appendChild(img);
        document.getElementById('svMuteBtn').style.display = 'none';
    }

    markStoryViewed(story.id, group.userId);
}

function buildProgressBars(count) {
    const container = document.getElementById('svProgressBars');
    container.innerHTML = Array.from({ length: count }, (_, i) => `
        <div class="sv-prog-bar" data-bar-idx="${i}" onclick="jumpToStory(${i})">
            <div class="sv-prog-fill" id="progFill_${i}" style="width:${i < activeStoryIdx ? '100%' : '0%'}"></div>
        </div>
    `).join('');
}

function startStoryTimer(duration) {
    clearStoryTimer();
    isPaused = false;
    storyStartTime = Date.now();

    const fill = document.getElementById(`progFill_${activeStoryIdx}`);
    if (fill) {
        fill.style.transition = `width ${duration}ms linear`;
        setTimeout(() => { if (fill) fill.style.width = '100%'; }, 30);
    }

    storyTimer = setTimeout(() => { goToNextStory(); }, duration);
}

function clearStoryTimer() {
    if (storyTimer) {
        clearTimeout(storyTimer);
        storyTimer = null;
    }
}
// ========== FIN : RENDU DE LA STORY COURANTE ==========

// ========== DEBUT : PAUSE / REPRISE ==========
function pauseStory() {
    if (isPaused) return;
    isPaused = true;
    clearStoryTimer();
    const vid = document.querySelector('.sv-story-video');
    if (vid) vid.pause();
    const fill = document.getElementById(`progFill_${activeStoryIdx}`);
    if (fill) {
        const elapsed = Date.now() - (storyStartTime || Date.now());
        const pct = Math.min(100, (elapsed / currentStoryDuration) * 100);
        fill.style.transition = 'none';
        fill.style.width = pct + '%';
    }
}

function resumeStory() {
    if (!isPaused) return;
    isPaused = false;
    const elapsed = storyStartTime ? Date.now() - storyStartTime : 0;
    const remaining = Math.max(500, currentStoryDuration - elapsed);
    const vid = document.querySelector('.sv-story-video');
    if (vid) vid.play();
    const fill = document.getElementById(`progFill_${activeStoryIdx}`);
    if (fill) {
        fill.style.transition = `width ${remaining}ms linear`;
        setTimeout(() => { if (fill) fill.style.width = '100%'; }, 30);
    }
    storyTimer = setTimeout(() => { goToNextStory(); }, remaining);
}

function showPauseOverlay(show) {
    let el = document.querySelector('.sv-pause-overlay');
    if (!el) {
        el = document.createElement('div');
        el.className = 'sv-pause-overlay';
        el.innerHTML = '<div class="sv-pause-icon"><i class="fas fa-pause"></i></div>';
        document.getElementById('storyViewerPage').appendChild(el);
    }
    el.classList.toggle('visible', show);
}
// ========== FIN : PAUSE / REPRISE ==========

// ========== DEBUT : NAVIGATION ==========
function goToNextStory() {
    const group = storyGroups[activeGroupIdx];
    if (!group) { closeViewer(); return; }
    if (activeStoryIdx < group.stories.length - 1) {
        activeStoryIdx++;
        renderCurrentStory();
    } else {
        goToNextGroup();
    }
}

function goToPrevStory() {
    if (activeStoryIdx > 0) {
        activeStoryIdx--;
        renderCurrentStory();
    } else if (activeGroupIdx > 0) {
        activeGroupIdx--;
        activeStoryIdx = Math.max(0, (storyGroups[activeGroupIdx]?.stories.length || 1) - 1);
        groupStartTime = Date.now();
        renderCurrentStory();
    }
}

function goToNextGroup() {
    if (activeGroupIdx < storyGroups.length - 1) {
        activeGroupIdx++;
        activeStoryIdx = 0;
        groupStartTime = Date.now();
        renderCurrentStory();
    } else {
        closeViewer();
    }
}

function jumpToStory(idx) {
    const group = storyGroups[activeGroupIdx];
    if (!group || idx < 0 || idx >= group.stories.length) return;
    activeStoryIdx = idx;
    renderCurrentStory();
}
window.jumpToStory = jumpToStory;

function closeViewer() {
    clearStoryTimer();
    stopAudioRecorder();
    document.querySelectorAll('.sv-story-video').forEach(v => { v.pause(); v.src = ''; });
    document.getElementById('storyViewerPage').style.display = 'none';
    document.getElementById('storiesListPage').style.display = 'block';
    if (storyGroups[0]?.isOwn) {
        storyGroups.shift();
    }
    loadAllStories();
}

function toggleMute() {
    isMuted = !isMuted;
    const vid = document.querySelector('.sv-story-video');
    if (vid) vid.muted = isMuted;
    document.getElementById('svMuteIcon').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}
// ========== FIN : NAVIGATION ==========

// ========== DEBUT : GESTES TACTILES ==========
function setupSwipeGestures() {
    const viewer = document.getElementById('storyViewerPage');
    viewer.removeEventListener('touchstart', onTouchStart);
    viewer.removeEventListener('touchmove', onTouchMove);
    viewer.removeEventListener('touchend', onTouchEnd);
    viewer.addEventListener('touchstart', onTouchStart, { passive: false });
    viewer.addEventListener('touchmove', onTouchMove, { passive: false });
    viewer.addEventListener('touchend', onTouchEnd, { passive: true });
    document.getElementById('svTapPrev').addEventListener('click', goToPrevStory);
    document.getElementById('svTapNext').addEventListener('click', goToNextStory);
}

function onTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    longPressTimer = setTimeout(() => {
        pauseStory();
        showPauseOverlay(true);
    }, 200);
}

function onTouchMove(e) {
    clearTimeout(longPressTimer);
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 80 && Math.abs(e.touches[0].clientX - touchStartX) < 60) {
        document.getElementById('storyViewerPage').style.transform = `translateY(${dy}px)`;
        document.getElementById('storyViewerPage').style.opacity = `${1 - dy/300}`;
    }
}

function onTouchEnd(e) {
    clearTimeout(longPressTimer);
    showPauseOverlay(false);
    document.getElementById('storyViewerPage').style.transform = '';
    document.getElementById('storyViewerPage').style.opacity = '';

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;

    if (Math.abs(dx) > 80 && Math.abs(dy) < 60 && dt < 400) {
        if (dx < 0) goToNextGroup();
        else goToPrevStory();
        return;
    }
    if (dy > 100 && Math.abs(dx) < 80) {
        closeViewer();
        return;
    }
    if (dt > 200 && isPaused) {
        resumeStory();
    }
}
// ========== FIN : GESTES TACTILES ==========

// ========== DEBUT : MARQUAGE DES VUES ==========
async function markStoryViewed(storyId, authorId) {
    if (authorId === currentProfile.hubisoccer_id) return;
    try {
        await sb.from('supabaseAuthPrive_story_views').upsert({
            story_id: storyId,
            viewer_hubisoccer_id: currentProfile.hubisoccer_id,
            viewed_at: new Date().toISOString()
        }, { onConflict: 'story_id, viewer_hubisoccer_id' });
    } catch (err) {
        console.warn('Erreur marquage vue:', err);
    }
}
// ========== FIN : MARQUAGE DES VUES ==========
// ============================================================
//  HUBISOCCER — STORIES.JS (VERSION CORRIGÉE – ROBUSTE)
//  PARTIE 3/3 : Réponses, réactions, options, upload, initialisation
// ============================================================

// ========== DEBUT : RÉPONSES TEXTE ==========
async function sendTextReply() {
    const input = document.getElementById('svReplyInput');
    const text = input.value.trim();
    if (!text) return;
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story) return;
    pauseStory();
    input.value = '';
    try {
        await sendStoryReplyMessage(story.user_hubisoccer_id, text, null, null);
        toast('Réponse envoyée ✅', 'success');
    } catch (err) {
        toast('Erreur envoi réponse : ' + err.message, 'error');
    }
    resumeStory();
}
// ========== FIN : RÉPONSES TEXTE ==========

// ========== DEBUT : ENREGISTREUR AUDIO ==========
async function startAudioRecorder() {
    try {
        pauseStory();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        recSeconds = 0;
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            pendingAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            await uploadAndSendAudioReply();
        };
        mediaRecorder.start();
        document.getElementById('svAudioRecorder').style.display = 'flex';
        document.getElementById('svReplyRow').style.display = 'none';
        recInterval = setInterval(() => {
            recSeconds++;
            const m = Math.floor(recSeconds / 60);
            const s = recSeconds % 60;
            document.getElementById('svRecTime').textContent = `${m}:${s.toString().padStart(2, '0')}`;
            if (recSeconds >= 300) stopAudioRecorder();
        }, 1000);
    } catch (err) {
        toast('Impossible d\'accéder au micro', 'warning');
        resumeStory();
    }
}

function stopAudioRecorder() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    clearInterval(recInterval);
    document.getElementById('svAudioRecorder').style.display = 'none';
    document.getElementById('svReplyRow').style.display = 'flex';
}

function cancelAudioRecorder() {
    pendingAudioBlob = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.ondataavailable = null;
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
    }
    clearInterval(recInterval);
    document.getElementById('svAudioRecorder').style.display = 'none';
    document.getElementById('svReplyRow').style.display = 'flex';
    resumeStory();
    toast('Enregistrement annulé', 'info');
}

async function uploadAndSendAudioReply() {
    if (!pendingAudioBlob) return;
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story) return;
    try {
        const fileName = `story_reply_audio/${currentProfile.hubisoccer_id}_${Date.now()}.webm`;
        const { error: upErr } = await sb.storage.from('post_media').upload(fileName, pendingAudioBlob);
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from('post_media').getPublicUrl(fileName);
        await sendStoryReplyMessage(story.user_hubisoccer_id, '🎤 Message vocal', urlData.publicUrl, 'audio');
        toast('Message vocal envoyé ✅', 'success');
    } catch (err) {
        toast('Erreur envoi audio : ' + err.message, 'error');
    }
    pendingAudioBlob = null;
    resumeStory();
}
// ========== FIN : ENREGISTREUR AUDIO ==========

// ========== DEBUT : RÉPONSES MÉDIA (PHOTO/VIDÉO) ==========
function openMediaReply(type) {
    pendingMediaReplyType = type;
    pauseStory();
    document.getElementById('mediaReplyTitle').textContent = type === 'photo' ? 'Répondre par photo' : 'Répondre par vidéo';
    document.getElementById('mediaReplyIcon').className = type === 'photo' ? 'fas fa-camera' : 'fas fa-video';
    document.getElementById('mediaReplyHint').textContent = `Clique pour choisir une ${type === 'photo' ? 'photo' : 'vidéo'}`;
    document.getElementById('mediaReplyInput').accept = type === 'photo' ? 'image/*' : 'video/*';
    document.getElementById('mediaReplyPreview').innerHTML = `
        <div class="media-reply-drop" id="mediaReplyDrop">
            <i class="fas ${type === 'photo' ? 'fa-camera' : 'fa-video'}" style="font-size:2rem;color:var(--gray)"></i>
            <p>Clique pour choisir une ${type === 'photo' ? 'photo' : 'vidéo'}</p>
            <input type="file" id="mediaReplyInput" accept="${type === 'photo' ? 'image/*' : 'video/*'}" style="display:none">
        </div>
    `;
    const dropEl = document.getElementById('mediaReplyDrop');
    const inputEl = document.getElementById('mediaReplyInput');
    dropEl.addEventListener('click', () => inputEl.click());
    inputEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pendingMediaReplyFile = file;
        const url = URL.createObjectURL(file);
        const isVid = file.type.startsWith('video/');
        document.getElementById('mediaReplyPreview').innerHTML = isVid
            ? `<video src="${url}" controls style="width:100%;max-height:200px;border-radius:8px"></video>`
            : `<img src="${url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px">`;
    });
    openModal('modalMediaReply');
}

async function sendMediaReply() {
    if (!pendingMediaReplyFile) {
        toast('Sélectionne un fichier', 'warning');
        return;
    }
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story) return;
    const btn = document.getElementById('sendMediaReplyBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const ext = pendingMediaReplyFile.name.split('.').pop();
        const path = `story_replies/${currentProfile.hubisoccer_id}_${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('post_media').upload(path, pendingMediaReplyFile);
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
        const caption = document.getElementById('mediaReplyCaption').value.trim();
        const mediaType = pendingMediaReplyFile.type.startsWith('video/') ? 'video' : 'image';
        await sendStoryReplyMessage(story.user_hubisoccer_id, caption || `📷 ${mediaType === 'video' ? 'Vidéo' : 'Photo'}`, urlData.publicUrl, mediaType);
        closeModal('modalMediaReply');
        toast('Réponse envoyée ✅', 'success');
        pendingMediaReplyFile = null;
        document.getElementById('mediaReplyCaption').value = '';
    } catch (err) {
        toast('Erreur envoi : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
        resumeStory();
    }
}
// ========== FIN : RÉPONSES MÉDIA ==========

// ========== DEBUT : ENVOI DE MESSAGE (CONVERSATION) ==========
async function sendStoryReplyMessage(recipientId, content, mediaUrl, mediaType) {
    try {
        const { data: myParts } = await sb
            .from('supabaseAuthPrive_conversation_participants')
            .select('conversation_id')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        const myConvIds = (myParts || []).map(p => p.conversation_id);
        let convId = null;
        for (const cid of myConvIds) {
            const { data: parts } = await sb
                .from('supabaseAuthPrive_conversation_participants')
                .select('user_hubisoccer_id')
                .eq('conversation_id', cid);
            if (parts?.length === 2 && parts.some(p => p.user_hubisoccer_id === recipientId)) {
                convId = cid;
                break;
            }
        }
        if (!convId) {
            const { data: newConv } = await sb
                .from('supabaseAuthPrive_conversations')
                .insert({ is_group: false })
                .select()
                .single();
            if (newConv) {
                convId = newConv.id;
                await sb.from('supabaseAuthPrive_conversation_participants').insert([
                    { conversation_id: convId, user_hubisoccer_id: currentProfile.hubisoccer_id },
                    { conversation_id: convId, user_hubisoccer_id: recipientId }
                ]);
            }
        }
        if (!convId) return;
        await sb.from('supabaseAuthPrive_messages').insert({
            conversation_id: convId,
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl || null,
            media_type: mediaType || null,
            deleted_for: [],
            reactions: {},
            edited: false,
            pinned: false
        });
        await sb.from('supabaseAuthPrive_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);
    } catch (err) {
        console.warn('Messagerie non disponible:', err);
    }
}
// ========== FIN : ENVOI DE MESSAGE ==========

// ========== DEBUT : RÉACTIONS EMOJI ==========
async function sendStoryReaction(emoji) {
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story) return;
    closeModal('modalStoryReact');
    try {
        const { data: existing } = await sb
            .from('supabaseAuthPrive_story_reactions')
            .select('id, emoji')
            .eq('story_id', story.id)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        if (existing) {
            if (existing.emoji === emoji) {
                await sb.from('supabaseAuthPrive_story_reactions').delete().eq('id', existing.id);
            } else {
                await sb.from('supabaseAuthPrive_story_reactions').update({ emoji }).eq('id', existing.id);
            }
        } else {
            await sb.from('supabaseAuthPrive_story_reactions').insert({
                story_id: story.id,
                user_hubisoccer_id: currentProfile.hubisoccer_id,
                emoji
            });
        }
        if (story.user_hubisoccer_id !== currentProfile.hubisoccer_id) {
            try {
                await sendStoryReplyMessage(story.user_hubisoccer_id, emoji + ' a réagi à ta story', null, null);
            } catch (e) { /* silencieux */ }
        }
        toast(`${emoji} Réaction envoyée !`, 'success');
        const likeBtn = document.getElementById('svLikeStoryBtn');
        const likeIcon = document.getElementById('svLikeIcon');
        likeBtn.classList.add('liked');
        likeIcon.className = 'fas fa-heart';
    } catch (err) {
        toast('Erreur réaction : ' + err.message, 'error');
    }
    resumeStory();
}
// ========== FIN : RÉACTIONS EMOJI ==========

// ========== DEBUT : HUBICOINS ==========
async function loadCoinsBalance() {
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        document.getElementById('coinsBalance').textContent = (data?.balance || 0) + ' 🪙';
    } catch (err) {
        document.getElementById('coinsBalance').textContent = '0 🪙';
    }
}

async function sendHubiCoins() {
    const amount = selectedCoinsAmount || parseInt(document.getElementById('coinsCustomAmount').value || '0');
    const message = document.getElementById('coinsMessage').value.trim();
    if (!amount || amount <= 0) {
        toast('Indique un montant', 'warning');
        return;
    }
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story || story.user_hubisoccer_id === currentProfile.hubisoccer_id) {
        toast('Impossible d\'envoyer des Coins à soi-même', 'warning');
        return;
    }
    const btn = document.getElementById('confirmSendCoinsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const { data: wallet } = await sb
            .from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        const balance = wallet?.balance || 0;
        if (balance < amount) {
            toast('Solde insuffisant', 'error');
            return;
        }
        await sb.from('supabaseAuthPrive_hubis_wallets')
            .upsert({ user_hubisoccer_id: currentProfile.hubisoccer_id, balance: balance - amount }, { onConflict: 'user_hubisoccer_id' });
        const { data: recWallet } = await sb
            .from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', story.user_hubisoccer_id)
            .maybeSingle();
        await sb.from('supabaseAuthPrive_hubis_wallets')
            .upsert({ user_hubisoccer_id: story.user_hubisoccer_id, balance: (recWallet?.balance || 0) + amount }, { onConflict: 'user_hubisoccer_id' });
        await sb.from('supabaseAuthPrive_hubis_transactions').insert({
            sender_hubisoccer_id: currentProfile.hubisoccer_id,
            receiver_hubisoccer_id: story.user_hubisoccer_id,
            amount,
            type: 'story_gift',
            reference_id: story.id,
            message: message || null
        });
        await sb.from('supabaseAuthPrive_notifications').insert({
            recipient_hubisoccer_id: story.user_hubisoccer_id,
            type: 'coins_received',
            title: 'HubiCoins reçus',
            message: `${currentProfile.full_name || currentProfile.display_name} t'a envoyé ${amount} HubiCoins 🪙${message ? ' : "' + message + '"' : ''}`,
            data: { link: 'feed.html' }
        });
        try {
            await sendStoryReplyMessage(story.user_hubisoccer_id, `🪙 ${amount} HubiCoins envoyés !${message ? ' "' + message + '"' : ''}`, null, null);
        } catch (e) { /* silencieux */ }
        closeModal('modalSendCoins');
        toast(`${amount} 🪙 HubiCoins envoyés ! ✅`, 'success');
        document.getElementById('coinsCustomAmount').value = '';
        document.getElementById('coinsMessage').value = '';
        selectedCoinsAmount = 0;
        document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
    } catch (err) {
        toast('Erreur envoi HubiCoins : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
    }
}
// ========== FIN : HUBICOINS ==========

// ========== DEBUT : AFFICHAGE DES VUES ==========
function openMyStoryOptions() {
    let story = null;
    if (document.getElementById('storyViewerPage').style.display === 'flex') {
        const group = storyGroups[activeGroupIdx];
        story = group?.stories[activeStoryIdx];
    } else {
        story = myStory;
    }

    if (!story) {
        toast('Aucune story trouvée', 'warning');
        return;
    }

    currentOptionsStory = story;
    openModal('modalMyStoryOptions');
}
window.openMyStoryOptions = openMyStoryOptions;

async function showStoryViewers() {
    closeModal('modalMyStoryOptions');
    const story = currentOptionsStory || storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;

    try {
        const { data } = await sb
            .from('supabaseAuthPrive_story_views')
            .select('*, viewer:supabaseAuthPrive_profiles!viewer_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('story_id', story.id)
            .order('viewed_at', { ascending: false });
        document.getElementById('svViewersCount').textContent = data?.length || 0;
        const list = document.getElementById('svViewersList');
        list.innerHTML = (data || []).map(v => {
            const viewer = v.viewer || {};
            const name = viewer.full_name || viewer.display_name || 'Utilisateur';
            const avatarUrl = viewer.avatar_url;
            return `<div class="sv-viewer-item">
                <div class="sv-viewer-avatar-initials" style="display:${avatarUrl ? 'none' : 'flex'};">${getInitials(name)}</div>
                <img src="${avatarUrl || ''}" alt="" style="display:${avatarUrl ? 'block' : 'none'}; width:36px;height:36px;border-radius:50%;object-fit:cover;">
                <span class="sv-viewer-name">${escapeHtml(name)}</span>
                <span class="sv-viewer-time">${timeSince(v.viewed_at)}</span>
            </div>`;
        }).join('') || '<p style="color:var(--gray);text-align:center;padding:20px">Aucune vue</p>';
        document.getElementById('svViewersPanel').style.display = 'flex';
    } catch (err) {
        toast('Erreur chargement vues : ' + err.message, 'error');
    }
}
window.showStoryViewers = showStoryViewers;

function closeViewersPanel() {
    document.getElementById('svViewersPanel').style.display = 'none';
    resumeStory();
}
window.closeViewersPanel = closeViewersPanel;
// ========== FIN : AFFICHAGE DES VUES ==========

// ========== DEBUT : OPTIONS DE SA PROPRE STORY ==========
function openSvOptions() {
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!story) return;
    const isOwn = story.user_hubisoccer_id === currentProfile.hubisoccer_id;
    pauseStory();
    if (isOwn) {
        currentOptionsStory = story;
        openModal('modalMyStoryOptions');
    } else {
        openModal('modalOtherStoryOptions');
    }
}
window.openSvOptions = openSvOptions;

function confirmDeleteStory() {
    closeModal('modalMyStoryOptions');
    openModal('modalConfirmDelete');
}
window.confirmDeleteStory = confirmDeleteStory;

async function deleteStory() {
    const story = currentOptionsStory || storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story || story.user_hubisoccer_id !== currentProfile.hubisoccer_id) return;

    try {
        await sb.from('supabaseAuthPrive_stories').delete().eq('id', story.id);
        toast('Story supprimée', 'success');
        closeModal('modalConfirmDelete');

        if (myStory && myStory.id === story.id) {
            myStory = null;
        }

        const group = storyGroups[activeGroupIdx];
        if (group) {
            group.stories = group.stories.filter(s => s.id !== story.id);
            if (group.stories.length === 0) {
                storyGroups.splice(activeGroupIdx, 1);
                closeViewer();
            } else {
                activeStoryIdx = Math.min(activeStoryIdx, group.stories.length - 1);
                renderCurrentStory();
            }
        }

        setupMyStoryUI();
        renderStoriesList();
    } catch (err) {
        toast('Erreur suppression : ' + err.message, 'error');
    }
}
window.deleteStory = deleteStory;

async function downloadMyStory() {
    closeModal('modalMyStoryOptions');
    const story = currentOptionsStory || storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story?.media_url) {
        toast('Téléchargement non disponible', 'info');
        resumeStory();
        return;
    }
    const a = document.createElement('a');
    a.href = story.media_url;
    a.download = `hubisoccer_story_${Date.now()}.${story.media_type === 'video' ? 'mp4' : 'jpg'}`;
    a.target = '_blank';
    a.click();
    toast('Téléchargement démarré', 'success');
    resumeStory();
}
window.downloadMyStory = downloadMyStory;

function openHideStoryOptions() {
    closeModal('modalMyStoryOptions');
    toast('Fonctionnalité à venir', 'info');
    resumeStory();
}
window.openHideStoryOptions = openHideStoryOptions;
// ========== FIN : OPTIONS DE SA PROPRE STORY ==========

// ========== DEBUT : MASQUAGE / SIGNALEMENT STORY AUTRE ==========
async function muteStoryAuthor() {
    closeModal('modalOtherStoryOptions');
    const group = storyGroups[activeGroupIdx];
    const story = group?.stories[activeStoryIdx];
    if (!group || !story) return;

    try {
        for (const s of group.stories) {
            const { data: storyData } = await sb
                .from('supabaseAuthPrive_stories')
                .select('hidden_for')
                .eq('id', s.id)
                .single();
            const hiddenFor = storyData?.hidden_for || [];
            if (!hiddenFor.includes(currentProfile.hubisoccer_id)) {
                hiddenFor.push(currentProfile.hubisoccer_id);
                await sb.from('supabaseAuthPrive_stories')
                    .update({ hidden_for: hiddenFor })
                    .eq('id', s.id);
            }
        }
        toast('Stories masquées', 'success');

        storyGroups.splice(activeGroupIdx, 1);
        if (storyGroups.length === 0) {
            closeViewer();
        } else {
            activeGroupIdx = Math.min(activeGroupIdx, storyGroups.length - 1);
            activeStoryIdx = 0;
            renderCurrentStory();
        }
        renderStoriesList();
    } catch (err) {
        toast('Erreur masquage : ' + err.message, 'error');
    }
    resumeStory();
}
window.muteStoryAuthor = muteStoryAuthor;

async function reportCurrentStory() {
    closeModal('modalOtherStoryOptions');
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;
    try {
        await sb.from('supabaseAuthPrive_reports').insert({
            story_id: story.id,
            reporter_hubisoccer_id: currentProfile.hubisoccer_id,
            reason: 'Signalé depuis la visionneuse'
        });
        toast('Story signalée. Merci !', 'success');
    } catch (err) {
        toast('Erreur signalement : ' + err.message, 'error');
    }
    resumeStory();
}
window.reportCurrentStory = reportCurrentStory;
// ========== FIN : MASQUAGE / SIGNALEMENT ==========

// ========== DEBUT : GESTION FICHIER UPLOAD ==========
function handleStoryFileSelect(file) {
    const maxSize = file.type.startsWith('video/') ? 900 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`Fichier trop volumineux (max ${file.type.startsWith('video/') ? '900' : '10'} Mo)`, 'warning');
        return;
    }
    storyUploadFile = file;
    const url = URL.createObjectURL(file);
    const preview = document.getElementById('storyFilePreview');
    const isVideo = file.type.startsWith('video/');
    preview.innerHTML = `
        <div style="position:relative">
            ${isVideo ? `<video src="${url}" controls style="width:100%;max-height:240px;border-radius:8px"></video>` : `<img src="${url}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px">`}
            <button class="story-preview-remove" onclick="clearStoryFile()"><i class="fas fa-times"></i></button>
        </div>
        <p style="font-size:0.72rem;color:var(--gray);margin-top:6px;text-align:center">${file.name} — ${(file.size/1024/1024).toFixed(1)} Mo</p>
    `;
    preview.style.display = 'block';
    document.getElementById('storyDropArea').style.display = 'none';
}

window.clearStoryFile = function() {
    storyUploadFile = null;
    document.getElementById('storyFilePreview').style.display = 'none';
    document.getElementById('storyFilePreview').innerHTML = '';
    document.getElementById('storyDropArea').style.display = 'flex';
    document.getElementById('storyFileInput').value = '';
};
// ========== FIN : GESTION FICHIER UPLOAD ==========

// ========== DEBUT : STYLES TEXTE ==========
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
// ========== FIN : STYLES TEXTE ==========

// ========== DEBUT : PUBLICATION D'UNE STORY ==========
async function publishStory() {
    const caption = document.getElementById('storyCaptionInput').value.trim();
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
            duration: Math.min(3600, Math.max(5, duration)), // Entre 5s et 60min
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
        document.getElementById('storyTextContent').value = '';
        document.getElementById('storyFilePreview').style.display = 'none';
        document.getElementById('storyDropArea').style.display = 'flex';
        document.getElementById('storyFileInput').value = '';

        await loadAllStories();
    } catch (err) {
        toast('Erreur publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
    }
}
// ========== FIN : PUBLICATION D'UNE STORY ==========

// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Chargement des stories...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    await loadAllStories();
    await loadCoinsBalance();
    setLoader(false);
    document.getElementById('storiesListPage').style.display = 'block';

    // Vérifier si un groupe/story est demandé dans l'URL
    const params = new URLSearchParams(window.location.search);
    const groupUserId = params.get('user') || params.get('group');
    const storyId = params.get('story');

    if (groupUserId) {
        const idx = storyGroups.findIndex(g => g.userId === groupUserId);
        if (idx >= 0) {
            openStoryGroup(idx);
            if (storyId) {
                const group = storyGroups[idx];
                const storyIdx = group.stories.findIndex(s => s.id === storyId);
                if (storyIdx >= 0) {
                    setTimeout(() => jumpToStory(storyIdx), 100);
                }
            }
        }
    }

    // Écouteurs visionneuse
    document.getElementById('svCloseBtn').addEventListener('click', closeViewer);
    document.getElementById('svOptionsBtn').addEventListener('click', openSvOptions);
    document.getElementById('svOtherOptionsBtn').addEventListener('click', openSvOptions);
    document.getElementById('svMuteBtn').addEventListener('click', toggleMute);

    // Réponse texte
    const replyInput = document.getElementById('svReplyInput');
    if (replyInput) {
        replyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendTextReply(); });
        replyInput.addEventListener('focus', pauseStory);
        replyInput.addEventListener('blur', resumeStory);
    }
    document.getElementById('svReplySendBtn')?.addEventListener('click', sendTextReply);

    // Audio
    document.getElementById('svSendAudioBtn')?.addEventListener('click', startAudioRecorder);
    document.getElementById('svRecStop')?.addEventListener('click', stopAudioRecorder);
    document.getElementById('svRecCancel')?.addEventListener('click', cancelAudioRecorder);

    // Média
    document.getElementById('svSendPhotoBtn')?.addEventListener('click', () => openMediaReply('photo'));
    document.getElementById('svSendVideoBtn')?.addEventListener('click', () => openMediaReply('video'));
    document.getElementById('sendMediaReplyBtn')?.addEventListener('click', sendMediaReply);

    // Réactions
    document.getElementById('svLikeStoryBtn')?.addEventListener('click', () => {
        pauseStory();
        openModal('modalStoryReact');
    });
    document.querySelectorAll('.story-react-grid span').forEach(el => {
        el.addEventListener('click', () => sendStoryReaction(el.dataset.emoji));
    });

    // HubiCoins
    document.getElementById('svSendCoinsBtn')?.addEventListener('click', () => {
        pauseStory();
        loadCoinsBalance();
        openModal('modalSendCoins');
    });
    document.querySelectorAll('.coins-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCoinsAmount = parseInt(btn.dataset.amount);
            document.getElementById('coinsCustomAmount').value = '';
        });
    });
    document.getElementById('coinsCustomAmount')?.addEventListener('input', () => {
        document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
        selectedCoinsAmount = 0;
    });
    document.getElementById('confirmSendCoinsBtn')?.addEventListener('click', sendHubiCoins);

    // Upload story
    const storyDropArea = document.getElementById('storyDropArea');
    if (storyDropArea) {
        storyDropArea.addEventListener('click', () => document.getElementById('storyFileInput').click());
        storyDropArea.addEventListener('dragover', (e) => { e.preventDefault(); storyDropArea.classList.add('dragging'); });
        storyDropArea.addEventListener('dragleave', () => storyDropArea.classList.remove('dragging'));
        storyDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            storyDropArea.classList.remove('dragging');
            const file = e.dataTransfer.files[0];
            if (file) handleStoryFileSelect(file);
        });
    }
    document.getElementById('storyFileInput')?.addEventListener('change', (e) => {
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

    // Styles texte
    initTextStyleButtons();

    // Publier
    document.getElementById('publishStoryBtn')?.addEventListener('click', publishStory);

    // Ouvrir modale upload
    document.getElementById('myStoryAdd')?.addEventListener('click', () => openModal('modalUploadStory'));

    // Suppression confirmée
    document.getElementById('deleteStoryConfirmBtn')?.addEventListener('click', deleteStory);

    // Fermeture modales
    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) {
                closeModal(m.id);
                resumeStory();
            }
        });
    });

    // Raccourcis clavier visionneuse
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('storyViewerPage').style.display !== 'flex') return;
        if (e.key === 'ArrowRight') goToNextStory();
        if (e.key === 'ArrowLeft') goToPrevStory();
        if (e.key === 'Escape') closeViewer();
        if (e.key === ' ') {
            e.preventDefault();
            isPaused ? resumeStory() : pauseStory();
        }
    });
}
// ========== FIN : INITIALISATION PRINCIPALE ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========

// ============================================================
//  FIN DU FICHIER STORIES.JS
// ============================================================