// ========== FICHE-CLUB.JS – VERSION FINALE ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let currentClub = null;
let uploadedPhotoUrl = null;
let formModified = false;
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

function getInitiales(nom) {
    if (!nom) return '??';
    return nom
        .split(' ')
        .map(mot => mot.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

function showToast(message, type = 'info', duration = 15000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div><div class="toast-content">${escapeHtml(message)}</div><button class="toast-close"><i class="fas fa-times"></i></button>`;
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

function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function generateLogin(nom) {
    const base = nom.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return base + random;
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
}

function hashPassword(password) { return btoa(password); }
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : SAUVEGARDE AUTOMATIQUE LOCALSTORAGE ==========
function saveFormToLocalStorage() {
    const form = document.getElementById('formulaireInscription');
    if (!form) return;
    const data = {
        nom: document.getElementById('formNom')?.value || '',
        dateNaissance: document.getElementById('formDateNaissance')?.value || '',
        villeQuartier: document.getElementById('formVilleQuartier')?.value || '',
        telephone: document.getElementById('formTelephone')?.value || '',
        emailReseaux: document.getElementById('formEmailReseaux')?.value || '',
        specialite: document.getElementById('formSpecialite')?.value || '',
        piedMain: document.getElementById('formPiedMain')?.value || '',
        taille: document.getElementById('formTaille')?.value || '',
        poids: document.getElementById('formPoids')?.value || '',
        niveauEtudes: document.getElementById('formNiveauEtudes')?.value || '',
        metierSouhaite: document.getElementById('formMetierSouhaite')?.value || '',
        statutActuel: document.getElementById('formStatutActuel')?.value || '',
        nomClubActuel: document.getElementById('formNomClubActuel')?.value || '',
        contactResponsable: document.getElementById('formContactResponsable')?.value || ''
    };
    localStorage.setItem('hubi_fiche_form', JSON.stringify(data));
}

function restoreFormFromLocalStorage() {
    const saved = localStorage.getItem('hubi_fiche_form');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        if (data.nom) document.getElementById('formNom').value = data.nom;
        if (data.dateNaissance) document.getElementById('formDateNaissance').value = data.dateNaissance;
        if (data.villeQuartier) document.getElementById('formVilleQuartier').value = data.villeQuartier;
        if (data.telephone) document.getElementById('formTelephone').value = data.telephone;
        if (data.emailReseaux) document.getElementById('formEmailReseaux').value = data.emailReseaux;
        if (data.specialite) document.getElementById('formSpecialite').value = data.specialite;
        if (data.piedMain) document.getElementById('formPiedMain').value = data.piedMain;
        if (data.taille) document.getElementById('formTaille').value = data.taille;
        if (data.poids) document.getElementById('formPoids').value = data.poids;
        if (data.niveauEtudes) document.getElementById('formNiveauEtudes').value = data.niveauEtudes;
        if (data.metierSouhaite) document.getElementById('formMetierSouhaite').value = data.metierSouhaite;
        if (data.statutActuel) document.getElementById('formStatutActuel').value = data.statutActuel;
        if (data.nomClubActuel) document.getElementById('formNomClubActuel').value = data.nomClubActuel;
        if (data.contactResponsable) document.getElementById('formContactResponsable').value = data.contactResponsable;
        // Mettre à jour l'affichage conditionnel du club actuel
        if (data.statutActuel === 'En club') {
            document.getElementById('groupeClubActuel').style.display = 'block';
        }
    } catch (e) {}
}

function clearFormLocalStorage() {
    localStorage.removeItem('hubi_fiche_form');
}

// Écouteurs pour sauvegarder à chaque modification
function setupAutoSave() {
    const form = document.getElementById('formulaireInscription');
    if (!form) return;
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.addEventListener('input', () => { formModified = true; saveFormToLocalStorage(); });
        field.addEventListener('change', () => { formModified = true; saveFormToLocalStorage(); });
    });
}
// ========== FIN : SAUVEGARDE AUTOMATIQUE ==========

// ========== DÉBUT : UPLOAD PHOTO CORRIGÉ ==========
function setupPhotoUpload() {
    const box = document.getElementById('uploadPhoto');
    const input = document.getElementById('formPhoto');
    const statusDiv = document.getElementById('uploadStatusPhoto');
    const successDiv = document.getElementById('uploadSuccessPhoto');
    if (!box || !input) return;

    statusDiv.style.display = 'none';
    successDiv.style.display = 'none';
    uploadedPhotoUrl = null;

    // Supprimer tout ancien écouteur pour éviter les doublons
    input.removeEventListener('change', handleFileSelect);
    input.addEventListener('change', handleFileSelect);

    // Le clic sur la box ne fait rien : seul l'input capte le clic (couvre toute la box)
}

async function handleFileSelect() {
    const input = document.getElementById('formPhoto');
    const statusDiv = document.getElementById('uploadStatusPhoto');
    const successDiv = document.getElementById('uploadSuccessPhoto');
    const file = input.files[0];
    if (!file) return;

    statusDiv.style.display = 'flex';
    successDiv.style.display = 'none';

    try {
        const safeName = 'candidat_' + Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${safeName}.${fileExt}`;
        const bucket = 'nosclub_documents';

        const { error } = await supabasePublic.storage.from(bucket).upload(fileName, file);
        if (error) throw error;

        const { data: urlData } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);
        uploadedPhotoUrl = urlData.publicUrl;

        statusDiv.style.display = 'none';
        successDiv.style.display = 'flex';
        showToast('Photo téléversée avec succès.', 'success');
    } catch (err) {
        console.error(err);
        statusDiv.style.display = 'none';
        showToast('Erreur upload photo : ' + err.message, 'error');
        input.value = '';
    }
}
// ========== FIN : UPLOAD PHOTO ==========

// ========== DÉBUT : CHARGEMENT DU CLUB ==========
async function loadClub() {
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get('id');
    if (!clubId) {
        document.getElementById('clubNom').textContent = 'Club introuvable.';
        return;
    }

    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('*, nosclub_roles(nom, icone, type)')
            .eq('id', clubId)
            .single();
        if (error || !data) throw error || new Error('Club non trouvé');

        currentClub = data;
        displayClub(data);
        updateButtons(data);
    } catch (err) {
        console.error(err);
        document.getElementById('clubNom').textContent = 'Erreur de chargement du club.';
    } finally {
        hideLoader();
    }
}

function displayClub(club) {
    // Hero
    document.getElementById('clubNom').textContent = club.nom || '';
    document.getElementById('clubSlogan').textContent = club.slogan || '';

    // Badge capacité
    const quotaMax = club.quota_max || 30;
    const quotaUtilise = club.quota_utilise || 0;
    const disponible = quotaMax - quotaUtilise;
    const badge = document.getElementById('clubBadge');
    if (disponible <= 0) {
        badge.textContent = nosClubsT('club.complet');
        badge.className = 'club-badge badge-rouge';
    } else if (disponible <= 5) {
        badge.textContent = nosClubsT('club.presque_complet') + ' (' + disponible + ' ' + nosClubsT('club.places', { places: disponible }) + ')';
        badge.className = 'club-badge badge-orange';
    } else {
        badge.textContent = nosClubsT('club.recrutement_ouvert') + ' (' + disponible + ' ' + nosClubsT('club.places', { places: disponible }) + ')';
        badge.className = 'club-badge badge-vert';
    }

    // Logo ou initiales
    const logoContainer = document.getElementById('clubLogoContainer');
    if (club.logo_url) {
        logoContainer.innerHTML = `<img src="${escapeHtml(club.logo_url)}" alt="${escapeHtml(club.nom)}" class="club-logo-large">`;
    } else {
        logoContainer.innerHTML = `<div class="club-initiales-large">${getInitiales(club.nom)}</div>`;
    }

    // Bannière de fond
    const hero = document.getElementById('clubHero');
    if (club.banniere_url) {
        hero.style.backgroundImage = `url('${escapeHtml(club.banniere_url)}')`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
    }

    // Discipline
    document.getElementById('clubDiscipline').innerHTML = `<i class="fas ${club.nosclub_roles?.icone || 'fa-users'}"></i> ${club.nosclub_roles?.nom || ''}`;

    // Localisation
    document.getElementById('clubAdresse').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${club.quartier || ''}, ${club.ville || ''}`;

    // Statut
    const statutTexte = club.statut === 'actif' ? (nosClubsT('fiche.statut_actif') || 'Actif (Enregistré HubISoccer)') : (nosClubsT('fiche.statut_archive') || 'Archivé');
    document.getElementById('clubStatut').innerHTML = `<i class="fas fa-check-circle"></i> ${statutTexte}`;

    // Effectif
    document.getElementById('clubEffectif').innerHTML = `<i class="fas fa-users"></i> ${quotaUtilise} / ${quotaMax} ${nosClubsT('fiche.membres') || 'membres'}`;

    // Ambiance
    document.getElementById('clubAmbiance').innerHTML = club.ambiance ? `<i class="fas fa-fire"></i> ${escapeHtml(club.ambiance)}` : '';

    // Parrain
    document.getElementById('clubParrainNom').innerHTML = club.parrain_nom ? `<strong><i class="fas fa-hands-helping"></i> ${escapeHtml(club.parrain_nom)}</strong>` : '';
    document.getElementById('clubParrainCitation').innerHTML = club.parrain_citation ? `« ${escapeHtml(club.parrain_citation)} »` : '';
    document.getElementById('clubParrainContact').innerHTML = club.parrain_contact ? `<i class="fas fa-phone-alt"></i> <a href="https://wa.me/${club.parrain_contact.replace(/[^0-9]/g, '')}" target="_blank">${escapeHtml(club.parrain_contact)}</a>` : '';

    // Coach
    document.getElementById('clubCoachNom').innerHTML = club.coach_nom ? `<strong><i class="fas fa-user-tie"></i> ${escapeHtml(club.coach_nom)}</strong>` : '';
    document.getElementById('clubCoachContact').innerHTML = club.coach_contact ? `<i class="fas fa-phone-alt"></i> ${escapeHtml(club.coach_contact)}` : '';

    // Mission (contenu riche)
    document.getElementById('clubMission').innerHTML = club.mission || '';

    // Engagements (contenu riche)
    document.getElementById('clubEngagements').innerHTML = club.engagements || '';

    // Conclusion
    document.getElementById('clubConclusion').innerHTML = club.conclusion || '';

    // Pré-remplir le formulaire
    document.getElementById('formRole').value = club.nosclub_roles?.nom || '';
    document.getElementById('formClubId').value = club.id;
    document.getElementById('attenteClubId').value = club.id;

    applyNosClubsTranslations();
}

function updateButtons(club) {
    const quotaMax = club.quota_max || 30;
    const quotaUtilise = club.quota_utilise || 0;
    const disponible = quotaMax - quotaUtilise;

    const btnPostuler = document.getElementById('btnPostuler');
    const btnAttente = document.getElementById('btnAttente');

    if (disponible > 0) {
        btnPostuler.style.display = 'inline-block';
        btnAttente.style.display = 'none';
    } else {
        btnPostuler.style.display = 'none';
        btnAttente.style.display = 'inline-block';
    }
}
// ========== FIN : CHARGEMENT DU CLUB ==========

// ========== DÉBUT : SOUMISSION FORMULAIRE COMPLET ==========
document.getElementById('formulaireInscription').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!uploadedPhotoUrl) {
        showToast(nosClubsT('toast.photo_requise') || 'Veuillez téléverser votre photo d\'identité.', 'warning');
        return;
    }

    const clubId = document.getElementById('formClubId').value;
    const nom = document.getElementById('formNom').value.trim();
    const dateNaissance = document.getElementById('formDateNaissance').value;
    const villeQuartier = document.getElementById('formVilleQuartier').value.trim();
    const telephone = document.getElementById('formTelephone').value.trim();
    const emailReseaux = document.getElementById('formEmailReseaux').value.trim();
    const specialite = document.getElementById('formSpecialite').value.trim();
    const piedMain = document.getElementById('formPiedMain').value;
    const taille = document.getElementById('formTaille').value;
    const poids = document.getElementById('formPoids').value;
    const niveauEtudes = document.getElementById('formNiveauEtudes').value.trim();
    const metierSouhaite = document.getElementById('formMetierSouhaite').value.trim();
    const statutActuel = document.getElementById('formStatutActuel').value;
    const nomClubActuel = document.getElementById('formNomClubActuel').value.trim();
    const contactResponsable = document.getElementById('formContactResponsable').value.trim();

    // Disponibilités
    const disponibilites = {};
    document.querySelectorAll('.dispo-check:checked').forEach(cb => {
        const day = cb.dataset.day;
        const slot = cb.dataset.slot;
        if (!disponibilites[day]) disponibilites[day] = [];
        disponibilites[day].push(slot);
    });

    if (!nom || !dateNaissance || !villeQuartier || !telephone || !specialite) {
        showToast(nosClubsT('toast.champs_obligatoires') || 'Veuillez remplir tous les champs obligatoires.', 'warning');
        return;
    }

    const login = generateLogin(nom);
    const password = generatePassword();

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('nosclub_inscriptions')
            .insert([{
                club_id: clubId,
                nom_complet: nom,
                date_naissance: dateNaissance,
                ville_quartier: villeQuartier,
                telephone: telephone,
                email: emailReseaux || null,
                reseaux_sociaux: emailReseaux || null,
                role_id: currentClub?.discipline_id,
                specialite_poste: specialite,
                pied_main_dominante: piedMain || null,
                taille_cm: taille || null,
                poids_kg: poids || null,
                niveau_etudes: niveauEtudes || null,
                metier_souhaite: metierSouhaite || null,
                statut_actuel: statutActuel,
                nom_club_actuel: statutActuel === 'En club' ? nomClubActuel : null,
                contact_responsable: statutActuel === 'En club' ? contactResponsable : null,
                disponibilites: Object.keys(disponibilites).length > 0 ? disponibilites : null,
                photo_identite_url: uploadedPhotoUrl,
                engagement_financier: true,
                login: login,
                mot_de_passe_hash: hashPassword(password),
                statut: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;

        document.getElementById('successId').textContent = login;
        document.getElementById('successPwd').textContent = password;
        document.getElementById('formulaireModal').classList.remove('active');
        document.getElementById('successModal').classList.add('active');
        document.getElementById('formulaireInscription').reset();
        uploadedPhotoUrl = null;
        document.getElementById('uploadStatusPhoto').style.display = 'none';
        document.getElementById('uploadSuccessPhoto').style.display = 'none';
        document.getElementById('formPhoto').value = '';
        clearFormLocalStorage();
        formModified = false;
    } catch (err) {
        console.error(err);
        showToast((nosClubsT('toast.erreur_inscription') || 'Erreur lors de l\'inscription : ') + err.message, 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : SOUMISSION FORMULAIRE COMPLET ==========

// ========== DÉBUT : SOUMISSION LISTE D'ATTENTE ==========
document.getElementById('formulaireAttente').addEventListener('submit', async (e) => {
    e.preventDefault();

    const clubId = document.getElementById('attenteClubId').value;
    const nom = document.getElementById('attenteNom').value.trim();
    const villeQuartier = document.getElementById('attenteVilleQuartier').value.trim();
    const telephone = document.getElementById('attenteTelephone').value.trim();
    const specialite = document.getElementById('attenteSpecialite').value.trim();
    const niveauEtudes = document.getElementById('attenteNiveauEtudes').value.trim();
    const motivation = document.getElementById('attenteMotivation').value.trim();

    if (!nom || !villeQuartier || !telephone) {
        showToast(nosClubsT('toast.champs_obligatoires') || 'Veuillez remplir les champs obligatoires.', 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('nosclub_attente')
            .insert([{
                club_id: clubId,
                nom_complet: nom,
                ville_quartier: villeQuartier,
                telephone: telephone,
                specialite_poste: specialite || null,
                niveau_etudes: niveauEtudes || null,
                motivation: motivation || null,
                engagement_financier: true,
                statut: 'en_attente',
                created_at: new Date().toISOString()
            }]);
        if (error) throw error;

        document.getElementById('attenteModal').classList.remove('active');
        document.getElementById('formulaireAttente').reset();
        showToast(nosClubsT('toast.attente_succes') || 'Vous avez été inscrit sur la liste d\'attente avec succès.', 'success');
    } catch (err) {
        console.error(err);
        showToast((nosClubsT('toast.erreur_inscription') || 'Erreur lors de l\'inscription sur liste d\'attente : ') + err.message, 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : SOUMISSION LISTE D'ATTENTE ==========

// ========== DÉBUT : OUVERTURE / FERMETURE MODALES ==========
function confirmCloseModal(modal) {
    if (formModified) {
        if (!confirm(nosClubsT('confirm_close') || 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
            return false;
        }
    }
    return true;
}

document.getElementById('btnPostuler').addEventListener('click', () => {
    restoreFormFromLocalStorage();
    document.getElementById('formulaireModal').classList.add('active');
});

document.getElementById('btnAttente').addEventListener('click', () => {
    document.getElementById('attenteModal').classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal && confirmCloseModal(modal)) {
            modal.classList.remove('active');
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (confirmCloseModal(e.target)) {
            e.target.classList.remove('active');
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal && confirmCloseModal(activeModal)) {
            activeModal.classList.remove('active');
        }
    }
});
// ========== FIN : OUVERTURE / FERMETURE MODALES ==========

// ========== DÉBUT : COPIE DES IDENTIFIANTS ==========
document.getElementById('copyIdsBtn').addEventListener('click', () => {
    const id = document.getElementById('successId').textContent;
    const pwd = document.getElementById('successPwd').textContent;
    const texte = `Identifiant: ${id}\nMot de passe: ${pwd}`;

    navigator.clipboard.writeText(texte).then(() => {
        showToast(nosClubsT('toast.copie_succes') || 'Identifiants copiés dans le presse-papiers !', 'success');
    }).catch(() => {
        showToast(nosClubsT('toast.erreur_copie') || 'Erreur lors de la copie.', 'error');
    });
});
// ========== FIN : COPIE DES IDENTIFIANTS ==========

// ========== DÉBUT : CHAMP STATUT ACTUEL DYNAMIQUE ==========
document.getElementById('formStatutActuel').addEventListener('change', function() {
    const groupe = document.getElementById('groupeClubActuel');
    if (this.value === 'En club') {
        groupe.style.display = 'block';
    } else {
        groupe.style.display = 'none';
    }
});
// ========== FIN : CHAMP STATUT ACTUEL DYNAMIQUE ==========

// ========== DÉBUT : TRADUCTIONS ==========
function applyNosClubsTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = nosClubsT(key);
            } else {
                el.innerHTML = nosClubsT(key);
            }
        }
    });
    document.querySelectorAll('select option[data-i18n]').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = nosClubsT(key);
    });
}

const langSelect = document.getElementById('langSelect');
if (langSelect) {
    langSelect.value = nosClubsCurrentLang;
    langSelect.addEventListener('change', (e) => {
        nosClubsSetLanguage(e.target.value);
        applyNosClubsTranslations();
        if (currentClub) displayClub(currentClub);
    });
}
// ========== FIN : TRADUCTIONS ==========

// ========== DÉBUT : MENU MOBILE ==========
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
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyNosClubsTranslations();
    loadClub();
    setupPhotoUpload();
    setupAutoSave();
});
// ========== FIN DE FICHE-CLUB.JS ==========