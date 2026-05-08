// ========== DEBUT : sw.js – URL Propres HubISoccer ==========
const URL_MAP = {
  // ========== RACINE ==========
  '/': '/index.html',
  '/index': '/index.html',

  // ========== PAGES PUBLIQUES ==========
  '/actualites': '/public/actualites.html',
  '/processus': '/public/processus.html',
  '/affiliation': '/public/affiliation.html',
  '/premier-pas': '/public/premier-pas.html',
  '/acteurs': '/public/acteurs.html',
  '/artiste-adhesion': '/public/artiste-adhesion.html',
  '/scouting': '/public/scouting.html',
  '/esp': '/public/esp.html',
  '/contact': '/public/contact.html',
  '/market': '/public/e-marketing-hubisoccer.html',
  '/communaute-hub': '/public/hub-community.html',
  '/tournoi': '/public/tournoi.html',
  '/clubs': '/public/nos-clubs/presentation/clubs.html',
  '/fiche-club': '/public/nos-clubs/presentation/fiche-club.html',
  '/classement': '/public/classement.html',
  '/composer-equipe': '/public/composer-equipe.html',
  '/connexion-tournoi': '/public/connexion-tournoi.html',
  '/createur-affiche': '/public/createur_affiche.html',
  '/createur-logo': '/public/createur_logo.html',
  '/dashboard-tournoi': '/public/dashboard-tournoi.html',
  '/faq': '/public/faq.html',
  '/gerer-equipe': '/public/gerer-equipe.html',
  '/hubisoccer-designer': '/public/hubisoccer-designer.html',
  '/match-details': '/public/match-details.html',
  '/matchs': '/public/matchs.html',
  '/mentions-legales': '/public/mentions-legales.html',
  '/messagerie-privee': '/public/messagerie-privee.html',
  '/messagerie-publique': '/public/messagerie-publique.html',
  '/partenaires': '/public/partenaires.html',
  '/portefeuille': '/public/portefeuille.html',
  '/premier-pas-login': '/public/premier-pas-login.html',
  '/profil-scouting': '/public/profil-scouting.html',
  '/resultats': '/public/resultats.html',
  '/suivi-acteur': '/public/suivi-acteur.html',
  '/suivi': '/public/suivi.html',
  '/test-ecrit': '/public/test-ecrit.html',
  '/test-pratique': '/public/test-pratique.html',
  '/verify': '/public/verify.html',
  '/cgu': '/public/cgu.html',
  '/acteurs-login': '/public/acteurs-login.html',
  '/affilie-login': '/public/affilie-login.html',
  '/artistes-login': '/public/artistes-login.html',
  '/artiste-suivi': '/public/artiste-suivi.html',

  // ========== GESTION CLUBS (PUBLIC) ==========
  '/coach-contrat': '/public/nos-clubs/gestion/coach-contrat.html',
  '/coach-dash': '/public/nos-clubs/gestion/coach-dash.html',
  '/coach-messages': '/public/nos-clubs/gestion/coach-messages.html',
  '/coach-performances': '/public/nos-clubs/gestion/coach-performances.html',
  '/coach-presences': '/public/nos-clubs/gestion/coach-presences.html',
  '/nos-clubs-login': '/public/nos-clubs/gestion/nos-clubs-login.html',
  '/parrain-club': '/public/nos-clubs/gestion/parrain-club.html',
  '/parrain-contrat': '/public/nos-clubs/gestion/parrain-contrat.html',
  '/parrain-dash': '/public/nos-clubs/gestion/parrain-dash.html',
  '/parrain-messages': '/public/nos-clubs/gestion/parrain-messages.html',
  '/talent-contrat': '/public/nos-clubs/gestion/talent-contrat.html',
  '/talent-dash': '/public/nos-clubs/gestion/talent-dash.html',
  '/talent-messages': '/public/nos-clubs/gestion/talent-messages.html',

  // ========== ADMINISTRATION PUBLIQUE ==========
  '/admin': '/public/admin/administration.html',
  '/admin/acteurs': '/public/admin/acteurs-admin/acteurs-admin.html',
  '/admin/actualites': '/public/admin/actualites-admin/actualites-admin.html',
  '/admin/affiliation': '/public/admin/affiliation-admin/affiliation-admin.html',
  '/admin/artistes': '/public/admin/artistes-admin/artistes-admin.html',
  '/admin/cgu': '/public/admin/cgu-admin/cgu-admin.html',
  '/admin/community': '/public/admin/community-admin/community-admin.html',
  '/admin/contact': '/public/admin/contact-admin/contact-admin.html',
  '/admin/design-affiche': '/public/admin/design-admin/admin-affiche.html',
  '/admin/design-designer': '/public/admin/design-admin/admin-designer.html',
  '/admin/design-logo': '/public/admin/design-admin/admin-logo.html',
  '/admin/emarket': '/public/admin/emarket-admin/emarket-admin.html',
  '/admin/faq': '/public/admin/faq-admin/faq-admin.html',
  '/admin/index': '/public/admin/index-admin/index-admin.html',
  '/admin/matchs': '/public/admin/matchs-admin/matchs-admin.html',
  '/admin/mentions-legales': '/public/admin/mentions-legales-admin/mentions-legales-admin.html',
  '/admin/messages': '/public/admin/messages-admin/messages-admin.html',
  '/admin/nos-clubs/presentation': '/public/admin/nos-clubs-admin/presentation/gestion-clubs.html',
  '/admin/nos-clubs/gestion/contrats-signatures': '/public/admin/nos-clubs-admin/gestion/gestion-contrats-signatures.html',
  '/admin/nos-clubs/gestion/contrats-templates': '/public/admin/nos-clubs-admin/gestion/gestion-contrats-templates.html',
  '/admin/nos-clubs/gestion/inscriptions': '/public/admin/nos-clubs-admin/gestion/gestion-inscriptions.html',
  '/admin/nos-clubs/gestion/messages': '/public/admin/nos-clubs-admin/gestion/gestion-messages.html',
  '/admin/nos-clubs/gestion/performances': '/public/admin/nos-clubs-admin/gestion/gestion-performances.html',
  '/admin/nos-clubs/gestion/presences': '/public/admin/nos-clubs-admin/gestion/gestion-presences.html',
  '/admin/partenaires': '/public/admin/partenaires-admin/partenaires-admin.html',
  '/admin/premier-pas': '/public/admin/premierpas-admin/premier-pas-admin.html',
  '/admin/processus': '/public/admin/processus-admin/processus-admin.html',
  '/admin/scouting': '/public/admin/scouting-admin/scouting-admin.html',
  '/admin/test-ecrit': '/public/admin/test-ecrit-admin/test-ecrit-admin.html',
  '/admin/test-pratique': '/public/admin/test-pratique-admin/test-pratique-admin.html',
  '/admin/tournoi': '/public/admin/tournoi-admin/tournoi-admin.html',
  '/admin/transactions': '/public/admin/transactions-admin/transactions-admin.html',

  // ========== AUTHENTIFICATION PRIVÉE ==========
  '/login': '/hubisapp/authprive/users/login.html',
  '/signup': '/hubisapp/authprive/users/signup.html',
  '/reset-password': '/hubisapp/authprive/users/reset-password.html',
  '/update-password': '/hubisapp/authprive/users/update-password.html',
  '/role-select': '/hubisapp/authprive/users/role-select.html',
  '/authprive/admin/dashboard': '/hubisapp/authprive/admin/admin-dashboard.html',
  '/authprive/admin/users': '/hubisapp/authprive/admin/admin-users.html',
  '/authprive/admin/logs': '/hubisapp/authprive/admin/admin-logs.html',
  '/authprive/admin/ids': '/hubisapp/authprive/admin/admin-ids.html',

  // ========== FOOTBALLEUR ==========
  '/footballeur/dashboard': '/hubisapp/footballeur/dashboard/foot-dash.html',
  '/footballeur/profil': '/hubisapp/footballeur/profile-edit/foot-profile.html',
  '/footballeur/cv': '/hubisapp/footballeur/edit-cv/foot-cv.html',
  '/footballeur/verification': '/hubisapp/footballeur/verification/foot-verif.html',
  '/footballeur/certifications': '/hubisapp/footballeur/certifications/foot-certif.html',
  '/footballeur/scouting': '/hubisapp/footballeur/scouting/foot-scout.html',
  '/footballeur/transferts': '/hubisapp/footballeur/transferts/foot-transfert.html',
  '/footballeur/videos': '/hubisapp/footballeur/videos/foot-videos.html',
  '/footballeur/revenus': '/hubisapp/footballeur/revenus/foot-revenus.html',
  '/footballeur/revenus-setup': '/hubisapp/footballeur/revenus/foot-revenus-setup.html',
  '/footballeur/settings': '/hubisapp/footballeur/settings/foot-settings.html',
  // Admin footballeur
  '/footballeur/admin/dashboard': '/hubisapp/footballeur/admin-foot/dashboard/admin-foot-dash.html',
  '/footballeur/admin/certifications': '/hubisapp/footballeur/admin-foot/certifications/admin-foot-certif.html',
  '/footballeur/admin/cv': '/hubisapp/footballeur/admin-foot/cv/admin-foot-cv.html',
  '/footballeur/admin/revenus': '/hubisapp/footballeur/admin-foot/revenus/admin-foot-revenus.html',
  '/footballeur/admin/scouting': '/hubisapp/footballeur/admin-foot/scouting/admin-foot-scout.html',
  '/footballeur/admin/transferts': '/hubisapp/footballeur/admin-foot/transferts/admin-foot-transferts.html',
  '/footballeur/admin/verifications': '/hubisapp/footballeur/admin-foot/verifications/admin-foot-verif.html',
  '/footballeur/admin/videos': '/hubisapp/footballeur/admin-foot/videos/admin-foot-videos.html',

  // ========== BASKETTEUR ==========
  '/basketteur/dashboard': '/hubisapp/basketteur/dashboard/basket-dash.html',
  '/basketteur/revenus': '/hubisapp/basketteur/revenus/basket-revenus.html',
  '/basketteur/revenus-setup': '/hubisapp/basketteur/revenus/basket-revenus-setup.html',

  // ========== COACH ==========
  '/coach/dashboard': '/hubisapp/coach/dashboard/coach-dash.html',
  '/coach/revenus': '/hubisapp/coach/revenus/coach-revenus.html',
  '/coach/revenus-setup': '/hubisapp/coach/revenus/coach-revenus-setup.html',

  // ========== AGENT ==========
  '/agent/dashboard': '/hubisapp/agent/dashboard/agent-dash.html',
  '/agent/commissions': '/hubisapp/agent/commissions/agent-commissions.html',
  '/agent/commissions-setup': '/hubisapp/agent/commissions/agent-commissions-setup.html',

  // ========== ACADÉMIE ==========
  '/academie/dashboard': '/hubisapp/academie/dashboard/academie-dash.html',
  '/academie/revenus': '/hubisapp/academie/revenus/academie-revenus.html',
  '/academie/revenus-setup': '/hubisapp/academie/revenus/academie-revenus-setup.html',

  // ========== PARRAIN ==========
  '/parrain/dashboard': '/hubisapp/parrain/dashboard/parrain-dash.html',
  '/parrain/dons': '/hubisapp/parrain/dons/parrain-dons.html',
  '/parrain/dons-setup': '/hubisapp/parrain/dons/parrain-dons-setup.html',

  // ========== SHARED – COMMUNAUTÉ ==========
  '/communaute/feed': '/hubisapp/shared/community/feed.html',
  '/communaute/live': '/hubisapp/shared/community/live.html',
  '/communaute/notifications': '/hubisapp/shared/community/notifications.html',
  '/communaute/post-view': '/hubisapp/shared/community/post-view.html',
  '/communaute/profil-feed': '/hubisapp/shared/community/profil-feed.html',
  '/communaute/search': '/hubisapp/shared/community/search.html',
  '/communaute/settings-feed': '/hubisapp/shared/community/settings-feed.html',
  '/communaute/stories': '/hubisapp/shared/community/stories.html',
  '/communaute/stories-view': '/hubisapp/shared/community/stories-view.html',

  // ========== SHARED – MESSAGERIE ==========
  '/messagerie/conversation': '/hubisapp/shared/messagerie/conversation.html',
  '/messagerie/discuss': '/hubisapp/shared/messagerie/discuss.html',
  '/messagerie/profil-msg': '/hubisapp/shared/messagerie/profil-msg.html',
  '/messagerie/settings-msg': '/hubisapp/shared/messagerie/settings-msg.html',

  // ========== SHARED – TOURNOI ==========
  '/gestion-tournoi': '/hubisapp/shared/gestion-tournoi/acceuil-gt.html',
  '/suivi-tournoi': '/hubisapp/shared/suivi-tournoi/suivi-tournoi.html',

  // ========== PAGE DE CONSTRUCTION ==========
  '/construction': '/hubisapp/shared/construction.html'
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // On n'intercepte que les requêtes vers notre propre domaine
  if (url.origin !== location.origin) return;

  // Construire le chemin propre (sans index.html)
  let path = url.pathname;
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);  // Supprimer le slash final
  }

  // Si une correspondance est trouvée, servir le fichier réel
  if (URL_MAP[path]) {
    const realPath = URL_MAP[path];
    event.respondWith(
      fetch(realPath).then(response => {
        // Cloner la réponse pour pouvoir modifier les en-têtes
        const newHeaders = new Headers(response.headers);
        // S'assurer que le type MIME est correct pour le HTML
        newHeaders.set('Content-Type', 'text/html; charset=UTF-8');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }).catch(() => {
        // En cas d'échec, renvoyer la page 404
        return fetch('/404.html');
      })
    );
    return;
  }

  // Laisser les autres requêtes (images, CSS, JS, etc.) suivre leur cours normal
});
// ========== FIN : sw.js ==========
