import { useEffect, useMemo, useRef, useState } from 'react'
import { mealLogApi } from '../api/index'
import Spinner, { EmptyState, Badge } from '../components/ui/Spinner'
import { useMemberAuth } from '../context/MemberAuthContext'
import { isMemberActive } from '../lib/membership'
import PremiumLocked from '../components/PremiumLocked'
import { toISTInputValue, parseISTInputValue, fmtISTDateTime, fmtISTTime, istDateKey, todayISTKey } from '../lib/dateIST'
import { fmtDate } from '../lib/dateIST'
import { DateTimeInput } from '../components/ui/DateInput'

const MEAL_TYPES = [
  { value: 'Breakfast', icon: '🍳' },
  { value: 'Lunch', icon: '🥗' },
  { value: 'Dinner', icon: '🍛' },
  { value: 'Snack', icon: '🍎' },
  { value: 'Other', icon: '🍽️' },
]
const MEAL_ICON = Object.fromEntries(MEAL_TYPES.map((m) => [m.value, m.icon]))

function dayLabel(dateKey) {
  const todayKey = todayISTKey()
  if (dateKey === todayKey) return 'Today'
  const yesterday = new Date(parseISTInputValue(`${todayKey}T00:00`).getTime() - 86400000)
  if (dateKey === istDateKey(yesterday)) return 'Yesterday'
  return fmtGroupDate(dateKey)
}
function fmtGroupDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return fmtDate(Date.UTC(y, m - 1, d))
}

export default function MealLog() {
  const { member } = useMemberAuth()
  const memberActive = isMemberActive(member)
  const [logs, setLogs] = useState(null) // null = loading
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function load() {
    mealLogApi.list()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => setError('Failed to load your meal log'))
  }
  useEffect(() => { load() }, [])

  const groups = useMemo(() => {
    if (!logs) return []
    const byDay = new Map()
    for (const l of logs) {
      const key = istDateKey(l.eatenAt)
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key).push(l)
    }
    return [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [logs])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await mealLogApi.remove(deleteTarget._id)
      setLogs((prev) => prev.filter((l) => l._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete this entry')
    } finally {
      setDeleting(false)
    }
  }

  if (logs === null) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Meal Log</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>A photo diary of everything you eat</p>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
          {error}
        </p>
      )}

      {memberActive ? (
        <button onClick={() => setAddOpen(true)}
          className="w-full font-bold py-3.5 rounded-xl text-sm transition-all"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          🍽️ Log a meal
        </button>
      ) : (
        <PremiumLocked compact />
      )}

      {groups.length === 0 ? (
        <EmptyState icon="🍽️" title="No meals logged yet" sub="Snap a photo each time you eat to start building your diary." />
      ) : (
        groups.map(([dateKey, dayLogs]) => (
          <div key={dateKey}>
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)' }}>{dayLabel(dateKey)}</h2>
            <div className="grid grid-cols-2 gap-3">
              {dayLogs
                .slice()
                .sort((a, b) => new Date(b.eatenAt) - new Date(a.eatenAt))
                .map((l) => (
                  <MealCard key={l._id} log={l} onView={() => setViewing(l)} onDelete={() => setDeleteTarget(l)} />
                ))}
            </div>
          </div>
        ))
      )}

      {addOpen && (
        <AddMealModal
          onClose={() => setAddOpen(false)}
          onAdded={(log) => { setLogs((prev) => [log, ...prev]); setAddOpen(false) }}
        />
      )}

      {viewing && <MealLightbox log={viewing} onClose={() => setViewing(null)} />}

      {deleteTarget && (
        <DeleteConfirmModal
          log={deleteTarget}
          busy={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function MealCard({ log, onView, onDelete }) {
  return (
    <div className="card p-2">
      <button onClick={onView} className="block w-full">
        <div className="aspect-square rounded-lg overflow-hidden mb-2" style={{ background: 'var(--color-surface-2)' }}>
          <img src={log.photoUrl} alt={log.mealType} className="w-full h-full object-cover" />
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 px-1 pb-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-primary)' }}>
            {MEAL_ICON[log.mealType] || '🍽️'} {log.mealType}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>
            {fmtISTDateTime(log.eatenAt, { day: undefined, month: undefined, year: undefined, hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onDelete} className="text-xs shrink-0" style={{ color: '#f87171' }}>Delete</button>
      </div>
    </div>
  )
}

function AddMealModal({ onClose, onAdded }) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mealType, setMealType] = useState('Breakfast')
  const [when, setWhen] = useState(() => toISTInputValue(new Date()))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function pickFile(selected) {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function submit() {
    if (!file) { setError('Add a photo of your meal first'); return }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await mealLogApi.add({
        file,
        mealType,
        eatenAt: parseISTInputValue(when).toISOString(),
        note,
      })
      onAdded(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save this meal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 relative animate-fade-up max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

        <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Log a meal</h2>

        {error && (
          <p className="text-sm px-3 py-2 mb-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
            {error}
          </p>
        )}

        {/* Hidden inputs — one forces the camera, one opens the gallery */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />

        {!preview ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 rounded-xl transition-all"
              style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}>
              <span className="text-2xl">📸</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Take Photo</span>
            </button>
            <button onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 rounded-xl transition-all"
              style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}>
              <span className="text-2xl">🖼️</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Upload from Gallery</span>
            </button>
          </div>
        ) : (
          <div className="relative mb-4">
            <div className="aspect-square rounded-xl overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => { setFile(null); setPreview(null) }}
              className="absolute text-xs font-semibold px-2.5 py-1 rounded-lg top-2 right-2"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              Retake
            </button>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Meal</label>
          <div className="grid grid-cols-5 gap-1.5">
            {MEAL_TYPES.map((m) => (
              <button key={m.value} onClick={() => setMealType(m.value)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all"
                style={{
                  background: mealType === m.value ? 'rgba(200,241,53,0.12)' : 'var(--color-surface-2)',
                  border: mealType === m.value ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                }}>
                <span className="text-base leading-none">{m.icon}</span>
                <span className="text-[9px] font-medium leading-none" style={{ color: mealType === m.value ? 'var(--color-accent)' : 'var(--color-secondary)' }}>
                  {m.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Date & time</label>
          <DateTimeInput value={when} onChange={(e) => setWhen(e.target.value)} max={toISTInputValue(new Date())}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-secondary)' }}>Auto-filled with now — change it if you're logging a past meal.</p>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300}
            placeholder="What did you have?"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
        </div>

        <button onClick={submit} disabled={submitting}
          className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          {submitting ? 'Saving…' : 'Save meal'}
        </button>
      </div>
    </div>
  )
}

function MealLightbox({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <button onClick={onClose} className="absolute text-3xl leading-none text-white top-5 right-5">×</button>
      <img src={log.photoUrl} alt="" className="max-w-full max-h-[70vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
      <div className="mt-4 text-center px-6">
        <Badge color="lime">{MEAL_ICON[log.mealType] || '🍽️'} {log.mealType}</Badge>
        <p className="text-sm font-bold text-white mt-2">{fmtISTDateTime(log.eatenAt)}</p>
        {log.note && <p className="text-xs text-white/70 mt-1 max-w-xs">{log.note}</p>}
      </div>
    </div>
  )
}

function DeleteConfirmModal({ log, busy, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-xs rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Delete this entry?</h2>
        <p className="mb-5 text-xs" style={{ color: 'var(--color-secondary)' }}>
          {MEAL_ICON[log.mealType] || '🍽️'} {log.mealType} · {fmtISTDateTime(log.eatenAt)} — this can't be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-[2] font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
            style={{ background: '#f87171', color: '#fff' }}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
