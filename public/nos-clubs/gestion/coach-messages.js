// ========== COACH-MESSAGES.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentClub = null;
let replyQuill = null;
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

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR');
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES DONNÉES ==========
async function loadCoachData() {
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id');
    if (!clubId) {
        showToast('Aucun identifiant de club fourni.', 'error');
        return;
    }

    try {
        const { data: club, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('id, nom')
            .eq('id', clubId)
            .single();

        if (error || !club) throw error || new Error('Club introuvable.');

        currentClub = club;
        await loadMessages();
    } catch (err) {
        console.error(err);
        document.getElementById('messagesList').innerHTML = '<p class="error-message">Erreur de chargement.</p>';
    }
}

async function loadMessages() {
    const container = document.getElementById('messagesList');
    if (!currentClub) return;

    try {
        const { data, error } = await supabasePublic
            .from('nosclub_messages')
            .select('*')
            .eq('club_id', currentClub.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun message pour le moment.</p>';
        } else {
            container.innerHTML = data.map(msg => {
                const isCoach = msg.expediteur_id === 'coach' || msg.expediteur_id === 'admin';
                const senderLabel = isCoach ? 'Vous / Admin' : 'Talent';
                return `
                    <div class="message ${isCoach ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div class="message-header">
                                <strong>${escapeHtml(senderLabel)}</strong>
                                <span>${formatDateTime(msg.created_at)}</span>
                            </div>
                            <div class="message-content">${msg.contenu}</div>
                        </div>
                    </div>
                `;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error-message">Erreur chargement messages.</p>';
    }
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : ENVOI DE MESSAGE ==========
async function sendReply() {
    if (!currentClub || !replyQuill) return;
    const contenu = replyQuill.root.innerHTML.trim();
    if (!contenu || contenu === '<p><br></p>') {
        showToast('Message vide.', 'warning');
        return;
    }

    try {
        const { error } = await supabasePublic
            .from('nosclub_messages')
            .insert([{
                club_id: currentClub.id,
                expediteur_id: 'coach',
                destinataire_id: null,
                contenu: contenu,
                lu: false,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        replyQuill.root.innerHTML = '';
        await loadMessages();
        showToast('Message envoyé.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de l\'envoi.', 'error');
    }
}
// ========== FIN : ENVOI DE MESSAGE ==========

// ========== DÉBUT : INITIALISATION QUILL ET ÉVÉNEMENTS ==========
document.addEventListener('DOMContentLoaded', () => {
    const replyEditor = document.getElementById('replyEditor');
    if (replyEditor) {
        replyQuill = new Quill(replyEditor, {
            theme: 'snow',
            placeholder: 'Écrivez votre message...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    ['link', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                ]
            }
        });
    }

    const sendBtn = document.getElementById('sendReplyBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendReply);

    // Menu mobile
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

    loadCoachData();
});
// ========== FIN DE COACH-MESSAGES.JS ==========