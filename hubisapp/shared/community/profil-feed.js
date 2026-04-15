// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 1/3 : Variables, constantes, session, menu latéral,
//              utilitaires URL, chargement profil, rendu en-tête
// ============================================================
//  Corrections incluses :
//  - Liens dropdown (Messages, Paramètres) pour tous rôles
//  - Statut en ligne (intervalle 60s)
//  - Fonction toggleFollow complète
//  - Lien paramètres unifié (settings-feed.html)
// ============================================================

'use strict';

// sb, currentUser, currentProfile sont déjà définis dans session.js

// ========== DEBUT : VARIABLES GLOBALES ==========
let profileData = null;
let profileHubisoccerId = null;
let isOwnProfile = false;
let isFollowing = false;
let posts = [];
let postOffset = 0;
const PAGE_SIZE = 12;
let hasMorePosts = false;
let activeTab = 'posts';
let mediaPage = 0;
const MEDIA_PAGE_SIZE = 20;
let hasMoreMedia = false;
let currentConfirmCallback = null;
let presenceInterval = null;            // pour le statut en ligne
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : CONSTANTES ROLES ET DASHBOARDS ==========
const ROLE_DASHBOARD_MAP = {
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'BASK': '../../basketteur/dashboard/basketteur-dash.html',
    'TENN': '../../tennisman/dashboard/tennisman-dash.html',
    'ATHL': '../../athlete/dashboard/athlete-dash.html',
    'HANDB': '../../handballeur/dashboard/handballeur-dash.html',
    'VOLL': '../../volleyeur/dashboard/volleyeur-dash.html',
    'RUGBY': '../../rugbyman/dashboard/rugbyman-dash.html',
    'NATA': '../../nageur/dashboard/nageur-dash.html',
    'ARTSM': '../../arts_martiaux/dashboard/arts_martiaux-dash.html',
    'CYCL': '../../cycliste/dashboard/cycliste-dash.html',
    'CHAN': '../../chanteur/dashboard/chanteur-dash.html',
    'DANS': '../../danseur/dashboard/danseur-dash.html',
    'COMP': '../../compositeur/dashboard/compositeur-dash.html',
    'ACIN': '../../acteur_cinema/dashboard/acteur_cinema-dash.html',
    'ATHE': '../../acteur_theatre/dashboard/acteur_theatre-dash.html',
    'HUMO': '../../humoriste/dashboard/humoriste-dash.html',
    'SLAM': '../../slameur/dashboard/slameur-dash.html',
    'DJ': '../../dj/dashboard/dj-dash.html',
    'CIRQ': '../../cirque/dashboard/cirque-dash.html',
    'VISU': '../../artiste_visuel/dashboard/artiste_visuel-dash.html',
    'PARRAIN': '../../parrain/dashboard/parrain-dash.html',
    'AGENT': '../../agent_fifa/dashboard/agent_fifa-dash.html',
    'COACH': '../../coach/dashboard/coach-dash.html',
    'MEDIC': '../../staff_medical/dashboard/staff_medical-dash.html',
    'ARBIT': '../../corps_arbitral/dashboard/corps_arbitral-dash.html',
    'ACAD': '../../academie_sportive/dashboard/academie_sportive-dash.html',
    'FORM': '../../formateur/dashboard/formateur-dash.html',
    'TOURN': '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html',
    'ADMIN': '../../authprive/admin/admin-dashboard.html'
};

const ALL_ROLES = [
    { code: 'FOOT', label: 'Footballeur', icon: '⚽' },
    { code: 'BASK', label: 'Basketteur', icon: '🏀' },
    { code: 'TENN', label: 'Tennisman', icon: '🎾' },
    { code: 'ATHL', label: 'Athlète', icon: '🏃' },
    { code: 'HANDB', label: 'Handballeur', icon: '🤾' },
    { code: 'VOLL', label: 'Volleyeur', icon: '🏐' },
    { code: 'RUGBY', label: 'Rugbyman', icon: '🏉' },
    { code: 'NATA', label: 'Nageur', icon: '🏊' },
    { code: 'ARTSM', label: 'Arts martiaux', icon: '🥋' },
    { code: 'CYCL', label: 'Cycliste', icon: '🚴' },
    { code: 'CHAN', label: 'Chanteur', icon: '🎤' },
    { code: 'DANS', label: 'Danseur', icon: '💃' },
    { code: 'COMP', label: 'Compositeur', icon: '🎼' },
    { code: 'ACIN', label: 'Acteur cinéma', icon: '🎬' },
    { code: 'ATHE', label: 'Acteur théâtre', icon: '🎭' },
    { code: 'HUMO', label: 'Humoriste', icon: '🎙️' },
    { code: 'SLAM', label: 'Slameur', icon: '🗣️' },
    { code: 'DJ', label: 'DJ / Producteur', icon: '🎧' },
    { code: 'CIRQ', label: 'Artiste de cirque', icon: '🤹' },
    { code: 'VISU', label: 'Artiste visuel', icon: '🎨' },
    { code: 'PARRAIN', label: 'Parrain', icon: '🤝' },
    { code: 'AGENT', label: 'Agent FIFA', icon: '💼' },
    { code: 'COACH', label: 'Coach', icon: '📋' },
    { code: 'MEDIC', label: 'Staff médical', icon: '⚕️' },
    { code: 'ARBIT', label: 'Corps arbitral', icon: '🏁' },
    { code: 'ACAD', label: 'Académie sportive', icon: '🏫' },
    { code: 'FORM', label: 'Formateur', icon: '🎓' },
    { code: 'TOURN', label: 'Gestionnaire tournoi', icon: '🏆' }
];
// ========== FIN : CONSTANTES ROLES ==========

// ========== DEBUT : SESSION ET AVATAR ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;

        document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');

        const dash = ROLE_DASHBOARD_MAP[currentProfile.role_code] || '../../index.html';
        document.getElementById('dropDashboard').href = dash;
        document.getElementById('navLogo').onclick = () => window.location.href = dash;
        
        // Liens dropdown universels (tous rôles)
        document.getElementById('dropProfile').href = `profil-feed.html?id=${currentProfile.hubisoccer_id}`;
        document.getElementById('dropMessages').href = '../messagerie/conversation.html';
        document.getElementById('dropSettings').href = 'settings-feed.html';

        buildSidebarMenu(currentProfile.role_code);
        return true;
    } catch (err) {
        toast('Erreur de session. Veuillez vous reconnecter.', 'error');
        setLoader(false);
        return false;
    }
}

function updateAvatarDisplay(avatarUrl, fullName, imgId, initialsId) {
    const img = document.getElementById(imgId);
    const initials = document.getElementById(initialsId);
    if (!img || !initials) return;
    const text = getInitials(fullName);
    if (avatarUrl && avatarUrl !== '') {
        img.src = avatarUrl;
        img.style.display = 'block';
        initials.style.display = 'none';
    } else {
        img.style.display = 'none';
        initials.style.display = 'flex';
        initials.textContent = text;
    }
}
// ========== FIN : SESSION ET AVATAR ==========

// ========== DEBUT : MENU LATERAL (28 ROLES COMPLET) ==========
function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    const titleEl = document.getElementById('sidebarRoleTitle');

    const menuConfig = {
        'FOOT': {
            title: 'Menu Footballeur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../footballeur/dashboard/foot-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../footballeur/verification/foot-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../footballeur/edit-cv/foot-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../footballeur/certifications/foot-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../footballeur/videos/foot-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../footballeur/revenus/foot-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../footballeur/support/foot-supp.html' }
            ]
        },
        'BASK': {
            title: 'Menu Basketteur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../basketteur/dashboard/basketteur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../basketteur/verification/basketteur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../basketteur/edit-cv/basketteur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../basketteur/certifications/basketteur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../basketteur/videos/basketteur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../basketteur/revenus/basketteur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../basketteur/support/basketteur-supp.html' }
            ]
        },
        'TENN': {
            title: 'Menu Tennisman',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../tennisman/dashboard/tennisman-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../tennisman/verification/tennisman-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../tennisman/edit-cv/tennisman-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../tennisman/certifications/tennisman-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../tennisman/videos/tennisman-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../tennisman/revenus/tennisman-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../tennisman/support/tennisman-supp.html' }
            ]
        },
        'ATHL': {
            title: 'Menu Athlète',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../athlete/dashboard/athlete-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../athlete/verification/athlete-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../athlete/edit-cv/athlete-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../athlete/certifications/athlete-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../athlete/videos/athlete-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../athlete/revenus/athlete-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../athlete/support/athlete-supp.html' }
            ]
        },
        'HANDB': {
            title: 'Menu Handballeur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../handballeur/dashboard/handballeur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../handballeur/verification/handballeur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../handballeur/edit-cv/handballeur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../handballeur/certifications/handballeur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../handballeur/videos/handballeur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../handballeur/revenus/handballeur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../handballeur/support/handballeur-supp.html' }
            ]
        },
        'VOLL': {
            title: 'Menu Volleyeur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../volleyeur/dashboard/volleyeur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../volleyeur/verification/volleyeur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../volleyeur/edit-cv/volleyeur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../volleyeur/certifications/volleyeur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../volleyeur/videos/volleyeur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../volleyeur/revenus/volleyeur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../volleyeur/support/volleyeur-supp.html' }
            ]
        },
        'RUGBY': {
            title: 'Menu Rugbyman',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../rugbyman/dashboard/rugbyman-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../rugbyman/verification/rugbyman-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../rugbyman/edit-cv/rugbyman-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../rugbyman/certifications/rugbyman-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../rugbyman/videos/rugbyman-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../rugbyman/revenus/rugbyman-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../rugbyman/support/rugbyman-supp.html' }
            ]
        },
        'NATA': {
            title: 'Menu Nageur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../nageur/dashboard/nageur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../nageur/verification/nageur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../nageur/edit-cv/nageur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../nageur/certifications/nageur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../nageur/videos/nageur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../nageur/revenus/nageur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../nageur/support/nageur-supp.html' }
            ]
        },
        'ARTSM': {
            title: 'Menu Arts Martiaux',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../arts_martiaux/dashboard/arts_martiaux-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../arts_martiaux/verification/arts_martiaux-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../arts_martiaux/edit-cv/arts_martiaux-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../arts_martiaux/certifications/arts_martiaux-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../arts_martiaux/videos/arts_martiaux-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../arts_martiaux/revenus/arts_martiaux-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../arts_martiaux/support/arts_martiaux-supp.html' }
            ]
        },
        'CYCL': {
            title: 'Menu Cycliste',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../cycliste/dashboard/cycliste-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../cycliste/verification/cycliste-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../cycliste/edit-cv/cycliste-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../cycliste/certifications/cycliste-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../cycliste/videos/cycliste-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../cycliste/revenus/cycliste-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../cycliste/support/cycliste-supp.html' }
            ]
        },
        'CHAN': {
            title: 'Menu Chanteur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../chanteur/dashboard/chanteur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../chanteur/verification/chanteur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../chanteur/edit-cv/chanteur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../chanteur/certifications/chanteur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../chanteur/videos/chanteur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../chanteur/revenus/chanteur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../chanteur/support/chanteur-supp.html' }
            ]
        },
        'DANS': {
            title: 'Menu Danseur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../danseur/dashboard/danseur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../danseur/verification/danseur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../danseur/edit-cv/danseur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../danseur/certifications/danseur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../danseur/videos/danseur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../danseur/revenus/danseur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../danseur/support/danseur-supp.html' }
            ]
        },
        'COMP': {
            title: 'Menu Compositeur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../compositeur/dashboard/compositeur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../compositeur/verification/compositeur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../compositeur/edit-cv/compositeur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../compositeur/certifications/compositeur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../compositeur/videos/compositeur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../compositeur/revenus/compositeur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../compositeur/support/compositeur-supp.html' }
            ]
        },
        'ACIN': {
            title: 'Menu Acteur Cinéma',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../acteur_cinema/dashboard/acteur_cinema-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../acteur_cinema/verification/acteur_cinema-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../acteur_cinema/edit-cv/acteur_cinema-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../acteur_cinema/certifications/acteur_cinema-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../acteur_cinema/videos/acteur_cinema-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../acteur_cinema/revenus/acteur_cinema-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../acteur_cinema/support/acteur_cinema-supp.html' }
            ]
        },
        'ATHE': {
            title: 'Menu Acteur Théâtre',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../acteur_theatre/dashboard/acteur_theatre-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../acteur_theatre/verification/acteur_theatre-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../acteur_theatre/edit-cv/acteur_theatre-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../acteur_theatre/certifications/acteur_theatre-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../acteur_theatre/videos/acteur_theatre-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../acteur_theatre/revenus/acteur_theatre-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../acteur_theatre/support/acteur_theatre-supp.html' }
            ]
        },
        'HUMO': {
            title: 'Menu Humoriste',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../humoriste/dashboard/humoriste-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../humoriste/verification/humoriste-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../humoriste/edit-cv/humoriste-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../humoriste/certifications/humoriste-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../humoriste/videos/humoriste-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../humoriste/revenus/humoriste-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../humoriste/support/humoriste-supp.html' }
            ]
        },
        'SLAM': {
            title: 'Menu Slameur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../slameur/dashboard/slameur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../slameur/verification/slameur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../slameur/edit-cv/slameur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../slameur/certifications/slameur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../slameur/videos/slameur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../slameur/revenus/slameur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../slameur/support/slameur-supp.html' }
            ]
        },
        'DJ': {
            title: 'Menu DJ',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../dj/dashboard/dj-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../dj/verification/dj-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../dj/edit-cv/dj-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../dj/certifications/dj-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../dj/videos/dj-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../dj/revenus/dj-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../dj/support/dj-supp.html' }
            ]
        },
        'CIRQ': {
            title: 'Menu Artiste de cirque',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../cirque/dashboard/cirque-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../cirque/verification/cirque-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../cirque/edit-cv/cirque-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../cirque/certifications/cirque-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../cirque/videos/cirque-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../cirque/revenus/cirque-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../cirque/support/cirque-supp.html' }
            ]
        },
        'VISU': {
            title: 'Menu Artiste visuel',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../artiste_visuel/dashboard/artiste_visuel-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../artiste_visuel/verification/artiste_visuel-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../artiste_visuel/edit-cv/artiste_visuel-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../artiste_visuel/certifications/artiste_visuel-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../artiste_visuel/videos/artiste_visuel-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../artiste_visuel/revenus/artiste_visuel-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../artiste_visuel/support/artiste_visuel-supp.html' }
            ]
        },
        'PARRAIN': {
            title: 'Menu Parrain',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../parrain/dashboard/parrain-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../parrain/verification/parrain-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../parrain/edit-cv/parrain-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../parrain/certifications/parrain-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../parrain/videos/parrain-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../parrain/revenus/parrain-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../parrain/support/parrain-supp.html' }
            ]
        },
        'AGENT': {
            title: 'Menu Agent FIFA',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../agent_fifa/dashboard/agent_fifa-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../agent_fifa/verification/agent_fifa-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../agent_fifa/edit-cv/agent_fifa-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../agent_fifa/certifications/agent_fifa-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../agent_fifa/videos/agent_fifa-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../agent_fifa/revenus/agent_fifa-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../agent_fifa/support/agent_fifa-supp.html' }
            ]
        },
        'COACH': {
            title: 'Menu Coach',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../coach/dashboard/coach-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../coach/verification/coach-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../coach/edit-cv/coach-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../coach/certifications/coach-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../coach/videos/coach-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../coach/revenus/coach-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../coach/support/coach-supp.html' }
            ]
        },
        'MEDIC': {
            title: 'Menu Staff médical',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../staff_medical/dashboard/staff_medical-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../staff_medical/verification/staff_medical-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../staff_medical/edit-cv/staff_medical-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../staff_medical/certifications/staff_medical-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../staff_medical/videos/staff_medical-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../staff_medical/revenus/staff_medical-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../staff_medical/support/staff_medical-supp.html' }
            ]
        },
        'ARBIT': {
            title: 'Menu Corps arbitral',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../corps_arbitral/dashboard/corps_arbitral-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../corps_arbitral/verification/corps_arbitral-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../corps_arbitral/edit-cv/corps_arbitral-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../corps_arbitral/certifications/corps_arbitral-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../corps_arbitral/videos/corps_arbitral-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../corps_arbitral/revenus/corps_arbitral-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../corps_arbitral/support/corps_arbitral-supp.html' }
            ]
        },
        'ACAD': {
            title: 'Menu Académie sportive',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../academie_sportive/dashboard/academie_sportive-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../academie_sportive/verification/academie_sportive-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../academie_sportive/edit-cv/academie_sportive-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../academie_sportive/certifications/academie_sportive-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../academie_sportive/videos/academie_sportive-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../academie_sportive/revenus/academie_sportive-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../academie_sportive/support/academie_sportive-supp.html' }
            ]
        },
        'FORM': {
            title: 'Menu Formateur',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../formateur/dashboard/formateur-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../formateur/verification/formateur-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../formateur/edit-cv/formateur-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../formateur/certifications/formateur-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../formateur/videos/formateur-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../formateur/revenus/formateur-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../formateur/support/formateur-supp.html' }
            ]
        },
        'TOURN': {
            title: 'Menu Gestionnaire tournoi',
            items: [
                { icon: 'fa-tachometer-alt', label: 'Tableau de bord', href: '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html' },
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html' },
                { icon: 'fa-shield-alt', label: 'Vérification', href: '../../gestionnaire_tournoi/verification/gestionnaire_tournoi-verif.html' },
                { icon: 'fa-file-alt', label: 'Mon CV Pro', href: '../../gestionnaire_tournoi/edit-cv/gestionnaire_tournoi-cv.html' },
                { icon: 'fa-certificate', label: 'Diplômes & Certifs', href: '../../gestionnaire_tournoi/certifications/gestionnaire_tournoi-certif.html' },
                { icon: 'fa-trophy', label: 'Suivi Tournoi', href: '../../shared/suivi-tournoi/suivi-tournoi.html' },
                { icon: 'fa-video', label: 'Mes Vidéos', href: '../../gestionnaire_tournoi/videos/gestionnaire_tournoi-videos.html' },
                { icon: 'fa-coins', label: 'Mes Revenus', href: '../../gestionnaire_tournoi/revenus/gestionnaire_tournoi-revenus.html' },
                { icon: 'fa-envelope', label: 'Messages', href: '../../shared/messagerie/conversation.html' },
                { icon: 'fa-headset', label: 'Support', href: '../../gestionnaire_tournoi/support/gestionnaire_tournoi-supp.html' }
            ]
        },
        'ADMIN': {
            title: 'Menu Admin',
            items: [
                { icon: 'fa-chart-pie', label: 'Dashboard', href: '../../authprive/admin/admin-dashboard.html' },
                { icon: 'fa-users', label: 'Communauté', href: 'feed.html' },
                { icon: 'fa-id-card', label: 'Gestion IDs', href: '../../authprive/admin/admin-ids.html' },
                { icon: 'fa-users-cog', label: 'Utilisateurs', href: '../../authprive/admin/admin-users.html' },
                { icon: 'fa-history', label: 'Logs', href: '../../authprive/admin/admin-logs.html' }
            ]
        }
    };

    const config = menuConfig[roleCode] || {
        title: 'Menu',
        items: [{ icon: 'fa-users', label: 'Communauté', href: 'feed.html' }]
    };

    titleEl.textContent = config.title;

    nav.innerHTML = config.items.map(item => `
        <a href="${item.href}">
            <i class="fas ${item.icon}"></i> ${item.label}
        </a>
    `).join('') + `
        <hr>
        <a href="#" id="sidebarLogout" style="color:var(--danger)"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>
    `;

    document.getElementById('sidebarLogout')?.addEventListener('click', logout);
}
// ========== FIN : MENU LATERAL ==========

// ========== DEBUT : UTILITAIRES URL ET CHARGEMENT PROFIL ==========
function getProfileIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id') || params.get('handle');
    if (id && id.startsWith('@')) id = id.substring(1);
    return id;
}

async function loadProfileData(identifier) {
    if (!identifier) {
        toast('Aucun profil spécifié', 'error');
        setLoader(false);
        return null;
    }

    setLoader(true, 'Chargement du profil...', 40);

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_communities')
            .select(`
                *,
                profiles:hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url, role_code,
                    bio, city, country, created_at,
                    height, weight, preferred_foot, club, position, nationality,
                    current_status, discipline, current_level, palmares, specialty,
                    current_diploma, school, schedule_accommodation, hard_skills, study_project,
                    interest_sectors, professional_experiences, soft_skills, availability,
                    certified, feed_id, community_avatar, community_cover, last_seen
                )
            `)
            .or(`hubisoccer_id.eq.${identifier},feed_id.eq.${identifier}`)
            .single();

        if (error || !data) {
            setLoader(false);
            toast('Profil introuvable', 'error');
            document.querySelector('.profile-main').innerHTML = `
                <div class="c-empty">
                    <div class="c-empty-icon"><i class="fas fa-user-slash"></i></div>
                    <h3>Profil introuvable</h3>
                    <p>Cet utilisateur n'existe pas ou a supprimé son compte.</p>
                </div>
            `;
            return null;
        }

        profileData = data;
        profileHubisoccerId = data.hubisoccer_id;
        isOwnProfile = (profileHubisoccerId === currentProfile?.hubisoccer_id);

        if (data.profiles?.last_seen) {
            const lastSeen = new Date(data.profiles.last_seen);
            const now = new Date();
            const diffMinutes = (now - lastSeen) / (1000 * 60);
            if (diffMinutes < 5) {
                document.getElementById('onlineIndicator').style.display = 'block';
            }
        }

        if (!isOwnProfile) {
            await sb.from('supabaseAuthPrive_profile_views').upsert({
                profile_hubisoccer_id: profileHubisoccerId,
                viewer_hubisoccer_id: currentProfile.hubisoccer_id,
                viewed_at: new Date().toISOString()
            }, { onConflict: 'profile_hubisoccer_id,viewer_hubisoccer_id' });
        }

        if (!isOwnProfile) {
            const { data: follow } = await sb
                .from('supabaseAuthPrive_follows')
                .select('*')
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('following_hubisoccer_id', profileHubisoccerId)
                .maybeSingle();
            isFollowing = !!follow;
        }

        renderProfileHeader();
        renderAboutSections();
        updateFollowButton();
        await loadProfileStories();
        await loadSuggestions();
        setLoader(false);
        return data;
    } catch (err) {
        setLoader(false);
        toast('Erreur lors du chargement : ' + err.message, 'error');
        return null;
    }
}
// ========== FIN : CHARGEMENT PROFIL ==========

// ========== DEBUT : RENDU EN-TETE ==========
function renderProfileHeader() {
    const comm = profileData;
    const prof = profileData.profiles || {};

    const coverUrl = comm.cover_url || prof.community_cover || '';
    const avatarUrl = comm.avatar_url || prof.community_avatar || prof.avatar_url || '';

    const coverEl = document.getElementById('profileCover');
    if (coverUrl) {
        coverEl.style.backgroundImage = `url(${coverUrl})`;
    } else {
        coverEl.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
    }
    coverEl.onclick = () => openLightbox(coverUrl || '');

    const avatarImg = document.getElementById('profileAvatar');
    const avatarInitials = document.getElementById('profileAvatarInitials');
    const name = comm.name || prof.full_name || prof.display_name || 'Utilisateur';

    if (avatarUrl && avatarUrl !== '') {
        avatarImg.src = avatarUrl;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarInitials.style.display = 'flex';
        avatarInitials.textContent = getInitials(name);
    }
    avatarImg.onclick = () => openLightbox(avatarUrl || '');
    avatarInitials.onclick = () => openLightbox(avatarUrl || '');

    document.getElementById('profileName').textContent = name;
    document.getElementById('profileHandle').textContent = '@' + (comm.feed_id || '');
    document.getElementById('profileBio').textContent = comm.bio || prof.bio || 'Aucune bio.';
    document.getElementById('profileLocation').textContent = comm.country || prof.country || 'Non spécifié';
    document.getElementById('profileJoined').textContent = new Date(comm.created_at || prof.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById('profileFollowers').textContent = comm.followers_count || 0;
    document.getElementById('profileFollowing').textContent = comm.following_count || 0;
    document.getElementById('profilePosts').textContent = comm.posts_count || 0;

    if (prof.certified) {
        document.getElementById('profileCertified').style.display = 'flex';
    }

    document.title = `${name} | HubISoccer`;
}
// ========== FIN : RENDU EN-TETE ==========

// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 2/3 : Boutons, toggleFollow, sections, stories,
//              lightbox, suggestions, onglets
// ============================================================

// ========== DEBUT : BOUTONS D'ACTION ==========
function updateFollowButton() {
    const actionsDiv = document.getElementById('profileActions');

    if (isOwnProfile) {
        actionsDiv.innerHTML = `
            <button class="btn-outline" id="editProfileBtn"><i class="fas fa-pen"></i> Modifier le profil</button>
            <button class="btn-outline" id="shareProfileBtn"><i class="fas fa-share-alt"></i> Partager</button>
            <a href="settings-feed.html" class="btn-ghost"><i class="fas fa-cog"></i></a>
        `;
        document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
        document.getElementById('shareProfileBtn').addEventListener('click', () => openModal('modalShare'));
    } else {
        const followText = isFollowing ? 'Abonné' : 'S\'abonner';
        const followIcon = isFollowing ? 'fa-user-check' : 'fa-user-plus';
        actionsDiv.innerHTML = `
            <button class="btn-primary" id="followBtn">
                <i class="fas ${followIcon}"></i> ${followText}
            </button>
            <a href="../messagerie/conversation.html?to=${profileHubisoccerId}" class="btn-outline">
                <i class="fas fa-envelope"></i> Message
            </a>
            <button class="btn-outline" id="shareProfileBtn"><i class="fas fa-share-alt"></i></button>
            <button class="btn-ghost" id="reportProfileBtn" title="Signaler"><i class="fas fa-flag"></i></button>
            <button class="btn-ghost" id="blockBtn" title="Bloquer"><i class="fas fa-ban"></i></button>
        `;
        document.getElementById('followBtn').addEventListener('click', toggleFollow);
        document.getElementById('shareProfileBtn').addEventListener('click', () => openModal('modalShare'));
        document.getElementById('reportProfileBtn').addEventListener('click', () => openModal('modalReport'));
        document.getElementById('blockBtn').addEventListener('click', () => {
            showConfirmModal(
                'Bloquer cet utilisateur ?',
                'Vous ne verrez plus son contenu et il ne pourra plus interagir avec vous.',
                blockUser
            );
        });
    }
}

async function toggleFollow() {
    if (!currentProfile) return;
    const btn = document.getElementById('followBtn');
    btn.disabled = true;

    try {
        if (isFollowing) {
            // ----- UNFOLLOW -----
            await sb.from('supabaseAuthPrive_follows')
                .delete()
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('following_hubisoccer_id', profileHubisoccerId);
            isFollowing = false;

            // Décrémenter following_count de l'utilisateur courant
            const { data: myComm } = await sb
                .from('supabaseAuthPrive_communities')
                .select('following_count')
                .eq('hubisoccer_id', currentProfile.hubisoccer_id)
                .single();
            await sb.from('supabaseAuthPrive_communities')
                .update({ following_count: Math.max(0, (myComm?.following_count || 0) - 1) })
                .eq('hubisoccer_id', currentProfile.hubisoccer_id);

            // Décrémenter followers_count du profil visité
            const { data: targetComm } = await sb
                .from('supabaseAuthPrive_communities')
                .select('followers_count')
                .eq('hubisoccer_id', profileHubisoccerId)
                .single();
            await sb.from('supabaseAuthPrive_communities')
                .update({ followers_count: Math.max(0, (targetComm?.followers_count || 0) - 1) })
                .eq('hubisoccer_id', profileHubisoccerId);

            toast('Vous n\'êtes plus abonné', 'info');
        } else {
            // ----- FOLLOW -----
            await sb.from('supabaseAuthPrive_follows').insert({
                follower_hubisoccer_id: currentProfile.hubisoccer_id,
                following_hubisoccer_id: profileHubisoccerId
            });
            isFollowing = true;

            // Incrémenter following_count de l'utilisateur courant
            const { data: myComm } = await sb
                .from('supabaseAuthPrive_communities')
                .select('following_count')
                .eq('hubisoccer_id', currentProfile.hubisoccer_id)
                .single();
            await sb.from('supabaseAuthPrive_communities')
                .update({ following_count: (myComm?.following_count || 0) + 1 })
                .eq('hubisoccer_id', currentProfile.hubisoccer_id);

            // Incrémenter followers_count du profil visité
            const { data: targetComm } = await sb
                .from('supabaseAuthPrive_communities')
                .select('followers_count')
                .eq('hubisoccer_id', profileHubisoccerId)
                .single();
            await sb.from('supabaseAuthPrive_communities')
                .update({ followers_count: (targetComm?.followers_count || 0) + 1 })
                .eq('hubisoccer_id', profileHubisoccerId);

            // Notification
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: profileHubisoccerId,
                type: 'follow',
                title: 'Nouvel abonné',
                message: `${currentProfile.full_name || currentProfile.display_name} s'est abonné à votre communauté.`,
                data: { link: `profil-feed.html?id=${currentProfile.hubisoccer_id}` }
            });

            toast('Abonné !', 'success');
        }

        // Rafraîchir l'affichage des compteurs
        const { data: updatedMy } = await sb
            .from('supabaseAuthPrive_communities')
            .select('following_count')
            .eq('hubisoccer_id', currentProfile.hubisoccer_id)
            .single();
        if (updatedMy && isOwnProfile) {
            document.getElementById('profileFollowing').textContent = updatedMy.following_count;
        }

        const { data: updatedTarget } = await sb
            .from('supabaseAuthPrive_communities')
            .select('followers_count, following_count')
            .eq('hubisoccer_id', profileHubisoccerId)
            .single();
        if (updatedTarget) {
            document.getElementById('profileFollowers').textContent = updatedTarget.followers_count || 0;
            document.getElementById('profileFollowing').textContent = updatedTarget.following_count || 0;
        }

        updateFollowButton();
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function blockUser() {
    try {
        await sb.from('supabaseAuthPrive_blocked_users').insert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            blocked_hubisoccer_id: profileHubisoccerId
        });
        toast('Utilisateur bloqué', 'success');
        setTimeout(() => { window.location.href = 'feed.html'; }, 1500);
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
}
// ========== FIN : BOUTONS D'ACTION ==========

// ========== DEBUT : SECTIONS À PROPOS ==========
function renderAboutSections() {
    const prof = profileData.profiles || {};
    const comm = profileData;

    const identityHtml = `
        <div class="about-item"><span>Nom complet</span><span>${escapeHtml(prof.full_name || prof.display_name || '—')}</span></div>
        <div class="about-item"><span>Pseudo</span><span>${escapeHtml(prof.pseudo || '—')}</span></div>
        <div class="about-item"><span>Bio</span><span>${escapeHtml(comm.bio || prof.bio || '—')}</span></div>
        <div class="about-item"><span>Pays</span><span>${escapeHtml(comm.country || prof.country || '—')}</span></div>
        <div class="about-item"><span>Statut</span><span>${escapeHtml(prof.current_status || '—')}</span></div>
    `;
    document.getElementById('aboutIdentity').innerHTML = identityHtml;

    const sportHtml = `
        <div class="about-item"><span>Discipline</span><span>${escapeHtml(prof.discipline || 'Football')}</span></div>
        <div class="about-item"><span>Niveau</span><span>${escapeHtml(prof.current_level || '—')}</span></div>
        <div class="about-item"><span>Taille / Poids</span><span>${prof.height || '—'} cm / ${prof.weight || '—'} kg</span></div>
        <div class="about-item"><span>Pied préféré</span><span>${prof.preferred_foot || '—'}</span></div>
        <div class="about-item"><span>Club</span><span>${escapeHtml(prof.club || '—')}</span></div>
        <div class="about-item"><span>Poste</span><span>${escapeHtml(prof.position || '—')}</span></div>
        <div class="about-item"><span>Palmarès</span><span>${escapeHtml(prof.palmares || '—')}</span></div>
    `;
    document.getElementById('aboutSport').innerHTML = sportHtml;

    const studiesHtml = `
        <div class="about-item"><span>Diplôme en cours</span><span>${escapeHtml(prof.current_diploma || '—')}</span></div>
        <div class="about-item"><span>Établissement</span><span>${escapeHtml(prof.school || '—')}</span></div>
        <div class="about-item"><span>Aménagement</span><span>${prof.schedule_accommodation ? 'Oui' : 'Non'}</span></div>
        <div class="about-item"><span>Compétences</span><span>${escapeHtml(prof.hard_skills || '—')}</span></div>
        <div class="about-item"><span>Projet d'étude</span><span>${escapeHtml(prof.study_project || '—')}</span></div>
    `;
    document.getElementById('aboutStudies').innerHTML = studiesHtml;

    const careerHtml = `
        <div class="about-item"><span>Secteurs d'intérêt</span><span>${escapeHtml(prof.interest_sectors || '—')}</span></div>
        <div class="about-item"><span>Expériences</span><span>${escapeHtml(prof.professional_experiences || '—')}</span></div>
        <div class="about-item"><span>Soft skills</span><span>${escapeHtml(prof.soft_skills || '—')}</span></div>
        <div class="about-item"><span>Disponibilités</span><span>${escapeHtml(prof.availability || '—')}</span></div>
    `;
    document.getElementById('aboutCareer').innerHTML = careerHtml;

    const helpHtml = `
        <div class="about-item"><span>Je peux aider</span><span>${escapeHtml(prof.help_offer || '—')}</span></div>
        <div class="about-item"><span>J'ai besoin d'aide</span><span>${escapeHtml(prof.help_need || '—')}</span></div>
        <div class="about-item"><span>Objectifs réseau</span><span>${escapeHtml(prof.network_goals || '—')}</span></div>
    `;
    document.getElementById('aboutHelp').innerHTML = helpHtml;
}
// ========== FIN : SECTIONS À PROPOS ==========

// ========== DEBUT : STORIES DE L'UTILISATEUR ==========
async function loadProfileStories() {
    if (isOwnProfile) {
        document.getElementById('profileStoriesSection').style.display = 'none';
        return;
    }

    const { data: stories } = await sb
        .from('supabaseAuthPrive_stories')
        .select('*')
        .eq('user_hubisoccer_id', profileHubisoccerId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (!stories || stories.length === 0) {
        document.getElementById('profileStoriesSection').style.display = 'none';
        return;
    }

    document.getElementById('profileStoriesSection').style.display = 'block';
    document.getElementById('storyOwnerName').textContent = profileData.name || profileData.profiles?.full_name || 'cet utilisateur';

    const container = document.getElementById('profileStoriesContainer');
    container.innerHTML = stories.map(story => makeStoryItem(story)).join('');

    container.querySelectorAll('.story-item').forEach((el, index) => {
        el.addEventListener('click', () => viewStory(stories[index].id));
    });
}

function makeStoryItem(story) {
    const name = profileData.name || profileData.profiles?.full_name || 'Utilisateur';
    const avatar = profileData.avatar_url || profileData.profiles?.community_avatar || profileData.profiles?.avatar_url;
    const initials = getInitials(name);
    let preview = '';

    if (story.media_type === 'text') {
        preview = `<div class="story-ring-text" style="background:${story.text_bg || 'var(--primary)'}">${initials}</div>`;
    } else if (story.media_type === 'video') {
        preview = `<div class="story-ring-video" style="background:#1a1a2e;"><i class="fas fa-video" style="font-size:24px;color:white;"></i></div>`;
    } else {
        preview = `<img src="${story.media_url}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="story-ring-text" style="display:none; background:var(--primary);">${initials}</div>`;
    }

    return `
        <div class="story-item" data-story-id="${story.id}">
            <div class="story-ring">${preview}</div>
            <span>${timeSince(story.created_at)}</span>
        </div>
    `;
}

function viewStory(storyId) {
    window.location.href = `stories.html?user=${profileHubisoccerId}&story=${storyId}`;
}
// ========== FIN : STORIES ==========

// ========== DEBUT : LIGHTBOX (agrandissement images) ==========
function openLightbox(imageUrl) {
    if (!imageUrl) {
        toast('Aucune image à afficher', 'info');
        return;
    }
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImage');
    img.src = imageUrl;
    modal.style.display = 'flex';

    const closeBtn = document.getElementById('lightboxClose');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}
// ========== FIN : LIGHTBOX ==========

// ========== DEBUT : SUGGESTIONS DE COMMUNAUTÉS ==========
async function loadSuggestions() {
    const container = document.getElementById('suggestionsList');
    if (!container) return;
    if (isOwnProfile) {
        document.getElementById('profileSuggestions').style.display = 'none';
        return;
    }

    const { data: following } = await sb
        .from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const followingIds = (following || []).map(f => f.following_hubisoccer_id);
    const exclude = [currentProfile.hubisoccer_id, profileHubisoccerId, ...followingIds];

    const { data: blocked } = await sb
        .from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const blockedIds = (blocked || []).map(b => b.blocked_hubisoccer_id);
    exclude.push(...blockedIds);

    let query = sb
        .from('supabaseAuthPrive_communities')
        .select(`
            *,
            profiles:hubisoccer_id(role_code, certified, avatar_url)
        `)
        .not('hubisoccer_id', 'in', `(${exclude.join(',')})`)
        .limit(6);

    if (profileData.sport) {
        query = query.eq('sport', profileData.sport);
    } else if (profileData.country) {
        query = query.eq('country', profileData.country);
    }

    const { data: suggestions } = await query;

    if (!suggestions || suggestions.length === 0) {
        document.getElementById('profileSuggestions').style.display = 'none';
        return;
    }

    document.getElementById('profileSuggestions').style.display = 'block';
    renderSuggestions(suggestions);
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    container.innerHTML = suggestions.map(comm => {
        const name = comm.name || 'Communauté';
        const avatar = comm.avatar_url || comm.profiles?.avatar_url || '';
        const role = comm.profiles?.role_code
            ? ALL_ROLES.find(r => r.code === comm.profiles.role_code)?.label || ''
            : '';
        return `
            <div class="suggestion-card" onclick="window.location.href='profil-feed.html?id=${comm.hubisoccer_id}'">
                <img src="${avatar || '../../img/user-default.jpg'}" alt="${escapeHtml(name)}">
                <div class="suggestion-info">
                    <div class="suggestion-name">${escapeHtml(name)}</div>
                    <div class="suggestion-role">${escapeHtml(role)}</div>
                </div>
                <button class="suggestion-follow-btn" onclick="event.stopPropagation(); followSuggestion('${comm.hubisoccer_id}', this)">
                    Suivre
                </button>
            </div>
        `;
    }).join('');
}

window.followSuggestion = async function(userId, btn) {
    try {
        await sb.from('supabaseAuthPrive_follows').insert({
            follower_hubisoccer_id: currentProfile.hubisoccer_id,
            following_hubisoccer_id: userId
        });
        btn.textContent = 'Abonné';
        btn.classList.add('following');
        toast('Abonné !', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
};

document.getElementById('refreshSuggestionsBtn')?.addEventListener('click', () => loadSuggestions());
// ========== FIN : SUGGESTIONS ==========

// ========== DEBUT : GESTION DES ONGLETS ==========
function initTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            activeTab = tabId;

            if (tabId === 'posts' && posts.length === 0) {
                loadPosts(true);
            } else if (tabId === 'media') {
                loadMedia('image', true);
            } else if (tabId === 'videos') {
                loadMedia('video', true);
            }
        });
    });

    document.getElementById('statFollowers').addEventListener('click', () => openFollowModal('followers'));
    document.getElementById('statFollowing').addEventListener('click', () => openFollowModal('following'));
}
// ========== FIN : GESTION DES ONGLETS ==========

// ============================================================
//  HUBISOCCER — PROFIL-FEED.JS (VERSION CORRIGÉE – COMPLÈTE)
//  PARTIE 3/3 : Posts, médias, modales, initialisation,
//              statut en ligne, fin du fichier
// ============================================================

// ========== DEBUT : CHARGEMENT ET RENDU DES POSTS ==========
async function loadPosts(reset = false) {
    if (reset) {
        postOffset = 0;
        posts = [];
    }

    setLoader(true, 'Chargement des publications...', 70);

    try {
        let query = sb
            .from('supabaseAuthPrive_posts')
            .select(`
                *,
                author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, feed_id, certified),
                community:supabaseAuthPrive_communities!community_id(name, feed_id, avatar_url)
            `)
            .eq('author_hubisoccer_id', profileHubisoccerId)
            .eq('is_scheduled', false)
            .order('created_at', { ascending: false })
            .range(postOffset, postOffset + PAGE_SIZE - 1);

        const { data, error } = await query;
        if (error) throw error;

        hasMorePosts = data.length === PAGE_SIZE;
        postOffset += data.length;

        if (reset) posts = data;
        else posts = [...posts, ...data];

        renderPostsGrid();
        document.getElementById('loadMorePostsWrap').style.display = hasMorePosts ? 'block' : 'none';
    } catch (err) {
        toast('Erreur chargement posts : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}

function renderPostsGrid() {
    const grid = document.getElementById('profilePostsGrid');
    if (posts.length === 0) {
        grid.innerHTML = '<div class="c-empty"><p>Aucune publication</p></div>';
        return;
    }

    grid.innerHTML = posts.map(post => {
        const media = post.media_url
            ? (post.media_type === 'video'
                ? `<video src="${post.media_url}" muted></video>`
                : `<img src="${post.media_url}" alt="">`)
            : '';

        return `
            <div class="post-card" data-post-id="${post.id}" onclick="openPost('${post.id}')">
                ${media ? `<div class="post-media-thumb">${media}</div>` : ''}
                <div class="post-content-preview">${escapeHtml(post.content?.substring(0, 120) || '')}</div>
                <div class="post-stats">
                    <span><i class="far fa-heart"></i> ${post.likes_count || 0}</span>
                    <span><i class="far fa-comment"></i> ${post.comments_count || 0}</span>
                    <span><i class="fas fa-share"></i> ${post.shares_count || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

function openPost(postId) {
    // Redirection vers la page de détail du post (si elle existe)
    window.location.href = `post-view.html?id=${postId}`;
}
window.openPost = openPost;
// ========== FIN : POSTS ==========

// ========== DEBUT : CHARGEMENT ET RENDU DES MÉDIAS ==========
async function loadMedia(type, reset = false) {
    if (reset) {
        mediaPage = 0;
    }

    const grid = type === 'image' ? document.getElementById('photosGrid') : document.getElementById('videosGrid');
    grid.innerHTML = '<div class="c-spinner" style="margin:20px auto;"></div>';

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_posts')
            .select('id, media_url, media_type, created_at')
            .eq('author_hubisoccer_id', profileHubisoccerId)
            .eq('media_type', type)
            .order('created_at', { ascending: false })
            .range(mediaPage * MEDIA_PAGE_SIZE, (mediaPage + 1) * MEDIA_PAGE_SIZE - 1);

        if (error) throw error;

        hasMoreMedia = data.length === MEDIA_PAGE_SIZE;

        if (reset) {
            grid.innerHTML = '';
        } else {
            grid.innerHTML = grid.innerHTML.replace('<div class="c-spinner" style="margin:20px auto;"></div>', '');
        }

        if (data.length === 0 && reset) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--gray);">Aucun média</p>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'media-item';
            div.onclick = () => openPost(item.id);
            if (type === 'image') {
                div.innerHTML = `<img src="${item.media_url}" alt="" loading="lazy">`;
            } else {
                div.innerHTML = `<video src="${item.media_url}" muted></video>`;
            }
            grid.appendChild(div);
        });

        if (hasMoreMedia) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn-ghost';
            loadMoreBtn.style.gridColumn = '1 / -1';
            loadMoreBtn.style.margin = '20px auto';
            loadMoreBtn.innerHTML = '<i class="fas fa-arrow-down"></i> Charger plus';
            loadMoreBtn.onclick = () => { mediaPage++; loadMedia(type, false); };
            grid.appendChild(loadMoreBtn);
        }
    } catch (err) {
        toast('Erreur chargement médias : ' + err.message, 'error');
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:20px; color:var(--danger);">Erreur de chargement</p>';
    }
}
// ========== FIN : MÉDIAS ==========

// ========== DEBUT : MODALES FOLLOWERS / FOLLOWING ==========
async function openFollowModal(type) {
    const modal = document.getElementById('modalFollowers');
    const title = document.getElementById('followModalTitle');
    const list = document.getElementById('followList');

    title.textContent = type === 'followers' ? 'Abonnés' : 'Abonnements';
    list.innerHTML = '<div class="c-spinner" style="margin:20px auto;"></div>';
    openModal('modalFollowers');

    const column = type === 'followers' ? 'follower_hubisoccer_id' : 'following_hubisoccer_id';
    const selectField = type === 'followers' ? 'follower' : 'following';

    try {
        const { data, error } = await sb
            .from('supabaseAuthPrive_follows')
            .select(`
                ${selectField}:supabaseAuthPrive_profiles!${column}(
                    hubisoccer_id, full_name, display_name, avatar_url, feed_id, certified
                )
            `)
            .eq(type === 'followers' ? 'following_hubisoccer_id' : 'follower_hubisoccer_id', profileHubisoccerId)
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<li style="padding:16px; color:var(--gray); text-align:center;">Aucun résultat</li>';
            return;
        }

        list.innerHTML = data.map(item => {
            const user = item[selectField] || {};
            const name = user.full_name || user.display_name || 'Utilisateur';
            const avatar = user.avatar_url || '';
            const initials = getInitials(name);
            const certified = user.certified ? '<i class="fas fa-check-circle" style="color:var(--primary); margin-left:4px;"></i>' : '';

            return `
                <li class="users-list-item" onclick="window.location.href='profil-feed.html?id=${user.hubisoccer_id}'">
                    ${avatar ? `<img src="${avatar}" alt="">` : `<div class="user-avatar-placeholder">${initials}</div>`}
                    <span class="users-list-item-name">${escapeHtml(name)}${certified}</span>
                    <span class="users-list-item-handle">@${escapeHtml(user.feed_id || '')}</span>
                </li>
            `;
        }).join('');
    } catch (err) {
        toast('Erreur chargement liste : ' + err.message, 'error');
        list.innerHTML = '<li style="padding:16px; color:var(--danger);">Erreur de chargement</li>';
    }
}
// ========== FIN : MODALES FOLLOWERS ==========

// ========== DEBUT : MODALE ÉDITION PROFIL ==========
function openEditProfileModal() {
    const comm = profileData;
    document.getElementById('editCommName').value = comm.name || '';
    document.getElementById('editCommBio').value = comm.bio || '';
    document.getElementById('editCommSpecialty').value = comm.specialty || '';
    document.getElementById('editCommWebsite').value = comm.website || '';
    openModal('modalEditProfile');
}

async function saveProfile() {
    const name = document.getElementById('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    const specialty = document.getElementById('editCommSpecialty').value.trim();
    const website = document.getElementById('editCommWebsite').value.trim();

    if (!name) {
        toast('Le nom est requis', 'warning');
        return;
    }

    setLoader(true, 'Mise à jour...', 80);
    try {
        await sb.from('supabaseAuthPrive_communities')
            .update({ name, bio, specialty, website })
            .eq('hubisoccer_id', profileHubisoccerId);

        profileData.name = name;
        profileData.bio = bio;
        profileData.specialty = specialty;
        profileData.website = website;

        renderProfileHeader();
        renderAboutSections();
        closeModal('modalEditProfile');
        toast('Profil mis à jour', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    } finally {
        setLoader(false);
    }
}
// ========== FIN : MODALE ÉDITION PROFIL ==========

// ========== DEBUT : SIGNALEMENT ==========
async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) {
        toast('Veuillez indiquer une raison', 'warning');
        return;
    }

    try {
        await sb.from('supabaseAuthPrive_reports').insert({
            reporter_hubisoccer_id: currentProfile.hubisoccer_id,
            reported_hubisoccer_id: profileHubisoccerId,
            reason: reason,
            type: 'profile'
        });
        closeModal('modalReport');
        toast('Signalement envoyé. Merci.', 'success');
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
    }
}
// ========== FIN : SIGNALEMENT ==========

// ========== DEBUT : CONFIRMATION PERSONNALISÉE ==========
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = message;
    currentConfirmCallback = callback;
    openModal('modalConfirm');
}
// ========== FIN : CONFIRMATION ==========

// ========== DEBUT : PARTAGE ==========
function shareProfile(network) {
    const url = window.location.href;
    const name = profileData.name || profileData.profiles?.full_name || 'Profil HubISoccer';
    const text = `Découvrez ${name} sur HubISoccer !`;

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    if (network === 'copy') {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
        closeModal('modalShare');
    } else {
        window.open(shareUrls[network], '_blank');
        closeModal('modalShare');
    }
}
// ========== FIN : PARTAGE ==========

// ========== DEBUT : STATUT EN LIGNE (INTERVALLE 60s) ==========
function startPresenceUpdates() {
    if (presenceInterval) clearInterval(presenceInterval);
    
    const updateLastSeen = async () => {
        if (!currentProfile?.hubisoccer_id) return;
        try {
            await sb.from('supabaseAuthPrive_profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('hubisoccer_id', currentProfile.hubisoccer_id);
        } catch (err) {
            // Silencieux, ne pas perturber l'utilisateur
            console.warn('Erreur mise à jour last_seen:', err);
        }
    };
    
    updateLastSeen(); // première mise à jour immédiate
    presenceInterval = setInterval(updateLastSeen, 60000); // toutes les 60 secondes
}

function stopPresenceUpdates() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}
// ========== FIN : STATUT EN LIGNE ==========

// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Vérification de votre session...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;

    const identifier = getProfileIdFromUrl();
    if (!identifier) {
        toast('Profil non spécifié', 'error');
        setLoader(false);
        return;
    }

    await loadProfileData(identifier);
    if (!profileData) return;

    // Démarrer les mises à jour du statut en ligne
    startPresenceUpdates();

    initTabs();
    await loadPosts(true);

    // Écouteurs d'événements globaux
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    const closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => {
        document.getElementById('userDropdown')?.classList.remove('show');
    });

    document.getElementById('dropLogout').addEventListener('click', () => {
        stopPresenceUpdates();
        logout();
    });

    // Nettoyer l'intervalle lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', stopPresenceUpdates);

    document.getElementById('loadMorePostsBtn')?.addEventListener('click', () => loadPosts(false));

    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);

    document.getElementById('submitReportBtn')?.addEventListener('click', submitReport);

    document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback();
            currentConfirmCallback = null;
        }
        closeModal('modalConfirm');
    });

    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => shareProfile(btn.dataset.network));
    });

    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) closeModal(m.id);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('lightboxModal').style.display = 'none';
        }
    });

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========

// ============================================================
//  FIN DU FICHIER PROFIL-FEED.JS
// ============================================================