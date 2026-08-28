/* ============================================================
   HubISoccer — match-details.js
   Système Gestion Tournois — Détails d'un match
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Jointures imbriquees (team_a/team_b/tournament) converties
     en requetes separees fusionnees en JS -- meme principe
     applique depuis l'incident sur manage-tournament, ne plus
     dependre d'une relation non verifiee.
   - loadMatchReports() etait un simple texte statique
     ("il n'y a pas de table de rapports") alors que la table
     existe bel et bien (gt_match_reports, deja utilisee par
     manage-tournament.js). Reecrite pour vraiment lire et
     afficher les rapports du match.
   - Ajout de liens vers "Rediger un rapport" et "Exporter",
     absents alors que les deux pages existent deja.
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
// 2. TABLES (convention supabaseAuthPrive_gt_*)
// ═══════════════════════════════════════════════════════════
const TBL_MATCHES              = 'supabaseAuthPrive_gt_matches';
const TBL_TEAMS                   = 'supabaseAuthPrive_gt_teams';
const TBL_TOURNAMENTS                = 'supabaseAuthPrive_gt_tournaments';
const TBL_PLAYER_MATCH_STATS            = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_REPORTS                          = 'supabaseAuthPrive_gt_match_reports';
const TBL_PROFILES                            = 'supabaseAuthPrive_profiles';
const TBL_EVENTS                                 = 'supabaseAuthPrive_gt_match_events';
const TBL_TEAM_PLAYERS                              = 'supabaseAuthPrive_gt_team_players';
const TBL_OFFICIELS                                    = 'supabaseAuthPrive_gt_tournament_officials';
const TBL_LINEUPS                                         = 'supabaseAuthPrive_gt_match_lineups';
const TBL_TOURNAMENTS_SPORTS                                 = 'supabaseAuthPrive_gt_sports';

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

const REPORT_TYPE_LABELS = { referee: 'Rapport arbitre', commissioner: 'Rapport commissaire', medical: 'Rapport médical' };

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let matchId = null;

// --- Chantier 05 : statistiques de la rencontre
let matchCourant = null;      // la ligne du match, gardee pour le recalcul
let statsDuMatch = [];        // lignes gt_player_match_stats de ce match
let effectifDuMatch = [];     // les sportifs des deux equipes
let nomsDesSportifs = {};     // auth_uuid -> nom affiche
let peutGererLesStats = false;
let sportifEnSaisie = null;

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
// 9. CHARGEMENT DU PROFIL
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

// ═══════════════════════════════════════════════════════════
// 10. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
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
// 11. RÉCUPÉRATION DE L'ID DU MATCH
// ═══════════════════════════════════════════════════════════
function getMatchIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES DÉTAILS DU MATCH (requetes separees)
// ═══════════════════════════════════════════════════════════
async function loadMatchDetails(matchId) {
    if (!matchId) {
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'match',
            parametre: 'id',
            portee: 'tousMatchs',
            icone: 'fa-futbol',
            titre: 'Quel match voulez-vous consulter ?',
            aide: 'Choisissez d\'abord le tournoi, puis la rencontre.',
            messageVide: 'Aucun tournoi disponible pour le moment.'
        });
        return;
    }

    showLoader();
    const { data: match, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*')
        .eq('id', matchId)
        .single();

    if (error || !match) {
        hideLoader();
        showToast('Match introuvable.', 'error');
        return;
    }

    // Equipes et tournoi -- requetes separees
    let teamAName = 'Équipe A', teamBName = 'Équipe B', tournamentName = '', streamUrl = null;

    if (match.team_a_id) {
        const { data: teamA } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_a_id).maybeSingle();
        if (teamA) teamAName = teamA.name;
    }
    if (match.team_b_id) {
        const { data: teamB } = await supabaseClient.from(TBL_TEAMS).select('name').eq('id', match.team_b_id).maybeSingle();
        if (teamB) teamBName = teamB.name;
    }
    if (match.tournament_id) {
        const { data: tournament } = await supabaseClient.from(TBL_TOURNAMENTS).select('name, stream_url').eq('id', match.tournament_id).maybeSingle();
        if (tournament) { tournamentName = tournament.name; streamUrl = tournament.stream_url; }
    }

    hideLoader();

    document.getElementById('matchTitle').textContent = teamAName + ' vs ' + teamBName + (tournamentName ? ' — ' + tournamentName : '');
    document.getElementById('homeTeamName').textContent = teamAName;
    document.getElementById('awayTeamName').textContent = teamBName;
    document.getElementById('homeScore').textContent = match.score_a ?? 0;
    document.getElementById('awayScore').textContent = match.score_b ?? 0;

    const statusMap = { scheduled: 'Programmé', live: 'En direct', completed: 'Terminé' };
    const statusLabel = statusMap[match.status] || match.status;
    const statusClass = match.status === 'live' ? 'status-live' : (match.status === 'completed' ? 'status-completed' : 'status-scheduled');
    document.getElementById('matchStatus').innerHTML = '<span class="' + statusClass + '">' + statusLabel + '</span>';
    document.getElementById('matchMeta').textContent = (tournamentName ? 'Tournoi : ' + tournamentName + ' — ' : '') + (match.match_date ? new Date(match.match_date).toLocaleString('fr-FR') : '');

    const streamDiv = document.getElementById('matchStream');
    streamDiv.innerHTML = streamUrl
        ? '<iframe src="' + streamUrl + '" frameborder="0" allowfullscreen></iframe>'
        : '<p class="empty-hint">Aucun stream disponible.</p>';

    // Liens vers rediger/exporter un rapport, avec l'id du match
    const writeLink = document.getElementById('writeReportLink');
    const exportLink = document.getElementById('exportReportLink');
    if (writeLink) writeLink.href = 'match-report.html?match_id=' + matchId;
    if (exportLink) exportLink.href = 'match-report-export.html?match_id=' + matchId;

    // matchCourant sert au fil d'événements comme aux statistiques :
    // on le pose avant les deux.
    matchCourant = match;

    await loadMatchEvents(matchId);
    await loadMatchReports(matchId);
    await monterLesCompositions(match);
    await monterLesStatistiques(match);
}

// ═══════════════════════════════════════════════════════════
// 13. ÉVÉNEMENTS DU MATCH
// -----------------------------------------------------------
// Cette section lisait gt_player_match_stats et en tirait une
// phrase par sportif — « 2 but(s) », sans minute, sans ordre,
// sans passeur. Ce n'etait pas un fil d'evenements : c'etait un
// cumul.
//
// Depuis le chantier 04, gt_match_events contient la vraie
// chronologie, avec sa minute, son equipe, son buteur et son
// passeur. On la lit ici. Le cumul par sportif, lui, a
// desormais sa propre section (Statistiques des sportifs).
// ═══════════════════════════════════════════════════════════
const LIBELLES_EVENEMENT = {
    goal:          { icone: '⚽', label: 'But' },
    own_goal:      { icone: '⚽', label: 'But contre son camp' },
    penalty_missed:{ icone: '❌', label: 'Penalty manqué' },
    penalty_saved: { icone: '🧤', label: 'Penalty arrêté' },
    yellow_card:   { icone: '🟨', label: 'Carton jaune' },
    red_card:      { icone: '🟥', label: 'Carton rouge' },
    second_yellow: { icone: '🟥', label: 'Second avertissement' },
    substitution:  { icone: '🔁', label: 'Remplacement' },
    injury:        { icone: '🚑', label: 'Blessure' }
};

async function loadMatchEvents(idMatch) {
    const conteneur = document.getElementById('matchEvents');
    if (!conteneur) return;

    const { data: evenements, error } = await supabaseClient
        .from(TBL_EVENTS)
        .select('id, event_type, minute, team_id, player_id, assist_player_id, detail')
        .eq('match_id', idMatch)
        .order('minute', { ascending: true });

    if (error) {
        console.warn('Événements indisponibles :', error.message);
        conteneur.innerHTML = '<p class="empty-hint">Événements indisponibles pour l\'instant.</p>';
        return;
    }

    if (!evenements || !evenements.length) {
        conteneur.innerHTML = '<p class="empty-hint">Aucun événement enregistré. ' +
            'Les événements naissent des rapports de match : dès qu\'un officiel désigné dépose un rapport avec ses buts, ses cartons et ses remplacements, ils apparaissent ici.</p>';
        return;
    }

    // Les noms : une seule requête pour tous les comptes cités.
    const identifiants = [];
    evenements.forEach(function(e) {
        if (e.player_id && identifiants.indexOf(e.player_id) === -1) identifiants.push(e.player_id);
        if (e.assist_player_id && identifiants.indexOf(e.assist_player_id) === -1) identifiants.push(e.assist_player_id);
    });

    if (identifiants.length) {
        const { data: profils } = await supabaseClient
            .from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', identifiants);
        (profils || []).forEach(function(p) {
            if (!nomsDesSportifs[p.auth_uuid]) nomsDesSportifs[p.auth_uuid] = p.full_name || 'Sportif';
        });
    }

    const nomA = document.getElementById('homeTeamName').textContent;
    const nomB = document.getElementById('awayTeamName').textContent;

    conteneur.innerHTML = evenements.map(function(e) {
        const modele = LIBELLES_EVENEMENT[e.event_type] || { icone: '•', label: e.event_type || 'Événement' };
        const nom = nomsDesSportifs[e.player_id] || (e.player_id ? 'Sportif' : '');
        const second = nomsDesSportifs[e.assist_player_id] || '';

        let equipe = '';
        if (matchCourant && e.team_id != null) {
            if (String(e.team_id) === String(matchCourant.team_a_id)) equipe = nomA;
            else if (String(e.team_id) === String(matchCourant.team_b_id)) equipe = nomB;
        }

        let complement = '';
        if (e.event_type === 'goal' && second) complement = 'passe décisive : ' + second;
        else if (e.event_type === 'substitution') complement = second ? 'sort : ' + second : '';
        if (e.detail) complement += (complement ? ' — ' : '') + e.detail;

        return '<div class="event-item">' +
               '<span class="event-minute tabular">' + (e.minute == null ? '—' : e.minute + "'") + '</span> ' +
               '<span class="event-player">' + modele.icone + ' ' + escapeHtml(nom || modele.label) + '</span>' +
               '<span class="event-details">' + escapeHtml(modele.label) +
               (equipe ? ' · ' + escapeHtml(equipe) : '') +
               (complement ? ' · ' + escapeHtml(complement) : '') +
               '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 14. RAPPORTS (lecture reelle depuis gt_match_reports)
// ═══════════════════════════════════════════════════════════
async function loadMatchReports(matchId) {
    const container = document.getElementById('matchReports');
    const { data, error } = await supabaseClient
        .from(TBL_REPORTS)
        .select('id, report_type, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Erreur chargement rapports:', error.message);
        container.innerHTML = '<p class="empty-hint">Rapports indisponibles pour l\'instant.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="empty-hint">Aucun rapport pour ce match. <a href="' + document.getElementById('writeReportLink').href + '">En rédiger un</a>.</p>';
        return;
    }

    container.innerHTML = data.map(function(r) {
        const label = REPORT_TYPE_LABELS[r.report_type] || r.report_type;
        const date = r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '';
        return '<div class="report-preview-item"><i class="fas fa-file-alt"></i> <span>' + escapeHtml(label) + '</span><span class="report-preview-date">' + date + '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 14 ter. LES COMPOSITIONS (chantier 06)
// -----------------------------------------------------------
// Ta regle du point 26 : « Le gestionnaire du tournoi affiche
// la composition en cours d'utilisation pendant la rencontre. »
//
// Les deux equipes cote a cote, avec le meme trace de terrain
// que « Mon equipe » et la fiche d'equipe — gt-terrain.css est
// partage, il n'y a qu'un seul dessin dans tout le module.
//
// Les icones disent ce qui est arrive : blessure, sortie,
// entree, brassard.
// ═══════════════════════════════════════════════════════════
async function monterLesCompositions(match) {
    const zone = document.getElementById('compositionsZone');
    const etat = document.getElementById('compoEtat');
    if (!zone || !match) return;

    const { data, error } = await supabaseClient
        .from(TBL_LINEUPS)
        .select('*')
        .eq('match_id', match.id);

    if (error) {
        zone.innerHTML = '';
        if (etat) etat.innerHTML = '<i class="fas fa-circle-exclamation"></i> Compositions indisponibles : ' + escapeHtml(error.message);
        return;
    }

    const lignes = data || [];
    if (!lignes.length) {
        zone.innerHTML = '<div class="gt-stats-vide"><strong>Aucune composition déposée.</strong><br>' +
            'Chaque équipe prépare la sienne depuis « Mon équipe » : le créateur, le capitaine, le coach ou le président ' +
            'la pose sur le terrain et l\'enregistre pour cette rencontre.</div>';
        if (etat) etat.innerHTML = '';
        return;
    }

    // Le sport et le terrain du tournoi.
    let nomSport = '';
    let tournoi = null;
    if (match.tournament_id) {
        const { data: t } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('sport_id, pitch_length_m, pitch_width_m, team_format')
            .eq('id', match.tournament_id).maybeSingle();
        tournoi = t;
        if (tournoi && tournoi.sport_id) {
            const { data: sp } = await supabaseClient
                .from(TBL_TOURNAMENTS_SPORTS).select('name').eq('id', tournoi.sport_id).maybeSingle();
            if (sp) nomSport = sp.name;
        }
    }
    const sport = GTTerrain.sportPour(nomSport);

    const nomA = document.getElementById('homeTeamName').textContent;
    const nomB = document.getElementById('awayTeamName').textContent;

    const cotes = [
        { id: match.team_a_id, nom: nomA },
        { id: match.team_b_id, nom: nomB }
    ].filter(function(c) { return c.id != null; });

    let html = '';
    let total = 0;

    cotes.forEach(function(cote, index) {
        const siennes = lignes.filter(function(l) { return String(l.team_id) === String(cote.id); });
        total += siennes.length;

        if (!siennes.length) {
            html += '<div class="mds-compo">' +
                    '<div class="mds-compo-titre"><span class="mds-compo-nom">' + escapeHtml(cote.nom) + '</span></div>' +
                    '<div class="gt-stats-vide">Cette équipe n\'a pas encore déposé sa composition.</div></div>';
            return;
        }

        const titulaires = siennes.filter(function(l) { return l.is_starter; });
        const banc = siennes.filter(function(l) { return !l.is_starter; })
                            .sort(function(a, b) { return (a.bench_order || 0) - (b.bench_order || 0); });

        const format = Number(siennes[0].team_format) || Number(tournoi && tournoi.team_format) || sport.formatParDefaut;
        let formation = siennes[0].formation;
        if (!formation) {
            const deduite = GTTerrain.deduireFormation(titulaires.map(function(l) {
                return { x: Number(l.pos_x), y: Number(l.pos_y) };
            }), sport);
            formation = deduite ? deduite.code : GTTerrain.formationParDefaut(sport, format);
        }

        const reperes = GTTerrain.reperes(sport, format, {
            longueur: tournoi ? tournoi.pitch_length_m : null,
            largeur: tournoi ? tournoi.pitch_width_m : null
        });

        // Les titulaires sans coordonnees sont repartis dans la
        // formation : une feuille deposee reste lisible meme si
        // personne n'a bouge les pastilles.
        const emplacements = GTTerrain.placer(formation, sport);
        const poses = titulaires.filter(function(l) { return l.pos_x != null && l.pos_y != null; });
        let reste = titulaires.filter(function(l) { return l.pos_x == null || l.pos_y == null; });
        const prisPar = {};
        poses.forEach(function(l) { if (l.slot_key) prisPar[l.slot_key] = true; });

        let places = poses.map(function(l) {
            return placeCompositionHtml(l, Number(l.pos_x), Number(l.pos_y));
        }).join('');

        emplacements.forEach(function(place) {
            if (prisPar[place.cle] || !reste.length) return;
            const l = reste.shift();
            places += placeCompositionHtml(l, place.x, place.y, place.libelle);
        });

        html += '<div class="mds-compo">' +
            '<div class="mds-compo-titre">' +
                '<span class="mds-compo-nom">' + escapeHtml(cote.nom) + '</span>' +
                '<span class="mds-compo-formation">' + escapeHtml(formation) + ' · ' + sport.nom + ' à ' + format + '</span>' +
            '</div>' +
            '<div class="gt-terrain-cadre">' +
                '<span class="gt-cote gt-cote-longueur">' + escapeHtml(reperes.libelleLongueur) + '</span>' +
                '<span class="gt-cote gt-cote-largeur">' + escapeHtml(reperes.libelleLargeur) + '</span>' +
                '<div class="gt-terrain" data-sport="' + escapeHtml(sport.code) + '" data-format="' + format + '">' +
                    GTTerrain.marquagesHtml(sport) +
                    '<div class="gt-terrain-places">' + places + '</div>' +
                '</div>' +
            '</div>' +
            (index === 0 ? '<p class="gt-terrain-rappel">' + escapeHtml(reperes.rappel) + '</p>' : '') +
            '<div class="gt-banc">' +
                '<div class="gt-banc-titre"><span><i class="fas fa-chair"></i> Banc</span>' +
                '<span class="compte">' + titulaires.length + ' titulaire(s) · ' + banc.length + ' remplaçant(s)</span></div>' +
                '<div class="gt-banc-liste">' + banc.map(function(l) {
                    return placeBancCompositionHtml(l);
                }).join('') + '</div>' +
            '</div>' +
            '</div>';
    });

    zone.innerHTML = html;

    if (etat) {
        const confirmees = [];
        if (match.lineup_a_confirmed) confirmees.push(nomA);
        if (match.lineup_b_confirmed) confirmees.push(nomB);
        etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + total + ' sportif(s) sur les feuilles' +
                         (confirmees.length ? ' · composition confirmée par ' + escapeHtml(confirmees.join(' et ')) : '') +
                         (estMatchVerrouille(match) ? ' · feuilles figées, la rencontre a un résultat' : '') + '.';
    }
}

function placeCompositionHtml(ligne, x, y, libelleParDefaut) {
    const nom = ligne.member_name || 'Sportif';
    const etats = [];
    if (ligne.is_captain)  etats.push('<span class="gt-etat capitaine" title="Capitaine"><i class="fas fa-star"></i></span>');
    if (ligne.is_injured)  etats.push('<span class="gt-etat blessure" title="Blessé' +
        (ligne.injury_minute != null ? ' à la ' + escapeHtml(ligne.injury_minute) + 'e' : '') + '"><i class="fas fa-kit-medical"></i></span>');
    if (ligne.sub_out_minute != null) etats.push('<span class="gt-etat sortie" title="Sorti à la ' +
        escapeHtml(ligne.sub_out_minute) + 'e"><i class="fas fa-arrow-down"></i></span>');
    if (ligne.sub_in_minute != null) etats.push('<span class="gt-etat entree" title="Entré à la ' +
        escapeHtml(ligne.sub_in_minute) + 'e"><i class="fas fa-arrow-up"></i></span>');

    const contenu =
        '<div class="gt-place-pastille">' +
            '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>' +
            (ligne.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(ligne.jersey_number) + '</span>' : '') +
            (etats.length ? '<span class="gt-place-etats">' + etats.join('') + '</span>' : '') +
        '</div>' +
        '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
        '<div class="gt-place-poste">' + escapeHtml(ligne.position_detail || libelleParDefaut || '') + '</div>';

    const lien = ligne.player_id ? 'player-stats.html?id=' + encodeURIComponent(ligne.player_id) : null;

    return '<div class="gt-place non-modifiable' + (ligne.sub_out_minute != null ? ' est-sorti' : '') +
           '" style="left:' + x + '%;top:' + y + '%;">' +
           (lien ? '<a href="' + lien + '" style="display:contents;">' + contenu + '</a>' : contenu) +
           '</div>';
}

function placeBancCompositionHtml(ligne) {
    const nom = ligne.member_name || 'Sportif';
    const etats = [];
    if (ligne.is_injured) etats.push('<span class="gt-etat blessure" title="Blessé"><i class="fas fa-kit-medical"></i></span>');
    if (ligne.sub_in_minute != null) etats.push('<span class="gt-etat entree" title="Entré à la ' +
        escapeHtml(ligne.sub_in_minute) + 'e"><i class="fas fa-arrow-up"></i></span>');

    const contenu =
        '<div class="gt-place-pastille">' +
            '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>' +
            (ligne.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(ligne.jersey_number) + '</span>' : '') +
            (etats.length ? '<span class="gt-place-etats">' + etats.join('') + '</span>' : '') +
        '</div>' +
        '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
        '<div class="gt-place-poste">' + escapeHtml(ligne.position_detail || '') + '</div>';

    const lien = ligne.player_id ? 'player-stats.html?id=' + encodeURIComponent(ligne.player_id) : null;

    return '<div class="gt-banc-place non-modifiable">' +
           (lien ? '<a href="' + lien + '" style="display:contents;">' + contenu + '</a>' : contenu) +
           '</div>';
}

function estMatchVerrouille(match) {
    if (!match) return false;
    if (match.lineups_locked) return true;
    return match.status === 'completed';
}

// ═══════════════════════════════════════════════════════════
// 14 bis. STATISTIQUES DES SPORTIFS (chantier 05)
// -----------------------------------------------------------
// Jusqu'ici, gt_player_match_stats etait lue par quatre pages
// et ecrite par aucune. Les statistiques affichaient zero
// partout, depuis toujours.
//
// Ce bloc ferme le circuit :
//   rapport de match -> gt_match_events -> GTStats -> table
//
// Le calcul automatique ne remplit que ce qu'un evenement
// permet de savoir : buts, passes decisives, cartons, minutes.
// Les releves d'observation (tirs, duels, distance) se saisissent
// a la main, et un recalcul ne les efface jamais : c'est le role
// de GTStats.fusionner().
// ═══════════════════════════════════════════════════════════

// --- Qui a le droit d'ecrire les statistiques ---------------
// L'organisateur du tournoi, et tout compte que l'organisateur a
// designe officiel sur ce match ou sur le tournoi. Le code de
// role du compte n'entre pas en ligne de compte : c'est la
// designation qui ouvre le droit, comme pour les rapports.
async function verifierDroitsStatistiques(match) {
    peutGererLesStats = false;
    if (!match || !currentUser) return;

    if (match.tournament_id) {
        const { data: tournoi } = await supabaseClient
            .from(TBL_TOURNAMENTS).select('created_by').eq('id', match.tournament_id).maybeSingle();
        if (tournoi && tournoi.created_by && String(tournoi.created_by) === String(currentUser.id)) {
            peutGererLesStats = true;
            return;
        }

        const { data: designations } = await supabaseClient
            .from(TBL_OFFICIELS)
            .select('id, match_id, is_active')
            .eq('tournament_id', match.tournament_id)
            .eq('user_id', currentUser.id)
            .eq('is_active', true);

        peutGererLesStats = (designations || []).some(function(d) {
            return !d.match_id || String(d.match_id) === String(match.id);
        });
    }
}

// --- Les deux effectifs -------------------------------------
async function chargerEffectifDuMatch(match) {
    effectifDuMatch = [];
    const ids = [match.team_a_id, match.team_b_id].filter(Boolean);
    if (!ids.length) return;

    const { data: membres, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, player_name, member_name, jersey_number, position, team_id')
        .in('team_id', ids);

    if (error) {
        console.warn('Effectif indisponible :', error.message);
        return;
    }

    effectifDuMatch = (membres || []).map(function(m) {
        return {
            player_id: m.user_id || null,
            ligne_id: m.id,
            nom: m.player_name || m.member_name || 'Sportif',
            jersey_number: m.jersey_number,
            position: m.position || null,
            team_id: m.team_id
        };
    });

    effectifDuMatch.forEach(function(m) {
        if (m.player_id) nomsDesSportifs[m.player_id] = m.nom;
    });
}

// --- Les lignes deja enregistrees ---------------------------
async function chargerStatistiquesDuMatch(idMatch) {
    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_MATCH_STATS)
        .select('*')
        .eq('match_id', idMatch);

    if (error) {
        console.warn('Statistiques indisponibles :', error.message);
        statsDuMatch = [];
        return;
    }
    statsDuMatch = data || [];

    // Les noms manquants : un sportif peut avoir une ligne sans
    // figurer dans l'effectif courant (transfert, retrait).
    const inconnus = statsDuMatch
        .map(function(l) { return l.player_id; })
        .filter(function(id) { return id && !nomsDesSportifs[id]; });

    if (inconnus.length) {
        const { data: profils } = await supabaseClient
            .from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', inconnus);
        (profils || []).forEach(function(p) {
            nomsDesSportifs[p.auth_uuid] = p.full_name || 'Sportif';
        });
    }
}

// --- Le tableau ---------------------------------------------
function rendreTableauStatistiques() {
    const conteneur = document.getElementById('statsTable');
    const actions = document.getElementById('statsActions');
    if (!conteneur) return;

    if (actions) actions.style.display = peutGererLesStats ? 'flex' : 'none';

    if (!statsDuMatch.length) {
        conteneur.innerHTML = '<div class="gt-stats-vide">' +
            '<strong>Aucune statistique pour cette rencontre.</strong><br>' +
            (peutGererLesStats
                ? 'Le bouton <em>Calculer depuis les rapports</em> lit les buts, passes décisives, cartons et remplacements déjà saisis dans les rapports de match et en tire une feuille par sportif. Les relevés d\'observation — tirs, duels, distance — se saisissent ensuite à la main.'
                : 'Elles apparaîtront dès que l\'organisateur ou un officiel désigné les aura enregistrées.') +
            '</div>';
        return;
    }

    // Les titulaires d'abord, puis la note décroissante.
    const lignes = statsDuMatch.slice().sort(function(a, b) {
        const t = (b.is_starter ? 1 : 0) - (a.is_starter ? 1 : 0);
        if (t !== 0) return t;
        const na = a.match_rating == null ? -1 : Number(a.match_rating);
        const nb = b.match_rating == null ? -1 : Number(b.match_rating);
        return nb - na;
    });

    const parEquipe = {};
    lignes.forEach(function(l) {
        const cle = l.team_id == null ? 'sans' : String(l.team_id);
        if (!parEquipe[cle]) parEquipe[cle] = [];
        parEquipe[cle].push(l);
    });

    const nomEquipe = {};
    if (matchCourant) {
        nomEquipe[String(matchCourant.team_a_id)] = document.getElementById('homeTeamName').textContent;
        nomEquipe[String(matchCourant.team_b_id)] = document.getElementById('awayTeamName').textContent;
    }

    let html = '';
    Object.keys(parEquipe).forEach(function(cle) {
        const titre = cle === 'sans' ? 'Sans équipe renseignée' : (nomEquipe[cle] || 'Équipe');
        html += '<h4 class="classement-groupe">' + escapeHtml(titre) + '</h4>';
        html += '<div class="gt-stats-table-wrap"><table class="gt-stats-table"><thead><tr>' +
                '<th>Sportif</th>' +
                '<th class="num">Note</th>' +
                '<th class="num">Min</th>' +
                '<th class="num">Buts</th>' +
                '<th class="num">P. déc.</th>' +
                '<th class="num">Tirs</th>' +
                '<th class="num">Passes</th>' +
                '<th class="num">Duels</th>' +
                '<th class="num">Cartons</th>' +
                (peutGererLesStats ? '<th class="num">Saisie</th>' : '') +
                '</tr></thead><tbody>';

        parEquipe[cle].forEach(function(l) {
            const nom = nomsDesSportifs[l.player_id] || 'Sportif';
            const note = l.match_rating;
            const classe = GTStats.classeNote(note);
            const tirs = GTStats.formater({ cle: 'shots_on_target', type: 'ratio', tente: 'shots_total' }, l);
            const passes = GTStats.formater({ cle: 'passes_completed', type: 'ratio', tente: 'passes_attempted' }, l);
            const duelsTotal = (Number(l.ground_duels_total) || 0) + (Number(l.aerial_duels_total) || 0);
            const duelsGagnes = (Number(l.ground_duels_won) || 0) + (Number(l.aerial_duels_won) || 0);
            const duels = duelsTotal
                ? duelsGagnes + '/' + duelsTotal
                : GTStats.formater({ cle: 'duels_won', type: 'ratio', tente: 'duels_total' }, l);

            let cartons = '';
            for (let i = 0; i < (Number(l.yellow_cards) || 0); i++) cartons += '🟨';
            for (let j = 0; j < (Number(l.red_cards) || 0); j++) cartons += '🟥';

            html += '<tr>' +
                '<td><div class="sportif">' +
                    '<span class="num-maillot">' + (l.jersey_number != null ? escapeHtml(l.jersey_number) : '—') + '</span>' +
                    '<span><a href="player-stats.html?id=' + encodeURIComponent(l.player_id) + '" class="nom">' + escapeHtml(nom) + '</a>' +
                    (l.position_played ? '<br><span class="poste">' + escapeHtml(l.position_played) + '</span>' : '') +
                    (l.is_motm ? ' <span class="gt-badge-motm"><i class="fas fa-star"></i> Homme du match</span>' : '') +
                    '</span>' +
                '</div></td>' +
                '<td class="num"><span class="gt-note gt-note-sm ' + classe + '">' + (note == null ? '—' : Number(note).toFixed(1)) + '</span></td>' +
                '<td class="num">' + (l.minutes_played != null ? l.minutes_played + "'" : '—') + '</td>' +
                '<td class="num">' + (Number(l.goals) || 0) + (Number(l.own_goals) ? ' (csc ' + l.own_goals + ')' : '') + '</td>' +
                '<td class="num">' + (Number(l.assists) || 0) + '</td>' +
                '<td class="num">' + tirs + '</td>' +
                '<td class="num">' + passes + '</td>' +
                '<td class="num">' + duels + '</td>' +
                '<td class="num">' + (cartons || '—') + '</td>' +
                (peutGererLesStats
                    ? '<td class="num"><button class="btn-secondary btn-saisie-stat" data-sportif="' + escapeHtml(l.player_id) + '"><i class="fas fa-pen"></i></button></td>'
                    : '') +
                '</tr>';
        });

        html += '</tbody></table></div>';
    });

    conteneur.innerHTML = html;

    conteneur.querySelectorAll('.btn-saisie-stat').forEach(function(bouton) {
        bouton.addEventListener('click', function() {
            ouvrirLaSaisie(bouton.dataset.sportif);
        });
    });
}

// --- Le recalcul depuis les rapports ------------------------
async function recalculerLesStatistiquesDuMatch() {
    if (!peutGererLesStats || !matchCourant) return;
    const etat = document.getElementById('statsEtat');

    showLoader();

    const { data: evenements, error: erreurEv } = await supabaseClient
        .from(TBL_EVENTS)
        .select('id, event_type, minute, team_id, player_id, assist_player_id, detail')
        .eq('match_id', matchCourant.id);

    if (erreurEv) {
        hideLoader();
        showToast('Impossible de lire les événements : ' + erreurEv.message, 'error');
        return;
    }

    if (!evenements || !evenements.length) {
        hideLoader();
        showToast('Aucun événement enregistré pour ce match. Un rapport de match doit d\'abord être déposé : c\'est lui qui produit les buts, passes décisives et cartons.', 'warning');
        return;
    }

    // La composition : faute de feuille de match par rencontre,
    // on prend l'effectif des deux equipes. Les titulaires seront
    // ceux que la composition du match designera quand le
    // chantier « Mon équipe » sera en place ; en attendant, seuls
    // les sportifs apparaissant dans un evenement recoivent des
    // minutes.
    const compositions = effectifDuMatch
        .filter(function(m) { return m.player_id; })
        .map(function(m) {
            return {
                player_id: m.player_id,
                team_id: m.team_id,
                is_starter: false,
                position: m.position,
                jersey_number: m.jersey_number
            };
        });

    const calculees = GTStats.calculerDepuisEvenements({
        match: { id: matchCourant.id, team_a_id: matchCourant.team_a_id, team_b_id: matchCourant.team_b_id },
        evenements: evenements,
        compositions: compositions,
        duree: Number(matchCourant.duration_minutes) || 90,
        tournament_id: matchCourant.tournament_id
    });

    // On ne garde que les sportifs qui ont reellement quelque
    // chose : ecrire une ligne vide pour chaque remplacant
    // gonflerait la table sans rien apporter.
    const retenues = calculees.filter(function(l) {
        return l.minutes_played > 0 || l.goals || l.assists || l.yellow_cards || l.red_cards || l.own_goals;
    });

    if (!retenues.length) {
        hideLoader();
        showToast('Les événements de ce match ne désignent aucun sportif identifié.', 'warning');
        return;
    }

    const existantesParSportif = {};
    statsDuMatch.forEach(function(l) { if (l.player_id) existantesParSportif[l.player_id] = l; });

    let ecrites = 0, erreurs = 0;

    for (let i = 0; i < retenues.length; i++) {
        const calculee = retenues[i];
        const existante = existantesParSportif[calculee.player_id] || null;
        const fusionnee = GTStats.fusionner(existante, calculee);
        const ligne = GTStats.pourLaBase(fusionnee, { source: 'rapport', updated_by: currentUser.id });

        ligne.match_id = matchCourant.id;
        ligne.player_id = calculee.player_id;
        if (matchCourant.tournament_id) ligne.tournament_id = matchCourant.tournament_id;

        let erreur = null;
        if (existante && existante.id != null) {
            const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS)
                .update(ligne).eq('id', existante.id);
            erreur = reponse.error;
        } else {
            const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS).insert([ligne]);
            erreur = reponse.error;
        }

        if (erreur) {
            console.warn('Statistique non écrite pour ' + calculee.player_id + ' :', erreur.message);
            erreurs++;
        } else {
            ecrites++;
        }
    }

    await chargerStatistiquesDuMatch(matchCourant.id);
    hideLoader();
    rendreTableauStatistiques();

    if (etat) {
        etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + ecrites + ' feuille(s) de sportif écrites à partir de ' +
                         evenements.length + ' événement(s), le ' +
                         new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.' +
                         (erreurs ? ' ' + erreurs + ' en échec — voir la console.' : '');
    }
    showToast(ecrites + ' statistique(s) recalculée(s). Les relevés saisis à la main ont été conservés.', 'success');
}

// --- La saisie manuelle -------------------------------------
function listeDesSportifsSaisissables() {
    const vus = {};
    const liste = [];
    statsDuMatch.forEach(function(l) {
        if (!l.player_id || vus[l.player_id]) return;
        vus[l.player_id] = true;
        liste.push({ player_id: l.player_id, nom: nomsDesSportifs[l.player_id] || 'Sportif' });
    });
    effectifDuMatch.forEach(function(m) {
        if (!m.player_id || vus[m.player_id]) return;
        vus[m.player_id] = true;
        liste.push({ player_id: m.player_id, nom: m.nom });
    });
    liste.sort(function(a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
    return liste;
}

function ouvrirLaSaisie(idSportif) {
    const panneau = document.getElementById('statsSaisie');
    if (!panneau || !peutGererLesStats) return;

    const sportifs = listeDesSportifsSaisissables();
    if (!sportifs.length) {
        panneau.style.display = 'block';
        panneau.innerHTML = '<div class="gt-stats-vide">Aucun sportif identifié sur ce match. ' +
            'Les membres d\'équipe sans compte HubISoccer ne peuvent pas encore recevoir de statistiques : ' +
            'la table les repère par leur identifiant de compte.</div>';
        return;
    }

    sportifEnSaisie = idSportif || sportifs[0].player_id;
    const ligne = statsDuMatch.filter(function(l) { return String(l.player_id) === String(sportifEnSaisie); })[0] || {};

    let html = '<div class="gt-saisie-entete">' +
        '<span class="gt-saisie-titre"><i class="fas fa-pen-to-square"></i> Relevé d\'observation</span>' +
        '<span class="gt-saisie-auto-mention"><i class="fas fa-lock"></i> Les cases grisées viennent du rapport de match et ne se saisissent pas.</span>' +
        '</div>';

    html += '<div class="gt-saisie-champ" style="max-width:340px;margin-bottom:16px;">' +
        '<label for="statsSportifSelect">Sportif</label>' +
        '<select id="statsSportifSelect" class="off-champ-select">' +
        sportifs.map(function(s) {
            return '<option value="' + escapeHtml(s.player_id) + '"' +
                   (String(s.player_id) === String(sportifEnSaisie) ? ' selected' : '') + '>' +
                   escapeHtml(s.nom) + '</option>';
        }).join('') +
        '</select></div>';

    GTStats.CATEGORIES.forEach(function(categorie) {
        html += '<h4 class="classement-groupe"><i class="fas ' + categorie.icone + '"></i> ' + escapeHtml(categorie.nom) + '</h4>';
        html += '<div class="gt-saisie-grille">';
        categorie.champs.forEach(function(champ) {
            html += champSaisie(champ, ligne);
        });
        html += '</div>';
    });

    html += '<div class="match-actions" style="margin-top:20px;">' +
            '<button id="statsEnregistrerBtn" class="btn-primary"><i class="fas fa-save"></i> Enregistrer le relevé</button> ' +
            '<button id="statsFermerSaisieBtn" class="btn-secondary"><i class="fas fa-times"></i> Fermer</button>' +
            '</div>';

    panneau.innerHTML = html;
    panneau.style.display = 'block';
    panneau.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('statsSportifSelect').addEventListener('change', function() {
        ouvrirLaSaisie(this.value);
    });
    document.getElementById('statsEnregistrerBtn').addEventListener('click', enregistrerLeReleve);
    document.getElementById('statsFermerSaisieBtn').addEventListener('click', function() {
        panneau.style.display = 'none';
        panneau.innerHTML = '';
        sportifEnSaisie = null;
    });
}

function champSaisie(champ, ligne) {
    const valeur = ligne[champ.cle];
    const auto = champ.auto ? ' auto' : '';
    const attributAuto = champ.auto ? ' readonly' : '';

    if (champ.type === 'bool') {
        return '<div class="gt-saisie-champ' + auto + '">' +
               '<label for="st_' + champ.cle + '">' + escapeHtml(champ.label) + '</label>' +
               '<select id="st_' + champ.cle + '" data-cle="' + champ.cle + '" data-type="bool"' + (champ.auto ? ' disabled' : '') + '>' +
               '<option value="false"' + (valeur ? '' : ' selected') + '>Non</option>' +
               '<option value="true"' + (valeur ? ' selected' : '') + '>Oui</option>' +
               '</select></div>';
    }

    if (champ.type === 'texte') {
        return '<div class="gt-saisie-champ' + auto + '">' +
               '<label for="st_' + champ.cle + '">' + escapeHtml(champ.label) + '</label>' +
               '<input type="text" id="st_' + champ.cle + '" data-cle="' + champ.cle + '" data-type="texte" value="' +
               (valeur == null ? '' : escapeHtml(valeur)) + '"' + attributAuto + '></div>';
    }

    if (champ.type === 'ratio') {
        const cleReussi = champ.reussi || champ.cle;
        const cleTente = champ.tente || champ.cle;
        return '<div class="gt-saisie-champ' + auto + '">' +
               '<label>' + escapeHtml(champ.label) + '</label>' +
               '<div class="gt-saisie-paire">' +
               '<input type="number" min="0" step="1" data-cle="' + cleReussi + '" data-type="nombre" placeholder="réussis" value="' +
               (ligne[cleReussi] == null ? '' : ligne[cleReussi]) + '"' + attributAuto + '>' +
               '<span class="sep">/</span>' +
               '<input type="number" min="0" step="1" data-cle="' + cleTente + '" data-type="nombre" placeholder="tentés" value="' +
               (ligne[cleTente] == null ? '' : ligne[cleTente]) + '"' + attributAuto + '>' +
               '</div></div>';
    }

    const pas = champ.type === 'decimal' ? '0.01' : '1';
    return '<div class="gt-saisie-champ' + auto + '">' +
           '<label for="st_' + champ.cle + '">' + escapeHtml(champ.label) + (champ.suffixe ? ' (' + escapeHtml(champ.suffixe.trim()) + ')' : '') + '</label>' +
           '<input type="number" min="0" step="' + pas + '" id="st_' + champ.cle + '" data-cle="' + champ.cle + '" data-type="' + champ.type + '" value="' +
           (valeur == null ? '' : valeur) + '"' + attributAuto + '></div>';
}

async function enregistrerLeReleve() {
    if (!peutGererLesStats || !sportifEnSaisie || !matchCourant) return;
    const panneau = document.getElementById('statsSaisie');

    const existante = statsDuMatch.filter(function(l) { return String(l.player_id) === String(sportifEnSaisie); })[0] || null;
    const saisie = existante ? Object.assign({}, existante) : {};

    panneau.querySelectorAll('[data-cle]').forEach(function(champ) {
        if (champ.disabled || champ.readOnly) return;
        const cle = champ.dataset.cle;
        const type = champ.dataset.type;
        const brut = champ.value;

        if (type === 'bool') { saisie[cle] = champ.value === 'true'; return; }
        if (type === 'texte') { saisie[cle] = brut === '' ? null : brut; return; }
        if (brut === '') { saisie[cle] = 0; return; }
        const n = Number(brut);
        saisie[cle] = isFinite(n) ? n : 0;
    });

    saisie.match_id = matchCourant.id;
    saisie.player_id = sportifEnSaisie;
    if (matchCourant.tournament_id) saisie.tournament_id = matchCourant.tournament_id;
    if (!saisie.team_id) {
        const membre = effectifDuMatch.filter(function(m) { return String(m.player_id) === String(sportifEnSaisie); })[0];
        if (membre) saisie.team_id = membre.team_id;
    }

    // La note se recalcule a chaque enregistrement : elle depend
    // de ce qui vient d'etre saisi.
    const ligne = GTStats.pourLaBase(saisie, { source: 'saisie', updated_by: currentUser.id });

    showLoader();
    let erreur = null;
    if (existante && existante.id != null) {
        const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS).update(ligne).eq('id', existante.id);
        erreur = reponse.error;
    } else {
        const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS).insert([ligne]);
        erreur = reponse.error;
    }
    hideLoader();

    if (erreur) {
        showToast('Relevé non enregistré : ' + erreur.message, 'error');
        return;
    }

    await chargerStatistiquesDuMatch(matchCourant.id);
    rendreTableauStatistiques();
    ouvrirLaSaisie(sportifEnSaisie);
    showToast('Relevé enregistré. Note du match : ' + (ligne.match_rating == null ? 'non calculée' : ligne.match_rating) + '.', 'success');
}

// --- Le point d'entree, appele depuis loadMatchDetails -------
async function monterLesStatistiques(match) {
    matchCourant = match;
    nomsDesSportifs = {};
    sportifEnSaisie = null;
    const panneau = document.getElementById('statsSaisie');
    if (panneau) { panneau.style.display = 'none'; panneau.innerHTML = ''; }

    await verifierDroitsStatistiques(match);
    await chargerEffectifDuMatch(match);
    await chargerStatistiquesDuMatch(match.id);
    rendreTableauStatistiques();
}

// ═══════════════════════════════════════════════════════════
// 15. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 16. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('refreshBtn')?.addEventListener('click', function() { if (matchId) loadMatchDetails(matchId); });
    document.getElementById('statsRecalcBtn')?.addEventListener('click', recalculerLesStatistiquesDuMatch);
    document.getElementById('statsSaisieBtn')?.addEventListener('click', function() { ouvrirLaSaisie(null); });

    matchId = getMatchIdFromURL();
    // loadMatchDetails() monte le sélecteur quand l'identifiant
    // manque : on l'appelle dans les deux cas.
    await loadMatchDetails(matchId);
});
