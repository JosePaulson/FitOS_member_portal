import { useEffect, useState } from 'react'
import { logSharingApi } from '../api/index'
import { dialog } from './ui/Dialog'

/**
 * Privacy card: lets the member choose whether their workout log and meal log
 * are visible to the gym, and which trainers (if any) can see them as well.
 * The gym owner and managers can always see anything that is shared.
 */
export default function LogSharingCard() {
  const [state, setState] = useState(null)   // { sharing, trainers }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    logSharingApi.get().then(({ data }) => { if (!cancelled) setState(data) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!state) return null
  const { sharing, trainers } = state
  const anyShared = sharing.workoutLogs || sharing.mealLogs

  async function save(patch) {
    const prev = state
    setState({ ...state, sharing: { ...sharing, ...patch } })   // optimistic
    setSaving(true)
    try {
      const { data } = await logSharingApi.update(patch)
      setState(data)
    } catch (err) {
      setState(prev)
      dialog.error(err.response?.data?.message || 'Please try again in a moment.', { title: 'Couldn’t update sharing' })
    } finally { setSaving(false) }
  }

  const toggleTrainer = (id) => save({
    trainerIds: sharing.trainerIds.includes(id) ? sharing.trainerIds.filter((t) => t !== id) : [...sharing.trainerIds, id],
  })

  return (
    <div className="p-5 card">
      <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>🔒 Share my logs</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-secondary)' }}>
        Choose what your gym can see. Everything is private unless you switch it on.
      </p>

      <Switch label="Workout logs" checked={sharing.workoutLogs} disabled={saving} onChange={(v) => save({ workoutLogs: v })} />
      <Switch label="Meal logs" checked={sharing.mealLogs} disabled={saving} onChange={(v) => save({ mealLogs: v })} />

      {anyShared && (
        <div className="mt-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>Also share with my trainer(s)</p>
          {trainers.length === 0 ? (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-hint)' }}>Your gym has no trainers to pick right now.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {trainers.map((t) => {
                const on = sharing.trainerIds.includes(t._id)
                return (
                  <button key={t._id} type="button" disabled={saving} onClick={() => toggleTrainer(t._id)}
                    className="px-3 py-1 text-xs font-semibold transition-all rounded-full"
                    style={{
                      background: on ? 'rgba(200,241,53,0.12)' : 'var(--color-surface-2)',
                      border: on ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                      color: on ? 'var(--color-accent)' : 'var(--color-secondary)',
                    }}>
                    {on ? '✓ ' : ''}{t.name}
                  </button>
                )
              })}
            </div>
          )}
          <p className="mt-2 text-[11px]" style={{ color: 'var(--color-hint)' }}>
            The gym owner and managers can see anything you share, even if you pick only one trainer.
          </p>
        </div>
      )}
    </div>
  )
}

function Switch({ label, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-sm" style={{ color: 'var(--color-primary)' }}>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
        className="relative transition-colors rounded-full shrink-0"
        style={{ width: 44, height: 26, background: checked ? 'var(--color-accent)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <span className="absolute transition-all rounded-full"
          style={{ top: 2, left: checked ? 20 : 2, width: 20, height: 20, background: checked ? '#0D0D0D' : 'var(--color-secondary)' }} />
      </button>
    </div>
  )
}
