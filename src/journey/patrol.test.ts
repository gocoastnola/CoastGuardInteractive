import { describe, expect, it } from 'vitest'
import { buildPatrolLegs, legDuration, PATROL_STOPS, patrolMiles, POLAR_STAR_ID, SEATTLE } from './patrol'
import { INITIAL_JOURNEY, journeyReducer, type JourneyState } from './machine'

describe('patrol route', () => {
  const legs = buildPatrolLegs()

  it('visits every stop in order, Seattle out and Seattle home', () => {
    expect(PATROL_STOPS[0].lngLat).toEqual(SEATTLE)
    expect(PATROL_STOPS[PATROL_STOPS.length - 1].lngLat).toEqual(SEATTLE)
    expect(legs).toHaveLength(PATROL_STOPS.length - 1)
    legs.forEach((leg, i) => {
      expect(leg.from.id).toBe(PATROL_STOPS[i].id)
      expect(leg.to.id).toBe(PATROL_STOPS[i + 1].id)
    })
    const ids = PATROL_STOPS.map((s) => s.id)
    for (const required of ['honolulu', 'hobart', 'wellington', 'punta-arenas', 'cape-horn', 'rio', 'panama']) {
      expect(ids).toContain(required)
    }
  })

  it('never jumps the antimeridian (consecutive lngs differ < 180°)', () => {
    for (const leg of legs) {
      for (let i = 1; i < leg.points.length; i++) {
        expect(Math.abs(leg.points[i][0] - leg.points[i - 1][0])).toBeLessThan(180)
      }
    }
    // continuity across leg joins too
    for (let k = 1; k < legs.length; k++) {
      const prevEnd = legs[k - 1].points[legs[k - 1].points.length - 1]
      const nextStart = legs[k].points[0]
      expect(Math.abs(nextStart[0] - prevEnd[0])).toBeLessThan(1e-6)
      expect(Math.abs(nextStart[1] - prevEnd[1])).toBeLessThan(1e-6)
    }
  })

  it('is a realistic circumnavigation distance (> 20,000 statute miles)', () => {
    expect(patrolMiles(legs)).toBeGreaterThan(20000)
    expect(patrolMiles(legs)).toBeLessThan(40000)
  })

  it('leg durations are bounded (0.9–2.4 s)', () => {
    for (const leg of legs) {
      const d = legDuration(leg)
      expect(d).toBeGreaterThanOrEqual(0.9)
      expect(d).toBeLessThanOrEqual(2.4)
    }
  })
})

describe('journey machine — polar star phases', () => {
  const at = (phase: JourneyState['phase'], extra: Partial<JourneyState> = {}): JourneyState => ({
    ...INITIAL_JOURNEY,
    phase,
    orderIds: [POLAR_STAR_ID],
    ...extra,
  })

  it('act2 completion leads to the ship intro, then patrol, then explore', () => {
    let s = at('act2', { firstUnitId: POLAR_STAR_ID })
    s = journeyReducer(s, { type: 'ACT2_DONE' })
    expect(s.phase).toBe('shipIntro')
    s = journeyReducer(s, { type: 'SHIP_INTRO_DONE' })
    expect(s.phase).toBe('patrol')
    s = journeyReducer(s, { type: 'PATROL_DONE' })
    expect(s.phase).toBe('explore')
  })

  it('skip during act2 still shows the ship intro; skip during patrol exits to explore', () => {
    let s = journeyReducer(at('act2'), { type: 'SKIP_ACT' })
    expect(s.phase).toBe('shipIntro')
    s = journeyReducer(at('patrol'), { type: 'SKIP_ACT' })
    expect(s.phase).toBe('explore')
  })

  it('choosing orders only accepts ids in orderIds (polar star)', () => {
    const s = journeyReducer(at('orders'), { type: 'CHOOSE_ORDER', unitId: POLAR_STAR_ID })
    expect(s.phase).toBe('act2')
    expect(s.firstUnitId).toBe(POLAR_STAR_ID)
    const rejected = journeyReducer(at('orders'), { type: 'CHOOSE_ORDER', unitId: 'sector-miami' })
    expect(rejected.phase).toBe('orders')
  })
})
