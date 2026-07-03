import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { ThemeToggle } from '../components/ui/Spinner'
import { useThemeContext } from '../context/ThemeContext'

export default function Login() {
  const { login } = useMemberAuth()
  const { isDark, toggle } = useThemeContext()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ subdomain: '', phone: '', pin: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)

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
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: 'var(--color-surface)' }}>

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
                  ← {form.subdomain}
                </button>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Phone number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone}
                    onChange={set('phone')} className="field-input" autoFocus />
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
    </div>
  )
}