import { useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLE_GROUPS, EXERCISE_CATALOG } from '../data/exerciseCatalog'
import { getCustomExercises, addCustomExercise, getAllCustomExercises } from '../lib/customExercises'
import { computePR, formatPR } from '../lib/exercisePR'

/**
 * One exercise entry in a workout log — muscle group chips, a
 * name field with catalog + custom-history suggestions (each tagged with
 * the member's PR when one exists), and the usual sets/reps/weight inputs.
 *
 * `history` is an array of past logs ({ exercises: [...] }) used to look up
 * PRs. `onChange(field, value)` mirrors the parent's updateExercise(i, ...).
 */
export default function ExerciseRow({ exercise, onChange, onRemove, history, showRemove }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(exercise.name || '')
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(exercise.name || '') }, [exercise.name])

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const suggestions = useMemo(() => {
    const group = exercise.muscleGroup
    const base = group
      ? [...(EXERCISE_CATALOG[group] || []), ...getCustomExercises(group)]
      : [...Object.values(EXERCISE_CATALOG).flat(), ...getAllCustomExercises()]
    const q = query.trim().toLowerCase()
    const filtered = q ? base.filter((n) => n.toLowerCase().includes(q)) : base
    return [...new Set(filtered)].slice(0, 16)
  }, [exercise.muscleGroup, query])

  function pickGroup(key) {
    onChange('muscleGroup', exercise.muscleGroup === key ? '' : key)
  }

  function selectSuggestion(name) {
    onChange('name', name)
    setQuery(name)
    setOpen(false)
  }

  function commitTyped() {
    const trimmed = query.trim()
    onChange('name', trimmed)
    if (!trimmed) return
    const group = exercise.muscleGroup
    const catalogHit = group && (EXERCISE_CATALOG[group] || []).some((n) => n.toLowerCase() === trimmed.toLowerCase())
    const customHit = getCustomExercises(group).some((n) => n.toLowerCase() === trimmed.toLowerCase())
    if (!catalogHit && !customHit) addCustomExercise(group, trimmed)
  }

  const pr = computePR(history, exercise.name)

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
      <div className="flex-1 min-w-0">
        {/* Muscle group chips */}
        <div className="flex gap-1.5 pb-2 -mx-1 px-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MUSCLE_GROUPS.map((g) => {
            const active = exercise.muscleGroup === g.key
            return (
              <button
                key={g.key} type="button"
                onClick={() => pickGroup(g.key)}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap shrink-0 transition-all"
                style={active
                  ? { background: 'var(--color-accent)', color: '#0D0D0D' }
                  : { background: 'var(--color-surface-3)', color: 'var(--color-secondary)' }}
              >
                {g.icon} {g.label}
              </button>
            )
          })}
        </div>

        {/* Name field + suggestions */}
        <div ref={wrapRef} className="relative">
          <div className="flex items-center gap-2">
            <input
              placeholder="Exercise name"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onBlur={commitTyped}
              className="flex-1 text-xs field-input"
            />
            {pr && (
              <span
                className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                title="Your personal record for this exercise"
              >
                🏆 {formatPR(pr)}
              </span>
            )}
          </div>

          {open && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 z-10 mt-1 overflow-y-auto rounded-lg shadow-lg max-h-56"
              style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
            >
              {!exercise.muscleGroup && (
                <p className="px-3 pt-2 pb-1 text-[10px]" style={{ color: 'var(--color-secondary)' }}>
                  Tip: pick a muscle group above to narrow these down
                </p>
              )}
              {suggestions.map((name) => {
                const sPr = computePR(history, name)
                return (
                  <button
                    key={name} type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(name) }}
                    className="flex items-center justify-between w-full gap-2 px-3 py-2 text-xs text-left transition-colors hover:brightness-125"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <span>{name}</span>
                    {sPr && <span className="text-[10px] shrink-0" style={{ color: '#fbbf24' }}>🏆 {formatPR(sPr)}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <input placeholder="Sets" type="number" value={exercise.sets} onChange={(e) => onChange('sets', e.target.value)} className="text-xs field-input" />
          <input placeholder="Reps" value={exercise.reps} onChange={(e) => onChange('reps', e.target.value)} className="text-xs field-input" />
          <input placeholder="Weight (kg)" type="number" value={exercise.weight} onChange={(e) => onChange('weight', e.target.value)} className="col-span-2 text-xs field-input" />
        </div>
      </div>

      {showRemove && (
        <button type="button" onClick={onRemove} className="mt-1 text-lg leading-none" style={{ color: 'var(--color-secondary)' }}>×</button>
      )}
    </div>
  )
}
