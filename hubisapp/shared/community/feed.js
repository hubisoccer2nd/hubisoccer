// ============================================================
//  HUBISOCCER — FEED.JS (adapté de community.js)
//  Feed principal — Tous rôles
// ============================================================

'use strict';

// Début configuration Supabase
const SUPABASE_URL  = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window.__SUPABASE_CLIENT = sb;
// Fin configuration Supabase

// Début état global
let currentUser    = null;
let currentProfile = null;
let myCommunity    = null;
let posts          = [];
let likedPosts     = new Set();
let savedPosts     = new Set();
let activeFilter     = 'all';
let activeRoleFilter = 'all';
let searchQuery      = '';
let newPostsCount    = 0;
let postOffset       = 0;
const PAGE_SIZE      = 20;
let hasMorePosts     = false;
let loadingPosts     = false;
let mediaFile        = null;
let pendingPoll      = null;
let pendingEvent     = null;
let scheduledAt      = null;
let pinPostActive    = false;
let feedSubscription = null;
let storyGroups      = [];
let currentStoryGroupIdx = 0;
let currentStoryIdx  = 0;
let storyTimer       = null;
let replyCommentId   = null;
let replyPostId      = null;
let currentReportPostId = null;
let currentBlockUserId  = null;
let currentSharePostId  = null;
// Fin état global

// Début mapping des rôles vers dashboards (chemins corrigés pour hubisapp)
const roleDashboardMap = {
    'ADMIN': '../../authprive/admin/admin-dashboard.html',
    'FOOT': '../../footballeur/dashboard/foot-dash.html',
    'BASK': '../../basketteur/dashboard/basketteur-dash.html',
    'TENN': '../../tennisman/dashboard/tennisman-dash.html',
    'ATHL': '../../athlete/dashboard/athlete-dash.html',
    'HANDB': '../../handballeur/dashboard/handballeur-dash.html',
    'VOLL': '../../volleyeur/dashboard/volleyeur-dash.html',
    'RUGBY': '../../rugbyman/dashboard/rugbyman-dash.html',
    'NATA': '../../nageur/dashboard/nageur-dash.html',
    'ARTSM': '../../arts_martiaux/dashboard/arts_martiaux-dash.html',
    'CYCL': '../../cycliste/dashboard/cycliste-dash.html',
    'CHAN': '../../chanteur/dashboard/chanteur-dash.html',
    'DANS': '../../danseur/dashboard/danseur-dash.html',
    'COMP': '../../compositeur/dashboard/compositeur-dash.html',
    'ACIN': '../../acteur_cinema/dashboard/acteur_cinema-dash.html',
    'ATHE': '../../acteur_theatre/dashboard/acteur_theatre-dash.html',
    'HUMO': '../../humoriste/dashboard/humoriste-dash.html',
    'SLAM': '../../slameur/dashboard/slameur-dash.html',
    'DJ': '../../dj/dashboard/dj-dash.html',
    'CIRQ': '../../cirque/dashboard/cirque-dash.html',
    'VISU': '../../artiste_visuel/dashboard/artiste_visuel-dash.html',
    'PARRAIN': '../../parrain/dashboard/parrain-dash.html',
    'AGENT': '../../agent_fifa/dashboard/agent_fifa-dash.html',
    'COACH': '../../coach/dashboard/coach-dash.html',
    'MEDIC': '../../staff_medical/dashboard/staff_medical-dash.html',
    'ARBIT': '../../corps_arbitral/dashboard/corps_arbitral-dash.html',
    'ACAD': '../../academie_sportive/dashboard/academie_sportive-dash.html',
    'FORM': '../../formateur/dashboard/formateur-dash.html',
    'TOURN': '../../gestionnaire_tournoi/dashboard/gestionnaire_tournoi-dash.html'
};
// Fin mapping

// Début fonctions utilitaires
function toast(msg, type='info', dur=20000) {
    const c = document.getElementById('toastContainer');
    const icons={success:'fa-check-circle',error:'fa-exclamation-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    const el=document.createElement('div'); el.className=`c-toast ${type}`;
    el.innerHTML=`<i class="fas ${icons[type]}"></i><span>${msg}</span><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    c.appendChild(el);
    setTimeout(()=>{el.style.animation='slideInRight 0.3s reverse';setTimeout(()=>el.remove(),300);},dur);
}

function setLoader(show, text='', pct=0) {
    const l=document.getElementById('globalLoader');
    if(!l) return;
    l.style.display=show?'flex':'none';
    if(text) document.getElementById('loaderText').textContent=text;
    document.getElementById('loaderBar').style.width=pct+'%';
}

function timeSince(d) {
    const s=Math.floor((new Date()-new Date(d))/1000);
    if(s<60) return 'À l\'instant';
    const m=Math.floor(s/60); if(m<60) return `${m} min`;
    const h=Math.floor(m/60); if(h<24) return `${h}h`;
    const j=Math.floor(h/24); if(j<7) return `${j}j`;
    return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
}

function escapeHtml(s) {
    if(!s) return '';
    return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function formatText(t) {
    if(!t) return '';
    return escapeHtml(t)
        .replace(/@(\w+)/g,'<span class="mention" onclick="openUserByHandle(\'$1\')">@$1</span>')
        .replace(/#(\w+)/g,'<span class="hashtag" onclick="searchByHashtag(\'$1\')">#$1</span>')
        .replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g,'<br>');
}

function openModal(id) { const e=document.getElementById(id); if(e){e.style.display='flex';setTimeout(()=>e.classList.add('show'),10);} }
function closeModal(id) { const e=document.getElementById(id); if(e){e.classList.remove('show');e.style.display='none';} }
window.closeModal = closeModal;

function getInitials(name) {
    if(!name) return '?';
    const parts=name.trim().split(/\s+/);
    if(parts.length>=2) return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
    return name[0].toUpperCase();
}
// Fin fonctions utilitaires

// Début session
async function checkSession() {
    setLoader(true,'Vérification session...',20);
    const {data:{session},error}=await sb.auth.getSession();
    if(error||!session){window.location.href='../../authprive/users/login.html';return null;}
    currentUser=session.user; return currentUser;
}
// Fin session

// Début chargement profil
async function loadProfile() {
    setLoader(true,'Chargement profil...',40);
    const {data,error}=await sb.from('supabaseAuthPrive_profiles').select('*').eq('auth_uuid',currentUser.id).single();
    if(error){toast('Erreur chargement profil','error');return null;}
    currentProfile=data;

    document.getElementById('userName').textContent=data.full_name||data.display_name||'Utilisateur';
    const initials=getInitials(data.full_name||data.display_name||'?');
    document.getElementById('userAvatarInitials').textContent=initials;
    document.getElementById('publishAvatarInitials').textContent=initials;
    document.getElementById('storyAddAvatarInitials').textContent=initials;

    const dash=roleDashboardMap[data.role_code]||'../../index.html';
    document.getElementById('dropDashboard').href=dash;
    document.getElementById('navLogo').onclick=()=>window.location.href=dash;

    buildSidebarMenu(data.role_code);
    return data;
}
// Fin chargement profil

// Début construction sidebar
function buildSidebarMenu(roleCode) {
    const nav=document.getElementById('sidebarNav');
    const titleEl=document.getElementById('sidebarRoleTitle');
    const menuConfig={
        'FOOT':{title:'Menu Footballeur',items:[
            {icon:'fa-tachometer-alt',label:'Tableau de bord',href:'../../footballeur/dashboard/foot-dash.html'},
            {icon:'fa-users',label:'Ma Communauté',href:'feed.html',active:true},
            {icon:'fa-shield-alt',label:'Vérification',href:'../../footballeur/verification/foot-verif.html'},
            {icon:'fa-file-alt',label:'Mon CV Pro',href:'../../footballeur/edit-cv/foot-cv.html'},
            {icon:'fa-certificate',label:'Diplômes & Certifs',href:'../../footballeur/certifications/foot-certif.html'},
            {icon:'fa-trophy',label:'Suivi Tournoi',href:'../../shared/suivi-tournoi/suivi-tournoi.html'},
            {icon:'fa-video',label:'Mes Vidéos',href:'../../footballeur/videos/foot-videos.html'},
            {icon:'fa-coins',label:'Mes Revenus',href:'../../footballeur/revenus/foot-revenus.html'},
            {icon:'fa-envelope',label:'Messages',href:'../messagerie/conversation.html'},
            {icon:'fa-headset',label:'Support',href:'../../footballeur/support/foot-supp.html'}
        ]},
        'ADMIN':{title:'Menu Admin',items:[
            {icon:'fa-chart-pie',label:'Dashboard',href:'../../authprive/admin/admin-dashboard.html'},
            {icon:'fa-users',label:'Communauté',href:'feed.html',active:true},
            {icon:'fa-id-card',label:'Gestion IDs',href:'../../authprive/admin/admin-ids.html'},
            {icon:'fa-users-cog',label:'Utilisateurs',href:'../../authprive/admin/admin-users.html'},
            {icon:'fa-history',label:'Logs',href:'../../authprive/admin/admin-logs.html'}
        ]}
    };
    const config=menuConfig[roleCode]||{title:'Menu',items:[{icon:'fa-users',label:'Communauté',href:'feed.html',active:true}]};
    titleEl.textContent=config.title;
    nav.innerHTML=config.items.map(i=>`<a href="${i.href}" class="${i.active?'active':''}"><i class="fas ${i.icon}"></i> ${i.label}</a>`).join('')+
        '<hr><a href="#" id="sidebarLogout" style="color:var(--danger)"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>';
    document.getElementById('sidebarLogout')?.addEventListener('click',logout);
}
// Fin construction sidebar

// Début chargement communauté
async function loadMyCommunity() {
    const {data,error}=await sb.from('supabaseAuthPrive_communities')
        .select('*').eq('hubisoccer_id',currentProfile.hubisoccer_id).maybeSingle();
    if(error||!data){window.location.href='feed-setup.html';return null;}
    myCommunity=data;

    document.getElementById('myCommName').textContent=data.name||'Ma Communauté';
    document.getElementById('myCommHandle').textContent='@'+(data.feed_id||'');
    document.getElementById('myCommFollowers').textContent=data.followers_count||0;
    document.getElementById('myCommFollowing').textContent=data.following_count||0;
    document.getElementById('myCommPosts').textContent=data.posts_count||0;
    if(data.cover_url) document.getElementById('myCommCover').style.backgroundImage=`url(${data.cover_url})`;
    const initials=getInitials(data.name||'?');
    document.getElementById('myCommAvatarInitials').textContent=initials;

    return data;
}
// Fin chargement communauté

// Début chargement likes/sauvegardes
async function loadLikedAndSaved() {
    const [{data:likes},{data:saved}]=await Promise.all([
        sb.from('supabaseAuthPrive_post_likes').select('post_id').eq('user_hubisoccer_id',currentProfile.hubisoccer_id),
        sb.from('supabaseAuthPrive_saved_posts').select('post_id').eq('user_hubisoccer_id',currentProfile.hubisoccer_id)
    ]);
    likedPosts=new Set((likes||[]).map(l=>l.post_id));
    savedPosts=new Set((saved||[]).map(s=>s.post_id));
}
// Fin chargement likes/sauvegardes

// Début chargement posts
async function loadPosts(reset=false){
    if(loadingPosts) return;
    loadingPosts=true;
    if(reset){postOffset=0;posts=[];document.getElementById('postsFeed').innerHTML='';}
    setLoader(true,'Chargement des publications...',70);
    try{
        let query=sb.from('supabaseAuthPrive_posts')
            .select('*, author:author_hubisoccer_id(full_name,display_name,feed_id,certified,avatar_url,role_code), community:community_id(name,feed_id,avatar_url)')
            .eq('is_scheduled',false)
            .order('created_at',{ascending:false})
            .range(postOffset,postOffset+PAGE_SIZE-1);

        if(activeFilter==='following'){
            const {data:follows}=await sb.from('supabaseAuthPrive_follows').select('following_hubisoccer_id').eq('follower_hubisoccer_id',currentProfile.hubisoccer_id);
            const ids=(follows||[]).map(f=>f.following_hubisoccer_id);
            if(ids.length) query=query.in('author_hubisoccer_id',ids);
            else{posts=[];renderPosts();loadingPosts=false;setLoader(false);return;}
        }
        if(activeFilter==='pinned') query=query.eq('is_pinned',true);
        if(activeFilter==='media') query=query.not('media_url','is',null);
        if(activeFilter==='polls') query=query.not('poll_data','is',null);
        if(activeRoleFilter!=='all') query=query.eq('author.role_code',activeRoleFilter);
        if(searchQuery) query=query.ilike('content',`%${searchQuery}%`);

        const {data,error}=await query;
        if(error) throw error;

        hasMorePosts=data.length===PAGE_SIZE;
        postOffset+=data.length;
        if(reset) posts=data; else posts=[...posts,...data];
        renderPosts();
        document.getElementById('loadMoreWrap').style.display=hasMorePosts?'block':'none';
    }catch(err){
        console.error('Erreur chargement posts:',err);
        toast('Erreur chargement posts','error');
    }finally{
        loadingPosts=false;
        setLoader(false);
    }
}
// Fin chargement posts

// Début rendu posts
function renderPosts(){
    const feed=document.getElementById('postsFeed');
    if(posts.length===0){
        feed.innerHTML=`<div class="c-empty"><div class="c-empty-icon"><i class="fas fa-stream"></i></div><h3>Aucune publication</h3><p>Soyez le premier à publier !</p></div>`;
        return;
    }
    feed.innerHTML=posts.map(post=>makePostCard(post)).join('');
    attachPostEvents();
}

function makePostCard(post){
    const isOwn=post.author_hubisoccer_id===currentProfile.hubisoccer_id;
    const liked=likedPosts.has(post.id);
    const saved=savedPosts.has(post.id);
    const author=post.author||{};
    const handle=author.feed_id?'@'+author.feed_id:'';
    const certified=author.certified?'<i class="fas fa-check-circle" style="color:var(--primary);margin-left:4px"></i>':'';
    const initials=getInitials(author.full_name||author.display_name||'?');

    let mediaHtml='';
    if(post.media_url){
        if(post.media_type==='video') mediaHtml=`<div class="post-media"><video src="${post.media_url}" controls preload="metadata"></video></div>`;
        else mediaHtml=`<div class="post-media"><img src="${post.media_url}" alt="" loading="lazy" onclick="openMediaZoom('${post.media_url}','image')"></div>`;
    }

    let pollHtml='';
    if(post.poll_data){
        const poll=typeof post.poll_data==='string'?JSON.parse(post.poll_data):post.poll_data;
        const total=Object.values(poll.votes||{}).reduce((a,b)=>a+b,0);
        const voted=poll.voted_by?.includes(currentProfile.hubisoccer_id);
        pollHtml=`<div class="post-poll"><div class="poll-question">${escapeHtml(poll.question)}</div>`;
        poll.options.forEach((opt,i)=>{
            const v=poll.votes?.[i]||0;
            const pct=total?Math.round(v/total*100):0;
            pollHtml+=`<div class="poll-option ${voted?'voted':''}" data-post-id="${post.id}" data-option="${i}"><div class="poll-bar" style="width:${voted?pct:0}%"></div><span class="poll-option-text">${escapeHtml(opt)}</span>${voted?`<span class="poll-pct">${pct}%</span>`:''}</div>`;
        });
        pollHtml+=`<div class="poll-meta"><i class="fas fa-users"></i> ${total} vote${total!==1?'s':''}</div></div>`;
    }

    let eventHtml='';
    if(post.event_data){
        const evt=typeof post.event_data==='string'?JSON.parse(post.event_data):post.event_data;
        const d=new Date(evt.date);
        eventHtml=`<div class="post-event"><div class="event-card"><div class="event-date-block"><div class="event-day">${d.getDate()}</div><div class="event-month">${d.toLocaleString('fr',{month:'short'})}</div></div><div class="event-info"><h4>${escapeHtml(evt.title)}</h4><div class="event-meta"><span><i class="fas fa-clock"></i>${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>${evt.location?`<span><i class="fas fa-map-marker-alt"></i>${escapeHtml(evt.location)}</span>`:''}</div></div></div></div>`;
    }

    return `
    <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
            <div class="post-avatar">${author.avatar_url?`<img src="${author.avatar_url}">`:`<div class="avatar-initials">${initials}</div>`}</div>
            <div class="post-meta">
                <div class="post-author">${escapeHtml(author.full_name||author.display_name||'Utilisateur')} ${certified}</div>
                <div class="post-author-sub">${handle} · ${timeSince(post.created_at)} ${post.edited?'(modifié)':''} ${post.pinned?'<i class="fas fa-thumbtack"></i>':''}</div>
            </div>
            <div class="post-menu-wrap">
                <button class="post-menu-btn" onclick="togglePostMenu(this, '${post.id}', ${isOwn})"><i class="fas fa-ellipsis-h"></i></button>
                <div class="post-dropdown" id="menu_${post.id}">
                    ${isOwn?`<button class="post-drop-item" onclick="editPost('${post.id}')"><i class="fas fa-pen"></i> Modifier</button>`:''}
                    ${isOwn?`<button class="post-drop-item danger" onclick="deletePost('${post.id}')"><i class="fas fa-trash-alt"></i> Supprimer</button>`:''}
                    <button class="post-drop-item" onclick="openShareModal('${post.id}')"><i class="fas fa-share-alt"></i> Partager</button>
                    ${!isOwn?`<button class="post-drop-item danger" onclick="openReportModal('${post.id}')"><i class="fas fa-flag"></i> Signaler</button>`:''}
                    <button class="post-drop-item" onclick="hidePost('${post.id}')"><i class="fas fa-eye-slash"></i> Masquer</button>
                </div>
            </div>
        </div>
        <div class="post-body">${post.content?`<div class="post-text">${formatText(post.content)}</div>`:''}</div>
        ${mediaHtml} ${pollHtml} ${eventHtml}
        <div class="post-actions">
            <button class="post-action ${liked?'liked':''}" onclick="toggleLike('${post.id}', this)"><i class="fa${liked?'s':'r'} fa-heart"></i> <span id="likeCount_${post.id}">${post.likes_count||0}</span></button>
            <button class="post-action" onclick="toggleComments('${post.id}', this)"><i class="far fa-comment"></i> <span id="commentCount_${post.id}">${post.comments_count||0}</span></button>
            <button class="post-action" onclick="repost('${post.id}')"><i class="fas fa-retweet"></i> <span id="repostCount_${post.id}">${post.reposts_count||0}</span></button>
            <button class="post-action" onclick="openShareModal('${post.id}')"><i class="fas fa-share"></i> <span id="shareCount_${post.id}">${post.shares_count||0}</span></button>
            <button class="post-action ${saved?'saved':''}" onclick="toggleSave('${post.id}', this)"><i class="fa${saved?'s':'r'} fa-bookmark"></i></button>
        </div>
        <div class="post-comments" id="comments_${post.id}" style="display:none"></div>
    </div>`;
}

function attachPostEvents(){
    document.querySelectorAll('.poll-option:not(.voted)').forEach(opt=>{
        opt.addEventListener('click',()=>votePoll(opt.dataset.postId,parseInt(opt.dataset.option)));
    });
}
// Fin rendu posts

// Début interactions posts
async function toggleLike(postId,btn){
    const isLiked=likedPosts.has(postId);
    const countEl=document.getElementById(`likeCount_${postId}`);
    const post=posts.find(p=>p.id===postId);
    if(isLiked){
        likedPosts.delete(postId);
        btn.classList.remove('liked'); btn.querySelector('i').className='far fa-heart';
        if(countEl&&post){post.likes_count=Math.max(0,post.likes_count-1);countEl.textContent=post.likes_count;}
        await sb.from('supabaseAuthPrive_post_likes').delete().eq('post_id',postId).eq('user_hubisoccer_id',currentProfile.hubisoccer_id);
        await sb.from('supabaseAuthPrive_posts').update({likes_count:post.likes_count}).eq('id',postId);
    }else{
        likedPosts.add(postId);
        btn.classList.add('liked'); btn.querySelector('i').className='fas fa-heart';
        if(countEl&&post){post.likes_count=(post.likes_count||0)+1;countEl.textContent=post.likes_count;}
        await sb.from('supabaseAuthPrive_post_likes').insert({post_id:postId,user_hubisoccer_id:currentProfile.hubisoccer_id});
        await sb.from('supabaseAuthPrive_posts').update({likes_count:post.likes_count}).eq('id',postId);
        if(post.author_hubisoccer_id!==currentProfile.hubisoccer_id){
            await sb.from('supabaseAuthPrive_notifications').insert({recipient_hubisoccer_id:post.author_hubisoccer_id,title:'Nouveau like',message:`${currentProfile.full_name} a aimé votre publication.`,type:'like',data:{postId}});
        }
    }
}

async function toggleSave(postId,btn){
    const isSaved=savedPosts.has(postId);
    if(isSaved){
        savedPosts.delete(postId);
        btn.classList.remove('saved'); btn.querySelector('i').className='far fa-bookmark';
        await sb.from('supabaseAuthPrive_saved_posts').delete().eq('post_id',postId).eq('user_hubisoccer_id',currentProfile.hubisoccer_id);
        toast('Publication retirée','info');
    }else{
        savedPosts.add(postId);
        btn.classList.add('saved'); btn.querySelector('i').className='fas fa-bookmark';
        await sb.from('supabaseAuthPrive_saved_posts').insert({post_id:postId,user_hubisoccer_id:currentProfile.hubisoccer_id});
        toast('Publication sauvegardée','success');
    }
}

async function repost(postId){
    const post=posts.find(p=>p.id===postId);
    if(!post) return;
    const {error}=await sb.from('supabaseAuthPrive_posts').insert({
        author_hubisoccer_id:currentProfile.hubisoccer_id,
        content:post.content,
        media_url:post.media_url, media_type:post.media_type,
        reposted_from_id:postId
    });
    if(error){toast('Erreur repost','error');return;}
    toast('Repost effectué !','success');
    await sb.from('supabaseAuthPrive_posts').update({reposts_count:(post.reposts_count||0)+1}).eq('id',postId);
    post.reposts_count=(post.reposts_count||0)+1;
    document.getElementById(`repostCount_${postId}`).textContent=post.reposts_count;
    loadPosts(true);
}

async function deletePost(postId){
    if(!confirm('Supprimer cette publication ?')) return;
    await sb.from('supabaseAuthPrive_posts').delete().eq('id',postId);
    posts=posts.filter(p=>p.id!==postId);
    renderPosts();
    toast('Publication supprimée','success');
}

function editPost(postId){
    const post=posts.find(p=>p.id===postId);
    if(!post) return;
    const newContent=prompt('Modifier la publication :',post.content||'');
    if(newContent===null) return;
    sb.from('supabaseAuthPrive_posts').update({content:newContent,edited:true}).eq('id',postId).then(()=>{
        post.content=newContent; post.edited=true;
        renderPosts();
        toast('Publication modifiée','success');
    });
}

function togglePostMenu(btn,postId,isOwn){
    const menu=document.getElementById(`menu_${postId}`);
    document.querySelectorAll('.post-dropdown.show').forEach(m=>{if(m!==menu)m.classList.remove('show');});
    menu?.classList.toggle('show');
    document.addEventListener('click',()=>menu?.classList.remove('show'),{once:true});
}
// Fin interactions posts

// Début commentaires
async function toggleComments(postId, btn) {
    const section = document.getElementById(`comments_${postId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(postId);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(postId) {
    const section = document.getElementById(`comments_${postId}`);
    const { data, error } = await sb
        .from('supabaseAuthPrive_comments')
        .select('*, author:author_hubisoccer_id(full_name, display_name, feed_id, avatar_url, certified)')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

    if (error) { toast('Erreur commentaires', 'error'); return; }

    section.innerHTML = `
        <div class="comments-list">${(data||[]).map(c => makeCommentHtml(c, postId)).join('')}</div>
        <div class="comment-input-row">
            <div class="comment-avatar">${getInitials(currentProfile.full_name||'?')}</div>
            <div class="comment-input-wrap">
                <textarea class="comment-input" id="commentInput_${postId}" rows="1" placeholder="Écrire un commentaire..."></textarea>
                <button class="comment-send-btn" onclick="sendComment('${postId}')"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    const ta = document.getElementById(`commentInput_${postId}`);
    ta?.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 80) + 'px'; });
    ta?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(postId); } });
}

function makeCommentHtml(c, postId) {
    const author = c.author || {};
    const certified = author.certified ? '<i class="fas fa-check-circle" style="color:var(--primary);margin-left:4px"></i>' : '';
    const initials = getInitials(author.full_name || author.display_name || '?');
    return `<div class="comment-item" id="comment_${c.id}">
        <div class="comment-avatar">${author.avatar_url ? `<img src="${author.avatar_url}">` : `<div class="avatar-initials">${initials}</div>`}</div>
        <div>
            <div class="comment-bubble">
                <div class="comment-author">${escapeHtml(author.full_name || author.display_name || 'Utilisateur')} ${certified}</div>
                <div class="comment-text">${formatText(c.content)}</div>
            </div>
            <div class="comment-actions">
                <button class="comment-action-btn" onclick="likeComment('${c.id}', this)"><i class="far fa-heart"></i> <span id="cmLike_${c.id}">${c.likes_count||0}</span></button>
                <button class="comment-action-btn" onclick="openReplyModal('${c.id}','${postId}')"><i class="fas fa-reply"></i> Répondre</button>
                ${c.author_hubisoccer_id === currentProfile.hubisoccer_id ? `<button class="comment-action-btn" style="color:var(--danger)" onclick="deleteComment('${c.id}','${postId}')">Supprimer</button>` : ''}
                <span class="comment-time">${timeSince(c.created_at)}</span>
            </div>
        </div>
    </div>`;
}

async function sendComment(postId) {
    const input = document.getElementById(`commentInput_${postId}`);
    const content = input.value.trim();
    if (!content) return;
    const { data, error } = await sb.from('supabaseAuthPrive_comments').insert({
        post_id: postId, author_hubisoccer_id: currentProfile.hubisoccer_id, content
    }).select('*, author:author_hubisoccer_id(full_name, display_name, feed_id, avatar_url, certified)').single();
    if (error) { toast('Erreur envoi', 'error'); return; }

    const list = document.querySelector(`#comments_${postId} .comments-list`);
    list.insertAdjacentHTML('beforeend', makeCommentHtml(data, postId));
    input.value = ''; input.style.height = 'auto';

    const post = posts.find(p => p.id === postId);
    if (post) { post.comments_count = (post.comments_count || 0) + 1; document.getElementById(`commentCount_${postId}`).textContent = post.comments_count; }
    await sb.from('supabaseAuthPrive_posts').update({ comments_count: post.comments_count }).eq('id', postId);
    if (post.author_hubisoccer_id !== currentProfile.hubisoccer_id) {
        await sb.from('supabaseAuthPrive_notifications').insert({ recipient_hubisoccer_id: post.author_hubisoccer_id, title: 'Nouveau commentaire', message: `${currentProfile.full_name} a commenté votre publication.`, type: 'comment', data: { postId } });
    }
}

async function likeComment(commentId, btn) {
    const liked = btn.classList.contains('liked');
    const countSpan = document.getElementById(`cmLike_${commentId}`) || btn.querySelector('span');
    let count = parseInt(countSpan?.textContent) || 0;
    if (liked) {
        btn.classList.remove('liked'); btn.querySelector('i').className = 'far fa-heart';
        count = Math.max(0, count - 1);
        await sb.from('supabaseAuthPrive_comment_likes').delete().eq('comment_id', commentId).eq('user_hubisoccer_id', currentProfile.hubisoccer_id);
    } else {
        btn.classList.add('liked'); btn.querySelector('i').className = 'fas fa-heart';
        count++;
        await sb.from('supabaseAuthPrive_comment_likes').insert({ comment_id: commentId, user_hubisoccer_id: currentProfile.hubisoccer_id });
    }
    if (countSpan) countSpan.textContent = count;
    await sb.from('supabaseAuthPrive_comments').update({ likes_count: count }).eq('id', commentId);
}

async function deleteComment(commentId, postId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await sb.from('supabaseAuthPrive_comments').delete().eq('id', commentId);
    document.getElementById(`comment_${commentId}`)?.remove();
    const post = posts.find(p => p.id === postId);
    if (post) { post.comments_count = Math.max(0, (post.comments_count || 1) - 1); document.getElementById(`commentCount_${postId}`).textContent = post.comments_count; }
    await sb.from('supabaseAuthPrive_posts').update({ comments_count: post.comments_count }).eq('id', postId);
    toast('Commentaire supprimé', 'success');
}

function openReplyModal(commentId, postId) {
    replyCommentId = commentId; replyPostId = postId;
    const commentEl = document.querySelector(`#comment_${commentId} .comment-text`);
    document.getElementById('originalCommentQuote').textContent = commentEl?.textContent?.substring(0, 80) || '';
    document.getElementById('replyContent').value = '';
    openModal('modalReply');
}

async function sendReply() {
    const content = document.getElementById('replyContent').value.trim();
    if (!content) return;
    await sb.from('supabaseAuthPrive_comments').insert({
        post_id: replyPostId, author_hubisoccer_id: currentProfile.hubisoccer_id, content, parent_id: replyCommentId
    });
    closeModal('modalReply');
    await loadComments(replyPostId);
    toast('Réponse envoyée', 'success');
}
// Fin commentaires

// Début sondage
async function votePoll(postId, optionIdx) {
    const post = posts.find(p => p.id === postId);
    if (!post?.poll_data) return;
    const poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    if (poll.voted_by?.includes(currentProfile.hubisoccer_id)) return;
    poll.votes = poll.votes || {};
    poll.votes[optionIdx] = (poll.votes[optionIdx] || 0) + 1;
    poll.voted_by = [...(poll.voted_by || []), currentProfile.hubisoccer_id];
    post.poll_data = poll;
    await sb.from('supabaseAuthPrive_posts').update({ poll_data: poll }).eq('id', postId);
    renderPosts();
}
// Fin sondage

// Début partage / signalement / masquage
function openShareModal(postId) { currentSharePostId = postId; openModal('modalShare'); }
function openReportModal(postId) { currentReportPostId = postId; document.getElementById('reportReason').value = ''; openModal('modalReport'); }
async function hidePost(postId) {
    await sb.from('supabaseAuthPrive_hidden_posts').insert({ post_id: postId, user_hubisoccer_id: currentProfile.hubisoccer_id });
    posts = posts.filter(p => p.id !== postId);
    renderPosts();
    toast('Publication masquée', 'info');
}
async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) { toast('Veuillez indiquer une raison', 'warning'); return; }
    await sb.from('supabaseAuthPrive_reports').insert({ post_id: currentReportPostId, reporter_hubisoccer_id: currentProfile.hubisoccer_id, reason });
    closeModal('modalReport');
    toast('Signalement envoyé', 'success');
}
function sharePost(network) {
    const post = posts.find(p => p.id === currentSharePostId);
    const url = `${window.location.origin}/hubisoccer/hubisapp/shared/community/post-view.html?id=${currentSharePostId}`;
    const text = post?.content?.substring(0, 100) || '';
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
    if (network === 'copy') { navigator.clipboard.writeText(url); toast('Lien copié !', 'success'); }
    else window.open(shareUrls[network], '_blank');
    closeModal('modalShare');
    sb.from('supabaseAuthPrive_posts').update({ shares_count: (post.shares_count || 0) + 1 }).eq('id', currentSharePostId);
}
// Fin partage / signalement / masquage

// Début stories
async function loadStories() {
    const { data: follows } = await sb.from('supabaseAuthPrive_follows').select('following_hubisoccer_id').eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const ids = (follows || []).map(f => f.following_hubisoccer_id);
    ids.push(currentProfile.hubisoccer_id);

    const { data, error } = await sb.from('supabaseAuthPrive_stories')
        .select('*, author:user_hubisoccer_id(full_name, display_name, avatar_url, feed_id)')
        .in('user_hubisoccer_id', ids)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error || !data) return;

    const groups = {};
    data.forEach(s => {
        if (!groups[s.user_hubisoccer_id]) groups[s.user_hubisoccer_id] = { profile: s.author, stories: [] };
        groups[s.user_hubisoccer_id].stories.push(s);
    });
    storyGroups = Object.values(groups);

    const strip = document.getElementById('storiesContainer');
    strip.innerHTML = storyGroups.map((g, i) => `
        <div class="story-item" onclick="openStory(${i})">
            <div class="story-ring">
                ${g.profile?.avatar_url ? `<img src="${g.profile.avatar_url}">` : `<div class="avatar-initials">${getInitials(g.profile?.full_name || '?')}</div>`}
            </div>
            <span>${escapeHtml(g.profile?.full_name?.split(' ')[0] || '...')}</span>
        </div>
    `).join('');
}

function openStory(groupIdx) {
    currentStoryGroupIdx = groupIdx;
    currentStoryIdx = 0;
    document.getElementById('storyModal').classList.add('show');
    renderCurrentStory();
}

function renderCurrentStory() {
    const group = storyGroups[currentStoryGroupIdx];
    if (!group) { closeStory(); return; }
    const story = group.stories[currentStoryIdx];
    if (!story) { closeStory(); return; }

    document.getElementById('storyProgressBars').innerHTML = group.stories.map((_, i) => `
        <div class="story-prog-bar"><div class="story-prog-fill" id="progFill_${i}" style="width:${i < currentStoryIdx ? '100%' : '0%'}"></div></div>
    `).join('');

    const author = group.profile || {};
    document.getElementById('storyAuthor').innerHTML = `
        <div class="story-author-info">
            ${author.avatar_url ? `<img src="${author.avatar_url}">` : `<div class="avatar-initials">${getInitials(author.full_name || '?')}</div>`}
            <div>
                <div class="story-author-name">${escapeHtml(author.full_name || author.display_name || '')}</div>
                <div class="story-author-time">${timeSince(story.created_at)}</div>
            </div>
        </div>
    `;

    const mediaEl = document.getElementById('storyMedia');
    if (story.media_type === 'video') {
        mediaEl.innerHTML = `<video src="${story.media_url}" autoplay muted loop></video>`;
    } else {
        mediaEl.innerHTML = `<img src="${story.media_url}" alt="">`;
    }
    if (story.caption) {
        mediaEl.innerHTML += `<div class="story-caption">${escapeHtml(story.caption)}</div>`;
    }

    clearInterval(storyTimer);
    const dur = (story.duration || 10) * 1000;
    const fill = document.getElementById(`progFill_${currentStoryIdx}`);
    if (fill) fill.style.transition = `width ${dur}ms linear`;
    setTimeout(() => { if (fill) fill.style.width = '100%'; }, 50);

    storyTimer = setInterval(() => { nextStory(); }, dur);
}

function nextStory() {
    clearInterval(storyTimer);
    const group = storyGroups[currentStoryGroupIdx];
    if (currentStoryIdx < (group?.stories.length || 1) - 1) {
        currentStoryIdx++;
        renderCurrentStory();
    } else if (currentStoryGroupIdx < storyGroups.length - 1) {
        currentStoryGroupIdx++;
        currentStoryIdx = 0;
        renderCurrentStory();
    } else {
        closeStory();
    }
}

function prevStory() {
    clearInterval(storyTimer);
    if (currentStoryIdx > 0) {
        currentStoryIdx--;
    } else if (currentStoryGroupIdx > 0) {
        currentStoryGroupIdx--;
        currentStoryIdx = storyGroups[currentStoryGroupIdx].stories.length - 1;
    }
    renderCurrentStory();
}

function closeStory() {
    clearInterval(storyTimer);
    document.getElementById('storyModal').classList.remove('show');
}

async function uploadStory() {
    const file = document.getElementById('storyFileInput').files[0];
    const caption = document.getElementById('storyCaption').value.trim();
    const dur = parseInt(document.getElementById('storyDuration').value) || 10;
    if (!file) { toast('Sélectionne un fichier', 'warning'); return; }
    if (file.size > 50 * 1024 * 1024) { toast('Fichier trop volumineux (max 50 Mo)', 'warning'); return; }

    const btn = document.getElementById('uploadStoryBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const ext = file.name.split('.').pop();
        const path = `stories/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from('story_media').upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from('story_media').getPublicUrl(path);

        const expires = new Date(); expires.setHours(expires.getHours() + 24);
        await sb.from('supabaseAuthPrive_stories').insert({
            user_hubisoccer_id: currentProfile.hubisoccer_id,
            media_url: urlData.publicUrl,
            media_type: file.type.startsWith('video/') ? 'video' : 'image',
            caption: caption || null, duration: dur,
            expires_at: expires.toISOString()
        });
        closeModal('modalStoryUpload');
        await loadStories();
        toast('Story publiée !', 'success');
    } catch (err) {
        toast('Erreur upload story : ' + err.message, 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload"></i> Publier la story';
    }
}
// Fin stories

// Début sidebar droite (suggestions, followers, lives, trends, insights)
async function loadSuggestions() {
    const { data: follows } = await sb.from('supabaseAuthPrive_follows').select('following_hubisoccer_id').eq('follower_hubisoccer_id', currentProfile.hubisoccer_id);
    const followingIds = (follows || []).map(f => f.following_hubisoccer_id);
    followingIds.push(currentProfile.hubisoccer_id);

    const { data } = await sb.from('supabaseAuthPrive_communities')
        .select('hubisoccer_id, name, feed_id, avatar_url, profiles:hubisoccer_id(full_name, display_name, role_code)')
        .not('hubisoccer_id', 'in', `(${followingIds.join(',')})`)
        .limit(5);

    const list = document.getElementById('suggestionsList');
    if (!data || data.length === 0) { list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray)">Aucune suggestion</p>'; return; }
    list.innerHTML = data.map(c => {
        const prof = c.profiles || {};
        return `<div class="suggestion-item">
            <div class="suggestion-avatar">${c.avatar_url ? `<img src="${c.avatar_url}">` : `<div class="avatar-initials">${getInitials(c.name || prof.full_name || '?')}</div>`}</div>
            <div class="suggestion-info">
                <div class="suggestion-name">${escapeHtml(c.name || prof.full_name || prof.display_name || 'Utilisateur')}</div>
                <div class="suggestion-role">${escapeHtml(prof.role_code || '')}</div>
            </div>
            <button class="suggestion-follow-btn" data-uid="${c.hubisoccer_id}" onclick="followUser('${c.hubisoccer_id}', this)"><i class="fas fa-user-plus"></i></button>
        </div>`;
    }).join('');
}

async function followUser(userId, btn) {
    const { data: existing } = await sb.from('supabaseAuthPrive_follows').select('id').eq('follower_hubisoccer_id', currentProfile.hubisoccer_id).eq('following_hubisoccer_id', userId).maybeSingle();
    if (existing) {
        await sb.from('supabaseAuthPrive_follows').delete().eq('id', existing.id);
        btn.innerHTML = '<i class="fas fa-user-plus"></i>';
        toast('Vous ne suivez plus cet utilisateur', 'info');
    } else {
        await sb.from('supabaseAuthPrive_follows').insert({ follower_hubisoccer_id: currentProfile.hubisoccer_id, following_hubisoccer_id: userId });
        btn.innerHTML = '<i class="fas fa-user-check"></i>';
        toast('Abonné !', 'success');
        await sb.from('supabaseAuthPrive_notifications').insert({ recipient_hubisoccer_id: userId, title: 'Nouvel abonné', message: `${currentProfile.full_name} s'est abonné à votre communauté.`, type: 'follow' });
    }
    loadSuggestions();
}

async function loadFollowers() {
    const { data } = await sb.from('supabaseAuthPrive_follows')
        .select('follower_hubisoccer_id, profiles:follower_hubisoccer_id(full_name, display_name, avatar_url, feed_id)')
        .eq('following_hubisoccer_id', currentProfile.hubisoccer_id).limit(6);
    const list = document.getElementById('followersList');
    if (!data || data.length === 0) { list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray)">Pas encore d\'abonnés</p>'; return; }
    list.innerHTML = data.map(f => {
        const p = f.profiles || {};
        return `<div class="follower-item" onclick="openUserProfile('${f.follower_hubisoccer_id}')">
            ${p.avatar_url ? `<img src="${p.avatar_url}">` : `<div class="avatar-initials">${getInitials(p.full_name || '?')}</div>`}
            <span class="follower-name">${escapeHtml(p.full_name || p.display_name || 'Utilisateur')}</span>
        </div>`;
    }).join('');
}

async function loadLives() {
    const { data } = await sb.from('supabaseAuthPrive_live_sessions')
        .select('*, host:host_hubisoccer_id(full_name, display_name, avatar_url)')
        .eq('is_active', true).order('started_at', { ascending: false }).limit(4);
    const list = document.getElementById('livesList');
    if (!data || data.length === 0) { list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray)">Aucun live en ce moment</p>'; return; }
    list.innerHTML = data.map(l => {
        const h = l.host || {};
        return `<div class="live-sidebar-item" onclick="window.location.href='live.html?room=${l.id}'">
            ${h.avatar_url ? `<img src="${h.avatar_url}">` : `<div class="avatar-initials">${getInitials(h.full_name || '?')}</div>`}
            <div class="live-info-small">
                <div class="live-name">${escapeHtml(l.title || h.full_name || 'Live')}</div>
                <div class="live-viewers"><i class="fas fa-eye"></i> ${l.viewers_count || 0} spectateurs</div>
            </div>
            <div class="live-dot"></div>
        </div>`;
    }).join('');
}

async function loadTrends() {
    const { data } = await sb.from('supabaseAuthPrive_posts')
        .select('content')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .not('content', 'is', null).limit(100);
    const tags = {};
    (data || []).forEach(p => {
        const matches = p.content?.match(/#(\w+)/g) || [];
        matches.forEach(t => { const tag = t.toLowerCase(); tags[tag] = (tags[tag] || 0) + 1; });
    });
    const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const list = document.getElementById('trendsList');
    if (!sorted.length) { list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray)">Aucune tendance</p>'; return; }
    list.innerHTML = sorted.map(([tag, count]) => `
        <div class="trend-item" onclick="searchByHashtag('${tag.slice(1)}')">
            <span class="trend-tag">${tag}</span>
            <span class="trend-count">${count} posts</span>
        </div>
    `).join('');
}

function searchByHashtag(tag) {
    document.getElementById('feedSearch').value = '#' + tag;
    searchQuery = '#' + tag;
    loadPosts(true);
}
function openUserByHandle(handle) { /* TODO: rechercher par handle */ }

async function loadInsights() {
    // À implémenter plus tard avec les vraies données
    document.getElementById('insightReach').textContent = '—';
    document.getElementById('insightNewFollowers').textContent = '—';
    document.getElementById('insightEngagement').textContent = '—';
}
// Fin sidebar droite

// Début publication (création)
async function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaFile && !pendingPoll && !pendingEvent) { toast('Écrivez quelque chose', 'warning'); return; }

    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';
    try {
        let mediaUrl = null, mediaType = null;
        if (mediaFile) {
            const ext = mediaFile.name.split('.').pop();
            const path = `posts/${currentProfile.hubisoccer_id}/${Date.now()}.${ext}`;
            const { error: upErr } = await sb.storage.from('post_media').upload(path, mediaFile);
            if (upErr) throw upErr;
            const { data: urlData } = sb.storage.from('post_media').getPublicUrl(path);
            mediaUrl = urlData.publicUrl;
            mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
            mediaFile = null;
            document.getElementById('mediaPreview').style.display = 'none';
        }

        const postData = {
            author_hubisoccer_id: currentProfile.hubisoccer_id,
            community_id: myCommunity?.id || null,
            content: content || null,
            media_url: mediaUrl, media_type: mediaType,
            poll_data: pendingPoll, event_data: pendingEvent,
            is_pinned: pinPostActive,
            is_scheduled: !!scheduledAt, scheduled_at: scheduledAt,
            likes_count: 0, dislikes_count: 0, comments_count: 0, shares_count: 0, reposts_count: 0
        };

        const { data: newPost, error } = await sb.from('supabaseAuthPrive_posts').insert(postData).select('*, author:author_hubisoccer_id(full_name, display_name, feed_id, certified, avatar_url, role_code)').single();
        if (error) throw error;

        document.getElementById('postContent').value = '';
        pendingPoll = null; pendingEvent = null; scheduledAt = null; pinPostActive = false;
        if (!scheduledAt) { posts.unshift(newPost); renderPosts(); toast('Publication réussie !', 'success'); }
        else { toast('Publication programmée', 'success'); }
        await sb.from('supabaseAuthPrive_communities').update({ posts_count: (myCommunity.posts_count || 0) + 1 }).eq('id', myCommunity.id);
    } catch (err) {
        toast('Erreur publication : ' + err.message, 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
    }
}

function createPoll() {
    const q = document.getElementById('pollQuestion').value.trim();
    const opts = document.getElementById('pollOptions').value.trim().split('\n').map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) { toast('Question et au moins 2 options requises', 'warning'); return; }
    const dur = parseInt(document.getElementById('pollDuration').value) || 3;
    pendingPoll = { question: q, options: opts, votes: {}, voted_by: [], ends_at: new Date(Date.now() + dur * 86400000).toISOString() };
    closeModal('modalPoll');
    toast('Sondage prêt. Publie maintenant !', 'success');
}

function createEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    if (!title || !date) { toast('Titre et date requis', 'warning'); return; }
    pendingEvent = { title, date, location: document.getElementById('eventLocation').value.trim(), description: document.getElementById('eventDesc').value.trim() };
    closeModal('modalEvent');
    toast('Événement prêt. Publie maintenant !', 'success');
}

function confirmSchedule() {
    const dt = document.getElementById('scheduleDateTime').value;
    if (!dt) { toast('Sélectionne une date', 'warning'); return; }
    scheduledAt = new Date(dt).toISOString();
    closeModal('modalSchedule');
    toast(`Publication programmée pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`, 'success');
}

function showPreview() {
    const content = document.getElementById('postContent').value.trim();
    const previewBody = document.getElementById('previewBody');
    const author = currentProfile;
    previewBody.innerHTML = `
        <div class="post-card" style="box-shadow:none;border:none">
            <div class="post-header">
                <div class="post-avatar">${getInitials(author.full_name||'?')}</div>
                <div class="post-meta">
                    <div class="post-author">${escapeHtml(author.full_name||author.display_name||'Utilisateur')}</div>
                    <div class="post-author-sub">À l'instant</div>
                </div>
            </div>
            <div class="post-body"><div class="post-text">${formatText(content)}</div></div>
        </div>`;
    openModal('modalPreview');
}

function openMediaZoom(url, type) {
    const viewer = document.getElementById('mediaViewer');
    viewer.innerHTML = type === 'video' ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}" alt="">`;
    openModal('modalMedia');
}
// Fin publication

// Début temps réel
function subscribeToNewPosts() {
    feedSubscription = sb.channel('feed_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'supabaseAuthPrive_posts' }, payload => {
            if (payload.new.author_hubisoccer_id === currentProfile.hubisoccer_id) return;
            newPostsCount++;
            document.getElementById('newPostsBar').style.display = 'block';
            document.getElementById('newPostsCount').textContent = newPostsCount;
        })
        .subscribe();
}
// Fin temps réel

// Début logout
async function logout() {
    await sb.auth.signOut();
    window.location.href = '../../authprive/users/login.html';
}
// Fin logout

// Début initialisation
async function init() {
    if (!await checkSession()) return;
    await loadProfile();
    if (!await loadMyCommunity()) return;
    await loadLikedAndSaved();
    await loadPosts(true);
    loadStories();
    loadSuggestions();
    loadFollowers();
    loadLives();
    loadTrends();
    loadInsights();
    subscribeToNewPosts();

    // Event listeners
    document.getElementById('publishBtn').addEventListener('click', publishPost);
    document.getElementById('attachMediaBtn').addEventListener('click', () => document.getElementById('mediaInput').click());
    document.getElementById('mediaInput').addEventListener('change', e => {
        mediaFile = e.target.files[0];
        if (mediaFile) {
            const url = URL.createObjectURL(mediaFile);
            document.getElementById('mediaPreview').style.display = 'block';
            document.getElementById('mediaPreview').innerHTML = `<img src="${url}" style="max-height:200px"> <button onclick="cancelMedia()"><i class="fas fa-times"></i></button>`;
        }
    });
    document.getElementById('pollBtn').addEventListener('click', () => openModal('modalPoll'));
    document.getElementById('eventBtn').addEventListener('click', () => openModal('modalEvent'));
    document.getElementById('scheduleBtn').addEventListener('click', () => openModal('modalSchedule'));
    document.getElementById('previewPostBtn').addEventListener('click', showPreview);
    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('createEventBtn').addEventListener('click', createEvent);
    document.getElementById('confirmScheduleBtn').addEventListener('click', confirmSchedule);
    document.getElementById('submitReportBtn').addEventListener('click', submitReport);
    document.querySelectorAll('.share-btn').forEach(b => b.addEventListener('click', () => sharePost(b.dataset.network)));
    document.getElementById('loadMoreBtn').addEventListener('click', () => loadPosts(false));
    document.getElementById('feedSearch').addEventListener('input', e => {
        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(() => { searchQuery = e.target.value; loadPosts(true); }, 500);
    });
    document.querySelectorAll('.feed-filter-btn').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        loadPosts(true);
    }));
    document.querySelectorAll('.role-chip').forEach(chip => chip.addEventListener('click', () => {
        document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeRoleFilter = chip.dataset.role;
        loadPosts(true);
    }));
    document.getElementById('newPostsBarBtn').addEventListener('click', () => {
        newPostsCount = 0;
        document.getElementById('newPostsBar').style.display = 'none';
        loadPosts(true);
    });
    document.getElementById('addStoryBtn').addEventListener('click', () => openModal('modalStoryUpload'));
    document.getElementById('uploadStoryBtn').addEventListener('click', uploadStory);
    document.getElementById('storyCloseBtn').addEventListener('click', closeStory);
    document.getElementById('storyPrev').addEventListener('click', prevStory);
    document.getElementById('storyNext').addEventListener('click', nextStory);
    document.getElementById('refreshSuggestions').addEventListener('click', loadSuggestions);
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    });
    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('leftSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    });
    document.getElementById('userMenu').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => document.getElementById('userDropdown')?.classList.remove('show'));
    document.getElementById('dropLogout').addEventListener('click', logout);
    document.getElementById('rightSidebarToggle').addEventListener('click', () => {
        const rs = document.getElementById('rightSidebar');
        rs.style.display = rs.style.display === 'none' ? 'block' : 'none';
    });
    window.addEventListener('click', e => { if (e.target.classList.contains('c-modal')) closeModal(e.target.id); });
    setLoader(false);
}
// Fin initialisation

// Exposer fonctions globales
window.toggleLike = toggleLike;
window.toggleSave = toggleSave;
window.toggleComments = toggleComments;
window.repost = repost;
window.deletePost = deletePost;
window.editPost = editPost;
window.togglePostMenu = togglePostMenu;
window.openShareModal = openShareModal;
window.openReportModal = openReportModal;
window.hidePost = hidePost;
window.votePoll = votePoll;
window.likeComment = likeComment;
window.deleteComment = deleteComment;
window.openReplyModal = openReplyModal;
window.sendReply = sendReply;
window.openStory = openStory;
window.followUser = followUser;
window.searchByHashtag = searchByHashtag;
window.openMediaZoom = openMediaZoom;
window.cancelMedia = function() { mediaFile = null; document.getElementById('mediaInput').value = ''; document.getElementById('mediaPreview').style.display = 'none'; };

document.addEventListener('DOMContentLoaded', init);
