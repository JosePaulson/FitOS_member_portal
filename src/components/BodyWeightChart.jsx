/**
 * Simple SVG line chart for body-weight over time. No charting library —
 * keeps the PWA bundle lean. `points` is [{ date, bodyWeight }], any order.
 */
export default function BodyWeightChart({ points }) {
  const sorted = [...points]
    .filter((p) => p.bodyWeight != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sorted.length < 2) {
    return (
      <p className="py-6 text-xs text-center" style={{ color: 'var(--color-secondary)' }}>
        Log body weight a couple more times to see your trend here.
      </p>
    )
  }

  const width = 320
  const height = 140
  const padX = 8
  const padY = 16

  const weights = sorted.map((p) => p.bodyWeight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const xStep = (width - padX * 2) / (sorted.length - 1)
  const coords = sorted.map((p, i) => {
    const x = padX + i * xStep
    const y = padY + (1 - (p.bodyWeight - min) / range) * (height - padY * 2)
    return { x, y, ...p }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const delta = +(last.bodyWeight - first.bodyWeight).toFixed(1)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>{last.bodyWeight}</span>
          <span className="ml-1 text-xs" style={{ color: 'var(--color-secondary)' }}>kg latest</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: delta <= 0 ? '#4ade80' : '#f87171' }}>
          {delta > 0 ? '+' : ''}{delta}kg since first log
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bwFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#bwFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2}
            fill={i === coords.length - 1 ? 'var(--color-accent)' : 'var(--color-surface)'}
            stroke="var(--color-accent)" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--color-secondary)' }}>
        <span>{new Date(first.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(last.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}
