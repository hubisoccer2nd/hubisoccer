/* ============================================================
   HubISoccer — match-report-export.js
   Export des rapports de match (Word, Excel, PDF) ============================================================ */
'use strict';
// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentMatchId = null;
let allReports = [];

// ═══════════════════════════════════════════════════════════
// 3. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 4. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 30000;
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
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 5. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

// ═══════════════════════════════════════════════════════════
// 6. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    const error = !session;
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 7. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    return userProfile;
}

// ═══════════════════════════════════════════════════════════
// 8. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    if (!userProfile) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');

    if (userName) {
        userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    }

    const avatarUrl = userProfile.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 9. RÉCUPÉRATION DE L'ID DU MATCH DANS L'URL
// ═══════════════════════════════════════════════════════════
function getMatchIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('match_id');
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DES INFOS DU MATCH
// ═══════════════════════════════════════════════════════════
async function loadMatchInfo() {
    if (!currentMatchId) {
        showToast('Aucun match spécifié.', 'error');
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from('gestionnairetournoi_matches')
        .select('id, team_a_id, team_b_id, match_date, tournament_id')
        .eq('id', currentMatchId)
        .single();

    if (error || !match) {
        hideLoader();
        showToast('Match introuvable.', 'error');
        return;
    }

    let teamAName = 'Équipe A';
    let teamBName = 'Équipe B';

    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient
            .from('gestionnairetournoi_teams')
            .select('name')
            .eq('id', match.team_a_id)
            .single();
        if (teamA) teamAName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient
            .from('gestionnairetournoi_teams')
            .select('name')
            .eq('id', match.team_b_id)
            .single();
        if (teamB) teamBName = teamB.name;
    }

    document.getElementById('matchTeams').textContent = teamAName + ' vs ' + teamBName;
    document.getElementById('matchDate').textContent = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';
    if (match.tournament_id) {
        const { data: tData } = await supabaseClient
            .from('gestionnairetournoi_tournaments')
            .select('location')
            .eq('id', match.tournament_id)
            .single();
        document.getElementById('matchLocation').textContent = tData?.location || 'Lieu non précisé';
    }

    hideLoader();
}

// ═══════════════════════════════════════════════════════════
// 11. CHARGEMENT DES RAPPORTS
// ═══════════════════════════════════════════════════════════
async function loadReports() {
    if (!currentMatchId) return;

    showLoader();
    const { data, error } = await supabaseClient
        .from('gestionnairetournoi_match_reports')
        .select('*')
        .eq('match_id', currentMatchId)
        .order('created_at', { ascending: false });
    hideLoader();

    if (error) {
        showToast('Erreur chargement des rapports', 'error');
        return;
    }

    allReports = data || [];
    renderReports();
}

// ═══════════════════════════════════════════════════════════
// 12. RENDU DES RAPPORTS
// ═══════════════════════════════════════════════════════════
function renderReports() {
    const container = document.getElementById('reportsList');
    const exportBtns = document.getElementById('exportButtons');

    if (!allReports.length) {
        container.innerHTML = '<p>Aucun rapport trouvé pour ce match.</p>';
        if (exportBtns) exportBtns.style.display = 'none';
        return;
    }

    if (exportBtns) exportBtns.style.display = 'flex';

    const typeLabels = {
        referee: 'Rapport arbitre',
        commissioner: 'Rapport commissaire',
        medical: 'Rapport médical'
    };

    let html = '';
    allReports.forEach(function(report, index) {
        const content = report.content || {};
        const typeLabel = typeLabels[report.report_type] || report.report_type;
        const date = report.created_at ? new Date(report.created_at).toLocaleString('fr-FR') : '';

        let detailsHtml = '';
        if (report.report_type === 'referee') {
            detailsHtml = '<p><strong>Score :</strong> ' + (content.homeScore || '0') + ' - ' + (content.awayScore || '0') + '</p>' +
                          '<p><strong>Cartons jaunes domicile :</strong> ' + (content.yellowHome || '-') + '</p>' +
                          '<p><strong>Cartons jaunes extérieur :</strong> ' + (content.yellowAway || '-') + '</p>' +
                          '<p><strong>Cartons rouges :</strong> ' + (content.redCards || '-') + '</p>' +
                          (content.remarks ? '<p><strong>Remarques :</strong> ' + escapeHtml(content.remarks) + '</p>' : '');
        } else if (report.report_type === 'commissioner') {
            detailsHtml = '<p><strong>Affluence :</strong> ' + (content.attendance || '-') + '</p>' +
                          '<p><strong>Évaluation organisation :</strong> ' + (content.orgRating || '-') + '/5</p>' +
                          (content.remarks ? '<p><strong>Observations :</strong> ' + escapeHtml(content.remarks) + '</p>' : '');
        } else if (report.report_type === 'medical') {
            detailsHtml = '<p><strong>Blessures domicile :</strong> ' + (content.injuriesHome || '-') + '</p>' +
                          '<p><strong>Blessures extérieur :</strong> ' + (content.injuriesAway || '-') + '</p>' +
                          '<p><strong>Interventions médicales :</strong> ' + (content.medicalInterventions || '-') + '</p>' +
                          (content.advice ? '<p><strong>Recommandations :</strong> ' + escapeHtml(content.advice) + '</p>' : '');
        }

        html += '<div class="report-item">' +
                '<div class="report-header">' +
                '<h3><i class="fas fa-file-alt"></i> ' + typeLabel + '</h3>' +
                '<span class="report-date">' + date + '</span>' +
                '</div>' +
                '<div class="report-details">' + detailsHtml + '</div>' +
                (report.file_url ? '<p><a href="' + report.file_url + '" target="_blank"><i class="fas fa-paperclip"></i> Pièce jointe</a></p>' : '') +
                '</div>';
    });

    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 13. FONCTIONS D'EXPORT
// ═══════════════════════════════════════════════════════════

// Export Word (format .doc basique)
function exportToWord() {
    if (!allReports.length) {
        showToast('Aucun rapport à exporter.', 'warning');
        return;
    }

    let htmlContent = '<html><head><meta charset="UTF-8"><style>body { font-family: Arial; } h1 { color: #551B8C; }</style></head><body>';
    htmlContent += '<h1>Rapports de match</h1>';
    htmlContent += '<p>' + document.getElementById('matchTeams').textContent + '</p>';
    htmlContent += '<p>' + document.getElementById('matchDate').textContent + '</p>';

    allReports.forEach(function(report) {
        const content = report.content || {};
        htmlContent += '<hr><h2>' + (report.report_type) + '</h2>';
        if (report.report_type === 'referee') {
            htmlContent += '<p>Score : ' + (content.homeScore || '0') + ' - ' + (content.awayScore || '0') + '</p>';
            htmlContent += '<p>Jaunes domicile : ' + (content.yellowHome || '-') + '</p>';
            htmlContent += '<p>Jaunes extérieur : ' + (content.yellowAway || '-') + '</p>';
            htmlContent += '<p>Rouges : ' + (content.redCards || '-') + '</p>';
            if (content.remarks) htmlContent += '<p>Remarques : ' + content.remarks + '</p>';
        } else if (report.report_type === 'commissioner') {
            htmlContent += '<p>Affluence : ' + (content.attendance || '-') + '</p>';
            htmlContent += '<p>Évaluation : ' + (content.orgRating || '-') + '/5</p>';
            if (content.remarks) htmlContent += '<p>Observations : ' + content.remarks + '</p>';
        } else if (report.report_type === 'medical') {
            htmlContent += '<p>Blessures domicile : ' + (content.injuriesHome || '-') + '</p>';
            htmlContent += '<p>Blessures extérieur : ' + (content.injuriesAway || '-') + '</p>';
            htmlContent += '<p>Interventions : ' + (content.medicalInterventions || '-') + '</p>';
            if (content.advice) htmlContent += '<p>Recommandations : ' + content.advice + '</p>';
        }
    });

    htmlContent += '</body></html>';

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_match_' + (currentMatchId || 'export') + '.doc';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export Word généré avec succès !', 'success');
}

// Export Excel (CSV)
function exportToExcel() {
    if (!allReports.length) {
        showToast('Aucun rapport à exporter.', 'warning');
        return;
    }

    let csv = 'Type;Date;Détails\n';
    allReports.forEach(function(report) {
        const content = report.content || {};
        let details = '';
        if (report.report_type === 'referee') {
            details = 'Score: ' + (content.homeScore || '0') + '-' + (content.awayScore || '0') + ' | Jaunes D: ' + (content.yellowHome || '') + ' | Jaunes E: ' + (content.yellowAway || '') + ' | Rouges: ' + (content.redCards || '');
        } else if (report.report_type === 'commissioner') {
            details = 'Affluence: ' + (content.attendance || '') + ' | Éval: ' + (content.orgRating || '');
        } else if (report.report_type === 'medical') {
            details = 'Blessures D: ' + (content.injuriesHome || '') + ' | Blessures E: ' + (content.injuriesAway || '') + ' | Interventions: ' + (content.medicalInterventions || '');
        }
        const date = report.created_at ? new Date(report.created_at).toLocaleString('fr-FR') : '';
        csv += '"' + report.report_type + '";"' + date + '";"' + details.replace(/"/g, '""') + '"\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_match_' + (currentMatchId || 'export') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export Excel généré avec succès !', 'success');
}

// Export PDF (via html2pdf)
function exportToPDF() {
    if (!allReports.length) {
        showToast('Aucun rapport à exporter.', 'warning');
        return;
    }

    // Construire le contenu HTML pour le PDF
    let htmlContent = '<div style="font-family: Arial; padding: 20px;">';
    htmlContent += '<h1 style="color: #551B8C;">Rapports de match</h1>';
    htmlContent += '<p><strong>' + document.getElementById('matchTeams').textContent + '</strong></p>';
    htmlContent += '<p>' + document.getElementById('matchDate').textContent + ' - ' + document.getElementById('matchLocation').textContent + '</p>';

    allReports.forEach(function(report) {
        const content = report.content || {};
        htmlContent += '<hr><h2 style="color: #551B8C;">' + report.report_type + '</h2>';
        if (report.report_type === 'referee') {
            htmlContent += '<p><strong>Score :</strong> ' + (content.homeScore || '0') + ' - ' + (content.awayScore || '0') + '</p>';
            htmlContent += '<p><strong>Cartons jaunes domicile :</strong> ' + (content.yellowHome || '-') + '</p>';
            htmlContent += '<p><strong>Cartons jaunes extérieur :</strong> ' + (content.yellowAway || '-') + '</p>';
            htmlContent += '<p><strong>Cartons rouges :</strong> ' + (content.redCards || '-') + '</p>';
            if (content.remarks) htmlContent += '<p><strong>Remarques :</strong> ' + content.remarks + '</p>';
        } else if (report.report_type === 'commissioner') {
            htmlContent += '<p><strong>Affluence :</strong> ' + (content.attendance || '-') + '</p>';
            htmlContent += '<p><strong>Évaluation :</strong> ' + (content.orgRating || '-') + '/5</p>';
            if (content.remarks) htmlContent += '<p><strong>Observations :</strong> ' + content.remarks + '</p>';
        } else if (report.report_type === 'medical') {
            htmlContent += '<p><strong>Blessures domicile :</strong> ' + (content.injuriesHome || '-') + '</p>';
            htmlContent += '<p><strong>Blessures extérieur :</strong> ' + (content.injuriesAway || '-') + '</p>';
            htmlContent += '<p><strong>Interventions :</strong> ' + (content.medicalInterventions || '-') + '</p>';
            if (content.advice) htmlContent += '<p><strong>Recommandations :</strong> ' + content.advice + '</p>';
        }
        if (report.file_url) htmlContent += '<p>Pièce jointe : ' + report.file_url + '</p>';
    });

    htmlContent += '</div>';

    const opt = {
        margin: 10,
        filename: 'rapport_match_' + (currentMatchId || 'export') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(htmlContent).save();
    showToast('Export PDF généré avec succès !', 'success');
}

// ═══════════════════════════════════════════════════════════
// 14. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() {
                window.location.href = '../../../index.html';
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 15. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();

    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        showToast('Langue : ' + selectedOption.text, 'info');
    });

    currentMatchId = getMatchIdFromUrl();
    await loadMatchInfo();
    await loadReports();

    document.getElementById('exportWordBtn')?.addEventListener('click', exportToWord);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('backBtn')?.addEventListener('click', function() {
        window.history.back();
    });
});