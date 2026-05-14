/* DEBUT : public/admin/test-pratique-admin/test-pratique-admin.js */
// ========== TEST-PRATIQUE-ADMIN.JS ==========
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

// ========== GESTION DES VIDÉOS ==========
const videosList = document.getElementById('videosList');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');

async function loadVideos() {
    if (!videosList) return;
    showLoader();
    try {
        let query = supabaseAdmin.from('public_analyses_videos').select('*').order('date_soumission', { ascending: false });
        const status = statusFilter ? statusFilter.value : 'all';
        if (status !== 'all') query = query.eq('statut', status);
        const { data, error } = await query;
        if (error) throw error;
        renderVideos(data || []);
    } catch (err) { showToast('Erreur chargement vidéos', 'error'); } finally { hideLoader(); }
}

function renderVideos(videos) {
    if (!videosList) return;
    if (!videos.length) { videosList.innerHTML = '<p>Aucune vidéo trouvée.</p>'; return; }
    videosList.innerHTML = videos.map(video => {
        const statutLabel = video.statut === 'en_attente' ? 'En attente' : video.statut === 'valide' ? 'Validé' : 'Rejeté';
        const statutClass = video.statut === 'valide' ? 'status-valide' : video.statut === 'rejete' ? 'status-rejete' : 'status-attente';
        return `
            <div class="video-card">
                <div class="video-preview">
                    <video src="${escapeHtml(video.video_url)}" controls style="width:100%; max-height:300px; border-radius:10px;"></video>
                </div>
                <div class="video-info">
                    <p><strong>ID Sportif :</strong> ${escapeHtml(video.pp_id)}</p>
                    <p><strong>Statut :</strong> <span class="${statutClass}">${statutLabel}</span></p>
                    <p><strong>Soumis le :</strong> ${new Date(video.date_soumission).toLocaleString()}</p>
                    ${video.commentaire_admin ? `<p><strong>Commentaire :</strong> ${escapeHtml(video.commentaire_admin)}</p>` : ''}
                    ${video.statut === 'en_attente' ? `
                        <div class="video-actions">
                            <button class="btn-approve" data-id="${video.id}"><i class="fas fa-check-circle"></i> Valider</button>
                            <button class="btn-reject" data-id="${video.id}"><i class="fas fa-times-circle"></i> Rejeter</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', () => evaluateVideo(btn.dataset.id, 'valide')));
    document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', () => evaluateVideo(btn.dataset.id, 'rejete')));
}

async function evaluateVideo(id, statut) {
    const commentaire = prompt('Commentaire (optionnel) :');
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_analyses_videos')
            .update({
                statut: statut,
                commentaire_admin: commentaire || '',
                date_traitement: new Date().toISOString()
            })
            .eq('id', id);
        if (error) throw error;
        showToast(`Vidéo ${statut === 'valide' ? 'validée' : 'rejetée'} avec succès`, 'success');
        loadVideos();
    } catch (err) { showToast('Erreur lors de l\'évaluation', 'error'); } finally { hideLoader(); }
}

if (refreshBtn) refreshBtn.addEventListener('click', loadVideos);
if (statusFilter) statusFilter.addEventListener('change', loadVideos);

// ========== MENU MOBILE & DÉCONNEXION ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) { navLinks.classList.remove('active'); menuToggle.classList.remove('open'); } });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../../../';
    });
}

// ========== INITIALISATION ==========
loadVideos();
/* FIN : public/admin/test-pratique-admin/test-pratique-admin.js */