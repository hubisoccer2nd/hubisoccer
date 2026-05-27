/* ============================================================
   HubISoccer — admin-parrain-mentorat.js
   Administration Parrains · Gestion du Mentorat
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
let mentoratData = [];
let currentAction = null;
const TABLE_MENTORAT = 'supabaseAuthPrive_parrain_mentorat';
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
        const select = document.getElementById('mentoratParrainId');
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

/* DEBUT : CHARGEMENT DES SESSIONS */
async function loadMentorat() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_MENTORAT)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        mentoratData = data || [];
        renderMentorat();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des sessions', 'error');
    } finally {
        showLoader(false);
    }
}

function renderMentorat() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const modeFilter = document.getElementById('filterMode')?.value || '';

    const filtered = mentoratData.filter(function(s) {
        const matchesSearch = (s.nom_protege_session || '').toLowerCase().includes(search) ||
                              (s.date_session || '').toLowerCase().includes(search) ||
                              (s.mode_session || '').toLowerCase().includes(search);
        const matchesMode = !modeFilter || s.mode_session === modeFilter;
        return matchesSearch && matchesMode;
    });

    const container = document.getElementById('mentoratList');
    if (!container) return;
    container.innerHTML = '';

    if (!filtered.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = 'Aucune session trouvée.';
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(function(s) {
        const card = document.createElement('div');
        card.className = 'mentorat-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'mentorat-info';
        infoDiv.innerHTML = '<div class="mentorat-protege">' + (s.nom_protege_session || 'Sans nom') + '</div>' +
                            '<div class="mentorat-date">' + (s.date_session || 'Date non définie') + ' · ' + (s.duree_session || '0') + ' min</div>' +
                            '<div class="mentorat-mode">' + (s.mode_session || 'Mode non défini') + ' · ' + (s.theme_session || 'Thème non défini') + '</div>' +
                            '<div class="mentorat-parrain">Parrain : ' + (s.parrain_id || '—') + '</div>';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mentorat-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMentoratModal(s);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteMentorat(s.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT DES SESSIONS */

/* DEBUT : STATISTIQUES */
function updateStats() {
    document.getElementById('totalCount').textContent = mentoratData.length;

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const moisCount = mentoratData.filter(function(s) {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('moisCount').textContent = moisCount;

    const modesUniques = new Set(mentoratData.map(function(s) { return s.mode_session; }).filter(Boolean));
    document.getElementById('modesCount').textContent = modesUniques.size;

    const themesUniques = new Set(mentoratData.map(function(s) { return s.theme_session; }).filter(Boolean));
    document.getElementById('themesCount').textContent = themesUniques.size;
}
/* FIN : STATISTIQUES */

/* DEBUT : MODALE AJOUT / MODIFICATION */
function openMentoratModal(session) {
    document.getElementById('mentoratId').value = session ? session.id : '';
    document.getElementById('mentoratProtege').value = session ? (session.nom_protege_session || '') : '';
    document.getElementById('mentoratDate').value = session ? (session.date_session || '') : '';
    document.getElementById('mentoratDuree').value = session ? (session.duree_session || 0) : 0;
    document.getElementById('mentoratMode').value = session ? (session.mode_session || '') : '';
    document.getElementById('mentoratTheme').value = session ? (session.theme_session || '') : '';
    document.getElementById('mentoratObjectifs').value = session ? (session.objectifs_session || '') : '';
    document.getElementById('mentoratProchaine').value = session ? (session.prochaine_session || '') : '';
    document.getElementById('mentoratParrainId').value = session ? (session.parrain_id || '') : '';
    document.getElementById('mentoratResume').value = session ? (session.resume_session || '') : '';

    document.getElementById('mentoratModalTitle').textContent = session ? 'Modifier la session' : 'Ajouter une session';
    document.getElementById('mentoratModal').style.display = 'flex';
}

function closeMentoratModal() {
    document.getElementById('mentoratModal').style.display = 'none';
}

document.getElementById('mentoratForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('mentoratId').value;
    const protege = document.getElementById('mentoratProtege').value.trim();
    const date = document.getElementById('mentoratDate').value;
    const duree = document.getElementById('mentoratDuree').value;
    const mode = document.getElementById('mentoratMode').value;
    const theme = document.getElementById('mentoratTheme').value;
    const objectifs = document.getElementById('mentoratObjectifs').value;
    const prochaine = document.getElementById('mentoratProchaine').value;
    const parrainId = document.getElementById('mentoratParrainId').value;
    const resume = document.getElementById('mentoratResume').value.trim();

    if (!protege || !parrainId) {
        showToast('Le nom du protégé et le parrain associé sont obligatoires.', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            nom_protege_session: protege,
            date_session: date,
            duree_session: duree,
            mode_session: mode,
            theme_session: theme,
            objectifs_session: objectifs,
            prochaine_session: prochaine,
            parrain_id: parrainId,
            resume_session: resume,
            updated_at: new Date().toISOString()
        };

        if (id) {
            const { error } = await supabaseClient
                .from(TABLE_MENTORAT)
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Session modifiée avec succès', 'success');
        } else {
            payload.created_at = new Date().toISOString();
            const { error } = await supabaseClient
                .from(TABLE_MENTORAT)
                .insert([payload]);
            if (error) throw error;
            showToast('Session ajoutée avec succès', 'success');
        }
        closeMentoratModal();
        loadMentorat();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});
/* FIN : MODALE AJOUT / MODIFICATION */

/* DEBUT : SUPPRESSION */
function confirmDeleteMentorat(id) {
    currentAction = { type: 'deleteMentorat', id: id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement cette session ?';
    document.getElementById('confirmModal').style.display = 'flex';
}

async function deleteMentorat(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from(TABLE_MENTORAT)
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Session supprimée', 'success');
        closeConfirmModal();
        loadMentorat();
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
    if (currentAction.type === 'deleteMentorat') {
        deleteMentorat(currentAction.id);
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
document.getElementById('searchInput')?.addEventListener('input', renderMentorat);
document.getElementById('filterMode')?.addEventListener('change', renderMentorat);
document.getElementById('refreshBtn')?.addEventListener('click', loadMentorat);
document.getElementById('refreshBtn2')?.addEventListener('click', loadMentorat);
document.getElementById('addMentoratBtn')?.addEventListener('click', function() { openMentoratModal(null); });
/* FIN : ÉVÉNEMENTS */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    await loadParrains();
    await loadMentorat();

    window.closeMentoratModal = closeMentoratModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.confirmDeleteMentorat = confirmDeleteMentorat;
    window.openMentoratModal = openMentoratModal;

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */