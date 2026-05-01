// ========== NOS-CLUBS-LOGIN.JS – VERSION AVEC RÔLES ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : GESTION DE LA CONNEXION ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const identifiant = document.getElementById('loginIdentifiant').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifiant || !password) {
        showToast('Veuillez remplir tous les champs.', 'error');
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
                showToast('Erreur lors de la vérification. Réessayez.', 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast('Identifiant ou mot de passe incorrect.', 'error');
                return;
            }

            if (data.statut !== 'valide') {
                hideLoader();
                showToast('Votre compte n\'est pas encore validé. Patientez ou contactez l\'administration.', 'warning');
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
                showToast('Erreur lors de la vérification. Réessayez.', 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast('Identifiant ou mot de passe incorrect.', 'error');
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
                showToast('Erreur lors de la vérification. Réessayez.', 'error');
                return;
            }

            if (!data) {
                hideLoader();
                showToast('Identifiant ou mot de passe incorrect.', 'error');
                return;
            }

            // Succès → redirection parrain
            window.location.href = `parrain-dash.html?id=${data.id}`;
            return;
        }

    } catch (err) {
        console.error(err);
        hideLoader();
        showToast('Erreur réseau. Vérifiez votre connexion.', 'error');
    }
});
// ========== FIN : GESTION DE LA CONNEXION ==========
// ========== FIN DE NOS-CLUBS-LOGIN.JS ==========