import { useEffect, useState } from 'react'
import { transformationApi } from '../api/index'
import Spinner, { EmptyState } from '../components/ui/Spinner'
import { useMemberAuth } from '../context/MemberAuthContext'
import { isMemberActive } from '../lib/membership'
import PremiumLocked from '../components/PremiumLocked'
import { fmtDate } from '../lib/dateIST'
import { DateInput } from '../components/ui/DateInput'

function formatDate(d) {
  return fmtDate(d)
}
function todayInputValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Transformation() {
  const { member } = useMemberAuth()
  const memberActive = isMemberActive(member)
  const [photos, setPhotos] = useState(null) // null = loading
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [viewing, setViewing] = useState(null) // photo being viewed full-size
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function load() {
    transformationApi.list()
      .then(({ data }) => setPhotos(data))
      .catch(() => setError('Failed to load your photos'))
  }
  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await transformationApi.remove(deleteTarget._id)
      setPhotos((prev) => prev.filter((p) => p._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete photo')
    } finally {
      setDeleting(false)
    }
  }

  if (photos === null) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  const first = photos[0]
  const last = photos[photos.length - 1]
  const hasComparison = photos.length >= 2

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>My Transformation</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>Track how you look, one photo at a time</p>
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
          📸 Add a photo
        </button>
      ) : (
        <PremiumLocked compact />
      )}

      {photos.length === 0 ? (
        <EmptyState icon="📸" title="No photos yet" sub="Add your first progress photo to start tracking your transformation." />
      ) : (
        <>
          {hasComparison && (
            <div className="card p-4">
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Before → Now</h2>
              <div className="grid grid-cols-2 gap-3">
                <ComparisonShot label="Before" photo={first} onClick={() => setViewing(first)} />
                <ComparisonShot label="Now" photo={last} onClick={() => setViewing(last)} />
              </div>
              {first.weight != null && last.weight != null && (
                <p className="text-xs text-center mt-3" style={{ color: 'var(--color-secondary)' }}>
                  {first.weight} kg → {last.weight} kg
                  <span style={{ color: last.weight <= first.weight ? 'var(--color-accent)' : '#f87171', fontWeight: 600 }}>
                    {' '}({last.weight <= first.weight ? '↓' : '↑'} {Math.abs(last.weight - first.weight).toFixed(1)} kg)
                  </span>
                </p>
              )}
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)' }}>All photos</h2>
            <div className="grid grid-cols-2 gap-3">
              {[...photos].reverse().map((p) => (
                <PhotoCard key={p._id} photo={p} onView={() => setViewing(p)} onDelete={() => setDeleteTarget(p)} />
              ))}
            </div>
          </div>
        </>
      )}

      {addOpen && (
        <AddPhotoModal
          onClose={() => setAddOpen(false)}
          onAdded={(photo) => { setPhotos((prev) => [...prev, photo]); setAddOpen(false) }}
        />
      )}

      {viewing && <PhotoLightbox photo={viewing} onClose={() => setViewing(null)} />}

      {deleteTarget && (
        <DeleteConfirmModal
          photo={deleteTarget}
          busy={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function ComparisonShot({ label, photo, onClick }) {
  return (
    <button onClick={onClick} className="text-left">
      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-1.5" style={{ background: 'var(--color-surface-2)' }}>
        <img src={photo.photoUrl} alt={label} className="w-full h-full object-cover" />
      </div>
      <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{label}</p>
      <p className="text-[10px]" style={{ color: 'var(--color-secondary)' }}>
        {formatDate(photo.date)}{photo.weight != null ? ` · ${photo.weight} kg` : ''}
      </p>
    </button>
  )
}

function PhotoCard({ photo, onView, onDelete }) {
  return (
    <div className="card p-2">
      <button onClick={onView} className="block w-full">
        <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2" style={{ background: 'var(--color-surface-2)' }}>
          <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 px-1 pb-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-primary)' }}>{formatDate(photo.date)}</p>
          {photo.weight != null && (
            <p className="text-[11px]" style={{ color: 'var(--color-secondary)' }}>{photo.weight} kg</p>
          )}
        </div>
        <button onClick={onDelete} className="text-xs shrink-0" style={{ color: '#f87171' }}>Delete</button>
      </div>
    </div>
  )
}

function AddPhotoModal({ onClose, onAdded }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [date, setDate] = useState(todayInputValue())
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit() {
    if (!file) { setError('Pick a photo first'); return }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await transformationApi.add({ file, date, weight, note })
      onAdded(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add photo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 relative animate-fade-up max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

        <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Add a photo</h2>

        {error && (
          <p className="text-sm px-3 py-2 mb-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
            {error}
          </p>
        )}

        <label className="block mb-4 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}>
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <span className="text-3xl">📸</span>
                <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>Tap to choose a photo</p>
              </div>
            )}
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Date</label>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} max={todayInputValue()}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Weight (kg)</label>
            <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300}
            placeholder="How are you feeling about your progress?"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
        </div>

        <button onClick={submit} disabled={submitting}
          className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          {submitting ? 'Adding…' : 'Add photo'}
        </button>
      </div>
    </div>
  )
}

function PhotoLightbox({ photo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <button onClick={onClose} className="absolute text-3xl leading-none text-white top-5 right-5">×</button>
      <img src={photo.photoUrl} alt="" className="max-w-full max-h-[75vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
      <div className="mt-4 text-center">
        <p className="text-sm font-bold text-white">{formatDate(photo.date)}</p>
        {photo.weight != null && <p className="text-xs text-white/70 mt-0.5">{photo.weight} kg</p>}
        {photo.note && <p className="text-xs text-white/70 mt-1 max-w-xs">{photo.note}</p>}
      </div>
    </div>
  )
}

function DeleteConfirmModal({ photo, busy, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-xs rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Delete this photo?</h2>
        <p className="mb-5 text-xs" style={{ color: 'var(--color-secondary)' }}>{formatDate(photo.date)} — this can't be undone.</p>
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
