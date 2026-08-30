const SETTINGS_KEY = 'fitos_hydration_settings'
const FIRED_KEY     = 'fitos_hydration_fired'

const DEFAULT_SETTINGS = {
  enabled: false,
  times: ['09:00', '11:30', '14:00', '16:30', '19:00'],
  tone: 'chime',
}

export function isValidTime(t) {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

/** Reads saved hydration reminder settings from localStorage (device-local, same pattern as the theme preference). */
export function loadHydrationSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      enabled: !!parsed.enabled,
      times: Array.isArray(parsed.times) && parsed.times.length
        ? [...new Set(parsed.times.filter(isValidTime))].sort()
        : [...DEFAULT_SETTINGS.times],
      tone: typeof parsed.tone === 'string' ? parsed.tone : DEFAULT_SETTINGS.tone,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveHydrationSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* storage unavailable (private browsing etc.) — setting just won't persist */ }
}

/**
 * Tracks which reminder times have already fired today, so a 20-second
 * poll tick doesn't re-fire the same slot repeatedly within its minute,
 * and reopening the app later the same day doesn't replay reminders that
 * already happened while it was closed.
 */
export function loadFiredToday() {
  try {
    const raw = localStorage.getItem(FIRED_KEY)
    if (!raw) return { date: '', times: [] }
    const parsed = JSON.parse(raw)
    return { date: parsed.date || '', times: Array.isArray(parsed.times) ? parsed.times : [] }
  } catch {
    return { date: '', times: [] }
  }
}

export function markFired(dateKey, time) {
  const current = loadFiredToday()
  const times = current.date === dateKey ? [...current.times, time] : [time]
  saveFiredToday({ date: dateKey, times })
}

function saveFiredToday(state) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(state))
  } catch { /* best-effort */ }
}
