// ============================================================
// HUBISOCCER — SESSION.JS
// Gestion centralisée de la session et du profil utilisateur
// ============================================================
'use strict';

// ----------------------------------------------
// CONFIGURATION SUPABASE (UNIQUE POUR TOUT LE SITE)
// ----------------------------------------------
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';

// Initialisation unique du client Supabase
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb; // Pour compatibilité avec l'existant

// ----------------------------------------------
// ÉTAT DE LA SESSION
// ----------------------------------------------
let currentUser = null;
let currentProfile = null;

// ----------------------------------------------
// VÉRIFICATION DE SESSION
// ----------------------------------------------
async function checkSession() {
    const { data: { session }, error } = await sb.auth.getSession();
    
    if (error || !session) {
        console.warn('Session invalide, redirection vers login');
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    
    currentUser = session.user;
    return currentUser;
}

// ----------------------------------------------
// CHARGEMENT DU PROFIL
// ----------------------------------------------
async function loadProfile(userId = null) {
    const id = userId || currentUser?.id;
    if (!id) {
        console.error('loadProfile: aucun ID utilisateur fourni');
        return null;
    }
    
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', id)
        .single();
    
    if (error) {
        handleError(error, 'Chargement du profil');
        return null;
    }
    
    currentProfile = data;
    return data;
}

// ----------------------------------------------
// ACCESSEURS
// ----------------------------------------------
function getCurrentUser() {
    return currentUser;
}

function getCurrentProfile() {
    return currentProfile;
}

// ----------------------------------------------
// DÉCONNEXION
// ----------------------------------------------
async function logout() {
    try {
        await sb.auth.signOut();
        currentUser = null;
        currentProfile = null;
        window.location.href = '../../authprive/users/login.html';
    } catch (error) {
        handleError(error, 'Déconnexion');
    }
}

// ----------------------------------------------
// REDIRECTION SI NON CONNECTÉ
// ----------------------------------------------
async function requireAuth() {
    const user = await checkSession();
    if (!user) return null;
    const profile = await loadProfile(user.id);
    if (!profile) {
        // Profil inexistant : rediriger vers la création de communauté ?
        window.location.href = 'feed-setup.html';
        return null;
    }
    return { user, profile };
}

// ----------------------------------------------
// EXPOSITION GLOBALE
// ----------------------------------------------
window.sb = sb; // Accès direct au client Supabase
window.checkSession = checkSession;
window.loadProfile = loadProfile;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;
window.logout = logout;
window.requireAuth = requireAuth;
