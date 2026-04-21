/* ============================================================
   HubISoccer — foot-revenus.js
   Dashboard principal du HubIS Wallet – Version corrigée finale
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
let userProfile = null;
let walletData = null;
let bonusData = null;
let allTransactions = [];
let filteredTransactions = [];
let txPage = 0;
const TX_PAGE_SIZE = 15;
let currentFilter = 'all';
let isCardFlipped = false;
let notificationsUnreadCount = 0;
let notificationSubscription = null;
// Fin état global

// Début mapping des rôles pour affichage
const ROLE_LABEL = {
    FOOT: '⚽ Footballeur',
    BASK: '🏀 Basketteur',
    TENN: '🎾 Tennisman',
    ATHL: '🏃 Athlète',
    HANDB: '🤾 Handballeur',
    VOLL: '🏐 Volleyeur',
    RUGBY: '🏉 Rugbyman',
    NATA: '🏊 Nageur',
    ARTSM: '🥋 Arts martiaux',
    CYCL: '🚴 Cycliste',
    CHAN: '🎤 Chanteur',
    DANS: '💃 Danseur',
    COMP: '🎼 Compositeur',
    ACIN: '🎬 Acteur cinéma',
    ATHE: '🎭 Acteur théâtre',
    HUMO: '🎙️ Humoriste',
    SLAM: '🗣️ Slameur',
    DJ: '🎧 DJ / Producteur',
    CIRQ: '🤹 Artiste de cirque',
    VISU: '🎨 Artiste visuel',
    PARRAIN: '🤝 Parrain',
    AGENT: '💼 Agent FIFA',
    COACH: '📋 Coach',
    MEDIC: '⚕️ Staff médical',
    ARBIT: '🏁 Corps arbitral',
    ACAD: '🏫 Académie sportive',
    FORM: '🎓 Formateur',
    TOURN: '🏆 Gestionnaire tournoi',
    ADMIN: '🛡️ Administrateur'
};
const ROLE_EMOJI = {
    FOOT: '⚽',
    BASK: '🏀',
    TENN: '🎾',
    ATHL: '🏃',
    HANDB: '🤾',
    VOLL: '🏐',
    RUGBY: '🏉',
    NATA: '🏊',
    ARTSM: '🥋',
    CYCL: '🚴',
    CHAN: '🎤',
    DANS: '💃',
    COMP: '🎼',
    ACIN: '🎬',
    ATHE: '🎭',
    HUMO: '🎙️',
    SLAM: '🗣️',
    DJ: '🎧',
    CIRQ: '🤹',
    VISU: '🎨',
    PARRAIN: '🤝',
    AGENT: '💼',
    COACH: '📋',
    MEDIC: '⚕️',
    ARBIT: '🏁',
    ACAD: '🏫',
    FORM: '🎓',
    TOURN: '🏆',
    ADMIN: '🛡️'
};
// Fin mapping des rôles

// Début liste des devises
const CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar américain', symbol: '$' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'AU$' },
    { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$' },
    { code: 'CNY', name: 'Yuan chinois', symbol: '¥' },
    { code: 'INR', name: 'Roupie indienne', symbol: '₹' },
    { code: 'BRL', name: 'Real brésilien', symbol: 'R$' },
    { code: 'RUB', name: 'Rouble russe', symbol: '₽' },
    { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R' },
    { code: 'MXN', name: 'Peso mexicain', symbol: 'MX$' },
    { code: 'SGD', name: 'Dollar de Singapour', symbol: 'SG$' },
    { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$' },
    { code: 'KRW', name: 'Won sud-coréen', symbol: '₩' },
    { code: 'TRY', name: 'Livre turque', symbol: '₺' },
    { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr' },
    { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr' },
    { code: 'DKK', name: 'Couronne danoise', symbol: 'kr' },
    { code: 'PLN', name: 'Złoty polonais', symbol: 'zł' },
    { code: 'THB', name: 'Baht thaïlandais', symbol: '฿' },
    { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM' },
    { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp' },
    { code: 'PHP', name: 'Peso philippin', symbol: '₱' },
    { code: 'VND', name: 'Dong vietnamien', symbol: '₫' },
    { code: 'AED', name: 'Dirham des Émirats', symbol: 'د.إ' },
    { code: 'SAR', name: 'Riyal saoudien', symbol: '﷼' },
    { code: 'QAR', name: 'Riyal qatari', symbol: 'QR' },
    { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£' },
    { code: 'NGN', name: 'Naira nigérian', symbol: '₦' },
    { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵' },
    { code: 'KES', name: 'Shilling kényan', symbol: 'KSh' },
    { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh' },
    { code: 'TZS', name: 'Shilling tanzanien', symbol: 'TSh' },
    { code: 'ZMW', name: 'Kwacha zambien', symbol: 'ZK' },
    { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'CFA' },
    { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA' },
    { code: 'MAD', name: 'Dirham marocain', symbol: 'DH' },
    { code: 'DZD', name: 'Dinar algérien', symbol: 'DA' },
    { code: 'TND', name: 'Dinar tunisien', symbol: 'DT' },
    { code: 'LYD', name: 'Dinar libyen', symbol: 'LD' },
    { code: 'SLL', name: 'Leone sierra-léonais', symbol: 'Le' },
    { code: 'GNF', name: 'Franc guinéen', symbol: 'FG' },
    { code: 'RWF', name: 'Franc rwandais', symbol: 'RF' },
    { code: 'BIF', name: 'Franc burundais', symbol: 'FBu' },
    { code: 'DJF', name: 'Franc djiboutien', symbol: 'Fdj' },
    { code: 'SOS', name: 'Shilling somalien', symbol: 'S' },
    { code: 'ETB', name: 'Birr éthiopien', symbol: 'Br' },
    { code: 'SDG', name: 'Livre soudanaise', symbol: 'SDG' }
];
// Fin liste des devises

// Début fonctions utilitaires
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info', duration = 30000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function formatAmount(amount) {
    return Number(amount).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function getCurrencySymbol(currencyCode) {
    const curr = CURRENCIES.find(c => c.code === currencyCode);
    return curr ? curr.symbol : currencyCode;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(iso, full = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (full) return d.toLocaleString('fr-FR');
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) {
        return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
// Fin fonctions utilitaires

// ============================================================
// INITIALISATION NAVBAR & SIDEBAR
// ============================================================

// Début fonction initSidebar
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

    let touchStartX = 0,
        touchStartY = 0;
    const SWIPE_THRESHOLD = 55;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) <= Math.abs(dy)) return;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;

        if (e.cancelable) e.preventDefault();

        if (dx > 0 && touchStartX < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}
// Fin fonction initSidebar

// Début fonction initUserMenu
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;

    userMenu.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });
}
// Fin fonction initUserMenu

// Début fonction updateNavbarAvatar
function updateNavbarAvatar() {
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const userName = document.getElementById('userName');

    if (!userProfile) return;

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) {
            userAvatar.src = avatarUrl;
            userAvatar.style.display = 'block';
        }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) {
            userInitials.textContent = initials;
            userInitials.style.display = 'flex';
        }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}
// Fin fonction updateNavbarAvatar

// ============================================================
// SESSION & CHARGEMENT
// ============================================================

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadProfile
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Impossible de charger le profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarAvatar();
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction loadWallet
async function loadWallet() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();
    hideLoader();
    if (!data || error) {
        showToast('Wallet non configuré. Redirection…', 'warning');
        setTimeout(() => window.location.href = 'foot-revenus-setup.html', 1500);
        return null;
    }
    if (data.status === 'suspended') {
        showToast('Votre wallet est suspendu. Contactez le support.', 'error');
    }
    // Normaliser les valeurs null
    walletData = {
        ...data,
        balance: data.balance || 0,
        card_balance: data.card_balance || 0,
        pending_balance: data.pending_balance || 0
    };
    return walletData;
}
// Fin fonction loadWallet

// Début fonction loadBonusData
async function loadBonusData() {
    if (!userProfile) return;
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_bonus')
        .select('*')
        .eq('hubisoccer_id', userProfile.hubisoccer_id)
        .maybeSingle();
    if (error) {
        console.warn('Bonus load error:', error);
        return;
    }
    if (!data) {
        const { data: newB, error: insErr } = await supabaseClient
            .from('supabaseAuthPrive_bonus')
            .insert([{
                hubisoccer_id: userProfile.hubisoccer_id,
                homme_match: 0,
                primes: 0,
                community: 0,
                followers_bonus_available: 0,
                followers_bonus_credited: 0
            }])
            .select()
            .single();
        if (insErr) return;
        bonusData = newB;
    } else {
        bonusData = data;
    }
    updateBonusUI();
    checkFollowerBonus();
}
// Fin fonction loadBonusData

// Début fonction updateBonusUI
function updateBonusUI() {
    if (!bonusData) return;

    const hommeEl = document.getElementById('bonusHomme');
    const primesEl = document.getElementById('bonusPrimes');
    const communityEl = document.getElementById('bonusCommunity');

    if (hommeEl) hommeEl.textContent = bonusData.homme_match || 0;
    if (primesEl) primesEl.textContent = bonusData.primes || 0;
    if (communityEl) communityEl.textContent = bonusData.community || 0;

    const totalBonus = (bonusData.homme_match || 0) +
        (bonusData.primes || 0) +
        (bonusData.community || 0) +
        (bonusData.followers_bonus_available || 0);

    const btn = document.getElementById('withdrawBonusBtn');
    const msg = document.getElementById('bonusMessage');

    if (msg) {
        msg.textContent = `Bonus disponible : ${formatAmount(totalBonus)} CFA`;
    }
    if (btn) {
        btn.disabled = totalBonus <= 0;
        btn.innerHTML = totalBonus > 0
            ? `<i class="fas fa-gift"></i> Retirer ${formatAmount(totalBonus)} CFA`
            : `<i class="fas fa-gift"></i> Aucun bonus`;
    }
}
// Fin fonction updateBonusUI

// Début fonction checkFollowerBonus
async function checkFollowerBonus() {
    if (!userProfile || !walletData || !bonusData) return;

    const followers = userProfile.recruiter_favs || 0;
    const threshold = 50;
    const eligibleBonus = Math.floor(followers / threshold) * 5000;
    const alreadyCredited = bonusData.followers_bonus_credited || 0;
    const newBonus = eligibleBonus - alreadyCredited;

    if (newBonus > 0) {
        await supabaseClient
            .from('supabaseAuthPrive_bonus')
            .update({
                followers_bonus_available: (bonusData.followers_bonus_available || 0) + newBonus,
                followers_bonus_credited: eligibleBonus
            })
            .eq('hubisoccer_id', userProfile.hubisoccer_id);

        bonusData.followers_bonus_available = (bonusData.followers_bonus_available || 0) + newBonus;
        updateBonusUI();

        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipient_hubisoccer_id: userProfile.hubisoccer_id,
            type: 'bonus_followers',
            title: '🎁 Bonus followers débloqué !',
            message: `Vous avez atteint ${followers} followers. ${formatAmount(newBonus)} CFA ajoutés à vos bonus.`,
            read: false,
            created_at: new Date().toISOString()
        }]);
    }
}
// Fin fonction checkFollowerBonus

// Début fonction withdrawBonus
async function withdrawBonus() {
    if (!bonusData || !walletData) return;

    const total = (bonusData.homme_match || 0) +
        (bonusData.primes || 0) +
        (bonusData.community || 0) +
        (bonusData.followers_bonus_available || 0);

    if (total <= 0) {
        showToast('Aucun bonus à retirer', 'warning');
        return;
    }

    showLoader();
    try {
        const ref = generateRef('BNS');
        const sym = getCurrencySymbol(walletData.currency);

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'bonus',
            amount: total,
            description: `Retrait bonus – ${formatAmount(total)} ${sym}`,
            reference: ref,
            status: 'completed',
            created_at: new Date().toISOString()
        }]);

        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({ balance: walletData.balance + total })
            .eq('id', walletData.id);

        await supabaseClient
            .from('supabaseAuthPrive_bonus')
            .update({
                homme_match: 0,
                primes: 0,
                community: 0,
                followers_bonus_available: 0
            })
            .eq('hubisoccer_id', userProfile.hubisoccer_id);

        walletData.balance += total;
        bonusData.homme_match = 0;
        bonusData.primes = 0;
        bonusData.community = 0;
        bonusData.followers_bonus_available = 0;

        renderBalance();
        updateBonusUI();
        showToast(`Bonus de ${formatAmount(total)} ${sym} crédité sur votre solde principal`, 'success');
        await loadTransactions();
        await computeMonthStats();
    } catch (err) {
        showToast('Erreur lors du retrait des bonus', 'error');
        console.error(err);
    } finally {
        hideLoader();
    }
}
// Fin fonction withdrawBonus

// ============================================================
// CARTE & SOLDES
// ============================================================

// Début fonction renderCard
function renderCard() {
    if (!walletData || !userProfile) return;

    const sym = getCurrencySymbol(walletData.currency);
    const ref = walletData.wallet_ref || 'HIS-XXXX-XXXX-XXXX';
    const parts = ref.split('-');
    let maskedNum = '•••• •••• •••• ••••';
    if (parts.length >= 4) {
        maskedNum = `•••• ${parts[1]} ${parts[2]} ${parts[3]}`;
    }

    document.getElementById('cardHolderName').textContent =
        (userProfile.full_name || 'UTILISATEUR').toUpperCase().slice(0, 22);
    document.getElementById('cardNumber').textContent = maskedNum;
    document.getElementById('cardRoleBadge').textContent = ROLE_EMOJI[userProfile.role_code] || '👤';
    document.getElementById('cardBackId').textContent = ref;

    const cvv = ref.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0');
    document.getElementById('cardCVV').textContent = cvv;

    if (walletData.expiry_date) {
        const d = new Date(walletData.expiry_date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        document.getElementById('cardExpiry').textContent = `${mm}/${yy}`;
    }

    const card = document.getElementById('hubisCard');
    const role = userProfile.role_code;
    const sportRoles = ['FOOT', 'BASK', 'TENN', 'ATHL', 'HANDB', 'VOLL', 'RUGBY', 'NATA', 'ARTSM', 'CYCL'];
    const artRoles = ['CHAN', 'DANS', 'COMP', 'ACIN', 'ATHE', 'HUMO', 'SLAM', 'DJ', 'CIRQ', 'VISU'];
    const proRoles = ['PARRAIN', 'AGENT', 'COACH', 'MEDIC', 'ARBIT', 'ACAD', 'FORM', 'TOURN', 'ADMIN'];

    if (sportRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #2a3f6e 0%, #3b2d5c 55%, #1a1a3a 100%)';
    } else if (artRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #4a2060 0%, #5e2a7a 55%, #2d1040 100%)';
    } else if (proRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #1a3a2e 0%, #2a5a4a 55%, #0d241c 100%)';
    }

    document.getElementById('receiveWalletId').textContent = ref;
    document.getElementById('settingsWalletId').textContent = ref;
    document.getElementById('settingsCurrency').textContent = walletData.currency || 'XOF';

    ['sendCurrencyLabel', 'depositCurrencyLabel', 'withdrawCurrencyLabel', 'transferCardCurrencyLabel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = sym;
    });

    drawSimpleQR(ref);
}
// Fin fonction renderCard

// Début fonction drawSimpleQR
function drawSimpleQR(data) {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;

    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();

    const size = 180;
    const cellSize = size / qr.getModuleCount();

    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
}
// Fin fonction drawSimpleQR

// Début fonction renderBalance
function renderBalance() {
    if (!walletData) return;
    const sym = getCurrencySymbol(walletData.currency);

    const bal = document.getElementById('balanceAmount');
    if (bal) {
        bal.querySelector('.ba-value').textContent = formatAmount(walletData.balance || 0);
        bal.querySelector('.ba-currency').textContent = sym;
    }

    const cardBal = document.getElementById('cardBalanceAmount');
    if (cardBal) {
        cardBal.querySelector('.ba-value').textContent = formatAmount(walletData.card_balance || 0);
        cardBal.querySelector('.ba-currency').textContent = sym;
    }

    const pendEl = document.getElementById('balancePending');
    if (pendEl) {
        const pending = walletData.pending_balance || 0;
        pendEl.innerHTML = `En attente : <strong>${formatAmount(pending)} ${sym}</strong>`;
    }

    const avail = document.getElementById('withdrawAvail');
    if (avail) {
        avail.textContent = `${formatAmount(walletData.balance || 0)} ${sym}`;
    }

    const transferAvail = document.getElementById('transferAvail');
    if (transferAvail) {
        transferAvail.textContent = `${formatAmount(walletData.balance || 0)} ${sym}`;
    }
}
// Fin fonction renderBalance

// Début fonction computeMonthStats
async function computeMonthStats() {
    if (!walletData) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('type, amount')
        .eq('wallet_id', walletData.id)
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);

    if (!data) return;

    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift', 'bonus'];
    const income = data
        .filter(t => creditTypes.includes(t.type))
        .reduce((s, t) => s + (t.amount || 0), 0);
    const expense = data
        .filter(t => !creditTypes.includes(t.type))
        .reduce((s, t) => s + (t.amount || 0), 0);
    const sym = getCurrencySymbol(walletData.currency);

    document.getElementById('monthIncome').textContent = `${formatAmount(income)} ${sym}`;
    document.getElementById('monthExpense').textContent = `${formatAmount(expense)} ${sym}`;
}
// Fin fonction computeMonthStats

// Début fonction transferToCard
async function transferToCard() {
    if (!walletData) return;

    const amountInput = document.getElementById('transferCardAmount');
    const amount = amountInput ? parseFloat(amountInput.value) : NaN;

    if (isNaN(amount) || amount < 100) {
        showToast('Montant minimum : 100 CFA', 'warning');
        return;
    }
    if (amount > (walletData.balance || 0)) {
        showToast('Solde principal insuffisant', 'error');
        return;
    }

    showLoader();
    try {
        const ref = generateRef('TFC');
        const sym = getCurrencySymbol(walletData.currency);

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'transfer_card',
            amount: amount,
            description: `Rechargement carte virtuelle – ${formatAmount(amount)} ${sym}`,
            reference: ref,
            status: 'completed',
            created_at: new Date().toISOString()
        }]);

        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({
                balance: walletData.balance - amount,
                card_balance: (walletData.card_balance || 0) + amount
            })
            .eq('id', walletData.id);

        walletData.balance -= amount;
        walletData.card_balance = (walletData.card_balance || 0) + amount;

        renderBalance();
        closeModal('transferCardModal');
        showToast(`Carte rechargée de ${formatAmount(amount)} ${sym}`, 'success');
        await loadTransactions();
        await computeMonthStats();
    } catch (err) {
        showToast('Erreur lors du transfert', 'error');
        console.error(err);
    } finally {
        hideLoader();
    }
}
// Fin fonction transferToCard

// ============================================================
// TRANSACTIONS
// ============================================================

// Début fonction loadTransactions
async function loadTransactions() {
    if (!walletData) return;
    showTxSkeleton(true);

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(100);

    showTxSkeleton(false);

    if (error) {
        showToast('Erreur chargement transactions', 'error');
        return;
    }

    allTransactions = data || [];
    txPage = 0;
    applyFilter(currentFilter);
}
// Fin fonction loadTransactions

// Début fonction applyFilter
function applyFilter(filter) {
    currentFilter = filter;
    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift', 'bonus'];
    if (filter === 'all') {
        filteredTransactions = [...allTransactions];
    } else if (filter === 'credit') {
        filteredTransactions = allTransactions.filter(t => creditTypes.includes(t.type));
    } else {
        filteredTransactions = allTransactions.filter(t => !creditTypes.includes(t.type));
    }
    txPage = 0;
    renderTransactions();
}
// Fin fonction applyFilter

// Début fonction filterTransactions
function filterTransactions(filter, btn) {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilter(filter);
}
// Fin fonction filterTransactions

// Début fonction renderTransactions
function renderTransactions() {
    const list = document.getElementById('txList');
    const empty = document.getElementById('txEmpty');
    const loadBtn = document.getElementById('btnLoadMore');
    if (!list) return;

    list.querySelectorAll('.tx-item').forEach(el => el.remove());

    if (filteredTransactions.length === 0) {
        if (empty) empty.classList.remove('hidden');
        if (loadBtn) loadBtn.style.display = 'none';
        return;
    }
    if (empty) empty.classList.add('hidden');

    const start = 0;
    const end = Math.min(TX_PAGE_SIZE * (txPage + 1), filteredTransactions.length);
    const slice = filteredTransactions.slice(start, end);
    const sym = getCurrencySymbol(walletData?.currency);

    slice.forEach((tx, i) => {
        const item = buildTxItem(tx, sym);
        item.style.animationDelay = `${i * 0.04}s`;
        list.appendChild(item);
    });

    if (loadBtn) {
        loadBtn.style.display = end < filteredTransactions.length ? 'flex' : 'none';
    }
}
// Fin fonction renderTransactions

// Début fonction loadMoreTransactions
function loadMoreTransactions() {
    txPage++;
    renderTransactions();
}
// Fin fonction loadMoreTransactions

// Début fonction buildTxItem
function buildTxItem(tx, sym) {
    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift', 'bonus'];
    const isCredit = creditTypes.includes(tx.type);
    const iconMap = {
        credit: { icon: 'fa-arrow-down', cls: 'credit' },
        debit: { icon: 'fa-arrow-up', cls: 'debit' },
        transfer_in: { icon: 'fa-arrow-down-to-bracket', cls: 'credit' },
        transfer_out: { icon: 'fa-paper-plane', cls: 'debit' },
        deposit: { icon: 'fa-plus', cls: 'credit' },
        withdraw: { icon: 'fa-money-bill-transfer', cls: 'debit' },
        gift: { icon: 'fa-gift', cls: 'gift' },
        bonus: { icon: 'fa-star', cls: 'credit' },
        transfer_card: { icon: 'fa-credit-card', cls: 'debit' }
    };
    const iconInfo = iconMap[tx.type] || iconMap.credit;
    const amount = tx.amount || 0;
    const sign = isCredit ? '+' : '-';
    const amountClass = isCredit ? 'credit' : (tx.status === 'pending' ? 'pending' : 'debit');
    const date = formatDate(tx.created_at);

    const div = document.createElement('div');
    div.className = 'tx-item';
    div.setAttribute('data-id', tx.id);
    div.onclick = () => showTxDetail(tx);

    const statusHtml = tx.status !== 'completed'
        ? `<span class="tx-status ${tx.status}">${tx.status === 'pending' ? 'En attente' : tx.status}</span>`
        : '';

    div.innerHTML = `
        <div class="tx-icon ${iconInfo.cls}">
            <i class="fas ${iconInfo.icon}"></i>
        </div>
        <div class="tx-body">
            <div class="tx-label">${escHtml(tx.description || typeLabel(tx.type))}</div>
            <div class="tx-meta">
                <span>${date}</span>
                ${statusHtml}
                ${tx.reference ? `<span>#${escHtml(tx.reference.slice(0, 8))}</span>` : ''}
            </div>
        </div>
        <div class="tx-amount ${amountClass}">
            ${sign}${formatAmount(amount)} ${sym}
        </div>
    `;
    return div;
}
// Fin fonction buildTxItem

// Début fonction typeLabel
function typeLabel(type) {
    const map = {
        credit: 'Crédit',
        debit: 'Débit',
        transfer_in: 'Transfert reçu',
        transfer_out: 'Transfert envoyé',
        deposit: 'Rechargement',
        withdraw: 'Retrait',
        subscription: 'Abonnement',
        gift: 'Don reçu',
        bonus: 'Bonus',
        transfer_card: 'Rechargement carte'
    };
    return map[type] || type;
}
// Fin fonction typeLabel

// Début fonction showTxDetail
function showTxDetail(tx) {
    const body = document.getElementById('txDetailBody');
    const icon = document.getElementById('txDetailIcon');
    const sym = getCurrencySymbol(walletData?.currency);
    if (!body) return;

    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift', 'bonus'];
    const isCredit = creditTypes.includes(tx.type);
    const iconMap = {
        credit: { icon: 'fa-arrow-down', cls: 'credit' },
        debit: { icon: 'fa-arrow-up', cls: 'debit' },
        transfer_in: { icon: 'fa-arrow-down-to-bracket', cls: 'credit' },
        transfer_out: { icon: 'fa-paper-plane', cls: 'debit' },
        deposit: { icon: 'fa-plus', cls: 'credit' },
        withdraw: { icon: 'fa-money-bill-transfer', cls: 'debit' },
        gift: { icon: 'fa-gift', cls: 'gift' },
        bonus: { icon: 'fa-star', cls: 'credit' },
        transfer_card: { icon: 'fa-credit-card', cls: 'debit' }
    };
    const iconInfo = iconMap[tx.type] || iconMap.credit;

    if (icon) {
        icon.className = `mh-icon ${iconInfo.cls}`;
        icon.innerHTML = `<i class="fas ${iconInfo.icon}"></i>`;
    }

    const rows = [
        { label: 'Type', value: typeLabel(tx.type) },
        { label: 'Montant', value: `${isCredit ? '+' : '-'}${formatAmount(tx.amount || 0)} ${sym}` },
        { label: 'Statut', value: tx.status },
        { label: 'Description', value: tx.description || '—' },
        { label: 'Date', value: formatDate(tx.created_at, true) },
        { label: 'Référence', value: tx.reference || '—' },
        tx.sender_ref ? { label: 'De', value: tx.sender_ref } : null,
        tx.recipient_ref ? { label: 'Vers', value: tx.recipient_ref } : null
    ].filter(Boolean);

    body.innerHTML = rows.map(r => `
        <div class="tx-detail-row">
            <span class="tdr-label">${r.label}</span>
            <span class="tdr-value">${escHtml(String(r.value))}</span>
        </div>
    `).join('');

    openModal('txDetailModal');
}
// Fin fonction showTxDetail

// Début fonction showTxSkeleton
function showTxSkeleton(show) {
    const sk = document.getElementById('txSkeleton');
    if (sk) sk.style.display = show ? 'flex' : 'none';
}
// Fin fonction showTxSkeleton

// ============================================================
// EXPORT PDF
// ============================================================

// Début fonction exportTransactionsToPDF
async function exportTransactionsToPDF() {
    if (!window.jspdf) {
        showToast('Librairie PDF non chargée', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('HubISoccer - Relevé de transactions', 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 30);

    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift', 'bonus'];
    const headers = [['Date', 'Description', 'Montant']];
    const rows = filteredTransactions.map(tx => [
        formatDate(tx.created_at),
        tx.description || typeLabel(tx.type),
        `${creditTypes.includes(tx.type) ? '+' : '-'}${formatAmount(tx.amount)} ${getCurrencySymbol(walletData.currency)}`
    ]);

    doc.autoTable({ head: headers, body: rows, startY: 40 });
    doc.save(`hubisoccer_transactions_${walletData.wallet_ref}.pdf`);
    showToast('PDF généré avec succès', 'success');
}
// Fin fonction exportTransactionsToPDF

// ============================================================
// MODALES ACTIONS
// ============================================================

// Début fonction flipCard
function flipCard() {
    isCardFlipped = !isCardFlipped;
    const card = document.getElementById('hubisCard');
    if (card) card.classList.toggle('flipped', isCardFlipped);
}
// Fin fonction flipCard

// Début fonction executeTransfer
async function executeTransfer() {
    const recipientId = document.getElementById('sendRecipientId')?.value?.trim().toUpperCase();
    const amountVal = parseFloat(document.getElementById('sendAmount')?.value);
    const note = document.getElementById('sendNote')?.value?.trim() || '';
    const pin = getPinValue('sendpin');

    if (!recipientId) { showToast('Veuillez saisir un Wallet ID destinataire', 'warning'); return; }
    if (!amountVal || amountVal < 100) { showToast('Montant minimum : 100 CFA', 'warning'); return; }
    if (amountVal > (walletData?.balance || 0)) { showToast('Solde insuffisant', 'error'); return; }
    if (pin.length < 6) { showToast('Saisissez votre PIN (6 chiffres)', 'warning'); return; }
    if (recipientId === walletData?.wallet_ref) { showToast('Vous ne pouvez pas vous envoyer de fonds', 'warning'); return; }

    const pinOk = await verifyPin(pin);
    if (!pinOk) { showToast('PIN incorrect', 'error'); setPinError('sendpin'); return; }

    const { data: recipWallet, error: rwErr } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select('id, auth_uuid, hubisoccer_id, balance, status, wallet_ref')
        .eq('wallet_ref', recipientId)
        .maybeSingle();

    if (rwErr || !recipWallet) { showToast('Wallet destinataire introuvable', 'error'); return; }
    if (recipWallet.status !== 'active') { showToast('Le wallet destinataire est inactif', 'error'); return; }

    const btn = document.querySelector('.send-confirm');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>…'; }
    showLoader();

    try {
        const ref = generateRef('TRF');

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'transfer_out',
            amount: amountVal,
            description: note || `Transfert vers ${recipientId}`,
            reference: ref,
            recipient_ref: recipientId,
            sender_ref: walletData.wallet_ref,
            status: 'completed',
            created_at: new Date().toISOString()
        }]);

        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({ balance: walletData.balance - amountVal, updated_at: new Date().toISOString() })
            .eq('id', walletData.id);

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: recipWallet.id,
            type: 'transfer_in',
            amount: amountVal,
            description: note || `Transfert de ${walletData.wallet_ref}`,
            reference: ref,
            sender_ref: walletData.wallet_ref,
            recipient_ref: recipientId,
            status: 'completed',
            created_at: new Date().toISOString()
        }]);

        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({ balance: recipWallet.balance + amountVal, updated_at: new Date().toISOString() })
            .eq('id', recipWallet.id);

        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipient_hubisoccer_id: recipWallet.hubisoccer_id,
            type: 'wallet_received',
            title: '💸 Transfert reçu',
            message: `Vous avez reçu ${formatAmount(amountVal)} de ${walletData.wallet_ref}`,
            read: false,
            created_at: new Date().toISOString()
        }]);

        hideLoader();
        closeModal('sendModal');
        showToast(`${formatAmount(amountVal)} envoyé avec succès !`, 'success');

        walletData.balance -= amountVal;
        renderBalance();
        clearModalPins();
        await loadTransactions();
        await computeMonthStats();

    } catch (err) {
        console.error('Transfer error:', err);
        showToast('Erreur lors du transfert: ' + (err.message || ''), 'error');
        hideLoader();
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer'; }
    }
}
// Fin fonction executeTransfer

// Début fonction executeDeposit
async function executeDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount')?.value);
    const method = document.querySelector('input[name="payMethod"]:checked')?.value || 'card';

    if (!amount || amount < 100) { showToast('Montant minimum : 100 CFA', 'warning'); return; }

    showLoader();
    try {
        const ref = generateRef('DEP');
        const methodLabel = {
            card: 'Carte bancaire',
            transfer: 'Virement',
            mobile: 'Mobile Money',
            feexpay: 'Feexpay',
            fedaypay: 'Fedaypay'
        };

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'deposit',
            amount: amount,
            description: `Rechargement – ${methodLabel[method] || method}`,
            reference: ref,
            status: 'pending',
            created_at: new Date().toISOString()
        }]);

        const newPending = (walletData.pending_balance || 0) + amount;
        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({ pending_balance: newPending, updated_at: new Date().toISOString() })
            .eq('id', walletData.id);

        walletData.pending_balance = newPending;
        renderBalance();
        hideLoader();
        closeModal('depositModal');
        showToast(`Demande de rechargement de ${formatAmount(amount)} CFA enregistrée.`, 'success', 30000);
        await loadTransactions();

    } catch (err) {
        console.error('Deposit error:', err);
        showToast('Erreur rechargement', 'error');
        hideLoader();
    }
}
// Fin fonction executeDeposit

// Début fonction executeWithdraw
async function executeWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount')?.value);
    const method = document.querySelector('input[name="withdrawMethod"]:checked')?.value;
    const pin = getPinValue('wdpin');
    const sym = getCurrencySymbol(walletData?.currency);

    if (!amount || amount < 500) { showToast('Montant minimum : 500 CFA', 'warning'); return; }
    if (amount > (walletData?.balance || 0)) { showToast('Solde insuffisant', 'error'); return; }
    if (pin.length < 6) { showToast('Saisissez votre PIN', 'warning'); return; }

    let details = '';
    if (method === 'transfer') {
        const iban = document.getElementById('withdrawIBAN')?.value?.trim().replace(/\s/g, '');
        const bic = document.getElementById('withdrawBIC')?.value?.trim();
        const holder = document.getElementById('withdrawAccountHolder')?.value?.trim();
        if (!iban || iban.length < 15) { showToast('IBAN invalide', 'warning'); return; }
        if (!bic) { showToast('Veuillez saisir le BIC/SWIFT', 'warning'); return; }
        if (!holder) { showToast('Veuillez saisir le nom du titulaire', 'warning'); return; }
        details = `Virement - IBAN ${iban.slice(0, 4)}****${iban.slice(-4)} - BIC ${bic} - ${holder}`;
    } else if (method === 'mobile') {
        const phone = document.getElementById('withdrawMobilePhone')?.value?.trim();
        const network = document.getElementById('withdrawMobileNetwork')?.value;
        const holder = document.getElementById('withdrawMobileHolder')?.value?.trim();
        const hubID = document.getElementById('withdrawMobileHubID')?.value?.trim().toUpperCase();
        if (!phone) { showToast('Numéro de téléphone requis', 'warning'); return; }
        if (!network) { showToast('Veuillez choisir un réseau', 'warning'); return; }
        if (!holder) { showToast('Nom du titulaire requis', 'warning'); return; }
        if (!hubID) { showToast('ID HubISoccer requis', 'warning'); return; }
        details = `Mobile Money (${network}) - ${phone} - ${holder} - ID: ${hubID}`;
    } else {
        const phone = document.getElementById('withdrawEWalletPhone')?.value?.trim();
        const holder = document.getElementById('withdrawEWalletHolder')?.value?.trim();
        const email = document.getElementById('withdrawEWalletEmail')?.value?.trim();
        const hubID = document.getElementById('withdrawEWalletHubID')?.value?.trim().toUpperCase();
        if (!phone) { showToast('Numéro de téléphone / ID compte requis', 'warning'); return; }
        if (!holder) { showToast('Nom du titulaire requis', 'warning'); return; }
        if (!email) { showToast('Adresse email requise', 'warning'); return; }
        if (!hubID) { showToast('ID HubISoccer requis', 'warning'); return; }
        details = `${method.toUpperCase()} - ${phone} - ${holder} - ${email} - ID: ${hubID}`;
    }

    const pinOk = await verifyPin(pin);
    if (!pinOk) { showToast('PIN incorrect', 'error'); setPinError('wdpin'); return; }

    const btn = document.querySelector('.withdraw-confirm');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>…'; }
    showLoader();

    try {
        const ref = generateRef('WDR');
        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'withdraw',
            amount: amount,
            description: `Retrait – ${details}`,
            reference: ref,
            status: 'pending',
            created_at: new Date().toISOString()
        }]);

        const newPending = (walletData.pending_balance || 0) - amount;
        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({
                balance: walletData.balance - amount,
                pending_balance: Math.max(0, newPending),
                updated_at: new Date().toISOString()
            })
            .eq('id', walletData.id);

        walletData.balance -= amount;
        walletData.pending_balance = Math.max(0, newPending);
        renderBalance();
        hideLoader();
        closeModal('withdrawModal');
        showToast(`Retrait de ${formatAmount(amount)} ${sym} en cours de traitement.`, 'success', 30000);
        clearModalPins();
        await loadTransactions();
        await computeMonthStats();

    } catch (err) {
        console.error('Withdraw error:', err);
        showToast('Erreur retrait', 'error');
        hideLoader();
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-money-bill-transfer"></i> Retirer'; }
    }
}
// Fin fonction executeWithdraw

// ============================================================
// NOTIFICATIONS
// ============================================================

// Début fonction fetchNotifications
async function fetchNotifications() {
    if (!userProfile) return [];
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .select('*')
        .eq('recipient_hubisoccer_id', userProfile.hubisoccer_id)
        .order('created_at', { ascending: false })
        .limit(20);
    return data || [];
}
// Fin fonction fetchNotifications

// Début fonction updateNotificationBadge
async function updateNotificationBadge() {
    if (!userProfile) return;
    const { count } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_hubisoccer_id', userProfile.hubisoccer_id)
        .eq('read', false);
    notificationsUnreadCount = count || 0;
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = notificationsUnreadCount;
        badge.style.display = notificationsUnreadCount > 0 ? 'inline-block' : 'none';
    }
}
// Fin fonction updateNotificationBadge

// Début fonction renderNotificationList
async function renderNotificationList() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const notifs = await fetchNotifications();
    if (notifs.length === 0) {
        list.innerHTML = '<p class="notif-placeholder">Aucune notification</p>';
        return;
    }
    let html = '';
    notifs.forEach(n => {
        const date = formatDate(n.created_at);
        const icon = n.type === 'wallet_received' ? 'arrow-down' :
                     n.type === 'bonus_followers' ? 'star' : 'bell';
        html += `
            <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" data-title="${escHtml(n.title)}" data-message="${escHtml(n.message || '')}" data-link="${n.data?.link || ''}">
                <div class="notif-icon-small"><i class="fas fa-${icon}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${escHtml(n.title)}</div>
                    <div class="notif-message">${escHtml(n.message || '')}</div>
                    <div class="notif-time">${date}</div>
                </div>
                ${!n.read ? '<span class="unread-dot"></span>' : ''}
            </div>
        `;
    });
    list.innerHTML = html;
    document.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            await markNotificationRead(id);
            showNotificationModal(item.dataset.title, item.dataset.message, item.dataset.link);
            document.getElementById('notifDropdown').classList.remove('show');
        });
    });
}
// Fin fonction renderNotificationList

// Début fonction markNotificationRead
async function markNotificationRead(id) {
    await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('id', id);
    updateNotificationBadge();
    renderNotificationList();
}
// Fin fonction markNotificationRead

// Début fonction markAllNotificationsRead
async function markAllNotificationsRead() {
    if (!userProfile) return;
    await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', userProfile.hubisoccer_id)
        .eq('read', false);
    updateNotificationBadge();
    renderNotificationList();
    showToast('Toutes les notifications ont été marquées comme lues', 'success');
}
// Fin fonction markAllNotificationsRead

// Début fonction showNotificationModal
function showNotificationModal(title, message, link) {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;
    document.getElementById('notifModalTitle').textContent = title;
    document.getElementById('notifModalMessage').textContent = message;
    const btn = document.getElementById('notifActionBtn');
    if (link) {
        btn.style.display = 'inline-flex';
        btn.onclick = () => { window.location.href = link; };
    } else {
        btn.style.display = 'none';
    }
    openModal('notificationModal');
}
// Fin fonction showNotificationModal

// Début fonction subscribeToRealtimeNotifications
function subscribeToRealtimeNotifications() {
    if (!userProfile || notificationSubscription) return;
    notificationSubscription = supabaseClient
        .channel('notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'supabaseAuthPrive_notifications',
            filter: `recipient_hubisoccer_id=eq.${userProfile.hubisoccer_id}`
        }, payload => {
            updateNotificationBadge();
            showToast(payload.new.title, 'info', 10000);
            if (document.getElementById('notifDropdown').classList.contains('show')) {
                renderNotificationList();
            }
        })
        .subscribe();
}
// Fin fonction subscribeToRealtimeNotifications

// Début fonction initNotificationUI
function initNotificationUI() {
    const icon = document.getElementById('notifIcon');
    const dropdown = document.getElementById('notifDropdown');
    const markAll = document.getElementById('markAllReadBtn');

    if (icon) {
        icon.addEventListener('click', e => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) renderNotificationList();
        });
    }
    document.addEventListener('click', e => {
        if (!e.target.closest('.notif-wrapper')) dropdown.classList.remove('show');
    });
    if (markAll) markAll.addEventListener('click', markAllNotificationsRead);

    document.getElementById('closeNotifModal')?.addEventListener('click', () => closeModal('notificationModal'));
    document.getElementById('closeNotifModalBtn')?.addEventListener('click', () => closeModal('notificationModal'));
}
// Fin fonction initNotificationUI

// ============================================================
// PIN & UTILITAIRES MODALES
// ============================================================

// Début fonctions PIN
function initPinInputs() {
    document.querySelectorAll('.pin-box-sm').forEach(input => {
        input.addEventListener('keydown', handlePinKeydown);
        input.addEventListener('input', handlePinInput);
    });
    setupRecipientLookup();
}

function handlePinInput(e) {
    const input = e.target;
    const val = input.value.replace(/\D/g, '');
    input.value = val ? val[0] : '';
    input.classList.toggle('filled', !!input.value);
    if (input.value) {
        const group = input.dataset.group;
        const idx = parseInt(input.dataset.idx);
        const next = document.querySelector(`.pin-box-sm[data-group="${group}"][data-idx="${idx + 1}"]`);
        if (next) next.focus();
    }
}

function handlePinKeydown(e) {
    const input = e.target;
    const group = input.dataset.group;
    const idx = parseInt(input.dataset.idx);
    const all = document.querySelectorAll(`.pin-box-sm[data-group="${group}"]`);
    if (e.key === 'Backspace' && !input.value && idx > 0) {
        all[idx - 1].focus();
        all[idx - 1].value = '';
        all[idx - 1].classList.remove('filled');
    }
}

function getPinValue(group) {
    return [...document.querySelectorAll(`.pin-box-sm[data-group="${group}"]`)].map(i => i.value).join('');
}

function setPinError(group) {
    document.querySelectorAll(`.pin-box-sm[data-group="${group}"]`).forEach(i => {
        i.classList.add('error');
        setTimeout(() => i.classList.remove('error'), 600);
    });
}

function clearModalPins() {
    document.querySelectorAll('.pin-box-sm').forEach(i => {
        i.value = '';
        i.classList.remove('filled', 'error');
    });
}
// Fin fonctions PIN

// Début fonction verifyPin
async function verifyPin(pin) {
    if (!userProfile || !walletData) return false;
    const salt = `hubisoccer_${userProfile.hubisoccer_id}_wallet`;
    const data = new TextEncoder().encode(pin + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === walletData.pin_hash;
}
// Fin fonction verifyPin

// Début fonction generateRef
function generateRef(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rnd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${rnd}-${Date.now().toString(36).toUpperCase()}`;
}
// Fin fonction generateRef

// Début fonction setupRecipientLookup
let lookupTimeout = null;
function setupRecipientLookup() {
    const input = document.getElementById('sendRecipientId');
    if (!input) return;
    input.addEventListener('input', () => {
        clearTimeout(lookupTimeout);
        const val = input.value.trim().toUpperCase();
        const preview = document.getElementById('recipientPreview');
        if (preview) preview.classList.add('hidden');
        if (val.length < 15) return;
        lookupTimeout = setTimeout(() => lookupRecipient(val), 600);
    });
}

async function lookupRecipient(walletRef) {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select('hubisoccer_id, status, supabaseAuthPrive_profiles!inner(full_name, avatar_url, role_code)')
        .eq('wallet_ref', walletRef)
        .eq('status', 'active')
        .maybeSingle();

    const preview = document.getElementById('recipientPreview');
    if (!data || !preview) return;

    const profile = data.supabaseAuthPrive_profiles;
    if (!profile) return;

    document.getElementById('rpName').textContent = profile.full_name || 'Utilisateur';
    document.getElementById('rpRole').textContent = ROLE_LABEL[profile.role_code] || profile.role_code;
    const av = preview.querySelector('.rp-avatar');
    if (av) {
        if (profile.avatar_url) av.innerHTML = `<img src="${profile.avatar_url}" alt="">`;
        else av.innerHTML = `<i class="fas fa-user"></i>`;
    }
    preview.classList.remove('hidden');
}
// Fin fonction setupRecipientLookup

// Début fonction formatIBAN
function formatIBAN(input) {
    let val = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    input.value = val.match(/.{1,4}/g)?.join(' ') || val;
}
// Fin fonction formatIBAN

// Début fonction setDepositAmount
function setDepositAmount(val) {
    const inp = document.getElementById('depositAmount');
    if (inp) inp.value = val;
    document.querySelectorAll('.da-btn').forEach(b => {
        b.classList.toggle('selected', parseInt(b.textContent) === val);
    });
}
// Fin fonction setDepositAmount

// Début fonction initPaymentMethodCards
function initPaymentMethodCards() {
    document.querySelectorAll('.pm-card').forEach(card => {
        card.addEventListener('click', function () {
            const group = this.closest('.pm-list');
            if (group) {
                group.querySelectorAll('.pm-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            }
        });
    });
}
// Fin fonction initPaymentMethodCards

// Début fonction toggleWithdrawFields
function toggleWithdrawFields() {
    const method = document.querySelector('input[name="withdrawMethod"]:checked')?.value;
    const transferFields = document.getElementById('transferFields');
    const mobileFields = document.getElementById('mobileMoneyFields');
    const eWalletFields = document.getElementById('eWalletFields');

    if (transferFields) transferFields.style.display = method === 'transfer' ? 'block' : 'none';
    if (mobileFields) mobileFields.style.display = method === 'mobile' ? 'block' : 'none';
    if (eWalletFields) eWalletFields.style.display = (method === 'feexpay' || method === 'fedaypay') ? 'block' : 'none';
}
// Fin fonction toggleWithdrawFields

// Début fonction initWithdrawMethodListeners
function initWithdrawMethodListeners() {
    document.querySelectorAll('input[name="withdrawMethod"]').forEach(radio => {
        radio.addEventListener('change', toggleWithdrawFields);
    });
    toggleWithdrawFields();
}
// Fin fonction initWithdrawMethodListeners

// Début fonction openModal
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Si on ouvre la modale de retrait, forcer la mise à jour des champs
  if (id === 'withdrawModal') {
    // Attendre que la modale soit rendue, puis exécuter
    setTimeout(() => {
      toggleWithdrawFields();
    }, 50);
  }
}
// Fin fonction openModal

// Début fonction copyField
function copyField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => showToast('Copié !', 'success'));
}
// Fin fonction copyField

// Début fonction refreshData
async function refreshData() {
    const icon = document.getElementById('refreshIcon');
    if (icon) icon.closest('button').classList.add('spinning');
    await loadWallet();
    if (walletData) {
        renderCard();
        renderBalance();
        await loadBonusData();
        await loadTransactions();
        await computeMonthStats();
        updateNotificationBadge();
    }
    if (icon) icon.closest('button').classList.remove('spinning');
    showToast('Données actualisées', 'success');
}
// Fin fonction refreshData

// Début fonction openSettings
function openSettings() {
    openModal('settingsModal');
}
// Fin fonction openSettings

// Début fonction confirmSuspendWallet
async function confirmSuspendWallet() {
    if (confirm('Êtes-vous sûr de vouloir suspendre votre wallet ? Toutes les transactions seront bloquées.')) {
        await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', walletData.id);
        showToast('Wallet suspendu. Contactez le support pour le réactiver.', 'warning', 30000);
        closeModal('settingsModal');
    }
}
// Fin fonction confirmSuspendWallet

// ============================================================
// INITIALISATION PRINCIPALE
// ============================================================

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    initUserMenu();
    initPaymentMethodCards();
    initWithdrawMethodListeners();
    initNotificationUI();

    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    const wallet = await loadWallet();
    if (!wallet) return;

    renderCard();
    renderBalance();
    initPinInputs();

    await loadBonusData();
    await loadTransactions();
    await computeMonthStats();

    await updateNotificationBadge();
    await renderNotificationList();
    subscribeToRealtimeNotifications();

    // Exposer les fonctions globales
    window.flipCard = flipCard;
    window.filterTransactions = filterTransactions;
    window.loadMoreTransactions = loadMoreTransactions;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.closeModalOutside = closeModalOutside;
    window.executeTransfer = executeTransfer;
    window.executeDeposit = executeDeposit;
    window.executeWithdraw = executeWithdraw;
    window.setDepositAmount = setDepositAmount;
    window.formatIBAN = formatIBAN;
    window.copyField = copyField;
    window.refreshData = refreshData;
    window.openSettings = openSettings;
    window.confirmSuspendWallet = confirmSuspendWallet;
    window.showToast = showToast;
    window.withdrawBonus = withdrawBonus;
    window.transferToCard = transferToCard;
    window.exportTransactionsToPDF = exportTransactionsToPDF;
});
// Fin initialisation