import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalApi } from '../api/index'
import Spinner from '../components/ui/Spinner'
import SignaturePad from '../components/SignaturePad'

const S = { primary: 'var(--color-primary)', secondary: 'var(--color-secondary)', accent: 'var(--color-accent)', border: 'var(--color-border)' }
const inputStyle = { background: 'transparent', border: `1px solid ${S.border}`, color: S.primary }
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Waiver() {
  const navigate = useNavigate()
  const [w, setW] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [answers, setAnswers] = useState(Array(7).fill(null))
  const [signedName, setSignedName] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [signature, setSignature] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // { parqFlagged }

  useEffect(() => {
    portalApi.waiver().then(({ data }) => setW(data)).catch((e) => setLoadError(e.response?.data?.message || 'Couldn\u2019t load the form. Please try again.'))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (answers.some((a) => a === null)) { setError('Please answer every health question with Yes or No.'); return }
    if (w.needsGuardian && !guardianName.trim()) { setError('A parent or guardian needs to sign for members under 18.'); return }
    if (signedName.trim().length < 2) { setError('Please type your full name to sign.'); return }
    if (!agreed) { setError('Please tick the box to confirm you agree.'); return }
    setSaving(true)
    try {
      const { data } = await portalApi.signWaiver({
        answers, signedName: signedName.trim(), guardianName: guardianName.trim() || undefined,
        signature: signature || undefined, agreed: true,
      })
      setDone(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn\u2019t save your form. Please try again.')
    } finally { setSaving(false) }
  }

  const Back = (
    <button onClick={() => navigate(-1)} className="self-start text-sm" style={{ color: S.secondary }}>← Back</button>
  )

  if (loadError) return <div className="flex flex-col gap-4 px-5 py-6">{Back}<p className="text-sm" style={{ color: '#f87171' }}>{loadError}</p></div>
  if (!w) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!w.enabled) {
    return (
      <div className="flex flex-col gap-4 px-5 py-6">{Back}
        <p className="text-sm" style={{ color: S.secondary }}>Your gym doesn't need a waiver from you right now.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 px-5 py-6">
        <div className="p-6 text-center card">
          <p className="text-3xl">✅</p>
          <p className="mt-2 text-lg font-bold" style={{ color: S.primary }}>Thanks — you're all set</p>
          <p className="mt-1 text-sm" style={{ color: S.secondary }}>Your signed waiver has been saved with your gym.</p>
        </div>
        {done.parqFlagged && (
          <p className="p-3 text-sm rounded-xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
            You answered “Yes” to a health question. Please check with your doctor before you start training, and let your trainer know.
          </p>
        )}
        <button onClick={() => navigate('/', { replace: true })} className="w-full py-3 text-sm font-bold rounded-xl" style={{ background: S.accent, color: '#0D0D0D' }}>Back to home</button>
      </div>
    )
  }

  if (w.current) {
    return (
      <div className="flex flex-col gap-4 px-5 py-6">{Back}
        <div className="p-5 card">
          <p className="font-semibold" style={{ color: S.accent }}>✓ Waiver signed</p>
          <p className="mt-1 text-sm" style={{ color: S.secondary }}>You signed on {fmt(w.signedAt)}. Nothing more to do.</p>
        </div>
        {w.parqFlagged && (
          <p className="p-3 text-sm rounded-xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
            You answered “Yes” to a health question. Please check with your doctor before training.
          </p>
        )}
      </div>
    )
  }

  const anyYes = answers.some((a) => a === true)
  return (
    <form onSubmit={submit} className="flex flex-col gap-5 px-5 py-6">
      {Back}
      <div>
        <h1 className="text-xl font-bold" style={{ color: S.primary }}>Health form &amp; waiver</h1>
        <p className="mt-1 text-sm" style={{ color: S.secondary }}>
          {w.signed ? 'The waiver wording has been updated — please read and sign again.' : `Please complete this once for ${w.gymName}.`}
        </p>
      </div>

      {error && <p className="px-3 py-2 text-sm rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{error}</p>}

      <div className="flex flex-col gap-4 p-5 card">
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Health questionnaire</p>
        {w.questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p className="text-sm leading-snug" style={{ color: S.primary }}>{i + 1}. {q}</p>
            <div className="flex gap-2">
              {[['Yes', true], ['No', false]].map(([label, val]) => {
                const on = answers[i] === val
                return (
                  <button type="button" key={label}
                    onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? val : x)))}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl"
                    style={{
                      border: `1px solid ${on ? (val ? 'rgba(248,113,113,0.5)' : S.accent) : S.border}`,
                      background: on ? (val ? 'rgba(248,113,113,0.12)' : 'rgba(200,241,53,0.12)') : 'transparent',
                      color: on ? (val ? '#f87171' : S.accent) : S.secondary,
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {anyYes && <p className="text-xs" style={{ color: '#fbbf24' }}>A “Yes” means you should speak to a doctor before starting. You can still submit this form.</p>}
      </div>

      <div className="flex flex-col gap-2 p-5 card">
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Waiver</p>
        <div className="overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap" style={{ maxHeight: 220, color: S.secondary }}>{w.text}</div>
      </div>

      <div className="flex flex-col gap-3 p-5 card">
        {w.needsGuardian && (
          <>
            <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Parent / guardian name</label>
            <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="px-3 py-2.5 text-sm rounded-xl" style={inputStyle} placeholder="Required for members under 18" />
          </>
        )}
        <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>{w.needsGuardian ? 'Member\u2019s full name' : 'Type your full name to sign'}</label>
        <input value={signedName} onChange={(e) => setSignedName(e.target.value)} className="px-3 py-2.5 text-sm rounded-xl" style={inputStyle} placeholder={w.memberName} />
        <SignaturePad onChange={setSignature} />
        <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: S.secondary }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
          I have read the waiver and agree to it, and my health answers are true.
        </label>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center justify-center w-full gap-2 py-3.5 text-sm font-bold rounded-xl disabled:opacity-60"
        style={{ background: S.accent, color: '#0D0D0D' }}>
        {saving && <Spinner size="sm" />}{saving ? 'Saving…' : 'Sign & submit'}
      </button>
    </form>
  )
}
