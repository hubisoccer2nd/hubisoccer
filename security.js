// ========== DEBUT : security.js – Protection du code source ==========
(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const ALERT_EMAIL = 'contacthubisoccer@gmail.com';
    const SUPABASE_URL = 'https://rasepmelflfjtliflyrz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhc2VwbWVsZmxmanRsaWZseXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTA0MDEsImV4cCI6MjA4OTg2NjQwMX0.5_aw5JMVeIB8BePdZylI7gGN7pCD79CkS2AResneVpY';
    const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) || null;

    let devtoolsOpen = false;
    let alertSent = false; // une seule alerte par session

    // ========== DÉSACTIVATION DU CLIC DROIT ==========
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showWarning('Le clic droit est désactivé pour des raisons de sécurité.');
    });

    // ========== DÉTECTION DEVTOOLS ==========
    const threshold = 160;
    function detectDevTools() {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsOpen();
            }
        } else {
            devtoolsOpen = false;
        }
    }

    // ========== BLOCAGE RACCOURCIS ==========
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            showWarning('L\'accès aux outils de développement est interdit.');
            handleDevToolsOpen();
            return;
        }
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            showWarning('L\'accès aux outils de développement est interdit.');
            handleDevToolsOpen();
            return;
        }
        if (e.ctrlKey && (e.key === 'U' || e.key === 'S')) {
            e.preventDefault();
            showWarning('Cette action est désactivée.');
        }
    });

    // ========== DÉTECTION PÉRIODIQUE ==========
    setInterval(detectDevTools, 500);

    // ========== GESTION OUVERTURE DEVTOOLS ==========
    function handleDevToolsOpen() {
        showWarning('⚠️ Accès non autorisé. Votre position a été enregistrée et les autorités peuvent être alertées.');
        if (!alertSent) {
            alertSent = true;
            sendAlert();
        }
    }

    // ========== AFFICHAGE MESSAGE ==========
    function showWarning(message) {
        // Supprimer un ancien toast s'il existe
        const existing = document.getElementById('security-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'security-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: fadeInUp 0.4s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 30000); // 30 secondes
    }

    // ========== ENVOI D'ALERTE ==========
    async function sendAlert() {
        let geoData = null;
        let ipData = null;

        // 1. Géolocalisation navigateur si l'utilisateur l'accepte
        try {
            if ('geolocation' in navigator) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
                });
                geoData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            }
        } catch (e) {
            console.log('Géolocalisation refusée ou indisponible');
        }

        // 2. IP et localisation approximative via ipapi.co (gratuit, pas de clé API)
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                ipData = await res.json();
            }
        } catch (e) {
            console.log('Impossible de récupérer les données IP');
        }

        // 3. Envoi à l'Edge Function Supabase
        if (supabase) {
            try {
                await supabase.functions.invoke('send-alert', {
                    body: {
                        email: ALERT_EMAIL,
                        subject: '🔒 HubISoccer – Alerte accès non autorisé',
                        geo: geoData,
                        ipInfo: ipData ? {
                            ip: ipData.ip,
                            city: ipData.city,
                            region: ipData.region,
                            country: ipData.country_name,
                            isp: ipData.org
                        } : null,
                        page: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (e) {
                console.error('Échec envoi alerte :', e);
            }
        }
    }
})();
// ========== FIN : security.js ==========
