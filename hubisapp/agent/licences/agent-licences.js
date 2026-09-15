/* ============================================================
   HubISoccer -- agent-licences.js
   Page Licence FIFA - Espace Agent FIFA
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles                    -> partagee
   - supabaseAuthPrive_agent_scouting               -> lecture seule
     (le certificat affiche les donnees deja saisies dans
     Verification du Statut -- aucune ressaisie)
   - supabaseAuthPrive_agent_licence_historique     -> Ame
   - supabaseAuthPrive_agent_formation_continue     -> Esprit
     (SQL : agent-licences-table.sql, sans RLS)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE   = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE   = 'supabaseAuthPrive_agent_scouting';
const HISTORIQUE_TABLE = 'supabaseAuthPrive_agent_licence_historique';
const FORMATION_TABLE  = 'supabaseAuthPrive_agent_formation_continue';

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser      = null;
let agentProfile     = null;
let scoutingData       = null;
let allHistorique       = [];
let allFormations        = [];
let editingHistId         = null;
let editingFormId          = null;

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 5. TOAST (duree 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) { type = 'info'; }
    if (!duration) { duration = 30000; }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) { el.textContent = (value !== null && value !== undefined && value !== '') ? value : '\u2014'; }
}
function getInitials(name) {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) { return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); }
    return name.charAt(0).toUpperCase();
}
function escapeHtml(str) {
    if (!str) { return ''; }
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function formatDateFr(iso) {
    if (!iso) { return '\u2014'; }
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function genererIdLocal() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

const STATUT_LABELS_HIST = { actif: 'Actif', expire: 'Expire', renouvele: 'Renouvele' };

/* ---------- 7. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 8. CHARGEMENT PROFIL AGENT ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    agentProfile = data;
    setText('userName', agentProfile.full_name || 'Agent FIFA');
    updateNavbarAvatar();
    return agentProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = agentProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(agentProfile?.full_name || 'A');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. DONNEES DE LICENCE (deja saisies, lecture seule ici) ---------- */
async function loadScoutingData() {
    if (!agentProfile) { return; }
    const { data } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .maybeSingle();
    scoutingData = data || null;
}

/* ---------- 10. CERTIFICAT (CORPS) ---------- */
function renderCertificat() {
    setText('certNom', agentProfile?.full_name || '\u2014');
    setText('certId', agentProfile?.hubisoccer_id || '\u2014');
    setText('certNumero', scoutingData?.numero_licence_fifa || '\u2014');
    setText('certDate', scoutingData?.date_obtention_licence ? formatDateFr(scoutingData.date_obtention_licence) : '\u2014');
    setText('certExpiration', scoutingData?.expire_licence ? formatDateFr(scoutingData.expire_licence) : '\u2014');
    setText('certCabinet', scoutingData?.nom_cabinet || '\u2014');
    setText('certPays', scoutingData?.pays_exercice || '\u2014');
}

/* ---------- 11. STATS + ALERTES ---------- */
function renderStatsEtAlertes() {
    const expireLicence = scoutingData?.expire_licence;
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    let statut = 'Non renseignee';
    let joursRestants = '\u2014';
    const alerts = [];

    if (expireLicence) {
        const exp = new Date(expireLicence);
        const diffJours = Math.round((exp - aujourdHui) / 86400000);
        joursRestants = diffJours >= 0 ? diffJours : 0;

        if (diffJours < 0) {
            statut = 'Expiree';
            alerts.push({ level: 'danger', icon: 'fa-triangle-exclamation', text: 'Votre licence FIFA a expire le ' + formatDateFr(expireLicence) + ' -- renouvelez-la et ajoutez le renouvellement ci-dessous.' });
        } else if (diffJours <= 60) {
            statut = 'Active';
            alerts.push({ level: 'warning', icon: 'fa-clock', text: 'Votre licence FIFA expire le ' + formatDateFr(expireLicence) + ' (' + diffJours + ' j restants).' });
        } else {
            statut = 'Active';
        }
    }

    setText('statStatut', statut);
    setText('statJours', joursRestants);
    setText('statRenouv', allHistorique.length);

    const totalHeures = allFormations.reduce(function(sum, f) { return sum + (Number(f.heures) || 0); }, 0);
    setText('statFormation', totalHeures);

    const list = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (list) {
        list.querySelectorAll('.alert-item').forEach(function(a) { a.remove(); });
        if (alerts.length === 0) {
            if (empty) { empty.style.display = 'flex'; }
        } else {
            if (empty) { empty.style.display = 'none'; }
            alerts.forEach(function(a) {
                const el = document.createElement('div');
                el.className = 'alert-item ' + a.level;
                el.innerHTML = '<i class="fas ' + a.icon + '"></i><span>' + a.text + '</span>';
                list.appendChild(el);
            });
        }
    }
}

/* ================================================================
   AME -- HISTORIQUE DES RENOUVELLEMENTS
   ================================================================ */
async function loadHistorique() {
    if (!agentProfile) { return; }
    const { data, error } = await supabaseClient
        .from(HISTORIQUE_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .order('date_debut', { ascending: false });
    if (error) {
        console.warn('Table ' + HISTORIQUE_TABLE + ' absente :', error.message);
        allHistorique = [];
        return;
    }
    allHistorique = data || [];
}

function renderHistorique() {
    const container = document.getElementById('historiqueTimeline');
    const empty = document.getElementById('historiqueEmpty');
    if (!container) { return; }

    container.querySelectorAll('.timeline-item').forEach(function(el) { el.remove(); });

    if (allHistorique.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    allHistorique.forEach(function(h) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        const periode = h.date_fin ? formatDateFr(h.date_debut) + ' au ' + formatDateFr(h.date_fin) : 'Depuis le ' + formatDateFr(h.date_debut);
        item.innerHTML =
            '<div class="timeline-card">' +
                '<div class="timeline-head">' +
                    '<div class="timeline-titre">' + escapeHtml(h.numero_licence) + '</div>' +
                    '<span class="timeline-badge ' + h.statut + '">' + STATUT_LABELS_HIST[h.statut] + '</span>' +
                '</div>' +
                '<div class="timeline-meta">' + periode + (h.organisme_emetteur ? ' &middot; ' + escapeHtml(h.organisme_emetteur) : '') + '</div>' +
                (h.notes ? '<div class="timeline-desc">' + escapeHtml(h.notes) + '</div>' : '') +
                '<div class="timeline-actions">' +
                    '<button class="btn-edit" data-id="' + h.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-delete" data-id="' + h.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
                '</div>' +
            '</div>';
        container.appendChild(item);
    });

    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerHistDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerHistorique(btn.dataset.id); });
    });
}

function chargerHistDansFormulaire(id) {
    const h = allHistorique.find(function(x) { return String(x.id) === String(id); });
    if (!h) { return; }
    editingHistId = h.id;
    document.getElementById('histNumero').value = h.numero_licence || '';
    document.getElementById('histOrganisme').value = h.organisme_emetteur || '';
    document.getElementById('histDateDebut').value = h.date_debut || '';
    document.getElementById('histDateFin').value = h.date_fin || '';
    document.getElementById('histStatut').value = h.statut || 'actif';
    document.getElementById('histNotes').value = h.notes || '';
    document.getElementById('histFormTitle').innerHTML = '<i class="fas fa-pen"></i> Modifier ce renouvellement';
    document.getElementById('histFormTitle')?.scrollIntoView({ behavior: 'smooth' });
}

function resetFormulaireHist() {
    editingHistId = null;
    document.getElementById('histNumero').value = '';
    document.getElementById('histOrganisme').value = '';
    document.getElementById('histDateDebut').value = '';
    document.getElementById('histDateFin').value = '';
    document.getElementById('histStatut').value = 'actif';
    document.getElementById('histNotes').value = '';
    document.getElementById('histFormTitle').innerHTML = '<i class="fas fa-history"></i> Ame -- Ajouter un renouvellement';
}

async function enregistrerHistorique() {
    const numero = (document.getElementById('histNumero')?.value || '').trim();
    const dateDebut = document.getElementById('histDateDebut')?.value || '';
    if (!numero) { showToast('Le numero de licence est obligatoire.', 'warning'); return; }
    if (!dateDebut) { showToast('La date de debut est obligatoire.', 'warning'); return; }

    const payload = {
        agent_id            : agentProfile.hubisoccer_id,
        numero_licence       : numero,
        organisme_emetteur    : (document.getElementById('histOrganisme')?.value || '').trim() || null,
        date_debut            : dateDebut,
        date_fin              : document.getElementById('histDateFin')?.value || null,
        statut                : document.getElementById('histStatut')?.value || 'actif',
        notes                 : (document.getElementById('histNotes')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingHistId) {
        const res = await supabaseClient.from(HISTORIQUE_TABLE).update(payload).eq('id', editingHistId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(HISTORIQUE_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast(editingHistId ? 'Renouvellement mis a jour.' : 'Renouvellement ajoute.', 'success');
    resetFormulaireHist();
    await loadHistorique();
    renderHistorique();
    renderStatsEtAlertes();
}

async function supprimerHistorique(id) {
    if (!confirm('Supprimer cette entree d\'historique ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(HISTORIQUE_TABLE).delete().eq('id', id);
    hideLoader();
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    if (String(editingHistId) === String(id)) { resetFormulaireHist(); }
    showToast('Entree supprimee.', 'info');
    await loadHistorique();
    renderHistorique();
    renderStatsEtAlertes();
}

/* ================================================================
   ESPRIT -- FORMATION CONTINUE
   ================================================================ */
async function loadFormations() {
    if (!agentProfile) { return; }
    const { data, error } = await supabaseClient
        .from(FORMATION_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .order('date_formation', { ascending: false });
    if (error) {
        console.warn('Table ' + FORMATION_TABLE + ' absente :', error.message);
        allFormations = [];
        return;
    }
    allFormations = data || [];
}

function renderFormations() {
    const container = document.getElementById('formationTimeline');
    const empty = document.getElementById('formationEmpty');
    if (!container) { return; }

    container.querySelectorAll('.timeline-item').forEach(function(el) { el.remove(); });

    if (allFormations.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    allFormations.forEach(function(f) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML =
            '<div class="timeline-card">' +
                '<div class="timeline-head">' +
                    '<div class="timeline-titre">' + escapeHtml(f.intitule) + '</div>' +
                    (f.heures ? '<span class="timeline-badge actif">' + f.heures + ' h</span>' : '') +
                '</div>' +
                '<div class="timeline-meta">' + formatDateFr(f.date_formation) + (f.organisme ? ' &middot; ' + escapeHtml(f.organisme) : '') + '</div>' +
                (f.notes ? '<div class="timeline-desc">' + escapeHtml(f.notes) + '</div>' : '') +
                '<div class="timeline-actions">' +
                    '<button class="btn-edit" data-id="' + f.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-delete" data-id="' + f.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
                '</div>' +
            '</div>';
        container.appendChild(item);
    });

    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerFormDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerFormation(btn.dataset.id); });
    });
}

function chargerFormDansFormulaire(id) {
    const f = allFormations.find(function(x) { return String(x.id) === String(id); });
    if (!f) { return; }
    editingFormId = f.id;
    document.getElementById('formIntitule').value = f.intitule || '';
    document.getElementById('formOrganisme').value = f.organisme || '';
    document.getElementById('formDate').value = f.date_formation || '';
    document.getElementById('formHeures').value = f.heures || '';
    document.getElementById('formNotes').value = f.notes || '';
    document.getElementById('formFormTitle').innerHTML = '<i class="fas fa-pen"></i> Modifier cette formation';
    document.getElementById('formFormTitle')?.scrollIntoView({ behavior: 'smooth' });
}

function resetFormulaireForm() {
    editingFormId = null;
    document.getElementById('formIntitule').value = '';
    document.getElementById('formOrganisme').value = '';
    document.getElementById('formDate').value = '';
    document.getElementById('formHeures').value = '';
    document.getElementById('formNotes').value = '';
    document.getElementById('formFormTitle').innerHTML = '<i class="fas fa-graduation-cap"></i> Esprit -- Ajouter une formation continue';
}

async function enregistrerFormation() {
    const intitule = (document.getElementById('formIntitule')?.value || '').trim();
    const dateFormation = document.getElementById('formDate')?.value || '';
    if (!intitule) { showToast('L\'intitule de la formation est obligatoire.', 'warning'); return; }
    if (!dateFormation) { showToast('La date de formation est obligatoire.', 'warning'); return; }

    const heuresRaw = document.getElementById('formHeures')?.value;

    const payload = {
        agent_id       : agentProfile.hubisoccer_id,
        intitule        : intitule,
        organisme        : (document.getElementById('formOrganisme')?.value || '').trim() || null,
        date_formation    : dateFormation,
        heures            : heuresRaw ? parseFloat(heuresRaw) : null,
        notes             : (document.getElementById('formNotes')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingFormId) {
        const res = await supabaseClient.from(FORMATION_TABLE).update(payload).eq('id', editingFormId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(FORMATION_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast(editingFormId ? 'Formation mise a jour.' : 'Formation ajoutee.', 'success');
    resetFormulaireForm();
    await loadFormations();
    renderFormations();
    renderStatsEtAlertes();
}

async function supprimerFormation(id) {
    if (!confirm('Supprimer cette formation ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(FORMATION_TABLE).delete().eq('id', id);
    hideLoader();
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    if (String(editingFormId) === String(id)) { resetFormulaireForm(); }
    showToast('Formation supprimee.', 'info');
    await loadFormations();
    renderFormations();
    renderStatsEtAlertes();
}

/* ---------- 12. IMPRESSION ---------- */
function initPrint() {
    const btn = document.getElementById('btnPrint');
    if (btn) { btn.addEventListener('click', function() { window.print(); }); }
}

/* ---------- 13. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) { return; }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 14. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() {
        if (sb) { sb.classList.add('active'); }
        if (ov) { ov.classList.add('active'); }
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) { sb.classList.remove('active'); }
        if (ov) { ov.classList.remove('active'); }
        document.body.style.overflow = '';
    }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) { return; }
        if (e.cancelable) { e.preventDefault(); }
        if (dx > 0 && sx < 40) { open(); } else if (dx < 0) { close(); }
    }, { passive: false });
}

/* ---------- 15. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 16. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }

    showLoader();
    await loadScoutingData();
    await loadHistorique();
    await loadFormations();
    hideLoader();

    renderCertificat();
    renderStatsEtAlertes();
    renderHistorique();
    renderFormations();

    initUserMenu();
    initSidebar();
    initPrint();

    const btnSaveHist = document.getElementById('btnSaveHist');
    if (btnSaveHist) { btnSaveHist.addEventListener('click', enregistrerHistorique); }
    const btnResetHist = document.getElementById('btnResetHist');
    if (btnResetHist) { btnResetHist.addEventListener('click', resetFormulaireHist); }

    const btnSaveFormation = document.getElementById('btnSaveFormation');
    if (btnSaveFormation) { btnSaveFormation.addEventListener('click', enregistrerFormation); }
    const btnResetForm = document.getElementById('btnResetForm');
    if (btnResetForm) { btnResetForm.addEventListener('click', resetFormulaireForm); }

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
