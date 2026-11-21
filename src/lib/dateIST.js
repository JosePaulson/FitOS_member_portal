// India Standard Time is a fixed UTC+5:30 offset (no daylight saving), so a
// constant offset is always correct. This app should behave the same way
// regardless of a member's device timezone — a trainer's "9:00 AM slot"
// means 9:00 AM IST, not 9:00 AM wherever the phone's clock is set to.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
const IST_TZ = 'Asia/Kolkata'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** IST day-of-week name ('monday'..'sunday') for any Date/date-like input. */
export function istDayName(d) {
  const ist = new Date(new Date(d).getTime() + IST_OFFSET_MS)
  return DAY_NAMES[ist.getUTCDay()]
}

/** IST calendar-day key "YYYY-MM-DD" for any Date/date-like input. */
export function istDateKey(d) {
  const ist = new Date(new Date(d).getTime() + IST_OFFSET_MS)
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`
}

/** IST wall-clock "HH:mm" for any Date/date-like input. */
export function istTimeOfDay(d) {
  const ist = new Date(new Date(d).getTime() + IST_OFFSET_MS)
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`
}

/**
 * Value for an `<input type="datetime-local">` showing IST wall-clock time
 * — NOT the device's local time. Pair with parseISTInputValue() on submit.
 */
export function toISTInputValue(d) {
  const date = d ? new Date(d) : new Date()
  return `${istDateKey(date)}T${istTimeOfDay(date)}`
}

/** Parses an `<input type="datetime-local">` value (built by toISTInputValue) back into a real Date, treating it as IST wall-clock time. */
export function parseISTInputValue(value) {
  const [datePart, timePart] = value.split('T')
  return istDateTime(datePart, timePart || '00:00')
}

/** Builds the true UTC Date instant for an IST calendar date + "HH:mm" wall-clock time. */
export function istDateTime(dateKey, hhmm = '00:00') {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MS)
}

/** "Now", as an IST calendar-day key. */
export function todayISTKey() {
  return istDateKey(new Date())
}

// ── Display formatting — the whole app shows dates as dd/mm/yyyy (India). ──
const _dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: IST_TZ, day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' })
function _ist(d) {
  const o = {}
  for (const { type, value } of _dateParts.formatToParts(new Date(d))) o[type] = value
  return o
}

/** dd/mm/yyyy in IST. `{ weekday: true }` (or any truthy weekday option) prefixes "Sat, ". */
export function fmtISTDate(d, opts = {}) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  const p = _ist(dt)
  const out = `${p.day}/${p.month}/${p.year}`
  return opts.weekday ? `${p.weekday}, ${out}` : out
}

/** Formats a time (e.g. "3:45 pm") using IST explicitly, regardless of device timezone. */
export function fmtISTTime(d, opts = {}) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-IN', { timeZone: IST_TZ, hour: 'numeric', minute: '2-digit', ...opts })
}

/**
 * dd/mm/yyyy, h:mm am/pm in IST. With no options both parts show; with
 * options (kept for older callers) the date part shows if any of
 * weekday/day/month/year is set and the time part if hour/minute is set.
 */
export function fmtISTDateTime(d, opts = {}) {
  if (!d) return '—'
  const hasOpts = Object.keys(opts).length > 0
  const showDate = !hasOpts || ['weekday', 'day', 'month', 'year'].some((k) => opts[k])
  const showTime = !hasOpts || ['hour', 'minute'].some((k) => opts[k])
  const parts = []
  if (showDate) parts.push(fmtISTDate(d, opts))
  if (showTime) parts.push(fmtISTTime(d))
  return parts.join(', ')
}

export const fmtDate = fmtISTDate
export const fmtDateTime = fmtISTDateTime
export const fmtTime = fmtISTTime

export { IST_TZ }
