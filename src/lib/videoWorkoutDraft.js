// An unfinished Workout Videos session, kept on the member's device.
//
// Every exercise logged in the video player is written here straight away, so
// closing the app, a dead phone or a crash mid-workout loses nothing — and it
// works with no internet at all. Nothing is sent to the server until the member
// chooses "Log workout" (in the close prompt, or in the "Unfinished workout"
// prompt on the next app open). Skipped exercises are never stored.
//
// Scoped to the signed-in member so a shared device never offers one member's
// session to another. Deliberately NOT under the `fitos:cache:` prefix:
// clearAppDataCache() wipes that on every app update/crash recovery, which is
// exactly when a member would most want their session to survive.
//
// Stored shape:
//   { sessionId, startedAt (ms), lastActivityAt (ms),
//     exercises: [{ name, reps, sets, weight, muscleGroup }],
//     labels: { [categoryKey]: 'Chest' } }   ← so prompts can name categories offline

import { portalApi } from '../api/index'

const PREFIX = 'fitos:video-workout-draft:'
const keyFor = (memberId) => `${PREFIX}${memberId || 'anon'}`

// Fired when a draft is logged/discarded from outside the player (the app-open
// prompt), so an already-open player drops its in-memory copy instead of
// offering to log the same exercises again.
export const VIDEO_DRAFT_CLEARED_EVENT = 'fitos:video-draft-cleared'

export function newSessionId() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID() } catch { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function loadVideoDraft(memberId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(memberId)) || 'null')
    if (!parsed || !parsed.sessionId || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) return null
    const startedAt = Number(parsed.startedAt)
    if (!Number.isFinite(startedAt)) return null
    return { ...parsed, startedAt, lastActivityAt: Number(parsed.lastActivityAt) || startedAt, labels: parsed.labels || {} }
  } catch {
    return null
  }
}

export function saveVideoDraft(memberId, draft) {
  try {
    localStorage.setItem(keyFor(memberId), JSON.stringify(draft))
  } catch {
    // Storage full/disabled (e.g. private browsing) — the session still lives in
    // memory for this sitting; recovery after a crash just won't be available.
  }
}

export function clearVideoDraft(memberId, { notify = true } = {}) {
  try { localStorage.removeItem(keyFor(memberId)) } catch { /* ignore */ }
  if (notify && typeof window !== 'undefined') {
    // Best-effort — a failed notification must never turn a successful log into an error.
    try { window.dispatchEvent(new Event(VIDEO_DRAFT_CLEARED_EVENT)) } catch { /* ignore */ }
  }
}

/** Category names in first-appearance order, e.g. ['Chest', 'Shoulders']. */
export function draftCategoryNames(draft) {
  const keys = []
  for (const e of draft?.exercises || []) if (e.muscleGroup && !keys.includes(e.muscleGroup)) keys.push(e.muscleGroup)
  return keys.map((k) => draft.labels?.[k] || k.charAt(0).toUpperCase() + k.slice(1))
}

/**
 * Sends the session to the server, which creates today's workout log or
 * appends to the day's existing one. The local copy is cleared only after the
 * server confirms — if this throws (offline, server error) nothing is lost and
 * the member can simply try again; the sessionId makes a retry safe even if
 * the first attempt actually landed.
 */
export async function submitVideoDraft(memberId, draft, bodyWeight, { notify = true } = {}) {
  await portalApi.logVideoWorkout({
    sessionId: draft.sessionId,
    startedAt: new Date(draft.startedAt).toISOString(),
    lastActivityAt: new Date(draft.lastActivityAt || draft.startedAt).toISOString(),
    exercises: draft.exercises,
    ...(bodyWeight !== undefined ? { bodyWeight } : {}),
  })
  clearVideoDraft(memberId, { notify })
}
