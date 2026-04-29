// ========== CLUBS.JS ==========
// ========== DÉBUT : CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ========== FIN : CONFIGURATION SUPABASE ==========

// ========== DÉBUT : VARIABLES GLOBALES ==========
let allClubs = [];
let allVilles = [];
const clubsGrid = document.getElementById('clubsGrid');
const searchInput = document.getElementById('searchInput');
const disciplineFilter = document.getElementById('disciplineFilter');
const villeFilter = document.getElementById('villeFilter');
const statutFilter = document.getElementById('statutFilter');
const langSelect = document.getElementById('langSelect');
// ========== FIN : VARIABLES GLOBALES ==========

// ========== DÉBUT : FONCTIONS UTILITAIRES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function getInitiales(nom) {
    if (!nom) return '??';
    return nom
        .split(' ')
        .map(mot => mot.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

function getQuotaBadge(quotaMax, quotaUtilise) {
    // quotaUtilise n'existe pas encore dans la table, nous simulons avec 0 pour l'instant
    const utilise = quotaUtilise || 0;
    const disponible = quotaMax - utilise;
    if (disponible <= 0) {
        return { classe: 'badge-rouge', texte: nosClubsT('club.complet') };
    } else if (disponible <= 5) {
        return { classe: 'badge-orange', texte: nosClubsT('club.presque_complet') + ' (' + disponible + ' ' + nosClubsT('club.places', {places: disponible}) + ')' };
    } else {
        return { classe: 'badge-vert', texte: nosClubsT('club.recrutement_ouvert') + ' (' + disponible + ' ' + nosClubsT('club.places', {places: disponible}) + ')' };
    }
}
// ========== FIN : FONCTIONS UTILITAIRES ==========

// ========== DÉBUT : CHARGEMENT DES CLUBS ==========
async function loadClubs() {
    try {
        const { data, error } = await supabasePublic
            .from('nosclub_clubs')
            .select('*, nosclub_roles(nom, icone, type)')
            .eq('statut', 'actif')
            .order('nom', { ascending: true });
        if (error) throw error;
        allClubs = data || [];
        // Extraire les villes uniques
        allVilles = [...new Set(allClubs.map(c => c.ville).filter(v => v))].sort();
        populateVilleFilter();
        renderClubs();
    } catch (err) {
        console.error('Erreur chargement clubs:', err);
        clubsGrid.innerHTML = '<p class="error-message">Erreur de chargement des clubs.</p>';
    }
}

function populateVilleFilter() {
    villeFilter.innerHTML = '<option value="all">' + nosClubsT('filter.ville_all') + '</option>';
    allVilles.forEach(ville => {
        villeFilter.innerHTML += `<option value="${escapeHtml(ville)}">${escapeHtml(ville)}</option>`;
    });
}
// ========== FIN : CHARGEMENT DES CLUBS ==========

// ========== DÉBUT : RENDU DES CLUBS ==========
function getFilteredClubs() {
    const search = searchInput.value.toLowerCase();
    const discipline = disciplineFilter.value;
    const ville = villeFilter.value;
    const statut = statutFilter.value;

    return allClubs.filter(club => {
        const matchSearch = club.nom.toLowerCase().includes(search) ||
                           (club.quartier && club.quartier.toLowerCase().includes(search)) ||
                           (club.ville && club.ville.toLowerCase().includes(search));
        const matchDiscipline = discipline === 'all' || 
                               (discipline === 'sportif' && club.nosclub_roles?.type === 'sportif') ||
                               (discipline === 'artiste' && club.nosclub_roles?.type === 'artiste') ||
                               (discipline === club.discipline_id?.toString());
        const matchVille = ville === 'all' || club.ville === ville;
        const matchStatut = statut === 'all' || club.statut === statut;
        return matchSearch && matchDiscipline && matchVille && matchStatut;
    });
}

function renderClubs() {
    if (!clubsGrid) return;
    const filtered = getFilteredClubs();
    if (filtered.length === 0) {
        clubsGrid.innerHTML = '<p class="empty-message">Aucun club trouvé.</p>';
        return;
    }
    clubsGrid.innerHTML = filtered.map(club => {
        const roleData = club.nosclub_roles || {};
        const badge = getQuotaBadge(club.quota_max, 0); // quota_utilise à ajouter plus tard
        return `
            <div class="club-card">
                <div class="club-logo-container">
                    ${club.logo_url 
                        ? `<img src="${escapeHtml(club.logo_url)}" alt="${escapeHtml(club.nom)}" class="club-logo">`
                        : `<div class="club-initiales">${getInitiales(club.nom)}</div>`
                    }
                </div>
                <div class="club-info">
                    <h3>${escapeHtml(club.nom)}</h3>
                    <p class="club-discipline">
                        <i class="fas ${escapeHtml(roleData.icone || 'fa-users')}"></i> 
                        ${escapeHtml(roleData.nom || club.discipline_id)}
                    </p>
                    <p class="club-localisation">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${club.quartier ? escapeHtml(club.quartier) + ', ' : ''}${escapeHtml(club.ville || '')}
                    </p>
                    <span class="club-badge ${badge.classe}">${badge.texte}</span>
                </div>
                <div class="club-action">
                    <a href="fiche-club.html?id=${club.id}" class="btn-voir-club">${nosClubsT('club.voir')}</a>
                </div>
            </div>
        `;
    }).join('');
}
// ========== FIN : RENDU DES CLUBS ==========

// ========== DÉBUT : FILTRES ET RECHERCHE ==========
searchInput.addEventListener('input', renderClubs);
disciplineFilter.addEventListener('change', renderClubs);
villeFilter.addEventListener('change', renderClubs);
statutFilter.addEventListener('change', renderClubs);
// ========== FIN : FILTRES ET RECHERCHE ==========

// ========== DÉBUT : APPLICATION DES TRADUCTIONS ==========
function applyNosClubsTranslations() {
    // Traduire les éléments avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.tagName === 'INPUT' && el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = nosClubsT(key);
            } else {
                el.innerHTML = nosClubsT(key);
            }
        }
    });
    // Traduire les options des sélecteurs
    document.querySelectorAll('select option[data-i18n]').forEach(opt => {
        const key = opt.getAttribute('data-i18n');
        if (key) opt.textContent = nosClubsT(key);
    });
    // Re-rendre les clubs si déjà chargés
    if (allClubs.length > 0) {
        renderClubs();
        populateVilleFilter();
    }
}
// ========== FIN : APPLICATION DES TRADUCTIONS ==========

// ========== DÉBUT : GESTION DE LA LANGUE ==========
if (langSelect) {
    langSelect.value = nosClubsCurrentLang;
    langSelect.addEventListener('change', (e) => {
        nosClubsSetLanguage(e.target.value);
        applyNosClubsTranslations();
    });
}
// ========== FIN : GESTION DE LA LANGUE ==========

// ========== DÉBUT : MENU MOBILE ==========
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
// ========== FIN : MENU MOBILE ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    applyNosClubsTranslations();
    loadClubs();
});
// ========== FIN DE CLUBS.JS ==========