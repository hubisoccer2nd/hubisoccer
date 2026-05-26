/* ============================================================
   HubISoccer — admin-parrain-dash.js
   Administration Parrains · Gestion des profils
   ============================================================ */

'use strict';

/* DEBUT : CONFIGURATION SUPABASE */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
/* FIN : CONFIGURATION SUPABASE */

/* DEBUT : ÉTAT GLOBAL */
let currentAdmin = null;
let parrainsData = [];
let currentAction = null;
/* FIN : ÉTAT GLOBAL */

/* DEBUT : FONCTIONS UTILITAIRES */
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 30000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { toast.remove(); }, 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const img = document.getElementById('userAvatar');
    const init = document.getElementById('userAvatarInitials');
    const url = currentAdmin && currentAdmin.avatar_url;
    if (url) {
        if (img) { img.src = url; img.style.display = 'block'; }
        if (init) init.style.display = 'none';
    } else {
        const initials = getInitials(currentAdmin && (currentAdmin.full_name || currentAdmin.display_name) || 'A');
        if (init) { init.textContent = initials; init.style.display = 'flex'; }
        if (img) img.style.display = 'none';
    }
}
/* FIN : FONCTIONS UTILITAIRES */

/* DEBUT : VÉRIFICATION ADMIN */
async function checkAdmin() {
    showLoader(true);
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            window.location.href = '../../authprive/users/login.html?role=ADMIN';
            return false;
        }
        const { data: profile, error: profileError } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('role_code, full_name, display_name, avatar_url')
            .eq('auth_uuid', user.id)
            .single();
        if (profileError || !profile) {
            window.location.href = '../../authprive/users/login.html?role=ADMIN';
            return false;
        }
        if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
            showToast('Accès réservé aux administrateurs', 'error');
            setTimeout(function() {
                window.location.href = '../../authprive/users/login.html?role=ADMIN';
            }, 2000);
            return false;
        }
        currentAdmin = profile;
        document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin';
        updateAvatarUI();
        return true;
    } catch (err) {
        console.error(err);
        showToast('Erreur de vérification', 'error');
        return false;
    } finally {
        showLoader(false);
    }
}
/* FIN : VÉRIFICATION ADMIN */

/* DEBUT : CHARGEMENT DES PARRAINS */
async function loadParrains() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('*')
            .eq('role_code', 'PARRAIN')
            .order('full_name');
        if (error) throw error;
        parrainsData = data || [];
        renderParrains();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des parrains', 'error');
    } finally {
        showLoader(false);
    }
}

function renderParrains() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = parrainsData.filter(function(p) {
        return (p.full_name || '').toLowerCase().includes(search) ||
               (p.email || '').toLowerCase().includes(search) ||
               (p.hubisoccer_id || '').toLowerCase().includes(search);
    });

    const container = document.getElementById('parrainsList');
    if (!container) return;
    container.innerHTML = '';

    if (!filtered.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = 'Aucun parrain trouvé.';
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(function(p) {
        const card = document.createElement('div');
        card.className = 'parrain-card';
        card.dataset.id = p.hubisoccer_id;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'parrain-info';
        infoDiv.innerHTML = '<div class="parrain-name">' + (p.full_name || 'Sans nom') + '</div>' +
                            '<div class="parrain-email">' + (p.email || '—') + '</div>' +
                            '<div class="parrain-id">ID : ' + p.hubisoccer_id + '</div>';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'parrain-status ' + (p.is_active ? 'active' : 'inactive');
        statusDiv.textContent = p.is_active ? 'Actif' : 'Inactif';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'parrain-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openParrainModal(p);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteParrain(p.hubisoccer_id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(infoDiv);
        card.appendChild(statusDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT DES PARRAINS */

/* DEBUT : STATISTIQUES */
async function updateStats() {
    // Total parrains (depuis les données chargées)
    document.getElementById('totalCount').textContent = parrainsData.length;

    // Agréger les données de scouting pour les totaux
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_parrain_scouting')
            .select('total_proteges, total_dons_financiers, nb_bourses_accordees');
        if (error) {
            document.getElementById('totalProteges').textContent = '—';
            document.getElementById('totalDons').textContent = '—';
            document.getElementById('totalBourses').textContent = '—';
            return;
        }
        let sumProteges = 0, sumDons = 0, sumBourses = 0;
        (data || []).forEach(function(d) {
            sumProteges += (d.total_proteges || 0);
            sumDons += (d.total_dons_financiers || 0);
            sumBourses += (d.nb_bourses_accordees || 0);
        });
        document.getElementById('totalProteges').textContent = sumProteges;
        document.getElementById('totalDons').textContent = sumDons.toLocaleString('fr-FR') + ' €';
        document.getElementById('totalBourses').textContent = sumBourses;
    } catch (err) {
        console.error(err);
        document.getElementById('totalProteges').textContent = '—';
        document.getElementById('totalDons').textContent = '—';
        document.getElementById('totalBourses').textContent = '—';
    }
}
/* FIN : STATISTIQUES */

/* DEBUT : MODAL AJOUT / MODIFICATION */
function openParrainModal(parrain) {
    // Réinitialiser le formulaire
    document.getElementById('parrainId').value = parrain ? parrain.hubisoccer_id : '';
    document.getElementById('parrainHubisoccerId').value = parrain ? parrain.hubisoccer_id : '';
    document.getElementById('parrainHubisoccerId').disabled = !!parrain; // ne pas modifier l'ID existant
    document.getElementById('parrainEmail').value = parrain ? (parrain.email || '') : '';
    document.getElementById('parrainLastName').value = parrain ? (parrain.last_name || '') : '';
    document.getElementById('parrainFirstName').value = parrain ? (parrain.first_name || '') : '';
    document.getElementById('parrainBirthDate').value = parrain ? (parrain.birth_date || '') : '';
    document.getElementById('parrainCountry').value = parrain ? (parrain.country_code || '') : '';
    document.getElementById('parrainPhone').value = parrain ? (parrain.phone || '') : '';
    document.getElementById('parrainPseudo').value = parrain ? (parrain.pseudo || '') : '';
    document.getElementById('parrainStatus').value = parrain ? (parrain.is_active ? 'true' : 'false') : 'true';

    document.getElementById('parrainModalTitle').textContent = parrain ? 'Modifier le parrain' : 'Ajouter un parrain';
    document.getElementById('parrainModal').style.display = 'flex';
}

function closeParrainModal() {
    document.getElementById('parrainModal').style.display = 'none';
}

document.getElementById('parrainForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('parrainId').value; // ID existant (hubisoccer_id) si modification
    const hubisoccerId = document.getElementById('parrainHubisoccerId').value.trim();
    const email = document.getElementById('parrainEmail').value.trim();
    const lastName = document.getElementById('parrainLastName').value.trim();
    const firstName = document.getElementById('parrainFirstName').value.trim();
    const birthDate = document.getElementById('parrainBirthDate').value;
    const countryCode = document.getElementById('parrainCountry').value.trim().toUpperCase();
    const phone = document.getElementById('parrainPhone').value.trim();
    const pseudo = document.getElementById('parrainPseudo').value.trim();
    const isActive = document.getElementById('parrainStatus').value === 'true';

    if (!hubisoccerId || !email || !lastName || !firstName) {
        showToast('Les champs ID, email, nom et prénom sont obligatoires.', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            hubisoccer_id: hubisoccerId,
            email: email,
            last_name: lastName,
            first_name: firstName,
            full_name: firstName + ' ' + lastName,
            display_name: firstName + ' ' + lastName,
            birth_date: birthDate || null,
            country_code: countryCode || null,
            phone: phone,
            pseudo: pseudo,
            is_active: isActive,
            role_code: 'PARRAIN'
        };

        if (id) {
            // Modification
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_profiles')
                .update(payload)
                .eq('hubisoccer_id', id);
            if (error) throw error;
            showToast('Parrain modifié avec succès', 'success');
        } else {
            // Vérifier si l'ID existe déjà
            const { data: existing } = await supabaseClient
                .from('supabaseAuthPrive_profiles')
                .select('hubisoccer_id')
                .eq('hubisoccer_id', hubisoccerId)
                .maybeSingle();
            if (existing) {
                throw new Error('Cet ID HubISoccer est déjà utilisé.');
            }
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_profiles')
                .insert([payload]);
            if (error) throw error;
            showToast('Parrain ajouté avec succès', 'success');
        }
        closeParrainModal();
        loadParrains();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});
/* FIN : MODAL AJOUT / MODIFICATION */

/* DEBUT : SUPPRESSION */
function confirmDeleteParrain(id) {
    currentAction = { type: 'deleteParrain', id: id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement ce parrain ?';
    document.getElementById('confirmModal').style.display = 'flex';
}

async function deleteParrain(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .delete()
            .eq('hubisoccer_id', id);
        if (error) throw error;
        showToast('Parrain supprimé', 'success');
        closeConfirmModal();
        loadParrains();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentAction = null;
}

function executeAction() {
    if (!currentAction) return;
    if (currentAction.type === 'deleteParrain') {
        deleteParrain(currentAction.id);
    }
}
/* FIN : SUPPRESSION */

/* DEBUT : UI SIDEBAR, MENU, LOGOUT */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeSidebar');

    function open() {
        if (sb) sb.classList.add('active');
        if (ov) ov.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) sb.classList.remove('active');
        if (ov) ov.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}

function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) return;
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html?role=ADMIN';
        });
    });
}
/* FIN : UI SIDEBAR, MENU, LOGOUT */

/* DEBUT : ÉVÉNEMENTS */
document.getElementById('searchInput')?.addEventListener('input', renderParrains);
document.getElementById('refreshBtn')?.addEventListener('click', loadParrains);
document.getElementById('refreshBtn2')?.addEventListener('click', loadParrains);
document.getElementById('addParrainBtn')?.addEventListener('click', function() { openParrainModal(null); });
/* FIN : ÉVÉNEMENTS */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    await loadParrains();

    window.closeParrainModal = closeParrainModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.confirmDeleteParrain = confirmDeleteParrain;
    window.openParrainModal = openParrainModal;

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */