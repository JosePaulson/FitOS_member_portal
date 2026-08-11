const PREFIX = 'fitos:cache:'

/** Reads a cached value written by writeCache(). Returns null if missing/corrupt. */
export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Persists a value to localStorage as the "last known good" copy for `key`. */
export function writeCache(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(PREFIX + key)
    } else {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    }
  } catch {
    // localStorage full/unavailable (e.g. private browsing) — safe to ignore,
    // it just means this session won't have offline data.
  }
}

/**
 * Removes every "last known good" entry this app has ever cached — used
 * when picking up a new deploy, or recovering from a crash, since either
 * one means whatever's cached might no longer match what the current code
 * expects to find there. Deliberately narrow (only this app's own
 * `fitos:cache:` entries) rather than a blanket localStorage.clear(), so
 * it doesn't also sign the member out or reset unrelated preferences
 * (theme, cookie consent) that have nothing to do with the problem.
 */
export function clearAppDataCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // localStorage unavailable — nothing to clear anyway
  }
}

/**
 * True when a request failed because it never reached the server — offline,
 * DNS failure, timeout, dropped connection, service worker with no network
 * route, etc. False when the server actually responded (401, 404, 500...),
 * which is a real error, not a connectivity problem.
 */
export function isNetworkError(err) {
  return !err?.response
}
