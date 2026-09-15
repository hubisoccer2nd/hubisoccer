/* DEBUT : public/admin/processus-admin/processus-admin.js */
// ========== PROCESSUS-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Éléments DOM
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'info') {
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
    setTimeout(() => toast.remove(), 3000);
}

// ========== GESTION DES ÉTAPES ==========
const stepsContainer = document.getElementById('stepsContainer');
const processusForm = document.getElementById('processusForm');

async function loadSteps() {
    if (!stepsContainer) return;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_processus_etapes')
            .select('*')
            .order('etape', { ascending: true });
        if (error) throw error;
        renderSteps(data || []);
    } catch (err) { showToast('Erreur chargement étapes', 'error'); } finally { hideLoader(); }
}

function renderSteps(steps) {
    if (!stepsContainer) return;
    if (steps.length === 0) {
        stepsContainer.innerHTML = '<p>Aucune étape trouvée.</p>';
        return;
    }
    stepsContainer.innerHTML = steps.map(step => `
        <div class="step-item">
            <div class="step-number">${step.etape}</div>
            <div class="step-fields">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="title_${step.etape}" value="${escapeHtml(step.titre)}">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="desc_${step.etape}" rows="3">${escapeHtml(step.description)}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

async function saveSteps(e) {
    e.preventDefault();
    const stepElements = document.querySelectorAll('.step-item');
    if (!stepElements.length) return;

    showLoader();
    try {
        for (const el of stepElements) {
            const num = el.querySelector('.step-number').textContent;
            const titre = el.querySelector('input').value.trim();
            const description = el.querySelector('textarea').value.trim();
            if (!titre || !description) continue;

            const { error } = await supabaseAdmin
                .from('public_processus_etapes')
                .upsert({
                    etape: parseInt(num),
                    titre: titre,
                    description: description,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'etape' });

            if (error) throw error;
        }
        showToast('Étapes enregistrées avec succès', 'success');
    } catch (err) { showToast('Erreur lors de l\'enregistrement', 'error'); } finally { hideLoader(); }
}

if (processusForm) processusForm.addEventListener('submit', saveSteps);

// ========== MENU MOBILE & DÉCONNEXION ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) { navLinks.classList.remove('active'); menuToggle.classList.remove('open'); } });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../../../';
    });
}

// ========== INITIALISATION ==========
loadSteps();
/* FIN : public/admin/processus-admin/processus-admin.js */
