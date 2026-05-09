/* ============================================================
   HubISoccer — admin-foot-videos.js
   Administration Footballeur · Vidéos & Photos
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
let mediaData = [];
let currentMediaId = null;
let currentMediaUrl = null;
let annotationCanvas = null;
let annotationCtx = null;
let isDrawing = false;
let currentTool = 'select';
let startX, startY;
let currentColor = '#FF0000';
let annotationImage = new Image();
let analysesList = [];
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

// Début chargement médias
async function loadMedia() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_media')
            .select(`*, footballeur:user_hubisoccer_id ( hubisoccer_id, full_name )`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        mediaData = (data || []).map(m => ({ ...m, footballeur_name: m.footballeur?.full_name || 'Inconnu' }));
        renderMedia();
        updateStats();
    } catch (err) { console.error(err); showToast('Erreur chargement médias', 'error'); }
    finally { showLoader(false); }
}
// Fin chargement médias

// Début rendu grille
function renderMedia() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const filtered = mediaData.filter(m => {
        const matchesSearch = (m.title || '').toLowerCase().includes(search) || (m.footballeur_name || '').toLowerCase().includes(search);
        const matchesType = !typeFilter || m.type === typeFilter;
        const matchesStatus = !statusFilter || m.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });
    const container = document.getElementById('mediaGrid');
    if (!container) return;
    if (!filtered.length) { container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;grid-column:1/-1;">Aucun média trouvé.</p>'; return; }
    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    container.innerHTML = filtered.map(m => {
        const typeIcon = m.type === 'video' ? 'fa-video' : 'fa-image';
        const thumbnail = m.thumbnail_url ? `<img src="${m.thumbnail_url}" class="media-thumb">` : `<div class="media-thumb"><i class="fas ${typeIcon}"></i></div>`;
        return `
            <div class="media-card ${m.status}" data-media-id="${m.id}">
                ${thumbnail}
                <div class="media-card-info">
                    <div class="media-card-title">${m.title || 'Sans titre'}</div>
                    <div class="media-card-player">${m.footballeur_name}</div>
                    <div class="media-card-date">${new Date(m.created_at).toLocaleDateString('fr-FR')}</div>
                    <span class="media-card-status ${m.status}">${statusLabels[m.status]||m.status}</span>
                </div>
                <div class="media-card-actions">
                    <button class="btn-action view" onclick="viewMedia(${m.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn-action approve" onclick="updateStatus(${m.id}, 'approved')"><i class="fas fa-check"></i></button>
                    <button class="btn-action reject" onclick="updateStatus(${m.id}, 'rejected')"><i class="fas fa-times"></i></button>
                    <button class="btn-action pending" onclick="updateStatus(${m.id}, 'pending')"><i class="fas fa-clock"></i></button>
                    <button class="btn-action delete" onclick="confirmDeleteMedia(${m.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}
// Fin rendu grille

// Début stats
function updateStats() {
    document.getElementById('pendingCount').textContent = mediaData.filter(m => m.status === 'pending').length;
    document.getElementById('approvedCount').textContent = mediaData.filter(m => m.status === 'approved').length;
    document.getElementById('rejectedCount').textContent = mediaData.filter(m => m.status === 'rejected').length;
    document.getElementById('totalCount').textContent = mediaData.length;
}
// Fin stats

// Début vue détail
async function viewMedia(mediaId) {
    const media = mediaData.find(m => m.id === mediaId); if (!media) return;
    currentMediaId = mediaId;
    currentMediaUrl = media.url;

    // Informations
    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    const mediaHtml = media.type === 'video' ? `<video controls src="${media.url}" style="max-width:100%; max-height:300px;"></video>` : `<img src="${media.url}" style="max-width:100%; max-height:300px;">`;
    document.getElementById('detailInfoContent').innerHTML = `
        ${mediaHtml}
        <div style="margin-top:20px;"><strong>${media.title}</strong></div>
        <div>Footballeur : ${media.footballeur_name}</div>
        <div>Description : ${media.description || '—'}</div>
        <div>Statut : <span style="color:${media.status==='approved'?'var(--success)':media.status==='rejected'?'var(--danger)':'var(--warning)'};">${statusLabels[media.status]}</span></div>
        <div>Soumis le : ${new Date(media.created_at).toLocaleString('fr-FR')}</div>
    `;

    // Commentaires
    await loadCommentsForMedia(mediaId);

    // Analyses (images annotées)
    await loadAnalysesForMedia(mediaId);

    // Activer l'onglet info par défaut
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.detail-tab[data-tab="info"]').classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-info').classList.add('active');

    // Configurer les boutons de la modale
    document.getElementById('modalApproveBtn').onclick = () => updateStatus(mediaId, 'approved');
    document.getElementById('modalRejectBtn').onclick = () => updateStatus(mediaId, 'rejected');
    document.getElementById('modalPendingBtn').onclick = () => updateStatus(mediaId, 'pending');
    document.getElementById('modalDeleteBtn').onclick = () => confirmDeleteMedia(mediaId);
    document.getElementById('modalDownloadBtn').onclick = () => window.open(media.url, '_blank');

    document.getElementById('detailModal').style.display = 'flex';
}

async function loadCommentsForMedia(mediaId) {
    try {
        const { data: comments, error } = await supabaseClient
            .from('supabaseAuthPrive_media_comments')
            .select(`*, author:author_hubisoccer_id ( full_name )`)
            .eq('media_id', mediaId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        const html = (comments || []).map(c => `
            <div class="comment-item">
                <div><strong>${c.author?.full_name || 'Anonyme'}</strong> - ${new Date(c.created_at).toLocaleString()}</div>
                <div>${c.content}</div>
                <button class="btn-action delete" onclick="deleteComment(${c.id})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('') || '<p>Aucun commentaire.</p>';
        document.getElementById('detailCommentsContent').innerHTML = html;
    } catch (err) { console.error(err); }
}

async function loadAnalysesForMedia(mediaId) {
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_media_analyses')
            .select('*')
            .eq('media_id', mediaId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        analysesList = data || [];
        const html = analysesList.map(a => `
            <div class="analysis-item">
                <img src="${a.image_url}" style="max-width:100px; max-height:100px;">
                <div>
                    <button class="btn-action" onclick="window.open('${a.image_url}','_blank')"><i class="fas fa-eye"></i></button>
                    <button class="btn-action delete" onclick="deleteAnalysis(${a.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('') || '<p>Aucune analyse.</p>';
        document.getElementById('detailAnalysesContent').innerHTML = `
            <div style="margin-bottom:16px;">
                <button class="btn-action" onclick="openAnnotationModal()"><i class="fas fa-pen"></i> Nouvelle annotation</button>
            </div>
            <div class="analyses-grid">${html}</div>
        `;
    } catch (err) { console.error(err); }
}

function closeDetailModal() { document.getElementById('detailModal').style.display = 'none'; currentMediaId = null; }
// Fin vue détail

// Début mise à jour statut
async function updateStatus(mediaId, newStatus) {
    if (!confirm(`Confirmer le changement de statut ?`)) return;
    showLoader(true);
    try {
        const { error } = await supabaseClient.from('supabaseAuthPrive_media').update({ status: newStatus }).eq('id', mediaId);
        if (error) throw error;
        showToast('Statut mis à jour', 'success');
        closeDetailModal();
        loadMedia();
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}
// Fin mise à jour statut

// Début suppression média
async function deleteMedia(mediaId) {
    const media = mediaData.find(m => m.id === mediaId);
    showLoader(true);
    try {
        // Supprimer le fichier du bucket
        if (media?.url) {
            const urlParts = media.url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            await supabaseClient.storage.from('media-footballeur').remove([fileName]);
        }
        const { error } = await supabaseClient.from('supabaseAuthPrive_media').delete().eq('id', mediaId);
        if (error) throw error;
        showToast('Média supprimé', 'success');
        closeConfirmModal();
        closeDetailModal();
        loadMedia();
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}
function confirmDeleteMedia(mediaId) {
    document.getElementById('confirmModalBody').innerHTML = `<p>Supprimer définitivement ce média ?</p><div class="modal-actions"><button class="btn-cancel" onclick="closeConfirmModal()">Annuler</button><button class="btn-confirm" onclick="deleteMedia(${mediaId})">Confirmer</button></div>`;
    document.getElementById('confirmModal').style.display = 'flex';
}
function closeConfirmModal() { document.getElementById('confirmModal').style.display = 'none'; }
// Fin suppression média

// Début suppression commentaire
async function deleteComment(commentId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    showLoader(true);
    try {
        const { error } = await supabaseClient.from('supabaseAuthPrive_media_comments').delete().eq('id', commentId);
        if (error) throw error;
        showToast('Commentaire supprimé', 'success');
        if (currentMediaId) { await loadCommentsForMedia(currentMediaId); }
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}
// Fin suppression commentaire

// Début module d'annotation
function openAnnotationModal() {
    document.getElementById('annotationModal').style.display = 'flex';
    initAnnotationCanvas();
}
function closeAnnotationModal() { document.getElementById('annotationModal').style.display = 'none'; }

function initAnnotationCanvas() {
    const canvas = document.getElementById('annotationCanvas');
    annotationCtx = canvas.getContext('2d');
    annotationCtx.clearRect(0, 0, canvas.width, canvas.height);
    // Charger une capture de la vidéo (si disponible) ou un placeholder
    if (currentMediaUrl) {
        annotationImage.src = currentMediaUrl; // si c'est une image, sinon utiliser un placeholder
        annotationImage.onload = () => { annotationCtx.drawImage(annotationImage, 0, 0, canvas.width, canvas.height); };
    } else {
        annotationCtx.fillStyle = '#f0f0f0';
        annotationCtx.fillRect(0, 0, canvas.width, canvas.height);
        annotationCtx.fillStyle = '#000';
        annotationCtx.font = '16px Poppins';
        annotationCtx.textAlign = 'center';
        annotationCtx.fillText('Chargez une image depuis la vidéo', canvas.width/2, canvas.height/2);
    }
    // Configurer les outils
    setupAnnotationTools();
}

function setupAnnotationTools() {
    const canvas = document.getElementById('annotationCanvas');
    // Nettoyer les anciens listeners
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseout', handleMouseOut);

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseOut);

    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });
    document.getElementById('annotationColor').addEventListener('change', e => currentColor = e.target.value);
    document.getElementById('clearAnnotationBtn').addEventListener('click', () => {
        annotationCtx.clearRect(0, 0, canvas.width, canvas.height);
        if (annotationImage.complete) annotationCtx.drawImage(annotationImage, 0, 0, canvas.width, canvas.height);
    });
    document.getElementById('saveAnnotationBtn').addEventListener('click', saveAnnotation);
}

let tempCanvas = null;
function handleMouseDown(e) {
    const rect = e.target.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    if (currentTool === 'select') return;
    isDrawing = true;
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = annotationCanvas.width;
    tempCanvas.height = annotationCanvas.height;
    tempCanvas.getContext('2d').drawImage(annotationCanvas, 0, 0);
}
function handleMouseMove(e) {
    if (!isDrawing || currentTool === 'select') return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Restaurer depuis tempCanvas
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    annotationCtx.drawImage(tempCanvas, 0, 0);
    annotationCtx.beginPath();
    annotationCtx.strokeStyle = currentColor;
    annotationCtx.fillStyle = currentColor;
    annotationCtx.lineWidth = 3;
    switch (currentTool) {
        case 'pen': annotationCtx.lineTo(x, y); annotationCtx.stroke(); break;
        case 'line': annotationCtx.moveTo(startX, startY); annotationCtx.lineTo(x, y); annotationCtx.stroke(); break;
        case 'arrow': drawArrow(startX, startY, x, y); break;
        case 'rect': annotationCtx.strokeRect(startX, startY, x - startX, y - startY); break;
        case 'circle': const r = Math.sqrt((x-startX)**2 + (y-startY)**2); annotationCtx.beginPath(); annotationCtx.arc(startX, startY, r, 0, 2*Math.PI); annotationCtx.stroke(); break;
        case 'text': annotationCtx.font = '20px Poppins'; const txt = prompt('Texte ?'); if (txt) { annotationCtx.fillText(txt, x, y); } isDrawing = false; break;
    }
}
function handleMouseUp() { isDrawing = false; }
function handleMouseOut() { isDrawing = false; }
function drawArrow(fromX, fromY, toX, toY) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    annotationCtx.beginPath();
    annotationCtx.moveTo(fromX, fromY);
    annotationCtx.lineTo(toX, toY);
    annotationCtx.stroke();
    annotationCtx.beginPath();
    annotationCtx.moveTo(toX, toY);
    annotationCtx.lineTo(toX - headlen * Math.cos(angle - Math.PI/6), toY - headlen * Math.sin(angle - Math.PI/6));
    annotationCtx.lineTo(toX - headlen * Math.cos(angle + Math.PI/6), toY - headlen * Math.sin(angle + Math.PI/6));
    annotationCtx.closePath();
    annotationCtx.fill();
}

async function saveAnnotation() {
    if (!currentMediaId) { showToast('Aucun média sélectionné', 'error'); return; }
    const canvas = document.getElementById('annotationCanvas');
    const dataURL = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataURL)).blob();
    const fileName = `analysis_${currentMediaId}_${Date.now()}.png`;
    showLoader(true);
    try {
        const { error: uploadError } = await supabaseClient.storage.from('media-footballeur').upload(fileName, blob);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseClient.storage.from('media-footballeur').getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;
        const { error: insertError } = await supabaseClient.from('supabaseAuthPrive_media_analyses').insert([{ media_id: currentMediaId, image_url: imageUrl }]);
        if (insertError) throw insertError;
        showToast('Analyse sauvegardée', 'success');
        closeAnnotationModal();
        if (currentMediaId) await loadAnalysesForMedia(currentMediaId);
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}

async function deleteAnalysis(analysisId) {
    if (!confirm('Supprimer cette analyse ?')) return;
    showLoader(true);
    try {
        const { error } = await supabaseClient.from('supabaseAuthPrive_media_analyses').delete().eq('id', analysisId);
        if (error) throw error;
        showToast('Analyse supprimée', 'success');
        if (currentMediaId) await loadAnalysesForMedia(currentMediaId);
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
    finally { showLoader(false); }
}
// Fin module d'annotation

// Début UI Sidebar, Menu, Logout (standard)
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
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = '../../../authprive/users/login.html'; });
    });
}
function initTabs() {
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}
// Fin UI

// Début événements filtres
document.getElementById('searchInput')?.addEventListener('input', renderMedia);
document.getElementById('typeFilter')?.addEventListener('change', renderMedia);
document.getElementById('statusFilter')?.addEventListener('change', renderMedia);
document.getElementById('refreshBtn')?.addEventListener('click', loadMedia);
// Fin événements

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    initTabs();
    loadMedia();
    window.viewMedia = viewMedia;
    window.updateStatus = updateStatus;
    window.confirmDeleteMedia = confirmDeleteMedia;
    window.deleteComment = deleteComment;
    window.closeDetailModal = closeDetailModal;
    window.closeConfirmModal = closeConfirmModal;
    window.openAnnotationModal = openAnnotationModal;
    window.closeAnnotationModal = closeAnnotationModal;
    window.deleteAnalysis = deleteAnalysis;
    document.getElementById('langSelect')?.addEventListener('change', e => showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info'));
});
// Fin initialisation
