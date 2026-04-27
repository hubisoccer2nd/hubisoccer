// ========== ADMIN-DESIGNER.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

// ========== DÉBUT : UTILITAIRES ==========
function showToast(message, type = 'info', duration = 4000) {
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
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function hashPassword(password) {
    return btoa(password);
}

function generatePassword(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR');
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentUserId = null;
let allUsers = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : CHARGEMENT DES UTILISATEURS ==========
async function loadUsers() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('designer_users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allUsers = data || [];
        renderUsers(allUsers);
        updateStats(allUsers);
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du chargement des utilisateurs.', 'error');
    } finally {
        hideLoader();
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Aucune demande pour le moment.</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(user => {
        const statutClass = `badge-${user.statut === 'en_attente' ? 'pending' : user.statut === 'approuve' ? 'approved' : user.statut === 'rejete' ? 'rejected' : 'blocked'}`;
        const statutLabel = user.statut === 'en_attente' ? 'En attente' : user.statut === 'approuve' ? 'Approuvé' : user.statut === 'rejete' ? 'Rejeté' : 'Bloqué';
        return `
            <tr>
                <td>${escapeHtml(user.id.substring(0, 8))}...</td>
                <td>${escapeHtml(user.nom)}</td>
                <td>${escapeHtml(user.prenom)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.telephone)}</td>
                <td>${formatDateTime(user.created_at)}</td>
                <td><span class="badge ${statutClass}">${statutLabel}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-view" onclick="viewUser('${user.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-action btn-approve" onclick="openApproveModal('${user.id}')"><i class="fas fa-check-circle"></i></button>
                        <button class="btn-action btn-reject" onclick="openRejectModal('${user.id}')"><i class="fas fa-times-circle"></i></button>
                        <button class="btn-action btn-pending" onclick="setPending('${user.id}')"><i class="fas fa-clock"></i></button>
                        <button class="btn-action btn-block" onclick="openBlockModal('${user.id}')"><i class="fas fa-ban"></i></button>
                        <button class="btn-action btn-delete" onclick="openDeleteModal('${user.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats(users) {
    const pending = users.filter(u => u.statut === 'en_attente').length;
    const approved = users.filter(u => u.statut === 'approuve').length;
    const rejected = users.filter(u => u.statut === 'rejete').length;
    const blocked = users.filter(u => u.statut === 'bloque').length;
    const total = users.length;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;
    document.getElementById('statBlocked').textContent = blocked;
    document.getElementById('statDeleted').textContent = total;
}
// ========== FIN : CHARGEMENT DES UTILISATEURS ==========

// ========== DÉBUT : FONCTIONS D'ACTION ==========
async function viewUser(userId) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('designer_users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        document.getElementById('viewContent').innerHTML = `
            <p><strong>Nom :</strong> ${escapeHtml(data.nom)}</p>
            <p><strong>Prénom :</strong> ${escapeHtml(data.prenom)}</p>
            <p><strong>Email :</strong> ${escapeHtml(data.email)}</p>
            <p><strong>Téléphone :</strong> ${escapeHtml(data.telephone)}</p>
            <p><strong>Date d'inscription :</strong> ${formatDateTime(data.created_at)}</p>
            <p><strong>Statut :</strong> ${data.statut}</p>
            <p><strong>Commentaire admin :</strong> ${data.commentaire_admin || '-'}</p>
        `;
        document.getElementById('viewModal').classList.add('active');
    } catch (err) {
        showToast('Erreur visualisation.', 'error');
    } finally {
        hideLoader();
    }
}

function openApproveModal(userId) {
    currentUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    const login = (user.prenom + '.' + user.nom).toLowerCase().replace(/ /g, '');
    const password = generatePassword(8);
    document.getElementById('approveInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(user.nom)} ${escapeHtml(user.prenom)}</p>
        <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
    `;
    document.getElementById('approveLogin').value = login;
    document.getElementById('approvePassword').value = password;
    document.getElementById('approveModal').classList.add('active');
}

async function confirmApprove() {
    const login = document.getElementById('approveLogin').value;
    const password = document.getElementById('approvePassword').value;
    if (!login || !password) {
        showToast('Login et mot de passe requis.', 'warning');
        return;
    }
    showLoader();
    try {
        const passwordHash = hashPassword(password);
        // Mise à jour du statut et enregistrement du login/mdp hashé
        const { error } = await supabaseAdmin
            .from('designer_users')
            .update({
                statut: 'approuve',
                mot_de_passe_hash: passwordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);
        if (error) throw error;

        // Envoi d'un message privé (notification)
        await supabaseAdmin.from('public_messages_prives').insert([{
            expediteur_id: 'admin',
            destinataire_id: currentUserId,
            sujet: 'Compte Designer validé',
            contenu: `Félicitations ! Votre compte HubISoccer Designer a été approuvé.\n\nIdentifiants de connexion :\nLogin : ${login}\nMot de passe : ${password}\n\nConnectez-vous sur la page Designer.`,
            lu: false,
            created_at: new Date().toISOString()
        }]);

        showToast('Compte approuvé. Identifiants envoyés.', 'success');
        document.getElementById('approveModal').classList.remove('active');
        loadUsers();
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la validation.', 'error');
    } finally {
        hideLoader();
    }
}

function openRejectModal(userId) {
    currentUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('rejectInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(user.nom)} ${escapeHtml(user.prenom)}</p>
        <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
    `;
    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectModal').classList.add('active');
}

async function confirmReject() {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) {
        showToast('Veuillez indiquer un motif.', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('designer_users')
            .update({
                statut: 'rejete',
                commentaire_admin: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);
        if (error) throw error;

        await supabaseAdmin.from('public_messages_prives').insert([{
            expediteur_id: 'admin',
            destinataire_id: currentUserId,
            sujet: 'Compte Designer rejeté',
            contenu: `Votre demande de compte Designer a été rejetée.\nMotif : ${reason}`,
            lu: false,
            created_at: new Date().toISOString()
        }]);

        showToast('Compte rejeté.', 'success');
        document.getElementById('rejectModal').classList.remove('active');
        loadUsers();
    } catch (err) {
        showToast('Erreur rejet.', 'error');
    } finally {
        hideLoader();
    }
}

async function setPending(userId) {
    if (!confirm('Remettre ce compte en attente ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('designer_users')
            .update({ statut: 'en_attente', updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (error) throw error;
        showToast('Compte remis en attente.', 'success');
        loadUsers();
    } catch (err) {
        showToast('Erreur.', 'error');
    } finally {
        hideLoader();
    }
}

function openBlockModal(userId) {
    currentUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('blockInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(user.nom)} ${escapeHtml(user.prenom)}</p>
        <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
    `;
    document.getElementById('blockModal').classList.add('active');
}

async function confirmBlock() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('designer_users')
            .update({ statut: 'bloque', updated_at: new Date().toISOString() })
            .eq('id', currentUserId);
        if (error) throw error;
        showToast('Compte bloqué.', 'success');
        document.getElementById('blockModal').classList.remove('active');
        loadUsers();
    } catch (err) {
        showToast('Erreur blocage.', 'error');
    } finally {
        hideLoader();
    }
}

function openDeleteModal(userId) {
    currentUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('deleteInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(user.nom)} ${escapeHtml(user.prenom)}</p>
        <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
    `;
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('designer_users')
            .delete()
            .eq('id', currentUserId);
        if (error) throw error;
        showToast('Compte supprimé définitivement.', 'success');
        document.getElementById('deleteModal').classList.remove('active');
        loadUsers();
    } catch (err) {
        showToast('Erreur suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : FONCTIONS D'ACTION ==========

// ========== DÉBUT : ÉCOUTEURS MODALES ET BOUTONS ==========
document.getElementById('confirmApproveBtn').addEventListener('click', confirmApprove);
document.getElementById('confirmRejectBtn').addEventListener('click', confirmReject);
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlock);

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.getElementById('refreshBtn').addEventListener('click', loadUsers);

// ========== FIN : ÉCOUTEURS MODALES ET BOUTONS ==========

// ========== DÉBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('open');
});
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('open');
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Déconnexion (à implémenter).', 'info');
    });
}
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', loadUsers);
// ========== FIN DE ADMIN-DESIGNER.JS ==========
