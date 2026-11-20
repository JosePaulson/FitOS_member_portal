import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'

/**
 * Auto-renew switch. Be straight with the member about what it does: a few days
 * before the plan ends we get the renewal ready and remind them — they still
 * tap to pay. Nothing is ever charged without them confirming.
 */
export default function AutoRenewToggle({ compact = false }) {
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { portalApi.autoRenew().then(({ data }) => setInfo(data)).catch(() => setInfo(null)) }, [])
  if (!info) return null

  async function toggle() {
    setBusy(true); setError('')
    try { const { data } = await portalApi.setAutoRenew(!info.enabled); setInfo(data) }
    catch (e) { setError(e.response?.data?.message || 'Couldn\u2019t change that. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <div className={compact ? '' : 'p-4 card'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Auto-renew reminders</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-secondary)' }}>
            {info.canEnable
              ? `${info.leadDays} days before your plan ends we'll get your renewal ready and remind you to pay in one tap. You always confirm the payment — nothing is charged automatically.`
              : 'Available once you have a membership plan.'}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={info.enabled} disabled={busy || !info.canEnable} onClick={toggle}
          className="relative shrink-0 rounded-full disabled:opacity-50"
          style={{ width: 44, height: 26, background: info.enabled ? 'var(--color-accent)' : 'var(--color-border)', transition: 'background .2s' }}>
          <span style={{ position: 'absolute', top: 3, left: info.enabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: info.enabled ? '#0D0D0D' : '#fff', transition: 'left .2s' }} />
        </button>
      </div>
      {error && <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
