// ============================================================
//  HUBISOCCER — FEED-SETUP.JS
//  Création de la HubiS Community — Adapté hubisapp
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

// Début liste des pays (complète)
const COUNTRIES = [
    "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Angola","Argentine","Bénin","Brésil","Burkina Faso",
    "Cameroun","Canada","Côte d'Ivoire","Congo","Égypte","Émirats arabes unis","Espagne","États-Unis","Éthiopie","France",
    "Gabon","Ghana","Guinée","Haïti","Italie","Jamaïque","Kenya","Mali","Maroc","Mauritanie","Mexique","Niger","Nigeria",
    "Portugal","République centrafricaine","République du Congo","Royaume-Uni","Rwanda","Sénégal","Sierra Leone","Togo",
    "Tunisie","Zambie","Zimbabwe"
];
// Fin liste des pays

// Début fonctions utilitaires
function toast(msg, type='info', dur=4000) {
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
    document.getElementById('userAvatar').src = data.avatar_url || '../../img/user-default.jpg';

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
    COUNTRIES.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
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
    const country = document.getElementById('communityCountry').value;
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
            <span class="recap-value">${escapeHtml(country)}</span>
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

        // Génération IDs sociaux
        const socialIds = await generateSocialIds(handle);

        // Upload avatar
        setLoader(true, 'Upload photo de profil...', 40);
        const avatarExt = avatarFile.name.split('.').pop();
        const avatarPath = `communities/${uid}/avatar_${Date.now()}.${avatarExt}`;
        const avatarUrl = await uploadFile(avatarFile, 'feed_avatars', avatarPath);

        // Upload cover
        setLoader(true, 'Upload photo de couverture...', 60);
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `communities/${uid}/cover_${Date.now()}.${coverExt}`;
        const coverUrl = await uploadFile(coverFile, 'feed_avatars', coverPath);

        // Insérer communauté
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

        // Mettre à jour profiles avec les IDs sociaux
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

        // Afficher succès
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

    // Bio char count
    const bioInput = document.getElementById('communityBio');
    bioInput.addEventListener('input', () => {
        document.getElementById('bioCount').textContent = bioInput.value.length;
    });

    // Handle check
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

    // Sync preview
    document.getElementById('communityName').addEventListener('input', (e) => {
        document.getElementById('previewName').textContent = e.target.value || 'Nom de ta communauté';
    });
    document.getElementById('communityHandle').addEventListener('input', (e) => {
        document.getElementById('previewHandle').textContent = '@' + (e.target.value || 'identifiant');
    });

    // Avatar picker
    const avatarPicker = document.getElementById('avatarPicker');
    const avatarInput = document.getElementById('avatarInput');
    avatarPicker.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 800 * 1024) { toast('Image trop lourde (max 800 Ko)', 'warning'); return; }
        avatarFile = file;
        const url = URL.createObjectURL(file);
        document.getElementById('avatarPreview').innerHTML = `<img src="${url}" alt="">`;
        document.getElementById('previewAvatarEl').innerHTML = `<img src="${url}" alt="">`;
    });

    // Cover picker
    const coverPicker = document.getElementById('coverPicker');
    const coverInput = document.getElementById('coverInput');
    coverPicker.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast('Image trop lourde (max 2 Mo)', 'warning'); return; }
        coverFile = file;
        const url = URL.createObjectURL(file);
        document.getElementById('coverPreview').innerHTML = `<img src="${url}" alt="">`;
        document.getElementById('previewCoverBg').style.background = `url(${url}) center/cover`;
    });

    // Privacy options
    document.querySelectorAll('.privacy-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.privacy-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
            selectedPrivacy = opt.dataset.value;
        });
    });

    // Step navigation
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

    // Terms checkbox
    document.getElementById('termsAccept').addEventListener('change', (e) => {
        document.getElementById('createCommunityBtn').disabled = !e.target.checked;
    });

    // Create button
    document.getElementById('createCommunityBtn').addEventListener('click', createCommunity);

    // Go to community after success
    document.getElementById('goToCommunityBtn').addEventListener('click', () => {
        window.location.href = 'feed.html';
    });

    // Navbar dropdown
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
