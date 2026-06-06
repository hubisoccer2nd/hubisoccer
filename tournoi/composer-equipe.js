// ========== DEBUT : tournoi/composer-equipe.js (version complète, sans troncature) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   CONFIGURATION DES POSTES PAR SPORT ET FORMAT
   ============================================================ */
const POSTES = {
    football: {
        11: ['Gardien','Défenseur central','Défenseur G','Défenseur D','Milieu défensif','Milieu G','Milieu D','Milieu offensif','Attaquant G','Attaquant D','Attaquant centre'],
        7: ['Gardien','Défenseur G','Défenseur D','Milieu G','Milieu D','Attaquant G','Attaquant D'],
        5: ['Gardien','Défenseur','Milieu','Attaquant G','Attaquant D']
    },
    basketball: {
        5: ['Meneur','Arrière','Ailier','Ailier fort','Pivot']
    },
    handball: {
        7: ['Gardien','Ailier G','Arrière G','Demi-centre','Arrière D','Ailier D','Pivot']
    },
    rugby: {
        15: ['Pilier G','Talonneur','Pilier D','Deuxième ligne G','Deuxième ligne D','Troisième ligne aile G','Troisième ligne aile D','Troisième ligne centre','Demi de mêlée','Demi d\'ouverture','Ailier G','Centre G','Centre D','Ailier D','Arrière']
    },
    volleyball: {
        6: ['Passeur','Pointu','Central G','Central D','Réceptionneur-attaquant G','Réceptionneur-attaquant D']
    }
};

function getPostesForSport(sport, nbJoueurs) {
    const key = (sport || '').toLowerCase().replace(/[^a-z]/g, '');
    if (POSTES[key] && POSTES[key][nbJoueurs]) {
        return POSTES[key][nbJoueurs];
    }
    return Array.from({ length: nbJoueurs }, (_, i) => `Joueur ${i+1}`);
}

/* ============================================================
   TRADUCTIONS
   ============================================================ */
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'composer.logout': 'Déconnexion',
        'composer.dashboard': 'Tableau de bord',
        'composer.equipe': 'Mon équipe',
        'composer.matchs': 'Matchs',
        'composer.classement': 'Classement',
        'composer.messagerie': 'Messages',
        'composer.portefeuille': 'Portefeuille',
        'composer.title': 'Composition d\'équipe',
        'composer.select_match': 'Sélectionnez un match à composer',
        'composer.composer_btn': 'Composer',
        'composer.saved': 'Composition enregistrée avec succès',
        'composer.error': 'Erreur lors de l\'enregistrement',
        'composer.not_capitaine': 'Vous devez être capitaine pour composer l\'équipe',
        'composer.match_passe': 'Ce match est déjà terminé',
        'composer.no_players': 'Aucun joueur dans cette équipe.',
        'composer.reset': 'Réinitialiser',
        'composer.save': 'Enregistrer la composition',
        'composer.titulaires_count': '{count}/{nb} titulaires',
        'composer.terrain_title': 'Terrain',
        'composer.banc_title': 'Remplaçants',
        'composer.terrain_info': 'Faites glisser les joueurs du banc vers les postes souhaités.',
        'composer.banc_info': 'Glissez un joueur ici pour le remettre sur le banc.',
        'composer.capitaine_toggle': 'Définir/retirer comme capitaine',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.'
    },
    en: {
        'loader.message': 'Loading...',
        'composer.logout': 'Logout',
        'composer.dashboard': 'Dashboard',
        'composer.equipe': 'My team',
        'composer.matchs': 'Matches',
        'composer.classement': 'Ranking',
        'composer.messagerie': 'Messages',
        'composer.portefeuille': 'Wallet',
        'composer.title': 'Team lineup',
        'composer.select_match': 'Select a match to compose',
        'composer.composer_btn': 'Compose',
        'composer.saved': 'Lineup saved successfully',
        'composer.error': 'Error saving lineup',
        'composer.not_capitaine': 'You must be the captain',
        'composer.match_passe': 'Match already finished',
        'composer.no_players': 'No players in this team.',
        'composer.reset': 'Reset',
        'composer.save': 'Save lineup',
        'composer.titulaires_count': '{count}/{nb} starters',
        'composer.terrain_title': 'Field',
        'composer.banc_title': 'Substitutes',
        'composer.terrain_info': 'Drag players from the bench to the desired positions.',
        'composer.banc_info': 'Drag a player here to move them back to the bench.',
        'composer.capitaine_toggle': 'Toggle captain',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    }
};

let currentLang = localStorage.getItem('composer_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) el.placeholder = t(key);
            else el.innerHTML = t(key);
        }
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('composer_lang', lang);
        applyTranslations();
        initialiserPage();
    }
}
/* FIN TRADUCTIONS */

/* ============================================================
   SESSION
   ============================================================ */
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const userLogin = sessionStorage.getItem('tournoi_login');
const userRole = sessionStorage.getItem('tournoi_role');

if (!userId) window.location.href = 'connexion-tournoi.html';
document.getElementById('userName').textContent = userNom || userLogin;

const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');
/* FIN SESSION */

/* ============================================================
   VARIABLES GLOBALES
   ============================================================ */
let equipeId = null;
let joueurs = [];
let titulaires = [];
let nbTitulairesRequis = 0;
let postes = [];
let capitaineJoueurId = null;
let matchData = null;
/* FIN VARIABLES */

/* ============================================================
   UTILITAIRES (COMPLÈTES)
   ============================================================ */
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}
/* FIN UTILITAIRES */

/* ============================================================
   INITIALISATION
   ============================================================ */
async function initialiserPage() {
    if (userRole !== 'capitaine') {
        showToast(t('composer.not_capitaine'), 'error');
        return;
    }
    const { data: equipe, error: eqErr } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe, tournoi_id')
        .eq('capitaine_id', userId)
        .single();
    if (eqErr || !equipe) {
        showToast('Vous n\'êtes capitaine d\'aucune équipe', 'error');
        return;
    }
    equipeId = equipe.id;

    const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');
    const { data: tournoi } = await supabasePublic
        .from('public_tournois')
        .select('sport, format_equipe')
        .eq('id', tournoiId)
        .single();
    nbTitulairesRequis = tournoi?.format_equipe || 11;
    const sport = tournoi?.sport || 'football';
    postes = getPostesForSport(sport, nbTitulairesRequis);

    if (matchId) {
        await chargerCompositionMatch(matchId);
    } else {
        await afficherProchainsMatchs();
    }
}

/* ============================================================
   AFFICHAGE LISTE DES MATCHS À VENIR
   ============================================================ */
async function afficherProchainsMatchs() {
    showLoader();
    try {
        const { data: matchs, error } = await supabasePublic
            .from('public_matchs')
            .select('id, date_match, equipe_domicile_id, equipe_exterieur_id, statut')
            .or(`equipe_domicile_id.eq.${equipeId},equipe_exterieur_id.eq.${equipeId}`)
            .eq('statut', 'a_venir')
            .order('date_match', { ascending: true });

        if (error) throw error;

        document.getElementById('selectMatchSection').style.display = 'block';
        document.getElementById('compositionSection').style.display = 'none';

        const container = document.getElementById('matchsList');
        if (!matchs || matchs.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun match à venir.</p>';
            return;
        }

        const ids = new Set();
        matchs.forEach(m => { ids.add(m.equipe_domicile_id); ids.add(m.equipe_exterieur_id); });
        const { data: equipes } = await supabasePublic
            .from('public_equipes')
            .select('id, nom_equipe')
            .in('id', Array.from(ids));
        const equipeMap = {};
        equipes.forEach(e => equipeMap[e.id] = e.nom_equipe);

        let html = '';
        matchs.forEach(m => {
            const dom = equipeMap[m.equipe_domicile_id] || '?';
            const ext = equipeMap[m.equipe_exterieur_id] || '?';
            html += `
                <div class="match-item">
                    <div class="teams">${escapeHtml(dom)} vs ${escapeHtml(ext)}</div>
                    <div class="date">${new Date(m.date_match).toLocaleDateString()}</div>
                    <a href="composer-equipe.html?id=${m.id}" class="btn-composer">${t('composer.composer_btn')}</a>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
    } finally {
        hideLoader();
    }
}

/* ============================================================
   CHARGEMENT COMPOSITION POUR UN MATCH DONNÉ
   ============================================================ */
async function chargerCompositionMatch(idMatch) {
    showLoader();
    try {
        const { data: match, error: matchErr } = await supabasePublic
            .from('public_matchs')
            .select('*, equipe_domicile:equipe_domicile_id (id, nom_equipe), equipe_exterieur:equipe_exterieur_id (id, nom_equipe)')
            .eq('id', idMatch)
            .single();
        if (matchErr || !match) { showToast('Match non trouvé', 'error'); return; }
        if (match.statut === 'termine') { showToast(t('composer.match_passe'), 'warning'); return; }
        if (match.equipe_domicile_id !== equipeId && match.equipe_exterieur_id !== equipeId) {
            showToast('Votre équipe ne participe pas à ce match', 'error');
            return;
        }
        matchData = match;

        document.getElementById('matchInfo').innerHTML = `
            <h2>${escapeHtml(match.equipe_domicile?.nom_equipe)} vs ${escapeHtml(match.equipe_exterieur?.nom_equipe)}</h2>
            <p>Date : ${new Date(match.date_match).toLocaleDateString()} | Format : ${nbTitulairesRequis} joueurs</p>
        `;

        const { data: sportifs } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('numero_maillot', { ascending: true });
        joueurs = sportifs || [];

        const { data: comps } = await supabasePublic
            .from('public_compositions_match')
            .select('*')
            .eq('match_id', idMatch)
            .eq('equipe_id', equipeId);
        titulaires = new Array(nbTitulairesRequis).fill(null);
        capitaineJoueurId = null;
        if (comps) {
            const titulairesList = comps.filter(c => c.titulaire);
            for (let i = 0; i < Math.min(titulairesList.length, nbTitulairesRequis); i++) {
                titulaires[i] = titulairesList[i].joueur_id;
            }
            const cap = comps.find(c => c.capitaine === true);
            if (cap) capitaineJoueurId = cap.joueur_id;
        }

        document.getElementById('selectMatchSection').style.display = 'none';
        document.getElementById('compositionSection').style.display = 'block';
        renderInterface();
    } catch (err) {
        console.error(err);
        showToast(t('composer.error'), 'error');
    } finally {
        hideLoader();
    }
}

/* ============================================================
   RENDU DE L'INTERFACE (TERRAIN + BANC)
   ============================================================ */
function renderInterface() {
    renderTerrain();
    renderBanc();
    updateCompteur();
}

function renderTerrain() {
    const terrainEl = document.getElementById('terrain');
    if (!terrainEl) return;

    let html = '';
    postes.forEach((poste, index) => {
        const joueurId = titulaires[index];
        const joueur = joueurId ? joueurs.find(j => j.id == joueurId) : null;
        const isCapitaine = (joueurId && joueurId === capitaineJoueurId);
        html += `
            <div class="position-slot" data-index="${index}" ondragover="allowDrop(event)" ondrop="dropOnTerrain(event, ${index})"
                 style="position:absolute; top:${getTopForIndex(index, postes.length)}%; left:${getLeftForIndex(index, postes.length)}%; transform:translate(-50%, -50%);">
                <span class="position-label">${poste}</span>
                ${joueur ? `
                    <div class="joueur-badge titulaire" draggable="true" data-joueur-id="${joueur.id}" ondragstart="drag(event, ${joueur.id})">
                        ${joueur.numero_maillot ? `<span class="joueur-numero">#${joueur.numero_maillot}</span>` : ''}
                        <span class="joueur-nom">${escapeHtml(joueur.prenom)} ${escapeHtml(joueur.nom)}</span>
                        <i class="fas fa-star ${isCapitaine ? 'capitaine-etoile-active' : 'capitaine-etoile'}" 
                           data-joueur-id="${joueur.id}" 
                           onclick="toggleCapitaine(event, ${joueur.id})" 
                           title="${t('composer.capitaine_toggle')}"></i>
                    </div>
                ` : '<div class="position-empty">Vide</div>'}
            </div>
        `;
    });
    terrainEl.innerHTML = html;
}

function renderBanc() {
    const bancEl = document.getElementById('banc');
    if (!bancEl) return;
    const remplacants = joueurs.filter(j => !titulaires.includes(j.id));
    let html = '';
    if (remplacants.length === 0) {
        html = '<p class="empty-message">Tous les joueurs sont sur le terrain.</p>';
    } else {
        remplacants.forEach(j => {
            html += `
                <div class="joueur-badge remplacant" draggable="true" data-joueur-id="${j.id}" ondragstart="drag(event, ${j.id})">
                    ${j.numero_maillot ? `<span class="joueur-numero">#${j.numero_maillot}</span>` : ''}
                    <span class="joueur-nom">${escapeHtml(j.prenom)} ${escapeHtml(j.nom)}</span>
                </div>
            `;
        });
    }
    bancEl.innerHTML = html;
    bancEl.setAttribute('ondragover', 'allowDrop(event)');
    bancEl.setAttribute('ondrop', 'dropOnBanc(event)');
}

function getTopForIndex(index, total) {
    if (index < 1) return 85;
    if (index < 1+3) return 65;
    if (index < 1+3+4) return 40;
    return 15;
}

function getLeftForIndex(index, total) {
    const leftMap = { 0: 50, 1: 20, 2: 50, 3: 80, 4: 25, 5: 50, 6: 75, 7: 50, 8: 35, 9: 50, 10: 65 };
    return leftMap[index] || 50;
}

function updateCompteur() {
    const nb = nbTitulairesRequis;
    const count = titulaires.filter(id => id !== null).length;
    const compteurEl = document.getElementById('titulairesCount');
    if (compteurEl) {
        compteurEl.textContent = t('composer.titulaires_count', { count, nb });
        compteurEl.className = count === nb ? 'compteur ok' : 'compteur pas-ok';
    }
    document.getElementById('saveCompositionBtn').disabled = (count !== nb);
}

/* ============================================================
   GESTION DU CAPITAINE
   ============================================================ */
function toggleCapitaine(event, joueurId) {
    event.stopPropagation();
    if (capitaineJoueurId === joueurId) {
        capitaineJoueurId = null;
    } else {
        capitaineJoueurId = joueurId;
    }
    renderTerrain();
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
function allowDrop(ev) { ev.preventDefault(); }

function drag(ev, joueurId) {
    ev.dataTransfer.setData("text/plain", joueurId);
}

function dropOnTerrain(ev, index) {
    ev.preventDefault();
    const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!joueurId) return;

    const oldIndex = titulaires.indexOf(joueurId);
    if (oldIndex !== -1) titulaires[oldIndex] = null;

    titulaires[index] = joueurId;
    renderInterface();
}

function dropOnBanc(ev) {
    ev.preventDefault();
    const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!joueurId) return;
    const index = titulaires.indexOf(joueurId);
    if (index !== -1) titulaires[index] = null;
    renderInterface();
}

/* ============================================================
   RÉINITIALISER
   ============================================================ */
document.getElementById('resetCompositionBtn').addEventListener('click', () => {
    titulaires = new Array(nbTitulairesRequis).fill(null);
    capitaineJoueurId = null;
    renderInterface();
    showToast('Composition réinitialisée', 'info');
});

/* ============================================================
   SAUVEGARDE
   ============================================================ */
document.getElementById('saveCompositionBtn').addEventListener('click', async () => {
    const nbTitulairesActuels = titulaires.filter(id => id !== null).length;
    if (nbTitulairesActuels !== nbTitulairesRequis) {
        showToast(`Vous devez avoir exactement ${nbTitulairesRequis} titulaires.`, 'warning');
        return;
    }
    if (!equipeId || !matchId) return;
    showLoader();
    try {
        const { error: delErr } = await supabasePublic
            .from('public_compositions_match')
            .delete()
            .eq('match_id', matchId)
            .eq('equipe_id', equipeId);
        if (delErr) throw delErr;

        const compositions = [];
        titulaires.forEach((joueurId, index) => {
            if (joueurId) {
                const j = joueurs.find(p => p.id == joueurId);
                compositions.push({
                    match_id: parseInt(matchId),
                    equipe_id: equipeId,
                    joueur_id: joueurId,
                    titulaire: true,
                    poste: postes[index],
                    capitaine: joueurId === capitaineJoueurId
                });
            }
        });
        joueurs.forEach(j => {
            if (!titulaires.includes(j.id)) {
                compositions.push({
                    match_id: parseInt(matchId),
                    equipe_id: equipeId,
                    joueur_id: j.id,
                    titulaire: false,
                    poste: null,
                    capitaine: false
                });
            }
        });

        if (compositions.length) {
            const { error: insErr } = await supabasePublic
                .from('public_compositions_match')
                .insert(compositions);
            if (insErr) throw insErr;
        }
        showToast(t('composer.saved'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('composer.error'), 'error');
    } finally {
        hideLoader();
    }
});

/* ============================================================
   DÉCONNEXION
   ============================================================ */
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

/* ============================================================
   MENU MOBILE & LANGUE
   ============================================================ */
function initMenuMobile() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
    }
}

function initLangSelector() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
}

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    initialiserPage();
});
// ========== FIN : tournoi/composer-equipe.js ==========