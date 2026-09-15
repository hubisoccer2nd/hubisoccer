/* ============================================================
   HubISoccer — foot-invitations.js
   Page Mes Invitations · Espace Footballeur
   ------------------------------------------------------------
   Cette page NE CRÉE AUCUNE TABLE. Elle lit et met à jour DEUX
   tables déjà existantes, écrites par les espaces coach et
   académie :
   - supabaseAuthPrive_coach_talents     (statut: pending/accepted/rejected,
     initiateur: coach/talent)
   - supabaseAuthPrive_academie_athletes (statut: en_attente/accepte/refuse,
     direction: invitation/candidature)
   Les deux tables utilisent des vocabulaires DIFFÉRENTS — chaque
   invitation est marquée avec sa source (_source) pour appliquer
   le bon champ/la bonne valeur au moment d'accepter/refuser.
   Aucune des deux tables ne stocke le nom de l'expéditeur (académie
   ou coach) : une requête complémentaire sur supabaseAuthPrive_profiles
   comble ce manque.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE       = 'supabaseAuthPrive_profiles';
const COACH_TALENTS_TABLE  = 'supabaseAuthPrive_coach_talents';
const ACADEMIE_ATHL_TABLE  = 'supabaseAuthPrive_academie_athletes';
const ACADEMIE_SCOUT_TABLE = 'supabaseAuthPrive_academie_scouting';
const QUOTA_DEFAUT         = 160;

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser     = null;
let footProfile      = null;
let allInvitations     = [];   // tableau fusionné, normalisé, des deux sources
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

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
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

/* ---------- 8. CHARGEMENT PROFIL FOOTBALLEUR ---------- */
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
    footProfile = data;
    setText('userName', footProfile.full_name || 'Footballeur');
    updateNavbarAvatar();
    return footProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = footProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(footProfile?.full_name || 'F');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ================================================================
   CHARGEMENT DES INVITATIONS (deux sources, un seul tableau normalisé)
   ================================================================ */
async function loadInvitations() {
    if (!footProfile) { return; }
    showLoader();

    const talentId = footProfile.hubisoccer_id;

    const [coachRes, academieRes] = await Promise.all([
        supabaseClient
            .from(COACH_TALENTS_TABLE)
            .select('*')
            .eq('talent_id', talentId)
            .eq('initiateur', 'coach'),
        supabaseClient
            .from(ACADEMIE_ATHL_TABLE)
            .select('*')
            .eq('talent_id', talentId)
            .eq('direction', 'invitation')
    ]);

    const coachRows    = (!coachRes.error && coachRes.data) ? coachRes.data : [];
    const academieRows = (!academieRes.error && academieRes.data) ? academieRes.data : [];

    if (coachRes.error) {
        console.warn('⚠️ Table ' + COACH_TALENTS_TABLE + ' :', coachRes.error.message);
    }
    if (academieRes.error) {
        console.warn('⚠️ Table ' + ACADEMIE_ATHL_TABLE + ' :', academieRes.error.message);
    }

    /* Récupération des noms d'expéditeurs (ni coach_talents ni
       academie_athletes ne stockent le nom de l'expéditeur) */
    const senderIds = Array.from(new Set(
        coachRows.map(function(r) { return r.coach_id; })
            .concat(academieRows.map(function(r) { return r.academie_id; }))
    )).filter(Boolean);

    let senderMap = {};
    if (senderIds.length > 0) {
        const { data: senders } = await supabaseClient
            .from(PROFILES_TABLE)
            .select('hubisoccer_id, full_name, avatar_url')
            .in('hubisoccer_id', senderIds);
        (senders || []).forEach(function(s) { senderMap[s.hubisoccer_id] = s; });
    }

    /* Normalisation coach_talents : pending/accepted/rejected */
    const coachNormalized = coachRows.map(function(r) {
        const sender = senderMap[r.coach_id] || {};
        return {
            _source     : 'coach',
            _table      : COACH_TALENTS_TABLE,
            id          : r.id,
            sender_id   : r.coach_id,
            sender_nom  : sender.full_name || 'Coach',
            sender_avatar: sender.avatar_url || null,
            message     : r.message,
            statut      : r.statut === 'pending' ? 'pending' : (r.statut === 'accepted' ? 'accepted' : 'rejected'),
            created_at  : r.created_at
        };
    });

    /* Normalisation academie_athletes : en_attente/accepte/refuse */
    const academieNormalized = academieRows.map(function(r) {
        const sender = senderMap[r.academie_id] || {};
        const statutMap = { en_attente: 'pending', accepte: 'accepted', refuse: 'rejected' };
        return {
            _source     : 'academie',
            _table      : ACADEMIE_ATHL_TABLE,
            id          : r.id,
            sender_id   : r.academie_id,
            sender_nom  : sender.full_name || 'Académie',
            sender_avatar: sender.avatar_url || null,
            message     : r.message,
            statut      : statutMap[r.statut] || 'pending',
            created_at  : r.created_at
        };
    });

    allInvitations = coachNormalized.concat(academieNormalized)
        .sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });

    hideLoader();
    updateStats();
    renderPending();
    renderHistory();
}

/* ---------- 9. STATS RAPIDES ---------- */
function updateStats() {
    const pending    = allInvitations.filter(function(i) { return i.statut === 'pending'; });
    const academies  = pending.filter(function(i) { return i._source === 'academie'; }).length;
    const coachs     = pending.filter(function(i) { return i._source === 'coach'; }).length;
    const traitees   = allInvitations.filter(function(i) { return i.statut !== 'pending'; }).length;

    setText('statAttente', pending.length);
    setText('statAcademies', academies);
    setText('statCoachs', coachs);
    setText('statTraitees', traitees);
    setText('notifBadge', pending.length);
}

/* ---------- 10. RENDU — INVITATIONS EN ATTENTE ---------- */
function renderPending() {
    const grid  = document.getElementById('pendingGrid');
    const empty = document.getElementById('pendingEmpty');
    if (!grid) { return; }

    let liste = allInvitations.filter(function(i) { return i.statut === 'pending'; });
    if (currentFilter !== 'all') {
        liste = liste.filter(function(i) { return i._source === currentFilter; });
    }

    grid.querySelectorAll('.invit-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(inv) {
        const card = document.createElement('div');
        card.className = 'invit-card source-' + inv._source;

        card.innerHTML =
            '<div class="invit-top">' +
                '<div class="invit-avatar">' +
                    (inv.sender_avatar ? '<img src="' + escapeHtml(inv.sender_avatar) + '">' : escapeHtml(getInitials(inv.sender_nom))) +
                '</div>' +
                '<div>' +
                    '<div class="invit-name">' + escapeHtml(inv.sender_nom) + '</div>' +
                    '<span class="invit-source-badge ' + inv._source + '">' +
                        '<i class="fas ' + (inv._source === 'academie' ? 'fa-school' : 'fa-clipboard-list') + '"></i> ' +
                        (inv._source === 'academie' ? 'Académie' : 'Coach') +
                    '</span>' +
                '</div>' +
            '</div>' +
            (inv.message ? '<div class="invit-message">« ' + escapeHtml(inv.message) + ' »</div>' : '') +
            '<div class="invit-date"><i class="fas fa-calendar"></i> Reçue le ' + formatDateFr(inv.created_at) + '</div>' +
            '<div class="invit-actions">' +
                '<button class="btn-accept" data-source="' + inv._source + '" data-id="' + inv.id + '"><i class="fas fa-check"></i> Accepter</button>' +
                '<button class="btn-decline" data-source="' + inv._source + '" data-id="' + inv.id + '"><i class="fas fa-times"></i> Refuser</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-accept').forEach(function(btn) {
        btn.addEventListener('click', function() { accepterInvitation(btn.dataset.source, btn.dataset.id); });
    });
    grid.querySelectorAll('.btn-decline').forEach(function(btn) {
        btn.addEventListener('click', function() { refuserInvitation(btn.dataset.source, btn.dataset.id); });
    });
}

/* ---------- 11. RENDU — HISTORIQUE ---------- */
function renderHistory() {
    const list  = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!list) { return; }

    const liste = allInvitations.filter(function(i) { return i.statut !== 'pending'; });

    list.querySelectorAll('.history-item').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(inv) {
        const item = document.createElement('div');
        item.className = 'history-item statut-' + inv.statut;
        item.innerHTML =
            '<i class="fas ' + (inv.statut === 'accepted' ? 'fa-check-circle' : 'fa-times-circle') + ' history-icon"></i>' +
            '<div class="history-body">' +
                '<div class="history-name">' + escapeHtml(inv.sender_nom) + ' <span style="color:var(--gray);font-weight:400;">(' + (inv._source === 'academie' ? 'Académie' : 'Coach') + ')</span></div>' +
                '<div class="history-meta">' + formatDateFr(inv.created_at) + '</div>' +
            '</div>' +
            '<span class="history-status-label">' + (inv.statut === 'accepted' ? 'Acceptée' : 'Refusée') + '</span>';
        list.appendChild(item);
    });
}

/* ---------- 12. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#invitFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#invitFilters .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPending();
        });
    });
}

/* ================================================================
   ACCEPTER / REFUSER — bascule vers la bonne table/champ/valeur
   ================================================================ */
async function accepterInvitation(source, id) {
    const inv = allInvitations.find(function(i) { return i._source === source && String(i.id) === String(id); });
    if (!inv) { return; }

    /* Vérification du quota — uniquement pour les invitations d'académie */
    if (source === 'academie') {
        const { data: scouting } = await supabaseClient
            .from(ACADEMIE_SCOUT_TABLE)
            .select('talents_limite')
            .eq('academie_id', inv.sender_id)
            .maybeSingle();
        const limite = (scouting && scouting.talents_limite) ? scouting.talents_limite : QUOTA_DEFAUT;

        const { count } = await supabaseClient
            .from(ACADEMIE_ATHL_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('academie_id', inv.sender_id)
            .eq('statut', 'accepte');

        if ((count || 0) >= limite) {
            showToast(escapeHtml(inv.sender_nom) + ' a atteint son quota de ' + limite + ' talents. Réessayez plus tard ou contactez l\'académie.', 'warning');
            return;
        }
    }

    showLoader();
    const payload = source === 'coach' ? { statut: 'accepted' } : { statut: 'accepte' };
    const { error } = await supabaseClient.from(inv._table).update(payload).eq('id', id);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Invitation de ' + escapeHtml(inv.sender_nom) + ' acceptée. 🎉', 'success');
    await loadInvitations();
}

async function refuserInvitation(source, id) {
    const inv = allInvitations.find(function(i) { return i._source === source && String(i.id) === String(id); });
    const nom = inv ? inv.sender_nom : 'cette invitation';
    if (!confirm('Refuser l\'invitation de « ' + nom + ' » ?')) { return; }

    showLoader();
    const payload = source === 'coach' ? { statut: 'rejected' } : { statut: 'refuse' };
    const { error } = await supabaseClient.from(inv._table).update(payload).eq('id', id);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Invitation refusée.', 'info');
    await loadInvitations();
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
    const cb = document.getElementById('closeSidebar');

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

/* ---------- 15. DÉCONNEXION ---------- */
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
    if (!footProfile) { return; }
    await loadInvitations();

    initFilters();
    initUserMenu();
    initSidebar();

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
