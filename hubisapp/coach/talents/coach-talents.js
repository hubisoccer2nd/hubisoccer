/* ============================================================
   HubISoccer — coach-talents.js
   Page Mes Talents (Sportifs & Artistes) · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_talents  → table de CETTE page
   ------------------------------------------------------------
   Workflow de liaison :
   1. Le coach recherche un talent par son ID HubISoccer
   2. Il choisit le type (sportif/artiste) + rôle + message
   3. La demande part en statut 'pending' (initiateur = 'coach')
   4. Le talent accepte → 'accepted' / refuse → 'rejected'
   5. Les talents peuvent aussi initier (initiateur = 'talent') :
      ces demandes apparaissent dans "Demandes reçues"
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';        // partagée
const TALENTS_TABLE  = 'supabaseAuthPrive_coach_talents';   // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser    = null;
let coachProfile   = null;
let foundProfile   = null;     // résultat de la recherche d'un talent
let allLiaisons    = [];       // toutes les lignes coach_talents du coach
let profilesCache  = {};       // hubisoccer_id → { full_name, avatar_url }
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

/* Échappe le HTML pour éviter toute injection dans les cartes */
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

/* ---------- 8. CHARGEMENT PROFIL COACH (table partagée) ---------- */
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

/* ---------- 9. CHARGEMENT DES LIAISONS ---------- */
async function loadLiaisons() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(TALENTS_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + TALENTS_TABLE + ' :', error.message);
        showToast('Table des talents absente. Exécutez le script SQL <b>coach-espace-tables.sql</b> dans Supabase.', 'warning');
        allLiaisons = [];
        return;
    }
    allLiaisons = data || [];

    /* Récupérer en une requête les profils (nom + avatar) de tous les talents liés */
    await loadProfilesCache();

    updateStats();
    renderReceived();
    renderSent();
    renderTalents();
}

/* ---------- 10. CACHE DES PROFILS TALENTS ----------
   On lit les avatars et noms actuels depuis la table partagée
   pour garder l'affichage à jour même si le talent a changé
   sa photo après la création de la liaison.                  */
async function loadProfilesCache() {
    profilesCache = {};
    const ids = allLiaisons.map(function(l) { return l.talent_id; });
    if (ids.length === 0) {
        return;
    }
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('hubisoccer_id, full_name, avatar_url')
        .in('hubisoccer_id', ids);
    if (error) {
        console.warn('Cache profils talents indisponible :', error.message);
        return;
    }
    (data || []).forEach(function(p) {
        profilesCache[p.hubisoccer_id] = p;
    });
}

/* Renvoie le nom le plus frais disponible pour une liaison */
function talentName(liaison) {
    const cached = profilesCache[liaison.talent_id];
    return (cached && cached.full_name) || liaison.talent_nom || 'Talent';
}

/* Renvoie l'avatar_url le plus frais disponible (ou null) */
function talentAvatar(liaison) {
    const cached = profilesCache[liaison.talent_id];
    return (cached && cached.avatar_url) ? cached.avatar_url : null;
}

/* ---------- 11. STATS RAPIDES ---------- */
function updateStats() {
    const acceptes = allLiaisons.filter(function(l) { return l.statut === 'accepted'; });
    const pendings = allLiaisons.filter(function(l) { return l.statut === 'pending'; });
    const sportifs = acceptes.filter(function(l) { return l.talent_type === 'sportif'; });
    const artistes = acceptes.filter(function(l) { return l.talent_type === 'artiste'; });

    setText('statTotal',    acceptes.length);
    setText('statSportifs', sportifs.length);
    setText('statArtistes', artistes.length);
    setText('statAttente',  pendings.length);

    /* Badge de notification = demandes reçues des talents à traiter */
    const recues = pendings.filter(function(l) { return l.initiateur === 'talent'; });
    setText('notifBadge', recues.length);
}

/* ---------- 12. RENDU : DEMANDES REÇUES (initiateur = talent) ---------- */
function renderReceived() {
    const grid  = document.getElementById('receivedList');
    const empty = document.getElementById('receivedEmpty');
    if (!grid) {
        return;
    }
    const recues = allLiaisons.filter(function(l) {
        return l.statut === 'pending' && l.initiateur === 'talent';
    });

    /* Nettoyer les anciennes cartes (on garde le <p> vide) */
    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (recues.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    recues.forEach(function(l) {
        const nom    = escapeHtml(talentName(l));
        const avatar = talentAvatar(l);
        const card   = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-head">' +
                '<div class="req-avatar">' +
                    (avatar
                        ? '<img src="' + escapeHtml(avatar) + '" alt="Avatar">'
                        : '<div class="req-initials">' + getInitials(nom) + '</div>') +
                '</div>' +
                '<div>' +
                    '<div class="req-name">' + nom + '</div>' +
                    '<div class="req-meta">' +
                        (l.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                        (l.talent_role ? ' · ' + escapeHtml(l.talent_role) : '') +
                        ' · ' + formatDateFr(l.created_at) +
                    '</div>' +
                '</div>' +
            '</div>' +
            (l.message ? '<div class="req-message">« ' + escapeHtml(l.message) + ' »</div>' : '') +
            '<div class="req-actions">' +
                '<button class="btn-accept" data-id="' + l.id + '"><i class="fas fa-check"></i> Accepter</button>' +
                '<button class="btn-reject" data-id="' + l.id + '"><i class="fas fa-times"></i> Refuser</button>' +
            '</div>';
        grid.appendChild(card);
    });

    /* Écouteurs accepter / refuser */
    grid.querySelectorAll('.btn-accept').forEach(function(btn) {
        btn.addEventListener('click', function() {
            repondreDemande(btn.dataset.id, 'accepted');
        });
    });
    grid.querySelectorAll('.btn-reject').forEach(function(btn) {
        btn.addEventListener('click', function() {
            repondreDemande(btn.dataset.id, 'rejected');
        });
    });
}

/* ---------- 13. RENDU : DEMANDES ENVOYÉES (initiateur = coach) ---------- */
function renderSent() {
    const grid  = document.getElementById('sentList');
    const empty = document.getElementById('sentEmpty');
    if (!grid) {
        return;
    }
    const envoyees = allLiaisons.filter(function(l) {
        return l.statut === 'pending' && l.initiateur === 'coach';
    });

    grid.querySelectorAll('.request-card').forEach(function(c) { c.remove(); });

    if (envoyees.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    envoyees.forEach(function(l) {
        const nom    = escapeHtml(talentName(l));
        const avatar = talentAvatar(l);
        const card   = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML =
            '<div class="request-head">' +
                '<div class="req-avatar">' +
                    (avatar
                        ? '<img src="' + escapeHtml(avatar) + '" alt="Avatar">'
                        : '<div class="req-initials">' + getInitials(nom) + '</div>') +
                '</div>' +
                '<div>' +
                    '<div class="req-name">' + nom + '</div>' +
                    '<div class="req-meta">' +
                        (l.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') +
                        (l.talent_role ? ' · ' + escapeHtml(l.talent_role) : '') +
                        ' · envoyée le ' + formatDateFr(l.created_at) +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="req-actions">' +
                '<button class="btn-cancel-req" data-id="' + l.id + '"><i class="fas fa-undo"></i> Annuler la demande</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-cancel-req').forEach(function(btn) {
        btn.addEventListener('click', function() {
            annulerDemande(btn.dataset.id);
        });
    });
}

/* ---------- 14. RENDU : TALENTS ENCADRÉS (acceptés) ---------- */
function renderTalents() {
    const grid  = document.getElementById('talentsList');
    const empty = document.getElementById('talentsEmpty');
    if (!grid) {
        return;
    }
    let acceptes = allLiaisons.filter(function(l) { return l.statut === 'accepted'; });
    if (currentFilter !== 'all') {
        acceptes = acceptes.filter(function(l) { return l.talent_type === currentFilter; });
    }

    grid.querySelectorAll('.talent-card').forEach(function(c) { c.remove(); });

    if (acceptes.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    acceptes.forEach(function(l) {
        const nom    = escapeHtml(talentName(l));
        const avatar = talentAvatar(l);
        const card   = document.createElement('div');
        card.className = 'talent-card';
        card.innerHTML =
            '<div class="talent-head">' +
                '<div class="talent-avatar">' +
                    (avatar
                        ? '<img src="' + escapeHtml(avatar) + '" alt="Avatar">'
                        : '<div class="talent-initials">' + getInitials(nom) + '</div>') +
                '</div>' +
                '<div class="talent-identity">' +
                    '<div class="talent-name">' + nom + '</div>' +
                    '<div class="talent-role">' + (l.talent_role ? escapeHtml(l.talent_role) : 'Discipline non renseignée') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="talent-tags">' +
                '<span class="type-badge ' + (l.talent_type === 'artiste' ? 'artiste' : 'sportif') + '">' +
                    (l.talent_type === 'artiste' ? '<i class="fas fa-music"></i> Artiste' : '<i class="fas fa-futbol"></i> Sportif') +
                '</span>' +
                '<span class="date-badge"><i class="fas fa-link"></i> Lié le ' + formatDateFr(l.updated_at || l.created_at) + '</span>' +
            '</div>' +
            '<div class="talent-actions">' +
                '<a class="btn-eval-link" href="../evaluations/coach-eval.html?talent=' + encodeURIComponent(l.talent_id) + '">' +
                    '<i class="fas fa-star-half-alt"></i> Évaluer' +
                '</a>' +
                '<button class="btn-remove" data-id="' + l.id + '" data-nom="' + nom + '">' +
                    '<i class="fas fa-user-minus"></i> Retirer' +
                '</button>' +
            '</div>';
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
            retirerTalent(btn.dataset.id, btn.dataset.nom);
        });
    });
}

/* ---------- 15. RECHERCHE D'UN TALENT PAR ID HUBISOCCER ---------- */
async function rechercherTalent() {
    const input = document.getElementById('searchTalentId');
    const id = (input?.value || '').trim();

    if (!id) {
        showToast('Saisissez un ID HubISoccer.', 'warning');
        return;
    }
    /* Garde-fou : impossible de se lier à soi-même */
    if (id === coachProfile.hubisoccer_id) {
        showToast('Vous ne pouvez pas vous lier à vous-même. 😄', 'warning');
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('hubisoccer_id', id)
        .maybeSingle();
    hideLoader();

    if (error) {
        showToast('Erreur de recherche : ' + error.message, 'error');
        return;
    }
    if (!data) {
        showToast('Aucun profil trouvé avec cet ID. Vérifiez auprès du talent.', 'warning');
        document.getElementById('searchResult').style.display = 'none';
        foundProfile = null;
        return;
    }

    foundProfile = data;

    /* Remplir la carte de prévisualisation */
    setText('foundName', data.full_name || 'Profil sans nom');
    setText('foundId',   'ID : ' + data.hubisoccer_id);
    setText('foundRole', data.specialite || data.role || 'Rôle non renseigné');

    const img  = document.getElementById('foundAvatar');
    const init = document.getElementById('foundInitials');
    if (data.avatar_url && data.avatar_url !== '') {
        if (img)  { img.src = data.avatar_url; img.style.display = 'block'; }
        if (init) { init.style.display = 'none'; }
    } else {
        if (init) { init.textContent = getInitials(data.full_name || '?'); init.style.display = 'flex'; }
        if (img)  { img.style.display = 'none'; }
    }

    /* Pré-remplir le rôle si le profil en a un */
    const roleInput = document.getElementById('talentRole');
    if (roleInput) {
        roleInput.value = data.specialite || data.role || '';
    }

    document.getElementById('searchResult').style.display = 'block';
}

/* ---------- 16. ENVOI DE LA DEMANDE DE LIAISON ---------- */
async function envoyerDemande() {
    if (!foundProfile) {
        showToast('Recherchez d\'abord un talent.', 'warning');
        return;
    }

    const typeInput = document.querySelector('input[name="talentType"]:checked');
    const talentType = typeInput ? typeInput.value : 'sportif';
    const talentRole = (document.getElementById('talentRole')?.value || '').trim();
    const message    = (document.getElementById('linkMessage')?.value || '').trim();

    /* Vérifier si une liaison existe déjà avec ce talent */
    const existante = allLiaisons.find(function(l) {
        return l.talent_id === foundProfile.hubisoccer_id;
    });

    showLoader();

    if (existante) {
        if (existante.statut === 'accepted') {
            hideLoader();
            showToast('Ce talent est déjà dans votre effectif. ✅', 'info');
            return;
        }
        if (existante.statut === 'pending') {
            hideLoader();
            showToast('Une demande est déjà en attente avec ce talent.', 'info');
            return;
        }
        /* statut === 'rejected' → on relance la demande en mettant à jour la ligne */
        const { error: ue } = await supabaseClient
            .from(TALENTS_TABLE)
            .update({
                statut      : 'pending',
                initiateur  : 'coach',
                talent_type : talentType,
                talent_role : talentRole || null,
                message     : message || null
            })
            .eq('id', existante.id);
        hideLoader();
        if (ue) {
            showToast('Erreur : ' + ue.message, 'error');
            return;
        }
        showToast('Demande relancée auprès de ' + escapeHtml(foundProfile.full_name || 'ce talent') + ' ✅', 'success');
    } else {
        /* Nouvelle liaison */
        const { error: ie } = await supabaseClient
            .from(TALENTS_TABLE)
            .insert([{
                coach_id    : coachProfile.hubisoccer_id,
                talent_id   : foundProfile.hubisoccer_id,
                talent_nom  : foundProfile.full_name || null,
                talent_type : talentType,
                talent_role : talentRole || null,
                statut      : 'pending',
                initiateur  : 'coach',
                message     : message || null
            }]);
        hideLoader();
        if (ie) {
            /* 23505 = violation d'unicité (course rare) */
            if (ie.code === '23505') {
                showToast('Une liaison existe déjà avec ce talent.', 'info');
            } else {
                showToast('Erreur : ' + ie.message, 'error');
            }
            return;
        }
        showToast('Demande de liaison envoyée à ' + escapeHtml(foundProfile.full_name || 'ce talent') + ' 🎉', 'success');
    }

    /* Réinitialiser le panneau et recharger */
    annulerRecherche();
    await loadLiaisons();
}

/* ---------- 17. RÉINITIALISER LE PANNEAU DE RECHERCHE ---------- */
function annulerRecherche() {
    foundProfile = null;
    const res = document.getElementById('searchResult');
    if (res) { res.style.display = 'none'; }
    const input = document.getElementById('searchTalentId');
    if (input) { input.value = ''; }
    const msg = document.getElementById('linkMessage');
    if (msg) { msg.value = ''; }
    const role = document.getElementById('talentRole');
    if (role) { role.value = ''; }
}

/* ---------- 18. RÉPONDRE À UNE DEMANDE REÇUE ---------- */
async function repondreDemande(liaisonId, reponse) {
    const verbe = (reponse === 'accepted') ? 'accepter' : 'refuser';
    if (!confirm('Confirmez-vous vouloir ' + verbe + ' cette demande ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(TALENTS_TABLE)
        .update({ statut: reponse })
        .eq('id', liaisonId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    if (reponse === 'accepted') {
        showToast('Talent ajouté à votre effectif ! 🎉', 'success');
    } else {
        showToast('Demande refusée.', 'info');
    }
    await loadLiaisons();
}

/* ---------- 19. ANNULER UNE DEMANDE ENVOYÉE ---------- */
async function annulerDemande(liaisonId) {
    if (!confirm('Annuler cette demande de liaison ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(TALENTS_TABLE)
        .delete()
        .eq('id', liaisonId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast('Demande annulée.', 'info');
    await loadLiaisons();
}

/* ---------- 20. RETIRER UN TALENT DE L'EFFECTIF ---------- */
async function retirerTalent(liaisonId, nom) {
    if (!confirm('Retirer ' + nom + ' de votre effectif ?\n\nLa liaison sera supprimée. Le talent pourra redemander une liaison plus tard.')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(TALENTS_TABLE)
        .delete()
        .eq('id', liaisonId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    showToast(nom + ' a été retiré de votre effectif.', 'info');
    await loadLiaisons();
}

/* ---------- 21. FILTRES (Tous / Sportifs / Artistes) ---------- */
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTalents();
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
    await loadLiaisons();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Recherche */
    const btnSearch = document.getElementById('btnSearchTalent');
    if (btnSearch) {
        btnSearch.addEventListener('click', rechercherTalent);
    }
    const inputSearch = document.getElementById('searchTalentId');
    if (inputSearch) {
        inputSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                rechercherTalent();
            }
        });
    }

    /* Envoi / annulation de la demande */
    const btnSend = document.getElementById('btnSendRequest');
    if (btnSend) {
        btnSend.addEventListener('click', envoyerDemande);
    }
    const btnCancel = document.getElementById('btnCancelSearch');
    if (btnCancel) {
        btnCancel.addEventListener('click', annulerRecherche);
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
