/* ============================================================
   HubISoccer -- staff-settings.js
   Page Parametres - Espace Staff Medical
   Inspire de foot-settings.js -- sections Paiements et
   Suppression du compte retirees (la suppression vit deja dans
   Mon Profil, pas de doublon).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

const PROFILES_TABLE = 'supabaseAuthPrive_profiles';

/* ---------- 2. ETAT GLOBAL ---------- */
let currentUser  = null;
let staffProfile = null;

/* ---------- 3. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'flex'; } }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'none'; } }

/* ---------- 4. TOAST (duree 30 secondes) ---------- */
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
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
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

/* ---------- 5. SESSION ---------- */
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

/* ---------- 6. CHARGEMENT PROFIL ---------- */
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
    staffProfile = data;
    populateSettings();
    return staffProfile;
}

function populateSettings() {
    const p = staffProfile;
    setChecked('notif_email_talents', p.notif_email_talents);
    setChecked('notif_email_contrats', p.notif_email_contrats);
    setChecked('notif_email_messages', p.notif_email_messages);
    setChecked('notif_push', p.notif_push);
    setVal('summary_frequency', p.summary_frequency || 'instant');
    setVal('profile_visibility', p.profile_visibility || 'public');
    setChecked('show_age', p.show_age !== false);
    setChecked('show_location', p.show_location !== false);
    setChecked('allow_cv_download', p.allow_cv_download !== false);
    setVal('blocked_users', p.blocked_users || '');
    setVal('interface_language', p.interface_language || 'fr');
    setChecked('high_contrast', p.high_contrast === true);
    setVal('font_size', p.font_size || 'normal');
}

function setVal(id, value) { const el = document.getElementById(id); if (el) { el.value = value; } }
function setChecked(id, value) { const el = document.getElementById(id); if (el) { el.checked = value === true; } }

/* ---------- 7. SAUVEGARDE DES PARAMETRES ---------- */
async function saveSettings(e) {
    e.preventDefault();
    const updates = {
        notif_email_talents   : document.getElementById('notif_email_talents')?.checked === true,
        notif_email_contrats    : document.getElementById('notif_email_contrats')?.checked === true,
        notif_email_messages     : document.getElementById('notif_email_messages')?.checked === true,
        notif_push                 : document.getElementById('notif_push')?.checked === true,
        summary_frequency           : document.getElementById('summary_frequency')?.value || 'instant',
        profile_visibility            : document.getElementById('profile_visibility')?.value || 'public',
        show_age                        : document.getElementById('show_age')?.checked === true,
        show_location                     : document.getElementById('show_location')?.checked === true,
        allow_cv_download                   : document.getElementById('allow_cv_download')?.checked === true,
        blocked_users                         : (document.getElementById('blocked_users')?.value || '').trim() || null,
        interface_language                      : document.getElementById('interface_language')?.value || 'fr',
        high_contrast                             : document.getElementById('high_contrast')?.checked === true,
        font_size                                   : document.getElementById('font_size')?.value || 'normal'
    };

    showLoader();
    const { error } = await supabaseClient
        .from(PROFILES_TABLE)
        .update(updates)
        .eq('hubisoccer_id', staffProfile.hubisoccer_id);
    hideLoader();

    if (error) { showToast('Erreur sauvegarde : ' + error.message, 'error'); }
    else { showToast('Paramètres enregistrés. ✅', 'success'); Object.assign(staffProfile, updates); }
}

/* ---------- 8. MISE A JOUR EMAIL ---------- */
async function updateEmail() {
    const newEmail = (document.getElementById('new_email')?.value || '').trim();
    const password = document.getElementById('email_password')?.value || '';
    if (!newEmail || !password) { showToast('Veuillez remplir tous les champs.', 'warning'); return; }

    showLoader();
    const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); }
    else { showToast('Email mis à jour. Vérifiez votre boîte de réception.', 'success'); }
}

/* ---------- 9. MISE A JOUR MOT DE PASSE ---------- */
async function updatePassword() {
    const current = document.getElementById('current_password')?.value || '';
    const newPass = document.getElementById('new_password')?.value || '';
    const confirmPass = document.getElementById('confirm_password')?.value || '';

    if (!current || !newPass || !confirmPass) { showToast('Tous les champs sont requis.', 'warning'); return; }
    if (newPass !== confirmPass) { showToast('Les mots de passe ne correspondent pas.', 'error'); return; }

    showLoader();
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); }
    else { showToast('Mot de passe mis à jour. ✅', 'success'); }
}

/* ---------- 10. EXPORT DES DONNEES ---------- */
function exportData() {
    const dataStr = JSON.stringify(staffProfile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hubisoccer_' + (staffProfile.hubisoccer_id || 'export') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export généré.', 'success');
}

/* ---------- 11. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!staffProfile) { return; }

    document.getElementById('settingsForm')?.addEventListener('submit', saveSettings);
    document.getElementById('updateEmailBtn')?.addEventListener('click', updateEmail);
    document.getElementById('updatePasswordBtn')?.addEventListener('click', updatePassword);
    document.getElementById('updatePhoneBtn')?.addEventListener('click', function() {
        showToast('Fonctionnalité à venir.', 'info');
    });
    document.getElementById('logoutAllDevicesBtn')?.addEventListener('click', function() {
        showToast('Fonctionnalité à venir.', 'info');
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
});
