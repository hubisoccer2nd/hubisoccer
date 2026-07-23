/* ============================================================
   HubISoccer — coach-recos.js
   Page Recommandations officielles · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_talents  → page Mes Talents (lecture)
   - supabaseAuthPrive_coach_recos    → table de CETTE page
     (SQL : coach-recos-table.sql, sans RLS)
   ------------------------------------------------------------
   Cycle de vie d'une recommandation :
   'brouillon'  → en cours de rédaction (privée)
   'publiee'    → signée et visible (date_publication horodatée)
   Une publiée peut être dépubliée → retour en brouillon.
   Le titre est généré automatiquement s'il est laissé vide.
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
const RECOS_TABLE    = 'supabaseAuthPrive_coach_recos';     // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let mesTalents     = [];       // liaisons acceptées (sélecteur)
let allRecos       = [];       // toutes les recommandations du coach
let editingId      = null;     // recommandation en cours d'édition
let currentFilter  = 'all';    // all | sportif | artiste | ciblee

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

/* Une recommandation "ciblée" vise une structure précise */
function estCiblee(r) {
    return !!(r.destinataire && String(r.destinataire).trim() !== '');
}

/* Titre automatique si laissé vide */
function titreAuto(niveau, talentNom) {
    let t = 'Recommandation officielle';
    if (niveau) {
        t += ' — Niveau ' + niveau;
    }
    if (talentNom) {
        t += ' · ' + talentNom;
    }
    return t;
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

/* ---------- 9. CHARGEMENT DES TALENTS (sélecteur) ---------- */
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

    const select = document.getElementById('recoTalent');
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

/* ---------- 10. CHARGEMENT DES RECOMMANDATIONS ---------- */
async function loadRecos() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(RECOS_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + RECOS_TABLE + ' :', error.message);
        showToast('Table des recommandations absente. Exécutez le script SQL <b>coach-recos-table.sql</b> dans Supabase.', 'warning');
        allRecos = [];
        return;
    }
    allRecos = data || [];

    updateStats();
    renderDrafts();
    renderPublished();
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const publiees   = allRecos.filter(function(r) { return r.statut === 'publiee'; });
    const brouillons = allRecos.filter(function(r) { return r.statut === 'brouillon'; });

    /* Talents distincts ayant au moins une recommandation publiée */
    const talentsSet = {};
    publiees.forEach(function(r) {
        if (r.talent_id) {
            talentsSet[r.talent_id] = true;
        }
    });
    const nbTalents = Object.keys(talentsSet).length;

    /* Propositions ciblées = publiées visant une structure précise */
    const propositions = publiees.filter(function(r) { return estCiblee(r); });

    setText('statPubliees',     publiees.length);
    setText('statBrouillons',   brouillons.length);
    setText('statTalentsRecos', nbTalents);
    setText('statPropositions', propositions.length);

    /* Badge de notification = brouillons à finaliser */
    setText('notifBadge', brouillons.length);
}

/* ---------- 12. CONSTRUCTION D'UNE CARTE BROUILLON ---------- */
function buildDraftCard(r) {
    const card = document.createElement('div');
    card.className = 'draft-card';

    const titre = r.titre || titreAuto(r.niveau_certifie, r.talent_nom);

    card.innerHTML =
        '<div class="draft-ico"><i class="fas fa-pen-fancy"></i></div>' +
        '<div class="draft-content">' +
            '<div class="draft-title">' + escapeHtml(titre) + '</div>' +
            '<div class="draft-meta">' +
                (r.talent_type === 'artiste' ? '🎵 ' : '⚽ ') +
                escapeHtml(r.talent_nom || r.talent_id || '—') +
                (r.niveau_certifie ? ' · Niveau ' + escapeHtml(r.niveau_certifie) : '') +
                ' · modifié le ' + formatDateFr(r.updated_at || r.created_at) +
            '</div>' +
        '</div>' +
        '<div class="draft-actions">' +
            '<button class="btn-continue" data-id="' + r.id + '"><i class="fas fa-pen"></i> Continuer</button>' +
            '<button class="btn-publish-mini" data-id="' + r.id + '"><i class="fas fa-stamp"></i> Publier</button>' +
            '<button class="btn-delete" data-id="' + r.id + '"><i class="fas fa-trash-alt"></i></button>' +
        '</div>';

    return card;
}

/* ---------- 13. CONSTRUCTION D'UNE CARTE CERTIFICAT (PUBLIÉE) ---------- */
function buildCertificateCard(r) {
    const card = document.createElement('div');
    card.className = 'certificate-card';

    const titre    = r.titre || titreAuto(r.niveau_certifie, r.talent_nom);
    const signName = r.coach_nom || coachProfile?.full_name || 'Coach HubISoccer';

    card.innerHTML =
        '<div class="cert-seal"><i class="fas fa-award"></i></div>' +
        '<div class="cert-header">' +
            '<div class="cert-kicker">Recommandation officielle</div>' +
            '<div class="cert-title">' + escapeHtml(titre) + '</div>' +
        '</div>' +
        '<div class="cert-talent-line">' +
            'délivrée à <strong>' + escapeHtml(r.talent_nom || r.talent_id || '—') + '</strong> ' +
            (r.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
        '</div>' +
        (r.niveau_certifie
            ? '<span class="cert-niveau"><i class="fas fa-certificate"></i> Niveau ' + escapeHtml(r.niveau_certifie) + '</span>'
            : '') +
        (estCiblee(r)
            ? '<div class="cert-destinataire"><i class="fas fa-paper-plane"></i> À l\'attention de : ' + escapeHtml(r.destinataire) + '</div>'
            : '') +
        '<div class="cert-body">« ' + escapeHtml(r.contenu || '') + ' »</div>' +
        '<div class="cert-signature">' +
            '<span class="cert-date"><i class="fas fa-calendar-check"></i> Publiée le ' + formatDateFr(r.date_publication || r.created_at) + '</span>' +
            '<div class="cert-sign-block">' +
                '<div class="cert-sign-name">' + escapeHtml(signName) + '</div>' +
                '<div class="cert-sign-role">Coach / Entraîneur · HubISoccer</div>' +
            '</div>' +
        '</div>' +
        '<div class="cert-actions">' +
            '<button class="btn-edit" data-id="' + r.id + '"><i class="fas fa-pen"></i> Modifier</button>' +
            '<button class="btn-unpublish" data-id="' + r.id + '"><i class="fas fa-eye-slash"></i> Dépublier</button>' +
            '<button class="btn-delete" data-id="' + r.id + '"><i class="fas fa-trash-alt"></i></button>' +
        '</div>';

    return card;
}

/* ---------- 14. RENDU : BROUILLONS ---------- */
function renderDrafts() {
    const list  = document.getElementById('draftsList');
    const empty = document.getElementById('draftsEmpty');
    if (!list) {
        return;
    }
    const brouillons = allRecos.filter(function(r) { return r.statut === 'brouillon'; });

    list.querySelectorAll('.draft-card').forEach(function(c) { c.remove(); });

    if (brouillons.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    brouillons.forEach(function(r) {
        list.appendChild(buildDraftCard(r));
    });
    attachCardListeners(list);
}

/* ---------- 15. RENDU : PUBLIÉES ---------- */
function renderPublished() {
    const grid  = document.getElementById('publishedList');
    const empty = document.getElementById('publishedEmpty');
    if (!grid) {
        return;
    }
    let publiees = allRecos.filter(function(r) { return r.statut === 'publiee'; });

    if (currentFilter === 'sportif' || currentFilter === 'artiste') {
        publiees = publiees.filter(function(r) { return r.talent_type === currentFilter; });
    } else if (currentFilter === 'ciblee') {
        publiees = publiees.filter(function(r) { return estCiblee(r); });
    }

    grid.querySelectorAll('.certificate-card').forEach(function(c) { c.remove(); });

    if (publiees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    publiees.forEach(function(r) {
        grid.appendChild(buildCertificateCard(r));
    });
    attachCardListeners(grid);
}

/* ---------- 16. ÉCOUTEURS DES CARTES ---------- */
function attachCardListeners(container) {
    container.querySelectorAll('.btn-continue, .btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            chargerDansFormulaire(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-publish-mini').forEach(function(btn) {
        btn.addEventListener('click', function() {
            publierDepuisBrouillon(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-unpublish').forEach(function(btn) {
        btn.addEventListener('click', function() {
            depublier(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerReco(btn.dataset.id);
        });
    });
}

/* ---------- 17. CHARGER UNE RECO DANS LE FORMULAIRE ---------- */
function chargerDansFormulaire(recoId) {
    const r = allRecos.find(function(x) { return String(x.id) === String(recoId); });
    if (!r) {
        return;
    }
    editingId = r.id;

    /* Sélectionner le talent (option "liaison terminée" si nécessaire) */
    const select = document.getElementById('recoTalent');
    if (select) {
        let trouve = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === r.talent_id) {
                select.selectedIndex = i;
                trouve = true;
                break;
            }
        }
        if (!trouve && r.talent_id) {
            const opt = document.createElement('option');
            opt.value = r.talent_id;
            opt.textContent = (r.talent_nom || r.talent_id) + ' (liaison terminée)';
            opt.dataset.nom  = r.talent_nom || '';
            opt.dataset.type = r.talent_type || 'sportif';
            select.appendChild(opt);
            select.value = r.talent_id;
        }
    }

    /* Niveau certifié */
    const niveauSelect = document.getElementById('recoNiveau');
    if (niveauSelect) {
        niveauSelect.value = r.niveau_certifie || '';
        if (niveauSelect.value !== (r.niveau_certifie || '')) {
            niveauSelect.value = '';
        }
    }

    document.getElementById('recoTitre').value        = r.titre || '';
    document.getElementById('recoDestinataire').value = r.destinataire || '';
    document.getElementById('recoContenu').value      = r.contenu || '';

    const panel = document.getElementById('recoFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.add('editing'); }
    if (title) {
        title.innerHTML = '<i class="fas fa-pen"></i> Modifier la recommandation de ' +
                          escapeHtml(r.talent_nom || r.talent_id || 'ce talent');
    }
    panel?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- 18. RÉINITIALISER LE FORMULAIRE ---------- */
function resetFormulaire() {
    editingId = null;
    const select = document.getElementById('recoTalent');
    if (select) { select.selectedIndex = 0; }
    const niveauSelect = document.getElementById('recoNiveau');
    if (niveauSelect) { niveauSelect.selectedIndex = 0; }
    document.getElementById('recoTitre').value        = '';
    document.getElementById('recoDestinataire').value = '';
    document.getElementById('recoContenu').value      = '';

    const panel = document.getElementById('recoFormPanel');
    const title = document.getElementById('formTitle');
    if (panel) { panel.classList.remove('editing'); }
    if (title) { title.innerHTML = '<i class="fas fa-pen-fancy"></i> Rédiger une recommandation'; }
}

/* ---------- 19. ENREGISTRER (brouillon OU publication) ---------- */
async function enregistrerReco(statutCible) {
    const select   = document.getElementById('recoTalent');
    const talentId = select ? select.value : '';
    if (!talentId) {
        showToast('Sélectionnez le talent recommandé.', 'warning');
        return;
    }
    const contenu = (document.getElementById('recoContenu')?.value || '').trim();
    if (statutCible === 'publiee' && !contenu) {
        showToast('Le corps de la recommandation est obligatoire pour publier. Vous pouvez sinon l\'enregistrer en brouillon.', 'warning');
        return;
    }

    const opt        = select.options[select.selectedIndex];
    const talentNom  = opt.dataset.nom || opt.textContent;
    const talentType = (opt.dataset.type === 'artiste') ? 'artiste' : 'sportif';
    const niveau     = (document.getElementById('recoNiveau')?.value || '').trim() || null;

    let titre = (document.getElementById('recoTitre')?.value || '').trim();
    if (!titre) {
        titre = titreAuto(niveau, talentNom);
    }

    const payload = {
        coach_id        : coachProfile.hubisoccer_id,
        coach_nom       : coachProfile.full_name || null,
        talent_id       : talentId,
        talent_nom      : talentNom,
        talent_type     : talentType,
        titre           : titre,
        niveau_certifie : niveau,
        destinataire    : (document.getElementById('recoDestinataire')?.value || '').trim() || null,
        contenu         : contenu || null,
        statut          : statutCible
    };
    if (statutCible === 'publiee') {
        payload.date_publication = new Date().toISOString();
    } else {
        payload.date_publication = null;
    }

    showLoader();
    let error = null;

    if (editingId) {
        const res = await supabaseClient
            .from(RECOS_TABLE)
            .update(payload)
            .eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabaseClient
            .from(RECOS_TABLE)
            .insert([payload]);
        error = res.error;
    }
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    if (statutCible === 'publiee') {
        showToast('Recommandation PUBLIÉE et signée. 🏅 Elle a maintenant une valeur officielle sur la plateforme.', 'success');
    } else {
        showToast('Brouillon enregistré. Vous pourrez le finaliser plus tard. ✍🏾', 'success');
    }

    resetFormulaire();
    await loadRecos();
}

/* ---------- 20. PUBLIER DIRECTEMENT DEPUIS UN BROUILLON ---------- */
async function publierDepuisBrouillon(recoId) {
    const r = allRecos.find(function(x) { return String(x.id) === String(recoId); });
    if (!r) {
        return;
    }
    /* Un certificat sans contenu n'a pas de valeur : on force la rédaction */
    if (!r.contenu || String(r.contenu).trim() === '') {
        chargerDansFormulaire(recoId);
        showToast('Ce brouillon n\'a pas encore de contenu. Rédigez le corps de la recommandation puis publiez.', 'warning');
        return;
    }
    if (!confirm('Publier cette recommandation ?\n\nElle sera signée en votre nom et datée d\'aujourd\'hui.')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(RECOS_TABLE)
        .update({
            statut           : 'publiee',
            date_publication : new Date().toISOString()
        })
        .eq('id', recoId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Recommandation PUBLIÉE et signée. 🏅', 'success');
    await loadRecos();
}

/* ---------- 21. DÉPUBLIER (retour en brouillon) ---------- */
async function depublier(recoId) {
    if (!confirm('Dépublier cette recommandation ?\n\nElle redeviendra un brouillon privé et perdra sa date de publication.')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(RECOS_TABLE)
        .update({
            statut           : 'brouillon',
            date_publication : null
        })
        .eq('id', recoId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Recommandation dépubliée. Elle est de retour dans vos brouillons.', 'info');
    await loadRecos();
}

/* ---------- 22. SUPPRIMER UNE RECOMMANDATION ---------- */
async function supprimerReco(recoId) {
    const r = allRecos.find(function(x) { return String(x.id) === String(recoId); });
    const nom = r ? (r.talent_nom || r.talent_id || 'ce talent') : 'ce talent';
    if (!confirm('Supprimer définitivement cette recommandation concernant ' + nom + ' ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(RECOS_TABLE)
        .delete()
        .eq('id', recoId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (String(editingId) === String(recoId)) {
        resetFormulaire();
    }
    showToast('Recommandation supprimée.', 'info');
    await loadRecos();
}

/* ---------- 23. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#publishedFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#publishedFilters .filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPublished();
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
    await loadRecos();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Boutons du formulaire */
    const btnDraft = document.getElementById('btnSaveDraft');
    if (btnDraft) {
        btnDraft.addEventListener('click', function() {
            enregistrerReco('brouillon');
        });
    }
    const btnPublish = document.getElementById('btnPublish');
    if (btnPublish) {
        btnPublish.addEventListener('click', function() {
            enregistrerReco('publiee');
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
