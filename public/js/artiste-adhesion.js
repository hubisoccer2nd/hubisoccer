// ========== ARTISTE-ADHESION.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (simplifiées pour l’exemple) ==========
const translations = {
    fr: {
        'hero.title': 'Premier Pas Artistique',
        'hero.subtitle': 'Adhésion officielle au programme HubISoccer pour les artistes.',
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
        'benefit1.desc': 'Votre inscription crée votre passeport artistique HubISoccer.',
        'benefit2.title': 'Protection des œuvres',
        'benefit2.desc': 'Nous protégeons vos créations.',
        'benefit3.title': 'Visibilité Mondiale',
        'benefit3.desc': 'Votre profil accessible aux producteurs internationaux.',
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
        'form.certify': 'Je certifie l\'exactitude des documents fournis.',
        'form.submit': 'Valider mon adhésion',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.copyright': '© 2026 HubISoccer - Ozawa.',
        'modal.title': 'Inscription envoyée !',
        'modal.message': 'Votre dossier est en attente de vérification.',
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
        // Pour l'anglais, même structure, omise pour concision
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
            { name: 'demo_audio', label: 'Démo audio (obligatoire)', type: 'file', accept: '.mp3,.aac,.m4a,.wav', maxSize: 50, required: true },
            { name: 'video_performance', label: 'Vidéo performance (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo_portrait', label: 'Photo portrait (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false },
            { name: 'autre_justificatif', label: 'Autre justificatif (optionnel)', type: 'file', accept: '*/*', maxSize: 50, required: false }
        ]
    },
    danseur: {
        code: 'DA',
        fields: [
            { name: 'video_danse', label: 'Vidéo de danse (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo_action', label: 'Photo en action (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    compositeur: {
        code: 'CO',
        fields: [
            { name: 'audio_oeuvre', label: 'Audio d\'une œuvre (obligatoire)', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true },
            { name: 'partition', label: 'Partition (obligatoire)', type: 'file', accept: '.pdf', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    acteur_cinema: {
        code: 'AC',
        fields: [
            { name: 'video_acting', label: 'Extrait vidéo (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo_portfolio', label: 'Photo portrait (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    acteur_theatre: {
        code: 'AT',
        fields: [
            { name: 'video_theatre', label: 'Extrait de scène (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo', label: 'Photo (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    humoriste: {
        code: 'HU',
        fields: [
            { name: 'video_sketch', label: 'Vidéo de sketch (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo', label: 'Photo (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    slameur: {
        code: 'SL',
        fields: [
            { name: 'video_slam', label: 'Vidéo de slam (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'audio_texte', label: 'Audio du texte (obligatoire)', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    dj: {
        code: 'DJ',
        fields: [
            { name: 'audio_mix', label: 'Mix audio (obligatoire)', type: 'file', accept: '.mp3,.aac,.wav', maxSize: 50, required: true },
            { name: 'photo', label: 'Photo (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    cirque: {
        code: 'CI',
        fields: [
            { name: 'video_performance', label: 'Vidéo de performance (obligatoire)', type: 'file', accept: '.mp4,.mov,.avi', maxSize: 50, required: true },
            { name: 'photo', label: 'Photo (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    },
    artiste_visuel: {
        code: 'AR',
        fields: [
            { name: 'image_oeuvre', label: 'Image d\'une œuvre (obligatoire)', type: 'file', accept: '.jpg,.jpeg,.png', maxSize: 50, required: true },
            { name: 'portfolio', label: 'Portfolio (obligatoire)', type: 'file', accept: '.pdf', maxSize: 50, required: true },
            { name: 'cv', label: 'CV artistique (optionnel)', type: 'file', accept: '.pdf', maxSize: 50, required: false }
        ]
    }
};

function buildDisciplineFields(disciplineKey) {
    const discipline = disciplineFields[disciplineKey];
    if (!discipline) return;
    let html = '';
    for (const field of discipline.fields) {
        html += `<div class="form-group" data-field-name="${field.name}">`;
        html += `<label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>`;
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
        setupFileUpload(`upload-${field.name}`, field.name);
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

// ========== FONCTIONS UPLOAD (avec affichage nom fichier) ==========
function setupFileUpload(boxId, inputId) {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    if (!box || !input) return;
    // Afficher le nom du fichier sélectionné
    input.addEventListener('change', () => {
        if (input.files.length) {
            const fileName = input.files[0].name;
            const span = box.querySelector('span:not(.progress-text)');
            if (span) span.textContent = fileName;
            box.style.borderColor = 'var(--primary)';
            showToast(t('toast.file_selected', { filename: fileName }), 'success');
        }
    });
    // Permettre de cliquer sur la boîte pour ouvrir le sélecteur
    box.addEventListener('click', (e) => {
        if (e.target !== input) input.click();
    });
}

async function uploadFileDirect(file, box, fieldName) {
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

// Initialiser les uploads fixes (diplôme et pièce d'identité)
setupFileUpload('upload-diplome', 'diplomaFile');
setupFileUpload('upload-piece', 'idCardFile');

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

// ========== TOAST, LOADER ==========
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

    const disciplineConfig = disciplineFields[discipline];
    if (!disciplineConfig) {
        showToast('Erreur configuration discipline', 'error');
        return;
    }
    const specificUploads = {};
    for (const field of disciplineConfig.fields) {
        const inputEl = document.getElementById(field.name);
        if (field.required && (!inputEl || !inputEl.files.length)) {
            showToast(`Veuillez télécharger : ${field.label}`, 'error');
            return;
        }
        if (inputEl && inputEl.files.length) {
            specificUploads[field.name] = inputEl.files[0];
        }
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléversement...';
    showLoader();

    try {
        // Upload des fichiers obligatoires (diplôme, pièce d'identité)
        const [diplomaUrl, idCardUrl] = await Promise.all([
            uploadFileDirect(diplomaFile, diplomaBox, 'diplome'),
            uploadFileDirect(idCardFile, idCardBox, 'idcard')
        ]);

        // Upload des fichiers spécifiques
        const specificUrls = {};
        for (const [key, file] of Object.entries(specificUploads)) {
            const box = document.getElementById(`upload-${key}`);
            if (box && file) {
                specificUrls[key] = await uploadFileDirect(file, box, key);
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
