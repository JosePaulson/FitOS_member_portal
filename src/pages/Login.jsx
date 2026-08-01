import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { ThemeToggle } from '../components/ui/Spinner'
import { useThemeContext } from '../context/ThemeContext'
import { useInstallPrompt } from '../context/InstallPromptContext'
import InstallPrompt from '../components/InstallPrompt'
import { fingerprintLoginAvailable, loginWithFingerprint } from '../lib/webauthn'

const LAST_GYM_KEY = 'fitos_last_gym_subdomain'
const LAST_PHONE_KEY = 'fitos_last_phone'

export default function Login() {
  const { login, loginWithData } = useMemberAuth()
  const { isDark, toggle } = useThemeContext()
  const { showBanner, showIOSBanner } = useInstallPrompt()
  const navigate = useNavigate()

  const rememberedGym = (() => { try { return localStorage.getItem(LAST_GYM_KEY) || '' } catch { return '' } })()
  const rememberedPhone = (() => { try { return localStorage.getItem(LAST_PHONE_KEY) || '' } catch { return '' } })()

  // Skip straight to phone/PIN when we already know the gym — no need to
  // ask again on the same device.
  const [step, setStep] = useState(rememberedGym ? 1 : 0)
  const [form, setForm] = useState({ subdomain: rememberedGym, phone: rememberedPhone, pin: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)

  const [fingerprintSupported, setFingerprintSupported] = useState(false)
  const [fingerprintBusy, setFingerprintBusy] = useState(false)

  useEffect(() => {
    fingerprintLoginAvailable().then(setFingerprintSupported)
  }, [])

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (step === 0) {
      if (!form.subdomain.trim()) { setError('Enter your gym ID'); return }
      setStep(1); return
    }
    if (!form.phone || !form.pin) { setError('Enter your phone and PIN'); return }
    setLoading(true)
    try {
      await login(form.subdomain, form.phone, form.pin)
      try { localStorage.setItem(LAST_PHONE_KEY, form.phone) } catch { /* ignore */ }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  async function handleFingerprintLogin() {
    setError('')
    if (!form.subdomain.trim() || !form.phone.trim()) {
      setError('Enter your gym ID and phone number first')
      return
    }
    setFingerprintBusy(true)
    try {
      const data = await loginWithFingerprint(form.subdomain, form.phone)
      loginWithData(data)
      try { localStorage.setItem(LAST_PHONE_KEY, form.phone) } catch { /* ignore */ }
      navigate('/', { replace: true })
    } catch (err) {
      if (err?.name === 'NotAllowedError') {
        // The person cancelled the fingerprint prompt — not a real error.
      } else {
        setError(err.response?.data?.message || 'Fingerprint login failed — try your PIN instead')
      }
    } finally { setFingerprintBusy(false) }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6"
      style={{
        background: 'var(--color-surface)',
        // Reserve room at the bottom so the fixed install banner (when
        // shown) never overlaps the "Sign in" button on shorter phones.
        // Matches the banner's own footprint: ~16px gap above safe-area
        // + ~150px banner height (icon row + full-width button + padding).
        paddingBottom: (showBanner || showIOSBanner)
          ? 'calc(env(safe-area-inset-bottom, 0px) + 190px)'
          : undefined,
      }}>

      {/* Theme toggle — top right */}
      <div className="absolute top-5 right-5">
        <ThemeToggle isDark={isDark} onToggle={toggle} />
      </div>

      {/* Glow */}
      <div className="absolute top-0 -translate-x-1/2 rounded-full pointer-events-none left-1/2 w-80 h-80"
        style={{ background: 'radial-gradient(circle, var(--glow-lime) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
            Fit<span style={{ color: 'var(--color-accent)' }}>OS</span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-secondary)' }}>Member Portal</p>
        </div>

        <div className="card p-7">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {['Your gym', 'Sign in'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 text-xs font-bold transition-all rounded-full"
                  style={{
                    background: i < step ? 'var(--color-accent)' : 'transparent',
                    color: i < step ? '#0D0D0D' : i === step ? 'var(--color-accent)' : 'var(--color-secondary)',
                    border: i < step ? 'none' : `1px solid ${i === step ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                  }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs" style={{ color: i === step ? 'var(--color-primary)' : 'var(--color-secondary)' }}>{s}</span>
                {i < 1 && <div className="w-8 h-px" style={{ background: 'var(--color-border-strong)' }} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 py-3 mb-5 text-sm rounded-lg"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 0 ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Gym ID</label>
                  <input type="text" placeholder="e.g. ironzone" value={form.subdomain}
                    onChange={set('subdomain')} className="field-input" autoFocus autoComplete="off" />
                  <p className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>Ask your gym for their FitOS Gym ID</p>
                </div>
                <button type="submit" className="w-full py-3 mt-1 font-bold transition-all rounded-lg"
                  style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                  Continue →
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setStep(0); setError('') }}
                  className="flex items-center gap-1.5 text-sm mb-1 transition-colors"
                  style={{ color: 'var(--color-secondary)' }}>
                  ← {form.subdomain} <span style={{ color: 'var(--color-accent)' }}>· change</span>
                </button>

                {fingerprintSupported && (
                  <>
                    <button
                      type="button"
                      onClick={handleFingerprintLogin}
                      disabled={fingerprintBusy}
                      className="flex items-center justify-center w-full gap-2 py-3 mt-1 text-sm font-semibold transition-all border rounded-lg disabled:opacity-60"
                      style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                    >
                      <FingerprintIcon />
                      {fingerprintBusy ? 'Checking…' : 'Sign in with fingerprint'}
                    </button>
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px" style={{ background: 'var(--color-border-strong)' }} />
                      <span className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>or use your PIN</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--color-border-strong)' }} />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Phone number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone}
                    onChange={set('phone')} className="field-input" autoFocus={!fingerprintSupported} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>PIN</label>
                  <div className="relative">
                    <input type={showPin ? 'text' : 'password'} placeholder="4–6 digit PIN"
                      value={form.pin} onChange={set('pin')} maxLength={6}
                      className="pr-12 field-input" inputMode="numeric" />
                    <button type="button" onClick={() => setShowPin((v) => !v)}
                      className="absolute text-xs -translate-y-1/2 right-3 top-1/2"
                      style={{ color: 'var(--color-secondary)' }}>
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>
                    Your gym staff sets your PIN. Contact them if you need help.
                  </p>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 mt-1 font-bold transition-all rounded-lg disabled:opacity-60"
                  style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      <p className="relative max-w-sm mt-6 text-xs text-center" style={{ color: 'var(--color-secondary)' }}>
        By continuing, you agree to our{' '}
        <Link to="/legal/terms" className="underline" style={{ color: 'var(--color-secondary)' }}>Terms</Link>
        {' '}&{' '}
        <Link to="/legal/privacy-policy" className="underline" style={{ color: 'var(--color-secondary)' }}>Privacy Policy</Link>.
      </p>

      <InstallPrompt withTabBar={false} />
    </div>
  )
}

function FingerprintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 11c.5 2 .5 4.5-1 7" />
      <path d="M8.5 19c1.5-2 2-4.5 2-6a1.5 1.5 0 0 1 3 0" />
      <path d="M5 15.5c.7-1.5 1-3 1-4.5a6 6 0 0 1 11 3.5" />
      <path d="M3.5 12a8.5 8.5 0 0 1 15-5.4" />
      <path d="M17 4.5A8.5 8.5 0 0 1 20.5 12c0 1 0 2-.5 3.5" />
      <path d="M9 4.8A8.4 8.4 0 0 1 12 4.3" />
    </svg>
  )
}
