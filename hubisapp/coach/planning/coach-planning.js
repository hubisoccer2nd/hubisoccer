/* ============================================================
   HubISoccer — coach-planning.js
   Page Planning & Séances · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles        → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_planning  → table de CETTE page
   ------------------------------------------------------------
   Logique des statuts :
   - 'planifiee' + date >= maintenant  → section "À venir"
   - 'planifiee' + date <  maintenant  → historique, badge "À clôturer"
     (le coach a oublié de marquer la séance → bouton Terminée)
   - 'terminee'                        → historique
   - 'annulee'                         → historique
   La séance à venir la plus proche alimente le héros "Prochaine
   séance" ET le widget du tableau de bord (même table).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';         // partagée
const PLANNING_TABLE = 'supabaseAuthPrive_coach_planning';   // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let allSessions    = [];       // toutes les séances du coach
let editingId      = null;     // id de la séance en cours d'édition
let currentFilter  = 'all';    // all | terminee | annulee | a_cloturer

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

function pad2(n) {
    return String(n).padStart(2, '0');
}

/* ISO (base) → valeur pour <input type="datetime-local">
   Conversion en HEURE LOCALE de l'appareil (fuseau respecté) */
function isoToInputValue(iso) {
    const d = new Date(iso);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
           'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/* Valeur du <input datetime-local> → ISO UTC pour la base */
function inputValueToIso(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        return null;
    }
    return d.toISOString();
}

/* Formatage complet : "mardi 21 juillet 2026 à 17:30" */
function formatDateHeure(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* Durée en minutes → "1h30" / "45 min" / "2h" */
function formatDuree(minutes) {
    const m = parseInt(minutes, 10);
    if (!m || isNaN(m)) {
        return '—';
    }
    const h   = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) {
        return min + ' min';
    }
    if (min === 0) {
        return h + 'h';
    }
    return h + 'h' + pad2(min);
}

/* Libellé relatif : Aujourd'hui / Demain / Dans X jours / Il y a X jours */
function libelleRelatif(iso) {
    const now = new Date();
    const d   = new Date(iso);
    const debutAujourdhui = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const debutJourSeance = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffJours = Math.round((debutJourSeance - debutAujourdhui) / 86400000);
    if (diffJours === 0)  { return 'Aujourd\'hui'; }
    if (diffJours === 1)  { return 'Demain'; }
    if (diffJours > 1)    { return 'Dans ' + diffJours + ' jours'; }
    if (diffJours === -1) { return 'Hier'; }
    return 'Il y a ' + Math.abs(diffJours) + ' jours';
}

/* Mois court en français pour le bloc date */
const MOIS_COURTS = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEP','OCT','NOV','DÉC'];

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

/* ---------- 9. CHARGEMENT DES SÉANCES ---------- */
async function loadSessions() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(PLANNING_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('date_seance', { ascending: true });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + PLANNING_TABLE + ' :', error.message);
        showToast('Table du planning absente. Exécutez le script SQL <b>coach-espace-tables.sql</b> dans Supabase.', 'warning');
        allSessions = [];
        return;
    }
    allSessions = data || [];
    updateStats();
    renderNextSession();
    renderUpcoming();
    renderHistory();
}

/* ---------- 10. TRI DES SÉANCES PAR CATÉGORIE ---------- */
function seancesAVenir() {
    const maintenant = new Date();
    return allSessions
        .filter(function(s) {
            return s.statut === 'planifiee' && new Date(s.date_seance) >= maintenant;
        })
        .sort(function(a, b) {
            return new Date(a.date_seance) - new Date(b.date_seance);
        });
}

function seancesHistorique() {
    const maintenant = new Date();
    return allSessions
        .filter(function(s) {
            /* Tout ce qui n'est pas "planifiée dans le futur" */
            return !(s.statut === 'planifiee' && new Date(s.date_seance) >= maintenant);
        })
        .sort(function(a, b) {
            return new Date(b.date_seance) - new Date(a.date_seance);
        });
}

/* Une séance planifiée dont la date est passée = "à clôturer" */
function estACloturer(s) {
    return s.statut === 'planifiee' && new Date(s.date_seance) < new Date();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const avenir = seancesAVenir();
    setText('statAVenir', avenir.length);

    /* Badge de notification = séances à venir */
    setText('notifBadge', avenir.length);

    const now = new Date();
    const ceMois = allSessions.filter(function(s) {
        const d = new Date(s.date_seance);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    setText('statCeMois', ceMois.length);

    const terminees = allSessions.filter(function(s) { return s.statut === 'terminee'; });
    setText('statTerminees', terminees.length);

    /* Volume horaire du mois : somme des durées (hors annulées) */
    let minutesMois = 0;
    ceMois.forEach(function(s) {
        if (s.statut !== 'annulee') {
            minutesMois += parseInt(s.duree_minutes, 10) || 0;
        }
    });
    setText('statHeuresMois', formatDuree(minutesMois));
}

/* ---------- 12. HÉROS "PROCHAINE SÉANCE" ---------- */
function renderNextSession() {
    const card = document.getElementById('nextSessionCard');
    if (!card) {
        return;
    }
    const avenir = seancesAVenir();
    if (avenir.length === 0) {
        card.style.display = 'none';
        return;
    }
    const s = avenir[0];
    card.style.display = 'flex';

    setText('nextTheme', s.theme || 'Séance sans thème');
    setText('nextWhen', libelleRelatif(s.date_seance) + ' — ' + formatDateHeure(s.date_seance) +
                        ' · ' + formatDuree(s.duree_minutes));

    const lieuP = document.getElementById('nextLieu');
    if (lieuP) {
        if (s.lieu) {
            lieuP.style.display = 'block';
            lieuP.querySelector('span').textContent = s.lieu;
        } else {
            lieuP.style.display = 'none';
        }
    }

    /* Chips d'objectifs Trinité */
    const wrap = document.getElementById('nextObjectifs');
    if (wrap) {
        wrap.innerHTML = '';
        const objectifs = [
            { cls: 'corps',  ico: 'fa-dumbbell', txt: s.objectif_corps },
            { cls: 'ame',    ico: 'fa-brain',    txt: s.objectif_ame },
            { cls: 'esprit', ico: 'fa-futbol',   txt: s.objectif_esprit }
        ];
        objectifs.forEach(function(o) {
            if (o.txt) {
                const chip = document.createElement('span');
                chip.className = 'next-obj-chip ' + o.cls;
                chip.innerHTML = '<i class="fas ' + o.ico + '"></i> ' + escapeHtml(o.txt);
                wrap.appendChild(chip);
            }
        });
    }
}

/* ---------- 13. CONSTRUCTION D'UNE CARTE DE SÉANCE ---------- */
function buildSessionCard(s, mode) {
    /* mode : 'upcoming' ou 'history' */
    const d    = new Date(s.date_seance);
    const card = document.createElement('div');
    card.className = 'session-card';

    /* Badges de statut selon le contexte */
    let badges = '';
    if (mode === 'upcoming') {
        badges = '<span class="relative-badge"><i class="fas fa-clock"></i> ' + libelleRelatif(s.date_seance) + '</span>';
    } else {
        if (s.statut === 'terminee') {
            badges = '<span class="statut-badge terminee"><i class="fas fa-check"></i> Terminée</span>';
        } else if (s.statut === 'annulee') {
            badges = '<span class="statut-badge annulee"><i class="fas fa-ban"></i> Annulée</span>';
        } else if (estACloturer(s)) {
            badges = '<span class="statut-badge a-cloturer"><i class="fas fa-exclamation-circle"></i> À clôturer</span>';
        }
    }

    /* Chips d'objectifs Trinité (uniquement ceux renseignés) */
    let objectifsHtml = '';
    if (s.objectif_corps || s.objectif_ame || s.objectif_esprit) {
        objectifsHtml = '<div class="session-objectifs">' +
            (s.objectif_corps  ? '<span class="obj-chip corps"><i class="fas fa-dumbbell"></i> '  + escapeHtml(s.objectif_corps)  + '</span>' : '') +
            (s.objectif_ame    ? '<span class="obj-chip ame"><i class="fas fa-brain"></i> '       + escapeHtml(s.objectif_ame)    + '</span>' : '') +
            (s.objectif_esprit ? '<span class="obj-chip esprit"><i class="fas fa-futbol"></i> '   + escapeHtml(s.objectif_esprit) + '</span>' : '') +
        '</div>';
    }

    /* Boutons selon le contexte */
    let actionsHtml = '';
    if (mode === 'upcoming') {
        actionsHtml =
            '<button class="btn-done" data-id="' + s.id + '"><i class="fas fa-check"></i> Terminée</button>' +
            '<button class="btn-edit" data-id="' + s.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-cancel-session" data-id="' + s.id + '"><i class="fas fa-ban"></i> Annuler</button>';
    } else {
        actionsHtml =
            (estACloturer(s) ? '<button class="btn-done" data-id="' + s.id + '"><i class="fas fa-check"></i> Terminée</button>' : '') +
            '<button class="btn-delete" data-id="' + s.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>';
    }

    card.innerHTML =
        '<div class="session-datebox">' +
            '<span class="session-day">' + d.getDate() + '</span>' +
            '<span class="session-month">' + MOIS_COURTS[d.getMonth()] + ' ' + d.getFullYear() + '</span>' +
            '<span class="session-time">' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '</span>' +
        '</div>' +
        '<div class="session-body">' +
            '<div class="session-topline">' +
                '<span class="session-theme">' + escapeHtml(s.theme || 'Séance sans thème') + '</span>' +
                badges +
            '</div>' +
            '<div class="session-details">' +
                '<span><i class="fas fa-stopwatch"></i> ' + formatDuree(s.duree_minutes) + '</span>' +
                (s.lieu ? '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(s.lieu) + '</span>' : '') +
            '</div>' +
            objectifsHtml +
            (s.notes ? '<div class="session-notes"><i class="fas fa-sticky-note"></i> ' + escapeHtml(s.notes) + '</div>' : '') +
        '</div>' +
        '<div class="session-actions">' + actionsHtml + '</div>';

    return card;
}

/* ---------- 14. RENDU : SÉANCES À VENIR ---------- */
function renderUpcoming() {
    const list  = document.getElementById('upcomingList');
    const empty = document.getElementById('upcomingEmpty');
    if (!list) {
        return;
    }
    const avenir = seancesAVenir();

    list.querySelectorAll('.session-card').forEach(function(c) { c.remove(); });

    if (avenir.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    avenir.forEach(function(s) {
        list.appendChild(buildSessionCard(s, 'upcoming'));
    });

    attachCardListeners(list);
}

/* ---------- 15. RENDU : HISTORIQUE ---------- */
function renderHistory() {
    const list  = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!list) {
        return;
    }
    let histo = seancesHistorique();

    /* Filtres */
    if (currentFilter === 'terminee') {
        histo = histo.filter(function(s) { return s.statut === 'terminee'; });
    } else if (currentFilter === 'annulee') {
        histo = histo.filter(function(s) { return s.statut === 'annulee'; });
    } else if (currentFilter === 'a_cloturer') {
        histo = histo.filter(function(s) { return estACloturer(s); });
    }

    list.querySelectorAll('.session-card').forEach(function(c) { c.remove(); });

    if (histo.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    histo.forEach(function(s) {
        list.appendChild(buildSessionCard(s, 'history'));
    });

    attachCardListeners(list);
}

/* ---------- 16. ÉCOUTEURS DES BOUTONS DE CARTES ---------- */
function attachCardListeners(container) {
    container.querySelectorAll('.btn-done').forEach(function(btn) {
        btn.addEventListener('click', function() {
            marquerTerminee(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-cancel-session').forEach(function(btn) {
        btn.addEventListener('click', function() {
            annulerSeance(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerSeance(btn.dataset.id);
        });
    });
}

/* ---------- 17. CHARGER UNE SÉANCE DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(sessionId) {
    const s = allSessions.find(function(x) { return String(x.id) === String(sessionId); });
    if (!s) {
        return;
    }
    editingId = s.id;

    document.getElementById('sessionDate').value  = isoToInputValue(s.date_seance);
    document.getElementById('sessionDuree').value = s.duree_minutes || 90;
    document.getElementById('sessionTheme').value = s.theme || '';
    document.getElementById('sessionLieu').value  = s.lieu || '';
    document.getElementById('objCorps').value     = s.objectif_corps || '';
    document.getElementById('objAme').value       = s.objectif_ame || '';
    document.getElementById('objEsprit').value    = s.objectif_esprit || '';
    document.getElementById('sessionNotes').value = s.notes || '';

    const panel = document.getElementById('sessionFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> Modifier la séance' +
                          (s.theme ? ' — ' + escapeHtml(s.theme) : '');
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 18. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('sessionDate').value  = '';
    document.getElementById('sessionDuree').value = 90;
    document.getElementById('sessionTheme').value = '';
    document.getElementById('sessionLieu').value  = '';
    document.getElementById('objCorps').value     = '';
    document.getElementById('objAme').value       = '';
    document.getElementById('objEsprit').value    = '';
    document.getElementById('sessionNotes').value = '';

    const panel = document.getElementById('sessionFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Planifier une séance'; }
}

/* ---------- 19. ENREGISTRER LA SÉANCE (création ou édition) ---------- */
async function enregistrerSeance() {
    const dateValue = document.getElementById('sessionDate')?.value || '';
    if (!dateValue) {
        showToast('Choisissez la date et l\'heure de la séance.', 'warning');
        return;
    }
    const dateIso = inputValueToIso(dateValue);
    if (!dateIso) {
        showToast('Date invalide. Vérifiez votre saisie.', 'warning');
        return;
    }

    let duree = parseInt(document.getElementById('sessionDuree')?.value, 10);
    if (isNaN(duree) || duree < 15) {
        duree = 90;
    }

    const payload = {
        coach_id        : coachProfile.hubisoccer_id,
        date_seance     : dateIso,
        duree_minutes   : duree,
        theme           : (document.getElementById('sessionTheme')?.value || '').trim() || null,
        lieu            : (document.getElementById('sessionLieu')?.value || '').trim() || null,
        objectif_corps  : (document.getElementById('objCorps')?.value || '').trim() || null,
        objectif_ame    : (document.getElementById('objAme')?.value || '').trim() || null,
        objectif_esprit : (document.getElementById('objEsprit')?.value || '').trim() || null,
        notes           : (document.getElementById('sessionNotes')?.value || '').trim() || null
    };

    showLoader();
    let error = null;

    if (editingId) {
        const res = await supabaseClient
            .from(PLANNING_TABLE)
            .update(payload)
            .eq('id', editingId);
        error = res.error;
    } else {
        payload.statut = 'planifiee';
        const res = await supabaseClient
            .from(PLANNING_TABLE)
            .insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    if (editingId) {
        showToast('Séance mise à jour. ✅', 'success');
    } else {
        showToast('Séance planifiée ! Elle apparaît aussi sur votre tableau de bord. 📅', 'success');
    }

    resetFormulaire();
    await loadSessions();
}

/* ---------- 20. MARQUER TERMINÉE ---------- */
async function marquerTerminee(sessionId) {
    if (!confirm('Marquer cette séance comme terminée ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(PLANNING_TABLE)
        .update({ statut: 'terminee' })
        .eq('id', sessionId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Séance clôturée. Bien joué coach ! 💪🏾', 'success');
    await loadSessions();
}

/* ---------- 21. ANNULER UNE SÉANCE ---------- */
async function annulerSeance(sessionId) {
    if (!confirm('Annuler cette séance ?\n\nElle restera visible dans l\'historique avec le statut "Annulée".')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(PLANNING_TABLE)
        .update({ statut: 'annulee' })
        .eq('id', sessionId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    /* Si on annulait la séance en cours d'édition → reset */
    if (String(editingId) === String(sessionId)) {
        resetFormulaire();
    }
    showToast('Séance annulée.', 'info');
    await loadSessions();
}

/* ---------- 22. SUPPRIMER UNE SÉANCE ---------- */
async function supprimerSeance(sessionId) {
    if (!confirm('Supprimer définitivement cette séance de l\'historique ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(PLANNING_TABLE)
        .delete()
        .eq('id', sessionId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(sessionId)) {
        resetFormulaire();
    }
    showToast('Séance supprimée.', 'info');
    await loadSessions();
}

/* ---------- 23. FILTRES HISTORIQUE ---------- */
function initFilters() {
    document.querySelectorAll('#historyFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#historyFilters .filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderHistory();
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
    await loadSessions();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Bouton d'enregistrement */
    const btnSave = document.getElementById('btnSaveSession');
    if (btnSave) {
        btnSave.addEventListener('click', enregistrerSeance);
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
