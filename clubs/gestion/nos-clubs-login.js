/* DEBUT : clubs/gestion/nos-clubs-login.js */
// ========== NOS-CLUBS-LOGIN.JS – VERSION AVEC RÔLES ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== TRADUCTIONS MINIMALES (FR/EN) ==========
const messages = {
    fr: {
        fill_fields: 'Veuillez remplir tous les champs.',
        id_or_password_incorrect: 'Identifiant ou mot de passe incorrect.',
        not_validated: 'Votre compte n\'est pas encore validé. Patientez ou contactez l\'administration.',
        error_verification: 'Erreur lors de la vérification. Réessayez.',
        error_network: 'Erreur réseau. Vérifiez votre connexion.'
    },
    en: {
        fill_fields: 'Please fill in all fields.',
        id_or_password_incorrect: 'Incorrect identifier or password.',
        not_validated: 'Your account has not been validated yet. Please wait or contact the administration.',
        error_verification: 'Error during verification. Please try again.',
        error_network: 'Network error. Please check your connection.'
    }
};

function getCurrentLang() {
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

// ========== GESTION DE LA LANGUE ==========
document.getElementById('langSelect').addEventListener('change', function() {
    localStorage.setItem('hubiLang', this.value);
});

// ========== FONCTIONS UTILITAIRES ==========
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
    setTimeout(() => toast.remove(), 15000);
}

function showLoader() {
    const btn = document.querySelector('.btn-login');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        btn.disabled = true;
    }
}

function hideLoader() {
    const btn = document.querySelector('.btn-login');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        btn.disabled = false;
    }
}

// ========== DÉBUT : GESTION DE LA CONNEXION ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const identifiant = document.getElementById('loginIdentifiant').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifiant || !password) {
        showToast(t('fill_fields'), 'error');
        return;
    }

    const hash = btoa(password);
    showLoader();

    try {
        // ---- TALENT ----
        if (role === 'talent') {
            const { data, error } = await supabasePublic
                .from('nosclub_inscriptions')
                .select('id, login, mot_de_passe_hash, statut')
                .eq('login', identifiant)
                .eq('mot_de_passe_hash', hash)
                .maybeSingle();

            if (error) {
                hideLoader();
                showToast(t('error_verification'), 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast(t('id_or_password_incorrect'), 'error');
                return;
            }

            if (data.statut !== 'valide') {
                hideLoader();
                showToast(t('not_validated'), 'warning');
                return;
            }

            // Succès → redirection talent
            window.location.href = `talent-dash.html?id=${data.id}`;
            return;
        }

        // ---- COACH ----
        if (role === 'coach') {
            const { data, error } = await supabasePublic
                .from('nosclub_clubs')
                .select('id')
                .eq('coach_login', identifiant)
                .eq('coach_mot_de_passe_hash', hash)
                .maybeSingle();

            if (error) {
                hideLoader();
                showToast(t('error_verification'), 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast(t('id_or_password_incorrect'), 'error');
                return;
            }

            // Succès → redirection coach
            window.location.href = `coach-dash.html?id=${data.id}`;
            return;
        }

        // ---- PARRAIN ----
        if (role === 'parrain') {
            const { data, error } = await supabasePublic
                .from('nosclub_clubs')
                .select('id')
                .eq('parrain_login', identifiant)
                .eq('parrain_mot_de_passe_hash', hash)
                .maybeSingle();

            if (error) {
                hideLoader();
                showToast(t('error_verification'), 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast(t('id_or_password_incorrect'), 'error');
                return;
            }

            // Succès → redirection parrain
            window.location.href = `parrain-dash.html?id=${data.id}`;
            return;
        }

    } catch (err) {
        console.error(err);
        hideLoader();
        showToast(t('error_network'), 'error');
    }
});
// ========== FIN : GESTION DE LA CONNEXION ==========
// ========== FIN DE NOS-CLUBS-LOGIN.JS ==========
/* FIN : clubs/gestion/nos-clubs-login.js */