// ========== GESTION-CONTRATS-TEMPLATES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allTemplates = [];
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

function sanitizeHtml(html) {
    if (!html) return '';
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/ on\w+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/ on\w+='[^']*'/gi, '');
    return cleaned;
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES TEMPLATES ==========
async function loadTemplates() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_contrats_templates')
            .select('*')
            .order('id', { ascending: true });
        if (error) throw error;
        allTemplates = data || [];
        renderTemplatesTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement templates', 'error');
    } finally {
        hideLoader();
    }
}

function renderTemplatesTable() {
    const tbody = document.getElementById('templatesBody');
    if (!tbody) return;
    if (allTemplates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Aucun template trouvé.</td></tr>';
        return;
    }
    tbody.innerHTML = allTemplates.map(tpl => {
        const actifBadge = tpl.actif
            ? '<span class="status-badge status-valide">Actif</span>'
            : '<span class="status-badge status-rejete">Inactif</span>';
        return `
            <tr data-id="${tpl.id}">
                <td class="id-cell">${tpl.id}</td>
                <td>${escapeHtml(tpl.titre)}</td>
                <td>${escapeHtml(tpl.type_contrat)}</td>
                <td>${actifBadge}</td>
                <td>${formatDate(tpl.updated_at || tpl.created_at)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-view" data-id="${tpl.id}" title="Visualiser"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-edit" data-id="${tpl.id}" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-toggle" data-id="${tpl.id}" data-actif="${tpl.actif}" title="${tpl.actif ? 'Désactiver' : 'Activer'}"><i class="fas ${tpl.actif ? 'fa-toggle-on' : 'fa-toggle-off'}"></i></button>
                    <button class="btn-icon btn-delete" data-id="${tpl.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openEditModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-toggle').forEach(b => b.addEventListener('click', () => toggleTemplate(b.dataset.id, b.dataset.actif === 'true')));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteTemplate(b.dataset.id)));
}
// ========== FIN : CHARGEMENT DES TEMPLATES ==========

// ========== DÉBUT : MODALE VISUALISATION ==========
function openViewModal(id) {
    const tpl = allTemplates.find(t => t.id == id);
    if (!tpl) return;
    document.getElementById('viewContent').innerHTML = sanitizeHtml(tpl.contenu_html);
    document.getElementById('viewModal').classList.add('active');
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : CRÉATION D'UN TEMPLATE ==========
function openCreateModal() {
    document.getElementById('createTemplateForm').reset();
    document.getElementById('createModal').classList.add('active');
}

document.getElementById('createTemplateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        titre: document.getElementById('createTemplateTitre').value.trim(),
        type_contrat: document.getElementById('createTemplateType').value,
        contenu_html: document.getElementById('createTemplateContenu').value,
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    if (!data.titre || !data.contenu_html) {
        showToast('Titre et contenu obligatoires.', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('nosclub_contrats_templates').insert([data]);
        if (error) throw error;
        showToast('Template créé avec succès.', 'success');
        closeAllModals();
        loadTemplates();
    } catch (err) {
        console.error(err);
        showToast('Erreur création template.', 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : CRÉATION ==========

// ========== DÉBUT : ÉDITION ==========
function openEditModal(id) {
    const tpl = allTemplates.find(t => t.id == id);
    if (!tpl) return;
    document.getElementById('editTemplateId').value = tpl.id;
    document.getElementById('editTemplateTitre').value = tpl.titre || '';
    document.getElementById('editTemplateType').value = tpl.type_contrat || '';
    document.getElementById('editTemplateActif').value = tpl.actif ? 'true' : 'false';
    document.getElementById('editTemplateContenu').value = tpl.contenu_html || '';
    document.getElementById('editTemplateModal').classList.add('active');
}

document.getElementById('editTemplateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editTemplateId').value;
    const data = {
        titre: document.getElementById('editTemplateTitre').value.trim(),
        type_contrat: document.getElementById('editTemplateType').value,
        actif: document.getElementById('editTemplateActif').value === 'true',
        contenu_html: document.getElementById('editTemplateContenu').value,
        updated_at: new Date().toISOString()
    };
    if (!data.titre || !data.contenu_html) {
        showToast('Titre et contenu obligatoires.', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('nosclub_contrats_templates').update(data).eq('id', id);
        if (error) throw error;
        showToast('Template mis à jour.', 'success');
        closeAllModals();
        loadTemplates();
    } catch (err) {
        console.error(err);
        showToast('Erreur mise à jour template.', 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : ÉDITION ==========

// ========== DÉBUT : ACTIVER / DÉSACTIVER ==========
async function toggleTemplate(id, currentlyActive) {
    const newState = !currentlyActive;
    const action = newState ? 'activer' : 'désactiver';
    if (!confirm(`Voulez-vous vraiment ${action} ce template ?`)) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_contrats_templates')
            .update({ actif: newState, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        showToast(`Template ${action.replace('er', 'é')} avec succès.`, 'success');
        loadTemplates();
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du changement d\'état.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : ACTIVATION / DÉSACTIVATION ==========

// ========== DÉBUT : SUPPRESSION ==========
async function deleteTemplate(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce template ? Cette action est irréversible.')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_contrats_templates')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Template supprimé avec succès.', 'success');
        loadTemplates();
    } catch (err) {
        console.error(err);
        showToast('Erreur suppression template.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : SUPPRESSION ==========

// ========== DÉBUT : FERMETURE MODALES ==========
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeAllModals(); });
// ========== FIN : FERMETURE MODALES ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('newTemplateBtn').addEventListener('click', openCreateModal);
document.getElementById('refreshTemplatesBtn').addEventListener('click', () => {
    loadTemplates();
    showToast('Liste rafraîchie.', 'success');
});
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
document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); showToast('Déconnexion', 'info'); });
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
});
// ========== FIN DE GESTION-CONTRATS-TEMPLATES.JS ==========