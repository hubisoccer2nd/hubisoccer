// ========== CREATEUR_LOGO.JS ==========
// ========== CONFIGURATION SUPABASE ==========
const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DÉBUT : UTILITAIRES ==========
function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-content">${escapeHtml(message)}</div><button class="toast-close">×</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showLoader() { const el = document.getElementById('globalLoader'); if (el) el.style.display = 'flex'; }
function hideLoader() { const el = document.getElementById('globalLoader'); if (el) el.style.display = 'none'; }
// ========== FIN : UTILITAIRES ==========

// ========== DÉBUT : INITIALISATION FABRIC.JS ==========
const canvas = new fabric.Canvas('logoCanvas', {
    width: 800,
    height: 800,
    backgroundColor: '#ffffff'
});

// Texte par défaut
let clubText = new fabric.IText('NOM DU CLUB', {
    left: 200,
    top: 350,
    fontFamily: 'Bebas Neue',
    fill: '#4B0082',
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
    originX: 'center',
    originY: 'center'
});
canvas.add(clubText);
canvas.setActiveObject(clubText);
canvas.renderAll();
// ========== FIN : INITIALISATION ==========

// ========== DÉBUT : OUTILS WORD-STYLE ==========
document.getElementById('clubNameInput').addEventListener('input', (e) => {
    let obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('text', e.target.value.toUpperCase());
        canvas.renderAll();
    }
});

document.getElementById('fontFamilySelect').addEventListener('change', (e) => {
    let obj = canvas.getActiveObject();
    if (obj) { obj.set('fontFamily', e.target.value); canvas.renderAll(); }
});

document.getElementById('fontSizeInput').addEventListener('input', (e) => {
    let obj = canvas.getActiveObject();
    if (obj) { obj.set('fontSize', parseInt(e.target.value)); canvas.renderAll(); }
});

document.getElementById('textColorPicker').addEventListener('input', (e) => {
    let obj = canvas.getActiveObject();
    if (obj) { obj.set('fill', e.target.value); canvas.renderAll(); }
});

document.getElementById('btnBold').addEventListener('click', () => {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        canvas.renderAll();
    }
});

document.getElementById('btnItalic').addEventListener('click', () => {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        canvas.renderAll();
    }
});

document.getElementById('btnUnderline').addEventListener('click', () => {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('underline', !obj.underline);
        canvas.renderAll();
    }
});

document.getElementById('letterSpacingSlider').addEventListener('input', (e) => {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('charSpacing', parseInt(e.target.value) * 10);
        canvas.renderAll();
    }
});

function alignText(alignment) {
    let obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('textAlign', alignment);
        canvas.renderAll();
    }
}
// ========== FIN : OUTILS WORD-STYLE ==========

// ========== DÉBUT : FORMES ==========
function addShape(type) {
    const color = document.getElementById('shapeColorPicker').value;
    let shape;
    const baseOptions = { left: 300, top: 300, fill: color, opacity: 0.3, selectable: true };
    switch(type) {
        case 'circle': shape = new fabric.Circle({ ...baseOptions, radius: 150 }); break;
        case 'shield': shape = new fabric.Path('M400,50 L480,150 L460,300 L400,350 L340,300 L320,150 Z', { ...baseOptions }); break;
        case 'diamond': shape = new fabric.Polygon([{x:400,y:50},{x:550,y:350},{x:400,y:650},{x:250,y:350}], { ...baseOptions }); break;
        case 'crown': shape = new fabric.Path('M250,350 L300,150 L350,250 L400,120 L450,250 L500,150 L550,350 Z', { ...baseOptions }); break;
        case 'star': shape = new fabric.Polygon([{x:400,y:50},{x:460,y:220},{x:640,y:220},{x:500,y:350},{x:550,y:530},{x:400,y:420},{x:250,y:530},{x:300,y:350},{x:160,y:220},{x:340,y:220}], { ...baseOptions }); break;
        case 'rectangle': shape = new fabric.Rect({ ...baseOptions, width: 300, height: 200, left: 250, top: 300, rx: 20, ry: 20 }); break;
        case 'ellipse': shape = new fabric.Ellipse({ ...baseOptions, rx: 200, ry: 150 }); break;
        default: shape = new fabric.Circle({ ...baseOptions, radius: 150 });
    }
    canvas.add(shape);
    canvas.sendToBack(shape);
    canvas.renderAll();
}
// ========== FIN : FORMES ==========

// ========== DÉBUT : PALETTE DE COULEURS ==========
function generateColorPalette() {
    const palette = document.getElementById('colorPalette');
    if (!palette) return;
    const colors = [
        '#FF0000','#FF4444','#FF8800','#FFAA00','#FFFF00','#FFFF44','#88FF00','#44FF00',
        '#00FF00','#00FF44','#00FF88','#00FFAA','#00FFFF','#00CCFF','#0088FF','#0044FF',
        '#0000FF','#4400FF','#8800FF','#AA00FF','#FF00FF','#FF00AA','#FF0088','#FF0044',
        '#000000','#333333','#666666','#999999','#BBBBBB','#DDDDDD','#FFFFFF','#F5F5F5',
        '#1a1a1a','#2d2d2d','#404040','#555555','#777777','#aaaaaa','#cccccc','#e6e6e6',
        '#4B0082','#551B8C','#7B2FBE','#9C4DCC','#B366FF','#CC99FF','#E6CCFF','#FFCC00',
        '#e6b800','#cc9900','#996600','#663300','#331100','#FF5733','#C70039','#900C3F',
        '#581845','#1ABC9C','#2ECC71','#3498DB','#9B59B6','#E74C3C','#F39C12','#2980B9'
    ];
    palette.innerHTML = colors.map(c => `<div class="color-swatch" style="background-color:${c}" data-color="${c}" onclick="applyColor('${c}')"></div>`).join('');
}

function applyColor(color) {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fill', color);
        canvas.renderAll();
    }
}

document.getElementById('customColorPicker').addEventListener('input', (e) => {
    let obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fill', e.target.value);
        canvas.renderAll();
    }
});
// ========== FIN : PALETTE DE COULEURS ==========

// ========== DÉBUT : FONCTIONS OUTILS ==========
function deleteSelected() {
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.renderAll(); }
}

function duplicateSelected() {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.clone(function(cloned) {
        cloned.set({ left: cloned.left + 30, top: cloned.top + 30 });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
    });
}
// ========== FIN : FONCTIONS OUTILS ==========

// ========== DÉBUT : SOUMISSION ==========
document.getElementById('btnSubmitLogo').addEventListener('click', async () => {
    const club = document.getElementById('clubNameInput').value.trim() || 'SANS-NOM';
    const neighborhood = document.getElementById('neighborhoodInput').value.trim() || 'SANS-QUARTIER';
    
    showLoader();
    try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-');
        const timeStr = now.getHours() + 'h' + now.getMinutes();
        const fileName = `${club}_${dateStr}_${timeStr}_${neighborhood}_Logo.png`;
        
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
        const blob = await (await fetch(dataURL)).blob();
        
        const { data: storageData, error: storageError } = await supabasePublic.storage
            .from('creation_de_logo')
            .upload(fileName, blob);
            
        if (storageError) {
            showToast('Erreur upload : ' + storageError.message, 'error');
            return;
        }
        
        const { error: dbError } = await supabasePublic
            .from('demandes_logos')
            .insert([{
                user_id: JSON.parse(sessionStorage.getItem('designer_user') || '{}').id || null,
                club_nom: club,
                quartier: neighborhood,
                file_url: fileName,
                config_json: JSON.stringify(canvas.toJSON()),
                statut: 'en_attente'
            }]);
            
        if (dbError) throw dbError;
        
        showToast('Logo soumis avec succès ! En attente de validation par Ozawa.', 'success');
        document.getElementById('statusBadge').textContent = 'EN ATTENTE';
        document.getElementById('statusBadge').className = 'status-badge pending';
        document.getElementById('statusDesc').textContent = 'Votre logo est en cours de validation.';
    } catch(err) {
        console.error(err);
        showToast('Erreur lors de la soumission.', 'error');
    } finally {
        hideLoader();
    }
});
// ========== FIN : SOUMISSION ==========

// ========== DÉBUT : VÉRIFICATION STATUT TÉLÉCHARGEMENT ==========
async function checkDownloadStatus() {
    const club = document.getElementById('clubNameInput').value.trim();
    if (!club) return;
    try {
        const { data, error } = await supabasePublic
            .from('demandes_logos')
            .select('statut, file_url')
            .eq('club_nom', club)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) return;
        if (data.statut === 'approuve') {
            document.getElementById('downloadSection').classList.remove('locked');
            document.getElementById('btnDownloadLogo').disabled = false;
            document.getElementById('statusBadge').textContent = 'VALIDÉ';
            document.getElementById('statusBadge').className = 'status-badge approved';
            document.getElementById('statusDesc').textContent = 'Logo approuvé. Téléchargement disponible.';
            document.getElementById('btnDownloadLogo').onclick = () => {
                const url = `${SUPABASE_URL}/storage/v1/object/public/creation_de_logo/${data.file_url}`;
                window.open(url, '_blank');
            };
        }
    } catch(err) { /* silencieux */ }
}
// ========== FIN : VÉRIFICATION STATUT ==========

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    generateColorPalette();
    checkDownloadStatus();
});
// ========== FIN DE CREATEUR_LOGO.JS ==========
