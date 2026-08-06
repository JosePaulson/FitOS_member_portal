import { useEffect, useRef, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner from './ui/Spinner'
import ExerciseRow from './ExerciseRow'
import CopyExercisesModal from './CopyExercisesModal'
import { computePR, formatPR, sortByMuscleGroup } from '../lib/exercisePR'
import { shareContent, buildWorkoutLogShareData, shareDataToText, generateShareImage } from '../lib/share'
import ShareIcon from './ShareIcon'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'
import { useDragReorder } from '../hooks/useDragReorder'
import { toISTInputValue, parseISTInputValue, fmtISTDateTime } from '../lib/dateIST'

// Exercises were keyed by their array index in the list below, which is
// exactly the wrong key for a reorderable list: on every drag, React sees
// "same key at this position" and reuses that row's DOM/state for whatever
// exercise now lands there instead of following the exercise that moved —
// so the row under the pointer doesn't reliably track the dragged item.
// Giving each exercise a stable id up front (independent of its position)
// fixes that; ids are for React's reconciliation only and are stripped
// before saving.
let nextExerciseKey = 0
function withKey(exercise) {
  return exercise._key ? exercise : { ...exercise, _key: `ex-${Date.now()}-${nextExerciseKey++}` }
}
function stripKey({ _key, ...rest }) {
  return rest
}

/** Create/edit form for a self-logged workout — exercises, body weight, duration, time. */
export function WorkoutLogFormModal({ initial, history, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    when: toISTInputValue(initial?.date), // defaults to "now" (IST) for a new log
    durationMinutes: initial?.durationMinutes || 60,
    bodyWeight: initial?.bodyWeight ?? '',
    notes: initial?.notes || '',
    exercises: (initial?.exercises?.length ? initial.exercises : [{ name: '', sets: '', reps: '', weight: '', muscleGroup: '' }]).map(withKey),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }))

  // Refs to each exercise row so a newly-added one can be scrolled into
  // view — cleared and rebuilt every render, indexed to match form.exercises.
  const exerciseRefs = useRef([])
  const [scrollToIndex, setScrollToIndex] = useState(null)

  // Tracks whether the main "+ Add exercise" button (up near the top of the
  // form) is currently scrolled out of view within the modal, so a second
  // copy can be shown right below the last exercise row when it isn't.
  const modalScrollRef = useRef(null)
  const topAddBtnRef = useRef(null)
  const [topAddBtnVisible, setTopAddBtnVisible] = useState(true)

  useEffect(() => {
    const root = modalScrollRef.current
    const target = topAddBtnRef.current
    if (!root || !target) return
    const observer = new IntersectionObserver(
      ([entry]) => setTopAddBtnVisible(entry.isIntersecting),
      { root, threshold: 0.01 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  function addExercise() {
    setScrollToIndex(form.exercises.length) // index the new row will land at
    setForm((v) => ({ ...v, exercises: [...v.exercises, withKey({ name: '', sets: '', reps: '', weight: '', muscleGroup: '' })] }))
  }

  const { list: orderedExercises, dragIndex, getHandleProps, setRowRef } = useDragReorder(
    form.exercises,
    (reordered) => setForm((v) => ({ ...v, exercises: reordered }))
  )

  // Scrolls the newly-added row into view. Keyed off orderedExercises.length
  // (what's actually rendered) rather than form.exercises.length: useDragReorder
  // keeps its own internal copy of the list and only resyncs it from
  // form.exercises one render *after* form.exercises changes, so a new row
  // doesn't actually exist in the DOM yet on the render where
  // form.exercises.length first ticks up — this effect would fire a render
  // too early and find nothing in exerciseRefs to scroll to.
  useEffect(() => {
    if (scrollToIndex == null) return
    const el = exerciseRefs.current[scrollToIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setScrollToIndex(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToIndex, orderedExercises.length])

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

  const [showCopyModal, setShowCopyModal] = useState(false)
  function copyExercises(copied) {
    setForm((v) => ({ ...v, exercises: [...v.exercises.filter((e) => e.name.trim()), ...copied.map(withKey)] }))
    setShowCopyModal(false)
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
        // Treat the picked value as IST wall-clock time, not the device's
        // own local time — a member's phone timezone shouldn't change what
        // gets stored.
        date: parseISTInputValue(form.when).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        bodyWeight: form.bodyWeight === '' ? undefined : Number(form.bodyWeight),
        notes: form.notes,
        exercises: form.exercises.filter((e) => e.name.trim()).map(stripKey),
      }
      const { data: saved } = initial
        ? await portalApi.updateWorkoutLog(initial._id, payload)
        : await portalApi.logWorkout(payload)
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workout')
    } finally { setSaving(false) }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div ref={modalScrollRef} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto relative animate-fade-up"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowCopyModal(true)} className="text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
                  📋 Copy from previous
                </button>
                <button type="button" ref={topAddBtnRef} onClick={addExercise} className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>+ Add exercise</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {orderedExercises.map((ex, i) => {
                const handleProps = getHandleProps(i)
                return (
                  <div
                    key={ex._key}
                    ref={(el) => { exerciseRefs.current[i] = el; setRowRef(i)(el) }}
                    style={{ opacity: dragIndex === i ? 0.5 : 1 }}
                  >
                    <ExerciseRow
                      exercise={ex}
                      history={history}
                      showRemove={form.exercises.length > 1}
                      onChange={(field, val) => updateExercise(i, field, val)}
                      onRemove={() => removeExercise(i)}
                      dragHandleProps={handleProps}
                    />
                  </div>
                )
              })}
            </div>
            {/* Second "Add exercise" affordance right after the list, so it's
                always within reach without scrolling back up — only shown
                once the original button up top has scrolled out of view. */}
            {!topAddBtnVisible && (
              <button type="button" onClick={addExercise}
                className="w-full mt-2 py-2.5 text-xs font-semibold rounded-lg transition-colors"
                style={{ color: 'var(--color-accent)', border: '1px dashed var(--color-accent)', background: 'rgba(200,241,53,0.05)' }}>
                + Add exercise
              </button>
            )}
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
    {showCopyModal && (
      <CopyExercisesModal
        logs={(history || []).filter((l) => l._id !== initial?._id)}
        onClose={() => setShowCopyModal(false)}
        onCopy={copyExercises}
      />
    )}
    </>
  )
}

/** Read-only detail view for a self-logged workout, with edit/delete actions. */
export function WorkoutLogDetail({ log, history, onBack, onEdit, onDelete }) {
  const { muscleGroups } = useExerciseCatalog()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showPR, setShowPR] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    setSharing(true)
    try {
      const data = buildWorkoutLogShareData(log)
      const imageBlob = await generateShareImage(data)
      const result = await shareContent({ title: log.title, text: shareDataToText(data), imageBlob })
      if (result === 'copied') {
        setShareStatus('Copied to clipboard!')
        setTimeout(() => setShareStatus(''), 2000)
      } else if (result === 'downloaded') {
        setShareStatus('Image saved!')
        setTimeout(() => setShareStatus(''), 2000)
      } else if (result === 'failed') {
        setShareStatus('Could not share — try again')
        setTimeout(() => setShareStatus(''), 2000)
      }
    } finally {
      setSharing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await onDelete()
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete this workout — try again')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--color-secondary)' }}>
          ← Back to workouts
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
        >
          <ShareIcon size={14} /> {sharing ? 'Preparing…' : 'Share'}
        </button>
      </div>
      {shareStatus && (
        <p className="-mt-3 text-xs text-center" style={{ color: 'var(--color-accent)' }}>{shareStatus}</p>
      )}

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{log.title}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>
          {fmtISTDateTime(log.date, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>Exercises</h3>
            <button
              onClick={() => setShowPR((v) => !v)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: showPR ? 'rgba(168,85,247,0.15)' : 'var(--color-surface-2)',
                color: showPR ? '#a855f7' : 'var(--color-secondary)',
                border: `1px solid ${showPR ? 'rgba(168,85,247,0.4)' : 'var(--color-border)'}`,
              }}
            >
              {showPR ? 'Hide PR' : 'Show PR'}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {sortByMuscleGroup(log.exercises, muscleGroups).map((ex, i) => {
              const pr = computePR(history, ex.name)
              const weightIsPR = pr != null && ex.weight != null && Number(ex.weight) === pr.weight
              return (
                <div key={i} className="flex items-center justify-between py-2 text-sm"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>{ex.name}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                      {ex.sets && <span>{ex.sets} sets</span>}
                      {ex.reps && <span>× {ex.reps}</span>}
                      {ex.weight != null && (
                        <span className="font-semibold" style={{ color: weightIsPR ? '#a855f7' : 'var(--color-accent)' }}>
                          @ {ex.weight}kg
                        </span>
                      )}
                    </div>
                    {/* PR weight, shown below the logged weight — only on
                        request (Show PR), since the weight itself already
                        turns purple when it *is* the PR. */}
                    {showPR && pr && (
                      <span className="text-[10px] font-bold" style={{ color: '#a855f7' }}>
                        PR {formatPR(pr)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
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
        <button onClick={() => setShowConfirm(true)} className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
          🗑️ Delete
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-sm p-6 text-center rounded-2xl animate-fade-up"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-3 text-4xl">🗑️</div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Delete this workout?</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-secondary)' }}>
              "{log.title}" and all its logged exercises will be permanently removed. This can't be undone.
            </p>
            {deleteError && <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{deleteError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowConfirm(false)} disabled={deleting}
                className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl disabled:opacity-60"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 text-sm font-bold transition-all rounded-xl disabled:opacity-60"
                style={{ background: '#f87171', color: '#1a0000' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
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
