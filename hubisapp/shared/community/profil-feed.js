// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 1/3 : Variables, constantes, session, menu latéral,
//              utilitaires URL, chargement profil, rendu en-tête
// ============================================================
//  Corrections incluses :
//  - Liens dropdown (Messages, Paramètres) pour tous rôles
//  - Statut en ligne (intervalle 60s)
//  - Fonction toggleFollow complète
//  - Lien paramètres unifié (settings-feed.html)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let profileData = null;
let profileHubisoccerId = null;
let isOwnProfile = false;
let isFollowing = false;
let posts = [];
let postOffset = 0;
const PAGE_SIZE = 12;
let hasMorePosts = false;
let activeTab = 'posts';
let mediaPage = 0;
const MEDIA_PAGE_SIZE = 20;
let hasMoreMedia = false;
let currentConfirmCallback = null;
let presenceInterval = null;            // pour le statut en ligne
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : CONSTANTES ROLES ==========
//
// La table « role_code -> tableau de bord » qui occupait cet endroit
// a ete SUPPRIMEE : elle etait la sixieme copie divergente de la meme
// table dans le module, et elle pointait vers des dossiers absents du
// depot. Son repli '../../index.html' n'existe pas non plus.
//
// Tout passe desormais par role-nav.js, charge par profil-feed.html
// juste avant ce fichier :
//     getRoleHome(roleCode) / getRoleMenu(roleCode)
//     getRoleLabel(roleCode) / applyRoleLinks(roleCode)
//
// ========== FIN : CONSTANTES ROLES ==========

// ========== DEBUT : SESSION ET AVATAR ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;

        document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');

        // Liens vers l'espace prive du role (logo, « Tableau de bord »,
        // bouton de retour). Chemins verifies par role-nav.js.
        if (typeof applyRoleLinks === 'function') {
            applyRoleLinks(currentProfile.role_code);
        } else {
            const fallback = '../construction.html';
            const dd = document.getElementById('dropDashboard');
            if (dd) dd.href = fallback;
            console.warn('[profil-feed] role-nav.js absent : navigation de repli utilisee.');
        }
        
        // Liens dropdown universels (tous rôles)
        document.getElementById('dropProfile').href = `profil-feed.html?id=${currentProfile.hubisoccer_id}`;
        document.getElementById('dropMessages').href = '../messagerie/conversation.html';
        document.getElementById('dropSettings').href = 'settings-feed.html';

        buildSidebarMenu(currentProfile.role_code);
        return true;
    } catch (err) {
        toast('Erreur de session. Veuillez vous reconnecter.', 'error');
        setLoader(false);
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

// ========== DEBUT : MENU LATERAL ==========
//
// AVANT : une table « menuConfig » de 28 roles, environ 280 liens
// ecrits a la main. Pour 19 roles, le dossier cible n'existe meme pas
// dans le depot ; pour les autres, les noms de fichiers etaient faux
// (basketteur-verif, basketteur-cv, basketteur-videos... aucun de ces
// fichiers n'a jamais existe). Le menu du profil etait donc presque
// entierement compose de liens morts.
//
// MAINTENANT : le menu vient de role-nav.js, ou chaque lien a ete
// verifie contre les fichiers reellement presents dans le depot.
//
function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const titleEl = document.getElementById('sidebarRoleTitle');

    // ---------- Repli si role-nav.js n'a pas ete charge ----------
    if (typeof getRoleMenu !== 'function') {
        console.warn('[profil-feed] role-nav.js absent : menu lateral reduit.');
        if (titleEl) titleEl.textContent = 'Menu';
        nav.innerHTML = buildProfileSidebarExtras();
        wireProfileSidebarExtras();
        return;
    }

    if (titleEl) titleEl.textContent = 'Menu ' + getRoleLabel(roleCode);

    // ---------- Bloc 1 : l'espace prive du role ----------
    const roleItems = getRoleMenu(roleCode);
    let roleBlock;

    if (roleItems.length) {
        roleBlock = roleItems.map(item =>
            '<a href="' + escapeAttr(item.href) + '">' +
                '<i class="fas ' + escapeAttr(item.icon) + '"></i> ' +
                escapeHtml(item.label) +
            '</a>'
        ).join('');
    } else {
        roleBlock =
            '<div class="rn-pending">' +
                '<strong>' + escapeHtml(getRoleLabel(roleCode)) + '</strong>' +
                '<span>Votre espace privé est en cours de construction.</span>' +
                '<a href="' + escapeAttr(ROLE_FALLBACK) + '" class="rn-link">' +
                    '<i class="fas fa-circle-info"></i> En savoir plus' +
                '</a>' +
            '</div>';
    }

    nav.innerHTML =
        '<a href="feed.html"><i class="fas fa-users"></i> Ma Communauté</a>' +
        roleBlock +
        buildProfileSidebarExtras();

    wireProfileSidebarExtras();
}

//
// Partie commune du menu lateral de la page de profil.
//
function buildProfileSidebarExtras() {
    const soon = (typeof ROLE_FALLBACK === 'string') ? ROLE_FALLBACK : '../construction.html';

    return '' +
        '<hr>' +
        '<a href="stories.html"><i class="fas fa-smile"></i> Stories</a>' +
        '<a href="live.html"><i class="fas fa-broadcast-tower"></i> Lives</a>' +
        '<a href="search.html"><i class="fas fa-search"></i> Recherche</a>' +
        '<a href="notifications.html"><i class="fas fa-bell"></i> Notifications</a>' +
        '<a href="settings-feed.html"><i class="fas fa-gear"></i> Paramètres</a>' +

        '<hr>' +
        '<a href="../messagerie/conversation.html"><i class="fas fa-envelope"></i> Messagerie</a>' +
        '<a href="../gestion-tournoi/acceuil.html"><i class="fas fa-trophy"></i> Tournois</a>' +
        '<a href="../suivi-tournoi/suivi-tournoi.html"><i class="fas fa-eye"></i> Suivi tournoi</a>' +

        '<hr>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-store"></i> HubiMarket' +
            '<span class="rn-badge">bientôt</span></a>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-award"></i> HubiCertif' +
            '<span class="rn-badge">bientôt</span></a>' +
        '<a href="' + soon + '" class="rn-soon"><i class="fas fa-crown"></i> HubiAbonnement' +
            '<span class="rn-badge">bientôt</span></a>' +

        '<hr>' +
        '<a href="#" id="sidebarLogout" style="color:var(--danger)">' +
            '<i class="fas fa-sign-out-alt"></i> Déconnexion</a>';
}

function wireProfileSidebarExtras() {
    const out = document.getElementById('sidebarLogout');
    if (out) out.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}
// ========== FIN : MENU LATERAL ==========

// ========== DEBUT : UTILITAIRES URL ET CHARGEMENT PROFIL ==========
function getProfileIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id') || params.get('handle');
    if (id && id.startsWith('@')) id = id.substring(1);
    return id;
}

async function loadProfileData(identifier) {
    if (!identifier) {
        toast('Aucun profil spécifié', 'error');
        setLoader(false);
        return null;
    }

    setLoader(true, 'Chargement du profil...', 40);

    // L'identifiant vient de l'URL : on le nettoie avant de l'injecter dans le
    // filtre PostgREST, sinon une virgule ou une parenthèse détourne la requête.
    const safeId = String(identifier).replace(/[^A-Za-z0-9_-]/g, '');
    if (!safeId) {
        setLoader(false);
        toast('Identifiant de profil invalide', 'error');
        return null;
    }

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_communities')
            .select(`
                *,
                profiles:hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url, role_code,
                    bio, city, country, created_at,
                    height, weight, preferred_foot, club, position, nationality,
                    current_status, discipline, current_level, palmares, specialty,
                    current_diploma, school, schedule_accommodation, hard_skills, study_project,
                    interest_sectors, professional_experiences, soft_skills, availability,
                    certified, feed_id, community_avatar, community_cover, last_seen
                )
            `)
            .or(`hubisoccer_id.eq.${safeId},feed_id.eq.${safeId}`)
            .single();

        if (error || !data) {
            setLoader(false);
            toast('Profil introuvable', 'error');
            document.querySelector('.profile-main').innerHTML = `
                <div class="c-empty">
                    <div class="c-empty-icon"><i class="fas fa-user-slash"></i></div>
                    <h3>Profil introuvable</h3>
                    <p>Cet utilisateur n'existe pas ou a supprimé son compte.</p>
                </div>
            `;
            return null;
        }

        profileData = data;
        profileHubisoccerId = data.hubisoccer_id;
        isOwnProfile = (profileHubisoccerId === currentProfile?.hubisoccer_id);

        if (data.profiles?.last_seen) {
            const lastSeen = new Date(data.profiles.last_seen);
            const now = new Date();
            const diffMinutes = (now - lastSeen) / (1000 * 60);
            if (diffMinutes < 5) {
                document.getElementById('onlineIndicator').style.display = 'block';
            }
        }

        if (!isOwnProfile) {
            await sb.from('supabaseAuthPrive_profile_views').upsert({
                profile_hubisoccer_id: profileHubisoccerId,
                viewer_hubisoccer_id: currentProfile.hubisoccer_id,
                viewed_at: new Date().toISOString()
            }, { onConflict: 'profile_hubisoccer_id,viewer_hubisoccer_id' });
        }

        if (!isOwnProfile) {
            const { data: follow } = await sb
                .from('supabaseAuthPrive_follows')
                .select('*')
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('following_hubisoccer_id', profileHubisoccerId)
                .maybeSingle();
            isFollowing = !!follow;
        }

        renderProfileHeader();
        renderAboutSections();
        updateFollowButton();
        await loadProfileStories();
        await loadSuggestions();
        setLoader(false);
        return data;
    } catch (err) {
        setLoader(false);
        toast('Erreur lors du chargement : ' + err.message, 'error');
        return null;
    }
}
// ========== FIN : CHARGEMENT PROFIL ==========

// ========== DEBUT : RENDU EN-TETE ==========
function renderProfileHeader() {
    const comm = profileData;
    const prof = profileData.profiles || {};

    const coverUrl = comm.cover_url || prof.community_cover || '';
    const avatarUrl = comm.avatar_url || prof.community_avatar || prof.avatar_url || '';

    const coverEl = document.getElementById('profileCover');
    if (coverUrl) {
        coverEl.style.backgroundImage = `url('${encodeURI(coverUrl)}')`;
    } else {
        coverEl.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
    }
    coverEl.onclick = () => openLightbox(coverUrl || '');

    const avatarImg = document.getElementById('profileAvatar');
    const avatarInitials = document.getElementById('profileAvatarInitials');
    const name = comm.name || prof.full_name || prof.display_name || 'Utilisateur';

    if (avatarUrl && avatarUrl !== '') {
        avatarImg.src = avatarUrl;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarInitials.style.display = 'flex';
        avatarInitials.textContent = getInitials(name);
    }
    avatarImg.onclick = () => openLightbox(avatarUrl || '');
    avatarInitials.onclick = () => openLightbox(avatarUrl || '');

    document.getElementById('profileName').textContent = name;
    document.getElementById('profileHandle').textContent = '@' + (comm.feed_id || '');
    document.getElementById('profileBio').textContent = comm.bio || prof.bio || 'Aucune bio.';
    document.getElementById('profileLocation').textContent = comm.country || prof.country || 'Non spécifié';
    document.getElementById('profileJoined').textContent = new Date(comm.created_at || prof.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById('profileFollowers').textContent = comm.followers_count || 0;
    document.getElementById('profileFollowing').textContent = comm.following_count || 0;
    document.getElementById('profilePosts').textContent = comm.posts_count || 0;

    if (prof.certified) {
        document.getElementById('profileCertified').style.display = 'flex';
    }

    document.title = `${name} | HubISoccer`;
}
// ========== FIN : RENDU EN-TETE ==========

// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 2/3 : Boutons, toggleFollow, sections, stories,
//              lightbox, suggestions, onglets
// ============================================================

// ========== DEBUT : BOUTONS D'ACTION ==========
function updateFollowButton() {
    const actionsDiv = document.getElementById('profileActions');

    if (isOwnProfile) {
        actionsDiv.innerHTML = `
            <button class="btn-outline" id="editProfileBtn"><i class="fas fa-pen"></i> Modifier le profil</button>
            <button class="btn-outline" id="shareProfileBtn"><i class="fas fa-share-alt"></i> Partager</button>
            <a href="settings-feed.html" class="btn-ghost"><i class="fas fa-cog"></i></a>
        `;
        document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
        document.getElementById('shareProfileBtn').addEventListener('click', () => openModal('modalShare'));
    } else {
        const followText = isFollowing ? 'Abonné' : 'S\'abonner';
        const followIcon = isFollowing ? 'fa-user-check' : 'fa-user-plus';
        actionsDiv.innerHTML = `
            <button class="btn-primary" id="followBtn">
                <i class="fas ${followIcon}"></i> ${followText}
            </button>
            <a href="../messagerie/conversation.html?to=${profileHubisoccerId}" class="btn-outline">
                <i class="fas fa-envelope"></i> Message
            </a>
            <button class="btn-outline" id="shareProfileBtn"><i class="fas fa-share-alt"></i></button>
            <button class="btn-ghost" id="reportProfileBtn" title="Signaler"><i class="fas fa-flag"></i></button>
            <button class="btn-ghost" id="blockBtn" title="Bloquer"><i class="fas fa-ban"></i></button>
        `;
        document.getElementById('followBtn').addEventListener('click', toggleFollow);
        document.getElementById('shareProfileBtn').addEventListener('click', () => openModal('modalShare'));
        document.getElementById('reportProfileBtn').addEventListener('click', () => openModal('modalReport'));
        document.getElementById('blockBtn').addEventListener('click', () => {
            showConfirmModal(
                'Bloquer cet utilisateur ?',
                'Vous ne verrez plus son contenu et il ne pourra plus interagir avec vous.',
                blockUser
            );
        });
    }
}


// ========== DEBUT : COMPTEURS D'ABONNÉS FIABLES ==========
// Les compteurs étaient lus puis réécrits : deux abonnements simultanés se
// perdaient. On recompte désormais la valeur réelle dans la table follows.
async function syncFollowCounts(userId) {
    try {
        const [followersRes, followingRes] = await Promise.all([
            sb.from('supabaseAuthPrive_follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_hubisoccer_id', userId),
            sb.from('supabaseAuthPrive_follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_hubisoccer_id', userId)
        ]);
        const followers = followersRes.count || 0;
        const following = followingRes.count || 0;
        await sb.from('supabaseAuthPrive_communities')
            .update({ followers_count: followers, following_count: following })
            .eq('hubisoccer_id', userId);
        return { followers, following };
    } catch (e) {
        return null;
    }
}
// ========== FIN : COMPTEURS D'ABONNÉS FIABLES ==========

async function toggleFollow() {
    if (!currentProfile) return;
    const btn = document.getElementById('followBtn');
    btn.disabled = true;

    try {
        if (isFollowing) {
            // ----- DÉSABONNEMENT -----
            await sb.from('supabaseAuthPrive_follows')
                .delete()
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('following_hubisoccer_id', profileHubisoccerId);
            isFollowing = false;
            toast('Vous n\'êtes plus abonné', 'info');
        } else {
            // ----- ABONNEMENT -----
            const { error: followErr } = await sb.from('supabaseAuthPrive_follows').insert({
                follower_hubisoccer_id: currentProfile.hubisoccer_id,
                following_hubisoccer_id: profileHubisoccerId
            });
            // Code 23505 = doublon : l'abonnement existait déjà
            if (followErr && followErr.code !== '23505') throw followErr;
            isFollowing = true;

            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: profileHubisoccerId,
                type: 'follow',
                title: 'Nouvel abonné',
                message: `${currentProfile.full_name || currentProfile.display_name} s'est abonné à votre communauté.`,
                data: { link: `profil-feed.html?id=${currentProfile.hubisoccer_id}` }
            });

            toast('Abonné !', 'success');
        }

        // Recomptage réel des deux côtés
        const [mine, target] = await Promise.all([
            syncFollowCounts(currentProfile.hubisoccer_id),
            syncFollowCounts(profileHubisoccerId)
        ]);

        if (target) {
            document.getElementById('profileFollowers').textContent = target.followers;
            document.getElementById('profileFollowing').textContent = target.following;
        }
        if (isOwnProfile && mine) {
            document.getElementById('profileFollowers').textContent = mine.followers;
            document.getElementById('profileFollowing').textContent = mine.following;
        }

        updateFollowButton();
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function blockUser() {
    try {
        await sb.from('supabaseAuthPrive_blocked_users').upsert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            blocked_hubisoccer_id: profileHubisoccerId
        }, { onConflict: 'user_hubisoccer_id, blocked_hubisoccer_id' });

        // Un blocage rompt le lien dans les deux sens
        await sb.from('supabaseAuthPrive_follows').delete()
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('following_hubisoccer_id', profileHubisoccerId);
        await sb.from('supabaseAuthPrive_follows').delete()
            .eq('follower_hubisoccer_id', profileHubisoccerId)
            .eq('following_hubisoccer_id', currentProfile.hubisoccer_id);
        await Promise.all([
            syncFollowCounts(currentProfile.hubisoccer_id),
            syncFollowCounts(profileHubisoccerId)
        ]);

        toast('Utilisateur bloqué', 'success');
        setTimeout(() => { window.location.href = 'feed.html'; }, 1500);
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
}
// ========== FIN : BOUTONS D'ACTION ==========

// ========== DEBUT : SECTIONS À PROPOS ==========
function renderAboutSections() {
    const prof = profileData.profiles || {};
    const comm = profileData;

    const identityHtml = `
        <div class="about-item"><span>Nom complet</span><span>${escapeHtml(prof.full_name || prof.display_name || '—')}</span></div>
        <div class="about-item"><span>Pseudo</span><span>${escapeHtml(prof.pseudo || '—')}</span></div>
        <div class="about-item"><span>Bio</span><span>${escapeHtml(comm.bio || prof.bio || '—')}</span></div>
        <div class="about-item"><span>Pays</span><span>${escapeHtml(comm.country || prof.country || '—')}</span></div>
        <div class="about-item"><span>Statut</span><span>${escapeHtml(prof.current_status || '—')}</span></div>
    `;
    document.getElementById('aboutIdentity').innerHTML = identityHtml;

    const sportHtml = `
        <div class="about-item"><span>Discipline</span><span>${escapeHtml(prof.discipline || 'Football')}</span></div>
        <div class="about-item"><span>Niveau</span><span>${escapeHtml(prof.current_level || '—')}</span></div>
        <div class="about-item"><span>Taille / Poids</span><span>${prof.height || '—'} cm / ${prof.weight || '—'} kg</span></div>
        <div class="about-item"><span>Pied préféré</span><span>${prof.preferred_foot || '—'}</span></div>
        <div class="about-item"><span>Club</span><span>${escapeHtml(prof.club || '—')}</span></div>
        <div class="about-item"><span>Poste</span><span>${escapeHtml(prof.position || '—')}</span></div>
        <div class="about-item"><span>Palmarès</span><span>${escapeHtml(prof.palmares || '—')}</span></div>
    `;
    document.getElementById('aboutSport').innerHTML = sportHtml;

    const studiesHtml = `
        <div class="about-item"><span>Diplôme en cours</span><span>${escapeHtml(prof.current_diploma || '—')}</span></div>
        <div class="about-item"><span>Établissement</span><span>${escapeHtml(prof.school || '—')}</span></div>
        <div class="about-item"><span>Aménagement</span><span>${prof.schedule_accommodation ? 'Oui' : 'Non'}</span></div>
        <div class="about-item"><span>Compétences</span><span>${escapeHtml(prof.hard_skills || '—')}</span></div>
        <div class="about-item"><span>Projet d'étude</span><span>${escapeHtml(prof.study_project || '—')}</span></div>
    `;
    document.getElementById('aboutStudies').innerHTML = studiesHtml;

    const careerHtml = `
        <div class="about-item"><span>Secteurs d'intérêt</span><span>${escapeHtml(prof.interest_sectors || '—')}</span></div>
        <div class="about-item"><span>Expériences</span><span>${escapeHtml(prof.professional_experiences || '—')}</span></div>
        <div class="about-item"><span>Soft skills</span><span>${escapeHtml(prof.soft_skills || '—')}</span></div>
        <div class="about-item"><span>Disponibilités</span><span>${escapeHtml(prof.availability || '—')}</span></div>
    `;
    document.getElementById('aboutCareer').innerHTML = careerHtml;

    const helpHtml = `
        <div class="about-item"><span>Je peux aider</span><span>${escapeHtml(prof.help_offer || '—')}</span></div>
        <div class="about-item"><span>J'ai besoin d'aide</span><span>${escapeHtml(prof.help_need || '—')}</span></div>
        <div class="about-item"><span>Objectifs réseau</span><span>${escapeHtml(prof.network_goals || '—')}</span></div>
    `;
    document.getElementById('aboutHelp').innerHTML = helpHtml;
}
// ========== FIN : SECTIONS À PROPOS ==========

// ========== DEBUT : STORIES DE L'UTILISATEUR ==========
async function loadProfileStories() {
    if (isOwnProfile) {
        document.getElementById('profileStoriesSection').style.display = 'none';
        return;
    }

    const { data: stories } = await sb
        .from('supabaseAuthPrive_stories')
        .select('*')
        .eq('user_hubisoccer_id', profileHubisoccerId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (!stories || stories.length === 0) {
        document.getElementById('profileStoriesSection').style.display = 'none';
        return;
    }

    document.getElementById('profileStoriesSection').style.display = 'block';
    document.getElementById('storyOwnerName').textContent = profileData.name || profileData.profiles?.full_name || 'cet utilisateur';

    const container = document.getElementById('profileStoriesContainer');
    container.innerHTML = stories.map(story => makeStoryItem(story)).join('');

    container.querySelectorAll('.story-item').forEach((el, index) => {
        el.addEventListener('click', () => viewStory(stories[index].id));
    });
}

function makeStoryItem(story) {
    const name = profileData.name || profileData.profiles?.full_name || 'Utilisateur';
    const avatar = profileData.avatar_url || profileData.profiles?.community_avatar || profileData.profiles?.avatar_url;
    const initials = getInitials(name);
    let preview = '';

    if (story.media_type === 'text') {
        preview = `<div class="story-ring-text" style="background:${escapeAttr(story.text_bg || 'var(--primary)')}">${initials}</div>`;
    } else if (story.media_type === 'video') {
        preview = `<div class="story-ring-video" style="background:#1a1a2e;"><i class="fas fa-video" style="font-size:24px;color:white;"></i></div>`;
    } else {
        preview = `<img src="${escapeAttr(story.media_url)}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="story-ring-text" style="display:none; background:var(--primary);">${initials}</div>`;
    }

    return `
        <div class="story-item" data-story-id="${story.id}">
            <div class="story-ring">${preview}</div>
            <span>${timeSince(story.created_at)}</span>
        </div>
    `;
}

function viewStory(storyId) {
    window.location.href = `stories-view.html?user=${encodeURIComponent(profileHubisoccerId)}&story=${encodeURIComponent(storyId)}`;
}
// ========== FIN : STORIES ==========

// ========== DEBUT : LIGHTBOX (agrandissement images) ==========
function openLightbox(imageUrl) {
    if (!imageUrl) {
        toast('Aucune image à afficher', 'info');
        return;
    }
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImage');
    img.src = imageUrl;
    modal.style.display = 'flex';

    const closeBtn = document.getElementById('lightboxClose');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}
// ========== FIN : LIGHTBOX ==========

// ========== DEBUT : SUGGESTIONS DE COMMUNAUTÉS ==========
async function loadSuggestions() {
    const container = document.getElementById('suggestionsList');
    if (!container) return;
    if (isOwnProfile) {
        document.getElementById('profileSuggestions').style.display = 'none';
        return;
    }

    const { data: following } = await sb
        .from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const followingIds = (following || []).map(f => f.following_hubisoccer_id);
    const exclude = [currentProfile.hubisoccer_id, profileHubisoccerId, ...followingIds];

    const { data: blocked } = await sb
        .from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const blockedIds = (blocked || []).map(b => b.blocked_hubisoccer_id);
    exclude.push(...blockedIds);

    let query = sb
        .from('supabaseAuthPrive_communities')
        .select(`
            *,
            profiles:hubisoccer_id(role_code, certified, avatar_url)
        `)
        .not('hubisoccer_id', 'in', `(${exclude.join(',')})`)
        .limit(6);

    if (profileData.sport) {
        query = query.eq('sport', profileData.sport);
    } else if (profileData.country) {
        query = query.eq('country', profileData.country);
    }

    const { data: suggestions } = await query;

    if (!suggestions || suggestions.length === 0) {
        document.getElementById('profileSuggestions').style.display = 'none';
        return;
    }

    document.getElementById('profileSuggestions').style.display = 'block';
    renderSuggestions(suggestions);
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    if (!container) return;

    container.innerHTML = suggestions.map(comm => {
        const name = comm.name || 'Communauté';
        const avatar = comm.avatar_url || comm.profiles?.avatar_url || '';

        // Le libelle du role vient de role-nav.js, seule table de roles
        // du module. Auparavant cette ligne lisait ALL_ROLES, qui ne
        // couvrait pas tous les codes et renvoyait souvent une chaine
        // vide sous le nom de la personne.
        const role = (typeof getRoleLabel === 'function')
            ? getRoleLabel(comm.profiles?.role_code)
            : '';

        // Identifiant echappe : il part dans un attribut onclick, entre
        // apostrophes. Sans echappement, un identifiant contenant une
        // apostrophe cassait le HTML de toute la liste.
        const safeId = escapeAttr(comm.hubisoccer_id);

        // Avatar absent : on affiche les initiales au lieu d'une balise
        // <img src=""> — un src vide fait recharger la page courante en
        // guise d'image et affiche une icone cassee.
        const visual = avatar
            ? '<img src="' + escapeAttr(avatar) + '" alt="' + escapeAttr(name) + '">'
            : '<div class="suggestion-initials">' + escapeHtml(getInitials(name)) + '</div>';

        return '' +
            '<div class="suggestion-card" onclick="openUserProfile(\'' + safeId + '\')">' +
                visual +
                '<div class="suggestion-info">' +
                    '<div class="suggestion-name">' + escapeHtml(name) + '</div>' +
                    '<div class="suggestion-role">' + escapeHtml(role) + '</div>' +
                '</div>' +
                '<button class="suggestion-follow-btn" ' +
                        'onclick="event.stopPropagation(); followSuggestion(\'' + safeId + '\', this)">' +
                    'Suivre' +
                '</button>' +
            '</div>';
    }).join('');
}

//
// Ouverture d'un profil depuis une carte de suggestion.
// Passe par une fonction plutot que par une affectation directe de
// window.location dans l'attribut onclick : la valeur est ainsi
// traitee comme une donnee, jamais comme du code.
//
window.openUserProfile = function (userId) {
    if (!userId) return;
    window.location.href = 'profil-feed.html?id=' + encodeURIComponent(userId);
};

window.followSuggestion = async function(userId, btn) {
    try {
        await sb.from('supabaseAuthPrive_follows').insert({
            follower_hubisoccer_id: currentProfile.hubisoccer_id,
            following_hubisoccer_id: userId
        });
        btn.textContent = 'Abonné';
        btn.classList.add('following');
        toast('Abonné !', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
};

document.getElementById('refreshSuggestionsBtn')?.addEventListener('click', () => loadSuggestions());
// ========== FIN : SUGGESTIONS ==========

// ========== DEBUT : GESTION DES ONGLETS ==========
function initTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            activeTab = tabId;

            if (tabId === 'posts' && posts.length === 0) {
                loadPosts(true);
            } else if (tabId === 'media') {
                loadMedia('image', true);
            } else if (tabId === 'videos') {
                loadMedia('video', true);
            }
        });
    });

    document.getElementById('statFollowers').addEventListener('click', () => openFollowModal('followers'));
    document.getElementById('statFollowing').addEventListener('click', () => openFollowModal('following'));
}
// ========== FIN : GESTION DES ONGLETS ==========

// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 3/3 : Posts, médias, modales, initialisation,
//              statut en ligne, fin du fichier
// ============================================================

// ========== DEBUT : CHARGEMENT ET RENDU DES POSTS ==========
async function loadPosts(reset = false) {
    if (reset) {
        postOffset = 0;
        posts = [];
    }

    setLoader(true, 'Chargement des publications...', 70);

    try {
        let query = sb
            .from('supabaseAuthPrive_posts')
            .select(`
                *,
                author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, feed_id, certified),
                community:supabaseAuthPrive_communities!community_id(name, feed_id, avatar_url)
            `)
            .eq('author_hubisoccer_id', profileHubisoccerId)
            .eq('is_scheduled', false)
            .order('created_at', { ascending: false })
            .range(postOffset, postOffset + PAGE_SIZE - 1);

        const { data, error } = await query;
        if (error) throw error;

        hasMorePosts = data.length === PAGE_SIZE;
        postOffset += data.length;

        if (reset) posts = data;
        else posts = [...posts, ...data];

        renderPostsGrid();
        document.getElementById('loadMorePostsWrap').style.display = hasMorePosts ? 'block' : 'none';
    } catch (err) {
        toast('Erreur chargement posts : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}

function renderPostsGrid() {
    const grid = document.getElementById('profilePostsGrid');
    if (posts.length === 0) {
        grid.innerHTML = '<div class="c-empty"><p>Aucune publication</p></div>';
        return;
    }

    grid.innerHTML = posts.map(post => {
        const media = post.media_url
            ? (post.media_type === 'video'
                ? `<video src="${escapeAttr(post.media_url)}" muted></video>`
                : `<img src="${escapeAttr(post.media_url)}" alt="">`)
            : '';

        return `
            <div class="post-card" data-post-id="${post.id}" onclick="openPost('${post.id}')">
                ${media ? `<div class="post-media-thumb">${media}</div>` : ''}
                <div class="post-content-preview">${escapeHtml(post.content?.substring(0, 120) || '')}</div>
                <div class="post-stats">
                    <span><i class="far fa-heart"></i> ${post.likes_count || 0}</span>
                    <span><i class="far fa-comment"></i> ${post.comments_count || 0}</span>
                    <span><i class="fas fa-share"></i> ${post.shares_count || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

function openPost(postId) {
    // Redirection vers la page de détail du post (si elle existe)
    window.location.href = `post-view.html?id=${postId}`;
}
window.openPost = openPost;
// ========== FIN : POSTS ==========

// ========== DEBUT : CHARGEMENT ET RENDU DES MÉDIAS ==========
async function loadMedia(type, reset = false) {
    if (reset) {
        mediaPage = 0;
    }

    const grid = type === 'image' ? document.getElementById('photosGrid') : document.getElementById('videosGrid');
    grid.innerHTML = '<div class="c-spinner" style="margin:20px auto;"></div>';

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_posts')
            .select('id, media_url, media_type, created_at')
            .eq('author_hubisoccer_id', profileHubisoccerId)
            .eq('media_type', type)
            .not('media_url', 'is', null)
            .order('created_at', { ascending: false })
            .range(mediaPage * MEDIA_PAGE_SIZE, (mediaPage + 1) * MEDIA_PAGE_SIZE - 1);

        if (error) throw error;

        hasMoreMedia = data.length === MEDIA_PAGE_SIZE;

        if (reset) {
            grid.innerHTML = '';
        } else {
            grid.innerHTML = grid.innerHTML.replace('<div class="c-spinner" style="margin:20px auto;"></div>', '');
        }

        if (data.length === 0 && reset) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--gray);">Aucun média</p>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'media-item';
            div.onclick = () => openPost(item.id);
            if (type === 'image') {
                div.innerHTML = `<img src="${escapeAttr(item.media_url)}" alt="" loading="lazy">`;
            } else {
                div.innerHTML = `<video src="${escapeAttr(item.media_url)}" muted></video>`;
            }
            grid.appendChild(div);
        });

        if (hasMoreMedia) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn-ghost';
            loadMoreBtn.style.gridColumn = '1 / -1';
            loadMoreBtn.style.margin = '20px auto';
            loadMoreBtn.innerHTML = '<i class="fas fa-arrow-down"></i> Charger plus';
            loadMoreBtn.onclick = () => { mediaPage++; loadMedia(type, false); };
            grid.appendChild(loadMoreBtn);
        }
    } catch (err) {
        toast('Erreur chargement médias : ' + err.message, 'error');
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--danger);">Erreur de chargement</p>';
    }
}
// ========== FIN : MÉDIAS ==========

// ========== DEBUT : MODALES FOLLOWERS / FOLLOWING ==========
async function openFollowModal(type) {
    const modal = document.getElementById('modalFollowers');
    const title = document.getElementById('followModalTitle');
    const list = document.getElementById('followList');

    title.textContent = type === 'followers' ? 'Abonnés' : 'Abonnements';
    list.innerHTML = '<div class="c-spinner" style="margin:20px auto;"></div>';
    openModal('modalFollowers');

    const column = type === 'followers' ? 'follower_hubisoccer_id' : 'following_hubisoccer_id';
    const selectField = type === 'followers' ? 'follower' : 'following';

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_follows')
            .select(`
                ${selectField}:supabaseAuthPrive_profiles!${column}(
                    hubisoccer_id, full_name, display_name, avatar_url, feed_id, certified
                )
            `)
            .eq(type === 'followers' ? 'following_hubisoccer_id' : 'follower_hubisoccer_id', profileHubisoccerId)
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<li style="padding:16px; color:var(--gray); text-align:center;">Aucun résultat</li>';
            return;
        }

        list.innerHTML = data.map(item => {
            const user = item[selectField] || {};
            const name = user.full_name || user.display_name || 'Utilisateur';
            const avatar = user.avatar_url || '';
            const initials = getInitials(name);
            const certified = user.certified ? '<i class="fas fa-check-circle" style="color:var(--primary); margin-left:4px;"></i>' : '';

            return `
                <li class="users-list-item" onclick="window.location.href='profil-feed.html?id=${user.hubisoccer_id}'">
                    ${avatar ? `<img src="${escapeAttr(avatar)}" alt="">` : `<div class="user-avatar-placeholder">${initials}</div>`}
                    <span class="users-list-item-name">${escapeHtml(name)}${certified}</span>
                    <span class="users-list-item-handle">@${escapeHtml(user.feed_id || '')}</span>
                </li>
            `;
        }).join('');
    } catch (err) {
        toast('Erreur chargement liste : ' + err.message, 'error');
        list.innerHTML = '<li style="padding:16px; color:var(--danger);">Erreur de chargement</li>';
    }
}
// ========== FIN : MODALES FOLLOWERS ==========

// ========== DEBUT : MODALE ÉDITION PROFIL ==========
function openEditProfileModal() {
    const comm = profileData;
    document.getElementById('editCommName').value = comm.name || '';
    document.getElementById('editCommBio').value = comm.bio || '';
    document.getElementById('editCommSpecialty').value = comm.specialty || '';
    document.getElementById('editCommWebsite').value = comm.website || '';
    openModal('modalEditProfile');
}

async function saveProfile() {
    const name = document.getElementById('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    const specialty = document.getElementById('editCommSpecialty').value.trim();
    const website = document.getElementById('editCommWebsite').value.trim();

    if (!name) {
        toast('Le nom est requis', 'warning');
        return;
    }

    setLoader(true, 'Mise à jour...', 80);
    try {
        await sb.from('supabaseAuthPrive_communities')
            .update({ name, bio, specialty, website })
            .eq('hubisoccer_id', profileHubisoccerId);

        profileData.name = name;
        profileData.bio = bio;
        profileData.specialty = specialty;
        profileData.website = website;

        renderProfileHeader();
        renderAboutSections();
        closeModal('modalEditProfile');
        toast('Profil mis à jour', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}
// ========== FIN : MODALE ÉDITION PROFIL ==========

// ========== DEBUT : SIGNALEMENT ==========
async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) {
        toast('Veuillez indiquer une raison', 'warning');
        return;
    }

    try {
        await sb.from('supabaseAuthPrive_reports').insert({
            reporter_hubisoccer_id: currentProfile.hubisoccer_id,
            reported_hubisoccer_id: profileHubisoccerId,
            reason: reason,
            type: 'profile'
        });
        closeModal('modalReport');
        toast('Signalement envoyé. Merci.', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
}
// ========== FIN : SIGNALEMENT ==========

// ========== DEBUT : CONFIRMATION PERSONNALISÉE ==========
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = message;
    currentConfirmCallback = callback;
    openModal('modalConfirm');
}
// ========== FIN : CONFIRMATION ==========

// ========== DEBUT : PARTAGE ==========
function shareProfile(network) {
    const url = window.location.href;
    const name = profileData.name || profileData.profiles?.full_name || 'Profil HubISoccer';
    const text = `Découvrez ${name} sur HubISoccer !`;

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    if (network === 'copy') {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
        closeModal('modalShare');
    } else {
        window.open(shareUrls[network], '_blank');
        closeModal('modalShare');
    }
}
// ========== FIN : PARTAGE ==========

// ========== DEBUT : STATUT EN LIGNE (INTERVALLE 60s) ==========
function startPresenceUpdates() {
    if (presenceInterval) clearInterval(presenceInterval);
    
    const updateLastSeen = async () => {
        if (!currentProfile?.hubisoccer_id) return;

        // On n'ecrit PAS quand l'onglet est en arriere-plan.
        //
        // Avant : chaque onglet ouvert envoyait une ecriture par minute
        // indefiniment, meme minimise ou en second plan. Un utilisateur
        // qui laissait la page ouverte toute la journee produisait
        // ~1400 ecritures inutiles, et le statut « en ligne » restait
        // vert alors qu'il n'etait pas devant son ecran.
        if (document.visibilityState !== 'visible') return;

        try {
            await sb.from('supabaseAuthPrive_profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('hubisoccer_id', currentProfile.hubisoccer_id);
        } catch (err) {
            // Silencieux : ne pas perturber l'utilisateur
            console.warn('Erreur mise à jour last_seen:', err);
        }
    };

    updateLastSeen(); // première mise à jour immédiate

    // Au retour sur l'onglet, on rafraichit tout de suite sans
    // attendre la prochaine minute.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') updateLastSeen();
    });

    presenceInterval = setInterval(updateLastSeen, 60000); // toutes les 60 secondes
}

function stopPresenceUpdates() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}
// ========== FIN : STATUT EN LIGNE ==========

// ========== DEBUT : BADGE DE NOTIFICATIONS ==========
async function loadNotifBadge() {
    try {
        const { count } = await sb.from('supabaseAuthPrive_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('read', false);
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        if (count && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) { /* badge facultatif */ }
}
// ========== FIN : BADGE DE NOTIFICATIONS ==========

// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Vérification de votre session...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    const identifier = getProfileIdFromUrl();
    if (!identifier) {
        toast('Profil non spécifié', 'error');
        setLoader(false);
        return;
    }

    await loadProfileData(identifier);
    if (!profileData) return;

    // Démarrer les mises à jour du statut en ligne
    startPresenceUpdates();

    initTabs();
    await loadPosts(true);

    // Écouteurs d'événements globaux
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    const closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => {
        document.getElementById('userDropdown')?.classList.remove('show');
    });

    document.getElementById('dropLogout').addEventListener('click', () => {
        stopPresenceUpdates();
        logout();
    });

    // Nettoyer l'intervalle lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', stopPresenceUpdates);

    // La cloche n'avait aucune action : elle mène au centre de notifications
    document.getElementById('notifBtn')?.addEventListener('click', () => {
        window.location.href = 'notifications.html';
    });
    loadNotifBadge();

    document.getElementById('loadMorePostsBtn')?.addEventListener('click', () => loadPosts(false));

    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);

    document.getElementById('submitReportBtn')?.addEventListener('click', submitReport);

    document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback();
            currentConfirmCallback = null;
        }
        closeModal('modalConfirm');
    });

    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => shareProfile(btn.dataset.network));
    });

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) closeModal(m.id);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('lightboxModal').style.display = 'none';
        }
    });

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========

// ============================================================
//  FIN DU FICHIER PROFIL-FEED.JS
// ============================================================