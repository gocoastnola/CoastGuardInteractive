import { describe, expect, it } from 'vitest'
import { UNITS } from '../lib/units'
import { coastOf, hashString, mulberry32, pickOrders } from './orders'
import { INITIAL_JOURNEY, journeyReducer } from './machine'

describe('pickOrders', () => {
  it('same ZIP → same three ids, in the same order', () => {
    const a = pickOrders('70130', UNITS).map((o) => o.unit.id)
    const b = pickOrders('70130', UNITS).map((o) => o.unit.id)
    expect(a).toHaveLength(3)
    expect(a).toEqual(b)
  })
  it('different ZIPs usually differ', () => {
    const seen = new Set<string>()
    for (const zip of ['70130', '10001', '90210', '99501', '33139', '02108'])
      seen.add(pickOrders(zip, UNITS).map((o) => o.unit.id).join(','))
    expect(seen.size).toBeGreaterThan(1)
  })
  it('always three distinct unit types and ≥2 coasts, never a Training Center', () => {
    for (let z = 0; z < 2000; z += 37) {
      const zip = String(z * 50).padStart(5, '0')
      const picks = pickOrders(zip, UNITS)
      expect(picks).toHaveLength(3)
      expect(new Set(picks.map((p) => p.unit.unitType)).size).toBe(3)
      expect(new Set(picks.map((p) => p.coast)).size).toBeGreaterThanOrEqual(2)
      expect(picks.some((p) => p.unit.unitType === 'Training Center')).toBe(false)
      for (const p of picks) expect(p.milesFromCapeMay).toBeGreaterThan(0)
    }
  })
})

describe('coastOf', () => {
  it('classifies demo units sensibly', () => {
    const by = Object.fromEntries(UNITS.map((u) => [u.id, coastOf(u)]))
    expect(by['sector-new-orleans']).toBe('Gulf')
    expect(by['sector-houston-galveston']).toBe('Gulf')
    expect(by['sector-miami']).toBe('Atlantic')
    expect(by['sector-boston']).toBe('Atlantic')
    expect(by['station-golden-gate']).toBe('Pacific')
    expect(by['air-station-kodiak']).toBe('Pacific')
    expect(by['sector-guam']).toBe('Pacific')
    expect(by['sector-san-juan']).toBe('Caribbean')
  })
})

describe('hash / prng', () => {
  it('is deterministic and spreads', () => {
    expect(hashString('70130')).toBe(hashString('70130'))
    expect(hashString('70130')).not.toBe(hashString('70131'))
    const r = mulberry32(42)
    const a = [r(), r(), r()]
    for (const x of a) expect(x).toBeGreaterThanOrEqual(0)
    for (const x of a) expect(x).toBeLessThan(1)
    expect(new Set(a).size).toBe(3)
  })
})

describe('journeyReducer', () => {
  const shipDate = '2026-11-03'
  it('starts in dateEntry with no ship date', () => {
    expect(INITIAL_JOURNEY.phase).toBe('dateEntry')
    expect(INITIAL_JOURNEY.shipDate).toBeNull()
  })
  it('walks the happy path', () => {
    let s = journeyReducer(INITIAL_JOURNEY, { type: 'START', shipDate, orderIds: ['a', 'b', 'c'] })
    expect(s.phase).toBe('act1')
    expect(s.shipDate).toBe(shipDate)
    s = journeyReducer(s, { type: 'ACT1_DONE' })
    expect(s.phase).toBe('orders')
    s = journeyReducer(s, { type: 'CHOOSE_ORDER', unitId: 'zzz' }) // not offered → ignored
    expect(s.phase).toBe('orders')
    s = journeyReducer(s, { type: 'CHOOSE_ORDER', unitId: 'b' })
    expect(s.phase).toBe('act2')
    expect(s.firstUnitId).toBe('b')
    s = journeyReducer(s, { type: 'ACT2_DONE' })
    expect(s.phase).toBe('shipIntro')
    s = journeyReducer(s, { type: 'SHIP_INTRO_DONE' })
    expect(s.phase).toBe('patrol')
    s = journeyReducer(s, { type: 'PATROL_DONE' })
    expect(s.phase).toBe('explore')
    s = journeyReducer(s, { type: 'RESTART' })
    expect(s).toEqual(INITIAL_JOURNEY)
  })
  it('skip advances from either act and marks skipped', () => {
    let s = journeyReducer(INITIAL_JOURNEY, { type: 'START', shipDate, orderIds: ['a'] })
    s = journeyReducer(s, { type: 'SKIP_ACT' })
    expect(s.phase).toBe('orders')
    expect(s.skipped).toBe(true)
    s = journeyReducer(s, { type: 'CHOOSE_ORDER', unitId: 'a' })
    s = journeyReducer(s, { type: 'SKIP_ACT' })
    expect(s.phase).toBe('shipIntro') // ship intro still shows after a skipped act 2
    s = journeyReducer(s, { type: 'SHIP_INTRO_DONE' })
    s = journeyReducer(s, { type: 'SKIP_ACT' })
    expect(s.phase).toBe('explore')
    expect(s.skipped).toBe(true)
  })
  it('free explore enters explore with no journey data', () => {
    const s = journeyReducer(INITIAL_JOURNEY, { type: 'FREE_EXPLORE' })
    expect(s.phase).toBe('explore')
    expect(s.shipDate).toBeNull()
  })
  it('START is ignored outside dateEntry/idle', () => {
    const started = journeyReducer(INITIAL_JOURNEY, { type: 'START', shipDate, orderIds: ['a'] })
    const again = journeyReducer(started, { type: 'START', shipDate: '2027-01-05', orderIds: ['b'] })
    expect(again).toBe(started)
  })
})
