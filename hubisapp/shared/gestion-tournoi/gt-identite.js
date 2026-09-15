/* ============================================================
   HubISoccer — gt-identite.js
   Systeme Gestion Tournois — QUI EST CETTE PERSONNE
   ------------------------------------------------------------
   LE PROBLEME QU'IL REGLE

   Trois pages designaient la meme personne de trois facons :

     match-report.js  id: j.user_id || j.id      (compte OU fiche)
     match-details.js player_id: m.user_id || null  (compte OU rien)
     mon-equipe.js    player_id: p.user_id || null  (compte OU rien)

   L'arbitre enregistrait donc un but sous l'identifiant de la
   FICHE d'effectif quand le sportif n'a pas de compte ; la page
   des details cherchait cet identifiant parmi les COMPTES, ne
   trouvait rien, et affichait le mot du sport a la place du nom.

   D'ou les captures ou le selecteur ne contient que
   « Footballeur », quatorze fois de suite.

   Et comme la liste etait ensuite triee par nom — un nom
   identique pour tout le monde — l'ordre des options changeait
   d'un affichage a l'autre. On croyait corriger le numero 14,
   on corrigeait le numero 9. C'est exactement ce qui a ete
   observe sur PSG - Inter Milan.

   CE QUE CE MODULE IMPOSE

   1. UNE SEULE CLE, partout : user_id s'il existe, sinon
      l'identifiant de la fiche d'effectif. C'est la convention
      que l'arbitre utilisait deja : les donnees deja
      enregistrees restent donc lisibles, rien n'est a migrer.

   2. UN INDEX A DEUX ENTREES : le nom est retrouvable aussi
      bien par le compte que par la fiche. Une ligne ecrite
      avant ce correctif se raccroche donc quand meme a
      quelqu'un.

   3. UNE ETIQUETTE QUI DISTINGUE TOUJOURS. Jamais deux fois le
      meme texte dans une liste : le numero de maillot d'abord,
      puis le nom, et a defaut la fin de l'identifiant. On ne
      peut plus se tromper de personne.

   4. UN ORDRE STABLE : numero de maillot, puis nom, puis
      identifiant. Deux affichages successifs donnent la meme
      liste, dans le meme ordre.

   Aucun acces reseau ici en dehors de charger() : le reste est
   du calcul pur, testable hors navigateur.
   ============================================================ */
window.GTIdentite = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. LA CLE
    // ═══════════════════════════════════════════════════════

    // La cle d'une fiche d'effectif (une ligne gt_team_players).
    // user_id quand la personne a un compte HubISoccer, sinon
    // l'identifiant de sa fiche.
    function cle(membre) {
        if (!membre) return null;
        if (membre.user_id) return String(membre.user_id);
        if (membre.id) return String(membre.id);
        return null;
    }

    // Les deux entrees sous lesquelles une fiche doit etre
    // retrouvable : son compte ET sa fiche. Une statistique
    // ecrite avant ce correctif peut porter l'une ou l'autre.
    function clesPossibles(membre) {
        if (!membre) return [];
        var l = [];
        if (membre.user_id) l.push(String(membre.user_id));
        if (membre.id) l.push(String(membre.id));
        return l;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LE NOM
    // -------------------------------------------------------
    // On ne nomme ici AUCUNE colonne qu'aucune page n'ecrit :
    // c'est ce qui faisait echouer les requetes entieres.
    // ═══════════════════════════════════════════════════════

    function nom(membre, profil) {
        if (!membre) return null;
        if (profil && profil.full_name) return profil.full_name;
        if (profil && profil.display_name) return profil.display_name;
        if (membre.member_name) return membre.member_name;
        if (membre._profile && membre._profile.full_name) return membre._profile.full_name;
        return null;
    }

    // Le repere de secours quand personne ne porte de nom :
    // les huit derniers caracteres de l'identifiant. Ce n'est
    // pas joli, mais c'est UNIQUE — et c'est tout ce qu'on
    // demande a une etiquette.
    function repere(identifiant) {
        var s = String(identifiant == null ? '' : identifiant);
        return s.length > 8 ? '…' + s.slice(-8) : s;
    }

    // ═══════════════════════════════════════════════════════
    // 3. L'ETIQUETTE
    // -------------------------------------------------------
    // Format : « #14 · DUPONT Jean »
    //          « #9 · sans nom (…3f2a91bc) »
    //          « DUPONT Jean » quand aucun numero n'est saisi
    // ═══════════════════════════════════════════════════════

    function etiquette(membre, options) {
        options = options || {};
        var n = nom(membre, options.profil);
        var numero = membre && membre.jersey_number != null && membre.jersey_number !== ''
                   ? '#' + membre.jersey_number : null;
        var identifiant = options.identifiant || cle(membre);

        if (!n) n = 'sans nom (' + repere(identifiant) + ')';
        return numero ? numero + ' · ' + n : n;
    }

    // L'etiquette d'une cle seule, quand on n'a que ce qui a ete
    // enregistre : on passe par l'index.
    function etiquetteDepuisIndex(index, identifiant) {
        var e = index && index.parCle ? index.parCle[String(identifiant)] : null;
        if (e) return e.etiquette;
        return 'inconnu (' + repere(identifiant) + ')';
    }

    // ═══════════════════════════════════════════════════════
    // 4. L'INDEX
    // -------------------------------------------------------
    // A partir des fiches d'effectif et des profils, on
    // construit une table qui repond a « cette cle, c'est qui ? »
    // quelle que soit la convention avec laquelle elle a ete
    // ecrite.
    // ═══════════════════════════════════════════════════════

    function construire(membres, profilsParCompte) {
        profilsParCompte = profilsParCompte || {};
        var parCle = {};
        var liste = [];

        (membres || []).forEach(function (m) {
            var profil = m.user_id ? profilsParCompte[m.user_id] : null;
            var principale = cle(m);
            if (!principale) return;

            var entree = {
                cle: principale,
                membre: m,
                ligne_id: m.id == null ? null : String(m.id),
                compte_id: m.user_id ? String(m.user_id) : null,
                team_id: m.team_id == null ? null : String(m.team_id),
                nom: nom(m, profil),
                jersey_number: m.jersey_number == null || m.jersey_number === '' ? null : m.jersey_number,
                etiquette: etiquette(m, { profil: profil, identifiant: principale }),
                avatar_url: profil && profil.avatar_url ? profil.avatar_url : (m.member_photo_url || null)
            };

            // Deux entrees pour la meme personne : compte et fiche.
            clesPossibles(m).forEach(function (k) {
                if (!parCle[k]) parCle[k] = entree;
            });
            liste.push(entree);
        });

        return { parCle: parCle, liste: trier(liste) };
    }

    // ═══════════════════════════════════════════════════════
    // 5. L'ORDRE
    // -------------------------------------------------------
    // Numero de maillot d'abord — c'est ce que tout le monde
    // lit sur le terrain. Puis le nom. Puis la cle, pour que
    // deux affichages successifs donnent EXACTEMENT la meme
    // liste : sans ce dernier critere, deux personnes sans nom
    // ni numero s'echangeaient de place d'un rendu a l'autre.
    // ═══════════════════════════════════════════════════════

    function trier(liste) {
        return (liste || []).slice().sort(function (a, b) {
            var na = a.jersey_number == null ? null : Number(a.jersey_number);
            var nb = b.jersey_number == null ? null : Number(b.jersey_number);
            if (na != null && nb != null && na !== nb) return na - nb;
            if (na != null && nb == null) return -1;
            if (na == null && nb != null) return 1;

            var sa = a.nom || '';
            var sb = b.nom || '';
            if (sa && sb && sa !== sb) return sa.localeCompare(sb, 'fr');
            if (sa && !sb) return -1;
            if (!sa && sb) return 1;

            return String(a.cle).localeCompare(String(b.cle));
        });
    }

    // ═══════════════════════════════════════════════════════
    // 6. LE CHARGEMENT
    // -------------------------------------------------------
    // select('*') et non une liste de colonnes : c'est la seule
    // facon de ne pas dependre d'une colonne qui n'existerait
    // pas. Une seule colonne inconnue et PostgREST refuse la
    // requete ENTIERE — c'est ce qui vidait l'effectif.
    //
    // Les profils sont lus par une requete SEPAREE, jamais par
    // une jointure imbriquee : une relation non declaree renvoie
    // un resultat vide sans la moindre erreur, et la page reste
    // muette. Regle de la maison depuis l'incident manage-tournament.
    // ═══════════════════════════════════════════════════════

    async function charger(client, tables, idsEquipes) {
        var vide = { parCle: {}, liste: [], erreur: null };
        if (!client || !idsEquipes || !idsEquipes.length) return vide;

        var reponse = await client
            .from(tables.teamPlayers)
            .select('*')
            .in('team_id', idsEquipes);

        if (reponse.error) {
            vide.erreur = reponse.error;
            return vide;
        }

        var membres = reponse.data || [];
        var comptes = membres
            .filter(function (m) { return m.user_id; })
            .map(function (m) { return m.user_id; });

        var profils = {};
        if (comptes.length && tables.profiles) {
            var rp = await client
                .from(tables.profiles)
                .select('auth_uuid, full_name, display_name, avatar_url')
                .in('auth_uuid', comptes);
            if (!rp.error) {
                (rp.data || []).forEach(function (p) { profils[p.auth_uuid] = p; });
            }
        }

        var index = construire(membres, profils);
        index.erreur = null;
        index.membres = membres;
        return index;
    }

    // Completer l'index avec des cles rencontrees ailleurs
    // (une statistique d'un sportif transfere depuis) : on va
    // chercher le profil, et a defaut on cree une entree lisible
    // plutot que de laisser un trou.
    async function completer(client, tables, index, cles) {
        var manquantes = (cles || [])
            .map(function (c) { return c == null ? null : String(c); })
            .filter(function (c) { return c && !index.parCle[c]; });

        if (!manquantes.length) return index;

        if (tables.profiles) {
            var rp = await client
                .from(tables.profiles)
                .select('auth_uuid, full_name, display_name, avatar_url')
                .in('auth_uuid', manquantes);
            if (!rp.error) {
                (rp.data || []).forEach(function (p) {
                    var e = {
                        cle: String(p.auth_uuid),
                        membre: null,
                        ligne_id: null,
                        compte_id: String(p.auth_uuid),
                        team_id: null,
                        nom: p.full_name || p.display_name || null,
                        jersey_number: null,
                        etiquette: (p.full_name || p.display_name ||
                                    'sans nom (' + repere(p.auth_uuid) + ')'),
                        avatar_url: p.avatar_url || null
                    };
                    index.parCle[e.cle] = e;
                    index.liste.push(e);
                });
            }
        }

        // Celles qui restent : elles existent quand meme dans les
        // donnees, on ne les fait pas disparaitre.
        manquantes.forEach(function (c) {
            if (index.parCle[c]) return;
            var e = {
                cle: c, membre: null, ligne_id: null, compte_id: null, team_id: null,
                nom: null, jersey_number: null,
                etiquette: 'inconnu (' + repere(c) + ')', avatar_url: null
            };
            index.parCle[c] = e;
            index.liste.push(e);
        });

        index.liste = trier(index.liste);
        return index;
    }

    // ═══════════════════════════════════════════════════════
    // 7. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        cle: cle,
        clesPossibles: clesPossibles,
        nom: nom,
        repere: repere,
        etiquette: etiquette,
        etiquetteDepuisIndex: etiquetteDepuisIndex,
        construire: construire,
        trier: trier,
        charger: charger,
        completer: completer
    };
})();
