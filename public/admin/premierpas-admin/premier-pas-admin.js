// ========== PREMIER-PAS-ADMIN.JS ==========
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

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getSportLabel(code) {
    const labels = {
        football: 'Football', basketball: 'Basketball', tennis: 'Tennis',
        athletisme: 'Athlétisme', handball: 'Handball', volleyball: 'Volley‑ball',
        rugby: 'Rugby', natation: 'Natation', arts_martiaux: 'Arts martiaux', cyclisme: 'Cyclisme'
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

// ========== DÉBUT : CHARGEMENT DES SPORTIFS ==========
async function loadSportifs() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_premierpas')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allInscriptions = data || [];
        renderSportifsTable();
        updateStats();
    } catch (err) { showToast('Erreur chargement sportifs', 'error'); }
    finally { hideLoader(); }
}
// ========== FIN : CHARGEMENT DES SPORTIFS ==========

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

// ========== DÉBUT : TABLEAU SPORTIFS ==========
function getFilteredSportifs() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const sport = document.getElementById('sportFilter').value;
    const st = document.getElementById('statusFilter').value;
    return allInscriptions.filter(ins =>
        (ins.full_name.toLowerCase().includes(q) || ins.pp_id.toLowerCase().includes(q)) &&
        (sport === 'all' || ins.sport === sport) &&
        (st === 'all' || ins.status === st)
    );
}

function renderSportifsTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const filtered = getFilteredSportifs();
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8">Aucun sportif trouvé</td></tr>'; return; }
    tbody.innerHTML = filtered.map(ins => `
        <tr data-ppid="${ins.pp_id}">
            <td class="id-cell" title="${escapeHtml(ins.pp_id)}">${escapeHtml(ins.pp_id.substring(0,10))}...</td>
            <td>${escapeHtml(ins.full_name)}</td>
            <td>${getSportLabel(ins.sport)}</td>
            <td>${escapeHtml(ins.email || '-')}</td>
            <td>${escapeHtml(ins.phone)}</td>
            <td>${formatDate(ins.created_at)}</td>
            <td><span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-ppid="${ins.pp_id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                ${ins.status !== 'valide_public' ? `<button class="btn-icon btn-approve" data-ppid="${ins.pp_id}" title="Approuver"><i class="fas fa-check-circle"></i></button>` : ''}
                ${ins.status !== 'rejete' ? `<button class="btn-icon btn-reject" data-ppid="${ins.pp_id}" title="Rejeter"><i class="fas fa-times-circle"></i></button>` : ''}
                ${ins.status !== 'bloque' ? `<button class="btn-icon btn-block" data-ppid="${ins.pp_id}" title="Bloquer"><i class="fas fa-ban"></i></button>` : ''}
                ${ins.status !== 'test_ecrit' ? `<button class="btn-icon btn-test-ecrit" data-ppid="${ins.pp_id}" title="Test écrit"><i class="fas fa-pencil-alt"></i></button>` : ''}
                ${ins.status !== 'test_pratique' ? `<button class="btn-icon btn-test-pratique" data-ppid="${ins.pp_id}" title="Test pratique"><i class="fas fa-video"></i></button>` : ''}
                <button class="btn-icon btn-delete" data-ppid="${ins.pp_id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
    // événements
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => openApproveModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => openRejectModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-block').forEach(b => b.addEventListener('click', () => openBlockModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-test-ecrit').forEach(b => b.addEventListener('click', () => openTestEcritModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-test-pratique').forEach(b => b.addEventListener('click', () => openTestPratiqueModal(b.dataset.ppid)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => openDeleteModal(b.dataset.ppid)));
}
// ========== FIN : TABLEAU SPORTIFS ==========

// ========== DÉBUT : MODALE VISUALISATION (avec Quill) ==========
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

async function openViewModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    const viewContent = document.getElementById('viewContent');
    viewContent.innerHTML = `
        <div class="view-details">
            <div class="detail-section"><h4><i class="fas fa-user"></i> Identité</h4>
                <p><strong>Nom :</strong> ${escapeHtml(ins.full_name)}</p>
                <p><strong>Date de naissance :</strong> ${formatDate(ins.birth_date)}</p>
                <p><strong>Email :</strong> ${escapeHtml(ins.email || '-')}</p>
                <p><strong>Téléphone :</strong> ${escapeHtml(ins.phone)}</p>
                <p><strong>Sport :</strong> ${getSportLabel(ins.sport)}</p>
                <p><strong>Rôle :</strong> ${escapeHtml(ins.role)}</p>
                <p><strong>Statut :</strong> <span class="status-badge ${getStatusClass(ins.status)}">${getStatusLabel(ins.status)}</span></p>
                <p><strong>Date :</strong> ${formatDate(ins.created_at)}</p>
                ${ins.parent_name ? `<p><strong>Parent / tuteur :</strong> ${escapeHtml(ins.parent_name)}</p>` : ''}
                ${ins.inscription_code ? `<p><strong>Code d'inscription :</strong> ${escapeHtml(ins.inscription_code)}</p>` : ''}
                ${ins.affiliate_id ? `<p><strong>ID affilié :</strong> ${escapeHtml(ins.affiliate_id)}</p>` : ''}
            </div>
            <div class="detail-section"><h4><i class="fas fa-file-alt"></i> Documents</h4>
                <p>Diplôme : ${ins.diploma_url ? `<a href="${escapeHtml(ins.diploma_url)}" target="_blank">Télécharger</a>` : '-'}</p>
                <p>Pièce d'identité : ${ins.id_card_url ? `<a href="${escapeHtml(ins.id_card_url)}" target="_blank">Télécharger</a>` : '-'}</p>
            </div>
            <div class="detail-section"><h4><i class="fas fa-comments"></i> Messagerie</h4>
                <div id="adminMessagesContainer" class="messages-container"></div>
                <div class="message-compose">
                    <div id="viewMessageEditor" style="height:120px;"></div>
                    <button id="sendViewMsgBtn" class="btn-send"><i class="fas fa-paper-plane"></i> Envoyer</button>
                </div>
            </div>
        </div>
    `;

    // Nettoyer l'ancien Quill s'il existe
    if (viewQuill) {
        viewQuill = null;
    }
    // Initialiser Quill
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

    // Charger les messages
    loadMessages(ins.pp_id);

    // Bouton envoi
    document.getElementById('sendViewMsgBtn').addEventListener('click', sendViewMessage);

    document.getElementById('viewModal').classList.add('active');
}

async function loadMessages(ppId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_suivi_messages')
            .select('*')
            .eq('pp_id', ppId)
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
            .from('public_suivi_messages')
            .insert([{ pp_id: currentInscription.pp_id, sender: 'admin', content, created_at: new Date().toISOString() }]);
        if (error) throw error;
        viewQuill.root.innerHTML = '';
        await loadMessages(currentInscription.pp_id);
        showToast('Message envoyé', 'success');
    } catch (err) { showToast('Erreur envoi', 'error'); }
    finally { hideLoader(); }
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : APPROBATION ==========
function openApproveModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
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
        <p><strong>Sport :</strong> ${getSportLabel(ins.sport)}</p>
    `;

    document.getElementById('confirmApprovalBtn').onclick = async () => {
        showLoader();
        try {
            const updateData = { status: 'valide_public', updated_at: new Date().toISOString() };
            if (!ins.login) {
                updateData.login = login;
                updateData.mot_de_passe_hash = hashPassword(password);
            }
            const { error } = await supabaseAdmin.from('public_premierpas').update(updateData).eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            currentInscription.status = 'valide_public';
            if (!ins.login) {
                currentInscription.login = login;
                currentInscription.mot_de_passe_hash = hashPassword(password);
            }
            showToast('Sportif approuvé', 'success');
            closeAllModals();
            loadSportifs();
        } catch (err) { showToast('Erreur approbation', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('approveModal').classList.add('active');
}
// ========== FIN : APPROBATION ==========

// ========== DÉBUT : REJET ==========
function openRejectModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('rejectReason').value = '';
    document.getElementById('confirmRejectBtn').onclick = async () => {
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) { showToast('Veuillez indiquer un motif', 'warning'); return; }
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_premierpas')
                .update({
                    status: 'rejete',
                    role_data: { ... (ins.role_data || {}), motif_rejet: reason },
                    updated_at: new Date().toISOString()
                })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            currentInscription.status = 'rejete';
            showToast('Sportif rejeté', 'success');
            closeAllModals();
            loadSportifs();
        } catch (err) { showToast('Erreur rejet', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('rejectModal').classList.add('active');
}
// ========== FIN : REJET ==========

// ========== DÉBUT : BLOCAGE ==========
function openBlockModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmBlockBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_premierpas')
                .update({ status: 'bloque', updated_at: new Date().toISOString() })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            currentInscription.status = 'bloque';
            showToast('Sportif bloqué', 'success');
            closeAllModals();
            loadSportifs();
        } catch (err) { showToast('Erreur blocage', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('blockModal').classList.add('active');
}
// ========== FIN : BLOCAGE ==========

// ========== DÉBUT : TEST ÉCRIT ==========
function openTestEcritModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmTestEcritBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_premierpas')
                .update({ status: 'test_ecrit', updated_at: new Date().toISOString() })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            currentInscription.status = 'test_ecrit';
            showToast('Sportif envoyé en test écrit', 'success');
            closeAllModals();
            loadSportifs();
        } catch (err) { showToast('Erreur', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('testEcritModal').classList.add('active');
}
// ========== FIN : TEST ÉCRIT ==========

// ========== DÉBUT : TEST PRATIQUE ==========
function openTestPratiqueModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmTestPratiqueBtn').onclick = async () => {
        showLoader();
        try {
            const { error } = await supabaseAdmin
                .from('public_premierpas')
                .update({ status: 'test_pratique', updated_at: new Date().toISOString() })
                .eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            currentInscription.status = 'test_pratique';
            showToast('Sportif envoyé en test pratique', 'success');
            closeAllModals();
            loadSportifs();
        } catch (err) { showToast('Erreur', 'error'); }
        finally { hideLoader(); }
    };
    document.getElementById('testPratiqueModal').classList.add('active');
}
// ========== FIN : TEST PRATIQUE ==========

// ========== DÉBUT : SUPPRESSION ==========
function openDeleteModal(ppId) {
    const ins = allInscriptions.find(i => i.pp_id === ppId);
    if (!ins) return;
    currentInscription = ins;

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        showLoader();
        try {
            await supabaseAdmin.from('public_suivi_messages').delete().eq('pp_id', currentInscription.pp_id);
            const { error } = await supabaseAdmin.from('public_premierpas').delete().eq('pp_id', currentInscription.pp_id);
            if (error) throw error;
            allInscriptions = allInscriptions.filter(i => i.pp_id !== currentInscription.pp_id);
            showToast('Sportif supprimé', 'success');
            closeAllModals();
            renderSportifsTable();
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
            .from('public_examens')
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
        const sportif = allInscriptions.find(a => a.pp_id === ex.pp_id);
        const sportifNom = sportif ? sportif.full_name : ex.pp_id;
        return `
            <tr>
                <td>${escapeHtml(sportifNom)}</td>
                <td>${escapeHtml(ex.pp_id)}</td>
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
        .from('public_examens')
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
            .from('public_analyses_videos')
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
        const sportif = allInscriptions.find(a => a.pp_id === an.pp_id);
        const sportifNom = sportif ? sportif.full_name : an.pp_id;
        let statusBadge = '';
        switch (an.statut) {
            case 'valide': statusBadge = 'status-valide_public'; break;
            case 'rejete': statusBadge = 'status-rejete'; break;
            default: statusBadge = 'status-en_attente';
        }
        return `
            <tr>
                <td>${escapeHtml(sportifNom)}</td>
                <td>${escapeHtml(an.pp_id)}</td>
                <td><span class="status-badge ${statusBadge}">${an.statut === 'valide' ? 'Validé' : an.statut === 'rejete' ? 'Rejeté' : 'En attente'}</span></td>
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
        .from('public_analyses_videos')
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
            .from('public_suivi_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        const tbody = document.getElementById('messagesBody');
        if (!tbody) return;
        tbody.innerHTML = data.length ? data.map(msg => {
            const sportif = allInscriptions.find(a => a.pp_id === msg.pp_id);
            const sportifNom = sportif ? sportif.full_name : msg.pp_id;
            return `
                <tr>
                    <td>${escapeHtml(sportifNom)}</td>
                    <td>${escapeHtml(msg.content)}</td>
                    <td>${msg.sender === 'admin' ? 'Admin' : 'Sportif'}</td>
                    <td>${new Date(msg.created_at).toLocaleString('fr-FR')}</td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="4">Aucun message</td></tr>';
    } catch (err) { console.error(err); }
}

async function populateSportifSelect() {
    const { data, error } = await supabaseAdmin.from('public_premierpas').select('pp_id, full_name').order('full_name');
    if (error) return;
    const select = document.getElementById('targetSportif');
    if (!select) return;
    select.innerHTML = '<option value="">Sélectionner un sportif</option>';
    data.forEach(s => {
        select.innerHTML += `<option value="${s.pp_id}">${escapeHtml(s.full_name)} (${s.pp_id})</option>`;
    });
}

async function sendGlobalMessage() {
    const ppId = document.getElementById('targetSportif').value;
    const message = document.getElementById('adminMessage').value.trim();
    if (!ppId || !message) { showToast('Veuillez sélectionner un sportif et écrire un message.', 'warning'); return; }
    const { error } = await supabaseAdmin.from('public_suivi_messages').insert([{
        pp_id: ppId, sender: 'admin', content: message, created_at: new Date().toISOString()
    }]);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else { showToast('Message envoyé', 'success'); document.getElementById('adminMessage').value = ''; loadAllMessages(); }
}
// ========== FIN : ONGLET MESSAGES ==========

// ========== DÉBUT : ÉVÉNEMENTS GÉNÉRAUX ==========
document.getElementById('searchInput').addEventListener('input', renderSportifsTable);
document.getElementById('sportFilter').addEventListener('change', renderSportifsTable);
document.getElementById('statusFilter').addEventListener('change', renderSportifsTable);
document.getElementById('refreshStatsBtn').addEventListener('click', () => { loadSportifs(); showToast('Rafraîchi', 'info'); });
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
document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); showToast('Déconnexion', 'info'); });

// ========== GESTION DES ONGLETS ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'sportifs') loadSportifs();
        else if (tabId === 'examens') loadExamens();
        else if (tabId === 'analyses') loadAnalyses();
        else if (tabId === 'messages') { loadAllMessages(); populateSportifSelect(); }
    });
});

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadSportifs();
    populateSportifSelect();
});
// ========== FIN DE PREMIER-PAS-ADMIN.JS ==========