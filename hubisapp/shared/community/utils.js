// ============================================================
// HUBISOCCER — UTILS.JS
// Fonctions utilitaires globales pour toute la communauté
// ============================================================
'use strict';

// ----------------------------------------------
// TOAST (notifications éphémères)
// ----------------------------------------------
function toast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'c-toast-container';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" aria-label="Fermer">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(el);
    
    setTimeout(() => {
        el.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// ----------------------------------------------
// LOADER GLOBAL
// ----------------------------------------------
function setLoader(show, text = 'Chargement...', percent = 0) {
    const loader = document.getElementById('globalLoader');
    if (!loader) return;
    
    loader.style.display = show ? 'flex' : 'none';
    
    const textEl = document.getElementById('loaderText');
    const barEl = document.getElementById('loaderBar');
    
    if (textEl) textEl.textContent = text;
    if (barEl) barEl.style.width = Math.min(100, Math.max(0, percent)) + '%';
}

// ----------------------------------------------
// GESTION DES MODALES
// ----------------------------------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    // Force le navigateur à prendre en compte le display:flex avant d'ajouter la classe
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Fermer toutes les modales ouvertes (utile avec Échap)
function closeAllModals() {
    document.querySelectorAll('.c-modal.show').forEach(m => {
        m.classList.remove('show');
        m.style.display = 'none';
    });
}

// ----------------------------------------------
// FORMATAGE DE TEXTE
// ----------------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Échappe une valeur destinée à un ATTRIBUT HTML (src, alt, data-*, title...)
 * Neutralise aussi les guillemets, contrairement au rendu de texte.
 */
function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function formatText(content) {
    if (!content) return '';
    return escapeHtml(content)
        .replace(/#(\w+)/g, '<span class="hashtag" style="color:var(--primary);font-weight:700;cursor:pointer" onclick="searchByHashtag(\'$1\')">#$1</span>')
        .replace(/@(\w+)/g, '<span class="mention" style="color:var(--primary-light);font-weight:700;cursor:pointer" onclick="openUserByHandle(\'$1\')">@$1</span>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline">$1</a>')
        .replace(/\n/g, '<br>');
}

// ----------------------------------------------
// DATES
// ----------------------------------------------
function timeSince(date) {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' an' + (interval > 1 ? 's' : '');
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' mois';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' j';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' h';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' min';
    
    return 'À l\'instant';
}

function formatDate(dateStr, options = {}) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    });
}

// ----------------------------------------------
// DÉBOUNCE (pour recherche, etc.)
// ----------------------------------------------
function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// ----------------------------------------------
// GESTION DES ERREURS
// ----------------------------------------------
function handleError(error, context = '') {
    console.error(`[HubISoccer Error] ${context}:`, error);
    const message = error?.message || 'Une erreur inattendue est survenue.';
    toast(context ? `${context} : ${message}` : message, 'error');
}

// ============================================================
// CHANTIER 18 — LA CARTE DE TOURNOI
// ------------------------------------------------------------
// POURQUOI ELLE EST ICI
//
// Le gestionnaire de tournoi et le fil vivaient dans la meme
// base sans jamais se parler. Un tournoi pouvait se jouer en
// entier, couronner un champion, et le fil n'en savait rien.
//
// Depuis le chantier 18, l'organisateur publie ses moments dans
// le fil. Ces publications portent un event_data enrichi :
//
//     { title, date, location,            <- ce que le fil sait deja
//       hubisoccer: { type: 'tournoi', ... } }   <- le bloc en plus
//
// Cette fonction dessine le bloc en plus. Elle vit dans utils.js
// parce que DIX pages de la communaute chargent ce fichier :
// une seule definition, et la carte est la meme partout.
//
// CE QU'ELLE NE CASSE PAS
//
// Elle rend une chaine VIDE pour tout event_data ordinaire. Une
// publication d'evenement classique garde donc exactement la
// carte qu'elle avait avant, au pixel pres.
// ============================================================

function carteDeTournoiHtml(evenement) {
    if (!evenement) return '';

    let evt = evenement;
    if (typeof evt === 'string') {
        try { evt = JSON.parse(evt); } catch (e) { return ''; }
    }

    const h = evt && evt.hubisoccer;
    if (!h || h.type !== 'tournoi') return '';

    // Le bandeau du haut change selon le moment publie.
    const GENRES = {
        annonce:       { icone: 'fa-bullhorn',        mot: 'Tournoi ouvert' },
        resultat:      { icone: 'fa-futbol',          mot: 'Résultat' },
        qualification: { icone: 'fa-ticket',          mot: 'Qualification' },
        palmares:      { icone: 'fa-trophy',          mot: 'Palmarès' }
    };
    const genre = GENRES[h.genre] || GENRES.annonce;

    // Le score, quand il y en a un. C'est la partie qu'on lit en
    // premier : elle passe en gros, avec la police chiffree.
    let scoreHtml = '';
    if (h.equipe_a || h.equipe_b) {
        const sa = (h.score_a === null || h.score_a === undefined) ? '' : h.score_a;
        const sb = (h.score_b === null || h.score_b === undefined) ? '' : h.score_b;
        const score = (sa === '' && sb === '') ? 'vs' : (sa + ' - ' + sb);

        let tirs = '';
        if (h.tirs_a !== null && h.tirs_a !== undefined) {
            tirs = '<div class="ct-tirs">tirs au but ' + escapeHtml(String(h.tirs_a)) +
                   ' - ' + escapeHtml(String(h.tirs_b === null || h.tirs_b === undefined ? 0 : h.tirs_b)) +
                   '</div>';
        }

        scoreHtml =
            '<div class="ct-score-ligne">' +
              '<span class="ct-equipe">' + escapeHtml(h.equipe_a || 'Équipe A') + '</span>' +
              '<span class="ct-score">' + escapeHtml(String(score)) + '</span>' +
              '<span class="ct-equipe">' + escapeHtml(h.equipe_b || 'Équipe B') + '</span>' +
            '</div>' + tirs;
    }

    // Un titre libre : « Demi-finales », « Vainqueur : … ».
    const titreHtml = h.titre
        ? '<div class="ct-titre">' + escapeHtml(h.titre) + '</div>' : '';
    const detailHtml = h.detail
        ? '<div class="ct-detail">' + escapeHtml(h.detail) + '</div>' : '';

    // Les reperes : dates, lieu, sport.
    const reperes = [];
    if (h.debut) {
        let quand = '';
        try {
            quand = new Date(h.debut).toLocaleDateString('fr-FR',
                { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) { quand = ''; }
        if (quand) reperes.push('<span><i class="fas fa-calendar-days"></i> ' + escapeHtml(quand) + '</span>');
    }
    if (h.lieu)  reperes.push('<span><i class="fas fa-location-dot"></i> ' + escapeHtml(h.lieu) + '</span>');
    if (h.sport) reperes.push('<span><i class="fas fa-futbol"></i> ' + escapeHtml(h.sport) + '</span>');

    const embleme = h.logo_url
        ? '<img class="ct-logo" src="' + escapeAttr(h.logo_url) + '" alt="" loading="lazy">'
        : '<div class="ct-logo-vide"><i class="fas fa-trophy"></i></div>';

    // Le bouton. Sans lien, pas de bouton mort : on n'affiche
    // rien plutot qu'un bouton qui ne mene nulle part.
    const bouton = h.lien
        ? '<a class="ct-bouton" href="' + escapeAttr(h.lien) + '" target="_blank" rel="noopener">' +
          'Suivre le tournoi <i class="fas fa-arrow-right"></i></a>'
        : '';

    return '' +
        '<div class="carte-tournoi-post">' +
          '<div class="ct-bandeau"><i class="fas ' + genre.icone + '"></i> ' + genre.mot + '</div>' +
          '<div class="ct-corps">' +
            embleme +
            '<div class="ct-texte">' +
              '<div class="ct-nom">' + escapeHtml(h.nom || 'Tournoi') + '</div>' +
              titreHtml + scoreHtml + detailHtml +
              (reperes.length ? '<div class="ct-reperes">' + reperes.join('') + '</div>' : '') +
            '</div>' +
          '</div>' +
          bouton +
        '</div>';
}

// ============================================================
// LOT A — DIRE POURQUOI, EN FRANÇAIS
// ------------------------------------------------------------
// feed.js appelait déjà describeDbError()… qui n'existait NULLE
// PART. Le « typeof » de garde sauvait la page, et le message
// brut de Postgres passait tel quel :
//
//     column supabaseAuthPrive_posts.truc does not exist
//
// Exact, et illisible pour qui n'écrit pas de SQL.
//
// Cette fonction traduit les codes qu'on rencontre vraiment,
// et dit QUOI FAIRE. Elle garde le message technique à la fin :
// c'est lui qui me sert, à moi, quand tu me le recopies.
// ============================================================

function describeDbError(erreur) {
    if (!erreur) return 'cause inconnue';

    const code = String(erreur.code || '');
    const brut = erreur.message || String(erreur);

    const CAS = {
        '42703': 'une colonne manque dans la base',
        '42P01': 'une table manque dans la base',
        '42501': 'la base a refusé l’accès (droits insuffisants)',
        '23505': 'cette valeur existe déjà',
        '23503': 'une référence pointe vers quelque chose qui n’existe pas',
        '23502': 'un champ obligatoire est vide',
        '22P02': 'une valeur n’a pas le bon format',
        'PGRST200': 'la base ne sait pas relier ces deux tables',
        'PGRST201': 'la base trouve plusieurs liens possibles entre ces tables',
        'PGRST116': 'aucune ligne ne correspond'
    };

    let phrase = CAS[code];

    if (!phrase) {
        // Pas de code : on reconnaît les pannes de réseau, qui
        // sont les plus fréquentes sur une connexion mobile.
        if (/Failed to fetch|NetworkError|network/i.test(brut)) {
            return 'connexion perdue — vérifie ta connexion et réessaie';
        }
        if (/JWT|token|expired/i.test(brut)) {
            return 'ta session a expiré — reconnecte-toi';
        }
        return brut;
    }

    // Ce qu'il y a à faire, quand il y a quelque chose à faire.
    if (code === '42703' || code === '42P01') {
        phrase += ' — préviens l’administrateur, le script de mise à jour n’a pas été passé';
    } else if (code === 'PGRST200' || code === 'PGRST201') {
        phrase += ' — l’affichage se fait quand même, en plusieurs lectures';
    }

    return phrase + ' (' + code + ' : ' + brut + ')';
}

// ============================================================
// LOT A — UN CHIFFRE QU'ON N'A PAS PU VÉRIFIER LE DIT
// ------------------------------------------------------------
// Les compteurs (j'aime, commentaires, publications) s'affichent
// d'abord de façon optimiste — « +1 tout de suite » — puis se
// recalent sur la base.
//
// Quand le recalage échouait, il rendait null et s'arrêtait là.
// Le chiffre optimiste restait à l'écran, faux, et personne ne
// le savait. À force, l'écart devient visible et on ne sait plus
// à quel nombre se fier.
//
// Ici : le chiffre prend un « ~ » et une infobulle. Et un seul
// message par session — pas un par j'aime, ce serait
// insupportable.
// ============================================================

let _compteursNonVerifiesSignale = false;

function marquerCompteurNonVerifie(element, motif) {
    if (!element) return;

    const brut = (element.textContent || '').replace(/^~/, '').trim();
    element.textContent = '~' + brut;
    element.title = 'Chiffre approximatif : il n’a pas pu être vérifié auprès de la base'
                  + (motif ? ' (' + motif + ')' : '')
                  + '. Il se recalera au prochain rechargement.';
    element.classList.add('compteur-approximatif');

    if (!_compteursNonVerifiesSignale) {
        _compteursNonVerifiesSignale = true;
        toast('Certains compteurs n’ont pas pu être vérifiés et sont approximatifs — ' +
              'ils portent un « ~ ». Ils se recaleront au rechargement.', 'warning');
    }
}

// ----------------------------------------------
// EXPOSITION GLOBALE
// ----------------------------------------------
window.toast = toast;
window.setLoader = setLoader;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
window.getInitials = getInitials;
window.formatText = formatText;
window.timeSince = timeSince;
window.formatDate = formatDate;
window.debounce = debounce;
window.handleError = handleError;
window.carteDeTournoiHtml = carteDeTournoiHtml;
window.describeDbError = describeDbError;
window.marquerCompteurNonVerifie = marquerCompteurNonVerifie;

// Raccourci pour fermer les modales avec Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});
