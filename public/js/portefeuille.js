// ========== PORTEFEUILLE.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'portefeuille.logout': 'Déconnexion',
        'portefeuille.dashboard': 'Tableau de bord',
        'portefeuille.equipe': 'Mon équipe',
        'portefeuille.matchs': 'Matchs',
        'portefeuille.classement': 'Classement',
        'portefeuille.messagerie': 'Messages',
        'portefeuille.title': 'Portefeuille',
        'portefeuille.solde_actuel': 'Solde actuel',
        'portefeuille.deposer': 'Déposer des fonds',
        'portefeuille.retirer': 'Retirer des fonds',
        'portefeuille.montant': 'Montant (FCFA)',
        'portefeuille.methode': 'Méthode de paiement',
        'portefeuille.identifiant': 'Identifiant (numéro de téléphone)',
        'portefeuille.deposer_btn': 'Demander un dépôt',
        'portefeuille.retirer_btn': 'Demander un retrait',
        'portefeuille.historique': 'Historique des transactions',
        'portefeuille.aucune_transaction': 'Aucune transaction.',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.min_depot': 'Le montant minimum de dépôt est de 100 FCFA.',
        'toast.min_retrait': 'Le montant minimum de retrait est de 1000 FCFA.',
        'toast.demande_envoyee': 'Demande envoyée, en attente de validation.',
        'toast.erreur': 'Erreur lors de l\'envoi de la demande.',
        'toast.chargement_erreur': 'Erreur chargement des données.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'transaction.depot': 'Dépôt',
        'transaction.retrait': 'Retrait',
        'statut.en_attente': 'En attente',
        'statut.valide': 'Validé',
        'statut.rejete': 'Rejeté'
    },
    en: {
        'loader.message': 'Loading...',
        'portefeuille.logout': 'Logout',
        'portefeuille.dashboard': 'Dashboard',
        'portefeuille.equipe': 'My team',
        'portefeuille.matchs': 'Matches',
        'portefeuille.classement': 'Ranking',
        'portefeuille.messagerie': 'Messages',
        'portefeuille.title': 'Wallet',
        'portefeuille.solde_actuel': 'Current balance',
        'portefeuille.deposer': 'Deposit funds',
        'portefeuille.retirer': 'Withdraw funds',
        'portefeuille.montant': 'Amount (FCFA)',
        'portefeuille.methode': 'Payment method',
        'portefeuille.identifiant': 'Identifier (phone number)',
        'portefeuille.deposer_btn': 'Request deposit',
        'portefeuille.retirer_btn': 'Request withdrawal',
        'portefeuille.historique': 'Transaction history',
        'portefeuille.aucune_transaction': 'No transactions.',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.min_depot': 'Minimum deposit amount is 100 FCFA.',
        'toast.min_retrait': 'Minimum withdrawal amount is 1000 FCFA.',
        'toast.demande_envoyee': 'Request sent, pending validation.',
        'toast.erreur': 'Error sending request.',
        'toast.chargement_erreur': 'Error loading data.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'transaction.depot': 'Deposit',
        'transaction.retrait': 'Withdrawal',
        'statut.en_attente': 'Pending',
        'statut.valide': 'Validated',
        'statut.rejete': 'Rejected'
    }
};

let currentLang = localStorage.getItem('portefeuille_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) el.placeholder = t(key);
            else el.innerHTML = t(key);
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('portefeuille_lang', lang);
        applyTranslations();
        chargerSolde();
        chargerTransactions();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== CHARGEMENT DU SOLDE ==========
async function chargerSolde() {
    try {
        const { data, error } = await supabasePublic
            .from('public_portefeuille')
            .select('solde')
            .eq('utilisateur_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        let solde = data ? data.solde : 0;
        if (!data) {
            const { error: insertError } = await supabasePublic
                .from('public_portefeuille')
                .insert([{ utilisateur_id: userId, solde: 0 }]);
            if (insertError) throw insertError;
            solde = 0;
        }
        document.getElementById('soldeMontant').textContent = solde.toLocaleString() + ' FCFA';
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    }
}

// ========== CHARGEMENT DE L'HISTORIQUE ==========
async function chargerTransactions() {
    try {
        const { data, error } = await supabasePublic
            .from('public_transactions')
            .select('*')
            .eq('utilisateur_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderTransactions(data || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    }
}

function renderTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    if (!transactions.length) {
        container.innerHTML = '<div class="empty-message">' + t('portefeuille.aucune_transaction') + '</div>';
        return;
    }
    let html = '';
    for (const tx of transactions) {
        const typeLabel = tx.type === 'depot' ? t('transaction.depot') : t('transaction.retrait');
        const typeClass = tx.type === 'depot' ? 'depot' : 'retrait';
        let statutLabel = '';
        let statutClass = '';
        switch (tx.statut) {
            case 'en_attente':
                statutLabel = t('statut.en_attente');
                statutClass = 'en_attente';
                break;
            case 'valide':
                statutLabel = t('statut.valide');
                statutClass = 'valide';
                break;
            case 'rejete':
                statutLabel = t('statut.rejete');
                statutClass = 'rejete';
                break;
            default:
                statutLabel = tx.statut;
        }
        html += `
            <div class="transaction-item ${typeClass}">
                <div class="transaction-info">
                    <div class="transaction-montant">${typeLabel} : ${tx.montant.toLocaleString()} FCFA</div>
                    <div class="transaction-date">${new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div class="transaction-statut statut-${statutClass}">${statutLabel}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ========== DEMANDE DE DÉPÔT ==========
const depotForm = document.getElementById('depotForm');
depotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const montant = parseInt(document.getElementById('depotMontant').value);
    const methode = document.getElementById('depotMethode').value;
    if (isNaN(montant) || montant < 100) {
        showToast(t('toast.min_depot'), 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_transactions')
            .insert([{
                utilisateur_id: userId,
                type: 'depot',
                montant: montant,
                methode: methode,
                statut: 'en_attente',
                identifiant: null,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.demande_envoyee'), 'success');
        depotForm.reset();
        chargerTransactions();
        await supabasePublic.from('public_messages_prives').insert([{
            expediteur_id: userId,
            destinataire_id: 'admin',
            sujet: 'Demande de dépôt',
            contenu: `Nouvelle demande de dépôt de ${montant} FCFA par ${userNom || userId}. Méthode: ${methode}`,
            lu: false,
            created_at: new Date().toISOString()
        }]);
    } catch (err) {
        showToast(t('toast.erreur'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== DEMANDE DE RETRAIT ==========
const retraitForm = document.getElementById('retraitForm');
retraitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const montant = parseInt(document.getElementById('retraitMontant').value);
    const methode = document.getElementById('retraitMethode').value;
    const identifiant = document.getElementById('retraitIdentifiant').value.trim();
    if (isNaN(montant) || montant < 1000) {
        showToast(t('toast.min_retrait'), 'warning');
        return;
    }
    if (!identifiant) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_transactions')
            .insert([{
                utilisateur_id: userId,
                type: 'retrait',
                montant: montant,
                methode: methode,
                identifiant: identifiant,
                statut: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.demande_envoyee'), 'success');
        retraitForm.reset();
        chargerTransactions();
        await supabasePublic.from('public_messages_prives').insert([{
            expediteur_id: userId,
            destinataire_id: 'admin',
            sujet: 'Demande de retrait',
            contenu: `Nouvelle demande de retrait de ${montant} FCFA par ${userNom || userId}. Méthode: ${methode}, Identifiant: ${identifiant}`,
            lu: false,
            created_at: new Date().toISOString()
        }]);
    } catch (err) {
        showToast(t('toast.erreur'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== DÉCONNEXION ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

// ========== MENU MOBILE ET LANGUE ==========
function initMenuMobile() {
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
}
function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

function showToast(message, type = 'info', duration = 3000) {
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
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await chargerSolde();
    await chargerTransactions();
});