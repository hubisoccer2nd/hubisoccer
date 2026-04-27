// ========== ADMIN-LOGO.JS ==========
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
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
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
let allLogos = [];
let currentLogoId = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : CHARGEMENT DES LOGOS ==========
async function loadLogos() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('demandes_logos')
            .select('*, designer_users(nom, prenom, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allLogos = data || [];
        renderLogos(allLogos);
        updateStats(allLogos);
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du chargement des logos.', 'error');
    } finally {
        hideLoader();
    }
}

function renderLogos(logos) {
    const tbody = document.getElementById('logosTableBody');
    if (!tbody) return;
    if (!logos.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Aucun logo soumis pour le moment.</td></tr>';
        return;
    }
    tbody.innerHTML = logos.map(logo => {
        const statutClass = `badge-${logo.statut === 'en_attente' ? 'pending' : logo.statut === 'approuve' ? 'approved' : logo.statut === 'rejete' ? 'rejected' : 'blocked'}`;
        const statutLabel = logo.statut === 'en_attente' ? 'En attente' : logo.statut === 'approuve' ? 'Approuvé' : logo.statut === 'rejete' ? 'Rejeté' : 'Bloqué';
        const creator = logo.designer_users ? `${logo.designer_users.prenom} ${logo.designer_users.nom}` : 'Inconnu';
        return `
            <tr>
                <td>${escapeHtml(logo.id.substring(0, 8))}...</td>
                <td>${escapeHtml(logo.club_nom)}</td>
                <td>${escapeHtml(logo.quartier)}</td>
                <td>${escapeHtml(creator)}</td>
                <td>${formatDateTime(logo.created_at)}</td>
                <td><span class="badge ${statutClass}">${statutLabel}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-view" onclick="viewLogo('${logo.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-action btn-approve" onclick="openApproveLogoModal('${logo.id}')"><i class="fas fa-check-circle"></i></button>
                        <button class="btn-action btn-reject" onclick="openRejectLogoModal('${logo.id}')"><i class="fas fa-times-circle"></i></button>
                        <button class="btn-action btn-pending" onclick="setLogoPending('${logo.id}')"><i class="fas fa-clock"></i></button>
                        <button class="btn-action btn-block" onclick="openBlockLogoModal('${logo.id}')"><i class="fas fa-ban"></i></button>
                        <button class="btn-action btn-delete" onclick="openDeleteLogoModal('${logo.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats(logos) {
    document.getElementById('statPending').textContent = logos.filter(l => l.statut === 'en_attente').length;
    document.getElementById('statApproved').textContent = logos.filter(l => l.statut === 'approuve').length;
    document.getElementById('statRejected').textContent = logos.filter(l => l.statut === 'rejete').length;
    document.getElementById('statBlocked').textContent = logos.filter(l => l.statut === 'bloque').length;
    document.getElementById('statTotal').textContent = logos.length;
}
// ========== FIN : CHARGEMENT DES LOGOS ==========

// ========== DÉBUT : FONCTIONS D'ACTION ==========
async function viewLogo(logoId) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('demandes_logos')
            .select('*, designer_users(nom, prenom, email)')
            .eq('id', logoId)
            .single();
        if (error) throw error;
        const url = `${SUPABASE_URL}/storage/v1/object/public/creation_de_logo/${data.file_url}`;
        document.getElementById('viewLogoContent').innerHTML = `
            <img src="${url}" alt="${escapeHtml(data.club_nom)}" style="max-width:100%; border-radius:16px; margin-bottom:15px;">
            <p><strong>Club :</strong> ${escapeHtml(data.club_nom)}</p>
            <p><strong>Quartier :</strong> ${escapeHtml(data.quartier)}</p>
            <p><strong>Créateur :</strong> ${data.designer_users ? escapeHtml(data.designer_users.prenom + ' ' + data.designer_users.nom) : 'Inconnu'}</p>
            <p><strong>Date :</strong> ${formatDateTime(data.created_at)}</p>
            <p><strong>Statut :</strong> ${data.statut}</p>
            <p><strong>Commentaire admin :</strong> ${data.commentaire_admin || '-'}</p>
        `;
        document.getElementById('viewLogoModal').classList.add('active');
    } catch (err) {
        showToast('Erreur visualisation.', 'error');
    } finally {
        hideLoader();
    }
}

function openApproveLogoModal(logoId) {
    currentLogoId = logoId;
    const logo = allLogos.find(l => l.id === logoId);
    if (!logo) return;
    document.getElementById('approveLogoInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(logo.club_nom)}</p>
        <p><strong>Quartier :</strong> ${escapeHtml(logo.quartier)}</p>
    `;
    document.getElementById('approveLogoModal').classList.add('active');
}

function openRejectLogoModal(logoId) {
    currentLogoId = logoId;
    const logo = allLogos.find(l => l.id === logoId);
    if (!logo) return;
    document.getElementById('rejectLogoInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(logo.club_nom)}</p>
        <p><strong>Quartier :</strong> ${escapeHtml(logo.quartier)}</p>
    `;
    document.getElementById('rejectLogoReason').value = '';
    document.getElementById('rejectLogoModal').classList.add('active');
}

function openBlockLogoModal(logoId) {
    currentLogoId = logoId;
    const logo = allLogos.find(l => l.id === logoId);
    if (!logo) return;
    document.getElementById('blockLogoInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(logo.club_nom)}</p>
    `;
    document.getElementById('blockLogoModal').classList.add('active');
}

function openDeleteLogoModal(logoId) {
    currentLogoId = logoId;
    const logo = allLogos.find(l => l.id === logoId);
    if (!logo) return;
    document.getElementById('deleteLogoInfo').innerHTML = `
        <p><strong>Club :</strong> ${escapeHtml(logo.club_nom)}</p>
    `;
    document.getElementById('deleteLogoModal').classList.add('active');
}

async function confirmApproveLogo() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_logos')
            .update({ statut: 'approuve', updated_at: new Date().toISOString() })
            .eq('id', currentLogoId);
        if (error) throw error;

        const logo = allLogos.find(l => l.id === currentLogoId);
        if (logo && logo.user_id) {
            await supabaseAdmin.from('public_messages_prives').insert([{
                expediteur_id: 'admin',
                destinataire_id: logo.user_id,
                sujet: 'Logo approuvé',
                contenu: `Félicitations ! Le logo de votre club ${logo.club_nom} a été approuvé. Vous pouvez maintenant le télécharger depuis votre espace.`,
                lu: false,
                created_at: new Date().toISOString()
            }]);
        }

        showToast('Logo approuvé. Téléchargement débloqué.', 'success');
        document.getElementById('approveLogoModal').classList.remove('active');
        loadLogos();
    } catch (err) {
        showToast('Erreur approbation.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmRejectLogo() {
    const reason = document.getElementById('rejectLogoReason').value.trim();
    if (!reason) { showToast('Veuillez indiquer un motif.', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_logos')
            .update({ statut: 'rejete', commentaire_admin: reason, updated_at: new Date().toISOString() })
            .eq('id', currentLogoId);
        if (error) throw error;
        showToast('Logo rejeté.', 'success');
        document.getElementById('rejectLogoModal').classList.remove('active');
        loadLogos();
    } catch (err) {
        showToast('Erreur rejet.', 'error');
    } finally {
        hideLoader();
    }
}

async function setLogoPending(logoId) {
    if (!confirm('Remettre ce logo en attente ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_logos')
            .update({ statut: 'en_attente', updated_at: new Date().toISOString() })
            .eq('id', logoId);
        if (error) throw error;
        showToast('Logo remis en attente.', 'success');
        loadLogos();
    } catch (err) {
        showToast('Erreur.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmBlockLogo() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_logos')
            .update({ statut: 'bloque', updated_at: new Date().toISOString() })
            .eq('id', currentLogoId);
        if (error) throw error;
        showToast('Logo bloqué.', 'success');
        document.getElementById('blockLogoModal').classList.remove('active');
        loadLogos();
    } catch (err) {
        showToast('Erreur blocage.', 'error');
    } finally {
        hideLoader();
    }
}

async function confirmDeleteLogo() {
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('demandes_logos')
            .delete()
            .eq('id', currentLogoId);
        if (error) throw error;
        showToast('Logo supprimé définitivement.', 'success');
        document.getElementById('deleteLogoModal').classList.remove('active');
        loadLogos();
    } catch (err) {
        showToast('Erreur suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : FONCTIONS D'ACTION ==========

// ========== DÉBUT : ÉCOUTEURS MODALES ==========
document.getElementById('confirmApproveLogoBtn').addEventListener('click', confirmApproveLogo);
document.getElementById('confirmRejectLogoBtn').addEventListener('click', confirmRejectLogo);
document.getElementById('confirmBlockLogoBtn').addEventListener('click', confirmBlockLogo);
document.getElementById('confirmDeleteLogoBtn').addEventListener('click', confirmDeleteLogo);
document.getElementById('refreshLogoBtn').addEventListener('click', loadLogos);

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
document.addEventListener('DOMContentLoaded', loadLogos);
// ========== FIN DE ADMIN-LOGO.JS ==========
