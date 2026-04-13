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
        <div class="notification-item ${readClass}" data-id="${n.id}" onclick="handleNotificationClick('${n.id}', '${n.data?.link || ''}', ${n.read})">
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

async function init() {
  setLoader(true, 'Vérification de votre session...');
  const sessionOk = await initSessionAndProfile();
  if (!sessionOk) return;
  
  setLoader(true, 'Chargement des notifications...');
  await loadNotifications(true);
  setLoader(false);
  
  initFilters();
  
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