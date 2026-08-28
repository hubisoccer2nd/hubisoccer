/* ============================================================
   HubISoccer — gt-classement.js
   Système Gestion Tournois — Moteur de classement
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   gt_standings était lu par rankings.js, team-details.js et
   tournament-details.js. Il n'était écrit par PERSONNE : aucun
   insert, aucun update, aucun trigger. Le classement ne pouvait
   donc jamais bouger d'un point, quels que soient les résultats
   enregistrés.

   saveMatchResult() écrivait score_a, score_b et status, puis
   s'arrêtait là. Points, victoires, différence de buts : rien ne
   suivait.

   CE FICHIER NE TOUCHE NI AU DOM NI AU RÉSEAU

   Du calcul pur, comme gt-calendrier.js. Il reçoit les rencontres
   et rend le classement trié. L'écriture en base appartient à la
   page appelante.

   CE QU'IL FAIT

   1. Agrège les rencontres terminées en lignes de classement.
   2. Applique le barème du tournoi, y compris les tirs au but et
      le score de forfait.
   3. Départage les égalités selon l'échelle ordonnée choisie —
      jusqu'aux confrontations directes, qui exigent de recalculer
      un mini-classement entre les seules équipes à égalité.
   4. Attribue les zones de qualification.
   5. Calcule la forme sur les cinq dernières rencontres.

   L'ORDRE DE L'ÉCHELLE EST L'INFORMATION

   LaLiga départage par confrontations directes puis différence de
   buts. La Coupe du Monde passe par sept critères. Ce n'est pas le
   même classement pour les mêmes résultats : l'échelle se règle
   par tournoi, et ce module l'applique telle quelle.
   ============================================================ */
'use strict';

window.GTClassement = (function () {

    // ═══════════════════════════════════════════════════════════
    // 1. BARÈME PAR DÉFAUT
    // ═══════════════════════════════════════════════════════════
    var BAREME_DEFAUT = {
        pointsVictoire: 3,
        pointsNul: 1,
        pointsDefaite: 0,
        pointsVictoireTirsAuBut: 2,
        pointsDefaiteTirsAuBut: 1,
        forfaitVainqueur: 3,
        forfaitPerdant: 0
    };

    var DEPARTAGE_DEFAUT = ['difference_generale', 'buts_generaux'];

    // ═══════════════════════════════════════════════════════════
    // 2. LIGNE DE CLASSEMENT VIERGE
    // ═══════════════════════════════════════════════════════════
    function ligneVierge(idEquipe) {
        return {
            team_id: idEquipe,
            played: 0, wins: 0, draws: 0, losses: 0,
            goals_for: 0, goals_against: 0, points: 0,
            // colonnes ajoutées par le chantier 03
            discipline_points: 0,
            points_penalty: 0,
            recent_form: [],          // ['V','N','D',…] de la plus ancienne à la plus récente
            // travail interne, non écrit en base
            __butsExterieur: 0,
            __adversaires: {}         // idAdversaire -> { pour, contre, points, joues }
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 3. UNE RENCONTRE COMPTE-T-ELLE ?
    //    Une exemption ne se joue pas : elle ne rapporte rien et
    //    n'entre pas dans le nombre de matchs disputés.
    // ═══════════════════════════════════════════════════════════
    function estComptabilisable(match) {
        if (!match) return false;
        if (match.is_bye) return false;
        if (match.status !== 'completed') return false;
        if (!match.team_a_id || !match.team_b_id) return false;
        return true;
    }

    // Filtre domicile / extérieur, du point de vue d'une équipe.
    function retenirSelonFiltre(match, idEquipe, filtre) {
        if (filtre === 'domicile')  return match.team_a_id === idEquipe;
        if (filtre === 'exterieur') return match.team_b_id === idEquipe;
        return true;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. AGRÉGATION
    // ═══════════════════════════════════════════════════════════
    function agreger(matchs, equipes, bareme, options) {
        options = options || {};
        var filtre = options.filtre || 'tout';
        var discipline = options.discipline || {};   // idEquipe -> points de discipline
        var penalites = options.penalites || {};     // idEquipe -> points retirés

        var lignes = {};
        equipes.forEach(function (id) { lignes[id] = ligneVierge(id); });

        // Quand une liste d'équipes est fournie, on ne retient que
        // les rencontres qui opposent DEUX équipes de cette liste.
        //
        // Sans ce filtre, le classement d'un groupe recevait aussi
        // les matchs des autres groupes et créait des lignes pour
        // des équipes qui n'y jouent pas : le groupe A se retrouvait
        // avec les 48 équipes du tournoi.
        var restreindre = equipes.length > 0;
        var admises = {};
        equipes.forEach(function (id) { admises[id] = true; });

        // Les rencontres sont parcourues dans l'ordre chronologique
        // pour que la forme récente ait un sens.
        var ordonnees = matchs.slice().sort(function (a, b) {
            var da = a.match_date ? new Date(a.match_date).getTime() : 0;
            var db = b.match_date ? new Date(b.match_date).getTime() : 0;
            if (da !== db) return da - db;
            return (a.matchday || 0) - (b.matchday || 0);
        });

        ordonnees.forEach(function (m) {
            if (!estComptabilisable(m)) return;

            var a = m.team_a_id, b = m.team_b_id;
            if (restreindre && (!admises[a] || !admises[b])) return;

            if (!lignes[a]) lignes[a] = ligneVierge(a);
            if (!lignes[b]) lignes[b] = ligneVierge(b);

            var butsA = m.score_a || 0;
            var butsB = m.score_b || 0;

            // Forfait : le score est imposé par le barème du tournoi,
            // quel que soit ce qui a été saisi.
            if (m.forfeit_team_id) {
                if (m.forfeit_team_id === a) { butsA = bareme.forfaitPerdant;  butsB = bareme.forfaitVainqueur; }
                else if (m.forfeit_team_id === b) { butsA = bareme.forfaitVainqueur; butsB = bareme.forfaitPerdant; }
            }

            // Tirs au but : le vainqueur est désigné hors du score,
            // qui reste celui du temps réglementaire.
            var vainqueurTab = m.penalty_winner_id || null;

            [[a, b, butsA, butsB, true], [b, a, butsB, butsA, false]].forEach(function (cote) {
                var equipe = cote[0], adversaire = cote[1];
                var pour = cote[2], contre = cote[3], recoit = cote[4];

                if (!retenirSelonFiltre(m, equipe, filtre)) return;

                var l = lignes[equipe];
                l.played++;
                l.goals_for += pour;
                l.goals_against += contre;
                if (!recoit) l.__butsExterieur += pour;

                var resultat;
                if (vainqueurTab) {
                    // Match nul dans le temps réglementaire, tranché
                    // aux tirs au but : ni victoire ni défaite pleine.
                    if (vainqueurTab === equipe) { l.points += bareme.pointsVictoireTirsAuBut; l.draws++; resultat = 'V'; }
                    else                          { l.points += bareme.pointsDefaiteTirsAuBut;  l.draws++; resultat = 'D'; }
                } else if (pour > contre) {
                    l.wins++;   l.points += bareme.pointsVictoire; resultat = 'V';
                } else if (pour === contre) {
                    l.draws++;  l.points += bareme.pointsNul;      resultat = 'N';
                } else {
                    l.losses++; l.points += bareme.pointsDefaite;  resultat = 'D';
                }

                l.recent_form.push(resultat);
                if (l.recent_form.length > 5) l.recent_form.shift();

                // Mémoire des confrontations directes
                if (!l.__adversaires[adversaire]) {
                    l.__adversaires[adversaire] = { pour: 0, contre: 0, points: 0, joues: 0 };
                }
                var duel = l.__adversaires[adversaire];
                duel.joues++;
                duel.pour += pour;
                duel.contre += contre;
                if (vainqueurTab) duel.points += (vainqueurTab === equipe) ? bareme.pointsVictoireTirsAuBut : bareme.pointsDefaiteTirsAuBut;
                else if (pour > contre)   duel.points += bareme.pointsVictoire;
                else if (pour === contre) duel.points += bareme.pointsNul;
                else                      duel.points += bareme.pointsDefaite;
            });
        });

        // Discipline et pénalités
        Object.keys(lignes).forEach(function (id) {
            lignes[id].discipline_points = discipline[id] || 0;
            lignes[id].points_penalty = penalites[id] || 0;
            lignes[id].points -= lignes[id].points_penalty;
        });

        return Object.keys(lignes).map(function (id) { return lignes[id]; });
    }

    // ═══════════════════════════════════════════════════════════
    // 5. CONFRONTATIONS DIRECTES
    //    On ne compare que les rencontres entre les équipes encore
    //    à égalité — c'est la règle FIFA et LaLiga. Une équipe qui
    //    n'a pas rencontré toutes les autres du groupe à égalité
    //    fausse le critère : LaLiga ne l'applique alors pas.
    // ═══════════════════════════════════════════════════════════
    function bilanDirect(ligne, idsConcernes) {
        var pour = 0, contre = 0, points = 0, joues = 0;
        idsConcernes.forEach(function (id) {
            if (id === ligne.team_id) return;
            var duel = ligne.__adversaires[id];
            if (!duel) return;
            pour += duel.pour;
            contre += duel.contre;
            points += duel.points;
            joues += duel.joues;
        });
        return { pour: pour, contre: contre, points: points, joues: joues, difference: pour - contre };
    }

    // Tous les membres du groupe se sont-ils rencontrés ?
    function confrontationsCompletes(groupe) {
        var ids = groupe.map(function (l) { return l.team_id; });
        return groupe.every(function (l) {
            return ids.every(function (id) {
                return id === l.team_id || (l.__adversaires[id] && l.__adversaires[id].joues > 0);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. APPLICATION DE L'ÉCHELLE DE DÉPARTAGE
    // ═══════════════════════════════════════════════════════════
    function valeurCritere(critere, ligne, idsConcernes, reference) {
        switch (critere) {
            case 'confrontation_points':     return bilanDirect(ligne, idsConcernes).points;
            case 'confrontation_difference': return bilanDirect(ligne, idsConcernes).difference;
            case 'confrontation_buts':       return bilanDirect(ligne, idsConcernes).pour;
            case 'difference_generale':      return ligne.goals_for - ligne.goals_against;
            case 'buts_generaux':            return ligne.goals_for;
            case 'buts_exterieur':           return ligne.__butsExterieur;
            case 'victoires':                return ligne.wins;
            // Moins de points de discipline vaut mieux : on inverse
            // pour rester sur « le plus grand gagne ».
            case 'points_discipline':        return -ligne.discipline_points;
            // Une meilleure position vaut un plus petit nombre :
            // on inverse aussi.
            case 'classement_reference':     return -((reference && reference[ligne.team_id]) || 9999);
            case 'tirage_au_sort':           return 0;
            default:                         return 0;
        }
    }

    function trier(lignes, departage, reference) {
        var echelle = (departage && departage.length) ? departage : DEPARTAGE_DEFAUT;

        // Premier tri : les points, toujours.
        var trie = lignes.slice().sort(function (x, y) { return y.points - x.points; });

        // Puis on départage groupe d'égalité par groupe d'égalité.
        var resultat = [];
        var i = 0;
        while (i < trie.length) {
            var j = i;
            while (j + 1 < trie.length && trie[j + 1].points === trie[i].points) j++;

            var groupe = trie.slice(i, j + 1);

            if (groupe.length === 1) {
                resultat.push(groupe[0]);
                i = j + 1;
                continue;
            }

            var idsConcernes = groupe.map(function (l) { return l.team_id; });
            var directesUtilisables = confrontationsCompletes(groupe);

            groupe.sort(function (x, y) {
                for (var k = 0; k < echelle.length; k++) {
                    var critere = echelle[k];

                    // Confrontations directes inapplicables tant que
                    // toutes les équipes concernées ne se sont pas
                    // rencontrées : on saute le critère.
                    if (critere.indexOf('confrontation_') === 0 && !directesUtilisables) continue;

                    var vx = valeurCritere(critere, x, idsConcernes, reference);
                    var vy = valeurCritere(critere, y, idsConcernes, reference);
                    if (vx !== vy) return vy - vx;
                }
                // Rien n'a départagé : ordre stable par identifiant,
                // pour que deux calculs successifs donnent le même
                // classement.
                return String(x.team_id).localeCompare(String(y.team_id));
            });

            // On note où l'égalité subsiste, pour pouvoir le dire.
            groupe.forEach(function (l, rang) {
                l.__egaliteNonTranchee = false;
                if (rang > 0) {
                    var precedent = groupe[rang - 1];
                    var identique = echelle.every(function (critere) {
                        if (critere.indexOf('confrontation_') === 0 && !directesUtilisables) return true;
                        return valeurCritere(critere, l, idsConcernes, reference) ===
                               valeurCritere(critere, precedent, idsConcernes, reference);
                    });
                    if (identique) { l.__egaliteNonTranchee = true; precedent.__egaliteNonTranchee = true; }
                }
            });

            resultat = resultat.concat(groupe);
            i = j + 1;
        }

        return resultat;
    }

    // ═══════════════════════════════════════════════════════════
    // 7. ZONES DE QUALIFICATION
    // ═══════════════════════════════════════════════════════════
    function appliquerZones(lignes, zones) {
        lignes.forEach(function (ligne, index) {
            var rang = index + 1;
            ligne.rang = rang;
            ligne.zone = null;
            if (!zones || !zones.length) return;
            for (var i = 0; i < zones.length; i++) {
                if (rang >= zones[i].de && rang <= zones[i].a) {
                    ligne.zone = { libelle: zones[i].libelle, couleur: zones[i].couleur };
                    return;
                }
            }
        });
        return lignes;
    }

    // ═══════════════════════════════════════════════════════════
    // 8. POINT D'ENTRÉE
    // ═══════════════════════════════════════════════════════════
    function calculer(parametres) {
        parametres = parametres || {};
        var matchs = parametres.matchs || [];
        var equipes = parametres.equipes || [];
        var bareme = Object.assign({}, BAREME_DEFAUT, parametres.bareme || {});
        var departage = parametres.departage || DEPARTAGE_DEFAUT;
        var zones = parametres.zones || [];

        var lignes = agreger(matchs, equipes, bareme, {
            filtre: parametres.filtre || 'tout',
            discipline: parametres.discipline,
            penalites: parametres.penalites
        });

        var triees = trier(lignes, departage, parametres.reference);
        return appliquerZones(triees, zones);
    }

    // Classement par groupe. Chaque groupe est trié séparément,
    // avec sa propre numérotation et ses propres zones.
    function calculerParGroupe(parametres) {
        parametres = parametres || {};
        var groupeDe = parametres.groupeDe || {};    // idEquipe -> nom du groupe
        var equipes = parametres.equipes || [];

        var parGroupe = {};
        equipes.forEach(function (id) {
            var nom = groupeDe[id] || 'Sans groupe assigné';
            (parGroupe[nom] = parGroupe[nom] || []).push(id);
        });

        var resultat = {};
        Object.keys(parGroupe).sort().forEach(function (nom) {
            resultat[nom] = calculer(Object.assign({}, parametres, { equipes: parGroupe[nom] }));
        });
        return resultat;
    }

    // Classement des troisièmes, tous groupes confondus — la règle
    // du Mondial 2026 et de la CAN. On extrait la ligne de rang N
    // de chaque groupe et on les compare entre elles.
    function classerLesTroisiemes(parGroupe, rang, departage, reference) {
        var lignes = [];
        Object.keys(parGroupe).forEach(function (nom) {
            var ligne = parGroupe[nom][rang - 1];
            if (ligne) {
                var copie = Object.assign({}, ligne);
                copie.__groupe = nom;
                lignes.push(copie);
            }
        });
        return trier(lignes, departage, reference).map(function (l, index) {
            l.rang = index + 1;
            return l;
        });
    }

    // Prépare les lignes pour l'écriture dans gt_standings :
    // on retire tout ce qui est interne au calcul.
    function pourLaBase(lignes, idTournoi) {
        return lignes.map(function (l) {
            return {
                tournament_id: idTournoi,
                team_id: l.team_id,
                played: l.played,
                wins: l.wins,
                draws: l.draws,
                losses: l.losses,
                goals_for: l.goals_for,
                goals_against: l.goals_against,
                points: l.points,
                discipline_points: l.discipline_points,
                points_penalty: l.points_penalty,
                recent_form: l.recent_form.join(''),
                current_rank: l.rang || null,
                qualification_zone: l.zone ? l.zone.libelle : null
            };
        });
    }

    return {
        calculer: calculer,
        calculerParGroupe: calculerParGroupe,
        classerLesTroisiemes: classerLesTroisiemes,
        pourLaBase: pourLaBase,
        trier: trier,
        BAREME_DEFAUT: BAREME_DEFAUT,
        DEPARTAGE_DEFAUT: DEPARTAGE_DEFAUT
    };

})();
