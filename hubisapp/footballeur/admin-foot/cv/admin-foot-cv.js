/* ============================================================
   HubISoccer — admin-foot-cv.js
   Administration des CV Professionnels · Footballeur
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
let allCvData = [];
let selectedCv = null;
// Fin état global

// Début fonctions utilitaires
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info', duration = 30000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Fermer"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, duration);
}

function getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function updateAvatarUI() {
    const img = document.getElementById('userAvatar');
    const init = document.getElementById('userAvatarInitials');
    const url = currentAdmin?.avatar_url;
    if (url) {
        if (img) { img.src = url; img.style.display = 'block'; }
        if (init) init.style.display = 'none';
    } else {
        const initials = getInitials(currentAdmin?.full_name || currentAdmin?.display_name || 'A');
        if (init) { init.textContent = initials; init.style.display = 'flex'; }
        if (img) img.style.display = 'none';
    }
}
// Fin fonctions utilitaires

// ============================================================
// VÉRIFICATION ADMIN
// ============================================================

// Début fonction checkAdmin
async function checkAdmin() {
    showLoader(true);
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    const { data: profile, error: profileError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('role_code, full_name, display_name, avatar_url')
        .eq('auth_uuid', user.id)
        .single();
    if (profileError || !profile) {
        window.location.href = '../../../authprive/users/login.html';
        return false;
    }
    if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
        showToast('Accès réservé aux administrateurs', 'error');
        setTimeout(() => window.location.href = '../../../authprive/users/login.html', 2000);
        return false;
    }
    currentAdmin = profile;
    document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
    updateAvatarUI();
    showLoader(false);
    return true;
}
// Fin fonction checkAdmin

// ============================================================
// CHARGEMENT DES CV
// ============================================================

// Début fonction loadCvList
async function loadCvList() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_cv_profiles')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        allCvData = data || [];
        await enrichWithProfiles();
        renderCvTable();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des CV', 'error');
    } finally {
        showLoader(false);
    }
}
// Fin fonction loadCvList

// Début fonction enrichWithProfiles
async function enrichWithProfiles() {
    const userIds = allCvData.map(cv => cv.user_id).filter(Boolean);
    if (!userIds.length) return;
    const { data: profiles } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('auth_uuid, hubisoccer_id, full_name, avatar_url, email, phone, nationality, country, height, weight')
        .in('auth_uuid', userIds);
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.auth_uuid] = p; });
    allCvData = allCvData.map(cv => ({ ...cv, profile: profileMap[cv.user_id] || null }));
}
// Fin fonction enrichWithProfiles

// Début fonction renderCvTable
function renderCvTable() {
    const container = document.getElementById('cvTableContainer');
    if (!container) return;

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    const filtered = allCvData.filter(cv => {
        const profile = cv.profile || {};
        const parsed = parseCvJson(cv.cv_json);
        const fullName = profile.full_name || `${parsed.prenom || ''} ${parsed.nom || ''}`.trim();
        const matchSearch = fullName.toLowerCase().includes(searchTerm) ||
                            (profile.hubisoccer_id || '').toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'all' || cv.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (!filtered.length) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">Aucun CV trouvé.</p>';
        return;
    }

    let html = `
        <table class="cv-table">
            <thead>
                <tr>
                    <th>Joueur</th>
                    <th>HID</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Dernière mise à jour</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(cv => {
        const profile = cv.profile || {};
        const parsed = parseCvJson(cv.cv_json);
        const fullName = profile.full_name || `${parsed.prenom || ''} ${parsed.nom || ''}`.trim();
        const statusLabels = { draft: 'Brouillon', submitted: 'Soumis', approved: 'Validé' };
        const statusLabel = statusLabels[cv.status] || cv.status;
        const avatarUrl = profile.avatar_url || '';
        const initials = getInitials(fullName);

        html += `
            <tr>
                <td>
                    <div class="user-cell">
                        ${avatarUrl ? `<img src="${avatarUrl}" class="user-avatar-small" onerror="this.style.display='none';nextElementSibling.style.display='flex';">` : ''}
                        <div class="avatar-initials-small" style="${avatarUrl ? 'display:none;' : 'display:flex;'}">${initials}</div>
                        <span>${fullName || 'Inconnu'}</span>
                    </div>
                </td>
                <td><code>${profile.hubisoccer_id || '—'}</code></td>
                <td>${profile.email || '—'}</td>
                <td><span class="status-badge ${cv.status}">${statusLabel}</span></td>
                <td>${formatDate(cv.updated_at)}</td>
                <td>
                    <button class="btn-action view" onclick="openCvDetail('${cv.id}')"><i class="fas fa-eye"></i> Examiner</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}
// Fin fonction renderCvTable

// Début fonction parseCvJson
function parseCvJson(json) {
    try { return JSON.parse(json); } catch (e) { return {}; }
}
// Fin fonction parseCvJson

// Début fonction updateStats
function updateStats() {
    document.getElementById('totalCvCount').textContent = allCvData.length;
    document.getElementById('submittedCvCount').textContent = allCvData.filter(c => c.status === 'submitted').length;
    document.getElementById('approvedCvCount').textContent = allCvData.filter(c => c.status === 'approved').length;
    document.getElementById('draftCvCount').textContent = allCvData.filter(c => c.status === 'draft').length;
}
// Fin fonction updateStats

// ============================================================
// MODALE DE DÉTAIL CV
// ============================================================

// Début fonction openCvDetail
async function openCvDetail(cvId) {
    const cv = allCvData.find(c => c.id == cvId);
    if (!cv) return;
    selectedCv = cv;

    // Remplir titre
    const profile = cv.profile || {};
    const parsed = parseCvJson(cv.cv_json);
    const fullName = profile.full_name || `${parsed.prenom || ''} ${parsed.nom || ''}`.trim();
    document.getElementById('cvDetailModalTitle').textContent = `CV de ${fullName}`;

    // Aperçu
    renderCvPreview(cv, profile, parsed);

    // Profil
    document.getElementById('detailHid').textContent = profile.hubisoccer_id || '—';
    document.getElementById('detailFullName').textContent = fullName;
    document.getElementById('detailEmail').textContent = profile.email || '—';
    document.getElementById('detailPhone').textContent = profile.phone || '—';
    document.getElementById('detailNationality').textContent = profile.nationality || '—';
    document.getElementById('detailCountry').textContent = profile.country || '—';
    document.getElementById('detailHeightWeight').textContent = `${profile.height || '—'} cm / ${profile.weight || '—'} kg`;
    document.getElementById('detailStatus').textContent = cv.status;

    // Validation
    document.getElementById('currentStatus').value = cv.status;
    document.getElementById('newStatusSelect').value = cv.status === 'approved' ? 'approved' : (cv.status === 'submitted' ? 'submitted' : 'draft');
    document.getElementById('validationComment').value = '';

    // Historique
    loadValidationHistory(cv.id);

    document.getElementById('cvDetailModal').style.display = 'flex';
}
// Fin fonction openCvDetail

// Début fonction renderCvPreview
function renderCvPreview(cv, profile, parsed) {
    const container = document.getElementById('cvPreviewContainer');
    if (!container) return;

    const fullName = profile.full_name || `${parsed.prenom || ''} ${parsed.nom || ''}`.trim();
    const contactLine = [
        parsed.email || profile.email || '',
        parsed.telephone || profile.phone || '',
        parsed.pays || profile.country || ''
    ].filter(Boolean).join(' · ');

    const age = calculateAge(parsed.dob);
    const avatarUrl = profile.avatar_url || parsed.photo_url || '';

    const formationsHtml = (parsed._education || []).map(f => `
        <div>
            <strong>${escapeHtml(f.diplome || '—')}</strong><br>
            ${escapeHtml(f.etablissement || '')} (${escapeHtml(f.annee || '')})
            ${f.mention ? `<br>Mention : ${escapeHtml(f.mention)}` : ''}
            ${f.description ? `<div style="margin-top:4px;">${f.description}</div>` : ''}
        </div>
    `).join('');

    const experiencesHtml = (parsed._experience || []).map(e => `
        <div>
            <strong>${escapeHtml(e.poste || '—')}</strong> - ${escapeHtml(e.club || '')}<br>
            <em>${escapeHtml(e.periode || '')}</em>
            ${e.description ? `<div style="margin-top:4px;">${e.description}</div>` : ''}
        </div>
    `).join('');

    const skillsHtml = (parsed._techSkills || []).map(s => `<div>${escapeHtml(s.name)} : ${s.level}%</div>`).join('');
    const languagesHtml = (parsed._languages || []).map(l => `<span>${escapeHtml(l.name)} (${escapeHtml(l.level)})</span>`).join(', ');
    const signatureImg = parsed.signature_url ? `<img src="${parsed.signature_url}" style="max-height:60px;">` : '';

    const html = `
        <div class="cv-preview-wrap">
            <div class="cv-preview-header">
                ${avatarUrl ? `<img src="${avatarUrl}" class="cv-preview-avatar">` : `<div class="cv-preview-avatar-init">${fullName.charAt(0)}</div>`}
                <div>
                    <div class="cv-preview-name">${escapeHtml(fullName)}</div>
                    <div class="cv-preview-role">Footballeur · HubISoccer</div>
                    <div class="cv-preview-contacts">${escapeHtml(contactLine)} · ${age} ans</div>
                </div>
            </div>
            <div class="cv-preview-body">
                <div class="cv-col-left">
                    <div class="cv-section-head">Formation</div> ${formationsHtml || '<p>—</p>'}
                    <div class="cv-section-head">Compétences</div> ${skillsHtml || '<p>—</p>'}
                    <div class="cv-section-head">Langues</div> ${languagesHtml || '<p>—</p>'}
                </div>
                <div class="cv-col-right">
                    <div class="cv-section-head">Expériences</div> ${experiencesHtml || '<p>—</p>'}
                </div>
            </div>
            <div class="cv-preview-footer">
                <span>Fait le ${parsed.dateSignature || '…'} à ${parsed.lieuSignature || '…'}</span>
                ${signatureImg}
            </div>
        </div>
    `;
    container.innerHTML = html;
}
// Fin fonction renderCvPreview

// Début fonction closeCvDetailModal
function closeCvDetailModal() {
    document.getElementById('cvDetailModal').style.display = 'none';
    selectedCv = null;
}
// Fin fonction closeCvDetailModal

// Début fonction escapeHtml
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
}
// Fin fonction escapeHtml

// Début fonction calculateAge
function calculateAge(dateString) {
    if (!dateString) return '—';
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}
// Fin fonction calculateAge

// ============================================================
// VALIDATION / REJET DE CV
// ============================================================

// Début événement sur le bouton d'application du statut
document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('applyStatusBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            if (!selectedCv) return;
            const newStatus = document.getElementById('newStatusSelect').value;
            const comment = document.getElementById('validationComment').value.trim();
            if (newStatus === selectedCv.status) {
                showToast('Aucun changement de statut', 'warning');
                return;
            }

            showLoader(true);
            const updates = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };
            if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString();
            if (newStatus === 'approved') updates.validated_at = new Date().toISOString();

            const { error } = await supabaseClient
                .from('supabaseAuthPrive_cv_profiles')
                .update(updates)
                .eq('id', selectedCv.id);
            showLoader(false);

            if (error) {
                showToast('Erreur lors de la mise à jour: ' + error.message, 'error');
            } else {
                // Enregistrer dans l'historique
                await supabaseClient.from('supabaseAuthPrive_cv_validation_history').insert([{
                    cv_id: selectedCv.id,
                    admin_id: currentAdmin.auth_uuid,
                    previous_status: selectedCv.status,
                    new_status: newStatus,
                    comment: comment || null,
                    created_at: new Date().toISOString()
                }]);

                // Envoyer une notification au joueur
                const notifiedName = selectedCv.profile?.full_name || 'Footballeur';
                await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
                    recipient_hubisoccer_id: selectedCv.profile?.hubisoccer_id || '',
                    type: 'cv_status',
                    title: newStatus === 'approved' ? '✅ CV Validé !' : `📝 CV ${newStatus === 'draft' ? 'repasse en brouillon' : 'mis à jour'}`,
                    message: `Votre CV professionnel est maintenant "${newStatus}". ${comment ? 'Commentaire : ' + comment : ''}`,
                    read: false,
                    created_at: new Date().toISOString()
                }]);

                // Mettre à jour localement
                selectedCv.status = newStatus;
                if (newStatus === 'submitted') selectedCv.submitted_at = new Date().toISOString();
                if (newStatus === 'approved') selectedCv.validated_at = new Date().toISOString();
                document.getElementById('currentStatus').value = newStatus;
                document.getElementById('newStatusSelect').value = newStatus;
                showToast(`CV ${newStatus === 'approved' ? 'validé' : (newStatus === 'draft' ? 'repasse en brouillon' : 'soumis')} avec succès`, 'success');
                loadCvList(); // rafraîchir la table
                loadValidationHistory(selectedCv.id);
            }
        });
    }
});
// Fin événement statut

// Début fonction loadValidationHistory
async function loadValidationHistory(cvId) {
    const container = document.getElementById('validationHistoryContainer');
    if (!container) return;
    const { data } = await supabaseClient
        .from('supabaseAuthPrive_cv_validation_history')
        .select('*')
        .eq('cv_id', cvId)
        .order('created_at', { ascending: false });
    if (!data || data.length === 0) {
        container.innerHTML = '<p>Aucun historique.</p>';
        return;
    }
    let html = '<ul class="history-list">';
    data.forEach(h => {
        html += `
            <li>
                <span class="history-item">
                    <strong>${h.previous_status} → ${h.new_status}</strong>
                    <span style="font-size:0.8rem;color:var(--gray);">${formatDate(h.created_at)}</span>
                    ${h.comment ? `<p style="font-size:0.9rem;">${escapeHtml(h.comment)}</p>` : ''}
                </span>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}
// Fin fonction loadValidationHistory

// ============================================================
// UI SIDEBAR & MENU
// ============================================================

// Début fonction initSidebar
function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
}
// Fin fonction initSidebar

// Début fonction initUserMenu
function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout

// ============================================================
// EXPORT
// ============================================================

// Début fonction exportCvData
function exportCvData(format) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const filtered = allCvData.filter(cv => {
        const profile = cv.profile || {};
        const fullName = profile.full_name || '';
        const matchSearch = fullName.toLowerCase().includes(searchTerm) ||
                            (profile.hubisoccer_id || '').toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'all' || cv.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const rows = filtered.map(cv => ({
        'Joueur': cv.profile?.full_name || '',
        'HID': cv.profile?.hubisoccer_id || '',
        'Email': cv.profile?.email || '',
        'Statut': cv.status,
        'Mise à jour': formatDate(cv.updated_at)
    }));

    if (format === 'csv') {
        const csv = [Object.keys(rows[0]||{}).join(','), ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
        downloadBlob(csv, 'cv_pro.csv', 'text/csv');
    } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'CV');
        XLSX.writeFile(wb, 'cv_pro.xlsx');
    } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text('Liste des CV Pro', 14, 20);
        let y = 30;
        rows.forEach(r => {
            doc.text(`${r.Joueur} – ${r.HID} (${r.Statut})`, 14, y);
            y += 8;
            if (y > 280) { doc.addPage(); y = 20; }
        });
        doc.save('cv_pro.pdf');
    }
    document.getElementById('exportMenu')?.classList.remove('show');
}
// Fin fonction exportCvData

// Début fonction downloadBlob
function downloadBlob(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}
// Fin fonction downloadBlob

// ============================================================
// INITIALISATION
// ============================================================

// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdmin()) return;
    initSidebar();
    initUserMenu();
    initLogout();

    document.getElementById('searchInput')?.addEventListener('input', renderCvTable);
    document.getElementById('statusFilter')?.addEventListener('change', renderCvTable);
    document.getElementById('refreshBtn')?.addEventListener('click', loadCvList);
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        document.getElementById('exportMenu').classList.toggle('show');
    });

    document.querySelectorAll('.export-menu button').forEach(btn => {
        btn.addEventListener('click', () => exportCvData(btn.dataset.format));
    });

    // Gestion des onglets dans la modale
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    await loadCvList();

    // Exposer fonctions globales
    window.openCvDetail = openCvDetail;
    window.closeCvDetailModal = closeCvDetailModal;
});
// Fin initialisation DOM
