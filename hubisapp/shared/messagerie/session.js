// ============================================================
//  HUBISOCCER — MESSAGERIE / SESSION.JS (CORRIGÉ)
//  Gère la session Supabase et le profil courant
//  Correction : chargement par auth_uuid + attente robuste
// ============================================================

'use strict';

// ========== DEBUT : INITIALISATION SUPABASE ==========
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : INITIALISATION SUPABASE ==========

// ========== DEBUT : VARIABLES GLOBALES DE SESSION ==========
let currentUser = null;
let currentProfile = null;
let profileReady = false;
// ========== FIN : VARIABLES GLOBALES DE SESSION ==========

// ========== DEBUT : FONCTIONS D'AUTHENTIFICATION ==========
async function requireAuth() {
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) {
        console.warn('Utilisateur non connecté, redirection...');
        window.location.href = '../../index.html';
        return null;
    }
    currentUser = user;
    return user;
}

async function fetchCurrentProfile() {
    if (!currentUser) return null;
    // Correction : chargement par auth_uuid et non par email
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error || !data) {
        console.error('Profil introuvable :', error);
        return null;
    }
    currentProfile = data;
    profileReady = true;
    return data;
}

async function initSession() {
    const user = await requireAuth();
    if (!user) return false;
    const profile = await fetchCurrentProfile();
    if (!profile) {
        if (typeof toast === 'function') {
            toast('Profil introuvable. Veuillez créer votre communauté.', 'error');
        } else {
            alert('Profil introuvable. Veuillez créer votre communauté.');
        }
        window.location.href = '../community/feed-setup.html';
        return false;
    }
    return true;
}

// 🔥 INITIALISATION AUTOMATIQUE AU CHARGEMENT DU SCRIPT
(async () => {
    await initSession();
})();
// ========== FIN : FONCTIONS D'AUTHENTIFICATION ==========

// ========== DEBUT : EXPOSITION GLOBALE ==========
window.sb = sb;
window.currentUser = currentUser;
window.currentProfile = currentProfile;
window.profileReady = profileReady;
window.requireAuth = requireAuth;
window.initSession = initSession;
// ========== FIN : EXPOSITION GLOBALE ==========