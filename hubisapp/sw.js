// Début Service Worker HubISoccer
'use strict';

// Début événement push
self.addEventListener('push', (event) => {
    // Récupération des données de la notification
    const data = event.data?.json() || { title: 'HubISoccer', message: 'Nouvelle notification' };
    
    // Options d'affichage de la notification
    const options = {
        body: data.message || 'Vous avez une nouvelle notification.',
        icon: '/hubisoccer/hubisapp/img/logo-navbar.png',
        badge: '/hubisoccer/hubisapp/img/logo-navbar.png',
        data: {
            url: data.link || '/hubisoccer/hubisapp/authprive/users/login.html'
        },
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'HubISoccer', options)
    );
});
// Fin événement push

// Début événement notificationclick
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/hubisoccer/hubisapp/authprive/users/login.html';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
// Fin événement notificationclick

// Début événement pushsubscriptionchange
self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options)
            .then((subscription) => {
                console.log('Push subscription renewed:', subscription);
            })
    );
});
// Fin événement pushsubscriptionchange

// Fin Service Worker HubISoccer
