/**
 * Bottom sheet with manual "Add to Home Screen" instructions for iOS Safari.
 * iOS has no beforeinstallprompt API, so this is the only way to guide users.
 * Shared between InstallPrompt (banner) and Profile (manual trigger).
 */
export default function IOSInstallSheet({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl p-6 pb-8 animate-fade-up"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'var(--color-border-strong)' }}
        />
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
          Install FitOS on iOS
        </h3>
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            Tap the <strong>Share</strong> icon <ShareGlyph /> in Safari's toolbar
          </Step>
          <Step n={2}>
            Scroll down and tap <strong>Add to Home Screen</strong>
          </Step>
          <Step n={3}>
            Tap <strong>Add</strong> in the top-right corner
          </Step>
        </ol>
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: 'rgba(200,241,53,0.15)', color: 'var(--color-accent)' }}
      >
        {n}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: 'var(--color-primary)' }}>
        {children}
      </span>
    </li>
  )
}

function ShareGlyph() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      style={{ display: 'inline', verticalAlign: '-2px', margin: '0 2px' }}
    >
      <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
