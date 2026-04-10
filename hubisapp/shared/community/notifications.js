// ============================================================
//  HUBISOCCER — NOTIFICATIONS.JS
//  Page des notifications
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
let notifications     = [];
let offset            = 0;
const PAGE_SIZE       = 20;
let hasMore           = false;
let isLoading         = false;
let activeFilter      = 'all';
let notificationChannel = null;
// Fin état global

// Début mapping rôles
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};
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

// Début chargement des notifications
async function loadNotifications(reset = false) {
    if (isLoading) return;
    isLoading = true;

    if (reset) {
        offset = 0;
        notifications = [];
        document.getElementById('notificationsList').innerHTML = `
            <div class="notification-skeleton"></div>
            <div class="notification-skeleton"></div>
            <div class="notification-skeleton"></div>
        `;
    }

    try {
        let query = sb
            .from('supabaseAuthPrive_notifications')
            .select('*', { count: 'exact' })
            .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (activeFilter === 'unread') {
            query = query.eq('read', false);
        } else if (activeFilter !== 'all') {
            query = query.eq('type', activeFilter);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        hasMore = (offset + (data?.length || 0)) < (count || 0);
        offset += data?.length || 0;

        if (reset) {
            notifications = data || [];
        } else {
            notifications = [...notifications, ...(data || [])];
        }

        renderNotifications();
    } catch (err) {
        console.error('Erreur chargement notifications:', err);
        toast('Erreur lors du chargement', 'error');
    } finally {
        isLoading = false;
    }
}

function renderNotifications() {
    const listEl = document.getElementById('notificationsList');
    const emptyEl = document.getElementById('notificationsEmpty');
    const loadMoreWrap = document.getElementById('loadMoreWrap');

    if (notifications.length === 0) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'flex';
        loadMoreWrap.style.display = 'none';
        return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = notifications.map(n => makeNotificationCard(n)).join('');
    loadMoreWrap.style.display = hasMore ? 'block' : 'none';

    // Attacher les événements de clic
    document.querySelectorAll('.notification-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (!e.target.closest('.notif-action-btn')) {
                handleNotificationClick(el.dataset.id, el.dataset.link, el.dataset.read === 'false');
            }
        });
    });
}

function makeNotificationCard(notif) {
    const isRead = notif.read;
    const time = timeSince(notif.created_at);
    const iconMap = {
        like: 'fa-heart',
        comment: 'fa-comment',
        follow: 'fa-user-plus',
        live: 'fa-video',
        reply: 'fa-reply',
        system: 'fa-bullhorn',
        coins_received: 'fa-coins'
    };
    const icon = iconMap[notif.type] || 'fa-bell';
    const iconColor = notif.type === 'like' ? 'var(--danger)' : 
                      notif.type === 'live' ? 'var(--live-red)' : 
                      notif.type === 'coins_received' ? 'var(--gold)' : 'var(--primary)';

    return `
        <div class="notification-item ${isRead ? '' : 'unread'}" 
             data-id="${notif.id}" 
             data-link="${notif.data?.link || ''}" 
             data-read="${isRead}">
            <div class="notif-icon" style="background:${iconColor}10; color:${iconColor}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-title">${escapeHtml(notif.title || 'Notification')}</div>
                <div class="notif-message">${escapeHtml(notif.message || '')}</div>
                <div class="notif-time">${time}</div>
            </div>
            <div class="notif-actions">
                ${!isRead ? `<button class="notif-action-btn" onclick="event.stopPropagation(); markAsRead('${notif.id}')" title="Marquer comme lu"><i class="fas fa-check"></i></button>` : ''}
                <button class="notif-action-btn" onclick="event.stopPropagation(); deleteNotification('${notif.id}')" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `;
}

function handleNotificationClick(id, link, isUnread) {
    if (isUnread) {
        markAsRead(id, false);
    }
    if (link) {
        window.location.href = link;
    }
}

async function markAsRead(notificationId, refresh = true) {
    try {
        await sb.from('supabaseAuthPrive_notifications')
            .update({ read: true })
            .eq('id', notificationId);
        
        const notif = notifications.find(n => n.id === notificationId);
        if (notif) notif.read = true;
        
        if (refresh) {
            renderNotifications();
        }
    } catch (err) {
        toast('Erreur lors du marquage', 'error');
    }
}

async function markAllAsRead() {
    try {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) {
            toast('Aucune notification non lue', 'info');
            return;
        }

        await sb.from('supabaseAuthPrive_notifications')
            .update({ read: true })
            .in('id', unreadIds);

        notifications.forEach(n => n.read = true);
        renderNotifications();
        toast(`${unreadIds.length} notification(s) marquée(s) comme lue(s)`, 'success');
    } catch (err) {
        toast('Erreur lors du marquage', 'error');
    }
}

async function deleteNotification(notificationId) {
    try {
        await sb.from('supabaseAuthPrive_notifications')
            .delete()
            .eq('id', notificationId);

        notifications = notifications.filter(n => n.id !== notificationId);
        renderNotifications();
        toast('Notification supprimée', 'success');
    } catch (err) {
        toast('Erreur lors de la suppression', 'error');
    }
}

async function clearAllNotifications() {
    if (!confirm('Supprimer toutes vos notifications ? Cette action est irréversible.')) return;

    try {
        await sb.from('supabaseAuthPrive_notifications')
            .delete()
            .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id);

        notifications = [];
        offset = 0;
        hasMore = false;
        renderNotifications();
        toast('Toutes les notifications ont été supprimées', 'success');
    } catch (err) {
        toast('Erreur lors de la suppression', 'error');
    }
}

function subscribeToNotifications() {
    notificationChannel = sb
        .channel('notifications_channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_notifications', filter: `recipient_hubisoccer_id=eq.${currentProfile.hubisoccer_id}` },
            (payload) => {
                const newNotif = payload.new;
                notifications.unshift(newNotif);
                renderNotifications();
                toast(newNotif.message || 'Nouvelle notification', 'info', 5000);
            }
        )
        .subscribe();
}

function updateActiveFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    loadNotifications(true);
}
// Fin chargement des notifications

// Début initialisation
async function init() {
    setLoader(true, 'Chargement du profil...', 30);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    setLoader(true, 'Chargement des notifications...', 70);
    await loadNotifications(true);
    subscribeToNotifications();
    setLoader(false);

    // Event listeners
    document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllNotifications);
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadNotifications(false));

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => updateActiveFilter(chip.dataset.filter));
    });

    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    // Nettoyage à la fermeture
    window.addEventListener('beforeunload', () => {
        notificationChannel?.unsubscribe();
    });
}

// Exposer fonctions globales
window.markAsRead = markAsRead;
window.deleteNotification = deleteNotification;

document.addEventListener('DOMContentLoaded', init);
// Fin initialisation