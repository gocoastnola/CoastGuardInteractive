import { describe, it, expect } from 'vitest'
import rawUnits from './units.json'
import { validateUnits, REGIONS, UNIT_TYPES, REGION_BOUNDS } from './schema'

describe('units.json', () => {
  const { units, issues } = validateUnits(rawUnits)

  it('passes the zod schema with no issues', () => {
    expect(issues).toEqual([])
    expect(units.length).toBeGreaterThanOrEqual(15)
  })

  it('has unique ids', () => {
    const ids = units.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has lat/lng within valid ranges and inside the declared region', () => {
    for (const u of units) {
      expect(u.lat).toBeGreaterThanOrEqual(-90)
      expect(u.lat).toBeLessThanOrEqual(90)
      expect(u.lng).toBeGreaterThanOrEqual(-180)
      expect(u.lng).toBeLessThanOrEqual(180)
      const b = REGION_BOUNDS[u.region]
      expect(u.lat, `${u.id} lat in region`).toBeGreaterThanOrEqual(b.south)
      expect(u.lat, `${u.id} lat in region`).toBeLessThanOrEqual(b.north)
      expect(u.lng, `${u.id} lng in region`).toBeGreaterThanOrEqual(b.west)
      expect(u.lng, `${u.id} lng in region`).toBeLessThanOrEqual(b.east)
    }
  })

  it('uses only known regions and unit types', () => {
    for (const u of units) {
      expect(REGIONS).toContain(u.region)
      expect(UNIT_TYPES).toContain(u.unitType)
    }
  })

  it('labels every record as demo-unverified with no sources (Phase 1 policy)', () => {
    for (const u of units) {
      expect(u.contentReviewStatus).toBe('demo-unverified')
      expect(u.sourceUrls).toEqual([])
      expect(u.lastVerified).toBeNull()
      expect(u.narrationAudio).toBeNull()
    }
  })

  it('covers all four regions and at least five Gulf Coast units', () => {
    const regions = new Set(units.map((u) => u.region))
    expect([...regions].sort()).toEqual(['alaska', 'conus', 'guam', 'puertorico'])
    const gulf = units.filter((u) => ['LA', 'TX', 'MS', 'AL'].includes(u.state) || (u.state === 'FL' && u.lng < -82))
    expect(gulf.length).toBeGreaterThanOrEqual(5)
  })

  it('rejects bad records', () => {
    const bad = [{ ...units[0], id: 'Bad Id', lat: 999 }]
    const r = validateUnits(bad)
    expect(r.issues.length).toBeGreaterThan(0)
    const dup = [units[0], units[0]]
    expect(validateUnits(dup).issues.some((i) => i.message.includes('duplicate'))).toBe(true)
    const wrongRegion = [{ ...units[0], region: 'guam' as const }]
    expect(validateUnits(wrongRegion).issues.some((i) => i.message.includes('outside region'))).toBe(true)
  })
})
