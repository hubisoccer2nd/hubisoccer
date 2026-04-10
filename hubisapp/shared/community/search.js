// ============================================================
//  HUBISOCCER — SEARCH.JS
//  Page de recherche avancée
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
let currentUser       = null;
let currentProfile    = null;
let searchQuery       = '';
let activeType        = 'all';
let activeRole        = 'all';
let sortBy            = 'relevance';
let results           = [];
let offset            = 0;
const PAGE_SIZE       = 15;
let hasMore           = false;
let isLoading         = false;
let recentSearches    = [];
// Fin état global

// Début mapping rôles
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};

// Liste complète des 28 rôles pour les filtres
const ALL_ROLES = [
    { code: 'FOOT', label: '⚽ Footballeur' },
    { code: 'BASK', label: '🏀 Basketteur' },
    { code: 'TENN', label: '🎾 Tennisman' },
    { code: 'ATHL', label: '🏃 Athlète' },
    { code: 'HANDB', label: '🤾 Handballeur' },
    { code: 'VOLL', label: '🏐 Volleyeur' },
    { code: 'RUGBY', label: '🏉 Rugbyman' },
    { code: 'NATA', label: '🏊 Nageur' },
    { code: 'ARTSM', label: '🥋 Arts martiaux' },
    { code: 'CYCL', label: '🚴 Cycliste' },
    { code: 'CHAN', label: '🎤 Chanteur' },
    { code: 'DANS', label: '💃 Danseur' },
    { code: 'COMP', label: '🎼 Compositeur' },
    { code: 'ACIN', label: '🎬 Acteur cinéma' },
    { code: 'ATHE', label: '🎭 Acteur théâtre' },
    { code: 'HUMO', label: '🎙️ Humoriste' },
    { code: 'SLAM', label: '🗣️ Slameur' },
    { code: 'DJ', label: '🎧 DJ / Producteur' },
    { code: 'CIRQ', label: '🤹 Artiste de cirque' },
    { code: 'VISU', label: '🎨 Artiste visuel' },
    { code: 'PARRAIN', label: '🤝 Parrain' },
    { code: 'AGENT', label: '💼 Agent FIFA' },
    { code: 'COACH', label: '📋 Coach' },
    { code: 'MEDIC', label: '⚕️ Staff médical' },
    { code: 'ARBIT', label: '🏁 Corps arbitral' },
    { code: 'ACAD', label: '🏫 Académie sportive' },
    { code: 'FORM', label: '🎓 Formateur' },
    { code: 'TOURN', label: '🏆 Gestionnaire tournoi' }
];
// Fin mapping rôles

// Début session et profil
async function initSessionAndProfile() {
    const user = await checkSession();
    if (!user) return false;
    currentUser = user;

    const profile = await loadProfile(user.id);
    if (!profile) return false;
    currentProfile = profile;

    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Utilisateur';
    updateAvatarDisplay(profile.avatar_url, profile.full_name || profile.display_name);

    const dash = ROLE_DASHBOARD_MAP[profile.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;
    document.getElementById('backBtn').addEventListener('click', () => window.history.back() || window.location.href = 'feed.html');

    return true;
}

function updateAvatarDisplay(avatarUrl, fullName) {
    const avatar = document.getElementById('userAvatar');
    const initials = document.getElementById('userAvatarInitials');
    if (!avatar || !initials) return;
    const text = getInitials(fullName);
    if (avatarUrl && avatarUrl !== '') {
        avatar.src = avatarUrl;
        avatar.style.display = 'block';
        initials.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = text;
    }
}
// Fin session et profil

// Début initialisation des filtres
function initRoleFilters() {
    const container = document.getElementById('roleFilters');
    container.innerHTML = `
        <button class="filter-chip active" data-role="all">Tous</button>
        ${ALL_ROLES.map(r => `<button class="filter-chip" data-role="${r.code}">${r.label}</button>`).join('')}
    `;
    document.querySelectorAll('#roleFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#roleFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeRole = chip.dataset.role;
            if (searchQuery) performSearch(true);
        });
    });
}

function loadRecentSearches() {
    try {
        const stored = localStorage.getItem('hubisoccer_recent_searches');
        if (stored) recentSearches = JSON.parse(stored).slice(0, 10);
        renderRecentSearches();
    } catch (e) {
        recentSearches = [];
    }
}

function saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    recentSearches = recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());
    recentSearches.unshift(query);
    recentSearches = recentSearches.slice(0, 10);
    localStorage.setItem('hubisoccer_recent_searches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const container = document.getElementById('recentList');
    if (recentSearches.length === 0) {
        container.innerHTML = '<p class="no-suggestions">Aucune recherche récente</p>';
        return;
    }
    container.innerHTML = recentSearches.map(q => `
        <div class="suggestion-item" data-query="${escapeHtml(q)}">
            <i class="fas fa-history"></i>
            <span>${escapeHtml(q)}</span>
        </div>
    `).join('');
    document.querySelectorAll('.recent-list .suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            document.getElementById('searchInput').value = el.dataset.query;
            performSearch(true);
        });
    });
}

async function loadTrending() {
    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_posts')
            .select('content')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) return;

        const hashtagCounts = {};
        data?.forEach(post => {
            const matches = post.content?.match(/#(\w+)/g) || [];
            matches.forEach(tag => {
                const cleanTag = tag.toLowerCase().replace('#', '');
                hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
            });
        });

        const trending = Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, count]) => ({ tag, count }));

        const container = document.getElementById('trendingList');
        if (trending.length === 0) {
            container.innerHTML = '<p class="no-suggestions">Aucune tendance</p>';
            return;
        }

        container.innerHTML = trending.map(t => `
            <div class="suggestion-item" data-query="${escapeHtml('#' + t.tag)}">
                <i class="fas fa-hashtag"></i>
                <span>${escapeHtml(t.tag)}</span>
                <small>${t.count} post${t.count > 1 ? 's' : ''}</small>
            </div>
        `).join('');

        document.querySelectorAll('.trending-list .suggestion-item').forEach(el => {
            el.addEventListener('click', () => {
                document.getElementById('searchInput').value = el.dataset.query;
                performSearch(true);
            });
        });
    } catch (e) {
        console.error('Erreur tendances:', e);
    }
}
// Fin initialisation des filtres

// Début recherche
async function performSearch(reset = false) {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        toast('Veuillez entrer un terme de recherche', 'warning');
        return;
    }

    searchQuery = query;
    saveRecentSearch(query);

    if (reset) {
        offset = 0;
        results = [];
    }

    document.getElementById('searchSuggestions').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('searchSkeleton').style.display = 'block';
    document.getElementById('searchEmpty').style.display = 'none';
    document.getElementById('searchStats').style.display = 'none';

    if (isLoading) return;
    isLoading = true;

    try {
        let queryBuilder;
        let count = 0;

        if (activeType === 'all' || activeType === 'profiles') {
            const profileResults = await searchProfiles(query);
            if (activeType === 'profiles') {
                results = profileResults.data || [];
                count = profileResults.count || 0;
            } else {
                results = [...results, ...(profileResults.data || [])];
            }
        }

        if (activeType === 'all' || activeType === 'posts') {
            const postResults = await searchPosts(query);
            if (activeType === 'posts') {
                results = postResults.data || [];
                count = postResults.count || 0;
            } else {
                results = [...results, ...(postResults.data || [])];
            }
        }

        if (activeType === 'hashtags') {
            const hashtagResults = await searchHashtags(query);
            results = hashtagResults.data || [];
            count = hashtagResults.count || 0;
        }

        // Trier les résultats si type 'all'
        if (activeType === 'all') {
            results.sort((a, b) => {
                if (sortBy === 'recent') {
                    return new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0);
                }
                if (sortBy === 'popular') {
                    return (b.likes_count || b.followers_count || 0) - (a.likes_count || a.followers_count || 0);
                }
                return 0;
            });
        }

        hasMore = results.length === PAGE_SIZE;
        renderResults();
        document.getElementById('searchStats').style.display = 'flex';
        document.getElementById('resultsCount').textContent = results.length;

    } catch (err) {
        console.error('Erreur recherche:', err);
        toast('Erreur lors de la recherche', 'error');
    } finally {
        isLoading = false;
        document.getElementById('searchSkeleton').style.display = 'none';
        document.getElementById('loadMoreWrap').style.display = hasMore ? 'block' : 'none';
    }
}

async function searchProfiles(query) {
    let q = sb.from('supabaseAuthPrive_communities')
        .select('*, profiles:supabaseAuthPrive_profiles!hubisoccer_id(*)', { count: 'exact' })
        .or(`name.ilike.%${query}%,feed_id.ilike.%${query}%`)
        .range(offset, offset + PAGE_SIZE - 1);

    if (activeRole !== 'all') {
        q = q.eq('profiles.role_code', activeRole);
    }

    if (sortBy === 'recent') {
        q = q.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
        q = q.order('followers_count', { ascending: false });
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data.map(d => ({ ...d, resultType: 'profile' })), count };
}

async function searchPosts(query) {
    let q = sb.from('supabaseAuthPrive_posts')
        .select('*, author:author_hubisoccer_id(*)', { count: 'exact' })
        .ilike('content', `%${query}%`)
        .range(offset, offset + PAGE_SIZE - 1);

    if (activeRole !== 'all') {
        q = q.eq('author.role_code', activeRole);
    }

    if (sortBy === 'recent') {
        q = q.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
        q = q.order('likes_count', { ascending: false });
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data.map(d => ({ ...d, resultType: 'post' })), count };
}

async function searchHashtags(query) {
    const cleanQuery = query.replace('#', '');
    const { data, error, count } = await sb
        .from('supabaseAuthPrive_posts')
        .select('*', { count: 'exact' })
        .ilike('content', `%#${cleanQuery}%`)
        .range(offset, offset + PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data.map(d => ({ ...d, resultType: 'hashtag', hashtag: cleanQuery })), count };
}

function renderResults() {
    const container = document.getElementById('resultsContainer');
    if (results.length === 0) {
        container.innerHTML = '';
        document.getElementById('searchEmpty').style.display = 'flex';
        return;
    }

    container.innerHTML = results.map(item => {
        if (item.resultType === 'profile') return renderProfileCard(item);
        if (item.resultType === 'post') return renderPostCard(item);
        if (item.resultType === 'hashtag') return renderHashtagCard(item);
        return '';
    }).join('');
}

function renderProfileCard(community) {
    const profile = community.profiles || {};
    const name = community.name || profile.full_name || profile.display_name || 'Utilisateur';
    const avatarUrl = community.avatar_url || profile.avatar_url;
    const initials = getInitials(name);
    const handle = community.feed_id ? '@' + community.feed_id : '';
    const role = profile.role_code ? ALL_ROLES.find(r => r.code === profile.role_code)?.label || profile.role_code : '';

    return `
        <div class="result-card profile-card" onclick="openProfile('${community.hubisoccer_id}')">
            <div class="profile-avatar">
                ${avatarUrl ? `<img src="${avatarUrl}" alt="">` : `<div class="avatar-initials">${initials}</div>`}
            </div>
            <div class="profile-info">
                <div class="profile-name">${escapeHtml(name)} ${profile.certified ? '<i class="fas fa-check-circle" style="color:var(--primary);"></i>' : ''}</div>
                <div class="profile-handle">${handle}</div>
                <div class="profile-role">${role}</div>
                <div class="profile-bio">${escapeHtml(community.bio || profile.bio || '')}</div>
                <div class="profile-stats">
                    <span><i class="fas fa-users"></i> ${community.followers_count || 0} abonnés</span>
                    <span><i class="fas fa-newspaper"></i> ${community.posts_count || 0} posts</span>
                </div>
            </div>
        </div>
    `;
}

function renderPostCard(post) {
    const author = post.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorAvatar = author.avatar_url;
    const authorInitials = getInitials(authorName);
    const content = post.content ? formatText(post.content.substring(0, 200)) : '';
    const media = post.media_url ? `<div class="post-media-thumb"><img src="${post.media_url}" alt=""></div>` : '';

    return `
        <div class="result-card post-card" onclick="openPost('${post.id}')">
            <div class="post-header">
                <div class="post-author-avatar">
                    ${authorAvatar ? `<img src="${authorAvatar}" alt="">` : `<div class="avatar-initials small">${authorInitials}</div>`}
                </div>
                <div class="post-author-info">
                    <span class="post-author-name">${escapeHtml(authorName)}</span>
                    <span class="post-time">${timeSince(post.created_at)}</span>
                </div>
            </div>
            <div class="post-content">${content}</div>
            ${media}
            <div class="post-stats">
                <span><i class="far fa-heart"></i> ${post.likes_count || 0}</span>
                <span><i class="far fa-comment"></i> ${post.comments_count || 0}</span>
            </div>
        </div>
    `;
}

function renderHashtagCard(item) {
    return `
        <div class="result-card hashtag-card" onclick="searchHashtag('${item.hashtag}')">
            <div class="hashtag-icon"><i class="fas fa-hashtag"></i></div>
            <div class="hashtag-info">
                <div class="hashtag-name">#${escapeHtml(item.hashtag)}</div>
                <div class="hashtag-count">${item.count || 0} publications</div>
            </div>
        </div>
    `;
}
// Fin recherche

// Début navigation
function openProfile(hubisoccerId) {
    window.location.href = `profil-feed.html?id=${hubisoccerId}`;
}

function openPost(postId) {
    window.location.href = `post-view.html?id=${postId}`;
}

function searchHashtag(tag) {
    document.getElementById('searchInput').value = '#' + tag;
    activeType = 'hashtags';
    document.querySelectorAll('[data-type]').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.type === 'hashtags');
    });
    performSearch(true);
}
// Fin navigation

// Début initialisation
async function init() {
    setLoader(true, 'Chargement du profil...', 30);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    initRoleFilters();
    loadRecentSearches();
    await loadTrending();
    setLoader(false);

    // Event listeners
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchBtn = document.getElementById('searchBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const sortSelect = document.getElementById('sortSelect');
    const roleFilterGroup = document.getElementById('roleFilterGroup');

    searchInput.addEventListener('input', (e) => {
        clearBtn.style.display = e.target.value ? 'flex' : 'none';
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        document.getElementById('searchSuggestions').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('searchStats').style.display = 'none';
        document.getElementById('searchEmpty').style.display = 'none';
        searchInput.focus();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(true);
    });

    searchBtn.addEventListener('click', () => performSearch(true));
    loadMoreBtn.addEventListener('click', () => performSearch(false));

    document.querySelectorAll('[data-type]').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('[data-type]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeType = chip.dataset.type;
            roleFilterGroup.style.display = activeType === 'profiles' ? 'block' : 'none';
            if (searchQuery) performSearch(true);
        });
    });

    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        if (searchQuery) performSearch(true);
    });

    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    // Pré-remplir si paramètre dans l'URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        searchInput.value = q;
        clearBtn.style.display = 'flex';
        performSearch(true);
    }
}

// Exposer fonctions globales
window.openProfile = openProfile;
window.openPost = openPost;
window.searchHashtag = searchHashtag;

document.addEventListener('DOMContentLoaded', init);
// Fin initialisation