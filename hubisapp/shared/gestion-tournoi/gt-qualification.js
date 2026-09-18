/* ============================================================
   HubISoccer — gt-qualification.js
   Systeme Gestion Tournois — CHANTIER 19
   Des poules a la phase finale
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Un tournoi « poules + elimination directe » se genere en
   DEUX temps. gt-calendrier.js ne faisait que le premier :

       if (famille === 'mixte') {
           var rencontres = genererPoules(repartition, ...);
           return { rencontres: rencontres, ... };   // et c'est tout
       }

   Les poules etaient creees, la phase finale JAMAIS. Pas meme
   des cases vides. L'organisateur cliquait ensuite sur « Faire
   avancer le tableau » et recevait :

       « Les 24 rencontres de ce tournoi ne font pas partie d'un
         tableau a elimination directe. »

   Message exact, et parfaitement inutile : il constatait
   l'absence du tableau sans dire que PERSONNE ne savait le
   creer.

   CE QUE FAIT CE FICHIER

   Le chainon manquant, et rien d'autre : lire le classement des
   poules, designer les qualifies, et les ranger dans l'ordre ou
   ils doivent entrer dans le tableau.

   Il ne touche a AUCUNE base. Calcul pur, donc verifiable.
   L'ecriture reste dans manage-tournament.js, et elle AJOUTE
   les rencontres de la phase finale — elle n'efface jamais les
   poules.

   DEUX METIERS A NE PAS CONFONDRE

     gt-qualification.js  CREE le tableau depuis un classement
     gt-tableau.js        FAIT MONTER les vainqueurs dedans

   C'est la confusion entre les deux qui a coute ce chantier.
   ============================================================ */
window.GTQualification = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. OU EN SONT LES POULES
    // -------------------------------------------------------
    // On ne cree pas une phase finale sur un classement qui
    // peut encore bouger. Cette fonction dit, en clair, ce
    // qu'il reste a jouer.
    //
    // Une rencontre de poule = pas de bracket_position. C'est
    // le seul critere sur lequel on peut compter : le nom du
    // tour, lui, depend de ce que l'organisateur a tape.
    // ═══════════════════════════════════════════════════════
    function estDePoule(m) {
        return !m || m.bracket_position == null || m.bracket_position === '';
    }

    function estJouee(m) {
        return m && (m.status === 'completed' || m.is_bye === true || !!m.forfeit_team_id);
    }

    function etatDesPoules(matchs) {
        var poules = (matchs || []).filter(estDePoule);
        var jouees = poules.filter(estJouee);
        return {
            total:      poules.length,
            jouees:     jouees.length,
            restantes:  poules.length - jouees.length,
            terminees:  poules.length > 0 && jouees.length === poules.length
        };
    }

    // Les rencontres qui portent DEJA une position de tableau :
    // s'il y en a, la phase finale existe et on n'y retouche pas.
    function phaseFinaleExistante(matchs) {
        var dedans = (matchs || []).filter(function (m) { return !estDePoule(m); });
        return {
            existe:  dedans.length > 0,
            nombre:  dedans.length,
            jouees:  dedans.filter(estJouee).length
        };
    }

    // ═══════════════════════════════════════════════════════
    // 2. QUI SE QUALIFIE
    // -------------------------------------------------------
    // parGroupe vient de GTClassement.calculerParGroupe() :
    //     { 'A': [ligne, ligne, ...], 'B': [...] }
    // chaque ligne triee, la premiere etant le premier du groupe.
    //
    // On prend les N premiers de chaque groupe, puis les
    // meilleurs troisiemes repeches si le format les prevoit.
    // ═══════════════════════════════════════════════════════
    function qualifies(parametres) {
        parametres = parametres || {};
        var parGroupe  = parametres.parGroupe || {};
        var parRang    = Math.max(0, Number(parametres.qualifiesParGroupe || 0));
        var repeches   = Math.max(0, Number(parametres.meilleursTroisiemes || 0));
        var departage  = parametres.departage;
        var reference  = parametres.reference;

        var noms = Object.keys(parGroupe).sort();
        var avertissements = [];

        if (!noms.length) {
            return { liste: [], tiers: [], avertissements: ['Aucun groupe : le classement des poules est vide.'] };
        }
        if (!parRang && !repeches) {
            return { liste: [], tiers: [],
                     avertissements: ['Le format ne prévoit aucun qualifié par groupe. ' +
                                      'Corrige « Qualifiés par groupe » dans l\'onglet Format.'] };
        }

        // Les rangs se prennent PAR PALIER, pas groupe par groupe.
        //
        // Tous les premiers d'abord, classes entre eux ; puis tous
        // les deuxiemes, classes entre eux. C'est ce qui donne aux
        // meilleurs premiers les exemptions quand le nombre de
        // qualifies n'est pas une puissance de deux — et non a
        // ceux qui ont eu la chance d'etre tires dans le groupe A.
        var tiers = [];
        for (var rang = 1; rang <= parRang; rang++) {
            var palier = [];
            noms.forEach(function (nom) {
                var ligne = parGroupe[nom][rang - 1];
                if (!ligne) {
                    avertissements.push('Le groupe ' + nom + ' n\'a pas de ' + rang + 'e : ' +
                                        'il compte moins d\'équipes que les autres.');
                    return;
                }
                var copie = Object.assign({}, ligne);
                copie.__groupe = nom;
                copie.__rang   = rang;
                palier.push(copie);
            });

            // Classer les premiers entre eux, les deuxiemes entre
            // eux : exactement ce que fait deja classerLesTroisiemes.
            if (window.GTClassement && window.GTClassement.trier) {
                palier = window.GTClassement.trier(palier, departage, reference);
            }
            tiers.push({ rang: rang, lignes: palier, repeche: false });
        }

        // Les meilleurs troisiemes — la regle du Mondial 2026.
        if (repeches > 0) {
            var rangRepeche = parRang + 1;
            var candidats = [];
            noms.forEach(function (nom) {
                var ligne = parGroupe[nom][rangRepeche - 1];
                if (!ligne) return;
                var copie = Object.assign({}, ligne);
                copie.__groupe = nom;
                copie.__rang   = rangRepeche;
                candidats.push(copie);
            });

            if (window.GTClassement && window.GTClassement.trier) {
                candidats = window.GTClassement.trier(candidats, departage, reference);
            }

            if (candidats.length < repeches) {
                avertissements.push('Le format repêche ' + repeches + ' meilleur(s) ' + rangRepeche +
                                    'e(s), mais il n\'y en a que ' + candidats.length + '.');
            }
            tiers.push({ rang: rangRepeche, lignes: candidats.slice(0, repeches), repeche: true });
        }

        // A plat, dans l'ordre d'entree dans le tableau.
        var liste = [];
        tiers.forEach(function (t) {
            t.lignes.forEach(function (l) {
                liste.push({
                    team_id:  l.team_id != null ? l.team_id : l.equipe,
                    groupe:   l.__groupe,
                    rang:     l.__rang,
                    repeche:  t.repeche,
                    points:   l.points,
                    ligne:    l
                });
            });
        });

        return { liste: liste, tiers: tiers, avertissements: avertissements };
    }

    // ═══════════════════════════════════════════════════════
    // 3. QUI EST DEJA QUALIFIE D'OFFICE
    // -------------------------------------------------------
    // Meme si les poules ne sont pas finies, certaines equipes
    // ne peuvent MATHEMATIQUEMENT plus etre rejointes.
    //
    // Le calcul est volontairement PRUDENT : on suppose que
    // chaque poursuivant gagne tous ses matchs restants. Une
    // equipe n'est declaree qualifiee d'office que si, meme
    // dans ce cas, elle reste devant.
    //
    // Mieux vaut annoncer moins de qualifies que d'en annoncer
    // un qui ne l'est pas.
    // ═══════════════════════════════════════════════════════
    function dOffice(parametres) {
        parametres = parametres || {};
        var parGroupe = parametres.parGroupe || {};
        var matchs    = parametres.matchs || [];
        var parRang   = Math.max(0, Number(parametres.qualifiesParGroupe || 0));
        var pointsVictoire = Number(parametres.pointsVictoire || 3);

        if (!parRang) return [];

        // Combien de matchs de poule il reste a CHAQUE equipe.
        var restants = {};
        matchs.filter(estDePoule).forEach(function (m) {
            if (estJouee(m)) return;
            if (m.team_a_id) restants[m.team_a_id] = (restants[m.team_a_id] || 0) + 1;
            if (m.team_b_id) restants[m.team_b_id] = (restants[m.team_b_id] || 0) + 1;
        });

        var surs = [];

        Object.keys(parGroupe).forEach(function (nom) {
            var lignes = parGroupe[nom] || [];

            lignes.forEach(function (ligne, index) {
                var rang = index + 1;
                if (rang > parRang) return;   // on ne regarde que les places qualificatives

                var id = ligne.team_id != null ? ligne.team_id : ligne.equipe;
                var mesPoints = Number(ligne.points || 0);

                // Le meilleur total atteignable par CHAQUE poursuivant.
                // Il suffit qu'un seul puisse me depasser pour que je ne
                // sois pas encore qualifie d'office.
                var menace = false;
                for (var j = index + 1; j < lignes.length; j++) {
                    var autre = lignes[j];
                    var autreId = autre.team_id != null ? autre.team_id : autre.equipe;
                    var maxAutre = Number(autre.points || 0) +
                                   (restants[autreId] || 0) * pointsVictoire;

                    // Mes propres matchs restants ne me sauvent pas :
                    // on suppose que je les perds tous. C'est ce qui
                    // rend l'annonce sure.
                    if (maxAutre >= mesPoints) {
                        // Egalite : le depart se joue au goal-average,
                        // donc ce n'est PAS acquis. On ne l'annonce pas.
                        menace = true;
                        break;
                    }
                }

                if (!menace) {
                    surs.push({ team_id: id, groupe: nom, rang: rang, points: mesPoints });
                }
            });
        });

        return surs;
    }

    // ═══════════════════════════════════════════════════════
    // 4. L'ORDRE D'ENTREE DANS LE TABLEAU
    // -------------------------------------------------------
    // Le tableau apparie la tete de serie i avec la tete
    // (taille + 1 - i). Avec l'ordre par palier
    //
    //     1A 1B 1C 1D | 2A 2B 2C 2D
    //
    // les affiches deviennent 1A-2D, 1B-2C, 1C-2B, 1D-2A :
    // aucune equipe ne retrouve son groupe au premier tour.
    // C'est le schema classique.
    //
    // Mais le classement par palier peut casser cette symetrie
    // (si 2A est le meilleur deuxieme, il remonte en tete de son
    // palier et peut retomber face a 1A). On repare donc apres
    // coup : toute affiche fratricide est echangee avec la plus
    // proche qui ne l'est pas.
    // ═══════════════════════════════════════════════════════
    function puissanceDeDeuxSuperieure(n) {
        var p = 2;
        while (p < n) p *= 2;
        return p;
    }

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

    // Les paires de rangs qui s'affrontent au premier tour.
    function pairesDuPremierTour(taille) {
        var placement = ordreTetesSerie(taille);
        var paires = [];
        for (var i = 0; i < taille; i += 2) {
            paires.push([placement[i], placement[i + 1]]);
        }
        return paires;
    }

    function apparier(liste) {
        var ordre = (liste || []).slice();
        if (ordre.length < 2) return { ordre: ordre, taille: 0, exemptions: 0, fratricides: [], echanges: 0 };

        var taille = puissanceDeDeuxSuperieure(ordre.length);
        var paires = pairesDuPremierTour(taille);
        var echanges = 0;

        // Reparation des affiches fratricides.
        //
        // On ne deplace jamais une equipe hors de son palier : un
        // deuxieme ne doit pas se retrouver a la place d'un premier,
        // sinon on lui offrirait une exemption qu'il n'a pas meritee.
        for (var tour = 0; tour < 2; tour++) {
            paires.forEach(function (paire) {
                var iA = paire[0] - 1, iB = paire[1] - 1;
                var a = ordre[iA], b = ordre[iB];
                if (!a || !b) return;                       // exemption : rien a reparer
                if (a.groupe !== b.groupe) return;           // deja bon

                // On cherche un remplacant pour b, dans SON palier.
                for (var k = 0; k < ordre.length; k++) {
                    if (k === iB || k === iA) continue;
                    var c = ordre[k];
                    if (!c) continue;
                    if (c.rang !== b.rang || c.repeche !== b.repeche) continue;  // meme palier seulement
                    if (c.groupe === a.groupe) continue;     // ne resout rien

                    // L'adversaire de c ne doit pas devenir fratricide.
                    var adverseDeC = null;
                    for (var p = 0; p < paires.length; p++) {
                        if (paires[p][0] - 1 === k) { adverseDeC = ordre[paires[p][1] - 1]; break; }
                        if (paires[p][1] - 1 === k) { adverseDeC = ordre[paires[p][0] - 1]; break; }
                    }
                    if (adverseDeC && adverseDeC.groupe === b.groupe) continue;

                    ordre[iB] = c;
                    ordre[k]  = b;
                    echanges++;
                    return;
                }
            });
        }

        // Ce qu'il reste de fratricide, on le DIT. Avec deux groupes
        // et quatre qualifies, c'est parfois impossible a eviter.
        var fratricides = [];
        paires.forEach(function (paire) {
            var a = ordre[paire[0] - 1], b = ordre[paire[1] - 1];
            if (a && b && a.groupe === b.groupe) {
                fratricides.push({ a: a, b: b, groupe: a.groupe });
            }
        });

        return {
            ordre: ordre,
            taille: taille,
            exemptions: taille - ordre.length,
            fratricides: fratricides,
            echanges: echanges,
            paires: paires
        };
    }

    // ═══════════════════════════════════════════════════════
    // 5. LA PROPOSITION COMPLETE
    // -------------------------------------------------------
    // Une seule porte d'entree pour la page. Elle rend TOUJOURS
    // un objet lisible : ce qui va se passer, ce qui bloque, et
    // pourquoi.
    // ═══════════════════════════════════════════════════════
    function preparer(parametres) {
        parametres = parametres || {};
        var matchs = parametres.matchs || [];

        var poules = etatDesPoules(matchs);
        var deja   = phaseFinaleExistante(matchs);

        var q = qualifies(parametres);
        var appariement = apparier(q.liste);

        var blocages = [];

        // (c) — on n'ecrase jamais une phase finale existante.
        if (deja.existe) {
            blocages.push({
                code: 'deja',
                message: 'Ce tournoi a déjà une phase finale : ' + deja.nombre + ' rencontre(s), ' +
                         'dont ' + deja.jouees + ' déjà jouée(s). Rien n\'a été touché. ' +
                         'Pour la refaire, supprime d\'abord ces rencontres une par une.'
            });
        }

        // (a) — on ne cree pas une phase finale sur un classement
        // qui peut encore bouger.
        if (!poules.terminees) {
            blocages.push({
                code: 'poules',
                message: poules.total
                    ? 'Il reste ' + poules.restantes + ' rencontre(s) de poule à jouer sur ' +
                      poules.total + '. Le classement peut encore changer.'
                    : 'Ce tournoi n\'a aucune rencontre de poule.'
            });
        }

        if (q.liste.length < 2) {
            blocages.push({
                code: 'qualifies',
                message: 'Moins de deux qualifiés : impossible de construire un tableau.'
            });
        }

        return {
            poules: poules,
            phaseFinale: deja,
            qualifies: q.liste,
            tiers: q.tiers,
            appariement: appariement,
            avertissements: q.avertissements,
            blocages: blocages,
            possible: blocages.length === 0,
            // Ceux qui sont deja surs, meme poules non finies :
            // c'est ce qu'on montre quand on refuse.
            dOffice: poules.terminees ? [] : dOffice(parametres)
        };
    }

    // ═══════════════════════════════════════════════════════
    // 6. RESUMER, EN FRANCAIS
    // ═══════════════════════════════════════════════════════
    function resumer(proposition, noms) {
        if (!proposition) return 'Rien à dire.';
        noms = noms || {};
        function nom(id) { return noms[id] || String(id); }

        if (!proposition.possible) {
            return proposition.blocages.map(function (b) { return b.message; }).join(' ');
        }

        var a = proposition.appariement;
        var t = [];
        t.push(proposition.qualifies.length + ' qualifié(s) pour un tableau à ' + a.taille + '.');
        if (a.exemptions > 0) {
            t.push(a.exemptions + ' exemption(s) : les mieux classés passent directement le tour suivant.');
        }
        if (a.fratricides.length) {
            t.push(a.fratricides.length + ' affiche(s) opposent deux équipes du même groupe — ' +
                   'inévitable avec ce nombre de groupes.');
        }
        return t.join(' ');
    }

    // ═══════════════════════════════════════════════════════
    // 7. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        estDePoule: estDePoule,
        estJouee: estJouee,
        etatDesPoules: etatDesPoules,
        phaseFinaleExistante: phaseFinaleExistante,
        qualifies: qualifies,
        dOffice: dOffice,
        apparier: apparier,
        pairesDuPremierTour: pairesDuPremierTour,
        puissanceDeDeuxSuperieure: puissanceDeDeuxSuperieure,
        preparer: preparer,
        resumer: resumer
    };
})();
