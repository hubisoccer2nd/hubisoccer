/* ============================================================
   HubISoccer — foot-profile.js
   Édition du profil Footballeur
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser = null;
let footballeurProfile = null;
const countriesList = []; // sera rempli
// Fin état global

// Début fonctions utilitaires
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function showToast(message, type = 'info', duration = 8000) {
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

// Début vérification session
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) { window.location.href = '../../authprive/users/login.html'; return null; }
    currentUser = session.user;
    return currentUser;
}
// Fin vérification session

// Début chargement profil
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) { showToast('Erreur chargement profil', 'error'); return null; }
    footballeurProfile = data;
    if (footballeurProfile.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    populateForm();
    updateDeletionUI();
    updateCertificationUI();
    return footballeurProfile;
}
// Fin chargement profil

// Début peuplement formulaire
function populateForm() {
    const p = footballeurProfile;
    document.getElementById('full_name').value = p.full_name || '';
    document.getElementById('pseudo').value = p.pseudo || '';
    document.getElementById('bio').value = p.bio || '';
    document.getElementById('city').value = p.city || '';
    document.getElementById('mobility_radius').value = p.mobility_radius || 0;
    document.getElementById('current_status').value = p.current_status || '';
    document.getElementById('discipline').value = p.discipline || 'Football';
    document.getElementById('current_level').value = p.current_level || '';
    document.getElementById('club').value = p.club || '';
    document.getElementById('palmares').value = p.palmares || '';
    document.getElementById('position').value = p.position || '';
    document.getElementById('specialty').value = p.specialty || '';
    document.getElementById('current_diploma').value = p.current_diploma || '';
    document.getElementById('school').value = p.school || '';
    document.getElementById('schedule_accommodation').checked = p.schedule_accommodation || false;
    document.getElementById('hard_skills').value = p.hard_skills || '';
    document.getElementById('study_project').value = p.study_project || '';
    document.getElementById('interest_sectors').value = p.interest_sectors || '';
    document.getElementById('professional_experiences').value = p.professional_experiences || '';
    document.getElementById('soft_skills').value = p.soft_skills || '';
    document.getElementById('availability').value = p.availability || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('birth_date').value = p.birth_date || '';
    document.getElementById('height').value = p.height || '';
    document.getElementById('weight').value = p.weight || '';
    document.getElementById('preferred_foot').value = p.preferred_foot || '';
    document.getElementById('nationality').value = p.nationality || '';
    document.getElementById('country').value = p.country || '';
}
// Fin peuplement formulaire

// Début sauvegarde profil
async function saveProfile(e) {
    e.preventDefault();
    showLoader();
    const updates = {
        full_name: document.getElementById('full_name').value,
        pseudo: document.getElementById('pseudo').value,
        bio: document.getElementById('bio').value,
        city: document.getElementById('city').value,
        mobility_radius: parseInt(document.getElementById('mobility_radius').value) || 0,
        current_status: document.getElementById('current_status').value,
        discipline: document.getElementById('discipline').value,
        current_level: document.getElementById('current_level').value,
        club: document.getElementById('club').value,
        palmares: document.getElementById('palmares').value,
        position: document.getElementById('position').value,
        specialty: document.getElementById('specialty').value,
        current_diploma: document.getElementById('current_diploma').value,
        school: document.getElementById('school').value,
        schedule_accommodation: document.getElementById('schedule_accommodation').checked,
        hard_skills: document.getElementById('hard_skills').value,
        study_project: document.getElementById('study_project').value,
        interest_sectors: document.getElementById('interest_sectors').value,
        professional_experiences: document.getElementById('professional_experiences').value,
        soft_skills: document.getElementById('soft_skills').value,
        availability: document.getElementById('availability').value,
        phone: document.getElementById('phone').value,
        birth_date: document.getElementById('birth_date').value,
        height: parseInt(document.getElementById('height').value) || null,
        weight: parseInt(document.getElementById('weight').value) || null,
        preferred_foot: document.getElementById('preferred_foot').value,
        nationality: document.getElementById('nationality').value,
        country: document.getElementById('country').value
    };
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update(updates)
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    hideLoader();
    if (error) { showToast('Erreur sauvegarde: ' + error.message, 'error'); } 
    else { showToast('Profil mis à jour avec succès ✅', 'success'); }
}
// Fin sauvegarde profil

// Début demande suppression
async function requestDeletion() {
    const reason = document.getElementById('deletionReason').value;
    if (!reason.trim()) { showToast('Veuillez indiquer une raison', 'warning'); return; }
    showLoader();
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update({
            deletion_requested: true,
            deletion_reason: reason,
            deletion_requested_at: new Date().toISOString(),
            deletion_revoked: false
        })
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    hideLoader();
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else {
        showToast('Demande de suppression enregistrée. Vous avez 48h pour annuler.', 'success');
        document.getElementById('deleteModal').style.display = 'none';
        footballeurProfile.deletion_requested = true;
        footballeurProfile.deletion_requested_at = new Date().toISOString();
        updateDeletionUI();
    }
}
// Fin demande suppression

// Début révocation suppression
async function revokeDeletion() {
    showLoader();
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update({
            deletion_revoked: true,
            deletion_requested: false
        })
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    hideLoader();
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else {
        showToast('Suppression annulée', 'success');
        footballeurProfile.deletion_requested = false;
        footballeurProfile.deletion_revoked = true;
        updateDeletionUI();
    }
}
// Fin révocation suppression

// Début mise à jour UI suppression
function updateDeletionUI() {
    const delBtn = document.getElementById('deleteAccountBtn');
    const revokeBtn = document.getElementById('revokeDeletionBtn');
    const status = document.getElementById('deletionStatus');
    if (footballeurProfile.deletion_requested && !footballeurProfile.deletion_revoked) {
        delBtn.style.display = 'none';
        revokeBtn.style.display = 'inline-flex';
        const reqDate = new Date(footballeurProfile.deletion_requested_at);
        const limitDate = new Date(reqDate.getTime() + 48*60*60*1000);
        status.textContent = `Demande en cours. Vous avez jusqu'au ${limitDate.toLocaleString()} pour révoquer.`;
    } else {
        delBtn.style.display = 'inline-flex';
        revokeBtn.style.display = 'none';
        status.textContent = '';
    }
}
// Fin mise à jour UI suppression

// Début certification UI
function updateCertificationUI() {
    const certStatus = document.getElementById('certificationStatus');
    if (footballeurProfile.certified) {
        certStatus.style.display = 'block';
        document.getElementById('certifyBtn').style.display = 'none';
    } else {
        certStatus.style.display = 'none';
        document.getElementById('certifyBtn').style.display = 'inline-flex';
    }
}
// Fin certification UI

// Début initialisation
async function init() {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!footballeurProfile) return;

    // Remplir listes pays
    const countrySelect = document.getElementById('country');
    const nationalitySelect = document.getElementById('nationality');
    const countries = [
        { code: 'BJ', name: 'Bénin' }, { code: 'FR', name: 'France' }, { code: 'CI', name: 'Côte d\'Ivoire' },
        { code: 'SN', name: 'Sénégal' }, { code: 'TG', name: 'Togo' }, { code: 'NG', name: 'Nigéria' },
        { code: 'GH', name: 'Ghana' }, { code: 'CM', name: 'Cameroun' }, { code: 'ZA', name: 'Afrique du Sud' },
        { code: 'US', name: 'États-Unis' }, { code: 'GB', name: 'Royaume-Uni' }, { code: 'DE', name: 'Allemagne' },
        { code: 'ES', name: 'Espagne' }, { code: 'IT', name: 'Italie' }, { code: 'PT', name: 'Portugal' },
        { code: 'BR', name: 'Brésil' }, { code: 'AR', name: 'Argentine' }, { code: 'CA', name: 'Canada' },
        { code: 'BE', name: 'Belgique' }, { code: 'CH', name: 'Suisse' }
    ]; // Liste simplifiée, peut être étendue
    countries.sort((a,b)=>a.name.localeCompare(b.name)).forEach(c => {
        countrySelect.add(new Option(c.name, c.code));
        nationalitySelect.add(new Option(c.name, c.code));
    });
    if (footballeurProfile.country) countrySelect.value = footballeurProfile.country;
    if (footballeurProfile.nationality) nationalitySelect.value = footballeurProfile.nationality;

    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').style.display = 'flex';
    });
    document.getElementById('closeDeleteModal').addEventListener('click', () => {
        document.getElementById('deleteModal').style.display = 'none';
    });
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').style.display = 'none';
    });
    document.getElementById('confirmDeleteBtn').addEventListener('click', requestDeletion);
    document.getElementById('revokeDeletionBtn').addEventListener('click', revokeDeletion);
    document.getElementById('certifyBtn').addEventListener('click', () => {
        showToast('La certification sera disponible prochainement avec paiement en ligne.', 'info');
    });
}
// Fin initialisation

document.addEventListener('DOMContentLoaded', init);
