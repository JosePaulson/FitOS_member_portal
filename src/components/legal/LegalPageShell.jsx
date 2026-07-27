import { useNavigate, Link } from 'react-router-dom'

const S = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
}

/**
 * Shared shell for the /legal/* pages — works whether the person is
 * signed in or not, so it can be linked from both the pre-login screen
 * and the in-app Profile page. Renders its own back button + title
 * rather than relying on the authenticated app's tab-bar Layout.
 */
export default function LegalPageShell({ title, updated, children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5"
        style={{
          height: 'calc(56px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'var(--color-surface)',
          borderBottom: `1px solid ${S.border}`,
        }}
      >
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/legal'))}
          aria-label="Back"
          className="text-lg"
          style={{ color: S.secondary }}
        >
          ←
        </button>
        <h1 className="text-base font-bold tracking-tight" style={{ color: S.primary }}>{title}</h1>
      </header>

      <div className="max-w-2xl px-5 py-8 mx-auto">
        {updated && (
          <p className="mb-6 text-xs" style={{ color: S.secondary }}>Last updated: {updated}</p>
        )}
        <div className="legal-prose flex flex-col gap-5" style={{ color: S.primary }}>
          {children}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-8 mt-8 text-xs" style={{ borderTop: `1px solid ${S.border}` }}>
          <Link to="/legal/terms" className="underline" style={{ color: S.secondary }}>Terms & Conditions</Link>
          <Link to="/legal/privacy-policy" className="underline" style={{ color: S.secondary }}>Privacy Policy</Link>
          <Link to="/legal/refund-policy" className="underline" style={{ color: S.secondary }}>Refund Policy</Link>
          <Link to="/legal/cookie-policy" className="underline" style={{ color: S.secondary }}>Cookie Policy</Link>
        </div>
      </div>
    </div>
  )
}

export function H2({ children }) {
  return <h2 className="mt-2 text-base font-bold" style={{ color: S.primary }}>{children}</h2>
}

export function P({ children }) {
  return <p className="text-sm leading-relaxed" style={{ color: S.secondary }}>{children}</p>
}

export function Ul({ children }) {
  return <ul className="flex flex-col gap-1.5 pl-5 text-sm list-disc leading-relaxed" style={{ color: S.secondary }}>{children}</ul>
}
