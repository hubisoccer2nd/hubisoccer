// ============================================================
//  HUBISOCCER — FEED.JS
//  Page principale de la communauté (vérification + redirection)
// ============================================================

'use strict';

// Début configuration Supabase
const SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb;
// Fin configuration Supabase

// Début état global
let currentUser    = null;
let currentProfile = null;
// Fin état global

// Début fonctions utilitaires
function toast(msg, type='info', dur=4000) {
    const c = document.getElementById('toastContainer');
    const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    c.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideInRight 0.3s reverse'; setTimeout(() => el.remove(), 300); }, dur);
}

function setLoader(show, text='Chargement...', pct=0) {
    const l = document.getElementById('globalLoader');
    if (!l) return;
    l.style.display = show ? 'flex' : 'none';
    document.getElementById('loaderText').textContent = text;
    document.getElementById('loaderBar').style.width = pct + '%';
}

function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
// Fin fonctions utilitaires

// Début session
async function checkSession() {
    setLoader(true, 'Vérification de la session...', 20);
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) { window.location.href = '../../authprive/users/login.html'; return null; }
    currentUser = session.user;
    return currentUser;
}
// Fin session

// Début chargement profil
async function loadProfile() {
    setLoader(true, 'Chargement du profil...', 50);
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) { toast('Erreur chargement profil', 'error'); return null; }
    currentProfile = data;

    // UI
    document.getElementById('userName').textContent = data.full_name || data.display_name || 'Utilisateur';
    document.getElementById('userAvatar').src = data.avatar_url || '../../img/user-default.jpg';

    // Configurer le dashboard selon le rôle
    const roleDashboardMap = {
        'FOOT': '../../footballeur/dashboard/foot-dash.html',
        'BASK': '../../basketteur/dashboard/basketteur-dash.html',
        'ADMIN': '../../authprive/admin/admin-dashboard.html'
    };
    const dash = roleDashboardMap[data.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;

    // Construire le menu sidebar selon le rôle
    buildSidebarMenu(data.role_code);

    return data;
}
// Fin chargement profil

// Début construction menu sidebar
function buildSidebarMenu(roleCode) {
    const nav = document.getElementById('sidebarNav');
    const titleEl = document.getElementById('sidebarRoleTitle');
    
    const menuConfig = {
        'FOOT': {
            title: 'Menu Footballeur',
            items: [
                {icon:'fa-tachometer-alt', label:'Tableau de bord', href:'../../footballeur/dashboard/foot-dash.html'},
                {icon:'fa-users', label:'Ma Communauté', href:'feed.html', active:true},
                {icon:'fa-shield-alt', label:'Vérification', href:'../../footballeur/verification/foot-verif.html'},
                {icon:'fa-file-alt', label:'Mon CV Pro', href:'../../footballeur/edit-cv/foot-cv.html'},
                {icon:'fa-certificate', label:'Diplômes & Certifs', href:'../../footballeur/certifications/foot-certif.html'},
                {icon:'fa-trophy', label:'Suivi Tournoi', href:'../../shared/suivi-tournoi/suivi-tournoi.html'},
                {icon:'fa-video', label:'Mes Vidéos', href:'../../footballeur/videos/foot-videos.html'},
                {icon:'fa-coins', label:'Mes Revenus', href:'../../footballeur/revenus/foot-revenus.html'},
                {icon:'fa-envelope', label:'Messages', href:'../../shared/messagerie/conversation.html'},
                {icon:'fa-headset', label:'Support', href:'../../footballeur/support/foot-supp.html'}
            ]
        },
        'ADMIN': {
            title: 'Menu Admin',
            items: [
                {icon:'fa-chart-pie', label:'Dashboard', href:'../../authprive/admin/admin-dashboard.html'},
                {icon:'fa-users', label:'Communauté', href:'feed.html', active:true},
                {icon:'fa-id-card', label:'Gestion IDs', href:'../../authprive/admin/admin-ids.html'},
                {icon:'fa-users-cog', label:'Utilisateurs', href:'../../authprive/admin/admin-users.html'},
                {icon:'fa-history', label:'Logs', href:'../../authprive/admin/admin-logs.html'}
            ]
        }
    };

    const config = menuConfig[roleCode] || {
        title: 'Menu',
        items: [
            {icon:'fa-users', label:'Communauté', href:'feed.html', active:true}
        ]
    };

    titleEl.textContent = config.title;
    nav.innerHTML = config.items.map(item => `
        <a href="${item.href}" class="${item.active ? 'active' : ''}">
            <i class="fas ${item.icon}"></i> ${item.label}
        </a>
    `).join('') + `
        <hr>
        <a href="#" id="sidebarLogout" style="color:var(--danger)">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
        </a>
    `;
    document.getElementById('sidebarLogout')?.addEventListener('click', logout);
}
// Fin construction menu sidebar

// Début vérification communauté existante
async function checkExistingCommunity() {
    setLoader(true, 'Vérification de ta communauté...', 75);
    const { data, error } = await sb
        .from('supabaseAuthPrive_communities')
        .select('id, feed_id')
        .eq('hubisoccer_id', currentProfile.hubisoccer_id)
        .maybeSingle();
    
    setLoader(false);
    
    if (error) {
        toast('Erreur lors de la vérification de la communauté', 'error');
        return;
    }
    
    if (!data) {
        // Pas de communauté → rediriger vers setup
        window.location.href = 'feed-setup.html';
    } else {
        // Communauté trouvée → rester sur feed.html (pour l'instant affichage "en construction")
        // Plus tard, nous chargerons le vrai feed ici
        console.log('Communauté trouvée:', data.feed_id);
    }
}
// Fin vérification communauté existante

// Début déconnexion
async function logout() {
    await sb.auth.signOut();
    window.location.href = '../../authprive/users/login.html';
}
// Fin déconnexion

// Début initialisation
async function init() {
    const user = await checkSession();
    if (!user) return;
    
    await loadProfile();
    await checkExistingCommunity();

    // Navbar dropdown
    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);

    // Sidebar mobile
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

    // Toggle sidebar droite (pour mobile)
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.style.display = rs.style.display === 'none' ? 'block' : 'none';
    });

    // Langue (placeholder)
    document.getElementById('langSelect').addEventListener('change', (e) => {
        toast(`Langue changée en ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
}
// Fin initialisation

document.addEventListener('DOMContentLoaded', init);
