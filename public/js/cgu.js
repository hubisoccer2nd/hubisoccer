// ========== CGU.JS ==========
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

// Charger le contenu de la page CGU
async function loadCgu() {
  const container = document.getElementById('cguContent');
  container.innerHTML = '<div class="loader">Chargement...</div>';
  const { data, error } = await supabaseSpacePublic
    .from('public_pages')
    .select('contenu')
    .eq('slug', 'cgu')
    .maybeSingle();
  if (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Erreur de chargement.</p>';
    return;
  }
  if (!data) {
    container.innerHTML = '<p class="no-data">Contenu non disponible.</p>';
    return;
  }
  // Afficher le contenu (qui peut être du HTML)
  container.innerHTML = data.contenu || '<p>Aucun contenu pour le moment.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  loadCgu();
});