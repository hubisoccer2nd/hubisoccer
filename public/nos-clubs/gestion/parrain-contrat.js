// ========== PARRAIN-CONTRAT.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentClub = null;
let allTemplates = [];
let activeTemplate = null;
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastX = 0, lastY = 0;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function sanitizeHtml(html) {
    if (!html) return '';
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/ on\w+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/ on\w+='[^']*'/gi, '');
    return cleaned;
}

function showToast(message, type = 'info', duration = 15000) {
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
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">${escapeHtml(message)}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES TEMPLATES (indépendant du club) ==========
async function loadTemplates() {
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_contrats_templates')
            .select('*')
            .in('type_contrat', ['parrain', 'reglement'])
            .eq('actif', true)
            .order('id', { ascending: true });

        if (error) throw error;
        allTemplates = data || [];
        if (allTemplates.length === 0) {
            document.getElementById('contratContent').innerHTML = '<p class="error-message">Aucun document disponible pour le moment.</p>';
            return;
        }

        renderTabs();
        switchDocument(allTemplates[0]);
    } catch (err) {
        console.error(err);
        document.getElementById('contratContent').innerHTML = '<p class="error-message">Erreur de chargement des documents.</p>';
    }
}

function renderTabs() {
    const tabsContainer = document.getElementById('contratTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = allTemplates.map((tpl, idx) => `
        <button class="tab-btn ${idx === 0 ? 'active' : ''}" data-id="${tpl.id}">
            <i class="fas fa-file-alt"></i> ${escapeHtml(tpl.titre)}
        </button>
    `).join('');

    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = allTemplates.find(t => t.id == btn.dataset.id);
            if (tpl) switchDocument(tpl);
        });
    });
}

function switchDocument(template) {
    activeTemplate = template;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.id == template.id) btn.classList.add('active');
    });

    let contenu = template.contenu_html;

    // Remplacer les placeholders si le club est chargé
    if (currentClub) {
        contenu = contenu
            .replace(/{{president_nom_complet}}/g, 'Sètondji Léonce Régis DOSSOU-YOVO')
            .replace(/{{parrain_nom}}/g, escapeHtml(currentClub.parrain_nom || 'Non désigné'));
    }

    const container = document.getElementById('contratContent');
    container.innerHTML = sanitizeHtml(contenu);
}
// ========== FIN : CHARGEMENT DES TEMPLATES ==========

// ========== DÉBUT : CHARGEMENT DU CLUB ET SIGNATURE ==========
async function loadParrainData(clubId) {
    try {
        const { data: club, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('id, nom, parrain_nom')
            .eq('id', clubId)
            .single();

        if (error || !club) throw error || new Error('Club introuvable.');

        currentClub = club;

        // Recharger le document courant pour mettre à jour les placeholders
        if (activeTemplate) {
            switchDocument(activeTemplate);
        }

        await checkExistingSignature();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement des données du club.', 'error');
    }
}

async function checkExistingSignature() {
    if (!currentClub) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_contrats')
            .select('id, signe_le, type_signataire')
            .eq('club_id', currentClub.id)
            .eq('type_signataire', 'parrain')
            .maybeSingle();

        if (data) {
            document.getElementById('signatureStatus').innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Contrat parrain signé le ${new Date(data.signe_le).toLocaleDateString('fr-FR')}.`;
            document.getElementById('saveSignatureBtn').disabled = true;
            document.getElementById('clearSignatureBtn').disabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
// ========== FIN : CHARGEMENT DU CLUB ET SIGNATURE ==========

// ========== DÉBUT : GESTION DU CANVAS DE SIGNATURE ==========
function initCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';   // noir
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('clearSignatureBtn').addEventListener('click', clearCanvas);
    document.getElementById('saveSignatureBtn').addEventListener('click', saveSignature);
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
        // Événement tactile
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

function startDrawing(e) {
    isDrawing = true;
    const coords = getCanvasCoords(e);
    lastX = coords.x;
    lastY = coords.y;
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastX = coords.x;
    lastY = coords.y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    isDrawing = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastX = coords.x;
    lastY = coords.y;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function saveSignature() {
    if (!currentClub || !activeTemplate) {
        showToast('La signature nécessite que vous soyez connecté via votre compte parrain.', 'warning');
        return;
    }
    const signatureData = canvas.toDataURL('image/png');
    if (!signatureData || signatureData === 'data:,') {
        showToast('Veuillez dessiner votre signature.', 'warning');
        return;
    }

    // Remplacer les placeholders une dernière fois avant d'enregistrer
    let contenuFinal = activeTemplate.contenu_html
        .replace(/{{president_nom_complet}}/g, 'Sètondji Léonce Régis DOSSOU-YOVO')
        .replace(/{{parrain_nom}}/g, escapeHtml(currentClub.parrain_nom || 'Non désigné'));

    try {
        const { error } = await supabasePublic
            .from('nosclub_contrats')
            .insert([{
                club_id: currentClub.id,
                inscription_id: currentClub.id,
                type_signataire: 'parrain',
                contenu_contrat: contenuFinal,
                signature_data: signatureData,
                signe_le: new Date().toISOString()
            }]);

        if (error) throw error;

        showToast('Contrat signé avec succès !', 'success');
        document.getElementById('saveSignatureBtn').disabled = true;
        document.getElementById('clearSignatureBtn').disabled = true;
        document.getElementById('signatureStatus').innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Contrat enregistré.`;
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'enregistrement.', 'error');
    }
}
// ========== FIN : GESTION DU CANVAS DE SIGNATURE ==========

// ========== DÉBUT : MENU MOBILE ET DÉCONNEXION ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'nos-clubs-login.html';
    });
}
// ========== FIN : MENU MOBILE ET DÉCONNEXION ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadTemplates();

    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id');
    if (clubId) {
        await loadParrainData(clubId);
    } else {
        document.getElementById('saveSignatureBtn').disabled = true;
        document.getElementById('clearSignatureBtn').disabled = true;
        document.getElementById('signatureStatus').innerHTML = 'Connectez-vous avec votre compte parrain pour pouvoir signer.';
    }

    initCanvas();
});
// ========== FIN DE PARRAIN-CONTRAT.JS ==========
