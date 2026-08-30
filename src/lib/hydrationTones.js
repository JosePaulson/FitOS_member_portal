/**
 * Selectable tones for the hydration reminder — synthesized on the fly
 * with the Web Audio API instead of shipping audio files, so there's
 * nothing to host or license and every tone is a few bytes of code.
 *
 * Each tone is a list of notes: [frequencyHz, startDelaySec, durationSec].
 */
export const HYDRATION_TONES = [
  { id: 'chime',   label: 'Chime',       notes: [[880,    0,    0.14], [1318.5, 0.12, 0.22]] },
  { id: 'bell',    label: 'Soft Bell',   notes: [[1046.5, 0,    0.4]] },
  { id: 'marimba', label: 'Marimba',     notes: [[523.25, 0,    0.1],  [659.25, 0.09, 0.1], [783.99, 0.18, 0.2]] },
  { id: 'droplet', label: 'Droplet',     notes: [[1400,   0,    0.06], [850,    0.05, 0.16]] },
  { id: 'beep',    label: 'Digital Beep', notes: [[1500,  0,    0.09], [1500,   0.16, 0.09]] },
]

let sharedContext = null

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

/**
 * Plays a tone by id. No-ops silently if Web Audio is unavailable or the
 * tab is backgrounded strictly enough to block audio (e.g. some mobile
 * browsers) — the OS-level notification still fires either way.
 */
export function playHydrationTone(toneId) {
  const audioCtx = getContext()
  if (!audioCtx) return
  const tone = HYDRATION_TONES.find((t) => t.id === toneId) || HYDRATION_TONES[0]

  const now = audioCtx.currentTime
  for (const [freq, delay, duration] of tone.notes) {
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    // Quick exponential attack/decay so notes sound like a chime/bell
    // rather than a flat, buzzy tone.
    gain.gain.setValueAtTime(0.0001, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.35, now + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(now + delay)
    osc.stop(now + delay + duration + 0.02)
  }
}
