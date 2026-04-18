/* ============================================================
   HubISoccer — admin-foot-verif.js
   Administration Footballeur · Vérifications & Licences
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentTab = 'licenses';
let licensesData = [];
let documentsData = [];
let historyData = [];
let currentLicenseId = null;
let currentDocumentId = null;
let pendingAction = null;
let currentAdmin = null;
// Fin état global

// Début fonctions utilitaires
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info', duration = 8000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
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

function fixSignatureUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/`;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return baseUrl + cleanUrl;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const url = currentAdmin?.avatar_url;
    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
    } else {
        const init = getInitials(currentAdmin?.full_name || currentAdmin?.display_name || 'A');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
    }
}
// Fin fonctions utilitaires

// Début vérification admin
async function checkAdmin() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    const { data: profile, error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('role_code, full_name, display_name, avatar_url')
        .eq('auth_uuid', user.id)
        .single();
    if (profileError || !profile) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
        showToast('Accès réservé aux administrateurs footballeurs', 'error');
        setTimeout(() => window.location.href = '../../../authprive/users/login.html', 2000);
        return false;
    }
    currentAdmin = profile;
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
    updateAvatarUI();
    return true;
}
// Fin vérification admin

// Début chargement licences
async function loadLicenses() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .select(`
                *,
                footballeur:user_hubisoccer_id (
                    hubisoccer_id,
                    full_name,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        licensesData = data || [];
        renderLicenses();
    } catch (err) {
        console.error('Erreur chargement licences:', err);
        showToast('Erreur lors du chargement des demandes', 'error');
    } finally {
        showLoader(false);
    }
}

function renderLicenses() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filter = document.getElementById('filterSelect')?.value || 'all';

    const filtered = licensesData.filter(license => {
        const footballeur = license.footballeur || {};
        const matchesSearch = (footballeur.full_name || '').toLowerCase().includes(searchTerm) ||
                             (license.nom || '').toLowerCase().includes(searchTerm) ||
                             (license.prenom || '').toLowerCase().includes(searchTerm) ||
                             (license.hubisoccer_id || '').toLowerCase().includes(searchTerm) ||
                             (license.email || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filter === 'all' ||
            (filter === 'approved' && license.status === 'approved') ||
            (filter === 'pending' && (license.status === 'admin_pending' || license.status === 'president_pending')) ||
            (filter === 'rejected' && license.status === 'rejected');
        return matchesSearch && matchesFilter;
    });

    const container = document.getElementById('licensesList');
    if (!container) return;

    const statusLabels = {
        admin_pending: 'Admin en attente',
        president_pending: 'Président en attente',
        approved: 'Validée',
        rejected: 'Rejetée'
    };

    container.innerHTML = filtered.map(license => {
        const footballeur = license.footballeur || {};
        const statusClass = license.status === 'approved' ? 'approved' : (license.status === 'rejected' ? 'rejected' : 'pending');
        const statusText = statusLabels[license.status] || 'En attente';
        const date = license.created_at ? new Date(license.created_at).toLocaleDateString('fr-FR') : '';

        return `
            <div class="license-card ${statusClass}" data-license-id="${license.id}">
                <div class="license-header">
                    <span class="license-player">${footballeur.full_name || 'Inconnu'}</span>
                    <span class="license-date">${date}</span>
                </div>
                <div class="license-info">
                    <span><i class="fas fa-user"></i> ${license.prenom || ''} ${license.nom || ''}</span>
                    <span><i class="fas fa-phone"></i> ${license.telephone || '-'}</span>
                    <span><i class="fas fa-envelope"></i> ${license.email || '-'}</span>
                </div>
                <div class="license-status ${statusClass}">${statusText}</div>
                <div class="license-actions">
                    <button class="btn-action view" onclick="viewLicense(${license.id})"><i class="fas fa-eye"></i> Voir</button>
                    <button class="btn-action edit" onclick="editLicense(${license.id})"><i class="fas fa-edit"></i> Modifier</button>
                    <button class="btn-action delete" onclick="deleteLicense(${license.id})"><i class="fas fa-trash"></i> Supprimer</button>
                    ${license.status === 'admin_pending' ? `
                        <button class="btn-action approve" onclick="approveLicense(${license.id})"><i class="fas fa-check"></i> Valider (admin)</button>
                        <button class="btn-action reject" onclick="rejectLicense(${license.id})"><i class="fas fa-times"></i> Rejeter</button>
                    ` : license.status === 'president_pending' ? `
                        <button class="btn-action approve" onclick="presidentApproveLicense(${license.id})"><i class="fas fa-check"></i> Approuver (président)</button>
                        <button class="btn-action reject" onclick="rejectLicense(${license.id})"><i class="fas fa-times"></i> Rejeter</button>
                    ` : license.status === 'approved' ? `
                        <button class="btn-action download" onclick="downloadCard(${license.id})"><i class="fas fa-download"></i> Carte</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
// Fin chargement licences

// Début chargement documents
async function loadDocuments() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_document_requests')
            .select(`
                *,
                footballeur:user_hubisoccer_id (
                    hubisoccer_id,
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        documentsData = data || [];
        renderDocuments();
    } catch (err) {
        console.error('Erreur chargement documents:', err);
        showToast('Erreur lors du chargement des documents', 'error');
    } finally {
        showLoader(false);
    }
}

function renderDocuments() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filter = document.getElementById('filterSelect')?.value || 'all';

    const filtered = documentsData.filter(doc => {
        const footballeur = doc.footballeur || {};
        const matchesSearch = (footballeur.full_name || '').toLowerCase().includes(searchTerm) ||
                             (doc.document_type || '').toLowerCase().includes(searchTerm) ||
                             (doc.file_name || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filter === 'all' || doc.status === filter;
        return matchesSearch && matchesFilter;
    });

    const container = document.getElementById('documentsList');
    if (!container) return;

    const typeLabels = {
        id_card: 'Pièce d\'identité',
        photo: 'Photo',
        certificat_medical: 'Certificat médical',
        diplome: 'Diplôme',
        justificatif_domicile: 'Justificatif de domicile'
    };

    container.innerHTML = filtered.map(doc => {
        const footballeur = doc.footballeur || {};
        const typeLabel = typeLabels[doc.document_type] || doc.document_type;

        return `
            <div class="document-card ${doc.status}" data-doc-id="${doc.id}">
                <div class="document-icon"><i class="fas fa-file-pdf"></i></div>
                <div class="document-info">
                    <div class="document-name">${footballeur.full_name || 'Inconnu'} - ${typeLabel}</div>
                    <div class="document-meta">${doc.file_name || ''}</div>
                </div>
                <div class="document-status ${doc.status}">${doc.status === 'approved' ? 'Validé' : doc.status === 'pending' ? 'En attente' : 'Rejeté'}</div>
                <div class="document-actions">
                    <button class="btn-action view" onclick="viewDocument(${doc.id})"><i class="fas fa-eye"></i> Voir</button>
                    <button class="btn-action edit" onclick="editDocument(${doc.id})"><i class="fas fa-edit"></i> Modifier</button>
                    <button class="btn-action delete" onclick="deleteDocument(${doc.id})"><i class="fas fa-trash"></i> Supprimer</button>
                    ${doc.status !== 'approved' ? `
                        <button class="btn-action approve" onclick="approveDocument(${doc.id})"><i class="fas fa-check"></i> Approuver</button>
                    ` : ''}
                    ${doc.status !== 'rejected' ? `
                        <button class="btn-action reject" onclick="rejectDocument(${doc.id})"><i class="fas fa-times"></i> Rejeter</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
// Fin chargement documents

// Début chargement historique (identique à licences)
async function loadHistory() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .select(`
                *,
                footballeur:user_hubisoccer_id (
                    hubisoccer_id,
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        historyData = data || [];
        renderHistory();
    } catch (err) {
        console.error('Erreur chargement historique:', err);
        showToast('Erreur lors du chargement de l\'historique', 'error');
    } finally {
        showLoader(false);
    }
}

function renderHistory() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filter = document.getElementById('filterSelect')?.value || 'all';

    const filtered = historyData.filter(license => {
        const footballeur = license.footballeur || {};
        const matchesSearch = (footballeur.full_name || '').toLowerCase().includes(searchTerm) ||
                             (license.nom || '').toLowerCase().includes(searchTerm) ||
                             (license.email || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filter === 'all' ||
            (filter === 'approved' && license.status === 'approved') ||
            (filter === 'pending' && (license.status === 'admin_pending' || license.status === 'president_pending')) ||
            (filter === 'rejected' && license.status === 'rejected');
        return matchesSearch && matchesFilter;
    });

    const container = document.getElementById('historyList');
    if (!container) return;

    const statusLabels = {
        admin_pending: 'Admin en attente',
        president_pending: 'Président en attente',
        approved: 'Validée',
        rejected: 'Rejetée'
    };

    container.innerHTML = filtered.map(license => {
        const footballeur = license.footballeur || {};
        const statusClass = license.status === 'approved' ? 'approved' : (license.status === 'rejected' ? 'rejected' : 'pending');
        const statusText = statusLabels[license.status] || 'En attente';
        const date = license.created_at ? new Date(license.created_at).toLocaleDateString('fr-FR') : '';

        return `
            <div class="license-card ${statusClass}" data-license-id="${license.id}">
                <div class="license-header">
                    <span class="license-player">${footballeur.full_name || 'Inconnu'}</span>
                    <span class="license-date">${date}</span>
                </div>
                <div class="license-info">
                    <span><i class="fas fa-user"></i> ${license.prenom || ''} ${license.nom || ''}</span>
                    <span><i class="fas fa-phone"></i> ${license.telephone || '-'}</span>
                </div>
                <div class="license-status ${statusClass}">${statusText}</div>
                <div class="license-actions">
                    <button class="btn-action view" onclick="viewLicense(${license.id})"><i class="fas fa-eye"></i> Voir</button>
                    <button class="btn-action delete" onclick="deleteLicense(${license.id})"><i class="fas fa-trash"></i> Supprimer</button>
                    ${license.status === 'approved' && license.carte_url ? `
                        <button class="btn-action download" onclick="downloadCard(${license.id})"><i class="fas fa-download"></i> Carte</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
// Fin chargement historique

// Début actions licences
async function viewLicense(licenseId) {
    const license = licensesData.find(l => l.id === licenseId) || historyData.find(l => l.id === licenseId);
    if (!license) { showToast('Demande introuvable', 'error'); return; }

    const footballeur = license.footballeur || {};
    const signatureUrl = fixSignatureUrl(license.signature_url);
    const dateNaissance = license.date_naissance ? new Date(license.date_naissance).toLocaleDateString('fr-FR') : '-';
    const createdDate = license.created_at ? new Date(license.created_at).toLocaleDateString('fr-FR') : '-';

    document.getElementById('licenseModalBody').innerHTML = `
        <div class="license-detail">
            <div class="license-detail-section">
                <h3>Informations personnelles</h3>
                <div class="license-detail-grid">
                    <div class="license-detail-item"><span class="label">Nom complet</span><span class="value">${license.prenom || ''} ${license.nom || ''}</span></div>
                    <div class="license-detail-item"><span class="label">Date de naissance</span><span class="value">${dateNaissance}</span></div>
                    <div class="license-detail-item"><span class="label">Lieu de naissance</span><span class="value">${license.lieu_naissance || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Nationalité</span><span class="value">${license.nationalite || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Pays</span><span class="value">${license.pays || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Téléphone</span><span class="value">${license.telephone || '-'}</span></div>
                </div>
            </div>
            <div class="license-detail-section">
                <h3>Adresse & Contact</h3>
                <div class="license-detail-grid">
                    <div class="license-detail-item"><span class="label">Adresse</span><span class="value">${license.adresse || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Langue(s)</span><span class="value">${license.langue || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Email</span><span class="value">${license.email || '-'}</span></div>
                </div>
            </div>
            <div class="license-detail-section">
                <h3>Informations sportives</h3>
                <div class="license-detail-grid">
                    <div class="license-detail-item"><span class="label">Taille</span><span class="value">${license.taille || '-'} cm</span></div>
                    <div class="license-detail-item"><span class="label">Poids</span><span class="value">${license.poids || '-'} kg</span></div>
                    <div class="license-detail-item"><span class="label">Pied fort</span><span class="value">${license.pied_fort || '-'}</span></div>
                    <div class="license-detail-item"><span class="label">Club</span><span class="value">${license.club || '-'}</span></div>
                </div>
            </div>
            <div class="license-detail-section">
                <h3>Signature</h3>
                ${signatureUrl ? `<img src="${signatureUrl}" class="license-signature" alt="Signature" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                <p style="display:${signatureUrl ? 'none' : 'block'}; color:var(--danger);">Signature non disponible</p>
            </div>
            <div class="license-detail-section">
                <h3>Métadonnées</h3>
                <div class="license-detail-grid">
                    <div class="license-detail-item"><span class="label">Soumise le</span><span class="value">${createdDate}</span></div>
                    <div class="license-detail-item"><span class="label">Statut</span><span class="value">${license.status}</span></div>
                    ${license.carte_url ? `<div class="license-detail-item"><span class="label">Carte</span><span class="value"><a href="${license.carte_url}" target="_blank">Télécharger</a></span></div>` : ''}
                </div>
            </div>
        </div>
    `;

    const actionsDiv = document.getElementById('licenseModalActions');
    actionsDiv.innerHTML = `
        <button class="btn-cancel" onclick="closeLicenseModal()">Fermer</button>
        <button class="btn-confirm" onclick="editLicense(${license.id})">Modifier</button>
        <button class="btn-reject" onclick="deleteLicense(${license.id})">Supprimer</button>
        ${license.status === 'admin_pending' ? `
            <button class="btn-confirm" onclick="approveLicense(${license.id})">Valider (admin)</button>
            <button class="btn-reject" onclick="rejectLicense(${license.id})">Rejeter</button>
        ` : license.status === 'president_pending' ? `
            <button class="btn-confirm" onclick="presidentApproveLicense(${license.id})">Approuver (président)</button>
            <button class="btn-reject" onclick="rejectLicense(${license.id})">Rejeter</button>
        ` : ''}
    `;

    document.getElementById('licenseModal').style.display = 'flex';
    currentLicenseId = license.id;
}

function closeLicenseModal() { document.getElementById('licenseModal').style.display = 'none'; }

async function approveLicense(licenseId) {
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_license_requests')
        .update({ status: 'president_pending' })
        .eq('id', licenseId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Demande envoyée au président', 'success'); loadLicenses(); loadHistory(); closeLicenseModal(); }
}

async function presidentApproveLicense(licenseId) {
    try {
        const { data: license } = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .select('user_hubisoccer_id, prenom, nom')
            .eq('id', licenseId)
            .single();
        if (!license) throw new Error('Demande introuvable');

        const { error } = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .update({ status: 'approved' })
            .eq('id', licenseId);
        if (error) throw error;

        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipent_hubisoccer_id: license.user_hubisoccer_id,
            title: 'Votre licence est prête !',
            message: 'Votre carte de licence HubISoccer a été approuvée.',
            type: 'success',
            data: { link: '../../footballeur/verification/foot-verif.html' }
        }]);

        showToast('Licence approuvée et notification envoyée', 'success');
        loadLicenses();
        loadHistory();
        closeLicenseModal();
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

async function rejectLicense(licenseId) {
    const reason = prompt('Motif du rejet (optionnel) :');
    if (reason === null) return;
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_license_requests')
        .update({ status: 'rejected' })
        .eq('id', licenseId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Demande rejetée', 'success'); loadLicenses(); loadHistory(); closeLicenseModal(); }
}

async function deleteLicense(licenseId) {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_license_requests')
        .delete()
        .eq('id', licenseId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Demande supprimée', 'success'); loadLicenses(); loadHistory(); closeLicenseModal(); }
}

function downloadCard(licenseId) {
    const license = licensesData.find(l => l.id === licenseId) || historyData.find(l => l.id === licenseId);
    if (license?.carte_url) window.open(license.carte_url, '_blank');
    else showToast('Aucune carte disponible', 'warning');
}
// Fin actions licences

// Début actions documents
async function viewDocument(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    const footballeur = doc.footballeur || {};
    const typeLabel = { id_card: 'Pièce d\'identité', photo: 'Photo', certificat_medical: 'Certificat médical', diplome: 'Diplôme', justificatif_domicile: 'Justificatif de domicile' }[doc.document_type] || doc.document_type;

    document.getElementById('documentModalBody').innerHTML = `
        <div style="text-align:center;">
            <p><strong>${footballeur.full_name || 'Inconnu'}</strong> - ${typeLabel}</p>
            <p>Fichier : ${doc.file_name || ''}</p>
            ${doc.file_url ? `<a href="${doc.file_url}" target="_blank" class="btn-action view">Voir le fichier</a>` : ''}
            <p>Statut actuel : <span class="document-status ${doc.status}">${doc.status}</span></p>
        </div>
    `;
    document.getElementById('documentModalActions').innerHTML = `
        <button class="btn-cancel" onclick="closeDocumentModal()">Fermer</button>
        <button class="btn-confirm" onclick="editDocument(${doc.id})">Modifier</button>
        <button class="btn-reject" onclick="deleteDocument(${doc.id})">Supprimer</button>
        ${doc.status !== 'approved' ? `<button class="btn-confirm" onclick="approveDocument(${doc.id})">Approuver</button>` : ''}
        ${doc.status !== 'rejected' ? `<button class="btn-reject" onclick="rejectDocument(${doc.id})">Rejeter</button>` : ''}
    `;
    document.getElementById('documentModal').style.display = 'flex';
    currentDocumentId = doc.id;
}

function closeDocumentModal() { document.getElementById('documentModal').style.display = 'none'; }

async function editDocument(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    const newStatus = prompt('Nouveau statut (pending/approved/rejected) :', doc.status);
    if (!newStatus || !['pending', 'approved', 'rejected'].includes(newStatus)) { showToast('Statut invalide', 'warning'); return; }
    const newType = prompt('Nouveau type (id_card/photo/certificat_medical/diplome/justificatif_domicile) :', doc.document_type);
    if (!newType) return;
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_document_requests')
        .update({ status: newStatus, document_type: newType })
        .eq('id', docId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Document mis à jour', 'success'); closeDocumentModal(); loadDocuments(); }
}

async function deleteDocument(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    if (!confirm('Supprimer définitivement ce document ?')) return;
    if (doc.file_url) {
        const urlParts = doc.file_url.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
            await supabaseClient.storage.from('documents').remove([urlParts[1]]);
        }
    }
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_document_requests')
        .delete()
        .eq('id', docId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Document supprimé', 'success'); loadDocuments(); }
}

async function approveDocument(docId) {
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_document_requests')
        .update({ status: 'approved' })
        .eq('id', docId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Document approuvé', 'success'); closeDocumentModal(); loadDocuments(); }
}

async function rejectDocument(docId) {
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_document_requests')
        .update({ status: 'rejected' })
        .eq('id', docId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Document rejeté', 'success'); closeDocumentModal(); loadDocuments(); }
}
// Fin actions documents

// Début édition licence
async function editLicense(licenseId) {
    const license = licensesData.find(l => l.id === licenseId) || historyData.find(l => l.id === licenseId);
    if (!license) { showToast('Demande introuvable', 'error'); return; }

    document.getElementById('edit_nom').value = license.nom || '';
    document.getElementById('edit_prenom').value = license.prenom || '';
    document.getElementById('edit_date_naissance').value = license.date_naissance || '';
    document.getElementById('edit_lieu_naissance').value = license.lieu_naissance || '';
    document.getElementById('edit_adresse').value = license.adresse || '';
    document.getElementById('edit_nationalite').value = license.nationalite || '';
    document.getElementById('edit_pays').value = license.pays || '';
    document.getElementById('edit_langue').value = license.langue || '';
    document.getElementById('edit_telephone').value = license.telephone || '';
    document.getElementById('edit_email').value = license.email || '';
    document.getElementById('edit_taille').value = license.taille || '';
    document.getElementById('edit_poids').value = license.poids || '';
    document.getElementById('edit_pied_fort').value = license.pied_fort || '';
    document.getElementById('edit_club').value = license.club || '';

    currentLicenseId = license.id;
    document.getElementById('editLicenseModal').style.display = 'flex';
}

function closeEditLicenseModal() { document.getElementById('editLicenseModal').style.display = 'none'; }

document.getElementById('editLicenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
        nom: document.getElementById('edit_nom').value,
        prenom: document.getElementById('edit_prenom').value,
        date_naissance: document.getElementById('edit_date_naissance').value,
        lieu_naissance: document.getElementById('edit_lieu_naissance').value,
        adresse: document.getElementById('edit_adresse').value,
        nationalite: document.getElementById('edit_nationalite').value,
        pays: document.getElementById('edit_pays').value,
        langue: document.getElementById('edit_langue').value,
        telephone: document.getElementById('edit_telephone').value,
        email: document.getElementById('edit_email').value,
        taille: document.getElementById('edit_taille').value || null,
        poids: document.getElementById('edit_poids').value || null,
        pied_fort: document.getElementById('edit_pied_fort').value || null,
        club: document.getElementById('edit_club').value || null,
    };
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_license_requests')
        .update(updates)
        .eq('id', currentLicenseId);
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else {
        showToast('Demande mise à jour', 'success');
        closeEditLicenseModal();
        closeLicenseModal();
        loadLicenses();
        loadHistory();
    }
});
// Fin édition licence

// Début gestion onglets
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById(`tab-${tab}`).classList.add('active');
            currentTab = tab;
            document.getElementById('searchInput').value = '';
            document.getElementById('filterSelect').value = 'all';
            if (tab === 'licenses') loadLicenses();
            else if (tab === 'documents') loadDocuments();
            else if (tab === 'history') loadHistory();
        });
    });
}
// Fin gestion onglets

// Début recherche et filtres
document.getElementById('searchInput')?.addEventListener('input', () => {
    if (currentTab === 'licenses') renderLicenses();
    else if (currentTab === 'documents') renderDocuments();
    else if (currentTab === 'history') renderHistory();
});
document.getElementById('filterSelect')?.addEventListener('change', () => {
    if (currentTab === 'licenses') renderLicenses();
    else if (currentTab === 'documents') renderDocuments();
    else if (currentTab === 'history') renderHistory();
});
document.getElementById('refreshBtn')?.addEventListener('click', () => {
    if (currentTab === 'licenses') loadLicenses();
    else if (currentTab === 'documents') loadDocuments();
    else if (currentTab === 'history') loadHistory();
});
// Fin recherche et filtres

// Début sidebar et menu utilisateur
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}

function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
// Fin sidebar et menu utilisateur

// Début fonctions globales
window.viewLicense = viewLicense;
window.closeLicenseModal = closeLicenseModal;
window.approveLicense = approveLicense;
window.presidentApproveLicense = presidentApproveLicense;
window.rejectLicense = rejectLicense;
window.deleteLicense = deleteLicense;
window.downloadCard = downloadCard;
window.editLicense = editLicense;
window.closeEditLicenseModal = closeEditLicenseModal;
window.viewDocument = viewDocument;
window.closeDocumentModal = closeDocumentModal;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;
window.approveDocument = approveDocument;
window.rejectDocument = rejectDocument;
window.closeConfirmModal = () => document.getElementById('confirmModal').style.display = 'none';
// Fin fonctions globales

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;

    initTabs();
    initSidebar();
    initUserMenu();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });

    loadLicenses();
});
// Fin initialisation DOM
