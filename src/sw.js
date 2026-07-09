import { precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
self.clients.claim()

// vite-plugin-pwa (injectManifest strategy) replaces this with the real
// list of build assets to precache — same offline-shell behavior as the
// previous auto-generated service worker, just from a file we can also add
// custom event listeners to.
precacheAndRoute(self.__WB_MANIFEST)

// Note: no route is registered for /api/* — requests there simply aren't
// intercepted by this service worker at all, so they always go straight to
// the network with no caching, matching the previous NetworkOnly config.

/**
 * Push notifications
 *
 * The server sends a JSON payload (see pushNotification.service.js):
 *   { title, body, url, tag }
 * `url` is the in-app route to open when the notification is tapped.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'FitOS', body: event.data.text() }
  }

  const { title = 'FitOS', body = '', url = '/', tag = 'fitos-general' } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,               // notifications with the same tag replace each other
      renotify: true,     // ...but still alert the user on replacement
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    })
  )
})

/**
 * Tapping a notification focuses an already-open tab if one exists (and
 * navigates it to the right page), otherwise opens a new one.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_NAVIGATE', url: targetUrl })
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
