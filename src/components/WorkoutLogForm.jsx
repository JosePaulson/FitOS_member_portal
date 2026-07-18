import { useState } from 'react'
import { portalApi } from '../api/index'
import Spinner from './ui/Spinner'

function pad(n) { return String(n).padStart(2, '0') }
function toLocalInputValue(date) {
  const d = date ? new Date(date) : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Create/edit form for a self-logged workout — exercises, body weight, duration, time. */
export function WorkoutLogFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    when: toLocalInputValue(initial?.date), // defaults to "now" for a new log
    durationMinutes: initial?.durationMinutes || 60,
    bodyWeight: initial?.bodyWeight ?? '',
    notes: initial?.notes || '',
    exercises: initial?.exercises?.length ? initial.exercises : [{ name: '', sets: '', reps: '', weight: '' }],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }))

  function addExercise() {
    setForm((v) => ({ ...v, exercises: [...v.exercises, { name: '', sets: '', reps: '', weight: '' }] }))
  }
  function updateExercise(i, field, val) {
    setForm((v) => {
      const ex = [...v.exercises]
      ex[i] = { ...ex[i], [field]: val }
      return { ...v, exercises: ex }
    })
  }
  function removeExercise(i) {
    setForm((v) => ({ ...v, exercises: v.exercises.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    setError('')
    if (!form.exercises.some((e) => e.name.trim())) {
      setError('Add at least one exercise')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        date: new Date(form.when).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        bodyWeight: form.bodyWeight === '' ? undefined : Number(form.bodyWeight),
        notes: form.notes,
        exercises: form.exercises.filter((e) => e.name.trim()),
      }
      if (initial) await portalApi.updateWorkoutLog(initial._id, payload)
      else await portalApi.logWorkout(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workout')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>
        <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
          {initial ? 'Edit workout' : '➕ Log a workout'}
        </h2>

        {error && (
          <p className="px-3 py-2 mb-3 text-xs rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <LabeledInput label="Title">
            <input type="text" value={form.title} onChange={set('title')} className="field-input" placeholder="Leg day, morning run…" />
          </LabeledInput>

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Date & time">
              <input type="datetime-local" value={form.when} onChange={set('when')} className="field-input" />
            </LabeledInput>
            <LabeledInput label="Duration (min)">
              <input type="number" min="5" step="5" value={form.durationMinutes} onChange={set('durationMinutes')} className="field-input" />
            </LabeledInput>
          </div>

          <LabeledInput label="Body weight (kg) — optional">
            <input type="number" step="0.1" value={form.bodyWeight} onChange={set('bodyWeight')} className="field-input" placeholder="72.5" />
          </LabeledInput>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Exercises</label>
              <button type="button" onClick={addExercise} className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>+ Add exercise</button>
            </div>
            <div className="flex flex-col gap-2">
              {form.exercises.map((ex, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <input placeholder="Exercise name" value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      className="col-span-2 text-xs field-input" />
                    <input placeholder="Sets" type="number" value={ex.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} className="text-xs field-input" />
                    <input placeholder="Reps" value={ex.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} className="text-xs field-input" />
                    <input placeholder="Weight (kg)" type="number" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} className="col-span-2 text-xs field-input" />
                  </div>
                  {form.exercises.length > 1 && (
                    <button onClick={() => removeExercise(i)} className="mt-1 text-lg leading-none" style={{ color: 'var(--color-secondary)' }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <LabeledInput label="Notes — optional">
            <textarea rows={2} value={form.notes} onChange={set('notes')} className="resize-none field-input" placeholder="How it felt, anything to remember…" />
          </LabeledInput>

          <p className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>
            🔥 Calories burned is estimated automatically from your body weight, duration, and the exercises above — same method used for PT sessions.
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>Cancel</button>
            <button onClick={save} disabled={saving} className="flex-[2] py-3 text-sm font-bold transition-all rounded-xl disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
              {saving ? 'Saving…' : initial ? 'Update workout' : 'Save workout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Read-only detail view for a self-logged workout, with edit/delete actions. */
export function WorkoutLogDetail({ log, onBack, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this workout log? This can\'t be undone.')) return
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false) }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--color-secondary)' }}>
        ← Back to workouts
      </button>

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{log.title}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>
          {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 text-center card">
          <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>⏱️ Duration</p>
          <p className="mt-1 font-bold" style={{ color: 'var(--color-primary)' }}>{log.durationMinutes}m</p>
        </div>
        <div className="p-3 text-center card">
          <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>⚖️ Body weight</p>
          <p className="mt-1 font-bold" style={{ color: 'var(--color-primary)' }}>{log.bodyWeight ? `${log.bodyWeight}kg` : '—'}</p>
        </div>
        <div className="p-3 text-center card">
          <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>🔥 Calories</p>
          <p className="mt-1 font-bold" style={{ color: 'var(--color-accent)' }}>{log.caloriesBurned ?? '—'}</p>
        </div>
      </div>

      {log.exercises?.length > 0 && (
        <div className="p-4 card">
          <h3 className="mb-2 text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>Exercises</h3>
          <div className="flex flex-col gap-1">
            {log.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-primary)' }}>{ex.name}</span>
                <div className="flex gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                  {ex.sets && <span>{ex.sets} sets</span>}
                  {ex.reps && <span>× {ex.reps}</span>}
                  {ex.weight != null && <span>@ {ex.weight}kg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.notes && (
        <div className="p-4 card">
          <h3 className="mb-1 text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>Notes</h3>
          <p className="text-sm" style={{ color: 'var(--color-primary)' }}>{log.notes}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onEdit} className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>✏️ Edit</button>
        <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl disabled:opacity-60"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
          {deleting ? 'Deleting…' : '🗑️ Delete'}
        </button>
      </div>
    </div>
  )
}

function LabeledInput({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
