// ─────────────────────────────────────────────────────────────────────────
// Remembers exercises a member types in manually (not in the built-in
// catalog) so they show up as suggestions next time — scoped per device via
// localStorage, grouped by muscle group. No backend involved by design;
// this is purely a personal autocomplete convenience.
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fitos:customExercises:v1'
const FALLBACK_GROUP = 'other'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable/full — suggestions just won't persist, not fatal.
  }
}

export function getCustomExercises(muscleGroup) {
  const all = readAll()
  return all[muscleGroup || FALLBACK_GROUP] || []
}

/** All custom exercises across every muscle group, deduped. */
export function getAllCustomExercises() {
  const all = readAll()
  return [...new Set(Object.values(all).flat())]
}

export function addCustomExercise(muscleGroup, name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return
  const group = muscleGroup || FALLBACK_GROUP
  const all = readAll()
  const list = all[group] || []
  const alreadyThere = list.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  if (!alreadyThere) {
    all[group] = [...list, trimmed]
    writeAll(all)
  }
}
