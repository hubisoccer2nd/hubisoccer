/* ============================================================
   HubISoccer — academie-cv.js
   Page CV / Présentation · Espace Académie
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → partagée (lecture)
   - supabaseAuthPrive_academie_cv    → table de CETTE page
     (SQL : academie-cv-table.sql, sans RLS)
   ------------------------------------------------------------
   Une SEULE fiche par académie (academie_id UNIQUE), créée
   automatiquement au premier chargement. historique et palmares
   sont des tableaux JSONB internes à cette fiche — chaque
   ajout/modif/suppression persiste le tableau entier en un seul
   appel .update().
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';
const CV_TABLE        = 'supabaseAuthPrive_academie_cv';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser      = null;
let academieProfile  = null;
let cvRecord           = null;
let editingHistId       = null;
let editingPalId         = null;

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
function genererIdLocal() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/* Années d'existence — même calcul que le tableau de bord, à
   partir de la même date de fondation (date_of_birth réutilisé) */
function calculateAnciennete(d) {
    if (!d) { return null; }
    const today = new Date();
    const fondation = new Date(d);
    let annees = today.getFullYear() - fondation.getFullYear();
    const m = today.getMonth() - fondation.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < fondation.getDate())) { annees--; }
    return annees >= 0 ? annees : 0;
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

/* ---------- 9. CHARGEMENT (OU CRÉATION) DE LA FICHE CV ---------- */
async function loadOrCreateCvRecord() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(CV_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .maybeSingle();

    if (error) {
        hideLoader();
        console.warn('⚠️ Table ' + CV_TABLE + ' :', error.message);
        showToast('Table du CV/Présentation absente. Exécutez le script SQL <b>academie-cv-table.sql</b> dans Supabase.', 'warning');
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
        .insert([{ academie_id: academieProfile.hubisoccer_id, historique: [], palmares: [] }])
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

/* ---------- 10. PRÉ-REMPLISSAGE DU FORMULAIRE MISSION ---------- */
function populateMission() {
    if (!cvRecord) { return; }
    document.getElementById('cvSpecialites').value = cvRecord.specialites || '';
    document.getElementById('cvMission').value = cvRecord.mission || '';
    document.getElementById('cvVisible').checked = cvRecord.visible_public !== false;
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const historique = (cvRecord && Array.isArray(cvRecord.historique)) ? cvRecord.historique : [];
    const palmares = (cvRecord && Array.isArray(cvRecord.palmares)) ? cvRecord.palmares : [];
    const anciennete = calculateAnciennete(academieProfile?.date_of_birth);

    setText('statHistorique', historique.length);
    setText('statTitres', palmares.length);
    setText('statAnnees', anciennete !== null ? anciennete : '—');

    const visible = cvRecord ? (cvRecord.visible_public !== false) : true;
    const chip = document.getElementById('statVisibilite');
    if (chip) {
        chip.innerHTML = visible
            ? '<i class="fas fa-eye" style="color:var(--esprit-color);"></i> Public'
            : '<i class="fas fa-eye-slash" style="color:var(--gray);"></i> Privé';
    }
}

/* ---------- 12. ENREGISTRER LA MISSION ---------- */
async function enregistrerMission() {
    if (!cvRecord) {
        showToast('Chargement en cours, réessayez dans un instant.', 'warning');
        return;
    }
    const payload = {
        specialites    : (document.getElementById('cvSpecialites')?.value || '').trim() || null,
        mission        : (document.getElementById('cvMission')?.value || '').trim() || null,
        visible_public : document.getElementById('cvVisible')?.checked === true
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
    showToast('Votre présentation a été mise à jour. ✅', 'success');
    updateStats();
}

/* ================================================================
   HISTORIQUE — ÉTAPES CLÉS
   ================================================================ */
function historiqueTrie() {
    const liste = (cvRecord && Array.isArray(cvRecord.historique)) ? cvRecord.historique.slice() : [];
    liste.sort(function(a, b) { return (parseInt(b.annee, 10) || 0) - (parseInt(a.annee, 10) || 0); });
    return liste;
}

function renderHistorique() {
    const container = document.getElementById('historiqueTimeline');
    const empty = document.getElementById('historiqueEmpty');
    if (!container) { return; }
    const liste = historiqueTrie();

    container.querySelectorAll('.timeline-item').forEach(function(el) { el.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(h) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML =
            '<div class="timeline-card">' +
                '<div class="timeline-head">' +
                    '<div class="timeline-titre">' + escapeHtml(h.titre) + '</div>' +
                    '<span class="timeline-annee">' + escapeHtml(String(h.annee)) + '</span>' +
                '</div>' +
                (h.description ? '<div class="timeline-desc">' + escapeHtml(h.description) + '</div>' : '') +
                '<div class="timeline-actions">' +
                    '<button class="btn-edit" data-id="' + h.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-delete" data-id="' + h.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
                '</div>' +
            '</div>';
        container.appendChild(item);
    });

    container.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerHistDansFormulaire(btn.dataset.id); });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerHistorique(btn.dataset.id); });
    });
}

function chargerHistDansFormulaire(histId) {
    const h = (cvRecord.historique || []).find(function(x) { return String(x.id) === String(histId); });
    if (!h) { return; }
    editingHistId = h.id;

    document.getElementById('histAnnee').value = h.annee || '';
    document.getElementById('histTitre').value = h.titre || '';
    document.getElementById('histDescription').value = h.description || '';

    const panel = document.querySelector('.historique-panel');
    const title = document.getElementById('histFormTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(h.titre) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

function resetFormulaireHist() {
    editingHistId = null;
    document.getElementById('histAnnee').value = '';
    document.getElementById('histTitre').value = '';
    document.getElementById('histDescription').value = '';

    const panel = document.querySelector('.historique-panel');
    const title = document.getElementById('histFormTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-landmark"></i> Ajouter une étape clé'; }
}

async function enregistrerHistorique() {
    const annee = document.getElementById('histAnnee')?.value || '';
    const titre = (document.getElementById('histTitre')?.value || '').trim();

    if (!annee) { showToast('L\'année est obligatoire.', 'warning'); return; }
    if (!titre) { showToast('Le titre est obligatoire.', 'warning'); return; }

    const nouvelleEtape = {
        annee       : parseInt(annee, 10),
        titre       : titre,
        description : (document.getElementById('histDescription')?.value || '').trim() || null
    };

    const liste = (cvRecord.historique || []).slice();
    if (editingHistId) {
        const idx = liste.findIndex(function(h) { return String(h.id) === String(editingHistId); });
        if (idx >= 0) { nouvelleEtape.id = liste[idx].id; liste[idx] = nouvelleEtape; }
    } else {
        nouvelleEtape.id = genererIdLocal();
        liste.push(nouvelleEtape);
    }

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ historique: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    cvRecord = updated;
    showToast(editingHistId ? 'Étape mise à jour. ✅' : 'Étape ajoutée à l\'histoire. 🏛️', 'success');
    resetFormulaireHist();
    updateStats();
    renderHistorique();
}

async function supprimerHistorique(histId) {
    const h = (cvRecord.historique || []).find(function(x) { return String(x.id) === String(histId); });
    const titre = h ? h.titre : 'cette étape';
    if (!confirm('Supprimer « ' + titre + ' » de l\'histoire de l\'académie ?')) { return; }
    const liste = (cvRecord.historique || []).filter(function(x) { return String(x.id) !== String(histId); });

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ historique: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    cvRecord = updated;
    if (String(editingHistId) === String(histId)) { resetFormulaireHist(); }
    showToast('Étape supprimée.', 'info');
    updateStats();
    renderHistorique();
}

/* ================================================================
   PALMARÈS & DISTINCTIONS
   ================================================================ */
function palmaresTries() {
    const liste = (cvRecord && Array.isArray(cvRecord.palmares)) ? cvRecord.palmares.slice() : [];
    liste.sort(function(a, b) { return (parseInt(b.annee, 10) || 0) - (parseInt(a.annee, 10) || 0); });
    return liste;
}

function renderPalmares() {
    const grid = document.getElementById('palmaresGrid');
    const empty = document.getElementById('palmaresEmpty');
    if (!grid) { return; }
    const liste = palmaresTries();

    grid.querySelectorAll('.palmares-card').forEach(function(c) { c.remove(); });

    if (liste.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    liste.forEach(function(p) {
        const card = document.createElement('div');
        card.className = 'palmares-card';
        card.innerHTML =
            '<div class="palmares-top">' +
                '<div class="palmares-icon"><i class="fas fa-trophy"></i></div>' +
                '<div>' +
                    '<div class="palmares-titre">' + escapeHtml(p.titre) + '</div>' +
                    '<div class="palmares-annee">' + escapeHtml(String(p.annee)) + '</div>' +
                '</div>' +
            '</div>' +
            (p.niveau ? '<span class="palmares-niveau">' + escapeHtml(p.niveau) + '</span>' : '') +
            (p.description ? '<div class="palmares-desc">' + escapeHtml(p.description) + '</div>' : '') +
            '<div class="palmares-actions">' +
                '<button class="btn-edit" data-id="' + p.id + '"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-delete" data-id="' + p.id + '"><i class="fas fa-trash-alt"></i></button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() { chargerPalDansFormulaire(btn.dataset.id); });
    });
    grid.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { supprimerPalmares(btn.dataset.id); });
    });
}

function chargerPalDansFormulaire(palId) {
    const p = (cvRecord.palmares || []).find(function(x) { return String(x.id) === String(palId); });
    if (!p) { return; }
    editingPalId = p.id;

    document.getElementById('palTitre').value = p.titre || '';
    document.getElementById('palAnnee').value = p.annee || '';
    document.getElementById('palNiveau').value = p.niveau || '';
    document.getElementById('palDescription').value = p.description || '';

    const panel = document.querySelector('.palmares-panel');
    const title = document.getElementById('palFormTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(p.titre) + ' »'; }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

function resetFormulairePal() {
    editingPalId = null;
    document.getElementById('palTitre').value = '';
    document.getElementById('palAnnee').value = '';
    document.getElementById('palNiveau').value = '';
    document.getElementById('palDescription').value = '';

    const panel = document.querySelector('.palmares-panel');
    const title = document.getElementById('palFormTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-trophy"></i> Ajouter une distinction'; }
}

async function enregistrerPalmares() {
    const titre = (document.getElementById('palTitre')?.value || '').trim();
    const annee = document.getElementById('palAnnee')?.value || '';

    if (!titre) { showToast('Le titre de la distinction est obligatoire.', 'warning'); return; }
    if (!annee) { showToast('L\'année est obligatoire.', 'warning'); return; }

    const nouvellePal = {
        titre       : titre,
        annee       : parseInt(annee, 10),
        niveau      : document.getElementById('palNiveau')?.value || null,
        description : (document.getElementById('palDescription')?.value || '').trim() || null
    };

    const liste = (cvRecord.palmares || []).slice();
    if (editingPalId) {
        const idx = liste.findIndex(function(p) { return String(p.id) === String(editingPalId); });
        if (idx >= 0) { nouvellePal.id = liste[idx].id; liste[idx] = nouvellePal; }
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

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    cvRecord = updated;
    showToast(editingPalId ? 'Distinction mise à jour. ✅' : 'Distinction ajoutée au palmarès. 🏆', 'success');
    resetFormulairePal();
    updateStats();
    renderPalmares();
}

async function supprimerPalmares(palId) {
    const p = (cvRecord.palmares || []).find(function(x) { return String(x.id) === String(palId); });
    const nom = p ? p.titre : 'cette distinction';
    if (!confirm('Supprimer « ' + nom + ' » du palmarès ?')) { return; }
    const liste = (cvRecord.palmares || []).filter(function(x) { return String(x.id) !== String(palId); });

    showLoader();
    const { data: updated, error } = await supabaseClient
        .from(CV_TABLE)
        .update({ palmares: liste })
        .eq('id', cvRecord.id)
        .select()
        .single();
    hideLoader();

    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    cvRecord = updated;
    if (String(editingPalId) === String(palId)) { resetFormulairePal(); }
    showToast('Distinction supprimée.', 'info');
    updateStats();
    renderPalmares();
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
    await loadOrCreateCvRecord();

    populateMission();
    updateStats();
    renderHistorique();
    renderPalmares();

    initUserMenu();
    initSidebar();

    const btnSaveMission = document.getElementById('btnSaveMission');
    if (btnSaveMission) { btnSaveMission.addEventListener('click', enregistrerMission); }

    const btnSaveHist = document.getElementById('btnSaveHist');
    if (btnSaveHist) { btnSaveHist.addEventListener('click', enregistrerHistorique); }
    const btnResetHist = document.getElementById('btnResetHist');
    if (btnResetHist) { btnResetHist.addEventListener('click', resetFormulaireHist); }

    const btnSavePal = document.getElementById('btnSavePal');
    if (btnSavePal) { btnSavePal.addEventListener('click', enregistrerPalmares); }
    const btnResetPal = document.getElementById('btnResetPal');
    if (btnResetPal) { btnResetPal.addEventListener('click', resetFormulairePal); }

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
