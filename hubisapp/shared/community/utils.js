// ============================================================
// HUBISOCCER — UTILS.JS
// Fonctions utilitaires globales pour toute la communauté
// ============================================================
'use strict';

// ----------------------------------------------
// TOAST (notifications éphémères)
// ----------------------------------------------
function toast(message, type = 'info', duration = 30000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'c-toast-container';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" aria-label="Fermer">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(el);
    
    setTimeout(() => {
        el.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// ----------------------------------------------
// LOADER GLOBAL
// ----------------------------------------------
function setLoader(show, text = 'Chargement...', percent = 0) {
    const loader = document.getElementById('globalLoader');
    if (!loader) return;
    
    loader.style.display = show ? 'flex' : 'none';
    
    const textEl = document.getElementById('loaderText');
    const barEl = document.getElementById('loaderBar');
    
    if (textEl) textEl.textContent = text;
    if (barEl) barEl.style.width = Math.min(100, Math.max(0, percent)) + '%';
}

// ----------------------------------------------
// GESTION DES MODALES
// ----------------------------------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    // Force le navigateur à prendre en compte le display:flex avant d'ajouter la classe
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
}

// Fermer toutes les modales ouvertes (utile avec Échap)
function closeAllModals() {
    document.querySelectorAll('.c-modal.show').forEach(m => {
        m.classList.remove('show');
        m.style.display = 'none';
    });
}

// ----------------------------------------------
// FORMATAGE DE TEXTE
// ----------------------------------------------
function escapeHtml(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        // '<': '&lt;',
        // '>': '&gt;',
        // '"': '&quot;',
        // "'": '&#39;'
    };
    return String(str).replace(/[&]/g, c => map[c]);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function formatText(content) {
    if (!content) return '';
    return escapeHtml(content)
        .replace(/#(\w+)/g, '<span class="hashtag" style="color:var(--primary);font-weight:700;cursor:pointer" onclick="searchByHashtag(\'$1\')">#$1</span>')
        .replace(/@(\w+)/g, '<span class="mention" style="color:var(--primary-light);font-weight:700;cursor:pointer" onclick="openUserByHandle(\'$1\')">@$1</span>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:underline">$1</a>')
        .replace(/\n/g, '<br>');
}

// ----------------------------------------------
// DATES
// ----------------------------------------------
function timeSince(date) {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' an' + (interval > 1 ? 's' : '');
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' mois';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' j';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' h';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' min';
    
    return 'À l\'instant';
}

function formatDate(dateStr, options = {}) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    });
}

// ----------------------------------------------
// DÉBOUNCE (pour recherche, etc.)
// ----------------------------------------------
function debounce(func, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// ----------------------------------------------
// GESTION DES ERREURS
// ----------------------------------------------
function handleError(error, context = '') {
    console.error(`[HubISoccer Error] ${context}:`, error);
    const message = error?.message || 'Une erreur inattendue est survenue.';
    toast(context ? `${context} : ${message}` : message, 'error');
}

// ----------------------------------------------
// EXPOSITION GLOBALE
// ----------------------------------------------
window.toast = toast;
window.setLoader = setLoader;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.escapeHtml = escapeHtml;
window.getInitials = getInitials;
window.formatText = formatText;
window.timeSince = timeSince;
window.formatDate = formatDate;
window.debounce = debounce;
window.handleError = handleError;

// Raccourci pour fermer les modales avec Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});
