/* ============================================================
   HubISoccer — gt-lexique.js
   Systeme Gestion Tournois — le nom de chaque discipline
   ------------------------------------------------------------
   CE QUE FAIT CE FICHIER

   Il donne le bon mot. Rien d'autre.
   Aucun acces au DOM en lecture, aucun appel reseau, aucune
   dependance. La seule fonction qui touche a la page —
   appliquer() — ne modifie QUE les elements que la page a
   explicitement marques.

   POURQUOI IL EXISTE

   Tu ne veux plus voir le mot « joueur ». Il apparaissait 54
   fois dans le module : « Ajouter un joueur », « Aucun joueur
   trouve », « Joueur inconnu », « Cette equipe n'a pas de
   joueurs »… Ecrit en dur, donc faux des qu'il ne s'agit plus
   de football.

   Un tournoi de basket parle de basketteurs. Un concours de
   chant parle de chanteurs et de chanteuses. Une competition
   de slam parle de slameurs. Chaque discipline porte son nom.

   COMMENT ON S'EN SERT

   1. Dans du texte construit par le JavaScript :
        GTLexique.terme(sport, 'pluriel')   -> « Basketteurs »
        GTLexique.un(sport)                 -> « un basketteur »

   2. Dans du HTML statique, on marque l'element :
        <button data-lex="Ajouter un {sportif}">…</button>
        <input data-lex-placeholder="Nom du {sportif}…">
      puis la page appelle une seule fois :
        GTLexique.appliquer(sport);

   Les elements NON marques ne sont jamais touches. C'est
   volontaire : le libelle du menu reste « Statistiques
   footballeur » comme tu l'as fixe au point 30, et rien ne
   viendra le reecrire dans le dos.

   AJOUTER UNE DISCIPLINE

   Une entree dans DISCIPLINES. Aucune page a retoucher.
   ============================================================ */

window.GTLexique = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. LE DICTIONNAIRE
    // -------------------------------------------------------
    // code       identifiant interne, stable
    // nom        le nom de la discipline
    // alias      ce qu'on peut lire dans gt_sports.name ou dans
    //            un code de la base — la reconnaissance est
    //            tolerante, elle doit marcher sur « FOOT »,
    //            « Football », « football à 7 »…
    // sportif    le pratiquant, au masculin singulier
    // sportive   au feminin singulier, quand la langue le
    //            distingue ; null quand le mot est epicene
    //            (« un DJ », « une DJ »)
    // pluriel    au masculin pluriel
    // pluriels   au feminin pluriel
    // collectif  comment s'appelle le groupe : equipe, groupe,
    //            troupe… « l'equipe de chant » sonne faux
    // rencontre  ce que deux concurrents disputent : un match,
    //            une manche, un passage
    // rencontres son pluriel
    // ═══════════════════════════════════════════════════════

    var DISCIPLINES = [
        // ─────────── Sports collectifs ───────────
        {
            code: 'football', nom: 'Football',
            alias: ['foot', 'football', 'soccer', 'futsal'],
            sportif: 'Footballeur', sportive: 'Footballeuse',
            pluriel: 'Footballeurs', pluriels: 'Footballeuses',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },
        {
            code: 'basket', nom: 'Basket-ball',
            alias: ['basket', 'basket-ball', 'basketball'],
            sportif: 'Basketteur', sportive: 'Basketteuse',
            pluriel: 'Basketteurs', pluriels: 'Basketteuses',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },
        {
            code: 'volley', nom: 'Volley-ball',
            alias: ['volley', 'volley-ball', 'volleyball'],
            sportif: 'Volleyeur', sportive: 'Volleyeuse',
            pluriel: 'Volleyeurs', pluriels: 'Volleyeuses',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },
        {
            code: 'handball', nom: 'Handball',
            alias: ['hand', 'handball', 'hand-ball'],
            sportif: 'Handballeur', sportive: 'Handballeuse',
            pluriel: 'Handballeurs', pluriels: 'Handballeuses',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },
        {
            code: 'rugby', nom: 'Rugby',
            alias: ['rugby'],
            sportif: 'Rugbyman', sportive: 'Rugbywoman',
            pluriel: 'Rugbymen', pluriels: 'Rugbywomen',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },

        // ─────────── Sports individuels ───────────
        {
            code: 'tennis', nom: 'Tennis',
            alias: ['tennis'],
            sportif: 'Tenniste', sportive: null,
            pluriel: 'Tennistes', pluriels: 'Tennistes',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'match', rencontres: 'matchs'
        },
        {
            code: 'athletisme', nom: 'Athlétisme',
            alias: ['athletisme', 'athlétisme', 'athle', 'athlé'],
            sportif: 'Athlète', sportive: null,
            pluriel: 'Athlètes', pluriels: 'Athlètes',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'épreuve', rencontres: 'épreuves'
        },
        {
            code: 'natation', nom: 'Natation',
            alias: ['natation', 'nage'],
            sportif: 'Nageur', sportive: 'Nageuse',
            pluriel: 'Nageurs', pluriels: 'Nageuses',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'épreuve', rencontres: 'épreuves'
        },
        {
            code: 'cyclisme', nom: 'Cyclisme',
            alias: ['cyclisme', 'velo', 'vélo', 'cycliste'],
            sportif: 'Cycliste', sportive: null,
            pluriel: 'Cyclistes', pluriels: 'Cyclistes',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'course', rencontres: 'courses'
        },
        {
            code: 'arts_martiaux', nom: 'Arts martiaux',
            alias: ['art martial', 'arts martiaux', 'judo', 'karate', 'karaté',
                    'taekwondo', 'boxe', 'lutte', 'mma'],
            sportif: 'Combattant', sportive: 'Combattante',
            pluriel: 'Combattants', pluriels: 'Combattantes',
            collectif: 'équipe', collectifs: 'équipes',
            rencontre: 'combat', rencontres: 'combats'
        },

        // ─────────── Disciplines artistiques ───────────
        // Ta consigne du point C : rien ne se cache derriere le
        // mot « artiste ». Chacune garde son appellation propre.
        {
            code: 'chant', nom: 'Chant', codeBase: 'CHAN',
            alias: ['chant', 'chanson', 'vocal'],
            sportif: 'Chanteur', sportive: 'Chanteuse',
            pluriel: 'Chanteurs', pluriels: 'Chanteuses',
            collectif: 'groupe', collectifs: 'groupes',
            rencontre: 'prestation', rencontres: 'prestations'
        },
        {
            code: 'danse', nom: 'Danse', codeBase: 'DANS',
            alias: ['danse', 'dance', 'choregraphie', 'chorégraphie'],
            sportif: 'Danseur', sportive: 'Danseuse',
            pluriel: 'Danseurs', pluriels: 'Danseuses',
            collectif: 'troupe', collectifs: 'troupes',
            rencontre: 'prestation', rencontres: 'prestations'
        },
        {
            code: 'slam', nom: 'Slam', codeBase: 'SLAM',
            alias: ['slam', 'poesie', 'poésie'],
            sportif: 'Slameur', sportive: 'Slameuse',
            pluriel: 'Slameurs', pluriels: 'Slameuses',
            collectif: 'collectif', collectifs: 'collectifs',
            rencontre: 'passage', rencontres: 'passages'
        },
        {
            code: 'dj', nom: 'Deejaying', codeBase: 'DJ',
            alias: ['dj', 'deejaying', 'deejay', 'mix'],
            sportif: 'DJ', sportive: null,
            pluriel: 'DJs', pluriels: 'DJs',
            collectif: 'collectif', collectifs: 'collectifs',
            rencontre: 'set', rencontres: 'sets'
        },
        {
            code: 'cirque', nom: 'Cirque', codeBase: 'CIRQ',
            alias: ['cirque', 'circassien', 'acrobatie'],
            sportif: 'Circassien', sportive: 'Circassienne',
            pluriel: 'Circassiens', pluriels: 'Circassiennes',
            collectif: 'troupe', collectifs: 'troupes',
            rencontre: 'numéro', rencontres: 'numéros'
        },
        {
            code: 'humour', nom: 'Humour', codeBase: 'HUMO',
            alias: ['humour', 'humoriste', 'stand-up', 'stand up'],
            sportif: 'Humoriste', sportive: null,
            pluriel: 'Humoristes', pluriels: 'Humoristes',
            collectif: 'collectif', collectifs: 'collectifs',
            rencontre: 'passage', rencontres: 'passages'
        },
        {
            code: 'comedie', nom: 'Comédie', codeBase: 'COMP',
            alias: ['comedie', 'comédie'],
            sportif: 'Comédien', sportive: 'Comédienne',
            pluriel: 'Comédiens', pluriels: 'Comédiennes',
            collectif: 'troupe', collectifs: 'troupes',
            rencontre: 'représentation', rencontres: 'représentations'
        },
        {
            code: 'cinema', nom: 'Cinéma', codeBase: 'ACIN',
            alias: ['cinema', 'cinéma', 'acteur', 'film'],
            sportif: 'Acteur', sportive: 'Actrice',
            pluriel: 'Acteurs', pluriels: 'Actrices',
            collectif: 'distribution', collectifs: 'distributions',
            rencontre: 'scène', rencontres: 'scènes'
        },
        {
            code: 'theatre', nom: 'Théâtre', codeBase: 'ATHE',
            alias: ['theatre', 'théâtre'],
            sportif: 'Comédien de théâtre', sportive: 'Comédienne de théâtre',
            pluriel: 'Comédiens de théâtre', pluriels: 'Comédiennes de théâtre',
            collectif: 'troupe', collectifs: 'troupes',
            rencontre: 'représentation', rencontres: 'représentations'
        },
        {
            code: 'arts_visuels', nom: 'Arts visuels', codeBase: 'VISU',
            alias: ['art visuel', 'arts visuels', 'peinture', 'dessin', 'photographie'],
            sportif: 'Artiste visuel', sportive: 'Artiste visuelle',
            pluriel: 'Artistes visuels', pluriels: 'Artistes visuelles',
            collectif: 'collectif', collectifs: 'collectifs',
            rencontre: 'exposition', rencontres: 'expositions'
        }
    ];

    // Le repli. Il ne dit jamais « joueur » : quand on ne
    // reconnait pas la discipline, on dit « sportif », qui est
    // juste pour tout le monde.
    var REPLI = {
        code: 'autre', nom: 'Discipline non précisée',
        alias: [],
        sportif: 'Sportif', sportive: 'Sportive',
        pluriel: 'Sportifs', pluriels: 'Sportives',
        collectif: 'équipe', collectifs: 'équipes',
        rencontre: 'rencontre', rencontres: 'rencontres'
    };

    // ═══════════════════════════════════════════════════════
    // 2. RECONNAITRE LA DISCIPLINE
    // -------------------------------------------------------
    // gt_sports.name arrive en texte libre, ecrit a la main :
    // « Football », « FOOT », « football à 7 », « Basket-ball ».
    // On accepte tout cela.
    //
    // La comparaison se fait sans accents ni casse : « Athlétisme »
    // et « athletisme » doivent tomber sur la meme entree.
    // ═══════════════════════════════════════════════════════

    function normaliser(texte) {
        if (texte == null) return '';
        var t = String(texte).toLowerCase().trim();
        // Retire les accents sans dependre de String.normalize,
        // absent de quelques navigateurs anciens.
        var avec = 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ';
        var sans = 'aaaaaaceeeeiiiinooooouuuuyy';
        var sortie = '';
        for (var i = 0; i < t.length; i++) {
            var j = avec.indexOf(t[i]);
            sortie += j === -1 ? t[i] : sans[j];
        }
        return sortie;
    }

    function pour(nomOuCode) {
        var t = normaliser(nomOuCode);
        if (!t) return REPLI;

        var i, d;

        // 1 — le code interne, exact
        for (i = 0; i < DISCIPLINES.length; i++) {
            if (DISCIPLINES[i].code === t) return DISCIPLINES[i];
        }
        // 2 — le code de la base (CHAN, DANS, SLAM…), exact
        for (i = 0; i < DISCIPLINES.length; i++) {
            d = DISCIPLINES[i];
            if (d.codeBase && normaliser(d.codeBase) === t) return d;
        }
        // 3 — le nom complet, exact
        for (i = 0; i < DISCIPLINES.length; i++) {
            if (normaliser(DISCIPLINES[i].nom) === t) return DISCIPLINES[i];
        }
        // 4 — un alias contenu dans le texte. On prend le plus
        //     long qui corresponde : « basket-ball » doit gagner
        //     sur « basket », et « arts visuels » sur « art ».
        var meilleur = null, longueur = 0;
        for (i = 0; i < DISCIPLINES.length; i++) {
            d = DISCIPLINES[i];
            for (var k = 0; k < d.alias.length; k++) {
                var a = normaliser(d.alias[k]);
                if (a && t.indexOf(a) !== -1 && a.length > longueur) {
                    meilleur = d; longueur = a.length;
                }
            }
        }
        return meilleur || REPLI;
    }

    // ═══════════════════════════════════════════════════════
    // 3. DONNER LE MOT
    // -------------------------------------------------------
    // formes acceptees :
    //   'sportif'     Footballeur          (par defaut)
    //   'sportive'    Footballeuse
    //   'pluriel'     Footballeurs
    //   'pluriels'    Footballeuses
    //   'collectif'   équipe
    //   'collectifs'  équipes
    //   'rencontre'   match
    //   'rencontres'  matchs
    //   'discipline'  Football
    // ═══════════════════════════════════════════════════════

    function terme(sport, forme) {
        var d = typeof sport === 'object' && sport ? sport : pour(sport);
        var f = forme || 'sportif';

        if (f === 'discipline') return d.nom;
        if (f === 'sportive')   return d.sportive || d.sportif;
        if (f === 'pluriels')   return d.pluriels || d.pluriel;
        if (d[f] !== undefined && d[f] !== null) return d[f];
        return d.sportif;
    }

    // La meme chose en minuscules, pour un mot en milieu de
    // phrase : « Aucun footballeur trouvé ».
    function minuscule(sport, forme) {
        var mot = terme(sport, forme);
        // Un sigle reste en majuscules : on n'ecrit pas « un dj ».
        // Deux tests, parce qu'un seul ne suffisait pas :
        //   « DJ »  est entierement en capitales ;
        //   « DJs » ne l'est pas — son « s » de pluriel est en
        //   minuscule — et la premiere regle le laissait passer,
        //   ce qui donnait « dJs ». La seconde lettre en capitale
        //   suffit a reconnaitre un sigle et a le proteger.
        if (mot === mot.toUpperCase() && mot.length <= 4) return mot;
        var deuxieme = mot.charAt(1);
        if (deuxieme && deuxieme === deuxieme.toUpperCase() &&
            deuxieme !== deuxieme.toLowerCase()) return mot;
        return mot.charAt(0).toLowerCase() + mot.slice(1);
    }

    // « un footballeur », « une footballeuse », « un athlète ».
    // L'article indefini ne s'elide jamais : c'est « un athlète »,
    // pas « l'athlète ». L'elision est l'affaire de defini().
    function article(sport, forme, feminin) {
        var mot = minuscule(sport, forme || (feminin ? 'sportive' : 'sportif'));
        return (feminin ? 'une ' : 'un ') + mot;
    }
    function un(sport)  { return article(sport, 'sportif', false); }
    function une(sport) { return article(sport, 'sportive', true); }

    // Les mots du lexique qui commencent par un h muet. Le
    // francais elide devant eux — « l'humoriste » — mais pas
    // devant un h aspire — « le handballeur ». Aucune regle
    // automatique ne separe les deux : la liste est donc ecrite
    // a la main, et il n'y a que ces mots-la a connaitre.
    // Toute discipline ajoutee plus tard dont le nom commence
    // par un h muet doit venir s'inscrire ici.
    var H_MUET = ['humoriste', 'humoristes'];

    // « le footballeur », « l'athlète », « l'humoriste »,
    // mais « le handballeur ».
    function defini(sport, forme) {
        var mot = minuscule(sport, forme || 'sportif');
        var nu = normaliser(mot);
        var premiere = nu.charAt(0);
        if ('aeiouy'.indexOf(premiere) !== -1) return 'l\'' + mot;
        if (H_MUET.indexOf(nu) !== -1) return 'l\'' + mot;
        return 'le ' + mot;
    }

    // Les deux genres, quand la page s'adresse a tout le monde :
    // « Chanteur · Chanteuse ». Quand le mot est epicene, on ne
    // le repete pas bêtement.
    function lesDeux(sport, pluriel) {
        var d = typeof sport === 'object' && sport ? sport : pour(sport);
        var m = pluriel ? d.pluriel : d.sportif;
        var f = pluriel ? (d.pluriels || d.pluriel) : (d.sportive || d.sportif);
        return m === f ? m : m + ' · ' + f;
    }

    // ═══════════════════════════════════════════════════════
    // 4. REMPLIR UN GABARIT
    // -------------------------------------------------------
    // « Ajouter un {sportif} »        -> « Ajouter un footballeur »
    // « Aucun {sportif} trouvé »      -> « Aucun footballeur trouvé »
    // « {Sportifs} de l'{collectif} » -> « Footballeurs de l'équipe »
    //
    // Une accolade avec une majuscule initiale donne le mot avec
    // une majuscule ; en minuscules, le mot en minuscules.
    // ═══════════════════════════════════════════════════════

    function remplir(gabarit, sport) {
        if (gabarit == null) return '';
        var d = typeof sport === 'object' && sport ? sport : pour(sport);

        return String(gabarit).replace(/\{([A-Za-zéèêà]+)\}/g, function (tout, cle) {
            var majuscule = cle.charAt(0) === cle.charAt(0).toUpperCase() &&
                            cle.charAt(0) !== cle.charAt(0).toLowerCase();
            var forme = cle.charAt(0).toLowerCase() + cle.slice(1);

            var connues = ['sportif', 'sportive', 'pluriel', 'pluriels',
                           'collectif', 'collectifs', 'rencontre', 'rencontres', 'discipline'];
            if (connues.indexOf(forme) === -1) return tout;   // on ne touche pas a ce qu'on ne connait pas

            var mot = majuscule ? terme(d, forme) : minuscule(d, forme);
            return mot;
        });
    }

    // ═══════════════════════════════════════════════════════
    // 5. APPLIQUER A LA PAGE
    // -------------------------------------------------------
    // Ne touche QUE les elements portant un attribut data-lex*.
    // Tout le reste de la page est laisse tel quel — le libelle
    // « Statistiques footballeur » du menu ne bouge donc jamais,
    // conformement a ton point 30.
    //
    //   data-lex="Ajouter un {sportif}"        -> textContent
    //   data-lex-html="<i></i> {Pluriel}"      -> innerHTML
    //   data-lex-placeholder="Nom du {sportif}"
    //   data-lex-title="Fiche du {sportif}"
    //   data-lex-aria-label="…"
    //
    // Le gabarit reste dans l'attribut : on peut rappeler
    // appliquer() apres un changement de sport sans avoir perdu
    // le texte d'origine.
    // ═══════════════════════════════════════════════════════

    function appliquer(sport, racine) {
        if (typeof document === 'undefined') return 0;
        var hote = racine || document;
        var d = typeof sport === 'object' && sport ? sport : pour(sport);
        var touches = 0;

        var textes = hote.querySelectorAll('[data-lex]');
        Array.prototype.forEach.call(textes, function (el) {
            el.textContent = remplir(el.getAttribute('data-lex'), d);
            touches++;
        });

        var html = hote.querySelectorAll('[data-lex-html]');
        Array.prototype.forEach.call(html, function (el) {
            el.innerHTML = remplir(el.getAttribute('data-lex-html'), d);
            touches++;
        });

        ['placeholder', 'title', 'aria-label', 'value'].forEach(function (attr) {
            var sel = '[data-lex-' + attr + ']';
            Array.prototype.forEach.call(hote.querySelectorAll(sel), function (el) {
                el.setAttribute(attr, remplir(el.getAttribute('data-lex-' + attr), d));
                touches++;
            });
        });

        return touches;
    }

    // ═══════════════════════════════════════════════════════
    // 6. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        DISCIPLINES: DISCIPLINES,
        REPLI: REPLI,

        pour: pour,
        normaliser: normaliser,

        terme: terme,
        minuscule: minuscule,
        article: article,
        un: un,
        une: une,
        defini: defini,
        lesDeux: lesDeux,

        remplir: remplir,
        appliquer: appliquer
    };

})();
