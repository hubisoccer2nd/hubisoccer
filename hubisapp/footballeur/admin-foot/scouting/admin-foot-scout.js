/* ============================================================
   HubISoccer — admin-foot-scout.js
   Administration Scouting Footballeur
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
let radarChart = null;
// Fin état global

// Début fonctions utilitaires
function showToast(message, type = 'info', duration = 8000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close"><i class="fas fa-times"></i></div>
    `;
    container.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// Fin fonctions utilitaires

// Début vérification admin
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
        showToast('Accès réservé aux administrateurs footballeurs', 'error');
        setTimeout(() => window.location.href = '../../../authprive/users/login.html', 2000);
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
        .select('hubisoccer_id, full_name, position, club, avatar_url, email')
        .eq('role_code', 'FOOT')
        .order('full_name');
    if (searchTerm) query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,hubisoccer_id.ilike.%${searchTerm}%`);
    if (filterClub) query = query.eq('club', filterClub);
    const { data, error } = await query;
    if (error) { showToast('Erreur chargement footballeurs', 'error'); return; }
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
    select.innerHTML = '<option value="">Tous les clubs</option>' + clubs.map(c => `<option value="${c}">${c}</option>`).join('');
    if (currentValue) select.value = currentValue;
}
// Fin filtre clubs

// Début sélection footballeur
async function selectFootballeur(hubisoccerId) {
    currentFootballeurId = hubisoccerId;
    renderFootballeursList(allFootballeurs);
    showLoader();
    const [profileRes, scoutingRes] = await Promise.all([
        supabaseClient.from('supabaseAuthPrive_profiles').select('full_name, club').eq('hubisoccer_id', hubisoccerId).single(),
        supabaseClient.from('supabaseAuthPrive_footballeur_scouting').select('*').eq('footballeur_hubisoccer_id', hubisoccerId).maybeSingle()
    ]);
    hideLoader();
    if (profileRes.error) { showToast('Erreur chargement profil', 'error'); return; }
    const profile = profileRes.data;
    let scouting = scoutingRes.data;
    if (!scouting) {
        const { data: newScouting, error: insertError } = await supabaseClient
            .from('supabaseAuthPrive_footballeur_scouting')
            .insert([{ footballeur_hubisoccer_id: hubisoccerId }])
            .select().single();
        if (insertError) { showToast('Erreur création scouting', 'error'); return; }
        scouting = newScouting;
    }
    fillForm(profile, scouting);
    document.getElementById('scoutForm').style.display = 'block';
    document.getElementById('noSelectionMessage').style.display = 'none';
    document.getElementById('editTitle').textContent = `Édition : ${profile.full_name || 'Footballeur'}`;
}
// Fin sélection footballeur

// Début remplissage formulaire
function fillForm(profile, scouting) {
    document.getElementById('footballeurHubisoccerId').value = currentFootballeurId;
    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('clubActuel').value = scouting.club_actuel || profile.club || '';
    document.getElementById('poste').value = scouting.poste || '';
    document.getElementById('secondaryPositions').value = scouting.secondary_positions || '';
    document.getElementById('matchsJoues').value = scouting.matchs_joues || 0;
    document.getElementById('buts').value = scouting.buts || 0;
    document.getElementById('passesDecisives').value = scouting.passes_decisives || 0;
    document.getElementById('valeurMarche').value = scouting.valeur_marche || 0;
    document.getElementById('leftFootRating').value = scouting.left_foot_rating || 50;
    document.getElementById('rightFootRating').value = scouting.right_foot_rating || 50;
    document.getElementById('contractExpiry').value = scouting.contract_expiry || '';
    document.getElementById('nextEvaluation').value = scouting.next_evaluation || '';
    document.getElementById('strengths').value = scouting.strengths || '';
    document.getElementById('weaknesses').value = scouting.weaknesses || '';
    document.getElementById('rapportsRecruteurs').value = scouting.rapports_recruteurs || '';
    generateAttrGrids(scouting);
    updateRadarFromForm(); // mise à jour initiale du radar
}
// Fin remplissage formulaire

// Début génération grilles attributs
function generateAttrGrids(scouting) {
    const corpsFields = [
        'physique_vitesse','physique_acceleration','physique_endurance','physique_puissance',
        'physique_agilite','physique_equilibre','physique_detente_verticale','physique_qualites_physiques_nat'
    ];
    const ameFields = [
        'mental_agressivite','mental_anticipation','mental_appels_de_balle','mental_concentration',
        'mental_courage','mental_decisions','mental_determination','mental_inspiration',
        'mental_jeu_collectif','mental_leadership','mental_placement','mental_sang_froid',
        'mental_vision_du_jeu','mental_volume_de_jeu'
    ];
    const espritFields = [
        'technique_centres','technique_controle_balle','technique_corners','technique_coups_francs',
        'technique_dribbles','technique_finition','technique_jeu_de_tete','technique_marquage',
        'technique_passes','technique_penalty','technique_tactics','technique_technique',
        'technique_tirs_de_loin','technique_touches_longues'
    ];

    const formatLabel = (str) => str.replace(/^(physique|mental|technique)_/, '').replace(/_/g, ' ');

    document.getElementById('corpsGrid').innerHTML = corpsFields.map(f => 
        `<div class="form-group"><label>${formatLabel(f)}</label><input type="number" id="${f}" value="${scouting[f] || 0}" min="0" max="100" step="1"></div>`
    ).join('');
    document.getElementById('ameGrid').innerHTML = ameFields.map(f => 
        `<div class="form-group"><label>${formatLabel(f)}</label><input type="number" id="${f}" value="${scouting[f] || 0}" min="0" max="100" step="1"></div>`
    ).join('');
    document.getElementById('espritGrid').innerHTML = espritFields.map(f => 
        `<div class="form-group"><label>${formatLabel(f)}</label><input type="number" id="${f}" value="${scouting[f] || 0}" min="0" max="100" step="1"></div>`
    ).join('');

    document.querySelectorAll('#corpsGrid input, #ameGrid input, #espritGrid input').forEach(input => {
        input.addEventListener('input', updateRadarFromForm);
    });
}
// Fin génération grilles attributs

// Début mise à jour radar
function updateRadarFromForm() {
    const ctx = document.getElementById('adminRadar');
    if (!ctx) return;

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? (parseInt(el.value) || 0) : 0;
    };

    const physique = Math.round((
        getVal('physique_vitesse') + getVal('physique_acceleration') + getVal('physique_endurance') +
        getVal('physique_puissance') + getVal('physique_agilite') + getVal('physique_equilibre') +
        getVal('physique_detente_verticale') + getVal('physique_qualites_physiques_nat')
    ) / 8);
    const vitesse = Math.round((getVal('physique_vitesse') + getVal('physique_acceleration')) / 2);
    const aerien = Math.round((getVal('technique_jeu_de_tete') + getVal('physique_detente_verticale')) / 2);
    const mental = Math.round((
        getVal('mental_agressivite') + getVal('mental_anticipation') + getVal('mental_appels_de_balle') +
        getVal('mental_concentration') + getVal('mental_courage') + getVal('mental_decisions') +
        getVal('mental_determination') + getVal('mental_inspiration') + getVal('mental_jeu_collectif') +
        getVal('mental_leadership') + getVal('mental_placement') + getVal('mental_sang_froid') +
        getVal('mental_vision_du_jeu') + getVal('mental_volume_de_jeu')
    ) / 14);
    const vision = Math.round((getVal('mental_vision_du_jeu') + getVal('technique_passes') + getVal('technique_tactics')) / 3);
    const defense = Math.round((getVal('technique_marquage') + getVal('mental_agressivite') + getVal('mental_anticipation') + getVal('physique_puissance')) / 4);
    const technique = Math.round((
        getVal('technique_centres') + getVal('technique_controle_balle') + getVal('technique_corners') +
        getVal('technique_coups_francs') + getVal('technique_dribbles') + getVal('technique_finition') +
        getVal('technique_jeu_de_tete') + getVal('technique_marquage') + getVal('technique_passes') +
        getVal('technique_penalty') + getVal('technique_tactics') + getVal('technique_technique') +
        getVal('technique_tirs_de_loin') + getVal('technique_touches_longues')
    ) / 14);
    const attaque = Math.round((getVal('technique_finition') + getVal('technique_dribbles') + getVal('technique_tirs_de_loin')) / 3);

    if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Physique', 'Vitesse', 'Aérien', 'Mental', 'Vision', 'Défense', 'Technique', 'Attaque'],
            datasets: [{
                data: [physique, vitesse, aerien, mental, vision, defense, technique, attaque],
                backgroundColor: 'rgba(85,27,140,0.15)',
                borderColor: '#7e3db0',
                borderWidth: 2,
                pointBackgroundColor: ['#e74c3c','#e74c3c','#e74c3c','#3498db','#3498db','#3498db','#27ae60','#27ae60'],
                pointBorderColor: '#fff',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 20, color: '#4a4a6a', backdropColor: 'transparent', font: { size: 10 } },
                    grid: { color: '#d0ccd8' },
                    angleLines: { color: '#d0ccd8' },
                    pointLabels: { color: '#1a1a2e', font: { size: 10, family: 'Poppins', weight: '500' } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}
// Fin mise à jour radar

// Début sauvegarde
document.getElementById('scoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentFootballeurId) return;
    showLoader();
    const updates = {
        club_actuel: document.getElementById('clubActuel').value,
        poste: document.getElementById('poste').value,
        secondary_positions: document.getElementById('secondaryPositions').value,
        matchs_joues: parseInt(document.getElementById('matchsJoues').value) || 0,
        buts: parseInt(document.getElementById('buts').value) || 0,
        passes_decisives: parseInt(document.getElementById('passesDecisives').value) || 0,
        valeur_marche: parseInt(document.getElementById('valeurMarche').value) || 0,
        left_foot_rating: parseInt(document.getElementById('leftFootRating').value) || 50,
        right_foot_rating: parseInt(document.getElementById('rightFootRating').value) || 50,
        contract_expiry: document.getElementById('contractExpiry').value || null,
        next_evaluation: document.getElementById('nextEvaluation').value || null,
        strengths: document.getElementById('strengths').value,
        weaknesses: document.getElementById('weaknesses').value,
        rapports_recruteurs: document.getElementById('rapportsRecruteurs').value
    };
    document.querySelectorAll('#corpsGrid input, #ameGrid input, #espritGrid input').forEach(input => {
        updates[input.id] = parseInt(input.value) || 0;
    });
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_footballeur_scouting')
        .update(updates)
        .eq('footballeur_hubisoccer_id', currentFootballeurId);
    hideLoader();
    if (error) { showToast('Erreur sauvegarde: ' + error.message, 'error'); }
    else { showToast('Données scouting mises à jour', 'success'); }
});
// Fin sauvegarde

// Début initialisation onglets
function initTabs() {
    document.querySelectorAll('.attr-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.attr-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.attr-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.cat + '-panel').classList.add('active');
        });
    });
}
// Fin initialisation onglets

// Début événements
document.getElementById('searchInput').addEventListener('input', loadFootballeurs);
document.getElementById('filterClub').addEventListener('change', loadFootballeurs);
document.getElementById('refreshBtn').addEventListener('click', loadFootballeurs);
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '../../../authprive/users/login.html';
});
// Fin événements

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    initTabs();
    loadFootballeurs();
});
// Fin initialisation DOM
