/* ============================================================
   HubISoccer — parrain-verif.js
   Espace Parrain · Vérification & Licence
   Corps - Âme - Esprit
   ============================================================ */

'use strict';

/* DEBUT : CONFIGURATION SUPABASE */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
/* FIN : CONFIGURATION SUPABASE */

/* DEBUT : ÉTAT GLOBAL */
let currentUser       = null;
let userProfile       = null;
let scoutingData      = null;
let documentsList     = [];
let licenseRequest    = null;
let signaturePadModal = null;
let signatureLocked   = false;
let signatureDataURL  = null;

const ROLE_NAME      = 'Parrain';
const ROLE_PREFIX    = 'parrain';
const SCOUTING_TABLE = 'supabaseAuthPrive_parrain_scouting';
const ROLE_FIELD     = 'type_engagement';
const ROLE_FIELD_LBL = 'Type d\'engagement';
/* FIN : ÉTAT GLOBAL */

/* DEBUT : FONCTION SHOWTOAST */
function showToast(message, type, duration) {
    type     = type || 'info';
    duration = duration || 30000;
    var c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    var icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { t.remove(); }, 300);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { t.remove(); }, 300);
        }
    }, duration);
}
/* FIN : FONCTION SHOWTOAST */

/* DEBUT : FONCTION GETINITIALS */
function getInitials(name) {
    if (!name) return '?';
    var p = name.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name[0]).toUpperCase();
}
/* FIN : FONCTION GETINITIALS */

/* DEBUT : FONCTION UPDATEAVATARUI */
function updateAvatarUI() {
    var ni = document.getElementById('userAvatar');
    var nn = document.getElementById('userAvatarInitials');
    var url = userProfile && userProfile.avatar_url;
    if (url && url !== '') {
        if (ni) { ni.src = url; ni.style.display = 'block'; }
        if (nn) nn.style.display = 'none';
    } else {
        var init = getInitials((userProfile && userProfile.full_name) || 'U');
        if (nn) { nn.textContent = init; nn.style.display = 'flex'; }
        if (ni) ni.style.display = 'none';
    }
}
/* FIN : FONCTION UPDATEAVATARUI */

/* DEBUT : FONCTION CHECKSESSION */
async function checkSession() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        return null;
    }
    currentUser = user;
    return currentUser;
}
/* FIN : FONCTION CHECKSESSION */

/* DEBUT : FONCTION LOADPROFILE */
async function loadProfile() {
    if (!currentUser || !currentUser.id) return;
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, email, phone, birth_date, country_code, avatar_url, height, weight')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return;
    }
    userProfile = data;

    const { data: scData, error: scError } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('parrain_id', userProfile.hubisoccer_id)
        .maybeSingle();
    scoutingData = scData || {};

    document.getElementById('userName').textContent = userProfile.full_name || ROLE_NAME;
    updateAvatarUI();
    populateFormFromProfile();
}
/* FIN : FONCTION LOADPROFILE */

/* DEBUT : FONCTION POPULATEFORMFROMPROFILE */
function populateFormFromProfile() {
    if (!userProfile) return;
    var nameParts = (userProfile.full_name || '').split(' ');
    var prenom = nameParts[0] || '';
    var nom = nameParts.slice(1).join(' ') || '';
    function set(id, val) { var el = document.getElementById(id); if (el && val) el.value = val; }
    set('nom', nom);
    set('prenom', prenom);
    set('dateNaissance', userProfile.birth_date);
    set('nationalite', userProfile.country_code);
    set('telephone', userProfile.phone);
    set('taille', userProfile.height);
    set('poids', userProfile.weight);
    if (scoutingData && scoutingData[ROLE_FIELD]) set(ROLE_FIELD, scoutingData[ROLE_FIELD]);
    set('structure', scoutingData.organisme || scoutingData.structure || scoutingData.club || '');
    updateCardPreview();
}
/* FIN : FONCTION POPULATEFORMFROMPROFILE */

/* DEBUT : FONCTION LOADDOCUMENTS */
async function loadDocuments() {
    var requiredDocs = [
        { id: 'id_card',              name: "Pièce d'identité (CNI / Passeport)",       type: 'identity' },
        { id: 'photo',                name: "Photo d'identité (récente)",                type: 'photo' },
        { id: 'certificat_medical',   name: "Certificat médical (moins de 3 mois)",      type: 'medical' },
        { id: 'diplome',              name: "Diplôme / Certificat (si applicable)",       type: 'diploma' },
        { id: 'justificatif_domicile',name: "Justificatif de domicile",                  type: 'address' }
    ];
    if (userProfile && userProfile.hubisoccer_id) {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_document_requests')
            .select('*')
            .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
            .eq('role', ROLE_NAME);
        if (!error && data) {
            documentsList = requiredDocs.map(function(doc) {
                var existing = data.find(function(d) { return d.document_type === doc.id; });
                return {
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    status: (existing && existing.status) || 'pending',
                    file_url: (existing && existing.file_url) || null,
                    file_name: (existing && existing.file_name) || null,
                    request_id: (existing && existing.id) || null
                };
            });
            renderDocuments();
            return;
        }
    }
    documentsList = requiredDocs.map(function(doc) {
        return { id: doc.id, name: doc.name, type: doc.type, status: 'pending', file_url: null, file_name: null, request_id: null };
    });
    renderDocuments();
}
/* FIN : FONCTION LOADDOCUMENTS */

/* DEBUT : FONCTION RENDERDOCUMENTS */
function renderDocuments() {
    var grid = document.getElementById('documentsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    var statusIcons  = { pending: 'fa-clock', approved: 'fa-check-circle', rejected: 'fa-times-circle' };
    documentsList.forEach(function(doc) {
        var card = document.createElement('div');
        card.className = 'document-card ' + doc.status;
        card.innerHTML =
            '<div class="document-header">' +
            '<span class="document-name"><i class="fas ' + (statusIcons[doc.status] || 'fa-file-alt') + '"></i> ' + doc.name + '</span>' +
            '<span class="document-status ' + doc.status + '">' + (statusLabels[doc.status] || 'En attente') + '</span>' +
            '</div>' +
            '<div class="document-actions">' +
            (doc.status !== 'approved' ? '<button class="btn-upload" data-doc-id="' + doc.id + '"><i class="fas fa-upload"></i> Téléverser</button>' : '') +
            (doc.file_url ? '<a href="' + doc.file_url + '" target="_blank" class="btn-view"><i class="fas fa-eye"></i> Voir</a>' : '') +
            '</div>' +
            (doc.file_name ? '<div class="document-file-name"><i class="fas fa-paperclip"></i> ' + doc.file_name + '</div>' : '');
        grid.appendChild(card);
    });
    document.querySelectorAll('.btn-upload').forEach(function(btn) {
        btn.addEventListener('click', function(e) { uploadDocument(e.currentTarget.dataset.docId); });
    });
}
/* FIN : FONCTION RENDERDOCUMENTS */

/* DEBUT : FONCTION UPLOADDOCUMENT */
async function uploadDocument(docId) {
    if (!currentUser || !userProfile) { showToast('Utilisateur non connecté', 'error'); return; }
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async function(e) {
        var file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Fichier trop lourd (max 5 Mo)', 'warning'); return; }
        try {
            var ext = file.name.split('.').pop();
            var fileName = currentUser.id + '_' + docId + '_' + Date.now() + '.' + ext;
            var filePath = ROLE_PREFIX + '_docs/' + fileName;
            var up = await supabaseClient.storage.from('documents').upload(filePath, file);
            if (up.error) throw up.error;
            var urlData = supabaseClient.storage.from('documents').getPublicUrl(filePath);
            var publicUrl = urlData.data.publicUrl;
            var doc = documentsList.find(function(d) { return d.id === docId; });
            if (doc.request_id) {
                var ue = await supabaseClient
                    .from('supabaseAuthPrive_document_requests')
                    .update({ file_url: publicUrl, file_name: file.name, status: 'pending' })
                    .eq('id', doc.request_id);
                if (ue.error) throw ue.error;
            } else {
                var ie = await supabaseClient
                    .from('supabaseAuthPrive_document_requests')
                    .insert([{
                        user_hubisoccer_id: userProfile.hubisoccer_id,
                        document_type: docId,
                        role: ROLE_NAME,
                        file_url: publicUrl,
                        file_name: file.name,
                        status: 'pending'
                    }]);
                if (ie.error) throw ie.error;
            }
            showToast('Document téléversé avec succès ! En attente de validation.', 'success');
            loadDocuments();
        } catch (err) { showToast('Erreur : ' + err.message, 'error'); }
    };
    input.click();
}
/* FIN : FONCTION UPLOADDOCUMENT */

/* DEBUT : FONCTIONS SIGNATURE */
function openSignatureModal() {
    var modal = document.getElementById('signatureModal');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    if (!signaturePadModal) {
        var canvas = document.getElementById('signatureCanvasModal');
        canvas.width  = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 300;
        signaturePadModal = new SignaturePad(canvas, {
            backgroundColor: 'white',
            penColor: '#2c3e50',
            minWidth: 1,
            maxWidth: 2.5
        });
        if (signatureDataURL) signaturePadModal.fromDataURL(signatureDataURL);
        document.getElementById('clearSignatureModal').addEventListener('click', function() {
            signaturePadModal.clear();
            document.getElementById('signatureStatus').textContent = '';
        });
        document.getElementById('lockSignatureModal').addEventListener('click', function(e) {
            if (signaturePadModal.isEmpty()) { showToast("Veuillez d'abord signer.", 'warning'); return; }
            signatureLocked = !signatureLocked;
            e.target.innerHTML = signatureLocked
                ? '<i class="fas fa-lock-open"></i> Déverrouiller'
                : '<i class="fas fa-lock"></i> Verrouiller';
            e.target.classList.toggle('locked', signatureLocked);
            signatureLocked ? signaturePadModal.off() : signaturePadModal.on();
        });
        document.getElementById('saveSignatureModal').addEventListener('click', function() {
            if (signaturePadModal.isEmpty()) { showToast('Veuillez signer avant de valider.', 'warning'); return; }
            signatureDataURL = signaturePadModal.toDataURL('image/png');
            var img = document.getElementById('signatureImage');
            img.src = signatureDataURL;
            img.style.display = 'block';
            document.querySelector('.signature-placeholder').style.display = 'none';
            closeSignatureModal();
            showToast('Signature enregistrée', 'success');
        });
        canvas.addEventListener('touchstart', function(e) { e.preventDefault(); }, { passive: false });
    }
}

function closeSignatureModal() { document.getElementById('signatureModal').style.display = 'none'; }
window.openSignatureModal  = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
/* FIN : FONCTIONS SIGNATURE */

/* DEBUT : FONCTION SUBMITLICENSE */
async function submitLicense(e) {
    e.preventDefault();
    if (!signatureDataURL) { showToast('Veuillez signer avant de soumettre.', 'warning'); return; }
    if (!currentUser || !userProfile) { showToast('Données utilisateur manquantes.', 'error'); return; }
    var btn = document.getElementById('submitLicense');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    try {
        var formData = {
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
            structure:      document.getElementById('structure').value || null
        };
        formData[ROLE_FIELD] = document.getElementById(ROLE_FIELD).value || null;

        var sigBlob = await (await fetch(signatureDataURL)).blob();
        var sigPath = 'signatures/' + ROLE_PREFIX + '_' + currentUser.id + '_' + Date.now() + '.png';
        var up = await supabaseClient.storage.from('documents').upload(sigPath, sigBlob);
        if (up.error) throw up.error;
        var urlData = supabaseClient.storage.from('documents').getPublicUrl(sigPath);
        var signatureUrl = urlData.data.publicUrl;

        var insertData = Object.assign({
            user_hubisoccer_id: userProfile.hubisoccer_id,
            role: ROLE_NAME,
            hubisoccer_id: userProfile.hubisoccer_id || null,
            signature_url: signatureUrl,
            status: 'admin_pending',
            created_at: new Date().toISOString()
        }, formData);

        var ins = await supabaseClient
            .from('supabaseAuthPrive_license_requests')
            .insert([insertData])
            .select()
            .single();
        if (ins.error) throw ins.error;
        licenseRequest = ins.data;
        showToast('Demande soumise avec succès ! Elle sera traitée sous 0 à 100h.', 'success');
        document.getElementById('licenseForm').reset();
        sessionStorage.removeItem('licenseFormData_parrain');
        signatureDataURL = null;
        signaturePadModal = null;
        var img = document.getElementById('signatureImage');
        if (img) img.style.display = 'none';
        var ph = document.querySelector('.signature-placeholder');
        if (ph) ph.style.display = 'block';
        checkLicenseStatus();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre ma demande';
    }
}
/* FIN : FONCTION SUBMITLICENSE */

/* DEBUT : FONCTION CHECKLICENSESTATUS */
async function checkLicenseStatus() {
    if (!userProfile || !userProfile.hubisoccer_id) return;
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
    var section = document.getElementById('statusSection'),
        card    = document.getElementById('statusCard');
    if (!section || !card) return;
    section.style.display = 'block';
    var dateStr = new Date(data.created_at).toLocaleDateString('fr-FR');
    if (data.status === 'approved' && data.carte_url) {
        card.innerHTML =
            '<div class="status-icon approved"><i class="fas fa-check-circle"></i></div>' +
            '<div class="status-content"><h3>Demande validée !</h3>' +
            '<p>Votre licence ' + ROLE_NAME + ' est prête.</p>' +
            '<a href="' + data.carte_url + '" class="btn-download" download><i class="fas fa-download"></i> Télécharger ma carte</a></div>';
    } else {
        var msgs = {
            admin_pending: "En attente de validation par l'administration.",
            president_pending: "En attente de validation finale par le Président.",
            rejected: "Demande rejetée. Veuillez en soumettre une nouvelle."
        };
        var msg = msgs[data.status] || 'En cours de traitement.';
        var iclass = data.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
        var cls = data.status === 'rejected' ? 'rejected' : 'pending';
        card.innerHTML =
            '<div class="status-icon ' + cls + '"><i class="fas ' + iclass + '"></i></div>' +
            '<div class="status-content"><h3>Demande en cours de traitement</h3>' +
            '<p>Soumise le ' + dateStr + '</p>' +
            '<p>' + msg + '</p>' +
            '<p class="status-id">Référence : ' + data.id + '</p></div>';
    }
}
/* FIN : FONCTION CHECKLICENSESTATUS */

/* DEBUT : FONCTION UPDATECARDPREVIEW */
function updateCardPreview() {
    function get(id) { return (document.getElementById(id) && document.getElementById(id).value) || '-'; }
    var nom = get('nom'), prenom = get('prenom'), dateN = get('dateNaissance'), natl = get('nationalite');
    var taille = get('taille'), roleVal = get(ROLE_FIELD), structure = get('structure'), adresse = get('adresse'), pays = get('pays');
    var dateF = (dateN && dateN !== '-') ? new Date(dateN).toLocaleDateString('fr-FR') : '-';
    var fi = document.getElementById('cardFrontInfo');
    if (fi) fi.innerHTML =
        '<p><span class="label">Nom :</span> <span class="value">' + nom.toUpperCase() + '</span></p>' +
        '<p><span class="label">Prénom :</span> <span class="value">' + prenom + '</span></p>' +
        '<p><span class="label">Né(e) le :</span> <span class="value">' + dateF + '</span></p>' +
        '<p><span class="label">Nationalité :</span> <span class="value">' + natl + '</span></p>' +
        '<p><span class="label">Taille :</span> <span class="value">' + taille + ' cm</span></p>' +
        '<p><span class="label">Type d\'engagement :</span> <span class="value">' + roleVal + '</span></p>';
    var ff = document.getElementById('cardFrontFooter');
    if (ff) ff.innerHTML =
        '<div class="signatures">' +
        '<div class="signature-box">' + (signatureDataURL ? '<img src="' + signatureDataURL + '" style="max-height:35px;">' : '') +
        '<span class="signature-label">Signature titulaire</span></div>' +
        '<div class="signature-box"><i class="fas fa-stamp"></i><span class="signature-label">Cachet officiel</span></div>' +
        '</div>' +
        '<div class="id-number">HID: ' + ((userProfile && userProfile.hubisoccer_id) || '-') + '</div>';
    var bi = document.getElementById('cardBackInfo');
    if (bi) bi.innerHTML =
        '<p><span class="label">Rôle :</span> <span class="value">' + ROLE_NAME + '</span></p>' +
        '<p><span class="label">Structure :</span> <span class="value">' + structure + '</span></p>' +
        '<p><span class="label">Adresse :</span> <span class="value">' + adresse + '</span></p>' +
        '<p><span class="label">Pays :</span> <span class="value">' + pays + '</span></p>' +
        '<p><span class="label">Référence :</span> <span class="value">' + (licenseRequest && licenseRequest.id ? licenseRequest.id : '-') + '</span></p>';
}
/* FIN : FONCTION UPDATECARDPREVIEW */

/* DEBUT : FONCTION INITCARDFLIP */
function initCardFlip() {
    var c = document.querySelector('.card-flip-container'),
        b = document.getElementById('flipCardBtn');
    if (c && b) b.addEventListener('click', function() { c.classList.toggle('flipped'); });
}
/* FIN : FONCTION INITCARDFLIP */

/* DEBUT : FONCTION INITUSERMENU */
function initUserMenu() {
    var m = document.getElementById('userMenu'),
        d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', function(e) { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', function() { d.classList.remove('show'); });
}
/* FIN : FONCTION INITUSERMENU */

/* DEBUT : FONCTION INITSIDEBAR */
function initSidebar() {
    var sb = document.getElementById('leftSidebar'),
        ov = document.getElementById('sidebarOverlay'),
        mb = document.getElementById('menuToggle'),
        cb = document.getElementById('closeSidebar');
    function open()  { if (sb) sb.classList.add('active'); if (ov) ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { if (sb) sb.classList.remove('active'); if (ov) ov.classList.remove('active'); document.body.style.overflow = ''; }
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    var sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].screenX - sx,
            dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}
/* FIN : FONCTION INITSIDEBAR */

/* DEBUT : FONCTION INITLOGOUT */
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        });
    });
}
/* FIN : FONCTION INITLOGOUT */

/* DEBUT : FONCTION SAVEFORMTOSESSION */
function saveFormToSession() {
    var data = {};
    document.querySelectorAll('#licenseForm input, #licenseForm select').forEach(function(el) {
        if (el.id) data[el.id] = el.value;
    });
    sessionStorage.setItem('licenseFormData_parrain', JSON.stringify(data));
}
/* FIN : FONCTION SAVEFORMTOSESSION */

/* DEBUT : FONCTION RESTOREFORMFROMSESSION */
function restoreFormFromSession() {
    var saved = sessionStorage.getItem('licenseFormData_parrain');
    if (!saved) return;
    try {
        var data = JSON.parse(saved);
        for (var k in data) {
            var el = document.getElementById(k);
            if (el) el.value = data[k];
        }
    } catch (e) { console.warn('Session restore error', e); }
}
/* FIN : FONCTION RESTOREFORMFROMSESSION */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    var user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!userProfile) { showToast('Profil introuvable.', 'error'); return; }
    await loadDocuments();
    await checkLicenseStatus();
    var form = document.getElementById('licenseForm');
    if (form) form.addEventListener('submit', submitLicense);
    document.querySelectorAll('#licenseForm input, #licenseForm select').forEach(function(el) {
        el.addEventListener('input', function() { updateCardPreview(); saveFormToSession(); });
    });
    restoreFormFromSession();
    updateCardPreview();
    initCardFlip();
    initUserMenu();
    initSidebar();
    initLogout();
    var ls = document.getElementById('langSelect');
    if (ls) ls.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */