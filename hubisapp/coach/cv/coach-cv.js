/* ============================================================
   HubISoccer — coach-cv.js
   Page Mon CV Pro · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles    → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_dash  → lecture seule (années
     d'expérience, déjà saisies sur le tableau de bord — pas de
     double saisie ici)
   - supabaseAuthPrive_coach_cv    → table de CETTE page
     (SQL : coach-cv-table.sql, sans RLS)
   ------------------------------------------------------------
   Une SEULE fiche par coach (coach_id UNIQUE), créée
   automatiquement au premier chargement. Expériences et
   palmarès sont des tableaux JSONB internes à cette fiche —
   chaque ajout/modif/suppression persiste le tableau entier
   en un seul appel .update().
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';       // partagée
const DASH_TABLE      = 'supabaseAuthPrive_coach_dash';    // lecture seule (années d'expérience)
const CV_TABLE        = 'supabaseAuthPrive_coach_cv';      // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser      = null;
let coachProfile     = null;
let cvRecord         = null;    // ligne de supabaseAuthPrive_coach_cv
let anneesExperience = null;    // lue depuis coach_dash (read-only)
let editingExpId      = null;    // id local de l'expérience en cours d'édition
let editingPalId       = null;   // id local de la distinction en cours d'édition

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

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

/* "2022-03" → "Mars 2022" */
function formatMoisAnnee(yyyymm) {
    if (!yyyymm) {
        return '';
    }
    const parts = yyyymm.split('-');
    const annee = parts[0];
    const mois  = parseInt(parts[1], 10) - 1;
    if (mois < 0 || mois > 11) {
        return yyyymm;
    }
    return MOIS_FR[mois] + ' ' + annee;
}

function genererIdLocal() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
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

/* ---------- 9. LECTURE DES ANNÉES D'EXPÉRIENCE (tableau de bord) ---------- */
async function loadAnneesExperience() {
    if (!coachProfile) {
        return;
    }
    const { data } = await supabaseClient
        .from(DASH_TABLE)
        .select('annees_experience')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .maybeSingle();
    anneesExperience = (data && data.annees_experience !== null && data.annees_experience !== undefined)
        ? data.annees_experience
        : null;
}

/* ---------- 10. CHARGEMENT (OU CRÉATION) DE LA FICHE CV ---------- */
async function loadOrCreateCvRecord() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(CV_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .maybeSingle();

    if (error) {
        hideLoader();
        console.warn('⚠️ Table ' + CV_TABLE + ' :', error.message);
        showToast('Table du CV Pro absente. Exécutez le script SQL <b>coach-cv-table.sql</b> dans Supabase.', 'warning');
        cvRecord = null;
        return;
    }

    if (data) {
        cvRecord = data;
        hideLoader();
        return;
    }

    const { data: created, error: createError } = await supabaseClient
        .from(CV_TABLE)
        .insert([{
            coach_id    : coachProfile.hubisoccer_id,
            experiences : [],
            palmares    : []
        }])
        .select()
        .single();
    hideLoader();

    if (createError) {
        showToast('Erreur d\'initialisation : ' + createError.message, 'error');
        cvRecord = null;
        return;
    }
    cvRecord = created;
}

/* ---------- 11. PRÉ-REMPLISSAGE DU FORMULAIRE PHILOSOPHIE ---------- */
function populatePhilosophie() {
    if (!cvRecord) {
        return;
    }
    document.getElementById('cvSpecialites').value = cvRecord.specialites || '';
    document.getElementById('cvPhilosophie').value = cvRecord.philosophie || '';
    document.getElementById('cvVisible').checked   = cvRecord.visible_recruteurs !== false;
}

/* ---------- 12. STATS RAPIDES ---------- */
function updateStats() {
    const experiences = (cvRecord && Array.isArray(cvRecord.experiences)) ? cvRecord.experiences : [];
    const palmares     = (cvRecord && Array.isArray(cvRecord.palmares)) ? cvRecord.palmares : [];

    setText('statExperiences', experiences.length);
    setText('statTitres', palmares.length);
    setText('statAnnees', anneesExperience !== null ? anneesExperience : '—');

    const visible = cvRecord ? (cvRecord.visible_recruteurs !== false) : true;
    const chip = document.getElementById('statVisibilite');
    if (chip) {
        chip.innerHTML = visible
            ? '<i class="fas fa-eye" style="color:var(--esprit-color);"></i> Public'
            : '<i class="fas fa-eye-slash" style="color:var(--gray);"></i> Privé';
    }
}

/* ---------- 13. ENREGISTRER LA PHILOSOPHIE ---------- */
async function enregistrerPhilosophie() {
    if (!cvRecord) {
        showToast('Chargement en cours, réessayez dans un instant.', 'warning');
        return;
    }
    const payload = {
        specialites        : (document.getElementById('cvSpecialites')?.value || '').trim() || null,
        philosophie        : (document.getElementById('cvPhilosophie')?.value || '').trim() || null,
        visible_recruteurs : document.getElementById('cvVisible')?.checked === true
    };

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update(payload)
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    cvRecord = updated;
    showToast('Votre CV a été mis à jour. ✅', 'success');
    updateStats();
}

/* ================================================================
   EXPÉRIENCES PROFESSIONNELLES
   ================================================================ */

/* ---------- 14. TRI DES EXPÉRIENCES (en cours d'abord, puis récent → ancien) ---------- */
function experiencesTriees() {
    const liste = (cvRecord && Array.isArray(cvRecord.experiences)) ? cvRecord.experiences.slice() : [];
    liste.sort(function(a, b) {
        const clefA = a.date_fin || '9999-12';
        const clefB = b.date_fin || '9999-12';
        if (clefA !== clefB) {
            return clefA < clefB ? 1 : -1;
        }
        return (a.date_debut || '') < (b.date_debut || '') ? 1 : -1;
    });
    return liste;
}

/* ---------- 15. RENDU DE LA TIMELINE ---------- */
function renderExperiences() {
    const container = document.getElementById('experiencesTimeline');
    const empty      = document.getElementById('experiencesEmpty');
    if (!container) {
        return;
    }
    const liste = experiencesTriees();

    container.querySelectorAll('.timeline-item').forEach(function(el) { el.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(exp) {
        const enCours = !exp.date_fin;
        const item = document.createElement('div');
        item.className = 'timeline-item' + (enCours ? ' current' : '');

        const periode = formatMoisAnnee(exp.date_debut) + ' — ' + (enCours ? 'Aujourd\'hui' : formatMoisAnnee(exp.date_fin));

        item.innerHTML =
            '<div class="timeline-card">' +
                '<div class="timeline-head">' +
                    '<div>' +
                        '<div class="timeline-structure">' + escapeHtml(exp.structure) +
                            (enCours ? '<span class="current-chip">En cours</span>' : '') +
                        '</div>' +
                        (exp.poste ? '<div class="timeline-poste">' + escapeHtml(exp.poste) + '</div>' : '') +
                    '</div>' +
                    '<div class="timeline-period">' + periode + '</div>' +
                '</div>' +
                (exp.description ? '<div class="timeline-desc">' + escapeHtml(exp.description) + '</div>' : '') +
                '<div class="timeline-actions">' +
                    '<button class="btn-edit" data-id="' + exp.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-delete" data-id="' + exp.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
                '</div>' +
            '</div>';
        container.appendChild(item);
    });

    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerExperienceDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerExperience(btn.dataset.id); });
    });
}

/* ---------- 16. CHECKBOX "POSTE ACTUEL" ---------- */
function initEnCoursCheckbox() {
    const checkbox   = document.getElementById('expEnCours');
    const dateFinInp = document.getElementById('expDateFin');
    if (!checkbox || !dateFinInp) {
        return;
    }
    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            dateFinInp.value = '';
            dateFinInp.disabled = true;
        } else {
            dateFinInp.disabled = false;
        }
    });
}

/* ---------- 17. CHARGER UNE EXPÉRIENCE DANS LE FORMULAIRE ---------- */
function chargerExperienceDansFormulaire(expId) {
    const liste = (cvRecord.experiences || []);
    const exp = liste.find(function(e) { return String(e.id) === String(expId); });
    if (!exp) {
        return;
    }
    editingExpId = exp.id;

    document.getElementById('expStructure').value   = exp.structure || '';
    document.getElementById('expPoste').value       = exp.poste || '';
    document.getElementById('expDateDebut').value   = exp.date_debut || '';
    document.getElementById('expDescription').value = exp.description || '';

    const checkbox   = document.getElementById('expEnCours');
    const dateFinInp = document.getElementById('expDateFin');
    if (exp.date_fin) {
        dateFinInp.value = exp.date_fin;
        dateFinInp.disabled = false;
        checkbox.checked = false;
    } else {
        dateFinInp.value = '';
        dateFinInp.disabled = true;
        checkbox.checked = true;
    }

    const panel = document.getElementById('experiencesTimeline').closest('.experiences-panel');
    const title = document.getElementById('expFormTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(exp.structure) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 18. RÉINITIALISER LE FORMULAIRE EXPÉRIENCE ---------- */
function resetFormulaireExperience() {
    editingExpId = null;
    document.getElementById('expStructure').value   = '';
    document.getElementById('expPoste').value       = '';
    document.getElementById('expDateDebut').value   = '';
    document.getElementById('expDateFin').value     = '';
    document.getElementById('expDateFin').disabled  = false;
    document.getElementById('expEnCours').checked   = false;
    document.getElementById('expDescription').value = '';

    const panel = document.querySelector('.experiences-panel');
    const title = document.getElementById('expFormTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-briefcase"></i> Ajouter une expérience'; }
}

/* ---------- 19. ENREGISTRER UNE EXPÉRIENCE (création ou édition) ---------- */
async function enregistrerExperience() {
    const structure  = (document.getElementById('expStructure')?.value || '').trim();
    const dateDebut  = document.getElementById('expDateDebut')?.value || '';

    if (!structure) {
        showToast('Le nom de la structure / club est obligatoire.', 'warning');
        return;
    }
    if (!dateDebut) {
        showToast('La date de début est obligatoire.', 'warning');
        return;
    }

    const enCours = document.getElementById('expEnCours')?.checked === true;
    const dateFin = enCours ? null : (document.getElementById('expDateFin')?.value || null);

    const nouvelleExp = {
        structure   : structure,
        poste       : (document.getElementById('expPoste')?.value || '').trim() || null,
        date_debut  : dateDebut,
        date_fin    : dateFin,
        description : (document.getElementById('expDescription')?.value || '').trim() || null
    };

    const liste = (cvRecord.experiences || []).slice();
    if (editingExpId) {
        const idx = liste.findIndex(function(e) { return String(e.id) === String(editingExpId); });
        if (idx >= 0) {
            nouvelleExp.id = liste[idx].id;
            liste[idx] = nouvelleExp;
        }
    } else {
        nouvelleExp.id = genererIdLocal();
        liste.push(nouvelleExp);
    }

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ experiences: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    cvRecord = updated;
    showToast(editingExpId ? 'Expérience mise à jour. ✅' : 'Expérience ajoutée à votre parcours. 💼', 'success');
    resetFormulaireExperience();
    updateStats();
    renderExperiences();
}

/* ---------- 20. SUPPRIMER UNE EXPÉRIENCE ---------- */
async function supprimerExperience(expId) {
    const exp = (cvRecord.experiences || []).find(function(e) { return String(e.id) === String(expId); });
    const nom = exp ? exp.structure : 'cette expérience';
    if (!confirm('Supprimer « ' + nom + ' » de votre parcours ?')) {
        return;
    }
    const liste = (cvRecord.experiences || []).filter(function(e) { return String(e.id) !== String(expId); });

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ experiences: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    cvRecord = updated;
    if (String(editingExpId) === String(expId)) {
        resetFormulaireExperience();
    }
    showToast('Expérience supprimée.', 'info');
    updateStats();
    renderExperiences();
}

/* ================================================================
   PALMARÈS & DISTINCTIONS
   ================================================================ */

/* ---------- 21. TRI DU PALMARÈS (plus récent d'abord) ---------- */
function palmaresTries() {
    const liste = (cvRecord && Array.isArray(cvRecord.palmares)) ? cvRecord.palmares.slice() : [];
    liste.sort(function(a, b) {
        return (parseInt(b.annee, 10) || 0) - (parseInt(a.annee, 10) || 0);
    });
    return liste;
}

/* ---------- 22. RENDU DU PALMARÈS ---------- */
function renderPalmares() {
    const grid  = document.getElementById('palmaresGrid');
    const empty = document.getElementById('palmaresEmpty');
    if (!grid) {
        return;
    }
    const liste = palmaresTries();

    grid.querySelectorAll('.palmares-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(pal) {
        const card = document.createElement('div');
        card.className = 'palmares-card';
        card.innerHTML =
            '<div class="palmares-top">' +
                '<div class="palmares-icon"><i class="fas fa-trophy"></i></div>' +
                '<div>' +
                    '<div class="palmares-titre">' + escapeHtml(pal.titre) + '</div>' +
                    '<div class="palmares-annee">' + escapeHtml(String(pal.annee)) + '</div>' +
                '</div>' +
            '</div>' +
            (pal.niveau ? '<span class="palmares-niveau">' + escapeHtml(pal.niveau) + '</span>' : '') +
            (pal.description ? '<div class="palmares-desc">' + escapeHtml(pal.description) + '</div>' : '') +
            '<div class="palmares-actions">' +
                '<button class="btn-edit" data-id="' + pal.id + '"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-delete" data-id="' + pal.id + '"><i class="fas fa-trash-alt"></i></button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerPalmaresDansFormulaire(btn.dataset.id); });
    });
    grid.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerPalmares(btn.dataset.id); });
    });
}

/* ---------- 23. CHARGER UNE DISTINCTION DANS LE FORMULAIRE ---------- */
function chargerPalmaresDansFormulaire(palId) {
    const pal = (cvRecord.palmares || []).find(function(p) { return String(p.id) === String(palId); });
    if (!pal) {
        return;
    }
    editingPalId = pal.id;

    document.getElementById('palTitre').value       = pal.titre || '';
    document.getElementById('palAnnee').value       = pal.annee || '';
    document.getElementById('palNiveau').value      = pal.niveau || '';
    document.getElementById('palDescription').value = pal.description || '';

    const panel = document.querySelector('.palmares-panel');
    const title = document.getElementById('palFormTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(pal.titre) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 24. RÉINITIALISER LE FORMULAIRE PALMARÈS ---------- */
function resetFormulairePalmares() {
    editingPalId = null;
    document.getElementById('palTitre').value       = '';
    document.getElementById('palAnnee').value       = '';
    document.getElementById('palNiveau').value      = '';
    document.getElementById('palDescription').value = '';

    const panel = document.querySelector('.palmares-panel');
    const title = document.getElementById('palFormTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-trophy"></i> Ajouter une distinction'; }
}

/* ---------- 25. ENREGISTRER UNE DISTINCTION (création ou édition) ---------- */
async function enregistrerPalmares() {
    const titre = (document.getElementById('palTitre')?.value || '').trim();
    const annee = document.getElementById('palAnnee')?.value || '';

    if (!titre) {
        showToast('Le titre de la distinction est obligatoire.', 'warning');
        return;
    }
    if (!annee) {
        showToast('L\'année est obligatoire.', 'warning');
        return;
    }

    const nouvellePal = {
        titre       : titre,
        annee       : parseInt(annee, 10),
        niveau      : document.getElementById('palNiveau')?.value || null,
        description : (document.getElementById('palDescription')?.value || '').trim() || null
    };

    const liste = (cvRecord.palmares || []).slice();
    if (editingPalId) {
        const idx = liste.findIndex(function(p) { return String(p.id) === String(editingPalId); });
        if (idx >= 0) {
            nouvellePal.id = liste[idx].id;
            liste[idx] = nouvellePal;
        }
    } else {
        nouvellePal.id = genererIdLocal();
        liste.push(nouvellePal);
    }

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ palmares: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    cvRecord = updated;
    showToast(editingPalId ? 'Distinction mise à jour. ✅' : 'Distinction ajoutée à votre palmarès. 🏆', 'success');
    resetFormulairePalmares();
    updateStats();
    renderPalmares();
}

/* ---------- 26. SUPPRIMER UNE DISTINCTION ---------- */
async function supprimerPalmares(palId) {
    const pal = (cvRecord.palmares || []).find(function(p) { return String(p.id) === String(palId); });
    const nom = pal ? pal.titre : 'cette distinction';
    if (!confirm('Supprimer « ' + nom + ' » de votre palmarès ?')) {
        return;
    }
    const liste = (cvRecord.palmares || []).filter(function(p) { return String(p.id) !== String(palId); });

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ palmares: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    cvRecord = updated;
    if (String(editingPalId) === String(palId)) {
        resetFormulairePalmares();
    }
    showToast('Distinction supprimée.', 'info');
    updateStats();
    renderPalmares();
}

/* ---------- 27. MENU UTILISATEUR ---------- */
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

/* ---------- 28. SIDEBAR + SWIPE ---------- */
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

/* ---------- 29. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 30. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadOrCreateCvRecord();
    await loadAnneesExperience();

    populatePhilosophie();
    updateStats();
    renderExperiences();
    renderPalmares();

    initUserMenu();
    initSidebar();
    initEnCoursCheckbox();

    /* Philosophie */
    const btnSavePhilo = document.getElementById('btnSavePhilo');
    if (btnSavePhilo) {
        btnSavePhilo.addEventListener('click', enregistrerPhilosophie);
    }

    /* Expériences */
    const btnSaveExp = document.getElementById('btnSaveExp');
    if (btnSaveExp) {
        btnSaveExp.addEventListener('click', enregistrerExperience);
    }
    const btnResetExp = document.getElementById('btnResetExp');
    if (btnResetExp) {
        btnResetExp.addEventListener('click', resetFormulaireExperience);
    }

    /* Palmarès */
    const btnSavePal = document.getElementById('btnSavePal');
    if (btnSavePal) {
        btnSavePal.addEventListener('click', enregistrerPalmares);
    }
    const btnResetPal = document.getElementById('btnResetPal');
    if (btnResetPal) {
        btnResetPal.addEventListener('click', resetFormulairePalmares);
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
