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
let scoutingData       = null;       // données de scouting (pour récupérer les skills)
const ROLE_CODE        = 'FOOT';
const ROLE_LABEL       = 'Footballeur';
const CV_TABLE         = 'supabaseAuthPrive_cv_profiles';
const SCOUTING_TABLE   = 'supabaseAuthPrive_footballeur_scouting';
const DOCUMENTS_BUCKET = 'documents';
const SIGNATURE_PATH   = 'footballeur/edit-cv/signatures';

// ═══════════════════════════════════════════════════════════
// 2. UTILITAIRES : LOADER & TOAST (durée 30s)
// ═══════════════════════════════════════════════════════════
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info', duration = 30000) {
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

// ═══════════════════════════════════════════════════════════
// 3. SESSION & PROFIL
// ═══════════════════════════════════════════════════════════
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
    document.getElementById('userName').textContent = footballeurProfile.full_name || footballeurProfile.display_name || ROLE_LABEL;
    updateAvatarNav();
    populateHeaderCV();
    return footballeurProfile;
}

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

function calculateAge(dateString) {
    if (!dateString) return '—';
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ═══════════════════════════════════════════════════════════
// 4. CHARGEMENT DU CV (TABLE supabaseAuthPrive_cv_profiles)
// ═══════════════════════════════════════════════════════════
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
        // Pré-remplir avec les infos du profil
        prepopulateFromProfile();
    }
    // Charger également le scouting pour récupérer les skills si déjà saisis
    await loadScoutingData();
    renderAllEntries();
    updateCompletionBar();
}

async function loadScoutingData() {
    const { data } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('footballeur_hubisoccer_id', footballeurProfile.hubisoccer_id)
        .maybeSingle();
    if (data) scoutingData = data;
}

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
    document.getElementById('cv_piedFort').value = p.preferred_foot || '';
    document.getElementById('cv_club').value = p.club || '';
    if (p.birth_date) document.getElementById('cv_dob').value = p.birth_date;
}

function restoreFormData(json) {
    try {
        const d = JSON.parse(json);
        // Champs simples
        const fields = ['nom','prenom','telephone','email','ville','social','taille','poids','piedFort','club','matchs','buts','passes','valeur','skillsTech','skillsSoft','dateSignature','lieuSignature','dob','lieu_naissance','nationalite','pays','adresse','website','linkedin','instagram'];
        fields.forEach(f => {
            const el = document.getElementById(`cv_${f}`);
            if (el && d[f] !== undefined) el.value = d[f];
        });
        // Éditeurs Quill
        if (quillProfil && d.profil) quillProfil.root.innerHTML = d.profil;
        if (quillBio && d.bio) quillBio.root.innerHTML = d.bio;
        if (quillInterets && d.interets) quillInterets.root.innerHTML = d.interets;
        // Listes
        window.__cvEducation    = d._education    || [];
        window.__cvExperience   = d._experience   || [];
        window.__cvPalmares     = d._palmares     || [];
        window.__cvTechSkills   = d._techSkills   || [];
        window.__cvMentalSkills = d._mentalSkills || [];
        window.__cvLanguages    = d._languages    || [];
        window.__cvReferences   = d._references   || [];
        // Signature
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

// ═══════════════════════════════════════════════════════════
// 5. RENDU DES LISTES DYNAMIQUES (expériences, formations...)
// ═══════════════════════════════════════════════════════════
function renderAllEntries() {
    renderEducationList();
    renderExperienceList();
    renderPalmaresGrid();
    renderTechSkills();
    renderMentalSkills();
    renderLanguages();
    renderReferencesList();
}

function renderEducationList() {
    const container = document.getElementById('educationList');
    if (!container) return;
    const arr = window.__cvEducation || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucune formation</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function renderExperienceList() {
    const container = document.getElementById('experienceList');
    if (!container) return;
    const arr = window.__cvExperience || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucune expérience</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function renderPalmaresGrid() {
    const container = document.getElementById('palmaresGrid');
    if (!container) return;
    const arr = window.__cvPalmares || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucun trophée</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function renderTechSkills() {
    const container = document.getElementById('techSkillsList');
    if (!container) return;
    const arr = window.__cvTechSkills || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucune compétence technique</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function renderMentalSkills() {
    const container = document.getElementById('mentalSkillsList');
    if (!container) return;
    const arr = window.__cvMentalSkills || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucune compétence mentale</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function renderLanguages() {
    const container = document.getElementById('langChips');
    if (!container) return;
    const arr = window.__cvLanguages || [];
    container.innerHTML = '';
    arr.forEach((lang, idx) => {
        const chip = document.createElement('span');
        chip.className = 'lang-chip';
        chip.innerHTML = `${escapeHtml(lang.name)} (${escapeHtml(lang.level)}) <i class="fas fa-times del-lang" data-index="${idx}"></i>`;
        container.appendChild(chip);
    });
    document.querySelectorAll('.del-lang').forEach(el => {
        el.addEventListener('click', (e) => {
            const idx = e.target.dataset.index;
            if (idx !== undefined) {
                window.__cvLanguages.splice(idx, 1);
                renderLanguages();
                updateCompletionBar();
            }
        });
    });
}

function renderReferencesList() {
    const container = document.getElementById('referencesList');
    if (!container) return;
    const arr = window.__cvReferences || [];
    container.innerHTML = '';
    if (!arr.length) {
        container.innerHTML = '<p class="empty-msg">Aucune référence</p>';
        return;
    }
    arr.forEach((item, idx) => {
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

function attachEntryButtons(container) {
    container.querySelectorAll('.btn-entry-edit').forEach(btn => {
        btn.addEventListener('click', () => openEntryModal(btn.dataset.type, parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.btn-entry-del').forEach(btn => {
        btn.addEventListener('click', () => deleteEntry(btn.dataset.type, parseInt(btn.dataset.index)));
    });
}

// ═══════════════════════════════════════════════════════════
// 6. GESTION DES ENTRÉES (MODALE)
// ═══════════════════════════════════════════════════════════
let currentEntryType = '';
let currentEntryIndex = -1;

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

function closeEntryModal() {
    document.getElementById('entryModal').classList.remove('show');
}

function getArrayByType(type) {
    const map = {
        'education': '_cvEducation',
        'experience': '_cvExperience',
        'palmares': '_cvPalmares',
        'tech_skill': '_cvTechSkills',
        'mental_skill': '_cvMentalSkills',
        'reference': '_cvReferences'
    };
    const key = map[type];
    if (!key) return [];
    if (!window[key]) window[key] = [];
    return window[key];
}

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

function deleteEntry(type, index) {
    if (!confirm('Supprimer cette entrée ?')) return;
    const arr = getArrayByType(type);
    arr.splice(index, 1);
    renderAllEntries();
    updateCompletionBar();
    showToast('Entrée supprimée', 'info');
}

// ═══════════════════════════════════════════════════════════
// 7. SAUVEGARDE & SOUMISSION DU CV
// ═══════════════════════════════════════════════════════════
function collectCVData() {
    const data = {};
    // Champs texte
    const fields = ['nom','prenom','telephone','email','ville','social','taille','poids','piedFort','club','matchs','buts','passes','valeur','skillsTech','skillsSoft','dateSignature','lieuSignature','dob','lieu_naissance','nationalite','pays','adresse','website','linkedin','instagram'];
    fields.forEach(f => {
        const el = document.getElementById(`cv_${f}`);
        if (el) data[f] = el.value;
    });
    // Quill
    data.profil = quillProfil ? quillProfil.root.innerHTML : '';
    data.bio = quillBio ? quillBio.root.innerHTML : '';
    data.interets = quillInterets ? quillInterets.root.innerHTML : '';
    // Listes
    data._education    = window.__cvEducation    || [];
    data._experience   = window.__cvExperience   || [];
    data._palmares     = window.__cvPalmares     || [];
    data._techSkills   = window.__cvTechSkills   || [];
    data._mentalSkills = window.__cvMentalSkills || [];
    data._languages    = window.__cvLanguages    || [];
    data._references   = window.__cvReferences   || [];
    // Signature
    data.signature_url = signatureDataURL || null;
    return data;
}

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

async function submitForValidation() {
    if (!cvData?.id) {
        await saveDraft(); // s'assurer qu'un enregistrement existe
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

function updateCompletionBar() {
    const data = collectCVData();
    const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'nationalite', 'pays'];
    let filled = requiredFields.filter(f => data[f] && data[f].trim() !== '').length;
    if (window.__cvEducation?.length) filled++;
    if (window.__cvExperience?.length) filled++;
    if (window.__cvLanguages?.length) filled++;
    if (window.__cvTechSkills?.length) filled++;
    const total = requiredFields.length + 4;
    const pct = Math.round((filled / total) * 100);
    document.getElementById('completionFill').style.width = pct + '%';
    document.getElementById('completionPct').textContent = pct + '%';
}

// ═══════════════════════════════════════════════════════════
// 8. APERÇU & PDF
// ═══════════════════════════════════════════════════════════
function previewCV() {
    const data = collectCVData();
    const fullName = `${data.prenom} ${data.nom}`.trim();
    const contactLine = [data.email, data.telephone, data.pays].filter(Boolean).join(' · ');
    const age = calculateAge(data.dob);
    const formationsHtml = (window.__cvEducation || []).map(f => `<div><strong>${escapeHtml(f.diplome)}</strong><br>${escapeHtml(f.etablissement)} (${escapeHtml(f.annee)})</div>`).join('');
    const experiencesHtml = (window.__cvExperience || []).map(e => `<div><strong>${escapeHtml(e.poste)}</strong> - ${escapeHtml(e.club)}<br><em>${escapeHtml(e.periode)}</em><br>${e.description || ''}</div>`).join('');
    const skillsHtml = (window.__cvTechSkills || []).map(s => `<div>${escapeHtml(s.name)} : ${s.level}%</div>`).join('');
    const languagesHtml = (window.__cvLanguages || []).map(l => `<span>${escapeHtml(l.name)} (${escapeHtml(l.level)})</span>`).join(', ');
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
                    <div class="cv-section-head">Profil</div> ${data.profil || '<p>—</p>'}
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

function closePreview() {
    document.getElementById('cvPreviewModal').classList.remove('show');
}

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

// ═══════════════════════════════════════════════════════════
// 9. SIGNATURE ÉLECTRONIQUE
// ═══════════════════════════════════════════════════════════
let signaturePad;
let signatureDataURL = null;
let signatureLocked = false;

function openSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.classList.add('show');
    if (!signaturePad) {
        const canvas = document.getElementById('signatureCanvas');
        signaturePad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: '#551B8C' });
        window.addEventListener('resize', () => { /* resize géré si nécessaire */ });
        document.getElementById('clearSignature').addEventListener('click', () => signaturePad.clear());
        document.getElementById('lockSignature').addEventListener('click', function() {
            signatureLocked = !signatureLocked;
            this.textContent = signatureLocked ? 'Déverrouiller' : 'Verrouiller';
            if (signatureLocked) signaturePad.off(); else signaturePad.on();
        });
        document.getElementById('saveSignature').addEventListener('click', async () => {
            if (signaturePad.isEmpty()) { showToast('Signez avant de valider', 'warning'); return; }
            signatureDataURL = signaturePad.toDataURL('image/png');
            // Uploader dans le bucket documents
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

function closeSignatureModal() {
    document.getElementById('signatureModal').classList.remove('show');
}

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, {type:mime});
}

// ═══════════════════════════════════════════════════════════
// 10. INITIALISATION GÉNÉRALE (DOMContentLoaded)
// ═══════════════════════════════════════════════════════════
let quillProfil, quillBio, quillInterets;

document.addEventListener('DOMContentLoaded', async () => {
    // Session
    const user = await checkSession();
    if (!user) return;
    await loadFootballeurProfile();
    if (!footballeurProfile) return;

    // Quill
    quillProfil = new Quill('#profilEditor', { theme: 'snow', placeholder: 'Rédigez votre profil...' });
    quillBio = new Quill('#bioEditor', { theme: 'snow', placeholder: 'Votre biographie...' });
    quillInterets = new Quill('#interetsEditor', { theme: 'snow', placeholder: 'Vos centres d\'intérêt...' });
    // Récupération des valeurs existantes après restauration
    await loadCVData();

    // Initialiser les tableaux vides s'ils n'existent pas
    window.__cvEducation = window.__cvEducation || [];
    window.__cvExperience = window.__cvExperience || [];
    window.__cvPalmares = window.__cvPalmares || [];
    window.__cvTechSkills = window.__cvTechSkills || [];
    window.__cvMentalSkills = window.__cvMentalSkills || [];
    window.__cvLanguages = window.__cvLanguages || [];
    window.__cvReferences = window.__cvReferences || [];

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
            window.__cvLanguages.push({ name, level });
            renderLanguages();
            updateCompletionBar();
            document.getElementById('newLangName').value = '';
        }
    });
    document.getElementById('signaturePreview').addEventListener('click', openSignatureModal);
    document.getElementById('closePreviewModal').addEventListener('click', closePreview);
    document.getElementById('saveEntryBtn').addEventListener('click', saveEntry);
    document.getElementById('closeEntryModalBtn').addEventListener('click', closeEntryModal);
    document.getElementById('closeSignatureModalBtn').addEventListener('click', closeSignatureModal);

    // Tabs
    initTabs();
    // Sidebar & menu
    initSidebar();
    initUserMenu();
    initLogout();
    // Langue
    document.getElementById('langSelect')?.addEventListener('change', e => showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info'));
});

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
function initSidebar() { /* identique à foot-dash.js */ }
function initUserMenu() { /* identique */ }
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(l => l.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = '../../authprive/users/login.html';
    }));
}
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
}
