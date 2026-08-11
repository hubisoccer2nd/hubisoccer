/* ============================================================
   HubISoccer — gt-cv.js
   CV Professionnel · Gestionnaire de Tournoi
   Corps · Âme · Esprit
   ------------------------------------------------------------
   Corrections par rapport au fichier source (corps_arbitral,
   lui-meme issu d'un template plus ancien) :
   - Verrou de role ajoute (aucune verification role_code
     n'existait, n'importe quel utilisateur connecte pouvait
     charger cette page).
   - Bug corrige : les onglets 2 a 5 (Diplomes, Tournois
     Organises, Competences, Distinctions) partageaient tous le
     type 'generic', jamais gere dans getArrayByType() -- toute
     saisie y etait silencieusement perdue, jamais sauvegardee ni
     reaffichee. Chaque onglet a maintenant son propre type et
     son propre tableau persistant.
   - id du bouton de fermeture sidebar corrige (le fichier source
     cherchait 'closeSidebar', le HTML utilise 'closeLeftSidebar'
     partout sur cette plateforme).
   - Table supabaseAuthPrive_cv_profiles CONSERVEE telle quelle :
     c'est une architecture partagee entre tous les roles
     (filtree par role_code), pas un bug -- contrairement a la
     table certifications, celle-ci fonctionne correctement.
   ============================================================ */
'use strict';

/* ---------- 1. CONFIGURATION SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. ETAT GLOBAL ---------- */
let currentUser  = null;
let userProfile  = null;
let cvData       = null;   // table partagee supabaseAuthPrive_cv_profiles
let scoutingData = null;   // table supabaseAuthPrive_gt_perso_scouting
const ROLE_CODE  = 'TOURN';
const ROLE_LABEL = 'Gestionnaire';
const GESTIONNAIRE_ROLE_CODES = ['TOURN'];
const SCOUTING_TABLE = 'supabaseAuthPrive_gt_perso_scouting';
const SCOUTING_FK    = 'gestionnaire_id';
const AVATAR_BUCKET  = 'avatars-gestionnaire-tournoi';

/* ---------- 3. LOADER & TOAST ---------- */
function showLoader(){ var l=document.getElementById('globalLoader'); if(l) l.style.display='flex'; }
function hideLoader(){ var l=document.getElementById('globalLoader'); if(l) l.style.display='none'; }

function showToast(msg, type, dur){
    type=type||'info'; dur=dur||30000;
    var c=document.getElementById('toastContainer');
    if(!c){ c=document.createElement('div'); c.id='toastContainer'; c.className='toast-container'; document.body.appendChild(c); }
    var ic={success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    var t=document.createElement('div'); t.className='toast '+type;
    t.innerHTML='<div class="toast-icon"><i class="fas '+(ic[type]||ic.info)+'"></i></div><div class="toast-content">'+msg+'</div><button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function(){ t.style.animation='fadeOut .3s forwards'; setTimeout(function(){t.remove();},300); });
    setTimeout(function(){ if(t.parentNode){ t.style.animation='fadeOut .3s forwards'; setTimeout(function(){t.remove();},300); } }, dur);
}

function getInitials(n){ if(!n) return '?'; var p=n.trim().split(/\s+/); return(p.length>=2?p[0][0]+p[p.length-1][0]:n[0]).toUpperCase(); }
function calculateAge(d){ if(!d) return '—'; var t=new Date(),b=new Date(d); var a=t.getFullYear()-b.getFullYear(); var m=t.getMonth()-b.getMonth(); if(m<0||(m===0&&t.getDate()<b.getDate())) a--; return a; }

/* ---------- 4. SESSION ---------- */
async function checkSession(){
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if(error || !user){
        window.location.href='../../authprive/users/login.html?role=TOURN';
        hideLoader(); return null;
    }
    currentUser = user;
    return currentUser;
}

/* ---------- 5. PROFIL + VERROU DE ROLE ---------- */
async function loadProfile(){
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if(error){ showToast('Erreur chargement profil','error'); hideLoader(); return; }
    userProfile = data;

    if (GESTIONNAIRE_ROLE_CODES.indexOf(userProfile.role_code) === -1) {
        hideLoader();
        showToast('Cette page est réservée au Gestionnaire de Tournoi.', 'warning');
        window.location.href = '../../shared/gestion-tournoi/acceuil.html';
        return;
    }

    document.getElementById('userName').textContent = userProfile.full_name||ROLE_LABEL;
    updateAvatarNav();
    populateHeader();
}

function updateAvatarNav(){
    var ni=document.getElementById('userAvatar'), nn=document.getElementById('userAvatarInitials');
    var url=userProfile&&userProfile.avatar_url;
    if(url&&url!==''){ if(ni){ni.src=url;ni.style.display='block';} if(nn)nn.style.display='none'; }
    else{ var init=getInitials((userProfile&&userProfile.full_name)||'G'); if(nn){nn.textContent=init;nn.style.display='flex';} if(ni)ni.style.display='none'; }
}

function populateHeader(){
    if(!userProfile) return;
    var p=userProfile;
    var el=document.getElementById('cvHeaderName'); if(el) el.textContent=p.full_name||'—';
    var em=document.getElementById('cvEmail'); if(em) em.textContent=p.email||'—';
    var ph=document.getElementById('cvPhone'); if(ph) ph.textContent=p.phone||'—';
    var co=document.getElementById('cvCountry'); if(co) co.textContent=p.country_code||'—';
    var ag=document.getElementById('cvAge'); if(ag) ag.textContent=calculateAge(p.birth_date);
    var hi=document.getElementById('cvHubIdVal'); if(hi) hi.textContent=p.hubisoccer_id||'—';
    var img=document.getElementById('cvAvatarImg'), init=document.getElementById('cvAvatarInit');
    if(p.avatar_url&&p.avatar_url!==''){ if(img){img.src=p.avatar_url;img.style.display='block';} if(init)init.style.display='none'; }
    else{ if(init){ init.textContent=getInitials(p.full_name||'G'); } if(img) img.style.display='none'; }
}

/* ---------- 6. CV DATA ---------- */
async function loadCVData(){
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_cv_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('role_code', ROLE_CODE)
        .maybeSingle();
    if(error){ console.warn('CV load:', error.message); }
    if(data){
        cvData = data;
        restoreFormData();
        renderEntries();
    }
    loadScoutingData();
    computeCompletion();
    hideLoader();
}

async function loadScoutingData(){
    if(!userProfile) return;
    const { data, error } = await supabaseClient
        .from(SCOUTING_TABLE)
        .select('*')
        .eq(SCOUTING_FK, userProfile.hubisoccer_id)
        .maybeSingle();
    if(!error && data) scoutingData = data;
}

/* ---------- 7. SAVE DRAFT ---------- */
async function saveDraft(){
    if(!userProfile) return;
    showLoader();
    var formValues = collectFormValues();
    var payload = {
        user_id:    currentUser.id,
        role_code:  ROLE_CODE,
        role_label: ROLE_LABEL,
        status:     'draft',
        cv_json:    JSON.stringify(formValues),
        updated_at: new Date().toISOString()
    };
    var r;
    if(cvData && cvData.id){
        r = await supabaseClient.from('supabaseAuthPrive_cv_profiles').update(payload).eq('id', cvData.id);
    } else {
        payload.created_at = new Date().toISOString();
        r = await supabaseClient.from('supabaseAuthPrive_cv_profiles').insert([payload]).select().single();
        if(!r.error) cvData = r.data;
    }
    hideLoader();
    if(r.error){ showToast('Erreur sauvegarde : '+r.error.message,'error'); return; }
    showToast('Brouillon enregistré avec succès','success');
    document.getElementById('lastSaved').textContent = 'Sauvegarde : '+new Date().toLocaleTimeString('fr-FR');
    updateStatusBadge('draft');
    computeCompletion();
}

/* ---------- 8. SUBMIT CV ---------- */
async function submitCV(){
    if(!userProfile) return;
    if(!confirm('Confirmer la soumission de votre CV pour validation par HubISoccer ?')) return;
    showLoader();
    await saveDraft();
    var r;
    if(cvData && cvData.id){
        r = await supabaseClient.from('supabaseAuthPrive_cv_profiles').update({status:'submitted', submitted_at:new Date().toISOString()}).eq('id', cvData.id);
    }
    hideLoader();
    if(r && !r.error){
        showToast('CV soumis avec succès ! En attente de validation.','success',6000);
        updateStatusBadge('submitted');
    } else {
        showToast('Erreur soumission','error');
    }
}

function updateStatusBadge(status){
    var b=document.getElementById('cvStatusBadge');
    if(!b) return;
    var labels={draft:'Brouillon',submitted:'Soumis — En attente',approved:'Validé par HubISoccer',rejected:'Rejeté'};
    var icons={draft:'fa-circle',submitted:'fa-clock',approved:'fa-check-circle',rejected:'fa-times-circle'};
    b.className='cv-status '+status;
    b.innerHTML='<i class="fas '+icons[status]+'"></i> '+labels[status];
}

/* ---------- 9. COLLECT / RESTORE FORM VALUES ---------- */
function collectFormValues(){
    var d={};
    document.querySelectorAll('[id^="cv_"], [id^="rec_"]').forEach(function(el){
        d[el.id] = el.value;
    });
    d._languages       = window.__cvLanguages       || [];
    d._education       = window.__cvEducation       || [];
    d._diplomeCv       = window.__cvDiplomeCv        || [];
    d._tournoiOrganise = window.__cvTournoiOrganise  || [];
    d._competenceOrga  = window.__cvCompetenceOrga   || [];
    d._distinction     = window.__cvDistinction      || [];
    d._references       = window.__cvReferences      || [];
    return d;
}

function restoreFormData(){
    if(!cvData || !cvData.cv_json) return;
    try{
        var d = JSON.parse(cvData.cv_json);
        for(var k in d){
            if(k.startsWith('_')) continue;
            var el=document.getElementById(k);
            if(el) el.value=d[k]||'';
        }
        window.__cvLanguages       = d._languages       || [];
        window.__cvEducation       = d._education       || [];
        window.__cvDiplomeCv       = d._diplomeCv        || [];
        window.__cvTournoiOrganise = d._tournoiOrganise  || [];
        window.__cvCompetenceOrga  = d._competenceOrga   || [];
        window.__cvDistinction     = d._distinction      || [];
        window.__cvReferences      = d._references       || [];
        if(cvData.status) updateStatusBadge(cvData.status);
    } catch(e){ console.warn('Restore form error:',e); }
}

/* ---------- 10. RENDER ENTRIES ---------- */
function renderEntries(){
    renderList('educationList',        window.__cvEducation       ||[], 'education');
    renderList('diplomeCvList',        window.__cvDiplomeCv        ||[], 'diplome_cv');
    renderList('tournoiOrganiseList',  window.__cvTournoiOrganise  ||[], 'tournoi_organise');
    renderList('competenceOrgaList',   window.__cvCompetenceOrga   ||[], 'competence_orga');
    renderList('distinctionList',      window.__cvDistinction      ||[], 'distinction');
    renderList('referencesList',       window.__cvReferences       ||[], 'reference');
    renderLanguages();
}

function renderList(containerId, arr, type){
    var c=document.getElementById(containerId); if(!c) return;
    c.innerHTML='';
    if(!arr.length){ c.innerHTML='<p class="entry-empty">Aucune entrée pour le moment.</p>'; return; }
    arr.forEach(function(item, idx){
        var card=document.createElement('div'); card.className='entry-card';
        card.innerHTML='<div class="entry-card-header"><span class="entry-title">'+(item.title||'—')+'</span>'+(item.period?'<span class="entry-period">'+item.period+'</span>':'')+'</div>'+(item.sub?'<div class="entry-sub">'+item.sub+'</div>':'')+(item.desc?'<div class="entry-desc">'+item.desc+'</div>':'')+'<div class="entry-actions"><button class="btn-entry-edit" onclick="editEntry(\''+type+'\','+idx+')"><i class="fas fa-edit"></i> Modifier</button><button class="btn-entry-del" onclick="deleteEntry(\''+type+'\','+idx+')"><i class="fas fa-trash"></i> Supprimer</button></div>';
        c.appendChild(card);
    });
}

function renderLanguages(){
    var c=document.getElementById('langChips'); if(!c) return;
    c.innerHTML='';
    (window.__cvLanguages||[]).forEach(function(lang, idx){
        var chip=document.createElement('div'); chip.className='lang-chip';
        chip.innerHTML='<i class="fas fa-globe"></i> '+lang.name+' <span class="lang-level">'+lang.level+'</span><span class="del-lang" onclick="deleteLang('+idx+')" title="Supprimer"><i class="fas fa-times"></i></span>';
        c.appendChild(chip);
    });
}

/* ---------- 11. ENTRY MODAL ---------- */
var _currentEntryType = '';
var _currentEntryIdx  = -1;

function openEntryModal(type){
    _currentEntryType = type;
    _currentEntryIdx  = -1;
    var modal = document.getElementById('entryModal');
    var title = document.getElementById('entryModalTitle');
    var body  = document.getElementById('entryModalBody');
    var tLabels = {
        education:'Formation / Diplôme', diplome_cv:'Diplôme / Certification',
        tournoi_organise:'Tournoi organisé', competence_orga:'Compétence d\'organisation',
        distinction:'Distinction / Reconnaissance', reference:'Référence'
    };
    title.innerHTML='<i class="fas fa-plus"></i> Ajouter — '+(tLabels[type]||type);
    body.innerHTML = buildEntryForm(type);
    modal.classList.add('show');
}

function editEntry(type, idx){
    _currentEntryType = type;
    _currentEntryIdx  = idx;
    var arr = getArrayByType(type);
    var item = arr[idx] || {};
    var modal = document.getElementById('entryModal');
    var title = document.getElementById('entryModalTitle');
    var body  = document.getElementById('entryModalBody');
    title.innerHTML='<i class="fas fa-edit"></i> Modifier';
    body.innerHTML = buildEntryForm(type, item);
    modal.classList.add('show');
}

function buildEntryForm(type, item){
    item = item || {};
    if(type==='education') return '<div class="form-grid"><div class="form-group"><label>Diplôme / Formation</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex : Master Gestion d\'Événements"></div><div class="form-group"><label>Établissement</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Nom de l\'établissement"></div><div class="form-group"><label>Année obtention</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex : 2021 — 2024"></div><div class="form-group"><label>Mention / Résultat</label><input type="text" id="em_desc" value="'+(item.desc||'')+'" placeholder="Ex : Mention Bien"></div></div>';
    if(type==='diplome_cv') return '<div class="form-grid"><div class="form-group"><label>Intitulé</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex : Certification en logistique événementielle"></div><div class="form-group"><label>Organisme</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex : Croix-Rouge Bénin"></div><div class="form-group"><label>Année</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex : 2025"></div><div class="form-group full"><label>Détails</label><textarea id="em_desc" placeholder="Précisions…">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='tournoi_organise') return '<div class="form-grid"><div class="form-group"><label>Nom du tournoi</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex : HubISoccer Talent Showcase"></div><div class="form-group"><label>Rôle / Envergure</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex : Organisateur principal, national"></div><div class="form-group"><label>Période</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex : 2025"></div><div class="form-group full"><label>Description / Chiffres clés</label><textarea id="em_desc" placeholder="Participants, cagnotte, retombées…">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='competence_orga') return '<div class="form-grid"><div class="form-group full"><label>Compétence</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex : Gestion de crise en événement sportif"></div><div class="form-group full"><label>Détails</label><textarea id="em_desc" placeholder="Contexte d\'application…">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='distinction') return '<div class="form-grid"><div class="form-group"><label>Titre / Récompense</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex : Organisateur de l\'année"></div><div class="form-group"><label>Organisme</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex : Fédération Béninoise de Football"></div><div class="form-group"><label>Année</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex : 2025"></div><div class="form-group full"><label>Détails</label><textarea id="em_desc" placeholder="Contexte…">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='reference') return '<div class="form-grid"><div class="form-group"><label>Nom complet</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Nom Prénom"></div><div class="form-group"><label>Fonction / Organisation</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex : Directeur Technique FBF"></div><div class="form-group"><label>Email</label><input type="email" id="em_period" value="'+(item.period||'')+'" placeholder="email@exemple.com"></div><div class="form-group"><label>Téléphone</label><input type="text" id="em_desc" value="'+(item.desc||'')+'" placeholder="+229 XX XX XX"></div></div>';
    return '<div class="form-group full"><label>Titre</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Titre…"></div><div class="form-group full" style="margin-top:12px;"><label>Description</label><textarea id="em_desc" placeholder="Description…">'+(item.desc||'')+'</textarea></div>';
}

function closeEntryModal(){ document.getElementById('entryModal').classList.remove('show'); }

function getArrayByType(type){
    if(type==='education')         return window.__cvEducation       = window.__cvEducation       ||[];
    if(type==='diplome_cv')        return window.__cvDiplomeCv       = window.__cvDiplomeCv        ||[];
    if(type==='tournoi_organise')  return window.__cvTournoiOrganise = window.__cvTournoiOrganise  ||[];
    if(type==='competence_orga')   return window.__cvCompetenceOrga  = window.__cvCompetenceOrga   ||[];
    if(type==='distinction')       return window.__cvDistinction     = window.__cvDistinction      ||[];
    if(type==='reference')         return window.__cvReferences      = window.__cvReferences       ||[];
    return [];
}

function saveEntry(){
    var type = _currentEntryType;
    var arr  = getArrayByType(type);
    var item = {};
    var fields=['title','sub','period','desc'];
    fields.forEach(function(f){ var el=document.getElementById('em_'+f); if(el) item[f]=el.value; });
    if(_currentEntryIdx>=0){ arr[_currentEntryIdx]=item; } else { arr.push(item); }
    closeEntryModal();
    renderEntries();
    showToast('Entrée enregistrée','success');
}

function deleteEntry(type, idx){
    if(!confirm('Supprimer cette entrée ?')) return;
    var arr=getArrayByType(type);
    arr.splice(idx,1);
    renderEntries();
    showToast('Entrée supprimée','info');
}

/* ---------- 12. LANGUAGES ---------- */
function addLanguage(){
    var name=document.getElementById('newLangInput').value.trim();
    var level=document.getElementById('newLangLevel').value;
    if(!name){ showToast('Entrez le nom de la langue','warning'); return; }
    window.__cvLanguages = window.__cvLanguages||[];
    window.__cvLanguages.push({name:name,level:level});
    document.getElementById('newLangInput').value='';
    renderLanguages();
    showToast('Langue ajoutée','success');
}
function deleteLang(idx){
    window.__cvLanguages.splice(idx,1);
    renderLanguages();
}
window.addLanguage=addLanguage;
window.deleteLang=deleteLang;

/* ---------- 13. AVATAR UPLOAD ---------- */
async function uploadAvatar(file){
    if(!userProfile) return;
    if(file.size>3*1024*1024){ showToast('Max 3 Mo','warning'); return; }
    showLoader();
    var ext=file.name.split('.').pop().toLowerCase();
    var fn='cv_avatar_'+currentUser.id+'_'+Date.now()+'.'+ext;
    var up=await supabaseClient.storage.from(AVATAR_BUCKET).upload(fn,file,{upsert:true});
    if(up.error){ hideLoader(); showToast('Erreur upload : '+up.error.message,'error'); return; }
    var ud=supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(fn);
    var url=ud.data.publicUrl;
    await supabaseClient.from('supabaseAuthPrive_profiles').update({avatar_url:url}).eq('auth_uuid',currentUser.id);
    userProfile.avatar_url=url;
    hideLoader();
    var img=document.getElementById('cvAvatarImg'), init=document.getElementById('cvAvatarInit');
    if(img){img.src=url;img.style.display='block';} if(init)init.style.display='none';
    showToast('Photo mise à jour','success');
}

/* ---------- 14. COMPLETION ---------- */
function computeCompletion(){
    var checks=[
        !!document.getElementById('cv_nom')?.value,
        !!document.getElementById('cv_prenom')?.value,
        !!document.getElementById('cv_email')?.value,
        !!document.getElementById('cv_telephone')?.value,
        !!document.getElementById('cv_nationalite')?.value,
        !!document.getElementById('cv_bio')?.value,
        (window.__cvEducation||[]).length>0,
        (window.__cvTournoiOrganise||[]).length>0,
        (window.__cvLanguages||[]).length>0,
        (window.__cvDistinction||[]).length>0
    ];
    var filled=checks.filter(Boolean).length;
    var pct=Math.round(filled/checks.length*100);
    var fill=document.getElementById('completionFill'), pctEl=document.getElementById('completionPct');
    if(fill) fill.style.width=pct+'%';
    if(pctEl) pctEl.textContent=pct+'%';
}

/* ---------- 15. COPIER HUB ID ---------- */
async function copyHubId(){
    var val=document.getElementById('cvHubIdVal')?.textContent;
    if(!val||val==='—') return;
    try{ await navigator.clipboard.writeText(val); showToast('ID copié !','success',2000); }
    catch(e){ showToast('Erreur copie','error'); }
}
window.copyHubId=copyHubId;

/* ---------- 16. APERÇU & PDF ---------- */
function buildPreviewHTML(){
    var p=userProfile||{};
    var form=collectFormValues();
    var edu=(window.__cvEducation||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">'+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.sub||'')+'</div><div class="cv-item-date">'+(e.period||'')+'</div></div>'; }).join('');
    var tournois=(window.__cvTournoiOrganise||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">'+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.sub||'')+'</div><div class="cv-item-date">'+(e.period||'')+'</div><div class="cv-item-desc">'+(e.desc||'')+'</div></div>'; }).join('');
    var dist=(window.__cvDistinction||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">🏆 '+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.sub||'')+'</div><div class="cv-item-date">'+(e.period||'')+'</div></div>'; }).join('');
    var langs=(window.__cvLanguages||[]).map(function(l){ return '<span class="cv-preview-lang-chip">'+(l.name||'')+(l.level?' ('+l.level+')':'')+'</span>'; }).join('');
    var avatarHtml = (p.avatar_url&&p.avatar_url!=='')?'<img src="'+p.avatar_url+'" class="cv-preview-avatar" style="width:90px;height:90px;border-radius:50%;border:3px solid rgba(255,255,255,.4);object-fit:cover;">':'<div class="cv-preview-avatar-init">'+getInitials(p.full_name||'G')+'</div>';

    return `
    <div class="cv-preview-wrap" id="cvPreviewContent">
        <div class="cv-preview-header" style="background:#551B8C;">
            ${avatarHtml}
            <div>
                <div class="cv-preview-name">${p.full_name||'—'}</div>
                <div class="cv-preview-role">Gestionnaire de Tournoi — HubISoccer</div>
                <div class="cv-preview-contacts">
                    <span>✉ ${p.email||'—'}</span>
                    <span>☎ ${p.phone||'—'}</span>
                    <span>🌍 ${form.cv_pays||p.country_code||'—'}</span>
                </div>
            </div>
        </div>
        <div class="cv-preview-body">
            <div class="cv-col-left">
                <div class="cv-section-head">Langues</div>
                <div>${langs||'<p class="cv-preview-empty">Non renseignées</p>'}</div>
            </div>
            <div class="cv-col-right">
                <div class="cv-section-head">Profil & Bio</div>
                <p class="cv-preview-bio">${form.cv_bio||'—'}</p>
                <div class="cv-section-head">Formation</div>
                ${edu||'<p class="cv-preview-empty">Non renseignée</p>'}
                <div class="cv-section-head" style="margin-top:16px;">Tournois organisés</div>
                ${tournois||'<p class="cv-preview-empty">Non renseignés</p>'}
                <div class="cv-section-head" style="margin-top:16px;">Distinctions</div>
                ${dist||'<p class="cv-preview-empty">Non renseignées</p>'}
            </div>
        </div>
        <div class="cv-preview-footer">
            <span class="cv-footer-logo">HubISoccer — Gestionnaire de Tournoi</span>
            <span class="cv-footer-id">HID : ${p.hubisoccer_id||'—'} | Corps · Âme · Esprit</span>
        </div>
    </div>`;
}

function previewCV(){
    var modal=document.getElementById('cvPreviewModal');
    var body=document.getElementById('cvPreviewBody');
    body.innerHTML=buildPreviewHTML();
    modal.classList.add('show');
}
function closePreview(){ document.getElementById('cvPreviewModal').classList.remove('show'); }
window.closePreview=closePreview;
window.previewCV=previewCV;

async function downloadPDF(){
    var el=document.getElementById('cvPreviewContent');
    if(!el){ previewCV(); setTimeout(downloadPDF,600); return; }
    showLoader();
    try{
        var opt={margin:.5,filename:'CV_gestionnaire_tournoi_HubISoccer.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2},jsPDF:{unit:'in',format:'a4',orientation:'portrait'}};
        await html2pdf().set(opt).from(el).save();
        showToast('PDF téléchargé !','success');
    } catch(e){ showToast('Erreur PDF : '+e.message,'error'); }
    hideLoader();
}
window.downloadPDF=downloadPDF;

/* ---------- 17. TABS ---------- */
function initTabs(){
    document.querySelectorAll('.cv-tab-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            document.querySelectorAll('.cv-tab-btn').forEach(function(b){b.classList.remove('active');});
            document.querySelectorAll('.cv-tab-panel').forEach(function(p){p.classList.remove('active');});
            btn.classList.add('active');
            var panel=document.getElementById(btn.dataset.tab); if(panel) panel.classList.add('active');
        });
    });
}

/* ---------- 18. UI UTILS ---------- */
function initUserMenu(){
    var m=document.getElementById('userMenu'),d=document.getElementById('userDropdown');
    if(!m||!d) return;
    m.addEventListener('click',function(e){e.stopPropagation();d.classList.toggle('show');});
    document.addEventListener('click',function(){d.classList.remove('show');});
}
function initSidebar(){
    var sb=document.getElementById('leftSidebar'),ov=document.getElementById('sidebarOverlay'),mb=document.getElementById('menuToggle'),cb=document.getElementById('closeLeftSidebar');
    function open(){if(sb)sb.classList.add('active');if(ov)ov.classList.add('active');document.body.style.overflow='hidden';}
    function close(){if(sb)sb.classList.remove('active');if(ov)ov.classList.remove('active');document.body.style.overflow='';}
    if(mb)mb.addEventListener('click',open); if(cb)cb.addEventListener('click',close); if(ov)ov.addEventListener('click',close);
    var sx=0,sy=0;
    document.addEventListener('touchstart',function(e){sx=e.changedTouches[0].screenX;sy=e.changedTouches[0].screenY;},{passive:true});
    document.addEventListener('touchend',function(e){var dx=e.changedTouches[0].screenX-sx,dy=e.changedTouches[0].screenY-sy;if(Math.abs(dx)<=Math.abs(dy)||Math.abs(dx)<55)return;if(e.cancelable)e.preventDefault();if(dx>0&&sx<50)open();else if(dx<0)close();},{passive:false});
}
function initLogout(){
    document.querySelectorAll('#logoutLink,#logoutLinkSidebar').forEach(function(l){
        l.addEventListener('click',async function(e){e.preventDefault();await supabaseClient.auth.signOut();window.location.href='../../../index.html';});
    });
}

/* ---------- 19. AUTO-SAVE ---------- */
var autoSaveTimer = null;
function scheduleAutoSave(){
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function(){
        if(currentUser && userProfile) saveDraft();
    }, 15000);
}

/* ---------- 20. INITIALISATION ---------- */
document.addEventListener('DOMContentLoaded', async function(){
    var user = await checkSession(); if(!user) return;
    showLoader();
    await loadProfile();
    if(!userProfile){ hideLoader(); return; }
    await loadCVData();
    initTabs();
    initUserMenu();
    initSidebar();
    initLogout();

    var btnSave=document.getElementById('btnSaveDraft');
    if(btnSave) btnSave.addEventListener('click', saveDraft);
    var btnSubmit=document.getElementById('btnSubmitCV');
    if(btnSubmit) btnSubmit.addEventListener('click', submitCV);
    var btnPrev=document.getElementById('btnPreviewCV');
    if(btnPrev) btnPrev.addEventListener('click', previewCV);
    var btnPDF=document.getElementById('btnDownloadPDF');
    if(btnPDF) btnPDF.addEventListener('click', downloadPDF);

    var saveBtn=document.getElementById('saveEntryBtn');
    if(saveBtn) saveBtn.addEventListener('click', saveEntry);
    window.saveEntry=saveEntry;
    window.openEntryModal=openEntryModal;
    window.closeEntryModal=closeEntryModal;
    window.editEntry=editEntry;
    window.deleteEntry=deleteEntry;

    var avatarInput=document.getElementById('avatarInput');
    if(avatarInput) avatarInput.addEventListener('change',function(e){
        var f=e.target.files&&e.target.files[0];
        if(f) uploadAvatar(f);
    });

    document.querySelectorAll('[id^="cv_"],[id^="rec_"]').forEach(function(el){
        el.addEventListener('input', function(){ scheduleAutoSave(); computeCompletion(); });
    });

    document.getElementById('langSelect')?.addEventListener('change',function(e){
        showToast('Langue : '+e.target.options[e.target.selectedIndex].text,'info');
    });
});
