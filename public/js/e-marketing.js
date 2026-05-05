// ========== E-MARKETING.JS – VERSION FINALE COMPLÈTE ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseMarket = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (FR + EN) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESSUS',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'DEVENIR ACTEUR',
        'nav.tournoi': 'TOURNOIS PUBLIC',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'emarket.hero.title': 'Le Marché',
        'emarket.hero.highlight': 'HubISoccer',
        'emarket.hero.subtitle': 'Flânez entre les étals, découvrez des produits uniques pour champions, et laissez-vous tenter par les saveurs du football.',
        'emarket.packs.title': '🔥 Packs exclusifs du moment',
        'emarket.all.title': '🛍️ Tous nos articles',
        'emarket.cart.title': 'Votre panier',
        'emarket.cart.empty': 'Votre panier est vide.',
        'emarket.cart.total_ht': 'Total HT :',
        'emarket.cart.tva': 'TVA (18%) :',
        'emarket.cart.total_ttc': 'Total TTC :',
        'emarket.cart.continue': 'Continuer les achats',
        'emarket.cart.checkout': 'Passer la commande',
        'emarket.auth.login_title': 'Connexion',
        'emarket.auth.email': 'Email',
        'emarket.auth.password': 'Mot de passe',
        'emarket.auth.login_btn': 'Se connecter',
        'emarket.auth.forgot': 'Mot de passe oublié ?',
        'emarket.auth.register_link': 'Pas encore de compte ? Inscrivez-vous',
        'emarket.auth.register_title': 'Nouveau client',
        'emarket.auth.firstname': 'Prénom',
        'emarket.auth.lastname': 'Nom',
        'emarket.auth.phone': 'Téléphone',
        'emarket.auth.confirm_password': 'Confirmer le mot de passe',
        'emarket.auth.register_btn': 'S\'inscrire',
        'emarket.auth.login_link': 'Déjà inscrit ? Connectez-vous',
        'emarket.auth.forgot_title': 'Réinitialisation du mot de passe',
        'emarket.auth.forgot_text': 'Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.',
        'emarket.auth.forgot_btn': 'Envoyer',
        'emarket.auth.back_login': 'Retour à la connexion',
        'emarket.checkout.title': 'Finaliser la commande',
        'emarket.checkout.fullname': 'Nom complet',
        'emarket.checkout.email': 'Email',
        'emarket.checkout.phone': 'Téléphone',
        'emarket.checkout.total_ht': 'Total HT :',
        'emarket.checkout.tva': 'TVA (18%) :',
        'emarket.checkout.total_ttc': 'Total TTC :',
        'emarket.checkout.pay': 'Payer avec FedaPay',
        'emarket.account.title': 'Mon compte',
        'emarket.account.orders': 'Mes commandes',
        'emarket.account.messages': 'Mes messages',
        'emarket.account.profile': 'Mon profil',
        'emarket.account.orders_title': 'Mes commandes',
        'emarket.account.messages_title': 'Mes messages',
        'emarket.account.new_message': 'Nouveau message',
        'emarket.account.profile_title': 'Mon profil',
        'emarket.account.edit': 'Modifier',
        'emarket.account.save': 'Enregistrer',
        'emarket.message.title': 'Envoyer un message',
        'emarket.message.content': 'Votre message',
        'emarket.message.send': 'Envoyer',
        'emarket.order.detail_title': 'Détail de la commande',
        'emarket.order.close': 'Fermer',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load': 'Erreur chargement des produits',
        'toast.cart_added': 'Produit ajouté au panier',
        'toast.cart_updated': 'Panier mis à jour',
        'toast.cart_removed': 'Produit retiré',
        'toast.login_success': 'Connexion réussie',
        'toast.login_error': 'Email ou mot de passe incorrect',
        'toast.register_success': 'Inscription réussie',
        'toast.register_error': 'Erreur lors de l\'inscription',
        'toast.fill_fields': 'Veuillez remplir tous les champs',
        'toast.passwords_mismatch': 'Les mots de passe ne correspondent pas',
        'toast.checkout_empty': 'Votre panier est vide',
        'toast.order_created': 'Commande créée, redirection vers le paiement...',
        'toast.message_sent': 'Message envoyé',
        'toast.profile_updated': 'Profil mis à jour'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESS',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'BECOME AN ACTOR',
        'nav.tournoi': 'PUBLIC TOURNAMENT',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'emarket.hero.title': 'The Market',
        'emarket.hero.highlight': 'HubISoccer',
        'emarket.hero.subtitle': 'Stroll through the stalls, discover unique products for champions, and indulge in the flavors of football.',
        'emarket.packs.title': '🔥 Exclusive packs',
        'emarket.all.title': '🛍️ All our products',
        'emarket.cart.title': 'Your cart',
        'emarket.cart.empty': 'Your cart is empty.',
        'emarket.cart.total_ht': 'Total excl. tax:',
        'emarket.cart.tva': 'VAT (18%):',
        'emarket.cart.total_ttc': 'Total incl. tax:',
        'emarket.cart.continue': 'Continue shopping',
        'emarket.cart.checkout': 'Checkout',
        'emarket.auth.login_title': 'Login',
        'emarket.auth.email': 'Email',
        'emarket.auth.password': 'Password',
        'emarket.auth.login_btn': 'Login',
        'emarket.auth.forgot': 'Forgot password?',
        'emarket.auth.register_link': 'No account? Sign up',
        'emarket.auth.register_title': 'New customer',
        'emarket.auth.firstname': 'First name',
        'emarket.auth.lastname': 'Last name',
        'emarket.auth.phone': 'Phone',
        'emarket.auth.confirm_password': 'Confirm password',
        'emarket.auth.register_btn': 'Sign up',
        'emarket.auth.login_link': 'Already have an account? Login',
        'emarket.auth.forgot_title': 'Reset password',
        'emarket.auth.forgot_text': 'Enter your email, we will send you a link to reset your password.',
        'emarket.auth.forgot_btn': 'Send',
        'emarket.auth.back_login': 'Back to login',
        'emarket.checkout.title': 'Checkout',
        'emarket.checkout.fullname': 'Full name',
        'emarket.checkout.email': 'Email',
        'emarket.checkout.phone': 'Phone',
        'emarket.checkout.total_ht': 'Total excl. tax:',
        'emarket.checkout.tva': 'VAT (18%):',
        'emarket.checkout.total_ttc': 'Total incl. tax:',
        'emarket.checkout.pay': 'Pay with FedaPay',
        'emarket.account.title': 'My account',
        'emarket.account.orders': 'My orders',
        'emarket.account.messages': 'My messages',
        'emarket.account.profile': 'My profile',
        'emarket.account.orders_title': 'My orders',
        'emarket.account.messages_title': 'My messages',
        'emarket.account.new_message': 'New message',
        'emarket.account.profile_title': 'My profile',
        'emarket.account.edit': 'Edit',
        'emarket.account.save': 'Save',
        'emarket.message.title': 'Send a message',
        'emarket.message.content': 'Your message',
        'emarket.message.send': 'Send',
        'emarket.order.detail_title': 'Order details',
        'emarket.order.close': 'Close',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load': 'Error loading products',
        'toast.cart_added': 'Product added to cart',
        'toast.cart_updated': 'Cart updated',
        'toast.cart_removed': 'Product removed',
        'toast.login_success': 'Login successful',
        'toast.login_error': 'Incorrect email or password',
        'toast.register_success': 'Registration successful',
        'toast.register_error': 'Registration error',
        'toast.fill_fields': 'Please fill in all fields',
        'toast.passwords_mismatch': 'Passwords do not match',
        'toast.checkout_empty': 'Your cart is empty',
        'toast.order_created': 'Order created, redirecting to payment...',
        'toast.message_sent': 'Message sent',
        'toast.profile_updated': 'Profile updated'
    }
};

let currentLang = localStorage.getItem('emarket_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('emarket_lang', lang);
        applyTranslations();
        emarketRenderProducts();
        if (currentCustomer) emarketUpdateCustomerUI();
    }
}

// ========== ÉLÉMENTS DOM ==========
const featuredContainer = document.getElementById('featuredPacks');
const allProductsContainer = document.getElementById('allProducts');
const cartCountSpan = document.getElementById('cartCount');
const cartFloat = document.getElementById('cartFloat');
const cartModal = document.getElementById('cartModal');
const cartItemsDiv = document.getElementById('cartItems');
const cartTotalHTSpan = document.getElementById('cartTotalHT');
const cartTVASpan = document.getElementById('cartTVA');
const cartTotalTTCSpan = document.getElementById('cartTotalTTC');
const checkoutBtn = document.getElementById('checkoutBtn');
const authModal = document.getElementById('authModal');
const checkoutModal = document.getElementById('checkoutModal');
const accountModal = document.getElementById('accountModal');
const sendMessageModal = document.getElementById('sendMessageModal');
const orderDetailModal = document.getElementById('orderDetailModal');
const productDetailModal = document.getElementById('productDetailModal');

// Formulaires auth
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotForm = document.getElementById('forgotForm');
const authModalTitle = document.getElementById('authModalTitle');

// Champs auth
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const regFirstName = document.getElementById('regFirstName');
const regLastName = document.getElementById('regLastName');
const regEmail = document.getElementById('regEmail');
const regPhone = document.getElementById('regPhone');
const regPassword = document.getElementById('regPassword');
const regPasswordConfirm = document.getElementById('regPasswordConfirm');
const forgotEmail = document.getElementById('forgotEmail');

// Éléments de navigation
const customerGreeting = document.getElementById('customerGreeting');
const logoutCustomerLink = document.getElementById('logoutCustomerLink');
const myAccountLink = document.getElementById('myAccountLink');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

// Éléments checkout
const checkoutFullName = document.getElementById('checkoutFullName');
const checkoutEmail = document.getElementById('checkoutEmail');
const checkoutPhone = document.getElementById('checkoutPhone');
const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutTotalHTSpan = document.getElementById('checkoutTotalHT');
const checkoutTVASpan = document.getElementById('checkoutTVA');
const checkoutTotalTTCSpan = document.getElementById('checkoutTotalTTC');
const checkoutForm = document.getElementById('checkoutForm');

// Éléments compte client
const ordersListDiv = document.getElementById('ordersList');
const messagesListDiv = document.getElementById('messagesList');
const profileFirstName = document.getElementById('profileFirstName');
const profileLastName = document.getElementById('profileLastName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileForm = document.getElementById('profileForm');
const newMessageBtn = document.getElementById('newMessageBtn');
const tabBtns = document.querySelectorAll('.tab-btn');

// Éléments message
const messageOrderId = document.getElementById('messageOrderId');
const newMessageText = document.getElementById('newMessageText');
const sendMessageForm = document.getElementById('sendMessageForm');

// Élément détail commande
const orderDetailContent = document.getElementById('orderDetailContent');

// Éléments détail produit
const detailName = document.getElementById('detailName');
const detailDescription = document.getElementById('detailDescription');
const detailPrice = document.getElementById('detailPrice');
const detailStockBadge = document.getElementById('detailStockBadge');
const detailImage = document.getElementById('detailImage');
const detailVideo = document.getElementById('detailVideo');
const detailAddToCart = document.getElementById('detailAddToCart');

// ===== ÉTAT GLOBAL =====
let currentCustomer = null;
let cart = JSON.parse(localStorage.getItem('emarket_cart')) || [];
let products = [];

// ===== FONCTIONS DE PANIER =====
function emarketUpdateCartCount() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.textContent = totalItems;
    localStorage.setItem('emarket_cart', JSON.stringify(cart));
}

function emarketRenderCartModal() {
    if (!cartItemsDiv) return;
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>' + t('emarket.cart.empty') + '</p>';
        if (cartTotalHTSpan) cartTotalHTSpan.textContent = '0';
        if (cartTVASpan) cartTVASpan.textContent = '0';
        if (cartTotalTTCSpan) cartTotalTTCSpan.textContent = '0';
        return;
    }
    let html = '';
    let totalHT = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        const subtotal = product.price * item.quantity;
        totalHT += subtotal;
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${escapeHtml(product.name)}</h4>
                    <p>${product.price} FCFA x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-qty-minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="cart-qty-plus" data-id="${item.id}">+</button>
                    <button class="cart-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    const tva = Math.round(totalHT * 0.18);
    const totalTTC = totalHT + tva;
    cartItemsDiv.innerHTML = html;
    if (cartTotalHTSpan) cartTotalHTSpan.textContent = totalHT;
    if (cartTVASpan) cartTVASpan.textContent = tva;
    if (cartTotalTTCSpan) cartTotalTTCSpan.textContent = totalTTC;
}

function emarketAddToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ id: productId, quantity: 1 });
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_added'), 'success');
}

function emarketUpdateCartItem(productId, delta) {
    const index = cart.findIndex(item => item.id === productId);
    if (index === -1) return;
    const newQty = cart[index].quantity + delta;
    if (newQty <= 0) cart.splice(index, 1);
    else cart[index].quantity = newQty;
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_updated'), 'info');
}

function emarketRemoveCartItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_removed'), 'info');
}

// ===== CHARGEMENT DES PRODUITS =====
async function emarketLoadProducts() {
    showLoader();
    try {
        const { data, error } = await supabaseMarket
            .from('public_emarket_products')
            .select('*')
            .order('id');
        if (error) throw error;
        products = data || [];
        emarketRenderProducts();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load'), 'error');
        if (featuredContainer) featuredContainer.innerHTML = '<p>' + t('toast.error_load') + '</p>';
        if (allProductsContainer) allProductsContainer.innerHTML = '<p>' + t('toast.error_load') + '</p>';
    } finally {
        hideLoader();
    }
}

function emarketRenderProducts() {
    if (!products || products.length === 0) {
        if (featuredContainer) featuredContainer.innerHTML = '<p>Aucun produit.</p>';
        if (allProductsContainer) allProductsContainer.innerHTML = '<p>Aucun produit.</p>';
        return;
    }
    const featured = products.filter(p => p.featured);
    const others = products.filter(p => !p.featured);
    if (featuredContainer) featuredContainer.innerHTML = featured.map(p => emarketRenderProductCard(p)).join('');
    if (allProductsContainer) allProductsContainer.innerHTML = others.map(p => emarketRenderProductCard(p)).join('');
}

function emarketRenderProductCard(product) {
    const stockClass = product.stock ? '' : 'out-of-stock';
    const stockText = product.stock ? (currentLang === 'fr' ? 'En stock' : 'In stock') : (currentLang === 'fr' ? 'Épuisé' : 'Out of stock');
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url || 'img/placeholder.jpg'}" alt="${escapeHtml(product.name)}" onerror="this.src='img/placeholder.jpg'">
                ${product.featured ? '<span class="featured-badge">🔥 Vedette</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="product-desc">${escapeHtml(product.description || '')}</p>
                <div class="product-meta">
                    <span class="product-price">${product.price} FCFA</span>
                    <span class="product-stock ${stockClass}">${stockText}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-add-cart" data-id="${product.id}" ${!product.stock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> ${currentLang === 'fr' ? 'Ajouter' : 'Add'}
                    </button>
                    <button class="btn-details" data-id="${product.id}">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== MODALE DÉTAIL PRODUIT =====
function emarketOpenProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    detailName.textContent = product.name;
    detailDescription.textContent = product.description || '';
    detailPrice.textContent = product.price + ' FCFA';

    detailStockBadge.textContent = product.stock ? (currentLang === 'fr' ? 'En stock' : 'In stock') : (currentLang === 'fr' ? 'Épuisé' : 'Out of stock');
    detailStockBadge.className = 'stock-badge ' + (product.stock ? 'in-stock' : 'out-of-stock');

    detailImage.style.display = 'none';
    detailVideo.style.display = 'none';

    if (product.video_url) {
        detailVideo.src = product.video_url;
        detailVideo.style.display = 'block';
    } else if (product.image_url) {
        detailImage.src = product.image_url;
        detailImage.style.display = 'block';
    }

    detailAddToCart.dataset.id = product.id;
    detailAddToCart.disabled = !product.stock;

    productDetailModal.classList.add('active');
}

function emarketCloseProductDetail() {
    productDetailModal.classList.remove('active');
}

// ===== AUTHENTIFICATION (avec bcrypt) =====
async function emarketWaitForBcrypt() {
    return new Promise((resolve) => {
        if (typeof dcodeIO !== 'undefined' && typeof dcodeIO.bcrypt !== 'undefined') { resolve(); return; }
        const interval = setInterval(() => {
            if (typeof dcodeIO !== 'undefined' && typeof dcodeIO.bcrypt !== 'undefined') { clearInterval(interval); clearTimeout(timeout); resolve(); }
        }, 100);
        const timeout = setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
    });
}

async function emarketRegisterCustomer(firstName, lastName, email, phone, password) {
    await emarketWaitForBcrypt();
    if (typeof dcodeIO === 'undefined' || typeof dcodeIO.bcrypt === 'undefined') {
        showToast('Erreur de chargement de la sécurité', 'error');
        return null;
    }
    const salt = dcodeIO.bcrypt.genSaltSync(10);
    const hash = dcodeIO.bcrypt.hashSync(password, salt);
    const { data, error } = await supabaseMarket
        .from('public_emarket_customers')
        .insert([{ first_name: firstName, last_name: lastName, email, phone, password: hash }])
        .select()
        .single();
    if (error) {
        showToast(t('toast.register_error') + ': ' + error.message, 'error');
        return null;
    }
    currentCustomer = data;
    localStorage.setItem('emarket_customer', JSON.stringify(data));
    emarketUpdateCustomerUI();
    showToast(t('toast.register_success'), 'success');
    emarketCloseAuthModal();
    return data;
}

async function emarketLoginCustomer(email, password) {
    await emarketWaitForBcrypt();
    if (typeof dcodeIO === 'undefined' || typeof dcodeIO.bcrypt === 'undefined') {
        showToast('Erreur de chargement de la sécurité', 'error');
        return null;
    }
    const { data, error } = await supabaseMarket
        .from('public_emarket_customers')
        .select('*')
        .eq('email', email)
        .single();
    if (error || !data) {
        showToast(t('toast.login_error'), 'error');
        return null;
    }
    const valid = dcodeIO.bcrypt.compareSync(password, data.password);
    if (!valid) {
        showToast(t('toast.login_error'), 'error');
        return null;
    }
    currentCustomer = data;
    localStorage.setItem('emarket_customer', JSON.stringify(data));
    emarketUpdateCustomerUI();
    showToast(t('toast.login_success'), 'success');
    emarketCloseAuthModal();
    return data;
}

function emarketHandleLogoutCustomer() {
    currentCustomer = null;
    localStorage.removeItem('emarket_customer');
    emarketUpdateCustomerUI();
    showToast('Déconnecté', 'info');
}

function emarketUpdateCustomerUI() {
    if (!customerGreeting || !logoutCustomerLink || !myAccountLink || !loginBtn || !signupBtn) return;
    if (currentCustomer) {
        customerGreeting.textContent = `Bonjour ${currentCustomer.first_name}`;
        customerGreeting.style.display = 'inline';
        logoutCustomerLink.style.display = 'inline';
        myAccountLink.style.display = 'inline';
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
    } else {
        customerGreeting.style.display = 'none';
        logoutCustomerLink.style.display = 'none';
        myAccountLink.style.display = 'none';
        loginBtn.style.display = 'inline';
        signupBtn.style.display = 'inline';
    }
}

// ===== MODALES =====
function emarketOpenCartModal() { if (cartModal) cartModal.classList.add('active'); }
function emarketCloseCartModal() { if (cartModal) cartModal.classList.remove('active'); }
function emarketOpenAuthModal() { if (authModal) authModal.classList.add('active'); }
function emarketCloseAuthModal() { if (authModal) authModal.classList.remove('active'); }
function emarketShowLoginForm() {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (authModalTitle) authModalTitle.textContent = t('emarket.auth.login_title');
}
function emarketShowRegisterForm() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (authModalTitle) authModalTitle.textContent = t('emarket.auth.register_title');
}
function emarketShowForgotPassword() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'block';
    if (authModalTitle) authModalTitle.textContent = t('emarket.auth.forgot_title');
}
function emarketOpenCheckoutModal() {
    if (!currentCustomer) { emarketOpenAuthModal(); return; }
    if (cart.length === 0) { showToast(t('toast.checkout_empty'), 'warning'); return; }
    if (checkoutFullName) checkoutFullName.value = `${currentCustomer.first_name} ${currentCustomer.last_name}`;
    if (checkoutEmail) checkoutEmail.value = currentCustomer.email;
    if (checkoutPhone) checkoutPhone.value = currentCustomer.phone || '';
    let summaryHtml = '';
    let totalHT = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        const subtotal = product.price * item.quantity;
        totalHT += subtotal;
        summaryHtml += `<p>${escapeHtml(product.name)} x${item.quantity} = ${subtotal} FCFA</p>`;
    });
    const tva = Math.round(totalHT * 0.18);
    const totalTTC = totalHT + tva;
    if (checkoutSummary) checkoutSummary.innerHTML = summaryHtml;
    if (checkoutTotalHTSpan) checkoutTotalHTSpan.textContent = totalHT;
    if (checkoutTVASpan) checkoutTVASpan.textContent = tva;
    if (checkoutTotalTTCSpan) checkoutTotalTTCSpan.textContent = totalTTC;
    if (checkoutModal) checkoutModal.classList.add('active');
}
function emarketCloseCheckoutModal() { if (checkoutModal) checkoutModal.classList.remove('active'); }
function emarketOpenAccountModal() {
    if (!currentCustomer) { emarketOpenAuthModal(); return; }
    emarketLoadCustomerOrders();
    emarketLoadCustomerMessages();
    if (profileFirstName) profileFirstName.value = currentCustomer.first_name || '';
    if (profileLastName) profileLastName.value = currentCustomer.last_name || '';
    if (profileEmail) profileEmail.value = currentCustomer.email || '';
    if (profilePhone) profilePhone.value = currentCustomer.phone || '';
    if (accountModal) accountModal.classList.add('active');
}
function emarketCloseAccountModal() { if (accountModal) accountModal.classList.remove('active'); }
function emarketOpenSendMessageModal(orderId = null) {
    if (!currentCustomer) { emarketOpenAuthModal(); return; }
    if (messageOrderId) messageOrderId.value = orderId || '';
    if (newMessageText) newMessageText.value = '';
    if (sendMessageModal) sendMessageModal.classList.add('active');
}
function emarketCloseSendMessageModal() { if (sendMessageModal) sendMessageModal.classList.remove('active'); }
function emarketOpenOrderDetailModal(orderId) {
    emarketLoadOrderDetail(orderId);
    if (orderDetailModal) orderDetailModal.classList.add('active');
}
function emarketCloseOrderDetailModal() { if (orderDetailModal) orderDetailModal.classList.remove('active'); }
function emarketTogglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== CHARGEMENT DES COMMANDES ET MESSAGES =====
async function emarketLoadCustomerOrders() {
    if (!currentCustomer || !ordersListDiv) return;
    const { data, error } = await supabaseMarket
        .from('public_emarket_orders')
        .select('*')
        .eq('customer_id', currentCustomer.id)
        .order('created_at', { ascending: false });
    if (error) { ordersListDiv.innerHTML = '<p>Erreur</p>'; return; }
    if (!data.length) { ordersListDiv.innerHTML = '<p>Aucune commande.</p>'; return; }
    let html = '';
    data.forEach(order => {
        html += `
            <div class="order-item" data-id="${order.id}">
                <p><strong>Commande #${order.id}</strong> - ${new Date(order.created_at).toLocaleString()}</p>
                <p>Statut : ${order.status} - Total TTC : ${order.total_ttc} FCFA</p>
                <button class="btn-view-order" onclick="emarketOpenOrderDetailModal(${order.id})">Voir détail</button>
                <button class="btn-message" onclick="emarketOpenSendMessageModal(${order.id})">Message</button>
            </div>
        `;
    });
    ordersListDiv.innerHTML = html;
}

async function emarketLoadCustomerMessages() {
    if (!currentCustomer || !messagesListDiv) return;
    const { data, error } = await supabaseMarket
        .from('public_emarket_messages')
        .select('*')
        .eq('customer_id', currentCustomer.id)
        .order('created_at', { ascending: false });
    if (error) { messagesListDiv.innerHTML = '<p>Erreur</p>'; return; }
    if (!data.length) { messagesListDiv.innerHTML = '<p>Aucun message.</p>'; return; }
    let html = '';
    data.forEach(msg => {
        html += `
            <div class="message-item">
                <p><strong>${new Date(msg.created_at).toLocaleString()}</strong> ${msg.order_id ? '(Commande #' + msg.order_id + ')' : ''}</p>
                <p>${escapeHtml(msg.message)}</p>
                ${msg.admin_reply ? '<p><strong>Réponse admin :</strong> ' + escapeHtml(msg.admin_reply) + '</p>' : ''}
            </div>
        `;
    });
    messagesListDiv.innerHTML = html;
}

async function emarketLoadOrderDetail(orderId) {
    if (!orderDetailContent) return;
    const { data: order, error } = await supabaseMarket
        .from('public_emarket_orders')
        .select('*, public_emarket_order_items(*, public_emarket_products(*))')
        .eq('id', orderId)
        .single();
    if (error) { orderDetailContent.innerHTML = '<p>Erreur chargement commande.</p>'; return; }
    let itemsHtml = '';
    order.public_emarket_order_items.forEach(item => {
        itemsHtml += `<p>${item.public_emarket_products.name} x${item.quantity} = ${item.total_price} FCFA</p>`;
    });
    orderDetailContent.innerHTML = `
        <p><strong>Commande #${order.id}</strong></p>
        <p>Date : ${new Date(order.created_at).toLocaleString()}</p>
        <p>Statut : ${order.status}</p>
        <p>Total HT : ${order.total_ht} FCFA</p>
        <p>TVA (18%) : ${order.tva} FCFA</p>
        <p><strong>Total TTC : ${order.total_ttc} FCFA</strong></p>
        <p>Articles :</p>
        ${itemsHtml}
        ${order.invoice_proforma_url ? `<p><a href="${order.invoice_proforma_url}" target="_blank">Facture proforma</a></p>` : ''}
        ${order.invoice_definitive_url ? `<p><a href="${order.invoice_definitive_url}" target="_blank">Facture définitive</a></p>` : ''}
        ${order.tracking_info ? `<p>Suivi : ${order.tracking_info}</p>` : ''}
    `;
}

// ===== CRÉATION DE COMMANDE =====
async function emarketCreateOrder() {
    const totalHT = cart.reduce((sum, item) => {
        const p = products.find(p => p.id === item.id);
        return sum + (p ? p.price * item.quantity : 0);
    }, 0);
    const tva = Math.round(totalHT * 0.18);
    const totalTTC = totalHT + tva;
    const { data: order, error } = await supabaseMarket
        .from('public_emarket_orders')
        .insert([{
            customer_id: currentCustomer.id,
            total_ht: totalHT,
            tva: tva,
            total_ttc: totalTTC,
            status: 'en_attente'
        }])
        .select()
        .single();
    if (error) { showToast('Erreur création commande', 'error'); return null; }
    const items = cart.map(item => {
        const p = products.find(p => p.id === item.id);
        return {
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: p.price,
            total_price: p.price * item.quantity
        };
    });
    const { error: itemsError } = await supabaseMarket
        .from('public_emarket_order_items')
        .insert(items);
    if (itemsError) { showToast('Erreur enregistrement articles', 'error'); return null; }
    return order;
}

async function emarketGenerateProformaInvoice(order, customer) {
    const element = document.createElement('div');
    element.innerHTML = `<h1>Facture Proforma</h1><p>Commande #${order.id}</p><p>Client : ${customer.first_name} ${customer.last_name}</p>`;
    const opt = { margin: 0.5, filename: `proforma_${order.id}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4' } };
    const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
    const fileName = `invoices/proforma_${order.id}.pdf`;
    const { error } = await supabaseMarket.storage.from('emarket_invoices').upload(fileName, pdfBlob, { upsert: true });
    if (error) return null;
    const { data: urlData } = supabaseMarket.storage.from('emarket_invoices').getPublicUrl(fileName);
    return urlData.publicUrl;
}

async function emarketHandleCheckout(e) {
    e.preventDefault();
    if (!currentCustomer) { emarketOpenAuthModal(); return; }
    const order = await emarketCreateOrder();
    if (!order) return;
    const proformaUrl = await emarketGenerateProformaInvoice(order, currentCustomer);
    if (proformaUrl) {
        await supabaseMarket.from('public_emarket_orders').update({ invoice_proforma_url: proformaUrl }).eq('id', order.id);
    }
    showToast(t('toast.order_created'), 'success');
    cart = [];
    emarketUpdateCartCount();
    emarketCloseCheckoutModal();
    emarketCloseCartModal();
    // Redirection vers FedaPay (à implémenter)
    // window.location.href = 'https://fedapay.com?orderId=' + order.id;
}

// ===== ENVOI DE MESSAGE =====
async function emarketSendCustomerMessage(e) {
    e.preventDefault();
    if (!currentCustomer) return;
    const orderId = messageOrderId.value ? parseInt(messageOrderId.value) : null;
    const message = newMessageText.value.trim();
    if (!message) return;
    const { error } = await supabaseMarket
        .from('public_emarket_messages')
        .insert([{ customer_id: currentCustomer.id, order_id: orderId, message: message, is_read: false }]);
    if (error) { showToast('Erreur envoi message', 'error'); return; }
    showToast(t('toast.message_sent'), 'success');
    emarketCloseSendMessageModal();
    if (accountModal && accountModal.classList.contains('active')) emarketLoadCustomerMessages();
}

// ===== PROFIL =====
function emarketEnableProfileEdit() {
    if (profileFirstName) profileFirstName.readOnly = false;
    if (profileLastName) profileLastName.readOnly = false;
    if (profileEmail) profileEmail.readOnly = false;
    if (profilePhone) profilePhone.readOnly = false;
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    if (saveProfileBtn) saveProfileBtn.style.display = 'inline-block';
}
async function emarketSaveProfile(e) {
    e.preventDefault();
    if (!currentCustomer) return;
    const updates = {
        first_name: profileFirstName.value,
        last_name: profileLastName.value,
        email: profileEmail.value,
        phone: profilePhone.value
    };
    const { error } = await supabaseMarket
        .from('public_emarket_customers')
        .update(updates)
        .eq('id', currentCustomer.id);
    if (error) { showToast('Erreur mise à jour', 'error'); return; }
    currentCustomer = { ...currentCustomer, ...updates };
    localStorage.setItem('emarket_customer', JSON.stringify(currentCustomer));
    if (profileFirstName) profileFirstName.readOnly = true;
    if (profileLastName) profileLastName.readOnly = true;
    if (profileEmail) profileEmail.readOnly = true;
    if (profilePhone) profilePhone.readOnly = true;
    if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
    if (saveProfileBtn) saveProfileBtn.style.display = 'none';
    showToast(t('toast.profile_updated'), 'success');
    emarketUpdateCustomerUI();
}

// ===== ONGLETS COMPTE =====
function emarketSwitchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('tab' + tabId);
    if (tab) tab.classList.add('active');
    const activeBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tabId.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');
}

// ===== UTILITAIRES =====
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
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }
function initMenuMobile() {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
        toggle.addEventListener('click', () => { links.classList.toggle('active'); toggle.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!links.contains(e.target) && !toggle.contains(e.target)) { links.classList.remove('active'); toggle.classList.remove('open'); } });
    }
}
function initLangSelector() {
    const sel = document.getElementById('langSelect');
    if (sel) { sel.value = currentLang; sel.addEventListener('change', (e) => changeLanguage(e.target.value)); }
}

// ===== ÉVÉNEMENTS =====
document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-add-cart');
    if (addBtn && !addBtn.disabled) { emarketAddToCart(parseInt(addBtn.dataset.id)); return; }
    const detailsBtn = e.target.closest('.btn-details');
    if (detailsBtn) { emarketOpenProductDetail(parseInt(detailsBtn.dataset.id)); return; }
    const detailAddBtn = e.target.closest('#detailAddToCart');
    if (detailAddBtn && !detailAddBtn.disabled) { emarketAddToCart(parseInt(detailAddBtn.dataset.id)); emarketCloseProductDetail(); return; }
    const minusBtn = e.target.closest('.cart-qty-minus');
    if (minusBtn) { emarketUpdateCartItem(parseInt(minusBtn.dataset.id), -1); return; }
    const plusBtn = e.target.closest('.cart-qty-plus');
    if (plusBtn) { emarketUpdateCartItem(parseInt(plusBtn.dataset.id), 1); return; }
    const removeBtn = e.target.closest('.cart-remove');
    if (removeBtn) { emarketRemoveCartItem(parseInt(removeBtn.dataset.id)); return; }
});
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        emarketCloseCartModal(); emarketCloseAuthModal(); emarketCloseCheckoutModal();
        emarketCloseAccountModal(); emarketCloseSendMessageModal(); emarketCloseOrderDetailModal();
        emarketCloseProductDetail();
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        emarketCloseCartModal(); emarketCloseAuthModal(); emarketCloseCheckoutModal();
        emarketCloseAccountModal(); emarketCloseSendMessageModal(); emarketCloseOrderDetailModal();
        emarketCloseProductDetail();
    }
});
if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); await emarketLoginCustomer(loginEmail.value, loginPassword.value);
});
if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (regPassword.value !== regPasswordConfirm.value) { showToast(t('toast.passwords_mismatch'), 'error'); return; }
    await emarketRegisterCustomer(regFirstName.value, regLastName.value, regEmail.value, regPhone.value, regPassword.value);
});
if (forgotForm) forgotForm.addEventListener('submit', (e) => {
    e.preventDefault(); showToast('Lien de réinitialisation envoyé (simulé)', 'info'); emarketShowLoginForm();
});
if (logoutCustomerLink) logoutCustomerLink.addEventListener('click', (e) => { e.preventDefault(); emarketHandleLogoutCustomer(); });
if (myAccountLink) myAccountLink.addEventListener('click', (e) => { e.preventDefault(); emarketOpenAccountModal(); });
if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); emarketOpenAuthModal(); });
if (signupBtn) signupBtn.addEventListener('click', (e) => { e.preventDefault(); emarketShowRegisterForm(); emarketOpenAuthModal(); });
if (checkoutBtn) checkoutBtn.addEventListener('click', emarketOpenCheckoutModal);
if (checkoutForm) checkoutForm.addEventListener('submit', emarketHandleCheckout);
if (sendMessageForm) sendMessageForm.addEventListener('submit', emarketSendCustomerMessage);
if (newMessageBtn) newMessageBtn.addEventListener('click', () => emarketOpenSendMessageModal());
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => { const tab = e.target.dataset.tab; emarketSwitchTab(tab.charAt(0).toUpperCase() + tab.slice(1)); });
});
if (editProfileBtn) editProfileBtn.addEventListener('click', emarketEnableProfileEdit);
if (profileForm) profileForm.addEventListener('submit', emarketSaveProfile);
if (cartFloat) cartFloat.addEventListener('click', emarketOpenCartModal);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    const saved = localStorage.getItem('emarket_customer');
    if (saved) { try { currentCustomer = JSON.parse(saved); } catch(e) {} }
    emarketUpdateCustomerUI();
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await emarketLoadProducts();
    emarketUpdateCartCount();
});