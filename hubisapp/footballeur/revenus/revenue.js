/* ============================================================
   HubISoccer — revenue.js
   Dashboard principal du HubIS Wallet
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
let allTransactions = [];
let filteredTransactions = [];
let txPage = 0;
const TX_PAGE_SIZE = 15;
let currentFilter = 'all';
let isCardFlipped = false;
// Fin état global

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

// Début liste des devises (identique à revenue-setup.js)
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

function formatAmount(amount) {
    return Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCurrencySymbol(currencyCode) {
    const curr = CURRENCIES.find(c => c.code === currencyCode);
    return curr ? curr.symbol : currencyCode;
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
        setTimeout(() => window.location.href = 'revenue-setup.html', 1500);
        return null;
    }
    if (data.status === 'suspended') {
        showToast('Votre wallet est suspendu. Contactez le support.', 'error');
    }
    walletData = data;
    return walletData;
}
// Fin fonction loadWallet

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

    document.getElementById('cardHolderName').textContent = (userProfile.full_name || 'UTILISATEUR').toUpperCase().slice(0, 22);
    document.getElementById('cardNumber').textContent = maskedNum;
    document.getElementById('cardRoleBadge').textContent = ROLE_EMOJI[userProfile.role_code] || '👤';
    document.getElementById('cardBackId').textContent = ref;

    if (walletData.expiry_date) {
        const d = new Date(walletData.expiry_date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        document.getElementById('cardExpiry').textContent = `${mm}/${yy}`;
    }

    // Couleur de la carte selon le rôle
    const card = document.getElementById('hubisCard');
    const role = userProfile.role_code;
    const sportRoles = ['FOOT','BASK','TENN','ATHL','HANDB','VOLL','RUGBY','NATA','ARTSM','CYCL'];
    const artRoles = ['CHAN','DANS','COMP','ACIN','ATHE','HUMO','SLAM','DJ','CIRQ','VISU'];
    const proRoles = ['PARRAIN','AGENT','COACH','MEDIC','ARBIT','ACAD','FORM','TOURN','ADMIN'];

    if (sportRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #2a3f6e 0%, #3b2d5c 55%, #1a1a3a 100%)';
    } else if (artRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #4a2060 0%, #5e2a7a 55%, #2d1040 100%)';
    } else if (proRoles.includes(role)) {
        card.style.background = 'linear-gradient(135deg, #1a3a2e 0%, #2a5a4a 55%, #0d241c 100%)';
    }

    // Receive modal
    document.getElementById('receiveWalletId').textContent = ref;
    document.getElementById('settingsWalletId').textContent = ref;
    document.getElementById('settingsCurrency').textContent = walletData.currency || 'EUR';

    // Currency labels
    ['sendCurrencyLabel', 'depositCurrencyLabel', 'withdrawCurrencyLabel'].forEach(id => {
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
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 180, 180);
    ctx.fillStyle = '#000000';
    const size = 6;
    const cols = 30;
    const hash = [...data].reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < cols; j++) {
            const bit = ((i * j + hash + i * 3 + j * 7) % 3 === 0);
            if (bit) ctx.fillRect(i * size, j * size, size, size);
        }
    }
    [[0, 0], [0, 24 * size], [24 * size, 0]].forEach(([x, y]) => {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, 6 * size - 4, 6 * size - 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 2 * size, y + 2 * size, 2 * size, 2 * size);
    });
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

    const pendEl = document.getElementById('balancePending');
    if (pendEl) {
        const pending = walletData.pending_balance || 0;
        pendEl.innerHTML = `En attente : <strong>${formatAmount(pending)} ${sym}</strong>`;
    }

    document.getElementById('withdrawAvail').textContent = `${formatAmount(walletData.balance || 0)} ${sym}`;
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

    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift'];
    const income = data.filter(t => creditTypes.includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const expense = data.filter(t => !creditTypes.includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const sym = getCurrencySymbol(walletData.currency);

    document.getElementById('monthIncome').textContent = `${formatAmount(income)} ${sym}`;
    document.getElementById('monthExpense').textContent = `${formatAmount(expense)} ${sym}`;
}
// Fin fonction computeMonthStats

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
    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift'];
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
    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift'];
    const isCredit = creditTypes.includes(tx.type);
    const iconMap = {
        credit: { icon: 'fa-arrow-down', cls: 'credit' },
        debit: { icon: 'fa-arrow-up', cls: 'debit' },
        transfer_in: { icon: 'fa-arrow-down-to-bracket', cls: 'credit' },
        transfer_out: { icon: 'fa-paper-plane', cls: 'debit' },
        deposit: { icon: 'fa-plus', cls: 'credit' },
        withdraw: { icon: 'fa-money-bill-transfer', cls: 'debit' },
        gift: { icon: 'fa-gift', cls: 'gift' }
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
        credit: 'Crédit', debit: 'Débit', transfer_in: 'Transfert reçu',
        transfer_out: 'Transfert envoyé', deposit: 'Rechargement',
        withdraw: 'Retrait', subscription: 'Abonnement', gift: 'Don reçu'
    };
    return map[type] || type;
}
// Fin fonction typeLabel

// Début fonction formatDate
function formatDate(iso, full = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (full) return d.toLocaleString('fr-FR');
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
// Fin fonction formatDate

// Début fonction escHtml
function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Fin fonction escHtml

// Début fonction showTxDetail
function showTxDetail(tx) {
    const body = document.getElementById('txDetailBody');
    const icon = document.getElementById('txDetailIcon');
    const sym = getCurrencySymbol(walletData?.currency);
    if (!body) return;

    const creditTypes = ['credit', 'transfer_in', 'deposit', 'gift'];
    const isCredit = creditTypes.includes(tx.type);
    const iconMap = {
        credit: { icon: 'fa-arrow-down', cls: 'credit' },
        debit: { icon: 'fa-arrow-up', cls: 'debit' },
        transfer_in: { icon: 'fa-arrow-down-to-bracket', cls: 'credit' },
        transfer_out: { icon: 'fa-paper-plane', cls: 'debit' },
        deposit: { icon: 'fa-plus', cls: 'credit' },
        withdraw: { icon: 'fa-money-bill-transfer', cls: 'debit' },
        gift: { icon: 'fa-gift', cls: 'gift' }
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
        tx.recipient_ref ? { label: 'Vers', value: tx.recipient_ref } : null,
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
    if (!amountVal || amountVal <= 0) { showToast('Montant invalide', 'warning'); return; }
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

    if (!amount || amount < 1) { showToast('Montant invalide (min 1 €)', 'warning'); return; }

    showLoader();
    try {
        const ref = generateRef('DEP');
        const methodLabel = { card: 'Carte bancaire', transfer: 'Virement', mobile: 'Mobile Money' };

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
        showToast(`Demande de rechargement de ${formatAmount(amount)} enregistrée.`, 'success', 6000);
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
    const iban = document.getElementById('withdrawIBAN')?.value?.trim().replace(/\s/g, '');
    const pin = getPinValue('wdpin');
    const sym = getCurrencySymbol(walletData?.currency);

    if (!amount || amount < 5) { showToast('Montant minimum : 5 €', 'warning'); return; }
    if (amount > (walletData?.balance || 0)) { showToast('Solde insuffisant', 'error'); return; }
    if (!iban || iban.length < 15) { showToast('IBAN invalide', 'warning'); return; }
    if (pin.length < 6) { showToast('Saisissez votre PIN', 'warning'); return; }

    const pinOk = await verifyPin(pin);
    if (!pinOk) { showToast('PIN incorrect', 'error'); setPinError('wdpin'); return; }

    const btn = document.querySelector('.withdraw-confirm');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>…'; }
    showLoader();

    try {
        const ref = generateRef('WDR');
        const ibanMasked = iban.slice(0, 4) + '****' + iban.slice(-4);

        await supabaseClient.from('supabaseAuthPrive_hubis_transactions').insert([{
            wallet_id: walletData.id,
            type: 'withdraw',
            amount: amount,
            description: `Retrait bancaire – ${ibanMasked}`,
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
        showToast(`Retrait de ${formatAmount(amount)} ${sym} en cours de traitement.`, 'success', 6000);
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

// Début fonctions PIN (modals)
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
    document.querySelectorAll('.pin-box-sm').forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
}
// Fin fonctions PIN

// Début fonction lookupRecipient
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
// Fin fonction lookupRecipient

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

// Début fonction openModal / closeModal
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
}
function closeModalOutside(e, id) {
    if (e.target === document.getElementById(id)) closeModal(id);
}
// Fin fonctions modales

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
        await loadTransactions();
        await computeMonthStats();
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
        showToast('Wallet suspendu. Contactez le support pour le réactiver.', 'warning', 8000);
        closeModal('settingsModal');
    }
}
// Fin fonction confirmSuspendWallet

// Début fonction showTxSkeleton
function showTxSkeleton(show) {
    const sk = document.getElementById('txSkeleton');
    if (sk) sk.style.display = show ? 'flex' : 'none';
}
// Fin fonction showTxSkeleton

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    const wallet = await loadWallet();
    if (!wallet) return;

    renderCard();
    renderBalance();
    initPinInputs();
    await loadTransactions();
    await computeMonthStats();

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
});
// Fin initialisation
