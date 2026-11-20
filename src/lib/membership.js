/**
 * Whether a member currently has full access to premium features — AI
 * chat, meal scanning, new transformation photo uploads, workout logging,
 * and workout videos. Anything other than an active membership (expired,
 * paused, etc.) is treated as inactive and gates those features until
 * they renew; viewing existing data (history, past photos) stays
 * available regardless.
 */
export function isMemberActive(member) {
  return member?.membershipStatus === 'active'
}

const DAY = 86_400_000

/**
 * How far through its current membership period a member is.
 *
 * Measured from the membership's real START date to its EXPIRY — not from when the record was
 * created. That matters for back-dated joins: a member added today with a joining date of two
 * months ago has an old start date but a brand-new record, so using the record's creation date
 * produced nonsense (0%, or negative values clamped to 0).
 *
 * state: 'upcoming' (starts in the future) | 'running' | 'ended' | 'unknown' (dates missing)
 */
export function membershipProgress(member, now = Date.now()) {
  const unknown = { percent: 0, state: 'unknown', totalDays: null, usedDays: null, daysLeft: null }
  const end = member?.membershipExpiryDate ? new Date(member.membershipExpiryDate).getTime() : NaN
  const startRaw = member?.membershipStartDate || member?.createdAt // createdAt only for very old records with no start date
  const start = startRaw ? new Date(startRaw).getTime() : NaN
  if (!Number.isFinite(end) || !Number.isFinite(start)) return unknown

  const daysLeft = Math.max(0, Math.ceil((end - now) / DAY))
  if (!(end > start)) return { ...unknown, percent: now >= end ? 100 : 0, state: now >= end ? 'ended' : 'unknown', daysLeft } // bad data, don't divide by zero

  const totalDays = Math.max(1, Math.round((end - start) / DAY))
  const state = now < start ? 'upcoming' : now >= end ? 'ended' : 'running'
  const percent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
  const usedDays = Math.min(totalDays, Math.max(0, Math.floor((now - start) / DAY)))
  return { percent, state, totalDays, usedDays, daysLeft }
}

/** The day the person joined — the (possibly back-dated) join date, falling back for older records. */
export const memberSince = (member) => member?.joinDate || member?.membershipStartDate || member?.createdAt
