/* ============================================================
   HubISoccer — parrain-dons-setup.js
   Configuration du HubIS Wallet – Parrain
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
// Fin état global

// Début mapping des rôles
const ROLE_LABEL = {
    FOOT:'⚽ Footballeur',
    BASK:'🏀 Basketteur',
    TENN:'🎾 Tennisman',
    ATHL:'🏃 Athlète',
    HANDB:'🤾 Handballeur',
    VOLL:'🏐 Volleyeur',
    RUGBY:'🏉 Rugbyman',
    NATA:'🏊 Nageur',
    ARTSM:'🥋 Arts martiaux',
    CYCL:'🚴 Cycliste',
    CHAN:'🎤 Chanteur',
    DANS:'💃 Danseur',
    COMP:'🎼 Compositeur',
    ACIN:'🎬 Acteur cinéma',
    ATHE:'🎭 Acteur théâtre',
    HUMO:'🎙️ Humoriste',
    SLAM:'🗣️ Slameur',
    DJ:'🎧 DJ / Producteur',
    CIRQ:'🤹 Artiste de cirque',
    VISU:'🎨 Artiste visuel',
    PARRAIN:'🤝 Parrain',
    AGENT:'💼 Agent FIFA',
    COACH:'📋 Coach',
    MEDIC:'⚕️ Staff médical',
    ARBIT:'🏁 Corps arbitral',
    ACAD:'🏫 Académie sportive',
    FORM:'🎓 Formateur',
    TOURN:'🏆 Gestionnaire tournoi',
    ADMIN:'🛡️ Administrateur'
};
const ROLE_EMOJI = {
    FOOT:'⚽',
    BASK:'🏀',
    TENN:'🎾',
    ATHL:'🏃',
    HANDB:'🤾',
    VOLL:'🏐',
    RUGBY:'🏉',
    NATA:'🏊',
    ARTSM:'🥋',
    CYCL:'🚴',
    CHAN:'🎤',
    DANS:'💃',
    COMP:'🎼',
    ACIN:'🎬',
    ATHE:'🎭',
    HUMO:'🎙️',
    SLAM:'🗣️',
    DJ:'🎧',
    CIRQ:'🤹',
    VISU:'🎨',
    PARRAIN:'🤝',
    AGENT:'💼',
    COACH:'📋',
    MEDIC:'⚕️',
    ARBIT:'🏁',
    ACAD:'🏫',
    FORM:'🎓',
    TOURN:'🏆',
    ADMIN:'🛡️'
};
// Fin mapping des rôles

// Début liste des langues
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
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
    const container = document.getElementById('toastContainer');
    if (!container) {
        return;
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
                      '<div class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></div>';
    container.appendChild(toast);
    setTimeout(function() {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}
// Fin fonctions utilitaires

// ============================================================
// SESSION
// ============================================================

// Début fonction checkSession
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

// Début fonction updateNavbarAvatar
function updateNavbarAvatar() {
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const userName = document.getElementById('userName');

    if (!userProfile) {
        return;
    }

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Parrain';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) {
            userAvatar.src = avatarUrl;
            userAvatar.style.display = 'block';
        }
        if (userInitials) {
            userInitials.style.display = 'none';
        }
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'P');
        if (userInitials) {
            userInitials.textContent = initials;
            userInitials.style.display = 'flex';
        }
        if (userAvatar) {
            userAvatar.style.display = 'none';
        }
    }
}
// Fin fonction updateNavbarAvatar

// Début fonction checkExistingWallet
async function checkExistingWallet() {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select('wallet_ref, status')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();
    if (data && data.status === 'active') {
        showToast('Wallet déjà configuré. Redirection…', 'success');
        setTimeout(function() {
            window.location.href = 'parrain-dons.html';
        }, 1500);
        return true;
    }
    return false;
}
// Fin fonction checkExistingWallet

// ============================================================
// AFFICHAGE INITIAL
// ============================================================

// Début fonction displayUserInfo
function displayUserInfo() {
    const nameEl = document.getElementById('idName');
    const roleEl = document.getElementById('idRole');
    const badgeEl = document.getElementById('idBadge');
    const avatarEl = document.getElementById('idAvatar');

    if (nameEl) {
        nameEl.textContent = userProfile.full_name || 'Parrain';
    }
    if (roleEl) {
        roleEl.textContent = ROLE_LABEL[userProfile.role_code] || userProfile.role_code;
    }
    if (badgeEl) {
        badgeEl.textContent = ROLE_EMOJI[userProfile.role_code] || '🤝';
    }
    if (avatarEl) {
        if (userProfile.avatar_url) {
            avatarEl.innerHTML = '<img src="' + userProfile.avatar_url + '" alt="Avatar">';
        } else {
            avatarEl.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
}
// Fin fonction displayUserInfo

// Début fonction populateLanguageSelect
function populateLanguageSelect() {
    const select = document.getElementById('languageSelect');
    if (!select) {
        return;
    }
    select.innerHTML = '';
    LANGUAGES.forEach(function(lang) {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.flag + ' ' + lang.name;
        select.appendChild(option);
    });
    const savedLang = userProfile?.interface_language || 'fr';
    select.value = savedLang;
}
// Fin fonction populateLanguageSelect

// Début fonction populateCurrencySelect
function populateCurrencySelect() {
    const container = document.getElementById('currencyGrid');
    if (!container) {
        return;
    }
    container.innerHTML = '';
    CURRENCIES.forEach(function(curr) {
        const card = document.createElement('label');
        card.className = 'currency-card';
        card.setAttribute('data-code', curr.code);
        card.innerHTML = '<input type="radio" name="currency" value="' + curr.code + '">' +
                         '<span class="cc-symbol">' + curr.symbol + '</span>' +
                         '<span class="cc-code">' + curr.code + '</span>' +
                         '<span class="cc-name">' + curr.name + '</span>' +
                         '<div class="cc-check"><i class="fas fa-check"></i></div>';
        container.appendChild(card);
    });
    const defaultCard = container.querySelector('[data-code="XOF"]') || container.querySelector('[data-code="EUR"]');
    if (defaultCard) {
        defaultCard.classList.add('selected');
        defaultCard.querySelector('input').checked = true;
    }
}
// Fin fonction populateCurrencySelect

// ============================================================
// WIZARD (ÉTAPES)
// ============================================================

// Début fonction goToStep
function goToStep(step) {
    document.querySelectorAll('.step-panel').forEach(function(p) {
        p.classList.remove('active');
    });
    const target = document.getElementById(step === 'success' ? 'stepSuccess' : 'step' + step);
    if (target) {
        target.classList.add('active');
    }
    for (let i = 1; i <= 3; i++) {
        const node = document.getElementById('pnode' + i);
        if (!node) {
            continue;
        }
        node.classList.remove('active', 'done');
        if (i < step) {
            node.classList.add('done');
        }
        if (i === step) {
            node.classList.add('active');
        }
    }
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = PROGRESS_MAP[step] + '%';
    }
    const counter = document.getElementById('stepCounterText');
    if (counter) {
        counter.textContent = (typeof step === 'number') ? 'Étape ' + step + ' sur 3' : '✓ Terminé';
    }
    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// Fin fonction goToStep

// Début fonction initRadioCards
function initRadioCards() {
    document.querySelectorAll('.radio-card').forEach(function(card) {
        card.addEventListener('click', function() {
            const group = this.closest('.radio-cards');
            if (group) {
                group.querySelectorAll('.radio-card').forEach(function(c) {
                    c.classList.remove('selected');
                });
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
            }
        });
    });
    document.querySelectorAll('.currency-card').forEach(function(card) {
        card.addEventListener('click', function() {
            const grid = document.getElementById('currencyGrid');
            if (grid) {
                grid.querySelectorAll('.currency-card').forEach(function(c) {
                    c.classList.remove('selected');
                });
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
            }
        });
    });
}
// Fin fonction initRadioCards

// ============================================================
// PIN
// ============================================================

// Début fonctions PIN
function initPinInputs() {
    document.querySelectorAll('.pin-box').forEach(function(input) {
        input.addEventListener('keydown', handlePinKeydown);
        input.addEventListener('input', handlePinInput);
        input.addEventListener('paste', handlePinPaste);
    });
}

function handlePinInput(e) {
    const input = e.target;
    const val = input.value.replace(/\D/g, '');
    input.value = val ? val[0] : '';
    if (val) {
        input.classList.add('filled');
    } else {
        input.classList.remove('filled');
    }
    if (input.value) {
        const group = input.dataset.group;
        const idx = parseInt(input.dataset.idx);
        const next = document.querySelector('.pin-box[data-group="' + group + '"][data-idx="' + (idx + 1) + '"]');
        if (next) {
            next.focus();
        }
    }
}

function handlePinKeydown(e) {
    const input = e.target;
    const group = input.dataset.group;
    const idx = parseInt(input.dataset.idx);
    if (e.key === 'Backspace' && !input.value && idx > 0) {
        const prev = document.querySelector('.pin-box[data-group="' + group + '"][data-idx="' + (idx - 1) + '"]');
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
    const inputs = document.querySelectorAll('.pin-box[data-group="' + group + '"]');
    for (let i = 0; i < Math.min(text.length, 6); i++) {
        if (inputs[i]) {
            inputs[i].value = text[i];
            inputs[i].classList.add('filled');
        }
    }
}

function getPinValue(group) {
    const inputs = document.querySelectorAll('.pin-box[data-group="' + group + '"]');
    let value = '';
    inputs.forEach(function(i) {
        value += i.value;
    });
    return value;
}

function setPinError(group) {
    document.querySelectorAll('.pin-box[data-group="' + group + '"]').forEach(function(i) {
        i.classList.add('error');
        setTimeout(function() {
            i.classList.remove('error');
        }, 600);
    });
}
// Fin fonctions PIN

// Début fonction hashPin
async function hashPin(pin) {
    const salt = 'hubisoccer_' + userProfile.hubisoccer_id + '_wallet';
    const data = new TextEncoder().encode(pin + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
    return hashHex;
}
// Fin fonction hashPin

// Début fonction generateWalletRef
function generateWalletRef(roleCode) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function seg() {
        let s = '';
        for (let i = 0; i < 4; i++) {
            s += chars[Math.floor(Math.random() * chars.length)];
        }
        return s;
    }
    const roleTag = (roleCode || 'USR').slice(0, 4).toUpperCase().padEnd(4, 'X');
    return 'HIS-' + roleTag + '-' + seg() + '-' + seg();
}
// Fin fonction generateWalletRef

// ============================================================
// ACTIVATION DU WALLET
// ============================================================

// Début fonction activateWallet
async function activateWallet() {
    const pin = getPinValue('create');
    const pinConf = getPinValue('confirm');
    const pinHint = document.getElementById('pinHint');
    const cgu = document.getElementById('acceptCGU');

    if (pin.length < 6) {
        showToast('Veuillez saisir un PIN de 6 chiffres', 'warning');
        setPinError('create');
        return;
    }
    if (pinConf.length < 6) {
        showToast('Veuillez confirmer votre PIN', 'warning');
        setPinError('confirm');
        return;
    }
    if (pin !== pinConf) {
        if (pinHint) {
            pinHint.textContent = 'Les deux PIN ne correspondent pas.';
        }
        setPinError('create');
        setPinError('confirm');
        showToast('Les PIN ne correspondent pas', 'error');
        return;
    }
    if (!cgu || !cgu.checked) {
        showToast('Veuillez accepter les CGU', 'warning');
        return;
    }
    if (!userProfile) {
        showToast('Session expirée', 'error');
        return;
    }

    if (pinHint) {
        pinHint.textContent = '';
    }

    const btn = document.querySelector('.btn-activate');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activation…';
    }
    showLoader();

    try {
        const pinHash = await hashPin(pin);
        const accountType = document.querySelector('input[name="accountType"]:checked');
        const accountTypeValue = accountType ? accountType.value : 'personnel';
        const currencyRadio = document.querySelector('input[name="currency"]:checked');
        const currency = currencyRadio ? currencyRadio.value : 'XOF';
        const walletRef = generateWalletRef(userProfile.role_code);
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
                card_balance: 0,
                currency: currency,
                account_type: accountTypeValue,
                pin_hash: pinHash,
                status: 'active',
                expiry_date: expiryDate.toISOString().split('T')[0],
                created_at: new Date().toISOString()
            }]);

        if (insertError) {
            throw insertError;
        }

        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipient_hubisoccer_id: userProfile.hubisoccer_id,
            type: 'wallet_created',
            title: '🎉 HubIS Wallet activé !',
            message: 'Votre wallet ' + walletRef + ' est maintenant actif.',
            read: false,
            created_at: new Date().toISOString()
        }]);

        hideLoader();
        const walletDisplay = document.getElementById('walletIdDisplay');
        if (walletDisplay) {
            walletDisplay.textContent = walletRef;
        }
        goToStep('success');

    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'activation: ' + err.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-rocket"></i> Activer mon wallet';
        }
        hideLoader();
    }
}
// Fin fonction activateWallet

// Début fonction goToDashboard
function goToDashboard() {
    window.location.href = 'parrain-dons.html';
}
// Fin fonction goToDashboard

// Début fonction copyWalletId
function copyWalletId() {
    const display = document.getElementById('walletIdDisplay');
    const id = display ? display.textContent : '';
    if (!id) {
        return;
    }
    navigator.clipboard.writeText(id).then(function() {
        showToast('Wallet ID copié !', 'success');
    });
}
// Fin fonction copyWalletId

// ============================================================
// CGU
// ============================================================

// Début fonctions CGU
function openCGU(e) {
    e.preventDefault();
    const modal = document.getElementById('cguModal');
    if (modal) {
        modal.classList.add('open');
    }
}

function closeCGU(e) {
    if (e.target === document.getElementById('cguModal')) {
        const modal = document.getElementById('cguModal');
        if (modal) {
            modal.classList.remove('open');
        }
    }
}

function acceptCGUFromModal() {
    const cguCheck = document.getElementById('acceptCGU');
    if (cguCheck) {
        cguCheck.checked = true;
    }
    const modal = document.getElementById('cguModal');
    if (modal) {
        modal.classList.remove('open');
    }
    showToast('CGU acceptées', 'success');
}
// Fin fonctions CGU

// ============================================================
// NAVBAR ET SIDEBAR
// ============================================================

// Début fonction initSidebar
function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('active');
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', openSidebar);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 55;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) <= Math.abs(dy)) {
            return;
        }
        if (Math.abs(dx) < SWIPE_THRESHOLD) {
            return;
        }

        if (e.cancelable) {
            e.preventDefault();
        }

        if (dx > 0 && touchStartX < 40) {
            openSidebar();
        } else if (dx < 0) {
            closeSidebar();
        }
    }, { passive: false });
}
// Fin fonction initSidebar

// Début fonction initUserMenu
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) {
        return;
    }

    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}
// Fin fonction initUserMenu

// ============================================================
// INITIALISATION
// ============================================================

// Début initialisation
document.addEventListener('DOMContentLoaded', async function() {
    initSidebar();
    initUserMenu();

    const user = await checkSession();
    if (!user) {
        return;
    }

    await loadProfile();
    if (!userProfile) {
        return;
    }

    const hasWallet = await checkExistingWallet();
    if (hasWallet) {
        return;
    }

    displayUserInfo();
    populateLanguageSelect();
    populateCurrencySelect();
    initPinInputs();
    initRadioCards();

    // Mise à jour du badge de notifications (placeholder)
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.style.display = 'none';
    }

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