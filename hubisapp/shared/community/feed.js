//  HUBISOCCER — FEED.JS (VERSION FINALE – TOUTES ERREURS 400 CORRIGÉES)
'use strict';
// ========== DEBUT : VARIABLES GLOBALES ==========
let myCommunity = null;
let posts = [];
let likedPosts = new Set();
let dislikedPosts = new Set();
let savedPosts = new Set();
let hiddenPosts = new Set();
let blockedUsers = new Set();
let activeFilter = 'all';
let activeRoleFilter = 'all';
let searchQuery = '';
let newPostsCount = 0;
let postOffset = 0;
const PAGE_SIZE = 20;
let hasMorePosts = false;
let loadingPosts = false;
let mediaFile = null;
let commentMediaFile = null;
let commentAudioFile = null;
let storyUploadFile = null;
let storyTextBg = 'linear-gradient(135deg,#551B8C,#3d1266)';
let pendingPoll = null;
let pendingEvent = null;
let scheduledAt = null;
let currentReportPostId = null;
let currentBlockUserId = null;
let currentSharePostId = null;
let replyCommentId = null;
let replyPostId = null;
let pinPostActive = false;
let feedSubscription = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let mentionTargetInput = null;
let mentionDropdown = null;
let mentionsCache = [];
let lastMentionsFetch = 0;
const MENTIONS_CACHE_TTL = 120000;
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
    const auth = await requireAuth();
    if (!auth) return false;

    document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
    updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name);

    const dash = ROLE_DASHBOARD_MAP[currentProfile.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;

    buildSidebarMenu(currentProfile.role_code);
    return true;
}

function updateAvatarDisplay(avatarUrl, fullName) {
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const publishAvatar = document.getElementById('publishAvatar');
    const publishInitials = document.getElementById('publishAvatarInitials');
    const storyAddAvatar = document.getElementById('storyAddAvatar');
    const storyAddInitials = document.getElementById('storyAddAvatarInitials');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarInitials = document.getElementById('sidebarAvatarInitials');

    const initials = getInitials(fullName);

    const apply = (img, init, url) => {
        if (url) {
            img.src = url;
            img.style.display = 'block';
            init.style.display = 'none';
        } else {
            img.style.display = 'none';
            init.style.display = 'flex';
            init.textContent = initials;
        }
    };

    apply(userAvatar, userInitials, avatarUrl);
    apply(publishAvatar, publishInitials, avatarUrl);
    apply(storyAddAvatar, storyAddInitials, avatarUrl);
    apply(sidebarAvatar, sidebarInitials, avatarUrl);
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Ma Communauté', href: 'feed.html', active: true },
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
                { icon: 'fa-users', label: 'Communauté', href: 'feed.html', active: true },
                { icon: 'fa-id-card', label: 'Gestion IDs', href: '../../authprive/admin/admin-ids.html' },
                { icon: 'fa-users-cog', label: 'Utilisateurs', href: '../../authprive/admin/admin-users.html' },
                { icon: 'fa-history', label: 'Logs', href: '../../authprive/admin/admin-logs.html' }
            ]
        }
    };

    const config = menuConfig[roleCode] || {
        title: 'Menu',
        items: [{ icon: 'fa-users', label: 'Communauté', href: 'feed.html', active: true }]
    };

    titleEl.textContent = config.title;

    nav.innerHTML = config.items.map(item => `
        <a href="${item.href}" class="${item.active ? 'active' : ''}">
            <i class="fas ${item.icon}"></i> ${item.label}
        </a>
    `).join('') + `
        <hr>
        <a href="stories.html"><i class="fas fa-smile"></i> Stories</a>
        <a href="live.html"><i class="fas fa-broadcast-tower"></i> Lives</a>
        <a href="search.html"><i class="fas fa-search"></i> Recherche</a>
        <a href="notifications.html"><i class="fas fa-bell"></i> Notifications</a>
        <hr>
        <a href="#" id="sidebarCollections"><i class="fas fa-bookmark"></i> Collections</a>
        <a href="#" id="sidebarHiddenPosts"><i class="fas fa-eye-slash"></i> Masqués</a>
        <a href="#" id="sidebarBlockedUsers"><i class="fas fa-ban"></i> Bloqués</a>
        <hr>
        <a href="#" id="sidebarLogout" style="color:var(--danger)">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
        </a>
    `;

    document.getElementById('sidebarLogout')?.addEventListener('click', logout);
    document.getElementById('sidebarCollections')?.addEventListener('click', e => { e.preventDefault(); openModal('modalCollections'); loadCollections(); });
    document.getElementById('sidebarHiddenPosts')?.addEventListener('click', e => { e.preventDefault(); openModal('modalHiddenPosts'); loadHiddenPosts(); });
    document.getElementById('sidebarBlockedUsers')?.addEventListener('click', e => { e.preventDefault(); openModal('modalBlockedUsers'); loadBlockedUsers(); });
}
// ========== FIN : MENU LATERAL ==========
// ========== DEBUT : CHARGEMENT DE LA COMMUNAUTE ==========
async function loadMyCommunity() {
    const { data, error } = await sb
        .from('supabaseAuthPrive_communities')
        .select('*')
        .eq('hubisoccer_id', currentProfile.hubisoccer_id)
        .maybeSingle();

    if (error || !data) {
        window.location.href = 'feed-setup.html';
        return null;
    }
    myCommunity = data;

    const cover = document.getElementById('myCommCover');
    if (data.cover_url) cover.style.background = `url(${data.cover_url}) center/cover`;

    const commAvatar = document.getElementById('myCommAvatar');
    const commInitials = document.getElementById('myCommAvatarInitials');
    if (data.avatar_url) {
        commAvatar.src = data.avatar_url;
        commAvatar.style.display = 'block';
        commInitials.style.display = 'none';
    } else {
        commAvatar.style.display = 'none';
        commInitials.style.display = 'flex';
        commInitials.textContent = getInitials(data.name || 'Ma Communauté');
    }

    document.getElementById('myCommName').textContent = data.name || 'Ma Communauté';
    document.getElementById('myCommHandle').textContent = '@' + (data.feed_id || '');
    document.getElementById('myCommFollowers').textContent = data.followers_count || 0;
    document.getElementById('myCommFollowing').textContent = data.following_count || 0;
    document.getElementById('myCommPosts').textContent = data.posts_count || 0;

    document.getElementById('presTitle').textContent = data.name || 'Ma Communauté';
    document.getElementById('presDescription').textContent = data.bio || 'Partagez et interagissez avec les sportifs, artistes et acteurs de la communauté HubISoccer.';

    const sidebarCover = document.getElementById('sidebarCoverClick');
    if (data.cover_url) sidebarCover.style.backgroundImage = `url(${data.cover_url})`;

    document.getElementById('statFollowers').addEventListener('click', () => openFollowersModal('followers'));
    document.getElementById('statFollowing').addEventListener('click', () => openFollowersModal('following'));

    return data;
}
// ========== FIN : CHARGEMENT DE LA COMMUNAUTE ==========
// ========== DEBUT : CHARGEMENT DES POSTS ==========
async function loadPosts(reset = false) {
    if (loadingPosts) return;
    loadingPosts = true;

    let feedSkeletonEl = document.getElementById('feedSkeleton');
    const postsFeedEl = document.getElementById('postsFeed');

    if (!feedSkeletonEl && postsFeedEl) {
        feedSkeletonEl = document.createElement('div');
        feedSkeletonEl.id = 'feedSkeleton';
        feedSkeletonEl.innerHTML = `
            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>
        `;
        postsFeedEl.innerHTML = '';
        postsFeedEl.appendChild(feedSkeletonEl);
    }

    if (reset) {
        postOffset = 0;
        posts = [];
        if (postsFeedEl) postsFeedEl.innerHTML = '';
        feedSkeletonEl = document.getElementById('feedSkeleton');
        if (feedSkeletonEl) feedSkeletonEl.style.display = 'block';
    }

    try {
        let query = sb.from('supabaseAuthPrive_posts')
            .select(`
                *,
                author:supabaseAuthPrive_profiles!author_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url, role_code, feed_id, certified),
                community:supabaseAuthPrive_communities!community_id(name, feed_id, avatar_url)
            `)
            .eq('is_scheduled', false)
            .order('created_at', { ascending: false })
            .range(postOffset, postOffset + PAGE_SIZE - 1);

        if (activeFilter === 'following') {
            const { data: follows } = await sb
                .from('supabaseAuthPrive_follows')
                .select('following_hubisoccer_id')
                .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
            const ids = (follows || []).map(f => f.following_hubisoccer_id);
            if (ids.length) {
                query = query.in('author_hubisoccer_id', ids);
            } else {
                posts = [];
                renderPosts();
                loadingPosts = false;
                return;
            }
        }
        if (activeFilter === 'saved') {
            const savedArray = Array.from(savedPosts);
            if (savedArray.length) {
                query = query.in('id', savedArray);
            } else {
                posts = [];
                renderPosts();
                loadingPosts = false;
                return;
            }
        }
        if (activeFilter === 'media') query = query.not('media_url', 'is', null);
        if (activeFilter === 'polls') query = query.not('poll_data', 'is', null);
        if (activeRoleFilter !== 'all') query = query.eq('author.role_code', activeRoleFilter);
        if (searchQuery) query = query.ilike('content', '%' + searchQuery + '%');

        const { data, error } = await query;
        if (error) throw error;

        hasMorePosts = data.length === PAGE_SIZE;
        postOffset += data.length;

        if (reset) posts = data || [];
        else posts = [...posts, ...(data || [])];

        renderPosts();
        const loadMoreWrapEl = document.getElementById('loadMoreWrap');
        if (loadMoreWrapEl) loadMoreWrapEl.style.display = hasMorePosts ? 'block' : 'none';
    } catch (err) {
        console.error('Erreur chargement posts:', err);
        toast('Erreur chargement des posts', 'error');
    } finally {
        loadingPosts = false;
        const finalFeedSkeleton = document.getElementById('feedSkeleton');
        if (finalFeedSkeleton) finalFeedSkeleton.style.display = 'none';
    }
}
// ========== FIN : CHARGEMENT DES POSTS ==========
// ========== DEBUT : RENDU DES POSTS ==========
function renderPosts() {
    const feed = document.getElementById('postsFeed');
    if (posts.length === 0) {
        feed.innerHTML = `
            <div class="c-empty">
                <div class="c-empty-icon"><i class="fas fa-stream"></i></div>
                <h3>Aucune publication</h3>
                <p>Sois le premier à publier dans ta communauté !</p>
            </div>
        `;
        return;
    }
    feed.innerHTML = posts.map(p => makePostCard(p)).join('');
    attachPostEvents();
}

function makePostCard(post) {
    const isOwn = post.author_hubisoccer_id === currentProfile.hubisoccer_id;
    const liked = likedPosts.has(post.id);
    const disliked = dislikedPosts.has(post.id);
    const saved = savedPosts.has(post.id);
    const author = post.author || {};
    const community = post.community || {};

    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorHandle = author.feed_id ? '@' + author.feed_id : '';
    const authorRole = author.role_code || '';
    const certified = author.certified ? '<i class="fas fa-check-circle" style="color:var(--primary);margin-left:4px;"></i>' : '';

    const authorInitials = getInitials(authorName);
    const authorAvatarHtml = author.avatar_url
        ? `<img class="post-avatar" src="${author.avatar_url}" alt="" onclick="openUserProfile('${post.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="post-avatar-initials" onclick="openUserProfile('${post.author_hubisoccer_id}')">${authorInitials}</div>`;

    let mediaHtml = '';
    if (post.media_url) {
        if (post.media_type === 'video') {
            mediaHtml = `<div class="post-media"><video src="${post.media_url}" controls preload="metadata"></video></div>`;
        } else {
            mediaHtml = `<div class="post-media"><img src="${post.media_url}" alt="Media" loading="lazy" onclick="openMediaModal('${post.media_url}','image')"></div>`;
        }
    }

    let pollHtml = '';
    if (post.poll_data) {
        const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
        const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);
        const hasVoted = poll.voted_by?.includes(currentProfile.hubisoccer_id);
        pollHtml = `
            <div class="post-poll">
                <div class="poll-question">${escapeHtml(poll.question)}</div>
                ${poll.options.map((opt, i) => {
                    const votes = poll.votes?.[i] || 0;
                    const pct = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
                    return `
                        <div class="poll-option${hasVoted ? ' voted' : ''}" data-post-id="${post.id}" data-option="${i}">
                            <div class="poll-bar" style="width:${hasVoted ? pct : 0}%"></div>
                            <span class="poll-option-text">${escapeHtml(opt)}</span>
                            ${hasVoted ? `<span class="poll-pct">${pct}%</span>` : ''}
                        </div>
                    `;
                }).join('')}
                <div class="poll-meta">
                    <i class="fas fa-users"></i> ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }

    let eventHtml = '';
    if (post.event_data) {
        const evt = typeof post.event_data === 'string' ? JSON.parse(post.event_data) : post.event_data;
        const d = new Date(evt.date);
        eventHtml = `
            <div class="post-event">
                <div class="event-card">
                    <div class="event-date-block">
                        <div class="event-day">${d.getDate()}</div>
                        <div class="event-month">${d.toLocaleString('fr-FR', { month: 'short' })}</div>
                    </div>
                    <div class="event-info">
                        <h4>${escapeHtml(evt.title)}</h4>
                        <div class="event-meta">
                            <span><i class="fas fa-clock"></i>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ${evt.location ? `<span><i class="fas fa-map-marker-alt"></i>${escapeHtml(evt.location)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const content = post.content || '';
    const long = content.length > 280;

    return `
    <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
            ${authorAvatarHtml}
            <div class="post-meta">
                <div class="post-author" onclick="openUserProfile('${post.author_hubisoccer_id}')">
                    ${escapeHtml(authorName)}${certified}
                </div>
                <div class="post-author-sub">
                    ${authorRole ? `<span class="post-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    ${authorHandle ? `<span>${authorHandle}</span>` : ''}
                    <span class="post-time">${timeSince(post.created_at)}</span>
                    ${post.pinned ? `<span class="post-pinned-icon"><i class="fas fa-thumbtack"></i></span>` : ''}
                </div>
            </div>
            <div class="post-menu-wrap">
                <button class="post-menu-btn" onclick="togglePostMenu(this, '${post.id}', ${isOwn})">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="post-dropdown" id="menu_${post.id}">
                    ${isOwn ? `<button class="post-drop-item" onclick="editPost('${post.id}')"><i class="fas fa-pen"></i> Modifier</button>` : ''}
                    ${isOwn ? `<button class="post-drop-item danger" onclick="deletePost('${post.id}')"><i class="fas fa-trash-alt"></i> Supprimer</button>` : ''}
                    <button class="post-drop-item" onclick="openShareModal('${post.id}')"><i class="fas fa-share-alt"></i> Partager</button>
                    ${!isOwn ? `<button class="post-drop-item danger" onclick="openReportModal('${post.id}')"><i class="fas fa-flag"></i> Signaler</button>` : ''}
                    ${!isOwn ? `<button class="post-drop-item danger" onclick="openBlockModal('${post.author_hubisoccer_id}')"><i class="fas fa-ban"></i> Bloquer</button>` : ''}
                    <button class="post-drop-item" onclick="hidePost('${post.id}')"><i class="fas fa-eye-slash"></i> Masquer</button>
                </div>
            </div>
        </div>

        <div class="post-body">
            ${content ? `
                <div class="post-text ${long ? 'collapsed' : ''}" id="txt_${post.id}">
                    ${formatText(content)}
                </div>
                ${long ? `<button class="post-see-more-btn" onclick="expandPost('${post.id}')" style="margin-top:8px; padding:6px 12px; background:var(--primary); color:white; border:none; border-radius:20px; font-size:0.8rem; font-weight:600; cursor:pointer;">Voir plus</button>` : ''}
            ` : ''}
        </div>

        ${mediaHtml}
        ${pollHtml}
        ${eventHtml}

        <div class="post-actions">
            <button class="post-action ${liked ? 'liked' : ''}" onclick="toggleLike('${post.id}', this)">
                <i class="fa${liked ? 's' : 'r'} fa-heart action-icon"></i>
                <span class="post-action-count" id="likeCount_${post.id}">${post.likes_count || 0}</span>
            </button>
            <button class="post-action ${disliked ? 'disliked' : ''}" onclick="toggleDislike('${post.id}', this)">
                <i class="fa${disliked ? 's' : 'r'} fa-heart-broken action-icon"></i>
                <span class="post-action-count" id="dislikeCount_${post.id}">${post.dislikes_count || 0}</span>
            </button>
            <button class="post-action" onclick="toggleComments('${post.id}', this)">
                <i class="far fa-comment action-icon"></i>
                <span class="post-action-count">${post.comments_count || 0}</span>
            </button>
            <button class="post-action" onclick="repostPost('${post.id}')">
                <i class="fas fa-retweet action-icon"></i>
                <span class="post-action-count" id="repostCount_${post.id}">${post.reposts_count || 0}</span>
            </button>
            <button class="post-action" onclick="openShareModal('${post.id}')">
                <i class="fas fa-share action-icon"></i>
                <span class="post-action-count">${post.shares_count || 0}</span>
            </button>
            <button class="post-action ${saved ? 'saved' : ''}" onclick="toggleSave('${post.id}', this)" title="Enregistrer">
                <i class="fa${saved ? 's' : 'r'} fa-bookmark action-icon"></i>
            </button>
        </div>

        <div class="post-comments" id="comments_${post.id}" style="display:none"></div>
    </div>`;
}

function attachPostEvents() {
    document.querySelectorAll('.poll-option:not(.voted)').forEach(opt => {
        opt.addEventListener('click', () => votePoll(opt.dataset.postId, parseInt(opt.dataset.option)));
    });
}
// ========== FIN : RENDU DES POSTS ==========
// ========== DEBUT : INTERACTIONS POSTS (LIKE, DISLIKE, SAVE, REPOST) ==========
async function toggleLike(postId, btn) {
    const isLiked = likedPosts.has(postId);
    const post = posts.find(p => String(p.id) === String(postId));
    const countEl = document.getElementById(`likeCount_${postId}`);

    if (isLiked) {
        likedPosts.delete(postId);
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart action-icon';
        if (post) post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_likes').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        likedPosts.add(postId);
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart action-icon';
        if (post) post.likes_count = (post.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_likes').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubisoccer_id,
                type: 'like',
                title: 'Nouveau J\'aime',
                message: `${currentProfile.full_name || currentProfile.display_name} a aimé votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }
    }
    if (countEl) countEl.textContent = post?.likes_count || 0;
    await sb.from('supabaseAuthPrive_posts').update({ likes_count: post?.likes_count || 0 }).eq('id', postId);
}

async function toggleDislike(postId, btn) {
    const isDisliked = dislikedPosts.has(postId);
    const post = posts.find(p => String(p.id) === String(postId));
    const countEl = document.getElementById(`dislikeCount_${postId}`);

    if (isDisliked) {
        dislikedPosts.delete(postId);
        btn.classList.remove('disliked');
        btn.querySelector('i').className = 'far fa-heart-broken action-icon';
        if (post) post.dislikes_count = Math.max(0, (post.dislikes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_post_dislikes').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        dislikedPosts.add(postId);
        btn.classList.add('disliked');
        btn.querySelector('i').className = 'fas fa-heart-broken action-icon';
        if (post) post.dislikes_count = (post.dislikes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_post_dislikes').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
    }
    if (countEl) countEl.textContent = post?.dislikes_count || 0;
    await sb.from('supabaseAuthPrive_posts').update({ dislikes_count: post?.dislikes_count || 0 }).eq('id', postId);
}

async function toggleSave(postId, btn) {
    const isSaved = savedPosts.has(postId);
    if (isSaved) {
        savedPosts.delete(postId);
        btn.classList.remove('saved');
        btn.querySelector('i').className = 'far fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').delete()
            .eq('post_id', postId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        toast('Publication retirée', 'info');
    } else {
        savedPosts.add(postId);
        btn.classList.add('saved');
        btn.querySelector('i').className = 'fas fa-bookmark action-icon';
        await sb.from('supabaseAuthPrive_saved_posts').insert({
            post_id: postId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });
        toast('Publication enregistrée ✅', 'success');
    }
}

async function repostPost(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;
    const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert({
        author_hubisoccer_id: currentProfile.hubisoccer_id,
        community_id: myCommunity?.id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        reposted_from_id: postId
    }).select().single();
    if (error) {
        toast('Erreur repost', 'error');
        return;
    }
    toast('Repost effectué ✅', 'success');
    posts.unshift(newPost);
    renderPosts();
    await sb.from('supabaseAuthPrive_posts').update({ reposts_count: (post.reposts_count || 0) + 1 }).eq('id', postId);
}
// ========== FIN : INTERACTIONS POSTS ==========
// ========== DEBUT : GESTION DES COMMENTAIRES ==========
async function toggleComments(postId, btn) {
    const section = document.getElementById(`comments_${postId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postId);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId) {
    const section = document.getElementById(`comments_${postId}`);
    if (!section) return;

    const { data, error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

    if (error) {
        toast('Erreur chargement des commentaires', 'error');
        return;
    }

    section.innerHTML = `
        <div class="comments-list">
            ${(data || []).map(c => makeCommentHtml(c, postId)).join('')}
            ${(data || []).length === 10 ? `<div class="load-comments-btn" onclick="loadMoreComments('${postId}')">Voir plus de commentaires</div>` : ''}
        </div>
        <div class="comment-input-row">
            <div class="comment-input-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
            <img class="comment-input-avatar" src="${currentProfile.avatar_url || ''}" alt="" style="display:${currentProfile.avatar_url ? 'block' : 'none'};">
            <div class="comment-input-wrap">
                <textarea class="comment-input" id="commentInput_${postId}" rows="1" placeholder="Écrire un commentaire..." style="resize:none;max-height:80px"></textarea>
                <button class="comment-media-btn" onclick="document.getElementById('commentMediaInput_${postId}').click()"><i class="fas fa-image"></i></button>
                <button class="comment-audio-btn" onclick="startAudioRecording('${postId}')"><i class="fas fa-microphone"></i></button>
                <button class="comment-send-btn" onclick="sendComment('${postId}')"><i class="fas fa-paper-plane"></i></button>
            </div>
            <input type="file" id="commentMediaInput_${postId}" accept="image/*" style="display:none">
        </div>
    `;

    const ta = document.getElementById(`commentInput_${postId}`);
    if (ta) {
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
        });
        ta.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComment(postId);
            }
        });
        ta.addEventListener('input', handleMentionInput);
    }

    const mediaInput = document.getElementById(`commentMediaInput_${postId}`);
    if (mediaInput) {
        mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                commentMediaFile = file;
                toast('Image prête à être envoyée avec le commentaire', 'success');
            }
        });
    }
}

function makeCommentHtml(c, postId) {
    const author = c.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const authorRole = author.role_code || '';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    const isOwn = c.author_hubisoccer_id === currentProfile.hubisoccer_id;

    const avatarBlock = avatarUrl
        ? `<img class="comment-avatar" src="${avatarUrl}" alt="" onclick="openUserProfile('${c.author_hubisoccer_id}')" style="display:block;">`
        : `<div class="comment-avatar-initials" onclick="openUserProfile('${c.author_hubisoccer_id}')">${initials}</div>`;

    return `
        <div class="comment-item" id="comment_${c.id}">
            ${avatarBlock}
            <div>
                <div class="comment-bubble">
                    <div class="comment-author">
                        ${escapeHtml(authorName)}
                        ${authorRole ? `<span class="cm-role-badge">${escapeHtml(authorRole)}</span>` : ''}
                    </div>
                    <div class="comment-text">${formatText(c.content)}</div>
                    ${c.media_url ? `
                        <div class="comment-media">
                            <img src="${c.media_url}" alt="" onclick="openMediaModal('${c.media_url}','image')">
                        </div>
                    ` : ''}
                    ${c.audio_url ? `
                        <div class="comment-audio">
                            <audio controls src="${c.audio_url}"></audio>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-actions">
                    <button class="comment-action-btn ${c.liked_by_me ? 'liked' : ''}" onclick="likeComment('${c.id}', this)">
                        <i class="fa${c.liked_by_me ? 's' : 'r'} fa-heart"></i>
                        <span id="cmLike_${c.id}">${c.likes_count || 0}</span>
                    </button>
                    <button class="comment-action-btn" onclick="openReplyModal('${c.id}', '${postId}')">
                        <i class="fas fa-reply"></i> Répondre
                    </button>
                    ${isOwn ? `
                        <button class="comment-action-btn" style="color:var(--danger)" onclick="deleteComment('${c.id}', '${postId}')">
                            <i class="fas fa-trash-alt"></i> Supprimer
                        </button>
                    ` : ''}
                    <span class="comment-time">${timeSince(c.created_at)}</span>
                    ${c.edited ? '<span class="cm-edited">(modifié)</span>' : ''}
                </div>
                <div class="cm-replies" id="replies_${c.id}"></div>
                <div id="replyCompose_${c.id}" style="display:none; margin-top:8px;">
                    <div class="cm-reply-compose">
                        <div class="comment-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
                        <img src="${currentProfile.avatar_url || ''}" alt=""
                            style="display:${currentProfile.avatar_url ? 'block' : 'none'}; width:26px;height:26px;border-radius:50%;">
                        <textarea rows="1" id="replyInput_${c.id}" placeholder="Répondre à ${escapeHtml(authorName)}..."></textarea>
                        <button onclick="sendReply('${c.id}', '${postId}')"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    const content = input?.value.trim();
    if (!content && !commentMediaFile && !commentAudioFile) return;
    input.value = '';
    input.style.height = 'auto';

    const btn = document.querySelector(`#comments_${postId} .comment-send-btn`);
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        let mediaUrl = null;
        let audioUrl = null;

        if (commentMediaFile) {
            const ext = commentMediaFile.name.split('.').pop();
            const path = `comments/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, commentMediaFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
                mediaUrl = urlData.publicUrl;
            }
            commentMediaFile = null;
        }

        if (commentAudioFile) {
            const path = `comments_audio/${currentProfile.hubisoccer_id}/${Date.now()}.webm`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, commentAudioFile);
            if (!upErr) {
                const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
                audioUrl = urlData.publicUrl;
            }
            commentAudioFile = null;
        }

        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: postId,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content: content || null,
            media_url: mediaUrl,
            audio_url: audioUrl,
            parent_id: null
        }).select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        const list = document.querySelector(`#comments_${postId} .comments-list`);
        if (list) list.insertAdjacentHTML('beforeend', makeCommentHtml(data, postId));

        const post = posts.find(p => String(p.id) === String(postId));
        if (post) post.comments_count = (post.comments_count || 0) + 1;
        await sb.from('supabaseAuthPrive_posts').update({ comments_count: post?.comments_count || 0 }).eq('id', postId);

        const countSpan = document.querySelector(`.post-card[data-post-id="${postId}"] .post-action-count`);
        if (countSpan) countSpan.textContent = post.comments_count;

        if (post && post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: post.author_hubisoccer_id,
                type: 'comment',
                title: 'Nouveau commentaire',
                message: `${currentProfile.full_name || currentProfile.display_name} a commenté votre publication.`,
                data: { link: `post-view.html?id=${postId}` }
            });
        }

        const mentions = content?.match(/@(\w+)/g);
        if (mentions) {
            for (const m of mentions) {
                const handle = m.substring(1);
                const { data: mentionedUser } = await sb.from('supabaseAuthPrive_communities')
                    .select('hubisoccer_id').eq('feed_id', handle).maybeSingle();
                if (mentionedUser && mentionedUser.hubisoccer_id !== currentProfile.hubisoccer_id) {
                    await sb.from('supabaseAuthPrive_notifications').insert({
                        recipient_hubisoccer_id: mentionedUser.hubisoccer_id,
                        type: 'mention',
                        title: 'Nouvelle mention',
                        message: `${currentProfile.full_name || currentProfile.display_name} vous a mentionné dans un commentaire.`,
                        data: { link: `post-view.html?id=${postId}` }
                    });
                }
            }
        }
    } catch (err) {
        toast('Erreur envoi commentaire : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function likeComment(commentId, btn) {
    const liked = btn.classList.contains('liked');
    const countEl = btn.querySelector('span');

    const { data: comment, error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('likes_count, author_hubisoccer_id')
        .eq('id', commentId)
        .single();

    if (error || !comment) {
        toast('Commentaire introuvable', 'error');
        return;
    }

    let newLikes;
    if (liked) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'far fa-heart';
        newLikes = Math.max(0, (comment.likes_count || 1) - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete()
            .eq('comment_id', commentId)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fas fa-heart';
        newLikes = (comment.likes_count || 0) + 1;
        await sb.from('supabaseAuthPrive_comment_likes').insert({
            comment_id: commentId,
            user_hubisoccer_id: currentProfile.hubisoccer_id
        });

        if (comment.author_hubisoccer_id && comment.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
            await sb.from('supabaseAuthPrive_notifications').insert({
                recipient_hubisoccer_id: comment.author_hubisoccer_id,
                type: 'like_comment',
                title: '❤️ J\'aime sur votre commentaire',
                message: `${currentProfile.full_name || currentProfile.display_name} a aimé votre commentaire.`,
                data: { link: `post-view.html?comment=${commentId}` }
            });
        }
    }

    if (countEl) countEl.textContent = newLikes;
    await sb.from('supabaseAuthPrive_comments').update({ likes_count: newLikes }).eq('id', commentId);
}

async function deleteComment(commentId, postId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await sb.from('supabaseAuthPrive_comments').delete().eq('id', commentId);
    document.getElementById(`comment_${commentId}`)?.remove();
    const post = posts.find(p => p.id === postId);
    if (post) post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
    await sb.from('supabaseAuthPrive_posts').update({ comments_count: post?.comments_count || 0 }).eq('id', postId);
    toast('Commentaire supprimé', 'success');
}

async function openReplyModal(commentId, postId) {
    replyCommentId = commentId;
    replyPostId = postId;
    const c = document.querySelector(`#comment_${commentId} .comment-text`);
    document.getElementById('originalCommentQuote').textContent = c?.textContent?.substring(0, 80) || '';
    document.getElementById('replyContent').value = '';
    openModal('modalReply');
}

async function sendReply(commentId = null, postId = null) {
    const id = commentId || replyCommentId;
    const pId = postId || replyPostId;
    if (!id || !pId) {
        toast('Erreur : aucune réponse sélectionnée', 'error');
        return;
    }

    const input = document.getElementById('replyContent');
    const content = input?.value.trim();
    if (!content) return;

    const btn = document.getElementById('sendReplyBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
        const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
            post_id: pId,
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            content,
            parent_id: id
        }).select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code)').single();

        if (error) throw error;

        const repliesContainer = document.getElementById(`replies_${id}`);
        if (repliesContainer) {
            repliesContainer.insertAdjacentHTML('beforeend', makeReplyCard(data));
        }

        closeModal('modalReply');
        input.value = '';
        toast('Réponse envoyée ✅', 'success');
    } catch (err) {
        toast('Erreur envoi réponse : ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
        }
    }
}

function makeReplyCard(r) {
    const author = r.author || {};
    const authorName = author.full_name || author.display_name || 'Utilisateur';
    const avatarUrl = author.avatar_url;
    const initials = getInitials(authorName);
    return `
        <div class="cm-reply-card" id="cm_${r.id}">
            <div class="comment-avatar-initials" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'none' : 'flex'}; width:28px;height:28px;font-size:0.7rem;">
                ${initials}
            </div>
            <img class="cm-reply-avatar" src="${avatarUrl || ''}" alt="" onclick="openUserProfile('${r.author_hubisoccer_id}')"
                style="display:${avatarUrl ? 'block' : 'none'};">
            <div class="cm-reply-bubble">
                <div class="cm-reply-author">${escapeHtml(authorName)}</div>
                <div class="cm-reply-text">${formatText(r.content)}</div>
                <div class="cm-footer">
                    <button class="cm-action-btn" onclick="likeComment('${r.id}', this)">
                        <i class="far fa-heart"></i> ${r.likes_count || 0}
                    </button>
                    <span class="cm-time">${timeSince(r.created_at)}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadMoreComments(postId) {
    toast('Chargement des commentaires supplémentaires... (fonction à implémenter)', 'info');
}
// ========== FIN : GESTION DES COMMENTAIRES ==========
// ========== DEBUT : VOTE SONDAGE ==========
async function votePoll(postId, optionIdx) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll_data) return;
    const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
        toast('Ce sondage est terminé', 'warning');
        return;
    }

    if (poll.voted_by?.includes(currentProfile.hubisoccer_id)) return;

    poll.votes = poll.votes || {};
    poll.votes[optionIdx] = (poll.votes[optionIdx] || 0) + 1;
    poll.voted_by = [...(poll.voted_by || []), currentProfile.hubisoccer_id];
    poll.my_vote = optionIdx;
    post.poll_data = poll;

    await sb.from('supabaseAuthPrive_posts').update({ poll_data: poll }).eq('id', postId);
    renderPosts();
}
// ========== FIN : VOTE SONDAGE ==========
// ========== DEBUT : ACTIONS SUR LES MENUS ==========
function togglePostMenu(btn, postId, isOwn) {
    const menu = document.getElementById(`menu_${postId}`);
    if (!menu) return;

    document.querySelectorAll('.post-dropdown.show').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });

    menu.classList.toggle('show');

    if (menu.classList.contains('show')) {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }
}

function expandPost(postId) {
    const el = document.getElementById(`txt_${postId}`);
    if (el) { el.classList.remove('collapsed'); el.querySelector('.post-see-more')?.remove(); }
}

async function editPost(postId) {
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;
    const newContent = prompt('Modifier la publication :', post.content || '');
    if (newContent === null) return;
    await sb.from('supabaseAuthPrive_posts').update({ content: newContent, edited: true }).eq('id', postId);
    post.content = newContent;
    post.edited = true;
    renderPosts();
    toast('Publication modifiée ✅', 'success');
}

async function deletePost(postId) {
    if (!confirm('Supprimer cette publication ?')) return;
    await sb.from('supabaseAuthPrive_posts').delete().eq('id', postId);
    posts = posts.filter(p => String(p.id) !== String(postId));
    renderPosts();
    toast('Publication supprimée', 'success');
}

function openShareModal(postId) {
    currentSharePostId = postId;
    openModal('modalShare');
}

function sharePost(network) {
    const post = posts.find(p => p.id === currentSharePostId);
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentSharePostId}`;
    const text = post?.content?.substring(0, 100) || '';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === 'copy') {
        navigator.clipboard.writeText(url);
        toast('Lien copié !', 'success');
    } else {
        window.open(shareUrls[network], '_blank');
    }
    closeModal('modalShare');
    sb.from('supabaseAuthPrive_posts').update({ shares_count: (post?.shares_count || 0) + 1 }).eq('id', currentSharePostId);
}

function openReportModal(postId) {
    currentReportPostId = postId;
    document.getElementById('reportReason').value = '';
    openModal('modalReport');
}

async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) { toast('Écris la raison', 'warning'); return; }
    await sb.from('supabaseAuthPrive_reports').insert({
        post_id: currentReportPostId,
        reporter_hubisoccer_id: currentProfile.hubisoccer_id,
        reason
    });
    closeModal('modalReport');
    toast('Signalement envoyé. Merci !', 'success');
}

function openBlockModal(userId) {
    currentBlockUserId = userId;
    openModal('modalBlock');
}

async function confirmBlock() {
    await sb.from('supabaseAuthPrive_blocked_users').insert({
        user_hubisoccer_id: currentProfile.hubisoccer_id,
        blocked_hubisoccer_id: currentBlockUserId
    });
    blockedUsers.add(currentBlockUserId);
    closeModal('modalBlock');
    toast('Utilisateur bloqué', 'success');
    posts = posts.filter(p => p.author_hubisoccer_id !== currentBlockUserId);
    renderPosts();
}

async function hidePost(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts').insert({
        post_id: postId,
        user_hubisoccer_id: currentProfile.hubisoccer_id
    });
    hiddenPosts.add(postId);
    posts = posts.filter(p => String(p.id) !== String(postId));
    renderPosts();
    toast('Publication masquée', 'info');
}

function openUserProfile(userId) {
    window.location.href = `profil-feed.html?id=${userId}`;
}

function openUserByHandle(handle) {
    window.location.href = `profil-feed.html?handle=${handle}`;
}

function searchByHashtag(tag) {
    window.location.href = `search.html?q=%23${tag}`;
}

function openMediaModal(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video'
        ? `<video src="${url}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px"></video>`
        : `<img src="${url}" alt="" style="max-width:90vw;max-height:80vh;border-radius:8px">`;
    openModal('modalMedia');
}
// ========== FIN : ACTIONS SUR LES MENUS ==========
// ========== DEBUT : GESTION DES STORIES ==========
async function loadStories() {
    try {
        const { data: myStories } = await sb.from('supabaseAuthPrive_stories')
            .select('*')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: following } = await sb.from('supabaseAuthPrive_follows')
            .select('following_hubisoccer_id')
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
        const followingIds = (following || []).map(f => f.following_hubisoccer_id);

        let followingStories = [];
        if (followingIds.length > 0) {
            const { data } = await sb.from('supabaseAuthPrive_stories')
                .select('*, author:supabaseAuthPrive_profiles!user_hubisoccer_id(hubisoccer_id, full_name, display_name, avatar_url)')
                .in('user_hubisoccer_id', followingIds)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(5);
            followingStories = data || [];
        }

        const myContainer = document.getElementById('myStoriesContainer');
        if (myContainer) {
            if (myStories && myStories.length > 0) {
                myContainer.innerHTML = myStories.map(s => makeStoryItem(s, currentProfile, true)).join('');
            } else {
                myContainer.innerHTML = '<p style="font-size:0.8rem;color:var(--gray);padding:0 8px;">Aucune story</p>';
            }
        }

        const followingContainer = document.getElementById('followingStoriesContainer');
        if (followingContainer) {
            if (followingStories.length > 0) {
                followingContainer.innerHTML = followingStories.map(s => makeStoryItem(s, s.author, false)).join('');
            } else {
                followingContainer.innerHTML = '<p style="font-size:0.8rem;color:var(--gray);padding:0 8px;">Aucune story</p>';
            }
        }

        const totalStories = (myStories?.length || 0) + followingStories.length;
        const moreWrap = document.getElementById('storiesMoreWrap');
        if (moreWrap) moreWrap.style.display = totalStories > 5 ? 'block' : 'none';
    } catch (err) {
        console.warn('Erreur stories:', err);
    }
}

function makeStoryItem(story, author, isOwn = false) {
    const name = isOwn ? 'Vous' : (author.full_name || author.display_name || 'Utilisateur');
    const avatar = author.avatar_url;
    const initials = getInitials(name);
    let preview = '';

    if (story.media_type === 'text') {
        preview = `<div class="story-ring-text" style="background:${story.text_bg || 'var(--primary)'}">${initials}</div>`;
    } else if (story.media_type === 'video') {
        preview = `<div class="story-ring-video" style="background: #1a1a2e;"><i class="fas fa-video" style="font-size:24px;color:white;"></i></div>`;
    } else {
        preview = `<img src="${story.media_url}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="story-ring-text" style="display:none; background:var(--primary);">${initials}</div>`;
    }

    return `
        <div class="story-item" onclick="viewStory('${story.id}')">
            <div class="story-ring">${preview}</div>
            <span>${isOwn ? 'Moi' : escapeHtml(name.split(' ')[0])}</span>
        </div>
    `;
}

window.viewStory = function(storyId) {
    window.location.href = `stories.html?group=${storyId}`;
};

function handleStoryFileSelect(file) {
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast(`Fichier trop volumineux (max ${file.type.startsWith('video/') ? '100' : '10'} Mo)`, 'warning');
        return;
    }
    storyUploadFile = file;
    const url = URL.createObjectURL(file);
    const preview = document.getElementById('storyFilePreview');
    const dropArea = document.getElementById('storyDropArea');
    const isVideo = file.type.startsWith('video/');
    
    if (preview) {
        preview.innerHTML = `
            <div style="position:relative">
                ${isVideo ? `<video src="${url}" controls style="width:100%;max-height:240px;border-radius:8px"></video>` : `<img src="${url}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px">`}
                <button class="story-preview-remove" onclick="clearStoryFile()"><i class="fas fa-times"></i></button>
            </div>
            <p style="font-size:0.72rem;color:var(--gray);margin-top:6px;text-align:center">${file.name} — ${(file.size/1024/1024).toFixed(1)} Mo</p>
        `;
        preview.style.display = 'block';
    }
    if (dropArea) dropArea.style.display = 'none';
    
    toast(`✅ Fichier "${file.name}" sélectionné`, 'success');
}

window.clearStoryFile = function() {
    storyUploadFile = null;
    const preview = document.getElementById('storyFilePreview');
    const dropArea = document.getElementById('storyDropArea');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    if (dropArea) dropArea.style.display = 'flex';
    const fileInput = document.getElementById('storyFileInput');
    if (fileInput) fileInput.value = '';
    toast('Fichier retiré', 'info');
};

async function uploadStory() {
    const isTextStory = document.querySelector('.story-type-tab.active')?.dataset.type === 'text';
    const textContent = document.getElementById('storyTextContent')?.value.trim();
    const caption = document.getElementById('storyCaption').value.trim();
    const duration = parseInt(document.getElementById('storyDurationSelect').value) || 10;
    const btn = document.getElementById('uploadStoryBtn');
    
    // Validation
    if (!isTextStory && !storyUploadFile) {
        toast('Sélectionne un fichier', 'warning');
        return;
    }
    if (isTextStory && !textContent) {
        toast('Écris quelque chose pour ta story texte', 'warning');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';
    
    try {
        let mediaUrl = null;
        let mediaType = 'text';
        const textBg = storyTextBg || 'linear-gradient(135deg,#551B8C,#3d1266)';
        
        if (!isTextStory && storyUploadFile) {
            const ext = storyUploadFile.name.split('.').pop();
            const path = `stories/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, storyUploadFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = storyUploadFile.type.startsWith('video/') ? 'video' : 'image';
        }
        
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + duration);
        
        const storyData = {
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            media_url: mediaUrl,
            media_type: mediaType,
            caption: caption || (isTextStory ? textContent : null),
            duration: Math.min(3600, Math.max(5, duration)),
            expires_at: expires.toISOString(),
            hidden_for: []
        };
        
        if (isTextStory) {
            storyData.text_bg = textBg;
            storyData.text_content = textContent;
        }
        
        await sb.from('supabaseAuthPrive_stories').insert(storyData);
        
        closeModal('modalStoryUpload');
        toast('Story publiée ! 🎉', 'success');
        
        // Nettoyage
        storyUploadFile = null;
        document.getElementById('storyCaptionInput').value = '';
        if (document.getElementById('storyTextContent')) document.getElementById('storyTextContent').value = '';
        clearStoryFile();
        
        // Recharger les stories dans le feed
        if (typeof loadStories === 'function') {
            loadStories();
        }
    } catch (err) {
        toast('Erreur publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier la story';
    }
}
// ========== FIN : GESTION DES STORIES ==========
// ========== DEBUT : GESTION DES LIVES ==========
async function loadLives() {
    const container = document.getElementById('livesList');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_live_sessions')
            .select(`
                *,
                host:host_hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url
                )
            `)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(5);
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live en ce moment</p>';
            return;
        }
        
        container.innerHTML = data.map(l => {
            const host = l.host || {};
            const name = host.full_name || host.display_name || 'Hôte';
            return `<div class="live-sidebar-item" onclick="window.location.href='live.html?room=${l.id}'">
                <img class="live-avatar" src="${host.avatar_url || '../../img/user-default.jpg'}" alt="">
                <div class="live-info-small">
                    <div class="live-name">${escapeHtml(name)}</div>
                    <div class="live-viewers"><i class="fas fa-eye"></i> ${l.viewers_count || 0}</div>
                </div>
                <div class="live-dot"></div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucun live en ce moment</p>';
    }
}
// ========== FIN : GESTION DES LIVES ==========
// ========== DEBUT : SUGGESTIONS ET ABONNÉS ==========
async function loadSuggestions() {
    const { data: following } = await sb.from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const followingIds = (following || []).map(f => f.following_hubisoccer_id);

    const { data: blocked } = await sb.from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const blockedIds = (blocked || []).map(b => b.blocked_hubisoccer_id);

    const exclude = [...followingIds, currentProfile.hubisoccer_id, ...blockedIds];

    let query = sb.from('supabaseAuthPrive_communities')
        .select('*, profiles:supabaseAuthPrive_profiles!hubisoccer_id(role_code, certified)');

    if (exclude.length) {
        query = query.not('hubisoccer_id', 'in', `(${exclude.join(',')})`);
    }

    const { data } = await query.limit(5);
    const container = document.getElementById('suggestionsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune suggestion</p>';
        return;
    }
    container.innerHTML = data.map(c => {
        const name = c.name || 'Utilisateur';
        const avatar = c.avatar_url;
        const role = c.profiles?.role_code ? ALL_ROLES.find(r => r.code === c.profiles.role_code)?.label || '' : '';
        return `<div class="suggestion-item">
            <img class="suggestion-avatar" src="${avatar || '../../img/user-default.jpg'}" alt="">
            <div class="suggestion-info">
                <div class="suggestion-name">${escapeHtml(name)}</div>
                <div class="suggestion-role">${role}</div>
            </div>
            <button class="suggestion-follow-btn" onclick="followUser('${c.hubisoccer_id}', this)">Suivre</button>
        </div>`;
    }).join('');
}

window.followUser = async function(userId, btn) {
    btn.textContent = 'Abonné';
    btn.classList.add('following');
    
    try {
        await sb.from('supabaseAuthPrive_follows').insert({
            follower_hubisoccer_id: currentProfile.hubisoccer_id,
            following_hubisoccer_id: userId
        });
        const { data: myComm } = await sb
            .from('supabaseAuthPrive_communities')
            .select('following_count')
            .eq('hubisoccer_id', currentProfile.hubisoccer_id)
            .single();
        const newFollowing = (myComm?.following_count || 0) + 1;
        await sb.from('supabaseAuthPrive_communities')
            .update({ following_count: newFollowing })
            .eq('hubisoccer_id', currentProfile.hubisoccer_id);
        const { data: targetComm } = await sb
            .from('supabaseAuthPrive_communities')
            .select('followers_count')
            .eq('hubisoccer_id', userId)
            .single();
        const newFollowers = (targetComm?.followers_count || 0) + 1;
        await sb.from('supabaseAuthPrive_communities')
            .update({ followers_count: newFollowers })
            .eq('hubisoccer_id', userId);
        
        toast('Abonné !', 'success');
        loadSuggestions();
    } catch (err) {
        toast('Erreur : ' + err.message, 'error');
        btn.textContent = 'Suivre';
        btn.classList.remove('following');
    }
};

async function loadFollowers() {
    const container = document.getElementById('followersList');
    try {
        const { data: follows } = await sb
            .from('supabaseAuthPrive_follows')
            .select('follower_hubisoccer_id')
            .eq('following_hubisoccer_id', currentProfile.hubisoccer_id);
        const followerIds = (follows || []).map(f => f.follower_hubisoccer_id);

        if (followerIds.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
            return;
        }

        const { data } = await sb
            .from('supabaseAuthPrive_profiles')
            .select('hubisoccer_id, full_name, display_name, avatar_url, feed_id')
            .in('hubisoccer_id', followerIds)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
            return;
        }

        container.innerHTML = data.map(user => {
            const name = user.full_name || user.display_name || 'Utilisateur';
            return `<div class="follower-item" onclick="openUserProfile('${user.hubisoccer_id}')">
                <img class="follower-avatar" src="${user.avatar_url || '../../img/user-default.jpg'}" alt="">
                <span class="follower-name">${escapeHtml(name)}</span>
            </div>`;
        }).join('');
    } catch (err) {
        console.warn('Erreur chargement followers:', err);
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Pas encore d\'abonnés</p>';
    }
}

async function openFollowersModal(type) {
    const modal = document.createElement('div');
    modal.className = 'c-modal show';
    modal.innerHTML = `
        <div class="c-modal-box c-modal-box-sm">
            <div class="c-modal-head">
                <h2>${type === 'followers' ? 'Abonnés' : 'Abonnements'}</h2>
                <button class="c-modal-close" onclick="this.closest('.c-modal').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="c-modal-body">
                <ul id="followList" class="users-list"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const list = modal.querySelector('#followList');
    const column = type === 'followers' ? 'follower_hubisoccer_id' : 'following_hubisoccer_id';
    const { data } = await sb.from('supabaseAuthPrive_follows')
        .select(`${type === 'followers' ? 'follower' : 'following'}:supabaseAuthPrive_profiles!${column}(hubisoccer_id, full_name, display_name, avatar_url, feed_id)`)
        .eq(type === 'followers' ? 'following_hubisoccer_id' : 'follower_hubisoccer_id', currentProfile.hubisoccer_id);
    if (!data || data.length === 0) {
        list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun résultat</li>';
        return;
    }
    list.innerHTML = data.map(f => {
        const user = f[type === 'followers' ? 'follower' : 'following'] || {};
        const name = user.full_name || user.display_name || 'Utilisateur';
        return `<li class="users-list-item" onclick="openUserProfile('${user.hubisoccer_id}')">
            <img src="${user.avatar_url || '../../img/user-default.jpg'}" alt="">
            <span class="users-list-item-name">${escapeHtml(name)}</span>
        </li>`;
    }).join('');
}
// ========== FIN : SUGGESTIONS ET ABONNÉS ==========
// ========== DEBUT : TENDANCES ET INSIGHTS ==========
async function loadTrends() {
    const { data } = await sb.from('supabaseAuthPrive_posts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(100);
    const hashtagCounts = {};
    data?.forEach(post => {
        const matches = post.content?.match(/#(\w+)/g) || [];
        matches.forEach(tag => {
            const cleanTag = tag.toLowerCase().replace('#', '');
            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
        });
    });
    const trending = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const container = document.getElementById('trendsList');
    if (trending.length === 0) {
        container.innerHTML = '<p style="font-size:0.78rem;color:var(--gray);">Aucune tendance</p>';
        return;
    }
    container.innerHTML = trending.map(([tag, count]) => `
        <div class="trend-item" onclick="window.location.href='search.html?q=%23${tag}'">
            <span class="trend-tag">#${escapeHtml(tag)}</span>
            <span class="trend-count">${count} post${count>1?'s':''}</span>
        </div>
    `).join('');
}

async function loadInsights() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: views } = await sb.from('supabaseAuthPrive_post_views')
        .select('post_id')
        .gte('viewed_at', sevenDaysAgo.toISOString());
    const myPostIds = posts.map(p => p.id);
    const reach = new Set(views?.filter(v => myPostIds.includes(v.post_id)).map(v => v.post_id)).size;

    const { count: newFollowers } = await sb.from('supabaseAuthPrive_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_hubisoccer_id', currentProfile.hubisoccer_id)
        .gte('created_at', sevenDaysAgo.toISOString());

    const { data: engagements } = await sb.from('supabaseAuthPrive_posts')
        .select('likes_count, comments_count, shares_count')
        .eq('author_hubisoccer_id', currentProfile.hubisoccer_id)
        .gte('created_at', sevenDaysAgo.toISOString());
    const totalEngagements = engagements?.reduce((acc, p) => acc + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0) || 0;
    const engagementRate = reach > 0 ? ((totalEngagements / reach) * 100).toFixed(1) : '0.0';

    document.getElementById('insightReach').textContent = reach;
    document.getElementById('insightNewFollowers').textContent = newFollowers || 0;
    document.getElementById('insightEngagement').textContent = engagementRate + '%';
}
// ========== FIN : TENDANCES ET INSIGHTS ==========
// ========== DEBUT : GESTION DES NOTIFICATIONS ==========
async function loadNotifications() {
    const { data } = await sb.from('supabaseAuthPrive_notifications')
        .select('*')
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = data?.length || 0;
        badge.style.display = (data?.length || 0) > 0 ? 'block' : 'none';
    }
    const notifsList = document.getElementById('notifsList');
    if (notifsList) {
        notifsList.innerHTML = data?.map(n => `
            <li class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.data?.link || ''}')">
                <div class="notif-icon-el"><i class="fas fa-${n.type === 'like' ? 'heart' : n.type === 'comment' ? 'comment' : 'bell'}"></i></div>
                <div class="notif-content">
                    <div class="notif-text"><strong>${escapeHtml(n.title)}</strong><br>${escapeHtml(n.message)}</div>
                    <div class="notif-time">${timeSince(n.created_at)}</div>
                </div>
            </li>
        `).join('') || '<li style="padding:16px;color:var(--gray);text-align:center">Aucune notification</li>';
    }
}

window.handleNotifClick = async function(id, link) {
    await sb.from('supabaseAuthPrive_notifications').update({ read: true }).eq('id', id);
    if (link) window.location.href = link;
    else closeModal('modalNotifs');
};

async function markAllNotifsRead() {
    await sb.from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('read', false);
    loadNotifications();
    toast('Toutes les notifications lues', 'success');
}

function subscribeToNewPosts() {
    feedSubscription = sb.channel('new_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_posts' }, async (payload) => {
            const msg = payload.new;
            if (msg.author_hubisoccer_id === currentProfile.hubisoccer_id) return;
            newPostsCount++;
            const bar = document.getElementById('newPostsBar');
            bar.style.display = 'block';
            document.getElementById('newPostsCount').textContent = newPostsCount;
        })
        .subscribe();
}
// ========== FIN : GESTION DES NOTIFICATIONS ==========
// ========== DEBUT : UTILISATEURS BLOQUÉS ==========
async function loadBlockedUsers() {
    const list = document.getElementById('blockedUsersList');
    try {
        const { data } = await sb
            .from('supabaseAuthPrive_blocked_users')
            .select(`
                blocked_hubisoccer_id,
                blocked:supabaseAuthPrive_profiles!blocked_hubisoccer_id(
                    hubisoccer_id, full_name, display_name, avatar_url, feed_id
                )
            `)
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        
        if (!data || data.length === 0) {
            list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun utilisateur bloqué</li>';
            return;
        }
        
        list.innerHTML = data.map(b => {
            const user = b.blocked || {};
            const name = user.full_name || user.display_name || 'Utilisateur';
            return `<li class="users-list-item">
                <img src="${user.avatar_url || '../../img/user-default.jpg'}" alt="">
                <span class="users-list-item-name">${escapeHtml(name)}</span>
                <button class="btn-ghost" onclick="unblockUser('${b.blocked_hubisoccer_id}')">Débloquer</button>
            </li>`;
        }).join('');
    } catch (err) {
        list.innerHTML = '<li style="padding:16px;color:var(--gray);text-align:center">Aucun utilisateur bloqué</li>';
    }
}

window.unblockUser = async function(userId) {
    await sb.from('supabaseAuthPrive_blocked_users')
        .delete()
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .eq('blocked_hubisoccer_id', userId);
    blockedUsers.delete(userId);
    loadBlockedUsers();
    toast('Utilisateur débloqué', 'success');
};
// ========== FIN : UTILISATEURS BLOQUÉS ==========
// ========== DEBUT : POSTS MASQUÉS ==========
async function loadHiddenPosts() {
    const { data } = await sb.from('supabaseAuthPrive_hidden_posts')
        .select('post_id, post:supabaseAuthPrive_posts!post_id(content, created_at)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    const container = document.getElementById('hiddenPostsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">Aucune publication masquée</p>';
        return;
    }
    container.innerHTML = data.map(h => {
        const post = h.post || {};
        return `<div class="hidden-post-item" style="padding:12px;border-bottom:1px solid var(--gray-light);">
            <p style="font-size:0.85rem;">${escapeHtml(post.content?.substring(0,100) || 'Publication')}</p>
            <button class="btn-ghost" onclick="unhidePost('${h.post_id}')">Réafficher</button>
        </div>`;
    }).join('');
}

window.unhidePost = async function(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    hiddenPosts.delete(postId);
    loadHiddenPosts();
    toast('Publication réaffichée', 'success');
    loadPosts(true);
};
// ========== FIN : POSTS MASQUÉS ==========
// ========== DEBUT : COLLECTIONS (POSTS SAUVEGARDÉS) ==========
async function loadCollections() {
    const { data } = await sb.from('supabaseAuthPrive_saved_posts')
        .select('post_id, post:supabaseAuthPrive_posts!post_id(content, created_at)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    const container = document.getElementById('collectionsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">Aucune collection</p>';
        return;
    }
    container.innerHTML = data.map(s => {
        const post = s.post || {};
        return `<div class="collection-item" style="padding:12px;border-bottom:1px solid var(--gray-light);">
            <p style="font-size:0.85rem;">${escapeHtml(post.content?.substring(0,100) || 'Publication')}</p>
            <button class="btn-ghost" onclick="removeFromCollection('${s.post_id}')">Retirer</button>
        </div>`;
    }).join('');
}

window.removeFromCollection = async function(postId) {
    await sb.from('supabaseAuthPrive_saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    savedPosts.delete(postId);
    loadCollections();
    toast('Retiré des collections', 'info');
};
// ========== FIN : COLLECTIONS ==========
// ========== DEBUT : MENTIONS ==========
async function handleMentionInput(e) {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex-1] === ' ')) {
        const query = textBeforeCursor.substring(atIndex+1).toLowerCase();
        if (query.length >= 1) {
            const now = Date.now();
            if (mentionsCache.length === 0 || now - lastMentionsFetch > MENTIONS_CACHE_TTL) {
                const { data } = await sb.from('supabaseAuthPrive_communities')
                    .select('feed_id, name, avatar_url, hubisoccer_id')
                    .limit(100);
                mentionsCache = data || [];
                lastMentionsFetch = now;
            }
            const filtered = mentionsCache.filter(u => u.feed_id?.toLowerCase().startsWith(query)).slice(0, 5);
            showMentionSuggestions(filtered, e.target);
        } else {
            hideMentionSuggestions();
        }
    } else {
        hideMentionSuggestions();
    }
}

function showMentionSuggestions(users, input) {
    hideMentionSuggestions();
    mentionTargetInput = input;
    mentionDropdown = document.createElement('div');
    mentionDropdown.className = 'mention-dropdown';
    mentionDropdown.style.position = 'absolute';
    mentionDropdown.style.background = 'white';
    mentionDropdown.style.border = '1px solid var(--gray-light)';
    mentionDropdown.style.borderRadius = '8px';
    mentionDropdown.style.boxShadow = 'var(--shadow-lg)';
    mentionDropdown.style.maxHeight = '200px';
    mentionDropdown.style.overflowY = 'auto';
    mentionDropdown.style.zIndex = '1000';
    mentionDropdown.style.minWidth = '200px';

    const rect = input.getBoundingClientRect();
    mentionDropdown.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    mentionDropdown.style.left = (rect.left + window.scrollX) + 'px';

    users.forEach(user => {
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '8px';
        item.style.borderBottom = '1px solid var(--gray-light)';
        item.innerHTML = `<img src="${user.avatar_url || '../../img/user-default.jpg'}" style="width:24px;height:24px;border-radius:50%;">
                          <span>@${escapeHtml(user.feed_id)}</span>`;
        item.addEventListener('click', () => {
            const val = input.value;
            const cursorPos = input.selectionStart;
            const textBeforeCursor = val.substring(0, cursorPos);
            const atIndex = textBeforeCursor.lastIndexOf('@');
            const newText = val.substring(0, atIndex) + '@' + user.feed_id + ' ' + val.substring(cursorPos);
            input.value = newText;
            input.focus();
            hideMentionSuggestions();
        });
        mentionDropdown.appendChild(item);
    });

    document.body.appendChild(mentionDropdown);
}

function hideMentionSuggestions() {
    if (mentionDropdown) {
        mentionDropdown.remove();
        mentionDropdown = null;
        mentionTargetInput = null;
    }
}
// ========== FIN : MENTIONS ==========
// ========== DEBUT : ENREGISTREMENT AUDIO ==========
async function startAudioRecording(postId) {
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            commentAudioFile = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            toast('Audio prêt à être envoyé', 'success');
            isRecording = false;
        };
        mediaRecorder.start();
        isRecording = true;
        toast('Enregistrement audio en cours... Cliquez à nouveau sur le micro pour arrêter', 'info');
    } catch (err) {
        toast('Impossible d\'accéder au microphone', 'error');
    }
}
// ========== FIN : ENREGISTREMENT AUDIO ==========
// ========== DEBUT : PUBLICATION DE POST ==========
async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaFile && !pendingPoll && !pendingEvent) {
        toast('Écris quelque chose avant de publier', 'warning');
        return;
    }

    const btn = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

    try {
        let mediaUrl = null, mediaType = null;
        if (mediaFile) {
            const ext = mediaFile.name.split('.').pop();
            const path = `posts/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
            mediaFile = null;
            document.getElementById('mediaPreview').style.display = 'none';
        }

        const postData = {
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            community_id: myCommunity?.id || null,
            content: content || null,
            media_url: mediaUrl,
            media_type: mediaType,
            poll_data: pendingPoll || null,
            event_data: pendingEvent || null,
            is_pinned: pinPostActive,
            is_scheduled: !!scheduledAt,
            scheduled_at: scheduledAt || null,
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            shares_count: 0,
            reposts_count: 0,
            views_count: 0
        };

        const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert(postData)
            .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(full_name, display_name, avatar_url, role_code, feed_id, certified)')
            .single();
        if (error) throw error;

        if (myCommunity) {
            await sb.from('supabaseAuthPrive_communities')
                .update({ posts_count: (myCommunity.posts_count || 0) + 1 })
                .eq('id', myCommunity.id);
            document.getElementById('myCommPosts').textContent = (myCommunity.posts_count || 0) + 1;
            myCommunity.posts_count = (myCommunity.posts_count || 0) + 1;
        }

        document.getElementById('postContent').value = '';
        pendingPoll = null;
        pendingEvent = null;
        scheduledAt = null;
        pinPostActive = false;

        if (!scheduledAt) {
            posts.unshift(newPost);
            renderPosts();
            toast('Publication réussie ! 🎉', 'success');
        } else {
            toast('Publication programmée ✅', 'success');
        }

        const mentions = content?.match(/@(\w+)/g);
        if (mentions) {
            for (const m of mentions) {
                const handle = m.substring(1);
                const { data: mentionedUser } = await sb.from('supabaseAuthPrive_communities')
                    .select('hubisoccer_id').eq('feed_id', handle).maybeSingle();
                if (mentionedUser && mentionedUser.hubisoccer_id !== currentProfile.hubisoccer_id) {
                    await sb.from('supabaseAuthPrive_notifications').insert({
                        recipient_hubisoccer_id: mentionedUser.hubisoccer_id,
                        type: 'mention',
                        title: 'Nouvelle mention',
                        message: `${currentProfile.full_name || currentProfile.display_name} vous a mentionné dans une publication.`,
                        data: { link: `post-view.html?id=${newPost.id}` }
                    });
                }
            }
        }
    } catch (err) {
        console.error('Erreur publication:', err);
        toast('Erreur lors de la publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
    }
}
// ========== FIN : PUBLICATION DE POST ==========
// ========== DEBUT : MODALES DE CRÉATION (SONDAGE, ÉVÉNEMENT, PROGRAMMATION) ==========
function createPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const opts = document.getElementById('pollOptions').value.trim().split('\n').map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) { toast('Question et au moins 2 options requises', 'warning'); return; }
    const dur = parseInt(document.getElementById('pollDuration').value) || 3;
    pendingPoll = { question: q, options: opts, votes: {}, voted_by: [], ends_at: new Date(Date.now() + dur * 86400000).toISOString() };
    closeModal('modalPoll');
    toast('Sondage prêt. Publie maintenant !', 'success');
}

function createEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!title || !date) { toast('Titre et date requis', 'warning'); return; }
    pendingEvent = {
        title,
        date,
        location: document.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDesc').value.trim()
    };
    closeModal('modalEvent');
    toast('Événement prêt. Publie maintenant !', 'success');
}

function confirmSchedule() {
    const dt = document.getElementById('scheduleDateTime').value;
    if (!dt) { toast('Sélectionne une date', 'warning'); return; }
    scheduledAt = new Date(dt).toISOString();
    closeModal('modalSchedule');
    toast(`Publication programmée pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`, 'success');
}
// ========== FIN : MODALES DE CRÉATION ==========
// ========== DEBUT : APERÇU ET ÉDITION DE PROFIL ==========
function showPreview() {
    const content = document.getElementById('postContent').value.trim();
    let mediaHtml = '';

    if (mediaFile) {
        const url = URL.createObjectURL(mediaFile);
        const isVideo = mediaFile.type.startsWith('video/');
        mediaHtml = isVideo ?
            `<div class="post-media"><video src="${url}" controls></video></div>` :
            `<div class="post-media"><img src="${url}" alt=""></div>`;
    }

    document.getElementById('previewBody').innerHTML = `
        <div class="post-card" style="box-shadow:none;border:none">
            <div class="post-header">
                <div class="post-avatar-initials">${getInitials(currentProfile.full_name || currentProfile.display_name)}</div>
                <div class="post-meta">
                    <div class="post-author">${escapeHtml(currentProfile.full_name || '')}</div>
                    <div class="post-author-sub"><span class="post-time">À l'instant</span></div>
                </div>
            </div>
            <div class="post-body"><div class="post-text">${formatText(content)}</div></div>
            ${mediaHtml}
        </div>`;
    openModal('modalPreview');
}

async function saveProfile() {
    const name = document.getElementById('editCommName').value.trim();
    const bio = document.getElementById('editCommBio').value.trim();
    if (!name) { toast('Le nom est requis', 'warning'); return; }
    await sb.from('supabaseAuthPrive_communities').update({ name, bio }).eq('id', myCommunity.id);
    myCommunity.name = name;
    myCommunity.bio = bio;
    document.getElementById('myCommName').textContent = name;
    document.getElementById('presTitle').textContent = name;
    document.getElementById('presDescription').textContent = bio || 'Partagez et interagissez avec les sportifs, artistes et acteurs de la communauté HubISoccer.';
    closeModal('modalEditProfile');
    toast('Profil mis à jour ✅', 'success');
}

function cancelMedia() {
    mediaFile = null;
    document.getElementById('mediaInput').value = '';
    document.getElementById('mediaPreview').style.display = 'none';
}
// ========== FIN : APERÇU ET ÉDITION DE PROFIL ==========
// ========== DEBUT : INITIALISATION PRINCIPALE ==========
// ========== DEBUT : INITIALISATION PRINCIPALE ==========
async function init() {
    setLoader(true, 'Vérification de votre session...', 20);
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) return;
    
    setLoader(true, 'Vérification de ta communauté...', 40);
    const comm = await loadMyCommunity();
    if (!comm) return;
    
    setLoader(true, 'Chargement du feed...', 60);
    await loadPosts(true);
    
    setLoader(true, 'Chargement de la communauté...', 80);
    await Promise.all([
        loadStories(),
        loadSuggestions(),
        loadFollowers(),
        loadLives(),
        loadTrends(),
        loadNotifications(),
        loadInsights(),
        loadBlockedUsers().catch(() => {})
    ]);
    
    setLoader(false);
    subscribeToNewPosts();
    
    document.getElementById('publishBtn').addEventListener('click', publishPost);
    document.getElementById('attachMediaBtn').addEventListener('click', () => document.getElementById('mediaInput').click());
    document.getElementById('mediaInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        mediaFile = file;
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        document.getElementById('mediaPreview').style.display = 'block';
        document.getElementById('mediaPreview').innerHTML = `
            <div class="preview-media-wrap" style="position:relative">
                ${isVideo ? `<video src="${url}" controls></video>` : `<img src="${url}" alt="">`}
                <button class="remove-media-btn" onclick="cancelMedia()"><i class="fas fa-times"></i></button>
            </div>`;
    });
    
    document.getElementById('pollBtn').addEventListener('click', () => openModal('modalPoll'));
    document.getElementById('eventBtn').addEventListener('click', () => openModal('modalEvent'));
    document.getElementById('scheduleBtn').addEventListener('click', () => openModal('modalSchedule'));
    document.getElementById('startLiveBtn').addEventListener('click', () => window.location.href = 'live.html');
    document.getElementById('pinPostBtn').addEventListener('click', () => {
        pinPostActive = !pinPostActive;
        document.getElementById('pinPostBtn').style.background = pinPostActive ? 'var(--gold-light)' : '';
        toast(pinPostActive ? 'Post épinglé activé' : 'Épinglage désactivé', 'info');
    });
    document.getElementById('previewPostBtn').addEventListener('click', showPreview);
    
    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('createEventBtn').addEventListener('click', createEvent);
    document.getElementById('confirmScheduleBtn').addEventListener('click', confirmSchedule);
    
    document.getElementById('submitReportBtn').addEventListener('click', submitReport);
    document.getElementById('confirmBlockBtn').addEventListener('click', confirmBlock);
    document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', () => sharePost(btn.dataset.network)));
    
    document.getElementById('sendReplyBtn').addEventListener('click', () => sendReply(replyCommentId, replyPostId));
    
    document.getElementById('addStoryBtn').addEventListener('click', () => openModal('modalStoryUpload'));
    document.getElementById('uploadStoryBtn').addEventListener('click', uploadStory);
    document.getElementById('seeMoreStoriesBtn').addEventListener('click', () => window.location.href = 'stories.html');
    
    const storyTabs = document.querySelectorAll('.story-type-tab');
    const uploadZone = document.getElementById('storyUploadZone');
    const textZone = document.getElementById('storyTextZone');
    const dropArea = document.getElementById('storyDropArea');
    const fileInput = document.getElementById('storyFileInput');
    const textCanvas = document.getElementById('storyTextCanvas');
    const styleBtns = document.querySelectorAll('.txt-style-btn');
    
    storyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            storyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.type;
            if (type === 'text') {
                uploadZone.style.display = 'none';
                textZone.style.display = 'block';
            } else {
                uploadZone.style.display = 'block';
                textZone.style.display = 'none';
            }
        });
    });
    
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragging');
    });
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragging');
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file) handleStoryFileSelect(file);
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleStoryFileSelect(file);
    });
    
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            storyTextBg = btn.dataset.bg; // ← CORRECTION : Mise à jour de la variable globale
            textCanvas.style.background = btn.dataset.bg;
        });
    });
    
    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            loadPosts(true);
        });
    });
    
    document.querySelectorAll('.role-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeRoleFilter = chip.dataset.role;
            loadPosts(true);
        });
    });
    
    document.getElementById('feedSearch').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
    });
    
    const sentinel = document.getElementById('scrollSentinel');
    if (sentinel) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMorePosts && !loadingPosts) {
                loadPosts(false);
            }
        });
        observer.observe(sentinel);
    }
    
    document.getElementById('newPostsBarBtn').addEventListener('click', () => {
        newPostsCount = 0;
        document.getElementById('newPostsBar').style.display = 'none';
        loadPosts(true);
    });
    
    document.getElementById('notifBtn').addEventListener('click', () => {
        openModal('modalNotifs');
        loadNotifications();
    });
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotifsRead);
    document.getElementById('refreshSuggestions').addEventListener('click', loadSuggestions);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('refreshPresBtn').addEventListener('click', () => {
        loadSuggestions();
        loadFollowers();
        loadTrends();
        loadInsights();
    });
    
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);
    
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.classList.toggle('open');
    });
    const closeSidebar = () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('rightSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    };
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);
    
    document.getElementById('sidebarAvatarClick').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('sidebarCoverClick').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('myCommAvatar').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    document.getElementById('myCommCover').addEventListener('click', () => openUserProfile(currentProfile.hubisoccer_id));
    
    document.querySelectorAll('.c-modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });
    
    document.addEventListener('click', (e) => {
        if (mentionDropdown && !mentionDropdown.contains(e.target) && e.target !== mentionTargetInput) {
            hideMentionSuggestions();
        }
    });
}
// ========== FIN : INITIALISATION PRINCIPALE ==========
// ========== FIN : INITIALISATION PRINCIPALE ==========
// ========== DEBUT : EXPOSITION GLOBALE DES FONCTIONS ==========
window.openUserProfile = openUserProfile;
window.openUserByHandle = openUserByHandle;
window.searchByHashtag = searchByHashtag;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
window.repostPost = repostPost;
window.toggleComments = toggleComments;
window.openShareModal = openShareModal;
window.openReportModal = openReportModal;
window.openBlockModal = openBlockModal;
window.hidePost = hidePost;
window.editPost = editPost;
window.deletePost = deletePost;
window.togglePostMenu = togglePostMenu;
window.expandPost = expandPost;
window.openReplyModal = openReplyModal;
window.likeComment = likeComment;
window.deleteComment = deleteComment;
window.openMediaModal = openMediaModal;
window.cancelMedia = cancelMedia;
window.sendComment = sendComment;
window.sendReply = sendReply;
window.makeReplyCard = makeReplyCard;
window.loadMoreComments = loadMoreComments;
window.loadCollections = loadCollections;
window.loadHiddenPosts = loadHiddenPosts;
window.loadBlockedUsers = loadBlockedUsers;
window.viewStory = viewStory;
window.clearStoryFile = clearStoryFile;
window.followUser = followUser;
window.unblockUser = unblockUser;
window.unhidePost = unhidePost;
window.removeFromCollection = removeFromCollection;
window.handleNotifClick = handleNotifClick;
// ========== FIN : EXPOSITION GLOBALE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========
