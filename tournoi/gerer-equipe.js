// ========== DEBUT : tournoi/gerer-equipe.js (version intégrale et définitive, sans aucune troncature) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   TRADUCTIONS
   ============================================================ */
const translations = {
    fr: {
        'loader.message': 'Chargement...',
        'gerer.logout': 'Déconnexion',
        'gerer.dashboard': 'Tableau de bord',
        'gerer.title': 'Mon équipe',
        'gerer.composer': 'Composer l\'équipe',
        'gerer.matchs': 'Matchs',
        'gerer.classement': 'Classement',
        'gerer.messagerie': 'Messages',
        'gerer.portefeuille': 'Portefeuille',
        'gerer.importer': 'Importer les inscrits',
        'gerer.creer_equipe': 'Nouvelle équipe',
        'gerer.enregistrer_tout': 'Enregistrer tout',
        'gerer.disponibles': 'Joueurs disponibles',
        'gerer.mes_equipes': 'Mes équipes',
        'gerer.repartition_groupes': 'Répartition en groupes',
        'gerer.info_disponibles': 'Glissez un joueur ici pour le retirer des équipes.',
        'gerer.renommer': 'Renommer',
        'gerer.supprimer_equipe': 'Supprimer l\'équipe',
        'gerer.places_restantes': '{count} place(s) restante(s)',
        'gerer.complet': 'Complet',
        'gerer.aucun_inscrit': 'Aucun inscrit trouvé pour ce code.',
        'gerer.aucune_equipe': 'Aucune équipe créée.',
        'gerer.aucun_disponible': 'Tous les joueurs sont assignés.',
        'gerer.sauvegarde_ok': 'Composition enregistrée avec succès.',
        'gerer.sauvegarde_erreur': 'Erreur lors de la sauvegarde.',
        'gerer.equipe_non_trouvee': 'Équipe non trouvée',
        'gerer.non_autorise': 'Vous n\'êtes pas autorisé à gérer cette équipe.',
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
        'gerer.logout': 'Logout',
        'gerer.dashboard': 'Dashboard',
        'gerer.title': 'My team',
        'gerer.composer': 'Compose team',
        'gerer.matchs': 'Matches',
        'gerer.classement': 'Ranking',
        'gerer.messagerie': 'Messages',
        'gerer.portefeuille': 'Wallet',
        'gerer.importer': 'Import registered',
        'gerer.creer_equipe': 'New team',
        'gerer.enregistrer_tout': 'Save all',
        'gerer.disponibles': 'Available players',
        'gerer.mes_equipes': 'My teams',
        'gerer.repartition_groupes': 'Group distribution',
        'gerer.info_disponibles': 'Drag a player here to remove them from teams.',
        'gerer.renommer': 'Rename',
        'gerer.supprimer_equipe': 'Delete team',
        'gerer.places_restantes': '{count} spot(s) left',
        'gerer.complet': 'Full',
        'gerer.aucun_inscrit': 'No registered found for this code.',
        'gerer.aucune_equipe': 'No team created.',
        'gerer.aucun_disponible': 'All players are assigned.',
        'gerer.sauvegarde_ok': 'Composition saved successfully.',
        'gerer.sauvegarde_erreur': 'Error during save.',
        'gerer.equipe_non_trouvee': 'Team not found',
        'gerer.non_autorise': 'You are not authorized to manage this team.',
        'footer.badge1': 'APDP Benin Compliance',
        'footer.badge2': 'FIFA Regulations',
        'footer.badge3': 'Triple Project Sport-Studies-Career',
        'footer.tel': '📞 +229 01 95 97 31 57',
        'footer.email': '📧 contacthubisoccer@gmail.com',
        'footer.rccm': 'RCCM : RB/ABC/24 A 111814 | IFU : 0201910800236',
        'footer.copyright': '© 2026 HubISoccer - Ozawa. All rights reserved.'
    }
};

let currentLang = localStorage.getItem('gerer_lang') || navigator.language.split('-')[0];
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
        localStorage.setItem('gerer_lang', lang);
        applyTranslations();
        chargerInterface();
    }
}
/* FIN TRADUCTIONS */

/* ============================================================
   SESSION
   ============================================================ */
const userId = sessionStorage.getItem('tournoi_user_id');
const userRole = sessionStorage.getItem('tournoi_role');
const userNom = sessionStorage.getItem('tournoi_nom');
const tournoiId = sessionStorage.getItem('tournoi_tournoi_id');

if (!userId) window.location.href = 'connexion-tournoi.html';
document.getElementById('userName').textContent = userNom || sessionStorage.getItem('tournoi_login');

if (userRole !== 'capitaine') {
    document.body.innerHTML = '<div style="text-align:center;padding:50px;"><h2>' + t('gerer.non_autorise') + '</h2></div>';
}
/* FIN SESSION */

/* ============================================================
   VARIABLES GLOBALES
   ============================================================ */
let equipeCapitaine = null;
let tousInscrits = [];
let toutesEquipes = [];
let groupesActuels = { A: [], B: [], C: [], D: [] };
let joueursMaxParEquipe = 10;
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
   CHARGEMENT INITIAL
   ============================================================ */
async function chargerInterface() {
    showLoader();
    try {
        const { data: tournoi } = await supabasePublic
            .from('public_tournois')
            .select('format_equipe')
            .eq('id', tournoiId)
            .single();
        joueursMaxParEquipe = tournoi?.format_equipe || 10;

        const { data: equipe, error: eqErr } = await supabasePublic
            .from('public_equipes')
            .select('id, nom_equipe, type_equipe, tournoi_id, groupe')
            .eq('capitaine_id', userId)
            .single();
        if (eqErr || !equipe) {
            document.getElementById('equipeInfo').innerHTML = '<p>' + t('gerer.equipe_non_trouvee') + '</p>';
            return;
        }
        equipeCapitaine = equipe;
        document.getElementById('equipeInfo').innerHTML = `<h2>${escapeHtml(equipe.nom_equipe)}</h2><p>Type : ${equipe.type_equipe === 'club' ? 'Club' : 'Fan club'}</p>`;

        const { data: capInscription } = await supabasePublic
            .from('public_inscriptions_tournoi')
            .select('code_id')
            .eq('nom_complet', userNom)
            .eq('statut', 'valide')
            .limit(1)
            .single();
        const codeId = capInscription?.code_id;
        if (!codeId) {
            showToast('Impossible de récupérer le code d\'inscription du capitaine.', 'error');
            return;
        }

        const { data: inscrits } = await supabasePublic
            .from('public_inscriptions_tournoi')
            .select('id, nom_complet, email, telephone, equipe_id')
            .eq('code_id', codeId)
            .eq('statut', 'valide');
        tousInscrits = inscrits || [];

        const { data: equipes } = await supabasePublic
            .from('public_equipes')
            .select('id, nom_equipe, groupe, tournoi_id')
            .eq('tournoi_id', tournoiId);
        const autresEquipes = (equipes || []).filter(e => e.id !== equipeCapitaine.id);
        toutesEquipes = [equipeCapitaine, ...autresEquipes];

        for (const eq of toutesEquipes) {
            const { data: joueurs } = await supabasePublic
                .from('public_inscriptions_tournoi')
                .select('id, nom_complet')
                .eq('equipe_id', eq.id);
            eq.joueurs = (joueurs || []).map(j => ({ inscription_id: j.id, nom: j.nom_complet }));
        }

        groupesActuels = { A: [], B: [], C: [], D: [] };
        toutesEquipes.forEach(e => {
            if (e.groupe && groupesActuels[e.groupe]) {
                groupesActuels[e.groupe].push(e.id);
            }
        });

        renderDisponibles();
        renderEquipes();
        renderGroupes();
    } catch (err) {
        console.error(err);
        showToast('Erreur de chargement', 'error');
    } finally {
        hideLoader();
    }
}

/* ============================================================
   RENDU DES JOUEURS DISPONIBLES
   ============================================================ */
function renderDisponibles() {
    const container = document.getElementById('disponiblesList');
    const assignes = toutesEquipes.flatMap(e => (e.joueurs || []).map(j => j.inscription_id));
    const disponibles = tousInscrits.filter(ins => !assignes.includes(ins.id));

    if (!disponibles.length) {
        container.innerHTML = '<p class="empty-message">' + t('gerer.aucun_disponible') + '</p>';
        return;
    }

    let html = '';
    disponibles.forEach(ins => {
        html += `
            <div class="joueur-card disponible" draggable="true" data-inscription-id="${ins.id}" ondragstart="dragJoueur(event, ${ins.id})">
                <span class="joueur-nom">${escapeHtml(ins.nom_complet)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

/* ============================================================
   RENDU DES ÉQUIPES (avec poignée de drag pour les groupes)
   ============================================================ */
function renderEquipes() {
    const container = document.getElementById('equipesList');
    if (!toutesEquipes.length) {
        container.innerHTML = '<p class="empty-message">' + t('gerer.aucune_equipe') + '</p>';
        return;
    }

    let html = '';
    toutesEquipes.forEach(eq => {
        const nbJoueurs = (eq.joueurs || []).length;
        const places = joueursMaxParEquipe - nbJoueurs;
        const placesText = places > 0 ? t('gerer.places_restantes', { count: places }) : t('gerer.complet');

        html += `
            <div class="equipe-card" data-equipe-id="${eq.id}"
                 ondragover="allowDrop(event)" ondrop="dropOnEquipe(event, ${eq.id})">
                <div class="equipe-header">
                    <span class="drag-handle" draggable="true" ondragstart="dragEquipe(event, ${eq.id})" title="Glisser pour déplacer l'équipe">
                        <i class="fas fa-grip-vertical"></i>
                    </span>
                    <h3 class="equipe-nom">${escapeHtml(eq.nom_equipe)}</h3>
                    <span class="equipe-places">${nbJoueurs}/${joueursMaxParEquipe} - ${placesText}</span>
                </div>
                <div class="equipe-actions">
                    <button class="btn-renommer" data-equipe-id="${eq.id}"><i class="fas fa-pen"></i> ${t('gerer.renommer')}</button>
                    <button class="btn-supprimer-equipe" data-equipe-id="${eq.id}"><i class="fas fa-trash"></i> ${t('gerer.supprimer_equipe')}</button>
                </div>
                <ul class="equipe-joueurs">
                    ${(eq.joueurs || []).map(j => `
                        <li>
                            <span>${escapeHtml(j.nom)}</span>
                            <button class="btn-retirer" data-inscription-id="${j.inscription_id}"><i class="fas fa-times"></i></button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.btn-renommer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const equipeId = parseInt(btn.dataset.equipeId);
            const nouveauNom = prompt('Nouveau nom de l\'équipe :');
            if (nouveauNom && nouveauNom.trim()) {
                renommerEquipe(equipeId, nouveauNom.trim());
            }
        });
    });

    container.querySelectorAll('.btn-supprimer-equipe').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const equipeId = parseInt(btn.dataset.equipeId);
            if (confirm('Supprimer cette équipe ? Les joueurs redeviendront disponibles.')) {
                supprimerEquipe(equipeId);
            }
        });
    });

    container.querySelectorAll('.btn-retirer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const inscriptionId = parseInt(btn.dataset.inscriptionId);
            retirerJoueur(inscriptionId);
        });
    });
}

/* ============================================================
   RENDU DES GROUPES
   ============================================================ */
function renderGroupes() {
    ['A', 'B', 'C', 'D'].forEach(groupe => {
        const container = document.getElementById('groupe-' + groupe);
        if (!container) return;
        const ids = groupesActuels[groupe] || [];
        const equipesDuGroupe = toutesEquipes.filter(eq => ids.includes(eq.id));
        container.innerHTML = equipesDuGroupe.map(eq => `
            <div class="groupe-equipe-item">
                <span>${escapeHtml(eq.nom_equipe)}</span>
                <button class="btn-retirer-groupe" data-equipe-id="${eq.id}"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    });

    document.querySelectorAll('.btn-retirer-groupe').forEach(btn => {
        btn.addEventListener('click', () => {
            const equipeId = parseInt(btn.dataset.equipeId);
            assignerGroupe(equipeId, null);
        });
    });
}

/* ============================================================
   ACTIONS SUR LES JOUEURS / ÉQUIPES
   ============================================================ */
async function ajouterJoueurAEquipe(inscriptionId, equipeId) {
    const equipe = toutesEquipes.find(e => e.id == equipeId);
    if (equipe && (equipe.joueurs || []).length >= joueursMaxParEquipe) {
        showToast(`Cette équipe est complète (${joueursMaxParEquipe} joueurs max).`, 'warning');
        return;
    }
    const { error } = await supabasePublic
        .from('public_inscriptions_tournoi')
        .update({ equipe_id: equipeId })
        .eq('id', inscriptionId);
    if (error) {
        showToast('Erreur ajout', 'error');
    } else {
        await chargerInterface();
    }
}

async function retirerJoueur(inscriptionId) {
    const { error } = await supabasePublic
        .from('public_inscriptions_tournoi')
        .update({ equipe_id: null })
        .eq('id', inscriptionId);
    if (error) {
        showToast('Erreur retrait', 'error');
    } else {
        await chargerInterface();
    }
}

async function renommerEquipe(equipeId, nouveauNom) {
    const { error } = await supabasePublic
        .from('public_equipes')
        .update({ nom_equipe: nouveauNom })
        .eq('id', equipeId);
    if (error) {
        showToast('Erreur renommage', 'error');
    } else {
        showToast('Équipe renommée', 'success');
        await chargerInterface();
    }
}

async function supprimerEquipe(equipeId) {
    const { data: joueurs } = await supabasePublic
        .from('public_inscriptions_tournoi')
        .select('id')
        .eq('equipe_id', equipeId);
    if (joueurs) {
        for (const j of joueurs) {
            await supabasePublic.from('public_inscriptions_tournoi').update({ equipe_id: null }).eq('id', j.id);
        }
    }
    const { error } = await supabasePublic
        .from('public_equipes')
        .delete()
        .eq('id', equipeId);
    if (error) {
        showToast('Erreur suppression', 'error');
    } else {
        showToast('Équipe supprimée', 'success');
        await chargerInterface();
    }
}

async function assignerGroupe(equipeId, groupe) {
    const { error } = await supabasePublic
        .from('public_equipes')
        .update({ groupe: groupe })
        .eq('id', equipeId);
    if (error) {
        showToast('Erreur assignation groupe', 'error');
    } else {
        await chargerInterface();
    }
}

async function creerNouvelleEquipe() {
    const nom = prompt('Nom de la nouvelle équipe :');
    if (!nom || !nom.trim()) return;
    const { error } = await supabasePublic
        .from('public_equipes')
        .insert([{
            nom_equipe: nom.trim(),
            tournoi_id: tournoiId,
            type_equipe: equipeCapitaine.type_equipe || 'fan_club',
            capitaine_id: userId
        }]);
    if (error) {
        showToast('Erreur création équipe', 'error');
    } else {
        showToast('Équipe créée', 'success');
        await chargerInterface();
    }
}

async function enregistrerTout() {
    showLoader();
    try {
        for (const eq of toutesEquipes) {
            let groupe = null;
            for (const [g, ids] of Object.entries(groupesActuels)) {
                if (ids.includes(eq.id)) {
                    groupe = g;
                    break;
                }
            }
            await supabasePublic
                .from('public_equipes')
                .update({ groupe: groupe })
                .eq('id', eq.id);
        }
        showToast(t('gerer.sauvegarde_ok'), 'success');
    } catch (err) {
        console.error(err);
        showToast(t('gerer.sauvegarde_erreur'), 'error');
    } finally {
        hideLoader();
    }
}

/* ============================================================
   DRAG & DROP
   ============================================================ */
function allowDrop(ev) { ev.preventDefault(); }

function dragJoueur(ev, inscriptionId) {
    ev.dataTransfer.setData("text/plain", inscriptionId);
    ev.dataTransfer.effectAllowed = "move";
}

function dropOnDisponibles(ev) {
    ev.preventDefault();
    const inscriptionId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!inscriptionId) return;
    retirerJoueur(inscriptionId);
}

function dropOnEquipe(ev, equipeId) {
    ev.preventDefault();
    const inscriptionId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!inscriptionId) return;
    ajouterJoueurAEquipe(inscriptionId, equipeId);
}

function dragEquipe(ev, equipeId) {
    ev.dataTransfer.setData("text/plain", equipeId);
    ev.dataTransfer.effectAllowed = "move";
}

function dropOnGroupe(ev, groupe) {
    ev.preventDefault();
    const equipeId = parseInt(ev.dataTransfer.getData("text/plain"));
    if (!equipeId) return;
    assignerGroupe(equipeId, groupe);
}

/* ============================================================
   ÉVÉNEMENTS BOUTONS PRINCIPAUX
   ============================================================ */
document.getElementById('importerInscritsBtn').addEventListener('click', async () => {
    showLoader();
    try {
        await chargerInterface();
        showToast('Inscrits chargés.', 'success');
    } catch (err) {
        showToast('Erreur importation', 'error');
    } finally {
        hideLoader();
    }
});
document.getElementById('creerEquipeBtn').addEventListener('click', creerNouvelleEquipe);
document.getElementById('enregistrerToutBtn').addEventListener('click', enregistrerTout);

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
    chargerInterface();
});
// ========== FIN : tournoi/gerer-equipe.js ==========