// ========== TEST-ECRIT-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Éléments DOM
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

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
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

// Gestion des onglets
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
if (tabBtns.length && tabContents.length) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.classList.add('active');
            if (tabId === 'corrections') loadCopies();
            else if (tabId === 'epreuves') loadEpreuves();
        });
    });
}

// ========== GESTION DES ÉPREUVES ==========
let currentEpreuveId = null;
const epreuvesList = document.getElementById('epreuvesList');
const newEpreuveBtn = document.getElementById('newEpreuveBtn');
const epreuveModal = document.getElementById('epreuveModal');
const epreuveForm = document.getElementById('epreuveForm');
const modalTitle = document.getElementById('modalTitle');
const epreuveIdField = document.getElementById('epreuveId');
const modalSport = document.getElementById('modalSport');
const modalTitre = document.getElementById('modalTitre');
const modalActive = document.getElementById('modalActive');
const qcmContainer = document.getElementById('qcmContainer');
const addQcmBtn = document.getElementById('addQcmBtn');
const redac1Container = document.getElementById('redac1Container');
const redac2Container = document.getElementById('redac2Container');
const closeModalBtns = document.querySelectorAll('.close-modal');

async function loadEpreuves() {
    if (!epreuvesList) return;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_epreuves').select('*').order('sport', { ascending: true });
        if (error) throw error;
        renderEpreuves(data || []);
    } catch (err) { showToast('Erreur chargement épreuves', 'error'); } finally { hideLoader(); }
}
function renderEpreuves(epreuves) {
    if (!epreuvesList) return;
    if (!epreuves.length) { epreuvesList.innerHTML = '<p>Aucune épreuve.</p>'; return; }
    epreuvesList.innerHTML = epreuves.map(ep => `
        <div class="epreuve-card">
            <h3>${escapeHtml(ep.titre)}</h3>
            <p>Sport : ${escapeHtml(ep.sport)}</p>
            <p>${ep.active ? '<span class="epreuve-badge">Active</span>' : '<span class="epreuve-badge" style="background:#ccc;">Inactive</span>'}</p>
            <div class="card-actions">
                <button class="btn-edit" data-id="${ep.id}"><i class="fas fa-edit"></i> Modifier</button>
                <button class="btn-delete" data-id="${ep.id}"><i class="fas fa-trash"></i> Supprimer</button>
                <button class="btn-toggle" data-id="${ep.id}" data-active="${ep.active}"><i class="fas fa-power-off"></i> ${ep.active ? 'Désactiver' : 'Activer'}</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editEpreuve(btn.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteEpreuve(btn.dataset.id)));
    document.querySelectorAll('.btn-toggle').forEach(btn => btn.addEventListener('click', () => toggleEpreuve(btn.dataset.id, btn.dataset.active === 'true')));
}
async function editEpreuve(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_epreuves').select('*').eq('id', id).single();
        if (error) throw error;
        currentEpreuveId = data.id;
        if (modalTitle) modalTitle.textContent = 'Modifier l\'épreuve';
        if (epreuveIdField) epreuveIdField.value = data.id;
        if (modalSport) modalSport.value = data.sport;
        if (modalTitre) modalTitre.value = data.titre;
        if (modalActive) modalActive.checked = data.active;
        const questions = data.questions;
        if (qcmContainer) {
            qcmContainer.innerHTML = '';
            if (questions.qcm) questions.qcm.forEach((q, idx) => addQcmBlock(q.question, q.options, q.correct, idx));
            else for (let i = 0; i < 10; i++) addQcmBlock();
        }
        if (redac1Container && questions.redaction1) {
            redac1Container.innerHTML = `
                <div class="qcm-item">
                    <label>Question rédactionnelle 1</label>
                    <textarea id="redac1_question" rows="3">${escapeHtml(questions.redaction1.question)}</textarea>
                    <label>Instruction</label>
                    <input type="text" id="redac1_instruction" value="${escapeHtml(questions.redaction1.instruction || '')}">
                </div>
            `;
        }
        if (redac2Container && questions.redaction2) {
            redac2Container.innerHTML = `
                <div class="qcm-item">
                    <label>Question rédactionnelle 2</label>
                    <textarea id="redac2_question" rows="3">${escapeHtml(questions.redaction2.question)}</textarea>
                    <label>Instruction</label>
                    <input type="text" id="redac2_instruction" value="${escapeHtml(questions.redaction2.instruction || '')}">
                </div>
            `;
        }
        if (epreuveModal) epreuveModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement épreuve', 'error'); } finally { hideLoader(); }
}
async function deleteEpreuve(id) {
    if (!confirm('Supprimer définitivement cette épreuve ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_epreuves').delete().eq('id', id);
        if (error) throw error;
        showToast('Épreuve supprimée', 'success');
        loadEpreuves();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
async function toggleEpreuve(id, currentActive) {
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_epreuves').update({ active: !currentActive }).eq('id', id);
        if (error) throw error;
        showToast(`Épreuve ${!currentActive ? 'activée' : 'désactivée'}`, 'success');
        loadEpreuves();
    } catch (err) { showToast('Erreur mise à jour', 'error'); } finally { hideLoader(); }
}
function addQcmBlock(question = '', options = ['', '', ''], correct = 0, index = null) {
    if (!qcmContainer) return;
    const div = document.createElement('div');
    div.className = 'qcm-item';
    div.innerHTML = `
        <label>Question</label>
        <textarea class="qcm-question" rows="2">${escapeHtml(question)}</textarea>
        <div class="qcm-options">
            ${options.map((opt, i) => `<div class="qcm-option"><label>Option ${String.fromCharCode(65+i)}</label><input type="text" class="qcm-opt" value="${escapeHtml(opt)}"></div>`).join('')}
        </div>
        <label>Bonne réponse (index 0-${options.length-1})</label>
        <input type="number" class="qcm-correct" value="${correct}" min="0" max="${options.length-1}">
        <button type="button" class="btn-remove-qcm">Supprimer</button>
    `;
    div.querySelector('.btn-remove-qcm').addEventListener('click', () => div.remove());
    qcmContainer.appendChild(div);
}
if (newEpreuveBtn) {
    newEpreuveBtn.addEventListener('click', () => {
        currentEpreuveId = null;
        if (modalTitle) modalTitle.textContent = 'Nouvelle épreuve';
        if (epreuveIdField) epreuveIdField.value = '';
        if (modalSport) modalSport.value = 'football';
        if (modalTitre) modalTitre.value = '';
        if (modalActive) modalActive.checked = false;
        if (qcmContainer) { qcmContainer.innerHTML = ''; for (let i = 0; i < 10; i++) addQcmBlock(); }
        if (redac1Container) {
            redac1Container.innerHTML = `
                <div class="qcm-item">
                    <label>Question rédactionnelle 1</label>
                    <textarea id="redac1_question" rows="3"></textarea>
                    <label>Instruction</label>
                    <input type="text" id="redac1_instruction" value="">
                </div>
            `;
        }
        if (redac2Container) {
            redac2Container.innerHTML = `
                <div class="qcm-item">
                    <label>Question rédactionnelle 2</label>
                    <textarea id="redac2_question" rows="3"></textarea>
                    <label>Instruction</label>
                    <input type="text" id="redac2_instruction" value="">
                </div>
            `;
        }
        if (epreuveModal) epreuveModal.classList.add('active');
    });
}
if (addQcmBtn) addQcmBtn.addEventListener('click', () => addQcmBlock());
if (epreuveForm) {
    epreuveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = epreuveIdField ? epreuveIdField.value : null;
        const sport = modalSport ? modalSport.value : '';
        const titre = modalTitre ? modalTitre.value : '';
        const active = modalActive ? modalActive.checked : false;
        const qcmItems = document.querySelectorAll('#qcmContainer .qcm-item');
        let qcm = [];
        qcmItems.forEach(item => {
            const question = item.querySelector('.qcm-question').value;
            const options = Array.from(item.querySelectorAll('.qcm-opt')).map(inp => inp.value);
            const correct = parseInt(item.querySelector('.qcm-correct').value);
            qcm.push({ question, options, correct });
        });
        const redac1 = {
            question: document.getElementById('redac1_question') ? document.getElementById('redac1_question').value : '',
            instruction: document.getElementById('redac1_instruction') ? document.getElementById('redac1_instruction').value : ''
        };
        const redac2 = {
            question: document.getElementById('redac2_question') ? document.getElementById('redac2_question').value : '',
            instruction: document.getElementById('redac2_instruction') ? document.getElementById('redac2_instruction').value : ''
        };
        const questions = { qcm, redaction1: redac1, redaction2: redac2 };
        showLoader();
        try {
            if (id) {
                const { error } = await supabaseAdmin.from('public_epreuves').update({ sport, titre, active, questions }).eq('id', id);
                if (error) throw error;
                showToast('Épreuve modifiée', 'success');
            } else {
                const { error } = await supabaseAdmin.from('public_epreuves').insert([{ sport, titre, active, questions }]);
                if (error) throw error;
                showToast('Épreuve créée', 'success');
            }
            if (epreuveModal) epreuveModal.classList.remove('active');
            loadEpreuves();
        } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
    });
}
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (epreuveModal) epreuveModal.classList.remove('active');
        if (correctionModal) correctionModal.classList.remove('active');
    });
});

// ========== GESTION DES COPIES ==========
const copiesList = document.getElementById('copiesList');
const copySportFilter = document.getElementById('copySportFilter');
const copyStatusFilter = document.getElementById('copyStatusFilter');
const refreshCopiesBtn = document.getElementById('refreshCopiesBtn');
const correctionModal = document.getElementById('correctionModal');
const correctionCandidate = document.getElementById('correctionCandidate');
const correctionQcmNote = document.getElementById('correctionQcmNote');
const correctionReponses = document.getElementById('correctionReponses');
const correctionRedac1 = document.getElementById('correctionRedac1');
const correctionRedac2 = document.getElementById('correctionRedac2');
const correctionNoteRedac = document.getElementById('correctionNoteRedac');
const correctionCommentaire = document.getElementById('correctionCommentaire');
const saveCorrectionBtn = document.getElementById('saveCorrectionBtn');
let currentCopyId = null;

async function loadCopies() {
    if (!copiesList) return;
    showLoader();
    try {
        let query = supabaseAdmin.from('public_examens').select('*').order('date_soumission', { ascending: false });
        const sport = copySportFilter ? copySportFilter.value : 'all';
        const status = copyStatusFilter ? copyStatusFilter.value : 'all';
        if (sport !== 'all') query = query.eq('sport', sport);
        if (status !== 'all') query = query.eq('statut', status);
        const { data, error } = await query;
        if (error) throw error;
        // Récupérer les noms des candidats séparément
        const copiesWithNames = await Promise.all((data || []).map(async (copy) => {
            const { data: userData } = await supabaseAdmin.from('public_premierpas').select('full_name').eq('pp_id', copy.pp_id).single();
            return { ...copy, full_name: userData ? userData.full_name : copy.pp_id };
        }));
        renderCopies(copiesWithNames);
    } catch (err) { 
        console.error(err);
        showToast('Erreur chargement copies', 'error'); 
    } finally { hideLoader(); }
}
function renderCopies(copies) {
    if (!copiesList) return;
    if (!copies.length) { copiesList.innerHTML = '<p>Aucune copie trouvée.</p>'; return; }
    copiesList.innerHTML = copies.map(copy => {
        const statutLabel = copy.statut === 'en_attente' ? 'En attente' : 'Corrigé';
        const noteFinale = copy.note_finale !== null ? `${copy.note_finale}/20` : 'Non corrigée';
        return `
            <div class="copy-card" data-copy-id="${copy.id}">
                <h3>${escapeHtml(copy.full_name)}</h3>
                <p>Sport : ${escapeHtml(copy.sport)} | Statut : ${statutLabel}</p>
                <p>Note QCM : ${copy.note_qcm}/10 | Note finale : ${noteFinale}</p>
                <p>Soumis le : ${new Date(copy.date_soumission).toLocaleString()}</p>
                <div class="card-actions">
                    <button class="btn-correct" data-id="${copy.id}"><i class="fas fa-check-circle"></i> Corriger</button>
                </div>
            </div>
        `;
    }).join('');
    // Attacher les événements aux boutons "Corriger"
    document.querySelectorAll('.btn-correct').forEach(btn => {
        btn.removeEventListener('click', correctionClickHandler);
        btn.addEventListener('click', correctionClickHandler);
    });
}
function correctionClickHandler(e) {
    const id = e.currentTarget.getAttribute('data-id');
    if (id) openCorrectionModal(id);
}
async function openCorrectionModal(copyId) {
    currentCopyId = copyId;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_examens').select('*').eq('id', copyId).single();
        if (error) throw error;
        // Récupérer le nom du candidat
        const { data: userData } = await supabaseAdmin.from('public_premierpas').select('full_name').eq('pp_id', data.pp_id).single();
        const candidateName = userData ? userData.full_name : data.pp_id;
        if (correctionCandidate) correctionCandidate.textContent = `${candidateName} (${data.sport}) - ID: ${data.pp_id}`;
        if (correctionQcmNote) correctionQcmNote.textContent = `${data.note_qcm}/10`;
        // Afficher les réponses QCM
        const qcmReponses = data.reponses_qcm;
        const { data: epreuveData } = await supabaseAdmin.from('public_epreuves').select('questions').eq('id', data.epreuve_id).single();
        if (epreuveData && correctionReponses) {
            let html = '<ul>';
            epreuveData.questions.qcm.forEach((q, idx) => {
                const userChoice = qcmReponses[idx];
                const isCorrect = (userChoice === q.correct);
                html += `<li><strong>Q${idx+1}:</strong> ${escapeHtml(q.question)}<br>Réponse: ${escapeHtml(q.options[userChoice])} ${isCorrect ? '✅' : '❌'} (bonne: ${escapeHtml(q.options[q.correct])})</li>`;
            });
            html += '</ul>';
            correctionReponses.innerHTML = html;
        }
        if (correctionRedac1) correctionRedac1.innerHTML = `<strong>Réponse question 11 :</strong><br>${escapeHtml(data.reponse_q11).replace(/\n/g, '<br>')}`;
        if (correctionRedac2) correctionRedac2.innerHTML = `<strong>Réponse question 12 :</strong><br>${escapeHtml(data.reponse_q12).replace(/\n/g, '<br>')}`;
        if (correctionNoteRedac) correctionNoteRedac.value = data.note_redaction !== null ? data.note_redaction : '';
        if (correctionCommentaire) correctionCommentaire.value = data.commentaire_admin || '';
        if (correctionModal) correctionModal.classList.add('active');
    } catch (err) { 
        console.error(err);
        showToast('Erreur chargement copie', 'error'); 
    } finally { hideLoader(); }
}
if (saveCorrectionBtn) {
    saveCorrectionBtn.addEventListener('click', async () => {
        const noteRedac = parseFloat(correctionNoteRedac ? correctionNoteRedac.value : 0);
        if (isNaN(noteRedac) || noteRedac < 0 || noteRedac > 10) { showToast('La note de rédaction doit être entre 0 et 10', 'warning'); return; }
        const qcmNoteText = correctionQcmNote ? correctionQcmNote.textContent : '0/10';
        const qcmNote = parseFloat(qcmNoteText.split('/')[0]) || 0;
        const noteFinale = qcmNote + noteRedac;
        const commentaire = correctionCommentaire ? correctionCommentaire.value : '';
        showLoader();
        try {
            const { error } = await supabaseAdmin.from('public_examens').update({
                note_redaction: noteRedac,
                note_finale: noteFinale,
                statut: 'corrige',
                commentaire_admin: commentaire,
                date_correction: new Date().toISOString()
            }).eq('id', currentCopyId);
            if (error) throw error;
            // Envoyer un message au candidat
            const { data: exam } = await supabaseAdmin.from('public_examens').select('pp_id').eq('id', currentCopyId).single();
            if (exam) {
                await supabaseAdmin.from('public_suivi_messages').insert([{
                    pp_id: exam.pp_id,
                    sender: 'admin',
                    content: `Votre examen a été corrigé. Note finale : ${noteFinale}/20. Commentaire : ${commentaire}`
                }]);
            }
            showToast('Correction enregistrée et notification envoyée', 'success');
            if (correctionModal) correctionModal.classList.remove('active');
            loadCopies(); // Recharge la liste des copies
        } catch (err) { showToast('Erreur sauvegarde correction', 'error'); } finally { hideLoader(); }
    });
}
if (refreshCopiesBtn) refreshCopiesBtn.addEventListener('click', loadCopies);
if (copySportFilter) copySportFilter.addEventListener('change', loadCopies);
if (copyStatusFilter) copyStatusFilter.addEventListener('change', loadCopies);

// Menu mobile
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) { navLinks.classList.remove('active'); menuToggle.classList.remove('open'); } });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion (fonctionnalité à venir)', 'info'); });

// Initialisation
loadEpreuves();
loadCopies();