/* ============================================================
   HubISoccer — gt-picker.js
   Système Gestion Tournois — Sélecteur de contexte partagé
   ------------------------------------------------------------
   POURQUOI CE FICHIER

   Huit pages du module exigent un paramètre d'URL (?id=,
   ?match_id=, ?tournament_id=) alors que le menu latéral y mène
   SANS paramètre. Résultat : chaque visite depuis le menu
   affichait un toast rouge, et deux pages redirigeaient de force
   vers l'accueil.

   Ce module remplace l'erreur par un sélecteur : la page reste
   utilisable depuis le menu, on choisit son tournoi ou son match,
   et la page se recharge avec le bon paramètre.

   COMMENT L'UTILISER

       GTPicker.monter({
           conteneur : 'gtPicker',        // id du <div> hôte
           type      : 'tournoi',         // tournoi | match | equipe | inscription
           parametre : 'id',              // nom du paramètre d'URL à poser
           portee    : 'mesTournois',     // voir PORTEES ci-dessous
           titre     : 'Choisissez un tournoi à gérer',
           aide      : 'Vous ne voyez que les tournois que vous avez créés.'
       });

   PORTEES DISPONIBLES
       mesTournois     tournois dont created_by = utilisateur courant
       tousTournois    tournois publiés ou terminés
       mesInscriptions tournois où l'utilisateur est inscrit
       tousMatchs      matchs d'un tournoi (sélection en deux temps)
       matchsEnCours   matchs en direct ou programmés
       equipes         équipes d'un tournoi (sélection en deux temps)

   DÉPENDANCES
       window.__SUPABASE_CLIENT   posé par le script de chaque page
       gt-picker.css              styles, tokens existants uniquement

   Aucune variable globale en const/let : tout passe par window,
   pour ne jamais entrer en collision avec le script de la page.
   ============================================================ */
'use strict';

window.GTPicker = (function () {

    // ═══════════════════════════════════════════════════════════
    // 1. TABLES
    // ═══════════════════════════════════════════════════════════
    var TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
    var TBL_MATCHES     = 'supabaseAuthPrive_gt_matches';
    var TBL_TEAMS       = 'supabaseAuthPrive_gt_teams';
    var TBL_PARTICIPANTS = 'supabaseAuthPrive_gt_participants';

    // ═══════════════════════════════════════════════════════════
    // 2. UTILITAIRES
    // ═══════════════════════════════════════════════════════════
    function client() {
        return window.__SUPABASE_CLIENT || null;
    }

    function echapper(valeur) {
        if (valeur === null || valeur === undefined) return '';
        return String(valeur).replace(/[&<>"]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
        });
    }

    function dateCourte(valeur) {
        if (!valeur) return '';
        var d = new Date(valeur);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function dateHeure(valeur) {
        if (!valeur) return 'Date à définir';
        var d = new Date(valeur);
        if (isNaN(d.getTime())) return 'Date à définir';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' à ' +
               d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    async function utilisateurCourant() {
        var sb = client();
        if (!sb) return null;
        var reponse = await sb.auth.getSession();
        var session = reponse && reponse.data ? reponse.data.session : null;
        return session ? session.user : null;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. CHARGEMENT DES TOURNOIS SELON LA PORTÉE
    // ═══════════════════════════════════════════════════════════
    async function chargerTournois(portee) {
        var sb = client();
        if (!sb) return { liste: [], erreur: 'Client Supabase indisponible.' };

        var utilisateur = await utilisateurCourant();

        if (portee === 'mesTournois') {
            if (!utilisateur) return { liste: [], erreur: 'Vous devez être connecté.' };
            var mes = await sb.from(TBL_TOURNAMENTS)
                .select('id, name, start_date, end_date, status')
                .eq('created_by', utilisateur.id)
                .order('start_date', { ascending: false });
            if (mes.error) return { liste: [], erreur: mes.error.message };
            return { liste: mes.data || [], erreur: null };
        }

        if (portee === 'mesInscriptions') {
            if (!utilisateur) return { liste: [], erreur: 'Vous devez être connecté.' };
            var inscriptions = await sb.from(TBL_PARTICIPANTS)
                .select('tournament_id, status')
                .eq('user_id', utilisateur.id);
            if (inscriptions.error) return { liste: [], erreur: inscriptions.error.message };

            var identifiants = (inscriptions.data || []).map(function (i) { return i.tournament_id; });
            if (!identifiants.length) return { liste: [], erreur: null };

            var tournois = await sb.from(TBL_TOURNAMENTS)
                .select('id, name, start_date, end_date, status, participation_price')
                .in('id', identifiants)
                .order('start_date', { ascending: false });
            if (tournois.error) return { liste: [], erreur: tournois.error.message };
            return { liste: tournois.data || [], erreur: null };
        }

        // tousTournois par défaut
        var publics = await sb.from(TBL_TOURNAMENTS)
            .select('id, name, start_date, end_date, status')
            .in('status', ['published', 'completed'])
            .order('start_date', { ascending: false });
        if (publics.error) return { liste: [], erreur: publics.error.message };
        return { liste: publics.data || [], erreur: null };
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CHARGEMENT DES MATCHS D'UN TOURNOI
    // ═══════════════════════════════════════════════════════════
    async function chargerMatchs(identifiantTournoi, portee) {
        var sb = client();
        if (!sb || !identifiantTournoi) return { liste: [], erreur: null };

        var requete = sb.from(TBL_MATCHES)
            .select('id, round, team_a_id, team_b_id, match_date, status, group_name')
            .eq('tournament_id', identifiantTournoi);

        if (portee === 'matchsEnCours') {
            requete = requete.in('status', ['live', 'scheduled']);
        }

        var matchs = await requete.order('match_date', { ascending: true });
        if (matchs.error) return { liste: [], erreur: matchs.error.message };

        var donnees = matchs.data || [];
        if (!donnees.length) return { liste: [], erreur: null };

        // Noms d'équipes en une seule requête séparée (jamais de
        // jointure imbriquée : elle dépendrait d'une clé étrangère
        // dont on ne veut pas dépendre ici)
        var identifiantsEquipes = [];
        donnees.forEach(function (m) {
            if (m.team_a_id && identifiantsEquipes.indexOf(m.team_a_id) === -1) identifiantsEquipes.push(m.team_a_id);
            if (m.team_b_id && identifiantsEquipes.indexOf(m.team_b_id) === -1) identifiantsEquipes.push(m.team_b_id);
        });

        var noms = {};
        if (identifiantsEquipes.length) {
            var equipes = await sb.from(TBL_TEAMS).select('id, name').in('id', identifiantsEquipes);
            (equipes.data || []).forEach(function (e) { noms[e.id] = e.name; });
        }

        donnees.forEach(function (m) {
            m.__nomA = noms[m.team_a_id] || 'Équipe A';
            m.__nomB = noms[m.team_b_id] || 'Équipe B';
        });

        return { liste: donnees, erreur: null };
    }

    // ═══════════════════════════════════════════════════════════
    // 5. CHARGEMENT DES ÉQUIPES D'UN TOURNOI
    // ═══════════════════════════════════════════════════════════
    async function chargerEquipes(identifiantTournoi) {
        var sb = client();
        if (!sb || !identifiantTournoi) return { liste: [], erreur: null };
        var equipes = await sb.from(TBL_TEAMS)
            .select('id, name, group_name, age_category')
            .eq('tournament_id', identifiantTournoi)
            .order('name');
        if (equipes.error) return { liste: [], erreur: equipes.error.message };
        return { liste: equipes.data || [], erreur: null };
    }

    // ═══════════════════════════════════════════════════════════
    // 6. CONSTRUCTION DE L'INTERFACE
    // ═══════════════════════════════════════════════════════════
    function construireSquelette(hote, options) {
        var deuxNiveaux = (options.type === 'match' || options.type === 'equipe');

        hote.className = 'gt-picker';
        hote.innerHTML =
            '<div class="gt-picker-tete">' +
                '<i class="fas ' + echapper(options.icone || 'fa-hand-pointer') + '"></i>' +
                '<div>' +
                    '<h2>' + echapper(options.titre || 'Choisissez un élément') + '</h2>' +
                    (options.aide ? '<p>' + echapper(options.aide) + '</p>' : '') +
                '</div>' +
            '</div>' +
            '<div class="gt-picker-corps">' +
                '<div class="gt-picker-champ">' +
                    '<label for="gtPickerTournoi">Tournoi</label>' +
                    '<select id="gtPickerTournoi"><option value="">Chargement…</option></select>' +
                '</div>' +
                (deuxNiveaux
                    ? '<div class="gt-picker-champ">' +
                          '<label for="gtPickerSecondaire">' + (options.type === 'match' ? 'Match' : 'Équipe') + '</label>' +
                          '<select id="gtPickerSecondaire" disabled><option value="">Choisissez d\'abord un tournoi</option></select>' +
                      '</div>'
                    : '') +
            '</div>' +
            '<p class="gt-picker-etat" id="gtPickerEtat"></p>';

        hote.style.display = 'block';
        return {
            tournoi: hote.querySelector('#gtPickerTournoi'),
            secondaire: hote.querySelector('#gtPickerSecondaire'),
            etat: hote.querySelector('#gtPickerEtat')
        };
    }

    function remplirSelect(select, liste, construireLibelle, texteVide) {
        select.innerHTML = '';
        var vide = document.createElement('option');
        vide.value = '';
        vide.textContent = liste.length ? '— Sélectionnez —' : texteVide;
        select.appendChild(vide);
        liste.forEach(function (element) {
            var option = document.createElement('option');
            option.value = element.id;
            option.textContent = construireLibelle(element);
            select.appendChild(option);
        });
        select.disabled = !liste.length;
    }

    function libelleTournoi(t) {
        var periode = dateCourte(t.start_date);
        var etat = t.status === 'completed' ? ' · terminé'
                 : t.status === 'draft' ? ' · brouillon'
                 : '';
        return t.name + (periode ? ' — ' + periode : '') + etat;
    }

    function libelleMatch(m) {
        var tour = m.round ? m.round + ' · ' : (m.group_name ? m.group_name + ' · ' : '');
        var etat = m.status === 'live' ? ' · EN DIRECT'
                 : m.status === 'completed' ? ' · terminé'
                 : '';
        return tour + m.__nomA + ' – ' + m.__nomB + ' (' + dateHeure(m.match_date) + ')' + etat;
    }

    function libelleEquipe(e) {
        var complements = [];
        if (e.group_name) complements.push(e.group_name);
        if (e.age_category) complements.push(e.age_category);
        return e.name + (complements.length ? ' — ' + complements.join(' · ') : '');
    }

    // ═══════════════════════════════════════════════════════════
    // 7. NAVIGATION
    // ═══════════════════════════════════════════════════════════
    function ouvrirAvec(parametre, valeur, parametresSupplementaires) {
        var url = new URL(window.location.href);
        url.searchParams.set(parametre, valeur);
        if (parametresSupplementaires) {
            Object.keys(parametresSupplementaires).forEach(function (cle) {
                url.searchParams.set(cle, parametresSupplementaires[cle]);
            });
        }
        window.location.href = url.toString();
    }

    // ═══════════════════════════════════════════════════════════
    // 8. POINT D'ENTRÉE
    // ═══════════════════════════════════════════════════════════
    // Masque tout le contenu de la page SAUF le sélecteur, sans
    // toucher au HTML : on éteint les frères directs du bloc hôte.
    // Le bouton "Retour" est conservé, il reste utile.
    function masquerFreres(hote) {
        var parent = hote.parentNode;
        if (!parent) return;
        Array.prototype.forEach.call(parent.children, function (enfant) {
            if (enfant === hote) return;
            if (enfant.classList && enfant.classList.contains('btn-back')) return;
            if (enfant.id === 'backBtn') return;
            enfant.setAttribute('data-gt-masque', '1');
            enfant.style.display = 'none';
        });
    }

    async function monter(options) {
        options = options || {};
        var hote = document.getElementById(options.conteneur || 'gtPicker');
        if (!hote) return;

        if (options.masquerFreres !== false) masquerFreres(hote);

        var champs = construireSquelette(hote, options);
        var deuxNiveaux = (options.type === 'match' || options.type === 'equipe');

        // --- Niveau 1 : les tournois
        var resultat = await chargerTournois(options.portee || 'tousTournois');

        if (resultat.erreur) {
            champs.etat.className = 'gt-picker-etat erreur';
            champs.etat.textContent = 'Impossible de charger la liste : ' + resultat.erreur;
            champs.tournoi.innerHTML = '<option value="">Indisponible</option>';
            champs.tournoi.disabled = true;
            return;
        }

        if (!resultat.liste.length) {
            champs.etat.className = 'gt-picker-etat';
            champs.etat.innerHTML = echapper(options.messageVide || 'Aucun tournoi disponible pour le moment.') +
                                    ' <a href="acceuil.html">Retour à l\'accueil</a>';
        }

        remplirSelect(champs.tournoi, resultat.liste, libelleTournoi, 'Aucun tournoi disponible');

        // --- Cas simple : un seul niveau, on ouvre directement
        if (!deuxNiveaux) {
            champs.tournoi.addEventListener('change', function () {
                if (this.value) ouvrirAvec(options.parametre || 'id', this.value);
            });
            return;
        }

        // --- Cas à deux niveaux : matchs ou équipes du tournoi choisi
        champs.tournoi.addEventListener('change', async function () {
            var identifiantTournoi = this.value;
            champs.secondaire.innerHTML = '<option value="">Chargement…</option>';
            champs.secondaire.disabled = true;
            champs.etat.textContent = '';

            if (!identifiantTournoi) {
                champs.secondaire.innerHTML = '<option value="">Choisissez d\'abord un tournoi</option>';
                return;
            }

            var secondaire = (options.type === 'match')
                ? await chargerMatchs(identifiantTournoi, options.portee)
                : await chargerEquipes(identifiantTournoi);

            if (secondaire.erreur) {
                champs.etat.className = 'gt-picker-etat erreur';
                champs.etat.textContent = 'Impossible de charger la liste : ' + secondaire.erreur;
                champs.secondaire.innerHTML = '<option value="">Indisponible</option>';
                return;
            }

            if (!secondaire.liste.length) {
                champs.etat.className = 'gt-picker-etat';
                champs.etat.textContent = (options.type === 'match')
                    ? 'Aucun match dans ce tournoi pour le moment.'
                    : 'Aucune équipe dans ce tournoi pour le moment.';
            }

            remplirSelect(
                champs.secondaire,
                secondaire.liste,
                (options.type === 'match') ? libelleMatch : libelleEquipe,
                (options.type === 'match') ? 'Aucun match' : 'Aucune équipe'
            );
        });

        champs.secondaire.addEventListener('change', function () {
            if (!this.value) return;
            var supplementaires = {};
            if (options.transmettreTournoi) supplementaires.tournament_id = champs.tournoi.value;
            ouvrirAvec(options.parametre || 'id', this.value, supplementaires);
        });
    }

    return { monter: monter };

})();
