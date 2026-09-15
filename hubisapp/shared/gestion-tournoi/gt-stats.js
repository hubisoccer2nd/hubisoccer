/* ============================================================
   HubISoccer — gt-stats.js
   Systeme Gestion Tournois — moteur de statistiques
   ------------------------------------------------------------
   CE QUE FAIT CE FICHIER

   Il calcule. Rien d'autre.
   Aucun acces au DOM, aucun appel reseau, aucune dependance.
   On peut le charger dans un test en ligne de commande, lui
   donner des evenements de match, et verifier ses resultats
   sans navigateur ni base de donnees.

   POURQUOI IL EXISTE

   Quatre pages LISAIENT gt_player_match_stats :
     match-details.js, player-stats.js, rankings.js,
     stats-compare.js.
   Aucune page ne l'ECRIVAIT. Les statistiques affichaient donc
   zero depuis le premier jour, sur toutes les pages a la fois.

   Le chantier 04 a mis en place le pont : chaque but, carton,
   remplacement et blessure saisi dans un rapport de match
   devient une ligne de gt_match_events, avec son buteur, son
   passeur et sa minute. Ce fichier lit ces lignes et en tire la
   feuille de statistiques de chaque sportif.

   CE QUI EST CALCULE ET CE QUI EST SAISI

   Calcule automatiquement depuis les evenements :
     buts, buts contre son camp, passes decisives, cartons,
     minutes jouees, titulaire ou remplacant, buts encaisses,
     clean sheet, penaltys marques / manques / arretes.

   Saisi a la main par un officiel ou l'organisateur :
     tirs, passes, duels, tacles, interceptions, distance…
     Ce sont les releves d'observation. Personne ne peut les
     deviner depuis une feuille de match.

   Les deux se fusionnent : fusionner() garde la saisie manuelle
   la ou elle existe et le calcul automatique partout ailleurs.
   Un recalcul n'efface jamais un releve saisi.

   LA NOTE

   calculerNote() part de 6.00 — la note d'un match sans relief —
   et applique cinq impacts : attaque, passes, dribble, defense,
   gardien. Chaque impact est la somme de contributions dont le
   bareme est ecrit noir sur blanc dans BAREME, en un seul
   endroit, modifiable sans toucher a la mecanique.

   Les bandes de couleur reprennent celles des captures de
   reference : au-dessus de 8 turquoise, 7 a 8 vert, 6.5 a 7 or,
   6 a 6.5 orange, en dessous rouge.
   ============================================================ */

window.GTStats = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. OUTILS
    // ═══════════════════════════════════════════════════════

    function nombre(v) {
        var n = Number(v);
        return isFinite(n) ? n : 0;
    }

    function entier(v) {
        return Math.round(nombre(v));
    }

    function arrondir(v, decimales) {
        var f = Math.pow(10, decimales == null ? 2 : decimales);
        return Math.round(nombre(v) * f) / f;
    }

    function borner(v, mini, maxi) {
        if (v < mini) return mini;
        if (v > maxi) return maxi;
        return v;
    }

    // Pourcentage de reussite. Renvoie null quand rien n'a ete
    // tente : un 0 % afficherait un echec la ou il n'y a
    // simplement eu aucune tentative.
    function pourcentage(reussis, tentes) {
        var t = nombre(tentes);
        if (t <= 0) return null;
        return arrondir((nombre(reussis) / t) * 100, 0);
    }

    // ═══════════════════════════════════════════════════════
    // 2. LE CATALOGUE DES CHAMPS
    // -------------------------------------------------------
    // Une seule source de verite pour l'affichage ET la saisie.
    // Chaque page qui montre ou saisit une statistique lit ce
    // catalogue : ajouter une statistique se fait ici, une fois,
    // et elle apparait partout.
    //
    // type :
    //   'nombre'   entier simple
    //   'decimal'  nombre a virgule (xG, kilometres)
    //   'ratio'    couple reussi / tente, affiche « 24/31 (77 %) »
    //   'bool'     oui / non
    // auto : true  => calcule depuis les evenements, non saisissable
    // ═══════════════════════════════════════════════════════

    var CATEGORIES = [
        {
            code: 'resume',
            nom: 'Résumé',
            icone: 'fa-list-check',
            champs: [
                { cle: 'minutes_played',  label: 'Minutes jouées',        type: 'nombre',  suffixe: "'", auto: true },
                { cle: 'is_starter',      label: 'Titulaire',             type: 'bool',    auto: true },
                { cle: 'position_played', label: 'Poste occupé',          type: 'texte',   auto: true },
                { cle: 'goals',           label: 'Buts',                  type: 'nombre',  auto: true },
                { cle: 'own_goals',       label: 'Buts contre son camp',  type: 'nombre',  auto: true },
                { cle: 'assists',         label: 'Passes décisives',      type: 'nombre',  auto: true },
                { cle: 'yellow_cards',    label: 'Cartons jaunes',        type: 'nombre',  auto: true },
                { cle: 'red_cards',       label: 'Cartons rouges',        type: 'nombre',  auto: true },
                { cle: 'is_motm',         label: 'Homme du match',        type: 'bool' },
                { cle: 'team_of_the_week',label: 'Équipe de la semaine',  type: 'bool' }
            ]
        },
        {
            code: 'attaque',
            nom: 'Attaque',
            icone: 'fa-futbol',
            champs: [
                { cle: 'expected_goals',      label: 'Buts attendus (xG)',     type: 'decimal' },
                { cle: 'shots_total',         label: 'Tirs',                   type: 'nombre' },
                { cle: 'shots_on_target',     label: 'Tirs cadrés',            type: 'nombre' },
                { cle: 'shots_off_target',    label: 'Tirs non cadrés',        type: 'nombre' },
                { cle: 'shots_blocked',       label: 'Tirs contrés',           type: 'nombre' },
                { cle: 'shots_woodwork',      label: 'Poteaux et barres',      type: 'nombre' },
                { cle: 'big_chances',         label: 'Grosses occasions',      type: 'nombre' },
                { cle: 'big_chances_missed',  label: 'Grosses occasions manquées', type: 'nombre' },
                { cle: 'offsides',            label: 'Hors-jeu',               type: 'nombre' },
                { cle: 'penalties_won',       label: 'Penaltys obtenus',       type: 'nombre' },
                { cle: 'penalties_scored',    label: 'Penaltys marqués',       type: 'nombre', auto: true },
                { cle: 'penalties_missed',    label: 'Penaltys manqués',       type: 'nombre', auto: true }
            ]
        },
        {
            code: 'passes',
            nom: 'Passes',
            icone: 'fa-arrows-turn-to-dots',
            champs: [
                { cle: 'expected_assists',    label: 'Passes décisives attendues (xA)', type: 'decimal' },
                { cle: 'passes_completed',    label: 'Passes',                 type: 'ratio', tente: 'passes_attempted' },
                { cle: 'key_passes',          label: 'Passes clés',            type: 'nombre' },
                { cle: 'big_chances_created', label: 'Grosses occasions créées', type: 'nombre' },
                { cle: 'crosses_completed',   label: 'Centres',                type: 'ratio', tente: 'crosses_attempted' },
                { cle: 'passes_own_half_completed',        label: 'Passes dans son camp',    type: 'ratio', tente: 'passes_own_half_attempted' },
                { cle: 'passes_opposition_half_completed', label: 'Passes dans le camp adverse', type: 'ratio', tente: 'passes_opposition_half_attempted' },
                { cle: 'long_balls_completed',    label: 'Longs ballons',      type: 'ratio', tente: 'long_balls_attempted' },
                { cle: 'chipped_passes_completed',label: 'Passes lobées',      type: 'ratio', tente: 'chipped_passes_attempted' }
            ]
        },
        {
            code: 'defense',
            nom: 'Défense',
            icone: 'fa-shield-halved',
            champs: [
                { cle: 'defensive_actions',        label: 'Actions défensives',       type: 'nombre' },
                { cle: 'tackles_won',              label: 'Tacles',                   type: 'ratio', tente: 'tackles_attempted' },
                { cle: 'interceptions',            label: 'Interceptions',            type: 'nombre' },
                { cle: 'clearances',               label: 'Dégagements',              type: 'nombre' },
                { cle: 'blocked_shots',            label: 'Tirs bloqués',             type: 'nombre' },
                { cle: 'recoveries',               label: 'Ballons récupérés',        type: 'nombre' },
                { cle: 'possession_won_final_third', label: 'Ballons récupérés dans le dernier tiers', type: 'nombre' },
                { cle: 'last_man_tackle',          label: 'Tacles en dernier défenseur', type: 'nombre' },
                { cle: 'dribbled_past',            label: 'Dribblé',                  type: 'nombre' },
                { cle: 'errors_leading_to_shot',   label: 'Erreurs menant à un tir',  type: 'nombre' },
                { cle: 'errors_leading_to_goal',   label: 'Erreurs menant à un but',  type: 'nombre' },
                { cle: 'penalties_conceded',       label: 'Penaltys concédés',        type: 'nombre' },
                { cle: 'fouls_committed',          label: 'Fautes commises',          type: 'nombre' },
                { cle: 'fouls_suffered',           label: 'Fautes subies',            type: 'nombre' }
            ]
        },
        {
            code: 'duels',
            nom: 'Duels',
            icone: 'fa-people-arrows',
            champs: [
                { cle: 'duels_won',        label: 'Duels',            type: 'ratio', tente: 'duels_total' },
                { cle: 'ground_duels_won', label: 'Duels au sol',     type: 'ratio', tente: 'ground_duels_total' },
                { cle: 'aerial_duels_won', label: 'Duels aériens',    type: 'ratio', tente: 'aerial_duels_total' }
            ]
        },
        {
            code: 'gardien',
            nom: 'Gardien',
            icone: 'fa-hands',
            champs: [
                { cle: 'saves',                  label: 'Arrêts',                  type: 'nombre' },
                { cle: 'saves_inside_box',       label: 'Arrêts dans la surface',  type: 'nombre' },
                { cle: 'goals_prevented',        label: 'Buts évités',             type: 'decimal' },
                { cle: 'punches',                label: 'Ballons repoussés du poing', type: 'nombre' },
                { cle: 'high_claims',            label: 'Sorties aériennes',       type: 'ratio', tente: null, reussi: 'high_claims_successful' },
                { cle: 'sweeper_actions',        label: 'Sorties dans le dos de la défense', type: 'nombre' },
                { cle: 'goals_conceded',         label: 'Buts encaissés',          type: 'nombre', auto: true },
                { cle: 'clean_sheet',            label: 'Match sans encaisser',    type: 'bool',   auto: true },
                { cle: 'penalties_saved',        label: 'Penaltys arrêtés',        type: 'nombre' }
            ]
        },
        {
            code: 'ballon',
            nom: 'Ballon',
            icone: 'fa-circle-dot',
            champs: [
                { cle: 'touches',              label: 'Ballons touchés',      type: 'nombre' },
                { cle: 'dribbles_completed',   label: 'Dribbles',             type: 'ratio', tente: 'dribbles_attempted' },
                { cle: 'unsuccessful_touches', label: 'Mauvais contrôles',    type: 'nombre' },
                { cle: 'possession_lost',      label: 'Ballons perdus',       type: 'nombre' }
            ]
        },
        {
            code: 'physique',
            nom: 'Physique',
            icone: 'fa-person-running',
            champs: [
                { cle: 'running_km',            label: 'Distance parcourue',      type: 'decimal', suffixe: ' km' },
                { cle: 'high_speed_running_km', label: 'Course à haute intensité', type: 'decimal', suffixe: ' km' },
                { cle: 'sprint_km',             label: 'Distance en sprint',      type: 'decimal', suffixe: ' km' },
                { cle: 'total_progression_m',   label: 'Progression totale',      type: 'decimal', suffixe: ' m' },
                { cle: 'distance_km',           label: 'Distance (relevé simple)', type: 'decimal', suffixe: ' km' },
                { cle: 'sprints',               label: 'Sprints',                 type: 'nombre' },
                { cle: 'top_speed_kmh',         label: 'Vitesse maximale',        type: 'decimal', suffixe: ' km/h' }
            ]
        }
    ];

    function categorieParCode(code) {
        for (var i = 0; i < CATEGORIES.length; i++) {
            if (CATEGORIES[i].code === code) return CATEGORIES[i];
        }
        return null;
    }

    // Toutes les cles de colonne connues du catalogue, y compris
    // les moities « tentees » des ratios.
    function toutesLesCles() {
        var cles = [];
        CATEGORIES.forEach(function (cat) {
            cat.champs.forEach(function (ch) {
                if (cles.indexOf(ch.cle) === -1) cles.push(ch.cle);
                if (ch.tente && cles.indexOf(ch.tente) === -1) cles.push(ch.tente);
                if (ch.reussi && cles.indexOf(ch.reussi) === -1) cles.push(ch.reussi);
            });
        });
        return cles;
    }

    // Les cles calculees automatiquement : celles qu'un recalcul
    // a le droit d'ecraser.
    function clesAutomatiques() {
        var cles = [];
        CATEGORIES.forEach(function (cat) {
            cat.champs.forEach(function (ch) {
                if (ch.auto && cles.indexOf(ch.cle) === -1) cles.push(ch.cle);
            });
        });
        return cles;
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE BAREME DE LA NOTE
    // -------------------------------------------------------
    // Chaque ligne est un poids. Le total des impacts s'ajoute a
    // 6.00 et le resultat est borne entre 1.0 et 10.0.
    //
    // Les valeurs sont volontairement lisibles : un but vaut
    // +1.00, une passe decisive +0.70, une erreur menant a un
    // but -0.70. Un organisateur qui veut un bareme plus severe
    // change ces nombres, et rien d'autre.
    // ═══════════════════════════════════════════════════════

    var BAREME = {
        base: 6.0,
        mini: 1.0,
        maxi: 10.0,

        attaque: {
            goals: 1.00,
            own_goals: -0.80,
            penalties_scored: 0.20,       // s'ajoute au but lui-meme
            penalties_missed: -0.60,
            penalties_won: 0.30,
            shots_on_target: 0.10,
            shots_off_target: -0.02,
            shots_woodwork: 0.08,
            big_chances: 0.05,
            big_chances_missed: -0.25,
            offsides: -0.04,
            expected_goals: 0.15          // par unite de xG
        },

        passes: {
            assists: 0.70,
            key_passes: 0.12,
            big_chances_created: 0.25,
            crosses_completed: 0.05,
            long_balls_completed: 0.03,
            expected_assists: 0.15,
            // Precision de passe : ecart au seuil, pondere par le
            // volume. 30 passes a 90 % pesent plus que 4 passes a
            // 100 %.
            seuilPrecision: 75,
            poidsPrecision: 0.012,
            volumePlein: 30
        },

        dribble: {
            dribbles_completed: 0.10,
            dribblesEchoues: -0.03,       // tentes moins reussis
            unsuccessful_touches: -0.03,
            possession_lost: -0.015,
            touchesPleines: 60,           // volume de reference
            bonusVolume: 0.15
        },

        defense: {
            tackles_won: 0.08,
            interceptions: 0.08,
            clearances: 0.04,
            blocked_shots: 0.09,
            recoveries: 0.03,
            possession_won_final_third: 0.05,
            last_man_tackle: 0.20,
            ground_duels_won: 0.04,
            aerial_duels_won: 0.05,
            duels_won: 0.03,              // n'est compte que si le detail sol/air est absent
            dribbled_past: -0.05,
            fouls_committed: -0.05,
            fouls_suffered: 0.02,
            errors_leading_to_shot: -0.30,
            errors_leading_to_goal: -0.70,
            penalties_conceded: -0.50
        },

        gardien: {
            saves: 0.20,
            saves_inside_box: 0.05,
            penalties_saved: 0.80,
            goals_prevented: 0.50,        // par unite
            punches: 0.03,
            high_claims_successful: 0.05,
            sweeper_actions: 0.04,
            goals_conceded: -0.25,
            cleanSheet: 0.40,
            minutesCleanSheet: 60         // il faut avoir tenu le but
        },

        discipline: {
            yellow_cards: -0.30,
            red_cards: -1.00
        },

        // Un remplacant entre a la 85e ne peut pas etre juge sur
        // le meme volume qu'un titulaire. Les impacts positifs de
        // volume sont attenues en dessous de ce seuil ; les
        // impacts negatifs, eux, ne sont jamais attenues.
        minutesPleines: 60,
        minutesMinimum: 1
    };

    // ═══════════════════════════════════════════════════════
    // 4. LES BANDES DE COULEUR DE LA NOTE
    // -------------------------------------------------------
    // Reprises des captures de reference. Aucune couleur n'est
    // ecrite ici : seulement un nom de classe CSS, que la
    // feuille de style de la page traduit avec ses propres
    // variables. La charte reste maitresse.
    // ═══════════════════════════════════════════════════════

    var BANDES = [
        { mini: 8.0, classe: 'note-excellente', libelle: 'Excellent' },
        { mini: 7.0, classe: 'note-bonne',      libelle: 'Bon' },
        { mini: 6.5, classe: 'note-correcte',   libelle: 'Correct' },
        { mini: 6.0, classe: 'note-moyenne',    libelle: 'Moyen' },
        { mini: 0.0, classe: 'note-faible',     libelle: 'Insuffisant' }
    ];

    function classeNote(note) {
        if (note == null || !isFinite(Number(note))) return 'note-absente';
        var n = Number(note);
        for (var i = 0; i < BANDES.length; i++) {
            if (n >= BANDES[i].mini) return BANDES[i].classe;
        }
        return 'note-faible';
    }

    function libelleNote(note) {
        if (note == null || !isFinite(Number(note))) return 'Non notée';
        var n = Number(note);
        for (var i = 0; i < BANDES.length; i++) {
            if (n >= BANDES[i].mini) return BANDES[i].libelle;
        }
        return 'Insuffisant';
    }

    // ═══════════════════════════════════════════════════════
    // 5. CALCUL DEPUIS LES EVENEMENTS
    // -------------------------------------------------------
    // Entree :
    //   {
    //     match:       { id, team_a_id, team_b_id, duree }
    //     evenements:  lignes gt_match_events
    //     compositions:[ { player_id, team_id, is_starter,
    //                      position, jersey_number } ]
    //     duree:       90 par defaut
    //   }
    //
    // Sortie : un tableau de lignes, une par sportif ayant joue
    // ou etant apparu dans un evenement.
    //
    // Les minutes se deduisent des remplacements :
    //   titulaire non remplace          -> duree complete
    //   titulaire sorti a la minute m   -> m
    //   entrant a la minute m           -> duree - m
    //   expulse a la minute m           -> m (ou m - entree)
    // ═══════════════════════════════════════════════════════

    function ligneVide(idSportif, idEquipe) {
        var l = {
            player_id: idSportif,
            team_id: idEquipe || null,
            minutes_played: 0,
            is_starter: false,
            position_played: null,
            goals: 0,
            own_goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            penalties_scored: 0,
            penalties_missed: 0,
            penalties_saved: 0,
            goals_conceded: 0,
            clean_sheet: false
        };
        return l;
    }

    // Reconnait un penalty a partir du champ « detail » ecrit par
    // le rapport de match (chantier 04). On accepte plusieurs
    // orthographes parce que c'est une liste de choix cote
    // formulaire mais du texte libre cote base.
    function estPenalty(detail) {
        if (!detail) return false;
        var d = String(detail).toLowerCase();
        return d.indexOf('penalty') !== -1 || d.indexOf('pénalty') !== -1 ||
               d.indexOf('penalt') !== -1;
    }

    function estContreSonCamp(detail) {
        if (!detail) return false;
        var d = String(detail).toLowerCase();
        return d.indexOf('csc') !== -1 || d.indexOf('contre son camp') !== -1 ||
               d.indexOf('own') !== -1;
    }

    function calculerDepuisEvenements(options) {
        options = options || {};
        var evenements   = options.evenements || [];
        var compositions = options.compositions || [];
        var match        = options.match || {};
        var duree        = nombre(options.duree || match.duree || 90);
        if (duree <= 0) duree = 90;

        var lignes = {};   // player_id -> ligne
        var entrees = {};  // player_id -> minute d'entree
        var sorties = {};  // player_id -> minute de sortie

        function ligne(idSportif, idEquipe) {
            if (!idSportif) return null;
            if (!lignes[idSportif]) lignes[idSportif] = ligneVide(idSportif, idEquipe);
            if (idEquipe && !lignes[idSportif].team_id) lignes[idSportif].team_id = idEquipe;
            return lignes[idSportif];
        }

        // --- 5.1 la composition donne les titulaires -----------
        compositions.forEach(function (c) {
            if (!c || !c.player_id) return;
            var l = ligne(c.player_id, c.team_id);
            l.is_starter = !!c.is_starter;
            l.position_played = c.position || c.position_played || null;
            if (c.jersey_number != null) l.jersey_number = c.jersey_number;
            if (l.is_starter) entrees[c.player_id] = 0;
        });

        // --- 5.2 les evenements -------------------------------
        // Buts encaisses par equipe, pour les gardiens.
        var encaissesParEquipe = {};

        evenements.forEach(function (e) {
            if (!e) return;
            var type = String(e.event_type || '').toLowerCase();
            var minute = e.minute == null ? null : nombre(e.minute);

            if (type === 'goal' || type === 'but') {
                var contre = estContreSonCamp(e.detail);
                var lb = ligne(e.player_id, e.team_id);
                if (lb) {
                    if (contre) {
                        lb.own_goals += 1;
                    } else {
                        lb.goals += 1;
                        if (estPenalty(e.detail)) lb.penalties_scored += 1;
                    }
                }
                if (e.assist_player_id && !contre) {
                    var lp = ligne(e.assist_player_id, e.team_id);
                    if (lp) lp.assists += 1;
                }
                // Le but compte pour l'equipe qui l'a inscrit ;
                // un csc compte pour l'equipe adverse.
                var beneficiaire = e.team_id;
                if (contre) beneficiaire = autreEquipe(match, e.team_id);
                var encaissante = autreEquipe(match, beneficiaire);
                if (encaissante) {
                    encaissesParEquipe[encaissante] = (encaissesParEquipe[encaissante] || 0) + 1;
                }

            } else if (type === 'own_goal' || type === 'csc') {
                var lc = ligne(e.player_id, e.team_id);
                if (lc) lc.own_goals += 1;
                var adverse = autreEquipe(match, e.team_id);
                if (e.team_id) encaissesParEquipe[e.team_id] = (encaissesParEquipe[e.team_id] || 0) + 1;
                void adverse;

            } else if (type === 'penalty_missed' || type === 'penalty_manque') {
                var lm = ligne(e.player_id, e.team_id);
                if (lm) lm.penalties_missed += 1;

            } else if (type === 'penalty_saved' || type === 'penalty_arrete') {
                var lg = ligne(e.player_id, e.team_id);
                if (lg) lg.penalties_saved += 1;

            } else if (type === 'yellow_card' || type === 'carton_jaune') {
                var lj = ligne(e.player_id, e.team_id);
                if (lj) lj.yellow_cards += 1;

            } else if (type === 'red_card' || type === 'carton_rouge') {
                var lr = ligne(e.player_id, e.team_id);
                if (lr) {
                    lr.red_cards += 1;
                    if (minute != null) sorties[e.player_id] = minute;
                }

            } else if (type === 'second_yellow' || type === 'double_jaune') {
                var ld = ligne(e.player_id, e.team_id);
                if (ld) {
                    ld.yellow_cards += 1;
                    ld.red_cards += 1;
                    if (minute != null) sorties[e.player_id] = minute;
                }

            } else if (type === 'substitution' || type === 'remplacement') {
                // player_id = entrant, assist_player_id = sortant
                // (convention posee par GTOfficiels.extraireEvenements)
                if (e.player_id) {
                    ligne(e.player_id, e.team_id);
                    if (minute != null && entrees[e.player_id] == null) entrees[e.player_id] = minute;
                }
                if (e.assist_player_id) {
                    ligne(e.assist_player_id, e.team_id);
                    if (minute != null) sorties[e.assist_player_id] = minute;
                }

            } else if (type === 'injury' || type === 'blessure') {
                var li = ligne(e.player_id, e.team_id);
                if (li) li.injured = true;
            }
        });

        // --- 5.3 les minutes ----------------------------------
        Object.keys(lignes).forEach(function (id) {
            var l = lignes[id];
            var debut = entrees[id];
            var fin   = sorties[id];

            if (debut == null && !l.is_starter) {
                // Sorti sans etre jamais entre : il etait donc sur
                // le terrain au coup d'envoi. Sans cette regle, un
                // titulaire remplace a la 60e sortait avec zero
                // minute des que la composition ne le declarait pas.
                if (fin != null) {
                    debut = 0;
                } else {
                    // Apparu dans un evenement sans figurer dans la
                    // composition et sans remplacement : on ne peut
                    // pas inventer ses minutes. On le declare present
                    // sur la duree pleine seulement s'il a marque ou
                    // pris un carton, sinon zero.
                    var actif = l.goals || l.assists || l.yellow_cards || l.red_cards || l.own_goals;
                    debut = actif ? 0 : null;
                }
            }
            if (debut == null) { l.minutes_played = 0; return; }
            if (fin == null) fin = duree;
            l.minutes_played = Math.max(0, Math.round(fin - debut));
            if (l.minutes_played > duree) l.minutes_played = Math.round(duree);
        });

        // --- 5.4 les gardiens ---------------------------------
        // Un gardien est designe soit par la composition
        // (position contenant « gardien » ou « goal »), soit par
        // la liste options.gardiens.
        var listeGardiens = options.gardiens || [];
        Object.keys(lignes).forEach(function (id) {
            var l = lignes[id];
            var poste = String(l.position_played || '').toLowerCase();
            var estGardien = listeGardiens.indexOf(id) !== -1 ||
                             poste.indexOf('gardien') !== -1 ||
                             poste.indexOf('goal') !== -1 ||
                             poste === 'g' || poste === 'gk';
            if (!estGardien) return;
            l.is_goalkeeper = true;
            var encaisses = nombre(encaissesParEquipe[l.team_id]);
            l.goals_conceded = encaisses;
            l.clean_sheet = encaisses === 0 && l.minutes_played >= BAREME.gardien.minutesCleanSheet;
        });

        // --- 5.5 en tableau -----------------------------------
        var resultat = [];
        Object.keys(lignes).forEach(function (id) {
            var l = lignes[id];
            if (match.id != null) l.match_id = match.id;
            if (options.tournament_id != null) l.tournament_id = options.tournament_id;
            resultat.push(l);
        });
        return resultat;
    }

    function autreEquipe(match, idEquipe) {
        if (!match || idEquipe == null) return null;
        if (String(match.team_a_id) === String(idEquipe)) return match.team_b_id;
        if (String(match.team_b_id) === String(idEquipe)) return match.team_a_id;
        return null;
    }

    // ═══════════════════════════════════════════════════════
    // 6. LA NOTE
    // -------------------------------------------------------
    // Renvoie :
    //   {
    //     note: 7.4,
    //     impacts: { attaque, passes, dribble, defense, gardien,
    //                discipline },
    //     detail: [ { libelle, valeur } ]   // ce qui a pese
    //   }
    // Renvoie note: null quand le sportif n'a pas joue — une
    // note de 6.00 sur un remplacant reste sur le banc serait un
    // mensonge.
    // ═══════════════════════════════════════════════════════

    function calculerNote(ligneStats, options) {
        options = options || {};
        var s = ligneStats || {};
        var minutes = nombre(s.minutes_played);

        if (minutes < BAREME.minutesMinimum) {
            return { note: null, impacts: null, detail: [], raison: "Ce sportif n'a pas joué." };
        }

        var detail = [];
        function pousser(libelle, valeur) {
            if (!valeur) return;
            detail.push({ libelle: libelle, valeur: arrondir(valeur, 2) });
        }

        // Attenuation de volume pour les temps de jeu courts.
        var facteur = borner(minutes / BAREME.minutesPleines, 0.35, 1);

        // --- attaque ------------------------------------------
        var bA = BAREME.attaque;
        var attaque = 0;
        attaque += nombre(s.goals) * bA.goals;                     pousser('Buts', nombre(s.goals) * bA.goals);
        attaque += nombre(s.own_goals) * bA.own_goals;             pousser('Buts contre son camp', nombre(s.own_goals) * bA.own_goals);
        attaque += nombre(s.penalties_scored) * bA.penalties_scored;
        attaque += nombre(s.penalties_missed) * bA.penalties_missed; pousser('Penaltys manqués', nombre(s.penalties_missed) * bA.penalties_missed);
        attaque += nombre(s.penalties_won) * bA.penalties_won;
        attaque += nombre(s.shots_on_target) * bA.shots_on_target; pousser('Tirs cadrés', nombre(s.shots_on_target) * bA.shots_on_target);
        attaque += nombre(s.shots_off_target) * bA.shots_off_target;
        attaque += nombre(s.shots_woodwork) * bA.shots_woodwork;
        attaque += nombre(s.big_chances) * bA.big_chances;
        attaque += nombre(s.big_chances_missed) * bA.big_chances_missed; pousser('Grosses occasions manquées', nombre(s.big_chances_missed) * bA.big_chances_missed);
        attaque += nombre(s.offsides) * bA.offsides;
        attaque += nombre(s.expected_goals) * bA.expected_goals;

        // --- passes -------------------------------------------
        var bP = BAREME.passes;
        var passes = 0;
        passes += nombre(s.assists) * bP.assists;                          pousser('Passes décisives', nombre(s.assists) * bP.assists);
        passes += nombre(s.key_passes) * bP.key_passes;                    pousser('Passes clés', nombre(s.key_passes) * bP.key_passes);
        passes += nombre(s.big_chances_created) * bP.big_chances_created;
        passes += nombre(s.crosses_completed) * bP.crosses_completed;
        passes += nombre(s.long_balls_completed) * bP.long_balls_completed;
        passes += nombre(s.expected_assists) * bP.expected_assists;

        var tentees = nombre(s.passes_attempted);
        if (tentees > 0) {
            var precision = (nombre(s.passes_completed) / tentees) * 100;
            var volume = borner(tentees / bP.volumePlein, 0, 1);
            var apport = (precision - bP.seuilPrecision) * bP.poidsPrecision * volume;
            passes += apport;
            pousser('Précision de passe (' + Math.round(precision) + ' %)', apport);
        }

        // --- dribble et conservation --------------------------
        var bD = BAREME.dribble;
        var dribble = 0;
        dribble += nombre(s.dribbles_completed) * bD.dribbles_completed;
        pousser('Dribbles réussis', nombre(s.dribbles_completed) * bD.dribbles_completed);
        var echoues = Math.max(0, nombre(s.dribbles_attempted) - nombre(s.dribbles_completed));
        dribble += echoues * bD.dribblesEchoues;
        dribble += nombre(s.unsuccessful_touches) * bD.unsuccessful_touches;
        dribble += nombre(s.possession_lost) * bD.possession_lost;
        pousser('Ballons perdus', nombre(s.possession_lost) * bD.possession_lost);
        if (nombre(s.touches) > 0) {
            var bonus = borner(nombre(s.touches) / bD.touchesPleines, 0, 1) * bD.bonusVolume;
            dribble += bonus;
        }

        // --- defense ------------------------------------------
        var bF = BAREME.defense;
        var defense = 0;
        defense += nombre(s.tackles_won) * bF.tackles_won;                 pousser('Tacles gagnés', nombre(s.tackles_won) * bF.tackles_won);
        defense += nombre(s.interceptions) * bF.interceptions;             pousser('Interceptions', nombre(s.interceptions) * bF.interceptions);
        defense += nombre(s.clearances) * bF.clearances;
        defense += nombre(s.blocked_shots) * bF.blocked_shots;
        defense += nombre(s.recoveries) * bF.recoveries;
        defense += nombre(s.possession_won_final_third) * bF.possession_won_final_third;
        defense += nombre(s.last_man_tackle) * bF.last_man_tackle;

        // Le detail sol / air prime sur le total generique :
        // sans cette regle, un duel serait compte deux fois.
        var detailDuels = nombre(s.ground_duels_total) + nombre(s.aerial_duels_total);
        if (detailDuels > 0) {
            defense += nombre(s.ground_duels_won) * bF.ground_duels_won;
            defense += nombre(s.aerial_duels_won) * bF.aerial_duels_won;
            pousser('Duels gagnés', nombre(s.ground_duels_won) * bF.ground_duels_won +
                                    nombre(s.aerial_duels_won) * bF.aerial_duels_won);
        } else {
            defense += nombre(s.duels_won) * bF.duels_won;
            pousser('Duels gagnés', nombre(s.duels_won) * bF.duels_won);
        }

        defense += nombre(s.dribbled_past) * bF.dribbled_past;
        defense += nombre(s.fouls_committed) * bF.fouls_committed;         pousser('Fautes commises', nombre(s.fouls_committed) * bF.fouls_committed);
        defense += nombre(s.fouls_suffered) * bF.fouls_suffered;
        defense += nombre(s.errors_leading_to_shot) * bF.errors_leading_to_shot;
        defense += nombre(s.errors_leading_to_goal) * bF.errors_leading_to_goal;
        pousser('Erreurs menant à un but', nombre(s.errors_leading_to_goal) * bF.errors_leading_to_goal);
        defense += nombre(s.penalties_conceded) * bF.penalties_conceded;

        // --- gardien ------------------------------------------
        var bG = BAREME.gardien;
        var gardien = 0;
        var joueDansLesButs = !!s.is_goalkeeper ||
                              nombre(s.saves) > 0 ||
                              nombre(s.goals_conceded) > 0 ||
                              nombre(s.penalties_saved) > 0 ||
                              String(s.position_played || '').toLowerCase().indexOf('gardien') !== -1;
        if (joueDansLesButs) {
            gardien += nombre(s.saves) * bG.saves;                        pousser('Arrêts', nombre(s.saves) * bG.saves);
            gardien += nombre(s.saves_inside_box) * bG.saves_inside_box;
            gardien += nombre(s.penalties_saved) * bG.penalties_saved;    pousser('Penaltys arrêtés', nombre(s.penalties_saved) * bG.penalties_saved);
            gardien += nombre(s.goals_prevented) * bG.goals_prevented;
            gardien += nombre(s.punches) * bG.punches;
            gardien += nombre(s.high_claims_successful) * bG.high_claims_successful;
            gardien += nombre(s.sweeper_actions) * bG.sweeper_actions;
            gardien += nombre(s.goals_conceded) * bG.goals_conceded;      pousser('Buts encaissés', nombre(s.goals_conceded) * bG.goals_conceded);
            if (s.clean_sheet && minutes >= bG.minutesCleanSheet) {
                gardien += bG.cleanSheet;
                pousser('Match sans encaisser', bG.cleanSheet);
            }
        }

        // --- discipline ---------------------------------------
        var bX = BAREME.discipline;
        var discipline = 0;
        discipline += nombre(s.yellow_cards) * bX.yellow_cards;           pousser('Cartons jaunes', nombre(s.yellow_cards) * bX.yellow_cards);
        discipline += nombre(s.red_cards) * bX.red_cards;                 pousser('Carton rouge', nombre(s.red_cards) * bX.red_cards);

        // Les apports positifs sont attenues pour un temps de jeu
        // court ; les malus, jamais. Un rouge a la 80e reste un
        // rouge.
        function attenuer(v) { return v > 0 ? v * facteur : v; }

        var impacts = {
            attaque:    arrondir(attenuer(attaque), 2),
            passes:     arrondir(attenuer(passes), 2),
            dribble:    arrondir(attenuer(dribble), 2),
            defense:    arrondir(attenuer(defense), 2),
            gardien:    arrondir(attenuer(gardien), 2),
            discipline: arrondir(discipline, 2)
        };

        var total = BAREME.base + impacts.attaque + impacts.passes + impacts.dribble +
                    impacts.defense + impacts.gardien + impacts.discipline;

        detail.sort(function (a, b) { return Math.abs(b.valeur) - Math.abs(a.valeur); });

        return {
            note: arrondir(borner(total, BAREME.mini, BAREME.maxi), 2),
            impacts: impacts,
            detail: detail,
            facteurTempsDeJeu: arrondir(facteur, 2)
        };
    }

    // Les cinq notes de categorie affichees dans le detail de la
    // note sur les captures : chaque impact ramene sur une base
    // de 6, borne comme la note globale.
    function notesParCategorie(resultatNote) {
        if (!resultatNote || !resultatNote.impacts) return null;
        var i = resultatNote.impacts;
        function ramener(v) { return arrondir(borner(BAREME.base + v, BAREME.mini, BAREME.maxi), 2); }
        return {
            rating_attack:      ramener(i.attaque),
            rating_passing:     ramener(i.passes),
            rating_dribbling:   ramener(i.dribble),
            rating_defence:     ramener(i.defense + i.discipline),
            rating_goalkeeping: i.gardien ? ramener(i.gardien) : null
        };
    }

    // ═══════════════════════════════════════════════════════
    // 7. FUSION CALCUL / SAISIE
    // -------------------------------------------------------
    // Regle : le recalcul ecrase UNIQUEMENT les champs marques
    // auto dans le catalogue. Tout ce qu'un officiel a saisi a la
    // main est conserve.
    //
    // C'est la garantie que le bouton « Recalculer » ne detruit
    // jamais une soiree de saisie.
    // ═══════════════════════════════════════════════════════

    function fusionner(existante, calculee) {
        var resultat = {};
        var cle;
        existante = existante || {};
        calculee = calculee || {};

        for (cle in existante) {
            if (Object.prototype.hasOwnProperty.call(existante, cle)) resultat[cle] = existante[cle];
        }

        var auto = clesAutomatiques();
        auto.push('goals_conceded');
        auto.push('clean_sheet');
        auto.push('penalties_scored');
        auto.push('penalties_missed');
        auto.push('team_id');
        auto.push('match_id');
        auto.push('tournament_id');
        auto.push('is_goalkeeper');

        auto.forEach(function (k) {
            if (calculee[k] !== undefined) resultat[k] = calculee[k];
        });

        // is_motm et team_of_the_week sont des distinctions
        // attribuees a la main : le calcul ne doit jamais les
        // remettre a false.
        if (existante.is_motm !== undefined) resultat.is_motm = existante.is_motm;
        if (existante.team_of_the_week !== undefined) resultat.team_of_the_week = existante.team_of_the_week;

        return resultat;
    }

    // ═══════════════════════════════════════════════════════
    // 8. LIGNE PRETE POUR LA BASE
    // -------------------------------------------------------
    // Ne renvoie que des cles qui existent reellement dans
    // gt_player_match_stats apres le script SQL du chantier 05.
    // Une cle inconnue ferait echouer tout l'insert PostgREST.
    // ═══════════════════════════════════════════════════════

    var COLONNES_BASE = [
        'match_id', 'player_id', 'team_id', 'tournament_id',
        'minutes_played', 'is_starter', 'position_played',
        'goals', 'own_goals', 'assists', 'yellow_cards', 'red_cards',
        'match_rating', 'is_motm', 'team_of_the_week',
        'rating_attack', 'rating_passing', 'rating_dribbling',
        'rating_defence', 'rating_goalkeeping',
        'source', 'updated_at', 'updated_by', 'heatmap'
    ].concat(toutesLesCles());

    function pourLaBase(ligneStats, options) {
        options = options || {};
        var s = ligneStats || {};
        var sortie = {};

        COLONNES_BASE.forEach(function (cle) {
            if (s[cle] === undefined) return;
            if (sortie[cle] !== undefined) return;
            sortie[cle] = s[cle];
        });

        // La note et son detail
        var note = calculerNote(s, options);
        if (note.note != null) {
            sortie.match_rating = note.note;
            var parCat = notesParCategorie(note);
            if (parCat) {
                sortie.rating_attack      = parCat.rating_attack;
                sortie.rating_passing     = parCat.rating_passing;
                sortie.rating_dribbling   = parCat.rating_dribbling;
                sortie.rating_defence     = parCat.rating_defence;
                if (parCat.rating_goalkeeping != null) sortie.rating_goalkeeping = parCat.rating_goalkeeping;
            }
        }

        if (options.source) sortie.source = options.source;
        if (options.updated_by) sortie.updated_by = options.updated_by;
        sortie.updated_at = new Date().toISOString();

        // is_goalkeeper n'est pas une colonne : c'est un indicateur
        // interne. On ne l'envoie jamais a PostgREST.
        delete sortie.is_goalkeeper;
        delete sortie.injured;
        delete sortie.jersey_number;

        return sortie;
    }

    // ═══════════════════════════════════════════════════════
    // 9. AGREGATION SUR UN TOURNOI
    // -------------------------------------------------------
    // Entree : toutes les lignes de match d'un sportif.
    // Sortie : une ligne prete pour
    //          gt_player_tournament_stats.
    // ═══════════════════════════════════════════════════════

    var CUMULS_ENTIERS = [
        'minutes_played', 'goals', 'assists', 'shots_total', 'shots_on_target',
        'big_chances_missed', 'passes_completed', 'passes_attempted', 'key_passes',
        'big_chances_created', 'crosses_completed', 'crosses_attempted',
        'tackles_won', 'tackles_attempted', 'interceptions', 'clearances', 'recoveries',
        'ground_duels_won', 'ground_duels_total', 'aerial_duels_won', 'aerial_duels_total',
        'dribbles_completed', 'dribbles_attempted', 'fouls_committed', 'fouls_suffered',
        'possession_lost', 'touches', 'saves', 'goals_conceded', 'penalties_saved',
        'yellow_cards', 'red_cards', 'sprints'
    ];

    var CUMULS_DECIMAUX = [
        'expected_goals', 'expected_assists', 'distance_km'
    ];

    function agregerTournoi(lignesDeMatch, options) {
        options = options || {};
        var lignes = lignesDeMatch || [];
        var total = {
            tournament_id: options.tournament_id != null ? options.tournament_id : null,
            player_id: options.player_id != null ? options.player_id : (lignes[0] ? lignes[0].player_id : null),
            team_id: options.team_id != null ? options.team_id : (lignes[0] ? lignes[0].team_id : null),
            matches_played: 0,
            matches_started: 0,
            clean_sheets: 0,
            motm_count: 0,
            team_of_week_count: 0,
            top_speed_kmh: 0
        };

        CUMULS_ENTIERS.forEach(function (k) { total[k] = 0; });
        CUMULS_DECIMAUX.forEach(function (k) { total[k] = 0; });

        var sommeNotes = 0, compteNotes = 0;

        lignes.forEach(function (l) {
            if (!l) return;
            // Une ligne a zero minute n'est pas un match joue.
            if (nombre(l.minutes_played) > 0) total.matches_played += 1;
            if (l.is_starter) total.matches_started += 1;
            if (l.clean_sheet) total.clean_sheets += 1;
            if (l.is_motm) total.motm_count += 1;
            if (l.team_of_the_week) total.team_of_week_count += 1;

            CUMULS_ENTIERS.forEach(function (k) { total[k] += entier(l[k]); });
            CUMULS_DECIMAUX.forEach(function (k) { total[k] += nombre(l[k]); });

            if (nombre(l.top_speed_kmh) > total.top_speed_kmh) total.top_speed_kmh = nombre(l.top_speed_kmh);

            if (l.match_rating != null && isFinite(Number(l.match_rating))) {
                sommeNotes += Number(l.match_rating);
                compteNotes += 1;
            }
        });

        CUMULS_DECIMAUX.forEach(function (k) { total[k] = arrondir(total[k], 2); });
        total.top_speed_kmh = arrondir(total.top_speed_kmh, 2);
        total.average_rating = compteNotes ? arrondir(sommeNotes / compteNotes, 2) : null;
        total.updated_at = new Date().toISOString();

        return total;
    }

    // Moyennes par match, pour l'affichage d'une fiche de tournoi.
    // Ne sont pas stockees : elles se deduisent toujours.
    function moyennesParMatch(ligneTournoi) {
        var t = ligneTournoi || {};
        var joues = nombre(t.matches_played);
        var out = {};
        if (joues <= 0) return out;
        CUMULS_ENTIERS.concat(CUMULS_DECIMAUX).forEach(function (k) {
            out[k] = arrondir(nombre(t[k]) / joues, 2);
        });
        return out;
    }

    // ═══════════════════════════════════════════════════════
    // 10. MISE EN FORME D'UNE VALEUR
    // -------------------------------------------------------
    // Renvoie du texte, pas du HTML : le formatage visuel
    // appartient a la page.
    // ═══════════════════════════════════════════════════════

    function formater(champ, ligneStats) {
        var s = ligneStats || {};
        if (!champ) return '—';

        if (champ.type === 'bool') {
            if (s[champ.cle] === undefined || s[champ.cle] === null) return '—';
            return s[champ.cle] ? 'Oui' : 'Non';
        }

        if (champ.type === 'texte') {
            return s[champ.cle] ? String(s[champ.cle]) : '—';
        }

        if (champ.type === 'ratio') {
            var cleReussi = champ.reussi || champ.cle;
            var cleTente  = champ.tente || champ.cle;
            var reussi = nombre(s[cleReussi]);
            var tente  = nombre(s[cleTente]);
            if (champ.reussi && !champ.tente) { tente = nombre(s[champ.cle]); reussi = nombre(s[champ.reussi]); }
            if (!tente && !reussi) return '—';
            var p = pourcentage(reussi, tente);
            return reussi + '/' + tente + (p == null ? '' : ' (' + p + ' %)');
        }

        if (champ.type === 'decimal') {
            if (s[champ.cle] == null) return '—';
            return arrondir(s[champ.cle], 2).toFixed(2) + (champ.suffixe || '');
        }

        if (s[champ.cle] == null) return '—';
        return String(entier(s[champ.cle])) + (champ.suffixe || '');
    }

    // Une categorie a-t-elle la moindre donnee ? Sert a ne pas
    // afficher un bloc entierement vide.
    function categorieRenseignee(categorie, ligneStats) {
        var s = ligneStats || {};
        var pleine = false;
        (categorie.champs || []).forEach(function (ch) {
            [ch.cle, ch.tente, ch.reussi].forEach(function (k) {
                if (!k) return;
                var v = s[k];
                if (v === undefined || v === null) return;
                if (typeof v === 'boolean') { if (v) pleine = true; return; }
                if (typeof v === 'string') { if (v !== '') pleine = true; return; }
                if (nombre(v) !== 0) pleine = true;
            });
        });
        return pleine;
    }

    // ═══════════════════════════════════════════════════════
    // 11. CARTE THERMIQUE
    // -------------------------------------------------------
    // heatmap est stockee en jsonb : un tableau de points
    // { x, y, poids } en coordonnees 0-100 sur le terrain.
    // On fournit ici la grille agregee, la page se charge du
    // dessin.
    // ═══════════════════════════════════════════════════════

    function grilleThermique(heatmap, colonnes, lignesGrille) {
        var nbCol = colonnes || 12;
        var nbLig = lignesGrille || 8;
        var grille = [];
        var i, j;
        for (i = 0; i < nbLig; i++) {
            grille.push([]);
            for (j = 0; j < nbCol; j++) grille[i].push(0);
        }
        var points = [];
        if (Array.isArray(heatmap)) points = heatmap;
        else if (heatmap && Array.isArray(heatmap.points)) points = heatmap.points;
        if (!points.length) return { grille: grille, maximum: 0, points: 0 };

        var maximum = 0;
        points.forEach(function (p) {
            if (!p) return;
            var x = borner(nombre(p.x), 0, 100);
            var y = borner(nombre(p.y), 0, 100);
            var poids = p.poids == null ? 1 : nombre(p.poids);
            var col = Math.min(nbCol - 1, Math.floor((x / 100) * nbCol));
            var lig = Math.min(nbLig - 1, Math.floor((y / 100) * nbLig));
            grille[lig][col] += poids;
            if (grille[lig][col] > maximum) maximum = grille[lig][col];
        });
        return { grille: grille, maximum: maximum, points: points.length };
    }

    // ═══════════════════════════════════════════════════════
    // 12. CLASSEMENTS DE SPORTIFS
    // -------------------------------------------------------
    // Meilleurs buteurs, passeurs, notes… a partir des lignes
    // agregees. Le tri departage a nombre egal par les minutes
    // jouees croissantes : a buts egaux, celui qui a joue moins
    // passe devant.
    // ═══════════════════════════════════════════════════════

    function classer(lignes, cle, options) {
        options = options || {};
        var liste = (lignes || []).slice();
        var minimumMatchs = nombre(options.minimumMatchs);

        liste = liste.filter(function (l) {
            if (!l) return false;
            if (minimumMatchs && nombre(l.matches_played) < minimumMatchs) return false;
            var v = l[cle];
            return v != null && isFinite(Number(v));
        });

        liste.sort(function (a, b) {
            var d = nombre(b[cle]) - nombre(a[cle]);
            if (d !== 0) return d;
            var m = nombre(a.minutes_played) - nombre(b.minutes_played);
            if (m !== 0) return m;
            return String(a.player_id) < String(b.player_id) ? -1 : 1;
        });

        var rang = 0, precedente = null, position = 0;
        liste.forEach(function (l) {
            position += 1;
            if (precedente === null || nombre(l[cle]) !== precedente) {
                rang = position;
                precedente = nombre(l[cle]);
            }
            l.rang = rang;
        });

        if (options.limite) return liste.slice(0, options.limite);
        return liste;
    }

    // ═══════════════════════════════════════════════════════
    // 13. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        CATEGORIES: CATEGORIES,
        BAREME: BAREME,
        BANDES: BANDES,
        COLONNES_BASE: COLONNES_BASE,

        categorieParCode: categorieParCode,
        toutesLesCles: toutesLesCles,
        clesAutomatiques: clesAutomatiques,

        calculerDepuisEvenements: calculerDepuisEvenements,
        calculerNote: calculerNote,
        notesParCategorie: notesParCategorie,
        classeNote: classeNote,
        libelleNote: libelleNote,

        fusionner: fusionner,
        pourLaBase: pourLaBase,

        agregerTournoi: agregerTournoi,
        moyennesParMatch: moyennesParMatch,
        classer: classer,

        formater: formater,
        pourcentage: pourcentage,
        categorieRenseignee: categorieRenseignee,
        grilleThermique: grilleThermique
    };

})();
