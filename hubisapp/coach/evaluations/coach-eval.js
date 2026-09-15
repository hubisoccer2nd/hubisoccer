/* ============================================================
   HubISoccer — coach-eval.js
   Page Évaluations & Scouting · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_talents  → page Mes Talents (lecture :
     liste des talents acceptés pour remplir le sélecteur)
   - supabaseAuthPrive_coach_eval     → table de CETTE page
   ------------------------------------------------------------
   Workflow :
   1. Le coach sélectionne un talent lié (liaison 'accepted')
   2. Deux options :
      a. "Planifier" → ligne statut 'pending' (à faire plus tard)
      b. "Enregistrer" → ligne statut 'done' avec note + rapport
   3. Les évaluations 'pending' apparaissent dans "À faire"
      avec un bouton Compléter (pré-remplit le formulaire)
   4. Les 'done' apparaissent dans l'Historique (modifier/supprimer)
   5. URL ?talent=ID → pré-sélectionne le talent (vient de la
      page Mes Talents, bouton "Évaluer")
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
const EVAL_TABLE     = 'supabaseAuthPrive_coach_eval';      // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let mesTalents     = [];       // liaisons acceptées (pour le sélecteur)
let allEvals       = [];       // toutes les évaluations du coach
let editingId      = null;     // id de l'évaluation en cours d'édition (null = création)
let currentFilter  = 'all';    // all | sportif | artiste

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
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

/* Période par défaut : mois courant en français, ex "Juillet 2026" */
function periodeCourante() {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const d = new Date();
    return mois[d.getMonth()] + ' ' + d.getFullYear();
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

/* ---------- 9. CHARGEMENT DES TALENTS LIÉS (sélecteur) ---------- */
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

    /* Remplir le <select> */
    const select = document.getElementById('evalTalent');
    const hint   = document.getElementById('noTalentHint');
    if (!select) {
        return;
    }
    /* Nettoyer (on garde la première option placeholder) */
    while (select.options.length > 1) {
        select.remove(1);
    }
    mesTalents.forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.talent_id;
        opt.textContent = (t.talent_nom || t.talent_id) +
                          (t.talent_type === 'artiste' ? ' 🎵' : ' ⚽') +
                          (t.talent_role ? ' — ' + t.talent_role : '');
        opt.dataset.nom  = t.talent_nom || '';
        opt.dataset.type = t.talent_type || 'sportif';
        select.appendChild(opt);
    });
    if (hint) {
        hint.style.display = (mesTalents.length === 0) ? 'block' : 'none';
    }
}

/* ---------- 10. PRÉ-SÉLECTION VIA URL ?talent=ID ---------- */
function preselectFromUrl() {
    const params   = new URLSearchParams(window.location.search);
    const talentId = params.get('talent');
    if (!talentId) {
        return;
    }
    const select = document.getElementById('evalTalent');
    if (!select) {
        return;
    }
    /* Sélectionner l'option correspondante si elle existe */
    let trouve = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === talentId) {
            select.selectedIndex = i;
            trouve = true;
            break;
        }
    }
    if (trouve) {
        showToast('Talent pré-sélectionné depuis "Mes Talents". Complétez l\'évaluation ci-dessous. ✍🏾', 'info');
        document.getElementById('evalFormPanel')?.scrollIntoView({ behavior: 'smooth' });
    } else {
        showToast('Ce talent n\'est pas (ou plus) dans votre effectif accepté.', 'warning');
    }
}

/* ---------- 11. CHARGEMENT DES ÉVALUATIONS ---------- */
async function loadEvals() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(EVAL_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + EVAL_TABLE + ' :', error.message);
        showToast('Table des évaluations absente. Exécutez le script SQL <b>coach-espace-tables.sql</b> dans Supabase.', 'warning');
        allEvals = [];
        return;
    }
    allEvals = data || [];
    updateStats();
    renderPending();
    renderHistory();
}

/* ---------- 12. STATS RAPIDES ---------- */
function updateStats() {
    const pendings = allEvals.filter(function(e) { return e.statut === 'pending'; });
    const dones    = allEvals.filter(function(e) { return e.statut === 'done'; });

    setText('statPending', pendings.length);
    setText('statDone',    dones.length);

    /* Badge de notification = évaluations à faire */
    setText('notifBadge', pendings.length);

    /* Note moyenne des évaluations réalisées */
    const notes = dones
        .map(function(e) { return e.note_globale; })
        .filter(function(n) { return n !== null && n !== undefined && !isNaN(n); });
    if (notes.length > 0) {
        const somme = notes.reduce(function(a, b) { return a + Number(b); }, 0);
        setText('statMoyenne', Math.round(somme / notes.length) + '/100');
    } else {
        setText('statMoyenne', '—');
    }

    /* Nombre de talents distincts évalués (done) */
    const distincts = {};
    dones.forEach(function(e) { distincts[e.talent_id] = true; });
    setText('statTalentsEvalues', Object.keys(distincts).length);
}

/* ---------- 13. CLASSE COULEUR DE LA NOTE ---------- */
function noteClass(note) {
    if (note === null || note === undefined) {
        return 'todo';
    }
    if (note >= 75) {
        return 'excellent';
    }
    if (note >= 50) {
        return 'moyen';
    }
    return 'faible';
}

/* ---------- 14. RENDU : ÉVALUATIONS À FAIRE ---------- */
function renderPending() {
    const grid  = document.getElementById('pendingList');
    const empty = document.getElementById('pendingEmpty');
    if (!grid) {
        return;
    }
    const pendings = allEvals.filter(function(e) { return e.statut === 'pending'; });

    grid.querySelectorAll('.eval-card').forEach(function(c) { c.remove(); });

    if (pendings.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    pendings.forEach(function(e) {
        const nom  = escapeHtml(e.talent_nom || e.talent_id);
        const card = document.createElement('div');
        card.className = 'eval-card';
        card.innerHTML =
            '<div class="eval-head">' +
                '<div class="eval-identity">' +
                    '<div class="eval-name">' + nom + '</div>' +
                    '<div class="eval-meta">' +
                        (e.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                        (e.periode ? ' · ' + escapeHtml(e.periode) : '') +
                        ' · planifiée le ' + formatDateFr(e.created_at) +
                    '</div>' +
                '</div>' +
                '<div class="note-badge todo"><i class="fas fa-hourglass-half"></i></div>' +
            '</div>' +
            '<div class="eval-actions">' +
                '<button class="btn-complete" data-id="' + e.id + '"><i class="fas fa-pen"></i> Compléter maintenant</button>' +
                '<button class="btn-delete" data-id="' + e.id + '"><i class="fas fa-trash-alt"></i></button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-complete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    grid.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerEval(btn.dataset.id);
        });
    });
}

/* ---------- 15. RENDU : HISTORIQUE (done) ---------- */
function renderHistory() {
    const grid  = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!grid) {
        return;
    }
    let dones = allEvals.filter(function(e) { return e.statut === 'done'; });
    if (currentFilter !== 'all') {
        dones = dones.filter(function(e) { return e.talent_type === currentFilter; });
    }

    grid.querySelectorAll('.eval-card').forEach(function(c) { c.remove(); });

    if (dones.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    dones.forEach(function(e) {
        const nom  = escapeHtml(e.talent_nom || e.talent_id);
        const note = (e.note_globale !== null && e.note_globale !== undefined) ? e.note_globale : '—';
        const card = document.createElement('div');
        card.className = 'eval-card';
        card.innerHTML =
            '<div class="eval-head">' +
                '<div class="eval-identity">' +
                    '<div class="eval-name">' + nom + '</div>' +
                    '<div class="eval-meta">' +
                        (e.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                        (e.periode ? ' · ' + escapeHtml(e.periode) : '') +
                        ' · ' + formatDateFr(e.updated_at || e.created_at) +
                    '</div>' +
                '</div>' +
                '<div class="note-badge ' + noteClass(e.note_globale) + '">' + note + '</div>' +
            '</div>' +
            '<div class="eval-points">' +
                (e.points_forts   ? '<span class="eval-forts"><i class="fas fa-thumbs-up"></i> '   + escapeHtml(e.points_forts)   + '</span>' : '') +
                (e.points_faibles ? '<span class="eval-faibles"><i class="fas fa-thumbs-down"></i> ' + escapeHtml(e.points_faibles) + '</span>' : '') +
            '</div>' +
            (e.commentaire ? '<div class="eval-rapport">« ' + escapeHtml(e.commentaire) + ' »</div>' : '') +
            '<div class="eval-actions">' +
                '<button class="btn-edit" data-id="' + e.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
                '<button class="btn-delete" data-id="' + e.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    grid.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerEval(btn.dataset.id);
        });
    });
}

/* ---------- 16. CHARGER UNE ÉVALUATION DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(evalId) {
    const e = allEvals.find(function(x) { return String(x.id) === String(evalId); });
    if (!e) {
        return;
    }
    editingId = e.id;

    /* Sélectionner le talent */
    const select = document.getElementById('evalTalent');
    if (select) {
        let trouve = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === e.talent_id) {
                select.selectedIndex = i;
                trouve = true;
                break;
            }
        }
        /* Si le talent n'est plus lié, on ajoute une option temporaire
           pour ne pas perdre la référence de l'évaluation */
        if (!trouve) {
            const opt = document.createElement('option');
            opt.value = e.talent_id;
            opt.textContent = (e.talent_nom || e.talent_id) + ' (liaison terminée)';
            opt.dataset.nom  = e.talent_nom || '';
            opt.dataset.type = e.talent_type || 'sportif';
            select.appendChild(opt);
            select.value = e.talent_id;
        }
    }

    /* Remplir les champs */
    document.getElementById('evalPeriode').value     = e.periode || '';
    document.getElementById('evalNote').value        = (e.note_globale !== null && e.note_globale !== undefined) ? e.note_globale : 50;
    document.getElementById('evalForts').value       = e.points_forts || '';
    document.getElementById('evalFaibles').value     = e.points_faibles || '';
    document.getElementById('evalCommentaire').value = e.commentaire || '';
    majSlider();

    /* Passer le panneau en mode édition */
    const panel = document.getElementById('evalFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> ' +
            (e.statut === 'pending' ? 'Compléter l\'évaluation de ' : 'Modifier l\'évaluation de ') +
            escapeHtml(e.talent_nom || e.talent_id);
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 17. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    const select = document.getElementById('evalTalent');
    if (select) { select.selectedIndex = 0; }
    document.getElementById('evalPeriode').value     = periodeCourante();
    document.getElementById('evalNote').value        = 50;
    document.getElementById('evalForts').value       = '';
    document.getElementById('evalFaibles').value     = '';
    document.getElementById('evalCommentaire').value = '';
    majSlider();

    const panel = document.getElementById('evalFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Nouvelle évaluation'; }
}

/* ---------- 18. LIRE LE FORMULAIRE ---------- */
function lireFormulaire() {
    const select = document.getElementById('evalTalent');
    const talentId = select ? select.value : '';
    if (!talentId) {
        showToast('Sélectionnez d\'abord un talent à évaluer.', 'warning');
        return null;
    }
    const opt = select.options[select.selectedIndex];
    return {
        talent_id      : talentId,
        talent_nom     : opt.dataset.nom || opt.textContent,
        talent_type    : opt.dataset.type || 'sportif',
        periode        : (document.getElementById('evalPeriode')?.value || '').trim() || periodeCourante(),
        note_globale   : parseInt(document.getElementById('evalNote')?.value, 10),
        points_forts   : (document.getElementById('evalForts')?.value || '').trim() || null,
        points_faibles : (document.getElementById('evalFaibles')?.value || '').trim() || null,
        commentaire    : (document.getElementById('evalCommentaire')?.value || '').trim() || null
    };
}

/* ---------- 19. ENREGISTRER (pending ou done) ---------- */
async function enregistrerEval(statut) {
    const form = lireFormulaire();
    if (!form) {
        return;
    }
    /* Pour une évaluation planifiée, on ne garde que l'essentiel */
    const payload = {
        coach_id       : coachProfile.hubisoccer_id,
        talent_id      : form.talent_id,
        talent_nom     : form.talent_nom,
        talent_type    : form.talent_type,
        periode        : form.periode,
        statut         : statut,
        note_globale   : (statut === 'done') ? form.note_globale : null,
        points_forts   : (statut === 'done') ? form.points_forts : null,
        points_faibles : (statut === 'done') ? form.points_faibles : null,
        commentaire    : (statut === 'done') ? form.commentaire : null
    };

    showLoader();
    let error = null;

    if (editingId) {
        /* Mise à jour d'une évaluation existante */
        const res = await supabaseClient
            .from(EVAL_TABLE)
            .update(payload)
            .eq('id', editingId);
        error = res.error;
    } else {
        /* Nouvelle évaluation */
        const res = await supabaseClient
            .from(EVAL_TABLE)
            .insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    if (statut === 'done') {
        showToast('Évaluation de ' + escapeHtml(form.talent_nom) + ' enregistrée ! 🎉 Elle est maintenant visible sur son profil scouting.', 'success');
    } else {
        showToast('Évaluation planifiée. Retrouvez-la dans "À faire". ⏳', 'success');
    }

    resetFormulaire();
    await loadEvals();
}

/* ---------- 20. SUPPRIMER UNE ÉVALUATION ---------- */
async function supprimerEval(evalId) {
    const e = allEvals.find(function(x) { return String(x.id) === String(evalId); });
    const nom = e ? (e.talent_nom || e.talent_id) : 'ce talent';
    if (!confirm('Supprimer définitivement cette évaluation de ' + nom + ' ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(EVAL_TABLE)
        .delete()
        .eq('id', evalId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    /* Si on supprimait celle en cours d'édition, on réinitialise le formulaire */
    if (String(editingId) === String(evalId)) {
        resetFormulaire();
    }
    showToast('Évaluation supprimée.', 'info');
    await loadEvals();
}

/* ---------- 21. CURSEUR DE NOTE (remplissage dynamique) ---------- */
function majSlider() {
    const slider = document.getElementById('evalNote');
    const label  = document.getElementById('evalNoteValue');
    if (!slider) {
        return;
    }
    const val = slider.value;
    if (label) {
        label.textContent = val;
    }
    /* Remplir la piste jusqu'au curseur */
    slider.style.background =
        'linear-gradient(90deg, var(--primary) ' + val + '%, var(--gray-light) ' + val + '%)';
}

/* ---------- 22. FILTRES HISTORIQUE ---------- */
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

/* ---------- 23. MENU UTILISATEUR ---------- */
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

/* ---------- 24. SIDEBAR + SWIPE ---------- */
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

/* ---------- 25. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 26. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }

    /* Période par défaut = mois courant */
    const periodeInput = document.getElementById('evalPeriode');
    if (periodeInput) {
        periodeInput.value = periodeCourante();
    }
    majSlider();

    await loadMesTalents();
    await loadEvals();
    preselectFromUrl();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Curseur de note */
    const slider = document.getElementById('evalNote');
    if (slider) {
        slider.addEventListener('input', majSlider);
    }

    /* Boutons du formulaire */
    const btnDone = document.getElementById('btnSaveDone');
    if (btnDone) {
        btnDone.addEventListener('click', function() {
            enregistrerEval('done');
        });
    }
    const btnPending = document.getElementById('btnSavePending');
    if (btnPending) {
        btnPending.addEventListener('click', function() {
            enregistrerEval('pending');
        });
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
