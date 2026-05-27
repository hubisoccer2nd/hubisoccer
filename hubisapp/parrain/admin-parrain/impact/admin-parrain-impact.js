/* ============================================================
   HubISoccer — admin-parrain-impact.js
   Administration Parrains · Gestion de l'Impact
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
let impactData = [];
let currentAction = null;
const TABLE_IMPACT = 'supabaseAuthPrive_parrain_impact';
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
        const select = document.getElementById('impactParrainId');
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

/* DEBUT : CHARGEMENT DES IMPACTS */
async function loadImpacts() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from(TABLE_IMPACT)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        impactData = data || [];
        renderImpacts();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des impacts', 'error');
    } finally {
        showLoader(false);
    }
}

function renderImpacts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const domaineFilter = document.getElementById('filterDomaines')?.value || '';

    const filtered = impactData.filter(function(p) {
        const matchesSearch = (p.periode_impact || '').toLowerCase().includes(search) ||
                              (p.domaines_impact || '').toLowerCase().includes(search);
        const matchesDomaine = !domaineFilter || p.domaines_impact === domaineFilter;
        return matchesSearch && matchesDomaine;
    });

    const container = document.getElementById('impactList');
    if (!container) return;
    container.innerHTML = '';

    if (!filtered.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = 'Aucune entrée d\'impact trouvée.';
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(function(p) {
        const card = document.createElement('div');
        card.className = 'impact-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'impact-info';
        infoDiv.innerHTML = '<div class="impact-periode">' + (p.periode_impact || 'Sans période') + '</div>' +
                            '<div class="impact-domaines">' + (p.domaines_impact || 'Domaine non défini') + '</div>' +
                            '<div class="impact-stats">Protégés : ' + (p.nb_proteges_impact || 0) + ' | Réussites : ' + (p.nb_reussites_impact || 0) + ' | Score : ' + (p.score_impact || 0) + '/10</div>' +
                            '<div class="impact-parrain">Parrain : ' + (p.parrain_id || '—') + '</div>';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'impact-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-action edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openImpactModal(p);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmDeleteImpact(p.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT DES IMPACTS */

/* DEBUT : STATISTIQUES */
function updateStats() {
    document.getElementById('totalCount').textContent = impactData.length;

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const moisCount = impactData.filter(function(p) {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
    }).length;
    document.getElementById('moisCount').textContent = moisCount;

    const domainesUniques = new Set(impactData.map(function(p) { return p.domaines_impact; }).filter(Boolean));
    document.getElementById('domainesCount').textContent = domainesUniques.size;

    const scores = impactData.filter(function(p) { return p.score_impact > 0; }).map(function(p) { return parseInt(p.score_impact) || 0; });
    const scoreMoyen = scores.length ? (scores.reduce(function(a, b) { return a + b; }, 0) / scores.length).toFixed(1) : '—';
    document.getElementById('scoreMoyen').textContent = scoreMoyen;
}
/* FIN : STATISTIQUES */

/* DEBUT : MODALE AJOUT / MODIFICATION */
function openImpactModal(impact) {
    document.getElementById('impactId').value = impact ? impact.id : '';
    document.getElementById('impactParrainId').value = impact ? (impact.parrain_id || '') : '';
    document.getElementById('impactPeriode').value = impact ? (impact.periode_impact || '') : '';
    document.getElementById('impactNbProteges').value = impact ? (impact.nb_proteges_impact || 0) : 0;
    document.getElementById('impactNbReussites').value = impact ? (impact.nb_reussites_impact || 0) : 0;
    document.getElementById('impactMontant').value = impact ? (impact.montant_total_impact || 0) : 0;
    document.getElementById('impactNbBourses').value = impact ? (impact.nb_bourses_impact || 0) : 0;
    document.getElementById('impactNbSessions').value = impact ? (impact.nb_sessions_impact || 0) : 0;
    document.getElementById('impactScore').value = impact ? (impact.score_impact || 0) : 0;
    document.getElementById('impactDomaines').value = impact ? (impact.domaines_impact || '') : '';
    document.getElementById('impactTemoignage').value = impact ? (impact.temoignage_impact || '') : '';

    document.getElementById('impactModalTitle').textContent = impact ? 'Modifier l\'entrée d\'impact' : 'Ajouter une entrée d\'impact';
    document.getElementById('impactModal').style.display = 'flex';
}

function closeImpactModal() {
    document.getElementById('impactModal').style.display = 'none';
}

document.getElementById('impactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('impactId').value;
    const parrainId = document.getElementById('impactParrainId').value;
    const periode = document.getElementById('impactPeriode').value.trim();
    const nbProteges = parseInt(document.getElementById('impactNbProteges').value) || 0;
    const nbReussites = parseInt(document.getElementById('impactNbReussites').value) || 0;
    const montant = parseFloat(document.getElementById('impactMontant').value) || 0;
    const nbBourses = parseInt(document.getElementById('impactNbBourses').value) || 0;
    const nbSessions = parseInt(document.getElementById('impactNbSessions').value) || 0;
    const score = parseInt(document.getElementById('impactScore').value) || 0;
    const domaines = document.getElementById('impactDomaines').value;
    const temoignage = document.getElementById('impactTemoignage').value.trim();

    if (!parrainId) {
        showToast('Le parrain associé est obligatoire.', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            parrain_id: parrainId,
            periode_impact: periode,
            nb_proteges_impact: nbProteges,
            nb_reussites_impact: nbReussites,
            montant_total_impact: montant,
            nb_bourses_impact: nbBourses,
            nb_sessions_impact: nbSessions,
            score_impact: score,
            domaines_impact: domaines,
            temoignage_impact: temoignage,
            updated_at: new Date().toISOString()
        };

        if (id) {
            const { error } = await supabaseClient
                .from(TABLE_IMPACT)
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Entrée modifiée avec succès', 'success');
        } else {
            payload.created_at = new Date().toISOString();
            const { error } = await supabaseClient
                .from(TABLE_IMPACT)
                .insert([payload]);
            if (error) throw error;
            showToast('Entrée ajoutée avec succès', 'success');
        }
        closeImpactModal();
        loadImpacts();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});
/* FIN : MODALE AJOUT / MODIFICATION */

/* DEBUT : SUPPRESSION */
function confirmDeleteImpact(id) {
    currentAction = { type: 'deleteImpact', id: id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement cette entrée d\'impact ?';
    document.getElementById('confirmModal').style.display = 'flex';
}

async function deleteImpact(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from(TABLE_IMPACT)
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Entrée supprimée', 'success');
        closeConfirmModal();
        loadImpacts();
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
    if (currentAction.type === 'deleteImpact') {
        deleteImpact(currentAction.id);
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
document.getElementById('searchInput')?.addEventListener('input', renderImpacts);
document.getElementById('filterDomaines')?.addEventListener('change', renderImpacts);
document.getElementById('refreshBtn')?.addEventListener('click', loadImpacts);
document.getElementById('refreshBtn2')?.addEventListener('click', loadImpacts);
document.getElementById('addImpactBtn')?.addEventListener('click', function() { openImpactModal(null); });
/* FIN : ÉVÉNEMENTS */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    await loadParrains();
    await loadImpacts();

    window.closeImpactModal = closeImpactModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.confirmDeleteImpact = confirmDeleteImpact;
    window.openImpactModal = openImpactModal;

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */