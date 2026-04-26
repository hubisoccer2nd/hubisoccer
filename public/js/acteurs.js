// ========== ACTEURS.JS ==========
// Configuration Supabase (projet public)
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS (24 langues – version complète pour cette page) ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'nav.scouting': 'SCOUTING',
        'nav.actors': 'SUIVI ACTEUR',
        'nav.affiliation': 'AFFILIATION',
        'nav.actors': 'DEVENIR ACTEUR',
        'nav.tournaments': 'TOURNOIS PUBLIC',
        'nav.community': 'HUB COMMUNITY',
        'nav.market': 'E-MARKETING-HUBISOCCER',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
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
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
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
        'nav.scouting': 'Scouting',
        'nav.process': 'Process',
        'nav.affiliation': 'Affiliation',
        'nav.actors': 'Become an actor',
        'nav.tournaments': 'Tournaments',
        'nav.community': 'Community',
        'nav.market': 'Market',
        'nav.login': 'Login',
        'nav.signup': 'Sign up',
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
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
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
    }
};

let currentLang = localStorage.getItem('acteurs_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('acteurs_lang', lang);
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

// ========== FONCTIONS UTILITAIRES ==========
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

function generatePPId(roleCode) {
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
    return `${randomPart}-${vaPart}-HubIS-${roleCode}-${secondsPart}-${counter}`;
}

// ========== CHARGEMENT DES DONNÉES ==========
async function loadSportifs() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_sportifs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        sportifs = data || [];
        renderSportifs();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_sportifs'), 'error');
    } finally {
        hideLoader();
    }
}

async function loadDons() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_dons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        dons = data || [];
        renderDons();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_dons'), 'error');
    } finally {
        hideLoader();
    }
}

async function loadTemoignages() {
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_acteur_temoignages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        temoignages = data || [];
        renderTemoignages();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_load_temoignages'), 'error');
    } finally {
        hideLoader();
    }
}

// ========== FILTRES ET RENDU ==========
function filterSportifs() {
    let filtered = [...sportifs];
    if (currentFilters.sport !== 'all') {
        filtered = filtered.filter(s => s.sport === currentFilters.sport);
    }
    if (currentFilters.region !== 'all') {
        filtered = filtered.filter(s => s.region === currentFilters.region);
    }
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(s => s.full_name?.toLowerCase().includes(search) || s.description?.toLowerCase().includes(search));
    }
    return filtered;
}

function filterDons() {
    let filtered = [...dons];
    if (currentFilters.region !== 'all') {
        filtered = filtered.filter(d => d.region === currentFilters.region);
    }
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(d => d.title?.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search));
    }
    return filtered;
}

function renderSportifs() {
    const container = document.getElementById('sportifsGrid');
    if (!container) return;
    const filtered = filterSportifs();
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun sportif trouvé.</p>';
        return;
    }
    container.innerHTML = filtered.map(s => `
        <div class="card">
            ${s.image_url ? `<img src="${s.image_url}" class="card-image" alt="${escapeHtml(s.full_name)}">` : '<div class="card-image" style="background:#e9ecef; display:flex; align-items:center; justify-content:center;"><i class="fas fa-user-circle" style="font-size:3rem; color:#ccc;"></i></div>'}
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(s.full_name)}</h3>
                <p class="card-desc">${escapeHtml(s.sport)} • ${escapeHtml(s.region)}</p>
                <p class="card-desc">${escapeHtml(s.description || '')}</p>
                <div class="card-footer">
                    <button class="btn-contact" data-type="sportif" data-id="${s.id}" data-name="${escapeHtml(s.full_name)}">Contacter</button>
                </div>
            </div>
        </div>
    `).join('');
    attachContactButtons();
}

function renderDons() {
    const container = document.getElementById('donsGrid');
    if (!container) return;
    const filtered = filterDons();
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun appel aux dons trouvé.</p>';
        return;
    }
    container.innerHTML = filtered.map(d => `
        <div class="card">
            ${d.image_url ? `<img src="${d.image_url}" class="card-image" alt="${escapeHtml(d.title)}">` : '<div class="card-image" style="background:#e9ecef; display:flex; align-items:center; justify-content:center;"><i class="fas fa-hand-holding-heart" style="font-size:3rem; color:#ccc;"></i></div>'}
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(d.title)}</h3>
                <p class="card-desc">${escapeHtml(d.description || '')}</p>
                <div class="card-footer">
                    <button class="btn-contact" data-type="don" data-id="${d.id}" data-name="${escapeHtml(d.title)}">Je soutiens</button>
                </div>
            </div>
        </div>
    `).join('');
    attachContactButtons();
}

function renderTemoignages() {
    const container = document.getElementById('temoignagesGrid');
    if (!container) return;
    if (temoignages.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun témoignage pour le moment.</p>';
        return;
    }
    container.innerHTML = temoignages.map(t => `
        <div class="card">
            <div class="card-content">
                <p class="card-desc">"${escapeHtml(t.content)}"</p>
                <div class="card-footer">
                    <span>— ${escapeHtml(t.author)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function attachContactButtons() {
    document.querySelectorAll('.btn-contact').forEach(btn => {
        btn.removeEventListener('click', contactHandler);
        btn.addEventListener('click', contactHandler);
    });
}

function contactHandler(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    openContactModal(type, id, name);
}

// ========== MODALE CONTACT ==========
function openContactModal(type, id, name) {
    document.getElementById('contactTargetType').value = type;
    document.getElementById('contactTargetId').value = id;
    document.getElementById('contactModalTitle').textContent = t('acteur.contact.title') + ' ' + name;
    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
    document.getElementById('contactForm').reset();
}

async function sendContactMessage(e) {
    e.preventDefault();
    const targetType = document.getElementById('contactTargetType').value;
    const targetId = document.getElementById('contactTargetId').value;
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showToast(t('toast.fill_fields'), 'warning');
        return;
    }
    if (!email.includes('@')) {
        showToast(t('toast.invalid_email'), 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_acteur_contacts')
            .insert([{
                target_type: targetType,
                target_id: targetId,
                sender_name: name,
                sender_email: email,
                message: message,
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;
        showToast(t('toast.message_sent'), 'success');
        closeContactModal();
    } catch (err) {
        console.error(err);
        showToast(t('toast.error_send'), 'error');
    } finally {
        hideLoader();
    }
}

// ========== OPTIONS DEVENIR ACTEUR ==========
function initActeurOptions() {
    const roles = [
        { code: 'PR', label: 'Parrain', icon: 'fas fa-hand-holding-heart', description: 'Soutenez financièrement les talents.' },
        { code: 'ST', label: 'Staff médical', icon: 'fas fa-notes-medical', description: 'Accompagnez les joueurs dans leur santé.' },
        { code: 'CO', label: 'Coach', icon: 'fas fa-chalkboard-teacher', description: 'Partagez votre expertise.' },
        { code: 'AG', label: 'Agent', icon: 'fas fa-user-tie', description: 'Représentez des sportifs.' },
        { code: 'AC', label: 'Académie', icon: 'fas fa-school', description: 'Recrutez des jeunes talents.' },
        { code: 'CL', label: 'Club', icon: 'fas fa-building', description: 'Recrutez des joueurs.' },
        { code: 'FO', label: 'Formateur', icon: 'fas fa-chalkboard', description: 'Formez la prochaine génération.' }
    ];
    const container = document.getElementById('acteurOptions');
    if (!container) return;
    container.innerHTML = roles.map(r => `
        <div class="acteur-card" data-role="${r.code}">
            <i class="${r.icon}"></i>
            <h3>${r.label}</h3>
            <p>${r.description}</p>
            <button class="btn-acteur" data-role="${r.code}">Devenir ${r.label}</button>
        </div>
    `).join('');
    document.querySelectorAll('.btn-acteur, .acteur-card').forEach(el => {
        el.addEventListener('click', (e) => {
            const roleCode = el.dataset.role || el.closest('.acteur-card')?.dataset.role;
            if (roleCode) openInscriptionModal(roleCode);
        });
    });
}

// ========== GESTION UPLOAD FICHIER ==========
function setupActeurFileUpload() {
    const box = document.getElementById('uploadJustificatif');
    const input = document.getElementById('inscriptionFile');
    if (!box || !input) return;
    const newBox = box.cloneNode(true);
    box.parentNode.replaceChild(newBox, box);
    const newInput = newBox.querySelector('#inscriptionFile');
    newBox.addEventListener('click', (e) => {
        e.stopPropagation();
        newInput.value = '';
        newInput.click();
    });
    newInput.addEventListener('change', () => {
        if (newInput.files.length > 0) {
            const fileName = newInput.files[0].name;
            const span = newBox.querySelector('span:not(.progress-text)');
            if (span) span.textContent = fileName;
            newBox.style.borderColor = 'var(--primary)';
            showToast(t('toast.file_selected', { filename: fileName }), 'success');
        }
    });
    return { box: newBox, input: newInput };
}

// ========== MODALE INSCRIPTION (DEVENIR ACTEUR) ==========
function openInscriptionModal(roleCode) {
    currentRole = roleCode;
    document.getElementById('inscriptionRole').value = roleCode;
    const roleName = {
        PR: 'Parrain', ST: 'Staff médical', CO: 'Coach', AG: 'Agent',
        AC: 'Académie', CL: 'Club', FO: 'Formateur'
    }[roleCode] || 'Acteur';
    document.getElementById('inscriptionModalTitle').textContent = t('acteur.modal.title') + ' ' + roleName;
    document.getElementById('inscriptionForm').reset();
    const roleFieldsDiv = document.getElementById('roleSpecificFields');
    roleFieldsDiv.innerHTML = `
        <div class="form-group">
            <label>Informations complémentaires</label>
            <textarea id="role_data" rows="3" placeholder="Détails sur votre motivation, expérience..."></textarea>
        </div>
    `;
    const uploadBox = document.getElementById('uploadJustificatif');
    if (uploadBox) {
        const span = uploadBox.querySelector('span:not(.progress-text)');
        if (span) span.textContent = t('acteur.modal.upload_click');
        uploadBox.style.borderColor = '';
        const progressIndicator = uploadBox.querySelector('.progress-indicator');
        if (progressIndicator) progressIndicator.style.display = 'none';
        uploadBox.classList.remove('uploading', 'success');
    }
    const fileInput = document.getElementById('inscriptionFile');
    if (fileInput) fileInput.value = '';
    setupActeurFileUpload();
    document.getElementById('inscriptionModal').classList.add('active');
}

function closeInscriptionModal() {
    document.getElementById('inscriptionModal').classList.remove('active');
    currentRole = null;
}

// ========== UPLOAD AVEC PROGRESSION (nommage standardisé) ==========
async function uploadFileWithProgress(file, box) {
    const fullName = document.getElementById('inscriptionFullName').value.trim();
    const safeName = fullName ? fullName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 'candidat';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `${safeName}_${currentRole}_${dateStr}.${fileExt}`;
    const bucket = 'acteur_documents';

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

// ========== SOUMISSION FORMULAIRE INSCRIPTION ==========
document.getElementById('inscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('inscriptionRole').value;
    const fullName = document.getElementById('inscriptionFullName').value.trim();
    const email = document.getElementById('inscriptionEmail').value.trim();
    const phone = document.getElementById('inscriptionPhone').value.trim();
    const roleData = document.getElementById('role_data')?.value.trim() || '';
    const fileInput = document.getElementById('inscriptionFile');
    const file = fileInput.files[0];

    if (!role || !fullName || !email || !phone || !file) {
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

    const uploadBox = document.getElementById('uploadJustificatif');
    try {
        const fileUrl = await uploadFileWithProgress(file, uploadBox);
        const ppId = generatePPId(role);
        const roleDataObj = { additional_info: roleData };
        const { error: insertError } = await supabasePublic
            .from('public_acteur_inscriptions')
            .insert([{
                pp_id: ppId,
                role: role,
                full_name: fullName,
                email: email,
                phone: phone,
                document_url: fileUrl,
                role_data: roleDataObj,
                status: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (insertError) throw insertError;

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
        uploadBox.classList.remove('uploading', 'success');
        const progressText = uploadBox.querySelector('.progress-text');
        if (progressText) progressText.textContent = '0%';
        const progressBar = uploadBox.querySelector('.progress-bar');
        if (progressBar) progressBar.style.strokeDashoffset = '113.1';
        const fileInputReset = document.getElementById('inscriptionFile');
        fileInputReset.value = '';
        const span = uploadBox.querySelector('span:not(.progress-text)');
        if (span) span.textContent = t('acteur.modal.upload_click');
    }
});

// ========== COPIE ID ET FERMETURE MODALE SUCCÈS ==========
document.getElementById('copyTrackingBtn').addEventListener('click', () => {
    const link = document.getElementById('trackingId').textContent;
    if (link) {
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copyTrackingBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> ' + t('toast.copy_success');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> ' + t('acteur.success.copy');
            }, 2000);
        }).catch(() => showToast(t('toast.copy_error'), 'error'));
    }
});

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}
window.closeSuccessModal = closeSuccessModal;

// ========== FILTRES ==========
document.getElementById('applyFilters').addEventListener('click', () => {
    currentFilters.type = document.getElementById('filterType').value;
    currentFilters.sport = document.getElementById('filterSport').value;
    currentFilters.region = document.getElementById('filterRegion').value;
    currentFilters.search = document.getElementById('searchInput').value;
    renderSportifs();
    renderDons();
});

document.getElementById('contactForm').addEventListener('submit', sendContactMessage);

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
        langSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    applyTranslations();
    initLangSelector();
    await Promise.all([loadSportifs(), loadDons(), loadTemoignages()]);
    initActeurOptions();
    initMenuMobile();
    setupActeurFileUpload();
    hideLoader();
});