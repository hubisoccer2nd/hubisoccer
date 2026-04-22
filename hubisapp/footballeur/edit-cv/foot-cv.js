/* ============================================================
   HubISoccer — foot-cv.js
   CV Professionnel · Footballeur
   Corps · Âme · Esprit
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE & ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

let currentUser        = null;
let footballeurProfile = null;
let cvData             = null;       // enregistrement dans supabaseAuthPrive_cv_profiles
const ROLE_CODE        = 'FOOT';
const CV_TABLE         = 'supabaseAuthPrive_cv_profiles';
const DOCUMENTS_BUCKET = 'documents';
const SIGNATURE_PATH   = 'footballeur/edit-cv/signatures';

// Listes dynamiques
let cvEducation    = [];
let cvExperience   = [];
let cvPalmares     = [];
let cvTechSkills   = [];
let cvMentalSkills = [];
let cvLanguages    = [];
let cvReferences   = [];

// Éditeurs Quill
let quillBio = null;

// Signature
let signaturePad = null;
let signatureDataURL = null;
let signatureLocked = false;

// ═══════════════════════════════════════════════════════════
// 2. UTILITAIRES (LOADER, TOAST, ÉCHAPPEMENT)
// ═══════════════════════════════════════════════════════════
// Début fonction showLoader
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
// Fin fonction showLoader

// Début fonction hideLoader
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}
// Fin fonction hideLoader

// Début fonction showToast
function showToast(message, type = 'info', duration = 10000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Fermer"><i class="fas fa-times"></i></button>
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
// Fin fonction showToast

// Début fonction escapeHtml
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
}
// Fin fonction escapeHtml

// Début fonction calculateAge
function calculateAge(dateString) {
    if (!dateString) return '—';
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}
// Fin fonction calculateAge

// ═══════════════════════════════════════════════════════════
// 3. SESSION ET PROFIL
// ═══════════════════════════════════════════════════════════
// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadFootballeurProfile
async function loadFootballeurProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement profil', 'error');
        return null;
    }
    footballeurProfile = data;
    if (footballeurProfile.role_code !== ROLE_CODE) {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    document.getElementById('userName').textContent = footballeurProfile.full_name || footballeurProfile.display_name || 'Footballeur';
    updateAvatarNav();
    populateHeaderCV();
    return footballeurProfile;
}
// Fin fonction loadFootballeurProfile
// Début fonction updateAvatarNav
function updateAvatarNav() {
    const avatarImg = document.getElementById('userAvatar');
    const initialsDiv = document.getElementById('userAvatarInitials');
    const avatarUrl = footballeurProfile?.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (avatarImg) { avatarImg.src = avatarUrl; avatarImg.style.display = 'block'; }
        if (initialsDiv) initialsDiv.style.display = 'none';
    } else {
        const initials = (footballeurProfile?.full_name || 'F').charAt(0).toUpperCase();
        if (initialsDiv) { initialsDiv.textContent = initials; initialsDiv.style.display = 'flex'; }
        if (avatarImg) avatarImg.style.display = 'none';
    }
}
// Fin fonction updateAvatarNav

// Début fonction populateHeaderCV
function populateHeaderCV() {
    if (!footballeurProfile) return;
    const p = footballeurProfile;
    const fullName = p.full_name || p.display_name || '—';
    document.getElementById('cvHeaderName').textContent = fullName;
    document.getElementById('cvEmail').textContent = p.email || '—';
    document.getElementById('cvPhone').textContent = p.phone || '—';
    document.getElementById('cvCountry').textContent = p.country || '—';
    document.getElementById('cvAge').textContent = calculateAge(p.birth_date);
    document.getElementById('cvHubIdVal').textContent = p.hubisoccer_id || '—';

    const avatarImg = document.getElementById('cvAvatarImg');
    const avatarInit = document.getElementById('cvAvatarInit');
    if (p.avatar_url) {
        if (avatarImg) { avatarImg.src = p.avatar_url; avatarImg.style.display = 'block'; }
        if (avatarInit) avatarInit.style.display = 'none';
    } else {
        if (avatarInit) avatarInit.textContent = (fullName || 'F').charAt(0).toUpperCase();
        if (avatarImg) avatarImg.style.display = 'none';
    }
}
// Fin fonction populateHeaderCV

// ═══════════════════════════════════════════════════════════
// 4. CHARGEMENT DU CV ET PRÉ-REMPLISSAGE
// ═══════════════════════════════════════════════════════════
// Début fonction loadCVData
async function loadCVData() {
    const { data, error } = await supabaseClient
        .from(CV_TABLE)
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('role_code', ROLE_CODE)
        .maybeSingle();
    if (error) {
        console.warn('Erreur chargement CV:', error);
        return;
    }
    if (data) {
        cvData = data;
        restoreFormData(data.cv_json);
        updateStatusBadge(data.status);
    } else {
        prepopulateFromProfile();
    }
    renderAllEntries();
    updateCompletionBar();
}
// Fin fonction loadCVData

// Début fonction prepopulateFromProfile
function prepopulateFromProfile() {
    const p = footballeurProfile;
    if (!p) return;
    const nameParts = (p.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    document.getElementById('cv_nom').value = lastName;
    document.getElementById('cv_prenom').value = firstName;
    document.getElementById('cv_email').value = p.email || '';
    document.getElementById('cv_telephone').value = p.phone || '';
    document.getElementById('cv_nationalite').value = p.nationality || '';
    document.getElementById('cv_pays').value = p.country || '';
    document.getElementById('cv_taille').value = p.height || '';
    document.getElementById('cv_poids').value = p.weight || '';
    if (p.birth_date) document.getElementById('cv_dob').value = p.birth_date;
}
// Fin fonction prepopulateFromProfile

// Début fonction restoreFormData
function restoreFormData(json) {
    try {
        const d = JSON.parse(json);
        const fields = ['nom','prenom','telephone','email','ville','social','taille','poids','club','matchs','buts','passes','valeur','skillsTech','skillsSoft','dateSignature','lieuSignature','dob','lieu_naissance','nationalite','pays','adresse','website','linkedin','instagram'];
        fields.forEach(f => {
            const el = document.getElementById(`cv_${f}`);
            if (el && d[f] !== undefined) el.value = d[f];
        });
        if (quillBio && d.bio) quillBio.root.innerHTML = d.bio;
        cvEducation    = d._education    || [];
        cvExperience   = d._experience   || [];
        cvPalmares     = d._palmares     || [];
        cvTechSkills   = d._techSkills   || [];
        cvMentalSkills = d._mentalSkills || [];
        cvLanguages    = d._languages    || [];
        cvReferences   = d._references   || [];
        if (d.signature_url) {
            signatureDataURL = d.signature_url;
            document.getElementById('signatureImage').src = signatureDataURL;
            document.getElementById('signatureImage').style.display = 'block';
            document.querySelector('.signature-placeholder').style.display = 'none';
        }
    } catch (e) {
        console.warn('Erreur restauration CV JSON', e);
    }
}
// Fin fonction restoreFormData

// ═══════════════════════════════════════════════════════════
// 5. RENDU DES LISTES DYNAMIQUES
// ═══════════════════════════════════════════════════════════
// Début fonction renderAllEntries
function renderAllEntries() {
    renderEducationList();
    renderExperienceList();
    renderPalmaresGrid();
    renderTechSkills();
    renderMentalSkills();
    renderLanguages();
    renderReferencesList();
}
// Fin fonction renderAllEntries

// Début fonction renderEducationList
function renderEducationList() {
    const container = document.getElementById('educationList');
    if (!container) return;
    container.innerHTML = '';
    if (!cvEducation.length) {
        container.innerHTML = '<p class="empty-msg">Aucune formation</p>';
        return;
    }
    cvEducation.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-header">
                <span class="entry-title">${escapeHtml(item.diplome || '—')}</span>
                <span class="entry-period">${escapeHtml(item.annee || '')}</span>
            </div>
            <div class="entry-sub">${escapeHtml(item.etablissement || '')}</div>
            ${item.mention ? `<div class="entry-desc">Mention : ${escapeHtml(item.mention)}</div>` : ''}
            <div class="entry-actions">
                <button class="btn-entry-edit" data-type="education" data-index="${idx}"><i class="fas fa-edit"></i> Modifier</button>
                <button class="btn-entry-del" data-type="education" data-index="${idx}"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        `;
        container.appendChild(card);
    });
    attachEntryButtons(container);
}
// Fin fonction renderEducationList

// Début fonction renderExperienceList
function renderExperienceList() {
    const container = document.getElementById('experienceList');
    if (!container) return;
    container.innerHTML = '';
    if (!cvExperience.length) {
        container.innerHTML = '<p class="empty-msg">Aucune expérience</p>';
        return;
    }
    cvExperience.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-header">
                <span class="entry-title">${escapeHtml(item.poste || '—')}</span>
                <span class="entry-period">${escapeHtml(item.periode || '')}</span>
            </div>
            <div class="entry-sub">${escapeHtml(item.club || '')}</div>
            <div class="entry-desc">${item.description || ''}</div>
            <div class="entry-actions">
                <button class="btn-entry-edit" data-type="experience" data-index="${idx}"><i class="fas fa-edit"></i></button>
                <button class="btn-entry-del" data-type="experience" data-index="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
    attachEntryButtons(container);
}
// Fin fonction renderExperienceList

// Début fonction renderPalmaresGrid
function renderPalmaresGrid() {
    const container = document.getElementById('palmaresGrid');
    if (!container) return;
    container.innerHTML = '';
    if (!cvPalmares.length) {
        container.innerHTML = '<p class="empty-msg">Aucun trophée</p>';
        return;
    }
    cvPalmares.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'trophy-card';
        card.innerHTML = `
            <div class="trophy-icon">${escapeHtml(item.icon || '🏆')}</div>
            <div class="trophy-title">${escapeHtml(item.titre || '—')}</div>
            <div class="trophy-org">${escapeHtml(item.organisation || '')}</div>
            <div class="trophy-year">${escapeHtml(item.annee || '')}</div>
            <div class="entry-actions">
                <button class="btn-entry-del" data-type="palmares" data-index="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
    attachEntryButtons(container);
}
// Fin fonction renderPalmaresGrid

// Début fonction renderTechSkills
function renderTechSkills() {
    const container = document.getElementById('techSkillsList');
    if (!container) return;
    container.innerHTML = '';
    if (!cvTechSkills.length) {
        container.innerHTML = '<p class="empty-msg">Aucune compétence technique</p>';
        return;
    }
    cvTechSkills.forEach((item, idx) => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <span class="skill-name">${escapeHtml(item.name || '—')}</span>
            <div class="skill-bar"><div class="skill-fill esprit" style="width:${item.level || 0}%"></div></div>
            <span class="skill-value">${item.level || 0}</span>
            <button class="btn-entry-del" data-type="tech_skill" data-index="${idx}"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(skillItem);
    });
    attachEntryButtons(container);
}
// Fin fonction renderTechSkills

// Début fonction renderMentalSkills
function renderMentalSkills() {
    const container = document.getElementById('mentalSkillsList');
    if (!container) return;
    container.innerHTML = '';
    if (!cvMentalSkills.length) {
        container.innerHTML = '<p class="empty-msg">Aucune compétence mentale</p>';
        return;
    }
    cvMentalSkills.forEach((item, idx) => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <span class="skill-name">${escapeHtml(item.name || '—')}</span>
            <div class="skill-bar"><div class="skill-fill ame" style="width:${item.level || 0}%"></div></div>
            <span class="skill-value">${item.level || 0}</span>
            <button class="btn-entry-del" data-type="mental_skill" data-index="${idx}"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(skillItem);
    });
    attachEntryButtons(container);
}
// Fin fonction renderMentalSkills

// Début fonction renderLanguages
function renderLanguages() {
    const container = document.getElementById('langChips');
    if (!container) return;
    container.innerHTML = '';
    cvLanguages.forEach((lang, idx) => {
        const chip = document.createElement('span');
        chip.className = 'lang-chip';
        chip.innerHTML = `${escapeHtml(lang.name)} (${escapeHtml(lang.level)}) <i class="fas fa-times del-lang" data-index="${idx}"></i>`;
        container.appendChild(chip);
    });
    document.querySelectorAll('.del-lang').forEach(el => {
        el.addEventListener('click', (e) => {
            const idx = e.target.dataset.index;
            if (idx !== undefined) {
                cvLanguages.splice(idx, 1);
                renderLanguages();
                updateCompletionBar();
            }
        });
    });
}
// Fin fonction renderLanguages

// Début fonction renderReferencesList
function renderReferencesList() {
    const container = document.getElementById('referencesList');
    if (!container) return;
    container.innerHTML = '';
    if (!cvReferences.length) {
        container.innerHTML = '<p class="empty-msg">Aucune référence</p>';
        return;
    }
    cvReferences.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-title">${escapeHtml(item.nom || '—')}</div>
            <div class="entry-sub">${escapeHtml(item.fonction || '')}</div>
            <div class="entry-desc">📧 ${escapeHtml(item.email || '')}  📞 ${escapeHtml(item.telephone || '')}</div>
            <div class="entry-actions">
                <button class="btn-entry-del" data-type="reference" data-index="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
    attachEntryButtons(container);
}
// Fin fonction renderReferencesList

// Début fonction attachEntryButtons
function attachEntryButtons(container) {
    container.querySelectorAll('.btn-entry-edit').forEach(btn => {
        btn.addEventListener('click', () => openEntryModal(btn.dataset.type, parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.btn-entry-del').forEach(btn => {
        btn.addEventListener('click', () => deleteEntry(btn.dataset.type, parseInt(btn.dataset.index)));
    });
}
// Fin fonction attachEntryButtons

// ═══════════════════════════════════════════════════════════
// 6. MODALE D'AJOUT/MODIFICATION D'ENTRÉE
// ═══════════════════════════════════════════════════════════
let currentEntryType = '';
let currentEntryIndex = -1;

// Début fonction openEntryModal
function openEntryModal(type, index = -1) {
    currentEntryType = type;
    currentEntryIndex = index;
    const modal = document.getElementById('entryModal');
    const title = document.getElementById('entryModalTitle');
    const body = document.getElementById('entryModalBody');

    let item = {};
    const arr = getArrayByType(type);
    if (index >= 0 && arr[index]) item = arr[index];

    title.innerHTML = index >= 0 ? 'Modifier' : 'Ajouter';
    body.innerHTML = buildEntryForm(type, item);
    modal.classList.add('show');
}
// Fin fonction openEntryModal

// Début fonction closeEntryModal
function closeEntryModal() {
    document.getElementById('entryModal').classList.remove('show');
}
// Fin fonction closeEntryModal

// Début fonction getArrayByType
function getArrayByType(type) {
    const map = {
        'education': cvEducation,
        'experience': cvExperience,
        'palmares': cvPalmares,
        'tech_skill': cvTechSkills,
        'mental_skill': cvMentalSkills,
        'reference': cvReferences
    };
    return map[type] || [];
}
// Fin fonction getArrayByType

// Début fonction buildEntryForm
function buildEntryForm(type, item = {}) {
    if (type === 'education') {
        return `
            <div class="form-group"><label>Diplôme</label><input type="text" id="em_diplome" value="${escapeHtml(item.diplome || '')}"></div>
            <div class="form-group"><label>Établissement</label><input type="text" id="em_etablissement" value="${escapeHtml(item.etablissement || '')}"></div>
            <div class="form-group"><label>Année</label><input type="text" id="em_annee" value="${escapeHtml(item.annee || '')}"></div>
            <div class="form-group"><label>Mention</label><input type="text" id="em_mention" value="${escapeHtml(item.mention || '')}"></div>
        `;
    }
    if (type === 'experience') {
        return `
            <div class="form-group"><label>Poste</label><input type="text" id="em_poste" value="${escapeHtml(item.poste || '')}"></div>
            <div class="form-group"><label>Club</label><input type="text" id="em_club" value="${escapeHtml(item.club || '')}"></div>
            <div class="form-group"><label>Période</label><input type="text" id="em_periode" value="${escapeHtml(item.periode || '')}"></div>
            <div class="form-group"><label>Description</label><textarea id="em_description">${escapeHtml(item.description || '')}</textarea></div>
        `;
    }
    if (type === 'palmares') {
        return `
            <div class="form-group"><label>Titre</label><input type="text" id="em_titre" value="${escapeHtml(item.titre || '')}"></div>
            <div class="form-group"><label>Organisation</label><input type="text" id="em_organisation" value="${escapeHtml(item.organisation || '')}"></div>
            <div class="form-group"><label>Année</label><input type="text" id="em_annee" value="${escapeHtml(item.annee || '')}"></div>
            <div class="form-group"><label>Icône</label><input type="text" id="em_icon" value="${escapeHtml(item.icon || '🏆')}"></div>
        `;
    }
    if (type === 'tech_skill' || type === 'mental_skill') {
        return `
            <div class="form-group"><label>Nom</label><input type="text" id="em_name" value="${escapeHtml(item.name || '')}"></div>
            <div class="form-group"><label>Niveau (0-100)</label><input type="range" id="em_level" min="0" max="100" value="${item.level || 50}" oninput="document.getElementById('levelVal').textContent=this.value"></div>
            <p style="text-align:center;">Niveau : <span id="levelVal">${item.level || 50}</span></p>
        `;
    }
    if (type === 'reference') {
        return `
            <div class="form-group"><label>Nom</label><input type="text" id="em_nom" value="${escapeHtml(item.nom || '')}"></div>
            <div class="form-group"><label>Fonction</label><input type="text" id="em_fonction" value="${escapeHtml(item.fonction || '')}"></div>
            <div class="form-group"><label>Email</label><input type="email" id="em_email" value="${escapeHtml(item.email || '')}"></div>
            <div class="form-group"><label>Téléphone</label><input type="text" id="em_telephone" value="${escapeHtml(item.telephone || '')}"></div>
        `;
    }
    return '';
}
// Fin fonction buildEntryForm

// Début fonction saveEntry
function saveEntry() {
    const type = currentEntryType;
    const arr = getArrayByType(type);
    let newItem = {};

    if (type === 'education') {
        newItem = {
            diplome: document.getElementById('em_diplome')?.value || '',
            etablissement: document.getElementById('em_etablissement')?.value || '',
            annee: document.getElementById('em_annee')?.value || '',
            mention: document.getElementById('em_mention')?.value || ''
        };
    } else if (type === 'experience') {
        newItem = {
            poste: document.getElementById('em_poste')?.value || '',
            club: document.getElementById('em_club')?.value || '',
            periode: document.getElementById('em_periode')?.value || '',
            description: document.getElementById('em_description')?.value || ''
        };
    } else if (type === 'palmares') {
        newItem = {
            titre: document.getElementById('em_titre')?.value || '',
            organisation: document.getElementById('em_organisation')?.value || '',
            annee: document.getElementById('em_annee')?.value || '',
            icon: document.getElementById('em_icon')?.value || '🏆'
        };
    } else if (type === 'tech_skill' || type === 'mental_skill') {
        newItem = {
            name: document.getElementById('em_name')?.value || '',
            level: parseInt(document.getElementById('em_level')?.value) || 50
        };
    } else if (type === 'reference') {
        newItem = {
            nom: document.getElementById('em_nom')?.value || '',
            fonction: document.getElementById('em_fonction')?.value || '',
            email: document.getElementById('em_email')?.value || '',
            telephone: document.getElementById('em_telephone')?.value || ''
        };
    }

    if (currentEntryIndex >= 0) {
        arr[currentEntryIndex] = newItem;
    } else {
        arr.push(newItem);
    }
    closeEntryModal();
    renderAllEntries();
    updateCompletionBar();
    showToast('Entrée enregistrée', 'success');
}
// Fin fonction saveEntry

// Début fonction deleteEntry
function deleteEntry(type, index) {
    if (!confirm('Supprimer cette entrée ?')) return;
    const arr = getArrayByType(type);
    arr.splice(index, 1);
    renderAllEntries();
    updateCompletionBar();
    showToast('Entrée supprimée', 'info');
}
// Fin fonction deleteEntry

// ═══════════════════════════════════════════════════════════
// 7. SAUVEGARDE ET SOUMISSION DU CV
// ═══════════════════════════════════════════════════════════
// Début fonction collectCVData
function collectCVData() {
    const data = {};
    const fields = ['nom','prenom','telephone','email','ville','social','taille','poids','club','matchs','buts','passes','valeur','skillsTech','skillsSoft','dateSignature','lieuSignature','dob','lieu_naissance','nationalite','pays','adresse','website','linkedin','instagram'];
    fields.forEach(f => {
        const el = document.getElementById(`cv_${f}`);
        if (el) data[f] = el.value;
    });
    if (quillBio) data.bio = quillBio.root.innerHTML;
    data._education    = cvEducation;
    data._experience   = cvExperience;
    data._palmares     = cvPalmares;
    data._techSkills   = cvTechSkills;
    data._mentalSkills = cvMentalSkills;
    data._languages    = cvLanguages;
    data._references   = cvReferences;
    data.signature_url = signatureDataURL || null;
    return data;
}
// Fin fonction collectCVData

// Début fonction saveDraft
async function saveDraft() {
    if (!currentUser || !footballeurProfile) return;
    showLoader();
    const payload = {
        user_id: currentUser.id,
        role_code: ROLE_CODE,
        status: 'draft',
        cv_json: JSON.stringify(collectCVData()),
        updated_at: new Date().toISOString()
    };
    let error;
    if (cvData?.id) {
        ({ error } = await supabaseClient.from(CV_TABLE).update(payload).eq('id', cvData.id));
    } else {
        payload.created_at = new Date().toISOString();
        const res = await supabaseClient.from(CV_TABLE).insert([payload]).select().single();
        error = res.error;
        if (!error) cvData = res.data;
    }
    hideLoader();
    if (error) {
        showToast('Erreur sauvegarde : ' + error.message, 'error');
    } else {
        showToast('Brouillon enregistré', 'success');
        updateStatusBadge('draft');
        updateCompletionBar();
    }
}
// Fin fonction saveDraft

// Début fonction submitForValidation
async function submitForValidation() {
    if (!cvData?.id) {
        await saveDraft();
    }
    showLoader();
    const { error } = await supabaseClient
        .from(CV_TABLE)
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', cvData.id);
    hideLoader();
    if (error) {
        showToast('Erreur soumission : ' + error.message, 'error');
    } else {
        cvData.status = 'submitted';
        updateStatusBadge('submitted');
        showToast('CV soumis pour validation !', 'success', 6000);
    }
}
// Fin fonction submitForValidation

// Début fonction updateStatusBadge
function updateStatusBadge(status) {
    const badge = document.getElementById('cvStatusBadge');
    if (!badge) return;
    const labels = { draft: 'Brouillon', submitted: 'Soumis', approved: 'Validé' };
    const icons = { draft: 'fa-circle', submitted: 'fa-clock', approved: 'fa-check-circle' };
    badge.className = `cv-status ${status}`;
    badge.innerHTML = `<i class="fas ${icons[status]}"></i> ${labels[status]}`;
    const exportBtn = document.getElementById('btnDownloadPDF');
    if (exportBtn) exportBtn.disabled = (status !== 'approved');
}
// Fin fonction updateStatusBadge

// Début fonction updateCompletionBar
function updateCompletionBar() {
    const data = collectCVData();
    const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'nationalite', 'pays'];
    let filled = requiredFields.filter(f => data[f] && data[f].trim() !== '').length;
    if (cvEducation.length) filled++;
    if (cvExperience.length) filled++;
    if (cvLanguages.length) filled++;
    if (cvTechSkills.length) filled++;
    const total = requiredFields.length + 4;
    const pct = Math.round((filled / total) * 100);
    document.getElementById('completionFill').style.width = pct + '%';
    document.getElementById('completionPct').textContent = pct + '%';
}
// Fin fonction updateCompletionBar

// ═══════════════════════════════════════════════════════════
// 8. APERÇU ET PDF
// ═══════════════════════════════════════════════════════════
// Début fonction previewCV
function previewCV() {
    const data = collectCVData();
    const fullName = `${data.prenom} ${data.nom}`.trim();
    const contactLine = [data.email, data.telephone, data.pays].filter(Boolean).join(' · ');
    const age = calculateAge(data.dob);
    const formationsHtml = cvEducation.map(f => `<div><strong>${escapeHtml(f.diplome)}</strong><br>${escapeHtml(f.etablissement)} (${escapeHtml(f.annee)})</div>`).join('');
    const experiencesHtml = cvExperience.map(e => `<div><strong>${escapeHtml(e.poste)}</strong> - ${escapeHtml(e.club)}<br><em>${escapeHtml(e.periode)}</em><br>${e.description || ''}</div>`).join('');
    const skillsHtml = cvTechSkills.map(s => `<div>${escapeHtml(s.name)} : ${s.level}%</div>`).join('');
    const languagesHtml = cvLanguages.map(l => `<span>${escapeHtml(l.name)} (${escapeHtml(l.level)})</span>`).join(', ');
    const signatureImg = signatureDataURL ? `<img src="${signatureDataURL}" style="max-height:60px;">` : '';

    const previewHTML = `
        <div class="cv-preview-wrap">
            <div class="cv-preview-header">
                ${footballeurProfile?.avatar_url ? `<img src="${footballeurProfile.avatar_url}" class="cv-preview-avatar">` : `<div class="cv-preview-avatar-init">${fullName.charAt(0)}</div>`}
                <div>
                    <div class="cv-preview-name">${escapeHtml(fullName)}</div>
                    <div class="cv-preview-role">Footballeur · HubISoccer</div>
                    <div class="cv-preview-contacts">${escapeHtml(contactLine)} · ${age} ans</div>
                </div>
            </div>
            <div class="cv-preview-body">
                <div class="cv-col-left">
                    <div class="cv-section-head">Formation</div> ${formationsHtml || '<p>—</p>'}
                    <div class="cv-section-head">Compétences</div> ${skillsHtml || '<p>—</p>'}
                    <div class="cv-section-head">Langues</div> ${languagesHtml || '<p>—</p>'}
                </div>
                <div class="cv-col-right">
                    <div class="cv-section-head">Expériences</div> ${experiencesHtml || '<p>—</p>'}
                </div>
            </div>
            <div class="cv-preview-footer">
                <span>Fait le ${data.dateSignature || '…'} à ${data.lieuSignature || '…'}</span>
                ${signatureImg}
            </div>
        </div>
    `;
    document.getElementById('cvPreviewBody').innerHTML = previewHTML;
    document.getElementById('cvPreviewModal').classList.add('show');
}
// Fin fonction previewCV

// Début fonction closePreview
function closePreview() {
    document.getElementById('cvPreviewModal').classList.remove('show');
}
// Fin fonction closePreview

// Début fonction downloadPDF
async function downloadPDF() {
    if (cvData?.status !== 'approved') {
        showToast('CV non encore validé', 'warning');
        return;
    }
    const element = document.getElementById('cvPreviewBody');
    if (!element) return;
    const opt = {
        margin: 0.5,
        filename: `CV_${footballeurProfile.full_name || 'footballeur'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(element).save();
}
// Fin fonction downloadPDF

// ═══════════════════════════════════════════════════════════
// 9. SIGNATURE ÉLECTRONIQUE
// ═══════════════════════════════════════════════════════════
// Début fonction openSignatureModal
function openSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.classList.add('show');
    if (!signaturePad) {
        const canvas = document.getElementById('signatureCanvas');
        signaturePad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });
        window.addEventListener('resize', () => { /* géré automatiquement */ });
        document.getElementById('clearSignature').addEventListener('click', () => signaturePad.clear());
        document.getElementById('lockSignature').addEventListener('click', function() {
            signatureLocked = !signatureLocked;
            this.textContent = signatureLocked ? 'Déverrouiller' : 'Verrouiller';
            if (signatureLocked) signaturePad.off(); else signaturePad.on();
        });
        document.getElementById('saveSignature').addEventListener('click', async () => {
            if (signaturePad.isEmpty()) { showToast('Signez avant de valider', 'warning'); return; }
            signatureDataURL = signaturePad.toDataURL('image/png');
            const file = dataURLtoFile(signatureDataURL, `signature_${Date.now()}.png`);
            const filePath = `${SIGNATURE_PATH}/${footballeurProfile.hubisoccer_id}_${Date.now()}.png`;
            const { error: uploadError } = await supabaseClient.storage.from(DOCUMENTS_BUCKET).upload(filePath, file, { upsert: true });
            if (uploadError) {
                showToast('Erreur upload signature : ' + uploadError.message, 'error');
                return;
            }
            const { data: { publicUrl } } = supabaseClient.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath);
            signatureDataURL = publicUrl;
            document.getElementById('signatureImage').src = publicUrl;
            document.getElementById('signatureImage').style.display = 'block';
            document.querySelector('.signature-placeholder').style.display = 'none';
            closeSignatureModal();
            showToast('Signature enregistrée', 'success');
        });
        document.getElementById('penColor').addEventListener('input', e => signaturePad.penColor = e.target.value);
        document.getElementById('penWidth').addEventListener('input', e => signaturePad.minWidth = signaturePad.maxWidth = parseFloat(e.target.value));
    }
}
// Fin fonction openSignatureModal

// Début fonction closeSignatureModal
function closeSignatureModal() {
    document.getElementById('signatureModal').classList.remove('show');
}
// Fin fonction closeSignatureModal

// Début fonction dataURLtoFile
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, {type:mime});
}
// Fin fonction dataURLtoFile

// ═══════════════════════════════════════════════════════════
// 10. INITIALISATION GÉNÉRALE (DOMContentLoaded)
// ═══════════════════════════════════════════════════════════
// Début initialisation DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Session
    const user = await checkSession();
    if (!user) return;
    await loadFootballeurProfile();
    if (!footballeurProfile) return;

    // Initialiser Quill pour la biographie
    quillBio = new Quill('#cv_bio_editor', { theme: 'snow', placeholder: 'Décrivez votre parcours, votre philosophie, vos ambitions...' });

    // Charger le CV
    await loadCVData();

    // Boutons
    document.getElementById('btnSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('btnSubmitCV').addEventListener('click', submitForValidation);
    document.getElementById('btnPreviewCV').addEventListener('click', previewCV);
    document.getElementById('btnDownloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('addEducation').addEventListener('click', () => openEntryModal('education'));
    document.getElementById('addExperience').addEventListener('click', () => openEntryModal('experience'));
    document.getElementById('addPalmares').addEventListener('click', () => openEntryModal('palmares'));
    document.getElementById('addTechSkill').addEventListener('click', () => openEntryModal('tech_skill'));
    document.getElementById('addMentalSkill').addEventListener('click', () => openEntryModal('mental_skill'));
    document.getElementById('addReference').addEventListener('click', () => openEntryModal('reference'));
    document.getElementById('addLanguageBtn').addEventListener('click', () => {
        const name = document.getElementById('newLangName')?.value.trim();
        const level = document.getElementById('newLangLevel')?.value;
        if (name) {
            cvLanguages.push({ name, level });
            renderLanguages();
            updateCompletionBar();
            document.getElementById('newLangName').value = '';
        }
    });
    document.querySelector('.signature-placeholder')?.addEventListener('click', openSignatureModal);
    document.getElementById('closePreviewModal').addEventListener('click', closePreview);
    document.getElementById('saveEntryBtn').addEventListener('click', saveEntry);
    document.getElementById('closeEntryModalBtn').addEventListener('click', closeEntryModal);
    document.getElementById('closeSignatureModalBtn').addEventListener('click', closeSignatureModal);
    document.getElementById('cancelEntryBtn')?.addEventListener('click', closeEntryModal);
    document.getElementById('closePreviewBtn')?.addEventListener('click', closePreview);
    document.getElementById('downloadFromPreviewBtn')?.addEventListener('click', downloadPDF);

    // Avatar upload
    document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 800 * 1024) { showToast('Image trop volumineuse (max 800 Ko)', 'warning'); return; }
        showLoader();
        const fileExt = file.name.split('.').pop();
        const fileName = `${footballeurProfile.hubisoccer_id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('avatars-footballeur').upload(fileName, file, { upsert: true });
        if (uploadError) { hideLoader(); showToast('Erreur upload avatar', 'error'); return; }
        const { data: { publicUrl } } = supabaseClient.storage.from('avatars-footballeur').getPublicUrl(fileName);
        await supabaseClient.from('supabaseAuthPrive_profiles').update({ avatar_url: publicUrl }).eq('hubisoccer_id', footballeurProfile.hubisoccer_id);
        footballeurProfile.avatar_url = publicUrl;
        populateHeaderCV();
        updateAvatarNav();
        hideLoader();
        showToast('Avatar mis à jour', 'success');
    });

    // Tabs
    initTabs();
    // Sidebar & menu
    initSidebar();
    initUserMenu();
    initLogout();
    // Langue
    document.getElementById('langSelect')?.addEventListener('change', e => showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info'));
});
// Fin initialisation DOM

// ═══════════════════════════════════════════════════════════
// 11. FONCTIONS UI (TABS, SIDEBAR, MENU)
// ═══════════════════════════════════════════════════════════
// Début fonction initTabs
function initTabs() {
    document.querySelectorAll('.cv-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cv-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.cv-tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}
// Fin fonction initTabs

// Début fonction initSidebar
function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeSidebar');
    if (!sidebar) return;
    function open() { sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); }
    function close() { sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); }
    menuBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
}
// Fin fonction initSidebar

// Début fonction initUserMenu
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) return;
    menu.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout
// Début fonction copyHubId
async function copyHubId() {
    const id = footballeurProfile?.hubisoccer_id;
    if (!id) return;
    try {
        await navigator.clipboard.writeText(id);
        showToast('ID copié !', 'success', 2000);
    } catch { showToast('Erreur copie', 'error'); }
}
// Fin fonction copyHubId
window.copyHubId = copyHubId;
