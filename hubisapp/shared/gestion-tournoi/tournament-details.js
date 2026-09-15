/* ============================================================
   HubISoccer — tournament-details.js
   Système Gestion Tournois — Détails d'un tournoi (v2)
   ------------------------------------------------------------
   Reprend toutes les corrections precedentes (tables migrees,
   requetes separees au lieu de jointures imbriquees, etat en
   direct, inscription). Ajoute la presentation complete :
   - Affiche/banniere en fond de heros, logo en medaillon.
   - Nom/description/reglement rendus via DOMPurify.sanitize()
     avant toute injection dans le DOM -- jamais de contenu
     controle par l'utilisateur en innerHTML brut.
   - Video (URL YouTube/Vimeo) integree si fournie.
   - Onglet Recompenses : lit gt_tournament_awards (podium +
     categories speciales), definies a la creation.
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
const TBL_SPORTS         = 'supabaseAuthPrive_gt_sports';
const TBL_PARTICIPANTS      = 'supabaseAuthPrive_gt_participants';
const TBL_TEAMS                = 'supabaseAuthPrive_gt_teams';
const TBL_MATCHES                 = 'supabaseAuthPrive_gt_matches';
const TBL_STANDINGS                  = 'supabaseAuthPrive_gt_standings';
const TBL_AWARDS                        = 'supabaseAuthPrive_gt_tournament_awards';

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
const PARTICIPATION_LABELS = { individuel: 'Individuel', collectif: 'Collectif (par équipe)' };

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournament = null;

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
function formatDateShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

function sanitizeInto(rawHtml, targetEl) {
    targetEl.innerHTML = rawHtml ? DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['style'] }) : '';
}

function computeTimeState(t) {
    if (!t.start_date || !t.end_date) return 'unknown';
    const now = new Date();
    const start = new Date(t.start_date);
    const end = new Date(t.end_date);
    if (start > now) return 'upcoming';
    if (end < now) return 'past';
    return 'ongoing';
}

function extractVideoEmbedUrl(url) {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1];
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return 'https://player.vimeo.com/video/' + vimeoMatch[1];
    return null;
}

// ═══════════════════════════════════════════════════════════
// 8. RÉCUPÉRATION DE L'ID DU TOURNOI
// ═══════════════════════════════════════════════════════════
function getTournamentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        // Sans identifiant, on affiche le choix plutôt que de
        // renvoyer l'utilisateur de force vers l'accueil.
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'tournoi',
            parametre: 'id',
            portee: 'tousTournois',
            icone: 'fa-info-circle',
            titre: 'Quel tournoi voulez-vous consulter ?',
            aide: 'Tous les tournois publiés et terminés de la plateforme.',
            messageVide: 'Aucun tournoi publié pour le moment.'
        });
        return null;
    }
    return parseInt(id);
}

// ═══════════════════════════════════════════════════════════
// 9. SESSION (page accessible sans connexion)
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    if (!session) { currentUser = null; userProfile = null; return false; }
    currentUser = session.user;
    return true;
}

// ═══════════════════════════════════════════════════════════
// 10. CHARGEMENT DU PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    if (!currentUser) return null;
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if (error || !data) return null;
    userProfile = data;
    applyRoleTier();
    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = userProfile && GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (!userProfile) { if (profileLink) profileLink.style.display = 'none'; if (settingsLink) settingsLink.style.display = 'none'; return; }
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    if (routes) { if (profileLink) profileLink.href = routes.profile; if (settingsLink) settingsLink.href = routes.settings; }
    else { if (profileLink) profileLink.style.display = 'none'; if (settingsLink) settingsLink.style.display = 'none'; }
}

// ═══════════════════════════════════════════════════════════
// 11. MISE À JOUR DE LA NAVBAR
// ═══════════════════════════════════════════════════════════
function updateNavbarUI() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userProfile) {
        if (userName) userName.textContent = userProfile.full_name || 'Utilisateur';
        if (userProfile.avatar_url) { if (userAvatar) { userAvatar.src = userProfile.avatar_url; userAvatar.style.display = 'block'; } if (userInitials) userInitials.style.display = 'none'; }
        else { const initials = getInitials(userProfile.full_name || 'U'); if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; } if (userAvatar) userAvatar.style.display = 'none'; }
    } else {
        if (userName) userName.textContent = 'Invité';
        if (userAvatar) { userAvatar.src = ''; userAvatar.style.display = 'none'; }
        if (userInitials) { userInitials.textContent = 'I'; userInitials.style.display = 'flex'; }
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 12. CHARGEMENT DES DÉTAILS DU TOURNOI
// ═══════════════════════════════════════════════════════════
async function loadTournamentDetails(tournamentId) {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*, ' + TBL_TYPES + '(name, label), ' + TBL_SPORTS + '(name)')
        .eq('id', tournamentId)
        .single();

    hideLoader();

    if (error || !data) {
        showToast('Tournoi introuvable.', 'error');
        setTimeout(function() { window.location.href = 'acceuil.html'; }, 1500);
        return;
    }

    currentTournament = data;
    renderHero(data);

    sanitizeInto(data.description, document.getElementById('tournamentDescription'));
    document.getElementById('rulesLink').href = 'tournament-rules.html?id=' + tournamentId;

    document.getElementById('statPrize').textContent = data.prize_pool ? formatMoney(data.prize_pool) + ' FCFA' : '—';

    document.getElementById('infoParticipation').textContent = PARTICIPATION_LABELS[data.participation_type] || 'Non précisé';
    document.getElementById('infoPrice').textContent = data.participation_price ? formatMoney(data.participation_price) + ' FCFA' : 'Gratuit';
    document.getElementById('infoStarters').textContent = data.max_starters || '—';
    document.getElementById('infoStaff').textContent = data.max_staff || '—';

    const embedUrl = extractVideoEmbedUrl(data.video_url);
    if (embedUrl) {
        document.getElementById('videoSection').style.display = 'block';
        document.getElementById('videoEmbed').innerHTML = '<iframe src="' + embedUrl + '" frameborder="0" allowfullscreen></iframe>';
    }

    await renderRegistrationBlock(tournamentId);
    await loadTeams(tournamentId);
    await loadMatches(tournamentId);
    await loadStandings(tournamentId);
    await loadBracket(tournamentId);
    await loadAwards(tournamentId);
}

// ═══════════════════════════════════════════════════════════
// 13. RENDU DU HÉROS (affiche en fond, logo en médaillon)
// ═══════════════════════════════════════════════════════════
function renderHero(data) {
    const hero = document.getElementById('detailHero');
    if (data.banner_url) {
        hero.style.backgroundImage = "url('" + data.banner_url + "')";
        hero.classList.add('has-banner');
    }

    const logoDiv = document.getElementById('heroLogo');
    logoDiv.innerHTML = data.logo_url ? '<img src="' + data.logo_url + '" alt="Logo">' : '<i class="fas fa-shield-alt"></i>';

    sanitizeInto(data.name, document.getElementById('tournamentName'));
    document.getElementById('tournamentType').textContent = data[TBL_TYPES] ? data[TBL_TYPES].label : 'Non précisé';
    document.getElementById('tournamentSport').textContent = data[TBL_SPORTS] ? data[TBL_SPORTS].name : 'Non précisé';
    document.getElementById('tournamentLocation').textContent = data.location || 'Non précisé';

    if (data.start_date && data.end_date) {
        document.getElementById('tournamentDates').textContent = formatDateShort(data.start_date) + ' → ' + formatDateShort(data.end_date);
    } else {
        document.getElementById('tournamentDates').textContent = 'Dates non définies';
    }

    const state = computeTimeState(data);
    const pill = document.getElementById('heroStatePill');
    if (state === 'ongoing') { pill.className = 'hero-state-pill ongoing'; pill.innerHTML = '<span class="live-dot small"></span> En cours'; }
    else if (state === 'upcoming') { pill.className = 'hero-state-pill upcoming'; pill.innerHTML = '<i class="fas fa-clock"></i> À venir'; }
    else if (state === 'past') { pill.className = 'hero-state-pill past'; pill.innerHTML = '<i class="fas fa-flag-checkered"></i> Terminé'; }
    else { pill.className = 'hero-state-pill'; pill.innerHTML = '<i class="fas fa-question-circle"></i> —'; }
}

// ═══════════════════════════════════════════════════════════
// 14. BLOC D'INSCRIPTION
// ═══════════════════════════════════════════════════════════
async function renderRegistrationBlock(tournamentId) {
    const block = document.getElementById('registrationBlock');
    const content = document.getElementById('registrationContent');
    if (!block || !content) return;
    block.style.display = 'block';

    if (!currentUser) {
        content.innerHTML = '<p class="reg-hint">Connectez-vous pour vous inscrire à ce tournoi.</p><a href="../../authprive/users/login.html" class="btn-primary"><i class="fas fa-sign-in-alt"></i> Se connecter</a>';
        return;
    }

    const { data: existing } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id, status')
        .eq('tournament_id', tournamentId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (existing) {
        const statusMap = {
            approved: { label: 'Inscription approuvée', cls: 'approved', icon: 'fa-check-circle' },
            pending:  { label: 'Inscription en attente', cls: 'pending',  icon: 'fa-hourglass-half' },
            rejected: { label: 'Inscription refusée',    cls: 'rejected', icon: 'fa-times-circle' }
        };
        const s = statusMap[existing.status] || statusMap.pending;
        content.innerHTML = '<span class="reg-status-badge ' + s.cls + '"><i class="fas ' + s.icon + '"></i> ' + s.label + '</span>';
    } else {
        content.innerHTML = '<button id="registerBtn" class="btn-primary"><i class="fas fa-check-circle"></i> S\'inscrire au tournoi</button>';
        document.getElementById('registerBtn').addEventListener('click', function() { registerForTournament(tournamentId); });
    }
}

// ═══════════════════════════════════════════════════════════
// 15. INSCRIPTION AU TOURNOI
// ═══════════════════════════════════════════════════════════
async function registerForTournament(tournamentId) {
    if (!currentUser) { showToast('Vous devez être connecté pour vous inscrire.', 'warning'); return; }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription…';

    const { error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .insert([{ tournament_id: tournamentId, user_id: currentUser.id, status: 'pending' }]);

    if (error) {
        showToast('Erreur lors de l\'inscription : ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> S\'inscrire au tournoi';
    } else {
        showToast('Inscription envoyée ! En attente de validation.', 'success');
        await renderRegistrationBlock(tournamentId);
    }
}

// ═══════════════════════════════════════════════════════════
// 16. CHARGEMENT DES ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function loadTeams(tournamentId) {
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('id, name, logo_url')
        .eq('tournament_id', tournamentId)
        .order('name');

    document.getElementById('statTeams').textContent = (!error && data) ? data.length : '—';

    const container = document.getElementById('teamsList');
    if (error || !data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shield-alt"></i><p>Aucune équipe pour le moment.</p></div>';
        return;
    }

    container.innerHTML = data.map(function(team) {
        const logo = team.logo_url ? '<img src="' + team.logo_url + '" alt="Logo" class="team-logo">' : '<div class="team-logo-placeholder"><i class="fas fa-shield-alt"></i></div>';
        return '<div class="team-card">' + logo + '<span class="team-name">' + escapeHtml(team.name) + '</span></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 17. CHARGEMENT DES MATCHS
// ═══════════════════════════════════════════════════════════
async function loadMatches(tournamentId) {
    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, round, team_a_id, team_b_id, score_a, score_b, match_date, status, team_a:' + TBL_TEAMS + '!team_a_id(name), team_b:' + TBL_TEAMS + '!team_b_id(name)')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true });

    document.getElementById('statMatches').textContent = (!error && data) ? data.filter(function(m) { return m.status === 'completed'; }).length + ' / ' + data.length : '—';

    const container = document.getElementById('matchesList');
    if (error || !data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Aucun match programmé pour le moment.</p></div>';
        return;
    }

    container.innerHTML = data.map(function(match) {
        const date = match.match_date ? new Date(match.match_date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date à définir';
        const isLive = match.status === 'live';
        const isDone = match.status === 'completed';
        const score = isDone ? (match.score_a ?? 0) + ' - ' + (match.score_b ?? 0) : 'vs';
        const badge = isLive ? '<span class="match-live-badge"><span class="live-dot small"></span> Live</span>' : isDone ? '<span class="match-status-badge done">Terminé</span>' : '<span class="match-status-badge scheduled">' + date + '</span>';
        return '<div class="match-card">' +
               '<div class="match-round">' + escapeHtml(match.round || 'Match') + '</div>' +
               '<div class="match-teams-row">' +
               '<span class="match-team-name">' + (match.team_a ? escapeHtml(match.team_a.name) : 'Équipe A') + '</span>' +
               '<span class="match-score tabular">' + score + '</span>' +
               '<span class="match-team-name">' + (match.team_b ? escapeHtml(match.team_b.name) : 'Équipe B') + '</span>' +
               '</div>' + badge + '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// TABLEAU À ÉLIMINATION DIRECTE (chantier 02)
// Le rendu vit dans gt-bracket.js. Ici on ne fait que charger les
// rencontres et les noms d'équipes, en requêtes séparées.
// ═══════════════════════════════════════════════════════════
async function loadBracket(tournamentId) {
    const zone = document.getElementById('bracketZone');
    if (!zone) return;

    const { data: matchs, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('id, round, bracket_position, leg, is_bye, team_a_id, team_b_id, score_a, score_b, status, match_date')
        .eq('tournament_id', tournamentId)
        .not('bracket_position', 'is', null)
        .order('bracket_position', { ascending: true });

    if (error) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-sitemap"></i><p>Tableau indisponible pour le moment.</p></div>';
        console.warn('Chargement du tableau :', error.message);
        return;
    }

    if (!matchs || !matchs.length) {
        GTBracket.dessiner({ conteneur: 'bracketZone', matchs: [], equipes: {} });
        return;
    }

    const identifiants = [];
    matchs.forEach(function(m) {
        if (m.team_a_id && identifiants.indexOf(m.team_a_id) === -1) identifiants.push(m.team_a_id);
        if (m.team_b_id && identifiants.indexOf(m.team_b_id) === -1) identifiants.push(m.team_b_id);
    });

    const noms = {}, logos = {};
    if (identifiants.length) {
        const { data: equipes } = await supabaseClient
            .from(TBL_TEAMS).select('id, name, logo_url').in('id', identifiants);
        (equipes || []).forEach(function(e) {
            noms[e.id] = e.name;
            if (e.logo_url) logos[e.id] = e.logo_url;
        });
    }

    GTBracket.dessiner({
        conteneur: 'bracketZone',
        matchs: matchs,
        equipes: noms,
        logos: logos,
        surClic: function(idMatch) { window.location.href = 'match-details.html?id=' + idMatch; }
    });
}

// ═══════════════════════════════════════════════════════════
// 18. CHARGEMENT DU CLASSEMENT
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// CHANTIER 11 — LE CLASSEMENT SUIT LE FORMAT DU TOURNOI
// ------------------------------------------------------------
// CE QUI N'ALLAIT PAS
//
// Cette page affichait TOUJOURS une liste plate, triee par
// points — comme un championnat. Meme quand l'organisateur avait
// choisi « poules + elimination directe », c'est-a-dire le
// format d'une Coupe du monde ou d'une CAN.
//
// Le visiteur voyait donc 24 equipes a la suite, sans groupes,
// sans savoir qui se qualifiait. La page de l'organisateur, elle,
// affichait bien les poules — parce qu'elle recalcule tout en
// memoire. Le visiteur, lui, LIT gt_standings, ou le groupe
// n'etait pas enregistre.
//
// CE QUE CA FAIT MAINTENANT
//
//   - un tournoi a poules : un tableau PAR GROUPE, l'un sous
//     l'autre, avec les places qualificatives en couleur
//   - le classement des meilleurs troisiemes quand le format les
//     repeche, comme au Mondial 2026
//   - un rappel de qui est qualifie, et un lien vers le tableau
//     a elimination directe qui existe deja sur cette page
//   - un championnat garde sa liste unique : rien ne change pour
//     lui
// ═══════════════════════════════════════════════════════════

function configurationDuFormat(t) {
    // format_config porte les reglages saisis par l'organisateur.
    // Les colonnes dediees, quand elles existent, font foi.
    let cfg = {};
    if (t && t.format_config) {
        try { cfg = typeof t.format_config === 'string' ? JSON.parse(t.format_config) : t.format_config; }
        catch (e) { cfg = {}; }
    }
    return {
        aDesGroupes: (t && t.format_type === 'groups_knockout') ||
                     Number(cfg.groupes || 0) > 1,
        qualifiesParGroupe: Number(
            (t && t.qualifiers_per_group) != null ? t.qualifiers_per_group : (cfg.qualifiesParGroupe || 2)),
        meilleursTroisiemes: Number(
            (t && t.best_third_place_count) != null ? t.best_third_place_count : (cfg.meilleursTroisiemes || 0)),
        aUnTableau: !!(t && (t.format_type === 'groups_knockout' ||
                             t.format_type === 'knockout' ||
                             (t.format_family || '').indexOf('coupe') === 0))
    };
}

function lignesDuClassement(lignes, qualifies, repechesPossibles) {
    return lignes.map(function(row, index) {
        const rang = index + 1;
        // La bande de couleur dit d'un coup d'oeil qui passe.
        let zone = '';
        if (qualifies > 0 && rang <= qualifies) zone = 'zone-qualifie';
        else if (repechesPossibles && rang === qualifies + 1) zone = 'zone-repechable';
        else if (!qualifies && rang === 1) zone = 'zone-first';
        else if (!qualifies && rang <= 3) zone = 'zone-podium';

        return '<tr class="' + zone + '">' +
            '<td class="col-rank tabular">' + rang + '</td>' +
            '<td class="col-team">' + (row.team ? escapeHtml(row.team.name) : '—') + '</td>' +
            '<td class="tabular">' + (row.played || 0) + '</td>' +
            '<td class="tabular">' + (row.wins || 0) + '</td>' +
            '<td class="tabular">' + (row.draws || 0) + '</td>' +
            '<td class="tabular">' + (row.losses || 0) + '</td>' +
            '<td class="tabular">' + (row.goals_for || 0) + '</td>' +
            '<td class="tabular">' + (row.goals_against || 0) + '</td>' +
            '<td class="tabular">' + ((row.goals_for || 0) - (row.goals_against || 0)) + '</td>' +
            '<td class="col-pts tabular"><strong>' + (row.points || 0) + '</strong></td></tr>';
    }).join('');
}

function tableClassement(lignes, qualifies, repechesPossibles) {
    return '<div class="tw-classement"><table class="standings-table">' +
        '<thead><tr><th class="col-rank">#</th><th class="col-team">Équipe</th>' +
        '<th title="Joués">J</th><th title="Victoires">V</th><th title="Nuls">N</th>' +
        '<th title="Défaites">D</th><th title="Buts pour">BP</th><th title="Buts contre">BC</th>' +
        '<th title="Différence de buts">DIFF</th><th class="col-pts">Pts</th></tr></thead>' +
        '<tbody>' + lignesDuClassement(lignes, qualifies, repechesPossibles) + '</tbody>' +
        '</table></div>';
}

async function loadStandings(tournamentId) {
    const container = document.getElementById('standingsList');

    // group_name vient du chantier 11. Sur une base ou le script
    // n'a pas encore ete passe, la colonne n'existe pas et
    // PostgREST refuse la requete entiere : on retombe alors sur
    // la lecture d'avant, sans groupes. La page marche dans les
    // deux cas.
    const colonnes = 'id, group_name, played, wins, draws, losses, goals_for, goals_against, points, ' +
                     'team:' + TBL_TEAMS + '!team_id(name)';
    let { data, error } = await supabaseClient
        .from(TBL_STANDINGS)
        .select(colonnes)
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });

    if (error) {
        const repli = await supabaseClient
            .from(TBL_STANDINGS)
            .select('id, played, wins, draws, losses, goals_for, goals_against, points, ' +
                    'team:' + TBL_TEAMS + '!team_id(name)')
            .eq('tournament_id', tournamentId)
            .order('points', { ascending: false })
            .order('goals_for', { ascending: false });
        data = repli.data;
        error = repli.error;
    }

    if (error || !data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i>' +
            '<p>Aucun classement disponible pour le moment.</p>' +
            '<p class="empty-hint">Le classement apparaît dès que l\'organisateur l\'a calculé, ' +
            'après les premiers résultats.</p></div>';
        return;
    }

    const cfg = configurationDuFormat(currentTournament);

    // Les groupes reellement presents dans les donnees. On ne se
    // fie pas au seul reglage : un tournoi peut avoir ete
    // configure en poules sans que les equipes y soient encore
    // reparties.
    const groupes = {};
    let sansGroupe = 0;
    data.forEach(function(l) {
        const g = (l.group_name || '').trim();
        if (!g) { sansGroupe++; return; }
        (groupes[g] = groupes[g] || []).push(l);
    });
    const nomsGroupes = Object.keys(groupes).sort();

    // ── Cas 1 : un championnat, ou des poules pas encore
    //    reparties. Une seule liste, comme avant.
    if (!nomsGroupes.length) {
        let entete = '';
        if (cfg.aDesGroupes) {
            entete = '<p class="empty-hint" style="margin-bottom:12px;">' +
                '<i class="fas fa-circle-info"></i> Ce tournoi se joue en poules, mais les équipes ' +
                'n\'y sont pas encore réparties — ou le classement date d\'avant la répartition. ' +
                'Il s\'affichera groupe par groupe dès le prochain recalcul par l\'organisateur.</p>';
        }
        container.innerHTML = entete + tableClassement(data, 0, false);
        return;
    }

    // ── Cas 2 : des poules. Un tableau par groupe.
    let html = '';
    const qualifies = cfg.qualifiesParGroupe;
    const repeche = cfg.meilleursTroisiemes > 0;
    const qualifiesDirects = [];

    nomsGroupes.forEach(function(nom) {
        const lignes = groupes[nom];
        html += '<h3 class="classement-groupe"><i class="fas fa-layer-group"></i> ' +
                escapeHtml(nom) + '</h3>' +
                tableClassement(lignes, qualifies, repeche);
        lignes.slice(0, qualifies).forEach(function(l) {
            if (l.team) qualifiesDirects.push({ nom: l.team.name, groupe: nom });
        });
    });

    // ── Les meilleurs troisiemes, quand le format les repeche.
    if (repeche) {
        const rangRepeche = qualifies + 1;
        const troisiemes = nomsGroupes
            .map(function(nom) {
                const l = groupes[nom][rangRepeche - 1];
                return l ? Object.assign({}, l, { _groupe: nom }) : null;
            })
            .filter(Boolean)
            .sort(function(a, b) {
                const pa = a.points || 0, pb = b.points || 0;
                if (pb !== pa) return pb - pa;
                const da = (a.goals_for || 0) - (a.goals_against || 0);
                const db = (b.goals_for || 0) - (b.goals_against || 0);
                if (db !== da) return db - da;
                return (b.goals_for || 0) - (a.goals_for || 0);
            });

        if (troisiemes.length) {
            html += '<h3 class="classement-groupe"><i class="fas fa-life-ring"></i> ' +
                    'Meilleurs ' + rangRepeche + '<sup>es</sup> — ' +
                    cfg.meilleursTroisiemes + ' repêché' +
                    (cfg.meilleursTroisiemes > 1 ? 's' : '') + '</h3>';
            html += '<div class="tw-classement"><table class="standings-table">' +
                '<thead><tr><th class="col-rank">#</th><th class="col-team">Équipe</th>' +
                '<th>Groupe</th><th>J</th><th>Pts</th><th>DIFF</th></tr></thead><tbody>' +
                troisiemes.map(function(l, i) {
                    const passe = i < cfg.meilleursTroisiemes;
                    if (passe && l.team) qualifiesDirects.push({ nom: l.team.name, groupe: l._groupe + ' (repêché)' });
                    return '<tr class="' + (passe ? 'zone-qualifie' : '') + '">' +
                        '<td class="col-rank tabular">' + (i + 1) + '</td>' +
                        '<td class="col-team">' + (l.team ? escapeHtml(l.team.name) : '—') + '</td>' +
                        '<td>' + escapeHtml(l._groupe) + '</td>' +
                        '<td class="tabular">' + (l.played || 0) + '</td>' +
                        '<td class="tabular"><strong>' + (l.points || 0) + '</strong></td>' +
                        '<td class="tabular">' + ((l.goals_for || 0) - (l.goals_against || 0)) + '</td>' +
                        '</tr>';
                }).join('') + '</tbody></table></div>';
        }
    }

    // ── La legende : sans elle, les couleurs ne veulent rien dire.
    html += '<div class="classement-legende">' +
        '<span><i class="pastille-zone zone-qualifie"></i> Qualifié pour la phase finale</span>' +
        (repeche ? '<span><i class="pastille-zone zone-repechable"></i> Peut être repêché</span>' : '') +
        '</div>';

    // ── Qui est qualifie, et ou ca se joue ensuite.
    if (qualifiesDirects.length) {
        html += '<div class="bloc-qualifies">' +
            '<h4><i class="fas fa-trophy"></i> Qualifiés pour la phase finale</h4>' +
            '<div class="qualifies-liste">' +
                qualifiesDirects.map(function(q) {
                    return '<span class="qualifie-jeton">' + escapeHtml(q.nom) +
                           '<small>' + escapeHtml(q.groupe) + '</small></span>';
                }).join('') +
            '</div>';
        if (cfg.aUnTableau) {
            html += '<button class="btn-secondary" id="allerAuTableau">' +
                    '<i class="fas fa-sitemap"></i> Voir le tableau à élimination directe</button>';
        }
        html += '</div>';
    }

    if (sansGroupe > 0) {
        html += '<p class="empty-hint" style="margin-top:14px;"><i class="fas fa-circle-info"></i> ' +
                sansGroupe + ' équipe(s) ne sont rattachées à aucun groupe et n\'apparaissent ' +
                'dans aucun tableau ci-dessus.</p>';
    }

    container.innerHTML = html;

    // Le bouton mene a l'onglet du tableau, qui existe deja sur
    // cette page : on ne recree rien, on y conduit.
    document.getElementById('allerAuTableau')?.addEventListener('click', function() {
        const onglet = document.querySelector('[data-tab="tabTableau"]');
        if (onglet) { onglet.click(); onglet.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else document.getElementById('bracketZone')?.scrollIntoView({ behavior: 'smooth' });
    });
}

// ═══════════════════════════════════════════════════════════
// 19. PARTICIPANTS APPROUVÉS (stat rapide)
// ═══════════════════════════════════════════════════════════
async function loadParticipantCount(tournamentId) {
    const { count } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved');
    document.getElementById('statParticipants').textContent = count ?? 0;
}

// ═══════════════════════════════════════════════════════════
// 20. RÉCOMPENSES (podium + spéciales)
// ═══════════════════════════════════════════════════════════
async function loadAwards(tournamentId) {
    const { data, error } = await supabaseClient
        .from(TBL_AWARDS)
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('display_order', { ascending: true });

    const rankContainer = document.getElementById('rankAwardsDisplay');
    const specialCard = document.getElementById('specialAwardsCard');
    const specialContainer = document.getElementById('specialAwardsDisplay');

    if (error || !data || data.length === 0) {
        rankContainer.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>Aucune récompense définie pour ce tournoi.</p></div>';
        return;
    }

    const rankAwards = data.filter(function(a) { return a.award_type === 'rank'; });
    const specialAwards = data.filter(function(a) { return a.award_type === 'special'; });

    const rankIcons = { 1: 'fa-trophy gold', 2: 'fa-medal silver', 3: 'fa-medal bronze' };
    rankContainer.innerHTML = rankAwards.length ? rankAwards.map(function(a) {
        const icon = rankIcons[a.rank_position] || 'fa-award';
        return '<div class="award-card"><i class="fas ' + icon + '"></i>' +
               '<div class="award-card-body"><span class="award-rank-label">' + a.rank_position + (a.rank_position === 1 ? 'ère' : 'ème') + ' place</span>' +
               '<span class="award-reward">' + escapeHtml(a.reward_label) + '</span>' +
               (a.amount ? '<span class="award-amount tabular">' + formatMoney(a.amount) + ' FCFA</span>' : '') + '</div></div>';
    }).join('') : '<p class="empty-hint">Aucune récompense de classement.</p>';

    if (specialAwards.length) {
        specialCard.style.display = 'block';
        specialContainer.innerHTML = specialAwards.map(function(a) {
            return '<div class="award-card special"><i class="fas fa-star"></i>' +
                   '<div class="award-card-body"><span class="award-rank-label">' + escapeHtml(a.special_category) + '</span>' +
                   '<span class="award-reward">' + escapeHtml(a.reward_label) + '</span>' +
                   (a.amount ? '<span class="award-amount tabular">' + formatMoney(a.amount) + ' FCFA</span>' : '') + '</div></div>';
        }).join('');
    }
}

// ═══════════════════════════════════════════════════════════
// 21. ONGLETS
// ═══════════════════════════════════════════════════════════
function initTabs() {
    document.querySelectorAll('.detail-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.detail-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.detail-tab-panel').forEach(function(p) { p.classList.remove('active'); });
            btn.classList.add('active');
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 22. UI : SIDEBAR, MENU, DÉCONNEXION
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
// 23. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const tournamentId = getTournamentIdFromURL();
    if (!tournamentId) return;

    const isLoggedIn = await checkSession();
    if (isLoggedIn) await loadProfile();
    updateNavbarUI();

    initUserMenu();
    initSidebar();
    initLogout();
    initTabs();

    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });
    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    await loadTournamentDetails(tournamentId);
    await loadParticipantCount(tournamentId);
});
