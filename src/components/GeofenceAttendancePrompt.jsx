import { useEffect, useRef, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { portalApi } from '../api/index'

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Shows a real OS/browser-level push notification — "📍 You're at the gym!"
 * — with a "Mark attendance" action button baked in, so a member can check
 * in straight from the notification tray without opening the app first.
 * Needs Notification permission already granted (the existing "Enable
 * notifications" toggle in Profile) — this never itself prompts for it, to
 * avoid ambushing the member mid-geofence-check.
 */
async function showGeofenceNotification() {
  if (!('serviceWorker' in navigator) || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification("📍 You're at the gym!", {
      body: `Mark your attendance for ${todayLabel()}`,
      tag: 'geofence-attendance',
      renotify: true,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      actions: [{ action: 'mark-attendance', title: '✅ Mark attendance' }],
      data: { url: '/profile#attendance' },
    })
  } catch { /* notification display isn't critical — the in-app modal still covers it */ }
}

/**
 * Mounted once in Layout, so it lives for the whole app session. As soon as
 * the app opens, if the gym has a location configured and the member hasn't
 * already checked in today, it silently checks the member's device location
 * — and if they're within the gym's geofence radius, surfaces both an
 * in-app prompt AND a real push notification (with a one-tap "Mark
 * attendance" action) to mark attendance. Never nags: permission denials,
 * being out of range, or already having checked in all just mean nothing
 * happens.
 */
export default function GeofenceAttendancePrompt() {
  const { gym } = useMemberAuth()
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [error, setError] = useState('')
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    if (!gym?.location?.lat || !gym?.location?.lng) return
    hasChecked.current = true

    ;(async () => {
      try {
        const { data } = await portalApi.attendanceToday()
        if (data.alreadyMarked) return

        const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
        const distance = distanceMeters(
          pos.coords.latitude, pos.coords.longitude,
          gym.location.lat, gym.location.lng
        )
        if (distance <= (gym.location.radiusMeters || 50)) {
          setVisible(true)
          showGeofenceNotification()
        }
      } catch {
        // Permission denied, timeout, or offline — just don't prompt. No
        // error shown; this is a convenience feature, not a requirement.
      }
    })()
  }, [gym])

  async function markAttendance() {
    setVisible(true)
    setStatus('submitting')
    setError('')
    try {
      const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      const { data } = await portalApi.attendanceCheckin(pos.coords.latitude, pos.coords.longitude)
      setStatus('success')
      setTimeout(() => setVisible(false), 1600)
      void data
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || 'Could not get your location — try again')
    }
  }

  // Tapping "Mark attendance" on the OS notification while the app is
  // already open — the service worker posts this message instead of just
  // navigating, so the check-in happens with a single tap.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    function handleMessage(event) {
      if (event.data?.type === 'MARK_ATTENDANCE_REQUESTED') markAttendance()
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])

  // Tapping the notification action when the app WASN'T open — the service
  // worker opens a fresh window with this flag instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('markAttendance') === '1') {
      params.delete('markAttendance')
      const rest = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''))
      markAttendance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  const today = todayLabel()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-sm p-6 text-center rounded-2xl animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {status === 'success' ? (
          <>
            <div className="mb-3 text-4xl">✅</div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Attendance marked!</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>See you at the gym 💪</p>
          </>
        ) : (
          <>
            <button onClick={() => setVisible(false)}
              className="absolute text-xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

            <div className="mb-3 text-4xl">📍</div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>You're at the gym!</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-secondary)' }}>
              Mark your attendance for
            </p>
            <p className="mt-0.5 mb-4 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
              {today}
            </p>

            {error && <p className="mb-3 text-xs" style={{ color: '#f87171' }}>{error}</p>}

            <button onClick={markAttendance} disabled={status === 'submitting'}
              className="w-full font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
              {status === 'submitting' ? 'Marking…' : '✅ Mark my attendance'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
