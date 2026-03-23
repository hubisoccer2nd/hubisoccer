// Configuration Supabase
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdminPublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== GESTION DES ENGAGEMENTS ==========
const engagementsList = document.getElementById('engagementsList');
const engagementModal = document.getElementById('engagementModal');
const engagementForm = document.getElementById('engagementForm');
const engagementIdInput = document.getElementById('engagementId');
const engTitreInput = document.getElementById('engTitre');
const engDescriptionInput = document.getElementById('engDescription');
const engIconInput = document.getElementById('engIcon');
const engOrderInput = document.getElementById('engOrder');
let currentEngagementId = null;

function openEngagementModal(edit = false, data = null) {
    if (edit && data) {
        document.getElementById('engagementModalTitle').textContent = 'Modifier un engagement';
        engagementIdInput.value = data.id;
        engTitreInput.value = data.title;
        engDescriptionInput.value = data.description || '';
        engIconInput.value = data.icon || '';
        engOrderInput.value = data.order || 0;
        currentEngagementId = data.id;
    } else {
        document.getElementById('engagementModalTitle').textContent = 'Ajouter un engagement';
        engagementForm.reset();
        engagementIdInput.value = '';
        currentEngagementId = null;
    }
    engagementModal.classList.add('active');
}

function closeEngagementModal() {
    engagementModal.classList.remove('active');
}

async function loadEngagements() {
    const { data: engagements, error } = await supabaseAdminPublic
        .from('public_engagements')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement engagements:', error);
        engagementsList.innerHTML = '<p class="no-data">Erreur de chargement.</p>';
        return;
    }
    if (!engagements || engagements.length === 0) {
        engagementsList.innerHTML = '<p class="no-data">Aucun engagement. Cliquez sur "Ajouter" pour en créer un.</p>';
        return;
    }
    let html = '';
    engagements.forEach(item => {
        html += `
            <div class="list-item" data-id="${item.id}">
                <div class="info">
                    <strong>${escapeHtml(item.title)}</strong><br>
                    <small>${escapeHtml(item.description)}</small>
                    <div class="details">Icône: ${item.icon || 'fa-handshake'} | Ordre: ${item.order}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editEngagement(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteEngagement(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    engagementsList.innerHTML = html;
}

window.editEngagement = async (id) => {
    const { data, error } = await supabaseAdminPublic
        .from('public_engagements')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        alert('Erreur chargement engagement');
        return;
    }
    openEngagementModal(true, data);
};

window.deleteEngagement = async (id) => {
    if (!confirm('Supprimer cet engagement définitivement ?')) return;
    const { error } = await supabaseAdminPublic
        .from('public_engagements')
        .delete()
        .eq('id', id);
    if (error) {
        alert('Erreur suppression : ' + error.message);
    } else {
        loadEngagements();
    }
};

engagementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = engTitreInput.value.trim();
    const description = engDescriptionInput.value.trim();
    const icon = engIconInput.value.trim();
    const order = parseInt(engOrderInput.value) || 0;

    if (currentEngagementId) {
        // Modification
        const { error } = await supabaseAdminPublic
            .from('public_engagements')
            .update({ title, description, icon, order })
            .eq('id', currentEngagementId);
        if (error) {
            alert('Erreur modification : ' + error.message);
        } else {
            closeEngagementModal();
            loadEngagements();
        }
    } else {
        // Ajout
        const { error } = await supabaseAdminPublic
            .from('public_engagements')
            .insert([{ title, description, icon, order }]);
        if (error) {
            alert('Erreur ajout : ' + error.message);
        } else {
            closeEngagementModal();
            loadEngagements();
        }
    }
});

document.getElementById('addEngagementBtn').addEventListener('click', () => openEngagementModal(false));

// ========== GESTION DES RÔLES ==========
const rolesList = document.getElementById('rolesList');
const roleModal = document.getElementById('roleModal');
const roleForm = document.getElementById('roleForm');
const roleIdInput = document.getElementById('roleId');
const roleTitreInput = document.getElementById('roleTitre');
const roleDescriptionInput = document.getElementById('roleDescription');
const roleIconInput = document.getElementById('roleIcon');
const roleOrderInput = document.getElementById('roleOrder');
let currentRoleId = null;

function openRoleModal(edit = false, data = null) {
    if (edit && data) {
        document.getElementById('roleModalTitle').textContent = 'Modifier un rôle';
        roleIdInput.value = data.id;
        roleTitreInput.value = data.title;
        roleDescriptionInput.value = data.description || '';
        roleIconInput.value = data.icon || '';
        roleOrderInput.value = data.order || 0;
        currentRoleId = data.id;
    } else {
        document.getElementById('roleModalTitle').textContent = 'Ajouter un rôle';
        roleForm.reset();
        roleIdInput.value = '';
        currentRoleId = null;
    }
    roleModal.classList.add('active');
}

function closeRoleModal() {
    roleModal.classList.remove('active');
}

async function loadRoles() {
    const { data: roles, error } = await supabaseAdminPublic
        .from('public_roles')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement rôles:', error);
        rolesList.innerHTML = '<p class="no-data">Erreur de chargement.</p>';
        return;
    }
    if (!roles || roles.length === 0) {
        rolesList.innerHTML = '<p class="no-data">Aucun rôle. Cliquez sur "Ajouter" pour en créer un.</p>';
        return;
    }
    let html = '';
    roles.forEach(item => {
        html += `
            <div class="list-item" data-id="${item.id}">
                <div class="info">
                    <strong>${escapeHtml(item.title)}</strong><br>
                    <small>${escapeHtml(item.description)}</small>
                    <div class="details">Icône: ${item.icon || 'fa-user'} | Ordre: ${item.order}</div>
                </div>
                <div class="actions">
                    <button class="edit" onclick="editRole(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteRole(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    rolesList.innerHTML = html;
}

window.editRole = async (id) => {
    const { data, error } = await supabaseAdminPublic
        .from('public_roles')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        alert('Erreur chargement rôle');
        return;
    }
    openRoleModal(true, data);
};

window.deleteRole = async (id) => {
    if (!confirm('Supprimer ce rôle définitivement ?')) return;
    const { error } = await supabaseAdminPublic
        .from('public_roles')
        .delete()
        .eq('id', id);
    if (error) {
        alert('Erreur suppression : ' + error.message);
    } else {
        loadRoles();
    }
};

roleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = roleTitreInput.value.trim();
    const description = roleDescriptionInput.value.trim();
    const icon = roleIconInput.value.trim();
    const order = parseInt(roleOrderInput.value) || 0;

    if (currentRoleId) {
        const { error } = await supabaseAdminPublic
            .from('public_roles')
            .update({ title, description, icon, order })
            .eq('id', currentRoleId);
        if (error) {
            alert('Erreur modification : ' + error.message);
        } else {
            closeRoleModal();
            loadRoles();
        }
    } else {
        const { error } = await supabaseAdminPublic
            .from('public_roles')
            .insert([{ title, description, icon, order }]);
        if (error) {
            alert('Erreur ajout : ' + error.message);
        } else {
            closeRoleModal();
            loadRoles();
        }
    }
});

document.getElementById('addRoleBtn').addEventListener('click', () => openRoleModal(false));

// ========== GESTION DES STADES ==========
const stadesList = document.getElementById('stadesList');
const stadeModal = document.getElementById('stadeModal');
const stadeForm = document.getElementById('stadeForm');
const stadeIdInput = document.getElementById('stadeId');
const stadeNameInput = document.getElementById('stadeName');
const stadeDescriptionInput = document.getElementById('stadeDescription');
const stadeImageInput = document.getElementById('stadeImage');
const stadeOrderInput = document.getElementById('stadeOrder');
let currentStadeId = null;

function openStadeModal(edit = false, data = null) {
    if (edit && data) {
        document.getElementById('stadeModalTitle').textContent = 'Modifier un stade';
        stadeIdInput.value = data.id;
        stadeNameInput.value = data.name;
        stadeDescriptionInput.value = data.description || '';
        stadeOrderInput.value = data.order || 0;
        currentStadeId = data.id;
        // Pour l'image, on ne peut pas préremplir le champ file, on laisse vide
    } else {
        document.getElementById('stadeModalTitle').textContent = 'Ajouter un stade';
        stadeForm.reset();
        stadeIdInput.value = '';
        currentStadeId = null;
    }
    stadeModal.classList.add('active');
}

function closeStadeModal() {
    stadeModal.classList.remove('active');
}

async function loadStades() {
    const { data: stades, error } = await supabaseAdminPublic
        .from('public_stades')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement stades:', error);
        stadesList.innerHTML = '<p class="no-data">Erreur de chargement.</p>';
        return;
    }
    if (!stades || stades.length === 0) {
        stadesList.innerHTML = '<p class="no-data">Aucun stade. Cliquez sur "Ajouter" pour en créer un.</p>';
        return;
    }
    let html = '';
    stades.forEach(item => {
        html += `
            <div class="list-item" data-id="${item.id}">
                <div class="info">
                    <strong>${escapeHtml(item.name)}</strong><br>
                    <small>${escapeHtml(item.description)}</small>
                    <div class="details">Ordre: ${item.order}</div>
                    ${item.image_url ? `<img class="image-preview" src="${item.image_url}" alt="${item.name}">` : ''}
                </div>
                <div class="actions">
                    <button class="edit" onclick="editStade(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteStade(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    stadesList.innerHTML = html;
}

window.editStade = async (id) => {
    const { data, error } = await supabaseAdminPublic
        .from('public_stades')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        alert('Erreur chargement stade');
        return;
    }
    openStadeModal(true, data);
};

window.deleteStade = async (id) => {
    if (!confirm('Supprimer ce stade définitivement ?')) return;
    const { error } = await supabaseAdminPublic
        .from('public_stades')
        .delete()
        .eq('id', id);
    if (error) {
        alert('Erreur suppression : ' + error.message);
    } else {
        loadStades();
    }
};

async function uploadStadeImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabaseAdminPublic.storage.from('public_images').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdminPublic.storage.from('public_images').getPublicUrl(fileName);
    return urlData.publicUrl;
}

stadeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = stadeNameInput.value.trim();
    const description = stadeDescriptionInput.value.trim();
    const order = parseInt(stadeOrderInput.value) || 0;
    let imageUrl = '';

    if (stadeImageInput.files.length) {
        try {
            imageUrl = await uploadStadeImage(stadeImageInput.files[0]);
        } catch (err) {
            alert('Erreur upload image');
            return;
        }
    }

    if (currentStadeId) {
        // Modification : on conserve l'ancienne image si aucune nouvelle n'est uploadée
        let updateData = { name, description, order };
        if (imageUrl) updateData.image_url = imageUrl;
        const { error } = await supabaseAdminPublic
            .from('public_stades')
            .update(updateData)
            .eq('id', currentStadeId);
        if (error) {
            alert('Erreur modification : ' + error.message);
        } else {
            closeStadeModal();
            loadStades();
        }
    } else {
        // Ajout
        const { error } = await supabaseAdminPublic
            .from('public_stades')
            .insert([{ name, description, image_url: imageUrl, order }]);
        if (error) {
            alert('Erreur ajout : ' + error.message);
        } else {
            closeStadeModal();
            loadStades();
        }
    }
});

document.getElementById('addStadeBtn').addEventListener('click', () => openStadeModal(false));

// ========== UTILITAIRE ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== INITIALISATION ==========
loadEngagements();
loadRoles();
loadStades();

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
    // On ne fait pas de signOut ici car pas d'authentification active, on redirige simplement
    window.location.href = '../administration.html';
});