/* DEBUT : acteurs-login/acteurs-login.js */
// ========== ACTEURS-LOGIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS MINIMALES (FR/EN) ==========
const messages = {
    fr: {
        fill_fields: 'Veuillez remplir tous les champs.',
        id_or_password_incorrect: 'Identifiant ou mot de passe incorrect.',
        default_error: 'Une erreur est survenue.'
    },
    en: {
        fill_fields: 'Please fill in all fields.',
        id_or_password_incorrect: 'Incorrect identifier or password.',
        default_error: 'An error occurred.'
    }
};

function getCurrentLang() {
    // Lit la langue depuis le localStorage ou le sélecteur de langue
    let lang = localStorage.getItem('hubiLang');
    if (!lang || !messages[lang]) {
        const select = document.getElementById('langSelect');
        if (select) lang = select.value;
        if (!lang || !messages[lang]) lang = 'fr';
    }
    return lang;
}

function t(key) {
    const lang = getCurrentLang();
    return messages[lang]?.[key] || messages.fr[key] || key;
}

// ========== GESTION DES TOASTS ==========
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
    toast.innerHTML = `<div class="toast-content">${message}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    setTimeout(() => toast.remove(), 4000);
}

// ========== CONNEXION ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifiant = document.getElementById('loginIdentifiant').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifiant || !password) {
        showToast(t('fill_fields'), 'error');
        return;
    }

    const hash = btoa(password);

    const { data, error } = await supabasePublic
        .from('public_acteur_inscriptions')
        .select('pp_id, login, mot_de_passe_hash')
        .eq('login', identifiant)
        .eq('mot_de_passe_hash', hash)
        .maybeSingle();

    if (error || !data) {
        showToast(t('id_or_password_incorrect'), 'error');
        return;
    }

    // Redirection vers l'espace de suivi avec le PP_ID
    window.location.href = `../suivi-acteur/?id=${data.pp_id}`;
});

// Conserver la langue choisie si l'utilisateur change le sélecteur
document.getElementById('langSelect').addEventListener('change', function() {
    localStorage.setItem('hubiLang', this.value);
    // Pas de traduction dynamique à recharger sur cette page légère
});
/* FIN : acteurs-login/acteurs-login.js */