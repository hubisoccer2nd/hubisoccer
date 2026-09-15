/* ============================================================
   HubISoccer — agent-verif.js
   Page Verification du Statut · Espace Agent FIFA
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       -> partagee (lecture)
   - supabaseAuthPrive_agent_scouting -> deja existante, LICENCE
     ECRITE ICI (numero, dates, cabinet, pays) - le tableau de
     bord la lit deja, une seule saisie
   - supabaseAuthPrive_agent_verif    -> table de CETTE page
     (SQL : agent-verif-table.sql, sans RLS)
   ------------------------------------------------------------
   Une seule fiche de verification par agent (agent_id UNIQUE),
   creee automatiquement au premier chargement. Documents stockes
   en JSONB, chacun televerse immediatement des sa selection.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES & STOCKAGE ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE = 'supabaseAuthPrive_agent_scouting';
const VERIF_TABLE    = 'supabaseAuthPrive_agent_verif';
const DOCS_BUCKET    = 'agent-documents';

/* ---------- 3. DOCUMENTS REQUIS ---------- */
const DOCUMENTS_REQUIS = [
    { id: 'identite_doc', label: 'Piece d\'identite' },
    { id: 'photo_doc',    label: 'Photo d\'identite' },
    { id: 'licence_doc',  label: 'Licence FIFA officielle (scan)' },
    { id: 'diplome_doc',  label: 'Diplome / Certification professionnelle' },
    { id: 'domicile_doc', label: 'Justificatif de domicile' }
];

/* ---------- 4. ETAT GLOBAL ---------- */
let currentUser     = null;
let agentProfile    = null;
let scoutingData      = null;
let verifData          = null;
let signaturePad        = null;

/* ---------- 5. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 6. TOAST (duree 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) { type = 'info'; }
    if (!duration) { duration = 30000; }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
        }
    }, duration);
}

/* ---------- 7. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) { el.textContent = (value !== null && value !== undefined && value !== '') ? value : '—'; }
}
function getInitials(name) {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) { return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); }
    return name.charAt(0).toUpperCase();
}
function escapeHtml(str) {
    if (!str) { return ''; }
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const STATUT_MESSAGES = {
    non_soumise : { icon: 'fa-info-circle', text: 'Votre dossier n\'a pas encore ete soumis. Completez les informations et documents ci-dessous.' },
    en_attente  : { icon: 'fa-hourglass-half', text: 'Votre dossier est en cours d\'examen par l\'equipe HubISoccer.' },
    approuvee   : { icon: 'fa-certificate', text: 'Votre licence est officiellement verifiee par HubISoccer. Le badge est visible sur votre profil.' },
    rejetee     : { icon: 'fa-times-circle', text: 'Votre dossier a ete refuse. Corrigez les informations/documents concernes puis resoumettez-le.' }
};

/* ---------- 8. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 9. CHARGEMENT PROFIL AGENT ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    agentProfile = data;
    setText('userName', agentProfile.full_name || 'Agent FIFA');
    updateNavbarAvatar();
    return agentProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = agentProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(agentProfile?.full_name || 'A');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 10. CHARGEMENT (OU CREATION) DES DONNEES AGENT ---------- */
async function loadScoutingData() {
    if (!agentProfile) { return; }
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .maybeSingle();

    if (error) { return; }

    if (data) {
        scoutingData = data;
        return;
    }

    const { data: created } = await supabaseClient
        .from(SCOUTING_TABLE)
        .insert([{ agent_id: agentProfile.hubisoccer_id }])
        .select()
        .single();
    scoutingData = created || null;
}

/* ---------- 11. CHARGEMENT (OU CREATION) DE LA FICHE VERIFICATION ---------- */
async function loadOrCreateVerifRecord() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(VERIF_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .maybeSingle();

    if (error) {
        hideLoader();
        console.warn('Table ' + VERIF_TABLE + ' absente :', error.message);
        showToast('Table de verification absente. Executez le script SQL <b>agent-verif-table.sql</b> dans Supabase.', 'warning');
        verifData = null;
        return;
    }

    if (data) {
        verifData = data;
        hideLoader();
        return;
    }

    const { data: created, error: createError } = await supabaseClient
        .from(VERIF_TABLE)
        .insert([{ agent_id: agentProfile.hubisoccer_id, documents: [] }])
        .select()
        .single();
    hideLoader();

    if (createError) {
        showToast('Erreur d\'initialisation : ' + createError.message, 'error');
        verifData = null;
        return;
    }
    verifData = created;
}

/* ---------- 12. PRE-REMPLISSAGE DES INFOS DE LICENCE ---------- */
function populateLicenceForm() {
    if (!scoutingData) { return; }
    document.getElementById('numLicence').value = scoutingData.numero_licence_fifa || '';
    document.getElementById('cabinet').value = scoutingData.nom_cabinet || '';
    document.getElementById('dateObtention').value = scoutingData.date_obtention_licence ? scoutingData.date_obtention_licence.substring(0, 10) : '';
    document.getElementById('dateExpiration').value = scoutingData.expire_licence ? scoutingData.expire_licence.substring(0, 10) : '';
    document.getElementById('paysExercice').value = scoutingData.pays_exercice || '';
}

async function enregistrerInfosLicence() {
    const numLicence = (document.getElementById('numLicence')?.value || '').trim();
    const dateObtention = document.getElementById('dateObtention')?.value || '';

    if (!numLicence) { showToast('Le numero de licence FIFA est obligatoire.', 'warning'); return; }
    if (!dateObtention) { showToast('La date d\'obtention est obligatoire.', 'warning'); return; }

    const payload = {
        numero_licence_fifa    : numLicence,
        nom_cabinet             : (document.getElementById('cabinet')?.value || '').trim() || null,
        date_obtention_licence  : dateObtention,
        expire_licence          : document.getElementById('dateExpiration')?.value || null,
        pays_exercice           : (document.getElementById('paysExercice')?.value || '').trim() || null
    };

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .update(payload)
        .eq('agent_id', agentProfile.hubisoccer_id)
        .select()
        .single();
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    scoutingData = updated;
    updateCard();
    showToast('Informations de licence enregistrees. ✅', 'success');
}

/* ---------- 13. BANNIERE DE STATUT ---------- */
function updateStatutBanner() {
    const statut = verifData?.statut_verification || 'non_soumise';
    const banner = document.getElementById('statutBanner');
    const text = document.getElementById('statutBannerText');
    const msg = STATUT_MESSAGES[statut] || STATUT_MESSAGES.non_soumise;

    if (banner) {
        banner.className = 'statut-banner ' + statut;
        banner.querySelector('i').className = 'fas ' + msg.icon;
    }
    if (text) { text.textContent = msg.text; }
}

/* ---------- 14. RENDU DES DOCUMENTS ---------- */
function renderDocuments() {
    const container = document.getElementById('documentsList');
    if (!container) { return; }
    container.innerHTML = '';

    const documentsActuels = (verifData && Array.isArray(verifData.documents)) ? verifData.documents : [];

    DOCUMENTS_REQUIS.forEach(function(reqDoc) {
        const existant = documentsActuels.find(function(d) { return d.id === reqDoc.id; });
        const isUploaded = !!(existant && existant.file_url);

        const item = document.createElement('div');
        item.className = 'document-item' + (isUploaded ? ' uploaded' : '');
        item.innerHTML =
            '<div class="document-icon"><i class="fas ' + (isUploaded ? 'fa-check' : 'fa-file-upload') + '"></i></div>' +
            '<div class="document-info">' +
                '<div class="document-label">' + escapeHtml(reqDoc.label) + '</div>' +
                '<div class="document-status">' + (isUploaded ? 'Televerse : ' + escapeHtml(existant.file_name || '') : 'Aucun fichier') + '</div>' +
            '</div>' +
            '<button class="document-upload-btn" data-doc-id="' + reqDoc.id + '" data-doc-label="' + escapeHtml(reqDoc.label) + '">' +
                '<i class="fas fa-upload"></i> ' + (isUploaded ? 'Remplacer' : 'Televerser') +
            '</button>';
        container.appendChild(item);
    });

    container.querySelectorAll('.document-upload-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            declencherUploadDocument(btn.dataset.docId, btn.dataset.docLabel);
        });
    });
}

/* ---------- 15. TELEVERSEMENT D'UN DOCUMENT (immediat) ---------- */
function declencherUploadDocument(docId, docLabel) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) { return; }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Fichier trop lourd (5 Mo maximum).', 'warning');
            return;
        }
        await uploaderDocument(docId, docLabel, file);
    };
    input.click();
}

async function uploaderDocument(docId, docLabel, file) {
    showLoader();
    try {
        const ext = file.name.split('.').pop();
        const fileName = docId + '_' + Date.now() + '.' + ext;
        const filePath = agentProfile.hubisoccer_id + '/' + fileName;

        const { error: upErr } = await supabaseClient.storage.from(DOCS_BUCKET).upload(filePath, file);
        if (upErr) { throw upErr; }

        const { data: urlData } = supabaseClient.storage.from(DOCS_BUCKET).getPublicUrl(filePath);

        const documentsActuels = (verifData.documents || []).filter(function(d) { return d.id !== docId; });
        documentsActuels.push({ id: docId, label: docLabel, statut: 'televerse', file_url: urlData.publicUrl, file_name: file.name });

        const { data: updated, error } = await supabaseClient
            .from(VERIF_TABLE)
            .update({ documents: documentsActuels })
            .eq('id', verifData.id)
            .select()
            .single();
        hideLoader();

        if (error) { throw error; }

        verifData = updated;
        renderDocuments();
        showToast(docLabel + ' televerse. ✅', 'success');
    } catch (err) {
        hideLoader();
        showToast('Erreur : ' + err.message, 'error');
    }
}

/* ---------- 16. SIGNATURE ---------- */
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas || typeof SignaturePad === 'undefined') { return; }

    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(249, 247, 253)',
        penColor: 'rgb(85, 27, 140)'
    });

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        signaturePad.clear();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const btnClear = document.getElementById('btnClearSignature');
    if (btnClear) {
        btnClear.addEventListener('click', function() { signaturePad.clear(); });
    }
}

function dataURLtoBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
}

/* ---------- 17. CARTE DE LICENCE ---------- */
function updateCard() {
    setText('cardNomRecto', agentProfile?.full_name || '—');
    setText('cardIdRecto', 'ID : ' + (agentProfile?.hubisoccer_id || '—'));

    const statut = verifData?.statut_verification || 'non_soumise';
    const chip = document.getElementById('cardStatusChip');
    const chipLabels = { non_soumise: 'Non soumise', en_attente: 'En attente', approuvee: 'Verifiee ✓', rejetee: 'Refusee' };
    if (chip) { chip.textContent = chipLabels[statut] || 'Non soumise'; }

    setText('cardNumVerso', scoutingData?.numero_licence_fifa || '—');
    setText('cardDatVerso', scoutingData?.date_obtention_licence ? new Date(scoutingData.date_obtention_licence).toLocaleDateString('fr-FR') : '—');
    setText('cardExpVerso', scoutingData?.expire_licence ? new Date(scoutingData.expire_licence).toLocaleDateString('fr-FR') : '—');
    setText('cardCabVerso', scoutingData?.nom_cabinet || '—');
}

function initFlipCard() {
    const btn = document.getElementById('btnFlipCard');
    const card = document.querySelector('.flip-card');
    if (btn && card) {
        btn.addEventListener('click', function() { card.classList.toggle('flipped'); });
    }
}

/* ---------- 18. SOUMETTRE POUR VERIFICATION ---------- */
async function soumettreVerification() {
    if (!scoutingData || !scoutingData.numero_licence_fifa || !scoutingData.date_obtention_licence) {
        showToast('Enregistrez d\'abord vos informations de licence ci-dessus.', 'warning');
        return;
    }

    const documentsActuels = (verifData.documents || []);
    const manquants = DOCUMENTS_REQUIS.filter(function(reqDoc) {
        return !documentsActuels.find(function(d) { return d.id === reqDoc.id && d.file_url; });
    });
    if (manquants.length > 0) {
        showToast('Documents manquants : ' + manquants.map(function(d) { return d.label; }).join(', '), 'warning');
        return;
    }

    if (!signaturePad || signaturePad.isEmpty()) {
        showToast('La signature est obligatoire.', 'warning');
        return;
    }

    if (verifData.statut_verification === 'approuvee' &&
        !confirm('Votre licence est deja verifiee. Resoumettre un dossier remettra votre statut en attente d\'examen. Continuer ?')) {
        return;
    }

    showLoader();
    try {
        const signatureBlob = dataURLtoBlob(signaturePad.toDataURL('image/png'));
        const signaturePath = agentProfile.hubisoccer_id + '/signature_' + Date.now() + '.png';
        const { error: sigErr } = await supabaseClient.storage.from(DOCS_BUCKET).upload(signaturePath, signatureBlob);
        if (sigErr) { throw sigErr; }
        const { data: sigUrlData } = supabaseClient.storage.from(DOCS_BUCKET).getPublicUrl(signaturePath);

        const { data: updated, error } = await supabaseClient
            .from(VERIF_TABLE)
            .update({
                signature_url       : sigUrlData.publicUrl,
                statut_verification : 'en_attente',
                date_soumission      : new Date().toISOString()
            })
            .eq('id', verifData.id)
            .select()
            .single();
        hideLoader();

        if (error) { throw error; }

        verifData = updated;
        updateStatutBanner();
        updateCard();
        showToast('Dossier soumis avec succes. L\'equipe HubISoccer va l\'examiner. 📨', 'success');
    } catch (err) {
        hideLoader();
        showToast('Erreur : ' + err.message, 'error');
    }
}

/* ---------- 19. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) { return; }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 20. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() {
        if (sb) { sb.classList.add('active'); }
        if (ov) { ov.classList.add('active'); }
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) { sb.classList.remove('active'); }
        if (ov) { ov.classList.remove('active'); }
        document.body.style.overflow = '';
    }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) { return; }
        if (e.cancelable) { e.preventDefault(); }
        if (dx > 0 && sx < 40) { open(); } else if (dx < 0) { close(); }
    }, { passive: false });
}

/* ---------- 21. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 22. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadScoutingData();
    await loadOrCreateVerifRecord();

    populateLicenceForm();
    updateStatutBanner();
    renderDocuments();
    updateCard();

    initUserMenu();
    initSidebar();
    initSignaturePad();
    initFlipCard();

    const btnSaveLicence = document.getElementById('btnSaveLicenceInfo');
    if (btnSaveLicence) { btnSaveLicence.addEventListener('click', enregistrerInfosLicence); }

    const btnSubmit = document.getElementById('btnSubmitVerif');
    if (btnSubmit) { btnSubmit.addEventListener('click', soumettreVerification); }

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
