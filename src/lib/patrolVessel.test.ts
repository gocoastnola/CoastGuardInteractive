import { describe, expect, it } from 'vitest'
import { arcPrefix, type LngLat } from '../journey/arc'
import { buildPatrolLegs } from '../journey/patrol'
import { routeTangent, vesselOrientation } from './patrolVessel'

describe('patrol vessel route tangent', () => {
  const points: LngLat[] = [[179, 10], [180, 11], [181, 12], [182, 13]]

  it('uses the existing route segment that contains the exact revealed head', () => {
    for (const progress of [0, 0.1, 0.5, 0.8, 1]) {
      const tangent = routeTangent(points, progress)
      const head = arcPrefix(points, progress).head
      expect(points).toContain(tangent.from)
      expect(points).toContain(tangent.to)
      expect(tangent.to[0] - tangent.from[0]).toBe(1)
      expect(head[0]).toBeGreaterThanOrEqual(tangent.from[0])
      expect(head[0]).toBeLessThanOrEqual(tangent.to[0])
    }
  })

  it('retains the local Pacific tangent across the antimeridian', () => {
    const legs = buildPatrolLegs()
    const path = legs.flatMap((leg, index) => index ? leg.points.slice(1) : leg.points)
    const crossing = path.findIndex((point, index) => index > 0 && path[index - 1][0] >= -180 && point[0] < -180)
    expect(crossing).toBeGreaterThan(0)
    const tangent = routeTangent(path, (crossing - 0.5) / (path.length - 1))
    expect(tangent.from).toBe(path[crossing - 1])
    expect(tangent.to).toBe(path[crossing])
    expect(Math.abs(tangent.to[0] - tangent.from[0])).toBeLessThan(5)
  })

  it('clamps progress and handles absent or stationary geometry without invalid coordinates', () => {
    expect(routeTangent(points, -Infinity)).toEqual({ from: points[0], to: points[1] })
    expect(routeTangent(points, Infinity)).toEqual({ from: points[2], to: points[3] })
    expect(routeTangent(points, NaN)).toEqual({ from: points[0], to: points[1] })
    expect(routeTangent([], 0.5)).toEqual({ from: [0, 0], to: [0, 0] })
    const singleton: LngLat = [-122, 47]
    expect(routeTangent([singleton], 0.5)).toEqual({ from: singleton, to: singleton })
    expect(routeTangent([singleton, singleton], 0.5)).toEqual({ from: singleton, to: singleton })
  })
})

describe('upright miniature vessel orientation', () => {
  const origin = { x: 0, y: 0 }

  it('faces along actual projected eastward and westward travel', () => {
    expect(vesselOrientation(origin, { x: 100, y: 0 })).toEqual({ direction: 1, tilt: 0 })
    const west = vesselOrientation(origin, { x: -100, y: 0 })
    expect(west.direction).toBe(-1)
    expect(Math.abs(west.tilt)).toBe(0)
    expect(vesselOrientation(origin, { x: 100, y: 10 }).tilt).toBeCloseTo(5.7106, 4)
    expect(vesselOrientation(origin, { x: -100, y: 10 }).tilt).toBeCloseTo(-5.7106, 4)
  })

  it('limits steep screen tangents so the toy never turns upside down', () => {
    for (const x of [-20, 20]) {
      for (const y of [-100, 100]) {
        const orientation = vesselOrientation(origin, { x, y })
        expect(Math.abs(orientation.tilt)).toBe(14)
        expect(orientation.direction).toBe(x < 0 ? -1 : 1)
      }
    }
  })

  it('keeps the last facing direction around vertical travel rather than flickering', () => {
    expect(vesselOrientation(origin, { x: 0.4, y: 10 }, -1).direction).toBe(-1)
    expect(vesselOrientation(origin, { x: -0.4, y: 10 }, 1).direction).toBe(1)
    expect(vesselOrientation(origin, { x: 0, y: -10 }, -1).direction).toBe(-1)
    expect(vesselOrientation(origin, { x: 3, y: 10 }, -1).direction).toBe(1)
  })

  it('retains a finite upright fallback for a zero or invalid projected tangent', () => {
    for (const point of [origin, { x: NaN, y: 1 }, { x: Infinity, y: 0 }]) {
      expect(vesselOrientation(origin, point, -1)).toEqual({ direction: -1, tilt: 0 })
    }
  })
})
