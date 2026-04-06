// ========== TEST-PRATIQUE.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Traductions (24 langues – version complète)
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
        'nav.follow_test': 'SUIVI TEST PRATIQUE',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        'pratique.title': 'Test pratique – Dépôt vidéo',
        'pratique.subtitle': 'Avant d’accéder au guide et à l’examen, nos analystes étudient tes capacités à travers deux courtes vidéos adaptées à ton sport.',
        'pratique.id_label': 'ID de suivi (PP ID) *',
        'pratique.nom': 'Nom *',
        'pratique.prenom': 'Prénom(s) *',
        'pratique.sport': 'Sport *',
        'pratique.poste': 'Poste / Discipline *',
        'pratique.video1_label': 'Vidéo 1 – (max 5 min) *',
        'pratique.video2_label': 'Vidéo 2 – (max 5 min) *',
        'pratique.upload_click': 'Cliquez pour télécharger la vidéo',
        'pratique.submit': 'Envoyer mes vidéos',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.id_not_found': 'ID introuvable ou dossier non approuvé.',
        'toast.fill_fields': 'Veuillez remplir tous les champs.',
        'toast.video1_required': 'Veuillez sélectionner la vidéo 1.',
        'toast.video2_required': 'Veuillez sélectionner la vidéo 2.',
        'toast.upload_error': 'Erreur upload vidéo : {error}',
        'toast.insert_error': 'Erreur sauvegarde : {error}',
        'toast.success': 'Vidéos envoyées avec succès ! Redirection...',
        'instructions.football': 'Pour le football : montrez contrôle de balle, dribbles, frappes (vidéo 1) et placement, vision du jeu (vidéo 2).',
        'instructions.basketball': 'Basketball : dribbles, tirs (vidéo 1) et déplacements, lecture du jeu (vidéo 2).',
        'instructions.tennis': 'Tennis : coups droits, revers (vidéo 1) et déplacements, placement (vidéo 2).',
        'instructions.athletisme': 'Athlétisme : gestuelle technique (vidéo 1) et endurance/vitesse (vidéo 2).',
        'instructions.handball': 'Handball : tirs, dribbles (vidéo 1) et placement défensif (vidéo 2).',
        'instructions.volleyball': 'Volley : service, attaque (vidéo 1) et réception, bloc (vidéo 2).',
        'instructions.rugby': 'Rugby : passes, plaquages (vidéo 1) et vision du jeu (vidéo 2).',
        'instructions.natation': 'Natation : technique de nage (vidéo 1) et endurance (vidéo 2).',
        'instructions.arts_martiaux': 'Arts martiaux : enchaînements techniques (vidéo 1) et combat/placement (vidéo 2).',
        'instructions.cyclisme': 'Cyclisme : technique de pédalage (vidéo 1) et gestion d’effort (vidéo 2).'
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
        'nav.follow_test': 'PRACTICAL TEST TRACKING',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
        'pratique.title': 'Practical test – Video upload',
        'pratique.subtitle': 'Before accessing the guide and exam, our analysts study your skills through two short videos adapted to your sport.',
        'pratique.id_label': 'Tracking ID (PP ID) *',
        'pratique.nom': 'Last name *',
        'pratique.prenom': 'First name(s) *',
        'pratique.sport': 'Sport *',
        'pratique.poste': 'Position / Discipline *',
        'pratique.video1_label': 'Video 1 – (max 5 min) *',
        'pratique.video2_label': 'Video 2 – (max 5 min) *',
        'pratique.upload_click': 'Click to upload video',
        'pratique.submit': 'Send my videos',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.id_not_found': 'ID not found or file not approved.',
        'toast.fill_fields': 'Please fill in all fields.',
        'toast.video1_required': 'Please select video 1.',
        'toast.video2_required': 'Please select video 2.',
        'toast.upload_error': 'Video upload error: {error}',
        'toast.insert_error': 'Save error: {error}',
        'toast.success': 'Videos sent successfully! Redirecting...',
        'instructions.football': 'Football: show ball control, dribbling, shooting (video 1) and positioning, game vision (video 2).',
        'instructions.basketball': 'Basketball: dribbling, shooting (video 1) and movement, game reading (video 2).',
        'instructions.tennis': 'Tennis: forehand, backhand (video 1) and movement, positioning (video 2).',
        'instructions.athletisme': 'Athletics: technical gesture (video 1) and endurance/speed (video 2).',
        'instructions.handball': 'Handball: shooting, dribbling (video 1) and defensive positioning (video 2).',
        'instructions.volleyball': 'Volleyball: serve, attack (video 1) and reception, block (video 2).',
        'instructions.rugby': 'Rugby: passes, tackles (video 1) and game vision (video 2).',
        'instructions.natation': 'Swimming: swimming technique (video 1) and endurance (video 2).',
        'instructions.arts_martiaux': 'Martial arts: technical sequences (video 1) and fighting/positioning (video 2).',
        'instructions.cyclisme': 'Cycling: pedaling technique (video 1) and effort management (video 2).'
    }
};

let currentLang = localStorage.getItem('test_pratique_lang') || navigator.language.split('-')[0];
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
    updateSportInstructions();
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('test_pratique_lang', lang);
        applyTranslations();
        showToast('Langue changée', 'info');
    }
}

// Éléments DOM
const form = document.getElementById('uploadForm');
const ppIdInput = document.getElementById('pp_id');
const nomInput = document.getElementById('nom');
const prenomInput = document.getElementById('prenom');
const sportSelect = document.getElementById('sport');
const posteSelect = document.getElementById('poste');
const video1Input = document.getElementById('video1');
const video2Input = document.getElementById('video2');
const video1Name = document.getElementById('video1-name');
const video2Name = document.getElementById('video2-name');
const uploadBox1 = document.getElementById('upload-video1');
const uploadBox2 = document.getElementById('upload-video2');
const globalProgress = document.querySelector('.progress-global');
const submitBtn = document.querySelector('.btn-submit');

let currentSport = '';

// Options de poste par sport
const postesOptions = {
    football: ['Gardien de But', 'Défenseur Central', 'Latéral', 'Milieu Défensif', 'Milieu Offensif', 'Attaquant / Ailier'],
    basketball: ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot'],
    tennis: ['Simple', 'Double'],
    athletisme: ['Sprint', 'Fond', 'Sauts', 'Lancers', 'Haies'],
    handball: ['Gardien', 'Arrière', 'Demi-centre', 'Ailier', 'Pivot'],
    volleyball: ['Passeur', 'Réceptionneur-attaquant', 'Central', 'Pointu', 'Libéro'],
    rugby: ['Pilier', 'Talonneur', '2e ligne', '3e ligne', 'Demi', 'Arrière'],
    natation: ['Nage libre', 'Dos', 'Brasse', 'Papillon', '4 nages'],
    arts_martiaux: ['Judo', 'Karaté', 'Boxe', 'Lutte', 'Taekwondo'],
    cyclisme: ['Route', 'VTT', 'Piste', 'BMX']
};

function updatePosteOptions() {
    const sport = sportSelect.value;
    currentSport = sport;
    if (!sport || !postesOptions[sport]) {
        posteSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';
        return;
    }
    let html = '<option value="">-- Sélectionnez --</option>';
    postesOptions[sport].forEach(opt => html += `<option value="${opt}">${opt}</option>`);
    posteSelect.innerHTML = html;
}

function updateSportInstructions() {
    const sport = sportSelect.value;
    const infoBox = document.getElementById('sportInstructions');
    if (!sport || !translations[currentLang][`instructions.${sport}`]) {
        infoBox.innerHTML = '';
        return;
    }
    infoBox.innerHTML = `<p><i class="fas fa-info-circle"></i> ${t(`instructions.${sport}`)}</p>`;
}

sportSelect.addEventListener('change', () => {
    updatePosteOptions();
    updateSportInstructions();
});

// Gestion des fichiers avec réinitialisation
function setupVideoUpload(boxId, inputId, nameId) {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    const nameSpan = document.getElementById(nameId);
    if (!box || !input) return;
    const newBox = box.cloneNode(true);
    box.parentNode.replaceChild(newBox, box);
    const newInput = newBox.querySelector('input[type="file"]');
    const newNameSpan = newBox.querySelector('.file-name');
    newBox.addEventListener('click', (e) => {
        e.stopPropagation();
        newInput.value = '';
        newInput.click();
    });
    newInput.addEventListener('change', () => {
        if (newInput.files.length) {
            const file = newInput.files[0];
            if (file.size > 500 * 1024 * 1024) {
                showToast('La vidéo ne doit pas dépasser 500 Mo', 'warning');
                newInput.value = '';
                newNameSpan.textContent = 'Aucun fichier';
                return;
            }
            newNameSpan.textContent = file.name;
            showToast(`Fichier sélectionné : ${file.name}`, 'success');
        } else {
            newNameSpan.textContent = 'Aucun fichier';
        }
    });
    return { box: newBox, input: newInput, nameSpan: newNameSpan };
}

const video1 = setupVideoUpload('upload-video1', 'video1', 'video1-name');
const video2 = setupVideoUpload('upload-video2', 'video2', 'video2-name');

// Vérification de l'ID
async function verifyIdentity(ppId, nom, prenom) {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_premierpas')
            .select('pp_id, full_name, status')
            .eq('pp_id', ppId)
            .single();
        if (error || !data) {
            showToast(t('toast.id_not_found'), 'error');
            return false;
        }
        const fullName = data.full_name;
        const nomCompletSaisi = `${nom} ${prenom}`.trim();
        if (fullName !== nomCompletSaisi && fullName !== `${prenom} ${nom}`) {
            showToast('Le nom ne correspond pas à l\'ID.', 'error');
            return false;
        }
        if (data.status !== 'valide_public' && data.status !== 'test_ecrit') {
            showToast('Votre dossier doit être approuvé ou en statut "Test écrit" pour déposer des vidéos.', 'warning');
            return false;
        }
        return true;
    } catch (err) {
        showToast(t('toast.id_not_found'), 'error');
        return false;
    } finally {
        hideLoader();
    }
}

// Upload d'une vidéo avec progression via XHR
async function uploadVideoWithProgress(file, ppId, suffix, onProgress) {
    const safeName = ppId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `videos/${safeName}_${suffix}_${timestamp}.${fileExt}`;
    const bucket = 'analyses_videos';

    // Obtenir l'URL signée pour l'upload
    const { data: signedData, error: signedError } = await supabasePublic.storage
        .from(bucket)
        .createSignedUploadUrl(fileName);
    if (signedError) throw signedError;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedData.signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(e);
            }
        };
        xhr.onload = async () => {
            if (xhr.status === 200) {
                const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
                resolve(urlData.publicUrl);
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
    });
}

// Soumission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ppId = ppIdInput.value.trim();
    const nom = nomInput.value.trim();
    const prenom = prenomInput.value.trim();
    const sport = sportSelect.value;
    const poste = posteSelect.value;
    const file1 = video1.input.files[0];
    const file2 = video2.input.files[0];
    if (!ppId || !nom || !prenom || !sport || !poste) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!file1) { showToast(t('toast.video1_required'), 'warning'); return; }
    if (!file2) { showToast(t('toast.video2_required'), 'warning'); return; }
    const isValid = await verifyIdentity(ppId, nom, prenom);
    if (!isValid) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    globalProgress.style.display = 'block';
    const progressFill = globalProgress.querySelector('.progress-fill');
    progressFill.style.width = '0%';
    let progress1 = 0, progress2 = 0;
    function updateGlobalProgress() {
        const total = (progress1 + progress2) / 2;
        progressFill.style.width = `${total}%`;
    }
    try {
        let video1Url, video2Url;
        try {
            video1Url = await uploadVideoWithProgress(file1, ppId, 'video1', (e) => {
                progress1 = (e.loaded / e.total) * 100;
                updateGlobalProgress();
            });
            video2Url = await uploadVideoWithProgress(file2, ppId, 'video2', (e) => {
                progress2 = (e.loaded / e.total) * 100;
                updateGlobalProgress();
            });
        } catch (err) {
            throw new Error(t('toast.upload_error', { error: err.message }));
        }
        // Insertion dans la table public_analyses_videos
        const { error: insertError } = await supabasePublic
            .from('public_analyses_videos')
            .insert([{
                pp_id: ppId,
                nom: nom,
                prenom: prenom,
                sport: sport,
                poste: poste,
                video1_url: video1Url,
                video2_url: video2Url,
                statut: 'en_attente',
                date_soumission: new Date().toISOString()
            }]);
        if (insertError) throw new Error(t('toast.insert_error', { error: insertError.message }));
        showToast(t('toast.success'), 'success');
        setTimeout(() => {
            window.location.href = `suivi.html?id=${ppId}`;
        }, 2000);
    } catch (err) {
        showToast(err.message, 'error');
        globalProgress.style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ' + t('pratique.submit');
        globalProgress.style.display = 'none';
    }
});

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
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i></div><div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }
function showLoader() { const loader = document.getElementById('globalLoader'); if (loader) loader.style.display = 'flex'; }
function hideLoader() { const loader = document.getElementById('globalLoader'); if (loader) loader.style.display = 'none'; }

// Menu mobile
function initMenuMobile() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) { navLinks.classList.remove('active'); menuToggle.classList.remove('open'); } });
    }
}
function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    updatePosteOptions();
    updateSportInstructions();
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) ppIdInput.value = idFromUrl;
});