/* ============================================================
   HubISoccer — academie-formateurs.js
   Page Mes Formateurs · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles             → partagée (recherche)
   - supabaseAuthPrive_academie_formateurs  → table de CETTE page
     (SQL : academie-formateurs-table.sql, sans RLS)
   ------------------------------------------------------------
   Même mécanique que Mes Athlètes (invitation/candidature,
   en_attente/accepte/refuse) mais SANS quota — une académie peut
   affilier autant de formateurs que nécessaire.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE   = 'supabaseAuthPrive_profiles';
const FORMATEURS_TABLE = 'supabaseAuthPrive_academie_formateurs';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser     = null;
let academieProfile = null;
let allLinks         = [];   // toutes les lignes academie_formateurs de cette académie
let foundPerson       = null; // résultat de la dernière recherche

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

/* ---------- 9. CHARGEMENT DES LIAISONS ---------- */
async function loadLinks() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(FORMATEURS_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + FORMATEURS_TABLE + ' :', error.message);
        showToast('Table des formateurs absente. Exécutez le script SQL <b>academie-formateurs-table.sql</b> dans Supabase.', 'warning');
        allLinks = [];
        return;
    }
    allLinks = data || [];
    updateStats();
    renderReceived();
    renderSent();
    renderRoster();
}

/* ---------- 10. STATS ---------- */
function updateStats() {
    const actifs  = allLinks.filter(function(l) { return l.statut === 'accepte'; });
    const attente = allLinks.filter(function(l) { return l.statut === 'en_attente'; }).length;
    const specialitesUniques = new Set(
        actifs.map(function(l) { return l.specialite; }).filter(function(s) { return !!s; })
    );

    setText('statTotal', allLinks.filter(function(l) { return l.statut !== 'refuse'; }).length);
    setText('statActifs', actifs.length);
    setText('statAttente', attente);
    setText('statSpecialites', specialitesUniques.size);
    setText('notifBadge', attente);
}

/* ================================================================
   RECHERCHE & INVITATION D'UN FORMATEUR
   ================================================================ */
async function rechercherFormateur() {
    const id = (document.getElementById('searchFormateurId')?.value || '').trim();
    if (!id) {
        showToast('Entrez un ID HubISoccer à rechercher.', 'warning');
        return;
    }

    const dejaLie = allLinks.find(function(l) { return l.formateur_id === id; });
    if (dejaLie) {
        const labels = { en_attente: 'en attente de réponse', accepte: 'déjà dans votre équipe', refuse: 'précédemment refusée' };
        showToast('Ce formateur a déjà une liaison ' + (labels[dejaLie.statut] || '') + ' avec votre académie.', 'warning');
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
        showToast('Aucune personne trouvée avec cet ID. Vérifiez l\'orthographe.', 'error');
        document.getElementById('searchResult').style.display = 'none';
        foundPerson = null;
        return;
    }

    foundPerson = data;
    document.getElementById('foundName').textContent = data.full_name || 'Formateur';
    document.getElementById('foundId').textContent = 'ID : ' + data.hubisoccer_id;
    document.getElementById('foundRole').textContent = data.role || data.type_talent || 'Rôle non renseigné';

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
    foundPerson = null;
    document.getElementById('searchResult').style.display = 'none';
    document.getElementById('searchFormateurId').value = '';
    document.getElementById('formateurPoste').value = '';
    document.getElementById('formateurSpecialite').value = '';
    document.getElementById('linkMessage').value = '';
}

async function envoyerInvitation() {
    if (!foundPerson) { return; }

    const poste = (document.getElementById('formateurPoste')?.value || '').trim();
    if (!poste) {
        showToast('Le poste est obligatoire.', 'warning');
        return;
    }

    const payload = {
        academie_id   : academieProfile.hubisoccer_id,
        formateur_id  : foundPerson.hubisoccer_id,
        formateur_nom : foundPerson.full_name || 'Formateur',
        poste         : poste,
        specialite    : (document.getElementById('formateurSpecialite')?.value || '').trim() || null,
        photo_url     : foundPerson.avatar_url || null,
        direction     : 'invitation',
        statut        : 'en_attente',
        message       : (document.getElementById('linkMessage')?.value || '').trim() || null
    };

    showLoader();
    const { error } = await supabaseClient.from(FORMATEURS_TABLE).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast('Invitation envoyée à ' + payload.formateur_nom + '. En attente de sa confirmation. 📨', 'success');
    annulerRecherche();
    await loadLinks();
}

/* ================================================================
   CANDIDATURES REÇUES
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
                    (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.formateur_nom))) +
                '</div>' +
                '<div>' +
                    '<div class="request-name">' + escapeHtml(l.formateur_nom) + '</div>' +
                    '<div class="request-discipline">' + escapeHtml(l.poste || l.specialite || '—') + '</div>' +
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
        .from(FORMATEURS_TABLE)
        .update({ statut: 'accepte' })
        .eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Formateur intégré à votre équipe. 🎉', 'success');
    await loadLinks();
}

async function refuserDemande(linkId) {
    if (!confirm('Refuser cette demande ?')) { return; }
    showLoader();
    const { error } = await supabaseClient
        .from(FORMATEURS_TABLE)
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
   INVITATIONS ENVOYÉES
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
                    (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.formateur_nom))) +
                '</div>' +
                '<div>' +
                    '<div class="request-name">' + escapeHtml(l.formateur_nom) + '</div>' +
                    '<div class="request-discipline">' + escapeHtml(l.poste || l.specialite || '—') + '</div>' +
                '</div>' +
            '</div>' +
            '<span class="request-pending-tag"><i class="fas fa-clock"></i> En attente de sa réponse</span>';
        grid.appendChild(card);
    });
}

/* ================================================================
   MON ÉQUIPE PÉDAGOGIQUE (statut = accepte)
   ================================================================ */
function renderRoster() {
    const grid  = document.getElementById('formateursList');
    const empty = document.getElementById('formateursEmpty');
    if (!grid) { return; }

    const liste = allLinks.filter(function(l) { return l.statut === 'accepte'; });
    grid.querySelectorAll('.formateur-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(l) {
        const card = document.createElement('div');
        card.className = 'formateur-card';
        card.innerHTML =
            '<div class="formateur-avatar">' +
                (l.photo_url ? '<img src="' + escapeHtml(l.photo_url) + '">' : escapeHtml(getInitials(l.formateur_nom))) +
            '</div>' +
            '<div class="formateur-name">' + escapeHtml(l.formateur_nom) + '</div>' +
            (l.poste ? '<div class="formateur-poste">' + escapeHtml(l.poste) + '</div>' : '') +
            (l.specialite ? '<span class="formateur-specialite">' + escapeHtml(l.specialite) + '</span>' : '') +
            '<button class="formateur-remove" data-id="' + l.id + '"><i class="fas fa-user-minus"></i> Retirer de l\'équipe</button>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.formateur-remove').forEach(function(btn) {
        btn.addEventListener('click', function() { retirerFormateur(btn.dataset.id); });
    });
}

async function retirerFormateur(linkId) {
    const link = allLinks.find(function(l) { return String(l.id) === String(linkId); });
    const nom = link ? link.formateur_nom : 'ce formateur';
    if (!confirm('Retirer « ' + nom + ' » de votre équipe pédagogique ?')) { return; }
    showLoader();
    const { error } = await supabaseClient.from(FORMATEURS_TABLE).delete().eq('id', linkId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast(nom + ' a été retiré(e) de votre équipe.', 'info');
    await loadLinks();
}

/* ---------- 11. MENU UTILISATEUR ---------- */
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

/* ---------- 12. SIDEBAR + SWIPE ---------- */
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

/* ---------- 13. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 14. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!academieProfile) { return; }
    await loadLinks();

    initUserMenu();
    initSidebar();

    const btnSearch = document.getElementById('btnSearchFormateur');
    if (btnSearch) { btnSearch.addEventListener('click', rechercherFormateur); }

    const searchInput = document.getElementById('searchFormateurId');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { rechercherFormateur(); }
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
