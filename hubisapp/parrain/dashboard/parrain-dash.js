/* ============================================================
   HubISoccer -- parrain-dash.js
   Tableau de Bord Parrain - Corps - Ame - Esprit
   ------------------------------------------------------------
   Corrections apportees a la version recue :
   - Les 4 chiffres cles du haut (Proteges/Dons/Bourses/Annees)
     n'etaient alimentes nulle part -- ils le sont maintenant,
     a partir des memes donnees que l'onglet Activite (pas de
     doublon de saisie).
   - Doublon comp_ vs skill_ elimine : les 8 barres de
     competences lisent desormais comp_* directement (source
     unique), au lieu d'une colonne skill_* separee.
   - Section "Situation contractuelle" supprimee (redondante
     avec l'onglet Corps - Engagement & Structure).
   - Chemin tournoi corrige (acceuil.html).
   - birth_date et country_code confirmes par Ozawa comme les
     vrais noms de colonnes -- conserves tels quels.
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles         -> partagee (lecture)
   - supabaseAuthPrive_parrain_scouting -> cette page (existante)
   - supabaseAuthPrive_parrain_proteges -> future page "Mes Proteges"
     (PAS ENCORE CREEE -- lecture resiliente)
   - supabaseAuthPrive_parrain_dons     -> future page "Mes Dons"
     (PAS ENCORE CREEE -- lecture resiliente)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const AVATAR_BUCKET   = 'avatars-parrain';
const PROFILES_TABLE  = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE  = 'supabaseAuthPrive_parrain_scouting';
const PROTEGES_TABLE  = 'supabaseAuthPrive_parrain_proteges';  // future page
const DONS_TABLE      = 'supabaseAuthPrive_parrain_dons';      // future page

/* ---------- 3. ETAT GLOBAL ---------- */
let currentUser    = null;
let parrainProfile = null;
let scoutingData   = null;

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

/* ---------- 8. SESSION (via getUser) ---------- */
async function checkSession() {
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    hideLoader();
    if (error || !user) {
        window.location.href = '../../authprive/users/login.html?role=PARRAIN';
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
    parrainProfile = data;
    document.getElementById('userName').textContent = parrainProfile.full_name || 'Parrain';
    return parrainProfile;
}

/* ---------- 10. CHARGEMENT DONNEES PARRAIN ---------- */
async function loadScoutingData() {
    if (!parrainProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('parrain_id', parrainProfile.hubisoccer_id)
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
            .insert([{ parrain_id: parrainProfile.hubisoccer_id }])
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
    if (!parrainProfile) { return; }
    const pro = parrainProfile;
    setText('dashboardName',      pro.full_name);
    setText('parrainFullName',    pro.full_name);
    setText('parrainPseudo',      pro.pseudo);
    setText('parrainPhone',       pro.phone);
    setText('parrainEmail',       pro.email);
    setText('parrainNationality', pro.nationality);
    setText('parrainClub',        pro.club || (scoutingData && scoutingData.organisme) || '');
    setText('parrainAge',         calculateAge(pro.birth_date));
    setText('parrainID',          'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion',  pro.profile_completion || 0);
    setText('scoutingViews',      pro.scouting_views || 0);
    setText('recruiterFavs',      pro.recruiter_favs || 0);
    const countryCode = pro.country_code || '';
    const flag = flagMap[countryCode] || '🌍';
    setText('parrainCountryFlag', flag);
    setText('parrainCountryName', countryCode);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 12. UI DONNEES PARRAIN ---------- */
function updateDataUI() {
    if (!scoutingData) { return; }
    const d = scoutingData;

    /* Type d'engagement (specialite affichee dans l'en-tete) */
    setText('parrainSpecialite', d.type_engagement || 'Non renseigné');
    setText('parrainPosition',   d.type_engagement || 'Type d\'engagement non renseigné');

    /* Competences (comp_ = SOURCE UNIQUE, utilisee a la fois pour
       les barres "Competences principales" et l'onglet Esprit --
       le doublon comp_ vs skill_ d'origine est elimine ici,
       mapping propre 8/8, aucune colonne manquante) */
    setText('cp_acc', d.comp_accompagnement ?? 0);
    setText('cp_pro', d.comp_gestion_projet ?? 0);
    setText('cp_fin', d.comp_financement ?? 0);
    setText('cp_res', d.comp_reseau ?? 0);
    setText('cp_men', d.comp_mentorat ?? 0);
    setText('cp_com', d.comp_communication ?? 0);
    setText('cp_sui', d.comp_suivi_parcours ?? 0);
    setText('cp_eth', d.comp_ethique ?? 0);
    setText('cp_sco', d.comp_orientation_scolaire ?? 0);
    setText('cp_car', d.comp_orientation_carriere ?? 0);
    setText('cp_imp', d.comp_impact ?? 0);
    setText('cp_eco', d.comp_ecoute ?? 0);

    setSkill('skill_acc',    d.comp_accompagnement ?? 0);
    setSkill('skill_fin',    d.comp_financement ?? 0);
    setSkill('skill_res',    d.comp_reseau ?? 0);
    setSkill('skill_mentor', d.comp_mentorat ?? 0);
    setSkill('skill_comm',   d.comp_communication ?? 0);
    setSkill('skill_suivi',  d.comp_suivi_parcours ?? 0);
    setSkill('skill_eth',    d.comp_ethique ?? 0);
    setSkill('skill_impact', d.comp_impact ?? 0);

    /* Activite & Impact */
    setText('ac_pro', d.total_proteges ?? 0);
    setText('ac_don', d.total_dons_financiers ? formatMoney(d.total_dons_financiers) : '—');
    setText('ac_bou', d.nb_bourses_accordees ?? 0);
    setText('ac_ses', d.nb_sessions_mentorat ?? 0);
    setText('ac_reu', d.nb_reussites ?? 0);
    setText('ac_etu', d.nb_etudes_financees ?? 0);
    setText('ac_ann', d.annees_activite ?? 0);
    setText('ac_sco', d.score_impact ?? 0);

    /* Corps -- Engagement & Structure */
    setText('co_org', d.organisme || '—');
    setText('co_typ', d.type_engagement || '—');
    setText('co_deb', d.date_debut_parrainage ? new Date(d.date_debut_parrainage).toLocaleDateString('fr-FR') : '—');
    setText('co_con', d.convention_actuelle || '—');
    setText('co_bud', d.budget_annuel ? formatMoney(d.budget_annuel) : '—');
    setText('co_par', d.partenaires || '—');
    setText('co_not', d.note_evaluation || 'Aucun rapport.');

    /* Stats globales du haut -- REELLEMENT alimentees desormais
       (aucune des 4 n'etait renseignee dans la version recue) */
    setText('nbProteges', d.total_proteges ?? 0);
    setText('totalDons',  d.total_dons_financiers ? formatMoney(d.total_dons_financiers) : '0 €');
    setText('nbBourses',  d.nb_bourses_accordees ?? 0);
    setText('anneesAct',  d.annees_activite ?? 0);

    /* Widgets de pilotage (memes donnees, deja chargees) */
    setText('pilotProteges', d.total_proteges ?? 0);
    setText('pilotDons',     d.total_dons_financiers ? formatMoney(d.total_dons_financiers) : '0 €');
    setText('pilotBourses',  d.nb_bourses_accordees ?? 0);
    setText('pilotSessions', d.nb_sessions_mentorat ?? 0);

    renderAlerts();
}

/* ---------- 13. ALERTES ---------- */
function renderAlerts() {
    const list  = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (!list) { return; }

    list.querySelectorAll('.alert-item').forEach(function(a) { a.remove(); });
    const alerts = [];

    const pct = parrainProfile ? (parrainProfile.profile_completion || 0) : 0;
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

/* ---------- 14. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = parrainProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) { pr.style.display = 'none'; }
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
        if (db) { db.style.display = 'inline-flex'; }
    } else {
        const init = getInitials(parrainProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) { pi.style.display = 'none'; }
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
        if (db) { db.style.display = 'none'; }
    }
}

async function updateProfileCompletion() {
    if (!parrainProfile) { return; }
    const fields = ['full_name', 'pseudo', 'phone', 'country_code', 'birth_date'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (parrainProfile[fields[i]] && parrainProfile[fields[i]] !== '') { filled++; }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (parrainProfile.profile_completion !== pct) {
        await supabaseClient.from(PROFILES_TABLE).update({ profile_completion: pct }).eq('hubisoccer_id', parrainProfile.hubisoccer_id);
        parrainProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !parrainProfile) { return; }
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 Mo', 'warning'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning'); return; }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = 'parrain_' + currentUser.id + '_' + Date.now() + '.' + ext;
    const { error: ue } = await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn, file, { upsert: true });
    if (ue) { hideLoader(); showToast('Erreur upload: ' + ue.message, 'error'); return; }
    const { data: ud } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: ud.publicUrl }).eq('hubisoccer_id', parrainProfile.hubisoccer_id);
    hideLoader();
    parrainProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!parrainProfile || !confirm('Supprimer la photo de profil ?')) { return; }
    showLoader();
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: '' }).eq('hubisoccer_id', parrainProfile.hubisoccer_id);
    hideLoader();
    parrainProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 15. COPIER ID ---------- */
async function copyID() {
    const id = parrainProfile?.hubisoccer_id;
    if (!id) { return; }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('parrainID');
        if (span) {
            const old = span.innerText;
            span.innerText = 'Copié ! ✅';
            setTimeout(function() { span.innerText = old; }, 2200);
        }
    } catch (e) {
        showToast('Erreur copie', 'error');
    }
}

/* ---------- 16. ONGLETS ---------- */
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

/* ---------- 17. MENU UTILISATEUR ---------- */
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

/* ---------- 18. SIDEBAR + SWIPE ---------- */
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

/* ---------- 19. DECONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html?role=PARRAIN';
}

function triggerUpload() {
    const input = document.getElementById('fileInput');
    if (input) { input.click(); }
}

/* ---------- 20. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!parrainProfile) { return; }
    await loadScoutingData();

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
