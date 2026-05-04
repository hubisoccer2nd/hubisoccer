// ========== GESTION-CONTRATS-SIGNATURES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allSignatures = [];
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

// ========== DÉBUT : CHARGEMENT DES SIGNATURES ==========
async function loadSignatures() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('nosclub_contrats')
            .select('*')
            .order('signe_le', { ascending: false });
        if (error) throw error;
        allSignatures = data || [];
        renderSignaturesTable();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement signatures', 'error');
    } finally {
        hideLoader();
    }
}

function getFilteredSignatures() {
    const type = document.getElementById('typeFilter').value;
    const date = document.getElementById('dateFilter').value;
    return allSignatures.filter(sig => {
        const matchType = type === 'all' || sig.type_signataire === type;
        const sigDate = sig.signe_le ? sig.signe_le.split('T')[0] : '';
        const matchDate = !date || sigDate === date;
        return matchType && matchDate;
    });
}

function renderSignaturesTable() {
    const tbody = document.getElementById('signaturesBody');
    if (!tbody) return;
    const filtered = getFilteredSignatures();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Aucune signature trouvée.</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(sig => {
        return `
            <tr data-id="${sig.id}">
                <td class="id-cell">${sig.id}</td>
                <td>${escapeHtml(sig.type_signataire === 'talent' ? 'Talent #' + sig.inscription_id : 'Club #' + sig.inscription_id)}</td>
                <td>${escapeHtml(sig.type_signataire)}</td>
                <td>${formatDate(sig.signe_le)}</td>
                <td>${escapeHtml(sig.adresse || '-')}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-view" data-id="${sig.id}" title="Voir le contrat"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon btn-delete" data-id="${sig.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    tbody.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openViewModal(b.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteSignature(b.dataset.id)));
}
// ========== FIN : CHARGEMENT DES SIGNATURES ==========

// ========== DÉBUT : MODALE VISUALISATION ==========
async function openViewModal(id) {
    const sig = allSignatures.find(s => s.id == id);
    if (!sig) return;

    // Contenu du contrat
    document.getElementById('viewContent').innerHTML = sanitizeHtml(sig.contenu_contrat || 'Contrat non disponible.');

    // Image de la signature
    const signatureContainer = document.getElementById('viewSignature');
    if (sig.signature_data) {
        signatureContainer.innerHTML = `<img src="${sig.signature_data}" alt="Signature" style="max-width: 300px; border: 1px solid var(--light-gray); border-radius: 12px;">`;
    } else {
        signatureContainer.innerHTML = '<p>Aucune signature enregistrée.</p>';
    }

    // Bouton imprimer
    const printBtn = document.getElementById('printContractBtn');
    printBtn.onclick = () => imprimerContrat(sig);

    document.getElementById('viewModal').classList.add('active');
}

function imprimerContrat(sig) {
    const contenu = sig.contenu_contrat || '';
    const signatureHtml = sig.signature_data
        ? `<img src="${sig.signature_data}" style="max-width: 300px;">`
        : '<p>Aucune signature</p>';
    const dateSignature = sig.signe_le ? new Date(sig.signe_le).toLocaleDateString('fr-FR') : '';
    const fenetre = window.open('', '_blank', 'width=800,height=600');
    fenetre.document.write(`
        <html>
            <head>
                <title>Contrat signé</title>
                <style>
                    body { font-family: 'Poppins', sans-serif; padding: 40px; line-height: 1.6; }
                    .signature { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
                    img { max-width: 300px; }
                </style>
            </head>
            <body>
                ${sanitizeHtml(contenu)}
                <div class="signature">
                    <p><strong>Signé le :</strong> ${dateSignature}</p>
                    <p><strong>Adresse :</strong> ${escapeHtml(sig.adresse || 'Non renseignée')}</p>
                    <div>${signatureHtml}</div>
                </div>
            </body>
        </html>
    `);
    fenetre.document.close();
    fenetre.onload = () => fenetre.print();
}
// ========== FIN : MODALE VISUALISATION ==========

// ========== DÉBUT : SUPPRESSION ==========
async function deleteSignature(id) {
    if (!confirm('Supprimer définitivement cette signature ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('nosclub_contrats')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Signature supprimée.', 'success');
        loadSignatures();
    } catch (err) {
        console.error(err);
        showToast('Erreur suppression signature.', 'error');
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

// ========== DÉBUT : ÉVÉNEMENTS FILTRES ==========
document.getElementById('typeFilter').addEventListener('change', renderSignaturesTable);
document.getElementById('dateFilter').addEventListener('change', renderSignaturesTable);
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadSignatures();
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
    loadSignatures();
});
// ========== FIN DE GESTION-CONTRATS-SIGNATURES.JS ==========