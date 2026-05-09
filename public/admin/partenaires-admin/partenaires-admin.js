// ========== PARTENAIRES-ADMIN.JS ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentEditId = null;

async function loadPartenaires() {
  const { data, error } = await supabaseAdmin.from('public_partenaires').select('*').order('ordre', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  const container = document.getElementById('partenairesList');
  if (!data || data.length === 0) {
    container.innerHTML = '<p>Aucun article partenaire.</p>';
    return;
  }
  let html = '';
  data.forEach(p => {
    html += `
            <div class="list-item" data-id="${p.id}">
                <div class="info">
                    <strong>${escapeHtml(p.nom)}</strong>
                    <small>Ordre: ${p.ordre}</small>
                    <small>Date: ${new Date(p.date_publication).toLocaleDateString()}</small>
                </div>
                <div class="actions">
                    <button class="edit-btn" onclick="editPartenaire(${p.id})">Modifier</button>
                    <button class="delete-btn" onclick="deletePartenaire(${p.id})">Supprimer</button>
                </div>
            </div>
        `;
  });
  container.innerHTML = html;
}

async function uploadFile(file, bucket) {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function savePartenaire(event) {
  event.preventDefault();
  const id = document.getElementById('partenaireId').value;
  const nom = document.getElementById('nom').value;
  const contenu = document.getElementById('contenu').value;
  const ordre = parseInt(document.getElementById('ordre').value) || 0;
  const date = document.getElementById('date_publication').value;
  const logoFile = document.getElementById('logo').files[0];
  const mediaFile = document.getElementById('media').files[0];
  let logoUrl = null;
  let mediaUrl = null;
  let mediaType = null;
  
  if (logoFile) {
    try {
      logoUrl = await uploadFile(logoFile, 'partenaires_logos');
    } catch (err) {
      alert('Erreur upload logo : ' + err.message);
      return;
    }
  }
  if (mediaFile) {
    try {
      mediaUrl = await uploadFile(mediaFile, 'partenaires_medias');
      if (mediaFile.type.startsWith('image/')) mediaType = 'image';
      else if (mediaFile.type.startsWith('video/')) mediaType = 'video';
      else if (mediaFile.type.startsWith('audio/')) mediaType = 'audio';
    } catch (err) {
      alert('Erreur upload média : ' + err.message);
      return;
    }
  }
  
  const data = {
    nom,
    contenu,
    ordre,
    date_publication: date ? new Date(date).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (logoUrl) data.logo_url = logoUrl;
  if (mediaUrl) {
    data.media_url = mediaUrl;
    data.media_type = mediaType;
  }
  
  let error;
  if (id) {
    const { error: updateError } = await supabaseAdmin.from('public_partenaires').update(data).eq('id', id);
    error = updateError;
  } else {
    data.created_at = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin.from('public_partenaires').insert([data]);
    error = insertError;
  }
  
  if (error) {
    alert('Erreur : ' + error.message);
  } else {
    alert(id ? 'Article modifié' : 'Article ajouté');
    resetForm();
    loadPartenaires();
  }
}

function resetForm() {
  document.getElementById('partenaireId').value = '';
  document.getElementById('nom').value = '';
  document.getElementById('contenu').value = '';
  document.getElementById('ordre').value = '0';
  document.getElementById('date_publication').value = '';
  document.getElementById('logo').value = '';
  document.getElementById('media').value = '';
  document.getElementById('formTitle').textContent = 'Ajouter un partenaire';
  document.getElementById('cancelBtn').style.display = 'none';
  currentEditId = null;
}

window.editPartenaire = async (id) => {
  const { data, error } = await supabaseAdmin.from('public_partenaires').select('*').eq('id', id).single();
  if (error) {
    alert('Erreur chargement article');
    return;
  }
  currentEditId = id;
  document.getElementById('partenaireId').value = data.id;
  document.getElementById('nom').value = data.nom;
  document.getElementById('contenu').value = data.contenu;
  document.getElementById('ordre').value = data.ordre;
  if (data.date_publication) {
    const d = new Date(data.date_publication);
    document.getElementById('date_publication').value = d.toISOString().slice(0, 16);
  }
  document.getElementById('formTitle').textContent = 'Modifier le partenaire';
  document.getElementById('cancelBtn').style.display = 'inline-block';
};

window.deletePartenaire = async (id) => {
  if (!confirm('Supprimer cet article ?')) return;
  const { error } = await supabaseAdmin.from('public_partenaires').delete().eq('id', id);
  if (error) alert('Erreur : ' + error.message);
  else {
    alert('Article supprimé');
    loadPartenaires();
  }
};

document.getElementById('cancelBtn').addEventListener('click', resetForm);
document.getElementById('partenaireForm').addEventListener('submit', savePartenaire);
document.getElementById('refreshList').addEventListener('click', loadPartenaires);

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

loadPartenaires();