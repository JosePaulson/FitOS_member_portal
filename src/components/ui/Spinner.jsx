// ── Spinner ───────────────────────────────────────────────────────────────
export default function Spinner({ size = 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4 border' : 'w-8 h-8 border-2'
  return (
    <div
      className={`${cls} rounded-full animate-spin`}
      style={{ borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-accent)' }}
    />
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'lime' }) {
  const styles = {
    lime: { background: 'rgba(200,241,53,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(200,241,53,0.25)' },
    red: { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' },
    yellow: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' },
    muted: { background: 'var(--color-surface-3)', color: 'var(--color-secondary)', border: '1px solid var(--color-border)' },
    blue: { background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' },
  }
  return (
    <span className="badge" style={styles[color] || styles.muted}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}

// ── SectionTitle ──────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <h2 className="mb-4 text-lg font-bold tracking-tight"
      style={{ color: 'var(--color-primary)' }}>
      {children}
    </h2>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center py-14">
      <span className="text-4xl">{icon}</span>
      <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>{title}</p>
      {sub && <p className="max-w-xs text-sm" style={{ color: 'var(--color-secondary)' }}>{sub}</p>}
    </div>
  )
}

// ── Status helpers ─────────────────────────────────────────────────────────
export function membershipBadge(status) {
  const map = {
    active: ['lime', '✓ Active'],
    expired: ['red', 'Expired'],
    paused: ['yellow', 'Paused'],
    cancelled: ['muted', 'Cancelled'],
  }
  return map[status] || ['muted', status]
}

export function invoiceBadge(status) {
  const map = {
    paid: ['lime', 'Paid'],
    pending: ['yellow', 'Pending'],
    overdue: ['red', 'Overdue'],
    cancelled: ['muted', 'Cancelled'],
    refunded: ['blue', 'Refunded'],
  }
  return map[status] || ['muted', status]
}

// ── ThemeToggle ───────────────────────────────────────────────────────────
export function ThemeToggle({ isDark, onToggle, className = '' }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${className}`}
      style={{
        background: isDark ? 'rgba(200,241,53,0.15)' : 'rgba(0,0,0,0.08)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none select-none">
        🌙
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none select-none">
        ☀️
      </span>
      {/* Knob */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs font-bold"
        style={{
          left: isDark ? '2px' : 'calc(100% - 26px)',
          background: isDark ? '#C8F135' : '#ffffff',
          color: isDark ? '#0D0D0D' : '#555',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
