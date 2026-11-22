import { useEffect, useRef, useState } from 'react'
import { resetAppCachesAndReload } from '../lib/recovery'
import { SERVER_VERSION_EVENT } from '../lib/serverVersion'

// How often to look for a new build while the app is open AND visible. A hidden
// tab never checks (nobody is looking at it; it checks the moment it's shown).
const CHECK_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
// Coming back to the app re-checks, but never more often than this.
const MIN_GAP_MS = 5 * 60 * 1000 // 5 minutes
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Blocking "new version available" modal. Two independent things can
 * trigger it:
 *   1. A new member-portal build was deployed — detected by comparing this
 *      bundle's baked-in build version (__APP_VERSION__) against
 *      /version.json (a static file on the frontend host), fetched fresh
 *      (bypassing the service worker/HTTP cache) every 10 minutes while the
 *      app is visible, and when the app is reopened/refocused.
 *   2. The API server was redeployed/restarted — detected from the
 *      `X-Server-Version` header the API puts on every response (see
 *      lib/serverVersion.js): free, instant on the next request, zero extra
 *      traffic. If the server doesn't send that header yet, falls back to
 *      polling GET /api/version on the same slow schedule.
 * Either one means "the code running in this tab is stale" — the modal
 * blocks all interaction until the member taps Update, which resets every
 * cache this app could possibly be using (service worker, HTTP cache, and
 * this app's own localStorage data cache — see lib/recovery.js) and
 * force-reloads.
 */
export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState(null) // { version } | null
  const [updating, setUpdating] = useState(false)
  const serverVersionRef = useRef(null)   // first server version seen this session
  const headerSeenRef = useRef(false)     // true once the API has sent X-Server-Version
  const lastCheckRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    // Compare a server version against the one first seen this session.
    function observeServerVersion(version) {
      if (!version || cancelled) return
      if (serverVersionRef.current === null) serverVersionRef.current = version
      else if (version !== serverVersionRef.current) setUpdateInfo({ version })
    }

    async function check() {
      if (document.hidden) return // nobody's looking — check when they come back
      lastCheckRef.current = Date.now()

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

      // Backend check — only needed while the API isn't sending the header
      if (headerSeenRef.current) return
      try {
        const res = await fetch(`${API_BASE.replace(/\/api$/, '')}/api/version`, { cache: 'no-store' })
        if (res.ok) {
          const { version } = await res.json()
          observeServerVersion(version)
        }
      } catch { /* offline — skip */ }
    }

    function onServerVersion(e) {
      headerSeenRef.current = true
      observeServerVersion(e.detail)
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    // Catches an update that happened while the phone was locked/backgrounded —
    // but a quick app-switch back and forth shouldn't re-fetch each time.
    function onVisible() {
      if (document.visibilityState === 'visible' && Date.now() - lastCheckRef.current >= MIN_GAP_MS) check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(SERVER_VERSION_EVENT, onServerVersion)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(SERVER_VERSION_EVENT, onServerVersion)
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
