// ============================================================
//  HUBISOCCER — SESSION.JS
//  Fonctions d'authentification et de profil (à appeler)
// ============================================================

'use strict';

// Ces fonctions utilisent la variable globale `sb` qui doit être
// définie dans le fichier principal (comme vous le faites déjà).

/**
 * Vérifie la session Supabase. Redirige vers login si non connecté.
 * @returns {Promise<Object|null>} L'utilisateur Supabase ou null.
 */
async function checkSession() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    return session.user;
}

/**
 * Charge le profil complet de l'utilisateur connecté.
 * @param {string} userId - L'UUID Supabase (auth_uuid).
 * @returns {Promise<Object|null>} Le profil ou null.
 */
async function loadProfile(userId) {
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', userId)
        .single();
    if (error) {
        toast('Erreur chargement profil', 'error');
        return null;
    }
    return data;
}

/**
 * Déconnecte l'utilisateur et redirige vers la page de login.
 */
async function logout() {
    await sb.auth.signOut();
    window.location.href = '../../authprive/users/login.html';
}