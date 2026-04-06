// ========== SUIVI-ACTEUR.JS ==========
// début configuration Supabase (projet public)
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// fin configuration

// début objets de traduction (24 langues)
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.home': 'Accueil',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Devenir acteur',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'suivi_acteur.title': 'Suivi de candidature',
        'suivi_acteur.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi_acteur.placeholder': 'Ex: a5-VA-032714-HubIS-PR-123-00001',
        'suivi_acteur.check': 'Vérifier',
        'suivi_acteur.messages.title': 'Messages',
        'suivi_acteur.messages.send': 'Envoyer un message',
        'suivi_acteur.support': 'Une question ?',
        'suivi_acteur.support.link': 'Contactez le support',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente de validation',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'role_label.PR': 'Parrain',
        'role_label.ST': 'Staff médical',
        'role_label.CO': 'Coach',
        'role_label.AG': 'Agent',
        'role_label.AC': 'Académie',
        'role_label.CL': 'Club',
        'role_label.FO': 'Formateur'
    },
    en: {
        'loader.message': 'Loading...',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Become an actor',
        'nav.tournaments': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'suivi_acteur.title': 'Application tracking',
        'suivi_acteur.subtitle': 'Enter the ID you received after registration.',
        'suivi_acteur.placeholder': 'Ex: a5-VA-032714-HubIS-PR-123-00001',
        'suivi_acteur.check': 'Check',
        'suivi_acteur.messages.title': 'Messages',
        'suivi_acteur.messages.send': 'Send a message',
        'suivi_acteur.support': 'A question?',
        'suivi_acteur.support.link': 'Contact support',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.id_not_found': 'ID not found. Please check your code.',
        'toast.error_check': 'Error during verification.',
        'toast.error_load_messages': 'Error loading messages',
        'toast.empty_message': 'Empty message',
        'toast.message_sent': 'Message sent',
        'toast.error_send': 'Error sending message',
        'toast.enter_id': 'Please enter an ID.',
        'status.en_attente': 'Pending validation',
        'status.valide_public': 'Approved',
        'status.rejete': 'Rejected',
        'role_label.PR': 'Sponsor',
        'role_label.ST': 'Medical staff',
        'role_label.CO': 'Coach',
        'role_label.AG': 'Agent',
        'role_label.AC': 'Academy',
        'role_label.CL': 'Club',
        'role_label.FO': 'Trainer'
    }
};

let currentLang = localStorage.getItem('suivi_acteur_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
        }
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('suivi_acteur_lang', lang);
        applyTranslations();
        if (currentInscription) {
            displayInscription(currentInscription);
            loadMessages(currentInscription.pp_id);
        }
    }
}
// fin traduction

// début variables globales
let currentInscription = null;
let replyQuill = null;
// fin variables

// début fonctions utilitaires
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}
// fin utilitaires

// début chargement inscription
async function loadInscription(ppId) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_inscriptions')
            .select('*')
            .eq('pp_id', ppId)
            .single();

        if (error || !data) {
            showToast(t('toast.id_not_found'), 'error');
            document.getElementById('resultCard').style.display = 'none';
            return null;
        }
        currentInscription = data;
        displayInscription(data);
        await loadMessages(data.pp_id);
        document.getElementById('resultCard').style.display = 'block';
        return data;
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_check'), 'error');
        document.getElementById('resultCard').style.display = 'none';
        return null;
    } finally {
        hideLoader();
    }
}

function displayInscription(ins) {
    // Statut
    const statusBadge = document.getElementById('statusBadge');
    let statusClass = '';
    let statusText = '';
    switch (ins.status) {
        case 'en_attente':
            statusClass = 'en_attente';
            statusText = t('status.en_attente');
            break;
        case 'valide_public':
            statusClass = 'valide_public';
            statusText = t('status.valide_public');
            break;
        case 'rejete':
            statusClass = 'rejete';
            statusText = t('status.rejete');
            break;
        default:
            statusClass = 'en_attente';
            statusText = t('status.en_attente');
    }
    statusBadge.textContent = statusText;
    statusBadge.className = `status-badge ${statusClass}`;
    
    document.getElementById('applicantName').textContent = ins.full_name || 'Candidat';
    
    // Rôle
    const roleLabel = t(`role_label.${ins.role}`) || ins.role;
    
    const infoGrid = document.getElementById('infoGrid');
    infoGrid.innerHTML = `
        <div class="info-item"><strong>ID candidature</strong><span>${escapeHtml(ins.pp_id)}</span></div>
        <div class="info-item"><strong>Rôle</strong><span>${escapeHtml(roleLabel)}</span></div>
        <div class="info-item"><strong>Date de soumission</strong><span>${formatDate(ins.created_at)}</span></div>
        <div class="info-item"><strong>Email</strong><span>${escapeHtml(ins.email)}</span></div>
        <div class="info-item"><strong>Téléphone</strong><span>${escapeHtml(ins.phone)}</span></div>
    `;
    
    // Document justificatif
    if (ins.document_url) {
        infoGrid.innerHTML += `
            <div class="info-item"><strong>Justificatif</strong><span><a href="${ins.document_url}" target="_blank">Télécharger le fichier</a></span></div>
        `;
    }
    
    // Données complémentaires (role_data)
    const roleDataDiv = document.getElementById('roleData');
    if (ins.role_data && Object.keys(ins.role_data).length > 0) {
        let html = '<h3>Informations complémentaires</h3><div class="role-data-grid">';
        for (const [key, value] of Object.entries(ins.role_data)) {
            if (value) {
                html += `<div class="info-item"><strong>${escapeHtml(key.replace(/_/g, ' '))}</strong><span>${escapeHtml(String(value))}</span></div>`;
            }
        }
        html += `</div>`;
        roleDataDiv.innerHTML = html;
        roleDataDiv.style.display = 'block';
    } else {
        roleDataDiv.style.display = 'none';
    }
    
    // Notes admin (si jamais on ajoute un champ admin_notes plus tard)
    const adminNotesDiv = document.getElementById('adminNotes');
    adminNotesDiv.style.display = 'none';
}
// fin chargement

// début messagerie
async function loadMessages(ppId) {
    try {
        const { data: messages, error } = await supabasePublic
            .from('public_acteur_messages')
            .select('*')
            .eq('pp_id', ppId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        renderMessages(messages || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_messages'), 'error');
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    if (messages.length === 0) {
        container.innerHTML = '<p class="empty-message">' + t('suivi_acteur.messages.empty', {}) + '</p>';
        return;
    }
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-bubble">
                <div>${msg.content}</div>
                <div class="message-time">${new Date(msg.created_at).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US')}</div>
            </div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendReply() {
    if (!currentInscription || !replyQuill) return;
    const content = replyQuill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
        showToast(t('toast.empty_message'), 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_acteur_messages')
            .insert([{
                pp_id: currentInscription.pp_id,
                sender: 'candidate',
                content: content
            }]);
        if (error) throw error;
        replyQuill.root.innerHTML = '';
        await loadMessages(currentInscription.pp_id);
        showToast(t('toast.message_sent'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_send'), 'error');
    } finally {
        hideLoader();
    }
}
// fin messagerie

// début initialisation
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    
    // Gestion langue
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Récupération ID dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    const input = document.getElementById('trackingId');
    const checkBtn = document.getElementById('checkBtn');

    if (idFromUrl) {
        input.value = idFromUrl;
        loadInscription(idFromUrl);
    }

    checkBtn.addEventListener('click', () => {
        const id = input.value.trim();
        if (id) loadInscription(id);
        else showToast(t('toast.enter_id'), 'warning');
    });
    
    // Initialisation de Quill après affichage de la carte résultat
    const observer = new MutationObserver(() => {
        const replyEditor = document.getElementById('replyEditor');
        if (replyEditor && !replyQuill && document.getElementById('resultCard').style.display === 'block') {
            replyQuill = new Quill(replyEditor, {
                theme: 'snow',
                placeholder: t('suivi_acteur.messages.placeholder') || 'Écrivez votre message...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['link', 'blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean']
                    ]
                }
            });
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById('resultCard'), { childList: true, subtree: true });
    
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
});
// fin initialisation
// ========== FIN SUIVI-ACTEUR.JS ==========