/**
 * Ship-date helpers for the "Pick your basic training date" landing.
 *
 * Everything here is DEMO scheduling: the Coast Guard's real Cape May class
 * dates are not verified (SOURCES.md). We offer the next N Tuesdays that are at
 * least `minDays` out, and treat basic training as 8 weeks (56 days).
 *
 * Dates are plain `YYYY-MM-DD` strings interpreted in the user's local time —
 * never `new Date('YYYY-MM-DD')` (that parses as UTC and shifts a day in the US).
 */

export const TRAINING_WEEKS = 8
export const TRAINING_DAYS = TRAINING_WEEKS * 7
export const SHIP_DATE_COUNT = 8
export const MIN_DAYS_OUT = 14
/** JS getDay() value for Tuesday. */
export const SHIP_WEEKDAY = 2

const MS_DAY = 86_400_000

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISODate(s).getTime())
}

/** Local-midnight copy of a date. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from `from` (local midnight) to the ISO date. Negative if past. */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const a = startOfDay(from).getTime()
  const b = parseISODate(iso).getTime()
  return Math.round((b - a) / MS_DAY)
}

/**
 * The next `count` ship dates (Tuesdays) that are at least `minDays` after `from`.
 * Demo schedule — illustrative, not real class dates.
 */
export function nextShipDates(from: Date = new Date(), count = SHIP_DATE_COUNT, minDays = MIN_DAYS_OUT): string[] {
  const d = startOfDay(from)
  d.setDate(d.getDate() + minDays)
  while (d.getDay() !== SHIP_WEEKDAY) d.setDate(d.getDate() + 1)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(toISODate(d))
    d.setDate(d.getDate() + 7)
  }
  return out
}

/** Graduation = ship date + 8 weeks (demo-unverified). */
export function gradDate(shipIso: string): string {
  return addDays(shipIso, TRAINING_DAYS)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export interface DateParts {
  iso: string
  weekday: string
  month: string
  day: number
  year: number
}

export function dateParts(iso: string): DateParts {
  const d = parseISODate(iso)
  return { iso, weekday: WEEKDAYS[d.getDay()], month: MONTHS[d.getMonth()], day: d.getDate(), year: d.getFullYear() }
}

/** "Tue, Nov 3" */
export function formatShort(iso: string): string {
  const p = dateParts(iso)
  return `${p.weekday}, ${p.month} ${p.day}`
}

/** "Tuesday, November 3, 2026" (for the accessible label / long copy). */
export function formatLong(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
