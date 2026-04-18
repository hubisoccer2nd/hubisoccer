/* ============================================================
   HubISoccer — admin-foot-dash.js
   Administration Dashboard Footballeur
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentAdmin = null;
let currentFootballeurId = null;
let allFootballeurs = [];
// Fin état global

// Début fonctions utilitaires
function showToast(message, type = 'info', duration = 30000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}
// Fin fonctions utilitaires

// Début vérification admin (accepte ADMIN ou FOOT_ADMIN)
async function checkAdmin() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) { window.location.href = '../../../authprive/users/login.html'; return false; }
    const { data: profile, error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('role_code, full_name, display_name')
        .eq('auth_uuid', user.id)
        .single();
    if (profileError || !profile) { window.location.href = '../../../authprive/users/login.html'; return false; }
    if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
        showToast('Accès réservé aux administrateurs footballeurs', 'error', 30000);
        setTimeout(() => window.location.href = '../../../authprive/users/login.html', 3000);
        return false;
    }
    currentAdmin = profile;
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
    return true;
}
// Fin vérification admin

// Début chargement liste footballeurs
async function loadFootballeurs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterClub = document.getElementById('filterClub').value;

    let query = supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, pseudo, position, club, avatar_url, email')
        .eq('role_code', 'FOOT')
        .order('full_name');

    if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,hubisoccer_id.ilike.%${searchTerm}%`);
    }
    if (filterClub) {
        query = query.eq('club', filterClub);
    }

    const { data, error } = await query;
    if (error) { showToast('Erreur chargement footballeurs', 'error', 30000); return; }
    allFootballeurs = data || [];
    renderFootballeursList(allFootballeurs);
    updateClubsFilter(allFootballeurs);
}
// Fin chargement liste footballeurs

// Début rendu liste
function renderFootballeursList(footballeurs) {
    const container = document.getElementById('footballeursListContainer');
    container.innerHTML = footballeurs.map(f => `
        <div class="footballeur-item ${f.hubisoccer_id === currentFootballeurId ? 'selected' : ''}" data-id="${f.hubisoccer_id}">
            <img src="${f.avatar_url || '../../../img/user-default.jpg'}" class="footballeur-avatar">
            <div class="footballeur-info">
                <div class="footballeur-name">${f.full_name || 'Sans nom'}</div>
                <div class="footballeur-detail">${f.position || 'Poste ?'} | ${f.club || 'Club ?'}</div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.footballeur-item').forEach(item => {
        item.addEventListener('click', () => selectFootballeur(item.dataset.id));
    });
}
// Fin rendu liste

// Début filtre clubs
function updateClubsFilter(footballeurs) {
    const clubs = [...new Set(footballeurs.map(f => f.club).filter(c => c))];
    const select = document.getElementById('filterClub');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Tous les clubs</option>' + 
        clubs.map(c => `<option value="${c}">${c}</option>`).join('');
    if (currentValue) select.value = currentValue;
}
// Fin filtre clubs

// Début sélection footballeur
async function selectFootballeur(hubisoccerId) {
    currentFootballeurId = hubisoccerId;
    renderFootballeursList(allFootballeurs);

    const [profileRes, scoutingRes] = await Promise.all([
        supabaseClient.from('supabaseAuthPrive_profiles').select('*').eq('hubisoccer_id', hubisoccerId).single(),
        supabaseClient.from('supabaseAuthPrive_footballeur_scouting').select('*').eq('footballeur_hubisoccer_id', hubisoccerId).maybeSingle()
    ]);

    if (profileRes.error) { showToast('Erreur chargement profil', 'error', 30000); return; }
    const profile = profileRes.data;
    let scouting = scoutingRes.data;
    if (!scouting) {
        const { data: newScouting, error: insertError } = await supabaseClient
            .from('supabaseAuthPrive_footballeur_scouting')
            .insert([{ footballeur_hubisoccer_id: hubisoccerId }])
            .select().single();
        if (insertError) { showToast('Erreur création scouting', 'error', 30000); return; }
        scouting = newScouting;
    }

    fillForm(profile, scouting);
    document.getElementById('footballeurForm').style.display = 'block';
    document.getElementById('noSelectionMessage').style.display = 'none';
    document.getElementById('editTitle').textContent = `Modifier ${profile.full_name || 'footballeur'}`;
}
// Fin sélection footballeur

// Début remplissage formulaire
function fillForm(profile, scouting) {
    document.getElementById('footballeurHubisoccerId').value = profile.hubisoccer_id;
    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('pseudo').value = profile.pseudo || '';
    document.getElementById('position').value = profile.position || '';
    document.getElementById('height').value = profile.height || '';
    document.getElementById('weight').value = profile.weight || '';
    document.getElementById('nationality').value = profile.nationality || '';
    document.getElementById('preferredFoot').value = profile.preferred_foot || '';
    document.getElementById('club').value = profile.club || '';
    document.getElementById('age').value = profile.birth_date ? calculateAge(profile.birth_date) : '';
    document.getElementById('avatarUrl').value = profile.avatar_url || '';
    document.getElementById('profileCompletion').value = profile.profile_completion || 0;
    document.getElementById('scoutingViews').value = profile.scouting_views || 0;
    document.getElementById('recruiterFavs').value = profile.recruiter_favs || 0;

    document.getElementById('niveauActuel').value = scouting.niveau_actuel || 0;
    document.getElementById('potentiel').value = scouting.potentiel || 0;
    document.getElementById('personnalite').value = scouting.personnalite || 0;
    document.getElementById('valeurMarche').value = scouting.valeur_marche || 0;
    document.getElementById('pretInfo').value = scouting.pret_info || '';
    document.getElementById('salaire').value = scouting.salaire || 0;
    document.getElementById('expireLe').value = scouting.expire_le ? scouting.expire_le.slice(0,10) : '';
    document.getElementById('selectionJeunes').value = scouting.selection_jeunes || '';

    // Attributs techniques
    const techFields = ['technique_centres','technique_controle_balle','technique_corners','technique_coups_francs','technique_dribbles','technique_finition','technique_jeu_de_tete','technique_marquage','technique_passes','technique_penalty','technique_tactics','technique_technique','technique_tirs_de_loin','technique_touches_longues'];
    let techHtml = ''; techFields.forEach(f => { techHtml += `<div class="form-group"><label>${f.replace('technique_','')}</label><input type="number" name="${f}" value="${scouting[f] || 0}"></div>`; });
    document.getElementById('techniqueGrid').innerHTML = techHtml;

    const mentalFields = ['mental_agressivite','mental_anticipation','mental_appels_de_balle','mental_concentration','mental_courage','mental_decisions','mental_determination','mental_inspiration','mental_jeu_collectif','mental_leadership','mental_placement','mental_sang_froid','mental_vision_du_jeu','mental_volume_de_jeu'];
    let mentalHtml = ''; mentalFields.forEach(f => { mentalHtml += `<div class="form-group"><label>${f.replace('mental_','')}</label><input type="number" name="${f}" value="${scouting[f] || 0}"></div>`; });
    document.getElementById('mentalGrid').innerHTML = mentalHtml;

    const physiqueFields = ['physique_acceleration','physique_agilite','physique_detente_verticale','physique_endurance','physique_equilibre','physique_puissance','physique_qualites_physiques_nat','physique_vitesse'];
    let physiqueHtml = ''; physiqueFields.forEach(f => { physiqueHtml += `<div class="form-group"><label>${f.replace('physique_','')}</label><input type="number" name="${f}" value="${scouting[f] || 0}"></div>`; });
    document.getElementById('physiqueGrid').innerHTML = physiqueHtml;

    document.getElementById('rapportsRecruteurs').value = scouting.rapports_recruteurs || '';
}

function calculateAge(dateString) {
    if (!dateString) return '';
    const today = new Date(); const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}
// Fin remplissage formulaire

// Début sauvegarde
document.getElementById('footballeurForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hubisoccerId = document.getElementById('footballeurHubisoccerId').value;
    if (!hubisoccerId) return;

    const profileUpdates = {
        full_name: document.getElementById('fullName').value,
        pseudo: document.getElementById('pseudo').value,
        position: document.getElementById('position').value,
        height: parseInt(document.getElementById('height').value) || null,
        weight: parseInt(document.getElementById('weight').value) || null,
        nationality: document.getElementById('nationality').value,
        preferred_foot: document.getElementById('preferredFoot').value,
        club: document.getElementById('club').value,
        avatar_url: document.getElementById('avatarUrl').value || null,
        profile_completion: parseInt(document.getElementById('profileCompletion').value) || 0,
        scouting_views: parseInt(document.getElementById('scoutingViews').value) || 0,
        recruiter_favs: parseInt(document.getElementById('recruiterFavs').value) || 0
    };

    const { error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update(profileUpdates)
        .eq('hubisoccer_id', hubisoccerId);
    if (profileError) { showToast('Erreur profil: ' + profileError.message, 'error', 30000); return; }

    const scoutingUpdates = {
        niveau_actuel: parseInt(document.getElementById('niveauActuel').value) || 0,
        potentiel: parseInt(document.getElementById('potentiel').value) || 0,
        personnalite: parseInt(document.getElementById('personnalite').value) || 0,
        valeur_marche: parseInt(document.getElementById('valeurMarche').value) || 0,
        pret_info: document.getElementById('pretInfo').value,
        salaire: parseInt(document.getElementById('salaire').value) || 0,
        expire_le: document.getElementById('expireLe').value || null,
        selection_jeunes: document.getElementById('selectionJeunes').value,
        rapports_recruteurs: document.getElementById('rapportsRecruteurs').value
    };
    document.querySelectorAll('#techniqueGrid input, #mentalGrid input, #physiqueGrid input').forEach(input => {
        scoutingUpdates[input.name] = parseInt(input.value) || 0;
    });

    const { error: scoutingError } = await supabaseClient
        .from('supabaseAuthPrive_footballeur_scouting')
        .update(scoutingUpdates)
        .eq('footballeur_hubisoccer_id', hubisoccerId);
    if (scoutingError) { showToast('Erreur scouting: ' + scoutingError.message, 'error', 30000); return; }

    showToast('Données mises à jour avec succès', 'success', 30000);
    loadFootballeurs();
});
// Fin sauvegarde

// Début suppression
document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!currentFootballeurId) return;
    if (!confirm('Supprimer définitivement ce footballeur ?')) return;
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .delete()
        .eq('hubisoccer_id', currentFootballeurId);
    if (error) { showToast('Erreur suppression: ' + error.message, 'error', 30000); }
    else {
        showToast('Footballeur supprimé', 'success', 30000);
        currentFootballeurId = null;
        document.getElementById('footballeurForm').style.display = 'none';
        document.getElementById('noSelectionMessage').style.display = 'block';
        loadFootballeurs();
    }
});
// Fin suppression

// Début événements
document.getElementById('searchInput').addEventListener('input', loadFootballeurs);
document.getElementById('filterClub').addEventListener('change', loadFootballeurs);
document.getElementById('refreshBtn').addEventListener('click', loadFootballeurs);
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '../../../authprive/users/login.html';
});
// Fin événements

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    loadFootballeurs();
});
// Fin initialisation