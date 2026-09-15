/* ============================================================
   HubISoccer -- gt-profile.js
   Page Mon Profil - Espace Gestionnaire de Tournoi
   Sections "Etudes & Formations" et "Carriere & Metier" absentes
   (redondantes avec Mon CV Pro), pas de bouton "Certifier"
   (redondant avec Verification du Statut).
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
let userProfile  = null;

/* ---------- 3. LISTE DE PAYS ---------- */
const PAYS_LISTE = [
    'Bénin','Togo','Ghana','Nigeria','Côte d\'Ivoire','Sénégal','Burkina Faso','Mali','Niger',
    'Guinée','Cameroun','Gabon','Congo','RD Congo','Maroc','Algérie','Tunisie','Égypte',
    'Afrique du Sud','Kenya','Éthiopie','France','Belgique','Suisse','Portugal','Espagne',
    'Italie','Allemagne','Royaume-Uni','États-Unis','Canada','Brésil','Qatar','Émirats Arabes Unis',
    'Arabie Saoudite','Turquie','Autre'
];

/* ---------- 4. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'flex'; } }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'none'; } }

/* ---------- 5. TOAST (duree 30 secondes) ---------- */
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

/* ---------- 6. SESSION ---------- */
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

/* ---------- 7. LISTES DEROULANTES ---------- */
function populerListesPays() {
    ['nationality', 'country'].forEach(function(id) {
        const select = document.getElementById(id);
        if (!select) { return; }
        PAYS_LISTE.forEach(function(pays) {
            const opt = document.createElement('option');
            opt.value = pays;
            opt.textContent = pays;
            select.appendChild(opt);
        });
    });
}

/* ---------- 8. CHARGEMENT PROFIL ---------- */
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
    userProfile = data;
    populateForm();
    updateDeletionUI();
    return userProfile;
}

function populateForm() {
    const p = userProfile;
    document.getElementById('full_name').value = p.full_name || '';
    document.getElementById('pseudo').value = p.pseudo || '';
    document.getElementById('bio').value = p.bio || '';
    document.getElementById('city').value = p.city || '';
    document.getElementById('langues').value = p.langues || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('birth_date').value = p.date_of_birth || '';
    document.getElementById('nationality').value = p.nationality || '';
    document.getElementById('country').value = p.country || '';
}

/* ---------- 9. SAUVEGARDE ---------- */
async function saveProfile(e) {
    e.preventDefault();

    const fullName = (document.getElementById('full_name')?.value || '').trim();
    const phone = (document.getElementById('phone')?.value || '').trim();
    const birthDate = document.getElementById('birth_date')?.value || '';
    const country = document.getElementById('country')?.value || '';

    if (!fullName || !phone || !birthDate || !country) {
        showToast('Merci de remplir tous les champs obligatoires.', 'warning');
        return;
    }

    const updates = {
        full_name    : fullName,
        pseudo        : (document.getElementById('pseudo')?.value || '').trim() || null,
        bio            : (document.getElementById('bio')?.value || '').trim() || null,
        city            : (document.getElementById('city')?.value || '').trim() || null,
        langues         : (document.getElementById('langues')?.value || '').trim() || null,
        phone            : phone,
        date_of_birth     : birthDate,
        nationality        : document.getElementById('nationality')?.value || null,
        country             : country
    };

    showLoader();
    const { error } = await supabaseClient
        .from(PROFILES_TABLE)
        .update(updates)
        .eq('hubisoccer_id', userProfile.hubisoccer_id);
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Profil mis à jour. ✅', 'success');
    Object.assign(userProfile, updates);
}

/* ---------- 10. SUPPRESSION DE COMPTE ---------- */
function updateDeletionUI() {
    const delBtn = document.getElementById('deleteAccountBtn');
    const revokeBtn = document.getElementById('revokeDeletionBtn');
    const status = document.getElementById('deletionStatus');
    if (!userProfile) { return; }

    if (userProfile.deletion_requested && !userProfile.deletion_revoked) {
        if (delBtn) { delBtn.style.display = 'none'; }
        if (revokeBtn) { revokeBtn.style.display = 'inline-flex'; }
        if (status && userProfile.deletion_requested_at) {
            const reqDate = new Date(userProfile.deletion_requested_at);
            const limitDate = new Date(reqDate.getTime() + 48 * 60 * 60 * 1000);
            status.textContent = 'Demande en cours. Vous avez jusqu\'au ' + limitDate.toLocaleString('fr-FR') + ' pour révoquer.';
        }
    } else {
        if (delBtn) { delBtn.style.display = 'inline-flex'; }
        if (revokeBtn) { revokeBtn.style.display = 'none'; }
        if (status) { status.textContent = ''; }
    }
}

function ouvrirModaleSuppression() {
    const modal = document.getElementById('deleteModal');
    if (modal) { modal.style.display = 'flex'; }
}
function fermerModaleSuppression() {
    const modal = document.getElementById('deleteModal');
    if (modal) { modal.style.display = 'none'; }
}

async function confirmerSuppression() {
    const raison = (document.getElementById('deletionReason')?.value || '').trim();
    showLoader();
    const { error } = await supabaseClient
        .from(PROFILES_TABLE)
        .update({
            deletion_requested     : true,
            deletion_requested_at   : new Date().toISOString(),
            deletion_revoked         : false,
            deletion_reason           : raison || null
        })
        .eq('hubisoccer_id', userProfile.hubisoccer_id);
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    userProfile.deletion_requested = true;
    userProfile.deletion_requested_at = new Date().toISOString();
    userProfile.deletion_revoked = false;
    fermerModaleSuppression();
    updateDeletionUI();
    showToast('Suppression demandée. Vous avez 48h pour l\'annuler.', 'warning');
}

async function revokeDeletion() {
    showLoader();
    const { error } = await supabaseClient
        .from(PROFILES_TABLE)
        .update({ deletion_revoked: true, deletion_requested: false })
        .eq('hubisoccer_id', userProfile.hubisoccer_id);
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    userProfile.deletion_requested = false;
    userProfile.deletion_revoked = true;
    updateDeletionUI();
    showToast('Suppression annulée.', 'success');
}

/* ---------- 11. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }

    populerListesPays();
    await loadProfile();
    if (!userProfile) { return; }

    document.getElementById('profileForm')?.addEventListener('submit', saveProfile);
    document.getElementById('deleteAccountBtn')?.addEventListener('click', ouvrirModaleSuppression);
    document.getElementById('closeDeleteModal')?.addEventListener('click', fermerModaleSuppression);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', fermerModaleSuppression);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmerSuppression);
    document.getElementById('revokeDeletionBtn')?.addEventListener('click', revokeDeletion);
});
