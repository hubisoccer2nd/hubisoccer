/* ============================================================
   HubISoccer — admin-foot-revenus.js
   Administration des revenus et wallets (Footballeur)
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentAdmin = null;
let walletsData = [];
let selectedWallet = null;
let paymentMethods = [];
let currentWalletTransactions = [];
let pendingTransactions = [];
// Fin état global

// Début fonctions utilitaires
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info', duration = 30000) {
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
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <div class="toast-close"><i class="fas fa-times"></i></div>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function formatAmount(amount) {
    return Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso, full = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (full) return d.toLocaleString('fr-FR');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function updateAvatarUI() {
    const img = document.getElementById('userAvatar');
    const init = document.getElementById('userAvatarInitials');
    const url = currentAdmin?.avatar_url;
    if (url) {
        if (img) { img.src = url; img.style.display = 'block'; }
        if (init) init.style.display = 'none';
    } else {
        const initials = getInitials(currentAdmin?.full_name || currentAdmin?.display_name || 'A');
        if (init) { init.textContent = initials; init.style.display = 'flex'; }
        if (img) img.style.display = 'none';
    }
}
// Fin fonctions utilitaires

// ============================================================
// VÉRIFICATION ADMIN
// ============================================================

// Début fonction checkAdmin
async function checkAdmin() {
    showLoader(true);
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    const { data: profile, error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('role_code, full_name, display_name, avatar_url')
        .eq('auth_uuid', user.id)
        .single();
    if (profileError || !profile) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
        showToast('Accès réservé aux administrateurs', 'error');
        setTimeout(() => window.location.href = '../../../authprive/users/login.html', 2000);
        return false;
    }
    currentAdmin = profile;
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
    updateAvatarUI();
    showLoader(false);
    return true;
}
// Fin fonction checkAdmin

// ============================================================
// CHARGEMENT DES WALLETS
// ============================================================

// Début fonction loadWallets
async function loadWallets() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_hubis_wallets')
            .select(`*, profile:supabaseAuthPrive_profiles!inner(full_name, avatar_url, role_code)`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        walletsData = data || [];
        renderWalletsTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement wallets', 'error');
    } finally {
        showLoader(false);
    }
}
// Fin fonction loadWallets

// Début fonction renderWalletsTable
function renderWalletsTable() {
    const container = document.getElementById('walletsTableContainer');
    if (!container) return;

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    const filtered = walletsData.filter(w => {
        const profile = w.profile || {};
        const matchSearch = (profile.full_name || '').toLowerCase().includes(searchTerm) ||
                            (w.wallet_ref || '').toLowerCase().includes(searchTerm) ||
                            (w.hubisoccer_id || '').toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'all' || w.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (!filtered.length) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Aucun wallet trouvé.</p>';
        return;
    }

    let html = `
        <table class="wallets-table">
            <thead>
                <tr>
                    <th>Utilisateur</th>
                    <th>Wallet ID</th>
                    <th>Solde principal</th>
                    <th>Solde carte</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(w => {
        const profile = w.profile || {};
        const avatarUrl = profile.avatar_url || '';
        const initials = getInitials(profile.full_name || '');
        const statusLabel = w.status === 'active' ? 'Actif' : 'Suspendu';
        const statusClass = w.status === 'active' ? 'active' : 'suspended';

        html += `
            <tr>
                <td>
                    <div class="user-cell">
                        ${avatarUrl ? `<img src="${avatarUrl}" class="user-avatar-small" onerror="this.style.display='none';nextElementSibling.style.display='flex';">` : ''}
                        <div class="avatar-initials-small" style="${avatarUrl ? 'display:none;' : 'display:flex;'}">${initials}</div>
                        <span>${profile.full_name || 'Inconnu'}</span>
                    </div>
                </td>
                <td><code>${w.wallet_ref || '—'}</code></td>
                <td>${formatAmount(w.balance || 0)} CFA</td>
                <td>${formatAmount(w.card_balance || 0)} CFA</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <button class="btn-action view" onclick="openWalletModal('${w.id}')"><i class="fas fa-eye"></i> Gérer</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}
// Fin fonction renderWalletsTable

// Début fonction updateStats
async function updateStats() {
    // Total wallets
    document.getElementById('totalWallets').textContent = walletsData.length;

    // Solde total
    const totalBalance = walletsData.reduce((sum, w) => sum + (w.balance || 0), 0);
    document.getElementById('totalBalance').textContent = formatAmount(totalBalance) + ' CFA';

    // Demandes en attente
    const { count } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    document.getElementById('pendingCount').textContent = count || 0;

    // Volume mensuel
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const { data: monthTx } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);
    const monthVolume = monthTx ? monthTx.reduce((s, t) => s + (t.amount || 0), 0) : 0;
    document.getElementById('monthVolume').textContent = formatAmount(monthVolume) + ' CFA';
}
// Fin fonction updateStats

// ============================================================
// MODALE DE GESTION D'UN WALLET
// ============================================================

// Début fonction openWalletModal
async function openWalletModal(walletId) {
    showLoader(true);
    const { data: wallet, error } = await supabaseClient
        .from('supabaseAuthPrive_hubis_wallets')
        .select(`*, profile:supabaseAuthPrive_profiles!inner(full_name, avatar_url, role_code)`)
        .eq('id', walletId)
        .single();
    if (error || !wallet) {
        showToast('Wallet introuvable', 'error');
        showLoader(false);
        return;
    }
    selectedWallet = wallet;

    // Remplir les infos de base
    document.getElementById('modalWalletRef').textContent = wallet.wallet_ref;
    document.getElementById('modalWalletHolder').textContent = wallet.profile?.full_name || '—';
    document.getElementById('modalHubisoccerId').textContent = wallet.hubisoccer_id;
    document.getElementById('modalStatus').textContent = wallet.status === 'active' ? 'Actif' : 'Suspendu';
    document.getElementById('modalBalance').value = wallet.balance || 0;
    document.getElementById('modalCardBalance').value = wallet.card_balance || 0;
    document.getElementById('modalPendingBalance').value = wallet.pending_balance || 0;
    document.getElementById('modalAdminNotes').value = wallet.admin_notes || '';

    // Bouton suspendre / réactiver
    const toggleBtn = document.getElementById('toggleSuspendBtn');
    toggleBtn.innerHTML = wallet.status === 'active'
        ? '<i class="fas fa-ban"></i> Suspendre'
        : '<i class="fas fa-check-circle"></i> Réactiver';

    // Charger les onglets
    await loadBonusData(wallet.hubisoccer_id);
    await loadPendingTransactions(wallet.id);
    await loadWalletTransactions(wallet.id);
    await loadPaymentMethods();

    document.getElementById('walletModal').style.display = 'flex';
    showLoader(false);
}
// Fin fonction openWalletModal

// Début fonction closeWalletModal
function closeWalletModal() {
    document.getElementById('walletModal').style.display = 'none';
    selectedWallet = null;
}
// Fin fonction closeWalletModal

// ============================================================
// ONGLET SYNTHÈSE
// ============================================================

// Début événement sauvegarde infos wallet
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveWalletInfoBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!selectedWallet) return;
            const balance = parseFloat(document.getElementById('modalBalance').value);
            const cardBalance = parseFloat(document.getElementById('modalCardBalance').value);
            const pendingBalance = parseFloat(document.getElementById('modalPendingBalance').value);
            const notes = document.getElementById('modalAdminNotes').value;

            showLoader(true);
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_hubis_wallets')
                .update({
                    balance: balance,
                    card_balance: cardBalance,
                    pending_balance: pendingBalance,
                    admin_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedWallet.id);
            showLoader(false);

            if (error) {
                showToast('Erreur mise à jour', 'error');
            } else {
                showToast('Wallet mis à jour', 'success');
                selectedWallet.balance = balance;
                selectedWallet.card_balance = cardBalance;
                selectedWallet.pending_balance = pendingBalance;
                loadWallets();
            }
        });
    }

    const toggleBtn = document.getElementById('toggleSuspendBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', async () => {
            if (!selectedWallet) return;
            const newStatus = selectedWallet.status === 'active' ? 'suspended' : 'active';
            showLoader(true);
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_hubis_wallets')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', selectedWallet.id);
            showLoader(false);
            if (error) {
                showToast('Erreur modification statut', 'error');
            } else {
                showToast(`Wallet ${newStatus === 'active' ? 'réactivé' : 'suspendu'}`, 'success');
                selectedWallet.status = newStatus;
                document.getElementById('modalStatus').textContent = newStatus === 'active' ? 'Actif' : 'Suspendu';
                toggleBtn.innerHTML = newStatus === 'active'
                    ? '<i class="fas fa-ban"></i> Suspendre'
                    : '<i class="fas fa-check-circle"></i> Réactiver';
                loadWallets();
            }
        });
    }
});
// Fin événements synthèse

// ============================================================
// ONGLET BONUS
// ============================================================

// Début fonction loadBonusData
async function loadBonusData(hubisoccerId) {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_bonus')
        .select('*')
        .eq('hubisoccer_id', hubisoccerId)
        .maybeSingle();
    if (data) {
        document.getElementById('bonusHommeMatch').value = data.homme_match || 0;
        document.getElementById('bonusPrimes').value = data.primes || 0;
        document.getElementById('bonusCommunity').value = data.community || 0;
        document.getElementById('bonusFollowersAvailable').value = data.followers_bonus_available || 0;
        document.getElementById('followersBonusCredited').textContent = data.followers_bonus_credited || 0;
    }
    // Followers
    const { data: followerData } = await supabaseClient
        .from('supabaseAuthPrive_followers_count')
        .select('total_followers')
        .eq('hubisoccer_id', hubisoccerId)
        .maybeSingle();
    document.getElementById('followerCount').textContent = followerData?.total_followers || 0;

    document.getElementById('saveBonusBtn').onclick = async () => {
        if (!selectedWallet) return;
        const homme = parseInt(document.getElementById('bonusHommeMatch').value) || 0;
        const primes = parseInt(document.getElementById('bonusPrimes').value) || 0;
        const community = parseInt(document.getElementById('bonusCommunity').value) || 0;
        const followersAvail = parseInt(document.getElementById('bonusFollowersAvailable').value) || 0;

        showLoader(true);
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_bonus')
            .upsert({
                hubisoccer_id: selectedWallet.hubisoccer_id,
                homme_match: homme,
                primes: primes,
                community: community,
                followers_bonus_available: followersAvail,
                updated_at: new Date().toISOString()
            }, { onConflict: 'hubisoccer_id' });
        showLoader(false);
        if (error) {
            showToast('Erreur mise à jour bonus', 'error');
        } else {
            showToast('Bonus mis à jour', 'success');
        }
    };
}
// Fin fonction loadBonusData

// ============================================================
// ONGLET DEMANDES EN ATTENTE
// ============================================================

// Début fonction loadPendingTransactions
async function loadPendingTransactions(walletId) {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    pendingTransactions = data || [];
    renderPendingTransactions();
}
// Fin fonction loadPendingTransactions

// Début fonction renderPendingTransactions
function renderPendingTransactions() {
    const container = document.getElementById('pendingTransactionsList');
    if (!pendingTransactions.length) {
        container.innerHTML = '<p>Aucune demande en attente.</p>';
        return;
    }
    let html = '';
    pendingTransactions.forEach(tx => {
        const typeLabel = tx.type === 'deposit' ? 'Dépôt' : 'Retrait';
        html += `
            <div class="pending-item">
                <div><strong>${typeLabel}</strong> - ${formatAmount(tx.amount)} CFA</div>
                <div>${tx.description || ''}</div>
                <div>Demandé le ${formatDate(tx.created_at, true)}</div>
                <div class="pending-actions">
                    <button class="btn-validate" onclick="validateTransaction('${tx.id}')"><i class="fas fa-check"></i> Valider</button>
                    <button class="btn-reject" onclick="rejectTransaction('${tx.id}')"><i class="fas fa-times"></i> Refuser</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
// Fin fonction renderPendingTransactions

// Début fonction validateTransaction
async function validateTransaction(txId) {
    const tx = pendingTransactions.find(t => t.id == txId);
    if (!tx) return;
    showLoader(true);
    if (tx.type === 'deposit') {
        // Créditer le solde
        await supabaseClient.rpc('credit_wallet_from_deposit', { transaction_id: tx.id });
    } else if (tx.type === 'withdraw') {
        // Le retrait est déjà débité, on valide simplement le statut
        await supabaseClient
            .from('supabaseAuthPrive_hubis_transactions')
            .update({ status: 'completed' })
            .eq('id', tx.id);
    }
    showLoader(false);
    showToast('Transaction validée', 'success');
    loadPendingTransactions(selectedWallet.id);
    loadWalletTransactions(selectedWallet.id);
    updateStats();
}
// Fin fonction validateTransaction

// Début fonction rejectTransaction
async function rejectTransaction(txId) {
    const tx = pendingTransactions.find(t => t.id == txId);
    if (!tx) return;
    showLoader(true);
    if (tx.type === 'deposit') {
        await supabaseClient
            .from('supabaseAuthPrive_hubis_transactions')
            .update({ status: 'failed' })
            .eq('id', tx.id);
    } else if (tx.type === 'withdraw') {
        // Recréditer le solde
        await supabaseClient.rpc('refund_withdraw', { transaction_id: tx.id });
    }
    showLoader(false);
    showToast('Transaction refusée', 'warning');
    loadPendingTransactions(selectedWallet.id);
    loadWalletTransactions(selectedWallet.id);
    updateStats();
}
// Fin fonction rejectTransaction

// ============================================================
// ONGLET TRANSACTIONS
// ============================================================

// Début fonction loadWalletTransactions
async function loadWalletTransactions(walletId) {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_hubis_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(100);
    currentWalletTransactions = data || [];
    renderWalletTransactions();
}
// Fin fonction loadWalletTransactions

// Début fonction renderWalletTransactions
function renderWalletTransactions() {
    const container = document.getElementById('walletTransactionsList');
    if (!currentWalletTransactions.length) {
        container.innerHTML = '<p>Aucune transaction.</p>';
        return;
    }
    let html = '<div class="transactions-list">';
    currentWalletTransactions.forEach(tx => {
        html += `
            <div class="transaction-item">
                <div>${tx.type} - ${formatAmount(tx.amount)} CFA</div>
                <div>${formatDate(tx.created_at)}</div>
                <div>${tx.status}</div>
                <button onclick="generateDocumentForTx('${tx.id}', 'invoice')">Facture</button>
                <button onclick="generateDocumentForTx('${tx.id}', 'receipt')">Attestation</button>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}
// Fin fonction renderWalletTransactions

// ============================================================
// GESTION DES MOYENS DE PAIEMENT
// ============================================================

// Début fonction loadPaymentMethods
async function loadPaymentMethods() {
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_payment_methods')
        .select('*')
        .order('method_key');
    paymentMethods = data || [];
    renderPaymentMethods();
}
// Fin fonction loadPaymentMethods

// Début fonction renderPaymentMethods
function renderPaymentMethods() {
    const container = document.getElementById('paymentMethodsList');
    if (!paymentMethods.length) {
        container.innerHTML = '<p>Aucun moyen de paiement configuré.</p>';
        return;
    }
    let html = '';
    paymentMethods.forEach(pm => {
        html += `
            <div class="payment-method-item">
                <div><strong>${pm.method_key}</strong> - ${pm.display_name}</div>
                <div>${pm.instructions || ''}</div>
                <div>${pm.is_active ? 'Actif' : 'Inactif'}</div>
                <button onclick="editPaymentMethod('${pm.id}')">Modifier</button>
            </div>
        `;
    });
    container.innerHTML = html;
}
// Fin fonction renderPaymentMethods

// Début fonction openPaymentMethodModal
function openPaymentMethodModal(method = null) {
    if (method) {
        document.getElementById('paymentMethodId').value = method.id;
        document.getElementById('methodKey').value = method.method_key;
        document.getElementById('methodDisplayName').value = method.display_name;
        document.getElementById('methodInstructions').value = method.instructions || '';
        document.getElementById('methodRedirectUrl').value = method.redirect_url || '';
        document.getElementById('methodIsActive').checked = method.is_active;
    } else {
        document.getElementById('paymentMethodId').value = '';
        document.getElementById('methodKey').value = '';
        document.getElementById('methodDisplayName').value = '';
        document.getElementById('methodInstructions').value = '';
        document.getElementById('methodRedirectUrl').value = '';
        document.getElementById('methodIsActive').checked = true;
    }
    document.getElementById('paymentMethodModal').style.display = 'flex';
}
// Fin fonction openPaymentMethodModal

// Début fonction closePaymentMethodModal
function closePaymentMethodModal() {
    document.getElementById('paymentMethodModal').style.display = 'none';
}
// Fin fonction closePaymentMethodModal

// Début événement sauvegarde moyen de paiement
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('savePaymentMethodBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const id = document.getElementById('paymentMethodId').value;
            const methodKey = document.getElementById('methodKey').value;
            const displayName = document.getElementById('methodDisplayName').value;
            const instructions = document.getElementById('methodInstructions').value;
            const redirectUrl = document.getElementById('methodRedirectUrl').value;
            const isActive = document.getElementById('methodIsActive').checked;

            const payload = { method_key: methodKey, display_name: displayName, instructions, redirect_url: redirectUrl, is_active: isActive, updated_at: new Date().toISOString() };
            showLoader(true);
            let error;
            if (id) {
                ({ error } = await supabaseClient.from('supabaseAuthPrive_payment_methods').update(payload).eq('id', id));
            } else {
                payload.created_at = new Date().toISOString();
                ({ error } = await supabaseClient.from('supabaseAuthPrive_payment_methods').insert([payload]));
            }
            showLoader(false);
            if (error) {
                showToast('Erreur enregistrement', 'error');
            } else {
                showToast('Moyen de paiement enregistré', 'success');
                closePaymentMethodModal();
                loadPaymentMethods();
            }
        });
    }
});
// Fin événement sauvegarde moyen de paiement

// ============================================================
// GÉNÉRATION DE DOCUMENTS
// ============================================================

// Début fonction generateDocumentForTx
async function generateDocumentForTx(txId, type) {
    const tx = currentWalletTransactions.find(t => t.id == txId);
    if (!tx) return;
    // À implémenter avec jsPDF et les données de transaction
    showToast(`Génération ${type} pour transaction ${txId} à implémenter`, 'info');
}
// Fin fonction generateDocumentForTx

// ============================================================
// UI SIDEBAR & MENU
// ============================================================

// Début fonction initSidebar
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
}
// Fin fonction initSidebar

// Début fonction initUserMenu
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout

// ============================================================
// INITIALISATION
// ============================================================

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();

    document.getElementById('searchInput')?.addEventListener('input', renderWalletsTable);
    document.getElementById('statusFilter')?.addEventListener('change', renderWalletsTable);
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        loadWallets();
        updateStats();
    });
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        document.getElementById('exportMenu').classList.toggle('show');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    await loadWallets();

    window.openWalletModal = openWalletModal;
    window.closeWalletModal = closeWalletModal;
    window.validateTransaction = validateTransaction;
    window.rejectTransaction = rejectTransaction;
    window.editPaymentMethod = (id) => {
        const method = paymentMethods.find(p => p.id == id);
        if (method) openPaymentMethodModal(method);
    };
    window.closePaymentMethodModal = closePaymentMethodModal;
    document.getElementById('addPaymentMethodBtn')?.addEventListener('click', () => openPaymentMethodModal(null));
});
// Fin initialisation DOM
