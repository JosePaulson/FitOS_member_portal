/**
 * Two-line SVG trend chart for the homepage "Strength progress" card:
 * a lime "Strength" line (weight lifted, per workout) and a purple
 * "Endurance" line (workout duration), sharing the same timeline. Each
 * line is normalized to its own min/max so two very different units
 * (kg vs minutes) can share one chart without one flattening the other.
 *
 * Unlike BodyWeightChart, nodes carry no value labels — the two lines are
 * identified purely by color + the legend above the chart.
 */
export default function StrengthEnduranceChart({ points, emptyMessage }) {
  const sorted = [...points]
    .filter((p) => p.strength != null || p.endurance != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sorted.length < 2) {
    return (
      <p className="py-6 text-xs text-center" style={{ color: 'var(--color-secondary)' }}>
        {emptyMessage}
      </p>
    )
  }

  const width = 320
  const height = 140
  const padX = 8
  const padTop = 14
  const padBottom = 16

  const xStep = (width - padX * 2) / (sorted.length - 1)

  function buildLine(key) {
    const vals = sorted.map((p) => p[key]).filter((v) => v != null)
    if (vals.length < 2) return null
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1

    const coords = sorted
      .map((p, i) => {
        if (p[key] == null) return null
        const x = padX + i * xStep
        const y = padTop + (1 - (p[key] - min) / range) * (height - padTop - padBottom)
        return { x, y }
      })
      .filter(Boolean)

    const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
    return { coords, path }
  }

  const strengthLine = buildLine('strength')
  const enduranceLine = buildLine('endurance')

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return (
    <div>
      {/* Legend — the only place either line is named; nodes stay unlabeled */}
      <div className="flex items-center gap-4 mb-2">
        {strengthLine && (
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
            Strength
          </span>
        )}
        {enduranceLine && (
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} />
            Endurance
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
        {strengthLine && (
          <path d={strengthLine.path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {enduranceLine && (
          <path d={enduranceLine.path} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" />
        )}

        {strengthLine?.coords.map((c, i) => (
          <circle key={`s-${i}`} cx={c.x} cy={c.y} r={i === strengthLine.coords.length - 1 ? 3.5 : 2}
            fill={i === strengthLine.coords.length - 1 ? 'var(--color-accent)' : 'var(--color-surface)'}
            stroke="var(--color-accent)" strokeWidth="1.5" />
        ))}
        {enduranceLine?.coords.map((c, i) => (
          <circle key={`e-${i}`} cx={c.x} cy={c.y} r={i === enduranceLine.coords.length - 1 ? 3.5 : 2}
            fill={i === enduranceLine.coords.length - 1 ? '#a855f7' : 'var(--color-surface)'}
            stroke="#a855f7" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--color-secondary)' }}>
        <span>{new Date(first.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(last.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}
