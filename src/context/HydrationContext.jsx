import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { istDateKey, istTimeOfDay } from '../lib/dateIST'
import { loadHydrationSettings, saveHydrationSettings, isValidTime, loadFiredToday, markFired } from '../lib/hydrationSettings'
import { playHydrationTone, HYDRATION_TONES } from '../lib/hydrationTones'

const Ctx = createContext(null)

function isSupported() {
  return 'serviceWorker' in navigator && typeof Notification !== 'undefined'
}

/**
 * Shows the OS/browser-level "Hydrate!" notification directly via the
 * service worker — no server round-trip needed, same technique
 * GeofenceAttendancePrompt uses for its local "you're at the gym" alert.
 * Requires Notification permission already granted; never prompts itself.
 */
async function showHydrateNotification() {
  if (!isSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('🥛 Hydrate!', {
      body: 'Time to drink a glass of water 💧',
      tag: 'hydration-reminder',
      renotify: true,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/profile#hydration' },
    })
  } catch { /* notification display isn't critical — the in-app chime still covers the foreground case */ }
}

/**
 * Manages hydration reminder settings (enabled/times/tone) plus the alarm
 * loop that checks — roughly every 20 seconds, in IST wall-clock time,
 * same convention the rest of the app uses for schedules — whether "now"
 * matches one of the saved reminder times and hasn't already fired today.
 *
 * Settings live in localStorage (device-local, same pattern as the theme
 * preference) rather than the server, since this is a personal on-device
 * alarm, not something that needs to sync across a member's devices.
 *
 * Caveat, stated plainly rather than hidden: this loop only runs while a
 * FitOS tab is open (foreground or backgrounded) — standard web platform
 * APIs have no reliable way to wake a fully-closed tab/PWA on a schedule.
 * Keeping the app installed and open in the background gives the most
 * consistent results.
 */
export function HydrationProvider({ children }) {
  const [settings, setSettings] = useState(loadHydrationSettings)
  const [permission, setPermission] = useState(isSupported() ? Notification.permission : 'unsupported')
  const [error, setError] = useState('')
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const persist = useCallback((next) => {
    setSettings(next)
    saveHydrationSettings(next)
  }, [])

  const enable = useCallback(async () => {
    setError('')
    if (!isSupported()) {
      setError('Notifications are not supported on this browser.')
      return false
    }
    let perm = Notification.permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
      setPermission(perm)
    }
    if (perm !== 'granted') {
      setError(perm === 'denied'
        ? 'Notifications are blocked. Enable them in your browser settings to turn this on.'
        : 'Permission was not granted.')
      return false
    }
    persist({ ...settingsRef.current, enabled: true })
    return true
  }, [persist])

  const disable = useCallback(() => {
    persist({ ...settingsRef.current, enabled: false })
  }, [persist])

  const addTime = useCallback((time) => {
    if (!isValidTime(time)) return false
    if (settingsRef.current.times.includes(time)) return false
    const times = [...settingsRef.current.times, time].sort()
    persist({ ...settingsRef.current, times })
    return true
  }, [persist])

  const removeTime = useCallback((time) => {
    const times = settingsRef.current.times.filter((t) => t !== time)
    persist({ ...settingsRef.current, times })
  }, [persist])

  const setTone = useCallback((tone) => {
    persist({ ...settingsRef.current, tone })
  }, [persist])

  const previewTone = useCallback((toneId) => {
    playHydrationTone(toneId || settingsRef.current.tone)
  }, [])

  // The alarm loop itself.
  useEffect(() => {
    function tick() {
      const current = settingsRef.current
      if (!current.enabled || current.times.length === 0) return

      const now = new Date()
      const nowKey = istDateKey(now)
      const nowHHMM = istTimeOfDay(now)

      const fired = loadFiredToday()
      const alreadyFiredTimes = fired.date === nowKey ? fired.times : []

      if (current.times.includes(nowHHMM) && !alreadyFiredTimes.includes(nowHHMM)) {
        markFired(nowKey, nowHHMM)
        showHydrateNotification()
        playHydrationTone(current.tone)
      }
    }

    tick() // covers reopening the app during an alarm minute that already ticked once elsewhere
    const id = setInterval(tick, 20000)
    return () => clearInterval(id)
  }, [])

  const value = {
    supported: isSupported(),
    permission,
    enabled: settings.enabled,
    times: settings.times,
    tone: settings.tone,
    tones: HYDRATION_TONES,
    error,
    enable,
    disable,
    addTime,
    removeTime,
    setTone,
    previewTone,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHydration() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHydration must be used inside <HydrationProvider>')
  return ctx
}
