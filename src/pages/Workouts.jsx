import { useEffect, useState, useMemo } from 'react'
import { portalApi } from '../api/index'
import Spinner, { EmptyState, Badge } from '../components/ui/Spinner'
import FoodScannerModal from '../components/FoodScanner'
import { useLocation } from 'react-router-dom'
import RecentScans from '../components/RecentScans'

const TABS = ['Workout', 'Diet', 'PT Sessions']

export default function Workouts() {
  const [tab, setTab] = useState(0)
  const [pendingSessionId, setPendingSessionId] = useState(null)
  const [autoOpenScanner, setAutoOpenScanner] = useState(false)
  const { state } = useLocation()

  useEffect(() => {
    if (state?.tab !== undefined) setTab(state.tab)
    if (state?.sessionId) setPendingSessionId(state.sessionId)
    if (state?.openScanner) setAutoOpenScanner(true)
  }, [state])
  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>My programmes</h1>
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className="flex-1 py-2 text-xs font-semibold transition-all rounded-lg"
            style={{ background: tab === i ? 'var(--color-accent)' : 'transparent', color: tab === i ? '#0D0D0D' : 'var(--color-secondary)' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <WorkoutTab />}
      {tab === 1 && (
        <DietTab
          autoOpenScanner={autoOpenScanner}
          onConsumedAutoOpen={() => setAutoOpenScanner(false)}
        />
      )}
      {tab === 2 && (
        <PTTab
          initialSessionId={pendingSessionId}
          onConsumedInitialSession={() => setPendingSessionId(null)}
        />
      )}
    </div>
  )
}

function WorkoutTab() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    portalApi.workoutPlans().then(({ data }) => setPlans(data)).catch(() => { }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (plans.length === 0) return <EmptyState icon="🏋️" title="No workout plans yet" sub="Your trainer will assign a workout programme here." />
  if (open) return <WorkoutDetail plan={open} onBack={() => setOpen(null)} />

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan) => (
        <button key={plan._id} onClick={() => setOpen(plan)}
          className="w-full p-5 text-left transition-all card"
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{plan.name}</h3>
            <Badge color="lime">{plan.goal?.replace('-', ' ')}</Badge>
          </div>
          {plan.description && <p className="mb-3 text-xs" style={{ color: 'var(--color-secondary)' }}>{plan.description}</p>}
          <div className="flex gap-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
            {plan.durationWeeks && <span>📅 {plan.durationWeeks} weeks</span>}
            {plan.days?.length > 0 && <span>💪 {plan.days.length} training days</span>}
          </div>
        </button>
      ))}
    </div>
  )
}

function WorkoutDetail({ plan, onBack }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--color-secondary)' }}>← Back to plans</button>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{plan.name}</h2>
        {plan.description && <p className="mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>{plan.description}</p>}
        <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--color-secondary)' }}>
          <span style={{ color: 'var(--color-accent)' }}>🎯 {plan.goal?.replace('-', ' ')}</span>
          {plan.durationWeeks && <span>📅 {plan.durationWeeks} weeks</span>}
        </div>
      </div>
      {plan.days?.length > 0 ? (
        <div className="flex flex-col gap-4">
          {plan.days.map((day, i) => (
            <div key={i} className="p-5 card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{day.day}</h3>
                {day.focus && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(200,241,53,0.1)', color: 'var(--color-accent)' }}>{day.focus}</span>
                )}
              </div>
              {day.exercises?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {day.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center justify-between py-2 text-sm"
                      style={{ borderTop: j === 0 ? 'none' : '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-primary)' }}>{ex.name}</span>
                      <div className="flex gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                        {ex.sets && <span>{ex.sets} sets</span>}
                        {ex.reps && <span>× {ex.reps}</span>}
                        {ex.durationSec && <span>{ex.durationSec}s</span>}
                        {ex.restSec && <span style={{ opacity: 0.6 }}>| {ex.restSec}s rest</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>No exercises added yet</p>}
            </div>
          ))}
        </div>
      ) : <EmptyState icon="📋" title="No days added" sub="Your trainer will add exercises soon." />}
    </div>
  )
}

function DietTab({ autoOpenScanner, onConsumedAutoOpen }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scans, setScans] = useState([])
  const [scansLoading, setScansLoading] = useState(true)

  function loadScans() {
    setScansLoading(true)
    portalApi.foodScanHistory({ limit: 10 })
      .then(({ data }) => setScans(data.scans || []))
      .catch(() => { })
      .finally(() => setScansLoading(false))
  }

  useEffect(() => {
    portalApi.dietPlans().then(({ data }) => setPlans(data)).catch(() => { }).finally(() => setLoading(false))
    loadScans()
  }, [])

  // Deep link from the Home screen's floating "Scan Meal" button
  useEffect(() => {
    if (autoOpenScanner) {
      setShowScanner(true)
      onConsumedAutoOpen?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenScanner])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (open) return <DietDetail plan={open} onBack={() => setOpen(null)} />

  return (
    <div className="flex flex-col gap-5">
      {/* ── Scan Meal ── */}
      <div className="flex flex-col gap-3">
        <button onClick={() => setShowScanner(true)}
          className="w-full font-bold py-3.5 rounded-xl text-sm transition-all"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          📸 Scan a Meal
        </button>
        <p className="text-[11px] text-center -mt-1" style={{ color: 'var(--color-secondary)' }}>
          AI-estimated calories are approximate — see disclaimer after each scan.
        </p>
      </div>
      {showScanner && (
        <FoodScannerModal onClose={() => setShowScanner(false)} onSaved={loadScans} />
      )}

      {/* ── Recent scans ── */}
      <RecentScans scans={scans} scansLoading={scansLoading} />


      {/* ── Assigned diet plans ── */}
      <div>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>My diet plans</h3>
        {plans.length === 0 ? (
          <EmptyState icon="🥗" title="No diet plans yet" sub="Your trainer will assign a diet plan here." />
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <button key={plan._id} onClick={() => setOpen(plan)}
                className="w-full p-5 text-left transition-all card"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{plan.name}</h3>
                  <Badge color="lime">{plan.goal?.replace('-', ' ')}</Badge>
                </div>
                {plan.description && <p className="mb-3 text-xs" style={{ color: 'var(--color-secondary)' }}>{plan.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-secondary)' }}>
                  {plan.targetCalories && <span>🔥 {plan.targetCalories} kcal</span>}
                  {plan.targetProtein && <span>🥩 {plan.targetProtein}g protein</span>}
                  {plan.targetCarbs && <span>🍚 {plan.targetCarbs}g carbs</span>}
                  {plan.targetFat && <span>🥑 {plan.targetFat}g fat</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div >
  )
}

function DietDetail({ plan, onBack }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--color-secondary)' }}>← Back to diet plans</button>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{plan.name}</h2>
        {plan.description && <p className="mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>{plan.description}</p>}
      </div>
      {(plan.targetCalories || plan.targetProtein) && (
        <div className="p-5 card">
          <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>Daily targets</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', value: plan.targetCalories, unit: 'kcal', icon: '🔥' },
              { label: 'Protein', value: plan.targetProtein, unit: 'g', icon: '🥩' },
              { label: 'Carbs', value: plan.targetCarbs, unit: 'g', icon: '🍚' },
              { label: 'Fat', value: plan.targetFat, unit: 'g', icon: '🥑' },
            ].filter((m) => m.value).map(({ label, value, unit, icon }) => (
              <div key={label}>
                <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{icon} {label}</span>
                <p className="font-bold" style={{ color: 'var(--color-primary)' }}>
                  {value}<span className="ml-1 text-xs" style={{ color: 'var(--color-secondary)' }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {plan.meals?.length > 0 && (
        <div className="flex flex-col gap-3">
          {plan.meals.map((meal, i) => (
            <div key={i} className="p-5 card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{meal.name}</h3>
                {meal.time && <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{meal.time}</span>}
              </div>
              {meal.notes && <p className="mb-3 text-xs italic" style={{ color: 'var(--color-secondary)' }}>{meal.notes}</p>}
              {meal.items?.length > 0 && (
                <div className="flex flex-col gap-1">
                  {meal.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5 text-sm"
                      style={{ borderTop: j === 0 ? 'none' : '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ color: 'var(--color-primary)' }}>{item.food}</span>
                        {item.quantity && <span className="ml-2 text-xs" style={{ color: 'var(--color-secondary)' }}>{item.quantity}</span>}
                      </div>
                      {item.calories && <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{item.calories} kcal</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PT_STATUS_COLOR = {
  pending: 'blue',
  scheduled: 'yellow',
  completed: 'lime',
  missed: 'red',
  cancelled: 'muted',
  declined: 'red',
}
const PT_STATUS_LABEL = {
  pending: 'Awaiting confirmation',
  scheduled: 'Scheduled',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
  declined: 'Declined',
}

function PTTab({ initialSessionId, onConsumedInitialSession }) {
  const [sessions, setSessions] = useState([])
  const [progress, setProgress] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [ackLoading, setAckLoading] = useState(null)
  const [ackError, setAckError] = useState('')
  const [showBooking, setShowBooking] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  async function load() {
    try {
      const [sessRes, progRes] = await Promise.all([
        portalApi.ptSessions({ limit: 50 }),
        portalApi.ptProgress(),
      ])
      setSessions(sessRes.data.sessions || [])
      setStats({
        completed: sessRes.data.totalCompleted || 0,
        scheduled: sessRes.data.totalScheduled || 0,
      })
      setProgress(progRes.data || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Deep link from the attendance calendar — open the specific PT session
  // that was tapped, once the session list has finished loading.
  useEffect(() => {
    if (!initialSessionId || loading) return
    const found = sessions.find((s) => s._id === initialSessionId)
    if (found) {
      setSelected(found)
      onConsumedInitialSession?.()
    } else {
      // Not in the first page of results (or older than the load limit) —
      // fetch it directly so the deep link still works.
      portalApi.ptSession(initialSessionId)
        .then(({ data }) => setSelected(data))
        .catch(() => { })
        .finally(() => onConsumedInitialSession?.())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId, loading])

  async function acknowledge(sessionId) {
    setAckLoading(sessionId)
    setAckError('')
    try {
      const { data } = await portalApi.ptAcknowledge(sessionId)
      // Update the session in our local list immediately
      setSessions((prev) => prev.map((s) => s._id === sessionId ? data.session : s))
      // If we're in detail view, update that too
      if (selected?._id === sessionId) setSelected(data.session)
    } catch (err) {
      setAckError(err.response?.data?.message || 'Could not acknowledge session')
    } finally { setAckLoading(null) }
  }

  async function cancelBooking(sessionId) {
    setCancelling(true)
    setCancelError('')
    try {
      const { data } = await portalApi.ptCancel(sessionId)
      setSessions((prev) => prev.map((s) => s._id === sessionId ? data.session : s))
      if (selected?._id === sessionId) setSelected(data.session)
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Could not cancel this booking')
    } finally { setCancelling(false) }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>

  /* ── Session detail view ── */
  if (selected) {
    const isPast = new Date(selected.date) <= new Date()
    const needsAck = !selected.acknowledgedByMember &&
      !['cancelled', 'pending', 'declined'].includes(selected.status) && isPast

    return (
      <div className="flex flex-col gap-4 animate-fade-up">
        <button onClick={() => { setSelected(null); setAckError('') }}
          className="flex items-center self-start gap-2 text-sm transition-colors"
          style={{ color: 'var(--color-secondary)' }}>
          ← Back to sessions
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
              {selected.title || 'PT Session'}
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
              {new Date(selected.date).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
              {hasTimeComponent(selected.date) && ` · ${formatTime(selected.date)}`}
            </p>
            {selected.trainerId?.name ? (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                Trainer: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selected.trainerId.name}
                </span>
              </p>
            ) : selected.requestedTrainerId?.name ? (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                Requested: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selected.requestedTrainerId.name}
                </span>
              </p>
            ) : selected.bookingSource === 'member' ? (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>No trainer preference</p>
            ) : null}
          </div>
          <Badge color={PT_STATUS_COLOR[selected.status]}>
            {PT_STATUS_LABEL[selected.status]}
          </Badge>
        </div>

        {/* Booking request states — pending confirmation / declined */}
        {selected.status === 'pending' && (
          <div className="px-4 py-3 text-xs rounded-xl"
            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa' }}>
            You requested this slot — a trainer will confirm it shortly.
          </div>
        )}
        {selected.status === 'declined' && (
          <div className="px-4 py-3 text-xs rounded-xl"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
            This request was declined{selected.declineReason ? `: ${selected.declineReason}` : '.'} Try booking another slot.
          </div>
        )}

        {/* Body metrics */}
        {(selected.bodyWeight || selected.bodyFat || selected.caloriesBurned || selected.durationMinutes) && (
          <div className="flex flex-wrap gap-8 p-4 card">
            {selected.bodyWeight && (
              <div>
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Body weight</p>
                <p className="text-3xl font-black mt-0.5" style={{ color: 'var(--color-primary)' }}>
                  {selected.bodyWeight} <span className="text-sm font-normal">kg</span>
                </p>
              </div>
            )}
            {selected.bodyFat && (
              <div>
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Body fat</p>
                <p className="text-3xl font-black mt-0.5" style={{ color: 'var(--color-primary)' }}>
                  {selected.bodyFat}<span className="text-sm font-normal">%</span>
                </p>
              </div>
            )}
            {selected.caloriesBurned && (
              <div>
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Calories burned</p>
                <p className="text-3xl font-black mt-0.5" style={{ color: '#fbbf24' }}>
                  🔥 {selected.caloriesBurned}
                </p>
              </div>
            )}
            {selected.durationMinutes && (
              <div>
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Duration</p>
                <p className="text-3xl font-black mt-0.5" style={{ color: 'var(--color-primary)' }}>
                  {selected.durationMinutes}<span className="text-sm font-normal"> min</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Exercises */}
        {selected.exercises?.length > 0 && (
          <div className="p-4 card">
            <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>Exercises</h3>
            <div className="flex flex-col">
              {selected.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{ex.name}</p>
                    {ex.notes && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>{ex.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                    {ex.sets && <span>{ex.sets} sets</span>}
                    {ex.reps && <span>× {ex.reps}</span>}
                    {ex.weight && (
                      <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
                        @ {ex.weight}kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment used in this session */}
        {selected.equipment?.length > 0 && (
          <div className="p-4 card">
            <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>Equipment used</h3>
            <div className="flex flex-wrap gap-2">
              {selected.equipment.map((eq) => (
                <div key={eq._id} className="flex items-center gap-2 rounded-lg pl-1.5 pr-3 py-1.5"
                  style={{ background: 'var(--color-surface-3)' }}>
                  <div className="flex items-center justify-center overflow-hidden rounded w-7 h-7 shrink-0"
                    style={{ background: 'var(--color-surface-2)' }}>
                    {eq.imageUrl
                      ? <img src={eq.imageUrl} alt={eq.name} className="object-cover w-full h-full" />
                      : <span className="text-xs">🏋️</span>
                    }
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{eq.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference workouts — with photo or short demo video */}
        {selected.workouts?.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>Reference workouts</h3>
            {selected.workouts.map((w) => (
              <div key={w._id} className="overflow-hidden card">
                {(w.videoUrl || w.imageUrl) && (
                  <div className="flex items-center justify-center overflow-hidden aspect-video" style={{ background: 'var(--color-surface-3)' }}>
                    {w.videoUrl
                      ? <video src={w.videoUrl} className="object-cover w-full h-full" controls playsInline />
                      : <img src={w.imageUrl} alt={w.name} className="object-cover w-full h-full" />
                    }
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{w.name}</p>
                  {w.videoDurationSec && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                      ▶ {Math.round(w.videoDurationSec)}s demo
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trainer notes */}
        {selected.notes && (
          <div className="p-4 card">
            <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
              Trainer notes
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary)' }}>
              {selected.notes}
            </p>
          </div>
        )}

        {/* Acknowledge / confirmed state */}
        {ackError && (
          <div className="px-4 py-3 text-xs rounded-xl"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
            {ackError}
          </div>
        )}

        {needsAck ? (
          <button
            onClick={() => acknowledge(selected._id)}
            disabled={ackLoading === selected._id}
            className="w-full font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
            {ackLoading === selected._id ? 'Confirming…' : '✓ Confirm I attended this session'}
          </button>
        ) : selected.acknowledgedByMember ? (
          <div className="rounded-xl px-4 py-3.5 text-sm text-center font-semibold"
            style={{
              background: 'rgba(200,241,53,0.08)',
              border: '1px solid rgba(200,241,53,0.2)',
              color: 'var(--color-accent)',
            }}>
            ✓ You confirmed attendance on{' '}
            {new Date(selected.acknowledgedAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
        ) : ['cancelled', 'pending', 'declined'].includes(selected.status) ? null : (
          <div className="px-4 py-3 text-xs text-center rounded-xl"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-secondary)' }}>
            This session is in the future — you can confirm attendance on the day.
          </div>
        )}

        {/* Member can withdraw a booking they made, while it's still upcoming */}
        {selected.bookingSource === 'member' &&
          ['pending', 'scheduled'].includes(selected.status) &&
          new Date(selected.date) > new Date() && (
            <>
              {cancelError && (
                <p className="text-xs text-center" style={{ color: '#f87171' }}>{cancelError}</p>
              )}
              <button
                onClick={() => cancelBooking(selected._id)}
                disabled={cancelling}
                className="w-full py-3 text-sm font-semibold transition-all rounded-xl disabled:opacity-60"
                style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {cancelling ? 'Cancelling…' : 'Cancel this booking'}
              </button>
            </>
          )}
      </div>
    )
  }

  /* ── Session list view ── */
  if (sessions.length === 0) return (
    <div className="flex flex-col gap-4">
      <EmptyState icon="💪" title="No PT sessions yet"
        sub="Book a slot with a trainer, or wait for one to schedule you." />
      <button onClick={() => setShowBooking(true)}
        className="w-full font-bold py-3.5 rounded-xl text-sm transition-all"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
        📅 Book a PT session
      </button>
      {showBooking && (
        <BookingModal onClose={() => setShowBooking(false)} onBooked={() => { setShowBooking(false); load() }} />
      )}
    </div>
  )

  const bwVals = progress.map((p) => p.bodyWeight)
  const bwMin = bwVals.length ? Math.min(...bwVals) : 0
  const bwMax = bwVals.length ? Math.max(...bwVals) : 1
  const bwRange = bwMax - bwMin || 1

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => setShowBooking(true)}
        className="w-full font-bold py-3.5 rounded-xl text-sm transition-all"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
        📅 Book a PT session
      </button>
      {showBooking && (
        <BookingModal onClose={() => setShowBooking(false)} onBooked={() => { setShowBooking(false); load() }} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Completed', value: stats.completed || 0, accent: true },
          { label: 'Upcoming', value: stats.scheduled || 0, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className="p-4 text-center card">
            <p className="text-2xl font-black" style={{ color: accent ? 'var(--color-accent)' : 'var(--color-primary)' }}>
              {value}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--color-secondary)' }}>
              Sessions<br />{label}
            </p>
          </div>
        ))}
      </div>

      {/* Body weight progress chart */}
      {progress.length > 1 && (
        <div className="p-4 card">
          <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            Body weight progress
          </h3>
          <div className="flex items-end gap-1 h-14">
            {progress.map((p, i) => {
              const pct = ((p.bodyWeight - bwMin) / bwRange) * 100
              const barH = `${Math.max(10, pct)}%`
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[9px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {p.bodyWeight}
                  </span>
                  <div className="w-full rounded-t" style={{ height: barH, background: 'rgba(200,241,53,0.35)' }} />
                  <span className="text-[8px]" style={{ color: 'var(--color-secondary)' }}>
                    {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
            <span>Start: {progress[0].bodyWeight} kg</span>
            <span style={{ color: progress.at(-1).bodyWeight < progress[0].bodyWeight ? 'var(--color-accent)' : '#f87171', fontWeight: 600 }}>
              {progress.at(-1).bodyWeight < progress[0].bodyWeight ? '↓' : '↑'}{' '}
              {Math.abs(progress.at(-1).bodyWeight - progress[0].bodyWeight).toFixed(1)} kg
            </span>
            <span>Latest: {progress.at(-1).bodyWeight} kg</span>
          </div>
        </div>
      )}

      {/* Session list */}
      <div>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>All sessions</h3>
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const isPast = new Date(s.date) <= new Date()
            const needsAck = !s.acknowledgedByMember &&
              !['cancelled', 'pending', 'declined'].includes(s.status) && isPast
            return (
              <button key={s._id} onClick={() => { setSelected(s); setAckError('') }}
                className="w-full p-4 text-left transition-all card"
                style={{ borderColor: needsAck ? 'rgba(251,191,36,0.35)' : 'var(--color-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = needsAck ? 'rgba(251,191,36,0.35)' : 'var(--color-border)'}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-primary)' }}>
                      {s.title || 'PT Session'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                      {new Date(s.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                      {hasTimeComponent(s.date) && ` · ${formatTime(s.date)}`}
                      {s.trainerId?.name
                        ? ` · ${s.trainerId.name}`
                        : s.bookingSource === 'member' ? ' · No trainer assigned yet' : ''}
                    </p>
                    {s.exercises?.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                        {s.exercises.length} exercise{s.exercises.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge color={PT_STATUS_COLOR[s.status]}>{PT_STATUS_LABEL[s.status]}</Badge>
                    {s.acknowledgedByMember && (
                      <span className="text-[10px]" style={{ color: 'var(--color-accent)' }}>✓ Confirmed</span>
                    )}
                    {needsAck && (
                      <span className="text-[10px]" style={{ color: '#fbbf24' }}>Tap to confirm</span>
                    )}
                  </div>
                </div>
                {(s.bodyWeight || s.caloriesBurned) && (
                  <div className="flex gap-4 pt-2 mt-2 text-xs"
                    style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-secondary)' }}>
                    {s.bodyWeight && <span>⚖️ {s.bodyWeight} kg</span>}
                    {s.bodyFat && <span>🔥 {s.bodyFat}% fat</span>}
                    {s.caloriesBurned && <span>⚡ {s.caloriesBurned} kcal</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Date/time helpers ──────────────────────────────────────────────────── */
// Trainer-scheduled sessions historically only carry a date (midnight);
// member bookings always carry a real time. Use that to decide whether to
// show a time alongside the date.
function hasTimeComponent(dateStr) {
  const d = new Date(dateStr)
  return d.getHours() !== 0 || d.getMinutes() !== 0
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

// Gym hours for bookable slots — 6:00 AM to 9:00 PM, every 30 minutes
const TIME_SLOTS = []
for (let h = 6; h <= 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 21 && m > 0) continue
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}
function slotLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function monthCells(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

/* ── Booking modal — calendar-based PT session request ─────────────────── */
function BookingModal({ onClose, onBooked }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [date, setDate] = useState(null)
  const [time, setTime] = useState('')
  const [trainers, setTrainers] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    portalApi.ptTrainers().then(({ data }) => setTrainers(data || [])).catch(() => { })
  }, [])

  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

  async function submit() {
    if (!date || !time) { setError('Pick a date and time'); return }
    setError(''); setSubmitting(true)
    try {
      const [h, m] = time.split(':').map(Number)
      const when = new Date(date)
      when.setHours(h, m, 0, 0)

      await portalApi.ptRequest({
        date: when.toISOString(),
        trainerId: trainerId || undefined,
        notes,
        durationMinutes: 60,
      })
      setDone(true)
      setTimeout(() => onBooked(), 900)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not book this slot — try another time')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose}
          className="absolute text-2xl leading-none top-4 right-5"
          style={{ color: 'var(--color-secondary)' }}>×</button>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Request sent</p>
            <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              A trainer will confirm your slot soon — you'll see it under "Awaiting confirmation".
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Book a PT session</h2>
            <p className="mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
              Pick a date and time — a trainer will confirm it from their dashboard.
            </p>

            {/* Calendar */}
            <div className="p-3 mb-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  disabled={isCurrentMonth}
                  className="flex items-center justify-center rounded-lg w-7 h-7 disabled:opacity-30"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>‹</button>
                <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                  {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="flex items-center justify-center rounded-lg w-7 h-7"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--color-secondary)' }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCells(month).map((d, i) => {
                  if (!d) return <div key={i} />
                  const disabled = d < today
                  const isSelected = date && sameDay(d, date)
                  const isToday = sameDay(d, today)
                  return (
                    <button key={i} disabled={disabled}
                      onClick={() => { setDate(d); setError('') }}
                      className="text-xs font-semibold transition-all rounded-lg aspect-square disabled:opacity-25"
                      style={{
                        background: isSelected ? 'var(--color-accent)' : 'transparent',
                        color: isSelected ? '#0D0D0D' : 'var(--color-primary)',
                        border: isToday && !isSelected ? '1px solid var(--color-accent)' : '1px solid transparent',
                      }}>
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {date && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
                  Time on {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} onClick={() => { setTime(slot); setError('') }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: time === slot ? 'var(--color-accent)' : 'var(--color-surface-3)',
                        color: time === slot ? '#0D0D0D' : 'var(--color-primary)',
                      }}>
                      {slotLabel(slot)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trainer preference */}
            <div className="mb-3">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>
                Preferred trainer (optional)
              </label>
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                <option value="">No preference</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}{t.role === 'owner' ? ' (Owner)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-secondary)' }}>
                What do you want to focus on? (optional)
              </label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Leg day, form check on squats…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
            </div>

            {error && (
              <p className="mb-3 text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
            )}

            <button onClick={submit} disabled={submitting || !date || !time}
              className="w-full font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
              {submitting ? 'Sending request…' : 'Request this slot'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}