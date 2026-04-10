// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS
//  Profil public d'une communauté
//  Utilise utils.js et session.js
// ============================================================

'use strict';

// Début configuration Supabase
const SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb;
// Fin configuration Supabase

// Début état global
let currentUser     = null;
let currentProfile  = null;          // profil de l'utilisateur connecté
let profileData     = null;          // profil affiché (communauté)
let profileHubisoccerId = null;
let isOwnProfile    = false;
let isFollowing     = false;
let posts           = [];
let postOffset      = 0;
const PAGE_SIZE     = 12;
let hasMorePosts    = false;
let activeTab       = 'posts';
// Fin état global

// Début mapping rôles
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'BASK': '../../basketteur/dashboard/basketteur-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};
// Fin mapping rôles

// Début session et profil connecté
async function initSessionAndProfile() {
    const user = await checkSession();
    if (!user) return false;
    currentUser = user;

    const profile = await loadProfile(user.id);
    if (!profile) return false;
    currentProfile = profile;

    // UI Navbar
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Utilisateur';
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name, 'userAvatar', 'userAvatarInitials');

    // Dashboard selon rôle
    const dash = ROLE_DASHBOARD_MAP[profile.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;

    buildSidebarMenu(profile.role_code);
    return true;
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

function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    const titleEl = document.getElementById('sidebarRoleTitle');
    const menuConfig = {
        'FOOT': {
            title: 'Menu Footballeur',
            items: [
                {icon:'fa-tachometer-alt', label:'Tableau de bord', href:'../../footballeur/dashboard/foot-dash.html'},
                {icon:'fa-users', label:'Ma Communauté', href:'feed.html'},
                {icon:'fa-shield-alt', label:'Vérification', href:'../../footballeur/verification/foot-verif.html'},
                {icon:'fa-file-alt', label:'Mon CV Pro', href:'../../footballeur/edit-cv/foot-cv.html'},
                {icon:'fa-certificate', label:'Diplômes & Certifs', href:'../../footballeur/certifications/foot-certif.html'},
                {icon:'fa-trophy', label:'Suivi Tournoi', href:'../../shared/suivi-tournoi/suivi-tournoi.html'},
                {icon:'fa-video', label:'Mes Vidéos', href:'../../footballeur/videos/foot-videos.html'},
                {icon:'fa-coins', label:'Mes Revenus', href:'../../footballeur/revenus/foot-revenus.html'},
                {icon:'fa-envelope', label:'Messages', href:'../../shared/messagerie/conversation.html'},
                {icon:'fa-headset', label:'Support', href:'../../footballeur/support/foot-supp.html'}
            ]
        },
        'ADMIN': {
            title: 'Menu Admin',
            items: [
                {icon:'fa-chart-pie', label:'Dashboard', href:'../../authprive/admin/admin-dashboard.html'},
                {icon:'fa-users', label:'Communauté', href:'feed.html'},
                {icon:'fa-id-card', label:'Gestion IDs', href:'../../authprive/admin/admin-ids.html'},
                {icon:'fa-users-cog', label:'Utilisateurs', href:'../../authprive/admin/admin-users.html'},
                {icon:'fa-history', label:'Logs', href:'../../authprive/admin/admin-logs.html'}
            ]
        }
    };
    const config = menuConfig[roleCode] || { title:'Menu', items:[{icon:'fa-users', label:'Communauté', href:'feed.html'}] };
    titleEl.textContent = config.title;
    nav.innerHTML = config.items.map(item => `
        <a href="${item.href}">
            <i class="fas ${item.icon}"></i> ${item.label}
        </a>
    `).join('') + `<hr><a href="#" id="sidebarLogout" style="color:var(--danger)"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>`;
    document.getElementById('sidebarLogout')?.addEventListener('click', logout);
}
// Fin session et profil connecté

// Début récupération ID du profil
function getProfileIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('handle');
}
// Fin récupération ID

// Début chargement du profil affiché
async function loadProfileData(identifier) {
    setLoader(true, 'Chargement du profil...', 60);
    let query = sb.from('supabaseAuthPrive_communities')
        .select(`
            *,
            profiles:supabaseAuthPrive_profiles!hubisoccer_id(
                hubisoccer_id, full_name, display_name, avatar_url, role_code,
                bio, city, country, created_at,
                height, weight, preferred_foot, club, position, nationality,
                current_status, discipline, current_level, palmares, specialty,
                current_diploma, school, schedule_accommodation, hard_skills, study_project,
                interest_sectors, professional_experiences, soft_skills, availability,
                certified, feed_id, community_avatar, community_cover
            )
        `)
        .or(`hubisoccer_id.eq.${identifier},feed_id.eq.${identifier.replace('@','')}`)
        .single();
    
    const { data, error } = await query;
    if (error || !data) {
        setLoader(false);
        toast('Profil introuvable','error');
        document.querySelector('.profile-main').innerHTML = '<div class="c-empty"><h3>Profil introuvable</h3></div>';
        return null;
    }
    profileData = data;
    profileHubisoccerId = data.hubisoccer_id;
    isOwnProfile = (profileHubisoccerId === currentProfile?.hubisoccer_id);
    
    if (!isOwnProfile) {
        await sb.from('supabaseAuthPrive_profile_views').upsert({
            profile_hubisoccer_id: profileHubisoccerId,
            viewer_hubisoccer_id: currentProfile.hubisoccer_id,
            viewed_at: new Date().toISOString()
        }, { onConflict: 'profile_hubisoccer_id,viewer_hubisoccer_id' });
    }
    
    if (!isOwnProfile) {
        const { data: follow } = await sb.from('supabaseAuthPrive_follows')
            .select('*')
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('following_hubisoccer_id', profileHubisoccerId)
            .maybeSingle();
        isFollowing = !!follow;
    }
    
    renderProfileHeader();
    renderAboutSections();
    updateFollowButton();
    setLoader(false);
    return data;
}

function renderProfileHeader() {
    const comm = profileData;
    const prof = profileData.profiles || {};
    const coverUrl = comm.cover_url || prof.community_cover || '';
    const avatarUrl = comm.avatar_url || prof.community_avatar || prof.avatar_url || '';
    
    const coverEl = document.getElementById('profileCover');
    if (coverUrl) coverEl.style.backgroundImage = `url(${coverUrl})`;
    else coverEl.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
    
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
    
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileHandle').textContent = '@' + (comm.feed_id || '');
    document.getElementById('profileBio').textContent = comm.bio || prof.bio || '';
    document.getElementById('profileLocation').textContent = comm.country || prof.country || 'Non spécifié';
    document.getElementById('profileJoined').textContent = new Date(comm.created_at || prof.created_at).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });
    document.getElementById('profileFollowers').textContent = comm.followers_count || 0;
    document.getElementById('profileFollowing').textContent = comm.following_count || 0;
    document.getElementById('profilePosts').textContent = comm.posts_count || 0;
    
    if (prof.certified) {
        document.getElementById('profileCertified').style.display = 'flex';
    }
    document.title = `${name} | HubISoccer`;
}

function updateFollowButton() {
    const actionsDiv = document.getElementById('profileActions');
    if (isOwnProfile) {
        actionsDiv.innerHTML = `
            <a href="feed-setup.html" class="btn-outline"><i class="fas fa-pen"></i> Modifier le profil</a>
            <a href="../settings/foot-settings.html" class="btn-ghost"><i class="fas fa-cog"></i></a>
        `;
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
            <button class="btn-ghost" id="blockBtn" title="Bloquer">
                <i class="fas fa-ban"></i>
            </button>
        `;
        document.getElementById('followBtn').addEventListener('click', toggleFollow);
        document.getElementById('blockBtn').addEventListener('click', blockUser);
    }
}

async function toggleFollow() {
    if (!currentProfile) return;
    const btn = document.getElementById('followBtn');
    btn.disabled = true;
    try {
        if (isFollowing) {
            await sb.from('supabaseAuthPrive_follows').delete()
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('following_hubisoccer_id', profileHubisoccerId);
            isFollowing = false;
            toast('Vous n\'êtes plus abonné','info');
        } else {
            await sb.from('supabaseAuthPrive_follows').insert({
                follower_hubisoccer_id: currentProfile.hubisoccer_id,
                following_hubisoccer_id: profileHubisoccerId
            });
            isFollowing = true;
            toast('Abonné !','success');
        }
        const { data: comm } = await sb.from('supabaseAuthPrive_communities')
            .select('followers_count').eq('hubisoccer_id', profileHubisoccerId).single();
        if (comm) document.getElementById('profileFollowers').textContent = comm.followers_count;
        updateFollowButton();
    } catch (err) {
        toast('Erreur: '+err.message,'error');
    } finally {
        btn.disabled = false;
    }
}

async function blockUser() {
    if (!confirm('Bloquer cet utilisateur ? Vous ne verrez plus son contenu.')) return;
    try {
        await sb.from('supabaseAuthPrive_blocked_users').insert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            blocked_hubisoccer_id: profileHubisoccerId
        });
        toast('Utilisateur bloqué','success');
    } catch (err) {
        toast('Erreur: '+err.message,'error');
    }
}

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
        <div class="about-item"><span>Projet d\'étude</span><span>${escapeHtml(prof.study_project || '—')}</span></div>
    `;
    document.getElementById('aboutStudies').innerHTML = studiesHtml;
    
    const careerHtml = `
        <div class="about-item"><span>Secteurs d\'intérêt</span><span>${escapeHtml(prof.interest_sectors || '—')}</span></div>
        <div class="about-item"><span>Expériences</span><span>${escapeHtml(prof.professional_experiences || '—')}</span></div>
        <div class="about-item"><span>Soft skills</span><span>${escapeHtml(prof.soft_skills || '—')}</span></div>
        <div class="about-item"><span>Disponibilités</span><span>${escapeHtml(prof.availability || '—')}</span></div>
    `;
    document.getElementById('aboutCareer').innerHTML = careerHtml;
    
    const helpHtml = `
        <div class="about-item"><span>Je peux aider</span><span>${escapeHtml(prof.help_offer || '—')}</span></div>
        <div class="about-item"><span>J\'ai besoin d\'aide</span><span>${escapeHtml(prof.help_need || '—')}</span></div>
        <div class="about-item"><span>Objectifs réseau</span><span>${escapeHtml(prof.network_goals || '—')}</span></div>
    `;
    document.getElementById('aboutHelp').innerHTML = helpHtml;
}
// Fin rendu profil

// Début posts
async function loadPosts(reset = false) {
    if (reset) { postOffset = 0; posts = []; }
    setLoader(true, 'Chargement des publications...', 70);
    let query = sb.from('supabaseAuthPrive_posts')
        .select(`
            *,
            author:author_hubisoccer_id(full_name, display_name, avatar_url, feed_id, certified),
            community:community_id(name, feed_id, avatar_url)
        `)
        .eq('author_hubisoccer_id', profileHubisoccerId)
        .order('created_at', { ascending: false })
        .range(postOffset, postOffset + PAGE_SIZE - 1);
    
    const { data, error } = await query;
    if (error) { toast('Erreur chargement posts','error'); setLoader(false); return; }
    
    hasMorePosts = data.length === PAGE_SIZE;
    postOffset += data.length;
    if (reset) posts = data; else posts = [...posts, ...data];
    
    renderPostsGrid();
    setLoader(false);
}

function renderPostsGrid() {
    const grid = document.getElementById('profilePostsGrid');
    if (posts.length === 0) {
        grid.innerHTML = '<div class="c-empty"><p>Aucune publication</p></div>';
        return;
    }
    grid.innerHTML = posts.map(post => {
        const media = post.media_url ? 
            (post.media_type === 'video' ? 
                `<video src="${post.media_url}" muted></video>` : 
                `<img src="${post.media_url}" alt="">`) : '';
        return `
            <div class="post-card" data-post-id="${post.id}" onclick="openPost('${post.id}')">
                ${media ? `<div class="post-media-thumb">${media}</div>` : ''}
                <div class="post-content-preview">${escapeHtml(post.content?.substring(0,100) || '')}</div>
                <div class="post-stats">
                    <span><i class="far fa-heart"></i> ${post.likes_count||0}</span>
                    <span><i class="far fa-comment"></i> ${post.comments_count||0}</span>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('loadMorePostsWrap').style.display = hasMorePosts ? 'block' : 'none';
}

async function loadMedia(type) {
    const grid = type === 'image' ? document.getElementById('photosGrid') : document.getElementById('videosGrid');
    grid.innerHTML = '<div class="c-spinner"></div>';
    const { data } = await sb.from('supabaseAuthPrive_posts')
        .select('id, media_url, media_type')
        .eq('author_hubisoccer_id', profileHubisoccerId)
        .eq('media_type', type)
        .order('created_at', { ascending: false })
        .limit(50);
    if (!data || data.length === 0) {
        grid.innerHTML = '<p>Aucun média</p>';
        return;
    }
    grid.innerHTML = data.map(item => `
        <div class="media-item" onclick="openPost('${item.id}')">
            ${type === 'image' ? `<img src="${item.media_url}" alt="">` : `<video src="${item.media_url}" muted></video>`}
        </div>
    `).join('');
}

function openPost(postId) {
    window.location.href = `post-view.html?id=${postId}`;
}
window.openPost = openPost;

function initTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            activeTab = tabId;
            if (tabId === 'posts' && posts.length === 0) loadPosts(true);
            else if (tabId === 'media') loadMedia('image');
            else if (tabId === 'videos') loadMedia('video');
        });
    });
}
// Fin posts

// Début initialisation
async function init() {
    setLoader(true, 'Vérification session...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    const identifier = getProfileIdFromUrl();
    if (!identifier) { toast('Profil non spécifié','error'); return; }
    
    await loadProfileData(identifier);
    if (!profileData) return;
    
    initTabs();
    await loadPosts(true);
    
    // Sidebar mobile
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
    
    // Dropdown user
    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);
    
    document.getElementById('loadMorePostsBtn').addEventListener('click', () => loadPosts(false));
    
    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });
}

document.addEventListener('DOMContentLoaded', init);
// Fin initialisation