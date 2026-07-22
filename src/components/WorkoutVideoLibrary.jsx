import { useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLE_GROUPS, WORKOUT_VIDEOS, REST_SECONDS } from '../data/workoutVideos'

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

export default function WorkoutVideoLibrary() {
  const [group, setGroup] = useState(MUSCLE_GROUPS[0].key)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [phase, setPhase] = useState('exercise') // exercise | resting | group-complete
  const [restLeft, setRestLeft] = useState(REST_SECONDS)
  const [completed, setCompleted] = useState(() => new Set())

  const videoRef = useRef(null)
  const timerRef = useRef(null)

  const videos = WORKOUT_VIDEOS[group] || []
  const current = videos[index]
  const isLast = index >= videos.length - 1

  // Reset to the first exercise whenever the muscle group changes.
  useEffect(() => {
    setIndex(0)
    setPhase('exercise')
    setPlaying(false)
    clearRestTimer()
  }, [group])

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

  function clearRestTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Rest countdown — ticks every second, auto-advances when it hits zero.
  useEffect(() => {
    if (phase !== 'resting') return
    setRestLeft(REST_SECONDS)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
    setCompleted((prev) => new Set(prev).add(current.id))
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
    () => videos.filter((v) => completed.has(v.id)).length,
    [videos, completed]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Muscle group chips */}
      <div className="flex gap-2 pb-1 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
        {MUSCLE_GROUPS.map((g) => {
          const active = g.key === group
          return (
            <button
              key={g.key}
              onClick={() => pickGroup(g.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all shrink-0"
              style={active
                ? { background: S.accent, color: '#0D0D0D' }
                : { background: S.surface2, color: S.secondary, border: `1px solid ${S.border}` }}
            >
              <span>{g.icon}</span>{g.label}
            </button>
          )
        })}
      </div>

      {!current ? (
        <div className="py-16 text-sm text-center card" style={{ color: S.secondary }}>
          No videos in this category yet.
        </div>
      ) : (
        <>
          {/* Player card */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: `radial-gradient(120% 100% at 50% 0%, rgba(200,241,53,0.10), transparent 60%), ${S.surface2}`,
              border: `1px solid ${S.border}`,
            }}
          >
            <div className="relative aspect-[4/5] sm:aspect-video bg-black">
              <video
                ref={videoRef}
                src={current.videoUrl}
                loop
                muted
                playsInline
                className="absolute inset-0 object-cover w-full h-full"
                style={{ opacity: phase === 'resting' ? 0.25 : 1, transition: 'opacity 0.3s' }}
                onClick={() => phase === 'exercise' && setPlaying((p) => !p)}
              />

              {/* Exercise phase: center play/pause button */}
              {phase === 'exercise' && (
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-label={playing ? 'Pause' : 'Play (loops automatically)'}
                >
                  <span
                    className="flex items-center justify-center transition-transform rounded-full w-16 h-16 active:scale-90"
                    style={{
                      background: playing ? 'rgba(0,0,0,0.35)' : S.accent,
                      color: playing ? '#fff' : '#0D0D0D',
                      boxShadow: playing ? 'none' : '0 8px 24px rgba(200,241,53,0.35)',
                      backdropFilter: playing ? 'blur(4px)' : 'none',
                    }}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </span>
                </button>
              )}

              {/* Loop badge */}
              {phase === 'exercise' && playing && (
                <span
                  className="absolute px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 top-3 left-3"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}
                >
                  🔁 LOOPING
                </span>
              )}

              {/* Exercise index badge */}
              <span
                className="absolute px-2.5 py-1 rounded-full text-[10px] font-bold top-3 right-3"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}
              >
                {index + 1} / {videos.length}
              </span>

              {/* Resting overlay */}
              {phase === 'resting' && (
                <RestOverlay restLeft={restLeft} onSkip={skipRest} nextName={!isLast ? videos[index + 1]?.name : null} />
              )}

              {/* Group complete overlay */}
              {phase === 'group-complete' && (
                <GroupCompleteOverlay
                  groupLabel={MUSCLE_GROUPS.find((g) => g.key === group)?.label}
                  count={videos.length}
                  onReplay={replayGroup}
                  groups={MUSCLE_GROUPS}
                  currentGroup={group}
                  onPickGroup={pickGroup}
                />
              )}
            </div>

            {/* Exercise info */}
            {phase !== 'group-complete' && (
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold leading-snug" style={{ color: S.primary }}>{current.name}</h2>
                  {completed.has(current.id) && (
                    <span
                      className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(200,241,53,0.12)', color: S.accent, border: '1px solid rgba(200,241,53,0.25)' }}
                    >
                      ✓ Done
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Pill>{current.sets}</Pill>
                  <Pill>{current.reps}</Pill>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: S.secondary }}>{current.cue}</p>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => { clearRestTimer(); setPhase('exercise'); setPlaying(false); setIndex(i) }}
                className="rounded-full transition-all"
                style={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  background: completed.has(v.id) ? S.accent : i === index ? S.primary : S.border,
                }}
                aria-label={`Go to exercise ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next */}
          {phase === 'exercise' && (
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={index === 0}
                className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-semibold rounded-xl disabled:opacity-35 transition-all"
                style={{ background: S.surface2, border: `1px solid ${S.border}`, color: S.primary }}
              >
                ← Prev
              </button>
              <button
                onClick={goNext}
                disabled={isLast}
                className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-semibold rounded-xl disabled:opacity-35 transition-all"
                style={{ background: S.surface2, border: `1px solid ${S.border}`, color: S.primary }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Mark complete */}
          {phase === 'exercise' && (
            <button
              onClick={markComplete}
              className="py-3.5 text-sm font-bold rounded-xl transition-all active:scale-[0.98]"
              style={{ background: S.accent, color: '#0D0D0D', boxShadow: '0 8px 20px rgba(200,241,53,0.25)' }}
            >
              {completed.has(current.id) ? '✓ Completed — rest again' : 'Mark complete & rest 45s'}
            </button>
          )}

          <p className="text-xs text-center" style={{ color: S.secondary }}>
            {groupCompletedCount} of {videos.length} {MUSCLE_GROUPS.find((g) => g.key === group)?.label.toLowerCase()} exercises done
          </p>
        </>
      )}
    </div>
  )
}

/* ── Rest overlay with circular countdown ─────────────────────────────────── */
function RestOverlay({ restLeft, onSkip, nextName }) {
  const progress = restLeft / REST_SECONDS
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

/* ── Group complete overlay ───────────────────────────────────────────────── */
function GroupCompleteOverlay({ groupLabel, count, onReplay, groups, currentGroup, onPickGroup }) {
  const nextGroup = groups[(groups.findIndex((g) => g.key === currentGroup) + 1) % groups.length]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'rgba(13,13,13,0.85)' }}>
      <span className="text-5xl">🎉</span>
      <div>
        <p className="text-lg font-bold" style={{ color: '#fff' }}>{groupLabel} complete!</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>You finished all {count} exercises.</p>
      </div>
      <div className="flex flex-col w-full gap-2 mt-2">
        <button
          onClick={() => onPickGroup(nextGroup.key)}
          className="py-2.5 text-sm font-bold rounded-xl"
          style={{ background: S.accent, color: '#0D0D0D' }}
        >
          {nextGroup.icon} Try {nextGroup.label} next
        </button>
        <button
          onClick={onReplay}
          className="py-2.5 text-sm font-semibold rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Replay {groupLabel}
        </button>
      </div>
    </div>
  )
}

function Pill({ children }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: S.surface3, color: S.secondary, border: `1px solid ${S.border}` }}
    >
      {children}
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
