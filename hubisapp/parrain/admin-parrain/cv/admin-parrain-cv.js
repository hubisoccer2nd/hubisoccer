/* ============================================================
   HubISoccer — admin-parrain-cv.js
   Administration Parrains · Gestion des CV
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
let cvData = [];
let currentAction = null;
const TABLE_CV = 'supabaseAuthPrive_cv_profiles';
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

/* DEBUT : CHARGEMENT DES CV */
async function loadCVs() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_CV)
            .select('*, parrain:user_id ( hubisoccer_id, full_name )')
            .eq('role_code', 'PARRAIN')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        cvData = data || [];
        renderCVs();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des CV', 'error');
    } finally {
        showLoader(false);
    }
}

function renderCVs() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';

    const filtered = cvData.filter(function(cv) {
        const parrain = cv.parrain || {};
        const matchesSearch = (parrain.full_name || '').toLowerCase().includes(search);
        const matchesStatus = !statusFilter || cv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const container = document.getElementById('cvList');
    if (!container) return;
    container.innerHTML = '';

    if (!filtered.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = 'Aucun CV trouvé.';
        container.appendChild(emptyMsg);
        return;
    }

    const statusLabels = {
        draft: 'Brouillon',
        submitted: 'Soumis',
        approved: 'Validé',
        rejected: 'Rejeté'
    };

    filtered.forEach(function(cv) {
        const parrain = cv.parrain || {};
        const statusText = statusLabels[cv.status] || cv.status;
        const statusClass = cv.status === 'approved' ? 'approved' : (cv.status === 'rejected' ? 'rejected' : 'pending');

        const card = document.createElement('div');
        card.className = 'cv-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'cv-info';
        infoDiv.innerHTML = '<div class="cv-parrain-name">' + (parrain.full_name || 'Inconnu') + '</div>' +
                            '<div class="cv-role">Parrain</div>' +
                            '<div class="cv-date">Mis à jour le ' + new Date(cv.updated_at || cv.created_at).toLocaleDateString('fr-FR') + '</div>';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'cv-status ' + statusClass;
        statusDiv.textContent = statusText;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'cv-actions';

        // Bouton Voir détails
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-action view';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            viewCV(cv.id);
        });

        // Boutons de changement de statut
        if (cv.status !== 'approved') {
            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn-action approve';
            approveBtn.innerHTML = '<i class="fas fa-check"></i>';
            approveBtn.title = 'Valider le CV';
            approveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updateCVStatus(cv.id, 'approved');
            });
            actionsDiv.appendChild(approveBtn);
        }

        if (cv.status !== 'rejected') {
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn-action reject';
            rejectBtn.innerHTML = '<i class="fas fa-times"></i>';
            rejectBtn.title = 'Rejeter le CV';
            rejectBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updateCVStatus(cv.id, 'rejected');
            });
            actionsDiv.appendChild(rejectBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteCV(cv.id);
        });

        actionsDiv.appendChild(viewBtn);
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(infoDiv);
        card.appendChild(statusDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT DES CV */

/* DEBUT : ACTIONS CV */
async function viewCV(cvId) {
    const cv = cvData.find(function(c) { return c.id === cvId; });
    if (!cv) { showToast('CV introuvable', 'error'); return; }

    const parrain = cv.parrain || {};
    let cvJson = {};
    try { cvJson = cv.cv_json ? JSON.parse(cv.cv_json) : {}; } catch(e) {}

    document.getElementById('cvDetailBody').innerHTML = `
        <div class="cv-detail-grid">
            <div><strong>Parrain :</strong> ${parrain.full_name || 'Inconnu'}</div>
            <div><strong>Statut :</strong> ${cv.status}</div>
            <div><strong>Date de création :</strong> ${new Date(cv.created_at).toLocaleDateString('fr-FR')}</div>
            <div><strong>Dernière modification :</strong> ${new Date(cv.updated_at).toLocaleDateString('fr-FR')}</div>
        </div>
        <div style="margin-top:16px;">
            <h3>Contenu du CV (JSON)</h3>
            <pre style="background:var(--bg-card2);padding:12px;border-radius:8px;max-height:300px;overflow:auto;">${JSON.stringify(cvJson, null, 2)}</pre>
        </div>
    `;

    const actionsDiv = document.getElementById('cvDetailActions');
    actionsDiv.innerHTML = `
        <button class="btn-cancel" onclick="closeCvDetailModal()">Fermer</button>
        ${cv.status !== 'approved' ? `<button class="btn-confirm" onclick="updateCVStatus(${cv.id}, 'approved'); closeCvDetailModal()">Valider</button>` : ''}
        ${cv.status !== 'rejected' ? `<button class="btn-reject" onclick="updateCVStatus(${cv.id}, 'rejected'); closeCvDetailModal()">Rejeter</button>` : ''}
        <button class="btn-reject" onclick="confirmDeleteCV(${cv.id}); closeCvDetailModal()">Supprimer</button>
    `;

    document.getElementById('cvDetailModal').style.display = 'flex';
}

function closeCvDetailModal() {
    document.getElementById('cvDetailModal').style.display = 'none';
}

async function updateCVStatus(cvId, newStatus) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from(TABLE_CV)
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', cvId);
        if (error) throw error;
        showToast('Statut du CV mis à jour', 'success');
        loadCVs();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
}

async function deleteCV(cvId) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from(TABLE_CV)
            .delete()
            .eq('id', cvId);
        if (error) throw error;
        showToast('CV supprimé', 'success');
        closeConfirmModal();
        loadCVs();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
}

function confirmDeleteCV(id) {
    currentAction = { type: 'deleteCV', id: id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement ce CV ?';
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentAction = null;
}

function executeAction() {
    if (!currentAction) return;
    if (currentAction.type === 'deleteCV') {
        deleteCV(currentAction.id);
    }
}
/* FIN : ACTIONS CV */

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
document.getElementById('searchInput')?.addEventListener('input', renderCVs);
document.getElementById('filterStatus')?.addEventListener('change', renderCVs);
document.getElementById('refreshBtn')?.addEventListener('click', loadCVs);
document.getElementById('refreshBtn2')?.addEventListener('click', loadCVs);
/* FIN : ÉVÉNEMENTS */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    await loadCVs();

    window.closeCvDetailModal = closeCvDetailModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.confirmDeleteCV = confirmDeleteCV;
    window.updateCVStatus = updateCVStatus;
    window.viewCV = viewCV;

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */