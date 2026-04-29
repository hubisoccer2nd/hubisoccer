// ========== COACH-PRESENCES.JS ==========
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
        document.getElementById('datePresence').valueAsDate = new Date();
        loadEffectif();
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
            .select('id, nom_complet, specialite_poste')
            .eq('club_id', currentClub.id)
            .eq('statut', 'valide')
            .order('nom_complet', { ascending: true });

        if (error) throw error;
        effectifTalents = data || [];
        renderEffectifTable();
    } catch (err) {
        console.error(err);
        document.getElementById('presencesBody').innerHTML = '<tr><td colspan="4" class="error-message">Erreur chargement effectif.</td></tr>';
    }
}

function renderEffectifTable() {
    const tbody = document.getElementById('presencesBody');
    if (!tbody) return;
    if (effectifTalents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message">Aucun talent validé dans ce club.</td></tr>';
        return;
    }

    tbody.innerHTML = effectifTalents.map(talent => `
        <tr data-talent-id="${talent.id}">
            <td>${escapeHtml(talent.nom_complet)}</td>
            <td>${escapeHtml(talent.specialite_poste || '-')}</td>
            <td class="checkbox-cell">
                <input type="checkbox" class="present-check" data-talent-id="${talent.id}">
            </td>
            <td>
                <input type="text" class="comment-input" placeholder="Commentaire..." data-talent-id="${talent.id}">
            </td>
        </tr>
    `).join('');
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : ENREGISTREMENT DES PRÉSENCES ==========
async function savePresences() {
    const date = document.getElementById('datePresence').value;
    if (!date) {
        showToast('Veuillez sélectionner une date.', 'warning');
        return;
    }

    const rows = [];
    document.querySelectorAll('tr[data-talent-id]').forEach(row => {
        const talentId = row.dataset.talentId;
        const present = row.querySelector('.present-check').checked;
        const commentaire = row.querySelector('.comment-input').value.trim();
        rows.push({
            club_id: currentClub.id,
            talent_id: talentId,
            date_presence: date,
            present: present,
            commentaire: commentaire || null,
            created_by: 'coach',
            created_at: new Date().toISOString()
        });
    });

    if (rows.length === 0) {
        showToast('Aucun talent à enregistrer.', 'warning');
        return;
    }

    try {
        // Supprimer les anciennes entrées pour ce club et cette date
        await supabasePublic
            .from('nosclub_presences')
            .delete()
            .eq('club_id', currentClub.id)
            .eq('date_presence', date);

        // Insérer les nouvelles
        const { error } = await supabasePublic
            .from('nosclub_presences')
            .insert(rows);

        if (error) throw error;

        showToast('Feuille de présence enregistrée avec succès.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'enregistrement.', 'error');
    }
}
// ========== FIN : ENREGISTREMENT DES PRÉSENCES ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('savePresencesBtn').addEventListener('click', savePresences);

// Recharger éventuellement les présences existantes pour la date sélectionnée (pré-remplir)
document.getElementById('datePresence').addEventListener('change', async () => {
    const date = document.getElementById('datePresence').value;
    if (!date || !currentClub) return;

    try {
        const { data, error } = await supabasePublic
            .from('nosclub_presences')
            .select('talent_id, present, commentaire')
            .eq('club_id', currentClub.id)
            .eq('date_presence', date);

        if (error) throw error;

        // Réinitialiser toutes les cases
        document.querySelectorAll('.present-check').forEach(cb => cb.checked = false);
        document.querySelectorAll('.comment-input').forEach(inp => inp.value = '');

        // Pré-remplir avec les données existantes
        if (data) {
            data.forEach(entry => {
                const talentRow = document.querySelector(`tr[data-talent-id="${entry.talent_id}"]`);
                if (talentRow) {
                    const checkbox = talentRow.querySelector('.present-check');
                    const commentInput = talentRow.querySelector('.comment-input');
                    if (checkbox) checkbox.checked = entry.present;
                    if (commentInput) commentInput.value = entry.commentaire || '';
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
});
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
// ========== FIN DE COACH-PRESENCES.JS ==========