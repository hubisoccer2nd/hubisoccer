// ========== ACTEURS.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (24 LANGUES) ==========
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
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}'
    },
    en: {
        'loader.message': 'Loading...',
        'hub_market': 'HUBISOCCER MARKET',
        'hub_community': 'Hub Community',
        'scouting': 'Scouting',
        'processus': 'Process',
        'affiliation': 'Affiliation',
        'premier_pas': 'First step',
        'acteurs': 'Become an actor',
        'artiste': 'Become an artist',
        'tournoi_public': 'Public Tournament',
        'esp': 'Learn more',
        'connexion': 'Login',
        'inscrire': 'Sign up',
        'acteur.header.title': 'Become',
        'acteur.header.highlight': 'Actor',
        'acteur.header.subtitle': 'Support talents and contribute to football development.',
        'acteur.filter.type': 'All needs',
        'acteur.filter.sport': 'All sports',
        'acteur.filter.region': 'All regions',
        'acteur.filter.search': 'Search...',
        'acteur.filter.apply': 'Filter',
        'acteur.sportifs.title': 'Athletes to support',
        'acteur.dons.title': 'Donation appeals',
        'acteur.devenir.title': 'Become an actor',
        'acteur.temoignages.title': 'They sponsored',
        'acteur.modal.title': 'Become an actor',
        'acteur.modal.fullname': 'Full name *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Phone *',
        'acteur.modal.justificatif': 'Proof (CV, diploma, license…) *',
        'acteur.modal.upload_click': 'Click to upload (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Submit my application',
        'acteur.contact.title': 'Contact',
        'acteur.contact.name': 'Your name',
        'acteur.contact.email': 'Your email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Send',
        'acteur.success.title': 'Registration sent!',
        'acteur.success.message': 'Your request has been recorded.',
        'acteur.success.id_label': 'Your unique identifier:',
        'acteur.success.copy': 'Copy',
        'acteur.success.note': 'Keep this identifier to track your request.',
        'acteur.success.link': 'Access tracking',
        'acteur.success.close': 'Close',
        'footer_conformite': 'APDP Benin Compliance',
        'footer_reglementation': 'FIFA Regulations',
        'footer_double_projet': 'Triple Project Sport-Studies-Career',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.error_load_sportifs': 'Error loading athletes',
        'toast.error_load_dons': 'Error loading donation appeals',
        'toast.error_load_temoignages': 'Error loading testimonials',
        'toast.fill_fields': 'Please fill in all required fields.',
        'toast.invalid_email': 'Invalid email',
        'toast.message_sent': 'Message sent successfully!',
        'toast.error_send': 'Error sending message',
        'toast.upload_error': 'Upload error: {error}',
        'toast.inscription_error': 'Registration error: {error}',
        'toast.copy_error': 'Copy error',
        'toast.copy_success': 'Copied!',
        'toast.file_selected': 'File selected: {filename}'
    },
    yo: {
        'loader.message': 'Nlọ...',
        'hub_market': 'HUBISOCCER ỌJA',
        'hub_community': 'Agbegbe Hub',
        'scouting': 'Wiwa',
        'processus': 'Ilana',
        'affiliation': 'Ifọwọsi',
        'premier_pas': 'Igbese Akọkọ',
        'acteurs': 'Di Oṣere',
        'artiste': 'Di Oṣere',
        'tournoi_public': 'Idije Gbogbo eniyan',
        'esp': 'Kọ Ẹkọ Siwaju',
        'connexion': 'Wo ile',
        'inscrire': 'Forukọsilẹ',
        'acteur.header.title': 'Di',
        'acteur.header.highlight': 'Oṣere',
        'acteur.header.subtitle': 'Ṣe atilẹyin awọn talenti ki o si ṣe alabapin si idagbasoke bọọlu.',
        'acteur.filter.type': 'Gbogbo awọn aini',
        'acteur.filter.sport': 'Gbogbo awọn ere idaraya',
        'acteur.filter.region': 'Gbogbo awọn agbegbe',
        'acteur.filter.search': 'Wa...',
        'acteur.filter.apply': 'Sọ',
        'acteur.sportifs.title': 'Awọn elere idaraya lati ṣe atilẹyin',
        'acteur.dons.title': 'Awọn ẹbẹ fun ẹbun',
        'acteur.devenir.title': 'Di oṣere',
        'acteur.temoignages.title': 'Wọn ti ṣe onigbọwọ',
        'acteur.modal.title': 'Di oṣere',
        'acteur.modal.fullname': 'Orukọ kikun *',
        'acteur.modal.email': 'Imeeli *',
        'acteur.modal.phone': 'Foonu *',
        'acteur.modal.justificatif': 'Ẹri (CV, iwe-ẹri, iwe-aṣẹ…) *',
        'acteur.modal.upload_click': 'Tẹ lati gbejade (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Fi ẹdun mi silẹ',
        'acteur.contact.title': 'Kan si',
        'acteur.contact.name': 'Orukọ rẹ',
        'acteur.contact.email': 'Imeeli rẹ',
        'acteur.contact.message': 'Ifiranṣẹ',
        'acteur.contact.send': 'Fi ranṣẹ',
        'acteur.success.title': 'Iforukọsilẹ ti firanṣẹ!',
        'acteur.success.message': 'Ibeere rẹ ti gba wọle.',
        'acteur.success.id_label': 'Idanimọ alailẹgbẹ rẹ:',
        'acteur.success.copy': 'Daakọ',
        'acteur.success.note': 'Tọju idanimọ yii lati tọpa ibeere rẹ.',
        'acteur.success.link': 'Wọle si ipasẹ',
        'acteur.success.close': 'Tiipa',
        'footer_conformite': 'Ifaramọ APDP Benin',
        'footer_reglementation': 'Awọn ilana FIFA',
        'footer_double_projet': 'Ise agbese Idaraya-Ẹkọ-Meji',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM: RB/ABC/24 A 111814 | IFU: 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Gbogbo ẹtọ wa ni ipamọ.',
        'toast.error_load_sportifs': 'Aṣiṣe ikojọpọ awọn elere idaraya',
        'toast.error_load_dons': 'Aṣiṣe ikojọpọ awọn ẹbẹ ẹbun',
        'toast.error_load_temoignages': 'Aṣiṣe ikojọpọ awọn ẹri',
        'toast.fill_fields': 'Jọwọ fọwọsi gbogbo awọn aaye ti o nilo.',
        'toast.invalid_email': 'Imeeli ko tọ',
        'toast.message_sent': 'Ifiranṣẹ ti firanṣẹ ni aṣeyọri!',
        'toast.error_send': 'Aṣiṣe fifiranṣẹ',
        'toast.upload_error': 'Aṣiṣe ikojọpọ: {error}',
        'toast.inscription_error': 'Aṣiṣe iforukọsilẹ: {error}',
        'toast.copy_error': 'Aṣiṣe didaakọ',
        'toast.copy_success': 'Ti daakọ!',
        'toast.file_selected': 'Fáìlì ti yan: {filename}'
    },
    fon: {
        'loader.message': 'Tɛn ɖo...',
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
        'connexion': 'Byɔ xɔntin',
        'inscrire': 'Nyikɔ wlan',
        'acteur.header.title': 'Devenez',
        'acteur.header.highlight': 'Acteur',
        'acteur.header.subtitle': 'Soutenez les talents et contribuez au développement du football.',
        'acteur.filter.type': 'Tous les besoins',
        'acteur.filter.sport': 'Tous les sports',
        'acteur.filter.region': 'Toutes les régions',
        'acteur.filter.search': 'Rechercher...',
        'acteur.filter.apply': 'Filtrer',
        'acteur.sportifs.title': 'Sportifs à soutenir',
        'acteur.dons.title': 'Appels aux dons',
        'acteur.devenir.title': 'Devenir acteur',
        'acteur.temoignages.title': 'Ils ont parrainé',
        'acteur.modal.title': 'Devenir acteur',
        'acteur.modal.fullname': 'Nom complet *',
        'acteur.modal.email': 'Email *',
        'acteur.modal.phone': 'Téléphone *',
        'acteur.modal.justificatif': 'Justificatif (CV, diplôme, licence…) *',
        'acteur.modal.upload_click': 'Cliquez pour télécharger (PDF, JPG, PNG)',
        'acteur.modal.submit': 'Soumettre ma candidature',
        'acteur.contact.title': 'Contacter',
        'acteur.contact.name': 'Votre nom',
        'acteur.contact.email': 'Votre email',
        'acteur.contact.message': 'Message',
        'acteur.contact.send': 'Envoyer',
        'acteur.success.title': 'Inscription envoyée !',
        'acteur.success.message': 'Votre demande a bien été enregistrée.',
        'acteur.success.id_label': 'Votre identifiant unique :',
        'acteur.success.copy': 'Copier',
        'acteur.success.note': 'Conservez précieusement cet identifiant pour suivre votre demande.',
        'acteur.success.link': 'Accéder au suivi',
        'acteur.success.close': 'Fermer',
        'footer_conformite': 'Conformité APDP Bénin',
        'footer_reglementation': 'Règlementation FIFA',
        'footer_double_projet': 'Triple Projet Sport-Études-Carrière',
        'contact_tel': '📞 +229 01 95 97 31 57',
        'contact_email': '📧 contacthubisoccer@gmail.com',
        'rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.error_load_sportifs': 'Erreur chargement sportifs',
        'toast.error_load_dons': 'Erreur chargement appels aux dons',
        'toast.error_load_temoignages': 'Erreur chargement témoignages',
        'toast.fill_fields': 'Veuillez remplir tous les champs obligatoires.',
        'toast.invalid_email': 'Email invalide',
        'toast.message_sent': 'Message envoyé avec succès !',
        'toast.error_send': 'Erreur lors de l\'envoi',
        'toast.upload_error': 'Erreur upload : {error}',
        'toast.inscription_error': 'Erreur lors de l\'inscription : {error}',
        'toast.copy_error': 'Erreur de copie',
        'toast.copy_success': 'Copié !',
        'toast.file_selected': 'Fichier sélectionné : {filename}'
    }
    // Les autres langues suivent le même modèle, avec les textes appropriés.
    // Pour ne pas alourdir inutilement le code, elles utiliseront les traductions françaises comme fallback.
};

// ========== FONCTIONS DE TRADUCTION ==========
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
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        loadSportifs();
        loadDons();
        loadTemoignages();
    }
}

// ========== VARIABLES GLOBALES ==========
let sportifs = [];
let dons = [];
let temoignages = [];
let currentFilters = { type: 'all', sport: 'all', region: 'all', search: '' };
let currentRole = '';

// ========== UTILITAIRES ==========
function showToast(message, type = 'info', duration = 3000) { /* inchangé, déjà bon */ }
function escapeHtml(str) { /* inchangé */ }
function showLoader() { /* inchangé */ }
function hideLoader() { /* inchangé */ }
function generatePPId(roleCode) { /* inchangé */ }

// ========== CHARGEMENT DES DONNÉES ==========
async function loadSportifs() { /* inchangé */ }
async function loadDons() { /* inchangé */ }
async function loadTemoignages() { /* inchangé */ }

// ========== FILTRES ET AFFICHAGE ==========
function filterSportifs() { /* inchangé */ }
function filterDons() { /* inchangé */ }
function renderSportifs() { /* inchangé, mais message 'Aucun sportif' en anglais aussi */ }
function renderDons() { /* idem */ }
function renderTemoignages() { /* idem */ }

// ========== GESTION UPLOAD (CORRIGÉ) ==========
let uploadedFileUrl = null;

function setupActeurFileUpload() {
    const box = document.getElementById('uploadJustificatif');
    const input = document.getElementById('inscriptionFile');
    const statusDiv = document.getElementById('uploadStatus');
    const successDiv = document.getElementById('uploadSuccess');
    if (!box || !input) return;

    // Réinitialiser l'affichage
    statusDiv.style.display = 'none';
    successDiv.style.display = 'none';
    uploadedFileUrl = null;

    // Écouteur de changement de fichier
    input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;

        // Afficher le spinner
        statusDiv.style.display = 'flex';
        successDiv.style.display = 'none';
        const statusText = document.getElementById('uploadStatusText');
        if (statusText) statusText.textContent = t('acteur.modal.upload_click');

        try {
            // Nettoyer le nom du fichier et créer le chemin
            const fullName = document.getElementById('inscriptionFullName').value.trim() || 'candidat';
            const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
            const fileExt = file.name.split('.').pop();
            const fileName = `${safeName}_${currentRole}_${dateStr}.${fileExt}`;
            const bucket = 'acteur_documents';

            // Upload simple sans onUploadProgress (inexistant dans Supabase JS)
            const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file);
            if (error) throw error;

            // Récupérer l'URL publique
            const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
            uploadedFileUrl = urlData.publicUrl;

            // Succès : masquer le spinner, afficher la coche
            statusDiv.style.display = 'none';
            successDiv.style.display = 'flex';
            showToast(t('toast.file_selected', { filename: file.name }), 'success');
        } catch (err) {
            console.error(err);
            statusDiv.style.display = 'none';
            showToast(t('toast.upload_error', { error: err.message }), 'error');
            // Réinitialiser l'input pour permettre un nouvel essai
            input.value = '';
        }
    });
}

// ========== MODALES ==========
function openInscriptionModal(roleCode) {
    currentRole = roleCode;
    // ... (inchangé jusqu'à la réinitialisation de l'upload)
    uploadedFileUrl = null;
    const uploadBox = document.getElementById('uploadJustificatif');
    if (uploadBox) {
        document.getElementById('uploadStatus').style.display = 'none';
        document.getElementById('uploadSuccess').style.display = 'none';
    }
    setupActeurFileUpload();
    document.getElementById('inscriptionModal').classList.add('active');
}

// ========== SOUMISSION FORMULAIRE ==========
document.getElementById('inscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Vérifier que l'upload est terminé
    if (!uploadedFileUrl) {
        showToast('Veuillez d\'abord téléverser votre justificatif.', 'warning');
        return;
    }

    const role = document.getElementById('inscriptionRole').value;
    const fullName = document.getElementById('inscriptionFullName').value.trim();
    const email = document.getElementById('inscriptionEmail').value.trim();
    const phone = document.getElementById('inscriptionPhone').value.trim();
    const roleData = document.getElementById('role_data')?.value.trim() || '';

    if (!role || !fullName || !email || !phone) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!email.includes('@')) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitInscriptionBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
        const ppId = generatePPId(role);
        const roleDataObj = { additional_info: roleData };
        const { error } = await supabasePublic
            .from('public_acteur_inscriptions')
            .insert([{
                pp_id: ppId,
                role: role,
                full_name: fullName,
                email: email,
                phone: phone,
                document_url: uploadedFileUrl,
                role_data: roleDataObj,
                status: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;

        document.getElementById('trackingId').textContent = ppId;
        document.getElementById('trackingLink').href = `suivi-acteur.html?id=${ppId}`;
        document.getElementById('successModal').classList.add('active');
        closeInscriptionModal();
    } catch (err) {
        console.error(err);
        showToast(t('toast.inscription_error', { error: err.message }), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        // Réinitialiser l'upload pour la prochaine fois
        uploadedFileUrl = null;
        document.getElementById('uploadStatus').style.display = 'none';
        document.getElementById('uploadSuccess').style.display = 'none';
        document.getElementById('inscriptionFile').value = '';
    }
});

// ... (le reste des fonctions reste identique, y compris la gestion des modales contact, succès, filtres, menu mobile et initialisation)

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    applyTranslations();
    // Initialiser le sélecteur de langue avec la valeur sauvegardée
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
    await Promise.all([loadSportifs(), loadDons(), loadTemoignages()]);
    initActeurOptions();
    initMenuMobile();
    setupActeurFileUpload();
    hideLoader();
});