// ========== AFFILIE-LOGIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.home': 'Accueil',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournoi': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'affilie.login.title': 'Espace affilié',
        'affilie.login.subtitle': 'Connectez-vous avec votre numéro WhatsApp',
        'affilie.login.phone': 'Numéro WhatsApp *',
        'affilie.login.phone_placeholder': '+229 01 00 00 00 00',
        'affilie.login.btn': 'Se connecter',
        'affilie.login.register_link': 'Pas encore inscrit ? Devenez ambassadeur',
        'affilie.dashboard.title': 'Tableau de bord',
        'affilie.dashboard.welcome': 'Bienvenue, {name}',
        'affilie.dashboard.stats': 'Vos statistiques',
        'affilie.dashboard.total_sportifs': 'Sportifs validés',
        'affilie.dashboard.total_ventes': 'Ventes',
        'affilie.dashboard.total_commission': 'Commission totale (FCFA)',
        'affilie.dashboard.pending': 'En attente de validation',
        'affilie.dashboard.link': 'Votre lien d\'affiliation',
        'affilie.dashboard.link_copy': 'Copier',
        'affilie.dashboard.withdraw': 'Demander un retrait',
        'affilie.dashboard.history': 'Historique des commissions',
        'affilie.dashboard.no_history': 'Aucune commission pour le moment.',
        'affilie.dashboard.logout': 'Déconnexion',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_phone': 'Veuillez saisir votre numéro WhatsApp.',
        'toast.login_error': 'Numéro non trouvé. Veuillez vous inscrire d\'abord.',
        'toast.logout_success': 'Déconnecté',
        'toast.copy_success': 'Lien copié !',
        'toast.copy_error': 'Erreur de copie',
        'toast.amount_invalid': 'Montant invalide. Minimum 1000 FCFA.',
        'toast.insufficient_balance': 'Solde insuffisant. Disponible : {amount} FCFA',
        'toast.withdraw_request_sent': 'Demande de retrait envoyée. En attente de validation.',
        'toast.withdraw_error': 'Erreur lors de la demande de retrait.'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Become an actor',
        'nav.tournoi': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'affilie.login.title': 'Affiliate space',
        'affilie.login.subtitle': 'Login with your WhatsApp number',
        'affilie.login.phone': 'WhatsApp number *',
        'affilie.login.phone_placeholder': '+229 01 00 00 00 00',
        'affilie.login.btn': 'Login',
        'affilie.login.register_link': 'Not registered yet? Become an ambassador',
        'affilie.dashboard.title': 'Dashboard',
        'affilie.dashboard.welcome': 'Welcome, {name}',
        'affilie.dashboard.stats': 'Your statistics',
        'affilie.dashboard.total_sportifs': 'Validated athletes',
        'affilie.dashboard.total_ventes': 'Sales',
        'affilie.dashboard.total_commission': 'Total commission (FCFA)',
        'affilie.dashboard.pending': 'Pending validation',
        'affilie.dashboard.link': 'Your affiliate link',
        'affilie.dashboard.link_copy': 'Copy',
        'affilie.dashboard.withdraw': 'Request withdrawal',
        'affilie.dashboard.history': 'Commission history',
        'affilie.dashboard.no_history': 'No commissions yet.',
        'affilie.dashboard.logout': 'Logout',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.fill_phone': 'Please enter your WhatsApp number.',
        'toast.login_error': 'Number not found. Please register first.',
        'toast.logout_success': 'Logged out',
        'toast.copy_success': 'Link copied!',
        'toast.copy_error': 'Copy error',
        'toast.amount_invalid': 'Invalid amount. Minimum 1000 FCFA.',
        'toast.insufficient_balance': 'Insufficient balance. Available: {amount} FCFA',
        'toast.withdraw_request_sent': 'Withdrawal request sent. Pending approval.',
        'toast.withdraw_error': 'Error while requesting withdrawal.'
    }
};

let currentLang = localStorage.getItem('affilie_lang') || navigator.language.split('-')[0];
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
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
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
        localStorage.setItem('affilie_lang', lang);
        applyTranslations();
        if (currentAffiliate) {
            renderDashboard(currentAffiliate);
        }
    }
}

// ========== ÉLÉMENTS DOM ==========
let currentAffiliate = null;

const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('telephone');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeName = document.getElementById('welcomeName');
const totalSportifsSpan = document.getElementById('totalSportifs');
const totalVentesSpan = document.getElementById('totalVentes');
const totalCommissionSpan = document.getElementById('totalCommission');
const pendingSportifsSpan = document.getElementById('pendingSportifs');
const affiliateLinkSpan = document.getElementById('affiliateLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const historyList = document.getElementById('historyList');
const withdrawBtn = document.getElementById('withdrawBtn');

// ========== AUTHENTIFICATION ==========
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let phone = phoneInput ? phoneInput.value.trim() : '';
        phone = phone.replace(/[\s\-\.]/g, '');
        if (!phone) {
            showToast(t('toast.fill_phone'), 'warning');
            return;
        }
        showLoader();
        try {
            const { data, error } = await supabasePublic
                .from('public_affiliates')
                .select('*')
                .eq('telephone', phone)
                .single();
            if (error || !data) {
                showToast(t('toast.login_error'), 'error');
                return;
            }
            currentAffiliate = data;
            sessionStorage.setItem('affiliate_id', data.id);
            renderDashboard(data);
            if (loginContainer) loginContainer.style.display = 'none';
            if (dashboardContainer) dashboardContainer.style.display = 'block';
        } catch (err) {
            console.error(err);
            showToast(t('toast.login_error'), 'error');
        } finally {
            hideLoader();
        }
    });
}

function renderDashboard(affiliate) {
    if (welcomeName) welcomeName.textContent = t('affilie.dashboard.welcome', { name: affiliate.nom });
    
    const baseUrl = window.location.origin;
    let targetPath = (affiliate.type === 'sportif') ? '/premier-pas.html' : '/e-marketing-hubisoccer.html';
    const link = `${baseUrl}${targetPath}?ref=${encodeURIComponent(affiliate.id)}`;
    if (affiliateLinkSpan) affiliateLinkSpan.textContent = link;
    
    loadStats(affiliate.id);
}

async function loadStats(affiliateId) {
    showLoader();
    try {
        // Récupérer les conversions
        const { data: conversions, error } = await supabasePublic
            .from('public_affiliate_conversions')
            .select('*')
            .eq('affiliate_id', affiliateId)
            .order('converted_at', { ascending: false });
        if (error) throw error;
        
        let totalSportifs = 0;
        let totalVentes = 0;
        let totalCommission = 0;
        let pendingSportifs = 0;
        
        for (const conv of conversions || []) {
            if (conv.conversion_type === 'inscription_sportif') {
                totalSportifs++;
                if (conv.status === 'valide') {
                    totalCommission += conv.amount;
                } else {
                    pendingSportifs++;
                }
            } else if (conv.conversion_type === 'achat_produit') {
                totalVentes++;
                totalCommission += conv.amount;
            }
        }
        
        // Récupérer le montant déjà retiré
        const { data: affiliateData, error: affError } = await supabasePublic
            .from('public_affiliates')
            .select('withdrawn_amount')
            .eq('id', affiliateId)
            .single();
        if (!affError && affiliateData) {
            const withdrawn = affiliateData.withdrawn_amount || 0;
            // Stocker le solde disponible dans un attribut data pour utilisation dans le retrait
            if (totalCommissionSpan) totalCommissionSpan.setAttribute('data-total-commission', totalCommission);
            if (totalCommissionSpan) totalCommissionSpan.setAttribute('data-withdrawn', withdrawn);
        }
        
        if (totalSportifsSpan) totalSportifsSpan.textContent = totalSportifs;
        if (totalVentesSpan) totalVentesSpan.textContent = totalVentes;
        if (totalCommissionSpan) totalCommissionSpan.textContent = totalCommission.toLocaleString();
        if (pendingSportifsSpan) pendingSportifsSpan.textContent = pendingSportifs;
        
        if (historyList) {
            if (conversions && conversions.length) {
                let historyHtml = '';
                for (const conv of conversions) {
                    const typeLabel = conv.conversion_type === 'inscription_sportif' ? 'Inscription sportif' : 'Achat produit';
                    const statusLabel = conv.status === 'valide' ? 'Validé' : (conv.status === 'en_attente' ? 'En attente' : 'Rejeté');
                    const statusClass = conv.status === 'valide' ? 'success' : (conv.status === 'en_attente' ? 'warning' : 'danger');
                    historyHtml += `
                        <div class="history-item">
                            <div class="history-info">
                                <span class="history-type">${typeLabel}</span>
                                <span class="history-date">${new Date(conv.converted_at).toLocaleDateString()}</span>
                            </div>
                            <div class="history-amount">${conv.amount.toLocaleString()} FCFA</div>
                            <div class="history-status ${statusClass}">${statusLabel}</div>
                        </div>
                    `;
                }
                historyList.innerHTML = historyHtml;
            } else {
                historyList.innerHTML = `<div class="empty-message">${t('affilie.dashboard.no_history')}</div>`;
            }
        }
    } catch (err) {
        console.error(err);
        if (historyList) historyList.innerHTML = '<div class="empty-message">Erreur chargement historique</div>';
    } finally {
        hideLoader();
    }
}

// ========== COPIE LIEN ==========
if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
        const link = affiliateLinkSpan ? affiliateLinkSpan.textContent : '';
        if (link) {
            navigator.clipboard.writeText(link).then(() => {
                copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
                setTimeout(() => {
                    copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> ' + t('affilie.dashboard.link_copy');
                }, 2000);
            }).catch(() => showToast(t('toast.copy_error'), 'error'));
        }
    });
}

// ========== DEMANDE DE RETRAIT (CORRIGÉE) ==========
if (withdrawBtn) {
    withdrawBtn.addEventListener('click', async () => {
        if (!currentAffiliate) {
            showToast('Aucun affilié connecté', 'error');
            return;
        }
        const amountInput = document.getElementById('withdrawAmount');
        let amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount < 1000) {
            showToast(t('toast.amount_invalid'), 'warning');
            return;
        }
        showLoader();
        try {
            // Récupérer le totalCommission et le withdrawn_amount actuels
            const { data: conversions, error: convError } = await supabasePublic
                .from('public_affiliate_conversions')
                .select('amount, status')
                .eq('affiliate_id', currentAffiliate.id);
            if (convError) throw convError;
            let totalCommission = 0;
            for (const conv of conversions || []) {
                if (conv.status === 'valide') {
                    totalCommission += conv.amount;
                }
            }
            const { data: affData, error: affError } = await supabasePublic
                .from('public_affiliates')
                .select('withdrawn_amount')
                .eq('id', currentAffiliate.id)
                .single();
            if (affError) throw affError;
            const withdrawn = affData?.withdrawn_amount || 0;
            const available = totalCommission - withdrawn;
            if (amount > available) {
                showToast(t('toast.insufficient_balance', { amount: available.toLocaleString() }), 'warning');
                return;
            }
            // Insérer la demande de retrait
            const { error: insertError } = await supabasePublic
                .from('public_withdraw_requests')
                .insert({
                    affiliate_id: currentAffiliate.id,
                    amount: amount,
                    status: 'en_attente',
                    requested_at: new Date().toISOString()
                });
            if (insertError) throw insertError;
            // Mettre à jour withdrawn_amount
            const newWithdrawn = withdrawn + amount;
            const { error: updateError } = await supabasePublic
                .from('public_affiliates')
                .update({ withdrawn_amount: newWithdrawn })
                .eq('id', currentAffiliate.id);
            if (updateError) throw updateError;
            // Mettre à jour l'objet courant
            currentAffiliate.withdrawn_amount = newWithdrawn;
            showToast(t('toast.withdraw_request_sent'), 'success');
            // Rafraîchir l'affichage
            loadStats(currentAffiliate.id);
            amountInput.value = '';
        } catch (err) {
            console.error(err);
            showToast(t('toast.withdraw_error'), 'error');
        } finally {
            hideLoader();
        }
    });
}

// ========== DÉCONNEXION ==========
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('affiliate_id');
        currentAffiliate = null;
        if (loginContainer) loginContainer.style.display = 'block';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (phoneInput) phoneInput.value = '';
        showToast(t('toast.logout_success'), 'success');
    });
}

// ========== VÉRIFICATION SESSION ==========
function checkSession() {
    const savedId = sessionStorage.getItem('affiliate_id');
    if (savedId) {
        showLoader();
        supabasePublic.from('public_affiliates').select('*').eq('id', savedId).single()
            .then(({ data, error }) => {
                if (!error && data) {
                    currentAffiliate = data;
                    renderDashboard(data);
                    if (loginContainer) loginContainer.style.display = 'none';
                    if (dashboardContainer) dashboardContainer.style.display = 'block';
                } else {
                    sessionStorage.removeItem('affiliate_id');
                }
            })
            .finally(() => hideLoader());
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (dashboardContainer) dashboardContainer.style.display = 'none';
    }
}

// ========== UTILITAIRES ==========
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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    checkSession();
});