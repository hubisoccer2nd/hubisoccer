// ========== TALENT-DASH.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentTalent = null;
let currentClub = null;
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

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES DONNÉES ==========
async function loadTalentData() {
    const params = new URLSearchParams(window.location.search);
    const talentId = params.get('id');
    if (!talentId) {
        showToast('Aucun identifiant fourni.', 'error');
        return;
    }

    try {
        // Charger l'inscription du talent
        const { data: inscription, error: insError } = await supabasePublic
            .from('nosclub_inscriptions')
            .select('*, nosclub_clubs(id, nom, logo_url, banniere_url, coach_nom, coach_contact, parrain_nom, parrain_contact, nosclub_roles(nom, icone))')
            .eq('id', talentId)
            .single();

        if (insError || !inscription) throw insError || new Error('Talent introuvable');

        currentTalent = inscription;
        currentClub = inscription.nosclub_clubs;
        displayClubInfo();
        displayCalendrier();
        displayTrinite();
        loadMurMessages();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement des données.', 'error');
    }
}

function displayClubInfo() {
    const club = currentClub;
    if (!club) return;

    document.getElementById('clubNom').textContent = club.nom || 'Club inconnu';

    const role = club.nosclub_roles;
    const disciplineEl = document.getElementById('clubDiscipline');
    disciplineEl.innerHTML = `<i class="fas ${escapeHtml(role?.icone || 'fa-users')}"></i> ${escapeHtml(role?.nom || '')}`;

    document.getElementById('clubCoach').innerHTML = `<i class="fas fa-clipboard"></i> Coach : ${escapeHtml(club.coach_nom || 'À désigner')}`;
    document.getElementById('clubParrain').innerHTML = `<i class="fas fa-hands-helping"></i> Parrain : ${escapeHtml(club.parrain_nom || 'À désigner')}`;

    // Logo
    const logoContainer = document.getElementById('clubLogoContainer');
    if (club.logo_url) {
        logoContainer.innerHTML = `<img src="${escapeHtml(club.logo_url)}" alt="${escapeHtml(club.nom)}" class="club-logo-large">`;
    } else {
        logoContainer.innerHTML = `<div class="club-initiales-large">${getInitiales(club.nom)}</div>`;
    }
}

function displayCalendrier() {
    const container = document.getElementById('calendrierContent');
    container.innerHTML = `
        <div class="calendrier-info">
            <p><i class="fas fa-clock"></i> <strong>Prochains entraînements :</strong></p>
            <ul>
                <li>Mercredi 15h - 17h</li>
                <li>Samedi 8h - 10h</li>
            </ul>
            <p class="calendrier-note">Le calendrier est mis à jour par votre coach.</p>
        </div>
    `;
}

function displayTrinite() {
    const container = document.getElementById('triniteContent');
    const ins = currentTalent;
    container.innerHTML = `
        <div class="trinite-info">
            <p><i class="fas fa-book"></i> <strong>Niveau d'études :</strong> ${escapeHtml(ins.niveau_etudes || 'Non renseigné')}</p>
            <p><i class="fas fa-briefcase"></i> <strong>Métier souhaité :</strong> ${escapeHtml(ins.metier_souhaite || 'Non renseigné')}</p>
            <p><i class="fas fa-check-circle"></i> <strong>Statut :</strong> ${escapeHtml(ins.statut_actuel || 'Non renseigné')}</p>
            ${ins.nom_club_actuel ? `<p><i class="fas fa-users"></i> <strong>Club actuel :</strong> ${escapeHtml(ins.nom_club_actuel)}</p>` : ''}
        </div>
    `;
}

async function loadMurMessages() {
    const container = document.getElementById('murContent');
    if (!currentClub) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_messages')
            .select('*')
            .eq('club_id', currentClub.id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) throw error;
        if (data && data.length > 0) {
            container.innerHTML = data.map(msg => `
                <div class="mur-message">
                    <div class="mur-message-header">
                        <strong>${msg.expediteur_id === 'admin' ? 'Coach / Parrain' : 'Talent'}</strong>
                        <span>${new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <p>${msg.contenu}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aucune annonce pour le moment.</p>';
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Erreur de chargement du mur.</p>';
    }
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
    loadTalentData();
});
// ========== FIN DE TALENT-DASH.JS ==========