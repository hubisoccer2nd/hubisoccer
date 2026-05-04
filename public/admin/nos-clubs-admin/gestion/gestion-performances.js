// ========== GESTION-PERFORMANCES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allPerformances = [];
let allClubs = [];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
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
    } catch (err) { console.error(err); }
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

// ========== DÉBUT : CHARGEMENT DES PERFORMANCES ==========
async function loadPerformances() {
    showLoader();
    try {
        const query = supabaseAdmin
            .from('nosclub_performances')
            .select('*, nosclub_inscriptions(nom_complet), nosclub_clubs(nom)')
            .order('date_eval', { ascending: false });

        // Filtre par club si sélectionné
        const clubId = document.getElementById('clubFilter').value;
        if (clubId !== 'all') {
            query.eq('club_id', clubId);
        }

        const { data, error } = await query;
        if (error) throw error;
        allPerformances = data || [];
        updateTalentFilter();
        renderPerformancesTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement performances', 'error');
    } finally {
        hideLoader();
    }
}

function updateTalentFilter() {
    const select = document.getElementById('talentFilter');
    if (!select) return;
    const currentValue = select.value;
    const uniqueTalents = [];
    const seen = new Set();
    allPerformances.forEach(perf => {
        const id = perf.talent_id;
        const nom = perf.nosclub_inscriptions?.nom_complet || `Talent #${id}`;
        if (!seen.has(id)) {
            seen.add(id);
            uniqueTalents.push({ id, nom });
        }
    });
    select.innerHTML = '<option value="all">Tous les talents</option>';
    uniqueTalents.forEach(t => {
        select.innerHTML += `<option value="${t.id}" ${t.id == currentValue ? 'selected' : ''}>${escapeHtml(t.nom)}</option>`;
    });
}

function getFilteredPerformances() {
    const talentId = document.getElementById('talentFilter').value;
    if (talentId === 'all') return allPerformances;
    return allPerformances.filter(p => p.talent_id == talentId);
}

function renderPerformancesTable() {
    const tbody = document.getElementById('performancesBody');
    if (!tbody) return;
    const filtered = getFilteredPerformances();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Aucune évaluation trouvée.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(perf => {
        const talentNom = perf.nosclub_inscriptions?.nom_complet || 'Inconnu';
        const clubNom = perf.nosclub_clubs?.nom || 'Inconnu';
        return `
            <tr data-id="${perf.id}">
                <td>${formatDate(perf.date_eval)}</td>
                <td>${escapeHtml(talentNom)}</td>
                <td>${escapeHtml(clubNom)}</td>
                <td>${perf.vitesse ?? '-'}</td>
                <td>${perf.technique ?? '-'}</td>
                <td>${perf.discipline ?? '-'}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-view" data-id="${perf.id}" title="Voir détails"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-delete" data-id="${perf.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deletePerformance(b.dataset.id)));
}
// ========== FIN : CHARGEMENT DES PERFORMANCES ==========

// ========== DÉBUT : MODALE VISUALISATION ==========
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

function openViewModal(id) {
    const perf = allPerformances.find(p => p.id == id);
    if (!perf) return;
    const talentNom = perf.nosclub_inscriptions?.nom_complet || 'Inconnu';
    const clubNom = perf.nosclub_clubs?.nom || 'Inconnu';
    document.getElementById('viewContent').innerHTML = `
        <p><strong>Talent :</strong> ${escapeHtml(talentNom)}</p>
        <p><strong>Club :</strong> ${escapeHtml(clubNom)}</p>
        <p><strong>Date :</strong> ${formatDate(perf.date_eval)}</p>
        <p><strong>Vitesse :</strong> ${perf.vitesse ?? '-'} / 20</p>
        <p><strong>Technique :</strong> ${perf.technique ?? '-'} / 20</p>
        <p><strong>Discipline :</strong> ${perf.discipline ?? '-'} / 20</p>
        <p><strong>Commentaire :</strong> ${escapeHtml(perf.commentaire || 'Aucun')}</p>
        <p><strong>Évalué par :</strong> ${escapeHtml(perf.created_by || '-')}</p>
        <p><strong>Date d'enregistrement :</strong> ${new Date(perf.created_at).toLocaleString('fr-FR')}</p>
    `;
    document.getElementById('viewModal').classList.add('active');
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : SUPPRESSION ==========
async function deletePerformance(id) {
    if (!confirm('Supprimer définitivement cette évaluation ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_performances')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Évaluation supprimée.', 'success');
        loadPerformances();
    } catch (err) {
        console.error(err);
        showToast('Erreur suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : SUPPRESSION ==========

// ========== DÉBUT : FERMETURE MODALES ==========
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeAllModals(); });
// ========== FIN : FERMETURE MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ==========
document.getElementById('clubFilter').addEventListener('change', loadPerformances);
document.getElementById('talentFilter').addEventListener('change', renderPerformancesTable);
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadPerformances();
    showToast('Liste rafraîchie.', 'success');
});
// ========== FIN : ÉVÉNEMENTS FILTRES ==========

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
document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); showToast('Déconnexion', 'info'); });
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadClubs().then(() => loadPerformances());
});
// ========== FIN DE GESTION-PERFORMANCES.JS ==========
