/* ============================================================
   HubISoccer -- staff-dash.js
   Tableau de Bord Staff Medical - Corps - Ame - Esprit
   ------------------------------------------------------------
   Construit entierement neuf : les 8 barres de "Competences
   principales" lisent directement les colonnes comp_* -- source
   unique des la conception, pas de doublon comp_/skill_ a
   corriger plus tard comme sur les autres espaces.
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles          -> partagee (lecture)
   - supabaseAuthPrive_staff_medical_scouting  -> cette page (existante)
   - supabaseAuthPrive_staff_medical_athletes  -> future page "Mes
     Athletes Suivis" (PAS ENCORE CREEE -- lecture resiliente,
     alimente aussi le badge Pass Medical rouge/orange/vert)
   - supabaseAuthPrive_staff_medical_honoraires -> future page "Mes
     Honoraires" (PAS ENCORE CREEE -- lecture resiliente)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const AVATAR_BUCKET     = 'avatars-staff-medical';
const PROFILES_TABLE    = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE    = 'supabaseAuthPrive_staff_medical_scouting';
const ATHLETES_TABLE    = 'supabaseAuthPrive_staff_medical_athletes';
const HONORAIRES_TABLE  = 'supabaseAuthPrive_staff_medical_honoraires';

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser    = null;
let staffProfile = null;
let scoutingData    = null;

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'flex'; }
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) { l.style.display = 'none'; }
}

/* ---------- 5. TOAST (duree 30 secondes) ---------- */
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
function formatMoney(v) {
    if (!v || isNaN(v)) { return '0 €'; }
    const n = Number(v);
    if (n >= 1000000) { return (n / 1000000).toFixed(1) + ' M€'; }
    if (n >= 1000) { return (n / 1000).toFixed(0) + ' K€'; }
    return n.toLocaleString('fr-FR') + ' €';
}
function calculateAge(d) {
    if (!d) { return '—'; }
    const today = new Date();
    const birth = new Date(d);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) { age--; }
    return age;
}
function getInitials(name) {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) { return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(); }
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
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    hideLoader();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=MEDIC';
        return null;
    }
    currentUser = user;
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
    staffProfile = data;
    document.getElementById('userName').textContent = staffProfile.full_name || 'Staff Médical';
    return staffProfile;
}

/* ---------- 10. CHARGEMENT DONNEES MEDICAL ---------- */
async function loadScoutingData() {
    if (!staffProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('staff_medical_id', staffProfile.hubisoccer_id)
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
            .insert([{ staff_medical_id: staffProfile.hubisoccer_id }])
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
    if (!staffProfile) { return; }
    const pro = staffProfile;
    setText('dashboardName',      pro.full_name);
    setText('medicalFullName',    pro.full_name);
    setText('medicalPseudo',      pro.pseudo);
    setText('medicalPhone',       pro.phone);
    setText('medicalEmail',       pro.email);
    setText('medicalNationality', pro.nationality);
    setText('medicalAge',         calculateAge(pro.date_of_birth));
    setText('medicalID',          'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion',  pro.profile_completion || 0);
    setText('scoutingViews',      pro.scouting_views || 0);
    setText('recruiterFavs',      pro.recruiter_favs || 0);
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('medicalCountryFlag', flag);
    setText('medicalCountryName', pro.country);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 12. UI DONNEES MEDICAL ---------- */
function updateDataUI() {
    if (!scoutingData) { return; }
    const d = scoutingData;

    setText('medicalStructure',  d.structure || '');
    setText('medicalSpecialite', d.specialite_medicale || 'Non renseignée');
    setText('medicalPosition',   d.specialite_medicale || 'Spécialité non renseignée');

    /* Competences : comp_ est la source unique -- aucun doublon
       skill_ separe cree ici, les 8 barres et l'onglet Esprit
       lisent directement le meme champ */
    setText('cp_dia', d.comp_diagnostic ?? 0);
    setText('cp_tra', d.comp_traumatologie ?? 0);
    setText('cp_kin', d.comp_kinesitherapie ?? 0);
    setText('cp_nut', d.comp_nutrition ?? 0);
    setText('cp_bio', d.comp_biometrie ?? 0);
    setText('cp_urg', d.comp_urgences ?? 0);
    setText('cp_men', d.comp_preparation_mentale ?? 0);
    setText('cp_sop', d.comp_sophrologie ?? 0);
    setText('cp_som', d.comp_sommeil ?? 0);
    setText('cp_psy', d.comp_psychologie ?? 0);
    setText('cp_com', d.comp_communication ?? 0);
    setText('cp_rtp', d.comp_protocoles_rtp ?? 0);
    setText('cp_eth', d.comp_ethique ?? 0);
    setText('cp_ped', d.comp_pedagogie ?? 0);

    setSkill('skill_trauma',    d.comp_traumatologie ?? 0);
    setSkill('skill_kine',      d.comp_kinesitherapie ?? 0);
    setSkill('skill_nutrition', d.comp_nutrition ?? 0);
    setSkill('skill_urgences',  d.comp_urgences ?? 0);
    setSkill('skill_rtp',       d.comp_protocoles_rtp ?? 0);
    setSkill('skill_mental',    d.comp_preparation_mentale ?? 0);
    setSkill('skill_sommeil',   d.comp_sommeil ?? 0);
    setSkill('skill_psy',       d.comp_psychologie ?? 0);

    /* Activite & Suivi */
    setText('ac_ath', d.total_athletes_suivis ?? 0);
    setText('ac_con', d.total_consultations ?? 0);
    setText('ac_ble', d.total_blessures_traitees ?? 0);
    setText('ac_rtp', d.total_rtp_reussis ?? 0);
    setText('ac_wel', d.score_wellness_moyen ?? 0);
    setText('ac_ale', d.alertes_actives ?? 0);
    setText('ac_ann', d.annees_experience ?? 0);
    setText('ac_dis', d.taux_disponibilite ? d.taux_disponibilite + ' %' : '0 %');

    /* Corps : Statut & Structure */
    setText('co_spe', d.specialite_medicale || '—');
    setText('co_ord', d.numero_ordre || '—');
    setText('co_str', d.structure || '—');
    setText('co_deb', d.date_debut_exercice ? new Date(d.date_debut_exercice).toLocaleDateString('fr-FR') : '—');
    setText('co_rcp', d.assurance_rc_pro || '—');
    setText('co_pay', d.pays_exercice || '—');
    setText('co_hon', d.honoraires_totaux ? formatMoney(d.honoraires_totaux) : '—');
    setText('co_not', d.note_evaluation || 'Aucun rapport.');

    /* Stats globales du haut */
    setText('nbAthletes',      d.total_athletes_suivis ?? 0);
    setText('nbConsultations', d.total_consultations ?? 0);
    setText('totalHonoraires', d.honoraires_totaux ? formatMoney(d.honoraires_totaux) : '0 €');
    setText('anneesExp',       d.annees_experience ?? 0);

    /* Widgets de pilotage (memes donnees, deja chargees) */
    setText('pilotAthletes',      d.total_athletes_suivis ?? 0);
    setText('pilotConsultations', d.total_consultations ?? 0);
    setText('pilotHonoraires',    d.honoraires_totaux ? formatMoney(d.honoraires_totaux) : '0 €');
}

/* ================================================================
   ALERTES ROUGE -- lecture resiliente de la future table
   medical_athletes (badge Pass Medical)
   ================================================================ */
async function loadAlertesRouge() {
    if (!staffProfile) { return; }
    try {
        const { data, error } = await supabaseClient
            .from(ATHLETES_TABLE)
            .select('statut_dispo')
            .eq('staff_medical_id', staffProfile.hubisoccer_id);
        if (!error && data) {
            const rouges = data.filter(function(r) { return r.statut_dispo === 'rouge'; }).length;
            setText('pilotAlertes', rouges);
            renderAlertes(rouges);
            return;
        }
    } catch (e) {
        /* table pas encore creee -- degradation silencieuse */
    }
    setText('pilotAlertes', 0);
    renderAlertes(0);
}

function renderAlertes(nbRouges) {
    const list  = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (!list) { return; }

    list.querySelectorAll('.alert-item').forEach(function(a) { a.remove(); });
    const alerts = [];

    if (nbRouges > 0) {
        alerts.push({ level: 'danger', icon: 'fa-circle', text: nbRouges + ' athlète(s) actuellement en statut Rouge -- consultez Mes Athlètes Suivis.' });
    }

    const pct = staffProfile ? (staffProfile.profile_completion || 0) : 0;
    if (pct < 100) {
        alerts.push({ level: 'warning', icon: 'fa-user-edit', text: 'Votre profil est complété à ' + pct + '%. Complétez-le pour inspirer davantage confiance.' });
    }

    if (alerts.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    alerts.forEach(function(a) {
        const el = document.createElement('div');
        el.className = 'alert-item ' + a.level;
        el.innerHTML = '<i class="fas ' + a.icon + '"></i><span>' + a.text + '</span>';
        list.appendChild(el);
    });
}

/* ---------- 13. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = staffProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) { pr.style.display = 'none'; }
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
        if (db) { db.style.display = 'inline-flex'; }
    } else {
        const init = getInitials(staffProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) { pi.style.display = 'none'; }
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
        if (db) { db.style.display = 'none'; }
    }
}

async function updateProfileCompletion() {
    if (!staffProfile) { return; }
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (staffProfile[fields[i]] && staffProfile[fields[i]] !== '') { filled++; }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (staffProfile.profile_completion !== pct) {
        await supabaseClient.from(PROFILES_TABLE).update({ profile_completion: pct }).eq('hubisoccer_id', staffProfile.hubisoccer_id);
        staffProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !staffProfile) { return; }
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 Mo', 'warning'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning'); return; }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = 'staff_medical_' + currentUser.id + '_' + Date.now() + '.' + ext;
    const { error: ue } = await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn, file, { upsert: true });
    if (ue) { hideLoader(); showToast('Erreur upload: ' + ue.message, 'error'); return; }
    const { data: ud } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: ud.publicUrl }).eq('hubisoccer_id', staffProfile.hubisoccer_id);
    hideLoader();
    staffProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!staffProfile || !confirm('Supprimer la photo de profil ?')) { return; }
    showLoader();
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: '' }).eq('hubisoccer_id', staffProfile.hubisoccer_id);
    hideLoader();
    staffProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 14. COPIER ID ---------- */
async function copyID() {
    const id = staffProfile?.hubisoccer_id;
    if (!id) { return; }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('medicalID');
        if (span) {
            const old = span.innerText;
            span.innerText = 'Copié ! ✅';
            setTimeout(function() { span.innerText = old; }, 2200);
        }
    } catch (e) {
        showToast('Erreur copie', 'error');
    }
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

/* ---------- 18. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html?role=MEDIC';
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
    if (!staffProfile) { return; }
    await loadScoutingData();
    await loadAlertesRouge();

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
