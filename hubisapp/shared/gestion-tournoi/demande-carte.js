/* ============================================================
   HubISoccer — demande-carte.js
   Demande de carte de tournoi – Version adaptée
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
// 2. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let ownerSignatureData = null;
let signaturePad = null;
let currentSignatureType = null;
let clubLogoData = null;
let photoData = null;

// ═══════════════════════════════════════════════════════════
// 3. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 4. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 30000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
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
// 5. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 6. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    const error = !session;
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 7. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
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
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 8. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 9. GESTION DES FICHIERS (PHOTO, LOGO)
// ═══════════════════════════════════════════════════════════
function handleFileUpload(fileInput, previewDiv, callback) {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataURL = e.target.result;
        previewDiv.innerHTML = '<img src="' + dataURL + '" style="max-width:100px;">';
        if (callback) callback(dataURL);
    };
    reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════════════
// 10. SIGNATURE
// ═══════════════════════════════════════════════════════════
function openSignatureModal(type) {
    currentSignatureType = type;
    const title = type === 'owner' ? 'Signature du propriétaire' : 'Signature';
    document.getElementById('signatureModalTitle').innerHTML = '<i class="fas fa-pen"></i> ' + title;
    document.getElementById('signatureModal').style.display = 'flex';
    const canvas = document.getElementById('signatureCanvas');
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 200;
    if (signaturePad) signaturePad.clear();
    else signaturePad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });
}

function closeSignatureModal() {
    document.getElementById('signatureModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('clearSignatureBtn')?.addEventListener('click', function() {
        if (signaturePad) signaturePad.clear();
    });
    document.getElementById('saveSignatureBtn')?.addEventListener('click', function() {
        if (signaturePad && !signaturePad.isEmpty()) {
            const dataURL = signaturePad.toDataURL();
            if (currentSignatureType === 'owner') {
                ownerSignatureData = dataURL;
                document.getElementById('ownerSignImg').src = dataURL;
                document.getElementById('ownerSignaturePreview').innerHTML = '<img src="' + dataURL + '" style="max-height:60px;">';
            }
            closeSignatureModal();
        } else {
            showToast('Veuillez signer.', 'warning');
        }
    });
});

// ═══════════════════════════════════════════════════════════
// 11. GÉNÉRATION DE LA CARTE
// ═══════════════════════════════════════════════════════════
function generateTrackingCode() {
    return 'HUB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateCard() {
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const nationality = document.getElementById('nationality').value.trim();
    const country = document.getElementById('country').value.trim();
    const club = document.getElementById('club').value.trim();
    const tournamentName = document.getElementById('tournamentName').value.trim();
    const countryCode = document.getElementById('countryCode').value.trim().toUpperCase();
    const acceptRules = document.getElementById('acceptRules').checked;

    if (!fullName || !birthDate || !nationality || !country || !acceptRules || !photoData) {
        showToast('Veuillez remplir tous les champs obligatoires, accepter le règlement et charger une photo.', 'error');
        return;
    }
    if (!ownerSignatureData) {
        showToast('Veuillez signer la carte.', 'error');
        return;
    }

    const trackingCode = generateTrackingCode();
    const issueDate = new Date().toLocaleDateString('fr-FR');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiryDateStr = expiryDate.toLocaleDateString('fr-FR');
    const deliveryPlace = 'Cotonou, Bénin';

    // Obtenir la catégorie depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('type');
    const categoryLabels = {
        public_show: 'Public Show You',
        public_detection: 'Détection HubISoccer',
        private_hubisoccer: 'Privé HubISoccer',
        private_simple: 'Privé Simple'
    };
    const categoryLabel = categoryLabels[category] || category;

    // Stocker temporairement dans le localStorage
    const cardData = {
        fullName, birthDate, nationality, country, club, tournamentName,
        trackingCode, issueDate, expiryDateStr, deliveryPlace,
        ownerSignature: ownerSignatureData,
        category, categoryLabel,
        photo: photoData,
        clubLogo: clubLogoData || null,
        countryCode: countryCode || 'bj'
    };
    localStorage.setItem('pendingCard_' + trackingCode, JSON.stringify(cardData));

    // Remplir l'aperçu de la carte
    document.getElementById('frontInfo').innerHTML =
        '<p><strong>N° Carte :</strong> ' + trackingCode + '</p>' +
        '<p><strong>Nom :</strong> ' + escapeHtml(fullName) + '</p>' +
        '<p><strong>Date naissance :</strong> ' + birthDate + '</p>' +
        '<p><strong>Nationalité :</strong> ' + escapeHtml(nationality) + '</p>' +
        '<p><strong>Pays :</strong> ' + escapeHtml(country) + '</p>' +
        '<p><strong>Club :</strong> ' + escapeHtml(club || '-') + '</p>' +
        '<p><strong>Catégorie :</strong> ' + categoryLabel + '</p>' +
        '<p><strong>Tournoi :</strong> ' + escapeHtml(tournamentName || '-') + '</p>';

    document.getElementById('ownerSignImg').src = ownerSignatureData;
    if (clubLogoData) document.getElementById('clubLogoDisplay').src = clubLogoData;
    if (photoData) {
        const frontInfoDiv = document.getElementById('frontInfo');
        const photoHtml = '<div class="photo-titulaire"><img src="' + photoData + '" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-top:10px;"></div>';
        frontInfoDiv.insertAdjacentHTML('beforeend', photoHtml);
    }

    const qrDiv = document.getElementById('qrCode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
        text: 'https://hubisoccer.com/verify-card?code=' + trackingCode,
        width: 100,
        height: 100
    });

    document.getElementById('backInfo').innerHTML =
        '<p><strong>Délivré par :</strong> HubISoccer</p>' +
        '<p><strong>Lieu de délivrance :</strong> ' + deliveryPlace + '</p>' +
        '<p><strong>Date de délivrance :</strong> ' + issueDate + '</p>' +
        '<p><strong>Valable jusqu\'au :</strong> ' + expiryDateStr + '</p>';

    document.getElementById('flagImg').src = 'https://flagcdn.com/64x48/' + (countryCode || 'bj').toLowerCase() + '.png';

    document.getElementById('cardPreviewSection').style.display = 'block';
    document.querySelector('.form-section').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 12. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() {
                window.location.href = '../../../index.html';
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 13. INITIALISATION
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
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    // Catégorie depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('type');
    const categoryLabels = {
        public_show: 'Public Show You',
        public_detection: 'Détection HubISoccer',
        private_hubisoccer: 'Privé HubISoccer',
        private_simple: 'Privé Simple'
    };
    if (!category || !categoryLabels[category]) {
        showToast('Catégorie invalide, retour à la page de choix.', 'error');
        setTimeout(function() {
            window.location.href = 'demande-carte.html';
        }, 2000);
        return;
    }
    document.getElementById('categoryDisplay').value = categoryLabels[category];

    // Uploads
    document.getElementById('clubLogoFile').addEventListener('change', function() {
        handleFileUpload(this, document.getElementById('clubLogoPreview'), function(dataURL) {
            clubLogoData = dataURL;
        });
    });
    document.getElementById('photoFile').addEventListener('change', function() {
        handleFileUpload(this, document.getElementById('photoPreview'), function(dataURL) {
            photoData = dataURL;
        });
    });

    // Génération
    document.getElementById('generateCardBtn').addEventListener('click', generateCard);

    // Impression PDF
    document.getElementById('printCardBtn').addEventListener('click', function() {
        const element = document.getElementById('cardPreview');
        html2pdf().from(element).set({
            margin: 0.5,
            filename: 'carte_' + document.getElementById('fullName').value.trim().replace(/\s/g, '_') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }).save();
    });

    // Modifier
    document.getElementById('editCardBtn').addEventListener('click', function() {
        document.getElementById('cardPreviewSection').style.display = 'none';
        document.querySelector('.form-section').style.display = 'block';
    });

    // Réinitialiser
    document.getElementById('resetFormBtn').addEventListener('click', function() {
        document.getElementById('carteForm').reset();
        ownerSignatureData = null;
        photoData = null;
        clubLogoData = null;
        document.getElementById('ownerSignaturePreview').innerHTML = '<i class="fas fa-pen"></i> Cliquez pour signer';
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('clubLogoPreview').innerHTML = '';
        document.getElementById('cardPreviewSection').style.display = 'none';
        document.querySelector('.form-section').style.display = 'block';
    });

    // Exposer les fonctions globales nécessaires
    window.openSignatureModal = openSignatureModal;
    window.closeSignatureModal = closeSignatureModal;
});