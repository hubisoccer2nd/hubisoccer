// ========== DEBUT : tournoi/composer-equipe.js (version multi‑sports complète) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   CONFIGURATION DES SPORTS
   ============================================================ */
const SPORT_CONFIG = {
    football: { nbJoueurs: 11, positions: generateFootballPositions(11) },
    football7: { nbJoueurs: 7, positions: generateFootballPositions(7) },
    football5: { nbJoueurs: 5, positions: generateFootballPositions(5) },
    basketball: { nbJoueurs: 5, positions: generateBasketballPositions() },
    handball: { nbJoueurs: 7, positions: generateHandballPositions() },
    rugby: { nbJoueurs: 15, positions: generateRugbyPositions() },
    volleyball: { nbJoueurs: 6, positions: generateVolleyballPositions() },
    default: { nbJoueurs: 11, positions: generateFootballPositions(11) }
};

function generateFootballPositions(nb) {
    const positions = [];
    positions.push({ label: 'Gardien', top: '85%', left: '50%' });
    if (nb >= 2) positions.push({ label: 'Défenseur G', top: '65%', left: '20%' });
    if (nb >= 3) positions.push({ label: 'Défenseur D', top: '65%', left: '80%' });
    if (nb >= 4) positions.push({ label: 'Défenseur central', top: '65%', left: '50%' });
    if (nb >= 5) positions.push({ label: 'Milieu G', top: '40%', left: '25%' });
    if (nb >= 6) positions.push({ label: 'Milieu D', top: '40%', left: '75%' });
    if (nb >= 7) positions.push({ label: 'Milieu central', top: '40%', left: '50%' });
    if (nb >= 8) positions.push({ label: 'Attaquant G', top: '15%', left: '35%' });
    if (nb >= 9) positions.push({ label: 'Attaquant D', top: '15%', left: '65%' });
    if (nb >= 10) positions.push({ label: 'Attaquant central', top: '15%', left: '50%' });
    if (nb >= 11) positions.push({ label: 'Milieu offensif', top: '25%', left: '50%' });
    return positions.slice(0, nb);
}

function generateBasketballPositions() {
    return [
        { label: 'Meneur', top: '50%', left: '50%' },
        { label: 'Arrière G', top: '30%', left: '35%' },
        { label: 'Arrière D', top: '30%', left: '65%' },
        { label: 'Ailier G', top: '70%', left: '30%' },
        { label: 'Ailier D', top: '70%', left: '70%' }
    ];
}

function generateHandballPositions() {
    return [
        { label: 'Gardien', top: '85%', left: '50%' },
        { label: 'Ailier G', top: '60%', left: '15%' },
        { label: 'Arrière G', top: '50%', left: '35%' },
        { label: 'Arrière D', top: '50%', left: '65%' },
        { label: 'Ailier D', top: '60%', left: '85%' },
        { label: 'Pivot', top: '30%', left: '50%' },
        { label: 'Demi-centre', top: '20%', left: '50%' }
    ];
}

function generateRugbyPositions() {
    const pos = [];
    for (let i = 1; i <= 15; i++) {
        pos.push({ label: `Joueur ${i}`, top: `${10 + (i-1)*5}%`, left: `${20 + (i%3)*25}%` });
    }
    return pos;
}

function generateVolleyballPositions() {
    return [
        { label: 'Passeur', top: '40%', left: '50%' },
        { label: 'Pointu', top: '30%', left: '50%' },
        { label: 'Central G', top: '60%', left: '30%' },
        { label: 'Central D', top: '60%', left: '70%' },
        { label: 'Récep. G', top: '20%', left: '30%' },
        { label: 'Récep. D', top: '20%', left: '70%' }
    ];
}

function getConfigForSport(sport) {
    const key = (sport || '').toLowerCase().replace(/[^a-z]/g, '');
    if (key === 'football') return SPORT_CONFIG.football;
    if (key === 'basketball') return SPORT_CONFIG.basketball;
    if (key === 'handball') return SPORT_CONFIG.handball;
    if (key === 'rugby') return SPORT_CONFIG.rugby;
    if (key === 'volleyball') return SPORT_CONFIG.volleyball;
    if (key === 'tennis') return { nbJoueurs: 1, positions: [{ label: 'Joueur', top: '50%', left: '50%' }] };
    return SPORT_CONFIG.default;
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
        'composer.match_passe': 'Ce match est déjà terminé, vous ne pouvez pas modifier la composition',
        'composer.no_players': 'Aucun joueur dans cette équipe. Veuillez d\'abord ajouter des joueurs via "Gérer mon équipe".',
        'composer.reset': 'Réinitialiser',
        'composer.save': 'Enregistrer la composition',
        'composer.titulaires_count': '{count}/{nb} titulaires',
        'composer.terrain_title': 'Terrain',
        'composer.banc_title': 'Remplaçants',
        'composer.terrain_info': 'Faites glisser les joueurs du banc vers les postes souhaités.',
        'composer.banc_info': 'Glissez un joueur hors du terrain pour le remettre sur le banc.',
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
        'composer.not_capitaine': 'You must be the captain to set the lineup',
        'composer.match_passe': 'This match is already finished, you cannot change the lineup',
        'composer.no_players': 'No players in this team. Please add players via "Manage my team".',
        'composer.reset': 'Reset',
        'composer.save': 'Save lineup',
        'composer.titulaires_count': '{count}/{nb} starters',
        'composer.terrain_title': 'Field',
        'composer.banc_title': 'Substitutes',
        'composer.terrain_info': 'Drag players from the bench to the desired positions.',
        'composer.banc_info': 'Drag a player off the field to put them back on the bench.',
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
   GESTION SESSION
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
let matchData = null;
let sportConfig = null;
/* FIN VARIABLES */

/* ============================================================
   UTILITAIRES
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

function showLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('globalLoader'); if (l) l.style.display = 'none'; }
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
        .select('sport')
        .eq('id', tournoiId)
        .single();
    const sport = tournoi?.sport || 'football';
    sportConfig = getConfigForSport(sport);

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
            .select('id, date_match, equipe_domicile_id, equipe_exterieur_id, score_domicile, score_exterieur, statut')
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
        if (matchErr || !match) {
            showToast('Match non trouvé', 'error');
            return;
        }
        matchData = match;
        if (matchData.statut === 'termine') {
            showToast(t('composer.match_passe'), 'warning');
            return;
        }
        if (matchData.equipe_domicile_id !== equipeId && matchData.equipe_exterieur_id !== equipeId) {
            showToast('Votre équipe ne participe pas à ce match', 'error');
            return;
        }

        document.getElementById('matchInfo').innerHTML = `
            <h2>${escapeHtml(matchData.equipe_domicile?.nom_equipe)} vs ${escapeHtml(matchData.equipe_exterieur?.nom_equipe)}</h2>
            <p>Date : ${new Date(matchData.date_match).toLocaleDateString()} | ${matchData.heure ? 'Heure : ' + matchData.heure : ''}</p>
            <p>Sport : ${sportConfig.nbJoueurs} joueurs</p>
        `;

        const { data: sportifs, error: sErr } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('numero_maillot', { ascending: true });
        if (sErr) throw sErr;
        joueurs = sportifs || [];

        const { data: comps, error: cErr } = await supabasePublic
            .from('public_compositions_match')
            .select('*')
            .eq('match_id', idMatch)
            .eq('equipe_id', equipeId);
        if (cErr) throw cErr;

        titulaires = (comps || []).filter(c => c.titulaire).map(c => c.joueur_id);
        titulaires = titulaires.slice(0, sportConfig.nbJoueurs);

        document.getElementById('selectMatchSection').style.display = 'none';
        document.getElementById('compositionSection').style.display = 'block';
        renderTerrain();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des données', 'error');
    } finally {
        hideLoader();
    }
}

/* ============================================================
   RENDU DU TERRAIN ET DU BANC
   ============================================================ */
function renderTerrain() {
    const terrainEl = document.getElementById('terrain');
    const bancEl = document.getElementById('banc');
    const positions = sportConfig.positions;

    // Ajuster la longueur de titulaires
    while (titulaires.length < positions.length) titulaires.push(null);
    if (titulaires.length > positions.length) titulaires = titulaires.slice(0, positions.length);

    let terrainHTML = '';
    positions.forEach((pos, index) => {
        const joueurId = titulaires[index];
        const joueur = joueurId ? joueurs.find(j => j.id == joueurId) : null;
        terrainHTML += `
            <div class="position-slot" data-position="pos${index}" data-index="${index}"
                 ondragover="allowDrop(event)" ondrop="dropOnTerrain(event, ${index})"
                 style="position:absolute; top:${pos.top}; left:${pos.left}; transform:translate(-50%, -50%);">
                <span class="position-label">${pos.label}</span>
                ${joueur ? `
                    <div class="joueur-badge titulaire" draggable="true" data-joueur-id="${joueur.id}" ondragstart="drag(event, ${joueur.id})">
                        ${joueur.numero_maillot ? `<span class="joueur-numero">#${joueur.numero_maillot}</span>` : ''}
                        <span class="joueur-nom">${escapeHtml(joueur.prenom)} ${escapeHtml(joueur.nom)}</span>
                    </div>
                ` : '<div class="position-empty">Vide</div>'}
            </div>
        `;
    });
    terrainEl.innerHTML = terrainHTML;

    // Banc
    const remplacants = joueurs.filter(j => !titulaires.includes(j.id));
    let bancHTML = remplacants.length ? '' : '<p class="empty-message">Tous les joueurs sont sur le terrain.</p>';
    remplacants.forEach(j => {
        bancHTML += `
            <div class="joueur-badge remplacant" draggable="true" data-joueur-id="${j.id}" ondragstart="drag(event, ${j.id})">
                ${j.numero_maillot ? `<span class="joueur-numero">#${j.numero_maillot}</span>` : ''}
                <span class="joueur-nom">${escapeHtml(j.prenom)} ${escapeHtml(j.nom)}</span>
            </div>
        `;
    });
    bancEl.innerHTML = bancHTML;

    // Compteur
    const nb = sportConfig.nbJoueurs;
    const nbTitulaires = titulaires.filter(id => id !== null).length;
    document.getElementById('saveCompositionBtn').disabled = (nbTitulaires !== nb);
    const countEl = document.getElementById('titulairesCount');
    if (countEl) countEl.textContent = t('composer.titulaires_count', { count: nbTitulaires, nb });
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, joueurId) {
    ev.dataTransfer.setData("text/plain", joueurId);
}

function dropOnTerrain(ev, index) {
    ev.preventDefault();
    const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!joueurId) return;
    // Retirer le joueur de sa position actuelle
    titulaires = titulaires.map(id => id === joueurId ? null : id);
    // Placer à l'index
    titulaires[index] = joueurId;
    renderTerrain();
}

// Drop sur le banc
document.addEventListener('DOMContentLoaded', () => {
    const bancEl = document.getElementById('banc');
    if (bancEl) {
        bancEl.addEventListener('dragover', allowDrop);
        bancEl.addEventListener('drop', (ev) => {
            ev.preventDefault();
            const joueurId = parseInt(ev.dataTransfer.getData("text/plain"));
            if (!joueurId) return;
            titulaires = titulaires.map(id => id === joueurId ? null : id);
            renderTerrain();
        });
    }
});

/* ============================================================
   RÉINITIALISER
   ============================================================ */
document.getElementById('resetCompositionBtn').addEventListener('click', () => {
    titulaires = [];
    renderTerrain();
    showToast('Composition réinitialisée', 'info');
});

/* ============================================================
   SAUVEGARDE
   ============================================================ */
document.getElementById('saveCompositionBtn').addEventListener('click', async () => {
    const nbTitulaires = titulaires.filter(id => id !== null).length;
    if (nbTitulaires !== sportConfig.nbJoueurs) {
        showToast(`Vous devez sélectionner exactement ${sportConfig.nbJoueurs} titulaires.`, 'warning');
        return;
    }
    if (!equipeId || !matchId) return;
    showLoader();
    try {
        // Supprimer les anciennes compositions
        const { error: delErr } = await supabasePublic
            .from('public_compositions_match')
            .delete()
            .eq('match_id', matchId)
            .eq('equipe_id', equipeId);
        if (delErr) throw delErr;

        // Insérer les nouvelles
        const compositions = [];
        for (let i = 0; i < titulaires.length; i++) {
            const joueurId = titulaires[i];
            if (joueurId === null) continue;
            const j = joueurs.find(p => p.id == joueurId);
            compositions.push({
                match_id: parseInt(matchId),
                equipe_id: equipeId,
                joueur_id: joueurId,
                titulaire: true,
                poste: j?.role_sportif || null
            });
        }
        // Remplaçants non titulaires
        joueurs.filter(j => !titulaires.includes(j.id)).forEach(j => {
            compositions.push({
                match_id: parseInt(matchId),
                equipe_id: equipeId,
                joueur_id: j.id,
                titulaire: false,
                poste: j.role_sportif || null
            });
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