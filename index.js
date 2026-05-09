// ========== DEBUT : index.js ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== CHARGEMENT DES ENGAGEMENTS ==========
async function loadEngagements() {
    const container = document.getElementById('engagementsContainer');
    if (!container) return;
    const { data: engagements, error } = await supabasePublic
        .from('public_engagements')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement engagements:', error);
        container.innerHTML = `<p>${t('error_loading')}</p>`;
        return;
    }
    let html = '';
    if (engagements && engagements.length > 0) {
        engagements.forEach(e => {
            const title = t(e.title) || e.title;
            const description = t(e.description) || e.description;
            html += `
                <div class="card">
                    <i class="fas ${e.icon || 'fa-handshake'}"></i>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(description)}</p>
                </div>
            `;
        });
    } else {
        html = `<p>${t('no_data_engagement')}</p>`;
    }
    container.innerHTML = html;
}

// ========== CHARGEMENT DES RÔLES ==========
async function loadRoles() {
    const container = document.getElementById('rolesContainer');
    if (!container) return;
    const { data: roles, error } = await supabasePublic
        .from('public_roles')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement rôles:', error);
        container.innerHTML = `<p>${t('error_loading')}</p>`;
        return;
    }
    let html = '';
    if (roles && roles.length > 0) {
        roles.forEach(r => {
            const title = t(r.title) || r.title;
            const description = t(r.description) || r.description;
            html += `
                <div class="card">
                    <i class="fas ${r.icon || 'fa-user'}"></i>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(description)}</p>
                </div>
            `;
        });
    } else {
        html = `<p>${t('no_data_role')}</p>`;
    }
    container.innerHTML = html;
}

// ========== CHARGEMENT DES STADES ==========
async function loadStades() {
    const container = document.getElementById('stadesContainer');
    if (!container) return;
    const { data: stades, error } = await supabasePublic
        .from('public_stades')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement stades:', error);
        container.innerHTML = `<p>${t('error_loading')}</p>`;
        return;
    }
    let html = '';
    if (stades && stades.length > 0) {
        stades.forEach(s => {
            const name = t(s.name) || s.name;
            const description = t(s.description) || s.description;
            const hasVideo = s.video_url && s.video_url.trim() !== '';
            const thumbnail = hasVideo
                ? `<div class="video-thumb"><video src="${s.video_url}" muted preload="metadata"></video><span class="play-icon"><i class="fas fa-play-circle"></i></span></div>`
                : `<img class="stade-img" src="${s.image_url}" alt="${escapeHtml(name)}" loading="lazy">`;
            // On stocke l'objet stade complet en data pour la modale
            html += `
                <div class="stade-card" data-item='${JSON.stringify(s).replace(/'/g, "&#39;")}'>
                    ${thumbnail}
                    <div class="content">
                        <h4>${escapeHtml(name)}</h4>
                        <p>${escapeHtml(description)}</p>
                    </div>
                </div>
            `;
        });
    } else {
        html = `<p>${t('no_data_stade')}</p>`;
    }
    container.innerHTML = html;

    // Gestion du clic pour ouvrir la modale
    document.querySelectorAll('.stade-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const item = JSON.parse(this.getAttribute('data-item'));
            openMediaModal(item);
        });
    });
}

// ========== MODALE MÉDIA ==========
function openMediaModal(item) {
    const modal = document.getElementById('mediaModal');
    const mediaDisplay = document.getElementById('mediaDisplay');
    const mediaTitle = document.getElementById('mediaTitle');
    const mediaDescription = document.getElementById('mediaDescription');

    let mediaHtml = '';
    if (item.video_url && item.video_url.trim() !== '') {
        mediaHtml = `<video controls autoplay src="${item.video_url}" style="max-width:100%;max-height:70vh;"></video>`;
    } else if (item.image_url) {
        mediaHtml = `<img src="${item.image_url}" alt="${escapeHtml(item.name)}" style="max-width:100%;max-height:70vh;">`;
    } else {
        mediaHtml = `<p>${t('media_no_media')}</p>`;
    }

    mediaDisplay.innerHTML = mediaHtml;
    mediaTitle.textContent = t(item.name) || item.name;
    mediaDescription.textContent = t(item.description) || item.description;
    modal.classList.add('active');
}

document.getElementById('mediaModal').addEventListener('click', function(e) {
    if (e.target === this || e.target.classList.contains('media-close')) {
        this.classList.remove('active');
        const mediaDisplay = document.getElementById('mediaDisplay');
        mediaDisplay.innerHTML = ''; // stoppe la vidéo
    }
});

// ========== ÉCHAPPEMENT HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== FONCTION DE TRADUCTION (utilise l'objet global) ==========
function t(key) {
    if (!window.translations) return key;
    const lang = window.currentLang || 'fr';
    const trans = window.translations[lang];
    if (trans && trans[key]) return trans[key];
    // Fallback sur le français
    const frTrans = window.translations['fr'];
    if (frTrans && frTrans[key]) return frTrans[key];
    return key;
}

// ========== MENU MOBILE ==========
document.addEventListener('click', function(e) {
    const menuToggle = e.target.closest('#menuToggle');
    if (menuToggle) {
        e.preventDefault();
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        }
        return;
    }
    if (!e.target.closest('.nav-links') && !e.target.closest('#menuToggle')) {
        const navLinks = document.getElementById('navLinks');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            const toggle = document.getElementById('menuToggle');
            if (toggle) toggle.classList.remove('open');
        }
    }
});

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Appliquer les traductions statiques via la fonction globale de index-i18n.js
    if (window.applyTranslations && window.loadLanguage) {
        const savedLang = window.currentLang || localStorage.getItem('hubiLang') || 'fr';
        if (window.loadLanguage) window.loadLanguage(savedLang);
        if (window.applyTranslations) window.applyTranslations(savedLang);
    }

    // Charger les données dynamiques
    loadEngagements();
    loadRoles();
    loadStades();
});
// ========== FIN : index.js ==========
