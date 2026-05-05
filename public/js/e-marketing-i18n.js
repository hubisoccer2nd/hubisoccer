// e-marketing-i18n.js – Traductions de l'e‑market (24 langues)
// Ce fichier sera complété en phase finale avec toutes les clés et les 24 langues.
// Pour l'instant, seule la fonction t() est exposée pour compatibilité.

const eMarketI18n = {
    currentLang: localStorage.getItem('emarket_lang') || 'fr',
    translations: {} // sera rempli ultérieurement
};

function t(key) {
    // Pour l'instant, retourne la clé brute (le fallback sera géré dans e-marketing.js)
    return eMarketI18n.translations[eMarketI18n.currentLang]?.[key] || key;
}

function changeLanguage(lang) {
    eMarketI18n.currentLang = lang;
    localStorage.setItem('emarket_lang', lang);
    // La fonction d'application des traductions sera dans e-marketing.js
    if (typeof applyTranslations === 'function') applyTranslations();
}
