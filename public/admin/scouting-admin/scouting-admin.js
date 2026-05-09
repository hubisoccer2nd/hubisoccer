// ========== SCOUTING-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

const sportifsList = document.getElementById('sportifsList');
const refreshBtn = document.getElementById('refreshBtn');
const newSportifBtn = document.getElementById('newSportifBtn');
let currentSportifId = null;

async function loadSportifs() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_scouting_sportifs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderSportifs(data || []);
    } catch (err) { showToast('Erreur chargement sportifs', 'error'); } finally { hideLoader(); }
}
function renderSportifs(sportifs) {
    if (!sportifsList) return;
    if (!sportifs.length) { sportifsList.innerHTML = '<p>Aucun sportif.</p>'; return; }
    let html = '';
    for (const s of sportifs) {
        const catClass = s.cat === 'mineur' ? 'mineur' : 'adulte';
        const catLabel = s.cat === 'mineur' ? 'U17' : '18+';
        html += `
            <div class="sportif-card" data-id="${s.id}">
                <h3>${escapeHtml(s.nom)}</h3>
                <p><strong>Poste:</strong> ${escapeHtml(s.poste || '-')}</p>
                <p><strong>Pays:</strong> ${escapeHtml(s.pays || '-')} | <strong>Âge:</strong> ${s.age || '-'} ans</p>
                <p><strong>Club:</strong> ${escapeHtml(s.club || '-')}</p>
                <p><strong>Certification:</strong> ${escapeHtml(s.cert || '-')}</p>
                <div class="badge ${catClass}">${catLabel}</div>
                <div class="card-actions">
                    <button class="btn-edit" data-id="${s.id}">✏️ Modifier</button>
                    <button class="btn-video" data-id="${s.id}" data-video="${escapeHtml(s.video_url || '')}">🎬 Vidéo</button>
                    <button class="btn-delete" data-id="${s.id}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }
    sportifsList.innerHTML = html;
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editSportif(btn.dataset.id)));
    document.querySelectorAll('.btn-video').forEach(btn => btn.addEventListener('click', () => showVideoModal(btn.dataset.video)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteSportif(btn.dataset.id)));
}

const modal = document.getElementById('sportifModal');
const modalTitle = document.getElementById('modalTitle');
const sportifForm = document.getElementById('sportifForm');
const sportifIdField = document.getElementById('sportifId');
const nomInput = document.getElementById('nom');
const posteInput = document.getElementById('poste');
const ageInput = document.getElementById('age');
const paysInput = document.getElementById('pays');
const continentSelect = document.getElementById('continent');
const catSelect = document.getElementById('cat');
const clubInput = document.getElementById('club');
const certInput = document.getElementById('cert');
const imageUploadBox = document.getElementById('imageUploadBox');
const imageInput = document.getElementById('imageFile');
const videoUrlInput = document.getElementById('videoUrl');
const imagePreview = document.getElementById('imagePreview');
const closeModalBtns = document.querySelectorAll('.close-modal');

let currentImageFile = null;

function resetForm() {
    sportifIdField.value = '';
    nomInput.value = '';
    posteInput.value = '';
    ageInput.value = '';
    paysInput.value = '';
    continentSelect.value = 'Afrique';
    catSelect.value = 'adulte';
    clubInput.value = '';
    certInput.value = '';
    videoUrlInput.value = '';
    currentImageFile = null;
    imagePreview.innerHTML = '<p>Aucune image sélectionnée</p>';
    const span = imageUploadBox.querySelector('span:not(.progress-text)');
    if (span) span.textContent = 'Cliquez pour télécharger une image (JPG, PNG)';
    imageUploadBox.classList.remove('success', 'uploading');
    const progressIndicator = imageUploadBox.querySelector('.progress-indicator');
    if (progressIndicator) progressIndicator.style.display = 'none';
}

newSportifBtn.addEventListener('click', () => {
    currentSportifId = null;
    resetForm();
    modalTitle.textContent = 'Ajouter un sportif';
    modal.classList.add('active');
});

async function editSportif(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_scouting_sportifs')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        currentSportifId = data.id;
        sportifIdField.value = data.id;
        nomInput.value = data.nom || '';
        posteInput.value = data.poste || '';
        ageInput.value = data.age || '';
        paysInput.value = data.pays || '';
        continentSelect.value = data.continent || 'Afrique';
        catSelect.value = data.cat || 'adulte';
        clubInput.value = data.club || '';
        certInput.value = data.cert || '';
        videoUrlInput.value = data.video_url || '';
        if (data.image_url) {
            imagePreview.innerHTML = `<img src="${data.image_url}" style="max-width:100%; max-height:150px; border-radius:10px;">`;
        } else {
            imagePreview.innerHTML = '<p>Aucune image</p>';
        }
        modalTitle.textContent = 'Modifier le sportif';
        modal.classList.add('active');
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}

async function deleteSportif(id) {
    if (!confirm('Supprimer définitivement ce sportif ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_scouting_sportifs')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Sportif supprimé', 'success');
        loadSportifs();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

imageUploadBox.addEventListener('click', () => {
    imageInput.value = '';
    imageInput.click();
});
imageInput.addEventListener('change', () => {
    if (imageInput.files.length) {
        currentImageFile = imageInput.files[0];
        const fileName = currentImageFile.name;
        const span = imageUploadBox.querySelector('span:not(.progress-text)');
        if (span) span.textContent = fileName;
        imagePreview.innerHTML = `<p>Fichier sélectionné : ${escapeHtml(fileName)}</p>`;
        imageUploadBox.style.borderColor = 'var(--primary)';
    }
});

async function uploadImage(file) {
    if (!file) return null;
    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `sportifs/${safeName}`;
    const { error } = await supabaseAdmin.storage
        .from('scouting_medias')
        .upload(filePath, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage
        .from('scouting_medias')
        .getPublicUrl(filePath);
    return urlData.publicUrl;
}

sportifForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = nomInput.value.trim();
    const poste = posteInput.value.trim() || null;
    const age = ageInput.value ? parseInt(ageInput.value) : null;
    const pays = paysInput.value.trim() || null;
    const continent = continentSelect.value;
    const cat = catSelect.value;
    const club = clubInput.value.trim() || null;
    const cert = certInput.value.trim() || null;
    const videoUrl = videoUrlInput.value.trim() || null;

    if (!nom) {
        showToast('Le nom est requis', 'warning');
        return;
    }

    showLoader();
    try {
        let imageUrl = null;
        if (currentImageFile) {
            imageUrl = await uploadImage(currentImageFile);
        } else if (currentSportifId) {
            const { data: old } = await supabaseAdmin
                .from('public_scouting_sportifs')
                .select('image_url')
                .eq('id', currentSportifId)
                .single();
            if (old) imageUrl = old.image_url;
        }
        const data = {
            nom,
            poste,
            age,
            pays,
            continent,
            cat,
            club,
            cert,
            image_url: imageUrl,
            video_url: videoUrl,
            updated_at: new Date().toISOString()
        };
        if (currentSportifId) {
            const { error } = await supabaseAdmin
                .from('public_scouting_sportifs')
                .update(data)
                .eq('id', currentSportifId);
            if (error) throw error;
            showToast('Sportif modifié', 'success');
        } else {
            const { error } = await supabaseAdmin
                .from('public_scouting_sportifs')
                .insert([{ ...data, created_at: new Date().toISOString() }]);
            if (error) throw error;
            showToast('Sportif ajouté', 'success');
        }
        modal.classList.remove('active');
        loadSportifs();
        resetForm();
    } catch (err) {
        console.error(err);
        showToast('Erreur sauvegarde', 'error');
    } finally {
        hideLoader();
    }
});

const videoModal = document.getElementById('videoModal');
const videoPlayer = document.getElementById('videoPlayer');
function showVideoModal(videoUrl) {
    if (!videoUrl) {
        showToast('Aucune vidéo associée', 'info');
        return;
    }
    videoPlayer.src = videoUrl;
    videoModal.classList.add('active');
}
document.querySelectorAll('#videoModal .close-modal, #videoModal .btn-close').forEach(btn => {
    btn.addEventListener('click', () => {
        videoModal.classList.remove('active');
        videoPlayer.src = '';
    });
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
    if (e.target === videoModal) videoModal.classList.remove('active');
});

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion (à venir)', 'info'); });

loadSportifs();
refreshBtn.addEventListener('click', loadSportifs);