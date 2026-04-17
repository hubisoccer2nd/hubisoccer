// ============================================================
//  HUBISOCCER — CONVERSATION.JS (VERSION FINALE COMPLÈTE)
//  Liste des conversations — Tous rôles
//  Inclut : sidebar 28 rôles, liste d'abonnés, nouvelle conv complète,
//  renommage de groupe, sélecteur 24 langues, présence, etc.
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let conversations = [];
let onlineUsers = new Set();
let showArchives = false;
let activeFilter = 'all';
let searchQuery = '';
let presenceChannel = null;
let selectedGroupMembers = [];

// Langues
const LANGUAGES = [
    { code: 'fr', name: 'Français' }, { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' }, { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' }, { code: 'zh', name: '中文' }, { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' }, { code: 'ru', name: 'Русский' }, { code: 'hi', name: 'हिन्दी' },
    { code: 'nl', name: 'Nederlands' }, { code: 'sv', name: 'Svenska' }, { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' }, { code: 'fi', name: 'Suomi' }, { code: 'pl', name: 'Polski' },
    { code: 'tr', name: 'Türkçe' }, { code: 'el', name: 'Ελληνικά' }, { code: 'he', name: 'עברית' },
    { code: 'id', name: 'Bahasa Indonesia' }, { code: 'ms', name: 'Bahasa Melayu' }, { code: 'th', name: 'ไทย' }
];
let currentLang = localStorage.getItem('hubisoccer_lang') || 'fr';
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

    const config = menuConfig[roleCode] || menuConfig['FOOT'];
    if (titleEl) titleEl.textContent = config.title;

    if (nav) {
        nav.innerHTML = config.items.map(item => `
            <a href="${item.href}" class="${item.active ? 'active' : ''}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');
    }
}
// ========== FIN : MENU LATERAL ==========

// ========== DEBUT : INITIALISATION SESSION & PROFIL ==========
async function initSessionAndProfile() {
    try {
        const auth = await requireAuth();
        if (!auth) return false;
        
        // 🔥 Attendre que currentProfile soit chargé par session.js
        let attempts = 0;
        while ((!currentProfile || !currentProfile.hubisoccer_id) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!currentProfile || !currentProfile.hubisoccer_id) {
            toast('Profil non chargé. Redirection...', 'error');
            window.location.href = '../community/feed-setup.html';
            return false;
        }
        
        document.getElementById('userName').textContent = currentProfile.full_name || currentProfile.display_name || 'Utilisateur';
        updateAvatarDisplay(currentProfile.avatar_url, currentProfile.full_name || currentProfile.display_name, 'userAvatar', 'userAvatarInitials');
        
        // Construction du menu latéral avec le rôle de l'utilisateur
        buildSidebarMenu(currentProfile.role_code || 'FOOT');
        
        return true;
    } catch (err) {
        toast('Erreur de session : ' + err.message, 'error');
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
// ========== FIN : SESSION & PROFIL ==========

// ========== DEBUT : CHARGEMENT DES CONVERSATIONS ==========
async function loadConversations() {
    showSkeleton(true);
    try {
        const { data: participations, error: pErr } = await sb
            .from('supabaseAuthPrive_conversation_participants')
            .select('conversation_id, last_read_at')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        if (pErr) throw pErr;
        
        if (!participations || participations.length === 0) {
            conversations = [];
            renderConversations();
            return;
        }
        
        const allConvIds = participations.map(p => p.conversation_id);
        const readMap = Object.fromEntries(participations.map(p => [p.conversation_id, p.last_read_at]));
        
        let convIds = allConvIds;
        const { data: archived } = await sb
            .from('supabaseAuthPrive_archived_conversations')
            .select('conversation_id')
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
        const archivedIds = new Set((archived || []).map(a => a.conversation_id));
        
        if (showArchives) {
            convIds = allConvIds.filter(id => archivedIds.has(id));
        } else {
            convIds = allConvIds.filter(id => !archivedIds.has(id));
        }
        
        if (convIds.length === 0) {
            conversations = [];
            renderConversations();
            return;
        }
        
        const { data: convData, error: cErr } = await sb
            .from('supabaseAuthPrive_conversations')
            .select(`
                id, is_group, group_name, group_avatar, created_at, updated_at,
                participants:supabaseAuthPrive_conversation_participants (
                    user_hubisoccer_id,
                    profile:supabaseAuthPrive_profiles!user_hubisoccer_id ( hubisoccer_id, full_name, display_name, avatar_url )
                )
            `)
            .in('id', convIds)
            .order('updated_at', { ascending: false });
        if (cErr) throw cErr;
        
        // ✅ CORRECTION FINALE : gère NULL et absence dans le tableau
        const { data: lastMsgs } = await sb
            .from('supabaseAuthPrive_messages')
            .select('id, conversation_id, content, media_type, created_at, user_hubisoccer_id')
            .in('conversation_id', convIds)
            .or(`deleted_for.is.null, deleted_for.not.cs.{${currentProfile.hubisoccer_id}}`)
            .order('created_at', { ascending: false });
        
        const lastMsgMap = {};
        if (lastMsgs) {
            for (const msg of lastMsgs) {
                if (!lastMsgMap[msg.conversation_id]) {
                    lastMsgMap[msg.conversation_id] = msg;
                }
            }
        }
        
        const unreadCounts = {};
        for (const cid of convIds) {
            const lastRead = readMap[cid];
            let query = sb
                .from('supabaseAuthPrive_messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', cid)
                .neq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                .or(`deleted_for.is.null, deleted_for.not.cs.{${currentProfile.hubisoccer_id}}`);
            if (lastRead) {
                const isoLastRead = new Date(lastRead).toISOString();
                query = query.gt('created_at', isoLastRead);
            }
            const { count } = await query;
            unreadCounts[cid] = count || 0;
        }
        
        conversations = (convData || []).map(conv => {
            const participants = conv.participants || [];
            let name, avatarUrl, otherUserId = null;
            
            if (conv.is_group) {
                name = conv.group_name || 'Groupe';
                avatarUrl = conv.group_avatar || null;
            } else {
                const other = participants.find(p => p.user_hubisoccer_id !== currentProfile.hubisoccer_id);
                const prof = other?.profile || {};
                name = prof.full_name || prof.display_name || 'Utilisateur';
                avatarUrl = prof.avatar_url || null;
                otherUserId = other?.user_hubisoccer_id || null;
            }
            
            const lastMsg = lastMsgMap[conv.id];
            return {
                id: conv.id,
                is_group: conv.is_group,
                group_name: conv.group_name,
                name,
                avatarUrl,
                otherUserId,
                participants,
                lastMsg,
                lastMsgTime: lastMsg?.created_at || conv.updated_at,
                unreadCount: unreadCounts[conv.id] || 0,
                archived: archivedIds.has(conv.id)
            };
        });
        
        renderConversations();
    } catch (err) {
        console.error('Erreur chargement conversations:', err);
        toast('Erreur lors du chargement des conversations', 'error');
    } finally {
        showSkeleton(false);
    }
}

function renderConversations() {
    const list = document.getElementById('conversationsList');
    const skeleton = document.getElementById('skeletonList');
    const emptyEl = document.getElementById('emptyState');
    const totalBadge = document.getElementById('totalConvBadge');
    
    skeleton.style.display = 'none';
    list.style.display = 'flex';
    
    let filtered = conversations.filter(conv => {
        if (searchQuery && !conv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeFilter === 'unread' && conv.unreadCount === 0) return false;
        if (activeFilter === 'groups' && !conv.is_group) return false;
        if (activeFilter === 'direct' && conv.is_group) return false;
        return true;
    });
    
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    totalBadge.textContent = `${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}`;
    
    const notifBadge = document.getElementById('notifBadge');
    if (totalUnread > 0) {
        notifBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        notifBadge.style.display = 'block';
        document.title = `(${totalUnread}) Messages | HubISoccer`;
    } else {
        notifBadge.style.display = 'none';
        document.title = 'Messages | HubISoccer';
    }
    
    if (filtered.length === 0) {
        list.style.display = 'none';
        emptyEl.style.display = 'block';
        document.getElementById('emptyTitle').textContent = showArchives ? 'Aucune conversation archivée' : 'Aucune conversation';
        document.getElementById('emptyDesc').textContent = showArchives ? 'Vous n\'avez pas encore archivé de conversations.' : 'Sélectionnez un abonné ci‑dessus ou créez un groupe !';
        return;
    }
    
    emptyEl.style.display = 'none';
    list.style.display = 'flex';
    
    list.innerHTML = filtered.map(conv => {
        const isOnline = conv.otherUserId && onlineUsers.has(conv.otherUserId);
        const lastMsgText = getLastMsgPreview(conv.lastMsg);
        const timeText = conv.lastMsgTime ? timeSince(conv.lastMsgTime) : '';
        const hasUnread = conv.unreadCount > 0;
        const initials = getInitials(conv.name);
        const avatarUrl = conv.avatarUrl;
        
        return `
        <div class="conv-item ${hasUnread ? 'unread' : ''}" data-conv-id="${conv.id}">
            <div class="conv-avatar-wrap">
                ${avatarUrl ? `<img class="conv-avatar" src="${avatarUrl}" alt="${conv.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="conv-avatar-initials" style="display:${avatarUrl ? 'none' : 'flex'};">${initials}</div>
                ${conv.is_group
                    ? `<div class="group-icon"><i class="fas fa-users"></i></div>`
                    : `<div class="online-dot ${isOnline ? 'visible' : ''}"></div>`
                }
            </div>
            <div class="conv-info">
                <div class="conv-name-row">
                    <span class="conv-name">${escapeHtml(conv.name)}</span>
                    <span class="conv-time">${timeText}</span>
                </div>
                <div class="conv-last-row">
                    <span class="conv-last">${lastMsgText}</span>
                    ${hasUnread ? `<span class="unread-count">${conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>` : ''}
                </div>
            </div>
            <div class="conv-actions">
                <button class="conv-action-btn archive-btn" data-conv-id="${conv.id}" title="${showArchives ? 'Désarchiver' : 'Archiver'}">
                    <i class="fas ${showArchives ? 'fa-undo' : 'fa-archive'}"></i>
                </button>
                <button class="conv-action-btn danger delete-btn" data-conv-id="${conv.id}" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function getLastMsgPreview(msg) {
    if (!msg) return '<em>Aucun message</em>';
    if (msg.media_type === 'image') return '<i class="fas fa-image"></i> Photo';
    if (msg.media_type === 'video') return '<i class="fas fa-video"></i> Vidéo';
    if (msg.media_type === 'audio') return '<i class="fas fa-microphone"></i> Message vocal';
    if (msg.media_type === 'file') return '<i class="fas fa-file"></i> Fichier';
    return escapeHtml(msg.content?.substring(0, 60) || '');
}

function showSkeleton(show) {
    document.getElementById('skeletonList').style.display = show ? 'flex' : 'none';
    document.getElementById('conversationsList').style.display = show ? 'none' : 'flex';
    document.getElementById('emptyState').style.display = 'none';
}
// ========== FIN : CHARGEMENT DES CONVERSATIONS ==========

// ========== DEBUT : GESTION DES ABONNÉS ==========
async function loadFollowers() {
    try {
        const { data: follows, error } = await sb
            .from('supabaseAuthPrive_follows')
            .select('following_hubisoccer_id, profile:supabaseAuthPrive_profiles!following_hubisoccer_id(full_name, display_name, avatar_url)')
            .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id)
            .limit(20);

        if (error) throw error;

        const followers = (follows || []).map(f => ({
            id: f.following_hubisoccer_id,
            name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
            avatar: f.profile?.avatar_url || null
        }));

        renderFollowers(followers);
        document.getElementById('followersCount').textContent = followers.length;
    } catch (err) {
        console.error('Erreur chargement abonnés:', err);
    }
}

function renderFollowers(followers) {
    const container = document.getElementById('followersList');
    if (!container) return;

    if (followers.length === 0) {
        container.innerHTML = '<div class="followers-empty">Aucun abonné pour le moment</div>';
        return;
    }

    container.innerHTML = followers.map(f => {
        const initials = getInitials(f.name);
        return `
            <div class="follower-item" data-follower-id="${f.id}">
                <div class="follower-avatar-wrap">
                    ${f.avatar ? `<img src="${f.avatar}" alt="${f.name}" class="follower-avatar">` : ''}
                    <div class="follower-avatar-initials" style="display:${f.avatar ? 'none' : 'flex'};">${initials}</div>
                    <div class="follower-online-dot ${onlineUsers.has(f.id) ? 'online' : ''}"></div>
                </div>
                <span class="follower-name">${escapeHtml(f.name)}</span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.follower-item').forEach(el => {
        el.addEventListener('click', () => {
            const followerId = el.dataset.followerId;
            openDirectFromFollower(followerId);
        });
    });
}

async function openDirectFromFollower(followerId) {
    await openOrCreateDirectConversation(followerId);
}
// ========== FIN : GESTION DES ABONNÉS ==========

// ========== DEBUT : ACTIONS SUR CONVERSATIONS ==========
async function toggleArchive(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    if (conv.archived) {
        await sb.from('supabaseAuthPrive_archived_conversations')
            .delete()
            .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
            .eq('conversation_id', convId);
        toast('Conversation désarchivée', 'success');
    } else {
        await sb.from('supabaseAuthPrive_archived_conversations')
            .insert({ user_hubisoccer_id: currentProfile.hubisoccer_id, conversation_id: convId });
        toast('Conversation archivée', 'success');
    }
    await loadConversations();
}

function promptDeleteConv(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    if (!confirm(`Supprimer la conversation avec ${conv.name} ?`)) return;
    deleteConversation(convId);
}

async function deleteConversation(convId) {
    await sb.from('supabaseAuthPrive_conversation_participants')
        .delete()
        .eq('conversation_id', convId)
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    const { count } = await sb.from('supabaseAuthPrive_conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId);
    if ((count || 0) === 0) {
        await sb.from('supabaseAuthPrive_messages').delete().eq('conversation_id', convId);
        await sb.from('supabaseAuthPrive_conversations').delete().eq('id', convId);
    }
    toast('Conversation supprimée', 'success');
    await loadConversations();
}

function openConversation(convId) {
    window.location.href = `discuss.html?conv=${convId}`;
}

async function renameGroup(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv || !conv.is_group) return;

    const newName = prompt('Entrez le nouveau nom du groupe :', conv.group_name);
    if (!newName || newName.trim() === '') return;

    const { error } = await sb.from('supabaseAuthPrive_conversations')
        .update({ group_name: newName.trim() })
        .eq('id', convId);

    if (error) {
        toast('Erreur lors du renommage', 'error');
    } else {
        conv.group_name = newName.trim();
        conv.name = newName.trim();
        renderConversations();
        toast('Groupe renommé', 'success');
    }
}
// ========== FIN : ACTIONS SUR CONVERSATIONS ==========

// ========== DEBUT : CRÉATION DE CONVERSATIONS ==========
async function openOrCreateDirectConversation(targetId) {
    const targetHubisoccerId = targetId;

    const { data: myParts } = await sb.from('supabaseAuthPrive_conversation_participants')
        .select('conversation_id').eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    const myIds = (myParts || []).map(p => p.conversation_id);

    for (const cid of myIds) {
        const { data: parts } = await sb.from('supabaseAuthPrive_conversation_participants')
            .select('user_hubisoccer_id').eq('conversation_id', cid);
        if (parts?.length === 2 && parts.some(p => p.user_hubisoccer_id === targetHubisoccerId)) {
            window.location.href = `discuss.html?conv=${cid}`;
            return;
        }
    }

    const { data: newConv } = await sb.from('supabaseAuthPrive_conversations')
        .insert({ is_group: false }).select().single();
    if (!newConv) return;

    await sb.from('supabaseAuthPrive_conversation_participants').insert([
        { conversation_id: newConv.id, user_hubisoccer_id: currentProfile.hubisoccer_id },
        { conversation_id: newConv.id, user_hubisoccer_id: targetHubisoccerId }
    ]);

    window.location.href = `discuss.html?conv=${newConv.id}`;
}

function openNewConversationFull() {
    openModal('modalNewDirect');
    loadFollowersForDirectModal();
}

async function loadFollowersForDirectModal() {
    const { data: follows } = await sb
        .from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id, profile:supabaseAuthPrive_profiles!following_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);

    const followers = (follows || []).map(f => ({
        id: f.following_hubisoccer_id,
        name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
        avatar: f.profile?.avatar_url || null
    }));

    renderDirectModalList(followers);
}

function renderDirectModalList(followers, query = '') {
    const container = document.getElementById('directList');
    if (!container) return;

    const filtered = query ? followers.filter(f => f.name.toLowerCase().includes(query.toLowerCase())) : followers;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="members-loading">Aucun résultat</div>';
        return;
    }

    container.innerHTML = filtered.map(f => {
        const initials = getInitials(f.name);
        return `
            <div class="direct-item" data-follower-id="${f.id}">
                ${f.avatar ? `<img src="${f.avatar}" alt="">` : `<div class="member-avatar-initials">${initials}</div>`}
                <span class="direct-name">${escapeHtml(f.name)}</span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.direct-item').forEach(el => {
        el.addEventListener('click', () => {
            const followerId = el.dataset.followerId;
            closeModal('modalNewDirect');
            openDirectFromFollower(followerId);
        });
    });
}
// ========== FIN : CRÉATION DE CONVERSATIONS ==========

// ========== DEBUT : CRÉATION DE GROUPE ==========
async function loadFollowersForGroup() {
    const { data: follows } = await sb
        .from('supabaseAuthPrive_follows')
        .select('following_hubisoccer_id, profile:supabaseAuthPrive_profiles!following_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);

    const listEl = document.getElementById('membersList');
    if (!follows || follows.length === 0) {
        listEl.innerHTML = `<div class="members-loading">Aucun abonné trouvé</div>`;
        return;
    }

    const followers = follows.map(f => ({
        id: f.following_hubisoccer_id,
        name: f.profile?.full_name || f.profile?.display_name || 'Utilisateur',
        avatar: f.profile?.avatar_url || null
    }));

    renderMembersList(followers, '');
    document.getElementById('memberSearch').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderMembersList(followers, q);
    });
}

function renderMembersList(followers, query) {
    const filtered = query ? followers.filter(f => f.name.toLowerCase().includes(query)) : followers;
    const listEl = document.getElementById('membersList');
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="members-loading">Aucun résultat</div>`;
        return;
    }
    listEl.innerHTML = filtered.map(f => {
        const initials = getInitials(f.name);
        const isSelected = selectedGroupMembers.some(m => m.id === f.id);
        return `
        <div class="member-item ${isSelected ? 'selected' : ''}" data-uid="${f.id}">
            ${f.avatar ? `<img src="${f.avatar}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
            <div class="member-avatar-initials" style="display:${f.avatar ? 'none' : 'flex'};">${initials}</div>
            <span class="member-name">${escapeHtml(f.name)}</span>
            <i class="fas fa-check member-check"></i>
        </div>
    `}).join('');

    listEl.querySelectorAll('.member-item').forEach(el => {
        el.addEventListener('click', () => {
            const uid = el.dataset.uid;
            const member = filtered.find(f => f.id === uid);
            if (member) toggleMemberSelection(el, member);
        });
    });
}

function toggleMemberSelection(el, member) {
    const idx = selectedGroupMembers.findIndex(m => m.id === member.id);
    if (idx >= 0) {
        selectedGroupMembers.splice(idx, 1);
        el.classList.remove('selected');
    } else {
        selectedGroupMembers.push(member);
        el.classList.add('selected');
    }
    renderSelectedChips();
}

function renderSelectedChips() {
    const container = document.getElementById('selectedMembers');
    container.innerHTML = selectedGroupMembers.map(m => {
        const initials = getInitials(m.name);
        return `
        <div class="selected-chip" data-uid="${m.id}">
            ${m.avatar ? `<img src="${m.avatar}" alt="">` : `<div class="chip-initials">${initials}</div>`}
            <span>${escapeHtml(m.name)}</span>
            <i class="fas fa-times chip-remove"></i>
        </div>
    `}).join('');
    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const uid = btn.parentElement.dataset.uid;
            selectedGroupMembers = selectedGroupMembers.filter(m => m.id !== uid);
            renderSelectedChips();
            document.querySelector(`.member-item[data-uid="${uid}"]`)?.classList.remove('selected');
        });
    });
}

async function createGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    if (!groupName) { toast('Donnez un nom au groupe', 'warning'); return; }
    if (selectedGroupMembers.length < 2) { toast('Sélectionnez au moins 2 participants', 'warning'); return; }

    const btn = document.getElementById('createGroupBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

    try {
        const { data: conv, error: convErr } = await sb
            .from('supabaseAuthPrive_conversations')
            .insert({ is_group: true, group_name: groupName })
            .select().single();
        if (convErr) throw convErr;

        const participants = [...selectedGroupMembers.map(m => m.id), currentProfile.hubisoccer_id];
        await sb.from('supabaseAuthPrive_conversation_participants')
            .insert(participants.map(uid => ({ conversation_id: conv.id, user_hubisoccer_id: uid })));

        await sb.from('supabaseAuthPrive_messages').insert({
            conversation_id: conv.id,
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            content: `👋 Groupe "${groupName}" créé ! Bienvenue à tous.`,
            deleted_for: []
        });

        toast(`Groupe "${groupName}" créé`, 'success');
        closeModal('modalGroup');
        await loadConversations();
    } catch (err) {
        toast('Erreur création groupe', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Créer le groupe';
    }
}
// ========== FIN : CRÉATION DE GROUPE ==========

// ========== DEBUT : UTILISATEURS BLOQUÉS ==========
async function loadBlockedUsers() {
    const { data } = await sb
        .from('supabaseAuthPrive_blocked_users')
        .select('blocked_hubisoccer_id, profile:supabaseAuthPrive_profiles!blocked_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('user_hubisoccer_id', currentProfile.hubisoccer_id);

    const listEl = document.getElementById('blockedList');
    if (!data || data.length === 0) {
        listEl.innerHTML = `<div class="blocked-empty">Aucun utilisateur bloqué</div>`;
        return;
    }
    listEl.innerHTML = data.map(b => {
        const p = b.profile || {};
        const name = p.full_name || p.display_name || 'Utilisateur';
        const initials = getInitials(name);
        const avatar = p.avatar_url;
        return `
        <div class="blocked-item">
            ${avatar ? `<img src="${avatar}" alt="">` : `<div class="blocked-avatar-initials">${initials}</div>`}
            <span class="blocked-name">${escapeHtml(name)}</span>
            <button class="btn-unblock" data-uid="${b.blocked_hubisoccer_id}">Débloquer</button>
        </div>
    `}).join('');

    listEl.querySelectorAll('.btn-unblock').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sb.from('supabaseAuthPrive_blocked_users')
                .delete()
                .eq('user_hubisoccer_id', currentProfile.hubisoccer_id)
                .eq('blocked_hubisoccer_id', btn.dataset.uid);
            toast('Utilisateur débloqué', 'success');
            loadBlockedUsers();
        });
    });
}
// ========== FIN : UTILISATEURS BLOQUÉS ==========

// ========== DEBUT : PRÉSENCE ==========
function initPresence() {
    presenceChannel = sb.channel('hubisoccer_presence');
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            onlineUsers = new Set(Object.values(state).flat().map(p => p.user_id));
            renderConversations();
            loadFollowers(); // Recharge les abonnés pour mettre à jour le statut en ligne
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: currentProfile.hubisoccer_id, online_at: new Date().toISOString() });
            }
        });
}
// ========== FIN : PRÉSENCE ==========

// ========== DEBUT : GESTION DES LANGUES ==========
function initLanguageSelector() {
    const dropdown = document.getElementById('langDropdown');
    const currentBtn = document.getElementById('langCurrentBtn');
    const currentLangSpan = document.getElementById('currentLangCode');

    const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
    currentLangSpan.textContent = currentLangObj.code.toUpperCase();

    dropdown.innerHTML = LANGUAGES.map(lang => `
        <div class="lang-option" data-lang="${lang.code}">
            <span>${lang.name}</span>
            ${lang.code === currentLang ? '<i class="fas fa-check"></i>' : ''}
        </div>
    `).join('');

    dropdown.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const langCode = opt.dataset.lang;
            setLanguage(langCode);
            closeModal('modalLanguage');
        });
    });

    currentBtn.addEventListener('click', () => {
        openModal('modalLanguage');
    });
}

function setLanguage(langCode) {
    currentLang = langCode;
    localStorage.setItem('hubisoccer_lang', langCode);
    document.getElementById('currentLangCode').textContent = langCode.toUpperCase();
    applyTranslations();
    toast(`Langue changée pour ${LANGUAGES.find(l => l.code === langCode)?.name}`, 'success');
}

function applyTranslations() {
    // Traductions statiques à implémenter selon les besoins
    // Pour l'instant, les textes sont en français par défaut
}
// ========== FIN : GESTION DES LANGUES ==========

// ========== DEBUT : INITIALISATION ==========
async function init() {
    setLoader(true, 'Chargement des conversations...');
    const sessionOk = await initSessionAndProfile();
    if (!sessionOk) {
        setLoader(false);
        return;
    }

    await loadConversations();
    await loadFollowers();
    initPresence();
    initLanguageSelector();
    setLoader(false);

    // Écouteurs
    document.getElementById('conversationsList').addEventListener('click', (e) => {
        const archiveBtn = e.target.closest('.archive-btn');
        if (archiveBtn) {
            e.stopPropagation();
            toggleArchive(archiveBtn.dataset.convId);
            return;
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            promptDeleteConv(deleteBtn.dataset.convId);
            return;
        }
        const item = e.target.closest('.conv-item');
        if (item) {
            openConversation(item.dataset.convId);
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        document.getElementById('clearSearch').style.display = searchQuery ? 'block' : 'none';
        renderConversations();
    });
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        document.getElementById('clearSearch').style.display = 'none';
        renderConversations();
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.dataset.filter;
            renderConversations();
        });
    });

    document.getElementById('archiveToggleBtn').addEventListener('click', async () => {
        showArchives = !showArchives;
        document.getElementById('archiveToggleText').textContent = showArchives ? 'Conversations' : 'Archives';
        document.getElementById('archiveToggleBtn').classList.toggle('active-archive', showArchives);
        await loadConversations();
    });

    document.getElementById('newGroupBtn').addEventListener('click', () => {
        selectedGroupMembers = [];
        document.getElementById('groupName').value = '';
        document.getElementById('selectedMembers').innerHTML = '';
        openModal('modalGroup');
        loadFollowersForGroup();
    });

    document.getElementById('emptyNewGroupBtn').addEventListener('click', () => {
        selectedGroupMembers = [];
        document.getElementById('groupName').value = '';
        document.getElementById('selectedMembers').innerHTML = '';
        openModal('modalGroup');
        loadFollowersForGroup();
    });

    document.getElementById('createGroupBtn').addEventListener('click', createGroup);

    document.getElementById('blockedBtn').addEventListener('click', () => {
        loadBlockedUsers();
        openModal('modalBlocked');
    });

    // Nouveau bouton "Nouvelle discussion"
    const newConvBtn = document.createElement('button');
    newConvBtn.className = 'btn-action btn-secondary';
    newConvBtn.id = 'newConversationBtn';
    newConvBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>Nouvelle discussion</span>';
    const pageHeaderActions = document.querySelector('.page-header-actions');
    if (pageHeaderActions) {
        pageHeaderActions.insertBefore(newConvBtn, document.getElementById('newGroupBtn'));
    }
    document.getElementById('newConversationBtn').addEventListener('click', openNewConversationFull);

    // Recherche dans la modale de discussion directe
    document.getElementById('directSearch').addEventListener('input', (e) => {
        const query = e.target.value;
        loadFollowersForDirectModal().then(() => {
            // La fonction de rendu est déjà appelée dans loadFollowersForDirectModal
        });
    });

    // Dropdown utilisateur
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));

    document.getElementById('dropProfile').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `../community/profil-feed.html?id=${currentProfile.hubisoccer_id}`;
    });
    document.getElementById('dropDashboard').addEventListener('click', (e) => {
        e.preventDefault();
        const role = currentProfile?.role_code || 'FOOT';
        const dashboardUrl = ROLE_DASHBOARD_MAP[role] || ROLE_DASHBOARD_MAP['FOOT'];
        window.location.href = dashboardUrl;
    });
    document.getElementById('dropSettings').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'settings-msg.html';
    });
    document.getElementById('dropLogout').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });

    // Paramètre ?to=msgId
    const params = new URLSearchParams(window.location.search);
    const toMsgId = params.get('to');
    if (toMsgId) {
        openOrCreateDirectConversation(toMsgId);
    }
}
// ========== FIN : INITIALISATION ==========

// ========== DEBUT : DÉMARRAGE ==========
document.addEventListener('DOMContentLoaded', init);
// ========== FIN : DÉMARRAGE ==========