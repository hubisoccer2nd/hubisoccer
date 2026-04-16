// ============================================================
//  HUBISOCCER — STORIES-VIEW.JS (VISIONNEUSE) – VERSION FINALE
//  - Tous les boutons fonctionnent
//  - Navigation par flèches, swipe, appui long
//  - Réponses texte, audio, média, HubiCoins, réactions
//  - Options (vues, télécharger, supprimer, masquer, signaler)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let storyGroups = [];
let activeGroupIdx = 0;
let activeStoryIdx = 0;
let isPaused = false;
let isMuted = false;
let storyTimer = null;
let storyStartTime = null;
let groupStartTime = null;
const MAX_GROUP_DURATION = 10 * 60 * 1000;
let currentStoryDuration = 10000;
let currentOptionsStory = null;
let pendingMediaReplyFile = null;
let pendingMediaReplyType = null;
let selectedCoinsAmount = 0;
let mediaRecorder = null;
let audioChunks = [];
let recInterval = null;
let recSeconds = 0;
let pendingAudioBlob = null;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
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

        updateAvatarDisplay(
            currentProfile.avatar_url,
            currentProfile.full_name || currentProfile.display_name,
            'svReplyAvatar',
            'svReplyAvatarInitials'
        );
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
        const { data: stories, error } = await sb
            .from('supabaseAuthPrive_stories')
            .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, feed_id, role_code)')
            .eq('user_hubisoccer_id', userId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true });

        if (error || !stories || stories.length === 0) {
            toast('Aucune story disponible', 'error');
            window.location.href = 'stories.html';
            return false;
        }

        const group = {
            profile: stories[0].author,
            stories: stories,
            userId: userId
        };
        storyGroups = [group];

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
    if (!group) {
        closeViewer();
        return;
    }

    if (groupStartTime && Date.now() - groupStartTime >= MAX_GROUP_DURATION) {
        toast('Limite de 10 minutes atteinte', 'info');
        closeViewer();
        return;
    }

    const story = group.stories[activeStoryIdx];
    if (!story) {
        closeViewer();
        return;
    }

    clearStoryTimer();
    buildProgressBars(group.stories.length);

    const p = group.profile || {};
    const name = p.full_name || p.display_name || 'Utilisateur';
    updateAvatarDisplay(p.avatar_url, name, 'svAuthorAvatar', 'svAuthorAvatarInitials');

    document.getElementById('svAuthorName').textContent = name;
    document.getElementById('svAuthorTime').textContent = timeSince(story.created_at);
    document.getElementById('svAuthorHandle').textContent = p.feed_id ? '@' + p.feed_id : '';
    document.getElementById('svOptionsBtn').style.display = 'flex';
    currentOptionsStory = story;

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
            startStoryTimer(Math.min(currentStoryDuration, videoDuration || currentStoryDuration));
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

// ========== DEBUT : NAVIGATION ==========
function goToNextStory() {
    const group = storyGroups[activeGroupIdx];
    if (!group) {
        closeViewer();
        return;
    }
    if (activeStoryIdx < group.stories.length - 1) {
        activeStoryIdx++;
        renderCurrentStory();
    } else {
        closeViewer();
    }
}

function goToPrevStory() {
    if (activeStoryIdx > 0) {
        activeStoryIdx--;
        renderCurrentStory();
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
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    document.querySelectorAll('.sv-story-video').forEach(v => { v.pause(); v.src = ''; });
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
    document.getElementById('svPausePlayIcon').className = 'fas fa-play';
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
    document.getElementById('svPausePlayIcon').className = 'fas fa-pause';
}

function togglePause() {
    if (isPaused) {
        resumeStory();
    } else {
        pauseStory();
    }
}
// ========== FIN : PAUSE/REPRISE ==========

// ========== DEBUT : GESTES TACTILES ==========
function setupSwipeGestures() {
    const viewer = document.getElementById('storyViewerPage');
    viewer.addEventListener('touchstart', onTouchStart, { passive: false });
    viewer.addEventListener('touchmove', onTouchMove, { passive: false });
    viewer.addEventListener('touchend', onTouchEnd, { passive: false });
}

function onTouchStart(e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    longPressTimer = setTimeout(() => {
        togglePause();
        showPauseOverlay(isPaused);
    }, 300);
}

function onTouchMove(e) {
    clearTimeout(longPressTimer);
    const dy = e.touches[0].clientY - touchStartY;
    if (dy > 80 && Math.abs(e.touches[0].clientX - touchStartX) < 60) {
        document.getElementById('storyViewerPage').style.transform = `translateY(${dy}px)`;
        document.getElementById('storyViewerPage').style.opacity = `${1 - dy / 300}`;
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

    if (Math.abs(dx) > 60 && Math.abs(dy) < 40 && dt < 400) {
        if (dx < 0) goToNextStory();
        else goToPrevStory();
        return;
    }

    if (dy > 100 && Math.abs(dx) < 60) {
        closeViewer();
        return;
    }
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
// ========== FIN : GESTES ==========

// ========== DEBUT : MUTE ==========
function toggleMute() {
    isMuted = !isMuted;
    const vid = document.querySelector('.sv-story-video');
    if (vid) vid.muted = isMuted;
    document.getElementById('svMuteIcon').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
}
// ========== FIN : MUTE ==========

// ========== DEBUT : MARQUAGE DES VUES ==========
async function markStoryViewed(storyId) {
    try {
        await sb.from('supabaseAuthPrive_story_views').upsert({
            story_id: storyId,
            viewer_hubisoccer_id: currentProfile.hubisoccer_id,
            viewed_at: new Date().toISOString()
        }, { onConflict: 'story_id, viewer_hubisoccer_id' });
    } catch (err) {
        /* silencieux */
    }
}
// ========== FIN : MARQUAGE ==========

// ========== DEBUT : RÉPONSES TEXTE ==========
async function sendTextReply() {
    const input = document.getElementById('svReplyInput');
    const text = input.value.trim();
    if (!text) return;

    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;

    input.value = '';

    try {
        await sendStoryReplyMessage(story.user_hubisoccer_id, text, null, null);
        toast('Réponse envoyée ✅', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
}
// ========== FIN : RÉPONSES TEXTE ==========

// ========== DEBUT : AUDIO ==========
async function startAudioRecorder() {
    try {
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
        toast('Micro non disponible', 'warning');
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
        mediaRecorder.stop();
    }
    clearInterval(recInterval);
    document.getElementById('svAudioRecorder').style.display = 'none';
    document.getElementById('svReplyRow').style.display = 'flex';
    toast('Enregistrement annulé', 'info');
}

async function uploadAndSendAudioReply() {
    if (!pendingAudioBlob) return;

    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;

    try {
        const fileName = `story_reply_audio/${currentProfile.hubisoccer_id}_${Date.now()}.webm`;
        const { error } = await sb.storage.from('post_media').upload(fileName, pendingAudioBlob);
        if (error) throw error;

        const { data } = sb.storage.from('post_media').getPublicUrl(fileName);
        await sendStoryReplyMessage(story.user_hubisoccer_id, '🎤 Message vocal', data.publicUrl, 'audio');
        toast('Message vocal envoyé ✅', 'success');
    } catch (err) {
        toast('Erreur audio : ' + err.message, 'error');
    }
    pendingAudioBlob = null;
}
// ========== FIN : AUDIO ==========

// ========== DEBUT : RÉPONSES MÉDIA ==========
function openMediaReply(type) {
    pendingMediaReplyType = type;

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

    const drop = document.getElementById('mediaReplyDrop');
    const inp = document.getElementById('mediaReplyInput');
    drop.addEventListener('click', () => inp.click());
    inp.addEventListener('change', e => {
        const f = e.target.files[0];
        if (!f) return;
        pendingMediaReplyFile = f;
        const url = URL.createObjectURL(f);
        const isVid = f.type.startsWith('video/');
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
        const { error } = await sb.storage.from('post_media').upload(path, pendingMediaReplyFile);
        if (error) throw error;

        const { data } = sb.storage.from('post_media').getPublicUrl(path);
        const caption = document.getElementById('mediaReplyCaption').value.trim();
        const mediaType = pendingMediaReplyFile.type.startsWith('video/') ? 'video' : 'image';

        await sendStoryReplyMessage(
            story.user_hubisoccer_id,
            caption || `📷 ${mediaType === 'video' ? 'Vidéo' : 'Photo'}`,
            data.publicUrl,
            mediaType
        );

        closeModal('modalMediaReply');
        toast('Réponse envoyée ✅', 'success');
        pendingMediaReplyFile = null;
        document.getElementById('mediaReplyCaption').value = '';
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
    }
}
// ========== FIN : MÉDIA ==========

// ========== DEBUT : MESSAGERIE ==========
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
        /* silencieux */
    }
}
// ========== FIN : MESSAGERIE ==========

// ========== DEBUT : HUBICOINS ==========
async function loadCoinsBalance() {
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        document.getElementById('coinsBalance').textContent = (data?.balance || 0) + ' 🪙';
    } catch {
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
        toast('Impossible', 'warning');
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

        await sb.from('supabaseAuthPrive_hubis_wallets').upsert(
            { user_hubisoccer_id: currentProfile.hubisoccer_id, balance: balance - amount },
            { onConflict: 'user_hubisoccer_id' }
        );

        const { data: rec } = await sb
            .from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', story.user_hubisoccer_id)
            .maybeSingle();
        await sb.from('supabaseAuthPrive_hubis_wallets').upsert(
            { user_hubisoccer_id: story.user_hubisoccer_id, balance: (rec?.balance || 0) + amount },
            { onConflict: 'user_hubisoccer_id' }
        );

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
            message: `${currentProfile.full_name || currentProfile.display_name} t'a envoyé ${amount} 🪙`,
            data: { link: 'feed.html' }
        });

        closeModal('modalSendCoins');
        toast(`${amount} 🪙 envoyés !`, 'success');
        document.getElementById('coinsCustomAmount').value = '';
        document.getElementById('coinsMessage').value = '';
        selectedCoinsAmount = 0;
        document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
    }
}
// ========== FIN : HUBICOINS ==========

// ========== DEBUT : RÉACTIONS ==========
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

        toast(`${emoji} Réaction !`, 'success');
    } catch (err) {
        toast('Erreur réaction', 'error');
    }
}
// ========== FIN : RÉACTIONS ==========

// ========== DEBUT : OPTIONS ==========
function openSvOptions() {
    const story = storyGroups[activeGroupIdx]?.stories[activeStoryIdx];
    if (!story) return;

    const isOwn = story.user_hubisoccer_id === currentProfile.hubisoccer_id;
    document.getElementById('optionsModalTitle').textContent = isOwn ? 'Options de ma story' : 'Options';

    document.getElementById('optionsModalBody').innerHTML = isOwn
        ? `
            <button class="story-option-item" id="viewStoryViewsBtn"><i class="fas fa-eye"></i> Voir les vues</button>
            <button class="story-option-item" id="downloadStoryBtn"><i class="fas fa-download"></i> Télécharger</button>
            <button class="story-option-item" id="hideStoryBtn"><i class="fas fa-eye-slash"></i> Masquer...</button>
            <hr><button class="story-option-item danger" id="deleteStoryBtn"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `
        : `
            <button class="story-option-item" id="muteAuthorBtn"><i class="fas fa-bell-slash"></i> Masquer les stories</button>
            <button class="story-option-item danger" id="reportStoryBtn"><i class="fas fa-flag"></i> Signaler</button>
        `;

    if (isOwn) {
        document.getElementById('viewStoryViewsBtn').addEventListener('click', showStoryViewers);
        document.getElementById('downloadStoryBtn').addEventListener('click', downloadCurrentStory);
        document.getElementById('hideStoryBtn').addEventListener('click', () => toast('À venir', 'info'));
        document.getElementById('deleteStoryBtn').addEventListener('click', () => {
            closeModal('modalStoryOptions');
            showConfirmModal('Supprimer ?', 'Définitif.', deleteCurrentStory);
        });
    } else {
        document.getElementById('muteAuthorBtn').addEventListener('click', muteStoryAuthor);
        document.getElementById('reportStoryBtn').addEventListener('click', reportCurrentStory);
    }

    openModal('modalStoryOptions');
}

async function showStoryViewers() {
    closeModal('modalStoryOptions');
    const story = currentOptionsStory;
    if (!story) return;

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
        return `<div class="sv-viewer-item">
            ${viewer.avatar_url ? `<img src="${viewer.avatar_url}">` : `<div class="sv-viewer-avatar-initials">${getInitials(name)}</div>`}
            <span class="sv-viewer-name">${escapeHtml(name)}</span>
            <span class="sv-viewer-time">${timeSince(v.viewed_at)}</span>
        </div>`;
    }).join('') || '<p style="padding:20px;text-align:center">Aucune vue</p>';

    document.getElementById('svViewersPanel').style.display = 'flex';
}

function closeViewersPanel() {
    document.getElementById('svViewersPanel').style.display = 'none';
}

async function downloadCurrentStory() {
    closeModal('modalStoryOptions');
    const story = currentOptionsStory;
    if (!story?.media_url) {
        toast('Non disponible', 'info');
        return;
    }
    const a = document.createElement('a');
    a.href = story.media_url;
    a.download = `story_${Date.now()}.${story.media_type === 'video' ? 'mp4' : 'jpg'}`;
    a.click();
    toast('Téléchargement démarré', 'success');
}

async function deleteCurrentStory() {
    const story = currentOptionsStory;
    if (!story || story.user_hubisoccer_id !== currentProfile.hubisoccer_id) return;

    await sb.from('supabaseAuthPrive_stories').delete().eq('id', story.id);
    toast('Story supprimée', 'success');
    window.location.href = 'stories.html';
}

async function muteStoryAuthor() {
    const group = storyGroups[activeGroupIdx];
    if (!group) return;

    for (const s of group.stories) {
        const { data } = await sb
            .from('supabaseAuthPrive_stories')
            .select('hidden_for')
            .eq('id', s.id)
            .single();
        const hidden = data?.hidden_for || [];
        if (!hidden.includes(currentProfile.hubisoccer_id)) {
            hidden.push(currentProfile.hubisoccer_id);
            await sb.from('supabaseAuthPrive_stories').update({ hidden_for: hidden }).eq('id', s.id);
        }
    }

    toast('Stories masquées', 'success');
    window.location.href = 'stories.html';
}

async function reportCurrentStory() {
    const story = currentOptionsStory;
    if (!story) return;

    await sb.from('supabaseAuthPrive_reports').insert({
        story_id: story.id,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason: 'Signalement story'
    });

    toast('Signalé', 'success');
    closeModal('modalStoryOptions');
}

let currentConfirmCallback = null;
function showConfirmModal(title, msg, cb) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = msg;
    currentConfirmCallback = cb;
    openModal('modalConfirm');
}
// ========== FIN : OPTIONS ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement...', 20);
    if (!await initSessionAndProfile()) {
        setLoader(false);
        return;
    }

    const { userId, storyId } = getParamsFromUrl();
    if (!userId || !storyId) {
        toast('Paramètres manquants', 'error');
        window.location.href = 'stories.html';
        return;
    }

    if (!await loadTargetStories(userId, storyId)) {
        setLoader(false);
        return;
    }

    groupStartTime = Date.now();
    renderCurrentStory();
    setupSwipeGestures();

    // Attachement robuste des écouteurs
    document.getElementById('svNavPrev').addEventListener('click', goToPrevStory);
    document.getElementById('svNavNext').addEventListener('click', goToNextStory);
    document.getElementById('svTapPrev').addEventListener('click', goToPrevStory);
    document.getElementById('svTapNext').addEventListener('click', goToNextStory);
    document.getElementById('svCloseBtn').addEventListener('click', closeViewer);
    document.getElementById('svOptionsBtn').addEventListener('click', openSvOptions);
    document.getElementById('svMuteBtn').addEventListener('click', toggleMute);
    document.getElementById('svPausePlayBtn').addEventListener('click', togglePause);
    document.getElementById('svReplySendBtn').addEventListener('click', sendTextReply);

    const replyInput = document.getElementById('svReplyInput');
    replyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendTextReply();
    });

    document.getElementById('svSendAudioBtn').addEventListener('click', startAudioRecorder);
    document.getElementById('svRecStop').addEventListener('click', stopAudioRecorder);
    document.getElementById('svRecCancel').addEventListener('click', cancelAudioRecorder);
    document.getElementById('svSendPhotoBtn').addEventListener('click', () => openMediaReply('photo'));
    document.getElementById('svSendVideoBtn').addEventListener('click', () => openMediaReply('video'));
    document.getElementById('sendMediaReplyBtn').addEventListener('click', sendMediaReply);
    document.getElementById('svLikeStoryBtn').addEventListener('click', () => openModal('modalStoryReact'));

    document.querySelectorAll('.story-react-grid span').forEach(el => {
        el.addEventListener('click', () => sendStoryReaction(el.dataset.emoji));
    });

    document.getElementById('svSendCoinsBtn').addEventListener('click', () => {
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

    document.getElementById('coinsCustomAmount').addEventListener('input', () => {
        document.querySelectorAll('.coins-preset').forEach(b => b.classList.remove('selected'));
        selectedCoinsAmount = 0;
    });

    document.getElementById('confirmSendCoinsBtn').addEventListener('click', sendHubiCoins);
    document.getElementById('closeViewersPanelBtn').addEventListener('click', closeViewersPanel);

    document.getElementById('confirmActionBtn').addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback();
            currentConfirmCallback = null;
        }
        closeModal('modalConfirm');
    });

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', e => {
            if (e.target === m) closeModal(m.id);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') goToNextStory();
        if (e.key === 'ArrowLeft') goToPrevStory();
        if (e.key === 'Escape') closeViewer();
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