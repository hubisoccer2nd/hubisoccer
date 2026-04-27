// ========== ADMIN-AFFICHE.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DÉBUT : UTILITAIRES ==========
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function showToast(message, type = 'info', duration = 4000) {
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
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR');
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allAffiches = [];
let currentAfficheId = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : CHARGEMENT DES AFFICHES ==========
async function loadAffiches() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('demandes_affiches')
            .select('*, designer_users(nom, prenom, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allAffiches = data || [];
        renderAffiches(allAffiches);
        updateStats(allAffiches);
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du chargement des affiches.', 'error');
    } finally {
        hideLoader();
    }
}

function renderAffiches(affiches) {
    const tbody = document.getElementById('affichesTableBody');
    if (!tbody) return;
    if (!affiches.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Aucune affiche soumise pour le moment.</td></tr>';
        return;
    }
    tbody.innerHTML = affiches.map(affiche => {
        const statutClass = `badge-${affiche.statut === 'en_attente' ? 'pending' : affiche.statut === 'approuve' ? 'approved' : affiche.statut === 'rejete' ? 'rejected' : 'blocked'}`;
        const statutLabel = affiche.statut === 'en_attente' ? 'En attente' : affiche.statut === 'approuve' ? 'Approuvé' : affiche.statut === 'rejete' ? 'Rejeté' : 'Bloqué';
        const creator = affiche.designer_users ? `${affiche.designer_users.prenom} ${affiche.designer_users.nom}` : 'Inconnu';
        return `
            <tr>
                <td>${escapeHtml(affiche.id.substring(0, 8))}...</td>
                <td>${escapeHtml(affiche.club_nom)}</td>
                <td>${escapeHtml(affiche.quartier)}</td>
                <td>${escapeHtml(creator)}</td>
                <td>${formatDateTime(affiche.created_at)}</td>
                <td><span class="badge ${statutClass}">${statutLabel}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-view" onclick="viewAffiche('${affiche.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-action btn-approve" onclick="openApproveAfficheModal('${affiche.id}')"><i class="fas fa-check-circle"></i></button>
                        <button class="btn-action btn-reject" onclick="openRejectAfficheModal('${affiche.id}')"><i class="fas fa-times-circle"></i></button>
                        <button class="btn-action btn-pending" onclick="setAffichePending('${affiche.id}')"><i class="fas fa-clock"></i></button>
                        <button class="btn-action btn-block" onclick="openBlockAfficheModal('${affiche.id}')"><i class="fas fa-ban"></i></button>
                        <button class="btn-action btn-delete" onclick="openDeleteAfficheModal('${affiche.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats(affiches) {
    document.getElementById('statPending').textContent = affiches.filter(a => a.statut === 'en_attente').length;
    document.getElementById('statApproved').textContent = affiches.filter(a => a.statut === 'approuve').length;
    document.getElementById('statRejected').textContent = affiches.filter(a => a.statut === 'rejete').length;
    document.getElementById('statBlocked').textContent = affiches.filter(a => a.statut === 'bloque').length;
    document.getElementById('statTotal').textContent = affiches.length;
}
// ========== FIN : CHARGEMENT DES AFFICHES ==========

// ========== DÉBUT : FONCTIONS D'ACTION ==========
async function viewAffiche(afficheId) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('demandes_affiches')
            .select('*, designer_users(nom, prenom, email)')
            .eq('id', afficheId)
            .single();
        if (error) throw error;
        const url = `${SUPABASE_URL}/storage/v1/object/public/creation_de_affiche/${data.file_url}`;
        document.getElementById('viewAfficheContent').innerHTML = `
            <img src="${url}" alt="${escapeHtml(data.club_nom)}" style="max-width:100%; border-radius:16px; margin-bottom:15px;">
            <p><strong>Club :</strong> ${escapeHtml(data.club_nom)}</p>
            <p><strong>Quartier :</strong> ${escapeHtml(data.quartier)}</p>
            <p><strong>Créateur :</strong> ${data.designer_users ? escapeHtml(data.designer_users.prenom + ' ' + data.designer_users.nom) : 'Inconnu'}</p>
            <p><strong>Date :</strong> ${formatDateTime(data.created_at)}</p>
            <p><strong>Statut :</strong> ${data.statut}</p>
            <p><strong>Commentaire admin :</strong> ${data.commentaire_admin || '-'}</p>
        `;
        document.getElementById('viewAfficheModal').classList.add('active');
    } catch (err) {
        showToast('Erreur visualisation.', 'error');
    } finally {
        hideLoader();
    }
}

function openApproveAfficheModal(afficheId) {
    currentAfficheId = afficheId;
    const affiche = allAffiches.find(a => a.id === afficheId);
    if (!affiche) return;
    document.getElementById('approveAfficheInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(affiche.club_nom)}</p>
        <p><strong>Quartier :</strong> ${escapeHtml(affiche.quartier)}</p>
    `;
    document.getElementById('approveAfficheModal').classList.add('active');
}

function openRejectAfficheModal(afficheId) {
    currentAfficheId = afficheId;
    const affiche = allAffiches.find(a => a.id === afficheId);
    if (!affiche) return;
    document.getElementById('rejectAfficheInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(affiche.club_nom)}</p>
        <p><strong>Quartier :</strong> ${escapeHtml(affiche.quartier)}</p>
    `;
    document.getElementById('rejectAfficheReason').value = '';
    document.getElementById('rejectAfficheModal').classList.add('active');
}

function openBlockAfficheModal(afficheId) {
    currentAfficheId = afficheId;
    const affiche = allAffiches.find(a => a.id === afficheId);
    if (!affiche) return;
    document.getElementById('blockAfficheInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(affiche.club_nom)}</p>
    `;
    document.getElementById('blockAfficheModal').classList.add('active');
}

function openDeleteAfficheModal(afficheId) {
    currentAfficheId = afficheId;
    const affiche = allAffiches.find(a => a.id === afficheId);
    if (!affiche) return;
    document.getElementById('deleteAfficheInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(affiche.club_nom)}</p>
    `;
    document.getElementById('deleteAfficheModal').classList.add('active');
}

async function confirmApproveAffiche() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_affiches')
            .update({ statut: 'approuve', updated_at: new Date().toISOString() })
            .eq('id', currentAfficheId);
        if (error) throw error;

        const affiche = allAffiches.find(a => a.id === currentAfficheId);
        if (affiche && affiche.user_id) {
            await supabaseAdmin.from('public_messages_prives').insert([{
                expediteur_id: 'admin',
                destinataire_id: affiche.user_id,
                sujet: 'Affiche approuvée',
                contenu: `Félicitations ! L'affiche de votre club ${affiche.club_nom} a été approuvée. Vous pouvez maintenant la télécharger depuis votre espace.`,
                lu: false,
                created_at: new Date().toISOString()
            }]);
        }

        showToast('Affiche approuvée. Téléchargement débloqué.', 'success');
        document.getElementById('approveAfficheModal').classList.remove('active');
        loadAffiches();
    } catch (err) {
        showToast('Erreur approbation.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmRejectAffiche() {
    const reason = document.getElementById('rejectAfficheReason').value.trim();
    if (!reason) { showToast('Veuillez indiquer un motif.', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_affiches')
            .update({ statut: 'rejete', commentaire_admin: reason, updated_at: new Date().toISOString() })
            .eq('id', currentAfficheId);
        if (error) throw error;
        showToast('Affiche rejetée.', 'success');
        document.getElementById('rejectAfficheModal').classList.remove('active');
        loadAffiches();
    } catch (err) {
        showToast('Erreur rejet.', 'error');
    } finally {
        hideLoader();
    }
}

async function setAffichePending(afficheId) {
    if (!confirm('Remettre cette affiche en attente ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_affiches')
            .update({ statut: 'en_attente', updated_at: new Date().toISOString() })
            .eq('id', afficheId);
        if (error) throw error;
        showToast('Affiche remise en attente.', 'success');
        loadAffiches();
    } catch (err) {
        showToast('Erreur.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmBlockAffiche() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_affiches')
            .update({ statut: 'bloque', updated_at: new Date().toISOString() })
            .eq('id', currentAfficheId);
        if (error) throw error;
        showToast('Affiche bloquée.', 'success');
        document.getElementById('blockAfficheModal').classList.remove('active');
        loadAffiches();
    } catch (err) {
        showToast('Erreur blocage.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmDeleteAffiche() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_affiches')
            .delete()
            .eq('id', currentAfficheId);
        if (error) throw error;
        showToast('Affiche supprimée définitivement.', 'success');
        document.getElementById('deleteAfficheModal').classList.remove('active');
        loadAffiches();
    } catch (err) {
        showToast('Erreur suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : FONCTIONS D'ACTION ==========

// ========== DÉBUT : ÉCOUTEURS MODALES ==========
document.getElementById('confirmApproveAfficheBtn').addEventListener('click', confirmApproveAffiche);
document.getElementById('confirmRejectAfficheBtn').addEventListener('click', confirmRejectAffiche);
document.getElementById('confirmBlockAfficheBtn').addEventListener('click', confirmBlockAffiche);
document.getElementById('confirmDeleteAfficheBtn').addEventListener('click', confirmDeleteAffiche);
document.getElementById('refreshAfficheBtn').addEventListener('click', loadAffiches);

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
// ========== FIN : ÉCOUTEURS MODALES ==========

// ========== DÉBUT : MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
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
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion.', 'info'); });
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', loadAffiches);
// ========== FIN DE ADMIN-AFFICHE.JS ==========
