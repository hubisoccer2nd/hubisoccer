/* ============================================================
   HubISoccer — foot-verif.js
   Espace Footballeur · Vérification & Licence
   Corps · Âme · Esprit
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser       = null;
let userProfile       = null;
let scoutingData      = null;
let documentsList     = [];
let licenseRequest    = null;
let signaturePadModal = null;
let signatureLocked   = false;
let signatureDataURL  = null;

const ROLE_NAME      = 'Footballeur';
const ROLE_PREFIX    = 'foot';
const SCOUTING_TABLE = 'supabaseAuthPrive_footballeur_scouting';
const DOC_BUCKET     = 'documents';
// Fin état global

// Début fonction showToast
function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close"><i class="fas fa-times"></i></div>
    `;
    c.appendChild(t);
    const closeBtn = t.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => t.remove());
    setTimeout(() => { if (t.parentNode) t.remove(); }, duration);
}
// Fin fonction showToast

// Début fonction showLoader / hideLoader
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// Fin fonctions loader

// Début fonction getInitials
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}
// Fin fonction getInitials

// Début fonction updateAvatarUI
function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const url = userProfile?.avatar_url;
    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
    } else {
        const init = getInitials(userProfile?.full_name || 'U');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
    }
}
// Fin fonction updateAvatarUI

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadProfile
async function loadProfile() {
    if (!currentUser) return null;
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, email, phone, birth_date, country, avatar_url, height, weight, club, position, pseudo, nationality')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    if (data.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    userProfile = data;

    const { data: scData, error: scError } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('footballeur_hubisoccer_id', userProfile.hubisoccer_id)
        .maybeSingle();
    scoutingData = scData || {};

    document.getElementById('userName').textContent = userProfile.full_name || ROLE_NAME;
    updateAvatarUI();
    populateFormFromProfile();
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction populateFormFromProfile
function populateFormFromProfile() {
    if (!userProfile) return;
    const nameParts = (userProfile.full_name || '').split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || '';
    function set(id, val) { const el = document.getElementById(id); if (el && val) el.value = val; }
    set('nom', nom);
    set('prenom', prenom);
    set('dateNaissance', userProfile.birth_date);
    set('nationalite', userProfile.nationality || userProfile.country);
    set('telephone', userProfile.phone);
    set('taille', userProfile.height);
    set('poids', userProfile.weight);
    if (scoutingData?.pied_fort) set('pied_fort', scoutingData.pied_fort);
    set('structure', scoutingData?.club_actuel || userProfile.club || '');
    updateCardPreview();
}
// Fin fonction populateFormFromProfile

// Début fonction loadDocuments
async function loadDocuments() {
    const requiredDocs = [
        { id: 'id_card', name: "Pièce d'identité (CNI / Passeport)", type: 'identity' },
        { id: 'photo', name: "Photo d'identité (récente)", type: 'photo' },
        { id: 'certificat_medical', name: "Certificat médical (moins de 3 mois)", type: 'medical' },
        { id: 'diplome', name: "Diplôme / Certificat (si applicable)", type: 'diploma' },
        { id: 'justificatif_domicile', name: "Justificatif de domicile", type: 'address' }
    ];
    if (!userProfile?.hubisoccer_id) {
        documentsList = requiredDocs.map(doc => ({ ...doc, status: 'pending', file_url: null, file_name: null, request_id: null }));
        renderDocuments();
        return;
    }
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_document_requests')
        .select('*')
        .eq('user_hubisoccer_id', userProfile.hubisoccer_id);
    if (error) {
        documentsList = requiredDocs.map(doc => ({ ...doc, status: 'pending', file_url: null, file_name: null, request_id: null }));
        renderDocuments();
        return;
    }
    documentsList = requiredDocs.map(doc => {
        const existing = data.find(d => d.document_type === doc.id);
        return {
            ...doc,
            status: existing?.status || 'pending',
            file_url: existing?.file_url || null,
            file_name: existing?.file_name || null,
            request_id: existing?.id || null
        };
    });
    renderDocuments();
}
// Fin fonction loadDocuments

// Début fonction renderDocuments
function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    const statusIcons  = { pending: 'fa-clock', approved: 'fa-check-circle', rejected: 'fa-times-circle' };
    documentsList.forEach(doc => {
        const card = document.createElement('div');
        card.className = `document-card ${doc.status}`;
        card.innerHTML = `
            <div class="document-header">
                <span class="document-name"><i class="fas ${statusIcons[doc.status] || 'fa-file-alt'}"></i> ${doc.name}</span>
                <span class="document-status ${doc.status}">${statusLabels[doc.status] || 'En attente'}</span>
            </div>
            <div class="document-actions">
                ${doc.status !== 'approved' ? `<button class="btn-upload" data-doc-id="${doc.id}"><i class="fas fa-upload"></i> Téléverser</button>` : ''}
                ${doc.file_url ? `<a href="${doc.file_url}" target="_blank" class="btn-view"><i class="fas fa-eye"></i> Voir</a>` : ''}
            </div>
            ${doc.file_name ? `<div class="document-file-name"><i class="fas fa-paperclip"></i> ${doc.file_name}</div>` : ''}
        `;
        grid.appendChild(card);
    });
    document.querySelectorAll('.btn-upload').forEach(btn => {
        btn.addEventListener('click', e => uploadDocument(e.currentTarget.dataset.docId));
    });
}
// Fin fonction renderDocuments

// Début fonction uploadDocument
async function uploadDocument(docId) {
    if (!currentUser || !userProfile) { showToast('Utilisateur non connecté', 'error'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Fichier trop lourd (max 5 Mo)', 'warning'); return; }
        showLoader();
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${userProfile.hubisoccer_id}_${docId}_${Date.now()}.${ext}`;
            const filePath = `footballeur/${fileName}`;
            const { error: upError } = await supabaseClient.storage.from(DOC_BUCKET).upload(filePath, file);
            if (upError) throw upError;
            const { data: urlData } = supabaseClient.storage.from(DOC_BUCKET).getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            const doc = documentsList.find(d => d.id === docId);
            if (doc.request_id) {
                const { error: ue } = await supabaseClient
                    .from('supabaseAuthPrive_document_requests')
                    .update({ file_url: publicUrl, file_name: file.name, status: 'pending' })
                    .eq('id', doc.request_id);
                if (ue) throw ue;
            } else {
                const { error: ie } = await supabaseClient
                    .from('supabaseAuthPrive_document_requests')
                    .insert([{
                        user_hubisoccer_id: userProfile.hubisoccer_id,
                        document_type: docId,
                        role: ROLE_NAME,
                        file_url: publicUrl,
                        file_name: file.name,
                        status: 'pending'
                    }]);
                if (ie) throw ie;
            }
            showToast('Document téléversé avec succès ! En attente de validation.', 'success');
            loadDocuments();
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        } finally {
            hideLoader();
        }
    };
    input.click();
}
// Fin fonction uploadDocument

// Début fonctions signature
function openSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.style.display = 'flex';
    if (!signaturePadModal) {
        const canvas = document.getElementById('signatureCanvasModal');
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 300;
        signaturePadModal = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#2c3e50', minWidth: 1, maxWidth: 2.5 });
        if (signatureDataURL) signaturePadModal.fromDataURL(signatureDataURL);
        document.getElementById('clearSignatureModal').addEventListener('click', () => {
            signaturePadModal.clear();
            document.getElementById('signatureStatus').textContent = '';
        });
        document.getElementById('lockSignatureModal').addEventListener('click', (e) => {
            if (signaturePadModal.isEmpty()) { showToast("Veuillez d'abord signer.", 'warning'); return; }
            signatureLocked = !signatureLocked;
            e.target.innerHTML = signatureLocked ? '<i class="fas fa-lock-open"></i> Déverrouiller' : '<i class="fas fa-lock"></i> Verrouiller';
            e.target.classList.toggle('locked', signatureLocked);
            signatureLocked ? signaturePadModal.off() : signaturePadModal.on();
        });
        document.getElementById('saveSignatureModal').addEventListener('click', () => {
            if (signaturePadModal.isEmpty()) { showToast('Veuillez signer avant de valider.', 'warning'); return; }
            signatureDataURL = signaturePadModal.toDataURL('image/png');
            const img = document.getElementById('signatureImage');
            img.src = signatureDataURL;
            img.style.display = 'block';
            document.querySelector('.signature-placeholder').style.display = 'none';
            closeSignatureModal();
            showToast('Signature enregistrée', 'success');
            updateCardPreview();
        });
    }
}
function closeSignatureModal() { document.getElementById('signatureModal').style.display = 'none'; }
window.openSignatureModal = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
// Fin fonctions signature

// Début fonction submitLicense
async function submitLicense(e) {
    e.preventDefault();
    if (!signatureDataURL) { showToast('Veuillez signer avant de soumettre.', 'warning'); return; }
    if (!currentUser || !userProfile) { showToast('Données utilisateur manquantes.', 'error'); return; }
    const btn = document.getElementById('submitLicense');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    showLoader();
    try {
        const formData = {
            nom:            document.getElementById('nom').value,
            prenom:         document.getElementById('prenom').value,
            date_naissance: document.getElementById('dateNaissance').value,
            lieu_naissance: document.getElementById('lieuNaissance').value,
            adresse:        document.getElementById('adresse').value,
            nationalite:    document.getElementById('nationalite').value,
            pays:           document.getElementById('pays').value,
            langue:         document.getElementById('langue').value || null,
            telephone:      document.getElementById('telephone').value,
            taille:         parseInt(document.getElementById('taille').value) || null,
            poids:          parseInt(document.getElementById('poids').value) || null,
            pied_fort:      document.getElementById('pied_fort').value || null,
            structure:      document.getElementById('structure').value || null
        };

        const sigBlob = await (await fetch(signatureDataURL)).blob();
        const sigPath = `signatures/footballeur_${userProfile.hubisoccer_id}_${Date.now()}.png`;
        const { error: upError } = await supabaseClient.storage.from(DOC_BUCKET).upload(sigPath, sigBlob);
        if (upError) throw upError;
        const { data: urlData } = supabaseClient.storage.from(DOC_BUCKET).getPublicUrl(sigPath);
        const signatureUrl = urlData.publicUrl;

        const insertData = {
            user_hubisoccer_id: userProfile.hubisoccer_id,
            role: ROLE_NAME,
            hubisoccer_id: userProfile.hubisoccer_id,
            signature_url: signatureUrl,
            status: 'admin_pending',
            created_at: new Date().toISOString(),
            ...formData
        };

        const { error: insError } = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .insert([insertData]);
        if (insError) throw insError;

        showToast('Demande soumise avec succès ! Elle sera traitée sous 0 à 100h.', 'success');
        document.getElementById('licenseForm').reset();
        sessionStorage.removeItem('licenseFormData_foot');
        signatureDataURL = null;
        signaturePadModal = null;
        const img = document.getElementById('signatureImage'); if (img) img.style.display = 'none';
        const ph = document.querySelector('.signature-placeholder'); if (ph) ph.style.display = 'block';
        checkLicenseStatus();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre ma demande';
        hideLoader();
    }
}
// Fin fonction submitLicense

// Début fonction checkLicenseStatus
async function checkLicenseStatus() {
    if (!userProfile?.hubisoccer_id) return;
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_license_requests')
        .select('*')
        .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
        .eq('role', ROLE_NAME)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error || !data) return;
    licenseRequest = data;
    const section = document.getElementById('statusSection');
    const card = document.getElementById('statusCard');
    if (!section || !card) return;
    section.style.display = 'block';
    const dateStr = new Date(data.created_at).toLocaleDateString('fr-FR');
    if (data.status === 'approved' && data.carte_url) {
        card.innerHTML = `
            <div class="status-icon approved"><i class="fas fa-check-circle"></i></div>
            <div class="status-content">
                <h3>Demande validée !</h3>
                <p>Votre licence ${ROLE_NAME} est prête.</p>
                <a href="${data.carte_url}" class="btn-download" download><i class="fas fa-download"></i> Télécharger ma carte</a>
            </div>
        `;
    } else {
        const msgs = {
            admin_pending: "En attente de validation par l'administration.",
            president_pending: "En attente de validation finale par le Président.",
            rejected: "Demande rejetée. Veuillez en soumettre une nouvelle."
        };
        const msg = msgs[data.status] || 'En cours de traitement.';
        const iclass = data.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
        const cls = data.status === 'rejected' ? 'rejected' : 'pending';
        card.innerHTML = `
            <div class="status-icon ${cls}"><i class="fas ${iclass}"></i></div>
            <div class="status-content">
                <h3>Demande en cours de traitement</h3>
                <p>Soumise le ${dateStr}</p>
                <p>${msg}</p>
                <p class="status-id">Référence : ${data.id}</p>
            </div>
        `;
    }
}
// Fin fonction checkLicenseStatus

// Début fonction updateCardPreview
function updateCardPreview() {
    function get(id) { return document.getElementById(id)?.value || '-'; }
    const nom = get('nom'), prenom = get('prenom'), dateN = get('dateNaissance'), natl = get('nationalite');
    const taille = get('taille'), pied = get('pied_fort'), structure = get('structure'), adresse = get('adresse'), pays = get('pays');
    const dateF = (dateN && dateN !== '-') ? new Date(dateN).toLocaleDateString('fr-FR') : '-';
    const fi = document.getElementById('cardFrontInfo');
    if (fi) fi.innerHTML = `
        <p><span class="label">Nom :</span> <span class="value">${nom.toUpperCase()}</span></p>
        <p><span class="label">Prénom :</span> <span class="value">${prenom}</span></p>
        <p><span class="label">Né(e) le :</span> <span class="value">${dateF}</span></p>
        <p><span class="label">Nationalité :</span> <span class="value">${natl}</span></p>
        <p><span class="label">Taille :</span> <span class="value">${taille} cm</span></p>
        <p><span class="label">Pied fort :</span> <span class="value">${pied}</span></p>
    `;
    const ff = document.getElementById('cardFrontFooter');
    if (ff) ff.innerHTML = `
        <div class="signatures">
            <div class="signature-box">
                ${signatureDataURL ? `<img src="${signatureDataURL}" style="max-height:35px;">` : ''}
                <span class="signature-label">Signature titulaire</span>
            </div>
            <div class="signature-box"><i class="fas fa-stamp"></i><span class="signature-label">Cachet officiel</span></div>
        </div>
        <div class="id-number">HID: ${userProfile?.hubisoccer_id || '-'}</div>
    `;
    const bi = document.getElementById('cardBackInfo');
    if (bi) bi.innerHTML = `
        <p><span class="label">Rôle :</span> <span class="value">${ROLE_NAME}</span></p>
        <p><span class="label">Structure :</span> <span class="value">${structure}</span></p>
        <p><span class="label">Adresse :</span> <span class="value">${adresse}</span></p>
        <p><span class="label">Pays :</span> <span class="value">${pays}</span></p>
        <p><span class="label">Référence :</span> <span class="value">${licenseRequest?.id || '-'}</span></p>
    `;
}
// Fin fonction updateCardPreview

// Début fonction initCardFlip
function initCardFlip() {
    const c = document.querySelector('.card-flip-container');
    const b = document.getElementById('flipCardBtn');
    if (c && b) b.addEventListener('click', () => c.classList.toggle('flipped'));
}
// Fin fonction initCardFlip

// Début fonction initUserMenu
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initSidebar
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
// Fin fonction initSidebar

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout

// Début fonctions sessionStorage
function saveFormToSession() {
    const data = {};
    document.querySelectorAll('#licenseForm input, #licenseForm select').forEach(el => { if (el.id) data[el.id] = el.value; });
    sessionStorage.setItem('licenseFormData_foot', JSON.stringify(data));
}
function restoreFormFromSession() {
    const saved = sessionStorage.getItem('licenseFormData_foot');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        for (const k in data) { const el = document.getElementById(k); if (el) el.value = data[k]; }
    } catch (e) { console.warn('Session restore error', e); }
}
// Fin fonctions sessionStorage

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!userProfile) { showToast('Profil introuvable.', 'error'); return; }
    await loadDocuments();
    await checkLicenseStatus();
    const form = document.getElementById('licenseForm');
    if (form) form.addEventListener('submit', submitLicense);
    document.querySelectorAll('#licenseForm input, #licenseForm select').forEach(el => {
        el.addEventListener('input', () => { updateCardPreview(); saveFormToSession(); });
    });
    restoreFormFromSession();
    updateCardPreview();
    initCardFlip();
    initUserMenu();
    initSidebar();
    initLogout();
    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation DOM
