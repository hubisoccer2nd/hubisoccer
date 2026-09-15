// ============================================================
//  HUBISOCCER — SETTINGS-FEED.JS
//  Paramètres de la communauté (profil, confidentialité,
//  notifications, contenu, bloqués, monétisation, compte)
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let myCommunity = null;
let pendingAvatarFile = null;
let pendingCoverFile = null;
let pendingConfirmAction = null;

const DEFAULT_SETTINGS = {
    whoComment: 'everyone',
    showOnline: true,
    allowShare: true,
    hideLikes: false,
    notifLikes: true,
    notifComments: true,
    notifFollows: true,
    notifLives: true,
    notifMentions: true,
    notifSound: true,
    contentLang: 'fr',
    safeMode: true,
    autoplay: true,
    storyDuration: '3600',
    acceptCoins: true,
    paidContent: false,
    paused: false
};

let currentSettings = { ...DEFAULT_SETTINGS };

// ========== DEBUT : LIENS VERS LES ESPACES PRIVES ==========
//
// La table « role_code -> tableau de bord » qui se trouvait ici a ete
// supprimee : elle pointait vers des dossiers absents du depot
// (agent_fifa, tennisman, athlete, handballeur, formateur...) et son
// repli '../../index.html' n'existe pas non plus. Chaque entree du
// menu renvoyait donc une erreur 404.
//
// role-nav.js, charge par settings-feed.html juste avant ce fichier, fournit
// les liens verifies : getRoleHome / getRoleLabel / getRoleMenu /
// applyRoleLinks.
//
// ========== FIN : LIENS VERS LES ESPACES PRIVES ==========

const COUNTRIES = [
    'Bénin','Burkina Faso','Cameroun','Côte d\'Ivoire','France','Gabon','Ghana','Guinée',
    'Mali','Maroc','Niger','Nigéria','Rép. dém. du Congo','Sénégal','Togo','Tunisie',
    'Algérie','Belgique','Canada','Espagne','États-Unis','Italie','Portugal','Royaume-Uni',
    'Afrique du Sud','Allemagne','Angola','Kenya','Tchad','Centrafrique','Congo','Autre'
];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : SESSION ==========
async function initSessionAndProfile() {
    const auth = await requireAuth();
    if (!auth) return false;

    let attempts = 0;
    while ((!currentProfile || !currentProfile.hubisoccer_id) && attempts < 30) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
    }
    if (!currentProfile || !currentProfile.hubisoccer_id) {
        toast('Profil non chargé. Redirection...', 'error');
        window.location.href = 'feed-setup.html';
        return false;
    }

    document.getElementById('userName').textContent =
        currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
    updateAvatarDisplay(currentProfile.avatar_url,
        currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');

    // Liens vers l'espace prive du role : logo, « Tableau de bord »,
    // bouton de retour. Chemins verifies par role-nav.js.
    if (typeof applyRoleLinks === 'function') {
        applyRoleLinks(currentProfile.role_code);
    } else {
        const dd = document.getElementById('dropDashboard');
        if (dd) dd.href = '../construction.html';
    }
    return true;
}

function updateAvatarDisplay(url, name, imgId, initialsId) {
    const img = document.getElementById(imgId);
    const ini = document.getElementById(initialsId);
    if (!img || !ini) return;
    if (url) { img.src = url; img.style.display = 'block'; ini.style.display = 'none'; }
    else { img.style.display = 'none'; ini.style.display = 'flex'; ini.textContent = getInitials(name); }
}
// ========== FIN : SESSION ==========

// ========== DEBUT : CHARGEMENT ==========
function populateCountries() {
    const sel = document.getElementById('setCountry');
    sel.innerHTML = '<option value="">— Sélectionner —</option>' +
        COUNTRIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
}

async function loadCommunity() {
    const { data, error } = await sb.from('supabaseAuthPrive_communities')
        .select('*')
        .eq('hubisoccer_id', currentProfile.hubisoccer_id)
        .maybeSingle();

    if (error || !data) {
        toast('Communauté introuvable. Créez-la d\'abord.', 'warning');
        setTimeout(() => window.location.href = 'feed-setup.html', 1200);
        return false;
    }
    myCommunity = data;

    document.getElementById('setName').value = data.name || '';
    document.getElementById('setHandle').value = '@' + (data.feed_id || '');
    document.getElementById('setBio').value = data.bio || '';
    document.getElementById('bioCount').textContent = (data.bio || '').length;
    document.getElementById('setSpecialty').value = data.specialty || '';
    document.getElementById('setWebsite').value = data.website || '';
    document.getElementById('setCountry').value = data.country || '';
    document.getElementById('setPrivacy').value = data.privacy || 'public';

    renderAvatarBlock();
    renderCoverBlock();

    // Certification
    const certif = document.getElementById('certifStatus');
    if (currentProfile.certified) {
        certif.innerHTML = '<i class="fas fa-check-circle" style="color:var(--success)"></i> Communauté certifiée';
        document.getElementById('requestCertifBtn').style.display = 'none';
    } else {
        certif.textContent = 'Non certifié';
    }
    return true;
}

function renderAvatarBlock() {
    const url = myCommunity?.avatar_url;
    document.getElementById('peAvatarBlock').innerHTML = `
        <div class="pe-label">Photo de profil</div>
        <div class="pe-avatar-wrap">
            ${url
                ? `<img src="${escapeAttr(url)}" alt="" class="pe-avatar">`
                : `<div class="pe-avatar-initials">${getInitials(myCommunity?.name || 'C')}</div>`}
            <button class="pe-edit-btn" id="peAvatarBtn" title="Changer"><i class="fas fa-camera"></i></button>
        </div>`;
    document.getElementById('peAvatarBtn').addEventListener('click',
        () => document.getElementById('peAvatarInput').click());
}

function renderCoverBlock() {
    const url = myCommunity?.cover_url;
    document.getElementById('peCoverBlock').innerHTML = `
        <div class="pe-label">Photo de couverture</div>
        <div class="pe-cover-wrap" style="${url ? `background-image:url('${escapeAttr(url)}')` : ''}">
            ${!url ? '<i class="fas fa-image"></i><span>Aucune couverture</span>' : ''}
            <button class="pe-edit-btn" id="peCoverBtn" title="Changer"><i class="fas fa-camera"></i></button>
        </div>`;
    document.getElementById('peCoverBtn').addEventListener('click',
        () => document.getElementById('peCoverInput').click());
}

async function loadSettings() {
    try {
        const { data } = await sb.from('supabaseAuthPrive_user_feed_settings')
            .select('settings')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        if (data?.settings) currentSettings = { ...DEFAULT_SETTINGS, ...data.settings };
    } catch (e) {
        const saved = localStorage.getItem('hubisoccer_feed_settings');
        if (saved) { try { currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch (e2) {} }
    }
    applySettingsToForm();
}

function applySettingsToForm() {
    const set = (id, val, isCheck) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isCheck) el.checked = !!val; else el.value = val;
    };
    set('setWhoComment', currentSettings.whoComment);
    set('setShowOnline', currentSettings.showOnline, true);
    set('setAllowShare', currentSettings.allowShare, true);
    set('setHideLikes', currentSettings.hideLikes, true);
    set('notifLikes', currentSettings.notifLikes, true);
    set('notifComments', currentSettings.notifComments, true);
    set('notifFollows', currentSettings.notifFollows, true);
    set('notifLives', currentSettings.notifLives, true);
    set('notifMentions', currentSettings.notifMentions, true);
    set('notifSound', currentSettings.notifSound, true);
    set('setLang', currentSettings.contentLang);
    set('setSafeMode', currentSettings.safeMode, true);
    set('setAutoplay', currentSettings.autoplay, true);
    set('setStoryDuration', currentSettings.storyDuration);
    set('setAcceptCoins', currentSettings.acceptCoins, true);
    set('setPaidContent', currentSettings.paidContent, true);
    set('setPaused', currentSettings.paused, true);
}

function readSettingsFromForm() {
    const get = (id, isCheck) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return isCheck ? el.checked : el.value;
    };
    currentSettings = {
        whoComment: get('setWhoComment'),
        showOnline: get('setShowOnline', true),
        allowShare: get('setAllowShare', true),
        hideLikes: get('setHideLikes', true),
        notifLikes: get('notifLikes', true),
        notifComments: get('notifComments', true),
        notifFollows: get('notifFollows', true),
        notifLives: get('notifLives', true),
        notifMentions: get('notifMentions', true),
        notifSound: get('notifSound', true),
        contentLang: get('setLang'),
        safeMode: get('setSafeMode', true),
        autoplay: get('setAutoplay', true),
        storyDuration: get('setStoryDuration'),
        acceptCoins: get('setAcceptCoins', true),
        paidContent: get('setPaidContent', true),
        paused: get('setPaused', true)
    };
}
// ========== FIN : CHARGEMENT ==========

// ========== DEBUT : ENREGISTREMENT ==========
async function uploadIfNeeded(file, prefix) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `communities/${currentProfile.hubisoccer_id}/${prefix}_${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('feed_avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = sb.storage.from('feed_avatars').getPublicUrl(path);
    return data.publicUrl;
}

async function saveAll() {
    const name = document.getElementById('setName').value.trim();
    if (!name) { toast('Le nom est obligatoire', 'warning'); return; }

    setLoader(true, 'Enregistrement...', 30);
    try {
        const avatarUrl = await uploadIfNeeded(pendingAvatarFile, 'avatar');
        const coverUrl = await uploadIfNeeded(pendingCoverFile, 'cover');

        const updates = {
            name,
            bio: document.getElementById('setBio').value.trim(),
            specialty: document.getElementById('setSpecialty').value.trim(),
            website: document.getElementById('setWebsite').value.trim(),
            country: document.getElementById('setCountry').value,
            privacy: document.getElementById('setPrivacy').value
        };
        if (avatarUrl) updates.avatar_url = avatarUrl;
        if (coverUrl) updates.cover_url = coverUrl;

        setLoader(true, 'Mise à jour de la communauté...', 65);
        const { error } = await sb.from('supabaseAuthPrive_communities')
            .update(updates).eq('id', myCommunity.id);
        if (error) throw error;

        Object.assign(myCommunity, updates);
        pendingAvatarFile = null;
        pendingCoverFile = null;

        setLoader(true, 'Enregistrement des préférences...', 90);
        readSettingsFromForm();
        await saveSettings();

        renderAvatarBlock();
        renderCoverBlock();
        toast('Paramètres enregistrés ✅', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}

async function saveSettings() {
    try {
        const { error } = await sb.from('supabaseAuthPrive_user_feed_settings').upsert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            settings: currentSettings,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_hubisoccer_id' });
        if (error) throw error;
    } catch (err) {
        localStorage.setItem('hubisoccer_feed_settings', JSON.stringify(currentSettings));
    }
}

async function resetSettings() {
    currentSettings = { ...DEFAULT_SETTINGS };
    applySettingsToForm();
    await saveSettings();
    toast('Paramètres réinitialisés', 'info');
}
// ========== FIN : ENREGISTREMENT ==========

// ========== DEBUT : UTILISATEURS BLOQUÉS ==========
async function loadBlockedUsers() {
    const container = document.getElementById('blockedListContainer');
    try {
        const { data } = await sb.from('supabaseAuthPrive_blocked_users')
            .select('blocked_hubisoccer_id, profile:supabaseAuthPrive_profiles!blocked_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-text">Aucun utilisateur bloqué</p>';
            return;
        }

        container.innerHTML = data.map(b => {
            const p = b.profile || {};
            const name = p.full_name || p.display_name || 'Utilisateur';
            return `
            <div class="blocked-item">
                ${p.avatar_url
                    ? `<img src="${escapeAttr(p.avatar_url)}" alt="">`
                    : `<div class="blocked-avatar-initials">${getInitials(name)}</div>`}
                <span class="blocked-name">${escapeHtml(name)}</span>
                <button class="btn-unblock" data-uid="${escapeAttr(b.blocked_hubisoccer_id)}">Débloquer</button>
            </div>`;
        }).join('');

        container.querySelectorAll('.btn-unblock').forEach(btn => {
            btn.addEventListener('click', async () => {
                await sb.from('supabaseAuthPrive_blocked_users').delete()
                    .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                    .eq('blocked_hubisoccer_id', btn.dataset.uid);
                toast('Utilisateur débloqué', 'success');
                loadBlockedUsers();
            });
        });
    } catch (err) {
        container.innerHTML = '<p class="empty-text">Erreur de chargement</p>';
    }
}
// ========== FIN : UTILISATEURS BLOQUÉS ==========

// ========== DEBUT : PUBLICATIONS MASQUÉES ==========
async function loadHiddenPosts() {
    const listEl = document.getElementById('hiddenList');
    listEl.innerHTML = '<p class="empty-text">Chargement...</p>';
    openModal('modalHidden');

    const { data } = await sb.from('supabaseAuthPrive_hidden_posts')
        .select('post_id, post:supabaseAuthPrive_posts!post_id(id, content, created_at)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    if (!data || data.length === 0) {
        listEl.innerHTML = '<p class="empty-text">Aucune publication masquée</p>';
        return;
    }

    listEl.innerHTML = data.map(h => {
        const p = h.post || {};
        return `
        <div class="hidden-item">
            <div class="hidden-text">${escapeHtml((p.content || 'Publication').substring(0, 90))}</div>
            <button class="btn-unblock" data-pid="${escapeAttr(h.post_id)}">Réafficher</button>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.btn-unblock').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sb.from('supabaseAuthPrive_hidden_posts').delete()
                .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('post_id', btn.dataset.pid);
            toast('Publication réaffichée', 'success');
            loadHiddenPosts();
            countHiddenPosts();
        });
    });
}

async function countHiddenPosts() {
    try {
        const { count } = await sb.from('supabaseAuthPrive_hidden_posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        const n = count || 0;
        document.getElementById('hiddenCount').textContent =
            `${n} publication${n > 1 ? 's' : ''} masquée${n > 1 ? 's' : ''}`;
    } catch (e) { /* facultatif */ }
}
// ========== FIN : PUBLICATIONS MASQUÉES ==========

// ========== DEBUT : PORTEFEUILLE (aperçu) ==========
async function loadWallet() {
    try {
        const { data } = await sb.from('supabaseAuthPrive_hubis_wallets')
            .select('balance')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        document.getElementById('walletBalance').textContent = `${data?.balance ?? 0} 🪙`;
    } catch (e) {
        document.getElementById('walletBalance').textContent = '0 🪙';
    }
}
// ========== FIN : PORTEFEUILLE ==========

// ========== DEBUT : EXPORT & SUPPRESSION ==========
async function exportMyData() {
    setLoader(true, 'Préparation de l\'export...', 40);
    try {
        const uid = currentProfile.hubisoccer_id;
        const [posts, comments, follows, stories] = await Promise.all([
            sb.from('supabaseAuthPrive_posts').select('*').eq('author_hubisoccer_id', uid),
            sb.from('supabaseAuthPrive_comments').select('*').eq('author_hubisoccer_id', uid),
            sb.from('supabaseAuthPrive_follows').select('*').eq('follower_hubisoccer_id', uid),
            sb.from('supabaseAuthPrive_stories').select('*').eq('user_hubisoccer_id', uid)
        ]);

        const payload = {
            exported_at: new Date().toISOString(),
            communaute: myCommunity,
            parametres: currentSettings,
            publications: posts.data || [],
            commentaires: comments.data || [],
            abonnements: follows.data || [],
            stories: stories.data || []
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hubisoccer_communaute_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Export terminé ✅', 'success');
    } catch (err) {
        toast('Erreur d\'export : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}

function askConfirm(title, desc, onConfirm, label = 'Confirmer') {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = desc;
    document.getElementById('confirmActionBtn').innerHTML = label;
    pendingConfirmAction = onConfirm;
    openModal('modalConfirm');
}

async function deleteCommunity() {
    setLoader(true, 'Suppression en cours...', 30);
    try {
        const uid = currentProfile.hubisoccer_id;
        await sb.from('supabaseAuthPrive_stories').delete().eq('user_hubisoccer_id', uid);
        await sb.from('supabaseAuthPrive_comments').delete().eq('author_hubisoccer_id', uid);
        await sb.from('supabaseAuthPrive_posts').delete().eq('author_hubisoccer_id', uid);
        await sb.from('supabaseAuthPrive_communities').delete().eq('id', myCommunity.id);
        await sb.from('supabaseAuthPrive_profiles').update({ feed_id: null }).eq('hubisoccer_id', uid);
        toast('Communauté supprimée', 'success');
        setTimeout(() => window.location.href = 'feed-setup.html', 1200);
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
        setLoader(false);
    }
}

async function requestCertification() {
    try {
        await sb.from('supabaseAuthPrive_certification_requests').insert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            community_id: myCommunity?.id || null,
            status: 'pending',
            requested_at: new Date().toISOString()
        });
        document.getElementById('certifStatus').textContent = 'Demande envoyée — en cours d\'examen';
        toast('Demande de certification envoyée ✅', 'success');
    } catch (err) {
        toast('La certification complète arrive prochainement', 'info');
    }
}
// ========== FIN : EXPORT & SUPPRESSION ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Vérification de la session...', 20);
    const ok = await initSessionAndProfile();
    if (!ok) { setLoader(false); return; }

    populateCountries();

    setLoader(true, 'Chargement de la communauté...', 50);
    const loaded = await loadCommunity();
    if (!loaded) { setLoader(false); return; }

    await loadSettings();
    countHiddenPosts();
    loadWallet();
    setLoader(false);

    // Chaque bloc est isolé : une erreur n'empêche jamais le chargement de la page
    const wire = (label, fn) => {
        try { fn(); }
        catch (err) { console.warn(`[HubISoccer] Bloc « ${label} » non initialisé :`, err); }
    };

    wire('onglets', () => {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
                if (tab.dataset.tab === 'blocked') loadBlockedUsers();
            });
        });
    });

    wire('compteur de bio', () => {
        const bio = document.getElementById('setBio');
        bio.addEventListener('input', () => {
            document.getElementById('bioCount').textContent = bio.value.length;
        });
    });

    wire('photos', () => {
        document.getElementById('peAvatarInput').addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (f.size > 800 * 1024) { toast('Image trop lourde (max 800 Ko)', 'warning'); return; }
            pendingAvatarFile = f;
            const url = URL.createObjectURL(f);
            document.querySelector('.pe-avatar-wrap').innerHTML =
                `<img src="${url}" alt="" class="pe-avatar">
                 <button class="pe-edit-btn" id="peAvatarBtn"><i class="fas fa-camera"></i></button>`;
            document.getElementById('peAvatarBtn').addEventListener('click',
                () => document.getElementById('peAvatarInput').click());
            toast('Photo prête — n\'oubliez pas d\'enregistrer', 'info');
        });

        document.getElementById('peCoverInput').addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (f.size > 2 * 1024 * 1024) { toast('Image trop lourde (max 2 Mo)', 'warning'); return; }
            pendingCoverFile = f;
            const url = URL.createObjectURL(f);
            const wrap = document.querySelector('.pe-cover-wrap');
            wrap.style.backgroundImage = `url('${url}')`;
            wrap.innerHTML = '<button class="pe-edit-btn" id="peCoverBtn"><i class="fas fa-camera"></i></button>';
            document.getElementById('peCoverBtn').addEventListener('click',
                () => document.getElementById('peCoverInput').click());
            toast('Couverture prête — n\'oubliez pas d\'enregistrer', 'info');
        });
    });

    wire('enregistrement', () => {
        document.getElementById('saveSettingsBtn').addEventListener('click', saveAll);
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            askConfirm('Réinitialiser', 'Les préférences reviendront aux valeurs par défaut.',
                resetSettings, 'Réinitialiser');
        });
    });

    wire('contenu masqué', () => {
        document.getElementById('viewHiddenBtn').addEventListener('click', loadHiddenPosts);
    });

    wire('monétisation', () => {
        document.getElementById('requestCertifBtn').addEventListener('click', requestCertification);
    });

    wire('compte', () => {
        document.getElementById('exportDataBtn').addEventListener('click', exportMyData);
        document.getElementById('deleteCommunityBtn').addEventListener('click', () => {
            askConfirm('Supprimer ma communauté',
                'Publications, stories, commentaires et abonnés seront définitivement perdus. Cette action est irréversible.',
                deleteCommunity, '<i class="fas fa-trash-alt"></i> Supprimer définitivement');
        });
    });

    wire('confirmation', () => {
        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            const fn = pendingConfirmAction;
            pendingConfirmAction = null;
            closeModal('modalConfirm');
            if (typeof fn === 'function') fn();
        });
    });

    wire('navigation', () => {
        document.getElementById('backBtn').addEventListener('click', () => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = 'feed.html';
        });
        document.getElementById('userMenu').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('show');
        });
        document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
        document.getElementById('dropLogout').addEventListener('click', logout);
        document.querySelectorAll('.c-modal').forEach(m => {
            m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
        });
    });
}
// ========== FIN : INITIALISATION ==========

document.addEventListener('DOMContentLoaded', init);
