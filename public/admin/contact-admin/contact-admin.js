// ========== CONTACT-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentFilter = 'all';

async function loadMessages() {
  const container = document.getElementById('messagesList');
  container.innerHTML = '<div class="loader">Chargement...</div>';
  let query = supabaseAdmin.from('public_contact_messages').select('*').order('created_at', { ascending: false });
  if (currentFilter === 'unread') {
    query = query.eq('lu', false);
  }
  const { data, error } = await query;
  if (error) {
    console.error(error);
    container.innerHTML = '<p class="no-data">Erreur de chargement.</p>';
    return;
  }
  if (!data || data.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun message.</p>';
    return;
  }
  let html = '';
  data.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleString('fr-FR');
    html += `
            <div class="message-card ${!msg.lu ? 'unread' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <div class="message-sender">
                        <strong>${escapeHtml(msg.nom)}</strong>
                        <small>${escapeHtml(msg.email)} - ${date}</small>
                    </div>
                    <div class="message-actions">
                        ${!msg.lu ? `<button class="btn-mark-read" onclick="markAsRead(${msg.id})">Marquer comme lu</button>` : ''}
                        <button class="btn-delete" onclick="deleteMessage(${msg.id})">Supprimer</button>
                    </div>
                </div>
                <div class="message-body">
                    <div class="message-subject">${escapeHtml(msg.sujet)}</div>
                    <div class="message-text">${escapeHtml(msg.message).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
}

window.markAsRead = async (id) => {
  const { error } = await supabaseAdmin.from('public_contact_messages').update({ lu: true }).eq('id', id);
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    loadMessages();
  }
};

window.deleteMessage = async (id) => {
  if (!confirm('Supprimer ce message définitivement ?')) return;
  const { error } = await supabaseAdmin.from('public_contact_messages').delete().eq('id', id);
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    loadMessages();
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

document.getElementById('showAll').addEventListener('click', () => {
  currentFilter = 'all';
  document.getElementById('showAll').classList.add('active');
  document.getElementById('showUnread').classList.remove('active');
  loadMessages();
});
document.getElementById('showUnread').addEventListener('click', () => {
  currentFilter = 'unread';
  document.getElementById('showUnread').classList.add('active');
  document.getElementById('showAll').classList.remove('active');
  loadMessages();
});
document.getElementById('refreshBtn').addEventListener('click', loadMessages);

// Déconnexion désactivée pour le développement (commentée)
// document.getElementById('logoutBtn')?.addEventListener('click', async () => {
//     await supabaseAdmin.auth.signOut();
//     window.location.href = '../administration.html';
// });

loadMessages();