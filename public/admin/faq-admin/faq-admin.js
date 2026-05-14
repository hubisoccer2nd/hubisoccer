/* DEBUT : public/admin/faq-admin/faq-admin.js */
// ========== FAQ-ADMIN.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allFaqs = [];
let currentEditId = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'info', duration = 3000) {
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

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES QUESTIONS ==========
async function loadFAQ() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_pages')
            .select('id, titre, contenu, ordre')
            .eq('slug', 'faq')
            .order('ordre', { ascending: true });
        if (error) throw error;
        allFaqs = data || [];
        renderTable();
    } catch (err) {
        showToast('Erreur lors du chargement des questions.', 'error');
    } finally {
        hideLoader();
    }
}

function renderTable() {
    const tbody = document.getElementById('faqBody');
    if (!tbody) return;
    if (allFaqs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Aucune question enregistrée.</td></tr>';
        return;
    }
    tbody.innerHTML = allFaqs.map(faq => `
        <tr>
            <td>${escapeHtml(faq.titre)}</td>
            <td>${escapeHtml(faq.contenu)}</td>
            <td>${faq.ordre || 0}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" data-id="${faq.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" data-id="${faq.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editFAQ(btn.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteFAQ(btn.dataset.id)));
}
// ========== FIN : CHARGEMENT DES QUESTIONS ==========

// ========== DÉBUT : FORMULAIRE AJOUT / MODIFICATION ==========
function resetForm() {
    document.getElementById('faqForm').reset();
    document.getElementById('faqId').value = '';
    document.getElementById('faqOrder').value = '0';
    currentEditId = null;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une question';
    document.getElementById('cancelBtn').style.display = 'none';
}

function editFAQ(id) {
    const faq = allFaqs.find(f => f.id == id);
    if (!faq) return;
    document.getElementById('faqId').value = faq.id;
    document.getElementById('faqQuestion').value = faq.titre || '';
    document.getElementById('faqAnswer').value = faq.contenu || '';
    document.getElementById('faqOrder').value = faq.ordre || 0;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier la question';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    currentEditId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveFAQ(e) {
    e.preventDefault();
    const id = document.getElementById('faqId').value;
    const titre = document.getElementById('faqQuestion').value.trim();
    const contenu = document.getElementById('faqAnswer').value.trim();
    const ordre = parseInt(document.getElementById('faqOrder').value) || 0;

    if (!titre || !contenu) {
        showToast('Veuillez remplir la question et la réponse.', 'warning');
        return;
    }

    showLoader();
    try {
        const payload = {
            slug: 'faq',
            titre,
            contenu,
            ordre,
            updated_at: new Date().toISOString()
        };

        if (id) {
            const { error } = await supabaseAdmin
                .from('public_pages')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Question mise à jour avec succès.', 'success');
        } else {
            payload.created_at = new Date().toISOString();
            const { error } = await supabaseAdmin
                .from('public_pages')
                .insert([payload]);
            if (error) throw error;
            showToast('Question ajoutée avec succès.', 'success');
        }

        resetForm();
        loadFAQ();
    } catch (err) {
        showToast('Erreur lors de l\'enregistrement.', 'error');
    } finally {
        hideLoader();
    }
}

async function deleteFAQ(id) {
    if (!confirm('Supprimer cette question ? Cette action est irréversible.')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_pages')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Question supprimée avec succès.', 'success');
        loadFAQ();
    } catch (err) {
        showToast('Erreur lors de la suppression.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : FORMULAIRE AJOUT / MODIFICATION ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('faqForm').addEventListener('submit', saveFAQ);
document.getElementById('cancelBtn').addEventListener('click', resetForm);

document.getElementById('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = '../../../';
});

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    });
    document.addEventListener('click', e => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}
// ========== FIN : ÉVÉNEMENTS ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadFAQ();
});
// ========== FIN ==========
/* FIN : public/admin/faq-admin/faq-admin.js */