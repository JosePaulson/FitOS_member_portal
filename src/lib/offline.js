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
 * True when a request failed because it never reached the server — offline,
 * DNS failure, timeout, dropped connection, service worker with no network
 * route, etc. False when the server actually responded (401, 404, 500...),
 * which is a real error, not a connectivity problem.
 */
export function isNetworkError(err) {
  return !err?.response
}
