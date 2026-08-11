import { useEffect, useRef, useState } from 'react'
import { resetAppCachesAndReload } from '../lib/recovery'

const CHECK_INTERVAL_MS = 60000 // 1 minute
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Blocking "new version available" modal. Two independent things can
 * trigger it:
 *   1. A new member-portal build was deployed — detected by comparing this
 *      bundle's baked-in build version (__APP_VERSION__) against
 *      /version.json, fetched fresh (bypassing the service worker/HTTP
 *      cache) every minute.
 *   2. The API server was redeployed/restarted — detected by polling
 *      GET /api/version and watching for it to change from what we first
 *      observed this session.
 * Either one means "the code running in this tab is stale" — the modal
 * blocks all interaction until the member taps Update, which resets every
 * cache this app could possibly be using (service worker, HTTP cache, and
 * this app's own localStorage data cache — see lib/recovery.js) and
 * force-reloads.
 */
export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null) // { version } | null
  const [updating, setUpdating] = useState(false)
  const serverVersionRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      // Frontend build check
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (res.ok) {
          const { version } = await res.json()
          if (version && version !== __APP_VERSION__ && !cancelled) {
            setUpdateInfo({ version })
            return
          }
        }
      } catch { /* offline — just skip this round, no harm */ }

      // Backend server check
      try {
        const res = await fetch(`${API_BASE.replace(/\/api$/, '')}/api/version`, { cache: 'no-store' })
        if (res.ok) {
          const { version } = await res.json()
          if (version) {
            if (serverVersionRef.current === null) {
              serverVersionRef.current = version
            } else if (version !== serverVersionRef.current && !cancelled) {
              setUpdateInfo({ version })
            }
          }
        }
      } catch { /* offline — skip */ }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    // Also check right away whenever the tab regains focus — catches an
    // update that happened while the phone was locked/backgrounded.
    function onVisible() { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  async function handleUpdate() {
    setUpdating(true)
    await resetAppCachesAndReload()
  }

  if (!updateInfo) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm p-6 text-center rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="mb-3 text-4xl">🚀</div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>New update available</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>new version: {updateInfo.version}</p>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-secondary)' }}>
          Please update to keep using FitOS — this only takes a second.
        </p>
        <button onClick={handleUpdate} disabled={updating}
          className="w-full font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-5"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          {updating ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  )
}
