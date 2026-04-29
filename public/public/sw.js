const CACHE_NAME = 'sokodeal-v1'
const urlsToCache = ['/', '/auth', '/publier', '/messages', '/profil']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  )
})

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'SokoDeal', {
      body: data.body || 'Vous avez un nouveau message !',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})