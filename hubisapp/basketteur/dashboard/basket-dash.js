/* ============================================================
   HubISoccer — basket-dash.js
   Espace Basketteur · Corps · Âme · Esprit
   Version corrigée – tables, colonnes, bucket, durée toasts
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. ÉTAT GLOBAL ---------- */
let currentUser         = null;
let basketteurProfile   = null;
let scoutingData        = null;
const AVATAR_BUCKET     = 'avatars-basketteur';
const PROFILES_TABLE    = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE    = 'supabaseAuthPrive_basketteur_scouting';

/* ---------- 3. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'flex';
}
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'none';
}

/* ---------- 4. TOAST (durée 30 secondes) ---------- */
function showToast(message, type = 'info', duration = 30000) {
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
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => t.remove(), 320);
    });
    setTimeout(() => {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 320);
        }
    }, duration);
}

/* ---------- 5. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = (value !== null && value !== undefined) ? value : '—';
}

function formatMoney(value) {
    if (!value || isNaN(value)) return '— €';
    const num = Number(value);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + ' M€';
    if (num >= 1000) return (num / 1000).toFixed(0) + ' K€';
    return num.toLocaleString('fr-FR') + ' €';
}

function calculateAge(d) {
    if (!d) return '—';
    const t = new Date(), b = new Date(d);
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function setSkill(id, value) {
    const bar = document.getElementById(id);
    const span = document.getElementById(id + '_value');
    if (bar) bar.style.width = Math.min(value, 100) + '%';
    if (span) span.textContent = value;
}

/* ---------- 6. DRAPEAUX (250+ pays) ---------- */
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

/* ---------- 7. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 8. CHARGEMENT PROFIL ---------- */
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
    basketteurProfile = data;
    document.getElementById('userName').textContent = basketteurProfile.full_name || 'Basketteur';
    return basketteurProfile;
}

/* ---------- 9. CHARGEMENT DONNÉES SCOUTING ---------- */
async function loadScoutingData() {
    if (!basketteurProfile) return;
    showLoader();
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq('basketteur_id', basketteurProfile.hubisoccer_id)
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
            .insert([{ basketteur_id: basketteurProfile.hubisoccer_id }])
            .select()
            .single();
        if (ie) {
            showToast('Erreur initialisation données', 'error');
            return;
        }
        scoutingData = nd;
    }
    updateProfileUI();
    updateDataUI();
}

/* ---------- 10. UI PROFIL ---------- */
function updateProfileUI() {
    if (!basketteurProfile) return;
    const pro = basketteurProfile;
    setText('dashboardName',   pro.full_name || '—');
    setText('basketFullName',  pro.full_name || '—');
    setText('basketPseudo',    pro.pseudo || '—');
    setText('basketPhone',     pro.phone || '—');
    setText('basketEmail',     pro.email || '—');
    setText('basketNationality', pro.nationality || '—');
    setText('basketSpecialite', pro.position || '—');
    setText('basketClub',      pro.club || pro.structure || pro.organisme || '—');
    setText('basketAge',       calculateAge(pro.date_of_birth));
    setText('basketHeight',    pro.height || '—');
    setText('basketWeight',    pro.weight || '—');
    setText('basketID',        `ID : ${pro.hubisoccer_id || '—'}`);
    setText('profileCompletion', pro.profile_completion || 0);
    setText('scoutingViews',   pro.scouting_views || 0);
    setText('recruiterFavs',   pro.recruiter_favs || 0);
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('basketCountryFlag', flag);
    setText('basketCountryName', pro.country || '—');
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 11. UI DONNÉES MÉTIER ---------- */
function updateDataUI() {
    if (!scoutingData) return;
    const d = scoutingData;
    setText('salary',         d.salaire ? formatMoney(d.salaire) : (d.cachet_representation ? formatMoney(d.cachet_representation) : '—'));
    setText('contractExpiry', d.expire_le ? new Date(d.expire_le).toLocaleDateString('fr-FR') : '—');
    setText('marketValue',    d.valeur_marche ? formatMoney(d.valeur_marche) : '—');
    setText('statutPro',      d.statut_professionnel || '—');

    setText('t_tmi', d.technique_tir_mi_distance ?? 0);
    setText('t_t3p', d.technique_tir_3pts ?? 0);
    setText('t_lay', d.technique_layup ?? 0);
    setText('t_lf',  d.technique_lancers_francs ?? 0);
    setText('t_dri', d.technique_dribble ?? 0);
    setText('t_pas', d.technique_passes ?? 0);
    setText('t_pal', d.technique_passes_lobees ?? 0);
    setText('t_ecr', d.technique_ecrans ?? 0);
    setText('t_rof', d.technique_rebond_offensif ?? 0);
    setText('t_rdf', d.technique_rebond_defensif ?? 0);
    setText('t_cnt', d.technique_contre ?? 0);
    setText('t_int', d.technique_interception ?? 0);
    setText('t_mar', d.technique_marquage ?? 0);
    setText('t_pst', d.technique_post_bas ?? 0);

    setText('m_lea', d.mental_leadership ?? 0);
    setText('m_vis', d.mental_vision_jeu ?? 0);
    setText('m_sf',  d.mental_sang_froid ?? 0);
    setText('m_dec', d.mental_decisions ?? 0);
    setText('m_con', d.mental_concentration ?? 0);
    setText('m_det', d.mental_determination ?? 0);
    setText('m_col', d.mental_jeu_collectif ?? 0);
    setText('m_cou', d.mental_courage ?? 0);
    setText('m_pre', d.mental_resistance_pression ?? 0);
    setText('m_com', d.mental_communication ?? 0);

    setText('p_vit', d.physique_vitesse ?? 0);
    setText('p_sau', d.physique_saut_vertical ?? 0);
    setText('p_end', d.physique_endurance ?? 0);
    setText('p_pui', d.physique_puissance ?? 0);
    setText('p_agi', d.physique_agilite ?? 0);
    setText('p_acc', d.physique_acceleration ?? 0);
    setText('p_env', d.physique_envergure ?? 0);
    setText('p_con', d.physique_condition ?? 0);

    setText('c_clu', d.club_actuel ?? '—');
    setText('c_lig', d.ligue_division ?? '—');
    setText('c_sal', d.salaire ? formatMoney(d.salaire) : '—');
    setText('c_exp', d.expire_le ? new Date(d.expire_le).toLocaleDateString('fr-FR') : '—');
    setText('c_cla', d.clause_liberatoire ?? '—');
    setText('c_val', d.valeur_marche ?? '—');
    setText('c_ag',  d.agent_representant ?? '—');
    setText('c_sel', d.selection_nationale ?? '—');
    setText('c_cat', d.categorie_fiba ?? '—');
    setText('c_rapp', d.rapports_recruteurs || 'Aucun rapport.');

    setSkill('skill_tir',      d.skill_tir || 0);
    setSkill('skill_dribble',  d.skill_dribble || 0);
    setSkill('skill_passes',   d.skill_passes || 0);
    setSkill('skill_rebond',   d.skill_rebond || 0);
    setSkill('skill_defense',  d.skill_defense || 0);
    setSkill('skill_physique', d.skill_physique || 0);
    setSkill('skill_mental',   d.skill_mental || 0);
    setSkill('skill_vision',   d.skill_vision || 0);
}

/* ---------- 12. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = basketteurProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) pr.style.display = 'none';
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) un.style.display = 'none';
        if (db) db.style.display = 'inline-flex';
    } else {
        const init = getInitials(basketteurProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) pi.style.display = 'none';
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) ui.style.display = 'none';
        if (db) db.style.display = 'none';
    }
}

async function updateProfileCompletion() {
    if (!basketteurProfile) return;
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    const pct = Math.round(fields.filter(f => basketteurProfile[f] && basketteurProfile[f] !== '').length / fields.length * 100);
    if (basketteurProfile.profile_completion !== pct) {
        await supabaseClient.from(PROFILES_TABLE).update({ profile_completion: pct }).eq('hubisoccer_id', basketteurProfile.hubisoccer_id);
        basketteurProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !basketteurProfile) return;
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 Mo', 'warning'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning'); return; }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = `basket_${currentUser.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn, file, { upsert: true });
    if (upErr) { hideLoader(); showToast('Erreur upload: ' + upErr.message, 'error'); return; }
    const { data: urlData } = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: urlData.publicUrl }).eq('hubisoccer_id', basketteurProfile.hubisoccer_id);
    hideLoader();
    basketteurProfile.avatar_url = urlData.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!basketteurProfile || !confirm('Supprimer la photo de profil ?')) return;
    showLoader();
    await supabaseClient.from(PROFILES_TABLE).update({ avatar_url: '' }).eq('hubisoccer_id', basketteurProfile.hubisoccer_id);
    hideLoader();
    basketteurProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 13. COPIER ID ---------- */
async function copyID() {
    const idVal = basketteurProfile?.hubisoccer_id;
    if (!idVal) return;
    try {
        await navigator.clipboard.writeText(idVal);
        const span = document.getElementById('basketID');
        const old = span.innerText;
        span.innerText = 'Copié ! ✅';
        setTimeout(() => span.innerText = old, 2200);
    } catch { showToast('Erreur copie', 'error'); }
}

/* ---------- 14. ONGLETS ---------- */
function initAttrTabs() {
    document.querySelectorAll('.attr-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.attr-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.attr-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.cat}-attrs`)?.classList.add('active');
        });
    });
}

/* ---------- 15. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dd = document.getElementById('userDropdown');
    if (!menu || !dd) return;
    menu.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('show'); });
    document.addEventListener('click', () => dd.classList.remove('show'));
}

/* ---------- 16. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');
    const open  = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    mb?.addEventListener('click', open);
    cb?.addEventListener('click', close);
    ov?.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) open(); else if (dx < 0) close();
    }, { passive: false });
}

/* ---------- 17. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}
function triggerUpload() { document.getElementById('fileInput')?.click(); }

/* ---------- 18. INIT ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    if (!user) return;
    await loadProfile();
    if (!basketteurProfile) return;
    await loadScoutingData();
    initUserMenu();
    initSidebar();
    initAttrTabs();
    document.getElementById('fileInput')?.addEventListener('change', e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); });
    document.getElementById('deleteAvatarBtn')?.addEventListener('click', deleteAvatar);
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(l => l.addEventListener('click', e => { e.preventDefault(); logout(); }));
    document.getElementById('langSelect')?.addEventListener('change', e => { showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info'); });
    window.triggerUpload = triggerUpload;
    window.copyID = copyID;
    window.showToast = showToast;
});