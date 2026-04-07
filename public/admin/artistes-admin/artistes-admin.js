// ========== ARTISTES-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
let artistes = [];
let examens = [];
let analyses = [];

// ========== STATISTIQUES ==========
async function loadStats() {
    const { data: artistesData } = await supabaseAdmin.from('public_artistes_adhesion').select('*');
    const { data: examensData } = await supabaseAdmin.from('public_artiste_examens').select('*');
    const { data: analysesData } = await supabaseAdmin.from('public_artiste_analyses').select('*');
    const { data: messagesData } = await supabaseAdmin.from('public_artiste_suivi_messages').select('*');

    const totalArtistes = artistesData?.length || 0;
    const totalEnAttente = artistesData?.filter(a => a.status === 'en_attente').length || 0;
    const totalValidés = artistesData?.filter(a => a.status === 'valide_public').length || 0;
    const totalExamens = examensData?.length || 0;
    const totalAnalyses = analysesData?.length || 0;
    const totalMessages = messagesData?.length || 0;

    const statsRow = document.getElementById('statsRow');
    if (statsRow) {
        statsRow.innerHTML = `
            <div class="stat-box"><h3>${totalArtistes}</h3><p>Artistes inscrits</p></div>
            <div class="stat-box"><h3>${totalEnAttente}</h3><p>En attente</p></div>
            <div class="stat-box"><h3>${totalValidés}</h3><p>Validés</p></div>
            <div class="stat-box"><h3>${totalExamens}</h3><p>Examens reçus</p></div>
            <div class="stat-box"><h3>${totalAnalyses}</h3><p>Tests pratiques</p></div>
            <div class="stat-box"><h3>${totalMessages}</h3><p>Messages échangés</p></div>
        `;
    }
}

// ========== ARTISTES ==========
async function loadArtistes() {
    const { data, error } = await supabaseAdmin.from('public_artistes_adhesion').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    artistes = data || [];
    renderArtistes();
}

function renderArtistes() {
    const searchTerm = document.getElementById('searchArtiste')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    let filtered = artistes;
    if (searchTerm) {
        filtered = filtered.filter(a => 
            a.artiste_id?.toLowerCase().includes(searchTerm) || 
            a.full_name?.toLowerCase().includes(searchTerm) || 
            a.phone?.includes(searchTerm)
        );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);

    const container = document.getElementById('artistesList');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun artiste trouvé.</p>';
        return;
    }
    let html = '';
    filtered.forEach(a => {
        const statusText = a.status === 'en_attente' ? '⏳ En attente' : (a.status === 'valide_public' ? '✅ Validé' : '❌ Rejeté');
        html += `
            <div class="list-item" data-id="${a.artiste_id}">
                <div class="info">
                    <strong>${escapeHtml(a.full_name)}</strong>
                    <small>ID: ${escapeHtml(a.artiste_id)}</small>
                    <small>Tél: ${escapeHtml(a.phone)}</small>
                    <small>Discipline: ${escapeHtml(a.discipline)}</small>
                    <small>Statut: ${statusText}</small>
                    <small>Soumis le: ${new Date(a.created_at).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    ${a.status === 'en_attente' ? `<button class="btn-validate" data-id="${a.artiste_id}">Valider</button>` : ''}
                    ${a.status !== 'rejete' ? `<button class="btn-reject" data-id="${a.artiste_id}">Rejeter</button>` : ''}
                    <button class="btn-view" data-id="${a.artiste_id}" data-fullname="${escapeHtml(a.full_name)}">👁️ Voir dossier</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    // Attacher événements
    container.querySelectorAll('.btn-validate').forEach(btn => {
        btn.addEventListener('click', () => validateArtiste(btn.dataset.id));
    });
    container.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => rejectArtiste(btn.dataset.id));
    });
    container.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => viewArtisteDossier(btn.dataset.id, btn.dataset.fullname));
    });
}

async function validateArtiste(id) {
    if (!confirm('Valider cet artiste ? Il pourra accéder à son espace de suivi.')) return;
    const { error } = await supabaseAdmin.from('public_artistes_adhesion').update({ status: 'valide_public' }).eq('artiste_id', id);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else { showToast('Artiste validé', 'success'); loadArtistes(); loadStats(); }
}

async function rejectArtiste(id) {
    const reason = prompt('Motif du rejet (optionnel) :');
    const { error } = await supabaseAdmin.from('public_artistes_adhesion').update({ status: 'rejete' }).eq('artiste_id', id);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else { showToast('Artiste rejeté', 'warning'); loadArtistes(); loadStats(); }
}

function viewArtisteDossier(id, fullname) {
    // Ouvrir le dossier public de l'artiste dans un nouvel onglet (page de suivi avec l'ID)
    window.open(`../../artiste-suivi.html?id=${encodeURIComponent(id)}`, '_blank');
}

// ========== EXAMENS ==========
async function loadExamens() {
    const { data, error } = await supabaseAdmin.from('public_artiste_examens').select('*').order('date_soumission', { ascending: false });
    if (error) { console.error(error); return; }
    examens = data || [];
    renderExamens();
}

function renderExamens() {
    const searchTerm = document.getElementById('searchExamen')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('examenStatusFilter')?.value || 'all';
    let filtered = examens;
    if (searchTerm) filtered = filtered.filter(e => e.artiste_id?.toLowerCase().includes(searchTerm));
    if (statusFilter !== 'all') filtered = filtered.filter(e => e.statut === statusFilter);

    const container = document.getElementById('examensList');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun examen trouvé.</p>';
        return;
    }
    let html = '';
    for (const ex of filtered) {
        const artiste = artistes.find(a => a.artiste_id === ex.artiste_id);
        const artisteNom = artiste ? artiste.full_name : ex.artiste_id;
        html += `
            <div class="list-item" data-id="${ex.id}">
                <div class="info">
                    <strong>${escapeHtml(artisteNom)}</strong>
                    <small>ID artiste: ${escapeHtml(ex.artiste_id)}</small>
                    <small>Note: ${ex.note_finale !== null ? ex.note_finale + '/20' : 'Non corrigé'}</small>
                    <small>Statut: ${ex.statut === 'en_attente' ? '⏳ En attente' : '✅ Corrigé'}</small>
                    <small>Soumis le: ${new Date(ex.date_soumission).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    ${ex.statut === 'en_attente' ? `<button class="btn-correct" data-id="${ex.id}" data-artiste="${ex.artiste_id}">📝 Corriger</button>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    container.querySelectorAll('.btn-correct').forEach(btn => {
        btn.addEventListener('click', () => openExamenModal(btn.dataset.id, btn.dataset.artiste));
    });
}

function openExamenModal(examenId, artisteId) {
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
        closeModal('examenModal');
        loadExamens();
        loadStats();
    }
}

// ========== TESTS PRATIQUES (ANALYSES) ==========
async function loadAnalyses() {
    const { data, error } = await supabaseAdmin.from('public_artiste_analyses').select('*').order('date_soumission', { ascending: false });
    if (error) { console.error(error); return; }
    analyses = data || [];
    renderAnalyses();
}

function renderAnalyses() {
    const searchTerm = document.getElementById('searchAnalyse')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('analyseStatusFilter')?.value || 'all';
    let filtered = analyses;
    if (searchTerm) filtered = filtered.filter(a => a.artiste_id?.toLowerCase().includes(searchTerm));
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.statut === statusFilter);

    const container = document.getElementById('analysesList');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun test pratique trouvé.</p>';
        return;
    }
    let html = '';
    for (const an of filtered) {
        const artiste = artistes.find(a => a.artiste_id === an.artiste_id);
        const artisteNom = artiste ? artiste.full_name : an.artiste_id;
        let statusText = an.statut === 'en_attente' ? '⏳ En attente' : (an.statut === 'valide' ? '✅ Validé' : '❌ Rejeté');
        html += `
            <div class="list-item" data-id="${an.id}">
                <div class="info">
                    <strong>${escapeHtml(artisteNom)}</strong>
                    <small>ID artiste: ${escapeHtml(an.artiste_id)}</small>
                    <small>Statut: ${statusText}</small>
                    <small>Soumis le: ${new Date(an.date_soumission).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    ${an.statut === 'en_attente' ? `<button class="btn-correct" data-id="${an.id}" data-artiste="${an.artiste_id}">📝 Évaluer</button>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    container.querySelectorAll('.btn-correct').forEach(btn => {
        btn.addEventListener('click', () => openAnalyseModal(btn.dataset.id, btn.dataset.artiste));
    });
}

function openAnalyseModal(analyseId, artisteId) {
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
        closeModal('analyseModal');
        loadAnalyses();
        loadStats();
    }
}

// ========== MESSAGES ==========
async function loadMessages() {
    const { data, error } = await supabaseAdmin
        .from('public_artiste_suivi_messages')
        .select('*, public_artistes_adhesion(full_name)')
        .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const container = document.getElementById('messagesList');
    if (!container) return;
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun message envoyé.</p>';
        return;
    }
    let html = '';
    data.forEach(msg => {
        const artisteNom = msg.public_artistes_adhesion?.full_name || msg.artiste_id;
        html += `
            <div class="list-item">
                <div class="info">
                    <strong>À: ${escapeHtml(artisteNom)}</strong>
                    <p>${escapeHtml(msg.content)}</p>
                    <small>Expéditeur: ${msg.sender === 'admin' ? 'Administrateur' : 'Artiste'} - ${new Date(msg.created_at).toLocaleString()}</small>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
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

document.getElementById('sendMessageBtn')?.addEventListener('click', async () => {
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
        loadMessages();
    }
});

// ========== UTILITAIRES ==========
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
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Fermeture modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        closeModal('examenModal');
        closeModal('analyseModal');
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal('examenModal');
        closeModal('analyseModal');
    }
});

document.getElementById('saveExamenBtn')?.addEventListener('click', saveExamenCorrection);
document.getElementById('saveAnalyseBtn')?.addEventListener('click', saveAnalyseEvaluation);

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await loadArtistes();
    await loadExamens();
    await loadAnalyses();
    await loadMessages();
    await populateArtisteSelect();

    // Rafraîchissements
    document.getElementById('refreshArtistes')?.addEventListener('click', loadArtistes);
    document.getElementById('refreshExamens')?.addEventListener('click', loadExamens);
    document.getElementById('refreshAnalyses')?.addEventListener('click', loadAnalyses);
    document.getElementById('searchArtiste')?.addEventListener('input', renderArtistes);
    document.getElementById('statusFilter')?.addEventListener('change', renderArtistes);
    document.getElementById('searchExamen')?.addEventListener('input', renderExamens);
    document.getElementById('examenStatusFilter')?.addEventListener('change', renderExamens);
    document.getElementById('searchAnalyse')?.addEventListener('input', renderAnalyses);
    document.getElementById('analyseStatusFilter')?.addEventListener('change', renderAnalyses);

    // Onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'artistes') loadArtistes();
            if (tabId === 'examens') loadExamens();
            if (tabId === 'analyses') loadAnalyses();
            if (tabId === 'messages') loadMessages();
        });
    });

    // Déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Se déconnecter ?')) window.location.href = '../../administration.html';
    });
});
