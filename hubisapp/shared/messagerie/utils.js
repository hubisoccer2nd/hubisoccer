// ============================================================
//  HUBISOCCER — MESSAGERIE / UTILS.JS (LOCAL & AUTONOME)
//  Fonctions utilitaires pour la messagerie
//  Toast : 30 secondes d'affichage
// ============================================================

'use strict';

// ========== DEBUT : FONCTIONS D'INTERFACE ==========

/**
 * Affiche un toast de notification
 * @param {string} message - Le message à afficher
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
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
    setTimeout(() => toastEl.remove(), 30000); // 30 secondes
}

/**
 * Affiche ou masque le loader global
 * @param {boolean} show - true pour afficher, false pour masquer
 * @param {string} message - Message optionnel du loader
 */
function setLoader(show, message = 'Chargement...') {
    const loader = document.getElementById('globalLoader');
    const text = document.getElementById('loaderText');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        if (text) text.textContent = message;
    }
}

/**
 * Ouvre une modale par son ID
 * @param {string} modalId - L'ID de la modale à ouvrir
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

/**
 * Ferme une modale par son ID
 * @param {string} modalId - L'ID de la modale à fermer
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} Le texte échappé
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Retourne les initiales d'un nom complet (maximum 2 caractères)
 * @param {string} fullName - Le nom complet
 * @returns {string} Les initiales en majuscules
 */
function getInitials(fullName) {
    if (!fullName) return '?';
    return fullName.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Convertit une date en texte relatif (ex: "il y a 2h", "À l'instant")
 * @param {string|Date} date - La date à formater
 * @returns {string} Le texte relatif
 */
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

/**
 * Déconnecte l'utilisateur et redirige vers l'accueil
 */
async function logout() {
    await sb.auth.signOut();
    window.location.href = '../../index.html';
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
