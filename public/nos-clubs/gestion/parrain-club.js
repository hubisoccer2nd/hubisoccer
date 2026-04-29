// ========== PARRAIN-CLUB.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentClub = null;
let postQuill = null;
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

// ========== DÉBUT : CHARGEMENT DES DONNÉES DU PARRAIN ==========
async function loadParrainData() {
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
        await loadMurPosts();
    } catch (err) {
        console.error(err);
        document.getElementById('murPosts').innerHTML = '<p class="error-message">Erreur de chargement.</p>';
    }
}

async function loadMurPosts() {
    const container = document.getElementById('murPosts');
    if (!currentClub) return;

    try {
        const { data, error } = await supabasePublic
            .from('nosclub_messages')
            .select('*')
            .eq('club_id', currentClub.id)
            .is('destinataire_id', null)      // messages publics (mur)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune publication pour le moment.</p>';
        } else {
            container.innerHTML = data.map(msg => {
                const senderLabel = msg.expediteur_id === 'admin' ? 'Administration' : 'Parrain';
                return `
                    <div class="mur-post">
                        <div class="post-header">
                            <strong><i class="fas fa-user-circle"></i> ${escapeHtml(senderLabel)}</strong>
                            <span>${formatDateTime(msg.created_at)}</span>
                        </div>
                        <div class="post-content">${msg.contenu}</div>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error-message">Erreur chargement du mur.</p>';
    }
}
// ========== FIN : CHARGEMENT DES DONNÉES ==========

// ========== DÉBUT : PUBLICATION SUR LE MUR ==========
async function publishPost() {
    if (!currentClub || !postQuill) return;
    const contenu = postQuill.root.innerHTML.trim();
    if (!contenu || contenu === '<p><br></p>') {
        showToast('Message vide.', 'warning');
        return;
    }

    try {
        const { error } = await supabasePublic
            .from('nosclub_messages')
            .insert([{
                club_id: currentClub.id,
                expediteur_id: 'parrain',
                destinataire_id: null,         // message public sur le mur
                contenu: contenu,
                lu: true,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        postQuill.root.innerHTML = '';
        await loadMurPosts();
        showToast('Publication ajoutée au mur.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la publication.', 'error');
    }
}
// ========== FIN : PUBLICATION SUR LE MUR ==========

// ========== DÉBUT : INITIALISATION QUILL ET ÉVÉNEMENTS ==========
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('postEditor');
    if (editor) {
        postQuill = new Quill(editor, {
            theme: 'snow',
            placeholder: 'Écrivez votre annonce...',
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

    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.addEventListener('click', publishPost);

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

    loadParrainData();
});
// ========== FIN DE PARRAIN-CLUB.JS ==========
