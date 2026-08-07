/**
 * Two-line SVG trend chart: a lime "Weight" line (body weight, kg) and a
 * rust "Calories" line (calories burned per session), sharing the same
 * timeline. Each line is normalized to its own min/max so the two very
 * different units can share one chart without one flattening the other.
 *
 * Props:
 * - curved: draw a smooth curve through every point (Catmull-Rom, so the
 *   line still passes through each real reading — it's not decorative,
 *   just not sharp straight segments) instead of a plain polyline.
 * - showNodes: draw a small circle at each reading. The default polyline
 *   mode shows them; turn off for a smooth many-point wave, which reads
 *   better without a dot at every wobble.
 * - footer: the small "first date … last date" row under the chart. Off
 *   when a caller wants to render its own (richer) summary instead.
 *
 * No per-node value labels regardless of mode — the two lines are
 * identified purely by color + the legend above the chart.
 */
const CALORIES_COLOR = '#c2410c'

// Catmull-Rom → cubic Bezier conversion, tension 1/6 (a standard default).
// Passes exactly through every input point, unlike a decorative wave —
// the shape genuinely reflects the data, it's just smoothed between points
// instead of sharp-angled straight segments.
function smoothPath(coords) {
  if (coords.length < 2) return ''
  if (coords.length === 2) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`
  }
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} `
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? i : i - 1]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `
  }
  return d.trim()
}

function straightPath(coords) {
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
}

export default function WeightCaloriesChart({ points, emptyMessage, curved = false, showNodes = true, footer = true }) {
  const sorted = [...points]
    .filter((p) => p.bodyWeight != null || p.caloriesBurned != null)
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
    // Every reading that has this metric, keeping its position among ALL
    // readings (not just this metric's own subset) — so if weight and
    // calories are logged on different sessions, each line still sits at
    // its own true point in time rather than bunching together.
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

    const path = curved ? smoothPath(coords) : straightPath(coords)
    return { coords, path }
  }

  const weightLine = buildLine('bodyWeight')
  const caloriesLine = buildLine('caloriesBurned')

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return (
    <div>
      {/* Legend — the only place either line is named; nodes (when shown) stay unlabeled */}
      <div className="flex items-center gap-4 mb-2">
        {weightLine && (
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
            Weight
          </span>
        )}
        {caloriesLine && (
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CALORIES_COLOR }} />
            Calories
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
        {weightLine && (
          <path d={weightLine.path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {caloriesLine && (
          <path d={caloriesLine.path} fill="none" stroke={CALORIES_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" />
        )}

        {showNodes && weightLine?.coords.map((c, i) => (
          <circle key={`w-${i}`} cx={c.x} cy={c.y} r={i === weightLine.coords.length - 1 ? 3.5 : 2}
            fill={i === weightLine.coords.length - 1 ? 'var(--color-accent)' : 'var(--color-surface)'}
            stroke="var(--color-accent)" strokeWidth="1.5" />
        ))}
        {showNodes && caloriesLine?.coords.map((c, i) => (
          <circle key={`c-${i}`} cx={c.x} cy={c.y} r={i === caloriesLine.coords.length - 1 ? 3.5 : 2}
            fill={i === caloriesLine.coords.length - 1 ? CALORIES_COLOR : 'var(--color-surface)'}
            stroke={CALORIES_COLOR} strokeWidth="1.5" />
        ))}
      </svg>

      {footer && (
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--color-secondary)' }}>
          <span>{new Date(first.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(last.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
      )}
    </div>
  )
}
