const SETTINGS_KEY = 'fitos_hydration_settings'

const DEFAULT_SETTINGS = {
  enabled: false,
  times: ['09:00', '11:30', '14:00', '16:30', '19:00'],
  tone: 'chime',
}

export function isValidTime(t) {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

/**
 * Local cache of hydration reminder settings, for instant paint on
 * revisit — same pattern as the theme preference (useTheme.js). The
 * server (see server/models/HydrationSchedule.js) is the source of truth
 * for `enabled`/`times` since that's what the reminder cron job reads;
 * `tone` lives here only, since it's purely a client-side playback choice.
 */
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
