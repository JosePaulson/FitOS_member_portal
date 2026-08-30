import { useState } from 'react'
import { useHydration } from '../context/HydrationContext'

function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Drops into Profile — lets a member turn on hydration ("drink water")
 * reminders, pick which times of day they fire, and choose a tone.
 * All the scheduling logic lives in HydrationContext; this is presentation
 * + the "add a time" form only.
 */
export default function HydrationReminders() {
  const h = useHydration()
  const [busy, setBusy] = useState(false)
  const [newTime, setNewTime] = useState('08:00')
  const [timeError, setTimeError] = useState('')

  if (!h.supported) return null

  async function toggle() {
    setBusy(true)
    if (h.enabled) h.disable()
    else await h.enable()
    setBusy(false)
  }

  function handleAddTime() {
    setTimeError('')
    if (!h.addTime(newTime)) {
      setTimeError(h.times.includes(newTime) ? 'That time is already set' : 'Pick a valid time')
    }
  }

  return (
    <div id="hydration" className="p-5 card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
            🥛 Hydration Reminders
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
            {h.enabled
              ? `${h.times.length} reminder${h.times.length === 1 ? '' : 's'} a day to drink water`
              : h.permission === 'denied'
                ? 'Blocked — enable notifications in your browser settings'
                : 'Get nudged to drink water throughout the day'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy || h.permission === 'denied'}
          className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 shrink-0"
          style={
            h.enabled
              ? { border: '1px solid var(--color-border)', color: 'var(--color-secondary)' }
              : { background: 'var(--color-accent)', color: '#0D0D0D' }
          }
        >
          {busy ? '…' : h.enabled ? 'Turn off' : 'Enable'}
        </button>
      </div>

      {h.error && (
        <p className="mt-3 text-xs" style={{ color: '#f87171' }}>{h.error}</p>
      )}

      {h.enabled && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* ── Reminder times ── */}
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Reminder times</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {h.times.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>No times set — add one below.</p>
            )}
            {h.times.map((t) => (
              <span key={t}
                className="flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 py-1.5 rounded-full"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
                💧 {to12Hour(t)}
                <button onClick={() => h.removeTime(t)} aria-label={`Remove ${to12Hour(t)}`}
                  className="text-sm leading-none" style={{ color: 'var(--color-secondary)' }}>×</button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }} />
            <button onClick={handleAddTime}
              className="text-xs font-bold px-3.5 py-2 rounded-lg shrink-0"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>
              + Add
            </button>
          </div>
          {timeError && <p className="text-[11px] mb-3" style={{ color: '#f87171' }}>{timeError}</p>}

          {/* ── Tone ── */}
          <p className="text-xs font-semibold mt-4 mb-2" style={{ color: 'var(--color-primary)' }}>Reminder tone</p>
          <div className="flex flex-wrap gap-2">
            {h.tones.map((t) => (
              <button key={t.id} onClick={() => { h.setTone(t.id); h.previewTone(t.id) }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: h.tone === t.id ? 'rgba(200,241,53,0.12)' : 'var(--color-surface-2)',
                  border: h.tone === t.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  color: h.tone === t.id ? 'var(--color-accent)' : 'var(--color-primary)',
                }}>
                {h.tone === t.id ? '🔊' : '🔈'} {t.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-secondary)' }}>Tap a tone to hear a preview.</p>

          <p className="text-[10px] mt-4" style={{ color: 'var(--color-secondary)' }}>
            Reminders fire while FitOS is open — in this tab or a background one. Keep it installed and open in the background for the most reliable alerts; fully closing it pauses reminders, a limitation of browser-based alarms.
          </p>
        </div>
      )}
    </div>
  )
}
