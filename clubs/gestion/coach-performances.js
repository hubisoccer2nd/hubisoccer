// ========== COACH-PERFORMANCES.JS ==========
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

// ========== DÉBUT : CHARGEMENT DES DONNÉES ==========
async function loadCoachData() {
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id');
    if (!clubId) {
        showToast('Aucun identifiant de club fourni.', 'error');
        return;
    }

    try {
        const { data: club, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('id, nom')
            .eq('id', clubId)
            .single();

        if (error || !club) throw error || new Error('Club introuvable.');

        currentClub = club;
        document.getElementById('dateEval').valueAsDate = new Date();
        await loadEffectif();
        await loadHistorique();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement des données.', 'error');
    }
}

async function loadEffectif() {
    if (!currentClub) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_inscriptions')
            .select('id, nom_complet')
            .eq('club_id', currentClub.id)
            .eq('statut', 'valide')
            .order('nom_complet', { ascending: true });

        if (error) throw error;
        effectifTalents = data || [];
        populateTalentSelect();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement effectif.', 'error');
    }
}

function populateTalentSelect() {
    const select = document.getElementById('talentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choisir un talent --</option>';
    effectifTalents.forEach(talent => {
        select.innerHTML += `<option value="${talent.id}">${escapeHtml(talent.nom_complet)}</option>`;
    });
}

async function loadHistorique() {
    const tbody = document.getElementById('historiqueBody');
    if (!tbody || !currentClub) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_performances')
            .select('*, nosclub_inscriptions(nom_complet)')
            .eq('club_id', currentClub.id)
            .order('date_eval', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Aucune évaluation enregistrée.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(eval => {
            const nomTalent = eval.nosclub_inscriptions?.nom_complet || 'Inconnu';
            return `
                <tr>
                    <td>${escapeHtml(nomTalent)}</td>
                    <td>${new Date(eval.date_eval).toLocaleDateString('fr-FR')}</td>
                    <td>${eval.vitesse ?? '-'}</td>
                    <td>${eval.technique ?? '-'}</td>
                    <td>${eval.discipline ?? '-'}</td>
                    <td>${escapeHtml(eval.commentaire || '-')}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6" class="error-message">Erreur chargement historique.</td></tr>';
    }
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : ENREGISTREMENT DE L'ÉVALUATION ==========
async function savePerformance() {
    const talentId = document.getElementById('talentSelect').value;
    const dateEval = document.getElementById('dateEval').value;
    const vitesse = parseInt(document.getElementById('noteVitesse').value) || null;
    const technique = parseInt(document.getElementById('noteTechnique').value) || null;
    const discipline = parseInt(document.getElementById('noteDiscipline').value) || null;
    const commentaire = document.getElementById('commentairePerf').value.trim();

    if (!talentId || !dateEval) {
        showToast('Veuillez sélectionner un talent et une date.', 'warning');
        return;
    }

    const data = {
        club_id: currentClub.id,
        talent_id: talentId,
        date_eval: dateEval,
        vitesse: vitesse,
        technique: technique,
        discipline: discipline,
        commentaire: commentaire || null,
        created_by: 'coach',
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabasePublic
            .from('nosclub_performances')
            .insert([data]);

        if (error) throw error;

        showToast('Évaluation enregistrée avec succès.', 'success');
        // Réinitialiser partiellement le formulaire
        document.getElementById('noteVitesse').value = 10;
        document.getElementById('noteTechnique').value = 10;
        document.getElementById('noteDiscipline').value = 10;
        document.getElementById('commentairePerf').value = '';
        await loadHistorique();
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'enregistrement.', 'error');
    }
}
// ========== FIN : ENREGISTREMENT DE L'ÉVALUATION ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('savePerfBtn').addEventListener('click', savePerformance);
// ========== FIN : ÉVÉNEMENTS ==========

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
// ========== FIN DE COACH-PERFORMANCES.JS ==========