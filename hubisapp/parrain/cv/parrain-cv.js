/* ============================================================
   HubISoccer — parrain-cv.js
   CV Professionnel · Parrain
   Corps · Âme · Esprit
   ============================================================ */
'use strict';

/* DEBUT : CONFIGURATION SUPABASE */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
/* FIN : CONFIGURATION SUPABASE */

/* DEBUT : ÉTAT GLOBAL */
let currentUser  = null;
let userProfile  = null;
let cvData       = null;   // table supabaseAuthPrive_cv_profiles
let scoutingData = null;   // table supabaseAuthPrive_parrain_scouting
const ROLE_CODE  = 'PARRAIN';
const ROLE_LABEL = 'Parrain';
const SCOUTING_TABLE = 'supabaseAuthPrive_parrain_scouting';
const SCOUTING_FK    = 'parrain_id';
const AVATAR_BUCKET  = 'avatars-parrain';
/* FIN : ÉTAT GLOBAL */

/* DEBUT : LOADER & TOAST */
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
/* FIN : LOADER & TOAST */

/* DEBUT : SESSION */
async function checkSession(){
    showLoader();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if(error || !user){
        window.location.href='../../authprive/users/login.html?role=PARRAIN';
        hideLoader(); return null;
    }
    currentUser = user;
    return currentUser;
}
/* FIN : SESSION */

/* DEBUT : PROFIL */
async function loadProfile(){
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    if(error){ showToast('Erreur chargement profil','error'); hideLoader(); return; }
    userProfile = data;
    document.getElementById('userName').textContent = userProfile.full_name||ROLE_LABEL;
    updateAvatarNav();
    populateHeader();
}

function updateAvatarNav(){
    var ni=document.getElementById('userAvatar'), nn=document.getElementById('userAvatarInitials');
    var url=userProfile&&userProfile.avatar_url;
    if(url&&url!==''){ if(ni){ni.src=url;ni.style.display='block';} if(nn)nn.style.display='none'; }
    else{ var init=getInitials((userProfile&&userProfile.full_name)||'P'); if(nn){nn.textContent=init;nn.style.display='flex';} if(ni)ni.style.display='none'; }
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
    // Avatar
    var img=document.getElementById('cvAvatarImg'), init=document.getElementById('cvAvatarInit');
    if(p.avatar_url&&p.avatar_url!==''){ if(img){img.src=p.avatar_url;img.style.display='block';} if(init)init.style.display='none'; }
    else{ if(init){ init.textContent=getInitials(p.full_name||'P'); } if(img) img.style.display='none'; }
}
/* FIN : PROFIL */

/* DEBUT : CV DATA */
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
/* FIN : CV DATA */

/* DEBUT : SAVE DRAFT */
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
/* FIN : SAVE DRAFT */

/* DEBUT : SUBMIT CV */
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
        showToast('CV soumis avec succès ! En attente de validation (0 à 100h).','success',6000);
        updateStatusBadge('submitted');
    } else {
        showToast('Erreur soumission','error');
    }
}
/* FIN : SUBMIT CV */

/* DEBUT : UPDATE STATUS BADGE */
function updateStatusBadge(status){
    var b=document.getElementById('cvStatusBadge');
    if(!b) return;
    var labels={draft:'Brouillon',submitted:'Soumis — En attente',approved:'Validé par HubISoccer',rejected:'Rejeté'};
    var icons={draft:'fa-circle',submitted:'fa-clock',approved:'fa-check-circle',rejected:'fa-times-circle'};
    b.className='cv-status '+status;
    b.innerHTML='<i class="fas '+icons[status]+'"></i> '+labels[status];
}
/* FIN : UPDATE STATUS BADGE */

/* DEBUT : COLLECT FORM VALUES */
function collectFormValues(){
    var d={};
    document.querySelectorAll('[id^="cv_"], [id^="rec_"]').forEach(function(el){
        d[el.id] = el.value;
    });
    d._languages    = window.__cvLanguages    || [];
    d._education    = window.__cvEducation    || [];
    d._experience   = window.__cvExperience   || [];
    d._palmares     = window.__cvPalmares     || [];
    d._techSkills   = window.__cvTechSkills   || [];
    d._mentalSkills = window.__cvMentalSkills || [];
    d._licences     = window.__cvLicences     || [];
    d._works        = window.__cvWorks        || [];
    d._collabs      = window.__cvCollabs      || [];
    d._references   = window.__cvReferences   || [];
    return d;
}
/* FIN : COLLECT FORM VALUES */

/* DEBUT : RESTORE FORM DATA */
function restoreFormData(){
    if(!cvData || !cvData.cv_json) return;
    try{
        var d = JSON.parse(cvData.cv_json);
        for(var k in d){
            if(k.startsWith('_')) continue;
            var el=document.getElementById(k);
            if(el) el.value=d[k]||'';
        }
        window.__cvLanguages    = d._languages    || [];
        window.__cvEducation    = d._education    || [];
        window.__cvExperience   = d._experience   || [];
        window.__cvPalmares     = d._palmares     || [];
        window.__cvTechSkills   = d._techSkills   || [];
        window.__cvMentalSkills = d._mentalSkills || [];
        window.__cvLicences     = d._licences     || [];
        window.__cvWorks        = d._works        || [];
        window.__cvCollabs      = d._collabs      || [];
        window.__cvReferences   = d._references   || [];
        if(cvData.status) updateStatusBadge(cvData.status);
    } catch(e){ console.warn('Restore form error:',e); }
}
/* FIN : RESTORE FORM DATA */

/* DEBUT : RENDER ENTRIES */
function renderEntries(){
    renderList('educationList',    window.__cvEducation   ||[], 'education');
    renderList('experienceList',   window.__cvExperience  ||[], 'experience');
    renderTrophies('palmaresGrid', window.__cvPalmares    ||[]);
    renderSkillBars('techSkillsList',   window.__cvTechSkills   ||[], 'esprit');
    renderSkillBars('mentalSkillsList', window.__cvMentalSkills ||[], 'ame');
    renderList('licencesList',     window.__cvLicences    ||[], 'licence');
    renderList('worksGrid',        window.__cvWorks       ||[], 'work');
    renderList('collabList',       window.__cvCollabs     ||[], 'collab');
    renderList('referencesList',   window.__cvReferences  ||[], 'reference');
    renderLanguages();
}

function renderList(containerId, arr, type){
    var c=document.getElementById(containerId); if(!c) return;
    c.innerHTML='';
    if(!arr.length){ c.innerHTML='<p style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:12px;">Aucune entrée pour le moment.</p>'; return; }
    arr.forEach(function(item, idx){
        var card=document.createElement('div'); card.className='entry-card';
        card.innerHTML='<div class="entry-card-header"><span class="entry-title">'+(item.title||item.name||'—')+'</span>'+(item.period?'<span class="entry-period">'+item.period+'</span>':'')+'</div>'+(item.sub?'<div class="entry-sub">'+item.sub+'</div>':'')+(item.desc?'<div class="entry-desc">'+item.desc+'</div>':'')+'<div class="entry-actions"><button class="btn-entry-edit" onclick="editEntry(\''+type+'\','+idx+')"><i class="fas fa-edit"></i> Modifier</button><button class="btn-entry-del" onclick="deleteEntry(\''+type+'\','+idx+')"><i class="fas fa-trash"></i> Supprimer</button></div>';
        c.appendChild(card);
    });
}

function renderTrophies(containerId, arr){
    var c=document.getElementById(containerId); if(!c) return;
    c.innerHTML='';
    if(!arr.length){ c.innerHTML='<p style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:12px;grid-column:1/-1;">Aucun palmarès pour le moment.</p>'; return; }
    arr.forEach(function(item, idx){
        var card=document.createElement('div'); card.className='trophy-card';
        card.innerHTML='<div class="trophy-icon">'+( item.icon||'🏆')+'</div><div class="trophy-title">'+(item.title||'—')+'</div><div class="trophy-org">'+(item.org||'—')+'</div><div class="trophy-year">'+(item.year||'—')+'</div><div class="entry-actions" style="margin-top:8px;justify-content:center;"><button class="btn-entry-del" onclick="deleteEntry(\'palmares\','+idx+')" style="flex:0;font-size:.7rem;"><i class="fas fa-trash"></i></button></div>';
        c.appendChild(card);
    });
}

function renderSkillBars(containerId, arr, trinite){
    var c=document.getElementById(containerId); if(!c) return;
    c.innerHTML='';
    if(!arr.length){ c.innerHTML='<p style="color:var(--text-muted);font-size:.82rem;padding:12px;">Aucune compétence ajoutée.</p>'; return; }
    arr.forEach(function(item,idx){
        var div=document.createElement('div'); div.className='skill-item';
        div.innerHTML='<span class="skill-name">'+(item.name||'—')+'</span><div class="skill-bar"><div class="skill-fill '+trinite+'" style="width:'+(item.level||0)+'%"></div></div><span class="skill-value">'+(item.level||0)+'</span><button class="btn-entry-del" style="flex:0;padding:3px 8px;font-size:.7rem;" onclick="deleteSkill(\''+containerId+'\',\''+(trinite==='esprit'?'tech':'mental')+'\','+idx+')"><i class="fas fa-times"></i></button>';
        c.appendChild(div);
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
/* FIN : RENDER ENTRIES */

/* DEBUT : ENTRY MODAL */
var _currentEntryType = '';
var _currentEntryIdx  = -1;

function openEntryModal(type, tabIdx){
    _currentEntryType = type;
    _currentEntryIdx  = -1;
    var modal = document.getElementById('entryModal');
    var title = document.getElementById('entryModalTitle');
    var body  = document.getElementById('entryModalBody');
    var tLabels = {
        education:'Formation / Diplôme', experience:'Expérience',
        palmares:'Titre / Trophée', tech_skill:'Compétence technique',
        mental_skill:'Qualité mentale', licence:'Licence / Badge',
        work:'Œuvre / Production', collab:'Collaboration',
        reference:'Référence', generic:'Entrée'
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
    if(type==='education') return '<div class="form-grid"><div class="form-group"><label>Diplôme / Formation</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex: Bac S, Licence STAPS..."></div><div class="form-group"><label>Établissement</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Nom de l\'établissement"></div><div class="form-group"><label>Année obtention</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex: 2021 — 2024"></div><div class="form-group"><label>Mention / Résultat</label><input type="text" id="em_desc" value="'+(item.desc||'')+'" placeholder="Ex: Mention Bien"></div></div>';
    if(type==='experience') return '<div class="form-grid"><div class="form-group"><label>Poste / Rôle</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex: Attaquant, Entraîneur..."></div><div class="form-group"><label>Club / Organisation</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Nom du club ou de l\'organisme"></div><div class="form-group"><label>Période</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex: 2020 — 2023"></div><div class="form-group"><label>Localisation</label><input type="text" id="em_loc" value="'+(item.loc||'')+'" placeholder="Ville, Pays"></div><div class="form-group full"><label>Description / Réalisations</label><textarea id="em_desc" placeholder="Décrivez vos rôles, responsabilités, résultats...">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='palmares') return '<div class="form-grid"><div class="form-group"><label>Titre / Récompense</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex: Champion d\'Afrique, Meilleur Joueur..."></div><div class="form-group"><label>Organisation</label><input type="text" id="em_org" value="'+(item.org||'')+'" placeholder="Ex: CAF, FIFA, SACEM..."></div><div class="form-group"><label>Année</label><input type="text" id="em_year" value="'+(item.year||'')+'" placeholder="Ex: 2024"></div><div class="form-group"><label>Emoji / Icône</label><input type="text" id="em_icon" value="'+(item.icon||'🏆')+'" placeholder="Ex: 🏆 🥇 🎤"></div></div>';
    if(type==='tech_skill'||type==='mental_skill') return '<div class="form-grid"><div class="form-group"><label>Compétence</label><input type="text" id="em_title" value="'+(item.name||'')+'" placeholder="Nom de la compétence"></div><div class="form-group"><label>Niveau (0—100)</label><input type="range" id="em_level" value="'+(item.level||50)+'" min="0" max="100" oninput="document.getElementById(\'em_level_val\').textContent=this.value"></div></div><p style="text-align:center;margin-top:8px;font-size:1rem;font-weight:800;" id="em_level_val">'+(item.level||50)+'</p>';
    if(type==='licence') return '<div class="form-grid"><div class="form-group"><label>Nom de la licence</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex: Licence Pro UEFA A"></div><div class="form-group"><label>Organisme</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex: UEFA, CAF, FIFA..."></div><div class="form-group"><label>Date obtention</label><input type="date" id="em_period" value="'+(item.period||'')+'"></div><div class="form-group"><label>N° Licence</label><input type="text" id="em_desc" value="'+(item.desc||'')+'" placeholder="Numéro officiel"></div></div>';
    if(type==='work') return '<div class="form-grid"><div class="form-group"><label>Titre / Nom de l\'œuvre</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Ex: Album, Film, Collection..."></div><div class="form-group"><label>Type</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex: Album, Court-métrage, Exposition..."></div><div class="form-group"><label>Date / Année</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex: 2024"></div><div class="form-group full"><label>Description</label><textarea id="em_desc" placeholder="Décrivez cette œuvre...">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='collab') return '<div class="form-grid"><div class="form-group"><label>Artiste / Partenaire</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Nom de l\'artiste ou du partenaire"></div><div class="form-group"><label>Type de collaboration</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex: Featuring, Prod, Co-mise en scène..."></div><div class="form-group"><label>Année</label><input type="text" id="em_period" value="'+(item.period||'')+'" placeholder="Ex: 2024"></div><div class="form-group full"><label>Description</label><textarea id="em_desc" placeholder="Décrivez cette collaboration...">'+(item.desc||'')+'</textarea></div></div>';
    if(type==='reference') return '<div class="form-grid"><div class="form-group"><label>Nom complet</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Nom Prénom"></div><div class="form-group"><label>Fonction / Organisation</label><input type="text" id="em_sub" value="'+(item.sub||'')+'" placeholder="Ex: Directeur Technique CAF"></div><div class="form-group"><label>Email</label><input type="email" id="em_period" value="'+(item.period||'')+'" placeholder="email@exemple.com"></div><div class="form-group"><label>Téléphone</label><input type="text" id="em_desc" value="'+(item.desc||'')+'" placeholder="+229 XX XX XX"></div></div>';
    return '<div class="form-group full"><label>Titre</label><input type="text" id="em_title" value="'+(item.title||'')+'" placeholder="Titre..."></div><div class="form-group full" style="margin-top:12px;"><label>Description</label><textarea id="em_desc" placeholder="Description...">'+(item.desc||'')+'</textarea></div>';
}

function closeEntryModal(){ document.getElementById('entryModal').classList.remove('show'); }

function getArrayByType(type){
    if(type==='education')    return window.__cvEducation    = window.__cvEducation   ||[];
    if(type==='experience')   return window.__cvExperience   = window.__cvExperience  ||[];
    if(type==='palmares')     return window.__cvPalmares     = window.__cvPalmares    ||[];
    if(type==='tech_skill')   return window.__cvTechSkills   = window.__cvTechSkills  ||[];
    if(type==='mental_skill') return window.__cvMentalSkills = window.__cvMentalSkills||[];
    if(type==='licence')      return window.__cvLicences     = window.__cvLicences    ||[];
    if(type==='work')         return window.__cvWorks        = window.__cvWorks       ||[];
    if(type==='collab')       return window.__cvCollabs      = window.__cvCollabs     ||[];
    if(type==='reference')    return window.__cvReferences   = window.__cvReferences  ||[];
    return [];
}

function saveEntry(){
    var type = _currentEntryType;
    var arr  = getArrayByType(type);
    var item = {};
    var fields=['title','sub','period','desc','org','year','icon','level','loc'];
    fields.forEach(function(f){ var el=document.getElementById('em_'+f); if(el) item[f]=el.type==='range'?parseInt(el.value):el.value; });
    if(type==='tech_skill'||type==='mental_skill'){ item.name=item.title; }
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

function deleteSkill(containerId, type, idx){
    deleteEntry(type==='tech'?'tech_skill':'mental_skill', idx);
}
/* FIN : ENTRY MODAL */

/* DEBUT : LANGUAGES */
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
/* FIN : LANGUAGES */

/* DEBUT : AVATAR UPLOAD */
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
/* FIN : AVATAR UPLOAD */

/* DEBUT : COMPLETION */
function computeCompletion(){
    var checks=[
        !!document.getElementById('cv_nom')?.value,
        !!document.getElementById('cv_prenom')?.value,
        !!document.getElementById('cv_email')?.value,
        !!document.getElementById('cv_telephone')?.value,
        !!document.getElementById('cv_nationalite')?.value,
        !!document.getElementById('cv_bio')?.value,
        (window.__cvEducation||[]).length>0,
        (window.__cvExperience||[]).length>0,
        (window.__cvLanguages||[]).length>0,
        (window.__cvPalmares||[]).length>0
    ];
    var filled=checks.filter(Boolean).length;
    var pct=Math.round(filled/checks.length*100);
    var fill=document.getElementById('completionFill'), pctEl=document.getElementById('completionPct');
    if(fill) fill.style.width=pct+'%';
    if(pctEl) pctEl.textContent=pct+'%';
}
/* FIN : COMPLETION */

/* DEBUT : COPIER HUB ID */
async function copyHubId(){
    var val=document.getElementById('cvHubIdVal')?.textContent;
    if(!val||val==='—') return;
    try{ await navigator.clipboard.writeText(val); showToast('ID copié !','success',2000); }
    catch(e){ showToast('Erreur copie','error'); }
}
window.copyHubId=copyHubId;
/* FIN : COPIER HUB ID */

/* DEBUT : APERÇU & PDF */
function buildPreviewHTML(){
    var p=userProfile||{};
    var form=collectFormValues();
    var edu=(window.__cvEducation||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">'+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.sub||'')+'</div><div class="cv-item-date">'+(e.period||'')+'</div></div>'; }).join('');
    var exp=(window.__cvExperience||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">'+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.sub||'')+(e.loc?' | '+e.loc:'')+'</div><div class="cv-item-date">'+(e.period||'')+'</div><div class="cv-item-desc">'+(e.desc||'')+'</div></div>'; }).join('');
    var pal=(window.__cvPalmares||[]).map(function(e){ return '<div class="cv-section-item"><div class="cv-item-title">'+(e.icon||'🏆')+' '+(e.title||'—')+'</div><div class="cv-item-sub">'+(e.org||'')+'</div><div class="cv-item-date">'+(e.year||'')+'</div></div>'; }).join('');
    var langs=(window.__cvLanguages||[]).map(function(l){ return '<span style="background:#f0f0f8;padding:3px 10px;border-radius:10px;font-size:.75rem;margin:2px;">'+(l.name||'')+(l.level?' ('+l.level+')':'')+'</span>'; }).join('');
    var techSkills=(window.__cvTechSkills||[]).slice(0,8).map(function(s){ return '<div class="cv-skill-bar-wrap"><div class="cv-skill-label-row"><span>'+(s.name||'—')+'</span><span>'+(s.level||0)+'</span></div><div class="cv-skill-bar"><div class="cv-skill-fill esprit" style="width:'+(s.level||0)+'%"></div></div></div>'; }).join('');
    var mentalSkills=(window.__cvMentalSkills||[]).slice(0,6).map(function(s){ return '<div class="cv-skill-bar-wrap"><div class="cv-skill-label-row"><span>'+(s.name||'—')+'</span><span>'+(s.level||0)+'</span></div><div class="cv-skill-bar"><div class="cv-skill-fill ame" style="width:'+(s.level||0)+'%"></div></div></div>'; }).join('');
    var avatarHtml = (p.avatar_url&&p.avatar_url!=='')?'<img src="'+p.avatar_url+'" class="cv-preview-avatar" style="width:90px;height:90px;border-radius:50%;border:3px solid rgba(255,255,255,.4);object-fit:cover;">':'<div class="cv-preview-avatar-init">'+getInitials(p.full_name||'P')+'</div>';

    return `
    <div class="cv-preview-wrap" id="cvPreviewContent">
        <div class="cv-preview-header" style="background:#4B0082;">
            ${avatarHtml}
            <div>
                <div class="cv-preview-name">${p.full_name||'—'}</div>
                <div class="cv-preview-role">Parrain — HubISoccer</div>
                <div class="cv-preview-contacts">
                    <span>✉ ${p.email||'—'}</span>
                    <span>☎ ${p.phone||'—'}</span>
                    <span>🌍 ${form.cv_pays||p.country_code||'—'}</span>
                </div>
            </div>
        </div>
        <div class="cv-preview-body">
            <div class="cv-col-left">
                <div class="cv-section-head">Compétences techniques</div>
                ${techSkills||'<p style="font-size:.75rem;color:#999;">Non renseignées</p>'}
                <div class="cv-section-head" style="margin-top:18px;">Qualités mentales</div>
                ${mentalSkills||'<p style="font-size:.75rem;color:#999;">Non renseignées</p>'}
                <div class="cv-section-head" style="margin-top:18px;">Langues</div>
                <div>${langs||'<p style="font-size:.75rem;color:#999;">Non renseignées</p>'}</div>
            </div>
            <div class="cv-col-right">
                <div class="cv-section-head">Profil & Bio</div>
                <p style="font-size:.82rem;color:#444;line-height:1.6;margin-bottom:16px;">${form.cv_bio||'—'}</p>
                <div class="cv-section-head">Formation</div>
                ${edu||'<p style="font-size:.75rem;color:#999;">Non renseignée</p>'}
                <div class="cv-section-head" style="margin-top:16px;">Expérience</div>
                ${exp||'<p style="font-size:.75rem;color:#999;">Non renseignée</p>'}
                <div class="cv-section-head" style="margin-top:16px;">Palmarès</div>
                ${pal||'<p style="font-size:.75rem;color:#999;">Non renseigné</p>'}
            </div>
        </div>
        <div class="cv-preview-footer">
            <span class="cv-footer-logo">HubISoccer — Parrain</span>
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
        var opt={margin:.5,filename:'CV_parrain_HubISoccer.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2},jsPDF:{unit:'in',format:'a4',orientation:'portrait'}};
        await html2pdf().set(opt).from(el).save();
        showToast('PDF téléchargé !','success');
    } catch(e){ showToast('Erreur PDF : '+e.message,'error'); }
    hideLoader();
}
window.downloadPDF=downloadPDF;
/* FIN : APERÇU & PDF */

/* DEBUT : TABS */
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
/* FIN : TABS */

/* DEBUT : UI UTILS */
function initUserMenu(){
    var m=document.getElementById('userMenu'),d=document.getElementById('userDropdown');
    if(!m||!d) return;
    m.addEventListener('click',function(e){e.stopPropagation();d.classList.toggle('show');});
    document.addEventListener('click',function(){d.classList.remove('show');});
}
function initSidebar(){
    var sb=document.getElementById('leftSidebar'),ov=document.getElementById('sidebarOverlay'),mb=document.getElementById('menuToggle'),cb=document.getElementById('closeSidebar');
    function open(){if(sb)sb.classList.add('active');if(ov)ov.classList.add('active');document.body.style.overflow='hidden';}
    function close(){if(sb)sb.classList.remove('active');if(ov)ov.classList.remove('active');document.body.style.overflow='';}
    if(mb)mb.addEventListener('click',open); if(cb)cb.addEventListener('click',close); if(ov)ov.addEventListener('click',close);
    var sx=0,sy=0;
    document.addEventListener('touchstart',function(e){sx=e.changedTouches[0].screenX;sy=e.changedTouches[0].screenY;},{passive:true});
    document.addEventListener('touchend',function(e){var dx=e.changedTouches[0].screenX-sx,dy=e.changedTouches[0].screenY-sy;if(Math.abs(dx)<=Math.abs(dy)||Math.abs(dx)<55)return;if(e.cancelable)e.preventDefault();if(dx>0&&sx<50)open();else if(dx<0)close();},{passive:false});
}
function initLogout(){
    document.querySelectorAll('#logoutLink,#logoutLinkSidebar').forEach(function(l){
        l.addEventListener('click',async function(e){e.preventDefault();await supabaseClient.auth.signOut();window.location.href='../../authprive/users/login.html?role=PARRAIN';});
    });
}
/* FIN : UI UTILS */

/* DEBUT : AUTO-SAVE */
var autoSaveTimer = null;
function scheduleAutoSave(){
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function(){
        if(currentUser && userProfile) saveDraft();
    }, 15000);
}
/* FIN : AUTO-SAVE */

/* DEBUT : INIT */
document.addEventListener('DOMContentLoaded', async function(){
    var user = await checkSession(); if(!user) return;
    showLoader();
    await loadProfile();
    if(!userProfile){ hideLoader(); showToast('Profil introuvable','error'); return; }
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
/* FIN : INIT */