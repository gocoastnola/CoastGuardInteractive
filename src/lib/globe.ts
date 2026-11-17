import { greatCirclePoint, haversineMiles, type LngLat } from '../journey/arc'

/** A point halfway along the sampled voyage, including its intentional sea waypoints. */
export function voyageMidpoint(points: LngLat[]): LngLat {
  if (!points.length) return [-140, -15]
  if (points.length === 1) return points[0]
  const lengths = points.slice(1).map((point, index) => haversineMiles(points[index], point))
  let remaining = lengths.reduce((sum, miles) => sum + miles, 0) / 2
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      return greatCirclePoint(points[index], points[index + 1], lengths[index] ? remaining / lengths[index] : 0)
    }
    remaining -= lengths[index]
  }
  return points[0]
}

/** Size the physical sphere to a scene slot; latitude compensation prevents polar zoom-in. */
export function globeOverviewZoom(diameter: number, viewportHeight: number, latitude: number, fovDegrees = 36.86989765): number {
  const radius = Math.max(60, diameter / 2)
  const focal = Math.max(1, viewportHeight) / (2 * Math.tan(fovDegrees * Math.PI / 360))
  const projectedTerm = radius * radius / focal
  const sphereRadius = projectedTerm + Math.sqrt(projectedTerm * projectedTerm + radius * radius)
  const latitudeScale = Math.cos(Math.min(85.051129, Math.abs(latitude)) * Math.PI / 180)
  return Math.max(-2, Math.min(4, Math.log2(sphereRadius * 2 * Math.PI * latitudeScale / 512)))
}
