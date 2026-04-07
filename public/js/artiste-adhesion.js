// ========== ARTISTE-ADHESION.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'hero.title': 'Premier Pas Artistique',
        'hero.subtitle': 'Adhésion officielle au programme HubISoccer pour les artistes. Nous valorisons votre talent après vérification de votre parcours.',
        'nav.home': 'Accueil',
        'nav.scouting': 'Scouting',
        'nav.process': 'Processus',
        'nav.affiliation': 'Affiliation',
        'nav.follow': 'SUIVI',
        'nav.actors': 'DEVENIR UN ACTEUR',
        'nav.tournaments': 'Tournois',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'benefit1.title': 'Identité Numérique',
        'benefit1.desc': 'Votre inscription crée votre passeport artistique HubISoccer, indispensable pour participer aux événements et détections.',
        'benefit2.title': 'Protection des œuvres',
        'benefit2.desc': 'Nous protégeons vos créations et respectons les normes juridiques béninoises.',
        'benefit3.title': 'Visibilité Mondiale',
        'benefit3.desc': 'Une fois validé, votre profil devient accessible aux producteurs, labels et organisateurs internationaux.',
        'form.title': 'Dossier d\'Adhésion (Artistes)',
        'form.who': 'Qui êtes-vous ?',
        'form.definition': 'Veuillez vous définir *',
        'form.myself': 'Moi-même',
        'form.parent': 'Mon parent',
        'form.guardian': 'Mon tuteur',
        'form.relative': 'Mon proche',
        'form.fullname': 'Nom complet *',
        'form.birthdate': 'Date de naissance *',
        'form.parentname': 'Nom du parent / tuteur (si mineur)',
        'form.inscription_code': 'Code d\'inscription (optionnel)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Êtes-vous affilié(e) ?',
        'form.yes': 'Oui',
        'form.no': 'Non',
        'form.affiliate_id': 'ID affilié',
        'form.academic': 'Parcours Académique & Justificatifs',
        'form.diploma_title': 'Diplôme / formation en cours *',
        'form.diploma_file': 'Attestation de scolarité ou Diplôme *',
        'form.idcard_file': 'Pièce d\'identité *',
        'form.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'form.phone': 'Téléphone *',
        'form.art_section': 'Discipline artistique',
        'form.choose_discipline': '-- Choisissez votre discipline --',
        'form.certify': 'Je certifie l\'exactitude des documents fournis. Toute fraude entraînera une exclusion définitive.',
        'form.submit': 'Valider mon adhésion',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification par l\'équipe HubISoccer.',
        'modal.id_label': 'Votre identifiant unique :',
        'modal.copy': 'Copier',
        'modal.thanks': 'Merci de votre confiance !',
        'modal.close': 'Fermer',
        'toast.file_selected': 'Fichier sélectionné : {filename}',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.fill_required': 'Veuillez remplir tous les champs obligatoires.',
        'toast.files_required': 'Veuillez télécharger les deux fichiers requis.',
        'toast.submit_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !'
    },
    en: {
        'hero.title': 'First Artistic Step',
        'hero.subtitle': 'Official membership to the HubISoccer program for artists. We certify your talent after verifying your background.',
        'nav.home': 'Home',
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.follow': 'TRACKING',
        'nav.actors': 'BECOME AN ACTOR',
        'nav.tournaments': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'benefit1.title': 'Digital Identity',
        'benefit1.desc': 'Your registration creates your HubISoccer artistic passport, essential for events and scouting.',
        'benefit2.title': 'Protection of works',
        'benefit2.desc': 'We protect your creations and comply with Beninese legal standards.',
        'benefit3.title': 'Global Visibility',
        'benefit3.desc': 'Once validated, your profile becomes accessible to producers, labels and international organizers.',
        'form.title': 'Membership Application (Artists)',
        'form.who': 'Who are you?',
        'form.definition': 'Please define yourself *',
        'form.myself': 'Myself',
        'form.parent': 'My parent',
        'form.guardian': 'My guardian',
        'form.relative': 'My relative',
        'form.fullname': 'Full name *',
        'form.birthdate': 'Date of birth *',
        'form.parentname': 'Parent/guardian name (if under 18)',
        'form.inscription_code': 'Registration code (optional)',
        'form.affiliation_section': 'Affiliation',
        'form.is_affiliated': 'Are you affiliated?',
        'form.yes': 'Yes',
        'form.no': 'No',
        'form.affiliate_id': 'Affiliate ID',
        'form.academic': 'Academic & Supporting documents',
        'form.diploma_title': 'Current diploma/training *',
        'form.diploma_file': 'School attendance certificate or Diploma *',
        'form.idcard_file': 'ID document *',
        'form.upload_click': 'Click to upload (PDF, JPG, PNG)',
        'form.phone': 'Phone *',
        'form.art_section': 'Artistic discipline',
        'form.choose_discipline': '-- Choose your discipline --',
        'form.certify': 'I certify the accuracy of the documents provided. Any fraud will lead to permanent exclusion.',
        'form.submit': 'Submit my membership',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'modal.title': 'Registration sent!',
        'modal.message': 'Your file is pending verification by the HubISoccer team.',
        'modal.id_label': 'Your unique identifier:',
        'modal.copy': 'Copy',
        'modal.thanks': 'Thank you for your trust!',
        'modal.close': 'Close',
        'toast.file_selected': 'File selected: {filename}',
        'toast.upload_error': 'Upload error: {error}',
        'toast.fill_required': 'Please fill in all required fields.',
        'toast.files_required': 'Please upload both required files.',
        'toast.submit_error': 'Registration error: {error}',
        'toast.copy_error': 'Copy error',
        'toast.copy_success': 'Copied!'
    }
};

let currentLang = localStorage.getItem('artiste_lang') || navigator.language.split('-')[0];
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
    const disciplineSelect = document.getElementById('disciplineSelect');
    if (disciplineSelect) {
        const firstOption = disciplineSelect.querySelector('option[value=""]');
        if (firstOption) firstOption.textContent = t('form.choose_discipline');
    }
    const submitSpan = document.querySelector('#submitBtn span');
    if (submitSpan) submitSpan.textContent = t('form.submit');
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('artiste_lang', lang);
        applyTranslations();
        const currentDiscipline = document.getElementById('disciplineSelect').value;
        if (currentDiscipline && disciplineFields[currentDiscipline]) {
            buildDisciplineFields(currentDiscipline);
        }
    }
}

// ========== ÉLÉMENTS DOM ==========
const form = document.getElementById('artisteAdhesionForm');
const affOui = document.getElementById('affOui');
const affNon = document.getElementById('affNon');
const affiliateGroup = document.getElementById('affiliateGroup');
const affiliateIdInput = document.getElementById('affiliateId');
const birthDateInput = document.getElementById('birthDate');
const parentGroup = document.getElementById('parentGroup');
const parentNameInput = document.getElementById('parentName');
const disciplineSelect = document.getElementById('disciplineSelect');
const disciplineFieldsDiv = document.getElementById('disciplineSpecificFields');
const submitBtn = document.getElementById('submitBtn');
const diplomaBox = document.getElementById('upload-diplome');
const idCardBox = document.getElementById('upload-piece');
const globalLoader = document.getElementById('globalLoader');

// ========== GESTION AFFILIATION ==========
affOui.addEventListener('change', () => {
    affiliateGroup.style.display = affOui.checked ? 'block' : 'none';
    if (affOui.checked) {
        const ref = sessionStorage.getItem('affiliateRef');
        if (ref) affiliateIdInput.value = ref;
    } else {
        affiliateIdInput.value = '';
    }
});
affNon.addEventListener('change', () => {
    affiliateGroup.style.display = 'none';
    affiliateIdInput.value = '';
});

// ========== GESTION ÂGE ==========
function updateParentGroup() {
    const birthDate = birthDateInput.value;
    if (!birthDate) {
        parentGroup.style.display = 'none';
        return;
    }
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) {
        parentGroup.style.display = 'block';
    } else {
        parentGroup.style.display = 'none';
        parentNameInput.value = '';
    }
}
birthDateInput.addEventListener('change', updateParentGroup);

// ========== CHAMPS SPÉCIFIQUES PAR DISCIPLINE ==========
const disciplineFields = {
    chanteur: {
        code: 'CH',
        fields: [
            { name: 'demo_audio', labelKey: 'artist.chanteur.demo_audio', type: 'file', accept: '.mp3,.aac,.m4a,.wav', maxSize: 50, required: true, label: 'Démo audio (obligatoire)' },
            { name: 'video_performance', labelKey: 'artist.chanteur.video_performance', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Vidéo performance (obligatoire)' },
            { name: 'photo_portrait', labelKey: 'artist.chanteur.photo_portrait', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo portrait (obligatoire)' },
            { name: 'cv', labelKey: 'artist.chanteur.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' },
            { name: 'autre_justificatif', labelKey: 'artist.chanteur.autre', type: 'file', accept: '*/*', maxSize: 50, required: false, label: 'Autre justificatif (optionnel)' }
        ]
    },
    danseur: {
        code: 'DA',
        fields: [
            { name: 'video_danse', labelKey: 'artist.danseur.video_danse', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Vidéo de danse (obligatoire)' },
            { name: 'photo_action', labelKey: 'artist.danseur.photo_action', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo en action (obligatoire)' },
            { name: 'cv', labelKey: 'artist.danseur.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' },
            { name: 'autre', labelKey: 'artist.danseur.autre', type: 'file', accept: '*/*', maxSize: 50, required: false, label: 'Autre justificatif (optionnel)' }
        ]
    },
    compositeur: {
        code: 'CO',
        fields: [
            { name: 'audio_oeuvre', labelKey: 'artist.compositeur.audio_oeuvre', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true, label: 'Audio d\'une œuvre (obligatoire)' },
            { name: 'partition', labelKey: 'artist.compositeur.partition', type: 'file', accept: '.pdf', maxSize: 50, required: true, label: 'Partition (obligatoire)' },
            { name: 'cv', labelKey: 'artist.compositeur.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' },
            { name: 'autre', labelKey: 'artist.compositeur.autre', type: 'file', accept: '*/*', maxSize: 50, required: false, label: 'Autre justificatif (optionnel)' }
        ]
    },
    acteur_cinema: {
        code: 'AC',
        fields: [
            { name: 'video_acting', labelKey: 'artist.acteur_cinema.video_acting', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Extrait vidéo (obligatoire)' },
            { name: 'photo_portfolio', labelKey: 'artist.acteur_cinema.photo_portfolio', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo portrait (obligatoire)' },
            { name: 'cv', labelKey: 'artist.acteur_cinema.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' },
            { name: 'autre', labelKey: 'artist.acteur_cinema.autre', type: 'file', accept: '*/*', maxSize: 50, required: false, label: 'Autre justificatif (optionnel)' }
        ]
    },
    acteur_theatre: {
        code: 'AT',
        fields: [
            { name: 'video_theatre', labelKey: 'artist.acteur_theatre.video_theatre', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Extrait de scène (obligatoire)' },
            { name: 'photo', labelKey: 'artist.acteur_theatre.photo', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo (obligatoire)' },
            { name: 'cv', labelKey: 'artist.acteur_theatre.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' },
            { name: 'autre', labelKey: 'artist.acteur_theatre.autre', type: 'file', accept: '*/*', maxSize: 50, required: false, label: 'Autre justificatif (optionnel)' }
        ]
    },
    humoriste: {
        code: 'HU',
        fields: [
            { name: 'video_sketch', labelKey: 'artist.humoriste.video_sketch', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Vidéo de sketch (obligatoire)' },
            { name: 'photo', labelKey: 'artist.humoriste.photo', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo (obligatoire)' },
            { name: 'cv', labelKey: 'artist.humoriste.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' }
        ]
    },
    slameur: {
        code: 'SL',
        fields: [
            { name: 'video_slam', labelKey: 'artist.slameur.video_slam', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Vidéo de slam (obligatoire)' },
            { name: 'audio_texte', labelKey: 'artist.slameur.audio_texte', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true, label: 'Audio du texte (obligatoire)' },
            { name: 'cv', labelKey: 'artist.slameur.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' }
        ]
    },
    dj: {
        code: 'DJ',
        fields: [
            { name: 'audio_mix', labelKey: 'artist.dj.audio_mix', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true, label: 'Mix audio (obligatoire)' },
            { name: 'photo', labelKey: 'artist.dj.photo', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo (obligatoire)' },
            { name: 'cv', labelKey: 'artist.dj.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' }
        ]
    },
    cirque: {
        code: 'CI',
        fields: [
            { name: 'video_performance', labelKey: 'artist.cirque.video_performance', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true, label: 'Vidéo de performance (obligatoire)' },
            { name: 'photo', labelKey: 'artist.cirque.photo', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Photo (obligatoire)' },
            { name: 'cv', labelKey: 'artist.cirque.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' }
        ]
    },
    artiste_visuel: {
        code: 'AR',
        fields: [
            { name: 'image_oeuvre', labelKey: 'artist.artiste_visuel.image_oeuvre', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true, label: 'Image d\'une œuvre (obligatoire)' },
            { name: 'portfolio', labelKey: 'artist.artiste_visuel.portfolio', type: 'file', accept: '.pdf', maxSize: 50, required: true, label: 'Portfolio (obligatoire)' },
            { name: 'cv', labelKey: 'artist.artiste_visuel.cv', type: 'file', accept: '.pdf', maxSize: 50, required: false, label: 'CV artistique (optionnel)' }
        ]
    }
};

function getFieldLabel(field) {
    return translations[currentLang]?.[field.labelKey] || field.label;
}

function buildDisciplineFields(disciplineKey) {
    const discipline = disciplineFields[disciplineKey];
    if (!discipline) return;
    let html = '';
    for (const field of discipline.fields) {
        html += `<div class="form-group" data-field-name="${field.name}">`;
        html += `<label>${getFieldLabel(field)} ${field.required ? '<span class="required">*</span>' : ''}</label>`;
        html += `<div class="file-upload-box" id="upload-${field.name}">`;
        html += `<i class="fas fa-cloud-upload-alt"></i><span>${t('form.upload_click')}</span>`;
        html += `<input type="file" id="${field.name}" accept="${field.accept}" ${field.required ? 'required' : ''}>`;
        html += `<div class="progress-indicator" style="display: none;">`;
        html += `<svg class="progress-circle" width="40" height="40"><circle class="progress-bg" cx="20" cy="20" r="18" stroke="#e9ecef" stroke-width="3" fill="none"/><circle class="progress-bar" cx="20" cy="20" r="18" stroke="#551B8C" stroke-width="3" fill="none" stroke-dasharray="113.1" stroke-dashoffset="113.1" transform="rotate(-90 20 20)"/></svg>`;
        html += `<span class="progress-text">0%</span></div></div></div>`;
    }
    disciplineFieldsDiv.innerHTML = html;
    disciplineFieldsDiv.style.display = 'block';
    // Initialiser les uploads pour ces nouveaux champs
    for (const field of discipline.fields) {
        setupFileUpload(`upload-${field.name}`, field.name, field);
    }
}

disciplineSelect.addEventListener('change', () => {
    const selected = disciplineSelect.value;
    if (selected && disciplineFields[selected]) {
        buildDisciplineFields(selected);
    } else {
        disciplineFieldsDiv.innerHTML = '';
        disciplineFieldsDiv.style.display = 'none';
    }
});

// ========== FONCTIONS UPLOAD ==========
function setupFileUpload(boxId, inputId, fieldConfig) {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    if (!box || !input) return;
    box.addEventListener('click', () => {
        input.value = '';
        input.click();
    });
    input.addEventListener('change', () => {
        if (input.files.length) {
            const fileName = input.files[0].name;
            const span = box.querySelector('span:not(.progress-text)');
            if (span) span.textContent = fileName;
            box.style.borderColor = 'var(--primary)';
            showToast(t('toast.file_selected', { filename: fileName }), 'success');
        }
    });
    return { box, input, fieldConfig };
}

async function uploadFileDirect(file, box, fieldName, disciplineCode) {
    const fullName = document.getElementById('fullName').value.trim();
    const safeName = fullName ? fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 'artiste';
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}_${dateStr}_${fieldName}.${fileExt}`;
    const bucket = 'artistes_medias';

    const progressIndicator = box.querySelector('.progress-indicator');
    const progressBarCircle = box.querySelector('.progress-bar');
    const progressText = box.querySelector('.progress-text');
    if (progressIndicator) progressIndicator.style.display = 'flex';
    box.classList.add('uploading');

    try {
        const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file, {
            onUploadProgress: (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                const dashOffset = 113.1 * (1 - percent / 100);
                if (progressBarCircle) progressBarCircle.style.strokeDashoffset = dashOffset;
                if (progressText) progressText.textContent = percent + '%';
            }
        });
        if (error) throw error;
        const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
        box.classList.add('success');
        box.classList.remove('uploading');
        if (progressText) progressText.textContent = '✓';
        return urlData.publicUrl;
    } catch (err) {
        box.classList.remove('uploading');
        showToast(t('toast.upload_error', { error: err.message }), 'error');
        throw err;
    }
}

// ========== GÉNÉRATION IDENTIFIANT ==========
function generateArtisteId(disciplineCode) {
    const randomPart = String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
                       String(Math.floor(Math.random() * 1000)).padStart(3, '0') +
                       String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
                       String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const vaPart = `VA-${month}${day}${hour}`;
    const secondsPart = String(now.getSeconds()).padStart(3, '0');
    const counter = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `${randomPart}-${vaPart}-HubIS-${disciplineCode}-${secondsPart}-${counter}`;
}

// ========== TOAST ==========
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
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

// ========== SOUMISSION FORMULAIRE ==========
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const definition = document.querySelector('input[name="definition"]:checked')?.value;
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const parentName = document.getElementById('parentName').value.trim();
    const inscriptionCode = document.getElementById('inscriptionCode').value.trim();
    const isAffiliated = affOui.checked;
    const affiliateId = affiliateIdInput.value.trim();
    const diplomaTitle = document.getElementById('diplomaTitle').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const discipline = disciplineSelect.value;
    const certified = document.getElementById('certifie').checked;

    if (!definition || !fullName || !birthDate || !diplomaTitle || !phone || !discipline || !certified) {
        showToast(t('toast.fill_required'), 'error');
        return;
    }

    const diplomaFile = document.getElementById('diplomaFile').files[0];
    const idCardFile = document.getElementById('idCardFile').files[0];
    if (!diplomaFile || !idCardFile) {
        showToast(t('toast.files_required'), 'error');
        return;
    }

    // Récupérer les fichiers spécifiques à la discipline
    const disciplineConfig = disciplineFields[discipline];
    if (!disciplineConfig) {
        showToast('Erreur configuration discipline', 'error');
        return;
    }
    const specificUploads = {};
    for (const field of disciplineConfig.fields) {
        const fileInput = document.getElementById(field.name);
        if (field.required && (!fileInput || !fileInput.files.length)) {
            showToast(`Veuillez télécharger : ${getFieldLabel(field)}`, 'error');
            return;
        }
        if (fileInput && fileInput.files.length) {
            specificUploads[field.name] = fileInput.files[0];
        }
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléversement...';
    showLoader();

    try {
        // Upload des fichiers obligatoires (diplôme, pièce d'identité)
        const [diplomaUrl, idCardUrl] = await Promise.all([
            uploadFileDirect(diplomaFile, diplomaBox, 'diplome', disciplineConfig.code),
            uploadFileDirect(idCardFile, idCardBox, 'idcard', disciplineConfig.code)
        ]);

        // Upload des fichiers spécifiques
        const specificUrls = {};
        for (const [key, file] of Object.entries(specificUploads)) {
            const box = document.getElementById(`upload-${key}`);
            if (box && file) {
                specificUrls[key] = await uploadFileDirect(file, box, key, disciplineConfig.code);
            }
        }

        const artisteId = generateArtisteId(disciplineConfig.code);
        const roleMapping = {
            chanteur: 'Chanteur',
            danseur: 'Danseur',
            compositeur: 'Compositeur',
            acteur_cinema: 'Acteur de cinéma',
            acteur_theatre: 'Acteur de théâtre',
            humoriste: 'Humoriste',
            slameur: 'Slameur',
            dj: 'DJ/producteur',
            cirque: 'Artiste de cirque',
            artiste_visuel: 'Artiste visuel'
        };
        const role = roleMapping[discipline] || discipline;

        const { error: insertError } = await supabasePublic
            .from('public_artistes_adhesion')
            .insert([{
                artiste_id: artisteId,
                definition: definition,
                full_name: fullName,
                birth_date: birthDate,
                parent_name: parentName || null,
                inscription_code: inscriptionCode || null,
                is_affiliated: isAffiliated,
                affiliate_id: affiliateId || null,
                diploma_title: diplomaTitle,
                diploma_url: diplomaUrl,
                id_card_url: idCardUrl,
                phone: phone,
                discipline: discipline,
                role: role,
                artist_data: specificUrls,
                status: 'en_attente',
                created_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        // Affichage modal
        const modal = document.getElementById('successModal');
        const trackingSpan = document.getElementById('trackingId');
        trackingSpan.textContent = artisteId;
        modal.classList.add('active');

        // Réinitialisation du formulaire
        form.reset();
        disciplineFieldsDiv.innerHTML = '';
        disciplineFieldsDiv.style.display = 'none';
        affiliateGroup.style.display = 'none';
        parentGroup.style.display = 'none';
        // Réinitialiser les champs de fichiers
        document.getElementById('diplomaFile').value = '';
        document.getElementById('idCardFile').value = '';
        const defaultSpan1 = diplomaBox.querySelector('span:not(.progress-text)');
        if (defaultSpan1) defaultSpan1.textContent = t('form.upload_click');
        const defaultSpan2 = idCardBox.querySelector('span:not(.progress-text)');
        if (defaultSpan2) defaultSpan2.textContent = t('form.upload_click');
        diplomaBox.classList.remove('success', 'uploading');
        idCardBox.classList.remove('success', 'uploading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + t('form.submit') + '</span>';
    } catch (err) {
        console.error(err);
        showToast(t('toast.submit_error', { error: err.message }), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + t('form.submit') + '</span>';
    } finally {
        hideLoader();
    }
});

// ========== COPIE ID ==========
document.getElementById('copyTrackingBtn').addEventListener('click', () => {
    const link = document.getElementById('trackingId').textContent;
    if (link) {
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copyTrackingBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> ' + t('modal.copy');
            }, 2000);
        }).catch(() => showToast(t('toast.copy_error'), 'error'));
    }
});

window.closeSuccessModal = () => {
    document.getElementById('successModal').classList.remove('active');
};

// ========== CARROUSEL ==========
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let slideInterval;
function showSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    slides.forEach(s => s.classList.remove('active'));
    slides[index].classList.add('active');
    indicators.forEach(i => i.classList.remove('active'));
    indicators[index].classList.add('active');
    currentSlide = index;
}
function nextSlide() { showSlide(currentSlide + 1); }
function startCarousel() { slideInterval = setInterval(nextSlide, 5000); }
function stopCarousel() { clearInterval(slideInterval); }
if (slides.length) {
    showSlide(0);
    startCarousel();
    const hero = document.getElementById('heroCarousel');
    if (hero) {
        hero.addEventListener('mouseenter', stopCarousel);
        hero.addEventListener('mouseleave', startCarousel);
    }
    indicators.forEach((ind, i) => {
        ind.addEventListener('click', () => {
            stopCarousel();
            showSlide(i);
            startCarousel();
        });
    });
}

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

// ========== RÉFÉRENCE DANS L'URL ==========
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get('ref');
if (ref) {
    sessionStorage.setItem('affiliateRef', ref);
    affOui.checked = true;
    affiliateIdInput.value = ref;
    affiliateGroup.style.display = 'block';
}

// ========== INITIALISATION LANGUE ==========
const langSelect = document.getElementById('langSelect');
if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
}
applyTranslations();