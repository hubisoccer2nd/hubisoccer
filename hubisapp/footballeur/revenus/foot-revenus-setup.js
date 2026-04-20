/* ============================================================
   HubISoccer — foot-revenus-setup.js
   Configuration du HubIS Wallet
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
let currentStep = 1;
let generatedWalletId = null;

const PROGRESS_MAP = { 1: 0, 2: 50, 3: 85 };

// Début mapping des rôles pour affichage
const ROLE_LABEL = {
    FOOT:'⚽ Footballeur', BASK:'🏀 Basketteur', TENN:'🎾 Tennisman',
    ATHL:'🏃 Athlète', HANDB:'🤾 Handballeur', VOLL:'🏐 Volleyeur',
    RUGBY:'🏉 Rugbyman', NATA:'🏊 Nageur', ARTSM:'🥋 Arts martiaux',
    CYCL:'🚴 Cycliste', CHAN:'🎤 Chanteur', DANS:'💃 Danseur',
    COMP:'🎼 Compositeur', ACIN:'🎬 Acteur cinéma', ATHE:'🎭 Acteur théâtre',
    HUMO:'🎙️ Humoriste', SLAM:'🗣️ Slameur', DJ:'🎧 DJ / Producteur',
    CIRQ:'🤹 Artiste de cirque', VISU:'🎨 Artiste visuel',
    PARRAIN:'🤝 Parrain', AGENT:'💼 Agent FIFA', COACH:'📋 Coach',
    MEDIC:'⚕️ Staff médical', ARBIT:'🏁 Corps arbitral',
    ACAD:'🏫 Académie sportive', FORM:'🎓 Formateur', TOURN:'🏆 Gestionnaire tournoi',
    ADMIN:'🛡️ Administrateur'
};
const ROLE_EMOJI = {
    FOOT:'⚽', BASK:'🏀', TENN:'🎾', ATHL:'🏃', HANDB:'🤾', VOLL:'🏐',
    RUGBY:'🏉', NATA:'🏊', ARTSM:'🥋', CYCL:'🚴', CHAN:'🎤', DANS:'💃',
    COMP:'🎼', ACIN:'🎬', ATHE:'🎭', HUMO:'🎙️', SLAM:'🗣️', DJ:'🎧',
    CIRQ:'🤹', VISU:'🎨', PARRAIN:'🤝', AGENT:'💼', COACH:'📋',
    MEDIC:'⚕️', ARBIT:'🏁', ACAD:'🏫', FORM:'🎓', TOURN:'🏆', ADMIN:'🛡️'
};
// Fin mapping des rôles

// Début liste des 24 langues (identique à la navbar du dashboard)
const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'fon', name: 'Fon', flag: '🇧🇯' },
    { code: 'mina', name: 'Mina', flag: '🇹🇬' },
    { code: 'lin', name: 'Lingala', flag: '🇨🇬' },
    { code: 'wol', name: 'Wolof', flag: '🇸🇳' },
    { code: 'diou', name: 'Dioula', flag: '🇨🇮' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
];
// Fin liste des langues

// Début liste complète des devises du monde (ISO 4217)
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

// Début fonctions utilitaires (loader, toast)
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info', duration = 8000) {
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
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}
// Fin fonctions utilitaires

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
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
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction checkExistingWallet
async function checkExistingWallet() {
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select('wallet_ref, status')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();
    if (data && data.status === 'active') {
        showToast('Wallet déjà configuré. Redirection…', 'success');
        setTimeout(() => window.location.href = 'foot-revenus.html', 1500);
        return true;
    }
    return false;
}
// Fin fonction checkExistingWallet

// Début fonction displayUserInfo
function displayUserInfo() {
    document.getElementById('idName').textContent = userProfile.full_name || 'Utilisateur';
    document.getElementById('idRole').textContent = ROLE_LABEL[userProfile.role_code] || userProfile.role_code;
    document.getElementById('idBadge').textContent = ROLE_EMOJI[userProfile.role_code] || '👤';
    const avatarEl = document.getElementById('idAvatar');
    if (userProfile.avatar_url) {
        avatarEl.innerHTML = `<img src="${userProfile.avatar_url}" alt="Avatar">`;
    } else {
        avatarEl.innerHTML = `<i class="fas fa-user"></i>`;
    }
}
// Fin fonction displayUserInfo

// Début fonction populateLanguageSelect
function populateLanguageSelect() {
    const select = document.getElementById('languageSelect');
    if (!select) return;
    LANGUAGES.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = `${lang.flag} ${lang.name}`;
        select.appendChild(option);
    });
    // Définir la langue par défaut depuis le profil ou 'fr'
    const savedLang = userProfile?.interface_language || 'fr';
    select.value = savedLang;
}
// Fin fonction populateLanguageSelect

// Début fonction populateCurrencySelect
function populateCurrencySelect() {
    const container = document.getElementById('currencyGrid');
    if (!container) return;
    container.innerHTML = '';
    CURRENCIES.forEach(curr => {
        const card = document.createElement('label');
        card.className = 'currency-card';
        card.setAttribute('data-code', curr.code);
        card.innerHTML = `
            <input type="radio" name="currency" value="${curr.code}">
            <span class="cc-symbol">${curr.symbol}</span>
            <span class="cc-code">${curr.code}</span>
            <span class="cc-name">${curr.name}</span>
            <div class="cc-check"><i class="fas fa-check"></i></div>
        `;
        container.appendChild(card);
    });
    // Présélectionner EUR
    const eurCard = container.querySelector('[data-code="EUR"]');
    if (eurCard) {
        eurCard.classList.add('selected');
        eurCard.querySelector('input').checked = true;
    }
}
// Fin fonction populateCurrencySelect

// Début fonction goToStep
function goToStep(step) {
    // Masquer toutes les étapes
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    // Afficher l'étape demandée
    const target = document.getElementById(`step${step}`);
    if (target) target.classList.add('active');

    // Mettre à jour les nœuds de progression
    for (let i = 1; i <= 3; i++) {
        const node = document.getElementById(`pnode${i}`);
        if (!node) continue;
        node.classList.remove('active', 'done');
        if (i < step) node.classList.add('done');
        if (i === step) node.classList.add('active');
    }

    // Mettre à jour la barre de progression
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = PROGRESS_MAP[step] + '%';

    // Mettre à jour le compteur
    const counter = document.getElementById('stepCounterText');
    if (counter) counter.textContent = `Étape ${step} sur 3`;

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// Fin fonction goToStep

// Début fonction initRadioCards
function initRadioCards() {
    // Cartes de type de compte
    document.querySelectorAll('.radio-card').forEach(card => {
        card.addEventListener('click', function() {
            const group = this.closest('.radio-cards');
            group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
    // Cartes de devise
    document.querySelectorAll('.currency-card').forEach(card => {
        card.addEventListener('click', function() {
            const grid = document.getElementById('currencyGrid');
            grid.querySelectorAll('.currency-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}
// Fin fonction initRadioCards

// Début fonctions PIN
function initPinInputs() {
    document.querySelectorAll('.pin-box').forEach(input => {
        input.addEventListener('keydown', handlePinKeydown);
        input.addEventListener('input', handlePinInput);
        input.addEventListener('paste', handlePinPaste);
    });
}

function handlePinInput(e) {
    const input = e.target;
    const val = input.value.replace(/\D/g, '');
    input.value = val ? val[0] : '';
    input.classList.toggle('filled', !!input.value);
    if (input.value) {
        const group = input.dataset.group;
        const idx = parseInt(input.dataset.idx);
        const next = document.querySelector(`.pin-box[data-group="${group}"][data-idx="${idx + 1}"]`);
        if (next) next.focus();
    }
}

function handlePinKeydown(e) {
    const input = e.target;
    const group = input.dataset.group;
    const idx = parseInt(input.dataset.idx);
    if (e.key === 'Backspace' && !input.value && idx > 0) {
        const prev = document.querySelector(`.pin-box[data-group="${group}"][data-idx="${idx - 1}"]`);
        if (prev) {
            prev.focus();
            prev.value = '';
            prev.classList.remove('filled');
        }
    }
}

function handlePinPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    const group = e.target.dataset.group;
    const inputs = document.querySelectorAll(`.pin-box[data-group="${group}"]`);
    [...text.slice(0, 6)].forEach((char, i) => {
        if (inputs[i]) {
            inputs[i].value = char;
            inputs[i].classList.add('filled');
        }
    });
}

function getPinValue(group) {
    return [...document.querySelectorAll(`.pin-box[data-group="${group}"]`)].map(i => i.value).join('');
}

function setPinError(group) {
    document.querySelectorAll(`.pin-box[data-group="${group}"]`).forEach(i => {
        i.classList.add('error');
        setTimeout(() => i.classList.remove('error'), 600);
    });
}
// Fin fonctions PIN

// Début fonction hashPin
async function hashPin(pin) {
    const salt = `hubisoccer_${userProfile.hubisoccer_id}_wallet`;
    const data = new TextEncoder().encode(pin + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
// Fin fonction hashPin

// Début fonction generateWalletRef
function generateWalletRef(roleCode, hubisoccerId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const roleTag = (roleCode || 'USR').slice(0, 4).toUpperCase().padEnd(4, 'X');
    return `HIS-${roleTag}-${seg()}-${seg()}`;
}
// Fin fonction generateWalletRef

// Début fonction activateWallet
async function activateWallet() {
    const pin = getPinValue('create');
    const pinConf = getPinValue('confirm');
    const pinHint = document.getElementById('pinHint');
    const cgu = document.getElementById('acceptCGU');

    if (pin.length < 6) { showToast('Veuillez saisir un PIN de 6 chiffres', 'warning'); setPinError('create'); return; }
    if (pinConf.length < 6) { showToast('Veuillez confirmer votre PIN', 'warning'); setPinError('confirm'); return; }
    if (pin !== pinConf) { pinHint.textContent = 'Les deux PIN ne correspondent pas.'; setPinError('create'); setPinError('confirm'); showToast('Les PIN ne correspondent pas', 'error'); return; }
    if (!cgu?.checked) { showToast('Veuillez accepter les CGU pour continuer', 'warning'); return; }
    if (!userProfile) { showToast('Session expirée', 'error'); return; }

    pinHint.textContent = '';
    const btn = document.querySelector('.btn-activate');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activation…';
    showLoader();

    try {
        const pinHash = await hashPin(pin);
        const accountType = document.querySelector('input[name="accountType"]:checked')?.value || 'personnel';
        const currency = document.querySelector('input[name="currency"]:checked')?.value || 'EUR';
        const walletRef = generateWalletRef(userProfile.role_code, userProfile.hubisoccer_id);
        generatedWalletId = walletRef;

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 4);

        const { error: insertError } = await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .insert([{
                auth_uuid: currentUser.id,
                hubisoccer_id: userProfile.hubisoccer_id,
                wallet_ref: walletRef,
                balance: 0,
                pending_balance: 0,
                currency: currency,
                account_type: accountType,
                pin_hash: pinHash,
                status: 'active',
                expiry_date: expiryDate.toISOString().split('T')[0],
                created_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        // Notification de bienvenue
        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipient_hubisoccer_id: userProfile.hubisoccer_id,
            type: 'wallet_created',
            title: '🎉 HubIS Wallet activé !',
            message: `Votre wallet ${walletRef} est maintenant actif.`,
            read: false,
            created_at: new Date().toISOString()
        }]);

        hideLoader();
        document.getElementById('walletIdDisplay').textContent = walletRef;
        goToStep('success');

    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'activation: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rocket"></i> Activer mon wallet';
        hideLoader();
    }
}
// Fin fonction activateWallet

// Début fonction goToDashboard
function goToDashboard() {
    window.location.href = 'foot-revenus.html';
}
// Fin fonction goToDashboard

// Début fonction copyWalletId
function copyWalletId() {
    const id = document.getElementById('walletIdDisplay')?.textContent;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => showToast('Wallet ID copié !', 'success'));
}
// Fin fonction copyWalletId

// Début fonction openCGU
function openCGU(e) {
    e.preventDefault();
    document.getElementById('cguModal').classList.add('open');
}
// Fin fonction openCGU

// Début fonction closeCGU
function closeCGU(e) {
    if (e.target === document.getElementById('cguModal')) {
        document.getElementById('cguModal').classList.remove('open');
    }
}
// Fin fonction closeCGU

// Début fonction acceptCGUFromModal
function acceptCGUFromModal() {
    document.getElementById('acceptCGU').checked = true;
    document.getElementById('cguModal').classList.remove('open');
    showToast('CGU acceptées', 'success');
}
// Fin fonction acceptCGUFromModal

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    const hasWallet = await checkExistingWallet();
    if (hasWallet) return;

    displayUserInfo();
    populateLanguageSelect();
    populateCurrencySelect();
    initPinInputs();
    initRadioCards();

    // Exposer les fonctions globales
    window.goToStep = goToStep;
    window.activateWallet = activateWallet;
    window.goToDashboard = goToDashboard;
    window.copyWalletId = copyWalletId;
    window.openCGU = openCGU;
    window.closeCGU = closeCGU;
    window.acceptCGUFromModal = acceptCGUFromModal;
});
// Fin initialisation
