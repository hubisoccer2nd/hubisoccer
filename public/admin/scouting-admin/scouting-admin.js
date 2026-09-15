/* DEBUT : public/admin/scouting-admin/scouting-admin.js */
// ========== SCOUTING-ADMIN.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allTalents = [];
let currentEditId = null;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT ET AFFICHAGE DES TALENTS ==========
async function loadTalents() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_scouting_sportifs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allTalents = data || [];
        renderTable();
    } catch (err) {
        showToast('Erreur chargement talents', 'error');
    } finally {
        hideLoader();
    }
}

function renderTable() {
    const tbody = document.getElementById('talentsBody');
    if (!tbody) return;
    if (allTalents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Aucun talent enregistré.</td></tr>';
        return;
    }
    tbody.innerHTML = allTalents.map(talent => `
        <tr>
            <td><img src="${talent.image_url || '../img/user-default.jpg'}" alt="${escapeHtml(talent.nom)}" style="width:50px;height:50px;object-fit:cover;border-radius:50%;"></td>
            <td>${escapeHtml(talent.nom)}</td>
            <td>${escapeHtml(talent.poste)}</td>
            <td>${talent.age || '-'}</td>
            <td>${escapeHtml(talent.pays)}</td>
            <td>${escapeHtml(talent.cat)}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" data-id="${talent.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" data-id="${talent.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editTalent(btn.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteTalent(btn.dataset.id)));
}
// ========== FIN : CHARGEMENT ET AFFICHAGE DES TALENTS ==========

// ========== DÉBUT : FORMULAIRE AJOUT / MODIFICATION ==========
function resetForm() {
    document.getElementById('talentForm').reset();
    document.getElementById('talentId').value = '';
    document.getElementById('imageFile').value = '';
    document.getElementById('videoFile').value = '';
    currentEditId = null;
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un talent';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function editTalent(id) {
    const talent = allTalents.find(t => t.id == id);
    if (!talent) return;
    document.getElementById('talentId').value = talent.id;
    document.getElementById('nom').value = talent.nom || '';
    document.getElementById('poste').value = talent.poste || '';
    document.getElementById('age').value = talent.age || '';
    document.getElementById('pays').value = talent.pays || '';
    document.getElementById('continent').value = talent.continent || 'Afrique';
    document.getElementById('cat').value = talent.cat || 'Senior';
    document.getElementById('club').value = talent.club || '';
    document.getElementById('cert').value = talent.cert || '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le talent';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    currentEditId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function uploadFile(file, bucket, fieldName) {
    const safeName = `${Date.now()}_${fieldName}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}.${fileExt}`;

    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
}

async function saveTalent(e) {
    e.preventDefault();
    const id = document.getElementById('talentId').value;
    const nom = document.getElementById('nom').value.trim();
    const poste = document.getElementById('poste').value.trim();
    const age = parseInt(document.getElementById('age').value) || null;
    const pays = document.getElementById('pays').value.trim();
    const continent = document.getElementById('continent').value;
    const cat = document.getElementById('cat').value;
    const club = document.getElementById('club').value.trim();
    const cert = document.getElementById('cert').value.trim();
    const imageFile = document.getElementById('imageFile').files[0];
    const videoFile = document.getElementById('videoFile').files[0];

    if (!nom || !poste || !pays) {
        showToast('Nom, poste et pays obligatoires.', 'warning');
        return;
    }

    showLoader();
    try {
        let image_url = id ? (allTalents.find(t => t.id == id)?.image_url || null) : null;
        let video_url = id ? (allTalents.find(t => t.id == id)?.video_url || null) : null;

        if (imageFile) {
            image_url = await uploadFile(imageFile, 'scouting_photos', 'photo');
        }
        if (videoFile) {
            video_url = await uploadFile(videoFile, 'scouting_videos', 'video');
        }

        const payload = {
            nom, poste, age, pays, continent, cat, club, cert,
            image_url, video_url,
            updated_at: new Date().toISOString()
        };

        if (id) {
            const { error } = await supabaseAdmin.from('public_scouting_sportifs').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Talent mis à jour', 'success');
        } else {
            payload.created_at = new Date().toISOString();
            const { error } = await supabaseAdmin.from('public_scouting_sportifs').insert([payload]);
            if (error) throw error;
            showToast('Talent ajouté', 'success');
        }

        resetForm();
        await loadTalents();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
}

async function deleteTalent(id) {
    if (!confirm('Supprimer ce talent ? Cette action est irréversible.')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_scouting_sportifs').delete().eq('id', id);
        if (error) throw error;
        showToast('Talent supprimé', 'success');
        await loadTalents();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
}
// ========== FIN : FORMULAIRE AJOUT / MODIFICATION ==========

// ========== DÉBUT : ÉVÉNEMENTS ==========
document.getElementById('talentForm').addEventListener('submit', saveTalent);
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
document.addEventListener('DOMContentLoaded', loadTalents);
// ========== FIN ==========
/* FIN : public/admin/scouting-admin/scouting-admin.js */