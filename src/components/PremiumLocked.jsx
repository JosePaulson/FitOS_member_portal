import { useNavigate } from 'react-router-dom'

/**
 * Drops in wherever a premium-only feature would normally be — the AI
 * chat page, the "Scan a Meal" button, "Log a workout", "Add a photo" on
 * My Transformation, and the workout Videos tab. The wording is
 * intentional and consistent everywhere this appears.
 */
export default function PremiumLocked({ compact = false }) {
  const navigate = useNavigate()

  return (
    <div className={compact ? 'p-5 rounded-xl text-center' : 'flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl'}
      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
      <span className="block mb-2 text-3xl">🔒</span>
      <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
        Your membership plan expired, renew to experience premium benefits
      </p>
      <p className="text-[11px] mt-2" style={{ color: 'var(--color-secondary)' }}>
        Contact your gym directly for cash payments
      </p>
      <button onClick={() => navigate('/plans')}
        className="text-xs font-bold mt-4 px-4 py-2 rounded-lg transition-all"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
        Renew now
      </button>
    </div>
  )
}
