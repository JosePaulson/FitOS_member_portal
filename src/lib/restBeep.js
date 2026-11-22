// Rest-timer beeps that keep sounding when the app is in the background, the
// screen is locked or the member is in another app.
//
// Why not setTimeout / Web Audio? Browsers throttle or freeze JS timers in
// background tabs, so a timer-fired beep arrives late or never. Instead the
// beeps are BAKED INTO an audio clip — silence for the rest, then loud beeps in
// the last 4 seconds — and played through a normal <audio> element. Playback
// then runs on the OS media pipeline, on schedule, whatever the page is doing,
// and `mediaSession` metadata marks it as active media so mobile browsers keep
// it alive. (Same trick workout/timer web apps use.)
//
// Honest limits — this is the best a web app can do: playing needs one user
// tap inside the player first (autoplay policy; `unlock()` handles it), the
// volume is the phone's media volume, and an OS that force-kills the browser
// (or a phone call taking audio focus) stops it. A native app is the only way
// to guarantee an alarm.

const RATE = 8000        // 8 kHz is plenty for a beep and keeps the clip tiny
const TAIL_SECONDS = 0.25 // a little silence after the end so the last beep isn't clipped

// Beeps in the final seconds of the rest: 3 short, then one long, higher "go".
// `before` = seconds before the rest ends the beep starts.
const BEEPS = [
  { before: 4, dur: 0.22, freq: 1800 },
  { before: 3, dur: 0.22, freq: 1800 },
  { before: 2, dur: 0.22, freq: 1800 },
  { before: 1, dur: 0.95, freq: 2400 },
]

/** Wraps 8-bit unsigned mono PCM in a WAV container. */
function wavBlob(samples) {
  const buf = new ArrayBuffer(44 + samples.length)
  const v = new DataView(buf)
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true); v.setUint32(24, RATE, true); v.setUint32(28, RATE, true) // mono, rate, byteRate
  v.setUint16(32, 1, true); v.setUint16(34, 8, true)                    // blockAlign, 8-bit
  str(36, 'data'); v.setUint32(40, samples.length, true)
  new Uint8Array(buf, 44).set(samples)
  return new Blob([buf], { type: 'audio/wav' })
}

/**
 * Builds the rest clip: `seconds` of silence with the beeps in the last 4 s
 * (beeps that would start before 0 — a very short rest — are dropped).
 * Square wave at full scale = as loud as the device's media volume allows.
 */
export function buildRestSamples(seconds) {
  const total = Math.round((Math.max(0, seconds) + TAIL_SECONDS) * RATE)
  const samples = new Uint8Array(total).fill(128) // 128 = silence for unsigned 8-bit
  for (const b of BEEPS) {
    const startSec = seconds - b.before
    if (startSec < 0) continue
    const from = Math.round(startSec * RATE)
    const to = Math.min(total, from + Math.round(b.dur * RATE))
    for (let i = from; i < to; i++) {
      samples[i] = ((i - from) * b.freq / RATE) % 1 < 0.5 ? 255 : 0
    }
  }
  return samples
}

let audioEl = null
let currentUrl = null
let unlocked = false

const getEl = () => (audioEl ||= new Audio())

function revokeCurrent() {
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null }
}

function setMediaSession(nextName) {
  try {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Rest',
      artist: nextName ? `Next: ${nextName}` : 'FitOS workout',
      album: 'FitOS',
    })
    navigator.mediaSession.playbackState = 'playing'
  } catch { /* media session is optional */ }
}

function clearMediaSession() {
  try {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = 'none'
    navigator.mediaSession.metadata = null
  } catch { /* ignore */ }
}

export const restBeeper = {
  /**
   * Call from a user gesture (any touch in the player). Browsers only let an
   * <audio> element play later — e.g. when a rest starts or while the app is
   * in the background — once that same element has played from a tap.
   */
  unlock() {
    if (unlocked || typeof Audio === 'undefined') return
    unlocked = true
    try {
      const el = getEl()
      const url = URL.createObjectURL(wavBlob(new Uint8Array(Math.round(RATE * 0.1)).fill(128)))
      el.src = url
      const p = el.play()
      const done = () => { try { el.pause() } catch { /* ignore */ } URL.revokeObjectURL(url) }
      if (p?.then) p.then(done, () => { unlocked = false; URL.revokeObjectURL(url) })
      else done()
    } catch { unlocked = false }
  },

  /** Starts a rest of `secondsLeft`: silence, then beeps in its last 4 s. Safe to call again to re-time it. */
  start(secondsLeft, nextName) {
    if (typeof Audio === 'undefined' || !(secondsLeft > 0)) return
    try {
      const el = getEl()
      revokeCurrent()
      currentUrl = URL.createObjectURL(wavBlob(buildRestSamples(secondsLeft)))
      el.loop = false
      el.muted = false
      el.volume = 1
      el.src = currentUrl
      const p = el.play()
      if (p?.catch) p.catch(() => { /* blocked until the member taps in the player — no beeps, nothing else breaks */ })
      setMediaSession(nextName)
    } catch { /* never let audio break the workout */ }
  },

  /** Rest skipped / left / player closed — silence it right away. */
  stop() {
    try {
      if (audioEl) { audioEl.pause(); audioEl.currentTime = 0 }
    } catch { /* ignore */ }
    revokeCurrent()
    clearMediaSession()
  },
}
