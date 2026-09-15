/* ============================================================
   HubISoccer — match-report.js
   Système Gestion Tournois — Saisir un rapport de match
   ------------------------------------------------------------
   Correction critique : un caractere "r" isole trainait juste
   avant ce bloc de commentaire dans le fichier source. En JS
   c'est syntaxiquement valide (identifiant seul comme
   instruction), mais r n'est jamais declare -- provoque une
   ReferenceError des le chargement, avant que la moindre
   fonction n'ait la moindre chance de s'executer. Le fichier
   entier etait donc casse. Retire.
   Tables migrees vers supabaseAuthPrive_gt_*. Routage dynamique
   profil/parametres + niveaux de sidebar ajoutes.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES (convention supabaseAuthPrive_gt_*)
// ═══════════════════════════════════════════════════════════
const TBL_MATCHES        = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS             = 'supabaseAuthPrive_gt_teams';
const TBL_TOURNAMENTS          = 'supabaseAuthPrive_gt_tournaments';
const TBL_REPORTS                 = 'supabaseAuthPrive_gt_match_reports';
const TBL_PROFILES                   = 'supabaseAuthPrive_profiles';
const TBL_OFFICIELS                     = 'supabaseAuthPrive_gt_tournament_officials';
const TBL_VERSIONS                      = 'supabaseAuthPrive_gt_match_report_versions';
const TBL_TEAM_PLAYERS                  = 'supabaseAuthPrive_gt_team_players';
const TBL_EVENTS                        = 'supabaseAuthPrive_gt_match_events';
const TBL_SPORTS                        = 'supabaseAuthPrive_gt_sports';
const REPORT_BUCKET                     = 'tournament-reports';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentMatchId = null;

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 20000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 10. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 11. RÉCUPÉRATION DE L'ID DU MATCH DANS L'URL
// ═══════════════════════════════════════════════════════════
function getMatchIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match_id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES INFOS DU MATCH (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadMatchInfo() {
    if (!currentMatchId) {
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'match',
            parametre: 'match_id',
            portee: 'tousMatchs',
            icone: 'fa-file-signature',
            titre: 'Sur quel match voulez-vous déposer un rapport ?',
            aide: 'Choisissez d\'abord le tournoi, puis la rencontre.',
            messageVide: 'Aucun tournoi disponible pour le moment.'
        });
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, team_a_id, team_b_id, match_date, tournament_id')
        .eq('id', currentMatchId)
        .single();

    if (error || !match) {
        hideLoader();
        showToast('Match introuvable.', 'error');
        return;
    }

    let teamAName = 'Équipe A', teamBName = 'Équipe B', tournamentName = '';

    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_a_id).maybeSingle();
        if (teamA) teamAName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_b_id).maybeSingle();
        if (teamB) teamBName = teamB.name;
    }
    idTournoiCourant = match.tournament_id;

    if (match.tournament_id) {
        const { data: tData } = await supabaseClient.from(TBL_TOURNAMENTS).select('name, location, sport_id').eq('id', match.tournament_id).maybeSingle();
        if (tData) {
            tournamentName = tData.name;
            document.getElementById('matchLocation').textContent = tData.location || 'Lieu non précisé';
        }
        // Chantier 08 — la discipline, resolue avant que le
        // formulaire de rapport ne soit monte.
        if (tData && tData.sport_id) {
            const { data: sp } = await supabaseClient
                .from(TBL_SPORTS).select('name').eq('id', tData.sport_id).maybeSingle();
            nomSportTournoi = sp ? (sp.name || '') : '';
        }
    }
    appliquerLexique();

    document.getElementById('matchTeams').textContent = teamAName + ' vs ' + teamBName + (tournamentName ? ' (' + tournamentName + ')' : '');
    document.getElementById('matchDate').textContent = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';

    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 13. DÉSIGNATIONS, RÔLE ET VERSIONS (chantier 04)
// ------------------------------------------------------------
// Le droit de déposer un rapport ne vient PAS du code de rôle du
// compte. Il vient de la désignation faite par l'organisateur.
// Un parrain peut être désigné commissaire de match.
// ═══════════════════════════════════════════════════════════

let mesDesignations = [];
let roleRetenu = null;         // { role_code, team_id, match_id }
let equipesDuMatch = [];
let sportifsDuMatch = [];

// Chantier 08 — la discipline du tournoi de ce match. Elle
// alimente le lexique ET gt-officiels : les libelles du
// formulaire de rapport (« Sportif », « Buteur ») suivent la
// discipline comme le reste de la page.
let nomSportTournoi = '';

function mot(gabarit) {
    if (!window.GTLexique) return gabarit;
    return GTLexique.remplir(gabarit, nomSportTournoi);
}
function appliquerLexique() {
    if (window.GTLexique) GTLexique.appliquer(nomSportTournoi);
}
let versionsExistantes = [];
let padSignature = null;
let idTournoiCourant = null;

async function chargerMesDesignations() {
    if (!currentMatchId || !idTournoiCourant) return [];

    const { data, error } = await supabaseClient
        .from(TBL_OFFICIELS)
        .select('id, role_code, team_id, match_id, is_active')
        .eq('tournament_id', idTournoiCourant)
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

    if (error) {
        console.warn('Lecture des désignations :', error.message);
        return [];
    }

    // Une désignation sans match_id vaut pour tout le tournoi.
    return (data || []).filter(function(d) {
        return !d.match_id || String(d.match_id) === String(currentMatchId);
    });
}

async function chargerEffectifs() {
    const { data: match } = await supabaseClient
        .from(TBL_MATCHES).select('team_a_id, team_b_id').eq('id', currentMatchId).maybeSingle();
    if (!match) return;

    const ids = [match.team_a_id, match.team_b_id].filter(Boolean);
    if (!ids.length) return;

    const { data: equipes } = await supabaseClient
        .from(TBL_TEAMS).select('id, name').in('id', ids);
    equipesDuMatch = equipes || [];

    const { data: membres } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, player_name, member_name, jersey_number, team_id, position')
        .in('team_id', ids);

    sportifsDuMatch = (membres || []).map(function(j) {
        return {
            id: j.user_id || j.id,
            nom: j.player_name || j.member_name || mot('{Sportif}'),
            jersey_number: j.jersey_number,
            team_id: j.team_id
        };
    });
}

async function chargerVersions() {
    if (!roleRetenu) return [];
    const { data } = await supabaseClient
        .from(TBL_VERSIONS)
        .select('id, version_number, status, submitted_at, content, is_locked, review_comment')
        .eq('match_id', currentMatchId)
        .eq('user_id', currentUser.id)
        .eq('role_code', roleRetenu.role_code)
        .order('version_number', { ascending: true });
    return data || [];
}

// ═══════════════════════════════════════════════════════════
// 14. MISE EN PLACE DE LA PAGE
// ═══════════════════════════════════════════════════════════
async function preparerRapport() {
    mesDesignations = await chargerMesDesignations();

    if (!mesDesignations.length) {
        document.getElementById('rapportRefus').style.display = 'block';
        return;
    }

    await chargerEffectifs();

    if (mesDesignations.length === 1) {
        await retenirRole(mesDesignations[0]);
        return;
    }

    // Plusieurs désignations : on demande à quel titre.
    const zone = document.getElementById('rapportRoles');
    const liste = document.getElementById('rapportRolesListe');
    document.getElementById('rapportRolesAide').textContent =
        'Vous êtes désigné(e) à ' + mesDesignations.length + ' titres sur ce match. Chaque rapport est indépendant.';

    liste.innerHTML = mesDesignations.map(function(d, index) {
        const acteur = GTOfficiels.acteurParCode(d.role_code);
        return '<button type="button" class="gto-role" data-index="' + index + '">' +
               '<span class="gto-role-nom">' + escapeHtml(acteur ? acteur.nom : d.role_code) + '</span>' +
               (d.match_id ? '<span class="gto-role-portee">Ce match</span>'
                           : '<span class="gto-role-portee">Tout le tournoi</span>') +
               '</button>';
    }).join('');

    liste.querySelectorAll('.gto-role').forEach(function(bouton) {
        bouton.addEventListener('click', function() {
            zone.style.display = 'none';
            retenirRole(mesDesignations[Number(this.dataset.index)]);
        });
    });

    zone.style.display = 'block';
}

async function retenirRole(designation) {
    roleRetenu = designation;
    versionsExistantes = await chargerVersions();

    const acteur = GTOfficiels.acteurParCode(designation.role_code);
    const derniere = versionsExistantes[versionsExistantes.length - 1];
    const figee = derniere && (derniere.is_locked || versionsExistantes.length >= 3);

    afficherEtatVersions(acteur, figee);

    if (figee) return;   // plus aucune modification possible

    GTOfficiels.monterFormulaire({
        conteneur: 'gtoFormulaire',
        acteur: designation.role_code,
        contenu: derniere ? derniere.content : {},
        equipes: equipesDuMatch,
        sportifs: sportifsDuMatch,
        // Chantier 08 — sans cette ligne le formulaire officiel
        // continuerait d'afficher « Sportif » partout, meme sur
        // un tournoi de basket ou un concours de chant.
        sport: nomSportTournoi
    });

    document.getElementById('rapportZone').style.display = 'block';
    document.getElementById('rapportSignataire').textContent =
        'Signataire : ' + (userProfile.full_name || '—') +
        (userProfile.hubisoccer_id ? ' · ' + userProfile.hubisoccer_id : '');

    preparerSignature();
}

function afficherEtatVersions(acteur, figee) {
    const zone = document.getElementById('rapportVersions');
    const nombre = versionsExistantes.length;

    let html = '<div class="gto-versions-tete">' +
        '<span class="gto-versions-role">' + escapeHtml(acteur ? acteur.nom : '') + '</span>' +
        '<span class="gto-versions-compte">Version ' + Math.min(nombre + (figee ? 0 : 1), 3) + ' sur 3</span>' +
        '</div>';

    if (nombre) {
        html += '<ol class="gto-versions-liste">' + versionsExistantes.map(function(v) {
            const date = v.submitted_at
                ? new Date(v.submitted_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
                : '';
            const etats = { submitted:'Déposée', pending_approval:'En attente de l\'organisateur',
                            approved:'Approuvée', rejected:'Refusée', frozen:'Figée' };
            return '<li><span class="gto-version-num">v' + v.version_number + '</span>' +
                   '<span class="gto-version-etat">' + escapeHtml(etats[v.status] || v.status) + '</span>' +
                   '<span class="gto-version-date">' + date + '</span>' +
                   (v.review_comment ? '<span class="gto-version-note">' + escapeHtml(v.review_comment) + '</span>' : '') +
                   '</li>';
        }).join('') + '</ol>';
    }

    if (figee) {
        html += '<p class="gto-versions-fige"><i class="fas fa-lock"></i> ' +
                'Trois versions ont été déposées : ce rapport est figé et ne peut plus être modifié. ' +
                'Seule sa suppression reste possible, auprès de l\'organisateur.</p>';
    } else if (nombre === 2) {
        html += '<p class="gto-versions-alerte"><i class="fas fa-triangle-exclamation"></i> ' +
                'Ce sera votre <strong>troisième et dernière version</strong>. Elle sera soumise à l\'approbation ' +
                'de l\'organisateur, puis le rapport sera figé.</p>';
    }

    zone.innerHTML = html;
    zone.style.display = 'block';
}

function preparerSignature() {
    const canvas = document.getElementById('rapportSignature');
    if (!canvas || typeof SignaturePad === 'undefined') return;
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = 160;
    padSignature = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });
    document.getElementById('effacerSignatureBtn')?.addEventListener('click', function() {
        if (padSignature) padSignature.clear();
    });
}

// ═══════════════════════════════════════════════════════════
// 15. DÉPÔT DU RAPPORT
// ═══════════════════════════════════════════════════════════
async function submitReport() {
    if (!roleRetenu) { showToast('Aucun rôle retenu.', 'warning'); return; }

    const contenu = GTOfficiels.lire('gtoFormulaire');
    const fautes = GTOfficiels.verifier(roleRetenu.role_code, contenu);

    const zoneErreurs = document.getElementById('rapportErreurs');
    if (fautes.length) {
        zoneErreurs.innerHTML = '<p class="gto-erreurs-titre"><i class="fas fa-circle-exclamation"></i> ' +
            'Le rapport ne peut pas être déposé en l\'état :</p><ul>' +
            fautes.map(function(f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') + '</ul>';
        zoneErreurs.style.display = 'block';
        zoneErreurs.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    zoneErreurs.style.display = 'none';

    if (!padSignature || padSignature.isEmpty()) {
        showToast('Signez le rapport avant de le déposer.', 'warning');
        document.getElementById('rapportSignature')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const numeroVersion = versionsExistantes.length + 1;
    // La 3e version attend l'organisateur, puis le rapport se fige.
    const statut = numeroVersion >= 3 ? 'pending_approval' : 'submitted';

    let urlFichier = null;
    const champFichier = document.getElementById('reportFile');
    if (champFichier && champFichier.files.length) {
        const fichier = champFichier.files[0];
        showLoader();
        const chemin = currentMatchId + '/' + roleRetenu.role_code + '/' + Date.now() + '_' + fichier.name;
        const { error: erreurUpload } = await supabaseClient.storage
            .from(REPORT_BUCKET).upload(chemin, fichier, { upsert: true });
        hideLoader();
        if (erreurUpload) {
            showToast('Erreur au téléversement de la pièce jointe : ' + erreurUpload.message, 'error');
            return;
        }
        const { data } = supabaseClient.storage.from(REPORT_BUCKET).getPublicUrl(chemin);
        urlFichier = data.publicUrl;
    }

    showLoader();

    const ligneVersion = {
        match_id: currentMatchId,
        tournament_id: idTournoiCourant,
        user_id: currentUser.id,
        role_code: roleRetenu.role_code,
        team_id: roleRetenu.team_id || null,
        version_number: numeroVersion,
        content: contenu,
        status: statut,
        signature_data: padSignature.toDataURL(),
        is_locked: numeroVersion >= 3
    };

    const { error: erreurVersion } = await supabaseClient.from(TBL_VERSIONS).insert([ligneVersion]);
    if (erreurVersion) {
        hideLoader();
        showToast('Erreur à l\'enregistrement : ' + erreurVersion.message, 'error');
        return;
    }

    // Le rapport courant, dans la table historique
    await supabaseClient.from(TBL_REPORTS).insert([{
        match_id: currentMatchId,
        tournament_id: idTournoiCourant,
        report_type: roleRetenu.role_code,
        role_code: roleRetenu.role_code,
        team_id: roleRetenu.team_id || null,
        user_id: currentUser.id,
        content: contenu,
        file_url: urlFichier,
        version_count: numeroVersion,
        status: statut,
        is_locked: numeroVersion >= 3,
        signature_data: ligneVersion.signature_data,
        created_at: new Date().toISOString()
    }]);

    // --- Le pont vers les statistiques (chantier 05)
    // Chaque but, carton et remplacement saisi devient un
    // evenement date. Sans cela, les rapports n'alimentent rien.
    const evenements = GTOfficiels.extraireEvenements(contenu, currentMatchId);
    if (evenements.length) {
        await supabaseClient.from(TBL_EVENTS).delete()
            .eq('match_id', currentMatchId)
            .eq('source_report_id', currentMatchId);
        const { error: erreurEvenements } = await supabaseClient.from(TBL_EVENTS)
            .insert(evenements.map(function(e) {
                return Object.assign({}, e, { source_report_id: currentMatchId });
            }));
        if (erreurEvenements) {
            console.warn('Événements non enregistrés :', erreurEvenements.message);
        }
    }

    hideLoader();

    if (numeroVersion >= 3) {
        showToast('Troisième version déposée. Le rapport est figé et attend l\'approbation de l\'organisateur.', 'success');
    } else {
        showToast('Rapport déposé (version ' + numeroVersion + ' sur 3).', 'success');
    }

    setTimeout(function() { window.location.reload(); }, 2200);
}

// ═══════════════════════════════════════════════════════════
// 15b. APERÇU PDF
//      Chaque rapport peut être généré en PDF, comme demandé.
// ═══════════════════════════════════════════════════════════
function apercuPdf() {
    if (!roleRetenu) return;
    const contenu = GTOfficiels.lire('gtoFormulaire');
    const acteur = GTOfficiels.acteurParCode(roleRetenu.role_code);

    const document_ = window.document;
    const zone = document_.createElement('div');
    zone.style.cssText = 'padding:28px;font-family:Poppins,sans-serif;color:#16161F;max-width:760px;';

    let html = '<h1 style="color:#551B8C;font-size:20px;margin:0 0 4px;">Rapport de match</h1>' +
        '<p style="font-size:13px;color:#63636F;margin:0 0 18px;">' +
        escapeHtml(acteur ? acteur.nom : roleRetenu.role_code) + ' — ' +
        escapeHtml(document_.getElementById('matchTeams').textContent) + '</p>';

    const blocs = GTOfficiels.FORMULAIRES[acteur.famille] || [];
    blocs.forEach(function(nomBloc) {
        const bloc = GTOfficiels.BLOCS[nomBloc];
        if (!bloc) return;

        let corps = '';
        bloc.champs.forEach(function(champ) {
            const v = contenu[champ.cle];
            if (v === undefined || v === null || v === '' || v === false) return;

            if (champ.type === 'liste') {
                if (!Array.isArray(v) || !v.length) return;
                corps += '<p style="margin:8px 0 3px;font-weight:600;font-size:12px;">' + escapeHtml(champ.libelle) + '</p>';
                corps += '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px;">';
                corps += '<tr>' + champ.colonnes.map(function(c) {
                    return '<th style="text-align:left;padding:4px;border-bottom:1px solid #E4E4EA;color:#63636F;">' +
                           escapeHtml(c.libelle) + '</th>'; }).join('') + '</tr>';
                v.forEach(function(ligne) {
                    corps += '<tr>' + champ.colonnes.map(function(c) {
                        return '<td style="padding:4px;border-bottom:1px solid #F2F2F6;">' +
                               escapeHtml(ligne[c.cle] === true ? 'Oui' : (ligne[c.cle] ?? '—')) + '</td>'; }).join('') + '</tr>';
                });
                corps += '</table>';
                return;
            }

            corps += '<p style="margin:3px 0;font-size:12px;"><strong>' + escapeHtml(champ.libelle) +
                     '</strong> : ' + escapeHtml(v === true ? 'Oui' : v) + '</p>';
        });

        if (corps) {
            html += '<h2 style="font-size:13px;color:#551B8C;margin:16px 0 6px;border-bottom:2px solid #FFCC00;padding-bottom:4px;">' +
                    escapeHtml(bloc.titre) + '</h2>' + corps;
        }
    });

    if (padSignature && !padSignature.isEmpty()) {
        html += '<h2 style="font-size:13px;color:#551B8C;margin:18px 0 6px;">Signature</h2>' +
                '<img src="' + padSignature.toDataURL() + '" style="max-width:220px;border:1px solid #E4E4EA;">' +
                '<p style="font-size:11px;color:#63636F;margin-top:6px;">' +
                escapeHtml(userProfile.full_name || '') +
                (userProfile.hubisoccer_id ? ' · ' + escapeHtml(userProfile.hubisoccer_id) : '') +
                ' — ' + new Date().toLocaleString('fr-FR') + '</p>';
    }

    zone.innerHTML = html;

    if (typeof html2pdf === 'undefined') {
        showToast('Le générateur PDF n\'est pas chargé.', 'error');
        return;
    }
    html2pdf().set({
        margin: 10,
        filename: 'rapport-' + roleRetenu.role_code + '-match-' + currentMatchId + '.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(zone).save();
}

// ═══════════════════════════════════════════════════════════
// 16. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 17. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    currentMatchId = getMatchIdFromUrl();
    await loadMatchInfo();

    document.getElementById('submitReport')?.addEventListener('click', submitReport);
    document.getElementById('apercuPdfBtn')?.addEventListener('click', apercuPdf);

    // Le formulaire n'apparaît que si le compte est désigné sur ce
    // match — c'est le verrou du point 12.
    if (currentMatchId) await preparerRapport();
    document.getElementById('cancelBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
});
