// ========== GESTION-CLUBS.JS (CORRIGÉ DÉFINITIF – COMPLET) ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allClubs = [];
let allRoles = [];
let currentClubId = null;
let uploadedLogoUrl = null;
let uploadedBanniereUrl = null;
let missionQuill = null;
let philosophieQuill = null;
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
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : ÉDITEUR QUILL ==========
const quillToolbarOptions = [
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    ['clean']
];

function initEditors() {
    if (missionQuill) {
        missionQuill = null;
    }
    if (philosophieQuill) {
        philosophieQuill = null;
    }

    const missionEditor = document.getElementById('editorMission');
    const philosophieEditor = document.getElementById('editorPhilosophie');

    if (missionEditor) missionEditor.innerHTML = '';
    if (philosophieEditor) philosophieEditor.innerHTML = '';

    if (missionEditor) {
        missionQuill = new Quill('#editorMission', {
            theme: 'snow',
            modules: { toolbar: quillToolbarOptions },
            placeholder: 'Décrivez la mission et les objectifs du club...'
        });
    }

    if (philosophieEditor) {
        philosophieQuill = new Quill('#editorPhilosophie', {
            theme: 'snow',
            modules: { toolbar: quillToolbarOptions },
            placeholder: 'Décrivez l\'ambiance et la philosophie du club...'
        });
    }
}

function setQuillContent(quillInstance, htmlContent) {
    if (!quillInstance) return;
    if (!htmlContent || htmlContent === '<p><br></p>') {
        quillInstance.setText('');
        return;
    }
    if (!/<[a-z][\s\S]*>/i.test(htmlContent)) {
        quillInstance.setText(htmlContent);
        return;
    }
    try {
        const delta = quillInstance.clipboard.convert({ html: htmlContent });
        quillInstance.setContents(delta, 'silent');
    } catch (e) {
        quillInstance.setText(htmlContent);
    }
}
// ========== FIN : ÉDITEUR QUILL ==========

// ========== DÉBUT : CHARGEMENT DES RÔLES ==========
async function loadRoles() {
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_roles')
            .select('*')
            .order('id', { ascending: true });
        if (error) throw error;
        allRoles = data || [];
        populateDisciplineSelect();
    } catch (err) {
        console.error('Erreur chargement rôles:', err);
    }
}

function populateDisciplineSelect() {
    const select = document.getElementById('clubDiscipline');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choisir une discipline --</option>';
    allRoles.forEach(role => {
        select.innerHTML += `<option value="${role.id}">${role.nom}</option>`;
    });
}
// ========== FIN : CHARGEMENT DES RÔLES ==========

// ========== DÉBUT : CHARGEMENT DES CLUBS ==========
async function loadClubs() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_clubs')
            .select('*, nosclub_roles(nom, icone, type)')
            .order('nom', { ascending: true });
        if (error) throw error;
        allClubs = data || [];
        renderTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement clubs', 'error');
    } finally {
        hideLoader();
    }
}

function getFilteredClubs() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statut = document.getElementById('statutFilter').value;
    return allClubs.filter(club => {
        const matchSearch = club.nom.toLowerCase().includes(search) ||
                           (club.ville && club.ville.toLowerCase().includes(search));
        const matchStatut = statut === 'all' || club.statut === statut;
        return matchSearch && matchStatut;
    });
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const filtered = getFilteredClubs();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Aucun club trouvé.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(club => {
        const role = club.nosclub_roles || {};
        const quotaUtilise = club.quota_utilise || 0;
        const quotaMax = club.quota_max || 30;
        const statutBadge = club.statut === 'actif' 
            ? '<span class="status-badge status-actif">Actif</span>'
            : '<span class="status-badge status-archive">Archivé</span>';
        return `
            <tr data-clubid="${club.id}">
                <td class="id-cell">${club.id}</td>
                <td>${escapeHtml(club.nom)}</td>
                <td><i class="fas ${escapeHtml(role.icone || 'fa-users')}"></i> ${escapeHtml(role.nom || '')}</td>
                <td>${escapeHtml(club.ville || '-')}</td>
                <td>${quotaUtilise} / ${quotaMax}</td>
                <td>${statutBadge}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" data-clubid="${club.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-archive" data-clubid="${club.id}" data-statut="${club.statut}" title="${club.statut === 'actif' ? 'Archiver' : 'Désarchiver'}"><i class="fas fa-archive"></i></button>
                    <button class="btn-icon btn-delete" data-clubid="${club.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.clubid)));
    tbody.querySelectorAll('.btn-archive').forEach(btn => btn.addEventListener('click', () => toggleArchive(btn.dataset.clubid, btn.dataset.statut)));
    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.dataset.clubid)));
}
// ========== FIN : CHARGEMENT DES CLUBS ==========

// ========== DÉBUT : GESTION DU FORMULAIRE CLUB ==========
function openCreateModal() {
    currentClubId = null;
    document.getElementById('clubModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nouveau club';
    document.getElementById('clubForm').reset();
    document.getElementById('clubId').value = '';
    document.getElementById('clubQuotaMax').value = 30;
    document.getElementById('clubQuotaUtilise').value = 0;
    uploadedLogoUrl = null;
    uploadedBanniereUrl = null;
    resetUploadIndicators();
    initEditors();
    document.getElementById('clubModal').classList.add('active');
}

async function openEditModal(clubId) {
    const club = allClubs.find(c => c.id == clubId);
    if (!club) return;
    currentClubId = club.id;
    document.getElementById('clubModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le club';
    document.getElementById('clubId').value = club.id;
    document.getElementById('clubNom').value = club.nom || '';
    document.getElementById('clubDiscipline').value = club.discipline_id || '';
    document.getElementById('clubVille').value = club.ville || '';
    document.getElementById('clubQuartier').value = club.quartier || '';
    document.getElementById('clubQuotaMax').value = club.quota_max || 30;
    document.getElementById('clubQuotaUtilise').value = club.quota_utilise || 0;
    document.getElementById('clubCoachNom').value = club.coach_nom || '';
    document.getElementById('clubCoachContact').value = club.coach_contact || '';
    document.getElementById('clubParrainNom').value = club.parrain_nom || '';
    document.getElementById('clubParrainContact').value = club.parrain_contact || '';
    uploadedLogoUrl = club.logo_url || null;
    uploadedBanniereUrl = club.banniere_url || null;
    resetUploadIndicators();
    initEditors();
    setQuillContent(missionQuill, club.mission || '');
    setQuillContent(philosophieQuill, club.philosophie || '');
    document.getElementById('clubModal').classList.add('active');
}

function resetUploadIndicators() {
    document.getElementById('uploadStatusLogo').style.display = 'none';
    document.getElementById('uploadSuccessLogo').style.display = 'none';
    document.getElementById('uploadStatusBanniere').style.display = 'none';
    document.getElementById('uploadSuccessBanniere').style.display = 'none';
    document.getElementById('clubLogoFile').value = '';
    document.getElementById('clubBanniereFile').value = '';
}

async function uploadFile(file, bucket, indicatorPrefix) {
    const statusDiv = document.getElementById(`uploadStatus${indicatorPrefix}`);
    const successDiv = document.getElementById(`uploadSuccess${indicatorPrefix}`);
    if (statusDiv) statusDiv.style.display = 'flex';
    if (successDiv) successDiv.style.display = 'none';

    const safeName = `club_${Date.now()}_${indicatorPrefix.toLowerCase()}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}.${fileExt}`;

    try {
        const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
        if (statusDiv) statusDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'flex';
        return urlData.publicUrl;
    } catch (err) {
        if (statusDiv) statusDiv.style.display = 'none';
        showToast('Erreur upload : ' + err.message, 'error');
        throw err;
    }
}

document.getElementById('clubLogoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        uploadedLogoUrl = await uploadFile(file, 'nosclub_documents', 'Logo');
    } catch (err) { /* déjà toasté */ }
});

document.getElementById('clubBanniereFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        uploadedBanniereUrl = await uploadFile(file, 'nosclub_documents', 'Banniere');
    } catch (err) { /* déjà toasté */ }
});

document.getElementById('uploadLogo').addEventListener('click', () => document.getElementById('clubLogoFile').click());
document.getElementById('uploadBanniere').addEventListener('click', () => document.getElementById('clubBanniereFile').click());

document.getElementById('clubForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = document.getElementById('clubNom').value.trim();
    const disciplineId = document.getElementById('clubDiscipline').value;
    if (!nom || !disciplineId) {
        showToast('Veuillez remplir les champs obligatoires.', 'warning');
        return;
    }

    const missionHTML = missionQuill ? missionQuill.root.innerHTML : '';
    const philosophieHTML = philosophieQuill ? philosophieQuill.root.innerHTML : '';

    const clubData = {
        nom: nom,
        discipline_id: parseInt(disciplineId),
        ville: document.getElementById('clubVille').value.trim() || null,
        quartier: document.getElementById('clubQuartier').value.trim() || null,
        quota_max: parseInt(document.getElementById('clubQuotaMax').value) || 30,
        quota_utilise: parseInt(document.getElementById('clubQuotaUtilise').value) || 0,
        coach_nom: document.getElementById('clubCoachNom').value.trim() || null,
        coach_contact: document.getElementById('clubCoachContact').value.trim() || null,
        parrain_nom: document.getElementById('clubParrainNom').value.trim() || null,
        parrain_contact: document.getElementById('clubParrainContact').value.trim() || null,
        mission: missionHTML,
        philosophie: philosophieHTML,
        logo_url: uploadedLogoUrl,
        banniere_url: uploadedBanniereUrl,
        updated_at: new Date().toISOString()
    };

    showLoader();
    try {
        if (currentClubId) {
            const { error } = await supabaseAdmin
                .from('nosclub_clubs')
                .update(clubData)
                .eq('id', currentClubId);
            if (error) throw error;
            showToast('Club modifié avec succès.', 'success');
        } else {
            const { error } = await supabaseAdmin
                .from('nosclub_clubs')
                .insert([{ ...clubData, created_at: new Date().toISOString() }]);
            if (error) throw error;
            showToast('Club créé avec succès.', 'success');
        }
        document.getElementById('clubModal').classList.remove('active');
        loadClubs();
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : GESTION DU FORMULAIRE CLUB ==========

// ========== DÉBUT : ARCHIVAGE / DÉSARCHIVAGE ==========
async function toggleArchive(clubId, currentStatut) {
    const newStatut = currentStatut === 'actif' ? 'archive' : 'actif';
    const action = newStatut === 'archive' ? 'archiver' : 'désarchiver';
    if (!confirm(`Voulez-vous vraiment ${action} ce club ?`)) return;

    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_clubs')
            .update({ statut: newStatut, updated_at: new Date().toISOString() })
            .eq('id', clubId);
        if (error) throw error;
        showToast(`Club ${action.replace('er', 'é')} avec succès.`, 'success');
        loadClubs();
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : ARCHIVAGE / DÉSARCHIVAGE ==========

// ========== DÉBUT : SUPPRESSION ==========
function openDeleteModal(clubId) {
    currentClubId = clubId;
    document.getElementById('deleteModal').classList.add('active');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!currentClubId) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_clubs')
            .delete()
            .eq('id', currentClubId);
        if (error) throw error;
        showToast('Club supprimé définitivement.', 'success');
        document.getElementById('deleteModal').classList.remove('active');
        currentClubId = null;
        loadClubs();
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : SUPPRESSION ==========

// ========== DÉBUT : FERMETURE DES MODALES ==========
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }
});
// ========== FIN : FERMETURE DES MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ==========
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('statutFilter').addEventListener('change', renderTable);
document.getElementById('newClubBtn').addEventListener('click', openCreateModal);
// ========== FIN : ÉVÉNEMENTS FILTRES ==========

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
document.addEventListener('DOMContentLoaded', async () => {
    await loadRoles();
    loadClubs();
});
// ========== FIN DE GESTION-CLUBS.JS ==========
