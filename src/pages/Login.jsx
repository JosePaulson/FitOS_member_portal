import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'

export default function Login() {
  const { login } = useMemberAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)   // 0 = gym, 1 = phone+pin
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
      setStep(1)
      return
    }
    if (!form.phone || !form.pin) { setError('Enter your phone and PIN'); return }
    setLoading(true)
    try {
      await login(form.subdomain, form.phone, form.pin)
      // navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-black">
      {/* Background glow */}
      <div className="absolute top-0 -translate-x-1/2 rounded-full pointer-events-none left-1/2 w-96 h-96 opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(200,241,53,0.15) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="text-4xl font-black tracking-tight">
            Fit<span className="text-lime">OS</span>
          </div>
          <p className="mt-2 text-sm text-muted">Member Portal</p>
        </div>

        <div className="bg-card border border-white/[0.08] rounded-2xl p-7">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Your gym', 'Sign in'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${i < step ? 'bg-lime text-black' :
                  i === step ? 'border border-lime text-lime' :
                    'border border-white/10 text-muted'
                  }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-cream' : 'text-muted'}`}>{s}</span>
                {i < 1 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 py-3 mb-5 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 0 ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">Gym ID</label>
                  <input
                    type="text" placeholder="e.g. ironzone"
                    value={form.subdomain} onChange={set('subdomain')}
                    className="field-input" autoFocus autoComplete="off"
                  />
                  <p className="text-[11px] text-muted">Ask your gym for their FitOS Gym ID</p>
                </div>
                <button type="submit"
                  className="w-full py-3 mt-1 font-bold text-black transition-all rounded-lg bg-lime hover:bg-lime-dark">
                  Continue →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => { setStep(0); setError('') }}
                    className="text-sm transition-colors text-muted hover:text-cream">
                    ← {form.subdomain}
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">Phone number</label>
                  <input
                    type="tel" placeholder="+91 98765 43210"
                    value={form.phone} onChange={set('phone')}
                    className="field-input" autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">PIN</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="4–6 digit PIN"
                      value={form.pin} onChange={set('pin')}
                      maxLength={6}
                      className="pr-12 field-input"
                      inputMode="numeric"
                    />
                    <button type="button" onClick={() => setShowPin((v) => !v)}
                      className="absolute text-xs -translate-y-1/2 right-3 top-1/2 text-muted hover:text-cream">
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">Your gym staff sets your PIN. Contact them if you need help.</p>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 mt-1 font-bold text-black transition-all rounded-lg bg-lime hover:bg-lime-dark disabled:opacity-60">
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
