// ========== MESSAGES-ADMIN.JS (CORRIGÉ) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== UTILITAIRES ==========
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Cache simple pour les noms d'utilisateurs
const userNomCache = new Map();

async function getUserNom(userId) {
    if (userId === 'admin') return 'Administrateur';
    if (userNomCache.has(userId)) return userNomCache.get(userId);
    try {
        // Récupérer l'utilisateur via public_utilisateurs_tournoi
        const { data: user, error } = await supabaseAdmin
            .from('public_utilisateurs_tournoi')
            .select('login, inscription_id')
            .eq('id', userId)
            .single();
        if (error || !user) return 'Utilisateur inconnu';
        let nom = user.login || 'Utilisateur';
        if (user.inscription_id) {
            const { data: inscription, error: insError } = await supabaseAdmin
                .from('public_inscriptions_tournoi')
                .select('nom_complet')
                .eq('id', user.inscription_id)
                .single();
            if (!insError && inscription && inscription.nom_complet) {
                nom = inscription.nom_complet;
            }
        }
        userNomCache.set(userId, nom);
        return nom;
    } catch (e) {
        console.error(e);
        return 'Utilisateur inconnu';
    }
}

// ========== ONGLETS ==========
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'public') chargerMessagesPublics();
        else if (tabId === 'prive') chargerMessagesPrives();
    });
});

// ========== MESSAGES PUBLICS (contact) ==========
const publicContainer = document.getElementById('publicMessagesList');
const publicFilterSelect = document.getElementById('publicFilter');
const refreshPublicBtn = document.getElementById('refreshPublicBtn');

async function chargerMessagesPublics() {
    showLoader();
    try {
        let query = supabaseAdmin.from('public_contact_messages').select('*').order('created_at', { ascending: false });
        const filtre = publicFilterSelect ? publicFilterSelect.value : 'all';
        if (filtre === 'non_lu') query = query.eq('lu', false);
        else if (filtre === 'lu') query = query.eq('lu', true);
        const { data, error } = await query;
        if (error) throw error;
        renderMessagesPublics(data || []);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement messages publics', 'error');
    } finally {
        hideLoader();
    }
}

function renderMessagesPublics(messages) {
    if (!publicContainer) return;
    if (!messages.length) {
        publicContainer.innerHTML = '<div class="empty-message">Aucun message public.</div>';
        return;
    }
    let html = '';
    for (const msg of messages) {
        const nonLuClass = !msg.lu ? 'non-lu' : '';
        html += `
            <div class="message-card ${nonLuClass}" data-id="${msg.id}">
                <div class="message-header">
                    <span class="message-expediteur">${escapeHtml(msg.nom)} (${escapeHtml(msg.email)})</span>
                    <span class="message-date">${new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div class="message-sujet">📌 ${escapeHtml(msg.sujet)}</div>
                <div class="message-contenu">${escapeHtml(msg.message)}</div>
                <div class="message-actions">
                    ${!msg.lu ? `<button class="btn-marquer-lu" data-id="${msg.id}">Marquer comme lu</button>` : ''}
                    <button class="btn-supprimer" data-id="${msg.id}">Supprimer</button>
                </div>
            </div>
        `;
    }
    publicContainer.innerHTML = html;
    // Attacher les événements
    document.querySelectorAll('#publicMessagesList .btn-marquer-lu').forEach(btn => {
        btn.addEventListener('click', () => marquerLuPublic(btn.dataset.id));
    });
    document.querySelectorAll('#publicMessagesList .btn-supprimer').forEach(btn => {
        btn.addEventListener('click', () => supprimerMessagePublic(btn.dataset.id));
    });
}

async function marquerLuPublic(id) {
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_contact_messages').update({ lu: true }).eq('id', id);
        if (error) throw error;
        showToast('Message marqué comme lu', 'success');
        chargerMessagesPublics();
    } catch (err) {
        showToast('Erreur', 'error');
    } finally {
        hideLoader();
    }
}

async function supprimerMessagePublic(id) {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_contact_messages').delete().eq('id', id);
        if (error) throw error;
        showToast('Message supprimé', 'success');
        chargerMessagesPublics();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
}

if (refreshPublicBtn) refreshPublicBtn.addEventListener('click', chargerMessagesPublics);
if (publicFilterSelect) publicFilterSelect.addEventListener('change', chargerMessagesPublics);

// ========== MESSAGES PRIVÉS ==========
const priveContainer = document.getElementById('priveConversationsList');
const priveFilterSelect = document.getElementById('priveFilter');
const refreshPriveBtn = document.getElementById('refreshPriveBtn');
const reponseModal = document.getElementById('reponseModal');
const reponseDestinataireId = document.getElementById('reponseDestinataireId');
const reponseSujet = document.getElementById('reponseSujet');
const reponseOriginal = document.getElementById('reponseOriginal');
const reponseContenu = document.getElementById('reponseContenu');
const envoyerReponseBtn = document.getElementById('envoyerReponseBtn');
let currentDestinataireId = null;

async function chargerMessagesPrives() {
    showLoader();
    try {
        // Récupérer tous les messages privés
        const { data: messages, error } = await supabaseAdmin
            .from('public_messages_prives')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!messages || messages.length === 0) {
            if (priveContainer) priveContainer.innerHTML = '<div class="empty-message">Aucune conversation privée.</div>';
            return;
        }
        // Grouper par interlocuteur (autre que 'admin')
        const conversationsMap = new Map(); // key = autreId
        for (const msg of messages) {
            const autreId = msg.expediteur_id === 'admin' ? msg.destinataire_id : msg.expediteur_id;
            if (!conversationsMap.has(autreId)) {
                // Obtenir le nom de l'interlocuteur (asynchrone mais on va le faire après la boucle pour éviter trop d'appels)
                conversationsMap.set(autreId, {
                    autreId: autreId,
                    dernierMessage: msg.contenu,
                    date: msg.created_at,
                    nonLu: (msg.destinataire_id === 'admin' && !msg.lu)
                });
            } else {
                const conv = conversationsMap.get(autreId);
                if (new Date(msg.created_at) > new Date(conv.date)) {
                    conv.dernierMessage = msg.contenu;
                    conv.date = msg.created_at;
                }
                if (msg.destinataire_id === 'admin' && !msg.lu) conv.nonLu = true;
            }
        }
        // Convertir en tableau et trier par date décroissante
        let conversations = Array.from(conversationsMap.values());
        conversations.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Appliquer le filtre (si 'non_lu' on garde seulement conv.nonLu === true)
        const filtre = priveFilterSelect ? priveFilterSelect.value : 'all';
        if (filtre === 'non_lu') {
            conversations = conversations.filter(conv => conv.nonLu === true);
        }
        // Charger les noms des interlocuteurs (asynchrone)
        for (const conv of conversations) {
            conv.autreNom = await getUserNom(conv.autreId);
        }
        renderConversations(conversations);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement conversations privées', 'error');
    } finally {
        hideLoader();
    }
}

function renderConversations(conversations) {
    if (!priveContainer) return;
    if (!conversations.length) {
        priveContainer.innerHTML = '<div class="empty-message">Aucune conversation privée.</div>';
        return;
    }
    let html = '';
    for (const conv of conversations) {
        const nonLuClass = conv.nonLu ? 'non-lu' : '';
        html += `
            <div class="conversation-card ${nonLuClass}" data-other-id="${conv.autreId}">
                <div class="conversation-header">
                    <span class="conversation-avec">${escapeHtml(conv.autreNom)}</span>
                    <span class="conversation-date">${new Date(conv.date).toLocaleString()}</span>
                </div>
                <div class="conversation-sujet">Dernier message</div>
                <div class="conversation-preview">${escapeHtml(conv.dernierMessage.substring(0, 100))}${conv.dernierMessage.length > 100 ? '...' : ''}</div>
                <div class="conversation-actions">
                    <button class="btn-repondre" data-id="${conv.autreId}" data-nom="${escapeHtml(conv.autreNom)}">Répondre</button>
                    <button class="btn-supprimer" data-id="${conv.autreId}">Toute la conversation</button>
                </div>
            </div>
        `;
    }
    priveContainer.innerHTML = html;
    // Attacher les événements
    document.querySelectorAll('#priveConversationsList .btn-repondre').forEach(btn => {
        btn.addEventListener('click', () => ouvrirReponseModal(btn.dataset.id, btn.dataset.nom));
    });
    document.querySelectorAll('#priveConversationsList .btn-supprimer').forEach(btn => {
        btn.addEventListener('click', () => supprimerConversation(btn.dataset.id));
    });
}

function ouvrirReponseModal(destinataireId, destinataireNom) {
    currentDestinataireId = destinataireId;
    if (reponseDestinataireId) reponseDestinataireId.value = destinataireNom;
    if (reponseSujet) reponseSujet.value = '';
    if (reponseOriginal) reponseOriginal.innerHTML = '';
    if (reponseContenu) reponseContenu.value = '';
    if (reponseModal) reponseModal.classList.add('active');
}

async function envoyerReponsePrivee() {
    if (!currentDestinataireId) {
        showToast('Destinataire invalide', 'error');
        return;
    }
    const sujet = reponseSujet ? reponseSujet.value.trim() : '';
    const contenu = reponseContenu ? reponseContenu.value.trim() : '';
    if (!sujet || !contenu) {
        showToast('Sujet et message requis', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin.from('public_messages_prives').insert({
            expediteur_id: 'admin',
            destinataire_id: currentDestinataireId,
            sujet: sujet,
            contenu: contenu,
            lu: false,
            created_at: new Date().toISOString()
        });
        if (error) throw error;
        showToast('Message envoyé', 'success');
        if (reponseModal) reponseModal.classList.remove('active');
        chargerMessagesPrives(); // rafraîchir la liste
    } catch (err) {
        console.error(err);
        showToast('Erreur envoi message', 'error');
    } finally {
        hideLoader();
    }
}

async function supprimerConversation(autreId) {
    if (!confirm('Supprimer toute la conversation avec cet utilisateur ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_messages_prives')
            .delete()
            .or(`and(expediteur_id.eq.admin,destinataire_id.eq.${autreId}),and(expediteur_id.eq.${autreId},destinataire_id.eq.admin)`);
        if (error) throw error;
        showToast('Conversation supprimée', 'success');
        chargerMessagesPrives();
    } catch (err) {
        showToast('Erreur suppression', 'error');
    } finally {
        hideLoader();
    }
}

if (envoyerReponseBtn) envoyerReponseBtn.addEventListener('click', envoyerReponsePrivee);
if (refreshPriveBtn) refreshPriveBtn.addEventListener('click', chargerMessagesPrives);
if (priveFilterSelect) priveFilterSelect.addEventListener('change', chargerMessagesPrives);

// Fermeture modale
const closeModalBtns = document.querySelectorAll('.close-modal');
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (reponseModal) reponseModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === reponseModal) reponseModal.classList.remove('active');
});

// ========== MENU MOBILE ==========
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
        showToast('Déconnexion (fonctionnalité à venir)', 'info');
    });
}

// ========== INITIALISATION ==========
chargerMessagesPublics();
chargerMessagesPrives();