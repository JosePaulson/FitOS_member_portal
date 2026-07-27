import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'fitos_member_cookie_consent'

function readConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * First-visit cookie/local-storage consent banner. Sits at the very top
 * of the viewport (rather than the bottom) so it never fights the fixed
 * install-app banner or bottom tab bar for space.
 *
 * FitOS Member Portal is a PWA that relies on browser local storage —
 * not third-party tracking cookies — for sign-in sessions, your saved
 * preferences (like theme), and offline caching of your workout/PT data
 * for a faster experience. There's no advertising/analytics tracking
 * today; "Essential only" and "Accept all" behave the same right now,
 * but the choice is recorded so we can honor it if that ever changes —
 * see the Cookie Policy for details.
 */
export default function CookieConsentBanner() {
  const [consent, setConsent] = useState(() => readConsent())

  function decide(analytics) {
    const value = { essential: true, analytics, decidedAt: new Date().toISOString() }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* ignore */ }
    setConsent(value)
  }

  if (consent) return null

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] px-4 py-3"
      style={{
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        background: 'var(--color-surface-2)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
      role="region"
      aria-label="Cookie consent"
    >
      <div className="flex flex-col items-start justify-between max-w-md gap-2.5 mx-auto sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
          We use essential local storage to keep you signed in and make the app work offline.{' '}
          <Link to="/legal/cookie-policy" className="underline" style={{ color: 'var(--color-primary)' }}>
            Cookie Policy
          </Link>
        </p>
        <div className="flex items-center flex-shrink-0 w-full gap-2 sm:w-auto">
          <button
            onClick={() => decide(false)}
            className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
          >
            Essential only
          </button>
          <button
            onClick={() => decide(true)}
            className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
            style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
