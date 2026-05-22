// ========== DEBUT : artistes-admin.js ==========
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
let viewQuill = null;
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

function getDisciplineLabel(code) {
    const labels = {
        chanteur: 'Chanteur', danseur: 'Danseur', compositeur: 'Compositeur',
        acteur_cinema: 'Acteur de cinéma', acteur_theatre: 'Acteur de théâtre',
        humoriste: 'Humoriste', slameur: 'Slameur', dj: 'DJ/producteur',
        cirque: 'Artiste de cirque', artiste_visuel: 'Artiste visuel'
    };
    return labels[code] || code;
}

function getStatusLabel(status) {
    const labels = {
        'en_attente': 'En attente', 'valide_public': 'Approuvé',
        'rejete': 'Rejeté', 'bloque': 'Bloqué', 'supprime': 'Supprimé',
        'test_ecrit': 'Test écrit', 'test_pratique': 'Test pratique'
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
    } catch (err) { showToast('Erreur chargement artistes', 'error'); }
    finally { hideLoader(); }
}
// ========== FIN : CHARGEMENT DES ARTISTES ==========

// ========== DÉBUT : STATISTIQUES ==========
function updateStats() {
    const s = { en_attente:0, valide_public:0, rejete:0, bloque:0, supprime:0, test_ecrit:0, test_pratique:0 };
    allInscriptions.forEach(i => { if (s[i.status] !== undefined) s[i.status]++; });
    document.getElementById('statEnAttente').textContent = s.en_attente;
    document.getElementById('statApprouve').textContent = s.valide_public;
    document.getElementById('statRejete').textContent = s.rejete;
    document.getElementById('statBloque').textContent = s.bloque;
    document.getElementById('statSupprime').textContent = s.supprime;
}
// ========== FIN : STATISTIQUES ==========

// ========== DÉBUT : TABLEAU ARTISTES ==========
function getFilteredArtistes() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const d = document.getElementById('roleFilter').value;
    const st = document.getElementById('statusFilter').value;
    return allInscriptions.filter(ins =>
        (ins.full_name.toLowerCase().includes(q) || ins.artiste_id.toLowerCase().includes(q) || (ins.email||'').toLowerCase().includes(q)) &&
        (d === 'all' || ins.discipline === d) &&
        (st === 'all' || ins.status === st)
    );
}

function renderArtistesTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const filtered = getFilteredArtistes();
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8">Aucun artiste trouvé</td></tr>'; return; }
    tbody.innerHTML = filtered.map(ins => `
        <tr data-artisteid="${ins.artiste_id}">
            <td class="id-cell" title="${escapeHtml(ins.artiste_id)}">${escapeHtml(ins.artiste_id.substring(0,10))}...</td>
            <td>${escapeHtml(ins.full_name)}</td>
            <td>${getDisciplineLabel(ins.discipline)}</td>
            <td>${escapeHtml(ins.email||'-')}</td>
            <td>${escapeHtml(ins.phone)}</td>
            <td>${formatDate(ins.created_at)}</td>
            <td><span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-artisteid="${ins.artiste_id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                ${ins.status !== 'valide_public' ? `<button class="btn-icon btn-approve" data-artisteid="${ins.artiste_id}" title="Approuver"><i class="fas fa-check-circle"></i></button>` : ''}
                ${ins.status !== 'rejete' ? `<button class="btn-icon btn-reject" data-artisteid="${ins.artiste_id}" title="Rejeter"><i class="fas fa-times-circle"></i></button>` : ''}
                ${ins.status !== 'bloque' ? `<button class="btn-icon btn-block" data-artisteid="${ins.artiste_id}" title="Bloquer"><i class="fas fa-ban"></i></button>` : ''}
                ${ins.status !== 'test_ecrit' ? `<button class="btn-icon btn-test-ecrit" data-artisteid="${ins.artiste_id}" title="Test écrit"><i class="fas fa-pencil-alt"></i></button>` : ''}
                ${ins.status !== 'test_pratique' ? `<button class="btn-icon btn-test-pratique" data-artisteid="${ins.artiste_id}" title="Test pratique"><i class="fas fa-video"></i></button>` : ''}
                <button class="btn-icon btn-edit" data-artisteid="${ins.artiste_id}" title="Modifier"><i class="fas fa-pen-to-square"></i></button>
                <button class="btn-icon btn-delete" data-artisteid="${ins.artiste_id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
    // événements
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => openApproveModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => openRejectModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-block').forEach(b => b.addEventListener('click', () => openBlockModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-test-ecrit').forEach(b => b.addEventListener('click', () => openTestEcritModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-test-pratique').forEach(b => b.addEventListener('click', () => openTestPratiqueModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openEditModal(b.dataset.artisteid)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => openDeleteModal(b.dataset.artisteid)));
}
// ========== FIN : TABLEAU ARTISTES ==========

// ========== DÉBUT : MODALE VISUALISATION (COMPLÈTE) ==========
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

async function openViewModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    let artistDataHtml = '';
    if (ins.artist_data && typeof ins.artist_data === 'object') {
        const entries = Object.entries(ins.artist_data);
        if (entries.length) {
            artistDataHtml = entries.map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</p>`).join('');
        }
    }

    const viewContent = document.getElementById('viewContent');
    viewContent.innerHTML = `
        <div class="view-details">
            <div class="detail-section">
                <h4><i class="fas fa-id-card"></i> Identité</h4>
                <p><strong>ID Artiste :</strong> ${escapeHtml(ins.artiste_id)}</p>
                <p><strong>Nom :</strong> ${escapeHtml(ins.full_name)}</p>
                <p><strong>Date de naissance :</strong> ${formatDate(ins.birth_date)}</p>
                <p><strong>Email :</strong> ${escapeHtml(ins.email || '-')}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(ins.phone)}</p>
                <p><strong>Discipline :</strong> ${getDisciplineLabel(ins.discipline)}</p>
                <p><strong>Rôle :</strong> ${escapeHtml(ins.role || '-')}</p>
                <p><strong>Statut :</strong> <span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></p>
                <p><strong>Date d'inscription :</strong> ${formatDate(ins.created_at)}</p>
                ${ins.parent_name ? `<p><strong>Parent / tuteur :</strong> ${escapeHtml(ins.parent_name)}</p>` : ''}
                ${ins.inscription_code ? `<p><strong>Code d'inscription :</strong> ${escapeHtml(ins.inscription_code)}</p>` : ''}
                ${ins.affiliate_id ? `<p><strong>ID Affilié :</strong> ${escapeHtml(ins.affiliate_id)}</p>` : ''}
                ${ins.definition ? `<p><strong>Description :</strong> ${escapeHtml(ins.definition)}</p>` : ''}
                ${ins.motif_rejet ? `<p><strong>Motif rejet :</strong> ${escapeHtml(ins.motif_rejet)}</p>` : ''}
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> Documents</h4>
                <p>Diplôme : ${ins.diploma_url ? `<a href="${escapeHtml(ins.diploma_url)}" target="_blank">Télécharger</a>` : '-'}</p>
                <p>Pièce d'identité : ${ins.id_card_url ? `<a href="${escapeHtml(ins.id_card_url)}" target="_blank">Télécharger</a>` : '-'}</p>
            </div>
            ${artistDataHtml ? `<div class="detail-section"><h4><i class="fas fa-info-circle"></i> Données artistiques</h4>${artistDataHtml}</div>` : ''}
            <div class="detail-section">
                <h4><i class="fas fa-comments"></i> Messagerie</h4>
                <div id="adminMessagesContainer" class="messages-container"></div>
                <div class="message-compose">
                    <div id="viewMessageEditor" style="height:120px;"></div>
                    <button id="sendViewMsgBtn" class="btn-send"><i class="fas fa-paper-plane"></i> Envoyer</button>
                </div>
            </div>
        </div>
    `;

    if (viewQuill) { viewQuill = null; }
    viewQuill = new Quill('#viewMessageEditor', {
        theme: 'snow',
        placeholder: 'Votre message...',
        modules: {
            toolbar: [
                ['bold','italic','underline'],
                ['link','blockquote'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['clean']
            ]
        }
    });

    loadMessages(ins.artiste_id);
    document.getElementById('sendViewMsgBtn').addEventListener('click', sendViewMessage);
    document.getElementById('viewModal').classList.add('active');
}

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
            container.innerHTML = data && data.length ? data.map(msg => `
                <div class="message ${msg.sender}">
                    <div class="message-bubble">
                        <div>${msg.content}</div>
                        <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                </div>
            `).join('') : '<p class="empty-message">Aucun message.</p>';
        }
    } catch (err) { console.error(err); }
}

async function sendViewMessage() {
    if (!currentInscription || !viewQuill) return;
    const content = viewQuill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') { showToast('Message vide', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_artiste_suivi_messages')
            .insert([{ artiste_id: currentInscription.artiste_id, sender: 'admin', content, created_at: new Date().toISOString() }]);
        if (error) throw error;
        viewQuill.root.innerHTML = '';
        await loadMessages(currentInscription.artiste_id);
        showToast('Message envoyé', 'success');
    } catch (err) { showToast('Erreur envoi', 'error'); }
    finally { hideLoader(); }
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : MODALE MODIFICATION (AVEC ARTIST_DATA ÉDITABLE) ==========
async function openEditModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    let modal = document.getElementById('editModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <span class="close-modal">&times;</span>
                <h3><i class="fas fa-pen-to-square"></i> Modifier la candidature</h3>
                <form id="editForm">
                    <input type="hidden" id="editArtisteId">
                    <div class="form-section">
                        <legend>Identité</legend>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nom complet *</label>
                                <input type="text" id="editFullName" required>
                            </div>
                            <div class="form-group">
                                <label>Date de naissance</label>
                                <input type="date" id="editBirthDate">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Téléphone *</label>
                                <input type="text" id="editPhone" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="editEmail">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Discipline *</label>
                            <select id="editDiscipline" required>
                                <option value="chanteur">Chanteur</option>
                                <option value="danseur">Danseur</option>
                                <option value="compositeur">Compositeur</option>
                                <option value="acteur_cinema">Acteur de cinéma</option>
                                <option value="acteur_theatre">Acteur de théâtre</option>
                                <option value="humoriste">Humoriste</option>
                                <option value="slameur">Slameur</option>
                                <option value="dj">DJ/producteur</option>
                                <option value="cirque">Artiste de cirque</option>
                                <option value="artiste_visuel">Artiste visuel</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Rôle</label>
                            <input type="text" id="editRole">
                        </div>
                    </div>
                    <div class="form-section">
                        <legend>Données artistiques (JSONB)</legend>
                        <div id="artistDataFields"></div>
                        <button type="button" id="addArtistDataField" class="btn-secondary"><i class="fas fa-plus"></i> Ajouter un champ</button>
                    </div>
                    <button type="submit" class="btn-submit"><i class="fas fa-save"></i> Enregistrer les modifications</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        document.getElementById('addArtistDataField').addEventListener('click', () => {
            const container = document.getElementById('artistDataFields');
            const row = document.createElement('div');
            row.className = 'form-row artist-data-row';
            row.innerHTML = `
                <div class="form-group">
                    <input type="text" class="artist-data-key" placeholder="Clé">
                </div>
                <div class="form-group">
                    <input type="text" class="artist-data-value" placeholder="Valeur">
                </div>
                <button type="button" class="btn-icon btn-delete remove-data-row"><i class="fas fa-trash-alt"></i></button>
            `;
            container.appendChild(row);
            row.querySelector('.remove-data-row').addEventListener('click', () => row.remove());
        });

        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const artisteId = document.getElementById('editArtisteId').value;
            const fullName = document.getElementById('editFullName').value.trim();
            const birthDate = document.getElementById('editBirthDate').value;
            const phone = document.getElementById('editPhone').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const discipline = document.getElementById('editDiscipline').value;
            const role = document.getElementById('editRole').value.trim();

            const artistData = {};
            document.querySelectorAll('.artist-data-row').forEach(row => {
                const key = row.querySelector('.artist-data-key').value.trim();
                const value = row.querySelector('.artist-data-value').value.trim();
                if (key) artistData[key] = value;
            });

            showLoader();
            try {
                const { error } = await supabaseAdmin
                    .from('public_artistes_adhesion')
                    .update({
                        full_name: fullName,
                        birth_date: birthDate || null,
                        phone: phone,
                        email: email || null,
                        discipline: discipline,
                        role: role || null,
                        artist_data: Object.keys(artistData).length ? artistData : null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('artiste_id', artisteId);
                if (error) throw error;

                const idx = allInscriptions.findIndex(i => i.artiste_id === artisteId);
                if (idx !== -1) {
                    allInscriptions[idx].full_name = fullName;
                    allInscriptions[idx].birth_date = birthDate || null;
                    allInscriptions[idx].phone = phone;
                    allInscriptions[idx].email = email || null;
                    allInscriptions[idx].discipline = discipline;
                    allInscriptions[idx].role = role || null;
                    allInscriptions[idx].artist_data = Object.keys(artistData).length ? artistData : null;
                }

                showToast('Candidature modifiée avec succès', 'success');
                modal.classList.remove('active');
                renderArtistesTable();
                updateStats();
            } catch (err) {
                showToast('Erreur modification : ' + err.message, 'error');
            } finally {
                hideLoader();
            }
        });
    }

    document.getElementById('editArtisteId').value = ins.artiste_id;
    document.getElementById('editFullName').value = ins.full_name || '';
    document.getElementById('editBirthDate').value = ins.birth_date || '';
    document.getElementById('editPhone').value = ins.phone || '';
    document.getElementById('editEmail').value = ins.email || '';
    document.getElementById('editDiscipline').value = ins.discipline || 'chanteur';
    document.getElementById('editRole').value = ins.role || '';

    const container = document.getElementById('artistDataFields');
    container.innerHTML = '';
    if (ins.artist_data && typeof ins.artist_data === 'object') {
        Object.entries(ins.artist_data).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'form-row artist-data-row';
            row.innerHTML = `
                <div class="form-group">
                    <input type="text" class="artist-data-key" placeholder="Clé" value="${escapeHtml(key)}">
                </div>
                <div class="form-group">
                    <input type="text" class="artist-data-value" placeholder="Valeur" value="${escapeHtml(String(value))}">
                </div>
                <button type="button" class="btn-icon btn-delete remove-data-row"><i class="fas fa-trash-alt"></i></button>
            `;
            container.appendChild(row);
            row.querySelector('.remove-data-row').addEventListener('click', () => row.remove());
        });
    }

    modal.classList.add('active');
}
// ========== FIN : MODALE MODIFICATION ==========

// ========== DÉBUT : APPROBATION ==========
function openApproveModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

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
            const updateData = { status: 'valide_public', updated_at: new Date().toISOString() };
            if (!ins.login) {
                updateData.login = login;
                updateData.mot_de_passe_hash = hashPassword(password);
            }
            const { error } = await supabaseAdmin.from('public_artistes_adhesion').update(updateData).eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;
            currentInscription.status = 'valide_public';
            if (!ins.login) {
                currentInscription.login = login;
                currentInscription.mot_de_passe_hash = hashPassword(password);
            }
            showToast('Artiste approuvé', 'success');
            closeAllModals();
            loadArtistes();
        } catch (err) { showToast('Erreur approbation', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('approveModal').classList.add('active');
}
// ========== FIN : APPROBATION ==========

// ========== DÉBUT : REJET (CORRIGÉ – UTILISE LA COLONNE motif_rejet) ==========
function openRejectModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('rejectReason').value = '';
    document.getElementById('confirmRejectBtn').onclick = async () => {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) { showToast('Veuillez indiquer un motif', 'warning'); return; }
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .update({
                    status: 'rejete',
                    motif_rejet: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;
            currentInscription.status = 'rejete';
            showToast('Artiste rejeté', 'success');
            closeAllModals();
            loadArtistes();
        } catch (err) { showToast('Erreur rejet : ' + err.message, 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('rejectModal').classList.add('active');
}
// ========== FIN : REJET ==========

// ========== DÉBUT : BLOCAGE ==========
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
        } catch (err) { showToast('Erreur blocage', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('blockModal').classList.add('active');
}
// ========== FIN : BLOCAGE ==========

// ========== DÉBUT : TEST ÉCRIT ==========
function openTestEcritModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmTestEcritBtn')?.addEventListener('click', async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .update({ status: 'test_ecrit', updated_at: new Date().toISOString() })
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;
            currentInscription.status = 'test_ecrit';
            showToast('Artiste envoyé en test écrit', 'success');
            closeAllModals();
            loadArtistes();
        } catch (err) { showToast('Erreur', 'error'); }
        finally { hideLoader(); }
    });
    // Créer un bouton s'il n'existe pas (normalement présent dans le HTML)
    if (!document.getElementById('confirmTestEcritBtn')) {
        const modal = document.getElementById('testEcritModal');
        if (modal) {
            modal.innerHTML += '<button id="confirmTestEcritBtn" class="btn-submit"><i class="fas fa-check"></i> Confirmer</button>';
        }
    }
    document.getElementById('testEcritModal').classList.add('active');
}
// ========== FIN : TEST ÉCRIT ==========

// ========== DÉBUT : TEST PRATIQUE ==========
function openTestPratiqueModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmTestPratiqueBtn')?.addEventListener('click', async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_artistes_adhesion')
                .update({ status: 'test_pratique', updated_at: new Date().toISOString() })
                .eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;
            currentInscription.status = 'test_pratique';
            showToast('Artiste envoyé en test pratique', 'success');
            closeAllModals();
            loadArtistes();
        } catch (err) { showToast('Erreur', 'error'); }
        finally { hideLoader(); }
    });
    if (!document.getElementById('confirmTestPratiqueBtn')) {
        const modal = document.getElementById('testPratiqueModal');
        if (modal) {
            modal.innerHTML += '<button id="confirmTestPratiqueBtn" class="btn-submit"><i class="fas fa-check"></i> Confirmer</button>';
        }
    }
    document.getElementById('testPratiqueModal').classList.add('active');
}
// ========== FIN : TEST PRATIQUE ==========

// ========== DÉBUT : SUPPRESSION ==========
function openDeleteModal(artisteId) {
    const ins = allInscriptions.find(i => i.artiste_id === artisteId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        showLoader();
        try {
            await supabaseAdmin.from('public_artiste_suivi_messages').delete().eq('artiste_id', currentInscription.artiste_id);
            const { error } = await supabaseAdmin.from('public_artistes_adhesion').delete().eq('artiste_id', currentInscription.artiste_id);
            if (error) throw error;
            allInscriptions = allInscriptions.filter(i => i.artiste_id !== currentInscription.artiste_id);
            showToast('Artiste supprimé', 'success');
            closeAllModals();
            renderArtistesTable();
            updateStats();
        } catch (err) { showToast('Erreur suppression', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('deleteModal').classList.add('active');
}
// ========== FIN : SUPPRESSION ==========

// ========== DÉBUT : EXAMENS ==========
async function loadExamens() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_examens')
            .select('*')
            .order('date_soumission', { ascending: false });
        if (error) throw error;
        allExamens = data || [];
        renderExamensTable();
    } catch (err) { console.error(err); }
}

function renderExamensTable() {
    const tbody = document.getElementById('examensBody');
    if (!tbody) return;
    if (!allExamens.length) { tbody.innerHTML = '<tr><td colspan="6">Aucun examen trouvé</td></tr>'; return; }
    tbody.innerHTML = allExamens.map(ex => {
        const artiste = allInscriptions.find(a => a.artiste_id === ex.artiste_id);
        const artisteNom = artiste ? artiste.full_name : ex.artiste_id;
        return `
            <tr>
                <td>${escapeHtml(artisteNom)}</td>
                <td>${escapeHtml(ex.artiste_id)}</td>
                <td>${ex.note_finale !== null ? ex.note_finale + '/20' : 'Non corrigé'}</td>
                <td><span class="status-badge ${ex.statut === 'corrige' ? 'status-valide_public' : 'status-en_attente'}">${ex.statut === 'corrige' ? 'Corrigé' : 'En attente'}</span></td>
                <td>${formatDate(ex.date_soumission)}</td>
                <td>${ex.statut === 'en_attente' ? `<button class="btn-icon btn-correct" data-examenid="${ex.id}" title="Corriger"><i class="fas fa-graduation-cap"></i></button>` : ''}</td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-correct').forEach(b => b.addEventListener('click', () => openExamenModal(b.dataset.examenid)));
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
    if (isNaN(note) || note < 0 || note > 20) { showToast('Note invalide', 'warning'); return; }
    const { error } = await supabaseAdmin
        .from('public_artiste_examens')
        .update({ note_finale: note, commentaire_admin: commentaire, statut: 'corrige', date_correction: new Date().toISOString() })
        .eq('id', examenId);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else { showToast('Examen corrigé', 'success'); closeAllModals(); loadExamens(); }
}
// ========== FIN : EXAMENS ==========

// ========== DÉBUT : TESTS PRATIQUES (ANALYSES) ==========
async function loadAnalyses() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_analyses')
            .select('*')
            .order('date_soumission', { ascending: false });
        if (error) throw error;
        allAnalyses = data || [];
        renderAnalysesTable();
    } catch (err) { console.error(err); }
}

function renderAnalysesTable() {
    const tbody = document.getElementById('analysesBody');
    if (!tbody) return;
    if (!allAnalyses.length) { tbody.innerHTML = '<tr><td colspan="5">Aucun test pratique trouvé</td></tr>'; return; }
    tbody.innerHTML = allAnalyses.map(an => {
        const artiste = allInscriptions.find(a => a.artiste_id === an.artiste_id);
        const artisteNom = artiste ? artiste.full_name : an.artiste_id;
        return `
            <tr>
                <td>${escapeHtml(artisteNom)}</td>
                <td>${escapeHtml(an.artiste_id)}</td>
                <td><span class="status-badge ${an.statut === 'valide' ? 'status-valide_public' : an.statut === 'rejete' ? 'status-rejete' : 'status-en_attente'}">${an.statut === 'valide' ? 'Validé' : an.statut === 'rejete' ? 'Rejeté' : 'En attente'}</span></td>
                <td>${formatDate(an.date_soumission)}</td>
                <td>${an.statut === 'en_attente' ? `<button class="btn-icon btn-evaluate" data-analyseid="${an.id}" title="Évaluer"><i class="fas fa-video"></i></button>` : ''}</td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-evaluate').forEach(b => b.addEventListener('click', () => openAnalyseModal(b.dataset.analyseid)));
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
    else { showToast('Test pratique évalué', 'success'); closeAllModals(); loadAnalyses(); }
}
// ========== FIN : TESTS PRATIQUES ==========

// ========== DÉBUT : ONGLET MESSAGES (GLOBAL) ==========
async function loadAllMessages() {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_artiste_suivi_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('messagesBody');
        if (!tbody) return;
        tbody.innerHTML = data.length ? data.map(msg => {
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
        }).join('') : '<tr><td colspan="4">Aucun message</td></tr>';
    } catch (err) { console.error(err); }
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
    if (!artisteId || !message) { showToast('Veuillez sélectionner un artiste et écrire un message.', 'warning'); return; }
    const { error } = await supabaseAdmin.from('public_artiste_suivi_messages').insert([{
        artiste_id: artisteId, sender: 'admin', content: message, created_at: new Date().toISOString()
    }]);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else { showToast('Message envoyé', 'success'); document.getElementById('adminMessage').value = ''; loadAllMessages(); }
}
// ========== FIN : ONGLET MESSAGES ==========

// ========== DÉBUT : ÉVÉNEMENTS GÉNÉRAUX ==========
document.getElementById('searchInput').addEventListener('input', renderArtistesTable);
document.getElementById('roleFilter').addEventListener('change', renderArtistesTable);
document.getElementById('statusFilter').addEventListener('change', renderArtistesTable);
document.getElementById('refreshStatsBtn').addEventListener('click', () => { loadArtistes(); showToast('Rafraîchi', 'info'); });
document.getElementById('searchExamen').addEventListener('input', renderExamensTable);
document.getElementById('examenStatusFilter').addEventListener('change', renderExamensTable);
document.getElementById('refreshExamens').addEventListener('click', loadExamens);
document.getElementById('searchAnalyse').addEventListener('input', renderAnalysesTable);
document.getElementById('analyseStatusFilter').addEventListener('change', renderAnalysesTable);
document.getElementById('refreshAnalyses').addEventListener('click', loadAnalyses);
document.getElementById('sendGlobalMsgBtn').addEventListener('click', sendGlobalMessage);
document.getElementById('saveExamenBtn').addEventListener('click', saveExamenCorrection);
document.getElementById('saveAnalyseBtn').addEventListener('click', saveAnalyseEvaluation);

document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', e => { if (e.target.classList.contains('modal')) closeAllModals(); });

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', e => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active'); menuToggle.classList.remove('open');
        }
    });
}
document.getElementById('logoutBtn')?.addEventListener('click', e => { 
    e.preventDefault(); 
    localStorage.removeItem('hubiLang');
    window.location.href = '../../../index.html'; 
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadArtistes();
    populateArtisteSelect();
});
// ========== FIN DE ARTISTES-ADMIN.JS ==========