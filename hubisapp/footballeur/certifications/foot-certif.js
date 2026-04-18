/* ============================================================
   HubISoccer — foot-certif.js
   Espace Footballeur · Diplômes & Certifications
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser = null;
let userProfile = null;
let certificates = [];
const DOC_BUCKET = 'documents';
// Fin état global

// Début fonctions utilitaires
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close"><i class="fas fa-times"></i></div>
    `;
    c.appendChild(t);
    const closeBtn = t.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => t.remove(), 300);
    });
    setTimeout(() => {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const url = userProfile?.avatar_url;
    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
    } else {
        const init = getInitials(userProfile?.full_name || userProfile?.display_name || 'F');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
// Fin fonctions utilitaires

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadProfile
async function loadProfile() {
    if (!currentUser) return null;
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, display_name, avatar_url, role_code')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement profil', 'error');
        return null;
    }
    if (data.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    userProfile = data;
    document.getElementById('userName').textContent = userProfile.full_name || userProfile.display_name || 'Footballeur';
    updateAvatarUI();
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction loadCertificates
async function loadCertificates() {
    if (!userProfile) return;
    showLoader();
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_certifications')
            .select('*')
            .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        certificates = data || [];
        renderCertificates();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement certificats', 'error');
    } finally {
        hideLoader();
    }
}
// Fin fonction loadCertificates

// Début fonction renderCertificates
function renderCertificates() {
    const container = document.getElementById('certificatesList');
    if (!container) return;
    if (certificates.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun document soumis pour le moment.</p>';
        return;
    }
    const statusLabels = {
        approved: 'Validé',
        pending: 'En attente',
        rejected: 'Rejeté'
    };
    container.innerHTML = certificates.map(cert => {
        const statusText = statusLabels[cert.status] || 'En attente';
        let icon = 'fa-file-alt';
        if (cert.type === 'scolaire') icon = 'fa-graduation-cap';
        else if (cert.type === 'sportif') icon = 'fa-futbol';
        return `
            <div class="cert-card ${cert.status}">
                <div class="cert-icon"><i class="fas ${icon}"></i></div>
                <div class="cert-info">
                    <h4>${escapeHtml(cert.title)}</h4>
                    <p>${cert.year}</p>
                </div>
                <span class="cert-status ${cert.status}">${statusText}</span>
            </div>
        `;
    }).join('');
}
// Fin fonction renderCertificates

// Début fonction initUploadForm
function initUploadForm() {
    const dropArea = document.getElementById('fileDropArea');
    const fileInput = document.getElementById('certFile');
    const fileLabel = document.getElementById('fileLabel');

    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        fileLabel.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Cliquez ou glissez votre document ici';
    });
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.background = 'rgba(85,27,140,0.05)';
        dropArea.style.borderColor = '#551B8C';
    });
    dropArea.addEventListener('dragleave', () => {
        dropArea.style.background = '';
        dropArea.style.borderColor = '#e8e4f0';
    });
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.background = '';
        dropArea.style.borderColor = '#e8e4f0';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileLabel.textContent = e.dataTransfer.files[0].name;
        }
    });

    document.getElementById('certForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userProfile) { showToast('Profil non chargé', 'error'); return; }

        const title = document.getElementById('certTitle').value.trim();
        const year = parseInt(document.getElementById('certYear').value);
        const type = document.getElementById('certType').value;
        const file = fileInput.files[0];

        if (!title || !year || !file) {
            showToast('Veuillez remplir tous les champs obligatoires.', 'warning');
            return;
        }
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 1) {
            showToast(`L'année doit être comprise entre 1900 et ${currentYear + 1}.`, 'warning');
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Le fichier ne doit pas dépasser 5 Mo.', 'warning');
            return;
        }

        showLoader();
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userProfile.hubisoccer_id}_${Date.now()}.${fileExt}`;
            const filePath = `certifications/footballeur/${fileName}`;

            const { error: uploadError } = await supabaseClient.storage
                .from(DOC_BUCKET)
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage
                .from(DOC_BUCKET)
                .getPublicUrl(filePath);
            const fileUrl = urlData.publicUrl;

            const { error: insertError } = await supabaseClient
                .from('supabaseAuthPrive_certifications')
                .insert([{
                    user_hubisoccer_id: userProfile.hubisoccer_id,
                    title: title,
                    year: year,
                    type: type,
                    file_url: fileUrl,
                    file_name: file.name,
                    status: 'pending'
                }]);
            if (insertError) throw insertError;

            showToast('Document soumis avec succès ! En attente de validation.', 'success');
            document.getElementById('certForm').reset();
            fileLabel.textContent = 'Cliquez ou glissez votre document ici';
            await loadCertificates();
        } catch (err) {
            console.error(err);
            showToast('Erreur : ' + err.message, 'error');
        } finally {
            hideLoader();
        }
    });
}
// Fin fonction initUploadForm

// Début fonction initUserMenu
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initSidebar
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}
// Fin fonction initSidebar

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!userProfile) return;
    await loadCertificates();
    initUploadForm();
    initUserMenu();
    initSidebar();
    initLogout();
    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation DOM
