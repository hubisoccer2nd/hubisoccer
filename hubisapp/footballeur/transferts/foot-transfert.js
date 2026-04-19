/* ============================================================
   HubISoccer — foot-transfert.js
   Espace Footballeur · Transferts & Offres
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser = null;
let userProfile = null;
let transfers = [];
let offers = [];
let currentFilters = { year: '', club: '', type: '' };
let currentOffer = null;
// Fin état global

// Début fonctions utilitaires
function showLoader() { document.getElementById('globalLoader').style.display = 'flex'; }
function hideLoader() { document.getElementById('globalLoader').style.display = 'none'; }

function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => t.remove(), 300);
    });
    setTimeout(() => {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}

function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const url = userProfile?.avatar_url;
    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
    } else {
        const init = getInitials(userProfile?.full_name || userProfile?.display_name || 'F');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatMoney(value, countryCode = 'BJ') {
    if (!value || isNaN(value)) return '—';
    const num = Number(value);
    const currency = getCurrencyFromCountry(countryCode);
    return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 0
    }).format(num);
}

function getCurrencyFromCountry(countryCode) {
    const map = {
        'BJ': { code: 'XOF', locale: 'fr-BJ' }, 'FR': { code: 'EUR', locale: 'fr-FR' },
        'US': { code: 'USD', locale: 'en-US' }, 'GB': { code: 'GBP', locale: 'en-GB' }
    };
    return map[countryCode] || { code: 'XOF', locale: 'fr-FR' };
}
// Fin fonctions utilitaires

// Début vérification session et rôle
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

async function loadProfile() {
    if (!currentUser) return null;
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, display_name, avatar_url, role_code, country')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement profil', 'error');
        return null;
    }
    if (data.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 2000);
        return null;
    }
    userProfile = data;
    document.getElementById('userName').textContent = userProfile.full_name || userProfile.display_name || 'Footballeur';
    updateAvatarUI();
    return userProfile;
}
// Fin vérification

// Début chargement transferts
async function loadTransfers() {
    if (!userProfile) return;
    showLoader();
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_transfers')
            .select('*')
            .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
            .order('date_transfert', { ascending: false });
        if (error) throw error;
        transfers = data || [];

        const years = [...new Set(transfers.map(t => t.date_transfert ? new Date(t.date_transfert).getFullYear() : null).filter(y => y))];
        const clubs = [...new Set(transfers.flatMap(t => [t.club_depart, t.club_arrivee]).filter(c => c))];
        const yearSelect = document.getElementById('filterYear');
        const clubSelect = document.getElementById('filterClub');
        if (yearSelect) yearSelect.innerHTML = '<option value="">Toutes</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
        if (clubSelect) clubSelect.innerHTML = '<option value="">Tous</option>' + clubs.map(c => `<option value="${c}">${c}</option>`).join('');
        applyTransfersFilters();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement transferts', 'error');
    } finally {
        hideLoader();
    }
}

function applyTransfersFilters() {
    let filtered = transfers;
    if (currentFilters.year) {
        filtered = filtered.filter(t => t.date_transfert && new Date(t.date_transfert).getFullYear() == currentFilters.year);
    }
    if (currentFilters.club) {
        filtered = filtered.filter(t => t.club_depart === currentFilters.club || t.club_arrivee === currentFilters.club);
    }
    if (currentFilters.type) {
        filtered = filtered.filter(t => t.type_transfert === currentFilters.type);
    }
    renderTransfers(filtered);
}

function renderTransfers(transfersList) {
    const container = document.getElementById('transfersList');
    if (!container) return;
    if (!transfersList.length) {
        container.innerHTML = '<p class="empty-message">Aucun transfert correspondant.</p>';
        return;
    }
    const statusLabels = { approved: 'Validé', pending: 'En attente', rejected: 'Rejeté' };
    container.innerHTML = transfersList.map(transfer => {
        const statusText = statusLabels[transfer.status] || 'En attente';
        const amount = transfer.montant ? formatMoney(transfer.montant, userProfile?.country || 'BJ') : '—';
        let clubText = '';
        if (transfer.club_depart && transfer.club_arrivee) clubText = `${transfer.club_depart} → ${transfer.club_arrivee}`;
        else if (transfer.club_arrivee) clubText = transfer.club_arrivee;
        else clubText = 'Club non spécifié';
        const year = transfer.date_transfert ? new Date(transfer.date_transfert).getFullYear() : 'Année inconnue';
        const typeIcon = transfer.type_transfert === 'transfert' ? 'fa-exchange-alt' : (transfer.type_transfert === 'pret' ? 'fa-handshake' : 'fa-file-signature');
        return `
            <div class="transfer-card">
                <div class="transfer-icon"><i class="fas ${typeIcon}"></i></div>
                <div class="transfer-info">
                    <h4>${escapeHtml(clubText)}</h4>
                    <p>${transfer.type_transfert === 'transfert' ? 'Transfert' : transfer.type_transfert === 'pret' ? 'Prêt' : 'Fin de contrat'} – ${year}</p>
                </div>
                <div class="transfer-amount">${amount}</div>
                <span class="transfer-status ${transfer.status}">${statusText}</span>
            </div>
        `;
    }).join('');
}
// Fin transferts

// Début chargement offres
async function loadOffers() {
    if (!userProfile) return;
    showLoader();
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .select('*')
            .eq('user_hubisoccer_id', userProfile.hubisoccer_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        offers = data || [];
        renderOffers();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement offres', 'error');
    } finally {
        hideLoader();
    }
}

function renderOffers() {
    const container = document.getElementById('offersList');
    if (!container) return;
    if (!offers.length) {
        container.innerHTML = '<p class="empty-message">Aucune offre reçue pour le moment.</p>';
        return;
    }
    const statusLabels = { accepted: 'Acceptée', rejected: 'Refusée', pending: 'En attente' };
    container.innerHTML = offers.map(offer => {
        const statusText = statusLabels[offer.status] || 'En attente';
        let icon = 'fa-file-contract';
        if (offer.type === 'transfert') icon = 'fa-exchange-alt';
        else if (offer.type === 'tournoi') icon = 'fa-trophy';
        else if (offer.type === 'recrutement') icon = 'fa-user-plus';
        return `
            <div class="offer-card" data-offer-id="${offer.id}">
                <div class="offer-icon"><i class="fas ${icon}"></i></div>
                <div class="offer-info">
                    <h4>${escapeHtml(offer.title || `${offer.from_entity} – ${offer.type}`)}</h4>
                    <p>${escapeHtml(offer.from_entity || 'HubISoccer')} – ${new Date(offer.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span class="offer-status ${offer.status}">${statusText}</span>
            </div>
        `;
    }).join('');
    document.querySelectorAll('.offer-card').forEach(card => {
        card.addEventListener('click', e => {
            const id = card.dataset.offerId;
            const offer = offers.find(o => o.id == id);
            if (offer) openOfferModal(offer);
        });
    });
}

function openOfferModal(offer) {
    currentOffer = offer;
    const modal = document.getElementById('offerModal');
    const detailsDiv = document.getElementById('modalOfferDetails');
    const desc = offer.description || 'Aucun détail fourni.';
    const formattedDesc = desc.replace(/\n/g, '<br>').replace(/•/g, '&bull;');
    detailsDiv.innerHTML = `
        <p><strong>${escapeHtml(offer.title || 'Offre')}</strong></p>
        <p><strong>Type :</strong> ${offer.type === 'transfert' ? 'Transfert' : offer.type === 'tournoi' ? 'Participation à un tournoi' : 'Recrutement'}</p>
        <p><strong>De :</strong> ${escapeHtml(offer.from_entity || '-')}</p>
        <p><strong>Date :</strong> ${new Date(offer.created_at).toLocaleString('fr-FR')}</p>
        <p><strong>Description :</strong></p>
        <div class="offer-description">${formattedDesc}</div>
        ${offer.amount ? `<p><strong>Montant :</strong> ${formatMoney(offer.amount, userProfile?.country || 'BJ')}</p>` : ''}
    `;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('offerModal').style.display = 'none';
    currentOffer = null;
}

async function acceptOffer() {
    if (!currentOffer) return;
    showLoader();
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .update({ status: 'accepted', responded_at: new Date() })
            .eq('id', currentOffer.id);
        if (error) throw error;
        await supabaseClient.from('supabaseAuthPrive_notifications').insert([{
            recipent_hubisoccer_id: userProfile.hubisoccer_id,
            title: 'Offre acceptée',
            message: `Vous avez accepté l'offre "${currentOffer.title || currentOffer.from_entity}".`,
            type: 'success'
        }]);
        showToast('Offre acceptée !', 'success');
        await loadOffers();
        closeModal();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
}

async function ignoreOffer() {
    if (!currentOffer) return;
    showLoader();
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .update({ status: 'rejected', responded_at: new Date() })
            .eq('id', currentOffer.id);
        if (error) throw error;
        showToast('Offre ignorée.', 'info');
        await loadOffers();
        closeModal();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        hideLoader();
    }
}
// Fin offres

// Début UI (filtres, onglets, sidebar, menu)
function initFilters() {
    const yearSelect = document.getElementById('filterYear');
    const clubSelect = document.getElementById('filterClub');
    const typeSelect = document.getElementById('filterType');
    const resetBtn = document.getElementById('resetFilters');
    if (!yearSelect || !clubSelect || !typeSelect || !resetBtn) return;
    const apply = () => {
        currentFilters = { year: yearSelect.value, club: clubSelect.value, type: typeSelect.value };
        applyTransfersFilters();
    };
    yearSelect.addEventListener('change', apply);
    clubSelect.addEventListener('change', apply);
    typeSelect.addEventListener('change', apply);
    resetBtn.addEventListener('click', () => {
        yearSelect.value = '';
        clubSelect.value = '';
        typeSelect.value = '';
        currentFilters = { year: '', club: '', type: '' };
        applyTransfersFilters();
    });
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(`${target}Tab`).classList.add('active');
            if (target === 'offers') loadOffers();
        });
    });
}

function initSidebar() {
    const sb = document.getElementById('leftSidebar'), ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle'), cb = document.getElementById('closeSidebar');
    const open = () => { sb?.classList.add('active'); ov?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    const close = () => { sb?.classList.remove('active'); ov?.classList.remove('active'); document.body.style.overflow = ''; };
    if (mb) mb.addEventListener('click', open);
    if (cb) cb.addEventListener('click', close);
    if (ov) ov.addEventListener('click', close);
    let sx = 0, sy = 0;
    document.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && sx < 50) open(); else if (dx < 0) close();
    }, { passive: false });
}

function initUserMenu() {
    const m = document.getElementById('userMenu'), d = document.getElementById('userDropdown');
    if (!m || !d) return;
    m.addEventListener('click', e => { e.stopPropagation(); d.classList.toggle('show'); });
    document.addEventListener('click', () => d.classList.remove('show'));
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin UI

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession(); if (!user) return;
    await loadProfile(); if (!userProfile) return;
    await loadTransfers();
    initFilters();
    initTabs();
    initSidebar();
    initUserMenu();
    initLogout();

    const modal = document.getElementById('offerModal');
    const closeBtn = modal?.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('acceptOfferBtn')?.addEventListener('click', acceptOffer);
    document.getElementById('ignoreOfferBtn')?.addEventListener('click', ignoreOffer);
    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation
