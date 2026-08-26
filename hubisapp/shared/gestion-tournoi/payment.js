/* ============================================================
   HubISoccer — payment.js
   Système Gestion Tournois — Paiement de la participation
   ------------------------------------------------------------
   Corrections critiques par rapport au fichier source :
   - Facturait prize_pool (la cagnotte que l'ORGANISATEUR
     distribue) au lieu de participation_price (ce que LE
     PARTICIPANT doit payer) -- deux montants sans rapport,
     souvent tres differents. Corrige.
   - Marquait chaque paiement status:'completed' instantanement,
     sans aucune verification (commentaire "simule" dans le
     fichier source). Remplace par un vrai statut pending, avec
     historique visible sur cette meme page.
   - 3 methodes generiques (mobile money / carte bancaire / IBAN
     invente) remplacees par les 2 methodes HubIS demandees :
     Compte HubIS (virement interne) et Carte HubIS.
   - Le CVV est collecte dans le formulaire (pour l'experience
     voulue) mais n'est JAMAIS insere en base -- ni lui, ni le
     numero de carte complet, meme pour cette carte interne.
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
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_PAYMENTS       = 'supabaseAuthPrive_gt_payment_requests';
const TBL_PROFILES          = 'supabaseAuthPrive_profiles';

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
const STATUS_LABELS = { pending: 'En attente de validation', validated: 'Validé', rejected: 'Rejeté' };
const STATUS_ICONS  = { pending: 'fa-hourglass-half', validated: 'fa-check-circle', rejected: 'fa-times-circle' };

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournament = null;

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
function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }

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
// 9. PROFIL
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

    // Numero de compte HubIS affiche cote virement -- reprend
    // l'identifiant HubIS existant de l'utilisateur (meme systeme
    // que Mes Revenus), pas un nouveau champ invente
    const accountDisplay = document.getElementById('hubisAccountDisplay');
    if (accountDisplay) accountDisplay.textContent = userProfile.hubisoccer_id || '—';

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
// 10. CONTEXTE DU TOURNOI (montant = participation_price, pas prize_pool)
// ═══════════════════════════════════════════════════════════
async function loadTournamentContext() {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('tournament_id');

    if (!tournamentId) {
        document.getElementById('contextTournamentName').textContent = 'Aucun tournoi spécifié';
        showToast('Aucun tournoi à payer.', 'error');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, logo_url, participation_type, participation_price')
        .eq('id', tournamentId)
        .single();
    hideLoader();

    if (error || !data) {
        document.getElementById('contextTournamentName').textContent = 'Tournoi introuvable';
        showToast('Tournoi introuvable.', 'error');
        return;
    }

    currentTournament = data;

    document.getElementById('contextTournamentName').textContent = data.name || 'Tournoi';
    document.getElementById('contextTournamentSub').textContent =
        (data.participation_type === 'individuel' ? 'Participation individuelle' : 'Participation par équipe');
    if (data.logo_url) {
        document.getElementById('contextLogo').innerHTML = '<img src="' + data.logo_url + '" alt="Logo">';
    }

    const amount = data.participation_price || 0;
    document.getElementById('contextAmount').textContent = formatMoney(amount) + ' FCFA';

    const motif = 'Participation — ' + (data.name || 'Tournoi');
    const walletMotif = document.getElementById('walletMotif');
    const cardMotif = document.getElementById('cardMotif');
    if (walletMotif) walletMotif.value = motif;
    if (cardMotif) cardMotif.value = motif;
}

// ═══════════════════════════════════════════════════════════
// 11. BASCULE ENTRE LES DEUX MÉTHODES
// ═══════════════════════════════════════════════════════════
function initMethodTabs() {
    document.querySelectorAll('.method-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.method-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.method-panel').forEach(function(p) { p.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.dataset.method + 'Method').classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 12. SOUMISSION — COMPTE HUBIS (virement)
// ═══════════════════════════════════════════════════════════
async function submitWalletPayment() {
    if (!currentTournament) { showToast('Aucun tournoi à payer.', 'error'); return; }

    const payerName = document.getElementById('walletPayerName').value.trim();
    if (!payerName) { showToast('Veuillez indiquer le nom complet du payeur.', 'warning'); return; }

    await createPaymentRequest({
        payment_method: 'wallet',
        payer_full_name: payerName,
        hubis_account_number: userProfile.hubisoccer_id || null
    });
}

// ═══════════════════════════════════════════════════════════
// 13. SOUMISSION — CARTE HUBIS
// ═══════════════════════════════════════════════════════════
async function submitCardPayment(e) {
    e.preventDefault();
    if (!currentTournament) { showToast('Aucun tournoi à payer.', 'error'); return; }

    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('cardExpiry').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    const payerName = document.getElementById('cardPayerName').value.trim();

    if (cardNumber.length < 8 || !expiry || !cvv || !payerName) {
        showToast('Veuillez remplir tous les champs de la carte.', 'warning');
        return;
    }

    // Le CVV et le numero complet ne sont jamais transmis a
    // createPaymentRequest -- seuls les 4 derniers chiffres et
    // la date d'expiration sont conserves.
    await createPaymentRequest({
        payment_method: 'card',
        payer_full_name: payerName,
        card_last4: cardNumber.slice(-4),
        card_expiry: expiry
    });

    document.getElementById('cardForm').reset();
}

// ═══════════════════════════════════════════════════════════
// 14. CRÉATION DE LA DEMANDE (statut réel : pending)
// ═══════════════════════════════════════════════════════════
async function createPaymentRequest(extra) {
    const motif = 'Participation — ' + (currentTournament.name || 'Tournoi');
    const payload = Object.assign({
        tournament_id: currentTournament.id,
        user_id: currentUser.id,
        amount: currentTournament.participation_price || 0,
        motif: motif,
        status: 'pending'
    }, extra);

    showLoader();
    const { error } = await supabaseClient.from(TBL_PAYMENTS).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'envoi de la demande : ' + error.message, 'error');
        return;
    }

    document.getElementById('confirmationBlock').style.display = 'block';
    document.getElementById('confirmationBlock').scrollIntoView({ behavior: 'smooth' });
    showToast('Demande de paiement envoyée !', 'success');
    await loadPaymentHistory();
}

// ═══════════════════════════════════════════════════════════
// 15. HISTORIQUE DE MES DEMANDES DE PAIEMENT
// ═══════════════════════════════════════════════════════════
async function loadPaymentHistory() {
    const container = document.getElementById('paymentRequestsList');
    const { data, error } = await supabaseClient
        .from(TBL_PAYMENTS)
        .select('id, amount, motif, payment_method, status, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(15);

    if (error) {
        container.innerHTML = '<p class="empty-hint">Erreur de chargement de l\'historique.</p>';
        return;
    }
    if (!data || !data.length) {
        container.innerHTML = '<p class="empty-hint">Aucune demande de paiement pour l\'instant.</p>';
        return;
    }

    container.innerHTML = data.map(function(r) {
        const methodLabel = r.payment_method === 'wallet' ? 'Compte HubIS' : 'Carte HubIS';
        const date = r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : '';
        return '<div class="request-item">' +
               '<div class="request-main"><span class="request-motif">' + escapeHtml(r.motif) + '</span><span class="request-date">' + date + '</span></div>' +
               '<div class="request-meta"><span class="request-method"><i class="fas fa-' + (r.payment_method === 'wallet' ? 'wallet' : 'credit-card') + '"></i> ' + methodLabel + '</span>' +
               '<span class="request-amount tabular">' + formatMoney(r.amount) + ' FCFA</span></div>' +
               '<span class="request-status status-' + r.status + '"><i class="fas ' + STATUS_ICONS[r.status] + '"></i> ' + STATUS_LABELS[r.status] + '</span>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 16. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 17. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initMethodTabs();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournamentContext();
    await loadPaymentHistory();

    document.getElementById('submitWalletBtn')?.addEventListener('click', submitWalletPayment);
    document.getElementById('cardForm')?.addEventListener('submit', submitCardPayment);
});
