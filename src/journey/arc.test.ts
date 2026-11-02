import { describe, expect, it } from 'vitest'
import { arcPrefix, boundsOf, formatMiles, greatCircleArc, greatCirclePoint, haversineMiles } from './arc'
import { CAPE_MAY } from './constants'

const NEW_ORLEANS: [number, number] = [-90.07, 29.95]
const CAPE: [number, number] = [CAPE_MAY.lng, CAPE_MAY.lat]

describe('haversineMiles', () => {
  it('New Orleans → Cape May is roughly 1,060 miles (great circle)', () => {
    // Δlat 9° × Δlng 15.15° at ~34° N ≈ 15.4° of arc ≈ 1,064 mi — brief estimated 1,100–1,200.
    const d = haversineMiles(NEW_ORLEANS, CAPE)
    expect(d).toBeGreaterThan(1000)
    expect(d).toBeLessThan(1150)
  })
  it('same point is 0', () => {
    expect(haversineMiles(CAPE, CAPE)).toBe(0)
  })
  it('is symmetric', () => {
    expect(haversineMiles(NEW_ORLEANS, CAPE)).toBeCloseTo(haversineMiles(CAPE, NEW_ORLEANS), 6)
  })
})

describe('greatCirclePoint / greatCircleArc', () => {
  it('endpoints match the inputs', () => {
    const p0 = greatCirclePoint(NEW_ORLEANS, CAPE, 0)
    const p1 = greatCirclePoint(NEW_ORLEANS, CAPE, 1)
    expect(p0[0]).toBeCloseTo(NEW_ORLEANS[0], 6)
    expect(p0[1]).toBeCloseTo(NEW_ORLEANS[1], 6)
    expect(p1[0]).toBeCloseTo(CAPE[0], 6)
    expect(p1[1]).toBeCloseTo(CAPE[1], 6)
  })
  it('midpoint is equidistant from both ends', () => {
    const mid = greatCirclePoint(NEW_ORLEANS, CAPE, 0.5)
    expect(haversineMiles(NEW_ORLEANS, mid)).toBeCloseTo(haversineMiles(mid, CAPE), 3)
  })
  it('coincident points return the point itself', () => {
    expect(greatCirclePoint(CAPE, CAPE, 0.5)).toEqual(CAPE)
  })
  it('samples n points and never jumps across the antimeridian', () => {
    const guam: [number, number] = [144.66, 13.43]
    const pts = greatCircleArc(CAPE, guam, 100)
    expect(pts).toHaveLength(100)
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThan(180)
    }
  })
})

describe('arcPrefix', () => {
  const pts = greatCircleArc(NEW_ORLEANS, CAPE, 11)
  it('t=0 yields one point, t=1 yields the whole line', () => {
    expect(arcPrefix(pts, 0).line).toHaveLength(1)
    expect(arcPrefix(pts, 1).line).toHaveLength(11)
    expect(arcPrefix(pts, 1).head).toEqual(pts[10])
  })
  it('interpolates the head between samples', () => {
    const { head, line } = arcPrefix(pts, 0.25)
    expect(line[line.length - 1]).toEqual(head)
    expect(head[0]).toBeGreaterThan(Math.min(pts[2][0], pts[3][0]) - 1e-9)
    expect(head[0]).toBeLessThan(Math.max(pts[2][0], pts[3][0]) + 1e-9)
  })
})

describe('boundsOf / formatMiles', () => {
  it('computes a bbox', () => {
    expect(boundsOf([[-90, 30], [-74, 39], [-80, 41]])).toEqual([
      [-90, 30],
      [-74, 41],
    ])
  })
  it('formats with thousands separators', () => {
    expect(formatMiles(1246.6)).toBe('1,247')
    expect(formatMiles(0)).toBe('0')
  })
})
