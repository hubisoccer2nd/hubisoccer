// ============================================================
//  HUBISOCCER — STORIES-VIEW.JS (VISIONNEUSE) – PARTIE 1/4
//  Variables globales, session, chargement initial
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let storyGroups = [];               // Groupes de stories (chaque groupe = un utilisateur)
let activeGroupIdx = 0;             // Index du groupe courant
let activeStoryIdx = 0;             // Index de la story courante dans le groupe
let isPaused = false;
let isMuted = false;
let storyTimer = null;
let storyStartTime = null;
let groupStartTime = null;
const MAX_GROUP_DURATION = 10 * 60 * 1000; // 10 minutes par groupe
let currentStoryDuration = 10000;   // en ms
let currentOptionsStory = null;     // Story actuellement ciblée par les options
let pendingMediaReplyFile = null;
let pendingMediaReplyType = null;
let selectedCoinsAmount = 0;
let mediaRecorder = null;
let audioChunks = [];
let recInterval = null;
let recSeconds = 0;
let pendingAudioBlob = null;
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
let longPressTimer = null;
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

        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'svReplyAvatar', 'svReplyAvatarInitials');
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

// ========== DEBUT : CHARGEMENT DES STORIES DEPUIS L'URL ==========
function getParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
        userId: params.get('user'),
        storyId: params.get('story')
    };
}

async function loadTargetStories(userId, storyId) {
    try {
        // Récupérer les stories de l'utilisateur cible
        const { data: stories, error } = await sb
            .from('supabaseAuthPrive_stories')
            .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, feed_id, role_code)')
            .eq('user_hubisoccer_id', userId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true }); // ordre chronologique pour la lecture

        if (error || !stories || stories.length === 0) {
            toast('Aucune story disponible', 'error');
            window.location.href = 'stories.html';
            return false;
        }

        // Regrouper (un seul groupe ici, mais on garde la structure)
        const group = {
            profile: stories[0].author,
            stories: stories,
            userId: userId
        };
        storyGroups = [group];

        // Trouver l'index de la story demandée
        const startIdx = stories.findIndex(s => s.id === storyId);
        activeStoryIdx = startIdx >= 0 ? startIdx : 0;
        activeGroupIdx = 0;

        return true;
    } catch (err) {
        toast('Erreur chargement : ' + err.message, 'error');
        window.location.href = 'stories.html';
        return false;
    }
}
// ========== FIN : CHARGEMENT ==========

// ========== DEBUT : RENDU DE LA STORY COURANTE ==========
function renderCurrentStory() {
    const group = storyGroups[activeGroupIdx];
    if (!group) { closeViewer(); return; }

    if (groupStartTime && Date.now() - groupStartTime >= MAX_GROUP_DURATION) {
        toast('Limite de 10 minutes atteinte pour ce groupe', 'info');
        closeViewer();
        return;
    }

    const story = group.stories[activeStoryIdx];
    if (!story) { closeViewer(); return; }

    clearStoryTimer();
    buildProgressBars(group.stories.length);

    // Auteur
    const p = group.profile || {};
    const name = p.full_name || p.display_name || 'Utilisateur';
    updateAvatarDisplay(p.avatar_url, name, 'svAuthorAvatar', 'svAuthorAvatarInitials');
    document.getElementById('svAuthorName').textContent = name;
    document.getElementById('svAuthorTime').textContent = timeSince(story.created_at);
    document.getElementById('svAuthorHandle').textContent = p.feed_id ? '@' + p.feed_id : '';

    // Options : toujours afficher les trois points (⋮)
    document.getElementById('svOptionsBtn').style.display = 'flex';
    currentOptionsStory = story;

    // Légende
    const captionEl = document.getElementById('svCaption');
    if (story.caption) {
        captionEl.textContent = story.caption;
        captionEl.style.display = 'block';
    } else {
        captionEl.style.display = 'none';
    }

    // Média
    const mediaArea = document.getElementById('svMediaArea');
    const mediaLoader = document.getElementById('svMediaLoader');
    mediaLoader.style.display = 'flex';
    while (mediaArea.children.length > 1) mediaArea.removeChild(mediaArea.lastChild);

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

    markStoryViewed(story.id);
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

    storyTimer = setTimeout(() => goToNextStory(), duration);
}

function clearStoryTimer() {
    if (storyTimer) {
        clearTimeout(storyTimer);
        storyTimer = null;
    }
}
// ========== FIN : RENDU ==========
// ============================================================
//  HUBISOCCER — STORIES-VIEW.JS (VISIONNEUSE) – PARTIE 2/4
//  Navigation, pause, mute, gestes, flèches, fermeture
// ============================================================

// ========== DEBUT : NAVIGATION ==========
function goToNextStory() {
    const group = storyGroups[activeGroupIdx];
    if (!group) { closeViewer(); return; }
    if (activeStoryIdx < group.stories.length - 1) {
        activeStoryIdx++;
        renderCurrentStory();
    } else {
        // Plus de story dans ce groupe → fermer
        closeViewer();
    }
}

function goToPrevStory() {
    if (activeStoryIdx > 0) {
        activeStoryIdx--;
        renderCurrentStory();
    }
    // Pas de groupe précédent dans cette version simple (un seul groupe)
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
    // Rediriger vers la page de liste
    window.location.href = 'stories.html';
}
// ========== FIN : NAVIGATION ==========

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
    storyTimer = setTimeout(() => goToNextStory(), remaining);
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

// ========== DEBUT : MUTE ==========
function toggleMute() {
    isMuted = !isMuted;
    const vid = document.querySelector('.sv-story-video');
    if (vid) vid.muted = isMuted;
    document.getElementById('svMuteIcon').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}
// ========== FIN : MUTE ==========

// ========== DEBUT : GESTES TACTILES ==========
function setupSwipeGestures() {
    const viewer = document.getElementById('storyViewerPage');
    viewer.addEventListener('touchstart', onTouchStart, { passive: false });
    viewer.addEventListener('touchmove', onTouchMove, { passive: false });
    viewer.addEventListener('touchend', onTouchEnd, { passive: true });
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

    // Swipe horizontal
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40 && dt < 400) {
        if (dx < 0) goToNextStory();
        else goToPrevStory();
        return;
    }
    // Swipe vers le bas → fermer
    if (dy > 100 && Math.abs(dx) < 60) {
        closeViewer();
        return;
    }
    // Tap simple pour pause/reprise (si pas de swipe)
    if (dt < 200 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        isPaused ? resumeStory() : pauseStory();
    }
}
// ========== FIN : GESTES TACTILES ==========

// ========== DEBUT : FLÈCHES DE NAVIGATION ==========
function setupArrowNavigation() {
    document.getElementById('svNavPrev').addEventListener('click', goToPrevStory);
    document.getElementById('svNavNext').addEventListener('click', goToNextStory);
    // Zones tactiles (tap zones)
    document.getElementById('svTapPrev').addEventListener('click', goToPrevStory);
    document.getElementById('svTapNext').addEventListener('click', goToNextStory);
}
// ========== FIN : FLÈCHES ==========

// ========== DEBUT : MARQUAGE DES VUES ==========
async function markStoryViewed(storyId) {
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
// ========== FIN : MARQUAGE ==========
// ============================================================
//  HUBISOCCER — STORIES-VIEW.JS (VISIONNEUSE) – PARTIE 3/4
//  Réponses (texte, audio, média), HubiCoins, réactions
// ============================================================

// ========== DEBUT : RÉPONSES TEXTE ==========
async function sendTextReply() {
    const input = document.getElementById('svReplyInput');
    const text = input.value.trim();
    if (!text) return;
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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

// ========== DEBUT : RÉACTIONS EMOJI ==========
async function sendStoryReaction(emoji) {
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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
// ============================================================
//  HUBISOCCER — STORIES-VIEW.JS (VISIONNEUSE) – PARTIE 4/4
//  Options, vues, téléchargement, suppression, initialisation
// ============================================================

// ========== DEBUT : OPTIONS (MENU ⋮) ==========
function openSvOptions() {
    pauseStory();
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;

    const isOwn = story.user_hubisoccer_id === currentProfile.hubisoccer_id;
    const modalTitle = document.getElementById('optionsModalTitle');
    const modalBody = document.getElementById('optionsModalBody');

    if (isOwn) {
        modalTitle.textContent = 'Options de ma story';
        modalBody.innerHTML = `
            <button class="story-option-item" id="viewStoryViewsBtn">
                <i class="fas fa-eye"></i> Voir les vues
            </button>
            <button class="story-option-item" id="downloadStoryBtn">
                <i class="fas fa-download"></i> Télécharger
            </button>
            <button class="story-option-item" id="hideStoryBtn">
                <i class="fas fa-eye-slash"></i> Masquer pour certaines personnes
            </button>
            <hr style="border-color:var(--gray-light);margin:4px 16px">
            <button class="story-option-item danger" id="deleteStoryBtn">
                <i class="fas fa-trash-alt"></i> Supprimer
            </button>
        `;
        document.getElementById('viewStoryViewsBtn').addEventListener('click', showStoryViewers);
        document.getElementById('downloadStoryBtn').addEventListener('click', downloadCurrentStory);
        document.getElementById('hideStoryBtn').addEventListener('click', () => { toast('Fonctionnalité à venir', 'info'); closeModal('modalStoryOptions'); resumeStory(); });
        document.getElementById('deleteStoryBtn').addEventListener('click', confirmDeleteStory);
    } else {
        modalTitle.textContent = 'Options';
        modalBody.innerHTML = `
            <button class="story-option-item" id="muteAuthorBtn">
                <i class="fas fa-bell-slash"></i> Masquer les stories de cette personne
            </button>
            <button class="story-option-item danger" id="reportStoryBtn">
                <i class="fas fa-flag"></i> Signaler cette story
            </button>
        `;
        document.getElementById('muteAuthorBtn').addEventListener('click', muteStoryAuthor);
        document.getElementById('reportStoryBtn').addEventListener('click', reportCurrentStory);
    }

    openModal('modalStoryOptions');
}
window.openSvOptions = openSvOptions;

function confirmDeleteStory() {
    closeModal('modalStoryOptions');
    showConfirmModal(
        'Supprimer la story ?',
        'Cette story sera définitivement supprimée.',
        deleteCurrentStory
    );
}

async function deleteCurrentStory() {
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story || story.user_hubisoccer_id !== currentProfile.hubisoccer_id) return;

    try {
        await sb.from('supabaseAuthPrive_stories').delete().eq('id', story.id);
        toast('Story supprimée', 'success');
        closeModal('modalConfirm');
        // Rediriger vers la liste
        window.location.href = 'stories.html';
    } catch (err) {
        toast('Erreur suppression : ' + err.message, 'error');
    }
}

async function downloadCurrentStory() {
    closeModal('modalStoryOptions');
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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

async function muteStoryAuthor() {
    closeModal('modalStoryOptions');
    const group = storyGroups[activeGroupIdx];
    if (!group) return;
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
                await sb.from('supabaseAuthPrive_stories').update({ hidden_for: hiddenFor }).eq('id', s.id);
            }
        }
        toast('Stories masquées', 'success');
        window.location.href = 'stories.html';
    } catch (err) {
        toast('Erreur masquage : ' + err.message, 'error');
        resumeStory();
    }
}

async function reportCurrentStory() {
    closeModal('modalStoryOptions');
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
// ========== FIN : OPTIONS ==========

// ========== DEBUT : AFFICHAGE DES VUES ==========
async function showStoryViewers() {
    closeModal('modalStoryOptions');
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
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

function closeViewersPanel() {
    document.getElementById('svViewersPanel').style.display = 'none';
    resumeStory();
}
// ========== FIN : VUES ==========

// ========== DEBUT : CONFIRMATION PERSONNALISÉE ==========
let currentConfirmCallback = null;
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = message;
    currentConfirmCallback = callback;
    openModal('modalConfirm');
}
// ========== FIN : CONFIRMATION ==========

// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Chargement de la story...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    const { userId, storyId } = getParamsFromUrl();
    if (!userId || !storyId) {
        toast('Paramètres manquants', 'error');
        window.location.href = 'stories.html';
        return;
    }

    const loaded = await loadTargetStories(userId, storyId);
    if (!loaded) {
        setLoader(false);
        return;
    }

    groupStartTime = Date.now();
    renderCurrentStory();
    setupSwipeGestures();
    setupArrowNavigation();

    // Écouteurs des boutons
    document.getElementById('svCloseBtn').addEventListener('click', closeViewer);
    document.getElementById('svOptionsBtn').addEventListener('click', openSvOptions);
    document.getElementById('svMuteBtn').addEventListener('click', toggleMute);
    document.getElementById('svReplySendBtn').addEventListener('click', sendTextReply);
    const replyInput = document.getElementById('svReplyInput');
    replyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendTextReply(); });
    replyInput.addEventListener('focus', pauseStory);
    replyInput.addEventListener('blur', resumeStory);

    document.getElementById('svSendAudioBtn').addEventListener('click', startAudioRecorder);
    document.getElementById('svRecStop').addEventListener('click', stopAudioRecorder);
    document.getElementById('svRecCancel').addEventListener('click', cancelAudioRecorder);
    document.getElementById('svSendPhotoBtn').addEventListener('click', () => openMediaReply('photo'));
    document.getElementById('svSendVideoBtn').addEventListener('click', () => openMediaReply('video'));
    document.getElementById('sendMediaReplyBtn').addEventListener('click', sendMediaReply);
    document.getElementById('svLikeStoryBtn').addEventListener('click', () => { pauseStory(); openModal('modalStoryReact'); });
    document.querySelectorAll('.story-react-grid span').forEach(el => {
        el.addEventListener('click', () => sendStoryReaction(el.dataset.emoji));
    });
    document.getElementById('svSendCoinsBtn').addEventListener('click', () => { pauseStory(); loadCoinsBalance(); openModal('modalSendCoins'); });
    document.querySelectorAll('.coins-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCoinsAmount = parseInt(btn.dataset.amount);
            document.getElementById('coinsCustomAmount').value = '';
        });
    });
    document.getElementById('coinsCustomAmount').addEventListener('input', () => {
        document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
        selectedCoinsAmount = 0;
    });
    document.getElementById('confirmSendCoinsBtn').addEventListener('click', sendHubiCoins);
    document.getElementById('closeViewersPanelBtn').addEventListener('click', closeViewersPanel);
    document.getElementById('confirmActionBtn').addEventListener('click', () => {
        if (currentConfirmCallback) { currentConfirmCallback(); currentConfirmCallback = null; }
        closeModal('modalConfirm');
        resumeStory();
    });

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) { closeModal(m.id); resumeStory(); } });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goToNextStory();
        if (e.key === 'ArrowLeft') goToPrevStory();
        if (e.key === 'Escape') closeViewer();
        if (e.key === ' ') { e.preventDefault(); isPaused ? resumeStory() : pauseStory(); }
    });

    await loadCoinsBalance();
    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========

// ============================================================
//  FIN DU FICHIER STORIES-VIEW.JS
// ============================================================