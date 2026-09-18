/* ============================================================
   HubISoccer — gt-communaute.js
   Systeme Gestion Tournois — CHANTIER 18
   Le pont entre le tournoi et la communaute
   ------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE

   Les deux moities de la plateforme ne se connaissent pas.

   Le gestionnaire ecrit dans gt_matches, gt_standings,
   gt_tournament_awards, et dans la table des notifications —
   qui est PRIVEE : un message pour une personne.

   La communaute ecrit dans supabaseAuthPrive_posts — qui est
   PUBLIQUE : le fil que tout le monde lit.

   Entre les deux, rien. Un tournoi peut se jouer en entier,
   couronner un champion, et le fil n'en saura jamais rien.

   CE QUE FAIT CE FICHIER

   Il traduit un moment de tournoi en publication. Rien d'autre.
   Il ne dessine aucune page, il ne decide pas quand publier :
   c'est l'organisateur qui decide, bouton par bouton.

   TROIS REGLES QUI NE SE NEGOCIENT PAS

   1. RIEN NE PART TOUT SEUL. Publier chez des milliers de gens
      n'est pas une action qu'on declenche par surprise.
      auto_publish_to_feed vaut false partout, et meme quand il
      est vrai, la cloture demande confirmation.

   2. JAMAIS DEUX FOIS LE MEME MOMENT. Avant chaque insertion on
      verifie qu'une publication du meme genre n'existe pas deja
      pour ce tournoi (et pour cette rencontre). Sans ca, deux
      clics = deux fois le meme resultat dans le fil.

   3. AUCUNE PANNE AVALEE. Chaque fonction rend { ok, erreur }.
      Rien ne part dans un console.warn() pendant qu'un message
      vert s'affiche — c'est cette faute-la qui a coute le plus
      cher dans ce module.

   PRINCIPES TECHNIQUES

   - AUCUNE jointure imbriquee. Que des requetes separees.
   - Les publications portent hubisoccer_id, le gestionnaire
     porte auth_uuid : on TRADUIT par une requete separee, comme
     GTNotify le fait deja pour les notifications.
   ============================================================ */
window.GTCommunaute = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. LES TABLES
    // -------------------------------------------------------
    // Elles se passent en argument pour que ce fichier ne
    // depende d'aucune constante definie ailleurs. C'est la
    // lecon du ReferenceError TBL_PROFILES : une constante
    // absente d'un seul fichier bloquait cinq pages.
    // ═══════════════════════════════════════════════════════
    var TABLES_DEFAUT = {
        posts:       'supabaseAuthPrive_posts',
        communities: 'supabaseAuthPrive_communities',
        profiles:    'supabaseAuthPrive_profiles'
    };

    // Les genres de publication. Du texte libre en base, mais
    // une liste fermee ici : c'est elle qui sert a ne pas
    // publier deux fois le meme moment.
    var GENRES = {
        ANNONCE:       'annonce',
        RESULTAT:      'resultat',
        QUALIFICATION: 'qualification',
        PALMARES:      'palmares'
    };

    function tables(t) {
        var o = {};
        Object.keys(TABLES_DEFAUT).forEach(function (k) { o[k] = TABLES_DEFAUT[k]; });
        if (t) Object.keys(t).forEach(function (k) { if (t[k]) o[k] = t[k]; });
        return o;
    }

    // ═══════════════════════════════════════════════════════
    // 2. QUI PUBLIE
    // -------------------------------------------------------
    // Le gestionnaire connait l'organisateur par son auth_uuid.
    // Les publications, elles, portent un hubisoccer_id. Sans
    // cette traduction, l'insertion partirait avec un
    // identifiant que la table des publications ne reconnait
    // pas — et la publication n'apparaitrait chez personne.
    //
    // Et publier exige une communaute : le fil la demande. Si
    // l'organisateur n'en a pas encore, on le DIT, au lieu de
    // laisser une erreur de cle etrangere incomprehensible.
    // ═══════════════════════════════════════════════════════
    async function identifierLAuteur(client, t, authUuid) {
        t = tables(t);

        if (!client)  return { ok: false, raison: 'client', message: 'Connexion à la base absente.' };
        if (!authUuid) return { ok: false, raison: 'session',
                                message: 'Aucune session : impossible de savoir qui publie.' };

        var rp = await client.from(t.profiles)
            .select('auth_uuid, hubisoccer_id, full_name, display_name, avatar_url')
            .eq('auth_uuid', String(authUuid))
            .maybeSingle();

        if (rp.error) {
            return { ok: false, raison: 'profil', message: 'Profil illisible : ' + rp.error.message,
                     erreur: rp.error };
        }
        if (!rp.data || !rp.data.hubisoccer_id) {
            return { ok: false, raison: 'profil',
                     message: 'Ton profil n’a pas encore d’identifiant HubISoccer. ' +
                              'Complète ton profil avant de publier.' };
        }

        var hid = rp.data.hubisoccer_id;

        var rc = await client.from(t.communities)
            .select('id, feed_id, name, avatar_url')
            .eq('hubisoccer_id', hid)
            .maybeSingle();

        if (rc.error) {
            return { ok: false, raison: 'communaute',
                     message: 'Communauté illisible : ' + rc.error.message, erreur: rc.error };
        }
        if (!rc.data) {
            return { ok: false, raison: 'communaute',
                     message: 'Tu n’as pas encore créé ta communauté. ' +
                              'Ouvre le fil une première fois pour la créer, puis reviens ici.' };
        }

        return {
            ok: true,
            hubisoccer_id: hid,
            nom: rp.data.full_name || rp.data.display_name || null,
            avatar_url: rp.data.avatar_url || null,
            community_id: rc.data.id,
            feed_id: rc.data.feed_id || null
        };
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE LIEN PUBLIC
    // -------------------------------------------------------
    // La page publique du chantier 17. C'est elle qu'on met
    // dans la publication : elle s'ouvre sans compte, donc un
    // lecteur du fil qui n'a rien a voir avec le tournoi peut
    // quand meme le suivre.
    // ═══════════════════════════════════════════════════════
    function lienPublic(idTournoi, base) {
        var chemin = base || '/hubisapp/shared/gestion-tournoi/tournoi-public.html';
        return chemin + '?id=' + encodeURIComponent(idTournoi);
    }

    // Depuis une page du gestionnaire, l'adresse absolue se
    // deduit de la page courante : pas de domaine en dur, donc
    // ca marche aussi bien en local qu'en ligne.
    function lienPublicDepuisIci(idTournoi) {
        if (typeof window === 'undefined' || !window.location) return lienPublic(idTournoi);
        var base = window.location.href.split('?')[0].split('#')[0];
        return base.replace(/[^/]*$/, 'tournoi-public.html') + '?id=' + encodeURIComponent(idTournoi);
    }

    // ═══════════════════════════════════════════════════════
    // 4. LA CARTE
    // -------------------------------------------------------
    // event_data existe deja dans la table des publications et
    // le fil sait l'afficher : { title, date, location }. On
    // GARDE ces trois champs — une publication de tournoi reste
    // donc lisible meme si le fil n'a pas encore ete mis a jour
    // — et on ajoute un bloc « hubisoccer » que la nouvelle
    // carte sait lire.
    //
    // C'est volontaire : la publication ne doit jamais dependre
    // d'un fichier deploye plus tard.
    // ═══════════════════════════════════════════════════════
    function construireCarte(infos) {
        infos = infos || {};
        var t = infos.tournoi || {};

        var carte = {
            // Les trois champs que le fil sait deja afficher.
            title:    t.name || 'Tournoi',
            date:     t.start_date || new Date().toISOString(),
            location: t.location || null,

            // Le bloc que la carte de tournoi sait lire.
            hubisoccer: {
                type:          'tournoi',
                genre:         infos.genre || GENRES.ANNONCE,
                tournament_id: t.id != null ? t.id : null,
                match_id:      infos.match_id != null ? infos.match_id : null,
                nom:           t.name || 'Tournoi',
                lieu:          t.location || null,
                debut:         t.start_date || null,
                fin:           t.end_date || null,
                sport:         infos.sport || null,
                logo_url:      t.logo_url || null,
                lien:          infos.lien || null,
                // Ce qui s'affiche en gros sur la carte : un score,
                // un tour franchi, un champion.
                titre:         infos.titre || null,
                detail:        infos.detail || null,
                equipe_a:      infos.equipe_a || null,
                equipe_b:      infos.equipe_b || null,
                score_a:       infos.score_a != null ? infos.score_a : null,
                score_b:       infos.score_b != null ? infos.score_b : null,
                tirs_a:        infos.tirs_a != null ? infos.tirs_a : null,
                tirs_b:        infos.tirs_b != null ? infos.tirs_b : null
            }
        };
        return carte;
    }

    // ═══════════════════════════════════════════════════════
    // 5. LES MOTS
    // -------------------------------------------------------
    // Le texte de la publication. Il porte TOUJOURS le lien en
    // clair : le fil transforme deja une adresse en lien
    // cliquable (formatText, dans utils.js). La publication est
    // donc utile meme sans la carte.
    // ═══════════════════════════════════════════════════════
    function joindreLeLien(texte, lien) {
        if (!lien) return texte;
        return texte + '\n\n' + lien;
    }

    function dateCourte(d) {
        if (!d) return null;
        try {
            return new Date(d).toLocaleDateString('fr-FR',
                { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (e) { return null; }
    }

    function texteAnnonce(tournoi, lien, motCollectif) {
        var t = tournoi || {};
        var collectif = motCollectif || 'équipes';
        var l = [];
        l.push('🏆 ' + (t.name || 'Notre tournoi') + ' est ouvert aux inscriptions.');
        var quand = dateCourte(t.start_date);
        if (quand) l.push('📅 Coup d’envoi le ' + quand + '.');
        if (t.location) l.push('📍 ' + t.location + '.');
        if (t.prize_pool) {
            l.push('💰 Dotation : ' + Number(t.prize_pool).toLocaleString('fr-FR') + ' FCFA.');
        }
        if (t.registration_code) {
            l.push('🔑 Code d’inscription : ' + t.registration_code);
        }
        l.push('Calendrier, classement et résultats suivis en direct — ' +
               'les ' + collectif + ' et le public voient tout, sans compte.');
        return joindreLeLien(l.join('\n'), lien);
    }

    function texteResultat(infos, lien) {
        infos = infos || {};
        var a = infos.equipe_a || 'Équipe A';
        var b = infos.equipe_b || 'Équipe B';
        var sa = infos.score_a == null ? 0 : infos.score_a;
        var sb = infos.score_b == null ? 0 : infos.score_b;

        var l = [];
        l.push('⚽ ' + (infos.tour ? infos.tour + ' — ' : '') +
               a + ' ' + sa + ' - ' + sb + ' ' + b);

        if (infos.tirs_a != null || infos.tirs_b != null) {
            l.push('🥅 Tirs au but : ' + (infos.tirs_a == null ? 0 : infos.tirs_a) +
                   ' - ' + (infos.tirs_b == null ? 0 : infos.tirs_b));
        }
        if (infos.forfait) l.push('🚩 Forfait : ' + infos.forfait + '.');

        // Qui a gagne, dit en toutes lettres. Un score seul
        // n'apprend rien a quelqu'un qui ne suit pas le tournoi.
        var vainqueur = null;
        if (infos.tirs_a != null && infos.tirs_b != null && infos.tirs_a !== infos.tirs_b) {
            vainqueur = infos.tirs_a > infos.tirs_b ? a : b;
        } else if (sa !== sb) {
            vainqueur = sa > sb ? a : b;
        }
        if (vainqueur) l.push('✅ Victoire de ' + vainqueur + '.');
        else if (!infos.forfait) l.push('🤝 Match nul.');

        if (infos.tournoi && infos.tournoi.name) l.push('🏆 ' + infos.tournoi.name);
        return joindreLeLien(l.join('\n'), lien);
    }

    function texteQualification(infos, lien) {
        infos = infos || {};
        var qualifies = (infos.qualifies || []).filter(Boolean);
        var l = [];
        l.push('🎟️ ' + (infos.tour || 'Tour suivant') +
               (infos.tournoi && infos.tournoi.name ? ' — ' + infos.tournoi.name : ''));
        if (qualifies.length === 1) {
            l.push('✅ ' + qualifies[0] + ' est qualifié.');
        } else if (qualifies.length > 1) {
            l.push('✅ Qualifiés : ' + qualifies.join(', ') + '.');
        }
        if (infos.detail) l.push(infos.detail);
        return joindreLeLien(l.join('\n'), lien);
    }

    function textePalmares(infos, lien) {
        infos = infos || {};
        var l = [];
        l.push('🏆 ' + ((infos.tournoi && infos.tournoi.name) || 'Le tournoi') + ' est terminé.');
        if (infos.champion)   l.push('🥇 Vainqueur : ' + infos.champion);
        if (infos.finaliste)  l.push('🥈 Finaliste : ' + infos.finaliste);
        if (infos.troisieme)  l.push('🥉 Troisième : ' + infos.troisieme);

        (infos.distinctions || []).forEach(function (d) {
            if (d && d.categorie && d.gagnant) l.push('⭐ ' + d.categorie + ' : ' + d.gagnant);
        });

        l.push('Merci à tous ceux qui ont joué, sifflé, compté et encouragé.');
        return joindreLeLien(l.join('\n'), lien);
    }

    // ═══════════════════════════════════════════════════════
    // 6. NE PAS PUBLIER DEUX FOIS
    // -------------------------------------------------------
    // Deux clics sur « Publier le résultat » ne doivent pas
    // donner deux fois le meme score dans le fil. On cherche
    // une publication du meme genre, pour le meme tournoi, et
    // pour la meme rencontre quand il y en a une.
    // ═══════════════════════════════════════════════════════
    async function dejaPublie(client, t, criteres) {
        t = tables(t);
        criteres = criteres || {};
        if (criteres.tournament_id == null) return { ok: true, trouve: false };

        var q = client.from(t.posts)
            .select('id, post_kind, match_id, created_at')
            .eq('tournament_id', criteres.tournament_id);

        if (criteres.post_kind) q = q.eq('post_kind', criteres.post_kind);
        if (criteres.match_id != null) q = q.eq('match_id', criteres.match_id);

        var r = await q.limit(1);

        if (r.error) {
            // La colonne n'existe peut-etre pas encore : le SQL du
            // chantier 18 n'est pas passe. On le DIT, au lieu de
            // publier en double sans le savoir.
            return { ok: false, trouve: false, erreur: r.error };
        }
        return { ok: true, trouve: !!(r.data && r.data.length), publication: (r.data || [])[0] || null };
    }

    // ═══════════════════════════════════════════════════════
    // 7. PUBLIER
    // -------------------------------------------------------
    // Une seule porte d'entree. Elle rend toujours un objet
    // explicite : ok, message, erreur. Aucun appelant ne peut
    // afficher « publié » sur un echec.
    // ═══════════════════════════════════════════════════════
    async function publier(client, t, demande) {
        t = tables(t);
        demande = demande || {};

        var tournoi = demande.tournoi || {};
        var genre   = demande.genre || GENRES.ANNONCE;

        if (tournoi.id == null) {
            return { ok: false, message: 'Aucun tournoi indiqué : rien n’a été publié.' };
        }
        if (!demande.texte || !String(demande.texte).trim()) {
            return { ok: false, message: 'Le texte de la publication est vide : rien n’a été publié.' };
        }

        // 1. Qui publie.
        var auteur = demande.auteur;
        if (!auteur) {
            auteur = await identifierLAuteur(client, t, demande.auth_uuid);
            if (!auteur.ok) return { ok: false, message: auteur.message, raison: auteur.raison,
                                     erreur: auteur.erreur || null };
        }

        // 2. Pas deux fois le meme moment.
        if (!demande.autoriserDoublon) {
            var deja = await dejaPublie(client, t, {
                tournament_id: tournoi.id,
                post_kind: genre,
                match_id: demande.match_id != null ? demande.match_id : null
            });

            if (!deja.ok) {
                return { ok: false, erreur: deja.erreur,
                         message: 'Impossible de vérifier si ce moment a déjà été publié : ' +
                                  deja.erreur.message + ' — rien n’a été publié. ' +
                                  'Le script SQL du chantier 18 a-t-il bien été passé ?' };
            }
            if (deja.trouve) {
                return { ok: false, deja: true,
                         message: 'Ce moment a déjà été publié dans le fil. ' +
                                  'Rien n’a été publié une seconde fois.' };
            }
        }

        // 3. La carte.
        var carte = demande.carte || construireCarte({
            tournoi:  tournoi,
            genre:    genre,
            match_id: demande.match_id,
            lien:     demande.lien,
            sport:    demande.sport,
            titre:    demande.titre,
            detail:   demande.detail,
            equipe_a: demande.equipe_a,
            equipe_b: demande.equipe_b,
            score_a:  demande.score_a,
            score_b:  demande.score_b,
            tirs_a:   demande.tirs_a,
            tirs_b:   demande.tirs_b
        });

        // 4. L'insertion.
        //
        // Les compteurs sont poses a zero comme le fait le
        // composeur du fil : une publication qui arrive avec des
        // compteurs NULL s'affiche « null j'aime ».
        var ligne = {
            author_hubisoccer_id: auteur.hubisoccer_id,
            community_id:         auteur.community_id || null,
            content:              String(demande.texte).trim(),
            media_url:            null,
            media_type:           null,
            poll_data:            null,
            event_data:           carte,
            is_pinned:            false,
            is_scheduled:         false,
            scheduled_at:         null,
            likes_count:          0,
            dislikes_count:       0,
            comments_count:       0,
            shares_count:         0,
            reposts_count:        0,
            views_count:          0,
            tournament_id:        tournoi.id,
            match_id:             demande.match_id != null ? demande.match_id : null,
            post_kind:            genre
        };

        var r = await client.from(t.posts).insert(ligne).select().single();

        if (r.error) {
            return {
                ok: false, erreur: r.error,
                message: 'La publication a échoué : ' + r.error.message +
                         (/tournament_id|match_id|post_kind/.test(r.error.message || '')
                            ? ' — le script SQL du chantier 18 n’a pas encore été passé.'
                            : '')
            };
        }

        return {
            ok: true, publication: r.data, auteur: auteur,
            message: 'Publié dans le fil de la communauté.'
        };
    }

    // ═══════════════════════════════════════════════════════
    // 8. LIRE CE QUI SE DIT SUR UN TOURNOI
    // -------------------------------------------------------
    // Pour la page publique. Requetes SEPAREES : la jointure
    // imbriquee author:profiles!author_hubisoccer_id(...) exige
    // une cle etrangere declaree, et quand elle manque
    // PostgREST refuse la requete ENTIERE.
    // ═══════════════════════════════════════════════════════
    async function lireLesPublications(client, t, idTournoi, limite) {
        t = tables(t);
        if (idTournoi == null) return { ok: true, publications: [] };

        var r = await client.from(t.posts)
            .select('*')
            .eq('tournament_id', idTournoi)
            .order('created_at', { ascending: false })
            .limit(limite || 30);

        if (r.error) {
            return { ok: false, publications: [], erreur: r.error };
        }

        var publications = (r.data || []).filter(function (p) { return !p.is_scheduled; });

        // Les auteurs, en UNE requete.
        var ids = [];
        publications.forEach(function (p) {
            if (p.author_hubisoccer_id && ids.indexOf(p.author_hubisoccer_id) === -1) {
                ids.push(p.author_hubisoccer_id);
            }
        });

        if (ids.length) {
            var ra = await client.from(t.profiles)
                .select('hubisoccer_id, full_name, display_name, avatar_url, role_code')
                .in('hubisoccer_id', ids);
            if (!ra.error) {
                var parId = {};
                (ra.data || []).forEach(function (p) { parId[p.hubisoccer_id] = p; });
                publications.forEach(function (p) {
                    p.auteur = parId[p.author_hubisoccer_id] || null;
                });
            }
            // Si la lecture des auteurs echoue, on garde les
            // publications : mieux vaut un nom manquant qu'un
            // onglet vide.
        }

        return { ok: true, publications: publications };
    }

    // ═══════════════════════════════════════════════════════
    // 9. L'APERCU, POUR L'ORGANISATEUR
    // -------------------------------------------------------
    // La carte telle qu'elle apparaitra dans le fil, dessinee
    // ICI et non par utils.js de la communaute.
    //
    // C'est delibere. utils.js definit toast(), escapeHtml(),
    // formatText()... sur window. Le charger dans une page du
    // gestionnaire ECRASERAIT les fonctions du meme nom qui y
    // existent deja. On prefere redessiner vingt lignes plutot
    // que risquer ca sur manage-tournament.html.
    // ═══════════════════════════════════════════════════════
    function echapper(x) {
        if (x === null || x === undefined) return '';
        return String(x).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function apercuHtml(carte) {
        if (!carte) return '';
        var h = carte.hubisoccer;
        if (!h) return '';

        var MOTS = {
            annonce:       'Tournoi ouvert',
            resultat:      'Résultat',
            qualification: 'Qualification',
            palmares:      'Palmarès'
        };

        var score = '';
        if (h.equipe_a || h.equipe_b) {
            var sa = (h.score_a === null || h.score_a === undefined) ? '' : h.score_a;
            var sb = (h.score_b === null || h.score_b === undefined) ? '' : h.score_b;
            var chiffres = (sa === '' && sb === '') ? 'vs' : (sa + ' - ' + sb);
            score = '<div class="apercu-score">' +
                    '<span>' + echapper(h.equipe_a || 'Équipe A') + '</span>' +
                    '<strong class="tabular">' + echapper(chiffres) + '</strong>' +
                    '<span>' + echapper(h.equipe_b || 'Équipe B') + '</span></div>';
            if (h.tirs_a !== null && h.tirs_a !== undefined) {
                score += '<div class="apercu-tirs">tirs au but ' + echapper(h.tirs_a) + ' - ' +
                         echapper(h.tirs_b === null || h.tirs_b === undefined ? 0 : h.tirs_b) + '</div>';
            }
        }

        var reperes = [];
        if (h.lieu)  reperes.push(echapper(h.lieu));
        if (h.sport) reperes.push(echapper(h.sport));

        return '<div class="apercu-carte">' +
               '<div class="apercu-bandeau">' + echapper(MOTS[h.genre] || MOTS.annonce) + '</div>' +
               '<div class="apercu-corps">' +
               '<div class="apercu-nom">' + echapper(h.nom || 'Tournoi') + '</div>' +
               (h.titre ? '<div class="apercu-titre">' + echapper(h.titre) + '</div>' : '') +
               score +
               (h.detail ? '<div class="apercu-detail">' + echapper(h.detail) + '</div>' : '') +
               (reperes.length ? '<div class="apercu-reperes">' + reperes.join(' · ') + '</div>' : '') +
               '</div>' +
               (h.lien ? '<div class="apercu-bouton">Suivre le tournoi →</div>' : '') +
               '</div>';
    }

    // ═══════════════════════════════════════════════════════
    // 9. RESUMER, EN FRANCAIS
    // ═══════════════════════════════════════════════════════
    function resumer(resultat) {
        if (!resultat) return 'Rien ne s’est passé.';
        if (resultat.ok) return resultat.message || 'Publié.';
        return resultat.message || 'La publication a échoué.';
    }

    // ═══════════════════════════════════════════════════════
    // 10. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        TABLES_DEFAUT: TABLES_DEFAUT,
        GENRES: GENRES,

        identifierLAuteur: identifierLAuteur,
        lienPublic: lienPublic,
        lienPublicDepuisIci: lienPublicDepuisIci,

        construireCarte: construireCarte,
        texteAnnonce: texteAnnonce,
        texteResultat: texteResultat,
        texteQualification: texteQualification,
        textePalmares: textePalmares,

        apercuHtml: apercuHtml,
        dejaPublie: dejaPublie,
        publier: publier,
        lireLesPublications: lireLesPublications,
        resumer: resumer
    };
})();
