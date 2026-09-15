/* ============================================================
   HubISoccer -- parrain-supp.js
   Page Support - Espace Parrain
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles        -> partagee (lecture)
   - supabaseAuthPrive_parrain_support -> table de CETTE page
     (SQL : parrain-supp-table.sql, sans RLS)
   ------------------------------------------------------------
   La FAQ est statique (aucune table) -- elle synthetise les 9
   pages precedentes de l'espace parrain.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const SUPPORT_TABLE  = 'supabaseAuthPrive_parrain_support';

/* ---------- 3. FAQ (STATIQUE -- synthetise l'espace parrain) ---------- */
const FAQ_ITEMS = [
    {
        q: 'Comment ajouter un protege dans "Mes Proteges" ?',
        a: 'Deux facons : saisissez ses informations directement dans Mes Proteges, ou repere-le d\'abord via Scouting et cliquez sur "Parrainer ce talent" -- son nom et son poste seront pre-remplis automatiquement.'
    },
    {
        q: 'Comment obtenir mon statut verifie ?',
        a: 'Dans "Verification du Statut" : remplissez vos informations, televersez les documents demandes, signez, puis soumettez votre demande de licence. L\'equipe HubISoccer l\'examine sous 0 a 100h.'
    },
    {
        q: 'Comment enregistrer un don ou une bourse ?',
        a: 'Rendez-vous dans "Mes Dons & Bourses" pour consigner chaque versement -- il alimentera ensuite vos statistiques dans Mon Impact.'
    },
    {
        q: 'Comment suivre mes sessions de mentorat ?',
        a: 'Chaque echange avec un protege se consigne dans "Sessions de Mentorat" -- date, duree, theme aborde et si les objectifs ont ete atteints.'
    },
    {
        q: 'Comment consulter mon impact global ?',
        a: '"Mon Impact" rassemble vos rapports periodiques (proteges suivis, reussites, montants verses) avec un score moyen calcule automatiquement sur vos indicateurs.'
    },
    {
        q: 'Comment reperer un jeune talent a soutenir ?',
        a: 'Dans "Scouting", parcourez et filtrez les profils par poste ou tranche d\'age, consultez leurs competences, puis "Parrainez"-les directement depuis leur fiche.'
    },
    {
        q: 'Comment televerser mes diplomes et certificats ?',
        a: 'Dans "Diplomes & Certificats", ajoutez le titre, l\'annee et le fichier -- le statut passe a "Valide" une fois verifie par notre equipe.'
    },
    {
        q: 'Comment mon CV Pro devient-il visible aux proteges potentiels ?',
        a: 'Completez les onglets de "Mon CV Pro" puis soumettez-le pour validation -- vous pouvez a tout moment previsualiser et telecharger un PDF de votre profil.'
    }
];

/* ---------- 4. ETAT GLOBAL ---------- */
let currentUser      = null;
let parrainProfile   = null;
let allTickets          = [];

/* ---------- 5. LOADER ---------- */
function showLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'flex'; } }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) { l.style.display = 'none'; } }

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
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
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
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    hideLoader();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=PARRAIN';
        return null;
    }
    currentUser = user;
    return currentUser;
}

/* ---------- 9. CHARGEMENT PROFIL PARRAIN ---------- */
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
    parrainProfile = data;
    setText('userName', parrainProfile.full_name || 'Parrain');
    updateNavbarAvatar();
    return parrainProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = parrainProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(parrainProfile?.full_name || 'P');
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
    if (!parrainProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SUPPORT_TABLE)
        .select('*')
        .eq('parrain_id', parrainProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('Table ' + SUPPORT_TABLE + ' absente :', error.message);
        showToast('Table du support absente. Executez le script SQL <b>parrain-supp-table.sql</b> dans Supabase.', 'warning');
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
        parrain_id : parrainProfile.hubisoccer_id,
        sujet        : sujet,
        categorie     : document.getElementById('tikCategorie')?.value || 'Autre',
        message        : message,
        statut          : 'ouvert'
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
    window.location.href = '../../authprive/users/login.html?role=PARRAIN';
}

/* ---------- 19. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!parrainProfile) { return; }
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
