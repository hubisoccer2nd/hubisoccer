/* ============================================================
   HubISoccer — hub-lecteur.js
   Communauté — LOT C
   Le lecteur vidéo HubISoccer
   ------------------------------------------------------------
   CE QU'IL FAUT SAVOIR AVANT DE LIRE CE FICHIER

   Ce lecteur ne décode PAS la vidéo. Aucun lecteur web ne le
   fait : c'est l'élément <video> du navigateur qui décode, et
   aucune API ne fait mieux que lui.

   Donc il ne corrige pas, à lui seul, le son qui se décale ni
   l'image qui rame. Ces deux-là viennent du FICHIER et de la
   CONNEXION :

     · l'index du MP4 placé à la fin → le navigateur doit tout
       télécharger avant de commencer (corrigé à l'encodage,
       avec -movflags +faststart) ;
     · une cadence d'images variable → le son dérive (corrigé en
       ré-encodant à cadence constante) ;
     · un débit trop élevé pour la connexion → ça bégaie (corrigé
       par le HLS adaptatif, que CE lecteur sait lire).

   CE QU'IL APPORTE VRAIMENT

     · le HLS adaptatif : plusieurs qualités, changement
       automatique selon la connexion — c'est LUI qui règle le
       bégaiement sur une connexion faible ;
     · le choix manuel de la qualité, quand on veut forcer ;
     · un indicateur qui EXPLIQUE au lieu de figer — « la
       connexion est lente », plutôt qu'une image arrêtée ;
     · les mêmes commandes sur tous les téléphones : celles
       d'Android changent d'un constructeur à l'autre ;
     · la reprise à l'endroit où on s'était arrêté ;
     · double-tape pour avancer ou reculer de 10 secondes ;
     · le son coupé par défaut dans le fil, comme partout.

   CE QU'IL NE CASSE PAS

   Si ce fichier ne se charge pas, ou si hls.js manque, les
   vidéos restent lisibles : l'élément <video> d'origine garde
   ses commandes natives. On n'échange jamais quelque chose qui
   marche contre quelque chose qui pourrait ne pas marcher.
   ============================================================ */
window.HubLecteur = (function () {
    'use strict';

    var PREFIXE_MEMOIRE = 'hubLecteur:';
    var SEUIL_REPRISE   = 30;    // secondes : en dessous, on ne propose rien
    var FIN_PROCHE      = 0.95;  // au-delà, on considère la vidéo finie
    var LENTEUR         = 8000;  // ms d'attente avant de dire « c'est lent »

    // ═══════════════════════════════════════════════════════
    // 1. OUTILS
    // ═══════════════════════════════════════════════════════
    function duree(s) {
        if (!isFinite(s) || s < 0) return '0:00';
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var x = Math.floor(s % 60);
        return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
    }

    function el(balise, classe, dedans) {
        var e = document.createElement(balise);
        if (classe) e.className = classe;
        if (dedans) e.innerHTML = dedans;
        return e;
    }

    // Le presse-papier, le stockage local : tout peut être refusé
    // (navigation privée, réglages stricts). On n'y laisse jamais
    // planter une lecture vidéo.
    function seSouvenir(cle, valeur) {
        try { localStorage.setItem(PREFIXE_MEMOIRE + cle, String(valeur)); } catch (e) {}
    }
    function seRappeler(cle) {
        try { return parseFloat(localStorage.getItem(PREFIXE_MEMOIRE + cle)); } catch (e) { return NaN; }
    }
    function oublier(cle) {
        try { localStorage.removeItem(PREFIXE_MEMOIRE + cle); } catch (e) {}
    }

    function estHls(url) { return /\.m3u8(\?|$)/i.test(String(url || '')); }

    // ═══════════════════════════════════════════════════════
    // 2. LE HLS, QUAND IL EST LÀ
    // -------------------------------------------------------
    // Safari lit le HLS nativement. Ailleurs il faut hls.js.
    // S'il n'est pas chargé, on le dit une fois et on retombe
    // sur la lecture directe — qui marchera si le serveur sert
    // aussi un MP4.
    // ═══════════════════════════════════════════════════════
    var _hlsSignale = false;

    function brancherHls(video, src, surQualites) {
        var natif = video.canPlayType('application/vnd.apple.mpegurl');
        if (natif) { video.src = src; return null; }

        if (typeof window.Hls === 'undefined' || !window.Hls.isSupported()) {
            if (!_hlsSignale) {
                _hlsSignale = true;
                console.warn('[HubLecteur] hls.js absent : lecture directe. ' +
                             'Le changement de qualité automatique ne fonctionnera pas.');
            }
            video.src = src;
            return null;
        }

        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            var niveaux = (hls.levels || []).map(function (n, i) {
                return { index: i, hauteur: n.height || 0, debit: n.bitrate || 0 };
            });
            if (surQualites) surQualites(niveaux, hls);
        });

        hls.on(window.Hls.Events.ERROR, function (evt, donnees) {
            if (!donnees.fatal) return;
            // On tente de se rattraper avant d'abandonner : une
            // coupure réseau est banale sur un téléphone.
            if (donnees.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (donnees.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else { hls.destroy(); video.src = src; }
        });

        return hls;
    }

    // ═══════════════════════════════════════════════════════
    // 3. HABILLER UNE VIDÉO
    // -------------------------------------------------------
    // On ne remplace pas l'élément <video> : on l'entoure. Il
    // garde donc son src, ses pistes, son décodeur — seules les
    // commandes changent.
    // ═══════════════════════════════════════════════════════
    function habiller(video, options) {
        options = options || {};
        if (!video || video.dataset.hubLecteur === '1') return null;
        video.dataset.hubLecteur = '1';

        var src = video.getAttribute('src') || options.src || '';
        var cle = (options.cle || src).slice(-180);

        // Le cadre
        var cadre = el('div', 'hl-cadre');
        if (options.dansLeFil) cadre.classList.add('hl-fil');
        video.parentNode.insertBefore(cadre, video);
        cadre.appendChild(video);

        video.removeAttribute('controls');           // les nôtres prennent la suite
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', options.preload || 'metadata');
        if (options.poster) video.setAttribute('poster', options.poster);

        // Dans le fil : son coupé, comme partout ailleurs.
        if (options.dansLeFil) { video.muted = true; video.setAttribute('muted', ''); }

        // ── Les pièces de l'habillage ───────────────────────
        var voile   = el('div', 'hl-voile');
        var grosBtn = el('button', 'hl-gros-bouton', '<i class="fas fa-play"></i>');
        grosBtn.setAttribute('aria-label', 'Lire la vidéo');
        voile.appendChild(grosBtn);

        var attente = el('div', 'hl-attente',
            '<div class="hl-rond"></div><div class="hl-attente-mot">Chargement…</div>');
        attente.style.display = 'none';

        var barreBas = el('div', 'hl-commandes');

        var ligneTemps = el('div', 'hl-ligne');
        var rail       = el('div', 'hl-rail');
        var charge     = el('div', 'hl-charge');
        var joue       = el('div', 'hl-joue');
        var pouce      = el('div', 'hl-pouce');
        rail.appendChild(charge); rail.appendChild(joue); rail.appendChild(pouce);
        var curseur = document.createElement('input');
        curseur.type = 'range'; curseur.min = '0'; curseur.max = '100'; curseur.value = '0';
        curseur.step = '0.1'; curseur.className = 'hl-curseur';
        curseur.setAttribute('aria-label', 'Position dans la vidéo');
        ligneTemps.appendChild(rail); ligneTemps.appendChild(curseur);

        var ligneBtns = el('div', 'hl-boutons');
        var btnLire   = el('button', 'hl-btn', '<i class="fas fa-play"></i>');
        btnLire.setAttribute('aria-label', 'Lire');
        var btnRecul  = el('button', 'hl-btn hl-secondaire', '<i class="fas fa-rotate-left"></i>');
        btnRecul.setAttribute('aria-label', 'Reculer de 10 secondes');
        var btnAvance = el('button', 'hl-btn hl-secondaire', '<i class="fas fa-rotate-right"></i>');
        btnAvance.setAttribute('aria-label', 'Avancer de 10 secondes');
        var temps     = el('span', 'hl-temps', '0:00 / 0:00');
        var btnSon    = el('button', 'hl-btn', '<i class="fas fa-volume-high"></i>');
        btnSon.setAttribute('aria-label', 'Couper le son');
        var volume = document.createElement('input');
        volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '0.05';
        volume.value = '1'; volume.className = 'hl-volume';
        volume.setAttribute('aria-label', 'Volume');
        var btnQualite = el('button', 'hl-btn hl-qualite', 'AUTO');
        btnQualite.setAttribute('aria-label', 'Qualité de la vidéo');
        btnQualite.style.display = 'none';
        var btnVitesse = el('button', 'hl-btn hl-vitesse', '1×');
        btnVitesse.setAttribute('aria-label', 'Vitesse de lecture');
        var btnPlein  = el('button', 'hl-btn', '<i class="fas fa-expand"></i>');
        btnPlein.setAttribute('aria-label', 'Plein écran');

        [btnLire, btnRecul, btnAvance, temps, btnSon, volume,
         btnQualite, btnVitesse, btnPlein].forEach(function (x) { ligneBtns.appendChild(x); });

        barreBas.appendChild(ligneTemps);
        barreBas.appendChild(ligneBtns);

        var message = el('div', 'hl-message');
        message.style.display = 'none';

        cadre.appendChild(voile);
        cadre.appendChild(attente);
        cadre.appendChild(barreBas);
        cadre.appendChild(message);

        // ── Le HLS, si c'en est ─────────────────────────────
        var hls = null;
        if (estHls(src)) {
            video.removeAttribute('src');
            hls = brancherHls(video, src, function (niveaux, instance) {
                if (niveaux.length < 2) return;
                btnQualite.style.display = '';
                btnQualite.addEventListener('click', function () {
                    // On tourne : AUTO → la plus haute → … → AUTO
                    var actuel = instance.currentLevel;
                    var suivant = actuel + 1;
                    if (suivant >= niveaux.length) suivant = -1;
                    instance.currentLevel = suivant;
                    btnQualite.textContent = suivant === -1
                        ? 'AUTO'
                        : (niveaux[suivant].hauteur ? niveaux[suivant].hauteur + 'p' : (suivant + 1) + '');
                });
            });
        }

        // ── Les comportements ───────────────────────────────
        var minuteurLenteur = null;

        function direLenteur() {
            message.innerHTML = '<i class="fas fa-wifi"></i> La connexion est lente — ' +
                'la vidéo charge encore. Baisse la qualité si le bouton est proposé.';
            message.style.display = 'block';
        }
        function taireMessage() {
            message.style.display = 'none';
            if (minuteurLenteur) { clearTimeout(minuteurLenteur); minuteurLenteur = null; }
        }

        function montrerAttente(oui) {
            attente.style.display = oui ? 'flex' : 'none';
            if (oui) {
                if (!minuteurLenteur) minuteurLenteur = setTimeout(direLenteur, LENTEUR);
            } else {
                taireMessage();
            }
        }

        function majLire() {
            var enLecture = !video.paused && !video.ended;
            btnLire.innerHTML = enLecture ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            btnLire.setAttribute('aria-label', enLecture ? 'Mettre en pause' : 'Lire');
            cadre.classList.toggle('hl-en-lecture', enLecture);
            voile.style.display = (enLecture || video.currentTime > 0) ? 'none' : 'flex';
        }

        function basculer() {
            if (video.paused) {
                var p = video.play();
                if (p && p.catch) p.catch(function () {
                    // Le navigateur refuse la lecture automatique
                    // avec le son : on coupe et on réessaie.
                    video.muted = true;
                    majSon();
                    video.play().catch(function () {});
                });
            } else video.pause();
        }

        function majSon() {
            var coupe = video.muted || video.volume === 0;
            btnSon.innerHTML = coupe
                ? '<i class="fas fa-volume-xmark"></i>'
                : (video.volume < 0.5 ? '<i class="fas fa-volume-low"></i>' : '<i class="fas fa-volume-high"></i>');
            btnSon.setAttribute('aria-label', coupe ? 'Rétablir le son' : 'Couper le son');
            volume.value = coupe ? 0 : video.volume;
        }

        function majTemps() {
            var d = video.duration;
            temps.textContent = duree(video.currentTime) + ' / ' + (isFinite(d) ? duree(d) : '…');
            if (isFinite(d) && d > 0) {
                var pct = (video.currentTime / d) * 100;
                joue.style.width = pct + '%';
                pouce.style.left = pct + '%';
                curseur.value = pct;
                // On note où on en est, pour reprendre plus tard.
                if (video.currentTime > SEUIL_REPRISE && video.currentTime < d * FIN_PROCHE) {
                    seSouvenir(cle, video.currentTime);
                } else if (video.currentTime >= d * FIN_PROCHE) {
                    oublier(cle);
                }
            }
        }

        function majCharge() {
            var d = video.duration;
            if (!isFinite(d) || !d || !video.buffered.length) return;
            var fin = video.buffered.end(video.buffered.length - 1);
            charge.style.width = Math.min(100, (fin / d) * 100) + '%';
        }

        grosBtn.addEventListener('click', basculer);
        btnLire.addEventListener('click', basculer);
        btnRecul.addEventListener('click', function () { video.currentTime = Math.max(0, video.currentTime - 10); });
        btnAvance.addEventListener('click', function () { video.currentTime = Math.min(video.duration || 1e9, video.currentTime + 10); });

        btnSon.addEventListener('click', function () { video.muted = !video.muted; majSon(); });
        volume.addEventListener('input', function () {
            video.volume = parseFloat(volume.value);
            video.muted = video.volume === 0;
            majSon();
        });

        var VITESSES = [1, 1.25, 1.5, 2, 0.5];
        var iVitesse = 0;
        btnVitesse.addEventListener('click', function () {
            iVitesse = (iVitesse + 1) % VITESSES.length;
            video.playbackRate = VITESSES[iVitesse];
            btnVitesse.textContent = VITESSES[iVitesse] + '×';
        });

        btnPlein.addEventListener('click', function () {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (cadre.requestFullscreen) {
                cadre.requestFullscreen().catch(function () {});
            } else if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();     // iPhone : seule la vidéo passe en plein écran
            }
        });

        curseur.addEventListener('input', function () {
            var d = video.duration;
            if (isFinite(d) && d) video.currentTime = (parseFloat(curseur.value) / 100) * d;
        });

        video.addEventListener('play', majLire);
        video.addEventListener('pause', majLire);
        video.addEventListener('ended', function () { majLire(); oublier(cle); });
        video.addEventListener('timeupdate', majTemps);
        video.addEventListener('progress', majCharge);
        video.addEventListener('durationchange', function () { majTemps(); majCharge(); });
        video.addEventListener('waiting', function () { montrerAttente(true); });
        video.addEventListener('playing', function () { montrerAttente(false); majLire(); });
        video.addEventListener('canplay', function () { montrerAttente(false); });
        video.addEventListener('volumechange', majSon);

        video.addEventListener('error', function () {
            montrerAttente(false);
            message.innerHTML = '<i class="fas fa-triangle-exclamation"></i> ' +
                'Cette vidéo n’a pas pu être lue. Le fichier est peut-être en cours d’envoi, ' +
                'ou dans un format que ce navigateur ne connaît pas.';
            message.style.display = 'block';
        });

        // Double-tape : reculer à gauche, avancer à droite.
        var dernierTap = 0;
        cadre.addEventListener('click', function (e) {
            if (e.target.closest('.hl-commandes') || e.target.closest('.hl-gros-bouton')) return;
            var maintenant = Date.now();
            if (maintenant - dernierTap < 320) {
                var r = cadre.getBoundingClientRect();
                var aGauche = (e.clientX - r.left) < r.width / 2;
                video.currentTime = aGauche
                    ? Math.max(0, video.currentTime - 10)
                    : Math.min(video.duration || 1e9, video.currentTime + 10);
                var bulle = el('div', 'hl-bond ' + (aGauche ? 'hl-bond-g' : 'hl-bond-d'),
                               (aGauche ? '−' : '+') + '10 s');
                cadre.appendChild(bulle);
                setTimeout(function () { bulle.remove(); }, 600);
                dernierTap = 0;
            } else {
                dernierTap = maintenant;
                setTimeout(function () { if (dernierTap === maintenant) basculer(); }, 320);
            }
        });

        // Le clavier, quand le lecteur a le focus.
        cadre.setAttribute('tabindex', '0');
        cadre.addEventListener('keydown', function (e) {
            var pris = true;
            if (e.key === ' ' || e.key === 'k') basculer();
            else if (e.key === 'ArrowLeft')  video.currentTime = Math.max(0, video.currentTime - 5);
            else if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration || 1e9, video.currentTime + 5);
            else if (e.key === 'm') { video.muted = !video.muted; majSon(); }
            else if (e.key === 'f') btnPlein.click();
            else pris = false;
            if (pris) e.preventDefault();
        });

        // La reprise : seulement si on était vraiment dedans.
        var repriseA = seRappeler(cle);
        if (isFinite(repriseA) && repriseA > SEUIL_REPRISE) {
            var reprendre = el('div', 'hl-reprise');
            reprendre.innerHTML = '<span>Reprendre à ' + duree(repriseA) + ' ?</span>';
            var oui = el('button', 'hl-reprise-oui', 'Reprendre');
            var non = el('button', 'hl-reprise-non', 'Depuis le début');
            reprendre.appendChild(oui); reprendre.appendChild(non);
            cadre.appendChild(reprendre);
            oui.addEventListener('click', function (e) {
                e.stopPropagation();
                video.currentTime = repriseA; reprendre.remove(); basculer();
            });
            non.addEventListener('click', function (e) {
                e.stopPropagation();
                oublier(cle); reprendre.remove();
            });
        }

        majLire(); majSon(); majTemps();

        return {
            cadre: cadre, video: video, hls: hls,
            detruire: function () { if (hls) hls.destroy(); }
        };
    }

    // ═══════════════════════════════════════════════════════
    // 4. HABILLER TOUT CE QUI TRAÎNE
    // -------------------------------------------------------
    // Les pages fabriquent leur HTML en chaînes de caractères.
    // Plutôt que de réécrire douze endroits, elles posent une
    // classe et appellent ceci après le rendu.
    // ═══════════════════════════════════════════════════════
    function activer(racine, options) {
        racine = racine || document;
        var faits = 0;
        var cibles = racine.querySelectorAll('video.hub-lecteur:not([data-hub-lecteur])');
        Array.prototype.forEach.call(cibles, function (v) {
            var o = {};
            if (options) Object.keys(options).forEach(function (k) { o[k] = options[k]; });
            if (v.dataset.dansLeFil === '1') o.dansLeFil = true;
            if (v.dataset.poster) o.poster = v.dataset.poster;
            try { if (habiller(v, o)) faits++; }
            catch (e) {
                // Une vidéo qui ne s'habille pas garde ses
                // commandes natives : on la rend au navigateur
                // plutôt que de la laisser sans rien.
                console.warn('[HubLecteur] habillage impossible :', e && e.message);
                v.setAttribute('controls', '');
            }
        });
        return faits;
    }

    // Le gabarit, pour les pages qui construisent du HTML.
    function balise(url, options) {
        options = options || {};
        var attrs = ' class="hub-lecteur"';
        if (options.dansLeFil) attrs += ' data-dans-le-fil="1"';
        if (options.poster)    attrs += ' data-poster="' + String(options.poster).replace(/"/g, '&quot;') + '"';
        if (options.style)     attrs += ' style="' + String(options.style).replace(/"/g, '&quot;') + '"';
        // controls reste présent : si hub-lecteur.js ne se charge
        // pas, la vidéo doit rester utilisable.
        return '<video src="' + String(url).replace(/"/g, '&quot;') + '"' + attrs +
               ' controls preload="metadata" playsinline></video>';
    }

    // ═══════════════════════════════════════════════════════
    // 5. SURVEILLER LE DOCUMENT
    // -------------------------------------------------------
    // Les pages fabriquent leurs cartes au fil de l'eau :
    // renderPosts() refait tout l'innerHTML, une modale s'ouvre,
    // une story s'affiche. Chercher dix points de branchement,
    // c'est dix occasions d'en oublier un — et une vidéo sur
    // deux garderait les commandes du navigateur.
    //
    // On observe donc le document : toute vidéo marquée
    // « hub-lecteur » qui apparaît est habillée, d'où qu'elle
    // vienne.
    // ═══════════════════════════════════════════════════════
    var _observateur = null;

    function surveiller(racine) {
        racine = racine || document.body;
        if (!racine || _observateur) return;

        activer(racine);                    // ce qui est déjà là

        if (typeof MutationObserver === 'undefined') return;
        _observateur = new MutationObserver(function (lots) {
            var aFaire = false;
            for (var i = 0; i < lots.length; i++) {
                if (lots[i].addedNodes && lots[i].addedNodes.length) { aFaire = true; break; }
            }
            if (!aFaire) return;
            // On groupe : renderPosts() ajoute cinquante nœuds
            // d'un coup, inutile de balayer cinquante fois.
            if (_observateur._minuteur) return;
            _observateur._minuteur = setTimeout(function () {
                _observateur._minuteur = null;
                activer(racine);
            }, 60);
        });
        _observateur.observe(racine, { childList: true, subtree: true });
    }

    function cesser() {
        if (!_observateur) return;
        if (_observateur._minuteur) clearTimeout(_observateur._minuteur);
        _observateur.disconnect();
        _observateur = null;
    }

    // On démarre tout seul : une page n'a qu'à charger ce
    // fichier et marquer ses vidéos.
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { surveiller(); });
        } else {
            surveiller();
        }
    }

    return {
        habiller: habiller,
        activer: activer,
        surveiller: surveiller,
        cesser: cesser,
        balise: balise,
        duree: duree,
        estHls: estHls
    };
})();
