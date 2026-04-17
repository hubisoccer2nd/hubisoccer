// ============================================================
//  HUBISOCCER — PROFIL-MSG.JS (VERSION COMPLÈTE)
//  Profil de messagerie — Tous rôles
//  Gère les informations personnelles, la confidentialité,
//  les statistiques et les actions sur les données.
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let currentProfileData = null;
let pendingAvatarFile = null;
let pendingCoverFile = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await window.requireAuth();
        if (!auth) return false;
        
        // 🔥 Attendre que currentProfile soit chargé par session.js
        let attempts = 0;
        while ((!currentProfile || !currentProfile.hubisoccer_id) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Profil non chargé. Redirection...', 'error');
            window.location.href = '../community/feed-setup.html';
            return false;
        }
        
        currentProfileData = { ...currentProfile };
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
        { href: 'settings-msg.html', icon: 'fa-cog', text: 'Paramètres' }
    ];
    nav.innerHTML = links.map(link => `
        <a href="${link.href}">
            <i class="fas ${link.icon}"></i>
            <span>${link.text}</span>
        </a>
    `).join('');
}
// ========== FIN : SIDEBAR ==========

// ========== DEBUT : CHARGEMENT DU PROFIL ==========
async function loadUserProfile() {
    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_profiles')
            .select('*')
            .eq('hubisoccer_id', currentProfile.hubisoccer_id)
            .single();
        if (error) throw error;
        currentProfileData = data;

        // Remplir l'interface
        document.getElementById('displayName').textContent = data.full_name || data.display_name || 'Utilisateur';
        document.getElementById('userHandle').textContent = data.feed_id ? '@' + data.feed_id : '@' + data.hubisoccer_id.substring(0, 8);
        updateAvatarDisplay(data.avatar_url, data.full_name || data.display_name, 'profileAvatar', 'profileAvatarInitials');
        if (data.cover_url) {
            document.getElementById('coverImg').src = data.cover_url;
        }
        document.getElementById('bioInput').value = data.bio || '';
        document.getElementById('phoneInput').value = data.phone || '';
        document.getElementById('emailInput').value = data.email || '';
        document.getElementById('locationInput').value = data.city || '';

        // Statut en ligne (dépend de la présence)
        updateOnlineStatus();

        // Confidentialité (stocké dans user_settings ou profiles)
        const settings = await loadUserMsgSettings();
        document.getElementById('showLastSeen').checked = settings.showLastSeen !== false;
        document.getElementById('onlineStatusVisibility').value = settings.onlineVisibility || 'everyone';
    } catch (err) {
        toast('Erreur de chargement du profil', 'error');
    }
}

async function loadUserMsgSettings() {
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_user_msg_settings')
            .select('settings')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .maybeSingle();
        return data?.settings || {};
    } catch {
        return {};
    }
}

async function saveUserMsgSettings(settings) {
    await sb
        .from('supabaseAuthPrive_user_msg_settings')
        .upsert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            settings,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_hubisoccer_id' });
}

function updateOnlineStatus() {
    // À connecter avec la présence Realtime (pour l'instant statique)
    const isOnline = onlineUsers?.has(currentProfile.hubisoccer_id) || false;
    document.getElementById('statusText').textContent = isOnline ? 'En ligne' : 'Hors ligne';
}
// ========== FIN : CHARGEMENT DU PROFIL ==========

// ========== DEBUT : UPLOAD AVATAR / COVER ==========
function setupFileUploads() {
    document.getElementById('editAvatarBtn').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    document.getElementById('avatarInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pendingAvatarFile = file;
        // Prévisualisation
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('profileAvatar').src = ev.target.result;
            document.getElementById('profileAvatar').style.display = 'block';
            document.getElementById('profileAvatarInitials').style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('editCoverBtn').addEventListener('click', () => {
        document.getElementById('coverInput').click();
    });
    document.getElementById('coverInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pendingCoverFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('coverImg').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadAvatarIfNeeded() {
    if (!pendingAvatarFile) return currentProfileData.avatar_url;
    const fileName = `avatars/${currentProfile.hubisoccer_id}_${Date.now()}.${pendingAvatarFile.name.split('.').pop()}`;
    const { error } = await sb.storage.from('profiles').upload(fileName, pendingAvatarFile, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from('profiles').getPublicUrl(fileName);
    return data.publicUrl;
}

async function uploadCoverIfNeeded() {
    if (!pendingCoverFile) return currentProfileData.cover_url;
    const fileName = `covers/${currentProfile.hubisoccer_id}_${Date.now()}.${pendingCoverFile.name.split('.').pop()}`;
    const { error } = await sb.storage.from('profiles').upload(fileName, pendingCoverFile, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from('profiles').getPublicUrl(fileName);
    return data.publicUrl;
}
// ========== FIN : UPLOAD ==========

// ========== DEBUT : SAUVEGARDE PROFIL ==========
async function saveProfile() {
    setLoader(true, 'Enregistrement...');
    try {
        const avatarUrl = await uploadAvatarIfNeeded();
        const coverUrl = await uploadCoverIfNeeded();

        const updates = {
            bio: document.getElementById('bioInput').value.trim(),
            phone: document.getElementById('phoneInput').value.trim(),
            city: document.getElementById('locationInput').value.trim(),
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            updated_at: new Date().toISOString()
        };

        const { error } = await sb
            .from('supabaseAuthPrive_profiles')
            .update(updates)
            .eq('hubisoccer_id', currentProfile.hubisoccer_id);

        if (error) throw error;

        // Sauvegarder les paramètres de confidentialité
        await saveUserMsgSettings({
            showLastSeen: document.getElementById('showLastSeen').checked,
            onlineVisibility: document.getElementById('onlineStatusVisibility').value
        });

        toast('Profil mis à jour avec succès', 'success');
        pendingAvatarFile = null;
        pendingCoverFile = null;
        await loadUserProfile();
    } catch (err) {
        toast('Erreur lors de la sauvegarde : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}
// ========== FIN : SAUVEGARDE ==========

// ========== DEBUT : STATISTIQUES ==========
async function calculateStats() {
    try {
        // Nombre de messages envoyés
        const { count: msgCount } = await sb
            .from('supabaseAuthPrive_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

        // Nombre de conversations
        const { count: convCount } = await sb
            .from('supabaseAuthPrive_conversation_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

        // Stockage utilisé
        let storageUsed = 0;
        try {
            const { data } = await sb.storage.from('message_attachments').list(currentProfile.hubisoccer_id);
            data?.forEach(file => storageUsed += file.metadata?.size || 0);
        } catch {}

        document.getElementById('totalMessages').textContent = msgCount || 0;
        document.getElementById('totalConversations').textContent = convCount || 0;
        document.getElementById('storageUsed').textContent = (storageUsed / (1024 * 1024)).toFixed(2) + ' Mo';
    } catch (err) {
        console.warn('Erreur calcul stats', err);
    }
}
// ========== FIN : STATISTIQUES ==========

// ========== DEBUT : EXPORT & SUPPRESSION ==========
async function exportUserData() {
    try {
        const { data: convs } = await sb
            .from('supabaseAuthPrive_conversations')
            .select(`
                id, is_group, group_name, created_at,
                participants:supabaseAuthPrive_conversation_participants(user_hubisoccer_id)
            `)
            .in('id', sb.from('supabaseAuthPrive_conversation_participants').select('conversation_id').eq('user_hubisoccer_id', currentProfile.hubisoccer_id));

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
        a.download = `hubisoccer_profile_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Export réussi', 'success');
    } catch (err) {
        toast('Erreur export', 'error');
    }
}

async function deleteAllConversations() {
    if (!confirm('Supprimer TOUTES vos conversations et messages ? Cette action est irréversible.')) return;

    setLoader(true, 'Suppression...');
    try {
        // Récupérer toutes les conversations de l'utilisateur
        const { data: participations } = await sb
            .from('supabaseAuthPrive_conversation_participants')
            .select('conversation_id')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        const convIds = (participations || []).map(p => p.conversation_id);

        // Supprimer les messages
        if (convIds.length) {
            await sb.from('supabaseAuthPrive_messages').delete().in('conversation_id', convIds);
            // Supprimer les participations
            await sb.from('supabaseAuthPrive_conversation_participants').delete().in('conversation_id', convIds);
            // Supprimer les conversations vides
            await sb.from('supabaseAuthPrive_conversations').delete().in('id', convIds);
        }

        toast('Toutes vos conversations ont été supprimées', 'success');
        calculateStats();
    } catch (err) {
        toast('Erreur suppression', 'error');
    } finally {
        setLoader(false);
    }
}
// ========== FIN : EXPORT & SUPPRESSION ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement du profil...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    await loadUserProfile();
    await calculateStats();
    setupFileUploads();

    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('exportDataBtn').addEventListener('click', exportUserData);
    document.getElementById('deleteAllConvsBtn').addEventListener('click', deleteAllConversations);
    document.getElementById('setup2FABtn').addEventListener('click', () => {
        toast('Configuration 2FA à venir', 'info');
        // Ici pourrait s'ouvrir une modale de configuration
    });

    // Menu déroulant utilisateur
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropProfile').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `profil-msg.html`;
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