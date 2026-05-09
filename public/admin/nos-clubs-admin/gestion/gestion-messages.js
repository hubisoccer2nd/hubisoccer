// ========== GESTION-MESSAGES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allMessages = [];
let allClubs = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'info', duration = 15000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR');
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES CLUBS ==========
async function loadClubs() {
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_clubs')
            .select('id, nom')
            .order('nom', { ascending: true });
        if (error) throw error;
        allClubs = data || [];
        populateClubFilter();
    } catch (err) {
        console.error(err);
    }
}

function populateClubFilter() {
    const select = document.getElementById('clubFilter');
    if (!select) return;
    select.innerHTML = '<option value="all">Tous les clubs</option>';
    allClubs.forEach(club => {
        select.innerHTML += `<option value="${club.id}">${escapeHtml(club.nom)}</option>`;
    });
}
// ========== FIN : CHARGEMENT DES CLUBS ==========

// ========== DÉBUT : CHARGEMENT DES MESSAGES ==========
async function loadMessages() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_messages')
            .select('*, nosclub_clubs(nom)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allMessages = data || [];
        renderMessagesTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement messages', 'error');
    } finally {
        hideLoader();
    }
}

function getFilteredMessages() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const clubId = document.getElementById('clubFilter').value;
    const sender = document.getElementById('senderFilter').value;

    return allMessages.filter(msg => {
        const clubNom = msg.nosclub_clubs?.nom || '';
        const contenu = msg.contenu || '';
        const matchSearch = clubNom.toLowerCase().includes(search) || contenu.toLowerCase().includes(search);
        const matchClub = clubId === 'all' || msg.club_id == clubId;
        const matchSender = sender === 'all' || msg.expediteur_id === sender ||
            (sender === 'talent' && msg.expediteur_id && msg.expediteur_id.startsWith('talent_'));
        return matchSearch && matchClub && matchSender;
    });
}

function renderMessagesTable() {
    const tbody = document.getElementById('messagesBody');
    if (!tbody) return;
    const filtered = getFilteredMessages();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Aucun message trouvé.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(msg => {
        const clubNom = msg.nosclub_clubs?.nom || 'Inconnu';
        let senderLabel = 'Talent';
        if (msg.expediteur_id === 'admin') senderLabel = 'Admin';
        else if (msg.expediteur_id === 'coach') senderLabel = 'Coach';
        else if (msg.expediteur_id === 'parrain') senderLabel = 'Parrain';
        else if (msg.expediteur_id && msg.expediteur_id.startsWith('talent_')) senderLabel = 'Talent';

        // Tronquer le message pour l'affichage dans le tableau
        const preview = msg.contenu ? msg.contenu.replace(/<[^>]*>/g, '').substring(0, 100) + (msg.contenu.length > 100 ? '...' : '') : '';

        return `
            <tr data-id="${msg.id}">
                <td>${formatDateTime(msg.created_at)}</td>
                <td>${escapeHtml(clubNom)}</td>
                <td>${senderLabel}</td>
                <td class="message-preview">${escapeHtml(preview)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-delete" data-id="${msg.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteMessage(btn.dataset.id)));
}
// ========== FIN : CHARGEMENT DES MESSAGES ==========

// ========== DÉBUT : SUPPRESSION DE MESSAGE ==========
async function deleteMessage(id) {
    if (!confirm('Supprimer définitivement ce message ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_messages')
            .delete()
            .eq('id', id);
        if (error) throw error;
        allMessages = allMessages.filter(m => m.id != id);
        renderMessagesTable();
        showToast('Message supprimé avec succès.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : SUPPRESSION DE MESSAGE ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ==========
document.getElementById('searchInput').addEventListener('input', renderMessagesTable);
document.getElementById('clubFilter').addEventListener('change', renderMessagesTable);
document.getElementById('senderFilter').addEventListener('change', renderMessagesTable);
// ========== FIN : ÉVÉNEMENTS FILTRES ==========

// ========== DÉBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active'); menuToggle.classList.remove('open');
        }
    });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Déconnexion (à implémenter)', 'info');
    });
}
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadClubs().then(() => loadMessages());
});
// ========== FIN DE GESTION-MESSAGES.JS ==========
