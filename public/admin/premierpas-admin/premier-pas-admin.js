// ========== PREMIER-PAS-ADMIN.JS ==========
// Configuration Supabase
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Éléments DOM
let currentInscription = null;
let adminQuill = null;
let allInscriptions = [];

const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const inscriptionsListContainer = document.getElementById('inscriptionsListContainer');
const inscriptionDetail = document.getElementById('inscriptionDetail');
const detailName = document.getElementById('detailName');
const detailContent = document.getElementById('detailContent');
const statusSelect = document.getElementById('statusSelect');
const updateStatusBtn = document.getElementById('updateStatusBtn');
const adminMessagesContainer = document.getElementById('adminMessagesContainer');
const sendAdminMsgBtn = document.getElementById('sendAdminMsgBtn');
const diplomaLink = document.getElementById('diplomaLink');
const idCardLink = document.getElementById('idCardLink');

// Utilitaires
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
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatSportKey(key) {
    const labels = {
        poste: 'Poste', piedDominant: 'Pied dominant', taille: 'Taille (cm)', poids: 'Poids (kg)',
        statistiques: 'Statistiques', club: 'Club', anneesPratique: 'Années pratique',
        niveau: 'Niveau', mainDominante: 'Main dominante', envergure: 'Envergure (cm)',
        detente: 'Détente (cm)', typeJeu: 'Type jeu', coupDroit: 'Coup droit', revers: 'Revers',
        classement: 'Classement', surfacePref: 'Surface préférée', meilleurResultat: 'Meilleur résultat',
        vitesseService: 'Vitesse service (km/h)', discipline: 'Discipline', meilleurePerf: 'Meilleure performance',
        record100: 'Record 100m', record10k: 'Record 10km', entrainementsSemaine: 'Entraînements/sem',
        blessures: 'Blessures', vitesseTir: 'Vitesse tir (km/h)', detenteAttaque: 'Détente attaque (cm)',
        detenteContre: 'Détente contre (cm)', vitesse40: 'Vitesse 40m (s)', plaquage: 'Plaquage',
        matchsSaison: 'Matchs saison', nage: 'Nage', meilleur50: '50m', meilleur100: '100m',
        meilleur200: '200m', chrono50: 'Chrono 50m', grade: 'Grade', poidsCompetition: 'Poids compétition (kg)',
        palmares: 'Palmarès', specialite: 'Spécialité', preparationPhysique: 'Préparation physique',
        ftp: 'FTP (W)', fcm: 'FC max', kmSemaine: 'Km/semaine'
    };
    return labels[key] || key;
}

// Chargement des inscriptions
async function loadInscriptions() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_premierpas')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        allInscriptions = data || [];
        filterAndRenderList();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement inscriptions', 'error');
    } finally {
        hideLoader();
    }
}

function filterAndRenderList() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    let filtered = allInscriptions.filter(ins => {
        const matchSearch = ins.full_name.toLowerCase().includes(searchTerm) ||
                            ins.pp_id.toLowerCase().includes(searchTerm) ||
                            (ins.phone && ins.phone.includes(searchTerm));
        const matchStatus = status === 'all' || ins.status === status;
        return matchSearch && matchStatus;
    });
    renderList(filtered);
}

function renderList(inscriptions) {
    if (!inscriptionsListContainer) return;
    if (inscriptions.length === 0) {
        inscriptionsListContainer.innerHTML = '<div class="empty-list">Aucune inscription trouvée</div>';
        return;
    }
    inscriptionsListContainer.innerHTML = inscriptions.map(ins => `
        <div class="inscription-item" data-ppid="${ins.pp_id}">
            <div class="inscription-name">${escapeHtml(ins.full_name)}</div>
            <div class="inscription-id">${escapeHtml(ins.pp_id)}</div>
            <div class="inscription-status status-${ins.status}">${getStatusLabel(ins.status)}</div>
        </div>
    `).join('');
    document.querySelectorAll('.inscription-item').forEach(el => {
        el.addEventListener('click', () => {
            const ppId = el.getAttribute('data-ppid');
            const selected = allInscriptions.find(i => i.pp_id === ppId);
            if (selected) selectInscription(selected);
            document.querySelectorAll('.inscription-item').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
        });
    });
}

function getStatusLabel(status) {
    switch(status) {
        case 'en_attente': return 'En attente';
        case 'valide_public': return 'Approuvé';
        case 'rejete': return 'Rejeté';
        case 'test_ecrit': return 'Test écrit';
        default: return status;
    }
}

// Affichage du détail
async function selectInscription(ins) {
    currentInscription = ins;
    inscriptionDetail.style.display = 'block';
    detailName.textContent = ins.full_name;
    statusSelect.value = ins.status;
    
    let html = `<div class="info-grid">`;
    html += `<div class="info-item"><strong>ID candidature</strong><span>${escapeHtml(ins.pp_id)}</span></div>`;
    html += `<div class="info-item"><strong>Nom complet</strong><span>${escapeHtml(ins.full_name)}</span></div>`;
    html += `<div class="info-item"><strong>Date de naissance</strong><span>${formatDate(ins.birth_date)}</span></div>`;
    html += `<div class="info-item"><strong>Téléphone</strong><span>${escapeHtml(ins.phone)}</span></div>`;
    html += `<div class="info-item"><strong>Diplôme / formation</strong><span>${escapeHtml(ins.diploma_title)}</span></div>`;
    html += `<div class="info-item"><strong>Sport</strong><span>${escapeHtml(ins.sport)}</span></div>`;
    html += `<div class="info-item"><strong>Rôle</strong><span>${escapeHtml(ins.role)}</span></div>`;
    html += `<div class="info-item"><strong>Soumis le</strong><span>${formatDate(ins.created_at)}</span></div>`;
    if (ins.parent_name) html += `<div class="info-item"><strong>Parent / tuteur</strong><span>${escapeHtml(ins.parent_name)}</span></div>`;
    if (ins.inscription_code) html += `<div class="info-item"><strong>Code inscription</strong><span>${escapeHtml(ins.inscription_code)}</span></div>`;
    if (ins.affiliate_id) html += `<div class="info-item"><strong>ID affilié</strong><span>${escapeHtml(ins.affiliate_id)}</span></div>`;
    html += `</div>`;
    
    if (ins.sport_data && Object.keys(ins.sport_data).length > 0) {
        html += `<div class="sport-data"><h4>Informations sportives</h4><div class="info-grid">`;
        for (const [key, value] of Object.entries(ins.sport_data)) {
            if (value) {
                html += `<div class="info-item"><strong>${formatSportKey(key)}</strong><span>${escapeHtml(String(value))}</span></div>`;
            }
        }
        html += `</div></div>`;
    }
    detailContent.innerHTML = html;
    
    if (ins.diploma_url) diplomaLink.href = ins.diploma_url;
    else diplomaLink.href = '#';
    if (ins.id_card_url) idCardLink.href = ins.id_card_url;
    else idCardLink.href = '#';
    
    await loadMessages(ins.pp_id);
}

async function loadMessages(ppId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('public_suivi_messages')
            .select('*')
            .eq('pp_id', ppId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        renderAdminMessages(data || []);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement messages', 'error');
    }
}

function renderAdminMessages(messages) {
    if (!adminMessagesContainer) return;
    if (messages.length === 0) {
        adminMessagesContainer.innerHTML = '<div class="empty-message">Aucun message échangé.</div>';
        return;
    }
    adminMessagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-bubble">
                <div>${msg.content}</div>
                <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
            </div>
        </div>
    `).join('');
    adminMessagesContainer.scrollTop = adminMessagesContainer.scrollHeight;
}

async function updateStatus() {
    if (!currentInscription) return;
    const newStatus = statusSelect.value;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_premierpas')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('pp_id', currentInscription.pp_id);
        if (error) throw error;
        currentInscription.status = newStatus;
        showToast('Statut mis à jour', 'success');
        await loadInscriptions();
        selectInscription(currentInscription);
    } catch (err) {
        console.error(err);
        showToast('Erreur mise à jour statut', 'error');
    } finally {
        hideLoader();
    }
}

async function sendAdminMessage() {
    if (!currentInscription || !adminQuill) return;
    const content = adminQuill.root.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
        showToast('Message vide', 'warning');
        return;
    }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_suivi_messages')
            .insert([{
                pp_id: currentInscription.pp_id,
                sender: 'admin',
                content: content
            }]);
        if (error) throw error;
        adminQuill.root.innerHTML = '';
        await loadMessages(currentInscription.pp_id);
        showToast('Message envoyé', 'success');
    } catch (err) {
        console.error(err);
        showToast('Erreur envoi message', 'error');
    } finally {
        hideLoader();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadInscriptions();
    
    searchInput.addEventListener('input', filterAndRenderList);
    statusFilter.addEventListener('change', filterAndRenderList);
    updateStatusBtn.addEventListener('click', updateStatus);
    
    const adminReplyEditor = document.getElementById('adminReplyEditor');
    if (adminReplyEditor) {
        adminQuill = new Quill(adminReplyEditor, {
            theme: 'snow',
            placeholder: 'Écrivez votre message...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['link', 'blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                ]
            }
        });
    }
    sendAdminMsgBtn.addEventListener('click', sendAdminMessage);
    
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Déconnexion (fonctionnalité à venir)', 'info');
        });
    }
});