/* ============================================================
   HubISoccer — player-stats.js
   Système Gestion Tournois — Statistiques footballeur
   ------------------------------------------------------------
   Correction structurelle : la page ne pouvait afficher QUE les
   statistiques de l'utilisateur connecte (currentUser.id partout).
   Aucun moyen de consulter le profil d'un AUTRE footballeur --
   ce qui rend impossible le parcours "cliquer sur un footballeur
   depuis un match pour voir ses stats" illustre par les captures
   de reference. Corrige : lit ?id= dans l'URL, avec repli sur
   l'utilisateur connecte si absent (comportement d'origine
   preserve comme cas par defaut).
   - userProfile.position/jersey_number/club n'etaient jamais
     confirmes comme colonnes reelles de gt_participants ou
     profiles -- affiches uniquement si presents, jamais supposes.
   - Categories Passes/Tirs/Physique/Defense ajoutees, utilisant
     l'extension de schema (voir player-stats-detail-table.sql).
     Comme aucune page ne saisit encore ces champs, un message
     honnete s'affiche tant qu'ils sont vides plutot que de
     montrer des zeros silencieux.
   - Tables migrees vers supabaseAuthPrive_gt_*.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_PLAYER_STATS = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_MATCHES         = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS               = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS           = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS               = 'supabaseAuthPrive_gt_tournaments';
const TBL_PROFILES                     = 'supabaseAuthPrive_profiles';

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let viewedPlayerId = null;
let viewedPlayerProfile = null;
let allStatsRows = [];

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 20000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// 9. CHARGEMENT DU PROFIL CONNECTÉ (navbar)
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || userProfile.display_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || userProfile.display_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 10. DÉTERMINATION DU FOOTBALLEUR CONSULTÉ (?id= ou soi-même)
// ═══════════════════════════════════════════════════════════
function resolveViewedPlayerId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || currentUser.id;
}

async function loadViewedPlayerProfile() {
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', viewedPlayerId)
        .maybeSingle();

    if (error || !data) {
        showToast('Footballeur introuvable.', 'error');
        return;
    }
    viewedPlayerProfile = data;
    updatePlayerHero();
}

// ═══════════════════════════════════════════════════════════
// 11. CARTE IDENTITÉ (requêtes séparées pour équipe/poste)
// ═══════════════════════════════════════════════════════════
async function updatePlayerHero() {
    if (!viewedPlayerProfile) return;

    document.getElementById('playerName').textContent = viewedPlayerProfile.full_name || 'Footballeur';

    const avatarContainer = document.getElementById('playerAvatar');
    avatarContainer.innerHTML = viewedPlayerProfile.avatar_url
        ? '<img src="' + viewedPlayerProfile.avatar_url + '" alt="Avatar">'
        : '<div class="avatar-initials-large">' + getInitials(viewedPlayerProfile.full_name || 'F') + '</div>';

    document.getElementById('playerSince').textContent = viewedPlayerProfile.created_at
        ? new Date(viewedPlayerProfile.created_at).toLocaleDateString('fr-FR')
        : '—';

    // Poste/numero/equipe -- cherches dans une equipe reelle (team_players),
    // jamais suppose depuis profiles qui n'a pas ces colonnes confirmees
    const { data: membership } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('team_id, jersey_number, position')
        .eq('user_id', viewedPlayerId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (membership) {
        document.getElementById('playerPosition').textContent = membership.position || 'Non précisé';
        document.getElementById('playerNumber').textContent = membership.jersey_number ? '#' + membership.jersey_number : '—';
        if (membership.team_id) {
            const { data: team } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', membership.team_id).maybeSingle();
            document.getElementById('playerTeam').textContent = team ? team.name : 'Équipe inconnue';
        }
    } else {
        document.getElementById('playerPosition').textContent = 'Non précisé';
        document.getElementById('playerNumber').textContent = '—';
        document.getElementById('playerTeam').textContent = 'Aucune équipe';
    }
}

// ═══════════════════════════════════════════════════════════
// 12. LES DONNÉES (chantier 05)
// -----------------------------------------------------------
// La page lisait quatre catégories et quatorze champs, en
// renvoyant à un fichier SQL qui n'existait pas dans le dépôt.
// Elle affichait donc « bientôt disponible » sur des colonnes
// qui n'avaient jamais été créées.
//
// Le catalogue complet vit maintenant dans GTStats.CATEGORIES :
// huit catégories, une centaine de relevés, exactement ceux que
// le script SQL du chantier 05 ajoute à la table. Ajouter une
// statistique se fait à un seul endroit et elle apparaît ici.
// ═══════════════════════════════════════════════════════════
let matchsDuSportif = {};        // match_id -> ligne du match
let tournoisDuSportif = {};      // tournament_id -> nom
let equipesDuSportif = {};       // team_id -> nom
let lignesRetenues = [];         // le périmètre courant
let cumulCourant = null;         // l'agrégat du périmètre
let categorieActive = 'attaque';
let modeAffichage = 'total';     // 'total' ou 'moyenne'

async function loadGlobalStats() {
    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_STATS)
        .select('*')
        .eq('player_id', viewedPlayerId);

    if (error) {
        console.error('Erreur chargement stats:', error);
        showToast('Erreur chargement des statistiques : ' + error.message, 'error');
        allStatsRows = [];
        appliquerLePerimetre();
        return;
    }

    allStatsRows = data || [];
    await chargerLesRencontres();
    appliquerLePerimetre();
}

// Les rencontres, les tournois et les équipes citées par ces
// lignes — en requêtes séparées, jamais en jointure imbriquée :
// une jointure PostgREST sur une relation ambiguë renvoie un
// PGRST201 et fait tomber la page entière.
async function chargerLesRencontres() {
    matchsDuSportif = {};
    tournoisDuSportif = {};
    equipesDuSportif = {};
    if (!allStatsRows.length) return;

    const idsMatchs = [];
    allStatsRows.forEach(function(l) {
        if (l.match_id != null && idsMatchs.indexOf(l.match_id) === -1) idsMatchs.push(l.match_id);
    });
    if (!idsMatchs.length) return;

    const { data: matchs } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, tournament_id, team_a_id, team_b_id, score_a, score_b, match_date, status, matchday, group_name')
        .in('id', idsMatchs);

    const idsTournois = [];
    const idsEquipes = [];
    (matchs || []).forEach(function(m) {
        matchsDuSportif[m.id] = m;
        if (m.tournament_id != null && idsTournois.indexOf(m.tournament_id) === -1) idsTournois.push(m.tournament_id);
        [m.team_a_id, m.team_b_id].forEach(function(t) {
            if (t != null && idsEquipes.indexOf(t) === -1) idsEquipes.push(t);
        });
    });

    if (idsTournois.length) {
        const { data: tournois } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').in('id', idsTournois);
        (tournois || []).forEach(function(t) { tournoisDuSportif[t.id] = t.name; });
    }
    if (idsEquipes.length) {
        const { data: equipes } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', idsEquipes);
        (equipes || []).forEach(function(e) { equipesDuSportif[e.id] = e.name; });
    }

    // Le sélecteur de tournoi
    const select = document.getElementById('tournamentSelect');
    if (select) {
        const valeur = select.value;
        select.innerHTML = '<option value="">Tous les tournois</option>';
        Object.keys(tournoisDuSportif).forEach(function(id) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = tournoisDuSportif[id];
            select.appendChild(opt);
        });
        if (valeur) select.value = valeur;
    }
}

// ═══════════════════════════════════════════════════════════
// 13. LE PÉRIMÈTRE
// -----------------------------------------------------------
// Un seul point de passage : on filtre, on agrège, puis on
// redessine tout. Aucun bloc ne recalcule dans son coin, donc
// aucun bloc ne peut afficher autre chose que les autres.
// ═══════════════════════════════════════════════════════════
function appliquerLePerimetre() {
    const idTournoi = (document.getElementById('tournamentSelect') || {}).value || '';
    const periode = (document.getElementById('periodeSelect') || {}).value || 'tout';
    modeAffichage = (document.getElementById('afficheSelect') || {}).value || 'total';

    let lignes = allStatsRows.slice();

    if (idTournoi) {
        lignes = lignes.filter(function(l) {
            const m = matchsDuSportif[l.match_id];
            if (l.tournament_id != null) return String(l.tournament_id) === String(idTournoi);
            return m && String(m.tournament_id) === String(idTournoi);
        });
    }

    // Du plus récent au plus ancien : la date du match quand on
    // l'a, l'identifiant sinon.
    lignes.sort(function(a, b) {
        const ma = matchsDuSportif[a.match_id];
        const mb = matchsDuSportif[b.match_id];
        const da = ma && ma.match_date ? new Date(ma.match_date).getTime() : 0;
        const db = mb && mb.match_date ? new Date(mb.match_date).getTime() : 0;
        if (da !== db) return db - da;
        return Number(b.match_id || 0) - Number(a.match_id || 0);
    });

    if (periode !== 'tout') {
        const n = Number(periode);
        if (isFinite(n) && n > 0) lignes = lignes.slice(0, n);
    }

    lignesRetenues = lignes;
    cumulCourant = GTStats.agregerTournoi(lignes, {
        tournament_id: idTournoi || null,
        player_id: viewedPlayerId
    });

    rendreEtatPerimetre(idTournoi, periode);
    rendreLaNote();
    rendreLesCartes();
    rendreLesOnglets();
    rendreCategorie(categorieActive);
    rendreLaCarteThermique();
    rendreLesMatchs();
}

function rendreEtatPerimetre(idTournoi, periode) {
    const etat = document.getElementById('perimetreEtat');
    if (!etat) return;

    if (!allStatsRows.length) {
        etat.innerHTML = '<i class="fas fa-circle-info"></i> Aucune feuille de statistiques enregistrée pour ce sportif.';
        return;
    }

    const parties = [];
    parties.push(lignesRetenues.length + ' match(s) retenu(s) sur ' + allStatsRows.length);
    if (idTournoi) parties.push('tournoi : ' + (tournoisDuSportif[idTournoi] || idTournoi));
    if (periode !== 'tout') parties.push(periode + ' derniers matchs');
    parties.push(modeAffichage === 'moyenne' ? 'affichage en moyenne par match' : 'affichage en totaux');

    etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + parties.join(' · ') + '.';
}

// ═══════════════════════════════════════════════════════════
// 14. LA NOTE ET SON DÉTAIL
// ═══════════════════════════════════════════════════════════
const IMPACTS_AFFICHES = [
    { cle: 'rating_attack',      nom: 'Attaque' },
    { cle: 'rating_passing',     nom: 'Passes' },
    { cle: 'rating_dribbling',   nom: 'Dribble' },
    { cle: 'rating_defence',     nom: 'Défense' },
    { cle: 'rating_goalkeeping', nom: 'Gardien' }
];

function rendreLaNote() {
    const badge = document.getElementById('noteMoyenne');
    const libelle = document.getElementById('noteLibelle');
    const sous = document.getElementById('noteSous');
    const detail = document.getElementById('noteDetail');
    if (!badge) return;

    const note = cumulCourant ? cumulCourant.average_rating : null;

    badge.className = 'gt-note gt-note-xl ' + GTStats.classeNote(note);
    badge.textContent = note == null ? '—' : Number(note).toFixed(2);
    if (libelle) libelle.textContent = GTStats.libelleNote(note);

    if (sous) {
        sous.textContent = note == null
            ? "Aucune note sur ce périmètre : la note se calcule dès qu'une feuille de match est enregistrée."
            : 'Moyenne sur ' + lignesRetenues.filter(function(l) { return l.match_rating != null; }).length +
              ' match(s) noté(s). Barème HubISoccer : 6,00 pour un match sans relief, puis chaque action ajoute ou retranche.';
    }

    if (!detail) return;

    // Les cinq notes de catégorie, moyennées sur le périmètre.
    const sommes = {}, comptes = {};
    IMPACTS_AFFICHES.forEach(function(i) { sommes[i.cle] = 0; comptes[i.cle] = 0; });
    lignesRetenues.forEach(function(l) {
        IMPACTS_AFFICHES.forEach(function(i) {
            if (l[i.cle] == null) return;
            sommes[i.cle] += Number(l[i.cle]);
            comptes[i.cle] += 1;
        });
    });

    const disponibles = IMPACTS_AFFICHES.filter(function(i) { return comptes[i.cle] > 0; });
    if (!disponibles.length) {
        detail.innerHTML = '<div class="gt-stats-vide">Le détail de la note apparaîtra dès qu\'un match aura été noté.</div>';
        return;
    }

    // Chaque note de catégorie part de 6 : l'écart à 6 est
    // l'impact, positif à droite, négatif à gauche.
    detail.innerHTML = disponibles.map(function(i) {
        const moyenne = sommes[i.cle] / comptes[i.cle];
        const ecart = moyenne - 6;
        const largeur = Math.min(50, Math.abs(ecart) / 4 * 50);
        const negatif = ecart < 0;
        return '<div class="gt-impact">' +
               '<span class="gt-impact-nom">' + escapeHtml(i.nom) + '</span>' +
               '<span class="gt-impact-piste">' +
                    '<span class="gt-impact-zero"></span>' +
                    '<span class="gt-impact-barre' + (negatif ? ' negatif' : '') + '" style="' +
                        (negatif ? 'right:50%;' : 'left:50%;') + 'width:' + largeur.toFixed(1) + '%;"></span>' +
               '</span>' +
               '<span class="gt-impact-valeur ' + (negatif ? 'negatif' : 'positif') + '">' + moyenne.toFixed(2) + '</span>' +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. LES CARTES DE SYNTHÈSE
// ═══════════════════════════════════════════════════════════
const CARTES_SYNTHESE = [
    { cle: 'matches_played', label: 'Matchs',        icone: 'fa-calendar-check', jamaisMoyenne: true },
    { cle: 'minutes_played', label: 'Minutes',       icone: 'fa-stopwatch', suffixe: "'" },
    { cle: 'goals',          label: 'Buts',          icone: 'fa-futbol' },
    { cle: 'assists',        label: 'Passes déc.',   icone: 'fa-handshake' },
    { cle: 'shots_on_target',label: 'Tirs cadrés',   icone: 'fa-crosshairs' },
    { cle: 'yellow_cards',   label: 'Jaunes',        icone: 'fa-square' },
    { cle: 'red_cards',      label: 'Rouges',        icone: 'fa-square' },
    { cle: 'motm_count',     label: 'Homme du match',icone: 'fa-star', jamaisMoyenne: true }
];

function rendreLesCartes() {
    const conteneur = document.getElementById('statsCartes');
    if (!conteneur || !cumulCourant) return;

    const moyennes = GTStats.moyennesParMatch(cumulCourant);

    conteneur.innerHTML = CARTES_SYNTHESE.map(function(c) {
        let valeur;
        if (modeAffichage === 'moyenne' && !c.jamaisMoyenne && moyennes[c.cle] != null) {
            valeur = Number(moyennes[c.cle]).toFixed(1);
        } else {
            valeur = cumulCourant[c.cle] == null ? 0 : cumulCourant[c.cle];
        }
        return '<div class="gt-stat-carte">' +
               '<i class="fas ' + c.icone + '"></i>' +
               '<div class="valeur">' + escapeHtml(valeur) + (c.suffixe || '') + '</div>' +
               '<div class="libelle">' + escapeHtml(c.label) + '</div>' +
               '</div>';
    }).join('');

    // Les anciens compteurs restent renseignés : d'autres pages
    // et d'anciens scripts peuvent encore les lire.
    const poser = function(id, valeur) {
        const el = document.getElementById(id);
        if (el) el.textContent = valeur;
    };
    poser('totalMatches', cumulCourant.matches_played);
    poser('totalGoals', cumulCourant.goals);
    poser('totalAssists', cumulCourant.assists);
    poser('totalYellow', cumulCourant.yellow_cards);
    poser('totalRed', cumulCourant.red_cards);
    poser('avgRating', cumulCourant.average_rating == null ? '—' : Number(cumulCourant.average_rating).toFixed(2));
}

// ═══════════════════════════════════════════════════════════
// 16. LE DÉTAIL PAR CATÉGORIE
// -----------------------------------------------------------
// Les onglets viennent du catalogue, pas d'une liste écrite en
// dur dans le HTML : une catégorie ajoutée à GTStats apparaît
// ici sans toucher à cette page.
// ═══════════════════════════════════════════════════════════
function cumulPourAffichage() {
    // Les catégories additionnent les colonnes brutes ligne à
    // ligne : l'agrégat de tournoi ne couvre que les colonnes
    // qu'il connaît, or le catalogue en compte davantage.
    const total = {};
    lignesRetenues.forEach(function(l) {
        GTStats.toutesLesCles().forEach(function(cle) {
            const v = l[cle];
            if (v === undefined || v === null) return;
            if (typeof v === 'boolean') { total[cle] = (total[cle] || 0) + (v ? 1 : 0); return; }
            if (typeof v === 'string') { if (total[cle] == null) total[cle] = v; return; }
            const n = Number(v);
            if (!isFinite(n)) return;
            total[cle] = (total[cle] || 0) + n;
        });
    });

    // Les valeurs qui ne s'additionnent pas.
    let vitesse = 0;
    lignesRetenues.forEach(function(l) {
        if (Number(l.top_speed_kmh) > vitesse) vitesse = Number(l.top_speed_kmh);
    });
    if (vitesse) total.top_speed_kmh = vitesse;

    if (modeAffichage === 'moyenne' && lignesRetenues.length) {
        const joues = lignesRetenues.filter(function(l) { return Number(l.minutes_played) > 0; }).length || lignesRetenues.length;
        Object.keys(total).forEach(function(cle) {
            if (cle === 'top_speed_kmh') return;
            if (typeof total[cle] !== 'number') return;
            total[cle] = Math.round((total[cle] / joues) * 100) / 100;
        });
    }

    return total;
}

function rendreLesOnglets() {
    const conteneur = document.getElementById('categoryTabs');
    if (!conteneur) return;

    const cumul = cumulPourAffichage();

    conteneur.innerHTML = GTStats.CATEGORIES.map(function(cat) {
        const pleine = GTStats.categorieRenseignee(cat, cumul);
        return '<button class="gt-stats-onglet' +
               (cat.code === categorieActive ? ' active' : '') +
               (pleine ? '' : ' vide') +
               '" data-cat="' + cat.code + '">' +
               '<i class="fas ' + cat.icone + '"></i> ' + escapeHtml(cat.nom) + '</button>';
    }).join('');

    conteneur.querySelectorAll('.gt-stats-onglet').forEach(function(bouton) {
        bouton.addEventListener('click', function() {
            categorieActive = bouton.dataset.cat;
            conteneur.querySelectorAll('.gt-stats-onglet').forEach(function(b) { b.classList.remove('active'); });
            bouton.classList.add('active');
            rendreCategorie(categorieActive);
        });
    });
}

function rendreCategorie(code) {
    const conteneur = document.getElementById('categoryDetail');
    const aide = document.getElementById('detailHint');
    if (!conteneur) return;

    const categorie = GTStats.categorieParCode(code);
    if (!categorie) { conteneur.innerHTML = ''; return; }

    const cumul = cumulPourAffichage();

    if (!GTStats.categorieRenseignee(categorie, cumul)) {
        conteneur.innerHTML = '';
        if (aide) aide.style.display = 'block';
        return;
    }
    if (aide) aide.style.display = 'none';

    conteneur.innerHTML = '<div class="gt-stats-grille">' +
        categorie.champs.map(function(champ) {
            return blocStatistique(champ, cumul);
        }).join('') + '</div>';
}

function blocStatistique(champ, ligne) {
    // Sur un cumul, un booléen devient un compte : « titulaire »
    // n'a de sens qu'en nombre de fois.
    let affiche;
    if (champ.type === 'bool') {
        const n = Number(ligne[champ.cle]) || 0;
        affiche = n ? n + ' fois' : '—';
    } else {
        affiche = GTStats.formater(champ, ligne);
    }

    const vide = affiche === '—';
    let barre = '';
    if (champ.type === 'ratio') {
        const cleReussi = champ.reussi || champ.cle;
        const cleTente = champ.tente || champ.cle;
        const p = GTStats.pourcentage(ligne[cleReussi], ligne[cleTente]);
        if (p != null) barre = '<div class="gt-stat-ratio"><i style="width:' + p + '%"></i></div>';
    }

    return '<div class="gt-stat-ligne' + (vide ? ' vide' : '') + '">' +
           '<span class="gt-stat-bloc"><span class="gt-stat-label">' + escapeHtml(champ.label) + '</span>' + barre + '</span>' +
           '<span class="gt-stat-valeur' + (vide ? ' absente' : '') + '">' + escapeHtml(affiche) + '</span>' +
           '</div>';
}

// ═══════════════════════════════════════════════════════════
// 17. LA CARTE THERMIQUE
// -----------------------------------------------------------
// heatmap est une colonne jsonb : un tableau de points
// { x, y, poids } en coordonnées 0-100 sur le terrain. Rien ne
// la remplit encore automatiquement — elle attend une source de
// suivi. Le jour où cette source existe, l'affichage est prêt.
// ═══════════════════════════════════════════════════════════
function rendreLaCarteThermique() {
    const zone = document.getElementById('heatmapZone');
    if (!zone) return;

    const points = [];
    lignesRetenues.forEach(function(l) {
        if (!l.heatmap) return;
        let brut = l.heatmap;
        if (typeof brut === 'string') {
            try { brut = JSON.parse(brut); } catch (e) { return; }
        }
        const liste = Array.isArray(brut) ? brut : (brut && Array.isArray(brut.points) ? brut.points : []);
        liste.forEach(function(p) { points.push(p); });
    });

    if (!points.length) {
        zone.innerHTML = '<div class="gt-heatmap-vide">' +
            'Aucune carte thermique enregistrée sur ce périmètre.<br>' +
            'Elle se remplira dès qu\'un suivi de position alimentera la colonne prévue pour elle.</div>';
        return;
    }

    const colonnes = 12, rangees = 18;
    const resultat = GTStats.grilleThermique(points, colonnes, rangees);

    let cellules = '';
    for (let i = 0; i < rangees; i++) {
        for (let j = 0; j < colonnes; j++) {
            const intensite = resultat.maximum ? resultat.grille[i][j] / resultat.maximum : 0;
            // La couleur va du transparent au jaune puis au rouge :
            // c'est une échelle de chaleur, pas une couleur de la
            // charte, elle ne peut donc pas venir d'un token.
            const alpha = Math.min(0.85, intensite * 0.9);
            const teinte = Math.round(60 - intensite * 60);
            cellules += '<div class="gt-heatmap-cellule" style="background:hsla(' + teinte + ', 95%, 55%, ' + alpha.toFixed(3) + ')"></div>';
        }
    }

    zone.innerHTML = '<div class="gt-heatmap">' +
        '<div class="gt-heatmap-lignes">' +
            '<span style="left:4%;top:2%;right:4%;bottom:2%;"></span>' +
            '<span style="left:4%;top:50%;right:4%;height:0;"></span>' +
            '<span style="left:28%;top:2%;width:44%;height:14%;"></span>' +
            '<span style="left:28%;bottom:2%;width:44%;height:14%;"></span>' +
        '</div>' +
        '<div class="gt-heatmap-cellules" style="grid-template-columns:repeat(' + colonnes + ',1fr);grid-template-rows:repeat(' + rangees + ',1fr);">' +
        cellules + '</div></div>' +
        '<p class="gt-saisie-note" style="text-align:center;">' + resultat.points + ' position(s) cumulée(s) sur ' + lignesRetenues.length + ' match(s).</p>';
}

// ═══════════════════════════════════════════════════════════
// 18. LA LISTE DES MATCHS
// -----------------------------------------------------------
// Chaque rencontre s'ouvre sur le détail complet de la
// performance : les huit catégories, plus le détail de la note
// telle que le barème l'a construite.
// ═══════════════════════════════════════════════════════════
function rendreLesMatchs() {
    const conteneur = document.getElementById('matchesStatsList');
    if (!conteneur) return;

    if (!lignesRetenues.length) {
        conteneur.innerHTML = '<div class="gt-stats-vide">' +
            '<strong>Aucun match sur ce périmètre.</strong><br>' +
            'Une feuille de statistiques naît du rapport de match : dès qu\'un officiel désigné dépose son rapport et que l\'organisateur lance le calcul, la rencontre apparaît ici.</div>';
        return;
    }

    conteneur.innerHTML = lignesRetenues.map(function(ligne, index) {
        const m = matchsDuSportif[ligne.match_id] || {};
        const nomA = equipesDuSportif[m.team_a_id] || 'Équipe A';
        const nomB = equipesDuSportif[m.team_b_id] || 'Équipe B';
        const tournoi = tournoisDuSportif[m.tournament_id] || '';
        const date = m.match_date ? new Date(m.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const score = (m.score_a == null && m.score_b == null) ? '' : (m.score_a ?? 0) + ' — ' + (m.score_b ?? 0);
        const note = ligne.match_rating;

        return '<div class="match-stat-item" data-index="' + index + '">' +
            '<div class="match-header match-bascule" data-index="' + index + '">' +
                '<span class="match-date"><i class="fas fa-calendar-alt"></i> ' + escapeHtml(date) + '</span>' +
                '<span class="match-teams">' + escapeHtml(nomA) + (score ? ' ' + score + ' ' : ' vs ') + escapeHtml(nomB) + '</span>' +
                (tournoi ? '<span class="match-tournament"><i class="fas fa-trophy"></i> ' + escapeHtml(tournoi) + '</span>' : '') +
                '<span class="gt-note gt-note-sm ' + GTStats.classeNote(note) + '">' + (note == null ? '—' : Number(note).toFixed(1)) + '</span>' +
                '<i class="fas fa-chevron-down"></i>' +
            '</div>' +
            '<div class="match-stats">' +
                '<span><i class="fas fa-stopwatch"></i> ' + (ligne.minutes_played != null ? ligne.minutes_played + "'" : '—') + '</span>' +
                '<span><i class="fas fa-futbol"></i> Buts : ' + (Number(ligne.goals) || 0) + '</span>' +
                '<span><i class="fas fa-handshake"></i> Passes déc. : ' + (Number(ligne.assists) || 0) + '</span>' +
                '<span><i class="fas fa-square yellow"></i> ' + (Number(ligne.yellow_cards) || 0) + '</span>' +
                '<span><i class="fas fa-square red"></i> ' + (Number(ligne.red_cards) || 0) + '</span>' +
                (ligne.is_motm ? '<span class="gt-badge-motm"><i class="fas fa-star"></i> Homme du match</span>' : '') +
                (ligne.source ? '<span class="gt-stats-source"><i class="fas fa-database"></i> ' + escapeHtml(ligne.source) + '</span>' : '') +
            '</div>' +
            '<div class="match-detail-complet" id="matchDetail_' + index + '" style="display:none;"></div>' +
        '</div>';
    }).join('');

    conteneur.querySelectorAll('.match-bascule').forEach(function(entete) {
        entete.addEventListener('click', function() {
            basculerLeDetailDuMatch(Number(entete.dataset.index));
        });
    });
}

function basculerLeDetailDuMatch(index) {
    const zone = document.getElementById('matchDetail_' + index);
    if (!zone) return;

    if (zone.style.display !== 'none') {
        zone.style.display = 'none';
        zone.innerHTML = '';
        return;
    }

    const ligne = lignesRetenues[index];
    if (!ligne) return;

    const note = GTStats.calculerNote(ligne);

    let html = '';

    if (note.note != null) {
        html += '<h4 class="classement-groupe">Détail de la note</h4>';
        html += '<div class="gt-note-bloc">' +
                '<span class="gt-note ' + GTStats.classeNote(ligne.match_rating != null ? ligne.match_rating : note.note) + '">' +
                Number(ligne.match_rating != null ? ligne.match_rating : note.note).toFixed(2) + '</span>' +
                '<div class="gt-note-legende">' +
                    '<span class="gt-note-libelle">' + escapeHtml(GTStats.libelleNote(ligne.match_rating != null ? ligne.match_rating : note.note)) + '</span>' +
                    '<span class="gt-note-sous">Base 6,00 · temps de jeu retenu à ' + Math.round(note.facteurTempsDeJeu * 100) + ' %</span>' +
                '</div></div>';

        const impacts = [
            { nom: 'Attaque', v: note.impacts.attaque },
            { nom: 'Passes', v: note.impacts.passes },
            { nom: 'Dribble', v: note.impacts.dribble },
            { nom: 'Défense', v: note.impacts.defense },
            { nom: 'Gardien', v: note.impacts.gardien },
            { nom: 'Discipline', v: note.impacts.discipline }
        ].filter(function(i) { return i.v !== 0; });

        if (impacts.length) {
            html += '<div class="gt-note-detail">' + impacts.map(function(i) {
                const largeur = Math.min(50, Math.abs(i.v) / 3 * 50);
                const negatif = i.v < 0;
                return '<div class="gt-impact">' +
                       '<span class="gt-impact-nom">' + escapeHtml(i.nom) + '</span>' +
                       '<span class="gt-impact-piste"><span class="gt-impact-zero"></span>' +
                       '<span class="gt-impact-barre' + (negatif ? ' negatif' : '') + '" style="' +
                       (negatif ? 'right:50%;' : 'left:50%;') + 'width:' + largeur.toFixed(1) + '%;"></span></span>' +
                       '<span class="gt-impact-valeur ' + (negatif ? 'negatif' : 'positif') + '">' +
                       (i.v > 0 ? '+' : '') + i.v.toFixed(2) + '</span></div>';
            }).join('') + '</div>';
        }

        if (note.detail.length) {
            html += '<div class="gt-note-contributions">' + note.detail.map(function(d) {
                return '<div class="gt-contribution' + (d.valeur < 0 ? ' negatif' : '') + '">' +
                       '<span>' + escapeHtml(d.libelle) + '</span>' +
                       '<span>' + (d.valeur > 0 ? '+' : '') + d.valeur.toFixed(2) + '</span></div>';
            }).join('') + '</div>';
        }
    }

    GTStats.CATEGORIES.forEach(function(categorie) {
        if (!GTStats.categorieRenseignee(categorie, ligne)) return;
        html += '<h4 class="classement-groupe"><i class="fas ' + categorie.icone + '"></i> ' + escapeHtml(categorie.nom) + '</h4>';
        html += '<div class="gt-stats-grille">' + categorie.champs.map(function(champ) {
            if (champ.type === 'bool') {
                const valeur = ligne[champ.cle];
                if (valeur === undefined || valeur === null) return '';
                return '<div class="gt-stat-ligne"><span class="gt-stat-bloc"><span class="gt-stat-label">' +
                       escapeHtml(champ.label) + '</span></span><span class="gt-stat-valeur">' +
                       (valeur ? 'Oui' : 'Non') + '</span></div>';
            }
            return blocStatistique(champ, ligne);
        }).join('') + '</div>';
    });

    zone.innerHTML = html || '<p class="empty-hint">Aucun relevé détaillé pour cette rencontre.</p>';
    zone.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════
// 19. LES FILTRES
// ═══════════════════════════════════════════════════════════
function initFiltresStatistiques() {
    ['tournamentSelect', 'periodeSelect', 'afficheSelect'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', appliquerLePerimetre);
    });
}

// ═══════════════════════════════════════════════════════════
// 20. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 21. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    if (!userProfile) return;

    initUserMenu();
    initSidebar();
    initLogout();
    initFiltresStatistiques();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    viewedPlayerId = resolveViewedPlayerId();
    await loadViewedPlayerProfile();
    // loadGlobalStats() charge, filtre et dessine tout : les
    // cartes, la note, les catégories, la carte thermique et la
    // liste des matchs passent par le même point.
    await loadGlobalStats();
});
