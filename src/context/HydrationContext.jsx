import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { hydrationApi } from '../api/index'
import { loadHydrationSettings, saveHydrationSettings, isValidTime } from '../lib/hydrationSettings'
import { playHydrationTone, playAlarmLoop, stopAlarmLoop, HYDRATION_TONES } from '../lib/hydrationTones'
import AlarmRingingModal from '../components/AlarmRingingModal'

const Ctx = createContext(null)

function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'
}

/**
 * Hydration ("drink water") reminders.
 *
 * `enabled`/`times` are owned by the server (see
 * server/models/HydrationSchedule.js + jobs/hydrationReminders.js): a cron
 * job checks every minute and sends a real Web Push notification for any
 * matching time. That's what lets reminders fire even with the PWA fully
 * closed — Web Push wakes the service worker independently of whether any
 * tab is open, unlike a client-side setInterval loop, which only runs
 * while a FitOS tab is open. This context just mirrors that server state
 * for the UI and pushes edits back.
 *
 * `tone` stays local-only (localStorage) — the server can trigger a
 * notification, but it can't make an arbitrary device ring a custom sound
 * for it (most platforms don't support custom system-notification audio
 * at all). Instead, whenever a hydration push happens to arrive while a
 * tab is open, this context rings the selected tone on a loop — a real
 * alarm, not one chime — via a full-screen ringing overlay with
 * Dismiss/Snooze, until the member acts on it. See the `message` listener
 * below and the matching postMessage in sw.js.
 */
export function HydrationProvider({ children }) {
  const cached = loadHydrationSettings()
  const [enabled, setEnabledState] = useState(cached.enabled)
  const [times, setTimes] = useState(cached.times)
  const [tone, setTone] = useState(cached.tone)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const initializedRef = useRef(false)

  // Server is the source of truth for enabled/times — load it on mount and
  // reconcile with the local cache that was rendered instantly above.
  useEffect(() => {
    hydrationApi.get()
      .then(({ data }) => {
        setEnabledState(!!data.enabled)
        setTimes(Array.isArray(data.times) ? data.times : [])
      })
      .catch(() => { /* offline or a hiccup — keep showing the local cache */ })
      .finally(() => {
        setLoading(false)
        initializedRef.current = true
      })
  }, [])

  // Mirror to localStorage for instant paint next visit.
  useEffect(() => {
    saveHydrationSettings({ enabled, times, tone })
  }, [enabled, times, tone])

  // Push enabled/times to the server whenever they actually change (after
  // the initial load above has run, so we don't immediately PUT back the
  // exact values we just GET-ed).
  useEffect(() => {
    if (!initializedRef.current) return
    setSaving(true)
    setError('')
    hydrationApi.update({ enabled, times })
      .catch((err) => setError(err.response?.data?.message || 'Failed to save — check your connection and try again'))
      .finally(() => setSaving(false))
  }, [enabled, times])

  const enable = useCallback(() => {
    if (!isSupported()) {
      setError('Notifications are not supported on this browser.')
      return false
    }
    setError('')
    setEnabledState(true)
    return true
  }, [])

  const disable = useCallback(() => {
    setEnabledState(false)
  }, [])

  const addTime = useCallback((time) => {
    if (!isValidTime(time)) return false
    let added = false
    setTimes((prev) => {
      if (prev.includes(time)) return prev
      added = true
      return [...prev, time].sort()
    })
    return added
  }, [])

  const removeTime = useCallback((time) => {
    setTimes((prev) => prev.filter((t) => t !== time))
  }, [])

  const previewTone = useCallback((toneId) => {
    playHydrationTone(toneId || tone)
  }, [tone])

  // ── The ringing alarm itself ──────────────────────────────────────────
  const [ringing, setRinging] = useState(false)
  const snoozeTimerRef = useRef(null)
  const toneRef = useRef(tone)
  toneRef.current = tone

  const startAlarm = useCallback(() => {
    playAlarmLoop(toneRef.current)
    setRinging(true)
  }, [])

  const dismissAlarm = useCallback(() => {
    stopAlarmLoop()
    setRinging(false)
    if (snoozeTimerRef.current) {
      clearTimeout(snoozeTimerRef.current)
      snoozeTimerRef.current = null
    }
  }, [])

  const snoozeAlarm = useCallback((minutes = 5) => {
    stopAlarmLoop()
    setRinging(false)
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current)
    // Client-side only — like the ring itself, this needs the tab to stay
    // open for the snooze to actually go off, since it's just a delayed
    // re-trigger rather than a new server-scheduled push.
    snoozeTimerRef.current = setTimeout(startAlarm, minutes * 60 * 1000)
  }, [startAlarm])

  // Rings whenever a hydration push arrives while this tab is open
  // (foreground or background) — the server-sent notification itself
  // still shows regardless (see sw.js), this is the "long, ringing"
  // experience layered on top when the app happens to be open.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    function handleMessage(event) {
      if (event.data?.type === 'HYDRATION_REMINDER_FIRED') startAlarm()
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [startAlarm])

  // Stop any ring in flight if the provider ever unmounts (app closing the
  // tab, hot-reload, etc.) — don't leave audio scheduled with no UI to
  // dismiss it.
  useEffect(() => () => {
    stopAlarmLoop()
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current)
  }, [])

  const value = {
    supported: isSupported(),
    permission: isSupported() ? Notification.permission : 'unsupported',
    enabled,
    times,
    tone,
    tones: HYDRATION_TONES,
    loading,
    saving,
    error,
    enable,
    disable,
    addTime,
    removeTime,
    setTone,
    previewTone,
    ringing,
    dismissAlarm,
    snoozeAlarm,
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      {ringing && <AlarmRingingModal onDismiss={dismissAlarm} onSnooze={snoozeAlarm} />}
    </Ctx.Provider>
  )
}

export function useHydration() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHydration must be used inside <HydrationProvider>')
  return ctx
}
