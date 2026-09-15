/* ============================================================
   HubISoccer — admin-parrain-proteges.js
   Administration Parrains · Gestion des Protégés
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
let parrainsList = [];
let protegesData = [];
let currentAction = null;
const TABLE_PROTEGES = 'supabaseAuthPrive_parrain_proteges';
const TABLE_PARRAINS = 'supabaseAuthPrive_profiles';
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
            window.location.href = '../../../authprive/users/login.html?role=ADMIN';
            return false;
        }
        const { data: profile, error: profileError } = await supabaseClient
            .from(TABLE_PARRAINS)
            .select('role_code, full_name, display_name, avatar_url')
            .eq('auth_uuid', user.id)
            .single();
        if (profileError || !profile) {
            window.location.href = '../../../authprive/users/login.html?role=ADMIN';
            return false;
        }
        if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
            showToast('Accès réservé aux administrateurs', 'error');
            setTimeout(function() {
                window.location.href = '../../../authprive/users/login.html?role=ADMIN';
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
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_PARRAINS)
            .select('hubisoccer_id, full_name')
            .eq('role_code', 'PARRAIN')
            .order('full_name');
        if (error) throw error;
        parrainsList = data || [];
        const select = document.getElementById('protegeParrainId');
        if (select) {
            select.innerHTML = '<option value="">Sélectionner un parrain</option>' +
                parrainsList.map(function(p) {
                    return '<option value="' + p.hubisoccer_id + '">' + (p.full_name || p.hubisoccer_id) + '</option>';
                }).join('');
        }
    } catch (err) {
        console.error('Erreur chargement parrains:', err);
    }
}
/* FIN : CHARGEMENT DES PARRAINS */

/* DEBUT : CHARGEMENT DES PROTÉGÉS */
async function loadProteges() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_PROTEGES)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        protegesData = data || [];
        renderProteges();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des protégés', 'error');
    } finally {
        showLoader(false);
    }
}

function renderProteges() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';

    const filtered = protegesData.filter(function(p) {
        const matchesSearch = (p.nom_protege || '').toLowerCase().includes(search) ||
                              (p.prenom_protege || '').toLowerCase().includes(search) ||
                              (p.club_protege || '').toLowerCase().includes(search);
        const matchesStatus = !statusFilter || p.statut_protege === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const container = document.getElementById('protegesList');
    if (!container) return;
    container.innerHTML = '';

    if (!filtered.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = 'Aucun protégé trouvé.';
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(function(p) {
        const card = document.createElement('div');
        card.className = 'protege-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'protege-info';
        infoDiv.innerHTML = '<div class="protege-name">' + (p.nom_protege || 'Sans nom') + ' ' + (p.prenom_protege || '') + '</div>' +
                            '<div class="protege-role">' + (p.role_protege || 'Rôle non défini') + '</div>' +
                            '<div class="protege-club">' + (p.club_protege || '—') + '</div>' +
                            '<div class="protege-parrain">Parrain : ' + (p.parrain_id || '—') + '</div>';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'protege-status ' + (p.statut_protege === 'En cours' ? 'active' : (p.statut_protege === 'Abandonné' ? 'inactive' : ''));
        statusDiv.textContent = p.statut_protege || '—';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'protege-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openProtegeModal(p);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteProtege(p.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(infoDiv);
        card.appendChild(statusDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT DES PROTÉGÉS */

/* DEBUT : STATISTIQUES */
function updateStats() {
    document.getElementById('totalCount').textContent = protegesData.length;
    document.getElementById('enCoursCount').textContent = protegesData.filter(function(p) { return p.statut_protege === 'En cours'; }).length;
    document.getElementById('diplomesCount').textContent = protegesData.filter(function(p) { return p.statut_protege === 'Diplômé' || p.statut_protege === 'Pro'; }).length;
    document.getElementById('abandonCount').textContent = protegesData.filter(function(p) { return p.statut_protege === 'Abandonné'; }).length;
}
/* FIN : STATISTIQUES */

/* DEBUT : MODALE AJOUT / MODIFICATION */
function openProtegeModal(protege) {
    document.getElementById('protegeId').value = protege ? protege.id : '';
    document.getElementById('protegeNom').value = protege ? (protege.nom_protege || '') : '';
    document.getElementById('protegePrenom').value = protege ? (protege.prenom_protege || '') : '';
    document.getElementById('protegeRole').value = protege ? (protege.role_protege || '') : '';
    document.getElementById('protegeClub').value = protege ? (protege.club_protege || '') : '';
    document.getElementById('protegeStatut').value = protege ? (protege.statut_protege || 'En cours') : 'En cours';
    document.getElementById('protegeDebut').value = protege ? (protege.debut_parrainage || '') : '';
    document.getElementById('protegeBourse').value = protege ? (protege.montant_bourse || '') : '';
    document.getElementById('protegeNiveau').value = protege ? (protege.niveau_scolaire || '') : '';
    document.getElementById('protegeParrainId').value = protege ? (protege.parrain_id || '') : '';
    document.getElementById('protegeResultats').value = protege ? (protege.resultats_protege || '') : '';
    document.getElementById('protegeNotes').value = protege ? (protege.notes_protege || '') : '';

    document.getElementById('protegeModalTitle').textContent = protege ? 'Modifier le protégé' : 'Ajouter un protégé';
    document.getElementById('protegeModal').style.display = 'flex';
}

function closeProtegeModal() {
    document.getElementById('protegeModal').style.display = 'none';
}

document.getElementById('protegeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('protegeId').value;
    const nom = document.getElementById('protegeNom').value.trim();
    const prenom = document.getElementById('protegePrenom').value.trim();
    const role = document.getElementById('protegeRole').value.trim();
    const club = document.getElementById('protegeClub').value.trim();
    const statut = document.getElementById('protegeStatut').value;
    const debut = document.getElementById('protegeDebut').value;
    const bourse = document.getElementById('protegeBourse').value;
    const niveau = document.getElementById('protegeNiveau').value.trim();
    const parrainId = document.getElementById('protegeParrainId').value;
    const resultats = document.getElementById('protegeResultats').value.trim();
    const notes = document.getElementById('protegeNotes').value.trim();

    if (!nom || !parrainId) {
        showToast('Le nom du protégé et le parrain associé sont obligatoires.', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            nom_protege: nom,
            prenom_protege: prenom,
            role_protege: role,
            club_protege: club,
            statut_protege: statut,
            debut_parrainage: debut,
            montant_bourse: bourse,
            niveau_scolaire: niveau,
            parrain_id: parrainId,
            resultats_protege: resultats,
            notes_protege: notes,
            updated_at: new Date().toISOString()
        };

        if (id) {
            const { error } = await supabaseClient
                .from(TABLE_PROTEGES)
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Protégé modifié avec succès', 'success');
        } else {
            payload.created_at = new Date().toISOString();
            const { error } = await supabaseClient
                .from(TABLE_PROTEGES)
                .insert([payload]);
            if (error) throw error;
            showToast('Protégé ajouté avec succès', 'success');
        }
        closeProtegeModal();
        loadProteges();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});
/* FIN : MODALE AJOUT / MODIFICATION */

/* DEBUT : SUPPRESSION */
function confirmDeleteProtege(id) {
    currentAction = { type: 'deleteProtege', id: id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement ce protégé ?';
    document.getElementById('confirmModal').style.display = 'flex';
}

async function deleteProtege(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from(TABLE_PROTEGES)
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Protégé supprimé', 'success');
        closeConfirmModal();
        loadProteges();
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
    if (currentAction.type === 'deleteProtege') {
        deleteProtege(currentAction.id);
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
            window.location.href = '../../../authprive/users/login.html?role=ADMIN';
        });
    });
}
/* FIN : UI SIDEBAR, MENU, LOGOUT */

/* DEBUT : ÉVÉNEMENTS */
document.getElementById('searchInput')?.addEventListener('input', renderProteges);
document.getElementById('filterStatus')?.addEventListener('change', renderProteges);
document.getElementById('refreshBtn')?.addEventListener('click', loadProteges);
document.getElementById('refreshBtn2')?.addEventListener('click', loadProteges);
document.getElementById('addProtegeBtn')?.addEventListener('click', function() { openProtegeModal(null); });
/* FIN : ÉVÉNEMENTS */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    await loadParrains();
    await loadProteges();

    window.closeProtegeModal = closeProtegeModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.confirmDeleteProtege = confirmDeleteProtege;
    window.openProtegeModal = openProtegeModal;

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */