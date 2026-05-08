// ========== DEBUT : tournoi.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ----- LANGUE & TRADUCTIONS ----- */
// Utilise `window.translations` défini dans tournoi-i18n.js (si non présent, fallback fr minimal)
const translations = window.translations || {
    fr: {
        loader_message: 'Chargement...',
        tournoi_live_title: 'Live en direct',
        tournois_title: 'Tournois à venir',
        tournoi_info_title: 'Comment participer ?',
        tournoi_info_text: '1. Choisissez un tournoi.<br>2. Copiez le code d\'inscription.<br>3. Cliquez sur "S\'inscrire" et remplissez le formulaire.<br>4. Après validation, vous recevrez vos identifiants pour accéder à l\'espace privé.',
        modal_inscription_title: 'Inscription au tournoi',
        modal_nom_complet: 'Nom complet *',
        modal_date_naissance: 'Date de naissance *',
        modal_ville_quartier: 'Ville / Quartier *',
        modal_telephone: 'Téléphone (WhatsApp) *',
        modal_email: 'Email *',
        modal_reseaux_sociaux: 'Réseaux sociaux',
        modal_categorie: 'Catégorie principale *',
        modal_discipline_sport: 'Discipline sportive *',
        modal_discipline_artiste: 'Discipline artistique *',
        modal_autre_discipline: 'Précisez *',
        modal_statut_talent: 'Vous êtes *',
        modal_nom_club_actuel: 'Nom du Club / Association *',
        modal_contact_responsable: 'Nom et Contact du Responsable *',
        modal_niveau_etudes: 'Niveau d\'études actuel',
        modal_metier_souhaite: 'Métier souhaité ou compétence secondaire',
        modal_envoyer: 'Envoyer ma demande',
        copy: 'Copier',
        copied: 'Copié !',
        inscrire: 'S\'inscrire',
        code_complet: 'Complet',
        footer_conformite: 'Conformité APDP Bénin',
        footer_reglementation: 'Règlementation FIFA',
        footer_double_projet: 'Triple Projet Sport-Études-Carrière',
        contact_tel: '📞 +229 01 95 97 31 57',
        contact_email: '📧 contacthubisoccer@gmail.com',
        rccm: 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        copyright: '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        toast_code_copied: 'Code copié !',
        toast_fill_fields: 'Veuillez remplir tous les champs obligatoires.',
        toast_inscription_ok: 'Demande envoyée. Vous serez notifié après validation.',
        toast_inscription_error: 'Erreur lors de l\'envoi.',
        toast_no_live: 'Aucun live en cours pour le moment.',
        no_tournoi: 'Aucun tournoi pour le moment.',
        media_modal_title: 'Détail du média'
    }
};

let currentLang = localStorage.getItem('hubiLang') || 'fr';
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = (translations[currentLang] && translations[currentLang][key]) || translations['fr'][key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else if (el.tagName === 'SELECT' || el.tagName === 'OPTION') {
                el.textContent = t(key);
            } else {
                // Conserver les <br> etc.
                if (el.innerHTML.includes('<')) el.innerHTML = t(key);
                else el.textContent = t(key);
            }
        }
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('hubiLang', lang);
        applyTranslations();
        loadLive();
        loadTournois();
    }
}

/* ----- CHARGEMENT DU LIVE ----- */
async function loadLive() {
    const container = document.getElementById('liveContainer');
    if (!container) return;
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
            container.innerHTML = `
                <div class="live-card">
                    <div class="live-video">
                        <iframe src="${escapeHtml(live.embed_url)}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="live-info">
                        <h3 class="live-title">${escapeHtml(live.titre)}</h3>
                        <p>${escapeHtml(live.description || '')}</p>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="no-live">${t('toast_no_live')}</div>`;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="no-live">${t('toast_no_live')}</div>`;
    }
}

/* ----- CHARGEMENT DES TOURNOIS (avec médias multiples) ----- */
const tournoiGrid = document.getElementById('tournoiGrid');

async function loadTournois() {
    if (!tournoiGrid) return;
    showLoader();
    try {
        const { data: tournois, error } = await supabasePublic
            .from('public_tournois')
            .select('*')
            .order('date_debut', { ascending: true });
        if (error) throw error;
        if (!tournois || tournois.length === 0) {
            tournoiGrid.innerHTML = `<p>${t('no_tournoi')}</p>`;
            return;
        }
        let html = '';
        for (const tournoi of tournois) {
            // Récupérer les médias liés
            const { data: medias } = await supabasePublic
                .from('public_tournoi_media')
                .select('media_url, media_type')
                .eq('tournoi_id', tournoi.id)
                .order('position');
            const mediaItems = medias || [];
            // Générer la miniature avec initiales si aucun média
            let mediaHtml = '';
            if (mediaItems.length > 0) {
                // Afficher la première image ou vidéo en miniature
                const first = mediaItems[0];
                if (first.media_type === 'image') {
                    mediaHtml = `<img src="${first.media_url}" alt="${escapeHtml(tournoi.titre)}" class="card-image">`;
                } else {
                    mediaHtml = `<div class="video-thumb"><video src="${first.media_url}" muted preload="metadata"></video><span class="play-icon"><i class="fas fa-play-circle"></i></span></div>`;
                }
            } else {
                const initials = (tournoi.titre || '?').substring(0,2).toUpperCase();
                mediaHtml = `<div class="initials-placeholder">${initials}</div>`;
            }
            html += `
                <div class="tournoi-card" data-tournoi-id="${tournoi.id}">
                    <div class="card-image-container">
                        ${mediaHtml}
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
                                <button class="copy-btn" data-tournoi-id="${tournoi.id}"><i class="fas fa-copy"></i> ${t('copy')}</button>
                            </div>
                            <button class="btn-inscrire" style="display: none;" data-tournoi-id="${tournoi.id}">${t('inscrire')}</button>
                        </div>
                    </div>
                </div>
            `;
        }
        tournoiGrid.innerHTML = html;

        // Attacher les événements de copie, de clic sur les cartes (galerie) et d'ouverture de modale
        document.querySelectorAll('.tournoi-card').forEach(card => {
            card.addEventListener('click', async function(e) {
                // Ne pas ouvrir la modale média si on clique sur un bouton ou un lien
                if (e.target.closest('button') || e.target.closest('a')) return;
                const tournoiId = this.dataset.tournoiId;
                await openMediaModal(tournoiId);
            });
        });

        // Réactiver les boutons de copie
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const tournoiId = btn.dataset.tournoiId;
                await handleCopyCode(tournoiId, btn);
            });
        });

        // Boutons "S'inscrire"
        document.querySelectorAll('.btn-inscrire').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tournoiId = btn.dataset.tournoiId;
                openInscriptionModal(tournoiId, btn.dataset.codeId, btn.dataset.codeValue, btn.dataset.type, btn.dataset.entite);
            });
        });

        // Pour chaque tournoi, charger le code d'inscription
        for (const t of tournois) {
            await loadCodeForTournoi(t.id);
        }
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement tournois', 'error');
    } finally {
        hideLoader();
    }
}

/* ----- AFFICHAGE DE LA GALERIE DANS UNE MODALE ----- */
async function openMediaModal(tournoiId) {
    try {
        // Récupérer les infos du tournoi + les médias
        const { data: tournoi, error: errTournoi } = await supabasePublic
            .from('public_tournois')
            .select('titre, description')
            .eq('id', tournoiId)
            .single();
        if (errTournoi) throw errTournoi;
        const { data: medias, error: errMedias } = await supabasePublic
            .from('public_tournoi_media')
            .select('media_url, media_type')
            .eq('tournoi_id', tournoiId)
            .order('position');
        if (errMedias) throw errMedias;

        const mediaList = medias || [];
        const modal = document.getElementById('mediaModal');
        const display = document.getElementById('mediaDisplay');
        const titleEl = document.getElementById('mediaTitle');
        const descEl = document.getElementById('mediaDescription');

        let html = '';
        if (mediaList.length === 0) {
            html = `<p>Aucun média pour ce tournoi.</p>`;
        } else if (mediaList.length === 1) {
            const m = mediaList[0];
            if (m.media_type === 'image') {
                html = `<img src="${m.media_url}" alt="${escapeHtml(tournoi.titre)}" style="max-width:100%; max-height:70vh;">`;
            } else {
                html = `<video controls autoplay src="${m.media_url}" style="max-width:100%; max-height:70vh;"></video>`;
            }
        } else {
            // Carrousel simple
            html = `<div class="media-carousel">`;
            mediaList.forEach((m, idx) => {
                html += `<div class="slide ${idx === 0 ? 'active' : ''}">`;
                if (m.media_type === 'image') {
                    html += `<img src="${m.media_url}" alt="Média ${idx+1}">`;
                } else {
                    html += `<video controls src="${m.media_url}"></video>`;
                }
                html += `</div>`;
            });
            html += `</div><button class="prev-slide"><i class="fas fa-chevron-left"></i></button><button class="next-slide"><i class="fas fa-chevron-right"></i></button>`;
        }

        display.innerHTML = html;
        titleEl.textContent = tournoi.titre;
        descEl.textContent = tournoi.description || '';
        modal.classList.add('active');

        // Gestion du carrousel
        let currentSlide = 0;
        const slides = display.querySelectorAll('.slide');
        if (slides.length > 1) {
            function showSlide(index) {
                slides.forEach((s, i) => s.classList.toggle('active', i === index));
                currentSlide = index;
            }
            const prevBtn = modal.querySelector('.prev-slide');
            const nextBtn = modal.querySelector('.next-slide');
            if (prevBtn) prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide((currentSlide - 1 + slides.length) % slides.length);
            });
            if (nextBtn) nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide((currentSlide + 1) % slides.length);
            });
        }
    } catch (err) {
        showToast('Erreur chargement médias', 'error');
    }
}

/* ----- GESTION DU CODE D'INSCRIPTION ----- */
async function loadCodeForTournoi(tournoiId) {
    try {
        const { data, error } = await supabasePublic
            .from('public_codes_tournoi')
            .select('id, code, type_inscription, entite, quota_max, quota_utilise')
            .eq('tournoi_id', tournoiId)
            .eq('actif', true)
            .limit(1);
        if (error) throw error;
        const codeInfo = data && data[0] ? data[0] : null;
        const codeEl = document.querySelector(`#code-${tournoiId} .code`);
        const copyBtn = document.querySelector(`#code-${tournoiId} .copy-btn`);
        const inscrireBtn = document.querySelector(`#code-${tournoiId} .btn-inscrire`);
        if (!codeEl || !copyBtn || !inscrireBtn) return;

        if (codeInfo) {
            const { data: tournoiData } = await supabasePublic
                .from('public_tournois')
                .select('type_tournoi')
                .eq('id', tournoiId)
                .single();
            const estIndividuel = tournoiData?.type_tournoi === 'individuel';
            const estComplet = codeInfo.quota_utilise >= codeInfo.quota_max;
            codeEl.textContent = codeInfo.code;
            if (estComplet) {
                copyBtn.innerHTML = `<i class="fas fa-ban"></i> ${t('code_complet')}`;
                copyBtn.disabled = true;
                inscrireBtn.style.display = 'none';
            } else {
                copyBtn.disabled = false;
                copyBtn.innerHTML = `<i class="fas fa-copy"></i> ${t('copy')}`;
                copyBtn.dataset.codeId = codeInfo.id;
                copyBtn.dataset.codeValue = codeInfo.code;
                copyBtn.dataset.type = codeInfo.type_inscription;
                copyBtn.dataset.entite = codeInfo.entite || '';
                copyBtn.dataset.tournoiId = tournoiId;
                copyBtn.dataset.tournoiType = estIndividuel ? 'individuel' : 'collectif';
            }
        } else {
            codeEl.textContent = 'Code indisponible';
            copyBtn.disabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleCopyCode(tournoiId, btn) {
    const code = btn.dataset.codeValue;
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code);
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    showToast(t('toast_code_copied'), 'success');

    // Afficher le bouton "S'inscrire"
    const codeBox = btn.closest('.tournoi-code');
    const inscrireBtn = codeBox.querySelector('.btn-inscrire');
    const codeBoxDiv = codeBox.querySelector('.code-box');
    if (inscrireBtn) {
        codeBoxDiv.style.display = 'none';
        inscrireBtn.style.display = 'inline-flex';
        // Transférer les données
        inscrireBtn.dataset.codeId = btn.dataset.codeId;
        inscrireBtn.dataset.codeValue = btn.dataset.codeValue;
        inscrireBtn.dataset.type = btn.dataset.type;
        inscrireBtn.dataset.entite = btn.dataset.entite;
        inscrireBtn.dataset.tournoiId = btn.dataset.tournoiId;
        inscrireBtn.dataset.tournoiType = btn.dataset.tournoiType;
    }
}

/* ----- MODALE INSCRIPTION ----- */
const inscriptionModal = document.getElementById('inscriptionModal');
const modalCodeId = document.getElementById('modalCodeId');
const modalTournoiId = document.getElementById('modalTournoiId');

// Champs dynamiques
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

function openInscriptionModal(tournoiId, codeId, codeValue, type, entite) {
    modalCodeId.value = codeId;
    modalTournoiId.value = tournoiId;
    document.getElementById('inscriptionForm').reset();
    resetDynamicFields();
    inscriptionModal.classList.add('active');
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        inscriptionModal.classList.remove('active');
        document.getElementById('mediaModal').classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === inscriptionModal) inscriptionModal.classList.remove('active');
    const mediaModal = document.getElementById('mediaModal');
    if (e.target === mediaModal) mediaModal.classList.remove('active');
});

/* ----- SOUMISSION INSCRIPTION ----- */
document.getElementById('inscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const codeId = modalCodeId.value;
    const nom = document.getElementById('inscriptionNom').value.trim();
    const dateNaissance = document.getElementById('inscriptionDateNaissance').value;
    const villeQuartier = document.getElementById('inscriptionVilleQuartier').value.trim();
    const telephone = document.getElementById('inscriptionTelephone').value.trim();
    const email = document.getElementById('inscriptionEmail').value.trim();
    const reseauxSociaux = document.getElementById('inscriptionReseauxSociaux').value.trim();
    
    const categorie = categorieSelect.value;
    let discipline = '';
    let autreDiscipline = '';
    if (categorie === 'sportif') {
        discipline = disciplineSportSelect.value;
        if (discipline === 'autre_sport') {
            autreDiscipline = inscriptionAutreDiscipline.value.trim();
        }
    } else if (categorie === 'artiste') {
        discipline = disciplineArtisteSelect.value;
        if (discipline === 'autre_artiste') {
            autreDiscipline = inscriptionAutreDiscipline.value.trim();
        }
    }
    
    const statutTalent = statutTalentSelect.value;
    const nomClubActuel = statutTalent === 'en_club' ? inscriptionNomClubActuel.value.trim() : null;
    const contactResponsable = statutTalent === 'en_club' ? inscriptionContactResponsable.value.trim() : null;
    
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
        showToast(t('toast_fill_fields'), 'warning');
        return;
    }
    if ((categorie === 'sportif' && !discipline) || (categorie === 'artiste' && !discipline)) {
        showToast(t('toast_fill_fields'), 'warning');
        return;
    }
    if (statutTalent === 'en_club' && (!nomClubActuel || !contactResponsable)) {
        showToast(t('toast_fill_fields'), 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_inscriptions_tournoi')
            .insert([{
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
            }]);
        if (error) throw error;
        showToast(t('toast_inscription_ok'), 'success');
        inscriptionModal.classList.remove('active');
    } catch (err) {
        console.error(err);
        showToast(t('toast_inscription_error'), 'error');
    } finally {
        hideLoader();
    }
});

/* ----- UTILITAIRES ----- */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US');
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

/* ----- MENU MOBILE & LANGUE ----- */
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
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

/* ----- INIT ----- */
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadLive();
    loadTournois();
});
// ========== FIN : tournoi.js ==========
