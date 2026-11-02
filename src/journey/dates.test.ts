import { describe, expect, it } from 'vitest'
import { addDays, dateParts, daysUntil, formatShort, gradDate, isISODate, nextShipDates, parseISODate, toISODate } from './dates'

describe('nextShipDates', () => {
  const today = new Date(2026, 9, 20) // Tue 2026-10-20 (local)
  it('returns 8 Tuesdays, each ≥ 14 days out, 7 days apart', () => {
    const dates = nextShipDates(today)
    expect(dates).toHaveLength(8)
    for (const iso of dates) {
      expect(parseISODate(iso).getDay()).toBe(2)
      expect(daysUntil(iso, today)).toBeGreaterThanOrEqual(14)
    }
    for (let i = 1; i < dates.length; i++) expect(daysUntil(dates[i], today) - daysUntil(dates[i - 1], today)).toBe(7)
    expect(dates[0]).toBe('2026-11-03') // exactly 14 days out and already a Tuesday
  })
  it('rolls forward to the next Tuesday when +14 days is not one', () => {
    const dates = nextShipDates(new Date(2026, 9, 21)) // Wed → +14 = Wed 11-04 → Tue 11-10
    expect(dates[0]).toBe('2026-11-10')
    expect(daysUntil(dates[0], new Date(2026, 9, 21))).toBe(20)
  })
  it('honours count/minDays overrides and local-time day boundaries', () => {
    const late = new Date(2026, 9, 20, 23, 59)
    expect(nextShipDates(late, 3, 1)).toEqual(['2026-10-27', '2026-11-03', '2026-11-10'])
  })
})

describe('gradDate', () => {
  it('is ship date + 56 days (8 weeks, demo)', () => {
    expect(gradDate('2026-11-03')).toBe('2026-12-29')
    expect(daysUntil(gradDate('2026-11-03'), parseISODate('2026-11-03'))).toBe(56)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('formatting', () => {
  it('formats short dates and parts in local time', () => {
    expect(formatShort('2026-11-03')).toBe('Tue, Nov 3')
    expect(dateParts('2026-11-03')).toEqual({ iso: '2026-11-03', weekday: 'Tue', month: 'Nov', day: 3, year: 2026 })
    expect(toISODate(parseISODate('2026-02-09'))).toBe('2026-02-09')
  })
  it('validates ISO date strings', () => {
    expect(isISODate('2026-11-03')).toBe(true)
    expect(isISODate('11/03/2026')).toBe(false)
    expect(isISODate('')).toBe(false)
  })
  it('daysUntil is signed and ignores time of day', () => {
    expect(daysUntil('2026-10-21', new Date(2026, 9, 20, 18))).toBe(1)
    expect(daysUntil('2026-10-19', new Date(2026, 9, 20, 1))).toBe(-1)
  })
})
