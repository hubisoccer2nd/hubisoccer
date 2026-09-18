/* ============================================================
   HubISoccer — tournoi-public.js
   Systeme Gestion Tournois — CHANTIER 17
   La page publique d'un tournoi
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Les 26 pages du gestionnaire commencent toutes pareil :

       const user = await checkSession();
       if (!user) return;          // -> login.html

   Un parent, un sponsor, un spectateur, un journaliste qui
   recoit le lien d'un tournoi tombait donc sur un ecran de
   connexion. Il ne voyait ni le calendrier, ni le classement,
   ni le tableau, ni le palmares. Rien.

   Pour une plateforme qui veut etre un reseau social, le
   tournoi etait ferme a double tour.

   CE QUE FAIT CETTE PAGE

   Elle LIT, et rien d'autre. Aucune ecriture, aucun bouton qui
   modifie quoi que ce soit. C'est ce qui rend l'absence de
   connexion acceptable.

   Elle est volontairement AUTONOME : elle ne partage pas le
   menu lateral des 26 pages privees. Montrer « Gerer un
   tournoi » ou « Mon equipe » a un inconnu n'aurait aucun sens,
   et un seul de ces liens casse dans une page publique remet en
   cause toute la confiance qu'on lui accorde.

   CE QU'ELLE NE FAIT PAS

   Elle ne touche a aucune des 26 pages existantes. Elles
   restent derriere la connexion, ce qui est normal : elles
   servent a ECRIRE.

   PRINCIPES TENUS ICI

   - AUCUNE jointure imbriquee. Que des requetes separees.
     C'est la cause qui revient le plus souvent dans ce module :
     sans cle etrangere declaree, PostgREST refuse la requete
     ENTIERE, et la page reste vide sans un mot.
   - select('*') partout ou une colonne peut manquer. Une seule
     colonne inconnue fait echouer toute la ligne (42703).
   - Aucun echec avale dans un console.warn() silencieux :
     chaque zone dit elle-meme pourquoi elle est vide.
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
const TBL_TOURNAMENTS  = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS       = 'supabaseAuthPrive_gt_sports';
const TBL_TEAMS        = 'supabaseAuthPrive_gt_teams';
const TBL_TEAM_PLAYERS = 'supabaseAuthPrive_gt_team_players';
const TBL_MATCHES      = 'supabaseAuthPrive_gt_matches';
const TBL_EVENTS       = 'supabaseAuthPrive_gt_match_events';
const TBL_STANDINGS    = 'supabaseAuthPrive_gt_standings';
const TBL_PARTICIPANTS = 'supabaseAuthPrive_gt_participants';
const TBL_AWARDS       = 'supabaseAuthPrive_gt_tournament_awards';
const TBL_PROFILES     = 'supabaseAuthPrive_profiles';

// CHANTIER 18 — le pont vers la communauté. La page publique
// LIT le fil ; elle n'y écrit jamais rien.
const TBL_POSTS        = 'supabaseAuthPrive_posts';
const TBL_COMMUNITIES  = 'supabaseAuthPrive_communities';
const TABLES_COMMUNAUTE = {
    posts:       TBL_POSTS,
    communities: TBL_COMMUNITIES,
    profiles:    TBL_PROFILES
};

// ═══════════════════════════════════════════════════════════
// 3. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let tournoiCourant   = null;
let equipesParId     = {};
let rencontresCache  = [];
let sessionOuverte   = false;
let nomSportTournoi  = null;
let indexIdentites   = null;

// ═══════════════════════════════════════════════════════════
// 4. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 5. TOAST (20 secondes)
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
                      '<div class="toast-content"></div>' +
                      '<button class="toast-close" aria-label="Fermer"><i class="fas fa-times"></i></button>';
    toast.querySelector('.toast-content').textContent = message;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (!toast.parentNode) return;
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 6. OUTILS
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function getInitials(name) {
    if (!name) return '?';
    return String(name).trim().split(/\s+/).slice(0, 2)
        .map(function(m) { return m.charAt(0).toUpperCase(); }).join('');
}

function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }

function formatDateShort(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateHeure(d) {
    if (!d) return 'Date à définir';
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatJour(d) {
    if (!d) return 'Date à définir';
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

// DOMPurify est charge par la page. S'il manque, on retombe sur
// du texte brut : jamais d'innerHTML non nettoye.
function sanitizeInto(rawHtml, targetEl) {
    if (!targetEl) return;
    if (!rawHtml) { targetEl.textContent = ''; return; }
    if (window.DOMPurify) targetEl.innerHTML = window.DOMPurify.sanitize(rawHtml);
    else targetEl.textContent = String(rawHtml).replace(/<[^>]*>/g, ' ');
}

function etatTemporel(t) {
    if (!t || !t.start_date || !t.end_date) return 'unknown';
    const maintenant = new Date();
    const debut = new Date(t.start_date);
    const fin   = new Date(t.end_date);
    if (debut > maintenant) return 'upcoming';
    if (fin < maintenant)   return 'past';
    return 'ongoing';
}

function extraireVideo(url) {
    if (!url) return null;
    const yt = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    const vi = String(url).match(/vimeo\.com\/(\d+)/);
    if (vi) return 'https://player.vimeo.com/video/' + vi[1];
    return null;
}

// Le vocabulaire du sport. Sans GTLexique la page reste lisible :
// on retombe sur le mot neutre, jamais sur « joueur » en dur.
function mot(gabarit) {
    if (window.GTLexique) return GTLexique.remplir(gabarit, nomSportTournoi);
    const repli = {
        sportif: 'sportif', sportifs: 'sportifs', pluriel: 'sportifs',
        collectif: 'équipe', collectifs: 'équipes',
        rencontre: 'rencontre', rencontres: 'rencontres',
        discipline: 'sport'
    };
    return String(gabarit).replace(/\{([A-Za-zéèêà]+)\}/g, function(tout, cle) {
        const majuscule = cle.charAt(0) === cle.charAt(0).toUpperCase() &&
                          cle.charAt(0) !== cle.charAt(0).toLowerCase();
        const forme = cle.charAt(0).toLowerCase() + cle.slice(1);
        if (!repli[forme]) return tout;
        const m = repli[forme];
        return majuscule ? m.charAt(0).toUpperCase() + m.slice(1) : m;
    });
}

function appliquerLeVocabulaire() {
    if (window.GTLexique) GTLexique.appliquer(nomSportTournoi);
}

// ═══════════════════════════════════════════════════════════
// 7. L'IDENTIFIANT DU TOURNOI
// -----------------------------------------------------------
// Les identifiants de tournoi sont des ENTIERS dans cette base
// (tournament_id=eq.7), pas des uuid. On convertit, sinon
// PostgREST compare un texte a un bigint et refuse.
// ═══════════════════════════════════════════════════════════
function idDepuisURL() {
    const params = new URLSearchParams(window.location.search);
    const brut = params.get('id') || params.get('t');
    if (!brut) return null;
    const n = parseInt(brut, 10);
    return isFinite(n) ? n : brut;
}

// ═══════════════════════════════════════════════════════════
// 8. SESSION — OPTIONNELLE
// -----------------------------------------------------------
// On ne REDIRIGE jamais. On regarde seulement s'il y a une
// session, pour proposer « Mon espace » plutot que « Se
// connecter ». C'est toute la difference avec les 26 autres
// pages.
// ═══════════════════════════════════════════════════════════
async function regarderLaSession() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        sessionOuverte = !!(data && data.session);
    } catch (e) {
        sessionOuverte = false;
    }
    const lienConnexion = document.getElementById('lienConnexion');
    if (!lienConnexion) return;
    if (sessionOuverte) {
        lienConnexion.innerHTML = '<i class="fas fa-th-large"></i> Mon espace';
        lienConnexion.href = 'acceuil.html';
    } else {
        lienConnexion.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        lienConnexion.href = '../../authprive/users/login.html';
    }
}

// ═══════════════════════════════════════════════════════════
// 9. TYPE ET SPORT — EN REQUÊTES SÉPARÉES
// -----------------------------------------------------------
// La jointure imbriquee type:gt_types(name) exige une cle
// etrangere DECLAREE. Quand elle ne l'est pas, PostgREST
// repond « Could not find a relationship between … » et refuse
// TOUTE la requete : le tournoi lui-meme n'arrive jamais.
// ═══════════════════════════════════════════════════════════
async function attacherTypeEtSport(tournois) {
    const idsType = [], idsSport = [];
    (tournois || []).forEach(function(t) {
        if (t.type_id  && idsType.indexOf(t.type_id)   === -1) idsType.push(t.type_id);
        if (t.sport_id && idsSport.indexOf(t.sport_id) === -1) idsSport.push(t.sport_id);
    });

    const parType = {}, parSport = {};
    if (idsType.length) {
        const r = await supabaseClient.from(TBL_TYPES).select('*').in('id', idsType);
        if (!r.error) (r.data || []).forEach(function(x) { parType[x.id] = x; });
    }
    if (idsSport.length) {
        const r = await supabaseClient.from(TBL_SPORTS).select('*').in('id', idsSport);
        if (!r.error) (r.data || []).forEach(function(x) { parSport[x.id] = x; });
    }

    (tournois || []).forEach(function(t) {
        t.type  = parType[t.type_id]   || null;
        t.sport = parSport[t.sport_id] || null;
    });
    return tournois;
}

// ═══════════════════════════════════════════════════════════
// 10. LE TOURNOI, ET LE DROIT DE LE MONTRER
// ═══════════════════════════════════════════════════════════
function afficherLePortailFerme(titre, explication, avecRecherche) {
    const zone = document.getElementById('zoneIndisponible');
    const corps = document.getElementById('corpsPublic');
    if (corps) corps.style.display = 'none';
    if (!zone) return;
    zone.style.display = 'block';
    zone.innerHTML =
        '<div class="portail-ferme">' +
        '<i class="fas fa-lock"></i>' +
        '<h2></h2><p></p>' +
        (avecRecherche
            ? '<a class="btn-principal" href="decouvrir-tournois.html"><i class="fas fa-search"></i> Découvrir les tournois ouverts</a>'
            : '') +
        '</div>';
    zone.querySelector('h2').textContent = titre;
    zone.querySelector('p').textContent = explication;
}

async function chargerLeTournoi(idTournoi) {
    showLoader();

    // select('*') : une colonne inconnue (is_public avant le
    // chantier 17, par exemple) ne doit pas faire echouer la
    // lecture du tournoi entier.
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*')
        .eq('id', idTournoi)
        .maybeSingle();

    if (error) {
        hideLoader();
        afficherLePortailFerme(
            'Tournoi introuvable',
            'La base a refusé la lecture : ' + error.message,
            true);
        return null;
    }

    if (!data) {
        hideLoader();
        afficherLePortailFerme(
            'Ce tournoi n’existe pas',
            'Le lien que vous avez reçu ne correspond à aucun tournoi. ' +
            'Il a peut-être été supprimé, ou l’adresse a été recopiée en partie.',
            true);
        return null;
    }

    // La porte publique, en deux verrous.
    //
    // 1. status : un brouillon n'a rien a faire dehors.
    // 2. is_public : l'organisateur peut retirer son tournoi de
    //    la vitrine sans le depublier. La colonne peut ne pas
    //    exister encore — undefined vaut donc « public ».
    if (data.status !== 'published') {
        hideLoader();
        afficherLePortailFerme(
            'Ce tournoi n’est pas encore public',
            'L’organisateur ne l’a pas encore publié. Revenez quand il aura ouvert les inscriptions.',
            true);
        return null;
    }

    if (data.is_public === false) {
        hideLoader();
        afficherLePortailFerme(
            'Tournoi privé',
            'L’organisateur a choisi de ne pas afficher ce tournoi publiquement. ' +
            'Pour le suivre, demandez-lui son code d’inscription.',
            true);
        return null;
    }

    await attacherTypeEtSport([data]);
    tournoiCourant  = data;
    nomSportTournoi = (data.sport && (data.sport.name || data.sport.label)) || null;
    appliquerLeVocabulaire();
    hideLoader();
    return data;
}

// ═══════════════════════════════════════════════════════════
// 11. LE BANDEAU
// ═══════════════════════════════════════════════════════════
function dessinerLeBandeau(t) {
    document.title = t.name + ' · HubISoccer';

    const banniere = document.getElementById('heroBanner');
    if (banniere && t.banner_url) {
        banniere.style.backgroundImage =
            'linear-gradient(135deg, rgba(85,27,140,.86), rgba(122,53,181,.78)), url(' +
            JSON.stringify(t.banner_url) + ')';
        banniere.style.backgroundSize = 'cover';
        banniere.style.backgroundPosition = 'center';
    }

    const logo = document.getElementById('heroLogo');
    const initiales = document.getElementById('heroInitials');
    if (t.logo_url && logo) {
        logo.src = t.logo_url;
        logo.style.display = 'block';
        if (initiales) initiales.style.display = 'none';
    } else if (initiales) {
        initiales.textContent = getInitials(t.name);
        initiales.style.display = 'flex';
        if (logo) logo.style.display = 'none';
    }

    const nom = document.getElementById('heroName');
    if (nom) nom.textContent = t.name || 'Tournoi';

    const etat = etatTemporel(t);
    const libelles = {
        upcoming: { texte: 'À venir',    classe: 'etat-avenir' },
        ongoing:  { texte: 'En cours',   classe: 'etat-encours' },
        past:     { texte: 'Terminé',    classe: 'etat-termine' },
        unknown:  { texte: 'Dates à préciser', classe: 'etat-inconnu' }
    };
    const l = libelles[etat] || libelles.unknown;

    const badges = document.getElementById('heroBadges');
    if (badges) {
        let html = '<span class="hero-badge ' + l.classe + '">' + escapeHtml(l.texte) + '</span>';
        if (t.sport && (t.sport.name || t.sport.label)) {
            html += '<span class="hero-badge">' + escapeHtml(t.sport.name || t.sport.label) + '</span>';
        }
        if (t.type && (t.type.label || t.type.name)) {
            html += '<span class="hero-badge">' + escapeHtml(t.type.label || t.type.name) + '</span>';
        }
        if (t.participation_type) {
            html += '<span class="hero-badge">' +
                    escapeHtml(t.participation_type === 'individuel' ? 'Individuel' : 'Par équipe') +
                    '</span>';
        }
        badges.innerHTML = html;
    }

    const dates = document.getElementById('heroDates');
    if (dates) {
        dates.textContent = (t.start_date || t.end_date)
            ? formatDateShort(t.start_date) + ' → ' + formatDateShort(t.end_date)
            : 'Dates à préciser';
    }

    const lieu = document.getElementById('heroLocation');
    if (lieu) lieu.textContent = t.location || 'Lieu à préciser';

    const prime = document.getElementById('statPrize');
    if (prime) prime.textContent = t.prize_pool ? formatMoney(t.prize_pool) + ' FCFA' : '—';
}

// ═══════════════════════════════════════════════════════════
// 12. L'APERÇU
// ═══════════════════════════════════════════════════════════
function dessinerLApercu(t) {
    sanitizeInto(t.description, document.getElementById('publicDescription'));

    const zoneDesc = document.getElementById('carteDescription');
    if (zoneDesc && !t.description) zoneDesc.style.display = 'none';

    // Le cadre vidéo n'est créé que s'il y a une vidéo. Un
    // iframe vide laissé dans la page réclame des permissions
    // (autoplay, picture-in-picture…) que rien n'utilisera, et
    // le navigateur s'en plaint à chaque chargement.
    const zoneVideo = document.getElementById('carteVideo');
    const cadre = document.getElementById('publicVideo');
    const url = extraireVideo(t.video_url || t.stream_url);
    if (url && cadre && zoneVideo) {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = 'Vidéo du tournoi';
        iframe.loading = 'lazy';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        cadre.innerHTML = '';
        cadre.appendChild(iframe);
        zoneVideo.style.display = 'block';
    } else if (zoneVideo) {
        zoneVideo.style.display = 'none';
    }

    const zoneRegle = document.getElementById('carteReglement');
    const texteRegle = document.getElementById('publicRules');
    if (t.rules && texteRegle && zoneRegle) {
        sanitizeInto(t.rules, texteRegle);
        zoneRegle.style.display = 'block';
    } else if (zoneRegle) {
        zoneRegle.style.display = 'none';
    }

    // L'appel a l'inscription. Il n'ecrit rien : il emmene vers
    // la page d'inscription existante, qui elle demande une
    // connexion — c'est la qu'est sa place.
    const cta = document.getElementById('zoneInscription');
    if (!cta) return;
    const etat = etatTemporel(t);
    if (etat === 'past') {
        cta.innerHTML = '<div class="cta-ferme"><i class="fas fa-flag-checkered"></i> ' +
                        'Ce tournoi est terminé. Le palmarès est dans le dernier onglet.</div>';
        return;
    }
    const prix = t.participation_price
        ? '<span class="cta-prix tabular">' + formatMoney(t.participation_price) + ' FCFA</span>' : '';
    cta.innerHTML =
        '<div class="cta-ouvert">' +
        '<div class="cta-texte"><strong>Participer à ce tournoi</strong>' +
        '<span>Créez votre compte, puis entrez le code d’inscription que l’organisateur vous a remis.</span></div>' +
        prix +
        '<a class="btn-principal" href="public-register.html' +
        (tournoiCourant && tournoiCourant.registration_code
            ? '?code=' + encodeURIComponent(tournoiCourant.registration_code) : '') +
        '"><i class="fas fa-edit"></i> S’inscrire</a>' +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// 13. LES ÉQUIPES
// ═══════════════════════════════════════════════════════════
async function chargerLesEquipes(idTournoi) {
    const conteneur = document.getElementById('listeEquipes');
    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('*')
        .eq('tournament_id', idTournoi)
        .order('name');

    const compteur = document.getElementById('statTeams');
    if (compteur) compteur.textContent = (!error && data) ? data.length : '—';

    equipesParId = {};
    (data || []).forEach(function(e) { equipesParId[e.id] = e; });

    if (!conteneur) return data || [];

    if (error) {
        conteneur.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml(mot('Les {collectifs} n’ont pas pu être lues : ') + error.message) + '</p></div>';
        return [];
    }

    if (!data || !data.length) {
        conteneur.innerHTML = '<div class="empty-state"><i class="fas fa-shield-alt"></i><p>' +
            escapeHtml(mot('Aucune {collectif} inscrite pour le moment.')) + '</p></div>';
        return [];
    }

    conteneur.innerHTML = data.map(function(e) {
        const logo = e.logo_url
            ? '<img src="' + escapeHtml(e.logo_url) + '" alt="" class="equipe-logo">'
            : '<div class="equipe-logo-vide"><i class="fas fa-shield-alt"></i></div>';
        const groupe = e.group_name
            ? '<span class="equipe-groupe">Groupe ' + escapeHtml(e.group_name) + '</span>' : '';
        return '<div class="equipe-carte">' + logo +
               '<span class="equipe-nom">' + escapeHtml(e.name) + '</span>' + groupe + '</div>';
    }).join('');

    return data;
}

// ═══════════════════════════════════════════════════════════
// 14. LE CALENDRIER
// -----------------------------------------------------------
// Les noms des deux equipes viennent d'une requete SEPAREE.
// ═══════════════════════════════════════════════════════════
function nomEquipe(id) {
    if (!id) return null;
    const e = equipesParId[id];
    return e ? e.name : null;
}

function ligneDeRencontre(m) {
    const fait   = m.status === 'completed';
    const direct = m.status === 'live';
    const nomA = nomEquipe(m.team_a_id) || mot('{collectif} A');
    const nomB = nomEquipe(m.team_b_id) || mot('{collectif} B');

    let score;
    if (fait) {
        score = (m.score_a == null ? 0 : m.score_a) + ' - ' + (m.score_b == null ? 0 : m.score_b);
    } else if (direct) {
        score = (m.score_a == null ? 0 : m.score_a) + ' - ' + (m.score_b == null ? 0 : m.score_b);
    } else {
        score = 'vs';
    }

    // Les tirs au but s'affichent, sinon un 1-1 suivi d'une
    // qualification reste incomprehensible pour le public.
    let tab = '';
    if (fait && (m.penalty_a != null || m.penalty_b != null)) {
        tab = '<div class="rencontre-tab">tirs au but ' +
              (m.penalty_a == null ? 0 : m.penalty_a) + ' - ' +
              (m.penalty_b == null ? 0 : m.penalty_b) + '</div>';
    }

    let forfait = '';
    if (m.forfeit_team_id) {
        const perdant = nomEquipe(m.forfeit_team_id);
        forfait = '<div class="rencontre-forfait"><i class="fas fa-flag"></i> Forfait' +
                  (perdant ? ' — ' + escapeHtml(perdant) : '') + '</div>';
    }

    const etiquette = direct
        ? '<span class="rencontre-badge direct"><span class="point-direct"></span> En direct</span>'
        : fait
            ? '<span class="rencontre-badge fait">Terminé</span>'
            : '<span class="rencontre-badge prevu">' + escapeHtml(formatDateHeure(m.match_date)) + '</span>';

    const lieu = m.venue ? '<div class="rencontre-lieu"><i class="fas fa-location-dot"></i> ' +
                           escapeHtml(m.venue) + '</div>' : '';

    return '<div class="rencontre-carte' + (direct ? ' est-direct' : '') + '">' +
           '<div class="rencontre-haut">' +
           '<span class="rencontre-tour">' + escapeHtml(m.round || mot('{rencontre}')) + '</span>' +
           etiquette + '</div>' +
           '<div class="rencontre-corps">' +
           '<span class="rencontre-equipe">' + escapeHtml(nomA) + '</span>' +
           '<span class="rencontre-score tabular">' + escapeHtml(score) + '</span>' +
           '<span class="rencontre-equipe">' + escapeHtml(nomB) + '</span>' +
           '</div>' + tab + forfait + lieu + '</div>';
}

async function chargerLeCalendrier(idTournoi) {
    const conteneur = document.getElementById('listeCalendrier');

    const { data, error } = await supabaseClient
        .from(TBL_MATCHES)
        .select('*')
        .eq('tournament_id', idTournoi)
        .order('match_date', { ascending: true });

    rencontresCache = data || [];

    const compteur = document.getElementById('statMatches');
    if (compteur) {
        compteur.textContent = (!error && data)
            ? data.filter(function(m) { return m.status === 'completed'; }).length + ' / ' + data.length
            : '—';
    }

    if (!conteneur) return;

    if (error) {
        conteneur.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml('Le calendrier n’a pas pu être lu : ' + error.message) + '</p></div>';
        return;
    }

    if (!data || !data.length) {
        conteneur.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-xmark"></i><p>' +
            escapeHtml(mot('Aucune {rencontre} programmée pour le moment.')) + '</p></div>';
        return;
    }

    // Regroupement par jour. Sans date, un groupe « à programmer »
    // en fin de liste — on ne les fait pas disparaitre.
    const parJour = {};
    const ordre = [];
    data.forEach(function(m) {
        const cle = m.match_date ? new Date(m.match_date).toISOString().slice(0, 10) : 'zzz-sans-date';
        if (!parJour[cle]) { parJour[cle] = []; ordre.push(cle); }
        parJour[cle].push(m);
    });
    ordre.sort();

    conteneur.innerHTML = ordre.map(function(cle) {
        const titre = (cle === 'zzz-sans-date')
            ? 'Dates à programmer'
            : formatJour(parJour[cle][0].match_date);
        return '<div class="jour-bloc">' +
               '<h3 class="jour-titre">' + escapeHtml(titre) + '</h3>' +
               '<div class="jour-rencontres">' +
               parJour[cle].map(ligneDeRencontre).join('') +
               '</div></div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 15. LE CLASSEMENT
// -----------------------------------------------------------
// Un tournoi a poules doit s'afficher PAR GROUPE. Une liste
// plate de 24 equipes ne dit rien a personne.
// ═══════════════════════════════════════════════════════════
function trierLesLignes(lignes) {
    return lignes.slice().sort(function(a, b) {
        if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
        const dA = (a.goal_difference != null) ? a.goal_difference : (a.goals_for || 0) - (a.goals_against || 0);
        const dB = (b.goal_difference != null) ? b.goal_difference : (b.goals_for || 0) - (b.goals_against || 0);
        if (dB !== dA) return dB - dA;
        if ((b.goals_for || 0) !== (a.goals_for || 0)) return (b.goals_for || 0) - (a.goals_for || 0);
        return String(nomEquipe(a.team_id) || '').localeCompare(String(nomEquipe(b.team_id) || ''));
    });
}

function tableDuClassement(lignes, titre) {
    const corps = trierLesLignes(lignes).map(function(r, i) {
        const diff = (r.goal_difference != null)
            ? r.goal_difference : (r.goals_for || 0) - (r.goals_against || 0);
        const nom = nomEquipe(r.team_id) || mot('{collectif} inconnue');
        return '<tr>' +
               '<td class="rang tabular">' + (i + 1) + '</td>' +
               '<td class="nom">' + escapeHtml(nom) + '</td>' +
               '<td class="tabular">' + (r.played || 0) + '</td>' +
               '<td class="tabular">' + (r.wins || 0) + '</td>' +
               '<td class="tabular">' + (r.draws || 0) + '</td>' +
               '<td class="tabular">' + (r.losses || 0) + '</td>' +
               '<td class="tabular">' + (r.goals_for || 0) + '</td>' +
               '<td class="tabular">' + (r.goals_against || 0) + '</td>' +
               '<td class="tabular">' + (diff > 0 ? '+' : '') + diff + '</td>' +
               '<td class="tabular points">' + (r.points || 0) + '</td>' +
               '</tr>';
    }).join('');

    return (titre ? '<h3 class="groupe-titre">' + escapeHtml(titre) + '</h3>' : '') +
           '<div class="table-enveloppe"><table class="table-classement">' +
           '<thead><tr><th>#</th><th>' + escapeHtml(mot('{collectif}')) + '</th>' +
           '<th title="Joués">J</th><th title="Gagnés">G</th><th title="Nuls">N</th>' +
           '<th title="Perdus">P</th><th title="Marqués">BP</th><th title="Encaissés">BC</th>' +
           '<th title="Différence">Diff</th><th>Pts</th></tr></thead>' +
           '<tbody>' + corps + '</tbody></table></div>';
}

async function chargerLeClassement(idTournoi) {
    const zone = document.getElementById('zoneClassement');
    if (!zone) return;

    const { data, error } = await supabaseClient
        .from(TBL_STANDINGS)
        .select('*')
        .eq('tournament_id', idTournoi);

    if (error) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml('Le classement n’a pas pu être lu : ' + error.message) + '</p></div>';
        return;
    }

    if (!data || !data.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-chart-simple"></i>' +
            '<p>Le classement se remplira dès les premiers résultats.</p></div>';
        return;
    }

    const groupes = {};
    const ordre = [];
    data.forEach(function(r) {
        const g = r.group_name || '';
        if (!groupes[g]) { groupes[g] = []; ordre.push(g); }
        groupes[g].push(r);
    });
    ordre.sort();

    if (ordre.length === 1 && ordre[0] === '') {
        zone.innerHTML = tableDuClassement(groupes[''], null);
        return;
    }

    zone.innerHTML = ordre.map(function(g) {
        return '<div class="groupe-bloc">' +
               tableDuClassement(groupes[g], g ? 'Groupe ' + g : 'Classement général') +
               '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 16. LE TABLEAU FINAL
// -----------------------------------------------------------
// Le dessin vit dans gt-bracket.js. Ici on ne fait que fournir
// les rencontres et les noms. Sans GTBracket, on le dit.
// ═══════════════════════════════════════════════════════════
function chargerLeTableau() {
    const zone = document.getElementById('bracketZone');
    if (!zone) return;

    const duTableau = (rencontresCache || []).filter(function(m) {
        return m.bracket_position !== null && m.bracket_position !== undefined;
    }).sort(function(a, b) { return (a.bracket_position || 0) - (b.bracket_position || 0); });

    if (!duTableau.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-sitemap"></i>' +
            '<p>Ce tournoi n’a pas de tableau à élimination directe, ' +
            'ou il n’a pas encore été engendré.</p></div>';
        return;
    }

    if (!window.GTBracket) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-sitemap"></i>' +
            '<p>Le dessin du tableau n’a pas pu être chargé.</p></div>';
        return;
    }

    const noms = {}, logos = {};
    Object.keys(equipesParId).forEach(function(id) {
        noms[id] = equipesParId[id].name;
        if (equipesParId[id].logo_url) logos[id] = equipesParId[id].logo_url;
    });

    // surClic absent : en public, un match ne mene nulle part.
    // match-details.html exige une connexion.
    GTBracket.dessiner({
        conteneur: 'bracketZone',
        matchs: duTableau,
        equipes: noms,
        logos: logos
    });
}

// ═══════════════════════════════════════════════════════════
// 17. LES BUTEURS
// -----------------------------------------------------------
// Les buts sont deja dans gt_match_events. Personne ne les
// comptait pour le public.
//
// L'identite passe par GTIdentite : une fiche d'effectif peut
// etre referencee par son user_id OU par son id de ligne selon
// la page qui l'a ecrite. L'index repond aux deux.
// ═══════════════════════════════════════════════════════════
async function chargerLesButeurs(idTournoi) {
    const zone = document.getElementById('listeButeurs');
    if (!zone) return;

    const idsRencontres = (rencontresCache || []).map(function(m) { return m.id; });
    if (!idsRencontres.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-futbol"></i>' +
            '<p>' + escapeHtml(mot('Aucune {rencontre} jouée : rien à compter.')) + '</p></div>';
        return;
    }

    const { data, error } = await supabaseClient
        .from(TBL_EVENTS)
        .select('*')
        .in('match_id', idsRencontres);

    if (error) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml('Les buts n’ont pas pu être lus : ' + error.message) + '</p></div>';
        return;
    }

    const buts    = (data || []).filter(function(e) { return e.event_type === 'goal'; });
    const passes  = (data || []).filter(function(e) { return e.event_type === 'goal' && e.assist_player_id; });

    if (!buts.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-futbol"></i>' +
            '<p>Aucun but marqué pour le moment.</p></div>';
        return;
    }

    // L'index des identites, construit sur les equipes du tournoi.
    const idsEquipes = Object.keys(equipesParId);
    if (window.GTIdentite && idsEquipes.length) {
        indexIdentites = await GTIdentite.charger(
            supabaseClient,
            { teamPlayers: TBL_TEAM_PLAYERS, profiles: TBL_PROFILES },
            idsEquipes);
    }

    function etiquette(cle) {
        if (!cle) return 'Inconnu';
        if (indexIdentites && window.GTIdentite) {
            return GTIdentite.etiquetteDepuisIndex(indexIdentites, cle);
        }
        return String(cle).slice(0, 8);
    }

    function equipeDe(cle) {
        if (indexIdentites && indexIdentites.parCle && indexIdentites.parCle[String(cle)]) {
            const e = indexIdentites.parCle[String(cle)];
            if (e.team_id && equipesParId[e.team_id]) return equipesParId[e.team_id].name;
        }
        return null;
    }

    const compteButs = {}, comptePasses = {}, equipeButeur = {};
    buts.forEach(function(e) {
        if (!e.player_id) return;
        const c = String(e.player_id);
        compteButs[c] = (compteButs[c] || 0) + 1;
        if (!equipeButeur[c] && e.team_id && equipesParId[e.team_id]) {
            equipeButeur[c] = equipesParId[e.team_id].name;
        }
    });
    passes.forEach(function(e) {
        const c = String(e.assist_player_id);
        comptePasses[c] = (comptePasses[c] || 0) + 1;
    });

    function podium(compte, titre, icone, suffixeUn, suffixePlus) {
        const lignes = Object.keys(compte).map(function(c) {
            return { cle: c, n: compte[c] };
        }).sort(function(a, b) {
            if (b.n !== a.n) return b.n - a.n;
            return etiquette(a.cle).localeCompare(etiquette(b.cle));
        }).slice(0, 20);

        if (!lignes.length) return '';

        return '<div class="carte">' +
               '<h3 class="carte-titre"><i class="fas ' + icone + '"></i> ' + escapeHtml(titre) + '</h3>' +
               '<ol class="palmares-liste">' +
               lignes.map(function(l, i) {
                   const eq = equipeButeur[l.cle] || equipeDe(l.cle);
                   return '<li class="palmares-ligne' + (i < 3 ? ' sur-podium' : '') + '">' +
                          '<span class="palmares-rang tabular">' + (i + 1) + '</span>' +
                          '<span class="palmares-nom">' + escapeHtml(etiquette(l.cle)) +
                          (eq ? '<small>' + escapeHtml(eq) + '</small>' : '') + '</span>' +
                          '<span class="palmares-nombre tabular">' + l.n + ' ' +
                          escapeHtml(l.n > 1 ? suffixePlus : suffixeUn) + '</span></li>';
               }).join('') +
               '</ol></div>';
    }

    zone.innerHTML =
        podium(compteButs,   'Meilleurs buteurs',   'fa-futbol', 'but', 'buts') +
        podium(comptePasses, 'Meilleurs passeurs',  'fa-hands-helping', 'passe', 'passes');
}

// ═══════════════════════════════════════════════════════════
// CHANTIER 18 — CE QUI SE DIT SUR CE TOURNOI
// -----------------------------------------------------------
// Le gestionnaire de tournoi et le fil de la communauté vivent
// dans la même base et ne se parlaient pas. Depuis le chantier
// 18, l'organisateur publie ses moments dans le fil, et chaque
// publication porte tournament_id.
//
// Cet onglet lit ces publications. En LECTURE SEULE, et sans
// compte : un spectateur voit l'ambiance du tournoi avant même
// de décider s'il s'inscrit.
//
// Pour commenter ou aimer, il faut un compte — le bouton mène
// alors au fil, qui demandera la connexion. C'est sa place, pas
// celle d'une page publique.
// ═══════════════════════════════════════════════════════════
function lienVersLeFil(idPublication) {
    const base = window.location.href.split('?')[0].split('#')[0];
    const racine = base.replace(/[^/]*$/, '');
    return racine + '../community/post-view.html?id=' + encodeURIComponent(idPublication);
}

// Le texte d'une publication est écrit par un humain : il passe
// par l'échappement AVANT toute mise en forme. On rend ensuite
// cliquables les adresses, les mots-dièse restant du texte.
function texteDePublication(brut) {
    if (!brut) return '';
    return escapeHtml(brut)
        .replace(/(https?:\/\/[^\s<]+)/g,
                 '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}

async function chargerLaCommunaute(idTournoi) {
    const zone = document.getElementById('listeCommunaute');
    if (!zone) return;

    if (typeof GTCommunaute === 'undefined') {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i>' +
            '<p>Le pont vers la communauté n’a pas pu être chargé.</p></div>';
        return;
    }

    const r = await GTCommunaute.lireLesPublications(
        supabaseClient, TABLES_COMMUNAUTE, idTournoi, 30);

    if (!r.ok) {
        // La colonne tournament_id n'existe peut-être pas encore.
        // On le dit, au lieu d'afficher un onglet vide sans
        // explication.
        const manque = /tournament_id|post_kind/.test((r.erreur && r.erreur.message) || '');
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml('Les publications n’ont pas pu être lues : ' + r.erreur.message) +
            (manque ? ' Le script chantier-18-communaute.sql n’a pas encore été passé.' : '') +
            '</p></div>';
        return;
    }

    if (!r.publications.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i>' +
            '<p>Rien n’a encore été publié sur ce tournoi dans la communauté.</p></div>';
        return;
    }

    zone.innerHTML = r.publications.map(function(p) {
        const a = p.auteur || {};
        const nom = a.full_name || a.display_name || 'Un membre';
        const avatar = a.avatar_url
            ? '<img class="pub-avatar" src="' + escapeHtml(a.avatar_url) + '" alt="" loading="lazy">'
            : '<div class="pub-avatar-vide">' + escapeHtml(getInitials(nom)) + '</div>';

        const quand = p.created_at
            ? new Date(p.created_at).toLocaleString('fr-FR',
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '';

        let carte = '';
        if (p.event_data) {
            try { carte = GTCommunaute.apercuHtml(
                typeof p.event_data === 'string' ? JSON.parse(p.event_data) : p.event_data); }
            catch (e) { carte = ''; }
        }

        return '<article class="publication">' +
               '<header class="pub-tete">' + avatar +
               '<div><div class="pub-nom">' + escapeHtml(nom) + '</div>' +
               '<div class="pub-quand">' + escapeHtml(quand) + '</div></div></header>' +
               '<div class="pub-texte">' + texteDePublication(p.content) + '</div>' +
               carte +
               '<a class="pub-lien" href="' + escapeHtml(lienVersLeFil(p.id)) + '">' +
               'Voir dans le fil <i class="fas fa-arrow-right"></i></a>' +
               '</article>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 18. LE PALMARÈS
// ═══════════════════════════════════════════════════════════
async function chargerLePalmares(idTournoi) {
    const zone = document.getElementById('zonePalmares');
    if (!zone) return;

    const { data, error } = await supabaseClient
        .from(TBL_AWARDS)
        .select('*')
        .eq('tournament_id', idTournoi)
        .order('display_order', { ascending: true });

    if (error) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i>' +
            '<p>' + escapeHtml('Le palmarès n’a pas pu être lu : ' + error.message) + '</p></div>';
        return;
    }

    if (!data || !data.length) {
        zone.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i>' +
            '<p>Aucune récompense annoncée pour ce tournoi.</p></div>';
        return;
    }

    const rangs    = data.filter(function(a) { return a.award_type === 'rank'; });
    const speciaux = data.filter(function(a) { return a.award_type !== 'rank'; });

    function gagnant(a) {
        if (!a.winner_name) return '<span class="recompense-attente">Non encore attribuée</span>';
        return '<span class="recompense-gagnant"><i class="fas fa-crown"></i> ' +
               escapeHtml(a.winner_name) + '</span>';
    }

    const icones = { 1: 'fa-trophy or', 2: 'fa-medal argent', 3: 'fa-medal bronze' };

    let html = '';

    if (rangs.length) {
        html += '<div class="carte"><h3 class="carte-titre"><i class="fas fa-ranking-star"></i> Podium</h3>' +
                '<div class="recompenses-grille">' +
                rangs.map(function(a) {
                    const ic = icones[a.rank_position] || 'fa-award';
                    const place = a.rank_position
                        ? a.rank_position + (a.rank_position === 1 ? 'ère' : 'ème') + ' place'
                        : 'Récompense';
                    return '<div class="recompense' + (a.winner_name ? ' attribuee' : '') + '">' +
                           '<i class="fas ' + ic + '"></i>' +
                           '<div class="recompense-corps">' +
                           '<span class="recompense-place">' + escapeHtml(place) + '</span>' +
                           '<span class="recompense-lot">' + escapeHtml(a.reward_label || '') + '</span>' +
                           (a.amount ? '<span class="recompense-montant tabular">' +
                                       formatMoney(a.amount) + ' FCFA</span>' : '') +
                           gagnant(a) + '</div></div>';
                }).join('') + '</div></div>';
    }

    if (speciaux.length) {
        html += '<div class="carte"><h3 class="carte-titre"><i class="fas fa-star"></i> Distinctions</h3>' +
                '<div class="recompenses-grille">' +
                speciaux.map(function(a) {
                    return '<div class="recompense speciale' + (a.winner_name ? ' attribuee' : '') + '">' +
                           '<i class="fas fa-star"></i>' +
                           '<div class="recompense-corps">' +
                           '<span class="recompense-place">' + escapeHtml(a.special_category || 'Distinction') + '</span>' +
                           '<span class="recompense-lot">' + escapeHtml(a.reward_label || '') + '</span>' +
                           (a.amount ? '<span class="recompense-montant tabular">' +
                                       formatMoney(a.amount) + ' FCFA</span>' : '') +
                           gagnant(a) + '</div></div>';
                }).join('') + '</div></div>';
    }

    zone.innerHTML = html || '<div class="empty-state"><i class="fas fa-trophy"></i>' +
                             '<p>Aucune récompense annoncée.</p></div>';
}

// ═══════════════════════════════════════════════════════════
// 19. LES INSCRITS (le compteur du bandeau)
// ═══════════════════════════════════════════════════════════
async function compterLesInscrits(idTournoi) {
    const cible = document.getElementById('statParticipants');
    if (!cible) return;
    const { count, error } = await supabaseClient
        .from(TBL_PARTICIPANTS)
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', idTournoi)
        .eq('status', 'approved');
    cible.textContent = error ? '—' : (count == null ? 0 : count);
}

// ═══════════════════════════════════════════════════════════
// 20. LE PARTAGE
// -----------------------------------------------------------
// C'est la raison d'etre de cette page : un lien qui s'ouvre,
// sans compte, chez la personne qui le recoit.
// ═══════════════════════════════════════════════════════════
function lienDeLaPage() { return window.location.href; }

function texteDePartage() {
    const nom = tournoiCourant ? tournoiCourant.name : 'un tournoi';
    return 'Suis ' + nom + ' en direct sur HubISoccer : ';
}

function initPartage() {
    const champ = document.getElementById('champLien');
    if (champ) champ.value = lienDeLaPage();

    const copier = document.getElementById('btnCopier');
    if (copier) {
        copier.addEventListener('click', async function() {
            const lien = lienDeLaPage();
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(lien);
                } else if (champ) {
                    champ.select();
                    document.execCommand('copy');
                }
                showToast('Lien copié. Colle-le où tu veux : il s’ouvre sans compte.', 'success');
            } catch (e) {
                // Le presse-papier est refuse hors HTTPS et dans
                // certains navigateurs mobiles. On ne ment pas :
                // on montre le lien et on dit de le copier a la main.
                if (champ) { champ.select(); }
                showToast('Ton navigateur refuse la copie automatique. ' +
                          'Le lien est sélectionné : copie-le à la main.', 'warning');
            }
        });
    }

    const wa = document.getElementById('btnWhatsApp');
    if (wa) {
        wa.addEventListener('click', function() {
            // wa.me : aucune cle d'API, aucun compte professionnel.
            window.open('https://wa.me/?text=' +
                encodeURIComponent(texteDePartage() + lienDeLaPage()), '_blank', 'noopener');
        });
    }

    const fb = document.getElementById('btnFacebook');
    if (fb) {
        fb.addEventListener('click', function() {
            window.open('https://www.facebook.com/sharer/sharer.php?u=' +
                encodeURIComponent(lienDeLaPage()), '_blank', 'noopener');
        });
    }

    const natif = document.getElementById('btnPartageNatif');
    if (natif) {
        if (navigator.share) {
            natif.addEventListener('click', async function() {
                try {
                    await navigator.share({
                        title: tournoiCourant ? tournoiCourant.name : 'HubISoccer',
                        text: texteDePartage(),
                        url: lienDeLaPage()
                    });
                } catch (e) { /* l'utilisateur a annule : rien a dire */ }
            });
        } else {
            natif.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 21. LES ONGLETS
// -----------------------------------------------------------
// L'onglet ouvert est inscrit dans l'adresse (#calendrier).
// Un lien vers le classement doit pouvoir se partager tel quel.
// ═══════════════════════════════════════════════════════════
function ouvrirOnglet(nom) {
    const boutons = document.querySelectorAll('.onglet-btn');
    const panneaux = document.querySelectorAll('.onglet-panneau');
    let trouve = false;

    Array.prototype.forEach.call(boutons, function(b) {
        const actif = b.dataset.onglet === nom;
        b.classList.toggle('active', actif);
        b.setAttribute('aria-selected', actif ? 'true' : 'false');
        if (actif) trouve = true;
    });
    Array.prototype.forEach.call(panneaux, function(p) {
        p.classList.toggle('active', p.dataset.panneau === nom);
    });

    if (trouve && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + nom);
    }
    return trouve;
}

function initOnglets() {
    Array.prototype.forEach.call(document.querySelectorAll('.onglet-btn'), function(b) {
        b.addEventListener('click', function() { ouvrirOnglet(b.dataset.onglet); });
    });

    const demande = (window.location.hash || '').replace('#', '');
    if (!demande || !ouvrirOnglet(demande)) ouvrirOnglet('apercu');
}

// ═══════════════════════════════════════════════════════════
// 22. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    initOnglets();
    initPartage();
    await regarderLaSession();

    const id = idDepuisURL();
    if (!id) {
        afficherLePortailFerme(
            'Aucun tournoi indiqué',
            'Ce lien ne précise pas quel tournoi afficher. Utilisez la recherche pour en trouver un.',
            true);
        return;
    }

    const t = await chargerLeTournoi(id);
    if (!t) return;

    dessinerLeBandeau(t);
    dessinerLApercu(t);

    // Les equipes d'abord : le calendrier, le classement et le
    // tableau ont tous besoin de leurs noms.
    await chargerLesEquipes(id);
    await chargerLeCalendrier(id);

    // Le reste peut partir ensemble : aucune de ces quatre
    // lectures ne depend des trois autres.
    await Promise.all([
        chargerLeClassement(id),
        chargerLePalmares(id),
        compterLesInscrits(id),
        chargerLesButeurs(id),
        chargerLaCommunaute(id)
    ]);

    chargerLeTableau();

    const champ = document.getElementById('champLien');
    if (champ) champ.value = lienDeLaPage();

    // Le sélecteur de langue reste tel qu'il est ailleurs sur le
    // site : présent, sans effet pour le moment. On ne touche pas
    // aux traductions.
    const langue = document.getElementById('langSelect');
    if (langue) {
        langue.addEventListener('change', function(e) {
            showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
        });
    }
});
