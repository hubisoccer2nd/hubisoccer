/* ============================================================
   HubISoccer — coach-triple.js
   Page Suivi Triple Projet (Sport · Étude · Carrière) · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_talents  → page Mes Talents (lecture)
   - supabaseAuthPrive_coach_triple   → table de CETTE page
   ------------------------------------------------------------
   Philosophie : chaque talent doit rester en équilibre sur les
   3 volets. Le coach signale tout déséquilibre par une alerte :
   - volet  : 'sport' | 'etude' | 'carriere'
   - statut : 'active' | 'resolue'
   Les alertes ACTIVES remontent automatiquement sur le widget
   "Alertes Triple Projet" du tableau de bord (même table).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';        // partagée
const TALENTS_TABLE  = 'supabaseAuthPrive_coach_talents';   // page Mes Talents (lecture)
const TRIPLE_TABLE   = 'supabaseAuthPrive_coach_triple';    // cette page

/* ---------- 3. MÉTADONNÉES DES VOLETS ---------- */
const VOLETS = {
    sport    : { label: 'Sport',    icone: 'fa-futbol' },
    etude    : { label: 'Étude',    icone: 'fa-graduation-cap' },
    carriere : { label: 'Carrière', icone: 'fa-briefcase' }
};

/* ---------- 4. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let mesTalents     = [];       // liaisons acceptées (sélecteur + équilibre)
let allAlertes     = [];       // toutes les alertes du coach
let editingId      = null;     // alerte en cours d'édition
let currentFilter  = 'all';    // all | sport | etude | carriere

/* ---------- 5. LOADER ---------- */
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

/* ---------- 6. TOAST (durée 30 secondes) ---------- */
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

/* ---------- 7. UTILITAIRES ---------- */
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
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

/* Sécurise la valeur du volet (fallback : sport) */
function voletValide(v) {
    return (v === 'etude' || v === 'carriere') ? v : 'sport';
}

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

/* ---------- 9. CHARGEMENT PROFIL COACH ---------- */
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

/* ---------- 10. CHARGEMENT DES TALENTS (sélecteur + équilibre) ---------- */
async function loadMesTalents() {
    if (!coachProfile) {
        return;
    }
    const { data, error } = await supabaseClient
        .from(TALENTS_TABLE)
        .select('talent_id, talent_nom, talent_type, talent_role')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .eq('statut', 'accepted')
        .order('talent_nom', { ascending: true });

    if (error) {
        console.warn('⚠️ Table ' + TALENTS_TABLE + ' :', error.message);
        mesTalents = [];
    } else {
        mesTalents = data || [];
    }

    /* Remplir le sélecteur du formulaire */
    const select = document.getElementById('tripleTalent');
    const hint   = document.getElementById('noTalentHint');
    if (select) {
        while (select.options.length > 1) {
            select.remove(1);
        }
        mesTalents.forEach(function(t) {
            const opt = document.createElement('option');
            opt.value = t.talent_id;
            opt.textContent = (t.talent_nom || t.talent_id) +
                              (t.talent_type === 'artiste' ? ' 🎵' : ' ⚽');
            opt.dataset.nom  = t.talent_nom || '';
            opt.dataset.type = t.talent_type || 'sportif';
            select.appendChild(opt);
        });
    }
    if (hint) {
        hint.style.display = (mesTalents.length === 0) ? 'block' : 'none';
    }
}

/* ---------- 11. CHARGEMENT DES ALERTES ---------- */
async function loadAlertes() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(TRIPLE_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + TRIPLE_TABLE + ' :', error.message);
        showToast('Table du Triple Projet absente. Exécutez le script SQL <b>coach-espace-tables.sql</b> dans Supabase.', 'warning');
        allAlertes = [];
        return;
    }
    allAlertes = data || [];

    updateStats();
    renderBalance();
    renderActives();
    renderResolues();
}

/* ---------- 12. STATS RAPIDES ---------- */
function updateStats() {
    const actives = allAlertes.filter(function(a) { return a.statut === 'active'; });

    setText('statActives',  actives.length);
    setText('statSport',    actives.filter(function(a) { return voletValide(a.volet) === 'sport'; }).length);
    setText('statEtude',    actives.filter(function(a) { return voletValide(a.volet) === 'etude'; }).length);
    setText('statCarriere', actives.filter(function(a) { return voletValide(a.volet) === 'carriere'; }).length);

    /* Badge de notification = alertes actives (même chiffre que le dashboard) */
    setText('notifBadge', actives.length);
}

/* ---------- 13. ÉQUILIBRE PAR TALENT ----------
   Tous les talents ACCEPTÉS sont affichés, même sans alerte :
   0 alerte  → "Équilibré 🌱"
   1-2       → "À surveiller"
   3 et +    → "En tension"                                    */
function renderBalance() {
    const grid  = document.getElementById('balanceGrid');
    const empty = document.getElementById('balanceEmpty');
    if (!grid) {
        return;
    }
    grid.querySelectorAll('.balance-card').forEach(function(c) { c.remove(); });

    if (mesTalents.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    const actives = allAlertes.filter(function(a) { return a.statut === 'active'; });

    mesTalents.forEach(function(t) {
        const siennes = actives.filter(function(a) { return a.talent_id === t.talent_id; });
        const nSport    = siennes.filter(function(a) { return voletValide(a.volet) === 'sport'; }).length;
        const nEtude    = siennes.filter(function(a) { return voletValide(a.volet) === 'etude'; }).length;
        const nCarriere = siennes.filter(function(a) { return voletValide(a.volet) === 'carriere'; }).length;
        const total     = siennes.length;

        let etatCls, etatTxt, etatIco;
        if (total === 0) {
            etatCls = 'ok';        etatTxt = 'Équilibré'; etatIco = 'fa-seedling';
        } else if (total <= 2) {
            etatCls = 'surveille'; etatTxt = 'À surveiller'; etatIco = 'fa-eye';
        } else {
            etatCls = 'tension';   etatTxt = 'En tension'; etatIco = 'fa-exclamation-triangle';
        }

        const nom  = t.talent_nom || t.talent_id;
        const card = document.createElement('div');
        card.className = 'balance-card';
        card.innerHTML =
            '<div class="balance-head">' +
                '<div class="balance-initials">' + getInitials(nom) + '</div>' +
                '<div class="balance-identity">' +
                    '<div class="balance-name">' + escapeHtml(nom) + '</div>' +
                    '<div class="balance-type">' +
                        (t.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                        (t.talent_role ? ' · ' + escapeHtml(t.talent_role) : '') +
                    '</div>' +
                '</div>' +
                '<span class="balance-state ' + etatCls + '"><i class="fas ' + etatIco + '"></i> ' + etatTxt + '</span>' +
            '</div>' +
            '<div class="balance-volets">' +
                '<div class="bvolet sport"><i class="fas fa-futbol"></i><span class="bvolet-count">' + nSport + '</span><span class="bvolet-label">Sport</span></div>' +
                '<div class="bvolet etude"><i class="fas fa-graduation-cap"></i><span class="bvolet-count">' + nEtude + '</span><span class="bvolet-label">Étude</span></div>' +
                '<div class="bvolet carriere"><i class="fas fa-briefcase"></i><span class="bvolet-count">' + nCarriere + '</span><span class="bvolet-label">Carrière</span></div>' +
            '</div>';
        grid.appendChild(card);
    });
}

/* ---------- 14. CONSTRUCTION D'UNE CARTE D'ALERTE ---------- */
function buildAlertCard(a, mode) {
    /* mode : 'active' ou 'resolue' */
    const volet = voletValide(a.volet);
    const meta  = VOLETS[volet];
    const card  = document.createElement('div');
    card.className = 'alert-card ' + volet + (mode === 'resolue' ? ' resolue' : '');

    let actionsHtml = '';
    if (mode === 'active') {
        actionsHtml =
            '<button class="btn-resolve" data-id="' + a.id + '"><i class="fas fa-check"></i> Résoudre</button>' +
            '<button class="btn-edit" data-id="' + a.id + '"><i class="fas fa-pen"></i></button>' +
            '<button class="btn-delete" data-id="' + a.id + '"><i class="fas fa-trash-alt"></i></button>';
    } else {
        actionsHtml =
            '<button class="btn-reactivate" data-id="' + a.id + '"><i class="fas fa-undo"></i> Réactiver</button>' +
            '<button class="btn-delete" data-id="' + a.id + '"><i class="fas fa-trash-alt"></i></button>';
    }

    card.innerHTML =
        '<div class="alert-volet-ico"><i class="fas ' + meta.icone + '"></i></div>' +
        '<div class="alert-content">' +
            '<div class="alert-topline">' +
                '<span class="alert-talent">' + escapeHtml(a.talent_nom || a.talent_id || 'Talent') + '</span>' +
                '<span class="alert-date"><i class="fas fa-calendar"></i> ' + formatDateFr(a.created_at) + ' · Volet ' + meta.label + '</span>' +
                (mode === 'resolue' ? '<span class="resolue-chip"><i class="fas fa-check"></i> Résolue</span>' : '') +
            '</div>' +
            '<div class="alert-message">' + escapeHtml(a.message || '') + '</div>' +
        '</div>' +
        '<div class="alert-actions">' + actionsHtml + '</div>';

    return card;
}

/* ---------- 15. RENDU : ALERTES ACTIVES ---------- */
function renderActives() {
    const list  = document.getElementById('activeList');
    const empty = document.getElementById('activeEmpty');
    if (!list) {
        return;
    }
    let actives = allAlertes.filter(function(a) { return a.statut === 'active'; });
    if (currentFilter !== 'all') {
        actives = actives.filter(function(a) { return voletValide(a.volet) === currentFilter; });
    }

    list.querySelectorAll('.alert-card').forEach(function(c) { c.remove(); });

    if (actives.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    actives.forEach(function(a) {
        list.appendChild(buildAlertCard(a, 'active'));
    });
    attachCardListeners(list);
}

/* ---------- 16. RENDU : ALERTES RÉSOLUES ---------- */
function renderResolues() {
    const list  = document.getElementById('resolvedList');
    const empty = document.getElementById('resolvedEmpty');
    if (!list) {
        return;
    }
    const resolues = allAlertes.filter(function(a) { return a.statut === 'resolue'; });

    list.querySelectorAll('.alert-card').forEach(function(c) { c.remove(); });

    if (resolues.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    resolues.forEach(function(a) {
        list.appendChild(buildAlertCard(a, 'resolue'));
    });
    attachCardListeners(list);
}

/* ---------- 17. ÉCOUTEURS DES CARTES ---------- */
function attachCardListeners(container) {
    container.querySelectorAll('.btn-resolve').forEach(function(btn) {
        btn.addEventListener('click', function() {
            changerStatut(btn.dataset.id, 'resolue');
        });
    });
    container.querySelectorAll('.btn-reactivate').forEach(function(btn) {
        btn.addEventListener('click', function() {
            changerStatut(btn.dataset.id, 'active');
        });
    });
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerAlerte(btn.dataset.id);
        });
    });
}

/* ---------- 18. CHARGER UNE ALERTE DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(alerteId) {
    const a = allAlertes.find(function(x) { return String(x.id) === String(alerteId); });
    if (!a) {
        return;
    }
    editingId = a.id;

    /* Sélectionner le talent */
    const select = document.getElementById('tripleTalent');
    if (select) {
        let trouve = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === a.talent_id) {
                select.selectedIndex = i;
                trouve = true;
                break;
            }
        }
        if (!trouve && a.talent_id) {
            const opt = document.createElement('option');
            opt.value = a.talent_id;
            opt.textContent = (a.talent_nom || a.talent_id) + ' (liaison terminée)';
            opt.dataset.nom = a.talent_nom || '';
            select.appendChild(opt);
            select.value = a.talent_id;
        }
    }

    /* Sélectionner le volet */
    const radio = document.querySelector('input[name="voletChoice"][value="' + voletValide(a.volet) + '"]');
    if (radio) {
        radio.checked = true;
    }

    document.getElementById('tripleMessage').value = a.message || '';

    const panel = document.getElementById('tripleFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> Modifier l\'alerte de ' +
                          escapeHtml(a.talent_nom || a.talent_id || 'ce talent');
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 19. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    const select = document.getElementById('tripleTalent');
    if (select) { select.selectedIndex = 0; }
    const radioSport = document.querySelector('input[name="voletChoice"][value="sport"]');
    if (radioSport) { radioSport.checked = true; }
    document.getElementById('tripleMessage').value = '';

    const panel = document.getElementById('tripleFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Nouvelle observation / alerte'; }
}

/* ---------- 20. ENREGISTRER L'ALERTE (création ou édition) ---------- */
async function enregistrerAlerte() {
    const select = document.getElementById('tripleTalent');
    const talentId = select ? select.value : '';
    if (!talentId) {
        showToast('Sélectionnez le talent concerné.', 'warning');
        return;
    }
    const message = (document.getElementById('tripleMessage')?.value || '').trim();
    if (!message) {
        showToast('Écrivez l\'observation ou l\'alerte.', 'warning');
        return;
    }
    const radio = document.querySelector('input[name="voletChoice"]:checked');
    const volet = radio ? voletValide(radio.value) : 'sport';
    const opt   = select.options[select.selectedIndex];

    const payload = {
        coach_id   : coachProfile.hubisoccer_id,
        talent_id  : talentId,
        talent_nom : opt.dataset.nom || opt.textContent,
        volet      : volet,
        message    : message
    };

    showLoader();
    let error = null;

    if (editingId) {
        const res = await supabaseClient
            .from(TRIPLE_TABLE)
            .update(payload)
            .eq('id', editingId);
        error = res.error;
    } else {
        payload.statut = 'active';
        const res = await supabaseClient
            .from(TRIPLE_TABLE)
            .insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    if (editingId) {
        showToast('Alerte mise à jour. ✅', 'success');
    } else {
        showToast('Alerte enregistrée. Elle apparaît sur votre tableau de bord. 🔔', 'success');
    }

    resetFormulaire();
    await loadAlertes();
}

/* ---------- 21. CHANGER LE STATUT (résoudre / réactiver) ---------- */
async function changerStatut(alerteId, nouveauStatut) {
    const verbe = (nouveauStatut === 'resolue') ? 'résoudre' : 'réactiver';
    if (!confirm('Confirmez-vous vouloir ' + verbe + ' cette alerte ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(TRIPLE_TABLE)
        .update({ statut: nouveauStatut })
        .eq('id', alerteId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (nouveauStatut === 'resolue') {
        showToast('Alerte résolue. L\'équilibre revient. 🌱', 'success');
    } else {
        showToast('Alerte réactivée.', 'info');
    }
    /* Si on modifiait cette alerte → reset */
    if (String(editingId) === String(alerteId)) {
        resetFormulaire();
    }
    await loadAlertes();
}

/* ---------- 22. SUPPRIMER UNE ALERTE ---------- */
async function supprimerAlerte(alerteId) {
    const a = allAlertes.find(function(x) { return String(x.id) === String(alerteId); });
    const nom = a ? (a.talent_nom || a.talent_id || 'ce talent') : 'ce talent';
    if (!confirm('Supprimer définitivement cette alerte concernant ' + nom + ' ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(TRIPLE_TABLE)
        .delete()
        .eq('id', alerteId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(alerteId)) {
        resetFormulaire();
    }
    showToast('Alerte supprimée.', 'info');
    await loadAlertes();
}

/* ---------- 23. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#activeFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#activeFilters .filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderActives();
        });
    });
}

/* ---------- 24. MENU UTILISATEUR ---------- */
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

/* ---------- 25. SIDEBAR + SWIPE ---------- */
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

/* ---------- 26. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 27. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadMesTalents();
    await loadAlertes();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Boutons du formulaire */
    const btnSave = document.getElementById('btnSaveAlert');
    if (btnSave) {
        btnSave.addEventListener('click', enregistrerAlerte);
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
