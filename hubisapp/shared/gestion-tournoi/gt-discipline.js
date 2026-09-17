/* ============================================================
   HubISoccer — gt-discipline.js
   Systeme Gestion Tournois — LES SUSPENSIONS, POUR DE VRAI
   ------------------------------------------------------------
   CE QUI N'ALLAIT PAS

   Les cartons etaient bien enregistres : l'arbitre les saisit,
   gt-officiels.js en fait des evenements yellow_card et
   red_card, et ils arrivent dans gt_match_events.

   Et ensuite, plus rien.

   PERSONNE ne les comptait. is_suspended existait sur la fiche
   d'un membre, mais aucune ligne de code ne le calculait : un
   interrupteur que l'organisateur devait cocher a la main, en
   tenant lui-meme le compte sur un carnet.

   Pire, rien ne l'imposait. La composition se contentait de
   RANGER les suspendus en fin de liste :
       disponibles.concat(indisponibles)
   Rien n'empechait de les aligner. Un tournoi qui ne sanctionne
   pas n'est pas arbitrable.

   CE QUE FAIT CE FICHIER

   Il calcule. Rien d'autre. Aucun acces au DOM, aucun appel
   reseau, aucune dependance.

   On lui donne les cartons, les rencontres et le reglement ; il
   rend, pour chaque sportif, ce qu'il a pris et s'il est
   suspendu maintenant.

   LES REGLES APPLIQUEES

     · N cartons jaunes CUMULES sur des matchs differents
       declenchent une suspension. N est reglable (3 par defaut).
       Le compteur repart a zero une fois la peine purgee.

     · DEUX jaunes dans le MEME match valent une expulsion. Les
       deux jaunes ne comptent alors PAS dans le cumul — c'est la
       regle partout : on ne paie pas deux fois la meme faute.

     · Un carton ROUGE direct suspend pour le nombre de matchs
       prevu au reglement.

     · Une peine se purge quand l'EQUIPE joue, que le sportif
       soit sur la feuille ou non. C'est le match qui passe, pas
       la presence.

   CE QU'IL NE FAIT JAMAIS

   Il ne devine pas la gravite d'un rouge. Une agression vaut
   plus qu'un dernier recours, mais seule la commission de
   discipline peut le dire : le reglement fixe un minimum, et
   l'organisateur peut alourdir a la main. On ne remplace pas un
   jugement par une soustraction.
   ============================================================ */
window.GTDiscipline = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. LE RÈGLEMENT
    // -------------------------------------------------------
    // Les valeurs par defaut sont celles qu'on rencontre le plus
    // souvent sur les tournois amateurs. Tout est reglable par
    // tournoi.
    // ═══════════════════════════════════════════════════════

    var REGLEMENT_DEFAUT = {
        jaunesPourSuspension: 3,      // 3 jaunes cumulés = 1 match
        matchsApresCumulJaunes: 1,
        matchsApresDoubleJaune: 1,    // 2 jaunes dans le même match
        matchsApresRouge: 1,          // rouge direct — minimum
        compteurRemisApresPeine: true,
        compteurRemisApresPhase: false
    };

    function reglement(personnalise) {
        var r = {};
        Object.keys(REGLEMENT_DEFAUT).forEach(function (c) { r[c] = REGLEMENT_DEFAUT[c]; });
        Object.keys(personnalise || {}).forEach(function (c) {
            if (personnalise[c] == null || personnalise[c] === '') return;
            if (typeof REGLEMENT_DEFAUT[c] === 'boolean') { r[c] = !!personnalise[c]; return; }
            var n = Number(personnalise[c]);
            if (isFinite(n) && n >= 0) r[c] = n;
        });
        return r;
    }

    function nombre(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function id(v) { return v == null || v === '' ? null : String(v); }

    // ═══════════════════════════════════════════════════════
    // 2. LA CHRONOLOGIE
    // -------------------------------------------------------
    // Une suspension n'a de sens que dans l'ordre des matchs.
    // On trie par date ; a defaut de date, par journee, puis par
    // identifiant — pour que deux calculs successifs donnent
    // toujours le meme resultat.
    // ═══════════════════════════════════════════════════════

    function ordonner(matchs) {
        return (matchs || []).slice().sort(function (a, b) {
            var da = a.match_date ? Date.parse(a.match_date) : NaN;
            var db = b.match_date ? Date.parse(b.match_date) : NaN;
            if (isFinite(da) && isFinite(db) && da !== db) return da - db;
            if (isFinite(da) && !isFinite(db)) return -1;
            if (!isFinite(da) && isFinite(db)) return 1;
            var ja = nombre(a.matchday), jb = nombre(b.matchday);
            if (ja && jb && ja !== jb) return ja - jb;
            return String(a.id).localeCompare(String(b.id));
        });
    }

    // Les matchs joues d'une equipe, dans l'ordre.
    function matchsDeLEquipe(matchs, idEquipe) {
        var e = id(idEquipe);
        return ordonner(matchs).filter(function (m) {
            if (!m || m.is_bye) return false;
            if (m.status !== 'completed') return false;
            return id(m.team_a_id) === e || id(m.team_b_id) === e;
        });
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE CALCUL, SPORTIF PAR SPORTIF
    // ═══════════════════════════════════════════════════════

    function calculer(donnees) {
        donnees = donnees || {};
        var regles = reglement(donnees.reglement);
        var matchs = donnees.matchs || [];
        var evenements = donnees.evenements || [];

        var parMatch = {};
        ordonner(matchs).forEach(function (m) { parMatch[String(m.id)] = m; });

        // --- Les cartons, regroupés par sportif puis par match
        var parSportif = {};
        evenements.forEach(function (e) {
            if (!e) return;
            var type = e.event_type;
            if (type !== 'yellow_card' && type !== 'red_card') return;
            var cle = id(e.player_id);
            if (!cle) return;
            var m = parMatch[String(e.match_id)];
            if (!m) return;                       // carton d'un match inconnu : on l'ignore

            if (!parSportif[cle]) parSportif[cle] = { equipes: {}, parMatch: {} };
            var eq = id(e.team_id) || id(m.team_a_id);
            if (eq) parSportif[cle].equipes[eq] = (parSportif[cle].equipes[eq] || 0) + 1;

            var k = String(e.match_id);
            if (!parSportif[cle].parMatch[k]) parSportif[cle].parMatch[k] = { jaunes: 0, rouges: 0, match: m };
            if (type === 'yellow_card') parSportif[cle].parMatch[k].jaunes++;
            else parSportif[cle].parMatch[k].rouges++;
        });

        var sortie = {};

        Object.keys(parSportif).forEach(function (cle) {
            var brut = parSportif[cle];
            // L'équipe du sportif : celle sous laquelle il a pris le
            // plus de cartons. Prendre « la première rencontrée »
            // dépendait de l'ordre d'arrivée des événements : un
            // sportif transféré en cours de tournoi pouvait changer
            // d'équipe d'un calcul à l'autre, et donc de calendrier
            // de purge. À égalité, on tranche sur l'identifiant pour
            // que deux calculs donnent toujours le même résultat.
            var equipe = Object.keys(brut.equipes).sort(function (x, y) {
                if (brut.equipes[y] !== brut.equipes[x]) return brut.equipes[y] - brut.equipes[x];
                return String(x).localeCompare(String(y));
            })[0] || null;

            var calendrier = equipe ? matchsDeLEquipe(matchs, equipe) : ordonner(matchs);
            var rangDuMatch = {};
            calendrier.forEach(function (m, i) { rangDuMatch[String(m.id)] = i; });

            var jaunesEnCours = 0;
            var totalJaunes = 0, totalRouges = 0;
            var peines = [];

            calendrier.forEach(function (m, rang) {
                var c = brut.parMatch[String(m.id)];
                if (!c) return;

                totalJaunes += c.jaunes;
                totalRouges += c.rouges;

                // --- Deux jaunes dans le même match = expulsion.
                //     Les deux jaunes ne comptent PAS dans le cumul :
                //     on ne paie pas deux fois la même faute.
                var doubleJaune = c.jaunes >= 2;

                if (doubleJaune) {
                    peines.push({
                        depuisRang: rang, matchOffense: m.id,
                        matchs: regles.matchsApresDoubleJaune,
                        motif: 'deux cartons jaunes dans le même match'
                    });
                } else if (c.jaunes === 1) {
                    jaunesEnCours += 1;
                    if (regles.jaunesPourSuspension > 0 && jaunesEnCours >= regles.jaunesPourSuspension) {
                        peines.push({
                            depuisRang: rang, matchOffense: m.id,
                            matchs: regles.matchsApresCumulJaunes,
                            motif: jaunesEnCours + ' cartons jaunes cumulés'
                        });
                        if (regles.compteurRemisApresPeine) jaunesEnCours = 0;
                    }
                }

                if (c.rouges > 0) {
                    peines.push({
                        depuisRang: rang, matchOffense: m.id,
                        matchs: regles.matchsApresRouge * c.rouges,
                        motif: c.rouges > 1 ? c.rouges + ' cartons rouges' : 'carton rouge'
                    });
                }
            });

            // --- Ce qui a été purgé : les matchs de l'équipe joués
            //     APRÈS celui de la faute.
            var joues = calendrier.length;
            var restantsTotal = 0;
            peines.forEach(function (p) {
                var purges = Math.max(0, joues - 1 - p.depuisRang);
                p.purges = Math.min(purges, p.matchs);
                p.restants = Math.max(0, p.matchs - purges);
                restantsTotal += p.restants;
                p.match_offense = p.matchOffense;
                delete p.depuisRang;
                delete p.matchOffense;
            });

            var enCours = peines.filter(function (p) { return p.restants > 0; });

            sortie[cle] = {
                cle: cle,
                equipe: equipe,
                jaunes: totalJaunes,
                rouges: totalRouges,
                jaunesDepuisLaDernierePeine: jaunesEnCours,
                jaunesAvantSuspension: regles.jaunesPourSuspension > 0
                    ? Math.max(0, regles.jaunesPourSuspension - jaunesEnCours) : null,
                peines: peines,
                suspendu: enCours.length > 0,
                matchsRestants: restantsTotal,
                motif: enCours.length ? enCours[0].motif : null
            };
        });

        return { parSportif: sortie, reglement: regles };
    }

    // ═══════════════════════════════════════════════════════
    // 4. LES QUESTIONS QUE POSENT LES PAGES
    // ═══════════════════════════════════════════════════════

    // Ce sportif peut-il jouer ?
    function peutJouer(resultat, cleSportif) {
        var d = resultat && resultat.parSportif ? resultat.parSportif[String(cleSportif)] : null;
        if (!d || !d.suspendu) return { autorise: true, motif: null, matchsRestants: 0 };
        return {
            autorise: false,
            motif: d.motif,
            matchsRestants: d.matchsRestants
        };
    }

    // Tous les suspendus, les plus lourdement sanctionnés d'abord.
    function suspendus(resultat) {
        var l = [];
        Object.keys((resultat && resultat.parSportif) || {}).forEach(function (c) {
            if (resultat.parSportif[c].suspendu) l.push(resultat.parSportif[c]);
        });
        return l.sort(function (a, b) {
            if (b.matchsRestants !== a.matchsRestants) return b.matchsRestants - a.matchsRestants;
            return String(a.cle).localeCompare(String(b.cle));
        });
    }

    // Ceux qui sont à un carton de la suspension : l'avertissement
    // qu'un capitaine veut lire AVANT le match, pas après.
    function surLeFil(resultat) {
        var l = [];
        Object.keys((resultat && resultat.parSportif) || {}).forEach(function (c) {
            var d = resultat.parSportif[c];
            if (!d.suspendu && d.jaunesAvantSuspension === 1) l.push(d);
        });
        return l;
    }

    // ═══════════════════════════════════════════════════════
    // 5. UNE PHRASE LISIBLE
    // ═══════════════════════════════════════════════════════

    function phrase(donnees, nom) {
        if (!donnees) return '';
        var qui = nom || donnees.cle;
        if (donnees.suspendu) {
            return qui + ' est suspendu ' + donnees.matchsRestants + ' match' +
                   (donnees.matchsRestants > 1 ? 's' : '') + ' — ' + donnees.motif + '.';
        }
        if (donnees.jaunesAvantSuspension === 1) {
            return qui + ' est à UN carton jaune de la suspension (' +
                   donnees.jaunesDepuisLaDernierePeine + ' en cours).';
        }
        return qui + ' : ' + donnees.jaunes + ' jaune(s), ' + donnees.rouges + ' rouge(s).';
    }

    return {
        REGLEMENT_DEFAUT: REGLEMENT_DEFAUT,
        reglement: reglement,
        ordonner: ordonner,
        matchsDeLEquipe: matchsDeLEquipe,
        calculer: calculer,
        peutJouer: peutJouer,
        suspendus: suspendus,
        surLeFil: surLeFil,
        phrase: phrase
    };
})();
