/* ============================================================
   HubISoccer — academie-athletes.js
   Page Mes Athlètes · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles           → partagée (recherche talent)
   - supabaseAuthPrive_academie_scouting  → lecture seule (talents_limite)
   - supabaseAuthPrive_academie_athletes  → table de CETTE page
     (SQL : academie-athletes-table.sql, sans RLS)
   ------------------------------------------------------------
   C'est ICI que le quota de talents (160 par défaut) est
   réellement verrouillé : à l'envoi d'une invitation et à
   l'acceptation d'une candidature. Le tableau de bord ne fait
   qu'AFFICHER le quota — cette page l'APPLIQUE.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE = 'supabaseAuthPrive_academie_scouting';
const ATHLETES_TABLE = 'supabaseAuthPrive_academie_athletes';
const QUOTA_DEFAUT   = 160;

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser     = null;
let academieProfile = null;
let quotaLimite      = QUOTA_DEFAUT;
let allLinks         = [];   // toutes les lignes academie_athletes de cette académie
let foundTalent       = null; // résultat de la dernière recherche
let currentFilter     = 'all';
const MAX_MIS_EN_AVANT = 4;   // doit correspondre à la limite affichée sur le dashboard

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

/* ---------- 8. CHARGEMENT PROFIL ACADÉMIE ---------- */
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
    academieProfile = data;
    setText('userName', academieProfile.full_name || 'Académie Sportive');
    updateNavbarAvatar();
    return academieProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = academieProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(academieProfile?.full_name || 'A');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. QUOTA DE TALENTS (lu depuis academie_scouting) ---------- */
async function loadQuotaLimite() {
    if (!academieProfile) { return; }
    const { data } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('talents_limite')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .maybeSingle();
    quotaLimite = (data && data.talents_limite) ? data.talents_limite : QUOTA_DEFAUT;
}

/* ---------- 10. CHARGEMENT DES LIAISONS ---------- */
async function loadLinks() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(ATHLETES_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + ATHLETES_TABLE + ' :', error.message);
        showToast('Table des athlètes absente. Exécutez le script SQL <b>academie-athletes-table.sql</b> dans Supabase.', 'warning');
        allLinks = [];
        return;
    }
    allLinks = data || [];
    updateStats();
    renderReceived();
    renderSent();
    renderRoster();
}

/* ---------- 11. STATS + JAUGE DE QUOTA ---------- */
function updateStats() {
    const acceptes = allLinks.filter(function(l) { return l.statut === 'accepte'; });
    const sportifs = acceptes.filter(function(l) { return l.talent_type === 'sportif'; }).length;
    const artistes = acceptes.filter(function(l) { return l.talent_type === 'artiste'; }).length;
    const attente  = allLinks.filter(function(l) { return l.statut === 'en_attente'; }).length;

    setText('statQuota', acceptes.length + ' / ' + quotaLimite);
    setText('statSportifs', sportifs);
    setText('statArtistes', artistes);
    setText('statAttente', attente);

    const fill = document.getElementById('statQuotaFill');
    if (fill) {
        const pct = Math.min(Math.round((acceptes.length / quotaLimite) * 100), 100);
        fill.style.width = pct + '%';
        fill.classList.remove('near-limit', 'at-limit');
        if (acceptes.length >= quotaLimite) {
            fill.classList.add('at-limit');
        } else if (quotaLimite - acceptes.length <= 10) {
            fill.classList.add('near-limit');
        }
    }
    setText('notifBadge', attente);
}

function nbAcceptes() {
    return allLinks.filter(function(l) { return l.statut === 'accepte'; }).length;
}

/* ================================================================
   RECHERCHE & INVITATION D'UN TALENT
   ================================================================ */
async function rechercherTalent() {
    const id = (document.getElementById('searchTalentId')?.value || '').trim();
    if (!id) {
        showToast('Entrez un ID HubISoccer à rechercher.', 'warning');
        return;
    }

    const dejaLie = allLinks.find(function(l) { return l.talent_id === id; });
    if (dejaLie) {
        const labels = { en_attente: 'en attente de réponse', accepte: 'déjà dans votre effectif', refuse: 'précédemment refusée' };
        showToast('Ce talent a déjà une liaison ' + (labels[dejaLie.statut] || '') + ' avec votre académie.', 'warning');
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
        showToast('Aucun talent trouvé avec cet ID. Vérifiez l\'orthographe.', 'error');
        document.getElementById('searchResult').style.display = 'none';
        foundTalent = null;
        return;
    }

    foundTalent = data;
    document.getElementById('foundName').textContent = data.full_name || 'Talent';
    document.getElementById('foundId').textContent = 'ID : ' + data.hubisoccer_id;
    document.getElementById('foundRole').textContent = data.role || data.type_talent || data.poste || 'Rôle non renseigné';

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

    if (nbAcceptes() >= quotaLimite) {
        showToast('Quota de ' + quotaLimite + ' talents atteint. Retirez un athlète de votre effectif ou contactez le support pour augmenter votre quota avant d\'inviter quelqu\'un de nouveau.', 'error');
        return;
    }

    const talentType = document.querySelector('input[name="talentType"]:checked')?.value || 'sportif';
    const payload = {
        academie_id : academieProfile.hubisoccer_id,
        talent_id   : foundTalent.hubisoccer_id,
        talent_nom  : foundTalent.full_name || 'Talent',
        talent_type : talentType,
        discipline  : (document.getElementById('talentDiscipline')?.value || '').trim() || null,
        photo_url   : foundTalent.avatar_url || null,
        direction   : 'invitation',
        statut      : 'en_attente',
        message     : (document.getElementById('linkMessage')?.value || '').trim() || null
    };

    showLoader();
    const { error } = await supabaseClient.from(ATHLETES_TABLE).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast('Invitation envoyée à ' + payload.talent_nom + '. En attente de sa confirmation. 📨', 'success');
    annulerRecherche();
    await loadLinks();
}

/* ================================================================
   CANDIDATURES REÇUES (direction = candidature)
   ================================================================ */
function renderReceived() {
    const grid  = document.getElementById('receivedList');
    const empty = document.getElementById('receivedEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.direction === 'candidature' && l.statut === 'en_attente'; });
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
                    '<div class="request-discipline">' + escapeHtml(l.discipline || '—') + '</div>' +
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
    if (nbAcceptes() >= quotaLimite) {
        showToast('Quota de ' + quotaLimite + ' talents atteint. Vous ne pouvez plus accepter de nouveau talent tant que votre effectif n\'a pas de place disponible.', 'error');
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(ATHLETES_TABLE)
        .update({ statut: 'accepte' })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Talent accepté dans votre effectif. 🎉', 'success');
    await loadLinks();
}

async function refuserDemande(linkId) {
    if (!confirm('Refuser cette demande ?')) { return; }
    showLoader();
    const { error } = await supabaseClient
        .from(ATHLETES_TABLE)
        .update({ statut: 'refuse' })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Demande refusée.', 'info');
    await loadLinks();
}

/* ================================================================
   INVITATIONS ENVOYÉES (direction = invitation, en attente)
   ================================================================ */
function renderSent() {
    const grid  = document.getElementById('sentList');
    const empty = document.getElementById('sentEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.direction === 'invitation' && l.statut === 'en_attente'; });
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
                    '<div class="request-discipline">' + escapeHtml(l.discipline || '—') + '</div>' +
                '</div>' +
            '</div>' +
            '<span class="request-pending-tag"><i class="fas fa-clock"></i> En attente de sa réponse</span>';
        grid.appendChild(card);
    });
}

/* ================================================================
   MON EFFECTIF (statut = accepte)
   ================================================================ */
function renderRoster() {
    const grid  = document.getElementById('athletesList');
    const empty = document.getElementById('athletesEmpty');
    if (!grid) { return; }

    let liste = allLinks.filter(function(l) { return l.statut === 'accepte'; });
    if (currentFilter === 'sportif') {
        liste = liste.filter(function(l) { return l.talent_type === 'sportif'; });
    } else if (currentFilter === 'artiste') {
        liste = liste.filter(function(l) { return l.talent_type === 'artiste'; });
    } else if (currentFilter === 'featured') {
        liste = liste.filter(function(l) { return l.mis_en_avant === true; });
    }

    grid.querySelectorAll('.athlete-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'athlete-card' + (l.mis_en_avant ? ' is-featured' : '');
        card.innerHTML =
            '<button class="btn-feature ' + (l.mis_en_avant ? 'active' : '') + '" data-id="' + l.id + '" title="Mettre en avant sur le tableau de bord">' +
                '<i class="fas fa-star"></i>' +
            '</button>' +
            '<div class="athlete-avatar">' +
                (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.talent_nom))) +
            '</div>' +
            '<div class="athlete-name">' + escapeHtml(l.talent_nom) + '</div>' +
            '<div class="athlete-discipline">' + escapeHtml(l.discipline || '—') + '</div>' +
            '<span class="athlete-type-badge ' + l.talent_type + '">' +
                '<i class="fas ' + (l.talent_type === 'artiste' ? 'fa-music' : 'fa-futbol') + '"></i> ' +
                (l.talent_type === 'artiste' ? 'Artiste' : 'Sportif') +
            '</span>' +
            '<button class="athlete-remove" data-id="' + l.id + '"><i class="fas fa-user-minus"></i> Retirer de l\'effectif</button>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-feature').forEach(function(btn) {
        btn.addEventListener('click', function() { toggleMisEnAvant(btn.dataset.id); });
    });
    grid.querySelectorAll('.athlete-remove').forEach(function(btn) {
        btn.addEventListener('click', function() { retirerAthlete(btn.dataset.id); });
    });
}

async function toggleMisEnAvant(linkId) {
    const link = allLinks.find(function(l) { return String(l.id) === String(linkId); });
    if (!link) { return; }

    if (!link.mis_en_avant) {
        const nbActuels = allLinks.filter(function(l) { return l.mis_en_avant === true; }).length;
        if (nbActuels >= MAX_MIS_EN_AVANT) {
            showToast('Vous ne pouvez mettre en avant que ' + MAX_MIS_EN_AVANT + ' talents à la fois sur votre vitrine. Retirez-en un d\'abord.', 'warning');
            return;
        }
    }

    showLoader();
    const { error } = await supabaseClient
        .from(ATHLETES_TABLE)
        .update({ mis_en_avant: !link.mis_en_avant })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast(!link.mis_en_avant ? 'Talent mis en avant sur votre vitrine. ⭐' : 'Retiré de la vitrine.', 'success');
    await loadLinks();
}

async function retirerAthlete(linkId) {
    const link = allLinks.find(function(l) { return String(l.id) === String(linkId); });
    const nom = link ? link.talent_nom : 'ce talent';
    if (!confirm('Retirer « ' + nom + ' » de votre effectif ? Cette place redevient disponible dans votre quota.')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(ATHLETES_TABLE).delete().eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast(nom + ' a été retiré(e) de votre effectif.', 'info');
    await loadLinks();
}

/* ---------- 12. FILTRES EFFECTIF ---------- */
function initFilters() {
    document.querySelectorAll('#filterTabs .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#filterTabs .filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderRoster();
        });
    });
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
    if (!academieProfile) { return; }
    await loadQuotaLimite();
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
