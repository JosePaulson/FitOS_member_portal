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
