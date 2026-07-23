/* ============================================================
   HubISoccer — coach-licences.js
   Page Licences & Certifications · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles         → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_licences   → table de CETTE page
     (SQL : coach-licences-table.sql, sans RLS)
   ------------------------------------------------------------
   Statut d'expiration calculé côté client (jamais stocké) :
   - date_expiration NULL              → 'permanente'
   - expire dans plus de 60 jours      → 'active'
   - expire dans 60 jours ou moins     → 'renouveler'
   - date dépassée                     → 'expiree'
   Le champ `statut` en base est DIFFÉRENT : c'est la validation
   administrative HubISoccer (pending/verified/rejected).
   Document justificatif : bucket 'coach-documents' (déjà créé
   par coach-verif-table.sql — réutilisé ici, aucun nouveau bucket).
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES & STOCKAGE ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';         // partagée
const LICENCES_TABLE = 'supabaseAuthPrive_coach_licences';   // cette page
const DOCS_BUCKET     = 'coach-documents';                   // réutilisé (page Vérification)

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let allLicences    = [];       // toutes les certifications du coach
let editingId      = null;     // certification en cours d'édition
let currentFilter  = 'all';    // all | active | renouveler | expiree
let pendingFile     = null;    // fichier sélectionné, pas encore téléversé

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

/* ---------- 7. STATUT D'EXPIRATION (calculé, jamais stocké) ---------- */
function statutExpiration(dateExpiration) {
    if (!dateExpiration) {
        return 'permanente';
    }
    const maintenant = new Date();
    maintenant.setHours(0, 0, 0, 0);
    const expiration = new Date(dateExpiration);
    const diffJours = Math.round((expiration - maintenant) / 86400000);

    if (diffJours < 0) {
        return 'expiree';
    }
    if (diffJours <= 60) {
        return 'renouveler';
    }
    return 'active';
}

const STATUT_LABELS = {
    permanente : 'Permanente',
    active     : 'Active',
    renouveler : 'Expire bientôt',
    expiree    : 'Expirée'
};
const STATUT_ICONS = {
    permanente : 'fa-infinity',
    active     : 'fa-check-circle',
    renouveler : 'fa-hourglass-half',
    expiree    : 'fa-times-circle'
};

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

/* ---------- 10. CHARGEMENT DES CERTIFICATIONS ---------- */
async function loadLicences() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(LICENCES_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('date_obtention', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + LICENCES_TABLE + ' :', error.message);
        showToast('Table des certifications absente. Exécutez le script SQL <b>coach-licences-table.sql</b> dans Supabase.', 'warning');
        allLicences = [];
        return;
    }
    allLicences = data || [];

    updateStats();
    renderLicences();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const avecStatut = allLicences.map(function(l) {
        return { l: l, s: statutExpiration(l.date_expiration) };
    });

    const total      = allLicences.length;
    const actives    = avecStatut.filter(function(x) { return x.s === 'active' || x.s === 'permanente'; }).length;
    const renouveler = avecStatut.filter(function(x) { return x.s === 'renouveler'; }).length;
    const verifiees  = allLicences.filter(function(l) { return l.statut === 'verified'; }).length;

    setText('statTotal', total);
    setText('statActives', actives);
    setText('statRenouveler', renouveler);
    setText('statVerifiees', verifiees);

    /* Badge de notification = certifications à renouveler bientôt */
    setText('notifBadge', renouveler);
}

/* ---------- 12. CONSTRUCTION D'UNE CARTE CERTIFICATION ---------- */
function buildLicenceCard(l) {
    const statutExp = statutExpiration(l.date_expiration);
    const card = document.createElement('div');
    card.className = 'licence-card ' + statutExp;

    const dateExpTxt = l.date_expiration
        ? 'Expire le ' + formatDateFr(l.date_expiration)
        : 'N\'expire jamais';

    card.innerHTML =
        '<div class="licence-head">' +
            '<div>' +
                '<div class="licence-titre">' + escapeHtml(l.titre) +
                    (l.statut === 'verified' ? ' <i class="fas fa-check-circle verified-check" title="Vérifiée par HubISoccer"></i>' : '') +
                '</div>' +
                '<div class="licence-organisme">' + escapeHtml(l.organisme) + '</div>' +
            '</div>' +
        '</div>' +
        '<span class="licence-status-badge ' + statutExp + '">' +
            '<i class="fas ' + STATUT_ICONS[statutExp] + '"></i> ' + STATUT_LABELS[statutExp] +
        '</span>' +
        '<div class="licence-meta">' +
            (l.categorie ? '<span><i class="fas fa-tag"></i>' + escapeHtml(l.categorie) + '</span>' : '') +
            '<span><i class="fas fa-calendar-check"></i>Obtenue le ' + formatDateFr(l.date_obtention) + '</span>' +
            '<span><i class="fas fa-calendar-times"></i>' + dateExpTxt + '</span>' +
            (l.numero_certification ? '<span><i class="fas fa-hashtag"></i>' + escapeHtml(l.numero_certification) + '</span>' : '') +
        '</div>' +
        (l.document_url
            ? '<a href="' + escapeHtml(l.document_url) + '" target="_blank" rel="noopener noreferrer" class="licence-doc-link"><i class="fas fa-paperclip"></i> Voir le document</a>'
            : '') +
        '<div class="licence-actions">' +
            '<button class="btn-edit" data-id="' + l.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-delete" data-id="' + l.id + '"><i class="fas fa-trash-alt"></i> Supprimer</button>' +
        '</div>';

    return card;
}

/* ---------- 13. RENDU DE LA LISTE ---------- */
function renderLicences() {
    const grid  = document.getElementById('licencesGrid');
    const empty = document.getElementById('licencesEmpty');
    if (!grid) {
        return;
    }

    let filtrees = allLicences;
    if (currentFilter === 'active') {
        filtrees = allLicences.filter(function(l) {
            const s = statutExpiration(l.date_expiration);
            return s === 'active' || s === 'permanente';
        });
    } else if (currentFilter === 'renouveler') {
        filtrees = allLicences.filter(function(l) { return statutExpiration(l.date_expiration) === 'renouveler'; });
    } else if (currentFilter === 'expiree') {
        filtrees = allLicences.filter(function(l) { return statutExpiration(l.date_expiration) === 'expiree'; });
    }

    grid.querySelectorAll('.licence-card').forEach(function(c) { c.remove(); });

    if (filtrees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    filtrees.forEach(function(l) {
        grid.appendChild(buildLicenceCard(l));
    });
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
            supprimerLicence(btn.dataset.id);
        });
    });
}

/* ---------- 15. ZONE DE TÉLÉVERSEMENT DE DOCUMENT ---------- */
function initDocUpload() {
    const zone = document.getElementById('docUploadZone');
    if (!zone) {
        return;
    }
    zone.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Fichier trop lourd (5 Mo maximum).', 'warning');
                return;
            }
            pendingFile = file;
            marquerZoneAvecFichier(file.name);
        };
        input.click();
    });
}

function marquerZoneAvecFichier(nomFichier) {
    const zone  = document.getElementById('docUploadZone');
    const label = document.getElementById('docUploadLabel');
    if (zone)  { zone.classList.add('has-file'); }
    if (label) { label.textContent = nomFichier; }
}

function reinitialiserZoneDoc() {
    pendingFile = null;
    const zone  = document.getElementById('docUploadZone');
    const label = document.getElementById('docUploadLabel');
    if (zone)  { zone.classList.remove('has-file'); }
    if (label) { label.textContent = 'Cliquez pour joindre le scan de votre certification'; }
}

/* ---------- 16. CHECKBOX "NE EXPIRE JAMAIS" ---------- */
function initSansExpiration() {
    const checkbox = document.getElementById('lcSansExpiration');
    const dateInput = document.getElementById('lcDateExpiration');
    if (!checkbox || !dateInput) {
        return;
    }
    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            dateInput.value = '';
            dateInput.disabled = true;
        } else {
            dateInput.disabled = false;
        }
    });
}

/* ---------- 17. CHARGER UNE CERTIFICATION DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(licenceId) {
    const l = allLicences.find(function(x) { return String(x.id) === String(licenceId); });
    if (!l) {
        return;
    }
    editingId = l.id;

    document.getElementById('lcTitre').value     = l.titre || '';
    document.getElementById('lcOrganisme').value = l.organisme || '';
    document.getElementById('lcCategorie').value = l.categorie || '';
    document.getElementById('lcNumero').value    = l.numero_certification || '';
    document.getElementById('lcDateObtention').value = l.date_obtention || '';

    const checkbox  = document.getElementById('lcSansExpiration');
    const dateInput = document.getElementById('lcDateExpiration');
    if (l.date_expiration) {
        dateInput.value = l.date_expiration;
        dateInput.disabled = false;
        checkbox.checked = false;
    } else {
        dateInput.value = '';
        dateInput.disabled = true;
        checkbox.checked = true;
    }

    reinitialiserZoneDoc();
    if (l.document_nom) {
        marquerZoneAvecFichier(l.document_nom + ' (déjà joint — cliquez pour remplacer)');
    }

    const panel = document.getElementById('licenceFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> Modifier « ' + escapeHtml(l.titre) + ' »';
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 18. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    document.getElementById('lcTitre').value = '';
    document.getElementById('lcOrganisme').value = '';
    document.getElementById('lcCategorie').value = '';
    document.getElementById('lcNumero').value = '';
    document.getElementById('lcDateObtention').value = '';
    document.getElementById('lcDateExpiration').value = '';
    document.getElementById('lcDateExpiration').disabled = false;
    document.getElementById('lcSansExpiration').checked = false;
    reinitialiserZoneDoc();

    const panel = document.getElementById('licenceFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une certification'; }
}

/* ---------- 19. ENREGISTRER (création ou édition) ---------- */
async function enregistrerLicence() {
    const titre     = (document.getElementById('lcTitre')?.value || '').trim();
    const organisme = (document.getElementById('lcOrganisme')?.value || '').trim();
    const dateObtention = document.getElementById('lcDateObtention')?.value || '';

    if (!titre) {
        showToast('Le titre de la certification est obligatoire.', 'warning');
        return;
    }
    if (!organisme) {
        showToast('L\'organisme émetteur est obligatoire.', 'warning');
        return;
    }
    if (!dateObtention) {
        showToast('La date d\'obtention est obligatoire.', 'warning');
        return;
    }

    const sansExpiration = document.getElementById('lcSansExpiration')?.checked === true;
    const dateExpiration = sansExpiration ? null : (document.getElementById('lcDateExpiration')?.value || null);

    const payload = {
        coach_id             : coachProfile.hubisoccer_id,
        titre                : titre,
        organisme            : organisme,
        categorie            : document.getElementById('lcCategorie')?.value || null,
        numero_certification : (document.getElementById('lcNumero')?.value || '').trim() || null,
        date_obtention       : dateObtention,
        date_expiration      : dateExpiration
    };

    showLoader();
    try {
        /* Téléversement du document si un nouveau fichier a été choisi */
        if (pendingFile) {
            const ext      = pendingFile.name.split('.').pop();
            const fileName = 'licence_' + Date.now() + '.' + ext;
            const filePath = coachProfile.hubisoccer_id + '/' + fileName;

            const { error: upErr } = await supabaseClient.storage
                .from(DOCS_BUCKET)
                .upload(filePath, pendingFile);
            if (upErr) {
                throw upErr;
            }
            const { data: urlData } = supabaseClient.storage
                .from(DOCS_BUCKET)
                .getPublicUrl(filePath);
            payload.document_url = urlData.publicUrl;
            payload.document_nom = pendingFile.name;
        }

        let error = null;
        if (editingId) {
            const res = await supabaseClient
                .from(LICENCES_TABLE)
                .update(payload)
                .eq('id', editingId);
            error = res.error;
        } else {
            payload.statut = 'pending';
            const res = await supabaseClient
                .from(LICENCES_TABLE)
                .insert([payload]);
            error = res.error;
        }
        hideLoader();

        if (error) {
            throw error;
        }

        showToast(editingId ? 'Certification mise à jour. ✅' : 'Certification ajoutée à votre carnet. 🎓', 'success');
        resetFormulaire();
        await loadLicences();
    } catch (err) {
        hideLoader();
        showToast('Erreur : ' + err.message, 'error');
    }
}

/* ---------- 20. SUPPRIMER UNE CERTIFICATION ---------- */
async function supprimerLicence(licenceId) {
    const l = allLicences.find(function(x) { return String(x.id) === String(licenceId); });
    const titre = l ? l.titre : 'cette certification';
    if (!confirm('Supprimer définitivement « ' + titre + ' » de votre carnet ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(LICENCES_TABLE)
        .delete()
        .eq('id', licenceId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(licenceId)) {
        resetFormulaire();
    }
    showToast('Certification supprimée.', 'info');
    await loadLicences();
}

/* ---------- 21. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#licenceFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#licenceFilters .filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderLicences();
        });
    });
}

/* ---------- 22. MENU UTILISATEUR ---------- */
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

/* ---------- 23. SIDEBAR + SWIPE ---------- */
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

/* ---------- 24. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 25. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadLicences();

    initFilters();
    initUserMenu();
    initSidebar();
    initDocUpload();
    initSansExpiration();

    /* Boutons du formulaire */
    const btnSave = document.getElementById('btnSaveLicence');
    if (btnSave) {
        btnSave.addEventListener('click', enregistrerLicence);
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
