/* ============================================================
   HubISoccer — decouvrir-tournois.js
   Systeme Gestion Tournois — CHANTIER 17
   La recherche publique de tournois
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Avant lui, on ne pouvait pas TROUVER un tournoi. Nulle part.
   Aucune recherche dans les 26 pages du module.

   On y entrait uniquement avec un code d'inscription que
   quelqu'un avait bien voulu donner. Un organisateur qui publie
   son tournoi restait invisible : ses affiches devaient porter
   un code, et le bouche-a-oreille faisait tout le travail.

   Un tournoi public que personne ne peut trouver reste privé.
   C'est ce qui bloquait net toute croissance.

   CE QUE FAIT CETTE PAGE

   Elle LIT, sans connexion. Elle cherche par nom, par lieu, par
   sport, par etat (a venir, en cours, termine). Elle garde
   aussi l'entree par code, parce qu'elle marchait et qu'elle
   reste la plus rapide quand on a le code sous les yeux.

   Chaque resultat mene a tournoi-public.html : une page qui
   s'ouvre elle aussi sans compte.

   PRINCIPES TENUS ICI

   - AUCUNE jointure imbriquee. Que des requetes separees.
   - select('*') : is_public peut ne pas exister encore (le
     chantier 17 l'ajoute) et une colonne inconnue ferait
     echouer TOUTE la requete.
   - Un tournoi sans is_public est considere PUBLIC. La page
     marche donc avant meme que le SQL soit passe.
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
const TBL_TOURNAMENTS  = 'supabaseAuthPrive_gt_tournaments';
const TBL_TYPES        = 'supabaseAuthPrive_gt_types';
const TBL_SPORTS       = 'supabaseAuthPrive_gt_sports';
const TBL_TEAMS        = 'supabaseAuthPrive_gt_teams';

// Combien de tournois on rapatrie au plus. La recherche fine se
// fait ensuite dans le navigateur, ce qui la rend instantanee.
// Au-dela de ce nombre, on le DIT au visiteur plutot que de lui
// cacher des resultats en silence.
const PLAFOND = 300;

// ═══════════════════════════════════════════════════════════
// 3. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let tousLesTournois = [];
let sessionOuverte  = false;
let plafondAtteint  = false;

const filtres = {
    texte:  '',
    sport:  '',
    etat:   '',
    tri:    'proche'
};

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

// La recherche doit marcher sans accents et sans majuscules.
// « cotonou » doit trouver « Cotonou », « benin » doit trouver
// « Bénin ». Sans ca, une recherche sur un telephone AZERTY
// africain ne renvoie jamais rien.
function aplatir(s) {
    if (s === null || s === undefined) return '';
    let t = String(s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t;
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

const LIBELLES_ETAT = {
    upcoming: { texte: 'À venir',          classe: 'etat-avenir' },
    ongoing:  { texte: 'En cours',         classe: 'etat-encours' },
    past:     { texte: 'Terminé',          classe: 'etat-termine' },
    unknown:  { texte: 'Dates à préciser', classe: 'etat-inconnu' }
};

// ═══════════════════════════════════════════════════════════
// 7. SESSION — OPTIONNELLE
// -----------------------------------------------------------
// On ne redirige jamais. C'est une page publique.
// ═══════════════════════════════════════════════════════════
async function regarderLaSession() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        sessionOuverte = !!(data && data.session);
    } catch (e) {
        sessionOuverte = false;
    }
    const lien = document.getElementById('lienConnexion');
    if (!lien) return;
    if (sessionOuverte) {
        lien.innerHTML = '<i class="fas fa-th-large"></i> Mon espace';
        lien.href = 'acceuil.html';
    } else {
        lien.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        lien.href = '../../authprive/users/login.html';
    }
}

// ═══════════════════════════════════════════════════════════
// 8. TYPE ET SPORT — EN REQUÊTES SÉPARÉES
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
// 9. LE NOMBRE D'ÉQUIPES PAR TOURNOI
// -----------------------------------------------------------
// Une carte qui annonce « 12 équipes » dit bien plus qu'une
// carte muette. UNE seule requete pour tous les tournois de la
// page, pas une par carte.
// ═══════════════════════════════════════════════════════════
async function compterLesEquipes(tournois) {
    const ids = (tournois || []).map(function(t) { return t.id; });
    if (!ids.length) return;

    const { data, error } = await supabaseClient
        .from(TBL_TEAMS)
        .select('id, tournament_id')
        .in('tournament_id', ids);

    if (error) {
        // Pas de compteur, mais la liste reste utilisable. On ne
        // fait pas echouer la page pour un chiffre d'appoint.
        return;
    }

    const parTournoi = {};
    (data || []).forEach(function(e) {
        parTournoi[e.tournament_id] = (parTournoi[e.tournament_id] || 0) + 1;
    });
    (tournois || []).forEach(function(t) {
        t.nombreEquipes = parTournoi[t.id] || 0;
    });
}

// ═══════════════════════════════════════════════════════════
// 10. LA LECTURE
// ═══════════════════════════════════════════════════════════
async function chargerLesTournois() {
    showLoader();

    // select('*') : is_public n'existe peut-etre pas encore.
    // Une colonne inconnue nommee explicitement ferait echouer
    // la requete ENTIERE (42703), et la page resterait vide.
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: false })
        .limit(PLAFOND);

    hideLoader();

    if (error) {
        afficherUnMessage(
            'fa-triangle-exclamation',
            'La recherche n’a pas pu aboutir',
            'La base a répondu : ' + error.message);
        return;
    }

    // is_public absent = public. La page marche donc AVANT que
    // le script SQL du chantier 17 soit passe.
    tousLesTournois = (data || []).filter(function(t) { return t.is_public !== false; });
    plafondAtteint  = (data || []).length >= PLAFOND;

    await attacherTypeEtSport(tousLesTournois);
    await compterLesEquipes(tousLesTournois);

    remplirLeChoixDesSports();
    appliquerLesFiltres();
}

// ═══════════════════════════════════════════════════════════
// 11. LE CHOIX DES SPORTS
// -----------------------------------------------------------
// Construit depuis les tournois REELLEMENT publies. Proposer un
// sport sur lequel aucun tournoi n'existe ne mene qu'a une
// liste vide.
// ═══════════════════════════════════════════════════════════
function remplirLeChoixDesSports() {
    const select = document.getElementById('filtreSport');
    if (!select) return;

    const vus = {};
    tousLesTournois.forEach(function(t) {
        const nom = t.sport && (t.sport.name || t.sport.label);
        if (nom) vus[nom] = (vus[nom] || 0) + 1;
    });

    const noms = Object.keys(vus).sort(function(a, b) { return a.localeCompare(b); });
    select.innerHTML = '<option value="">Tous les sports</option>' +
        noms.map(function(n) {
            return '<option value="' + escapeHtml(n) + '">' +
                   escapeHtml(n) + ' (' + vus[n] + ')</option>';
        }).join('');
}

// ═══════════════════════════════════════════════════════════
// 12. LES FILTRES
// ═══════════════════════════════════════════════════════════
function correspond(t) {
    // Le texte : nom, lieu, description, code.
    if (filtres.texte) {
        const q = aplatir(filtres.texte);
        const champs = aplatir(
            (t.name || '') + ' ' + (t.location || '') + ' ' +
            (t.description || '') + ' ' + (t.registration_code || '') + ' ' +
            ((t.sport && (t.sport.name || t.sport.label)) || '') + ' ' +
            ((t.type && (t.type.label || t.type.name)) || ''));
        // Chaque mot cherche doit se retrouver : « coupe cotonou »
        // trouve « Coupe inter-quartiers de Cotonou ».
        const mots = q.split(/\s+/).filter(Boolean);
        for (let i = 0; i < mots.length; i++) {
            if (champs.indexOf(mots[i]) === -1) return false;
        }
    }

    if (filtres.sport) {
        const nom = (t.sport && (t.sport.name || t.sport.label)) || '';
        if (nom !== filtres.sport) return false;
    }

    if (filtres.etat && etatTemporel(t) !== filtres.etat) return false;

    return true;
}

function trier(liste) {
    const maintenant = new Date();
    const copie = liste.slice();

    if (filtres.tri === 'recent') {
        return copie.sort(function(a, b) {
            return new Date(b.created_at || b.start_date || 0) - new Date(a.created_at || a.start_date || 0);
        });
    }

    if (filtres.tri === 'dotation') {
        return copie.sort(function(a, b) {
            return (b.prize_pool || 0) - (a.prize_pool || 0);
        });
    }

    // Par defaut : le plus proche de maintenant d'abord. Ce qui
    // commence bientot compte plus que ce qui s'est joue l'an
    // dernier.
    return copie.sort(function(a, b) {
        const da = a.start_date ? Math.abs(new Date(a.start_date) - maintenant) : Infinity;
        const db = b.start_date ? Math.abs(new Date(b.start_date) - maintenant) : Infinity;
        if (da !== db) return da - db;
        return String(a.name || '').localeCompare(String(b.name || ''));
    });
}

function appliquerLesFiltres() {
    const retenus = trier(tousLesTournois.filter(correspond));
    dessinerLesResultats(retenus);

    const compteur = document.getElementById('compteurResultats');
    if (compteur) {
        if (!tousLesTournois.length) {
            compteur.textContent = '';
        } else if (retenus.length === tousLesTournois.length) {
            compteur.textContent = tousLesTournois.length + ' tournoi' +
                (tousLesTournois.length > 1 ? 's' : '') + ' public' +
                (tousLesTournois.length > 1 ? 's' : '');
        } else {
            compteur.textContent = retenus.length + ' résultat' + (retenus.length > 1 ? 's' : '') +
                ' sur ' + tousLesTournois.length;
        }
    }

    // On ne cache jamais un resultat en silence.
    const avert = document.getElementById('avertPlafond');
    if (avert) avert.style.display = plafondAtteint ? 'flex' : 'none';
}

// ═══════════════════════════════════════════════════════════
// 13. LE RENDU
// ═══════════════════════════════════════════════════════════
function afficherUnMessage(icone, titre, explication) {
    const zone = document.getElementById('resultats');
    if (!zone) return;
    zone.innerHTML =
        '<div class="empty-state"><i class="fas ' + icone + '"></i><h3></h3><p></p></div>';
    zone.querySelector('h3').textContent = titre;
    zone.querySelector('p').textContent = explication;
}

function carteDeTournoi(t) {
    const etat = etatTemporel(t);
    const l = LIBELLES_ETAT[etat] || LIBELLES_ETAT.unknown;

    const embleme = t.logo_url
        ? '<img src="' + escapeHtml(t.logo_url) + '" alt="" class="carte-logo">'
        : '<div class="carte-initiales">' + escapeHtml(getInitials(t.name)) + '</div>';

    const sport = (t.sport && (t.sport.name || t.sport.label)) || null;
    const type  = (t.type && (t.type.label || t.type.name)) || null;

    let etiquettes = '<span class="etiquette ' + l.classe + '">' + escapeHtml(l.texte) + '</span>';
    if (sport) etiquettes += '<span class="etiquette">' + escapeHtml(sport) + '</span>';
    if (type)  etiquettes += '<span class="etiquette">' + escapeHtml(type) + '</span>';

    const dotation = t.prize_pool
        ? '<span class="carte-info"><i class="fas fa-sack-dollar"></i> ' +
          formatMoney(t.prize_pool) + ' FCFA</span>' : '';

    const equipes = (t.nombreEquipes !== undefined)
        ? '<span class="carte-info"><i class="fas fa-shield-halved"></i> ' +
          t.nombreEquipes + ' engagée' + (t.nombreEquipes > 1 ? 's' : '') + '</span>' : '';

    return '<a class="carte-tournoi" href="tournoi-public.html?id=' + encodeURIComponent(t.id) + '">' +
           '<div class="carte-haut">' + embleme +
           '<div class="carte-entete">' +
           '<h3 class="carte-nom">' + escapeHtml(t.name || 'Tournoi') + '</h3>' +
           '<div class="carte-etiquettes">' + etiquettes + '</div>' +
           '</div></div>' +
           '<div class="carte-infos">' +
           '<span class="carte-info"><i class="fas fa-calendar-days"></i> ' +
           escapeHtml(formatDateShort(t.start_date)) + ' → ' + escapeHtml(formatDateShort(t.end_date)) + '</span>' +
           '<span class="carte-info"><i class="fas fa-location-dot"></i> ' +
           escapeHtml(t.location || 'Lieu à préciser') + '</span>' +
           equipes + dotation +
           '</div>' +
           '<span class="carte-aller">Voir le tournoi <i class="fas fa-arrow-right"></i></span>' +
           '</a>';
}

function dessinerLesResultats(liste) {
    const zone = document.getElementById('resultats');
    if (!zone) return;

    if (!tousLesTournois.length) {
        afficherUnMessage(
            'fa-trophy',
            'Aucun tournoi public pour le moment',
            'Dès qu’un organisateur publie son tournoi, il apparaît ici.');
        return;
    }

    if (!liste.length) {
        afficherUnMessage(
            'fa-magnifying-glass',
            'Aucun tournoi ne correspond',
            'Essayez avec moins de mots, ou enlevez un filtre.');
        return;
    }

    zone.innerHTML = liste.map(carteDeTournoi).join('');
}

// ═══════════════════════════════════════════════════════════
// 14. L'ENTRÉE PAR CODE
// -----------------------------------------------------------
// Elle existait deja dans public-register.html et elle marchait.
// On la garde : quand on a le code sous les yeux, c'est le
// chemin le plus court. La difference, c'est qu'ici elle ne
// demande PAS de compte pour regarder.
// ═══════════════════════════════════════════════════════════
async function chercherParCode() {
    const champ = document.getElementById('champCode');
    const retour = document.getElementById('retourCode');
    if (!champ || !retour) return;

    const code = (champ.value || '').trim();
    if (!code) {
        retour.className = 'retour-code erreur';
        retour.textContent = 'Entrez d’abord un code d’inscription.';
        retour.style.display = 'block';
        return;
    }

    retour.className = 'retour-code';
    retour.textContent = 'Recherche…';
    retour.style.display = 'block';

    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('*')
        .eq('registration_code', code)
        .eq('status', 'published')
        .maybeSingle();

    if (error) {
        retour.className = 'retour-code erreur';
        retour.textContent = 'La recherche a échoué : ' + error.message;
        return;
    }

    if (!data) {
        retour.className = 'retour-code erreur';
        retour.textContent = 'Aucun tournoi publié ne porte ce code. ' +
                             'Vérifiez les majuscules et les chiffres avec l’organisateur.';
        return;
    }

    retour.className = 'retour-code succes';
    retour.textContent = 'Trouvé : ' + data.name + ' — ouverture…';
    window.location.href = 'tournoi-public.html?id=' + encodeURIComponent(data.id);
}

// ═══════════════════════════════════════════════════════════
// 15. LES COMMANDES
// ═══════════════════════════════════════════════════════════
function initCommandes() {
    const recherche = document.getElementById('champRecherche');
    if (recherche) {
        // Recherche a la frappe, temporisee : on ne redessine
        // pas la liste a chaque lettre.
        let minuteur = null;
        recherche.addEventListener('input', function() {
            if (minuteur) clearTimeout(minuteur);
            minuteur = setTimeout(function() {
                filtres.texte = recherche.value || '';
                appliquerLesFiltres();
            }, 180);
        });
        recherche.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (minuteur) clearTimeout(minuteur);
                filtres.texte = recherche.value || '';
                appliquerLesFiltres();
            }
        });
    }

    const sport = document.getElementById('filtreSport');
    if (sport) {
        sport.addEventListener('change', function() {
            filtres.sport = sport.value || '';
            appliquerLesFiltres();
        });
    }

    const tri = document.getElementById('filtreTri');
    if (tri) {
        tri.addEventListener('change', function() {
            filtres.tri = tri.value || 'proche';
            appliquerLesFiltres();
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.puce-etat'), function(p) {
        p.addEventListener('click', function() {
            Array.prototype.forEach.call(document.querySelectorAll('.puce-etat'), function(x) {
                x.classList.remove('active');
                x.setAttribute('aria-pressed', 'false');
            });
            p.classList.add('active');
            p.setAttribute('aria-pressed', 'true');
            filtres.etat = p.dataset.etat || '';
            appliquerLesFiltres();
        });
    });

    const vider = document.getElementById('btnVider');
    if (vider) {
        vider.addEventListener('click', function() {
            filtres.texte = ''; filtres.sport = ''; filtres.etat = ''; filtres.tri = 'proche';
            if (recherche) recherche.value = '';
            if (sport) sport.value = '';
            if (tri) tri.value = 'proche';
            Array.prototype.forEach.call(document.querySelectorAll('.puce-etat'), function(x) {
                const tout = !x.dataset.etat;
                x.classList.toggle('active', tout);
                x.setAttribute('aria-pressed', tout ? 'true' : 'false');
            });
            appliquerLesFiltres();
        });
    }

    const btnCode = document.getElementById('btnCode');
    if (btnCode) btnCode.addEventListener('click', chercherParCode);

    const champCode = document.getElementById('champCode');
    if (champCode) {
        champCode.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); chercherParCode(); }
        });
    }

    // Le sélecteur de langue reste tel qu'il est ailleurs sur le
    // site : présent, sans effet pour le moment.
    const langue = document.getElementById('langSelect');
    if (langue) {
        langue.addEventListener('change', function(e) {
            showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
        });
    }
}

// ═══════════════════════════════════════════════════════════
// 16. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    initCommandes();
    await regarderLaSession();

    // Une recherche peut arriver toute faite dans l'adresse :
    // decouvrir-tournois.html?q=cotonou
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        filtres.texte = q;
        const champ = document.getElementById('champRecherche');
        if (champ) champ.value = q;
    }

    await chargerLesTournois();
});
