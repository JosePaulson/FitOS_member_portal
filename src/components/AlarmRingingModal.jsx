/**
 * Shown while a hydration alarm is actively ringing (see HydrationContext:
 * triggered when the service worker signals a hydration push arrived
 * while this tab is open). Mirrors a phone alarm clock's ringing screen —
 * big, hard to miss, and requires an explicit Dismiss or Snooze tap
 * rather than fading away on its own.
 */
export default function AlarmRingingModal({ onDismiss, onSnooze }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'rgba(13,13,13,0.97)' }}
      role="alertdialog"
      aria-label="Hydration reminder ringing"
    >
      <div className="text-7xl mb-6" style={{ animation: 'hydration-pulse 1s ease-in-out infinite' }}>
        🥛
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>Hydrate!</h2>
      <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.65)' }}>
        Time to drink a glass of water 💧
      </p>

      <button
        onClick={onDismiss}
        className="w-full max-w-xs font-bold py-4 rounded-xl text-base mb-3"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
      >
        Dismiss
      </button>
      <button
        onClick={() => onSnooze(5)}
        className="w-full max-w-xs font-semibold py-3 rounded-xl text-sm"
        style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
      >
        Snooze 5 min
      </button>

      <style>{`
        @keyframes hydration-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
