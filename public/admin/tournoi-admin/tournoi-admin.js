// ========== DEBUT : tournoi-admin.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentInscriptionId = null;

// ========== DEBUT : VÉRIFICATION DE SESSION ==========
(async () => {
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) {
        window.location.href = '../administration.html';
        return;
    }
    document.getElementById('authCheck').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    loadAll();
})();
// ========== FIN : VÉRIFICATION DE SESSION ==========

function loadAll() {
    loadTournois();
    loadCodes();
    loadInscriptions();
    loadLives();
}

document.getElementById('refreshAllBtn').addEventListener('click', loadAll);
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseAdmin.auth.signOut();
    window.location.href = '../administration.html';
});

// ========== DEBUT : ONGLETS ==========
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'tournois') loadTournois();
        else if (tab.dataset.tab === 'codes') loadCodes();
        else if (tab.dataset.tab === 'inscriptions') loadInscriptions();
        else if (tab.dataset.tab === 'lives') loadLives();
    });
});
// ========== FIN : ONGLETS ==========

// ========== DEBUT : UTILITAIRES ==========
function showToast(message, type = 'info', duration = 3000) {
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
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}
// ========== FIN : UTILITAIRES ==========

// ========== DEBUT : HACHAGE NATIF (SHA-256) ==========
async function hashPasswordNative(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
// ========== FIN : HACHAGE NATIF ==========

// ========== DEBUT : GÉNÉRATION DE MOT DE PASSE ALÉATOIRE ==========
function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ========== FIN : GÉNÉRATION DE MOT DE PASSE ==========

// ========== DEBUT : TOURNOIS ==========
async function loadTournois() {
    const list = document.getElementById('tournoisList');
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_tournois').select('*').order('date_debut', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Aucun tournoi.</p>';
            return;
        }
        list.innerHTML = data.map(t => `
            <div class="list-item">
                <div class="info">
                    <strong>${escapeHtml(t.titre)}</strong><br>
                    <small>${escapeHtml(t.sport)} – ${escapeHtml(t.ville)}</small>
                    <div class="details">${formatDate(t.date_debut)} → ${formatDate(t.date_fin)}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editTournoi(${t.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteTournoi(${t.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                    <button class="view" onclick="viewTournoiDetails(${t.id})" title="Détails"><i class="fas fa-eye"></i></button>
                    <button class="toggle-active" onclick="toggleTournoiActive(${t.id})" title="Activer / Désactiver"><i class="fas fa-toggle-on"></i></button>
                    <button class="refresh" onclick="refreshSingleTournoi(${t.id})" title="Rafraîchir"><i class="fas fa-sync-alt"></i></button>
                    <button class="comment" onclick="addTournoiComment(${t.id})" title="Commentaire"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast('Erreur chargement tournois', 'error');
    } finally { hideLoader(); }
}

function formatDate(d) {
    return d ? new Date(d).toLocaleDateString('fr-FR') : '';
}

window.editTournoi = async (id) => {
    showLoader();
    const { data, error } = await supabaseAdmin.from('public_tournois').select('*').eq('id', id).single();
    if (error) { hideLoader(); return; }
    document.getElementById('tournoiId').value = data.id;
    document.getElementById('tournoiSport').value = data.sport;
    document.getElementById('tournoiTitre').value = data.titre;
    document.getElementById('tournoiDescription').value = data.description || '';
    document.getElementById('tournoiVille').value = data.ville;
    document.getElementById('tournoiQuartier').value = data.quartier || '';
    document.getElementById('tournoiDateDebut').value = data.date_debut;
    document.getElementById('tournoiDateFin').value = data.date_fin;
    document.getElementById('tournoiReglements').value = data.reglements || '';
    document.getElementById('tournoiType').value = data.type_tournoi || 'collectif';
    document.getElementById('tournoiModalTitle').textContent = 'Modifier le tournoi';
    document.getElementById('tournoiModal').classList.add('active');
    existingMediaIds = []; deletedMediaIds = []; pendingMediaFiles = [];
    const { data: media } = await supabaseAdmin.from('public_tournoi_media').select('*').eq('tournoi_id', id).order('position');
    existingMediaIds = (media || []).map(m => m.id);
    renderMediaList(media || [], existingMediaIds);
    hideLoader();
};

window.deleteTournoi = async (id) => {
    if (!confirm('Supprimer définitivement ce tournoi et tous ses médias, codes, inscriptions ?')) return;
    showLoader();
    try {
        const { data: media } = await supabaseAdmin.from('public_tournoi_media').select('media_url').eq('tournoi_id', id);
        if (media) {
            for (const m of media) {
                const path = m.media_url.split('/').slice(-2).join('/');
                await supabaseAdmin.storage.from('tournois_media').remove([path]);
            }
        }
        await supabaseAdmin.from('public_tournoi_media').delete().eq('tournoi_id', id);
        await supabaseAdmin.from('public_codes_tournoi').delete().eq('tournoi_id', id);
        const { data: codes } = await supabaseAdmin.from('public_codes_tournoi').select('id').eq('tournoi_id', id);
        const codeIds = codes?.map(c => c.id) || [];
        if (codeIds.length) {
            await supabaseAdmin.from('public_inscriptions_tournoi').delete().in('code_id', codeIds);
        }
        await supabaseAdmin.from('public_tournois').delete().eq('id', id);
        showToast('Tournoi supprimé avec toutes ses dépendances', 'success');
        loadTournois();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally { hideLoader(); }
};

window.viewTournoiDetails = async (id) => {
    showLoader();
    const { data: t } = await supabaseAdmin.from('public_tournois').select('*').eq('id', id).single();
    if (!t) return hideLoader();
    const { data: codes } = await supabaseAdmin.from('public_codes_tournoi').select('*').eq('tournoi_id', id);
    let codesHtml = codes?.length ? codes.map(c => `<li>${c.code} (${c.type_inscription})</li>`).join('') : '<li>Aucun code</li>';
    let html = `
        <p><strong>Titre :</strong> ${escapeHtml(t.titre)}</p>
        <p><strong>Sport :</strong> ${escapeHtml(t.sport)}</p>
        <p><strong>Ville :</strong> ${escapeHtml(t.ville)} (${escapeHtml(t.quartier || '')})</p>
        <p><strong>Dates :</strong> ${formatDate(t.date_debut)} – ${formatDate(t.date_fin)}</p>
        <p><strong>Type :</strong> ${t.type_tournoi === 'individuel' ? 'Individuel' : 'Collectif'}</p>
        <p><strong>Règlements :</strong> ${escapeHtml(t.reglements || 'Aucun')}</p>
        <p><strong>Codes :</strong></p><ul>${codesHtml}</ul>
    `;
    document.getElementById('validationInfo').innerHTML = html;
    hideValidationForm();
    document.getElementById('validationModal').classList.add('active');
    hideLoader();
    const restore = () => {
        showValidationForm();
        document.getElementById('validationModal').removeEventListener('click', restore);
    };
    document.getElementById('validationModal').addEventListener('click', restore);
};

window.toggleTournoiActive = async (id) => {
    showLoader();
    const { data } = await supabaseAdmin.from('public_tournois').select('actif').eq('id', id).single();
    if (data) {
        await supabaseAdmin.from('public_tournois').update({ actif: !data.actif }).eq('id', id);
        showToast(`Tournoi ${!data.actif ? 'activé' : 'désactivé'}`, 'success');
        loadTournois();
    }
    hideLoader();
};

window.refreshSingleTournoi = (id) => {
    loadTournois();
};

window.addTournoiComment = async (id) => {
    const comment = prompt('Ajouter un commentaire / note pour ce tournoi :');
    if (comment === null) return;
    showLoader();
    const { error } = await supabaseAdmin.from('public_tournois').update({ commentaire_admin: comment.trim() }).eq('id', id);
    if (error) showToast('Erreur sauvegarde commentaire', 'error');
    else showToast('Commentaire enregistré', 'success');
    hideLoader();
};

// Médias
let existingMediaIds = [];
let deletedMediaIds = [];
let pendingMediaFiles = [];

function renderMediaList(mediaItems, existingIds) {
    const mediaList = document.getElementById('mediaList');
    let html = '';
    for (const m of mediaItems) {
        html += `<div class="media-item" data-media-id="${m.id}">
            ${m.media_type === 'image' ? `<img src="${m.media_url}" alt="media">` : `<video src="${m.media_url}" controls></video>`}
            <button type="button" class="btn-delete-media" data-id="${m.id}"><i class="fas fa-times"></i></button>
        </div>`;
    }
    for (const pf of pendingMediaFiles) {
        const url = URL.createObjectURL(pf.file);
        html += `<div class="media-item pending">
            ${pf.type === 'image' ? `<img src="${url}" alt="nouveau">` : `<video src="${url}" controls></video>`}
            <button type="button" class="btn-remove-pending"><i class="fas fa-times"></i></button>
        </div>`;
    }
    mediaList.innerHTML = html;
    document.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', () => {
            const mediaId = parseInt(btn.dataset.id);
            deletedMediaIds.push(mediaId);
            existingMediaIds = existingMediaIds.filter(id => id !== mediaId);
            const updatedItems = mediaItems.filter(m => m.id !== mediaId);
            renderMediaList(updatedItems, existingMediaIds);
        });
    });
    document.querySelectorAll('.btn-remove-pending').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            pendingMediaFiles.splice(i, 1);
            renderMediaList(mediaItems, existingMediaIds);
        });
    });
}

async function uploadMediaFile(file, tournoiId) {
    const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const { error } = await supabaseAdmin.storage.from('tournois_media').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from('tournois_media').getPublicUrl(fileName);
    return urlData.publicUrl;
}

document.getElementById('addImageBtn').addEventListener('click', () => {
    document.getElementById('mediaFileInput').accept = 'image/jpeg,image/png';
    document.getElementById('mediaFileInput').click();
});
document.getElementById('addVideoBtn').addEventListener('click', () => {
    document.getElementById('mediaFileInput').accept = 'video/mp4,video/webm';
    document.getElementById('mediaFileInput').click();
});
document.getElementById('mediaFileInput').addEventListener('change', function() {
    if (this.files.length) {
        const file = this.files[0];
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        pendingMediaFiles.push({ file, type });
        const currentId = document.getElementById('tournoiId').value;
        if (currentId) {
            supabaseAdmin.from('public_tournoi_media').select('*').eq('tournoi_id', currentId).order('position').then(({ data }) => {
                existingMediaIds = data ? data.map(m => m.id) : [];
                renderMediaList(data || [], existingMediaIds);
            });
        } else {
            renderMediaList([], []);
        }
        this.value = '';
    }
});

document.getElementById('tournoiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tournoiId').value;
    const data = {
        sport: document.getElementById('tournoiSport').value,
        titre: document.getElementById('tournoiTitre').value,
        description: document.getElementById('tournoiDescription').value,
        ville: document.getElementById('tournoiVille').value,
        quartier: document.getElementById('tournoiQuartier').value,
        date_debut: document.getElementById('tournoiDateDebut').value,
        date_fin: document.getElementById('tournoiDateFin').value,
        reglements: document.getElementById('tournoiReglements').value,
        type_tournoi: document.getElementById('tournoiType').value,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        let tournoiId = id;
        if (id) {
            await supabaseAdmin.from('public_tournois').update(data).eq('id', id);
        } else {
            const { data: newTournoi, error } = await supabaseAdmin.from('public_tournois').insert([data]).select().single();
            if (error) throw error;
            tournoiId = newTournoi.id;
        }
        for (const mId of deletedMediaIds) {
            await supabaseAdmin.from('public_tournoi_media').delete().eq('id', mId);
        }
        for (const pf of pendingMediaFiles) {
            const url = await uploadMediaFile(pf.file, tournoiId);
            await supabaseAdmin.from('public_tournoi_media').insert({ tournoi_id: tournoiId, media_url: url, media_type: pf.type, position: 0 });
        }
        const { data: allMedia } = await supabaseAdmin.from('public_tournoi_media').select('id').eq('tournoi_id', tournoiId).order('id');
        if (allMedia) {
            for (let i = 0; i < allMedia.length; i++) {
                await supabaseAdmin.from('public_tournoi_media').update({ position: i + 1 }).eq('id', allMedia[i].id);
            }
        }
        showToast('Tournoi enregistré', 'success');
        document.getElementById('tournoiModal').classList.remove('active');
        loadTournois();
    } catch (err) {
        showToast('Erreur sauvegarde', 'error');
    } finally {
        hideLoader();
        pendingMediaFiles = []; deletedMediaIds = []; existingMediaIds = [];
    }
});

document.getElementById('newTournoiBtn').addEventListener('click', () => {
    document.getElementById('tournoiForm').reset();
    document.getElementById('tournoiId').value = '';
    document.getElementById('tournoiModalTitle').textContent = 'Nouveau tournoi';
    document.getElementById('tournoiModal').classList.add('active');
    existingMediaIds = []; deletedMediaIds = []; pendingMediaFiles = [];
    renderMediaList([], []);
});

document.getElementById('refreshTournoisBtn').addEventListener('click', loadTournois);
// ========== FIN : TOURNOIS ==========

// ========== DEBUT : CODES ==========
async function loadCodes() {
    const list = document.getElementById('codesList');
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_codes_tournoi').select('*, public_tournois(titre)').order('created_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Aucun code.</p>';
            return;
        }
        list.innerHTML = data.map(c => `
            <div class="list-item">
                <div class="info">
                    <strong>${escapeHtml(c.code)}</strong><br>
                    <small>Tournoi : ${c.public_tournois?.titre || '?'}</small>
                    <div class="details">${c.type_inscription} – ${c.entite || ''} – ${c.quota_utilise}/${c.quota_max}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editCode(${c.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteCode(${c.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                    <button class="view" onclick="viewCodeDetails(${c.id})" title="Détails"><i class="fas fa-eye"></i></button>
                    <button class="toggle-active" onclick="toggleCodeActive(${c.id})" title="Activer / Désactiver"><i class="fas fa-toggle-on"></i></button>
                    <button class="refresh" onclick="refreshSingleCode(${c.id})" title="Rafraîchir"><i class="fas fa-sync-alt"></i></button>
                    <button class="comment" onclick="addCodeComment(${c.id})" title="Commentaire"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast('Erreur chargement codes', 'error');
    } finally { hideLoader(); }
}

window.editCode = async (id) => {
    showLoader();
    const { data, error } = await supabaseAdmin.from('public_codes_tournoi').select('*').eq('id', id).single();
    if (error) { hideLoader(); return; }
    document.getElementById('codeId').value = data.id;
    await populateTournoiSelect(document.getElementById('codeTournoiId'), data.tournoi_id);
    document.getElementById('codeValeur').value = data.code;
    document.getElementById('codeType').value = data.type_inscription;
    document.getElementById('codeEntite').value = data.entite || '';
    document.getElementById('codeQuotaMax').value = data.quota_max;
    document.getElementById('codeActif').checked = data.actif;
    document.getElementById('codeModalTitle').textContent = 'Modifier le code';
    document.getElementById('codeModal').classList.add('active');
    hideLoader();
};

window.deleteCode = async (id) => {
    if (!confirm('Supprimer ce code ?')) return;
    showLoader();
    await supabaseAdmin.from('public_codes_tournoi').delete().eq('id', id);
    showToast('Code supprimé', 'success');
    loadCodes();
};

window.viewCodeDetails = async (id) => {
    showLoader();
    const { data } = await supabaseAdmin.from('public_codes_tournoi').select('*, public_tournois(titre)').eq('id', id).single();
    if (!data) return hideLoader();
    let html = `<p><strong>Code :</strong> ${data.code}</p>
    <p><strong>Tournoi :</strong> ${data.public_tournois?.titre || '?'}</p>
    <p><strong>Type :</strong> ${data.type_inscription}</p>
    <p><strong>Entité :</strong> ${data.entite || '-'}</p>
    <p><strong>Quota :</strong> ${data.quota_utilise}/${data.quota_max}</p>`;
    document.getElementById('validationInfo').innerHTML = html;
    hideValidationForm();
    document.getElementById('validationModal').classList.add('active');
};

window.toggleCodeActive = async (id) => {
    const { data } = await supabaseAdmin.from('public_codes_tournoi').select('actif').eq('id', id).single();
    if (data) {
        await supabaseAdmin.from('public_codes_tournoi').update({ actif: !data.actif }).eq('id', id);
        showToast(`Code ${!data.actif ? 'activé' : 'désactivé'}`, 'success');
        loadCodes();
    }
};

window.refreshSingleCode = (id) => loadCodes();

window.addCodeComment = async (id) => {
    const comment = prompt('Commentaire pour ce code :');
    if (comment === null) return;
    showLoader();
    const { error } = await supabaseAdmin.from('public_codes_tournoi').update({ commentaire_admin: comment.trim() }).eq('id', id);
    if (error) showToast('Erreur', 'error');
    else showToast('Commentaire enregistré', 'success');
    hideLoader();
};

async function populateTournoiSelect(select, selectedId) {
    const { data } = await supabaseAdmin.from('public_tournois').select('id, titre').order('titre');
    select.innerHTML = '<option value="">-- Choisir un tournoi --</option>';
    data.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.titre;
        if (selectedId == t.id) opt.selected = true;
        select.appendChild(opt);
    });
}

document.getElementById('newCodeBtn').addEventListener('click', async () => {
    document.getElementById('codeForm').reset();
    document.getElementById('codeId').value = '';
    document.getElementById('codeModalTitle').textContent = 'Nouveau code';
    await populateTournoiSelect(document.getElementById('codeTournoiId'));
    document.getElementById('codeModal').classList.add('active');
});

document.getElementById('codeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('codeId').value;
    const data = {
        tournoi_id: document.getElementById('codeTournoiId').value,
        code: document.getElementById('codeValeur').value,
        type_inscription: document.getElementById('codeType').value,
        entite: document.getElementById('codeEntite').value || null,
        quota_max: parseInt(document.getElementById('codeQuotaMax').value),
        actif: document.getElementById('codeActif').checked
    };
    showLoader();
    try {
        if (id) {
            await supabaseAdmin.from('public_codes_tournoi').update(data).eq('id', id);
        } else {
            await supabaseAdmin.from('public_codes_tournoi').insert([data]);
        }
        showToast('Code enregistré', 'success');
        document.getElementById('codeModal').classList.remove('active');
        loadCodes();
    } catch (err) {
        showToast('Erreur', 'error');
    } finally { hideLoader(); }
});

document.getElementById('refreshCodesBtn').addEventListener('click', loadCodes);
// ========== FIN : CODES ==========

// ========== DEBUT : INSCRIPTIONS (validation avec SHA-256, génération auto login/mdp) ==========
async function loadInscriptions() {
    const list = document.getElementById('inscriptionsList');
    showLoader();
    try {
        let query = supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').order('date_soumission', { ascending: false });
        const status = document.getElementById('statusFilter').value;
        if (status !== 'all') query = query.eq('statut', status);
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Aucune inscription.</p>';
            return;
        }
        list.innerHTML = data.map(ins => {
            const tournoi = ins.public_codes_tournoi?.public_tournois;
            const estIndividuel = tournoi?.type_tournoi === 'individuel';
            const statutLabel = ins.statut === 'en_attente' ? 'En attente' : (ins.statut === 'valide' ? 'Validé' : 'Rejeté');
            let actionsHtml = '';
            if (ins.statut === 'en_attente') {
                actionsHtml += `<button class="validate" onclick="openValidationModal(${ins.id})" title="Valider"><i class="fas fa-check-circle"></i></button>`;
                actionsHtml += `<button class="reject" onclick="rejectInscription(${ins.id})" title="Rejeter"><i class="fas fa-times-circle"></i></button>`;
            }
            actionsHtml += `<button class="view" onclick="viewInscriptionDetails(${ins.id})" title="Détails"><i class="fas fa-eye"></i></button>`;
            actionsHtml += `<button class="edit" onclick="openEditInscriptionModal(${ins.id})" title="Modifier"><i class="fas fa-edit"></i></button>`;
            if (ins.statut === 'valide') {
                actionsHtml += `<button class="resend" onclick="resendCredentials(${ins.id})" title="Renvoyer identifiants"><i class="fas fa-sync-alt"></i></button>`;
            }
            actionsHtml += `<button class="comment" onclick="addInscriptionComment(${ins.id})" title="Commentaire"><i class="fas fa-comment-dots"></i></button>`;
            actionsHtml += `<button class="delete" onclick="deleteInscription(${ins.id})" title="Supprimer"><i class="fas fa-trash"></i></button>`;
            return `<div class="list-item">
                <div class="info">
                    <strong>${escapeHtml(ins.nom_complet)}</strong><br>
                    <small>${escapeHtml(ins.email)}</small>
                    <div class="details">${ins.public_codes_tournoi?.code || '?'} – ${tournoi?.titre || '?'} (${estIndividuel ? 'Indiv' : 'Coll'})</div>
                    <span class="badge ${ins.statut}">${statutLabel}</span>
                </div>
                <div class="actions">${actionsHtml}</div>
            </div>`;
        }).join('');
    } catch (err) {
        showToast('Erreur chargement inscriptions', 'error');
    } finally { hideLoader(); }
}

// Validation
window.openValidationModal = async (id) => {
    currentInscriptionId = id;
    showLoader();
    const { data: ins } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').eq('id', id).single();
    if (!ins) return hideLoader();
    const tournoi = ins.public_codes_tournoi?.public_tournois;
    const estIndividuel = tournoi?.type_tournoi === 'individuel';
    document.getElementById('validationInfo').innerHTML = `
        <p><strong>Candidat :</strong> ${ins.nom_complet}</p>
        <p><strong>Email :</strong> ${ins.email}</p>
        <p><strong>Tournoi :</strong> ${tournoi?.titre || '?'} (${estIndividuel ? 'Individuel' : 'Collectif'})</p>
        <p><strong>Code :</strong> ${ins.public_codes_tournoi?.code || '?'}</p>
    `;
    const loginAuto = ins.email.split('@')[0];
    const passwordAuto = generateRandomPassword();
    document.getElementById('validationLogin').value = loginAuto;
    document.getElementById('validationPassword').value = passwordAuto;
    document.getElementById('validationRole').value = estIndividuel ? 'joueur' : 'capitaine';
    document.getElementById('validationRole').disabled = estIndividuel;
    showValidationForm();
    document.getElementById('validationModal').classList.add('active');
    hideLoader();
};

document.getElementById('saveValidationBtn').addEventListener('click', async function() {
    const inscriptionId = currentInscriptionId;
    const login = document.getElementById('validationLogin').value.trim();
    const password = document.getElementById('validationPassword').value.trim();
    const role = document.getElementById('validationRole').value;
    if (!login || !password) {
        showToast('Login et mot de passe obligatoires', 'warning');
        return;
    }
    if (!window.crypto || !crypto.subtle) {
        showToast('Erreur : API de sécurité non disponible. Navigateur trop ancien.', 'error', 5000);
        return;
    }
    showLoader();
    try {
        const { data: ins, error: insErr } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(tournoi_id, code, type_inscription, entite, public_tournois(type_tournoi))').eq('id', inscriptionId).single();
        if (insErr || !ins) throw new Error('Inscription introuvable');
        await supabaseAdmin.from('public_inscriptions_tournoi').update({ statut: 'valide', date_traitement: new Date().toISOString() }).eq('id', inscriptionId);
        const hashed = await hashPasswordNative(password);
        const { data: newUser } = await supabaseAdmin.from('public_utilisateurs_tournoi').insert([{
            inscription_id: inscriptionId,
            login: login,
            mot_de_passe_hash: hashed,
            role: role
        }]).select().single();
        const tournoiId = ins.public_codes_tournoi.tournoi_id;
        const code = ins.public_codes_tournoi;
        if (ins.public_codes_tournoi?.public_tournois?.type_tournoi === 'individuel') {
            await supabaseAdmin.from('public_participants_individuels').insert([{ tournoi_id: tournoiId, inscription_id: inscriptionId, nom_complet: ins.nom_complet, email: ins.email, telephone: ins.telephone, statut: 'inscrit' }]);
        } else {
            const nomEquipe = ins.nom_club || code.entite || 'Equipe de ' + ins.nom_complet;
            await supabaseAdmin.from('public_equipes').insert([{ tournoi_id: tournoiId, nom_equipe: nomEquipe, type_equipe: code.type_inscription === 'club' ? 'club' : 'fan_club', capitaine_id: newUser.id }]);
        }
        const { data: codeData } = await supabaseAdmin.from('public_codes_tournoi').select('quota_utilise, quota_max').eq('id', ins.code_id).single();
        if (codeData && codeData.quota_utilise < codeData.quota_max) {
            await supabaseAdmin.from('public_codes_tournoi').update({ quota_utilise: codeData.quota_utilise + 1 }).eq('id', ins.code_id);
        }
        showToast(`✅ Inscription validée. Identifiants : Login: ${login} / Mot de passe: ${password}`, 'success', 30000);
        document.getElementById('validationModal').classList.remove('active');
        loadInscriptions(); loadCodes(); loadTournois();
    } catch (err) {
        showToast('Erreur validation : ' + err.message, 'error');
    } finally {
        hideLoader();
        showValidationForm();
    }
});

window.rejectInscription = async (id) => {
    const motif = prompt('Motif du rejet (optionnel) :');
    if (motif === null) return;
    showLoader();
    await supabaseAdmin.from('public_inscriptions_tournoi').update({ statut: 'rejete', commentaire_admin: motif.trim(), date_traitement: new Date().toISOString() }).eq('id', id);
    showToast('Inscription rejetée', 'success');
    loadInscriptions();
    hideLoader();
};

window.viewInscriptionDetails = async (id) => {
    showLoader();
    const { data: ins } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*, public_codes_tournoi(code, tournoi_id, public_tournois(titre, type_tournoi))').eq('id', id).single();
    if (!ins) return hideLoader();
    let html = `<div style="max-height:400px;overflow-y:auto;">`;
    html += `<p><strong>Nom :</strong> ${ins.nom_complet}</p>`;
    html += `<p><strong>Email :</strong> ${ins.email}</p>`;
    html += `<p><strong>Téléphone :</strong> ${ins.telephone}</p>`;
    html += `<p><strong>Date naissance :</strong> ${ins.date_naissance || '-'}</p>`;
    html += `<p><strong>Ville/Quartier :</strong> ${ins.ville_quartier || '-'}</p>`;
    html += `<p><strong>Réseaux :</strong> ${ins.reseaux_sociaux || '-'}</p>`;
    html += `<p><strong>Catégorie :</strong> ${ins.categorie_talent} / ${ins.discipline} ${ins.autre_discipline ? '('+ins.autre_discipline+')' : ''}</p>`;
    html += `<p><strong>Statut talent :</strong> ${ins.statut_talent}</p>`;
    if (ins.statut_talent === 'en_club') {
        html += `<p><strong>Club :</strong> ${ins.nom_club_actuel} – Contact: ${ins.contact_responsable}</p>`;
    }
    html += `<p><strong>Niveau études :</strong> ${ins.niveau_etudes || '-'}</p>`;
    html += `<p><strong>Métier souhaité :</strong> ${ins.metier_souhaite || '-'}</p>`;
    html += `<p><strong>Disponibilités :</strong> ${ins.disponibilites ? JSON.stringify(ins.disponibilites) : '-'}</p>`;
    html += `<p><strong>Commentaire admin :</strong> ${ins.commentaire_admin || 'Aucun'}</p>`;
    html += `</div>`;
    document.getElementById('validationInfo').innerHTML = html;
    hideValidationForm();
    document.getElementById('validationModal').classList.add('active');
    hideLoader();
};

window.openEditInscriptionModal = async (id) => {
    currentInscriptionId = id;
    showLoader();
    const { data: ins } = await supabaseAdmin.from('public_inscriptions_tournoi').select('*').eq('id', id).single();
    if (!ins) { hideLoader(); return; }
    document.getElementById('editInscriptionId').value = ins.id;
    document.getElementById('editNomComplet').value = ins.nom_complet || '';
    document.getElementById('editDateNaissance').value = ins.date_naissance || '';
    document.getElementById('editVilleQuartier').value = ins.ville_quartier || '';
    document.getElementById('editTelephone').value = ins.telephone || '';
    document.getElementById('editEmail').value = ins.email || '';
    document.getElementById('editReseauxSociaux').value = ins.reseaux_sociaux || '';
    document.getElementById('editCategorie').value = ins.categorie_talent || '';
    handleEditCategorieChange();
    if (ins.categorie_talent === 'sportif') {
        document.getElementById('editDisciplineSport').value = ins.discipline || '';
        handleEditAutreDiscipline('sportif', ins.discipline, ins.autre_discipline);
    } else if (ins.categorie_talent === 'artiste') {
        document.getElementById('editDisciplineArtiste').value = ins.discipline || '';
        handleEditAutreDiscipline('artiste', ins.discipline, ins.autre_discipline);
    }
    document.getElementById('editStatutTalent').value = ins.statut_talent || '';
    handleEditStatutChange();
    if (ins.statut_talent === 'en_club') {
        document.getElementById('editNomClubActuel').value = ins.nom_club_actuel || '';
        document.getElementById('editContactResponsable').value = ins.contact_responsable || '';
    }
    document.getElementById('editNiveauEtudes').value = ins.niveau_etudes || '';
    document.getElementById('editMetierSouhaite').value = ins.metier_souhaite || '';
    document.querySelectorAll('.edit-dispo-check').forEach(cb => cb.checked = false);
    if (ins.disponibilites) {
        for (const [day, slots] of Object.entries(ins.disponibilites)) {
            slots.forEach(slot => {
                const cb = document.querySelector(`.edit-dispo-check[data-day="${day}"][data-slot="${slot}"]`);
                if (cb) cb.checked = true;
            });
        }
    }
    document.getElementById('editInscriptionModal').classList.add('active');
    hideLoader();
};

function handleEditCategorieChange() {
    const val = document.getElementById('editCategorie').value;
    document.getElementById('editDisciplineSportGroup').style.display = val === 'sportif' ? 'block' : 'none';
    document.getElementById('editDisciplineArtisteGroup').style.display = val === 'artiste' ? 'block' : 'none';
    document.getElementById('editAutreDisciplineGroup').style.display = 'none';
}
document.getElementById('editCategorie').addEventListener('change', handleEditCategorieChange);

function handleEditAutreDiscipline(cat, disc, autre) {
    const autreGroup = document.getElementById('editAutreDisciplineGroup');
    if ((cat === 'sportif' && disc === 'autre_sport') || (cat === 'artiste' && disc === 'autre_artiste')) {
        autreGroup.style.display = 'block';
        document.getElementById('editAutreDiscipline').value = autre || '';
    } else {
        autreGroup.style.display = 'none';
    }
}
document.getElementById('editDisciplineSport').addEventListener('change', function() {
    handleEditAutreDiscipline('sportif', this.value);
});
document.getElementById('editDisciplineArtiste').addEventListener('change', function() {
    handleEditAutreDiscipline('artiste', this.value);
});

function handleEditStatutChange() {
    const val = document.getElementById('editStatutTalent').value;
    document.getElementById('editClubFieldsGroup').style.display = val === 'en_club' ? 'block' : 'none';
}
document.getElementById('editStatutTalent').addEventListener('change', handleEditStatutChange);

document.getElementById('editInscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editInscriptionId').value;
    const disponibilites = {};
    document.querySelectorAll('.edit-dispo-check:checked').forEach(cb => {
        const day = cb.dataset.day;
        const slot = cb.dataset.slot;
        if (!disponibilites[day]) disponibilites[day] = [];
        disponibilites[day].push(slot);
    });
    let discipline = '';
    let autreDiscipline = '';
    const cat = document.getElementById('editCategorie').value;
    if (cat === 'sportif') {
        discipline = document.getElementById('editDisciplineSport').value;
        if (discipline === 'autre_sport') autreDiscipline = document.getElementById('editAutreDiscipline').value.trim();
    } else if (cat === 'artiste') {
        discipline = document.getElementById('editDisciplineArtiste').value;
        if (discipline === 'autre_artiste') autreDiscipline = document.getElementById('editAutreDiscipline').value.trim();
    }
    const data = {
        nom_complet: document.getElementById('editNomComplet').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        telephone: document.getElementById('editTelephone').value.trim(),
        date_naissance: document.getElementById('editDateNaissance').value,
        ville_quartier: document.getElementById('editVilleQuartier').value.trim(),
        reseaux_sociaux: document.getElementById('editReseauxSociaux').value.trim(),
        categorie_talent: cat,
        discipline: discipline,
        autre_discipline: autreDiscipline || null,
        statut_talent: document.getElementById('editStatutTalent').value,
        nom_club_actuel: document.getElementById('editStatutTalent').value === 'en_club' ? document.getElementById('editNomClubActuel').value.trim() : null,
        contact_responsable: document.getElementById('editStatutTalent').value === 'en_club' ? document.getElementById('editContactResponsable').value.trim() : null,
        niveau_etudes: document.getElementById('editNiveauEtudes').value.trim(),
        metier_souhaite: document.getElementById('editMetierSouhaite').value.trim(),
        disponibilites: Object.keys(disponibilites).length > 0 ? disponibilites : null
    };
    showLoader();
    try {
        await supabaseAdmin.from('public_inscriptions_tournoi').update(data).eq('id', id);
        showToast('Inscription modifiée avec succès', 'success');
        document.getElementById('editInscriptionModal').classList.remove('active');
        loadInscriptions();
    } catch (err) {
        showToast('Erreur modification', 'error');
    } finally { hideLoader(); }
});

window.resendCredentials = async (id) => {
    showLoader();
    const { data: user } = await supabaseAdmin.from('public_utilisateurs_tournoi').select('login').eq('inscription_id', id).maybeSingle();
    if (!user) {
        showToast('Aucun compte trouvé', 'error');
        hideLoader();
        return;
    }
    if (!window.crypto || !crypto.subtle) {
        showToast('Erreur : API de sécurité non disponible.', 'error', 5000);
        hideLoader();
        return;
    }
    const newPassword = generateRandomPassword();
    const hashed = await hashPasswordNative(newPassword);
    await supabaseAdmin.from('public_utilisateurs_tournoi').update({ mot_de_passe_hash: hashed }).eq('inscription_id', id);
    showToast(`Identifiants renvoyés : Login: ${user.login} / Mot de passe: ${newPassword}`, 'info', 30000);
    hideLoader();
};

window.addInscriptionComment = async (id) => {
    const comment = prompt('Ajouter un commentaire :');
    if (comment === null) return;
    showLoader();
    await supabaseAdmin.from('public_inscriptions_tournoi').update({ commentaire_admin: comment.trim() }).eq('id', id);
    showToast('Commentaire ajouté', 'success');
    loadInscriptions();
    hideLoader();
};

window.deleteInscription = async (id) => {
    if (!confirm('Supprimer cette inscription ?')) return;
    showLoader();
    await supabaseAdmin.from('public_inscriptions_tournoi').delete().eq('id', id);
    showToast('Inscription supprimée', 'success');
    loadInscriptions();
    hideLoader();
};

function hideValidationForm() {
    document.getElementById('validationLogin').style.display = 'none';
    document.getElementById('validationPassword').style.display = 'none';
    document.getElementById('validationRole').style.display = 'none';
    document.getElementById('saveValidationBtn').style.display = 'none';
}
function showValidationForm() {
    document.getElementById('validationLogin').style.display = '';
    document.getElementById('validationPassword').style.display = '';
    document.getElementById('validationRole').style.display = '';
    document.getElementById('saveValidationBtn').style.display = '';
}

document.getElementById('refreshInscriptionsBtn').addEventListener('click', loadInscriptions);
document.getElementById('statusFilter').addEventListener('change', loadInscriptions);
// ========== FIN : INSCRIPTIONS ==========

// ========== DEBUT : LIVES ==========
async function loadLives() {
    const list = document.getElementById('livesList');
    showLoader();
    try {
        const { data, error } = await supabaseAdmin.from('public_lives').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Aucun live.</p>';
            return;
        }
        list.innerHTML = data.map(l => `
            <div class="list-item">
                <div class="info">
                    <strong>${escapeHtml(l.titre)}</strong><br>
                    <small>${escapeHtml(l.description || '')}</small>
                    <div class="details">${l.actif ? 'Actif' : 'Inactif'}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editLive(${l.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteLive(${l.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                    <button class="view" onclick="viewLiveDetails(${l.id})" title="Détails"><i class="fas fa-eye"></i></button>
                    <button class="toggle-active" onclick="toggleLiveActive(${l.id})" title="Activer / Désactiver"><i class="fas fa-toggle-on"></i></button>
                    <button class="refresh" onclick="refreshSingleLive(${l.id})" title="Rafraîchir"><i class="fas fa-sync-alt"></i></button>
                    <button class="comment" onclick="addLiveComment(${l.id})" title="Commentaire"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast('Erreur chargement lives', 'error');
    } finally { hideLoader(); }
}

window.editLive = async (id) => {
    showLoader();
    const { data } = await supabaseAdmin.from('public_lives').select('*').eq('id', id).single();
    if (!data) return hideLoader();
    document.getElementById('liveId').value = data.id;
    document.getElementById('liveTitre').value = data.titre;
    document.getElementById('liveDescription').value = data.description || '';
    document.getElementById('liveEmbedUrl').value = data.embed_url;
    document.getElementById('liveActif').checked = data.actif;
    document.getElementById('liveModalTitle').textContent = 'Modifier le live';
    document.getElementById('liveModal').classList.add('active');
    hideLoader();
};

window.deleteLive = async (id) => {
    if (!confirm('Supprimer ce live ?')) return;
    showLoader();
    await supabaseAdmin.from('public_lives').delete().eq('id', id);
    showToast('Live supprimé', 'success');
    loadLives();
    hideLoader();
};

window.viewLiveDetails = async (id) => {
    showLoader();
    const { data } = await supabaseAdmin.from('public_lives').select('*').eq('id', id).single();
    if (!data) return hideLoader();
    let html = `<p><strong>Titre :</strong> ${data.titre}</p>
    <p><strong>Description :</strong> ${data.description || '-'}</p>
    <p><strong>URL :</strong> ${data.embed_url}</p>
    <p><strong>Statut :</strong> ${data.actif ? 'Actif' : 'Inactif'}</p>`;
    document.getElementById('validationInfo').innerHTML = html;
    hideValidationForm();
    document.getElementById('validationModal').classList.add('active');
    hideLoader();
};

window.toggleLiveActive = async (id) => {
    const { data } = await supabaseAdmin.from('public_lives').select('actif').eq('id', id).single();
    if (data) {
        await supabaseAdmin.from('public_lives').update({ actif: !data.actif }).eq('id', id);
        showToast(`Live ${!data.actif ? 'activé' : 'désactivé'}`, 'success');
        loadLives();
    }
};

window.refreshSingleLive = (id) => loadLives();

window.addLiveComment = async (id) => {
    const comment = prompt('Commentaire pour ce live :');
    if (comment === null) return;
    showLoader();
    const { error } = await supabaseAdmin.from('public_lives').update({ commentaire_admin: comment.trim() }).eq('id', id);
    if (error) showToast('Erreur', 'error');
    else showToast('Commentaire enregistré', 'success');
    hideLoader();
};

document.getElementById('newLiveBtn').addEventListener('click', () => {
    document.getElementById('liveForm').reset();
    document.getElementById('liveId').value = '';
    document.getElementById('liveModalTitle').textContent = 'Nouveau live';
    document.getElementById('liveModal').classList.add('active');
});

document.getElementById('liveForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('liveId').value;
    const data = {
        titre: document.getElementById('liveTitre').value,
        description: document.getElementById('liveDescription').value,
        embed_url: document.getElementById('liveEmbedUrl').value,
        actif: document.getElementById('liveActif').checked
    };
    showLoader();
    try {
        if (id) {
            await supabaseAdmin.from('public_lives').update(data).eq('id', id);
        } else {
            await supabaseAdmin.from('public_lives').insert([data]);
        }
        showToast('Live enregistré', 'success');
        document.getElementById('liveModal').classList.remove('active');
        loadLives();
    } catch (err) {
        showToast('Erreur', 'error');
    } finally { hideLoader(); }
});

document.getElementById('refreshLivesBtn').addEventListener('click', loadLives);
// ========== FIN : LIVES ==========

// ========== DEBUT : FERMETURE DES MODALES ==========
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        showValidationForm();
    });
});
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        showValidationForm();
    }
});
// ========== FIN : FERMETURE DES MODALES ==========
// ========== FIN : tournoi-admin.js ==========