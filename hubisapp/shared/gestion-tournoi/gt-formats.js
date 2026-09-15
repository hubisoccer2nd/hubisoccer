/* ============================================================
   HubISoccer — gt-formats.js
   Système Gestion Tournois — Catalogue et éditeur de formats
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   Les colonnes format_type, qualifiers_count, qualifiers_per_group,
   best_third_place_count et qualification_explainer existaient sur
   gt_tournaments. rankings.js les LISAIT. Mais aucune page ne
   permettait de les ÉCRIRE : ni la création, ni la gestion d'un
   tournoi n'offraient de sélecteur de format. Elles restaient donc
   NULL à vie, et rankings.js retombait toujours sur « league ».

   C'était la cause exacte de « quand je sélectionne les formats, ça
   n'agit pas sur le tournoi déjà créé » : il n'y avait rien à
   sélectionner.

   CE QUE CONTIENT CE FICHIER

   1. Le catalogue des 23 formats de compétition, rangés en
      5 familles, avec leurs paramètres et leurs préréglages.
   2. Le catalogue des critères de départage, ordonnables.
   3. Les préréglages de zones de qualification.
   4. Un éditeur : GTFormats.monterEditeur() construit l'interface
      complète dans un conteneur, GTFormats.lire() en ressort la
      configuration prête à écrire en base.

   AJOUTER UN FORMAT

   Ajouter une entrée dans CATALOGUE. Rien d'autre. Le sélecteur,
   les champs de paramètres et le texte explicatif s'en déduisent.

   COMPATIBILITÉ

   Chaque format déclare un formatType parmi 'league',
   'groups_knockout' et 'knockout' : ce sont les trois valeurs que
   rankings.js sait déjà interpréter. Le code précis du format vit
   dans format_config.code, sans casser l'existant.

   DÉPENDANCES
       gt-formats.css     styles, tokens existants uniquement
       Aucune requête réseau : ce fichier est purement local.
   ============================================================ */
'use strict';

window.GTFormats = (function () {

    // ═══════════════════════════════════════════════════════════
    // 1. LES CHAMPS DE PARAMÈTRE DISPONIBLES
    //    Chaque format déclare ceux qui le concernent.
    // ═══════════════════════════════════════════════════════════
    var CHAMPS = {
        equipes:            { libelle: 'Nombre d\'équipes',              type: 'nombre', min: 2,  max: 512, defaut: 16 },
        manches:            { libelle: 'Confrontations',                type: 'choix',  defaut: 1,
                              options: [ { valeur: 1, texte: 'Aller simple' }, { valeur: 2, texte: 'Aller-retour' } ] },
        groupes:            { libelle: 'Nombre de groupes',             type: 'nombre', min: 1,  max: 32,  defaut: 4 },
        parGroupe:          { libelle: 'Équipes par groupe',            type: 'nombre', min: 2,  max: 32,  defaut: 4 },
        qualifiesParGroupe: { libelle: 'Qualifiés par groupe',          type: 'nombre', min: 0,  max: 16,  defaut: 2 },
        meilleursTroisiemes:{ libelle: 'Meilleurs troisièmes repêchés', type: 'nombre', min: 0,  max: 16,  defaut: 0 },
        adversaires:        { libelle: 'Adversaires différents',        type: 'nombre', min: 1,  max: 20,  defaut: 8 },
        barrageDe:          { libelle: 'Barrage — du rang',             type: 'nombre', min: 2,  max: 128, defaut: 9 },
        barrageA:           { libelle: 'Barrage — au rang',             type: 'nombre', min: 2,  max: 128, defaut: 24 },
        phaseFinaleDepuis:  { libelle: 'La phase finale démarre en',    type: 'choix',  defaut: '1/8',
                              options: [ { valeur: '1/64', texte: '32es de finale' }, { valeur: '1/32', texte: '16es de finale' },
                                         { valeur: '1/16', texte: '8es de finale' },  { valeur: '1/8',  texte: 'Huitièmes' },
                                         { valeur: '1/4',  texte: 'Quarts' },         { valeur: '1/2',  texte: 'Demi-finales' },
                                         { valeur: 'F',    texte: 'Finale directe' } ] },
        manchesPhaseFinale: { libelle: 'Manches en phase finale',       type: 'choix',  defaut: 1,
                              options: [ { valeur: 1, texte: 'Match unique' }, { valeur: 2, texte: 'Aller-retour (finale en un match)' } ] },
        toursPreliminaires: { libelle: 'Tours préliminaires',           type: 'nombre', min: 0,  max: 8,   defaut: 1 },
        rondes:             { libelle: 'Nombre de rondes',              type: 'nombre', min: 3,  max: 20,  defaut: 7 },
        splitApres:         { libelle: 'Séparation après la journée',   type: 'nombre', min: 1,  max: 60,  defaut: 22 },
        promus:             { libelle: 'Places de promotion',           type: 'nombre', min: 0,  max: 16,  defaut: 2 },
        relegues:           { libelle: 'Places de relégation',          type: 'nombre', min: 0,  max: 16,  defaut: 3 },
        matchTroisiemePlace:{ libelle: 'Match pour la 3e place',        type: 'bool',   defaut: false },
        tableauConsolation: { libelle: 'Tableau de consolation',        type: 'bool',   defaut: false },
        butExterieur:       { libelle: 'Règle du but à l\'extérieur',   type: 'bool',   defaut: false },
        tetesSerie:         { libelle: 'Têtes de série',                type: 'nombre', min: 0,  max: 64,  defaut: 0 },
        unite:              { libelle: 'Unité de classement',           type: 'choix',  defaut: 'temps',
                              options: [ { valeur: 'temps', texte: 'Temps (le plus rapide gagne)' },
                                         { valeur: 'points', texte: 'Points (le plus élevé gagne)' },
                                         { valeur: 'distance', texte: 'Distance (la plus longue gagne)' } ] }
    };

    // ═══════════════════════════════════════════════════════════
    // 2. LE CATALOGUE DES 23 FORMATS
    // ═══════════════════════════════════════════════════════════
    var CATALOGUE = [

        // ---------- FAMILLE CHAMPIONNAT ----------
        { code: 'championnat_aller', famille: 'championnat', formatType: 'league',
          nom: 'Championnat — aller simple',
          resume: 'Chaque équipe rencontre chaque adversaire une seule fois.',
          champs: ['equipes'], valeurs: { manches: 1, groupes: 1 } },

        { code: 'championnat_aller_retour', famille: 'championnat', formatType: 'league',
          nom: 'Championnat — aller-retour',
          resume: 'Chaque équipe rencontre chaque adversaire à domicile et à l\'extérieur. Le modèle LaLiga, Ligue 1, Premier League.',
          champs: ['equipes'], valeurs: { manches: 2, groupes: 1 } },

        { code: 'championnat_split', famille: 'championnat', formatType: 'league',
          nom: 'Championnat + play-offs (séparation)',
          resume: 'La saison est coupée en deux après N journées : groupe championnat et groupe maintien. Modèle belge, écossais, danois.',
          champs: ['equipes', 'manches', 'splitApres', 'promus', 'relegues'], valeurs: { groupes: 1 } },

        { code: 'apertura_clausura', famille: 'championnat', formatType: 'league',
          nom: 'Apertura / Clausura',
          resume: 'Deux tournois dans une même saison, puis une finale entre les deux vainqueurs. Modèle sud-américain.',
          champs: ['equipes', 'manches'], valeurs: { groupes: 1 } },

        { code: 'championnat_promotion', famille: 'championnat', formatType: 'league',
          nom: 'Championnat avec promotion et relégation',
          resume: 'Classement unique, avec une zone haute qui monte et une zone basse qui descend.',
          champs: ['equipes', 'manches', 'promus', 'relegues'], valeurs: { groupes: 1 } },

        { code: 'championnat_tableaux', famille: 'championnat', formatType: 'league',
          nom: 'Championnat en plusieurs tableaux',
          resume: 'Plusieurs groupes jouent en parallèle, chacun avec son classement séparé.',
          champs: ['equipes', 'groupes', 'manches'], valeurs: {} },

        { code: 'barrages_promotion', famille: 'championnat', formatType: 'knockout',
          nom: 'Barrages de promotion / relégation',
          resume: 'Mini-tableau entre les équipes situées à la limite entre deux divisions.',
          champs: ['equipes', 'manchesPhaseFinale'], valeurs: { groupes: 1 } },

        // ---------- FAMILLE COUPE ----------
        { code: 'coupe_simple', famille: 'coupe', formatType: 'knockout',
          nom: 'Élimination directe — match unique',
          resume: 'Une rencontre, un éliminé. Le format le plus court.',
          champs: ['equipes', 'tetesSerie', 'matchTroisiemePlace'], valeurs: { manchesPhaseFinale: 1 } },

        { code: 'coupe_aller_retour', famille: 'coupe', formatType: 'knockout',
          nom: 'Élimination directe — aller-retour',
          resume: 'Deux manches par tour, finale en un seul match.',
          champs: ['equipes', 'tetesSerie', 'butExterieur', 'matchTroisiemePlace'], valeurs: { manchesPhaseFinale: 2 } },

        { code: 'coupe_tours_preliminaires', famille: 'coupe', formatType: 'knockout',
          nom: 'Coupe avec tours préliminaires',
          resume: 'Des tours préliminaires précèdent le tableau principal : PR, R1, R2, puis 16es, 8es, quarts, demies, finale. Modèle Copa del Rey.',
          champs: ['equipes', 'toursPreliminaires', 'phaseFinaleDepuis', 'manchesPhaseFinale', 'tetesSerie'], valeurs: {} },

        { code: 'double_elimination', famille: 'coupe', formatType: 'knockout',
          nom: 'Double élimination',
          resume: 'Deux tableaux : les vainqueurs, et les repêchés. Il faut perdre deux fois pour sortir.',
          champs: ['equipes', 'tetesSerie'], valeurs: { manchesPhaseFinale: 1 } },

        { code: 'coupe_consolation', famille: 'coupe', formatType: 'knockout',
          nom: 'Coupe avec tableau de consolation',
          resume: 'Les éliminés du premier tour disputent leur propre tournoi.',
          champs: ['equipes', 'tetesSerie', 'matchTroisiemePlace'], valeurs: { manchesPhaseFinale: 1, tableauConsolation: true } },

        { code: 'coupe_tetes_serie', famille: 'coupe', formatType: 'knockout',
          nom: 'Coupe avec têtes de série et exemptions',
          resume: 'Les mieux classés sont exemptés des premiers tours et entrent en cours de tableau.',
          champs: ['equipes', 'tetesSerie', 'phaseFinaleDepuis', 'manchesPhaseFinale'], valeurs: {} },

        // ---------- FAMILLE MIXTE ----------
        { code: 'poules_elimination', famille: 'mixte', formatType: 'groups_knockout',
          nom: 'Poules puis élimination directe',
          resume: 'Une phase de groupes, puis un tableau entre les qualifiés. Le format classique des coupes du monde.',
          champs: ['equipes', 'groupes', 'parGroupe', 'qualifiesParGroupe', 'manches', 'phaseFinaleDepuis', 'manchesPhaseFinale', 'matchTroisiemePlace'],
          valeurs: {} },

        { code: 'poules_meilleurs_troisiemes', famille: 'mixte', formatType: 'groups_knockout',
          nom: 'Poules + meilleurs troisièmes',
          resume: 'Les premiers de chaque groupe passent, complétés par les meilleurs troisièmes tous groupes confondus. Modèle Coupe du Monde 2026 : 12 groupes de 4, les 2 premiers plus les 8 meilleurs troisièmes.',
          champs: ['equipes', 'groupes', 'parGroupe', 'qualifiesParGroupe', 'meilleursTroisiemes', 'manches', 'phaseFinaleDepuis', 'manchesPhaseFinale', 'matchTroisiemePlace'],
          valeurs: {} },

        { code: 'poules_super_poule', famille: 'mixte', formatType: 'groups_knockout',
          nom: 'Poules + super-poule finale',
          resume: 'Les qualifiés se retrouvent dans un mini-championnat final au lieu d\'un tableau.',
          champs: ['equipes', 'groupes', 'parGroupe', 'qualifiesParGroupe', 'manches'], valeurs: {} },

        { code: 'championnat_unique_uefa', famille: 'mixte', formatType: 'groups_knockout',
          nom: 'Phase de championnat unique + barrage + élimination',
          resume: 'Un seul classement général : chaque équipe affronte N adversaires différents. Les premiers passent directement, les suivants jouent un barrage, les derniers sont éliminés. Modèle Ligue des Champions depuis 2024 : 36 équipes, 8 matchs, top 8 direct en huitièmes, 9e à 24e en barrage, 25e à 36e éliminés.',
          champs: ['equipes', 'adversaires', 'qualifiesParGroupe', 'barrageDe', 'barrageA', 'phaseFinaleDepuis', 'manchesPhaseFinale'],
          valeurs: { groupes: 1 } },

        // ---------- FAMILLE SUISSE ----------
        { code: 'suisse_classique', famille: 'suisse', formatType: 'league',
          nom: 'Système suisse',
          resume: 'N rondes, appariement par score à chaque ronde, jamais deux fois le même adversaire.',
          champs: ['equipes', 'rondes'], valeurs: { groupes: 1, manches: 1 } },

        { code: 'suisse_phase_finale', famille: 'suisse', formatType: 'groups_knockout',
          nom: 'Système suisse + phase finale',
          resume: 'Les meilleurs du suisse basculent dans un tableau à élimination directe.',
          champs: ['equipes', 'rondes', 'qualifiesParGroupe', 'phaseFinaleDepuis', 'manchesPhaseFinale'],
          valeurs: { groupes: 1, manches: 1 } },

        // ---------- FAMILLE INDIVIDUEL ----------
        { code: 'classement_temps', famille: 'individuel', formatType: 'league',
          nom: 'Classement au temps',
          resume: 'Contre-la-montre, natation, athlétisme : le classement se fait sur la performance chronométrée.',
          champs: ['equipes'], valeurs: { unite: 'temps', groupes: 1, manches: 1 } },

        { code: 'classement_points', famille: 'individuel', formatType: 'league',
          nom: 'Classement aux points',
          resume: 'Gymnastique, cyclisme sur piste, notation de jury : le classement se fait sur un total de points.',
          champs: ['equipes'], valeurs: { unite: 'points', groupes: 1, manches: 1 } },

        { code: 'series_finale', famille: 'individuel', formatType: 'knockout',
          nom: 'Séries → demi-finales → finale',
          resume: 'Athlétisme sur piste, natation : des séries qualificatives, des demi-finales, puis la finale.',
          champs: ['equipes', 'groupes', 'qualifiesParGroupe'], valeurs: { manchesPhaseFinale: 1 } },

        { code: 'toutes_rondes_individuel', famille: 'individuel', formatType: 'league',
          nom: 'Toutes rondes individuel',
          resume: 'Tennis de table, échecs, arts martiaux en poule : chacun rencontre chacun.',
          champs: ['equipes', 'manches'], valeurs: { groupes: 1 } }
    ];

    var FAMILLES = [
        { code: 'championnat', nom: 'Championnat',            icone: 'fa-table-list' },
        { code: 'coupe',       nom: 'Coupe — élimination',    icone: 'fa-sitemap' },
        { code: 'mixte',       nom: 'Poules + phase finale',  icone: 'fa-layer-group' },
        { code: 'suisse',      nom: 'Système suisse',         icone: 'fa-shuffle' },
        { code: 'individuel',  nom: 'Individuel & chrono',    icone: 'fa-stopwatch' }
    ];

    // ═══════════════════════════════════════════════════════════
    // 3. CRITÈRES DE DÉPARTAGE
    //    L'ordre est ce qui compte : c'est une échelle, on
    //    descend d'un cran tant que l'égalité persiste.
    // ═══════════════════════════════════════════════════════════
    var CRITERES = [
        { code: 'confrontation_points',    nom: 'Confrontations directes — points' },
        { code: 'confrontation_difference',nom: 'Confrontations directes — différence de buts' },
        { code: 'confrontation_buts',      nom: 'Confrontations directes — buts marqués' },
        { code: 'difference_generale',     nom: 'Différence de buts générale' },
        { code: 'buts_generaux',           nom: 'Buts marqués' },
        { code: 'buts_exterieur',          nom: 'Buts marqués à l\'extérieur' },
        { code: 'victoires',               nom: 'Nombre de victoires' },
        { code: 'points_discipline',       nom: 'Points de discipline (cartons)' },
        { code: 'classement_reference',    nom: 'Position au classement de référence' },
        { code: 'tirage_au_sort',          nom: 'Tirage au sort' }
    ];

    var PREREGLAGES_DEPARTAGE = {
        simple:  { nom: 'Simple',
                   regles: ['difference_generale', 'buts_generaux'] },
        laliga:  { nom: 'LaLiga',
                   regles: ['confrontation_points', 'difference_generale', 'buts_generaux'] },
        fifa:    { nom: 'Coupe du Monde FIFA',
                   regles: ['confrontation_points', 'confrontation_difference', 'confrontation_buts',
                            'difference_generale', 'buts_generaux', 'points_discipline', 'classement_reference'] },
        uefa:    { nom: 'UEFA',
                   regles: ['difference_generale', 'buts_generaux', 'buts_exterieur', 'victoires', 'points_discipline'] }
    };

    // ═══════════════════════════════════════════════════════════
    // 4. ZONES DE QUALIFICATION
    // ═══════════════════════════════════════════════════════════
    var COULEURS_ZONE = [
        { code: 'vert',     nom: 'Vert',      hex: '#27ae60' },
        { code: 'bleu',     nom: 'Bleu',      hex: '#3498db' },
        { code: 'turquoise',nom: 'Turquoise', hex: '#16a085' },
        { code: 'or',       nom: 'Or',        hex: '#C99A00' },
        { code: 'violet',   nom: 'Violet',    hex: '#551B8C' },
        { code: 'rouge',    nom: 'Rouge',     hex: '#e74c3c' }
    ];

    var PREREGLAGES_ZONES = {
        aucune: { nom: 'Aucune zone', zones: [] },
        europe: { nom: 'Championnat européen', zones: [
            { de: 1, a: 4,  libelle: 'Ligue des Champions',              couleur: 'vert' },
            { de: 5, a: 5,  libelle: 'Ligue Europa',                     couleur: 'bleu' },
            { de: 6, a: 6,  libelle: 'Qualification Ligue Conférence',   couleur: 'turquoise' },
            { de: 18, a: 20,libelle: 'Relégation',                       couleur: 'rouge' }
        ]},
        podium: { nom: 'Podium seul', zones: [
            { de: 1, a: 1, libelle: 'Vainqueur',  couleur: 'or' },
            { de: 2, a: 3, libelle: 'Podium',     couleur: 'vert' }
        ]},
        qualification: { nom: 'Qualifiés / éliminés', zones: [
            { de: 1, a: 2,  libelle: 'Qualifiés',  couleur: 'vert' },
            { de: 3, a: 4,  libelle: 'Éliminés',   couleur: 'rouge' }
        ]}
    };

    // ═══════════════════════════════════════════════════════════
    // 5. VALEURS PAR DÉFAUT DU BARÈME
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

    // ═══════════════════════════════════════════════════════════
    // 6. UTILITAIRES
    // ═══════════════════════════════════════════════════════════
    function parCode(code) {
        for (var i = 0; i < CATALOGUE.length; i++) {
            if (CATALOGUE[i].code === code) return CATALOGUE[i];
        }
        return null;
    }

    function echapper(v) {
        if (v === null || v === undefined) return '';
        return String(v).replace(/[&<>"]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
        });
    }

    // Texte lisible décrivant le format retenu. Il est enregistré
    // dans qualification_explainer et affiché tel quel par
    // rankings.js sous le classement.
    function redigerExplication(format, valeurs) {
        if (!format) return '';
        var p = [];

        if (format.famille === 'championnat') {
            p.push(valeurs.manches === 2
                ? 'Championnat aller-retour : chaque équipe rencontre chaque adversaire à domicile et à l\'extérieur.'
                : 'Championnat aller simple : chaque équipe rencontre chaque adversaire une fois.');
            if (valeurs.groupes > 1) p.push('Les équipes sont réparties en ' + valeurs.groupes + ' tableaux au classement séparé.');
            if (valeurs.splitApres) p.push('Après la ' + valeurs.splitApres + 'e journée, la compétition se sépare en deux groupes.');
            if (valeurs.promus)   p.push(valeurs.promus === 1  ? 'Le premier est promu.'   : 'Les ' + valeurs.promus + ' premiers sont promus.');
            if (valeurs.relegues) p.push(valeurs.relegues === 1 ? 'Le dernier est relégué.' : 'Les ' + valeurs.relegues + ' derniers sont relégués.');
        }

        else if (format.famille === 'coupe') {
            p.push(valeurs.manchesPhaseFinale === 2
                ? 'Élimination directe en matchs aller-retour, finale en un seul match.'
                : 'Élimination directe : chaque rencontre élimine le perdant.');
            if (valeurs.toursPreliminaires) {
                p.push(valeurs.toursPreliminaires === 1
                    ? 'Un tour préliminaire précède le tableau principal.'
                    : valeurs.toursPreliminaires + ' tours préliminaires précèdent le tableau principal.');
            }
            if (valeurs.tetesSerie)         p.push(valeurs.tetesSerie === 1
                                                  ? 'La tête de série est protégée au tirage.'
                                                  : 'Les ' + valeurs.tetesSerie + ' têtes de série sont protégées au tirage.');
            if (valeurs.butExterieur)       p.push('La règle du but à l\'extérieur départage les doubles confrontations.');
            if (valeurs.tableauConsolation) p.push('Les éliminés du premier tour disputent un tableau de consolation.');
            if (valeurs.matchTroisiemePlace)p.push('Un match pour la troisième place est disputé.');
        }

        else if (format.famille === 'mixte') {
            if (format.code === 'championnat_unique_uefa') {
                p.push('Phase de championnat unique : ' + (valeurs.equipes || '—') + ' équipes, chacune affronte ' +
                       (valeurs.adversaires || '—') + ' adversaires différents.');
                p.push('Les ' + (valeurs.qualifiesParGroupe || 0) + ' premiers du classement se qualifient directement pour la phase à élimination directe.');
                p.push('Les équipes classées de la ' + (valeurs.barrageDe || '—') + 'e à la ' + (valeurs.barrageA || '—') +
                       'e place disputent un tour de barrage ; les suivantes sont éliminées.');
            } else {
                p.push((valeurs.groupes || '—') + ' groupes de ' + (valeurs.parGroupe || '—') + ' équipes.');
                var n = valeurs.qualifiesParGroupe || 0;
                p.push(n === 1
                    ? 'Le premier de chaque groupe se qualifie.'
                    : 'Les ' + n + ' premiers de chaque groupe se qualifient.');
                if (valeurs.meilleursTroisiemes > 0) {
                    p.push(valeurs.meilleursTroisiemes === 1
                        ? 'S\'y ajoute le meilleur troisième, tous groupes confondus.'
                        : 'S\'y ajoutent les ' + valeurs.meilleursTroisiemes + ' meilleurs troisièmes, tous groupes confondus.');
                }
                if (format.code === 'poules_super_poule') {
                    p.push('Les qualifiés disputent ensuite une poule finale.');
                } else {
                    p.push('La phase finale se joue ' + (valeurs.manchesPhaseFinale === 2 ? 'en aller-retour' : 'en match unique') + '.');
                }
            }
        }

        else if (format.famille === 'suisse') {
            p.push('Système suisse en ' + (valeurs.rondes || '—') + ' rondes : à chaque ronde, les équipes de score voisin s\'affrontent, sans jamais se rencontrer deux fois.');
            if (format.code === 'suisse_phase_finale') {
                p.push('Les ' + (valeurs.qualifiesParGroupe || 0) + ' premiers basculent en phase à élimination directe.');
            }
        }

        else if (format.famille === 'individuel') {
            if (valeurs.unite === 'temps')         p.push('Classement au temps : la meilleure performance chronométrée l\'emporte.');
            else if (valeurs.unite === 'distance') p.push('Classement à la distance : la meilleure marque l\'emporte.');
            else                                   p.push('Classement aux points : le total le plus élevé l\'emporte.');
            if (format.code === 'series_finale') {
                var q = valeurs.qualifiesParGroupe || 0;
                p.push((valeurs.groupes || '—') + ' séries. ' + (q === 1
                    ? 'Le premier de chaque série accède au tour suivant.'
                    : 'Les ' + q + ' premiers de chaque série accèdent au tour suivant.'));
            }
        }

        return p.join(' ');
    }

    // ═══════════════════════════════════════════════════════════
    // 7. CONSTRUCTION DE L'INTERFACE
    // ═══════════════════════════════════════════════════════════
    var etat = {
        hote: null,
        formatCourant: null,
        valeurs: {},
        bareme: null,
        departage: [],
        zones: [],
        verrouille: false
    };

    function champHtml(cle, valeur) {
        var def = CHAMPS[cle];
        if (!def) return '';
        var id = 'gtf_' + cle;

        if (def.type === 'bool') {
            return '<div class="gtf-champ gtf-champ-bool">' +
                   '<input type="checkbox" id="' + id + '" data-cle="' + cle + '"' + (valeur ? ' checked' : '') + '>' +
                   '<label for="' + id + '">' + echapper(def.libelle) + '</label>' +
                   '</div>';
        }

        if (def.type === 'choix') {
            var options = def.options.map(function (o) {
                var sel = (String(o.valeur) === String(valeur)) ? ' selected' : '';
                return '<option value="' + echapper(o.valeur) + '"' + sel + '>' + echapper(o.texte) + '</option>';
            }).join('');
            return '<div class="gtf-champ">' +
                   '<label for="' + id + '">' + echapper(def.libelle) + '</label>' +
                   '<select id="' + id + '" data-cle="' + cle + '">' + options + '</select>' +
                   '</div>';
        }

        return '<div class="gtf-champ">' +
               '<label for="' + id + '">' + echapper(def.libelle) + '</label>' +
               '<input type="number" id="' + id + '" data-cle="' + cle + '" min="' + def.min + '" max="' + def.max +
               '" value="' + echapper(valeur) + '">' +
               '</div>';
    }

    function rendreParametres() {
        var zone = etat.hote.querySelector('#gtfParametres');
        var resume = etat.hote.querySelector('#gtfResume');
        var explication = etat.hote.querySelector('#gtfExplication');

        if (!etat.formatCourant) {
            zone.innerHTML = '<p class="gtf-vide">Choisissez un format pour régler ses paramètres.</p>';
            resume.textContent = '';
            explication.textContent = '';
            return;
        }

        resume.textContent = etat.formatCourant.resume;
        zone.innerHTML = etat.formatCourant.champs.map(function (cle) {
            return champHtml(cle, etat.valeurs[cle]);
        }).join('');

        zone.querySelectorAll('[data-cle]').forEach(function (element) {
            element.addEventListener('input', function () { surChangementParametre(this); });
            element.addEventListener('change', function () { surChangementParametre(this); });
        });

        explication.textContent = redigerExplication(etat.formatCourant, etat.valeurs);
    }

    function surChangementParametre(element) {
        var cle = element.dataset.cle;
        var def = CHAMPS[cle];
        var valeur;
        if (def.type === 'bool')       valeur = element.checked;
        else if (def.type === 'choix') valeur = isNaN(Number(element.value)) ? element.value : Number(element.value);
        else                           valeur = parseInt(element.value, 10) || def.defaut;
        etat.valeurs[cle] = valeur;

        // Cohérence : équipes = groupes x parGroupe quand les trois
        // champs sont présents ensemble.
        if (etat.formatCourant.champs.indexOf('groupes') !== -1 &&
            etat.formatCourant.champs.indexOf('parGroupe') !== -1) {
            if (cle === 'groupes' || cle === 'parGroupe') {
                etat.valeurs.equipes = (etat.valeurs.groupes || 0) * (etat.valeurs.parGroupe || 0);
                var champEquipes = etat.hote.querySelector('#gtf_equipes');
                if (champEquipes) champEquipes.value = etat.valeurs.equipes;
            }
        }

        etat.hote.querySelector('#gtfExplication').textContent =
            redigerExplication(etat.formatCourant, etat.valeurs);
    }

    function choisirFormat(code) {
        var format = parCode(code);
        etat.formatCourant = format;
        etat.valeurs = {};
        if (format) {
            // valeurs figées du format, puis defauts des champs visibles
            Object.keys(format.valeurs).forEach(function (k) { etat.valeurs[k] = format.valeurs[k]; });
            format.champs.forEach(function (cle) {
                if (etat.valeurs[cle] === undefined) etat.valeurs[cle] = CHAMPS[cle].defaut;
            });
        }
        rendreParametres();
    }

    function rendreDepartage() {
        var liste = etat.hote.querySelector('#gtfDepartage');
        if (!liste) return;
        liste.innerHTML = etat.departage.map(function (code, index) {
            var critere = CRITERES.filter(function (c) { return c.code === code; })[0];
            return '<li class="gtf-critere" data-index="' + index + '">' +
                   '<span class="gtf-rang">' + (index + 1) + '</span>' +
                   '<span class="gtf-critere-nom">' + echapper(critere ? critere.nom : code) + '</span>' +
                   '<span class="gtf-critere-actions">' +
                     '<button type="button" class="gtf-btn-icone" data-action="monter"  title="Monter"' + (index === 0 ? ' disabled' : '') + '><i class="fas fa-arrow-up"></i></button>' +
                     '<button type="button" class="gtf-btn-icone" data-action="descendre" title="Descendre"' + (index === etat.departage.length - 1 ? ' disabled' : '') + '><i class="fas fa-arrow-down"></i></button>' +
                     '<button type="button" class="gtf-btn-icone gtf-retirer" data-action="retirer" title="Retirer"><i class="fas fa-times"></i></button>' +
                   '</span></li>';
        }).join('') || '<li class="gtf-vide">Aucun critère : les équipes à égalité seront affichées dans l\'ordre alphabétique.</li>';

        liste.querySelectorAll('button[data-action]').forEach(function (bouton) {
            bouton.addEventListener('click', function () {
                var index = parseInt(this.closest('.gtf-critere').dataset.index, 10);
                var action = this.dataset.action;
                if (action === 'monter'   && index > 0) {
                    var h = etat.departage[index - 1]; etat.departage[index - 1] = etat.departage[index]; etat.departage[index] = h;
                } else if (action === 'descendre' && index < etat.departage.length - 1) {
                    var b = etat.departage[index + 1]; etat.departage[index + 1] = etat.departage[index]; etat.departage[index] = b;
                } else if (action === 'retirer') {
                    etat.departage.splice(index, 1);
                }
                rendreDepartage();
                rafraichirCriteresDisponibles();
            });
        });
    }

    function rafraichirCriteresDisponibles() {
        var select = etat.hote.querySelector('#gtfAjoutCritere');
        if (!select) return;
        var restants = CRITERES.filter(function (c) { return etat.departage.indexOf(c.code) === -1; });
        select.innerHTML = '<option value="">— Ajouter un critère —</option>' +
            restants.map(function (c) { return '<option value="' + c.code + '">' + echapper(c.nom) + '</option>'; }).join('');
        select.disabled = !restants.length;
    }

    function rendreZones() {
        var liste = etat.hote.querySelector('#gtfZones');
        if (!liste) return;
        liste.innerHTML = etat.zones.map(function (z, index) {
            var couleur = COULEURS_ZONE.filter(function (c) { return c.code === z.couleur; })[0] || COULEURS_ZONE[0];
            return '<li class="gtf-zone" data-index="' + index + '">' +
                   '<span class="gtf-zone-pastille" style="background:' + couleur.hex + '"></span>' +
                   '<span class="gtf-zone-rangs">Rangs ' + z.de + ' à ' + z.a + '</span>' +
                   '<span class="gtf-zone-libelle">' + echapper(z.libelle) + '</span>' +
                   '<button type="button" class="gtf-btn-icone gtf-retirer" data-action="retirer" title="Retirer"><i class="fas fa-times"></i></button>' +
                   '</li>';
        }).join('') || '<li class="gtf-vide">Aucune zone. Le classement s\'affichera sans bande de couleur.</li>';

        liste.querySelectorAll('button[data-action="retirer"]').forEach(function (bouton) {
            bouton.addEventListener('click', function () {
                etat.zones.splice(parseInt(this.closest('.gtf-zone').dataset.index, 10), 1);
                rendreZones();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 8. SQUELETTE HTML DE L'ÉDITEUR
    // ═══════════════════════════════════════════════════════════
    function squelette() {
        var optionsFamilles = FAMILLES.map(function (f) {
            var formats = CATALOGUE.filter(function (c) { return c.famille === f.code; });
            return '<optgroup label="' + echapper(f.nom) + '">' +
                   formats.map(function (c) { return '<option value="' + c.code + '">' + echapper(c.nom) + '</option>'; }).join('') +
                   '</optgroup>';
        }).join('');

        var optionsDepartage = Object.keys(PREREGLAGES_DEPARTAGE).map(function (k) {
            return '<option value="' + k + '">' + echapper(PREREGLAGES_DEPARTAGE[k].nom) + '</option>';
        }).join('');

        var optionsZones = Object.keys(PREREGLAGES_ZONES).map(function (k) {
            return '<option value="' + k + '">' + echapper(PREREGLAGES_ZONES[k].nom) + '</option>';
        }).join('');

        var optionsCouleurs = COULEURS_ZONE.map(function (c) {
            return '<option value="' + c.code + '">' + echapper(c.nom) + '</option>';
        }).join('');

        return '' +
        '<div class="gtf-bloc" id="gtfBlocVerrou" style="display:none;">' +
            '<div class="gtf-verrou">' +
                '<i class="fas fa-lock"></i>' +
                '<div><strong>Format verrouillé.</strong> ' +
                '<span id="gtfVerrouTexte"></span></div>' +
            '</div>' +
        '</div>' +

        '<div class="gtf-bloc">' +
            '<label class="gtf-titre" for="gtfFormat">Format de compétition</label>' +
            '<select id="gtfFormat">' +
                '<option value="">— Choisissez un format —</option>' + optionsFamilles +
            '</select>' +
            '<p class="gtf-resume" id="gtfResume"></p>' +
        '</div>' +

        '<div class="gtf-bloc">' +
            '<span class="gtf-titre">Paramètres</span>' +
            '<div class="gtf-grille" id="gtfParametres">' +
                '<p class="gtf-vide">Choisissez un format pour régler ses paramètres.</p>' +
            '</div>' +
            '<p class="gtf-explication" id="gtfExplication"></p>' +
        '</div>' +

        '<div class="gtf-bloc">' +
            '<span class="gtf-titre">Barème de points</span>' +
            '<div class="gtf-grille">' +
                '<div class="gtf-champ"><label for="gtfPointsVictoire">Victoire</label><input type="number" id="gtfPointsVictoire" min="0" max="10" value="3"></div>' +
                '<div class="gtf-champ"><label for="gtfPointsNul">Match nul</label><input type="number" id="gtfPointsNul" min="0" max="10" value="1"></div>' +
                '<div class="gtf-champ"><label for="gtfPointsDefaite">Défaite</label><input type="number" id="gtfPointsDefaite" min="0" max="10" value="0"></div>' +
                '<div class="gtf-champ"><label for="gtfPointsVictoireTab">Victoire aux tirs au but</label><input type="number" id="gtfPointsVictoireTab" min="0" max="10" value="2"></div>' +
                '<div class="gtf-champ"><label for="gtfPointsDefaiteTab">Défaite aux tirs au but</label><input type="number" id="gtfPointsDefaiteTab" min="0" max="10" value="1"></div>' +
                '<div class="gtf-champ"><label for="gtfForfaitVainqueur">Forfait — buts au vainqueur</label><input type="number" id="gtfForfaitVainqueur" min="0" max="10" value="3"></div>' +
                '<div class="gtf-champ"><label for="gtfForfaitPerdant">Forfait — buts au perdant</label><input type="number" id="gtfForfaitPerdant" min="0" max="10" value="0"></div>' +
            '</div>' +
        '</div>' +

        '<div class="gtf-bloc">' +
            '<span class="gtf-titre">Départage des égalités</span>' +
            '<p class="gtf-aide">L\'ordre compte : on descend d\'un cran tant que l\'égalité persiste.</p>' +
            '<div class="gtf-ligne">' +
                '<select id="gtfPreDepartage"><option value="">— Modèle —</option>' + optionsDepartage + '</select>' +
                '<select id="gtfAjoutCritere"><option value="">— Ajouter un critère —</option></select>' +
            '</div>' +
            '<ol class="gtf-liste" id="gtfDepartage"></ol>' +
        '</div>' +

        '<div class="gtf-bloc">' +
            '<span class="gtf-titre">Zones de qualification</span>' +
            '<p class="gtf-aide">Une bande de couleur à gauche du rang, avec sa légende sous le classement.</p>' +
            '<div class="gtf-ligne">' +
                '<select id="gtfPreZones"><option value="">— Modèle —</option>' + optionsZones + '</select>' +
            '</div>' +
            '<div class="gtf-ligne gtf-ligne-zone">' +
                '<input type="number" id="gtfZoneDe" min="1" max="512" placeholder="Du rang" aria-label="Du rang">' +
                '<input type="number" id="gtfZoneA"  min="1" max="512" placeholder="Au rang" aria-label="Au rang">' +
                '<input type="text"   id="gtfZoneLibelle" placeholder="Intitulé, ex : Ligue des Champions" aria-label="Intitulé">' +
                '<select id="gtfZoneCouleur" aria-label="Couleur">' + optionsCouleurs + '</select>' +
                '<button type="button" class="gtf-btn-ajout" id="gtfAjoutZone"><i class="fas fa-plus"></i> Ajouter</button>' +
            '</div>' +
            '<ul class="gtf-liste" id="gtfZones"></ul>' +
        '</div>';
    }

    // ═══════════════════════════════════════════════════════════
    // 9. POINT D'ENTRÉE — MONTAGE
    // ═══════════════════════════════════════════════════════════
    function monterEditeur(options) {
        options = options || {};
        var hote = document.getElementById(options.conteneur || 'gtFormatEditeur');
        if (!hote) return;

        etat.hote = hote;
        etat.bareme = Object.assign({}, BAREME_DEFAUT);
        etat.departage = PREREGLAGES_DEPARTAGE.laliga.regles.slice();
        etat.zones = [];
        etat.formatCourant = null;
        etat.valeurs = {};
        etat.verrouille = false;

        hote.className = 'gtf-editeur';
        hote.innerHTML = squelette();

        hote.querySelector('#gtfFormat').addEventListener('change', function () {
            choisirFormat(this.value);
        });

        hote.querySelector('#gtfPreDepartage').addEventListener('change', function () {
            var pre = PREREGLAGES_DEPARTAGE[this.value];
            if (!pre) return;
            etat.departage = pre.regles.slice();
            rendreDepartage();
            rafraichirCriteresDisponibles();
        });

        hote.querySelector('#gtfAjoutCritere').addEventListener('change', function () {
            if (!this.value) return;
            etat.departage.push(this.value);
            this.value = '';
            rendreDepartage();
            rafraichirCriteresDisponibles();
        });

        hote.querySelector('#gtfPreZones').addEventListener('change', function () {
            var pre = PREREGLAGES_ZONES[this.value];
            if (!pre) return;
            etat.zones = JSON.parse(JSON.stringify(pre.zones));
            rendreZones();
        });

        hote.querySelector('#gtfAjoutZone').addEventListener('click', function () {
            var de = parseInt(hote.querySelector('#gtfZoneDe').value, 10);
            var a  = parseInt(hote.querySelector('#gtfZoneA').value, 10);
            var libelle = hote.querySelector('#gtfZoneLibelle').value.trim();
            if (!de || !a || !libelle) return;
            if (a < de) { var t = de; de = a; a = t; }
            etat.zones.push({ de: de, a: a, libelle: libelle, couleur: hote.querySelector('#gtfZoneCouleur').value });
            etat.zones.sort(function (x, y) { return x.de - y.de; });
            hote.querySelector('#gtfZoneDe').value = '';
            hote.querySelector('#gtfZoneA').value = '';
            hote.querySelector('#gtfZoneLibelle').value = '';
            rendreZones();
        });

        rendreDepartage();
        rafraichirCriteresDisponibles();
        rendreZones();

        if (options.configuration) appliquer(options.configuration);
        if (options.verrouille) verrouiller(options.messageVerrou);
    }

    // ═══════════════════════════════════════════════════════════
    // 10. LECTURE / ÉCRITURE DE LA CONFIGURATION
    // ═══════════════════════════════════════════════════════════

    // Reconstitue l'éditeur à partir d'une ligne gt_tournaments.
    function appliquer(tournoi) {
        if (!tournoi) return;
        var config = tournoi.format_config || {};

        if (config.code && parCode(config.code)) {
            etat.hote.querySelector('#gtfFormat').value = config.code;
            choisirFormat(config.code);
            if (config.valeurs) {
                Object.keys(config.valeurs).forEach(function (k) { etat.valeurs[k] = config.valeurs[k]; });
                rendreParametres();
            }
        }

        etat.bareme = {
            pointsVictoire:          tournoi.points_win           !== undefined && tournoi.points_win           !== null ? tournoi.points_win           : BAREME_DEFAUT.pointsVictoire,
            pointsNul:               tournoi.points_draw          !== undefined && tournoi.points_draw          !== null ? tournoi.points_draw          : BAREME_DEFAUT.pointsNul,
            pointsDefaite:           tournoi.points_loss          !== undefined && tournoi.points_loss          !== null ? tournoi.points_loss          : BAREME_DEFAUT.pointsDefaite,
            pointsVictoireTirsAuBut: config.pointsVictoireTirsAuBut !== undefined ? config.pointsVictoireTirsAuBut : BAREME_DEFAUT.pointsVictoireTirsAuBut,
            pointsDefaiteTirsAuBut:  config.pointsDefaiteTirsAuBut  !== undefined ? config.pointsDefaiteTirsAuBut  : BAREME_DEFAUT.pointsDefaiteTirsAuBut,
            forfaitVainqueur:        tournoi.forfeit_score_winner !== undefined && tournoi.forfeit_score_winner !== null ? tournoi.forfeit_score_winner : BAREME_DEFAUT.forfaitVainqueur,
            forfaitPerdant:          tournoi.forfeit_score_loser  !== undefined && tournoi.forfeit_score_loser  !== null ? tournoi.forfeit_score_loser  : BAREME_DEFAUT.forfaitPerdant
        };
        etat.hote.querySelector('#gtfPointsVictoire').value    = etat.bareme.pointsVictoire;
        etat.hote.querySelector('#gtfPointsNul').value         = etat.bareme.pointsNul;
        etat.hote.querySelector('#gtfPointsDefaite').value     = etat.bareme.pointsDefaite;
        etat.hote.querySelector('#gtfPointsVictoireTab').value = etat.bareme.pointsVictoireTirsAuBut;
        etat.hote.querySelector('#gtfPointsDefaiteTab').value  = etat.bareme.pointsDefaiteTirsAuBut;
        etat.hote.querySelector('#gtfForfaitVainqueur').value  = etat.bareme.forfaitVainqueur;
        etat.hote.querySelector('#gtfForfaitPerdant').value    = etat.bareme.forfaitPerdant;

        if (Array.isArray(tournoi.tiebreak_rules) && tournoi.tiebreak_rules.length) {
            etat.departage = tournoi.tiebreak_rules.slice();
            rendreDepartage();
            rafraichirCriteresDisponibles();
        }
        if (Array.isArray(tournoi.qualification_zones)) {
            etat.zones = JSON.parse(JSON.stringify(tournoi.qualification_zones));
            rendreZones();
        }
    }

    // Renvoie exactement les colonnes à écrire sur gt_tournaments.
    function lire() {
        if (!etat.hote) return null;
        var format = etat.formatCourant;
        if (!format) return null;

        function nombre(id, defaut) {
            var element = etat.hote.querySelector(id);
            if (!element) return defaut;
            var v = parseInt(element.value, 10);
            return isNaN(v) ? defaut : v;
        }

        var pointsVictoireTab = nombre('#gtfPointsVictoireTab', BAREME_DEFAUT.pointsVictoireTirsAuBut);
        var pointsDefaiteTab  = nombre('#gtfPointsDefaiteTab',  BAREME_DEFAUT.pointsDefaiteTirsAuBut);

        return {
            // --- colonnes existantes, deja lues par rankings.js ---
            format_type:             format.formatType,
            qualifiers_per_group:    etat.valeurs.qualifiesParGroupe || 0,
            qualifiers_count:        (etat.valeurs.qualifiesParGroupe || 0) * (etat.valeurs.groupes || 1)
                                     + (etat.valeurs.meilleursTroisiemes || 0),
            best_third_place_count:  etat.valeurs.meilleursTroisiemes || 0,
            qualification_explainer: redigerExplication(format, etat.valeurs),

            // --- nouvelles colonnes ---
            format_family: format.famille,
            format_config: {
                code: format.code,
                nom: format.nom,
                valeurs: JSON.parse(JSON.stringify(etat.valeurs)),
                pointsVictoireTirsAuBut: pointsVictoireTab,
                pointsDefaiteTirsAuBut: pointsDefaiteTab
            },
            points_win:            nombre('#gtfPointsVictoire', BAREME_DEFAUT.pointsVictoire),
            points_draw:           nombre('#gtfPointsNul',      BAREME_DEFAUT.pointsNul),
            points_loss:           nombre('#gtfPointsDefaite',  BAREME_DEFAUT.pointsDefaite),
            forfeit_score_winner:  nombre('#gtfForfaitVainqueur', BAREME_DEFAUT.forfaitVainqueur),
            forfeit_score_loser:   nombre('#gtfForfaitPerdant',   BAREME_DEFAUT.forfaitPerdant),
            tiebreak_rules:        etat.departage.slice(),
            qualification_zones:   JSON.parse(JSON.stringify(etat.zones))
        };
    }

    // Grise l'éditeur : utilisé quand des résultats sont déjà
    // enregistrés et que le format ne doit plus bouger sans
    // confirmation explicite.
    function verrouiller(message) {
        if (!etat.hote) return;
        etat.verrouille = true;
        var bloc = etat.hote.querySelector('#gtfBlocVerrou');
        var texte = etat.hote.querySelector('#gtfVerrouTexte');
        if (texte) texte.textContent = message || 'Des matchs ont déjà un résultat enregistré.';
        if (bloc) bloc.style.display = 'block';
        etat.hote.querySelectorAll('select, input, button').forEach(function (element) {
            if (element.closest('#gtfBlocVerrou')) return;
            element.disabled = true;
        });
        etat.hote.classList.add('gtf-est-verrouille');
    }

    function deverrouiller() {
        if (!etat.hote) return;
        etat.verrouille = false;
        var bloc = etat.hote.querySelector('#gtfBlocVerrou');
        if (bloc) bloc.style.display = 'none';
        etat.hote.querySelectorAll('select, input, button').forEach(function (element) { element.disabled = false; });
        etat.hote.classList.remove('gtf-est-verrouille');
        rafraichirCriteresDisponibles();
    }

    function estVerrouille() { return etat.verrouille; }

    // ═══════════════════════════════════════════════════════════
    // 11. API PUBLIQUE
    // ═══════════════════════════════════════════════════════════
    return {
        monterEditeur: monterEditeur,
        lire: lire,
        appliquer: appliquer,
        verrouiller: verrouiller,
        deverrouiller: deverrouiller,
        estVerrouille: estVerrouille,
        redigerExplication: redigerExplication,
        parCode: parCode,
        CATALOGUE: CATALOGUE,
        FAMILLES: FAMILLES,
        CRITERES: CRITERES,
        COULEURS_ZONE: COULEURS_ZONE,
        BAREME_DEFAUT: BAREME_DEFAUT
    };

})();
