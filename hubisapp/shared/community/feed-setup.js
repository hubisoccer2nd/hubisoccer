// ============================================================
//  HUBISOCCER — FEED-SETUP.JS
//  Création de la HubiS Community — CORRIGÉ
// ============================================================

'use strict';

// Début configuration Supabase
const SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb;
// Fin configuration Supabase

// Début état global
let currentUser    = null;
let currentProfile = null;
let currentStep    = 1;
let handleValid    = false;
let handleTimer    = null;
let avatarFile     = null;
let coverFile      = null;
let selectedSport  = '';
let selectedPrivacy = 'public';
// Fin état global

// Début configuration sports (28 rôles)
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
// Fin configuration sports

// Début liste des pays (codes ISO + noms)
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
// Fin liste des pays

// Début fonctions utilitaires
function toast(msg, type='info', dur=10000) {
    const c = document.getElementById('toastContainer');
    const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    c.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideInRight 0.3s reverse'; setTimeout(() => el.remove(), 300); }, dur);
}

function setLoader(show, text='Chargement...', pct=0) {
    const l = document.getElementById('globalLoader');
    if (!l) return;
    l.style.display = show ? 'flex' : 'none';
    document.getElementById('loaderText').textContent = text;
    document.getElementById('loaderBar').style.width = pct + '%';
}

function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
// Fin fonctions utilitaires

// Début session
async function checkSession() {
    setLoader(true, 'Vérification de la session...', 20);
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) { window.location.href = '../../authprive/users/login.html'; return null; }
    currentUser = session.user;
    return currentUser;
}
// Fin session

// Début chargement profil
async function loadProfile() {
    setLoader(true, 'Chargement du profil...', 50);
    const { data, error } = await sb
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error) { toast('Erreur chargement profil', 'error'); return null; }
    currentProfile = data;

    // UI
    document.getElementById('userName').textContent = data.full_name || data.display_name || 'Utilisateur';
    if (data.avatar_url) {
        document.getElementById('userAvatar').src = data.avatar_url;
    } else {
        // Fallback sur initiales (mais nous n'avons pas l'élément, on garde l'image cachée ou on met une icône)
        document.getElementById('userAvatar').style.display = 'none';
    }

    // Configurer le dashboard selon le rôle
    const roleDashboardMap = {
        'FOOT': '../../footballeur/dashboard/foot-dash.html',
        'BASK': '../../basketteur/dashboard/basketteur-dash.html',
        'ADMIN': '../../authprive/admin/admin-dashboard.html'
    };
    const dash = roleDashboardMap[data.role_code] || '../../index.html';
    document.getElementById('dropDashboard').href = dash;
    document.getElementById('navLogo').onclick = () => window.location.href = dash;

    return data;
}
// Fin chargement profil

// Début vérification communauté existante
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
// Fin vérification communauté existante

// Début peuplement UI
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
// Fin peuplement UI

// Début validation handle
function validateHandleFormat(handle) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(handle);
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
// Fin validation handle

// Début génération IDs sociaux
async function generateSocialIds(feedId) {
    const encoder = new TextEncoder();
    const data = encoder.encode(feedId + currentProfile.hubisoccer_id);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return {
        feed_id: feedId,
        msg_id:  'msg_' + hashHex.substring(0, 32),
        svtr_id: 'svtr_' + hashHex.substring(32, 48),
        gt_id:   'gt_' + hashHex.substring(48, 64)
    };
}
// Fin génération IDs sociaux

// Début navigation étapes
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
// Fin navigation étapes

// Début upload fichier
async function uploadFile(file, bucket, path) {
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
// Fin upload fichier

// Début récapitulatif
function buildRecap() {
    const name   = document.getElementById('communityName').value.trim();
    const handle = document.getElementById('communityHandle').value.trim().toLowerCase();
    const bio    = document.getElementById('communityBio').value.trim();
    const countrySelect = document.getElementById('communityCountry');
    const countryCode = countrySelect.value;
    const countryName = countrySelect.options[countrySelect.selectedIndex]?.text || countryCode;
    const lang   = document.getElementById('communityLang').value;
    const sport  = SPORTS.find(s => s.id === selectedSport);

    const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : '';
    const coverUrl  = coverFile  ? URL.createObjectURL(coverFile)  : '';

    document.getElementById('recapCard').innerHTML = `
        <div class="recap-row">
            <span class="recap-label">Photo de profil</span>
            <span class="recap-value">${avatarUrl ? `<img class="recap-avatar" src="${avatarUrl}" alt="">` : '—'}</span>
        </div>
        <div class="recap-row">
            <span class="recap-label">Couverture</span>
            <span class="recap-value">${coverUrl ? `<img class="recap-cover-thumb" src="${coverUrl}" alt="">` : '—'}</span>
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
// Fin récapitulatif

// Début création communauté
async function createCommunity() {
    const btn = document.getElementById('createCommunityBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
    setLoader(true, 'Upload des photos...', 30);

    try {
        const uid = currentProfile.hubisoccer_id;
        const handle = document.getElementById('communityHandle').value.trim().toLowerCase();
        const name = document.getElementById('communityName').value.trim();
        const bio = document.getElementById('communityBio').value.trim();
        const country = document.getElementById('communityCountry').value;
        const lang = document.getElementById('communityLang').value;
        const specialty = document.getElementById('communitySpecialty').value.trim();
        const website = document.getElementById('communityWebsite').value.trim();

        const socialIds = await generateSocialIds(handle);

        setLoader(true, 'Upload photo de profil...', 40);
        const avatarExt = avatarFile.name.split('.').pop();
        const avatarPath = `communities/${uid}/avatar_${Date.now()}.${avatarExt}`;
        const avatarUrl = await uploadFile(avatarFile, 'feed_avatars', avatarPath);

        setLoader(true, 'Upload photo de couverture...', 60);
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `communities/${uid}/cover_${Date.now()}.${coverExt}`;
        const coverUrl = await uploadFile(coverFile, 'feed_avatars', coverPath);

        setLoader(true, 'Création de ta communauté...', 80);
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

        setLoader(true, 'Mise à jour du profil...', 90);
        await sb.from('supabaseAuthPrive_profiles').update({
            feed_id: handle,
            msg_id: socialIds.msg_id,
            svtr_id: socialIds.svtr_id,
            gt_id: socialIds.gt_id,
            community_avatar: avatarUrl,
            community_cover: coverUrl
        }).eq('hubisoccer_id', uid);

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
// Fin création communauté

// Début initialisation
async function init() {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    await checkExistingCommunity();

    populateCountries();
    buildSportGrid();

    document.getElementById('communityBio').addEventListener('input', (e) => {
        document.getElementById('bioCount').textContent = e.target.value.length;
    });

    document.getElementById('communityHandle').addEventListener('input', (e) => {
        clearTimeout(handleTimer);
        let val = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        e.target.value = val;
        if (val.length >= 3) {
            handleTimer = setTimeout(() => checkHandleAvailability(val), 600);
        } else {
            document.getElementById('handleCheck').innerHTML = '';
            handleValid = false;
        }
    });

    document.getElementById('communityName').addEventListener('input', (e) => {
        document.getElementById('previewName').textContent = e.target.value || 'Nom de ta communauté';
    });
    document.getElementById('communityHandle').addEventListener('input', (e) => {
        document.getElementById('previewHandle').textContent = '@' + (e.target.value || 'identifiant');
    });

    document.getElementById('avatarPicker').addEventListener('click', () => avatarInput.click());
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 800 * 1024) { toast('Image trop lourde (max 800 Ko)', 'warning'); return; }
        avatarFile = file;
        const url = URL.createObjectURL(file);
        document.getElementById('avatarPreview').innerHTML = `<img src="${url}" alt="">`;
        document.getElementById('previewAvatarEl').innerHTML = `<img src="${url}" alt="">`;
    });

    document.getElementById('coverPicker').addEventListener('click', () => coverInput.click());
    const coverInput = document.getElementById('coverInput');
    coverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast('Image trop lourde (max 2 Mo)', 'warning'); return; }
        coverFile = file;
        const url = URL.createObjectURL(file);
        document.getElementById('coverPreview').innerHTML = `<img src="${url}" alt="">`;
        document.getElementById('previewCoverBg').style.background = `url(${url}) center/cover`;
    });

    document.querySelectorAll('.privacy-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.privacy-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
            selectedPrivacy = opt.dataset.value;
        });
    });

    document.getElementById('step1Next').addEventListener('click', () => {
        if (validateStep1()) goToStep(2);
    });
    document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
    document.getElementById('step2Next').addEventListener('click', () => {
        if (validateStep2()) goToStep(3);
    });
    document.getElementById('step3Back').addEventListener('click', () => goToStep(2));
    document.getElementById('step3Next').addEventListener('click', () => {
        if (validateStep3()) { buildRecap(); goToStep(4); }
    });
    document.getElementById('step4Back').addEventListener('click', () => goToStep(3));

    document.getElementById('termsAccept').addEventListener('change', (e) => {
        document.getElementById('createCommunityBtn').disabled = !e.target.checked;
    });

    document.getElementById('createCommunityBtn').addEventListener('click', createCommunity);
    document.getElementById('goToCommunityBtn').addEventListener('click', () => {
        window.location.href = 'feed.html';
    });

    document.getElementById('userMenu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', async () => {
        await sb.auth.signOut();
        window.location.href = '../../authprive/users/login.html';
    });
}
// Fin initialisation

document.addEventListener('DOMContentLoaded', init);