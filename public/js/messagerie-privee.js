// ========== MESSAGERIE-PRIVEE.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'messagerie.logout': 'Déconnexion',
        'messagerie.dashboard': 'Tableau de bord',
        'messagerie.equipe': 'Mon équipe',
        'messagerie.matchs': 'Matchs',
        'messagerie.classement': 'Classement',
        'messagerie.title': 'Messagerie',
        'messagerie.nouveau': '+ Nouveau message',
        'messagerie.nouveau_titre': 'Nouveau message',
        'messagerie.destinataire': 'Destinataire',
        'messagerie.equipe_destinataire': 'Choisir l\'équipe',
        'messagerie.sujet': 'Sujet *',
        'messagerie.contenu': 'Message *',
        'messagerie.envoyer': 'Envoyer',
        'messagerie.admin': 'Administrateur',
        'messagerie.equipe_label': 'Équipe',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.message_sent': 'Message envoyé avec succès.',
        'toast.send_error': 'Erreur lors de l\'envoi.',
        'toast.chargement_erreur': 'Erreur chargement des messages.',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'messagerie.logout': 'Logout',
        'messagerie.dashboard': 'Dashboard',
        'messagerie.equipe': 'My team',
        'messagerie.matchs': 'Matches',
        'messagerie.classement': 'Ranking',
        'messagerie.title': 'Messages',
        'messagerie.nouveau': '+ New message',
        'messagerie.nouveau_titre': 'New message',
        'messagerie.destinataire': 'Recipient',
        'messagerie.equipe_destinataire': 'Choose team',
        'messagerie.sujet': 'Subject *',
        'messagerie.contenu': 'Message *',
        'messagerie.envoyer': 'Send',
        'messagerie.admin': 'Administrator',
        'messagerie.equipe_label': 'Team',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.message_sent': 'Message sent successfully.',
        'toast.send_error': 'Error sending message.',
        'toast.chargement_erreur': 'Error loading messages.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    }
};

let currentLang = localStorage.getItem('messagerie_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) el.placeholder = t(key);
            else el.innerHTML = t(key);
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('messagerie_lang', lang);
        applyTranslations();
        chargerConversations();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const userRole = sessionStorage.getItem('tournoi_role');
const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== VARIABLES GLOBALES ==========
let equipeId = null;
let currentConversationId = null;
let currentDestinataire = null; // { type: 'admin' ou 'equipe', id: id_equipe (si equipe), nom: nom }

// ========== RÉCUPÉRATION DE L'ÉQUIPE DE L'UTILISATEUR ==========
async function getEquipeId() {
    const { data: equipe, error } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe')
        .eq('capitaine_id', userId)
        .single();
    if (equipe && !error) {
        equipeId = equipe.id;
        return equipe;
    }
    // Si membre, chercher equipe_id dans public_utilisateurs_tournoi
    const { data: user } = await supabasePublic
        .from('public_utilisateurs_tournoi')
        .select('equipe_id')
        .eq('id', userId)
        .single();
    if (user && user.equipe_id) {
        equipeId = user.equipe_id;
        const { data: eq } = await supabasePublic.from('public_equipes').select('nom_equipe').eq('id', equipeId).single();
        return { id: equipeId, nom_equipe: eq?.nom_equipe };
    }
    return null;
}

// ========== CHARGEMENT DES CONVERSATIONS ==========
async function chargerConversations() {
    showLoader();
    try {
        const equipe = await getEquipeId();
        // Conversations = messages groupés par expéditeur/destinataire
        // Pour simplifier, on va utiliser la table public_messages_prives
        // On récupère tous les messages où l'utilisateur est expéditeur ou destinataire
        const { data, error } = await supabasePublic
            .from('public_messages_prives')
            .select('*')
            .or(`expediteur_id.eq.${userId},destinataire_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Grouper par conversation (par destinataire ou expéditeur)
        const conversationsMap = new Map();
        for (const msg of data || []) {
            const autreId = msg.expediteur_id === userId ? msg.destinataire_id : msg.expediteur_id;
            if (!conversationsMap.has(autreId)) {
                // Déterminer le nom de l'autre partie
                let autreNom = '';
                let autreType = '';
                if (autreId === 'admin') {
                    autreNom = 'Administrateur';
                    autreType = 'admin';
                } else {
                    // Chercher dans public_utilisateurs_tournoi
                    const { data: autreUser } = await supabasePublic
                        .from('public_utilisateurs_tournoi')
                        .select('login, inscription_id, public_inscriptions_tournoi(nom_complet)')
                        .eq('id', autreId)
                        .single();
                    if (autreUser) {
                        autreNom = autreUser.public_inscriptions_tournoi?.nom_complet || autreUser.login;
                        autreType = 'user';
                    } else {
                        autreNom = 'Inconnu';
                        autreType = 'user';
                    }
                }
                conversationsMap.set(autreId, {
                    autreId: autreId,
                    autreNom: autreNom,
                    autreType: autreType,
                    dernierMessage: msg.contenu,
                    date: msg.created_at
                });
            } else {
                // Mettre à jour le dernier message si plus récent
                const conv = conversationsMap.get(autreId);
                if (new Date(msg.created_at) > new Date(conv.date)) {
                    conv.dernierMessage = msg.contenu;
                    conv.date = msg.created_at;
                }
            }
        }
        const conversations = Array.from(conversationsMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date));
        renderConversations(conversations);
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

function renderConversations(conversations) {
    const container = document.getElementById('conversationsContainer');
    if (!conversations.length) {
        container.innerHTML = '<div class="empty-message">Aucune conversation.</div>';
        return;
    }
    let html = '';
    for (const conv of conversations) {
        html += `
            <div class="conversation-item" data-other-id="${conv.autreId}" data-other-type="${conv.autreType}" data-other-name="${escapeHtml(conv.autreNom)}">
                <div class="conversation-title">${escapeHtml(conv.autreNom)}</div>
                <div class="conversation-preview">${escapeHtml(conv.dernierMessage.substring(0, 60))}${conv.dernierMessage.length > 60 ? '...' : ''}</div>
                <div class="conversation-date">${new Date(conv.date).toLocaleDateString()}</div>
            </div>
        `;
    }
    container.innerHTML = html;
    document.querySelectorAll('.conversation-item').forEach(el => {
        el.addEventListener('click', () => {
            const otherId = el.dataset.otherId;
            const otherType = el.dataset.otherType;
            const otherName = el.dataset.otherName;
            ouvrirConversation(otherId, otherType, otherName);
            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
        });
    });
}

// ========== OUVERTURE D'UNE CONVERSATION ==========
async function ouvrirConversation(otherId, otherType, otherName) {
    currentConversationId = otherId;
    currentDestinataire = { type: otherType, id: otherId, nom: otherName };
    document.getElementById('messagesArea').style.display = 'flex';
    document.getElementById('conversationHeader').innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(otherName)}`;
    await chargerMessages(otherId);
}

async function chargerMessages(otherId) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_messages_prives')
            .select('*')
            .or(`and(expediteur_id.eq.${userId},destinataire_id.eq.${otherId}),and(expediteur_id.eq.${otherId},destinataire_id.eq.${userId})`)
            .order('created_at', { ascending: true });
        if (error) throw error;
        renderMessages(data || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!messages.length) {
        container.innerHTML = '<div class="empty-message">Aucun message dans cette conversation.</div>';
        return;
    }
    let html = '';
    for (const msg of messages) {
        const isSent = (msg.expediteur_id === userId);
        html += `
            <div class="message-item ${isSent ? 'sent' : 'received'}">
                <div class="message-bubble">
                    <div class="message-sujet">${escapeHtml(msg.sujet)}</div>
                    <div class="message-content">${escapeHtml(msg.contenu)}</div>
                    <div class="message-date">${new Date(msg.created_at).toLocaleString()}</div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ========== ENVOI DE MESSAGE DANS LA CONVERSATION COURANTE ==========
const newMessageContent = document.getElementById('newMessageContent');
const sendMessageBtn = document.getElementById('sendMessageBtn');
sendMessageBtn.addEventListener('click', async () => {
    const contenu = newMessageContent.value.trim();
    if (!contenu) {
        showToast('Veuillez écrire un message.', 'warning');
        return;
    }
    if (!currentConversationId) {
        showToast('Aucune conversation sélectionnée.', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_messages_prives')
            .insert([{
                expediteur_id: userId,
                destinataire_id: currentConversationId,
                sujet: 'Réponse',
                contenu: contenu,
                lu: false,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        newMessageContent.value = '';
        await chargerMessages(currentConversationId);
    } catch (err) {
        console.error(err);
        showToast(t('toast.send_error'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== NOUVEAU MESSAGE (MODALE) ==========
const nouveauModal = document.getElementById('nouveauModal');
const nouveauBtn = document.getElementById('nouveauMessageBtn');
const closeModalBtns = document.querySelectorAll('.close-modal');
const destinataireType = document.getElementById('destinataireType');
const equipeSelectGroup = document.getElementById('equipeSelectGroup');
const equipeDestinataire = document.getElementById('equipeDestinataire');
const sujetMessage = document.getElementById('sujetMessage');
const contenuMessage = document.getElementById('contenuMessage');
const nouveauForm = document.getElementById('nouveauMessageForm');

nouveauBtn.addEventListener('click', async () => {
    // Charger la liste des équipes pour le destinataire "equipe"
    await chargerEquipesDestinataires();
    destinataireType.value = 'admin';
    equipeSelectGroup.style.display = 'none';
    sujetMessage.value = '';
    contenuMessage.value = '';
    nouveauModal.classList.add('active');
});

destinataireType.addEventListener('change', () => {
    if (destinataireType.value === 'equipe') {
        equipeSelectGroup.style.display = 'block';
    } else {
        equipeSelectGroup.style.display = 'none';
    }
});

async function chargerEquipesDestinataires() {
    // Récupérer toutes les équipes du tournoi sauf la sienne
    const { data, error } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe')
        .eq('tournoi_id', tournoiId);
    if (error) return;
    let html = '<option value="">-- Choisir une équipe --</option>';
    for (const eq of data) {
        if (eq.id !== equipeId) {
            html += `<option value="${eq.id}">${escapeHtml(eq.nom_equipe)}</option>`;
        }
    }
    equipeDestinataire.innerHTML = html;
}

nouveauForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = destinataireType.value;
    let destinataireId = null;
    if (type === 'admin') {
        destinataireId = 'admin';
    } else {
        destinataireId = equipeDestinataire.value;
        if (!destinataireId) {
            showToast('Veuillez choisir une équipe.', 'warning');
            return;
        }
        // Trouver le capitaine de cette équipe
        const { data: equipe } = await supabasePublic
            .from('public_equipes')
            .select('capitaine_id')
            .eq('id', destinataireId)
            .single();
        if (equipe && equipe.capitaine_id) {
            destinataireId = equipe.capitaine_id;
        } else {
            showToast('Aucun capitaine trouvé pour cette équipe.', 'error');
            return;
        }
    }
    const sujet = sujetMessage.value.trim();
    const contenu = contenuMessage.value.trim();
    if (!sujet || !contenu) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_messages_prives')
            .insert([{
                expediteur_id: userId,
                destinataire_id: destinataireId,
                sujet: sujet,
                contenu: contenu,
                lu: false,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.message_sent'), 'success');
        nouveauModal.classList.remove('active');
        chargerConversations();
    } catch (err) {
        console.error(err);
        showToast(t('toast.send_error'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== FERMETURE MODALE ==========
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        nouveauModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === nouveauModal) nouveauModal.classList.remove('active');
});

// ========== DÉCONNEXION ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

// ========== MENU MOBILE ET LANGUE ==========
function initMenuMobile() {
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
}
function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

function showToast(message, type = 'info', duration = 3000) {
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
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    await getEquipeId();
    await chargerConversations();
});