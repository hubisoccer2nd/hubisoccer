// ========== DEBUT : e-marketing.js (version complète et définitive) ==========
// ========== DEBUT : configuration Supabase ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseMarket = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : configuration Supabase ==========

// ========== DEBUT : placeholder interne (SVG) ==========
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23e9ecef\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%236c757d\' font-family=\'Poppins, sans-serif\' font-size=\'16\'%3EPas d\'image%3C/text%3E%3C/svg%3E';
// ========== FIN : placeholder interne (SVG) ==========

// ========== DEBUT : traductions ==========
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
        'nav.logout': 'Déconnexion',
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
        'toast.profile_updated': 'Profil mis à jour',
        'toast.forgot_disabled': 'Fonctionnalité de réinitialisation à venir.'
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
        'nav.logout': 'Logout',
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
        'toast.profile_updated': 'Profile updated',
        'toast.forgot_disabled': 'Password reset feature coming soon.'
    },
    fon: {
        'loader.message': 'Chargement...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESSUS',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'DEVENIR ACTEUR',
        'nav.tournoi': 'TOURNOIS PUBLIC',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-Market',
        'nav.login': 'Kɔnɛksiɔn',
        'nav.signup': 'Inskripsion',
        'nav.logout': 'Dekɔnɛksiɔn',
        'emarket.hero.title': 'Ahimɛ',
        'emarket.hero.highlight': 'HubISoccer',
        'emarket.hero.subtitle': 'Flânez entre les étals, découvrez des produits uniques pour champions, et laissez-vous tenter par les saveurs du football.',
        'emarket.packs.title': '🔥 Packs exclusifs du moment',
        'emarket.all.title': '🛍️ Tous nos articles',
        'emarket.cart.title': 'Panier',
        'emarket.cart.empty': 'Votre panier est vide.',
        'emarket.cart.total_ht': 'Total HT :',
        'emarket.cart.tva': 'TVA (18%) :',
        'emarket.cart.total_ttc': 'Total TTC :',
        'emarket.cart.continue': 'Continuer les achats',
        'emarket.cart.checkout': 'Passer la commande',
        'emarket.auth.login_title': 'Kɔnɛksiɔn',
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
        'toast.profile_updated': 'Profil mis à jour',
        'toast.forgot_disabled': 'Fonctionnalité de réinitialisation à venir.'
    },
    es: {
        'loader.message': 'Cargando...',
        'nav.scouting': 'SCOUTING',
        'nav.process': 'PROCESO',
        'nav.affiliation': 'AFILIACIÓN',
        'nav.actors': 'CONVIÉRTETE EN ACTOR',
        'nav.tournoi': 'TORNEO PÚBLICO',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-Market',
        'nav.login': 'Iniciar sesión',
        'nav.signup': 'Registrarse',
        'nav.logout': 'Cerrar sesión',
        'emarket.hero.title': 'El Mercado',
        'emarket.hero.highlight': 'HubISoccer',
        'emarket.hero.subtitle': 'Pasee entre los estantes, descubra productos únicos para campeones y déjese tentar por los sabores del fútbol.',
        'emarket.packs.title': '🔥 Paquetes exclusivos',
        'emarket.all.title': '🛍️ Todos nuestros productos',
        'emarket.cart.title': 'Su carrito',
        'emarket.cart.empty': 'Su carrito está vacío.',
        'emarket.cart.total_ht': 'Total sin IVA:',
        'emarket.cart.tva': 'IVA (18%):',
        'emarket.cart.total_ttc': 'Total con IVA:',
        'emarket.cart.continue': 'Seguir comprando',
        'emarket.cart.checkout': 'Pagar',
        'emarket.auth.login_title': 'Iniciar sesión',
        'emarket.auth.email': 'Correo electrónico',
        'emarket.auth.password': 'Contraseña',
        'emarket.auth.login_btn': 'Iniciar sesión',
        'emarket.auth.forgot': '¿Olvidó su contraseña?',
        'emarket.auth.register_link': '¿No tiene cuenta? Regístrese',
        'emarket.auth.register_title': 'Nuevo cliente',
        'emarket.auth.firstname': 'Nombre',
        'emarket.auth.lastname': 'Apellido',
        'emarket.auth.phone': 'Teléfono',
        'emarket.auth.confirm_password': 'Confirmar contraseña',
        'emarket.auth.register_btn': 'Registrarse',
        'emarket.auth.login_link': '¿Ya tiene cuenta? Inicie sesión',
        'emarket.auth.forgot_title': 'Restablecer contraseña',
        'emarket.auth.forgot_text': 'Ingrese su correo electrónico, le enviaremos un enlace para restablecer su contraseña.',
        'emarket.auth.forgot_btn': 'Enviar',
        'emarket.auth.back_login': 'Volver al inicio de sesión',
        'emarket.checkout.title': 'Finalizar pedido',
        'emarket.checkout.fullname': 'Nombre completo',
        'emarket.checkout.email': 'Correo electrónico',
        'emarket.checkout.phone': 'Teléfono',
        'emarket.checkout.total_ht': 'Total sin IVA:',
        'emarket.checkout.tva': 'IVA (18%):',
        'emarket.checkout.total_ttc': 'Total con IVA:',
        'emarket.checkout.pay': 'Pagar con FedaPay',
        'emarket.account.title': 'Mi cuenta',
        'emarket.account.orders': 'Mis pedidos',
        'emarket.account.messages': 'Mis mensajes',
        'emarket.account.profile': 'Mi perfil',
        'emarket.account.orders_title': 'Mis pedidos',
        'emarket.account.messages_title': 'Mis mensajes',
        'emarket.account.new_message': 'Nuevo mensaje',
        'emarket.account.profile_title': 'Mi perfil',
        'emarket.account.edit': 'Modificar',
        'emarket.account.save': 'Guardar',
        'emarket.message.title': 'Enviar un mensaje',
        'emarket.message.content': 'Su mensaje',
        'emarket.message.send': 'Enviar',
        'emarket.order.detail_title': 'Detalle del pedido',
        'emarket.order.close': 'Cerrar',
        'footer.badge1': 'Conformidad APDP Benin',
        'footer.badge2': 'Regulación FIFA',
        'footer.badge3': 'Triple Proyecto Deporte-Estudios-Carrera',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Todos los derechos reservados.',
        'toast.error_load': 'Error al cargar productos',
        'toast.cart_added': 'Producto añadido al carrito',
        'toast.cart_updated': 'Carrito actualizado',
        'toast.cart_removed': 'Producto eliminado',
        'toast.login_success': 'Inicio de sesión exitoso',
        'toast.login_error': 'Correo o contraseña incorrectos',
        'toast.register_success': 'Registro exitoso',
        'toast.register_error': 'Error en el registro',
        'toast.fill_fields': 'Por favor complete todos los campos',
        'toast.passwords_mismatch': 'Las contraseñas no coinciden',
        'toast.checkout_empty': 'Su carrito está vacío',
        'toast.order_created': 'Pedido creado, redirigiendo al pago...',
        'toast.message_sent': 'Mensaje enviado',
        'toast.profile_updated': 'Perfil actualizado',
        'toast.forgot_disabled': 'Función de restablecimiento de contraseña próximamente.'
    }
};
// ========== FIN : traductions ==========

// ========== DEBUT : variables globales de langue ==========
let currentLang = localStorage.getItem('emarket_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';
// ========== FIN : variables globales de langue ==========

// ========== DEBUT : fonction t ==========
function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}
// ========== FIN : fonction t ==========

// ========== DEBUT : fonction applyTranslations ==========
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
// ========== FIN : fonction applyTranslations ==========

// ========== DEBUT : fonction changeLanguage ==========
function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('emarket_lang', lang);
        applyTranslations();
        emarketRenderProducts();
        if (currentCustomer) emarketUpdateCustomerUI();
    }
}
// ========== FIN : fonction changeLanguage ==========

// ========== DEBUT : références DOM (remplies dans DOMContentLoaded) ==========
let featuredContainer, allProductsContainer, cartCountSpan, cartFloat, cartModal, cartItemsDiv, cartTotalHTSpan, cartTVASpan, cartTotalTTCSpan;
let checkoutBtn, authModal, checkoutModal, accountModal, sendMessageModal, orderDetailModal, productDetailModal;
let loginForm, registerForm, forgotForm, authModalTitle;
let loginEmail, loginPassword, regFirstName, regLastName, regEmail, regPhone, regPassword, regPasswordConfirm, forgotEmail;
let customerGreeting, logoutCustomerLink, myAccountLink, loginBtn, signupBtn;
let checkoutFullName, checkoutEmail, checkoutPhone, checkoutSummary, checkoutTotalHTSpan, checkoutTVASpan, checkoutTotalTTCSpan, checkoutForm;
let ordersListDiv, messagesListDiv, profileFirstName, profileLastName, profileEmail, profilePhone, editProfileBtn, saveProfileBtn, profileForm, newMessageBtn, tabBtns;
let messageOrderId, newMessageText, sendMessageForm;
let orderDetailContent;
let detailName, detailDescription, detailPrice, detailStockBadge, detailImage, detailVideo, detailAddToCart;
// ========== FIN : références DOM ==========

// ========== DEBUT : état global ==========
let currentCustomer = null;
let cart = JSON.parse(localStorage.getItem('emarket_cart')) || [];
let products = [];
let mediaMap = {};
// ========== FIN : état global ==========

// ========== DEBUT : fonction emarketUpdateCartCount ==========
function emarketUpdateCartCount() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.textContent = totalItems;
    // Afficher/masquer le bouton checkout flottant
    if (checkoutBtn) checkoutBtn.style.display = cart.length > 0 ? 'flex' : 'none';
    localStorage.setItem('emarket_cart', JSON.stringify(cart));
}
// ========== FIN : fonction emarketUpdateCartCount ==========

// ========== DEBUT : fonction emarketRenderCartModal ==========
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
// ========== FIN : fonction emarketRenderCartModal ==========

// ========== DEBUT : fonction emarketAddToCart ==========
function emarketAddToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < 1) {
        showToast(t('toast.checkout_empty') + ' (stock insuffisant)', 'warning');
        return;
    }
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity < product.stock) existing.quantity++;
        else {
            showToast('Stock maximum atteint', 'warning');
            return;
        }
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_added'), 'success');
}
// ========== FIN : fonction emarketAddToCart ==========

// ========== DEBUT : fonction emarketUpdateCartItem ==========
function emarketUpdateCartItem(productId, delta) {
    const index = cart.findIndex(item => item.id === productId);
    if (index === -1) return;
    const newQty = cart[index].quantity + delta;
    const product = products.find(p => p.id === productId);
    if (newQty <= 0) cart.splice(index, 1);
    else if (product && newQty <= product.stock) cart[index].quantity = newQty;
    else {
        showToast('Stock insuffisant', 'warning');
        return;
    }
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_updated'), 'info');
}
// ========== FIN : fonction emarketUpdateCartItem ==========

// ========== DEBUT : fonction emarketRemoveCartItem ==========
function emarketRemoveCartItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    emarketUpdateCartCount();
    emarketRenderCartModal();
    showToast(t('toast.cart_removed'), 'info');
}
// ========== FIN : fonction emarketRemoveCartItem ==========

// ========== DEBUT : fonction emarketLoadProducts ==========
async function emarketLoadProducts() {
    showLoader();
    try {
        const { data: productsData, error: productsError } = await supabaseMarket
            .from('public_emarket_products')
            .select('*')
            .order('id');
        if (productsError) throw productsError;
        products = productsData || [];

        const { data: mediaData, error: mediaError } = await supabaseMarket
            .from('public_emarket_product_media')
            .select('*')
            .order('position');
        if (mediaError) throw mediaError;

        mediaMap = {};
        (mediaData || []).forEach(m => {
            if (!mediaMap[m.product_id]) mediaMap[m.product_id] = [];
            mediaMap[m.product_id].push(m);
        });

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
// ========== FIN : fonction emarketLoadProducts ==========

// ========== DEBUT : fonction emarketRenderProducts ==========
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
// ========== FIN : fonction emarketRenderProducts ==========

// ========== DEBUT : fonction emarketRenderProductCard ==========
function emarketRenderProductCard(product) {
    const inStock = product.stock > 0;
    const stockClass = inStock ? 'in-stock' : 'out-of-stock';
    const stockText = inStock ? (currentLang === 'fr' ? 'En stock' : currentLang === 'en' ? 'In stock' : currentLang === 'es' ? 'En stock' : 'En stock') : (currentLang === 'fr' ? 'Épuisé' : currentLang === 'en' ? 'Out of stock' : currentLang === 'es' ? 'Agotado' : 'Épuisé');

    const medias = mediaMap[product.id] || [];
    const firstImage = medias.find(m => m.media_type === 'image');
    const displayImage = firstImage ? firstImage.media_url : PLACEHOLDER_IMG;

    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${displayImage}" alt="${escapeHtml(product.name)}">
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
                    <button class="btn-add-cart" data-id="${product.id}" ${!inStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> ${currentLang === 'fr' ? 'Ajouter' : currentLang === 'en' ? 'Add' : currentLang === 'es' ? 'Añadir' : 'Ajouter'}
                    </button>
                    <button class="btn-details" data-id="${product.id}">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                </div>
            </div>
        </div>
    `;
}
// ========== FIN : fonction emarketRenderProductCard ==========

// ========== DEBUT : fonction emarketOpenProductDetail ==========
function emarketOpenProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    detailName.textContent = product.name;
    detailDescription.textContent = product.description || '';
    detailPrice.textContent = product.price + ' FCFA';

    const inStock = product.stock > 0;
    detailStockBadge.textContent = inStock ? (currentLang === 'fr' ? 'En stock' : currentLang === 'en' ? 'In stock' : currentLang === 'es' ? 'En stock' : 'En stock') : (currentLang === 'fr' ? 'Épuisé' : currentLang === 'en' ? 'Out of stock' : currentLang === 'es' ? 'Agotado' : 'Épuisé');
    detailStockBadge.className = 'stock-badge ' + (inStock ? 'in-stock' : 'out-of-stock');

    const medias = mediaMap[product.id] || [];
    const firstImage = medias.find(m => m.media_type === 'image');
    const firstVideo = medias.find(m => m.media_type === 'video');

    detailImage.style.display = 'none';
    detailVideo.style.display = 'none';
    detailImage.src = '';
    detailVideo.src = '';

    if (firstVideo) {
        detailVideo.src = firstVideo.media_url;
        detailVideo.style.display = 'block';
    } else if (firstImage) {
        detailImage.src = firstImage.media_url;
        detailImage.style.display = 'block';
    } else {
        detailImage.src = PLACEHOLDER_IMG;
        detailImage.style.display = 'block';
    }

    detailAddToCart.dataset.id = product.id;
    detailAddToCart.disabled = !inStock;

    productDetailModal.classList.add('active');
}
// ========== FIN : fonction emarketOpenProductDetail ==========

// ========== DEBUT : fonction emarketCloseProductDetail ==========
function emarketCloseProductDetail() {
    productDetailModal.classList.remove('active');
    if (detailVideo) {
        detailVideo.pause();
        detailVideo.src = '';
    }
}
// ========== FIN : fonction emarketCloseProductDetail ==========

// ========== DEBUT : fonction emarketWaitForBcrypt ==========
async function emarketWaitForBcrypt() {
    return new Promise((resolve) => {
        if (typeof dcodeIO !== 'undefined' && typeof dcodeIO.bcrypt !== 'undefined') { resolve(); return; }
        const interval = setInterval(() => {
            if (typeof dcodeIO !== 'undefined' && typeof dcodeIO.bcrypt !== 'undefined') { clearInterval(interval); clearTimeout(timeout); resolve(); }
        }, 100);
        const timeout = setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
    });
}
// ========== FIN : fonction emarketWaitForBcrypt ==========

// ========== DEBUT : fonction emarketRegisterCustomer ==========
async function emarketRegisterCustomer(firstName, lastName, email, phone, password) {
    if (!firstName || !lastName || !email || !password) {
        showToast(t('toast.fill_fields'), 'error');
        return null;
    }
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
// ========== FIN : fonction emarketRegisterCustomer ==========

// ========== DEBUT : fonction emarketLoginCustomer ==========
async function emarketLoginCustomer(email, password) {
    if (!email || !password) {
        showToast(t('toast.fill_fields'), 'error');
        return null;
    }
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
// ========== FIN : fonction emarketLoginCustomer ==========

// ========== DEBUT : fonction emarketHandleLogoutCustomer ==========
function emarketHandleLogoutCustomer() {
    currentCustomer = null;
    localStorage.removeItem('emarket_customer');
    emarketUpdateCustomerUI();
    showToast('Déconnecté', 'info');
}
// ========== FIN : fonction emarketHandleLogoutCustomer ==========

// ========== DEBUT : fonction emarketUpdateCustomerUI ==========
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
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
    }
}
// ========== FIN : fonction emarketUpdateCustomerUI ==========

// ========== DEBUT : fonctions de modales ==========
function emarketOpenCartModal() { if (cartModal) cartModal.classList.add('active'); emarketRenderCartModal(); }
function emarketCloseCartModal() { if (cartModal) cartModal.classList.remove('active'); }
function emarketOpenAuthModal() { if (authModal) authModal.classList.add('active'); emarketShowLoginForm(); }
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
// ========== FIN : fonctions de modales ==========

// ========== DEBUT : fonction emarketLoadCustomerOrders ==========
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
// ========== FIN : fonction emarketLoadCustomerOrders ==========

// ========== DEBUT : fonction emarketLoadCustomerMessages ==========
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
// ========== FIN : fonction emarketLoadCustomerMessages ==========

// ========== DEBUT : fonction emarketLoadOrderDetail ==========
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
// ========== FIN : fonction emarketLoadOrderDetail ==========

// ========== DEBUT : fonction emarketCreateOrder ==========
async function emarketCreateOrder() {
    const totalHT = cart.reduce((sum, item) => {
        const p = products.find(p => p.id === item.id);
        return sum + (p ? p.price * item.quantity : 0);
    }, 0);
    const tva = Math.round(totalHT * 0.18);
    const totalTTC = totalHT + tva;
    const { data: order, error } = await supabaseMarket
        .from('public_emarket_orders')
        .insert([{ customer_id: currentCustomer.id, total_ht: totalHT, tva: tva, total_ttc: totalTTC, status: 'en_attente' }])
        .select()
        .single();
    if (error) { showToast('Erreur création commande', 'error'); return null; }
    const items = cart.map(item => {
        const p = products.find(p => p.id === item.id);
        return { order_id: order.id, product_id: item.id, quantity: item.quantity, unit_price: p.price, total_price: p.price * item.quantity };
    });
    const { error: itemsError } = await supabaseMarket.from('public_emarket_order_items').insert(items);
    if (itemsError) { showToast('Erreur enregistrement articles', 'error'); return null; }
    return order;
}
// ========== FIN : fonction emarketCreateOrder ==========

// ========== DEBUT : fonction emarketGenerateProformaInvoice ==========
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
// ========== FIN : fonction emarketGenerateProformaInvoice ==========

// ========== DEBUT : fonction emarketHandleCheckout ==========
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
}
// ========== FIN : fonction emarketHandleCheckout ==========

// ========== DEBUT : fonction emarketSendCustomerMessage ==========
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
// ========== FIN : fonction emarketSendCustomerMessage ==========

// ========== DEBUT : fonction emarketEnableProfileEdit ==========
function emarketEnableProfileEdit() {
    if (profileFirstName) profileFirstName.readOnly = false;
    if (profileLastName) profileLastName.readOnly = false;
    if (profileEmail) profileEmail.readOnly = false;
    if (profilePhone) profilePhone.readOnly = false;
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    if (saveProfileBtn) saveProfileBtn.style.display = 'inline-block';
}
// ========== FIN : fonction emarketEnableProfileEdit ==========

// ========== DEBUT : fonction emarketSaveProfile ==========
async function emarketSaveProfile(e) {
    e.preventDefault();
    if (!currentCustomer) return;
    const updates = { first_name: profileFirstName.value, last_name: profileLastName.value, email: profileEmail.value, phone: profilePhone.value };
    const { error } = await supabaseMarket.from('public_emarket_customers').update(updates).eq('id', currentCustomer.id);
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
// ========== FIN : fonction emarketSaveProfile ==========

// ========== DEBUT : fonction emarketSwitchTab ==========
function emarketSwitchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('tab' + tabId);
    if (tab) tab.classList.add('active');
    const activeBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tabId.toLowerCase());
    if (activeBtn) activeBtn.classList.add('active');
}
// ========== FIN : fonction emarketSwitchTab ==========

// ========== DEBUT : utilitaires ==========
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
// ========== FIN : utilitaires ==========

// ========== DEBUT : initialisation (DOMContentLoaded) ==========
document.addEventListener('DOMContentLoaded', async () => {
    featuredContainer = document.getElementById('featuredPacks');
    allProductsContainer = document.getElementById('allProducts');
    cartCountSpan = document.getElementById('cartCount');
    cartFloat = document.getElementById('cartFloat');
    cartModal = document.getElementById('cartModal');
    cartItemsDiv = document.getElementById('cartItems');
    cartTotalHTSpan = document.getElementById('cartTotalHT');
    cartTVASpan = document.getElementById('cartTVA');
    cartTotalTTCSpan = document.getElementById('cartTotalTTC');
    checkoutBtn = document.getElementById('checkoutBtn');
    authModal = document.getElementById('authModal');
    checkoutModal = document.getElementById('checkoutModal');
    accountModal = document.getElementById('accountModal');
    sendMessageModal = document.getElementById('sendMessageModal');
    orderDetailModal = document.getElementById('orderDetailModal');
    productDetailModal = document.getElementById('productDetailModal');

    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    forgotForm = document.getElementById('forgotForm');
    authModalTitle = document.getElementById('authModalTitle');

    loginEmail = document.getElementById('loginEmail');
    loginPassword = document.getElementById('loginPassword');
    regFirstName = document.getElementById('regFirstName');
    regLastName = document.getElementById('regLastName');
    regEmail = document.getElementById('regEmail');
    regPhone = document.getElementById('regPhone');
    regPassword = document.getElementById('regPassword');
    regPasswordConfirm = document.getElementById('regPasswordConfirm');
    forgotEmail = document.getElementById('forgotEmail');

    customerGreeting = document.getElementById('customerGreeting');
    logoutCustomerLink = document.getElementById('logoutCustomerLink');
    myAccountLink = document.getElementById('myAccountLink');
    loginBtn = document.getElementById('loginBtn');
    signupBtn = document.getElementById('signupBtn');

    checkoutFullName = document.getElementById('checkoutFullName');
    checkoutEmail = document.getElementById('checkoutEmail');
    checkoutPhone = document.getElementById('checkoutPhone');
    checkoutSummary = document.getElementById('checkoutSummary');
    checkoutTotalHTSpan = document.getElementById('checkoutTotalHT');
    checkoutTVASpan = document.getElementById('checkoutTVA');
    checkoutTotalTTCSpan = document.getElementById('checkoutTotalTTC');
    checkoutForm = document.getElementById('checkoutForm');

    ordersListDiv = document.getElementById('ordersList');
    messagesListDiv = document.getElementById('messagesList');
    profileFirstName = document.getElementById('profileFirstName');
    profileLastName = document.getElementById('profileLastName');
    profileEmail = document.getElementById('profileEmail');
    profilePhone = document.getElementById('profilePhone');
    editProfileBtn = document.getElementById('editProfileBtn');
    saveProfileBtn = document.getElementById('saveProfileBtn');
    profileForm = document.getElementById('profileForm');
    newMessageBtn = document.getElementById('newMessageBtn');
    tabBtns = document.querySelectorAll('.tab-btn');

    messageOrderId = document.getElementById('messageOrderId');
    newMessageText = document.getElementById('newMessageText');
    sendMessageForm = document.getElementById('sendMessageForm');

    orderDetailContent = document.getElementById('orderDetailContent');

    detailName = document.getElementById('detailName');
    detailDescription = document.getElementById('detailDescription');
    detailPrice = document.getElementById('detailPrice');
    detailStockBadge = document.getElementById('detailStockBadge');
    detailImage = document.getElementById('detailImage');
    detailVideo = document.getElementById('detailVideo');
    detailAddToCart = document.getElementById('detailAddToCart');

    const saved = localStorage.getItem('emarket_customer');
    if (saved) { try { currentCustomer = JSON.parse(saved); } catch(e) {} }
    emarketUpdateCustomerUI();
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await emarketLoadProducts();
    emarketUpdateCartCount();

    // ========== DEBUT : attachement des événements ==========
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
        e.preventDefault();
        showToast(t('toast.forgot_disabled'), 'info');
        emarketShowLoginForm();
    });

    if (document.getElementById('showRegisterForm')) {
        document.getElementById('showRegisterForm').addEventListener('click', (e) => {
            e.preventDefault();
            emarketShowRegisterForm();
        });
    }
    if (document.getElementById('showLoginForm')) {
        document.getElementById('showLoginForm').addEventListener('click', (e) => {
            e.preventDefault();
            emarketShowLoginForm();
        });
    }
    if (document.getElementById('showForgotPassword')) {
        document.getElementById('showForgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            emarketShowForgotPassword();
        });
    }
    if (document.getElementById('showLoginFormFromForgot')) {
        document.getElementById('showLoginFormFromForgot').addEventListener('click', (e) => {
            e.preventDefault();
            emarketShowLoginForm();
        });
    }

    if (logoutCustomerLink) logoutCustomerLink.addEventListener('click', (e) => { e.preventDefault(); emarketHandleLogoutCustomer(); });
    if (myAccountLink) myAccountLink.addEventListener('click', (e) => { e.preventDefault(); emarketOpenAccountModal(); });
    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); emarketOpenAuthModal(); });
    if (signupBtn) signupBtn.addEventListener('click', (e) => { e.preventDefault(); emarketShowRegisterForm(); emarketOpenAuthModal(); });
    if (checkoutBtn) checkoutBtn.addEventListener('click', emarketOpenCheckoutModal);

    // ** Ajout crucial : bouton "Passer la commande" dans la modale panier **
    const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
    if (cartCheckoutBtn) cartCheckoutBtn.addEventListener('click', emarketOpenCheckoutModal);

    if (checkoutForm) checkoutForm.addEventListener('submit', emarketHandleCheckout);
    if (sendMessageForm) sendMessageForm.addEventListener('submit', emarketSendCustomerMessage);
    if (newMessageBtn) newMessageBtn.addEventListener('click', () => emarketOpenSendMessageModal());
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => { const tab = e.target.dataset.tab; emarketSwitchTab(tab.charAt(0).toUpperCase() + tab.slice(1)); });
    });
    if (editProfileBtn) editProfileBtn.addEventListener('click', emarketEnableProfileEdit);
    if (profileForm) profileForm.addEventListener('submit', emarketSaveProfile);
    if (cartFloat) cartFloat.addEventListener('click', emarketOpenCartModal);
    // ========== FIN : attachement des événements ==========
});
// ========== FIN : initialisation (DOMContentLoaded) ==========
// ========== FIN : e-marketing.js ==========