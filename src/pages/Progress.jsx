import { useCallback, useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner from '../components/ui/Spinner'
import { dialog } from '../components/ui/Dialog'
import { fmtDate } from '../lib/dateIST'
import { DateInput } from '../components/ui/DateInput'

const S = { primary: 'var(--color-primary)', secondary: 'var(--color-secondary)', accent: 'var(--color-accent)', border: 'var(--color-border)' }
const inputStyle = { background: 'transparent', border: `1px solid ${S.border}`, color: S.primary }
const METRICS = [
  { key: 'weightKg', label: 'Weight', unit: 'kg' }, { key: 'bodyFatPct', label: 'Body fat', unit: '%' },
  { key: 'waistCm', label: 'Waist', unit: 'cm' }, { key: 'chestCm', label: 'Chest', unit: 'cm' },
  { key: 'hipsCm', label: 'Hips', unit: 'cm' }, { key: 'armCm', label: 'Arm', unit: 'cm' }, { key: 'thighCm', label: 'Thigh', unit: 'cm' },
]
const fmtDateY = fmtDate
const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export default function Progress() {
  const [tab, setTab] = useState('body')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [metric, setMetric] = useState('weightKg')
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    portalApi.progress().then(({ data: d }) => setData(d)).catch((e) => setError(e.response?.data?.message || 'Couldn\u2019t load your progress. Please try again.'))
  }, [])
  useEffect(() => { load() }, [load])

  if (error) return <p className="px-5 py-6 text-sm" style={{ color: '#f87171' }}>{error}</p>
  if (!data) return <div className="flex justify-center py-20"><Spinner /></div>

  const m = METRICS.find((x) => x.key === metric)
  const points = data.series[metric] || []
  const ch = data.changes[metric]

  async function remove(id) {
    if (!(await dialog.confirm({ title: 'Delete check-in?', message: 'This body check-in will be removed from your progress.', confirmLabel: 'Delete', tone: 'danger' }))) return
    try { await portalApi.deleteMeasurement(id); load() } catch { dialog.error('Please try again in a moment.', { title: 'Couldn’t delete it' }) }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: S.primary }}>Progress</h1>
        {tab === 'body' && (
          <button onClick={() => setAdding(true)} className="px-4 py-2 text-sm font-bold rounded-xl" style={{ background: S.accent, color: '#0D0D0D' }}>+ Check-in</button>
        )}
      </div>

      <div className="flex gap-2">
        {[['body', 'Body'], ['records', `Records${data.prTotal ? ` (${data.prTotal})` : ''}`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="px-4 py-2 text-sm font-semibold rounded-xl"
            style={{ border: `1px solid ${tab === k ? S.accent : S.border}`, background: tab === k ? 'rgba(200,241,53,0.12)' : 'transparent', color: tab === k ? S.accent : S.secondary }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'body' ? (
        <>
          <div className="flex gap-2 pb-1 overflow-x-auto">
            {METRICS.map((x) => (
              <button key={x.key} onClick={() => setMetric(x.key)} className="px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap"
                style={{ border: `1px solid ${metric === x.key ? S.accent : S.border}`, color: metric === x.key ? S.accent : S.secondary, background: metric === x.key ? 'rgba(200,241,53,0.1)' : 'transparent' }}>
                {x.label}
              </button>
            ))}
          </div>

          <div className="p-5 card">
            {points.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-3xl">📏</p>
                <p className="mt-2 text-sm font-semibold" style={{ color: S.primary }}>No {m.label.toLowerCase()} readings yet</p>
                <p className="mt-1 text-xs" style={{ color: S.secondary }}>Tap “+ Check-in” to add your first one.</p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-xs tracking-widest uppercase" style={{ color: S.secondary }}>{m.label} · latest</p>
                    <p className="text-3xl font-black" style={{ color: S.primary }}>{ch.latest}<span className="ml-1 text-base font-medium" style={{ color: S.secondary }}>{m.unit}</span></p>
                  </div>
                  {ch.change !== null && (
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: S.accent }}>{ch.change > 0 ? '▲' : ch.change < 0 ? '▼' : '•'} {Math.abs(ch.change)} {m.unit}</p>
                      <p className="text-[11px]" style={{ color: S.secondary }}>since {fmtDate(points[0].date)}</p>
                    </div>
                  )}
                </div>
                <LineChart points={points} unit={m.unit} />
              </>
            )}
          </div>

          {data.measurements.length > 0 && (
            <div className="flex flex-col p-5 card" style={{ gap: 0 }}>
              <p className="mb-2 text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Check-ins</p>
              {data.measurements.slice(0, 10).map((x, i) => (
                <div key={x._id} className="flex items-start justify-between gap-3 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${S.border}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: S.primary }}>{fmtDateY(x.date)}</p>
                    <p className="mt-0.5 text-xs" style={{ color: S.secondary }}>
                      {METRICS.filter((k) => typeof x[k.key] === 'number').map((k) => `${k.label} ${x[k.key]}${k.unit}`).join(' · ')}
                    </p>
                    {x.notes && <p className="mt-0.5 text-xs italic" style={{ color: S.secondary }}>{x.notes}</p>}
                  </div>
                  <button onClick={() => remove(x._id)} className="text-xs" style={{ color: S.secondary }} aria-label="Delete check-in">✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Records prs={data.prs} total={data.prTotal} />
      )}

      {adding && <AddMeasurement onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
    </div>
  )
}

function Records({ prs, total }) {
  if (!prs.length) {
    return (
      <div className="p-6 text-center card">
        <p className="text-3xl">🏆</p>
        <p className="mt-2 text-sm font-semibold" style={{ color: S.primary }}>No records yet</p>
        <p className="mt-1 text-xs" style={{ color: S.secondary }}>Log workouts with the weights you lift and your personal records show up here automatically — we'll let you know when you beat one.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: S.secondary }}>Best lift per exercise, ranked by estimated one-rep max. Showing {prs.length} of {total}.</p>
      {prs.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 p-4 card">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: S.primary }}>{p.name}</p>
            <p className="text-xs" style={{ color: S.secondary }}>{fmtDateY(p.date)} · {p.sessions} session{p.sessions === 1 ? '' : 's'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black" style={{ color: S.accent }}>{p.weight} kg × {p.reps}</p>
            <p className="text-[11px]" style={{ color: S.secondary }}>est. 1RM {p.e1rm} kg{p.improvement > 0 ? ` · +${p.improvement}` : ''}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Dependency-free SVG line chart. */
function LineChart({ points, unit }) {
  const W = 320, H = 150, P = { l: 38, r: 10, t: 12, b: 24 }
  const vals = points.map((p) => p.value)
  let min = Math.min(...vals), max = Math.max(...vals)
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.12; min -= pad; max += pad
  const times = points.map((p) => new Date(p.date).getTime())
  const t0 = Math.min(...times), t1 = Math.max(...times)
  const x = (t) => (t1 === t0 ? P.l + (W - P.l - P.r) / 2 : P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r))
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const grid = [0, 0.5, 1].map((f) => min + (max - min) * f)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Chart of ${points.length} readings`}>
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(g)} y2={y(g)} stroke="var(--color-border)" strokeWidth="1" />
          <text x={P.l - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill="var(--color-secondary)">{Math.round(g * 10) / 10}</text>
        </g>
      ))}
      {points.length > 1 && <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => <circle key={i} cx={x(times[i])} cy={y(p.value)} r={points.length > 25 ? 1.8 : 3.2} fill="var(--color-accent)" />)}
      <text x={P.l} y={H - 6} fontSize="9" fill="var(--color-secondary)">{fmtDate(points[0].date)}</text>
      {points.length > 1 && <text x={W - P.r} y={H - 6} textAnchor="end" fontSize="9" fill="var(--color-secondary)">{fmtDate(points[points.length - 1].date)}</text>}
    </svg>
  )
}

function AddMeasurement({ onClose, onSaved }) {
  const [f, setF] = useState({ date: todayIST(), notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    const body = { date: f.date, notes: f.notes }
    METRICS.forEach((m) => { if (f[m.key] !== undefined && f[m.key] !== '') body[m.key] = f[m.key] })
    if (!METRICS.some((m) => body[m.key] !== undefined)) { setError('Enter at least one measurement.'); return }
    setSaving(true)
    try { await portalApi.addMeasurement(body); onSaved() }
    catch (err) { setError(err.response?.data?.message || 'Couldn\u2019t save that. Please check the numbers.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full max-w-md gap-4 p-5 overflow-y-auto rounded-t-3xl" style={{ background: 'var(--color-surface-2, #1a1a1a)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: S.primary }}>New check-in</h2>
          <button type="button" onClick={onClose} className="text-xl leading-none" style={{ color: S.secondary }}>×</button>
        </div>
        {error && <p className="px-3 py-2 text-sm rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{error}</p>}
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase" style={{ color: S.secondary }}>Date
          <DateInput value={f.date} max={todayIST()} onChange={set('date')} className="px-3 py-2.5 text-sm font-normal normal-case rounded-xl" style={inputStyle} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {METRICS.map((m) => (
            <label key={m.key} className="flex flex-col gap-1 text-xs font-semibold uppercase" style={{ color: S.secondary }}>{m.label} ({m.unit})
              <input type="number" inputMode="decimal" step="0.1" value={f[m.key] ?? ''} onChange={set(m.key)} className="px-3 py-2.5 text-sm font-normal rounded-xl" style={inputStyle} />
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase" style={{ color: S.secondary }}>Notes (optional)
          <input value={f.notes} onChange={set('notes')} maxLength={300} className="px-3 py-2.5 text-sm font-normal normal-case rounded-xl" style={inputStyle} placeholder="Morning, before breakfast" />
        </label>
        <p className="text-[11px]" style={{ color: S.secondary }}>Fill in whatever you measured — every field is optional.</p>
        <button type="submit" disabled={saving} className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold rounded-xl disabled:opacity-60" style={{ background: S.accent, color: '#0D0D0D' }}>
          {saving && <Spinner size="sm" />}{saving ? 'Saving…' : 'Save check-in'}
        </button>
      </form>
    </div>
  )
}
