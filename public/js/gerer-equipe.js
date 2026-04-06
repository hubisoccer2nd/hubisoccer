// ========== GERER-EQUIPE.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TRADUCTIONS ==========
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'gerer.logout': 'Déconnexion',
        'gerer.dashboard': 'Tableau de bord',
        'gerer.title': 'Mon équipe',
        'gerer.matchs': 'Matchs',
        'gerer.classement': 'Classement',
        'gerer.ajouter': 'Ajouter un sportif',
        'gerer.modal.titre': 'Ajouter un sportif',
        'gerer.modal.nom': 'Nom *',
        'gerer.modal.prenom': 'Prénom *',
        'gerer.modal.numero': 'Numéro de maillot',
        'gerer.modal.poste': 'Poste / Rôle sportif',
        'gerer.modal.pied': 'Pied fort',
        'gerer.modal.ajouter': 'Ajouter',
        'footer.badge1': 'Conformité APDP Bénin',
        'footer.badge2': 'Règlementation FIFA',
        'footer.badge3': 'Triple Projet Sport-Études-Carrière',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. Tous droits réservés.',
        'toast.chargement_erreur': 'Erreur chargement des données',
        'toast.ajout_ok': 'Sportif ajouté avec succès',
        'toast.ajout_erreur': 'Erreur lors de l\'ajout',
        'toast.suppr_ok': 'Sportif supprimé',
        'toast.suppr_erreur': 'Erreur lors de la suppression',
        'toast.non_autorise': 'Vous n\'êtes pas autorisé à gérer cette équipe'
    },
    en: {
        'loader.message': 'Loading...',
        'gerer.logout': 'Logout',
        'gerer.dashboard': 'Dashboard',
        'gerer.title': 'My team',
        'gerer.matchs': 'Matches',
        'gerer.classement': 'Ranking',
        'gerer.ajouter': 'Add a player',
        'gerer.modal.titre': 'Add a player',
        'gerer.modal.nom': 'Last name *',
        'gerer.modal.prenom': 'First name *',
        'gerer.modal.numero': 'Jersey number',
        'gerer.modal.poste': 'Position / Role',
        'gerer.modal.pied': 'Preferred foot',
        'gerer.modal.ajouter': 'Add',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.',
        'toast.chargement_erreur': 'Error loading data',
        'toast.ajout_ok': 'Player added successfully',
        'toast.ajout_erreur': 'Error adding player',
        'toast.suppr_ok': 'Player deleted',
        'toast.suppr_erreur': 'Error deleting player',
        'toast.non_autorise': 'You are not authorized to manage this team'
    }
};

let currentLang = localStorage.getItem('gerer_lang') || navigator.language.split('-')[0];
if (!translations[currentLang]) currentLang = 'fr';

function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.getAttribute('data-i18n-placeholder')) {
                el.placeholder = t(key);
            } else {
                el.innerHTML = t(key);
            }
        }
    });
    document.querySelectorAll('select option').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = t(key);
    });
}

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('gerer_lang', lang);
        applyTranslations();
        chargerSportifs();
    }
}

// ========== SESSION ==========
const userId = sessionStorage.getItem('tournoi_user_id');
const userRole = sessionStorage.getItem('tournoi_role');
const userNom = sessionStorage.getItem('tournoi_nom');

if (!userId) {
    window.location.href = 'connexion-tournoi.html';
}

if (userRole !== 'capitaine') {
    document.getElementById('ajouterSportifBtn').style.display = 'none';
    document.getElementById('sportifsList').innerHTML = '<p class="empty-message">' + t('toast.non_autorise') + '</p>';
}

document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

// ========== VARIABLES GLOBALES ==========
let equipeId = null;

// ========== CHARGEMENT DE L'ÉQUIPE ET DES SPORTIFS ==========
async function chargerEquipe() {
    const { data: equipe, error } = await supabasePublic
        .from('public_equipes')
        .select('id, nom_equipe, type_equipe')
        .eq('capitaine_id', userId)
        .single();
    if (error || !equipe) {
        console.error('Erreur équipe:', error);
        document.getElementById('equipeInfo').innerHTML = '<p>Équipe non trouvée</p>';
        return;
    }
    equipeId = equipe.id;
    document.getElementById('equipeInfo').innerHTML = `
        <h2>${escapeHtml(equipe.nom_equipe)}</h2>
        <p>Type : ${equipe.type_equipe === 'club' ? 'Club' : 'Fan club'}</p>
    `;
    chargerSportifs();
}

async function chargerSportifs() {
    if (!equipeId) return;
    showLoader();
    try {
        const { data, error } = await supabasePublic
            .from('public_sportifs_equipe')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('numero_maillot', { ascending: true });
        if (error) throw error;
        renderSportifs(data || []);
    } catch (err) {
        console.error(err);
        showToast(t('toast.chargement_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

function renderSportifs(sportifs) {
    const container = document.getElementById('sportifsList');
    if (!sportifs.length) {
        container.innerHTML = '<p class="empty-message">Aucun sportif dans votre équipe.</p>';
        return;
    }
    let html = '';
    for (const s of sportifs) {
        html += `
            <div class="sportif-card" data-id="${s.id}">
                <h3>${escapeHtml(s.prenom)} ${escapeHtml(s.nom)}</h3>
                ${s.numero_maillot ? `<p><strong>Numéro :</strong> ${s.numero_maillot}</p>` : ''}
                ${s.role_sportif ? `<p><strong>Poste :</strong> ${escapeHtml(s.role_sportif)}</p>` : ''}
                ${s.pied_fort ? `<p><strong>Pied :</strong> ${escapeHtml(s.pied_fort)}</p>` : ''}
                <div class="card-actions">
                    <button class="btn-delete" data-id="${s.id}">Supprimer</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.dataset.id;
            if (confirm('Supprimer ce sportif ?')) {
                await supprimerSportif(id);
            }
        });
    });
}

async function supprimerSportif(id) {
    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_sportifs_equipe')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast(t('toast.suppr_ok'), 'success');
        chargerSportifs();
    } catch (err) {
        console.error(err);
        showToast(t('toast.suppr_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

// ========== AJOUT SPORTIF ==========
const modal = document.getElementById('ajoutModal');
const ajoutBtn = document.getElementById('ajouterSportifBtn');
const closeModal = document.querySelectorAll('.close-modal');
const ajoutForm = document.getElementById('ajoutForm');

ajoutBtn.addEventListener('click', () => {
    document.getElementById('nom').value = '';
    document.getElementById('prenom').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('poste').value = '';
    document.getElementById('pied').value = '';
    modal.classList.add('active');
});

closeModal.forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

ajoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const numero = document.getElementById('numero').value ? parseInt(document.getElementById('numero').value) : null;
    const poste = document.getElementById('poste').value.trim() || null;
    const pied = document.getElementById('pied').value || null;

    if (!nom || !prenom) {
        showToast('Nom et prénom requis', 'warning');
        return;
    }

    showLoader();
    try {
        const { error } = await supabasePublic
            .from('public_sportifs_equipe')
            .insert([{
                equipe_id: equipeId,
                nom: nom,
                prenom: prenom,
                numero_maillot: numero,
                role_sportif: poste,
                pied_fort: pied
            }]);
        if (error) throw error;
        showToast(t('toast.ajout_ok'), 'success');
        modal.classList.remove('active');
        chargerSportifs();
    } catch (err) {
        console.error(err);
        showToast(t('toast.ajout_erreur'), 'error');
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
    chargerEquipe();
});