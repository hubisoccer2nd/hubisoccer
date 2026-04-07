// ========== ACTUALITES-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentEditId = null;

async function loadArticles() {
  const { data, error } = await supabaseAdmin.from('public_actualites').select('*').order('date_publication', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  const container = document.getElementById('articlesList');
  if (!data || data.length === 0) {
    container.innerHTML = '<p>Aucun article.</p>';
    return;
  }
  let html = '';
  data.forEach(article => {
    html += `
            <div class="list-item" data-id="${article.id}">
                <div class="info">
                    <strong>${escapeHtml(article.titre)}</strong>
                    <small>Catégorie: ${article.categorie || 'Non définie'}</small>
                    <small>Date: ${new Date(article.date_publication).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    <button class="edit-btn" onclick="editArticle(${article.id})">Modifier</button>
                    <button class="delete-btn" onclick="deleteArticle(${article.id})">Supprimer</button>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
}

async function uploadMedia(file) {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const { error } = await supabaseAdmin.storage.from('actualites_medias').upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabaseAdmin.storage.from('actualites_medias').getPublicUrl(fileName);
  let mediaType = '';
  if (file.type.startsWith('image/')) mediaType = 'image';
  else if (file.type.startsWith('video/')) mediaType = 'video';
  else if (file.type.startsWith('audio/')) mediaType = 'audio';
  return { url: urlData.publicUrl, type: mediaType };
}

async function saveArticle(event) {
  event.preventDefault();
  const id = document.getElementById('articleId').value;
  const titre = document.getElementById('titre').value;
  const categorie = document.getElementById('categorie').value;
  const contenu = document.getElementById('contenu').value;
  const date = document.getElementById('date_publication').value;
  const fileInput = document.getElementById('media');
  let mediaUrl = null;
  let mediaType = null;
  
  if (fileInput.files.length) {
    try {
      const { url, type } = await uploadMedia(fileInput.files[0]);
      mediaUrl = url;
      mediaType = type;
    } catch (err) {
      alert('Erreur upload média : ' + err.message);
      return;
    }
  }
  
  const data = {
    titre,
    categorie,
    contenu,
    date_publication: date ? new Date(date).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (mediaUrl) {
    data.media_url = mediaUrl;
    data.media_type = mediaType;
  }
  
  let error;
  if (id) {
    const { error: updateError } = await supabaseAdmin.from('public_actualites').update(data).eq('id', id);
    error = updateError;
  } else {
    data.created_at = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin.from('public_actualites').insert([data]);
    error = insertError;
  }
  
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    alert(id ? 'Article modifié' : 'Article ajouté');
    resetForm();
    loadArticles();
  }
}

function resetForm() {
  document.getElementById('articleId').value = '';
  document.getElementById('titre').value = '';
  document.getElementById('categorie').value = '';
  document.getElementById('contenu').value = '';
  document.getElementById('date_publication').value = '';
  document.getElementById('media').value = '';
  document.getElementById('formTitle').textContent = 'Ajouter une actualité';
  document.getElementById('cancelBtn').style.display = 'none';
  currentEditId = null;
}

window.editArticle = async (id) => {
  const { data, error } = await supabaseAdmin.from('public_actualites').select('*').eq('id', id).single();
  if (error) {
    alert('Erreur chargement article');
    return;
  }
  currentEditId = id;
  document.getElementById('articleId').value = data.id;
  document.getElementById('titre').value = data.titre;
  document.getElementById('categorie').value = data.categorie || '';
  document.getElementById('contenu').value = data.contenu;
  if (data.date_publication) {
    const d = new Date(data.date_publication);
    document.getElementById('date_publication').value = d.toISOString().slice(0, 16);
  }
  document.getElementById('formTitle').textContent = 'Modifier l\'actualité';
  document.getElementById('cancelBtn').style.display = 'inline-block';
};

window.deleteArticle = async (id) => {
  if (!confirm('Supprimer cet article ?')) return;
  const { error } = await supabaseAdmin.from('public_actualites').delete().eq('id', id);
  if (error) alert('Erreur : ' + error.message);
  else {
    alert('Article supprimé');
    loadArticles();
  }
};

document.getElementById('cancelBtn').addEventListener('click', resetForm);
document.getElementById('articleForm').addEventListener('submit', saveArticle);
document.getElementById('refreshList').addEventListener('click', loadArticles);

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabaseAdmin.auth.signOut();
  window.location.href = '../administration.html';
});

loadArticles();