import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner from './ui/Spinner'
import { fmtISTDateTime } from '../lib/dateIST'

function exerciseSummary(ex) {
  const parts = []
  if (ex.sets) parts.push(`${ex.sets} sets`)
  if (ex.reps) parts.push(`× ${ex.reps}`)
  if (ex.weight) parts.push(`@ ${ex.weight}kg`)
  return parts.join(' ')
}

/**
 * Two-step picker layered on top of the workout log form: first choose a
 * past entry — either a self-logged workout or a PT session — then choose
 * which of its exercises to copy into the log currently being built.
 *
 * `logs` (past workout logs) is passed in as-is since the form already has
 * it. Past PT sessions aren't otherwise loaded on this tab, so they're
 * fetched here, lazily, the first time this picker opens.
 */
export default function CopyExercisesModal({ logs, onClose, onCopy }) {
  const [ptSessions, setPtSessions] = useState(null) // null = still loading
  const [ptError, setPtError] = useState(false)
  const [entry, setEntry] = useState(null) // selected source entry; null = still on the list step
  const [checked, setChecked] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    portalApi.ptSessions({ limit: 50 })
      .then(({ data }) => { if (!cancelled) setPtSessions(data.sessions || []) })
      .catch(() => { if (!cancelled) { setPtSessions([]); setPtError(true) } })
    return () => { cancelled = true }
  }, [])

  const entries = [
    ...(logs || []).map((l) => ({ ...l, _kind: 'log' })),
    ...(ptSessions || []).map((s) => ({ ...s, _kind: 'pt' })),
  ]
    .filter((e) => e.exercises?.length > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  function openEntry(e) {
    setEntry(e)
    setChecked(new Set(e.exercises.map((_, i) => i))) // pre-select all — copying the whole thing is the common case
  }

  function toggle(i) {
    setChecked((s) => {
      const next = new Set(s)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (!entry) return
    setChecked((s) => (s.size === entry.exercises.length ? new Set() : new Set(entry.exercises.map((_, i) => i))))
  }

  function confirmCopy() {
    if (!entry) return
    const picked = entry.exercises
      .filter((_, i) => checked.has(i))
      .map((ex) => ({
        name: ex.name || '',
        sets: ex.sets ?? '',
        reps: ex.reps ?? '',
        weight: ex.weight ?? '',
        muscleGroup: ex.muscleGroup ?? '',
      }))
    if (picked.length === 0) return
    onCopy(picked)
  }

  const loading = ptSessions === null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative animate-fade-up flex flex-col"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

        {!entry ? (
          <>
            <h2 className="pr-6 mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Copy from a previous workout</h2>
            <p className="mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>Pick a past workout or PT session, then choose which exercises to bring in.</p>

            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-center rounded-lg px-3 py-6" style={{ color: 'var(--color-secondary)', background: 'var(--color-surface-2)' }}>
                {ptError ? "Couldn't load PT sessions, but " : ''}No previous workouts with exercises found yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((e) => (
                  <button
                    key={`${e._kind}-${e._id}`}
                    type="button"
                    onClick={() => openEntry(e)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-left transition-all rounded-lg"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
                  >
                    <div className="flex items-center min-w-0 gap-2.5">
                      <span className="text-lg shrink-0">{e._kind === 'pt' ? '💪' : '🏋️'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-primary)' }}>
                          {e.title || (e._kind === 'pt' ? 'PT Session' : 'Workout')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                          {fmtISTDateTime(e.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {e._kind === 'pt' ? 'PT session' : 'Workout log'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium shrink-0" style={{ color: 'var(--color-secondary)' }}>
                      {e.exercises.length} ex.
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setEntry(null); setChecked(new Set()) }}
              className="self-start mb-3 text-xs transition-colors"
              style={{ color: 'var(--color-secondary)' }}
            >
              ← Choose a different workout
            </button>

            <div className="flex items-start justify-between gap-3 pr-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                  {entry._kind === 'pt' ? '💪' : '🏋️'} {entry.title || (entry._kind === 'pt' ? 'PT Session' : 'Workout')}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                  {fmtISTDateTime(entry.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button type="button" onClick={toggleAll} className="text-xs font-semibold shrink-0 whitespace-nowrap mt-1" style={{ color: 'var(--color-accent)' }}>
                {checked.size === entry.exercises.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5 my-4">
              {entry.exercises.map((ex, i) => {
                const summary = exerciseSummary(ex)
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                    style={{
                      border: `1px solid ${checked.has(i) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: checked.has(i) ? 'rgba(200,241,53,0.06)' : 'var(--color-surface-2)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(i)}
                      onChange={() => toggle(i)}
                      className="w-4 h-4 shrink-0"
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-primary)' }}>{ex.name}</p>
                      {summary && <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>{summary}</p>}
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex gap-3 pt-3 mt-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCopy}
                disabled={checked.size === 0}
                className="flex-[2] py-3 text-sm font-bold transition-all rounded-xl disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
              >
                Copy {checked.size} exercise{checked.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
