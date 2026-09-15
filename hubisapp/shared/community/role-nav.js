// ============================================================
//  HUBISOCCER — ROLE-NAV.JS
//  Navigation partagée de l'espace Communauté
// ------------------------------------------------------------
//  Ce fichier est LA SOURCE UNIQUE DE VÉRITÉ pour tous les liens
//  qui sortent de la communauté vers un espace privé de rôle.
//
//  Pourquoi ce fichier existe :
//  Chaque page de la communauté embarquait sa propre copie d'une
//  table « role_code -> tableau de bord ». Ces copies divergeaient
//  entre elles ET pointaient vers des dossiers qui n'existent pas
//  dans le dépôt (agent_fifa, academie_sportive, tennisman...),
//  ce qui provoquait des erreurs 404 sur le menu de chaque page.
//
//  Tous les chemins ci-dessous ont été vérifiés un par un contre
//  l'arborescence réelle du dépôt et alignés sur la table de
//  redirection officielle de hubisapp/authprive/users/login.html.
//
//  IMPORTANT — profondeur des chemins :
//  Ce fichier est chargé depuis hubisapp/shared/community/, donc
//     ../../   =  hubisapp/
//     ../      =  hubisapp/shared/
//  C'est exactement la même profondeur que authprive/users/,
//  les chemins de login.html sont donc réutilisables tels quels.
//
//  Rôles sans espace privé encore construit : ils ne renvoient
//  PLUS un 404 mais la page ../construction.html.
// ============================================================

'use strict';

// ========== DEBUT : PAGE DE REPLI ==========
// hubisapp/shared/construction.html — vérifié présent
const ROLE_FALLBACK = '../construction.html';
// ========== FIN : PAGE DE REPLI ==========


// ========== DEBUT : TABLE DES ESPACES PRIVÉS ==========
// base  : dossier du rôle, relatif à hubisapp/shared/community/
// home  : page d'accueil de l'espace (relative à base)
// label : nom affiché du rôle
// menu  : pages réellement présentes dans le dépôt
// ready : false => espace non construit, on bascule sur construction.html
const ROLE_SPACES = {

    // ---------- FOOTBALLEUR ----------
    'FOOT': {
        label: 'Footballeur',
        ready: true,
        base:  '../../footballeur/',
        home:  'dashboard/foot-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt',   label: 'Tableau de bord', href: 'dashboard/foot-dash.html' },
            { icon: 'fa-user-pen',         label: 'Mon profil',      href: 'profile-edit/foot-profile.html' },
            { icon: 'fa-file-lines',       label: 'Mon CV sportif',  href: 'edit-cv/foot-cv.html' },
            { icon: 'fa-video',            label: 'Mes vidéos',      href: 'videos/foot-videos.html' },
            { icon: 'fa-right-left',       label: 'Transferts',      href: 'transferts/foot-transfert.html' },
            { icon: 'fa-envelope-open-text', label: 'Invitations',   href: 'invitations/foot-invitations.html' },
            { icon: 'fa-binoculars',       label: 'Scouting',        href: 'scouting/foot-scout.html' },
            { icon: 'fa-certificate',      label: 'Certifications',  href: 'certifications/foot-certif.html' },
            { icon: 'fa-user-shield',      label: 'Vérification',    href: 'verification/foot-verif.html' },
            { icon: 'fa-sack-dollar',      label: 'Revenus',         href: 'revenus/foot-revenus.html' },
            { icon: 'fa-gear',             label: 'Paramètres',      href: 'settings/foot-settings.html' },
            { icon: 'fa-life-ring',        label: 'Support',         href: 'support/foot-supp.html' }
        ]
    },

    // ---------- ADMINISTRATION FOOTBALL ----------
    'FOOT_ADMIN': {
        label: 'Administration Football',
        ready: true,
        base:  '../../footballeur/admin-foot/',
        home:  'dashboard/admin-foot-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/admin-foot-dash.html' },
            { icon: 'fa-building-shield', label: 'Administration', href: 'administration-foot.html' },
            { icon: 'fa-file-lines',     label: 'CV',              href: 'cv/admin-foot-cv.html' },
            { icon: 'fa-video',          label: 'Vidéos',          href: 'videos/admin-foot-videos.html' },
            { icon: 'fa-right-left',     label: 'Transferts',      href: 'transferts/admin-foot-transferts.html' },
            { icon: 'fa-binoculars',     label: 'Scouting',        href: 'scouting/admin-foot-scout.html' },
            { icon: 'fa-certificate',    label: 'Certifications',  href: 'certifications/admin-foot-certif.html' },
            { icon: 'fa-user-shield',    label: 'Vérifications',   href: 'verifications/admin-foot-verif.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',         href: 'revenus/admin-foot-revenus.html' }
        ]
    },

    // ---------- BASKETTEUR ----------
    // Espace partiel : seuls le tableau de bord et les revenus existent.
    'BASK': {
        label: 'Basketteur',
        ready: true,
        base:  '../../basketteur/',
        home:  'dashboard/basket-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/basket-dash.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',         href: 'revenus/basket-revenus.html' }
        ]
    },

    // ---------- PARRAIN ----------
    'PARRAIN': {
        label: 'Parrain',
        ready: true,
        base:  '../../parrain/',
        home:  'dashboard/parrain-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/parrain-dash.html' },
            { icon: 'fa-user-pen',       label: 'Mon profil',      href: 'profile-edit/parrain-profile.html' },
            { icon: 'fa-file-lines',     label: 'Mon CV',          href: 'cv/parrain-cv.html' },
            { icon: 'fa-hand-holding-heart', label: 'Mes protégés', href: 'proteges/parrain-proteges.html' },
            { icon: 'fa-comments',       label: 'Mentorat',        href: 'mentorat/parrain-mentorat.html' },
            { icon: 'fa-chart-line',     label: 'Impact',          href: 'impact/parrain-impact.html' },
            { icon: 'fa-binoculars',     label: 'Scouting',        href: 'scouting/parrain-scouting.html' },
            { icon: 'fa-gift',           label: 'Dons',            href: 'dons/parrain-dons.html' },
            { icon: 'fa-certificate',    label: 'Certifications',  href: 'certifications/parrain-certif.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/parrain-verif.html' },
            { icon: 'fa-gear',           label: 'Paramètres',      href: 'settings/parrain-settings.html' },
            { icon: 'fa-life-ring',      label: 'Support',         href: 'support/parrain-supp.html' }
        ]
    },

    // ---------- ADMINISTRATION PARRAINAGE ----------
    'PARRAIN_ADMIN': {
        label: 'Administration Parrainage',
        ready: true,
        base:  '../../parrain/admin-parrain/',
        home:  'admin-parrain-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'admin-parrain-dash.html' },
            { icon: 'fa-file-lines',     label: 'CV',              href: 'cv/admin-parrain-cv.html' },
            { icon: 'fa-hand-holding-heart', label: 'Protégés',    href: 'proteges/admin-parrain-proteges.html' },
            { icon: 'fa-comments',       label: 'Mentorat',        href: 'mentorat/admin-parrain-mentorat.html' },
            { icon: 'fa-chart-line',     label: 'Impact',          href: 'impact/admin-parrain-impact.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/admin-parrain-verif.html' }
        ]
    },

    // ---------- AGENT ----------
    // Dossier réel : agent/  (et non agent_fifa/ comme écrit partout avant)
    'AGENT': {
        label: 'Agent',
        ready: true,
        base:  '../../agent/',
        home:  'dashboard/agent-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/agent-dash.html' },
            { icon: 'fa-user-pen',       label: 'Mon profil',      href: 'profile-edit/agent-profile.html' },
            { icon: 'fa-file-lines',     label: 'Mon CV',          href: 'cv/agent-cv.html' },
            { icon: 'fa-users',          label: 'Mes talents',     href: 'talents/agent-talents.html' },
            { icon: 'fa-binoculars',     label: 'Découvrir',       href: 'decouvrir/agent-decouvrir.html' },
            { icon: 'fa-file-signature', label: 'Contrats',        href: 'contrats/agent-contrats.html' },
            { icon: 'fa-percent',        label: 'Commissions',     href: 'commissions/agent-commissions.html' },
            { icon: 'fa-id-badge',       label: 'Licences',        href: 'licences/agent-licences.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/agent-verif.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',         href: 'revenus/agent-revenus.html' },
            { icon: 'fa-gear',           label: 'Paramètres',      href: 'settings/agent-settings.html' },
            { icon: 'fa-life-ring',      label: 'Support',         href: 'support/agent-supp.html' }
        ]
    },

    // ---------- COACH ----------
    'COACH': {
        label: 'Coach',
        ready: true,
        base:  '../../coach/',
        home:  'dashboard/coach-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord',  href: 'dashboard/coach-dash.html' },
            { icon: 'fa-file-lines',     label: 'Mon CV',           href: 'cv/coach-cv.html' },
            { icon: 'fa-users',          label: 'Mes talents',      href: 'talents/coach-talents.html' },
            { icon: 'fa-clipboard-check', label: 'Évaluations',     href: 'evaluations/coach-eval.html' },
            { icon: 'fa-film',           label: 'Analyse vidéo',    href: 'analyse/coach-video.html' },
            { icon: 'fa-calendar-days',  label: 'Planning',         href: 'planning/coach-planning.html' },
            { icon: 'fa-chart-simple',   label: 'Statistiques',     href: 'statistiques/coach-stats.html' },
            { icon: 'fa-thumbs-up',      label: 'Recommandations',  href: 'recommandations/coach-recos.html' },
            { icon: 'fa-briefcase',      label: 'Opportunités',     href: 'opportunites/coach-offres.html' },
            { icon: 'fa-graduation-cap', label: 'Triple projet',    href: 'triple-projet/coach-triple.html' },
            { icon: 'fa-id-badge',       label: 'Licences',         href: 'licences/coach-licences.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',     href: 'verification/coach-verif.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',          href: 'revenus/coach-revenus.html' },
            { icon: 'fa-life-ring',      label: 'Support',          href: 'support/coach-supp.html' }
        ]
    },

    // ---------- STAFF MÉDICAL ----------
    'MEDIC': {
        label: 'Staff médical',
        ready: true,
        base:  '../../staff_medical/',
        home:  'dashboard/staff-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/staff-dash.html' },
            { icon: 'fa-user-pen',       label: 'Mon profil',      href: 'profile-edit/staff-profile.html' },
            { icon: 'fa-file-lines',     label: 'Mon CV',          href: 'cv/staff-cv.html' },
            { icon: 'fa-users',          label: 'Athlètes suivis', href: 'athletes/staff-athletes.html' },
            { icon: 'fa-stethoscope',    label: 'Consultations',   href: 'consultations/staff-consultations.html' },
            { icon: 'fa-kit-medical',    label: 'Soins',           href: 'soins/staff-soins.html' },
            { icon: 'fa-bone',           label: 'Traumatologie',   href: 'traumatologie/staff-trauma.html' },
            { icon: 'fa-weight-scale',   label: 'Biométrie',       href: 'biometrie/staff-biometrie.html' },
            { icon: 'fa-spa',            label: 'Wellness',        href: 'wellness/staff-wellness.html' },
            { icon: 'fa-moon',           label: 'Sommeil',         href: 'sommeil/staff-sommeil.html' },
            { icon: 'fa-brain',          label: 'Mental',          href: 'mental/staff-mental.html' },
            { icon: 'fa-binoculars',     label: 'Scouting',        href: 'scouting/staff-scouting.html' },
            { icon: 'fa-certificate',    label: 'Certifications',  href: 'certifications/staff-certif.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/staff-verif.html' },
            { icon: 'fa-sack-dollar',    label: 'Honoraires',      href: 'honoraires/staff-honoraires.html' },
            { icon: 'fa-coins',          label: 'Revenus',         href: 'revenus/staff-revenus.html' },
            { icon: 'fa-gear',           label: 'Paramètres',      href: 'settings/staff-settings.html' },
            { icon: 'fa-life-ring',      label: 'Support',         href: 'support/staff-supp.html' }
        ]
    },

    // ---------- CORPS ARBITRAL ----------
    'ARBIT': {
        label: 'Corps arbitral',
        ready: true,
        base:  '../../corps_arbitral/',
        home:  'dashboard/arbitre-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/arbitre-dash.html' },
            { icon: 'fa-user-pen',       label: 'Mon profil',      href: 'profile-edit/arbitre-profile.html' },
            { icon: 'fa-file-lines',     label: 'Mon CV',          href: 'cv/arbitre-cv.html' },
            { icon: 'fa-flag',           label: 'Désignations',    href: 'designations/arbitre-designations.html' },
            { icon: 'fa-file-pen',       label: 'Rapports',        href: 'rapports/arbitre-rapports.html' },
            { icon: 'fa-clipboard-check', label: 'Évaluations',    href: 'evaluations/arbitre-evaluations.html' },
            { icon: 'fa-person-running', label: 'Fitness',         href: 'fitness/arbitre-fitness.html' },
            { icon: 'fa-graduation-cap', label: 'Formation',       href: 'formation/arbitre-formation.html' },
            { icon: 'fa-certificate',    label: 'Certifications',  href: 'certifications/arbitre-certif.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/arbitre-verif.html' },
            { icon: 'fa-money-bill-wave', label: 'Honoraires',     href: 'honoraires/arbitre-honoraires.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',         href: 'revenus/arbitre-revenus.html' },
            { icon: 'fa-gear',           label: 'Paramètres',      href: 'settings/arbitre-settings.html' },
            { icon: 'fa-life-ring',      label: 'Support',         href: 'support/arbitre-supp.html' }
        ]
    },

    // ---------- ACADÉMIE ----------
    'ACAD': {
        label: 'Académie sportive',
        ready: true,
        base:  '../../academie/',
        home:  'dashboard/academie-dash.html',
        menu: [
            { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: 'dashboard/academie-dash.html' },
            { icon: 'fa-file-lines',     label: 'CV académie',     href: 'cv/academie-cv.html' },
            { icon: 'fa-users',          label: 'Athlètes',        href: 'athletes/academie-athletes.html' },
            { icon: 'fa-chalkboard-user', label: 'Formateurs',     href: 'formateurs/academie-formateurs.html' },
            { icon: 'fa-list-check',     label: 'Programme',       href: 'programme/academie-prog.html' },
            { icon: 'fa-trophy',         label: 'Compétitions',    href: 'competitions/academie-compet.html' },
            { icon: 'fa-bullhorn',       label: 'Recrutement',     href: 'opportunites/academie-recrutement.html' },
            { icon: 'fa-chart-simple',   label: 'Statistiques',    href: 'stats/academie-stats.html' },
            { icon: 'fa-user-shield',    label: 'Vérification',    href: 'verification/academie-verif.html' },
            { icon: 'fa-sack-dollar',    label: 'Revenus',         href: 'revenus/academie-revenus.html' },
            { icon: 'fa-life-ring',      label: 'Support',         href: 'support/academie-supp.html' }
        ]
    },

    // ---------- GESTIONNAIRE DE TOURNOI ----------
    // Pas de dossier de rôle : l'espace est le module partagé gestion-tournoi
    'TOURN': {
        label: 'Gestionnaire de tournoi',
        ready: true,
        base:  '../gestion-tournoi/',
        home:  'acceuil.html',
        menu: [
            { icon: 'fa-house',          label: 'Accueil tournois',   href: 'acceuil.html' },
            { icon: 'fa-trophy',         label: 'Mes tournois',       href: 'my-tournaments.html' },
            { icon: 'fa-plus',           label: 'Créer un tournoi',   href: 'create-tournament.html' },
            { icon: 'fa-sliders',        label: 'Gérer un tournoi',   href: 'manage-tournament.html' },
            { icon: 'fa-user-plus',      label: 'Inviter',            href: 'invite-participants.html' },
            { icon: 'fa-people-group',   label: 'Mon équipe',         href: 'mon-equipe.html' },
            { icon: 'fa-clipboard-list', label: 'Mes inscriptions',   href: 'my-registrations.html' },
            { icon: 'fa-ranking-star',   label: 'Classements',        href: 'rankings.html' },
            { icon: 'fa-file-pen',       label: 'Feuilles de match',  href: 'match-report.html' },
            { icon: 'fa-chart-simple',   label: 'Statistiques footballeur', href: 'player-stats.html' },
            { icon: 'fa-tower-broadcast', label: 'Live',              href: 'live-stream.html' },
            { icon: 'fa-id-card',        label: 'Carte de tournoi',   href: 'carte-de-tournoi-choix.html' },
            { icon: 'fa-credit-card',    label: 'Paiement',           href: 'payment.html' },
            { icon: 'fa-circle-question', label: 'Aide',              href: 'help-tournament.html' }
        ]
    },

    // ---------- ADMINISTRATION GESTION TOURNOIS ----------
    // Chantier 09. Meme motif que FOOT_ADMIN et PARRAIN_ADMIN :
    // un dossier admin-* a l'interieur de l'espace concerne, une
    // page-portail, et les modules a la suite. Sans cette entree,
    // un compte TOURN_ADMIN existerait en base sans avoir le
    // moindre menu — le role serait invisible.
    //
    // base pointe dans le module partage, parce que c'est la que
    // vit l'administration des tournois : il n'y a pas de dossier
    // de role « tournoi », l'espace EST gestion-tournoi.
    'TOURN_ADMIN': {
        label: 'Administration Tournois',
        ready: true,
        base:  '../gestion-tournoi/admin-gt/',
        home:  'administration-gt.html',
        menu: [
            { icon: 'fa-building-shield', label: 'Administration',       href: 'administration-gt.html' },
            { icon: 'fa-file-contract',   label: 'Contrats & paiements', href: 'contrats-paiements/admin-gt-paiements.html' },
            { icon: 'fa-trophy',          label: 'Module tournois',      href: '../acceuil.html' }
        ]
    },

    // ---------- ADMINISTRATEUR PLATEFORME ----------
    'ADMIN': {
        label: 'Administration',
        ready: true,
        base:  '../../authprive/admin/',
        home:  'index.html',
        menu: [
            { icon: 'fa-chart-pie',      label: 'Tableau de bord', href: 'admin-dashboard.html' },
            { icon: 'fa-users-gear',     label: 'Utilisateurs',    href: 'admin-users.html' },
            { icon: 'fa-id-card',        label: 'Gestion des IDs', href: 'admin-ids.html' },
            { icon: 'fa-clipboard-list', label: 'Journaux',        href: 'admin-logs.html' }
        ]
    }
};
// ========== FIN : TABLE DES ESPACES PRIVÉS ==========


// ========== DEBUT : RÔLES SANS ESPACE PRIVÉ ==========
// Ces codes de rôle existent dans l'inscription mais leur dossier
// n'est pas encore présent dans le dépôt. Ils ne doivent PAS
// produire de 404 : on les envoie vers la page « en construction ».
const ROLE_PENDING = {
    'TENN':  'Tennisman',
    'ATHL':  'Athlète',
    'HANDB': 'Handballeur',
    'VOLL':  'Volleyeur',
    'RUGBY': 'Rugbyman',
    'NATA':  'Nageur',
    'ARTSM': 'Arts martiaux',
    'CYCL':  'Cycliste',
    'CHAN':  'Chanteur',
    'DANS':  'Danseur',
    'COMP':  'Compositeur',
    'ACIN':  'Acteur cinéma',
    'ATHE':  'Acteur théâtre',
    'HUMO':  'Humoriste',
    'SLAM':  'Slameur',
    'DJ':    'DJ / Producteur',
    'CIRQ':  'Artiste de cirque',
    'VISU':  'Artiste visuel',
    'FORM':  'Formateur'
};
// ========== FIN : RÔLES SANS ESPACE PRIVÉ ==========


// ========== DEBUT : NAVIGATION COMMUNE À LA COMMUNAUTÉ ==========
// Chemins relatifs à hubisapp/shared/community/ — tous vérifiés.
const COMMUNITY_NAV = [
    { icon: 'fa-house',          label: 'Fil d\'actualité', href: 'feed.html',           key: 'feed' },
    { icon: 'fa-magnifying-glass', label: 'Recherche',      href: 'search.html',         key: 'search' },
    { icon: 'fa-circle-play',    label: 'Stories',          href: 'stories.html',        key: 'stories' },
    { icon: 'fa-tower-broadcast', label: 'Lives',           href: 'live.html',           key: 'live' },
    { icon: 'fa-bell',           label: 'Notifications',    href: 'notifications.html',  key: 'notifications' },
    { icon: 'fa-user',           label: 'Mon profil',       href: 'profil-feed.html',    key: 'profil' },
    { icon: 'fa-gear',           label: 'Paramètres',       href: 'settings-feed.html',  key: 'settings' }
];

// Modules partagés atteignables depuis la communauté — vérifiés présents.
const COMMUNITY_MODULES = [
    { icon: 'fa-comments', label: 'Messagerie',     href: '../messagerie/conversation.html' },
    { icon: 'fa-trophy',   label: 'Tournois',       href: '../gestion-tournoi/acceuil.html' },
    { icon: 'fa-eye',      label: 'Suivi tournoi',  href: '../suivi-tournoi/suivi-tournoi.html' }
];

// Modules annoncés dans le menu mais dont la page n'existe pas encore.
// Ils pointent sur construction.html au lieu de renvoyer un 404.
const COMMUNITY_SOON = [
    { icon: 'fa-store',        label: 'HubiMarket',      href: ROLE_FALLBACK },
    { icon: 'fa-award',        label: 'HubiCertif',      href: ROLE_FALLBACK },
    { icon: 'fa-crown',        label: 'HubiAbonnement',  href: ROLE_FALLBACK }
];
// ========== FIN : NAVIGATION COMMUNE À LA COMMUNAUTÉ ==========


// ========== DEBUT : FONCTIONS PUBLIQUES ==========

/**
 * Normalise un code de rôle (tolère minuscules, espaces, valeur nulle).
 */
function normalizeRoleCode(roleCode) {
    if (!roleCode) return '';
    return String(roleCode).trim().toUpperCase();
}

/**
 * Renvoie l'objet espace privé d'un rôle, ou null s'il n'existe pas.
 */
function getRoleSpace(roleCode) {
    const code = normalizeRoleCode(roleCode);
    return ROLE_SPACES[code] || null;
}

/**
 * Libellé lisible du rôle. Ne renvoie jamais une chaîne vide.
 */
function getRoleLabel(roleCode) {
    const code = normalizeRoleCode(roleCode);
    if (ROLE_SPACES[code])  return ROLE_SPACES[code].label;
    if (ROLE_PENDING[code]) return ROLE_PENDING[code];
    return 'Membre HubISoccer';
}

/**
 * Lien vers l'accueil de l'espace privé du rôle.
 * Toujours un chemin qui existe : jamais de 404.
 */
function getRoleHome(roleCode) {
    const space = getRoleSpace(roleCode);
    if (!space || !space.ready) return ROLE_FALLBACK;
    return space.base + space.home;
}

/**
 * Menu complet de l'espace privé du rôle, avec chemins déjà résolus.
 * Renvoie un tableau vide si l'espace n'est pas construit.
 */
function getRoleMenu(roleCode) {
    const space = getRoleSpace(roleCode);
    if (!space || !space.ready) return [];
    return space.menu.map(item => ({
        icon:  item.icon,
        label: item.label,
        href:  space.base + item.href
    }));
}

/**
 * true si le rôle possède un espace privé réellement présent.
 */
function hasRoleSpace(roleCode) {
    const space = getRoleSpace(roleCode);
    return !!(space && space.ready);
}

/**
 * Échappement d'attribut local — role-nav.js doit rester utilisable
 * même si utils.js n'a pas encore été chargé.
 */
function rnAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Construit le HTML du bloc « Mon espace privé » pour la barre latérale.
 * @param {string} roleCode   code de rôle du profil courant
 * @param {string} activeHref lien à marquer comme actif (optionnel)
 */
function buildRoleSpaceHtml(roleCode, activeHref) {
    const label = getRoleLabel(roleCode);
    const menu  = getRoleMenu(roleCode);

    if (!menu.length) {
        // Espace non construit : on l'annonce clairement plutôt que
        // d'afficher des liens morts.
        return `
        <div class="rn-section">
            <div class="rn-title"><i class="fas fa-lock"></i> Mon espace privé</div>
            <div class="rn-pending">
                <strong>${rnAttr(label)}</strong>
                <span>Votre espace privé est en cours de construction.</span>
                <a href="${ROLE_FALLBACK}" class="rn-link"><i class="fas fa-circle-info"></i> En savoir plus</a>
            </div>
        </div>`;
    }

    const items = menu.map(item => {
        const active = (activeHref && item.href === activeHref) ? ' active' : '';
        return `<a href="${rnAttr(item.href)}" class="rn-link${active}">
                    <i class="fas ${rnAttr(item.icon)}"></i> ${rnAttr(item.label)}
                </a>`;
    }).join('');

    return `
    <div class="rn-section">
        <div class="rn-title"><i class="fas fa-briefcase"></i> ${rnAttr(label)}</div>
        ${items}
    </div>`;
}

/**
 * Construit le HTML du bloc de navigation de la communauté.
 * @param {string} activeKey clé de la page courante (feed, search, ...)
 */
function buildCommunityNavHtml(activeKey) {
    const main = COMMUNITY_NAV.map(item => {
        const active = (item.key === activeKey) ? ' active' : '';
        return `<a href="${rnAttr(item.href)}" class="rn-link${active}">
                    <i class="fas ${rnAttr(item.icon)}"></i> ${rnAttr(item.label)}
                </a>`;
    }).join('');

    const modules = COMMUNITY_MODULES.map(item =>
        `<a href="${rnAttr(item.href)}" class="rn-link">
             <i class="fas ${rnAttr(item.icon)}"></i> ${rnAttr(item.label)}
         </a>`).join('');

    const soon = COMMUNITY_SOON.map(item =>
        `<a href="${rnAttr(item.href)}" class="rn-link rn-soon">
             <i class="fas ${rnAttr(item.icon)}"></i> ${rnAttr(item.label)}
             <span class="rn-badge">bientôt</span>
         </a>`).join('');

    return `
    <div class="rn-section">
        <div class="rn-title"><i class="fas fa-users"></i> Communauté</div>
        ${main}
    </div>
    <div class="rn-section">
        <div class="rn-title"><i class="fas fa-cubes"></i> Modules</div>
        ${modules}
    </div>
    <div class="rn-section">
        <div class="rn-title"><i class="fas fa-rocket"></i> À venir</div>
        ${soon}
    </div>`;
}

/**
 * Injecte la barre latérale complète (communauté + espace privé).
 * @param {string|HTMLElement} target    id ou élément conteneur
 * @param {string} roleCode              code de rôle
 * @param {string} activeKey             page courante de la communauté
 */
function renderSidebarNav(target, roleCode, activeKey) {
    const el = (typeof target === 'string') ? document.getElementById(target) : target;
    if (!el) return false;
    el.innerHTML = buildCommunityNavHtml(activeKey) + buildRoleSpaceHtml(roleCode);
    return true;
}

/**
 * Applique le lien « retour à mon espace » sur les éléments courants
 * de l'en-tête : logo, entrée du menu déroulant, bouton de retour.
 * Chaque identifiant est optionnel : la fonction ne casse rien s'il
 * est absent de la page.
 */
function applyRoleLinks(roleCode, opts) {
    const home = getRoleHome(roleCode);
    const o = opts || {};

    const logoId  = o.logoId  || 'navLogo';
    const dashId  = o.dashId  || 'dropDashboard';
    const backId  = o.backId  || 'backToSpace';
    const labelId = o.labelId || 'roleLabel';

    const logo = document.getElementById(logoId);
    if (logo) {
        if (logo.tagName === 'A') logo.setAttribute('href', home);
        logo.style.cursor = 'pointer';
        logo.onclick = (e) => { e.preventDefault(); window.location.href = home; };
    }

    const dash = document.getElementById(dashId);
    if (dash) {
        if (dash.tagName === 'A') dash.setAttribute('href', home);
        else dash.onclick = () => { window.location.href = home; };
    }

    const back = document.getElementById(backId);
    if (back) {
        if (back.tagName === 'A') back.setAttribute('href', home);
        else back.onclick = () => { window.location.href = home; };
    }

    const lbl = document.getElementById(labelId);
    if (lbl) lbl.textContent = getRoleLabel(roleCode);

    return home;
}
// ========== FIN : FONCTIONS PUBLIQUES ==========


// ========== DEBUT : EXPORTS GLOBAUX ==========
window.ROLE_SPACES        = ROLE_SPACES;
window.ROLE_PENDING       = ROLE_PENDING;
window.ROLE_FALLBACK      = ROLE_FALLBACK;
window.COMMUNITY_NAV      = COMMUNITY_NAV;
window.COMMUNITY_MODULES  = COMMUNITY_MODULES;
window.COMMUNITY_SOON     = COMMUNITY_SOON;

window.normalizeRoleCode  = normalizeRoleCode;
window.getRoleSpace       = getRoleSpace;
window.getRoleLabel       = getRoleLabel;
window.getRoleHome        = getRoleHome;
window.getRoleMenu        = getRoleMenu;
window.hasRoleSpace       = hasRoleSpace;
window.buildRoleSpaceHtml = buildRoleSpaceHtml;
window.buildCommunityNavHtml = buildCommunityNavHtml;
window.renderSidebarNav   = renderSidebarNav;
window.applyRoleLinks     = applyRoleLinks;

// Compatibilité ascendante : les anciennes pages lisaient
// ROLE_DASHBOARD_MAP[code]. On le régénère à partir de la table
// vérifiée pour qu'aucun ancien appel ne renvoie un 404.
window.ROLE_DASHBOARD_MAP = (function () {
    const map = {};
    Object.keys(ROLE_SPACES).forEach(code => { map[code] = getRoleHome(code); });
    Object.keys(ROLE_PENDING).forEach(code => { map[code] = ROLE_FALLBACK; });
    return map;
})();
// ========== FIN : EXPORTS GLOBAUX ==========
