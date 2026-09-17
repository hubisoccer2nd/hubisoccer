/* ============================================================
   HubISoccer — gt-tableau.js
   Systeme Gestion Tournois — LE TABLEAU QUI AVANCE TOUT SEUL
   ------------------------------------------------------------
   CE QUI N'ALLAIT PAS

   gt-calendrier.js engendre bien tout le tableau d'un coup : le
   premier tour avec ses affiches, puis les tours suivants en
   cases vides, marquees « aDefinir ». Elles sont ecrites en base
   avec team_a_id = null et team_b_id = null.

   Et personne, nulle part, ne les remplissait jamais.

   Sur une coupe a 32 equipes, l'organisateur devait donc saisir
   a la main les 31 affiches des tours suivants, une par une, en
   recopiant lui-meme qui avait gagne. Une coupe n'etait pas
   gerable.

   CE QUE FAIT CE FICHIER

   Il calcule. Rien d'autre. Aucun acces au DOM, aucun appel
   reseau, aucune dependance. On lui donne toutes les rencontres
   d'un tournoi, il rend la liste des ecritures a faire :

       [{ id, team_a_id }, { id, team_b_id }, ...]

   La page se contente de les appliquer.

   LA REGLE DU TABLEAU

   Un tour ou il reste T equipes compte T/2 affiches, numerotees
   de 1 a T/2 (bracket_position). Le vainqueur de l'affiche p
   rejoint l'affiche ceil(p/2) du tour suivant :

       p impair -> il prend la place A
       p pair   -> il prend la place B

   C'est tout. Cette regle suffit a remplir un tableau entier,
   quelle que soit sa taille.

   CE QUI EST PRIS EN COMPTE

     · l'exemption (bye) : l'equipe presente passe sans jouer,
       et elle passe DES LA GENERATION, pas au premier resultat ;
     · la double confrontation : on additionne les deux manches
       en respectant qui recoit a l'aller et qui recoit au retour ;
     · les tirs au but : penalty_winner_id, sinon penalty_a /
       penalty_b de la derniere manche ;
     · le forfait : forfeit_team_id perd, quel que soit le score ;
     · le match pour la 3e place : il recoit les deux PERDANTS
       des demi-finales, pas les vainqueurs.

   CE QU'IL NE FAIT JAMAIS

   Il n'ecrase pas une affiche deja jouee. Si le tour suivant
   porte deja un resultat, on ne touche a rien et on le signale :
   mieux vaut un tableau qui previent qu'un tableau qui efface un
   match qui a eu lieu.
   ============================================================ */
window.GTTableau = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. RECONNAITRE UN TOUR
    // -------------------------------------------------------
    // La taille d'un tour, c'est le nombre d'equipes encore en
    // lice : 2 = finale, 4 = demi-finales, 8 = quarts...
    //
    // On la lit dans round_size quand la colonne est remplie.
    // Pour les rencontres creees avant ce chantier, on la deduit
    // du nom du tour — l'inverse exact de gt-calendrier.nomDuTour().
    // Aucune donnee n'est a migrer.
    // ═══════════════════════════════════════════════════════

    var PAR_NOM = {
        'finale': 2,
        'demi-finales': 4, 'demi-finale': 4,
        'quarts de finale': 8, 'quart de finale': 8,
        'huitiemes de finale': 16, 'huitieme de finale': 16,
        '16es de finale': 32, '16e de finale': 32,
        '32es de finale': 64, '32e de finale': 64,
        '64es de finale': 128, '64e de finale': 128,
        '128es de finale': 256, '128e de finale': 256
    };

    var PAR_CODE = { 'F': 2, '1/2': 4, '1/4': 8, '1/8': 16, '1/16': 32, '1/32': 64, '1/64': 128 };

    // « Demi-finales — retour » et « Demi-finales » sont le meme
    // tour : on retire la mention de manche avant de comparer.
    function normaliser(texte) {
        return String(texte == null ? '' : texte)
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/\s*[—–-]\s*(retour|aller)\s*$/, '')
            .trim();
    }

    function estTroisiemePlace(match) {
        if (!match) return false;
        if (match.round_code === '3e') return true;
        var n = normaliser(match.round);
        return n.indexOf('3e place') !== -1 || n.indexOf('troisieme place') !== -1;
    }

    // Renvoie le nombre d'equipes du tour, ou null si la
    // rencontre n'appartient pas a un tableau (poule, journee de
    // championnat, ronde suisse...).
    function tailleDuTour(match) {
        if (!match) return null;
        if (estTroisiemePlace(match)) return null;   // traite a part

        var t = Number(match.round_size);
        if (isFinite(t) && t >= 2) return t;

        if (match.round_code && PAR_CODE[match.round_code]) return PAR_CODE[match.round_code];

        var n = normaliser(match.round);
        if (PAR_NOM[n]) return PAR_NOM[n];

        // « Tour à 12 équipes », forme de secours de nomDuTour().
        var m = n.match(/^tour a (\d+) equipes?$/);
        if (m) {
            var v = parseInt(m[1], 10);
            if (isFinite(v) && v >= 2) return v;
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LA REGLE DU TABLEAU
    // -------------------------------------------------------
    // Ou va le vainqueur de l'affiche p d'un tour a T equipes.
    // ═══════════════════════════════════════════════════════

    function prochaineCase(taille, position) {
        var t = Number(taille), p = Number(position);
        if (!isFinite(t) || !isFinite(p) || t < 4 || p < 1) return null;   // t = 2 : c'est la finale
        return {
            taille: t / 2,
            position: Math.ceil(p / 2),
            cote: (p % 2 === 1) ? 'A' : 'B'
        };
    }

    // ═══════════════════════════════════════════════════════
    // 3. QUI A GAGNE UNE AFFICHE
    // -------------------------------------------------------
    // Une affiche, c'est une ou deux manches entre les deux memes
    // equipes. On rend le vainqueur ET le perdant : le match pour
    // la 3e place a besoin des perdants.
    // ═══════════════════════════════════════════════════════

    function nombre(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function id(v) { return v == null || v === '' ? null : String(v); }

    function resultatDeLAffiche(manches) {
        var vide = { vainqueur: null, perdant: null, tranche: false, motif: null };
        if (!manches || !manches.length) return vide;

        var triees = manches.slice().sort(function (x, y) { return nombre(x.leg || 1) - nombre(y.leg || 1); });
        var premiere = triees[0];

        var equipeA = id(premiere.team_a_id);
        var equipeB = id(premiere.team_b_id);

        // --- L'exemption : l'equipe presente passe, sans adversaire.
        if (premiere.is_bye) {
            var passe = equipeA || equipeB;
            if (!passe) return vide;
            return { vainqueur: passe, perdant: null, tranche: true, motif: 'exemption' };
        }

        if (!equipeA || !equipeB) return vide;   // affiche pas encore formee

        // --- Le forfait prime sur le score. Il peut etre declare
        //     sur l'une ou l'autre manche.
        var forfait = null;
        triees.forEach(function (m) { if (id(m.forfeit_team_id)) forfait = id(m.forfeit_team_id); });
        if (forfait) {
            var gagne = (forfait === equipeA) ? equipeB : equipeA;
            return { vainqueur: gagne, perdant: forfait, tranche: true, motif: 'forfait' };
        }

        // --- Toutes les manches doivent etre jouees.
        var toutesJouees = triees.every(function (m) { return m.status === 'completed'; });
        if (!toutesJouees) return vide;

        // --- Le cumul, en respectant qui recoit dans chaque manche.
        //     Au retour, gt-calendrier inverse les equipes : sans
        //     cette orientation, on additionnerait les scores de
        //     l'adversaire.
        var cumulA = 0, cumulB = 0;
        triees.forEach(function (m) {
            var a = nombre(m.score_a), b = nombre(m.score_b);
            if (id(m.team_a_id) === equipeA) { cumulA += a; cumulB += b; }
            else                             { cumulA += b; cumulB += a; }
        });

        if (cumulA > cumulB) return { vainqueur: equipeA, perdant: equipeB, tranche: true, motif: 'score' };
        if (cumulB > cumulA) return { vainqueur: equipeB, perdant: equipeA, tranche: true, motif: 'score' };

        // --- Egalite : les tirs au but.
        var derniere = triees[triees.length - 1];
        var parId = id(derniere.penalty_winner_id);
        if (parId) {
            return {
                vainqueur: parId,
                perdant: (parId === equipeA) ? equipeB : equipeA,
                tranche: true, motif: 'tirs au but'
            };
        }

        var tabA = derniere.penalty_a, tabB = derniere.penalty_b;
        if (tabA != null && tabB != null && nombre(tabA) !== nombre(tabB)) {
            // Attention a l'orientation de la derniere manche.
            var aEstA = id(derniere.team_a_id) === equipeA;
            var pourA = aEstA ? nombre(tabA) : nombre(tabB);
            var pourB = aEstA ? nombre(tabB) : nombre(tabA);
            var g = pourA > pourB ? equipeA : equipeB;
            return {
                vainqueur: g, perdant: (g === equipeA) ? equipeB : equipeA,
                tranche: true, motif: 'tirs au but'
            };
        }

        // Egalite non tranchee : on ne devine pas.
        return { vainqueur: null, perdant: null, tranche: false, motif: 'egalite non tranchee' };
    }

    // ═══════════════════════════════════════════════════════
    // 4. REGROUPER LES MANCHES EN AFFICHES
    // ═══════════════════════════════════════════════════════

    function affichesDuTableau(matchs) {
        var parCle = {};
        var troisieme = [];

        (matchs || []).forEach(function (m) {
            if (!m) return;
            if (estTroisiemePlace(m)) { troisieme.push(m); return; }
            var taille = tailleDuTour(m);
            if (taille == null) return;                   // pas une rencontre de tableau
            var position = Number(m.bracket_position);
            if (!isFinite(position) || position < 1) return;
            var cle = taille + '#' + position;
            if (!parCle[cle]) parCle[cle] = { taille: taille, position: position, manches: [] };
            parCle[cle].manches.push(m);
        });

        var liste = Object.keys(parCle).map(function (k) { return parCle[k]; });
        liste.sort(function (x, y) {
            if (x.taille !== y.taille) return y.taille - x.taille;   // du plus large au plus etroit
            return x.position - y.position;
        });
        liste.forEach(function (a) {
            a.manches.sort(function (x, y) { return nombre(x.leg || 1) - nombre(y.leg || 1); });
        });

        return { affiches: liste, troisieme: troisieme };
    }

    // ═══════════════════════════════════════════════════════
    // 5. LA PROPAGATION
    // -------------------------------------------------------
    // Rend :
    //   ecritures : [{ id, team_a_id? , team_b_id? }] a appliquer
    //   refus     : les cases qu'on a refuse de toucher, avec le
    //               motif — une affiche deja jouee, par exemple
    //   champion  : le vainqueur de la finale, s'il est connu
    // ═══════════════════════════════════════════════════════

    function propager(matchs) {
        var groupes = affichesDuTableau(matchs);
        var affiches = groupes.affiches;

        // Index : « taille#position » -> affiche
        var parCle = {};
        affiches.forEach(function (a) { parCle[a.taille + '#' + a.position] = a; });

        // On calcule d'abord tous les resultats, une seule fois.
        affiches.forEach(function (a) { a.resultat = resultatDeLAffiche(a.manches); });

        var ecritures = {};      // idMatch -> { id, team_a_id?, team_b_id? }
        var refus = [];
        var champion = null;

        function poser(affiche, cote, idEquipe, provenance) {
            if (!affiche || !idEquipe) return;

            // Une affiche deja jouee ne se reecrit pas.
            var dejaJouee = affiche.manches.some(function (m) {
                return m.status === 'completed' && !m.is_bye;
            });

            affiche.manches.forEach(function (m) {
                // Au retour, les equipes sont inversees : le vainqueur
                // qui prend la place A a l'aller prend la place B au
                // retour.
                var estRetour = nombre(m.leg || 1) === 2;
                var colonne = (cote === 'A')
                    ? (estRetour ? 'team_b_id' : 'team_a_id')
                    : (estRetour ? 'team_a_id' : 'team_b_id');

                var actuel = id(m[colonne]);
                if (actuel === idEquipe) return;            // deja en place
                if (actuel && dejaJouee) {
                    refus.push({
                        id: m.id, colonne: colonne, actuel: actuel, voulu: idEquipe,
                        motif: 'cette affiche porte déjà un résultat — rien n\'a été touché'
                    });
                    return;
                }
                if (!ecritures[m.id]) ecritures[m.id] = { id: m.id };
                ecritures[m.id][colonne] = idEquipe;
                ecritures[m.id]._provenance = provenance;
            });
        }

        // --- Les tours, du plus large au plus etroit : un vainqueur
        //     pose au tour N doit pouvoir avancer au tour N+1 dans
        //     le meme passage.
        affiches.forEach(function (a) {
            if (a.taille === 2) {
                if (a.resultat.tranche && a.resultat.vainqueur) champion = a.resultat.vainqueur;
                return;                                    // la finale ne mene nulle part
            }
            if (!a.resultat.tranche || !a.resultat.vainqueur) return;

            var cible = prochaineCase(a.taille, a.position);
            if (!cible) return;

            var suivante = parCle[cible.taille + '#' + cible.position];
            if (!suivante) {
                refus.push({
                    id: null, motif: 'aucune affiche ' + cible.taille + '#' + cible.position +
                                     ' pour recevoir le vainqueur — le tableau est incomplet'
                });
                return;
            }

            poser(suivante, cible.cote, a.resultat.vainqueur,
                  'vainqueur de ' + a.taille + '#' + a.position);

            // Le vainqueur vient d'etre pose : si l'affiche suivante
            // est complete et jouee, elle sera traitee a son tour —
            // les affiches sont parcourues du plus large au plus
            // etroit, donc dans le bon ordre.
            suivante.manches.forEach(function (m) {
                var e = ecritures[m.id];
                if (!e) return;
                if (e.team_a_id) m.team_a_id = e.team_a_id;
                if (e.team_b_id) m.team_b_id = e.team_b_id;
            });
            suivante.resultat = resultatDeLAffiche(suivante.manches);
        });

        // --- Le match pour la 3e place : les deux PERDANTS des
        //     demi-finales, dans l'ordre des positions.
        if (groupes.troisieme.length) {
            var demi1 = parCle['4#1'];
            var demi2 = parCle['4#2'];
            var affiche3e = { manches: groupes.troisieme };
            if (demi1 && demi1.resultat && demi1.resultat.perdant) {
                poser(affiche3e, 'A', demi1.resultat.perdant, 'perdant de la demi-finale 1');
            }
            if (demi2 && demi2.resultat && demi2.resultat.perdant) {
                poser(affiche3e, 'B', demi2.resultat.perdant, 'perdant de la demi-finale 2');
            }
        }

        var liste = Object.keys(ecritures).map(function (k) {
            var e = ecritures[k];
            delete e._provenance;
            return e;
        });

        return {
            ecritures: liste,
            refus: refus,
            champion: champion,
            affiches: affiches.length
        };
    }

    // ═══════════════════════════════════════════════════════
    // 6. UN RESUME LISIBLE, POUR LE MESSAGE A L'ECRAN
    // ═══════════════════════════════════════════════════════

    function resumer(resultat, nomsEquipes) {
        nomsEquipes = nomsEquipes || {};
        var n = resultat.ecritures.length;

        // Le sacre se dit TOUJOURS, meme quand il n'y a plus rien a
        // ecrire : c'est justement au dernier passage, celui ou le
        // tableau est deja complet, que la finale vient d'etre jouee.
        // La premiere version sortait ici avec « deja a jour » et le
        // champion n'etait jamais annonce.
        var sacre = resultat.champion
            ? 'Vainqueur du tournoi : ' + (nomsEquipes[resultat.champion] || resultat.champion) + '.'
            : null;

        if (!n && !resultat.refus.length) {
            return sacre
                ? sacre + ' Le tableau est complet.'
                : 'Le tableau est déjà à jour : aucune place à remplir.';
        }

        var texte = n
            ? n + ' place(s) remplie(s) dans le tableau.'
            : 'Aucune place à remplir.';
        if (sacre) texte += ' ' + sacre;
        if (resultat.refus.length) {
            texte += ' ' + resultat.refus.length + ' place(s) laissée(s) intacte(s) — ' +
                     resultat.refus[0].motif + '.';
        }
        return texte;
    }

    // ═══════════════════════════════════════════════════════
    // 7. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        tailleDuTour: tailleDuTour,
        estTroisiemePlace: estTroisiemePlace,
        prochaineCase: prochaineCase,
        resultatDeLAffiche: resultatDeLAffiche,
        affichesDuTableau: affichesDuTableau,
        propager: propager,
        resumer: resumer
    };
})();
