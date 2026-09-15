/* DEBUT : public/admin/contact-admin/contact-admin.js */
// ========== CONTACT-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Éléments DOM
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 3000);
}

// ========== GESTION DES MESSAGES ==========
const messagesBody = document.getElementById('messagesBody');

async function loadMessages() {
    if (!messagesBody) return;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderMessages(data || []);
    } catch (err) { showToast('Erreur chargement messages', 'error'); } finally { hideLoader(); }
}

function renderMessages(messages) {
    if (!messagesBody) return;
    if (messages.length === 0) {
        messagesBody.innerHTML = '<tr><td colspan="6">Aucun message.</td></tr>';
        return;
    }
    messagesBody.innerHTML = messages.map(msg => `
        <tr>
            <td>${new Date(msg.created_at).toLocaleString('fr-FR')}</td>
            <td>${escapeHtml(msg.nom)}</td>
            <td>${escapeHtml(msg.email)}</td>
            <td>${escapeHtml(msg.sujet)}</td>
            <td>${escapeHtml(msg.message)}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-delete" data-id="${msg.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    messagesBody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteMessage(btn.dataset.id)));
}

async function deleteMessage(id) {
    if (!confirm('Supprimer ce message ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_contact_messages').delete().eq('id', id);
        if (error) throw error;
        showToast('Message supprimé', 'success');
        loadMessages();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

// ========== MENU MOBILE & DÉCONNEXION ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) { navLinks.classList.remove('active'); menuToggle.classList.remove('open'); } });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../../../';
    });
}

// ========== INITIALISATION ==========
loadMessages();
/* FIN : public/admin/contact-admin/contact-admin.js */