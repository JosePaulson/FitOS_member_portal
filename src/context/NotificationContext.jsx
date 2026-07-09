import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { pushApi } from '../api/index'

const Ctx = createContext(null)

function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Converts the VAPID public key (base64url string) into the Uint8Array
 * format the Push API's `applicationServerKey` option requires. */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

/**
 * Manages Web Push subscription state for the whole app — mounted once at
 * the root (see main.jsx) so Profile's notification toggle and any other
 * consumer always agree on the current subscribed/permission state.
 *
 * Also listens for messages posted by the service worker when a
 * notification is tapped while a tab is already open, and navigates there
 * with React Router instead of a full page reload.
 */
export function NotificationProvider({ children }) {
  const navigate = useNavigate()

  const [supported,  setSupported]  = useState(isSupported())
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Check current subscription state on mount
  useEffect(() => {
    if (!supported) { setLoading(false); return }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [supported])

  // Let a tapped notification (while the app is already open) navigate
  // in-app instead of the service worker doing a hard window.open reload
  useEffect(() => {
    if (!supported) return
    function handleMessage(event) {
      if (event.data?.type === 'NOTIFICATION_NAVIGATE' && event.data.url) {
        navigate(event.data.url)
      }
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [supported, navigate])

  const subscribe = useCallback(async () => {
    setError('')
    if (!supported) { setError('Notifications are not supported on this browser.'); return false }

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError(perm === 'denied'
          ? 'Notifications are blocked. Enable them in your browser settings to turn this on.'
          : 'Permission was not granted.')
        return false
      }

      const { data } = await pushApi.vapidPublicKey()
      if (!data.publicKey) {
        setError('Push notifications are not configured on the server yet.')
        return false
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })

      await pushApi.subscribe(sub.toJSON())
      setSubscribed(true)
      return true
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to enable notifications')
      return false
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    setError('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint).catch(() => {})
        await sub.unsubscribe()
      }
      setSubscribed(false)
      return true
    } catch (err) {
      setError(err.message || 'Failed to disable notifications')
      return false
    }
  }, [])

  const value = { supported, permission, subscribed, loading, error, subscribe, unsubscribe }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNotifications() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}
