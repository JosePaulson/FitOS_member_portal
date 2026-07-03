import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner, { EmptyState, Badge } from '../components/ui/Spinner'

const TABS = ['Workout', 'Diet', 'PT Sessions']

export default function Workouts() {
  const [tab, setTab] = useState(0)
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
      {tab === 1 && <DietTab />}
      {tab === 2 && <PTTab />}
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

function DietTab() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    portalApi.dietPlans().then(({ data }) => setPlans(data)).catch(() => { }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (plans.length === 0) return <EmptyState icon="🥗" title="No diet plans yet" sub="Your trainer will assign a diet plan here." />
  if (open) return <DietDetail plan={open} onBack={() => setOpen(null)} />

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
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-secondary)' }}>
            {plan.targetCalories && <span>🔥 {plan.targetCalories} kcal</span>}
            {plan.targetProtein && <span>🥩 {plan.targetProtein}g protein</span>}
            {plan.targetCarbs && <span>🍚 {plan.targetCarbs}g carbs</span>}
            {plan.targetFat && <span>🥑 {plan.targetFat}g fat</span>}
          </div>
        </button>
      ))}
    </div>
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
  scheduled: 'yellow',
  completed: 'lime',
  missed: 'red',
  cancelled: 'muted',
}
const PT_STATUS_LABEL = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
}

function PTTab() {
  const [sessions, setSessions] = useState([])
  const [progress, setProgress] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [ackLoading, setAckLoading] = useState(null)
  const [ackError, setAckError] = useState('')

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

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>

  /* ── Session detail view ── */
  if (selected) {
    const isPast = new Date(selected.date) <= new Date()
    const needsAck = !selected.acknowledgedByMember &&
      selected.status !== 'cancelled' && isPast

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
            </p>
            {selected.trainerId?.name && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                Trainer: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selected.trainerId.name}
                </span>
              </p>
            )}
          </div>
          <Badge color={PT_STATUS_COLOR[selected.status]}>
            {PT_STATUS_LABEL[selected.status]}
          </Badge>
        </div>

        {/* Body metrics */}
        {(selected.bodyWeight || selected.bodyFat) && (
          <div className="flex gap-8 p-4 card">
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
        ) : selected.status === 'cancelled' ? null : (
          <div className="px-4 py-3 text-xs text-center rounded-xl"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-secondary)' }}>
            This session is in the future — you can confirm attendance on the day.
          </div>
        )}
      </div>
    )
  }

  /* ── Session list view ── */
  if (sessions.length === 0) return (
    <EmptyState icon="💪" title="No PT sessions yet"
      sub="Your personal training sessions will appear here once scheduled by your trainer." />
  )

  const bwVals = progress.map((p) => p.bodyWeight)
  const bwMin = bwVals.length ? Math.min(...bwVals) : 0
  const bwMax = bwVals.length ? Math.max(...bwVals) : 1
  const bwRange = bwMax - bwMin || 1

  return (
    <div className="flex flex-col gap-5">
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
            const needsAck = !s.acknowledgedByMember && s.status !== 'cancelled' && isPast
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
                      {s.trainerId?.name ? ` · ${s.trainerId.name}` : ''}
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
                {s.bodyWeight && (
                  <div className="flex gap-4 pt-2 mt-2 text-xs"
                    style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-secondary)' }}>
                    <span>⚖️ {s.bodyWeight} kg</span>
                    {s.bodyFat && <span>🔥 {s.bodyFat}% fat</span>}
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
