// ========== FAQ.JS ==========
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

// Charger les questions/réponses
async function loadFaq() {
  const container = document.getElementById('faqList');
  container.innerHTML = '<div class="loader">Chargement...</div>';
  const { data, error } = await supabaseSpacePublic
    .from('public_pages')
    .select('*')
    .eq('slug', 'faq')
    .order('ordre', { ascending: true });
  if (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Erreur de chargement.</p>';
    return;
  }
  if (!data || data.length === 0) {
    container.innerHTML = '<p class="no-data">Aucune question pour le moment.</p>';
    return;
  }
  let html = '';
  data.forEach(item => {
    html += `
            <div class="faq-item">
                <div class="faq-question">
                    <span>${escapeHtml(item.titre)}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    ${escapeHtml(item.contenu).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
  
  // Initialiser l'accordéon
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector('i');
      question.classList.toggle('active');
      answer.classList.toggle('show');
      if (answer.classList.contains('show')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
  });
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
  loadFaq();
});