/* ============================================================
   HubISoccer — hub-jointure.js
   Communauté — LOT A
   Le filet sous les jointures imbriquées
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Le module de la communauté lit ses données avec des jointures
   imbriquées PostgREST :

       .select('*, author:supabaseAuthPrive_profiles!author_hubisoccer_id(...)')

   Il y en a 31. Elles marchent — tant que la clé étrangère
   correspondante est déclarée dans la base.

   Quand elle ne l'est pas, ou qu'il y en a DEUX entre les mêmes
   tables, PostgREST ne renvoie pas une donnée incomplète : il
   refuse la requête ENTIÈRE.

       PGRST200  could not find a relationship
       PGRST201  more than one relationship was found

   La section devient alors blanche d'un coup — les commentaires,
   les abonnés, les stories, le profil, la recherche. Sans un
   mot d'explication.

   Ce n'est pas une crainte théorique : le fil principal porte
   DÉJÀ un repli de ce genre, écrit après que le problème s'est
   produit. Les 30 autres lectures n'en avaient pas.

   CE QUE FAIT CE FICHIER

   Il généralise ce repli. On donne deux façons de lire la même
   chose — avec jointure, et sans — plus la description de ce
   qu'il faut rattacher. Si la première échoue POUR UNE RAISON DE
   JOINTURE, la seconde prend le relais et rattache en
   JavaScript. Le résultat est identique, au champ près.

   CE QU'IL NE FAIT PAS

   Il n'avale aucune autre erreur. Un droit refusé, une table
   absente, une colonne inconnue : ça remonte tel quel. On ne
   remplace une panne que par ce qu'on sait réparer.
   ============================================================ */
window.HubJointure = (function () {
    'use strict';

    // PostgREST refuse par paquets d'URL trop longues : on
    // interroge par tranches. 200 identifiants tiennent
    // largement dans une URL, même longs.
    var PAQUET = 200;

    // ═══════════════════════════════════════════════════════
    // 1. EST-CE UN PROBLÈME DE JOINTURE ?
    // -------------------------------------------------------
    // On ne déclenche le repli que pour CES cas. Sinon on
    // masquerait un vrai problème derrière une seconde requête
    // qui échouerait pareil.
    // ═══════════════════════════════════════════════════════
    function estUnProblemeDeJointure(erreur) {
        if (!erreur) return false;
        var code = String(erreur.code || '');
        if (code === 'PGRST200' || code === 'PGRST201') return true;

        // Certaines versions renvoient 42703 en citant la
        // jointure elle-même dans le nom de colonne :
        //   column posts.author:supabaseAuthPrive_profiles... does not exist
        var msg = String(erreur.message || '');
        if (code === '42703' && /[A-Za-z_]+:[A-Za-z_]/.test(msg)) return true;

        // Et le message en toutes lettres, quel que soit le code.
        return /could not find a relationship|more than one relationship/i.test(msg);
    }

    // ═══════════════════════════════════════════════════════
    // 2. RATTACHER
    // -------------------------------------------------------
    // lignes  les enregistrements lus sans jointure
    // liens   [{ alias, table, cleLocale, cleDistante, colonnes }]
    //
    //   alias       le nom sous lequel la page attend l'objet
    //   table       où aller chercher
    //   cleLocale   la colonne qui porte la référence
    //   cleDistante la colonne qui l'identifie de l'autre côté
    //   colonnes    ce qu'on rapatrie
    //
    // Une ligne dont la référence ne résout pas reçoit null pour
    // cet alias — exactement ce que renvoie PostgREST. La page
    // n'a donc rien à changer.
    // ═══════════════════════════════════════════════════════
    async function rattacher(client, lignes, liens) {
        // single() et maybeSingle() rendent UN OBJET, pas un
        // tableau. Sans ce repli, la ligne repartait sans son
        // rattachement — et la page affichait un auteur vide en
        // croyant que tout allait bien.
        var seul = false;
        if (lignes && !Array.isArray(lignes) && typeof lignes === 'object') {
            lignes = [lignes];
            seul = true;
        }

        function rendre(valeur, erreur, info) {
            var d = erreur ? null : (seul ? (valeur && valeur[0] ? valeur[0] : null) : valeur);
            var o = { data: d, error: erreur || null };
            if (info) o.lien = info;
            return o;
        }

        if (!lignes || !lignes.length) return rendre(lignes || [], null);
        if (!liens || !liens.length)   return rendre(lignes, null);

        for (var i = 0; i < liens.length; i++) {
            var lien = liens[i];
            var cleLocale   = lien.cleLocale;
            var cleDistante = lien.cleDistante || 'id';
            var colonnes    = lien.colonnes || '*';   // toujours '*' : voir profil()

            // Les références à résoudre, dédoublonnées.
            var vus = {};
            var refs = [];
            lignes.forEach(function (l) {
                var v = l ? l[cleLocale] : null;
                if (v === null || v === undefined || v === '') return;
                var k = String(v);
                if (vus[k]) return;
                vus[k] = true;
                refs.push(v);
            });

            var index = {};
            for (var d = 0; d < refs.length; d += PAQUET) {
                var tranche = refs.slice(d, d + PAQUET);
                var r = await client.from(lien.table)
                    .select(colonnes)
                    .in(cleDistante, tranche);

                if (r.error) {
                    // On ne fait pas semblant : si le rattachement
                    // échoue, l'appelant doit pouvoir le dire.
                    return rendre(null, r.error, lien.alias);
                }
                (r.data || []).forEach(function (x) {
                    index[String(x[cleDistante])] = x;
                });
            }

            lignes.forEach(function (l) {
                if (!l) return;
                var v = l[cleLocale];
                l[lien.alias] = (v === null || v === undefined)
                    ? null
                    : (index[String(v)] || null);
            });
        }

        return rendre(lignes, null);
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE FILET
    // -------------------------------------------------------
    //   requete              la lecture AVEC jointure
    //   requeteSansJointure  la MÊME lecture, sans
    //   liens                de quoi rattacher
    //
    // Les deux requêtes sont des fonctions, pas des promesses :
    // on ne veut pas lancer la seconde si la première suffit.
    //
    // Le retour porte « viaFilet: true » quand le repli a servi.
    // La page peut s'en servir pour le signaler — ou l'ignorer.
    // ═══════════════════════════════════════════════════════
    async function avecFilet(client, options) {
        options = options || {};
        if (typeof options.requete !== 'function') {
            return { data: null, error: { message: 'avecFilet : requête manquante' } };
        }

        var premier = await options.requete();

        if (!premier.error) {
            return { data: premier.data, error: null, count: premier.count, viaFilet: false };
        }
        if (!estUnProblemeDeJointure(premier.error)) {
            // Droit refusé, table absente, réseau : ça remonte
            // tel quel. On ne répare que ce qu'on sait réparer.
            return { data: null, error: premier.error, viaFilet: false };
        }

        if (typeof options.requeteSansJointure !== 'function') {
            return { data: null, error: premier.error, viaFilet: false };
        }

        console.warn('[HubISoccer] jointure indisponible (' +
                     (premier.error.code || '?') + ') — lecture sans jointure.');

        var second = await options.requeteSansJointure();
        if (second.error) {
            return { data: null, error: second.error, viaFilet: true };
        }

        var rattache = await rattacher(client, second.data || [], options.liens);
        if (rattache.error) {
            return { data: null, error: rattache.error, viaFilet: true };
        }

        return { data: rattache.data, error: null, count: second.count, viaFilet: true };
    }

    // ═══════════════════════════════════════════════════════
    // 4. RACCOURCIS
    // -------------------------------------------------------
    // La très grande majorité des jointures de ce module
    // rattachent un PROFIL. On évite de recopier les mêmes
    // quatre lignes trente fois.
    // ═══════════════════════════════════════════════════════
    var PROFILS = 'supabaseAuthPrive_profiles';

    // Le rattachement lit TOUJOURS avec select('*').
    //
    // Ma première version nommait les colonnes. Une seule d'entre
    // elles absente de la base — « feed_id », par exemple — et
    // PostgREST refusait la requête entière (42703) : le filet
    // tombait pour la raison même contre laquelle il protège.
    //
    // select('*') ne peut pas échouer sur une colonne inconnue.
    // Les listes passées en argument sont donc ignorées ; on les
    // garde dans la signature parce qu'elles DOCUMENTENT, à
    // l'endroit de l'appel, ce que la page attend vraiment.
    function profil(alias, cleLocale, colonnesDocumentaires) {
        return {
            alias: alias,
            table: PROFILS,
            cleLocale: cleLocale,
            cleDistante: 'hubisoccer_id',
            colonnes: '*',
            attendu: colonnesDocumentaires || null
        };
    }

    function vers(alias, table, cleLocale, cleDistante, colonnesDocumentaires) {
        return {
            alias: alias, table: table,
            cleLocale: cleLocale,
            cleDistante: cleDistante || 'id',
            colonnes: '*',
            attendu: colonnesDocumentaires || null
        };
    }

    return {
        PAQUET: PAQUET,
        estUnProblemeDeJointure: estUnProblemeDeJointure,
        rattacher: rattacher,
        avecFilet: avecFilet,
        profil: profil,
        vers: vers
    };
})();
