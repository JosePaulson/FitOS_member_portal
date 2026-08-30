/**
 * Selectable tones for the hydration reminder — synthesized on the fly
 * with the Web Audio API instead of shipping audio files, so there's
 * nothing to host or license and every tone is a few bytes of code.
 *
 * Each tone is a list of notes: [frequencyHz, startDelaySec, durationSec].
 */
export const HYDRATION_TONES = [
  { id: 'chime',   label: 'Chime',       notes: [[880,    0,    0.14], [1318.5, 0.12, 0.22]], loopGap: 0.5 },
  { id: 'bell',    label: 'Soft Bell',   notes: [[1046.5, 0,    0.4]],                        loopGap: 0.6 },
  { id: 'marimba', label: 'Marimba',     notes: [[523.25, 0,    0.1],  [659.25, 0.09, 0.1], [783.99, 0.18, 0.2]], loopGap: 0.4 },
  { id: 'droplet', label: 'Droplet',     notes: [[1400,   0,    0.06], [850,    0.05, 0.16]], loopGap: 0.35 },
  { id: 'beep',    label: 'Digital Beep', notes: [[1500,  0,    0.09], [1500,   0.16, 0.09]], loopGap: 0.3 },
]

let sharedContext = null
// Every oscillator currently scheduled by playAlarmLoop — kept around so
// stopAlarmLoop() can silence anything not yet played, not just what's
// already sounding.
let scheduledOscillators = []

function getContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedContext) sharedContext = new AudioCtx()
  // A freshly-created (or backgrounded) context starts/goes 'suspended'
  // until a user gesture resumes it. Every call site here (preview button,
  // enabling reminders, or an alarm firing while the tab has focus) is
  // itself the result of a tap, so this resolves quietly.
  if (sharedContext.state === 'suspended') sharedContext.resume().catch(() => {})
  return sharedContext
}

function scheduleNotes(audioCtx, tone, startTime) {
  const nodes = []
  for (const [freq, delay, duration] of tone.notes) {
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t0 = startTime + delay
    // Quick exponential attack/decay so notes sound like a chime/bell
    // rather than a flat, buzzy tone.
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
    nodes.push(osc)
  }
  return nodes
}

/**
 * Plays a tone once by id — used for the Profile "preview" button. No-ops
 * silently if Web Audio is unavailable.
 */
export function playHydrationTone(toneId) {
  const audioCtx = getContext()
  if (!audioCtx) return
  const tone = HYDRATION_TONES.find((t) => t.id === toneId) || HYDRATION_TONES[0]
  scheduleNotes(audioCtx, tone, audioCtx.currentTime)
}

/**
 * Rings the selected tone on repeat — a real alarm, not a single chime —
 * for up to `totalSeconds` (default 2 minutes) or until stopAlarmLoop() is
 * called, whichever comes first.
 *
 * Every repeat is scheduled up front in one batch via the Web Audio
 * clock, rather than driven by a JS setInterval. That matters: browsers
 * throttle JS timers in backgrounded tabs, but audio nodes scheduled
 * ahead of time keep firing on the audio hardware's own clock regardless
 * — so the ring keeps going even if this tab isn't focused, as long as
 * it's still open.
 *
 * Returns a stop() function (same as calling stopAlarmLoop directly).
 */
export function playAlarmLoop(toneId, { totalSeconds = 120 } = {}) {
  const audioCtx = getContext()
  if (!audioCtx) return () => {}
  stopAlarmLoop()

  const tone = HYDRATION_TONES.find((t) => t.id === toneId) || HYDRATION_TONES[0]
  const cycle = tone.notes.reduce((max, [, delay, duration]) => Math.max(max, delay + duration), 0) + (tone.loopGap ?? 0.5)
  const repeats = Math.max(1, Math.ceil(totalSeconds / cycle))
  const now = audioCtx.currentTime

  for (let i = 0; i < repeats; i++) {
    scheduledOscillators.push(...scheduleNotes(audioCtx, tone, now + i * cycle))
  }

  return stopAlarmLoop
}

/** Silences a ring started with playAlarmLoop, including any repeats not yet played. */
export function stopAlarmLoop() {
  const audioCtx = sharedContext
  if (audioCtx) {
    const now = audioCtx.currentTime
    for (const osc of scheduledOscillators) {
      try { osc.stop(now) } catch { /* already stopped/finished — fine */ }
    }
  }
  scheduledOscillators = []
}
