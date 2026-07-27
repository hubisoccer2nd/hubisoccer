/* ============================================================
   HubISoccer — agent-contrats.js
   Page Mes Contrats · Espace Agent FIFA
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       -> partagee (lecture)
   - supabaseAuthPrive_agent_talents  -> lecture seule
     (alimente le menu deroulant "Talent concerne")
   - supabaseAuthPrive_agent_contrats -> table de CETTE page
     (SQL : agent-contrats-table.sql, sans RLS)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const TALENTS_TABLE  = 'supabaseAuthPrive_agent_talents';
const CONTRATS_TABLE = 'supabaseAuthPrive_agent_contrats';

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser      = null;
let agentProfile     = null;
let allContrats        = [];
let editingId           = null;
let currentFilter       = 'all';

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
    if (el) { el.textContent = (value !== null && value !== undefined && value !== '') ? value : '—'; }
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
    if (!iso) { return '—'; }
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatMoney(v) {
    if (!v || isNaN(v)) { return '0 €'; }
    const n = Number(v);
    if (n >= 1000000) { return (n / 1000000).toFixed(1) + ' M€'; }
    if (n >= 1000) { return (n / 1000).toFixed(0) + ' K€'; }
    return n.toLocaleString('fr-FR') + ' €';
}

const TYPE_LABELS  = { transfert: 'Transfert', sponsoring: 'Sponsoring', representation: 'Représentation', publicite: 'Publicité' };
const TYPE_ICONS   = { transfert: 'fa-exchange-alt', sponsoring: 'fa-handshake', representation: 'fa-user-tie', publicite: 'fa-bullhorn' };
const STATUT_LABELS = { negociation: 'En négociation', signe: 'Signé', expire: 'Expiré', rompu: 'Rompu' };
const STATUT_ICONS  = { negociation: 'fa-comments', signe: 'fa-check-circle', expire: 'fa-hourglass-end', rompu: 'fa-times-circle' };

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

/* ---------- 9. LISTE DEROULANTE DES TALENTS ACCEPTES ---------- */
async function loadTalentsDropdown() {
    const select = document.getElementById('contratTalent');
    if (!select || !agentProfile) { return; }

    try {
        const { data, error } = await supabaseClient
            .from(TALENTS_TABLE)
            .select('talent_id, talent_nom')
            .eq('agent_id', agentProfile.hubisoccer_id)
            .eq('statut', 'accepted')
            .order('talent_nom', { ascending: true });

        if (!error && data) {
            data.forEach(function(t) {
                const opt = document.createElement('option');
                opt.value = t.talent_id;
                opt.textContent = t.talent_nom;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        /* Table pas encore utilisee ou vide : le menu reste avec l'option par defaut */
    }
}

/* ---------- 10. CHARGEMENT DES CONTRATS ---------- */
async function loadContrats() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(CONTRATS_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + CONTRATS_TABLE + ' absente :', error.message);
        showToast('Table des contrats absente. Executez le script SQL <b>agent-contrats-table.sql</b> dans Supabase.', 'warning');
        allContrats = [];
        return;
    }
    allContrats = data || [];
    updateStats();
    renderContrats();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const signes = allContrats.filter(function(c) { return c.statut === 'signe'; });
    const negociation = allContrats.filter(function(c) { return c.statut === 'negociation'; }).length;
    const montantTotal = signes.reduce(function(sum, c) { return sum + (Number(c.montant) || 0); }, 0);

    setText('statSignes', signes.length);
    setText('statNegociation', negociation);
    setText('statMontant', formatMoney(montantTotal));
    setText('statTotal', allContrats.length);
}

/* ---------- 12. CONSTRUCTION D'UNE CARTE CONTRAT ---------- */
function buildContratCard(c) {
    const card = document.createElement('div');
    card.className = 'contrat-card statut-' + c.statut;

    card.innerHTML =
        '<div>' +
            '<div class="contrat-partie">' + escapeHtml(c.partie) + '</div>' +
            '<div class="contrat-talent"><i class="fas fa-user"></i> ' + escapeHtml(c.talent_nom) + '</div>' +
        '</div>' +
        '<div class="contrat-badges">' +
            '<span class="contrat-type-badge ' + c.type_contrat + '"><i class="fas ' + TYPE_ICONS[c.type_contrat] + '"></i> ' + TYPE_LABELS[c.type_contrat] + '</span>' +
            '<span class="contrat-status-badge statut-' + c.statut + '"><i class="fas ' + STATUT_ICONS[c.statut] + '"></i> ' + STATUT_LABELS[c.statut] + '</span>' +
        '</div>' +
        '<div class="contrat-meta">' +
            (c.montant ? '<span><i class="fas fa-coins"></i>' + formatMoney(c.montant) + (c.commission_pourcentage ? ' · Commission ' + c.commission_pourcentage + '%' : '') + '</span>' : '') +
            (c.date_signature ? '<span><i class="fas fa-pen-nib"></i>Signe le ' + formatDateFr(c.date_signature) + '</span>' : '') +
            (c.date_fin ? '<span><i class="fas fa-calendar-times"></i>Jusqu\'au ' + formatDateFr(c.date_fin) + '</span>' : '') +
        '</div>' +
        (c.description ? '<div class="contrat-desc">' + escapeHtml(c.description) + '</div>' : '') +
        '<div class="contrat-actions">' +
            '<button class="btn-edit" data-id="' + c.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + c.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 13. RENDU DE LA LISTE ---------- */
function renderContrats() {
    const grid  = document.getElementById('contratsGrid');
    const empty = document.getElementById('contratsEmpty');
    if (!grid) { return; }

    let filtres = allContrats;
    if (currentFilter !== 'all') {
        filtres = allContrats.filter(function(c) { return c.statut === currentFilter; });
    }

    grid.querySelectorAll('.contrat-card').forEach(function(c) { c.remove(); });

    if (filtres.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    filtres.forEach(function(c) { grid.appendChild(buildContratCard(c)); });
    attachCardListeners(grid);
}

function attachCardListeners(container) {
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerContrat(btn.dataset.id); });
    });
}

/* ---------- 14. CHARGER UN CONTRAT DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(contratId) {
    const c = allContrats.find(function(x) { return String(x.id) === String(contratId); });
    if (!c) { return; }
    editingId = c.id;

    document.getElementById('contratTalent').value = c.talent_id || '';
    document.getElementById('contratPartie').value = c.partie || '';
    document.querySelectorAll('input[name="contratType"]').forEach(function(r) {
        r.checked = (r.value === c.type_contrat);
    });
    document.getElementById('contratMontant').value = c.montant || '';
    document.getElementById('contratCommission').value = c.commission_pourcentage || '';
    document.getElementById('contratDateSignature').value = c.date_signature || '';
    document.getElementById('contratStatut').value = c.statut || 'negociation';
    document.getElementById('contratDateDebut').value = c.date_debut || '';
    document.getElementById('contratDateFin').value = c.date_fin || '';
    document.getElementById('contratDescription').value = c.description || '';

    const panel = document.getElementById('contratFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(c.partie) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 15. REINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('contratTalent').value = '';
    document.getElementById('contratPartie').value = '';
    document.querySelectorAll('input[name="contratType"]').forEach(function(r) {
        r.checked = (r.value === 'transfert');
    });
    document.getElementById('contratMontant').value = '';
    document.getElementById('contratCommission').value = '';
    document.getElementById('contratDateSignature').value = '';
    document.getElementById('contratStatut').value = 'negociation';
    document.getElementById('contratDateDebut').value = '';
    document.getElementById('contratDateFin').value = '';
    document.getElementById('contratDescription').value = '';

    const panel = document.getElementById('contratFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un contrat'; }
}

/* ---------- 16. ENREGISTRER (creation ou edition) ---------- */
async function enregistrerContrat() {
    const talentSelect = document.getElementById('contratTalent');
    const talentId = talentSelect?.value || '';
    const partie = (document.getElementById('contratPartie')?.value || '').trim();

    if (!talentId) { showToast('Selectionnez un talent.', 'warning'); return; }
    if (!partie) { showToast('La partie concernee est obligatoire.', 'warning'); return; }

    const talentNom = talentSelect.options[talentSelect.selectedIndex].textContent;
    const montantRaw = document.getElementById('contratMontant')?.value;
    const commissionRaw = document.getElementById('contratCommission')?.value;

    const payload = {
        agent_id                : agentProfile.hubisoccer_id,
        talent_id                : talentId,
        talent_nom               : talentNom,
        type_contrat             : document.querySelector('input[name="contratType"]:checked')?.value || 'transfert',
        partie                   : partie,
        montant                  : montantRaw ? parseFloat(montantRaw) : null,
        commission_pourcentage   : commissionRaw ? parseFloat(commissionRaw) : null,
        date_signature           : document.getElementById('contratDateSignature')?.value || null,
        date_debut               : document.getElementById('contratDateDebut')?.value || null,
        date_fin                 : document.getElementById('contratDateFin')?.value || null,
        statut                   : document.getElementById('contratStatut')?.value || 'negociation',
        description              : (document.getElementById('contratDescription')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingId) {
        const res = await supabaseClient.from(CONTRATS_TABLE).update(payload).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient.from(CONTRATS_TABLE).insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast(editingId ? 'Contrat mis a jour. ✅' : 'Contrat enregistre.', 'success');
    resetFormulaire();
    await loadContrats();
}

/* ---------- 17. SUPPRIMER UN CONTRAT ---------- */
async function supprimerContrat(contratId) {
    const c = allContrats.find(function(x) { return String(x.id) === String(contratId); });
    const nom = c ? c.partie : 'ce contrat';
    if (!confirm('Supprimer definitivement « ' + nom + ' » ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(CONTRATS_TABLE).delete().eq('id', contratId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(contratId)) { resetFormulaire(); }
    showToast('Contrat supprime.', 'info');
    await loadContrats();
}

/* ---------- 18. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#contratFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#contratFilters .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderContrats();
        });
    });
}

/* ---------- 19. MENU UTILISATEUR ---------- */
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

/* ---------- 20. SIDEBAR + SWIPE ---------- */
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

/* ---------- 21. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 22. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadTalentsDropdown();
    await loadContrats();

    initFilters();
    initUserMenu();
    initSidebar();

    const btnSave = document.getElementById('btnSaveContrat');
    if (btnSave) { btnSave.addEventListener('click', enregistrerContrat); }
    const btnReset = document.getElementById('btnResetForm');
    if (btnReset) { btnReset.addEventListener('click', resetFormulaire); }

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
