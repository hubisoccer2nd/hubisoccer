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
const TBL_PROFILES              = 'supabaseAuthPrive_profiles';
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
        .select('*, sport:' + TBL_SPORTS + '(name), type:' + TBL_TYPES + '(name, label)')
        .eq('id', currentTournamentId)
        .single();
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
// chaque tournoi, ne touche jamais aux equipes/joueurs existants.
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

    hideLoader();
    closeModal('genererCalendrierModal');
    calendrierPropose = null;
    showToast(inseres + ' rencontre(s) générées.', 'success');
    await loadMatches();
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
// que la vraie structure lie de vrais comptes joueurs (user_id,
// poste, capitanat, recherche par nom). Garder les deux aurait
// laisse deux facons contradictoires de gerer un effectif.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 16. ONGLET MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches() {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*, team_a:' + TBL_TEAMS + '!team_a_id(name), team_b:' + TBL_TEAMS + '!team_b_id(name)')
        .eq('tournament_id', currentTournamentId)
        .order('match_date', { ascending: true });
    if (error) { console.error('Erreur chargement matchs:', error.message); return; }
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
    } else {
        showToast('Résultat enregistré !', 'success');
        closeModal('recordResultModal');
        loadMatches();
    }
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
// 19. ONGLET PRIMES
// ═══════════════════════════════════════════════════════════
async function loadPrizes() {
    const { data, error } = await supabaseClient
        .from(TBL_PRIZES)
        .select('*, team:' + TBL_TEAMS + '!team_id(name)')
        .eq('tournament_id', currentTournamentId)
        .order('created_at', { ascending: false });
    if (error) { console.error('Erreur chargement primes:', error.message); return; }
    renderPrizes(data || []);
}

function renderPrizes(prizes) {
    const container = document.getElementById('prizesList');
    if (!container) return;
    if (!prizes.length) { container.innerHTML = '<p class="empty-hint">Aucune prime enregistrée.</p>'; return; }
    container.innerHTML = prizes.map(function(p) {
        const recipient = p.recipient_type === 'team'
            ? (p.team ? escapeHtml(p.team.name) : 'Équipe')
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
            .select('*, sport:' + TBL_SPORTS + '(name), type:' + TBL_TYPES + '(name, label)')
            .eq('id', currentTournamentId)
            .single();
        if (data) {
            currentTournament = data;
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

    document.getElementById('saveFormatBtn')?.addEventListener('click', saveFormat);

    // --- Chantier 02 : tirage des groupes et generation du calendrier
    document.getElementById('tirerGroupesBtn')?.addEventListener('click', tirerLesGroupes);
    document.getElementById('tirageMode')?.addEventListener('change', function() {
        const champ = document.getElementById('tirageChapeauxChamp');
        if (champ) champ.style.display = this.value === 'chapeaux' ? 'flex' : 'none';
    });
    document.getElementById('genererCalendrierBtn')?.addEventListener('click', preparerGeneration);
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
