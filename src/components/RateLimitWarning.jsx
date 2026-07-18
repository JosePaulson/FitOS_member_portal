import { useEffect, useState, useRef } from 'react'

/**
 * Mounted once, globally (see Layout.jsx). Whenever any API call anywhere
 * in the app gets a 429, the axios interceptor dispatches a
 * 'fitos:rate-limited' event instead of logging the member out — this shows
 * a brief, dismissible warning banner in response.
 */
export default function RateLimitWarning() {
  const [message, setMessage] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    function onRateLimited(e) {
      setMessage(e.detail?.message || "You're doing that a bit too fast — please wait a moment and try again.")
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setMessage(null), 6000)
    }
    window.addEventListener('fitos:rate-limited', onRateLimited)
    return () => {
      window.removeEventListener('fitos:rate-limited', onRateLimited)
      clearTimeout(timerRef.current)
    }
  }, [])

  if (!message) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] flex justify-center px-4 pt-3 pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg pointer-events-auto animate-fade-up max-w-sm"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(251,191,36,0.3)' }}>
        <span className="text-base shrink-0">⏳</span>
        <p className="text-xs" style={{ color: 'var(--color-primary)' }}>{message}</p>
        <button onClick={() => { clearTimeout(timerRef.current); setMessage(null) }}
          className="ml-1 text-sm leading-none shrink-0" style={{ color: 'var(--color-secondary)' }}>×</button>
      </div>
    </div>
  )
}
