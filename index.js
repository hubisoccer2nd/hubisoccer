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
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }
    let html = '';
    engagements.forEach(e => {
        html += `
            <div class="card">
                <i class="fas ${e.icon || 'fa-handshake'}"></i>
                <h3>${escapeHtml(e.title)}</h3>
                <p>${escapeHtml(e.description)}</p>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun engagement.</p>';
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
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }
    let html = '';
    roles.forEach(r => {
        html += `
            <div class="card">
                <i class="fas ${r.icon || 'fa-user'}"></i>
                <h3>${escapeHtml(r.title)}</h3>
                <p>${escapeHtml(r.description)}</p>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun rôle.</p>';
}

// ========== CHARGEMENT DES STADES avec modale ==========
async function loadStades() {
    const container = document.getElementById('stadesContainer');
    if (!container) return;
    const { data: stades, error } = await supabasePublic
        .from('public_stades')
        .select('*')
        .order('order', { ascending: true });
    if (error) {
        console.error('Erreur chargement stades:', error);
        container.innerHTML = '<p>Erreur de chargement.</p>';
        return;
    }
    let html = '';
    stades.forEach(s => {
        const hasVideo = s.video_url && s.video_url.trim() !== '';
        const thumbnail = hasVideo ?
            `<div class="video-thumb"><video src="${s.video_url}" muted preload="metadata"></video><span class="play-icon"><i class="fas fa-play-circle"></i></span></div>` :
            `<img class="stade-img" src="${s.image_url}" alt="${escapeHtml(s.name)}" loading="lazy">`;
        html += `
            <div class="stade-card" data-item='${JSON.stringify(s).replace(/'/g, "&#39;")}'>
                ${thumbnail}
                <div class="content">
                    <h4>${escapeHtml(s.name)}</h4>
                    <p>${escapeHtml(s.description)}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html || '<p>Aucun stade.</p>';
    
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
        mediaHtml = '<p>Aucun média disponible.</p>';
    }
    
    mediaDisplay.innerHTML = mediaHtml;
    mediaTitle.textContent = item.name || '';
    mediaDescription.textContent = item.description || '';
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
    loadEngagements();
    loadRoles();
    loadStades();
});
// ========== FIN : index.js ==========