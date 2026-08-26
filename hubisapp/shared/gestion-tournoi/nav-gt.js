/* ============================================================
   HubISoccer — NAV-GT.JS
   Menu partagé du module « Gestion des tournois »
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Le menu latéral, recopié à l'identique dans 23 pages, ne
   proposait que 7 destinations. Résultat : 13 pages existaient,
   étaient entièrement codées, et AUCUN lien du dépôt n'y menait.
   Parmi elles manage-tournament.html — le panneau de gestion,
   c'est-à-dire le cœur même du module.

   Le menu est désormais construit ici, à un seul endroit, et
   s'adapte au contexte :
     - toujours visibles : les pages générales
     - visibles avec un tournoi ouvert : les pages du tournoi
     - visibles pour l'organisateur seulement : la gestion

   Tous les chemins ont été vérifiés contre les fichiers réels.
   ============================================================ */

'use strict';

// ============================================================
//  1) PAGES DU MODULE — vérifiées présentes dans le dossier
// ============================================================
var NAV_GENERAL = [
    { key: 'acceuil',      icon: 'fa-house',            label: 'Accueil',          href: 'acceuil.html' },
    { key: 'create',       icon: 'fa-plus',             label: 'Créer un tournoi', href: 'create-tournament.html' },
    { key: 'mine',         icon: 'fa-trophy',           label: 'Mes tournois',     href: 'my-tournaments.html' },
    { key: 'registrations',icon: 'fa-clipboard-list',   label: 'Mes inscriptions', href: 'my-registrations.html' },
    { key: 'team',         icon: 'fa-people-group',     label: 'Mon équipe',       href: 'my-team.html' },
    { key: 'register',     icon: 'fa-key',              label: "S'inscrire par code", href: 'public-register.html' },
    { key: 'card',         icon: 'fa-id-card',          label: 'Ma carte de tournoi', href: 'demande-carte.html' }
];

// Pages qui n'ont de sens qu'avec un tournoi sélectionné.
// Le lien reçoit automatiquement ?id=<tournoi courant>.
var NAV_TOURNOI = [
    { key: 'details',   icon: 'fa-circle-info',    label: 'Fiche du tournoi', href: 'tournament-details.html' },
    { key: 'rankings',  icon: 'fa-ranking-star',   label: 'Classements',      href: 'rankings.html' },
    { key: 'rules',     icon: 'fa-scale-balanced', label: 'Règlement',        href: 'tournament-rules.html' },
    { key: 'stats',     icon: 'fa-chart-simple',   label: 'Stats joueurs',    href: 'player-stats.html' },
    { key: 'compare',   icon: 'fa-code-compare',   label: 'Comparer',         href: 'stats-compare.html' },
    { key: 'live',      icon: 'fa-tower-broadcast',label: 'Direct',           href: 'live-stream.html' }
];

// Réservé à l'organisateur du tournoi courant.
var NAV_ORGANISATEUR = [
    { key: 'manage',    icon: 'fa-sliders',        label: 'Gérer le tournoi', href: 'manage-tournament.html' },
    { key: 'invite',    icon: 'fa-user-plus',      label: 'Inviter',          href: 'invite-participants.html' },
    { key: 'report',    icon: 'fa-file-pen',       label: 'Feuille de match', href: 'match-report.html' },
    { key: 'export',    icon: 'fa-file-export',    label: 'Export feuilles',  href: 'match-report-export.html' },
    { key: 'payment',   icon: 'fa-credit-card',    label: 'Paiements',        href: 'payment.html' }
];

var NAV_AIDE = [
    { key: 'help',      icon: 'fa-circle-question', label: 'Aide',            href: 'help-tournament.html' }
];

// Retour vers le reste de la plateforme — chemins vérifiés.
var NAV_PLATEFORME = [
    { icon: 'fa-users',    label: 'Communauté',    href: '../community/feed.html' },
    { icon: 'fa-comments', label: 'Messagerie',    href: '../messagerie/conversation.html' },
    { icon: 'fa-eye',      label: 'Suivi tournoi', href: '../suivi-tournoi/suivi-tournoi.html' }
];


// ============================================================
//  2) TOUS LES SPORTS DU MODULE
// ------------------------------------------------------------
//  Référence unique, utilisée par la création de tournoi, la
//  composition d'équipe et la génération des matchs.
//
//  joueurs    : nombre de titulaires sur l'aire de jeu
//  remplacants: nombre de remplaçants usuels
//  periodes   : découpage du temps de jeu
//  nul        : le match nul est-il possible dans ce sport
//  terrain    : identifiant du tracé utilisé par la composition
// ============================================================
var SPORTS_GT = [
    { code: 'football',      label: 'Football',        joueurs: 11, remplacants: 7,  periodes: '2 x 45 min',      nul: true,  terrain: 'football' },
    { code: 'futsal',        label: 'Futsal',          joueurs: 5,  remplacants: 9,  periodes: '2 x 20 min',      nul: true,  terrain: 'futsal' },
    { code: 'basketball',    label: 'Basketball',      joueurs: 5,  remplacants: 7,  periodes: '4 x 10 min',      nul: false, terrain: 'basketball' },
    { code: 'handball',      label: 'Handball',        joueurs: 7,  remplacants: 7,  periodes: '2 x 30 min',      nul: true,  terrain: 'handball' },
    { code: 'volleyball',    label: 'Volleyball',      joueurs: 6,  remplacants: 6,  periodes: '3 à 5 sets',      nul: false, terrain: 'volleyball' },
    { code: 'rugby',         label: 'Rugby à XV',      joueurs: 15, remplacants: 8,  periodes: '2 x 40 min',      nul: true,  terrain: 'rugby' },
    { code: 'rugby7',        label: 'Rugby à VII',     joueurs: 7,  remplacants: 5,  periodes: '2 x 7 min',       nul: true,  terrain: 'rugby' },
    { code: 'tennis',        label: 'Tennis',          joueurs: 1,  remplacants: 0,  periodes: '3 à 5 sets',      nul: false, terrain: 'tennis' },
    { code: 'tennis_double', label: 'Tennis double',   joueurs: 2,  remplacants: 0,  periodes: '3 à 5 sets',      nul: false, terrain: 'tennis' },
    { code: 'athletisme',    label: 'Athlétisme',      joueurs: 1,  remplacants: 0,  periodes: 'épreuves',        nul: false, terrain: 'piste' },
    { code: 'natation',      label: 'Natation',        joueurs: 1,  remplacants: 0,  periodes: 'séries',          nul: false, terrain: 'bassin' },
    { code: 'cyclisme',      label: 'Cyclisme',        joueurs: 1,  remplacants: 0,  periodes: 'étapes',          nul: false, terrain: 'route' },
    { code: 'arts_martiaux', label: 'Arts martiaux',   joueurs: 1,  remplacants: 0,  periodes: 'reprises',        nul: false, terrain: 'tatami' },
    { code: 'petanque',      label: 'Pétanque',        joueurs: 3,  remplacants: 1,  periodes: 'en 13 points',    nul: false, terrain: 'terrain' },
    { code: 'esport',        label: 'E-sport',         joueurs: 5,  remplacants: 2,  periodes: 'manches',         nul: false, terrain: 'aucun' },
    { code: 'autre',         label: 'Autre sport',     joueurs: 11, remplacants: 7,  periodes: 'à définir',       nul: true,  terrain: 'generique' }
];

function getSportGT(code) {
    if (!code) return null;
    const c = String(code).toLowerCase().trim();
    return SPORTS_GT.find(s => s.code === c)
        || SPORTS_GT.find(s => s.label.toLowerCase() === c)
        || null;
}


// ============================================================
//  3) FORMATS DE TOURNOI
// ------------------------------------------------------------
//  Le format était stocké dans type_id, affiché… et ne produisait
//  rien : aucune génération de matchs n'existe dans le module.
//  Cette table décrit ce que chaque format doit produire, elle
//  sera consommée par le moteur de tournoi du bloc suivant.
// ============================================================
var FORMATS_GT = [
    { code: 'championnat',   label: 'Championnat (toutes rondes)', aller_retour: true,  poules: false, elimination: false },
    { code: 'championnat_a', label: 'Championnat (aller simple)',  aller_retour: false, poules: false, elimination: false },
    { code: 'elimination',   label: 'Élimination directe',         aller_retour: false, poules: false, elimination: true  },
    { code: 'elimination_ar',label: 'Élimination aller-retour',    aller_retour: true,  poules: false, elimination: true  },
    { code: 'poules',        label: 'Poules puis élimination',     aller_retour: false, poules: true,  elimination: true  },
    { code: 'poules_ar',     label: 'Poules A/R puis élimination', aller_retour: true,  poules: true,  elimination: true  },
    { code: 'suisse',        label: 'Système suisse',              aller_retour: false, poules: false, elimination: false }
];

function getFormatGT(code) {
    if (!code) return null;
    const c = String(code).toLowerCase().trim();
    return FORMATS_GT.find(f => f.code === c)
        || FORMATS_GT.find(f => f.label.toLowerCase() === c)
        || null;
}


// ============================================================
//  4) CONSTRUCTION DU MENU
// ============================================================
function navAttr(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function navLien(item, actif, tournoiId) {
    let href = item.href;
    if (tournoiId && NAV_TOURNOI.concat(NAV_ORGANISATEUR).some(i => i.href === item.href)) {
        href += (href.indexOf('?') === -1 ? '?' : '&') + 'id=' + encodeURIComponent(tournoiId);
    }
    return '<a href="' + navAttr(href) + '" class="nav-gt-link' + (actif ? ' active' : '') + '">'
         +     '<i class="fas ' + navAttr(item.icon) + '"></i>'
         +     '<span>' + navAttr(item.label) + '</span>'
         + '</a>';
}

function navBloc(titre, items, pageKey, tournoiId) {
    if (!items.length) return '';
    return '<div class="nav-gt-section">'
         +     '<div class="nav-gt-title">' + navAttr(titre) + '</div>'
         +     items.map(i => navLien(i, i.key === pageKey, tournoiId)).join('')
         + '</div>';
}

/**
 * Construit et injecte le menu.
 * @param {string} pageKey  clé de la page courante
 * @param {object} options  { tournamentId, isOwner }
 */
function renderNavGT(pageKey, options) {
    const o = options || {};

    // Le tournoi courant vient de l'URL, ou de la dernière page
    // consultée : le menu reste ainsi contextuel d'une page à
    // l'autre sans que l'utilisateur ait à le resélectionner.
    let tournoiId = o.tournamentId || null;
    if (!tournoiId && typeof getTournamentId === 'function') {
        tournoiId = getTournamentId();
    }
    if (tournoiId) {
        try { sessionStorage.setItem('gt_tournoi_courant', tournoiId); } catch (e) { /* navigation privée */ }
    } else {
        try { tournoiId = sessionStorage.getItem('gt_tournoi_courant'); } catch (e) { tournoiId = null; }
    }

    const cible = document.getElementById('navGT')
               || document.querySelector('.sidebar-menu')
               || document.querySelector('.sidebar-nav');
    if (!cible) return false;

    let html = navBloc('Général', NAV_GENERAL, pageKey, null);

    if (tournoiId) {
        html += navBloc('Tournoi en cours', NAV_TOURNOI, pageKey, tournoiId);
        if (o.isOwner) {
            html += navBloc('Organisation', NAV_ORGANISATEUR, pageKey, tournoiId);
        }
    }

    html += navBloc('Aide', NAV_AIDE, pageKey, null);
    html += navBloc('Plateforme', NAV_PLATEFORME, pageKey, null);

    html += '<div class="nav-gt-section">'
         +     '<a href="#" class="nav-gt-link nav-gt-logout" id="navGTLogout">'
         +         '<i class="fas fa-right-from-bracket"></i><span>Déconnexion</span>'
         +     '</a>'
         + '</div>';

    cible.innerHTML = html;

    const out = document.getElementById('navGTLogout');
    if (out) {
        out.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof logoutGT === 'function') logoutGT();
        });
    }
    return true;
}

/**
 * Réaffiche le menu en y ajoutant le bloc « Organisation »
 * une fois que la page a déterminé que l'utilisateur est bien
 * l'organisateur du tournoi.
 */
function refreshNavOwnerGT(pageKey, tournamentId, isOwner) {
    renderNavGT(pageKey, { tournamentId: tournamentId, isOwner: !!isOwner });
}


// ============================================================
//  5) EXPORTS
// ============================================================
window.NAV_GENERAL      = NAV_GENERAL;
window.NAV_TOURNOI      = NAV_TOURNOI;
window.NAV_ORGANISATEUR = NAV_ORGANISATEUR;
window.NAV_PLATEFORME   = NAV_PLATEFORME;
window.SPORTS_GT        = SPORTS_GT;
window.FORMATS_GT       = FORMATS_GT;
window.getSportGT       = getSportGT;
window.getFormatGT      = getFormatGT;
window.renderNavGT      = renderNavGT;
window.refreshNavOwnerGT = refreshNavOwnerGT;
