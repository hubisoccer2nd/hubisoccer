// ============================================================
//  HUBISOCCER — NOTIFICATIONS.JS (VERSION CORRIGÉE)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

let notifications = [];
let offset = 0;
const PAGE_SIZE = 20;
let hasMore = false;
let loading = false;
let activeFilter = 'all';

// ========== DEBUT : LIENS VERS LES ESPACES PRIVES ==========
//
// La table « role_code -> tableau de bord » qui se trouvait ici a ete
// supprimee : elle pointait vers des dossiers absents du depot
// (agent_fifa, tennisman, athlete, handballeur, formateur...) et son
// repli '../../index.html' n'existe pas non plus. Chaque entree du
// menu renvoyait donc une erreur 404.
//
// role-nav.js, charge par notifications.html juste avant ce fichier, fournit
// les liens verifies : getRoleHome / getRoleLabel / getRoleMenu /
// applyRoleLinks.
//
// ========== FIN : LIENS VERS LES ESPACES PRIVES ==========

async function initSessionAndProfile() {
  const auth = await requireAuth();
  if (!auth) return false;
  
  document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
  updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name);
  
  // Liens vers l'espace prive du role : logo, « Tableau de bord »,
  // bouton de retour. Chemins verifies par role-nav.js.
  if (typeof applyRoleLinks === 'function') {
      applyRoleLinks(currentProfile.role_code);
  } else {
      const dd = document.getElementById('dropDashboard');
      if (dd) dd.href = '../construction.html';
  }
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

async function loadNotifications(reset = false) {
  if (loading) return;
  loading = true;
  
  if (reset) {
    offset = 0;
    notifications = [];
    document.getElementById('notificationsList').innerHTML = '';
  }
  
  const skeleton = document.querySelector('.notification-skeleton');
  if (skeleton) skeleton.style.display = 'flex';
  
  try {
    let query = sb.from('supabaseAuthPrive_notifications')
      .select('*')
      .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (activeFilter === 'unread') {
      query = query.eq('read', false);
    } else if (activeFilter !== 'all') {
      query = query.eq('type', activeFilter);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    hasMore = data.length === PAGE_SIZE;
    offset += data.length;
    
    if (reset) notifications = data;
    else notifications = [...notifications, ...data];
    
    renderNotifications();
    document.getElementById('loadMoreWrap').style.display = hasMore ? 'block' : 'none';
  } catch (err) {
    console.error('Erreur chargement notifications:', err);
    toast('Erreur lors du chargement des notifications', 'error');
  } finally {
    loading = false;
    if (skeleton) skeleton.style.display = 'none';
  }
}

function renderNotifications() {
  const list = document.getElementById('notificationsList');
  const empty = document.getElementById('notificationsEmpty');
  
  if (notifications.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  
  empty.style.display = 'none';
  list.innerHTML = notifications.map(n => makeNotificationItem(n)).join('');
}

function makeNotificationItem(n) {
  const iconMap = {
    like: { icon: 'fa-heart', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    comment: { icon: 'fa-comment', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    follow: { icon: 'fa-user-plus', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    live: { icon: 'fa-broadcast-tower', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    system: { icon: 'fa-bell', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    reply: { icon: 'fa-reply', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    coins_received: { icon: 'fa-coins', color: '#e6b800', bg: 'rgba(255,204,0,0.15)' }
  };
  const config = iconMap[n.type] || iconMap.system;
  const timeStr = timeSince(n.created_at);
  const readClass = n.read ? '' : 'unread';
  
  return `
        <div class="notification-item ${readClass}" data-id="${n.id}" onclick="handleNotificationClick('${escapeAttr(n.id)}', '${escapeAttr(n.data?.link || '')}', ${!!n.read})">
            <div class="notif-icon" style="background:${config.bg}; color:${config.color}">
                <i class="fas ${config.icon}"></i>
            </div>
            <div class="notif-content">
                <div class="notif-title">${escapeHtml(n.title || 'Notification')}</div>
                <div class="notif-message">${escapeHtml(n.message || '')}</div>
                <div class="notif-time">${timeStr}</div>
            </div>
            <div class="notif-actions">
                <button class="notif-action-btn" onclick="event.stopPropagation(); markAsRead('${n.id}')" title="Marquer comme lu">
                    <i class="fas fa-check"></i>
                </button>
                <button class="notif-action-btn" onclick="event.stopPropagation(); deleteNotification('${n.id}')" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
}

async function handleNotificationClick(id, link, read) {
  if (!read) {
    await markAsRead(id);
  }
  if (link) {
    window.location.href = link;
  }
}
window.handleNotificationClick = handleNotificationClick;

async function markAsRead(id) {
  await sb.from('supabaseAuthPrive_notifications').update({ read: true }).eq('id', id);
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    notifications[idx].read = true;
    renderNotifications();
  }
}
window.markAsRead = markAsRead;

async function deleteNotification(id) {
  await sb.from('supabaseAuthPrive_notifications').delete().eq('id', id);
  notifications = notifications.filter(n => n.id !== id);
  renderNotifications();
  toast('Notification supprimée', 'info');
}
window.deleteNotification = deleteNotification;

async function markAllAsRead() {
  await sb.from('supabaseAuthPrive_notifications')
    .update({ read: true })
    .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
    .eq('read', false);
  notifications.forEach(n => n.read = true);
  renderNotifications();
  toast('Toutes les notifications sont marquées comme lues', 'success');
}

async function clearAll() {
  if (!confirm('Supprimer toutes vos notifications ?')) return;
  await sb.from('supabaseAuthPrive_notifications')
    .delete()
    .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id);
  notifications = [];
  renderNotifications();
  toast('Toutes les notifications ont été supprimées', 'success');
}

function initFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      loadNotifications(true);
    });
  });
}

// ========== DEBUT : TEMPS RÉEL ==========
let notifChannel = null;

function subscribeToNotifications() {
    if (notifChannel) notifChannel.unsubscribe();
    notifChannel = sb.channel('notifications_live')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'supabaseAuthPrive_notifications',
            filter: `recipient_hubisoccer_id=eq.${currentProfile.hubisoccer_id}`
        }, (payload) => {
            const n = payload.new;
            // Respecte le filtre actif
            if (activeFilter === 'unread' && n.read) return;
            if (activeFilter !== 'all' && activeFilter !== 'unread' && n.type !== activeFilter) return;
            notifications.unshift(n);
            renderNotifications();
            playNotifSound();
        })
        .subscribe();
}

function playNotifSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* son facultatif */ }
}
// ========== FIN : TEMPS RÉEL ==========

async function init() {
  setLoader(true, 'Vérification de votre session...');
  const sessionOk = await initSessionAndProfile();
  if (!sessionOk) return;
  
  setLoader(true, 'Chargement des notifications...');
  await loadNotifications(true);
  setLoader(false);
  
  initFilters();
  subscribeToNotifications();
  
  document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);
  document.getElementById('loadMoreBtn').addEventListener('click', () => loadNotifications(false));
  
  document.getElementById('userMenu').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('show');
  });
  document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
  document.getElementById('dropLogout').addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', init);