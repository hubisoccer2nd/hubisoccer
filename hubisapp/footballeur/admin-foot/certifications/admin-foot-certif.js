/* ============================================================
   HubISoccer — admin-foot-certif.js
   Administration Footballeur · Certifications
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentAdmin = null;
let certificatesData = [];
let currentCertId = null;
// Fin état global

// Début fonctions utilitaires
function showLoader(show) { document.getElementById('globalLoader').style.display = show ? 'flex' : 'none'; }

function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type]||icons.info}"></i></div><div class="toast-content">${message}</div><div class="toast-close"><i class="fas fa-times"></i></div>`;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => { t.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => t.remove(), 300); });
    setTimeout(() => { if (t.parentNode) { t.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => t.remove(), 300); } }, duration);
}

function getInitials(name) { if (!name) return 'A'; const parts = name.trim().split(/\s+/); return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase(); }
function updateAvatarUI() {
    const img = document.getElementById('userAvatar'), init = document.getElementById('userAvatarInitials');
    const url = currentAdmin?.avatar_url;
    if (url) { if (img) { img.src = url; img.style.display = 'block'; } if (init) init.style.display = 'none'; }
    else { const initials = getInitials(currentAdmin?.full_name || currentAdmin?.display_name || 'A'); if (init) { init.textContent = initials; init.style.display = 'flex'; } if (img) img.style.display = 'none'; }
}
// Fin fonctions utilitaires

// Début vérification admin
async function checkAdmin() {
    showLoader(true);
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) { window.location.href = '../../../authprive/users/login.html'; return false; }
    const { data: profile, error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles').select('role_code, full_name, display_name, avatar_url').eq('auth_uuid', user.id).single();
    if (profileError || !profile) { window.location.href = '../../../authprive/users/login.html'; return false; }
    if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') { showToast('Accès réservé aux administrateurs', 'error'); setTimeout(() => window.location.href = '../../../authprive/users/login.html', 2000); return false; }
    currentAdmin = profile;
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
    updateAvatarUI();
    showLoader(false);
    return true;
}
// Fin vérification admin

// Début chargement certifications
async function loadCertificates() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_certifications')
            .select(`*, footballeur:user_hubisoccer_id ( hubisoccer_id, full_name, avatar_url )`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        certificatesData = data || [];
        renderCertificates();
        updateStats();
    } catch (err) { console.error(err); showToast('Erreur chargement', 'error'); }
    finally { showLoader(false); }
}
// Fin chargement certifications

// Début rendu liste
function renderCertificates() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filter = document.getElementById('statusFilter')?.value || 'all';
    const filtered = certificatesData.filter(cert => {
        const footballeur = cert.footballeur || {};
        const matchesSearch = (footballeur.full_name || '').toLowerCase().includes(searchTerm) || (cert.title || '').toLowerCase().includes(searchTerm);
        const matchesStatus = filter === 'all' || cert.status === filter;
        return matchesSearch && matchesStatus;
    });
    const container = document.getElementById('certsList');
    if (!container) return;
    if (!filtered.length) { container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Aucun certificat trouvé.</p>'; return; }
    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    container.innerHTML = filtered.map(cert => {
        const footballeur = cert.footballeur || {};
        const avatar = footballeur.avatar_url || '../../../img/user-default.jpg';
        let icon = 'fa-file-alt'; if (cert.type === 'scolaire') icon = 'fa-graduation-cap'; else if (cert.type === 'sportif') icon = 'fa-futbol';
        return `
            <div class="cert-card ${cert.status}" data-cert-id="${cert.id}">
                <img src="${avatar}" class="cert-avatar" onerror="this.src='../../../img/user-default.jpg'">
                <div class="cert-info">
                    <div class="cert-player">${footballeur.full_name || 'Inconnu'}</div>
                    <div class="cert-title">${cert.title}</div>
                    <div class="cert-meta">${cert.year} · <i class="fas ${icon}"></i> ${cert.type}</div>
                </div>
                <div class="cert-status ${cert.status}">${statusLabels[cert.status] || cert.status}</div>
                <div class="cert-actions">
                    <button class="btn-action view" onclick="viewCertificate(${cert.id})"><i class="fas fa-eye"></i> Voir</button>
                    <button class="btn-action approve" onclick="updateStatus(${cert.id}, 'approved')"><i class="fas fa-check"></i> Approuver</button>
                    <button class="btn-action reject" onclick="updateStatus(${cert.id}, 'rejected')"><i class="fas fa-times"></i> Rejeter</button>
                    <button class="btn-action pending" onclick="updateStatus(${cert.id}, 'pending')"><i class="fas fa-clock"></i> En attente</button>
                    <button class="btn-action download" onclick="window.open('${cert.file_url}', '_blank')"><i class="fas fa-download"></i> Fichier</button>
                </div>
            </div>
        `;
    }).join('');
}
// Fin rendu liste

// Début stats
function updateStats() {
    const pending = certificatesData.filter(c => c.status === 'pending').length;
    const approved = certificatesData.filter(c => c.status === 'approved').length;
    const rejected = certificatesData.filter(c => c.status === 'rejected').length;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = certificatesData.length;
}
// Fin stats

// Début vue détail
function viewCertificate(certId) {
    const cert = certificatesData.find(c => c.id === certId); if (!cert) return;
    currentCertId = certId;
    const footballeur = cert.footballeur || {};
    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    let preview = ''; if (cert.file_url) { if (cert.file_url.match(/\.(jpg|jpeg|png|gif)$/i)) preview = `<img src="${cert.file_url}" alt="Aperçu">`; else if (cert.file_url.match(/\.pdf$/i)) preview = `<iframe src="${cert.file_url}" width="100%" height="300px"></iframe>`; else preview = `<div class="file-icon"><i class="fas fa-file"></i></div>`; }
    document.getElementById('certModalBody').innerHTML = `
        <div class="file-preview">${preview}</div>
        <div class="detail-row"><span class="detail-label">Footballeur :</span><span class="detail-value">${footballeur.full_name || 'Inconnu'}</span></div>
        <div class="detail-row"><span class="detail-label">Titre :</span><span class="detail-value">${cert.title}</span></div>
        <div class="detail-row"><span class="detail-label">Année :</span><span class="detail-value">${cert.year}</span></div>
        <div class="detail-row"><span class="detail-label">Type :</span><span class="detail-value">${cert.type}</span></div>
        <div class="detail-row"><span class="detail-label">Statut :</span><span class="detail-value" style="color:${cert.status==='approved'?'var(--success)':cert.status==='rejected'?'var(--danger)':'var(--warning)'};">${statusLabels[cert.status]||cert.status}</span></div>
        <div class="detail-row"><span class="detail-label">Fichier :</span><span class="detail-value"><a href="${cert.file_url}" target="_blank">Télécharger</a></span></div>
        <div class="detail-row"><span class="detail-label">Soumis le :</span><span class="detail-value">${new Date(cert.created_at).toLocaleString('fr-FR')}</span></div>
    `;
    document.getElementById('modalApproveBtn').onclick = () => updateStatus(certId, 'approved');
    document.getElementById('modalRejectBtn').onclick = () => updateStatus(certId, 'rejected');
    document.getElementById('modalPendingBtn').onclick = () => updateStatus(certId, 'pending');
    document.getElementById('certDetailModal').style.display = 'flex';
}
function closeDetailModal() { document.getElementById('certDetailModal').style.display = 'none'; currentCertId = null; }
// Fin vue détail

// Début mise à jour statut
async function updateStatus(certId, newStatus) {
    if (!confirm(`Confirmer le changement de statut ?`)) return;
    showLoader(true);
    try {
        const { error } = await supabaseClient.from('supabaseAuthPrive_certifications').update({ status: newStatus, updated_at: new Date() }).eq('id', certId);
        if (error) throw error;
        showToast(`Statut mis à jour`, 'success');
        closeDetailModal();
        loadCertificates();
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}
// Fin mise à jour statut

// Début export
function getFilteredData() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filter = document.getElementById('statusFilter')?.value || 'all';
    return certificatesData.filter(cert => {
        const footballeur = cert.footballeur || {};
        const matchesSearch = (footballeur.full_name || '').toLowerCase().includes(searchTerm) || (cert.title || '').toLowerCase().includes(searchTerm);
        const matchesStatus = filter === 'all' || cert.status === filter;
        return matchesSearch && matchesStatus;
    });
}
async function exportData(format) {
    const data = getFilteredData();
    const rows = data.map(cert => ({ 'Footballeur': cert.footballeur?.full_name || '', 'Titre': cert.title, 'Année': cert.year, 'Type': cert.type, 'Statut': cert.status, 'Soumis le': new Date(cert.created_at).toLocaleDateString('fr-FR') }));
    if (format === 'csv') {
        const csv = [Object.keys(rows[0]||{}).join(','), ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
        downloadBlob(csv, 'certifications.csv', 'text/csv');
    } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, 'Certifications'); XLSX.writeFile(wb, 'certifications.xlsx');
    } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.setFontSize(12); doc.text('Liste des certifications', 14, 20);
        let y = 30; rows.forEach(r => { doc.text(`${r.Footballeur} - ${r.Titre} (${r.Année}) [${r.Statut}]`, 14, y); y += 8; if (y > 280) { doc.addPage(); y = 20; } }); doc.save('certifications.pdf');
    } else if (format === 'docx') {
        const { Document, Packer, Paragraph } = window.docx; const doc = new Document({ sections: [{ children: rows.map(r => new Paragraph(`${r.Footballeur} – ${r.Titre} (${r.Année}) – ${r.Statut}`)) }] });
        Packer.toBlob(doc).then(blob => downloadBlob(blob, 'certifications.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    }
}
function downloadBlob(content, fileName, mimeType) { const blob = new Blob([content], { type: mimeType }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click(); URL.revokeObjectURL(a.href); }
// Fin export

// Début UI Sidebar
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
        if (dx > 0 && sx < 50) open(); else if (dx < 0) close();
    }, { passive: false });
}
// Fin UI Sidebar

// Début UI Menu utilisateur
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin UI Menu utilisateur

// Début UI Déconnexion
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
// Fin UI Déconnexion

// Début événements
document.getElementById('searchInput')?.addEventListener('input', renderCertificates);
document.getElementById('statusFilter')?.addEventListener('change', renderCertificates);
document.getElementById('refreshBtn')?.addEventListener('click', loadCertificates);
document.getElementById('exportBtn')?.addEventListener('click', () => document.getElementById('exportMenu').classList.toggle('show'));
document.querySelectorAll('.export-menu button').forEach(btn => btn.addEventListener('click', () => { exportData(btn.dataset.format); document.getElementById('exportMenu').classList.remove('show'); }));
document.getElementById('langSelect')?.addEventListener('change', e => showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info'));
// Fin événements

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    loadCertificates();
});
// Fin initialisation DOM

// Exposer fonctions globales
window.viewCertificate = viewCertificate;
window.updateStatus = updateStatus;
window.closeDetailModal = closeDetailModal;
window.closeConfirmModal = () => document.getElementById('confirmModal').style.display = 'none';
