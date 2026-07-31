/* TwoMC service worker — push notifications */

self.addEventListener('push', (event) => {
  let data = { title: 'TwoMC', body: '', url: '/profile/notifications' };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TwoMC', {
      body: data.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/profile/notifications' },
      tag: data.tag,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/profile/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
