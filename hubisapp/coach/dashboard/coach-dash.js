/* ============================================================
   HubISoccer — coach-dash.js
   Espace Coach / Entraîneur · Corps · Âme · Esprit
   Version remodelée :
   - Convention : supabaseAuthPrive_[espace]_[page]
   - Table de cette page : supabaseAuthPrive_coach_dash
   - Widgets de pilotage (lecture des tables des autres pages)
   - Vocabulaire : "talent" (sportif OU artiste), plus "joueur"
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES (convention supabaseAuthPrive_[espace]_[page]) ----------
   - PROFILES_TABLE : table PARTAGÉE de toute la plateforme (pas de suffixe page)
   - DASH_TABLE     : table de CETTE page (données carrière du coach)
   - Les tables ci-dessous appartiennent à d'AUTRES pages de l'espace coach.
     Le tableau de bord ne fait que les LIRE pour afficher les compteurs.       */
const PROFILES_TABLE  = 'supabaseAuthPrive_profiles';           // partagée
const DASH_TABLE      = 'supabaseAuthPrive_coach_dash';         // page tableau de bord
const TALENTS_TABLE   = 'supabaseAuthPrive_coach_talents';      // page Mes Talents (liaisons coach↔talent)
const EVAL_TABLE      = 'supabaseAuthPrive_coach_eval';         // page Évaluations & Scouting
const PLANNING_TABLE  = 'supabaseAuthPrive_coach_planning';     // page Planning & Séances
const TRIPLE_TABLE    = 'supabaseAuthPrive_coach_triple';       // page Suivi Triple Projet
const AVATAR_BUCKET   = 'avatars-coach';

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser  = null;
let coachProfile = null;
let dashData     = null;

/* ---------- 4. LOADER ---------- */
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

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
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

/* ---------- 6. UTILITAIRES ---------- */
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

/* ---------- 9. CHARGEMENT PROFIL (table partagée) ---------- */
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
    coachProfile = data;
    document.getElementById('userName').textContent = coachProfile.full_name || 'Coach / Entraîneur';
    return coachProfile;
}

/* ---------- 10. CHARGEMENT DONNÉES DE CETTE PAGE (coach_dash) ---------- */
async function loadDashData() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(DASH_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .maybeSingle();
    hideLoader();
    if (error) {
        showToast('Erreur chargement des données', 'error');
        return;
    }
    if (data) {
        dashData = data;
    } else {
        /* Première visite : créer la ligne de données de la page dashboard */
        const { data: nd, error: ie } = await supabaseClient
            .from(DASH_TABLE)
            .insert([{ coach_id: coachProfile.hubisoccer_id }])
            .select()
            .single();
        if (ie) {
            showToast('Erreur initialisation', 'error');
            return;
        }
        dashData = nd;
    }
    updateProfileUI();
    updateDataUI();
}

/* ---------- 11. WIDGETS DE PILOTAGE ----------
   Lecture SEULE des tables appartenant aux autres pages de l'espace.
   Chaque compteur est indépendant : si une table n'existe pas encore
   (page pas encore construite), on affiche 0 sans bloquer la page.   */
async function loadPilotWidgets() {
    if (!coachProfile) {
        return;
    }
    const coachId = coachProfile.hubisoccer_id;

    /* 11a. Talents encadrés (liaisons acceptées) + demandes en attente */
    try {
        const { data: liaisons, error } = await supabaseClient
            .from(TALENTS_TABLE)
            .select('id, statut, talent_type')
            .eq('coach_id', coachId);
        if (!error && liaisons) {
            const acceptes = liaisons.filter(function(l) { return l.statut === 'accepted'; });
            const attente  = liaisons.filter(function(l) { return l.statut === 'pending'; });
            setText('pilotTalents',  acceptes.length);
            setText('pilotDemandes', attente.length);
            /* Répartition sportifs / artistes dans le sous-texte */
            const nbSport   = acceptes.filter(function(l) { return l.talent_type === 'sportif'; }).length;
            const nbArtiste = acceptes.filter(function(l) { return l.talent_type === 'artiste'; }).length;
            setText('pilotTalentsSub', nbSport + ' sportif(s) · ' + nbArtiste + ' artiste(s)');
            /* Badge de notification = demandes en attente */
            setText('notifBadge', attente.length);
        }
    } catch (e) {
        console.warn('Table talents pas encore disponible :', e.message);
    }

    /* 11b. Évaluations à faire ce mois-ci */
    try {
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);
        const { data: evals, error } = await supabaseClient
            .from(EVAL_TABLE)
            .select('id, statut, created_at')
            .eq('coach_id', coachId)
            .eq('statut', 'pending');
        if (!error && evals) {
            setText('pilotEvals', evals.length);
        }
    } catch (e) {
        console.warn('Table évaluations pas encore disponible :', e.message);
    }

    /* 11c. Prochaine séance planifiée */
    try {
        const maintenant = new Date().toISOString();
        const { data: seances, error } = await supabaseClient
            .from(PLANNING_TABLE)
            .select('date_seance, theme')
            .eq('coach_id', coachId)
            .gte('date_seance', maintenant)
            .order('date_seance', { ascending: true })
            .limit(1);
        if (!error && seances && seances.length > 0) {
            const s = seances[0];
            const d = new Date(s.date_seance);
            setText('pilotSeance', d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
                                   ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
            setText('pilotSeanceTheme', s.theme || 'Séance planifiée');
        }
    } catch (e) {
        console.warn('Table planning pas encore disponible :', e.message);
    }

    /* 11d. Alertes Triple Projet (Sport · Étude · Carrière) */
    try {
        const { data: alertes, error } = await supabaseClient
            .from(TRIPLE_TABLE)
            .select('talent_nom, volet, message, created_at')
            .eq('coach_id', coachId)
            .eq('statut', 'active')
            .order('created_at', { ascending: false })
            .limit(5);
        if (!error && alertes && alertes.length > 0) {
            renderAlertes(alertes);
        }
    } catch (e) {
        console.warn('Table triple projet pas encore disponible :', e.message);
    }
}

/* ---------- 12. RENDU DES ALERTES TRIPLE PROJET ---------- */
function renderAlertes(alertes) {
    const list  = document.getElementById('alertsList');
    const empty = document.getElementById('alertsEmpty');
    if (!list) {
        return;
    }
    if (empty) {
        empty.style.display = 'none';
    }
    const icons = {
        sport    : 'fa-futbol',
        etude    : 'fa-graduation-cap',
        carriere : 'fa-briefcase'
    };
    alertes.forEach(function(a) {
        const volet = a.volet || 'sport';
        const item = document.createElement('div');
        item.className = 'alert-item ' + volet;
        item.innerHTML =
            '<i class="fas ' + (icons[volet] || icons.sport) + '"></i>' +
            '<div><span class="alert-talent">' + (a.talent_nom || 'Talent') + '</span> — ' +
            (a.message || 'Alerte à vérifier.') + '</div>';
        list.appendChild(item);
    });
}

/* ---------- 13. UI PROFIL ---------- */
function updateProfileUI() {
    if (!coachProfile) {
        return;
    }
    const pro = coachProfile;
    setText('dashboardName',         pro.full_name);
    setText('coachFullName',         pro.full_name);
    setText('coachPseudo',           pro.pseudo);
    setText('coachPhone',            pro.phone);
    setText('coachEmail',            pro.email);
    setText('coachNationality',      pro.nationality);
    setText('coachSpecialite',       pro.specialite);
    setText('coachClub',             pro.club || pro.structure || pro.organisme || pro.nom_cabinet);
    setText('coachAge',              calculateAge(pro.date_of_birth));
    setText('coachID',               'ID : ' + (pro.hubisoccer_id || ''));
    setText('profileCompletion',     pro.profile_completion || 0);
    setText('scoutingViews',         pro.scouting_views || 0);
    setText('recruiterFavs',         pro.recruiter_favs || 0);
    setText('coachPosition',         pro.specialite || 'Spécialité non renseignée');
    const flag = flagMap[pro.country || ''] || '🌍';
    setText('coachCountryFlag', flag);
    setText('coachCountryName', pro.country);
    updateAvatarDisplay();
    updateProfileCompletion();
}

/* ---------- 14. UI DONNÉES DE LA PAGE (coach_dash) ---------- */
function updateDataUI() {
    if (!dashData) {
        return;
    }
    const d = dashData;

    /* Domaine d'encadrement : sportif, artiste ou les deux */
    const domaineEl = document.getElementById('coachDomaine');
    if (domaineEl) {
        let domaineTxt = 'Domaine : —';
        let domaineIco = 'fa-globe';
        if (d.domaine === 'sportif') {
            domaineTxt = 'Coach Sportif';
            domaineIco = 'fa-futbol';
        } else if (d.domaine === 'artiste') {
            domaineTxt = 'Coach Artistique';
            domaineIco = 'fa-music';
        } else if (d.domaine === 'mixte') {
            domaineTxt = 'Coach Sportif & Artistique';
            domaineIco = 'fa-star';
        }
        domaineEl.innerHTML = '<i class="fas ' + domaineIco + '"></i> ' + domaineTxt;
    }

    /* Statistiques carrière globales */
    setText('nbJoueurs', d.total_talents_entraines != null ? d.total_talents_entraines : '—');
    setText('nbMatchs',  d.matchs_diriges != null ? d.matchs_diriges : '—');
    setText('tauxVict',  d.taux_reussite != null ? d.taux_reussite : '—');
    setText('nbCertifs', d.certifications_actives != null ? d.certifications_actives : '—');

    /* Situation contractuelle */
    setText('salary',         d.salaire ? formatMoney(d.salaire) : (d.honoraires ? formatMoney(d.honoraires) : '—'));
    setText('contractExpiry', d.expire_le ? new Date(d.expire_le).toLocaleDateString('fr-FR') : '—');
    setText('marketValue',    d.valeur_marche ? formatMoney(d.valeur_marche) : '—');
    setText('statutPro',      d.statut_professionnel);

    /* Compétences (valeurs numériques onglet Esprit) */
    setText('cp_tac', d.comp_tactique != null ? d.comp_tactique : 0);
    setText('cp_com', d.comp_communication != null ? d.comp_communication : 0);
    setText('cp_mot', d.comp_motivation != null ? d.comp_motivation : 0);
    setText('cp_vid', d.comp_analyse_video != null ? d.comp_analyse_video : 0);
    setText('cp_phy', d.comp_preparation_physique != null ? d.comp_preparation_physique : 0);
    setText('cp_sco', d.comp_scouting_adverse != null ? d.comp_scouting_adverse : 0);
    setText('cp_grp', d.comp_gestion_groupe != null ? d.comp_gestion_groupe : 0);
    setText('cp_lea', d.comp_leadership != null ? d.comp_leadership : 0);
    setText('cp_str', d.comp_gestion_stress != null ? d.comp_gestion_stress : 0);
    setText('cp_jeu', d.comp_formation_jeunes != null ? d.comp_formation_jeunes : 0);
    setText('cp_psy', d.comp_psychologie != null ? d.comp_psychologie : 0);
    setText('cp_dec', d.comp_prise_decision != null ? d.comp_prise_decision : 0);

    /* Résultats & Bilan (onglet Âme) */
    setText('re_jou', d.total_talents_entraines != null ? d.total_talents_entraines : 0);
    setText('re_mat', d.matchs_diriges != null ? d.matchs_diriges : 0);
    setText('re_vic', d.nb_victoires != null ? d.nb_victoires : 0);
    setText('re_tau', d.taux_reussite != null ? d.taux_reussite : 0);
    setText('re_tit', d.nb_titres != null ? d.nb_titres : 0);
    setText('re_exp', d.annees_experience != null ? d.annees_experience : 0);
    setText('re_clu', d.nb_clubs != null ? d.nb_clubs : 0);

    /* Contrat & Licence (onglet Corps) */
    setText('co_clu', d.club_actuel || '—');
    setText('co_niv', d.niveau_competition || '—');
    setText('co_sal', d.salaire ? formatMoney(d.salaire) : '—');
    setText('co_dur', d.duree_contrat || '—');
    setText('co_exp', d.expire_le ? new Date(d.expire_le).toLocaleDateString('fr-FR') : '—');
    setText('co_uef', d.licence_uefa || '—');
    setText('co_caf', d.licence_caf || '—');
    setText('co_not', d.note_professionnelle || '—');

    /* Barres de compétences principales */
    setSkill('skill_tact',     d.comp_tactique             || 0);
    setSkill('skill_comm',     d.comp_communication        || 0);
    setSkill('skill_motiv',    d.comp_motivation           || 0);
    setSkill('skill_video',    d.comp_analyse_video        || 0);
    setSkill('skill_physique', d.comp_preparation_physique || 0);
    setSkill('skill_mental',   d.comp_psychologie          || 0);
    setSkill('skill_groupe',   d.comp_gestion_groupe       || 0);
    setSkill('skill_lead',     d.comp_leadership           || 0);

    /* Notes & Évaluations reçues */
    setText('scoutingReports', d.rapports || 'Aucune note pour le moment.');
}

/* ---------- 15. AVATAR ---------- */
function updateAvatarDisplay() {
    const pi = document.getElementById('profileDisplay');
    const pr = document.getElementById('profileDisplayInitials');
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const db = document.getElementById('deleteAvatarBtn');
    const url = coachProfile?.avatar_url;
    if (url && url !== '') {
        if (pi) { pi.src = url; pi.style.display = 'block'; }
        if (pr) { pr.style.display = 'none'; }
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
        if (db) { db.style.display = 'inline-flex'; }
    } else {
        const init = getInitials(coachProfile?.full_name || 'X');
        if (pr) { pr.textContent = init; pr.style.display = 'flex'; }
        if (pi) { pi.style.display = 'none'; }
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
        if (db) { db.style.display = 'none'; }
    }
}

async function updateProfileCompletion() {
    if (!coachProfile) {
        return;
    }
    const fields = ['full_name', 'pseudo', 'phone', 'country', 'date_of_birth'];
    let filled = 0;
    for (let i = 0; i < fields.length; i++) {
        if (coachProfile[fields[i]] && coachProfile[fields[i]] !== '') {
            filled++;
        }
    }
    const pct = Math.round((filled / fields.length) * 100);
    if (coachProfile.profile_completion !== pct) {
        await supabaseClient
            .from(PROFILES_TABLE)
            .update({ profile_completion: pct })
            .eq('hubisoccer_id', coachProfile.hubisoccer_id);
        coachProfile.profile_completion = pct;
        setText('profileCompletion', pct);
    }
}

async function uploadAvatar(file) {
    if (!currentUser || !coachProfile) {
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
    const fn = 'coach_' + currentUser.id + '_' + Date.now() + '.' + ext;
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
        .eq('hubisoccer_id', coachProfile.hubisoccer_id);
    hideLoader();
    coachProfile.avatar_url = ud.publicUrl;
    updateAvatarDisplay();
    showToast('Photo mise à jour ✅', 'success');
}

async function deleteAvatar() {
    if (!coachProfile || !confirm('Supprimer la photo de profil ?')) {
        return;
    }
    showLoader();
    await supabaseClient
        .from(PROFILES_TABLE)
        .update({ avatar_url: '' })
        .eq('hubisoccer_id', coachProfile.hubisoccer_id);
    hideLoader();
    coachProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}

/* ---------- 16. COPIER ID ---------- */
async function copyID() {
    const id = coachProfile?.hubisoccer_id;
    if (!id) {
        return;
    }
    try {
        await navigator.clipboard.writeText(id);
        const span = document.getElementById('coachID');
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

/* ---------- 17. ONGLETS ---------- */
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

/* ---------- 18. MENU UTILISATEUR ---------- */
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

/* ---------- 19. SIDEBAR + SWIPE ---------- */
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

/* ---------- 20. DÉCONNEXION ---------- */
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

/* ---------- 21. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadDashData();
    await loadPilotWidgets();
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
