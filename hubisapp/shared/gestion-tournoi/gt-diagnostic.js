/* ============================================================
   HubISoccer — gt-diagnostic.js
   Systeme Gestion Tournois — l'etat reel de la base
   ------------------------------------------------------------
   CE QUE FAIT CETTE PAGE

   Elle interroge la vraie base de donnees et repond a une seule
   question, sans interpretation : pour chaque table que le
   gestionnaire de tournoi utilise, QUELLES COLONNES EXISTENT
   VRAIMENT ?

   Puis elle ecrit, toute seule, le SQL qui cree ce qui manque.

   ELLE NE MODIFIE RIEN. Aucun INSERT, aucun UPDATE, aucun
   DELETE : uniquement des SELECT ... LIMIT 0. On peut la lancer
   autant de fois qu'on veut, en pleine competition, sans risque.

   COMMENT ELLE S'Y PREND

   PostgREST refuse une requete qui nomme une colonne inconnue,
   avec le code 42703 et le nom de la colonne fautive. On lui
   demande donc d'abord TOUTES les colonnes d'un coup : si ca
   passe, la table est complete et on s'arrete la (une requete).
   Si ca echoue, on redemande colonne par colonne pour savoir
   lesquelles manquent exactement.

   C'est la meme mecanique que celle qui casse les pages ; ici
   on s'en sert pour la diagnostiquer.
   ============================================================ */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════════════════
// 2. OUTILS
// ═══════════════════════════════════════════════════════════
function ech(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function el(id) { return document.getElementById(id); }

// Code d'erreur PostgREST -> ce que ca veut dire, en francais
function expliquer(erreur) {
    if (!erreur) return null;
    const code = erreur.code || '';
    const msg = erreur.message || '';
    if (code === '42P01' || /does not exist/i.test(msg) && /relation/i.test(msg))
        return { genre: 'table-absente', texte: "La table n'existe pas dans la base." };
    if (code === '42703')
        return { genre: 'colonne-absente', texte: 'Colonne inconnue : ' + msg };
    if (code === '42501' || /permission denied/i.test(msg))
        return { genre: 'droits', texte: "Lecture refusée (droits / RLS). La table existe mais l'anon ne peut pas la lire." };
    if (code === 'PGRST301' || /JWT/i.test(msg))
        return { genre: 'droits', texte: 'Session expirée ou jeton refusé.' };
    return { genre: 'autre', texte: (code ? code + ' — ' : '') + msg };
}

// ═══════════════════════════════════════════════════════════
// 3. LES SONDES
// -----------------------------------------------------------
// Toutes en LIMIT 0 : on ne veut pas les donnees, seulement
// savoir si la requete est acceptee.
// ═══════════════════════════════════════════════════════════
async function sonderTable(nom) {
    const { error } = await supabaseClient.from(nom).select('*').limit(0);
    return error ? expliquer(error) : null;
}

async function sonderColonnes(nom, colonnes) {
    // Un seul aller-retour quand tout va bien.
    const { error } = await supabaseClient.from(nom).select(colonnes.join(',')).limit(0);
    if (!error) return { manquantes: [], requetes: 1 };

    const info = expliquer(error);
    if (info.genre === 'droits' || info.genre === 'table-absente') {
        return { manquantes: null, requetes: 1, bloquant: info };
    }

    // Sinon on cherche lesquelles, une par une.
    const manquantes = [];
    let requetes = 1;
    for (let i = 0; i < colonnes.length; i++) {
        const r = await supabaseClient.from(nom).select(colonnes[i]).limit(0);
        requetes++;
        if (r.error) manquantes.push(colonnes[i]);
    }
    return { manquantes: manquantes, requetes: requetes };
}

// ═══════════════════════════════════════════════════════════
// 4. LE PASSAGE COMPLET
// ═══════════════════════════════════════════════════════════
let resultat = null;

async function lancerLeDiagnostic() {
    const bouton = el('btnLancer');
    bouton.disabled = true;
    bouton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyse en cours…';
    el('resultats').innerHTML = '';
    el('sqlBloc').style.display = 'none';
    el('resume').style.display = 'none';

    const tables = window.GTSchema.TABLES;
    const sortie = [];
    let requetes = 0;

    for (let i = 0; i < tables.length; i++) {
        const t = tables[i];
        avancement(i, tables.length, t.nom);

        const absente = await sonderTable(t.nom);
        requetes++;

        if (absente && absente.genre === 'table-absente') {
            sortie.push({ table: t, etat: 'table-absente', manquantes: Object.keys(t.colonnes), info: absente });
            continue;
        }
        if (absente && absente.genre === 'droits') {
            sortie.push({ table: t, etat: 'droits', manquantes: [], info: absente });
            continue;
        }
        if (absente) {
            sortie.push({ table: t, etat: 'erreur', manquantes: [], info: absente });
            continue;
        }

        const r = await sonderColonnes(t.nom, Object.keys(t.colonnes));
        requetes += r.requetes;

        if (r.bloquant) {
            sortie.push({ table: t, etat: 'erreur', manquantes: [], info: r.bloquant });
            continue;
        }
        sortie.push({
            table: t,
            etat: r.manquantes.length ? 'colonnes-absentes' : 'complete',
            manquantes: r.manquantes
        });
    }

    // Les vestiges : une colonne lue par le code mais qu'aucune
    // page n'ecrit. Si elle n'existe pas, la requete qui la
    // nomme echoue EN ENTIER.
    const vestiges = [];
    for (let i = 0; i < window.GTSchema.VESTIGES.length; i++) {
        const v = window.GTSchema.VESTIGES[i];
        const { error } = await supabaseClient.from(v.table).select(v.colonne).limit(0);
        requetes++;
        vestiges.push({ vestige: v, existe: !error, erreur: error ? expliquer(error) : null });
    }

    resultat = { sortie: sortie, vestiges: vestiges, requetes: requetes, quand: new Date() };
    afficher(resultat);

    bouton.disabled = false;
    bouton.innerHTML = '<i class="fas fa-rotate"></i> Relancer l\'analyse';
    el('avancement').style.display = 'none';
}

function avancement(i, total, nom) {
    const z = el('avancement');
    z.style.display = 'block';
    z.innerHTML = '<div class="diag-barre"><span style="width:' +
        Math.round((i / total) * 100) + '%"></span></div>' +
        '<div class="diag-avance-texte">Table ' + (i + 1) + ' sur ' + total + ' — ' +
        ech(nom.replace('supabaseAuthPrive_', '')) + '</div>';
}

// ═══════════════════════════════════════════════════════════
// 5. L'AFFICHAGE
// ═══════════════════════════════════════════════════════════
function afficher(r) {
    const completes = r.sortie.filter(function (x) { return x.etat === 'complete'; }).length;
    const absentes  = r.sortie.filter(function (x) { return x.etat === 'table-absente'; });
    const trouees   = r.sortie.filter(function (x) { return x.etat === 'colonnes-absentes'; });
    const soucis    = r.sortie.filter(function (x) { return x.etat === 'droits' || x.etat === 'erreur'; });
    const colonnesManquantes = r.sortie.reduce(function (n, x) { return n + x.manquantes.length; }, 0);

    // --- Le bandeau de résumé
    const resume = el('resume');
    resume.style.display = 'block';
    resume.className = 'diag-resume ' +
        (absentes.length || colonnesManquantes ? 'diag-resume-alerte' : 'diag-resume-ok');
    resume.innerHTML =
        '<div class="diag-resume-titre">' +
            (absentes.length || colonnesManquantes
                ? '<i class="fas fa-triangle-exclamation"></i> La base ne correspond pas à ce que le code attend'
                : '<i class="fas fa-circle-check"></i> La base correspond à ce que le code attend') +
        '</div>' +
        '<div class="diag-chiffres">' +
            chiffre(completes, 'table(s) complète(s)', 'ok') +
            chiffre(absentes.length, 'table(s) absente(s)', absentes.length ? 'ko' : 'neutre') +
            chiffre(trouees.length, 'table(s) incomplète(s)', trouees.length ? 'ko' : 'neutre') +
            chiffre(colonnesManquantes, 'colonne(s) manquante(s)', colonnesManquantes ? 'ko' : 'neutre') +
            chiffre(soucis.length, 'table(s) illisible(s)', soucis.length ? 'attention' : 'neutre') +
        '</div>' +
        '<div class="diag-resume-pied">' + r.requetes + ' requêtes de lecture, aucune écriture · ' +
        r.quand.toLocaleString('fr-FR') + '</div>';

    // --- Le détail table par table
    let html = '';
    r.sortie.forEach(function (x) {
        const t = x.table;
        const total = Object.keys(t.colonnes).length;
        const manque = x.manquantes.length;

        const pastille = x.etat === 'complete'       ? '<span class="diag-pastille ok">complète</span>'
                       : x.etat === 'table-absente'  ? '<span class="diag-pastille ko">table absente</span>'
                       : x.etat === 'colonnes-absentes' ? '<span class="diag-pastille ko">' + manque + ' colonne(s) manquante(s)</span>'
                       : x.etat === 'droits'         ? '<span class="diag-pastille attention">lecture refusée</span>'
                       : '<span class="diag-pastille attention">erreur</span>';

        html += '<section class="diag-table' + (x.etat === 'complete' ? ' diag-table-ok' : '') + '">' +
            '<header class="diag-table-tete">' +
                '<div>' +
                    '<h3>' + ech(t.nom.replace('supabaseAuthPrive_', '')) + '</h3>' +
                    '<p class="diag-module">' + ech(t.module) + ' · ' + total + ' colonnes attendues</p>' +
                '</div>' + pastille +
            '</header>';

        if (x.etat !== 'complete') {
            html += '<p class="diag-casse"><i class="fas fa-circle-exclamation"></i> ' + ech(t.casse) + '</p>';
            html += '<p class="diag-pages"><b>Pages touchées :</b> ' + t.pages.map(ech).join(' · ') + '</p>';
        }

        if (x.info) {
            html += '<p class="diag-message"><code>' + ech(x.info.texte) + '</code></p>';
        }

        if (manque) {
            html += '<div class="diag-colonnes">' +
                x.manquantes.map(function (c) {
                    return '<span class="diag-col">' + ech(c) +
                           '<em>' + ech(t.colonnes[c]) + '</em></span>';
                }).join('') + '</div>';
        }

        html += '</section>';
    });

    // --- Les vestiges
    r.vestiges.forEach(function (v) {
        if (v.existe) return;
        html += '<section class="diag-table diag-vestige">' +
            '<header class="diag-table-tete">' +
                '<div><h3>' + ech(v.vestige.colonne) + '</h3>' +
                '<p class="diag-module">colonne lue par le code, écrite par personne · ' +
                ech(v.vestige.table.replace('supabaseAuthPrive_', '')) + '</p></div>' +
                '<span class="diag-pastille ko">n\'existe pas</span>' +
            '</header>' +
            '<p class="diag-casse"><i class="fas fa-circle-exclamation"></i> ' + ech(v.vestige.note) + '</p>' +
            '<p class="diag-pages"><b>Lue par :</b> ' + v.vestige.lue_par.map(ech).join(' · ') + '</p>' +
            '</section>';
    });

    el('resultats').innerHTML = html;

    // --- Le SQL de réparation
    const sql = engendrerSql(r);
    if (sql) {
        el('sqlBloc').style.display = 'block';
        el('sqlTexte').textContent = sql;
    }
}

function chiffre(n, libelle, ton) {
    return '<div class="diag-chiffre ' + ton + '"><b>' + n + '</b><span>' + libelle + '</span></div>';
}

// ═══════════════════════════════════════════════════════════
// 6. LE SQL DE RÉPARATION
// -----------------------------------------------------------
// Uniquement CREATE TABLE IF NOT EXISTS et ADD COLUMN IF NOT
// EXISTS. Aucun DROP, aucun DELETE, aucun TRUNCATE, aucune
// POLICY : rien de ce qui est deja en base n'est touche.
// ═══════════════════════════════════════════════════════════
function engendrerSql(r) {
    const morceaux = [];
    let rien = true;

    r.sortie.forEach(function (x) {
        const t = x.table;

        if (x.etat === 'table-absente') {
            rien = false;
            const cols = Object.keys(t.colonnes).map(function (c) {
                if (c === 'id') return '    id uuid PRIMARY KEY DEFAULT gen_random_uuid()';
                let type = t.colonnes[c];
                let defaut = '';
                if (type === 'boolean') defaut = ' DEFAULT false';
                if (type === 'integer' || type === 'numeric') defaut = ' DEFAULT 0';
                if (c === 'created_at' || c === 'updated_at') defaut = ' DEFAULT now()';
                return '    ' + c + ' ' + type + defaut;
            });
            morceaux.push(
                '-- ' + t.module + ' — la table n\'existait pas\n' +
                'CREATE TABLE IF NOT EXISTS public."' + t.nom + '" (\n' +
                cols.join(',\n') + '\n);');
            return;
        }

        if (x.manquantes.length) {
            rien = false;
            const lignes = x.manquantes.map(function (c) {
                let type = t.colonnes[c];
                let defaut = '';
                if (type === 'boolean') defaut = ' DEFAULT false';
                if (c === 'created_at' || c === 'updated_at') defaut = ' DEFAULT now()';
                return 'ALTER TABLE public."' + t.nom + '"\n' +
                       '    ADD COLUMN IF NOT EXISTS ' + c + ' ' + type + defaut + ';';
            });
            morceaux.push('-- ' + t.module + ' — ' + x.manquantes.length + ' colonne(s)\n' +
                          lignes.join('\n'));
        }
    });

    r.vestiges.forEach(function (v) {
        if (v.existe) return;
        rien = false;
        morceaux.push(
            '-- ' + v.vestige.colonne + ' : le code la lit encore.\n' +
            '-- Deux réparations possibles : créer la colonne (ci-dessous),\n' +
            '-- ou retirer sa lecture du code. Le correctif livré fait la seconde ;\n' +
            '-- cette ligne est là au cas où tu préfères la première.\n' +
            'ALTER TABLE public."' + v.vestige.table + '"\n' +
            '    ADD COLUMN IF NOT EXISTS ' + v.vestige.colonne + ' text;');
    });

    if (rien) return null;

    return '-- ════════════════════════════════════════════════════════\n' +
           '-- HubISoccer — réparation engendrée par gt-diagnostic\n' +
           '-- ' + r.quand.toLocaleString('fr-FR') + '\n' +
           '--\n' +
           '-- Ce script est NON DESTRUCTIF : uniquement CREATE TABLE IF\n' +
           '-- NOT EXISTS et ADD COLUMN IF NOT EXISTS. Aucun DROP, aucun\n' +
           '-- DELETE, aucun TRUNCATE, aucune POLICY. Rien de ce qui est\n' +
           '-- déjà en base n\'est modifié ni supprimé.\n' +
           '--\n' +
           '-- À coller dans Supabase → SQL Editor → Run.\n' +
           '-- Relance ensuite le diagnostic : tout doit passer au vert.\n' +
           '-- ════════════════════════════════════════════════════════\n\n' +
           morceaux.join('\n\n') + '\n';
}

// ═══════════════════════════════════════════════════════════
// 7. MISE EN PLACE
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    el('attendu').textContent = window.GTSchema.TABLES.length + ' tables · ' +
        window.GTSchema.total() + ' colonnes';

    el('btnLancer').addEventListener('click', lancerLeDiagnostic);

    el('btnCopier').addEventListener('click', function () {
        const texte = el('sqlTexte').textContent;
        navigator.clipboard.writeText(texte).then(function () {
            el('btnCopier').innerHTML = '<i class="fas fa-check"></i> Copié';
            setTimeout(function () {
                el('btnCopier').innerHTML = '<i class="fas fa-copy"></i> Copier le SQL';
            }, 2500);
        }).catch(function () {
            // Certains navigateurs mobiles refusent le presse-papiers :
            // on sélectionne le texte, l'utilisateur fait « copier ».
            const plage = document.createRange();
            plage.selectNodeContents(el('sqlTexte'));
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(plage);
            el('btnCopier').innerHTML = '<i class="fas fa-hand-pointer"></i> Sélectionné — fais « Copier »';
        });
    });

    el('btnTelecharger').addEventListener('click', function () {
        const texte = el('sqlTexte').textContent;
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(new Blob([texte], { type: 'text/plain;charset=utf-8' }));
        lien.download = 'hubisoccer-reparation-base.sql';
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(lien.href);
    });
});
