/* ============================================================
   HubISoccer — payment.js
   Système Gestion Tournois — Paiement de la participation
   ------------------------------------------------------------
   Corrections critiques par rapport au fichier source :
   - Facturait prize_pool (la cagnotte que l'ORGANISATEUR
     distribue) au lieu de participation_price (ce que LE
     PARTICIPANT doit payer) -- deux montants sans rapport,
     souvent tres differents. Corrige.
   - Marquait chaque paiement status:'completed' instantanement,
     sans aucune verification (commentaire "simule" dans le
     fichier source). Remplace par un vrai statut pending, avec
     historique visible sur cette meme page.
   - 3 methodes generiques (mobile money / carte bancaire / IBAN
     invente) remplacees par les 2 methodes HubIS demandees :
     Compte HubIS (virement interne) et Carte HubIS.
   - Le CVV est collecte dans le formulaire (pour l'experience
     voulue) mais n'est JAMAIS insere en base -- ni lui, ni le
     numero de carte complet, meme pour cette carte interne.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

// ═══════════════════════════════════════════════════════════
// 2. TABLES
// ═══════════════════════════════════════════════════════════
const TBL_TOURNAMENTS = 'supabaseAuthPrive_gt_tournaments';
const TBL_PAYMENTS       = 'supabaseAuthPrive_gt_payment_requests';
const TBL_PROFILES          = 'supabaseAuthPrive_profiles';
const TBL_MOYENS_TOURNOI       = 'supabaseAuthPrive_gt_tournament_payment_methods';
const TBL_CATALOGUE               = 'supabaseAuthPrive_payment_methods';
const TBL_ACCORDS                    = 'supabaseAuthPrive_gt_organizer_agreements';
const BUCKET_PREUVES                    = 'gt-payment-proofs';
const TBL_WALLETS                          = 'supabaseAuthPrive_hubis_wallets';

// --- Chantier 07 : etat du paiement
let moyensDuTournoi = [];      // ce que l'organisateur a active
let moyenChoisi = null;        // { config, moyen }
let fichierPreuve = null;
let deviseCourante = 'XOF';
let monPortefeuille = null;    // le wallet reel du participant

// ═══════════════════════════════════════════════════════════
// 3. TABLE DE ROUTAGE PROFIL / PARAMETRES PAR ROLE
// ═══════════════════════════════════════════════════════════
const ROLE_PROFILE_ROUTES = {
    FOOT:   { profile: '../../footballeur/profile-edit/foot-profile.html',       settings: '../../footballeur/settings/foot-settings.html' },
    COACH:  { profile: '../../coach/profile-edit/coach-profile.html',            settings: '../../coach/settings/coach-settings.html' },
    ACAD:   { profile: '../../academie/profile-edit/academie-profile.html',      settings: '../../academie/settings/academie-settings.html' },
    AGENT:  { profile: '../../agent/profile-edit/agent-profile.html',            settings: '../../agent/settings/agent-settings.html' },
    PARRAIN:{ profile: '../../parrain/profile-edit/parrain-profile.html',        settings: '../../parrain/settings/parrain-settings.html' },
    MEDIC:  { profile: '../../staff_medical/profile-edit/staff-profile.html',    settings: '../../staff_medical/settings/staff-settings.html' },
    ARBIT:  { profile: '../../corps_arbitral/profile-edit/arbitre-profile.html', settings: '../../corps_arbitral/settings/arbitre-settings.html' },
    TOURN:  { profile: '../../gestionnaire_tournoi/profile-edit/gt-profile.html', settings: '../../gestionnaire_tournoi/settings/gt-settings.html' }
};
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];
const STATUS_LABELS = { pending: 'En attente de validation', validated: 'Validé', rejected: 'Rejeté' };
const STATUS_ICONS  = { pending: 'fa-hourglass-half', validated: 'fa-check-circle', rejected: 'fa-times-circle' };

// ═══════════════════════════════════════════════════════════
// 4. ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let userProfile = null;
let currentTournament = null;

// ═══════════════════════════════════════════════════════════
// 5. LOADER
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════
// 6. TOAST (30 secondes)
// ═══════════════════════════════════════════════════════════
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 20000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }
    }, duration);
}

// ═══════════════════════════════════════════════════════════
// 7. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; });
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}
function formatMoney(n) { return Number(n || 0).toLocaleString('fr-FR'); }

// ═══════════════════════════════════════════════════════════
// 8. SESSION
// ═══════════════════════════════════════════════════════════
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

// ═══════════════════════════════════════════════════════════
// 9. PROFIL
// ═══════════════════════════════════════════════════════════
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error || !data) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    userProfile = data;
    updateNavbarUI();
    applyRoleTier();

    // Chantier 07 — ta reponse au point 19 : hubis_account_number,
    // c'est le wallet_ref. On va donc le chercher dans le wallet
    // reel du participant, dans la table que « Mes revenus »
    // utilise deja, pour le pre-remplir plutot que de lui demander
    // d'aller le recopier ailleurs.
    const { data: portefeuille } = await supabaseClient
        .from(TBL_WALLETS)
        .select('wallet_ref, balance, currency')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();
    monPortefeuille = portefeuille || null;

    return userProfile;
}

function applyRoleTier() {
    const isGestionnaire = GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) !== -1;
    if (!isGestionnaire) {
        document.querySelectorAll('[data-tier="gestionnaire"]').forEach(function(el) { el.style.display = 'none'; });
    }
}

function applyProfileRouting() {
    const routes = ROLE_PROFILE_ROUTES[userProfile.role_code];
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    if (routes) {
        if (profileLink) profileLink.href = routes.profile;
        if (settingsLink) settingsLink.href = routes.settings;
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (settingsLink) settingsLink.style.display = 'none';
    }
}

function updateNavbarUI() {
    if (!userProfile) return;
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userAvatarInitials');
    if (userName) userName.textContent = userProfile.full_name || 'Utilisateur';
    const avatarUrl = userProfile.avatar_url;
    if (avatarUrl && avatarUrl !== '') {
        if (userAvatar) { userAvatar.src = avatarUrl; userAvatar.style.display = 'block'; }
        if (userInitials) userInitials.style.display = 'none';
    } else {
        const initials = getInitials(userProfile.full_name || 'U');
        if (userInitials) { userInitials.textContent = initials; userInitials.style.display = 'flex'; }
        if (userAvatar) userAvatar.style.display = 'none';
    }
    applyProfileRouting();
}

// ═══════════════════════════════════════════════════════════
// 10. CONTEXTE DU TOURNOI (montant = participation_price, pas prize_pool)
// ═══════════════════════════════════════════════════════════
async function loadTournamentContext() {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('tournament_id');

    if (!tournamentId) {
        GTPicker.monter({
            conteneur: 'gtPicker',
            type: 'tournoi',
            parametre: 'tournament_id',
            portee: 'mesInscriptions',
            icone: 'fa-credit-card',
            titre: 'Quelle participation voulez-vous régler ?',
            aide: 'Seuls les tournois auxquels vous êtes inscrit apparaissent ici.',
            messageVide: 'Vous n\'êtes inscrit à aucun tournoi pour le moment.'
        });
        return;
    }

    showLoader();
    const { data, error } = await supabaseClient
        .from(TBL_TOURNAMENTS)
        .select('id, name, logo_url, participation_type, participation_price, currency, payment_instructions, payment_deadline, created_by')
        .eq('id', tournamentId)
        .single();
    hideLoader();

    if (error || !data) {
        document.getElementById('contextTournamentName').textContent = 'Tournoi introuvable';
        showToast('Tournoi introuvable.', 'error');
        return;
    }

    currentTournament = data;

    document.getElementById('contextTournamentName').textContent = data.name || 'Tournoi';
    document.getElementById('contextTournamentSub').textContent =
        (data.participation_type === 'individuel' ? 'Participation individuelle' : 'Participation par équipe');
    if (data.logo_url) {
        document.getElementById('contextLogo').innerHTML = '<img src="' + data.logo_url + '" alt="Logo">';
    }

    deviseCourante = data.currency || 'XOF';
    const amount = data.participation_price || 0;
    // La devise vient du tournoi : un tournoi facture en euros ne
    // doit pas afficher des francs CFA.
    document.getElementById('contextAmount').textContent = GTPaiement.formaterMontant(amount, deviseCourante);

    await chargerLesMoyensDuTournoi();
}

// ═══════════════════════════════════════════════════════════
// 11. LES MOYENS QUE L'ORGANISATEUR A ACTIVÉS (chantier 07)
// -----------------------------------------------------------
// La page proposait deux moyens écrits en dur dans le HTML —
// le wallet et la carte HubIS — tous les deux internes. Aucun
// moyen externe, aucune preuve, aucune validation.
//
// Ta règle du point 15 : tous les moyens, configurés par
// l'organisateur, par tournoi. La liste ci-dessous vient donc
// de la base, pas du HTML.
// ═══════════════════════════════════════════════════════════
async function chargerLesMoyensDuTournoi() {
    const conteneur = document.getElementById('moyensListe');
    const etat = document.getElementById('moyensEtat');
    if (!conteneur || !currentTournament) return;

    const { data, error } = await supabaseClient
        .from(TBL_MOYENS_TOURNOI)
        .select('*')
        .eq('tournament_id', currentTournament.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        conteneur.innerHTML = '<div class="gtp-vide">Moyens de paiement indisponibles : ' +
            escapeHtml(error.message) + '</div>';
        return;
    }

    moyensDuTournoi = (data || []).filter(function(c) {
        // Un moyen que le catalogue ne connaît plus ne doit pas
        // rester proposé au participant.
        return !!GTPaiement.moyenParCle(c.method_key);
    });

    if (!moyensDuTournoi.length) {
        conteneur.innerHTML = '<div class="gtp-vide">' +
            '<strong>L\'organisateur n\'a pas encore ouvert de moyen de paiement.</strong><br>' +
            'Il les configure depuis « Gérer un tournoi », onglet Paiements. ' +
            'Revenez quand il les aura activés, ou contactez-le directement.</div>';
        if (etat) etat.innerHTML = '';
        return;
    }

    // Regroupés par canal : ce qui reste dans HubISoccer d'un
    // côté, ce qui passe par un service tiers de l'autre.
    const interne = moyensDuTournoi.filter(function(c) {
        return (GTPaiement.moyenParCle(c.method_key) || {}).canal === 'interne';
    });
    const externe = moyensDuTournoi.filter(function(c) {
        return (GTPaiement.moyenParCle(c.method_key) || {}).canal === 'externe';
    });

    let html = '';
    if (interne.length) {
        html += '<p class="gtp-groupe-titre">Depuis HubISoccer</p><div class="gtp-moyens">' +
                interne.map(carteMoyenHtml).join('') + '</div>';
    }
    if (externe.length) {
        html += '<p class="gtp-groupe-titre">Par un service extérieur</p><div class="gtp-moyens">' +
                externe.map(carteMoyenHtml).join('') + '</div>';
    }
    conteneur.innerHTML = html;

    conteneur.querySelectorAll('.gtp-moyen').forEach(function(bouton) {
        bouton.addEventListener('click', function() { choisirLeMoyen(bouton.dataset.config); });
    });

    if (etat) {
        etat.innerHTML = '<i class="fas fa-circle-check"></i> ' + moyensDuTournoi.length +
                         ' moyen(s) ouvert(s) par l\'organisateur' +
                         (currentTournament.payment_deadline
                            ? ' · à régler avant le ' + new Date(currentTournament.payment_deadline).toLocaleDateString('fr-FR')
                            : '') + '.';
    }

    if (currentTournament.payment_instructions) {
        conteneur.insertAdjacentHTML('beforeend',
            '<p class="gtp-consignes" style="margin-top:14px;">' +
            escapeHtml(currentTournament.payment_instructions) + '</p>');
    }
}

function carteMoyenHtml(config) {
    const moyen = GTPaiement.moyenParCle(config.method_key);
    if (!moyen) return '';
    return '<button type="button" class="gtp-moyen" data-config="' + escapeHtml(config.id) + '">' +
           '<span class="gtp-moyen-icone"><i class="fas ' + moyen.icone + '"></i></span>' +
           '<span class="gtp-moyen-corps">' +
               '<span class="gtp-moyen-nom">' + escapeHtml(moyen.nom) + '</span>' +
               '<span class="gtp-moyen-desc">' + escapeHtml(moyen.description) + '</span>' +
               '<span class="gtp-moyen-canal ' + moyen.canal + '">' +
                   (moyen.canal === 'interne' ? 'Interne' : 'Externe') + '</span>' +
           '</span></button>';
}

// ═══════════════════════════════════════════════════════════
// 12. LE MOYEN CHOISI : COORDONNÉES ET FORMULAIRE
// -----------------------------------------------------------
// Le participant voit les coordonnées réelles de l'organisateur
// — le numéro MoMo, l'IBAN, le lien — puis déclare ce qu'il a
// payé. Le formulaire se construit à partir de la description du
// moyen : ajouter un moyen ne demande de toucher à rien ici.
// ═══════════════════════════════════════════════════════════
function choisirLeMoyen(idConfig) {
    const config = moyensDuTournoi.filter(function(c) { return String(c.id) === String(idConfig); })[0];
    if (!config) return;
    const moyen = GTPaiement.moyenParCle(config.method_key);
    if (!moyen) return;

    moyenChoisi = { config: config, moyen: moyen };
    fichierPreuve = null;

    document.querySelectorAll('.gtp-moyen').forEach(function(b) {
        b.classList.toggle('choisi', String(b.dataset.config) === String(idConfig));
    });

    document.getElementById('titrePaiement').textContent = 'Régler par ' + moyen.nom;
    document.getElementById('coordonneesOrganisateur').innerHTML = coordonneesHtml(config, moyen);
    document.getElementById('champsPayeur').innerHTML = (moyen.champsPayeur || [])
        .map(function(champ) { return champHtml(champ); }).join('');

    // On ne redemande pas ce qu'on sait deja : le nom vient du
    // profil, la reference de compte vient du portefeuille reel.
    const champNom = document.getElementById('pay_payer_full_name');
    if (champNom && !champNom.value && userProfile) {
        champNom.value = userProfile.full_name || userProfile.display_name || '';
    }
    const champWallet = document.getElementById('pay_wallet_ref');
    if (champWallet && monPortefeuille && monPortefeuille.wallet_ref) {
        champWallet.value = monPortefeuille.wallet_ref;
    }

    const preuveRequise = config.requires_proof !== false && moyen.preuveRequise;
    document.getElementById('blocPreuve').style.display = preuveRequise ? 'block' : 'none';
    document.getElementById('apercuPreuve').innerHTML = '';
    document.getElementById('erreursPaiement').innerHTML = '';
    document.getElementById('libelleEnvoi').textContent = moyen.immediat
        ? 'Régler ' + GTPaiement.formaterMontant(currentTournament.participation_price || 0, deviseCourante)
        : 'Envoyer la demande de paiement';

    const bloc = document.getElementById('blocPaiement');
    bloc.style.display = 'block';
    bloc.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Les coordonnées de l'organisateur, telles qu'il les a saisies.
function coordonneesHtml(config, moyen) {
    if (moyen.canal === 'interne' && !(moyen.champs || []).length) {
        return '<div class="gtp-coordonnees">' +
               '<div class="gtp-coordonnees-titre"><i class="fas ' + moyen.icone + '"></i> ' +
               escapeHtml(moyen.nom) + '</div>' +
               '<p class="gtp-consignes" style="border-top:0;padding-top:0;margin-top:0;">' +
               escapeHtml(moyen.description) + '</p>' +
               (config.instructions ? '<p class="gtp-consignes">' + escapeHtml(config.instructions) + '</p>' : '') +
               '</div>';
    }

    const lignes = (moyen.champs || []).map(function(champ) {
        const valeur = config[champ.cle];
        if (valeur === undefined || valeur === null || String(valeur).trim() === '') return '';
        if (champ.cle === 'instructions') return '';   // affichées à part, en bas

        let rendu;
        if (champ.type === 'lien') {
            rendu = '<a href="' + escapeHtml(valeur) + '" target="_blank" rel="noopener noreferrer">' +
                    escapeHtml(valeur) + ' <i class="fas fa-arrow-up-right-from-square"></i></a>';
        } else {
            rendu = escapeHtml(valeur) +
                    '<button type="button" class="gtp-copier" data-copier="' + escapeHtml(valeur) + '">' +
                    '<i class="fas fa-copy"></i> copier</button>';
        }
        return '<div class="gtp-coordonnee"><span class="cle">' + escapeHtml(champ.label) + '</span>' +
               '<span class="valeur">' + rendu + '</span></div>';
    }).join('');

    return '<div class="gtp-coordonnees">' +
           '<div class="gtp-coordonnees-titre"><i class="fas ' + moyen.icone + '"></i> ' +
           'Payez à l\'organisateur — ' + escapeHtml(moyen.nom) + '</div>' +
           (lignes || '<p class="gtp-consignes" style="border-top:0;padding-top:0;">' +
                      'L\'organisateur n\'a pas renseigné ses coordonnées pour ce moyen.</p>') +
           (config.instructions ? '<p class="gtp-consignes">' + escapeHtml(config.instructions) + '</p>' : '') +
           '</div>';
}

function champHtml(champ) {
    const obligatoire = champ.obligatoire ? ' <span class="obligatoire">*</span>' : '';
    const id = 'pay_' + champ.cle;
    let saisie;

    if (champ.type === 'longtexte') {
        saisie = '<textarea id="' + id + '" data-cle="' + champ.cle + '"></textarea>';
    } else if (champ.type === 'carte') {
        saisie = '<input type="text" inputmode="numeric" maxlength="23" class="tabular" id="' + id +
                 '" data-cle="' + champ.cle + '" placeholder="•••• •••• •••• ••••" autocomplete="off">';
    } else if (champ.type === 'cvv') {
        saisie = '<input type="password" inputmode="numeric" maxlength="4" class="tabular" id="' + id +
                 '" data-cle="' + champ.cle + '" placeholder="•••" autocomplete="off">';
    } else if (champ.type === 'expiration') {
        saisie = '<input type="text" maxlength="5" class="tabular" id="' + id +
                 '" data-cle="' + champ.cle + '" placeholder="MM/AA" autocomplete="off">';
    } else if (champ.type === 'telephone') {
        saisie = '<input type="tel" class="tabular" id="' + id + '" data-cle="' + champ.cle + '">';
    } else {
        saisie = '<input type="text" id="' + id + '" data-cle="' + champ.cle + '">';
    }

    return '<div class="gtp-champ' + (champ.type === 'longtexte' ? ' pleine-largeur' : '') + '">' +
           '<label for="' + id + '">' + escapeHtml(champ.label) + obligatoire + '</label>' +
           saisie +
           (champ.aide ? '<span class="gtp-champ-aide' + (champ.jamaisEnregistre ? ' protege' : '') + '">' +
                         (champ.jamaisEnregistre ? '<i class="fas fa-shield-halved"></i> ' : '') +
                         escapeHtml(champ.aide) + '</span>' : '') +
           '</div>';
}

// ═══════════════════════════════════════════════════════════
// 13. LA PREUVE (ton point 16)
// ═══════════════════════════════════════════════════════════
const TAILLE_MAX_PREUVE = 5 * 1024 * 1024;   // 5 Mo

function initPreuve() {
    const zone = document.getElementById('zonePreuve');
    const champ = document.getElementById('fichierPreuve');
    if (!zone || !champ) return;

    zone.addEventListener('click', function() { champ.click(); });
    champ.addEventListener('change', function(e) {
        const fichier = e.target.files[0];
        if (!fichier) return;

        if (fichier.size > TAILLE_MAX_PREUVE) {
            showToast('Ce fichier fait ' + Math.round(fichier.size / 1024 / 1024) +
                      ' Mo. La limite est de 5 Mo — prenez une capture plutôt qu\'une photo pleine résolution.', 'warning');
            champ.value = '';
            return;
        }

        fichierPreuve = fichier;
        const apercu = document.getElementById('apercuPreuve');
        const estImage = /^image\//.test(fichier.type);

        if (estImage) {
            const lecteur = new FileReader();
            lecteur.onload = function(ev) {
                apercu.innerHTML = '<div class="gtp-preuve-apercu">' +
                    '<img src="' + ev.target.result + '" alt="Aperçu">' +
                    '<span class="nom">' + escapeHtml(fichier.name) + '</span>' +
                    '<button type="button" class="gtp-copier" id="retirerPreuve">Retirer</button></div>';
                brancherRetraitPreuve();
            };
            lecteur.readAsDataURL(fichier);
        } else {
            apercu.innerHTML = '<div class="gtp-preuve-apercu">' +
                '<i class="fas fa-file-pdf" style="font-size:1.6rem;"></i>' +
                '<span class="nom">' + escapeHtml(fichier.name) + '</span>' +
                '<button type="button" class="gtp-copier" id="retirerPreuve">Retirer</button></div>';
            brancherRetraitPreuve();
        }
    });
}

function brancherRetraitPreuve() {
    document.getElementById('retirerPreuve')?.addEventListener('click', function() {
        fichierPreuve = null;
        document.getElementById('fichierPreuve').value = '';
        document.getElementById('apercuPreuve').innerHTML = '';
    });
}

async function envoyerLaPreuve() {
    if (!fichierPreuve) return null;

    const extension = (fichierPreuve.name.split('.').pop() || 'jpg').toLowerCase();
    const chemin = 'tournoi-' + currentTournament.id + '/' + currentUser.id + '-' + Date.now() + '.' + extension;

    const { error } = await supabaseClient.storage
        .from(BUCKET_PREUVES)
        .upload(chemin, fichierPreuve, { cacheControl: '3600', upsert: false });

    if (error) {
        showToast('La preuve n\'a pas pu être envoyée : ' + error.message +
                  '. La demande part quand même, vous pourrez la joindre plus tard.', 'warning');
        return null;
    }

    const { data } = supabaseClient.storage.from(BUCKET_PREUVES).getPublicUrl(chemin);
    return data ? data.publicUrl : null;
}

// ═══════════════════════════════════════════════════════════
// 14. ENVOI DE LA DEMANDE
// -----------------------------------------------------------
// Le CVV et le numéro de carte complet ne franchissent jamais
// GTPaiement.pourLaBase() : seuls les 4 derniers chiffres et la
// date d'expiration sont conservés. C'était déjà le comportement
// de cette page, il est préservé et désormais garanti par le
// moteur plutôt que par la vigilance de l'appelant.
// ═══════════════════════════════════════════════════════════
async function envoyerLaDemande(e) {
    if (e) e.preventDefault();
    if (!currentTournament) { showToast('Aucun tournoi à payer.', 'error'); return; }
    if (!moyenChoisi) { showToast('Choisissez d\'abord un moyen de paiement.', 'warning'); return; }

    const moyen = moyenChoisi.moyen;
    const config = moyenChoisi.config;

    // Ce que le payeur a saisi
    const valeurs = {};
    document.querySelectorAll('#champsPayeur [data-cle]').forEach(function(champ) {
        valeurs[champ.dataset.cle] = champ.value.trim();
    });

    const erreurs = GTPaiement.verifierPaiement(moyen.cle, valeurs);
    const preuveRequise = config.requires_proof !== false && moyen.preuveRequise;
    if (preuveRequise && !fichierPreuve) {
        erreurs.push('La preuve de paiement est demandée pour ce moyen.');
    }

    const zoneErreurs = document.getElementById('erreursPaiement');
    if (erreurs.length) {
        zoneErreurs.innerHTML = '<strong><i class="fas fa-circle-exclamation"></i> ' +
            (erreurs.length === 1 ? 'Un point à corriger' : erreurs.length + ' points à corriger') + '</strong>' +
            '<ul>' + erreurs.map(function(x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') + '</ul>';
        zoneErreurs.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    zoneErreurs.innerHTML = '';

    showLoader();

    let urlPreuve = null;
    if (fichierPreuve) urlPreuve = await envoyerLaPreuve();

    // La carte passe par l'assainisseur : rien d'autre ne sort.
    const declare = moyen.cle === 'card'
        ? GTPaiement.assainirCarte(valeurs)
        : {
            payer_full_name: valeurs.payer_full_name || null,
            payer_phone: valeurs.payer_phone || null,
            payer_reference: valeurs.payer_reference || null,
            wallet_ref: valeurs.wallet_ref || null,
            note: valeurs.note || null
          };

    const demande = Object.assign({
        tournament_id: currentTournament.id,
        user_id: currentUser.id,
        amount: currentTournament.participation_price || 0,
        currency: deviseCourante,
        motif: 'Participation — ' + (currentTournament.name || 'Tournoi'),
        payment_method: moyen.cle,
        payment_channel: moyen.canal,
        tournament_method_id: config.id,
        method_id: config.method_id || null,
        proof_url: urlPreuve,
        proof_uploaded_at: urlPreuve ? new Date().toISOString() : null,
        status: urlPreuve ? 'proof' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }, declare);

    const ligne = GTPaiement.pourLaBase(demande);
    const { error } = await supabaseClient.from(TBL_PAYMENTS).insert([ligne]);
    hideLoader();

    if (error) {
        showToast('Erreur lors de l\'envoi de la demande : ' + error.message, 'error');
        return;
    }

    document.getElementById('formulairePaiement').reset();
    fichierPreuve = null;
    document.getElementById('apercuPreuve').innerHTML = '';

    const confirmation = document.getElementById('confirmationBlock');
    confirmation.style.display = 'block';
    confirmation.scrollIntoView({ behavior: 'smooth' });
    showToast('Demande envoyée. L\'organisateur la vérifie et la valide — vous suivez son état ci-dessous.', 'success');
    await loadPaymentHistory();
}

// ═══════════════════════════════════════════════════════════
// 15. MES DEMANDES DE PAIEMENT
// ═══════════════════════════════════════════════════════════
async function loadPaymentHistory() {
    const container = document.getElementById('paymentRequestsList');
    const { data, error } = await supabaseClient
        .from(TBL_PAYMENTS)
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        container.innerHTML = '<div class="gtp-vide">Historique indisponible : ' + escapeHtml(error.message) + '</div>';
        return;
    }
    if (!data || !data.length) {
        container.innerHTML = '<div class="gtp-vide">Aucune demande de paiement pour l\'instant.</div>';
        return;
    }

    container.innerHTML = '<div class="gtp-demandes">' + data.map(function(r) {
        const moyen = GTPaiement.moyenParCle(r.payment_method);
        const etat = GTPaiement.etat(r.status);
        const date = r.created_at ? new Date(r.created_at).toLocaleString('fr-FR',
            { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        const peutAnnuler = GTPaiement.transitionsPossibles(r.status, false).indexOf('cancelled') !== -1;

        return '<div class="gtp-demande">' +
            '<div class="gtp-demande-tete">' +
                '<div><div class="gtp-demande-payeur">' + escapeHtml(r.motif || 'Participation') + '</div>' +
                '<div class="gtp-demande-meta">' +
                    '<span><i class="fas ' + (moyen ? moyen.icone : 'fa-money-bill') + '"></i> ' +
                        escapeHtml(moyen ? moyen.nom : r.payment_method || '—') + '</span>' +
                    '<span><i class="fas fa-clock"></i> ' + escapeHtml(date) + '</span>' +
                    (r.payer_reference ? '<span><i class="fas fa-hashtag"></i> ' + escapeHtml(r.payer_reference) + '</span>' : '') +
                    (r.proof_url ? '<a class="gtp-lien-preuve" href="' + escapeHtml(r.proof_url) +
                                   '" target="_blank" rel="noopener noreferrer"><i class="fas fa-paperclip"></i> Ma preuve</a>' : '') +
                '</div></div>' +
                '<div style="text-align:right;">' +
                    '<div class="gtp-demande-montant">' + GTPaiement.formaterMontant(r.amount, r.currency) + '</div>' +
                    '<div style="margin-top:6px;"><span class="gtp-etat ' + etat.classe + '">' +
                        '<i class="fas ' + etat.icone + '"></i> ' + escapeHtml(etat.libelle) + '</span></div>' +
                '</div>' +
            '</div>' +
            (r.status === 'rejected' && r.review_comment
                ? '<div class="gtp-demande-motif"><i class="fas fa-circle-exclamation"></i> ' +
                  escapeHtml(r.review_comment) + '</div>'
                : '') +
            '<div class="gtp-demande-actions">' +
                (peutAnnuler ? '<button class="btn-secondary btn-annuler-demande" data-demande="' +
                               escapeHtml(r.id) + '"><i class="fas fa-ban"></i> Annuler</button>' : '') +
                (r.status === 'pending' && !r.proof_url
                    ? '<span class="gtp-champ-aide">Vous pouvez encore joindre une preuve en renvoyant une demande.</span>' : '') +
            '</div>' +
            '</div>';
    }).join('') + '</div>';

    container.querySelectorAll('.btn-annuler-demande').forEach(function(bouton) {
        bouton.addEventListener('click', function() { annulerLaDemande(bouton.dataset.demande); });
    });
}

async function annulerLaDemande(id) {
    if (!confirm('Annuler cette demande de paiement ?')) return;
    showLoader();
    const { error } = await supabaseClient
        .from(TBL_PAYMENTS)
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', currentUser.id);   // on n'annule que les siennes
    hideLoader();
    if (error) { showToast('Annulation impossible : ' + error.message, 'error'); return; }
    showToast('Demande annulée.', 'info');
    await loadPaymentHistory();
}

// Copier une coordonnée d'un geste — un IBAN se recopie mal à la main.
function initCopie() {
    document.addEventListener('click', function(e) {
        const bouton = e.target.closest ? e.target.closest('[data-copier]') : null;
        if (!bouton) return;
        e.preventDefault();
        const texte = bouton.dataset.copier;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texte).then(function() {
                showToast('Copié : ' + texte, 'success');
            }).catch(function() { showToast('Copie impossible sur cet appareil.', 'warning'); });
        } else {
            showToast('Copie impossible sur cet appareil.', 'warning');
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 16. UI : SIDEBAR, MENU, DÉCONNEXION
// ═══════════════════════════════════════════════════════════
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!userMenu || !dropdown) return;
    userMenu.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeLeftSidebar');
    function openSidebar() { if (sidebar) sidebar.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 40) openSidebar(); else if (dx < 0) closeSidebar();
    }, { passive: false });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            supabaseClient.auth.signOut().then(function() { window.location.href = '../../../index.html'; });
        });
    });
}

// ═══════════════════════════════════════════════════════════
// 17. INITIALISATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) return;

    await loadProfile();
    initUserMenu();
    initSidebar();
    initLogout();
    initPreuve();
    initCopie();

    document.getElementById('langSelect')?.addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
    document.getElementById('backBtn')?.addEventListener('click', function() { window.history.back(); });

    await loadTournamentContext();
    await loadPaymentHistory();

    document.getElementById('formulairePaiement')?.addEventListener('submit', envoyerLaDemande);
});
