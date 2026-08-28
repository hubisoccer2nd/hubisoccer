/* ============================================================
   HubISoccer — gt-officiels.js
   Système Gestion Tournois — Acteurs et rapports de match
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   La page « Rapport de match » proposait trois acteurs : arbitre,
   commissaire, staff médical. Aucun contrôle : n'importe quel
   compte pouvait déposer un « rapport arbitre » sur n'importe quel
   match. Le formulaire arbitre n'avait aucun champ nominatif —
   des cartons en texte libre, pas de buteur, pas de passeur.
   Rien ne pouvait donc alimenter les statistiques.

   CE FICHIER CONTIENT

   1. Le catalogue des 32 acteurs d'un match, en 5 familles.
   2. La structure des formulaires, bloc par bloc et champ par
      champ, au niveau de détail d'un rapport de fédération.
   3. Le rendu du formulaire et sa lecture.

   LE VERROU EST LA DÉSIGNATION, PAS LE RÔLE

   Un parrain, un formateur ou un footballeur peut être désigné
   commissaire de match. Ce n'est donc pas le code de rôle du
   compte qui ouvre le formulaire, mais le fait d'avoir été
   désigné par l'organisateur sur CE tournoi — et éventuellement
   sur CE match précis.

   AJOUTER UN ACTEUR OU UN CHAMP

   Ajouter une entrée dans ACTEURS ou dans FORMULAIRES. Le
   sélecteur, le formulaire et le PDF s'en déduisent.

   CE FICHIER NE TOUCHE PAS AU RÉSEAU
   Il construit et lit des formulaires. Les requêtes appartiennent
   à la page appelante.
   ============================================================ */
'use strict';

window.GTOfficiels = (function () {

    // ═══════════════════════════════════════════════════════════
    // 1. LES 32 ACTEURS
    //    famille : détermine le formulaire proposé.
    //    parEquipe : l'acteur est rattaché à une équipe précise.
    // ═══════════════════════════════════════════════════════════
    var ACTEURS = [

        // ---------- CORPS ARBITRAL (8) ----------
        { code: 'arbitre_central',     nom: 'Arbitre central',            famille: 'arbitrage' },
        { code: 'arbitre_assistant_1', nom: 'Arbitre assistant 1',        famille: 'arbitrage' },
        { code: 'arbitre_assistant_2', nom: 'Arbitre assistant 2',        famille: 'arbitrage' },
        { code: 'quatrieme_arbitre',   nom: 'Quatrième arbitre',          famille: 'arbitrage' },
        { code: 'var',                 nom: 'Arbitre assistant vidéo (VAR)', famille: 'arbitrage' },
        { code: 'avar',                nom: 'Assistant VAR (AVAR)',       famille: 'arbitrage' },
        { code: 'arbitre_reserve',     nom: 'Arbitre de réserve',         famille: 'arbitrage' },
        { code: 'arbitre_de_but',      nom: 'Arbitre de but',             famille: 'arbitrage' },

        // ---------- OFFICIELS DE MATCH (9) ----------
        { code: 'commissaire_match',   nom: 'Commissaire de match',       famille: 'officiel' },
        { code: 'delegue_match',       nom: 'Délégué de match',           famille: 'officiel' },
        { code: 'delegue_general',     nom: 'Délégué général / superviseur', famille: 'officiel' },
        { code: 'officier_liaison',    nom: 'Officier de liaison des équipes', famille: 'officiel' },
        { code: 'coordinateur_media',  nom: 'Coordinateur média',         famille: 'officiel' },
        { code: 'officier_securite',   nom: 'Officier de sécurité',       famille: 'securite' },
        { code: 'responsable_terrain', nom: 'Responsable terrain & logistique', famille: 'securite' },
        { code: 'chronometreur',       nom: 'Chronométreur / officiel de table', famille: 'officiel' },
        { code: 'controleur_antidopage', nom: 'Contrôleur antidopage',    famille: 'medical' },

        // ---------- ENCADREMENT DES ÉQUIPES (8) ----------
        { code: 'entraineur_principal', nom: 'Entraîneur principal',      famille: 'encadrement', parEquipe: true },
        { code: 'entraineur_adjoint',   nom: 'Entraîneur adjoint',        famille: 'encadrement', parEquipe: true },
        { code: 'entraineur_gardiens',  nom: 'Entraîneur des gardiens',   famille: 'encadrement', parEquipe: true },
        { code: 'preparateur_physique', nom: 'Préparateur physique',      famille: 'encadrement', parEquipe: true },
        { code: 'analyste_video',       nom: 'Analyste vidéo',            famille: 'encadrement', parEquipe: true },
        { code: 'capitaine',            nom: 'Capitaine',                 famille: 'encadrement', parEquipe: true },
        { code: 'manager_general',      nom: 'Manager général',           famille: 'encadrement', parEquipe: true },
        { code: 'intendant',            nom: 'Intendant / matériel',      famille: 'encadrement', parEquipe: true },

        // ---------- CORPS MÉDICAL (5) ----------
        { code: 'medecin_match',       nom: 'Médecin de match',           famille: 'medical' },
        { code: 'medecin_equipe',      nom: 'Médecin d\'équipe',          famille: 'medical', parEquipe: true },
        { code: 'kinesitherapeute',    nom: 'Kinésithérapeute',           famille: 'medical', parEquipe: true },
        { code: 'secouriste',          nom: 'Secouriste / ambulancier',   famille: 'medical' },
        { code: 'psychologue',         nom: 'Psychologue du sport',       famille: 'medical', parEquipe: true },

        // ---------- ORGANISATION (2) ----------
        { code: 'organisateur',        nom: 'Organisateur du tournoi',    famille: 'organisation' },
        { code: 'president_organisation', nom: 'Président de l\'organisation', famille: 'organisation' }
    ];

    var FAMILLES = [
        { code: 'arbitrage',    nom: 'Corps arbitral',        icone: 'fa-whistle' },
        { code: 'officiel',     nom: 'Officiels de match',    icone: 'fa-clipboard-user' },
        { code: 'securite',     nom: 'Sécurité & logistique', icone: 'fa-shield-halved' },
        { code: 'encadrement',  nom: 'Encadrement des équipes', icone: 'fa-people-group' },
        { code: 'medical',      nom: 'Corps médical',         icone: 'fa-kit-medical' },
        { code: 'organisation', nom: 'Organisation',          icone: 'fa-building-columns' }
    ];

    // ═══════════════════════════════════════════════════════════
    // 2. MOTIFS CODIFIÉS
    //    Un motif codifié se compte, se filtre et se recoupe.
    //    Un motif en texte libre ne sert qu'à être relu.
    // ═══════════════════════════════════════════════════════════
    var MOTIFS_JAUNE = [
        'Comportement antisportif', 'Contestation de décision', 'Faute répétée',
        'Retard à la reprise du jeu', 'Non-respect de la distance', 'Entrée ou sortie sans autorisation',
        'Simulation', 'Célébration excessive', 'Autre'
    ];
    var MOTIFS_ROUGE = [
        'Faute grossière', 'Comportement violent', 'Crachat',
        'Empêcher un but de la main', 'Anéantir une occasion de but',
        'Propos ou gestes injurieux', 'Second avertissement', 'Autre'
    ];
    var TYPES_BUT = [
        'Dans le jeu', 'Penalty', 'Coup franc direct', 'Coup franc indirect',
        'Corner direct', 'Tête', 'Contre son camp', 'Tir de loin'
    ];
    var MOTIFS_REMPLACEMENT = [
        'Tactique', 'Blessure', 'Protocole commotion', 'Fatigue', 'Sanction', 'Autre'
    ];
    var NATURES_BLESSURE = [
        'Musculaire', 'Articulaire', 'Fracture suspectée', 'Commotion suspectée',
        'Plaie / saignement', 'Malaise', 'Autre'
    ];

    // ═══════════════════════════════════════════════════════════
    // 3. BLOCS DE FORMULAIRE
    //    Chaque bloc est une liste de champs. Types disponibles :
    //      texte, longtexte, nombre, heure, date, choix, bool
    //      liste  -> lignes répétables, décrites par « colonnes »
    // ═══════════════════════════════════════════════════════════
    var BLOCS = {

        identification: {
            titre: 'Identification',
            aide: 'Rempli automatiquement depuis le match, corrigeable.',
            champs: [
                { cle: 'stade',        libelle: 'Stade',                type: 'texte' },
                { cle: 'ville',        libelle: 'Ville',                type: 'texte' },
                { cle: 'surface',      libelle: 'Nature de la surface', type: 'choix',
                  options: ['Gazon naturel', 'Gazon synthétique', 'Terre battue', 'Stabilisé', 'Salle', 'Autre'] },
                { cle: 'etatTerrain',  libelle: 'État du terrain',      type: 'choix',
                  options: ['Excellent', 'Bon', 'Correct', 'Dégradé', 'Impraticable'] },
                { cle: 'meteo',        libelle: 'Météo',                type: 'choix',
                  options: ['Dégagé', 'Nuageux', 'Pluie légère', 'Pluie forte', 'Vent fort', 'Chaleur extrême', 'Harmattan'] },
                { cle: 'temperature',  libelle: 'Température (°C)',     type: 'nombre' },
                { cle: 'heureCoupEnvoi', libelle: 'Coup d\'envoi',      type: 'heure' },
                { cle: 'heureFin',     libelle: 'Coup de sifflet final', type: 'heure' },
                { cle: 'affluence',    libelle: 'Affluence',            type: 'nombre' }
            ]
        },

        resultat: {
            titre: 'Résultat',
            champs: [
                { cle: 'scoreMiTempsA', libelle: 'Mi-temps — équipe A', type: 'nombre' },
                { cle: 'scoreMiTempsB', libelle: 'Mi-temps — équipe B', type: 'nombre' },
                { cle: 'scoreFinalA',   libelle: 'Score final — équipe A', type: 'nombre' },
                { cle: 'scoreFinalB',   libelle: 'Score final — équipe B', type: 'nombre' },
                { cle: 'prolongation',  libelle: 'Prolongation disputée', type: 'bool' },
                { cle: 'scoreProlongationA', libelle: 'Après prolongation — A', type: 'nombre' },
                { cle: 'scoreProlongationB', libelle: 'Après prolongation — B', type: 'nombre' },
                { cle: 'tirsAuBut',     libelle: 'Séance de tirs au but', type: 'bool' },
                { cle: 'scoreTirsAuBut', libelle: 'Score des tirs au but', type: 'texte', exemple: '4-2' }
            ]
        },

        tirsAuButDetail: {
            titre: 'Tirs au but — tireur par tireur',
            aide: 'Dans l\'ordre de passage.',
            champs: [
                { cle: 'tireurs', libelle: 'Tireurs', type: 'liste', colonnes: [
                    { cle: 'ordre',  libelle: 'N°',      type: 'nombre',  largeur: 'etroit' },
                    { cle: 'equipe', libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'joueur', libelle: 'Sportif', type: 'sportif' },
                    { cle: 'issue',  libelle: 'Issue',   type: 'choix',
                      options: ['Marqué', 'Arrêté', 'Hors cadre', 'Poteau'] }
                ]}
            ]
        },

        buts: {
            titre: 'Buts',
            aide: 'Chaque but saisi ici alimente les statistiques du buteur et du passeur.',
            champs: [
                { cle: 'buts', libelle: 'Buts', type: 'liste', colonnes: [
                    { cle: 'minute',  libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'equipe',  libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'buteur',  libelle: 'Buteur',  type: 'sportif' },
                    { cle: 'passeur', libelle: 'Passeur', type: 'sportif' },
                    { cle: 'type',    libelle: 'Type',    type: 'choix', options: TYPES_BUT }
                ]}
            ]
        },

        discipline: {
            titre: 'Cartons',
            aide: 'Le motif est codifié : c\'est ce qui permet de compter et de recouper.',
            champs: [
                { cle: 'cartonsJaunes', libelle: 'Cartons jaunes', type: 'liste', colonnes: [
                    { cle: 'minute', libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'equipe', libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'joueur', libelle: 'Sportif', type: 'sportif' },
                    { cle: 'motif',  libelle: 'Motif',   type: 'choix', options: MOTIFS_JAUNE }
                ]},
                { cle: 'cartonsRouges', libelle: 'Cartons rouges', type: 'liste', colonnes: [
                    { cle: 'minute', libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'equipe', libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'joueur', libelle: 'Sportif', type: 'sportif' },
                    { cle: 'motif',  libelle: 'Motif',   type: 'choix', options: MOTIFS_ROUGE }
                ]}
            ]
        },

        expulsions: {
            titre: 'Rapport circonstancié d\'expulsion',
            aide: 'Obligatoire dès qu\'un carton rouge est saisi. Le formulaire ne se valide pas sans.',
            champs: [
                { cle: 'recitExpulsion', libelle: 'Récit détaillé des faits', type: 'longtexte', lignes: 5 }
            ]
        },

        remplacements: {
            titre: 'Remplacements',
            champs: [
                { cle: 'remplacements', libelle: 'Remplacements', type: 'liste', colonnes: [
                    { cle: 'minute',  libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'equipe',  libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'sortant', libelle: 'Sortant', type: 'sportif' },
                    { cle: 'entrant', libelle: 'Entrant', type: 'sportif' },
                    { cle: 'motif',   libelle: 'Motif',   type: 'choix', options: MOTIFS_REMPLACEMENT }
                ]}
            ]
        },

        tempsAdditionnel: {
            titre: 'Temps additionnel',
            champs: [
                { cle: 'additionnelPremiere', libelle: '1re période (min)', type: 'nombre' },
                { cle: 'additionnelSeconde',  libelle: '2e période (min)',  type: 'nombre' },
                { cle: 'additionnelProlongation', libelle: 'Prolongations (min)', type: 'nombre' }
            ]
        },

        blessures: {
            titre: 'Blessures',
            champs: [
                { cle: 'blessures', libelle: 'Blessures constatées', type: 'liste', colonnes: [
                    { cle: 'minute',  libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'equipe',  libelle: 'Équipe',  type: 'equipe' },
                    { cle: 'joueur',  libelle: 'Sportif', type: 'sportif' },
                    { cle: 'nature',  libelle: 'Nature',  type: 'choix', options: NATURES_BLESSURE },
                    { cle: 'civiere', libelle: 'Civière', type: 'bool' },
                    { cle: 'evacuation', libelle: 'Ambulance', type: 'bool' }
                ]}
            ]
        },

        incidents: {
            titre: 'Incidents',
            champs: [
                { cle: 'retardCoupEnvoi',  libelle: 'Retard au coup d\'envoi (min)', type: 'nombre' },
                { cle: 'interruption',     libelle: 'Match interrompu',   type: 'bool' },
                { cle: 'dureeInterruption', libelle: 'Durée de l\'interruption (min)', type: 'nombre' },
                { cle: 'envahissement',    libelle: 'Envahissement de terrain', type: 'bool' },
                { cle: 'jetsObjets',       libelle: 'Jets d\'objets',     type: 'bool' },
                { cle: 'fumigenes',        libelle: 'Fumigènes',          type: 'bool' },
                { cle: 'comportementPublic', libelle: 'Comportement du public', type: 'choix',
                  options: ['Exemplaire', 'Correct', 'Bruyant sans incident', 'Tendu', 'Incidents graves'] },
                { cle: 'comportementBancs',  libelle: 'Comportement des bancs', type: 'choix',
                  options: ['Exemplaire', 'Correct', 'Contestations', 'Incidents'] },
                { cle: 'recitIncidents',   libelle: 'Récit des incidents', type: 'longtexte', lignes: 4 }
            ]
        },

        reserves: {
            titre: 'Réserves et réclamations',
            champs: [
                { cle: 'reserveDeposee', libelle: 'Une réserve a été déposée', type: 'bool' },
                { cle: 'reserveAuteur',  libelle: 'Déposée par',  type: 'texte' },
                { cle: 'reserveObjet',   libelle: 'Objet de la réserve', type: 'longtexte', lignes: 3 }
            ]
        },

        observations: {
            titre: 'Observations',
            champs: [
                { cle: 'obsTerrain',     libelle: 'Terrain',      type: 'longtexte', lignes: 2 },
                { cle: 'obsEclairage',   libelle: 'Éclairage',    type: 'longtexte', lignes: 2 },
                { cle: 'obsVestiaires',  libelle: 'Vestiaires',   type: 'longtexte', lignes: 2 },
                { cle: 'obsSecurite',    libelle: 'Sécurité',     type: 'longtexte', lignes: 2 },
                { cle: 'obsGenerale',    libelle: 'Observation générale', type: 'longtexte', lignes: 3 }
            ]
        },

        organisationMatch: {
            titre: 'Organisation du match',
            champs: [
                { cle: 'noteOrganisation', libelle: 'Note d\'organisation (sur 10)', type: 'nombre' },
                { cle: 'protocoleRespecte', libelle: 'Protocole d\'avant-match respecté', type: 'bool' },
                { cle: 'ponctualiteEquipes', libelle: 'Ponctualité des équipes', type: 'choix',
                  options: ['Les deux à l\'heure', 'Équipe A en retard', 'Équipe B en retard', 'Les deux en retard'] },
                { cle: 'licencesControlees', libelle: 'Licences contrôlées', type: 'bool' },
                { cle: 'conformiteMaillots', libelle: 'Conformité des maillots', type: 'bool' },
                { cle: 'accueilDelegations', libelle: 'Accueil des délégations', type: 'longtexte', lignes: 3 },
                { cle: 'cahierChargesRespecte', libelle: 'Cahier des charges respecté', type: 'bool' }
            ]
        },

        securite: {
            titre: 'Sécurité',
            champs: [
                { cle: 'effectifSecurite',  libelle: 'Agents de sécurité présents', type: 'nombre' },
                { cle: 'forcesOrdre',       libelle: 'Forces de l\'ordre présentes', type: 'bool' },
                { cle: 'controleAcces',     libelle: 'Contrôle des accès',  type: 'choix',
                  options: ['Rigoureux', 'Correct', 'Partiel', 'Inexistant'] },
                { cle: 'issuesSecours',     libelle: 'Issues de secours dégagées', type: 'bool' },
                { cle: 'incidentsSecurite', libelle: 'Incidents de sécurité', type: 'longtexte', lignes: 4 }
            ]
        },

        interventionsMedicales: {
            titre: 'Interventions médicales',
            champs: [
                { cle: 'ambulanceSurPlace', libelle: 'Ambulance présente sur place', type: 'bool' },
                { cle: 'medecinPresent',    libelle: 'Médecin présent',    type: 'bool' },
                { cle: 'interventions',     libelle: 'Interventions',      type: 'liste', colonnes: [
                    { cle: 'minute',  libelle: 'Minute',  type: 'nombre', largeur: 'etroit' },
                    { cle: 'personne', libelle: 'Personne', type: 'texte' },
                    { cle: 'nature',  libelle: 'Nature',  type: 'choix', options: NATURES_BLESSURE },
                    { cle: 'suite',   libelle: 'Suite donnée', type: 'choix',
                      options: ['Reprise du jeu', 'Sortie définitive', 'Évacuation hôpital', 'Surveillance'] }
                ]},
                { cle: 'observationsMedicales', libelle: 'Observations', type: 'longtexte', lignes: 3 }
            ]
        },

        antidopage: {
            titre: 'Contrôle antidopage',
            champs: [
                { cle: 'controleEffectue', libelle: 'Contrôle effectué',   type: 'bool' },
                { cle: 'nombreControles',  libelle: 'Nombre de sportifs contrôlés', type: 'nombre' },
                { cle: 'modeDesignation',  libelle: 'Mode de désignation', type: 'choix',
                  options: ['Tirage au sort', 'Ciblé', 'Systématique'] },
                { cle: 'incidentsControle', libelle: 'Incidents lors du contrôle', type: 'longtexte', lignes: 3 }
            ]
        },

        equipe: {
            titre: 'Rapport d\'équipe',
            champs: [
                { cle: 'systemeJeu',       libelle: 'Système de jeu',     type: 'texte', exemple: '4-3-3' },
                { cle: 'appreciationJeu',  libelle: 'Appréciation du match', type: 'longtexte', lignes: 4 },
                { cle: 'sportifsRemarques', libelle: 'Sportifs remarqués', type: 'longtexte', lignes: 3 },
                { cle: 'difficultes',      libelle: 'Difficultés rencontrées', type: 'longtexte', lignes: 3 },
                { cle: 'reclamation',      libelle: 'Réclamation à formuler', type: 'longtexte', lignes: 3 }
            ]
        },

        validation: {
            titre: 'Validation de l\'organisation',
            aide: 'Réservé au président de l\'organisation.',
            champs: [
                { cle: 'rapportsVerifies', libelle: 'Tous les rapports ont été vérifiés', type: 'bool' },
                { cle: 'conformite',       libelle: 'Conformité du déroulement', type: 'choix',
                  options: ['Conforme', 'Conforme avec réserves', 'Non conforme'] },
                { cle: 'decision',         libelle: 'Décision et suites', type: 'longtexte', lignes: 4 }
            ]
        }
    };

    // ═══════════════════════════════════════════════════════════
    // 4. QUELS BLOCS POUR QUELLE FAMILLE
    // ═══════════════════════════════════════════════════════════
    var FORMULAIRES = {
        arbitrage:    ['identification', 'resultat', 'tirsAuButDetail', 'buts', 'discipline',
                       'expulsions', 'remplacements', 'tempsAdditionnel', 'blessures',
                       'incidents', 'reserves', 'observations'],
        officiel:     ['identification', 'organisationMatch', 'incidents', 'reserves', 'observations'],
        securite:     ['identification', 'securite', 'incidents', 'observations'],
        encadrement:  ['identification', 'equipe', 'remplacements', 'blessures', 'reserves'],
        medical:      ['identification', 'interventionsMedicales', 'blessures', 'antidopage', 'observations'],
        organisation: ['identification', 'validation', 'observations']
    };

    // ═══════════════════════════════════════════════════════════
    // 5. UTILITAIRES
    // ═══════════════════════════════════════════════════════════
    function acteurParCode(code) {
        for (var i = 0; i < ACTEURS.length; i++) if (ACTEURS[i].code === code) return ACTEURS[i];
        return null;
    }

    function acteursParFamille(famille) {
        return ACTEURS.filter(function (a) { return a.famille === famille; });
    }

    function echapper(v) {
        if (v === null || v === undefined) return '';
        return String(v).replace(/[&<>"]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. RENDU D'UN CHAMP
    // ═══════════════════════════════════════════════════════════
    function rendreChamp(champ, valeur, contexte) {
        var id = 'gto_' + champ.cle;
        var attrCle = ' data-cle="' + champ.cle + '"';

        if (champ.type === 'bool') {
            return '<div class="gto-champ gto-champ-bool">' +
                   '<input type="checkbox" id="' + id + '"' + attrCle + (valeur ? ' checked' : '') + '>' +
                   '<label for="' + id + '">' + echapper(champ.libelle) + '</label></div>';
        }

        if (champ.type === 'longtexte') {
            return '<div class="gto-champ gto-champ-large">' +
                   '<label for="' + id + '">' + echapper(champ.libelle) + '</label>' +
                   '<textarea id="' + id + '"' + attrCle + ' rows="' + (champ.lignes || 3) + '">' +
                   echapper(valeur) + '</textarea></div>';
        }

        if (champ.type === 'choix') {
            var options = ['<option value="">—</option>'].concat(champ.options.map(function (o) {
                return '<option value="' + echapper(o) + '"' + (o === valeur ? ' selected' : '') + '>' + echapper(o) + '</option>';
            })).join('');
            return '<div class="gto-champ"><label for="' + id + '">' + echapper(champ.libelle) + '</label>' +
                   '<select id="' + id + '"' + attrCle + '>' + options + '</select></div>';
        }

        if (champ.type === 'liste') {
            return rendreListe(champ, valeur, contexte);
        }

        var typeHtml = champ.type === 'nombre' ? 'number'
                     : champ.type === 'heure'  ? 'time'
                     : champ.type === 'date'   ? 'date' : 'text';

        return '<div class="gto-champ"><label for="' + id + '">' + echapper(champ.libelle) + '</label>' +
               '<input type="' + typeHtml + '" id="' + id + '"' + attrCle +
               (champ.exemple ? ' placeholder="' + echapper(champ.exemple) + '"' : '') +
               ' value="' + echapper(valeur) + '"></div>';
    }

    // Une liste répétable : buts, cartons, remplacements…
    function rendreListe(champ, valeur, contexte) {
        var lignes = Array.isArray(valeur) ? valeur : [];
        return '<div class="gto-liste" data-liste="' + champ.cle + '">' +
               '<div class="gto-liste-tete">' +
                   '<span>' + echapper(champ.libelle) + '</span>' +
                   '<button type="button" class="gto-ajout" data-ajout="' + champ.cle + '">' +
                       '<i class="fas fa-plus"></i> Ajouter</button>' +
               '</div>' +
               '<div class="gto-liste-corps" data-corps="' + champ.cle + '">' +
                   lignes.map(function (l) { return rendreLigneListe(champ, l, contexte); }).join('') +
               '</div>' +
               (lignes.length ? '' : '<p class="gto-liste-vide">Aucune ligne. Utilisez « Ajouter ».</p>') +
               '</div>';
    }

    function rendreLigneListe(champ, ligne, contexte) {
        ligne = ligne || {};
        contexte = contexte || {};
        var equipes = contexte.equipes || [];
        var sportifs = contexte.sportifs || [];

        var cellules = champ.colonnes.map(function (col) {
            var v = ligne[col.cle];
            var classe = 'gto-cellule' + (col.largeur === 'etroit' ? ' gto-cellule-etroite' : '');
            var attr = ' data-col="' + col.cle + '"';

            if (col.type === 'equipe') {
                return '<div class="' + classe + '"><label>' + echapper(col.libelle) + '</label>' +
                       '<select' + attr + '><option value="">—</option>' +
                       equipes.map(function (e) {
                           return '<option value="' + echapper(e.id) + '"' + (String(e.id) === String(v) ? ' selected' : '') +
                                  '>' + echapper(e.name) + '</option>';
                       }).join('') + '</select></div>';
            }

            if (col.type === 'sportif') {
                return '<div class="' + classe + '"><label>' + echapper(col.libelle) + '</label>' +
                       '<select' + attr + '><option value="">—</option>' +
                       sportifs.map(function (s) {
                           var etiquette = (s.jersey_number ? '#' + s.jersey_number + ' ' : '') + s.nom;
                           return '<option value="' + echapper(s.id) + '"' + (String(s.id) === String(v) ? ' selected' : '') +
                                  '>' + echapper(etiquette) + '</option>';
                       }).join('') + '</select></div>';
            }

            if (col.type === 'choix') {
                return '<div class="' + classe + '"><label>' + echapper(col.libelle) + '</label>' +
                       '<select' + attr + '><option value="">—</option>' +
                       col.options.map(function (o) {
                           return '<option value="' + echapper(o) + '"' + (o === v ? ' selected' : '') + '>' + echapper(o) + '</option>';
                       }).join('') + '</select></div>';
            }

            if (col.type === 'bool') {
                return '<div class="' + classe + ' gto-cellule-bool"><label>' + echapper(col.libelle) + '</label>' +
                       '<input type="checkbox"' + attr + (v ? ' checked' : '') + '></div>';
            }

            var typeHtml = col.type === 'nombre' ? 'number' : 'text';
            return '<div class="' + classe + '"><label>' + echapper(col.libelle) + '</label>' +
                   '<input type="' + typeHtml + '"' + attr + ' value="' + echapper(v) + '"></div>';
        }).join('');

        return '<div class="gto-ligne">' + cellules +
               '<button type="button" class="gto-retrait" title="Retirer cette ligne"><i class="fas fa-times"></i></button>' +
               '</div>';
    }

    // ═══════════════════════════════════════════════════════════
    // 7. MONTAGE DU FORMULAIRE
    // ═══════════════════════════════════════════════════════════
    function monterFormulaire(options) {
        options = options || {};
        var hote = document.getElementById(options.conteneur || 'gtoFormulaire');
        if (!hote) return;

        var acteur = acteurParCode(options.acteur);
        if (!acteur) {
            hote.innerHTML = '<p class="gto-vide">Choisissez votre rôle pour ce match.</p>';
            return;
        }

        var contenu = options.contenu || {};
        var contexte = { equipes: options.equipes || [], sportifs: options.sportifs || [] };
        var blocs = FORMULAIRES[acteur.famille] || [];

        hote.className = 'gto-formulaire';
        hote.innerHTML = blocs.map(function (nomBloc) {
            var bloc = BLOCS[nomBloc];
            if (!bloc) return '';
            return '<section class="gto-bloc" data-bloc="' + nomBloc + '">' +
                   '<h3 class="gto-bloc-titre">' + echapper(bloc.titre) + '</h3>' +
                   (bloc.aide ? '<p class="gto-bloc-aide">' + echapper(bloc.aide) + '</p>' : '') +
                   '<div class="gto-grille">' +
                       bloc.champs.map(function (champ) {
                           return rendreChamp(champ, contenu[champ.cle], contexte);
                       }).join('') +
                   '</div></section>';
        }).join('');

        cablerListes(hote, contexte);
        return acteur;
    }

    function cablerListes(hote, contexte) {
        hote.querySelectorAll('[data-ajout]').forEach(function (bouton) {
            bouton.addEventListener('click', function () {
                var cle = this.dataset.ajout;
                var champ = trouverChampListe(cle);
                if (!champ) return;
                var corps = hote.querySelector('[data-corps="' + cle + '"]');
                corps.insertAdjacentHTML('beforeend', rendreLigneListe(champ, {}, contexte));
                var vide = corps.parentNode.querySelector('.gto-liste-vide');
                if (vide) vide.remove();
                cablerRetraits(hote);
            });
        });
        cablerRetraits(hote);
    }

    function cablerRetraits(hote) {
        hote.querySelectorAll('.gto-retrait').forEach(function (bouton) {
            if (bouton.dataset.cable) return;
            bouton.dataset.cable = '1';
            bouton.addEventListener('click', function () {
                var ligne = this.closest('.gto-ligne');
                if (ligne) ligne.remove();
            });
        });
    }

    function trouverChampListe(cle) {
        var trouve = null;
        Object.keys(BLOCS).forEach(function (nomBloc) {
            BLOCS[nomBloc].champs.forEach(function (champ) {
                if (champ.cle === cle && champ.type === 'liste') trouve = champ;
            });
        });
        return trouve;
    }

    // ═══════════════════════════════════════════════════════════
    // 8. LECTURE DU FORMULAIRE
    // ═══════════════════════════════════════════════════════════
    function lire(conteneur) {
        var hote = document.getElementById(conteneur || 'gtoFormulaire');
        if (!hote) return {};
        var contenu = {};

        hote.querySelectorAll('[data-cle]').forEach(function (element) {
            var cle = element.dataset.cle;
            if (element.type === 'checkbox')      contenu[cle] = element.checked;
            else if (element.type === 'number')   contenu[cle] = element.value === '' ? null : Number(element.value);
            else                                  contenu[cle] = element.value;
        });

        hote.querySelectorAll('[data-liste]').forEach(function (bloc) {
            var cle = bloc.dataset.liste;
            var lignes = [];
            bloc.querySelectorAll('.gto-ligne').forEach(function (ligne) {
                var objet = {};
                var vide = true;
                ligne.querySelectorAll('[data-col]').forEach(function (cellule) {
                    var col = cellule.dataset.col;
                    var v;
                    if (cellule.type === 'checkbox')    v = cellule.checked;
                    else if (cellule.type === 'number') v = cellule.value === '' ? null : Number(cellule.value);
                    else                                v = cellule.value;
                    objet[col] = v;
                    if (v !== '' && v !== null && v !== false) vide = false;
                });
                if (!vide) lignes.push(objet);
            });
            contenu[cle] = lignes;
        });

        return contenu;
    }

    // ═══════════════════════════════════════════════════════════
    // 9. CONTRÔLES AVANT DÉPÔT
    // ═══════════════════════════════════════════════════════════
    function verifier(acteurCode, contenu) {
        var fautes = [];
        var acteur = acteurParCode(acteurCode);
        if (!acteur) return ['Aucun rôle sélectionné.'];

        // Un carton rouge exige son rapport circonstancié.
        var rouges = contenu.cartonsRouges || [];
        if (rouges.length && !(contenu.recitExpulsion || '').trim()) {
            fautes.push('Un carton rouge a été saisi : le rapport circonstancié d\'expulsion est obligatoire.');
        }

        // Un but sans buteur ne sert à rien : il n'alimente aucune
        // statistique et fausse le total.
        (contenu.buts || []).forEach(function (but, index) {
            if (!but.buteur) fautes.push('But n°' + (index + 1) + ' : le buteur n\'est pas renseigné.');
            if (but.minute === null || but.minute === undefined || but.minute === '') {
                fautes.push('But n°' + (index + 1) + ' : la minute n\'est pas renseignée.');
            }
        });

        (contenu.cartonsJaunes || []).forEach(function (c, index) {
            if (!c.joueur) fautes.push('Carton jaune n°' + (index + 1) + ' : le sportif n\'est pas renseigné.');
        });
        rouges.forEach(function (c, index) {
            if (!c.joueur) fautes.push('Carton rouge n°' + (index + 1) + ' : le sportif n\'est pas renseigné.');
        });

        (contenu.remplacements || []).forEach(function (r, index) {
            if (!r.sortant || !r.entrant) {
                fautes.push('Remplacement n°' + (index + 1) + ' : il faut un sortant et un entrant.');
            }
        });

        return fautes;
    }

    // ═══════════════════════════════════════════════════════════
    // 10. ÉVÉNEMENTS EXTRAITS POUR LES STATISTIQUES
    //     C'est le pont vers le chantier 05 : ce qui est saisi ici
    //     devient des lignes de gt_match_events.
    // ═══════════════════════════════════════════════════════════
    function extraireEvenements(contenu, idMatch) {
        var evenements = [];

        (contenu.buts || []).forEach(function (b) {
            evenements.push({ match_id: idMatch, event_type: 'goal', minute: b.minute,
                              team_id: b.equipe || null, player_id: b.buteur || null,
                              assist_player_id: b.passeur || null, detail: b.type || null });
        });
        (contenu.cartonsJaunes || []).forEach(function (c) {
            evenements.push({ match_id: idMatch, event_type: 'yellow_card', minute: c.minute,
                              team_id: c.equipe || null, player_id: c.joueur || null, detail: c.motif || null });
        });
        (contenu.cartonsRouges || []).forEach(function (c) {
            evenements.push({ match_id: idMatch, event_type: 'red_card', minute: c.minute,
                              team_id: c.equipe || null, player_id: c.joueur || null, detail: c.motif || null });
        });
        (contenu.remplacements || []).forEach(function (r) {
            evenements.push({ match_id: idMatch, event_type: 'substitution', minute: r.minute,
                              team_id: r.equipe || null, player_id: r.entrant || null,
                              assist_player_id: r.sortant || null, detail: r.motif || null });
        });
        (contenu.blessures || []).forEach(function (b) {
            evenements.push({ match_id: idMatch, event_type: 'injury', minute: b.minute,
                              team_id: b.equipe || null, player_id: b.joueur || null, detail: b.nature || null });
        });

        return evenements;
    }

    return {
        ACTEURS: ACTEURS,
        FAMILLES: FAMILLES,
        BLOCS: BLOCS,
        FORMULAIRES: FORMULAIRES,
        acteurParCode: acteurParCode,
        acteursParFamille: acteursParFamille,
        monterFormulaire: monterFormulaire,
        lire: lire,
        verifier: verifier,
        extraireEvenements: extraireEvenements
    };

})();
