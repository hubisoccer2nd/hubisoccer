/* ============================================================
   HubISoccer — manage-tournament.js
   Système Gestion Tournois — Gérer un tournoi
   ------------------------------------------------------------
   Corrections critiques appliquees a ce fichier :
   - Toutes les tables migrees vers supabaseAuthPrive_gt_*.
   - gestionnairetournoi_reports (table qui n'existe plus depuis
     la migration, fusionnee dans match_reports) -> pointe
     desormais vers supabaseAuthPrive_gt_match_reports.
   - AUCUNE verification de permission n'existait -- n'importe
     quel utilisateur connecte pouvait gerer n'importe quel
     tournoi en changeant juste l'id dans l'URL. Ajout d'un
     controle created_by === currentUser.id, avec ecran "Acces
     refuse" si ce n'est pas le cas.
   - Fonctionnalite manquante depuis l'audit initial : aucun
     moyen d'enregistrer un resultat de match une fois joue.
     Ajoutee (bouton "Enregistrer resultat" par match, modale
     dediee, marque le match 'completed').
   - Inscriptions affichaient un UUID brut au lieu du nom -> jointure
     avec profiles.
   - Formulaire de modification utilisait uniquement is_active ->
     remplace par le vrai champ status (draft/published/completed/
     cancelled), coherent avec le reste du systeme partage.
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
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS        = 'supabaseAuthPrive_gt_sports';
const TBL_PARTICIPANTS   = 'supabaseAuthPrive_gt_participants';
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS      = 'supabaseAuthPrive_gt_team_players';
const TBL_MATCHES          = 'supabaseAuthPrive_gt_matches';
const TBL_REPORTS           = 'supabaseAuthPrive_gt_match_reports';
const TBL_PRIZES              = 'supabaseAuthPrive_gt_prizes';
// CHANTIER 15 — les récompenses PROMISES, saisies à la création du
// tournoi. Elles étaient affichées sur la page publique mais aucune
// page ne pouvait dire QUI les avait gagnées.
const TBL_AWARDS              = 'supabaseAuthPrive_gt_tournament_awards';
const TBL_PROFILES              = 'supabaseAuthPrive_profiles';
const TBL_STANDINGS = 'supabaseAuthPrive_gt_standings';
const TBL_OFFICIELS = 'supabaseAuthPrive_gt_tournament_officials';
const TBL_EVENTS = 'supabaseAuthPrive_gt_match_events';
const TBL_PLAYER_MATCH_STATS = 'supabaseAuthPrive_gt_player_match_stats';
const TBL_PLAYER_TOURNAMENT_STATS = 'supabaseAuthPrive_gt_player_tournament_stats';
const TBL_PAIEMENTS = 'supabaseAuthPrive_gt_payment_requests';
const TBL_MOYENS_TOURNOI = 'supabaseAuthPrive_gt_tournament_payment_methods';
const TBL_CATALOGUE_MOYENS = 'supabaseAuthPrive_payment_methods';
const TBL_ACCORDS = 'supabaseAuthPrive_gt_organizer_agreements';
const TBL_WALLETS = 'supabaseAuthPrive_hubis_wallets';
const TBL_TRANSACTIONS = 'supabaseAuthPrive_hubis_transactions';
const LOGO_BUCKET                  = 'gt-team-logos';

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
let currentTournamentId = null;
let currentTournament = null;

// Chantier 08 — le vocabulaire de la discipline. currentTournament
// porte deja sport.name : on ne refait aucune requete, on lit ce
// qui est deja charge. Tant que le tournoi n'est pas charge, le
// lexique repond « sportif ».
function sportDuTournoi() {
    return (currentTournament && currentTournament.sport && currentTournament.sport.name) || '';
}
function mot(gabarit) {
    if (!window.GTLexique) return gabarit;
    return GTLexique.remplir(gabarit, sportDuTournoi());
}
function appliquerLexique() {
    if (window.GTLexique) GTLexique.appliquer(sportDuTournoi());
}
let allTeams = [];

const STATUS_LABELS = { draft: 'Brouillon', published: 'Publié', completed: 'Terminé', cancelled: 'Annulé' };

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
function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }

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

    // CHANTIER 14 — la cloche cesse d'être un décor.
    // Elle affichait « 0 » en dur sur les 26 pages du gestionnaire
    // de tournoi, alors que la plateforme tient une vraie table de
    // notifications que 26 autres fichiers alimentent déjà.
    if (typeof GTNotify !== 'undefined' && userProfile && userProfile.hubisoccer_id) {
        // On ne passe QUE la table des notifications.
        //
        // La première version passait aussi TBL_PROFILES — une
        // constante qui n'existe pas dans acceuil.js ni dans
        // tournament-details.js. loadProfile() levait alors un
        // ReferenceError, la page ne finissait jamais de charger et
        // restait bloquée sur « Chargement en cours… ».
        //
        // brancherLaCloche() ne lit que les notifications : cette
        // dépendance n'avait aucune raison d'être.
        GTNotify.brancherLaCloche(
            supabaseClient,
            { notifications: 'supabaseAuthPrive_notifications' },
            userProfile.hubisoccer_id
        );
    }
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
// 11. RÉCUPÉRATION DE L'ID DU TOURNOI
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DU TOURNOI + VÉRIFICATION DE PROPRIÉTÉ
// ═══════════════════════════════════════════════════════════
// Le type et le sport d'un tournoi, par des requêtes SÉPARÉES.
//
// PostgREST n'accepte  table(colonnes)  que si une clé étrangère
// déclare la relation. Quand elle manque, il refuse TOUTE la requête
// et la page affiche « Tournoi introuvable ». On range le résultat
// sous les deux formes que le code lisait déjà : t.sport / t.type.
async function attacherTypeEtSport(tournois) {
    const idsType = [], idsSport = [];
    (tournois || []).forEach(function(t) {
        if (t.type_id  && idsType.indexOf(t.type_id) === -1)   idsType.push(t.type_id);
        if (t.sport_id && idsSport.indexOf(t.sport_id) === -1) idsSport.push(t.sport_id);
    });
    const parType = {}, parSport = {};
    if (idsType.length) {
        const r = await supabaseClient.from(TBL_TYPES).select('id, name, label').in('id', idsType);
        if (!r.error) (r.data || []).forEach(function(x) { parType[x.id] = x; });
    }
    if (idsSport.length) {
        const r = await supabaseClient.from(TBL_SPORTS).select('id, name').in('id', idsSport);
        if (!r.error) (r.data || []).forEach(function(x) { parSport[x.id] = x; });
    }
    (tournois || []).forEach(function(t) {
        t[TBL_TYPES]  = parType[t.type_id]   || null;
        t[TBL_SPORTS] = parSport[t.sport_id] || null;
        t.type  = t[TBL_TYPES];
        t.sport = t[TBL_SPORTS];
    });
    return tournois;
}

async function loadTournament() {
    currentTournamentId = getTournamentIdFromURL();
    if (!currentTournamentId) {
        // Plus de toast rouge ni de redirection forcée : la page
        // est atteignable depuis le menu, on propose donc le choix.
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'tournoi',
            parametre: 'id',
            portee: 'mesTournois',
            icone: 'fa-sliders-h',
            titre: 'Quel tournoi voulez-vous gérer ?',
            aide: 'Seuls les tournois que vous avez créés apparaissent ici.',
            messageVide: 'Vous n\'avez encore créé aucun tournoi.'
        });
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*')
        .eq('id', currentTournamentId)
        .single();

    if (data) await attacherTypeEtSport([data]);
    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable.', 'error');
        window.location.href = 'acceuil.html';
        return;
    }

    // Verification de propriete : seul le createur peut gerer ce tournoi
    if (data.created_by !== currentUser.id) {
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('accessDenied').style.display = 'flex';
        return;
    }

    currentTournament = data;
    appliquerLexique();
    document.getElementById('tournamentName').innerHTML = '<i class="fas fa-sliders-h"></i> ' + escapeHtml(data.name || 'Gestion du tournoi');
    document.getElementById('inviteParticipantsLink').href = 'invite-participants.html?tournament_id=' + currentTournamentId;
    fillFormatTab(data);
    fillInfoTab(data);
    loadRegistrations();
    loadTeams();
    loadMatches();
    loadReports();
    loadPrizes();
    loadSignatures();
}

// ═══════════════════════════════════════════════════════════
// 13. REMPLIR L'ONGLET INFOS
// ═══════════════════════════════════════════════════════════
function fillInfoTab(t) {
    document.getElementById('infoName').textContent = t.name || '—';
    document.getElementById('infoDates').textContent = (t.start_date ? new Date(t.start_date).toLocaleDateString('fr-FR') : '?') + ' → ' + (t.end_date ? new Date(t.end_date).toLocaleDateString('fr-FR') : '?');
    document.getElementById('infoLocation').textContent = t.location || '—';
    document.getElementById('infoSport').textContent = t.sport?.name || '—';
    document.getElementById('infoType').textContent = t.type?.label || t.type?.name || '—';
    document.getElementById('infoStatus').textContent = STATUS_LABELS[t.status] || t.status || '—';
    document.getElementById('infoPrize').textContent = t.prize_pool ? formatMoney(t.prize_pool) + ' FCFA' : '—';
    document.getElementById('infoDescription').textContent = t.description || 'Aucune description.';
}

// ═══════════════════════════════════════════════════════════
// 14. ONGLET INSCRIPTIONS
// ------------------------------------------------------------
// Corrige un bug reel : la jointure directe vers profiles
// suppose une relation de cle etrangere explicite entre
// gt_participants.user_id et profiles, jamais verifiee. Si elle
// n'existe pas, Supabase renvoie une erreur et les deux listes
// restent vides sans aucun message. Deux requetes separees,
// fusionnees en JS, ne dependent d'aucune relation a deviner.
// ═══════════════════════════════════════════════════════════
async function loadRegistrations() {
    document.getElementById('pendingRegistrationsList').innerHTML = '<p class="empty-hint">Chargement…</p>';
    document.getElementById('approvedRegistrationsList').innerHTML = '<p class="empty-hint">Chargement…</p>';

    const { data, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id, status, user_id, created_at')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur inscriptions:', error.message);
        document.getElementById('pendingRegistrationsList').innerHTML = '<p class="empty-hint error">Erreur de chargement : ' + escapeHtml(error.message) + '</p>';
        document.getElementById('approvedRegistrationsList').innerHTML = '';
        return;
    }

    if (!data.length) {
        renderPendingRegistrations([]);
        renderApprovedRegistrations([]);
        return;
    }

    // Requete separee pour les noms -- ne depend d'aucune relation FK
    const userIds = [...new Set(data.map(function(r) { return r.user_id; }))];
    const { data: profiles } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, hubisoccer_id')
        .in('auth_uuid', userIds);

    const profileByUserId = {};
    (profiles || []).forEach(function(p) { profileByUserId[p.auth_uuid] = p; });
    data.forEach(function(r) { r._profile = profileByUserId[r.user_id] || null; });

    const pending = data.filter(function(r) { return r.status === 'pending'; });
    const approved = data.filter(function(r) { return r.status === 'approved'; });
    renderPendingRegistrations(pending);
    renderApprovedRegistrations(approved);
}

function participantName(r) {
    return r._profile ? escapeHtml(r._profile.full_name || r._profile.hubisoccer_id || 'Participant') : 'Participant';
}

async function approveRegistration(registrationId) {
    const { error } = await supabaseClient.from(TBL_PARTICIPANTS).update({ status: 'approved' }).eq('id', registrationId);
    if (error) { showToast('Erreur lors de l\'approbation', 'error'); }
    else { showToast('Inscription approuvée', 'success'); loadRegistrations(); }
}

async function rejectRegistration(registrationId) {
    const { error } = await supabaseClient.from(TBL_PARTICIPANTS).update({ status: 'rejected' }).eq('id', registrationId);
    if (error) { showToast('Erreur lors du rejet', 'error'); }
    else { showToast('Inscription rejetée', 'warning'); loadRegistrations(); }
}

function renderPendingRegistrations(list) {
    const container = document.getElementById('pendingRegistrationsList');
    if (!container) return;
    if (!list.length) { container.innerHTML = '<p class="empty-hint">Aucune demande en attente.</p>'; return; }
    container.innerHTML = list.map(function(r) {
        return '<div class="registration-item">' +
               '<span class="reg-name"><i class="fas fa-user"></i> ' + participantName(r) + '</span>' +
               '<div class="actions">' +
               '<button class="btn-approve" onclick="approveRegistration(\'' + r.id + '\')"><i class="fas fa-check"></i> Approuver</button>' +
               '<button class="btn-reject" onclick="rejectRegistration(\'' + r.id + '\')"><i class="fas fa-times"></i> Rejeter</button>' +
               '</div></div>';
    }).join('');
}

function renderApprovedRegistrations(list) {
    const container = document.getElementById('approvedRegistrationsList');
    if (!container) return;
    if (!list.length) { container.innerHTML = '<p class="empty-hint">Aucune inscription validée.</p>'; return; }
    container.innerHTML = list.map(function(r) {
        return '<div class="registration-item approved"><span class="reg-name"><i class="fas fa-user-check"></i> ' + participantName(r) + '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. ONGLET ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadTeams() {
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('name');
    if (error) { console.error('Erreur chargement équipes:', error.message); return; }
    allTeams = data || [];
    renderTeams();
}

function renderTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    if (!allTeams.length) { container.innerHTML = '<p class="empty-hint">Aucune équipe pour ce tournoi.</p>'; return; }
    container.innerHTML = allTeams.map(function(team) {
        const logo = team.logo_url
            ? '<img src="' + team.logo_url + '" alt="logo" class="team-logo">'
            : '<div class="team-logo-placeholder"><i class="fas fa-shield-alt"></i></div>';
        const groupOptions = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(function(g) {
            const label = g === '' ? 'Sans groupe' : 'Groupe ' + g;
            return '<option value="' + g + '"' + (team.group_name === g ? ' selected' : '') + '>' + label + '</option>';
        }).join('');
        return '<div class="team-card">' + logo +
               '<div class="team-name">' + escapeHtml(team.name) + '</div>' +
               (team.age_category ? '<div class="team-age">' + escapeHtml(team.age_category) + '</div>' : '') +
               '<select class="team-group-select" data-team-id="' + team.id + '">' + groupOptions + '</select>' +
               '<a class="btn-roster" href="team-details.html?id=' + team.id + '"><i class="fas fa-users"></i> Effectif</a>' +
               '<button class="btn-delete" onclick="deleteTeam(\'' + team.id + '\')"><i class="fas fa-trash"></i></button>' +
               '</div>';
    }).join('');

    document.querySelectorAll('.team-group-select').forEach(function(select) {
        select.addEventListener('change', function() { updateTeamGroup(this.dataset.teamId, this.value); });
    });
}

async function updateTeamGroup(teamId, groupName) {
    const { error } = await supabaseClient
        .from(TBL_TEAMS)
        .update({ group_name: groupName || null })
        .eq('id', teamId);
    if (error) { showToast('Erreur assignation du groupe : ' + error.message, 'error'); return; }
    const team = allTeams.find(function(t) { return String(t.id) === String(teamId); });
    if (team) team.group_name = groupName || null;
    showToast('Groupe mis à jour', 'success', 3000);
}

// ═══════════════════════════════════════════════════════════
// FORMAT DE COMPÉTITION (championnat / groupes+élimination /
// élimination directe) — reglable par l'organisateur, propre a
// chaque tournoi, ne touche jamais aux equipes ni aux effectifs existants.
// ═══════════════════════════════════════════════════════════
// Etat du verrou : rempli par verifierResultatsEnregistres().
let matchsAvecResultat = [];

// Combien de matchs portent deja un score ? Tant que la reponse
// est zero, le format se change librement. Des qu'elle ne l'est
// plus, on previent nommement avant de laisser regenerer.
async function verifierResultatsEnregistres() {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, round, team_a_id, team_b_id, score_a, score_b, status')
        .eq('tournament_id', currentTournamentId)
        .not('score_a', 'is', null);

    if (error) {
        console.warn('Verification des resultats indisponible :', error.message);
        matchsAvecResultat = [];
        return matchsAvecResultat;
    }
    matchsAvecResultat = data || [];
    return matchsAvecResultat;
}

function fillFormatTab(tournament) {
    // L'editeur complet (gt-formats.js) remplace les trois choix
    // codes en dur : 23 formats, parametres, bareme, departage et
    // zones de qualification.
    GTFormats.monterEditeur({
        conteneur: 'gtFormatEditeur',
        configuration: tournament
    });

    verifierResultatsEnregistres().then(function(matchs) {
        const avertissement = document.getElementById('formatAvertissement');
        if (!avertissement) return;

        if (!matchs.length) {
            avertissement.style.display = 'none';
            avertissement.innerHTML = '';
            return;
        }

        // Ta decision 03 : on supprime le calendrier et on regenere.
        // La securite ajoutee : l'avertissement est nomme, et il faut
        // confirmer par ecrit.
        avertissement.style.display = 'block';
        avertissement.innerHTML =
            '<div class="format-avertissement-tete">' +
                '<i class="fas fa-triangle-exclamation"></i>' +
                '<div>' +
                    '<strong>' + matchs.length + ' match' + (matchs.length > 1 ? 's ont' : ' a') +
                    ' un résultat enregistré.</strong>' +
                    '<p>Changer le format supprimera le calendrier et le régénérera : ces résultats seront perdus. ' +
                    'Un calendrier de poules et un tableau à élimination directe n\'ont aucune structure commune, il n\'y a rien à convertir.</p>' +
                '</div>' +
            '</div>' +
            '<ul class="format-avertissement-liste">' +
                matchs.slice(0, 8).map(function(m) {
                    const tour = m.round ? escapeHtml(m.round) + ' — ' : '';
                    return '<li>' + tour + 'score ' + (m.score_a ?? 0) + ' – ' + (m.score_b ?? 0) + '</li>';
                }).join('') +
                (matchs.length > 8 ? '<li>… et ' + (matchs.length - 8) + ' autre(s)</li>' : '') +
            '</ul>' +
            '<label class="format-avertissement-confirme">' +
                '<span>Pour confirmer, écris <code>SUPPRIMER</code> ci-dessous :</span>' +
                '<input type="text" id="formatConfirmation" autocomplete="off" placeholder="SUPPRIMER">' +
            '</label>';
    });
}

async function saveFormat() {
    const configuration = GTFormats.lire();
    if (!configuration) {
        showToast('Choisissez d\'abord un format de compétition.', 'warning');
        return;
    }

    // Verrou : si des resultats existent, on exige la confirmation
    // ecrite avant de toucher au format.
    if (matchsAvecResultat.length) {
        const champ = document.getElementById('formatConfirmation');
        const saisie = champ ? champ.value.trim().toUpperCase() : '';
        if (saisie !== 'SUPPRIMER') {
            showToast('Écris SUPPRIMER dans le champ de confirmation : ' + matchsAvecResultat.length +
                      ' résultat(s) vont être perdus.', 'warning');
            if (champ) champ.focus();
            return;
        }
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .update(configuration)
        .eq('id', currentTournamentId);
    hideLoader();

    if (error) {
        showToast('Erreur enregistrement du format : ' + error.message, 'error');
        return;
    }

    currentTournament = Object.assign(currentTournament, configuration);
    matchsAvecResultat = [];
    const avertissement = document.getElementById('formatAvertissement');
    if (avertissement) { avertissement.style.display = 'none'; avertissement.innerHTML = ''; }

    showToast('Format enregistré : ' + (configuration.format_config.nom || configuration.format_type), 'success');
}

// ═══════════════════════════════════════════════════════════
// TIRAGE DES GROUPES ET GENERATION DU CALENDRIER (chantier 02)
// ------------------------------------------------------------
// Le calcul vit dans gt-calendrier.js, qui ne touche ni au DOM ni
// au reseau. Ici on ne fait que : lire les equipes, appeler le
// moteur, montrer un apercu, puis ecrire en base apres
// confirmation.
// ═══════════════════════════════════════════════════════════

let dernierTirage = null;
let calendrierPropose = null;

// ---------- TIRAGE DES GROUPES ----------

async function tirerLesGroupes() {
    const equipes = await chargerEquipesDuTournoi();
    if (equipes.length < 2) {
        showToast('Il faut au moins deux équipes inscrites pour tirer les groupes.', 'warning');
        return;
    }

    const nbGroupes = parseInt(document.getElementById('tirageNbGroupes').value, 10) || 2;
    const mode = document.getElementById('tirageMode').value;

    if (nbGroupes > equipes.length) {
        showToast('Il y a ' + equipes.length + ' équipe(s) pour ' + nbGroupes + ' groupes : réduis le nombre de groupes.', 'warning');
        return;
    }

    let options = {};
    if (mode === 'chapeaux') {
        const nbChapeaux = parseInt(document.getElementById('tirageNbChapeaux').value, 10) || 4;
        const parChapeau = Math.ceil(equipes.length / nbChapeaux);
        const chapeaux = [];
        for (let i = 0; i < equipes.length; i += parChapeau) {
            chapeaux.push(equipes.slice(i, i + parChapeau).map(function(e) { return e.id; }));
        }
        options.chapeaux = chapeaux;
    }

    const repartition = GTCalendrier.tirerGroupes(equipes.map(function(e) { return e.id; }), nbGroupes, options);
    dernierTirage = repartition;
    afficherApercuTirage(repartition, equipes);
}

function afficherApercuTirage(repartition, equipes) {
    const nomDe = {};
    equipes.forEach(function(e) { nomDe[e.id] = e.name; });

    const zone = document.getElementById('tirageApercu');
    zone.style.display = 'block';
    zone.innerHTML =
        '<div class="tirage-groupes">' +
        Object.keys(repartition).map(function(groupe) {
            return '<div class="tirage-groupe">' +
                   '<h4>' + escapeHtml(groupe) + '</h4>' +
                   '<ol>' + repartition[groupe].map(function(id) {
                       return '<li>' + escapeHtml(nomDe[id] || 'Équipe ' + id) + '</li>';
                   }).join('') + '</ol></div>';
        }).join('') +
        '</div>' +
        '<div class="tirage-actions">' +
            '<button type="button" class="btn-secondary" id="retirerBtn"><i class="fas fa-rotate"></i> Retirer au sort</button>' +
            '<button type="button" class="btn-primary" id="validerTirageBtn"><i class="fas fa-check"></i> Valider ce tirage</button>' +
        '</div>' +
        '<p class="section-hint">Tant que tu n\'as pas validé, rien n\'est écrit. Tu peux relancer le tirage autant de fois que tu veux.</p>';

    document.getElementById('retirerBtn').addEventListener('click', tirerLesGroupes);
    document.getElementById('validerTirageBtn').addEventListener('click', validerLeTirage);
}

async function validerLeTirage() {
    if (!dernierTirage) return;

    showLoader();
    let erreurs = 0;
    for (const groupe of Object.keys(dernierTirage)) {
        for (const idEquipe of dernierTirage[groupe]) {
            const { error } = await supabaseClient
                .from(TBL_TEAMS)
                .update({ group_name: groupe })
                .eq('id', idEquipe);
            if (error) erreurs++;
        }
    }
    hideLoader();

    if (erreurs) {
        showToast(erreurs + ' équipe(s) n\'ont pas pu être placées.', 'error');
        return;
    }

    showToast('Tirage validé : ' + Object.keys(dernierTirage).length + ' groupes constitués.', 'success');
    document.getElementById('tirageApercu').style.display = 'none';
    dernierTirage = null;
    await loadTeams();
}

// ---------- GENERATION DU CALENDRIER ----------

async function chargerEquipesDuTournoi() {
    // CORRECTION — aucun tournoi choisi, aucune requête.
    //
    // Sans ce garde-fou, l'identifiant valait null, PostgREST
    // recevait  tournament_id=eq.null  et PostgreSQL répondait
    //     « invalid input syntax for type bigint: "null" »
    // Le message rouge « Impossible de charger les équipes »
    // s'affichait sur l'écran de choix du tournoi, avant même
    // qu'on ait choisi quoi que ce soit.
    if (currentTournamentId == null || currentTournamentId === '') return [];

    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('id, name, group_name')
        .eq('tournament_id', currentTournamentId)
        .order('name');
    if (error) {
        showToast('Impossible de charger les équipes : ' + error.message, 'error');
        return [];
    }
    return data || [];
}

async function preparerGeneration() {
    const config = currentTournament && currentTournament.format_config ? currentTournament.format_config : null;
    const code = config && config.code ? config.code : null;

    if (!code) {
        showToast('Choisis d\'abord un format dans l\'onglet Format.', 'warning');
        return;
    }

    const equipes = await chargerEquipesDuTournoi();
    if (equipes.length < 2) {
        showToast('Il faut au moins deux équipes inscrites.', 'warning');
        return;
    }

    const format = GTFormats.parCode(code);
    const valeurs = config.valeurs || {};

    // Si les equipes portent deja un groupe, on respecte ce
    // decoupage plutot que d'en tirer un nouveau.
    let groupesExistants = null;
    const avecGroupe = equipes.filter(function(e) { return e.group_name; });
    if (avecGroupe.length === equipes.length && avecGroupe.length) {
        groupesExistants = {};
        equipes.forEach(function(e) {
            (groupesExistants[e.group_name] = groupesExistants[e.group_name] || []).push(e.id);
        });
    }

    const resultat = GTCalendrier.genererDepuisFormat(
        code,
        format ? format.famille : 'championnat',
        valeurs,
        equipes.map(function(e) { return e.id; }),
        { groupesExistants: groupesExistants }
    );

    calendrierPropose = GTCalendrier.repartirDates(
        resultat.rencontres,
        currentTournament.start_date,
        currentTournament.end_date
    );

    const existants = await compterMatchsExistants();
    afficherApercuGeneration(format, resultat, equipes, existants, groupesExistants);
    openModal('genererCalendrierModal');
}

async function compterMatchsExistants() {
    const { data } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, score_a')
        .eq('tournament_id', currentTournamentId);
    const tous = data || [];
    return { total: tous.length, avecResultat: tous.filter(function(m) { return m.score_a !== null; }).length };
}

function afficherApercuGeneration(format, resultat, equipes, existants, groupesExistants) {
    const nomDe = {};
    equipes.forEach(function(e) { nomDe[e.id] = e.name; });

    const rencontres = calendrierPropose;
    const vraisMatchs = rencontres.filter(function(m) { return !m.exemption && !m.aDefinir; });
    const exemptions  = rencontres.filter(function(m) { return m.exemption; });
    const aDefinir    = rencontres.filter(function(m) { return m.aDefinir; });
    const journees    = new Set(rencontres.map(function(m) { return m.journee || m.tour; })).size;

    let html = '<div class="apercu-resume">' +
        '<div class="apercu-chiffre"><b>' + (format ? escapeHtml(format.nom) : '—') + '</b><span>Format</span></div>' +
        '<div class="apercu-chiffre"><b>' + equipes.length + '</b><span>Équipes</span></div>' +
        '<div class="apercu-chiffre"><b>' + vraisMatchs.length + '</b><span>Rencontres</span></div>' +
        '<div class="apercu-chiffre"><b>' + journees + '</b><span>Journées / tours</span></div>' +
        '</div>';

    if (resultat.avertissement) {
        html += '<p class="apercu-note"><i class="fas fa-circle-info"></i> ' + escapeHtml(resultat.avertissement) + '</p>';
    }
    if (exemptions.length) {
        html += '<p class="apercu-note"><i class="fas fa-forward"></i> ' + exemptions.length +
                ' exemption(s) : le tableau compte plus de places que d\'équipes, ces équipes passent le premier tour sans jouer.</p>';
    }
    if (aDefinir.length) {
        html += '<p class="apercu-note"><i class="fas fa-hourglass-half"></i> ' + aDefinir.length +
                ' rencontre(s) restent à définir : leurs affiches se remplissent au fur et à mesure des qualifications.</p>';
    }
    if (groupesExistants) {
        html += '<p class="apercu-note"><i class="fas fa-users"></i> Les groupes déjà attribués aux équipes sont respectés : aucun nouveau tirage.</p>';
    }

    if (existants.total) {
        html += '<div class="apercu-danger">' +
            '<i class="fas fa-triangle-exclamation"></i>' +
            '<div><strong>' + existants.total + ' match' + (existants.total > 1 ? 's existent' : ' existe') + ' déjà pour ce tournoi';
        if (existants.avecResultat) {
            html += ', dont <strong>' + existants.avecResultat + ' avec un résultat enregistré</strong>';
        }
        html += '.</strong>' +
            '<p>Générer remplacera l\'intégralité du calendrier. ' +
            (existants.avecResultat ? 'Les résultats seront perdus. ' : '') +
            'Pour confirmer, écris <code>REMPLACER</code> ci-dessous.</p>' +
            '<input type="text" id="generationConfirmation" autocomplete="off" placeholder="REMPLACER">' +
            '</div></div>';
    }

    // Apercu des 12 premieres rencontres
    html += '<h4 class="apercu-titre">Aperçu</h4><ul class="apercu-liste">' +
        rencontres.slice(0, 12).map(function(m) {
            const a = m.equipeA ? escapeHtml(nomDe[m.equipeA] || '?') : '<em>à définir</em>';
            const b = m.equipeB ? escapeHtml(nomDe[m.equipeB] || '?') : (m.exemption ? '<em>exempt</em>' : '<em>à définir</em>');
            const date = m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
            return '<li><span class="apercu-tour">' + escapeHtml(m.tour) + '</span>' +
                   '<span class="apercu-affiche">' + a + ' – ' + b + '</span>' +
                   '<span class="apercu-date">' + date + '</span></li>';
        }).join('') +
        (rencontres.length > 12 ? '<li class="apercu-reste">… et ' + (rencontres.length - 12) + ' autre(s)</li>' : '') +
        '</ul>';

    document.getElementById('genererApercu').innerHTML = html;
}

async function confirmerGeneration() {
    if (!calendrierPropose || !calendrierPropose.length) {
        showToast('Rien à générer.', 'warning');
        return;
    }

    const champ = document.getElementById('generationConfirmation');
    if (champ && champ.value.trim().toUpperCase() !== 'REMPLACER') {
        showToast('Écris REMPLACER dans le champ de confirmation : le calendrier actuel va être remplacé.', 'warning');
        champ.focus();
        return;
    }

    showLoader();

    // Remplacement : on retire les rencontres existantes avant de
    // reecrire. C'est ta decision 03 — un calendrier de poules et un
    // tableau a elimination directe n'ont aucune structure commune,
    // il n'y a rien a convertir.
    if (champ) {
        const { error: erreurSuppression } = await supabaseClient
            .from(TBL_MATCHES)
            .delete()
            .eq('tournament_id', currentTournamentId);
        if (erreurSuppression) {
            hideLoader();
            showToast('Impossible de retirer l\'ancien calendrier : ' + erreurSuppression.message, 'error');
            return;
        }
    }

    const maintenant = new Date().toISOString();
    const lignes = calendrierPropose.map(function(m) {
        return {
            tournament_id: currentTournamentId,
            team_a_id: m.equipeA || null,
            team_b_id: m.equipeB || null,
            match_date: m.date || null,
            round: m.tour,
            matchday: m.journee || null,
            group_name: m.groupe || null,
            bracket_position: m.positionTableau || null,
            // CHANTIER 13 — la taille du tour accompagne la rencontre.
            // Sans elle, il fallait analyser le nom du tour pour savoir
            // si « Quarts de finale » venait avant ou apres « Demi-
            // finales ». Un tournoi renomme cassait le tableau.
            round_code: m.codeTour || null,
            round_size: m.tailleTour || null,
            leg: m.manche || 1,
            is_bye: !!m.exemption,
            status: m.exemption ? 'completed' : 'scheduled',
            generated_at: maintenant
        };
    });

    // Insertion par paquets : une ligue a 380 rencontres, PostgREST
    // n'aime pas les charges utiles trop grosses.
    let inseres = 0;
    for (let i = 0; i < lignes.length; i += 100) {
        const paquet = lignes.slice(i, i + 100);
        const { error } = await supabaseClient.from(TBL_MATCHES).insert(paquet);
        if (error) {
            hideLoader();
            showToast('Erreur à l\'insertion (' + inseres + ' rencontre(s) déjà créées) : ' + error.message, 'error');
            await loadMatches();
            return;
        }
        inseres += paquet.length;
    }

    // CHANTIER 13 — les exemptions passent d'office, tout de suite.
    // Avant, une equipe exemptee au premier tour restait bloquee :
    // sa case du tour suivant restait vide jusqu'a ce que
    // l'organisateur la remplisse a la main.
    const avance = await fairePropagerLeTableau({ silencieux: true });

    hideLoader();
    closeModal('genererCalendrierModal');
    calendrierPropose = null;
    // CHANTIER 14 — les equipes apprennent que le calendrier est sorti.
    const equipesDuCalendrier = [];
    lignes.forEach(function(l) {
        if (l.team_a_id && equipesDuCalendrier.indexOf(l.team_a_id) === -1) equipesDuCalendrier.push(l.team_a_id);
        if (l.team_b_id && equipesDuCalendrier.indexOf(l.team_b_id) === -1) equipesDuCalendrier.push(l.team_b_id);
    });
    const prevenu = await previenirLesEquipes(equipesDuCalendrier, {
        type: 'tournoi_calendrier',
        titre: 'Calendrier publié',
        message: 'Le calendrier de ' + nomDuTournoi() + ' est disponible. Regarde quand tu joues.',
        lien: GTNotify.lien('tournament-details.html', { id: currentTournamentId })
    });

    showToast(inseres + ' rencontre(s) générées.' +
              (avance && avance.ecrites ? ' ' + avance.ecrites + ' place(s) déjà remplie(s) par les exemptions.' : '') +
              (prevenu ? ' ' + GTNotify.resumer(prevenu, 'le calendrier') : ''),
              prevenu && prevenu.erreur ? 'warning' : 'success');
    await loadMatches();
}

// ═══════════════════════════════════════════════════════════
// RECALCUL DU CLASSEMENT (chantier 03)
// ------------------------------------------------------------
// Le calcul vit dans gt-classement.js, qui ne touche ni au DOM ni
// au reseau. Ici : lire matchs et equipes, appeler le moteur,
// ecrire gt_standings, montrer le resultat.
//
// Rien ne se declenche automatiquement — c'est le bouton qui
// commande, comme decide au point 06.
// ═══════════════════════════════════════════════════════════

async function recalculerLeClassement() {
    const etat = document.getElementById('classementEtat');
    const apercu = document.getElementById('classementApercu');

    showLoader();

    // --- Les rencontres
    const { data: matchs, error: erreurMatchs } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, team_a_id, team_b_id, score_a, score_b, status, is_bye, matchday, match_date, group_name, forfeit_team_id, penalty_winner_id')
        .eq('tournament_id', currentTournamentId);

    if (erreurMatchs) {
        hideLoader();
        showToast('Impossible de lire les rencontres : ' + erreurMatchs.message, 'error');
        return;
    }

    // --- Les equipes
    const equipes = await chargerEquipesDuTournoi();
    if (!equipes.length) {
        hideLoader();
        showToast('Aucune équipe inscrite : rien à classer.', 'warning');
        return;
    }

    // --- Les reglages venus du chantier 01
    const config = currentTournament.format_config || {};
    const bareme = {
        pointsVictoire:          currentTournament.points_win  ?? 3,
        pointsNul:               currentTournament.points_draw ?? 1,
        pointsDefaite:           currentTournament.points_loss ?? 0,
        pointsVictoireTirsAuBut: config.pointsVictoireTirsAuBut ?? 2,
        pointsDefaiteTirsAuBut:  config.pointsDefaiteTirsAuBut  ?? 1,
        forfaitVainqueur:        currentTournament.forfeit_score_winner ?? 3,
        forfaitPerdant:          currentTournament.forfeit_score_loser  ?? 0
    };
    const departage = Array.isArray(currentTournament.tiebreak_rules) && currentTournament.tiebreak_rules.length
        ? currentTournament.tiebreak_rules
        : GTClassement.DEPARTAGE_DEFAUT;
    const zones = Array.isArray(currentTournament.qualification_zones)
        ? currentTournament.qualification_zones : [];

    // --- Groupes, si le format en a
    const groupeDe = {};
    let avecGroupes = false;
    equipes.forEach(function(e) {
        if (e.group_name) { groupeDe[e.id] = e.group_name; avecGroupes = true; }
    });

    const identifiants = equipes.map(function(e) { return e.id; });
    const parametres = {
        matchs: matchs || [],
        equipes: identifiants,
        bareme: bareme,
        departage: departage,
        zones: zones
    };

    let lignesAEcrire = [];
    let rendu = '';
    const nomDe = {};
    equipes.forEach(function(e) { nomDe[e.id] = e.name; });

    if (avecGroupes && currentTournament.format_type === 'groups_knockout') {
        const parGroupe = GTClassement.calculerParGroupe(Object.assign({}, parametres, { groupeDe: groupeDe }));
        Object.keys(parGroupe).forEach(function(nom) {
            // CHANTIER 11 — on enregistre AUSSI le nom du groupe,
            // sans quoi le visiteur ne peut pas reconstituer les
            // poules a la lecture.
            lignesAEcrire = lignesAEcrire.concat(GTClassement.pourLaBase(parGroupe[nom], currentTournamentId, nom));
            rendu += '<h4 class="classement-groupe">' + escapeHtml(nom) + '</h4>' +
                     tableauClassement(parGroupe[nom], nomDe);
        });

        const meilleursTroisiemes = currentTournament.best_third_place_count || 0;
        if (meilleursTroisiemes > 0) {
            const rangTroisieme = (currentTournament.qualifiers_per_group || 2) + 1;
            const troisiemes = GTClassement.classerLesTroisiemes(parGroupe, rangTroisieme, departage);
            rendu += '<h4 class="classement-groupe">Meilleurs ' + rangTroisieme + 'es — ' +
                     meilleursTroisiemes + ' repêché(s)</h4>' +
                     tableauClassement(troisiemes, nomDe, meilleursTroisiemes);
        }
    } else {
        const classement = GTClassement.calculer(parametres);
        lignesAEcrire = GTClassement.pourLaBase(classement, currentTournamentId);
        rendu = tableauClassement(classement, nomDe);
    }

    // --- Ecriture : on remplace les lignes du tournoi
    const maintenant = new Date().toISOString();
    lignesAEcrire.forEach(function(l) { l.updated_at = maintenant; });

    const { error: erreurSuppression } = await supabaseClient
        .from(TBL_STANDINGS).delete().eq('tournament_id', currentTournamentId);
    if (erreurSuppression) {
        hideLoader();
        showToast('Impossible de remettre le classement à zéro : ' + erreurSuppression.message, 'error');
        return;
    }

    let ecrites = 0;
    for (let i = 0; i < lignesAEcrire.length; i += 100) {
        const paquet = lignesAEcrire.slice(i, i + 100);
        const { error } = await supabaseClient.from(TBL_STANDINGS).insert(paquet);
        if (error) {
            hideLoader();
            showToast('Erreur à l\'écriture du classement : ' + error.message, 'error');
            return;
        }
        ecrites += paquet.length;
    }

    hideLoader();
    apercu.innerHTML = rendu;

    const joues = (matchs || []).filter(function(m) {
        return m.status === 'completed' && !m.is_bye && m.team_a_id && m.team_b_id;
    }).length;
    etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + ecrites + ' ligne(s) recalculées à partir de ' +
                     joues + ' rencontre(s) terminée(s), le ' +
                     new Date().toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) + '.';
    showToast('Classement recalculé.', 'success');
}

// ═══════════════════════════════════════════════════════════
// STATISTIQUES DU TOURNOI (chantier 05)
// -----------------------------------------------------------
// Le circuit complet, en un bouton :
//   1. relire les rencontres du tournoi
//   2. relire les evenements produits par les rapports
//   3. calculer une feuille par sportif et par match
//   4. la fusionner avec ce qui a ete saisi a la main
//   5. ecrire les feuilles, puis le cumul par sportif
//
// Comme pour le classement, rien ne se declenche tout seul :
// c'est l'organisateur qui decide du moment.
// ═══════════════════════════════════════════════════════════
let cumulsDuTournoi = [];     // les lignes agregees, gardees pour le tri
let nomsSportifsTournoi = {}; // uuid -> nom affiche

async function recalculerLesStatistiques() {
    const etat = document.getElementById('statsTournoiEtat');
    if (!currentTournamentId) {
        showToast('Aucun tournoi sélectionné.', 'warning');
        return;
    }

    showLoader();

    // --- 1. Les rencontres
    const { data: matchs, error: erreurMatchs } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, team_a_id, team_b_id, score_a, score_b, status, is_bye')
        .eq('tournament_id', currentTournamentId);

    if (erreurMatchs) {
        hideLoader();
        showToast('Impossible de lire les rencontres : ' + erreurMatchs.message, 'error');
        return;
    }

    const rencontres = (matchs || []).filter(function(m) { return !m.is_bye; });
    if (!rencontres.length) {
        hideLoader();
        showToast('Aucune rencontre dans ce tournoi : rien à calculer.', 'warning');
        return;
    }

    const idsMatchs = rencontres.map(function(m) { return m.id; });

    // --- 2. Les evenements de toutes ces rencontres
    const { data: evenements, error: erreurEv } = await supabaseClient
        .from(TBL_EVENTS)
        .select('id, match_id, event_type, minute, team_id, player_id, assist_player_id, detail')
        .in('match_id', idsMatchs);

    if (erreurEv) {
        hideLoader();
        showToast('Impossible de lire les événements : ' + erreurEv.message, 'error');
        return;
    }

    const evenementsParMatch = {};
    (evenements || []).forEach(function(e) {
        if (!evenementsParMatch[e.match_id]) evenementsParMatch[e.match_id] = [];
        evenementsParMatch[e.match_id].push(e);
    });

    // --- 3. Les effectifs, pour les postes et les numeros
    const equipes = await chargerEquipesDuTournoi();
    const idsEquipes = equipes.map(function(e) { return e.id; });
    let effectifs = [];
    if (idsEquipes.length) {
        // CHANTIER 12 — select('*') et non une liste de colonnes.
        // L'ancienne liste nommait player_name : une colonne
        // qu'aucune page n'ecrit plus depuis le retrait de
        // l'effectif en texte libre (voir section « Effectif
        // d'une equipe » plus bas). Si elle n'existe pas dans la
        // base, PostgREST refuse la requete entiere et les
        // effectifs reviennent vides — sans aucun message.
        const { data: membres, error: erreurMembres } = await supabaseClient
            .from(TBL_TEAM_PLAYERS)
            .select('*')
            .in('team_id', idsEquipes);
        if (erreurMembres) {
            console.warn('Effectifs indisponibles :', erreurMembres.message);
            showToast('Effectifs indisponibles : ' + erreurMembres.message +
                      '. Les postes et les numéros de maillot manqueront dans les feuilles. ' +
                      'Ouvre gt-diagnostic.html.', 'error');
        }
        effectifs = membres || [];
    }
    const compositionParEquipe = {};
    effectifs.forEach(function(m) {
        // La cle d'identite : le compte s'il existe, sinon la
        // fiche d'effectif. Avant, un membre sans compte etait
        // purement et simplement ignore (return), et ses buts
        // n'etaient attribues a personne.
        const cle = m.user_id || m.id;
        if (!cle) return;
        if (!compositionParEquipe[m.team_id]) compositionParEquipe[m.team_id] = [];
        compositionParEquipe[m.team_id].push({
            player_id: cle,
            team_id: m.team_id,
            is_starter: false,
            position: m.position || m.position_detail || null,
            jersey_number: m.jersey_number
        });
        const nom = m.member_name || null;
        nomsSportifsTournoi[cle] = nom
            ? ((m.jersey_number != null && m.jersey_number !== '' ? '#' + m.jersey_number + ' · ' : '') + nom)
            : ((m.jersey_number != null && m.jersey_number !== '' ? '#' + m.jersey_number + ' · ' : '') +
               'sans nom (' + String(cle).slice(-8) + ')');
    });

    // --- 4. Les feuilles deja enregistrees
    const { data: feuilles } = await supabaseClient
        .from(TBL_PLAYER_MATCH_STATS)
        .select('*')
        .in('match_id', idsMatchs);

    const feuilleParCle = {};
    (feuilles || []).forEach(function(f) {
        feuilleParCle[f.match_id + '::' + f.player_id] = f;
    });

    // --- 5. Le calcul, rencontre par rencontre
    let ecrites = 0, erreurs = 0, matchsTraites = 0;
    const toutesLesFeuilles = [];

    for (let i = 0; i < rencontres.length; i++) {
        const rencontre = rencontres[i];
        const evenementsDuMatch = evenementsParMatch[rencontre.id] || [];
        if (!evenementsDuMatch.length) continue;
        matchsTraites++;

        const compositions = []
            .concat(compositionParEquipe[rencontre.team_a_id] || [])
            .concat(compositionParEquipe[rencontre.team_b_id] || []);

        const calculees = GTStats.calculerDepuisEvenements({
            match: rencontre,
            evenements: evenementsDuMatch,
            compositions: compositions,
            duree: 90,
            tournament_id: currentTournamentId
        });

        const retenues = calculees.filter(function(l) {
            return l.minutes_played > 0 || l.goals || l.assists || l.yellow_cards || l.red_cards || l.own_goals;
        });

        for (let j = 0; j < retenues.length; j++) {
            const calculee = retenues[j];
            const cle = rencontre.id + '::' + calculee.player_id;
            const existante = feuilleParCle[cle] || null;
            const fusionnee = GTStats.fusionner(existante, calculee);
            const ligne = GTStats.pourLaBase(fusionnee, { source: 'rapport', updated_by: currentUser.id });

            ligne.match_id = rencontre.id;
            ligne.player_id = calculee.player_id;
            ligne.tournament_id = currentTournamentId;

            let erreur = null;
            if (existante && existante.id != null) {
                const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS).update(ligne).eq('id', existante.id);
                erreur = reponse.error;
            } else {
                const reponse = await supabaseClient.from(TBL_PLAYER_MATCH_STATS).insert([ligne]);
                erreur = reponse.error;
            }

            if (erreur) {
                console.warn('Feuille non écrite (match ' + rencontre.id + ') :', erreur.message);
                erreurs++;
            } else {
                ecrites++;
                toutesLesFeuilles.push(Object.assign({}, fusionnee, ligne));
            }
        }
    }

    if (!matchsTraites) {
        hideLoader();
        if (etat) {
            etat.innerHTML = '<i class="fas fa-circle-info"></i> Aucune rencontre n\'a d\'événements. ' +
                             'Les événements naissent des rapports de match : désignez des officiels dans l\'onglet ' +
                             '<strong>Officiels</strong>, puis attendez leurs rapports.';
        }
        showToast('Aucun événement à exploiter. Les statistiques viennent des rapports de match.', 'warning');
        return;
    }

    // --- 6. Le cumul par sportif
    const parSportif = {};
    toutesLesFeuilles.forEach(function(f) {
        if (!f.player_id) return;
        if (!parSportif[f.player_id]) parSportif[f.player_id] = [];
        parSportif[f.player_id].push(f);
    });

    const cumuls = Object.keys(parSportif).map(function(idSportif) {
        const lignes = parSportif[idSportif];
        return GTStats.agregerTournoi(lignes, {
            tournament_id: currentTournamentId,
            player_id: idSportif,
            team_id: lignes[0] ? lignes[0].team_id : null
        });
    });

    // On remplace les cumuls de CE tournoi uniquement.
    const { error: erreurMenage } = await supabaseClient
        .from(TBL_PLAYER_TOURNAMENT_STATS).delete().eq('tournament_id', currentTournamentId);
    if (erreurMenage) {
        hideLoader();
        showToast('Impossible de remettre les cumuls à zéro : ' + erreurMenage.message, 'error');
        return;
    }

    let cumulsEcrits = 0;
    for (let k = 0; k < cumuls.length; k += 100) {
        const paquet = cumuls.slice(k, k + 100);
        const { error } = await supabaseClient.from(TBL_PLAYER_TOURNAMENT_STATS).insert(paquet);
        if (error) {
            hideLoader();
            showToast('Erreur à l\'écriture des cumuls : ' + error.message, 'error');
            return;
        }
        cumulsEcrits += paquet.length;
    }

    // Les noms manquants
    await completerLesNomsDeSportifs(cumuls.map(function(c) { return c.player_id; }));

    cumulsDuTournoi = cumuls;
    hideLoader();
    rendreLesStatistiquesDuTournoi();

    if (etat) {
        etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + ecrites + ' feuille(s) de match et ' +
                         cumulsEcrits + ' cumul(s) de sportif écrits à partir de ' + matchsTraites +
                         ' rencontre(s) documentée(s), le ' +
                         new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.' +
                         (erreurs ? ' ' + erreurs + ' en échec — voir la console.' : '');
    }
    showToast('Statistiques recalculées. Les relevés saisis à la main ont été conservés.', 'success');
}

async function completerLesNomsDeSportifs(identifiants) {
    const manquants = (identifiants || []).filter(function(id) { return id && !nomsSportifsTournoi[id]; });
    if (!manquants.length) return;
    const { data: profils } = await supabaseClient
        .from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', manquants);
    (profils || []).forEach(function(p) {
        nomsSportifsTournoi[p.auth_uuid] = p.full_name || 'Sportif';
    });
}

// Lecture seule : ce que la base contient deja, sans recalculer.
async function chargerLesStatistiquesDuTournoi() {
    if (!currentTournamentId) return;
    const { data, error } = await supabaseClient
        .from(TBL_PLAYER_TOURNAMENT_STATS)
        .select('*')
        .eq('tournament_id', currentTournamentId);

    if (error) {
        console.warn('Cumuls indisponibles :', error.message);
        return;
    }
    cumulsDuTournoi = data || [];
    await completerLesNomsDeSportifs(cumulsDuTournoi.map(function(c) { return c.player_id; }));
    rendreLesStatistiquesDuTournoi();
}

function rendreLesStatistiquesDuTournoi() {
    const conteneur = document.getElementById('statsTournoiApercu');
    if (!conteneur) return;

    if (!cumulsDuTournoi.length) {
        conteneur.innerHTML = '<div class="gt-stats-vide">' +
            '<strong>Aucun cumul enregistré.</strong><br>' +
            'Lancez le recalcul une fois que des rapports de match auront été déposés : ' +
            'ce sont eux qui produisent les buts, passes décisives et cartons.</div>';
        return;
    }

    const tri = (document.getElementById('statsTriSelect') || {}).value || 'goals';
    const classes = GTStats.classer(cumulsDuTournoi, tri);

    const nomEquipe = {};
    allTeams.forEach(function(e) { nomEquipe[e.id] = e.name; });

    let html = '<div class="gt-stats-table-wrap"><table class="gt-stats-table"><thead><tr>' +
               '<th class="num">#</th><th>Sportif</th><th>Équipe</th>' +
               '<th class="num">M</th><th class="num">Min</th><th class="num">Buts</th>' +
               '<th class="num">P. déc.</th><th class="num">Note</th>' +
               '<th class="num">🟨</th><th class="num">🟥</th>' +
               '</tr></thead><tbody>';

    classes.forEach(function(l) {
        html += '<tr>' +
            '<td class="num">' + l.rang + '</td>' +
            '<td><div class="sportif"><span class="nom"><a href="player-stats.html?id=' + encodeURIComponent(l.player_id) + '">' +
                escapeHtml(nomsSportifsTournoi[l.player_id] || 'Sportif') + '</a></span></div></td>' +
            '<td>' + escapeHtml(nomEquipe[l.team_id] || '—') + '</td>' +
            '<td class="num">' + (l.matches_played || 0) + '</td>' +
            '<td class="num">' + (l.minutes_played || 0) + "'" + '</td>' +
            '<td class="num">' + (l.goals || 0) + '</td>' +
            '<td class="num">' + (l.assists || 0) + '</td>' +
            '<td class="num"><span class="gt-note gt-note-sm ' + GTStats.classeNote(l.average_rating) + '">' +
                (l.average_rating == null ? '—' : Number(l.average_rating).toFixed(1)) + '</span></td>' +
            '<td class="num">' + (l.yellow_cards || 0) + '</td>' +
            '<td class="num">' + (l.red_cards || 0) + '</td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    conteneur.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// PAIEMENTS (chantier 07)
// -----------------------------------------------------------
// Ton circuit du point 16 vu du cote organisateur :
//   il pose ses moyens et ses coordonnees
//   -> le participant paie et televerse sa preuve
//   -> l'organisateur valide ou refuse avec motif
//   -> a la validation : commission calculee, net credite au
//      wallet, ligne ecrite dans hubis_transactions
//
// Le taux ne se saisit JAMAIS ici. Il vient de
// gt_organizer_agreements, et chaque demande fige le taux
// applique au moment de sa validation : si l'accord change plus
// tard, l'historique reste juste.
// ═══════════════════════════════════════════════════════════
let cataloguePaiement = [];    // ce que l'administration autorise
let moyensDuTournoi = [];      // ce que cet organisateur a active
let demandesDePaiement = [];
let accordApplique = null;

async function monterLOngletPaiements() {
    if (!currentTournamentId) return;

    remplirLesDevises();
    remplirLesReglages();

    await chargerLeCatalogue();
    await chargerLAccord();
    await chargerLesMoyensDuTournoi();
    await chargerLesDemandes();
}

function remplirLesDevises() {
    const select = document.getElementById('payDevise');
    if (!select || select.options.length) return;
    select.innerHTML = Object.keys(GTPaiement.DEVISES).map(function(code) {
        return '<option value="' + code + '">' + code + ' — ' + GTPaiement.DEVISES[code].nom + '</option>';
    }).join('');
}

function remplirLesReglages() {
    if (!currentTournament) return;
    const prix = document.getElementById('payPrix');
    const devise = document.getElementById('payDevise');
    const echeance = document.getElementById('payEcheance');
    const consignes = document.getElementById('payConsignes');
    if (prix) prix.value = currentTournament.participation_price != null ? currentTournament.participation_price : '';
    if (devise) devise.value = currentTournament.currency || 'XOF';
    if (echeance && currentTournament.payment_deadline) echeance.value = String(currentTournament.payment_deadline).slice(0, 10);
    if (consignes) consignes.value = currentTournament.payment_instructions || '';
}

async function enregistrerLesReglagesDePaiement() {
    const prix = document.getElementById('payPrix').value;
    const devise = document.getElementById('payDevise').value;
    const echeance = document.getElementById('payEcheance').value;
    const consignes = document.getElementById('payConsignes').value.trim();

    showLoader();
    const { error } = await supabaseClient.from(TBL_TOURNAMENTS).update({
        participation_price: prix === '' ? null : Number(prix),
        currency: devise || 'XOF',
        payment_deadline: echeance || null,
        payment_instructions: consignes || null
    }).eq('id', currentTournamentId);
    hideLoader();

    const etat = document.getElementById('payReglagesEtat');
    if (error) {
        showToast('Réglages non enregistrés : ' + error.message, 'error');
        return;
    }
    if (currentTournament) {
        currentTournament.participation_price = prix === '' ? null : Number(prix);
        currentTournament.currency = devise || 'XOF';
        currentTournament.payment_deadline = echeance || null;
        currentTournament.payment_instructions = consignes || null;
    }
    if (etat) {
        etat.innerHTML = '<i class="fas fa-circle-check"></i> Participation fixée à ' +
            GTPaiement.formaterMontant(prix || 0, devise) +
            (echeance ? ', à régler avant le ' + new Date(echeance).toLocaleDateString('fr-FR') : '') + '.';
    }
    showToast('Réglages de paiement enregistrés.', 'success');
    await chargerLesDemandes();
}

// --- Le catalogue global : ce que l'administration autorise ---
async function chargerLeCatalogue() {
    const { data, error } = await supabaseClient
        .from(TBL_CATALOGUE_MOYENS)
        .select('id, method_key, display_name, instructions, redirect_url, is_active, channel')
        .eq('is_active', true);

    if (error) {
        // Le catalogue peut être vide au premier démarrage : ce
        // n'est pas une panne. On retombe alors sur la liste que
        // le moteur décrit, pour que l'organisateur puisse
        // travailler tout de suite.
        console.warn('Catalogue des moyens indisponible :', error.message);
        cataloguePaiement = [];
        return;
    }
    cataloguePaiement = data || [];
}

// Les moyens réellement proposables : ceux du catalogue global
// s'il est renseigné, sinon tous ceux que le moteur décrit.
function moyensProposables() {
    if (!cataloguePaiement.length) return GTPaiement.MOYENS.slice();
    const autorises = {};
    cataloguePaiement.forEach(function(c) { autorises[c.method_key] = c; });
    return GTPaiement.MOYENS.filter(function(m) { return !!autorises[m.cle]; });
}

// --- L'accord : d'où vient le taux ---
async function chargerLAccord() {
    const zone = document.getElementById('payAccord');
    if (!zone) return;

    const { data, error } = await supabaseClient
        .from(TBL_ACCORDS)
        .select('*')
        .or('tournament_id.eq.' + currentTournamentId +
            ',organizer_id.eq.' + (currentTournament ? currentTournament.created_by : currentUser.id));

    if (error) {
        console.warn('Accords indisponibles :', error.message);
    }

    accordApplique = GTPaiement.accordApplicable(
        data || [], currentTournamentId,
        currentTournament ? currentTournament.created_by : currentUser.id);

    if (!accordApplique) {
        zone.innerHTML = '<div class="gtp-vide">' +
            '<strong>Aucun accord enregistré pour ce tournoi.</strong><br>' +
            'Tant qu\'il n\'y en a pas, aucune commission n\'est prélevée : la totalité de ce que vous encaissez ' +
            'vous revient. L\'accord se signe et s\'enregistre côté administration — c\'est là, et nulle part ailleurs, ' +
            'que le taux se décide.</div>';
        return;
    }

    const exemple = GTPaiement.calculerPartage(
        currentTournament && currentTournament.participation_price ? currentTournament.participation_price : 10000,
        accordApplique);
    const devise = currentTournament ? currentTournament.currency : 'XOF';

    zone.innerHTML =
        '<p class="section-hint">Voici ce qui s\'applique, et ce que cela donne sur une participation.</p>' +
        '<div class="gtp-partage">' +
        exemple.detail.map(function(l, i) {
            const dernier = i === exemple.detail.length - 1;
            return '<div class="gtp-partage-ligne' + (l.valeur < 0 ? ' retrait' : '') + (dernier ? ' total' : '') + '">' +
                   '<span class="cle">' + escapeHtml(l.libelle) + '</span>' +
                   '<span class="valeur">' + GTPaiement.formaterMontant(Math.abs(l.valeur), devise) + '</span></div>';
        }).join('') +
        '</div>' +
        (exemple.alerte ? '<div class="gtp-alerte"><i class="fas fa-triangle-exclamation"></i>' +
                          escapeHtml(exemple.alerte) + '</div>' : '') +
        '<p class="gtp-champ-aide" style="margin-top:10px;">' +
        (accordApplique.agreement_type === 'hubisoccer'
            ? 'Ce tournoi est organisé par HubISoccer : la totalité lui revient.'
            : 'Accord ' + escapeHtml(accordApplique.reference || 'externe') +
              ' · commission ' + (accordApplique.commission_rate || 0) + ' %' +
              (accordApplique.organizer_fee ? ' · frais d\'organisation ' +
                GTPaiement.formaterMontant(accordApplique.organizer_fee, devise) + ' par transaction' : '')) +
        '</p>';
}

// --- La configuration des moyens ---
async function chargerLesMoyensDuTournoi() {
    const { data, error } = await supabaseClient
        .from(TBL_MOYENS_TOURNOI)
        .select('*')
        .eq('tournament_id', currentTournamentId);

    if (error) {
        document.getElementById('payMoyensListe').innerHTML =
            '<div class="gtp-vide">Moyens indisponibles : ' + escapeHtml(error.message) + '</div>';
        return;
    }
    moyensDuTournoi = data || [];
    rendreLesMoyens();
}

function rendreLesMoyens() {
    const conteneur = document.getElementById('payMoyensListe');
    const etat = document.getElementById('payMoyensEtat');
    if (!conteneur) return;

    const proposables = moyensProposables();
    const parCle = {};
    moyensDuTournoi.forEach(function(c) { parCle[c.method_key] = c; });

    let actifs = 0;
    let html = '';
    ['interne', 'externe'].forEach(function(canal) {
        const liste = proposables.filter(function(m) { return m.canal === canal; });
        if (!liste.length) return;
        html += '<p class="gtp-groupe-titre">' +
                (canal === 'interne' ? 'Depuis HubISoccer' : 'Par un service extérieur') + '</p>';

        liste.forEach(function(moyen) {
            const config = parCle[moyen.cle] || {};
            const actif = !!config.is_active;
            if (actif) actifs++;

            html += '<div class="gtp-config-moyen" data-moyen="' + moyen.cle + '">' +
                '<div class="gtp-config-tete" data-bascule="' + moyen.cle + '">' +
                    '<span class="gtp-moyen-icone"><i class="fas ' + moyen.icone + '"></i></span>' +
                    '<span class="gtp-config-nom">' + escapeHtml(moyen.nom) + '</span>' +
                    '<span class="gtp-config-etat ' + (actif ? 'actif' : 'inactif') + '">' +
                        (actif ? 'Activé' : 'Désactivé') + '</span>' +
                    '<label class="gtp-bascule"><input type="checkbox" data-actif="' + moyen.cle + '"' +
                        (actif ? ' checked' : '') + '><span class="curseur"></span></label>' +
                '</div>' +
                '<div class="gtp-config-corps" id="corps_' + moyen.cle + '"' + (actif ? '' : ' hidden') + '>' +
                    '<p class="gtp-champ-aide" style="margin-bottom:12px;">' + escapeHtml(moyen.description) + '</p>' +
                    ((moyen.champs || []).length
                        ? '<div class="gtp-champs">' + moyen.champs.map(function(champ) {
                              return champConfigHtml(moyen.cle, champ, config[champ.cle]);
                          }).join('') + '</div>' +
                          '<button class="btn-primary btn-enregistrer-moyen" data-moyen="' + moyen.cle + '" style="margin-top:14px;">' +
                          '<i class="fas fa-save"></i> Enregistrer ce moyen</button>'
                        : '<p class="gtp-champ-aide">Aucune coordonnée à renseigner : ce moyen circule à l\'intérieur de HubISoccer.</p>' +
                          '<button class="btn-primary btn-enregistrer-moyen" data-moyen="' + moyen.cle + '" style="margin-top:14px;">' +
                          '<i class="fas fa-save"></i> Enregistrer</button>') +
                    '<div class="gtp-erreurs" id="erreurs_' + moyen.cle + '"></div>' +
                '</div>' +
                '</div>';
        });
    });

    conteneur.innerHTML = html;

    if (etat) {
        etat.innerHTML = actifs
            ? '<i class="fas fa-circle-check"></i> ' + actifs + ' moyen(s) ouvert(s) aux participants.'
            : '<i class="fas fa-circle-info"></i> Aucun moyen activé : la page de paiement le dira aux participants ' +
              'plutôt que de les laisser devant une liste vide.';
    }

    conteneur.querySelectorAll('[data-actif]').forEach(function(bascule) {
        bascule.addEventListener('change', function(e) {
            e.stopPropagation();
            basculerLeMoyen(bascule.dataset.actif, bascule.checked);
        });
    });
    conteneur.querySelectorAll('[data-bascule]').forEach(function(tete) {
        tete.addEventListener('click', function(e) {
            if (e.target.closest('.gtp-bascule')) return;
            const corps = document.getElementById('corps_' + tete.dataset.bascule);
            if (corps) corps.hidden = !corps.hidden;
        });
    });
    conteneur.querySelectorAll('.btn-enregistrer-moyen').forEach(function(bouton) {
        bouton.addEventListener('click', function() { enregistrerLeMoyen(bouton.dataset.moyen); });
    });
}

function champConfigHtml(cleMoyen, champ, valeur) {
    const id = 'cfg_' + cleMoyen + '_' + champ.cle;
    const obligatoire = champ.obligatoire ? ' <span class="obligatoire">*</span>' : '';
    const v = valeur == null ? '' : String(valeur);
    const saisie = champ.type === 'longtexte'
        ? '<textarea id="' + id + '" data-cle="' + champ.cle + '">' + escapeHtml(v) + '</textarea>'
        : '<input type="' + (champ.type === 'telephone' ? 'tel' : champ.type === 'lien' ? 'url' : 'text') +
          '" id="' + id + '" data-cle="' + champ.cle + '" value="' + escapeHtml(v) + '">';
    return '<div class="gtp-champ' + (champ.type === 'longtexte' ? ' pleine-largeur' : '') + '">' +
           '<label for="' + id + '">' + escapeHtml(champ.label) + obligatoire + '</label>' + saisie + '</div>';
}

async function basculerLeMoyen(cleMoyen, actif) {
    const corps = document.getElementById('corps_' + cleMoyen);
    if (corps) corps.hidden = !actif;
    if (actif) return;   // on n'ecrit qu'a l'enregistrement, ou a la desactivation

    const existant = moyensDuTournoi.filter(function(c) { return c.method_key === cleMoyen; })[0];
    if (!existant) return;

    showLoader();
    const { error } = await supabaseClient.from(TBL_MOYENS_TOURNOI)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', existant.id);
    hideLoader();
    if (error) { showToast('Désactivation impossible : ' + error.message, 'error'); return; }
    existant.is_active = false;
    rendreLesMoyens();
    showToast('Moyen désactivé — il disparaît de la page de paiement.', 'info');
}

async function enregistrerLeMoyen(cleMoyen) {
    const moyen = GTPaiement.moyenParCle(cleMoyen);
    if (!moyen) return;

    const valeurs = {};
    document.querySelectorAll('#corps_' + cleMoyen + ' [data-cle]').forEach(function(champ) {
        valeurs[champ.dataset.cle] = champ.value.trim();
    });

    const erreurs = GTPaiement.verifierConfiguration(cleMoyen, valeurs);
    const zone = document.getElementById('erreurs_' + cleMoyen);
    if (erreurs.length) {
        zone.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> ' +
            'Ce moyen ne peut pas être ouvert en l\'état</strong><ul>' +
            erreurs.map(function(e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ul>';
        return;
    }
    zone.innerHTML = '';

    const catalogue = cataloguePaiement.filter(function(c) { return c.method_key === cleMoyen; })[0];
    const ligne = Object.assign({
        tournament_id: currentTournamentId,
        method_key: cleMoyen,
        method_id: catalogue ? catalogue.id : null,
        channel: moyen.canal,
        is_active: true,
        requires_proof: moyen.preuveRequise,
        created_by: currentUser.id,
        updated_at: new Date().toISOString()
    }, valeurs);

    const existant = moyensDuTournoi.filter(function(c) { return c.method_key === cleMoyen; })[0];

    showLoader();
    let erreur = null;
    if (existant && existant.id != null) {
        const r = await supabaseClient.from(TBL_MOYENS_TOURNOI).update(ligne).eq('id', existant.id);
        erreur = r.error;
    } else {
        const r = await supabaseClient.from(TBL_MOYENS_TOURNOI).insert([ligne]);
        erreur = r.error;
    }
    hideLoader();

    if (erreur) { showToast('Enregistrement impossible : ' + erreur.message, 'error'); return; }
    await chargerLesMoyensDuTournoi();
    showToast(moyen.nom + ' est ouvert aux participants.', 'success');
}

// --- Les demandes reçues ---
async function chargerLesDemandes() {
    const { data, error } = await supabaseClient
        .from(TBL_PAIEMENTS)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });

    if (error) {
        document.getElementById('payDemandes').innerHTML =
            '<div class="gtp-vide">Demandes indisponibles : ' + escapeHtml(error.message) + '</div>';
        return;
    }
    demandesDePaiement = data || [];

    // Le nom des payeurs, en une requête
    const ids = [];
    demandesDePaiement.forEach(function(d) {
        if (d.user_id && ids.indexOf(d.user_id) === -1) ids.push(d.user_id);
    });
    if (ids.length) {
        const { data: profils } = await supabaseClient
            .from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', ids);
        const noms = {};
        (profils || []).forEach(function(p) { noms[p.auth_uuid] = p.full_name; });
        demandesDePaiement.forEach(function(d) { d._nomPayeur = noms[d.user_id] || 'Participant'; });
    }

    rendreLesDemandes();
}

function rendreLesDemandes() {
    const conteneur = document.getElementById('payDemandes');
    const recap = document.getElementById('payRecap');
    if (!conteneur) return;

    const devise = currentTournament ? currentTournament.currency : 'XOF';
    const total = GTPaiement.recapituler(demandesDePaiement, accordApplique);

    if (recap) {
        recap.innerHTML = [
            { icone: 'fa-inbox', valeur: total.enAttente + total.avecPreuve, libelle: 'À traiter' },
            { icone: 'fa-circle-check', valeur: total.validees, libelle: 'Validées' },
            { icone: 'fa-coins', valeur: GTPaiement.formaterMontant(total.montantValide, devise), libelle: 'Encaissé' },
            { icone: 'fa-percent', valeur: GTPaiement.formaterMontant(total.commission, devise), libelle: 'Commission' },
            { icone: 'fa-wallet', valeur: GTPaiement.formaterMontant(total.net, devise), libelle: 'Net pour vous' }
        ].map(function(c) {
            return '<div class="gtp-carte"><i class="fas ' + c.icone + '"></i>' +
                   '<div class="valeur">' + escapeHtml(c.valeur) + '</div>' +
                   '<div class="libelle">' + escapeHtml(c.libelle) + '</div></div>';
        }).join('');
    }

    const filtre = (document.getElementById('payFiltre') || {}).value || 'attente';
    let liste = demandesDePaiement;
    if (filtre === 'attente') {
        liste = liste.filter(function(d) { return d.status === 'pending' || d.status === 'proof'; });
    } else if (filtre !== 'all') {
        liste = liste.filter(function(d) { return d.status === filtre; });
    }

    if (!liste.length) {
        conteneur.innerHTML = '<div class="gtp-vide">' +
            (demandesDePaiement.length
                ? 'Aucune demande dans ce filtre.'
                : '<strong>Aucune demande de paiement.</strong><br>Elles arriveront ici dès qu\'un participant ' +
                  'aura réglé sa participation par l\'un des moyens que vous avez ouverts.') + '</div>';
        return;
    }

    conteneur.innerHTML = '<div class="gtp-demandes">' + liste.map(function(d) {
        const moyen = GTPaiement.moyenParCle(d.payment_method);
        const etat = GTPaiement.etat(d.status);
        const actions = GTPaiement.transitionsPossibles(d.status, true);
        const date = d.created_at ? new Date(d.created_at).toLocaleString('fr-FR',
            { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

        return '<div class="gtp-demande">' +
            '<div class="gtp-demande-tete">' +
                '<div><div class="gtp-demande-payeur">' + escapeHtml(d._nomPayeur || 'Participant') + '</div>' +
                '<div class="gtp-demande-meta">' +
                    '<span><i class="fas ' + (moyen ? moyen.icone : 'fa-money-bill') + '"></i> ' +
                        escapeHtml(moyen ? moyen.nom : d.payment_method || '—') + '</span>' +
                    '<span><i class="fas fa-clock"></i> ' + escapeHtml(date) + '</span>' +
                    (d.payer_reference ? '<span><i class="fas fa-hashtag"></i> ' + escapeHtml(d.payer_reference) + '</span>' : '') +
                    (d.payer_phone ? '<span><i class="fas fa-phone"></i> ' + escapeHtml(d.payer_phone) + '</span>' : '') +
                    (d.card_last4 ? '<span><i class="fas fa-credit-card"></i> •••• ' + escapeHtml(d.card_last4) + '</span>' : '') +
                    (d.proof_url ? '<a class="gtp-lien-preuve" href="' + escapeHtml(d.proof_url) +
                                   '" target="_blank" rel="noopener noreferrer"><i class="fas fa-paperclip"></i> Voir la preuve</a>' : '') +
                '</div></div>' +
                '<div style="text-align:right;">' +
                    '<div class="gtp-demande-montant">' + GTPaiement.formaterMontant(d.amount, d.currency || devise) + '</div>' +
                    '<div style="margin-top:6px;"><span class="gtp-etat ' + etat.classe + '">' +
                        '<i class="fas ' + etat.icone + '"></i> ' + escapeHtml(etat.libelle) + '</span></div>' +
                '</div>' +
            '</div>' +
            (d.status === 'validated' && d.net_amount != null
                ? '<div class="gtp-demande-meta" style="margin-top:10px;">' +
                  '<span><i class="fas fa-percent"></i> Commission ' +
                    GTPaiement.formaterMontant(d.commission_amount || 0, d.currency || devise) +
                    (d.commission_rate != null ? ' (' + d.commission_rate + ' %)' : '') + '</span>' +
                  '<span><i class="fas fa-wallet"></i> Net ' +
                    GTPaiement.formaterMontant(d.net_amount, d.currency || devise) + '</span>' +
                  (d.settled ? '<span><i class="fas fa-circle-check"></i> Versé</span>'
                             : '<span><i class="fas fa-hourglass-half"></i> Pas encore versé</span>') +
                  '</div>'
                : '') +
            (d.review_comment
                ? '<div class="gtp-demande-motif"><i class="fas fa-comment-dots"></i> ' +
                  escapeHtml(d.review_comment) + '</div>'
                : '') +
            '<div class="gtp-demande-actions">' +
                (actions.indexOf('validated') !== -1
                    ? '<button class="btn-primary btn-valider-paiement" data-demande="' + escapeHtml(d.id) +
                      '"><i class="fas fa-check"></i> Valider</button>' : '') +
                (actions.indexOf('rejected') !== -1
                    ? '<button class="btn-secondary btn-refuser-paiement" data-demande="' + escapeHtml(d.id) +
                      '"><i class="fas fa-xmark"></i> Refuser</button>' : '') +
            '</div>' +
            '</div>';
    }).join('') + '</div>';

    conteneur.querySelectorAll('.btn-valider-paiement').forEach(function(b) {
        b.addEventListener('click', function() { validerLePaiement(b.dataset.demande); });
    });
    conteneur.querySelectorAll('.btn-refuser-paiement').forEach(function(b) {
        b.addEventListener('click', function() { refuserLePaiement(b.dataset.demande); });
    });
}

// --- La validation : c'est ici que l'argent se partage ---
async function validerLePaiement(id) {
    const demande = demandesDePaiement.filter(function(d) { return String(d.id) === String(id); })[0];
    if (!demande) return;

    const devise = demande.currency || (currentTournament ? currentTournament.currency : 'XOF');
    const partage = GTPaiement.calculerPartage(demande.amount, accordApplique);

    const resume = 'Valider ce paiement de ' + GTPaiement.formaterMontant(partage.brut, devise) + ' ?\n\n' +
        partage.detail.map(function(l) {
            return '  ' + l.libelle + ' : ' + GTPaiement.formaterMontant(Math.abs(l.valeur), devise);
        }).join('\n') +
        (partage.alerte ? '\n\n' + partage.alerte : '');
    if (!confirm(resume)) return;

    showLoader();

    // Le taux est fige sur la ligne : si l'accord change dans six
    // mois, on saura toujours ce qui a ete preleve ici.
    const maintenant = new Date().toISOString();
    const reference = GTPaiement.reference('GT', currentTournamentId);

    const { error } = await supabaseClient.from(TBL_PAIEMENTS).update({
        status: 'validated',
        reviewed_by: currentUser.id,
        reviewed_at: maintenant,
        commission_rate: partage.taux,
        commission_amount: partage.commission,
        organizer_fee: partage.frais,
        net_amount: partage.net,
        agreement_id: accordApplique ? accordApplique.id : null,
        wallet_transaction_ref: reference,
        updated_at: maintenant
    }).eq('id', id);

    if (error) {
        hideLoader();
        showToast('Validation impossible : ' + error.message, 'error');
        return;
    }

    // Le net rejoint le portefeuille de l'organisateur, et la
    // ligne est ecrite dans le journal que « Mes revenus » lit
    // deja. Si le portefeuille n'existe pas encore, on le dit
    // sans faire echouer la validation : le paiement est valide,
    // c'est le versement qui attend.
    const versement = await crediterLOrganisateur(partage.net, devise, reference, demande);

    hideLoader();
    await chargerLesDemandes();

    showToast('Paiement validé. ' +
        (versement.ok
            ? GTPaiement.formaterMontant(partage.net, devise) + ' crédités sur votre compte HubIS.'
            : 'Le versement reste à faire : ' + versement.raison), versement.ok ? 'success' : 'warning');
}

async function crediterLOrganisateur(net, devise, reference, demande) {
    if (!(net > 0)) return { ok: false, raison: 'le net est nul.' };

    const idOrganisateur = currentTournament && currentTournament.created_by
        ? currentTournament.created_by : currentUser.id;

    const { data: portefeuille } = await supabaseClient
        .from(TBL_WALLETS)
        .select('id, balance, wallet_ref')
        .eq('auth_uuid', idOrganisateur)
        .maybeSingle();

    if (!portefeuille) {
        return { ok: false, raison: 'aucun compte HubIS n\'est ouvert pour l\'organisateur. ' +
                                     'Ouvrez-le depuis « Mes revenus », puis reprenez ce versement.' };
    }

    const { error: erreurTransaction } = await supabaseClient.from(TBL_TRANSACTIONS).insert([{
        wallet_id: portefeuille.id,
        type: 'tournament_payment',
        amount: net,
        description: 'Participation — ' + (currentTournament ? currentTournament.name : 'Tournoi') +
                     ' · ' + (demande._nomPayeur || 'participant'),
        reference: reference,
        status: 'completed',
        created_at: new Date().toISOString()
    }]);

    if (erreurTransaction) {
        return { ok: false, raison: 'écriture au journal refusée (' + erreurTransaction.message + ').' };
    }

    const { error: erreurSolde } = await supabaseClient.from(TBL_WALLETS)
        .update({ balance: Number(portefeuille.balance || 0) + Number(net) })
        .eq('id', portefeuille.id);

    if (erreurSolde) {
        return { ok: false, raison: 'solde non mis à jour (' + erreurSolde.message + ').' };
    }

    await supabaseClient.from(TBL_PAIEMENTS)
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq('wallet_transaction_ref', reference);

    return { ok: true, raison: null };
}

async function refuserLePaiement(id) {
    const motif = prompt('Pourquoi refusez-vous cette demande ?\n\nLe participant verra ce motif — soyez précis, ' +
                         'il doit savoir quoi corriger.');
    if (motif === null) return;
    if (!motif.trim()) {
        showToast('Un refus sans motif laisse le participant sans rien à corriger. Indiquez la raison.', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient.from(TBL_PAIEMENTS).update({
        status: 'rejected',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        review_comment: motif.trim(),
        updated_at: new Date().toISOString()
    }).eq('id', id);
    hideLoader();

    if (error) { showToast('Refus impossible : ' + error.message, 'error'); return; }
    await chargerLesDemandes();
    showToast('Demande refusée. Le participant voit votre motif.', 'info');
}

// Rendu du tableau, avec la bande de couleur des zones.
function tableauClassement(lignes, nomDe, ligneQualification) {
    if (!lignes.length) return '<p class="empty-hint">Aucune équipe à classer.</p>';

    const couleurs = { vert:'#27ae60', bleu:'#3498db', turquoise:'#16a085',
                       or:'#C99A00', violet:'#551B8C', rouge:'#e74c3c' };

    let html = '<div class="classement-table-wrap"><table class="classement-table">' +
        '<thead><tr><th></th><th>#</th><th class="col-equipe">Équipe</th>' +
        '<th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>DIFF</th><th class="col-pts">Pts</th>' +
        '<th class="col-forme">Forme</th></tr></thead><tbody>';

    lignes.forEach(function(l, index) {
        const diff = l.goals_for - l.goals_against;
        const couleur = l.zone ? (couleurs[l.zone.couleur] || 'transparent') : 'transparent';
        const qualifie = ligneQualification && (index + 1) <= ligneQualification;

        html += '<tr' + (qualifie ? ' class="classement-qualifie"' : '') + '>' +
            '<td class="col-zone"><span style="background:' + couleur + '"></span></td>' +
            '<td class="tabular">' + (l.rang || index + 1) + '</td>' +
            '<td class="col-equipe">' + escapeHtml(nomDe[l.team_id] || 'Équipe ' + l.team_id) +
                (l.__egaliteNonTranchee ? ' <span class="classement-egalite" title="Égalité non tranchée par les critères choisis">=</span>' : '') +
            '</td>' +
            '<td class="tabular">' + l.played + '</td>' +
            '<td class="tabular">' + l.wins + '</td>' +
            '<td class="tabular">' + l.draws + '</td>' +
            '<td class="tabular">' + l.losses + '</td>' +
            '<td class="tabular">' + l.goals_for + '</td>' +
            '<td class="tabular">' + l.goals_against + '</td>' +
            '<td class="tabular">' + (diff > 0 ? '+' : '') + diff + '</td>' +
            '<td class="tabular col-pts">' + l.points + '</td>' +
            '<td class="col-forme">' + (l.recent_form || []).map(function(r) {
                return '<span class="forme-' + r + '">' + r + '</span>';
            }).join('') + '</td>' +
            '</tr>';
    });

    return html + '</tbody></table></div>';
}

// ═══════════════════════════════════════════════════════════
// DESIGNATION DES OFFICIELS (chantier 04)
// ------------------------------------------------------------
// Le verrou d'un rapport de match n'est pas le code de role du
// compte : c'est la designation faite ici. Un parrain peut etre
// designe commissaire de match, un sportif delegue.
// ═══════════════════════════════════════════════════════════

let officielSelectionne = null;   // { user_id, full_name }

function remplirPostesOfficiels() {
    const select = document.getElementById('offRole');
    if (!select) return;
    select.innerHTML = '<option value="">— Choisissez un poste —</option>' +
        GTOfficiels.FAMILLES.map(function(famille) {
            const acteurs = GTOfficiels.acteursParFamille(famille.code);
            if (!acteurs.length) return '';
            return '<optgroup label="' + escapeHtml(famille.nom) + '">' +
                   acteurs.map(function(a) {
                       return '<option value="' + a.code + '">' + escapeHtml(a.nom) + '</option>';
                   }).join('') + '</optgroup>';
        }).join('');

    select.addEventListener('change', function() {
        const acteur = GTOfficiels.acteurParCode(this.value);
        const champ = document.getElementById('offEquipeChamp');
        if (champ) champ.style.display = (acteur && acteur.parEquipe) ? 'flex' : 'none';
    });
}

async function remplirPorteesOfficiels() {
    const selectMatch = document.getElementById('offMatch');
    const selectEquipe = document.getElementById('offEquipe');

    if (selectMatch) {
        const { data: matchs } = await supabaseClient
            .from(TBL_MATCHES)
            .select('id, round, team_a_id, team_b_id, match_date')
            .eq('tournament_id', currentTournamentId)
            .order('match_date', { ascending: true });

        const equipes = await chargerEquipesDuTournoi();
        const nomDe = {};
        equipes.forEach(function(e) { nomDe[e.id] = e.name; });

        selectMatch.innerHTML = '<option value="">Tout le tournoi</option>' +
            (matchs || []).map(function(m) {
                const date = m.match_date
                    ? new Date(m.match_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
                const affiche = (nomDe[m.team_a_id] || '?') + ' – ' + (nomDe[m.team_b_id] || '?');
                return '<option value="' + m.id + '">' + escapeHtml((m.round ? m.round + ' · ' : '') + affiche + (date ? ' (' + date + ')' : '')) + '</option>';
            }).join('');

        if (selectEquipe) {
            selectEquipe.innerHTML = '<option value="">— Toutes —</option>' +
                equipes.map(function(e) { return '<option value="' + e.id + '">' + escapeHtml(e.name) + '</option>'; }).join('');
        }
    }
}

async function rechercherComptes(terme) {
    const zone = document.getElementById('offResultats');
    if (!zone) return;
    if (!terme || terme.length < 2) { zone.innerHTML = ''; return; }

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url, role_code, hubisoccer_id')
        .ilike('full_name', '%' + terme + '%')
        .limit(8);

    if (error) { zone.innerHTML = '<p class="off-vide">Recherche indisponible.</p>'; return; }
    if (!data || !data.length) { zone.innerHTML = '<p class="off-vide">Aucun compte trouvé.</p>'; return; }

    zone.innerHTML = data.map(function(p) {
        return '<button type="button" class="off-resultat" data-uuid="' + escapeHtml(p.auth_uuid) +
               '" data-nom="' + escapeHtml(p.full_name || 'Sans nom') + '">' +
               '<span class="off-resultat-nom">' + escapeHtml(p.full_name || 'Sans nom') + '</span>' +
               '<span class="off-resultat-role">' + escapeHtml(p.role_code || '—') + '</span>' +
               '</button>';
    }).join('');

    zone.querySelectorAll('.off-resultat').forEach(function(bouton) {
        bouton.addEventListener('click', function() {
            officielSelectionne = { user_id: this.dataset.uuid, full_name: this.dataset.nom };
            document.getElementById('offRecherche').value = this.dataset.nom;
            zone.innerHTML = '';
            document.getElementById('offSelection').innerHTML =
                '<i class="fas fa-user-check"></i> Compte retenu : <strong>' + escapeHtml(this.dataset.nom) + '</strong>';
        });
    });
}

async function designerOfficiel() {
    const roleCode = document.getElementById('offRole').value;
    if (!roleCode) { showToast('Choisissez un poste.', 'warning'); return; }
    if (!officielSelectionne) { showToast('Choisissez le compte à désigner.', 'warning'); return; }

    const acteur = GTOfficiels.acteurParCode(roleCode);
    const idMatch = document.getElementById('offMatch').value || null;
    const idEquipe = (acteur && acteur.parEquipe) ? (document.getElementById('offEquipe').value || null) : null;

    showLoader();
    const { error } = await supabaseClient.from(TBL_OFFICIELS).insert([{
        tournament_id: currentTournamentId,
        match_id: idMatch ? Number(idMatch) : null,
        user_id: officielSelectionne.user_id,
        role_code: roleCode,
        team_id: idEquipe ? Number(idEquipe) : null,
        designated_by: currentUser.id,
        is_active: true
    }]);
    hideLoader();

    if (error) { showToast('Erreur lors de la désignation : ' + error.message, 'error'); return; }

    showToast(officielSelectionne.full_name + ' est désigné(e) ' + (acteur ? acteur.nom : roleCode) + '.', 'success');
    officielSelectionne = null;
    document.getElementById('offRecherche').value = '';
    document.getElementById('offSelection').innerHTML = '';
    await chargerOfficiels();
}

async function chargerOfficiels() {
    const zone = document.getElementById('offListe');
    if (!zone) return;

    const { data, error } = await supabaseClient
        .from(TBL_OFFICIELS)
        .select('id, user_id, role_code, team_id, match_id, is_active, designated_at')
        .eq('tournament_id', currentTournamentId)
        .order('designated_at', { ascending: false });

    if (error) { zone.innerHTML = '<p class="off-vide">Chargement impossible.</p>'; return; }
    if (!data || !data.length) {
        zone.innerHTML = '<p class="off-vide">Aucun officiel désigné pour le moment. Tant qu\'il n\'y en a pas, personne ne peut déposer de rapport sur ce tournoi.</p>';
        return;
    }

    // Noms des comptes et des equipes, en requetes separees
    const uuids = [...new Set(data.map(function(o) { return o.user_id; }))];
    const { data: profils } = await supabaseClient
        .from(TBL_PROFILES).select('auth_uuid, full_name').in('auth_uuid', uuids);
    const nomDe = {};
    (profils || []).forEach(function(p) { nomDe[p.auth_uuid] = p.full_name; });

    const equipes = await chargerEquipesDuTournoi();
    const nomEquipe = {};
    equipes.forEach(function(e) { nomEquipe[e.id] = e.name; });

    // Regroupement par famille, pour que la liste reste lisible
    const parFamille = {};
    data.forEach(function(o) {
        const acteur = GTOfficiels.acteurParCode(o.role_code);
        const famille = acteur ? acteur.famille : 'autre';
        (parFamille[famille] = parFamille[famille] || []).push(Object.assign({}, o, { __acteur: acteur }));
    });

    zone.innerHTML = GTOfficiels.FAMILLES.map(function(famille) {
        const liste = parFamille[famille.code];
        if (!liste || !liste.length) return '';
        return '<div class="off-famille">' +
            '<h4>' + escapeHtml(famille.nom) + ' <span>' + liste.length + '</span></h4>' +
            liste.map(function(o) {
                const portee = o.match_id ? 'Un match' : 'Tout le tournoi';
                const equipe = o.team_id ? (nomEquipe[o.team_id] || '') : '';
                return '<div class="off-carte' + (o.is_active ? '' : ' off-inactif') + '">' +
                    '<div class="off-carte-corps">' +
                        '<span class="off-carte-nom">' + escapeHtml(nomDe[o.user_id] || 'Compte inconnu') + '</span>' +
                        '<span class="off-carte-role">' + escapeHtml(o.__acteur ? o.__acteur.nom : o.role_code) + '</span>' +
                        '<span class="off-carte-portee">' + portee + (equipe ? ' · ' + escapeHtml(equipe) : '') + '</span>' +
                    '</div>' +
                    '<button type="button" class="off-retirer" data-id="' + o.id + '" title="Retirer la désignation">' +
                        '<i class="fas fa-times"></i></button>' +
                '</div>';
            }).join('') + '</div>';
    }).join('');

    zone.querySelectorAll('.off-retirer').forEach(function(bouton) {
        bouton.addEventListener('click', function() { retirerOfficiel(this.dataset.id); });
    });
}

async function retirerOfficiel(id) {
    if (!confirm('Retirer cette désignation ? Le compte ne pourra plus déposer de rapport à ce titre.')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_OFFICIELS).delete().eq('id', id);
    hideLoader();
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Désignation retirée.', 'info');
    await chargerOfficiels();
}

let selectedTeamLogoFile = null;

async function uploadTeamLogo(file) {
    const ext = file.name.split('.').pop();
    const path = currentTournamentId + '/' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(LOGO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

async function addTeam(e) {
    e.preventDefault();
    const name = document.getElementById('teamName').value.trim();
    const ageCategory = document.getElementById('teamAgeCategory').value.trim() || null;
    if (!name) { showToast('Le nom de l\'équipe est requis.', 'warning'); return; }

    showLoader();
    let logoUrl = null;
    if (selectedTeamLogoFile) {
        try {
            logoUrl = await uploadTeamLogo(selectedTeamLogoFile);
        } catch (err) {
            hideLoader();
            showToast('Erreur envoi du logo : ' + err.message, 'error');
            return;
        }
    }

    const { error } = await supabaseClient
        .from(TBL_TEAMS)
        .insert([{ tournament_id: currentTournamentId, name: name, age_category: ageCategory, logo_url: logoUrl }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de l\'équipe : ' + error.message, 'error');
    } else {
        showToast('Équipe ajoutée', 'success');
        closeModal('addTeamModal');
        document.getElementById('addTeamForm').reset();
        document.getElementById('teamLogoPreview').innerHTML = '';
        selectedTeamLogoFile = null;
        loadTeams();
    }
}

async function deleteTeam(teamId) {
    if (!confirm('Supprimer cette équipe ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAMS).delete().eq('id', teamId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); }
    else { showToast('Équipe supprimée', 'success'); loadTeams(); }
}

// ═══════════════════════════════════════════════════════════
// EFFECTIF D'UNE ÉQUIPE
// ------------------------------------------------------------
// Geree entierement sur team-details.html (bouton "Effectif"
// ci-dessus). Une premiere version de cette section vivait ici
// avec un systeme different (player_name en texte libre) --
// retiree apres avoir decouvert, en reprenant team-details.js,
// que la vraie structure lie de vrais comptes utilisateurs (user_id,
// poste, capitanat, recherche par nom). Garder les deux aurait
// laisse deux facons contradictoires de gerer un effectif.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 16. ONGLET MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('match_date', { ascending: true });
    if (error) {
        console.error('Erreur chargement matchs:', error.message);
        const zone = document.getElementById('matchesList');
        if (zone) zone.innerHTML = '<p class="empty-hint">Matchs indisponibles : ' +
            escapeHtml(error.message) + (error.code ? ' (' + escapeHtml(error.code) + ')' : '') + '</p>';
        return;
    }

    // Les noms des deux équipes, par une requête SÉPARÉE.
    // La jointure imbriquée d'avant dépendait d'une clé étrangère
    // déclarée. Quand elle ne l'est pas, PostgREST répond
    //     « Could not find a relationship between … »
    // et TOUTE la requête échoue — la liste des matchs reste vide.
    // C'est exactement ce qui s'est produit sur l'onglet Primes.
    const idsEquipes = [];
    (data || []).forEach(function(m) {
        if (m.team_a_id && idsEquipes.indexOf(m.team_a_id) === -1) idsEquipes.push(m.team_a_id);
        if (m.team_b_id && idsEquipes.indexOf(m.team_b_id) === -1) idsEquipes.push(m.team_b_id);
    });
    if (idsEquipes.length) {
        const rEq = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', idsEquipes);
        if (!rEq.error) {
            const nomParId = {};
            (rEq.data || []).forEach(function(e) { nomParId[e.id] = e.name; });
            (data || []).forEach(function(m) {
                if (nomParId[m.team_a_id]) m.team_a = { name: nomParId[m.team_a_id] };
                if (nomParId[m.team_b_id]) m.team_b = { name: nomParId[m.team_b_id] };
            });
        }
    }

    // CHANTIER 11 — on retient les matchs pour pouvoir remplir la
    // modale de modification sans repartir en base.
    matchsEnMemoire = data || [];
    renderMatches(data || []);
}

function renderMatches(matches) {
    const container = document.getElementById('matchesList');
    if (!container) return;
    if (!matches.length) { container.innerHTML = '<p class="empty-hint">Aucun match programmé.</p>'; return; }

    container.innerHTML = matches.map(function(m) {
        const date = m.match_date ? new Date(m.match_date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue';
        const isDone = m.status === 'completed';
        const scoreDisplay = isDone ? (m.score_a ?? 0) + ' - ' + (m.score_b ?? 0) : 'vs';
        const teamAName = m.team_a?.name || 'Équipe A';
        const teamBName = m.team_b?.name || 'Équipe B';

        return '<div class="match-item ' + (isDone ? 'done' : '') + '">' +
               '<div class="match-top-row">' +
               '<span class="match-date">' + (m.round ? escapeHtml(m.round) + ' — ' : '') + date + '</span>' +
               (isDone ? '<span class="match-done-badge"><i class="fas fa-check-circle"></i> Terminé</span>' : '') +
               '</div>' +
               '<div class="match-teams"><span>' + escapeHtml(teamAName) + '</span><span class="match-score tabular">' + scoreDisplay + '</span><span>' + escapeHtml(teamBName) + '</span></div>' +
               '<div class="match-actions">' +
               '<button class="btn-result" onclick="openRecordResult(\'' + m.id + '\', \'' + escapeHtml(teamAName).replace(/'/g, "\\'") + '\', \'' + escapeHtml(teamBName).replace(/'/g, "\\'") + '\', ' + (m.score_a ?? 0) + ', ' + (m.score_b ?? 0) + ')"><i class="fas fa-clipboard-check"></i> ' + (isDone ? 'Modifier le résultat' : 'Enregistrer résultat') + '</button>' +
               '<button class="btn-secondary" onclick="ouvrirEditionMatch(\'' + m.id + '\')" title="Modifier la date, l\'heure, le lieu, les équipes"><i class="fas fa-pen"></i> Modifier</button>' +
               '<button class="btn-delete" onclick="deleteMatch(\'' + m.id + '\')"><i class="fas fa-trash"></i></button>' +
               '</div></div>';
    }).join('');
}

async function addMatch(e) {
    e.preventDefault();
    const homeTeam = document.getElementById('matchHomeTeam').value;
    const awayTeam = document.getElementById('matchAwayTeam').value;
    const date = document.getElementById('matchDate').value;
    const round = document.getElementById('matchRound').value.trim() || null;
    if (!homeTeam || !awayTeam) { showToast('Veuillez sélectionner les deux équipes.', 'warning'); return; }
    if (homeTeam === awayTeam) { showToast('Une équipe ne peut pas jouer contre elle-même.', 'warning'); return; }
    if (!date) { showToast('Veuillez choisir une date.', 'warning'); return; }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_MATCHES)
        .insert([{
            tournament_id: currentTournamentId,
            team_a_id: homeTeam,
            team_b_id: awayTeam,
            match_date: new Date(date).toISOString(),
            round: round,
            status: 'scheduled'
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout du match : ' + error.message, 'error');
    } else {
        showToast('Match ajouté', 'success');
        closeModal('addMatchModal');
        document.getElementById('addMatchForm').reset();
        loadMatches();
    }
}

async function deleteMatch(matchId) {
    if (!confirm('Supprimer ce match ?')) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_MATCHES).delete().eq('id', matchId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); }
    else { showToast('Match supprimé', 'success'); loadMatches(); }
}

// ═══════════════════════════════════════════════════════════
// 17. ENREGISTRER UN RÉSULTAT (nouvelle fonctionnalité)
// ═══════════════════════════════════════════════════════════
function openRecordResult(matchId, teamAName, teamBName, currentScoreA, currentScoreB) {
    document.getElementById('resultMatchId').value = matchId;
    document.getElementById('resultTeamALabel').textContent = teamAName;
    document.getElementById('resultTeamBLabel').textContent = teamBName;
    document.getElementById('resultTeamsPreview').innerHTML =
        '<span>' + escapeHtml(teamAName) + '</span><i class="fas fa-futbol"></i><span>' + escapeHtml(teamBName) + '</span>';
    document.getElementById('resultScoreA').value = currentScoreA || 0;
    document.getElementById('resultScoreB').value = currentScoreB || 0;
    openModal('recordResultModal');
}
window.openRecordResult = openRecordResult;

// ════════════════════════════════════════════════════════════
// CHANTIER 11 — MODIFIER UN MATCH
// ------------------------------------------------------------
// Avant, seul le score etait modifiable. saveMatchResult()
// n'ecrivait que score_a, score_b et status : la date, l'heure,
// le lieu et les equipes etaient figes des la creation. Corriger
// une erreur imposait de supprimer le match et de le refaire —
// en perdant son rapport, ses statistiques et ses compositions.
//
// TA REGLE : tout est modifiable tant qu'aucun score n'est
// enregistre. Sur un tableau a elimination, les equipes viennent
// du tour precedent : les changer a la main casserait le
// tableau. On les verrouille alors, et on DIT pourquoi.
// ════════════════════════════════════════════════════════════

let matchsEnMemoire = [];

function ouvrirEditionMatch(idMatch) {
    const m = matchsEnMemoire.filter(function(x) { return String(x.id) === String(idMatch); })[0];
    if (!m) { showToast('Match introuvable. Rafraîchissez la page.', 'error'); return; }

    document.getElementById('editMatchId').value = m.id;

    // La date et l'heure, separees : c'est ainsi qu'on les saisit.
    if (m.match_date) {
        const d = new Date(m.match_date);
        if (!isNaN(d.getTime())) {
            const deuxChiffres = function(n) { return String(n).padStart(2, '0'); };
            document.getElementById('editMatchDate').value =
                d.getFullYear() + '-' + deuxChiffres(d.getMonth() + 1) + '-' + deuxChiffres(d.getDate());
            document.getElementById('editMatchTime').value =
                deuxChiffres(d.getHours()) + ':' + deuxChiffres(d.getMinutes());
        }
    } else {
        document.getElementById('editMatchDate').value = '';
        document.getElementById('editMatchTime').value = '';
    }

    document.getElementById('editMatchVenue').value = m.venue || '';
    document.getElementById('editMatchRound').value = m.round || '';

    // Les deux listes d'equipes du tournoi.
    const options = '<option value="">— À définir —</option>' +
        allTeams.map(function(t) {
            return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name || 'Sans nom') + '</option>';
        }).join('');
    const selA = document.getElementById('editMatchTeamA');
    const selB = document.getElementById('editMatchTeamB');
    selA.innerHTML = options;
    selB.innerHTML = options;
    selA.value = m.team_a_id != null ? String(m.team_a_id) : '';
    selB.value = m.team_b_id != null ? String(m.team_b_id) : '';

    // Les deux verrous, chacun avec sa raison ecrite.
    const joue = m.status === 'completed' ||
                 (m.score_a != null && m.score_b != null && m.status !== 'scheduled');
    const dansUnTableau = m.bracket_position != null;
    const avertissement = document.getElementById('editMatchAvertissement');
    let messages = [];

    if (dansUnTableau) {
        selA.disabled = true;
        selB.disabled = true;
        messages.push('Les équipes de ce match viennent du tour précédent du tableau à élimination : ' +
                      'les changer à la main casserait le tableau. La date, l\'heure et le lieu restent modifiables.');
    } else {
        selA.disabled = false;
        selB.disabled = false;
    }

    if (joue) {
        messages.push('Ce match porte déjà un résultat. Vous pouvez corriger la date, l\'heure et le lieu, ' +
                      'mais changer les équipes fausserait le classement déjà calculé — recalculez-le après coup.');
        selA.disabled = true;
        selB.disabled = true;
    }

    if (messages.length) {
        avertissement.innerHTML = '<i class="fas fa-circle-info"></i> ' + messages.join('<br><br>');
        avertissement.style.display = 'block';
    } else {
        avertissement.style.display = 'none';
    }

    openModal('editMatchModal');
}
window.ouvrirEditionMatch = ouvrirEditionMatch;

async function enregistrerEditionMatch(e) {
    e.preventDefault();
    const id = document.getElementById('editMatchId').value;
    if (!id) return;

    const jour  = document.getElementById('editMatchDate').value;
    const heure = document.getElementById('editMatchTime').value;
    const selA  = document.getElementById('editMatchTeamA');
    const selB  = document.getElementById('editMatchTeamB');

    // Une equipe ne peut pas se rencontrer elle-meme. Le dire
    // avant d'ecrire vaut mieux que de laisser la base refuser.
    if (selA.value && selB.value && selA.value === selB.value) {
        showToast('Une équipe ne peut pas jouer contre elle-même.', 'warning');
        return;
    }

    // Une heure sans date ne veut rien dire : on la refuse plutot
    // que d'enregistrer une rencontre au 1er janvier 1970.
    if (heure && !jour) {
        showToast('Indiquez aussi la date : une heure seule ne situe pas la rencontre.', 'warning');
        return;
    }

    const modif = {
        venue: document.getElementById('editMatchVenue').value.trim() || null,
        round: document.getElementById('editMatchRound').value.trim() || null,
        updated_at: new Date().toISOString(),
        updated_by: currentUser ? currentUser.id : null
    };

    if (jour) {
        modif.match_date = new Date(jour + 'T' + (heure || '00:00')).toISOString();
    }

    // Les listes desactivees ne sont pas envoyees : on ne
    // reecrit pas ce qu'on a volontairement verrouille.
    if (!selA.disabled) modif.team_a_id = selA.value ? Number(selA.value) : null;
    if (!selB.disabled) modif.team_b_id = selB.value ? Number(selB.value) : null;

    showLoader();
    const { error } = await supabaseClient.from(TBL_MATCHES).update(modif).eq('id', id);
    hideLoader();

    if (error) {
        // Une colonne absente est le cas le plus probable si le
        // script SQL du chantier 11 n'a pas ete execute : on le
        // dit au lieu d'afficher un message technique seul.
        showToast('Modification impossible : ' + error.message +
                  (/venue|updated_/.test(error.message)
                    ? ' — le script sql/chantier-11-corrections.sql n\'a peut-être pas été exécuté.'
                    : ''), 'error');
        return;
    }

    // CHANTIER 14 — un match deplace sans prevenir, c'est une equipe
    // qui se presente au mauvais moment ou au mauvais endroit.
    let motDuDeplacement = null;
    if (modif.match_date || modif.venue) {
        const quand = modif.match_date
            ? new Date(modif.match_date).toLocaleString('fr-FR',
                { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
            : null;
        const prevenu = await previenirLesEquipes(
            [modif.team_a_id, modif.team_b_id].filter(Boolean).length
                ? [modif.team_a_id, modif.team_b_id]
                : [document.getElementById('editMatchTeamA').value, document.getElementById('editMatchTeamB').value],
            {
                type: 'tournoi_match_deplace',
                titre: 'Match modifié',
                message: 'Ton match de ' + nomDuTournoi() + ' a changé' +
                         (quand ? ' — ' + quand : '') +
                         (modif.venue ? ' à ' + modif.venue : '') + '.',
                lien: GTNotify.lien('match-details.html', { id: id })
            });
        motDuDeplacement = prevenu ? GTNotify.resumer(prevenu, 'le changement') : null;
    }

    showToast('Match modifié.' + (motDuDeplacement ? ' ' + motDuDeplacement : ''), 'success');
    closeModal('editMatchModal');
    loadMatches();
}

async function saveMatchResult(e) {
    e.preventDefault();
    const matchId = document.getElementById('resultMatchId').value;
    const scoreA = parseInt(document.getElementById('resultScoreA').value, 10);
    const scoreB = parseInt(document.getElementById('resultScoreB').value, 10);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        showToast('Merci d\'entrer des scores valides.', 'warning');
        return;
    }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_MATCHES)
        .update({ score_a: scoreA, score_b: scoreB, status: 'completed' })
        .eq('id', matchId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'enregistrement : ' + error.message, 'error');
        return;
    }

    // CHANTIER 13 — le vainqueur monte tout seul.
    //
    // C'est ici que tenait le trou le plus couteux du module :
    // gt-calendrier.js creait bien les affiches des tours suivants,
    // mais avec team_a_id et team_b_id a null, et RIEN ne les
    // remplissait jamais. Sur une coupe a 32 equipes, il fallait
    // saisir 31 affiches a la main en recopiant les vainqueurs.
    const avance = await fairePropagerLeTableau({ silencieux: true });

    // CHANTIER 14 — les deux equipes apprennent le resultat.
    const laRencontre = (await supabaseClient.from(TBL_MATCHES)
        .select('team_a_id, team_b_id, round').eq('id', matchId).maybeSingle()).data;

    let motDuResultat = null;
    if (laRencontre) {
        const prevenu = await previenirLesEquipes([laRencontre.team_a_id, laRencontre.team_b_id], {
            type: 'tournoi_resultat',
            titre: 'Résultat enregistré',
            message: (laRencontre.round ? laRencontre.round + ' — ' : '') +
                     'score final ' + scoreA + ' - ' + scoreB + ' (' + nomDuTournoi() + ').',
            lien: GTNotify.lien('match-details.html', { id: matchId })
        });
        motDuResultat = prevenu ? GTNotify.resumer(prevenu, 'le résultat') : null;
    }

    closeModal('recordResultModal');
    showToast('Résultat enregistré.' +
              (avance && avance.message ? ' ' + avance.message : '') +
              (motDuResultat ? ' ' + motDuResultat : ''), 'success');
    loadMatches();
}

// ═══════════════════════════════════════════════════════════
// 17a. PRÉVENIR LES GENS (chantier 14)
// -----------------------------------------------------------
// Un systeme de notifications existait deja sur la plateforme —
// table supabaseAuthPrive_notifications, page
// shared/community/notifications.html, abonnement Realtime — et
// vingt-six fichiers s'en servaient. Le gestionnaire de tournoi
// etait le SEUL module a n'envoyer jamais rien.
//
// Une equipe inscrite ne savait pas qu'elle jouait demain. Une
// equipe qualifiee au tour suivant ne l'apprenait que si
// quelqu'un l'appelait.
//
// Ces fonctions ne creent rien : elles branchent le tournoi sur
// ce qui existe. Un echec d'envoi n'empeche JAMAIS l'action
// (le match reste enregistre), mais il se voit — on ne repete
// pas l'erreur du chantier 12.
// ═══════════════════════════════════════════════════════════
const TABLES_NOTIF = {
    profiles: TBL_PROFILES,
    teamPlayers: TBL_TEAM_PLAYERS,
    teams: TBL_TEAMS,
    notifications: 'supabaseAuthPrive_notifications'
};

async function previenirLesEquipes(idsEquipes, contenu) {
    if (typeof GTNotify === 'undefined') return null;
    const ids = (idsEquipes || []).filter(Boolean);
    if (!ids.length) return null;

    const effectif = await GTNotify.comptesDesEquipes(supabaseClient, TABLES_NOTIF, ids);
    if (effectif.erreur) {
        return { envoyees: 0, destinataires: 0, erreur: effectif.erreur, ignoree: false };
    }

    const envoi = await GTNotify.versLesComptes(
        supabaseClient, TABLES_NOTIF, effectif.comptes,
        Object.assign({ sauf: currentUser ? currentUser.id : null }, contenu)
    );
    // Les membres sans compte ne peuvent rien recevoir : on le dit,
    // c'est a ca que sert WhatsApp.
    envoi.sansCompte = (envoi.sansCompte || 0) + (effectif.sansCompte || 0);
    return envoi;
}

// Le nom du tournoi, pour que le message dise de quoi il parle.
function nomDuTournoi() {
    return (currentTournament && currentTournament.name) ? currentTournament.name : 'le tournoi';
}

// ═══════════════════════════════════════════════════════════
// 17b. LE TABLEAU QUI AVANCE TOUT SEUL (chantier 13)
// -----------------------------------------------------------
// Le calcul vit dans gt-tableau.js, sans DOM ni reseau. Ici on
// ne fait que lire les rencontres, appliquer ce qu'il rend, et
// dire ce qui s'est passe.
//
// La fonction est volontairement rejouable : la relancer sur un
// tableau deja a jour n'ecrit rien. Elle sert donc aussi de
// reparation quand un resultat a ete corrige apres coup.
// ═══════════════════════════════════════════════════════════
async function fairePropagerLeTableau(options) {
    options = options || {};
    if (typeof GTTableau === 'undefined') {
        if (!options.silencieux) showToast('Le module du tableau n\'est pas chargé (gt-tableau.js).', 'error');
        return null;
    }
    // Un bouton qui ne répond jamais est pire qu'un bouton absent :
    // on clique dix fois en se demandant si la page est morte.
    // Chaque sortie de cette fonction dit désormais quelque chose.
    if (!currentTournamentId) {
        if (!options.silencieux) {
            showToast('Aucun tournoi n\'est ouvert. Choisis d\'abord un tournoi en haut de la page.', 'warning');
        }
        return null;
    }

    const { data: rencontres, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*')
        .eq('tournament_id', currentTournamentId);

    if (error) {
        const message = 'Impossible de lire les rencontres pour faire avancer le tableau : ' + error.message;
        console.warn(message);
        if (!options.silencieux) showToast(message, 'error');
        return null;
    }

    const resultat = GTTableau.propager(rencontres || []);

    // Aucune affiche reconnue. Ce n'est pas forcément anormal — un
    // championnat n'a pas de tableau — mais il faut le DIRE, sinon
    // l'organisateur clique dans le vide sans comprendre.
    //
    // On distingue les trois causes, parce qu'elles n'appellent pas
    // la même réponse.
    if (!resultat.affiches) {
        if (!options.silencieux) {
            const total = (rencontres || []).length;
            const avecPosition = (rencontres || []).filter(function(m) {
                return m.bracket_position != null && m.bracket_position !== '';
            }).length;
            const reconnues = (rencontres || []).filter(function(m) {
                return GTTableau.tailleDuTour(m) != null || GTTableau.estTroisiemePlace(m);
            }).length;

            let pourquoi;
            if (!total) {
                pourquoi = 'Ce tournoi n\'a aucune rencontre. Commence par « Générer le calendrier ».';
            } else if (!avecPosition && !reconnues) {
                pourquoi = 'Les ' + total + ' rencontres de ce tournoi ne font pas partie d\'un tableau ' +
                           'à élimination directe — c\'est un championnat ou des poules. ' +
                           'Ce bouton ne sert que pour une coupe.';
            } else if (!avecPosition) {
                pourquoi = total + ' rencontre(s) lues, dont ' + reconnues + ' portent un nom de tour de coupe, ' +
                           'mais AUCUNE n\'a de position dans le tableau (bracket_position). ' +
                           'Elles ont probablement été créées à la main, une par une. ' +
                           'Régénère le calendrier en format « élimination directe » pour que ' +
                           'le tableau sache qui affronte qui.';
            } else {
                pourquoi = total + ' rencontre(s) lues, ' + avecPosition + ' avec une position, ' +
                           'mais aucun tour de coupe reconnu. Vérifie le nom des tours ' +
                           '(Finale, Demi-finales, Quarts de finale…).';
            }
            showToast(pourquoi, 'warning');
        }
        return { ecrites: 0, message: null, resultat: resultat };
    }

    let ecrites = 0;
    let echec = null;
    for (let i = 0; i < resultat.ecritures.length; i++) {
        const e = resultat.ecritures[i];
        const modif = {};
        if (e.team_a_id !== undefined) modif.team_a_id = e.team_a_id;
        if (e.team_b_id !== undefined) modif.team_b_id = e.team_b_id;
        const r = await supabaseClient.from(TBL_MATCHES).update(modif).eq('id', e.id);
        if (r.error) { echec = r.error; break; }
        ecrites++;
    }

    if (echec) {
        // On ne laisse pas cet echec dans la console : un tableau a
        // moitie rempli est pire qu'un tableau vide, il faut le savoir.
        showToast('Le tableau n\'a pas pu être complété (' + ecrites + ' place(s) écrite(s) sur ' +
                  resultat.ecritures.length + ') : ' + echec.message +
                  (echec.code ? ' (' + echec.code + ')' : '') +
                  '. Ouvre gt-diagnostic.html : il manque probablement une colonne.', 'error');
        return { ecrites: ecrites, message: null, resultat: resultat };
    }

    // Les noms d'equipes, pour que le message dise « Vainqueur du
    // tournoi : Inter Milan » et non un identifiant.
    const noms = {};
    if (resultat.champion) {
        const equipes = await chargerEquipesDuTournoi();
        equipes.forEach(function(eq) { noms[eq.id] = eq.name; });
    }
    // CHANTIER 14 — l'equipe qui monte est prevenue, avec le nom du
    // tour qu'elle vient d'atteindre. C'est LE message qu'un
    // capitaine attend.
    if (ecrites) {
        const parMatch = {};
        (rencontres || []).forEach(function(m) { parMatch[m.id] = m; });
        const qualifieesParTour = {};
        resultat.ecritures.forEach(function(e) {
            const m = parMatch[e.id];
            if (!m) return;
            const tour = m.round || 'le tour suivant';
            const equipe = e.team_a_id || e.team_b_id;
            if (!equipe) return;
            if (!qualifieesParTour[tour]) qualifieesParTour[tour] = [];
            if (qualifieesParTour[tour].indexOf(equipe) === -1) qualifieesParTour[tour].push(equipe);
        });
        for (const tour of Object.keys(qualifieesParTour)) {
            await previenirLesEquipes(qualifieesParTour[tour], {
                type: 'tournoi_qualification',
                titre: 'Qualifiés !',
                message: 'Vous êtes qualifiés pour : ' + tour + ' (' + nomDuTournoi() + ').',
                lien: GTNotify.lien('tournament-details.html', { id: currentTournamentId })
            });
        }
    }

    const message = GTTableau.resumer(resultat, noms);
    const aQuelqueChoseADire = !!(ecrites || resultat.champion || resultat.refus.length);

    if (!options.silencieux) showToast(message, aQuelqueChoseADire ? 'success' : 'info');
    return { ecrites: ecrites, message: aQuelqueChoseADire ? message : null, resultat: resultat };
}

// ═══════════════════════════════════════════════════════════
// 18. ONGLET RAPPORTS
// ═══════════════════════════════════════════════════════════
async function loadReports() {
    const { data: matches } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id')
        .eq('tournament_id', currentTournamentId);

    if (!matches || matches.length === 0) {
        document.getElementById('reportsList').innerHTML = '<p class="empty-hint">Aucun match, donc aucun rapport.</p>';
        return;
    }

    const matchIds = matches.map(function(m) { return m.id; });
    const { data, error } = await supabaseClient
        .from(TBL_REPORTS)
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

    if (error) { console.error('Erreur rapports:', error.message); return; }
    renderReports(data || []);
}

function renderReports(reports) {
    const container = document.getElementById('reportsList');
    if (!container) return;
    if (!reports.length) { container.innerHTML = '<p class="empty-hint">Aucun rapport pour l\'instant.</p>'; return; }
    container.innerHTML = reports.map(function(r) {
        return '<div class="report-item"><h4>' + escapeHtml(r.title || 'Rapport de match') + '</h4><p>' + escapeHtml(r.content || '') + '</p></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 18b. CLÔTURER LE TOURNOI ET GRAVER LE PALMARÈS (chantier 15)
// -----------------------------------------------------------
// CE QUI MANQUAIT
//
// Deux choses existaient, et rien ne les reliait :
//   gt_tournament_awards  ce qui est PROMIS (1ère place : trophée
//                         + 500 000 F, meilleur buteur : ballon
//                         d'or…), saisi à la création.
//   gt_prizes             ce qui est VERSÉ, tapé à la main par
//                         l'organisateur, nom du bénéficiaire
//                         compris.
//
// Entre les deux : le vide. Personne n'était jamais déclaré
// vainqueur. Un tournoi se jouait jusqu'à la finale et ne se
// terminait jamais. Aucun palmarès, aucune trace.
//
// Or depuis le chantier 13 la plateforme SAIT qui a gagné.
// Il ne restait qu'à le graver.
//
// Rien n'est écrit sans confirmation : on calcule, on MONTRE, et
// l'organisateur décide. Un podium incomplet bloque la clôture —
// mieux vaut un tournoi qui reste ouvert qu'un palmarès faux.
// ═══════════════════════════════════════════════════════════
let palmaresPropose = null;

async function preparerLaCloture() {
    if (typeof GTPalmares === 'undefined') {
        showToast('Le module du palmarès n\'est pas chargé (gt-palmares.js).', 'error');
        return;
    }
    if (!currentTournamentId) {
        showToast('Choisis d\'abord un tournoi.', 'warning');
        return;
    }

    showLoader();

    const [rMatchs, rClassement, rStats, rAwards] = await Promise.all([
        supabaseClient.from(TBL_MATCHES).select('*').eq('tournament_id', currentTournamentId),
        supabaseClient.from(TBL_STANDINGS).select('*').eq('tournament_id', currentTournamentId),
        supabaseClient.from(TBL_PLAYER_MATCH_STATS).select('player_id, goals, assists, clean_sheet')
            .eq('tournament_id', currentTournamentId),
        supabaseClient.from(TBL_AWARDS).select('*').eq('tournament_id', currentTournamentId)
            .order('display_order', { ascending: true })
    ]);

    hideLoader();

    const souci = [rMatchs, rClassement, rStats, rAwards].filter(function(r) { return r.error; })[0];
    if (souci) {
        showToast('Impossible de préparer la clôture : ' + souci.error.message +
                  (souci.error.code ? ' (' + souci.error.code + ')' : '') +
                  '. Ouvre gt-diagnostic.html.', 'error');
        return;
    }

    const resultat = GTPalmares.calculer({
        matchs: rMatchs.data || [],
        classement: rClassement.data || [],
        stats: rStats.data || [],
        recompenses: rAwards.data || []
    });

    // Les noms, pour que l'organisateur relise des noms et non des
    // identifiants — c'est lui qui valide, il doit comprendre.
    const noms = {};
    const equipes = await chargerEquipesDuTournoi();
    equipes.forEach(function(e) { noms[e.id] = e.name; });

    const idsSportifs = [];
    resultat.attributions.forEach(function(a) {
        if (a.genre === 'sportif') a.beneficiaires.forEach(function(c) {
            if (idsSportifs.indexOf(c) === -1) idsSportifs.push(c);
        });
    });
    if (idsSportifs.length && typeof GTIdentite !== 'undefined') {
        const idx = await GTIdentite.completer(supabaseClient,
            { teamPlayers: TBL_TEAM_PLAYERS, profiles: TBL_PROFILES },
            { parCle: {}, liste: [] }, idsSportifs);
        Object.keys(idx.parCle).forEach(function(c) { noms[c] = idx.parCle[c].etiquette; });
    }

    palmaresPropose = { resultat: resultat, noms: noms, recompenses: rAwards.data || [] };
    afficherLaProposition(resultat, noms);
}

function afficherLaProposition(resultat, noms) {
    const zone = document.getElementById('cloturePropose');
    if (!zone) return;
    const nom = function(c) { return noms[c] || c; };
    const p = resultat.podium;

    let html = '<div class="cloture-bloc">';

    if (!p.complet) {
        html += '<p class="cloture-refus"><i class="fas fa-circle-exclamation"></i> ' +
                '<b>Ce tournoi ne peut pas être clôturé.</b><br>' + escapeHtml(p.raison || '') + '</p>' +
                '</div>';
        zone.innerHTML = html;
        zone.style.display = 'block';
        return;
    }

    html += '<h3 class="cloture-titre"><i class="fas fa-trophy"></i> Podium proposé</h3>' +
            '<p class="cloture-source">Calculé depuis ' +
            (p.source === 'tableau' ? 'le tableau à élimination directe' : 'le classement') + '.</p>' +
            '<ol class="cloture-podium">' +
            '<li><b>1<sup>er</sup></b> ' + escapeHtml(nom(p.premier)) + '</li>' +
            (p.deuxieme ? '<li><b>2<sup>e</sup></b> ' + escapeHtml(nom(p.deuxieme)) + '</li>' : '') +
            (p.troisiemes || []).map(function(t) {
                return '<li><b>3<sup>e</sup></b> ' + escapeHtml(nom(t)) +
                       ((p.troisiemes.length > 1) ? ' <em>(ex æquo)</em>' : '') + '</li>';
            }).join('') +
            '</ol>';
    if (p.motifTroisieme) {
        html += '<p class="cloture-source">3<sup>e</sup> place : ' + escapeHtml(p.motifTroisieme) + '.</p>';
    }

    html += '<h3 class="cloture-titre"><i class="fas fa-medal"></i> Récompenses</h3>';
    if (!resultat.attributions.length) {
        html += '<p class="cloture-source">Aucune récompense n\'a été définie à la création de ce tournoi. ' +
                'Le podium sera quand même enregistré.</p>';
    } else {
        html += '<ul class="cloture-recompenses">' + resultat.attributions.map(function(a) {
            const libelle = a.award.award_type === 'rank'
                ? a.award.rank_position + '<sup>' + (a.award.rank_position === 1 ? 're' : 'e') + '</sup> place'
                : escapeHtml(a.award.special_category || '—');
            const qui = a.beneficiaires.length
                ? a.beneficiaires.map(function(c) { return escapeHtml(nom(c)); }).join(' et ') +
                  (a.exAequo ? ' <em>(ex æquo)</em>' : '')
                : '<em class="cloture-amain">à attribuer à la main — ' + escapeHtml(a.motif || '') + '</em>';
            return '<li><span class="cloture-quoi">' + libelle + '</span> ' +
                   '<span class="cloture-lot">' + escapeHtml(a.award.reward_label || '') + '</span> ' +
                   '<span class="cloture-qui">' + qui + '</span></li>';
        }).join('') + '</ul>';
    }

    html += '<div class="cloture-actions">' +
            '<button id="clotureConfirmerBtn" class="btn-primary">' +
            '<i class="fas fa-check"></i> Confirmer et clôturer</button> ' +
            '<button id="clotureAnnulerBtn" class="btn-secondary">' +
            '<i class="fas fa-times"></i> Annuler</button></div></div>';

    zone.innerHTML = html;
    zone.style.display = 'block';
    zone.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('clotureConfirmerBtn')?.addEventListener('click', graverLePalmares);
    document.getElementById('clotureAnnulerBtn')?.addEventListener('click', function() {
        zone.style.display = 'none'; zone.innerHTML = ''; palmaresPropose = null;
    });
}

async function graverLePalmares() {
    if (!palmaresPropose || !palmaresPropose.resultat.podium.complet) return;
    const r = palmaresPropose.resultat;
    const p = r.podium;

    showLoader();
    let ecrites = 0;
    let echec = null;

    // 1. Les bénéficiaires, sur les récompenses promises.
    for (let i = 0; i < r.attributions.length; i++) {
        const a = r.attributions[i];
        if (!a.beneficiaires.length) continue;
        const modif = {
            winner_name: a.beneficiaires.map(function(c) { return palmaresPropose.noms[c] || c; }).join(' / '),
            awarded_at: new Date().toISOString(),
            awarded_by: currentUser ? currentUser.id : null
        };
        if (a.genre === 'equipe')  modif.winner_team_id   = a.beneficiaires[0];
        if (a.genre === 'sportif') modif.winner_player_id = a.beneficiaires[0];

        const rep = await supabaseClient.from(TBL_AWARDS).update(modif).eq('id', a.award.id);
        if (rep.error) { echec = rep.error; break; }
        ecrites++;
    }

    // 2. Le tournoi lui-même.
    if (!echec) {
        const rep = await supabaseClient.from(TBL_TOURNAMENTS).update({
            status: 'completed',
            champion_team_id: p.premier,
            runner_up_team_id: p.deuxieme || null,
            third_team_id: (p.troisiemes || [])[0] || null,
            closed_at: new Date().toISOString(),
            closed_by: currentUser ? currentUser.id : null
        }).eq('id', currentTournamentId);
        if (rep.error) echec = rep.error;
    }

    hideLoader();

    if (echec) {
        showToast('LE PALMARÈS N\'A PAS ÉTÉ ENREGISTRÉ (' + ecrites + ' récompense(s) écrites) : ' +
                  echec.message + (echec.code ? ' (' + echec.code + ')' : '') +
                  '. C\'est presque toujours une colonne absente : exécute ' +
                  'chantier-15-palmares.sql, puis recommence.', 'error');
        return;
    }

    // 3. Tout le monde l'apprend.
    let motNotif = '';
    const equipesConcernees = [p.premier, p.deuxieme].concat(p.troisiemes || []).filter(Boolean);
    const prevenu = await previenirLesEquipes(equipesConcernees, {
        type: 'tournoi_palmares',
        titre: 'Palmarès publié',
        message: nomDuTournoi() + ' est terminé. Vainqueur : ' +
                 (palmaresPropose.noms[p.premier] || p.premier) + '.',
        lien: GTNotify.lien('tournament-details.html', { id: currentTournamentId })
    });
    if (prevenu) motNotif = ' ' + GTNotify.resumer(prevenu, 'le palmarès');

    // Les noms AVANT de vider : sans ça, le message final
    // affichait des identifiants au lieu des noms d'équipes.
    const nomsPourLeMessage = palmaresPropose.noms;

    const zone = document.getElementById('cloturePropose');
    if (zone) { zone.style.display = 'none'; zone.innerHTML = ''; }
    palmaresPropose = null;

    showToast('Tournoi clôturé. ' + GTPalmares.resumer(r, nomsPourLeMessage) + motNotif, 'success');

    await loadTournament();
    await loadPrizes();
}

// ═══════════════════════════════════════════════════════════
// 19. ONGLET PRIMES
// ═══════════════════════════════════════════════════════════
async function loadPrizes() {
    // CORRECTION — la jointure imbriquée est retirée.
    //
    // L'ancienne requête demandait
    //     .select('*, team:supabaseAuthPrive_gt_teams!team_id(name)')
    // et PostgREST répondait :
    //     « Could not find a relationship between
    //       'supabaseAuthPrive_gt_prizes' and
    //       'supabaseAuthPrive_gt_teams' in the schema cache »
    // parce qu'aucune clé étrangère ne déclare cette relation.
    // L'onglet Primes restait donc vide, sans que personne sache
    // pourquoi.
    //
    // Règle de la maison depuis l'incident manage-tournament :
    // deux requêtes séparées, fusionnées en JavaScript. Ça marche
    // que la clé étrangère existe ou non.
    const { data, error } = await supabaseClient
        .from(TBL_PRIZES)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });
    if (error) {
        // Cet échec ne part plus dans la console seule : l'onglet
        // Primes restait vide sans explication.
        console.error('Erreur chargement primes:', error.message);
        const zone = document.getElementById('prizesList');
        if (zone) {
            zone.innerHTML = '<p class="empty-hint">Primes indisponibles : ' +
                escapeHtml(error.message) + (error.code ? ' (' + escapeHtml(error.code) + ')' : '') + '</p>';
        }
        return;
    }

    const primes = data || [];

    // Le nom des équipes, par une requête SÉPARÉE — c'est la
    // deuxième moitié du correctif. Sans elle, le rendu afficherait
    // le mot générique à la place du nom, ce qui serait pire que
    // l'erreur d'origine.
    const idsEquipes = primes
        .filter(function(p) { return p.recipient_type === 'team' && p.recipient_id; })
        .map(function(p) { return p.recipient_id; })
        .filter(function(v, i, t) { return t.indexOf(v) === i; });

    if (idsEquipes.length) {
        const r = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', idsEquipes);
        if (!r.error) {
            const nomParId = {};
            (r.data || []).forEach(function(e) { nomParId[e.id] = e.name; });
            primes.forEach(function(p) {
                if (p.recipient_type === 'team' && nomParId[p.recipient_id]) {
                    p.team = { name: nomParId[p.recipient_id] };
                }
            });
        }
    }

    renderPrizes(primes);
}

function renderPrizes(prizes) {
    const container = document.getElementById('prizesList');
    if (!container) return;
    if (!prizes.length) { container.innerHTML = '<p class="empty-hint">Aucune prime enregistrée.</p>'; return; }
    container.innerHTML = prizes.map(function(p) {
        const recipient = p.recipient_type === 'team'
            ? (p.team ? escapeHtml(p.team.name) : escapeHtml(mot('{Collectif}')))
            : escapeHtml(p.recipient_id);
        return '<div class="prize-item">' +
               '<span class="prize-recipient"><i class="fas ' + (p.recipient_type === 'team' ? 'fa-shield-alt' : 'fa-user') + '"></i> ' + recipient + '</span>' +
               '<span class="prize-amount tabular">' + formatMoney(p.amount) + ' FCFA</span>' +
               (p.reason ? '<span class="prize-reason">' + escapeHtml(p.reason) + '</span>' : '') +
               '</div>';
    }).join('');
}

async function addPrize(e) {
    e.preventDefault();
    const recipientType = document.getElementById('prizeRecipientType').value;
    const recipientId = recipientType === 'team'
        ? document.getElementById('prizeTeamId').value
        : document.getElementById('prizePlayerId').value.trim();
    const amount = document.getElementById('prizeAmount').value;
    const reason = document.getElementById('prizeReason').value.trim();

    if (!recipientId || !amount) { showToast('Veuillez remplir tous les champs.', 'warning'); return; }

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_PRIZES)
        .insert([{
            tournament_id: currentTournamentId,
            recipient_type: recipientType,
            recipient_id: recipientId,
            amount: parseFloat(amount),
            reason: reason || null
        }]);
    hideLoader();
    if (error) {
        showToast('Erreur lors de l\'ajout de la prime : ' + error.message, 'error');
    } else {
        showToast('Prime ajoutée', 'success');
        closeModal('addPrizeModal');
        document.getElementById('addPrizeForm').reset();
        loadPrizes();
    }
}

// ═══════════════════════════════════════════════════════════
// 20. MODALE MODIFIER TOURNOI
// ═══════════════════════════════════════════════════════════
let editLogoFile = null;
let editBannerFile = null;

function openEditTournamentModal() {
    if (!currentTournament) return;
    document.getElementById('editName').value = currentTournament.name || '';
    document.getElementById('editStartDate').value = currentTournament.start_date ? currentTournament.start_date.substring(0, 16) : '';
    document.getElementById('editEndDate').value = currentTournament.end_date ? currentTournament.end_date.substring(0, 16) : '';
    document.getElementById('editLocation').value = currentTournament.location || '';
    document.getElementById('editDescription').value = currentTournament.description || '';
    document.getElementById('editPrizePool').value = currentTournament.prize_pool || '';
    document.getElementById('editRegistrationCode').value = currentTournament.registration_code || '';
    document.getElementById('editStreamUrl').value = currentTournament.stream_url || '';
    document.getElementById('editStatus').value = currentTournament.status || 'draft';
    document.getElementById('editVideoUrl').value = currentTournament.video_url || '';
    document.getElementById('editParticipationType').value = currentTournament.participation_type || 'collectif';
    document.getElementById('editParticipationPrice').value = currentTournament.participation_price || '';
    document.getElementById('editMaxStarters').value = currentTournament.max_starters || '';
    document.getElementById('editMaxStaff').value = currentTournament.max_staff || '';
    document.getElementById('editRules').value = currentTournament.rules || '';
    document.getElementById('editLogoPreview').innerHTML = currentTournament.logo_url ? '<img src="' + currentTournament.logo_url + '" alt="Logo">' : '';
    document.getElementById('editBannerPreview').innerHTML = currentTournament.banner_url ? '<img src="' + currentTournament.banner_url + '" alt="Bannière">' : '';
    editLogoFile = null;
    editBannerFile = null;
    openModal('editTournamentModal');
}

async function uploadTournamentMedia(file, label) {
    const ext = file.name.split('.').pop();
    const path = currentTournamentId + '/' + label + '_' + Date.now() + '.' + ext;
    const { error } = await supabaseClient.storage.from('gt-tournament-media').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from('gt-tournament-media').getPublicUrl(path);
    return data.publicUrl;
}

async function saveTournamentChanges(e) {
    e.preventDefault();

    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    if (new Date(endDate) <= new Date(startDate)) {
        showToast('La date de fin doit être après la date de début.', 'warning');
        return;
    }

    showLoader();

    let logoUrl = currentTournament.logo_url;
    let bannerUrl = currentTournament.banner_url;
    try {
        if (editLogoFile) logoUrl = await uploadTournamentMedia(editLogoFile, 'logo');
        if (editBannerFile) bannerUrl = await uploadTournamentMedia(editBannerFile, 'banner');
    } catch (err) {
        hideLoader();
        showToast('Erreur envoi des médias : ' + err.message, 'error');
        return;
    }

    const updates = {
        name: document.getElementById('editName').value,
        start_date: startDate,
        end_date: endDate,
        location: document.getElementById('editLocation').value,
        description: document.getElementById('editDescription').value,
        prize_pool: parseFloat(document.getElementById('editPrizePool').value) || 0,
        registration_code: document.getElementById('editRegistrationCode').value,
        stream_url: document.getElementById('editStreamUrl').value,
        status: document.getElementById('editStatus').value,
        video_url: document.getElementById('editVideoUrl').value.trim() || null,
        participation_type: document.getElementById('editParticipationType').value,
        participation_price: parseFloat(document.getElementById('editParticipationPrice').value) || 0,
        max_starters: parseInt(document.getElementById('editMaxStarters').value) || null,
        max_staff: parseInt(document.getElementById('editMaxStaff').value) || null,
        rules: document.getElementById('editRules').value.trim() || null,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient.from(TBL_TOURNAMENTS).update(updates).eq('id', currentTournamentId);
    hideLoader();

    if (error) {
        showToast('Erreur lors de la modification : ' + error.message, 'error');
    } else {
        showToast('Tournoi mis à jour', 'success');
        closeModal('editTournamentModal');
        const { data } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('*')
            .eq('id', currentTournamentId)
            .single();
        // Après modification : le sport et le type se rechargent
        // eux aussi, sinon fillInfoTab afficherait « — ».
        if (data) await attacherTypeEtSport([data]);
        if (data) {
            currentTournament = data;
            appliquerLexique();
            fillInfoTab(data);
            document.getElementById('tournamentName').innerHTML = '<i class="fas fa-sliders-h"></i> ' + escapeHtml(data.name || 'Gestion du tournoi');
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 21. MODALES GÉNÉRALES
// ═══════════════════════════════════════════════════════════
function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'flex'; }
function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'none'; }
window.closeModal = closeModal;

// ═══════════════════════════════════════════════════════════
// 22. GESTION DES ONGLETS
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// CHANTIER 18 — L'ONGLET COMMUNAUTÉ
// -----------------------------------------------------------
// CE QUI N'ALLAIT PAS
//
// Le gestionnaire de tournoi et le fil de la communauté vivent
// dans la MÊME base, et ne se parlent pas. Le gestionnaire écrit
// dans la table des notifications — privée, une personne à la
// fois. Le fil écrit dans la table des publications — publique.
// Entre les deux, pas une colonne.
//
// Un tournoi pouvait donc se jouer en entier, couronner un
// champion, et le fil n'en savait rien.
//
// CE QUE FAIT CET ONGLET
//
// Il fait passer un moment du tournoi dans le fil : l'annonce,
// un résultat, une qualification, le palmarès. Chaque
// publication porte le lien PUBLIC du tournoi — celui du
// chantier 17, qui s'ouvre sans compte.
//
// TROIS GARDE-FOUS
//
//   1. On RELIT avant d'envoyer. Le texte est dans un champ
//      modifiable, et la carte s'affiche en aperçu.
//   2. On CONFIRME. Publier chez tout le monde n'est pas une
//      action qu'on déclenche d'un clic distrait.
//   3. JAMAIS DEUX FOIS le même moment. gt-communaute.js le
//      vérifie avant chaque insertion.
// ═══════════════════════════════════════════════════════════

const TBL_POSTS       = 'supabaseAuthPrive_posts';
const TBL_COMMUNITIES = 'supabaseAuthPrive_communities';

const TABLES_COMMUNAUTE = {
    posts:       TBL_POSTS,
    communities: TBL_COMMUNITIES,
    profiles:    TBL_PROFILES
};

// Ce que l'organisateur s'apprête à publier. Tant que c'est
// null, le bouton « Publier » reste désactivé : on ne peut pas
// envoyer un texte sans savoir de quel moment il parle.
let brouillonCommunaute = null;
let auteurCommunaute    = null;

// Le vocabulaire passe par les fonctions deja presentes plus
// haut dans ce fichier — sportDuTournoi() et mot(). En refaire
// une copie ici, c'est se garantir qu'un jour les deux diront
// deux mots differents pour le meme sport.
function motDuSportCommunaute() {
    return sportDuTournoi() || null;
}

function collectifDuSport() {
    // mot() rend le gabarit INCHANGE si gt-lexique.js n'est pas
    // chargé : « {collectifs} » est une chaîne non vide, un
    // simple « || » ne l'aurait donc jamais rattrapé, et le mot
    // serait parti tel quel dans la publication.
    const m = mot('{collectifs}');
    return (!m || m.indexOf('{') !== -1) ? 'équipes' : m;
}

// ── L'état de la communauté de l'organisateur ───────────────
async function monterLOngletCommunaute() {
    const etat    = document.getElementById('commEtat');
    const atelier = document.getElementById('commAtelier');
    if (!etat) return;

    if (typeof GTCommunaute === 'undefined') {
        etat.className = 'comm-etat erreur';
        etat.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ' +
            'Le pont vers la communauté n\'est pas chargé (gt-communaute.js manque sur cette page).';
        return;
    }
    if (!currentTournamentId) {
        etat.className = 'comm-etat erreur';
        etat.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Choisis d\'abord un tournoi.';
        return;
    }

    const resultat = await GTCommunaute.identifierLAuteur(
        supabaseClient, TABLES_COMMUNAUTE, currentUser ? currentUser.id : null);

    if (!resultat.ok) {
        // On ne cache pas le problème derrière un atelier vide :
        // on dit lequel, et quoi faire.
        etat.className = 'comm-etat erreur';
        etat.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(resultat.message) +
            (resultat.raison === 'communaute'
                ? ' <a href="../community/feed.html" target="_blank" rel="noopener">Ouvrir le fil</a>'
                : '');
        if (atelier) atelier.style.display = 'none';
        return;
    }

    auteurCommunaute = resultat;
    etat.className = 'comm-etat ok';
    etat.innerHTML = '<i class="fas fa-circle-check"></i> Tu publieras sous <strong>' +
        escapeHtml(resultat.nom || 'ton compte') + '</strong>' +
        (resultat.feed_id ? ' (@' + escapeHtml(resultat.feed_id) + ')' : '') + '.';

    if (atelier) atelier.style.display = 'block';

    remplirLeChoixDesRencontres();
    await chargerLHistoriqueCommunaute();
    await chargerLInterrupteurCommunaute();
}

// ── Les rencontres terminées, pour le modèle « résultat » ───
function rencontresTerminees() {
    return (matchsEnMemoire || []).filter(function(m) {
        return m.status === 'completed';
    }).sort(function(a, b) {
        return new Date(b.match_date || 0) - new Date(a.match_date || 0);
    });
}

function nomDeLEquipe(id) {
    if (!id) return null;
    const e = (allTeams || []).filter(function(t) { return String(t.id) === String(id); })[0];
    return e ? e.name : null;
}

function remplirLeChoixDesRencontres() {
    const select = document.getElementById('commMatch');
    if (!select) return;

    const liste = rencontresTerminees();
    if (!liste.length) {
        select.innerHTML = '<option value="">Aucune rencontre terminée pour le moment</option>';
        return;
    }

    select.innerHTML = liste.map(function(m) {
        const a = nomDeLEquipe(m.team_a_id) || 'Équipe A';
        const b = nomDeLEquipe(m.team_b_id) || 'Équipe B';
        const sa = m.score_a == null ? 0 : m.score_a;
        const sb = m.score_b == null ? 0 : m.score_b;
        const tour = m.round ? m.round + ' — ' : '';
        return '<option value="' + escapeHtml(String(m.id)) + '">' +
               escapeHtml(tour + a + ' ' + sa + ' - ' + sb + ' ' + b) + '</option>';
    }).join('');
}

// ── Les quatre modèles ──────────────────────────────────────
function lienPublicDuTournoiCourant() {
    return GTCommunaute.lienPublicDepuisIci(currentTournamentId);
}

function poserLeBrouillon(brouillon) {
    brouillonCommunaute = brouillon;

    const champ = document.getElementById('commTexte');
    if (champ) champ.value = brouillon.texte;

    const apercu = document.getElementById('commApercu');
    if (apercu) apercu.innerHTML = GTCommunaute.apercuHtml(brouillon.carte);

    const bouton = document.getElementById('btnPublierComm');
    if (bouton) bouton.disabled = false;

    compterLesCaracteresCommunaute();
}

function modeleAnnonce() {
    if (!currentTournament) { showToast('Le tournoi n\'est pas chargé.', 'warning'); return; }
    const lien = lienPublicDuTournoiCourant();
    const carte = GTCommunaute.construireCarte({
        tournoi: currentTournament,
        genre:   GTCommunaute.GENRES.ANNONCE,
        lien:    lien,
        sport:   motDuSportCommunaute(),
        titre:   'Inscriptions ouvertes'
    });
    poserLeBrouillon({
        genre: GTCommunaute.GENRES.ANNONCE,
        match_id: null,
        carte: carte,
        texte: GTCommunaute.texteAnnonce(currentTournament, lien, collectifDuSport())
    });
    basculerLeChoixDeRencontre(false);
}

function modeleResultat() {
    const select = document.getElementById('commMatch');
    if (!select || !select.value) {
        showToast('Choisis d\'abord une rencontre terminée.', 'warning');
        basculerLeChoixDeRencontre(true);
        return;
    }

    const m = rencontresTerminees().filter(function(x) {
        return String(x.id) === String(select.value);
    })[0];
    if (!m) { showToast('Cette rencontre est introuvable.', 'error'); return; }

    const a = nomDeLEquipe(m.team_a_id) || 'Équipe A';
    const b = nomDeLEquipe(m.team_b_id) || 'Équipe B';
    const lien = lienPublicDuTournoiCourant();
    const forfait = m.forfeit_team_id ? nomDeLEquipe(m.forfeit_team_id) : null;

    const infos = {
        tournoi:  currentTournament,
        tour:     m.round || null,
        equipe_a: a, equipe_b: b,
        score_a:  m.score_a == null ? 0 : m.score_a,
        score_b:  m.score_b == null ? 0 : m.score_b,
        tirs_a:   m.penalty_a, tirs_b: m.penalty_b,
        forfait:  forfait
    };

    const carte = GTCommunaute.construireCarte({
        tournoi:  currentTournament,
        genre:    GTCommunaute.GENRES.RESULTAT,
        match_id: m.id,
        lien:     lien,
        sport:    motDuSportCommunaute(),
        titre:    m.round || 'Résultat',
        equipe_a: a, equipe_b: b,
        score_a:  infos.score_a, score_b: infos.score_b,
        tirs_a:   m.penalty_a,   tirs_b:  m.penalty_b,
        detail:   forfait ? ('Forfait : ' + forfait) : null
    });

    poserLeBrouillon({
        genre: GTCommunaute.GENRES.RESULTAT,
        match_id: m.id,
        carte: carte,
        texte: GTCommunaute.texteResultat(infos, lien)
    });
    basculerLeChoixDeRencontre(true);
}

function modeleQualification() {
    const select = document.getElementById('commMatch');
    if (!select || !select.value) {
        showToast('Choisis d\'abord la rencontre qui a qualifié quelqu\'un.', 'warning');
        basculerLeChoixDeRencontre(true);
        return;
    }

    const m = rencontresTerminees().filter(function(x) {
        return String(x.id) === String(select.value);
    })[0];
    if (!m) { showToast('Cette rencontre est introuvable.', 'error'); return; }

    // Qui passe : les tirs au but priment sur le score, le
    // forfait prime sur tout. C'est la même règle que gt-tableau.
    let gagnantId = null;
    if (m.forfeit_team_id) {
        gagnantId = String(m.forfeit_team_id) === String(m.team_a_id) ? m.team_b_id : m.team_a_id;
    } else if (m.penalty_winner_id) {
        gagnantId = m.penalty_winner_id;
    } else if (m.penalty_a != null && m.penalty_b != null && m.penalty_a !== m.penalty_b) {
        gagnantId = m.penalty_a > m.penalty_b ? m.team_a_id : m.team_b_id;
    } else if ((m.score_a || 0) !== (m.score_b || 0)) {
        gagnantId = (m.score_a || 0) > (m.score_b || 0) ? m.team_a_id : m.team_b_id;
    }

    if (!gagnantId) {
        showToast('Cette rencontre n\'a pas de vainqueur : score de parité, sans tirs au but ni forfait. ' +
                  'Impossible d\'annoncer une qualification.', 'warning');
        return;
    }

    const nomGagnant = nomDeLEquipe(gagnantId) || 'L\'équipe qualifiée';
    const lien = lienPublicDuTournoiCourant();

    const carte = GTCommunaute.construireCarte({
        tournoi:  currentTournament,
        genre:    GTCommunaute.GENRES.QUALIFICATION,
        match_id: m.id,
        lien:     lien,
        sport:    motDuSportCommunaute(),
        titre:    m.round || 'Qualification',
        detail:   nomGagnant + ' passe au tour suivant.'
    });

    poserLeBrouillon({
        genre: GTCommunaute.GENRES.QUALIFICATION,
        match_id: m.id,
        carte: carte,
        texte: GTCommunaute.texteQualification({
            tournoi: currentTournament,
            tour: m.round || null,
            qualifies: [nomGagnant]
        }, lien)
    });
    basculerLeChoixDeRencontre(true);
}

async function modelePalmares() {
    if (!currentTournament) { showToast('Le tournoi n\'est pas chargé.', 'warning'); return; }

    showLoader();
    const r = await supabaseClient.from(TBL_AWARDS)
        .select('*')
        .eq('tournament_id', currentTournamentId)
        .order('display_order', { ascending: true });
    hideLoader();

    if (r.error) {
        showToast('Le palmarès n\'a pas pu être lu : ' + r.error.message, 'error');
        return;
    }

    const recompenses = r.data || [];
    const parRang = {};
    recompenses.forEach(function(a) {
        if (a.award_type === 'rank' && a.rank_position && a.winner_name) {
            parRang[a.rank_position] = a.winner_name;
        }
    });

    const distinctions = recompenses.filter(function(a) {
        return a.award_type !== 'rank' && a.winner_name;
    }).map(function(a) {
        return { categorie: a.special_category || 'Distinction', gagnant: a.winner_name };
    });

    // Le champion peut aussi venir du tournoi lui-même, quand la
    // clôture l'a gravé sans passer par une récompense.
    let champion = parRang[1] || null;
    if (!champion && currentTournament.champion_team_id) {
        champion = nomDeLEquipe(currentTournament.champion_team_id);
    }

    if (!champion) {
        showToast('Aucun vainqueur enregistré : clôture d\'abord le tournoi (onglet Primes), ' +
                  'puis reviens publier le palmarès.', 'warning');
        return;
    }

    const infos = {
        tournoi:    currentTournament,
        champion:   champion,
        finaliste:  parRang[2] || nomDeLEquipe(currentTournament.runner_up_team_id) || null,
        troisieme:  parRang[3] || nomDeLEquipe(currentTournament.third_team_id) || null,
        distinctions: distinctions
    };

    const lien = lienPublicDuTournoiCourant();
    const carte = GTCommunaute.construireCarte({
        tournoi: currentTournament,
        genre:   GTCommunaute.GENRES.PALMARES,
        lien:    lien,
        sport:   motDuSportCommunaute(),
        titre:   'Vainqueur : ' + champion,
        detail:  infos.finaliste ? ('Finaliste : ' + infos.finaliste) : null
    });

    poserLeBrouillon({
        genre: GTCommunaute.GENRES.PALMARES,
        match_id: null,
        carte: carte,
        texte: GTCommunaute.textePalmares(infos, lien)
    });
    basculerLeChoixDeRencontre(false);
}

function basculerLeChoixDeRencontre(visible) {
    const ligne = document.getElementById('commLigneMatch');
    if (ligne) ligne.style.display = visible ? 'flex' : 'none';
}

function compterLesCaracteresCommunaute() {
    const champ = document.getElementById('commTexte');
    const cible = document.getElementById('commNbCaracteres');
    if (champ && cible) cible.textContent = (champ.value || '').length;
}

// ── L'envoi ─────────────────────────────────────────────────
async function publierDansLeFil() {
    if (!brouillonCommunaute) {
        showToast('Choisis d\'abord ce que tu veux annoncer.', 'warning');
        return;
    }

    const champ = document.getElementById('commTexte');
    const texte = champ ? (champ.value || '').trim() : '';
    if (!texte) {
        showToast('Le texte est vide : rien n\'a été publié.', 'warning');
        return;
    }

    // On confirme. Une publication part chez tout le monde.
    const sur = window.confirm(
        'Publier ce message dans le fil de la communauté ?\n\n' +
        'Il sera visible par tout le monde, pas seulement par les inscrits au tournoi.');
    if (!sur) return;

    const bouton = document.getElementById('btnPublierComm');
    if (bouton) { bouton.disabled = true; bouton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication…'; }
    showLoader();

    const resultat = await GTCommunaute.publier(supabaseClient, TABLES_COMMUNAUTE, {
        tournoi:  currentTournament,
        genre:    brouillonCommunaute.genre,
        match_id: brouillonCommunaute.match_id,
        carte:    brouillonCommunaute.carte,
        texte:    texte,
        auteur:   auteurCommunaute
    });

    hideLoader();
    if (bouton) { bouton.disabled = false; bouton.innerHTML = '<i class="fas fa-paper-plane"></i> Publier dans le fil'; }

    if (!resultat.ok) {
        // Aucune panne avalée : le message dit exactement ce qui
        // s'est passé, et rien de vert ne s'affiche.
        showToast(GTCommunaute.resumer(resultat), resultat.deja ? 'warning' : 'error');
        return;
    }

    showToast('Publié dans le fil de la communauté. ' +
              'Ouvre le fil pour le voir — la carte porte le lien public du tournoi.', 'success');

    brouillonCommunaute = null;
    if (champ) champ.value = '';
    const apercu = document.getElementById('commApercu');
    if (apercu) apercu.innerHTML = '';
    if (bouton) bouton.disabled = true;
    compterLesCaracteresCommunaute();

    await chargerLHistoriqueCommunaute();
}

// ── Ce qui a déjà été publié ────────────────────────────────
async function chargerLHistoriqueCommunaute() {
    const zone = document.getElementById('commHistorique');
    if (!zone || !currentTournamentId) return;

    const r = await GTCommunaute.lireLesPublications(
        supabaseClient, TABLES_COMMUNAUTE, currentTournamentId, 30);

    if (!r.ok) {
        zone.innerHTML = '<p class="comm-vide erreur">L\'historique n\'a pas pu être lu : ' +
            escapeHtml(r.erreur.message) +
            (/tournament_id|post_kind/.test(r.erreur.message || '')
                ? ' — le script chantier-18-communaute.sql n\'a pas encore été passé.' : '') +
            '</p>';
        return;
    }

    if (!r.publications.length) {
        zone.innerHTML = '<p class="comm-vide">Rien n\'a encore été publié sur ce tournoi.</p>';
        return;
    }

    const MOTS = {
        annonce: 'Annonce', resultat: 'Résultat',
        qualification: 'Qualification', palmares: 'Palmarès'
    };

    zone.innerHTML = r.publications.map(function(p) {
        const quand = p.created_at
            ? new Date(p.created_at).toLocaleString('fr-FR',
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '';
        const extrait = (p.content || '').split('\n')[0].slice(0, 110);
        return '<div class="comm-ligne-histo">' +
               '<span class="comm-genre">' + escapeHtml(MOTS[p.post_kind] || 'Publication') + '</span>' +
               '<span class="comm-extrait">' + escapeHtml(extrait) + '</span>' +
               '<span class="comm-quand">' + escapeHtml(quand) + '</span>' +
               '</div>';
    }).join('');
}

// ── L'interrupteur ──────────────────────────────────────────
async function chargerLInterrupteurCommunaute() {
    const boite = document.getElementById('commAuto');
    if (!boite || !currentTournament) return;
    boite.checked = currentTournament.auto_publish_to_feed === true;
}

async function basculerLInterrupteurCommunaute() {
    const boite = document.getElementById('commAuto');
    if (!boite || !currentTournamentId) return;

    const valeur = !!boite.checked;
    const r = await supabaseClient.from(TBL_TOURNAMENTS)
        .update({ auto_publish_to_feed: valeur })
        .eq('id', currentTournamentId);

    if (r.error) {
        // On REMET l'interrupteur comme il était : un bouton qui
        // reste coché alors que rien n'a été enregistré est le
        // pire des mensonges.
        boite.checked = !valeur;
        showToast('Le réglage n\'a pas été enregistré : ' + r.error.message +
                  (/auto_publish_to_feed/.test(r.error.message || '')
                    ? ' — exécute chantier-18-communaute.sql.' : ''), 'error');
        return;
    }

    if (currentTournament) currentTournament.auto_publish_to_feed = valeur;
    showToast(valeur
        ? 'À la clôture, le palmarès sera proposé à la publication dans le fil.'
        : 'La clôture ne publiera plus rien dans le fil.', 'success');
}

function initOngletCommunaute() {
    const b1 = document.getElementById('btnModeleAnnonce');
    if (b1) b1.addEventListener('click', modeleAnnonce);

    const b2 = document.getElementById('btnModeleResultat');
    if (b2) b2.addEventListener('click', modeleResultat);

    const b3 = document.getElementById('btnModeleQualif');
    if (b3) b3.addEventListener('click', modeleQualification);

    const b4 = document.getElementById('btnModelePalmares');
    if (b4) b4.addEventListener('click', modelePalmares);

    const envoi = document.getElementById('btnPublierComm');
    if (envoi) envoi.addEventListener('click', publierDansLeFil);

    const champ = document.getElementById('commTexte');
    if (champ) champ.addEventListener('input', compterLesCaracteresCommunaute);

    const boite = document.getElementById('commAuto');
    if (boite) boite.addEventListener('change', basculerLInterrupteurCommunaute);

    // Changer de rencontre refait le texte du modèle en cours,
    // sinon le texte parlerait d'un match et la carte d'un autre.
    const select = document.getElementById('commMatch');
    if (select) {
        select.addEventListener('change', function() {
            if (!brouillonCommunaute) return;
            if (brouillonCommunaute.genre === GTCommunaute.GENRES.RESULTAT) modeleResultat();
            if (brouillonCommunaute.genre === GTCommunaute.GENRES.QUALIFICATION) modeleQualification();
        });
    }
}


// ═══════════════════════════════════════════════════════════
// CHANTIER 19 — DES POULES À LA PHASE FINALE
// -----------------------------------------------------------
// CE QUI N'ALLAIT PAS
//
// Sur un format « poules + élimination directe », « Générer le
// calendrier » ne créait QUE les poules. gt-calendrier.js :
//
//     if (famille === 'mixte') {
//         var rencontres = genererPoules(repartition, ...);
//         return { rencontres: rencontres, ... };   // et c'est tout
//     }
//
// La phase finale n'existait nulle part — pas même en cases
// vides. « Faire avancer le tableau » ne pouvait donc RIEN
// avancer, et répondait :
//
//     « Les 24 rencontres de ce tournoi ne font pas partie d'un
//       tableau à élimination directe. »
//
// Message exact, et parfaitement inutile : il constatait
// l'absence du tableau sans dire que personne ne savait le
// créer.
//
// DEUX MÉTIERS QU'IL NE FAUT PAS CONFONDRE
//
//   Créer la phase finale  → lit le classement, dessine le
//                            tableau. C'est ici.
//   Faire avancer          → fait monter les vainqueurs dans un
//                            tableau qui existe déjà. C'est le
//                            chantier 13.
//
// TROIS RÈGLES
//
//   1. On n'écrit JAMAIS sans que l'organisateur ait relu les
//      affiches. Le bouton propose, il n'exécute pas.
//   2. On AJOUTE les rencontres de la phase finale. Les poules
//      ne sont jamais effacées — contrairement à « Générer le
//      calendrier », qui remplace tout.
//   3. Les trois refus sont explicites : poules non finies,
//      phase finale déjà là, moins de deux qualifiés.
// ═══════════════════════════════════════════════════════════

let phaseFinaleProposee = null;

// « 1er », pas « 1e ». Le reste prend « e ». C'est un détail,
// mais l'organisateur relit cette page avant de signer un
// tableau : elle doit être écrite correctement.
function ordinal(n) {
    const x = Number(n);
    if (!isFinite(x)) return String(n);
    return x === 1 ? '1er' : x + 'e';
}

// Les réglages de classement du tournoi, lus une seule fois.
// Mêmes valeurs que « Recalculer le classement » : les deux
// doivent forcément dire la même chose, sinon les qualifiés
// affichés ne seraient pas ceux du classement.
function reglagesDuClassement() {
    const config = (currentTournament && currentTournament.format_config) || {};
    return {
        bareme: {
            pointsVictoire:          currentTournament.points_win  ?? 3,
            pointsNul:               currentTournament.points_draw ?? 1,
            pointsDefaite:           currentTournament.points_loss ?? 0,
            pointsVictoireTirsAuBut: config.pointsVictoireTirsAuBut ?? 2,
            pointsDefaiteTirsAuBut:  config.pointsDefaiteTirsAuBut  ?? 1,
            forfaitVainqueur:        currentTournament.forfeit_score_winner ?? 3,
            forfaitPerdant:          currentTournament.forfeit_score_loser  ?? 0
        },
        departage: (Array.isArray(currentTournament.tiebreak_rules) && currentTournament.tiebreak_rules.length)
            ? currentTournament.tiebreak_rules
            : GTClassement.DEPARTAGE_DEFAUT
    };
}

async function preparerLaPhaseFinale() {
    const zone = document.getElementById('phaseFinalePropose');

    if (typeof GTQualification === 'undefined') {
        showToast('Le module de qualification n\'est pas chargé (gt-qualification.js).', 'error');
        return;
    }
    if (!currentTournamentId) {
        showToast('Choisis d\'abord un tournoi.', 'warning');
        return;
    }

    showLoader();

    const [rMatchs, equipes] = await Promise.all([
        supabaseClient.from(TBL_MATCHES).select('*').eq('tournament_id', currentTournamentId),
        chargerEquipesDuTournoi()
    ]);

    hideLoader();

    if (rMatchs.error) {
        showToast('Impossible de lire les rencontres : ' + rMatchs.error.message, 'error');
        return;
    }
    if (!equipes.length) {
        showToast('Aucune équipe inscrite : rien à qualifier.', 'warning');
        return;
    }

    // Les groupes. Sans eux, il n'y a pas de poules à dépouiller.
    const groupeDe = {};
    let avecGroupes = false;
    equipes.forEach(function(e) {
        if (e.group_name) { groupeDe[e.id] = e.group_name; avecGroupes = true; }
    });

    if (!avecGroupes) {
        showToast('Aucune équipe n\'est rattachée à un groupe. Ce bouton sert aux formats ' +
                  'à poules : génère d\'abord le calendrier en « poules + élimination directe ».', 'warning');
        return;
    }

    const reglages = reglagesDuClassement();
    const nomDe = {};
    equipes.forEach(function(e) { nomDe[e.id] = e.name; });

    // Le classement se RECALCULE ici, depuis les résultats, au lieu
    // d'être lu dans gt_standings.
    //
    // C'est volontaire : gt_standings n'est réécrit que quand
    // l'organisateur clique sur « Recalculer le classement ». S'il
    // ne l'a pas fait depuis le dernier match, la table est
    // périmée — et on qualifierait les mauvaises équipes.
    const parGroupe = GTClassement.calculerParGroupe({
        matchs: (rMatchs.data || []).filter(function(m) { return GTQualification.estDePoule(m); }),
        equipes: equipes.map(function(e) { return e.id; }),
        groupeDe: groupeDe,
        bareme: reglages.bareme,
        departage: reglages.departage
    });

    const proposition = GTQualification.preparer({
        matchs: rMatchs.data || [],
        parGroupe: parGroupe,
        qualifiesParGroupe: currentTournament.qualifiers_per_group ?? 2,
        meilleursTroisiemes: currentTournament.best_third_place_count ?? 0,
        departage: reglages.departage,
        pointsVictoire: reglages.bareme.pointsVictoire
    });

    phaseFinaleProposee = { proposition: proposition, noms: nomDe, equipes: equipes };
    afficherLaPropositionDePhaseFinale(zone, proposition, nomDe);
}

function afficherLaPropositionDePhaseFinale(zone, p, noms) {
    if (!zone) return;
    zone.style.display = 'block';

    function nom(id) { return noms[id] || String(id); }

    // ── Cas 1 : on refuse, et on dit pourquoi ───────────────
    if (!p.possible) {
        let html = '<div class="pf-tete pf-refus"><i class="fas fa-hand"></i> ' +
                   'La phase finale ne peut pas être créée maintenant</div>';

        html += '<ul class="pf-blocages">' +
                p.blocages.map(function(b) {
                    return '<li>' + escapeHtml(b.message) + '</li>';
                }).join('') + '</ul>';

        // Ce que l'organisateur veut vraiment savoir : qui est
        // déjà qualifié. On refuse, mais on ne le laisse pas les
        // mains vides.
        if (p.dOffice && p.dOffice.length) {
            const parGroupe = {};
            p.dOffice.forEach(function(q) {
                (parGroupe[q.groupe] = parGroupe[q.groupe] || []).push(q);
            });
            html += '<div class="pf-sous-titre"><i class="fas fa-circle-check"></i> ' +
                    'Déjà qualifiés d\'office — plus personne ne peut les rattraper</div>' +
                    '<div class="pf-groupes">' +
                    Object.keys(parGroupe).sort().map(function(g) {
                        return '<div class="pf-groupe"><span class="pf-groupe-nom">Groupe ' +
                               escapeHtml(g) + '</span><ul>' +
                               parGroupe[g].map(function(q) {
                                   return '<li><span class="pf-rang">' + ordinal(q.rang) + '</span> ' +
                                          escapeHtml(nom(q.team_id)) +
                                          ' <small>' + q.points + ' pts</small></li>';
                               }).join('') + '</ul></div>';
                    }).join('') + '</div>';
        } else if (p.blocages.some(function(b) { return b.code === 'poules'; })) {
            html += '<p class="pf-vide">Aucune équipe n\'est encore qualifiée d\'office : ' +
                    'tout peut encore basculer.</p>';
        }

        html += '<div class="pf-actions">' +
                '<button class="btn-secondary" id="pfFermer"><i class="fas fa-times"></i> Fermer</button>' +
                '</div>';

        zone.innerHTML = html;
        document.getElementById('pfFermer')?.addEventListener('click', fermerLaProposition);
        return;
    }

    // ── Cas 2 : on propose, l'organisateur relit ────────────
    const a = p.appariement;

    let html = '<div class="pf-tete"><i class="fas fa-trophy"></i> Phase finale proposée</div>';

    html += '<p class="pf-resume">' + escapeHtml(GTQualification.resumer(p, noms)) + '</p>';

    if (p.avertissements.length) {
        html += '<ul class="pf-avertissements">' +
                p.avertissements.map(function(m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') +
                '</ul>';
    }

    // Les qualifiés, par groupe.
    const parGroupe = {};
    p.qualifies.forEach(function(q) {
        (parGroupe[q.groupe] = parGroupe[q.groupe] || []).push(q);
    });
    html += '<div class="pf-sous-titre"><i class="fas fa-users"></i> Les qualifiés</div>' +
            '<div class="pf-groupes">' +
            Object.keys(parGroupe).sort().map(function(g) {
                return '<div class="pf-groupe"><span class="pf-groupe-nom">Groupe ' + escapeHtml(g) +
                       '</span><ul>' +
                       parGroupe[g].map(function(q) {
                           return '<li><span class="pf-rang">' + ordinal(q.rang) + '</span> ' +
                                  escapeHtml(nom(q.team_id)) +
                                  (q.repeche ? ' <span class="pf-repeche">repêché</span>' : '') +
                                  ' <small>' + (q.points == null ? '—' : q.points + ' pts') + '</small></li>';
                       }).join('') + '</ul></div>';
            }).join('') + '</div>';

    // Les affiches du premier tour — ce que l'organisateur doit
    // vraiment relire avant de signer.
    html += '<div class="pf-sous-titre"><i class="fas fa-sitemap"></i> Les affiches du premier tour</div>' +
            '<div class="pf-affiches">' +
            a.paires.map(function(paire) {
                const x = a.ordre[paire[0] - 1];
                const y = a.ordre[paire[1] - 1];
                if (!x && !y) return '';
                if (!x || !y) {
                    const seul = x || y;
                    return '<div class="pf-affiche pf-exempt">' +
                           '<span class="pf-equipe">' + escapeHtml(nom(seul.team_id)) + '</span>' +
                           '<span class="pf-vs">exempté</span>' +
                           '<span class="pf-equipe pf-attente">passe au tour suivant</span></div>';
                }
                const fratricide = x.groupe === y.groupe;
                return '<div class="pf-affiche' + (fratricide ? ' pf-fratricide' : '') + '">' +
                       '<span class="pf-equipe">' + escapeHtml(nom(x.team_id)) +
                       ' <small>' + ordinal(x.rang) + ' ' + escapeHtml(x.groupe) + '</small></span>' +
                       '<span class="pf-vs">vs</span>' +
                       '<span class="pf-equipe">' + escapeHtml(nom(y.team_id)) +
                       ' <small>' + ordinal(y.rang) + ' ' + escapeHtml(y.groupe) + '</small></span>' +
                       (fratricide ? '<span class="pf-alerte">même groupe</span>' : '') +
                       '</div>';
            }).join('') + '</div>';

    html += '<p class="pf-note"><i class="fas fa-circle-info"></i> ' +
            'Les rencontres de poule ne sont pas touchées : la phase finale s\'ajoute. ' +
            'Ensuite, les vainqueurs monteront tout seuls à chaque résultat enregistré.</p>';

    html += '<div class="pf-actions">' +
            '<button class="btn-primary" id="pfConfirmer"><i class="fas fa-check"></i> ' +
            'Créer ces ' + a.paires.filter(function(paire) {
                return a.ordre[paire[0] - 1] || a.ordre[paire[1] - 1];
            }).length + ' affiche(s) et le tableau</button>' +
            '<button class="btn-secondary" id="pfFermer"><i class="fas fa-times"></i> Annuler</button>' +
            '</div>';

    zone.innerHTML = html;
    document.getElementById('pfConfirmer')?.addEventListener('click', graverLaPhaseFinale);
    document.getElementById('pfFermer')?.addEventListener('click', fermerLaProposition);
}

function fermerLaProposition() {
    const zone = document.getElementById('phaseFinalePropose');
    if (zone) { zone.style.display = 'none'; zone.innerHTML = ''; }
    phaseFinaleProposee = null;
}

async function graverLaPhaseFinale() {
    if (!phaseFinaleProposee || !phaseFinaleProposee.proposition.possible) return;

    const p = phaseFinaleProposee.proposition;
    const a = p.appariement;
    const noms = phaseFinaleProposee.noms;

    const sur = window.confirm(
        'Créer la phase finale de ce tournoi ?\n\n' +
        p.qualifies.length + ' équipes qualifiées, tableau à ' + a.taille + '.\n' +
        'Les rencontres de poule ne seront pas touchées.');
    if (!sur) return;

    const bouton = document.getElementById('pfConfirmer');
    if (bouton) { bouton.disabled = true; bouton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création…'; }
    showLoader();

    // tetesSerie = toutes : le générateur NE MÉLANGE RIEN.
    //
    // Sans ça, genererTableau() tire au sort tout ce qui n'est pas
    // tête de série — et le 1er du groupe A pouvait retomber sur
    // le 1er du groupe B dès les quarts, alors qu'on venait
    // justement de calculer l'ordre pour l'éviter.
    const ordonnees = a.ordre.filter(Boolean).map(function(q) { return q.team_id; });
    const config = (currentTournament && currentTournament.format_config) || {};

    const rencontres = GTCalendrier.genererTableau(ordonnees, {
        tetesSerie: ordonnees.length,
        manchesPhaseFinale: currentTournament.final_phase_legs ?? config.manchesPhaseFinale ?? 1,
        matchTroisiemePlace: currentTournament.third_place_match ?? config.matchTroisiemePlace ?? false
    });

    if (!rencontres.length) {
        hideLoader();
        if (bouton) { bouton.disabled = false; bouton.innerHTML = '<i class="fas fa-check"></i> Créer'; }
        showToast('Le générateur n\'a produit aucune rencontre. Rien n\'a été écrit.', 'error');
        return;
    }

    const maintenant = new Date().toISOString();
    const lignes = rencontres.map(function(m) {
        return {
            tournament_id: currentTournamentId,
            team_a_id: m.equipeA || null,
            team_b_id: m.equipeB || null,
            match_date: null,
            round: m.tour,
            matchday: null,
            group_name: null,
            bracket_position: m.positionTableau || null,
            round_code: m.codeTour || null,
            round_size: m.tailleTour || null,
            leg: m.manche || 1,
            is_bye: !!m.exemption,
            status: m.exemption ? 'completed' : 'scheduled',
            generated_at: maintenant
        };
    });

    // INSERT, jamais DELETE. Les poules restent où elles sont.
    let inseres = 0;
    for (let i = 0; i < lignes.length; i += 100) {
        const paquet = lignes.slice(i, i + 100);
        const { error } = await supabaseClient.from(TBL_MATCHES).insert(paquet);
        if (error) {
            hideLoader();
            if (bouton) { bouton.disabled = false; bouton.innerHTML = '<i class="fas fa-check"></i> Créer'; }
            // Un tableau à moitié écrit est pire qu'un tableau absent :
            // il faut le dire, et dire combien de lignes sont passées.
            showToast('LA PHASE FINALE N\'A PAS ÉTÉ CRÉÉE ENTIÈREMENT (' + inseres +
                      ' rencontre(s) écrites sur ' + lignes.length + ') : ' + error.message +
                      (error.code ? ' (' + error.code + ')' : '') +
                      '. Supprime ces rencontres avant de recommencer.', 'error');
            await loadMatches();
            return;
        }
        inseres += paquet.length;
    }

    // Les exemptions montent tout de suite au tour suivant.
    const avance = await fairePropagerLeTableau({ silencieux: true });

    hideLoader();
    fermerLaProposition();

    // Tout le monde l'apprend.
    const prevenu = await previenirLesEquipes(ordonnees, {
        type: 'tournoi_phase_finale',
        titre: 'Phase finale',
        message: 'Le tableau final de ' + nomDuTournoi() + ' est sorti. Regarde qui tu affrontes.',
        lien: GTNotify.lien('tournament-details.html', { id: currentTournamentId })
    });

    showToast('Phase finale créée : ' + inseres + ' rencontre(s), tableau à ' + a.taille + '. ' +
              (avance && avance.ecrites
                  ? avance.ecrites + ' place(s) déjà remplie(s) par les exemptions. ' : '') +
              'Les poules n\'ont pas été touchées.' +
              (prevenu ? ' ' + GTNotify.resumer(prevenu, 'la phase finale') : ''),
              'success');

    await loadMatches();
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            tabButtons.forEach(function(b) { b.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            const target = document.getElementById(this.dataset.tab + 'Tab');
            if (target) target.classList.add('active');

            // L'onglet Paiements se remplit a sa premiere
            // ouverture : inutile d'interroger la base pour un
            // organisateur qui ne le regardera pas.
            if (this.dataset.tab === 'paiements' && !this.dataset.charge) {
                this.dataset.charge = '1';
                monterLOngletPaiements();
            }

            // CHANTIER 18 — meme chose pour la Communaute : on
            // n'interroge la table des profils et des communautes
            // que si l'organisateur ouvre vraiment l'onglet.
            if (this.dataset.tab === 'communaute' && !this.dataset.charge) {
                this.dataset.charge = '1';
                monterLOngletCommunaute();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 22b. SIGNATURES DU RÈGLEMENT
// ------------------------------------------------------------
// Montre a l'organisateur qui a reellement signe le reglement
// pour SON tournoi (has_agreed_to_rules sur gt_participants,
// deja ecrit par tournament-rules.js), avec preuve exportable
// en PDF par personne.
// ═══════════════════════════════════════════════════════════
async function loadSignatures() {
    const container = document.getElementById('signaturesList');
    const countEl = document.getElementById('signaturesCount');
    if (!container || !currentTournamentId) return;

    const { data, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('user_id, signature_data, agreed_at')
        .eq('tournament_id', currentTournamentId)
        .eq('has_agreed_to_rules', true)
        .order('agreed_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p class="empty-hint">Erreur de chargement des signatures.</p>';
        return;
    }

    if (!data || !data.length) {
        countEl.textContent = '0 signature';
        container.innerHTML = '<p class="empty-hint">Aucun participant n\'a encore signé le règlement.</p>';
        return;
    }

    countEl.textContent = data.length + ' signature' + (data.length > 1 ? 's' : '');

    const userIds = data.map(function(s) { return s.user_id; });
    const { data: profiles } = await supabaseClient.from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', userIds);
    const profileMap = {};
    (profiles || []).forEach(function(p) { profileMap[p.auth_uuid] = p; });

    container.innerHTML = data.map(function(s, index) {
        const profile = profileMap[s.user_id] || {};
        const date = s.agreed_at ? new Date(s.agreed_at).toLocaleString('fr-FR') : '—';
        return '<div class="signature-item">' +
               '<div class="signature-avatar">' + (profile.avatar_url ? '<img src="' + profile.avatar_url + '" alt="">' : '<span class="avatar-initials-small">' + escapeHtml((profile.full_name || '?')[0].toUpperCase()) + '</span>') + '</div>' +
               '<div class="signature-info"><span class="signature-name">' + escapeHtml(profile.full_name || 'Participant inconnu') + '</span>' +
               '<span class="signature-date"><i class="fas fa-check-circle"></i> Signé le ' + date + '</span></div>' +
               '<img class="signature-thumb" src="' + s.signature_data + '" alt="Signature">' +
               '<button class="btn-export-signature" data-index="' + index + '"><i class="fas fa-file-pdf"></i> Exporter</button>' +
               '</div>';
    }).join('');

    document.querySelectorAll('.btn-export-signature').forEach(function(btn) {
        btn.addEventListener('click', function() { exportSignatureProof(data[parseInt(this.dataset.index)], profileMap); });
    });
}

function exportSignatureProof(signature, profileMap) {
    const profile = profileMap[signature.user_id] || {};
    const date = signature.agreed_at ? new Date(signature.agreed_at).toLocaleString('fr-FR') : '—';

    const container = document.createElement('div');
    container.style.cssText = 'font-family:Poppins,Arial,sans-serif;padding:30px;';
    container.innerHTML =
        '<div style="text-align:center;margin-bottom:24px;"><h1 style="color:#551B8C;font-size:20px;">Preuve d\'acceptation du règlement</h1>' +
        '<p style="color:#63636F;font-size:12px;">HubISoccer — The Hub of Inspiration of Soccer</p></div>' +
        '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px;">' +
        '<tr><td style="padding:8px 0;color:#63636F;">Tournoi</td><td style="padding:8px 0;font-weight:600;">' + escapeHtml(currentTournament.name || '') + '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#63636F;">Participant</td><td style="padding:8px 0;font-weight:600;">' + escapeHtml(profile.full_name || 'Inconnu') + '</td></tr>' +
        '<tr><td style="padding:8px 0;color:#63636F;">Date de signature</td><td style="padding:8px 0;font-weight:600;">' + date + '</td></tr>' +
        '</table>' +
        '<p style="font-size:12px;color:#2A2A38;margin-bottom:10px;">Le participant ci-dessus déclare avoir lu et accepté électroniquement le règlement général de la plateforme ainsi que le règlement spécifique de ce tournoi.</p>' +
        '<div style="border:1px solid #E4E4EA;border-radius:8px;padding:16px;text-align:center;margin-top:16px;">' +
        '<p style="font-size:11px;color:#9797A3;margin-bottom:8px;">Signature</p>' +
        '<img src="' + signature.signature_data + '" style="max-height:70px;">' +
        '</div>';

    html2pdf().set({
        margin: 15,
        filename: 'preuve-signature-' + (profile.full_name || 'participant').replace(/\s/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save();
}

// ═══════════════════════════════════════════════════════════
// 23. SÉLECTEURS (ÉQUIPES)
// ═══════════════════════════════════════════════════════════
async function loadTeamOptions() {
    if (!allTeams.length) await loadTeams();
    const homeSelect = document.getElementById('matchHomeTeam');
    const awaySelect = document.getElementById('matchAwayTeam');
    const prizeTeamSelect = document.getElementById('prizeTeamId');
    const html = allTeams.map(function(t) { return '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>'; }).join('');
    if (homeSelect) homeSelect.innerHTML = html;
    if (awaySelect) awaySelect.innerHTML = html;
    if (prizeTeamSelect) prizeTeamSelect.innerHTML = html;
}

function togglePrizeRecipient() {
    const type = document.getElementById('prizeRecipientType').value;
    document.getElementById('prizeTeamGroup').style.display = (type === 'team') ? 'block' : 'none';
    document.getElementById('prizePlayerGroup').style.display = (type === 'player') ? 'block' : 'none';
}

// ═══════════════════════════════════════════════════════════
// 24. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 25. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();
    initOngletCommunaute();   // CHANTIER 18
    document.getElementById('creerPhaseFinaleBtn')?.addEventListener('click', preparerLaPhaseFinale);   // CHANTIER 19

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournament();

    document.getElementById('editTournamentBtn')?.addEventListener('click', openEditTournamentModal);
    document.getElementById('editTournamentForm')?.addEventListener('submit', saveTournamentChanges);

    document.getElementById('editLogoDropArea')?.addEventListener('click', function() { document.getElementById('editLogoFile').click(); });
    document.getElementById('editLogoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        editLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('editLogoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });
    document.getElementById('editBannerDropArea')?.addEventListener('click', function() { document.getElementById('editBannerFile').click(); });
    document.getElementById('editBannerFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        editBannerFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('editBannerPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">'; };
        reader.readAsDataURL(file);
    });

    document.getElementById('addTeamBtn')?.addEventListener('click', function() { openModal('addTeamModal'); });
    document.getElementById('addTeamForm')?.addEventListener('submit', addTeam);

    document.getElementById('teamLogoDropArea')?.addEventListener('click', function() {
        document.getElementById('teamLogoFile').click();
    });
    document.getElementById('teamLogoFile')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        selectedTeamLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('teamLogoPreview').innerHTML = '<img src="' + ev.target.result + '" alt="Aperçu">';
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('addMatchBtn')?.addEventListener('click', async function() {
        await loadTeamOptions();
        openModal('addMatchModal');
    });
    document.getElementById('addMatchForm')?.addEventListener('submit', addMatch);
    document.getElementById('recordResultForm')?.addEventListener('submit', saveMatchResult);
    document.getElementById('editMatchForm')?.addEventListener('submit', enregistrerEditionMatch);

    document.getElementById('saveFormatBtn')?.addEventListener('click', saveFormat);

    // --- Chantier 02 : tirage des groupes et generation du calendrier
    document.getElementById('tirerGroupesBtn')?.addEventListener('click', tirerLesGroupes);
    document.getElementById('tirageMode')?.addEventListener('change', function() {
        const champ = document.getElementById('tirageChapeauxChamp');
        if (champ) champ.style.display = this.value === 'chapeaux' ? 'flex' : 'none';
    });
    document.getElementById('genererCalendrierBtn')?.addEventListener('click', preparerGeneration);
    document.getElementById('cloturerBtn')?.addEventListener('click', preparerLaCloture);
    document.getElementById('avancerTableauBtn')?.addEventListener('click', async function() {
        showLoader();
        await fairePropagerLeTableau({ silencieux: false });
        hideLoader();
        await loadMatches();
    });
    document.getElementById('recalculerClassementBtn')?.addEventListener('click', recalculerLeClassement);
    document.getElementById('recalculerStatsBtn')?.addEventListener('click', recalculerLesStatistiques);
    document.getElementById('payEnregistrerReglages')?.addEventListener('click', enregistrerLesReglagesDePaiement);
    document.getElementById('payFiltre')?.addEventListener('change', rendreLesDemandes);
    document.getElementById('statsTriSelect')?.addEventListener('change', rendreLesStatistiquesDuTournoi);

    // --- Chantier 04 : designation des officiels
    remplirPostesOfficiels();
    remplirPorteesOfficiels();
    chargerOfficiels();
    document.getElementById('offDesignerBtn')?.addEventListener('click', designerOfficiel);
    let minuteurRecherche;
    document.getElementById('offRecherche')?.addEventListener('input', function() {
        clearTimeout(minuteurRecherche);
        const terme = this.value.trim();
        minuteurRecherche = setTimeout(function() { rechercherComptes(terme); }, 350);
    });
    document.getElementById('confirmerGenerationBtn')?.addEventListener('click', confirmerGeneration);
    document.querySelectorAll('[data-modal="genererCalendrierModal"]').forEach(function(element) {
        element.addEventListener('click', function() { closeModal('genererCalendrierModal'); });
    });
    // Les anciens boutons radio formatType et la fonction
    // updateFormatSettingsVisibility ont disparu avec le passage a
    // l'editeur gt-formats.js : l'ecouteur qui les visait est
    // retire ici, il aurait leve une ReferenceError au chargement.

    document.getElementById('addPrizeBtn')?.addEventListener('click', async function() {
        await loadTeamOptions();
        openModal('addPrizeModal');
    });
    document.getElementById('addPrizeForm')?.addEventListener('submit', addPrize);
    document.getElementById('prizeRecipientType')?.addEventListener('change', togglePrizeRecipient);

    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
    });

    window.approveRegistration = approveRegistration;
    window.rejectRegistration = rejectRegistration;
    window.deleteTeam = deleteTeam;
    window.deleteMatch = deleteMatch;
});
