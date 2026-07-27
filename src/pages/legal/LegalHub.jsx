import { Link, useNavigate } from 'react-router-dom'

const S = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  border: 'var(--color-border)',
}

const PAGES = [
  { to: '/legal/terms', icon: '📄', label: 'Terms & Conditions', desc: 'The rules for using the FitOS Member Portal' },
  { to: '/legal/privacy-policy', icon: '🔒', label: 'Privacy Policy', desc: 'What data we collect and how it\u2019s used' },
  { to: '/legal/refund-policy', icon: '💳', label: 'Refund Policy', desc: 'Our policy on plan and session payments' },
  { to: '/legal/cookie-policy', icon: '🍪', label: 'Cookie Policy', desc: 'How we use local storage and cookies' },
]

export default function LegalHub() {
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
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-lg" style={{ color: S.secondary }}>←</button>
        <h1 className="text-base font-bold tracking-tight" style={{ color: S.primary }}>Legal & policies</h1>
      </header>

      <div className="flex flex-col max-w-md gap-2.5 px-5 py-6 mx-auto">
        {PAGES.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="flex items-center justify-between p-4 card"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: S.primary }}>{p.label}</p>
                <p className="text-xs mt-0.5" style={{ color: S.secondary }}>{p.desc}</p>
              </div>
            </div>
            <span style={{ color: S.secondary }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
