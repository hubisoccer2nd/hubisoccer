/* ============================================================
   HubISoccer — gt-paiement.js
   Systeme Gestion Tournois — moyens de paiement et commission
   ------------------------------------------------------------
   CE QUE FAIT CE FICHIER

   Il decrit les moyens de paiement et il partage l'argent.
   Aucun acces au DOM, aucun appel reseau, aucune dependance.
   On peut lui donner un montant et un accord, et verifier au
   centime pres ce qui revient a qui, sans navigateur ni base.

   POURQUOI IL EXISTE

   payment.js ecrivait dans gt_payment_requests — une table qui
   n'existait nulle part. Chaque paiement partait en erreur.
   Et la page ne proposait que deux moyens, tous les deux
   internes : le wallet et la carte HubIS. Aucun moyen externe,
   aucune preuve, aucune validation, aucune commission.

   LES DEUX NIVEAUX

   Le catalogue global (supabaseAuthPrive_payment_methods) dit
   ce que la plateforme accepte ; c'est l'administration qui le
   tient. Le present fichier decrit, pour chaque moyen de ce
   catalogue, CE QUE L'ORGANISATEUR DOIT RENSEIGNER pour s'en
   servir sur son tournoi. Un organisateur ne peut pas inventer
   un moyen que l'administration n'a pas ouvert ; il peut
   seulement activer ceux qui existent et y mettre ses propres
   coordonnees.

   L'ARGENT

   Le taux ne se saisit jamais dans une page de paiement. Il
   vient d'un accord enregistre cote administration, et chaque
   demande fige le taux applique au moment de sa validation.
   Six mois plus tard, si l'accord change, l'historique reste
   juste.
   ============================================================ */

window.GTPaiement = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // 1. OUTILS
    // ═══════════════════════════════════════════════════════

    function nombre(v) {
        var n = Number(v);
        return isFinite(n) ? n : 0;
    }

    // L'argent s'arrondit au centime, jamais au hasard. On passe
    // par les entiers pour eviter les surprises du binaire :
    // 0.1 + 0.2 ne vaut pas 0.3 en virgule flottante.
    function centimes(v) {
        return Math.round(nombre(v) * 100);
    }

    function depuisCentimes(c) {
        return Math.round(c) / 100;
    }

    function arrondirMontant(v) {
        return depuisCentimes(centimes(v));
    }

    function borner(v, mini, maxi) {
        if (v < mini) return mini;
        if (v > maxi) return maxi;
        return v;
    }

    // ═══════════════════════════════════════════════════════
    // 2. LES DEVISES
    // -------------------------------------------------------
    // Le franc CFA ne se compte pas en centimes : afficher
    // « 15 000,00 F » au lieu de « 15 000 F » ferait faux.
    // ═══════════════════════════════════════════════════════

    var DEVISES = {
        XOF: { symbole: 'F CFA', decimales: 0, nom: 'Franc CFA (UEMOA)' },
        XAF: { symbole: 'F CFA', decimales: 0, nom: 'Franc CFA (CEMAC)' },
        EUR: { symbole: '€',     decimales: 2, nom: 'Euro' },
        USD: { symbole: '$',     decimales: 2, nom: 'Dollar américain' },
        GHS: { symbole: 'GH₵',   decimales: 2, nom: 'Cedi ghanéen' },
        NGN: { symbole: '₦',     decimales: 2, nom: 'Naira nigérian' },
        MAD: { symbole: 'DH',    decimales: 2, nom: 'Dirham marocain' },
        GBP: { symbole: '£',     decimales: 2, nom: 'Livre sterling' }
    };

    function devise(code) {
        return DEVISES[String(code || 'XOF').toUpperCase()] || DEVISES.XOF;
    }

    function formaterMontant(montant, codeDevise) {
        var d = devise(codeDevise);
        var v = arrondirMontant(montant);
        var texte = v.toFixed(d.decimales);
        // Separateur de milliers : une espace INSECABLE (U+00A0),
        // pas une espace fine (U+202F). La fine est plus juste en
        // typographie francaise, mais beaucoup de polices ne la
        // possedent pas et l'affichent en carre vide au milieu du
        // montant. L'insecable est presente partout et empeche
        // quand meme « 15 000 » de se couper en fin de ligne.
        var parties = texte.split('.');
        parties[0] = parties[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parties.join(',') + ' ' + d.symbole;
    }

    // ═══════════════════════════════════════════════════════
    // 3. LE CATALOGUE DES MOYENS
    // -------------------------------------------------------
    // canal : 'interne' — l'argent circule dans HubISoccer
    //         'externe' — l'argent passe par un service tiers
    //
    // champs : ce que L'ORGANISATEUR renseigne pour activer le
    //          moyen sur son tournoi.
    // champsPayeur : ce que LE PARTICIPANT declare en payant.
    //
    // Ajouter un moyen, c'est une entree ici. Rien d'autre :
    // la configuration cote organisateur et le formulaire cote
    // payeur se construisent tous les deux a partir de cette
    // description.
    // ═══════════════════════════════════════════════════════

    var MOYENS = [
        // ─────────── Interne ───────────
        {
            cle: 'wallet',
            nom: 'Compte HubIS',
            canal: 'interne',
            icone: 'fa-wallet',
            description: "Le solde du compte HubISoccer du participant est débité, et celui de l'organisateur crédité.",
            preuveRequise: false,
            immediat: true,
            champs: [],
            champsPayeur: [
                { cle: 'wallet_ref', label: 'Référence de votre compte HubIS', type: 'texte', obligatoire: true,
                  aide: "C'est votre wallet_ref, visible dans « Mes revenus »." }
            ]
        },
        {
            cle: 'card',
            nom: 'Carte HubIS',
            canal: 'interne',
            icone: 'fa-credit-card',
            description: 'La carte virtuelle HubISoccer du participant.',
            preuveRequise: false,
            immediat: true,
            champs: [],
            champsPayeur: [
                { cle: 'payer_full_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'card_number', label: 'Numéro de carte', type: 'carte', obligatoire: true,
                  aide: 'Seuls les 4 derniers chiffres sont conservés.', jamaisEnregistre: true },
                { cle: 'card_expiry', label: 'Expiration (MM/AA)', type: 'expiration', obligatoire: true },
                { cle: 'card_cvv', label: 'Cryptogramme', type: 'cvv', obligatoire: true,
                  aide: "Il n'est jamais transmis ni enregistré.", jamaisEnregistre: true }
            ]
        },
        {
            cle: 'compte_bancaire_profil',
            nom: 'Compte bancaire du profil',
            canal: 'interne',
            icone: 'fa-building-columns',
            description: "Le compte bancaire déjà enregistré dans « Mes revenus » du participant.",
            preuveRequise: true,
            immediat: false,
            champs: [],
            champsPayeur: [
                { cle: 'payer_full_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'payer_reference', label: 'Référence du virement', type: 'texte', obligatoire: true }
            ]
        },

        // ─────────── Externe ───────────
        {
            cle: 'mtn_momo',
            nom: 'MTN MoMo',
            canal: 'externe',
            icone: 'fa-mobile-screen',
            description: 'Mobile money MTN.',
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'account_number', label: 'Numéro MoMo', type: 'telephone', obligatoire: true },
                { cle: 'account_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_phone', label: 'Votre numéro MoMo', type: 'telephone', obligatoire: true },
                { cle: 'payer_reference', label: 'Numéro de transaction', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'moov_money',
            nom: 'Moov Money',
            canal: 'externe',
            icone: 'fa-mobile-screen',
            description: 'Mobile money Moov.',
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'account_number', label: 'Numéro Moov Money', type: 'telephone', obligatoire: true },
                { cle: 'account_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_phone', label: 'Votre numéro Moov', type: 'telephone', obligatoire: true },
                { cle: 'payer_reference', label: 'Numéro de transaction', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'celtiis_cash',
            nom: 'Celtiis Cash',
            canal: 'externe',
            icone: 'fa-mobile-screen',
            description: 'Mobile money Celtiis.',
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'account_number', label: 'Numéro Celtiis Cash', type: 'telephone', obligatoire: true },
                { cle: 'account_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_phone', label: 'Votre numéro Celtiis', type: 'telephone', obligatoire: true },
                { cle: 'payer_reference', label: 'Numéro de transaction', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'wave',
            nom: 'Wave',
            canal: 'externe',
            icone: 'fa-water',
            description: 'Paiement Wave, par numéro ou par lien.',
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'account_number', label: 'Numéro Wave', type: 'telephone' },
                { cle: 'payment_url', label: 'Lien de paiement Wave', type: 'lien' },
                { cle: 'account_name', label: 'Nom du titulaire', type: 'texte', obligatoire: true },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            auMoinsUn: ['account_number', 'payment_url'],
            champsPayeur: [
                { cle: 'payer_phone', label: 'Votre numéro Wave', type: 'telephone' },
                { cle: 'payer_reference', label: 'Numéro de transaction', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'virement_bancaire',
            nom: 'Virement bancaire',
            canal: 'externe',
            icone: 'fa-building-columns',
            description: 'Virement sur le compte bancaire de l\'organisateur.',
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'bank_name', label: 'Banque', type: 'texte', obligatoire: true },
                { cle: 'account_name', label: 'Titulaire du compte', type: 'texte', obligatoire: true },
                { cle: 'account_number', label: 'Numéro de compte', type: 'texte', obligatoire: true },
                { cle: 'iban', label: 'IBAN', type: 'texte' },
                { cle: 'swift', label: 'Code SWIFT / BIC', type: 'texte' },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_full_name', label: 'Nom du donneur d\'ordre', type: 'texte', obligatoire: true },
                { cle: 'payer_reference', label: 'Référence du virement', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'lien_paiement',
            nom: 'Lien de paiement',
            canal: 'externe',
            icone: 'fa-link',
            description: "Terminal ou lien de paiement en ligne de l'organisateur.",
            preuveRequise: true,
            immediat: false,
            champs: [
                { cle: 'payment_url', label: 'URL du terminal', type: 'lien', obligatoire: true },
                { cle: 'account_name', label: 'Libellé affiché', type: 'texte' },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_reference', label: 'Référence de la transaction', type: 'texte', obligatoire: true }
            ]
        },
        {
            cle: 'especes',
            nom: 'Espèces sur place',
            canal: 'externe',
            icone: 'fa-money-bill-wave',
            description: 'Paiement en main propre, à un endroit et à des heures données.',
            preuveRequise: false,
            immediat: false,
            champs: [
                { cle: 'location', label: 'Lieu de paiement', type: 'texte', obligatoire: true },
                { cle: 'opening_hours', label: 'Horaires', type: 'texte', obligatoire: true },
                { cle: 'contact_person', label: 'Personne à contacter', type: 'texte', obligatoire: true },
                { cle: 'contact_phone', label: 'Téléphone', type: 'telephone', obligatoire: true },
                { cle: 'instructions', label: 'Consignes au participant', type: 'longtexte' }
            ],
            champsPayeur: [
                { cle: 'payer_full_name', label: 'Votre nom', type: 'texte', obligatoire: true },
                { cle: 'note', label: 'Précision', type: 'longtexte' }
            ]
        }
    ];

    function moyenParCle(cle) {
        for (var i = 0; i < MOYENS.length; i++) {
            if (MOYENS[i].cle === cle) return MOYENS[i];
        }
        return null;
    }

    function moyensParCanal(canal) {
        return MOYENS.filter(function (m) { return m.canal === canal; });
    }

    // Les cles de colonne que la configuration d'un tournoi peut
    // porter — utilisees pour n'envoyer a PostgREST que ce que la
    // table connait.
    function clesDeConfiguration() {
        var cles = [];
        MOYENS.forEach(function (m) {
            (m.champs || []).forEach(function (c) {
                if (cles.indexOf(c.cle) === -1) cles.push(c.cle);
            });
        });
        return cles;
    }

    // ═══════════════════════════════════════════════════════
    // 4. VERIFIER UNE CONFIGURATION D'ORGANISATEUR
    // -------------------------------------------------------
    // Un moyen active sans ses coordonnees est pire qu'un moyen
    // absent : le participant croit pouvoir payer et se retrouve
    // devant un vide.
    // ═══════════════════════════════════════════════════════

    function verifierConfiguration(cleMoyen, valeurs) {
        var moyen = moyenParCle(cleMoyen);
        var erreurs = [];
        valeurs = valeurs || {};

        if (!moyen) {
            return ['Moyen de paiement inconnu : ' + cleMoyen + '.'];
        }

        (moyen.champs || []).forEach(function (champ) {
            if (!champ.obligatoire) return;
            var v = valeurs[champ.cle];
            if (v === undefined || v === null || String(v).trim() === '') {
                erreurs.push(champ.label + ' est obligatoire pour « ' + moyen.nom + ' ».');
            }
        });

        // Certains moyens acceptent l'un OU l'autre : Wave marche
        // avec un numero ou avec un lien, mais il en faut un.
        if (moyen.auMoinsUn && moyen.auMoinsUn.length) {
            var auMoinsUnRempli = moyen.auMoinsUn.some(function (cle) {
                var v = valeurs[cle];
                return v !== undefined && v !== null && String(v).trim() !== '';
            });
            if (!auMoinsUnRempli) {
                var libelles = moyen.auMoinsUn.map(function (cle) {
                    var c = (moyen.champs || []).filter(function (x) { return x.cle === cle; })[0];
                    return c ? c.label : cle;
                });
                erreurs.push('Renseignez au moins l\'un de : ' + libelles.join(' ou ') + '.');
            }
        }

        // Un lien de paiement doit ressembler a un lien.
        (moyen.champs || []).forEach(function (champ) {
            if (champ.type !== 'lien') return;
            var v = valeurs[champ.cle];
            if (!v || String(v).trim() === '') return;
            if (!/^https?:\/\/.+/i.test(String(v).trim())) {
                erreurs.push(champ.label + ' doit commencer par http:// ou https://.');
            }
        });

        return erreurs;
    }

    // ═══════════════════════════════════════════════════════
    // 5. VERIFIER CE QUE DECLARE LE PAYEUR
    // ═══════════════════════════════════════════════════════

    function verifierPaiement(cleMoyen, valeurs) {
        var moyen = moyenParCle(cleMoyen);
        var erreurs = [];
        valeurs = valeurs || {};

        if (!moyen) return ['Moyen de paiement inconnu : ' + cleMoyen + '.'];

        (moyen.champsPayeur || []).forEach(function (champ) {
            if (!champ.obligatoire) return;
            var v = valeurs[champ.cle];
            if (v === undefined || v === null || String(v).trim() === '') {
                erreurs.push(champ.label + ' est obligatoire.');
            }
        });

        // La carte : on ne verifie que la forme, et on ne garde
        // rien de plus que les 4 derniers chiffres.
        if (cleMoyen === 'card') {
            var numero = String(valeurs.card_number || '').replace(/\s+/g, '');
            if (numero && !/^\d{12,19}$/.test(numero)) {
                erreurs.push('Le numéro de carte doit comporter entre 12 et 19 chiffres.');
            }
            var exp = String(valeurs.card_expiry || '').trim();
            if (exp && !/^\d{2}\s*\/\s*\d{2,4}$/.test(exp)) {
                erreurs.push("L'expiration doit s'écrire MM/AA.");
            }
            var cvv = String(valeurs.card_cvv || '').trim();
            if (cvv && !/^\d{3,4}$/.test(cvv)) {
                erreurs.push('Le cryptogramme comporte 3 ou 4 chiffres.');
            }
        }

        return erreurs;
    }

    // Ce qui part reellement en base pour un paiement par carte.
    // Le numero complet et le cryptogramme ne franchissent JAMAIS
    // cette fonction : c'est le comportement deja en place dans
    // payment.js, et il est preserve tel quel.
    function assainirCarte(valeurs) {
        var v = valeurs || {};
        var numero = String(v.card_number || '').replace(/\s+/g, '');
        return {
            payer_full_name: v.payer_full_name || null,
            card_last4: numero ? numero.slice(-4) : null,
            card_expiry: v.card_expiry || null
        };
    }

    // ═══════════════════════════════════════════════════════
    // 6. LE PARTAGE DE L'ARGENT
    // -------------------------------------------------------
    // Tes points 17 et 18.
    //
    //   accord.agreement_type = 'hubisoccer'
    //     Le tournoi est organise par HubISoccer : la totalite
    //     lui revient, l'organisateur ne touche rien parce qu'il
    //     n'y a pas d'organisateur externe.
    //
    //   accord.agreement_type = 'externe'
    //     commission_rate % du montant revient a HubISoccer,
    //     organizer_fee est preleve en plus, apres chaque
    //     transaction. Le reste va au wallet de l'organisateur.
    //
    // L'ORDRE DES OPERATIONS COMPTE
    //   commission d'abord (pourcentage du brut), frais ensuite
    //   (montant fixe). Le net ne descend jamais sous zero : si
    //   les frais depassent ce qui reste, on le dit au lieu de
    //   creer une dette silencieuse.
    // ═══════════════════════════════════════════════════════

    function calculerPartage(montant, accord) {
        var a = accord || {};
        var brutC = centimes(montant);

        if (brutC <= 0) {
            return {
                brut: 0, commission: 0, frais: 0, net: 0,
                taux: 0, type: a.agreement_type || 'externe',
                alerte: null, detail: []
            };
        }

        var type = a.agreement_type === 'hubisoccer' ? 'hubisoccer' : 'externe';

        if (type === 'hubisoccer') {
            return {
                brut: depuisCentimes(brutC),
                commission: depuisCentimes(brutC),
                frais: 0,
                net: 0,
                taux: 100,
                type: 'hubisoccer',
                alerte: null,
                detail: [
                    { libelle: 'Montant réglé', valeur: depuisCentimes(brutC) },
                    { libelle: 'Revient à HubISoccer', valeur: depuisCentimes(brutC) }
                ]
            };
        }

        var taux = borner(nombre(a.commission_rate), 0, 100);
        var commissionC = Math.round(brutC * taux / 100);
        var fraisC = Math.max(0, centimes(a.organizer_fee));

        var alerte = null;
        if (commissionC + fraisC > brutC) {
            // On ne fabrique pas une dette : on plafonne et on
            // le signale, pour que l'administration corrige
            // l'accord plutot que de decouvrir le trou plus tard.
            alerte = 'La commission et les frais dépassent le montant réglé. ' +
                     'Le net est ramené à zéro — l\'accord doit être revu.';
            fraisC = Math.max(0, brutC - commissionC);
            if (commissionC > brutC) { commissionC = brutC; fraisC = 0; }
        }

        var netC = brutC - commissionC - fraisC;

        return {
            brut: depuisCentimes(brutC),
            commission: depuisCentimes(commissionC),
            frais: depuisCentimes(fraisC),
            net: depuisCentimes(netC),
            taux: taux,
            type: 'externe',
            alerte: alerte,
            detail: [
                { libelle: 'Montant réglé', valeur: depuisCentimes(brutC) },
                { libelle: 'Commission HubISoccer (' + taux + ' %)', valeur: -depuisCentimes(commissionC) },
                { libelle: 'Frais d\'organisation', valeur: -depuisCentimes(fraisC) },
                { libelle: 'Net pour l\'organisateur', valeur: depuisCentimes(netC) }
            ]
        };
    }

    // L'accord qui s'applique reellement a un tournoi : le plus
    // precis d'abord (celui attache au tournoi), puis l'accord
    // general de l'organisateur, puis rien.
    function accordApplicable(accords, idTournoi, idOrganisateur) {
        var liste = (accords || []).filter(function (a) {
            return a && a.is_active !== false;
        });

        var duTournoi = liste.filter(function (a) {
            return a.tournament_id != null && String(a.tournament_id) === String(idTournoi);
        });
        if (duTournoi.length) return duTournoi[0];

        var general = liste.filter(function (a) {
            return a.tournament_id == null &&
                   (idOrganisateur == null || String(a.organizer_id) === String(idOrganisateur));
        });
        if (general.length) return general[0];

        return null;
    }

    // ═══════════════════════════════════════════════════════
    // 7. LES ETATS D'UNE DEMANDE
    // -------------------------------------------------------
    // Aucune couleur ecrite ici : seulement un nom de classe,
    // que la feuille de style traduit avec les tokens de la page.
    // ═══════════════════════════════════════════════════════

    var ETATS = {
        pending:   { libelle: 'En attente',      classe: 'etat-attente',  icone: 'fa-hourglass-half',
                     aide: "La demande est déposée. L'organisateur ne l'a pas encore examinée." },
        proof:     { libelle: 'Preuve déposée',  classe: 'etat-preuve',   icone: 'fa-paperclip',
                     aide: "Votre preuve est arrivée. L'organisateur va la vérifier." },
        validated: { libelle: 'Validé',          classe: 'etat-valide',   icone: 'fa-circle-check',
                     aide: 'Le paiement est accepté et votre participation est réglée.' },
        rejected:  { libelle: 'Refusé',          classe: 'etat-refuse',   icone: 'fa-circle-xmark',
                     aide: "L'organisateur a refusé la demande — le motif est indiqué." },
        cancelled: { libelle: 'Annulé',          classe: 'etat-annule',   icone: 'fa-ban',
                     aide: 'La demande a été annulée.' }
    };

    function etat(code) {
        return ETATS[code] || { libelle: code || 'Inconnu', classe: 'etat-attente',
                                icone: 'fa-circle-question', aide: '' };
    }

    // Ce qu'on a le droit de faire depuis un etat donne.
    function transitionsPossibles(code, estOrganisateur) {
        if (code === 'validated') return [];                       // terminal
        if (code === 'cancelled') return [];                       // terminal
        if (estOrganisateur) {
            if (code === 'rejected') return ['validated'];          // on peut se raviser
            return ['validated', 'rejected'];
        }
        if (code === 'rejected') return [];
        return ['cancelled'];
    }

    // ═══════════════════════════════════════════════════════
    // 8. LA REFERENCE D'UNE TRANSACTION
    // -------------------------------------------------------
    // Lisible a l'oeil, reconnaissable dans hubis_transactions,
    // et suffisamment unique pour ne pas se marcher dessus.
    // ═══════════════════════════════════════════════════════

    function reference(prefixe, idTournoi) {
        var d = new Date();
        var deuxChiffres = function (n) { return (n < 10 ? '0' : '') + n; };
        var horodatage = String(d.getFullYear()).slice(2) +
                         deuxChiffres(d.getMonth() + 1) +
                         deuxChiffres(d.getDate()) +
                         deuxChiffres(d.getHours()) +
                         deuxChiffres(d.getMinutes()) +
                         deuxChiffres(d.getSeconds());
        var hasard = Math.floor(Math.random() * 9000 + 1000);
        return [prefixe || 'GT', idTournoi == null ? '0' : idTournoi, horodatage, hasard].join('-');
    }

    // ═══════════════════════════════════════════════════════
    // 9. LA LIGNE PRETE POUR LA BASE
    // -------------------------------------------------------
    // Ne renvoie que des cles qui existent reellement dans
    // gt_payment_requests apres le script SQL du chantier 07.
    // Une cle inconnue ferait echouer tout l'insert PostgREST.
    // ═══════════════════════════════════════════════════════

    var COLONNES_DEMANDE = [
        'tournament_id', 'user_id', 'team_id', 'registration_id',
        'amount', 'currency', 'motif',
        'payment_method', 'payment_channel', 'method_id', 'tournament_method_id',
        'payer_full_name', 'payer_phone', 'payer_reference',
        'card_last4', 'card_expiry', 'wallet_ref', 'note',
        'proof_url', 'proof_uploaded_at',
        'status', 'reviewed_by', 'reviewed_at', 'review_comment',
        'commission_rate', 'commission_amount', 'organizer_fee', 'net_amount',
        'agreement_id', 'settled', 'settled_at', 'wallet_transaction_ref',
        'created_at', 'updated_at'
    ];

    function pourLaBase(demande) {
        var d = demande || {};
        var sortie = {};
        COLONNES_DEMANDE.forEach(function (cle) {
            if (d[cle] === undefined) return;
            sortie[cle] = d[cle];
        });
        // Ceinture et bretelles : meme si l'appelant les a
        // glissees dans l'objet, elles ne partent pas.
        delete sortie.card_number;
        delete sortie.card_cvv;
        return sortie;
    }

    // ═══════════════════════════════════════════════════════
    // 10. LE RECAPITULATIF D'UN TOURNOI
    // -------------------------------------------------------
    // Ce que la page de gestion montre a l'organisateur : combien
    // est demande, combien est encaisse, ce qui lui revient.
    // ═══════════════════════════════════════════════════════

    function recapituler(demandes, accord) {
        var liste = demandes || [];
        var total = {
            nombre: liste.length,
            enAttente: 0, avecPreuve: 0, validees: 0, refusees: 0, annulees: 0,
            montantDemande: 0, montantValide: 0,
            commission: 0, frais: 0, net: 0,
            aRegler: 0
        };

        var attenduC = 0, valideC = 0, commissionC = 0, fraisC = 0, netC = 0, aReglerC = 0;

        liste.forEach(function (d) {
            if (!d) return;
            var montantC = centimes(d.amount);

            if (d.status === 'validated') {
                total.validees++;
                valideC += montantC;
                // Un partage deja fige sur la ligne fait foi ;
                // sinon on le recalcule pour l'affichage.
                if (d.commission_amount != null || d.net_amount != null) {
                    commissionC += centimes(d.commission_amount);
                    fraisC += centimes(d.organizer_fee);
                    netC += centimes(d.net_amount);
                } else {
                    var partage = calculerPartage(d.amount, accord);
                    commissionC += centimes(partage.commission);
                    fraisC += centimes(partage.frais);
                    netC += centimes(partage.net);
                }
                if (!d.settled) aReglerC += centimes(d.net_amount != null ? d.net_amount : 0);
            } else if (d.status === 'rejected') {
                total.refusees++;
            } else if (d.status === 'cancelled') {
                total.annulees++;
            } else if (d.status === 'proof') {
                total.avecPreuve++;
                attenduC += montantC;
            } else {
                total.enAttente++;
                attenduC += montantC;
            }
        });

        total.montantDemande = depuisCentimes(attenduC);
        total.montantValide = depuisCentimes(valideC);
        total.commission = depuisCentimes(commissionC);
        total.frais = depuisCentimes(fraisC);
        total.net = depuisCentimes(netC);
        total.aRegler = depuisCentimes(aReglerC);
        return total;
    }

    // ═══════════════════════════════════════════════════════
    // 11. INTERFACE PUBLIQUE
    // ═══════════════════════════════════════════════════════
    return {
        MOYENS: MOYENS,
        DEVISES: DEVISES,
        ETATS: ETATS,
        COLONNES_DEMANDE: COLONNES_DEMANDE,

        moyenParCle: moyenParCle,
        moyensParCanal: moyensParCanal,
        clesDeConfiguration: clesDeConfiguration,

        verifierConfiguration: verifierConfiguration,
        verifierPaiement: verifierPaiement,
        assainirCarte: assainirCarte,

        calculerPartage: calculerPartage,
        accordApplicable: accordApplicable,

        etat: etat,
        transitionsPossibles: transitionsPossibles,
        reference: reference,
        pourLaBase: pourLaBase,
        recapituler: recapituler,

        devise: devise,
        formaterMontant: formaterMontant,
        arrondirMontant: arrondirMontant
    };

})();
