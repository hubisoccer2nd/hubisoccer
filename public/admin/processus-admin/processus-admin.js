// Configuration Supabase
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdminPublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== OUVERTURE DES MODALES =====
document.getElementById('openEtapesModalBtn').addEventListener('click', () => {
    document.getElementById('etapesModal').classList.add('active');
    loadEtapes();
});
document.getElementById('openStatsModalBtn').addEventListener('click', () => {
    document.getElementById('statsModal').classList.add('active');
    loadStats();
});

// ===== FERMETURE DES MODALES =====
window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.remove('active');
};

document.querySelectorAll('.admin-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
});

// ===== MESSAGES =====
function showMessage(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = text;
    const activeModal = document.querySelector('.admin-modal.active .modal-body');
    if (activeModal) activeModal.prepend(msgDiv);
    else document.querySelector('.admin-container').prepend(msgDiv);
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.remove(), 3000);
}

// ========== GESTION DES ÉTAPES ==========
async function loadEtapes() {
    const { data, error } = await supabaseAdminPublic.from('public_processus_etapes').select('*').order('order', { ascending: true });
    if (error) { showMessage('Erreur chargement étapes', 'error'); return; }
    const container = document.getElementById('etapesList');
    if (!data.length) { container.innerHTML = '<p>Aucune étape</p>'; return; }
    container.innerHTML = data.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-info">
                <h4>${escapeHtml(item.titre)}</h4>
                <p>${escapeHtml(item.description || '')}</p>
                <small>Icône: ${item.icone || 'fa-question'}</small>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editEtape(${item.id})">Modifier</button>
                <button class="delete-btn" onclick="deleteEtape(${item.id})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

window.editEtape = async (id) => {
    const { data } = await supabaseAdminPublic.from('public_processus_etapes').select('*').eq('id', id).single();
    if (!data) return;
    const newTitre = prompt('Nouveau titre', data.titre);
    if (newTitre === null) return;
    const newDesc = prompt('Nouvelle description', data.description);
    const newIcon = prompt('Icône (nom FontAwesome, ex: fa-user-plus)', data.icone);
    const newOrder = prompt('Ordre', data.order);
    const { error } = await supabaseAdminPublic.from('public_processus_etapes').update({
        titre: newTitre,
        description: newDesc,
        icone: newIcon,
        order: parseInt(newOrder) || 0
    }).eq('id', id);
    if (error) showMessage('Erreur modification', 'error');
    else { showMessage('Modifié', 'success'); loadEtapes(); }
};

window.deleteEtape = async (id) => {
    if (!confirm('Supprimer définitivement cette étape ?')) return;
    const { error } = await supabaseAdminPublic.from('public_processus_etapes').delete().eq('id', id);
    if (error) showMessage('Erreur suppression', 'error');
    else { showMessage('Supprimé', 'success'); loadEtapes(); }
};

async function addEtape(e) {
    e.preventDefault();
    const titre = document.getElementById('etapeTitre').value;
    const description = document.getElementById('etapeDesc').value;
    const icone = document.getElementById('etapeIcon').value;
    const order = parseInt(document.getElementById('etapeOrder').value) || 0;
    const { error } = await supabaseAdminPublic.from('public_processus_etapes').insert({ titre, description, icone, order });
    if (error) showMessage('Erreur ajout: ' + error.message, 'error');
    else {
        showMessage('Étape ajoutée', 'success');
        document.getElementById('addEtapeForm').reset();
        loadEtapes();
    }
}

// ========== GESTION DES STATISTIQUES ==========
async function loadStats() {
    const { data, error } = await supabaseAdminPublic.from('public_processus_stats').select('*').order('order', { ascending: true });
    if (error) { showMessage('Erreur chargement stats', 'error'); return; }
    const container = document.getElementById('statsList');
    if (!data.length) { container.innerHTML = '<p>Aucune statistique</p>'; return; }
    container.innerHTML = data.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-info">
                <h4>${escapeHtml(item.nombre)}</h4>
                <p>${escapeHtml(item.label)}</p>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editStat(${item.id})">Modifier</button>
                <button class="delete-btn" onclick="deleteStat(${item.id})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

window.editStat = async (id) => {
    const { data } = await supabaseAdminPublic.from('public_processus_stats').select('*').eq('id', id).single();
    if (!data) return;
    const newNombre = prompt('Nouveau nombre (ex: 500+)', data.nombre);
    if (newNombre === null) return;
    const newLabel = prompt('Nouveau label', data.label);
    const newOrder = prompt('Ordre', data.order);
    const { error } = await supabaseAdminPublic.from('public_processus_stats').update({
        nombre: newNombre,
        label: newLabel,
        order: parseInt(newOrder) || 0
    }).eq('id', id);
    if (error) showMessage('Erreur modification', 'error');
    else { showMessage('Modifié', 'success'); loadStats(); }
};

window.deleteStat = async (id) => {
    if (!confirm('Supprimer définitivement cette statistique ?')) return;
    const { error } = await supabaseAdminPublic.from('public_processus_stats').delete().eq('id', id);
    if (error) showMessage('Erreur suppression', 'error');
    else { showMessage('Supprimé', 'success'); loadStats(); }
};

async function addStat(e) {
    e.preventDefault();
    const nombre = document.getElementById('statNombre').value;
    const label = document.getElementById('statLabel').value;
    const order = parseInt(document.getElementById('statOrder').value) || 0;
    const { error } = await supabaseAdminPublic.from('public_processus_stats').insert({ nombre, label, order });
    if (error) showMessage('Erreur ajout: ' + error.message, 'error');
    else {
        showMessage('Statistique ajoutée', 'success');
        document.getElementById('addStatForm').reset();
        loadStats();
    }
}

// ===== UTILITAIRE =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===== INITIALISATION glace =====
document.getElementById('refreshEtapes').addEventListener('click', loadEtapes);
document.getElementById('refreshStats').addEventListener('click', loadStats);

document.getElementById('addEtapeForm').addEventListener('submit', addEtape);
document.getElementById('addStatForm').addEventListener('submit', addStat);

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = '../administration.html';
});