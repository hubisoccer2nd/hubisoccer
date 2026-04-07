// ========== TEST-PRATIQUE-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentSoumission = null;

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
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

async function loadSoumissions() {
    showLoader();
    try {
        let query = supabaseAdmin.from('public_analyses_videos').select('*').order('date_soumission', { ascending: false });
        const sport = document.getElementById('sportFilter').value;
        const status = document.getElementById('statusFilter').value;
        if (sport !== 'all') query = query.eq('sport', sport);
        if (status !== 'all') query = query.eq('statut', status);
        const { data, error } = await query;
        if (error) throw error;
        renderSoumissions(data || []);
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}
function renderSoumissions(soumissions) {
    const container = document.getElementById('soumissionsList');
    if (!soumissions.length) { container.innerHTML = '<p>Aucune soumission trouvée.</p>'; return; }
    container.innerHTML = soumissions.map(s => `
        <div class="soumission-card" data-id="${s.id}">
            <h3>${escapeHtml(s.nom)} ${escapeHtml(s.prenom)}</h3>
            <p><strong>ID:</strong> ${escapeHtml(s.pp_id)}</p>
            <p><strong>Sport:</strong> ${escapeHtml(s.sport)} | <strong>Poste:</strong> ${escapeHtml(s.poste)}</p>
            <p><strong>Soumis le:</strong> ${new Date(s.date_soumission).toLocaleString()}</p>
            <div class="badge ${s.statut}">${s.statut === 'en_attente' ? 'En attente' : s.statut === 'valide' ? 'Validé' : 'Rejeté'}</div>
            <div class="card-actions">
                <button class="btn-detail" data-id="${s.id}">Voir détails</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.btn-detail').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id)));
}
async function openModal(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_analyses_videos').select('*').eq('id', id).single();
        if (error) throw error;
        currentSoumission = data;
        document.getElementById('detailInfo').innerHTML = `
            <p><strong>Candidat:</strong> ${escapeHtml(data.nom)} ${escapeHtml(data.prenom)}</p>
            <p><strong>ID:</strong> ${escapeHtml(data.pp_id)}</p>
            <p><strong>Sport:</strong> ${escapeHtml(data.sport)} | <strong>Poste:</strong> ${escapeHtml(data.poste)}</p>
            <p><strong>Statut actuel:</strong> ${data.statut === 'en_attente' ? 'En attente' : data.statut === 'valide' ? 'Validé' : 'Rejeté'}</p>
        `;
        document.getElementById('video1Player').src = data.video1_url;
        document.getElementById('video2Player').src = data.video2_url;
        document.getElementById('modalStatut').value = data.statut;
        document.getElementById('modalCommentaire').value = data.commentaire_admin || '';
        document.getElementById('detailModal').classList.add('active');
    } catch (err) { showToast('Erreur chargement détails', 'error'); } finally { hideLoader(); }
}
async function saveChanges() {
    if (!currentSoumission) return;
    const newStatut = document.getElementById('modalStatut').value;
    const commentaire = document.getElementById('modalCommentaire').value;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_analyses_videos').update({
            statut: newStatut,
            commentaire_admin: commentaire,
            date_traitement: new Date().toISOString()
        }).eq('id', currentSoumission.id);
        if (error) throw error;
        // Envoyer un message au candidat via public_suivi_messages
        const messageContent = `Votre test pratique a été mis à jour. Statut : ${newStatut === 'valide' ? 'Validé' : newStatut === 'rejete' ? 'Rejeté' : 'En attente'}. Commentaire : ${commentaire || 'Aucun commentaire.'}`;
        await supabaseAdmin.from('public_suivi_messages').insert([{
            pp_id: currentSoumission.pp_id,
            sender: 'admin',
            content: messageContent
        }]);
        showToast('Modifications enregistrées et notification envoyée', 'success');
        document.getElementById('detailModal').classList.remove('active');
        loadSoumissions();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
}

document.getElementById('refreshBtn').addEventListener('click', loadSoumissions);
document.getElementById('sportFilter').addEventListener('change', loadSoumissions);
document.getElementById('statusFilter').addEventListener('change', loadSoumissions);
document.getElementById('saveBtn').addEventListener('click', saveChanges);
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => document.getElementById('detailModal').classList.remove('active')));

// Menu mobile
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
}
document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion (à venir)', 'info'); });
loadSoumissions();