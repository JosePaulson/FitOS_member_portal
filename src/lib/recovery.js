import { clearAppDataCache } from './offline'

/**
 * The one "something's stale, wipe it and start fresh" recovery path. Two
 * different triggers lead here — UpdateChecker (a new deploy is out) and
 * ErrorBoundary (the app just crashed) — but they're really the same
 * underlying problem: code and/or cached data on this device no longer
 * matches what the current app expects, so the safest fix is to clear
 * everything this app could possibly have cached and reload clean.
 *
 * Clears service workers, the Cache Storage API, and this app's own
 * localStorage data cache (fitos:cache:* — see offline.js) — but
 * deliberately leaves the member's login session and unrelated
 * preferences (theme, cookie consent) untouched, so recovering from a
 * glitch doesn't also sign them out or reset settings that had nothing
 * to do with it.
 */
export async function resetAppCachesAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    // best-effort — reload below regardless
  }
  clearAppDataCache()
  // Cache-busting query param, in case anything still tries to serve a
  // stale HTTP-cached response despite the clearing above.
  window.location.href = window.location.pathname + '?_v=' + Date.now()
}
