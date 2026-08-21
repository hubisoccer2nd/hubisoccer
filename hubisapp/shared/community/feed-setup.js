// ============================================================
//  HUBISOCCER — FEED-SETUP.JS (VERSION CORRIGÉE – PATCH 400)
// ============================================================
//  Correction : suppression des colonnes msg_id, svtr_id, gt_id
//  de la mise à jour du profil (elles n'existent pas dans profiles).
// ============================================================

'use strict';

// ========== DEBUT : VARIABLES GLOBALES ==========
let currentStep    = 1;
let handleValid    = false;
let handleTimer    = null;
let avatarFile     = null;
let coverFile      = null;
let avatarPreviewUrl = null;   // URL objet de l'apercu avatar (a liberer)
let coverPreviewUrl  = null;   // URL objet de l'apercu couverture (a liberer)
let selectedSport  = '';
let selectedPrivacy = 'public';

// Liste des sports (inchangée)
const SPORTS = [
    { id:'football', label:'Football', emoji:'⚽' },
    { id:'basketball', label:'Basketball', emoji:'🏀' },
    { id:'tennis', label:'Tennis', emoji:'🎾' },
    { id:'athletisme', label:'Athlétisme', emoji:'🏃' },
    { id:'handball', label:'Handball', emoji:'🤾' },
    { id:'volleyball', label:'Volleyball', emoji:'🏐' },
    { id:'rugby', label:'Rugby', emoji:'🏉' },
    { id:'natation', label:'Natation', emoji:'🏊' },
    { id:'arts_martiaux', label:'Arts martiaux', emoji:'🥋' },
    { id:'cyclisme', label:'Cyclisme', emoji:'🚴' },
    { id:'chanteur', label:'Chanteur', emoji:'🎤' },
    { id:'danseur', label:'Danseur', emoji:'💃' },
    { id:'compositeur', label:'Compositeur', emoji:'🎼' },
    { id:'acteur_cinema', label:'Acteur cinéma', emoji:'🎬' },
    { id:'acteur_theatre', label:'Acteur théâtre', emoji:'🎭' },
    { id:'humoriste', label:'Humoriste', emoji:'🎙️' },
    { id:'slameur', label:'Slameur', emoji:'🗣️' },
    { id:'dj', label:'DJ / Producteur', emoji:'🎧' },
    { id:'cirque', label:'Artiste de cirque', emoji:'🤹' },
    { id:'artiste_visuel', label:'Artiste visuel', emoji:'🎨' },
    { id:'parrain', label:'Parrain', emoji:'🤝' },
    { id:'agent_fifa', label:'Agent FIFA', emoji:'💼' },
    { id:'coach', label:'Coach', emoji:'📋' },
    { id:'staff_medical', label:'Staff médical', emoji:'⚕️' },
    { id:'corps_arbitral', label:'Corps arbitral', emoji:'🏁' },
    { id:'academie', label:'Académie sportive', emoji:'🏫' },
    { id:'formateur', label:'Formateur', emoji:'🎓' },
    { id:'gestionnaire_tournoi', label:'Gestionnaire tournoi', emoji:'🏆' }
];

// Liste des pays (inchangée)
const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'ZA', name: 'Afrique du Sud' },
    { code: 'AL', name: 'Albanie' },
    { code: 'DZ', name: 'Algérie' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'AD', name: 'Andorre' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua-et-Barbuda' },
    { code: 'SA', name: 'Arabie saoudite' },
    { code: 'AR', name: 'Argentine' },
    { code: 'AM', name: 'Arménie' },
    { code: 'AU', name: 'Australie' },
    { code: 'AT', name: 'Autriche' },
    { code: 'AZ', name: 'Azerbaïdjan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahreïn' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbade' },
    { code: 'BE', name: 'Belgique' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Bénin' },
    { code: 'BT', name: 'Bhoutan' },
    { code: 'BY', name: 'Biélorussie' },
    { code: 'MM', name: 'Birmanie' },
    { code: 'BO', name: 'Bolivie' },
    { code: 'BA', name: 'Bosnie-Herzégovine' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brésil' },
    { code: 'BN', name: 'Brunéi' },
    { code: 'BG', name: 'Bulgarie' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodge' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cap-Vert' },
    { code: 'CL', name: 'Chili' },
    { code: 'CN', name: 'Chine' },
    { code: 'CY', name: 'Chypre' },
    { code: 'CO', name: 'Colombie' },
    { code: 'KM', name: 'Comores' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Rép. dém. du Congo' },
    { code: 'KR', name: 'Corée du Sud' },
    { code: 'KP', name: 'Corée du Nord' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'HR', name: 'Croatie' },
    { code: 'CU', name: 'Cuba' },
    { code: 'DK', name: 'Danemark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DO', name: 'République dominicaine' },
    { code: 'EG', name: 'Égypte' },
    { code: 'AE', name: 'Émirats arabes unis' },
    { code: 'EC', name: 'Équateur' },
    { code: 'ER', name: 'Érythrée' },
    { code: 'ES', name: 'Espagne' },
    { code: 'EE', name: 'Estonie' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'US', name: 'États-Unis' },
    { code: 'ET', name: 'Éthiopie' },
    { code: 'FJ', name: 'Fidji' },
    { code: 'FI', name: 'Finlande' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambie' },
    { code: 'GE', name: 'Géorgie' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Grèce' },
    { code: 'GD', name: 'Grenade' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinée' },
    { code: 'GW', name: 'Guinée-Bissau' },
    { code: 'GQ', name: 'Guinée équatoriale' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haïti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hongrie' },
    { code: 'IN', name: 'Inde' },
    { code: 'ID', name: 'Indonésie' },
    { code: 'IQ', name: 'Irak' },
    { code: 'IR', name: 'Iran' },
    { code: 'IE', name: 'Irlande' },
    { code: 'IS', name: 'Islande' },
    { code: 'IL', name: 'Israël' },
    { code: 'IT', name: 'Italie' },
    { code: 'JM', name: 'Jamaïque' },
    { code: 'JP', name: 'Japon' },
    { code: 'JO', name: 'Jordanie' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KG', name: 'Kirghizistan' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Koweït' },
    { code: 'LA', name: 'Laos' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LV', name: 'Lettonie' },
    { code: 'LB', name: 'Liban' },
    { code: 'LR', name: 'Libéria' },
    { code: 'LY', name: 'Libye' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lituanie' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MK', name: 'Macédoine du Nord' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MY', name: 'Malaisie' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malte' },
    { code: 'MA', name: 'Maroc' },
    { code: 'MH', name: 'Îles Marshall' },
    { code: 'MU', name: 'Maurice' },
    { code: 'MR', name: 'Mauritanie' },
    { code: 'MX', name: 'Mexique' },
    { code: 'FM', name: 'Micronésie' },
    { code: 'MD', name: 'Moldavie' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolie' },
    { code: 'ME', name: 'Monténégro' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'NA', name: 'Namibie' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Népal' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigéria' },
    { code: 'NO', name: 'Norvège' },
    { code: 'NZ', name: 'Nouvelle-Zélande' },
    { code: 'OM', name: 'Oman' },
    { code: 'UG', name: 'Ouganda' },
    { code: 'UZ', name: 'Ouzbékistan' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palaos' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papouasie-Nouvelle-Guinée' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'NL', name: 'Pays-Bas' },
    { code: 'PE', name: 'Pérou' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Pologne' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'CF', name: 'République centrafricaine' },
    { code: 'CZ', name: 'Tchéquie' },
    { code: 'RO', name: 'Roumanie' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'RU', name: 'Russie' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint-Christophe-et-Niévès' },
    { code: 'LC', name: 'Sainte-Lucie' },
    { code: 'SM', name: 'Saint-Marin' },
    { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines' },
    { code: 'SB', name: 'Îles Salomon' },
    { code: 'SV', name: 'Salvador' },
    { code: 'WS', name: 'Samoa' },
    { code: 'ST', name: 'Sao Tomé-et-Principe' },
    { code: 'SN', name: 'Sénégal' },
    { code: 'RS', name: 'Serbie' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapour' },
    { code: 'SK', name: 'Slovaquie' },
    { code: 'SI', name: 'Slovénie' },
    { code: 'SO', name: 'Somalie' },
    { code: 'SD', name: 'Soudan' },
    { code: 'SS', name: 'Soudan du Sud' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SE', name: 'Suède' },
    { code: 'CH', name: 'Suisse' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SY', name: 'Syrie' },
    { code: 'TJ', name: 'Tadjikistan' },
    { code: 'TZ', name: 'Tanzanie' },
    { code: 'TD', name: 'Tchad' },
    { code: 'TH', name: 'Thaïlande' },
    { code: 'TL', name: 'Timor oriental' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinité-et-Tobago' },
    { code: 'TN', name: 'Tunisie' },
    { code: 'TM', name: 'Turkménistan' },
    { code: 'TR', name: 'Turquie' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Viêt Nam' },
    { code: 'YE', name: 'Yémen' },
    { code: 'ZM', name: 'Zambie' },
    { code: 'ZW', name: 'Zimbabwe' }
];
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DEBUT : FONCTION DE HACHAGE PURE JS (cyrb53) ==========
/**
 * Fonction de hachage simple et rapide (non cryptographique)
 * Retourne une chaîne hexadécimale de 64 caractères
 * @param {string} str - Chaîne à hacher
 * @param {number} seed - Graine (optionnel)
 * @returns {string} Hash hexadécimal 64 bits
 */
function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    // Retourne un hash 64 bits sous forme hexadécimale (16 caractères)
    return (h2>>>0).toString(16).padStart(8, '0') + (h1>>>0).toString(16).padStart(8, '0');
}

/**
 * Génère les identifiants sociaux à partir du feed_id et du hubisoccer_id
 * Remplace l'ancienne méthode crypto.subtle
 */
function generateSocialIds(feedId) {
    const uid = currentProfile.hubisoccer_id;
    // On combine les deux identifiants
    const combined = feedId + ':' + uid;
    // On génère un hash 64 bits, puis on l'étend en répétant pour obtenir 32+16+16 = 64 caractères
    const hash64 = cyrb53(combined);
    // Pour obtenir plus de longueur, on hache le hash avec une graine différente
    const hash2 = cyrb53(combined, 1);
    const hash3 = cyrb53(combined, 2);

    // Construction des IDs :
    // msg_id : 32 caractères = hash64 (16) + première moitié de hash2 (8) + deuxième moitié de hash3 (8)
    const msg_id = 'msg_' + (hash64 + hash2.substring(0,8) + hash3.substring(8,16)).substring(0,32);
    // svtr_id : 16 caractères = première moitié de hash2 + première moitié de hash3
    const svtr_id = 'svtr_' + (hash2.substring(0,8) + hash3.substring(0,8));
    // gt_id : 16 caractères = deuxième moitié de hash64 + deuxième moitié de hash2
    const gt_id = 'gt_' + (hash64.substring(8,16) + hash2.substring(8,16));

    return {
        feed_id: feedId,
        msg_id: msg_id,
        svtr_id: svtr_id,
        gt_id: gt_id
    };
}
// ========== FIN : FONCTION DE HACHAGE PURE JS ==========

// ========== DEBUT : FONCTIONS DE GESTION DE LA PAGE ==========
async function checkExistingCommunity() {
    setLoader(true, 'Vérification de ta communauté...', 75);
    const { data } = await sb
        .from('supabaseAuthPrive_communities')
        .select('id, feed_id')
        .eq('hubisoccer_id', currentProfile.hubisoccer_id)
        .maybeSingle();
    setLoader(false);
    if (data) {
        window.location.href = 'feed.html';
    }
}

function populateCountries() {
    const sel = document.getElementById('communityCountry');
    COUNTRIES.forEach(c => {
        const o = document.createElement('option');
        o.value = c.code;
        o.textContent = c.name;
        sel.appendChild(o);
    });
}

function buildSportGrid() {
    const grid = document.getElementById('sportGrid');
    grid.innerHTML = SPORTS.map(s => `
        <button class="sport-btn" data-sport="${s.id}" type="button">
            <span class="sport-emoji">${s.emoji}</span>
            <span>${s.label}</span>
        </button>
    `).join('');
    grid.querySelectorAll('.sport-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSport = btn.dataset.sport;
            document.getElementById('selectedSport').value = selectedSport;
        });
    });
}

// Identifiants réservés au système ou trompeurs
const RESERVED_HANDLES = [
    'admin', 'administrateur', 'hubisoccer', 'hubis', 'hubisapp', 'support',
    'officiel', 'official', 'moderateur', 'moderator', 'staff', 'help', 'aide',
    'contact', 'root', 'system', 'systeme', 'api', 'www', 'null', 'undefined',
    'test', 'fifa', 'caf', 'uefa'
];

function validateHandleFormat(handle) {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) return false;
    // Un identifiant uniquement numérique se confondrait avec un ID interne
    if (/^\d+$/.test(handle)) return false;
    return true;
}

function isReservedHandle(handle) {
    return RESERVED_HANDLES.includes(String(handle).toLowerCase());
}

async function checkHandleAvailability(handle) {
    const el = document.getElementById('handleCheck');
    el.innerHTML = '<i class="fas fa-spinner fa-spin checking"></i>';
    el.className = 'id-check checking';

    if (!validateHandleFormat(handle)) {
        el.innerHTML = '<i class="fas fa-times"></i>';
        el.className = 'id-check invalid';
        handleValid = false;
        return;
    }

    if (isReservedHandle(handle)) {
        el.innerHTML = '<i class="fas fa-times"></i>';
        el.className = 'id-check invalid';
        handleValid = false;
        toast('Cet identifiant est réservé', 'warning');
        return;
    }

    const { data } = await sb
        .from('supabaseAuthPrive_communities')
        .select('id').eq('feed_id', handle.toLowerCase()).maybeSingle();

    if (data) {
        el.innerHTML = '<i class="fas fa-times"></i>';
        el.className = 'id-check invalid';
        handleValid = false;
        toast('Cet identifiant est déjà pris', 'warning');
    } else {
        el.innerHTML = '<i class="fas fa-check"></i>';
        el.className = 'id-check valid';
        handleValid = true;
    }
}

function goToStep(n) {
    document.querySelectorAll('.setup-step-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step${n}`).classList.remove('hidden');

    document.querySelectorAll('.step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s < n) el.classList.add('done');
        else if (s === n) el.classList.add('active');
    });
    document.querySelectorAll('.step-line').forEach((el, i) => {
        el.classList.toggle('done', i < n - 1);
    });

    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
    const name = document.getElementById('communityName').value.trim();
    const handle = document.getElementById('communityHandle').value.trim();
    const bio = document.getElementById('communityBio').value.trim();
    const country = document.getElementById('communityCountry').value;

    if (!name) { toast('Entre le nom de ta communauté', 'warning'); return false; }
    if (!handle || !handleValid) { toast('Choisis un identifiant valide et disponible', 'warning'); return false; }
    if (!bio) { toast('Ajoute une bio', 'warning'); return false; }
    if (!country) { toast('Sélectionne ton pays', 'warning'); return false; }
    return true;
}

function validateStep2() {
    if (!avatarFile) { toast('Ajoute une photo de profil', 'warning'); return false; }
    if (!coverFile)  { toast('Ajoute une photo de couverture', 'warning'); return false; }
    return true;
}

function validateStep3() {
    if (!selectedSport) { toast('Sélectionne ton sport principal', 'warning'); return false; }
    return true;
}

async function uploadFile(file, bucket, path) {
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

function buildRecap() {
    const name   = document.getElementById('communityName').value.trim();
    const handle = document.getElementById('communityHandle').value.trim().toLowerCase();
    const bio    = document.getElementById('communityBio').value.trim();
    const countrySelect = document.getElementById('communityCountry');
    const countryCode = countrySelect.value;
    const countryName = countrySelect.options[countrySelect.selectedIndex]?.text || countryCode;
    const lang   = document.getElementById('communityLang').value;
    const sport  = SPORTS.find(s => s.id === selectedSport);

    // On reutilise les URL d'apercu deja creees a l'etape 2 au lieu
    // d'en fabriquer de nouvelles a chaque affichage du recapitulatif :
    // sans cela, chaque aller-retour entre les etapes laissait une URL
    // objet non liberee en memoire.
    const avatarUrl = avatarPreviewUrl || (avatarFile ? URL.createObjectURL(avatarFile) : '');
    const coverUrl  = coverPreviewUrl  || (coverFile  ? URL.createObjectURL(coverFile)  : '');

    document.getElementById('recapCard').innerHTML = `
        <div class="recap-row">
            <span class="recap-label">Photo de profil</span>
            <span class="recap-value">${avatarUrl ? `<img class="recap-avatar" src="${escapeAttr(avatarUrl)}" alt="">` : '—'}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Couverture</span>
            <span class="recap-value">${coverUrl ? `<img class="recap-cover-thumb" src="${escapeAttr(coverUrl)}" alt="">` : '—'}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Nom</span>
            <span class="recap-value">${escapeHtml(name)}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Identifiant HubiS</span>
            <span class="recap-value" style="color:var(--primary);font-family:monospace">@${escapeHtml(handle)}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Bio</span>
            <span class="recap-value">${escapeHtml(bio.substring(0,80))}${bio.length>80?'...':''}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Pays</span>
            <span class="recap-value">${escapeHtml(countryName)}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Sport</span>
            <span class="recap-value">${sport ? sport.emoji+' '+sport.label : '—'}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Confidentialité</span>
            <span class="recap-value">${selectedPrivacy === 'public' ? '🌍 Publique' : selectedPrivacy === 'followers' ? '👥 Abonnés' : '🔒 Privée'}</span>
        </div>
    `;
}

async function createCommunity() {
    const btn = document.getElementById('createCommunityBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
    setLoader(true, 'Envoi des images...', 30);

    try {
        const uid = currentProfile.hubisoccer_id;
        const handle = document.getElementById('communityHandle').value.trim().toLowerCase();
        const name = document.getElementById('communityName').value.trim();
        const bio = document.getElementById('communityBio').value.trim();
        const country = document.getElementById('communityCountry').value;
        const lang = document.getElementById('communityLang').value;
        const specialty = document.getElementById('communitySpecialty').value.trim();
        const website = document.getElementById('communityWebsite').value.trim();

        // Dernière vérification : l'identifiant peut avoir été pris entre-temps
        const { data: taken } = await sb.from('supabaseAuthPrive_communities')
            .select('id').eq('feed_id', handle).maybeSingle();
        if (taken) {
            toast('Cet identifiant vient d\'être pris. Choisissez-en un autre.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-rocket"></i> Lancer ma communauté';
            setLoader(false);
            return;
        }

        const socialIds = generateSocialIds(handle);

        setLoader(true, 'Upload de la photo de profil...', 50);
        const avatarExt = avatarFile.name.split('.').pop();
        const avatarPath = `communities/${uid}/avatar_${Date.now()}.${avatarExt}`;
        const avatarUrl = await uploadFile(avatarFile, 'feed_avatars', avatarPath);

        setLoader(true, 'Upload de la photo de couverture...', 70);
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `communities/${uid}/cover_${Date.now()}.${coverExt}`;
        const coverUrl = await uploadFile(coverFile, 'feed_avatars', coverPath);

        setLoader(true, 'Création de ta communauté dans la base...', 85);
        const { error: commErr } = await sb.from('supabaseAuthPrive_communities').insert({
            hubisoccer_id: uid,
            feed_id: handle,
            msg_id: socialIds.msg_id,
            svtr_id: socialIds.svtr_id,
            gt_id: socialIds.gt_id,
            name, bio, sport: selectedSport, specialty, website,
            country, lang, privacy: selectedPrivacy,
            avatar_url: avatarUrl, cover_url: coverUrl,
            followers_count: 0, following_count: 0, posts_count: 0
        });

        if (commErr) {
            if (commErr.code === '23505') {
                toast('Cet identifiant est déjà pris. Choisis-en un autre.', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rocket"></i> Lancer ma communauté';
                setLoader(false);
                return;
            }
            throw commErr;
        }

        setLoader(true, 'Mise à jour de ton profil...', 95);
        // CORRECTION : On ne met plus à jour msg_id, svtr_id, gt_id
        // car ces colonnes n'existent pas dans supabaseAuthPrive_profiles
        await sb.from('supabaseAuthPrive_profiles').update({
            feed_id: handle,
            community_avatar: avatarUrl,
            community_cover: coverUrl
        }).eq('hubisoccer_id', uid);

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rocket"></i> Lancer ma communauté';
        setLoader(false);

        document.getElementById('setupCard').classList.add('hidden');
        document.getElementById('setupSteps').classList.add('hidden');
        document.querySelector('.setup-hero').classList.add('hidden');
        document.getElementById('successId').textContent = `@${handle}`;
        document.getElementById('setupSuccess').classList.remove('hidden');

    } catch (err) {
        console.error('Erreur création communauté:', err);
        toast('Une erreur est survenue : ' + err.message, 'error');
        setLoader(false);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rocket"></i> Lancer ma communauté';
    }
}

// ========== DEBUT : INITIALISATION ==========
//
// Regle de securite appliquee ici :
// chaque bloc de branchement est isole dans wire(). Si un element
// manque dans le HTML, on ecrit un avertissement dans la console et
// on CONTINUE. Auparavant, une seule erreur dans init() interrompait
// tout ce qui suivait et la page restait bloquee sur le loader.
//
function wire(label, fn) {
    try {
        fn();
    } catch (err) {
        console.warn('[feed-setup] branchement "' + label + '" ignore :', err.message);
    }
}

async function init() {
    setLoader(true, 'Vérification de votre session...', 20);

    const auth = await requireAuth();
    if (!auth) return;

    setLoader(true, 'Vérification de ta communauté...', 50);
    try {
        await checkExistingCommunity();
    } catch (err) {
        console.warn('[feed-setup] verification de communaute impossible :', err.message);
    }

    wire('listes pays et sports', () => {
        populateCountries();
        buildSportGrid();
    });

    // ---------- En-tete : identite de l'utilisateur ----------
    wire('identite utilisateur', () => {
        const nameEl = document.getElementById('userName');
        if (nameEl) {
            nameEl.textContent = currentProfile.full_name
                || currentProfile.display_name
                || 'Utilisateur';
        }
        updateAvatarDisplay(
            currentProfile.avatar_url,
            currentProfile.full_name || currentProfile.display_name
        );
    });

    // ---------- Etape 1 : identite de la communaute ----------
    wire('compteur de bio', () => {
        const bioInput = document.getElementById('communityBio');
        const bioCount = document.getElementById('bioCount');
        if (!bioInput || !bioCount) return;
        bioInput.addEventListener('input', () => {
            bioCount.textContent = bioInput.value.length;
        });
    });

    wire('identifiant de communaute', () => {
        const handleInput = document.getElementById('communityHandle');
        if (!handleInput) return;
        handleInput.addEventListener('input', (e) => {
            clearTimeout(handleTimer);
            const val = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            e.target.value = val;

            // Apercu en direct
            const prev = document.getElementById('previewHandle');
            if (prev) prev.textContent = '@' + (val || 'identifiant');

            if (val.length >= 3) {
                handleTimer = setTimeout(() => checkHandleAvailability(val), 600);
            } else {
                const check = document.getElementById('handleCheck');
                if (check) check.innerHTML = '';
                handleValid = false;
            }
        });
    });

    wire('apercu du nom', () => {
        const nameInput = document.getElementById('communityName');
        const prevName  = document.getElementById('previewName');
        if (!nameInput || !prevName) return;
        nameInput.addEventListener('input', (e) => {
            prevName.textContent = e.target.value || 'Nom de ta communauté';
        });
    });

    // ---------- Etape 2 : visuels ----------
    wire('photo de profil', () => {
        const picker = document.getElementById('avatarPicker');
        const input  = document.getElementById('avatarInput');
        if (!picker || !input) return;

        picker.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!/^image\//.test(file.type)) {
                toast('Ce fichier n\'est pas une image.', 'error');
                input.value = '';
                return;
            }
            if (file.size > 800 * 1024) {
                toast('Image trop lourde (max 800 Ko)', 'warning');
                input.value = '';
                return;
            }
            avatarFile = file;

            // On libere l'URL precedente pour ne pas fuir de memoire
            if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
            avatarPreviewUrl = URL.createObjectURL(file);

            const prevBox = document.getElementById('avatarPreview');
            if (prevBox) prevBox.innerHTML = '<img src="' + escapeAttr(avatarPreviewUrl) + '" alt="">';
            const prevCard = document.getElementById('previewAvatarEl');
            if (prevCard) prevCard.innerHTML = '<img src="' + escapeAttr(avatarPreviewUrl) + '" alt="">';
        });
    });

    wire('photo de couverture', () => {
        const picker = document.getElementById('coverPicker');
        const input  = document.getElementById('coverInput');
        if (!picker || !input) return;

        picker.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!/^image\//.test(file.type)) {
                toast('Ce fichier n\'est pas une image.', 'error');
                input.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast('Image trop lourde (max 2 Mo)', 'warning');
                input.value = '';
                return;
            }
            coverFile = file;

            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            coverPreviewUrl = URL.createObjectURL(file);

            const prevBox = document.getElementById('coverPreview');
            if (prevBox) prevBox.innerHTML = '<img src="' + escapeAttr(coverPreviewUrl) + '" alt="">';
            const prevBg = document.getElementById('previewCoverBg');
            if (prevBg) prevBg.style.backgroundImage = 'url("' + coverPreviewUrl + '")';
        });
    });

    // ---------- Etape 3 : confidentialite ----------
    wire('choix de confidentialite', () => {
        document.querySelectorAll('.privacy-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.privacy-option')
                    .forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const radio = opt.querySelector('input');
                if (radio) radio.checked = true;
                selectedPrivacy = opt.dataset.value || 'public';
            });
        });
    });

    // ---------- Navigation entre les etapes ----------
    wire('navigation des etapes', () => {
        const on = (id, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', handler);
        };
        on('step1Next', () => { if (validateStep1()) goToStep(2); });
        on('step2Back', () => goToStep(1));
        on('step2Next', () => { if (validateStep2()) goToStep(3); });
        on('step3Back', () => goToStep(2));
        on('step3Next', () => { if (validateStep3()) { buildRecap(); goToStep(4); } });
        on('step4Back', () => goToStep(3));
    });

    // ---------- Etape 4 : conditions et creation ----------
    wire('acceptation des conditions', () => {
        const terms = document.getElementById('termsAccept');
        const create = document.getElementById('createCommunityBtn');
        if (!terms || !create) return;
        terms.addEventListener('change', (e) => {
            create.disabled = !e.target.checked;
        });
        create.addEventListener('click', createCommunity);
    });

    wire('acces au fil apres creation', () => {
        const go = document.getElementById('goToCommunityBtn');
        if (go) go.addEventListener('click', () => { window.location.href = 'feed.html'; });
    });

    // ---------- Menu utilisateur ----------
    wire('menu utilisateur', () => {
        const menu = document.getElementById('userMenu');
        const drop = document.getElementById('userDropdown');
        if (menu && drop) {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
                drop.classList.toggle('show');
            });
            document.addEventListener('click', () => drop.classList.remove('show'));
        }
        const out = document.getElementById('dropLogout');
        if (out) out.addEventListener('click', logout);
    });

    // ========== DEBUT : LIENS VERS L'ESPACE PRIVE DU ROLE ==========
    // La table locale qui se trouvait ici pointait vers des dossiers
    // inexistants (agent_fifa, academie_sportive, tennisman...) et son
    // repli '../../index.html' n'existe pas non plus : chaque clic
    // renvoyait une erreur 404.
    // Tout est desormais centralise dans role-nav.js, verifie contre
    // l'arborescence reelle du depot.
    // applyRoleLinks() met a jour d'un coup :
    //   - le logo de la navbar        (id navLogo)
    //   - l'entree du menu deroulant  (id dropDashboard)
    //   - le bouton de retour         (id backToSpace)
    //   - le libelle du role          (id roleLabel)
    wire('liens vers l\'espace prive', () => {
        if (typeof applyRoleLinks === 'function') {
            applyRoleLinks(currentProfile.role_code);
            return;
        }
        // Repli defensif si role-nav.js n'a pas ete charge : on envoie
        // vers la page « en construction », jamais vers un 404.
        const fallback = '../construction.html';
        const dd = document.getElementById('dropDashboard');
        if (dd) dd.href = fallback;
        const bs = document.getElementById('backToSpace');
        if (bs) bs.href = fallback;
        const nl = document.getElementById('navLogo');
        if (nl) nl.onclick = () => { window.location.href = fallback; };
        console.warn('[feed-setup] role-nav.js absent : navigation de repli utilisee.');
    });
    // ========== FIN : LIENS VERS L'ESPACE PRIVE DU ROLE ==========

    setLoader(false);
}
// ========== FIN : INITIALISATION ==========

function updateAvatarDisplay(avatarUrl, fullName) {
    const userAvatar = document.getElementById('userAvatar');
    if (!userAvatar) return;
    const initials = fullName ? getInitials(fullName) : '?';
    if (avatarUrl && avatarUrl !== '') {
        userAvatar.src = avatarUrl;
        userAvatar.style.display = 'block';
        const parent = userAvatar.parentElement;
        const initialsEl = parent.querySelector('.c-user-avatar-initials');
        if (initialsEl) initialsEl.style.display = 'none';
    } else {
        userAvatar.style.display = 'none';
        const parent = userAvatar.parentElement;
        let initialsEl = parent.querySelector('.c-user-avatar-initials');
        if (!initialsEl) {
            initialsEl = document.createElement('div');
            initialsEl.className = 'c-user-avatar-initials';
            parent.appendChild(initialsEl);
        }
        initialsEl.style.display = 'flex';
        initialsEl.textContent = initials;
    }
}

document.addEventListener('DOMContentLoaded', init);
// ========== FIN : FICHIER FEED-SETUP.JS ==========