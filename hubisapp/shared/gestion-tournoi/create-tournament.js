/* ============================================================
   HubISoccer — create-tournament.js
   Système Gestion Tournois — Créer un tournoi (v2)
   ------------------------------------------------------------
   Reprend TOUTES les corrections deja appliquees precedemment
   (created_by, status, tables migrees, routage dynamique,
   niveaux de sidebar) et ajoute la presentation complete demandee :
   - Logo + affiche/banniere : vrais televersements Storage.
   - Video : URL YouTube/Vimeo (coherent avec stream_url deja
     existant, pas de televersement de fichier video).
   - Participation (individuel/collectif + prix), format d'equipe
     (titulaires 1-11, staff 1-6).
   - Recompenses : constructeur dynamique ecrivant dans la
     nouvelle table gt_tournament_awards (podium + categories
     speciales), distincte de gt_prizes (qui reste l'attribution
     apres coup, geree dans Gerer un tournoi).
   - Nom/description/reglement acceptent HTML/CSS ecrits
     directement, stockes tels quels -- MAIS l'apercu affiche ici
     passe par DOMPurify avant tout rendu, pour ne jamais executer
     de script depuis un champ que l'utilisateur controle lui-meme.
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
// 2. TABLES (convention supabaseAuthPrive_gt_*)
// ═══════════════════════════════════════════════════════════
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS         = 'supabaseAuthPrive_gt_sports';
const TBL_AWARDS            = 'supabaseAuthPrive_gt_tournament_awards';
const MEDIA_BUCKET             = 'gt-tournament-media';

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

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let logoFile = null;
let bannerFile = null;
let rankAwardCount = 0;

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
    if (!duration) duration = 30000;
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
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// Rendu assaini -- DOMPurify retire scripts/gestionnaires d'evenements
// mais conserve la mise en forme (balises de style, attributs style, etc.)
function sanitizeAndRender(rawHtml, targetEl) {
    if (!rawHtml || !rawHtml.trim()) { targetEl.innerHTML = ''; targetEl.style.display = 'none'; return; }
    targetEl.style.display = 'block';
    targetEl.innerHTML = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['style'] });
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
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) return null;
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
    if (userName) userName.textContent = userProfile.full_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES SPORTS ET TYPES
// ═══════════════════════════════════════════════════════════
async function loadSports() {
    const { data, error } = await supabaseClient.from(TBL_SPORTS).select('id, name').order('name');
    if (error) { console.warn('Erreur chargement sports :', error.message); return; }
    const select = document.getElementById('sportId');
    (data || []).forEach(function(sport) {
        const opt = document.createElement('option');
        opt.value = sport.id; opt.textContent = sport.name;
        select.appendChild(opt);
    });
}

async function loadTypes() {
    const { data, error } = await supabaseClient.from(TBL_TYPES).select('id, name, label').order('label');
    if (error) { console.warn('Erreur chargement types :', error.message); return; }
    const select = document.getElementById('tournamentType');
    (data || []).forEach(function(type) {
        const opt = document.createElement('option');
        opt.value = type.id; opt.textContent = type.label;
        select.appendChild(opt);
    });
}

// ═══════════════════════════════════════════════════════════
// 12. TÉLÉVERSEMENT DE MÉDIA (logo / affiche)
// ═══════════════════════════════════════════════════════════
async function uploadTournamentMedia(file, label) {
    const ext = file.name.split('.').pop();
    const path = currentUser.id + '/' + label + '_' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

function setupMediaUpload(dropAreaId, fileInputId, previewId, onSelected) {
    const dropArea = document.getElementById(dropAreaId);
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    dropArea.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        onSelected(file);
        const reader = new FileReader();
        reader.onload = function(ev) { preview.innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });
}

// ═══════════════════════════════════════════════════════════
// 13. CONSTRUCTEUR DE RÉCOMPENSES
// ═══════════════════════════════════════════════════════════
function addRankAward() {
    rankAwardCount++;
    const template = document.getElementById('rankAwardTemplate');
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector('.award-row');
    const badge = clone.querySelector('.award-rank-badge');
    badge.textContent = rankAwardCount + (rankAwardCount === 1 ? 'ère' : 'ème') + ' place';
    row.dataset.rank = rankAwardCount;
    if (rankAwardCount === 1) {
        clone.querySelector('.award-label').value = "Trophée + Médaille d'or";
        clone.querySelector('.btn-remove-award').style.display = 'none';
    }
    clone.querySelector('.btn-remove-award').addEventListener('click', function() {
        row.remove();
    });
    document.getElementById('rankAwardsList').appendChild(clone);
}

function addSpecialAward() {
    const template = document.getElementById('specialAwardTemplate');
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector('.award-row');
    clone.querySelector('.btn-remove-award').addEventListener('click', function() { row.remove(); });
    document.getElementById('specialAwardsList').appendChild(clone);
}

function collectAwards() {
    const awards = [];
    document.querySelectorAll('#rankAwardsList .award-row').forEach(function(row) {
        const label = row.querySelector('.award-label').value.trim();
        if (!label) return;
        awards.push({
            award_type: 'rank',
            rank_position: parseInt(row.dataset.rank, 10),
            special_category: null,
            reward_label: label,
            amount: parseFloat(row.querySelector('.award-amount').value) || null,
            display_order: parseInt(row.dataset.rank, 10)
        });
    });
    document.querySelectorAll('#specialAwardsList .award-row').forEach(function(row, idx) {
        const category = row.querySelector('.award-category').value.trim();
        const label = row.querySelector('.award-label').value.trim();
        if (!category || !label) return;
        awards.push({
            award_type: 'special',
            rank_position: null,
            special_category: category,
            reward_label: label,
            amount: parseFloat(row.querySelector('.award-amount').value) || null,
            display_order: 100 + idx
        });
    });
    return awards;
}

// ═══════════════════════════════════════════════════════════
// 14. SOUMISSION DU FORMULAIRE
// ═══════════════════════════════════════════════════════════
async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser) { showToast('Session expirée, merci de vous reconnecter.', 'error'); return; }

    const name = document.getElementById('tournamentName').value.trim();
    const sportId = parseInt(document.getElementById('sportId').value);
    const typeId = parseInt(document.getElementById('tournamentType').value);
    const registrationCode = document.getElementById('registrationCode').value.trim() || null;
    const description = document.getElementById('description').value.trim() || null;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const location = document.getElementById('tournamentLocation').value.trim() || null;
    const videoUrl = document.getElementById('videoUrl').value.trim() || null;
    const participationType = document.getElementById('participationType').value;
    const participationPrice = parseFloat(document.getElementById('participationPrice').value) || 0;
    const maxStarters = parseInt(document.getElementById('maxStarters').value) || 11;
    const maxStaff = parseInt(document.getElementById('maxStaff').value) || 3;
    const requiresFirstPas = document.getElementById('requiresFirstPas').value === 'true';
    const rules = document.getElementById('rules').value.trim() || null;
    const streamUrl = document.getElementById('streamUrl').value.trim() || null;

    if (!name || !sportId || !typeId || !startDate || !endDate) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
        showToast('La date de fin doit être après la date de début.', 'warning');
        return;
    }
    if (!logoFile) { showToast('Le logo du tournoi est obligatoire.', 'warning'); return; }
    if (!bannerFile) { showToast('L\'affiche / bannière du tournoi est obligatoire.', 'warning'); return; }

    const awards = collectAwards();
    if (!awards.some(function(a) { return a.award_type === 'rank' && a.rank_position === 1; })) {
        showToast('La récompense du podium (1ère place) est obligatoire.', 'warning');
        return;
    }

    const btn = document.querySelector('#createTournamentForm button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    showLoader();

    let logoUrl, bannerUrl;
    try {
        logoUrl = await uploadTournamentMedia(logoFile, 'logo');
        bannerUrl = await uploadTournamentMedia(bannerFile, 'banner');
    } catch (err) {
        hideLoader();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Créer le tournoi';
        showToast('Erreur envoi des médias : ' + err.message, 'error');
        return;
    }

    const { data: tournamentData, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .insert([{
            name: name,
            description: description,
            start_date: startDate,
            end_date: endDate,
            location: location,
            registration_code: registrationCode,
            prize_pool: awards.reduce(function(sum, a) { return sum + (a.amount || 0); }, 0),
            stream_url: streamUrl,
            requires_first_pas: requiresFirstPas,
            has_agreed_to_rules: false,
            type_id: typeId,
            sport_id: sportId,
            is_active: true,
            status: 'published',
            created_by: currentUser.id,
            logo_url: logoUrl,
            banner_url: bannerUrl,
            video_url: videoUrl,
            max_starters: maxStarters,
            max_staff: maxStaff,
            participation_type: participationType,
            participation_price: participationPrice,
            rules: rules,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        hideLoader();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Créer le tournoi';
        showToast('Erreur lors de la création du tournoi : ' + error.message, 'error');
        return;
    }

    if (awards.length) {
        const awardRows = awards.map(function(a) { return Object.assign({}, a, { tournament_id: tournamentData.id }); });
        const { error: awardsError } = await supabaseClient.from(TBL_AWARDS).insert(awardRows);
        if (awardsError) {
            console.warn('Erreur enregistrement récompenses :', awardsError.message);
            showToast('Tournoi créé, mais erreur sur les récompenses : ' + awardsError.message, 'warning', 8000);
        }
    }

    hideLoader();
    showToast('Tournoi créé avec succès !', 'success');
    setTimeout(function() { window.location.href = 'tournament-details.html?id=' + tournamentData.id; }, 1200);
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
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('cancelBtn')?.addEventListener('click', function() { window.location.href = 'acceuil.html'; });
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadSports();
    await loadTypes();

    document.getElementById('tournamentName')?.addEventListener('input', function() {
        sanitizeAndRender(this.value, document.getElementById('namePreview'));
    });
    document.getElementById('description')?.addEventListener('input', function() {
        sanitizeAndRender(this.value, document.getElementById('descriptionPreview'));
    });
    document.getElementById('rules')?.addEventListener('input', function() {
        sanitizeAndRender(this.value, document.getElementById('rulesPreview'));
    });

    setupMediaUpload('logoDropArea', 'logoFile', 'logoPreview', function(file) { logoFile = file; });
    setupMediaUpload('bannerDropArea', 'bannerFile', 'bannerPreview', function(file) { bannerFile = file; });

    addRankAward();
    document.getElementById('addRankAwardBtn')?.addEventListener('click', addRankAward);
    document.getElementById('addSpecialAwardBtn')?.addEventListener('click', addSpecialAward);

    document.getElementById('createTournamentForm')?.addEventListener('submit', handleSubmit);
});
