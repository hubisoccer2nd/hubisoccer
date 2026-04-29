// ========== TALENT-CONTRAT.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentTalent = null;
let currentClub = null;
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
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

// ========== DÉBUT : CHARGEMENT DES DONNÉES DU TALENT ==========
async function loadTalentData() {
    const params = new URLSearchParams(window.location.search);
    const talentId = params.get('id');
    if (!talentId) {
        showToast('Aucun identifiant fourni.', 'error');
        return;
    }
    try {
        const { data: inscription, error } = await supabasePublic
            .from('nosclub_inscriptions')
            .select('id, club_id, nom_complet')
            .eq('id', talentId)
            .single();
        if (error || !inscription) throw error || new Error('Talent introuvable');
        currentTalent = inscription;

        const { data: club } = await supabasePublic
            .from('nosclub_clubs')
            .select('id, nom')
            .eq('id', inscription.club_id)
            .single();
        currentClub = club;

        // Vérifier si une signature existe déjà
        await checkExistingSignature();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement des données.', 'error');
    }
}

async function checkExistingSignature() {
    if (!currentTalent) return;
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_contrats')
            .select('id, signe_le')
            .eq('inscription_id', currentTalent.id)
            .eq('type_signataire', 'talent')
            .maybeSingle();
        if (data) {
            document.getElementById('signatureStatus').innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> Contrat signé le ${new Date(data.signe_le).toLocaleDateString('fr-FR')}.`;
            document.getElementById('saveSignatureBtn').disabled = true;
            document.getElementById('clearSignatureBtn').disabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : GESTION DU CANVAS DE SIGNATURE ==========
function initCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#4B0082';
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

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
    isDrawing = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function saveSignature() {
    if (!currentTalent || !currentClub) return;
    const signatureData = canvas.toDataURL('image/png');
    if (!signatureData || signatureData === 'data:,') {
        showToast('Veuillez dessiner votre signature.', 'warning');
        return;
    }
    try {
        const { error } = await supabasePublic
            .from('nosclub_contrats')
            .insert([{
                inscription_id: currentTalent.id,
                type_signataire: 'talent',
                contenu_contrat: 'Règlement intérieur du club',
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
document.addEventListener('DOMContentLoaded', () => {
    loadTalentData();
    initCanvas();
});
// ========== FIN DE TALENT-CONTRAT.JS ==========