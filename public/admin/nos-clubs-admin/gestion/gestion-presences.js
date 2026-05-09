// ========== GESTION-PRESENCES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allClubs = [];
let allPresences = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'info', duration = 15000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES CLUBS ==========
async function loadClubs() {
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_clubs')
            .select('id, nom')
            .order('nom', { ascending: true });
        if (error) throw error;
        allClubs = data || [];
        populateClubFilter();
    } catch (err) {
        console.error(err);
    }
}

function populateClubFilter() {
    const select = document.getElementById('clubFilter');
    if (!select) return;
    select.innerHTML = '<option value="all">Tous les clubs</option>';
    allClubs.forEach(club => {
        select.innerHTML += `<option value="${club.id}">${escapeHtml(club.nom)}</option>`;
    });
}
// ========== FIN : CHARGEMENT DES CLUBS ==========

// ========== DÉBUT : CHARGEMENT DES PRÉSENCES ==========
async function loadPresences() {
    showLoader();
    try {
        let query = supabaseAdmin
            .from('nosclub_presences')
            .select('*, nosclub_inscriptions(nom_complet), nosclub_clubs(nom)')
            .order('date_presence', { ascending: false });

        const clubId = document.getElementById('clubFilter').value;
        const date = document.getElementById('dateFilter').value;

        if (clubId !== 'all') {
            query = query.eq('club_id', clubId);
        }
        if (date) {
            query = query.eq('date_presence', date);
        }

        const { data, error } = await query;
        if (error) throw error;
        allPresences = data || [];
        renderPresencesTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des présences', 'error');
    } finally {
        hideLoader();
    }
}

function renderPresencesTable() {
    const tbody = document.getElementById('presencesBody');
    if (!tbody) return;

    if (allPresences.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Aucune feuille de présence trouvée.</td></tr>';
        return;
    }

    tbody.innerHTML = allPresences.map(p => {
        const talentNom = p.nosclub_inscriptions?.nom_complet || 'Inconnu';
        const clubNom = p.nosclub_clubs?.nom || 'Inconnu';
        const presentIcon = p.present
            ? '<i class="fas fa-check-circle" style="color:var(--success)"></i> Présent'
            : '<i class="fas fa-times-circle" style="color:var(--danger)"></i> Absent';
        return `
            <tr>
                <td>${escapeHtml(talentNom)}</td>
                <td>${escapeHtml(clubNom)}</td>
                <td>${formatDate(p.date_presence)}</td>
                <td>${presentIcon}</td>
                <td>${escapeHtml(p.commentaire || '-')}</td>
            </tr>
        `;
    }).join('');
}
// ========== FIN : CHARGEMENT DES PRÉSENCES ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('clubFilter').addEventListener('change', loadPresences);
document.getElementById('dateFilter').addEventListener('change', loadPresences);
// ========== FIN : ÉVÉNEMENTS ==========

// ========== DÉBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active'); menuToggle.classList.remove('open');
        }
    });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Déconnexion (à implémenter)', 'info');
    });
}
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadClubs().then(() => loadPresences());
});
// ========== FIN DE GESTION-PRESENCES.JS ==========
