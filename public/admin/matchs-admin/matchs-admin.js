// ========== MATCHS-ADMIN.JS ==========
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

// ========== CHARGEMENT DES TOURNOIS ==========
const tournoiFilter = document.getElementById('tournoiFilter');
const typeTournoiFilter = document.getElementById('typeTournoiFilter');
const refreshMatchsBtn = document.getElementById('refreshMatchsBtn');
const newMatchBtn = document.getElementById('newMatchBtn');
const matchsList = document.getElementById('matchsList');

let allTournois = [];
let allEquipes = [];
let allParticipants = [];
let currentMatchId = null;
let currentMatchActionsMatchId = null;
let currentMatchType = null;

// Récupérer les tournois
async function chargerTournois() {
    const { data, error } = await supabaseAdmin.from('public_tournois').select('id, titre, type_tournoi').order('titre');
    if (error) { showToast('Erreur chargement tournois', 'error'); return []; }
    allTournois = data || [];
    return allTournois;
}
async function chargerEquipes() {
    const { data, error } = await supabaseAdmin.from('public_equipes').select('id, nom_equipe, tournoi_id').order('nom_equipe');
    if (error) { showToast('Erreur chargement équipes', 'error'); return []; }
    allEquipes = data || [];
    return allEquipes;
}
async function chargerParticipants() {
    const { data, error } = await supabaseAdmin.from('public_participants_individuels').select('id, nom_complet, tournoi_id').order('nom_complet');
    if (error) { showToast('Erreur chargement participants', 'error'); return []; }
    allParticipants = data || [];
    return allParticipants;
}

// ========== AFFICHAGE DES MATCHS ==========
async function chargerMatchs() {
    showLoader();
    try {
        const tournoiId = tournoiFilter.value;
        const type = typeTournoiFilter.value;
        let matchsCollectif = [];
        let matchsIndividuel = [];
        if (type === 'all' || type === 'collectif') {
            let query = supabaseAdmin.from('public_matchs').select('*, equipe_domicile:equipe_domicile_id (nom_equipe), equipe_exterieur:equipe_exterieur_id (nom_equipe)').order('date_match', { ascending: false });
            if (tournoiId !== 'all') query = query.eq('tournoi_id', tournoiId);
            const { data, error } = await query;
            if (!error) matchsCollectif = data || [];
        }
        if (type === 'all' || type === 'individuel') {
            let query = supabaseAdmin.from('public_matchs_individuels').select('*, participant_domicile:participant_domicile_id (nom_complet), participant_exterieur:participant_exterieur_id (nom_complet)').order('date_match', { ascending: false });
            if (tournoiId !== 'all') query = query.eq('tournoi_id', tournoiId);
            const { data, error } = await query;
            if (!error) matchsIndividuel = data || [];
        }
        renderMatchs(matchsCollectif, matchsIndividuel);
    } catch (err) { showToast('Erreur chargement matchs', 'error'); } finally { hideLoader(); }
}
function renderMatchs(matchsCollectif, matchsIndividuel) {
    if (!matchsList) return;
    let html = '';
    if (matchsCollectif.length) {
        html += `<h3 style="margin-top:20px; color:var(--primary);">📋 Matchs collectifs</h3>`;
        for (const m of matchsCollectif) {
            const statutClass = `statut-${m.statut === 'a_venir' ? 'a_venir' : m.statut === 'en_cours' ? 'en_cours' : 'termine'}`;
            const statutLabel = m.statut === 'a_venir' ? 'À venir' : m.statut === 'en_cours' ? 'En cours' : 'Terminé';
            const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
            html += `
                <div class="match-card" data-id="${m.id}" data-type="collectif">
                    <div class="match-header">
                        <span class="match-teams">${escapeHtml(m.equipe_domicile?.nom_equipe || '?')} vs ${escapeHtml(m.equipe_exterieur?.nom_equipe || '?')}</span>
                        <span class="match-statut ${statutClass}">${statutLabel}</span>
                    </div>
                    <div class="match-info">
                        <div class="match-score">${score}</div>
                        <div class="match-date">${new Date(m.date_match).toLocaleDateString()} ${m.heure ? ' à ' + m.heure : ''}</div>
                    </div>
                    <div class="match-actions">
                        <button class="btn-edit-match" data-id="${m.id}" data-type="collectif">✏️ Modifier</button>
                        <button class="btn-actions-match" data-id="${m.id}" data-type="collectif">⚽ Actions</button>
                        <button class="btn-delete-match" data-id="${m.id}" data-type="collectif">🗑️ Supprimer</button>
                    </div>
                </div>
            `;
        }
    }
    if (matchsIndividuel.length) {
        html += `<h3 style="margin-top:20px; color:var(--primary);">🎾 Matchs individuels</h3>`;
        for (const m of matchsIndividuel) {
            const statutClass = `statut-${m.statut === 'a_venir' ? 'a_venir' : m.statut === 'en_cours' ? 'en_cours' : 'termine'}`;
            const statutLabel = m.statut === 'a_venir' ? 'À venir' : m.statut === 'en_cours' ? 'En cours' : 'Terminé';
            const score = (m.score_domicile !== null && m.score_exterieur !== null) ? `${m.score_domicile} - ${m.score_exterieur}` : '-';
            html += `
                <div class="match-card" data-id="${m.id}" data-type="individuel">
                    <div class="match-header">
                        <span class="match-teams">${escapeHtml(m.participant_domicile?.nom_complet || '?')} vs ${escapeHtml(m.participant_exterieur?.nom_complet || '?')}</span>
                        <span class="match-statut ${statutClass}">${statutLabel}</span>
                    </div>
                    <div class="match-info">
                        <div class="match-score">${score}</div>
                        <div class="match-date">${new Date(m.date_match).toLocaleDateString()} ${m.heure ? ' à ' + m.heure : ''}</div>
                    </div>
                    <div class="match-actions">
                        <button class="btn-edit-match" data-id="${m.id}" data-type="individuel">✏️ Modifier</button>
                        <button class="btn-actions-match" data-id="${m.id}" data-type="individuel">⚽ Actions</button>
                        <button class="btn-delete-match" data-id="${m.id}" data-type="individuel">🗑️ Supprimer</button>
                    </div>
                </div>
            `;
        }
    }
    if (!matchsCollectif.length && !matchsIndividuel.length) html = '<div class="empty-message">Aucun match trouvé.</div>';
    matchsList.innerHTML = html;
    document.querySelectorAll('.btn-edit-match').forEach(btn => btn.addEventListener('click', () => editMatch(btn.dataset.id, btn.dataset.type)));
    document.querySelectorAll('.btn-actions-match').forEach(btn => btn.addEventListener('click', () => openActionsModal(btn.dataset.id, btn.dataset.type)));
    document.querySelectorAll('.btn-delete-match').forEach(btn => btn.addEventListener('click', () => deleteMatch(btn.dataset.id, btn.dataset.type)));
}

// ========== CRUD MATCH ==========
const matchModal = document.getElementById('matchModal');
const matchForm = document.getElementById('matchForm');
const matchIdField = document.getElementById('matchId');
const matchTournoiId = document.getElementById('matchTournoiId');
const matchTypeTournoi = document.getElementById('matchTypeTournoi');
const matchEquipeDomicile = document.getElementById('matchEquipeDomicile');
const matchEquipeExterieur = document.getElementById('matchEquipeExterieur');
const matchParticipantDomicile = document.getElementById('matchParticipantDomicile');
const matchParticipantExterieur = document.getElementById('matchParticipantExterieur');
const matchDate = document.getElementById('matchDate');
const matchHeure = document.getElementById('matchHeure');
const matchStatut = document.getElementById('matchStatut');
const matchScoreDomicile = document.getElementById('matchScoreDomicile');
const matchScoreExterieur = document.getElementById('matchScoreExterieur');
const matchLiveUrl = document.getElementById('matchLiveUrl');
const equipeDomicileGroup = document.getElementById('equipeDomicileGroup');
const equipeExterieurGroup = document.getElementById('equipeExterieurGroup');
const participantDomicileGroup = document.getElementById('participantDomicileGroup');
const participantExterieurGroup = document.getElementById('participantExterieurGroup');

async function populateTournoiSelect(select, selectedId = null) {
    const tournois = await chargerTournois();
    select.innerHTML = '<option value="">-- Choisir un tournoi --</option>';
    for (const t of tournois) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.titre} (${t.type_tournoi === 'collectif' ? 'Collectif' : 'Individuel'})`;
        if (selectedId && selectedId == t.id) opt.selected = true;
        select.appendChild(opt);
    }
}
async function populateEquipesByTournoi(tournoiId, selectDom, selectedId = null) {
    let equipes = allEquipes.filter(e => e.tournoi_id == tournoiId);
    selectDom.innerHTML = '<option value="">-- Choisir une équipe --</option>';
    for (const eq of equipes) {
        const opt = document.createElement('option');
        opt.value = eq.id;
        opt.textContent = eq.nom_equipe;
        if (selectedId && selectedId == eq.id) opt.selected = true;
        selectDom.appendChild(opt);
    }
}
async function populateParticipantsByTournoi(tournoiId, selectDom, selectedId = null) {
    let participants = allParticipants.filter(p => p.tournoi_id == tournoiId);
    selectDom.innerHTML = '<option value="">-- Choisir un participant --</option>';
    for (const p of participants) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nom_complet;
        if (selectedId && selectedId == p.id) opt.selected = true;
        selectDom.appendChild(opt);
    }
}
matchTournoiId.addEventListener('change', async () => {
    const tournoiId = matchTournoiId.value;
    const { data: tournoi } = await supabaseAdmin.from('public_tournois').select('type_tournoi').eq('id', tournoiId).single();
    if (tournoi) {
        matchTypeTournoi.value = tournoi.type_tournoi;
        if (tournoi.type_tournoi === 'collectif') {
            equipeDomicileGroup.style.display = 'block';
            equipeExterieurGroup.style.display = 'block';
            participantDomicileGroup.style.display = 'none';
            participantExterieurGroup.style.display = 'none';
            await populateEquipesByTournoi(tournoiId, matchEquipeDomicile);
            await populateEquipesByTournoi(tournoiId, matchEquipeExterieur);
        } else {
            equipeDomicileGroup.style.display = 'none';
            equipeExterieurGroup.style.display = 'none';
            participantDomicileGroup.style.display = 'block';
            participantExterieurGroup.style.display = 'block';
            await populateParticipantsByTournoi(tournoiId, matchParticipantDomicile);
            await populateParticipantsByTournoi(tournoiId, matchParticipantExterieur);
        }
    }
});
newMatchBtn.addEventListener('click', async () => {
    currentMatchId = null;
    matchIdField.value = '';
    await populateTournoiSelect(matchTournoiId);
    matchTypeTournoi.value = 'collectif';
    matchDate.value = '';
    matchHeure.value = '';
    matchStatut.value = 'a_venir';
    matchScoreDomicile.value = '';
    matchScoreExterieur.value = '';
    matchLiveUrl.value = '';
    document.getElementById('matchModalTitle').textContent = 'Nouveau match';
    matchModal.classList.add('active');
});
async function editMatch(id, type) {
    showLoader();
    try {
        let data;
        if (type === 'collectif') {
            const { data: d, error } = await supabaseAdmin.from('public_matchs').select('*').eq('id', id).single();
            if (error) throw error;
            data = d;
            currentMatchType = 'collectif';
        } else {
            const { data: d, error } = await supabaseAdmin.from('public_matchs_individuels').select('*').eq('id', id).single();
            if (error) throw error;
            data = d;
            currentMatchType = 'individuel';
        }
        currentMatchId = data.id;
        matchIdField.value = data.id;
        await populateTournoiSelect(matchTournoiId, data.tournoi_id);
        await matchTournoiId.dispatchEvent(new Event('change'));
        if (currentMatchType === 'collectif') {
            await populateEquipesByTournoi(data.tournoi_id, matchEquipeDomicile, data.equipe_domicile_id);
            await populateEquipesByTournoi(data.tournoi_id, matchEquipeExterieur, data.equipe_exterieur_id);
        } else {
            await populateParticipantsByTournoi(data.tournoi_id, matchParticipantDomicile, data.participant_domicile_id);
            await populateParticipantsByTournoi(data.tournoi_id, matchParticipantExterieur, data.participant_exterieur_id);
        }
        matchDate.value = data.date_match;
        matchHeure.value = data.heure || '';
        matchStatut.value = data.statut;
        matchScoreDomicile.value = data.score_domicile !== null ? data.score_domicile : '';
        matchScoreExterieur.value = data.score_exterieur !== null ? data.score_exterieur : '';
        matchLiveUrl.value = data.live_url || '';
        document.getElementById('matchModalTitle').textContent = 'Modifier le match';
        matchModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement match', 'error'); } finally { hideLoader(); }
}
async function deleteMatch(id, type) {
    if (!confirm('Supprimer ce match ? Toutes les actions et stats associées seront supprimées.')) return;
    showLoader();
    try {
        let error;
        if (type === 'collectif') {
            const { error: e } = await supabaseAdmin.from('public_matchs').delete().eq('id', id);
            error = e;
        } else {
            const { error: e } = await supabaseAdmin.from('public_matchs_individuels').delete().eq('id', id);
            error = e;
        }
        if (error) throw error;
        // Supprimer aussi les stats et actions liées
        await supabaseAdmin.from('public_actions_match').delete().eq('match_id', id);
        await supabaseAdmin.from('public_stats_match').delete().eq('match_id', id);
        showToast('Match supprimé', 'success');
        chargerMatchs();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tournoiId = matchTournoiId.value;
    const type = matchTypeTournoi.value;
    const date = matchDate.value;
    const heure = matchHeure.value || null;
    const statut = matchStatut.value;
    const scoreDom = matchScoreDomicile.value ? parseInt(matchScoreDomicile.value) : null;
    const scoreExt = matchScoreExterieur.value ? parseInt(matchScoreExterieur.value) : null;
    const liveUrl = matchLiveUrl.value || null;
    if (!tournoiId || !date) { showToast('Tournoi et date requis', 'warning'); return; }
    showLoader();
    try {
        if (currentMatchId) {
            if (currentMatchType === 'collectif') {
                const { error } = await supabaseAdmin.from('public_matchs').update({
                    date_match: date, heure, statut, score_domicile: scoreDom, score_exterieur: scoreExt, live_url: liveUrl, updated_at: new Date().toISOString()
                }).eq('id', currentMatchId);
                if (error) throw error;
            } else {
                const { error } = await supabaseAdmin.from('public_matchs_individuels').update({
                    date_match: date, heure, statut, score_domicile: scoreDom, score_exterieur: scoreExt, live_url: liveUrl, updated_at: new Date().toISOString()
                }).eq('id', currentMatchId);
                if (error) throw error;
            }
            showToast('Match modifié', 'success');
        } else {
            if (type === 'collectif') {
                const equipeDom = matchEquipeDomicile.value;
                const equipeExt = matchEquipeExterieur.value;
                if (!equipeDom || !equipeExt) { showToast('Choisissez les deux équipes', 'warning'); return; }
                const { error } = await supabaseAdmin.from('public_matchs').insert([{
                    tournoi_id: tournoiId, equipe_domicile_id: equipeDom, equipe_exterieur_id: equipeExt,
                    date_match: date, heure, statut, score_domicile: scoreDom, score_exterieur: scoreExt, live_url: liveUrl
                }]);
                if (error) throw error;
            } else {
                const participantDom = matchParticipantDomicile.value;
                const participantExt = matchParticipantExterieur.value;
                if (!participantDom || !participantExt) { showToast('Choisissez les deux participants', 'warning'); return; }
                const { error } = await supabaseAdmin.from('public_matchs_individuels').insert([{
                    tournoi_id: tournoiId, participant_domicile_id: participantDom, participant_exterieur_id: participantExt,
                    date_match: date, heure, statut, score_domicile: scoreDom, score_exterieur: scoreExt, live_url: liveUrl
                }]);
                if (error) throw error;
            }
            showToast('Match créé', 'success');
        }
        matchModal.classList.remove('active');
        chargerMatchs();
        if (statut === 'termine' && scoreDom !== null && scoreExt !== null) {
            await mettreAJourClassement(tournoiId, type, null, null, scoreDom, scoreExt);
        }
    } catch (err) { showToast('Erreur sauvegarde', 'error'); } finally { hideLoader(); }
});

// ========== GESTION DES ACTIONS (AVEC STATS AVANCÉES) ==========
const actionsModal = document.getElementById('actionsModal');
const actionsMatchInfo = document.getElementById('actionsMatchInfo');
const actionsList = document.getElementById('actionsList');
const actionType = document.getElementById('actionType');
const actionMinute = document.getElementById('actionMinute');
const actionEquipe = document.getElementById('actionEquipe');
const actionJoueur = document.getElementById('actionJoueur');
const actionValeur = document.getElementById('actionValeur');
const actionPeriode = document.getElementById('actionPeriode');
const actionTexteLibre = document.getElementById('actionTexteLibre');
const addActionBtn = document.getElementById('addActionBtn');
const closeActionsBtn = document.getElementById('closeActionsBtn');
const editStatsBtn = document.getElementById('editStatsBtn');
let currentActionsMatchId = null;
let currentActionsMatchType = null;

async function openActionsModal(matchId, type) {
    currentActionsMatchId = matchId;
    currentActionsMatchType = type;
    showLoader();
    try {
        let match, participantsMap = {};
        if (type === 'collectif') {
            const { data, error } = await supabaseAdmin
                .from('public_matchs')
                .select('*, equipe_domicile:equipe_domicile_id (id, nom_equipe), equipe_exterieur:equipe_exterieur_id (id, nom_equipe)')
                .eq('id', matchId).single();
            if (error) throw error;
            match = data;
            participantsMap[match.equipe_domicile.id] = match.equipe_domicile.nom_equipe;
            participantsMap[match.equipe_exterieur.id] = match.equipe_exterieur.nom_equipe;
        } else {
            const { data, error } = await supabaseAdmin
                .from('public_matchs_individuels')
                .select('*, participant_domicile:participant_domicile_id (id, nom_complet), participant_exterieur:participant_exterieur_id (id, nom_complet)')
                .eq('id', matchId).single();
            if (error) throw error;
            match = data;
            participantsMap[match.participant_domicile.id] = match.participant_domicile.nom_complet;
            participantsMap[match.participant_exterieur.id] = match.participant_exterieur.nom_complet;
        }
        actionsMatchInfo.innerHTML = `<p><strong>${match.equipe_domicile?.nom_equipe || match.participant_domicile?.nom_complet} vs ${match.equipe_exterieur?.nom_equipe || match.participant_exterieur?.nom_complet}</strong><br>Score: ${match.score_domicile !== null ? match.score_domicile : '-'} - ${match.score_exterieur !== null ? match.score_exterieur : '-'}</p>`;
        await chargerActions(matchId);
        actionEquipe.innerHTML = '<option value="">-- Choisir --</option>';
        for (const [id, nom] of Object.entries(participantsMap)) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = nom;
            actionEquipe.appendChild(opt);
        }
        actionType.value = 'but';
        actionMinute.value = '';
        actionValeur.value = '';
        actionPeriode.value = '';
        actionTexteLibre.value = '';
        actionJoueur.innerHTML = '<option value="">-- Aucun joueur --</option>';
        actionsModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement', 'error'); } finally { hideLoader(); }
}
async function chargerActions(matchId) {
    const { data, error } = await supabaseAdmin
        .from('public_actions_match')
        .select('*, joueur:joueur_id (nom, prenom), equipe:equipe_id (nom_equipe)')
        .eq('match_id', matchId)
        .order('minute', { ascending: true });
    if (error) { showToast('Erreur chargement actions', 'error'); return; }
    if (!data.length) { actionsList.innerHTML = '<p>Aucune action.</p>'; return; }
    let html = '';
    for (const a of data) {
        const joueurNom = a.joueur ? `${a.joueur.prenom} ${a.joueur.nom}` : '?';
        const equipeNom = a.equipe?.nom_equipe || '?';
        let details = '';
        if (a.valeur) details += ` [${a.valeur}]`;
        if (a.periode) details += ` (${a.periode})`;
        if (a.texte_libre) details += ` - ${escapeHtml(a.texte_libre)}`;
        html += `
            <div class="action-item" data-id="${a.id}">
                <span>${a.minute}' - ${escapeHtml(equipeNom)} : ${escapeHtml(joueurNom)} - ${escapeHtml(a.type_action)}${details}</span>
                <button class="delete-action" data-id="${a.id}">✖</button>
            </div>
        `;
    }
    actionsList.innerHTML = html;
    document.querySelectorAll('.delete-action').forEach(btn => btn.addEventListener('click', () => deleteAction(btn.dataset.id, matchId)));
}
async function deleteAction(actionId, matchId) {
    if (!confirm('Supprimer cette action ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_actions_match').delete().eq('id', actionId);
        if (error) throw error;
        showToast('Action supprimée', 'success');
        await chargerActions(matchId);
    } catch (err) { showToast('Erreur', 'error'); } finally { hideLoader(); }
}
actionEquipe.addEventListener('change', async () => {
    const equipeId = actionEquipe.value;
    if (!equipeId) { actionJoueur.innerHTML = '<option value="">-- Aucun joueur --</option>'; return; }
    const { data, error } = await supabaseAdmin
        .from('public_sportifs_equipe')
        .select('id, nom, prenom')
        .eq('equipe_id', equipeId);
    if (error) { actionJoueur.innerHTML = '<option value="">-- Aucun joueur --</option>'; return; }
    let html = '<option value="">-- Choisir un joueur --</option>';
    for (const s of data) {
        html += `<option value="${s.id}">${escapeHtml(s.prenom)} ${escapeHtml(s.nom)}</option>`;
    }
    actionJoueur.innerHTML = html;
});
addActionBtn.addEventListener('click', async () => {
    const type = actionType.value;
    const minute = parseInt(actionMinute.value);
    const equipeId = actionEquipe.value;
    const joueurId = actionJoueur.value || null;
    const valeur = actionValeur.value ? parseInt(actionValeur.value) : null;
    const periode = actionPeriode.value || null;
    const texteLibre = actionTexteLibre.value || null;
    if (!type || !minute || !equipeId) { showToast('Type, minute et équipe requis', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_actions_match').insert([{
            match_id: currentActionsMatchId,
            type_action: type,
            minute: minute,
            equipe_id: equipeId,
            joueur_id: joueurId,
            valeur: valeur,
            periode: periode,
            texte_libre: texteLibre,
            created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        showToast('Action ajoutée', 'success');
        await chargerActions(currentActionsMatchId);
        actionMinute.value = '';
        actionValeur.value = '';
        actionPeriode.value = '';
        actionTexteLibre.value = '';
        actionEquipe.value = '';
        actionJoueur.innerHTML = '<option value="">-- Aucun joueur --</option>';
    } catch (err) { showToast('Erreur ajout', 'error'); } finally { hideLoader(); }
});

// ========== STATISTIQUES AVANCÉES (public_stats_match) ==========
const statsModal = document.getElementById('statsModal');
const statsMatchInfo = document.getElementById('statsMatchInfo');
const statsPossessionDom = document.getElementById('statsPossessionDom');
const statsPossessionExt = document.getElementById('statsPossessionExt');
const statsTirsDom = document.getElementById('statsTirsDom');
const statsTirsExt = document.getElementById('statsTirsExt');
const statsTirsCadresDom = document.getElementById('statsTirsCadresDom');
const statsTirsCadresExt = document.getElementById('statsTirsCadresExt');
const statsFautesDom = document.getElementById('statsFautesDom');
const statsFautesExt = document.getElementById('statsFautesExt');
const statsCornersDom = document.getElementById('statsCornersDom');
const statsCornersExt = document.getElementById('statsCornersExt');
const saveStatsBtn = document.getElementById('saveStatsBtn');

editStatsBtn.addEventListener('click', async () => {
    if (!currentActionsMatchId) return;
    showLoader();
    try {
        // Récupérer les stats existantes
        const { data, error } = await supabaseAdmin
            .from('public_stats_match')
            .select('*')
            .eq('match_id', currentActionsMatchId)
            .maybeSingle();
        if (error) throw error;
        if (data) {
            statsPossessionDom.value = data.possession_domicile || '';
            statsPossessionExt.value = data.possession_exterieur || '';
            statsTirsDom.value = data.tirs_domicile || '';
            statsTirsExt.value = data.tirs_exterieur || '';
            statsTirsCadresDom.value = data.tirs_cadres_domicile || '';
            statsTirsCadresExt.value = data.tirs_cadres_exterieur || '';
            statsFautesDom.value = data.fautes_domicile || '';
            statsFautesExt.value = data.fautes_exterieur || '';
            statsCornersDom.value = data.corners_domicile || '';
            statsCornersExt.value = data.corners_exterieur || '';
        } else {
            statsPossessionDom.value = '';
            statsPossessionExt.value = '';
            statsTirsDom.value = '';
            statsTirsExt.value = '';
            statsTirsCadresDom.value = '';
            statsTirsCadresExt.value = '';
            statsFautesDom.value = '';
            statsFautesExt.value = '';
            statsCornersDom.value = '';
            statsCornersExt.value = '';
        }
        // Afficher les noms des équipes dans l'en-tête
        let matchInfo = '';
        if (currentActionsMatchType === 'collectif') {
            const { data: m } = await supabaseAdmin
                .from('public_matchs')
                .select('equipe_domicile:equipe_domicile_id (nom_equipe), equipe_exterieur:equipe_exterieur_id (nom_equipe)')
                .eq('id', currentActionsMatchId).single();
            if (m) matchInfo = `${m.equipe_domicile?.nom_equipe} vs ${m.equipe_exterieur?.nom_equipe}`;
        } else {
            const { data: m } = await supabaseAdmin
                .from('public_matchs_individuels')
                .select('participant_domicile:participant_domicile_id (nom_complet), participant_exterieur:participant_exterieur_id (nom_complet)')
                .eq('id', currentActionsMatchId).single();
            if (m) matchInfo = `${m.participant_domicile?.nom_complet} vs ${m.participant_exterieur?.nom_complet}`;
        }
        statsMatchInfo.innerHTML = `<p><strong>${matchInfo}</strong></p>`;
        statsModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement stats', 'error'); } finally { hideLoader(); }
});
saveStatsBtn.addEventListener('click', async () => {
    const data = {
        match_id: currentActionsMatchId,
        possession_domicile: statsPossessionDom.value ? parseInt(statsPossessionDom.value) : null,
        possession_exterieur: statsPossessionExt.value ? parseInt(statsPossessionExt.value) : null,
        tirs_domicile: statsTirsDom.value ? parseInt(statsTirsDom.value) : null,
        tirs_exterieur: statsTirsExt.value ? parseInt(statsTirsExt.value) : null,
        tirs_cadres_domicile: statsTirsCadresDom.value ? parseInt(statsTirsCadresDom.value) : null,
        tirs_cadres_exterieur: statsTirsCadresExt.value ? parseInt(statsTirsCadresExt.value) : null,
        fautes_domicile: statsFautesDom.value ? parseInt(statsFautesDom.value) : null,
        fautes_exterieur: statsFautesExt.value ? parseInt(statsFautesExt.value) : null,
        corners_domicile: statsCornersDom.value ? parseInt(statsCornersDom.value) : null,
        corners_exterieur: statsCornersExt.value ? parseInt(statsCornersExt.value) : null,
        updated_at: new Date().toISOString()
    };
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_stats_match')
            .upsert(data, { onConflict: 'match_id' });
        if (error) throw error;
        showToast('Statistiques enregistrées', 'success');
        statsModal.classList.remove('active');
    } catch (err) { showToast('Erreur sauvegarde stats', 'error'); } finally { hideLoader(); }
});
closeActionsBtn.addEventListener('click', () => { actionsModal.classList.remove('active'); });

// ========== MISE À JOUR DU CLASSEMENT ==========
async function mettreAJourClassement(tournoiId, type, equipeId1, equipeId2, score1, score2) {
    if (type === 'collectif') {
        await updateEquipeStats(tournoiId, equipeId1, score1, score2);
        await updateEquipeStats(tournoiId, equipeId2, score2, score1);
    } else {
        showToast('Mise à jour classement individuel à faire', 'info');
    }
    showToast('Classement mis à jour', 'success');
}
async function updateEquipeStats(tournoiId, equipeId, butsPour, butsContre) {
    let { data: classement, error } = await supabaseAdmin
        .from('public_classements')
        .select('*')
        .eq('tournoi_id', tournoiId)
        .eq('equipe_id', equipeId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!classement) {
        const { error: insertErr } = await supabaseAdmin.from('public_classements').insert([{
            tournoi_id: tournoiId, equipe_id: equipeId, points: 0, matchs_joues: 0, victoires: 0, nuls: 0, defaites: 0, buts_pour: 0, buts_contre: 0, difference_buts: 0
        }]);
        if (insertErr) throw insertErr;
        const { data: newData } = await supabaseAdmin.from('public_classements').select('*').eq('tournoi_id', tournoiId).eq('equipe_id', equipeId).single();
        classement = newData;
    }
    const matchsJoues = classement.matchs_joues + 1;
    const butsPourTotal = classement.buts_pour + butsPour;
    const butsContreTotal = classement.buts_contre + butsContre;
    const diff = butsPourTotal - butsContreTotal;
    let victoires = classement.victoires, nuls = classement.nuls, defaites = classement.defaites, points = classement.points;
    if (butsPour > butsContre) { victoires++; points += 3; }
    else if (butsPour === butsContre) { nuls++; points += 1; }
    else { defaites++; }
    const { error: updateErr } = await supabaseAdmin
        .from('public_classements')
        .update({ matchs_joues: matchsJoues, victoires, nuls, defaites, points, buts_pour: butsPourTotal, buts_contre: butsContreTotal, difference_buts: diff, updated_at: new Date().toISOString() })
        .eq('id', classement.id);
    if (updateErr) throw updateErr;
}

// ========== FILTRES & INIT ==========
refreshMatchsBtn.addEventListener('click', () => chargerMatchs());
tournoiFilter.addEventListener('change', () => chargerMatchs());
typeTournoiFilter.addEventListener('change', () => chargerMatchs());

// Fermeture modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        matchModal.classList.remove('active');
        actionsModal.classList.remove('active');
        statsModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === matchModal) matchModal.classList.remove('active');
    if (e.target === actionsModal) actionsModal.classList.remove('active');
    if (e.target === statsModal) statsModal.classList.remove('active');
});

// Menu mobile
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

// Initialisation
async function init() {
    await chargerTournois();
    await chargerEquipes();
    await chargerParticipants();
    // Peupler le filtre tournoi
    tournoiFilter.innerHTML = '<option value="all">-- Tous les tournois --</option>';
    for (const t of allTournois) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.titre;
        tournoiFilter.appendChild(opt);
    }
    await chargerMatchs();
}
init();