// ========== EMARKET-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ÉLÉMENTS DOM GÉNÉRAUX ==========
const globalLoader = document.getElementById('globalLoader');
function showLoader() { if (globalLoader) globalLoader.style.display = 'flex'; }
function hideLoader() { if (globalLoader) globalLoader.style.display = 'none'; }

function showToast(message, type = 'info') {
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
    setTimeout(() => toast.remove(), 3000);
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== ONGLETS ==========
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        if (tabId === 'products') loadProducts();
        else if (tabId === 'orders') loadOrders();
        else if (tabId === 'customers') loadCustomers();
        else if (tabId === 'messages') loadMessages();
    });
});

// ========== PRODUITS ==========
let currentProductId = null;
let existingMediaIds = [];
let deletedMediaIds = [];
let pendingMediaFiles = [];

const productsList = document.getElementById('productsList');
const newProductBtn = document.getElementById('newProductBtn');
const refreshProductsBtn = document.getElementById('refreshProductsBtn');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productIdField = document.getElementById('productId');
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const productStock = document.getElementById('productStock');
const productPaymentUrl = document.getElementById('productPaymentUrl');
const productFeatured = document.getElementById('productFeatured');
const mediaList = document.getElementById('mediaList');
const addImageBtn = document.getElementById('addImageBtn');
const addVideoBtn = document.getElementById('addVideoBtn');
const mediaFileInput = document.getElementById('mediaFileInput');
const closeModalBtns = document.querySelectorAll('.close-modal');

async function loadProducts() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_emarket_products')
            .select('*')
            .order('id', { ascending: true });
        if (error) throw error;
        renderProducts(data || []);
    } catch (err) { showToast('Erreur chargement produits', 'error'); } finally { hideLoader(); }
}

function renderProducts(products) {
    if (!productsList) return;
    if (!products.length) { productsList.innerHTML = '<p>Aucun produit.</p>'; return; }
    let html = '';
    for (const p of products) {
        html += `
            <div class="item-card" data-id="${p.id}">
                <h3>${escapeHtml(p.name)}</h3>
                <p><strong>Prix:</strong> ${p.price} FCFA</p>
                <p><strong>Stock:</strong> ${p.stock} unités</p>
                <p>${p.featured ? '<span class="badge" style="background:var(--gold);">Vedette</span>' : ''}</p>
                <div class="card-actions">
                    <button class="btn-edit" data-id="${p.id}">✏️ Modifier</button>
                    <button class="btn-delete" data-id="${p.id}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }
    productsList.innerHTML = html;
    document.querySelectorAll('#productsList .btn-edit').forEach(btn => btn.addEventListener('click', () => editProduct(btn.dataset.id)));
    document.querySelectorAll('#productsList .btn-delete').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
}

async function loadProductMedia(productId) {
    const { data, error } = await supabaseAdmin
        .from('public_emarket_product_media')
        .select('*')
        .eq('product_id', productId)
        .order('position');
    if (error) return [];
    return data || [];
}

function renderMediaList(mediaItems, existingIds) {
    if (!mediaList) return;
    let html = '';
    for (const m of mediaItems) {
        html += `
            <div class="media-item" data-media-id="${m.id}">
                ${m.media_type === 'image'
                    ? `<img src="${m.media_url}" alt="Image produit">`
                    : `<video src="${m.media_url}" controls></video>`}
                <button type="button" class="btn-delete-media" data-id="${m.id}"><i class="fas fa-times"></i></button>
            </div>
        `;
    }
    for (const pf of pendingMediaFiles) {
        const isImage = pf.type === 'image';
        const url = URL.createObjectURL(pf.file);
        html += `
            <div class="media-item pending">
                ${isImage
                    ? `<img src="${url}" alt="Nouveau média">`
                    : `<video src="${url}" controls></video>`}
                <button type="button" class="btn-remove-pending"><i class="fas fa-times"></i></button>
            </div>
        `;
    }
    mediaList.innerHTML = html;

    // Suppression d'un média existant
    document.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', () => {
            const mediaId = parseInt(btn.dataset.id);
            deletedMediaIds.push(mediaId);
            existingMediaIds = existingMediaIds.filter(id => id !== mediaId);
            renderMediaList(
                mediaItems.filter(m => m.id !== mediaId),
                existingMediaIds
            );
        });
    });
    // Suppression d'un média en attente
    document.querySelectorAll('.btn-remove-pending').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            pendingMediaFiles.splice(index, 1);
            renderMediaList(mediaItems, existingMediaIds);
        });
    });
}

async function editProduct(id) {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_emarket_products')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        currentProductId = data.id;
        productIdField.value = data.id;
        productName.value = data.name;
        productDescription.value = data.description || '';
        productPrice.value = data.price;
        productStock.value = data.stock || 0;
        productPaymentUrl.value = data.payment_url || '';
        productFeatured.checked = data.featured || false;

        const mediaItems = await loadProductMedia(data.id);
        existingMediaIds = mediaItems.map(m => m.id);
        deletedMediaIds = [];
        pendingMediaFiles = [];
        renderMediaList(mediaItems, existingMediaIds);

        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        productModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement produit', 'error'); } finally { hideLoader(); }
}

async function deleteProduct(id) {
    if (!confirm('Supprimer définitivement ce produit et tous ses médias ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_emarket_products')
            .delete()
            .eq('id', id);
        if (error) throw error;
        showToast('Produit supprimé', 'success');
        loadProducts();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}

newProductBtn.addEventListener('click', () => {
    currentProductId = null;
    productIdField.value = '';
    productName.value = '';
    productDescription.value = '';
    productPrice.value = '';
    productStock.value = '0';
    productPaymentUrl.value = '';
    productFeatured.checked = false;
    existingMediaIds = [];
    deletedMediaIds = [];
    pendingMediaFiles = [];
    renderMediaList([], []);
    document.getElementById('productModalTitle').textContent = 'Nouveau produit';
    productModal.classList.add('active');
});

addImageBtn.addEventListener('click', () => {
    mediaFileInput.accept = 'image/jpeg,image/png';
    mediaFileInput.click();
});
addVideoBtn.addEventListener('click', () => {
    mediaFileInput.accept = 'video/mp4,video/webm';
    mediaFileInput.click();
});

mediaFileInput.addEventListener('change', () => {
    if (mediaFileInput.files.length) {
        const file = mediaFileInput.files[0];
        const isVideo = file.type.startsWith('video/');
        const type = isVideo ? 'video' : 'image';
        pendingMediaFiles.push({ file, type });
        if (currentProductId) {
            loadProductMedia(currentProductId).then(mediaItems => {
                existingMediaIds = mediaItems.map(m => m.id);
                renderMediaList(mediaItems, existingMediaIds);
            });
        } else {
            renderMediaList([], []);
        }
        mediaFileInput.value = '';
    }
});

async function uploadMediaFile(file, productId) {
    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `products/media/${productId}/${safeName}`;
    const { error } = await supabaseAdmin.storage
        .from('emarket_invoices')
        .upload(filePath, file);
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage
        .from('emarket_invoices')
        .getPublicUrl(filePath);
    return urlData.publicUrl;
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = productName.value.trim();
    const description = productDescription.value.trim() || null;
    const price = parseInt(productPrice.value);
    const stock = parseInt(productStock.value) || 0;
    const paymentUrl = productPaymentUrl.value.trim() || null;
    const featured = productFeatured.checked;

    if (!name || isNaN(price)) {
        showToast('Nom et prix requis', 'warning');
        return;
    }

    showLoader();
    try {
        let productId = currentProductId;
        const productData = { name, description, price, stock, payment_url: paymentUrl, featured };

        if (productId) {
            const { error } = await supabaseAdmin
                .from('public_emarket_products')
                .update(productData)
                .eq('id', productId);
            if (error) throw error;
        } else {
            const { data: newProduct, error } = await supabaseAdmin
                .from('public_emarket_products')
                .insert([productData])
                .select()
                .single();
            if (error) throw error;
            productId = newProduct.id;
            currentProductId = productId;
        }

        // Supprimer les médias marqués
        if (deletedMediaIds.length > 0) {
            const { error: delError } = await supabaseAdmin
                .from('public_emarket_product_media')
                .delete()
                .in('id', deletedMediaIds);
            if (delError) throw delError;
        }

        // Ajouter les nouveaux médias
        for (const pf of pendingMediaFiles) {
            const url = await uploadMediaFile(pf.file, productId);
            const { error: insError } = await supabaseAdmin
                .from('public_emarket_product_media')
                .insert([{
                    product_id: productId,
                    media_url: url,
                    media_type: pf.type,
                    position: 0
                }]);
            if (insError) throw insError;
        }

        // Réindexer les positions
        const { data: allMedia } = await supabaseAdmin
            .from('public_emarket_product_media')
            .select('id')
            .eq('product_id', productId)
            .order('id');
        if (allMedia) {
            for (let i = 0; i < allMedia.length; i++) {
                await supabaseAdmin
                    .from('public_emarket_product_media')
                    .update({ position: i + 1 })
                    .eq('id', allMedia[i].id);
            }
        }

        showToast('Produit sauvegardé avec succès', 'success');
        productModal.classList.remove('active');
        loadProducts();
    } catch (err) {
        console.error(err);
        showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
        hideLoader();
        pendingMediaFiles = [];
        deletedMediaIds = [];
        existingMediaIds = [];
    }
});

// ========== COMMANDES ==========
const ordersList = document.getElementById('ordersList');
const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
const orderStatusFilter = document.getElementById('orderStatusFilter');
const orderDetailModal = document.getElementById('orderDetailModal');
const orderDetailContent = document.getElementById('orderDetailContent');
const orderStatusUpdate = document.getElementById('orderStatusUpdate');
const updateOrderStatusBtn = document.getElementById('updateOrderStatusBtn');
const adminReplyMessage = document.getElementById('adminReplyMessage');
const sendAdminReplyBtn = document.getElementById('sendAdminReplyBtn');
let currentOrderId = null;

async function loadOrders() {
    showLoader();
    try {
        let query = supabaseAdmin
            .from('public_emarket_orders')
            .select('*, public_emarket_customers(first_name, last_name, email)')
            .order('created_at', { ascending: false });
        const status = orderStatusFilter.value;
        if (status !== 'all') query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        renderOrders(data || []);
    } catch (err) { showToast('Erreur chargement commandes', 'error'); } finally { hideLoader(); }
}

function renderOrders(orders) {
    if (!ordersList) return;
    if (!orders.length) { ordersList.innerHTML = '<p>Aucune commande.</p>'; return; }
    let html = '';
    for (const o of orders) {
        const customerName = o.public_emarket_customers ? `${o.public_emarket_customers.first_name} ${o.public_emarket_customers.last_name}` : 'Client inconnu';
        html += `
            <div class="item-card" data-id="${o.id}">
                <h3>Commande #${o.id}</h3>
                <p><strong>Client:</strong> ${escapeHtml(customerName)}</p>
                <p><strong>Total TTC:</strong> ${o.total_ttc} FCFA</p>
                <p><strong>Statut:</strong> <span class="badge ${o.status}">${getStatusLabel(o.status)}</span></p>
                <div class="card-actions">
                    <button class="btn-view" data-id="${o.id}">👁️ Détails</button>
                </div>
            </div>
        `;
    }
    ordersList.innerHTML = html;
    document.querySelectorAll('#ordersList .btn-view').forEach(btn => btn.addEventListener('click', () => openOrderDetail(btn.dataset.id)));
}

function getStatusLabel(status) {
    switch(status) {
        case 'en_attente': return 'En attente';
        case 'payee': return 'Payée';
        case 'expediee': return 'Expédiée';
        case 'livree': return 'Livrée';
        case 'annulee': return 'Annulée';
        default: return status;
    }
}

async function openOrderDetail(orderId) {
    currentOrderId = orderId;
    showLoader();
    try {
        const { data: order, error } = await supabaseAdmin
            .from('public_emarket_orders')
            .select('*, public_emarket_customers(first_name, last_name, email, phone), public_emarket_order_items(*, public_emarket_products(name))')
            .eq('id', orderId)
            .single();
        if (error) throw error;
        const customer = order.public_emarket_customers;
        let itemsHtml = '';
        for (const item of order.public_emarket_order_items) {
            itemsHtml += `<p>${item.public_emarket_products.name} x${item.quantity} = ${item.total_price} FCFA</p>`;
        }
        orderDetailContent.innerHTML = `
            <p><strong>Client:</strong> ${customer ? customer.first_name + ' ' + customer.last_name : '?'}</p>
            <p><strong>Email:</strong> ${customer ? customer.email : '?'}</p>
            <p><strong>Téléphone:</strong> ${customer ? customer.phone : '?'}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            <p><strong>Total HT:</strong> ${order.total_ht} FCFA</p>
            <p><strong>TVA:</strong> ${order.tva} FCFA</p>
            <p><strong>Total TTC:</strong> ${order.total_ttc} FCFA</p>
            <p><strong>Articles:</strong></p>
            ${itemsHtml}
            ${order.invoice_proforma_url ? `<p><a href="${order.invoice_proforma_url}" target="_blank">Facture proforma</a></p>` : ''}
            ${order.invoice_definitive_url ? `<p><a href="${order.invoice_definitive_url}" target="_blank">Facture définitive</a></p>` : ''}
        `;
        orderStatusUpdate.value = order.status;
        adminReplyMessage.value = '';
        orderDetailModal.classList.add('active');
    } catch (err) { showToast('Erreur chargement détails', 'error'); } finally { hideLoader(); }
}

updateOrderStatusBtn.addEventListener('click', async () => {
    const newStatus = orderStatusUpdate.value;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_emarket_orders')
            .update({ status: newStatus })
            .eq('id', currentOrderId);
        if (error) throw error;
        showToast('Statut mis à jour', 'success');
        orderDetailModal.classList.remove('active');
        loadOrders();
    } catch (err) { showToast('Erreur mise à jour', 'error'); } finally { hideLoader(); }
});

sendAdminReplyBtn.addEventListener('click', async () => {
    const reply = adminReplyMessage.value.trim();
    if (!reply) { showToast('Message vide', 'warning'); return; }
    showLoader();
    try {
        const { data: order } = await supabaseAdmin
            .from('public_emarket_orders')
            .select('customer_id')
            .eq('id', currentOrderId)
            .single();
        if (order) {
            const { error } = await supabaseAdmin
                .from('public_emarket_messages')
                .insert([{
                    customer_id: order.customer_id,
                    order_id: currentOrderId,
                    message: reply,
                    admin_reply: null,
                    is_read: false
                }]);
            if (error) throw error;
            showToast('Réponse envoyée au client', 'success');
            adminReplyMessage.value = '';
        }
    } catch (err) { showToast('Erreur envoi réponse', 'error'); } finally { hideLoader(); }
});
refreshOrdersBtn.addEventListener('click', loadOrders);
orderStatusFilter.addEventListener('change', loadOrders);

// ========== CLIENTS ==========
const customersList = document.getElementById('customersList');
const refreshCustomersBtn = document.getElementById('refreshCustomersBtn');
async function loadCustomers() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_emarket_customers')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderCustomers(data || []);
    } catch (err) { showToast('Erreur chargement clients', 'error'); } finally { hideLoader(); }
}
function renderCustomers(customers) {
    if (!customersList) return;
    if (!customers.length) { customersList.innerHTML = '<p>Aucun client.</p>'; return; }
    let html = '';
    for (const c of customers) {
        html += `
            <div class="item-card">
                <h3>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</h3>
                <p><strong>Email:</strong> ${escapeHtml(c.email)}</p>
                <p><strong>Tél:</strong> ${escapeHtml(c.phone || '-')}</p>
                <p><strong>Inscrit le:</strong> ${new Date(c.created_at).toLocaleDateString()}</p>
            </div>
        `;
    }
    customersList.innerHTML = html;
}
refreshCustomersBtn.addEventListener('click', loadCustomers);

// ========== MESSAGES ==========
const messagesList = document.getElementById('messagesList');
const refreshMessagesBtn = document.getElementById('refreshMessagesBtn');
const messageReplyModal = document.getElementById('messageReplyModal');
const replyMessageId = document.getElementById('replyMessageId');
const replyContent = document.getElementById('replyContent');
const sendReplyBtn = document.getElementById('sendReplyBtn');
let currentMessageId = null;

async function loadMessages() {
    showLoader();
    try {
        const { data, error } = await supabaseAdmin
            .from('public_emarket_messages')
            .select('*, public_emarket_customers(first_name, last_name, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        renderMessages(data || []);
    } catch (err) { showToast('Erreur chargement messages', 'error'); } finally { hideLoader(); }
}
function renderMessages(messages) {
    if (!messagesList) return;
    if (!messages.length) { messagesList.innerHTML = '<p>Aucun message.</p>'; return; }
    let html = '';
    for (const msg of messages) {
        const customer = msg.public_emarket_customers;
        const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Client inconnu';
        html += `
            <div class="item-card" data-id="${msg.id}">
                <h3>De: ${escapeHtml(customerName)}</h3>
                <p><strong>Email:</strong> ${customer ? escapeHtml(customer.email) : '-'}</p>
                ${msg.order_id ? `<p><strong>Commande #${msg.order_id}</strong></p>` : ''}
                <p><strong>Message:</strong> ${escapeHtml(msg.message)}</p>
                ${msg.admin_reply ? `<p><strong>Réponse admin:</strong> ${escapeHtml(msg.admin_reply)}</p>` : ''}
                <div class="card-actions">
                    ${!msg.admin_reply ? `<button class="btn-reply" data-id="${msg.id}">✏️ Répondre</button>` : ''}
                    <button class="btn-delete" data-id="${msg.id}">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }
    messagesList.innerHTML = html;
    document.querySelectorAll('#messagesList .btn-reply').forEach(btn => btn.addEventListener('click', () => openReplyModal(btn.dataset.id)));
    document.querySelectorAll('#messagesList .btn-delete').forEach(btn => btn.addEventListener('click', () => deleteMessage(btn.dataset.id)));
}
function openReplyModal(messageId) {
    currentMessageId = messageId;
    replyMessageId.value = messageId;
    replyContent.value = '';
    messageReplyModal.classList.add('active');
}
async function deleteMessage(messageId) {
    if (!confirm('Supprimer ce message ?')) return;
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_emarket_messages')
            .delete()
            .eq('id', messageId);
        if (error) throw error;
        showToast('Message supprimé', 'success');
        loadMessages();
    } catch (err) { showToast('Erreur suppression', 'error'); } finally { hideLoader(); }
}
sendReplyBtn.addEventListener('click', async () => {
    const reply = replyContent.value.trim();
    if (!reply) { showToast('Veuillez écrire une réponse', 'warning'); return; }
    showLoader();
    try {
        const { error } = await supabaseAdmin
            .from('public_emarket_messages')
            .update({ admin_reply: reply, is_read: true })
            .eq('id', currentMessageId);
        if (error) throw error;
        showToast('Réponse envoyée', 'success');
        messageReplyModal.classList.remove('active');
        loadMessages();
    } catch (err) { showToast('Erreur envoi réponse', 'error'); } finally { hideLoader(); }
});
refreshMessagesBtn.addEventListener('click', loadMessages);

// ========== FERMETURE MODALES ==========
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.classList.remove('active');
        orderDetailModal.classList.remove('active');
        messageReplyModal.classList.remove('active');
    });
});
window.addEventListener('click', (e) => {
    if (e.target === productModal) productModal.classList.remove('active');
    if (e.target === orderDetailModal) orderDetailModal.classList.remove('active');
    if (e.target === messageReplyModal) messageReplyModal.classList.remove('active');
});

// ========== MENU MOBILE ==========
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => { navLinks.classList.toggle('active'); menuToggle.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); showToast('Déconnexion (à venir)', 'info'); });

// ========== INITIALISATION ==========
loadProducts();
loadOrders();
loadCustomers();
loadMessages();