import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintApi, staffRatingApi } from '../api/index'
import { Badge } from '../components/ui/Spinner'

const S = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
}

const CATEGORY_OPTIONS = [
  { value: 'trainer', label: 'Trainer' },
  { value: 'staff', label: 'Staff' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'facility', label: 'Facility' },
  { value: 'billing', label: 'Billing' },
  { value: 'class-schedule', label: 'Class schedule' },
  { value: 'other', label: 'Other' },
]

const STATUS_BADGE = {
  open: 'blue',
  'in-progress': 'yellow',
  resolved: 'lime',
  closed: 'muted',
}

const STATUS_LABEL = {
  open: 'Open', 'in-progress': 'In progress', resolved: 'Resolved', closed: 'Closed',
}

export default function Support() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('raise') // raise | mine | rate

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-lg" style={{ color: S.secondary }}>←</button>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: S.primary }}>Support & feedback</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
        {[
          { key: 'raise', label: 'Raise' },
          { key: 'mine', label: 'My requests' },
          { key: 'rate', label: 'Rate staff' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={tab === t.key
              ? { background: S.accent, color: '#0D0D0D' }
              : { color: S.secondary }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'raise' && <RaiseTab onSubmitted={() => setTab('mine')} />}
      {tab === 'mine' && <MineTab />}
      {tab === 'rate' && <RateTab />}
    </div>
  )
}

/* ── Raise a complaint / request ─────────────────────────────────────────── */
function RaiseTab({ onSubmitted }) {
  const [form, setForm] = useState({ type: 'complaint', category: 'other', subject: '', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.subject.trim() || !form.message.trim()) { setError('Please fill in a subject and description'); return }
    setLoading(true)
    try {
      await complaintApi.create(form)
      setForm({ type: 'complaint', category: 'other', subject: '', message: '' })
      onSubmitted?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-5 card">
      {error && (
        <p className="px-3 py-2 text-sm rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
          {error}
        </p>
      )}

      {/* Complaint / request toggle */}
      <div className="flex gap-2">
        {['complaint', 'request'].map((t) => (
          <button
            key={t} type="button"
            onClick={() => setForm((v) => ({ ...v, type: t }))}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-all capitalize"
            style={form.type === t
              ? { background: 'rgba(200,241,53,0.12)', borderColor: 'rgba(200,241,53,0.35)', color: S.accent }
              : { borderColor: S.border, color: S.secondary }}
          >
            {t === 'complaint' ? '⚠️ Complaint' : '🙋 Request'}
          </button>
        ))}
      </div>

      <Field label="Category">
        <select value={form.category} onChange={set('category')} className="w-full field-input">
          {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </Field>

      <Field label="Subject *">
        <input
          type="text" value={form.subject} onChange={set('subject')}
          className="field-input" placeholder="Brief summary"
        />
      </Field>

      <Field label="Details *">
        <textarea
          rows={4} value={form.message} onChange={set('message')}
          className="resize-none field-input"
          placeholder={form.type === 'complaint' ? "What went wrong, and when?" : "What would you like the gym to do for you?"}
        />
      </Field>

      <button
        type="submit" disabled={loading}
        className="py-3 text-sm font-bold rounded-lg disabled:opacity-60"
        style={{ background: S.accent, color: '#0D0D0D' }}
      >
        {loading ? 'Submitting…' : `Submit ${form.type}`}
      </button>
    </form>
  )
}

/* ── My submitted complaints / requests ──────────────────────────────────── */
function MineTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complaintApi.list()
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl card animate-pulse" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-sm text-center card" style={{ color: S.secondary }}>
        You haven't raised anything yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((c) => (
        <div key={c._id} className="flex flex-col gap-2 p-4 card">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold" style={{ color: S.secondary }}>
              {c.type === 'complaint' ? '⚠️ Complaint' : '🙋 Request'}
            </span>
            <Badge color={STATUS_BADGE[c.status] || 'muted'}>{STATUS_LABEL[c.status] || c.status}</Badge>
          </div>
          <h3 className="text-sm font-semibold" style={{ color: S.primary }}>{c.subject}</h3>
          <p className="text-xs" style={{ color: S.secondary }}>{c.message}</p>

          {c.responses?.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 mt-1" style={{ borderTop: `1px solid ${S.border}` }}>
              {c.responses.map((r, i) => (
                <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-2)', color: S.primary }}>
                  <p>{r.text}</p>
                  <p className="mt-1 text-[10px]" style={{ color: S.secondary }}>
                    Gym team · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px]" style={{ color: S.secondary }}>
            Submitted {new Date(c.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ── Rate trainers / staff ───────────────────────────────────────────────── */
function RateTab() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)

  function load() {
    setLoading(true)
    staffRatingApi.staff()
      .then(({ data }) => setStaff(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl card animate-pulse" />)}
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className="py-16 text-sm text-center card" style={{ color: S.secondary }}>
        No trainers or staff to rate yet.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {staff.map((s) => (
          <button
            key={s._id}
            onClick={() => setTarget(s)}
            className="flex items-center justify-between p-4 text-left card"
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: S.primary }}>{s.name}</p>
              <p className="text-xs capitalize" style={{ color: S.secondary }}>{s.role}</p>
            </div>
            <div className="text-right">
              {s.myRating ? (
                <span style={{ color: '#fbbf24' }}>{'★'.repeat(s.myRating)}<span style={{ color: S.border }}>{'★'.repeat(5 - s.myRating)}</span></span>
              ) : (
                <span className="text-xs" style={{ color: S.accent }}>Rate →</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {target && (
        <RateModal
          staff={target}
          onClose={() => setTarget(null)}
          onSaved={() => { setTarget(null); load() }}
        />
      )}
    </>
  )
}

function RateModal({ staff, onClose, onSaved }) {
  const [rating, setRating] = useState(staff.myRating || 0)
  const [remark, setRemark] = useState(staff.myRemark || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!rating) { setError('Please select a star rating'); return }
    setError('')
    setLoading(true)
    try {
      await staffRatingApi.rate({ staffId: staff._id, rating, remark })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rating')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md p-6 rounded-t-2xl"
        style={{ background: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold" style={{ color: S.primary }}>{staff.name}</h2>
        <p className="mb-5 text-xs capitalize" style={{ color: S.secondary }}>{staff.role}</p>

        {error && (
          <p className="px-3 py-2 mb-4 text-sm rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="text-3xl leading-none transition-transform active:scale-90"
              style={{ color: n <= rating ? '#fbbf24' : S.border }}
            >
              ★
            </button>
          ))}
        </div>

        <Field label="Remark (optional)">
          <textarea
            rows={3} value={remark} onChange={(e) => setRemark(e.target.value)}
            className="resize-none field-input"
            placeholder="What stood out — good or bad?"
          />
        </Field>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${S.border}`, color: S.secondary }}>
            Cancel
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-[2] py-2.5 text-sm font-bold rounded-lg disabled:opacity-60"
            style={{ background: S.accent, color: '#0D0D0D' }}
          >
            {loading ? 'Saving…' : 'Save rating'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: S.secondary }}>{label}</label>
      {children}
    </div>
  )
}
