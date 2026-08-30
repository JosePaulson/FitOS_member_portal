import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { isMemberActive } from '../lib/membership'

/**
 * Shows once per app open (Layout only mounts once per session, so this
 * naturally doesn't re-appear on every internal page navigation) when the
 * member's membership isn't active. Closable without paying — "Renew now"
 * just takes them to the existing Plans page, which already has the full
 * plan list + payment flow, rather than duplicating that here.
 */
export default function MembershipExpiredModal() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || isMemberActive(member)) return null

  return (
    <div className="fixed inset-0 z-[997] flex items-end justify-center px-0 sm:items-center sm:px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={() => setDismissed(true)}
          className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>
          ×
        </button>

        <div className="text-center">
          <span className="block mb-3 text-4xl">⚠️</span>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
            Your membership has expired
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-secondary)' }}>
            Renew now to keep full access to AI Coach, meal scanning, workout logging, videos, and more.
          </p>
        </div>

        <button onClick={() => { setDismissed(true); navigate('/plans') }}
          className="w-full font-bold py-3.5 rounded-xl text-sm transition-all mt-6"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          Renew now
        </button>
        <button onClick={() => setDismissed(true)}
          className="w-full text-center text-xs font-semibold mt-3 py-2"
          style={{ color: 'var(--color-secondary)' }}>
          Not now
        </button>
      </div>
    </div>
  )
}
