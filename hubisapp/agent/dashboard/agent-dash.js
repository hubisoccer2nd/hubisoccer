/* ============================================================
   HubISoccer — agent-dash.js
   Tableau de Bord Agent FIFA · Corps · Âme · Esprit
   ------------------------------------------------------------
   Refonte : les 4 chiffres clés du haut (Talents/Contrats/
   Commissions/Licence) sont maintenant réellement alimentés —
   ils ne l'étaient nulle part dans la version d'origine. Le
   doublon comp_ vs skill_ est éliminé (comp_ = source unique).
   "Situation contractuelle" supprimée (redondante avec Licence).
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles        → partagée (lecture)
   - supabaseAuthPrive_agent_scouting  → cette page (existante)
   - supabaseAuthPrive_agent_talents   → future page "Mes Talents"
     (PAS ENCORE CRÉÉE — lecture résiliente : si absente, les
     widgets concernés affichent simplement 0)
   - supabaseAuthPrive_agent_contrats  → future page "Mes Contrats"
     (PAS ENCORE CRÉÉE — lecture résiliente)
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const AVATAR_BUCKET   = 'avatars-agent';
const PROFILES_TABLE  = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE  = 'supabaseAuthPrive_agent_scouting';
const TALENTS_TABLE   = 'supabaseAuthPrive_agent_talents';   // future page
const CONTRATS_TABLE  = 'supabaseAuthPrive_agent_contrats';  // future page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser  = null;
let agentProfile = null;
let scoutingData  = null;

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
function formatMoney(v) {
    if (!v || isNaN(v)) { return '— €'; }
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
    agentProfile = data;
    document.getElementById('userName').textContent = agentProfile.full_name || 'Agent FIFA';
    return agentProfile;
}

/* ---------- 10. CHARGEMENT DONNÉES AGENT ---------- */
async function loadScoutingData() {
    if (!agentProfile) { return; }
    showLoader();
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('agent_id', agentProfile.hubisoccer_id)
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
            .insert([{ agent_id: agentProfile.hubisoccer_id }])
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
    if (!agentProfile) { return; }
    const pro = agentProfile;
    setText('dashboardName',    pro.full_name);
    setText('agentFullName',    pro.full_name);
    setText('agentPseudo',      pro.pseudo);
    setText('agentPhone',       pro.phone);
    setText('agentEmail',       pro.email);
    setText('agentNationality', pro.nationality);
    setText('agentSpecialite',  pro.type_activite);
    setText('agentClub',        pro.club || pro.structure || pro.organisme || pro.nom_cabinet);
    setText('agentAge',         calculateAge(pro.date_of_birth));
    setText('agentID',          'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion', pro.profile_completion || 0);
    setText('scoutingViews',    pro.scouting_views || 0);
    setText('recruiterFavs',    pro.recruiter_favs || 0);
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('agentCountryFlag', flag);
    setText('agentCountryName', pro.country);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 12. UI DONNÉES AGENT ---------- */
function updateDataUI() {
    if (!scoutingData) { return; }
    const d = scoutingData;

    /* Compétences (comp_ = SOURCE UNIQUE, utilisée à la fois pour
       les barres "Compétences principales" et l'onglet Esprit —
       le doublon comp_ vs skill_ d'origine est éliminé ici.
       comp_prospection et comp_marketing_talent sont ajoutés/
       renommés par agent-dash-migration.sql) */
    setText('cp_neg', d.comp_negociation ?? 0);
    setText('cp_pro', d.comp_prospection ?? 0);
    setText('cp_drt', d.comp_droit_travail ?? 0);
    setText('cp_fif', d.comp_reglementation_fifa ?? 0);
    setText('cp_det', d.comp_detection_talents ?? 0);
    setText('cp_rn',  d.comp_reseau_clubs_national ?? 0);
    setText('cp_ri',  d.comp_reseau_clubs_international ?? 0);
    setText('cp_mkt', d.comp_marketing_talent ?? 0);
    setText('cp_car', d.comp_gestion_carriere ?? 0);
    setText('cp_com', d.comp_communication ?? 0);
    setText('cp_vid', d.comp_analyse_video ?? 0);
    setText('cp_mar', d.comp_connaissance_marches ?? 0);
    setText('cp_lan', d.comp_langues ?? 0);
    setText('cp_eth', d.comp_ethique ?? 0);

    setSkill('skill_nego',     d.comp_negociation ?? 0);
    setSkill('skill_prospect', d.comp_prospection ?? 0);
    setSkill('skill_reseau_n', d.comp_reseau_clubs_national ?? 0);
    setSkill('skill_reseau_i', d.comp_reseau_clubs_international ?? 0);
    setSkill('skill_jur',      d.comp_droit_travail ?? 0);
    setSkill('skill_mkt',      d.comp_marketing_talent ?? 0);
    setSkill('skill_comm',     d.comp_communication ?? 0);
    setSkill('skill_gest',     d.comp_gestion_carriere ?? 0);
    setSkill('skill_ethique',  d.comp_ethique ?? 0);

    /* Activité & Résultats */
    setText('ac_tal', d.talents_sous_contrat ?? 0);
    setText('ac_tra', d.transferts_realises ?? 0);
    setText('ac_mon', d.montant_total_transferts ? formatMoney(d.montant_total_transferts) : '—');
    setText('ac_com', d.commissions_percues ? formatMoney(d.commissions_percues) : '—');
    setText('ac_clu', d.clubs_partenaires ?? 0);
    setText('ac_pay', d.pays_couverts ?? 0);
    setText('ac_exp', d.annees_experience ?? 0);
    setText('ac_suc', d.taux_succes ?? 0);

    /* Licence & Structure */
    setText('li_num', d.numero_licence_fifa || '—');
    setText('li_dat', d.date_obtention_licence ? new Date(d.date_obtention_licence).toLocaleDateString('fr-FR') : '—');
    setText('li_exp', d.expire_licence ? new Date(d.expire_licence).toLocaleDateString('fr-FR') : '—');
    setText('li_cab', d.nom_cabinet || '—');
    setText('li_pay', d.pays_exercice || '—');
    setText('li_ca',  d.chiffre_affaires ? formatMoney(d.chiffre_affaires) : '—');
    setText('li_col', d.nb_collaborateurs ?? 0);
    setText('li_not', d.note_professionnelle || 'Aucun rapport.');

    /* Stats globales du haut — RÉELLEMENT alimentées désormais
       (aucune des 4 n'était renseignée dans la version d'origine) */
    setText('nbTalents',     d.talents_sous_contrat ?? 0);
    setText('nbContrats',    d.transferts_realises ?? 0);
    setText('totalComm',     d.commissions_percues ? formatMoney(d.commissions_percues) : '0 €');
    setText('licenceStatut', statutLicence(d.expire_licence));
}

/* ---------- 13. STATUT LICENCE (calculé, jamais stocké) ---------- */
function statutLicence(dateExpiration) {
    if (!dateExpiration) { return 'Non renseignée'; }
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    return new Date(dateExpiration) >= aujourdHui ? 'Active' : 'Expirée';
}

/* ---------- 14. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = agentProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) { pr.style.display = 'none'; }
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
        if (db) { db.style.display = 'inline-flex'; }
    } else {
        const init = getInitials(agentProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) { pi.style.display = 'none'; }
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
        if (db) { db.style.display = 'none'; }
    }
}

async function updateProfileCompletion() {
    if (!agentProfile) { return; }
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (agentProfile[fields[i]] && agentProfile[fields[i]] !== '') { filled++; }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (agentProfile.profile_completion !== pct) {
        await supabaseClient.from(PROFILES_TABLE).update({ profile_completion: pct }).eq('hubisoccer_id', agentProfile.hubisoccer_id);
        agentProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !agentProfile) { return; }
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 Mo', 'warning'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning'); return; }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = 'agent_' + currentUser.id + '_' + Date.now() + '.' + ext;
    const { error: ue } = await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn, file, { upsert: true });
    if (ue) { hideLoader(); showToast('Erreur upload: ' + ue.message, 'error'); return; }
    const { data: ud } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: ud.publicUrl }).eq('hubisoccer_id', agentProfile.hubisoccer_id);
    hideLoader();
    agentProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!agentProfile || !confirm('Supprimer la photo de profil ?')) { return; }
    showLoader();
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: '' }).eq('hubisoccer_id', agentProfile.hubisoccer_id);
    hideLoader();
    agentProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 15. COPIER ID ---------- */
async function copyID() {
    const id = agentProfile?.hubisoccer_id;
    if (!id) { return; }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('agentID');
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
   WIDGETS DE PILOTAGE — talents, demandes, contrats, licence
   ================================================================ */
async function loadPilotWidgets() {
    if (!agentProfile) { return; }
    const agentId = agentProfile.hubisoccer_id;

    /* Talents gérés + demandes en attente (table agent_talents) */
    try {
        const { data, error } = await supabaseClient
            .from(TALENTS_TABLE)
            .select('statut')
            .eq('agent_id', agentId);
        if (!error && data) {
            setText('pilotTalents', data.filter(function(r) { return r.statut === 'accepted'; }).length);
            setText('pilotDemandes', data.filter(function(r) { return r.statut === 'pending'; }).length);
        } else {
            setText('pilotTalents', 0);
            setText('pilotDemandes', 0);
        }
    } catch (e) {
        setText('pilotTalents', 0);
        setText('pilotDemandes', 0);
    }

    /* Contrats actifs (table agent_contrats, statut = signe) */
    try {
        const { count, error } = await supabaseClient
            .from(CONTRATS_TABLE)
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('statut', 'signe');
        setText('pilotContrats', (!error && count !== null) ? count : 0);
    } catch (e) {
        setText('pilotContrats', 0);
    }

    /* Licence FIFA (déjà disponible dans scoutingData) */
    const statut = scoutingData ? statutLicence(scoutingData.expire_licence) : 'Non renseignée';
    setText('pilotLicence', statut);
    const sub = document.getElementById('pilotLicenceSub');
    if (sub && scoutingData && scoutingData.expire_licence) {
        sub.textContent = 'Expire le ' + new Date(scoutingData.expire_licence).toLocaleDateString('fr-FR');
    }

    renderAlerts();
}

/* ================================================================
   ALERTES — calculées à partir des données déjà disponibles
   ================================================================ */
function renderAlerts() {
    const list  = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (!list) { return; }

    list.querySelectorAll('.alert-item').forEach(function(a) { a.remove(); });
    const alerts = [];

    if (scoutingData && scoutingData.expire_licence) {
        const exp = new Date(scoutingData.expire_licence);
        const diffJours = Math.round((exp - new Date()) / 86400000);
        if (diffJours < 0) {
            alerts.push({ level: 'danger', icon: 'fa-triangle-exclamation', text: 'Votre licence FIFA a expiré le ' + exp.toLocaleDateString('fr-FR') + ' — renouvelez-la rapidement.' });
        } else if (diffJours <= 60) {
            alerts.push({ level: 'warning', icon: 'fa-clock', text: 'Votre licence FIFA expire le ' + exp.toLocaleDateString('fr-FR') + ' (' + diffJours + ' j restants).' });
        }
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

/* ---------- 19. DÉCONNEXION ---------- */
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

/* ---------- 20. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) { return; }
    await loadProfile();
    if (!agentProfile) { return; }
    await loadScoutingData();
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
