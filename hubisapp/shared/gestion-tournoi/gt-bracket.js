/* ============================================================
   HubISoccer — gt-bracket.js
   Système Gestion Tournois — Tableau à élimination directe
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   Un tournoi à élimination directe se lit comme un arbre, pas
   comme une liste. Le module affiche les tours en pastilles et
   les affiches deux par deux, le vainqueur remontant vers le
   tour suivant — la présentation que tu m'as montrée en capture.

   IL LIT, IL N'ÉCRIT PAS

   Aucune modification en base. Le module reçoit les rencontres
   déjà chargées et les dessine. Il sert donc aussi bien sur la
   page publique d'un tournoi que dans l'espace de gestion.

   UTILISATION

       GTBracket.dessiner({
           conteneur : 'bracketZone',
           matchs    : rencontres,      // lignes gt_matches
           equipes   : { 12: 'PSG', … } // id -> nom
           logos     : { 12: 'url', … } // facultatif
           surClic   : function (idMatch) { … }   // facultatif
       });

   FORMAT ATTENDU DES RENCONTRES
       round             libellé du tour, ex. « Quarts de finale »
       bracket_position  rang dans le tour, à partir de 1
       leg               1 = aller, 2 = retour
       is_bye            true si exemption
       team_a_id, team_b_id, score_a, score_b, status, match_date

   Les rencontres sans bracket_position sont ignorées : elles
   appartiennent à un championnat, pas à un tableau.
   ============================================================ */
'use strict';

window.GTBracket = (function () {

    // Ordre d'affichage des tours, du plus lointain au plus proche
    // de la finale. Ce qui n'est pas listé passe en tête, dans
    // l'ordre d'apparition — c'est le cas des tours préliminaires
    // nommés librement par l'organisateur.
    var ORDRE_TOURS = [
        '128es de finale', '64es de finale', '32es de finale', '16es de finale',
        'Huitièmes de finale', 'Quarts de finale', 'Demi-finales',
        'Match pour la 3e place', 'Finale'
    ];

    var CODES = {
        '128es de finale': '1/128', '64es de finale': '1/64', '32es de finale': '1/32',
        '16es de finale': '1/16', 'Huitièmes de finale': '1/8', 'Quarts de finale': '1/4',
        'Demi-finales': '1/2', 'Match pour la 3e place': '3e', 'Finale': 'F'
    };

    function echapper(v) {
        if (v === null || v === undefined) return '';
        return String(v).replace(/[&<>"]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
        });
    }

    function initiales(nom) {
        if (!nom) return '?';
        var mots = String(nom).trim().split(/\s+/);
        if (mots.length >= 2) return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
        return nom.substring(0, 2).toUpperCase();
    }

    // Nom de tour débarrassé du suffixe « — retour », pour que
    // l'aller et le retour se rangent dans la même colonne.
    function tourDeBase(nom) {
        return String(nom || '').replace(/\s*—\s*retour\s*$/i, '').trim();
    }

    // ═══════════════════════════════════════════════════════════
    // 1. REGROUPEMENT PAR TOUR PUIS PAR POSITION
    // ═══════════════════════════════════════════════════════════
    function organiser(matchs) {
        var parTour = {};

        matchs.forEach(function (m) {
            if (m.bracket_position === null || m.bracket_position === undefined) return;
            var tour = tourDeBase(m.round);
            if (!tour) return;
            if (!parTour[tour]) parTour[tour] = {};
            var position = m.bracket_position;
            if (!parTour[tour][position]) parTour[tour][position] = { position: position, manches: [] };
            parTour[tour][position].manches.push(m);
        });

        var noms = Object.keys(parTour);
        noms.sort(function (a, b) {
            var ia = ORDRE_TOURS.indexOf(a);
            var ib = ORDRE_TOURS.indexOf(b);
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return -1;      // tours préliminaires en tête
            if (ib === -1) return 1;
            return ia - ib;
        });

        return noms.map(function (nom) {
            var affiches = Object.keys(parTour[nom])
                .map(function (k) { return parTour[nom][k]; })
                .sort(function (x, y) { return x.position - y.position; });
            affiches.forEach(function (a) {
                a.manches.sort(function (x, y) { return (x.leg || 1) - (y.leg || 1); });
            });
            return { nom: nom, code: CODES[nom] || nom, affiches: affiches };
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 2. QUI A GAGNÉ ?
    //    Sur une double confrontation, on additionne les deux
    //    manches. Une exemption qualifie d'office.
    // ═══════════════════════════════════════════════════════════
    function vainqueur(affiche) {
        var manches = affiche.manches;
        var premiere = manches[0];

        if (premiere.is_bye) return premiere.team_a_id;

        var termineesToutes = manches.every(function (m) { return m.status === 'completed'; });
        if (!termineesToutes) return null;

        var cumulA = 0, cumulB = 0;
        var domicileAller = premiere.team_a_id;

        manches.forEach(function (m) {
            var a = m.score_a || 0;
            var b = m.score_b || 0;
            if (m.team_a_id === domicileAller) { cumulA += a; cumulB += b; }
            else                               { cumulA += b; cumulB += a; }
        });

        if (cumulA > cumulB) return domicileAller;
        if (cumulB > cumulA) return premiere.team_b_id;
        return null;   // égalité : départage non tranché ici
    }

    // ═══════════════════════════════════════════════════════════
    // 3. RENDU D'UNE AFFICHE
    // ═══════════════════════════════════════════════════════════
    function ligneEquipe(idEquipe, score, estVainqueur, estPerdant, equipes, logos, texteVide) {
        var nom = idEquipe ? (equipes[idEquipe] || 'Équipe ' + idEquipe) : (texteVide || 'À définir');
        var logo = idEquipe && logos && logos[idEquipe]
            ? '<img src="' + echapper(logos[idEquipe]) + '" alt="">'
            : '<span class="gtb-initiales">' + echapper(idEquipe ? initiales(nom) : '—') + '</span>';

        var classes = 'gtb-equipe';
        if (estVainqueur) classes += ' gtb-gagne';
        if (estPerdant)   classes += ' gtb-perd';
        if (!idEquipe)    classes += ' gtb-attente';

        return '<div class="' + classes + '">' +
                    '<span class="gtb-logo">' + logo + '</span>' +
                    '<span class="gtb-nom">' + echapper(nom) + '</span>' +
                    '<span class="gtb-score">' + (score === null || score === undefined ? '' : score) + '</span>' +
               '</div>';
    }

    function rendreAffiche(affiche, equipes, logos) {
        var manches = affiche.manches;
        var premiere = manches[0];
        var gagnant = vainqueur(affiche);

        // Score affiché : cumul si double confrontation
        var scoreA = null, scoreB = null;
        var joue = manches.some(function (m) { return m.status === 'completed'; });
        if (joue && !premiere.is_bye) {
            scoreA = 0; scoreB = 0;
            var domicileAller = premiere.team_a_id;
            manches.forEach(function (m) {
                if (m.status !== 'completed') return;
                var a = m.score_a || 0, b = m.score_b || 0;
                if (m.team_a_id === domicileAller) { scoreA += a; scoreB += b; }
                else                               { scoreA += b; scoreB += a; }
            });
        }

        var enDirect = manches.some(function (m) { return m.status === 'live'; });

        var etiquette = '';
        if (premiere.is_bye)      etiquette = '<span class="gtb-etiquette gtb-exempt">Exempt</span>';
        else if (enDirect)        etiquette = '<span class="gtb-etiquette gtb-direct">En direct</span>';
        else if (manches.length > 1) etiquette = '<span class="gtb-etiquette">Aller-retour</span>';
        else if (!joue && premiere.match_date) {
            var d = new Date(premiere.match_date);
            if (!isNaN(d.getTime())) {
                etiquette = '<span class="gtb-etiquette">' +
                    d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + '</span>';
            }
        }

        return '<div class="gtb-affiche" data-match="' + echapper(premiere.id) + '">' +
                    (etiquette ? '<div class="gtb-affiche-tete">' + etiquette + '</div>' : '') +
                    ligneEquipe(premiere.team_a_id, scoreA,
                                gagnant && gagnant === premiere.team_a_id,
                                gagnant && gagnant !== premiere.team_a_id,
                                equipes, logos) +
                    ligneEquipe(premiere.team_b_id, scoreB,
                                gagnant && gagnant === premiere.team_b_id,
                                gagnant && premiere.team_b_id && gagnant !== premiere.team_b_id,
                                equipes, logos,
                                premiere.is_bye ? 'Pas d\'adversaire' : null) +
               '</div>';
    }

    // ═══════════════════════════════════════════════════════════
    // 4. RENDU COMPLET
    // ═══════════════════════════════════════════════════════════
    function dessiner(options) {
        options = options || {};
        var hote = document.getElementById(options.conteneur || 'bracketZone');
        if (!hote) return;

        var equipes = options.equipes || {};
        var logos = options.logos || null;
        var tours = organiser(options.matchs || []);

        if (!tours.length) {
            hote.className = 'gtb';
            hote.innerHTML = '<div class="gtb-vide">' +
                '<i class="fas fa-sitemap"></i>' +
                '<p>Aucun tableau à élimination directe pour ce tournoi.</p>' +
                '<span>Il apparaîtra dès que le calendrier d\'une phase finale sera généré.</span>' +
                '</div>';
            return;
        }

        var pastilles = tours.map(function (t, index) {
            return '<button type="button" class="gtb-pastille' + (index === 0 ? ' active' : '') +
                   '" data-tour="' + index + '">' + echapper(t.code) + '</button>';
        }).join('');

        var colonnes = tours.map(function (t, index) {
            return '<div class="gtb-colonne" data-tour="' + index + '">' +
                        '<h4 class="gtb-colonne-titre">' + echapper(t.nom) + '</h4>' +
                        '<div class="gtb-affiches">' +
                            t.affiches.map(function (a) { return rendreAffiche(a, equipes, logos); }).join('') +
                        '</div>' +
                   '</div>';
        }).join('');

        hote.className = 'gtb';
        hote.innerHTML =
            '<div class="gtb-pastilles" role="tablist">' + pastilles + '</div>' +
            '<div class="gtb-plateau">' + colonnes + '</div>';

        // Les pastilles font défiler jusqu'au tour choisi : sur
        // mobile, le tableau est trop large pour être vu d'un coup.
        var plateau = hote.querySelector('.gtb-plateau');
        hote.querySelectorAll('.gtb-pastille').forEach(function (bouton) {
            bouton.addEventListener('click', function () {
                hote.querySelectorAll('.gtb-pastille').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                var colonne = hote.querySelector('.gtb-colonne[data-tour="' + this.dataset.tour + '"]');
                if (colonne && plateau) {
                    plateau.scrollTo({ left: colonne.offsetLeft - 12, behavior: 'smooth' });
                }
            });
        });

        if (typeof options.surClic === 'function') {
            hote.querySelectorAll('.gtb-affiche').forEach(function (carte) {
                carte.classList.add('gtb-cliquable');
                carte.addEventListener('click', function () { options.surClic(this.dataset.match); });
            });
        }
    }

    return { dessiner: dessiner, organiser: organiser, vainqueur: vainqueur };

})();
