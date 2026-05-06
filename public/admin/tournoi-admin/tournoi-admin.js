// ========== TOURNOI-ADMIN.JS – COMPLET ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   UTILITAIRES GÉNÉRAUX
   ============================================================ */
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
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-content">' + escapeHtml(message) + '</div><button class="toast-close">×</button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() { toast.remove(); });
    setTimeout(function() { toast.remove(); }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
}
/* FIN UTILITAIRES */

/* ============================================================
   HACHAGE MOT DE PASSE (bcrypt, script chargé avant ce fichier)
   ============================================================ */
function hashPassword(password) {
    if (typeof dcodeIO === 'undefined' || typeof dcodeIO.bcrypt === 'undefined') {
        showToast('Erreur de sécurité (bcrypt non chargé)', 'error');
        return null;
    }
    const salt = dcodeIO.bcrypt.genSaltSync(10);
    return dcodeIO.bcrypt.hashSync(password, salt);
}
/* FIN HACHAGE */

/* ============================================================
   ONGLETS
   ============================================================ */
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        tabContents.forEach(function(c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'inscriptions') loadInscriptions();
        else if (tabId === 'tournois') loadTournois();
        else if (tabId === 'codes') loadCodes();
        else if (tabId === 'lives') loadLives();
    });
});
/* FIN ONGLETS */

/* ============================================================
   GESTION DES TOURNOIS (CRUD + MÉDIAS)
   ============================================================ */
let currentTournoiId = null;
let existingMediaIds = [];
let deletedMediaIds = [];
let pendingMediaFiles = [];

const tournoisList = document.getElementById('tournoisList');
const newTournoiBtn = document.getElementById('newTournoiBtn');
const tournoiModal = document.getElementById('tournoiModal');
const tournoiForm = document.getElementById('tournoiForm');
const tournoiIdField = document.getElementById('tournoiId');
const tournoiSport = document.getElementById('tournoiSport');
const tournoiTitre = document.getElementById('tournoiTitre');
const tournoiDescription = document.getElementById('tournoiDescription');
const tournoiVille = document.getElementById('tournoiVille');
const tournoiQuartier = document.getElementById('tournoiQuartier');
const tournoiDateDebut = document.getElementById('tournoiDateDebut');
const tournoiDateFin = document.getElementById('tournoiDateFin');
const tournoiReglements = document.getElementById('tournoiReglements');
const tournoiType = document.getElementById('tournoiType');
const mediaList = document.getElementById('mediaList');
const addImageBtn = document.getElementById('addImageBtn');
const addVideoBtn = document.getElementById('addVideoBtn');
const mediaFileInput = document.getElementById('mediaFileInput');
const closeModalBtns = document.querySelectorAll('.close-modal');

async function loadTournois() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_tournois').select('*').order('date_debut', { ascending: true });
        if (error) throw error;
        renderTournois(data || []);
    } catch (err) { showToast('Erreur chargement tournois', 'error'); } finally { hideLoader(); }
}

function renderTournois(tournois) {
    if (!tournoisList) return;
    if (!tournois.length) { tournoisList.innerHTML = '<p>Aucun tournoi.</p>'; return; }
    tournoisList.innerHTML = tournois.map(function(t) {
        return '<div class="item-card">' +
            '<h3>' + escapeHtml(t.titre) + '</h3>' +
            '<p><strong>Sport:</strong> ' + escapeHtml(t.sport) + ' | <strong>Type:</strong> ' + (t.type_tournoi === 'collectif' ? 'Collectif' : 'Individuel') + '</p>' +
            '<p><strong>Lieu:</strong> ' + escapeHtml(t.ville) + (t.quartier ? ' - ' + escapeHtml(t.quartier) : '') + '</p>' +
            '<p><strong>Dates:</strong> ' + formatDate(t.date_debut) + ' - ' + formatDate(t.date_fin) + '</p>' +
            '<div class="card-actions">' +
                '<button class="btn-edit" data-id="' + t.id + '">✏️ Modifier</button>' +
                '<button class="btn-delete" data-id="' + t.id + '">🗑️ Supprimer</button>' +
            '</div></div>';
    }).join('');
    document.querySelectorAll('#tournoisList .btn-edit').forEach(function(btn) { btn.addEventListener('click', function() { editTournoi(btn.dataset.id); }); });
    document.querySelectorAll('#tournoisList .btn-delete').forEach(function(btn) { btn.addEventListener('click', function() { deleteTournoi(btn.dataset.id); }); });
}

async function editTournoi(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_tournois').select('*').eq('id', id).single();
        if (error) throw error;
        currentTournoiId = data.id;
        tournoiIdField.value = data.id;
        tournoiSport.value = data.sport;
        tournoiTitre.value = data.titre;
        tournoiDescription.value = data.description || '';
        tournoiVille.value = data.ville;
        tournoiQuartier.value = data.quartier || '';
        tournoiDateDebut.value = data.date_debut;
        tournoiDateFin.value = data.date_fin;
        tournoiReglements.value = data.reglements || '';
        tournoiType.value = data.type_tournoi || 'collectif';
        // Charger les médias existants
        const mediaItems = await loadTournoiMedia(data.id);
        existingMediaIds = mediaItems.map(function(m) { return m.id; });
        deletedMediaIds = [];
        pendingMediaFiles = [];
        renderMediaList(mediaItems, existingMediaIds);
        document.getElementById('tournoiModalTitle').textContent = 'Modifier le tournoi';
        tournoiModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}

async function deleteTournoi(id) {
    if (!confirm('Supprimer ce tournoi ? Tous les codes et inscriptions liés seront supprimés.')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_tournois').delete().eq('id', id);
        if (error) throw error;
        showToast('Tournoi supprimé', 'success');
        loadTournois(); loadCodes(); loadInscriptions();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

newTournoiBtn.addEventListener('click', function() {
    currentTournoiId = null;
    tournoiIdField.value = '';
    tournoiSport.value = 'football';
    tournoiTitre.value = '';
    tournoiDescription.value = '';
    tournoiVille.value = '';
    tournoiQuartier.value = '';
    tournoiDateDebut.value = '';
    tournoiDateFin.value = '';
    tournoiReglements.value = '';
    tournoiType.value = 'collectif';
    existingMediaIds = []; deletedMediaIds = []; pendingMediaFiles = [];
    renderMediaList([], []);
    document.getElementById('tournoiModalTitle').textContent = 'Nouveau tournoi';
    tournoiModal.classList.add('active');
});

/* ---------- MÉDIAS ---------- */
async function loadTournoiMedia(tournoiId) {
    const { data, error } = await supabaseAdmin.from('public_tournoi_media').select('*').eq('tournoi_id', tournoiId).order('position');
    if (error) return [];
    return data || [];
}

function renderMediaList(mediaItems, existingIds) {
    if (!mediaList) return;
    let html = '';
    for (const m of mediaItems) {
        html += '<div class="media-item" data-media-id="' + m.id + '">' +
            (m.media_type === 'image' ? '<img src="' + m.media_url + '" alt="Média tournoi">' : '<video src="' + m.media_url + '" controls></video>') +
            '<button type="button" class="btn-delete-media" data-id="' + m.id + '"><i class="fas fa-times"></i></button></div>';
    }
    for (const pf of pendingMediaFiles) {
        const url = URL.createObjectURL(pf.file);
        html += '<div class="media-item pending">' +
            (pf.type === 'image' ? '<img src="' + url + '" alt="Nouveau média">' : '<video src="' + url + '" controls></video>') +
            '<button type="button" class="btn-remove-pending"><i class="fas fa-times"></i></button></div>';
    }
    mediaList.innerHTML = html;
    document.querySelectorAll('.btn-delete-media').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const mediaId = parseInt(btn.dataset.id);
            deletedMediaIds.push(mediaId);
            existingMediaIds = existingMediaIds.filter(function(id) { return id !== mediaId; });
            renderMediaList(mediaItems.filter(function(m) { return m.id !== mediaId; }), existingMediaIds);
        });
    });
    document.querySelectorAll('.btn-remove-pending').forEach(function(btn, index) {
        btn.addEventListener('click', function() {
            pendingMediaFiles.splice(index, 1);
            renderMediaList(mediaItems, existingMediaIds);
        });
    });
}

addImageBtn.addEventListener('click', function() {
    mediaFileInput.accept = 'image/jpeg,image/png';
    mediaFileInput.click();
});
addVideoBtn.addEventListener('click', function() {
    mediaFileInput.accept = 'video/mp4,video/webm';
    mediaFileInput.click();
});
mediaFileInput.addEventListener('change', function() {
    if (mediaFileInput.files.length) {
        const file = mediaFileInput.files[0];
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        pendingMediaFiles.push({ file: file, type: type });
        if (currentTournoiId) {
            loadTournoiMedia(currentTournoiId).then(function(mediaItems) {
                existingMediaIds = mediaItems.map(function(m) { return m.id; });
                renderMediaList(mediaItems, existingMediaIds);
            });
        } else {
            renderMediaList([], []);
        }
        mediaFileInput.value = '';
    }
});

async function uploadMediaFile(file, tournoiId) {
    const timestamp = Date.now();
    const safeName = timestamp + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = 'tournois/' + tournoiId + '/' + safeName;
    const { error } = await supabaseAdmin.storage.from('tournois_media').upload(filePath, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from('tournois_media').getPublicUrl(filePath);
    return urlData.publicUrl;
}

tournoiForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        sport: tournoiSport.value,
        titre: tournoiTitre.value,
        description: tournoiDescription.value,
        ville: tournoiVille.value,
        quartier: tournoiQuartier.value,
        date_debut: tournoiDateDebut.value,
        date_fin: tournoiDateFin.value,
        reglements: tournoiReglements.value,
        type_tournoi: tournoiType.value,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        let productId = currentTournoiId;
        if (productId) {
            const { error } = await supabaseAdmin.from('public_tournois').update(data).eq('id', productId);
            if (error) throw error;
        } else {
            const { data: newTournoi, error } = await supabaseAdmin.from('public_tournois').insert([data]).select().single();
            if (error) throw error;
            productId = newTournoi.id;
            currentTournoiId = productId;
        }
        // Supprimer les médias marqués
        if (deletedMediaIds.length > 0) {
            await supabaseAdmin.from('public_tournoi_media').delete().in('id', deletedMediaIds);
        }
        // Ajouter les nouveaux médias
        for (const pf of pendingMediaFiles) {
            const url = await uploadMediaFile(pf.file, productId);
            await supabaseAdmin.from('public_tournoi_media').insert([{
                tournoi_id: productId,
                media_url: url,
                media_type: pf.type,
                position: 0
            }]);
        }
        // Réindexer les positions
        const { data: allMedia } = await supabaseAdmin.from('public_tournoi_media').select('id').eq('tournoi_id', productId).order('id');
        if (allMedia) {
            for (let i = 0; i < allMedia.length; i++) {
                await supabaseAdmin.from('public_tournoi_media').update({ position: i + 1 }).eq('id', allMedia[i].id);
            }
        }
        showToast('Tournoi sauvegardé', 'success');
        tournoiModal.classList.remove('active');
        loadTournois(); loadCodes();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally {
        hideLoader();
        pendingMediaFiles = []; deletedMediaIds = []; existingMediaIds = [];
    }
});
/* FIN TOURNOIS */

/* ============================================================
   GESTION DES CODES (inchangée)
   ============================================================ */
let currentCodeId = null;
const codesList = document.getElementById('codesList');
const newCodeBtn = document.getElementById('newCodeBtn');
const codeModal = document.getElementById('codeModal');
const codeForm = document.getElementById('codeForm');
const codeIdField = document.getElementById('codeId');
const codeTournoiId = document.getElementById('codeTournoiId');
const codeValeur = document.getElementById('codeValeur');
const codeType = document.getElementById('codeType');
const codeEntite = document.getElementById('codeEntite');
const codeQuotaMax = document.getElementById('codeQuotaMax');
const codeActif = document.getElementById('codeActif');

async function loadCodes() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_codes_tournoi').select('*, public_tournois(titre, type_tournoi)').order('created_at', { ascending: false });
        if (error) throw error;
        renderCodes(data || []);
    } catch (err) { showToast('Erreur chargement codes', 'error'); } finally { hideLoader(); }
}

function renderCodes(codes) {
    if (!codesList) return;
    if (!codes.length) { codesList.innerHTML = '<p>Aucun code.</p>'; return; }
    codesList.innerHTML = codes.map(function(c) {
        return '<div class="item-card">' +
            '<h3>' + escapeHtml(c.code) + '</h3>' +
            '<p><strong>Tournoi:</strong> ' + (c.public_tournois ? c.public_tournois.titre : 'Inconnu') + ' (' + (c.public_tournois && c.public_tournois.type_tournoi === 'individuel' ? 'Individuel' : 'Collectif') + ')</p>' +
            '<p><strong>Type:</strong> ' + (c.type_inscription === 'joueur_libre' ? 'Joueur libre' : 'Club') + ' | <strong>Entité:</strong> ' + (c.entite || '-') + '</p>' +
            '<p><strong>Quota:</strong> ' + c.quota_utilise + '/' + c.quota_max + '</p>' +
            '<p><span class="badge ' + (c.actif ? 'actif' : 'inactif') + '">' + (c.actif ? 'Actif' : 'Inactif') + '</span></p>' +
            '<div class="card-actions">' +
                '<button class="btn-edit" data-id="' + c.id + '">✏️ Modifier</button>' +
                '<button class="btn-delete" data-id="' + c.id + '">🗑️ Supprimer</button>' +
            '</div></div>';
    }).join('');
    document.querySelectorAll('#codesList .btn-edit').forEach(function(btn) { btn.addEventListener('click', function() { editCode(btn.dataset.id); }); });
    document.querySelectorAll('#codesList .btn-delete').forEach(function(btn) { btn.addEventListener('click', function() { deleteCode(btn.dataset.id); }); });
}

async function editCode(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_codes_tournoi').select('*').eq('id', id).single();
        if (error) throw error;
        currentCodeId = data.id;
        codeIdField.value = data.id;
        await populateTournoiSelect(codeTournoiId, data.tournoi_id);
        codeValeur.value = data.code;
        codeType.value = data.type_inscription;
        codeEntite.value = data.entite || '';
        codeQuotaMax.value = data.quota_max;
        codeActif.checked = data.actif;
        document.getElementById('codeModalTitle').textContent = 'Modifier le code';
        codeModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}

async function deleteCode(id) {
    if (!confirm('Supprimer ce code ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_codes_tournoi').delete().eq('id', id);
        if (error) throw error;
        showToast('Code supprimé', 'success');
        loadCodes();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

async function populateTournoiSelect(selectElement, selectedId) {
    const { data, error } = await supabaseAdmin.from('public_tournois').select('id, titre, type_tournoi').order('titre');
    if (error) return;
    selectElement.innerHTML = '<option value="">-- Choisir un tournoi --</option>';
    data.forEach(function(t) {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.titre + ' (' + (t.type_tournoi === 'individuel' ? 'Individuel' : 'Collectif') + ')';
        if (selectedId && selectedId == t.id) option.selected = true;
        selectElement.appendChild(option);
    });
}

newCodeBtn.addEventListener('click', async function() {
    currentCodeId = null;
    codeIdField.value = '';
    await populateTournoiSelect(codeTournoiId);
    codeValeur.value = '';
    codeType.value = 'joueur_libre';
    codeEntite.value = '';
    codeQuotaMax.value = '15';
    codeActif.checked = true;
    document.getElementById('codeModalTitle').textContent = 'Nouveau code';
    codeModal.classList.add('active');
});

codeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        tournoi_id: codeTournoiId.value,
        code: codeValeur.value,
        type_inscription: codeType.value,
        entite: codeEntite.value || null,
        quota_max: parseInt(codeQuotaMax.value),
        actif: codeActif.checked
    };
    showLoader();
    try {
        if (currentCodeId) {
            await supabaseAdmin.from('public_codes_tournoi').update(data).eq('id', currentCodeId);
            showToast('Code modifié', 'success');
        } else {
            await supabaseAdmin.from('public_codes_tournoi').insert([data]);
            showToast('Code créé', 'success');
        }
        codeModal.classList.remove('active');
        loadCodes();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});
/* FIN CODES */

/* ============================================================
   GESTION DES INSCRIPTIONS (avec les 7 actions)
   ============================================================ */
const inscriptionsList = document.getElementById('inscriptionsList');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const validationModal = document.getElementById('validationModal');
const validationInfo = document.getElementById('validationInfo');
const validationLogin = document.getElementById('validationLogin');
const validationPassword = document.getElementById('validationPassword');
const validationRole = document.getElementById('validationRole');
const saveValidationBtn = document.getElementById('saveValidationBtn');
let currentInscriptionId = null;

async function loadInscriptions() {
    showLoader();
    try {
        let query = supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').order('date_soumission', { ascending: false });
        const status = statusFilter.value;
        if (status !== 'all') query = query.eq('statut', status);
        const { data, error } = await query;
        if (error) throw error;
        renderInscriptions(data || []);
    } catch (err) { showToast('Erreur chargement inscriptions', 'error'); } finally { hideLoader(); }
}

function renderInscriptions(inscriptions) {
    if (!inscriptionsList) return;
    if (!inscriptions.length) { inscriptionsList.innerHTML = '<p>Aucune inscription.</p>'; return; }
    inscriptionsList.innerHTML = inscriptions.map(function(ins) {
        const tournoi = ins.public_codes_tournoi ? ins.public_codes_tournoi.public_tournois : null;
        const estIndividuel = tournoi && tournoi.type_tournoi === 'individuel';
        const statutLabel = ins.statut === 'en_attente' ? 'En attente' : (ins.statut === 'valide' ? 'Validé' : 'Rejeté');
        let actionsHtml = '';
        if (ins.statut === 'en_attente') {
            actionsHtml += '<button class="btn-validate" data-id="' + ins.id + '">✅ Valider</button>';
            actionsHtml += '<button class="btn-reject" data-id="' + ins.id + '">❌ Rejeter</button>';
        }
        actionsHtml += '<button class="btn-view" data-id="' + ins.id + '">👁️ Détails</button>';
        actionsHtml += '<button class="btn-edit-inscription" data-id="' + ins.id + '">✏️ Modifier</button>';
        if (ins.statut === 'valide') {
            actionsHtml += '<button class="btn-resend" data-id="' + ins.id + '">🔄 Renvoyer identifiants</button>';
        }
        actionsHtml += '<button class="btn-comment" data-id="' + ins.id + '">📝 Commentaire</button>';
        actionsHtml += '<button class="btn-delete-inscription" data-id="' + ins.id + '">🗑️ Supprimer</button>';
        return '<div class="item-card">' +
            '<h3>' + escapeHtml(ins.nom_complet) + '</h3>' +
            '<p><strong>Email:</strong> ' + escapeHtml(ins.email) + ' | <strong>Tél:</strong> ' + escapeHtml(ins.telephone) + '</p>' +
            '<p><strong>Tournoi:</strong> ' + (tournoi ? tournoi.titre : '?') + ' (' + (estIndividuel ? 'Individuel' : 'Collectif') + ')</p>' +
            '<p><strong>Code:</strong> ' + (ins.public_codes_tournoi ? ins.public_codes_tournoi.code : '?') + '</p>' +
            '<p><span class="badge ' + ins.statut + '">' + statutLabel + '</span></p>' +
            '<div class="card-actions">' + actionsHtml + '</div></div>';
    }).join('');
    // Attacher les événements
    document.querySelectorAll('.btn-validate').forEach(function(btn) { btn.addEventListener('click', function() { openValidationModal(btn.dataset.id); }); });
    document.querySelectorAll('.btn-reject').forEach(function(btn) { btn.addEventListener('click', function() { rejectInscription(btn.dataset.id); }); });
    document.querySelectorAll('.btn-view').forEach(function(btn) { btn.addEventListener('click', function() { viewInscriptionDetails(btn.dataset.id); }); });
    document.querySelectorAll('.btn-edit-inscription').forEach(function(btn) { btn.addEventListener('click', function() { editInscription(btn.dataset.id); }); });
    document.querySelectorAll('.btn-resend').forEach(function(btn) { btn.addEventListener('click', function() { resendCredentials(btn.dataset.id); }); });
    document.querySelectorAll('.btn-comment').forEach(function(btn) { btn.addEventListener('click', function() { addComment(btn.dataset.id); }); });
    document.querySelectorAll('.btn-delete-inscription').forEach(function(btn) { btn.addEventListener('click', function() { deleteInscription(btn.dataset.id); }); });
}

/* ----- ACTIONS SUR INSCRIPTIONS ----- */

async function deleteInscription(id) {
    if (!confirm('Supprimer cette inscription ?')) return;
    showLoader();
    try {
        await supabaseAdmin.from('public_inscriptions_tournoi').delete().eq('id', id);
        showToast('Inscription supprimée', 'success');
        loadInscriptions();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

/* -- VALIDER (inchangé mais avec bcrypt) -- */
async function openValidationModal(inscriptionId) {
    currentInscriptionId = inscriptionId;
    showLoader();
    try {
        const { data: ins, error } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').eq('id', inscriptionId).single();
        if (error) throw error;
        const tournoi = ins.public_codes_tournoi ? ins.public_codes_tournoi.public_tournois : null;
        const estIndividuel = tournoi && tournoi.type_tournoi === 'individuel';
        validationInfo.innerHTML = '<p><strong>Candidat:</strong> ' + escapeHtml(ins.nom_complet) + '</p>' +
            '<p><strong>Email:</strong> ' + escapeHtml(ins.email) + '</p>' +
            '<p><strong>Tournoi:</strong> ' + (tournoi ? tournoi.titre : '?') + ' (' + (estIndividuel ? 'Individuel' : 'Collectif') + ')</p>' +
            '<p><strong>Code:</strong> ' + (ins.public_codes_tournoi ? ins.public_codes_tournoi.code : '?') + '</p>' +
            (!estIndividuel && ins.nom_club ? '<p><strong>Club:</strong> ' + escapeHtml(ins.nom_club) + '</p>' : '');
        validationRole.value = estIndividuel ? 'joueur' : 'capitaine';
        validationRole.disabled = estIndividuel;
        validationLogin.value = '';
        validationPassword.value = '';
        validationModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement inscription', 'error'); } finally { hideLoader(); }
}

saveValidationBtn.addEventListener('click', async function() {
    const login = validationLogin.value.trim();
    const password = validationPassword.value.trim();
    const role = validationRole.value;
    if (!login || !password) { showToast('Login et mot de passe requis', 'warning'); return; }
    showLoader();
    try {
        const { data: ins, error: insErr } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(tournoi_id, code, type_inscription, entite)').eq('id', currentInscriptionId).single();
        if (insErr) throw insErr;
        const codeInfo = ins.public_codes_tournoi;
        const tournoiId = codeInfo.tournoi_id;
        const { data: tournoi, error: tournoiErr } = await supabaseAdmin.from('public_tournois').select('type_tournoi').eq('id', tournoiId).single();
        if (tournoiErr) throw tournoiErr;
        const estIndividuel = tournoi.type_tournoi === 'individuel';

        await supabaseAdmin.from('public_inscriptions_tournoi').update({ statut: 'valide', date_traitement: new Date().toISOString() }).eq('id', currentInscriptionId);

        const hashed = hashPassword(password);
        if (!hashed) { hideLoader(); return; }

        const { data: newUser, error: userErr } = await supabaseAdmin.from('public_utilisateurs_tournoi').insert([{
            inscription_id: currentInscriptionId, login: login, mot_de_passe_hash: hashed, role: role
        }]).select().single();
        if (userErr) throw userErr;

        if (estIndividuel) {
            await supabaseAdmin.from('public_participants_individuels').insert([{
                tournoi_id: tournoiId, inscription_id: currentInscriptionId, nom_complet: ins.nom_complet, email: ins.email, telephone: ins.telephone, statut: 'inscrit'
            }]);
        } else {
            const nomEquipe = ins.nom_club || codeInfo.entite || 'Equipe de ' + ins.nom_complet;
            await supabaseAdmin.from('public_equipes').insert([{
                tournoi_id: tournoiId, nom_equipe: nomEquipe, type_equipe: codeInfo.type_inscription === 'club' ? 'club' : 'fan_club', capitaine_id: newUser.id
            }]);
        }

        // Incrémenter quota
        const { data: codeData } = await supabaseAdmin.from('public_codes_tournoi').select('quota_utilise, quota_max').eq('id', codeInfo.id).single();
        if (codeData && codeData.quota_utilise < codeData.quota_max) {
            await supabaseAdmin.from('public_codes_tournoi').update({ quota_utilise: codeData.quota_utilise + 1 }).eq('id', codeInfo.id);
        }

        showToast('Inscription validée', 'success');
        validationModal.classList.remove('active');
        loadInscriptions(); loadCodes();
    } catch (err) { console.error(err); showToast('Erreur validation', 'error'); } finally { hideLoader(); }
});

/* -- REJETER -- */
async function rejectInscription(id) {
    const commentaire = prompt('Motif du rejet (optionnel) :');
    if (commentaire === null) return; // annulé
    showLoader();
    try {
        const updateData = { statut: 'rejete', date_traitement: new Date().toISOString() };
        if (commentaire.trim()) updateData.commentaire_admin = commentaire.trim();
        await supabaseAdmin.from('public_inscriptions_tournoi').update(updateData).eq('id', id);
        showToast('Inscription rejetée', 'success');
        loadInscriptions();
    } catch (err) { showToast('Erreur rejet', 'error'); } finally { hideLoader(); }
}

/* -- MODALE DÉTAILS (utilise la modale validation étendue) -- */
async function viewInscriptionDetails(id) {
    showLoader();
    try {
        const { data: ins, error } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').eq('id', id).single();
        if (error) throw error;
        const tournoi = ins.public_codes_tournoi ? ins.public_codes_tournoi.public_tournois : null;
        const estIndividuel = tournoi && tournoi.type_tournoi === 'individuel';
        let html = '<div style="max-height:400px;overflow-y:auto;">';
        html += '<p><strong>Nom complet :</strong> ' + escapeHtml(ins.nom_complet) + '</p>';
        html += '<p><strong>Email :</strong> ' + escapeHtml(ins.email) + '</p>';
        html += '<p><strong>Téléphone :</strong> ' + escapeHtml(ins.telephone) + '</p>';
        html += '<p><strong>Date de naissance :</strong> ' + (ins.date_naissance || '-') + '</p>';
        html += '<p><strong>Ville/Quartier :</strong> ' + escapeHtml(ins.ville_quartier || '-') + '</p>';
        html += '<p><strong>Réseaux sociaux :</strong> ' + escapeHtml(ins.reseaux_sociaux || '-') + '</p>';
        html += '<p><strong>Catégorie :</strong> ' + escapeHtml(ins.categorie_talent) + '</p>';
        html += '<p><strong>Discipline :</strong> ' + escapeHtml(ins.discipline) + (ins.autre_discipline ? ' (' + escapeHtml(ins.autre_discipline) + ')' : '') + '</p>';
        html += '<p><strong>Statut talent :</strong> ' + escapeHtml(ins.statut_talent) + '</p>';
        if (ins.statut_talent === 'en_club') {
            html += '<p><strong>Nom club actuel :</strong> ' + escapeHtml(ins.nom_club_actuel || '-') + '</p>';
            html += '<p><strong>Contact responsable :</strong> ' + escapeHtml(ins.contact_responsable || '-') + '</p>';
        }
        html += '<p><strong>Niveau études :</strong> ' + escapeHtml(ins.niveau_etudes || '-') + '</p>';
        html += '<p><strong>Métier souhaité :</strong> ' + escapeHtml(ins.metier_souhaite || '-') + '</p>';
        html += '<p><strong>Disponibilités :</strong> ' + (ins.disponibilites ? JSON.stringify(ins.disponibilites) : '-') + '</p>';
        html += '<p><strong>Statut inscription :</strong> ' + ins.statut + '</p>';
        html += '<p><strong>Commentaire admin :</strong> ' + escapeHtml(ins.commentaire_admin || 'Aucun') + '</p>';
        html += '</div>';
        // Réutilise la modale validationInfo pour afficher
        validationInfo.innerHTML = html;
        // Masquer les champs login/mdp et le bouton
        document.getElementById('validationLogin').style.display = 'none';
        document.getElementById('validationPassword').style.display = 'none';
        document.getElementById('validationRole').style.display = 'none';
        saveValidationBtn.style.display = 'none';
        validationModal.classList.add('active');
        // Restaurer l'affichage à la fermeture
        const restore = function() {
            document.getElementById('validationLogin').style.display = '';
            document.getElementById('validationPassword').style.display = '';
            document.getElementById('validationRole').style.display = '';
            saveValidationBtn.style.display = '';
            validationModal.removeEventListener('click', restore);
        };
        validationModal.addEventListener('click', restore);
    } catch (err) { showToast('Erreur chargement détails', 'error'); } finally { hideLoader(); }
}

/* -- MODIFIER (via prompt simplifié, pourra être une modale complète plus tard) -- */
async function editInscription(id) {
    // Récupérer les données actuelles
    showLoader();
    try {
        const { data: ins, error } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*').eq('id', id).single();
        if (error) throw error;
        const newNom = prompt('Nom complet', ins.nom_complet);
        if (newNom === null) return;
        const newEmail = prompt('Email', ins.email);
        if (newEmail === null) return;
        const newTel = prompt('Téléphone', ins.telephone);
        if (newTel === null) return;
        const newCategorie = prompt('Catégorie (sportif/artiste)', ins.categorie_talent);
        if (newCategorie === null) return;
        const newDiscipline = prompt('Discipline', ins.discipline);
        if (newDiscipline === null) return;
        showLoader();
        await supabaseAdmin.from('public_inscriptions_tournoi').update({
            nom_complet: newNom,
            email: newEmail,
            telephone: newTel,
            categorie_talent: newCategorie,
            discipline: newDiscipline
        }).eq('id', id);
        showToast('Inscription modifiée', 'success');
        loadInscriptions();
    } catch (err) { showToast('Erreur modification', 'error'); } finally { hideLoader(); }
}

/* -- RENVOYER LES IDENTIFIANTS -- */
async function resendCredentials(id) {
    showLoader();
    try {
        const { data: user, error } = await supabaseAdmin.from('public_utilisateurs_tournoi').select('login, mot_de_passe_hash').eq('inscription_id', id).maybeSingle();
        if (error || !user) {
            showToast('Aucun compte trouvé pour cette inscription', 'error');
            return;
        }
        // On ne peut pas récupérer le mot de passe en clair, on en génère un nouveau
        const newPassword = Math.random().toString(36).slice(-8);
        const hashed = hashPassword(newPassword);
        if (!hashed) return;
        await supabaseAdmin.from('public_utilisateurs_tournoi').update({ mot_de_passe_hash: hashed }).eq('inscription_id', id);
        showToast('Nouveau mot de passe envoyé (simulation) : ' + newPassword, 'info');
        // Ici, on pourrait insérer un message privé avec les nouveaux identifiants
    } catch (err) { showToast('Erreur renvoi', 'error'); } finally { hideLoader(); }
}

/* -- AJOUTER UN COMMENTAIRE -- */
async function addComment(id) {
    const commentaire = prompt('Commentaire :');
    if (commentaire === null) return;
    showLoader();
    try {
        await supabaseAdmin.from('public_inscriptions_tournoi').update({ commentaire_admin: commentaire.trim() }).eq('id', id);
        showToast('Commentaire ajouté', 'success');
        loadInscriptions();
    } catch (err) { showToast('Erreur commentaire', 'error'); } finally { hideLoader(); }
}

refreshBtn.addEventListener('click', loadInscriptions);
statusFilter.addEventListener('change', loadInscriptions);
/* FIN INSCRIPTIONS */

/* ============================================================
   GESTION DES LIVES (inchangée)
   ============================================================ */
let currentLiveId = null;
const livesList = document.getElementById('livesList');
const newLiveBtn = document.getElementById('newLiveBtn');
const liveModal = document.getElementById('liveModal');
const liveForm = document.getElementById('liveForm');
const liveIdField = document.getElementById('liveId');
const liveTitre = document.getElementById('liveTitre');
const liveDescription = document.getElementById('liveDescription');
const liveEmbedUrl = document.getElementById('liveEmbedUrl');
const liveActif = document.getElementById('liveActif');

async function loadLives() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_lives').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        renderLives(data || []);
    } catch (err) { showToast('Erreur chargement lives', 'error'); } finally { hideLoader(); }
}

function renderLives(lives) {
    if (!livesList) return;
    if (!lives.length) { livesList.innerHTML = '<p>Aucun live.</p>'; return; }
    livesList.innerHTML = lives.map(function(l) {
        return '<div class="item-card">' +
            '<h3>' + escapeHtml(l.titre) + '</h3>' +
            '<p>' + escapeHtml(l.description || '') + '</p>' +
            '<p><span class="badge ' + (l.actif ? 'actif' : 'inactif') + '">' + (l.actif ? 'Actif' : 'Inactif') + '</span></p>' +
            '<div class="card-actions">' +
                '<button class="btn-edit" data-id="' + l.id + '">✏️ Modifier</button>' +
                '<button class="btn-delete" data-id="' + l.id + '">🗑️ Supprimer</button>' +
            '</div></div>';
    }).join('');
    document.querySelectorAll('#livesList .btn-edit').forEach(function(btn) { btn.addEventListener('click', function() { editLive(btn.dataset.id); }); });
    document.querySelectorAll('#livesList .btn-delete').forEach(function(btn) { btn.addEventListener('click', function() { deleteLive(btn.dataset.id); }); });
}

async function editLive(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_lives').select('*').eq('id', id).single();
        if (error) throw error;
        currentLiveId = data.id;
        liveIdField.value = data.id;
        liveTitre.value = data.titre;
        liveDescription.value = data.description || '';
        liveEmbedUrl.value = data.embed_url;
        liveActif.checked = data.actif;
        document.getElementById('liveModalTitle').textContent = 'Modifier le live';
        liveModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}

async function deleteLive(id) {
    if (!confirm('Supprimer ce live ?')) return;
    showLoader();
    try {
        await supabaseAdmin.from('public_lives').delete().eq('id', id);
        showToast('Live supprimé', 'success');
        loadLives();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

newLiveBtn.addEventListener('click', function() {
    currentLiveId = null;
    liveIdField.value = '';
    liveTitre.value = '';
    liveDescription.value = '';
    liveEmbedUrl.value = '';
    liveActif.checked = true;
    document.getElementById('liveModalTitle').textContent = 'Nouveau live';
    liveModal.classList.add('active');
});

liveForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        titre: liveTitre.value,
        description: liveDescription.value,
        embed_url: liveEmbedUrl.value,
        actif: liveActif.checked,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        if (currentLiveId) {
            await supabaseAdmin.from('public_lives').update(data).eq('id', currentLiveId);
            showToast('Live modifié', 'success');
        } else {
            await supabaseAdmin.from('public_lives').insert([data]);
            showToast('Live créé', 'success');
        }
        liveModal.classList.remove('active');
        loadLives();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});
/* FIN LIVES */

/* ============================================================
   FERMETURE MODALES
   ============================================================ */
closeModalBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        tournoiModal.classList.remove('active');
        codeModal.classList.remove('active');
        validationModal.classList.remove('active');
        liveModal.classList.remove('active');
    });
});
window.addEventListener('click', function(e) {
    if (e.target === tournoiModal) tournoiModal.classList.remove('active');
    if (e.target === codeModal) codeModal.classList.remove('active');
    if (e.target === validationModal) validationModal.classList.remove('active');
    if (e.target === liveModal) liveModal.classList.remove('active');
});
/* FIN MODALES */

/* ============================================================
   MENU MOBILE
   ============================================================ */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', function(e) {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active'); menuToggle.classList.remove('open');
        }
    });
}
document.getElementById('logoutBtn').addEventListener('click', function(e) { e.preventDefault(); showToast('Déconnexion (à venir)', 'info'); });
/* FIN MENU */

/* ============================================================
   INITIALISATION
   ============================================================ */
loadInscriptions(); loadTournois(); loadCodes(); loadLives();
/* FIN INITIALISATION */