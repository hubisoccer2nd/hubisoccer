/* ============================================================
   HubISoccer — gt-notify.js
   Systeme Gestion Tournois — PREVENIR LES GENS
   ------------------------------------------------------------
   CE QUE J'AI TROUVE EN CHERCHANT

   Je m'attendais a devoir construire un systeme de notifications.
   Il en existe deja un, et il tourne : la table
   supabaseAuthPrive_notifications, la page
   shared/community/notifications.html avec ses filtres, son
   marquage « lu », sa suppression et son abonnement Realtime.

   VINGT-SIX fichiers de la plateforme s'en servent deja : les
   revenus du footballeur, du coach, de l'academie, de l'agent,
   du staff medical, les dons du parrain, les verifications, le
   feed, les stories, le live.

   Le gestionnaire de tournoi est le SEUL module qui n'envoie
   jamais rien. Une equipe inscrite ne sait pas qu'elle joue
   demain. Un arbitre designe ne l'apprend pas. Une equipe
   qualifiee au tour suivant ne le sait que si quelqu'un
   l'appelle.

   Ce fichier ne cree donc rien de neuf : il branche le
   gestionnaire de tournoi sur ce qui existe.

   LE CONTRAT DE LA TABLE

       recipient_hubisoccer_id   le destinataire
       type                      code court
       title                     le titre affiche en gras
       message                   le texte
       data                      { link: '...' }
       read                      false a la creation

   ATTENTION — DEUX IDENTITES DIFFERENTES

   Les notifications visent un hubisoccer_id. Le gestionnaire de
   tournoi, lui, travaille avec des auth_uuid (team_players.user_id).
   Ce ne sont PAS les memes identifiants. Tout envoi passe donc par
   une traduction, faite ici, par une requete SEPAREE — jamais par
   une jointure imbriquee : une relation non declaree renverrait un
   resultat vide sans la moindre erreur, et personne ne serait
   prevenu sans qu'on le sache.

   LE LIEN

   notifications.js fait « window.location.href = link », depuis
   shared/community/. Un lien vers le gestionnaire de tournoi doit
   donc commencer par ../gestion-tournoi/. lien() s'en charge.

   CE QUE CE FICHIER NE FAIT PAS

   Il n'envoie ni SMS ni WhatsApp automatiquement. C'est
   impossible depuis une page statique : il faudrait une cle
   d'API, et toute cle posee dans du JavaScript envoye au
   navigateur est lisible par n'importe qui — elle serait volee
   et facturee dans la journee. Cela demande un serveur
   (fonction Edge Supabase + un fournisseur).

   En attendant, lienWhatsApp() prepare le message et ouvre
   WhatsApp avec le texte deja ecrit : l'organisateur appuie sur
   « envoyer ». Pas d'API, pas de cle, pas un franc, et ca marche
   aujourd'hui.
   ============================================================ */
window.GTNotify = (function () {
    'use strict';

    var TABLE = 'supabaseAuthPrive_notifications';
    var PAQUET = 100;   // PostgREST n'aime pas les charges trop grosses

    // ═══════════════════════════════════════════════════════
    // 1. TRADUIRE LES IDENTITES
    // -------------------------------------------------------
    // auth_uuid (ce que connait le gestionnaire de tournoi)
    //   -> hubisoccer_id (ce que visent les notifications)
    // ═══════════════════════════════════════════════════════

    async function comptesVersHubisoccer(client, tableProfiles, comptes) {
        var sortie = {};
        var liste = (comptes || [])
            .map(function (c) { return c == null ? null : String(c); })
            .filter(function (c, i, t) { return c && t.indexOf(c) === i; });

        if (!liste.length) return sortie;

        for (var i = 0; i < liste.length; i += PAQUET) {
            var tranche = liste.slice(i, i + PAQUET);
            var r = await client.from(tableProfiles)
                .select('auth_uuid, hubisoccer_id, full_name, phone')
                .in('auth_uuid', tranche);
            if (r.error) return { _erreur: r.error };
            (r.data || []).forEach(function (p) {
                if (p.hubisoccer_id) {
                    sortie[p.auth_uuid] = {
                        hubisoccer_id: p.hubisoccer_id,
                        nom: p.full_name || null,
                        phone: p.phone || null
                    };
                }
            });
        }
        return sortie;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LE LIEN
    // -------------------------------------------------------
    // Depuis shared/community/notifications.html, il faut
    // remonter d'un cran puis redescendre.
    // ═══════════════════════════════════════════════════════

    function lien(page, parametres) {
        var base = '../gestion-tournoi/' + page;
        var q = [];
        Object.keys(parametres || {}).forEach(function (c) {
            var v = parametres[c];
            if (v == null || v === '') return;
            q.push(encodeURIComponent(c) + '=' + encodeURIComponent(v));
        });
        return q.length ? base + '?' + q.join('&') : base;
    }

    // ═══════════════════════════════════════════════════════
    // 3. ENVOYER
    // -------------------------------------------------------
    // Rend toujours un objet, ne leve jamais : une notification
    // qui echoue ne doit pas empecher le match d'etre enregistre.
    // Mais elle ne se tait pas non plus — l'appelant recoit
    // l'erreur et la montre. C'est la lecon du chantier 12 :
    // un echec avale dans console.warn() est un echec invisible.
    // ═══════════════════════════════════════════════════════

    async function envoyer(client, tables, destinataires, contenu) {
        var vide = { envoyees: 0, destinataires: 0, erreur: null, ignoree: false };
        if (!client || !contenu) return vide;

        var cibles = (destinataires || [])
            .map(function (d) { return d == null ? null : String(d); })
            .filter(function (d, i, t) { return d && t.indexOf(d) === i; });

        // On ne se previent pas soi-meme.
        if (contenu.sauf) {
            var sauf = String(contenu.sauf);
            cibles = cibles.filter(function (d) { return d !== sauf; });
        }

        vide.destinataires = cibles.length;
        if (!cibles.length) { vide.ignoree = true; return vide; }

        var lignes = cibles.map(function (h) {
            return {
                recipient_hubisoccer_id: h,
                type: contenu.type || 'tournoi',
                title: contenu.titre || 'Tournoi',
                message: contenu.message || '',
                data: contenu.lien ? { link: contenu.lien } : {},
                read: false
            };
        });

        var envoyees = 0;
        for (var i = 0; i < lignes.length; i += PAQUET) {
            var r = await client.from(tables.notifications || TABLE)
                .insert(lignes.slice(i, i + PAQUET));
            if (r.error) return { envoyees: envoyees, destinataires: cibles.length, erreur: r.error, ignoree: false };
            envoyees += Math.min(PAQUET, lignes.length - i);
        }

        return { envoyees: envoyees, destinataires: cibles.length, erreur: null, ignoree: false };
    }

    // Raccourci : on part de comptes (auth_uuid), la traduction
    // est faite au passage.
    async function versLesComptes(client, tables, comptes, contenu) {
        var index = await comptesVersHubisoccer(client, tables.profiles, comptes);
        if (index._erreur) {
            return { envoyees: 0, destinataires: 0, erreur: index._erreur, ignoree: false };
        }
        var cibles = Object.keys(index).map(function (c) { return index[c].hubisoccer_id; });

        // « sauf » arrive en auth_uuid : on le traduit aussi.
        var contenu2 = contenu;
        if (contenu.sauf && index[String(contenu.sauf)]) {
            contenu2 = Object.assign({}, contenu, { sauf: index[String(contenu.sauf)].hubisoccer_id });
        }

        var envoi = await envoyer(client, tables, cibles, contenu2);
        envoi.sansCompte = (comptes || []).length - cibles.length;
        return envoi;
    }

    // ═══════════════════════════════════════════════════════
    // 4. QUI PREVENIR DANS UNE EQUIPE
    // -------------------------------------------------------
    // Les membres qui ont un compte HubISoccer, plus celui qui a
    // cree l'equipe. Les membres sans compte ne peuvent pas
    // recevoir de notification : c'est a ca que sert WhatsApp,
    // plus bas.
    // ═══════════════════════════════════════════════════════

    async function comptesDesEquipes(client, tables, idsEquipes) {
        var ids = (idsEquipes || []).filter(Boolean);
        if (!ids.length) return { comptes: [], sansCompte: 0, erreur: null };

        var r = await client.from(tables.teamPlayers).select('*').in('team_id', ids);
        if (r.error) return { comptes: [], sansCompte: 0, erreur: r.error };

        var membres = r.data || [];
        var comptes = [];
        var sansCompte = 0;
        membres.forEach(function (m) {
            if (m.user_id) { if (comptes.indexOf(m.user_id) === -1) comptes.push(m.user_id); }
            else sansCompte++;
        });

        // Le createur de l'equipe, meme s'il n'est pas dans l'effectif.
        if (tables.teams) {
            var re = await client.from(tables.teams).select('id, creator_id, name').in('id', ids);
            if (!re.error) {
                (re.data || []).forEach(function (e) {
                    if (e.creator_id && comptes.indexOf(e.creator_id) === -1) comptes.push(e.creator_id);
                });
            }
        }

        return { comptes: comptes, sansCompte: sansCompte, erreur: null };
    }

    // ═══════════════════════════════════════════════════════
    // 5. WHATSAPP, SANS SERVEUR ET SANS CLE
    // -------------------------------------------------------
    // wa.me est un simple lien. On prepare le message, WhatsApp
    // s'ouvre avec le texte deja ecrit, la personne appuie sur
    // « envoyer ». Ce n'est pas automatique — c'est assiste.
    //
    // Sur un tournoi de quartier, c'est ce qui atteint vraiment
    // les gens : personne ne releve ses courriels au bord d'un
    // terrain.
    // ═══════════════════════════════════════════════════════

    // On ne devine pas le plan de numerotation d'un pays : on
    // nettoie, et on ajoute l'indicatif SEULEMENT si le numero
    // n'en porte pas deja un. L'organisateur voit le numero et
    // peut le corriger avant d'envoyer.
    function normaliserNumero(numero, indicatifParDefaut) {
        var brut = String(numero == null ? '' : numero).trim();
        if (!brut) return null;

        var international = brut.charAt(0) === '+' || brut.slice(0, 2) === '00';
        var chiffres = brut.replace(/\D/g, '');
        if (brut.slice(0, 2) === '00') chiffres = chiffres.replace(/^00/, '');
        if (!chiffres) return null;

        if (international) return chiffres;

        var ind = String(indicatifParDefaut || '').replace(/\D/g, '');
        if (!ind) return chiffres;
        if (chiffres.indexOf(ind) === 0) return chiffres;   // deja prefixe
        return ind + chiffres.replace(/^0+/, '');
    }

    function lienWhatsApp(numero, texte, indicatifParDefaut) {
        var n = normaliserNumero(numero, indicatifParDefaut);
        if (!n) return null;
        return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texte || '');
    }

    // Un lien SMS marche partout, sans application particuliere.
    function lienSms(numero, texte, indicatifParDefaut) {
        var n = normaliserNumero(numero, indicatifParDefaut);
        if (!n) return null;
        return 'sms:+' + n + '?body=' + encodeURIComponent(texte || '');
    }

    // ═══════════════════════════════════════════════════════
    // 6. LA CLOCHE
    // -------------------------------------------------------
    // Elle etait purement decorative sur les 26 pages du
    // gestionnaire de tournoi : le badge affichait « 0 » en dur.
    // ═══════════════════════════════════════════════════════

    async function brancherLaCloche(client, tables, hubisoccerId, options) {
        options = options || {};
        var badge = document.getElementById(options.badge || 'notifBadge');
        var icone = document.getElementById(options.icone || 'notifIcon');

        if (icone && !icone.dataset.branchee) {
            icone.dataset.branchee = '1';
            icone.style.cursor = 'pointer';
            icone.addEventListener('click', function () {
                window.location.href = '../community/notifications.html';
            });
        }

        if (!badge || !hubisoccerId) return 0;

        var r = await client.from(tables.notifications || TABLE)
            .select('id')
            .eq('recipient_hubisoccer_id', hubisoccerId)
            .eq('read', false)
            .limit(100);

        if (r.error) { badge.style.display = 'none'; return 0; }

        var n = (r.data || []).length;
        badge.textContent = n > 99 ? '99+' : String(n);
        badge.style.display = n > 0 ? 'block' : 'none';
        return n;
    }

    // ═══════════════════════════════════════════════════════
    // 7. UN MOT SUR CE QUI S'EST PASSE
    // ═══════════════════════════════════════════════════════

    function resumer(envoi, quoi) {
        if (!envoi) return '';
        if (envoi.erreur) {
            return 'Personne n\'a été prévenu' + (quoi ? ' (' + quoi + ')' : '') + ' : ' +
                   (envoi.erreur.message || 'erreur inconnue') +
                   (envoi.erreur.code ? ' (' + envoi.erreur.code + ')' : '') + '.';
        }
        if (!envoi.envoyees) return '';
        var t = envoi.envoyees + ' personne(s) prévenue(s).';
        if (envoi.sansCompte) {
            t += ' ' + envoi.sansCompte + ' membre(s) sans compte HubISoccer n\'ont rien reçu — ' +
                 'préviens-les par WhatsApp.';
        }
        return t;
    }

    // ═══════════════════════════════════════════════════════
    // 8. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        TABLE: TABLE,
        comptesVersHubisoccer: comptesVersHubisoccer,
        comptesDesEquipes: comptesDesEquipes,
        envoyer: envoyer,
        versLesComptes: versLesComptes,
        lien: lien,
        normaliserNumero: normaliserNumero,
        lienWhatsApp: lienWhatsApp,
        lienSms: lienSms,
        brancherLaCloche: brancherLaCloche,
        resumer: resumer
    };
})();
