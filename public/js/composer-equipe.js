// ========== COMPOSER-EQUIPE.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
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
        'composer.titulaires': 'Titulaires',
        'composer.remplacants': 'Remplaçants',
        'composer.save': 'Enregistrer la composition',
        'composer.saved': 'Composition enregistrée avec succès',
        'composer.error': 'Erreur lors de l\'enregistrement',
        'composer.not_capitaine': 'Vous devez être capitaine pour composer l\'équipe',
        'composer.match_passe': 'Ce match est déjà terminé, vous ne pouvez pas modifier la composition',
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
        'composer.titulaires': 'Starters',
        'composer.remplacants': 'Substitutes',
        'composer.save': 'Save lineup',
        'composer.saved': 'Lineup saved successfully',
        'composer.error': 'Error saving lineup',
        'composer.not_capitaine': 'You must be the captain to set the lineup',
        'composer.match_passe': 'This match is already finished, you cannot change the lineup',
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
        chargerComposition();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userNom = sessionStorage.getItem('tournoi_nom');
const userRole = sessionStorage.getItem('tournoi_role');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== RÉCUPÉRATION ID MATCH ==========
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');
if (!matchId) {
    window.location.href = 'matchs.html';
}

// ========== VARIABLES GLOBALES ==========
let matchData = null;
let equipeId = null;
let joueurs = [];

// ========== CHARGEMENT DES DONNÉES ==========
async function chargerComposition() {
    showLoader();
    try {
        // Vérifier que l'utilisateur est capitaine
        if (userRole !== 'capitaine') {
            showToast(t('composer.not_capitaine'), 'error');
            document.getElementById('compositionForm').style.display = 'none';
            return;
        }

        // Récupérer les infos du match et vérifier qu'il n'est pas terminé
        const { data: match, error: matchErr } = await supabasePublic
            .from('public_matchs')
            .select('*, equipe_domicile:equipe_domicile_id (id, nom_equipe), equipe_exterieur:equipe_exterieur_id (id, nom_equipe)')
            .eq('id', matchId)
            .single();
        if (matchErr || !match) {
            showToast('Match non trouvé', 'error');
            return;
        }
        matchData = match;
        if (matchData.statut === 'termine') {
            showToast(t('composer.match_passe'), 'warning');
            document.getElementById('compositionForm').style.display = 'none';
            return;
        }

        // Déterminer l'équipe de l'utilisateur (capitaine)
        const { data: equipe, error: eqErr } = await supabasePublic
            .from('public_equipes')
            .select('id, nom_equipe')
            .eq('capitaine_id', userId)
            .single();
        if (eqErr || !equipe) {
            showToast('Vous n\'êtes capitaine d\'aucune équipe', 'error');
            return;
        }
        equipeId = equipe.id;
        // Vérifier que l'équipe participe à ce match
        if (matchData.equipe_domicile_id !== equipeId && matchData.equipe_exterieur_id !== equipeId) {
            showToast('Cette équipe ne participe pas à ce match', 'error');
            return;
        }

        // Afficher l'en-tête du match
        document.getElementById('matchInfo').innerHTML = `
            <h2>${escapeHtml(matchData.equipe_domicile?.nom_equipe)} vs ${escapeHtml(matchData.equipe_exterieur?.nom_equipe)}</h2>
            <p>Date : ${new Date(matchData.date_match).toLocaleDateString()} | ${matchData.heure ? 'Heure : ' + matchData.heure : ''}</p>
        `;

        // Charger les joueurs de l'équipe
        const { data: sportifs, error: sErr } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('numero_maillot', { ascending: true });
        if (sErr) throw sErr;
        joueurs = sportifs || [];

        // Charger la composition existante pour ce match
        const { data: comps, error: cErr } = await supabasePublic
            .from('public_compositions_match')
            .select('*')
            .eq('match_id', matchId)
            .eq('equipe_id', equipeId);
        if (cErr) throw cErr;
        const compositionMap = {};
        for (const c of comps || []) {
            compositionMap[c.joueur_id] = c.titulaire;
        }

        // Afficher les joueurs avec checkbox titulaire
        renderJoueurs(compositionMap);
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement des données', 'error');
    } finally {
        hideLoader();
    }
}

function renderJoueurs(compositionMap) {
    const container = document.getElementById('joueursList');
    if (!joueurs.length) {
        container.innerHTML = '<div class="empty-message">Aucun joueur dans cette équipe. Veuillez d\'abord ajouter des joueurs via "Gérer mon équipe".</div>';
        return;
    }
    let html = '';
    for (const j of joueurs) {
        const estTitulaire = compositionMap[j.id] !== undefined ? compositionMap[j.id] : true; // Par défaut titulaire
        html += `
            <div class="joueur-item" data-joueur-id="${j.id}">
                <div class="joueur-info">
                    <span class="joueur-nom">${escapeHtml(j.prenom)} ${escapeHtml(j.nom)}</span>
                    ${j.numero_maillot ? `<span class="joueur-numero">#${j.numero_maillot}</span>` : ''}
                    ${j.role_sportif ? `<div class="joueur-poste">${escapeHtml(j.role_sportif)}</div>` : ''}
                </div>
                <div class="titulaire-toggle">
                    <label>Titulaire</label>
                    <input type="checkbox" class="titulaire-checkbox" ${estTitulaire ? 'checked' : ''}>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ========== SAUVEGARDE DE LA COMPOSITION ==========
document.getElementById('saveCompositionBtn').addEventListener('click', async () => {
    showLoader();
    try {
        // Récupérer les valeurs des checkboxes
        const checkboxes = document.querySelectorAll('.titulaire-checkbox');
        const compositions = [];
        for (let i = 0; i < joueurs.length; i++) {
            const estTitulaire = checkboxes[i].checked;
            compositions.push({
                match_id: parseInt(matchId),
                equipe_id: equipeId,
                joueur_id: joueurs[i].id,
                titulaire: estTitulaire,
                poste: joueurs[i].role_sportif || null
            });
        }
        // Supprimer les anciennes compositions pour ce match/équipe
        const { error: delErr } = await supabasePublic
            .from('public_compositions_match')
            .delete()
            .eq('match_id', matchId)
            .eq('equipe_id', equipeId);
        if (delErr) throw delErr;
        // Insérer les nouvelles
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

// ========== DÉCONNEXION ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'connexion-tournoi.html';
});

// ========== MENU MOBILE ET LANGUE ==========
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

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLangSelector();
    initMenuMobile();
    chargerComposition();
});