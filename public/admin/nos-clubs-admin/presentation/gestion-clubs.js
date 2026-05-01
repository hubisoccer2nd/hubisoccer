// ========== GESTION-CLUBS.JS – VERSION FINALE ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allClubs = [];
let allRoles = [];
let currentClubId = null;
let selectedLogoFile = null;
let selectedBanniereFile = null;

// Éditeurs Quill (initialisés une seule fois)
let missionQuill = null;
let philosophieQuill = null;
let engagementsQuill = null;
let conclusionQuill = null;
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
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div><div class="toast-content">${escapeHtml(message)}</div><button class="toast-close"><i class="fas fa-times"></i></button>`;
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
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function sanitizeClubName(name) {
    return name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : INITIALISATION UNIQUE DES ÉDITEURS QUILL ==========
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

function initQuillEditors() {
    missionQuill = new Quill('#editorMission', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions },
        placeholder: 'Décrivez la mission et les objectifs du club...'
    });
    philosophieQuill = new Quill('#editorPhilosophie', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions },
        placeholder: 'Décrivez l\'ambiance et la philosophie du club...'
    });
    engagementsQuill = new Quill('#editorEngagements', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions },
        placeholder: 'Tableau des engagements stratégiques...'
    });
    conclusionQuill = new Quill('#editorConclusion', {
        theme: 'snow',
        modules: { toolbar: quillToolbarOptions },
        placeholder: 'Conclusion et pied de page...'
    });
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

function clearQuillEditors() {
    if (missionQuill) missionQuill.setText('');
    if (philosophieQuill) philosophieQuill.setText('');
    if (engagementsQuill) engagementsQuill.setText('');
    if (conclusionQuill) conclusionQuill.setText('');
}
// ========== FIN : INITIALISATION UNIQUE DES ÉDITEURS QUILL ==========

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
        return `<tr data-clubid="${club.id}">
            <td class="id-cell">${club.id}</td>
            <td>${escapeHtml(club.nom)}</td>
            <td><i class="fas ${escapeHtml(role.icone || 'fa-users')}"></i> ${escapeHtml(role.nom || '')}</td>
            <td>${escapeHtml(club.ville || '-')}</td>
            <td>${quotaUtilise} / ${quotaMax}</td>
            <td>${statutBadge}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-view" data-clubid="${club.id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-edit" data-clubid="${club.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-archive" data-clubid="${club.id}" data-statut="${club.statut}" title="${club.statut === 'actif' ? 'Archiver' : 'Désarchiver'}"><i class="fas fa-archive"></i></button>
                <button class="btn-icon btn-delete" data-clubid="${club.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => openViewModal(btn.dataset.clubid)));
    tbody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.clubid)));
    tbody.querySelectorAll('.btn-archive').forEach(btn => btn.addEventListener('click', () => toggleArchive(btn.dataset.clubid, btn.dataset.statut)));
    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.dataset.clubid)));
}
// ========== FIN : CHARGEMENT DES CLUBS ==========

// ========== DÉBUT : VISUALISATION ==========
function openViewModal(clubId) {
    const club = allClubs.find(c => c.id == clubId);
    if (!club) return;

    const viewContent = document.getElementById('viewContent');
    viewContent.innerHTML = `<div class="view-details">
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> Identité</h4>
            <p><strong>Nom :</strong> ${escapeHtml(club.nom)}</p>
            <p><strong>Slogan :</strong> ${escapeHtml(club.slogan || '-')}</p>
            <p><strong>Discipline :</strong> ${escapeHtml(club.nosclub_roles?.nom || '-')}</p>
            <p><strong>Ville :</strong> ${escapeHtml(club.ville || '-')}</p>
            <p><strong>Quartier :</strong> ${escapeHtml(club.quartier || '-')}</p>
            <p><strong>Quota :</strong> ${club.quota_utilise || 0} / ${club.quota_max || 30}</p>
            <p><strong>Statut :</strong> ${club.statut === 'actif' ? 'Actif' : 'Archivé'}</p>
            <p><strong>Ambiance :</strong> ${escapeHtml(club.ambiance || '-')}</p>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-users"></i> Encadrement</h4>
            <p><strong>Coach :</strong> ${escapeHtml(club.coach_nom || 'À désigner')} ${club.coach_contact ? '(' + escapeHtml(club.coach_contact) + ')' : ''}</p>
            <p><strong>Parrain :</strong> ${escapeHtml(club.parrain_nom || 'À désigner')}</p>
            <p><strong>Contact Parrain :</strong> ${escapeHtml(club.parrain_contact || '-')}</p>
            <p><strong>Citation :</strong> ${escapeHtml(club.parrain_citation || '-')}</p>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-bullseye"></i> Mission</h4>
            <div class="rich-content">${club.mission || 'Non renseigné.'}</div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-fire"></i> Philosophie</h4>
            <div class="rich-content">${club.philosophie || 'Non renseigné.'}</div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-flag-checkered"></i> Engagements</h4>
            <div class="rich-content">${club.engagements || 'Non renseigné.'}</div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-rocket"></i> Conclusion</h4>
            <div class="rich-content">${club.conclusion || 'Non renseigné.'}</div>
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-image"></i> Médias</h4>
            <p>Logo : ${club.logo_url ? `<img src="${escapeHtml(club.logo_url)}" class="preview-img">` : 'Aucun'}</p>
            <p>Bannière : ${club.banniere_url ? `<img src="${escapeHtml(club.banniere_url)}" class="preview-img">` : 'Aucune'}</p>
        </div>
    </div>`;

    document.getElementById('viewModal').classList.add('active');
}
// ========== FIN : VISUALISATION ==========

// ========== DÉBUT : GESTION DU FORMULAIRE CLUB ==========
function openCreateModal() {
    currentClubId = null;
    document.getElementById('clubModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nouveau club';
    document.getElementById('clubForm').reset();
    document.getElementById('clubId').value = '';
    document.getElementById('clubQuotaMax').value = 30;
    selectedLogoFile = null;
    selectedBanniereFile = null;
    document.getElementById('logoFileName').textContent = 'Cliquez pour choisir un fichier (JPG, PNG)';
    document.getElementById('banniereFileName').textContent = 'Cliquez pour choisir un fichier (JPG, PNG)';
    clearQuillEditors();
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
    document.getElementById('clubSlogan').value = club.slogan || '';
    document.getElementById('clubAmbiance').value = club.ambiance || '';
    document.getElementById('clubCoachNom').value = club.coach_nom || '';
    document.getElementById('clubCoachContact').value = club.coach_contact || '';
    document.getElementById('clubParrainNom').value = club.parrain_nom || '';
    document.getElementById('clubParrainContact').value = club.parrain_contact || '';
    document.getElementById('clubParrainCitation').value = club.parrain_citation || '';
    selectedLogoFile = null;
    selectedBanniereFile = null;
    document.getElementById('logoFileName').textContent = club.logo_url ? 'Logo actuel (cliquez pour changer)' : 'Cliquez pour choisir un fichier (JPG, PNG)';
    document.getElementById('banniereFileName').textContent = club.banniere_url ? 'Bannière actuelle (cliquez pour changer)' : 'Cliquez pour choisir un fichier (JPG, PNG)';
    setQuillContent(missionQuill, club.mission || '');
    setQuillContent(philosophieQuill, club.philosophie || '');
    setQuillContent(engagementsQuill, club.engagements || '');
    setQuillContent(conclusionQuill, club.conclusion || '');
    document.getElementById('clubModal').classList.add('active');
}

// Upload de fichier avec nommage correct
async function uploadClubFile(file, clubName, type) {
    const sanitized = sanitizeClubName(clubName);
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${sanitized}/${type}_${timestamp}.${ext}`;
    const bucket = 'nosclub_documents';

    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
}

// Sélection des fichiers (sans upload automatique)
document.getElementById('clubLogoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedLogoFile = file;
        document.getElementById('logoFileName').textContent = `Logo : ${file.name}`;
    }
});
document.getElementById('clubBanniereFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedBanniereFile = file;
        document.getElementById('banniereFileName').textContent = `Bannière : ${file.name}`;
    }
});

// Soumission du formulaire
document.getElementById('clubForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = document.getElementById('clubNom').value.trim();
    const disciplineId = document.getElementById('clubDiscipline').value;
    if (!nom || !disciplineId) {
        showToast('Veuillez remplir les champs obligatoires.', 'warning');
        return;
    }

    showLoader();
    try {
        let logoUrl = currentClubId ? allClubs.find(c => c.id == currentClubId)?.logo_url : null;
        let banniereUrl = currentClubId ? allClubs.find(c => c.id == currentClubId)?.banniere_url : null;

        if (selectedLogoFile) {
            logoUrl = await uploadClubFile(selectedLogoFile, nom, 'logo');
        }
        if (selectedBanniereFile) {
            banniereUrl = await uploadClubFile(selectedBanniereFile, nom, 'banniere');
        }

        const clubData = {
            nom: nom,
            discipline_id: parseInt(disciplineId),
            ville: document.getElementById('clubVille').value.trim() || null,
            quartier: document.getElementById('clubQuartier').value.trim() || null,
            quota_max: parseInt(document.getElementById('clubQuotaMax').value) || 30,
            slogan: document.getElementById('clubSlogan').value.trim() || null,
            ambiance: document.getElementById('clubAmbiance').value.trim() || null,
            coach_nom: document.getElementById('clubCoachNom').value.trim() || null,
            coach_contact: document.getElementById('clubCoachContact').value.trim() || null,
            parrain_nom: document.getElementById('clubParrainNom').value.trim() || null,
            parrain_contact: document.getElementById('clubParrainContact').value.trim() || null,
            parrain_citation: document.getElementById('clubParrainCitation').value.trim() || null,
            mission: missionQuill ? missionQuill.root.innerHTML : '',
            philosophie: philosophieQuill ? philosophieQuill.root.innerHTML : '',
            engagements: engagementsQuill ? engagementsQuill.root.innerHTML : '',
            conclusion: conclusionQuill ? conclusionQuill.root.innerHTML : '',
            logo_url: logoUrl,
            banniere_url: banniereUrl,
            updated_at: new Date().toISOString()
        };

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
                .insert([{ ...clubData, created_at: new Date().toISOString(), statut: 'actif', quota_utilise: 0 }]);
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
    const club = allClubs.find(c => c.id == clubId);
    if (!club) return;
    currentClubId = clubId;
    document.getElementById('deleteClubName').textContent = club.nom;
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
document.getElementById('refreshClubsBtn').addEventListener('click', () => {
    loadClubs();
    showToast('Liste des clubs rafraîchie.', 'success');
});
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
    initQuillEditors();
    await loadRoles();
    loadClubs();
});
// ========== FIN DE GESTION-CLUBS.JS ==========