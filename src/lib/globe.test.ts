import { describe, expect, it } from 'vitest'
import { globeOverviewZoom, voyageMidpoint } from './globe'
import { haversineMiles } from '../journey/arc'
import { buildPatrolLegs } from '../journey/patrol'

describe('single-globe voyage framing', () => {
  it('crosses the antimeridian toward the Pacific rather than Greenwich', () => {
    const center = voyageMidpoint([[179, 0], [-179, 0]])
    expect(Math.abs(center[0])).toBeCloseTo(180, 5)
    expect(center[1]).toBeCloseTo(0, 5)
  })

  it('follows the intentional sea waypoints instead of shortcutting the endpoints', () => {
    const center = voyageMidpoint([[0, 0], [60, 0], [60, 60]])
    expect(center[0]).toBeCloseTo(60, 5)
    expect(center[1]).toBeCloseTo(0, 5)
  })

  it('handles stationary and singleton legs without invalid camera coordinates', () => {
    expect(voyageMidpoint([[-122, 47]])).toEqual([-122, 47])
    expect(voyageMidpoint([[-122, 47], [-122, 47]])).toEqual([-122, 47])
    expect(voyageMidpoint([]).every(Number.isFinite)).toBe(true)
  })

  it('compensates polar camera zoom to keep the same physical globe diameter', () => {
    const equatorial = globeOverviewZoom(350, 664, 0)
    const polar = globeOverviewZoom(350, 664, -60)
    expect(equatorial - polar).toBeCloseTo(1, 5)
    expect(globeOverviewZoom(350, 664, 60)).toBeCloseTo(polar, 5)
    expect(globeOverviewZoom(350, 664, -90)).toBeGreaterThanOrEqual(-2)
  })

  it('keeps each existing sea leg on the front hemisphere of its broad camera', () => {
    // At the widest supported whole-orb framing the native horizon is over 73°
    // from its center. Leave a margin for the current vessel and arrival label.
    const seventyDegreesInMiles = 3958.7613 * 70 * Math.PI / 180
    for (const leg of buildPatrolLegs()) {
      const center = voyageMidpoint(leg.points)
      for (const point of leg.points) {
        expect(haversineMiles(center, point), leg.to.name).toBeLessThan(seventyDegreesInMiles)
      }
    }
  })
})
