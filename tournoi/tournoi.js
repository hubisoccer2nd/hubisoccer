// ========== DEBUT : tournoi.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DEBUT : LANGUE & TRADUCTIONS ==========
const translations = window.translations || {
    fr: {
        loader_message: 'Chargement...',
        toast_no_live: 'Aucun live en ce moment.',
        no_tournoi: 'Aucun tournoi à venir.',
        copy: 'Copier',
        inscrire: 'S\'inscrire',
        code_complet: 'Complet',
        places_restantes: '{count} place(s) restante(s)',
        toast_code_copied: 'Code copié !',
        toast_inscription_ok: 'Demande envoyée avec succès !',
        toast_inscription_error: 'Erreur lors de l\'inscription.',
        toast_fill_fields: 'Veuillez remplir tous les champs obligatoires.',
        media_no_media: 'Aucun média pour ce tournoi.',
        search_placeholder: 'Rechercher un tournoi (titre, ville, quartier)...',
        all_sports: 'Tous les sports',
        type_collectif: 'Collectif',
        type_individuel: 'Individuel',
        reglement_title: 'Règlement',
        share_tournoi: 'Partager',
        share_text: 'Découvre ce tournoi HubISoccer : {titre}'
    },
    en: {
        loader_message: 'Loading...',
        toast_no_live: 'No live at the moment.',
        no_tournoi: 'No upcoming tournaments.',
        copy: 'Copy',
        inscrire: 'Register',
        code_complet: 'Full',
        places_restantes: '{count} place(s) left',
        toast_code_copied: 'Code copied!',
        toast_inscription_ok: 'Request sent successfully!',
        toast_inscription_error: 'Error during registration.',
        toast_fill_fields: 'Please fill in all required fields.',
        media_no_media: 'No media for this tournament.',
        search_placeholder: 'Search a tournament (title, city, area)...',
        all_sports: 'All sports',
        type_collectif: 'Team',
        type_individuel: 'Individual',
        reglement_title: 'Rules',
        share_tournoi: 'Share',
        share_text: 'Check out this HubISoccer tournament: {titre}'
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
// ========== FIN : LANGUE & TRADUCTIONS ==========

// ========== DEBUT : CHARGEMENT DU LIVE ==========
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
// ========== FIN : CHARGEMENT DU LIVE ==========

// ========== DEBUT : CHARGEMENT DES TOURNOIS ==========
const tournoiGrid = document.getElementById('tournoiGrid');
let allTournois = [];

// Éléments de filtre (existent dans le HTML)
const searchInput = document.getElementById('searchInput');
const sportFilter = document.getElementById('sportFilter');

function filterTournois() {
    const maintenant = new Date();
    let filtered = allTournois.filter(t => {
        // 1. Masquer les tournois terminés
        if (t.date_fin && new Date(t.date_fin) < maintenant) return false;
        // 2. Filtre par sport
        const sportVal = sportFilter ? sportFilter.value : 'all';
        if (sportVal !== 'all' && t.sport !== sportVal) return false;
        // 3. Recherche textuelle
        const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchVal) {
            const titre = (t.titre || '').toLowerCase();
            const ville = (t.ville || '').toLowerCase();
            const quartier = (t.quartier || '').toLowerCase();
            const description = (t.description || '').replace(/<[^>]*>/g, '').toLowerCase();
            if (!titre.includes(searchVal) && !ville.includes(searchVal) && !quartier.includes(searchVal) && !description.includes(searchVal)) {
                return false;
            }
        }
        return true;
    });
    return filtered;
}

async function loadTournois() {
    if (!tournoiGrid) return;
    showLoader();
    try {
        const { data: tournois, error } = await supabasePublic
            .from('public_tournois')
            .select('*')
            .order('date_debut', { ascending: true });
        if (error) throw error;
        allTournois = tournois || [];
        renderTournois();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement tournois', 'error');
    } finally {
        hideLoader();
    }
}

function renderTournois() {
    const filtered = filterTournois();
    if (!filtered || filtered.length === 0) {
        tournoiGrid.innerHTML = `<p>${t('no_tournoi')}</p>`;
        return;
    }
    let html = '';
    filtered.forEach(tournoi => {
        // Les médias seront chargés plus tard via loadCodeForTournoi et les événements
        // Pour l'instant on prépare la structure
        const typeLabel = tournoi.type_tournoi === 'individuel' ? t('type_individuel') : t('type_collectif');
        html += `
            <div class="tournoi-card" data-tournoi-id="${tournoi.id}">
                <div class="card-image-container" id="card-media-${tournoi.id}">
                    <!-- placeholder temporaire -->
                    <div class="initials-placeholder">${(tournoi.titre || '?').replace(/<[^>]*>/g, '').substring(0,2).toUpperCase()}</div>
                    <div class="card-badge">${escapeHtml(tournoi.sport)}</div>
                </div>
                <div class="card-content">
                    <h3 class="tournoi-title">${tournoi.titre || ''}</h3>
                    <span class="tournoi-type-badge">${typeLabel}</span>
                    <div class="tournoi-desc">${tournoi.description || ''}</div>
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
                        <div id="places-info-${tournoi.id}" class="places-info"></div>
                        <button class="btn-inscrire" data-tournoi-id="${tournoi.id}">${t('inscrire')}</button>
                        <button class="share-btn" data-tournoi-id="${tournoi.id}" title="${t('share_tournoi')}"><i class="fas fa-share-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    tournoiGrid.innerHTML = html;

    // Attacher les événements après avoir injecté le HTML
    attachCardEvents();
    // Charger les médias et les codes pour chaque tournoi affiché
    filtered.forEach(t => {
        loadMediaForCard(t.id);
        loadCodeForTournoi(t.id);
    });
}

async function loadMediaForCard(tournoiId) {
    try {
        const { data: medias, error } = await supabasePublic
            .from('public_tournoi_media')
            .select('media_url, media_type')
            .eq('tournoi_id', tournoiId)
            .order('position');
        if (error) throw error;
        const container = document.getElementById('card-media-' + tournoiId);
        if (!container) return;
        const mediaItems = medias || [];
        let mediaHtml = '';
        if (mediaItems.length > 0) {
            const first = mediaItems[0];
            if (first.media_type === 'image') {
                mediaHtml = `<img src="${first.media_url}" alt="" class="card-image">`;
            } else {
                mediaHtml = `<div class="video-thumb"><video src="${first.media_url}" muted preload="metadata"></video><span class="play-icon"><i class="fas fa-play-circle"></i></span></div>`;
            }
        } else {
            // garder le placeholder existant
            return;
        }
        // Conserver le badge
        const badge = container.querySelector('.card-badge');
        container.innerHTML = mediaHtml;
        if (badge) container.appendChild(badge);
    } catch (err) {
        console.error('Erreur chargement média pour la carte', err);
    }
}

function attachCardEvents() {
    // Clic sur la carte -> ouvre la modale média
    document.querySelectorAll('.tournoi-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('button') || e.target.closest('a')) return;
            const tournoiId = this.dataset.tournoiId;
            openMediaModal(tournoiId);
        });
    });

    // Bouton Copier
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tournoiId = btn.dataset.tournoiId;
            await handleCopyCode(tournoiId, btn);
        });
    });

    // Bouton S'inscrire (toujours visible)
    document.querySelectorAll('.btn-inscrire').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tournoiId = btn.dataset.tournoiId;
            await handleDirectInscription(tournoiId);
        });
    });

    // Bouton Partage
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tournoiId = btn.dataset.tournoiId;
            shareTournoi(tournoiId);
        });
    });
}

// ========== FIN : CHARGEMENT DES TOURNOIS ==========

// ========== DEBUT : MODALE MÉDIA / DÉTAILS (avec onglets) ==========
async function openMediaModal(tournoiId) {
    try {
        const { data: tournoi, error: errTournoi } = await supabasePublic
            .from('public_tournois')
            .select('*')
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

        // Construire les onglets
        let tabsHtml = `<div class="modal-tabs">
            <button class="modal-tab-btn active" data-tab="details">Détails</button>
            ${tournoi.reglements ? '<button class="modal-tab-btn" data-tab="reglement">'+t('reglement_title')+'</button>' : ''}
        </div>`;

        // Onglet Détails
        let detailsHtml = `<div id="tab-details" class="modal-tab-content active">
            <div class="media-carousel-wrapper">`;

        if (mediaList.length === 0) {
            detailsHtml += `<p>${t('media_no_media')}</p>`;
        } else if (mediaList.length === 1) {
            const m = mediaList[0];
            if (m.media_type === 'image') {
                detailsHtml += `<img src="${m.media_url}" alt="${escapeHtml(tournoi.titre)}" style="max-width:100%; max-height:70vh;">`;
            } else {
                detailsHtml += `<video controls autoplay src="${m.media_url}" style="max-width:100%; max-height:70vh;"></video>`;
            }
        } else {
            detailsHtml += `<div class="media-carousel">`;
            mediaList.forEach((m, idx) => {
                detailsHtml += `<div class="slide ${idx === 0 ? 'active' : ''}">`;
                if (m.media_type === 'image') {
                    detailsHtml += `<img src="${m.media_url}" alt="Média ${idx+1}">`;
                } else {
                    detailsHtml += `<video controls src="${m.media_url}"></video>`;
                }
                detailsHtml += `</div>`;
            });
            detailsHtml += `</div><button class="prev-slide"><i class="fas fa-chevron-left"></i></button><button class="next-slide"><i class="fas fa-chevron-right"></i></button>`;
        }
        detailsHtml += `</div>
            <div class="tournoi-desc-full">${tournoi.description || ''}</div>
        </div>`;

        // Onglet Règlement
        let reglementHtml = '';
        if (tournoi.reglements) {
            reglementHtml = `<div id="tab-reglement" class="modal-tab-content">
                ${tournoi.reglements}
            </div>`;
        }

        display.innerHTML = tabsHtml + detailsHtml + reglementHtml;
        titleEl.innerHTML = tournoi.titre || '';
        descEl.innerHTML = ''; // on n'utilise plus cette zone
        modal.classList.add('active');

        // Gestion des onglets
        const tabBtns = modal.querySelectorAll('.modal-tab-btn');
        const tabContents = modal.querySelectorAll('.modal-tab-content');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById('tab-' + tab);
                if (target) target.classList.add('active');
            });
        });

        // Carrousel
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
// ========== FIN : MODALE MÉDIA / DÉTAILS ==========

// ========== DEBUT : GESTION DU CODE ET INSCRIPTION ==========
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
        const placesInfo = document.getElementById(`places-info-${tournoiId}`);
        if (!codeEl || !copyBtn || !inscrireBtn) return;

        if (codeInfo) {
            const { data: tournoiData } = await supabasePublic
                .from('public_tournois')
                .select('type_tournoi')
                .eq('id', tournoiId)
                .single();
            const estIndividuel = tournoiData?.type_tournoi === 'individuel';
            const placesRestantes = codeInfo.quota_max - codeInfo.quota_utilise;
            codeEl.textContent = codeInfo.code;
            if (placesRestantes <= 0) {
                copyBtn.innerHTML = `<i class="fas fa-ban"></i> ${t('code_complet')}`;
                copyBtn.disabled = true;
                inscrireBtn.disabled = true;
                if (placesInfo) placesInfo.innerHTML = '<span class="places-complet">Complet</span>';
            } else {
                copyBtn.disabled = false;
                copyBtn.innerHTML = `<i class="fas fa-copy"></i> ${t('copy')}`;
                // Stocker les infos pour l'inscription
                inscrireBtn.dataset.codeId = codeInfo.id;
                inscrireBtn.dataset.codeValue = codeInfo.code;
                inscrireBtn.dataset.type = codeInfo.type_inscription;
                inscrireBtn.dataset.entite = codeInfo.entite || '';
                inscrireBtn.dataset.tournoiId = tournoiId;
                inscrireBtn.dataset.tournoiType = estIndividuel ? 'individuel' : 'collectif';
                inscrireBtn.disabled = false;
                if (placesInfo) placesInfo.innerHTML = `<span class="places-restantes">${t('places_restantes', { count: placesRestantes })}</span>`;
            }
        } else {
            codeEl.textContent = 'Code indisponible';
            copyBtn.disabled = true;
            inscrireBtn.disabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleCopyCode(tournoiId, btn) {
    const code = btn.dataset.codeValue;
    if (!code) {
        // Si pas de code encore chargé, on recharge
        await loadCodeForTournoi(tournoiId);
        return;
    }
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
}

// Nouvelle fonction : inscription directe (copie + ouvre modale)
async function handleDirectInscription(tournoiId) {
    // S'assurer que le code est chargé
    const btn = document.querySelector(`#code-${tournoiId} .btn-inscrire`);
    if (!btn || btn.disabled) return;
    if (!btn.dataset.codeValue) {
        await loadCodeForTournoi(tournoiId);
        if (!btn.dataset.codeValue) return;
    }
    // Copier le code automatiquement
    try {
        await navigator.clipboard.writeText(btn.dataset.codeValue);
    } catch (err) {
        // fallback
    }
    // Ouvrir la modale d'inscription
    openInscriptionModal(tournoiId, btn.dataset.codeId, btn.dataset.codeValue, btn.dataset.type, btn.dataset.entite);
}

// Partage social
async function shareTournoi(tournoiId) {
    const tournoi = allTournois.find(t => t.id == tournoiId);
    if (!tournoi) return;
    const shareUrl = window.location.origin + '/tournoi/?id=' + tournoiId;
    const title = t('share_tournoi', { titre: tournoi.titre.replace(/<[^>]*>/g, '') });
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: title,
                url: shareUrl
            });
        } catch (err) {
            console.log('Partage annulé');
        }
    } else {
        // Fallback copier le lien
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Lien copié !', 'success');
        } catch (err) {
            showToast('Impossible de partager', 'error');
        }
    }
}
// ========== FIN : GESTION DU CODE ET INSCRIPTION ==========

// ========== DEBUT : MODALE INSCRIPTION ==========
const inscriptionModal = document.getElementById('inscriptionModal');
const modalCodeId = document.getElementById('modalCodeId');
const modalTournoiId = document.getElementById('modalTournoiId');

// Champs dynamiques (identiques à avant)
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

// Fermeture des modales
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
// ========== FIN : MODALE INSCRIPTION ==========

// ========== DEBUT : SOUMISSION INSCRIPTION ==========
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
// ========== FIN : SOUMISSION INSCRIPTION ==========

// ========== DEBUT : UTILITAIRES ==========
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
// ========== FIN : UTILITAIRES ==========

// ========== DEBUT : MENU MOBILE & LANGUE ==========
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
// ========== FIN : MENU MOBILE & LANGUE ==========

// ========== DEBUT : INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    loadLive();
    loadTournois();

    // Écouteurs des filtres (existants dans le HTML)
    if (searchInput) {
        searchInput.addEventListener('input', () => renderTournois());
    }
    if (sportFilter) {
        sportFilter.addEventListener('change', () => renderTournois());
    }
});
// ========== FIN : INITIALISATION ==========
// ========== FIN : tournoi.js ==========