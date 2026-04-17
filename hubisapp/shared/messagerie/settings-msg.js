// ============================================================
//  HUBISOCCER — SETTINGS-MSG.JS (VERSION COMPLÈTE)
//  Paramètres de la messagerie — Tous rôles
//  Gère les préférences utilisateur (localStorage + Supabase)
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let currentSettings = {
    pushNotifications: true,
    notificationSound: true,
    messagePreview: true,
    whoCanMessage: 'everyone',
    readReceipts: true,
    blockGroupInvites: false,
    theme: 'system',
    fontSize: 'medium',
    bubbleStyle: 'rounded',
    language: 'fr'
};

const LANGUAGES = [
    { code: 'fr', name: 'Français' }, { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' }, { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' }, { code: 'zh', name: '中文' }, { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' }, { code: 'ru', name: 'Русский' }, { code: 'hi', name: 'हिन्दी' },
    { code: 'nl', name: 'Nederlands' }, { code: 'sv', name: 'Svenska' }, { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' }, { code: 'fi', name: 'Suomi' }, { code: 'pl', name: 'Polski' },
    { code: 'tr', name: 'Türkçe' }, { code: 'el', name: 'Ελληνικά' }, { code: 'he', name: 'עברית' },
    { code: 'id', name: 'Bahasa Indonesia' }, { code: 'ms', name: 'Bahasa Melayu' }, { code: 'th', name: 'ไทย' }
];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await window.requireAuth();
        if (!auth) return false;

        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Profil non chargé. Redirection...', 'error');
            window.location.href = '../community/feed-setup.html';
            return false;
        }

        document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');
        buildSidebar();
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
// ========== FIN : SESSION & PROFIL ==========

// ========== DEBUT : CONSTRUCTION SIDEBAR (28 RÔLES) ==========
function buildSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;
    const role = currentProfile?.role_code || 'FOOT';
    const roleMap = {
        FOOT: '../../footballeur/dashboard/foot-dash.html',
        BASK: '../../basketteur/dashboard/basketteur-dash.html',
        TENN: '../../tennisman/dashboard/tennisman-dash.html',
        ATHL: '../../athlete/dashboard/athlete-dash.html',
        HANDB: '../../handballeur/dashboard/handballeur-dash.html',
        VOLL: '../../volleyeur/dashboard/volleyeur-dash.html',
        RUGBY: '../../rugbyman/dashboard/rugbyman-dash.html',
        NATA: '../../nageur/dashboard/nageur-dash.html',
        ARTSM: '../../arts_martiaux/dashboard/arts_martiaux-dash.html',
        CYCL: '../../cycliste/dashboard/cycliste-dash.html',
        CHAN: '../../chanteur/dashboard/chanteur-dash.html',
        DANS: '../../danseur/dashboard/danseur-dash.html',
        COMP: '../../compositeur/dashboard/compositeur-dash.html',
        ACIN: '../../acteur_cinema/dashboard/acteur_cinema-dash.html',
        ATHE: '../../acteur_theatre/dashboard/acteur_theatre-dash.html',
        HUMO: '../../humoriste/dashboard/humoriste-dash.html',
        SLAM: '../../slameur/dashboard/slameur-dash.html',
        DJ: '../../dj/dashboard/dj-dash.html',
        CIRQ: '../../cirque/dashboard/cirque-dash.html',
        VISU: '../../artiste_visuel/dashboard/artiste_visuel-dash.html',
        PARRAIN: '../../parrain/dashboard/parrain-dash.html',
        AGENT: '../../agent_fifa/dashboard/agent_fifa-dash.html',
        COACH: '../../coach/dashboard/coach-dash.html',
        MEDIC: '../../staff_medical/dashboard/staff_medical-dash.html',
        ARBIT: '../../corps_arbitral/dashboard/corps_arbitral-dash.html',
        ACAD: '../../academie_sportive/dashboard/academie_sportive-dash.html',
        FORM: '../../formateur/dashboard/formateur-dash.html',
        TOURN: '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html',
        ADMIN: '../../authprive/admin/admin-dashboard.html'
    };
    const dashboardUrl = roleMap[role] || roleMap['FOOT'];
    const links = [
        { href: '../community/feed.html', icon: 'fa-newspaper', text: 'Fil d\'actualité' },
        { href: 'conversation.html', icon: 'fa-comments', text: 'Messages' },
        { href: '../community/stories.html', icon: 'fa-clock', text: 'Stories' },
        { href: `../community/profil-feed.html?id=${currentProfile?.hubisoccer_id}`, icon: 'fa-user', text: 'Mon Profil' },
        { href: dashboardUrl, icon: 'fa-tachometer-alt', text: 'Tableau de bord' },
        { href: 'settings-msg.html', icon: 'fa-cog', text: 'Paramètres', active: true }
    ];
    nav.innerHTML = links.map(link => `
        <a href="${link.href}" class="${link.active ? 'active' : ''}">
            <i class="fas ${link.icon}"></i>
            <span>${link.text}</span>
        </a>
    `).join('');
}
// ========== FIN : SIDEBAR ==========

// ========== DEBUT : CHARGEMENT / SAUVEGARDE DES PARAMÈTRES ==========
function loadSettings() {
    const saved = localStorage.getItem('hubisoccer_msg_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentSettings = { ...currentSettings, ...parsed };
        } catch (e) {}
    }
    // Appliquer aux champs
    document.getElementById('pushNotifications').checked = currentSettings.pushNotifications;
    document.getElementById('notificationSound').checked = currentSettings.notificationSound;
    document.getElementById('messagePreview').checked = currentSettings.messagePreview;
    document.getElementById('whoCanMessage').value = currentSettings.whoCanMessage;
    document.getElementById('readReceipts').checked = currentSettings.readReceipts;
    document.getElementById('blockGroupInvites').checked = currentSettings.blockGroupInvites;
    document.getElementById('themeSelect').value = currentSettings.theme;
    document.getElementById('fontSize').value = currentSettings.fontSize;
    document.getElementById('bubbleStyle').value = currentSettings.bubbleStyle;
    document.getElementById('currentLangCode').textContent = currentSettings.language.toUpperCase();
    applyTheme();
}

function saveSettings() {
    currentSettings.pushNotifications = document.getElementById('pushNotifications').checked;
    currentSettings.notificationSound = document.getElementById('notificationSound').checked;
    currentSettings.messagePreview = document.getElementById('messagePreview').checked;
    currentSettings.whoCanMessage = document.getElementById('whoCanMessage').value;
    currentSettings.readReceipts = document.getElementById('readReceipts').checked;
    currentSettings.blockGroupInvites = document.getElementById('blockGroupInvites').checked;
    currentSettings.theme = document.getElementById('themeSelect').value;
    currentSettings.fontSize = document.getElementById('fontSize').value;
    currentSettings.bubbleStyle = document.getElementById('bubbleStyle').value;
    localStorage.setItem('hubisoccer_msg_settings', JSON.stringify(currentSettings));
    applyTheme();
    toast('Paramètres enregistrés', 'success');
}

function resetSettings() {
    currentSettings = {
        pushNotifications: true,
        notificationSound: true,
        messagePreview: true,
        whoCanMessage: 'everyone',
        readReceipts: true,
        blockGroupInvites: false,
        theme: 'system',
        fontSize: 'medium',
        bubbleStyle: 'rounded',
        language: currentSettings.language
    };
    loadSettings(); // recharge l'UI
    saveSettings();
    toast('Paramètres réinitialisés', 'info');
}

function applyTheme() {
    const theme = currentSettings.theme;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    document.body.style.fontSize = { small: '14px', medium: '16px', large: '18px' }[currentSettings.fontSize] || '16px';
    // Bulles (sera appliqué via variable CSS ou classes dans discuss.css)
    document.documentElement.style.setProperty('--bubble-radius', 
        currentSettings.bubbleStyle === 'rounded' ? '18px' : 
        currentSettings.bubbleStyle === 'slightly' ? '8px' : '2px');
}
// ========== FIN : CHARGEMENT / SAUVEGARDE ==========

// ========== DEBUT : GESTION DES LANGUES ==========
function renderLanguageGrid() {
    const grid = document.getElementById('languageGrid');
    grid.innerHTML = LANGUAGES.map(lang => `
        <div class="language-card ${currentSettings.language === lang.code ? 'active' : ''}" data-lang="${lang.code}">
            <span>${lang.name}</span>
        </div>
    `).join('');
    grid.querySelectorAll('.language-card').forEach(card => {
        card.addEventListener('click', () => {
            const lang = card.dataset.lang;
            currentSettings.language = lang;
            document.getElementById('currentLangCode').textContent = lang.toUpperCase();
            renderLanguageGrid();
            saveSettings();
            // Appliquer les traductions si disponibles
        });
    });
}
// ========== FIN : LANGUES ==========

// ========== DEBUT : UTILISATEURS BLOQUÉS ==========
async function loadBlockedUsers() {
    const container = document.getElementById('blockedListContainer');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_blocked_users')
            .select('blocked_hubisoccer_id, profile:supabaseAuthPrive_profiles!blocked_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-text">Aucun utilisateur bloqué</p>';
            return;
        }
        container.innerHTML = data.map(b => {
            const p = b.profile || {};
            const name = p.full_name || p.display_name || 'Utilisateur';
            const initials = getInitials(name);
            const avatar = p.avatar_url;
            return `
                <div class="blocked-item">
                    ${avatar ? `<img src="${avatar}" alt="">` : `<div class="blocked-avatar-initials">${initials}</div>`}
                    <span class="blocked-name">${escapeHtml(name)}</span>
                    <button class="btn-unblock" data-uid="${b.blocked_hubisoccer_id}">Débloquer</button>
                </div>
            `;
        }).join('');
        container.querySelectorAll('.btn-unblock').forEach(btn => {
            btn.addEventListener('click', async () => {
                await sb.from('supabaseAuthPrive_blocked_users')
                    .delete()
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

// ========== DEBUT : STOCKAGE ==========
async function calculateStorageUsage() {
    try {
        const { data, error } = await sb.storage.from('message_attachments').list(currentProfile.hubisoccer_id);
        if (error) throw error;
        let totalSize = 0;
        data?.forEach(file => totalSize += file.metadata?.size || 0);
        const mb = (totalSize / (1024 * 1024)).toFixed(2);
        document.getElementById('storageUsage').textContent = `${mb} Mo utilisés`;
    } catch {
        document.getElementById('storageUsage').textContent = '0 Mo utilisés';
    }
}

async function deleteAllMedia() {
    if (!confirm('Supprimer définitivement tous vos médias ? Cette action est irréversible.')) return;
    try {
        const { data, error } = await sb.storage.from('message_attachments').list(currentProfile.hubisoccer_id);
        if (error) throw error;
        if (data?.length) {
            const files = data.map(f => f.name);
            await sb.storage.from('message_attachments').remove(files);
        }
        toast('Tous les médias ont été supprimés', 'success');
        calculateStorageUsage();
    } catch (err) {
        toast('Erreur lors de la suppression', 'error');
    }
}
// ========== FIN : STOCKAGE ==========

// ========== DEBUT : EXPORT ==========
async function exportConversations() {
    try {
        const { data: convs } = await sb
            .from('supabaseAuthPrive_conversations')
            .select(`
                id, is_group, group_name, created_at,
                participants:supabaseAuthPrive_conversation_participants(user_hubisoccer_id)
            `)
            .in('id', function() { /* sous-requête */ return sb.from('supabaseAuthPrive_conversation_participants').select('conversation_id').eq('user_hubisoccer_id', currentProfile.hubisoccer_id); });
        const exportData = [];
        for (const conv of (convs || [])) {
            const { data: messages } = await sb
                .from('supabaseAuthPrive_messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: true });
            exportData.push({ conversation: conv, messages });
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hubisoccer_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Export réussi', 'success');
    } catch (err) {
        toast('Erreur export', 'error');
    }
}
// ========== FIN : EXPORT ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement des paramètres...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }
    loadSettings();
    renderLanguageGrid();
    calculateStorageUsage();

    // Écouteurs des onglets
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = `panel-${tab.dataset.tab}`;
            document.getElementById(panelId).classList.add('active');
            if (tab.dataset.tab === 'blocked') loadBlockedUsers();
        });
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
    document.getElementById('clearCacheBtn').addEventListener('click', () => {
        localStorage.removeItem('hubisoccer_msg_cache');
        toast('Cache vidé', 'success');
    });
    document.getElementById('deleteAllMediaBtn').addEventListener('click', deleteAllMedia);
    document.getElementById('exportDataBtn').addEventListener('click', exportConversations);

    // Menu déroulant utilisateur
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropProfile').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `../community/profil-feed.html?id=${currentProfile.hubisoccer_id}`;
    });
    document.getElementById('dropDashboard').addEventListener('click', (e) => {
        e.preventDefault();
        const role = currentProfile?.role_code || 'FOOT';
        const roleMap = { FOOT: '../../footballeur/dashboard/foot-dash.html', BASK: '../../basketteur/dashboard/basketteur-dash.html' /* etc. */ };
        window.location.href = roleMap[role] || roleMap['FOOT'];
    });
    document.getElementById('dropLogout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========
