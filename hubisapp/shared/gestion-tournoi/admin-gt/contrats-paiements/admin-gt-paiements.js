/* ============================================================
   HubISoccer — admin-gt-paiements.js
   Systeme Gestion Tournois — administration contrats & paiements
   ------------------------------------------------------------
   CE QUE FAIT CETTE PAGE

   Elle donne a l'administration la vue d'ensemble que personne
   n'avait : tous les accords, toutes les demandes de paiement de
   tous les tournois, le catalogue global des moyens, ce que
   chaque tournoi a encaisse et reverse, et les honoraires dus
   aux gestionnaires.

   CE QU'ELLE NE REFAIT PAS

   Le partage de l'argent est calcule par GTPaiement.calculerPartage(),
   le meme moteur que la page de paiement et que l'onglet Paiements
   de l'organisateur. Aucune arithmetique n'est reecrite ici : si
   le taux change de regle un jour, il change a un seul endroit.

   Le credit du portefeuille suit exactement le meme chemin que
   la validation par l'organisateur (manage-tournament.js) :
   ecriture dans hubis_transactions, puis mise a jour du solde,
   puis marquage settled. Un versement fait par l'administration
   et un versement fait par l'organisateur sont indiscernables
   pour « Mes revenus » — c'est voulu, c'est le meme argent.

   LES DEUX DECISIONS NE SE MELANGENT PAS

   gt_payment_requests porte deja reviewed_by / reviewed_at /
   review_comment : c'est la decision de L'ORGANISATEUR. Cette
   page ecrit dans admin_reviewed_by / admin_reviewed_at /
   admin_comment, ajoutes par le chantier 09. Les deux traces
   coexistent, et on sait toujours lequel des deux a tranche.

   LE JOURNAL

   Chaque decision ecrit une ligne dans gt_admin_actions, avec
   l'etat avant et l'etat apres. Rien ne s'efface nulle part.
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
const TBL_PROFILES      = 'supabaseAuthPrive_profiles';
const TBL_TOURNAMENTS      = 'supabaseAuthPrive_gt_tournaments';
const TBL_PAIEMENTS           = 'supabaseAuthPrive_gt_payment_requests';
const TBL_ACCORDS                = 'supabaseAuthPrive_gt_organizer_agreements';
const TBL_CATALOGUE                 = 'supabaseAuthPrive_payment_methods';
const TBL_WALLETS                      = 'supabaseAuthPrive_hubis_wallets';
const TBL_TRANSACTIONS                    = 'supabaseAuthPrive_hubis_transactions';
const TBL_JOURNAL                            = 'supabaseAuthPrive_gt_admin_actions';

// Les deux roles qui ouvrent cette page. Meme regle que
// admin-foot-revenus.js : l'administrateur general passe partout,
// l'administrateur du domaine passe chez lui.
const ROLES_AUTORISES = ['ADMIN', 'TOURN_ADMIN'];

// ═══════════════════════════════════════════════════════════
// 3. ETAT
// ═══════════════════════════════════════════════════════════
let currentUser = null;
let currentAdmin = null;

let tournois = [];
let profils = {};        // auth_uuid -> profil
let accords = [];
let demandes = [];
let catalogue = [];
let portefeuilles = {};  // auth_uuid -> wallet
let journal = [];

let ongletCourant = 'accords';

// ═══════════════════════════════════════════════════════════
// 4. UTILITAIRES
// ═══════════════════════════════════════════════════════════
function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Ta regle du point 32 : 20 secondes, pas 4.
function showToast(message, type, duree) {
    const zone = document.getElementById('toastContainer');
    if (!zone) return;
    const icones = { success: 'fa-circle-check', error: 'fa-circle-exclamation',
                     warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const t = type || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + t;
    el.innerHTML = '<i class="fas ' + (icones[t] || icones.info) + '"></i>' +
                   '<div>' + escapeHtml(message) + '</div>' +
                   '<button class="toast-fermer" aria-label="Fermer">&times;</button>';
    el.querySelector('.toast-fermer').addEventListener('click', function () { el.remove(); });
    zone.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, duree || 20000);
}

function montant(valeur, devise) {
    if (window.GTPaiement) return GTPaiement.formaterMontant(valeur, devise || 'XOF');
    return (Number(valeur) || 0).toLocaleString('fr-FR') + ' ' + (devise || 'XOF');
}

function date(valeur) {
    if (!valeur) return '—';
    const d = new Date(valeur);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR');
}

function dateHeure(valeur) {
    if (!valeur) return '—';
    const d = new Date(valeur);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR');
}

function nomDe(uuid) {
    if (!uuid) return '—';
    const p = profils[uuid];
    return p ? (p.full_name || p.display_name || 'Compte sans nom') : 'Compte inconnu';
}

// Le nom d'un moyen de paiement.
//
// L'ordre compte. Le CATALOGUE passe en premier parce que c'est
// lui que cette page permet de renommer : si l'administration
// rebaptise « MTN MoMo » en « MTN Mobile Money », le nouveau nom
// doit apparaitre dans la liste des demandes le lendemain, pas
// rester coince sur le libelle ecrit en dur dans gt-paiement.js.
// Ce dernier sert de repli pour les moyens que le catalogue ne
// contient pas encore.
function nomMoyen(cle) {
    if (!cle) return '—';
    const duCatalogue = catalogue.filter(function (m) {
        return String(m.method_key).toLowerCase() === String(cle).toLowerCase();
    })[0];
    if (duCatalogue && duCatalogue.display_name) return duCatalogue.display_name;
    if (window.GTPaiement) {
        const m = GTPaiement.moyenParCle(cle);
        if (m && m.nom) return m.nom;
    }
    return cle;
}

function nomTournoi(id) {
    if (id === null || id === undefined) return '—';
    const t = tournois.filter(function (x) { return String(x.id) === String(id); })[0];
    return t ? t.name : 'Tournoi #' + id;
}

// ═══════════════════════════════════════════════════════════
// 5. CONTROLE D'ACCES
// -----------------------------------------------------------
// Meme motif que admin-foot-revenus.js. Une seule difference
// assumee : au lieu de rediriger dans le dos apres deux
// secondes, la page affiche ce qui manque et laisse repartir.
// Une redirection silencieuse laisse l'utilisateur croire que la
// page est cassee.
// ═══════════════════════════════════════════════════════════
async function verifierAdmin() {
    showLoader();

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) {
        hideLoader();
        window.location.href = '../../../../authprive/users/login.html?role=TOURN_ADMIN&redirect=' +
            encodeURIComponent('../../shared/gestion-tournoi/admin-gt/contrats-paiements/admin-gt-paiements.html');
        return false;
    }
    currentUser = session.user;

    const { data: profil, error } = await supabaseClient
        .from(TBL_PROFILES)
        .select('auth_uuid, role_code, full_name, display_name, avatar_url, hubisoccer_id')
        .eq('auth_uuid', currentUser.id)
        .maybeSingle();

    hideLoader();

    if (error || !profil) {
        refuser('Votre profil n\'a pas pu être lu. Reconnectez-vous, puis réessayez.');
        return false;
    }

    if (ROLES_AUTORISES.indexOf(profil.role_code) === -1) {
        refuser('Votre compte porte le rôle <strong>' + escapeHtml(profil.role_code || 'aucun') +
                '</strong>. Cette page est réservée aux rôles <strong>ADMIN</strong> et ' +
                '<strong>TOURN_ADMIN</strong>.');
        return false;
    }

    currentAdmin = profil;
    document.getElementById('mainContent').style.display = 'block';
    afficherIdentite(profil);
    return true;
}

function refuser(detail) {
    document.getElementById('mainContent').style.display = 'none';
    const zone = document.getElementById('accesRefuse');
    const texte = document.getElementById('refuseDetail');
    if (texte) texte.innerHTML = detail;
    if (zone) zone.style.display = 'flex';
}

function afficherIdentite(profil) {
    const nom = profil.full_name || profil.display_name || 'Administrateur';
    document.getElementById('userName').textContent = nom;

    const avatar = document.getElementById('userAvatar');
    const initiales = document.getElementById('userAvatarInitials');
    if (profil.avatar_url) {
        avatar.src = profil.avatar_url;
        avatar.style.display = 'block';
        initiales.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        initiales.style.display = 'flex';
        initiales.textContent = nom.trim().split(/\s+/).slice(0, 2)
            .map(function (m) { return m.charAt(0); }).join('').toUpperCase();
    }
}

// ═══════════════════════════════════════════════════════════
// 6. LE JOURNAL DES ACTIONS
// -----------------------------------------------------------
// Une ecriture qui ne doit JAMAIS faire echouer l'action
// elle-meme. Si le journal refuse la ligne — table absente,
// reseau coupe — l'action reste faite et on le signale, mais on
// ne la defait pas : defaire un credit de portefeuille parce que
// le journal n'a pas repondu serait pire que le trou dans le
// journal.
// ═══════════════════════════════════════════════════════════
async function journaliser(action, cibleType, cibleId, avant, apres, options) {
    const o = options || {};
    try {
        const { error } = await supabaseClient.from(TBL_JOURNAL).insert([{
            admin_uuid: currentUser ? currentUser.id : null,
            admin_nom: currentAdmin ? (currentAdmin.full_name || currentAdmin.display_name) : null,
            admin_role: currentAdmin ? currentAdmin.role_code : null,
            action: action,
            cible_type: cibleType,
            cible_id: cibleId != null ? Number(cibleId) : null,
            tournament_id: o.tournament_id != null ? Number(o.tournament_id) : null,
            avant: avant || null,
            apres: apres || null,
            commentaire: o.commentaire || null,
            montant: o.montant != null ? Number(o.montant) : null,
            currency: o.currency || 'XOF',
            created_at: new Date().toISOString()
        }]);
        if (error) {
            console.warn('Journal non écrit :', error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.warn('Journal non écrit :', e && e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 7. CHARGEMENT DES DONNEES
// -----------------------------------------------------------
// Requetes separees, jamais de jointure PostgREST : c'est la
// regle suivie partout dans ce module depuis l'incident sur
// manage-tournament. Une relation non declaree renvoie PGRST200,
// deux relations renvoient PGRST201, et dans les deux cas la
// page se vide.
// ═══════════════════════════════════════════════════════════
async function toutCharger() {
    showLoader();

    const [rTournois, rAccords, rDemandes, rCatalogue, rJournal] = await Promise.all([
        supabaseClient.from(TBL_TOURNAMENTS)
            .select('id, name, created_by, status, currency, start_date, end_date, ' +
                    'frais_organisation, statut_paiement_gestionnaire, ' +
                    'honoraires_payes_le, honoraires_paye_par, honoraires_reference')
            .order('start_date', { ascending: false }),
        supabaseClient.from(TBL_ACCORDS).select('*').order('created_at', { ascending: false }),
        supabaseClient.from(TBL_PAIEMENTS).select('*').order('created_at', { ascending: false }),
        supabaseClient.from(TBL_CATALOGUE).select('*').order('display_order', { ascending: true }),
        supabaseClient.from(TBL_JOURNAL).select('*').order('created_at', { ascending: false }).limit(200)
    ]);

    tournois  = rTournois.data  || [];
    accords   = rAccords.data   || [];
    demandes  = rDemandes.data  || [];
    catalogue = rCatalogue.data || [];
    journal   = rJournal.data   || [];

    // Les tables du chantier 09 peuvent ne pas encore etre
    // executees. On le dit clairement plutot que d'afficher une
    // page vide sans explication.
    if (rJournal.error) {
        console.warn('Journal indisponible :', rJournal.error.message);
    }

    await chargerLesProfils();
    await chargerLesPortefeuilles();

    hideLoader();

    calculerLesChiffres();
    remplirLesFiltres();
    rendreAccords();
    rendreDemandes();
    rendreCatalogue();
    rendreFlux();
    rendreHonoraires();
    rendreJournal();
}

async function chargerLesProfils() {
    const ids = {};
    tournois.forEach(function (t) { if (t.created_by) ids[t.created_by] = true; });
    demandes.forEach(function (d) {
        if (d.user_id) ids[d.user_id] = true;
        if (d.reviewed_by) ids[d.reviewed_by] = true;
        if (d.admin_reviewed_by) ids[d.admin_reviewed_by] = true;
    });
    accords.forEach(function (a) { if (a.organizer_id) ids[a.organizer_id] = true; });

    const liste = Object.keys(ids);
    if (!liste.length) { profils = {}; return; }

    // Par paquets de 200 : une liste d'identifiants trop longue
    // depasse la taille d'URL acceptee par PostgREST.
    profils = {};
    for (let i = 0; i < liste.length; i += 200) {
        const paquet = liste.slice(i, i + 200);
        const { data } = await supabaseClient
            .from(TBL_PROFILES)
            .select('auth_uuid, full_name, display_name, avatar_url, hubisoccer_id, role_code')
            .in('auth_uuid', paquet);
        (data || []).forEach(function (p) { profils[p.auth_uuid] = p; });
    }
}

async function chargerLesPortefeuilles() {
    const ids = [];
    tournois.forEach(function (t) {
        if (t.created_by && ids.indexOf(t.created_by) === -1) ids.push(t.created_by);
    });
    if (!ids.length) { portefeuilles = {}; return; }

    portefeuilles = {};
    for (let i = 0; i < ids.length; i += 200) {
        const { data } = await supabaseClient
            .from(TBL_WALLETS)
            .select('id, auth_uuid, wallet_ref, balance, currency, status')
            .in('auth_uuid', ids.slice(i, i + 200));
        (data || []).forEach(function (w) { portefeuilles[w.auth_uuid] = w; });
    }
}

// ═══════════════════════════════════════════════════════════
// 8. LE BANDEAU DE CHIFFRES
// -----------------------------------------------------------
// Seules les demandes VALIDEES comptent comme de l'argent. Une
// demande en attente n'est pas un encaissement, et l'afficher
// comme tel donnerait un chiffre d'affaires imaginaire.
// ═══════════════════════════════════════════════════════════
function calculerLesChiffres() {
    let brut = 0, commission = 0, net = 0, aTraiter = 0;

    demandes.forEach(function (d) {
        if (d.status === 'validated') {
            brut       += Number(d.amount || 0);
            commission += Number(d.commission_amount || 0) + Number(d.organizer_fee || 0);
            net        += Number(d.net_amount || 0);
        } else if (d.status === 'pending' || d.status === 'proof') {
            aTraiter++;
        }
    });

    document.getElementById('chiffreEncaisse').textContent   = montant(brut, 'XOF');
    document.getElementById('chiffreCommission').textContent = montant(commission, 'XOF');
    document.getElementById('chiffreNet').textContent        = montant(net, 'XOF');
    document.getElementById('chiffreAttente').textContent    = String(aTraiter);
}

function remplirLesFiltres() {
    const selTournoi = document.getElementById('filtreTournoi');
    selTournoi.innerHTML = '<option value="">Tous les tournois</option>' +
        tournois.map(function (t) {
            return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name || 'Sans nom') + '</option>';
        }).join('');

    const organisateurs = {};
    tournois.forEach(function (t) { if (t.created_by) organisateurs[t.created_by] = true; });
    const selOrga = document.getElementById('filtreOrganisateur');
    selOrga.innerHTML = '<option value="">Tous les organisateurs</option>' +
        Object.keys(organisateurs).map(function (id) {
            return '<option value="' + escapeHtml(id) + '">' + escapeHtml(nomDe(id)) + '</option>';
        }).join('');
}

// ═══════════════════════════════════════════════════════════
// 9. ONGLET ACCORDS
// ═══════════════════════════════════════════════════════════
function rendreAccords() {
    const zone = document.getElementById('accordsZone');
    if (!accords.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Aucun accord enregistré.</strong>' +
            'Sans accord, rien n\'est prélevé sur les paiements d\'un organisateur — ' +
            'et la page de paiement le dit franchement au lieu d\'inventer un taux.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Organisateur</th><th>Portée</th><th>Type</th>' +
        '<th class="num">Commission</th><th class="num">Frais</th>' +
        '<th>Référence</th><th>Signé le</th><th>État</th><th></th>' +
        '</tr></thead><tbody>' +
        accords.map(function (a) {
            const portee = a.tournament_id
                ? '<span class="pastille violette">' + escapeHtml(nomTournoi(a.tournament_id)) + '</span>'
                : '<span class="pastille">Accord général</span>';
            const type = a.agreement_type === 'hubisoccer'
                ? '<span class="pastille info">HubISoccer</span>'
                : '<span class="pastille">Externe</span>';
            const etat = a.is_active === false
                ? '<span class="pastille non">Inactif</span>'
                : '<span class="pastille oui">Actif</span>';
            return '<tr>' +
                '<td class="cellule-forte">' + escapeHtml(nomDe(a.organizer_id)) + '</td>' +
                '<td>' + portee + '</td>' +
                '<td>' + type + '</td>' +
                '<td class="num">' + escapeHtml(String(Number(a.commission_rate || 0))) + ' %</td>' +
                '<td class="num">' + montant(a.organizer_fee, a.currency) + '</td>' +
                '<td class="cellule-faible">' + escapeHtml(a.reference || '—') + '</td>' +
                '<td class="cellule-faible">' + date(a.signed_at) + '</td>' +
                '<td>' + etat + '</td>' +
                '<td class="actions">' +
                    '<button class="btn-mini" data-modifier-accord="' + escapeHtml(a.id) + '">' +
                        '<i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-mini" data-basculer-accord="' + escapeHtml(a.id) + '">' +
                        (a.is_active === false ? '<i class="fas fa-play"></i> Activer'
                                               : '<i class="fas fa-pause"></i> Désactiver') + '</button>' +
                '</td></tr>';
        }).join('') + '</tbody></table>';

    zone.querySelectorAll('[data-modifier-accord]').forEach(function (b) {
        b.addEventListener('click', function () { ouvrirAccord(b.dataset.modifierAccord); });
    });
    zone.querySelectorAll('[data-basculer-accord]').forEach(function (b) {
        b.addEventListener('click', function () { basculerAccord(b.dataset.basculerAccord); });
    });
}

function ouvrirAccord(id) {
    const a = id ? accords.filter(function (x) { return String(x.id) === String(id); })[0] : null;

    document.getElementById('modalAccordTitre').innerHTML = a
        ? '<i class="fas fa-handshake"></i> Modifier l\'accord'
        : '<i class="fas fa-handshake"></i> Nouvel accord';

    // Les deux listes deroulantes se remplissent a l'ouverture :
    // un tournoi cree entre-temps doit y figurer.
    const organisateurs = {};
    tournois.forEach(function (t) { if (t.created_by) organisateurs[t.created_by] = true; });
    accords.forEach(function (x) { if (x.organizer_id) organisateurs[x.organizer_id] = true; });

    document.getElementById('accordOrganisateur').innerHTML =
        '<option value="">Sélectionnez un organisateur</option>' +
        Object.keys(organisateurs).map(function (uid) {
            return '<option value="' + escapeHtml(uid) + '">' + escapeHtml(nomDe(uid)) + '</option>';
        }).join('');

    document.getElementById('accordTournoi').innerHTML =
        '<option value="">Accord général — tous ses tournois</option>' +
        tournois.map(function (t) {
            return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name || 'Sans nom') + '</option>';
        }).join('');

    document.getElementById('accordId').value           = a ? a.id : '';
    document.getElementById('accordOrganisateur').value = a ? (a.organizer_id || '') : '';
    document.getElementById('accordTournoi').value      = a && a.tournament_id != null ? String(a.tournament_id) : '';
    document.getElementById('accordType').value         = a ? (a.agreement_type || 'externe') : 'externe';
    document.getElementById('accordTaux').value         = a ? Number(a.commission_rate || 0) : 0;
    document.getElementById('accordFrais').value        = a ? Number(a.organizer_fee || 0) : 0;
    document.getElementById('accordDevise').value       = a ? (a.currency || 'XOF') : 'XOF';
    document.getElementById('accordModeFrais').value    = a ? (a.fee_mode || 'par_transaction') : 'par_transaction';
    document.getElementById('accordSigne').value        = a && a.signed_at ? String(a.signed_at).slice(0, 10) : '';
    document.getElementById('accordReference').value    = a ? (a.reference || '') : '';
    document.getElementById('accordDebut').value        = a && a.valid_from ? String(a.valid_from).slice(0, 10) : '';
    document.getElementById('accordFin').value          = a && a.valid_until ? String(a.valid_until).slice(0, 10) : '';
    document.getElementById('accordDocument').value     = a ? (a.document_url || '') : '';
    document.getElementById('accordNotes').value        = a ? (a.notes || '') : '';
    document.getElementById('accordActif').checked      = a ? a.is_active !== false : true;

    rafraichirSimulation();
    document.getElementById('modalAccord').classList.add('ouverte');
}

// La simulation : ce que l'accord saisi donnerait sur un vrai
// paiement. Le calcul vient de GTPaiement — le meme que celui qui
// s'appliquera pour de bon.
function rafraichirSimulation() {
    const corps = document.getElementById('accordSimulationCorps');
    if (!corps || !window.GTPaiement) return;

    const brut = Number(document.getElementById('accordSimulationMontant').value) || 0;
    const devise = document.getElementById('accordDevise').value || 'XOF';

    const partage = GTPaiement.calculerPartage(brut, {
        agreement_type: document.getElementById('accordType').value,
        commission_rate: Number(document.getElementById('accordTaux').value) || 0,
        organizer_fee: Number(document.getElementById('accordFrais').value) || 0
    });

    corps.innerHTML =
        partage.detail.map(function (l) {
            return '<div class="simulation-ligne"><span>' + escapeHtml(l.libelle) + '</span>' +
                   '<span>' + montant(l.valeur, devise) + '</span></div>';
        }).join('') +
        '<div class="simulation-ligne total"><span>Net à l\'organisateur</span>' +
        '<span>' + montant(partage.net, devise) + '</span></div>' +
        (partage.alerte
            ? '<div class="simulation-alerte"><i class="fas fa-triangle-exclamation"></i> ' +
              escapeHtml(partage.alerte) + '</div>'
            : '');
}

async function enregistrerAccord() {
    const id = document.getElementById('accordId').value;
    const organisateur = document.getElementById('accordOrganisateur').value;

    if (!organisateur) {
        showToast('Choisissez l\'organisateur : sans lui, l\'accord ne s\'applique à personne.', 'warning');
        return;
    }

    const taux = Number(document.getElementById('accordTaux').value) || 0;
    if (taux < 0 || taux > 100) {
        showToast('Le taux de commission doit rester entre 0 et 100 %.', 'warning');
        return;
    }

    const frais = Number(document.getElementById('accordFrais').value) || 0;
    if (frais < 0) {
        showToast('Les frais d\'organisation ne peuvent pas être négatifs.', 'warning');
        return;
    }

    const tournoi = document.getElementById('accordTournoi').value;
    const ligne = {
        organizer_id: organisateur,
        tournament_id: tournoi ? Number(tournoi) : null,
        agreement_type: document.getElementById('accordType').value,
        commission_rate: taux,
        organizer_fee: frais,
        currency: document.getElementById('accordDevise').value,
        fee_mode: document.getElementById('accordModeFrais').value,
        signed_at: document.getElementById('accordSigne').value || null,
        reference: document.getElementById('accordReference').value.trim() || null,
        valid_from: document.getElementById('accordDebut').value || null,
        valid_until: document.getElementById('accordFin').value || null,
        document_url: document.getElementById('accordDocument').value.trim() || null,
        notes: document.getElementById('accordNotes').value.trim() || null,
        is_active: document.getElementById('accordActif').checked,
        signe_par: currentUser.id,
        updated_at: new Date().toISOString()
    };

    showLoader();
    const avant = id ? accords.filter(function (x) { return String(x.id) === String(id); })[0] : null;

    let erreur;
    if (id) {
        const r = await supabaseClient.from(TBL_ACCORDS).update(ligne).eq('id', id);
        erreur = r.error;
    } else {
        ligne.created_by = currentUser.id;
        ligne.created_at = new Date().toISOString();
        const r = await supabaseClient.from(TBL_ACCORDS).insert([ligne]);
        erreur = r.error;
    }
    hideLoader();

    if (erreur) {
        showToast('Enregistrement impossible : ' + erreur.message, 'error');
        return;
    }

    await journaliser(id ? 'modifier_accord' : 'creer_accord', 'accord', id || null,
                      avant, ligne, { tournament_id: ligne.tournament_id });

    fermerModales();
    showToast('Accord enregistré.', 'success');
    await toutCharger();
}

async function basculerAccord(id) {
    const a = accords.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!a) return;

    const nouvelEtat = a.is_active === false;
    const question = nouvelEtat
        ? 'Réactiver cet accord ? Il redeviendra applicable aux prochains paiements.'
        : 'Désactiver cet accord ?\n\nLes paiements déjà validés gardent le taux qui leur a été appliqué — ' +
          'il est figé sur chaque ligne. Seuls les paiements à venir cesseront d\'être prélevés.';
    if (!confirm(question)) return;

    showLoader();
    const { error } = await supabaseClient.from(TBL_ACCORDS)
        .update({ is_active: nouvelEtat, updated_at: new Date().toISOString() })
        .eq('id', id);
    hideLoader();

    if (error) { showToast('Modification impossible : ' + error.message, 'error'); return; }

    await journaliser(nouvelEtat ? 'activer_accord' : 'desactiver_accord', 'accord', id,
                      { is_active: a.is_active }, { is_active: nouvelEtat },
                      { tournament_id: a.tournament_id });

    showToast(nouvelEtat ? 'Accord réactivé.' : 'Accord désactivé.', 'success');
    await toutCharger();
}

// ═══════════════════════════════════════════════════════════
// 10. ONGLET DEMANDES
// ═══════════════════════════════════════════════════════════
function demandesFiltrees() {
    const idTournoi = document.getElementById('filtreTournoi').value;
    const statut = document.getElementById('filtreStatut').value;
    const organisateur = document.getElementById('filtreOrganisateur').value;
    const recherche = (document.getElementById('filtreRecherche').value || '').trim().toLowerCase();

    // Les tournois de l'organisateur retenu, calcules une fois.
    let tournoisDeLOrganisateur = null;
    if (organisateur) {
        tournoisDeLOrganisateur = {};
        tournois.forEach(function (t) {
            if (String(t.created_by) === String(organisateur)) tournoisDeLOrganisateur[String(t.id)] = true;
        });
    }

    return demandes.filter(function (d) {
        if (idTournoi && String(d.tournament_id) !== String(idTournoi)) return false;
        if (statut && d.status !== statut) return false;
        if (tournoisDeLOrganisateur && !tournoisDeLOrganisateur[String(d.tournament_id)]) return false;
        if (recherche) {
            const foin = [nomDe(d.user_id), d.payer_full_name, d.payer_reference,
                          d.motif, d.payment_method, d.payer_phone]
                .filter(Boolean).join(' ').toLowerCase();
            if (foin.indexOf(recherche) === -1) return false;
        }
        return true;
    });
}

function rendreDemandes() {
    const zone = document.getElementById('demandesZone');
    const liste = demandesFiltrees();

    if (!liste.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Aucune demande ne correspond.</strong>' +
            'Élargissez les filtres, ou attendez qu\'un participant règle sa participation.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Payeur</th><th>Tournoi</th><th>Moyen</th>' +
        '<th class="num">Montant</th><th class="num">Net</th>' +
        '<th>Preuve</th><th>État</th><th>Déposée</th><th></th>' +
        '</tr></thead><tbody>' +
        liste.map(function (d) {
            const e = window.GTPaiement ? GTPaiement.etat(d.status) : null;
            const pastille = e
                ? '<span class="pastille ' + escapeHtml(e.classe) + '"><i class="fas ' +
                  escapeHtml(e.icone) + '"></i> ' + escapeHtml(e.libelle) + '</span>'
                : escapeHtml(d.status || '—');
            const moyen = nomMoyen(d.payment_method);
            const preuve = d.proof_url
                ? '<span class="pastille oui"><i class="fas fa-paperclip"></i> Oui</span>'
                : '<span class="pastille">—</span>';
            return '<tr>' +
                '<td class="cellule-forte">' + escapeHtml(d.payer_full_name || nomDe(d.user_id)) + '</td>' +
                '<td>' + escapeHtml(nomTournoi(d.tournament_id)) + '</td>' +
                '<td class="cellule-faible">' + escapeHtml(moyen) + '</td>' +
                '<td class="num">' + montant(d.amount, d.currency) + '</td>' +
                '<td class="num">' + (d.status === 'validated' ? montant(d.net_amount, d.currency) : '—') + '</td>' +
                '<td>' + preuve + '</td>' +
                '<td>' + pastille + '</td>' +
                '<td class="cellule-faible">' + date(d.created_at) + '</td>' +
                '<td class="actions"><button class="btn-mini" data-voir-demande="' + escapeHtml(d.id) + '">' +
                    '<i class="fas fa-eye"></i> Examiner</button></td>' +
                '</tr>';
        }).join('') + '</tbody></table>';

    zone.querySelectorAll('[data-voir-demande]').forEach(function (b) {
        b.addEventListener('click', function () { ouvrirDemande(b.dataset.voirDemande); });
    });
}

function ouvrirDemande(id) {
    const d = demandes.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!d) return;

    const devise = d.currency || 'XOF';
    const tournoi = tournois.filter(function (t) { return String(t.id) === String(d.tournament_id); })[0];
    const accord = window.GTPaiement
        ? GTPaiement.accordApplicable(accords, d.tournament_id, tournoi ? tournoi.created_by : null)
        : null;

    // Un paiement deja valide garde le partage FIGE sur sa ligne.
    // On ne recalcule pas : le taux a pu changer depuis, et
    // afficher le taux d'aujourd'hui sur une transaction d'hier
    // serait un mensonge.
    const partage = d.status === 'validated'
        ? { brut: Number(d.amount || 0), commission: Number(d.commission_amount || 0),
            frais: Number(d.organizer_fee || 0), net: Number(d.net_amount || 0),
            taux: Number(d.commission_rate || 0), alerte: null, fige: true }
        : (window.GTPaiement ? GTPaiement.calculerPartage(d.amount, accord) : null);

    const e = window.GTPaiement ? GTPaiement.etat(d.status) : null;
    const moyen = nomMoyen(d.payment_method);

    function bloc(cle, valeur, classeNum) {
        return '<div class="fiche-case"><span class="cle">' + escapeHtml(cle) + '</span>' +
               '<span class="valeur' + (classeNum ? ' num' : '') + '">' + valeur + '</span></div>';
    }

    document.getElementById('modalDemandeCorps').innerHTML =
        '<div class="fiche-grille">' +
            bloc('État', e ? '<span class="pastille ' + escapeHtml(e.classe) + '">' +
                             escapeHtml(e.libelle) + '</span>' : escapeHtml(d.status || '—')) +
            bloc('Montant', escapeHtml(montant(d.amount, devise)), true) +
            bloc('Tournoi', escapeHtml(nomTournoi(d.tournament_id))) +
            bloc('Organisateur', escapeHtml(tournoi ? nomDe(tournoi.created_by) : '—')) +
        '</div>' +

        '<div class="fiche-titre"><i class="fas fa-user"></i> Le payeur</div>' +
        '<div class="fiche-grille">' +
            bloc('Nom', escapeHtml(d.payer_full_name || nomDe(d.user_id))) +
            bloc('Identifiant HubIS', escapeHtml((profils[d.user_id] || {}).hubisoccer_id || '—')) +
            bloc('Téléphone', escapeHtml(d.payer_phone || '—')) +
            bloc('Référence déclarée', escapeHtml(d.payer_reference || '—')) +
            bloc('Moyen', escapeHtml(moyen)) +
            bloc('Motif', escapeHtml(d.motif || '—')) +
        '</div>' +

        '<div class="fiche-titre"><i class="fas fa-paperclip"></i> La preuve</div>' +
        (d.proof_url
            ? '<a class="preuve-lien" href="' + escapeHtml(d.proof_url) + '" target="_blank" rel="noopener">' +
              '<i class="fas fa-up-right-from-square"></i> Ouvrir la preuve déposée' +
              (d.proof_uploaded_at ? ' — ' + escapeHtml(dateHeure(d.proof_uploaded_at)) : '') + '</a>'
            : '<p class="preuve-absente">Aucune preuve déposée. Selon le moyen employé, elle peut ne pas ' +
              'être exigée — vérifiez le canal avant de refuser pour ce motif.</p>') +

        '<div class="fiche-titre"><i class="fas fa-scale-balanced"></i> Le partage' +
            (partage && partage.fige ? ' — figé à la validation' : ' — simulation') + '</div>' +
        (partage
            ? '<div class="fiche-grille">' +
                bloc('Brut', escapeHtml(montant(partage.brut, devise)), true) +
                bloc('Commission (' + escapeHtml(String(partage.taux)) + ' %)',
                     escapeHtml(montant(partage.commission, devise)), true) +
                bloc('Frais d\'organisation', escapeHtml(montant(partage.frais, devise)), true) +
                bloc('Net à l\'organisateur', escapeHtml(montant(partage.net, devise)), true) +
              '</div>' +
              (partage.alerte
                ? '<div class="simulation-alerte"><i class="fas fa-triangle-exclamation"></i> ' +
                  escapeHtml(partage.alerte) + '</div>'
                : '') +
              (!partage.fige && !accord
                ? '<div class="simulation-alerte"><i class="fas fa-circle-info"></i> ' +
                  'Aucun accord actif pour cet organisateur : rien ne serait prélevé. ' +
                  'Créez l\'accord dans l\'onglet Accords avant de valider.</div>'
                : '')
            : '<p class="preuve-absente">Le moteur de partage n\'est pas chargé.</p>') +

        '<div class="fiche-titre"><i class="fas fa-gavel"></i> Les décisions</div>' +
        '<div class="fiche-grille">' +
            bloc('Organisateur', escapeHtml(d.reviewed_by ? nomDe(d.reviewed_by) + ' — ' + dateHeure(d.reviewed_at) : 'Pas encore statué')) +
            bloc('Administration', escapeHtml(d.admin_reviewed_by ? nomDe(d.admin_reviewed_by) + ' — ' + dateHeure(d.admin_reviewed_at) : 'Pas encore statué')) +
        '</div>' +
        (d.review_comment
            ? '<p class="cellule-faible" style="margin-top:10px;"><strong>Motif de l\'organisateur :</strong> ' +
              escapeHtml(d.review_comment) + '</p>' : '') +
        (d.admin_comment
            ? '<p class="cellule-faible" style="margin-top:6px;"><strong>Motif de l\'administration :</strong> ' +
              escapeHtml(d.admin_comment) + '</p>' : '') +

        (peutStatuer(d)
            ? '<div class="motif-zone"><div class="fiche-titre"><i class="fas fa-pen"></i> Motif de votre décision</div>' +
              '<textarea id="motifAdmin" rows="3" placeholder="Obligatoire pour un refus. Le participant le lira."></textarea></div>'
            : '');

    document.getElementById('modalDemandePied').innerHTML = peutStatuer(d)
        ? '<button class="btn-secondary" id="fermerDemande">Fermer</button>' +
          '<button class="btn-danger" data-refuser="' + escapeHtml(d.id) + '">' +
              '<i class="fas fa-circle-xmark"></i> Refuser</button>' +
          '<button class="btn-primary" data-valider="' + escapeHtml(d.id) + '">' +
              '<i class="fas fa-circle-check"></i> Valider et créditer</button>'
        : '<button class="btn-secondary" id="fermerDemande">Fermer</button>';

    const pied = document.getElementById('modalDemandePied');
    const fermer = pied.querySelector('#fermerDemande');
    if (fermer) fermer.addEventListener('click', fermerModales);
    const bValider = pied.querySelector('[data-valider]');
    if (bValider) bValider.addEventListener('click', function () { validerDemande(d.id); });
    const bRefuser = pied.querySelector('[data-refuser]');
    if (bRefuser) bRefuser.addEventListener('click', function () { refuserDemande(d.id); });

    document.getElementById('modalDemande').classList.add('ouverte');
}

// Une demande deja tranchee ne se retranche pas depuis cette
// page. Revenir sur un paiement valide voudrait dire debiter un
// portefeuille — ce n'est pas une case a cocher, c'est un
// remboursement, et il n'a pas sa place ici.
function peutStatuer(d) {
    return d.status === 'pending' || d.status === 'proof';
}

async function validerDemande(id) {
    const d = demandes.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!d || !peutStatuer(d)) return;

    const devise = d.currency || 'XOF';
    const tournoi = tournois.filter(function (t) { return String(t.id) === String(d.tournament_id); })[0];
    const accord = window.GTPaiement
        ? GTPaiement.accordApplicable(accords, d.tournament_id, tournoi ? tournoi.created_by : null)
        : null;
    const partage = GTPaiement.calculerPartage(d.amount, accord);

    const resume = 'Valider ce paiement de ' + montant(partage.brut, devise) + ' ?\n\n' +
        partage.detail.map(function (l) {
            return '  ' + l.libelle + ' : ' + montant(Math.abs(l.valeur), devise);
        }).join('\n') +
        '\n\nNet crédité à ' + (tournoi ? nomDe(tournoi.created_by) : 'l\'organisateur') +
        ' : ' + montant(partage.net, devise) +
        (partage.alerte ? '\n\n' + partage.alerte : '');
    if (!confirm(resume)) return;

    const motif = (document.getElementById('motifAdmin') || {}).value || '';
    const maintenant = new Date().toISOString();
    const reference = GTPaiement.reference('ADM', d.tournament_id);

    showLoader();

    // Le taux est fige sur la ligne : si l'accord change dans six
    // mois, on saura toujours ce qui a ete preleve ici.
    const { error } = await supabaseClient.from(TBL_PAIEMENTS).update({
        status: 'validated',
        admin_reviewed_by: currentUser.id,
        admin_reviewed_at: maintenant,
        admin_comment: motif.trim() || null,
        commission_rate: partage.taux,
        commission_amount: partage.commission,
        organizer_fee: partage.frais,
        net_amount: partage.net,
        agreement_id: accord ? accord.id : null,
        wallet_transaction_ref: reference,
        updated_at: maintenant
    }).eq('id', id);

    if (error) {
        hideLoader();
        showToast('Validation impossible : ' + error.message, 'error');
        return;
    }

    const versement = await crediterLOrganisateur(partage.net, devise, reference, d, tournoi);
    hideLoader();

    await journaliser('valider_paiement', 'demande', id,
                      { status: d.status },
                      { status: 'validated', net_amount: partage.net,
                        commission_amount: partage.commission, organizer_fee: partage.frais },
                      { tournament_id: d.tournament_id, montant: partage.net,
                        currency: devise, commentaire: motif.trim() || null });

    fermerModales();
    showToast('Paiement validé. ' +
        (versement.ok
            ? montant(partage.net, devise) + ' crédités au compte HubIS de ' +
              (tournoi ? nomDe(tournoi.created_by) : 'l\'organisateur') + '.'
            : 'Le versement reste à faire : ' + versement.raison),
        versement.ok ? 'success' : 'warning');

    await toutCharger();
}

// Le meme chemin que manage-tournament.js, a une difference
// pres : le beneficiaire est l'organisateur DU TOURNOI, pas le
// compte connecte. Un administrateur qui valide ne se crediterait
// evidemment pas lui-meme.
async function crediterLOrganisateur(net, devise, reference, demande, tournoi) {
    if (!(net > 0)) return { ok: false, raison: 'le net est nul, il n\'y a rien à verser.' };

    const idOrganisateur = tournoi ? tournoi.created_by : null;
    if (!idOrganisateur) {
        return { ok: false, raison: 'le tournoi de cette demande n\'a pas d\'organisateur identifié.' };
    }

    const { data: portefeuille } = await supabaseClient
        .from(TBL_WALLETS)
        .select('id, balance, wallet_ref')
        .eq('auth_uuid', idOrganisateur)
        .maybeSingle();

    if (!portefeuille) {
        return { ok: false, raison: 'aucun compte HubIS n\'est ouvert pour ' + nomDe(idOrganisateur) +
                                    '. Le paiement est validé ; le versement attend l\'ouverture du compte.' };
    }

    const { error: erreurTransaction } = await supabaseClient.from(TBL_TRANSACTIONS).insert([{
        wallet_id: portefeuille.id,
        type: 'tournament_payment',
        amount: net,
        description: 'Participation — ' + (tournoi ? tournoi.name : 'Tournoi') +
                     ' · ' + (demande.payer_full_name || nomDe(demande.user_id)) +
                     ' · validé par l\'administration',
        reference: reference,
        status: 'completed',
        created_at: new Date().toISOString()
    }]);

    if (erreurTransaction) {
        return { ok: false, raison: 'écriture au journal refusée (' + erreurTransaction.message + ').' };
    }

    const { error: erreurSolde } = await supabaseClient.from(TBL_WALLETS)
        .update({ balance: Number(portefeuille.balance || 0) + Number(net) })
        .eq('id', portefeuille.id);

    if (erreurSolde) {
        return { ok: false, raison: 'solde non mis à jour (' + erreurSolde.message + ').' };
    }

    await supabaseClient.from(TBL_PAIEMENTS)
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq('wallet_transaction_ref', reference);

    return { ok: true, raison: null };
}

async function refuserDemande(id) {
    const d = demandes.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!d || !peutStatuer(d)) return;

    const champ = document.getElementById('motifAdmin');
    const motif = champ ? champ.value.trim() : '';

    // Un refus sans motif laisse le participant devant un mur.
    if (!motif) {
        showToast('Écrivez le motif du refus : le participant le lira, il doit savoir quoi corriger.', 'warning');
        if (champ) { champ.focus(); champ.classList.add('champ-invalide'); }
        return;
    }

    if (!confirm('Refuser cette demande ?\n\nLe participant verra ce motif :\n\n' + motif)) return;

    showLoader();
    const maintenant = new Date().toISOString();
    const { error } = await supabaseClient.from(TBL_PAIEMENTS).update({
        status: 'rejected',
        admin_reviewed_by: currentUser.id,
        admin_reviewed_at: maintenant,
        admin_comment: motif,
        updated_at: maintenant
    }).eq('id', id);
    hideLoader();

    if (error) { showToast('Refus impossible : ' + error.message, 'error'); return; }

    await journaliser('refuser_paiement', 'demande', id,
                      { status: d.status }, { status: 'rejected' },
                      { tournament_id: d.tournament_id, commentaire: motif,
                        montant: d.amount, currency: d.currency });

    fermerModales();
    showToast('Demande refusée. Le motif est visible par le participant.', 'success');
    await toutCharger();
}

// ═══════════════════════════════════════════════════════════
// 11. ONGLET CATALOGUE
// ═══════════════════════════════════════════════════════════
function rendreCatalogue() {
    const zone = document.getElementById('catalogueZone');
    if (!catalogue.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Le catalogue est vide.</strong>' +
            'Tant qu\'aucun moyen n\'est ouvert ici, aucun organisateur ne peut en activer pour son tournoi.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Nom affiché</th><th>Clé</th><th>Canal</th><th>Preuve</th>' +
        '<th class="num">Ordre</th><th>État</th><th></th>' +
        '</tr></thead><tbody>' +
        catalogue.map(function (m) {
            const canal = m.channel === 'interne'
                ? '<span class="pastille info">Interne</span>'
                : '<span class="pastille">Externe</span>';
            const preuve = m.requires_proof === false
                ? '<span class="pastille">Non exigée</span>'
                : '<span class="pastille oui">Exigée</span>';
            const etat = m.is_active === false
                ? '<span class="pastille non">Inactif</span>'
                : '<span class="pastille oui">Actif</span>';
            return '<tr>' +
                '<td class="cellule-forte">' + escapeHtml(m.display_name || '—') + '</td>' +
                '<td class="cellule-faible">' + escapeHtml(m.method_key || '—') + '</td>' +
                '<td>' + canal + '</td>' +
                '<td>' + preuve + '</td>' +
                '<td class="num">' + escapeHtml(String(m.display_order != null ? m.display_order : 0)) + '</td>' +
                '<td>' + etat + '</td>' +
                '<td class="actions">' +
                    '<button class="btn-mini" data-modifier-moyen="' + escapeHtml(m.id) + '">' +
                        '<i class="fas fa-pen"></i> Modifier</button>' +
                    '<button class="btn-mini" data-basculer-moyen="' + escapeHtml(m.id) + '">' +
                        (m.is_active === false ? '<i class="fas fa-play"></i> Activer'
                                               : '<i class="fas fa-pause"></i> Désactiver') + '</button>' +
                '</td></tr>';
        }).join('') + '</tbody></table>';

    zone.querySelectorAll('[data-modifier-moyen]').forEach(function (b) {
        b.addEventListener('click', function () { ouvrirMoyen(b.dataset.modifierMoyen); });
    });
    zone.querySelectorAll('[data-basculer-moyen]').forEach(function (b) {
        b.addEventListener('click', function () { basculerMoyen(b.dataset.basculerMoyen); });
    });
}

function ouvrirMoyen(id) {
    const m = id ? catalogue.filter(function (x) { return String(x.id) === String(id); })[0] : null;

    document.getElementById('modalMoyenTitre').innerHTML = m
        ? '<i class="fas fa-credit-card"></i> Modifier le moyen'
        : '<i class="fas fa-credit-card"></i> Nouveau moyen';

    document.getElementById('moyenId').value           = m ? m.id : '';
    document.getElementById('moyenCle').value          = m ? (m.method_key || '') : '';
    document.getElementById('moyenCle').disabled       = !!m;
    document.getElementById('moyenNom').value          = m ? (m.display_name || '') : '';
    document.getElementById('moyenCanal').value        = m ? (m.channel || 'externe') : 'externe';
    document.getElementById('moyenOrdre').value        = m ? (m.display_order != null ? m.display_order : 0) : 0;
    document.getElementById('moyenInstructions').value = m ? (m.instructions || '') : '';
    document.getElementById('moyenUrl').value          = m ? (m.redirect_url || '') : '';
    document.getElementById('moyenPreuve').checked     = m ? m.requires_proof !== false : true;
    document.getElementById('moyenActif').checked      = m ? m.is_active !== false : true;

    document.getElementById('modalMoyen').classList.add('ouverte');
}

async function enregistrerMoyen() {
    const id = document.getElementById('moyenId').value;
    const cle = document.getElementById('moyenCle').value.trim();
    const nom = document.getElementById('moyenNom').value.trim();

    if (!cle) { showToast('La clé technique est obligatoire — c\'est elle qui relie ce moyen au code.', 'warning'); return; }
    if (!nom) { showToast('Le nom affiché est obligatoire : c\'est ce que le payeur lira.', 'warning'); return; }

    // Une cle en double casserait la correspondance : deux lignes
    // du catalogue repondraient au meme moyen.
    if (!id && catalogue.some(function (m) { return (m.method_key || '').toLowerCase() === cle.toLowerCase(); })) {
        showToast('Cette clé existe déjà dans le catalogue. Modifiez la ligne existante plutôt que d\'en créer une seconde.', 'warning');
        return;
    }

    const ligne = {
        method_key: cle,
        display_name: nom,
        channel: document.getElementById('moyenCanal').value,
        display_order: Number(document.getElementById('moyenOrdre').value) || 0,
        instructions: document.getElementById('moyenInstructions').value.trim() || null,
        redirect_url: document.getElementById('moyenUrl').value.trim() || null,
        requires_proof: document.getElementById('moyenPreuve').checked,
        is_active: document.getElementById('moyenActif').checked
    };

    showLoader();
    const avant = id ? catalogue.filter(function (x) { return String(x.id) === String(id); })[0] : null;

    let erreur;
    if (id) {
        const r = await supabaseClient.from(TBL_CATALOGUE).update(ligne).eq('id', id);
        erreur = r.error;
    } else {
        const r = await supabaseClient.from(TBL_CATALOGUE).insert([ligne]);
        erreur = r.error;
    }
    hideLoader();

    if (erreur) { showToast('Enregistrement impossible : ' + erreur.message, 'error'); return; }

    await journaliser(id ? 'modifier_moyen' : 'creer_moyen', 'moyen', id || null, avant, ligne, {});

    fermerModales();
    showToast('Moyen de paiement enregistré.', 'success');
    await toutCharger();
}

async function basculerMoyen(id) {
    const m = catalogue.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!m) return;

    const nouvelEtat = m.is_active === false;
    if (!confirm(nouvelEtat
            ? 'Réactiver « ' + (m.display_name || m.method_key) + ' » pour toute la plateforme ?'
            : 'Désactiver « ' + (m.display_name || m.method_key) + ' » ?\n\n' +
              'Les organisateurs ne pourront plus l\'activer pour leurs tournois. ' +
              'Les demandes déjà déposées avec ce moyen ne sont pas touchées.')) return;

    showLoader();
    const { error } = await supabaseClient.from(TBL_CATALOGUE)
        .update({ is_active: nouvelEtat }).eq('id', id);
    hideLoader();

    if (error) { showToast('Modification impossible : ' + error.message, 'error'); return; }

    await journaliser(nouvelEtat ? 'activer_moyen' : 'desactiver_moyen', 'moyen', id,
                      { is_active: m.is_active }, { is_active: nouvelEtat }, {});

    showToast(nouvelEtat ? 'Moyen réactivé.' : 'Moyen désactivé.', 'success');
    await toutCharger();
}

// ═══════════════════════════════════════════════════════════
// 12. ONGLET FLUX FINANCIERS
// ═══════════════════════════════════════════════════════════
function rendreFlux() {
    const zone = document.getElementById('fluxZone');

    // Un seul passage sur les demandes : cumuls par tournoi.
    const parTournoi = {};
    demandes.forEach(function (d) {
        const k = String(d.tournament_id);
        if (!parTournoi[k]) {
            parTournoi[k] = { brut: 0, commission: 0, frais: 0, net: 0,
                              valides: 0, attente: 0, refuses: 0, verses: 0 };
        }
        const c = parTournoi[k];
        if (d.status === 'validated') {
            c.valides++;
            c.brut       += Number(d.amount || 0);
            c.commission += Number(d.commission_amount || 0);
            c.frais      += Number(d.organizer_fee || 0);
            c.net        += Number(d.net_amount || 0);
            if (d.settled) c.verses += Number(d.net_amount || 0);
        } else if (d.status === 'pending' || d.status === 'proof') {
            c.attente++;
        } else if (d.status === 'rejected') {
            c.refuses++;
        }
    });

    const lignes = tournois.filter(function (t) { return parTournoi[String(t.id)]; });

    if (!lignes.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Aucun mouvement pour l\'instant.</strong>' +
            'Un tournoi apparaît ici dès qu\'une demande de paiement y est déposée.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Tournoi</th><th>Organisateur</th>' +
        '<th class="num">Encaissé</th><th class="num">Commission</th><th class="num">Frais</th>' +
        '<th class="num">Net dû</th><th class="num">Net versé</th>' +
        '<th class="num">À traiter</th><th class="num">Solde du compte</th>' +
        '</tr></thead><tbody>' +
        lignes.map(function (t) {
            const c = parTournoi[String(t.id)];
            const w = portefeuilles[t.created_by];
            const devise = t.currency || 'XOF';
            const reste = c.net - c.verses;
            return '<tr>' +
                '<td class="cellule-forte">' + escapeHtml(t.name || 'Sans nom') + '</td>' +
                '<td>' + escapeHtml(nomDe(t.created_by)) + '</td>' +
                '<td class="num">' + montant(c.brut, devise) + '</td>' +
                '<td class="num">' + montant(c.commission, devise) + '</td>' +
                '<td class="num">' + montant(c.frais, devise) + '</td>' +
                '<td class="num">' + montant(c.net, devise) + '</td>' +
                '<td class="num">' + montant(c.verses, devise) +
                    (reste > 0 ? '<br><span class="cellule-faible">reste ' + montant(reste, devise) + '</span>' : '') +
                '</td>' +
                '<td class="num">' + (c.attente > 0
                    ? '<span class="pastille attente">' + c.attente + '</span>'
                    : '<span class="cellule-faible">0</span>') + '</td>' +
                '<td class="num">' + (w
                    ? montant(w.balance, w.currency || devise) +
                      '<br><span class="cellule-faible">' + escapeHtml(w.wallet_ref || '') + '</span>'
                    : '<span class="pastille non">Aucun compte</span>') + '</td>' +
                '</tr>';
        }).join('') + '</tbody></table>';
}

// ═══════════════════════════════════════════════════════════
// 13. ONGLET HONORAIRES
// ═══════════════════════════════════════════════════════════
function rendreHonoraires() {
    const zone = document.getElementById('honorairesZone');

    // Un tournoi sans frais d'organisation n'a rien a regler : il
    // n'encombre pas la liste.
    const lignes = tournois.filter(function (t) { return Number(t.frais_organisation || 0) > 0; });

    if (!lignes.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Aucun honoraire à suivre.</strong>' +
            'Un tournoi apparaît ici dès qu\'un montant est inscrit dans son champ ' +
            '<code>frais_organisation</code>.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Tournoi</th><th>Gestionnaire</th><th class="num">Honoraires</th>' +
        '<th>Statut</th><th>Réglé le</th><th>Référence</th><th></th>' +
        '</tr></thead><tbody>' +
        lignes.map(function (t) {
            const paye = String(t.statut_paiement_gestionnaire || '').toLowerCase() === 'paye' ||
                         String(t.statut_paiement_gestionnaire || '').toLowerCase() === 'payé';
            return '<tr>' +
                '<td class="cellule-forte">' + escapeHtml(t.name || 'Sans nom') + '</td>' +
                '<td>' + escapeHtml(nomDe(t.created_by)) + '</td>' +
                '<td class="num">' + montant(t.frais_organisation, t.currency) + '</td>' +
                '<td>' + (paye
                    ? '<span class="pastille oui"><i class="fas fa-circle-check"></i> Réglé</span>'
                    : '<span class="pastille attente"><i class="fas fa-hourglass-half"></i> À régler</span>') + '</td>' +
                '<td class="cellule-faible">' + date(t.honoraires_payes_le) + '</td>' +
                '<td class="cellule-faible">' + escapeHtml(t.honoraires_reference || '—') + '</td>' +
                '<td class="actions">' + (paye
                    ? '<button class="btn-mini" data-rouvrir-honoraire="' + escapeHtml(t.id) + '">' +
                          '<i class="fas fa-rotate-left"></i> Rouvrir</button>'
                    : '<button class="btn-mini" data-payer-honoraire="' + escapeHtml(t.id) + '">' +
                          '<i class="fas fa-circle-check"></i> Marquer réglé</button>') +
                '</td></tr>';
        }).join('') + '</tbody></table>';

    zone.querySelectorAll('[data-payer-honoraire]').forEach(function (b) {
        b.addEventListener('click', function () { reglerHonoraire(b.dataset.payerHonoraire, true); });
    });
    zone.querySelectorAll('[data-rouvrir-honoraire]').forEach(function (b) {
        b.addEventListener('click', function () { reglerHonoraire(b.dataset.rouvrirHonoraire, false); });
    });
}

async function reglerHonoraire(id, regle) {
    const t = tournois.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!t) return;

    let reference = null;
    if (regle) {
        reference = prompt('Référence du règlement (virement, reçu, transaction) :\n\n' +
                           'Elle sera visible dans la page « Honoraires » du gestionnaire.');
        if (reference === null) return;
        reference = reference.trim();
        if (!reference) {
            showToast('Une référence est nécessaire : sans elle, le gestionnaire ne peut pas rapprocher le versement.', 'warning');
            return;
        }
    } else if (!confirm('Rouvrir cet honoraire ? Il repassera en « à régler ».')) {
        return;
    }

    const maintenant = new Date().toISOString();
    const apres = regle
        ? { statut_paiement_gestionnaire: 'paye', honoraires_payes_le: maintenant,
            honoraires_paye_par: currentUser.id, honoraires_reference: reference }
        : { statut_paiement_gestionnaire: 'en_attente', honoraires_payes_le: null,
            honoraires_paye_par: null, honoraires_reference: null };

    showLoader();
    const { error } = await supabaseClient.from(TBL_TOURNAMENTS).update(apres).eq('id', id);
    hideLoader();

    if (error) { showToast('Modification impossible : ' + error.message, 'error'); return; }

    await journaliser(regle ? 'regler_honoraires' : 'rouvrir_honoraires', 'tournoi', id,
                      { statut_paiement_gestionnaire: t.statut_paiement_gestionnaire }, apres,
                      { tournament_id: id, montant: t.frais_organisation,
                        currency: t.currency, commentaire: reference });

    showToast(regle ? 'Honoraires marqués réglés.' : 'Honoraires rouverts.', 'success');
    await toutCharger();
}

// ═══════════════════════════════════════════════════════════
// 14. ONGLET JOURNAL
// ═══════════════════════════════════════════════════════════
const LIBELLES_ACTION = {
    creer_accord: 'Création d\'accord',
    modifier_accord: 'Modification d\'accord',
    activer_accord: 'Activation d\'accord',
    desactiver_accord: 'Désactivation d\'accord',
    valider_paiement: 'Validation de paiement',
    refuser_paiement: 'Refus de paiement',
    creer_moyen: 'Création d\'un moyen',
    modifier_moyen: 'Modification d\'un moyen',
    activer_moyen: 'Activation d\'un moyen',
    desactiver_moyen: 'Désactivation d\'un moyen',
    regler_honoraires: 'Règlement d\'honoraires',
    rouvrir_honoraires: 'Réouverture d\'honoraires'
};

function rendreJournal() {
    const zone = document.getElementById('journalZone');
    if (!journal.length) {
        zone.innerHTML = '<div class="table-vide"><strong>Le journal est vide.</strong>' +
            'Il se remplira à la première décision prise depuis cette page. ' +
            'S\'il reste vide alors que vous avez agi, c\'est que le script SQL du chantier 09 ' +
            'n\'a pas encore été exécuté — les actions ont bien eu lieu, seule leur trace manque.</div>';
        return;
    }

    zone.innerHTML = '<table class="tableau"><thead><tr>' +
        '<th>Quand</th><th>Qui</th><th>Action</th><th>Cible</th>' +
        '<th class="num">Montant</th><th>Motif</th>' +
        '</tr></thead><tbody>' +
        journal.map(function (j) {
            const cible = j.tournament_id
                ? nomTournoi(j.tournament_id)
                : (j.cible_type ? j.cible_type + ' #' + (j.cible_id || '—') : '—');
            return '<tr>' +
                '<td class="cellule-faible">' + dateHeure(j.created_at) + '</td>' +
                '<td>' + escapeHtml(j.admin_nom || nomDe(j.admin_uuid)) +
                    (j.admin_role ? '<br><span class="cellule-faible">' + escapeHtml(j.admin_role) + '</span>' : '') +
                '</td>' +
                '<td class="cellule-forte">' + escapeHtml(LIBELLES_ACTION[j.action] || j.action || '—') + '</td>' +
                '<td>' + escapeHtml(cible) + '</td>' +
                '<td class="num">' + (j.montant != null ? montant(j.montant, j.currency) : '—') + '</td>' +
                '<td class="cellule-faible">' + escapeHtml(j.commentaire || '—') + '</td>' +
                '</tr>';
        }).join('') + '</tbody></table>';
}

// ═══════════════════════════════════════════════════════════
// 15. NAVIGATION ET MODALES
// ═══════════════════════════════════════════════════════════
function ouvrirOnglet(nom) {
    ongletCourant = nom;
    document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === nom);
    });
    document.querySelectorAll('.tab-content').forEach(function (s) {
        s.classList.remove('active');
    });
    const cible = document.getElementById('tab' + nom.charAt(0).toUpperCase() + nom.slice(1));
    if (cible) cible.classList.add('active');
}

function fermerModales() {
    document.querySelectorAll('.modal').forEach(function (m) { m.classList.remove('ouverte'); });
    document.querySelectorAll('.champ-invalide').forEach(function (c) { c.classList.remove('champ-invalide'); });
}

async function seDeconnecter(e) {
    if (e) e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = '../../../../authprive/users/login.html';
}

// ═══════════════════════════════════════════════════════════
// 16. DEMARRAGE
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {

    // --- Barre laterale ---
    const barre = document.getElementById('leftSidebar');
    const voile = document.getElementById('sidebarOverlay');
    function ouvrirBarre()  { barre.classList.add('ouverte');    voile.classList.add('visible'); }
    function fermerBarre()  { barre.classList.remove('ouverte'); voile.classList.remove('visible'); }
    document.getElementById('menuToggle')?.addEventListener('click', ouvrirBarre);
    document.getElementById('closeSidebar')?.addEventListener('click', fermerBarre);
    voile?.addEventListener('click', fermerBarre);

    // --- Menu utilisateur ---
    document.getElementById('userMenu')?.addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('ouvert');
    });
    document.addEventListener('click', function () {
        document.getElementById('userDropdown')?.classList.remove('ouvert');
    });

    document.getElementById('logoutLink')?.addEventListener('click', seDeconnecter);
    document.getElementById('logoutLinkSidebar')?.addEventListener('click', seDeconnecter);

    // Le selecteur de langue est present parce que tu l'as voulu.
    // Il n'a pas d'effet pour le moment, et n'en aura pas tant que
    // tu ne l'auras pas demande.
    document.getElementById('langSelect')?.addEventListener('change', function (e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });

    // --- Onglets ---
    document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.addEventListener('click', function () { ouvrirOnglet(b.dataset.tab); });
    });

    // --- Modales ---
    document.getElementById('fermerModalAccord')?.addEventListener('click', fermerModales);
    document.getElementById('annulerAccord')?.addEventListener('click', fermerModales);
    document.getElementById('fermerModalDemande')?.addEventListener('click', fermerModales);
    document.getElementById('fermerModalMoyen')?.addEventListener('click', fermerModales);
    document.getElementById('annulerMoyen')?.addEventListener('click', fermerModales);

    // Un clic sur le fond ferme, un clic dans la carte ne ferme
    // pas : sans ce test, saisir un champ refermerait la modale.
    document.querySelectorAll('.modal').forEach(function (m) {
        m.addEventListener('click', function (e) { if (e.target === m) fermerModales(); });
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') fermerModales();
    });

    document.getElementById('btnNouvelAccord')?.addEventListener('click', function () { ouvrirAccord(null); });
    document.getElementById('enregistrerAccord')?.addEventListener('click', enregistrerAccord);
    document.getElementById('btnNouveauMoyen')?.addEventListener('click', function () { ouvrirMoyen(null); });
    document.getElementById('enregistrerMoyen')?.addEventListener('click', enregistrerMoyen);

    // La simulation se recalcule a chaque frappe : un taux se
    // juge sur ce qu'il donne, pas sur ce qu'il vaut.
    ['accordType', 'accordTaux', 'accordFrais', 'accordDevise', 'accordSimulationMontant']
        .forEach(function (id) {
            document.getElementById(id)?.addEventListener('input', rafraichirSimulation);
            document.getElementById(id)?.addEventListener('change', rafraichirSimulation);
        });

    // --- Filtres ---
    ['filtreTournoi', 'filtreStatut', 'filtreOrganisateur'].forEach(function (id) {
        document.getElementById(id)?.addEventListener('change', rendreDemandes);
    });
    document.getElementById('filtreRecherche')?.addEventListener('input', rendreDemandes);

    document.getElementById('btnRafraichir')?.addEventListener('click', function () { toutCharger(); });

    // --- Contrôle d'accès, puis données ---
    const autorise = await verifierAdmin();
    if (!autorise) return;

    await toutCharger();
});
