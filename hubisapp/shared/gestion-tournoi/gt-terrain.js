/* ============================================================
   HubISoccer — gt-terrain.js
   Systeme Gestion Tournois — geometrie du terrain et formations
   ------------------------------------------------------------
   CE QUE FAIT CE FICHIER

   Il calcule des positions. Rien d'autre.
   Aucun acces au DOM, aucun appel reseau, aucune dependance.
   On peut le charger dans un test en ligne de commande et
   verifier chaque placement sans navigateur.

   POURQUOI IL EXISTE

   La composition tenait dans quatre lignes empilees :
     rowAttaquants, rowMilieux, rowDefenseurs, rowGardien
   Quatre <div> en flex, remplis dans l'ordre d'arrivee. Aucune
   position reelle, aucune formation, aucun format autre que le
   football a 11 sous-entendu, et rien qui puisse se deplacer.

   Ici, chaque poste a des coordonnees x / y en pourcentage du
   terrain. Un sportif ne se range plus dans une ligne : il se
   pose a un endroit, et cet endroit se retient.

   LE REPERE

     x = 0    ligne de touche gauche
     x = 100  ligne de touche droite
     y = 0    ligne de but adverse   — on attaque vers le haut
     y = 100  sa propre ligne de but — le gardien est en bas

   Ce repere ne depend d'aucune taille d'ecran. Un placement
   enregistre sur telephone se retrouve identique sur ordinateur.

   AJOUTER UN SPORT

   Une entree dans SPORTS. Le football est le premier cas parce
   que c'est celui que tu construis d'abord ; le basket, le
   volley et le handball sont deja la pour montrer que la page
   n'a rien de specifique au football. Aucune page n'est a
   retoucher pour en ajouter un autre.
   ============================================================ */

window.GTTerrain = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. OUTILS
    // ═══════════════════════════════════════════════════════

    function nombre(v) {
        var n = Number(v);
        return isFinite(n) ? n : 0;
    }

    function borner(v, mini, maxi) {
        if (v < mini) return mini;
        if (v > maxi) return maxi;
        return v;
    }

    function arrondir(v, decimales) {
        var f = Math.pow(10, decimales == null ? 1 : decimales);
        return Math.round(nombre(v) * f) / f;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LES SPORTS
    // -------------------------------------------------------
    // dimensions : la taille reglementaire courante, en metres.
    //   L'organisateur peut la remplacer par la vraie taille de
    //   son terrain (point 23) ; ces valeurs ne sont qu'un
    //   depart raisonnable.
    // formats : combien de sportifs sur le terrain, gardien
    //   compris.
    // marquages : le nom du jeu de lignes que la feuille de
    //   style doit dessiner. Aucune image, tout en CSS.
    // ═══════════════════════════════════════════════════════

    var SPORTS = {
        football: {
            code: 'football',
            nom: 'Football',
            nomSportif: 'Footballeur',
            nomSportifs: 'Footballeurs',
            marquages: 'football',
            gardien: true,
            // Rapport largeur / longueur du dessin.
            proportion: 68 / 105,
            formats: [5, 6, 7, 8, 9, 11],
            formatParDefaut: 11,
            dimensions: {
                5:  { longueur: 40,  largeur: 20 },
                6:  { longueur: 50,  largeur: 30 },
                7:  { longueur: 60,  largeur: 40 },
                8:  { longueur: 70,  largeur: 45 },
                9:  { longueur: 80,  largeur: 50 },
                11: { longueur: 105, largeur: 68 }
            },
            bornes: { longueurMin: 25, longueurMax: 120, largeurMin: 15, largeurMax: 90 }
        },

        basket: {
            code: 'basket',
            nom: 'Basket-ball',
            nomSportif: 'Basketteur',
            nomSportifs: 'Basketteurs',
            marquages: 'basket',
            gardien: false,
            proportion: 15 / 28,
            formats: [3, 5],
            formatParDefaut: 5,
            dimensions: {
                3: { longueur: 15, largeur: 11 },
                5: { longueur: 28, largeur: 15 }
            },
            bornes: { longueurMin: 12, longueurMax: 32, largeurMin: 9, largeurMax: 18 }
        },

        volley: {
            code: 'volley',
            nom: 'Volley-ball',
            nomSportif: 'Volleyeur',
            nomSportifs: 'Volleyeurs',
            marquages: 'volley',
            gardien: false,
            proportion: 9 / 9,
            formats: [2, 4, 6],
            formatParDefaut: 6,
            dimensions: {
                2: { longueur: 8, largeur: 8 },
                4: { longueur: 9, largeur: 9 },
                6: { longueur: 9, largeur: 9 }
            },
            bornes: { longueurMin: 6, longueurMax: 12, largeurMin: 6, largeurMax: 12 }
        },

        handball: {
            code: 'handball',
            nom: 'Handball',
            nomSportif: 'Handballeur',
            nomSportifs: 'Handballeurs',
            marquages: 'handball',
            gardien: true,
            proportion: 20 / 40,
            formats: [5, 7],
            formatParDefaut: 7,
            dimensions: {
                5: { longueur: 28, largeur: 15 },
                7: { longueur: 40, largeur: 20 }
            },
            bornes: { longueurMin: 20, longueurMax: 45, largeurMin: 12, largeurMax: 25 }
        }
    };

    // Le sport d'un tournoi arrive sous forme de texte libre
    // (« Football », « FOOT », « football à 7 »…). On le ramene
    // a une entree connue, et on retombe sur le football quand
    // on ne reconnait rien — c'est le premier cas du module.
    function sportPour(nomOuCode) {
        if (!nomOuCode) return SPORTS.football;
        var t = String(nomOuCode).toLowerCase();
        var cle;
        for (cle in SPORTS) {
            if (!Object.prototype.hasOwnProperty.call(SPORTS, cle)) continue;
            if (t.indexOf(cle) !== -1) return SPORTS[cle];
            if (t.indexOf(SPORTS[cle].nom.toLowerCase()) !== -1) return SPORTS[cle];
        }
        if (t.indexOf('foot') !== -1 || t.indexOf('soccer') !== -1) return SPORTS.football;
        if (t.indexOf('hand') !== -1) return SPORTS.handball;
        if (t.indexOf('basket') !== -1) return SPORTS.basket;
        if (t.indexOf('volley') !== -1) return SPORTS.volley;
        return SPORTS.football;
    }

    // Dimensions par defaut d'un sport pour un format donne.
    function dimensionsParDefaut(sport, format) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var f = nombre(format) || s.formatParDefaut;
        if (s.dimensions[f]) return { longueur: s.dimensions[f].longueur, largeur: s.dimensions[f].largeur };
        var plusGrand = s.dimensions[s.formatParDefaut];
        return { longueur: plusGrand.longueur, largeur: plusGrand.largeur };
    }

    // Les dimensions saisies par l'organisateur, ramenees dans
    // des bornes credibles. Un terrain de 4 metres de long
    // casserait le dessin sans rien apprendre a personne.
    function dimensionsValides(sport, format, saisie) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var defaut = dimensionsParDefaut(s, format);
        var d = saisie || {};
        var longueur = nombre(d.longueur) || defaut.longueur;
        var largeur = nombre(d.largeur) || defaut.largeur;
        return {
            longueur: arrondir(borner(longueur, s.bornes.longueurMin, s.bornes.longueurMax), 1),
            largeur: arrondir(borner(largeur, s.bornes.largeurMin, s.bornes.largeurMax), 1),
            parDefaut: !nombre(d.longueur) && !nombre(d.largeur)
        };
    }

    // ═══════════════════════════════════════════════════════
    // 3. LES FORMATIONS
    // -------------------------------------------------------
    // Une formation, c'est une suite de lignes : le nombre de
    // sportifs de champ dans chacune, du plus defensif au plus
    // offensif. Le gardien n'y figure pas, il est ajoute par le
    // calcul quand le sport en a un.
    //
    // On ne decrit donc PAS 60 formations a la main : on decrit
    // leurs lignes, et placer() en deduit les coordonnees. Une
    // formation nouvelle, c'est une ligne dans ce tableau.
    // ═══════════════════════════════════════════════════════

    var FORMATIONS = {
        football: {
            5:  [[2, 2], [1, 2, 1], [2, 1, 1], [1, 1, 2], [3, 1], [1, 3]],
            6:  [[2, 2, 1], [3, 2], [2, 3], [1, 2, 2], [2, 1, 2], [3, 1, 1]],
            7:  [[3, 2, 1], [2, 3, 1], [3, 1, 2], [2, 2, 2], [1, 3, 2], [3, 3]],
            8:  [[3, 3, 1], [3, 2, 2], [4, 2, 1], [2, 3, 2], [3, 1, 3], [4, 3]],
            9:  [[3, 3, 2], [4, 3, 1], [3, 4, 1], [4, 2, 2], [2, 4, 2], [3, 2, 3]],
            11: [
                [4, 4, 2], [4, 3, 3], [4, 2, 3, 1], [3, 5, 2], [3, 4, 3],
                [5, 3, 2], [4, 1, 4, 1], [4, 4, 1, 1], [4, 5, 1], [5, 4, 1],
                [4, 2, 2, 2], [3, 4, 1, 2], [4, 3, 2, 1], [4, 1, 2, 1, 2],
                [3, 6, 1], [5, 2, 3], [4, 2, 4], [3, 3, 3, 1]
            ]
        },
        handball: {
            5:  [[3, 1], [2, 2], [1, 3]],
            7:  [[3, 3], [2, 4], [3, 2, 1], [4, 2]]
        },
        basket: {
            3:  [[2, 1], [1, 2], [3]],
            5:  [[2, 2, 1], [1, 3, 1], [2, 1, 2], [3, 2]]
        },
        volley: {
            2:  [[1, 1]],
            4:  [[2, 2]],
            6:  [[3, 3], [2, 2, 2]]
        }
    };

    // « 4-3-3 » depuis [4,3,3], et l'inverse.
    function codeFormation(lignes) {
        return (lignes || []).join('-');
    }

    function lignesDepuisCode(code) {
        if (!code) return null;
        var parts = String(code).split('-').map(function (x) { return parseInt(x, 10); });
        if (!parts.length || parts.some(function (n) { return !isFinite(n) || n <= 0; })) return null;
        return parts;
    }

    // La liste proposee dans le selecteur, pour un sport et un
    // format donnes.
    function formationsPour(sport, format) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var f = nombre(format) || s.formatParDefaut;
        var table = FORMATIONS[s.code] || {};
        var lignes = table[f];

        if (!lignes || !lignes.length) {
            // Format inconnu du catalogue : on en fabrique une
            // seule, repartie au mieux, plutot que de ne rien
            // proposer.
            var deChamp = Math.max(0, f - (s.gardien ? 1 : 0));
            lignes = [repartirAuMieux(deChamp)];
        }

        return lignes.map(function (l) {
            return { code: codeFormation(l), lignes: l.slice(), nom: codeFormation(l) };
        });
    }

    // Repartition de secours : trois lignes aussi egales que
    // possible, la defense servie en premier.
    function repartirAuMieux(deChamp) {
        if (deChamp <= 0) return [];
        if (deChamp <= 3) return [deChamp];
        var base = Math.floor(deChamp / 3);
        var reste = deChamp % 3;
        var l = [base, base, base];
        var i = 0;
        while (reste > 0) { l[i] += 1; reste--; i++; }
        return l;
    }

    function formationParDefaut(sport, format) {
        var liste = formationsPour(sport, format);
        return liste.length ? liste[0].code : null;
    }

    // ═══════════════════════════════════════════════════════
    // 4. LE PLACEMENT
    // -------------------------------------------------------
    // placer() transforme une formation en coordonnees.
    //
    // Les lignes s'etagent entre Y_DEFENSE et Y_ATTAQUE ; le
    // gardien reste a Y_GARDIEN. Dans une ligne, les postes se
    // repartissent regulierement puis se resserrent legerement
    // vers l'axe, pour que les ailiers ne touchent pas la ligne
    // de touche.
    // ═══════════════════════════════════════════════════════

    var Y_GARDIEN = 90;
    var Y_DEFENSE = 74;
    var Y_ATTAQUE = 15;
    var RESSERRAGE = 0.86;   // 1 = etale d'un bord a l'autre

    function xDansLaLigne(index, total) {
        if (total <= 1) return 50;
        var brut = (100 * (index + 1)) / (total + 1);
        return arrondir(50 + (brut - 50) * RESSERRAGE, 1);
    }

    function yDeLaLigne(index, total) {
        if (total <= 1) return arrondir((Y_DEFENSE + Y_ATTAQUE) / 2, 1);
        return arrondir(Y_DEFENSE - (index * (Y_DEFENSE - Y_ATTAQUE)) / (total - 1), 1);
    }

    // Le groupe large d'une ligne — celui que la page utilise
    // deja pour ranger les postes precis.
    function groupeDeLaLigne(index, total) {
        if (total === 1) return 'Milieu';
        if (index === 0) return 'Défenseur';
        if (index === total - 1) return 'Attaquant';
        return 'Milieu';
    }

    // Le nom d'un poste, deduit de sa place dans sa ligne.
    // « Arrière droit » plutot que « Défenseur 1 ».
    var COTES_DEFENSE  = ['Arrière droit', 'Défenseur central', 'Défenseur central', 'Arrière gauche'];
    var COTES_MILIEU   = ['Milieu droit', 'Milieu central', 'Milieu central', 'Milieu gauche'];
    var COTES_ATTAQUE  = ['Ailier droit', 'Attaquant', 'Attaquant', 'Ailier gauche'];

    function nommerPoste(groupe, index, total) {
        if (groupe === 'Gardien') return 'Gardien de but';

        var table = groupe === 'Défenseur' ? COTES_DEFENSE
                  : groupe === 'Attaquant' ? COTES_ATTAQUE
                  : COTES_MILIEU;

        if (total === 1) return table[1];
        if (total === 2) return index === 0 ? table[0] : table[3];
        if (total === 3) return index === 0 ? table[0] : (index === 1 ? table[1] : table[3]);
        if (index === 0) return table[0];
        if (index === total - 1) return table[3];
        return table[1];
    }

    // Entree  : un code de formation (« 4-3-3 ») ou un tableau
    //           de lignes, plus le sport.
    // Sortie  : un tableau d'emplacements
    //           { cle, x, y, groupe, libelle, ligne, rang }
    function placer(formation, sport) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var lignes = Array.isArray(formation) ? formation.slice() : lignesDepuisCode(formation);
        if (!lignes) return [];

        var emplacements = [];

        if (s.gardien) {
            emplacements.push({
                cle: 'gk',
                x: 50,
                y: Y_GARDIEN,
                groupe: 'Gardien',
                libelle: 'Gardien de but',
                ligne: -1,
                rang: 0
            });
        }

        lignes.forEach(function (nb, iLigne) {
            var groupe = groupeDeLaLigne(iLigne, lignes.length);
            for (var i = 0; i < nb; i++) {
                emplacements.push({
                    cle: 'l' + iLigne + 'p' + i,
                    x: xDansLaLigne(i, nb),
                    y: yDeLaLigne(iLigne, lignes.length),
                    groupe: groupe,
                    libelle: nommerPoste(groupe, i, nb),
                    ligne: iLigne,
                    rang: i
                });
            }
        });

        return emplacements;
    }

    // Combien de sportifs une formation met sur le terrain.
    function effectifDeLaFormation(formation, sport) {
        return placer(formation, sport).length;
    }

    // ═══════════════════════════════════════════════════════
    // 5. RECONNAITRE UNE FORMATION EXISTANTE
    // -------------------------------------------------------
    // Une composition deja enregistree n'a que des coordonnees.
    // Pour reafficher le bon nom dans le selecteur, on cherche
    // la formation du catalogue dont les lignes correspondent.
    // ═══════════════════════════════════════════════════════

    function deduireFormation(positions, sport) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var deChamp = (positions || []).filter(function (p) {
            return p && nombre(p.y) < Y_GARDIEN - 8;
        });
        if (!deChamp.length) return null;

        // On regroupe par bande horizontale : deux sportifs
        // separes de moins de 9 points de y sont sur la meme
        // ligne.
        var tries = deChamp.slice().sort(function (a, b) { return nombre(b.y) - nombre(a.y); });
        var lignes = [];
        var courante = [tries[0]];

        for (var i = 1; i < tries.length; i++) {
            if (Math.abs(nombre(tries[i].y) - nombre(courante[0].y)) <= 9) {
                courante.push(tries[i]);
            } else {
                lignes.push(courante);
                courante = [tries[i]];
            }
        }
        lignes.push(courante);

        var compte = lignes.map(function (l) { return l.length; });
        var code = codeFormation(compte);

        // Le code correspond-il a une formation connue ?
        var connues = formationsPour(s, compte.reduce(function (a, b) { return a + b; }, 0) + (s.gardien ? 1 : 0));
        var trouvee = connues.filter(function (f) { return f.code === code; })[0];

        return {
            code: code,
            lignes: compte,
            connue: !!trouvee,
            nom: trouvee ? trouvee.nom : code
        };
    }

    // ═══════════════════════════════════════════════════════
    // 6. AFFECTER L'EFFECTIF AUX EMPLACEMENTS
    // -------------------------------------------------------
    // Quand l'organisateur choisit une formation, il ne veut pas
    // replacer onze personnes a la main. On lui propose un
    // premier remplissage : chacun a l'emplacement qui
    // correspond le mieux a son poste declare.
    //
    // La regle : d'abord le gardien, puis chaque emplacement
    // recoit le sportif encore libre dont le groupe de poste
    // correspond ; s'il n'y en a plus, n'importe quel autre.
    // Personne n'est laisse de cote tant qu'il reste une place.
    // ═══════════════════════════════════════════════════════

    function affecter(emplacements, sportifs, options) {
        options = options || {};
        var places = (emplacements || []).slice();
        var restants = (sportifs || []).slice();
        var affectation = [];
        var pris = {};

        function groupeDe(sportif) {
            if (!sportif) return null;
            if (sportif.groupe) return sportif.groupe;
            if (sportif.position_category) return sportif.position_category;
            if (options.groupePour) return options.groupePour(sportif);
            return null;
        }

        function prendre(predicat) {
            for (var i = 0; i < restants.length; i++) {
                var s = restants[i];
                if (pris[i]) continue;
                if (predicat(s)) { pris[i] = true; return s; }
            }
            return null;
        }

        places.forEach(function (place) {
            // 1 — un sportif deja pose a cet emplacement precis
            var choisi = prendre(function (s) {
                return s && s.slot_cle && s.slot_cle === place.cle;
            });
            // 2 — un sportif du bon groupe
            if (!choisi) {
                choisi = prendre(function (s) { return groupeDe(s) === place.groupe; });
            }
            // 3 — n'importe quel sportif encore libre, sauf pour
            //     le poste de gardien : mettre un attaquant dans
            //     les buts par defaut serait un contresens. On
            //     laisse la place vide, l'utilisateur tranchera.
            if (!choisi && place.groupe !== 'Gardien') {
                choisi = prendre(function (s) { return !!s; });
            }

            affectation.push({
                emplacement: place,
                sportif: choisi || null
            });
        });

        var nonPlaces = restants.filter(function (_, i) { return !pris[i]; });

        return { grille: affectation, remplacants: nonPlaces };
    }

    // ═══════════════════════════════════════════════════════
    // 7. DEPLACEMENT
    // -------------------------------------------------------
    // Les coordonnees d'un depot, ramenees dans le terrain avec
    // une marge : un sportif pose sur la ligne de touche
    // deborderait du cadre a l'affichage.
    // ═══════════════════════════════════════════════════════

    var MARGE = 5;

    function poserDans(x, y) {
        return {
            x: arrondir(borner(nombre(x), MARGE, 100 - MARGE), 1),
            y: arrondir(borner(nombre(y), MARGE, 100 - MARGE), 1)
        };
    }

    // Le groupe deduit d'une hauteur sur le terrain — sert a
    // reetiqueter un sportif deplace a la main.
    function groupePourY(y, sport) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var v = nombre(y);
        if (s.gardien && v >= Y_GARDIEN - 8) return 'Gardien';
        if (v >= 62) return 'Défenseur';
        if (v >= 35) return 'Milieu';
        return 'Attaquant';
    }

    // ═══════════════════════════════════════════════════════
    // 8. LES REPERES A AFFICHER
    // -------------------------------------------------------
    // Les cotes que la page ecrit le long des lignes, plus la
    // phrase de rappel demandee au point 23.
    // ═══════════════════════════════════════════════════════

    function reperes(sport, format, saisie) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var d = dimensionsValides(s, format, saisie);
        var surface = arrondir(d.longueur * d.largeur, 0);

        return {
            longueur: d.longueur,
            largeur: d.largeur,
            surface: surface,
            parDefaut: d.parDefaut,
            libelleLongueur: d.longueur + ' m',
            libelleLargeur: d.largeur + ' m',
            rappel: d.parDefaut
                ? 'NB : dimensions réglementaires par défaut pour le ' + s.nom.toLowerCase() +
                  ' à ' + (nombre(format) || s.formatParDefaut) + '. L\'organisateur peut saisir celles de son terrain.'
                : 'NB : terrain de ' + d.longueur + ' m sur ' + d.largeur + ' m, soit ' + surface +
                  ' m², dimensions saisies par l\'organisateur.'
        };
    }

    // ═══════════════════════════════════════════════════════
    // 9. LES MARQUAGES
    // -------------------------------------------------------
    // Renvoie une CHAINE de HTML, pas des elements : la fonction
    // reste testable hors navigateur, et les trois pages qui
    // dessinent un terrain — mon equipe, la fiche d'equipe, les
    // details du match — partagent le meme trace.
    //
    // Aucune image. Tout est trace par la feuille de style a
    // partir de ces classes, aux proportions reglementaires.
    // ═══════════════════════════════════════════════════════

    var MARQUAGES = {
        football: [
            'ligne-mediane', 'rond-central', 'point-central',
            'surface haut', 'surface bas',
            'six-metres haut', 'six-metres bas',
            'point-penalty haut', 'point-penalty bas',
            'arc haut', 'arc bas',
            'corner hg', 'corner hd', 'corner bg', 'corner bd',
            'but haut', 'but bas'
        ],
        handball: [
            'ligne-mediane', 'rond-central',
            'zone haut', 'zone bas',
            'jet-franc haut', 'jet-franc bas',
            'point-penalty haut', 'point-penalty bas',
            'but haut', 'but bas'
        ],
        basket: [
            'ligne-mediane', 'rond-central', 'point-central',
            'raquette haut', 'raquette bas',
            'cercle-lancer haut', 'cercle-lancer bas',
            'trois-points haut', 'trois-points bas',
            'panier haut', 'panier bas'
        ],
        volley: [
            'filet',
            'ligne-attaque haut', 'ligne-attaque bas'
        ]
    };

    function marquagesHtml(sport) {
        var s = typeof sport === 'string' ? sportPour(sport) : (sport || SPORTS.football);
        var liste = MARQUAGES[s.marquages] || MARQUAGES.football;
        return '<div class="gt-terrain-lignes" aria-hidden="true">' +
               liste.map(function (classe) {
                   return '<span class="' + classe + '"></span>';
               }).join('') +
               '</div>';
    }

    // ═══════════════════════════════════════════════════════
    // 10. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        SPORTS: SPORTS,
        FORMATIONS: FORMATIONS,
        MARQUAGES: MARQUAGES,
        Y_GARDIEN: Y_GARDIEN,

        sportPour: sportPour,
        dimensionsParDefaut: dimensionsParDefaut,
        dimensionsValides: dimensionsValides,
        reperes: reperes,

        formationsPour: formationsPour,
        formationParDefaut: formationParDefaut,
        codeFormation: codeFormation,
        lignesDepuisCode: lignesDepuisCode,

        placer: placer,
        effectifDeLaFormation: effectifDeLaFormation,
        deduireFormation: deduireFormation,
        nommerPoste: nommerPoste,
        affecter: affecter,

        poserDans: poserDans,
        groupePourY: groupePourY,

        marquagesHtml: marquagesHtml
    };

})();
