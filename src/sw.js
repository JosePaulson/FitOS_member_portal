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
  const isHydration = tag === 'hydration-reminder'

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        tag,               // notifications with the same tag replace each other
        renotify: true,     // ...but still alert the user on replacement
        icon:  '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
        // Alarm-style behavior for the hydration reminder specifically:
        // stay on screen until the member actually dismisses it (most
        // notifications auto-hide after a few seconds) and use a longer,
        // more insistent vibration pattern than a routine alert.
        ...(isHydration && {
          requireInteraction: true,
          vibrate: [300, 150, 300, 150, 300, 150, 300],
          actions: [{ action: 'dismiss', title: '✓ Got it' }],
        }),
      })

      // The hydration reminder is scheduled server-side (see
      // jobs/hydrationReminders.js) so it fires reliably even with the app
      // fully closed. As a bonus, when a tab does happen to be open
      // (foreground or background), tell it so it can ring the member's
      // selected tone on a loop — a real system notification can't carry
      // custom audio on most platforms, so this is the only place that
      // ringing alarm experience can actually happen.
      if (isHydration) {
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        for (const client of clientList) client.postMessage({ type: 'HYDRATION_REMINDER_FIRED' })
      }
    })()
  )
})

/**
 * Tapping a notification focuses an already-open tab if one exists (and
 * navigates it to the right page), otherwise opens a new one.
 *
 * The geofence "you're at the gym" notification (triggered client-side —
 * see GeofenceAttendancePrompt.jsx) additionally has a "Mark attendance"
 * action button. Clicking THAT skips navigation and instead tells the app
 * to run the check-in flow directly (or opens the app with a flag if it
 * isn't open at all), so the whole thing works as a single tap.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Hydration's "✓ Got it" action — just close it, same as tapping the OS
  // dismiss control. No need to launch the app for that.
  if (event.action === 'dismiss') return

  if (event.action === 'mark-attendance') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url)
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            client.postMessage({ type: 'MARK_ATTENDANCE_REQUESTED' })
            return client.focus()
          }
        }
        return self.clients.openWindow('/?markAttendance=1')
      })
    )
    return
  }

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
