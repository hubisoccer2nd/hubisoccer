// ========== ARTISTES-ADMIN.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allInscriptions = [];
let currentInscription = null;
let allExamens = [];
let allAnalyses = [];
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

function getDisciplineLabel(code) {
    const labels = {
        chanteur: 'Chanteur',
        danseur: 'Danseur',
        compositeur: 'Compositeur',
        acteur_cinema: 'Acteur de cinéma',
        acteur_theatre: 'Acteur de théâtre',
        humoriste: 'Humoriste',
        slameur: 'Slameur',
        dj: 'DJ/producteur',
        cirque: 'Artiste de cirque',
        artiste_visuel: 'Artiste visuel'
    };
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

// ========== DÉBUT : CHARGEMENT DES ARTISTES ==========
async function loadArtistes() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artistes_adhesion')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allInscriptions = data || [];
        renderArtistesTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des artistes', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : CHARGEMENT DES ARTISTES ==========

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

// ========== DÉBUT : RENDU DU TABLEAU ARTISTES ==========
function getFilteredArtistes() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const discipline = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;

    return allInscriptions.filter(ins => {
        const matchSearch = 
            ins.full_name.toLowerCase().includes(search) ||
            ins.artiste_id.toLowerCase().includes(search) ||
            (ins.email && ins.email.toLowerCase().includes(search));
        const matchDiscipline = discipline === 'all' || ins.discipline === discipline;
        const matchStatus = status === 'all' || ins.status === status;
        return matchSearch && matchDiscipline && matchStatus;
    });
}

function renderArtistesTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    const filtered = getFilteredArtistes();
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">Aucun artiste trouvé</td></tr>';
        return;
    }
    tableBody.innerHTML = filtered.map(ins => `
        <tr data-artisteid="${ins.artiste_id}">
            <td class="id-cell" title="${escapeHtml(ins.artiste_id)}">${escapeHtml(ins.artiste_id.substring(0, 10))}...</td>
            <td>${escapeHtml(ins.full_name)}</td>
            <td>${getDisciplineLabel(ins.discipline)}</td>
            <td>${escapeHtml(ins.email || '-')}</td>
            <td>${escapeHtml(ins.phone)}</td>
            <td>${formatDate(ins.created_at)}</td>
            <td><span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-artisteid="${ins.artiste_id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                ${ins.status !== 'valide_public' ? `<button class="btn-icon btn-approve" data-artisteid="${ins.artiste_id}" title="Approuver"><i class="fas fa-check-circle"></i></button>` : ''}
                ${ins.status !== 'rejete' ? `<button class="btn-icon btn-reject" data-artisteid="${ins.artiste_id}" title="Rejeter"><i class="fas fa-times-circle"></i></button>` : ''}
                ${ins.status !== 'bloque' ? `<button class="btn-icon btn-block" data-artisteid="${ins.artiste_id}" title="Bloquer"><i class="fas fa-ban"></i></button>` : ''}
                <button class="btn-icon btn-delete" data-artisteid="${ins.artiste_id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    // Attacher les événements aux boutons
    document.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => openViewModal(btn.dataset.artisteid)));
    document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', () => openApproveModal(btn.dataset.artisteid)));
    document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', () => openRejectModal(btn.dataset.artisteid)));
    document.querySelectorAll('.btn-block').forEach(btn => btn.addEventListener('click', () => openBlockModal(btn.dataset.artisteid)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.dataset.artisteid)));
}
// ========== FIN : RENDU DU TABLEAU ARTISTES ==========

// ========== DÉBUT : GESTION DES MODALES ==========
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// Modale de visualisation
async function openViewModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    const viewContent = document.getElementById('viewContent');
    let html = `
        <div class="view-details">
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Identité</h4>
                <p><strong>Nom complet :</strong> ${escapeHtml(ins.full_name)}</p>
                <p><strong>Date de naissance :</strong> ${formatDate(ins.birth_date)}</p>
                <p><strong>Email :</strong> ${escapeHtml(ins.email || '-')}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(ins.phone)}</p>
                <p><strong>Discipline :</strong> ${getDisciplineLabel(ins.discipline)}</p>
                <p><strong>Rôle :</strong> ${escapeHtml(ins.role)}</p>
                <p><strong>ID :</strong> ${escapeHtml(ins.artiste_id)}</p>
                <p><strong>Statut :</strong> <span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></p>
                <p><strong>Date de soumission :</strong> ${formatDate(ins.created_at)}</p>
                ${ins.parent_name ? `<p><strong>Parent / tuteur :</strong> ${escapeHtml(ins.parent_name)}</p>` : ''}
                ${ins.inscription_code ? `<p><strong>Code d'inscription :</strong> ${escapeHtml(ins.inscription_code)}</p>` : ''}
                ${ins.affiliate_id ? `<p><strong>ID affilié :</strong> ${escapeHtml(ins.affiliate_id)}</p>` : ''}
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> Documents</h4>
                <p><strong>Diplôme :</strong> ${ins.diploma_url ? `<a href="${escapeHtml(ins.diploma_url)}" target="_blank"><i class="fas fa-download"></i> Télécharger</a>` : '-'}</p>
                <p><strong>Pièce d'identité :</strong> ${ins.id_card_url ? `<a href="${escapeHtml(ins.id_card_url)}" target="_blank"><i class="fas fa-download"></i> Télécharger</a>` : '-'}</p>
                <p><strong>Titre diplôme :</strong> ${escapeHtml(ins.diploma_title)}</p>
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
    loadMessages(ins.artiste_id);

    // Écouteur d'envoi de message
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);

    document.getElementById('viewModal').classList.add('active');
}

// Chargement des messages
async function loadMessages(artisteId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_suivi_messages')
            .select('*')
            .eq('artiste_id', artisteId)
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
            .from('public_artiste_suivi_messages')
            .insert([{
                artiste_id: currentInscription.artiste_id,
                sender: 'admin',
                content: message,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        input.value = '';
        await loadMessages(currentInscription.artiste_id);
        showToast('Message envoyé', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur envoi message', 'error');
    }
}

// Modale d'approbation (corrigée)
function openApproveModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    // Si l'artiste a déjà un login, on l'affiche, sinon on en génère un nouveau
    let login, password;
    if (ins.login) {
        login = ins.login;
        password = '';
        document.getElementById('generatedLogin').value = login;
        document.getElementById('generatedPassword').value = '******** (déjà défini)';
    } else {
        login = generateLogin(ins.full_name);
        password = generatePassword();
        document.getElementById('generatedLogin').value = login;
        document.getElementById('generatedPassword').value = password;
    }

    document.getElementById('approveInfo').innerHTML = `
        <p><strong>Nom :</strong> ${escapeHtml(ins.full_name)}</p>
        <p><strong>Discipline :</strong> ${getDisciplineLabel(ins.discipline)}</p>
    `;

    document.getElementById('confirmApprovalBtn').onclick = async () => {
        showLoader();
        try {
            const updateData = {
                status: 'valide_public',
                updated_at: new Date().toISOString()
            };
            // Ne définir login/mot de passe que s'ils n'existent pas déjà
            if (!ins.login) {
                updateData.login = login;
                updateData.mot_de_passe_hash = hashPassword(password);
            }
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .update(updateData)
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;

            // Mise à jour locale
            currentInscription.status = 'valide_public';
            if (!ins.login) {
                currentInscription.login = login;
                currentInscription.mot_de_passe_hash = hashPassword(password);
            }

            showToast('Artiste approuvé !', 'success');
            closeAllModals();
            loadArtistes();
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
function openRejectModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
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
                .from('public_artistes_adhesion')
                .update({
                    status: 'rejete',
                    role_data: { ... (ins.role_data || {}), motif_rejet: reason },
                    updated_at: new Date().toISOString()
                })
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;

            currentInscription.status = 'rejete';
            showToast('Artiste rejeté', 'success');
            closeAllModals();
            loadArtistes();
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
function openBlockModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmBlockBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .update({ status: 'bloque', updated_at: new Date().toISOString() })
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;

            currentInscription.status = 'bloque';
            showToast('Artiste bloqué', 'success');
            closeAllModals();
            loadArtistes();
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
function openDeleteModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        showLoader();
        try {
            // Supprimer les messages associés
            await supabaseAdmin.from('public_artiste_suivi_messages').delete().eq('artiste_id', currentInscription.artiste_id);
            // Supprimer l'inscription
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .delete()
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;

            allInscriptions = allInscriptions.filter(i => i.artiste_id !== currentInscription.artiste_id);
            showToast('Artiste supprimé définitivement', 'success');
            closeAllModals();
            renderArtistesTable();
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

// ========== DÉBUT : GESTION DES EXAMENS ==========
async function loadExamens() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_examens')
            .select('*')
            .order('date_soumission', { ascending: false });
        if (error) throw error;
        allExamens = data || [];
        renderExamensTable();
    } catch (err) {
        console.error(err);
    }
}

function renderExamensTable() {
    const tableBody = document.getElementById('examensBody');
    if (!tableBody) return;
    if (allExamens.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Aucun examen trouvé</td></tr>';
        return;
    }
    tableBody.innerHTML = allExamens.map(ex => {
        const artiste = allInscriptions.find(a => a.artiste_id === ex.artiste_id);
        const artisteNom = artiste ? artiste.full_name : ex.artiste_id;
        return `
            <tr>
                <td>${escapeHtml(artisteNom)}</td>
                <td>${escapeHtml(ex.artiste_id)}</td>
                <td>${ex.note_finale !== null ? ex.note_finale + '/20' : 'Non corrigé'}</td>
                <td><span class="status-badge ${ex.statut === 'corrige' ? 'status-valide_public' : 'status-en_attente'}">${ex.statut === 'corrige' ? 'Corrigé' : 'En attente'}</span></td>
                <td>${formatDate(ex.date_soumission)}</td>
                <td>
                    ${ex.statut === 'en_attente' ? `<button class="btn-icon btn-correct" data-examenid="${ex.id}" title="Corriger"><i class="fas fa-graduation-cap"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.btn-correct').forEach(btn => btn.addEventListener('click', () => openExamenModal(btn.dataset.examenid)));
}

function openExamenModal(examenId) {
    document.getElementById('examenId').value = examenId;
    document.getElementById('examenNote').value = '';
    document.getElementById('examenCommentaire').value = '';
    document.getElementById('examenModal').classList.add('active');
}

async function saveExamenCorrection() {
    const examenId = document.getElementById('examenId').value;
    const note = parseFloat(document.getElementById('examenNote').value);
    const commentaire = document.getElementById('examenCommentaire').value.trim();
    if (isNaN(note) || note < 0 || note > 20) {
        showToast('La note doit être comprise entre 0 et 20.', 'warning');
        return;
    }
    const { error } = await supabaseAdmin
        .from('public_artiste_examens')
        .update({ note_finale: note, commentaire_admin: commentaire, statut: 'corrige', date_correction: new Date().toISOString() })
        .eq('id', examenId);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else {
        showToast('Examen corrigé', 'success');
        closeAllModals();
        loadExamens();
    }
}
// ========== FIN : GESTION DES EXAMENS ==========

// ========== DÉBUT : GESTION DES TESTS PRATIQUES ==========
async function loadAnalyses() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_analyses')
            .select('*')
            .order('date_soumission', { ascending: false });
        if (error) throw error;
        allAnalyses = data || [];
        renderAnalysesTable();
    } catch (err) {
        console.error(err);
    }
}

function renderAnalysesTable() {
    const tableBody = document.getElementById('analysesBody');
    if (!tableBody) return;
    if (allAnalyses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-message">Aucun test pratique trouvé</td></tr>';
        return;
    }
    tableBody.innerHTML = allAnalyses.map(an => {
        const artiste = allInscriptions.find(a => a.artiste_id === an.artiste_id);
        const artisteNom = artiste ? artiste.full_name : an.artiste_id;
        return `
            <tr>
                <td>${escapeHtml(artisteNom)}</td>
                <td>${escapeHtml(an.artiste_id)}</td>
                <td><span class="status-badge ${an.statut === 'valide' ? 'status-valide_public' : an.statut === 'rejete' ? 'status-rejete' : 'status-en_attente'}">${an.statut === 'valide' ? 'Validé' : an.statut === 'rejete' ? 'Rejeté' : 'En attente'}</span></td>
                <td>${formatDate(an.date_soumission)}</td>
                <td>
                    ${an.statut === 'en_attente' ? `<button class="btn-icon btn-evaluate" data-analyseid="${an.id}" title="Évaluer"><i class="fas fa-video"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.btn-evaluate').forEach(btn => btn.addEventListener('click', () => openAnalyseModal(btn.dataset.analyseid)));
}

function openAnalyseModal(analyseId) {
    document.getElementById('analyseId').value = analyseId;
    document.getElementById('analyseStatut').value = 'valide';
    document.getElementById('analyseCommentaire').value = '';
    document.getElementById('analyseModal').classList.add('active');
}

async function saveAnalyseEvaluation() {
    const analyseId = document.getElementById('analyseId').value;
    const statut = document.getElementById('analyseStatut').value;
    const commentaire = document.getElementById('analyseCommentaire').value.trim();
    const { error } = await supabaseAdmin
        .from('public_artiste_analyses')
        .update({ statut: statut, commentaire_admin: commentaire, date_traitement: new Date().toISOString() })
        .eq('id', analyseId);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else {
        showToast('Test pratique évalué', 'success');
        closeAllModals();
        loadAnalyses();
    }
}
// ========== FIN : GESTION DES TESTS PRATIQUES ==========

// ========== DÉBUT : GESTION DES MESSAGES (ONGLET) ==========
async function loadAllMessages() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_suivi_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        const tableBody = document.getElementById('messagesBody');
        if (!tableBody) return;
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">Aucun message envoyé</td></tr>';
            return;
        }
        tableBody.innerHTML = data.map(msg => {
            const artiste = allInscriptions.find(a => a.artiste_id === msg.artiste_id);
            const artisteNom = artiste ? artiste.full_name : msg.artiste_id;
            return `
                <tr>
                    <td>${escapeHtml(artisteNom)}</td>
                    <td>${escapeHtml(msg.content)}</td>
                    <td>${msg.sender === 'admin' ? 'Admin' : 'Artiste'}</td>
                    <td>${new Date(msg.created_at).toLocaleString('fr-FR')}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}

async function populateArtisteSelect() {
    const { data, error } = await supabaseAdmin.from('public_artistes_adhesion').select('artiste_id, full_name').order('full_name');
    if (error) return;
    const select = document.getElementById('targetArtiste');
    if (!select) return;
    select.innerHTML = '<option value="">Sélectionner un artiste</option>';
    data.forEach(art => {
        select.innerHTML += `<option value="${art.artiste_id}">${escapeHtml(art.full_name)} (${art.artiste_id})</option>`;
    });
}

async function sendGlobalMessage() {
    const artisteId = document.getElementById('targetArtiste').value;
    const message = document.getElementById('adminMessage').value.trim();
    if (!artisteId || !message) {
        showToast('Veuillez sélectionner un artiste et écrire un message.', 'warning');
        return;
    }
    const { error } = await supabaseAdmin.from('public_artiste_suivi_messages').insert([{
        artiste_id: artisteId,
        sender: 'admin',
        content: message,
        created_at: new Date().toISOString()
    }]);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else {
        showToast('Message envoyé', 'success');
        document.getElementById('adminMessage').value = '';
        loadAllMessages();
    }
}
// ========== FIN : GESTION DES MESSAGES ==========

// ========== DÉBUT : FERMETURE DES MODALES ==========
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
});
// ========== FIN : FERMETURE DES MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ET RAFRAÎCHISSEMENT ==========
document.getElementById('searchInput').addEventListener('input', renderArtistesTable);
document.getElementById('roleFilter').addEventListener('change', renderArtistesTable);
document.getElementById('statusFilter').addEventListener('change', renderArtistesTable);
document.getElementById('refreshStatsBtn').addEventListener('click', () => {
    loadArtistes();
    showToast('Données rafraîchies', 'info');
});
document.getElementById('searchExamen').addEventListener('input', renderExamensTable);
document.getElementById('examenStatusFilter').addEventListener('change', renderExamensTable);
document.getElementById('refreshExamens').addEventListener('click', loadExamens);
document.getElementById('searchAnalyse').addEventListener('input', renderAnalysesTable);
document.getElementById('analyseStatusFilter').addEventListener('change', renderAnalysesTable);
document.getElementById('refreshAnalyses').addEventListener('click', loadAnalyses);
document.getElementById('sendMessageBtn').addEventListener('click', sendGlobalMessage);
document.getElementById('saveExamenBtn').addEventListener('click', saveExamenCorrection);
document.getElementById('saveAnalyseBtn').addEventListener('click', saveAnalyseEvaluation);
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

// ========== DÉBUT : GESTION DES ONGLETS ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'artistes') loadArtistes();
        else if (tabId === 'examens') loadExamens();
        else if (tabId === 'analyses') loadAnalyses();
        else if (tabId === 'messages') { loadAllMessages(); populateArtisteSelect(); }
    });
});
// ========== FIN : GESTION DES ONGLETS ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadArtistes();
    populateArtisteSelect();
});
// ========== FIN DE ARTISTES-ADMIN.JS ==========
