/* ============================================================
   HubISoccer — foot-dash.js
   Dashboard Footballeur · Corps · Âme · Esprit
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser        = null;
let footballeurProfile = null;
let scoutingData       = null;

const AVATAR_BUCKET    = 'avatars-footballeur';   // Bucket spécifique au rôle footballeur
const MAX_AVATAR_SIZE  = 800 * 1024;              // 800 Ko

// Notifications
let notificationsUnreadCount = 0;
let notificationSubscription = null;
let currentNotificationData = null; // pour la modale
// Fin état global

// Début fonction showLoader
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}
// Fin fonction showLoader

// Début fonction hideLoader
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}
// Fin fonction hideLoader

// Début fonction showToast
function showToast(message, type = 'info', duration = 10000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id        = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle',
    };

    const toast        = document.createElement('div');
    toast.className    = `toast ${type}`;
    toast.innerHTML    = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Fermer">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        dismissToast(toast);
    });

    setTimeout(() => dismissToast(toast), duration);
}
// Fin fonction showToast

// Début fonction dismissToast
function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 320);
}
// Fin fonction dismissToast

// Début fonction setText
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = (value !== null && value !== undefined) ? value : '—';
}
// Fin fonction setText

// Début fonction formatMoney
function formatMoney(value, countryCode = 'FR') {
    if (!value || isNaN(value)) return '—';
    const num = Number(value);
    const currency = getCurrencyFromCountry(countryCode);
    const formatted = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 0
    }).format(num);
    return formatted;
}
// Fin fonction formatMoney

// Début fonction getCurrencyFromCountry
function getCurrencyFromCountry(countryCode) {
    const currencyMap = {
        'BJ': { code: 'XOF', locale: 'fr-BJ' },
        'BF': { code: 'XOF', locale: 'fr-BF' },
        'CI': { code: 'XOF', locale: 'fr-CI' },
        'GW': { code: 'XOF', locale: 'pt-GW' },
        'ML': { code: 'XOF', locale: 'fr-ML' },
        'NE': { code: 'XOF', locale: 'fr-NE' },
        'SN': { code: 'XOF', locale: 'fr-SN' },
        'TG': { code: 'XOF', locale: 'fr-TG' },
        'CM': { code: 'XAF', locale: 'fr-CM' },
        'CF': { code: 'XAF', locale: 'fr-CF' },
        'TD': { code: 'XAF', locale: 'fr-TD' },
        'CG': { code: 'XAF', locale: 'fr-CG' },
        'GQ': { code: 'XAF', locale: 'es-GQ' },
        'GA': { code: 'XAF', locale: 'fr-GA' },
        'FR': { code: 'EUR', locale: 'fr-FR' },
        'DE': { code: 'EUR', locale: 'de-DE' },
        'IT': { code: 'EUR', locale: 'it-IT' },
        'ES': { code: 'EUR', locale: 'es-ES' },
        'PT': { code: 'EUR', locale: 'pt-PT' },
        'NL': { code: 'EUR', locale: 'nl-NL' },
        'BE': { code: 'EUR', locale: 'fr-BE' },
        'LU': { code: 'EUR', locale: 'fr-LU' },
        'US': { code: 'USD', locale: 'en-US' },
        'GB': { code: 'GBP', locale: 'en-GB' },
        'NG': { code: 'NGN', locale: 'en-NG' },
        'GH': { code: 'GHS', locale: 'en-GH' },
        'ZA': { code: 'ZAR', locale: 'en-ZA' },
        'KE': { code: 'KES', locale: 'sw-KE' },
        'MA': { code: 'MAD', locale: 'ar-MA' },
        'DZ': { code: 'DZD', locale: 'ar-DZ' },
        'TN': { code: 'TND', locale: 'ar-TN' },
        'EG': { code: 'EGP', locale: 'ar-EG' },
        'RU': { code: 'RUB', locale: 'ru-RU' },
        'CN': { code: 'CNY', locale: 'zh-CN' },
        'JP': { code: 'JPY', locale: 'ja-JP' },
        'IN': { code: 'INR', locale: 'hi-IN' },
        'BR': { code: 'BRL', locale: 'pt-BR' },
        'CA': { code: 'CAD', locale: 'en-CA' },
        'AU': { code: 'AUD', locale: 'en-AU' },
    };
    return currencyMap[countryCode] || { code: 'EUR', locale: 'fr-FR' };
}
// Fin fonction getCurrencyFromCountry

// Début fonction calculateAge
function calculateAge(dateString) {
    if (!dateString) return 0;
    const today     = new Date();
    const birthDate = new Date(dateString);
    let age         = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
// Fin fonction calculateAge

// Début fonction getInitials
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}
// Fin fonction getInitials

// Début objet flagMap (197 pays)
const flagMap = {
    'AF': '🇦🇫', 'ZA': '🇿🇦', 'AL': '🇦🇱', 'DZ': '🇩🇿', 'DE': '🇩🇪',
    'AD': '🇦🇩', 'AO': '🇦🇴', 'AG': '🇦🇬', 'SA': '🇸🇦', 'AR': '🇦🇷',
    'AM': '🇦🇲', 'AU': '🇦🇺', 'AT': '🇦🇹', 'AZ': '🇦🇿', 'BS': '🇧🇸',
    'BH': '🇧🇭', 'BD': '🇧🇩', 'BB': '🇧🇧', 'BE': '🇧🇪', 'BZ': '🇧🇿',
    'BJ': '🇧🇯', 'BT': '🇧🇹', 'BY': '🇧🇾', 'MM': '🇲🇲', 'BO': '🇧🇴',
    'BA': '🇧🇦', 'BW': '🇧🇼', 'BR': '🇧🇷', 'BN': '🇧🇳', 'BG': '🇧🇬',
    'BF': '🇧🇫', 'BI': '🇧🇮', 'KH': '🇰🇭', 'CM': '🇨🇲', 'CA': '🇨🇦',
    'CV': '🇨🇻', 'CL': '🇨🇱', 'CN': '🇨🇳', 'CY': '🇨🇾', 'CO': '🇨🇴',
    'KM': '🇰🇲', 'CG': '🇨🇬', 'CD': '🇨🇩', 'KR': '🇰🇷', 'KP': '🇰🇵',
    'CR': '🇨🇷', 'CI': '🇨🇮', 'HR': '🇭🇷', 'CU': '🇨🇺', 'DK': '🇩🇰',
    'DJ': '🇩🇯', 'DO': '🇩🇴', 'DM': '🇩🇲', 'EG': '🇪🇬', 'AE': '🇦🇪',
    'EC': '🇪🇨', 'ER': '🇪🇷', 'ES': '🇪🇸', 'EE': '🇪🇪', 'SZ': '🇸🇿',
    'US': '🇺🇸', 'ET': '🇪🇹', 'FJ': '🇫🇯', 'FI': '🇫🇮', 'FR': '🇫🇷',
    'GA': '🇬🇦', 'GM': '🇬🇲', 'GE': '🇬🇪', 'GH': '🇬🇭', 'GR': '🇬🇷',
    'GD': '🇬🇩', 'GT': '🇬🇹', 'GN': '🇬🇳', 'GW': '🇬🇼', 'GQ': '🇬�600',
    'GY': '🇬🇾', 'HT': '🇭🇹', 'HN': '🇭🇳', 'HU': '🇭🇺', 'IN': '🇮🇳',
    'ID': '🇮🇩', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IE': '🇮🇪', 'IS': '🇮🇸',
    'IL': '🇮🇱', 'IT': '🇮🇹', 'JM': '🇯🇲', 'JP': '🇯🇵', 'JO': '🇯🇴',
    'KZ': '🇰🇿', 'KE': '🇰🇪', 'KG': '🇰🇬', 'KI': '🇰🇮', 'KW': '🇰🇼',
    'LA': '🇱🇦', 'LS': '🇱🇸', 'LV': '🇱🇻', 'LB': '🇱🇧', 'LR': '🇱🇷',
    'LY': '🇱🇾', 'LI': '🇱🇮', 'LT': '🇱🇹', 'LU': '🇱🇺', 'MK': '🇲🇰',
    'MG': '🇲🇬', 'MY': '🇲🇾', 'MW': '🇲🇼', 'MV': '🇲🇻', 'ML': '🇲🇱',
    'MT': '🇲🇹', 'MA': '🇲🇦', 'MH': '🇲🇭', 'MU': '🇲🇺', 'MR': '🇲🇷',
    'MX': '🇲🇽', 'FM': '🇫🇲', 'MD': '🇲🇩', 'MC': '🇲🇨', 'MN': '🇲🇳',
    'ME': '🇲🇪', 'MZ': '🇲🇿', 'NA': '🇳🇦', 'NR': '🇳🇷', 'NP': '🇳🇵',
    'NI': '🇳🇮', 'NE': '🇳🇪', 'NG': '🇳🇬', 'NO': '🇳🇴', 'NZ': '🇳🇿',
    'OM': '🇴🇲', 'UG': '🇺🇬', 'UZ': '🇺🇿', 'PK': '🇵🇰', 'PW': '🇵🇼',
    'PA': '🇵🇦', 'PG': '🇵🇬', 'PY': '🇵🇾', 'NL': '🇳🇱', 'PE': '🇵🇪',
    'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹', 'QA': '🇶🇦', 'CF': '🇨🇫',
    'CZ': '🇨🇿', 'RO': '🇷🇴', 'GB': '🇬🇧', 'RU': '🇷🇺', 'RW': '🇷🇼',
    'KN': '🇰🇳', 'LC': '🇱🇨', 'SM': '🇸🇲', 'VC': '🇻🇨', 'SB': '🇸🇧',
    'SV': '🇸🇻', 'WS': '🇼🇸', 'ST': '🇸🇹', 'SN': '🇸🇳', 'RS': '🇷🇸',
    'SC': '🇸🇨', 'SL': '🇸🇱', 'SG': '🇸🇬', 'SK': '🇸🇰', 'SI': '🇸🇮',
    'SO': '🇸🇴', 'SD': '🇸🇩', 'SS': '🇸🇸', 'LK': '🇱🇰', 'SE': '🇸🇪',
    'CH': '🇨🇭', 'SR': '🇸🇷', 'SY': '🇸🇾', 'TJ': '🇹🇯', 'TZ': '🇹🇿',
    'TD': '🇹🇩', 'TH': '🇹🇭', 'TL': '🇹🇱', 'TG': '🇹🇬', 'TO': '🇹🇴',
    'TT': '🇹🇹', 'TN': '🇹🇳', 'TM': '🇹🇲', 'TR': '🇹🇷', 'TV': '🇹🇻',
    'UA': '🇺🇦', 'UY': '🇺🇾', 'VU': '🇻🇺', 'VA': '🇻🇦', 'VE': '🇻🇪',
    'VN': '🇻🇳', 'YE': '🇾🇪', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
};
// Fin objet flagMap

// Début fonction checkSession
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
// Fin fonction checkSession

// Début fonction loadFootballeurProfile
async function loadFootballeurProfile() {
    showLoader();

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();

    hideLoader();

    if (error) {
        console.error('Erreur chargement profil :', error);
        showToast('Erreur lors du chargement du profil', 'error');
        return null;
    }

    footballeurProfile = data;

    if (footballeurProfile.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => {
            window.location.href = '../../authprive/users/login.html';
        }, 2000);
        return null;
    }

    document.getElementById('userName').textContent =
        footballeurProfile.full_name || footballeurProfile.display_name || 'Footballeur';

    return footballeurProfile;
}
// Fin fonction loadFootballeurProfile

// Début fonction loadScoutingData
async function loadScoutingData() {
    if (!footballeurProfile) return;

    showLoader();

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_footballeur_scouting')
        .select('*')
        .eq('footballeur_hubisoccer_id', footballeurProfile.hubisoccer_id)
        .maybeSingle();

    hideLoader();

    if (error) {
        console.error('Erreur chargement scouting :', error);
        showToast('Erreur lors du chargement des données de scouting', 'error');
        return;
    }

    if (data) {
        scoutingData = data;
    } else {
        const { data: newData, error: insertError } = await supabaseClient
            .from('supabaseAuthPrive_footballeur_scouting')
            .insert([{ footballeur_hubisoccer_id: footballeurProfile.hubisoccer_id }])
            .select()
            .single();

        if (insertError) {
            console.error('Erreur création scouting :', insertError);
            showToast('Erreur lors de l\'initialisation des données', 'error');
            return;
        }

        scoutingData = newData;
    }

    updateUIWithProfile();
    updateScoutingUI();
}
// Fin fonction loadScoutingData

// Début fonction updateAvatarDisplay
function updateAvatarDisplay() {
    const profileImg      = document.getElementById('profileDisplay');
    const profileInitials = document.getElementById('profileDisplayInitials');
    const userAvatar      = document.getElementById('userAvatar');
    const userInitials    = document.getElementById('userAvatarInitials');
    const deleteBtn       = document.getElementById('deleteAvatarBtn');

    const avatarUrl = footballeurProfile?.avatar_url;

    if (avatarUrl && avatarUrl !== '') {
        if (profileImg) {
            profileImg.src           = avatarUrl;
            profileImg.style.display = 'block';
        }
        if (profileInitials) profileInitials.style.display = 'none';
        if (userAvatar) {
            userAvatar.src           = avatarUrl;
            userAvatar.style.display = 'block';
        }
        if (userInitials) userInitials.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
        const initials = getInitials(footballeurProfile?.full_name || footballeurProfile?.display_name || 'F');
        if (profileInitials) {
            profileInitials.textContent   = initials;
            profileInitials.style.display = 'flex';
        }
        if (profileImg) profileImg.style.display = 'none';
        if (userInitials) {
            userInitials.textContent   = initials;
            userInitials.style.display = 'flex';
        }
        if (userAvatar) userAvatar.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}
// Fin fonction updateAvatarDisplay

// Début fonction updateProfileCompletion
async function updateProfileCompletion() {
    if (!footballeurProfile) return;

    const fields = [
        'full_name', 'pseudo', 'phone', 'country', 'birth_date',
        'height', 'weight', 'preferred_foot', 'club', 'nationality'
    ];

    let filled = 0;
    fields.forEach(field => {
        if (footballeurProfile[field] && footballeurProfile[field] !== '') filled++;
    });

    const percentage = Math.round((filled / fields.length) * 100);

    if (footballeurProfile.profile_completion !== percentage) {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .update({ profile_completion: percentage })
            .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);

        if (!error) footballeurProfile.profile_completion = percentage;
    }

    setText('profileCompletion', percentage);
}
// Fin fonction updateProfileCompletion

// Début fonction updateUIWithProfile
function updateUIWithProfile() {
    if (!footballeurProfile) return;

    const displayName = footballeurProfile.full_name || footballeurProfile.display_name || '—';
    setText('dashboardName',       displayName);
    setText('footballeurFullName', displayName);
    setText('footballeurPosition', footballeurProfile.position    || 'Poste non renseigné');
    setText('footballeurPseudo',   footballeurProfile.pseudo      || '—');
    setText('footballeurPhone',    footballeurProfile.phone       || '—');
    setText('footballeurEmail',    footballeurProfile.email       || '—');
    setText('footballeurNationality', footballeurProfile.nationality || '—');
    setText('footballeurFoot',     footballeurProfile.preferred_foot || '—');
    setText('footballeurClub',     footballeurProfile.club        || '—');

    const age = calculateAge(footballeurProfile.birth_date);
    setText('footballeurAge',    age || '—');
    setText('footballeurHeight', footballeurProfile.height || '0');
    setText('footballeurWeight', footballeurProfile.weight || '0');

    const countryCode = footballeurProfile.country || 'FR';
    const flag        = flagMap[countryCode] || '🌍';
    setText('footballeurCountryFlag', flag);
    setText('footballeurCountryName', countryCode || '—');

    setText('footballeurID', `ID : ${footballeurProfile.hubisoccer_id || '—'}`);

    setText('profileCompletion', footballeurProfile.profile_completion || 0);
    setText('scoutingViews',     footballeurProfile.scouting_views     || 0);
    setText('recruiterFavs',     footballeurProfile.recruiter_favs     || 0);

    updateAvatarDisplay();
    updateProfileCompletion();
}
// Fin fonction updateUIWithProfile

// Début fonction updateScoutingUI
function updateScoutingUI() {
    if (!scoutingData) return;

    const s = scoutingData;
    const countryCode = footballeurProfile?.country || 'FR';

    setText('currentLevel', s.niveau_actuel   || 0);
    setText('potential',    s.potentiel       || 0);
    setText('personality',  s.personnalite    || 0);
    setText('marketValue',  formatMoney(s.valeur_marche || 0, countryCode));

    setText('loanFrom',       s.pret_info  || '—');
    setText('salary',         s.salaire    ? formatMoney(s.salaire, countryCode) : '—');
    setText('contractExpiry', s.expire_le
        ? new Date(s.expire_le).toLocaleDateString('fr-FR')
        : '—'
    );
    setText('youthSelection', s.selection_jeunes || '—');

    setText('tech_centres',       s.technique_centres       || 0);
    setText('tech_controle',      s.technique_controle_balle || 0);
    setText('tech_corners',       s.technique_corners       || 0);
    setText('tech_coups_francs',  s.technique_coups_francs  || 0);
    setText('tech_dribbles',      s.technique_dribbles      || 0);
    setText('tech_finition',      s.technique_finition      || 0);
    setText('tech_jeu_de_tete',   s.technique_jeu_de_tete   || 0);
    setText('tech_marquage',      s.technique_marquage      || 0);
    setText('tech_passes',        s.technique_passes        || 0);
    setText('tech_penalty',       s.technique_penalty       || 0);
    setText('tech_tactics',       s.technique_tactics       || 0);
    setText('tech_technique',     s.technique_technique     || 0);
    setText('tech_tirs_de_loin',  s.technique_tirs_de_loin  || 0);
    setText('tech_touches_longues', s.technique_touches_longues || 0);

    setText('mental_agressivite',    s.mental_agressivite    || 0);
    setText('mental_anticipation',   s.mental_anticipation   || 0);
    setText('mental_appels_de_balle', s.mental_appels_de_balle || 0);
    setText('mental_concentration',  s.mental_concentration  || 0);
    setText('mental_courage',        s.mental_courage        || 0);
    setText('mental_decisions',      s.mental_decisions      || 0);
    setText('mental_determination',  s.mental_determination  || 0);
    setText('mental_inspiration',    s.mental_inspiration    || 0);
    setText('mental_jeu_collectif',  s.mental_jeu_collectif  || 0);
    setText('mental_leadership',     s.mental_leadership     || 0);
    setText('mental_placement',      s.mental_placement      || 0);
    setText('mental_sang_froid',     s.mental_sang_froid     || 0);
    setText('mental_vision_du_jeu',  s.mental_vision_du_jeu  || 0);
    setText('mental_volume_de_jeu',  s.mental_volume_de_jeu  || 0);

    setText('physique_acceleration',           s.physique_acceleration           || 0);
    setText('physique_agilite',                s.physique_agilite                || 0);
    setText('physique_detente_verticale',      s.physique_detente_verticale      || 0);
    setText('physique_endurance',              s.physique_endurance              || 0);
    setText('physique_equilibre',              s.physique_equilibre              || 0);
    setText('physique_puissance',              s.physique_puissance              || 0);
    setText('physique_qualites_physiques_nat', s.physique_qualites_physiques_nat || 0);
    setText('physique_vitesse',                s.physique_vitesse                || 0);

    setText('scoutingReports', s.rapports_recruteurs || 'Aucun rapport pour le moment.');

    updateMainSkills();
}
// Fin fonction updateScoutingUI

// Début fonction average
function average(arr) {
    const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((acc, val) => acc + Number(val), 0) / valid.length);
}
// Fin fonction average

// Début fonction setSkill
function setSkill(elementId, value) {
    const bar       = document.getElementById(elementId);
    const valueSpan = document.getElementById(elementId + '_value');
    if (bar)       bar.style.width = Math.min(value, 100) + '%';
    if (valueSpan) valueSpan.textContent = value;
}
// Fin fonction setSkill

// Début fonction updateMainSkills
function updateMainSkills() {
    if (!scoutingData) return;
    const s = scoutingData;

    const defense = average([
        s.technique_marquage, s.mental_agressivite,
        s.mental_anticipation, s.physique_puissance
    ]);

    const mental = average([
        s.mental_agressivite, s.mental_anticipation, s.mental_appels_de_balle,
        s.mental_concentration, s.mental_courage, s.mental_decisions,
        s.mental_determination, s.mental_inspiration, s.mental_jeu_collectif,
        s.mental_leadership, s.mental_placement, s.mental_sang_froid,
        s.mental_vision_du_jeu, s.mental_volume_de_jeu
    ]);

    const physique = average([
        s.physique_acceleration, s.physique_agilite, s.physique_detente_verticale,
        s.physique_endurance, s.physique_equilibre, s.physique_puissance,
        s.physique_qualites_physiques_nat, s.physique_vitesse
    ]);

    const aerien = average([s.technique_jeu_de_tete, s.physique_detente_verticale]);
    const vitesse = average([s.physique_vitesse, s.physique_acceleration]);

    const technique = average([
        s.technique_centres, s.technique_controle_balle, s.technique_corners,
        s.technique_coups_francs, s.technique_dribbles, s.technique_finition,
        s.technique_jeu_de_tete, s.technique_marquage, s.technique_passes,
        s.technique_penalty, s.technique_tactics, s.technique_technique,
        s.technique_tirs_de_loin, s.technique_touches_longues
    ]);

    const vision = average([s.mental_vision_du_jeu, s.technique_passes, s.technique_tactics]);
    const attaque = average([s.technique_finition, s.technique_dribbles, s.technique_tirs_de_loin]);

    setSkill('skill_defense',   defense);
    setSkill('skill_mental',    mental);
    setSkill('skill_physique',  physique);
    setSkill('skill_aerien',    aerien);
    setSkill('skill_vitesse',   vitesse);
    setSkill('skill_technique', technique);
    setSkill('skill_vision',    vision);
    setSkill('skill_attaque',   attaque);
}
// Fin fonction updateMainSkills

// Début fonction uploadAvatar
async function uploadAvatar(file) {
    if (!currentUser || !footballeurProfile) return;

    if (file.size > MAX_AVATAR_SIZE) {
        showToast(`L'image ne doit pas dépasser ${MAX_AVATAR_SIZE / 1024} Ko`, 'warning');
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Format accepté : JPG, PNG, WEBP, GIF', 'warning');
        return;
    }

    showLoader();

    const fileExt  = file.name.split('.').pop().toLowerCase();
    const fileName = `${footballeurProfile.hubisoccer_id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseClient
        .storage
        .from(AVATAR_BUCKET)
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        hideLoader();
        showToast('Erreur upload : ' + uploadError.message, 'error');
        return;
    }

    const { data: urlData } = supabaseClient
        .storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update({ avatar_url: publicUrl })
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);

    hideLoader();

    if (updateError) {
        showToast('Erreur mise à jour avatar : ' + updateError.message, 'error');
        return;
    }

    footballeurProfile.avatar_url = publicUrl;
    updateAvatarDisplay();
    showToast('Photo de profil mise à jour ✅', 'success');
}
// Fin fonction uploadAvatar

// Début fonction deleteAvatar
async function deleteAvatar() {
    if (!footballeurProfile) return;

    const confirmed = confirm('Supprimer la photo de profil ?');
    if (!confirmed) return;

    showLoader();

    const { error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .update({ avatar_url: '' })
        .eq('hubisoccer_id', footballeurProfile.hubisoccer_id);

    hideLoader();

    if (error) {
        showToast('Erreur suppression avatar', 'error');
        return;
    }

    footballeurProfile.avatar_url = '';
    updateAvatarDisplay();
    showToast('Photo supprimée', 'info');
}
// Fin fonction deleteAvatar

// Début fonction copyID
async function copyID() {
    const idValue = footballeurProfile?.hubisoccer_id;
    if (!idValue) return;

    try {
        await navigator.clipboard.writeText(idValue);
        const span   = document.getElementById('footballeurID');
        const oldTxt = span.innerText;
        span.innerText = 'Copié ! ✅';
        setTimeout(() => { span.innerText = oldTxt; }, 2200);
    } catch {
        showToast('Erreur lors de la copie', 'error');
    }
}
// Fin fonction copyID

// Début fonction initAttrTabs
function initAttrTabs() {
    const tabs = document.querySelectorAll('.attr-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.attr-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.attr-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const cat = tab.dataset.cat;
            const content = document.getElementById(`${cat}-attrs`);
            if (content) content.classList.add('active');
        });
    });
}
// Fin fonction initAttrTabs

// Début fonction initUserMenu
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;

    userMenu.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });
}
// Fin fonction initUserMenu

// Début fonction initSidebar
function initSidebar() {
    const sidebar  = document.getElementById('leftSidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const menuBtn  = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn)  menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay)  overlay.addEventListener('click', closeSidebar);

    let touchStartX = 0, touchStartY = 0;
    const SWIPE_THRESHOLD = 55;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) <= Math.abs(dy)) return;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;

        if (e.cancelable) e.preventDefault();

        if (dx > 0 && touchStartX < 40) openSidebar();
        else if (dx < 0) closeSidebar();
    }, { passive: false });
}
// Fin fonction initSidebar

// Début fonction logout
async function logout() {
    showLoader();
    const { error } = await supabaseClient.auth.signOut();
    hideLoader();

    if (error) {
        console.error('Erreur déconnexion :', error);
        showToast('Erreur lors de la déconnexion', 'error');
        return;
    }

    window.location.href = '../../authprive/users/login.html';
}
// Fin fonction logout

// Début fonction triggerUpload
function triggerUpload() {
    document.getElementById('fileInput')?.click();
}
// Fin fonction triggerUpload

// ============================================================
// NOTIFICATIONS
// ============================================================

// Début fonction fetchNotifications
async function fetchNotifications(limit = 20) {
    if (!footballeurProfile) return [];
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .select('*')
        .eq('recipient_hubisoccer_id', footballeurProfile.hubisoccer_id)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) {
        console.error('Erreur chargement notifications:', error);
        return [];
    }
    return data;
}
// Fin fonction fetchNotifications

// Début fonction updateNotificationBadge
async function updateNotificationBadge() {
    if (!footballeurProfile) return;
    const { count, error } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_hubisoccer_id', footballeurProfile.hubisoccer_id)
        .eq('read', false);
    if (error) return;
    notificationsUnreadCount = count || 0;
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = notificationsUnreadCount;
        badge.style.display = notificationsUnreadCount > 0 ? 'inline-block' : 'none';
    }
}
// Fin fonction updateNotificationBadge

// Début fonction renderNotificationList
async function renderNotificationList() {
    const notifList = document.getElementById('notifList');
    if (!notifList) return;
    const notifications = await fetchNotifications(20);
    if (notifications.length === 0) {
        notifList.innerHTML = '<p class="notif-placeholder">Aucune notification</p>';
        return;
    }
    let html = '';
    notifications.forEach(n => {
        const date = new Date(n.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        const unreadClass = n.read ? '' : 'unread';
        html += `
            <div class="notif-item ${unreadClass}" data-id="${n.id}" data-title="${escapeHtml(n.title)}" data-message="${escapeHtml(n.message || '')}" data-link="${n.data?.link || ''}">
                <div class="notif-icon-small"><i class="fas fa-${getIconForType(n.type)}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${escapeHtml(n.title)}</div>
                    <div class="notif-message">${escapeHtml(n.message || '')}</div>
                    <div class="notif-time">${date}</div>
                </div>
                ${!n.read ? '<span class="unread-dot"></span>' : ''}
            </div>
        `;
    });
    notifList.innerHTML = html;
    // Attacher événements de clic
    document.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const id = item.dataset.id;
            const title = item.dataset.title;
            const message = item.dataset.message;
            const link = item.dataset.link;
            // Marquer comme lue
            await markNotificationAsRead(id);
            // Afficher modale
            showNotificationModal(title, message, link);
            // Fermer dropdown
            document.getElementById('notifDropdown').classList.remove('show');
        });
    });
}
// Fin fonction renderNotificationList

// Début fonction escapeHtml (pour notifications)
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
// Fin fonction escapeHtml

// Début fonction getIconForType
function getIconForType(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle',
        'message': 'envelope',
        'scout': 'binoculars',
        'tournament': 'trophy'
    };
    return icons[type] || 'bell';
}
// Fin fonction getIconForType

// Début fonction markNotificationAsRead
async function markNotificationAsRead(notificationId) {
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    if (!error) {
        await updateNotificationBadge();
    }
}
// Fin fonction markNotificationAsRead

// Début fonction markAllNotificationsAsRead
async function markAllNotificationsAsRead() {
    if (!footballeurProfile) return;
    const { error } = await supabaseClient
        .from('supabaseAuthPrive_notifications')
        .update({ read: true })
        .eq('recipient_hubisoccer_id', footballeurProfile.hubisoccer_id)
        .eq('read', false);
    if (!error) {
        await updateNotificationBadge();
        await renderNotificationList();
        showToast('Toutes les notifications ont été marquées comme lues', 'success');
    }
}
// Fin fonction markAllNotificationsAsRead

// Début fonction showNotificationModal
function showNotificationModal(title, message, link) {
    const modal = document.getElementById('notificationModal');
    document.getElementById('notifModalTitle').textContent = title;
    document.getElementById('notifModalMessage').textContent = message;
    currentNotificationData = { link };
    modal.style.display = 'flex';
    const actionBtn = document.getElementById('notifActionBtn');
    if (link) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.onclick = () => { window.location.href = link; };
    } else {
        actionBtn.style.display = 'none';
    }
}
// Fin fonction showNotificationModal

// Début fonction subscribeToRealtimeNotifications
function subscribeToRealtimeNotifications() {
    if (!footballeurProfile) return;
    if (notificationSubscription) {
        supabaseClient.removeChannel(notificationSubscription);
    }
    notificationSubscription = supabaseClient
        .channel('notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'supabaseAuthPrive_notifications',
            filter: `recipient_hubisoccer_id=eq.${footballeurProfile.hubisoccer_id}`
        }, (payload) => {
            const newNotif = payload.new;
            updateNotificationBadge();
            showToast(newNotif.title, 'info', 6000);
            if (document.getElementById('notifDropdown').classList.contains('show')) {
                renderNotificationList();
            }
        })
        .subscribe();
}
// Fin fonction subscribeToRealtimeNotifications

// Début fonction initNotificationUI
function initNotificationUI() {
    const notifIcon = document.getElementById('notifIcon');
    const notifDropdown = document.getElementById('notifDropdown');
    const markAllBtn = document.getElementById('markAllReadBtn');

    if (notifIcon) {
        notifIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            if (notifDropdown.classList.contains('show')) {
                renderNotificationList();
            }
        });
    }
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notif-wrapper')) {
            notifDropdown.classList.remove('show');
        }
    });
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllNotificationsAsRead);
    }

    // Modal close
    const modal = document.getElementById('notificationModal');
    document.getElementById('closeNotifModal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    document.getElementById('closeNotifModalBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}
// Fin fonction initNotificationUI

// Début fonction requestPushPermission
async function requestPushPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BEl62lXpXfLzFz8sXxFpM5Lb6m1y6p1h2l4k5j6h7g8f9d0s1a2z3e4r5t6y7u8i9o0p') // Clé publique VAPID fictive, à remplacer par la vôtre
    });
    await supabaseClient.from('supabaseAuthPrive_push_subscriptions').upsert({
        user_hubisoccer_id: footballeurProfile.hubisoccer_id,
        endpoint: subscription.endpoint,
        p256dh_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        user_agent: navigator.userAgent
    }, { onConflict: 'user_hubisoccer_id,endpoint' });
}
// Fin fonction requestPushPermission

// Utilitaire pour VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Début initialisation DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {

    const user = await checkSession();
    if (!user) return;

    await loadFootballeurProfile();
    if (!footballeurProfile) return;

    await loadScoutingData();

    initUserMenu();
    initSidebar();
    initAttrTabs();
    initNotificationUI();

    await updateNotificationBadge();
    await renderNotificationList();
    subscribeToRealtimeNotifications();
    requestPushPermission(); // demande discrète de permission

    document.getElementById('fileInput')?.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (file) uploadAvatar(file);
    });

    document.getElementById('deleteAvatarBtn')?.addEventListener('click', deleteAvatar);

    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            logout();
        });
    });

    document.getElementById('langSelect')?.addEventListener('change', e => {
        const selected = e.target.options[e.target.selectedIndex].text;
        showToast(`Langue changée en : ${selected}`, 'info');
    });

    window.triggerUpload = triggerUpload;
    window.copyID        = copyID;
    window.showToast     = showToast;
});
// Fin initialisation DOMContentLoaded
