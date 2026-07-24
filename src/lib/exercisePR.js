// ─────────────────────────────────────────────────────────────────────────
// Personal-record lookup: given a history of past exercise entries (workout
// logs and/or PT sessions — anything with an `exercises: [{name, weight,
// reps}]` shape) and an exercise name, finds the heaviest weight ever
// logged for that exercise (case-insensitive match), plus the reps done at
// that weight.
// ─────────────────────────────────────────────────────────────────────────

export function computePR(history, exerciseName) {
  const target = (exerciseName || '').trim().toLowerCase()
  if (!target || !Array.isArray(history)) return null

  let best = null
  for (const entry of history) {
    const exercises = entry?.exercises
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      if (!ex?.name || ex.name.trim().toLowerCase() !== target) continue
      const weight = Number(ex.weight)
      if (!Number.isFinite(weight) || weight <= 0) continue
      if (!best || weight > best.weight) {
        best = { weight, reps: ex.reps || null, date: entry.date || entry.createdAt || null }
      }
    }
  }
  return best
}

export function formatPR(pr) {
  if (!pr) return ''
  return pr.reps ? `${pr.weight}kg × ${pr.reps}` : `${pr.weight}kg`
}

// ─────────────────────────────────────────────────────────────────────────
// Session-level PR detection: given the full set of logs (the "history"),
// builds a map of the heaviest weight ever recorded per exercise name, then
// lets callers check whether a specific log is the one that hit that
// weight — i.e. whether that session contains a personal record for any
// exercise logged in it.
// ─────────────────────────────────────────────────────────────────────────

export function buildExerciseMaxMap(history) {
  const max = new Map()
  if (!Array.isArray(history)) return max
  for (const entry of history) {
    const exercises = entry?.exercises
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      const name = (ex?.name || '').trim().toLowerCase()
      const weight = Number(ex?.weight)
      if (!name || !Number.isFinite(weight) || weight <= 0) continue
      if (!max.has(name) || weight > max.get(name)) max.set(name, weight)
    }
  }
  return max
}

export function sessionHasPR(log, maxMap) {
  if (!log?.exercises?.length || !maxMap) return false
  return log.exercises.some((ex) => {
    const name = (ex?.name || '').trim().toLowerCase()
    const weight = Number(ex?.weight)
    if (!name || !Number.isFinite(weight) || weight <= 0) return false
    return maxMap.get(name) === weight
  })
}
