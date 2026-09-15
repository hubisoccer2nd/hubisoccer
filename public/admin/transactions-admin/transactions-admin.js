// ========== DEBUT : transactions-admin.js (corrigé IDs + session + description) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DEBUT : VÉRIFICATION DE SESSION ==========
(async () => {
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) {
        window.location.href = '../administration.html';
        return;
    }
    document.getElementById('authCheck').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    chargerTransactions();
})();
// ========== FIN : VÉRIFICATION DE SESSION ==========

// ========== DEBUT : UTILITAIRES ==========
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
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
// ========== FIN : UTILITAIRES ==========

// ========== DEBUT : FILTRES ET CHARGEMENT ==========
const typeFilter = document.getElementById('typeFilter');
const statutFilter = document.getElementById('statutFilter');
const refreshBtn = document.getElementById('refreshBtn');
const transactionsList = document.getElementById('transactionsList');
const modal = document.getElementById('traiterModal');        // ID corrigé
const closeModalBtns = document.querySelectorAll('.close-modal');
const modalInfo = document.getElementById('modalInfo');       // ID corrigé
const modalAction = document.getElementById('modalAction');   // ID corrigé
const modalCommentaire = document.getElementById('modalCommentaire'); // ID corrigé
const saveBtn = document.getElementById('saveBtn');           // ID corrigé
let currentTransactionId = null;

async function chargerTransactions() {
    showLoader();
    try {
        let query = supabaseAdmin.from('public_transactions').select('*').order('date_creation', { ascending: false });
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

function renderTransactions(transactions) {
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
        const dateAffichage = tx.date_creation ? new Date(tx.date_creation).toLocaleString() : 'Date inconnue';
        // La description contient les infos méthode/identifiant
        html += `
            <div class="transaction-card" data-id="${tx.id}">
                <div class="transaction-header">
                    <span class="transaction-type ${typeClass}">${typeLabel}</span>
                    <span class="transaction-statut ${statutClass}">${statutLabel}</span>
                </div>
                <div class="transaction-info">
                    <span><i class="fas fa-user"></i> ${escapeHtml(tx.utilisateur_id)}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${tx.montant.toLocaleString()} FCFA</span>
                    <span><i class="fas fa-calendar"></i> ${dateAffichage}</span>
                </div>
                ${tx.description ? `<div class="transaction-info"><span><i class="fas fa-info-circle"></i> ${escapeHtml(tx.description)}</span></div>` : ''}
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
            ${data.description ? `<p><strong>Détails:</strong> ${escapeHtml(data.description)}</p>` : ''}
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
        const { data: tx, error: fetchErr } = await supabaseAdmin
            .from('public_transactions')
            .select('*')
            .eq('id', currentTransactionId)
            .single();
        if (fetchErr) throw fetchErr;

        const newStatut = action === 'valide' ? 'valide' : 'rejete';
        const { error: updateErr } = await supabaseAdmin
            .from('public_transactions')
            .update({
                statut: newStatut,
                commentaire_admin: commentaire,
                date_traitement: new Date().toISOString()
            })
            .eq('id', currentTransactionId);
        if (updateErr) throw updateErr;

        // Mise à jour du portefeuille uniquement si validation
        if (action === 'valide') {
            const { data: wallet, error: walletErr } = await supabaseAdmin
                .from('public_portefeuille')
                .select('solde')
                .eq('utilisateur_id', tx.utilisateur_id)
                .single();

            if (tx.type === 'depot') {
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
            } else if (tx.type === 'retrait') {
                if (!wallet || wallet.solde < tx.montant) {
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
        }

        // Notification à l'utilisateur
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

// ========== DEBUT : FILTRES ET ÉVÉNEMENTS ==========
typeFilter.addEventListener('change', () => chargerTransactions());
statutFilter.addEventListener('change', () => chargerTransactions());
refreshBtn.addEventListener('click', () => chargerTransactions());

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
});
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// ========== DEBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}

// ========== DEBUT : DÉCONNEXION ==========
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseAdmin.auth.signOut();
        window.location.href = '../administration.html';
    });
}
// ========== FIN : transactions-admin.js ==========