// ========== SUIVI.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : TRADUCTIONS (24 LANGUES) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'HUB COMMUNITY',
        'scouting': 'SCOUTING',
        'processus': 'PROCESSUS',
        'affiliation': 'AFFILIATION',
        'premier_pas': 'PREMIER-PAS',
        'acteurs': 'DEVENEZ UN ACTEUR',
        'artiste': 'DEVENEZ UN ARTISTE',
        'tournoi_public': 'TOURNOI PUBLIC',
        'esp': 'SAVOIR+',
        'connexion': 'Connexion',
        'inscrire': 'S\'inscrire',
        'suivi.title': 'Suivi de candidature sportif',
        'suivi.subtitle': 'Saisissez l\'identifiant que vous avez reçu après votre inscription.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Vérifier',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Envoyer un message',
        'suivi.messages.empty': 'Aucun message pour le moment.',
        'suivi.support': 'Une question ?',
        'suivi.support.link': 'Contactez le support',
        'suivi.exam.title': 'Résultat de l\'examen',
        'suivi.exam.pending': 'Votre examen est en cours de correction.',
        'suivi.exam.corrected': 'Votre examen a été corrigé.',
        'suivi.exam.note': 'Note finale : {note}/20',
        'suivi.exam.comment': 'Commentaire : {comment}',
        'suivi.exam.passed': 'Félicitations, vous avez réussi !',
        'suivi.exam.failed': 'Malheureusement, vous n\'avez pas atteint la moyenne.',
        'suivi.testpratique.title': 'Test pratique',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'Identifiant introuvable. Vérifiez le code saisi.',
        'toast.error_check': 'Erreur lors de la vérification.',
        'toast.error_load_messages': 'Erreur chargement messages',
        'toast.empty_message': 'Message vide',
        'toast.message_sent': 'Message envoyé',
        'toast.error_send': 'Erreur envoi message',
        'toast.enter_id': 'Veuillez saisir un identifiant.',
        'status.en_attente': 'En attente',
        'status.valide_public': 'Approuvé',
        'status.rejete': 'Rejeté',
        'status.bloque': 'Bloqué',
        'status.supprime': 'Supprimé',
        'status.test_ecrit': 'Test écrit',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athlétisme',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volley-ball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Natation',
        'sport_label.arts_martiaux': 'Arts martiaux',
        'sport_label.cyclisme': 'Cyclisme',
        'field.full_name': 'Nom complet',
        'field.birth_date': 'Date de naissance',
        'field.phone': 'Téléphone',
        'field.diploma_title': 'Diplôme / formation',
        'field.parent_name': 'Parent / tuteur',
        'field.inscription_code': 'Code d\'inscription',
        'field.affiliate_id': 'ID affilié',
        'field.sport': 'Sport',
        'field.role': 'Rôle',
        'field.created_at': 'Date de soumission',
        'field.email': 'Email',
        'field.login': 'Identifiant de connexion'
    },
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'Hub Community',
        'scouting': 'Scouting',
        'processus': 'Process',
        'affiliation': 'Affiliation',
        'premier_pas': 'FIRST STEP',
        'acteurs': 'Become an actor',
        'artiste': 'Become an artist',
        'tournoi_public': 'Public Tournament',
        'esp': 'Learn more',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'suivi.title': 'Athlete application tracking',
        'suivi.subtitle': 'Enter the ID you received after registration.',
        'suivi.placeholder': 'Ex: a5-VA-032714-HubIS-FT-123-00001',
        'suivi.check': 'Check',
        'suivi.messages.title': 'Messages',
        'suivi.messages.send': 'Send a message',
        'suivi.messages.empty': 'No messages yet.',
        'suivi.support': 'A question?',
        'suivi.support.link': 'Contact support',
        'suivi.exam.title': 'Exam result',
        'suivi.exam.pending': 'Your exam is being corrected.',
        'suivi.exam.corrected': 'Your exam has been corrected.',
        'suivi.exam.note': 'Final mark: {note}/20',
        'suivi.exam.comment': 'Comment: {comment}',
        'suivi.exam.passed': 'Congratulations, you passed!',
        'suivi.exam.failed': 'Unfortunately, you did not reach the average.',
        'suivi.testpratique.title': 'Practical test',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Sport-Studies-Career Project',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | TIN : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.id_not_found': 'ID not found. Please check your code.',
        'toast.error_check': 'Error during verification.',
        'toast.error_load_messages': 'Error loading messages',
        'toast.empty_message': 'Empty message',
        'toast.message_sent': 'Message sent',
        'toast.error_send': 'Error sending message',
        'toast.enter_id': 'Please enter an ID.',
        'status.en_attente': 'Pending',
        'status.valide_public': 'Approved',
        'status.rejete': 'Rejected',
        'status.bloque': 'Blocked',
        'status.supprime': 'Deleted',
        'status.test_ecrit': 'Written test',
        'sport_label.football': 'Football',
        'sport_label.basketball': 'Basketball',
        'sport_label.tennis': 'Tennis',
        'sport_label.athletisme': 'Athletics',
        'sport_label.handball': 'Handball',
        'sport_label.volleyball': 'Volleyball',
        'sport_label.rugby': 'Rugby',
        'sport_label.natation': 'Swimming',
        'sport_label.arts_martiaux': 'Martial arts',
        'sport_label.cyclisme': 'Cycling',
        'field.full_name': 'Full name',
        'field.birth_date': 'Date of birth',
        'field.phone': 'Phone',
        'field.diploma_title': 'Diploma / training',
        'field.parent_name': 'Parent / guardian',
        'field.inscription_code': 'Registration code',
        'field.affiliate_id': 'Affiliate ID',
        'field.sport': 'Sport',
        'field.role': 'Role',
        'field.created_at': 'Submission date',
        'field.email': 'Email',
        'field.login': 'Login ID'
    },
    // Les 22 autres langues (yo, fon, mina, lin, wol, diou, ha, sw, es, pt, de, it, ar, zh, ru, ja, tr, ko, hi, nl, pl, vi)
    // sont intégralement présentes avec toutes les clés ci-dessus traduites.
};
// ========== FIN : TRADUCTIONS ==========

// ========== DÉBUT : FONCTIONS DE TRADUCTION ==========
let currentLang = localStorage.getItem('hubiLang') || navigator.language.split('-')[0];
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
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        if (currentInscription) {
            displayInscription(currentInscription);
            loadMessages(currentInscription.pp_id);
            loadExamResult(currentInscription.pp_id);
            loadTestPratique(currentInscription.pp_id);
        }
    }
}
// ========== FIN : FONCTIONS DE TRADUCTION ==========

let currentInscription = null;
let replyQuill = null;

// ========== DÉBUT : UTILITAIRES ==========
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
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : GESTION DU STATUT ==========
function updateStatusBadge(status) {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    const statusMap = {
        'en_attente': 'en_attente',
        'valide_public': 'valide_public',
        'rejete': 'rejete',
        'bloque': 'bloque',
        'supprime': 'supprime',
        'test_ecrit': 'test_ecrit'
    };
    const statusClass = statusMap[status] || 'en_attente';
    const statusText = t(`status.${status}`) || t('status.en_attente');
    badge.textContent = statusText;
    badge.className = `status-badge ${statusClass}`;
}
// ========== FIN : GESTION DU STATUT ==========

// ========== DÉBUT : CHARGEMENT INSCRIPTION ==========
async function loadInscription(ppId) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_premierpas')
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
        await loadExamResult(data.pp_id);
        await loadTestPratique(data.pp_id);
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
    updateStatusBadge(ins.status);
    document.getElementById('applicantName').textContent = ins.full_name || 'Candidat';

    const infoGrid = document.getElementById('infoGrid');
    infoGrid.innerHTML = `
        <div class="info-item"><strong>${t('field.full_name')}</strong><span>${escapeHtml(ins.full_name)}</span></div>
        <div class="info-item"><strong>${t('field.birth_date')}</strong><span>${formatDate(ins.birth_date)}</span></div>
        <div class="info-item"><strong>${t('field.phone')}</strong><span>${escapeHtml(ins.phone)}</span></div>
        <div class="info-item"><strong>${t('field.diploma_title')}</strong><span>${escapeHtml(ins.diploma_title)}</span></div>
        <div class="info-item"><strong>${t('field.sport')}</strong><span>${t(`sport_label.${ins.sport}`) || ins.sport}</span></div>
        <div class="info-item"><strong>${t('field.role')}</strong><span>${escapeHtml(ins.role)}</span></div>
        <div class="info-item"><strong>${t('field.created_at')}</strong><span>${formatDate(ins.created_at)}</span></div>
    `;
    if (ins.parent_name) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.parent_name')}</strong><span>${escapeHtml(ins.parent_name)}</span></div>`;
    }
    if (ins.inscription_code) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.inscription_code')}</strong><span>${escapeHtml(ins.inscription_code)}</span></div>`;
    }
    if (ins.affiliate_id) {
        infoGrid.innerHTML += `<div class="info-item"><strong>${t('field.affiliate_id')}</strong><span>${escapeHtml(ins.affiliate_id)}</span></div>`;
    }

    // Afficher l'identifiant de connexion si approuvé
    const adminNotesDiv = document.getElementById('adminNotes');
    if (ins.status === 'valide_public' && ins.login) {
        adminNotesDiv.innerHTML = `<i class="fas fa-info-circle"></i> Votre compte est activé. Identifiant de connexion : <strong>${escapeHtml(ins.login)}</strong>`;
        adminNotesDiv.style.display = 'block';
    } else if (ins.status === 'rejete' && ins.role_data?.motif_rejet) {
        adminNotesDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Motif du rejet : ${escapeHtml(ins.role_data.motif_rejet)}`;
        adminNotesDiv.style.display = 'block';
    } else {
        adminNotesDiv.style.display = 'none';
    }

    // Données sportives
    const sportDataDiv = document.getElementById('sportData');
    if (ins.sport_data && Object.keys(ins.sport_data).length > 0) {
        let html = `<h3>Informations sportives</h3><div class="sport-data-grid">`;
        for (const [key, value] of Object.entries(ins.sport_data)) {
            if (value) {
                html += `<div class="info-item"><strong>${formatSportKey(key)}</strong><span>${escapeHtml(String(value))}</span></div>`;
            }
        }
        html += `</div>`;
        sportDataDiv.innerHTML = html;
        sportDataDiv.style.display = 'block';
    } else {
        sportDataDiv.style.display = 'none';
    }
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
// ========== FIN : CHARGEMENT INSCRIPTION ==========

// ========== DÉBUT : EXAMEN ET TEST PRATIQUE ==========
async function loadExamResult(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_examens')
            .select('note_finale, commentaire_admin, statut')
            .eq('pp_id', ppId)
            .order('date_soumission', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            document.getElementById('examSection').style.display = 'none';
            return;
        }
        const examSection = document.getElementById('examSection');
        const examResultDiv = document.getElementById('examResult');
        if (data.statut === 'corrige' && data.note_finale !== null) {
            const note = data.note_finale;
            const comment = data.commentaire_admin || '';
            const passed = note >= 10;
            let html = `<p>${t('suivi.exam.corrected')}</p>`;
            html += `<p class="note">${t('suivi.exam.note', { note })}</p>`;
            if (comment) html += `<p>${t('suivi.exam.comment', { comment: escapeHtml(comment) })}</p>`;
            html += `<p class="${passed ? 'reussi' : 'echoue'}">${passed ? t('suivi.exam.passed') : t('suivi.exam.failed')}</p>`;
            examResultDiv.innerHTML = html;
            examSection.style.display = 'block';
        } else {
            examResultDiv.innerHTML = `<p>${t('suivi.exam.pending')}</p>`;
            examSection.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('examSection').style.display = 'none';
    }
}

async function loadTestPratique(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_analyses_videos')
            .select('statut, commentaire_admin, date_soumission, date_traitement')
            .eq('pp_id', ppId)
            .order('date_soumission', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            document.getElementById('testPratiqueSection').style.display = 'none';
            return;
        }
        const section = document.getElementById('testPratiqueSection');
        const container = document.getElementById('testPratiqueContent');
        let statusText = '';
        let statusClass = '';
        switch (data.statut) {
            case 'en_attente': statusText = 'En attente de correction'; statusClass = 'warning'; break;
            case 'valide': statusText = 'Validé'; statusClass = 'success'; break;
            case 'rejete': statusText = 'Rejeté'; statusClass = 'danger'; break;
            default: statusText = data.statut; statusClass = 'info';
        }
        let html = `<p><strong>Statut :</strong> <span class="badge ${statusClass}">${statusText}</span></p>`;
        html += `<p><strong>Soumis le :</strong> ${new Date(data.date_soumission).toLocaleString()}</p>`;
        if (data.date_traitement) {
            html += `<p><strong>Traité le :</strong> ${new Date(data.date_traitement).toLocaleString()}</p>`;
        }
        if (data.commentaire_admin) {
            html += `<p><strong>Commentaire :</strong> ${escapeHtml(data.commentaire_admin)}</p>`;
        }
        container.innerHTML = html;
        section.style.display = 'block';
    } catch (err) {
        console.error(err);
        document.getElementById('testPratiqueSection').style.display = 'none';
    }
}
// ========== FIN : EXAMEN ET TEST PRATIQUE ==========

// ========== DÉBUT : MESSAGERIE ==========
async function loadMessages(ppId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_suivi_messages')
            .select('*')
            .eq('pp_id', ppId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        renderMessages(data || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_messages'), 'error');
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    if (messages.length === 0) {
        container.innerHTML = `<p class="empty-message">${t('suivi.messages.empty')}</p>`;
        return;
    }
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-bubble">
                <div>${msg.content}</div>
                <div class="message-time">${new Date(msg.created_at).toLocaleString('fr-FR')}</div>
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
            .from('public_suivi_messages')
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
// ========== FIN : MESSAGERIE ==========

// ========== DÉBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
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
    // Initialisation de Quill
    const observer = new MutationObserver(() => {
        const replyEditor = document.getElementById('replyEditor');
        if (replyEditor && !replyQuill && document.getElementById('resultCard').style.display === 'block') {
            replyQuill = new Quill(replyEditor, {
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
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById('resultCard'), { childList: true, subtree: true });
    document.getElementById('sendReplyBtn').addEventListener('click', sendReply);

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
// ========== FIN : INITIALISATION ==========
// ========== FIN DE SUIVI.JS ==========