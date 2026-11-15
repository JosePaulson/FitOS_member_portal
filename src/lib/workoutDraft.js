// Auto-saved, unsaved "Log a workout" form state — so closing the tab,
// getting a phone call mid-workout, or the browser reclaiming the page
// doesn't lose a half-entered log. Same idea as the draft recovery on the
// admin PT Sessions form.
//
// Scoped to brand-new logs only (editing an existing log reads/writes the
// real record) and to the signed-in member, so a shared device never offers
// one member's draft to another. Deliberately NOT under the `fitos:cache:`
// prefix: clearAppDataCache() wipes that on every app update/crash recovery,
// which is exactly when a member would most want their draft to survive.

const PREFIX = 'fitos:workout-draft:'
const keyFor = (memberId) => `${PREFIX}${memberId || 'anon'}`

export function loadWorkoutDraft(memberId) {
  try {
    const raw = localStorage.getItem(keyFor(memberId))
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.form ? parsed : null
  } catch {
    return null
  }
}

export function saveWorkoutDraft(memberId, form) {
  try {
    localStorage.setItem(keyFor(memberId), JSON.stringify({ form, savedAt: Date.now() }))
  } catch {
    // Storage full/disabled (e.g. private browsing) — draft recovery just
    // won't be available; not worth surfacing an error for.
  }
}

export function clearWorkoutDraft(memberId) {
  try { localStorage.removeItem(keyFor(memberId)) } catch { /* ignore */ }
}

/** A draft is only worth offering if the member actually started filling it in. */
export function workoutDraftHasContent(form) {
  return !!(
    form.title?.trim() ||
    form.notes?.trim() ||
    (form.bodyWeight !== '' && form.bodyWeight != null) ||
    form.exercises?.some((e) => e.name?.trim())
  )
}
