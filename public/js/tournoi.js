// ========== TOURNOI.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM ==========
const tournoiGrid = document.getElementById('tournoiGrid');
const liveContainer = document.getElementById('liveContainer');

// ========== CHARGEMENT DU LIVE ==========
async function loadLive() {
    try {
        const { data, error } = await supabasePublic
            .from('public_lives')
            .select('*')
            .eq('actif', true)
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
            const live = data[0];
            liveContainer.innerHTML = `
                <div class="live-card">
                    <div class="live-video">
                        <iframe src="${live.embed_url}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="live-info">
                        <h3 class="live-title">${escapeHtml(live.titre)}</h3>
                        <p>${escapeHtml(live.description || '')}</p>
                    </div>
                </div>
            `;
        } else {
            liveContainer.innerHTML = `<div class="no-live">${tournoiT('toast.no_live')}</div>`;
        }
    } catch (err) {
        console.error(err);
        liveContainer.innerHTML = `<div class="no-live">${tournoiT('toast.no_live')}</div>`;
    }
}

// ========== CHARGEMENT DES TOURNOIS ==========
async function loadTournois() {
    if (!tournoiGrid) return;
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_tournois')
            .select('*')
            .order('date_debut', { ascending: true });
        if (error) throw error;
        renderTournois(data || []);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement tournois', 'error');
    } finally {
        hideLoader();
    }
}

function renderTournois(tournois) {
    if (!tournoiGrid) return;
    if (!tournois.length) {
        tournoiGrid.innerHTML = '<p>Aucun tournoi pour le moment.</p>';
        return;
    }
    let html = '';
    for (const tournoi of tournois) {
        html += `
            <div class="tournoi-card" data-tournoi-id="${tournoi.id}">
                <div class="card-image">
                    <img src="${tournoi.image_url || 'img/default-tournoi.jpg'}" alt="${escapeHtml(tournoi.titre)}">
                    <div class="card-badge">${escapeHtml(tournoi.sport)}</div>
                </div>
                <div class="card-content">
                    <h3>${escapeHtml(tournoi.titre)}</h3>
                    <p class="tournoi-desc">${escapeHtml(tournoi.description || '')}</p>
                    <div class="tournoi-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${formatDate(tournoi.date_debut)} - ${formatDate(tournoi.date_fin)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(tournoi.ville)}${tournoi.quartier ? ' - ' + escapeHtml(tournoi.quartier) : ''}</span>
                    </div>
                    <div class="tournoi-code" id="code-${tournoi.id}">
                        <span class="code-label">Code d'inscription :</span>
                        <div class="code-box">
                            <span class="code">••••••</span>
                            <button class="copy-btn" data-tournoi-id="${tournoi.id}"><i class="fas fa-copy"></i> ${tournoiT('tournoi.copy')}</button>
                        </div>
                        <button class="btn-inscrire" style="display: none;" data-tournoi-id="${tournoi.id}">${tournoiT('tournoi.inscrire')}</button>
                    </div>
                </div>
            </div>
        `;
    }
    tournoiGrid.innerHTML = html;
    for (const tournoi of tournois) {
        loadCodeForTournoi(tournoi.id);
    }
}

async function loadCodeForTournoi(tournoiId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_codes_tournoi')
            .select('id, code, type_inscription, entite, quota_max, quota_utilise, tournoi_id')
            .eq('tournoi_id', tournoiId)
            .eq('actif', true)
            .limit(1);
        if (error) throw error;
        const codeInfo = data && data[0] ? data[0] : null;
        const codeBox = document.querySelector(`#code-${tournoiId} .code-box .code`);
        const copyBtn = document.querySelector(`#code-${tournoiId} .copy-btn`);
        const inscrireBtn = document.querySelector(`#code-${tournoiId} .btn-inscrire`);
        if (codeInfo) {
            const { data: tournoiData } = await supabasePublic
                .from('public_tournois')
                .select('type_tournoi')
                .eq('id', tournoiId)
                .single();
            const estIndividuel = tournoiData?.type_tournoi === 'individuel';
            const estComplet = codeInfo.quota_utilise >= codeInfo.quota_max;
            if (codeBox) codeBox.textContent = codeInfo.code;
            if (copyBtn) {
                if (estComplet) {
                    copyBtn.innerHTML = `<i class="fas fa-ban"></i> ${tournoiT('tournoi.code_complet')}`;
                    copyBtn.disabled = true;
                    if (inscrireBtn) inscrireBtn.style.display = 'none';
                } else {
                    copyBtn.dataset.codeId = codeInfo.id;
                    copyBtn.dataset.codeValue = codeInfo.code;
                    copyBtn.dataset.type = codeInfo.type_inscription;
                    copyBtn.dataset.entite = codeInfo.entite || '';
                    copyBtn.dataset.quotaMax = codeInfo.quota_max;
                    copyBtn.dataset.quotaUtilise = codeInfo.quota_utilise;
                    copyBtn.dataset.tournoiId = tournoiId;
                    copyBtn.dataset.tournoiType = estIndividuel ? 'individuel' : 'collectif';
                }
            }
        } else {
            if (codeBox) codeBox.textContent = 'Code indisponible';
            if (copyBtn) copyBtn.disabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}

// ========== GESTION DU COPIER ET AFFICHAGE BOUTON INSCRIRE ==========
document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn && copyBtn.dataset.codeValue && !copyBtn.disabled) {
        e.preventDefault();
        const code = copyBtn.dataset.codeValue;
        await navigator.clipboard.writeText(code);
        showToast(tournoiT('toast.code_copied'), 'success');
        const codeBox = copyBtn.closest('.code-box');
        const inscrireBtn = copyBtn.closest('.tournoi-code').querySelector('.btn-inscrire');
        if (inscrireBtn) {
            if (codeBox) codeBox.style.display = 'none';
            inscrireBtn.style.display = 'block';
            inscrireBtn.dataset.codeId = copyBtn.dataset.codeId;
            inscrireBtn.dataset.codeValue = copyBtn.dataset.codeValue;
            inscrireBtn.dataset.type = copyBtn.dataset.type;
            inscrireBtn.dataset.entite = copyBtn.dataset.entite;
            inscrireBtn.dataset.tournoiId = copyBtn.dataset.tournoiId;
            inscrireBtn.dataset.tournoiType = copyBtn.dataset.tournoiType;
        }
    }
});

// ========== OUVERTURE MODALE D'INSCRIPTION ==========
const inscriptionModal = document.getElementById('inscriptionModal');
const modalCodeId = document.getElementById('modalCodeId');
const modalTournoiId = document.getElementById('modalTournoiId');
const clubGroup = document.getElementById('clubGroup');
const inscriptionClub = document.getElementById('inscriptionClub');

// ========== GESTION DYNAMIQUE DES CHAMPS DE LA FICHE V2 ==========
const categorieSelect = document.getElementById('inscriptionCategorie');
const disciplineSportGroup = document.getElementById('disciplineSportGroup');
const disciplineArtisteGroup = document.getElementById('disciplineArtisteGroup');
const autreDisciplineGroup = document.getElementById('autreDisciplineGroup');
const inscriptionAutreDiscipline = document.getElementById('inscriptionAutreDiscipline');
const disciplineSportSelect = document.getElementById('inscriptionDisciplineSport');
const disciplineArtisteSelect = document.getElementById('inscriptionDisciplineArtiste');
const statutTalentSelect = document.getElementById('inscriptionStatutTalent');
const clubFieldsGroup = document.getElementById('clubFieldsGroup');
const inscriptionNomClubActuel = document.getElementById('inscriptionNomClubActuel');
const inscriptionContactResponsable = document.getElementById('inscriptionContactResponsable');

function resetDynamicFields() {
    disciplineSportGroup.style.display = 'none';
    disciplineArtisteGroup.style.display = 'none';
    autreDisciplineGroup.style.display = 'none';
    disciplineSportSelect.required = false;
    disciplineArtisteSelect.required = false;
    inscriptionAutreDiscipline.required = false;
    clubFieldsGroup.style.display = 'none';
    inscriptionNomClubActuel.required = false;
    inscriptionContactResponsable.required = false;
}

categorieSelect.addEventListener('change', function() {
    resetDynamicFields();
    const val = this.value;
    if (val === 'sportif') {
        disciplineSportGroup.style.display = 'block';
        disciplineSportSelect.required = true;
    } else if (val === 'artiste') {
        disciplineArtisteGroup.style.display = 'block';
        disciplineArtisteSelect.required = true;
    }
});

function handleAutreDiscipline(selectElement) {
    const val = selectElement.value;
    if (val === 'autre_sport' || val === 'autre_artiste') {
        autreDisciplineGroup.style.display = 'block';
        inscriptionAutreDiscipline.required = true;
    } else {
        autreDisciplineGroup.style.display = 'none';
        inscriptionAutreDiscipline.required = false;
        inscriptionAutreDiscipline.value = '';
    }
}
disciplineSportSelect.addEventListener('change', () => handleAutreDiscipline(disciplineSportSelect));
disciplineArtisteSelect.addEventListener('change', () => handleAutreDiscipline(disciplineArtisteSelect));

statutTalentSelect.addEventListener('change', function() {
    const val = this.value;
    if (val === 'en_club') {
        clubFieldsGroup.style.display = 'block';
        inscriptionNomClubActuel.required = true;
        inscriptionContactResponsable.required = true;
    } else {
        clubFieldsGroup.style.display = 'none';
        inscriptionNomClubActuel.required = false;
        inscriptionContactResponsable.required = false;
    }
});

document.addEventListener('click', (e) => {
    const inscrireBtn = e.target.closest('.btn-inscrire');
    if (inscrireBtn && inscrireBtn.dataset.codeId) {
        e.preventDefault();
        modalCodeId.value = inscrireBtn.dataset.codeId;
        modalTournoiId.value = inscrireBtn.dataset.tournoiId;
        document.getElementById('inscriptionForm').reset();
        resetDynamicFields();
        clubGroup.style.display = 'none';
        inscriptionClub.required = false;
        inscriptionModal.classList.add('active');
    }
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        inscriptionModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === inscriptionModal) inscriptionModal.classList.remove('active');
});

// ========== SOUMISSION FORMULAIRE D'INSCRIPTION V2 ==========
document.getElementById('inscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const codeId = modalCodeId.value;
    const nom = document.getElementById('inscriptionNom').value.trim();
    const dateNaissance = document.getElementById('inscriptionDateNaissance').value;
    const villeQuartier = document.getElementById('inscriptionVilleQuartier').value.trim();
    const telephone = document.getElementById('inscriptionTelephone').value.trim();
    const email = document.getElementById('inscriptionEmail').value.trim();
    const reseauxSociaux = document.getElementById('inscriptionReseauxSociaux').value.trim();

    const categorie = document.getElementById('inscriptionCategorie').value;
    let discipline = '';
    let autreDiscipline = '';
    if (categorie === 'sportif') {
        discipline = document.getElementById('inscriptionDisciplineSport').value;
        if (discipline === 'autre_sport') {
            autreDiscipline = document.getElementById('inscriptionAutreDiscipline').value.trim();
        }
    } else if (categorie === 'artiste') {
        discipline = document.getElementById('inscriptionDisciplineArtiste').value;
        if (discipline === 'autre_artiste') {
            autreDiscipline = document.getElementById('inscriptionAutreDiscipline').value.trim();
        }
    }

    const statutTalent = document.getElementById('inscriptionStatutTalent').value;
    const nomClubActuel = statutTalent === 'en_club' ? document.getElementById('inscriptionNomClubActuel').value.trim() : null;
    const contactResponsable = statutTalent === 'en_club' ? document.getElementById('inscriptionContactResponsable').value.trim() : null;

    const niveauEtudes = document.getElementById('inscriptionNiveauEtudes').value.trim();
    const metierSouhaite = document.getElementById('inscriptionMetierSouhaite').value.trim();

    const disponibilites = {};
    document.querySelectorAll('.dispo-check:checked').forEach(cb => {
        const day = cb.dataset.day;
        const slot = cb.dataset.slot;
        if (!disponibilites[day]) disponibilites[day] = [];
        disponibilites[day].push(slot);
    });

    if (!codeId || !nom || !dateNaissance || !villeQuartier || !telephone || !email || !categorie) {
        showToast(tournoiT('toast.fill_fields'), 'warning');
        return;
    }
    if (categorie === 'sportif' && !discipline) {
        showToast(tournoiT('toast.fill_fields'), 'warning');
        return;
    }
    if (categorie === 'artiste' && !discipline) {
        showToast(tournoiT('toast.fill_fields'), 'warning');
        return;
    }
    if (statutTalent === 'en_club' && (!nomClubActuel || !contactResponsable)) {
        showToast(tournoiT('toast.fill_fields'), 'warning');
        return;
    }

    showLoader();
    try {
        const insertData = {
            code_id: codeId,
            nom_complet: nom,
            email: email,
            telephone: telephone,
            nom_club: nomClubActuel || null,
            statut: 'en_attente',
            date_soumission: new Date().toISOString(),
            date_naissance: dateNaissance,
            ville_quartier: villeQuartier,
            reseaux_sociaux: reseauxSociaux || null,
            categorie_talent: categorie,
            discipline: discipline,
            autre_discipline: autreDiscipline || null,
            statut_talent: statutTalent,
            nom_club_actuel: nomClubActuel,
            contact_responsable: contactResponsable,
            niveau_etudes: niveauEtudes || null,
            metier_souhaite: metierSouhaite || null,
            disponibilites: Object.keys(disponibilites).length > 0 ? disponibilites : null
        };

        const { error } = await supabasePublic
            .from('public_inscriptions_tournoi')
            .insert([insertData]);
        if (error) throw error;

        showToast(tournoiT('toast.inscription_ok'), 'success');
        inscriptionModal.classList.remove('active');
        document.getElementById('inscriptionForm').reset();
        resetDynamicFields();
    } catch (err) {
        console.error(err);
        showToast(tournoiT('toast.inscription_error'), 'error');
    } finally {
        hideLoader();
    }
});

// ========== UTILITAIRES ==========
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(tournoiCurrentLang === 'fr' ? 'fr-FR' : 'en-US');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

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
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

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

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = tournoiT(key);
            } else {
                el.innerHTML = tournoiT(key);
            }
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = tournoiT(key);
    });
}

function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = tournoiCurrentLang;
        langSelect.addEventListener('change', (e) => {
            tournoiSetLanguage(e.target.value);
            applyTranslations();
            loadTournois();
            loadLive();
        });
    }
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadLive();
    loadTournois();
});
// ========== FIN DE TOURNOI.JS ==========
