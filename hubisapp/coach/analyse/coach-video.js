/* ============================================================
   HubISoccer — coach-video.js
   Page Analyse Vidéo · Espace Coach
   ------------------------------------------------------------
   Convention tables : supabaseAuthPrive_[espace]_[page]
   - supabaseAuthPrive_profiles       → table PARTAGÉE (lecture)
   - supabaseAuthPrive_coach_talents  → page Mes Talents (lecture)
   - supabaseAuthPrive_coach_video    → table de CETTE page
     (SQL : coach-video-table.sql, sans RLS)
   ------------------------------------------------------------
   Workflow :
   1. Le coach ajoute une vidéo (talent + titre + lien) → 'a_analyser'
   2. Bouton "Analyser" → atelier : lecteur intégré (YouTube)
      + annotations horodatées Corps/Âme/Esprit + conclusion
   3. "Enregistrer l'analyse" → statut 'analysee'
      (+ certification facultative "Validée par le coach")
   Les annotations sont stockées en JSONB :
   [{ temps: "0:34", categorie: "esprit", texte: "..." }]
   ============================================================ */
'use strict';

/* ---------- 1. SUPABASE ---------- */
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;

/* ---------- 2. TABLES ---------- */
const PROFILES_TABLE = 'supabaseAuthPrive_profiles';        // partagée
const TALENTS_TABLE  = 'supabaseAuthPrive_coach_talents';   // page Mes Talents (lecture)
const VIDEO_TABLE    = 'supabaseAuthPrive_coach_video';     // cette page

/* ---------- 3. ÉTAT GLOBAL ---------- */
let currentUser     = null;
let coachProfile    = null;
let mesTalents      = [];      // liaisons acceptées (sélecteur)
let allVideos       = [];      // toutes les vidéos du coach
let currentVideoId  = null;    // vidéo ouverte dans l'atelier
let wsAnnotations   = [];      // annotations en cours d'édition (mémoire)
let currentFilter   = 'all';   // all | sportif | artiste | certifiee

/* ---------- 4. LOADER ---------- */
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'flex';
    }
}

function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) {
        l.style.display = 'none';
    }
}

/* ---------- 5. TOAST (durée 30 secondes) ---------- */
function showToast(message, type, duration) {
    if (!type) {
        type = 'info';
    }
    if (!duration) {
        duration = 30000;
    }
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success : 'fa-check-circle',
        error   : 'fa-exclamation-circle',
        warning : 'fa-exclamation-triangle',
        info    : 'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
                  '<div class="toast-content">' + message + '</div>' +
                  '<button class="toast-close"><i class="fas fa-times"></i></button>';
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', function() {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(function() {
            if (t.parentNode) {
                t.remove();
            }
        }, 320);
    });
    setTimeout(function() {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(function() {
                if (t.parentNode) {
                    t.remove();
                }
            }, 320);
        }
    }, duration);
}

/* ---------- 6. UTILITAIRES ---------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (value !== null && value !== undefined) {
            el.textContent = value;
        } else {
            el.textContent = '—';
        }
    }
}

function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function escapeHtml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateFr(iso) {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

/* ---------- 7. YOUTUBE : EXTRACTION D'ID ----------
   Gère les formats : watch?v=, youtu.be/, /embed/, /shorts/    */
function extraireYouTubeId(url) {
    if (!url) {
        return null;
    }
    const regex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = String(url).match(regex);
    return match ? match[1] : null;
}

/* ---------- 8. SESSION ---------- */
async function checkSession() {
    showLoader();
    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    hideLoader();
    if (!session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}

/* ---------- 9. CHARGEMENT PROFIL COACH ---------- */
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from(PROFILES_TABLE)
        .select('*')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();
    if (error) {
        showToast('Erreur chargement du profil', 'error');
        return null;
    }
    coachProfile = data;
    setText('userName', coachProfile.full_name || 'Coach / Entraîneur');
    updateNavbarAvatar();
    return coachProfile;
}

function updateNavbarAvatar() {
    const ui = document.getElementById('userAvatar');
    const un = document.getElementById('userAvatarInitials');
    const url = coachProfile?.avatar_url;
    if (url && url !== '') {
        if (ui) { ui.src = url; ui.style.display = 'block'; }
        if (un) { un.style.display = 'none'; }
    } else {
        const init = getInitials(coachProfile?.full_name || 'C');
        if (un) { un.textContent = init; un.style.display = 'flex'; }
        if (ui) { ui.style.display = 'none'; }
    }
}

/* ---------- 10. CHARGEMENT DES TALENTS (sélecteur) ---------- */
async function loadMesTalents() {
    if (!coachProfile) {
        return;
    }
    const { data, error } = await supabaseClient
        .from(TALENTS_TABLE)
        .select('talent_id, talent_nom, talent_type, talent_role')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .eq('statut', 'accepted')
        .order('talent_nom', { ascending: true });

    if (error) {
        console.warn('⚠️ Table ' + TALENTS_TABLE + ' :', error.message);
        mesTalents = [];
    } else {
        mesTalents = data || [];
    }

    const select = document.getElementById('videoTalent');
    const hint   = document.getElementById('noTalentHint');
    if (!select) {
        return;
    }
    while (select.options.length > 1) {
        select.remove(1);
    }
    mesTalents.forEach(function(t) {
        const opt = document.createElement('option');
        opt.value = t.talent_id;
        opt.textContent = (t.talent_nom || t.talent_id) +
                          (t.talent_type === 'artiste' ? ' 🎵' : ' ⚽');
        opt.dataset.nom  = t.talent_nom || '';
        opt.dataset.type = t.talent_type || 'sportif';
        select.appendChild(opt);
    });
    if (hint) {
        hint.style.display = (mesTalents.length === 0) ? 'block' : 'none';
    }
}

/* ---------- 11. CHARGEMENT DES VIDÉOS ---------- */
async function loadVideos() {
    if (!coachProfile) {
        return;
    }
    showLoader();
    const { data, error } = await supabaseClient
        .from(VIDEO_TABLE)
        .select('*')
        .eq('coach_id', coachProfile.hubisoccer_id)
        .order('created_at', { ascending: false });
    hideLoader();
    if (error) {
        console.warn('⚠️ Table ' + VIDEO_TABLE + ' :', error.message);
        showToast('Table des vidéos absente. Exécutez le script SQL <b>coach-video-table.sql</b> dans Supabase.', 'warning');
        allVideos = [];
        return;
    }
    allVideos = data || [];

    /* Sécuriser le champ annotations (toujours un tableau) */
    allVideos.forEach(function(v) {
        if (!Array.isArray(v.annotations)) {
            v.annotations = [];
        }
    });

    updateStats();
    renderTodo();
    renderDone();
}

/* ---------- 12. STATS RAPIDES ---------- */
function updateStats() {
    const aAnalyser  = allVideos.filter(function(v) { return v.statut === 'a_analyser'; });
    const analysees  = allVideos.filter(function(v) { return v.statut === 'analysee'; });
    const certifiees = analysees.filter(function(v) { return v.certifiee === true; });

    let totalAnnots = 0;
    allVideos.forEach(function(v) {
        totalAnnots += v.annotations.length;
    });

    setText('statAAnalyser',   aAnalyser.length);
    setText('statAnalysees',   analysees.length);
    setText('statCertifiees',  certifiees.length);
    setText('statAnnotations', totalAnnots);

    /* Badge de notification = vidéos en attente d'analyse */
    setText('notifBadge', aAnalyser.length);
}

/* ---------- 13. AJOUT D'UNE VIDÉO ---------- */
async function ajouterVideo() {
    const select = document.getElementById('videoTalent');
    const talentId = select ? select.value : '';
    if (!talentId) {
        showToast('Sélectionnez le talent concerné par la vidéo.', 'warning');
        return;
    }
    const titre = (document.getElementById('videoTitre')?.value || '').trim();
    if (!titre) {
        showToast('Donnez un titre à la vidéo.', 'warning');
        return;
    }
    const url = (document.getElementById('videoUrl')?.value || '').trim();
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        showToast('Collez un lien valide commençant par https://', 'warning');
        return;
    }

    const opt = select.options[select.selectedIndex];
    const payload = {
        coach_id    : coachProfile.hubisoccer_id,
        talent_id   : talentId,
        talent_nom  : opt.dataset.nom || opt.textContent,
        talent_type : opt.dataset.type || 'sportif',
        titre       : titre,
        video_url   : url,
        statut      : 'a_analyser',
        annotations : [],
        certifiee   : false
    };

    showLoader();
    const { error } = await supabaseClient
        .from(VIDEO_TABLE)
        .insert([payload]);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    /* Réinitialiser le formulaire */
    document.getElementById('videoTitre').value = '';
    document.getElementById('videoUrl').value   = '';
    select.selectedIndex = 0;

    showToast('Vidéo ajoutée à votre liste d\'analyse. 🎬', 'success');
    await loadVideos();
}

/* ---------- 14. CONSTRUCTION D'UNE CARTE VIDÉO ---------- */
function buildVideoCard(v) {
    const ytId = extraireYouTubeId(v.video_url);
    const card = document.createElement('div');
    card.className = 'video-card';

    /* Miniature : YouTube si possible, sinon dégradé + icône film */
    let thumbHtml;
    if (ytId) {
        thumbHtml =
            '<img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="Miniature" loading="lazy">' +
            '<div class="play-overlay"><i class="fas fa-play-circle"></i></div>';
    } else {
        thumbHtml = '<i class="fas fa-film thumb-placeholder"></i>';
    }

    const ribbon = (v.certifiee === true)
        ? '<span class="certif-ribbon"><i class="fas fa-certificate"></i> Certifiée coach</span>'
        : '';

    const nbAnnots = v.annotations.length;

    card.innerHTML =
        '<div class="video-thumb">' + thumbHtml + ribbon + '</div>' +
        '<div class="video-body">' +
            '<div class="video-titre">' + escapeHtml(v.titre) + '</div>' +
            '<div class="video-meta">' +
                '<span><i class="fas fa-user"></i> ' + escapeHtml(v.talent_nom || v.talent_id || '—') + '</span>' +
                '<span>' + (v.talent_type === 'artiste' ? '🎵 Artiste' : '⚽ Sportif') + '</span>' +
                '<span><i class="fas fa-calendar"></i> ' + formatDateFr(v.created_at) + '</span>' +
            '</div>' +
            (nbAnnots > 0
                ? '<span class="annot-count"><i class="fas fa-comment-dots"></i> ' + nbAnnots + ' annotation(s)</span>'
                : '') +
            '<div class="video-actions">' +
                '<button class="btn-analyse" data-id="' + v.id + '">' +
                    '<i class="fas fa-microscope"></i> ' +
                    (v.statut === 'a_analyser' ? 'Analyser' : 'Rouvrir l\'analyse') +
                '</button>' +
                '<button class="btn-delete" data-id="' + v.id + '"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
        '</div>';

    return card;
}

/* ---------- 15. RENDU : VIDÉOS À ANALYSER ---------- */
function renderTodo() {
    const grid  = document.getElementById('todoList');
    const empty = document.getElementById('todoEmpty');
    if (!grid) {
        return;
    }
    const todo = allVideos.filter(function(v) { return v.statut === 'a_analyser'; });

    grid.querySelectorAll('.video-card').forEach(function(c) { c.remove(); });

    if (todo.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    todo.forEach(function(v) {
        grid.appendChild(buildVideoCard(v));
    });
    attachCardListeners(grid);
}

/* ---------- 16. RENDU : VIDÉOS ANALYSÉES ---------- */
function renderDone() {
    const grid  = document.getElementById('doneList');
    const empty = document.getElementById('doneEmpty');
    if (!grid) {
        return;
    }
    let done = allVideos.filter(function(v) { return v.statut === 'analysee'; });

    if (currentFilter === 'sportif' || currentFilter === 'artiste') {
        done = done.filter(function(v) { return v.talent_type === currentFilter; });
    } else if (currentFilter === 'certifiee') {
        done = done.filter(function(v) { return v.certifiee === true; });
    }

    grid.querySelectorAll('.video-card').forEach(function(c) { c.remove(); });

    if (done.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    done.forEach(function(v) {
        grid.appendChild(buildVideoCard(v));
    });
    attachCardListeners(grid);
}

/* ---------- 17. ÉCOUTEURS DES CARTES ---------- */
function attachCardListeners(container) {
    container.querySelectorAll('.btn-analyse').forEach(function(btn) {
        btn.addEventListener('click', function() {
            ouvrirAtelier(btn.dataset.id);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            supprimerVideo(btn.dataset.id);
        });
    });
}

/* ---------- 18. OUVRIR L'ATELIER D'ANALYSE ---------- */
function ouvrirAtelier(videoId) {
    const v = allVideos.find(function(x) { return String(x.id) === String(videoId); });
    if (!v) {
        return;
    }
    currentVideoId = v.id;
    /* Copie de travail des annotations (rien n'est écrit tant qu'on n'enregistre pas) */
    wsAnnotations = JSON.parse(JSON.stringify(v.annotations || []));

    setText('wsTitre', v.titre);
    setText('wsTalent',
        (v.talent_type === 'artiste' ? '🎵 ' : '⚽ ') +
        (v.talent_nom || v.talent_id || '—') +
        ' · ajoutée le ' + formatDateFr(v.created_at));

    /* Lecteur : iframe YouTube si possible, sinon lien externe */
    const box  = document.getElementById('wsPlayerBox');
    const ytId = extraireYouTubeId(v.video_url);
    if (box) {
        if (ytId) {
            box.innerHTML =
                '<iframe src="https://www.youtube.com/embed/' + ytId + '" ' +
                'title="Lecteur vidéo" allow="accelerometer; autoplay; clipboard-write; ' +
                'encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        } else {
            box.innerHTML =
                '<div class="player-external">' +
                    '<i class="fas fa-external-link-alt"></i>' +
                    '<p>Cette vidéo n\'est pas hébergée sur YouTube.<br>Ouvrez-la dans un autre onglet pour l\'analyser.</p>' +
                    '<a href="' + escapeHtml(v.video_url) + '" target="_blank" rel="noopener noreferrer">' +
                        '<i class="fas fa-play"></i> Ouvrir la vidéo' +
                    '</a>' +
                '</div>';
        }
    }

    document.getElementById('wsConclusion').value  = v.conclusion || '';
    document.getElementById('wsCertifiee').checked = (v.certifiee === true);

    renderAnnotations();

    const ws = document.getElementById('workspace');
    if (ws) {
        ws.style.display = 'block';
        ws.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ---------- 19. FERMER L'ATELIER ---------- */
function fermerAtelier() {
    currentVideoId = null;
    wsAnnotations  = [];
    const ws  = document.getElementById('workspace');
    const box = document.getElementById('wsPlayerBox');
    if (box) { box.innerHTML = ''; }   /* stoppe la lecture YouTube */
    if (ws)  { ws.style.display = 'none'; }
}

/* ---------- 20. RENDU DES ANNOTATIONS (mémoire) ---------- */
function renderAnnotations() {
    const list  = document.getElementById('annotList');
    const empty = document.getElementById('annotEmpty');
    if (!list) {
        return;
    }
    list.querySelectorAll('.annot-item').forEach(function(a) { a.remove(); });

    if (wsAnnotations.length === 0) {
        if (empty) { empty.style.display = 'flex'; }
        return;
    }
    if (empty) { empty.style.display = 'none'; }

    wsAnnotations.forEach(function(a, index) {
        const cat  = (a.categorie === 'corps' || a.categorie === 'ame') ? a.categorie : 'esprit';
        const item = document.createElement('div');
        item.className = 'annot-item ' + cat;
        item.innerHTML =
            '<span class="annot-time">' + escapeHtml(a.temps || '—') + '</span>' +
            '<span class="annot-body">' + escapeHtml(a.texte || '') + '</span>' +
            '<button class="btn-annot-del" data-index="' + index + '" title="Supprimer">' +
                '<i class="fas fa-times"></i>' +
            '</button>';
        list.appendChild(item);
    });

    list.querySelectorAll('.btn-annot-del').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const idx = parseInt(btn.dataset.index, 10);
            wsAnnotations.splice(idx, 1);
            renderAnnotations();
        });
    });
}

/* ---------- 21. AJOUTER UNE ANNOTATION ---------- */
function ajouterAnnotation() {
    const tempsInput = document.getElementById('annotTemps');
    const catSelect  = document.getElementById('annotCat');
    const texteInput = document.getElementById('annotTexte');

    const temps = (tempsInput?.value || '').trim();
    const texte = (texteInput?.value || '').trim();
    const cat   = catSelect ? catSelect.value : 'esprit';

    if (!texte) {
        showToast('Écrivez le texte de l\'annotation.', 'warning');
        return;
    }
    /* Validation légère du temps : m:ss / mm:ss / h:mm:ss (facultatif) */
    if (temps && !/^\d{1,2}(:\d{2}){1,2}$/.test(temps)) {
        showToast('Format du temps invalide. Utilisez mm:ss (ex : 0:34 ou 12:05).', 'warning');
        return;
    }

    wsAnnotations.push({
        temps     : temps || '—',
        categorie : cat,
        texte     : texte
    });

    /* Trier par temps croissant quand c'est possible */
    wsAnnotations.sort(function(a, b) {
        return tempsEnSecondes(a.temps) - tempsEnSecondes(b.temps);
    });

    if (tempsInput) { tempsInput.value = ''; }
    if (texteInput) { texteInput.value = ''; }
    renderAnnotations();
}

/* "12:05" → 725 secondes ; valeurs non parsables → très grand (fin de liste) */
function tempsEnSecondes(t) {
    if (!t || !/^\d{1,2}(:\d{2}){1,2}$/.test(t)) {
        return 999999;
    }
    const parts = t.split(':').map(function(x) { return parseInt(x, 10); });
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parts[0] * 60 + parts[1];
}

/* ---------- 22. ENREGISTRER L'ANALYSE ---------- */
async function enregistrerAnalyse() {
    if (!currentVideoId) {
        return;
    }
    const conclusion = (document.getElementById('wsConclusion')?.value || '').trim() || null;
    const certifiee  = document.getElementById('wsCertifiee')?.checked === true;

    showLoader();
    const { error } = await supabaseClient
        .from(VIDEO_TABLE)
        .update({
            annotations : wsAnnotations,
            conclusion  : conclusion,
            certifiee   : certifiee,
            statut      : 'analysee'
        })
        .eq('id', currentVideoId);
    hideLoader();

    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }

    if (certifiee) {
        showToast('Analyse enregistrée et vidéo CERTIFIÉE. 🏅 Elle gagne en valeur scouting !', 'success');
    } else {
        showToast('Analyse enregistrée. 🎬', 'success');
    }

    fermerAtelier();
    await loadVideos();
}

/* ---------- 23. SUPPRIMER UNE VIDÉO ---------- */
async function supprimerVideo(videoId) {
    const v = allVideos.find(function(x) { return String(x.id) === String(videoId); });
    const titre = v ? v.titre : 'cette vidéo';
    if (!confirm('Supprimer « ' + titre + ' » et toutes ses annotations ?')) {
        return;
    }
    showLoader();
    const { error } = await supabaseClient
        .from(VIDEO_TABLE)
        .delete()
        .eq('id', videoId);
    hideLoader();
    if (error) {
        showToast('Erreur : ' + error.message, 'error');
        return;
    }
    /* Si l'atelier affichait cette vidéo, on le ferme */
    if (String(currentVideoId) === String(videoId)) {
        fermerAtelier();
    }
    showToast('Vidéo supprimée.', 'info');
    await loadVideos();
}

/* ---------- 24. FILTRES ---------- */
function initFilters() {
    document.querySelectorAll('#doneFilters .filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#doneFilters .filter-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderDone();
        });
    });
}

/* ---------- 25. MENU UTILISATEUR ---------- */
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !dropdown) {
        return;
    }
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });
}

/* ---------- 26. SIDEBAR + SWIPE ---------- */
function initSidebar() {
    const sb = document.getElementById('leftSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const mb = document.getElementById('menuToggle');
    const cb = document.getElementById('closeLeftSidebar');

    function open() {
        if (sb) { sb.classList.add('active'); }
        if (ov) { ov.classList.add('active'); }
        document.body.style.overflow = 'hidden';
    }
    function close() {
        if (sb) { sb.classList.remove('active'); }
        if (ov) { ov.classList.remove('active'); }
        document.body.style.overflow = '';
    }

    if (mb) { mb.addEventListener('click', open); }
    if (cb) { cb.addEventListener('click', close); }
    if (ov) { ov.addEventListener('click', close); }

    let sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) {
        sx = e.changedTouches[0].screenX;
        sy = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - sx;
        const dy = e.changedTouches[0].screenY - sy;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        if (dx > 0 && sx < 40) {
            open();
        } else if (dx < 0) {
            close();
        }
    }, { passive: false });
}

/* ---------- 27. DÉCONNEXION ---------- */
async function logout() {
    showLoader();
    await supabaseClient.auth.signOut();
    hideLoader();
    window.location.href = '../../authprive/users/login.html';
}

/* ---------- 28. INIT ---------- */
document.addEventListener('DOMContentLoaded', async function() {
    const user = await checkSession();
    if (!user) {
        return;
    }
    await loadProfile();
    if (!coachProfile) {
        return;
    }
    await loadMesTalents();
    await loadVideos();

    initFilters();
    initUserMenu();
    initSidebar();

    /* Ajout d'une vidéo */
    const btnAdd = document.getElementById('btnAddVideo');
    if (btnAdd) {
        btnAdd.addEventListener('click', ajouterVideo);
    }

    /* Atelier : annotations */
    const btnAnnot = document.getElementById('btnAddAnnot');
    if (btnAnnot) {
        btnAnnot.addEventListener('click', ajouterAnnotation);
    }
    const annotTexte = document.getElementById('annotTexte');
    if (annotTexte) {
        annotTexte.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                ajouterAnnotation();
            }
        });
    }

    /* Atelier : enregistrer / fermer */
    const btnSave = document.getElementById('btnSaveAnalysis');
    if (btnSave) {
        btnSave.addEventListener('click', enregistrerAnalyse);
    }
    const btnClose = document.getElementById('btnCloseWs');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            if (confirm('Fermer sans enregistrer ? Les annotations non sauvegardées seront perdues.')) {
                fermerAtelier();
            }
        });
    }

    /* Déconnexion */
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    /* Sélecteur de langue */
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', function(e) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            showToast('Langue : ' + selectedOption.text, 'info');
        });
    }
});
