// ========== TOURNOI-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
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
function hashPassword(password) {
    return btoa(password); // ⚠️ À remplacer par bcrypt en production
}

// ========== ONGLETS ==========
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'inscriptions') loadInscriptions();
        else if (tabId === 'tournois') loadTournois();
        else if (tabId === 'codes') loadCodes();
        else if (tabId === 'lives') loadLives();
    });
});

// ========== GESTION DES TOURNOIS (CRUD) ==========
let currentTournoiId = null;
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
const tournoiImageUrl = document.getElementById('tournoiImageUrl');
const tournoiReglements = document.getElementById('tournoiReglements');
const tournoiType = document.getElementById('tournoiType');
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
    tournoisList.innerHTML = tournois.map(t => `
        <div class="item-card">
            <h3>${escapeHtml(t.titre)}</h3>
            <p><strong>Sport:</strong> ${escapeHtml(t.sport)} | <strong>Type:</strong> ${t.type_tournoi === 'collectif' ? 'Collectif' : 'Individuel'}</p>
            <p><strong>Lieu:</strong> ${escapeHtml(t.ville)}${t.quartier ? ' - ' + escapeHtml(t.quartier) : ''}</p>
            <p><strong>Dates:</strong> ${formatDate(t.date_debut)} - ${formatDate(t.date_fin)}</p>
            <div class="card-actions">
                <button class="btn-edit" data-id="${t.id}">✏️ Modifier</button>
                <button class="btn-delete" data-id="${t.id}">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editTournoi(btn.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteTournoi(btn.dataset.id)));
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
        tournoiImageUrl.value = data.image_url || '';
        tournoiReglements.value = data.reglements || '';
        tournoiType.value = data.type_tournoi || 'collectif';
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
        loadTournois();
        loadCodes();
        loadInscriptions();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
newTournoiBtn.addEventListener('click', () => {
    currentTournoiId = null;
    tournoiIdField.value = '';
    tournoiSport.value = 'football';
    tournoiTitre.value = '';
    tournoiDescription.value = '';
    tournoiVille.value = '';
    tournoiQuartier.value = '';
    tournoiDateDebut.value = '';
    tournoiDateFin.value = '';
    tournoiImageUrl.value = '';
    tournoiReglements.value = '';
    tournoiType.value = 'collectif';
    document.getElementById('tournoiModalTitle').textContent = 'Nouveau tournoi';
    tournoiModal.classList.add('active');
});
tournoiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        sport: tournoiSport.value,
        titre: tournoiTitre.value,
        description: tournoiDescription.value,
        ville: tournoiVille.value,
        quartier: tournoiQuartier.value,
        date_debut: tournoiDateDebut.value,
        date_fin: tournoiDateFin.value,
        image_url: tournoiImageUrl.value,
        reglements: tournoiReglements.value,
        type_tournoi: tournoiType.value,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        if (currentTournoiId) {
            const { error } = await supabaseAdmin.from('public_tournois').update(data).eq('id', currentTournoiId);
            if (error) throw error;
            showToast('Tournoi modifié', 'success');
        } else {
            const { error } = await supabaseAdmin.from('public_tournois').insert([data]);
            if (error) throw error;
            showToast('Tournoi créé', 'success');
        }
        tournoiModal.classList.remove('active');
        loadTournois();
        loadCodes();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});

// ========== GESTION DES CODES ==========
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
    codesList.innerHTML = codes.map(c => `
        <div class="item-card">
            <h3>${escapeHtml(c.code)}</h3>
            <p><strong>Tournoi:</strong> ${c.public_tournois?.titre || 'Inconnu'} (${c.public_tournois?.type_tournoi === 'individuel' ? 'Individuel' : 'Collectif'})</p>
            <p><strong>Type:</strong> ${c.type_inscription === 'joueur_libre' ? 'Joueur libre' : 'Club'} | <strong>Entité:</strong> ${c.entite || '-'}</p>
            <p><strong>Quota:</strong> ${c.quota_utilise}/${c.quota_max}</p>
            <p><span class="badge ${c.actif ? 'actif' : 'inactif'}">${c.actif ? 'Actif' : 'Inactif'}</span></p>
            <div class="card-actions">
                <button class="btn-edit" data-id="${c.id}">✏️ Modifier</button>
                <button class="btn-delete" data-id="${c.id}">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('#codesList .btn-edit').forEach(btn => btn.addEventListener('click', () => editCode(btn.dataset.id)));
    document.querySelectorAll('#codesList .btn-delete').forEach(btn => btn.addEventListener('click', () => deleteCode(btn.dataset.id)));
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
async function populateTournoiSelect(selectElement, selectedId = null) {
    const { data, error } = await supabaseAdmin.from('public_tournois').select('id, titre, type_tournoi').order('titre');
    if (error) return;
    selectElement.innerHTML = '<option value="">-- Choisir un tournoi --</option>';
    data.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = `${t.titre} (${t.type_tournoi === 'individuel' ? 'Individuel' : 'Collectif'})`;
        if (selectedId && selectedId == t.id) option.selected = true;
        selectElement.appendChild(option);
    });
}
newCodeBtn.addEventListener('click', async () => {
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
codeForm.addEventListener('submit', async (e) => {
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
            const { error } = await supabaseAdmin.from('public_codes_tournoi').update(data).eq('id', currentCodeId);
            if (error) throw error;
            showToast('Code modifié', 'success');
        } else {
            const { error } = await supabaseAdmin.from('public_codes_tournoi').insert([data]);
            if (error) throw error;
            showToast('Code créé', 'success');
        }
        codeModal.classList.remove('active');
        loadCodes();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});

// ========== GESTION DES INSCRIPTIONS (AVEC SPORTS INDIVIDUELS) ==========
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
    inscriptionsList.innerHTML = inscriptions.map(ins => {
        const tournoi = ins.public_codes_tournoi?.public_tournois;
        const estIndividuel = tournoi?.type_tournoi === 'individuel';
        return `
            <div class="item-card">
                <h3>${escapeHtml(ins.nom_complet)}</h3>
                <p><strong>Email:</strong> ${escapeHtml(ins.email)} | <strong>Tél:</strong> ${escapeHtml(ins.telephone)}</p>
                <p><strong>Tournoi:</strong> ${tournoi?.titre || '?'} (${estIndividuel ? 'Individuel' : 'Collectif'})</p>
                <p><strong>Code:</strong> ${ins.public_codes_tournoi?.code || '?'}</p>
                <p><span class="badge ${ins.statut}">${ins.statut === 'en_attente' ? 'En attente' : ins.statut === 'valide' ? 'Validé' : 'Rejeté'}</span></p>
                <div class="card-actions">
                    ${ins.statut === 'en_attente' ? `<button class="btn-validate" data-id="${ins.id}">✅ Valider</button>` : ''}
                    <button class="btn-delete" data-id="${ins.id}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
    document.querySelectorAll('.btn-validate').forEach(btn => btn.addEventListener('click', () => openValidationModal(btn.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteInscription(btn.dataset.id)));
}
async function deleteInscription(id) {
    if (!confirm('Supprimer cette inscription ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_inscriptions_tournoi').delete().eq('id', id);
        if (error) throw error;
        showToast('Inscription supprimée', 'success');
        loadInscriptions();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
async function openValidationModal(inscriptionId) {
    currentInscriptionId = inscriptionId;
    showLoader();
    try {
        const { data: ins, error } = await supabaseAdmin
            .from('public_inscriptions_tournoi')
            .select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))')
            .eq('id', inscriptionId)
            .single();
        if (error) throw error;
        const tournoi = ins.public_codes_tournoi?.public_tournois;
        const estIndividuel = tournoi?.type_tournoi === 'individuel';
        validationInfo.innerHTML = `
            <p><strong>Candidat:</strong> ${escapeHtml(ins.nom_complet)}</p>
            <p><strong>Email:</strong> ${escapeHtml(ins.email)}</p>
            <p><strong>Tournoi:</strong> ${tournoi?.titre || '?'} (${estIndividuel ? 'Individuel' : 'Collectif'})</p>
            <p><strong>Code:</strong> ${ins.public_codes_tournoi?.code || '?'}</p>
            ${!estIndividuel && ins.nom_club ? `<p><strong>Club:</strong> ${escapeHtml(ins.nom_club)}</p>` : ''}
        `;
        // Pour un tournoi individuel, on force le rôle "joueur" et on masque le choix du rôle
        if (estIndividuel) {
            validationRole.value = 'joueur';
            validationRole.disabled = true;
        } else {
            validationRole.disabled = false;
        }
        validationLogin.value = '';
        validationPassword.value = '';
        validationModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement inscription', 'error'); } finally { hideLoader(); }
}
saveValidationBtn.addEventListener('click', async () => {
    const login = validationLogin.value.trim();
    const password = validationPassword.value.trim();
    const role = validationRole.value;
    if (!login || !password) { showToast('Login et mot de passe requis', 'warning'); return; }
    showLoader();
    try {
        // 1. Récupérer l'inscription et les infos du code/tournoi
        const { data: ins, error: insErr } = await supabaseAdmin
            .from('public_inscriptions_tournoi')
            .select('*, public_codes_tournoi(tournoi_id, code, type_inscription, entite)')
            .eq('id', currentInscriptionId)
            .single();
        if (insErr) throw insErr;
        const codeInfo = ins.public_codes_tournoi;
        const tournoiId = codeInfo.tournoi_id;
        // Récupérer le type de tournoi
        const { data: tournoi, error: tournoiErr } = await supabaseAdmin
            .from('public_tournois')
            .select('type_tournoi')
            .eq('id', tournoiId)
            .single();
        if (tournoiErr) throw tournoiErr;
        const estIndividuel = tournoi.type_tournoi === 'individuel';

        // 2. Mettre à jour le statut de l'inscription
        const { error: updateErr } = await supabaseAdmin
            .from('public_inscriptions_tournoi')
            .update({ statut: 'valide', date_traitement: new Date().toISOString() })
            .eq('id', currentInscriptionId);
        if (updateErr) throw updateErr;

        // 3. Créer l'utilisateur
        const passwordHash = hashPassword(password);
        const { data: newUser, error: userErr } = await supabaseAdmin
            .from('public_utilisateurs_tournoi')
            .insert([{
                inscription_id: currentInscriptionId,
                login: login,
                mot_de_passe_hash: passwordHash,
                role: role
            }])
            .select()
            .single();
        if (userErr) throw userErr;

        // 4. Selon le type de tournoi : créer une équipe (collectif) ou un participant individuel
        if (estIndividuel) {
            // Inscription individuelle : créer un participant dans public_participants_individuels
            const { error: partErr } = await supabaseAdmin
                .from('public_participants_individuels')
                .insert([{
                    tournoi_id: tournoiId,
                    inscription_id: currentInscriptionId,
                    nom_complet: ins.nom_complet,
                    email: ins.email,
                    telephone: ins.telephone,
                    statut: 'inscrit'
                }]);
            if (partErr) throw partErr;
        } else {
            // Tournoi collectif : créer une équipe
            const nomEquipe = ins.nom_club || codeInfo.entite || `Equipe de ${ins.nom_complet}`;
            const { error: teamErr } = await supabaseAdmin
                .from('public_equipes')
                .insert([{
                    tournoi_id: tournoiId,
                    nom_equipe: nomEquipe,
                    type_equipe: codeInfo.type_inscription === 'club' ? 'club' : 'fan_club',
                    capitaine_id: newUser.id
                }]);
            if (teamErr) throw teamErr;
        }

        // 5. Incrémenter le quota du code
        const { data: codeData, error: codeErr } = await supabaseAdmin
            .from('public_codes_tournoi')
            .select('quota_utilise, quota_max')
            .eq('id', codeInfo.id)
            .single();
        if (!codeErr && codeData && codeData.quota_utilise < codeData.quota_max) {
            await supabaseAdmin
                .from('public_codes_tournoi')
                .update({ quota_utilise: codeData.quota_utilise + 1 })
                .eq('id', codeInfo.id);
        }

        // 6. Envoyer une notification au candidat
        await supabaseAdmin.from('public_messages_prives').insert([{
            expediteur_id: 'admin',
            destinataire_id: newUser.id,
            sujet: 'Inscription validée',
            contenu: `Félicitations ! Votre inscription au tournoi a été validée. Vos identifiants de connexion sont : login = ${login}, mot de passe = ${password}. Connectez-vous sur ${window.location.origin}/connexion-tournoi.html`,
            lu: false,
            created_at: new Date().toISOString()
        }]);

        showToast('Inscription validée, compte créé et ' + (estIndividuel ? 'participant ajouté' : 'équipe créée'), 'success');
        validationModal.classList.remove('active');
        loadInscriptions();
        loadCodes(); // mettre à jour le quota affiché
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la validation', 'error');
    } finally {
        hideLoader();
    }
});
refreshBtn.addEventListener('click', loadInscriptions);
statusFilter.addEventListener('change', loadInscriptions);

// ========== GESTION DES LIVES ==========
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
    livesList.innerHTML = lives.map(l => `
        <div class="item-card">
            <h3>${escapeHtml(l.titre)}</h3>
            <p>${escapeHtml(l.description || '')}</p>
            <p><span class="badge ${l.actif ? 'actif' : 'inactif'}">${l.actif ? 'Actif' : 'Inactif'}</span></p>
            <div class="card-actions">
                <button class="btn-edit" data-id="${l.id}">✏️ Modifier</button>
                <button class="btn-delete" data-id="${l.id}">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('#livesList .btn-edit').forEach(btn => btn.addEventListener('click', () => editLive(btn.dataset.id)));
    document.querySelectorAll('#livesList .btn-delete').forEach(btn => btn.addEventListener('click', () => deleteLive(btn.dataset.id)));
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
        const { error } = await supabaseAdmin.from('public_lives').delete().eq('id', id);
        if (error) throw error;
        showToast('Live supprimé', 'success');
        loadLives();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
newLiveBtn.addEventListener('click', () => {
    currentLiveId = null;
    liveIdField.value = '';
    liveTitre.value = '';
    liveDescription.value = '';
    liveEmbedUrl.value = '';
    liveActif.checked = true;
    document.getElementById('liveModalTitle').textContent = 'Nouveau live';
    liveModal.classList.add('active');
});
liveForm.addEventListener('submit', async (e) => {
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
            const { error } = await supabaseAdmin.from('public_lives').update(data).eq('id', currentLiveId);
            if (error) throw error;
            showToast('Live modifié', 'success');
        } else {
            const { error } = await supabaseAdmin.from('public_lives').insert([data]);
            if (error) throw error;
            showToast('Live créé', 'success');
        }
        liveModal.classList.remove('active');
        loadLives();
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});

// ========== FERMETURE DES MODALES ==========
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tournoiModal.classList.remove('active');
        codeModal.classList.remove('active');
        validationModal.classList.remove('active');
        liveModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === tournoiModal) tournoiModal.classList.remove('active');
    if (e.target === codeModal) codeModal.classList.remove('active');
    if (e.target === validationModal) validationModal.classList.remove('active');
    if (e.target === liveModal) liveModal.classList.remove('active');
});

// ========== MENU MOBILE ==========
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

// ========== UTILITAIRES ==========
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
}

// ========== INITIALISATION ==========
loadInscriptions();
loadTournois();
loadCodes();
loadLives();