/* DEBUT : public/admin/cgu-admin/cgu-admin.js */
// ========== CGU-ADMIN.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

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

// ========== DÉBUT : CHARGEMENT DES CGU ==========
async function loadCGU() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_pages')
            .select('titre, contenu')   // ← CORRIGÉ
            .eq('slug', 'cgu')
            .maybeSingle();
        if (error) throw error;
        if (data) {
            document.getElementById('cguTitle').value = data.titre || '';   // ← CORRIGÉ
            document.getElementById('cguContent').value = data.contenu || '';   // ← CORRIGÉ
        }
    } catch (err) {
        showToast('Erreur lors du chargement des CGU.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : CHARGEMENT DES CGU ==========

// ========== DÉBUT : SAUVEGARDE DES CGU ==========
async function saveCGU(e) {
    e.preventDefault();
    const title = document.getElementById('cguTitle').value.trim();
    const content = document.getElementById('cguContent').value.trim();
    if (!title || !content) {
        showToast('Veuillez remplir le titre et le contenu.', 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_pages')
            .upsert({
                slug: 'cgu',
                titre: title,      // ← CORRIGÉ
                contenu: content,  // ← CORRIGÉ
                updated_at: new Date().toISOString()
            }, { onConflict: 'slug' });

        if (error) throw error;
        showToast('CGU mises à jour avec succès.', 'success');
    } catch (err) {
        showToast('Erreur lors de l\'enregistrement.', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : SAUVEGARDE DES CGU ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.addEventListener('DOMContentLoaded', () => {
    loadCGU();
    document.getElementById('cguForm').addEventListener('submit', saveCGU);

    // Déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../../../';
    });

    // Menu mobile
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
});
// ========== FIN : ÉVÉNEMENTS ==========
/* FIN : public/admin/cgu-admin/cgu-admin.js */