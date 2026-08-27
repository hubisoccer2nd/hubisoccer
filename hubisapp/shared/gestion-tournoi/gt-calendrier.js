/* ============================================================
   HubISoccer — gt-calendrier.js
   Système Gestion Tournois — Génération du calendrier et tirage
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   L'organisateur devait créer chaque match un par un, à la main.
   Pour un championnat à 20 équipes en aller-retour, cela fait
   380 saisies. Personne ne le fera.

   Ce module génère le calendrier complet d'un seul geste, à partir
   du format choisi au chantier 01. L'organisateur garde ensuite la
   main sur chaque rencontre : date, heure, équipes, suppression.

   CE FICHIER NE TOUCHE NI AU DOM NI AU RÉSEAU

   Il ne contient que du calcul. C'est volontaire : la logique de
   génération se teste sans navigateur et sans base de données, et
   un développeur qui reprend peut la lire sans rien installer.
   L'écriture en base est faite par la page appelante.

   CE QU'IL SAIT GÉNÉRER

   1. Championnat — méthode du carrousel (Berger), journées
      équilibrées, alternance domicile/extérieur, retour miroir.
   2. Poules — un championnat par groupe.
   3. Élimination directe — tableau complet avec têtes de série et
      exemptions automatiques quand le nombre d'équipes n'est pas
      une puissance de deux.
   4. Système suisse — première ronde seulement ; les suivantes
      s'apparient sur les scores, ronde après ronde.
   5. Modèle UEFA — chaque équipe affronte N adversaires différents
      tirés dans les chapeaux, moitié à domicile, moitié dehors.
   6. Tirage des groupes — aléatoire, avec ou sans chapeaux.

   FORMAT DE SORTIE

   Un tableau d'objets, prêts à être insérés dans gt_matches :
       {
         equipeA, equipeB,     identifiants d'équipe (ou null si exempt)
         tour,                 libellé : « Journée 3 », « Quarts de finale »
         journee,              numéro de journée (championnat) ou null
         groupe,               nom du groupe ou null
         manche,               1 = aller, 2 = retour
         positionTableau,      position dans le tour (élimination) ou null
         exemption             true si l'équipe passe sans jouer
       }
   ============================================================ */
'use strict';

window.GTCalendrier = (function () {

    // ═══════════════════════════════════════════════════════════
    // 1. OUTILS
    // ═══════════════════════════════════════════════════════════

    // Mélange de Fisher-Yates. Une source aléatoire peut être
    // injectée pour rendre les tests reproductibles.
    function melanger(tableau, alea) {
        var hasard = alea || Math.random;
        var copie = tableau.slice();
        for (var i = copie.length - 1; i > 0; i--) {
            var j = Math.floor(hasard() * (i + 1));
            var t = copie[i]; copie[i] = copie[j]; copie[j] = t;
        }
        return copie;
    }

    function puissanceDeDeuxSuperieure(n) {
        var p = 1;
        while (p < n) p *= 2;
        return p;
    }

    // Nom du tour d'après le nombre d'équipes encore en lice.
    function nomDuTour(equipesRestantes) {
        switch (equipesRestantes) {
            case 2:   return 'Finale';
            case 4:   return 'Demi-finales';
            case 8:   return 'Quarts de finale';
            case 16:  return 'Huitièmes de finale';
            case 32:  return '16es de finale';
            case 64:  return '32es de finale';
            case 128: return '64es de finale';
            case 256: return '128es de finale';
            default:  return 'Tour à ' + equipesRestantes + ' équipes';
        }
    }

    // Code court, celui qu'on affiche en pastille sur le tableau.
    function codeDuTour(equipesRestantes) {
        switch (equipesRestantes) {
            case 2:   return 'F';
            case 4:   return '1/2';
            case 8:   return '1/4';
            case 16:  return '1/8';
            case 32:  return '1/16';
            case 64:  return '1/32';
            case 128: return '1/64';
            default:  return 'T' + equipesRestantes;
        }
    }

    // Ordre de placement des têtes de série dans un tableau, pour
    // que la tête n°1 et la tête n°2 ne puissent se croiser qu'en
    // finale. Pour 8 : [1, 8, 4, 5, 2, 7, 3, 6].
    function ordreTetesSerie(taille) {
        var ordre = [1];
        while (ordre.length < taille) {
            var n = ordre.length * 2;
            var suivant = [];
            for (var i = 0; i < ordre.length; i++) {
                suivant.push(ordre[i]);
                suivant.push(n + 1 - ordre[i]);
            }
            ordre = suivant;
        }
        return ordre;
    }

    // ═══════════════════════════════════════════════════════════
    // 2. CHAMPIONNAT — MÉTHODE DU CARROUSEL
    //    Une équipe reste fixe, les autres tournent d'un cran à
    //    chaque journée. Avec un nombre impair d'équipes, on ajoute
    //    un adversaire fictif : celui qui l'affronte est au repos.
    // ═══════════════════════════════════════════════════════════
    function genererChampionnat(equipes, options) {
        options = options || {};
        var manches = options.manches === 2 ? 2 : 1;
        var groupe  = options.groupe || null;
        var prefixe = options.prefixeJournee || 'Journée';
        var decalageJournee = options.decalageJournee || 0;

        if (!equipes || equipes.length < 2) return [];

        var liste = equipes.slice();
        var repos = null;
        if (liste.length % 2 === 1) { liste.push(repos); }

        var n = liste.length;
        var journees = n - 1;
        var moitie = n / 2;
        var rencontres = [];

        var rotation = liste.slice();

        for (var j = 0; j < journees; j++) {
            for (var i = 0; i < moitie; i++) {
                var a = rotation[i];
                var b = rotation[n - 1 - i];
                if (a === repos || b === repos) continue;   // équipe au repos

                // Alternance domicile / extérieur : une journée sur
                // deux, on inverse, sinon la même équipe recevrait
                // toujours.
                var recoit = (j % 2 === 0) ? a : b;
                var visite = (j % 2 === 0) ? b : a;

                rencontres.push({
                    equipeA: recoit,
                    equipeB: visite,
                    tour: prefixe + ' ' + (j + 1 + decalageJournee),
                    journee: j + 1 + decalageJournee,
                    groupe: groupe,
                    manche: 1,
                    positionTableau: null,
                    exemption: false
                });
            }
            // rotation : la première équipe reste, les autres tournent
            var derniere = rotation.pop();
            rotation.splice(1, 0, derniere);
        }

        if (manches === 2) {
            var retour = rencontres.map(function (m, index) {
                return {
                    equipeA: m.equipeB,
                    equipeB: m.equipeA,
                    tour: prefixe + ' ' + (m.journee + journees),
                    journee: m.journee + journees,
                    groupe: groupe,
                    manche: 2,
                    positionTableau: null,
                    exemption: false
                };
            });
            rencontres = rencontres.concat(retour);
        }

        return rencontres;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. POULES — un championnat par groupe
    // ═══════════════════════════════════════════════════════════
    function genererPoules(groupes, options) {
        options = options || {};
        var tout = [];
        Object.keys(groupes).forEach(function (nomGroupe) {
            var rencontres = genererChampionnat(groupes[nomGroupe], {
                manches: options.manches,
                groupe: nomGroupe,
                prefixeJournee: nomGroupe + ' — journée'
            });
            tout = tout.concat(rencontres);
        });
        return tout;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. ÉLIMINATION DIRECTE
    //    Le tableau est dimensionné à la puissance de deux
    //    supérieure. Les places manquantes deviennent des
    //    exemptions, attribuées aux têtes de série.
    // ═══════════════════════════════════════════════════════════
    function genererTableau(equipes, options) {
        options = options || {};
        var manchesPhaseFinale = options.manchesPhaseFinale === 2 ? 2 : 1;
        var matchTroisiemePlace = !!options.matchTroisiemePlace;
        var nbTetesSerie = options.tetesSerie || 0;
        var alea = options.alea;

        if (!equipes || equipes.length < 2) return [];

        // Les têtes de série gardent leur rang, le reste est tiré.
        var tetes = equipes.slice(0, nbTetesSerie);
        var autres = melanger(equipes.slice(nbTetesSerie), alea);
        var ordonnees = tetes.concat(autres);

        var taille = puissanceDeDeuxSuperieure(ordonnees.length);
        var placement = ordreTetesSerie(taille);

        // placement[i] donne le rang de l'équipe attendue à la
        // position i. Au-delà du nombre d'équipes réel : exemption.
        var grille = placement.map(function (rang) {
            return (rang <= ordonnees.length) ? ordonnees[rang - 1] : null;
        });

        var rencontres = [];
        var tourEquipes = taille;
        var position = 0;

        // --- Premier tour, avec exemptions
        for (var i = 0; i < taille; i += 2) {
            var a = grille[i];
            var b = grille[i + 1];
            position++;

            if (a === null && b === null) continue;

            if (a === null || b === null) {
                // Exemption : l'équipe présente passe sans jouer.
                rencontres.push({
                    equipeA: a || b,
                    equipeB: null,
                    tour: nomDuTour(tourEquipes),
                    codeTour: codeDuTour(tourEquipes),
                    journee: null,
                    groupe: null,
                    manche: 1,
                    positionTableau: position,
                    exemption: true
                });
                continue;
            }

            rencontres.push({
                equipeA: a, equipeB: b,
                tour: nomDuTour(tourEquipes),
                codeTour: codeDuTour(tourEquipes),
                journee: null, groupe: null,
                manche: 1,
                positionTableau: position,
                exemption: false
            });

            if (manchesPhaseFinale === 2 && tourEquipes > 2) {
                rencontres.push({
                    equipeA: b, equipeB: a,
                    tour: nomDuTour(tourEquipes) + ' — retour',
                    codeTour: codeDuTour(tourEquipes),
                    journee: null, groupe: null,
                    manche: 2,
                    positionTableau: position,
                    exemption: false
                });
            }
        }

        // --- Tours suivants : places vides, à remplir au fur et à
        //     mesure que les vainqueurs sont connus.
        tourEquipes = taille / 2;
        while (tourEquipes >= 2) {
            position = 0;
            for (var k = 0; k < tourEquipes; k += 2) {
                position++;
                rencontres.push({
                    equipeA: null, equipeB: null,
                    tour: nomDuTour(tourEquipes),
                    codeTour: codeDuTour(tourEquipes),
                    journee: null, groupe: null,
                    manche: 1,
                    positionTableau: position,
                    exemption: false,
                    aDefinir: true
                });
                if (manchesPhaseFinale === 2 && tourEquipes > 2) {
                    rencontres.push({
                        equipeA: null, equipeB: null,
                        tour: nomDuTour(tourEquipes) + ' — retour',
                        codeTour: codeDuTour(tourEquipes),
                        journee: null, groupe: null,
                        manche: 2,
                        positionTableau: position,
                        exemption: false,
                        aDefinir: true
                    });
                }
            }
            tourEquipes = tourEquipes / 2;
        }

        if (matchTroisiemePlace) {
            rencontres.push({
                equipeA: null, equipeB: null,
                tour: 'Match pour la 3e place',
                codeTour: '3e',
                journee: null, groupe: null,
                manche: 1,
                positionTableau: 1,
                exemption: false,
                aDefinir: true
            });
        }

        return rencontres;
    }

    // ═══════════════════════════════════════════════════════════
    // 5. SYSTÈME SUISSE — première ronde uniquement
    //    Les rondes suivantes dépendent des résultats : elles se
    //    génèrent une par une, après validation de la précédente.
    // ═══════════════════════════════════════════════════════════
    function genererSuisseRonde(equipes, options) {
        options = options || {};
        var ronde = options.ronde || 1;
        var classement = options.classement || null;   // ordonné, meilleur en tête
        var dejaJoues = options.dejaJoues || [];       // ['idA|idB', …]
        var alea = options.alea;

        var liste = classement && classement.length ? classement.slice() : melanger(equipes, alea);
        var rencontres = [];
        var utilisees = {};
        var position = 0;

        function ontDejaJoue(a, b) {
            return dejaJoues.indexOf(a + '|' + b) !== -1 || dejaJoues.indexOf(b + '|' + a) !== -1;
        }

        for (var i = 0; i < liste.length; i++) {
            var a = liste[i];
            if (utilisees[a]) continue;

            var adversaire = null;
            for (var j = i + 1; j < liste.length; j++) {
                var b = liste[j];
                if (utilisees[b]) continue;
                if (ontDejaJoue(a, b)) continue;
                adversaire = b;
                break;
            }

            // Aucun adversaire neuf disponible : on prend le
            // premier libre plutôt que de laisser l'équipe dehors.
            if (adversaire === null) {
                for (var k = i + 1; k < liste.length; k++) {
                    if (!utilisees[liste[k]]) { adversaire = liste[k]; break; }
                }
            }

            utilisees[a] = true;
            position++;

            if (adversaire === null) {
                rencontres.push({
                    equipeA: a, equipeB: null,
                    tour: 'Ronde ' + ronde, codeTour: 'R' + ronde,
                    journee: ronde, groupe: null, manche: 1,
                    positionTableau: position, exemption: true
                });
                continue;
            }

            utilisees[adversaire] = true;
            rencontres.push({
                equipeA: a, equipeB: adversaire,
                tour: 'Ronde ' + ronde, codeTour: 'R' + ronde,
                journee: ronde, groupe: null, manche: 1,
                positionTableau: position, exemption: false
            });
        }

        return rencontres;
    }

    // ═══════════════════════════════════════════════════════════
    // 6. MODÈLE UEFA — phase de championnat unique
    //    Chaque équipe affronte N adversaires différents, répartis
    //    dans les chapeaux, moitié à domicile moitié à l'extérieur.
    //    Le tirage est contraint : on réessaie jusqu'à trouver une
    //    combinaison valable, puis on relâche si nécessaire.
    // ═══════════════════════════════════════════════════════════
    function genererModeleUefa(equipes, options) {
        options = options || {};
        var adversaires = options.adversaires || 8;
        var nbChapeaux = options.chapeaux || 4;
        var alea = options.alea;
        var essaisMax = options.essaisMax || 400;

        if (!equipes || equipes.length < 2) return [];
        if (adversaires >= equipes.length) adversaires = equipes.length - 1;

        var parChapeau = Math.ceil(equipes.length / nbChapeaux);
        var chapeauDe = {};
        equipes.forEach(function (e, index) { chapeauDe[e] = Math.floor(index / parChapeau); });

        // Combien d'adversaires par chapeau : réparti au plus juste.
        var quotaParChapeau = Math.floor(adversaires / nbChapeaux);
        var reste = adversaires - quotaParChapeau * nbChapeaux;

        for (var essai = 0; essai < essaisMax; essai++) {
            var compteur = {}, aDomicile = {}, croises = {}, paires = [];
            equipes.forEach(function (e) {
                compteur[e] = {}; aDomicile[e] = 0;
                for (var c = 0; c < nbChapeaux; c++) compteur[e][c] = 0;
            });

            var ordre = melanger(equipes, alea);
            var abandon = false;

            for (var i = 0; i < ordre.length && !abandon; i++) {
                var a = ordre[i];
                var totalA = Object.keys(compteur[a]).reduce(function (s, c) { return s + compteur[a][c]; }, 0);

                while (totalA < adversaires) {
                    var candidats = ordre.filter(function (b) {
                        if (b === a) return false;
                        if (croises[a + '|' + b] || croises[b + '|' + a]) return false;
                        var totalB = Object.keys(compteur[b]).reduce(function (s, c) { return s + compteur[b][c]; }, 0);
                        if (totalB >= adversaires) return false;
                        var c = chapeauDe[b];
                        var quota = quotaParChapeau + (c < reste ? 1 : 0);
                        if (compteur[a][c] >= quota) return false;
                        if (compteur[b][chapeauDe[a]] >= (quotaParChapeau + (chapeauDe[a] < reste ? 1 : 0))) return false;
                        return true;
                    });

                    if (!candidats.length) { abandon = true; break; }

                    var b = melanger(candidats, alea)[0];
                    croises[a + '|' + b] = true;
                    compteur[a][chapeauDe[b]]++;
                    compteur[b][chapeauDe[a]]++;

                    // Équilibre domicile / extérieur
                    var recoit, visite;
                    if (aDomicile[a] < adversaires / 2 && aDomicile[b] >= adversaires / 2) { recoit = a; visite = b; }
                    else if (aDomicile[b] < adversaires / 2 && aDomicile[a] >= adversaires / 2) { recoit = b; visite = a; }
                    else if (aDomicile[a] <= aDomicile[b]) { recoit = a; visite = b; }
                    else { recoit = b; visite = a; }
                    aDomicile[recoit]++;

                    paires.push({ equipeA: recoit, equipeB: visite });
                    totalA = Object.keys(compteur[a]).reduce(function (s, c) { return s + compteur[a][c]; }, 0);
                }
            }

            if (abandon) continue;

            // Le tirage greedy ne garantit pas l'equilibre domicile /
            // exterieur : on le retablit en inversant les rencontres
            // qui desequilibrent, jusqu'a ce que chaque equipe
            // recoive exactement la moitie de ses matchs.
            equilibrerDomicile(paires);

            // Répartition des rencontres en journées : chaque équipe
            // ne joue qu'une fois par journée.
            return repartirEnJournees(paires);
        }

        // Le tirage contraint n'a pas abouti : on retombe sur un
        // championnat classique plutôt que de ne rien produire.
        return genererChampionnat(equipes, { manches: 1 });
    }

    // Rétablit l'équilibre domicile / extérieur, exactement.
    //
    // Chaque équipe dispute le même nombre de rencontres, et ce
    // nombre est pair. Le graphe des rencontres a donc tous ses
    // degrés pairs : il admet un circuit eulérien. En orientant
    // chaque arête dans le sens du parcours, chaque sommet reçoit
    // autant d'arêtes entrantes que sortantes — c'est-à-dire que
    // chaque équipe reçoit exactement la moitié de ses matchs.
    //
    // Un rééquilibrage gourmand par inversions successives ne
    // converge pas : il se bloque dès qu'aucune inversion simple
    // ne corrige deux équipes à la fois. Le circuit eulérien, lui,
    // donne le résultat exact du premier coup.
    function equilibrerDomicile(paires) {
        if (!paires.length) return;

        // Adjacence : pour chaque équipe, la liste des arêtes
        // (index dans paires) qui la touchent.
        var aretes = {};
        paires.forEach(function (p, index) {
            (aretes[p.equipeA] = aretes[p.equipeA] || []).push(index);
            (aretes[p.equipeB] = aretes[p.equipeB] || []).push(index);
        });

        var utilisee = new Array(paires.length).fill(false);
        var sommets = Object.keys(aretes);

        // Hierholzer, composante par composante.
        sommets.forEach(function (depart) {
            if (!aretes[depart].some(function (i) { return !utilisee[i]; })) return;

            var pile = [depart];
            var circuit = [];

            while (pile.length) {
                var courant = pile[pile.length - 1];
                var suivante = -1;
                var liste = aretes[courant];
                for (var k = 0; k < liste.length; k++) {
                    if (!utilisee[liste[k]]) { suivante = liste[k]; break; }
                }

                if (suivante === -1) {
                    circuit.push(pile.pop());
                    continue;
                }

                utilisee[suivante] = true;
                var arete = paires[suivante];
                var voisin = (arete.equipeA === courant) ? arete.equipeB : arete.equipeA;
                arete.__index = suivante;
                pile.push(voisin);
            }

            // circuit contient les sommets dans l'ordre inverse du
            // parcours. On oriente chaque arête consécutive.
            circuit.reverse();
            for (var i = 0; i < circuit.length - 1; i++) {
                var u = circuit[i], v = circuit[i + 1];
                // retrouver l'arête u-v non encore orientee
                for (var j = 0; j < paires.length; j++) {
                    if (paires[j].__oriente) continue;
                    var pr = paires[j];
                    if ((pr.equipeA === u && pr.equipeB === v) || (pr.equipeA === v && pr.equipeB === u)) {
                        pr.equipeA = u;
                        pr.equipeB = v;
                        pr.__oriente = true;
                        break;
                    }
                }
            }
        });

        paires.forEach(function (p) { delete p.__oriente; delete p.__index; });
    }

    // Range des paires en journées : une équipe ne joue qu'une fois
    // par journée.
    function repartirEnJournees(paires) {
        var restantes = paires.slice();
        var rencontres = [];
        var journee = 0;

        while (restantes.length) {
            journee++;
            var occupees = {};
            var suivantes = [];

            restantes.forEach(function (p) {
                if (occupees[p.equipeA] || occupees[p.equipeB]) { suivantes.push(p); return; }
                occupees[p.equipeA] = true;
                occupees[p.equipeB] = true;
                rencontres.push({
                    equipeA: p.equipeA, equipeB: p.equipeB,
                    tour: 'Journée ' + journee, codeTour: 'J' + journee,
                    journee: journee, groupe: null, manche: 1,
                    positionTableau: null, exemption: false
                });
            });

            if (suivantes.length === restantes.length) break;   // sécurité
            restantes = suivantes;
        }
        return rencontres;
    }

    // ═══════════════════════════════════════════════════════════
    // 7. TIRAGE DES GROUPES
    //    Deux modes, comme demandé : aléatoire simple, ou par
    //    chapeaux — une équipe de chaque chapeau par groupe.
    // ═══════════════════════════════════════════════════════════
    function tirerGroupes(equipes, nbGroupes, options) {
        options = options || {};
        var alea = options.alea;
        var chapeaux = options.chapeaux || null;   // [[id,…], [id,…]] ou null
        var noms = options.nomsGroupes || null;

        if (!equipes || !equipes.length || nbGroupes < 1) return {};

        function nomGroupe(index) {
            if (noms && noms[index]) return noms[index];
            return 'Groupe ' + String.fromCharCode(65 + index);   // A, B, C…
        }

        var resultat = {};
        for (var g = 0; g < nbGroupes; g++) resultat[nomGroupe(g)] = [];

        if (chapeaux && chapeaux.length) {
            // Un tirage par chapeau : le chapeau 1 remplit d'abord
            // une place dans chaque groupe, puis le chapeau 2, etc.
            chapeaux.forEach(function (chapeau) {
                var tires = melanger(chapeau, alea);
                tires.forEach(function (equipe, index) {
                    var cible = nomGroupe(index % nbGroupes);
                    resultat[cible].push(equipe);
                });
            });
            return resultat;
        }

        var melangees = melanger(equipes, alea);
        melangees.forEach(function (equipe, index) {
            resultat[nomGroupe(index % nbGroupes)].push(equipe);
        });
        return resultat;
    }

    // ═══════════════════════════════════════════════════════════
    // 8. AIGUILLAGE — génération d'après le format du chantier 01
    // ═══════════════════════════════════════════════════════════
    function genererDepuisFormat(codeFormat, famille, valeurs, equipes, options) {
        options = options || {};
        valeurs = valeurs || {};
        var alea = options.alea;

        if (!equipes || equipes.length < 2) {
            return { rencontres: [], groupes: null, avertissement: 'Il faut au moins deux équipes inscrites.' };
        }

        // --- Modèle UEFA : championnat unique par chapeaux
        if (codeFormat === 'championnat_unique_uefa') {
            return {
                rencontres: genererModeleUefa(equipes, {
                    adversaires: valeurs.adversaires || 8,
                    chapeaux: 4, alea: alea
                }),
                groupes: null, avertissement: null
            };
        }

        // --- Système suisse : première ronde seulement
        if (famille === 'suisse') {
            return {
                rencontres: genererSuisseRonde(equipes, { ronde: 1, alea: alea }),
                groupes: null,
                avertissement: 'Première ronde générée. Les rondes suivantes s\'apparient sur les scores, une fois celle-ci terminée.'
            };
        }

        // --- Poules puis phase finale
        if (famille === 'mixte') {
            var nbGroupes = valeurs.groupes || 1;
            var repartition = options.groupesExistants || tirerGroupes(equipes, nbGroupes, { alea: alea });
            var rencontres = genererPoules(repartition, { manches: valeurs.manches });
            return { rencontres: rencontres, groupes: repartition, avertissement: null };
        }

        // --- Élimination directe
        if (famille === 'coupe') {
            return {
                rencontres: genererTableau(equipes, {
                    manchesPhaseFinale: valeurs.manchesPhaseFinale,
                    matchTroisiemePlace: valeurs.matchTroisiemePlace,
                    tetesSerie: valeurs.tetesSerie,
                    alea: alea
                }),
                groupes: null, avertissement: null
            };
        }

        // --- Championnat, en un ou plusieurs tableaux
        var groupesChampionnat = valeurs.groupes || 1;
        if (groupesChampionnat > 1) {
            var repartitionC = options.groupesExistants || tirerGroupes(equipes, groupesChampionnat, { alea: alea });
            return {
                rencontres: genererPoules(repartitionC, { manches: valeurs.manches }),
                groupes: repartitionC, avertissement: null
            };
        }

        return {
            rencontres: genererChampionnat(equipes, { manches: valeurs.manches }),
            groupes: null, avertissement: null
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 9. RÉPARTITION DES DATES
    //    Une date par journée, à intervalle régulier, en respectant
    //    les bornes du tournoi.
    // ═══════════════════════════════════════════════════════════
    function repartirDates(rencontres, dateDebut, dateFin, options) {
        options = options || {};
        var heure = options.heure || 16;

        var debut = new Date(dateDebut);
        if (isNaN(debut.getTime())) debut = new Date();

        // Les journées distinctes, dans l'ordre.
        var journees = [];
        rencontres.forEach(function (m) {
            var cle = m.journee !== null && m.journee !== undefined ? 'J' + m.journee : m.tour;
            if (journees.indexOf(cle) === -1) journees.push(cle);
        });

        var fin = new Date(dateFin);
        var pas = 7;   // une journée par semaine par défaut
        if (!isNaN(fin.getTime()) && journees.length > 1) {
            var jours = Math.floor((fin - debut) / 86400000);
            if (jours > 0) pas = Math.max(1, Math.floor(jours / (journees.length - 1)));
        }

        return rencontres.map(function (m) {
            var cle = m.journee !== null && m.journee !== undefined ? 'J' + m.journee : m.tour;
            var rang = journees.indexOf(cle);
            var date = new Date(debut.getTime());
            date.setDate(date.getDate() + rang * pas);
            date.setHours(heure, 0, 0, 0);
            return Object.assign({}, m, { date: date.toISOString() });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 10. API PUBLIQUE
    // ═══════════════════════════════════════════════════════════
    return {
        genererChampionnat: genererChampionnat,
        genererPoules: genererPoules,
        genererTableau: genererTableau,
        genererSuisseRonde: genererSuisseRonde,
        genererModeleUefa: genererModeleUefa,
        tirerGroupes: tirerGroupes,
        genererDepuisFormat: genererDepuisFormat,
        repartirDates: repartirDates,
        nomDuTour: nomDuTour,
        codeDuTour: codeDuTour,
        ordreTetesSerie: ordreTetesSerie,
        melanger: melanger
    };

})();
