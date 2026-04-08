// Début initialisation Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin initialisation Supabase

let currentUser = null;
let footballeurProfile = null;
let commissionsChart = null;

// Début fonction countryToFlag (tous pays)
function countryToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
// Fin fonction countryToFlag

// Début fonction showToast (10 secondes)
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 10000);
}
// Fin fonction showToast

// Début fonctions loader
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }
// Fin fonctions loader

// Début fonction getInitials
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}
// Fin fonction getInitials

// Début fonction updateAvatarDisplay
function updateAvatarDisplay() {
    const profileImg = document.getElementById('profileDisplay');
    const profileInitials = document.getElementById('profileDisplayInitials');
    const userImg = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    const deleteBtn = document.getElementById('deleteAvatarBtn');
    const avatarUrl = footballeurProfile?.avatar_url;
    const initials = getInitials(footballeurProfile?.display_name || footballeurProfile?.first_name || '');

    if (avatarUrl) {
        if (profileImg) { profileImg.style.display = 'block'; profileImg.src = avatarUrl; profileInitials.style.display = 'none'; }
        if (userImg) { userImg.style.display = 'block'; userImg.src = avatarUrl; userInitials.style.display = 'none'; }
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
        if (profileImg) { profileImg.style.display = 'none'; profileInitials.style.display = 'flex'; profileInitials.textContent = initials; }
        if (userImg) { userImg.style.display = 'none'; userInitials.style.display = 'flex'; userInitials.textContent = initials; }
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}
// Fin fonction updateAvatarDisplay

// Début fonction loadProfile
async function loadProfile() {
    showLoader();
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error('Non authentifié');
        currentUser = user;

        const { data: profile, error: profileError } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('*')
            .eq('auth_uuid', currentUser.id)
            .single();
        if (profileError) throw profileError;
        if (profile.role_code !== 'FOOT') { window.location.href = '../../authprive/users/login.html?role=FOOT'; return; }

        footballeurProfile = profile;
        document.getElementById('userName').textContent = profile.display_name || profile.first_name || 'Footballeur';
        updateAvatarDisplay();
        updateUIWithProfile();
        hideLoader();
    } catch (err) {
        hideLoader();
        console.error(err);
        showToast('Erreur de chargement du profil', 'error');
        window.location.href = '../../authprive/users/login.html';
    }
}
// Fin fonction loadProfile

// Début fonction updateUIWithProfile
function updateUIWithProfile() {
    if (!footballeurProfile) return;
    document.getElementById('dashboardName').textContent = footballeurProfile.display_name || '-';
    document.getElementById('footballeurPseudo').textContent = footballeurProfile.display_name || '-';
    document.getElementById('footballeurPhone').textContent = footballeurProfile.phone || '-';
    document.getElementById('footballeurEmail').textContent = footballeurProfile.email || '-';
    const country = footballeurProfile.country_code || '';
    document.getElementById('footballeurCountryFlag').textContent = countryToFlag(country);
    document.getElementById('footballeurCountryName').textContent = country || '-';
    document.getElementById('agentID').textContent = `ID: ${footballeurProfile.hubisoccer_id || '-'}`;
    document.getElementById('footballeurFullName').textContent = footballeurProfile.display_name || (footballeurProfile.first_name + ' ' + footballeurProfile.last_name);
    document.getElementById('footballeurEmailDisplay').textContent = footballeurProfile.email;
    document.getElementById('footballeurPhoneDisplay').textContent = footballeurProfile.phone || '-';
    document.getElementById('memberSince').textContent = footballeurProfile.created_at ? new Date(footballeurProfile.created_at).toLocaleDateString('fr-FR') : '-';
}
// Fin fonction updateUIWithProfile

// Début fonction initChart
function initChart() {
    const ctx = document.getElementById('commissionsChart').getContext('2d');
    commissionsChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Commissions (FCFA)', data: [], borderColor: '#FFCC00', tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
// Fin fonction initChart

// Début fonction uploadAvatar
async function uploadAvatar(file) {
    if (!currentUser || !footballeurProfile) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image > 2 Mo', 'error'); return; }
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(fileName, file);
    if (uploadError) { showToast('Erreur upload', 'error'); return; }
    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;
    const { error: updateError } = await supabaseClient.from('supabaseAuthPrive_profiles').update({ avatar_url: publicUrl }).eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    if (updateError) { showToast('Erreur mise à jour', 'error'); return; }
    footballeurProfile.avatar_url = publicUrl;
    updateAvatarDisplay();
    showToast('Avatar mis à jour', 'success');
}
// Fin fonction uploadAvatar

// Début fonction deleteAvatar
async function deleteAvatar() {
    if (!footballeurProfile?.avatar_url) return;
    const { error } = await supabaseClient.from('supabaseAuthPrive_profiles').update({ avatar_url: null }).eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
    if (error) { showToast('Erreur suppression', 'error'); return; }
    footballeurProfile.avatar_url = null;
    updateAvatarDisplay();
    showToast('Avatar supprimé', 'success');
}
// Fin fonction deleteAvatar

// Début fonction triggerUpload
function triggerUpload() { document.getElementById('fileInput').click(); }
// Fin fonction triggerUpload

// Début fonction copyID
async function copyID() {
    if (!footballeurProfile?.hubisoccer_id) return;
    await navigator.clipboard.writeText(footballeurProfile.hubisoccer_id);
    showToast('ID copié', 'success');
}
// Fin fonction copyID

// Début fonction logout
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = '../../../index.html';
}
// Fin fonction logout

// Début événements DOM
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    if (!footballeurProfile) return;
    initChart();

    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) uploadAvatar(file);
    });
    document.getElementById('deleteAvatarBtn').addEventListener('click', deleteAvatar);
    document.getElementById('logoutLink')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('logoutLinkSidebar')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('active');
        document.getElementById('sidebarOverlay').classList.add('active');
    });
    document.getElementById('closeLeftSidebar')?.addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
    });
    document.getElementById('userMenu')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));

    window.triggerUpload = triggerUpload;
    window.copyID = copyID;
});
// Fin événements DOM
