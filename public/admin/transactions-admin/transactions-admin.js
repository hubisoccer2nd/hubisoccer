// ========== TRANSACTIONS-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 3000);
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== FILTRES ET CHARGEMENT ==========
const typeFilter = document.getElementById('typeFilter');
const statutFilter = document.getElementById('statutFilter');
const refreshBtn = document.getElementById('refreshBtn');
const transactionsList = document.getElementById('transactionsList');
const modal = document.getElementById('traiterModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const modalInfo = document.getElementById('modalInfo');
const modalAction = document.getElementById('modalAction');
const modalCommentaire = document.getElementById('modalCommentaire');
const saveBtn = document.getElementById('saveBtn');
let currentTransactionId = null;

async function chargerTransactions() {
    showLoader();
    try {
        let query = supabaseAdmin.from('public_transactions').select('*').order('created_at', { ascending: false });
        const type = typeFilter.value;
        const statut = statutFilter.value;
        if (type !== 'all') query = query.eq('type', type);
        if (statut !== 'all') query = query.eq('statut', statut);
        const { data, error } = await query;
        if (error) throw error;
        renderTransactions(data || []);
    } catch (err) {
        showToast('Erreur chargement transactions', 'error');
    } finally {
        hideLoader();
    }
}

async function renderTransactions(transactions) {
    if (!transactionsList) return;
    if (!transactions.length) {
        transactionsList.innerHTML = '<div class="empty-message">Aucune transaction.</div>';
        return;
    }
    let html = '';
    for (const tx of transactions) {
        const typeClass = tx.type === 'depot' ? 'type-depot' : 'type-retrait';
        const typeLabel = tx.type === 'depot' ? 'Dépôt' : 'Retrait';
        let statutClass = '';
        let statutLabel = '';
        switch (tx.statut) {
            case 'en_attente':
                statutClass = 'statut-en_attente';
                statutLabel = 'En attente';
                break;
            case 'valide':
                statutClass = 'statut-valide';
                statutLabel = 'Validé';
                break;
            case 'rejete':
                statutClass = 'statut-rejete';
                statutLabel = 'Rejeté';
                break;
            default:
                statutClass = '';
                statutLabel = tx.statut;
        }
        html += `
            <div class="transaction-card" data-id="${tx.id}">
                <div class="transaction-header">
                    <span class="transaction-type ${typeClass}">${typeLabel}</span>
                    <span class="transaction-statut ${statutClass}">${statutLabel}</span>
                </div>
                <div class="transaction-info">
                    <span><i class="fas fa-user"></i> ${escapeHtml(tx.utilisateur_id)}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${tx.montant.toLocaleString()} FCFA</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(tx.created_at).toLocaleString()}</span>
                </div>
                ${tx.methode ? `<div class="transaction-info"><span><i class="fas fa-credit-card"></i> ${escapeHtml(tx.methode)}</span>${tx.identifiant ? `<span><i class="fas fa-phone"></i> ${escapeHtml(tx.identifiant)}</span>` : ''}</div>` : ''}
                ${tx.commentaire_admin ? `<div class="transaction-info"><span><i class="fas fa-comment"></i> ${escapeHtml(tx.commentaire_admin)}</span></div>` : ''}
                <div class="transaction-actions">
                    ${tx.statut === 'en_attente' ? `<button class="btn-traiter" data-id="${tx.id}">Traiter</button>` : ''}
                </div>
            </div>
        `;
    }
    transactionsList.innerHTML = html;
    document.querySelectorAll('.btn-traiter').forEach(btn => {
        btn.addEventListener('click', () => ouvrirModal(btn.dataset.id));
    });
}

async function ouvrirModal(transactionId) {
    currentTransactionId = transactionId;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_transactions')
            .select('*')
            .eq('id', transactionId)
            .single();
        if (error) throw error;
        modalInfo.innerHTML = `
            <p><strong>Type:</strong> ${data.type === 'depot' ? 'Dépôt' : 'Retrait'}</p>
            <p><strong>Utilisateur:</strong> ${escapeHtml(data.utilisateur_id)}</p>
            <p><strong>Montant:</strong> ${data.montant.toLocaleString()} FCFA</p>
            <p><strong>Méthode:</strong> ${data.methode || '-'}</p>
            ${data.identifiant ? `<p><strong>Identifiant:</strong> ${escapeHtml(data.identifiant)}</p>` : ''}
        `;
        modalAction.value = 'valide';
        modalCommentaire.value = data.commentaire_admin || '';
        modal.classList.add('active');
    } catch (err) {
        showToast('Erreur chargement transaction', 'error');
    } finally {
        hideLoader();
    }
}

saveBtn.addEventListener('click', async () => {
    const action = modalAction.value;
    const commentaire = modalCommentaire.value.trim();
    if (!action) return;
    showLoader();
    try {
        // Récupérer la transaction
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('public_transactions')
            .select('*')
            .eq('id', currentTransactionId)
            .single();
        if (fetchErr) throw fetchErr;
        // Mettre à jour le statut
        const newStatut = action === 'valide' ? 'valide' : 'rejete';
        const { error: updateErr } = await supabaseAdmin
            .from('public_transactions')
            .update({ statut: newStatut, commentaire_admin: commentaire, updated_at: new Date().toISOString() })
            .eq('id', currentTransactionId);
        if (updateErr) throw updateErr;
        // Si validation et type dépôt, ajouter le montant au portefeuille
        if (action === 'valide' && tx.type === 'depot') {
            const { data: wallet, error: walletErr } = await supabaseAdmin
                .from('public_portefeuille')
                .select('solde')
                .eq('utilisateur_id', tx.utilisateur_id)
                .single();
            if (walletErr && walletErr.code !== 'PGRST116') throw walletErr;
            const nouveauSolde = (wallet?.solde || 0) + tx.montant;
            if (wallet) {
                const { error: updateWallet } = await supabaseAdmin
                    .from('public_portefeuille')
                    .update({ solde: nouveauSolde, updated_at: new Date().toISOString() })
                    .eq('utilisateur_id', tx.utilisateur_id);
                if (updateWallet) throw updateWallet;
            } else {
                const { error: insertWallet } = await supabaseAdmin
                    .from('public_portefeuille')
                    .insert([{ utilisateur_id: tx.utilisateur_id, solde: tx.montant }]);
                if (insertWallet) throw insertWallet;
            }
        }
        // Si validation et type retrait, déduire le montant du portefeuille (vérifier solde suffisant)
        if (action === 'valide' && tx.type === 'retrait') {
            const { data: wallet, error: walletErr } = await supabaseAdmin
                .from('public_portefeuille')
                .select('solde')
                .eq('utilisateur_id', tx.utilisateur_id)
                .single();
            if (walletErr) throw walletErr;
            if (wallet.solde < tx.montant) {
                showToast('Solde insuffisant pour valider ce retrait', 'error');
                return;
            }
            const nouveauSolde = wallet.solde - tx.montant;
            const { error: updateWallet } = await supabaseAdmin
                .from('public_portefeuille')
                .update({ solde: nouveauSolde, updated_at: new Date().toISOString() })
                .eq('utilisateur_id', tx.utilisateur_id);
            if (updateWallet) throw updateWallet;
        }
        // Envoyer une notification à l'utilisateur via la messagerie
        const messageContent = `Votre demande de ${tx.type === 'depot' ? 'dépôt' : 'retrait'} de ${tx.montant} FCFA a été ${newStatut === 'valide' ? 'validée' : 'rejetée'}. ${commentaire ? `Commentaire : ${commentaire}` : ''}`;
        await supabaseAdmin.from('public_messages_prives').insert([{
            expediteur_id: 'admin',
            destinataire_id: tx.utilisateur_id,
            sujet: `Transaction ${newStatut === 'valide' ? 'validée' : 'rejetée'}`,
            contenu: messageContent,
            lu: false,
            created_at: new Date().toISOString()
        }]);
        showToast(`Transaction ${newStatut === 'valide' ? 'validée' : 'rejetée'}`, 'success');
        modal.classList.remove('active');
        chargerTransactions();
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du traitement', 'error');
    } finally {
        hideLoader();
    }
});

// ========== FILTRES ==========
typeFilter.addEventListener('change', () => chargerTransactions());
statutFilter.addEventListener('change', () => chargerTransactions());
refreshBtn.addEventListener('click', () => chargerTransactions());

// ========== FERMETURE MODALE ==========
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// ========== MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion (à venir)', 'info'); });

// ========== INITIALISATION ==========
chargerTransactions();