/* ============================================================
   HubISoccer — academie-dash.js
   Tableau de Bord Académie Sportive · Corps · Âme · Esprit
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles           → partagée (lecture)
   - supabaseAuthPrive_academie_scouting  → cette page (existante)
   - supabaseAuthPrive_academie_athletes  → page "Mes Athlètes"
     (PAS ENCORE CRÉÉE — lue en lecture résiliente : si absente,
     la vitrine et le quota affichent simplement 0/vide)
   - supabaseAuthPrive_academie_formateurs → page "Mes Formateurs"
     (PAS ENCORE CRÉÉE — lecture résiliente)
   - supabaseAuthPrive_academie_compet     → page "Compétitions"
     (PAS ENCORE CRÉÉE — lecture résiliente)
   Chaque lecture future est indépendante et protégée : l'absence
   d'une table ne bloque jamais le reste du tableau de bord.
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const AVATAR_BUCKET     = 'avatars-academie';
const PROFILES_TABLE    = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE    = 'supabaseAuthPrive_academie_scouting';
const ATHLETES_TABLE    = 'supabaseAuthPrive_academie_athletes';   // future page
const FORMATEURS_TABLE  = 'supabaseAuthPrive_academie_formateurs'; // future page
const COMPET_TABLE      = 'supabaseAuthPrive_academie_compet';     // future page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser         = null;
let academieProfile     = null;
let scoutingData         = null;
const QUOTA_TALENTS     = 160; // valeur de secours si talents_limite absent en base

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) { type = 'info'; }
    if (!duration) { duration = 30000; }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (t.parentNode) { t.remove(); } }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = (value !== null && value !== undefined && value !== '') ? value : '—';
    }
}

function escapeHtml(str) {
    if (!str) { return ''; }
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatMoney(v) {
    if (!v || isNaN(v)) { return '—'; }
    const n = Number(v);
    if (n >= 1000000) { return (n / 1000000).toFixed(1) + ' M FCFA'; }
    if (n >= 1000) { return (n / 1000).toFixed(0) + ' K FCFA'; }
    return n.toLocaleString('fr-FR') + ' FCFA';
}

/* "Ancienneté" institutionnelle — remplace le calcul d'âge personnel */
function calculateAnciennete(d) {
    if (!d) { return '—'; }
    const today = new Date();
    const fondation = new Date(d);
    let annees = today.getFullYear() - fondation.getFullYear();
    const m = today.getMonth() - fondation.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < fondation.getDate())) {
        annees--;
    }
    if (annees <= 0) {
        return 'Fondée cette année';
    }
    return annees + (annees > 1 ? ' ans d\'existence' : ' an d\'existence');
}

function getInitials(name) {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function setSkill(id, v) {
    const bar = document.getElementById(id);
    const span = document.getElementById(id + '_value');
    if (bar) { bar.style.width = Math.min(v, 100) + '%'; }
    if (span) { span.textContent = v; }
}

/* ---------- 7. DRAPEAUX (250+ pays) ---------- */
const flagMap = {
    'DZ':'🇩🇿','AO':'🇦🇴','BJ':'🇧🇯','BW':'🇧🇼','BF':'🇧🇫','BI':'🇧🇮','CM':'🇨🇲','CV':'🇨🇻',
    'CF':'🇨🇫','KM':'🇰🇲','CG':'🇨🇬','CD':'🇨🇩','CI':'🇨🇮','DJ':'🇩🇯','EG':'🇪🇬','GQ':'🇬🇶',
    'ER':'🇪🇷','SZ':'🇸🇿','ET':'🇪🇹','GA':'🇬🇦','GM':'🇬🇲','GH':'🇬🇭','GN':'🇬🇳','GW':'🇬🇼',
    'KE':'🇰🇪','LS':'🇱🇸','LR':'🇱🇷','LY':'🇱🇾','MG':'🇲🇬','MW':'🇲🇼','ML':'🇲🇱','MR':'🇲🇷',
    'MU':'🇲🇺','MA':'🇲🇦','MZ':'🇲🇿','NA':'🇳🇦','NE':'🇳🇪','NG':'🇳🇬','RW':'🇷🇼','ST':'🇸🇹',
    'SN':'🇸🇳','SC':'🇸🇨','SL':'🇸🇱','SO':'🇸🇴','ZA':'🇿🇦','SS':'🇸🇸','SD':'🇸🇩','TZ':'🇹🇿',
    'TG':'🇹🇬','TN':'🇹🇳','UG':'🇺🇬','ZM':'🇿🇲','ZW':'🇿🇼',
    'AG':'🇦🇬','AR':'🇦🇷','BS':'🇧🇸','BB':'🇧🇧','BZ':'🇧🇿','BO':'🇧🇴','BR':'🇧🇷','CA':'🇨🇦',
    'CL':'🇨🇱','CO':'🇨🇴','CR':'🇨🇷','CU':'🇨🇺','DM':'🇩🇲','DO':'🇩🇴','EC':'🇪🇨','SV':'🇸🇻',
    'GD':'🇬🇩','GT':'🇬🇹','GY':'🇬🇾','HT':'🇭🇹','HN':'🇭🇳','JM':'🇯🇲','MX':'🇲🇽','NI':'🇳🇮',
    'PA':'🇵🇦','PY':'🇵🇾','PE':'🇵🇪','KN':'🇰🇳','LC':'🇱🇨','VC':'🇻🇨','SR':'🇸🇷','TT':'🇹🇹',
    'US':'🇺🇸','UY':'🇺🇾','VE':'🇻🇪',
    'AL':'🇦🇱','AD':'🇦🇩','AM':'🇦🇲','AT':'🇦🇹','AZ':'🇦🇿','BY':'🇧🇾','BE':'🇧🇪','BA':'🇧🇦',
    'BG':'🇧🇬','HR':'🇭🇷','CY':'🇨🇾','CZ':'🇨🇿','DK':'🇩🇰','EE':'🇪🇪','FI':'🇫🇮','FR':'🇫🇷',
    'GE':'🇬🇪','DE':'🇩🇪','GR':'🇬🇷','HU':'🇭🇺','IS':'🇮🇸','IE':'🇮🇪','IT':'🇮🇹','KZ':'🇰🇿',
    'XK':'🇽🇰','LV':'🇱🇻','LI':'🇱🇮','LT':'🇱🇹','LU':'🇱🇺','MT':'🇲🇹','MD':'🇲🇩','MC':'🇲🇨',
    'ME':'🇲🇪','NL':'🇳🇱','MK':'🇲🇰','NO':'🇳🇴','PL':'🇵🇱','PT':'🇵🇹','RO':'🇷🇴','RU':'🇷🇺',
    'SM':'🇸🇲','RS':'🇷🇸','SK':'🇸🇰','SI':'🇸🇮','ES':'🇪🇸','SE':'🇸🇪','CH':'🇨🇭','TR':'🇹🇷',
    'UA':'🇺🇦','GB':'🇬🇧',
    'AF':'🇦🇫','BH':'🇧🇭','BD':'🇧🇩','BT':'🇧🇹','BN':'🇧🇳','KH':'🇰🇭','CN':'🇨🇳','IN':'🇮🇳',
    'ID':'🇮🇩','IR':'🇮🇷','IQ':'🇮🇶','IL':'🇮🇱','JP':'🇯🇵','JO':'🇯🇴','KW':'🇰🇼','KG':'🇰🇬',
    'LA':'🇱🇦','LB':'🇱🇧','MY':'🇲🇾','MV':'🇲🇻','MN':'🇲🇳','MM':'🇲🇲','NP':'🇳🇵','KP':'🇰🇵',
    'OM':'🇴🇲','PK':'🇵🇰','PH':'🇵🇭','QA':'🇶🇦','SA':'🇸🇦','SG':'🇸🇬','KR':'🇰🇷','LK':'🇱🇰',
    'SY':'🇸🇾','TW':'🇹🇼','TJ':'🇹🇯','TH':'🇹🇭','TL':'🇹🇱','TM':'🇹🇲','AE':'🇦🇪','UZ':'🇺🇿',
    'VN':'🇻🇳','YE':'🇾🇪',
    'AU':'🇦🇺','FJ':'🇫🇯','KI':'🇰🇮','MH':'🇲🇭','FM':'🇫🇲','NR':'🇳🇷','NZ':'🇳🇿','PW':'🇵🇼',
    'PG':'🇵🇬','WS':'🇼🇸','SB':'🇸🇧','TO':'🇹🇴','TV':'🇹🇻','VU':'🇻🇺',
};

/* ---------- 8. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 9. CHARGEMENT PROFIL ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    academieProfile = data;
    document.getElementById('userName').textContent = academieProfile.full_name || 'Académie Sportive';
    return academieProfile;
}

/* ---------- 10. CHARGEMENT DONNÉES ACADÉMIE (existante) ---------- */
async function loadScoutingData() {
    if (!academieProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('academie_id', academieProfile.hubisoccer_id)
        .maybeSingle();
    hideLoader();
    if (error) {
        showToast('Erreur chargement des données', 'error');
        return;
    }
    if (data) {
        scoutingData = data;
    } else {
        const { data: nd, error: ie } = await supabaseClient
            .from(SCOUTING_TABLE)
            .insert([{ academie_id: academieProfile.hubisoccer_id }])
            .select()
            .single();
        if (ie) {
            showToast('Erreur initialisation', 'error');
            return;
        }
        scoutingData = nd;
    }
    updateProfileUI();
    updateDataUI();
}

/* ---------- 11. UI PROFIL ---------- */
function updateProfileUI() {
    if (!academieProfile) { return; }
    const pro = academieProfile;
    setText('dashboardName',       pro.full_name);
    setText('academieFullName',    pro.full_name);
    setText('academiePseudo',      pro.pseudo);
    setText('academiePhone',       pro.phone);
    setText('academieEmail',       pro.email);
    setText('academieNationality', pro.nationality);
    setText('academieSpecialite',  pro.type_academie);
    setText('academieClub',        pro.club || pro.structure || pro.organisme || pro.nom_cabinet);
    setText('academieAnciennete',  calculateAnciennete(pro.date_of_birth));
    setText('academieID',          'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion',   pro.profile_completion || 0);
    setText('scoutingViews',       pro.scouting_views || 0);
    setText('recruiterFavs',       pro.recruiter_favs || 0);
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('academieCountryFlag', flag);
    setText('academieCountryName', pro.country);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 12. UI DONNÉES ACADÉMIE ---------- */
function updateDataUI() {
    if (!scoutingData) { return; }
    const d = scoutingData;

    /* Compétences (comp_ = SOURCE UNIQUE, utilisée à la fois pour
       les barres "Compétences principales" et l'onglet Esprit —
       le doublon comp_ vs skill_ d'origine est éliminé ici) */
    setText('cp_enc', d.comp_encadrement ?? 0);
    setText('cp_pro', d.comp_programme_formation ?? 0);
    setText('cp_inf', d.comp_infrastructures ?? 0);
    setText('cp_rec', d.comp_recrutement ?? 0);
    setText('cp_sui', d.comp_suivi_athletique ?? 0);
    setText('cp_par', d.comp_partenariats ?? 0);
    setText('cp_com', d.comp_organisation_competitions ?? 0);
    setText('cp_dou', d.comp_double_projet_scolaire ?? 0);
    setText('cp_coe', d.comp_communication ?? 0);
    setText('cp_adm', d.comp_gestion_administrative ?? 0);
    setText('cp_inn', d.comp_innovation ?? 0);
    setText('cp_per', d.comp_performance_resultats ?? 0);

    setSkill('skill_enc',    d.comp_encadrement ?? 0);
    setSkill('skill_prog',   d.comp_programme_formation ?? 0);
    setSkill('skill_infra',  d.comp_infrastructures ?? 0);
    setSkill('skill_rec',    d.comp_recrutement ?? 0);
    setSkill('skill_suivi',  d.comp_suivi_athletique ?? 0);
    setSkill('skill_part',   d.comp_partenariats ?? 0);
    setSkill('skill_comp',   d.comp_organisation_competitions ?? 0);
    setSkill('skill_result', d.comp_performance_resultats ?? 0);

    /* Activité & Statistiques */
    setText('ac_ath', d.nb_athletes_inscrits ?? 0);
    setText('ac_for', d.nb_formateurs ?? 0);
    setText('ac_dip', d.nb_diplomes_produits ?? 0);
    setText('ac_spo', d.nb_sports_enseignes ?? 0);
    setText('ac_bud', d.budget_annuel ? formatMoney(d.budget_annuel) : '—');
    setText('ac_sco', d.taux_reussite_scolaire ?? 0);
    setText('ac_pro', d.nb_athletes_professionnels ?? 0);

    /* Stats globales visibles (Athlètes inscrits est désormais
       la jauge de quota, affichée séparément) */
    setText('nbFormateurs', d.nb_formateurs ?? 0);
    setText('nbDiplomes',   d.nb_diplomes_produits ?? 0);
    setText('nbSports',     d.nb_sports_enseignes ?? 0);
    setText('tauxScolaire', (d.taux_reussite_scolaire ?? 0) + '%');

    /* Agrément & Structure */
    setText('co_fed', d.federation_affiliee || '—');
    setText('co_div', d.division_sportive || '—');
    setText('co_agr', d.date_agrement ? new Date(d.date_agrement).toLocaleDateString('fr-FR') : '—');
    setText('co_exp', d.expiration_agrement ? new Date(d.expiration_agrement).toLocaleDateString('fr-FR') : '—');
    setText('co_acc', d.accreditations || '—');
    setText('co_num', d.numero_agrement || '—');
    setText('co_sta', d.statut_juridique || '—');
    setText('co_pre', d.presentation || 'Aucun rapport.');
}

/* ---------- 13. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = academieProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) { pr.style.display = 'none'; }
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
        if (db) { db.style.display = 'inline-flex'; }
    } else {
        const init = getInitials(academieProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) { pi.style.display = 'none'; }
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

async function updateProfileCompletion() {
    if (!academieProfile) { return; }
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (academieProfile[fields[i]] && academieProfile[fields[i]] !== '') { filled++; }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (academieProfile.profile_completion !== pct) {
        await supabaseClient.from(PROFILES_TABLE).update({ profile_completion: pct }).eq('hubisoccer_id', academieProfile.hubisoccer_id);
        academieProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !academieProfile) { return; }
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 Mo', 'warning'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning'); return; }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = 'academie_' + currentUser.id + '_' + Date.now() + '.' + ext;
    const { error: ue } = await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn, file, { upsert: true });
    if (ue) { hideLoader(); showToast('Erreur upload: ' + ue.message, 'error'); return; }
    const { data: ud } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: ud.publicUrl }).eq('hubisoccer_id', academieProfile.hubisoccer_id);
    hideLoader();
    academieProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!academieProfile || !confirm('Supprimer la photo de profil ?')) { return; }
    showLoader();
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: '' }).eq('hubisoccer_id', academieProfile.hubisoccer_id);
    hideLoader();
    academieProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 14. COPIER ID ---------- */
async function copyID() {
    const id = academieProfile?.hubisoccer_id;
    if (!id) { return; }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('academieID');
        if (span) {
            const old = span.innerText;
            span.innerText = 'Copié ! ✅';
            setTimeout(function() { span.innerText = old; }, 2200);
        }
    } catch (e) {
        showToast('Erreur copie', 'error');
    }
}

/* ================================================================
   VITRINE "TALENTS À LA UNE" — lecture résiliente de la future
   table Mes Athlètes. Si absente ou vide, état vide affiché.
   ================================================================ */
async function loadShowcase() {
    const grid  = document.getElementById('showcaseGrid');
    const empty = document.getElementById('showcaseEmpty');
    const promo = document.getElementById('showcasePromo');
    if (promo) { promo.textContent = 'Promotion ' + new Date().getFullYear(); }
    if (!grid || !academieProfile) { return; }

    let talents = [];
    try {
        const { data, error } = await supabaseClient
            .from(ATHLETES_TABLE)
            .select('*')
            .eq('academie_id', academieProfile.hubisoccer_id)
            .eq('statut', 'accepte')
            .order('mis_en_avant', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(4);
        if (!error && data) { talents = data; }
    } catch (e) {
        talents = [];
    }

    grid.querySelectorAll('.talent-card').forEach(function(c) { c.remove(); });

    if (talents.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    talents.forEach(function(t, idx) {
        const card = document.createElement('div');
        card.className = 'talent-card';
        card.style.animationDelay = (idx * 0.09) + 's';

        const badgeClass = t.talent_type === 'artiste' ? 'esprit' : 'corps';
        const badgeIcon  = t.talent_type === 'artiste' ? 'fa-music' : 'fa-futbol';
        const badgeLabel = t.talent_type === 'artiste' ? 'Artiste' : 'Sportif';

        card.innerHTML =
            '<div class="talent-photo-wrap">' +
                (t.photo_url
                    ? '<img src="' + escapeHtml(t.photo_url) + '" alt="' + escapeHtml(t.talent_nom || '') + '">'
                    : '<span class="talent-initials">' + escapeHtml(getInitials(t.talent_nom)) + '</span>') +
                (t.mis_en_avant ? '<div class="talent-verified-ribbon" title="Mis en avant"><i class="fas fa-star"></i></div>' : '') +
            '</div>' +
            '<div class="talent-info">' +
                '<div class="talent-name">' + escapeHtml(t.talent_nom || 'Talent') + '</div>' +
                '<div class="talent-discipline">' + escapeHtml(t.discipline || '—') + '</div>' +
                '<span class="talent-badge ' + badgeClass + '"><i class="fas ' + badgeIcon + '"></i> ' + badgeLabel + '</span>' +
            '</div>';
        grid.appendChild(card);
    });
}

/* ================================================================
   WIDGETS DE PILOTAGE — quota, validations, formateurs, compétitions
   ================================================================ */
async function loadPilotWidgets() {
    if (!academieProfile) { return; }
    const limite = (scoutingData && scoutingData.talents_limite) ? scoutingData.talents_limite : QUOTA_TALENTS;

    /* Quota + validations en attente (table academie_athletes) */
    let nbAcceptes = 0;
    let nbAttente  = 0;
    try {
        const { data, error } = await supabaseClient
            .from(ATHLETES_TABLE)
            .select('statut')
            .eq('academie_id', academieProfile.hubisoccer_id);
        if (!error && data) {
            nbAcceptes = data.filter(function(r) { return r.statut === 'accepte'; }).length;
            nbAttente  = data.filter(function(r) { return r.statut === 'en_attente'; }).length;
        }
    } catch (e) { /* table pas encore créée : reste à 0 */ }

    setText('pilotQuota', nbAcceptes + ' / ' + limite);
    setText('pilotValidations', nbAttente);

    const fill = document.getElementById('quotaFill');
    const sub  = document.getElementById('pilotQuotaSub');
    const pct  = Math.min(Math.round((nbAcceptes / limite) * 100), 100);
    if (fill) {
        fill.style.width = pct + '%';
        fill.classList.remove('near-limit', 'at-limit');
        if (nbAcceptes >= limite) {
            fill.classList.add('at-limit');
        } else if (limite - nbAcceptes <= 10) {
            fill.classList.add('near-limit');
        }
    }
    if (sub) {
        const restantes = Math.max(limite - nbAcceptes, 0);
        sub.textContent = restantes > 0 ? restantes + ' places disponibles' : 'Quota atteint';
    }

    /* Formateurs actifs (table academie_formateurs) — statut 'accepte'
       (même vocabulaire que academie_athletes : en_attente/accepte/refuse) */
    try {
        const { count, error } = await supabaseClient
            .from(FORMATEURS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('academie_id', academieProfile.hubisoccer_id)
            .eq('statut', 'accepte');
        setText('pilotFormateurs', (!error && count !== null) ? count : 0);
    } catch (e) {
        setText('pilotFormateurs', 0);
    }

    /* Prochaine compétition (table academie_compet) */
    try {
        const { data, error } = await supabaseClient
            .from(COMPET_TABLE)
            .select('nom, date_debut')
            .eq('academie_id', academieProfile.hubisoccer_id)
            .gte('date_debut', new Date().toISOString())
            .order('date_debut', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (!error && data) {
            setText('pilotCompet', data.nom);
            const sousLabel = document.getElementById('pilotCompetSub');
            if (sousLabel) {
                sousLabel.textContent = new Date(data.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            }
        }
    } catch (e) { /* table pas encore créée : reste au placeholder */ }

    renderAlerts(nbAcceptes, limite);
}

/* ================================================================
   ALERTES — calculées à partir des données déjà disponibles
   ================================================================ */
function renderAlerts(nbAcceptes, limite) {
    const list  = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (!list) { return; }

    list.querySelectorAll('.alert-item').forEach(function(a) { a.remove(); });
    const alerts = [];

    /* Agrément qui expire bientôt */
    if (scoutingData && scoutingData.expiration_agrement) {
        const exp = new Date(scoutingData.expiration_agrement);
        const diffJours = Math.round((exp - new Date()) / 86400000);
        if (diffJours < 0) {
            alerts.push({ level: 'danger', icon: 'fa-triangle-exclamation', text: 'Votre agrément a expiré le ' + exp.toLocaleDateString('fr-FR') + ' — renouvelez-le rapidement.' });
        } else if (diffJours <= 60) {
            alerts.push({ level: 'warning', icon: 'fa-clock', text: 'Votre agrément expire le ' + exp.toLocaleDateString('fr-FR') + ' (' + diffJours + ' j restants).' });
        }
    }

    /* Quota de talents */
    if (nbAcceptes >= limite) {
        alerts.push({ level: 'danger', icon: 'fa-user-graduate', text: 'Vous avez atteint votre quota de ' + limite + ' talents.' });
    } else if (limite - nbAcceptes <= 10) {
        alerts.push({ level: 'warning', icon: 'fa-user-graduate', text: 'Il ne vous reste que ' + (limite - nbAcceptes) + ' place(s) sur ' + limite + '.' });
    }

    if (alerts.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    alerts.forEach(function(a) {
        const el = document.createElement('div');
        el.className = 'alert-item ' + a.level;
        el.innerHTML = '<i class="fas ' + a.icon + '"></i><span>' + escapeHtml(a.text) + '</span>';
        list.appendChild(el);
    });
}

/* ---------- 15. ONGLETS ---------- */
function initAttrTabs() {
    document.querySelectorAll('.attr-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.attr-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.attr-content').forEach(function(c) { c.classList.remove('active'); });
            tab.classList.add('active');
            const container = document.getElementById(tab.dataset.cat + '-attrs');
            if (container) { container.classList.add('active'); }
        });
    });
}

/* ---------- 16. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) { return; }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ---------- 17. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() {
        if (sb) { sb.classList.add('active'); }
        if (ov) { ov.classList.add('active'); }
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) { sb.classList.remove('active'); }
        if (ov) { ov.classList.remove('active'); }
        document.body.style.overflow = '';
    }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) { return; }
        if (e.cancelable) { e.preventDefault(); }
        if (dx > 0 && sx < 40) { open(); } else if (dx < 0) { close(); }
    }, { passive: false });
}

/* ---------- 18. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

function triggerUpload() {
    const input = document.getElementById('fileInput');
    if (input) { input.click(); }
}

/* ---------- 19. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!academieProfile) { return; }
    await loadScoutingData();
    await loadShowcase();
    await loadPilotWidgets();

    initUserMenu();
    initSidebar();
    initAttrTabs();

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const f = e.target.files?.[0];
            if (f) { uploadAvatar(f); }
        });
    }

    const deleteBtn = document.getElementById('deleteAvatarBtn');
    if (deleteBtn) { deleteBtn.addEventListener('click', deleteAvatar); }

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }

    window.triggerUpload = triggerUpload;
    window.copyID = copyID;
    window.showToast = showToast;
});
