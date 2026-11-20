import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { portalApi } from '../api/index'

/** Nudge on Home until the member has signed the current waiver. Renders nothing if the gym doesn't use one. */
export default function WaiverBanner() {
  const [w, setW] = useState(null)
  useEffect(() => { portalApi.waiver().then(({ data }) => setW(data)).catch(() => setW(null)) }, [])

  if (!w?.enabled || w.current) return null
  return (
    <Link to="/waiver" className="flex items-center justify-between gap-3 p-4 rounded-2xl"
      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
          📝 {w.signed ? 'Please sign the updated waiver' : 'Complete your health form & waiver'}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-secondary)' }}>Takes about a minute — required before you start training.</p>
      </div>
      <span className="text-lg" style={{ color: '#fbbf24' }}>›</span>
    </Link>
  )
}
