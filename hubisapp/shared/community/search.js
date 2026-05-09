// ============================================================
//  HUBISOCCER — SEARCH.JS (VERSION CORRIGÉE COMPLÈTE)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js
// On les utilise directement.

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

const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'BASK': '../../basketteur/dashboard/basketteur-dash.html',
    'TENN': '../../tennisman/dashboard/tennisman-dash.html',
    'ATHL': '../../athlete/dashboard/athlete-dash.html',
    'HANDB': '../../handballeur/dashboard/handballeur-dash.html',
    'VOLL': '../../volleyeur/dashboard/volleyeur-dash.html',
    'RUGBY': '../../rugbyman/dashboard/rugbyman-dash.html',
    'NATA': '../../nageur/dashboard/nageur-dash.html',
    'ARTSM': '../../arts_martiaux/dashboard/arts_martiaux-dash.html',
    'CYCL': '../../cycliste/dashboard/cycliste-dash.html',
    'CHAN': '../../chanteur/dashboard/chanteur-dash.html',
    'DANS': '../../danseur/dashboard/danseur-dash.html',
    'COMP': '../../compositeur/dashboard/compositeur-dash.html',
    'ACIN': '../../acteur_cinema/dashboard/acteur_cinema-dash.html',
    'ATHE': '../../acteur_theatre/dashboard/acteur_theatre-dash.html',
    'HUMO': '../../humoriste/dashboard/humoriste-dash.html',
    'SLAM': '../../slameur/dashboard/slameur-dash.html',
    'DJ': '../../dj/dashboard/dj-dash.html',
    'CIRQ': '../../cirque/dashboard/cirque-dash.html',
    'VISU': '../../artiste_visuel/dashboard/artiste_visuel-dash.html',
    'PARRAIN': '../../parrain/dashboard/parrain-dash.html',
    'AGENT': '../../agent_fifa/dashboard/agent_fifa-dash.html',
    'COACH': '../../coach/dashboard/coach-dash.html',
    'MEDIC': '../../staff_medical/dashboard/staff_medical-dash.html',
    'ARBIT': '../../corps_arbitral/dashboard/corps_arbitral-dash.html',
    'ACAD': '../../academie_sportive/dashboard/academie_sportive-dash.html',
    'FORM': '../../formateur/dashboard/formateur-dash.html',
    'TOURN': '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};

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

async function initSessionAndProfile() {
    const auth = await requireAuth();
    if (!auth) return false;

    document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
    updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name);

    const dash = ROLE_DASHBOARD_MAP[currentProfile.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back() || (window.location.href = 'feed.html');
    });

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
        let count = 0;
        results = [];

        if (activeType === 'all' || activeType === 'profiles') {
            const profileResults = await searchProfiles(query);
            results = [...results, ...(profileResults.data || [])];
            if (activeType === 'profiles') count = profileResults.count || 0;
        }

        if (activeType === 'all' || activeType === 'posts') {
            const postResults = await searchPosts(query);
            results = [...results, ...(postResults.data || [])];
            if (activeType === 'posts') count = postResults.count || 0;
        }

        if (activeType === 'hashtags') {
            const hashtagResults = await searchHashtags(query);
            results = hashtagResults.data || [];
            count = hashtagResults.count || 0;
        }

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
        .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)', { count: 'exact' })
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

function openProfile(hubisoccerId) {
    window.location.href = `profil-feed.html?id=${hubisoccerId}`;
}
window.openProfile = openProfile;

function openPost(postId) {
    window.location.href = `post-view.html?id=${postId}`;
}
window.openPost = openPost;

function searchHashtag(tag) {
    document.getElementById('searchInput').value = '#' + tag;
    activeType = 'hashtags';
    document.querySelectorAll('[data-type]').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.type === 'hashtags');
    });
    performSearch(true);
}
window.searchHashtag = searchHashtag;

async function init() {
    setLoader(true, 'Chargement du profil...', 30);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    initRoleFilters();
    loadRecentSearches();
    await loadTrending();
    setLoader(false);

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

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        searchInput.value = q;
        clearBtn.style.display = 'flex';
        performSearch(true);
    }
}

document.addEventListener('DOMContentLoaded', init);