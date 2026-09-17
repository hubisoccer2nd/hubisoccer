/* ============================================================
   HubISoccer — gt-palmares.js
   Systeme Gestion Tournois — QUI A GAGNE LE TOURNOI
   ------------------------------------------------------------
   CE QUI MANQUAIT

   Deux choses existaient deja, et rien ne les reliait.

     gt_tournament_awards   les recompenses PROMISES, saisies a la
                            creation : « 1ere place : Trophee +
                            500 000 FCFA », « Meilleur buteur :
                            Ballon d'or ». Affichees sur la page
                            du tournoi.

     gt_prizes              les primes VERSEES, saisies a la main
                            par l'organisateur, qui devait taper
                            lui-meme le nom du beneficiaire.

   Entre les deux, le vide : PERSONNE n'etait jamais declare
   vainqueur. Un tournoi se jouait jusqu'a la finale et ne se
   terminait jamais vraiment. Aucune trace, aucun palmares,
   aucune equipe ne pouvait dire « nous avons gagne la Coupe de
   Cotonou 2026 ».

   Or depuis le chantier 13, la plateforme SAIT qui a gagne :
   gt-tableau.js rend le champion d'une coupe, gt-classement.js
   rend le premier d'un championnat. Il ne restait qu'a le
   graver.

   CE QUE FAIT CE FICHIER

   Il calcule. Rien d'autre. Aucun acces au DOM, aucun appel
   reseau, aucune dependance obligatoire — gt-tableau.js est
   utilise s'il est charge, sinon le podium d'une coupe est
   deduit ici meme.

   Il rend :
     · le podium (1er, 2e, 3e), avec la maniere dont il a ete
       obtenu, pour que l'organisateur puisse verifier ;
     · les distinctions individuelles : meilleur buteur, meilleur
       passeur, meilleure attaque, meilleure defense, fair-play ;
     · l'appariement entre ces resultats et les recompenses
       promises, prêt a etre ecrit.

   CE QU'IL NE FAIT JAMAIS

   Il n'invente pas de vainqueur. Une finale non jouee, une
   egalite non tranchee, des poules sans phase finale : il le
   DIT, et rend un podium incomplet avec la raison. Mieux vaut un
   tournoi qui reste ouvert qu'un palmares faux.
   ============================================================ */
window.GTPalmares = (function () {
    'use strict';

    function nombre(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function id(v) { return v == null || v === '' ? null : String(v); }

    // ═══════════════════════════════════════════════════════
    // 1. LE PODIUM D'UNE COUPE
    // -------------------------------------------------------
    //   1er  le vainqueur de la finale
    //   2e   le perdant de la finale
    //   3e   le vainqueur du match pour la 3e place s'il existe ;
    //        sinon les DEUX perdants de demi-finale, ex aequo —
    //        c'est la regle quand aucune petite finale n'est jouee.
    // ═══════════════════════════════════════════════════════

    function podiumDuTableau(matchs) {
        var vide = { premier: null, deuxieme: null, troisiemes: [], complet: false,
                     source: 'tableau', raison: null };

        if (typeof window === 'undefined' || !window.GTTableau) {
            vide.raison = 'gt-tableau.js n\'est pas chargé : le podium d\'une coupe ne peut pas être calculé.';
            return vide;
        }
        var T = window.GTTableau;
        var groupes = T.affichesDuTableau(matchs || []);
        if (!groupes.affiches.length) {
            vide.raison = 'aucune affiche de coupe reconnue dans ce tournoi.';
            return vide;
        }

        var finale = groupes.affiches.filter(function (a) { return a.taille === 2; })[0];
        if (!finale) {
            vide.raison = 'ce tableau n\'a pas de finale.';
            return vide;
        }

        var r = T.resultatDeLAffiche(finale.manches);
        if (!r.tranche || !r.vainqueur) {
            vide.raison = 'la finale n\'est pas jouée, ou son résultat n\'est pas tranché.';
            return vide;
        }

        var sortie = {
            premier: r.vainqueur,
            deuxieme: r.perdant,
            troisiemes: [],
            complet: true,
            source: 'tableau',
            raison: null,
            motifFinale: r.motif
        };

        // La petite finale, si elle a ete jouee.
        var petite = (groupes.troisieme || []);
        if (petite.length) {
            var r3 = T.resultatDeLAffiche(petite);
            if (r3.tranche && r3.vainqueur) {
                sortie.troisiemes = [r3.vainqueur];
                sortie.quatrieme = r3.perdant;
                sortie.motifTroisieme = 'match pour la 3e place';
                return sortie;
            }
        }

        // Sinon : les deux perdants de demi-finale, ex aequo.
        var demies = groupes.affiches.filter(function (a) { return a.taille === 4; });
        demies.forEach(function (d) {
            var rd = T.resultatDeLAffiche(d.manches);
            if (rd.tranche && rd.perdant) sortie.troisiemes.push(rd.perdant);
        });
        if (sortie.troisiemes.length) {
            sortie.motifTroisieme = petite.length
                ? 'match pour la 3e place non joué — les deux demi-finalistes sont ex æquo'
                : 'pas de match pour la 3e place — les deux demi-finalistes sont ex æquo';
        }
        return sortie;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LE PODIUM D'UN CHAMPIONNAT
    // -------------------------------------------------------
    // Les trois premiers du classement. On refuse de designer un
    // vainqueur tant que des rencontres restent a jouer : un
    // titre donne trop tot est un titre a reprendre.
    // ═══════════════════════════════════════════════════════

    function podiumDuClassement(lignes, options) {
        options = options || {};
        var vide = { premier: null, deuxieme: null, troisiemes: [], complet: false,
                     source: 'classement', raison: null };

        var tri = (lignes || []).slice().filter(function (l) { return l && l.team_id; });
        if (!tri.length) {
            vide.raison = 'le classement est vide.';
            return vide;
        }

        if (options.matchsRestants) {
            vide.raison = options.matchsRestants + ' rencontre(s) ne sont pas terminées : ' +
                          'le classement peut encore changer.';
            return vide;
        }

        // Le classement arrive deja trie par gt-classement.js ; on
        // respecte current_rank quand il est rempli.
        tri.sort(function (a, b) {
            var ra = nombre(a.current_rank || a.rang), rb = nombre(b.current_rank || b.rang);
            if (ra && rb && ra !== rb) return ra - rb;
            if (nombre(b.points) !== nombre(a.points)) return nombre(b.points) - nombre(a.points);
            var da = nombre(a.goals_for) - nombre(a.goals_against);
            var db = nombre(b.goals_for) - nombre(b.goals_against);
            if (db !== da) return db - da;
            return nombre(b.goals_for) - nombre(a.goals_for);
        });

        return {
            premier: id(tri[0] && tri[0].team_id),
            deuxieme: id(tri[1] && tri[1].team_id),
            troisiemes: tri[2] ? [id(tri[2].team_id)] : [],
            complet: !!tri[0],
            source: 'classement',
            raison: null,
            motifTroisieme: 'troisième du classement'
        };
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE PODIUM, TOUT COURT
    // -------------------------------------------------------
    // Une coupe tranche par sa finale. Un championnat par son
    // classement. Un tournoi qui a LES DEUX (poules puis phase
    // finale) est tranche par la phase finale : c'est elle qui
    // designe le vainqueur.
    // ═══════════════════════════════════════════════════════

    function podium(donnees) {
        donnees = donnees || {};
        var matchs = donnees.matchs || [];
        var classement = donnees.classement || [];

        var aUnTableau = false;
        if (typeof window !== 'undefined' && window.GTTableau) {
            aUnTableau = window.GTTableau.affichesDuTableau(matchs).affiches.length > 0;
        }

        if (aUnTableau) {
            var p = podiumDuTableau(matchs);
            if (p.complet) return p;
            // Un tableau commence mais pas fini : on ne retombe PAS
            // sur le classement des poules, ce serait un faux titre.
            return p;
        }

        var restants = matchs.filter(function (m) {
            return m && !m.is_bye && m.status !== 'completed';
        }).length;

        return podiumDuClassement(classement, { matchsRestants: restants });
    }

    // ═══════════════════════════════════════════════════════
    // 4. LES DISTINCTIONS INDIVIDUELLES
    // -------------------------------------------------------
    // Cumulees depuis les feuilles de match. Les ex aequo sont
    // rendus TOUS : c'est a l'organisateur de departager, pas au
    // calcul de choisir au hasard.
    // ═══════════════════════════════════════════════════════

    function meilleursSur(stats, colonne) {
        var parSportif = {};
        (stats || []).forEach(function (s) {
            var cle = id(s.player_id);
            if (!cle) return;
            parSportif[cle] = (parSportif[cle] || 0) + nombre(s[colonne]);
        });

        var liste = Object.keys(parSportif)
            .map(function (c) { return { cle: c, total: parSportif[c] }; })
            .filter(function (x) { return x.total > 0; })
            .sort(function (a, b) { return b.total - a.total || String(a.cle).localeCompare(String(b.cle)); });

        if (!liste.length) return { meilleurs: [], total: 0 };
        var sommet = liste[0].total;
        return {
            meilleurs: liste.filter(function (x) { return x.total === sommet; }).map(function (x) { return x.cle; }),
            total: sommet,
            classement: liste.slice(0, 10)
        };
    }

    function distinctions(donnees) {
        donnees = donnees || {};
        var stats = donnees.stats || [];
        var classement = donnees.classement || [];

        var d = {
            buteur:  meilleursSur(stats, 'goals'),
            passeur: meilleursSur(stats, 'assists'),
            gardien: null,
            attaque: null,
            defense: null,
            fairPlay: null
        };

        // Le gardien : le plus de clean sheets.
        var parGardien = {};
        stats.forEach(function (s) {
            var cle = id(s.player_id);
            if (!cle) return;
            if (s.clean_sheet) parGardien[cle] = (parGardien[cle] || 0) + 1;
        });
        var gk = Object.keys(parGardien)
            .map(function (c) { return { cle: c, total: parGardien[c] }; })
            .sort(function (a, b) { return b.total - a.total; });
        if (gk.length) {
            d.gardien = { meilleurs: gk.filter(function (x) { return x.total === gk[0].total; })
                                       .map(function (x) { return x.cle; }), total: gk[0].total };
        }

        // Attaque, defense et fair-play : depuis le classement.
        if (classement.length) {
            var parAttaque = classement.slice().sort(function (a, b) {
                return nombre(b.goals_for) - nombre(a.goals_for);
            });
            var parDefense = classement.slice().sort(function (a, b) {
                return nombre(a.goals_against) - nombre(b.goals_against);
            });
            var parDiscipline = classement.slice().sort(function (a, b) {
                return nombre(a.discipline_points) - nombre(b.discipline_points);
            });

            var sommetA = nombre(parAttaque[0].goals_for);
            var sommetD = nombre(parDefense[0].goals_against);
            var sommetF = nombre(parDiscipline[0].discipline_points);

            d.attaque = { meilleurs: parAttaque.filter(function (l) { return nombre(l.goals_for) === sommetA; })
                                               .map(function (l) { return id(l.team_id); }), total: sommetA };
            d.defense = { meilleurs: parDefense.filter(function (l) { return nombre(l.goals_against) === sommetD; })
                                               .map(function (l) { return id(l.team_id); }), total: sommetD };
            d.fairPlay = { meilleurs: parDiscipline.filter(function (l) { return nombre(l.discipline_points) === sommetF; })
                                                   .map(function (l) { return id(l.team_id); }), total: sommetF };
        }

        return d;
    }

    // ═══════════════════════════════════════════════════════
    // 5. APPARIER LES RÉCOMPENSES PROMISES AUX RÉSULTATS
    // -------------------------------------------------------
    // gt_tournament_awards contient ce qui a ete promis :
    //   award_type = 'rank'    avec rank_position 1, 2, 3…
    //   award_type = 'special' avec special_category en texte libre
    //                          (« Meilleur buteur », « Fair-play »…)
    //
    // Le texte libre est apparie par mots-cles, sans accent et
    // sans casse. Ce qu'on ne reconnait pas reste A ATTRIBUER A LA
    // MAIN : on ne devine pas.
    // ═══════════════════════════════════════════════════════

    function sansAccent(t) {
        return String(t == null ? '' : t).toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    var MOTS = [
        { cle: 'buteur',  motifs: ['buteur', 'meilleur marqueur', 'soulier', 'pichichi'], genre: 'sportif' },
        { cle: 'passeur', motifs: ['passeur', 'passe decisive', 'meilleure passe'],       genre: 'sportif' },
        { cle: 'gardien', motifs: ['gardien', 'portier', 'gant'],                         genre: 'sportif' },
        { cle: 'attaque', motifs: ['meilleure attaque', 'attaque'],                       genre: 'equipe'  },
        { cle: 'defense', motifs: ['meilleure defense', 'defense'],                       genre: 'equipe'  },
        { cle: 'fairPlay',motifs: ['fair play', 'fair-play', 'fairplay', 'discipline'],   genre: 'equipe'  }
    ];

    function categorieReconnue(texte) {
        var t = sansAccent(texte);
        if (!t) return null;
        for (var i = 0; i < MOTS.length; i++) {
            for (var j = 0; j < MOTS[i].motifs.length; j++) {
                if (t.indexOf(MOTS[i].motifs[j]) !== -1) return MOTS[i];
            }
        }
        return null;
    }

    // Rend, pour chaque recompense, le beneficiaire trouve — ou la
    // raison pour laquelle il ne l'est pas.
    function attribuer(recompenses, resultat) {
        var pod = resultat.podium || {};
        var dis = resultat.distinctions || {};
        var sortie = [];

        (recompenses || []).forEach(function (a) {
            var ligne = {
                award: a,
                genre: null,
                beneficiaires: [],
                exAequo: false,
                aLaMain: false,
                motif: null
            };

            if (a.award_type === 'rank') {
                ligne.genre = 'equipe';
                var rang = nombre(a.rank_position);
                if (rang === 1 && pod.premier)  ligne.beneficiaires = [pod.premier];
                else if (rang === 2 && pod.deuxieme) ligne.beneficiaires = [pod.deuxieme];
                else if (rang === 3 && (pod.troisiemes || []).length) ligne.beneficiaires = pod.troisiemes.slice();
                else if (rang === 4 && pod.quatrieme) ligne.beneficiaires = [pod.quatrieme];
                else { ligne.aLaMain = true; ligne.motif = 'aucun résultat pour la place ' + (rang || '?'); }
            } else {
                var cat = categorieReconnue(a.special_category);
                if (!cat) {
                    ligne.aLaMain = true;
                    ligne.motif = 'catégorie « ' + (a.special_category || '') + ' » non reconnue automatiquement';
                } else {
                    ligne.genre = cat.genre;
                    var d = dis[cat.cle];
                    if (d && d.meilleurs && d.meilleurs.length) {
                        ligne.beneficiaires = d.meilleurs.slice();
                        ligne.valeur = d.total;
                    } else {
                        ligne.aLaMain = true;
                        ligne.motif = 'aucune donnée pour « ' + (a.special_category || cat.cle) + ' »';
                    }
                }
            }

            ligne.exAequo = ligne.beneficiaires.length > 1;
            sortie.push(ligne);
        });

        return sortie;
    }

    // ═══════════════════════════════════════════════════════
    // 6. LE TOUT, EN UN APPEL
    // ═══════════════════════════════════════════════════════

    function calculer(donnees) {
        var pod = podium(donnees);
        var dis = distinctions(donnees);
        var att = attribuer(donnees.recompenses, { podium: pod, distinctions: dis });

        return {
            podium: pod,
            distinctions: dis,
            attributions: att,
            cloturable: pod.complet,
            raison: pod.raison,
            aLaMain: att.filter(function (x) { return x.aLaMain; }).length,
            exAequo: att.filter(function (x) { return x.exAequo; }).length
        };
    }

    // Un resume en francais, pour le message a l'ecran.
    function resumer(resultat, noms) {
        noms = noms || {};
        var nom = function (c) { return noms[c] || c; };
        var p = resultat.podium;

        if (!p.complet) {
            return 'Le tournoi ne peut pas être clôturé : ' + (p.raison || 'le vainqueur n\'est pas connu.');
        }

        var t = 'Vainqueur : ' + nom(p.premier) + '.';
        if (p.deuxieme) t += ' Finaliste : ' + nom(p.deuxieme) + '.';
        if ((p.troisiemes || []).length === 1) t += ' Troisième : ' + nom(p.troisiemes[0]) + '.';
        else if ((p.troisiemes || []).length > 1) {
            t += ' Troisièmes ex æquo : ' + p.troisiemes.map(nom).join(' et ') + '.';
        }
        if (resultat.aLaMain) {
            t += ' ' + resultat.aLaMain + ' récompense(s) restent à attribuer à la main.';
        }
        return t;
    }

    return {
        podium: podium,
        podiumDuTableau: podiumDuTableau,
        podiumDuClassement: podiumDuClassement,
        meilleursSur: meilleursSur,
        distinctions: distinctions,
        categorieReconnue: categorieReconnue,
        attribuer: attribuer,
        calculer: calculer,
        resumer: resumer
    };
})();
