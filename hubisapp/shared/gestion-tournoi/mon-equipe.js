/* ============================================================
   HubISoccer — mon-equipe.js (v2 — composition complète d'équipe)
   Système Gestion Tournois — Mon équipe
   ------------------------------------------------------------
   Reprend la version corrigee (is_captain, terminologie footballeur,
   apercu du footballeur selectionne) et l'etend pour une VRAIE
   equipe complete : footballeurs (60 postes precis groupes en 8
   familles) + encadrement technique + medical + direction +
   entourage (agent, parrain), a niveau de detail egal -- aucune
   categorie traitee comme "membre simple".
   Chaque membre porte age/taille/langue(s), quelle que soit sa
   categorie. Les roles relies a un vrai type de compte HubISoccer
   (footballeur/coach/staff medical/agent/parrain) se recherchent
   parmi les comptes reels ; la direction (President, Delegue,
   Directeur sportif) n'a pas de type de compte dedie -- saisie
   libre avec photo televersee directement.
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
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS       = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS           = 'supabaseAuthPrive_gt_tournaments';
const TBL_SPORTS                   = 'supabaseAuthPrive_gt_sports';
const TBL_PROFILES                    = 'supabaseAuthPrive_profiles';
const LOGO_BUCKET                        = 'gt-team-logos';
const TBL_MATCHES                           = 'supabaseAuthPrive_gt_matches';
const TBL_LINEUPS                              = 'supabaseAuthPrive_gt_match_lineups';
const TBL_PLAYER_STATS                            = 'supabaseAuthPrive_gt_player_match_stats';

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
// POSITION_ROWS a disparu avec les quatre <div> empiles qu'elle
// adressait. Le terrain place desormais chaque sportif a des
// coordonnees, pas dans une ligne.

// ═══════════════════════════════════════════════════════════
// 4. TAXONOMIE COMPLÈTE DES CATÉGORIES ET POSTES
// ------------------------------------------------------------
// Chaque poste de footballeur porte un pitchGroup (le regroupement
// large deja utilise par la vue terrain : Gardien/Defenseur/Milieu/
// Attaquant) en plus de son libelle precis.
// searchRole = code de role a chercher parmi les vrais comptes ;
// null = pas de type de compte dedie, saisie libre.
// ═══════════════════════════════════════════════════════════
const MEMBER_CATEGORIES = {
    footballeur: {
        label: 'Footballeur',
        icon: 'fa-running',
        searchRole: 'FOOT',
        groups: [
            { label: '🧤 Gardien de but', pitchGroup: 'Gardien', positions: [
                'Gardien de but (GK)', 'Gardien-libéro / Sweeper Keeper', 'Gardien de ligne', 'Gardien relanceur'
            ]},
            { label: '🛡️ Défense centrale', pitchGroup: 'Défenseur', positions: [
                'Défenseur central droit (DC)', 'Défenseur central gauche (DC)', 'Défenseur central axial',
                'Libéro', 'Stoppeur', 'Défenseur central relanceur'
            ]},
            { label: '🛡️ Défense latérale', pitchGroup: 'Défenseur', positions: [
                'Arrière droit (DD/RB)', 'Arrière gauche (DG/LB)', 'Latéral droit offensif', 'Latéral gauche offensif',
                'Latéral inversé droit', 'Latéral inversé gauche', 'Piston droit (RWB)', 'Piston gauche (LWB)'
            ]},
            { label: '🎯 Milieux défensifs', pitchGroup: 'Milieu', positions: [
                'Milieu défensif (MDC/DM)', 'Sentinelle', 'Milieu récupérateur', 'Milieu défensif relayeur',
                'Regista', 'Meneur de jeu en retrait'
            ]},
            { label: '⚙️ Milieux centraux', pitchGroup: 'Milieu', positions: [
                'Milieu central (MC/CM)', 'Relayeur droit', 'Relayeur gauche', 'Box-to-box',
                'Meneur de jeu', 'Milieu organisateur', 'Milieu travailleur'
            ]},
            { label: '🎨 Milieux offensifs', pitchGroup: 'Milieu', positions: [
                'Milieu offensif central (MOC/CAM)', 'Meneur de jeu avancé', 'Numéro 10',
                'Milieu offensif droit (MOD/RAM)', 'Milieu offensif gauche (MOG/LAM)'
            ]},
            { label: '🪽 Ailiers', pitchGroup: 'Attaquant', positions: [
                'Ailier droit (AD/RW)', 'Ailier gauche (AG/LW)', 'Ailier droit inversé', 'Ailier gauche inversé',
                'Ailier intérieur droit', 'Ailier intérieur gauche'
            ]},
            { label: '⚡ Attaquants', pitchGroup: 'Attaquant', positions: [
                'Avant-centre (AC/ST)', 'Buteur', 'Attaquant de pointe', 'Attaquant complet', 'Attaquant avancé',
                'Renard des surfaces', 'Pivot', 'Faux 9', 'Second attaquant', 'Attaquant de soutien'
            ]},
            { label: '🔥 Postes hybrides', pitchGroup: null, positions: [
                'Défenseur central / Milieu défensif', 'Latéral / Piston', 'Latéral / Ailier',
                'Milieu défensif / Milieu central', 'Milieu central / Milieu offensif',
                'Milieu offensif / Ailier', 'Ailier / Second attaquant', 'Attaquant / Ailier'
            ]}
        ]
    },
    technique: {
        label: 'Encadrement technique',
        icon: 'fa-user-tie',
        searchRole: 'COACH',
        groups: [{ label: null, pitchGroup: null, positions: [
            'Entraîneur principal', 'Entraîneur adjoint', 'Entraîneur des gardiens', 'Préparateur physique', 'Analyste vidéo'
        ]}]
    },
    medical: {
        label: 'Encadrement médical',
        icon: 'fa-briefcase-medical',
        searchRole: 'MEDIC',
        groups: [{ label: null, pitchGroup: null, positions: [
            "Médecin de l'équipe", 'Kinésithérapeute', 'Masseur'
        ]}]
    },
    direction: {
        label: 'Direction',
        icon: 'fa-user-shield',
        searchRole: null,
        groups: [{ label: null, pitchGroup: null, positions: [
            'Président / Dirigeant', 'Délégué', 'Directeur sportif'
        ]}]
    },
    entourage: {
        label: "Autour de l'équipe",
        icon: 'fa-handshake',
        searchRole: null,
        groups: [{ label: null, pitchGroup: null, positions: [
            { label: 'Agent', searchRole: 'AGENT' },
            { label: 'Parrain / Sponsor', searchRole: 'PARRAIN' }
        ]}]
    }
};

// Position precise -> pitchGroup (calcule une fois, pour la vue terrain)
const POSITION_TO_PITCH_GROUP = {};
MEMBER_CATEGORIES.footballeur.groups.forEach(function(g) {
    g.positions.forEach(function(p) { POSITION_TO_PITCH_GROUP[p] = g.pitchGroup || 'Milieu'; });
});

// ═══════════════════════════════════════════════════════════
// 5. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let myTeams = [];
let currentTeam = null;
let isTeamOwner = false;
let selectedPlayerId = null;
let selectedPlayerProfile = null;
let selectedTeamLogoFile = null;
let selectedMemberPhotoFile = null;
let currentCategory = 'footballeur';

// CHANTIER 11 — le membre en cours de modification.
// ------------------------------------------------------------
// Avant, une fiche ne proposait que trois gestes : banc,
// brassard, blessure. Pour corriger un numero de maillot, un
// poste ou un age, il fallait SUPPRIMER le membre et le
// resaisir en entier — en perdant au passage sa place sur le
// terrain et son historique. Ce n'etait pas tenable.
//
// null  = le formulaire ajoute un membre (comportement d'avant)
// un id = le formulaire modifie ce membre-la
let membreEnEdition = null;
let currentSearchRole = 'FOOT';

// --- Chantier 06 : composition
let peutModifier = false;      // le droit d'ecrire, calcule equipe par equipe
let monStatutDansLEquipe = []; // ce qui me donne ce droit, pour l'expliquer
let effectifCourant = [];      // toutes les lignes de gt_team_players
let sportCourant = null;       // l'entree GTTerrain.SPORTS retenue

// Chantier 08 — le nom brut de la discipline, tel que gt_sports
// le donne. GTTerrain.sportPour() ne connait que les sports de
// terrain ; le lexique, lui, connait aussi le chant, la danse,
// le slam. On garde donc le nom d'origine pour lui.
let nomSportTournoi = '';

function mot(gabarit) {
    if (!window.GTLexique) return gabarit;
    return GTLexique.remplir(gabarit, nomSportTournoi);
}
function appliquerLexique() {
    if (window.GTLexique) GTLexique.appliquer(nomSportTournoi);
}

// Le libelle affiche d'une categorie de membre.
//
// La CLE « footballeur » est une valeur stockee en base, dans
// member_category : elle ne change jamais, sinon les equipes
// deja enregistrees deviendraient illisibles. Seul le LIBELLE
// suit la discipline — « Basketteur » sur un tournoi de basket,
// « Chanteur » sur un concours de chant. Les autres categories
// (coach, staff medical, dirigeant…) gardent leur nom : un coach
// s'appelle un coach dans toutes les disciplines.
function libelleCategorie(cle) {
    var def = MEMBER_CATEGORIES[cle || 'footballeur'];
    if (!def) return mot('{Sportif}');
    if ((cle || 'footballeur') === 'footballeur') return mot('{Sportif}');
    return def.label;
}
let formatCourant = 11;
let formationCourante = null;
let dimensionsCourantes = null;
let matchsDeLEquipe = [];
let matchChoisi = null;        // null = composition par defaut de l'equipe
let compositionCourante = {};  // id de membre -> { x, y, titulaire, slot }
let lignesLineupExistantes = [];
let compositionModifiee = false;

// ═══════════════════════════════════════════════════════════
// 6. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 7. TOAST (30 secondes)
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
// 8. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}
function memberDisplayName(p) {
    return (p._profile && p._profile.full_name) || p.member_name || 'Membre';
}
function memberDisplayPhoto(p) {
    return (p._profile && p._profile.avatar_url) || p.member_photo_url || null;
}

// ═══════════════════════════════════════════════════════════
// 9. SESSION
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
// 10. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error || !data) {
        hideLoader();
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    applyRoleTier();
    updateNavbarUI();
    hideLoader();
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
// 11. MISE À JOUR DE LA NAVBAR
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
// 12. CHARGEMENT DE MES ÉQUIPES
// ═══════════════════════════════════════════════════════════
// Chantier 06 — ta regle du point 20 : TOUS les membres de
// l'equipe la voient. La requete filtrait sur creator_id : un
// capitaine, un coach ou un president ne voyait rien, pas meme
// l'equipe dont il porte le brassard.
//
// Deux requetes separees puis une union en memoire : une
// jointure PostgREST sur gt_team_players renverrait un PGRST201
// des qu'il y a plus d'une relation entre les deux tables.
async function loadMyTeams() {
    showLoader();

    // 1 — les equipes que j'ai creees
    const { data: creees, error: erreurCreees } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('creator_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (erreurCreees) {
        hideLoader();
        console.error('Erreur chargement équipes:', erreurCreees.message);
        showToast('Erreur lors du chargement de vos équipes : ' + erreurCreees.message, 'error');
        return;
    }

    // 2 — les equipes ou je figure dans l'effectif, quel que soit
    //     mon statut : sportif, capitaine, coach, president,
    //     staff medical, agent, parrain.
    const { data: mesLignes } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('team_id')
        .eq('user_id', currentUser.id);

    const idsMembre = [];
    (mesLignes || []).forEach(function(l) {
        if (l.team_id != null && idsMembre.indexOf(l.team_id) === -1) idsMembre.push(l.team_id);
    });

    let membreDe = [];
    if (idsMembre.length) {
        const { data } = await supabaseClient.from(TBL_TEAMS).select('*').in('id', idsMembre);
        membreDe = data || [];
    }

    hideLoader();

    // 3 — l'union, sans doublon
    const vues = {};
    myTeams = [];
    (creees || []).concat(membreDe).forEach(function(t) {
        if (!t || vues[t.id]) return;
        vues[t.id] = true;
        myTeams.push(t);
    });
    const select = document.getElementById('teamSelect');

    if (!myTeams.length) {
        select.innerHTML = '<option value="">Aucune équipe — créez-en une</option>';
        document.getElementById('teamInfo').style.display = 'none';
        document.getElementById('pitchSection').style.display = 'none';
        document.getElementById('encadrementSection').style.display = 'none';
        document.getElementById('rosterSection').style.display = 'none';
        return;
    }

    select.innerHTML = myTeams.map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
    await selectTeam(myTeams[0].id);
}

// ═══════════════════════════════════════════════════════════
// 13. SÉLECTION D'UNE ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function selectTeam(teamId) {
    currentTeam = myTeams.find(function(t) { return String(t.id) === String(teamId); });
    if (!currentTeam) return;

    isTeamOwner = String(currentTeam.creator_id) === String(currentUser.id);

    document.getElementById('teamSelect').value = teamId;
    document.getElementById('teamName').textContent = currentTeam.name;
    document.getElementById('teamCategory').textContent = currentTeam.age_category || 'Catégorie non précisée';
    document.getElementById('teamCreated').textContent = currentTeam.created_at ? new Date(currentTeam.created_at).toLocaleDateString('fr-FR') : '—';

    const logoDiv = document.getElementById('teamLogo');
    logoDiv.innerHTML = currentTeam.logo_url ? '<img src="' + currentTeam.logo_url + '" alt="Logo">' : '<i class="fas fa-shield-alt"></i>';

    // --- Le sport et le terrain viennent du tournoi ------------
    let nomSport = currentTeam.sport_code || '';
    let tournoi = null;

    if (currentTeam.tournament_id) {
        const { data } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('name, sport_id, pitch_length_m, pitch_width_m, pitch_surface, team_format')
            .eq('id', currentTeam.tournament_id).maybeSingle();
        tournoi = data;
        document.getElementById('teamTournament').textContent = tournoi ? tournoi.name : 'Tournoi inconnu';
        if (tournoi && tournoi.sport_id) {
            const { data: sport } = await supabaseClient.from(TBL_SPORTS).select('name').eq('id', tournoi.sport_id).maybeSingle();
            if (sport) nomSport = sport.name;
            document.getElementById('teamSport').textContent = sport ? sport.name : 'Non précisé';
        }
    }

    sportCourant = GTTerrain.sportPour(nomSport);

    // Chantier 08 — la discipline est connue : la page prend son
    // vocabulaire. Appele ici, donc avant tout affichage
    // d'effectif, pour qu'aucun libelle ne s'ecrive deux fois.
    nomSportTournoi = nomSport;
    appliquerLexique();
    populateCategorySelect();

    // Le format de jeu : celui de l'equipe, sinon celui du
    // tournoi, sinon celui du sport.
    formatCourant = Number(currentTeam.team_format) ||
                    Number(tournoi && tournoi.team_format) ||
                    sportCourant.formatParDefaut;

    dimensionsCourantes = {
        longueur: tournoi ? tournoi.pitch_length_m : null,
        largeur: tournoi ? tournoi.pitch_width_m : null,
        surface: tournoi ? tournoi.pitch_surface : null
    };

    document.getElementById('teamInfo').style.display = 'block';
    document.getElementById('rosterSection').style.display = 'block';

    await calculerMesDroits();

    document.getElementById('editTeamBtn').style.display = peutModifier ? 'inline-flex' : 'none';
    document.getElementById('addPlayerBtn').style.display = peutModifier ? 'inline-flex' : 'none';

    await chargerLesMatchsDeLEquipe();
    await loadRoster();
}

// ═══════════════════════════════════════════════════════════
// 13 bis. QUI PEUT MODIFIER (chantier 06)
// -----------------------------------------------------------
// Ta regle du point 20 : tous les membres voient, seuls les
// habilites modifient. Et du point 21 : createur, capitaine,
// coach, president.
//
// Le droit ne vient pas du code de role du compte — un
// footballeur peut etre capitaine, un parrain peut etre
// president. Il vient de ce que la ligne d'effectif declare.
// ═══════════════════════════════════════════════════════════
async function calculerMesDroits() {
    peutModifier = false;
    monStatutDansLEquipe = [];

    if (!currentTeam) return;

    if (isTeamOwner) {
        peutModifier = true;
        monStatutDansLEquipe.push('créateur de l\'équipe');
    }

    const { data: maLigne } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, is_captain, is_coach, is_president, is_manager, member_category, position_detail')
        .eq('team_id', currentTeam.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (maLigne) {
        if (maLigne.is_captain)   { peutModifier = true; monStatutDansLEquipe.push('capitaine'); }
        if (maLigne.is_coach)     { peutModifier = true; monStatutDansLEquipe.push('coach'); }
        if (maLigne.is_president) { peutModifier = true; monStatutDansLEquipe.push('président'); }
        if (maLigne.is_manager)   { peutModifier = true; monStatutDansLEquipe.push('dirigeant'); }
        if (!monStatutDansLEquipe.length) {
            monStatutDansLEquipe.push(maLigne.position_detail || 'membre de l\'équipe');
        }
    }

    if (!monStatutDansLEquipe.length) monStatutDansLEquipe.push('visiteur');
}

// ═══════════════════════════════════════════════════════════
// 13 ter. LES RENCONTRES DE L'EQUIPE (chantier 06)
// -----------------------------------------------------------
// Ta regle du point 26 : une composition PAR MATCH. Le
// selecteur propose d'abord la composition par defaut de
// l'equipe, puis chaque rencontre.
//
// Et ta regle du point 21 : pas de modification retroactive.
// Un match qui porte deja un resultat verrouille sa feuille.
// ═══════════════════════════════════════════════════════════
async function chargerLesMatchsDeLEquipe() {
    matchsDeLEquipe = [];
    const select = document.getElementById('compoMatchSelect');
    if (!select || !currentTeam) return;

    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, tournament_id, team_a_id, team_b_id, match_date, status, score_a, score_b, matchday, group_name, lineups_locked')
        .or('team_a_id.eq.' + currentTeam.id + ',team_b_id.eq.' + currentTeam.id)
        .order('match_date', { ascending: true });

    if (error) {
        console.warn('Rencontres indisponibles :', error.message);
    } else {
        matchsDeLEquipe = data || [];
    }

    // Le nom des adversaires, en une requete.
    const idsAdversaires = [];
    matchsDeLEquipe.forEach(function(m) {
        const adv = String(m.team_a_id) === String(currentTeam.id) ? m.team_b_id : m.team_a_id;
        if (adv != null && idsAdversaires.indexOf(adv) === -1) idsAdversaires.push(adv);
    });
    const nomAdversaire = {};
    if (idsAdversaires.length) {
        const { data: equipes } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', idsAdversaires);
        (equipes || []).forEach(function(e) { nomAdversaire[e.id] = e.name; });
    }

    let html = '<option value="">Composition par défaut de l\'équipe</option>';
    matchsDeLEquipe.forEach(function(m) {
        const adv = String(m.team_a_id) === String(currentTeam.id) ? m.team_b_id : m.team_a_id;
        const nom = nomAdversaire[adv] || 'Adversaire à définir';
        const date = m.match_date ? new Date(m.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'date à venir';
        const verrou = estVerrouille(m) ? ' 🔒' : '';
        m._nomAdversaire = nom;
        html += '<option value="' + m.id + '">' + escapeHtml(date + ' — ' + nom) + verrou + '</option>';
    });

    select.innerHTML = html;
    select.value = matchChoisi ? String(matchChoisi.id) : '';
}

// Un match est verrouille dans trois cas, et trois seulement :
//   - l'organisateur a pose le verrou a la main
//   - la rencontre est declaree terminee
//   - un score est enregistre
// Un 0-0 sur une rencontre non terminee ne verrouille pas : c'est
// la valeur par defaut de la colonne, pas un resultat.
function estVerrouille(match) {
    if (!match) return false;
    if (match.lineups_locked) return true;
    if (match.status === 'completed') return true;

    const aUnScore = match.score_a != null && match.score_b != null;
    if (!aUnScore) return false;

    const scoreVierge = Number(match.score_a) === 0 && Number(match.score_b) === 0;
    return !scoreVierge;
}

// ═══════════════════════════════════════════════════════════
// 14. CHARGEMENT DE L'EFFECTIF COMPLET (requêtes séparées)
// ═══════════════════════════════════════════════════════════
async function loadRoster() {
    if (!currentTeam) return;

    const { data: membersData, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('*')
        .eq('team_id', currentTeam.id);

    if (error) {
        console.error('Erreur chargement effectif:', error.message);
        document.getElementById('playersList').innerHTML =
            '<p class="empty-hint">Erreur de chargement de l\'effectif : ' + escapeHtml(error.message) + '</p>';
        return;
    }

    effectifCourant = membersData || [];

    if (!effectifCourant.length) {
        document.getElementById('playersList').innerHTML = '<p class="empty-hint">Aucun membre dans l\'effectif.</p>';
        document.getElementById('pitchSection').style.display = 'none';
        document.getElementById('encadrementSection').style.display = 'none';
        return;
    }

    const userIds = effectifCourant.filter(function(p) { return p.user_id; }).map(function(p) { return p.user_id; });
    let profileMap = {};
    if (userIds.length) {
        const { data: profilesData } = await supabaseClient
            .from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', userIds);
        (profilesData || []).forEach(function(p) { profileMap[p.auth_uuid] = p; });
    }
    effectifCourant.forEach(function(p) { p._profile = p.user_id ? (profileMap[p.user_id] || {}) : null; });

    const encadrement = effectifCourant.filter(function(p) {
        return (p.member_category || 'footballeur') !== 'footballeur';
    });

    renderEncadrement(encadrement);
    renderFullRoster(effectifCourant);

    await chargerLaComposition();
}

// ═══════════════════════════════════════════════════════════
// 15. LA COMPOSITION (chantier 06)
// -----------------------------------------------------------
// Avant : quatre <div> empilés — rowAttaquants, rowMilieux,
// rowDefenseurs, rowGardien — remplis dans l'ordre d'arrivée.
// Aucune position réelle, aucune formation, une seule
// composition pour toute la vie de l'équipe, et rien qui puisse
// se déplacer.
//
// Maintenant : chaque sportif porte des coordonnées x / y en
// pourcentage du terrain, une composition par match, et le tout
// se déplace au doigt comme à la souris.
// ═══════════════════════════════════════════════════════════

// Les sportifs de terrain — l'encadrement ne se place pas.
function sportifsDeLEquipe() {
    return effectifCourant.filter(function(p) {
        return (p.member_category || 'footballeur') === 'footballeur';
    });
}

function groupeDuMembre(membre) {
    if (!membre) return 'Milieu';
    if (membre.position_category) return membre.position_category;
    if (membre.position_detail && POSITION_TO_PITCH_GROUP[membre.position_detail]) {
        return POSITION_TO_PITCH_GROUP[membre.position_detail];
    }
    if (membre.position && POSITION_TO_PITCH_GROUP[membre.position]) {
        return POSITION_TO_PITCH_GROUP[membre.position];
    }
    return 'Milieu';
}

async function chargerLaComposition() {
    const section = document.getElementById('pitchSection');
    if (!section) return;

    const sportifs = sportifsDeLEquipe();
    if (!sportifs.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    compositionCourante = {};
    lignesLineupExistantes = [];
    compositionModifiee = false;

    if (matchChoisi) {
        // --- La feuille de ce match, si elle existe déjà
        const { data, error } = await supabaseClient
            .from(TBL_LINEUPS)
            .select('*')
            .eq('match_id', matchChoisi.id)
            .eq('team_id', currentTeam.id);

        if (error) {
            console.warn('Composition indisponible :', error.message);
        } else {
            lignesLineupExistantes = data || [];
        }

        // Une rencontre encore vierge repart de la composition par
        // defaut de l'equipe — c'est tout l'interet de la garder.
        // Sans cela, choisir un match remettait tout le monde au
        // banc et il fallait reconstruire l'equipe a la main.
        if (!lignesLineupExistantes.length) {
            sportifs.forEach(function(p) {
                compositionCourante[p.id] = {
                    x: p.pos_x == null ? null : Number(p.pos_x),
                    y: p.pos_y == null ? null : Number(p.pos_y),
                    titulaire: !!p.is_starting,
                    slot_cle: p.slot_key || null,
                    is_captain: !!p.is_captain,
                    is_injured: !!p.is_injured,
                    injury_minute: null,
                    sub_in_minute: null,
                    sub_out_minute: null,
                    position_detail: p.position_detail || null
                };
            });
            if (currentTeam.default_formation) formationCourante = currentTeam.default_formation;
        }

        lignesLineupExistantes.forEach(function(l) {
            if (l.team_player_id == null) return;
            compositionCourante[l.team_player_id] = {
                x: l.pos_x == null ? null : Number(l.pos_x),
                y: l.pos_y == null ? null : Number(l.pos_y),
                titulaire: !!l.is_starter,
                slot_cle: l.slot_key || null,
                is_captain: !!l.is_captain,
                is_injured: !!l.is_injured,
                injury_minute: l.injury_minute,
                sub_in_minute: l.sub_in_minute,
                sub_out_minute: l.sub_out_minute,
                position_detail: l.position_detail || null
            };
        });

        if (lignesLineupExistantes.length && lignesLineupExistantes[0].formation) {
            formationCourante = lignesLineupExistantes[0].formation;
        }
        if (lignesLineupExistantes.length && lignesLineupExistantes[0].team_format) {
            formatCourant = Number(lignesLineupExistantes[0].team_format) || formatCourant;
        }

    } else {
        // --- La composition par défaut de l'équipe
        sportifs.forEach(function(p) {
            compositionCourante[p.id] = {
                x: p.pos_x == null ? null : Number(p.pos_x),
                y: p.pos_y == null ? null : Number(p.pos_y),
                titulaire: !!p.is_starting,
                slot_cle: p.slot_key || null,
                is_captain: !!p.is_captain,
                is_injured: !!p.is_injured,
                injury_minute: null,
                sub_in_minute: null,
                sub_out_minute: null,
                position_detail: p.position_detail || null
            };
        });
        if (currentTeam.default_formation) formationCourante = currentTeam.default_formation;
    }

    // Personne ne doit rester sans entree : un membre ajoute a
    // l'effectif apres le depot de la feuille apparait au banc,
    // il ne disparait pas de la page.
    sportifs.forEach(function(p) {
        if (!compositionCourante[p.id]) {
            compositionCourante[p.id] = {
                x: null, y: null, titulaire: false, slot_cle: null,
                is_captain: !!p.is_captain, is_injured: !!p.is_injured,
                injury_minute: null, sub_in_minute: null, sub_out_minute: null,
                position_detail: p.position_detail || null
            };
        }
    });

    // Une composition déjà posée dicte sa formation ; sinon on
    // prend celle de l'équipe, sinon la première du catalogue.
    const posees = Object.keys(compositionCourante)
        .map(function(k) { return compositionCourante[k]; })
        .filter(function(c) { return c.titulaire && c.x != null && c.y != null; });

    if (posees.length) {
        const deduite = GTTerrain.deduireFormation(posees, sportCourant);
        if (deduite && deduite.connue) formationCourante = deduite.code;
    }
    if (!formationCourante) formationCourante = GTTerrain.formationParDefaut(sportCourant, formatCourant);

    monterLesSelecteurs();
    dessinerLeTerrain();
    dessinerLeBanc();
    afficherLEtatDeLaComposition();
}

// ═══════════════════════════════════════════════════════════
// 15 bis. LES SÉLECTEURS DE FORMAT ET DE FORMATION
// ═══════════════════════════════════════════════════════════
function monterLesSelecteurs() {
    const selFormat = document.getElementById('compoFormatSelect');
    const selFormation = document.getElementById('compoFormationSelect');
    if (!selFormat || !selFormation) return;

    selFormat.innerHTML = sportCourant.formats.map(function(f) {
        return '<option value="' + f + '"' + (f === formatCourant ? ' selected' : '') + '>' +
               sportCourant.nom + ' à ' + f + '</option>';
    }).join('');

    const formations = GTTerrain.formationsPour(sportCourant, formatCourant);
    const connue = formations.some(function(f) { return f.code === formationCourante; });

    selFormation.innerHTML = formations.map(function(f) {
        return '<option value="' + f.code + '"' + (f.code === formationCourante ? ' selected' : '') + '>' + f.nom + '</option>';
    }).join('');

    // Un placement libre ne correspond à aucune formation du
    // catalogue : on le dit plutôt que de faire croire à un
    // 4-4-2 qui n'existe pas.
    if (!connue && formationCourante) {
        selFormation.insertAdjacentHTML('afterbegin',
            '<option value="' + escapeHtml(formationCourante) + '" selected>Placement libre (' + escapeHtml(formationCourante) + ')</option>');
    }

    const lecture = document.getElementById('compoLecture');
    const verrou = matchChoisi && estVerrouille(matchChoisi);
    const modifiable = peutModifier && !verrou;

    [selFormat, selFormation].forEach(function(el) { el.disabled = !modifiable; });
    ['compoAutoBtn', 'compoSaveBtn'].forEach(function(id) {
        const b = document.getElementById(id);
        if (b) b.style.display = modifiable ? 'inline-flex' : 'none';
    });
    if (lecture) lecture.style.display = modifiable ? 'none' : 'inline-flex';

    const aide = document.getElementById('compoAide');
    if (aide) aide.style.display = modifiable ? 'block' : 'none';
}

// ═══════════════════════════════════════════════════════════
// 15 ter. LE DESSIN DU TERRAIN
// ═══════════════════════════════════════════════════════════
function dessinerLeTerrain() {
    const terrain = document.getElementById('terrain');
    const places = document.getElementById('terrainPlaces');
    if (!terrain || !places) return;

    terrain.dataset.sport = sportCourant.code;
    terrain.dataset.format = String(formatCourant);

    // Les marquages, tracés une fois par changement de sport.
    let lignes = terrain.querySelector('.gt-terrain-lignes');
    if (!lignes || terrain.dataset.marquages !== sportCourant.marquages) {
        if (lignes) lignes.remove();
        terrain.insertAdjacentHTML('afterbegin', GTTerrain.marquagesHtml(sportCourant));
        terrain.dataset.marquages = sportCourant.marquages;
    }

    // Les cotes et le rappel — ton point 23.
    const reperes = GTTerrain.reperes(sportCourant, formatCourant, dimensionsCourantes);
    const coteL = document.getElementById('coteLongueur');
    const coteW = document.getElementById('coteLargeur');
    if (coteL) coteL.textContent = reperes.libelleLongueur;
    if (coteW) coteW.textContent = reperes.libelleLargeur;
    const rappel = document.getElementById('terrainRappel');
    if (rappel) {
        rappel.innerHTML = escapeHtml(reperes.rappel) +
            (dimensionsCourantes && dimensionsCourantes.surface
                ? ' <b>Surface : ' + escapeHtml(dimensionsCourantes.surface) + '.</b>'
                : '');
    }

    // Les emplacements de la formation, puis les sportifs déjà
    // posés à la main qui priment dessus.
    const emplacements = GTTerrain.placer(formationCourante, sportCourant);
    const titulaires = sportifsDeLEquipe().filter(function(p) {
        const c = compositionCourante[p.id];
        return c && c.titulaire;
    });

    const posesLibrement = titulaires.filter(function(p) {
        const c = compositionCourante[p.id];
        return c.x != null && c.y != null;
    });

    let html = '';

    // 1 — ceux qui ont des coordonnées : on les respecte
    posesLibrement.forEach(function(p) {
        html += placeHtml(p, compositionCourante[p.id]);
    });

    // 2 — les emplacements encore libres de la formation
    const nonPoses = titulaires.filter(function(p) {
        const c = compositionCourante[p.id];
        return c.x == null || c.y == null;
    });
    const prisPar = {};
    posesLibrement.forEach(function(p) {
        const c = compositionCourante[p.id];
        if (c.slot_cle) prisPar[c.slot_cle] = true;
    });

    // Combien de places vides a-t-on le droit de montrer ?
    // Un sportif deplace a la main perd son emplacement de
    // formation : sans ce plafond, son ancienne place
    // reapparaissait vide alors que le terrain etait complet.
    let videsRestantes = Math.max(0, emplacements.length - titulaires.length);

    let reste = nonPoses.slice();
    emplacements.forEach(function(place) {
        if (prisPar[place.cle]) return;
        if (reste.length) {
            // Le premier du bon groupe, sinon le premier venu.
            let i = reste.findIndex(function(p) { return groupeDuMembre(p) === place.groupe; });
            if (i === -1 && place.groupe !== 'Gardien') i = 0;
            if (i !== -1) {
                const p = reste.splice(i, 1)[0];
                compositionCourante[p.id].x = place.x;
                compositionCourante[p.id].y = place.y;
                compositionCourante[p.id].slot_cle = place.cle;
                if (!compositionCourante[p.id].position_detail) {
                    compositionCourante[p.id].position_detail = place.libelle;
                }
                html += placeHtml(p, compositionCourante[p.id]);
                return;
            }
        }
        if (videsRestantes > 0) {
            videsRestantes--;
            html += placeVideHtml(place);
        }
    });

    // 3 — ceux qui restent sans emplacement retournent au banc :
    //     une formation à 11 ne peut pas accueillir 13 titulaires.
    reste.forEach(function(p) { compositionCourante[p.id].titulaire = false; });

    places.innerHTML = html;
    brancherLeGeste();
}

function placeHtml(membre, compo) {
    const nom = memberDisplayName(membre);
    const photo = memberDisplayPhoto(membre);
    const modifiable = compositionModifiable();

    const etats = [];
    if (compo.is_captain || membre.is_captain) etats.push('<span class="gt-etat capitaine" title="Capitaine"><i class="fas fa-star"></i></span>');
    if (compo.is_injured || membre.is_injured)  etats.push('<span class="gt-etat blessure" title="Blessé"><i class="fas fa-kit-medical"></i></span>');
    if (membre.is_suspended)                     etats.push('<span class="gt-etat suspendu" title="Suspendu"><i class="fas fa-ban"></i></span>');
    if (compo.sub_out_minute != null) etats.push('<span class="gt-etat sortie" title="Sorti à la ' + escapeHtml(compo.sub_out_minute) + 'e"><i class="fas fa-arrow-down"></i></span>');
    if (compo.sub_in_minute != null)  etats.push('<span class="gt-etat entree" title="Entré à la ' + escapeHtml(compo.sub_in_minute) + 'e"><i class="fas fa-arrow-up"></i></span>');

    return '<div class="gt-place' + (modifiable ? '' : ' non-modifiable') +
           (compo.sub_out_minute != null ? ' est-sorti' : '') + '"' +
           ' data-membre="' + escapeHtml(membre.id) + '"' +
           ' style="left:' + compo.x + '%;top:' + compo.y + '%;">' +
           '<div class="gt-place-pastille">' +
               (photo ? '<img src="' + escapeHtml(photo) + '" alt="">' :
                        '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>') +
               (membre.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(membre.jersey_number) + '</span>' : '') +
               (etats.length ? '<span class="gt-place-etats">' + etats.join('') + '</span>' : '') +
           '</div>' +
           '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
           '<div class="gt-place-poste">' + escapeHtml(compo.position_detail || membre.position_detail || groupeDuMembre(membre)) + '</div>' +
           '</div>';
}

function placeVideHtml(place) {
    return '<div class="gt-place vide non-modifiable" data-place-vide="' + escapeHtml(place.cle) + '"' +
           ' style="left:' + place.x + '%;top:' + place.y + '%;">' +
           '<div class="gt-place-pastille"><i class="fas fa-plus"></i></div>' +
           '<div class="gt-place-nom">' + escapeHtml(place.libelle) + '</div>' +
           '</div>';
}

// ═══════════════════════════════════════════════════════════
// 15 quater. LE BANC
// ═══════════════════════════════════════════════════════════
function dessinerLeBanc() {
    const liste = document.getElementById('bancListe');
    const compte = document.getElementById('bancCompte');
    if (!liste) return;

    const banc = sportifsDeLEquipe().filter(function(p) {
        const c = compositionCourante[p.id];
        return !c || !c.titulaire;
    });

    const modifiable = compositionModifiable();

    liste.innerHTML = banc.map(function(p) {
        const nom = memberDisplayName(p);
        const photo = memberDisplayPhoto(p);
        const c = compositionCourante[p.id] || {};
        const etats = [];
        if (p.is_injured || c.is_injured) etats.push('<span class="gt-etat blessure" title="Blessé"><i class="fas fa-kit-medical"></i></span>');
        if (p.is_suspended) etats.push('<span class="gt-etat suspendu" title="Suspendu"><i class="fas fa-ban"></i></span>');
        if (c.sub_in_minute != null) etats.push('<span class="gt-etat entree" title="Entré à la ' + escapeHtml(c.sub_in_minute) + 'e"><i class="fas fa-arrow-up"></i></span>');

        return '<div class="gt-banc-place' + (modifiable ? '' : ' non-modifiable') + '" data-membre="' + escapeHtml(p.id) + '">' +
               '<div class="gt-place-pastille">' +
                   (photo ? '<img src="' + escapeHtml(photo) + '" alt="">' :
                            '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>') +
                   (p.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(p.jersey_number) + '</span>' : '') +
                   (etats.length ? '<span class="gt-place-etats">' + etats.join('') + '</span>' : '') +
               '</div>' +
               '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
               '<div class="gt-place-poste">' + escapeHtml(p.position_detail || groupeDuMembre(p)) + '</div>' +
               '</div>';
    }).join('');

    const titulaires = sportifsDeLEquipe().filter(function(p) {
        const c = compositionCourante[p.id];
        return c && c.titulaire;
    }).length;

    if (compte) {
        compte.textContent = titulaires + ' sur le terrain · ' + banc.length + ' disponible(s)';
    }

    brancherLeGeste();
}

function compositionModifiable() {
    if (!peutModifier) return false;
    if (matchChoisi && estVerrouille(matchChoisi)) return false;
    return true;
}

function afficherLEtatDeLaComposition() {
    const etat = document.getElementById('compoEtat');
    if (!etat) return;

    const attendus = GTTerrain.effectifDeLaFormation(formationCourante, sportCourant);
    const places = sportifsDeLEquipe().filter(function(p) {
        const c = compositionCourante[p.id];
        return c && c.titulaire;
    }).length;

    etat.className = 'gt-compo-etat';

    if (matchChoisi && estVerrouille(matchChoisi)) {
        etat.className = 'gt-compo-etat verrouille';
        etat.innerHTML = '<i class="fas fa-lock"></i> Cette rencontre porte déjà un résultat : sa composition est figée. ' +
                         'Aucune modification rétroactive n\'est possible sur un tour déjà joué.';
        return;
    }

    if (!peutModifier) {
        etat.innerHTML = '<i class="fas fa-eye"></i> Vous consultez cette équipe en tant que ' +
                         escapeHtml(monStatutDansLEquipe.join(', ')) +
                         '. Seuls le créateur, le capitaine, le coach et le président modifient la composition.';
        return;
    }

    const messages = [];
    messages.push(places + ' sur ' + attendus + ' place(s) occupée(s)');
    if (matchChoisi) {
        messages.push('rencontre du ' + (matchChoisi.match_date
            ? new Date(matchChoisi.match_date).toLocaleDateString('fr-FR')
            : 'calendrier') + ' contre ' + (matchChoisi._nomAdversaire || 'l\'adversaire'));
    } else {
        messages.push('composition par défaut, reprise à chaque nouvelle rencontre');
    }
    if (compositionModifiee) messages.push('modifications non enregistrées');

    etat.innerHTML = (compositionModifiee ? '<i class="fas fa-circle-exclamation"></i> ' : '<i class="fas fa-circle-check"></i> ') +
                     escapeHtml(messages.join(' · ')) + '.';
}

// ═══════════════════════════════════════════════════════════
// 16. LE GESTE — TACTILE ET SOURIS (ton point 24)
// -----------------------------------------------------------
// Un seul code pour le doigt, le stylet et la souris : les
// événements Pointer les unifient. Pas de duplication
// touchstart / mousedown, donc pas de divergence entre les deux.
//
//   glisser            déplace le sportif
//   appui long         vibration courte, puis la fiche s'ouvre
//   appui bref         la fiche s'ouvre aussi (PC non tactile)
//
// Le terrain porte touch-action: none dans la feuille de style,
// sinon le navigateur ferait défiler la page au lieu de laisser
// glisser.
// ═══════════════════════════════════════════════════════════
// CHANTIER 11 — LE GESTE REFAIT
// ------------------------------------------------------------
// CE QUI N'ALLAIT PAS
//
// L'appui long ouvrait la FICHE, et le glissement partait au
// bout de 8 pixels. Sur un ecran tactile, un doigt pose bouge
// toujours de plus de 8 pixels : le deplacement demarrait donc
// tout seul, au moindre effleurement. Les joueurs partaient
// dans tous les sens — « ca se melange ».
//
// Pire : le minuteur de l'appui long etait annule des 4 pixels
// de mouvement. Un doigt n'est jamais immobile a 4 pixels pres.
// L'appui long ne se declenchait donc presque jamais — « la
// sensibilite n'existe pas ».
//
// CE QUE CA FAIT MAINTENANT
//
//   AU DOIGT (et au stylet)
//     appui long (450 ms, sans bouger de plus de 12 px)
//         -> le joueur est SAISI, vibration courte de confirmation
//         -> on le deplace, il suit le doigt
//     appui bref
//         -> sa fiche s'ouvre
//     un simple effleurement ne deplace plus rien.
//
//   A LA SOURIS
//     glisser directement, comme partout ailleurs sur un
//     ordinateur : attendre un appui long avec une souris serait
//     une punition. Le seuil passe a 6 px, largement suffisant
//     pour distinguer un clic d'un glissement.
//     clic simple -> la fiche.
//
// Et pendant tout le deplacement, le joueur RESTE DANS LE CADRE
// du terrain : il ne peut plus etre traine hors de l'ecran.
// ═══════════════════════════════════════════════════════════
const DUREE_APPUI_LONG   = 450;  // ms — le temps de « prendre » le joueur
const TOLERANCE_IMMOBILE = 12;   // px — un doigt n'est jamais parfaitement immobile
const SEUIL_SOURIS       = 6;    // px — a la souris, le glissement est immediat

let gesteEnCours = null;

function brancherLeGeste() {
    document.querySelectorAll('.gt-place[data-membre], .gt-banc-place[data-membre]').forEach(function(el) {
        if (el.dataset.branche === '1') return;
        el.dataset.branche = '1';
        el.addEventListener('pointerdown', demarrerLeGeste);
        // Le menu contextuel du telephone s'ouvre sur un appui
        // long et volerait le geste. On le refuse ici seulement.
        el.addEventListener('contextmenu', function(ev) { ev.preventDefault(); });
    });
}

function demarrerLeGeste(e) {
    if (e.button != null && e.button !== 0) return;   // clic droit ignoré

    const el = e.currentTarget;
    const idMembre = el.dataset.membre;
    if (!idMembre) return;

    const auDoigt = e.pointerType === 'touch' || e.pointerType === 'pen';

    gesteEnCours = {
        element: el,
        idMembre: idMembre,
        departX: e.clientX,
        departY: e.clientY,
        auDoigt: auDoigt,
        saisi: !auDoigt,        // a la souris, on peut glisser tout de suite
        deplace: false,
        pointerId: e.pointerId,
        depuisLeBanc: el.classList.contains('gt-banc-place'),
        minuteur: null
    };

    // Au doigt, l'appui long SAISIT le joueur. La vibration dit
    // que le geste a ete recu : a partir de la, le doigt commande.
    if (auDoigt && compositionModifiable()) {
        gesteEnCours.minuteur = setTimeout(function() {
            if (!gesteEnCours) return;
            gesteEnCours.saisi = true;
            gesteEnCours.element.classList.add('saisi');
            vibrer(22);
        }, DUREE_APPUI_LONG);
    }

    try { el.setPointerCapture(e.pointerId); } catch (err) { /* certains navigateurs refusent */ }

    document.addEventListener('pointermove', suivreLeGeste);
    document.addEventListener('pointerup', finirLeGeste);
    document.addEventListener('pointercancel', annulerLeGeste);
}

function suivreLeGeste(e) {
    if (!gesteEnCours) return;
    const dx = e.clientX - gesteEnCours.departX;
    const dy = e.clientY - gesteEnCours.departY;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));

    // Le doigt a trop bouge avant la fin du minuteur : ce n'etait
    // pas un appui long, c'etait un defilement de la page. On
    // laisse le navigateur faire son travail et on abandonne.
    if (gesteEnCours.auDoigt && !gesteEnCours.saisi) {
        if (distance > TOLERANCE_IMMOBILE) {
            clearTimeout(gesteEnCours.minuteur);
            annulerLeGeste();
        }
        return;
    }

    if (!gesteEnCours.deplace) {
        if (distance < (gesteEnCours.auDoigt ? 3 : SEUIL_SOURIS)) return;
        if (!compositionModifiable()) return;        // on regarde, on ne déplace pas

        gesteEnCours.deplace = true;
        gesteEnCours.element.classList.add('deplace');
        document.getElementById('terrain')?.classList.add('depot-actif');
        document.getElementById('bancListe')?.classList.add('depot-actif');
    }

    if (e.cancelable) e.preventDefault();

    // Le joueur reste DANS LE CADRE du terrain, comme tu l'as
    // demande. On borne le deplacement au rectangle du terrain
    // elargi de la moitie d'un jeton, pour qu'on puisse encore
    // viser la ligne de touche sans que le joueur parte a l'ecran.
    let cx = e.clientX, cy = e.clientY;
    const terrain = document.getElementById('terrain');
    if (terrain && !gesteEnCours.depuisLeBanc) {
        const cadre = terrain.getBoundingClientRect();
        const marge = gesteEnCours.element.offsetWidth / 2 || 18;
        cx = Math.min(Math.max(cx, cadre.left - marge), cadre.right + marge);
        cy = Math.min(Math.max(cy, cadre.top - marge), cadre.bottom + marge);
    }
    gesteEnCours.dernierX = cx;
    gesteEnCours.dernierY = cy;

    gesteEnCours.element.style.transform =
        (gesteEnCours.depuisLeBanc ? '' : 'translate(-50%, -50%) ') +
        'translate(' + (cx - gesteEnCours.departX) + 'px, ' + (cy - gesteEnCours.departY) + 'px)';
}

function finirLeGeste(e) {
    if (!gesteEnCours) return;
    const geste = gesteEnCours;
    nettoyerLeGeste();

    clearTimeout(geste.minuteur);
    geste.element.classList.remove('deplace', 'saisi');
    geste.element.style.transform = '';
    document.getElementById('terrain')?.classList.remove('depot-actif');
    document.getElementById('bancListe')?.classList.remove('depot-actif');

    // Rien n'a bouge : c'est un appui, et un appui ouvre la fiche.
    // Au doigt comme a la souris, c'est le meme geste — celui
    // auquel tout le monde s'attend.
    if (!geste.deplace) {
        ouvrirLaFicheDuMembre(geste.idMembre);
        return;
    }

    deposer(geste, geste.dernierX != null ? geste.dernierX : e.clientX,
                   geste.dernierY != null ? geste.dernierY : e.clientY);
}

function annulerLeGeste() {
    if (!gesteEnCours) return;
    clearTimeout(gesteEnCours.minuteur);
    gesteEnCours.element.classList.remove('deplace', 'saisi');
    gesteEnCours.element.style.transform = '';
    document.getElementById('terrain')?.classList.remove('depot-actif');
    document.getElementById('bancListe')?.classList.remove('depot-actif');
    nettoyerLeGeste();
}

function nettoyerLeGeste() {
    document.removeEventListener('pointermove', suivreLeGeste);
    document.removeEventListener('pointerup', finirLeGeste);
    document.removeEventListener('pointercancel', annulerLeGeste);
    gesteEnCours = null;
}

// Où le sportif a-t-il été lâché ?
function deposer(geste, clientX, clientY) {
    const terrain = document.getElementById('terrain');
    const banc = document.getElementById('bancListe');
    if (!terrain) return;

    const cadreTerrain = terrain.getBoundingClientRect();
    const cadreBanc = banc ? banc.getBoundingClientRect() : null;
    const compo = compositionCourante[geste.idMembre];
    if (!compo) return;

    const dansLeTerrain = clientX >= cadreTerrain.left && clientX <= cadreTerrain.right &&
                          clientY >= cadreTerrain.top  && clientY <= cadreTerrain.bottom;

    const dansLeBanc = cadreBanc &&
                       clientX >= cadreBanc.left && clientX <= cadreBanc.right &&
                       clientY >= cadreBanc.top  && clientY <= cadreBanc.bottom;

    if (dansLeTerrain) {
        const x = ((clientX - cadreTerrain.left) / cadreTerrain.width) * 100;
        const y = ((clientY - cadreTerrain.top) / cadreTerrain.height) * 100;
        const pose = GTTerrain.poserDans(x, y);

        // Un titulaire de plus que la formation ne peut pas
        // tenir : on refuse plutôt que d'en pousser un dehors
        // sans le dire.
        const attendus = GTTerrain.effectifDeLaFormation(formationCourante, sportCourant);
        const dejaLa = sportifsDeLEquipe().filter(function(p) {
            const c = compositionCourante[p.id];
            return c && c.titulaire && String(p.id) !== String(geste.idMembre);
        }).length;

        if (!compo.titulaire && dejaLa >= attendus) {
            showToast('Le terrain est complet : ' + attendus + ' places pour un ' + formationCourante +
                      '. Sortez d\'abord quelqu\'un, ou changez de formation.', 'warning');
            dessinerLeTerrain();
            dessinerLeBanc();
            return;
        }

        compo.titulaire = true;
        compo.x = pose.x;
        compo.y = pose.y;
        compo.slot_cle = null;   // placement libre, plus lié à un emplacement
        const groupe = GTTerrain.groupePourY(pose.y, sportCourant);
        compo.position_detail = GTTerrain.nommerPoste(groupe, 0, 1);
        vibrer(10);

    } else if (dansLeBanc || !dansLeTerrain) {
        compo.titulaire = false;
        compo.x = null;
        compo.y = null;
        compo.slot_cle = null;
        vibrer(10);
    }

    compositionModifiee = true;
    dessinerLeTerrain();
    dessinerLeBanc();
    afficherLEtatDeLaComposition();
}

// La vibration n'existe pas partout — sur ordinateur, sur iOS,
// et dès que l'utilisateur l'a désactivée. On essaie, et on
// continue sans elle.
function vibrer(duree) {
    try {
        if (navigator && typeof navigator.vibrate === 'function') navigator.vibrate(duree);
    } catch (e) { /* rien à faire, le geste marche quand même */ }
}

// ═══════════════════════════════════════════════════════════
// 16 bis. PLACEMENT AUTOMATIQUE
// -----------------------------------------------------------
// L'organisateur ne veut pas poser onze personnes à la main
// quand il change de formation. Chacun va à l'emplacement qui
// correspond le mieux à son poste déclaré ; il corrige ensuite
// ce qu'il veut.
// ═══════════════════════════════════════════════════════════
function placerAutomatiquement() {
    if (!compositionModifiable()) return;

    const emplacements = GTTerrain.placer(formationCourante, sportCourant);
    const sportifs = sportifsDeLEquipe();

    // Les blessés et les suspendus passent en dernier : ils ne
    // sont pas exclus — c'est le coach qui tranche — mais ils ne
    // prennent pas la place d'un sportif disponible.
    const disponibles = sportifs.filter(function(p) { return !p.is_injured && !p.is_suspended; });
    const indisponibles = sportifs.filter(function(p) { return p.is_injured || p.is_suspended; });

    const ordonnes = disponibles.concat(indisponibles).map(function(p) {
        return { id: p.id, groupe: groupeDuMembre(p), slot_cle: (compositionCourante[p.id] || {}).slot_cle };
    });

    const resultat = GTTerrain.affecter(emplacements, ordonnes);

    sportifs.forEach(function(p) {
        if (!compositionCourante[p.id]) compositionCourante[p.id] = {};
        compositionCourante[p.id].titulaire = false;
        compositionCourante[p.id].x = null;
        compositionCourante[p.id].y = null;
        compositionCourante[p.id].slot_cle = null;
    });

    let poses = 0;
    resultat.grille.forEach(function(g) {
        if (!g.sportif) return;
        const c = compositionCourante[g.sportif.id];
        c.titulaire = true;
        c.x = g.emplacement.x;
        c.y = g.emplacement.y;
        c.slot_cle = g.emplacement.cle;
        c.position_detail = g.emplacement.libelle;
        poses++;
    });

    compositionModifiee = true;
    dessinerLeTerrain();
    dessinerLeBanc();
    afficherLEtatDeLaComposition();

    const manquants = emplacements.length - poses;
    showToast(poses + ' sportif(s) placé(s) en ' + formationCourante +
              (manquants > 0 ? ' — ' + manquants + ' place(s) restent vides, l\'effectif ne suffit pas.' : '.') +
              ' Déplacez qui vous voulez, puis enregistrez.', 'success');
}

// ═══════════════════════════════════════════════════════════
// 16 ter. ENREGISTREMENT
// -----------------------------------------------------------
// Composition par défaut  -> gt_team_players
// Composition d'un match  -> gt_match_lineups
//
// Pour un match, on remplace les lignes de CETTE équipe sur CE
// match, et rien d'autre : la feuille de l'adversaire n'est
// jamais touchée.
// ═══════════════════════════════════════════════════════════
async function enregistrerLaComposition() {
    if (!compositionModifiable()) {
        showToast('Vous n\'avez pas le droit de modifier cette composition.', 'warning');
        return;
    }

    const sportifs = sportifsDeLEquipe();
    showLoader();

    if (!matchChoisi) {
        // --- La composition par défaut de l'équipe
        let erreurs = 0;
        for (let i = 0; i < sportifs.length; i++) {
            const p = sportifs[i];
            const c = compositionCourante[p.id] || {};
            const { error } = await supabaseClient
                .from(TBL_TEAM_PLAYERS)
                .update({
                    is_starting: !!c.titulaire,
                    pos_x: c.x == null ? null : c.x,
                    pos_y: c.y == null ? null : c.y,
                    slot_key: c.slot_cle || null,
                    position_detail: c.position_detail || p.position_detail || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', p.id);
            if (error) { console.warn('Membre non enregistré :', error.message); erreurs++; }
        }

        const { error: erreurEquipe } = await supabaseClient
            .from(TBL_TEAMS)
            .update({
                default_formation: formationCourante,
                team_format: formatCourant,
                sport_code: sportCourant.code,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentTeam.id);
        if (erreurEquipe) console.warn('Équipe non mise à jour :', erreurEquipe.message);

        hideLoader();
        compositionModifiee = false;
        afficherLEtatDeLaComposition();
        showToast('Composition par défaut enregistrée' + (erreurs ? ' — ' + erreurs + ' ligne(s) en échec, voir la console.' : '.') +
                  ' Elle servira de point de départ à chaque nouvelle rencontre.', 'success');
        return;
    }

    // --- La composition de ce match
    const { error: erreurMenage } = await supabaseClient
        .from(TBL_LINEUPS)
        .delete()
        .eq('match_id', matchChoisi.id)
        .eq('team_id', currentTeam.id);

    if (erreurMenage) {
        hideLoader();
        showToast('Impossible de remplacer la feuille existante : ' + erreurMenage.message, 'error');
        return;
    }

    const maintenant = new Date().toISOString();
    let ordreBanc = 0;

    const lignes = sportifs.map(function(p) {
        const c = compositionCourante[p.id] || {};
        const titulaire = !!c.titulaire;
        return {
            match_id: matchChoisi.id,
            tournament_id: matchChoisi.tournament_id || currentTeam.tournament_id || null,
            team_id: currentTeam.id,
            team_player_id: p.id,
            player_id: p.user_id || null,
            member_name: memberDisplayName(p),
            jersey_number: p.jersey_number == null ? null : p.jersey_number,
            is_starter: titulaire,
            pos_x: titulaire && c.x != null ? c.x : null,
            pos_y: titulaire && c.y != null ? c.y : null,
            slot_key: c.slot_cle || null,
            position_group: groupeDuMembre(p),
            position_detail: c.position_detail || p.position_detail || null,
            formation: formationCourante,
            team_format: formatCourant,
            bench_order: titulaire ? null : (ordreBanc++),
            is_captain: !!(c.is_captain || p.is_captain),
            is_injured: !!(c.is_injured || p.is_injured),
            injury_minute: c.injury_minute == null ? null : c.injury_minute,
            sub_in_minute: c.sub_in_minute == null ? null : c.sub_in_minute,
            sub_out_minute: c.sub_out_minute == null ? null : c.sub_out_minute,
            status: 'confirmee',
            created_by: currentUser.id,
            updated_by: currentUser.id,
            updated_at: maintenant
        };
    });

    let ecrites = 0;
    for (let i = 0; i < lignes.length; i += 100) {
        const paquet = lignes.slice(i, i + 100);
        const { error } = await supabaseClient.from(TBL_LINEUPS).insert(paquet);
        if (error) {
            hideLoader();
            showToast('Erreur à l\'écriture de la composition : ' + error.message, 'error');
            return;
        }
        ecrites += paquet.length;
    }

    // On marque le côté confirmé, sans toucher à celui de l'adversaire.
    const cote = String(matchChoisi.team_a_id) === String(currentTeam.id) ? 'lineup_a_confirmed' : 'lineup_b_confirmed';
    const majMatch = {};
    majMatch[cote] = true;
    await supabaseClient.from(TBL_MATCHES).update(majMatch).eq('id', matchChoisi.id);

    hideLoader();
    compositionModifiee = false;
    await chargerLaComposition();
    showToast('Composition enregistrée pour la rencontre contre ' +
              (matchChoisi._nomAdversaire || 'l\'adversaire') + ' — ' + ecrites + ' sportif(s) sur la feuille.', 'success');
}

// ═══════════════════════════════════════════════════════════
// 16 quater. LA FICHE D'UN SPORTIF (tes points 24 et 25)
// -----------------------------------------------------------
// Toutes ses données, plus ses statistiques : sur ce match si
// une rencontre est choisie, et son cumul sur le tournoi.
// Le calcul passe par GTStats — le même moteur que la fiche
// complète et que le classement, donc les mêmes chiffres.
// ═══════════════════════════════════════════════════════════
async function ouvrirLaFicheDuMembre(idMembre) {
    const membre = effectifCourant.filter(function(p) { return String(p.id) === String(idMembre); })[0];
    if (!membre) return;

    const nom = memberDisplayName(membre);
    const photo = memberDisplayPhoto(membre);
    const compo = compositionCourante[membre.id] || {};

    document.getElementById('memberModalTitle').innerHTML = '<i class="fas fa-id-card"></i> ' + escapeHtml(nom);

    const brassards = [];
    if (compo.is_captain || membre.is_captain) brassards.push('<span class="gt-brassard capitaine"><i class="fas fa-star"></i> Capitaine</span>');
    if (membre.is_president) brassards.push('<span class="gt-brassard president"><i class="fas fa-user-shield"></i> Président</span>');
    if (membre.is_coach)     brassards.push('<span class="gt-brassard coach"><i class="fas fa-user-tie"></i> Coach</span>');
    if (membre.is_injured || compo.is_injured) brassards.push('<span class="gt-brassard blesse"><i class="fas fa-kit-medical"></i> Blessé</span>');
    if (membre.is_suspended) brassards.push('<span class="gt-brassard suspendu"><i class="fas fa-ban"></i> Suspendu</span>');

    const identite = [
        { cle: 'Poste', valeur: membre.position_detail || compo.position_detail || '—' },
        { cle: 'Numéro', valeur: membre.jersey_number != null ? '#' + membre.jersey_number : '—' },
        { cle: 'Catégorie', valeur: libelleCategorie(membre.member_category) },
        { cle: 'Âge', valeur: membre.age ? membre.age + ' ans' : '—' },
        { cle: 'Taille', valeur: membre.height_cm ? membre.height_cm + ' cm' : '—' },
        { cle: 'Poids', valeur: membre.weight_kg ? membre.weight_kg + ' kg' : '—' },
        { cle: 'Pied fort', valeur: membre.preferred_foot || '—' },
        { cle: 'Nationalité', valeur: membre.nationality || '—' },
        { cle: 'Langues', valeur: membre.languages_spoken || '—' },
        { cle: 'Sur la feuille', valeur: compo.titulaire ? 'Titulaire' : 'Remplaçant' }
    ];

    let html = '<div class="gt-fiche-tete">' +
        '<div class="gt-fiche-photo">' +
            (photo ? '<img src="' + escapeHtml(photo) + '" alt="">' :
                     '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>') +
        '</div>' +
        '<div><div class="gt-fiche-nom">' + escapeHtml(nom) + '</div>' +
        '<div class="gt-fiche-sous">' + escapeHtml(membre.position_detail || mot('{Sportif}')) +
        (currentTeam ? ' · ' + escapeHtml(currentTeam.name) : '') + '</div>' +
        (brassards.length ? '<div class="gt-fiche-brassards">' + brassards.join('') + '</div>' : '') +
        '</div></div>';

    html += '<div class="gt-fiche-titre">Identité</div>';
    html += '<div class="gt-fiche-grille">' + identite.map(function(l) {
        return '<div class="gt-fiche-ligne"><span class="cle">' + escapeHtml(l.cle) + '</span>' +
               '<span class="valeur">' + escapeHtml(l.valeur) + '</span></div>';
    }).join('') + '</div>';

    // CHANTIER 11 — modifier les informations, sans supprimer.
    if (compositionModifiable()) {
        html += '<div class="gt-fiche-titre">Ses informations</div>';
        html += '<div class="gt-fiche-actions">' +
            '<button class="btn-primary" data-action="modifier">' +
                '<i class="fas fa-pen"></i> Modifier ses informations</button>' +
            '<button class="btn-secondary danger" data-action="retirer">' +
                '<i class="fas fa-user-minus"></i> Retirer de l\'équipe</button>' +
            '</div>';
    }

    // Les actions de composition, réservées aux habilités.
    if (compositionModifiable()) {
        html += '<div class="gt-fiche-titre">Sur cette composition</div>';
        html += '<div class="gt-fiche-actions">' +
            '<button class="btn-secondary" data-action="bascule">' +
                '<i class="fas ' + (compo.titulaire ? 'fa-chair' : 'fa-person-running') + '"></i> ' +
                (compo.titulaire ? 'Mettre sur le banc' : 'Faire entrer sur le terrain') + '</button>' +
            '<button class="btn-secondary" data-action="capitaine">' +
                '<i class="fas fa-star"></i> ' + (compo.is_captain || membre.is_captain ? 'Retirer le brassard' : 'Donner le brassard') + '</button>' +
            '<button class="btn-secondary" data-action="blessure">' +
                '<i class="fas fa-kit-medical"></i> ' + (compo.is_injured || membre.is_injured ? 'Déclarer rétabli' : 'Déclarer blessé') + '</button>' +
            '</div>';
    }

    html += '<div class="gt-fiche-titre">Statistiques</div>';
    html += '<div id="ficheStats"><div class="gt-fiche-vide"><i class="fas fa-spinner fa-pulse"></i> Chargement…</div></div>';

    document.getElementById('memberModalBody').innerHTML = html;
    openModal('memberModal');

    // Les actions
    document.querySelectorAll('#memberModalBody [data-action]').forEach(function(bouton) {
        bouton.addEventListener('click', function() {
            appliquerActionFiche(membre, bouton.dataset.action);
        });
    });

    await remplirLesStatistiquesDeLaFiche(membre);
}

function appliquerActionFiche(membre, action) {

    // CHANTIER 11 — ouvrir le formulaire deja rempli.
    if (action === 'modifier') {
        closeModal('memberModal');
        ouvrirEditionMembre(membre);
        return;
    }
    if (action === 'retirer') {
        closeModal('memberModal');
        removePlayer(membre.id);
        return;
    }

    const compo = compositionCourante[membre.id] || (compositionCourante[membre.id] = {});

    if (action === 'bascule') {
        if (!compo.titulaire) {
            const attendus = GTTerrain.effectifDeLaFormation(formationCourante, sportCourant);
            const dejaLa = sportifsDeLEquipe().filter(function(p) {
                const c = compositionCourante[p.id];
                return c && c.titulaire;
            }).length;
            if (dejaLa >= attendus) {
                showToast('Le terrain est complet : ' + attendus + ' places pour un ' + formationCourante + '.', 'warning');
                return;
            }
        }
        compo.titulaire = !compo.titulaire;
        if (!compo.titulaire) { compo.x = null; compo.y = null; compo.slot_cle = null; }

    } else if (action === 'capitaine') {
        const nouveau = !(compo.is_captain || membre.is_captain);
        // Un seul brassard à la fois.
        sportifsDeLEquipe().forEach(function(p) {
            if (compositionCourante[p.id]) compositionCourante[p.id].is_captain = false;
        });
        compo.is_captain = nouveau;

    } else if (action === 'blessure') {
        compo.is_injured = !(compo.is_injured || membre.is_injured);
    }

    compositionModifiee = true;
    closeModal('memberModal');
    dessinerLeTerrain();
    dessinerLeBanc();
    afficherLEtatDeLaComposition();
}

async function remplirLesStatistiquesDeLaFiche(membre) {
    const zone = document.getElementById('ficheStats');
    if (!zone) return;

    if (!membre.user_id) {
        zone.innerHTML = '<div class="gt-fiche-vide">Ce membre n\'a pas de compte HubISoccer.<br>' +
            'Les statistiques se rattachent à un compte : sans lui, ses actions ne peuvent pas lui être créditées.</div>';
        return;
    }

    const filtre = supabaseClient.from(TBL_PLAYER_STATS).select('*').eq('player_id', membre.user_id);
    const { data, error } = matchChoisi ? await filtre.eq('match_id', matchChoisi.id) : await filtre;

    if (error) {
        zone.innerHTML = '<div class="gt-fiche-vide">Statistiques indisponibles : ' + escapeHtml(error.message) + '</div>';
        return;
    }

    const lignes = data || [];
    if (!lignes.length) {
        zone.innerHTML = '<div class="gt-fiche-vide">' +
            (matchChoisi ? 'Aucune statistique pour cette rencontre.' : 'Aucune statistique enregistrée.') +
            '<br>Elles naissent des rapports de match : dès qu\'un officiel désigné dépose son rapport et que ' +
            'l\'organisateur lance le calcul, elles apparaissent ici.</div>';
        return;
    }

    const cumul = GTStats.agregerTournoi(lignes, { player_id: membre.user_id });
    const note = cumul.average_rating;

    let html = '';
    if (note != null) {
        html += '<div class="gt-note-bloc" style="margin-bottom:12px;">' +
                '<span class="gt-note ' + GTStats.classeNote(note) + '">' + Number(note).toFixed(2) + '</span>' +
                '<div class="gt-note-legende">' +
                    '<span class="gt-note-libelle">' + escapeHtml(GTStats.libelleNote(note)) + '</span>' +
                    '<span class="gt-note-sous">' + (matchChoisi ? 'Note de la rencontre' : 'Moyenne sur ' + cumul.matches_played + ' match(s)') + '</span>' +
                '</div></div>';
    }

    const mesures = [
        { cle: 'Matchs', valeur: cumul.matches_played },
        { cle: 'Minutes', valeur: cumul.minutes_played + "'" },
        { cle: 'Buts', valeur: cumul.goals },
        { cle: 'Passes déc.', valeur: cumul.assists },
        { cle: 'Tirs cadrés', valeur: cumul.shots_on_target },
        { cle: 'Passes', valeur: cumul.passes_completed + '/' + cumul.passes_attempted },
        { cle: 'Jaunes', valeur: cumul.yellow_cards },
        { cle: 'Rouges', valeur: cumul.red_cards }
    ];

    html += '<div class="gt-fiche-grille">' + mesures.map(function(m) {
        return '<div class="gt-fiche-ligne"><span class="cle">' + escapeHtml(m.cle) + '</span>' +
               '<span class="valeur">' + escapeHtml(m.valeur) + '</span></div>';
    }).join('') + '</div>';

    html += '<p style="margin-top:12px;"><a href="player-stats.html?id=' + encodeURIComponent(membre.user_id) + '" class="btn-secondary">' +
            '<i class="fas fa-chart-simple"></i> Fiche complète et détail de la note</a></p>';

    zone.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 17. ENCADREMENT (technique, médical, direction, entourage —
//     regroupés par catégorie, même niveau de détail que les
//     footballeurs)
// ═══════════════════════════════════════════════════════════
function renderEncadrement(members) {
    const section = document.getElementById('encadrementSection');
    const container = document.getElementById('encadrementList');
    if (!members.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    const byCategory = {};
    members.forEach(function(p) {
        const cat = p.member_category || 'technique';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
    });

    let html = '';
    ['technique', 'medical', 'direction', 'entourage'].forEach(function(cat) {
        if (!byCategory[cat] || !byCategory[cat].length) return;
        const catDef = MEMBER_CATEGORIES[cat];
        html += '<div class="encadrement-group">' +
                '<h4 class="encadrement-group-title"><i class="fas ' + catDef.icon + '"></i> ' + escapeHtml(libelleCategorie(cat)) + '</h4>' +
                byCategory[cat].map(function(p) { return memberItemHtml(p); }).join('') +
                '</div>';
    });
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 18. RENDU D'UNE LIGNE MEMBRE (détails complets : âge, taille,
//     langue, poste précis — même gabarit pour toutes catégories)
// ═══════════════════════════════════════════════════════════
function memberItemHtml(p) {
    const name = memberDisplayName(p);
    const photo = memberDisplayPhoto(p);
    const avatar = photo ? '<img src="' + photo + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(name) + '</div>';
    const roleLabel = p.position_detail || (p.member_category === 'footballeur' ? (p.is_starting ? 'Titulaire' : 'Remplaçant') : '');

    const detailBits = [];
    if (roleLabel) detailBits.push('<span>' + escapeHtml(roleLabel) + '</span>');
    if (p.age) detailBits.push('<span><i class="fas fa-birthday-cake"></i> ' + escapeHtml(String(p.age)) + ' ans</span>');
    if (p.height_cm) detailBits.push('<span><i class="fas fa-ruler-vertical"></i> ' + escapeHtml(String(p.height_cm)) + ' cm</span>');
    if (p.languages_spoken) detailBits.push('<span><i class="fas fa-comment"></i> ' + escapeHtml(p.languages_spoken) + '</span>');
    if (p.is_captain) detailBits.push('<span class="captain"><i class="fas fa-star"></i> Capitaine</span>');

    return '<div class="player-item"><div class="player-avatar">' + avatar + '</div>' +
           '<div class="player-info"><div class="player-name">' + (p.jersey_number ? escapeHtml(String(p.jersey_number)) + '. ' : '') + escapeHtml(name) + '</div>' +
           '<div class="player-details">' + detailBits.join('') + '</div></div>' +
           (peutModifier ? '<button class="btn-remove-player" onclick="removePlayer(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
}

// ═══════════════════════════════════════════════════════════
// 19. LISTE COMPLÈTE (gestion — tout le monde, toutes catégories)
// ═══════════════════════════════════════════════════════════
function renderFullRoster(members) {
    document.getElementById('playersList').innerHTML = members.map(function(p) { return memberItemHtml(p); }).join('');
}

// ═══════════════════════════════════════════════════════════
// 20. SÉLECTEUR DE CATÉGORIE → PEUPLE LE SÉLECTEUR DE POSTE
// ═══════════════════════════════════════════════════════════
function populateCategorySelect() {
    const select = document.getElementById('memberCategorySelect');
    if (!select) return;
    // Chantier 08 — cette liste est repeuplee quand la discipline
    // devient connue, pour que « Footballeur » devienne
    // « Basketteur » ou « Chanteur ». On conserve le choix en
    // cours : sans cela, ouvrir une equipe reinitialiserait le
    // formulaire sous les doigts de l'utilisateur.
    const choix = select.value;
    select.innerHTML = Object.keys(MEMBER_CATEGORIES).map(function(key) {
        return '<option value="' + key + '">' + escapeHtml(libelleCategorie(key)) + '</option>';
    }).join('');
    if (choix) select.value = choix;
}

function populatePositionSelect(categoryKey) {
    const category = MEMBER_CATEGORIES[categoryKey];
    const select = document.getElementById('playerPosition');
    let html = '';
    category.groups.forEach(function(g) {
        const opts = g.positions.map(function(pos) {
            if (typeof pos === 'string') return '<option value="' + escapeHtml(pos) + '">' + escapeHtml(pos) + '</option>';
            return '<option value="' + escapeHtml(pos.label) + '" data-search-role="' + escapeHtml(pos.searchRole || '') + '">' + escapeHtml(pos.label) + '</option>';
        }).join('');
        html += g.label ? '<optgroup label="' + escapeHtml(g.label) + '">' + opts + '</optgroup>' : opts;
    });
    select.innerHTML = html;
}

function updateSearchModeForCategory(categoryKey) {
    const category = MEMBER_CATEGORIES[categoryKey];
    const searchSection = document.getElementById('memberSearchSection');
    const freeTextSection = document.getElementById('memberFreeTextSection');

    const firstPositionOpt = document.getElementById('playerPosition').selectedOptions[0];
    const perPositionRole = firstPositionOpt ? firstPositionOpt.dataset.searchRole : null;
    currentSearchRole = perPositionRole || category.searchRole;

    const connectable = !!currentSearchRole;
    searchSection.style.display = connectable ? 'block' : 'none';
    freeTextSection.style.display = connectable ? 'none' : 'block';

    document.getElementById('playerSearchResults').innerHTML = '';
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    selectedPlayerId = null;
    selectedPlayerProfile = null;
}

// ═══════════════════════════════════════════════════════════
// 21. RECHERCHE D'UN PRATIQUANT / MEMBRE (par role_code réel)
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) { document.getElementById('playerSearchResults').innerHTML = ''; return; }
    if (!currentSearchRole) return;

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .eq('role_code', currentSearchRole)
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) { console.error('Erreur recherche:', error.message); return; }

    const resultsDiv = document.getElementById('playerSearchResults');
    if (!data || !data.length) { resultsDiv.innerHTML = '<p class="empty-hint">' + escapeHtml(mot('Aucun {sportif} trouvé.')) + '</p>'; return; }

    resultsDiv.innerHTML = '';
    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const avatar = profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="Avatar">' : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'F') + '</div>';
        item.innerHTML = '<div class="player-avatar">' + avatar + '</div><span class="player-name">' + escapeHtml(profile.full_name || mot('{Sportif}')) + '</span>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            selectedPlayerProfile = profile;
            document.getElementById('playerSearch').value = '';
            resultsDiv.innerHTML = '';
            showSelectedPlayerPreview(profile);
        });
        resultsDiv.appendChild(item);
    });
}

function showSelectedPlayerPreview(profile) {
    const preview = document.getElementById('selectedPlayerPreview');
    const avatarDiv = document.getElementById('selectedPlayerAvatar');
    avatarDiv.innerHTML = profile.avatar_url
        ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
        : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'F') + '</div>';
    document.getElementById('selectedPlayerName').textContent = profile.full_name || mot('{Sportif}');
    preview.style.display = 'flex';
}

function clearSelectedPlayer() {
    selectedPlayerId = null;
    selectedPlayerProfile = null;
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    document.getElementById('playerSearch').value = '';
}

// ═══════════════════════════════════════════════════════════
// 22. AJOUT / SUPPRESSION D'UN MEMBRE
// ═══════════════════════════════════════════════════════════
// CHANTIER 11 — ouvrir le formulaire d'ajout, deja rempli avec
// ce que le membre porte aujourd'hui.
// ------------------------------------------------------------
// Le meme formulaire sert a ajouter et a modifier : c'est ce qui
// garantit qu'un champ ajoute demain apparaitra dans les deux
// cas sans qu'on y pense. Seul le titre, le bouton et la requete
// finale changent.
function ouvrirEditionMembre(membre) {
    resetAddMemberForm();
    membreEnEdition = membre.id;

    const categorie = membre.member_category || 'footballeur';
    currentCategory = categorie;
    document.getElementById('memberCategorySelect').value = categorie;
    populatePositionSelect(categorie);
    updateSearchModeForCategory(categorie);

    const estSportif = categorie === 'footballeur';
    document.getElementById('footballeurOnlyFields').style.display = estSportif ? 'block' : 'none';

    // Le poste : on le repose apres populatePositionSelect(), qui
    // vient de reconstruire la liste des options.
    const selPoste = document.getElementById('playerPosition');
    if (selPoste && membre.position_detail) {
        selPoste.value = membre.position_detail;
        // Un poste qui n'existe plus dans le catalogue ne doit pas
        // se perdre en silence : on l'ajoute en tete pour que
        // l'utilisateur le voie et decide lui-meme.
        if (selPoste.value !== membre.position_detail) {
            const opt = document.createElement('option');
            opt.value = membre.position_detail;
            opt.textContent = membre.position_detail + ' (poste actuel)';
            selPoste.insertBefore(opt, selPoste.firstChild);
            selPoste.value = membre.position_detail;
        }
    }

    const remplir = function(id, valeur) {
        const el = document.getElementById(id);
        if (el) el.value = valeur === null || valeur === undefined ? '' : valeur;
    };
    remplir('playerJersey', membre.jersey_number);
    remplir('memberAge', membre.age);
    remplir('memberHeight', membre.height_cm);
    remplir('memberLanguages', membre.languages_spoken);
    remplir('memberFreeTextName', membre.member_name);

    const cap = document.getElementById('playerIsCaptain');
    if (cap) cap.checked = !!membre.is_captain;
    const tit = document.getElementById('playerIsStarting');
    if (tit) tit.checked = !!membre.is_starting;

    // Le compte lie ne se change pas en modification : changer de
    // compte, c'est changer de personne, donc retirer et rajouter.
    selectedPlayerId = membre.user_id || null;
    const zoneRecherche = document.getElementById('memberSearchSection');
    if (zoneRecherche) zoneRecherche.style.display = membre.user_id ? 'none' : '';

    const titre = document.getElementById('addPlayerModalTitle');
    if (titre) titre.innerHTML = '<i class="fas fa-pen"></i> Modifier ' +
        escapeHtml(membre.member_name || 'ce membre');
    const bouton = document.getElementById('addPlayerSubmitBtn');
    if (bouton) bouton.innerHTML = '<i class="fas fa-floppy-disk"></i> Enregistrer les modifications';

    openModal('addPlayerModal');
}
window.ouvrirEditionMembre = ouvrirEditionMembre;

async function addPlayer(e) {
    e.preventDefault();
    if (!currentTeam) return;

    const categoryKey = document.getElementById('memberCategorySelect').value;
    const positionDetail = document.getElementById('playerPosition').value;
    const isFootballeur = categoryKey === 'footballeur';
    const connectable = !!currentSearchRole;

    let memberName = null;
    let memberPhotoUrl = null;

    if (connectable) {
        if (!selectedPlayerId) { showToast(mot('Veuillez rechercher et sélectionner un {sportif}.'), 'warning'); return; }
    } else {
        memberName = document.getElementById('memberFreeTextName').value.trim();
        if (!memberName) { showToast('Veuillez indiquer le nom de la personne.', 'warning'); return; }
        if (selectedMemberPhotoFile) {
            showLoader();
            try { memberPhotoUrl = await uploadTeamLogo(selectedMemberPhotoFile, 'mon-equipe-membre-' + currentTeam.id); }
            catch (err) { hideLoader(); showToast('Erreur envoi photo : ' + err.message, 'error'); return; }
            hideLoader();
        }
    }

    const payload = {
        team_id: currentTeam.id,
        user_id: connectable ? selectedPlayerId : null,
        member_category: categoryKey,
        position_detail: positionDetail || null,
        position: isFootballeur ? positionDetail : null,
        position_category: isFootballeur ? (POSITION_TO_PITCH_GROUP[positionDetail] || 'Milieu') : null,
        jersey_number: isFootballeur && document.getElementById('playerJersey').value ? parseInt(document.getElementById('playerJersey').value, 10) : null,
        is_captain: isFootballeur ? document.getElementById('playerIsCaptain').checked : false,
        is_starting: isFootballeur ? document.getElementById('playerIsStarting').checked : false,
        is_coach: categoryKey === 'technique',
        age: document.getElementById('memberAge').value ? parseInt(document.getElementById('memberAge').value, 10) : null,
        height_cm: document.getElementById('memberHeight').value ? parseInt(document.getElementById('memberHeight').value, 10) : null,
        languages_spoken: document.getElementById('memberLanguages').value.trim() || null,
        member_name: memberName,
        member_photo_url: memberPhotoUrl
    };

    showLoader();

    // CHANTIER 11 — le meme formulaire ajoute ou modifie.
    let error;
    if (membreEnEdition) {
        // On ne reecrit PAS team_id ni user_id : changer l'un ou
        // l'autre en modification voudrait dire changer de
        // personne ou d'equipe, ce qui n'est pas une correction
        // mais un deplacement. Ça se fait en retirant et
        // rajoutant, volontairement.
        const modif = Object.assign({}, payload);
        delete modif.team_id;
        delete modif.user_id;
        // Une photo non retouchee ne doit pas effacer l'ancienne.
        if (!modif.member_photo_url) delete modif.member_photo_url;

        const r = await supabaseClient.from(TBL_TEAM_PLAYERS)
            .update(modif).eq('id', membreEnEdition);
        error = r.error;
    } else {
        const r = await supabaseClient.from(TBL_TEAM_PLAYERS).insert([payload]);
        error = r.error;
    }
    hideLoader();

    if (error) {
        showToast(membreEnEdition
            ? 'Erreur lors de la modification : ' + error.message
            : 'Erreur lors de l\'ajout (peut-être déjà dans l\'équipe) : ' + error.message, 'error');
        return;
    }

    const etaitUneModification = !!membreEnEdition;
    membreEnEdition = null;

    showToast(etaitUneModification
        ? 'Informations modifiées.'
        : 'Ajouté avec succès', 'success');
    closeModal('addPlayerModal');
    resetAddMemberForm();
    await loadRoster();
}

function resetAddMemberForm() {
    // CHANTIER 11 — repasser en mode AJOUT.
    // Sans cette remise a zero, fermer une modification puis
    // cliquer sur « Ajouter » modifierait le membre precedent au
    // lieu d'en creer un nouveau.
    membreEnEdition = null;
    const titre = document.getElementById('addPlayerModalTitle');
    if (titre) titre.innerHTML = '<i class="fas fa-user-plus"></i> Ajouter un membre';
    const bouton = document.getElementById('addPlayerSubmitBtn');
    if (bouton) bouton.innerHTML = '<i class="fas fa-check"></i> Ajouter';
    const zoneRecherche = document.getElementById('memberSearchSection');
    if (zoneRecherche) zoneRecherche.style.display = '';

    document.getElementById('addPlayerForm').reset();
    document.getElementById('selectedPlayerPreview').style.display = 'none';
    document.getElementById('playerSearchResults').innerHTML = '';
    document.getElementById('memberPhotoPreview').innerHTML = '';
    selectedPlayerId = null;
    selectedPlayerProfile = null;
    selectedMemberPhotoFile = null;
}

async function removePlayer(playerId) {
    if (!confirm('Retirer cette personne de l\'équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAM_PLAYERS).delete().eq('id', playerId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); return; }
    showToast('Retiré de l\'équipe', 'info');
    await loadRoster();
}
window.removePlayer = removePlayer;

// ═══════════════════════════════════════════════════════════
// 23. CRÉATION / MODIFICATION D'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTournamentOptions() {
    const { data } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').order('start_date', { ascending: false });
    const select = document.getElementById('teamTournamentInput');
    select.innerHTML = (data || []).map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
}

function openCreateTeamModal() {
    document.getElementById('teamModalTitle').innerHTML = '<i class="fas fa-shield-alt"></i> Créer une équipe';
    document.getElementById('teamForm').reset();
    document.getElementById('teamLogoPreview').innerHTML = '';
    selectedTeamLogoFile = null;
    document.getElementById('teamForm').dataset.mode = 'create';
    openModal('teamModal');
}

function openEditTeamModal() {
    if (!currentTeam) return;
    document.getElementById('teamModalTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'équipe';
    document.getElementById('teamNameInput').value = currentTeam.name || '';
    document.getElementById('teamAgeCategoryInput').value = currentTeam.age_category || '';
    document.getElementById('teamTournamentInput').value = currentTeam.tournament_id || '';
    document.getElementById('teamLogoPreview').innerHTML = currentTeam.logo_url ? '<img src="' + currentTeam.logo_url + '" alt="Aperçu">' : '';
    selectedTeamLogoFile = null;
    document.getElementById('teamForm').dataset.mode = 'edit';
    openModal('teamModal');
}

async function uploadTeamLogo(file, teamRef) {
    const ext = file.name.split('.').pop();
    const path = teamRef + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

async function saveTeam(e) {
    e.preventDefault();
    const mode = document.getElementById('teamForm').dataset.mode;
    const name = document.getElementById('teamNameInput').value.trim();
    const tournamentId = document.getElementById('teamTournamentInput').value;
    const ageCategory = document.getElementById('teamAgeCategoryInput').value.trim() || null;

    if (!name || !tournamentId) { showToast('Le nom et le tournoi sont requis.', 'warning'); return; }

    showLoader();
    let logoUrl = mode === 'edit' ? currentTeam.logo_url : null;
    if (selectedTeamLogoFile) {
        try { logoUrl = await uploadTeamLogo(selectedTeamLogoFile, 'mon-equipe-' + currentUser.id); }
        catch (err) { hideLoader(); showToast('Erreur envoi logo : ' + err.message, 'error'); return; }
    }

    if (mode === 'create') {
        const { error } = await supabaseClient.from(TBL_TEAMS).insert([{
            tournament_id: tournamentId, name: name, age_category: ageCategory, logo_url: logoUrl, creator_id: currentUser.id
        }]);
        hideLoader();
        if (error) { showToast('Erreur création : ' + error.message, 'error'); return; }
        showToast('Équipe créée !', 'success');
    } else {
        const { error } = await supabaseClient.from(TBL_TEAMS).update({
            name: name, age_category: ageCategory, logo_url: logoUrl, tournament_id: tournamentId
        }).eq('id', currentTeam.id);
        hideLoader();
        if (error) { showToast('Erreur modification : ' + error.message, 'error'); return; }
        showToast('Équipe modifiée', 'success');
    }

    closeModal('teamModal');
    await loadMyTeams();
}

// ═══════════════════════════════════════════════════════════
// 24. MODALES GÉNÉRALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 25. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 26. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    populateCategorySelect();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    document.getElementById('teamSelect')?.addEventListener('change', function() {
        matchChoisi = null;
        formationCourante = null;
        selectTeam(this.value);
    });

    // --- Chantier 06 : les commandes de la composition
    document.getElementById('compoMatchSelect')?.addEventListener('change', async function() {
        if (compositionModifiee && !confirm('Des modifications ne sont pas enregistrées. Les abandonner ?')) {
            this.value = matchChoisi ? String(matchChoisi.id) : '';
            return;
        }
        const id = this.value;
        matchChoisi = id ? matchsDeLEquipe.filter(function(m) { return String(m.id) === String(id); })[0] || null : null;
        formationCourante = null;
        await chargerLaComposition();
    });

    document.getElementById('compoFormatSelect')?.addEventListener('change', function() {
        formatCourant = Number(this.value) || sportCourant.formatParDefaut;
        formationCourante = GTTerrain.formationParDefaut(sportCourant, formatCourant);
        compositionModifiee = true;
        monterLesSelecteurs();
        placerAutomatiquement();
    });

    document.getElementById('compoFormationSelect')?.addEventListener('change', function() {
        formationCourante = this.value;
        compositionModifiee = true;
        placerAutomatiquement();
    });

    document.getElementById('compoAutoBtn')?.addEventListener('click', placerAutomatiquement);
    document.getElementById('compoSaveBtn')?.addEventListener('click', enregistrerLaComposition);

    // Un départ hors de toute zone doit quand même finir le geste.
    window.addEventListener('blur', annulerLeGeste);

    document.getElementById('createTeamBtn')?.addEventListener('click', async function() {
        await loadTournamentOptions();
        openCreateTeamModal();
    });
    document.getElementById('editTeamBtn')?.addEventListener('click', async function() {
        await loadTournamentOptions();
        openEditTeamModal();
    });
    document.getElementById('teamForm')?.addEventListener('submit', saveTeam);

    document.getElementById('addPlayerBtn')?.addEventListener('click', function() {
        resetAddMemberForm();
        document.getElementById('memberCategorySelect').value = 'footballeur';
        currentCategory = 'footballeur';
        populatePositionSelect('footballeur');
        updateSearchModeForCategory('footballeur');
        document.getElementById('footballeurOnlyFields').style.display = 'block';
        openModal('addPlayerModal');
    });
    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayer);
    document.getElementById('clearPlayerSelectionBtn')?.addEventListener('click', clearSelectedPlayer);

    document.getElementById('memberCategorySelect')?.addEventListener('change', function() {
        currentCategory = this.value;
        populatePositionSelect(currentCategory);
        updateSearchModeForCategory(currentCategory);
        document.getElementById('footballeurOnlyFields').style.display = currentCategory === 'footballeur' ? 'block' : 'none';
    });
    document.getElementById('playerPosition')?.addEventListener('change', function() {
        updateSearchModeForCategory(currentCategory);
    });

    const playerSearchInput = document.getElementById('playerSearch');
    if (playerSearchInput) {
        let searchTimeout;
        playerSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            searchTimeout = setTimeout(function() { searchPlayers(query); }, 400);
        });
    }

    document.getElementById('teamLogoDropArea')?.addEventListener('click', function() { document.getElementById('teamLogoFile').click(); });
    document.getElementById('teamLogoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedTeamLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('teamLogoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });

    document.getElementById('memberPhotoDropArea')?.addEventListener('click', function() { document.getElementById('memberPhotoFile').click(); });
    document.getElementById('memberPhotoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedMemberPhotoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('memberPhotoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });

    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.querySelector('.close-modal')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.querySelector('.btn-cancel')?.addEventListener('click', function() { modal.style.display = 'none'; });
        modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    });

    await loadMyTeams();
});
