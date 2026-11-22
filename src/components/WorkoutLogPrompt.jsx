import { useEffect, useRef, useState } from 'react'

const S = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
  surface2: 'var(--color-surface-2)',
}

/**
 * One bottom sheet for both "you have finished exercises that aren't logged
 * yet" moments:
 *   mode="close"  — member tapped ✕ in the video player after logging some
 *                   exercises: Log workout (primary) / Continue workout / Discard
 *   mode="resume" — app opened with an unfinished workout saved on the device:
 *                   Continue workout (primary) / Log workout / Discard
 * Both offer an optional body-weight field that goes onto the workout log.
 *
 * onLog(bodyWeightKg | undefined) must return a promise and throw on failure —
 * the error is shown here and the workout stays safely on the device. On
 * success this shows "Workout logged" for a moment, then calls onLogged().
 */
export default function WorkoutLogPrompt({
  mode, exerciseCount, categories = [], startedAt, allowContinue = true,
  onLog, onContinue, onDiscard, onLogged,
}) {
  const [kg, setKg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [logged, setLogged] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const resume = mode === 'resume'
  const countText = `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}`
  const when = startedAt
    ? new Date(startedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
    : null

  async function handleLog() {
    let weight
    if (kg !== '') {
      weight = Number(kg)
      if (!(weight >= 20 && weight <= 400)) { setError('Enter your weight in kg (20–400).'); return }
    }
    setBusy(true); setError('')
    try {
      await onLog(weight)
      setLogged(true)
      timer.current = setTimeout(onLogged, 1200)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response
          ? 'Couldn’t log your workout. It’s still saved on this device — try again.'
          : 'No connection — your workout is saved on this device. Try again when you’re online.')
      )
      setBusy(false)
    }
  }

  async function handleDiscard() {
    if (!confirmDiscard) { setConfirmDiscard(true); return }
    setBusy(true); setError('')
    try { await onDiscard() }
    catch { setError('Couldn’t discard right now. Try again.'); setBusy(false) }
  }

  const primaryStyle = { background: S.accent, color: '#0D0D0D' }
  const secondaryStyle = { background: S.surface2, color: S.primary, border: `1px solid ${S.border}` }
  const logBtn = (style) => (
    <button key="log" onClick={handleLog} disabled={busy}
      className="w-full py-3 text-sm font-bold transition-all rounded-xl disabled:opacity-50 active:scale-[0.98]" style={style}>
      {busy && !confirmDiscard ? 'Logging…' : 'Log workout'}
    </button>
  )
  const continueBtn = (style) => allowContinue && (
    <button key="continue" onClick={onContinue} disabled={busy}
      className="w-full py-3 text-sm font-bold transition-all rounded-xl disabled:opacity-50 active:scale-[0.98]" style={style}>
      Continue workout
    </button>
  )

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div role="dialog" aria-modal="true"
        className="relative w-full p-5 sm:max-w-sm rounded-t-2xl sm:rounded-2xl animate-fade-up"
        style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
        {logged ? (
          <div className="py-6 text-center">
            <span className="block mb-2 text-4xl">✅</span>
            <p className="text-base font-bold" style={{ color: S.primary }}>Workout logged</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold" style={{ color: S.primary }}>
              {resume ? 'Unfinished workout' : 'Log your workout?'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: S.secondary }}>
              {resume
                ? <>You finished {countText}{categories.length ? <> ({categories.join(', ')})</> : null}{when ? <> on {when}</> : null} but didn’t log {exerciseCount === 1 ? 'it' : 'them'}.</>
                : <>You’ve finished {countText}{categories.length ? <> ({categories.join(', ')})</> : null}. Log {exerciseCount === 1 ? 'it' : 'them'} now, or keep going?</>}
            </p>

            <div className="mt-4">
              <label className="block mb-1.5 text-xs font-semibold" style={{ color: S.secondary }}>⚖️ Body weight (optional)</label>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="decimal" min="20" max="400" step="0.1"
                  value={kg} onChange={(e) => setKg(e.target.value)} placeholder="e.g. 72.5" disabled={busy}
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={{ background: S.surface2, border: `1px solid ${S.border}`, color: S.primary }} />
                <span className="text-xs" style={{ color: S.secondary }}>kg</span>
              </div>
            </div>

            {error && (
              <p className="px-3 py-2 mt-3 text-xs rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 mt-4">
              {resume || !allowContinue
                ? <>{continueBtn(primaryStyle)}{logBtn(allowContinue ? secondaryStyle : primaryStyle)}</>
                : <>{logBtn(primaryStyle)}{continueBtn(secondaryStyle)}</>}
              <button onClick={handleDiscard} disabled={busy}
                className="w-full py-2 text-xs font-semibold disabled:opacity-50"
                style={{ color: confirmDiscard ? '#f87171' : S.secondary }}>
                {confirmDiscard ? 'Tap again to discard' : 'Discard'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
