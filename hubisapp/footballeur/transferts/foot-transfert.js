/* ============================================================
   HubISoccer — foot-transfert.js
   Espace Footballeur · Transferts & Offres (lecture seule)
   ============================================================ */

'use strict';

/* DEBUT : CONFIGURATION SUPABASE */
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
/* FIN : CONFIGURATION SUPABASE */

/* DEBUT : ETAT GLOBAL */
let currentUser = null;
let transfersData = [];
let offersData = [];
let currentTab = 'history'; // 'history' ou 'offers'
/* FIN : ETAT GLOBAL */

/* DEBUT : FONCTIONS UTILITAIRES */
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 30000;
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                      '<div class="toast-content">' + message + '</div>' +
                      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() { toast.remove(); }, 300);
    });
    setTimeout(function() {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() { toast.remove(); }, 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const img = document.getElementById('userAvatar');
    const init = document.getElementById('userAvatarInitials');
    const url = currentUser && currentUser.avatar_url;
    if (url) {
        if (img) { img.src = url; img.style.display = 'block'; }
        if (init) init.style.display = 'none';
    } else {
        const initials = getInitials(currentUser && (currentUser.full_name || currentUser.display_name) || 'A');
        if (init) { init.textContent = initials; init.style.display = 'flex'; }
        if (img) img.style.display = 'none';
    }
}

function formatMoney(value) {
    if (!value || isNaN(value)) return '—';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0
    }).format(value);
}
/* FIN : FONCTIONS UTILITAIRES */

/* DEBUT : VERIFICATION JOUEUR */
async function checkPlayer() {
    showLoader(true);
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            window.location.href = '../../../authprive/users/login.html';
            return false;
        }
        const { data: profile, error: profileError } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('role_code, full_name, display_name, avatar_url, hubisoccer_id')
            .eq('auth_uuid', user.id)
            .single();
        if (profileError || !profile) {
            window.location.href = '../../../authprive/users/login.html';
            return false;
        }
        if (profile.role_code !== 'FOOT') {
            showToast('Accès réservé aux footballeurs', 'error');
            setTimeout(function() {
                window.location.href = '../../../authprive/users/login.html';
            }, 2000);
            return false;
        }
        currentUser = profile;
        document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Footballeur';
        updateAvatarUI();
        return true;
    } catch (err) {
        console.error(err);
        showToast('Erreur de vérification', 'error');
        return false;
    } finally {
        showLoader(false);
    }
}
/* FIN : VERIFICATION JOUEUR */

/* DEBUT : CHARGEMENT TRANSFERTS DU JOUEUR */
async function loadTransfers() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_transfers')
            .select('*')
            .eq('user_hubisoccer_id', currentUser.hubisoccer_id)
            .order('date_transfert', { ascending: false });
        if (error) throw error;
        transfersData = data || [];
        renderTransfers();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement transferts', 'error');
    } finally {
        showLoader(false);
    }
}

function renderTransfers() {
    const container = document.getElementById('transfersList');
    if (!container) return;
    container.innerHTML = '';

    if (!transfersData.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'Aucun transfert enregistré.';
        container.appendChild(emptyMsg);
        return;
    }

    const typeLabels = { transfert: 'Transfert', pret: 'Prêt', fin_contrat: 'Fin de contrat' };

    transfersData.forEach(function(t) {
        const card = document.createElement('div');
        card.className = 'transfer-card ' + (t.status || '');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'transfer-info';
        infoDiv.innerHTML = '<h4>' + (t.club_depart || '—') + ' → ' + (t.club_arrivee || '—') + '</h4>' +
                            '<p>' + new Date(t.date_transfert).toLocaleDateString('fr-FR') + ' · ' +
                            (typeLabels[t.type_transfert] || 'Transfert') + ' · ' + formatMoney(t.montant) + '</p>';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'transfer-status ' + (t.status || '');
        const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
        statusDiv.textContent = statusLabels[t.status] || t.status;

        card.appendChild(infoDiv);
        card.appendChild(statusDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT TRANSFERTS DU JOUEUR */

/* DEBUT : CHARGEMENT OFFRES DU JOUEUR */
async function loadOffers() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .select('*')
            .eq('user_hubisoccer_id', currentUser.hubisoccer_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        offersData = data || [];
        renderOffers();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement offres', 'error');
    } finally {
        showLoader(false);
    }
}

function renderOffers() {
    const container = document.getElementById('offersList');
    if (!container) return;
    container.innerHTML = '';

    if (!offersData.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'Aucune offre reçue pour le moment.';
        container.appendChild(emptyMsg);
        return;
    }

    const statusLabels = { pending: 'En attente', accepted: 'Acceptée', rejected: 'Rejetée' };

    offersData.forEach(function(o) {
        const card = document.createElement('div');
        card.className = 'offer-card ' + (o.status || '');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'offer-info';
        infoDiv.innerHTML = '<h4>' + (o.title || 'Sans titre') + '</h4>' +
                            '<p>' + (o.from_entity || '—') + ' · ' +
                            new Date(o.created_at).toLocaleDateString('fr-FR') + ' · ' + formatMoney(o.amount) + '</p>';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'offer-status ' + (o.status || '');
        statusDiv.textContent = statusLabels[o.status] || o.status;

        card.appendChild(infoDiv);
        card.appendChild(statusDiv);
        container.appendChild(card);
    });
}
/* FIN : CHARGEMENT OFFRES DU JOUEUR */

/* DEBUT : GESTION DES ONGLETS */
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            if (tab === 'history') {
                document.getElementById('historyTab').classList.add('active');
                currentTab = 'history';
            } else if (tab === 'offers') {
                document.getElementById('offersTab').classList.add('active');
                currentTab = 'offers';
            }
        });
    });
}
/* FIN : GESTION DES ONGLETS */

/* DEBUT : INTERFACE UTILISATEUR (SIDEBAR, MENU, DECONNEXION) */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeSidebar');

    function open() {
        if (sb) sb.classList.add('active');
        if (ov) ov.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) sb.classList.remove('active');
        if (ov) ov.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}

function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) return;
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(link) {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
/* FIN : INTERFACE UTILISATEUR */

/* DEBUT : INITIALISATION */
document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkPlayer()) return;
    initSidebar();
    initUserMenu();
    initLogout();
    initTabs();
    await loadTransfers();
    await loadOffers();

    document.getElementById('langSelect') && document.getElementById('langSelect').addEventListener('change', function(e) {
        showToast('Langue : ' + e.target.options[e.target.selectedIndex].text, 'info');
    });
});
/* FIN : INITIALISATION */