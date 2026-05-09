// ========== FAQ-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentEditId = null;

async function loadFaq() {
  const { data, error } = await supabaseAdmin
    .from('public_pages')
    .select('*')
    .eq('slug', 'faq')
    .order('ordre', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  const container = document.getElementById('faqList');
  if (!data || data.length === 0) {
    container.innerHTML = '<p>Aucune question.</p>';
    return;
  }
  let html = '';
  data.forEach(item => {
    html += `
            <div class="list-item" data-id="${item.id}">
                <div class="info">
                    <strong>${escapeHtml(item.titre)}</strong>
                    <small>Ordre: ${item.ordre}</small>
                </div>
                <div class="actions">
                    <button class="edit-btn" onclick="editFaq(${item.id})">Modifier</button>
                    <button class="delete-btn" onclick="deleteFaq(${item.id})">Supprimer</button>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
}

async function saveFaq(event) {
  event.preventDefault();
  const id = document.getElementById('faqId').value;
  const titre = document.getElementById('titre').value;
  const contenu = document.getElementById('contenu').value;
  const ordre = parseInt(document.getElementById('ordre').value) || 0;
  
  const data = {
    slug: 'faq',
    titre: titre,
    contenu: contenu,
    ordre: ordre,
    updated_at: new Date().toISOString()
  };
  
  let error;
  if (id) {
    const { error: updateError } = await supabaseAdmin
      .from('public_pages')
      .update(data)
      .eq('id', id);
    error = updateError;
  } else {
    data.created_at = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('public_pages')
      .insert([data]);
    error = insertError;
  }
  
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    alert(id ? 'Question modifiée' : 'Question ajoutée');
    resetForm();
    loadFaq();
  }
}

function resetForm() {
  document.getElementById('faqId').value = '';
  document.getElementById('titre').value = '';
  document.getElementById('contenu').value = '';
  document.getElementById('ordre').value = '0';
  document.getElementById('formTitle').textContent = 'Ajouter une question';
  document.getElementById('cancelBtn').style.display = 'none';
  currentEditId = null;
}

window.editFaq = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('public_pages')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    alert('Erreur chargement question');
    return;
  }
  currentEditId = id;
  document.getElementById('faqId').value = data.id;
  document.getElementById('titre').value = data.titre;
  document.getElementById('contenu').value = data.contenu;
  document.getElementById('ordre').value = data.ordre;
  document.getElementById('formTitle').textContent = 'Modifier la question';
  document.getElementById('cancelBtn').style.display = 'inline-block';
};

window.deleteFaq = async (id) => {
  if (!confirm('Supprimer cette question ?')) return;
  const { error } = await supabaseAdmin
    .from('public_pages')
    .delete()
    .eq('id', id);
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    alert('Question supprimée');
    loadFaq();
  }
};

document.getElementById('cancelBtn').addEventListener('click', resetForm);
document.getElementById('faqForm').addEventListener('submit', saveFaq);
document.getElementById('refreshList').addEventListener('click', loadFaq);

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Déconnexion désactivée pour le développement (commentée)
// document.getElementById('logoutBtn')?.addEventListener('click', async () => {
//     await supabaseAdmin.auth.signOut();
//     window.location.href = '../administration.html';
// });

loadFaq();