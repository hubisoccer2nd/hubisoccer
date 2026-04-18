/* ============================================================
   HubISoccer — foot-scout.js
   Espace Footballeur · Scouting & Analyse
   Corps · Âme · Esprit
   ============================================================ */

'use strict';

// Début configuration Supabase
const SUPABASE_URL      = 'https://niewavngipvowwxxguqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZXdhdm5naXB2b3d3eHhndXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDI1OTAsImV4cCI6MjA5MTIxODU5MH0._UdeCuHW9IgVqDOGTddr3yqP6HTjxU5XNo4MMMGEcmU';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.__SUPABASE_CLIENT = supabaseClient;
// Fin configuration Supabase

// Début état global
let currentUser   = null;
let userProfile   = null;
let scoutingData  = null;
let radarChart    = null;
// Fin état global

// Début fonction showLoader
function showLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'flex';
}
// Fin fonction showLoader

// Début fonction hideLoader
function hideLoader() {
    const l = document.getElementById('globalLoader');
    if (l) l.style.display = 'none';
}
// Fin fonction hideLoader

// Début fonction showToast
function showToast(message, type = 'info', duration = 30000) {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const icons = {
        success: 'fa-check-circle',
        error:   'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info:    'fa-info-circle'
    };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    c.appendChild(t);
    t.querySelector('.toast-close').addEventListener('click', () => {
        t.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => t.remove(), 300);
    });
    setTimeout(() => {
        if (t.parentNode) {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }
    }, duration);
}
// Fin fonction showToast

// Début fonction avg
function avg(arr) {
    const v = arr.filter(x => x != null && !isNaN(x));
    if (!v.length) return 0;
    return Math.round(v.reduce((a, b) => a + Number(b), 0) / v.length);
}
// Fin fonction avg

// Début fonction getInitials
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0]).toUpperCase();
}
// Fin fonction getInitials

// Début fonction formatMoney
function formatMoney(val) {
    if (!val || isNaN(val)) return '—';
    const n = Number(val);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M€';
    if (n >= 1_000)     return (n / 1_000).toFixed(0)     + ' K€';
    return n.toLocaleString('fr-FR') + ' €';
}
// Fin fonction formatMoney

// Début fonction setText
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = (value !== null && value !== undefined) ? value : '—';
}
// Fin fonction setText

// Début fonction checkSession
async function checkSession() {
    showLoader();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    hideLoader();
    if (error || !session) {
        window.location.href = '../../authprive/users/login.html';
        return null;
    }
    currentUser = session.user;
    return currentUser;
}
// Fin fonction checkSession

// Début fonction loadProfile
async function loadProfile() {
    showLoader();
    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_profiles')
        .select('hubisoccer_id, full_name, avatar_url, scouting_views, recruiter_favs, role_code, nationality, club')
        .eq('auth_uuid', currentUser.id)
        .single();
    hideLoader();

    if (error) {
        showToast('Erreur chargement profil', 'error');
        return null;
    }

    if (data.role_code !== 'FOOT') {
        showToast('Accès réservé aux footballeurs', 'error');
        setTimeout(() => window.location.href = '../../authprive/users/login.html', 3000);
        return null;
    }

    userProfile = data;
    document.getElementById('userName').textContent = data.full_name || 'Footballeur';
    updateAvatarUI();
    return userProfile;
}
// Fin fonction loadProfile

// Début fonction updateAvatarUI
function updateAvatarUI() {
    const navImg  = document.getElementById('userAvatar');
    const navInit = document.getElementById('userAvatarInitials');
    const scoImg  = document.getElementById('scoutAvatar');
    const scoInit = document.getElementById('scoutAvatarInitials');
    const url     = userProfile?.avatar_url;

    if (url && url !== '') {
        if (navImg)  { navImg.src = url; navImg.style.display = 'block'; }
        if (navInit) navInit.style.display = 'none';
        if (scoImg)  { scoImg.src = url; scoImg.style.display = 'block'; }
        if (scoInit) scoInit.style.display = 'none';
    } else {
        const init = getInitials(userProfile?.full_name || 'F');
        if (navInit) { navInit.textContent = init; navInit.style.display = 'flex'; }
        if (navImg)  navImg.style.display = 'none';
        if (scoInit) { scoInit.textContent = init; scoInit.style.display = 'flex'; }
        if (scoImg)  scoImg.style.display = 'none';
    }
}
// Fin fonction updateAvatarUI

// Début fonction loadScoutingData
async function loadScoutingData() {
    if (!userProfile) return;
    showLoader();

    const { data, error } = await supabaseClient
        .from('supabaseAuthPrive_footballeur_scouting')
        .select('*')
        .eq('footballeur_hubisoccer_id', userProfile.hubisoccer_id)
        .maybeSingle();
    hideLoader();

    if (error) {
        showToast('Erreur chargement données scouting', 'error');
        return;
    }

    if (!data) {
        const { data: newRow, error: ie } = await supabaseClient
            .from('supabaseAuthPrive_footballeur_scouting')
            .insert([{ footballeur_hubisoccer_id: userProfile.hubisoccer_id }])
            .select()
            .single();
        if (ie) {
            showToast('Erreur initialisation données', 'error');
            return;
        }
        scoutingData = newRow;
    } else {
        scoutingData = data;
    }

    updateUI();
}
// Fin fonction loadScoutingData

// Début fonction computeSkills
function computeSkills() {
    const d = scoutingData;

    const physique = avg([
        d.physique_acceleration, d.physique_agilite, d.physique_detente_verticale,
        d.physique_endurance, d.physique_equilibre, d.physique_puissance,
        d.physique_qualites_physiques_nat, d.physique_vitesse
    ]);
    const vitesse = avg([d.physique_vitesse, d.physique_acceleration]);
    const aerien = avg([d.technique_jeu_de_tete, d.physique_detente_verticale]);

    const mental = avg([
        d.mental_agressivite, d.mental_anticipation, d.mental_appels_de_balle,
        d.mental_concentration, d.mental_courage, d.mental_decisions,
        d.mental_determination, d.mental_inspiration, d.mental_jeu_collectif,
        d.mental_leadership, d.mental_placement, d.mental_sang_froid,
        d.mental_vision_du_jeu, d.mental_volume_de_jeu
    ]);
    const vision = avg([d.mental_vision_du_jeu, d.technique_passes, d.technique_tactics]);
    const defense = avg([d.technique_marquage, d.mental_agressivite, d.mental_anticipation, d.physique_puissance]);

    const technique = avg([
        d.technique_centres, d.technique_controle_balle, d.technique_corners,
        d.technique_coups_francs, d.technique_dribbles, d.technique_finition,
        d.technique_jeu_de_tete, d.technique_marquage, d.technique_passes,
        d.technique_penalty, d.technique_tactics, d.technique_technique,
        d.technique_tirs_de_loin, d.technique_touches_longues
    ]);
    const attaque = avg([d.technique_finition, d.technique_dribbles, d.technique_tirs_de_loin]);

    return { physique, vitesse, aerien, mental, vision, defense, technique, attaque };
}
// Fin fonction computeSkills

// Début fonction updateUI
function updateUI() {
    if (!userProfile || !scoutingData) return;
    const d  = scoutingData;
    const sk = computeSkills();

    setText('scoutName', userProfile.full_name || '—');
    const club = d.club_actuel || userProfile.club || '—';
    const post = d.poste || '—';
    const nat  = userProfile.nationality || '—';
    setText('scoutMeta', `${post} · ${club} · ${nat}`);

    const globalRating = avg([sk.physique, sk.vitesse, sk.aerien, sk.mental, sk.vision, sk.defense, sk.technique, sk.attaque]);
    setText('scoutGlobalRating', globalRating || '—');

    setText('statMatchs',  d.matchs_joues  ?? '—');
    setText('statButs',    d.buts          ?? '—');
    setText('statPasses',  d.passes_decisives ?? '—');
    setText('statValeur',  d.valeur_marche ? formatMoney(d.valeur_marche) : '—');
    setText('statVues',    userProfile.scouting_views  ?? '—');
    setText('statFavoris', userProfile.recruiter_favs  ?? '—');

    setText('primaryPosition',    d.poste                   || 'Poste principal');
    setText('secondaryPositions', d.secondary_positions     || 'Poste secondaire');

    let leftRating  = d.left_foot_rating  || 0;
    let rightRating = d.right_foot_rating || 0;
    if (!leftRating && !rightRating) {
        const pied = d.pied_fort || 'Droitier';
        if (pied.toLowerCase().includes('gauche')) { leftRating = 85; rightRating = 30; }
        else if (pied.toLowerCase().includes('ambi')) { leftRating = 75; rightRating = 75; }
        else { leftRating = 30; rightRating = 85; }
    }
    const lFill = document.getElementById('leftFootFill');
    const rFill = document.getElementById('rightFootFill');
    if (lFill) lFill.style.width  = leftRating  + '%';
    if (rFill) rFill.style.width  = rightRating + '%';
    setText('leftFootLabel',  leftRating  >= 70 ? 'Très fort' : leftRating  >= 40 ? 'Moyen' : 'Faible');
    setText('rightFootLabel', rightRating >= 70 ? 'Très fort' : rightRating >= 40 ? 'Moyen' : 'Faible');

    updateValueBar('bar_physique',  'val_physique',  sk.physique);
    updateValueBar('bar_vitesse',   'val_vitesse',   sk.vitesse);
    updateValueBar('bar_aerien',    'val_aerien',    sk.aerien);
    updateValueBar('bar_mental',    'val_mental',    sk.mental);
    updateValueBar('bar_vision',    'val_vision',    sk.vision);
    updateValueBar('bar_defense',   'val_defense',   sk.defense);
    updateValueBar('bar_technique', 'val_technique', sk.technique);
    updateValueBar('bar_attaque',   'val_attaque',   sk.attaque);

    const corpsList = [
        ['physique_vitesse','physique_vitesse'],['physique_acceleration','physique_acceleration'],
        ['physique_endurance','physique_endurance'],['physique_puissance','physique_puissance'],
        ['physique_agilite','physique_agilite'],['physique_equilibre','physique_equilibre'],
        ['physique_detente_verticale','physique_detente_verticale'],
        ['physique_qualites_physiques_nat','physique_qualites_physiques_nat']
    ];
    corpsList.forEach(([htmlId, dbField]) => updateMiniBar(htmlId, dbField));

    const ameList = [
        'mental_agressivite','mental_anticipation','mental_appels_de_balle','mental_concentration',
        'mental_courage','mental_decisions','mental_determination','mental_inspiration',
        'mental_jeu_collectif','mental_leadership','mental_placement','mental_sang_froid',
        'mental_vision_du_jeu','mental_volume_de_jeu'
    ];
    ameList.forEach(field => updateMiniBar(field, field));

    const espritList = [
        'technique_centres','technique_controle_balle','technique_corners','technique_coups_francs',
        'technique_dribbles','technique_finition','technique_jeu_de_tete','technique_marquage',
        'technique_passes','technique_penalty','technique_tactics','technique_technique',
        'technique_tirs_de_loin','technique_touches_longues'
    ];
    espritList.forEach(field => updateMiniBar(field, field));

    if (d.contract_expiry) {
        setText('dateContrat', new Date(d.contract_expiry).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    } else { setText('dateContrat', '—'); }
    if (d.next_evaluation) {
        setText('dateEvaluation', new Date(d.next_evaluation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    } else { setText('dateEvaluation', '—'); }
    setText('valeurMarche', d.valeur_marche ? formatMoney(d.valeur_marche) : '—');
    setText('clubActuel', d.club_actuel || userProfile.club || '—');

    setText('strengthsText',  d.strengths  || 'Aucun atout exceptionnel renseigné.');
    setText('weaknessesText', d.weaknesses || 'Aucune faiblesse renseignée.');

    const report = d.rapports_recruteurs || '';
    const rDiv = document.getElementById('scoutReport');
    if (rDiv) {
        rDiv.innerHTML = report
            ? `<p>${report}</p>`
            : '<p class="empty-state"><i class="fas fa-search"></i> Aucun rapport disponible pour le moment.</p>';
    }

    updateRadar(sk);
}
// Fin fonction updateUI

// Début fonction updateValueBar
function updateValueBar(barId, numId, value) {
    const bar = document.getElementById(barId);
    const num = document.getElementById(numId);
    if (bar) bar.style.width = Math.min(value, 100) + '%';
    if (num) num.textContent = value;
}
// Fin fonction updateValueBar

// Début fonction updateMiniBar
function updateMiniBar(htmlId, dbField) {
    const val  = scoutingData?.[dbField] || 0;
    const bar  = document.getElementById('d_' + htmlId);
    const num  = document.getElementById('n_' + htmlId);
    if (bar) bar.style.width = Math.min(val, 100) + '%';
    if (num) num.textContent = val;
}
// Fin fonction updateMiniBar

// Début fonction updateRadar
function updateRadar(skills) {
    const ctx = document.getElementById('skillsRadar');
    if (!ctx) return;

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: [
                'Corps — Physique', 'Corps — Vitesse', 'Corps — Aérien',
                'Âme — Mental', 'Âme — Vision', 'Âme — Défense',
                'Esprit — Technique', 'Esprit — Attaque'
            ],
            datasets: [{
                label: 'Profil',
                data: [
                    skills.physique, skills.vitesse, skills.aerien,
                    skills.mental,   skills.vision,  skills.defense,
                    skills.technique, skills.attaque
                ],
                backgroundColor: 'rgba(85,27,140,0.15)',
                borderColor:     '#7e3db0',
                borderWidth:     2,
                pointBackgroundColor: ['#e74c3c','#e74c3c','#e74c3c',
                                       '#3498db','#3498db','#3498db',
                                       '#27ae60','#27ae60'],
                pointBorderColor:     '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor:     '#7e3db0',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        stepSize: 20, 
                        color: '#4a4a6a',        // couleur sombre pour les graduations
                        backdropColor: 'transparent', 
                        font: { size: 10 } 
                    },
                    grid: { color: '#d0ccd8' },   // grille plus sombre et visible
                    angleLines: { color: '#d0ccd8' },
                    pointLabels: { 
                        color: '#1a1a2e',         // labels sombres
                        font: { size: 10, family: 'Poppins', weight: '500' } 
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}` } }
            }
        }
    });
}
// Fin fonction updateRadar

// Début fonction initAttrTabs
function initAttrTabs() {
    document.querySelectorAll('.attr-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.attr-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.attr-detail-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById(tab.dataset.cat + '-detail');
            if (panel) panel.classList.add('active');
        });
    });
}
// Fin fonction initAttrTabs

// Début fonction initUserMenu
function initUserMenu() {
    const menu = document.getElementById('userMenu');
    const dd   = document.getElementById('userDropdown');
    if (!menu || !dd) return;
    menu.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('show'); });
    document.addEventListener('click', () => dd.classList.remove('show'));
}
// Fin fonction initUserMenu

// Début fonction initSidebar
function initSidebar() {
    const sb  = document.getElementById('leftSidebar');
    const ov  = document.getElementById('sidebarOverlay');
    const mb  = document.getElementById('menuToggle');
    const cb  = document.getElementById('closeSidebar');

    const open  = () => {
        sb?.classList.add('active');
        ov?.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        sb?.classList.remove('active');
        ov?.classList.remove('active');
        document.body.style.overflow = '';
    };

    mb?.addEventListener('click', open);
    cb?.addEventListener('click', close);
    ov?.addEventListener('click', close);

    let startX = 0, startY = 0;
    document.addEventListener('touchstart', e => {
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - startX;
        const dy = e.changedTouches[0].screenY - startY;
        if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 55) return;
        if (e.cancelable) e.preventDefault();
        if (dx > 0 && startX < 50) open();
        else if (dx < 0) close();
    }, { passive: false });
}
// Fin fonction initSidebar

// Début fonction initLogout
function initLogout() {
    document.querySelectorAll('#logoutLink, #logoutLinkSidebar').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '../../authprive/users/login.html';
        });
    });
}
// Fin fonction initLogout

// Début initialisation DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    if (!user) return;

    showLoader();
    const profile = await loadProfile();
    if (!profile) {
        hideLoader();
        return;
    }

    await loadScoutingData();
    hideLoader();

    initAttrTabs();
    initUserMenu();
    initSidebar();
    initLogout();

    document.getElementById('langSelect')?.addEventListener('change', e => {
        showToast(`Langue : ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
});
// Fin initialisation DOMContentLoaded
