// ============================================================
//  HUBISOCCER — UTILS.JS
//  Fonctions utilitaires partagées (sans état global)
// ============================================================

'use strict';

// Toast (durée 20 secondes)
function toast(msg, type = 'info', dur = 20000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const el = document.createElement('div');
    el.className = `c-toast ${type}`;
    el.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${msg}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => el.remove(), 300);
    }, dur);
}

// Initiales
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

// Temps relatif
function timeSince(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Échappement HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Formatage du texte (mentions, hashtags, liens)
function formatText(text) {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/@(\w+)/g, '<span class="mention" onclick="openUserByHandle(\'$1\')">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag" onclick="searchByHashtag(\'$1\')">#$1</span>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}

// Gestion du loader global
function setLoader(show, text = '', percent = 0) {
    const loader = document.getElementById('globalLoader');
    if (!loader) return;
    loader.style.display = show ? 'flex' : 'none';
    const textEl = document.getElementById('loaderText');
    if (textEl) textEl.textContent = text;
    const barEl = document.getElementById('loaderBar');
    if (barEl) barEl.style.width = percent + '%';
}

// Gestion des modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}