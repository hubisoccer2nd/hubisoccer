// ========== PREMIER-PAS-LOGIN.JS ==========
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
    setTimeout(() => toast.remove(), 4000);
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : GESTION DE LA CONNEXION ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifiant = document.getElementById('loginIdentifiant').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifiant || !password) {
        showToast('Veuillez remplir tous les champs.', 'error');
        return;
    }

    // Hachage identique à celui de l'administration
    const hash = btoa(password);

    const { data, error } = await supabasePublic
        .from('public_premierpas')
        .select('pp_id, login, mot_de_passe_hash')
        .eq('login', identifiant)
        .eq('mot_de_passe_hash', hash)
        .maybeSingle();

    if (error || !data) {
        showToast('Identifiant ou mot de passe incorrect.', 'error');
        return;
    }

    // Redirection vers l'espace de suivi avec le PP_ID
    window.location.href = `suivi.html?id=${data.pp_id}`;
});
// ========== FIN : GESTION DE LA CONNEXION ==========
// ========== FIN DE PREMIER-PAS-LOGIN.JS ==========