// ========== CONTACT.JS ==========
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

// Envoi du formulaire de contact
async function sendContactMessage(event) {
  event.preventDefault();
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  const sujet = document.getElementById('sujet').value.trim();
  const message = document.getElementById('message').value.trim();
  const submitBtn = document.querySelector('#contactForm button');
  const messageDiv = document.getElementById('formMessage');
  
  if (!nom || !email || !sujet || !message) {
    messageDiv.innerHTML = 'Veuillez remplir tous les champs.';
    messageDiv.className = 'form-message error';
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Envoi...';
  
  const { error } = await supabaseSpacePublic
    .from('public_contact_messages')
    .insert([{ nom, email, sujet, message, lu: false, created_at: new Date().toISOString() }]);
  
  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Envoyer';
  
  if (error) {
    messageDiv.innerHTML = 'Erreur lors de l\'envoi : ' + error.message;
    messageDiv.className = 'form-message error';
  } else {
    messageDiv.innerHTML = 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.';
    messageDiv.className = 'form-message success';
    document.getElementById('contactForm').reset();
    setTimeout(() => {
      messageDiv.innerHTML = '';
      messageDiv.className = '';
    }, 5000);
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', sendContactMessage);
});