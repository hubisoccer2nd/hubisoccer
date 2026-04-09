/* ============================================================
   HubISoccer — foot-settings.js
   Paramètres Footballeur
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
    populateSettings();
    updateDeletionUI();
    return footballeurProfile;
}
// Fin chargement profil

// Début peuplement paramètres
function populateSettings() {
    const p = footballeurProfile;
    // Notifications (stocker dans user metadata ou table séparée - pour l'exemple, on utilise des champs fictifs)
    document.getElementById('summary_frequency').value = p.summary_frequency || 'instant';
    document.getElementById('profile_visibility').value = p.profile_visibility || 'public';
    document.getElementById('show_age').checked = p.show_age !== false;
    document.getElementById('show_location').checked = p.show_location !== false;
    document.getElementById('show_club').checked = p.show_club !== false;
    document.getElementById('allow_cv_download').checked = p.allow_cv_download !== false;
    document.getElementById('blocked_users').value = p.blocked_users || '';
    document.getElementById('interface_language').value = p.interface_language || 'fr';
    document.getElementById('high_contrast').checked = p.high_contrast || false;
    document.getElementById('font_size').value = p.font_size || 'normal';
}
// Fin peuplement paramètres

// Début sauvegarde paramètres
async function saveSettings(e) {
    e.preventDefault();
    showLoader();
    const updates = {
        summary_frequency: document.getElementById('summary_frequency').value,
        profile_visibility: document.getElementById('profile_visibility').value,
        show_age: document.getElementById('show_age').checked,
        show_location: document.getElementById('show_location').checked,
        show_club: document.getElementById('show_club').checked,
        allow_cv_download: document.getElementById('allow_cv_download').checked,
        blocked_users: document.getElementById('blocked_users').value,
        interface_language: document.getElementById('interface_language').value,
        high_contrast: document.getElementById('high_contrast').checked,
        font_size: document.getElementById('font_size').value,
    };
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update(updates)
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    hideLoader();
    if (error) { showToast('Erreur sauvegarde: ' + error.message, 'error'); } 
    else { showToast('Paramètres enregistrés ✅', 'success'); }
}
// Fin sauvegarde paramètres

// Début mise à jour email
async function updateEmail() {
    const newEmail = document.getElementById('new_email').value;
    const password = document.getElementById('email_password').value;
    if (!newEmail || !password) { showToast('Veuillez remplir tous les champs', 'warning'); return; }
    showLoader();
    const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
    hideLoader();
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Email mis à jour. Vérifiez votre boîte de réception.', 'success'); }
}
// Fin mise à jour email

// Début mise à jour mot de passe
async function updatePassword() {
    const current = document.getElementById('current_password').value;
    const newPass = document.getElementById('new_password').value;
    const confirm = document.getElementById('confirm_password').value;
    if (!current || !newPass || !confirm) { showToast('Tous les champs sont requis', 'warning'); return; }
    if (newPass !== confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return; }
    showLoader();
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    hideLoader();
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else { showToast('Mot de passe mis à jour ✅', 'success'); }
}
// Fin mise à jour mot de passe

// Début suppression compte (identique à foot-profile)
async function requestDeletion() {
    // Utilisation de la modale de confirmation ou redirection vers foot-profile ?
    // Pour simplifier, rediriger vers foot-profile.html qui gère déjà la suppression.
    window.location.href = '../profile-edit/foot-profile.html';
}
// Fin suppression compte

// Début UI suppression
function updateDeletionUI() {
    const delBtn = document.getElementById('deleteAccountBtn');
    const revokeBtn = document.getElementById('revokeDeletionBtn');
    const status = document.getElementById('deletionStatus');
    if (footballeurProfile.deletion_requested && !footballeurProfile.deletion_revoked) {
        if(delBtn) delBtn.style.display = 'none';
        if(revokeBtn) revokeBtn.style.display = 'inline-flex';
        const reqDate = new Date(footballeurProfile.deletion_requested_at);
        const limitDate = new Date(reqDate.getTime() + 48*60*60*1000);
        if(status) status.textContent = `Demande en cours. Vous avez jusqu'au ${limitDate.toLocaleString()} pour révoquer.`;
    } else {
        if(delBtn) delBtn.style.display = 'inline-flex';
        if(revokeBtn) revokeBtn.style.display = 'none';
        if(status) status.textContent = '';
    }
}
// Fin UI suppression

// Début révocation suppression
async function revokeDeletion() {
    showLoader();
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update({ deletion_revoked: true, deletion_requested: false })
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    hideLoader();
    if (error) { showToast('Erreur: ' + error.message, 'error'); }
    else {
        showToast('Suppression annulée', 'success');
        footballeurProfile.deletion_requested = false;
        updateDeletionUI();
    }
}
// Fin révocation suppression

// Début initialisation
async function init() {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!footballeurProfile) return;

    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('updateEmailBtn')?.addEventListener('click', updateEmail);
    document.getElementById('updatePasswordBtn')?.addEventListener('click', updatePassword);
    document.getElementById('updatePhoneBtn')?.addEventListener('click', () => {
        const phone = document.getElementById('secondary_phone').value;
        // Logique similaire à updateEmail mais pour phone (à implémenter si colonne existe)
        showToast('Fonctionnalité à venir', 'info');
    });
    document.getElementById('deleteAccountBtn')?.addEventListener('click', requestDeletion);
    document.getElementById('revokeDeletionBtn')?.addEventListener('click', revokeDeletion);
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        const dataStr = JSON.stringify(footballeurProfile, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `hubisoccer_${footballeurProfile.hubisoccer_id}.json`; a.click();
        URL.revokeObjectURL(url);
        showToast('Export généré', 'success');
    });
}
// Fin initialisation

document.addEventListener('DOMContentLoaded', init);
