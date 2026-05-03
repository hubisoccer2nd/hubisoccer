// ========== GESTION-INSCRIPTIONS.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allInscriptions = [];
let allAttentes = [];
let allClubs = [];
let currentInscription = null;
let currentAttente = null;
let uploadedPreuveUrl = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusLabel(status) {
    const labels = {
        'en_attente': 'En attente', 'valide': 'Approuvé', 'rejete': 'Rejeté',
        'bloque': 'Bloqué', 'supprime': 'Supprimé'
    };
    return labels[status] || status;
}

function getStatusClass(status) { return `status-${status}`; }

function generateLogin(nom) {
    const base = nom.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return base + random;
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
}

function hashPassword(password) { return btoa(password); }
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
    } catch (err) { console.error(err); }
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

// ========== DÉBUT : CHARGEMENT DES INSCRIPTIONS ==========
async function loadInscriptions() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_inscriptions')
            .select('*, nosclub_clubs(nom)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allInscriptions = data || [];
        renderInscriptionsTable();
    } catch (err) { showToast('Erreur chargement inscriptions', 'error'); }
    finally { hideLoader(); }
}

function getFilteredInscriptions() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const clubId = document.getElementById('clubFilter').value;
    const status = document.getElementById('statusFilter').value;
    return allInscriptions.filter(ins => {
        const matchSearch = (ins.nom_complet || '').toLowerCase().includes(search) ||
                           (ins.telephone || '').includes(search) ||
                           (ins.email || '').toLowerCase().includes(search);
        const matchClub = clubId === 'all' || ins.club_id == clubId;
        const matchStatus = status === 'all' || ins.statut === status;
        return matchSearch && matchClub && matchStatus;
    });
}

function renderInscriptionsTable() {
    const tbody = document.getElementById('inscriptionsBody');
    if (!tbody) return;
    const filtered = getFilteredInscriptions();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">Aucune inscription.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(ins => {
        const clubNom = ins.nosclub_clubs?.nom || 'Club inconnu';
        const paiementOk = ins.preuve_paiement_url ? '<i class="fas fa-check-circle" style="color:var(--success)"></i>' : '<i class="fas fa-times-circle" style="color:var(--danger)"></i>';
        return `
            <tr data-id="${ins.id}">
                <td class="id-cell">${ins.id}</td>
                <td>${escapeHtml(ins.nom_complet)}</td>
                <td>${escapeHtml(clubNom)}</td>
                <td>${escapeHtml(ins.telephone)}</td>
                <td>${formatDate(ins.created_at)}</td>
                <td><span class="status-badge ${getStatusClass(ins.statut)}">${getStatusLabel(ins.statut)}</span></td>
                <td>${paiementOk}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-view" data-id="${ins.id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-payment" data-id="${ins.id}" title="Preuve de paiement"><i class="fas fa-credit-card"></i></button>
                    ${ins.statut !== 'valide' ? `<button class="btn-icon btn-approve" data-id="${ins.id}" title="Approuver"><i class="fas fa-check-circle"></i></button>` : ''}
                    <button class="btn-icon btn-edit" data-id="${ins.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                    ${ins.statut !== 'rejete' ? `<button class="btn-icon btn-reject" data-id="${ins.id}" title="Rejeter"><i class="fas fa-times-circle"></i></button>` : ''}
                    ${ins.statut !== 'bloque' ? `<button class="btn-icon btn-block" data-id="${ins.id}" title="Bloquer"><i class="fas fa-ban"></i></button>` : ''}
                    <button class="btn-icon btn-delete" data-id="${ins.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-payment').forEach(b => b.addEventListener('click', () => openPaymentModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => openApproveModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openEditModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => openRejectModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-block').forEach(b => b.addEventListener('click', () => openBlockModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => openDeleteModal(b.dataset.id)));
}
// ========== FIN : CHARGEMENT DES INSCRIPTIONS ==========

// ========== DÉBUT : GESTION MODALE VISUALISATION ==========
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

async function openViewModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;

    const viewContent = document.getElementById('viewContent');
    viewContent.innerHTML = `
        <div class="view-details">
            <div class="detail-section"><h4><i class="fas fa-user"></i> Identité</h4>
                <p><strong>Nom :</strong> ${escapeHtml(ins.nom_complet)}</p>
                <p><strong>Date naissance :</strong> ${formatDate(ins.date_naissance)}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(ins.telephone)}</p>
                <p><strong>Email/Réseaux :</strong> ${escapeHtml(ins.email || '-')}</p>
                <p><strong>Ville/Quartier :</strong> ${escapeHtml(ins.ville_quartier || '-')}</p>
                <p><strong>Spécialité :</strong> ${escapeHtml(ins.specialite_poste || '-')}</p>
                <p><strong>Statut :</strong> <span class="status-badge ${getStatusClass(ins.statut)}">${getStatusLabel(ins.statut)}</span></p>
                <p><strong>Preuve de paiement :</strong> ${ins.preuve_paiement_url ? `<a href="${escapeHtml(ins.preuve_paiement_url)}" target="_blank">Télécharger</a>` : 'Non fournie'}</p>
            </div>
            <div class="detail-section"><h4><i class="fas fa-comments"></i> Messagerie</h4>
                <div id="adminMessagesContainer" class="messages-container"></div>
                <div class="message-compose">
                    <textarea id="viewMessageEditor" rows="4" placeholder="Votre message..." style="width:100%; padding:12px; border-radius:12px; border:2px solid var(--light-gray); font-family:'Poppins',sans-serif; font-size:0.9rem; resize:vertical;"></textarea>
                    <button id="sendViewMsgBtn" class="btn-send"><i class="fas fa-paper-plane"></i> Envoyer</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('sendViewMsgBtn').addEventListener('click', sendViewMessage);

    loadMessages(ins.id);
    document.getElementById('viewModal').classList.add('active');
}

async function loadMessages(inscriptionId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_messages')
            .select('*')
            .eq('destinataire_id', inscriptionId.toString())
            .order('created_at', { ascending: true });
        if (error) throw error;
        const container = document.getElementById('adminMessagesContainer');
        if (container) {
            container.innerHTML = data && data.length ? data.map(msg => `
                <div class="message ${msg.expediteur_id === 'admin' ? 'admin' : 'candidate'}">
                    <div class="message-bubble">
                        <div>${msg.contenu}</div>
                        <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                </div>
            `).join('') : '<p class="empty-message">Aucun message.</p>';
        }
    } catch (err) { console.error(err); }
}

async function sendViewMessage() {
    if (!currentInscription) return;
    const contenu = document.getElementById('viewMessageEditor').value.trim();
    if (!contenu) { showToast('Message vide', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_messages')
            .insert([{
                club_id: currentInscription.club_id,
                expediteur_id: 'admin',
                destinataire_id: currentInscription.id.toString(),
                contenu: contenu,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        document.getElementById('viewMessageEditor').value = '';
        await loadMessages(currentInscription.id);
        showToast('Message envoyé', 'success');
    } catch (err) { showToast('Erreur envoi', 'error'); }
    finally { hideLoader(); }
}
// ========== FIN : GESTION MODALE VISUALISATION ==========

// ========== DÉBUT : APPROBATION ==========
function openApproveModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;
    if (!ins.preuve_paiement_url) {
        showToast('La preuve de paiement est obligatoire avant approbation.', 'warning');
        return;
    }

    let login, password;
    if (ins.login) {
        login = ins.login;
        password = '';
        document.getElementById('generatedLogin').value = login;
        document.getElementById('generatedPassword').value = '******** (déjà défini)';
    } else {
        login = generateLogin(ins.nom_complet);
        password = generatePassword();
        document.getElementById('generatedLogin').value = login;
        document.getElementById('generatedPassword').value = password;
    }

    document.getElementById('approveInfo').innerHTML = `<p><strong>Nom :</strong> ${escapeHtml(ins.nom_complet)}</p>`;

    document.getElementById('confirmApprovalBtn').onclick = async () => {
        showLoader();
        try {
            const updateData = { statut: 'valide', updated_at: new Date().toISOString() };
            if (!ins.login) {
                updateData.login = login;
                updateData.mot_de_passe_hash = hashPassword(password);
            }
            const { error } = await supabaseAdmin
                .from('nosclub_inscriptions')
                .update(updateData)
                .eq('id', currentInscription.id);
            if (error) throw error;

            // Incrémenter quota_utilise
            const { data: club } = await supabaseAdmin
                .from('nosclub_clubs')
                .select('quota_utilise')
                .eq('id', currentInscription.club_id)
                .single();
            if (club) {
                await supabaseAdmin
                    .from('nosclub_clubs')
                    .update({ quota_utilise: (club.quota_utilise || 0) + 1 })
                    .eq('id', currentInscription.club_id);
            }

            currentInscription.statut = 'valide';
            if (!ins.login) {
                currentInscription.login = login;
                currentInscription.mot_de_passe_hash = hashPassword(password);
            }
            showToast('Inscription approuvée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) { showToast('Erreur approbation', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('approveModal').classList.add('active');
}
// ========== FIN : APPROBATION ==========

// ========== DÉBUT : REJET ==========
function openRejectModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;
    document.getElementById('rejectReason').value = '';
    document.getElementById('confirmRejectBtn').onclick = async () => {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) { showToast('Motif obligatoire', 'warning'); return; }
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('nosclub_inscriptions')
                .update({ statut: 'rejete', updated_at: new Date().toISOString() })
                .eq('id', currentInscription.id);
            if (error) throw error;
            currentInscription.statut = 'rejete';
            showToast('Inscription rejetée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) { showToast('Erreur rejet', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('rejectModal').classList.add('active');
}
// ========== FIN : REJET ==========

// ========== DÉBUT : MODIFICATION ==========
function openEditModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;
    document.getElementById('editId').value = ins.id;
    document.getElementById('editNom').value = ins.nom_complet || '';
    document.getElementById('editDateNaissance').value = ins.date_naissance || '';
    document.getElementById('editVilleQuartier').value = ins.ville_quartier || '';
    document.getElementById('editTelephone').value = ins.telephone || '';
    document.getElementById('editEmailReseaux').value = ins.email || '';
    document.getElementById('editSpecialite').value = ins.specialite_poste || '';
    document.getElementById('editPiedMain').value = ins.pied_main_dominante || '';
    document.getElementById('editTaille').value = ins.taille_cm || '';
    document.getElementById('editPoids').value = ins.poids_kg || '';
    document.getElementById('editNiveauEtudes').value = ins.niveau_etudes || '';
    document.getElementById('editMetierSouhaite').value = ins.metier_souhaite || '';
    document.getElementById('editModal').classList.add('active');
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const data = {
        nom_complet: document.getElementById('editNom').value.trim(),
        date_naissance: document.getElementById('editDateNaissance').value || null,
        ville_quartier: document.getElementById('editVilleQuartier').value.trim() || null,
        telephone: document.getElementById('editTelephone').value.trim(),
        email: document.getElementById('editEmailReseaux').value.trim() || null,
        specialite_poste: document.getElementById('editSpecialite').value.trim() || null,
        pied_main_dominante: document.getElementById('editPiedMain').value || null,
        taille_cm: parseInt(document.getElementById('editTaille').value) || null,
        poids_kg: parseFloat(document.getElementById('editPoids').value) || null,
        niveau_etudes: document.getElementById('editNiveauEtudes').value.trim() || null,
        metier_souhaite: document.getElementById('editMetierSouhaite').value.trim() || null,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('nosclub_inscriptions').update(data).eq('id', id);
        if (error) throw error;
        showToast('Informations modifiées', 'success');
        closeAllModals();
        loadInscriptions();
    } catch (err) { showToast('Erreur modification', 'error'); }
    finally { hideLoader(); }
});
// ========== FIN : MODIFICATION ==========

// ========== DÉBUT : PREUVE DE PAIEMENT ==========
function openPaymentModal(id) {
    currentInscription = allInscriptions.find(i => i.id == id);
    if (!currentInscription) return;
    uploadedPreuveUrl = null;
    document.getElementById('uploadStatusPreuve').style.display = 'none';
    document.getElementById('uploadSuccessPreuve').style.display = 'none';
    document.getElementById('preuveFile').value = '';
    document.getElementById('paymentModal').classList.add('active');
}

document.getElementById('preuveFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('uploadStatusPreuve').style.display = 'flex';
    document.getElementById('uploadSuccessPreuve').style.display = 'none';
    try {
        const fileName = `preuve_${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabaseAdmin.storage.from('nosclub_documents').upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabaseAdmin.storage.from('nosclub_documents').getPublicUrl(fileName);
        uploadedPreuveUrl = urlData.publicUrl;
        document.getElementById('uploadStatusPreuve').style.display = 'none';
        document.getElementById('uploadSuccessPreuve').style.display = 'flex';
    } catch (err) {
        document.getElementById('uploadStatusPreuve').style.display = 'none';
        showToast('Erreur upload preuve', 'error');
    }
});

document.getElementById('savePaymentBtn').addEventListener('click', async () => {
    if (!currentInscription || !uploadedPreuveUrl) {
        showToast('Veuillez téléverser une preuve', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_inscriptions')
            .update({
                preuve_paiement_url: uploadedPreuveUrl,
                date_paiement: new Date().toISOString()
            })
            .eq('id', currentInscription.id);
        if (error) throw error;
        showToast('Preuve enregistrée', 'success');
        closeAllModals();
        loadInscriptions();
    } catch (err) { showToast('Erreur sauvegarde preuve', 'error'); }
    finally { hideLoader(); }
});
// ========== FIN : PREUVE DE PAIEMENT ==========

// ========== DÉBUT : BLOCAGE ==========
function openBlockModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;
    document.getElementById('confirmBlockBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('nosclub_inscriptions')
                .update({ statut: 'bloque', updated_at: new Date().toISOString() })
                .eq('id', currentInscription.id);
            if (error) throw error;
            showToast('Inscription bloquée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) { showToast('Erreur blocage', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('blockModal').classList.add('active');
}
// ========== FIN : BLOCAGE ==========

// ========== DÉBUT : SUPPRESSION INSCRIPTION ==========
function openDeleteModal(id) {
    const ins = allInscriptions.find(i => i.id == id);
    if (!ins) return;
    currentInscription = ins;
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        showLoader();
        try {
            await supabaseAdmin.from('nosclub_messages').delete().eq('destinataire_id', id.toString());
            const { error } = await supabaseAdmin.from('nosclub_inscriptions').delete().eq('id', id);
            if (error) throw error;
            showToast('Inscription supprimée', 'success');
            closeAllModals();
            loadInscriptions();
        } catch (err) { showToast('Erreur suppression', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('deleteModal').classList.add('active');
}
// ========== FIN : SUPPRESSION INSCRIPTION ==========

// ========== DÉBUT : LISTE D'ATTENTE ==========
async function loadAttentes() {
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_inscriptions_attente')
            .select('*, nosclub_clubs(nom)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allAttentes = data || [];
        renderAttentesTable();
    } catch (err) { console.error(err); }
}

function renderAttentesTable() {
    const tbody = document.getElementById('attenteBody');
    if (!tbody) return;
    if (allAttentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Aucune entrée en liste d\'attente.</td></tr>';
        return;
    }
    tbody.innerHTML = allAttentes.map(a => {
        const clubNom = a.nosclub_clubs?.nom || '?';
        return `
            <tr data-id="${a.id}">
                <td>${a.id}</td>
                <td>${escapeHtml(a.nom_complet)}</td>
                <td>${escapeHtml(clubNom)}</td>
                <td>${escapeHtml(a.telephone)}</td>
                <td>${escapeHtml(a.motivation || '-')}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-view-attente" data-id="${a.id}" title="Voir"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-convert" data-id="${a.id}" title="Convertir"><i class="fas fa-exchange-alt"></i></button>
                    <button class="btn-icon btn-delete-attente" data-id="${a.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-view-attente').forEach(b => b.addEventListener('click', () => openAttenteViewModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-convert').forEach(b => b.addEventListener('click', () => openConvertModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-delete-attente').forEach(b => b.addEventListener('click', () => openAttenteDeleteModal(b.dataset.id)));
}

function openAttenteViewModal(id) {
    const a = allAttentes.find(i => i.id == id);
    if (!a) return;
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3><i class="fas fa-eye"></i> Détail liste d'attente</h3>
            <p><strong>Nom :</strong> ${escapeHtml(a.nom_complet)}</p>
            <p><strong>Téléphone :</strong> ${escapeHtml(a.telephone)}</p>
            <p><strong>Ville/Quartier :</strong> ${escapeHtml(a.ville_quartier || '-')}</p>
            <p><strong>Spécialité :</strong> ${escapeHtml(a.specialite_poste || '-')}</p>
            <p><strong>Niveau études :</strong> ${escapeHtml(a.niveau_etudes || '-')}</p>
            <p><strong>Motivation :</strong> ${escapeHtml(a.motivation || '-')}</p>
            <button class="btn-submit" onclick="this.closest('.modal').remove()">Fermer</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function openAttenteDeleteModal(id) {
    currentAttente = allAttentes.find(a => a.id == id);
    if (!currentAttente) return;
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3><i class="fas fa-trash-alt"></i> Supprimer de la liste d'attente</h3>
            <p>Confirmer la suppression ?</p>
            <button id="confirmAttenteDeleteBtn" class="btn-submit btn-danger">Supprimer</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.querySelector('#confirmAttenteDeleteBtn').onclick = async () => {
        try {
            await supabaseAdmin.from('nosclub_inscriptions_attente').delete().eq('id', currentAttente.id);
            showToast('Supprimé de la liste d\'attente', 'success');
            modal.remove();
            loadAttentes();
        } catch (err) { showToast('Erreur suppression', 'error'); }
    };
}

function openConvertModal(id) {
    currentAttente = allAttentes.find(a => a.id == id);
    if (!currentAttente) return;
    const container = document.getElementById('convertFormContainer');
    container.innerHTML = '';
    const formHtml = `
        <form id="convertForm">
            <input type="hidden" id="convertAttenteId" value="${currentAttente.id}">
            <input type="hidden" id="convertClubId" value="${currentAttente.club_id}">
            <div class="form-row">
                <div class="form-group"><label>Nom complet *</label><input type="text" id="convertNom" value="${escapeHtml(currentAttente.nom_complet)}" required></div>
                <div class="form-group"><label>Date de naissance</label><input type="date" id="convertDateNaissance"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Ville / Quartier</label><input type="text" id="convertVilleQuartier" value="${escapeHtml(currentAttente.ville_quartier || '')}"></div>
                <div class="form-group"><label>Téléphone *</label><input type="tel" id="convertTelephone" value="${escapeHtml(currentAttente.telephone)}" required></div>
            </div>
            <div class="form-group"><label>Email & Réseaux sociaux</label><input type="text" id="convertEmailReseaux"></div>
            <div class="form-row">
                <div class="form-group"><label>Spécialité / Poste</label><input type="text" id="convertSpecialite" value="${escapeHtml(currentAttente.specialite_poste || '')}"></div>
                <div class="form-group"><label>Pied fort / Main dominante</label>
                    <select id="convertPiedMain">
                        <option value="">--</option>
                        <option value="Droit">Droit</option>
                        <option value="Gauche">Gauche</option>
                        <option value="Ambidextre">Ambidextre</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Taille (cm)</label><input type="number" id="convertTaille"></div>
                <div class="form-group"><label>Poids (kg)</label><input type="number" id="convertPoids" step="0.1"></div>
            </div>
            <div class="form-group"><label>Niveau d'études</label><input type="text" id="convertNiveauEtudes" value="${escapeHtml(currentAttente.niveau_etudes || '')}"></div>
            <div class="form-group"><label>Métier souhaité</label><input type="text" id="convertMetierSouhaite"></div>
            <div class="form-group">
                <label>Photo d'identité</label>
                <div class="file-upload-box" id="convertUploadPhoto">
                    <i class="fas fa-cloud-upload-alt"></i><span>Cliquez pour télécharger</span>
                    <input type="file" id="convertPhotoFile" accept=".jpg,.jpeg,.png">
                    <div class="upload-status" id="convertUploadStatus" style="display:none;"><span class="upload-spinner"></span><span>Téléversement...</span></div>
                    <div class="upload-success" id="convertUploadSuccess" style="display:none;"><i class="fas fa-check-circle"></i><span>Photo prête</span></div>
                </div>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="convertEngagement" checked required>
                <label>Je m'engage à payer la cotisation journalière de 55 CFA.</label>
            </div>
            <button type="submit" class="btn-submit"><i class="fas fa-save"></i> Finaliser l'inscription</button>
        </form>
    `;
    container.innerHTML = formHtml;
    document.getElementById('convertModal').classList.add('active');

    let convertPhotoUrl = null;
    document.getElementById('convertPhotoFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        document.getElementById('convertUploadStatus').style.display = 'flex';
        document.getElementById('convertUploadSuccess').style.display = 'none';
        try {
            const fileName = `convert_${Date.now()}.${file.name.split('.').pop()}`;
            const { error } = await supabaseAdmin.storage.from('nosclub_documents').upload(fileName, file);
            if (error) throw error;
            const { data: urlData } = supabaseAdmin.storage.from('nosclub_documents').getPublicUrl(fileName);
            convertPhotoUrl = urlData.publicUrl;
            document.getElementById('convertUploadStatus').style.display = 'none';
            document.getElementById('convertUploadSuccess').style.display = 'flex';
        } catch (err) {
            document.getElementById('convertUploadStatus').style.display = 'none';
            showToast('Erreur upload photo', 'error');
        }
    });

    document.getElementById('convertForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('convertNom').value.trim();
        const telephone = document.getElementById('convertTelephone').value.trim();
        if (!nom || !telephone) { showToast('Champs obligatoires manquants', 'warning'); return; }

        const data = {
            club_id: currentAttente.club_id,
            nom_complet: nom,
            date_naissance: document.getElementById('convertDateNaissance').value || null,
            ville_quartier: document.getElementById('convertVilleQuartier').value.trim() || null,
            telephone: telephone,
            email: document.getElementById('convertEmailReseaux').value.trim() || null,
            specialite_poste: document.getElementById('convertSpecialite').value.trim() || null,
            pied_main_dominante: document.getElementById('convertPiedMain').value || null,
            taille_cm: parseInt(document.getElementById('convertTaille').value) || null,
            poids_kg: parseFloat(document.getElementById('convertPoids').value) || null,
            niveau_etudes: document.getElementById('convertNiveauEtudes').value.trim() || null,
            metier_souhaite: document.getElementById('convertMetierSouhaite').value.trim() || null,
            photo_identite_url: convertPhotoUrl,
            engagement_financier: document.getElementById('convertEngagement').checked,
            statut: 'en_attente',
            created_at: new Date().toISOString()
        };

        showLoader();
        try {
            const { error: insertErr } = await supabaseAdmin.from('nosclub_inscriptions').insert([data]);
            if (insertErr) throw insertErr;
            await supabaseAdmin.from('nosclub_inscriptions_attente').delete().eq('id', currentAttente.id);
            showToast('Inscription convertie avec succès', 'success');
            closeAllModals();
            loadInscriptions();
            loadAttentes();
        } catch (err) { showToast('Erreur conversion', 'error'); }
        finally { hideLoader(); }
    });
}
// ========== FIN : LISTE D'ATTENTE ==========

// ========== DÉBUT : FERMETURE MODALES GÉNÉRALES ==========
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeAllModals(); });
// ========== FIN : FERMETURE MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ==========
document.getElementById('searchInput').addEventListener('input', renderInscriptionsTable);
document.getElementById('clubFilter').addEventListener('change', renderInscriptionsTable);
document.getElementById('statusFilter').addEventListener('change', renderInscriptionsTable);
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
document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); showToast('Déconnexion', 'info'); });
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadClubs().then(() => {
        loadInscriptions();
        loadAttentes();
    });
});
// ========== FIN DE GESTION-INSCRIPTIONS.JS ==========
