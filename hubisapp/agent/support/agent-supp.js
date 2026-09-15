/* ============================================================
   HubISoccer -- agent-supp.js
   Page Support - Espace Agent FIFA
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       -> partagee (lecture)
   - supabaseAuthPrive_agent_support  -> table de CETTE page
     (SQL : agent-supp-table.sql, sans RLS)
   ------------------------------------------------------------
   La FAQ est statique (aucune table) -- elle synthetise les 8
   pages precedentes de l'espace agent.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const SUPPORT_TABLE  = 'supabaseAuthPrive_agent_support';

/* ---------- 3. FAQ (STATIQUE -- synthetise l'espace agent) ---------- */
const FAQ_ITEMS = [
    {
        q: 'Comment inviter un talent dans "Mes Talents" ?',
        a: 'Recherchez son ID HubISoccer, choisissez son type (sportif ou artiste), sa discipline, et envoyez une invitation. Il/elle doit l\'accepter pour rejoindre votre portefeuille.'
    },
    {
        q: 'Comment obtenir ma licence FIFA verifiee ?',
        a: 'Dans "Verification du Statut" : saisissez vos informations de licence, televersez les 5 documents requis, signez, puis soumettez votre dossier. L\'equipe HubISoccer l\'examine sous 0 a 100h.'
    },
    {
        q: 'Quelle difference entre "Mes Commissions" et "Mes Revenus" ?',
        a: 'Mes Commissions calcule automatiquement vos gains a partir de vos contrats signes (montant x taux). Mes Revenus est votre compte bancaire HubIS Wallet reel -- depots, retraits, transactions.'
    },
    {
        q: 'Comment enregistrer un nouveau contrat ?',
        a: 'Dans "Mes Contrats", le talent concerne doit d\'abord figurer dans votre portefeuille accepte ("Mes Talents") avant d\'apparaitre dans le menu deroulant du formulaire.'
    },
    {
        q: 'Comment suivre le renouvellement de ma licence et ma formation continue ?',
        a: 'Dans "Licence FIFA" : ajoutez chaque renouvellement dans l\'historique, et chaque formation suivie avec ses heures -- tout est compte automatiquement dans les statistiques du haut.'
    },
    {
        q: 'Comment imprimer mon certificat de licence ?',
        a: 'Dans "Licence FIFA", section Certificat officiel : le bouton "Imprimer / Telecharger en PDF" genere une version propre, sans menu ni formulaire visible.'
    },
    {
        q: 'Comment mon CV Pro devient-il visible aux talents et clubs ?',
        a: 'Activez l\'interrupteur de visibilite publique dans "Mon CV Pro". Une fois active, votre presentation, votre parcours et votre palmares sont consultables par la communaute HubISoccer.'
    },
    {
        q: 'Un talent a refuse mon invitation, que faire ?',
        a: 'Rien ne vous empeche de le recontacter plus tard ou de vous concentrer sur d\'autres profils via "Decouvrez mes talents" pour identifier de nouveaux talents a approcher.'
    }
];

/* ---------- 4. ETAT GLOBAL ---------- */
let currentUser  = null;
let agentProfile = null;
let allTickets      = [];

/* ---------- 5. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 6. TOAST (duree 30 secondes) ---------- */
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

/* ---------- 7. UTILITAIRES ---------- */
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

const STATUT_LABELS = { ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Resolu' };
const STATUT_ICONS  = { ouvert: 'fa-envelope-open-text', en_cours: 'fa-spinner', resolu: 'fa-check-double' };

/* ---------- 8. SESSION ---------- */
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

/* ---------- 9. CHARGEMENT PROFIL AGENT ---------- */
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

/* ---------- 10. RENDU DE LA FAQ (ACCORDION) ---------- */
function renderFaq() {
    const container = document.getElementById('faqList');
    if (!container) { return; }
    FAQ_ITEMS.forEach(function(item, idx) {
        const el = document.createElement('div');
        el.className = 'faq-item';
        el.innerHTML =
            '<div class="faq-question" data-idx="' + idx + '">' +
                '<span>' + escapeHtml(item.q) + '</span>' +
                '<i class="fas fa-chevron-down chevron"></i>' +
            '</div>' +
            '<div class="faq-answer">' +
                '<div class="faq-answer-inner">' + escapeHtml(item.a) + '</div>' +
            '</div>';
        container.appendChild(el);
    });

    container.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            q.closest('.faq-item').classList.toggle('open');
        });
    });
}

/* ---------- 11. CHARGEMENT DES TICKETS ---------- */
async function loadTickets() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SUPPORT_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + SUPPORT_TABLE + ' absente :', error.message);
        showToast('Table du support absente. Executez le script SQL <b>agent-supp-table.sql</b> dans Supabase.', 'warning');
        allTickets = [];
        return;
    }
    allTickets = data || [];
    updateStats();
    renderTickets();
}

/* ---------- 12. STATS RAPIDES ---------- */
function updateStats() {
    const ouverts = allTickets.filter(function(t) { return t.statut === 'ouvert'; }).length;
    const enCours = allTickets.filter(function(t) { return t.statut === 'en_cours'; }).length;
    const resolus = allTickets.filter(function(t) { return t.statut === 'resolu'; }).length;

    setText('statTotal', allTickets.length);
    setText('statOuvert', ouverts);
    setText('statEnCours', enCours);
    setText('statResolu', resolus);
}

/* ---------- 13. CONSTRUCTION D'UNE CARTE TICKET ---------- */
function buildTicketCard(t) {
    const card = document.createElement('div');
    card.className = 'ticket-card statut-' + t.statut;

    card.innerHTML =
        '<div class="ticket-sujet">' + escapeHtml(t.sujet) + '</div>' +
        '<div class="ticket-categorie"><i class="fas fa-tag"></i> ' + escapeHtml(t.categorie) + '</div>' +
        '<span class="ticket-status-badge statut-' + t.statut + '">' +
            '<i class="fas ' + STATUT_ICONS[t.statut] + '"></i> ' + STATUT_LABELS[t.statut] +
        '</span>' +
        '<div class="ticket-message">' + escapeHtml(t.message) + '</div>' +
        '<div class="ticket-date"><i class="fas fa-calendar"></i> Envoye le ' + formatDateFr(t.created_at) + '</div>' +
        (t.reponse_admin
            ? '<div class="ticket-reponse"><strong>Reponse du support</strong>' + escapeHtml(t.reponse_admin) + '</div>'
            : '');

    return card;
}

/* ---------- 14. RENDU DE LA LISTE ---------- */
function renderTickets() {
    const grid  = document.getElementById('ticketsGrid');
    const empty = document.getElementById('ticketsEmpty');
    if (!grid) { return; }

    grid.querySelectorAll('.ticket-card').forEach(function(c) { c.remove(); });

    if (allTickets.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    allTickets.forEach(function(t) { grid.appendChild(buildTicketCard(t)); });
}

/* ---------- 15. ENVOYER UN TICKET ---------- */
async function envoyerTicket() {
    const sujet   = (document.getElementById('tikSujet')?.value || '').trim();
    const message = (document.getElementById('tikMessage')?.value || '').trim();

    if (!sujet) {
        showToast('Le sujet est obligatoire.', 'warning');
        return;
    }
    if (!message) {
        showToast('Merci de decrire votre demande.', 'warning');
        return;
    }

    const payload = {
        agent_id   : agentProfile.hubisoccer_id,
        sujet       : sujet,
        categorie    : document.getElementById('tikCategorie')?.value || 'Autre',
        message      : message,
        statut       : 'ouvert'
    };

    showLoader();
    const { error } = await supabaseClient.from(SUPPORT_TABLE).insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    document.getElementById('tikSujet').value = '';
    document.getElementById('tikCategorie').value = 'Autre';
    document.getElementById('tikMessage').value = '';

    showToast('Votre message a ete envoye. Nous repondons sous 0 a 100h.', 'success');
    await loadTickets();
}

/* ---------- 16. MENU UTILISATEUR ---------- */
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

/* ---------- 17. SIDEBAR + SWIPE ---------- */
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

/* ---------- 18. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 19. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadTickets();

    renderFaq();
    initUserMenu();
    initSidebar();

    const btnSend = document.getElementById('btnSendTicket');
    if (btnSend) { btnSend.addEventListener('click', envoyerTicket); }

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
