// ========== ACTEURS-ADMIN.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allInscriptions = [];
let currentInscription = null;
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');
const tableBody = document.getElementById('tableBody');
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function showToast(message, type = 'info', duration = 3000) {
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getRoleLabel(code) {
    const labels = { PR: 'Parrain', ST: 'Staff médical', CO: 'Coach', AG: 'Agent', AC: 'Académie', CL: 'Club', FO: 'Formateur' };
    return labels[code] || code;
}

function getStatusLabel(status) {
    const labels = {
        'en_attente': 'En attente',
        'valide_public': 'Approuvé',
        'rejete': 'Rejeté',
        'bloque': 'Bloqué',
        'supprime': 'Supprimé'
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    return `status-${status}`;
}

function generateLogin(nom) {
    const base = nom.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return base + random;
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

function hashPassword(password) {
    return btoa(password);
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES INSCRIPTIONS ==========
async function loadInscriptions() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_acteur_inscriptions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allInscriptions = data || [];
        renderTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des inscriptions', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : CHARGEMENT DES INSCRIPTIONS ==========

// ========== DÉBUT : MISE À JOUR DES STATISTIQUES ==========
function updateStats() {
    const stats = {
        en_attente: 0,
        valide_public: 0,
        rejete: 0,
        bloque: 0,
        supprime: 0
    };
    allInscriptions.forEach(ins => {
        if (stats[ins.status] !== undefined) stats[ins.status]++;
    });
    document.getElementById('statEnAttente').textContent = stats.en_attente;
    document.getElementById('statApprouve').textContent = stats.valide_public;
    document.getElementById('statRejete').textContent = stats.rejete;
    document.getElementById('statBloque').textContent = stats.bloque;
    document.getElementById('statSupprime').textContent = stats.supprime;
}
// ========== FIN : MISE À JOUR DES STATISTIQUES ==========

// ========== DÉBUT : FILTRAGE ET RENDU DU TABLEAU ==========
function getFilteredInscriptions() {
    const search = searchInput.value.toLowerCase();
    const role = roleFilter.value;
    const status = statusFilter.value;

    return allInscriptions.filter(ins => {
        const matchSearch = 
            ins.full_name.toLowerCase().includes(search) ||
            ins.pp_id.toLowerCase().includes(search) ||
            ins.email.toLowerCase().includes(search);
        const matchRole = role === 'all' || ins.role === role;
        const matchStatus = status === 'all' || ins.status === status;
        return matchSearch && matchRole && matchStatus;
    });
}

function renderTable() {
    if (!tableBody) return;
    const filtered = getFilteredInscriptions();
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">Aucune inscription trouvée</td></tr>';
        return;
    }
    tableBody.innerHTML = filtered.map(ins => `
        <tr data-ppid="${ins.pp_id}">
            <td class="id-cell" title="${escapeHtml(ins.pp_id)}">${escapeHtml(ins.pp_id.substring(0, 10))}...</td>
            <td>${escapeHtml(ins.full_name)}</td>
            <td>${getRoleLabel(ins.role)}</td>
            <td>${escapeHtml(ins.email)}</td>
            <td>${escapeHtml(ins.phone)}</td>
            <td>${formatDate(ins.created_at)}</td>
            <td><span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-ppid="${ins.pp_id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-approve" data-ppid="${ins.pp_id}" title="Approuver"><i class="fas fa-check-circle"></i></button>
                <button class="btn-icon btn-reject" data-ppid="${ins.pp_id}" title="Rejeter"><i class="fas fa-times-circle"></i></button>
                <button class="btn-icon btn-block" data-ppid="${ins.pp_id}" title="Bloquer"><i class="fas fa-ban"></i></button>
                <button class="btn-icon btn-delete" data-ppid="${ins.pp_id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    // Attacher les événements aux boutons
    document.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => openViewModal(btn.dataset.ppid)));
    document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', () => openApproveModal(btn.dataset.ppid)));
    document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', () => openRejectModal(btn.dataset.ppid)));
    document.querySelectorAll('.btn-block').forEach(btn => btn.addEventListener('click', () => openBlockModal(btn.dataset.ppid)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.dataset.ppid)));
}
// ========== FIN : FILTRAGE ET RENDU DU TABLEAU ==========

// ========== DÉBUT : GESTION DES MODALES ==========
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// Modale de visualisation
async function openViewModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    const viewContent = document.getElementById('viewContent');
    let html = `
        <div class="view-details">
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Identité</h4>
                <p><strong>Nom complet :</strong> ${escapeHtml(ins.full_name)}</p>
                <p><strong>Email :</strong> ${escapeHtml(ins.email)}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(ins.phone)}</p>
                <p><strong>Rôle :</strong> ${getRoleLabel(ins.role)}</p>
                <p><strong>ID :</strong> ${escapeHtml(ins.pp_id)}</p>
                <p><strong>Statut :</strong> <span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></p>
                <p><strong>Date de soumission :</strong> ${formatDate(ins.created_at)}</p>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> Justificatif</h4>
                ${ins.document_url ? `<a href="${escapeHtml(ins.document_url)}" target="_blank"><i class="fas fa-download"></i> Télécharger le document</a>` : '<p>Aucun document</p>'}
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-comments"></i> Messagerie</h4>
                <div id="adminMessagesContainer" class="messages-container"></div>
                <div class="message-compose">
                    <textarea id="adminMessageInput" rows="2" placeholder="Votre message..."></textarea>
                    <button id="sendMessageBtn" class="btn-send"><i class="fas fa-paper-plane"></i> Envoyer</button>
                </div>
            </div>
        </div>
    `;
    viewContent.innerHTML = html;

    // Charger les messages
    loadMessages(ins.pp_id);

    // Écouteur d'envoi de message
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);

    document.getElementById('viewModal').classList.add('active');
}

// Chargement des messages
async function loadMessages(ppId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_acteur_messages')
            .select('*')
            .eq('pp_id', ppId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        const container = document.getElementById('adminMessagesContainer');
        if (container) {
            if (data && data.length > 0) {
                container.innerHTML = data.map(msg => `
                    <div class="message ${msg.sender}">
                        <div class="message-bubble">
                            <div>${msg.content}</div>
                            <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="empty-message">Aucun message échangé.</p>';
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// Envoyer un message
async function sendMessage() {
    if (!currentInscription) return;
    const input = document.getElementById('adminMessageInput');
    const message = input.value.trim();
    if (!message) {
        showToast('Message vide', 'warning');
        return;
    }
    try {
        const { error } = await supabaseAdmin
            .from('public_acteur_messages')
            .insert([{
                pp_id: currentInscription.pp_id,
                sender: 'admin',
                content: message,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        input.value = '';
        await loadMessages(currentInscription.pp_id);
        showToast('Message envoyé', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur envoi message', 'error');
    }
}

// Modale d'approbation
function openApproveModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    const login = generateLogin(ins.full_name);
    const password = generatePassword();

    document.getElementById('generatedLogin').value = login;
    document.getElementById('generatedPassword').value = password;
    document.getElementById('approveInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(ins.full_name)}</p>
        <p><strong>Rôle :</strong> ${getRoleLabel(ins.role)}</p>
    `;

    document.getElementById('confirmApprovalBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_acteur_inscriptions')
                .update({
                    status: 'valide_public',
                    login: login,
                    mot_de_passe_hash: hashPassword(password),
                    updated_at: new Date().toISOString()
                })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;

            // Mise à jour locale
            currentInscription.status = 'valide_public';
            currentInscription.login = login;
            currentInscription.mot_de_passe_hash = hashPassword(password);

            showToast('Inscription approuvée !', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) {
            console.error(err);
            showToast('Erreur approbation', 'error');
        } finally {
            hideLoader();
        }
    };

    document.getElementById('approveModal').classList.add('active');
}

// Modale de rejet
function openRejectModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('rejectReason').value = '';
    document.getElementById('confirmRejectBtn').onclick = async () => {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) {
            showToast('Veuillez indiquer un motif', 'warning');
            return;
        }
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_acteur_inscriptions')
                .update({
                    status: 'rejete',
                    role_data: { ... (ins.role_data || {}), motif_rejet: reason },
                    updated_at: new Date().toISOString()
                })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;

            currentInscription.status = 'rejete';
            showToast('Inscription rejetée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) {
            console.error(err);
            showToast('Erreur rejet', 'error');
        } finally {
            hideLoader();
        }
    };

    document.getElementById('rejectModal').classList.add('active');
}

// Modale de blocage
function openBlockModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmBlockBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_acteur_inscriptions')
                .update({ status: 'bloque', updated_at: new Date().toISOString() })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;

            currentInscription.status = 'bloque';
            showToast('Inscription bloquée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) {
            console.error(err);
            showToast('Erreur blocage', 'error');
        } finally {
            hideLoader();
        }
    };

    document.getElementById('blockModal').classList.add('active');
}

// Modale de suppression
function openDeleteModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        showLoader();
        try {
            // Supprimer les messages associés
            await supabaseAdmin.from('public_acteur_messages').delete().eq('pp_id', currentInscription.pp_id);
            // Supprimer l'inscription
            const { error } = await supabaseAdmin
                .from('public_acteur_inscriptions')
                .delete()
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;

            allInscriptions = allInscriptions.filter(i => i.pp_id !== currentInscription.pp_id);
            showToast('Inscription supprimée définitivement', 'success');
            closeAllModals();
            renderTable();
            updateStats();
        } catch (err) {
            console.error(err);
            showToast('Erreur suppression', 'error');
        } finally {
            hideLoader();
        }
    };

    document.getElementById('deleteModal').classList.add('active');
}
// ========== FIN : GESTION DES MODALES ==========

// ========== DÉBUT : FERMETURE DES MODALES ==========
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
});
// ========== FIN : FERMETURE DES MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ET RAFRAÎCHISSEMENT ==========
searchInput.addEventListener('input', renderTable);
roleFilter.addEventListener('change', renderTable);
statusFilter.addEventListener('change', renderTable);
document.getElementById('refreshStatsBtn').addEventListener('click', () => {
    loadInscriptions();
    showToast('Données rafraîchies', 'info');
});
// ========== FIN : ÉVÉNEMENTS ==========

// ========== DÉBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
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
    loadInscriptions();
});
// ========== FIN DE ACTEURS-ADMIN.JS ==========