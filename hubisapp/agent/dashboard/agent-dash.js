/* ============================================================
   HubISoccer — agent-dash.js
   Espace Agent FIFA · Corps · Âme · Esprit
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
let agentProfile        = null;
let scoutingData        = null;
const AVATAR_BUCKET     = 'avatars-agent';
const PROFILES_TABLE    = 'supabaseAuthPrive_profiles';
const SCOUTING_TABLE    = 'supabaseAuthPrive_agent_scouting';

/* ---------- 3. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'flex';
    }
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'none';
    }
}

/* ---------- 4. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
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
        setTimeout(function() {
            if (t.parentNode) {
                t.remove();
            }
        }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (t.parentNode) {
                    t.remove();
                }
            }, 320);
        }
    }, duration);
}

/* ---------- 5. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (value !== null && value !== undefined) {
            el.textContent = value;
        } else {
            el.textContent = '—';
        }
    }
}

function formatMoney(v) {
    if (!v || isNaN(v)) {
        return '— €';
    }
    const n = Number(v);
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + ' M€';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(0) + ' K€';
    }
    return n.toLocaleString('fr-FR') + ' €';
}

function calculateAge(d) {
    if (!d) {
        return '—';
    }
    const today = new Date();
    const birth = new Date(d);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function setSkill(id, v) {
    const bar = document.getElementById(id);
    const span = document.getElementById(id + '_value');
    if (bar) {
        bar.style.width = Math.min(v, 100) + '%';
    }
    if (span) {
        span.textContent = v;
    }
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
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    const error = !session;
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
    agentProfile = data;
    document.getElementById('userName').textContent = agentProfile.full_name || 'Agent FIFA';
    return agentProfile;
}

/* ---------- 9. CHARGEMENT DONNÉES AGENT ---------- */
async function loadScoutingData() {
    if (!agentProfile) {
        return;
    }
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

/* ---------- 10. UI PROFIL ---------- */
function updateProfileUI() {
    if (!agentProfile) {
        return;
    }
    const pro = agentProfile;
    setText('dashboardName',         pro.full_name);
    setText('agentFullName',         pro.full_name);
    setText('agentPseudo',           pro.pseudo);
    setText('agentPhone',            pro.phone);
    setText('agentEmail',            pro.email);
    setText('agentNationality',      pro.nationality);
    setText('agentSpecialite',       pro.type_activite);
    setText('agentClub',             pro.club || pro.structure || pro.organisme || pro.nom_cabinet);
    setText('agentAge',              calculateAge(pro.date_of_birth));
    setText('agentID',               'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion',     pro.profile_completion || 0);
    setText('scoutingViews',         pro.scouting_views || 0);
    setText('recruiterFavs',         pro.recruiter_favs || 0);
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('agentCountryFlag', flag);
    setText('agentCountryName', pro.country);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 11. UI DONNÉES AGENT ---------- */
function updateDataUI() {
    if (!scoutingData) {
        return;
    }
    const d = scoutingData;

    // Situation contractuelle
    setText('salary',         d.salaire ? formatMoney(d.salaire) : (d.honoraires ? formatMoney(d.honoraires) : '—'));
    setText('contractExpiry', d.expire_le ? new Date(d.expire_le).toLocaleDateString('fr-FR') : '—');
    setText('marketValue',    d.valeur_marche ? formatMoney(d.valeur_marche) : (d.chiffre_affaires ? formatMoney(d.chiffre_affaires) : '—'));
    setText('statutPro',      d.statut_professionnel);

    // Compétences (valeurs numériques)
    setText('cp_neg', d.comp_negociation != null ? d.comp_negociation : 0);
    setText('cp_drt', d.comp_droit_travail != null ? d.comp_droit_travail : 0);
    setText('cp_fif', d.comp_reglementation_fifa != null ? d.comp_reglementation_fifa : 0);
    setText('cp_det', d.comp_detection_talents != null ? d.comp_detection_talents : 0);
    setText('cp_rn',  d.comp_reseau_clubs_national != null ? d.comp_reseau_clubs_national : 0);
    setText('cp_ri',  d.comp_reseau_clubs_international != null ? d.comp_reseau_clubs_international : 0);
    setText('cp_mkt', d.comp_marketing_joueur != null ? d.comp_marketing_joueur : 0);
    setText('cp_car', d.comp_gestion_carriere != null ? d.comp_gestion_carriere : 0);
    setText('cp_com', d.comp_communication != null ? d.comp_communication : 0);
    setText('cp_vid', d.comp_analyse_video != null ? d.comp_analyse_video : 0);
    setText('cp_mar', d.comp_connaissance_marches != null ? d.comp_connaissance_marches : 0);
    setText('cp_lan', d.comp_langues != null ? d.comp_langues : 0);
    setText('cp_eth', d.comp_ethique != null ? d.comp_ethique : 0);

    // Activité & Résultats
    setText('ac_jou', d.joueurs_sous_contrat != null ? d.joueurs_sous_contrat : 0);
    setText('ac_tra', d.transferts_realises != null ? d.transferts_realises : 0);
    setText('ac_mon', d.montant_total_transferts ? formatMoney(d.montant_total_transferts) : '—');
    setText('ac_com', d.commissions_percues ? formatMoney(d.commissions_percues) : '—');
    setText('ac_clu', d.clubs_partenaires != null ? d.clubs_partenaires : 0);
    setText('ac_pay', d.pays_couverts != null ? d.pays_couverts : 0);
    setText('ac_exp', d.annees_experience != null ? d.annees_experience : 0);
    setText('ac_suc', d.taux_succes != null ? d.taux_succes : 0);

    // Licence & Structure
    setText('li_num', d.numero_licence_fifa || '—');
    setText('li_dat', d.date_obtention_licence ? new Date(d.date_obtention_licence).toLocaleDateString('fr-FR') : '—');
    setText('li_exp', d.expire_licence ? new Date(d.expire_licence).toLocaleDateString('fr-FR') : '—');
    setText('li_cab', d.nom_cabinet || '—');
    setText('li_pay', d.pays_exercice || '—');
    setText('li_ca',  d.chiffre_affaires ? formatMoney(d.chiffre_affaires) : '—');
    setText('li_col', d.nb_collaborateurs != null ? d.nb_collaborateurs : 0);
    setText('li_not', d.note_professionnelle || 'Aucun rapport.');

    // Barres de compétences principales
    setSkill('skill_nego',    d.skill_nego    || 0);
    setSkill('skill_prospect',d.skill_prospect|| 0);
    setSkill('skill_reseau',  d.skill_reseau  || 0);
    setSkill('skill_jur',     d.skill_jur     || 0);
    setSkill('skill_mkt',     d.skill_mkt     || 0);
    setSkill('skill_comm',    d.skill_comm    || 0);
    setSkill('skill_gest',    d.skill_gest    || 0);
    setSkill('skill_ethique', d.skill_ethique || 0);
}

/* ---------- 12. AVATAR ---------- */
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
    if (!agentProfile) {
        return;
    }
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (agentProfile[fields[i]] && agentProfile[fields[i]] !== '') {
            filled++;
        }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (agentProfile.profile_completion !== pct) {
        await supabaseClient
            .from(PROFILES_TABLE)
            .update({ profile_completion: pct })
            .eq('hubisoccer_id', agentProfile.hubisoccer_id);
        agentProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !agentProfile) {
        return;
    }
    if (file.size > 3 * 1024 * 1024) {
        showToast('Max 3 Mo', 'warning');
        return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning');
        return;
    }
    showLoader();
    const ext = file.name.split('.').pop().toLowerCase();
    const fn = 'agent_' + currentUser.id + '_' + Date.now() + '.' + ext;
    const { error: ue } = await supabaseClient.storage
        .from(AVATAR_BUCKET)
        .upload(fn, file, { upsert: true });
    if (ue) {
        hideLoader();
        showToast('Erreur upload: ' + ue.message, 'error');
        return;
    }
    const { data: ud } = supabaseClient.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(fn);
    await supabaseClient
        .from(PROFILES_TABLE)
        .update({ avatar_url: ud.publicUrl })
        .eq('hubisoccer_id', agentProfile.hubisoccer_id);
    hideLoader();
    agentProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!agentProfile || !confirm('Supprimer la photo de profil ?')) {
        return;
    }
    showLoader();
    await supabaseClient
        .from(PROFILES_TABLE)
        .update({ avatar_url: '' })
        .eq('hubisoccer_id', agentProfile.hubisoccer_id);
    hideLoader();
    agentProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 13. COPIER ID ---------- */
async function copyID() {
    const id = agentProfile?.hubisoccer_id;
    if (!id) {
        return;
    }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('agentID');
        if (span) {
            const old = span.innerText;
            span.innerText = 'Copié ! ✅';
            setTimeout(function() {
                span.innerText = old;
            }, 2200);
        }
    } catch (e) {
        showToast('Erreur copie', 'error');
    }
}

/* ---------- 14. ONGLETS ---------- */
function initAttrTabs() {
    document.querySelectorAll('.attr-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.attr-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            document.querySelectorAll('.attr-content').forEach(function(c) {
                c.classList.remove('active');
            });
            tab.classList.add('active');
            const cat = tab.dataset.cat;
            const container = document.getElementById(cat + '-attrs');
            if (container) {
                container.classList.add('active');
            }
        });
    });
}

/* ---------- 15. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) {
        return;
    }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

/* ---------- 16. SIDEBAR + SWIPE ---------- */
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
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        if (dx > 0 && sx < 40) {
            open();
        } else if (dx < 0) {
            close();
        }
    }, { passive: false });
}

/* ---------- 17. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

function triggerUpload() {
    const input = document.getElementById('fileInput');
    if (input) {
        input.click();
    }
}

/* ---------- 18. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!agentProfile) {
        return;
    }
    await loadScoutingData();
    initUserMenu();
    initSidebar();
    initAttrTabs();

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const f = e.target.files?.[0];
            if (f) {
                uploadAvatar(f);
            }
        });
    }

    const deleteBtn = document.getElementById('deleteAvatarBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteAvatar);
    }

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
