import { useEffect, useMemo, useRef, useState } from 'react'
import { portalApi } from '../api/index'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'

const REST_DEFAULT_SECONDS = 45
const REST_MIN_SECONDS = 30
const REST_MAX_SECONDS = 180
const REST_DURATION_STORAGE_KEY = 'fitos_member_rest_duration'
const CONTROLS_HIDE_MS = 1000

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
      .catch(() => {})
      .finally(() => { if (!cancelled) setVideosLoading(false) })
    return () => { cancelled = true }
  }, [])

  const [group, setGroup] = useState(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [phase, setPhase] = useState('exercise') // exercise | resting | group-complete
  const [restDuration, setRestDuration] = useState(() => readStoredRestDuration())
  const [restLeft, setRestLeft] = useState(restDuration)
  const [completed, setCompleted] = useState(() => new Set())

  // Transport-control visibility — the play/pause button fades out ~1s
  // after it's tapped (while playing), and any tap on the player brings
  // it back. Paused always stays visible so there's always a way back in.
  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef(null)

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
    const firstWithVideos = MUSCLE_GROUPS.find((g) => (videosByCategory[g.key] || []).length > 0)
    setGroup((firstWithVideos || MUSCLE_GROUPS[0])?.key || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoading, videosLoading])

  const videos = (group && videosByCategory[group]) || []
  const current = videos[index]
  const isLast = index >= videos.length - 1

  // Reset to the first exercise whenever the muscle group changes.
  useEffect(() => {
    setIndex(0)
    setPhase('exercise')
    setPlaying(false)
    setShowControls(true)
    clearRestTimer()
    clearHideTimer()
  }, [group])

  // A new clip is about to load — show the buffering spinner and reset
  // the countdown until the new video's metadata comes in.
  useEffect(() => {
    setVideoLoading(true)
    setVideoDuration(current?.videoDurationSec ?? null)
    setRemainingSec(current?.videoDurationSec ? Math.ceil(current.videoDurationSec) : null)
  }, [index, group, current?._id])

  // Keep the <video> element in sync with exercise changes.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [index, group])

  // Keep the <video> element in sync with play/pause toggles.
  useEffect(() => {
    const el = videoRef.current

    if (!el) return
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [playing])

  useEffect(() => clearHideTimer, [])

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

  // Rest countdown — ticks every second, auto-advances when it hits zero.
  useEffect(() => {
    if (phase !== 'resting') return
    setRestLeft(restDuration)
    timerRef.current = setInterval(() => {
      setRestLeft((t) => {
        if (t <= 1) {
          clearRestTimer()
          advanceAfterRest()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return clearRestTimer
    // Only re-run when entering/leaving the resting phase — mid-rest
    // duration tweaks (adjustRest) update restLeft directly instead of
    // restarting this effect, so they don't reset the countdown.
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
      setRestLeft((t) => Math.max(0, Math.min(REST_MAX_SECONDS, t + deltaSeconds)))
    }
  }

  function advanceAfterRest() {
    if (isLast) {
      setPhase('group-complete')
      setPlaying(false)
    } else {
      setIndex((i) => i + 1)
      setPhase('exercise')
      setPlaying(true) // auto-play the next available video
    }
  }

  function markComplete() {
    if (!current) return
    setCompleted((prev) => new Set(prev).add(current._id))
    setPlaying(false)
    setPhase('resting')
  }

  function skipRest() {
    clearRestTimer()
    advanceAfterRest()
  }

  function goPrev() {
    if (index === 0) return
    clearRestTimer()
    setPhase('exercise')
    setPlaying(false)
    setIndex((i) => i - 1)
  }

  function goNext() {
    if (isLast) return
    clearRestTimer()
    setPhase('exercise')
    setPlaying(false)
    setIndex((i) => i + 1)
  }

  function replayGroup() {
    setIndex(0)
    setPhase('exercise')
    setPlaying(false)
  }

  function pickGroup(key) {
    if (key === group) return
    setGroup(key)
  }

  const groupCompletedCount = useMemo(
    () => videos.filter((v) => completed.has(v._id)).length,
    [videos, completed]
  )

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Top bar — close + category chips, floats over the video with a
          gradient scrim so it stays legible over any footage. */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex flex-col gap-2.5 px-4 pb-6"
        style={{
          paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 transition-all rounded-full active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            <CloseIcon />
          </button>
          {current && (
            <span className="text-xs font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {index + 1} / {videos.length}
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {MUSCLE_GROUPS.map((g) => {
            const active = g.key === group
            return (
              <button
                key={g.key}
                onClick={() => pickGroup(g.key)}
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
              className="absolute inset-0 object-cover w-full h-full"
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
                className="absolute bottom-0 inset-x-0 z-10 flex flex-col gap-2 px-5 pt-10 pb-4 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <h2 className="text-lg font-bold leading-snug" style={{ color: '#fff' }}>{current.name}</h2>
                    {remainingSec != null && videoDuration != null && (
                      <DurationRing remaining={remainingSec} total={videoDuration} />
                    )}
                  </div>
                  {completed.has(current._id) && (
                    <span
                      className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(200,241,53,0.18)', color: S.accent, border: '1px solid rgba(200,241,53,0.3)' }}
                    >
                      ✓ Done
                    </span>
                  )}
                </div>
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
                nextName={!isLast ? videos[index + 1]?.name : null}
              />
            )}

            {/* Group complete overlay */}
            {phase === 'group-complete' && (
              <GroupCompleteOverlay
                groupLabel={MUSCLE_GROUPS.find((g) => g.key === group)?.label}
                count={videos.length}
                onReplay={replayGroup}
                onClose={onClose}
                groups={MUSCLE_GROUPS.filter((g) => (videosByCategory[g.key] || []).length > 0)}
                currentGroup={group}
                onPickGroup={pickGroup}
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
            {videos.map((v, i) => (
              <button
                key={v._id}
                onClick={() => { clearRestTimer(); setPhase('exercise'); setPlaying(false); setShowControls(true); setIndex(i) }}
                className="rounded-full transition-all"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  background: completed.has(v._id) ? S.accent : i === index ? S.primary : S.border,
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
              {completed.has(current._id) ? '✓ Completed — rest again' : `Mark complete · rest ${restDuration}s`}
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
            {groupCompletedCount} of {videos.length} {MUSCLE_GROUPS.find((g) => g.key === group)?.label.toLowerCase()} exercises done
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

/* ── Group complete overlay ───────────────────────────────────────────────── */
function GroupCompleteOverlay({ groupLabel, count, onReplay, onClose, groups, currentGroup, onPickGroup }) {
  const nextGroup = groups[(groups.findIndex((g) => g.key === currentGroup) + 1) % groups.length]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'rgba(13,13,13,0.92)' }}>
      <span className="text-5xl">🎉</span>
      <div>
        <p className="text-lg font-bold" style={{ color: '#fff' }}>{groupLabel} complete!</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>You finished all {count} exercises.</p>
      </div>
      <div className="flex flex-col w-full max-w-xs gap-2 mt-2">
        <button
          onClick={() => onPickGroup(nextGroup.key)}
          className="py-2.5 text-sm font-bold rounded-xl"
          style={{ background: S.accent, color: '#0D0D0D' }}
        >
          Try {nextGroup.label} next
        </button>
        <button
          onClick={onReplay}
          className="py-2.5 text-sm font-semibold rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Replay {groupLabel}
        </button>
        <button
          onClick={onClose}
          className="py-2.5 text-sm font-semibold rounded-xl"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Exit
        </button>
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
