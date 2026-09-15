/* ============================================================
   HubISoccer — coach-verif.js
   Page Vérification & Licence · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles      → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_dash    → lecture seule (pré-remplissage
     du champ "Structure" à partir du club_actuel si disponible)
   - supabaseAuthPrive_coach_verif   → table de CETTE page
     (SQL : coach-verif-table.sql, sans RLS)
   ------------------------------------------------------------
   Une SEULE fiche par coach (coach_id UNIQUE). Elle est créée
   automatiquement au premier chargement de la page (statut_licence
   = 'non_soumise'), puis mise à jour au fil des actions :
   téléversement de documents, soumission de la demande de licence.
   Bucket de stockage : 'coach-documents' (créé par le SQL).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES & STOCKAGE ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';       // partagée
const DASH_TABLE      = 'supabaseAuthPrive_coach_dash';    // lecture seule (club_actuel)
const VERIF_TABLE     = 'supabaseAuthPrive_coach_verif';   // cette page
const DOCS_BUCKET     = 'coach-documents';

/* ---------- 3. DOCUMENTS REQUIS (définition fixe) ---------- */
const DOCUMENTS_REQUIS = [
    { id: 'id_card',               nom: 'Pièce d\'identité (CNI / Passeport)' },
    { id: 'photo',                 nom: 'Photo d\'identité (récente)' },
    { id: 'certificat_medical',    nom: 'Certificat médical (moins de 3 mois)' },
    { id: 'diplome',                nom: 'Diplôme / Certification d\'entraîneur (UEFA, CAF, FIFA…)' },
    { id: 'justificatif_domicile', nom: 'Justificatif de domicile' }
];

/* ---------- 4. ÉTAT GLOBAL ---------- */
let currentUser       = null;
let coachProfile      = null;
let verifRecord       = null;   // ligne de supabaseAuthPrive_coach_verif
let signaturePadModal = null;
let signatureLocked   = false;
let signatureDataURL  = null;

/* ---------- 5. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'flex';
    }
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'none';
    }
}

/* ---------- 6. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
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
        setTimeout(function() {
            if (t.parentNode) {
                t.remove();
            }
        }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (t.parentNode) {
                    t.remove();
                }
            }, 320);
        }
    }, duration);
}

/* ---------- 7. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (value !== null && value !== undefined) {
            el.textContent = value;
        } else {
            el.textContent = '—';
        }
    }
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function escapeHtml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateFr(iso) {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== null && val !== undefined && val !== '') {
        el.value = val;
    }
}

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

/* ---------- 9. CHARGEMENT PROFIL COACH ---------- */
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
    coachProfile = data;
    setText('userName', coachProfile.full_name || 'Coach / Entraîneur');
    updateNavbarAvatar();
    return coachProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = coachProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(coachProfile?.full_name || 'C');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 10. CHARGEMENT (OU CRÉATION) DE LA FICHE VÉRIFICATION ---------- */
async function loadOrCreateVerifRecord() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(VERIF_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .maybeSingle();

    if (error) {
        hideLoader();
        console.warn('⚠️ Table ' + VERIF_TABLE + ' :', error.message);
        showToast('Table de vérification absente. Exécutez le script SQL <b>coach-verif-table.sql</b> dans Supabase.', 'warning');
        verifRecord = null;
        return;
    }

    if (data) {
        verifRecord = data;
        hideLoader();
        return;
    }

    /* Aucune fiche encore → on en crée une par défaut */
    const { data: created, error: createError } = await supabaseClient
        .from(VERIF_TABLE)
        .insert([{
            coach_id  : coachProfile.hubisoccer_id,
            coach_nom : coachProfile.full_name || null,
            documents : []
        }])
        .select()
        .single();
    hideLoader();

    if (createError) {
        showToast('Erreur d\'initialisation : ' + createError.message, 'error');
        verifRecord = null;
        return;
    }
    verifRecord = created;
}

/* ---------- 11. PRÉ-REMPLISSAGE "STRUCTURE" DEPUIS LE DASHBOARD ---------- */
async function preremplirStructureDepuisDash() {
    if (!coachProfile || (verifRecord && verifRecord.structure)) {
        return; /* déjà une valeur enregistrée par le coach → priorité à sa saisie */
    }
    const { data } = await supabaseClient
        .from(DASH_TABLE)
        .select('club_actuel')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .maybeSingle();
    if (data && data.club_actuel) {
        setVal('lfStructure', data.club_actuel);
    }
}

/* ---------- 12. PRÉ-REMPLISSAGE DU FORMULAIRE ---------- */
function populateFormulaire() {
    if (!verifRecord) {
        return;
    }

    /* Nom / prénom : priorité à la fiche verif, sinon on déduit du profil */
    if (verifRecord.nom || verifRecord.prenom) {
        setVal('lfNom', verifRecord.nom);
        setVal('lfPrenom', verifRecord.prenom);
    } else if (coachProfile?.full_name) {
        const parts  = coachProfile.full_name.trim().split(/\s+/);
        const prenom = parts[0] || '';
        const nom    = parts.slice(1).join(' ') || '';
        setVal('lfPrenom', prenom);
        setVal('lfNom', nom);
    }

    setVal('lfDateNaissance', verifRecord.date_naissance);
    setVal('lfLieuNaissance', verifRecord.lieu_naissance);
    setVal('lfAdresse', verifRecord.adresse);
    setVal('lfNationalite', verifRecord.nationalite);
    setVal('lfPays', verifRecord.pays);
    setVal('lfLangue', verifRecord.langue);
    setVal('lfTelephone', verifRecord.telephone || coachProfile?.phone);
    setVal('lfTaille', verifRecord.taille);
    setVal('lfPoids', verifRecord.poids);
    setVal('lfSpecialite', verifRecord.specialite);
    setVal('lfStructure', verifRecord.structure);

    if (verifRecord.signature_url) {
        signatureDataURL = verifRecord.signature_url;
        const img = document.getElementById('signatureImage');
        const ph  = document.getElementById('signaturePlaceholder');
        if (img) { img.src = signatureDataURL; img.style.display = 'block'; }
        if (ph)  { ph.style.display = 'none'; }
    }

    updateCardPreview();
}

/* ---------- 13. STATS RAPIDES ---------- */
function updateStats() {
    const docs = (verifRecord && Array.isArray(verifRecord.documents)) ? verifRecord.documents : [];

    let fournis = 0;
    let valides = 0;
    DOCUMENTS_REQUIS.forEach(function(def) {
        const entry = docs.find(function(d) { return d.id === def.id; });
        if (entry && entry.file_url) {
            fournis++;
        }
        if (entry && entry.statut === 'approved') {
            valides++;
        }
    });

    setText('statDocsComplets', fournis + '/' + DOCUMENTS_REQUIS.length);
    setText('statDocsValides', valides);

    const statutLabels = {
        non_soumise       : 'Aucune demande',
        admin_pending      : 'En cours (admin)',
        president_pending  : 'En cours (final)',
        approved           : 'Licence validée',
        rejected            : 'Rejetée'
    };
    const statut = verifRecord?.statut_licence || 'non_soumise';
    setText('statStatutLicence', statutLabels[statut] || 'Aucune demande');

    const icon = document.getElementById('statutIcon');
    if (icon) {
        icon.className = 'fas ' +
            (statut === 'approved' ? 'fa-check-circle' :
             statut === 'rejected' ? 'fa-times-circle' :
             statut === 'non_soumise' ? 'fa-id-card' : 'fa-hourglass-half');
    }

    /* Badge de notification = documents manquants */
    setText('notifBadge', DOCUMENTS_REQUIS.length - fournis);
}

/* ---------- 14. RENDU DES DOCUMENTS ---------- */
function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    if (!grid) {
        return;
    }
    const docs = (verifRecord && Array.isArray(verifRecord.documents)) ? verifRecord.documents : [];
    grid.innerHTML = '';

    const statusLabels = { manquant: 'Manquant', pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    const statusIcons  = { manquant: 'fa-file-circle-question', pending: 'fa-hourglass-half', approved: 'fa-check-circle', rejected: 'fa-times-circle' };

    DOCUMENTS_REQUIS.forEach(function(def) {
        const entry  = docs.find(function(d) { return d.id === def.id; });
        const statut = entry ? (entry.statut || 'pending') : 'manquant';

        const card = document.createElement('div');
        card.className = 'document-card ' + statut;
        card.innerHTML =
            '<div class="document-header">' +
                '<span class="document-name"><i class="fas ' + statusIcons[statut] + '"></i> ' + escapeHtml(def.nom) + '</span>' +
                '<span class="document-status ' + statut + '">' + statusLabels[statut] + '</span>' +
            '</div>' +
            (entry && entry.file_name
                ? '<div class="document-file-name"><i class="fas fa-paperclip"></i> ' + escapeHtml(entry.file_name) + '</div>'
                : '') +
            '<div class="document-actions">' +
                (statut !== 'approved'
                    ? '<button class="btn-upload" data-doc-id="' + def.id + '"><i class="fas fa-upload"></i> Téléverser</button>'
                    : '') +
                (entry && entry.file_url
                    ? '<a href="' + escapeHtml(entry.file_url) + '" target="_blank" rel="noopener noreferrer" class="btn-view"><i class="fas fa-eye"></i> Voir</a>'
                    : '') +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-upload').forEach(function(btn) {
        btn.addEventListener('click', function() {
            uploadDocument(btn.dataset.docId);
        });
    });
}

/* ---------- 15. TÉLÉVERSEMENT D'UN DOCUMENT ---------- */
async function uploadDocument(docId) {
    if (!currentUser || !coachProfile || !verifRecord) {
        showToast('Chargement en cours, réessayez dans un instant.', 'warning');
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Fichier trop lourd (5 Mo maximum).', 'warning');
            return;
        }

        showLoader();
        try {
            const ext      = file.name.split('.').pop();
            const fileName = docId + '_' + Date.now() + '.' + ext;
            const filePath = coachProfile.hubisoccer_id + '/' + fileName;

            const { error: upErr } = await supabaseClient.storage
                .from(DOCS_BUCKET)
                .upload(filePath, file);
            if (upErr) {
                throw upErr;
            }

            const { data: urlData } = supabaseClient.storage
                .from(DOCS_BUCKET)
                .getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            /* Mise à jour du tableau JSONB local */
            const docs = Array.isArray(verifRecord.documents) ? verifRecord.documents.slice() : [];
            const idx  = docs.findIndex(function(d) { return d.id === docId; });
            const nouvelleEntree = { id: docId, statut: 'pending', file_url: publicUrl, file_name: file.name };
            if (idx >= 0) {
                docs[idx] = nouvelleEntree;
            } else {
                docs.push(nouvelleEntree);
            }

            const { data: updated, error: updErr } = await supabaseClient
                .from(VERIF_TABLE)
                .update({ documents: docs })
                .eq('id', verifRecord.id)
                .select()
                .single();
            hideLoader();

            if (updErr) {
                throw updErr;
            }

            verifRecord = updated;
            showToast('Document téléversé avec succès ! En attente de validation. 📄', 'success');
            updateStats();
            renderDocuments();
        } catch (err) {
            hideLoader();
            showToast('Erreur : ' + err.message, 'error');
        }
    };
    input.click();
}

/* ---------- 16. MODALE DE SIGNATURE ---------- */
function openSignatureModal() {
    const modal = document.getElementById('signatureModal');
    if (!modal) {
        return;
    }
    modal.style.display = 'flex';

    if (!signaturePadModal) {
        const canvas = document.getElementById('signatureCanvasModal');
        canvas.width  = canvas.offsetWidth  || 800;
        canvas.height = canvas.offsetHeight || 300;

        signaturePadModal = new SignaturePad(canvas, {
            backgroundColor : 'white',
            penColor        : '#2c3e50',
            minWidth        : 1,
            maxWidth        : 2.5
        });

        document.getElementById('clearSignatureModal').addEventListener('click', function() {
            signaturePadModal.clear();
            document.getElementById('signatureStatus').textContent = '';
        });

        document.getElementById('lockSignatureModal').addEventListener('click', function(e) {
            if (signaturePadModal.isEmpty()) {
                showToast('Veuillez d\'abord signer.', 'warning');
                return;
            }
            signatureLocked = !signatureLocked;
            e.currentTarget.innerHTML = signatureLocked
                ? '<i class="fas fa-lock-open"></i> Déverrouiller'
                : '<i class="fas fa-lock"></i> Verrouiller';
            e.currentTarget.classList.toggle('locked', signatureLocked);
            if (signatureLocked) {
                signaturePadModal.off();
            } else {
                signaturePadModal.on();
            }
            document.getElementById('signatureStatus').textContent =
                signatureLocked ? 'Signature verrouillée.' : '';
        });

        document.getElementById('saveSignatureModal').addEventListener('click', function() {
            if (signaturePadModal.isEmpty()) {
                showToast('Veuillez signer avant de valider.', 'warning');
                return;
            }
            signatureDataURL = signaturePadModal.toDataURL('image/png');
            const img = document.getElementById('signatureImage');
            const ph  = document.getElementById('signaturePlaceholder');
            if (img) { img.src = signatureDataURL; img.style.display = 'block'; }
            if (ph)  { ph.style.display = 'none'; }
            closeSignatureModal();
            updateCardPreview();
            showToast('Signature enregistrée. ✅', 'success');
        });

        canvas.addEventListener('touchstart', function(e) { e.preventDefault(); }, { passive: false });
    }
}

function closeSignatureModal() {
    const modal = document.getElementById('signatureModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/* ---------- 17. APERÇU DE LA CARTE (RECTO-VERSO) ---------- */
function updateCardPreview() {
    const nom       = getVal('lfNom') || '—';
    const prenom    = getVal('lfPrenom') || '—';
    const dateNaiss = getVal('lfDateNaissance');
    const natl      = getVal('lfNationalite') || '—';
    const taille    = getVal('lfTaille') || '—';
    const specialite= getVal('lfSpecialite') || '—';
    const structure = getVal('lfStructure') || '—';
    const adresse   = getVal('lfAdresse') || '—';
    const pays      = getVal('lfPays') || '—';

    const dateFormatted = dateNaiss ? new Date(dateNaiss).toLocaleDateString('fr-FR') : '—';

    const frontInfo = document.getElementById('cardFrontInfo');
    if (frontInfo) {
        frontInfo.innerHTML =
            '<p><span class="label">Nom :</span><span class="value">' + escapeHtml(nom.toUpperCase()) + '</span></p>' +
            '<p><span class="label">Prénom :</span><span class="value">' + escapeHtml(prenom) + '</span></p>' +
            '<p><span class="label">Né(e) le :</span><span class="value">' + dateFormatted + '</span></p>' +
            '<p><span class="label">Nationalité :</span><span class="value">' + escapeHtml(natl) + '</span></p>' +
            '<p><span class="label">Taille :</span><span class="value">' + escapeHtml(String(taille)) + ' cm</span></p>' +
            '<p><span class="label">Spécialité :</span><span class="value">' + escapeHtml(specialite) + '</span></p>';
    }

    const frontFooter = document.getElementById('cardFrontFooter');
    if (frontFooter) {
        frontFooter.innerHTML =
            '<div class="signatures">' +
                '<div class="signature-box">' +
                    (signatureDataURL ? '<img src="' + signatureDataURL + '" style="max-height:26px;" alt="Signature">' : '<i class="fas fa-pen"></i>') +
                    '<span class="signature-label">Signature titulaire</span>' +
                '</div>' +
                '<div class="signature-box">' +
                    '<i class="fas fa-stamp"></i>' +
                    '<span class="signature-label">Cachet officiel</span>' +
                '</div>' +
            '</div>' +
            '<div class="id-number">HID : ' + escapeHtml(coachProfile?.hubisoccer_id || '—') + '</div>';
    }

    const backInfo = document.getElementById('cardBackInfo');
    if (backInfo) {
        backInfo.innerHTML =
            '<p><span class="label">Rôle :</span><span class="value">Coach / Entraîneur</span></p>' +
            '<p><span class="label">Structure :</span><span class="value">' + escapeHtml(structure) + '</span></p>' +
            '<p><span class="label">Adresse :</span><span class="value">' + escapeHtml(adresse) + '</span></p>' +
            '<p><span class="label">Pays :</span><span class="value">' + escapeHtml(pays) + '</span></p>' +
            '<p><span class="label">N° référence :</span><span class="value">' + escapeHtml(String(verifRecord?.id || '—')) + '</span></p>' +
            '<p><span class="label">Délivrance :</span><span class="value">' + formatDateFr(verifRecord?.date_soumission) + '</span></p>';
    }
}

/* ---------- 18. SOUMISSION DE LA DEMANDE DE LICENCE ---------- */
async function submitLicense() {
    if (!verifRecord || !coachProfile) {
        showToast('Chargement en cours, réessayez dans un instant.', 'warning');
        return;
    }

    const requis = {
        lfNom: 'Nom', lfPrenom: 'Prénom', lfDateNaissance: 'Date de naissance',
        lfLieuNaissance: 'Lieu de naissance', lfAdresse: 'Adresse',
        lfNationalite: 'Nationalité', lfPays: 'Pays de résidence',
        lfTelephone: 'Téléphone', lfSpecialite: 'Spécialité encadrée'
    };
    for (const id in requis) {
        if (!getVal(id).trim()) {
            showToast('Champ obligatoire manquant : ' + requis[id] + '.', 'warning');
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }
    if (!signatureDataURL) {
        showToast('Veuillez signer avant de soumettre votre demande.', 'warning');
        return;
    }

    if (verifRecord.statut_licence === 'approved') {
        if (!confirm('Vous avez déjà une licence validée. La soumettre à nouveau invalidera votre carte actuelle jusqu\'à une nouvelle validation. Continuer ?')) {
            return;
        }
    }

    const btn = document.getElementById('btnSubmitLicense');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';
    }

    try {
        /* Signature : si c'est un nouveau dataURL (base64), on l'héberge dans le bucket */
        let signatureUrl = verifRecord.signature_url;
        if (signatureDataURL.startsWith('data:')) {
            const sigBlob = await (await fetch(signatureDataURL)).blob();
            const sigPath = coachProfile.hubisoccer_id + '/signature_' + Date.now() + '.png';
            const { error: sigErr } = await supabaseClient.storage
                .from(DOCS_BUCKET)
                .upload(sigPath, sigBlob);
            if (sigErr) {
                throw sigErr;
            }
            const { data: sigUrlData } = supabaseClient.storage
                .from(DOCS_BUCKET)
                .getPublicUrl(sigPath);
            signatureUrl = sigUrlData.publicUrl;
            signatureDataURL = signatureUrl; /* on remplace le base64 par l'URL hébergée */
        }

        const payload = {
            coach_nom       : coachProfile.full_name || null,
            nom             : getVal('lfNom').trim(),
            prenom          : getVal('lfPrenom').trim(),
            date_naissance  : getVal('lfDateNaissance') || null,
            lieu_naissance  : getVal('lfLieuNaissance').trim(),
            adresse         : getVal('lfAdresse').trim(),
            nationalite     : getVal('lfNationalite').trim(),
            pays            : getVal('lfPays').trim(),
            langue          : getVal('lfLangue') || null,
            telephone       : getVal('lfTelephone').trim(),
            taille          : parseInt(getVal('lfTaille'), 10) || null,
            poids           : parseInt(getVal('lfPoids'), 10) || null,
            specialite      : getVal('lfSpecialite'),
            structure       : getVal('lfStructure').trim() || null,
            signature_url   : signatureUrl,
            statut_licence  : 'admin_pending',
            date_soumission : new Date().toISOString()
        };

        const { data: updated, error } = await supabaseClient
            .from(VERIF_TABLE)
            .update(payload)
            .eq('id', verifRecord.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        verifRecord = updated;
        showToast('Demande soumise avec succès ! Elle sera traitée par l\'administration. 📨', 'success');
        updateStats();
        updateCardPreview();
        renderStatusSection();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre ma demande';
        }
    }
}

/* ---------- 19. STATUT DE LA DEMANDE ---------- */
function renderStatusSection() {
    const section = document.getElementById('statusSection');
    const card    = document.getElementById('statusCard');
    if (!section || !card || !verifRecord) {
        return;
    }

    const statut = verifRecord.statut_licence || 'non_soumise';
    if (statut === 'non_soumise') {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    const dateStr = formatDateFr(verifRecord.date_soumission);

    if (statut === 'approved') {
        card.innerHTML =
            '<div class="status-icon approved"><i class="fas fa-check-circle"></i></div>' +
            '<div class="status-content">' +
                '<h3>🎉 Licence validée !</h3>' +
                '<p>Votre carte de licence Coach / Entraîneur est officielle.</p>' +
                (verifRecord.carte_url
                    ? '<a href="' + escapeHtml(verifRecord.carte_url) + '" class="btn-download" download><i class="fas fa-download"></i> Télécharger ma carte</a>'
                    : '<p class="status-msg">Votre carte physique/PDF est en cours de génération.</p>') +
            '</div>';
        return;
    }

    const statusMessages = {
        admin_pending      : 'En attente de validation par l\'administration.',
        president_pending  : 'En attente de validation finale par le Président.',
        rejected            : 'Demande rejetée. Vérifiez vos informations et soumettez une nouvelle demande.'
    };
    const msg  = statusMessages[statut] || 'En cours de traitement.';
    const icon = statut === 'rejected' ? 'fa-times-circle' : 'fa-clock';
    const cls  = statut === 'rejected' ? 'rejected' : 'pending';

    card.innerHTML =
        '<div class="status-icon ' + cls + '"><i class="fas ' + icon + '"></i></div>' +
        '<div class="status-content">' +
            '<h3>Demande en cours de traitement</h3>' +
            '<p>Soumise le ' + dateStr + '</p>' +
            '<p class="status-msg">Statut : ' + msg + '</p>' +
            '<p class="status-id">Référence : #' + escapeHtml(String(verifRecord.id)) + '</p>' +
        '</div>';
}

/* ---------- 20. FLIP CARTE ---------- */
function initCardFlip() {
    const container = document.getElementById('cardPreview');
    const btn = document.getElementById('flipCardBtn');
    if (container && btn) {
        btn.addEventListener('click', function() {
            container.classList.toggle('flipped');
        });
    }
}

/* ---------- 21. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) {
        return;
    }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

/* ---------- 22. SIDEBAR + SWIPE ---------- */
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
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        if (dx > 0 && sx < 40) {
            open();
        } else if (dx < 0) {
            close();
        }
    }, { passive: false });
}

/* ---------- 23. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 24. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadOrCreateVerifRecord();
    await preremplirStructureDepuisDash();

    populateFormulaire();
    updateStats();
    renderDocuments();
    renderStatusSection();

    initCardFlip();
    initUserMenu();
    initSidebar();

    /* Signature : ouverture/fermeture de la modale */
    const sigPreview = document.getElementById('signaturePreview');
    if (sigPreview) {
        sigPreview.addEventListener('click', openSignatureModal);
    }
    const closeSig = document.getElementById('closeSignatureModal');
    if (closeSig) {
        closeSig.addEventListener('click', closeSignatureModal);
    }

    /* Mise à jour live de l'aperçu carte à chaque saisie */
    document.querySelectorAll('.license-form input, .license-form select').forEach(function(el) {
        el.addEventListener('input', updateCardPreview);
        el.addEventListener('change', updateCardPreview);
    });

    /* Soumission de la demande */
    const btnSubmit = document.getElementById('btnSubmitLicense');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', submitLicense);
    }

    /* Déconnexion */
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    /* Sélecteur de langue */
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
