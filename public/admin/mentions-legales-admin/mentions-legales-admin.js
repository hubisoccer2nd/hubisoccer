// ========== MENTIONS-LEGALES-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Charger le contenu actuel
async function loadMentions() {
  const { data, error } = await supabaseAdmin
    .from('public_pages')
    .select('contenu')
    .eq('slug', 'mentions_legales')
    .maybeSingle();
  if (error) {
    console.error(error);
    alert('Erreur de chargement du contenu');
    return;
  }
  if (data) {
    document.getElementById('contenu').value = data.contenu || '';
    document.getElementById('preview').innerHTML = data.contenu || '<p>Aucun contenu.</p>';
  } else {
    document.getElementById('contenu').value = '';
    document.getElementById('preview').innerHTML = '<p>Aucun contenu.</p>';
  }
}

// Sauvegarder le contenu
async function saveMentions(event) {
  event.preventDefault();
  const contenu = document.getElementById('contenu').value;
  const { error } = await supabaseAdmin
    .from('public_pages')
    .upsert({
      slug: 'mentions_legales',
      titre: 'Mentions légales',
      contenu: contenu,
      updated_at: new Date().toISOString()
    }, { onConflict: 'slug' });
  if (error) {
    alert('Erreur lors de l\'enregistrement : ' + error.message);
  } else {
    alert('Contenu enregistré avec succès');
    document.getElementById('preview').innerHTML = contenu;
  }
}

// Mettre à jour l'aperçu en direct
function updatePreview() {
  const contenu = document.getElementById('contenu').value;
  document.getElementById('preview').innerHTML = contenu || '<p>Aucun contenu.</p>';
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadMentions();
  document.getElementById('mentionsForm').addEventListener('submit', saveMentions);
  document.getElementById('contenu').addEventListener('input', updatePreview);
});

// Déconnexion désactivée pour le développement (commentée)
// document.getElementById('logoutBtn')?.addEventListener('click', async () => {
//     await supabaseAdmin.auth.signOut();
//     window.location.href = '../administration.html';
// });