/* ============================================================
   HubISoccer — demande-carte.js
   Système Gestion Tournois — Ma carte de tournoi
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - La carte n'etait JAMAIS enregistree cote serveur -- seulement
     dans le localStorage du navigateur. Aucun organisateur
     n'aurait jamais pu voir une demande. Ajoutee une vraie
     insertion dans supabaseAuthPrive_gt_cartes (table dediee,
     voir demande-carte-table.sql), le localStorage reste comme
     cache local pratique mais n'est plus la seule source.
   - Photo et logo du club etaient stockes en base64 en memoire,
     jamais vraiment televerses. Convertis en vrais televersements
     Supabase Storage (bucket gt-cartes-photos), coherent avec
     le reste de la plateforme.
   - Routage dynamique profil/parametres + niveaux de sidebar.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_CARTES     = 'supabaseAuthPrive_gt_cartes';
const TBL_PROFILES     = 'supabaseAuthPrive_profiles';
const PHOTO_BUCKET        = 'gt-cartes-photos';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];
const CATEGORY_LABELS = {
    public_show: 'Public Show You',
    public_detection: 'Détection HubISoccer',
    private_hubisoccer: 'Privé HubISoccer',
    private_simple: 'Privé Simple'
};

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let ownerSignatureData = null;
let signaturePad = null;
let clubLogoFile = null;
let photoFile = null;
let clubLogoPreviewUrl = null;
let photoPreviewUrl = null;

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 20000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 10. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. GESTION DES FICHIERS (aperçu local + fichier réel conservé)
// ═══════════════════════════════════════════════════════════
function handleFileSelect(fileInput, previewDiv, onSelected) {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        previewDiv.innerHTML = '<img src="' + e.target.result + '" style="max-width:100px;">';
    };
    reader.readAsDataURL(file);
    if (onSelected) onSelected(file);
}

// ═══════════════════════════════════════════════════════════
// 12. SIGNATURE
// ═══════════════════════════════════════════════════════════
function openSignatureModal() {
    document.getElementById('signatureModalTitle').innerHTML = '<i class="fas fa-pen"></i> Signature du titulaire';
    document.getElementById('signatureModal').style.display = 'flex';
    const canvas = document.getElementById('signatureCanvas');
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 200;
    if (signaturePad) signaturePad.clear();
    else signaturePad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });
}
function closeSignatureModal() { document.getElementById('signatureModal').style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 13. TÉLÉVERSEMENT RÉEL (photo + logo)
// ═══════════════════════════════════════════════════════════
async function uploadCardImage(file, label) {
    const ext = file.name.split('.').pop();
    const path = currentUser.id + '/' + label + '_' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

// ═══════════════════════════════════════════════════════════
// 14. GÉNÉRATION DE LA CARTE
// ═══════════════════════════════════════════════════════════
function generateTrackingCode() {
    return 'HUB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function generateCard() {
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const nationality = document.getElementById('nationality').value.trim();
    const country = document.getElementById('country').value.trim();
    const club = document.getElementById('club').value.trim();
    const tournamentName = document.getElementById('tournamentName').value.trim();
    const countryCode = document.getElementById('countryCode').value.trim().toUpperCase();
    const acceptRules = document.getElementById('acceptRules').checked;

    if (!fullName || !birthDate || !nationality || !country || !acceptRules || !photoFile) {
        showToast('Veuillez remplir tous les champs obligatoires, accepter le règlement et charger une photo.', 'error');
        return;
    }
    if (!ownerSignatureData) {
        showToast('Veuillez signer la carte.', 'error');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('type');
    const categoryLabel = CATEGORY_LABELS[category] || category;

    const trackingCode = generateTrackingCode();
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const deliveryPlace = 'Cotonou, Bénin';

    showLoader();

    // Televersement reel des images (remplace le base64-seulement du fichier source)
    let photoUrl = null, clubLogoUrl = null;
    try {
        photoUrl = await uploadCardImage(photoFile, 'photo');
        if (clubLogoFile) clubLogoUrl = await uploadCardImage(clubLogoFile, 'logo');
    } catch (err) {
        hideLoader();
        showToast('Erreur envoi des images : ' + err.message, 'error');
        return;
    }

    // Enregistrement reel en base -- absent du fichier source, qui ne
    // stockait la carte que dans le localStorage du navigateur
    const { error: insertError } = await supabaseClient.from(TBL_CARTES).insert([{
        user_id: currentUser.id,
        tracking_code: trackingCode,
        category: category,
        full_name: fullName,
        birth_date: birthDate,
        nationality: nationality,
        country: country,
        country_code: countryCode || 'bj',
        club: club || null,
        tournament_name: tournamentName || null,
        photo_url: photoUrl,
        club_logo_url: clubLogoUrl,
        owner_signature: ownerSignatureData,
        issue_date: issueDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        delivery_place: deliveryPlace
    }]);

    hideLoader();

    if (insertError) {
        showToast('Erreur lors de l\'enregistrement : ' + insertError.message, 'error');
        return;
    }

    // Cache local pratique (facultatif, la base est desormais la source de verite)
    try {
        localStorage.setItem('pendingCard_' + trackingCode, JSON.stringify({ trackingCode, fullName, category }));
    } catch (e) { /* localStorage indisponible : sans consequence, la carte est deja en base */ }

    renderCardPreview({
        trackingCode, fullName, birthDate, nationality, country, club, categoryLabel, tournamentName,
        photoUrl, clubLogoUrl, ownerSignature: ownerSignatureData,
        issueDate: issueDate.toLocaleDateString('fr-FR'),
        expiryDateStr: expiryDate.toLocaleDateString('fr-FR'),
        deliveryPlace, countryCode
    });

    showToast('Carte générée et enregistrée avec succès !', 'success');
}

function renderCardPreview(d) {
    document.getElementById('frontInfo').innerHTML =
        '<p><strong>N° Carte :</strong> ' + escapeHtml(d.trackingCode) + '</p>' +
        '<p><strong>Nom :</strong> ' + escapeHtml(d.fullName) + '</p>' +
        '<p><strong>Date naissance :</strong> ' + d.birthDate + '</p>' +
        '<p><strong>Nationalité :</strong> ' + escapeHtml(d.nationality) + '</p>' +
        '<p><strong>Pays :</strong> ' + escapeHtml(d.country) + '</p>' +
        '<p><strong>Club :</strong> ' + escapeHtml(d.club || '-') + '</p>' +
        '<p><strong>Catégorie :</strong> ' + escapeHtml(d.categoryLabel) + '</p>' +
        '<p><strong>Tournoi :</strong> ' + escapeHtml(d.tournamentName || '-') + '</p>';

    document.getElementById('ownerSignImg').src = d.ownerSignature;
    if (d.clubLogoUrl) document.getElementById('clubLogoDisplay').src = d.clubLogoUrl;
    if (d.photoUrl) {
        document.getElementById('frontInfo').insertAdjacentHTML('beforeend',
            '<div class="photo-titulaire"><img src="' + d.photoUrl + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-top:10px;"></div>');
    }

    const qrDiv = document.getElementById('qrCode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, { text: 'https://hubisoccer.com/verify-card?code=' + d.trackingCode, width: 100, height: 100 });

    document.getElementById('backInfo').innerHTML =
        '<p><strong>Délivré par :</strong> HubISoccer</p>' +
        '<p><strong>Lieu de délivrance :</strong> ' + escapeHtml(d.deliveryPlace) + '</p>' +
        '<p><strong>Date de délivrance :</strong> ' + d.issueDate + '</p>' +
        '<p><strong>Valable jusqu\'au :</strong> ' + d.expiryDateStr + '</p>';

    document.getElementById('flagImg').src = 'https://flagcdn.com/64x48/' + (d.countryCode || 'bj').toLowerCase() + '.png';

    document.getElementById('cardPreviewSection').style.display = 'block';
    document.getElementById('formSection').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 16. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('type');
    if (!category || !CATEGORY_LABELS[category]) {
        showToast('Catégorie invalide, retour à la page de choix.', 'error');
        setTimeout(function() { window.location.href = 'carte-de-tournoi-choix.html'; }, 2000);
        return;
    }
    document.getElementById('categoryDisplay').value = CATEGORY_LABELS[category];
    document.getElementById('categoryLabel').textContent = CATEGORY_LABELS[category];

    document.getElementById('clubLogoBtn')?.addEventListener('click', function() { document.getElementById('clubLogoFile').click(); });
    document.getElementById('photoBtn')?.addEventListener('click', function() { document.getElementById('photoFile').click(); });

    document.getElementById('clubLogoFile')?.addEventListener('change', function() {
        handleFileSelect(this, document.getElementById('clubLogoPreview'), function(file) { clubLogoFile = file; });
    });
    document.getElementById('photoFile')?.addEventListener('change', function() {
        handleFileSelect(this, document.getElementById('photoPreview'), function(file) { photoFile = file; });
    });

    document.getElementById('ownerSignaturePreview')?.addEventListener('click', openSignatureModal);
    document.getElementById('clearSignatureBtn')?.addEventListener('click', function() { if (signaturePad) signaturePad.clear(); });
    document.getElementById('saveSignatureBtn')?.addEventListener('click', function() {
        if (signaturePad && !signaturePad.isEmpty()) {
            ownerSignatureData = signaturePad.toDataURL();
            document.getElementById('ownerSignImg').src = ownerSignatureData;
            document.getElementById('ownerSignaturePreview').innerHTML = '<img src="' + ownerSignatureData + '" style="max-height:60px;">';
            closeSignatureModal();
        } else {
            showToast('Veuillez signer.', 'warning');
        }
    });
    window.closeSignatureModal = closeSignatureModal;

    document.getElementById('generateCardBtn')?.addEventListener('click', generateCard);

    document.getElementById('printCardBtn')?.addEventListener('click', function() {
        const element = document.getElementById('cardPreview');
        html2pdf().from(element).set({
            margin: 0.5,
            filename: 'carte_' + document.getElementById('fullName').value.trim().replace(/\s/g, '_') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }).save();
    });

    document.getElementById('editCardBtn')?.addEventListener('click', function() {
        document.getElementById('cardPreviewSection').style.display = 'none';
        document.getElementById('formSection').style.display = 'block';
    });

    document.getElementById('resetFormBtn')?.addEventListener('click', function() {
        document.getElementById('carteForm').reset();
        ownerSignatureData = null;
        photoFile = null;
        clubLogoFile = null;
        document.getElementById('ownerSignaturePreview').innerHTML = '<i class="fas fa-pen"></i> Cliquez pour signer';
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('clubLogoPreview').innerHTML = '';
        document.getElementById('categoryDisplay').value = CATEGORY_LABELS[category];
        document.getElementById('cardPreviewSection').style.display = 'none';
        document.getElementById('formSection').style.display = 'block';
    });
});
