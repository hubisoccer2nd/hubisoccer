/* ============================================================
   HubISoccer — admin-foot-transferts.js
   Administration Footballeur · Transferts & Offres
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentAdmin = null;
let allFootballeurs = [];
let transfersData = [];
let offersData = [];
let currentTransferId = null;
let currentOfferId = null;
let currentAction = null;
let currentTab = 'transfers';
// Fin état global

// Début fonctions utilitaires
function showLoader(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'info', duration = 30000) {
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
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    });
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function getInitials(name) {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function updateAvatarUI() {
    const img = document.getElementById('userAvatar');
    const init = document.getElementById('userAvatarInitials');
    const url = currentAdmin?.avatar_url;
    if (url) {
        if (img) {
            img.src = url;
            img.style.display = 'block';
        }
        if (init) init.style.display = 'none';
    } else {
        const initials = getInitials(currentAdmin?.full_name || currentAdmin?.display_name || 'A');
        if (init) {
            init.textContent = initials;
            init.style.display = 'flex';
        }
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
// Fin fonctions utilitaires

// Début vérification admin
async function checkAdmin() {
    showLoader(true);
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            window.location.href = '../../../authprive/users/login.html';
            return false;
        }
        const { data: profile, error: profileError } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('role_code, full_name, display_name, avatar_url')
            .eq('auth_uuid', user.id)
            .single();
        if (profileError || !profile) {
            window.location.href = '../../../authprive/users/login.html';
            return false;
        }
        if (profile.role_code !== 'ADMIN' && profile.role_code !== 'FOOT_ADMIN') {
            showToast('Accès réservé aux administrateurs', 'error');
            setTimeout(() => {
                window.location.href = '../../../authprive/users/login.html';
            }, 2000);
            return false;
        }
        currentAdmin = profile;
        document.getElementById('userName').textContent = profile.full_name || profile.display_name || 'Admin Foot';
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
// Fin vérification admin

// Début chargement footballeurs
async function loadFootballeurs() {
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_profiles')
            .select('hubisoccer_id, full_name')
            .eq('role_code', 'FOOT')
            .order('full_name');
        if (error) throw error;
        allFootballeurs = data || [];
        return allFootballeurs;
    } catch (err) {
        console.error('Erreur chargement footballeurs:', err);
        return [];
    }
}
// Fin chargement footballeurs

// Début chargement transferts
async function loadTransfers() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_transfers')
            .select(`*, footballeur:user_hubisoccer_id ( hubisoccer_id, full_name )`)
            .order('date_transfert', { ascending: false });
        if (error) throw error;
        transfersData = (data || []).map(t => ({
            ...t,
            footballeur_name: t.footballeur?.full_name || 'Inconnu'
        }));
        renderTransfers();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement transferts', 'error');
    } finally {
        showLoader(false);
    }
}

function renderTransfers() {
    const search = document.getElementById('transferSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('transferTypeFilter')?.value || '';
    const statusFilter = document.getElementById('transferStatusFilter')?.value || '';

    const filtered = transfersData.filter(t => {
        const matchesSearch = (t.footballeur_name || '').toLowerCase().includes(search) ||
                              (t.club_depart || '').toLowerCase().includes(search) ||
                              (t.club_arrivee || '').toLowerCase().includes(search);
        const matchesType = !typeFilter || t.type_transfert === typeFilter;
        const matchesStatus = !statusFilter || t.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const container = document.getElementById('transfersList');
    if (!container) return;

    if (!filtered.length) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Aucun transfert trouvé.</p>';
        return;
    }

    const statusLabels = { pending: 'En attente', approved: 'Validé', rejected: 'Rejeté' };
    const typeLabels = { transfert: 'Transfert', pret: 'Prêt', fin_contrat: 'Fin de contrat' };

    container.innerHTML = filtered.map(t => {
        const amount = t.montant ? formatMoney(t.montant) : '—';
        const typeLabel = typeLabels[t.type_transfert] || 'Transfert';
        const statusText = statusLabels[t.status] || t.status;

        return `
            <div class="transfer-card ${t.status}" data-id="${t.id}">
                <div class="transfer-info">
                    <div class="transfer-player">${t.footballeur_name}</div>
                    <div class="transfer-clubs">${t.club_depart || '—'} → ${t.club_arrivee || '—'}</div>
                    <div class="transfer-meta">
                        ${new Date(t.date_transfert).toLocaleDateString('fr-FR')} · ${typeLabel} · ${amount}
                    </div>
                </div>
                <div class="transfer-status ${t.status}">${statusText}</div>
                <div class="transfer-actions">
                    <button class="btn-action view" data-action="viewTransfer" data-id="${t.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" data-action="editTransfer" data-id="${t.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-action="confirmDeleteTransfer" data-id="${t.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
// Fin chargement transferts

// Début chargement offres
async function loadOffers() {
    showLoader(true);
    try {
        const { data, error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .select(`*, footballeur:user_hubisoccer_id ( hubisoccer_id, full_name )`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        offersData = (data || []).map(o => ({
            ...o,
            footballeur_name: o.footballeur?.full_name || 'Inconnu'
        }));
        renderOffers();
        updateStats();
    } catch (err) {
        console.error(err);
        showToast('Erreur chargement offres', 'error');
    } finally {
        showLoader(false);
    }
}

function renderOffers() {
    const search = document.getElementById('offerSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('offerTypeFilter')?.value || '';
    const statusFilter = document.getElementById('offerStatusFilter')?.value || '';

    const filtered = offersData.filter(o => {
        const matchesSearch = (o.footballeur_name || '').toLowerCase().includes(search) ||
                              (o.from_entity || '').toLowerCase().includes(search) ||
                              (o.title || '').toLowerCase().includes(search);
        const matchesType = !typeFilter || o.type === typeFilter;
        const matchesStatus = !statusFilter || o.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const container = document.getElementById('offersList');
    if (!container) return;

    if (!filtered.length) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Aucune offre trouvée.</p>';
        return;
    }

    const statusLabels = { pending: 'En attente', accepted: 'Acceptée', rejected: 'Rejetée' };

    container.innerHTML = filtered.map(o => {
        const amount = o.amount ? formatMoney(o.amount) : '—';
        const statusText = statusLabels[o.status] || o.status;

        return `
            <div class="offer-card ${o.status}" data-id="${o.id}">
                <div class="offer-info">
                    <div class="offer-player">${o.footballeur_name}</div>
                    <div class="offer-title">${o.title || 'Sans titre'}</div>
                    <div class="offer-meta">
                        ${o.from_entity || '—'} · ${new Date(o.created_at).toLocaleDateString('fr-FR')} · ${amount}
                    </div>
                </div>
                <div class="offer-status ${o.status}">${statusText}</div>
                <div class="offer-actions">
                    <button class="btn-action view" data-action="viewOffer" data-id="${o.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" data-action="editOffer" data-id="${o.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-action="confirmDeleteOffer" data-id="${o.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
// Fin chargement offres

// Début stats
function updateStats() {
    const data = currentTab === 'transfers' ? transfersData : offersData;
    const pending = data.filter(d => d.status === 'pending').length;
    const approved = data.filter(d => d.status === 'approved' || d.status === 'accepted').length;
    const rejected = data.filter(d => d.status === 'rejected').length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = data.length;
}
// Fin stats

// Début fonctions de visualisation (modale lecture seule)
function viewTransfer(id) {
    const transfer = transfersData.find(t => t.id === id);
    if (!transfer) return;

    document.getElementById('transferModalTitle').textContent = 'Détail du transfert';
    document.getElementById('transferId').value = transfer.id;
    document.getElementById('transferFootballeurId').value = transfer.user_hubisoccer_id;
    document.getElementById('transferFromClub').value = transfer.club_depart || '';
    document.getElementById('transferToClub').value = transfer.club_arrivee || '';
    document.getElementById('transferDate').value = transfer.date_transfert || '';
    document.getElementById('transferType').value = transfer.type_transfert || 'transfert';
    document.getElementById('transferAmount').value = transfer.montant || 0;
    document.getElementById('transferStatus').value = transfer.status || 'pending';

    // Désactiver les champs et cacher le bouton Enregistrer
    document.querySelectorAll('#transferForm input, #transferForm select').forEach(el => el.disabled = true);
    document.querySelector('#transferForm .btn-save').style.display = 'none';
    document.getElementById('transferModal').style.display = 'flex';
}

function viewOffer(id) {
    const offer = offersData.find(o => o.id === id);
    if (!offer) return;

    document.getElementById('offerModalTitle').textContent = 'Détail de l\'offre';
    document.getElementById('offerId').value = offer.id;
    document.getElementById('offerFootballeurId').value = offer.user_hubisoccer_id;
    document.getElementById('offerTitle').value = offer.title || '';
    document.getElementById('offerFromEntity').value = offer.from_entity || '';
    document.getElementById('offerType').value = offer.type || 'transfert';
    document.getElementById('offerAmount').value = offer.amount || 0;
    document.getElementById('offerDescription').value = offer.description || '';
    document.getElementById('offerStatusSelect').value = offer.status || 'pending';

    // Désactiver les champs et cacher le bouton Enregistrer
    document.querySelectorAll('#offerForm input, #offerForm select, #offerForm textarea').forEach(el => el.disabled = true);
    document.querySelector('#offerForm .btn-save').style.display = 'none';
    document.getElementById('offerModal').style.display = 'flex';
}
// Fin fonctions de visualisation

// Début gestion transferts (modal)
async function openTransferModal(transfer = null) {
    if (!allFootballeurs.length) await loadFootballeurs();

    const select = document.getElementById('transferFootballeurId');
    select.innerHTML = '<option value="">Sélectionner un footballeur</option>' +
        allFootballeurs.map(f => `<option value="${f.hubisoccer_id}">${f.full_name}</option>`).join('');

    document.getElementById('transferModalTitle').textContent = transfer ? 'Modifier le transfert' : 'Ajouter un transfert';

    // Réactiver les champs et afficher le bouton Enregistrer
    document.querySelectorAll('#transferForm input, #transferForm select').forEach(el => el.disabled = false);
    document.querySelector('#transferForm .btn-save').style.display = 'block';

    if (transfer) {
        document.getElementById('transferId').value = transfer.id;
        document.getElementById('transferFootballeurId').value = transfer.user_hubisoccer_id;
        document.getElementById('transferFromClub').value = transfer.club_depart || '';
        document.getElementById('transferToClub').value = transfer.club_arrivee || '';
        document.getElementById('transferDate').value = transfer.date_transfert || '';
        document.getElementById('transferType').value = transfer.type_transfert || 'transfert';
        document.getElementById('transferAmount').value = transfer.montant || 0;
        document.getElementById('transferStatus').value = transfer.status || 'pending';
    } else {
        document.getElementById('transferId').value = '';
        document.getElementById('transferFootballeurId').value = '';
        document.getElementById('transferFromClub').value = '';
        document.getElementById('transferToClub').value = '';
        document.getElementById('transferDate').value = '';
        document.getElementById('transferType').value = 'transfert';
        document.getElementById('transferAmount').value = '0';
        document.getElementById('transferStatus').value = 'pending';
    }

    document.getElementById('transferModal').style.display = 'flex';
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

document.getElementById('transferForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('transferId').value;
    const user_hubisoccer_id = document.getElementById('transferFootballeurId').value;
    const club_depart = document.getElementById('transferFromClub').value.trim();
    const club_arrivee = document.getElementById('transferToClub').value.trim();
    const date_transfert = document.getElementById('transferDate').value;
    const type_transfert = document.getElementById('transferType').value;
    const montant = parseInt(document.getElementById('transferAmount').value) || 0;
    const status = document.getElementById('transferStatus').value;

    if (!user_hubisoccer_id || !date_transfert) {
        showToast('Footballeur et date requis', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            user_hubisoccer_id,
            club_depart,
            club_arrivee,
            date_transfert,
            type_transfert,
            montant,
            status
        };
        if (id) {
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_transfers')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Transfert mis à jour', 'success');
        } else {
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_transfers')
                .insert([payload]);
            if (error) throw error;
            showToast('Transfert ajouté', 'success');
        }
        closeTransferModal();
        loadTransfers();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});

function editTransfer(id) {
    const transfer = transfersData.find(t => t.id === id);
    if (transfer) openTransferModal(transfer);
}

async function deleteTransfer(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_transfers')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Transfert supprimé', 'success');
        closeConfirmModal();
        loadTransfers();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
}

function confirmDeleteTransfer(id) {
    currentAction = { type: 'deleteTransfer', id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement ce transfert ?';
    document.getElementById('confirmModal').style.display = 'flex';
}
// Fin gestion transferts

// Début gestion offres (modal)
async function openOfferModal(offer = null) {
    if (!allFootballeurs.length) await loadFootballeurs();

    const select = document.getElementById('offerFootballeurId');
    select.innerHTML = '<option value="">Sélectionner un footballeur</option>' +
        allFootballeurs.map(f => `<option value="${f.hubisoccer_id}">${f.full_name}</option>`).join('');

    document.getElementById('offerModalTitle').textContent = offer ? 'Modifier l\'offre' : 'Ajouter une offre';

    // Réactiver les champs et afficher le bouton Enregistrer
    document.querySelectorAll('#offerForm input, #offerForm select, #offerForm textarea').forEach(el => el.disabled = false);
    document.querySelector('#offerForm .btn-save').style.display = 'block';

    if (offer) {
        document.getElementById('offerId').value = offer.id;
        document.getElementById('offerFootballeurId').value = offer.user_hubisoccer_id;
        document.getElementById('offerTitle').value = offer.title || '';
        document.getElementById('offerFromEntity').value = offer.from_entity || '';
        document.getElementById('offerType').value = offer.type || 'transfert';
        document.getElementById('offerAmount').value = offer.amount || 0;
        document.getElementById('offerDescription').value = offer.description || '';
        document.getElementById('offerStatusSelect').value = offer.status || 'pending';
    } else {
        document.getElementById('offerId').value = '';
        document.getElementById('offerFootballeurId').value = '';
        document.getElementById('offerTitle').value = '';
        document.getElementById('offerFromEntity').value = '';
        document.getElementById('offerType').value = 'transfert';
        document.getElementById('offerAmount').value = '0';
        document.getElementById('offerDescription').value = '';
        document.getElementById('offerStatusSelect').value = 'pending';
    }

    document.getElementById('offerModal').style.display = 'flex';
}

function closeOfferModal() {
    document.getElementById('offerModal').style.display = 'none';
}

document.getElementById('offerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('offerId').value;
    const user_hubisoccer_id = document.getElementById('offerFootballeurId').value;
    const title = document.getElementById('offerTitle').value.trim();
    const from_entity = document.getElementById('offerFromEntity').value.trim();
    const type = document.getElementById('offerType').value;
    const amount = parseInt(document.getElementById('offerAmount').value) || 0;
    const description = document.getElementById('offerDescription').value.trim();
    const status = document.getElementById('offerStatusSelect').value;

    if (!user_hubisoccer_id) {
        showToast('Footballeur requis', 'warning');
        return;
    }

    showLoader(true);
    try {
        const payload = {
            user_hubisoccer_id,
            title,
            from_entity,
            type,
            amount,
            description,
            status
        };
        if (id) {
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_offers')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            showToast('Offre mise à jour', 'success');
        } else {
            const { error } = await supabaseClient
                .from('supabaseAuthPrive_offers')
                .insert([payload]);
            if (error) throw error;
            showToast('Offre ajoutée', 'success');
        }
        closeOfferModal();
        loadOffers();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
});

function editOffer(id) {
    const offer = offersData.find(o => o.id === id);
    if (offer) openOfferModal(offer);
}

async function deleteOffer(id) {
    showLoader(true);
    try {
        const { error } = await supabaseClient
            .from('supabaseAuthPrive_offers')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Offre supprimée', 'success');
        closeConfirmModal();
        loadOffers();
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    } finally {
        showLoader(false);
    }
}

function confirmDeleteOffer(id) {
    currentAction = { type: 'deleteOffer', id };
    document.getElementById('confirmModalMessage').textContent = 'Supprimer définitivement cette offre ?';
    document.getElementById('confirmModal').style.display = 'flex';
}
// Fin gestion offres

// Début confirm modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentAction = null;
}

function executeAction() {
    if (!currentAction) return;
    if (currentAction.type === 'deleteTransfer') {
        deleteTransfer(currentAction.id);
    } else if (currentAction.type === 'deleteOffer') {
        deleteOffer(currentAction.id);
    }
}
// Fin confirm modal

// Début export
function exportData(format) {
    const data = currentTab === 'transfers' ? transfersData : offersData;
    const rows = data.map(d => {
        if (currentTab === 'transfers') {
            return {
                Footballeur: d.footballeur_name,
                Départ: d.club_depart || '',
                Arrivée: d.club_arrivee || '',
                Date: d.date_transfert,
                Type: d.type_transfert,
                Montant: d.montant,
                Statut: d.status
            };
        } else {
            return {
                Footballeur: d.footballeur_name,
                Titre: d.title || '',
                Entité: d.from_entity || '',
                Type: d.type,
                Montant: d.amount,
                Statut: d.status
            };
        }
    });

    if (format === 'csv') {
        const headers = Object.keys(rows[0] || {}).join(',');
        const csvRows = rows.map(r => Object.values(r).map(v => `"${v}"`).join(','));
        const csv = [headers, ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${currentTab}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, currentTab);
        XLSX.writeFile(wb, `${currentTab}.xlsx`);
    }
}
// Fin export

// Début UI Tabs
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById(`tab-${tab}`).classList.add('active');
            currentTab = tab;
            updateStats();
        });
    });
}
// Fin UI Tabs

// Début UI Sidebar, Menu, Logout
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
    document.addEventListener('touchstart', e => {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
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
    menu.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
}

function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../../authprive/users/login.html';
        });
    });
}
// Fin UI Sidebar, Menu, Logout

// Début événements filtres
document.getElementById('transferSearch')?.addEventListener('input', renderTransfers);
document.getElementById('transferTypeFilter')?.addEventListener('change', renderTransfers);
document.getElementById('transferStatusFilter')?.addEventListener('change', renderTransfers);
document.getElementById('offerSearch')?.addEventListener('input', renderOffers);
document.getElementById('offerTypeFilter')?.addEventListener('change', renderOffers);
document.getElementById('offerStatusFilter')?.addEventListener('change', renderOffers);
document.getElementById('refreshBtn')?.addEventListener('click', () => {
    if (currentTab === 'transfers') loadTransfers();
    else loadOffers();
});
document.getElementById('addTransferBtn')?.addEventListener('click', () => openTransferModal());
document.getElementById('addOfferBtn')?.addEventListener('click', () => openOfferModal());
document.getElementById('exportBtn')?.addEventListener('click', () => {
    document.getElementById('exportMenu').classList.toggle('show');
});
document.querySelectorAll('.export-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
        exportData(btn.dataset.format);
        document.getElementById('exportMenu').classList.remove('show');
    });
});
// Fin événements filtres

// Début délégation d'événements pour les boutons d'action (compatible mobile)
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;
    e.preventDefault();
    e.stopPropagation();

    if (action === 'viewTransfer') viewTransfer(id);
    else if (action === 'editTransfer') editTransfer(id);
    else if (action === 'confirmDeleteTransfer') confirmDeleteTransfer(id);
    else if (action === 'viewOffer') viewOffer(id);
    else if (action === 'editOffer') editOffer(id);
    else if (action === 'confirmDeleteOffer') confirmDeleteOffer(id);
});
// Fin délégation d'événements

// Début initialisation
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdmin()) return;
    await loadFootballeurs();
    initSidebar();
    initUserMenu();
    initLogout();
    initTabs();
    await loadTransfers();
    await loadOffers();

    // Exposer les fonctions globalement (utile pour les appels directs éventuels)
    window.viewTransfer = viewTransfer;
    window.editTransfer = editTransfer;
    window.confirmDeleteTransfer = confirmDeleteTransfer;
    window.viewOffer = viewOffer;
    window.editOffer = editOffer;
    window.confirmDeleteOffer = confirmDeleteOffer;
    window.closeConfirmModal = closeConfirmModal;
    window.executeAction = executeAction;
    window.closeTransferModal = closeTransferModal;
    window.closeOfferModal = closeOfferModal;

    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation
