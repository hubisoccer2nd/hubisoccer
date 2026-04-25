// ========== AFFILIATION.JS ==========
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
        'affiliation.header.title': 'Programme Ambassadeur',
        'affiliation.header.highlight': 'HubISoccer',
        'affiliation.header.subtitle': 'Gagnez de l\'argent en partageant notre mission et en détectant des talents.',
        'affiliation.already_affiliate': 'Déjà affilié ?',
        'affiliation.login_link': 'Connectez-vous à votre espace',
        'affiliation.steps.title': 'Comment ça marche ?',
        'affiliation.steps.step1_title': 'Générez votre lien',
        'affiliation.steps.step1_desc': 'Créez votre lien d\'affiliation personnalisé en entrant vos informations.',
        'affiliation.steps.step2_title': 'Partagez-le',
        'affiliation.steps.step2_desc': 'Diffusez votre lien sur WhatsApp, Facebook, TikTok, ou à vos contacts.',
        'affiliation.steps.step3_title': 'Gagnez des commissions',
        'affiliation.steps.step3_desc': 'Chaque inscription validée de sportif (10%) ou achat via votre lien (4%) vous rapporte une commission.',
        'affiliation.form.title': 'Créez votre lien d\'affiliation',
        'affiliation.form.recommend': 'Je souhaite recommander :',
        'affiliation.form.type_sportif': 'Un sportif (lien vers inscription sportif)',
        'affiliation.form.type_produit': 'Un produit de la boutique',
        'affiliation.form.country': 'Votre pays',
        'affiliation.form.country_select': 'Sélectionnez',
        'affiliation.form.fullname': 'Nom et prénom',
        'affiliation.form.whatsapp': 'Numéro WhatsApp',
        'affiliation.form.payment_method': 'Moyen de paiement',
        'affiliation.form.payment_select': 'Choisissez un moyen',
        'affiliation.form.payment_mobile': 'Mobile Money (rapide : 0-72h)',
        'affiliation.form.payment_other': 'Autre (jusqu\'à 15 jours)',
        'affiliation.form.accept_terms': 'J\'accepte les conditions générales du programme d\'affiliation.',
        'affiliation.form.generate': 'Générer mon lien',
        'affiliation.result.link_label': 'Votre lien d\'affiliation :',
        'affiliation.result.copy': 'Copier',
        'affiliation.result.info': '💡 Toute inscription ou achat via ce lien sera tracé. Vous pourrez suivre vos gains dans votre espace.',
        'affiliation.sim.title': 'Simulation de gains',
        'affiliation.sim.subtitle': 'Voici un aperçu de ce que vous pourriez gagner.',
        'affiliation.sim.sportifs': 'Sportifs validés',
        'affiliation.sim.ventes': 'Ventes',
        'affiliation.sim.mixte': 'Mixte',
        'affiliation.faq.title': 'Questions fréquentes',
        'affiliation.faq.q1': 'Qui peut devenir ambassadeur ?',
        'affiliation.faq.a1': 'Toute personne passionnée de sport peut devenir ambassadeur, sans condition.',
        'affiliation.faq.q2': 'Comment sont calculées les commissions ?',
        'affiliation.faq.a2': '10% du montant de l\'inscription du sportif (après validation) et 4% du montant de chaque achat effectué via votre lien.',
        'affiliation.faq.q3': 'Quand et comment suis-je payé ?',
        'affiliation.faq.a3': 'Les gains sont versés selon le moyen choisi : Mobile Money sous 72h, autres sous 15 jours.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.accept_terms': 'Vous devez accepter les conditions générales.',
        'toast.affiliate_saved': 'Inscription réussie ! Votre lien a été généré.',
        'toast.save_error': 'Erreur lors de l\'enregistrement. Veuillez réessayer.',
        'toast.copy_success': 'Lien copié !',
        'toast.copy_error': 'Erreur de copie'
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
        'affiliation.header.title': 'Ambassador Program',
        'affiliation.header.highlight': 'HubISoccer',
        'affiliation.header.subtitle': 'Earn money by sharing our mission and spotting talent.',
        'affiliation.already_affiliate': 'Already an affiliate?',
        'affiliation.login_link': 'Login to your space',
        'affiliation.steps.title': 'How does it work?',
        'affiliation.steps.step1_title': 'Generate your link',
        'affiliation.steps.step1_desc': 'Create your personalized affiliate link by entering your details.',
        'affiliation.steps.step2_title': 'Share it',
        'affiliation.steps.step2_desc': 'Share your link on WhatsApp, Facebook, TikTok, or with your contacts.',
        'affiliation.steps.step3_title': 'Earn commissions',
        'affiliation.steps.step3_desc': 'Each validated athlete registration (10%) or purchase via your link (4%) earns you a commission.',
        'affiliation.form.title': 'Create your affiliate link',
        'affiliation.form.recommend': 'I want to recommend:',
        'affiliation.form.type_sportif': 'An athlete (link to athlete registration)',
        'affiliation.form.type_produit': 'A product from the store',
        'affiliation.form.country': 'Your country',
        'affiliation.form.country_select': 'Select',
        'affiliation.form.fullname': 'Full name',
        'affiliation.form.whatsapp': 'WhatsApp number',
        'affiliation.form.payment_method': 'Payment method',
        'affiliation.form.payment_select': 'Choose a method',
        'affiliation.form.payment_mobile': 'Mobile Money (fast: 0-72h)',
        'affiliation.form.payment_other': 'Other (up to 15 days)',
        'affiliation.form.accept_terms': 'I accept the terms and conditions of the affiliate program.',
        'affiliation.form.generate': 'Generate my link',
        'affiliation.result.link_label': 'Your affiliate link:',
        'affiliation.result.copy': 'Copy',
        'affiliation.result.info': '💡 Any registration or purchase via this link will be tracked. You can track your earnings in your space.',
        'affiliation.sim.title': 'Earnings simulation',
        'affiliation.sim.subtitle': 'Here is an overview of what you could earn.',
        'affiliation.sim.sportifs': 'Validated athletes',
        'affiliation.sim.ventes': 'Sales',
        'affiliation.sim.mixte': 'Mixed',
        'affiliation.faq.title': 'Frequently asked questions',
        'affiliation.faq.q1': 'Who can become an ambassador?',
        'affiliation.faq.a1': 'Anyone passionate about sports can become an ambassador, no conditions.',
        'affiliation.faq.q2': 'How are commissions calculated?',
        'affiliation.faq.a2': '10% of the athlete registration fee (after validation) and 4% of each purchase made via your link.',
        'affiliation.faq.q3': 'When and how am I paid?',
        'affiliation.faq.a3': 'Earnings are paid according to the chosen method: Mobile Money within 72h, others within 15 days.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.accept_terms': 'You must accept the terms and conditions.',
        'toast.affiliate_saved': 'Registration successful! Your link has been generated.',
        'toast.save_error': 'Error saving registration. Please try again.',
        'toast.copy_success': 'Link copied!',
        'toast.copy_error': 'Copy error'
    }
};

let currentLang = localStorage.getItem('affiliation_lang') || navigator.language.split('-')[0];
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
    updateSimulation();
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('affiliation_lang', lang);
        applyTranslations();
    }
}

// ========== SIMULATION (front-end) ==========
function updateSimulation() {
    const simSportifs = document.getElementById('simSportifs');
    const simVentes = document.getElementById('simVentes');
    const simMixte = document.getElementById('simMixte');
    if (simSportifs) simSportifs.textContent = (10 * 500).toLocaleString(); // 10 sportifs * 500 FCFA * 10% = 50
    if (simVentes) simVentes.textContent = (25 * 2500 * 0.04).toLocaleString(); // 25 ventes * 5000 FCFA * 4% = 5000
    if (simMixte) simMixte.textContent = (15 * 500 * 0.10 + 20 * 2500 * 0.04).toLocaleString();
}

// ========== AFFILIATION FORM ==========
async function saveAffiliate(data) {
    const { error } = await supabasePublic.from('public_affiliates').insert([data]);
    if (error) {
        console.error('Erreur sauvegarde affilié:', error);
        return false;
    }
    return true;
}

function generateAffiliateId() {
    return 'aff_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

function initAffiliationForm() {
    const form = document.getElementById('affiliationForm');
    if (!form) return;

    const resultArea = document.getElementById('resultArea');
    const affLinkSpan = document.getElementById('affLink');
    const copyBtn = document.getElementById('copyBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = document.querySelector('input[name="type"]:checked')?.value;
        const pays = document.getElementById('pays').value;
        const nom = document.getElementById('nom').value.trim();
        let telephone = document.getElementById('telephone').value.trim(); telephone = telephone.replace(/[\s\-\.]/g, ''); // supprime espaces, tirets, points
        const paiement = document.getElementById('paiement').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        if (!pays || !nom || !telephone || !paiement) {
            showToast(t('toast.fill_fields'), 'warning');
            return;
        }
        if (!acceptTerms) {
            showToast(t('toast.accept_terms'), 'warning');
            return;
        }

        const affiliateId = generateAffiliateId();
        const affiliate = {
            id: affiliateId,
            type,
            pays,
            nom,
            telephone,
            paiement,
            count: 0,
            valide: false,
            created_at: new Date().toISOString()
        };

        showLoader();
        const success = await saveAffiliate(affiliate);
        hideLoader();
        if (!success) {
            showToast(t('toast.save_error'), 'error');
            return;
        }

        const baseUrl = window.location.origin;
        let targetPath = (type === 'sportif') ? '/premier-pas.html' : '/e-marketing-hubisoccer.html';
        const link = `${baseUrl}${targetPath}?ref=${encodeURIComponent(affiliateId)}`;

        affLinkSpan.textContent = link;
        resultArea.style.display = 'block';
        showToast(t('toast.affiliate_saved'), 'success');
        form.reset();
    });

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const link = affLinkSpan.textContent;
            if (link) {
                navigator.clipboard.writeText(link).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> ' + t('affiliation.result.copy');
                    }, 2000);
                }).catch(() => showToast(t('toast.copy_error'), 'error'));
            }
        });
    }
}

// ========== FAQ TOGGLE ==========
function toggleFaq(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    element.classList.toggle('active');
    answer.classList.toggle('show');
    if (icon) {
        icon.style.transform = element.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
    }
}
window.toggleFaq = toggleFaq;

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
    initAffiliationForm();
    updateSimulation();
});