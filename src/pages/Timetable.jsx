import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { timetableApi } from '../api/index'
import Spinner, { EmptyState, Badge } from '../components/ui/Spinner'

const WEEKDAYS = [
  { key: 'monday', label: 'Mon', idx: 0 },
  { key: 'tuesday', label: 'Tue', idx: 1 },
  { key: 'wednesday', label: 'Wed', idx: 2 },
  { key: 'thursday', label: 'Thu', idx: 3 },
  { key: 'friday', label: 'Fri', idx: 4 },
  { key: 'saturday', label: 'Sat', idx: 5 },
  { key: 'sunday', label: 'Sun', idx: 6 },
]

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Manual format (not toLocaleDateString) so it's always exactly "Aug 8"
// regardless of the browser's locale settings.
function formatShortDate(d) {
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

// The Monday that starts "this week" (weekOffset 0) or "next week" (1).
function mondayOfWeek(weekOffset) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // Monday=0..Sunday=6
  d.setDate(d.getDate() - dow + weekOffset * 7)
  return d
}

// The actual calendar date a given weekday tab represents, in the
// currently-viewed week — e.g. Saturday in "this week" is a real date
// like Aug 8, shown under the tab label.
function dateForWeekday(weekOffset, weekdayIdx) {
  const monday = mondayOfWeek(weekOffset)
  const d = new Date(monday)
  d.setDate(monday.getDate() + weekdayIdx)
  return d
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// Monday=0..Sunday=6, matching the WEEKDAYS array order above (JS's own
// Date#getDay() is Sunday-first, so this just re-bases it).
function todayIndex() {
  const idx = new Date().getDay() // 0=Sun..6=Sat
  return (idx + 6) % 7
}

// Which weekday tab to land on by default — today's, so members see the
// most relevant part of the timetable first.
function todayKey() {
  return WEEKDAYS[todayIndex()].key
}

// "HH:mm", so it can be compared lexicographically against a slot's
// zero-padded startTime.
function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// This week only shows today onward — earlier days have already happened
// and can't be requested or cancelled anyway. Next week is a full 7 days
// out, so every day in it is still ahead.
function visibleWeekdays(weekOffset) {
  return weekOffset > 0 ? WEEKDAYS : WEEKDAYS.slice(todayIndex())
}

export default function Timetable() {
  // Deep-linked from the Profile calendar — e.g. tapping Aug 10 there
  // passes { weekday: 'saturday', weekOffset: 0|1 } so this page opens
  // directly on that exact day/week instead of always defaulting to today.
  const location = useLocation()
  const [slots, setSlots] = useState(null) // null = not loaded yet
  const [myPlans, setMyPlans] = useState([])
  const [gateMessage, setGateMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [day, setDay] = useState(() => location.state?.weekday || todayKey())
  const [weekOffset, setWeekOffset] = useState(() => location.state?.weekOffset ?? 0) // 0 = this week, 1 = next week
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [requestTarget, setRequestTarget] = useState(null)

  // Multi-select cancel — a member can pick more than one of their own
  // booked slots (across days) and cancel them together in one confirm.
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [cancelTarget, setCancelTarget] = useState(null) // slot[] pending confirmation
  const [cancelling, setCancelling] = useState(false)
  const [cancelErrors, setCancelErrors] = useState([])

  useEffect(() => { load() }, [])

  // Switching back to "this week" can leave an already-past day selected
  // (e.g. picked Tuesday while browsing next week, then jumped back on a
  // Thursday) — snap back to today rather than showing a day that's now
  // hidden from the tab list.
  useEffect(() => {
    if (weekOffset === 0 && !visibleWeekdays(0).some((d) => d.key === day)) {
      setDay(todayKey())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  function load() {
    setLoading(true)
    setGateMessage('')
    timetableApi.list()
      .then(({ data }) => {
        setSlots(data.slots || [])
        setMyPlans(data.myActivePlans || [])
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setGateMessage(err.response.data?.message || 'You need an active PT plan to view the timetable.')
        } else {
          setError(err.response?.data?.message || 'Failed to load timetable')
        }
      })
      .finally(() => setLoading(false))
  }

  function updateSlot(updated) {
    setSlots((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
  }

  async function cancelMyRequest(slot) {
    setBusyId(slot._id)
    setError('')
    try {
      const { data } = await timetableApi.cancelRequest(slot._id)
      updateSlot(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not withdraw the request')
    } finally {
      setBusyId(null)
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openCancelSingle(slot) {
    setCancelErrors([])
    setCancelTarget([slot])
  }

  function openCancelSelected() {
    const chosen = (slots || []).filter((s) => selectedIds.has(s._id))
    if (chosen.length === 0) return
    setCancelErrors([])
    setCancelTarget(chosen)
  }

  // Handles both a single-slot cancel and a batch cancel through the same
  // path — "one slot or multiple", each still only ever their own (the
  // API enforces that server-side regardless of what's sent here).
  async function confirmCancel() {
    if (!cancelTarget?.length) return
    setCancelling(true)
    setCancelErrors([])
    const results = await Promise.allSettled(cancelTarget.map((s) => timetableApi.empty(s._id)))

    const errs = []
    const succeededIds = []
    results.forEach((r, i) => {
      const s = cancelTarget[i]
      if (r.status === 'fulfilled') {
        updateSlot(r.value.data)
        succeededIds.push(s._id)
      } else {
        errs.push(`${cap(s.weekday)} ${s.startTime}: ${r.reason?.response?.data?.message || 'Could not cancel'}`)
      }
    })

    setSelectedIds((prev) => {
      const next = new Set(prev)
      succeededIds.forEach((id) => next.delete(id))
      return next
    })
    setCancelling(false)

    if (errs.length > 0) {
      // Keep the modal open showing only what's left to resolve, so a
      // partial failure (e.g. one slot slipped inside the 2-hour window
      // while the rest went through) is visible rather than silently lost.
      setCancelErrors(errs)
      setCancelTarget((prev) => prev.filter((s) => !succeededIds.includes(s._id)))
    } else {
      setCancelTarget(null)
    }
  }

  // Slots still visible on a given day — for today (and only when looking
  // at *this* week) that excludes anything whose start time has already
  // passed (can't book/request/attend a 6:30am slot once it's 6:30am or
  // later). Next week's occurrence of that same weekday is a full week
  // out, so nothing gets time-filtered there.
  const visibleSlotsFor = (weekday) => {
    const list = (slots || []).filter((s) => s.weekday === weekday)
    if (weekOffset > 0 || weekday !== todayKey()) return list
    const cutoff = nowHHMM()
    return list.filter((s) => s.startTime > cutoff)
  }

  const dayOptions = useMemo(
    () => visibleWeekdays(weekOffset).map((d) => ({
      ...d,
      openCount: visibleSlotsFor(d.key).filter((s) => s.status === 'empty').length,
      date: dateForWeekday(weekOffset, d.idx),
    })),
    [slots, weekOffset]
  )
  const daySlots = useMemo(
    () => visibleSlotsFor(day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, day, weekOffset]
  )

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (gateMessage) {
    return (
      <div className="px-5 py-6">
        <h1 className="text-xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-primary)' }}>Timetable</h1>
        <EmptyState icon="🔒" title="No active PT plan" sub={gateMessage} />
      </div>
    )
  }

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Timetable</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
            {weekOffset > 0 ? "Next week's" : "This week's"} standing weekly PT schedule
          </p>
        </div>
        {weekOffset === 0 ? (
          <button onClick={() => setWeekOffset(1)}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
            Next week →
          </button>
        ) : (
          <button onClick={() => setWeekOffset(0)}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
            ← This week
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {dayOptions.map((d) => (
          <button key={d.key} onClick={() => setDay(d.key)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all shrink-0"
            style={{
              background: day === d.key ? 'var(--color-accent)' : 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}>
            <span className="text-xs font-semibold" style={{ color: day === d.key ? '#0D0D0D' : 'var(--color-secondary)' }}>
              {d.label}{d.openCount > 0 ? ` · ${d.openCount}` : ''}
            </span>
            <span className="text-[9px] leading-none" style={{ color: day === d.key ? '#0D0D0D' : 'var(--color-primary)' }}>
              {formatShortDate(d.date)}
            </span>
          </button>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            {selectedIds.size} slot{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
              Clear
            </button>
            <button onClick={openCancelSelected}
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg" style={{ background: '#f87171', color: '#fff' }}>
              Cancel selected
            </button>
          </div>
        </div>
      )}

      {daySlots.length === 0 ? (
        <EmptyState icon="🗓️" title={`No slots on ${cap(day)}`} sub="This trainer isn't scheduled to work that day, or hasn't built out their timetable yet." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {daySlots.map((s) => (
            <SlotRow
              key={s._id}
              slot={s}
              busy={busyId === s._id}
              selected={selectedIds.has(s._id)}
              onToggleSelect={() => toggleSelect(s._id)}
              onCancelMine={() => openCancelSingle(s)}
              onRequest={() => setRequestTarget(s)}
              onCancelRequest={() => cancelMyRequest(s)}
            />
          ))}
        </div>
      )}

      {requestTarget && (
        <RequestModal
          slot={requestTarget}
          plans={myPlans}
          onClose={() => setRequestTarget(null)}
          onRequested={(updated) => { updateSlot(updated); setRequestTarget(null) }}
        />
      )}

      {cancelTarget && (
        <CancelConfirmModal
          slots={cancelTarget}
          busy={cancelling}
          errors={cancelErrors}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  )
}

function SlotRow({ slot, busy, selected, onToggleSelect, onCancelMine, onRequest, onCancelRequest }) {
  const isMyBooking = slot.status === 'booked' && slot.member?.isMine

  return (
    <div className="card p-4 flex items-center gap-3"
      style={isMyBooking ? { background: 'rgba(200,241,53,0.3)', border: 'none' } : undefined}>
      {isMyBooking && (
        <input type="checkbox" checked={selected} onChange={onToggleSelect}
          className="w-4 h-4 shrink-0" style={{ accentColor: 'var(--color-accent)' }} />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
          {slot.startTime}–{slot.endTime}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-secondary)' }}>
          {slot.trainerId?.name}
        </p>
        {slot.status === 'booked' && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-secondary)' }}>
            {slot.member?.isMine ? 'You' : slot.member?.name}
            {slot.member?.plan ? ` · ${slot.member.plan}` : ''}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {isMyBooking && (
          <>
            <Badge color="lime">Your slot</Badge>
            <button onClick={onCancelMine} disabled={busy}
              className="text-xs font-semibold disabled:opacity-60" style={{ color: '#f87171' }}>
              Cancel
            </button>
          </>
        )}

        {slot.status === 'booked' && !slot.member?.isMine && (
          <Badge color="muted">Booked</Badge>
        )}

        {slot.status === 'empty' && slot.myPendingRequest && (
          <>
            <Badge color="yellow">Requested</Badge>
            <button onClick={onCancelRequest} disabled={busy}
              className="text-xs font-semibold disabled:opacity-60" style={{ color: 'var(--color-secondary)' }}>
              {busy ? 'Withdrawing…' : 'Withdraw'}
            </button>
          </>
        )}

        {slot.status === 'empty' && !slot.myPendingRequest && slot.hasPendingRequest && (
          <Badge color="muted">Requested</Badge>
        )}

        {slot.status === 'empty' && !slot.hasPendingRequest && (
          <>
            <Badge color="blue">Open</Badge>
            <button onClick={onRequest} disabled={busy}
              className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
              Request
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function RequestModal({ slot, plans, onClose, onRequested }) {
  const [memberPTPlanId, setMemberPTPlanId] = useState(plans.length === 1 ? plans[0]._id : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (plans.length > 1 && !memberPTPlanId) { setError('Choose which PT plan this is for'); return }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await timetableApi.request(slot._id, memberPTPlanId || undefined)
      onRequested(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request this slot')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Request this slot</h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
          {cap(slot.weekday)} · {slot.startTime}–{slot.endTime} with {slot.trainerId?.name}
        </p>

        {error && (
          <p className="text-sm px-3 py-2 mb-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
            {error}
          </p>
        )}

        {plans.length > 1 && (
          <div className="mb-4">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>Which PT plan?</label>
            <select value={memberPTPlanId} onChange={(e) => setMemberPTPlanId(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
              <option value="">Select a plan</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>{p.name}{p.trainerId?.name ? ` — ${p.trainerId.name}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs mb-4" style={{ color: 'var(--color-secondary)' }}>
          Your trainer will confirm this request before it's yours.
        </p>

        <button onClick={submit} disabled={submitting}
          className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </div>
  )
}

function CancelConfirmModal({ slots, busy, errors, onClose, onConfirm }) {
  const multi = slots.length > 1
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} className="absolute text-2xl leading-none top-4 right-5" style={{ color: 'var(--color-secondary)' }}>×</button>

        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
          Cancel {multi ? `${slots.length} slots` : 'this slot'}?
        </h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
          This frees {multi ? 'them' : 'it'} up for other members to request. This can't be undone.
        </p>

        <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
          {slots.map((s) => (
            <div key={s._id} className="rounded-lg px-3 py-2 text-xs"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-primary)' }}>{cap(s.weekday)} · {s.startTime}–{s.endTime}</span>
              <span style={{ color: 'var(--color-secondary)' }}> with {s.trainerId?.name}</span>
            </div>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-4">
            {errors.map((e, i) => (
              <p key={i} className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                {e}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
            Keep {multi ? 'them' : 'it'}
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-[2] font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
            style={{ background: '#f87171', color: '#fff' }}>
            {busy ? 'Cancelling…' : `Cancel ${multi ? `${slots.length} slots` : 'slot'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
