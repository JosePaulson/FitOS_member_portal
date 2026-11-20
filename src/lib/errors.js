/**
 * Error messages for the UI.
 *
 *   development (Vite dev server) → technical text: what the server/browser actually said
 *   production                    → plain language only; never raw server, database,
 *                                   library or browser wording
 *
 * Wired into axios (see api/axios.js), so nearly every screen is covered
 * automatically: by the time an error reaches a component, `err.message` and
 * `err.response.data.message` are already safe for the current environment.
 * Use getErrorMessage() for anything that isn't an axios call.
 */

// `import.meta.env` doesn't exist outside Vite (e.g. when this file is unit-tested in Node).
export const IS_DEV = (() => { try { return !!(import.meta.env && import.meta.env.DEV) } catch { return false } })()

export const GENERIC = 'Something went wrong on our side. Please try again in a moment.'
export const NETWORK = 'We can\u2019t reach the server. Please check your internet connection and try again.'
export const TIMEOUT = 'That took too long. Please check your connection and try again.'
const BY_STATUS = {
  401: 'Please sign in again.',
  403: 'You don\u2019t have permission to do that.',
  404: 'We couldn\u2019t find that.',
  408: TIMEOUT,
  413: 'That is too large to upload.',
  429: 'Too many attempts. Please wait a moment and try again.',
}

// Belt and braces: even a 4xx message from the server is dropped if it looks like internals.
const TECHNICAL_LOOKING = /Cast to|E11000|Cannot read|Cannot set|node_modules|mongo|ECONN|ETIMEDOUT|\.env\b|API_?KEY|Unexpected token|Request failed with status code|Network Error|at .*\.js:\d+|\bundefined\b|\bObjectId\b|Path `|TypeError|ReferenceError|SyntaxError|\bstack\b/i

/**
 * Pure: classify any error and say what to show.
 * @returns {{ kind: 'network'|'timeout'|'server'|'client'|'unknown', status?: number, user: string, technical: string, message: string, reference?: string }}
 */
export function describeError(err, dev = false) {
  const res = err?.response
  const status = res?.status
  const data = res?.data
  const serverMsg = typeof data?.message === 'string' ? data.message.trim() : ''
  const reference = typeof data?.reference === 'string' ? data.reference : undefined
  const isHtml = typeof data === 'string' && /<\s*html/i.test(data) // a proxy/CDN error page

  let kind, user
  if (!res) {
    const timeout = err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''))
    if (err?.isAxiosError || err?.request) { kind = timeout ? 'timeout' : 'network'; user = timeout ? TIMEOUT : NETWORK }
    else { kind = 'unknown'; user = GENERIC }
  } else if (status >= 500 || isHtml) {
    kind = 'server'
    // The server only sends plain-language text in production, so keep its specific wording (e.g. "The AI coach couldn't reply"); fall back if it looks technical.
    user = !isHtml && serverMsg && !TECHNICAL_LOOKING.test(serverMsg) ? serverMsg : GENERIC
  } else {
    kind = 'client'
    user = serverMsg && !TECHNICAL_LOOKING.test(serverMsg) ? serverMsg : (BY_STATUS[status] || 'That didn\u2019t work. Please check and try again.')
  }

  const technical = `${serverMsg || err?.message || 'Unknown error'}${status ? ` [HTTP ${status}]` : ''}${typeof err?.code === 'string' ? ` (${err.code})` : ''}`
  const shown = kind === 'server' && reference ? `${user} (Ref: ${reference})` : user
  return { kind, status, user: shown, technical, message: dev ? technical : shown, reference }
}

/** For axios: make the error safe for whatever shows it. Idempotent (a retried request passes through twice). */
export function normalizeAxiosError(err, dev = IS_DEV) {
  if (!err || typeof err !== 'object' || err.__normalized) return err
  const info = describeError(err, dev)
  err.__normalized = true
  err.userMessage = info.user
  err.technicalMessage = info.technical
  err.message = info.message                           // anything that prints err.message is now safe
  if (!dev && err.response) {
    const d = err.response.data
    if (d && typeof d === 'object' && !Array.isArray(d)) d.message = info.user
    else err.response.data = { message: info.user }    // HTML/text bodies never reach the UI
  }
  if (dev) console.debug('[API error]', info.technical, err)
  return err
}

/** Message for any caught error. `fallback` is used in production when the error isn't a network/API one. */
export function getErrorMessage(err, fallback = GENERIC) {
  const info = describeError(err, IS_DEV)
  if (!IS_DEV && info.kind === 'unknown') return err?.userMessage || fallback
  return info.message
}

/** Browser push-subscription failures (DOMException wording is technical: "Registration failed - push service error"). */
export function pushErrorMessage(err, fallback = 'We couldn\u2019t turn on notifications. Please try again.') {
  if (err?.response) return getErrorMessage(err, fallback)           // our own server said no
  const friendly =
    err?.name === 'NotAllowedError' ? 'Notifications are blocked. Allow them in your browser or phone settings, then try again.'
    : err?.name === 'AbortError' || err?.name === 'InvalidStateError' ? 'We couldn\u2019t connect to the notification service. Please try again in a moment.'
    : fallback
  return IS_DEV ? `${friendly} [${err?.name || 'Error'}: ${err?.message || 'unknown'}]` : friendly
}

/** Geolocation failures (GeolocationPositionError / "Geolocation not supported"). */
export function geoErrorMessage(err, fallback = 'We couldn\u2019t get your location. Please try again.') {
  if (err?.response) return getErrorMessage(err, fallback)
  const friendly =
    err?.code === 1 ? 'Location access is turned off. Allow location for this app in your settings to mark attendance.'
    : err?.code === 2 ? 'We couldn\u2019t work out where you are. Try moving to an open area and try again.'
    : err?.code === 3 ? 'Finding your location took too long. Please try again.'
    : /not supported/i.test(String(err?.message || '')) ? 'This device or browser can\u2019t share its location.'
    : fallback
  return IS_DEV ? `${friendly} [${err?.name || 'Error'}${err?.code ? ` ${err.code}` : ''}: ${err?.message || 'unknown'}]` : friendly
}
