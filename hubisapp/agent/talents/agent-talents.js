/* ============================================================
   HubISoccer — agent-talents.js
   Page Mes Talents · Espace Agent FIFA
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       -> partagee (recherche talent)
   - supabaseAuthPrive_agent_talents  -> table de CETTE page
     (SQL : agent-talents-table.sql, sans RLS)
   ------------------------------------------------------------
   Meme mecanique que Mes Talents cote coach (statut pending,
   accepted, rejected ; initiateur agent ou talent) - aucun
   quota, un agent represente autant de talents que necessaire.
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

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser     = null;
let agentProfile    = null;
let allLinks          = [];   // toutes les lignes agent_talents de cet agent
let foundTalent        = null; // resultat de la derniere recherche
let currentFilter      = 'all';

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

/* ---------- 9. CHARGEMENT DES LIAISONS ---------- */
async function loadLinks() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(TALENTS_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + TALENTS_TABLE + ' absente :', error.message);
        showToast('Table des talents absente. Executez le script SQL <b>agent-talents-table.sql</b> dans Supabase.', 'warning');
        allLinks = [];
        return;
    }
    allLinks = data || [];
    updateStats();
    renderReceived();
    renderSent();
    renderPortfolio();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    const acceptes = allLinks.filter(function(l) { return l.statut === 'accepted'; });
    const sportifs = acceptes.filter(function(l) { return l.talent_type === 'sportif'; }).length;
    const artistes = acceptes.filter(function(l) { return l.talent_type === 'artiste'; }).length;
    const attente  = allLinks.filter(function(l) { return l.statut === 'pending'; }).length;

    setText('statTotal', acceptes.length);
    setText('statSportifs', sportifs);
    setText('statArtistes', artistes);
    setText('statAttente', attente);
    setText('notifBadge', attente);
}

/* ================================================================
   RECHERCHE & INVITATION D'UN TALENT
   ================================================================ */
async function rechercherTalent() {
    const id = (document.getElementById('searchTalentId')?.value || '').trim();
    if (!id) {
        showToast('Entrez un ID HubISoccer a rechercher.', 'warning');
        return;
    }

    const dejaLie = allLinks.find(function(l) { return l.talent_id === id; });
    if (dejaLie) {
        const labels = { pending: 'en attente de reponse', accepted: 'deja dans votre portefeuille', rejected: 'precedemment refusee' };
        showToast('Ce talent a deja une liaison ' + (labels[dejaLie.statut] || '') + ' avec vous.', 'warning');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('hubisoccer_id', id)
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        showToast('Aucun talent trouve avec cet ID. Verifiez l\'orthographe.', 'error');
        document.getElementById('searchResult').style.display = 'none';
        foundTalent = null;
        return;
    }

    foundTalent = data;
    document.getElementById('foundName').textContent = data.full_name || 'Talent';
    document.getElementById('foundId').textContent = 'ID : ' + data.hubisoccer_id;
    document.getElementById('foundRole').textContent = data.role || data.type_talent || data.poste || 'Role non renseigne';

    const av = document.getElementById('foundAvatar');
    const ini = document.getElementById('foundInitials');
    if (data.avatar_url) {
        av.src = data.avatar_url; av.style.display = 'block'; ini.style.display = 'none';
    } else {
        ini.textContent = getInitials(data.full_name); ini.style.display = 'flex'; av.style.display = 'none';
    }

    document.getElementById('searchResult').style.display = 'block';
    document.getElementById('searchResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function annulerRecherche() {
    foundTalent = null;
    document.getElementById('searchResult').style.display = 'none';
    document.getElementById('searchTalentId').value = '';
    document.getElementById('linkMessage').value = '';
}

async function envoyerInvitation() {
    if (!foundTalent) { return; }

    const talentType = document.querySelector('input[name="talentType"]:checked')?.value || 'sportif';
    const payload = {
        agent_id    : agentProfile.hubisoccer_id,
        talent_id   : foundTalent.hubisoccer_id,
        talent_nom  : foundTalent.full_name || 'Talent',
        talent_type : talentType,
        talent_role : (document.getElementById('talentRole')?.value || '').trim() || null,
        photo_url   : foundTalent.avatar_url || null,
        initiateur  : 'agent',
        statut      : 'pending',
        message     : (document.getElementById('linkMessage')?.value || '').trim() || null
    };

    showLoader();
    const { error } = await supabaseClient.from(TALENTS_TABLE).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast('Invitation envoyee a ' + payload.talent_nom + '. En attente de sa confirmation.', 'success');
    annulerRecherche();
    await loadLinks();
}

/* ================================================================
   CANDIDATURES RECUES (initiateur = talent)
   ================================================================ */
function renderReceived() {
    const grid  = document.getElementById('receivedList');
    const empty = document.getElementById('receivedEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.initiateur === 'talent' && l.statut === 'pending'; });
    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-top">' +
                '<div class="request-avatar">' +
                    (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.talent_nom))) +
                '</div>' +
                '<div>' +
                    '<div class="request-name">' + escapeHtml(l.talent_nom) + '</div>' +
                    '<div class="request-discipline">' + escapeHtml(l.talent_role || '—') + '</div>' +
                '</div>' +
            '</div>' +
            (l.message ? '<div class="request-message">« ' + escapeHtml(l.message) + ' »</div>' : '') +
            '<div class="request-actions">' +
                '<button class="btn-accept" data-id="' + l.id + '"><i class="fas fa-check"></i> Accepter</button>' +
                '<button class="btn-decline" data-id="' + l.id + '"><i class="fas fa-times"></i> Refuser</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-accept').forEach(function(btn) {
        btn.addEventListener('click', function() { accepterCandidature(btn.dataset.id); });
    });
    grid.querySelectorAll('.btn-decline').forEach(function(btn) {
        btn.addEventListener('click', function() { refuserDemande(btn.dataset.id); });
    });
}

async function accepterCandidature(linkId) {
    showLoader();
    const { error } = await supabaseClient
        .from(TALENTS_TABLE)
        .update({ statut: 'accepted' })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Talent accepte dans votre portefeuille.', 'success');
    await loadLinks();
}

async function refuserDemande(linkId) {
    if (!confirm('Refuser cette demande ?')) { return; }
    showLoader();
    const { error } = await supabaseClient
        .from(TALENTS_TABLE)
        .update({ statut: 'rejected' })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Demande refusee.', 'info');
    await loadLinks();
}

/* ================================================================
   INVITATIONS ENVOYEES (initiateur = agent, en attente)
   ================================================================ */
function renderSent() {
    const grid  = document.getElementById('sentList');
    const empty = document.getElementById('sentEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.initiateur === 'agent' && l.statut === 'pending'; });
    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-top">' +
                '<div class="request-avatar">' +
                    (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.talent_nom))) +
                '</div>' +
                '<div>' +
                    '<div class="request-name">' + escapeHtml(l.talent_nom) + '</div>' +
                    '<div class="request-discipline">' + escapeHtml(l.talent_role || '—') + '</div>' +
                '</div>' +
            '</div>' +
            '<span class="request-pending-tag"><i class="fas fa-clock"></i> En attente de sa reponse</span>';
        grid.appendChild(card);
    });
}

/* ================================================================
   MON PORTEFEUILLE (statut = accepted)
   ================================================================ */
function renderPortfolio() {
    const grid  = document.getElementById('talentsList');
    const empty = document.getElementById('talentsEmpty');
    if (!grid) { return; }

    let liste = allLinks.filter(function(l) { return l.statut === 'accepted'; });
    if (currentFilter === 'sportif') {
        liste = liste.filter(function(l) { return l.talent_type === 'sportif'; });
    } else if (currentFilter === 'artiste') {
        liste = liste.filter(function(l) { return l.talent_type === 'artiste'; });
    }

    grid.querySelectorAll('.talent-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'talent-card';
        card.innerHTML =
            '<div class="talent-avatar">' +
                (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.talent_nom))) +
            '</div>' +
            '<div class="talent-name">' + escapeHtml(l.talent_nom) + '</div>' +
            '<div class="talent-discipline">' + escapeHtml(l.talent_role || '—') + '</div>' +
            '<span class="talent-type-badge ' + l.talent_type + '">' +
                '<i class="fas ' + (l.talent_type === 'artiste' ? 'fa-music' : 'fa-futbol') + '"></i> ' +
                (l.talent_type === 'artiste' ? 'Artiste' : 'Sportif') +
            '</span>' +
            '<button class="talent-remove" data-id="' + l.id + '"><i class="fas fa-user-minus"></i> Retirer du portefeuille</button>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.talent-remove').forEach(function(btn) {
        btn.addEventListener('click', function() { retirerTalent(btn.dataset.id); });
    });
}

async function retirerTalent(linkId) {
    const link = allLinks.find(function(l) { return String(l.id) === String(linkId); });
    const nom = link ? link.talent_nom : 'ce talent';
    if (!confirm('Retirer « ' + nom + ' » de votre portefeuille ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(TALENTS_TABLE).delete().eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast(nom + ' a ete retire de votre portefeuille.', 'info');
    await loadLinks();
}

/* ---------- 11. FILTRES PORTEFEUILLE ---------- */
function initFilters() {
    document.querySelectorAll('#filterTabs .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#filterTabs .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPortfolio();
        });
    });
}

/* ---------- 12. MENU UTILISATEUR ---------- */
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

/* ---------- 13. SIDEBAR + SWIPE ---------- */
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

/* ---------- 14. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 15. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadLinks();

    initFilters();
    initUserMenu();
    initSidebar();

    const btnSearch = document.getElementById('btnSearchTalent');
    if (btnSearch) { btnSearch.addEventListener('click', rechercherTalent); }

    const searchInput = document.getElementById('searchTalentId');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { rechercherTalent(); }
        });
    }

    /* Pre-remplissage depuis "Decouvrez mes talents" (?id=...) */
    const preselectedId = new URLSearchParams(window.location.search).get('id');
    if (preselectedId && searchInput) {
        searchInput.value = preselectedId;
        rechercherTalent();
    }

    const btnCancel = document.getElementById('btnCancelSearch');
    if (btnCancel) { btnCancel.addEventListener('click', annulerRecherche); }

    const btnSend = document.getElementById('btnSendRequest');
    if (btnSend) { btnSend.addEventListener('click', envoyerInvitation); }

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
