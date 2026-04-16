// ============================================================
//  HUBISOCCER — MESSAGERIE / UTILS.JS (LOCAL & AUTONOME)
//  Fonctions utilitaires pour la messagerie
// ============================================================

'use strict';

// ========== DEBUT : FONCTIONS D'INTERFACE ==========
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'exclamation-circle' :
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    toastEl.innerHTML = `<i class="fas fa-${icon}"></i><span>${escapeHtml(message)}</span><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 5000);
}

function setLoader(show, message = 'Chargement...') {
    const loader = document.getElementById('globalLoader');
    const text = document.getElementById('loaderText');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (text) text.textContent = message;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(fullName) {
    if (!fullName) return '?';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function timeSince(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} an${interval > 1 ? 's' : ''}`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} mois`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} j`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} h`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} min`;
    return `À l'instant`;
}

async function logout() {
    await sb.auth.signOut();
    window.location.href = '../index.html';
}
// ========== FIN : FONCTIONS D'INTERFACE ==========

// ========== DEBUT : EXPOSITION GLOBALE ==========
window.toast = toast;
window.setLoader = setLoader;
window.openModal = openModal;
window.closeModal = closeModal;
window.escapeHtml = escapeHtml;
window.getInitials = getInitials;
window.timeSince = timeSince;
window.logout = logout;
// ========== FIN : EXPOSITION GLOBALE ==========