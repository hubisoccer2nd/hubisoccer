// ========== COACH-DASH.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentClub = null;
let effectifTalents = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function getInitiales(nom) {
    if (!nom) return '??';
    return nom.split(' ').map(mot => mot.charAt(0).toUpperCase()).slice(0, 2).join('');
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
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES DONNÉES DU COACH ==========
async function loadCoachData() {
    const params = new URLSearchParams(window.location.search);
    const coachId = params.get('id');
    if (!coachId) {
        showToast('Aucun identifiant coach fourni.', 'error');
        return;
    }

    try {
        // On suppose que le coach est identifié par son id dans la table nosclub_clubs
        const { data: club, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('*, nosclub_roles(nom, icone)')
            .eq('id', coachId)
            .single();

        if (error || !club) throw error || new Error('Club introuvable pour ce coach.');

        currentClub = club;
        displayClubInfo();
        displayCalendrier();
        loadEffectif();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement des données.', 'error');
    }
}

function displayClubInfo() {
    if (!currentClub) return;
    document.getElementById('clubNom').textContent = currentClub.nom || 'Club inconnu';
    const role = currentClub.nosclub_roles;
    document.getElementById('clubDiscipline').innerHTML = `<i class="fas ${escapeHtml(role?.icone || 'fa-users')}"></i> ${escapeHtml(role?.nom || '')}`;

    // Logo ou initiales
    const logoContainer = document.getElementById('clubLogoContainer');
    if (currentClub.logo_url) {
        logoContainer.innerHTML = `<img src="${escapeHtml(currentClub.logo_url)}" alt="${escapeHtml(currentClub.nom)}" class="club-logo-large">`;
    } else {
        logoContainer.innerHTML = `<div class="club-initiales-large">${getInitiales(currentClub.nom)}</div>`;
    }
}

function displayCalendrier() {
    const container = document.getElementById('calendrierContent');
    container.innerHTML = `
        <div class="calendrier-info">
            <ul>
                <li><strong>Mercredi</strong> 15h - 17h</li>
                <li><strong>Samedi</strong> 8h - 10h</li>
            </ul>
            <p class="calendrier-note">Horaires modifiables depuis votre espace.</p>
        </div>
    `;
}

async function loadEffectif() {
    if (!currentClub) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_inscriptions')
            .select('id, nom_complet, specialite_poste')
            .eq('club_id', currentClub.id)
            .eq('statut', 'valide')
            .order('nom_complet', { ascending: true });

        if (error) throw error;
        effectifTalents = data || [];
        renderEffectif();
    } catch (err) {
        console.error(err);
        document.getElementById('effectifContent').innerHTML = '<p class="error-message">Erreur lors du chargement de l\'effectif.</p>';
    }
}

function renderEffectif() {
    document.getElementById('effectifTotal').textContent = effectifTalents.length;

    const container = document.getElementById('effectifContent');
    if (effectifTalents.length === 0) {
        container.innerHTML = '<p>Aucun talent validé pour le moment.</p>';
        return;
    }
    container.innerHTML = effectifTalents.map(talent => `
        <div class="talent-row">
            <span>${escapeHtml(talent.nom_complet)}</span>
            <small>${escapeHtml(talent.specialite_poste || '-')}</small>
        </div>
    `).join('');
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : MENU MOBILE ET DÉCONNEXION ==========
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

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'nos-clubs-login.html';
    });
}
// ========== FIN : MENU MOBILE ET DÉCONNEXION ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadCoachData();
});
// ========== FIN DE COACH-DASH.JS ==========