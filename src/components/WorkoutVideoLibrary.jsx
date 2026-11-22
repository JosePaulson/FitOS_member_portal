import { useEffect, useMemo, useRef, useState } from 'react'
import { portalApi } from '../api/index'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'
import { computeBestPR, formatBestPR, beatsPR } from '../lib/exercisePR'
import { useMemberAuth } from '../context/MemberAuthContext'
import {
  loadVideoDraft, saveVideoDraft, clearVideoDraft, submitVideoDraft, newSessionId, VIDEO_DRAFT_CLEARED_EVENT,
} from '../lib/videoWorkoutDraft'
import WorkoutLogPrompt from './WorkoutLogPrompt'
import { restBeeper } from '../lib/restBeep'

const REST_DEFAULT_SECONDS = 45
const REST_MIN_SECONDS = 30
const REST_MAX_SECONDS = 180
const REST_DURATION_STORAGE_KEY = 'fitos_member_rest_duration'
const CONTROLS_HIDE_MS = 1000
// Idle fade: this long after the last play/pause/touch the exercise info
// (name, PR, notes) and the category chips dim so the video isn't covered.
const UI_FADE_MS = 3000
const INFO_FADED_OPACITY = 0.15
const CHIPS_FADED_OPACITY = 0.25

function clampRestDuration(value) {
  return Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, value))
}

// The member's last-chosen rest length, remembered as their default for
// next time — falls back to REST_DEFAULT_SECONDS if nothing's stored yet
// (or the stored value is somehow out of the allowed 30s–3min range).
function readStoredRestDuration() {
  try {
    const raw = Number(localStorage.getItem(REST_DURATION_STORAGE_KEY))
    if (Number.isFinite(raw) && raw > 0) return clampRestDuration(raw)
  } catch { /* ignore */ }
  return REST_DEFAULT_SECONDS
}

const S = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
  surface2: 'var(--color-surface-2)',
  surface3: 'var(--color-surface-3)',
}

// Completed exercises are keyed `${categoryKey}::${exerciseName}` so the same
// name in two categories can't collide now that one sitting spans several.
const doneKey = (key, name) => `${key}::${name}`

const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Full-screen, edge-to-edge exercise video player (Videos tab) — modeled
 * after the immersive single-exercise player pattern popularized by apps
 * like Cult: full-bleed video, minimal floating chrome over gradient
 * scrims, tap-to-reveal transport controls, and a compact sticky action
 * bar rather than a scrollable page of controls.
 */
export default function WorkoutVideoLibrary({ onClose }) {
  const { muscleGroups: MUSCLE_GROUPS, loading: catalogLoading } = useExerciseCatalog()
  const { member } = useMemberAuth()
  const memberId = member?.id ?? member?._id // login returns `id`, /me returns `_id`

  // Videos, keyed by category — sourced from the gym's Workout Library
  // (admin-managed), so this stays in sync with whatever categories and
  // exercises the admin has added. Only entries with an actual video are
  // shown here — an image-only library entry has nothing for the player.
  const [videosByCategory, setVideosByCategory] = useState({})
  const [videosLoading, setVideosLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    portalApi.workoutLibrary()
      .then(({ data }) => {
        if (cancelled) return
        const grouped = {}
        for (const item of data) {
          if (!item.videoUrl || !item.category) continue
          if (!grouped[item.category]) grouped[item.category] = []
          grouped[item.category].push(item)
        }
        setVideosByCategory(grouped)
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setVideosLoading(false) })
    return () => { cancelled = true }
  }, [])

  const [group, setGroup] = useState(null)
  const [index, setIndex] = useState(0)
  // Which variant of the current exercise is showing — most exercises
  // have exactly one video, but when a category has two+ entries sharing
  // the same exercise name (e.g. a front-view and a side-view demo),
  // they're treated as variants of one step in the sequence rather than
  // two separate steps, switchable via the "Swap" pill.
  const [variantIndex, setVariantIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [phase, setPhase] = useState('exercise') // exercise | resting
  const [restDuration, setRestDuration] = useState(() => readStoredRestDuration())
  const [restLeft, setRestLeft] = useState(restDuration)
  // Nothing is logged automatically. Every exercise the member LOGS (reps /
  // sets / weight saved — "Skip logging" exercises are never recorded) goes
  // into this sitting's session, which is mirrored to localStorage after each
  // one, so closing the app, a dead phone or a crash loses nothing and it all
  // works offline. It becomes a real workout log only when the member taps
  // "Log workout" — in the close prompt, or in the "Unfinished workout"
  // prompt on the next app open. The server then creates the day's log or
  // appends to the existing one.
  // session.current = { sessionId, startedAt, lastActivityAt,
  //                     entries: Map(`${categoryKey}::${exerciseName}` -> entry) }
  // An unfinished session saved on this device is picked up straight away
  // (e.g. after "Continue workout" on app open): its exercises show as ✓ Done
  // and are logged together with whatever is completed from here.
  const [initialSession] = useState(() => {
    const d = loadVideoDraft(memberId)
    if (!d) return null
    const entries = new Map()
    for (const e of d.exercises) {
      entries.set(doneKey(e.muscleGroup, e.name), { name: e.name, reps: e.reps, sets: e.sets, weight: e.weight, muscleGroup: e.muscleGroup })
    }
    return { sessionId: d.sessionId, startedAt: d.startedAt, lastActivityAt: d.lastActivityAt, entries }
  })
  const session = useRef(initialSession)
  const [completed, setCompleted] = useState(() => new Set(initialSession ? initialSession.entries.keys() : []))
  const [closePromptOpen, setClosePromptOpen] = useState(false)
  const [logSheetOpen, setLogSheetOpen] = useState(false)

  // The app-open prompt (Layout) logged or discarded this same session while
  // the player was already open — drop our copy so it can't be logged twice.
  useEffect(() => {
    const reset = () => { session.current = null; setCompleted(new Set()) }
    window.addEventListener(VIDEO_DRAFT_CLEARED_EVENT, reset)
    return () => window.removeEventListener(VIDEO_DRAFT_CLEARED_EVENT, reset)
  }, [])

  // Past logs + PT sessions, used for the PR shown under the video and in
  // the reps/sets/weight sheet. Fetched once; it never includes this
  // sitting's own log (that's created later), so "PR" always means "best
  // before today's lift".
  const [prHistory, setPrHistory] = useState([])
  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      portalApi.workoutLogs({ limit: 500 }),
      portalApi.ptSessions({ limit: 200 }),
    ]).then(([logsRes, sessRes]) => {
      if (cancelled) return
      const logs = logsRes.status === 'fulfilled' ? (logsRes.value.data.logs || []) : []
      const sessions = sessRes.status === 'fulfilled' ? (sessRes.value.data.sessions || []) : []
      setPrHistory([...logs, ...sessions])
    })
    return () => { cancelled = true }
  }, [])

  // Transport-control visibility — the play/pause button fades out ~1s
  // after it's tapped (while playing), and any tap on the player brings
  // it back. Paused always stays visible so there's always a way back in.
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef(null)

  // Idle fade of the exercise info + category chips. Any activity — play,
  // pause, touch, touch-move, mouse, scroll, key — shows them in full and
  // restarts a 3 s timer, after which they dim again. A tap that merely
  // REVEALS dimmed UI must not also trigger what's under the finger (switch
  // category, swap video): pointer-down notes whether it was dimmed first.
  const [uiFaded, setUiFaded] = useState(false)
  const uiFadedRef = useRef(false)
  const uiTimerRef = useRef(null)
  const lastPokeRef = useRef(0)
  const tapRevealedRef = useRef(false)
  const restEndsAtRef = useRef(0) // wall-clock end of the current rest — immune to background timer throttling

  // Buffering state for the current clip, and a live countdown of seconds
  // remaining in the (looping) clip — driven by the <video> element's own
  // duration/currentTime so it stays accurate even if the library's saved
  // videoDurationSec is a little off.
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoDuration, setVideoDuration] = useState(null)
  const [remainingSec, setRemainingSec] = useState(null)

  const videoRef = useRef(null)
  const timerRef = useRef(null)

  // Default to the first category that actually has videos once both the
  // catalog and the library have loaded.
  useEffect(() => {
    if (group || catalogLoading || videosLoading) return
    // Resuming? Land on the category the member was last working on.
    const lastKey = [...(session.current?.entries.values() || [])].map((e) => e.muscleGroup).filter(Boolean).at(-1)
    const resumeKey = lastKey && (videosByCategory[lastKey] || []).length > 0 ? lastKey : null
    const firstWithVideos = MUSCLE_GROUPS.find((g) => (videosByCategory[g.key] || []).length > 0)
    setGroup(resumeKey || (firstWithVideos || MUSCLE_GROUPS[0])?.key || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoading, videosLoading])

  const videos = (group && videosByCategory[group]) || []
  // Group same-category videos by exercise name, preserving the admin-set
  // order — each entry is one step in the sequence, potentially with
  // multiple video variants to swap between.
  const exerciseGroups = useMemo(() => {
    const map = new Map()
    for (const item of videos) {
      if (!map.has(item.name)) map.set(item.name, { name: item.name, variants: [] })
      map.get(item.name).variants.push(item)
    }
    return [...map.values()]
  }, [videos])
  const currentGroup = exerciseGroups[index]
  const current = currentGroup?.variants[variantIndex]
  const isLast = index >= exerciseGroups.length - 1
  const currentPR = useMemo(
    () => computeBestPR(prHistory, currentGroup?.name),
    [prHistory, currentGroup?.name]
  )

  // Reset to the first exercise (and first variant) whenever the muscle
  // group changes.
  useEffect(() => {
    setIndex(0)
    setVariantIndex(0)
    setPhase('exercise')
    setPlaying(false)
    setShowControls(true)
    setLogSheetOpen(false)
    cancelRest()
    clearHideTimer()
  }, [group])

  function swapVariant() {
    if (!currentGroup || currentGroup.variants.length < 2) return
    setVariantIndex((v) => (v + 1) % currentGroup.variants.length)
  }

  // A new clip is about to load — show the buffering spinner and reset
  // the countdown until the new video's metadata comes in.
  useEffect(() => {
    setVideoLoading(true)
    setVideoDuration(current?.videoDurationSec ?? null)
    setRemainingSec(current?.videoDurationSec ? Math.ceil(current.videoDurationSec) : null)
  }, [index, group, current?._id])

  // Keep the <video> element in sync with exercise/variant changes.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    if (playing) el.play().catch(() => { })
    else el.pause()
  }, [current?._id])

  // Keep the <video> element in sync with play/pause toggles.
  useEffect(() => {
    const el = videoRef.current

    if (!el) return
    if (playing) el.play().catch(() => { })
    else el.pause()
  }, [playing])

  useEffect(() => clearHideTimer, [])

  // Playing/pausing, a new exercise, a category change or entering/leaving
  // rest all count as activity: show the info, then dim it 3 s later.
  useEffect(() => { pokeUI(true) }, [playing, current?._id, group, phase])
  useEffect(() => () => clearTimeout(uiTimerRef.current), [])

  // Leaving the player silences any rest beeps still queued.
  useEffect(() => () => restBeeper.stop(), [])

  function clearRestTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function armHideTimer() {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => setShowControls(false), CONTROLS_HIDE_MS)
  }

  // Show the exercise info / chips in full and start the 3 s countdown to dim them.
  function pokeUI(force = false) {
    const now = Date.now()
    if (!force && !uiFadedRef.current && now - lastPokeRef.current < 120) return // throttle touchmove/mousemove floods
    lastPokeRef.current = now
    uiFadedRef.current = false
    setUiFaded(false)
    clearTimeout(uiTimerRef.current)
    uiTimerRef.current = setTimeout(() => { uiFadedRef.current = true; setUiFaded(true) }, UI_FADE_MS)
  }

  // Pointer-down anywhere in the player: remember if this tap is only
  // revealing dimmed UI, unlock rest-beep audio (needs a user gesture), and
  // restart the fade timer.
  function handleActivityStart() {
    tapRevealedRef.current = uiFadedRef.current
    restBeeper.unlock()
    pokeUI(true)
  }

  // True (once) when the tap that triggered this click only revealed dimmed UI.
  function consumeRevealTap() {
    if (!tapRevealedRef.current) return false
    tapRevealedRef.current = false
    return true
  }

  // Rest cut short or abandoned (skip, prev/next, jump, category change) —
  // stop the countdown AND the beeps. (A rest that runs out on its own only
  // clears the timer, so the final long beep can finish.)
  function cancelRest() {
    clearRestTimer()
    restBeeper.stop()
  }

  // Tapping anywhere on the player always toggles play/pause AND brings
  // the button back into view (briefly, if now playing) — so the tap
  // always visibly does something, even right after the button had
  // faded out.
  function handlePlayerTap() {
    if (phase !== 'exercise') return
    setShowControls(true)
    setPlaying((p) => {
      const next = !p
      if (next) armHideTimer()
      else clearHideTimer()
      return next
    })
  }

  // Rest countdown. Driven by an END TIMESTAMP rather than by counting
  // ticks, so it stays right when the browser throttles timers in a background
  // tab — and it re-syncs the instant the app comes back to the foreground.
  // The beeps for the last 4 s are baked into an audio clip (see lib/restBeep)
  // that plays on the OS media pipeline, so they sound on time even with the
  // app in the background, the screen locked, or another app open.
  useEffect(() => {
    if (phase !== 'resting') return
    restEndsAtRef.current = Date.now() + restDuration * 1000
    setRestLeft(restDuration)
    restBeeper.start(restDuration, !isLast ? exerciseGroups[index + 1]?.name : null)

    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000))
      setRestLeft(left)
      if (left <= 0) {
        clearRestTimer()
        advanceAfterRest()
      }
    }
    timerRef.current = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearRestTimer()
      document.removeEventListener('visibilitychange', tick)
    }
    // Only re-run when entering/leaving the resting phase — mid-rest
    // duration tweaks (adjustRest) move the end timestamp directly instead
    // of restarting this effect, so they don't reset the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // +/- 15s / 30s rest adjustment — clamped to 30s–3min, and remembered
  // as the member's default rest length for next time. Also nudges the
  // currently-running countdown by the same amount so an adjustment made
  // mid-rest takes effect immediately rather than waiting for the next
  // exercise.
  function adjustRest(deltaSeconds) {
    setRestDuration((d) => {
      const next = clampRestDuration(d + deltaSeconds)
      try { localStorage.setItem(REST_DURATION_STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
    if (phase === 'resting') {
      const left = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000))
      const nextLeft = Math.max(0, Math.min(REST_MAX_SECONDS, left + deltaSeconds))
      restEndsAtRef.current = Date.now() + nextLeft * 1000
      setRestLeft(nextLeft)
      // The beeps sit at fixed offsets from the end, so re-time the clip.
      if (nextLeft > 0) restBeeper.start(nextLeft, !isLast ? exerciseGroups[index + 1]?.name : null)
      else restBeeper.stop()
    }
  }

  function advanceAfterRest() {
    if (isLast) {
      // Last exercise of the category — no pop-up; stay on it. The member picks
      // another category from the chips up top, or closes the player to log.
      setPhase('exercise')
      setPlaying(false)
      setShowControls(true)
    } else {
      setIndex((i) => i + 1)
      setVariantIndex(0)
      setPhase('exercise')
      setPlaying(true) // auto-play the next available video
    }
  }

  // "Mark complete" asks for reps / sets / weight first; the rest timer
  // starts once the sheet is saved or skipped.
  function markComplete() {
    if (!currentGroup) return
    setPlaying(false)
    setLogSheetOpen(true)
  }

  function finishComplete() {
    if (!currentGroup) return
    setLogSheetOpen(false)
    setCompleted((prev) => new Set(prev).add(doneKey(group, currentGroup.name)))
    setPlaying(false)
    setPhase('resting')
  }

  const labelFor = (key) => MUSCLE_GROUPS.find((g) => g.key === key)?.label || key

  function getSession() {
    return (session.current ||= { sessionId: newSessionId(), startedAt: Date.now(), lastActivityAt: Date.now(), entries: new Map() })
  }

  // What gets stored locally / sent to the server.
  function draftSnapshot() {
    const sess = session.current
    const exercises = [...sess.entries.values()]
    const labels = {}
    for (const e of exercises) if (e.muscleGroup) labels[e.muscleGroup] = labelFor(e.muscleGroup)
    return { sessionId: sess.sessionId, startedAt: sess.startedAt, lastActivityAt: sess.lastActivityAt, exercises, labels }
  }

  // Reps / sets / weight entered for the current exercise.
  function saveExerciseLog({ reps, sets, weight }) {
    const sess = getSession()
    sess.entries.set(doneKey(group, currentGroup.name), { name: currentGroup.name, reps, sets, weight, muscleGroup: group })
    sess.lastActivityAt = Date.now()
    saveVideoDraft(memberId, draftSnapshot())
    finishComplete()
  }

  // How many exercises have logged data — skipped ones aren't counted.
  const loggedCount = () => session.current?.entries.size || 0

  // ✕ — nothing logged (nothing done, or everything skipped) just closes;
  // otherwise ask: log the workout, or keep going?
  function requestClose() {
    if (loggedCount() === 0) { onClose(); return }
    setPlaying(false)
    setClosePromptOpen(true)
  }

  // "Log workout": send the session to the server, which creates today's log
  // or appends to the day's existing one. If it throws (offline, server error)
  // the prompt shows it and the session stays safely on this device.
  async function logWorkout(bodyWeight) {
    await submitVideoDraft(memberId, draftSnapshot(), bodyWeight, { notify: false })
    session.current = null // logged — never offer these exercises again
    setCompleted(new Set())
  }

  function discardWorkout() {
    clearVideoDraft(memberId, { notify: false })
    session.current = null
    onClose()
  }

  const loggedCategoryNames = () => {
    const keys = []
    for (const e of session.current?.entries.values() || []) if (e.muscleGroup && !keys.includes(e.muscleGroup)) keys.push(e.muscleGroup)
    return keys.map(labelFor)
  }

  function skipRest() {
    cancelRest()
    advanceAfterRest()
  }

  function goPrev() {
    if (index === 0) return
    cancelRest()
    setPhase('exercise')
    setPlaying(false)
    setVariantIndex(0)
    setIndex((i) => i - 1)
  }

  function goNext() {
    if (isLast) return
    cancelRest()
    setPhase('exercise')
    setPlaying(false)
    setVariantIndex(0)
    setIndex((i) => i + 1)
  }

  // Top-bar category chips: jump straight to another category mid-workout.
  // Everything completed so far stays in the same session.
  function pickGroup(key) {
    if (key === group) return
    setGroup(key)
  }

  const groupCompletedCount = useMemo(
    () => exerciseGroups.filter((g) => completed.has(doneKey(group, g.name))).length,
    [exerciseGroups, completed, group]
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      onPointerDownCapture={handleActivityStart}
      onPointerMove={() => pokeUI()}
      onTouchStart={() => pokeUI()}
      onTouchMove={() => pokeUI()}
      onMouseMove={() => pokeUI()}
      onWheel={() => pokeUI()}
      onKeyDown={() => { tapRevealedRef.current = false; pokeUI(true) }}
    >
      {logSheetOpen && currentGroup && (
        <ExerciseLogSheet
          exerciseName={currentGroup.name}
          pr={currentPR}
          initial={session.current?.entries.get(doneKey(group, currentGroup.name))}
          onSave={saveExerciseLog}
          onSkip={finishComplete}
          onClose={() => setLogSheetOpen(false)}
        />
      )}

      {closePromptOpen && (
        <WorkoutLogPrompt
          mode="close"
          exerciseCount={loggedCount()}
          categories={loggedCategoryNames()}
          onLog={logWorkout}
          onContinue={() => setClosePromptOpen(false)}
          onDiscard={discardWorkout}
          onLogged={onClose}
        />
      )}

      {/* Top bar — close + category chips, floats over the video with a
          gradient scrim so it stays legible over any footage. */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex flex-col gap-2.5 px-4 pb-6"
        style={{ paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))' }}
      >
        {/* Legibility scrim — eases off together with the chips when idle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: -1,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
            opacity: uiFaded ? CHIPS_FADED_OPACITY : 1,
            transition: 'opacity 0.6s ease',
          }}
        />
        <div className="flex items-center justify-between">
          <button
            onClick={requestClose}
            aria-label="Close"
            className="flex items-center justify-center transition-all rounded-full w-9 h-9 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            <CloseIcon />
          </button>
          {current && (
            <span className="text-xs font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {index + 1} / {exerciseGroups.length}
            </span>
          )}
        </div>
        <div
          className="flex gap-2 px-1 -mx-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none', opacity: uiFaded ? CHIPS_FADED_OPACITY : 1, transition: 'opacity 0.6s ease' }}
          onScroll={() => pokeUI()}
        >
          {MUSCLE_GROUPS.map((g) => {
            const active = g.key === group
            return (
              <button
                key={g.key}
                onClick={() => { if (consumeRevealTap()) return; pickGroup(g.key) }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all shrink-0"
                style={active
                  ? { background: S.accent, color: '#0D0D0D' }
                  : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Full-bleed video area */}
      <div className="relative flex-1 min-h-0 bg-black">
        {catalogLoading || videosLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <span className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
          </div>
        ) : !current ? (
          <div className="flex items-center justify-center w-full h-full px-8 text-sm text-center" style={{ color: S.secondary }}>
            No videos in this category yet.
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={current.videoUrl}
              loop
              muted
              playsInline
              className="absolute inset-0 object-contain w-full h-full"
              style={{ opacity: phase === 'resting' ? 0.25 : 1, transition: 'opacity 0.3s' }}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration
                if (Number.isFinite(d)) {
                  setVideoDuration(d)
                  setRemainingSec(Math.ceil(d))
                }
              }}
              onCanPlay={() => setVideoLoading(false)}
              onTimeUpdate={(e) => {
                if (!videoDuration) return
                setRemainingSec(Math.max(0, Math.ceil(videoDuration - e.currentTarget.currentTime)))
              }}
              onWaiting={() => setVideoLoading(true)}
              onPlaying={() => setVideoLoading(false)}
            />

            {/* Buffering spinner — same style used for the catalog/library
                loading state above. */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
              </div>
            )}

            {/* Full-cover tap target — always present so a tap anywhere on
                the player reveals the transport control; the icon itself
                fades independently via the inner span below. */}
            {phase === 'exercise' && (
              <button
                onClick={handlePlayerTap}
                className="absolute inset-0"
                aria-label={playing ? 'Pause' : 'Play (loops automatically)'}
              >
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ opacity: showControls ? 1 : 0, transition: 'opacity 0.25s' }}
                >
                  <span
                    className="flex items-center justify-center transition-transform rounded-full w-14 h-14 active:scale-90"
                    style={{
                      background: playing ? 'rgba(0,0,0,0.4)' : S.accent,
                      color: playing ? '#fff' : '#0D0D0D',
                      boxShadow: playing ? 'none' : '0 8px 24px rgba(200,241,53,0.35)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </span>
                </span>
              </button>
            )}

            {/* Bottom info scrim — exercise name + optional clip length/cue,
                floating over the video like the player chip in Cult's
                exercise screen. */}
            {phase === 'exercise' && (
              <div
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-5 pt-10 pb-4 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  opacity: uiFaded ? INFO_FADED_OPACITY : 1,
                  transition: 'opacity 0.6s ease',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-lg font-bold leading-snug" style={{ color: '#fff' }}>{current.name}</h2>
                    {remainingSec != null && videoDuration != null && (
                      <DurationRing remaining={remainingSec} total={videoDuration} />
                    )}
                    {currentGroup?.variants.length > 1 && (
                      <button
                        onClick={() => { if (consumeRevealTap()) return; swapVariant() }}
                        className="pointer-events-auto text-[11px] font-bold px-2.5 py-1 rounded-full transition-all active:scale-95"
                        style={{ background: 'rgba(168,85,247,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}
                        aria-label="Switch to the other video for this exercise"
                      >
                        ⇄ Swap
                      </button>
                    )}
                  </div>
                  {completed.has(doneKey(group, currentGroup?.name)) && (
                    <span
                      className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(200,241,53,0.18)', color: S.accent, border: '1px solid rgba(200,241,53,0.3)' }}
                    >
                      ✓ Done
                    </span>
                  )}
                </div>
                {currentPR && (
                  <span
                    className="self-start flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(168,85,247,0.25)', color: '#fff', border: '1px solid rgba(168,85,247,0.45)', backdropFilter: 'blur(4px)' }}
                  >
                    🏆 PR {formatBestPR(currentPR)}
                  </span>
                )}
                {current.description && (
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{current.description}</p>
                )}
              </div>
            )}

            {/* Resting overlay */}
            {phase === 'resting' && (
              <RestOverlay
                restLeft={restLeft}
                restDuration={restDuration}
                onSkip={skipRest}
                onAdjust={adjustRest}
                minSeconds={REST_MIN_SECONDS}
                maxSeconds={REST_MAX_SECONDS}
                nextName={!isLast ? exerciseGroups[index + 1]?.name : null}
              />
            )}

          </>
        )}
      </div>

      {/* Sticky bottom action bar — compact, icon-led prev/next flanking
          the primary action, kept small and out of the way of the video. */}
      {current && phase === 'exercise' && (
        <div
          className="z-20 flex flex-col gap-2.5 px-4 pt-2.5 shrink-0"
          style={{
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            background: S.surface2,
            borderTop: `1px solid ${S.border}`,
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            {exerciseGroups.map((g, i) => (
              <button
                key={g.name}
                onClick={() => { cancelRest(); setPhase('exercise'); setPlaying(false); setShowControls(true); setVariantIndex(0); setIndex(i) }}
                className="transition-all rounded-full"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  background: completed.has(doneKey(group, g.name)) ? S.accent : i === index ? S.primary : S.border,
                }}
                aria-label={`Go to exercise ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={index === 0}
              aria-label="Previous exercise"
              className="flex items-center justify-center w-10 h-10 text-base font-bold transition-all rounded-full shrink-0 disabled:opacity-30"
              style={{ background: S.surface3, border: `1px solid ${S.border}`, color: S.primary }}
            >
              ‹
            </button>
            <button
              onClick={markComplete}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
              style={{ background: S.accent, color: '#0D0D0D', boxShadow: '0 6px 16px rgba(200,241,53,0.25)' }}
            >
              {completed.has(doneKey(group, currentGroup?.name)) ? '✓ Completed — rest again' : `Mark complete · rest ${restDuration}s`}
            </button>
            <button
              onClick={goNext}
              disabled={isLast}
              aria-label="Next exercise"
              className="flex items-center justify-center w-10 h-10 text-base font-bold transition-all rounded-full shrink-0 disabled:opacity-30"
              style={{ background: S.surface3, border: `1px solid ${S.border}`, color: S.primary }}
            >
              ›
            </button>
          </div>

          <p className="text-[11px] text-center" style={{ color: S.secondary }}>
            {groupCompletedCount} of {exerciseGroups.length} {MUSCLE_GROUPS.find((g) => g.key === group)?.label.toLowerCase()} exercises done
            {groupCompletedCount === exerciseGroups.length ? ' · pick another category above, or close to finish' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Rest overlay with circular countdown ─────────────────────────────────── */
function RestOverlay({ restLeft, restDuration, onSkip, onAdjust, minSeconds, maxSeconds, nextName }) {
  const progress = restDuration > 0 ? restLeft / restDuration : 0
  const offset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6" style={{ background: 'rgba(13,13,13,0.55)', backdropFilter: 'blur(2px)' }}>
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={RING_RADIUS} fill="none" stroke={S.accent} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="text-3xl font-black" style={{ color: '#fff' }}>{restLeft}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold" style={{ color: '#fff' }}>Rest up 💧</p>
        {nextName && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Next: {nextName}</p>}
      </div>

      {/* Rest-length adjustment — 15s/30s steps, clamped 30s–3min, saved
          as this member's default for next time. */}
      <div className="flex items-center gap-1.5">
        <RestAdjustButton label="−30s" onClick={() => onAdjust(-30)} disabled={restDuration <= minSeconds} />
        <RestAdjustButton label="−15s" onClick={() => onAdjust(-15)} disabled={restDuration <= minSeconds} />
        <RestAdjustButton label="+15s" onClick={() => onAdjust(15)} disabled={restDuration >= maxSeconds} />
        <RestAdjustButton label="+30s" onClick={() => onAdjust(30)} disabled={restDuration >= maxSeconds} />
      </div>

      <button
        onClick={onSkip}
        className="px-5 py-2 text-xs font-semibold rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        Skip rest →
      </button>
    </div>
  )
}

function RestAdjustButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1.5 text-[11px] font-bold rounded-full transition-all active:scale-90 disabled:opacity-30"
      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
    >
      {label}
    </button>
  )
}

/* ── Reps / sets / weight bottom sheet ────────────────────────────────────── */
const REP_PILLS = [8, 10, 12, 15]
const SET_PILLS = [1, 2, 3]
const WEIGHT_PILLS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5]

function ExerciseLogSheet({ exerciseName, pr, initial, onSave, onSkip, onClose }) {
  const [reps, setReps] = useState(initial?.reps ?? '')
  const [sets, setSets] = useState(initial?.sets !== undefined ? String(initial.sets) : '')
  const [weight, setWeight] = useState(initial?.weight !== undefined ? String(initial.weight) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasAny = reps !== '' || sets !== '' || weight !== ''
  const newPR = beatsPR(pr, { weight, reps })

  async function submit() {
    if (!hasAny) return
    setSaving(true); setError('')
    try {
      await onSave({
        reps: reps !== '' ? String(reps) : undefined,
        sets: sets !== '' ? Number(sets) : undefined,
        weight: weight !== '' ? Number(weight) : undefined,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again, or skip logging.')
      setSaving(false)
    }
  }

  const fieldStyle = { background: S.surface2, border: `1px solid ${S.border}`, color: S.primary }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center px-0 sm:items-center sm:px-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="relative w-full p-5 overflow-y-auto sm:max-w-sm rounded-t-2xl sm:rounded-2xl animate-fade-up max-h-[92vh]"
        style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute text-2xl leading-none top-4 right-5" style={{ color: S.secondary }}>×</button>

        <h2 className="pr-8 text-lg font-bold" style={{ color: S.primary }}>{exerciseName}</h2>
        <p className="mt-0.5 mb-3 text-xs" style={{ color: S.secondary }}>Saved to your current workout — logged when you tap “Log workout”</p>

        {/* Personal record from past workout logs + PT sessions — heaviest
            weight (with its reps), or best reps when no weight was ever logged. */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 mb-4 rounded-lg"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}
        >
          <span className="text-xs font-bold" style={{ color: '#a855f7' }}>
            {pr ? `🏆 PR ${formatBestPR(pr)}` : '🏆 No PR yet — this sets your first'}
          </span>
          {newPR && (
            <span className="text-[11px] font-black" style={{ color: S.accent }}>🔥 New PR!</span>
          )}
        </div>

        {error && (
          <p className="px-3 py-2 mb-4 text-sm rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
            {error}
          </p>
        )}

        <PillField label="Reps" value={reps} onChange={setReps} pills={REP_PILLS}
          inputProps={{ type: 'number', inputMode: 'numeric', min: 1, max: 100, step: 1, placeholder: 'e.g. 10' }} fieldStyle={fieldStyle} />
        <PillField label="Sets" value={sets} onChange={setSets} pills={SET_PILLS}
          inputProps={{ type: 'number', inputMode: 'numeric', min: 1, max: 20, step: 1, placeholder: 'e.g. 3' }} fieldStyle={fieldStyle} />
        <PillField label="Weight (kg)" value={weight} onChange={setWeight} pills={WEIGHT_PILLS}
          inputProps={{ type: 'number', inputMode: 'decimal', min: 0, max: 500, step: 0.5, placeholder: 'e.g. 2.5' }} fieldStyle={fieldStyle} />

        <button onClick={submit} disabled={saving || !hasAny}
          className="w-full py-2.5 mt-1 text-sm font-bold transition-all rounded-lg disabled:opacity-50"
          style={{ background: S.accent, color: '#0D0D0D' }}>
          {saving ? 'Saving…' : 'Save & rest'}
        </button>
        <button onClick={onSkip} disabled={saving}
          className="w-full py-2 mt-1.5 text-xs font-semibold disabled:opacity-50"
          style={{ color: S.secondary }}>
          Skip logging
        </button>
      </div>
    </div>
  )
}

// One labelled number input with quick-pick value pills beneath it — tapping a
// pill fills the input above (and the matching pill highlights).
function PillField({ label, value, onChange, pills, inputProps, fieldStyle }) {
  return (
    <div className="mb-4">
      <label className="block mb-1.5 text-xs font-semibold" style={{ color: S.secondary }}>{label}</label>
      <input {...inputProps} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={fieldStyle} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {pills.map((p) => {
          const active = value !== '' && Number(value) === p
          return (
            <button key={p} type="button" onClick={() => onChange(String(p))}
              className="px-3 py-1 text-xs font-semibold transition-all rounded-full"
              style={{
                background: active ? 'rgba(200,241,53,0.12)' : S.surface2,
                border: active ? `1px solid ${S.accent}` : `1px solid ${S.border}`,
                color: active ? S.accent : S.secondary,
              }}>
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Small badge next to the exercise name: a semi-transparent circle with a
// thin purple ring that depletes from full to empty in step with the
// live countdown (remaining/total), plus the seconds-left number inside.
const DURATION_RING_RADIUS = 15
const DURATION_RING_CIRCUMFERENCE = 2 * Math.PI * DURATION_RING_RADIUS
const DURATION_RING_TRACK_COLOR = 'rgba(168,85,247,0.25)'
const DURATION_RING_COLOR = 'rgba(168,85,247,0.85)'

function DurationRing({ remaining, total }) {
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const offset = DURATION_RING_CIRCUMFERENCE * (1 - progress)

  return (
    <span className="relative flex items-center justify-center shrink-0" style={{ width: 34, height: 34 }}>
      <svg viewBox="0 0 36 36" width="34" height="34" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="17" fill="rgba(0,0,0,0.3)" />
        <circle cx="18" cy="18" r={DURATION_RING_RADIUS} fill="none" stroke={DURATION_RING_TRACK_COLOR} strokeWidth="1.5" />
        <circle
          cx="18" cy="18" r={DURATION_RING_RADIUS} fill="none" stroke={DURATION_RING_COLOR} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={DURATION_RING_CIRCUMFERENCE} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="text-[10px] font-bold" style={{ color: '#fff' }}>{remaining}</span>
    </span>
  )
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
  )
}
function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
