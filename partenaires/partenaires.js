// ========== PARTENAIRES.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseSpacePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Menu mobile
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  const toggleMenu = (e) => {
    e.preventDefault();
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('open');
  };
  menuToggle.removeEventListener('click', toggleMenu);
  menuToggle.addEventListener('click', toggleMenu);
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#menuToggle') && !e.target.closest('.nav-links')) {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('open');
    }
  });
}

// Charger les partenaires
async function loadPartenaires() {
  const container = document.getElementById('partenairesList');
  container.innerHTML = '<div class="loader">Chargement...</div>';
  const { data, error } = await supabaseSpacePublic
    .from('public_partenaires')
    .select('*')
    .order('ordre', { ascending: true });
  if (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Erreur de chargement.</p>';
    return;
  }
  if (!data || data.length === 0) {
    container.innerHTML = '<p class="no-data">Aucun partenaire pour le moment.</p>';
    return;
  }
  let html = '';
  data.forEach(article => {
    const date = new Date(article.date_publication).toLocaleDateString('fr-FR');
    let mediaHtml = '';
    if (article.media_url) {
      if (article.media_type === 'image') {
        mediaHtml = `<img class="partenaire-media" src="${article.media_url}" alt="${article.nom}">`;
      } else if (article.media_type === 'video') {
        mediaHtml = `<video class="partenaire-media" src="${article.media_url}" controls></video>`;
      } else if (article.media_type === 'audio') {
        mediaHtml = `<audio class="partenaire-media" src="${article.media_url}" controls></audio>`;
      }
    }
    html += `
            <div class="partenaire-card">
                ${article.logo_url ? `<img class="partenaire-logo" src="${article.logo_url}" alt="${article.nom}">` : ''}
                ${mediaHtml}
                <div class="partenaire-content">
                    <h3 class="partenaire-nom">${escapeHtml(article.nom)}</h3>
                    <p class="partenaire-excerpt">${escapeHtml(article.contenu.substring(0, 150))}${article.contenu.length > 150 ? '...' : ''}</p>
                    <div class="partenaire-date">${date}</div>
                    <a href="#" class="read-more" data-id="${article.id}">Lire la suite</a>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
  
  document.querySelectorAll('.read-more').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = link.dataset.id;
      const article = data.find(a => a.id == id);
      if (article) showArticleModal(article);
    });
  });
}

function showArticleModal(article) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  let mediaHtml = '';
  if (article.media_url) {
    if (article.media_type === 'image') {
      mediaHtml = `<img src="${article.media_url}" alt="${article.nom}">`;
    } else if (article.media_type === 'video') {
      mediaHtml = `<video src="${article.media_url}" controls autoplay></video>`;
    } else if (article.media_type === 'audio') {
      mediaHtml = `<audio src="${article.media_url}" controls></audio>`;
    }
  }
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            ${article.logo_url ? `<img src="${article.logo_url}" style="width:100px; display:block; margin:0 auto 15px;">` : ''}
            <h2>${escapeHtml(article.nom)}</h2>
            ${mediaHtml}
            <div class="article-full-content">${escapeHtml(article.contenu)}</div>
            <div class="article-meta">Publié le ${new Date(article.date_publication).toLocaleDateString('fr-FR')}</div>
        </div>
    `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  loadPartenaires();
});