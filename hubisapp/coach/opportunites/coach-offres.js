/* ============================================================
   HubISoccer — coach-offres.js
   Page Opportunités & Offres · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles      → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_offres  → table de CETTE page
     (SQL : coach-offres-table.sql, sans RLS)
   ------------------------------------------------------------
   Une seule table pour les deux sens du recrutement :
   direction = 'candidature' (le coach postule) ou 'recue'
   (une structure propose une offre au coach).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';     // partagée
const OFFRES_TABLE   = 'supabaseAuthPrive_coach_offres'; // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser  = null;
let coachProfile = null;
let allOffres    = [];    // toutes les candidatures/offres du coach
let editingId    = null;  // id en cours d'édition

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'flex';
    }
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'none';
    }
}

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
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
        setTimeout(function() {
            if (t.parentNode) {
                t.remove();
            }
        }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (t.parentNode) {
                    t.remove();
                }
            }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (value !== null && value !== undefined) {
            el.textContent = value;
        } else {
            el.textContent = '—';
        }
    }
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function escapeHtml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateFr(iso) {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

const STATUT_LABELS = {
    en_attente    : 'En attente',
    en_discussion : 'En discussion',
    acceptee      : 'Acceptée',
    refusee       : 'Refusée'
};
const STATUT_ICONS = {
    en_attente    : 'fa-hourglass-half',
    en_discussion : 'fa-comments',
    acceptee      : 'fa-handshake',
    refusee       : 'fa-times-circle'
};

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

/* ---------- 8. CHARGEMENT PROFIL COACH ---------- */
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
    coachProfile = data;
    setText('userName', coachProfile.full_name || 'Coach / Entraîneur');
    updateNavbarAvatar();
    return coachProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = coachProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(coachProfile?.full_name || 'C');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 9. CHARGEMENT DES CANDIDATURES/OFFRES ---------- */
async function loadOffres() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(OFFRES_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('date_evenement', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + OFFRES_TABLE + ' :', error.message);
        showToast('Table des opportunités absente. Exécutez le script SQL <b>coach-offres-table.sql</b> dans Supabase.', 'warning');
        allOffres = [];
        return;
    }
    allOffres = data || [];

    updateStats();
    renderCandidatures();
    renderRecues();
}

/* ---------- 10. STATS RAPIDES ---------- */
function updateStats() {
    const candidatures = allOffres.filter(function(o) { return o.direction === 'candidature'; });
    const recues       = allOffres.filter(function(o) { return o.direction === 'recue'; });
    const discussion   = allOffres.filter(function(o) { return o.statut === 'en_discussion'; });
    const acceptees    = allOffres.filter(function(o) { return o.statut === 'acceptee'; });

    setText('statCandidatures', candidatures.length);
    setText('statRecues', recues.length);
    setText('statDiscussion', discussion.length);
    setText('statAcceptees', acceptees.length);

    /* Badge de notification = offres reçues encore en attente d'examen */
    const recuesEnAttente = recues.filter(function(o) { return o.statut === 'en_attente'; }).length;
    setText('notifBadge', recuesEnAttente);
}

/* ---------- 11. CONSTRUCTION D'UNE CARTE ---------- */
function buildOffreCard(o) {
    const card = document.createElement('div');
    card.className = 'offre-card statut-' + o.statut;

    card.innerHTML =
        '<div>' +
            '<div class="offre-structure">' + escapeHtml(o.structure) + '</div>' +
            (o.poste ? '<div class="offre-poste">' + escapeHtml(o.poste) + '</div>' : '') +
        '</div>' +
        '<span class="offre-status-badge statut-' + o.statut + '">' +
            '<i class="fas ' + STATUT_ICONS[o.statut] + '"></i> ' + STATUT_LABELS[o.statut] +
        '</span>' +
        '<div class="offre-meta">' +
            '<span><i class="fas fa-calendar"></i>' +
                (o.direction === 'candidature' ? 'Envoyée le ' : 'Reçue le ') + formatDateFr(o.date_evenement) +
            '</span>' +
            (o.contact ? '<span><i class="fas fa-address-book"></i>' + escapeHtml(o.contact) + '</span>' : '') +
        '</div>' +
        (o.description ? '<div class="offre-desc">' + escapeHtml(o.description) + '</div>' : '') +
        '<div class="offre-actions">' +
            '<button class="btn-edit" data-id="' + o.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + o.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 12. RENDU DES CANDIDATURES ---------- */
function renderCandidatures() {
    const grid  = document.getElementById('candidaturesGrid');
    const empty = document.getElementById('candidaturesEmpty');
    if (!grid) {
        return;
    }
    const liste = allOffres.filter(function(o) { return o.direction === 'candidature'; });

    grid.querySelectorAll('.offre-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(o) { grid.appendChild(buildOffreCard(o)); });
    attachCardListeners(grid);
}

/* ---------- 13. RENDU DES OFFRES REÇUES ---------- */
function renderRecues() {
    const grid  = document.getElementById('recuesGrid');
    const empty = document.getElementById('recuesEmpty');
    if (!grid) {
        return;
    }
    const liste = allOffres.filter(function(o) { return o.direction === 'recue'; });

    grid.querySelectorAll('.offre-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(o) { grid.appendChild(buildOffreCard(o)); });
    attachCardListeners(grid);
}

/* ---------- 14. ÉCOUTEURS DES CARTES ---------- */
function attachCardListeners(container) {
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerOffre(btn.dataset.id);
        });
    });
}

/* ---------- 15. LIBELLÉ DYNAMIQUE DE LA DATE SELON LE SENS ---------- */
function majLibelleDate() {
    const direction = document.querySelector('input[name="offreDirection"]:checked')?.value || 'candidature';
    const label = document.getElementById('offDateLabel');
    if (label) {
        label.textContent = direction === 'candidature' ? "Date d'envoi *" : 'Date de réception *';
    }
}

function initDirectionRadios() {
    document.querySelectorAll('input[name="offreDirection"]').forEach(function(radio) {
        radio.addEventListener('change', majLibelleDate);
    });
    majLibelleDate();
}

/* ---------- 16. CHARGER UNE ENTRÉE DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(offreId) {
    const o = allOffres.find(function(x) { return String(x.id) === String(offreId); });
    if (!o) {
        return;
    }
    editingId = o.id;

    document.querySelectorAll('input[name="offreDirection"]').forEach(function(radio) {
        radio.checked = (radio.value === o.direction);
    });
    majLibelleDate();

    document.getElementById('offStructure').value   = o.structure || '';
    document.getElementById('offPoste').value       = o.poste || '';
    document.getElementById('offDate').value        = o.date_evenement || '';
    document.getElementById('offContact').value     = o.contact || '';
    document.getElementById('offStatut').value      = o.statut || 'en_attente';
    document.getElementById('offDescription').value = o.description || '';

    const panel = document.getElementById('offreFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(o.structure) + ' »';
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 17. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.querySelectorAll('input[name="offreDirection"]').forEach(function(radio) {
        radio.checked = (radio.value === 'candidature');
    });
    majLibelleDate();
    document.getElementById('offStructure').value   = '';
    document.getElementById('offPoste').value       = '';
    document.getElementById('offDate').value        = '';
    document.getElementById('offContact').value     = '';
    document.getElementById('offStatut').value      = 'en_attente';
    document.getElementById('offDescription').value = '';

    const panel = document.getElementById('offreFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une candidature ou une offre'; }
}

/* ---------- 18. ENREGISTRER (création ou édition) ---------- */
async function enregistrerOffre() {
    const structure = (document.getElementById('offStructure')?.value || '').trim();
    const date      = document.getElementById('offDate')?.value || '';

    if (!structure) {
        showToast('Le nom de la structure est obligatoire.', 'warning');
        return;
    }
    if (!date) {
        showToast('La date est obligatoire.', 'warning');
        return;
    }

    const direction = document.querySelector('input[name="offreDirection"]:checked')?.value || 'candidature';

    const payload = {
        coach_id       : coachProfile.hubisoccer_id,
        direction      : direction,
        structure      : structure,
        poste          : (document.getElementById('offPoste')?.value || '').trim() || null,
        date_evenement : date,
        contact        : (document.getElementById('offContact')?.value || '').trim() || null,
        statut         : document.getElementById('offStatut')?.value || 'en_attente',
        description    : (document.getElementById('offDescription')?.value || '').trim() || null
    };

    showLoader();
    let error = null;
    if (editingId) {
        const res = await supabaseClient
            .from(OFFRES_TABLE)
            .update(payload)
            .eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient
            .from(OFFRES_TABLE)
            .insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    showToast(editingId ? 'Entrée mise à jour. ✅' : 'Ajoutée à votre suivi. 💼', 'success');
    resetFormulaire();
    await loadOffres();
}

/* ---------- 19. SUPPRIMER ---------- */
async function supprimerOffre(offreId) {
    const o = allOffres.find(function(x) { return String(x.id) === String(offreId); });
    const nom = o ? o.structure : 'cette entrée';
    if (!confirm('Supprimer « ' + nom + ' » de votre suivi ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(OFFRES_TABLE)
        .delete()
        .eq('id', offreId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(offreId)) {
        resetFormulaire();
    }
    showToast('Entrée supprimée.', 'info');
    await loadOffres();
}

/* ---------- 20. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) {
        return;
    }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

/* ---------- 21. SIDEBAR + SWIPE ---------- */
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
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        if (dx > 0 && sx < 40) {
            open();
        } else if (dx < 0) {
            close();
        }
    }, { passive: false });
}

/* ---------- 22. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 23. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadOffres();

    initUserMenu();
    initSidebar();
    initDirectionRadios();

    /* Boutons du formulaire */
    const btnSave = document.getElementById('btnSaveOffre');
    if (btnSave) {
        btnSave.addEventListener('click', enregistrerOffre);
    }
    const btnReset = document.getElementById('btnResetForm');
    if (btnReset) {
        btnReset.addEventListener('click', resetFormulaire);
    }

    /* Déconnexion */
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    /* Sélecteur de langue */
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
