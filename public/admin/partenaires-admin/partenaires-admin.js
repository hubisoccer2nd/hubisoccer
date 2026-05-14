/* DEBUT : public/admin/partenaires-admin/partenaires-admin.js */
// ========== PARTENAIRES-ADMIN.JS ==========
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

// ========== GESTION DES PARTENAIRES ==========
const partenairesBody = document.getElementById('partenairesBody');
const partenaireForm = document.getElementById('partenaireForm');
const formTitle = document.getElementById('formTitle');
const partenaireId = document.getElementById('partenaireId');
const nomInput = document.getElementById('nom');
const descriptionInput = document.getElementById('description');
const siteWebInput = document.getElementById('site_web');
const logoFileInput = document.getElementById('logoFile');
const ordreInput = document.getElementById('ordre');
const cancelBtn = document.getElementById('cancelBtn');

async function loadPartenaires() {
    if (!partenairesBody) return;
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_partenaires')
            .select('*')
            .order('ordre', { ascending: true });
        if (error) throw error;
        renderTable(data || []);
    } catch (err) { showToast('Erreur chargement partenaires', 'error'); } finally { hideLoader(); }
}

function renderTable(partenaires) {
    if (!partenairesBody) return;
    if (partenaires.length === 0) {
        partenairesBody.innerHTML = '<tr><td colspan="5">Aucun partenaire enregistré.</td></tr>';
        return;
    }
    partenairesBody.innerHTML = partenaires.map(p => `
        <tr>
            <td><img src="${escapeHtml(p.logo_url)}" alt="${escapeHtml(p.nom)}" style="width:60px;height:60px;object-fit:contain;border-radius:8px;"></td>
            <td>${escapeHtml(p.nom)}</td>
            <td>${escapeHtml(p.description || '-')}</td>
            <td>${p.ordre || 0}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" data-id="${p.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    partenairesBody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editPartenaire(btn.dataset.id)));
    partenairesBody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deletePartenaire(btn.dataset.id)));
}

function resetForm() {
    partenaireForm.reset();
    partenaireId.value = '';
    ordreInput.value = '0';
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un partenaire';
    cancelBtn.style.display = 'none';
}

async function editPartenaire(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_partenaires')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        partenaireId.value = data.id;
        nomInput.value = data.nom || '';
        descriptionInput.value = data.description || '';
        siteWebInput.value = data.site_web || '';
        ordreInput.value = data.ordre || 0;
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le partenaire';
        cancelBtn.style.display = 'inline-block';
    } catch (err) { showToast('Erreur chargement partenaire', 'error'); } finally { hideLoader(); }
}

async function uploadLogo(file) {
    const fileName = `partenaire_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabaseAdmin.storage.from('partenaires_logos').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from('partenaires_logos').getPublicUrl(fileName);
    return urlData.publicUrl;
}

async function savePartenaire(e) {
    e.preventDefault();
    const id = partenaireId.value;
    const nom = nomInput.value.trim();
    const description = descriptionInput.value.trim();
    const site_web = siteWebInput.value.trim();
    const ordre = parseInt(ordreInput.value) || 0;
    const logoFile = logoFileInput.files[0];

    if (!nom) { showToast('Veuillez saisir un nom', 'warning'); return; }

    showLoader();
    try {
        let logo_url = id ? (await supabaseAdmin.from('public_partenaires').select('logo_url').eq('id', id).single()).data?.logo_url : null;
        if (logoFile) logo_url = await uploadLogo(logoFile);

        const payload = { nom, description, site_web, ordre, logo_url, updated_at: new Date().toISOString() };
        if (id) {
            const { error } = await supabaseAdmin.from('public_partenaires').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Partenaire modifié', 'success');
        } else {
            const { error } = await supabaseAdmin.from('public_partenaires').insert([{ ...payload, created_at: new Date().toISOString() }]);
            if (error) throw error;
            showToast('Partenaire ajouté', 'success');
        }
        resetForm();
        loadPartenaires();
    } catch (err) { showToast('Erreur enregistrement', 'error'); } finally { hideLoader(); }
}

async function deletePartenaire(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_partenaires').delete().eq('id', id);
        if (error) throw error;
        showToast('Partenaire supprimé', 'success');
        loadPartenaires();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

partenaireForm.addEventListener('submit', savePartenaire);
cancelBtn.addEventListener('click', resetForm);

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
loadPartenaires();
/* FIN : public/admin/partenaires-admin/partenaires-admin.js */