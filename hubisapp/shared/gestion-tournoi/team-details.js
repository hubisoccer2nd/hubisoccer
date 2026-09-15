/* ============================================================
   HubISoccer — team-details.js
   Système Gestion Tournois — Détails d'une équipe
   ------------------------------------------------------------
   Corrections appliquees :
   - Tables migrees vers supabaseAuthPrive_gt_*.
   - Le controle de permission (bouton d'ajout visible
     seulement pour le proprietaire) comparait a team.creator_id
     -- un champ que mon propre addTeam() (manage-tournament.js)
     n'ecrit jamais. Remplace par tournament.created_by, le meme
     modele de permission utilise partout ailleurs sur ce systeme.
   - teamData.sport n'existe pas sur la table equipes (le sport
     vit sur le tournoi) -- affichait toujours "Non specifie".
     Corrige : recupere via le tournoi de l'equipe.
   - Jointure matchs -> tournois convertie en deux requetes
     separees, meme principe applique partout depuis l'incident
     sur manage-tournament (ne plus dependre d'une relation non
     verifiee, meme quand elle semble plausible).
   - La logique d'effectif (recherche par vrai compte utilisateur,
     deux requetes separees deja) etait deja correcte et deja
     sure -- conservee telle quelle.
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
const TBL_TEAMS           = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS      = 'supabaseAuthPrive_gt_team_players';
const TBL_TOURNAMENTS         = 'supabaseAuthPrive_gt_tournaments';
const TBL_SPORTS                = 'supabaseAuthPrive_gt_sports';
const TBL_MATCHES                  = 'supabaseAuthPrive_gt_matches';
const TBL_STANDINGS                   = 'supabaseAuthPrive_gt_standings';
const TBL_PROFILES                       = 'supabaseAuthPrive_profiles';

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
let teamData = null;
let teamTournament = null;
let teamId = null;
let selectedPlayerId = null;
let isTeamOwner = false;

// Chantier 08 — le nom de la discipline du tournoi auquel
// l'equipe appartient. Il est resolu une seule fois, dans
// loadTeamDetails(), AVANT que le moindre libelle ne soit
// ecrit : tout ce qui parle du pratiquant passe par lui.
// Vide, le lexique repond « sportif » — jamais « joueur ».
let nomSportTournoi = '';

// Le mot juste, dans un gabarit : mot('Aucun {sportif} trouvé').
function mot(gabarit) {
    if (!window.GTLexique) return gabarit;
    return GTLexique.remplir(gabarit, nomSportTournoi);
}

// Retranscrit les libelles marques data-lex* de la page.
function appliquerLexique() {
    if (window.GTLexique) GTLexique.appliquer(nomSportTournoi);
}

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
// 11. RÉCUPÉRATION DE L'ID DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
function getTeamIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES DÉTAILS DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamDetails() {
    if (!teamId) {
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'equipe',
            parametre: 'id',
            icone: 'fa-users-cog',
            titre: 'Quelle équipe voulez-vous consulter ?',
            aide: 'Choisissez d\'abord le tournoi, puis l\'équipe.',
            messageVide: 'Aucun tournoi disponible pour le moment.'
        });
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('id', teamId)
        .single();

    if (error || !data) {
        hideLoader();
        showToast('Équipe introuvable', 'error');
        return;
    }
    teamData = data;

    // Tournoi de l'equipe -- requete separee (donne le sport ET
    // sert de base au controle de permission)
    if (teamData.tournament_id) {
        const { data: tournament } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('id, name, created_by, sport_id')
            .eq('id', teamData.tournament_id)
            .maybeSingle();
        teamTournament = tournament || null;

        if (teamTournament && teamTournament.sport_id) {
            const { data: sport } = await supabaseClient
                .from(TBL_SPORTS)
                .select('name')
                .eq('id', teamTournament.sport_id)
                .maybeSingle();
            nomSportTournoi = sport ? (sport.name || '') : '';
            document.getElementById('teamSport').textContent = sport ? sport.name : 'Non spécifié';
        } else {
            document.getElementById('teamSport').textContent = 'Non spécifié';
        }
    } else {
        document.getElementById('teamSport').textContent = 'Non spécifié';
    }

    hideLoader();

    // Chantier 08 — la discipline est connue : les libelles de la
    // page prennent son vocabulaire. Appele ici, donc avant
    // loadTeamPlayers(), pour que rien ne s'affiche deux fois.
    appliquerLexique();

    document.getElementById('teamName').textContent = teamData.name || 'Équipe sans nom';
    document.getElementById('teamCategory').textContent = teamData.age_category || 'Non spécifiée';
    document.getElementById('teamCreated').textContent = teamData.created_at
        ? new Date(teamData.created_at).toLocaleDateString('fr-FR')
        : '—';

    // Createur de l'equipe -- affiche l'organisateur du tournoi
    // (le champ team.creator_id n'est jamais renseigne par
    // manage-tournament.js, le vrai proprietaire est l'organisateur
    // du tournoi auquel l'equipe appartient)
    if (teamTournament && teamTournament.created_by) {
        const { data: creator } = await supabaseClient
            .from(TBL_PROFILES)
            .select('full_name')
            .eq('auth_uuid', teamTournament.created_by)
            .maybeSingle();
        document.getElementById('teamCreator').textContent = creator?.full_name || 'Inconnu';
    } else {
        document.getElementById('teamCreator').textContent = 'Inconnu';
    }

    const logoDiv = document.getElementById('teamLogo');
    logoDiv.innerHTML = teamData.logo_url
        ? '<img src="' + teamData.logo_url + '" alt="Logo de l\'équipe">'
        : '<i class="fas fa-users"></i>';

    // Le bouton d'ajout est visible uniquement pour l'organisateur
    // du tournoi (meme modele de permission que Gerer un tournoi)
    isTeamOwner = !!(teamTournament && teamTournament.created_by === currentUser.id);
    document.getElementById('addPlayerBtn').style.display = isTeamOwner ? 'inline-flex' : 'none';

    await loadTeamPlayers();
    await loadTournamentsForStats();
}

// ═══════════════════════════════════════════════════════════
// 13. CHARGEMENT DE L'EFFECTIF DE L'ÉQUIPE
// ═══════════════════════════════════════════════════════════
async function loadTeamPlayers() {
    if (!teamData) return;

    const { data: playersData, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('id, user_id, jersey_number, position, is_captain')
        .eq('team_id', teamData.id);

    if (error) {
        console.error('Erreur chargement effectif:', error.message);
        document.getElementById('playersList').innerHTML =
            '<p class="empty-hint">' + escapeHtml(mot('Erreur de chargement des {pluriel}.')) + '</p>';
        return;
    }

    if (!playersData || playersData.length === 0) {
        document.getElementById('playersList').innerHTML =
            '<p class="empty-hint">' + escapeHtml(mot('Aucun {sportif} dans l\'effectif.')) + '</p>';
        return;
    }

    const userIds = playersData.map(function(p) { return p.user_id; });
    const { data: profilesData } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .in('auth_uuid', userIds);

    const profileMap = {};
    (profilesData || []).forEach(function(profile) { profileMap[profile.auth_uuid] = profile; });

    const playersListDiv = document.getElementById('playersList');
    playersListDiv.innerHTML = '';

    playersData.forEach(function(player) {
        const profile = profileMap[player.user_id] || {};
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-info">' +
                '<div class="player-name">' + escapeHtml(profile.full_name || mot('{Sportif} inconnu')) + '</div>' +
                '<div class="player-details">' +
                    (player.jersey_number ? '<span class="jersey">#' + escapeHtml(String(player.jersey_number)) + '</span>' : '') +
                    (player.position ? '<span class="position">' + escapeHtml(player.position) + '</span>' : '') +
                    (player.is_captain ? '<span class="captain"><i class="fas fa-star"></i> Capitaine</span>' : '') +
                '</div>' +
            '</div>' +
            (isTeamOwner ? '<button class="btn-remove-player" data-player-id="' + player.id + '"><i class="fas fa-trash"></i></button>' : '');
        playersListDiv.appendChild(playerDiv);
    });

    if (isTeamOwner) {
        document.querySelectorAll('.btn-remove-player').forEach(function(btn) {
            btn.addEventListener('click', function() { removePlayerFromTeam(btn.dataset.playerId); });
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 14. RECHERCHE D'UN SPORTIF POUR AJOUT
// ═══════════════════════════════════════════════════════════
async function searchPlayers(query) {
    if (!query || query.length < 2) {
        document.getElementById('playerSearchResults').innerHTML = '';
        return;
    }

    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, full_name, avatar_url')
        .ilike('full_name', '%' + query + '%')
        .limit(10);

    if (error) { console.error('Erreur recherche:', error.message); return; }

    const resultsDiv = document.getElementById('playerSearchResults');
    resultsDiv.innerHTML = '';

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p class="empty-hint">' + escapeHtml(mot('Aucun {sportif} trouvé.')) + '</p>';
        return;
    }

    data.forEach(function(profile) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML =
            '<div class="player-avatar">' +
                (profile.avatar_url
                    ? '<img src="' + profile.avatar_url + '" alt="Avatar">'
                    : '<div class="avatar-initials-small">' + getInitials(profile.full_name || 'J') + '</div>') +
            '</div>' +
            '<div class="player-name">' + escapeHtml(profile.full_name || mot('{Sportif} inconnu')) + '</div>';
        item.addEventListener('click', function() {
            selectedPlayerId = profile.auth_uuid;
            document.getElementById('playerSearch').value = profile.full_name || '';
            resultsDiv.innerHTML = '';
            showToast(mot('{Sportif} sélectionné : ') + profile.full_name, 'success');
        });
        resultsDiv.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════
// 15. AJOUT / SUPPRESSION D'UN SPORTIF
// ═══════════════════════════════════════════════════════════
async function addPlayerToTeam(event) {
    event.preventDefault();

    if (!selectedPlayerId) { showToast(mot('Veuillez rechercher et sélectionner un {sportif}.'), 'warning'); return; }
    if (!teamData) return;

    const jersey = document.getElementById('playerJersey').value.trim();
    const position = document.getElementById('playerPosition').value.trim();
    const isCaptain = document.getElementById('playerIsCaptain').checked;

    showLoader();
    const { error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .insert([{
            team_id: teamData.id,
            user_id: selectedPlayerId,
            jersey_number: jersey || null,
            position: position || null,
            is_captain: isCaptain || false
        }]);
    hideLoader();

    if (error) {
        showToast(mot('Erreur lors de l\'ajout du {sportif} (peut-être déjà dans l\'{collectif}).'), 'error');
        return;
    }

    showToast(mot('{Sportif} ajouté avec succès'), 'success');
    closeAddPlayerModal();
    await loadTeamPlayers();
}

async function removePlayerFromTeam(playerId) {
    if (!confirm(mot('Retirer ce {sportif} de l\'{collectif} ?'))) return;
    showLoader();
    const { error } = await supabaseClient.from(TBL_TEAM_PLAYERS).delete().eq('id', playerId);
    hideLoader();
    if (error) { showToast('Erreur lors de la suppression', 'error'); return; }
    showToast(mot('{Sportif} retiré de l\'{collectif}'), 'info');
    await loadTeamPlayers();
}

// ═══════════════════════════════════════════════════════════
// 16. MODALE D'AJOUT D'UN SPORTIF
// ═══════════════════════════════════════════════════════════
function openAddPlayerModal() {
    document.getElementById('addPlayerForm').reset();
    document.getElementById('playerSearch').value = '';
    document.getElementById('playerSearchResults').innerHTML = '';
    selectedPlayerId = null;
    document.getElementById('addPlayerModal').style.display = 'flex';
}
function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 17. ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');

            // Le terrain se dessine a la premiere ouverture de
            // l'onglet : inutile de le calculer pour quelqu'un
            // qui ne le regardera pas.
            if (tabId === 'composition' && !this.dataset.charge) {
                this.dataset.charge = '1';
                chargerLaCompositionDeLEquipe();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 17 bis. LA COMPOSITION, EN LECTURE (chantier 06)
// -----------------------------------------------------------
// Ta regle du point 20 : un visiteur d'un tournoi public VOIT
// la composition, sans pouvoir la modifier. Cet onglet lui
// montre exactement le meme terrain que « Mon equipe », avec le
// meme trace et les memes coordonnees — seul le geste manque.
// ═══════════════════════════════════════════════════════════
async function chargerLaCompositionDeLEquipe() {
    const terrain = document.getElementById('terrain');
    const places = document.getElementById('terrainPlaces');
    const etat = document.getElementById('compoEtat');
    if (!terrain || !places || !teamData) return;

    // Le sport et le terrain viennent du tournoi de l'equipe.
    let nomSport = teamData.sport_code || '';
    let tournoi = null;
    if (teamData.tournament_id) {
        const { data } = await supabaseClient
            .from(TBL_TOURNAMENTS)
            .select('name, sport_id, pitch_length_m, pitch_width_m, pitch_surface, team_format')
            .eq('id', teamData.tournament_id).maybeSingle();
        tournoi = data;
        if (tournoi && tournoi.sport_id) {
            const { data: sport } = await supabaseClient.from(TBL_SPORTS).select('name').eq('id', tournoi.sport_id).maybeSingle();
            if (sport) nomSport = sport.name;
        }
    }

    const sport = GTTerrain.sportPour(nomSport);
    const format = Number(teamData.team_format) || Number(tournoi && tournoi.team_format) || sport.formatParDefaut;

    terrain.dataset.sport = sport.code;
    terrain.dataset.format = String(format);

    let lignes = terrain.querySelector('.gt-terrain-lignes');
    if (!lignes || terrain.dataset.marquages !== sport.marquages) {
        if (lignes) lignes.remove();
        terrain.insertAdjacentHTML('afterbegin', GTTerrain.marquagesHtml(sport));
        terrain.dataset.marquages = sport.marquages;
    }

    const reperes = GTTerrain.reperes(sport, format, {
        longueur: tournoi ? tournoi.pitch_length_m : null,
        largeur: tournoi ? tournoi.pitch_width_m : null
    });
    const coteL = document.getElementById('coteLongueur');
    const coteW = document.getElementById('coteLargeur');
    if (coteL) coteL.textContent = reperes.libelleLongueur;
    if (coteW) coteW.textContent = reperes.libelleLargeur;
    const rappel = document.getElementById('terrainRappel');
    if (rappel) rappel.textContent = reperes.rappel;

    // L'effectif, avec ses coordonnees enregistrees.
    const { data: membres, error } = await supabaseClient
        .from(TBL_TEAM_PLAYERS)
        .select('*')
        .eq('team_id', teamData.id);

    if (error) {
        places.innerHTML = '';
        if (etat) etat.innerHTML = '<i class="fas fa-circle-exclamation"></i> Effectif indisponible : ' + escapeHtml(error.message);
        return;
    }

    const sportifs = (membres || []).filter(function(p) {
        return (p.member_category || 'footballeur') === 'footballeur';
    });

    if (!sportifs.length) {
        places.innerHTML = '';
        document.getElementById('bancListe').innerHTML = '';
        if (etat) etat.innerHTML = '<i class="fas fa-circle-info"></i> Aucun sportif dans l\'effectif de cette équipe.';
        return;
    }

    const idsComptes = sportifs.filter(function(p) { return p.user_id; }).map(function(p) { return p.user_id; });
    const profils = {};
    if (idsComptes.length) {
        const { data: profilsData } = await supabaseClient
            .from(TBL_PROFILES).select('auth_uuid, full_name, avatar_url').in('auth_uuid', idsComptes);
        (profilsData || []).forEach(function(x) { profils[x.auth_uuid] = x; });
    }

    function nomDe(p) {
        if (p.user_id && profils[p.user_id] && profils[p.user_id].full_name) return profils[p.user_id].full_name;
        return p.member_name || 'Sportif';
    }
    function photoDe(p) {
        if (p.user_id && profils[p.user_id] && profils[p.user_id].avatar_url) return profils[p.user_id].avatar_url;
        return p.member_photo_url || null;
    }

    // Les titulaires deja places gardent leurs coordonnees ; les
    // titulaires sans coordonnees sont repartis dans la
    // formation enregistree par l'equipe.
    const titulaires = sportifs.filter(function(p) { return p.is_starting; });
    const poses = titulaires.filter(function(p) { return p.pos_x != null && p.pos_y != null; });
    const aPlacer = titulaires.filter(function(p) { return p.pos_x == null || p.pos_y == null; });

    let formation = teamData.default_formation;
    if (poses.length) {
        const deduite = GTTerrain.deduireFormation(poses.map(function(p) {
            return { x: Number(p.pos_x), y: Number(p.pos_y) };
        }), sport);
        if (deduite && deduite.connue) formation = deduite.code;
    }
    if (!formation) formation = GTTerrain.formationParDefaut(sport, format);

    const emplacements = GTTerrain.placer(formation, sport);
    const prisPar = {};
    poses.forEach(function(p) { if (p.slot_key) prisPar[p.slot_key] = true; });

    let html = '';
    poses.forEach(function(p) {
        html += placeLectureHtml(p, Number(p.pos_x), Number(p.pos_y), nomDe(p), photoDe(p));
    });

    let reste = aPlacer.slice();
    emplacements.forEach(function(place) {
        if (prisPar[place.cle]) return;
        if (!reste.length) return;
        const p = reste.shift();
        html += placeLectureHtml(p, place.x, place.y, nomDe(p), photoDe(p), place.libelle);
    });

    places.innerHTML = html;

    // Le reste de l'effectif
    const banc = sportifs.filter(function(p) { return !p.is_starting; });
    document.getElementById('bancListe').innerHTML = banc.map(function(p) {
        const nom = nomDe(p), photo = photoDe(p);
        return '<div class="gt-banc-place non-modifiable">' +
               '<div class="gt-place-pastille">' +
                   (photo ? '<img src="' + escapeHtml(photo) + '" alt="">' :
                            '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>') +
                   (p.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(p.jersey_number) + '</span>' : '') +
               '</div>' +
               '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
               '<div class="gt-place-poste">' + escapeHtml(p.position_detail || p.position || '') + '</div>' +
               '</div>';
    }).join('');

    const compte = document.getElementById('bancCompte');
    if (compte) compte.textContent = titulaires.length + ' sur le terrain · ' + banc.length + ' hors composition';

    if (etat) {
        etat.innerHTML = '<i class="fas fa-circle-check"></i> Formation ' + escapeHtml(formation) +
                         ' · ' + sport.nom + ' à ' + format +
                         ' · ' + titulaires.length + ' titulaire(s). Lecture seule.';
    }
}

function placeLectureHtml(membre, x, y, nom, photo, libelleParDefaut) {
    const etats = [];
    if (membre.is_captain)  etats.push('<span class="gt-etat capitaine" title="Capitaine"><i class="fas fa-star"></i></span>');
    if (membre.is_injured)  etats.push('<span class="gt-etat blessure" title="Blessé"><i class="fas fa-kit-medical"></i></span>');
    if (membre.is_suspended) etats.push('<span class="gt-etat suspendu" title="Suspendu"><i class="fas fa-ban"></i></span>');

    const lien = membre.user_id ? 'player-stats.html?id=' + encodeURIComponent(membre.user_id) : null;
    const contenu =
        '<div class="gt-place-pastille">' +
            (photo ? '<img src="' + escapeHtml(photo) + '" alt="">' :
                     '<div class="gt-place-initiales">' + escapeHtml(getInitials(nom)) + '</div>') +
            (membre.jersey_number != null ? '<span class="gt-place-numero">' + escapeHtml(membre.jersey_number) + '</span>' : '') +
            (etats.length ? '<span class="gt-place-etats">' + etats.join('') + '</span>' : '') +
        '</div>' +
        '<div class="gt-place-nom">' + escapeHtml(nom) + '</div>' +
        '<div class="gt-place-poste">' + escapeHtml(membre.position_detail || membre.position || libelleParDefaut || '') + '</div>';

    return '<div class="gt-place non-modifiable" style="left:' + x + '%;top:' + y + '%;">' +
           (lien ? '<a href="' + lien + '" style="display:contents;">' + contenu + '</a>' : contenu) +
           '</div>';
}

// ═══════════════════════════════════════════════════════════
// 18. STATISTIQUES
// ═══════════════════════════════════════════════════════════
async function loadTournamentsForStats() {
    const { data: tournoisData, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name')
        .order('start_date', { ascending: false });

    if (error) { console.error('Erreur chargement tournois pour stats:', error.message); return; }

    const select = document.getElementById('tournamentStatsSelect');
    select.innerHTML = '<option value="">Sélectionnez un tournoi</option>';
    (tournoisData || []).forEach(function(t) {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        select.appendChild(option);
    });

    select.addEventListener('change', function() { loadTeamStats(this.value); });
}

async function loadTeamStats(tournamentId) {
    const statsDiv = document.getElementById('teamStats');
    if (!tournamentId) {
        statsDiv.innerHTML = '<p class="empty-hint">Veuillez sélectionner un tournoi.</p>';
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_STANDINGS)
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamData.id)
        .maybeSingle();
    hideLoader();

    if (error || !data) {
        statsDiv.innerHTML = '<p class="empty-hint">Aucune statistique pour ce tournoi.</p>';
        return;
    }

    statsDiv.innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-box"><span class="stat-label">MJ</span><span class="stat-value tabular">' + (data.played || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">V</span><span class="stat-value tabular">' + (data.wins || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">N</span><span class="stat-value tabular">' + (data.draws || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">D</span><span class="stat-value tabular">' + (data.losses || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">BP</span><span class="stat-value tabular">' + (data.goals_for || 0) + '</span></div>' +
        '<div class="stat-box"><span class="stat-label">BC</span><span class="stat-value tabular">' + (data.goals_against || 0) + '</span></div>' +
        '<div class="stat-box highlight"><span class="stat-label">Pts</span><span class="stat-value tabular">' + (data.points || 0) + '</span></div>' +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 19. MATCHS (deux requetes separees, pas de jointure imbriquee)
// ═══════════════════════════════════════════════════════════
async function loadTeamMatches() {
    if (!teamData) return;

    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, round, team_a_id, team_b_id, score_a, score_b, match_date, status, tournament_id')
        .or('team_a_id.eq.' + teamData.id + ',team_b_id.eq.' + teamData.id)
        .order('match_date', { ascending: false });

    const matchesDiv = document.getElementById('teamMatchesList');
    if (error) {
        matchesDiv.innerHTML = '<p class="empty-hint">Erreur de chargement des matchs.</p>';
        console.error(error.message);
        return;
    }
    if (!data || data.length === 0) {
        matchesDiv.innerHTML = '<p class="empty-hint">Aucun match trouvé.</p>';
        return;
    }

    // Noms d'equipes -- requete separee
    const teamIds = new Set();
    data.forEach(function(m) { if (m.team_a_id) teamIds.add(m.team_a_id); if (m.team_b_id) teamIds.add(m.team_b_id); });
    const { data: teamsData } = await supabaseClient.from(TBL_TEAMS).select('id, name').in('id', Array.from(teamIds));
    const teamNameMap = {};
    (teamsData || []).forEach(function(t) { teamNameMap[t.id] = t.name; });

    // Noms de tournois -- requete separee (remplace la jointure imbriquee)
    const tournamentIds = [...new Set(data.map(function(m) { return m.tournament_id; }).filter(Boolean))];
    let tournamentNameMap = {};
    if (tournamentIds.length) {
        const { data: tournamentsData } = await supabaseClient.from(TBL_TOURNAMENTS).select('id, name').in('id', tournamentIds);
        (tournamentsData || []).forEach(function(t) { tournamentNameMap[t.id] = t.name; });
    }

    matchesDiv.innerHTML = '';
    data.forEach(function(match) {
        const teamAName = teamNameMap[match.team_a_id] || 'Équipe A';
        const teamBName = teamNameMap[match.team_b_id] || 'Équipe B';
        const tournamentName = tournamentNameMap[match.tournament_id] || '';
        const dateStr = match.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML =
            '<div class="match-header">' +
                '<span class="match-round">' + escapeHtml(match.round || '') + '</span>' +
                '<span class="match-date">' + dateStr + '</span>' +
            '</div>' +
            '<div class="match-teams">' +
                '<span class="team-a">' + escapeHtml(teamAName) + '</span>' +
                '<span class="match-score tabular">' + (match.score_a ?? 0) + ' - ' + (match.score_b ?? 0) + '</span>' +
                '<span class="team-b">' + escapeHtml(teamBName) + '</span>' +
            '</div>' +
            '<div class="match-footer">' +
                '<span class="match-tournament">' + escapeHtml(tournamentName) + '</span>' +
                '<span class="match-status status-' + match.status + '">' + escapeHtml(match.status) + '</span>' +
            '</div>';
        matchesDiv.appendChild(matchCard);
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
    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    teamId = getTeamIdFromUrl();
    if (!teamId) {
        // loadTeamDetails() monte déjà le sélecteur ; on l'appelle
        // pour qu'il s'affiche, puis on s'arrête là.
        await loadTeamDetails();
        return;
    }

    await loadTeamDetails();
    await loadTeamMatches();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('addPlayerBtn')?.addEventListener('click', openAddPlayerModal);

    document.querySelectorAll('#addPlayerModal .close-modal, #addPlayerModal .btn-cancel').forEach(function(el) {
        el.addEventListener('click', closeAddPlayerModal);
    });
    document.getElementById('addPlayerForm')?.addEventListener('submit', addPlayerToTeam);

    const playerSearchInput = document.getElementById('playerSearch');
    if (playerSearchInput) {
        let searchTimeout;
        playerSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            searchTimeout = setTimeout(function() { searchPlayers(query); }, 400);
        });
    }
});
