// admin-auth.js - Vérification de l'accès administrateur
async function checkAdminAccess() {
    const { data: { user }, error: userError } = await window.supabaseAuthPrive.auth.getUser();
    if (userError || !user) {
        window.location.href = '../index.html';
        return;
    }

    const { data: profile, error: profileError } = await window.supabaseAuthPrive
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // Stocker les infos de l'admin pour une utilisation ultérieure (optionnel)
    window.adminUser = user;
    window.adminProfile = profile;
}

// Exécuter immédiatement
checkAdminAccess();
