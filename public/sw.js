const CACHE_NAME = 'kasmate-shell-v2';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/assets/kasmate-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Real OS Push Notification receiver (runs even when app is closed)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'KasMate',
    body: 'Check your class dues in KasMate.',
    tag: 'kasmate-general',
    url: '/?page=payments',
    page: 'payments',
    silent: true,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag,
      renotify: true,
      silent: payload.silent !== false,
      data: {
        url: payload.url || '/?page=payments',
        page: payload.page || 'payments',
      },
    })
  );
});

// Deep-link to Payments or Home when user taps the OS notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetPage = data.page || 'payments';
  const targetUrl = data.url || `/?page=${targetPage}`;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'KASMATE_NAVIGATE',
              page: targetPage,
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

// Periodic background sync on supported mobile browsers
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kasmate-periodic-push') {
    event.waitUntil(
      fetch('/api/push/trigger-scheduled', { method: 'POST' }).catch(
        () => undefined
      )
    );
  }
});

// Allow direct SW notification dispatch when device subscription falls back locally
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_OS_NOTIFICATION') {
    const { title, body, tag, page } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'KasMate', {
        body: body || '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: tag || `kasmate-${Date.now()}`,
        renotify: true,
        silent: true,
        data: {
          page: page || 'payments',
          url: `/?page=${page || 'payments'}`,
        },
      })
    );
  }
});
