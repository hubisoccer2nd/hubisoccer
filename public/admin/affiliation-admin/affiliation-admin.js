// ========== AFFILIATION-ADMIN.JS (CORRIGÉ) ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let affiliates = [];
let paymentRequests = [];

// ========== STATISTIQUES ==========
async function loadStats() {
    const { data: affiliatesData } = await supabaseAdmin.from('public_affiliates').select('*');
    const { data: conversionsData } = await supabaseAdmin.from('public_affiliate_conversions').select('*');
    const { data: paymentsData } = await supabaseAdmin.from('public_withdraw_requests').select('*');
    
    const totalAffiliates = affiliatesData?.length || 0;
    const totalValidated = affiliatesData?.filter(a => a.valide === true).length || 0;
    const totalInscriptions = conversionsData?.filter(c => c.conversion_type === 'inscription_sportif').length || 0;
    const totalVentes = conversionsData?.filter(c => c.conversion_type === 'achat_produit').length || 0;
    const totalPayments = paymentsData?.length || 0;
    const totalAmountPaid = paymentsData?.filter(p => p.status === 'approuvé').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    document.getElementById('statsRow').innerHTML = `
        <div class="stat-box"><h3>${totalAffiliates}</h3><p>Affiliés inscrits</p></div>
        <div class="stat-box"><h3>${totalValidated}</h3><p>Affiliés validés</p></div>
        <div class="stat-box"><h3>${totalInscriptions}</h3><p>Inscriptions sportifs</p></div>
        <div class="stat-box"><h3>${totalVentes}</h3><p>Achats générés</p></div>
        <div class="stat-box"><h3>${totalPayments}</h3><p>Demandes de retrait</p></div>
        <div class="stat-box"><h3>${totalAmountPaid.toLocaleString()} FCFA</h3><p>Total retiré</p></div>
    `;
}

// ========== AFFILIÉS ==========
async function loadAffiliates() {
    const { data, error } = await supabaseAdmin.from('public_affiliates').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    affiliates = data || [];
    renderAffiliates();
}

function renderAffiliates() {
    const searchTerm = document.getElementById('searchAffiliate')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    let filtered = affiliates;
    if (searchTerm) {
        filtered = filtered.filter(a => a.id.toLowerCase().includes(searchTerm) || a.nom?.toLowerCase().includes(searchTerm) || a.telephone?.includes(searchTerm));
    }
    if (statusFilter === 'valide') filtered = filtered.filter(a => a.valide === true);
    if (statusFilter === 'non_valide') filtered = filtered.filter(a => a.valide !== true);
    
    const container = document.getElementById('affiliatesList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun affilié trouvé.</p>';
        return;
    }
    let html = '';
    filtered.forEach(a => {
        html += `
            <div class="list-item" data-id="${a.id}">
                <div class="info">
                    <strong>${a.nom || 'Anonyme'}</strong>
                    <small>ID: ${a.id}</small>
                    <small>Tél: ${a.telephone || '-'}</small>
                    <small>Pays: ${a.pays || '-'}</small>
                    <small>Statut: ${a.valide ? '✅ Validé' : '⏳ En attente'}</small>
                </div>
                <div class="actions">
                    ${!a.valide ? `<button class="btn-validate" onclick="validateAffiliate('${a.id}')">Valider</button>` : ''}
                    <button class="btn-reject" onclick="blockAffiliate('${a.id}')">Bloquer</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.validateAffiliate = async (id) => {
    if (!confirm('Valider cet affilié ?')) return;
    const { error } = await supabaseAdmin.from('public_affiliates').update({ valide: true }).eq('id', id);
    if (error) alert('Erreur : ' + error.message);
    else { alert('Affilié validé'); loadAffiliates(); loadStats(); }
};

window.blockAffiliate = async (id) => {
    if (!confirm('Bloquer cet affilié ?')) return;
    const { error } = await supabaseAdmin.from('public_affiliates').update({ valide: false }).eq('id', id);
    if (error) alert('Erreur : ' + error.message);
    else { alert('Affilié bloqué'); loadAffiliates(); loadStats(); }
};

// ========== DEMANDES DE RETRAIT ==========
async function loadPaymentRequests() {
    const { data, error } = await supabaseAdmin.from('public_withdraw_requests').select('*').order('requested_at', { ascending: false });
    if (error) { console.error(error); return; }
    paymentRequests = data || [];
    renderPaymentRequests();
}

function renderPaymentRequests() {
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';
    let filtered = paymentRequests;
    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    
    const container = document.getElementById('paymentsList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune demande de retrait.</p>';
        return;
    }
    let html = '';
    for (const req of filtered) {
        const affiliate = affiliates.find(a => a.id === req.affiliate_id);
        const affiliateName = affiliate ? affiliate.nom : req.affiliate_id;
        html += `
            <div class="list-item" data-id="${req.id}">
                <div class="info">
                    <strong>${affiliateName}</strong>
                    <small>Montant: ${req.amount.toLocaleString()} FCFA</small>
                    <small>Statut: ${req.status === 'en_attente' ? '⏳ En attente' : (req.status === 'approuvé' ? '✅ Approuvé' : '❌ Refusé')}</small>
                    <small>Date: ${new Date(req.requested_at).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    ${req.status === 'en_attente' ? `<button class="btn-approve" onclick="approvePayment('${req.id}')">Approuver</button><button class="btn-refuse" onclick="refusePayment('${req.id}')">Refuser</button>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.approvePayment = async (id) => {
    if (!confirm('Approuver cette demande de retrait ?')) return;
    const { error } = await supabaseAdmin.from('public_withdraw_requests').update({ status: 'approuvé', processed_at: new Date().toISOString() }).eq('id', id);
    if (error) alert('Erreur : ' + error.message);
    else { alert('Retrait approuvé'); loadPaymentRequests(); loadStats(); }
};

window.refusePayment = async (id) => {
    const reason = prompt('Motif du refus (optionnel) :');
    const { error } = await supabaseAdmin.from('public_withdraw_requests').update({ status: 'rejeté', processed_at: new Date().toISOString() }).eq('id', id);
    if (error) alert('Erreur : ' + error.message);
    else { alert('Retrait refusé'); loadPaymentRequests(); loadStats(); }
};

// ========== MESSAGES ==========
async function loadMessages() {
    const { data, error } = await supabaseAdmin.from('public_affiliate_messages').select('*, public_affiliates(nom)').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const container = document.getElementById('messagesList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun message envoyé.</p>';
        return;
    }
    let html = '';
    data.forEach(msg => {
        const affiliateName = msg.public_affiliates?.nom || msg.affiliate_id;
        html += `
            <div class="list-item">
                <div class="info">
                    <strong>À: ${affiliateName}</strong>
                    <p>${msg.message}</p>
                    <small>${new Date(msg.created_at).toLocaleString()}</small>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function populateAffiliateSelect() {
    const { data, error } = await supabaseAdmin.from('public_affiliates').select('id, nom').order('nom');
    if (error) return;
    const select = document.getElementById('targetAffiliate');
    select.innerHTML = '<option value="">Sélectionner un affilié</option>';
    data.forEach(aff => {
        select.innerHTML += `<option value="${aff.id}">${aff.nom || aff.id}</option>`;
    });
}

document.getElementById('sendMessageBtn')?.addEventListener('click', async () => {
    const affiliateId = document.getElementById('targetAffiliate').value;
    const message = document.getElementById('adminMessage').value.trim();
    if (!affiliateId || !message) {
        alert('Veuillez sélectionner un affilié et écrire un message.');
        return;
    }
    const { error } = await supabaseAdmin.from('public_affiliate_messages').insert([{
        affiliate_id: affiliateId,
        message: message,
        created_at: new Date().toISOString()
    }]);
    if (error) alert('Erreur : ' + error.message);
    else {
        alert('Message envoyé');
        document.getElementById('adminMessage').value = '';
        loadMessages();
    }
});

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await loadAffiliates();
    await loadPaymentRequests();
    await loadMessages();
    await populateAffiliateSelect();

    // Onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'affiliates') loadAffiliates();
            if (btn.dataset.tab === 'payments') loadPaymentRequests();
            if (btn.dataset.tab === 'messages') loadMessages();
        });
    });

    // Rafraîchissements et filtres
    document.getElementById('refreshAffiliates')?.addEventListener('click', loadAffiliates);
    document.getElementById('refreshPayments')?.addEventListener('click', loadPaymentRequests);
    document.getElementById('searchAffiliate')?.addEventListener('input', renderAffiliates);
    document.getElementById('statusFilter')?.addEventListener('change', renderAffiliates);
    document.getElementById('paymentStatusFilter')?.addEventListener('change', renderPaymentRequests);

    // Déconnexion (si tu veux plus tard une vraie auth admin)
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Se déconnecter ?')) window.location.href = '../administration.html';
    });
});