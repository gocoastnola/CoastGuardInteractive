import { greatCirclePoint, haversineMiles, type LngLat } from '../journey/arc'
import type { Map as MLMap, PaddingOptions } from 'maplibre-gl'

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

/** A broad latitude that brings both Seattle and the Antarctic coast into view. */
export const PATROL_OVERVIEW_LATITUDE = -20

/** Globe easeTo chooses the shortest longitude arc, so advance in bounded quarter turns. */
export function nextPatrolOverviewCenter(longitude: number): LngLat {
  return [((longitude + 90 + 180) % 360 + 360) % 360 - 180, PATROL_OVERVIEW_LATITUDE]
}

type PatrolOverviewMap = Pick<MLMap, 'getCenter' | 'jumpTo' | 'easeTo' | 'on' | 'off'>

/**
 * Run native camera segments without a timer or a per-frame camera writer.
 * Cancel this listener before stopping the map: stop() emits moveend too.
 */
export function startPatrolOverviewCamera(
  map: PatrolOverviewMap,
  frame: { zoom: number; padding: PaddingOptions },
  opts: { reflow?: boolean; reducedMotion?: boolean; paused?: boolean } = {},
): () => void {
  let active = true
  let pendingMoveEnd: (() => void) | null = null
  const camera = { ...frame, bearing: -18, pitch: 0 }
  const cancelForUser = (event: { originalEvent?: Event }) => {
    if (event.originalEvent) cancel()
  }
  const cancel = () => {
    active = false
    if (pendingMoveEnd) map.off('moveend', pendingMoveEnd)
    pendingMoveEnd = null
    map.off('mousedown', cancel)
    map.off('touchstart', cancel)
    map.off('wheel', cancel)
    map.off('movestart', cancelForUser)
  }

  const afterMove = (next: () => void) => {
    const listener = () => {
      map.off('moveend', listener)
      if (pendingMoveEnd === listener) pendingMoveEnd = null
      if (active) next()
    }
    pendingMoveEnd = listener
    map.on('moveend', listener)
  }

  const rotate = () => {
    if (!active) return
    afterMove(rotate)
    map.easeTo({
      ...camera,
      center: nextPatrolOverviewCenter(map.getCenter().lng),
      duration: 3000,
      easing: (t) => t,
      essential: true,
    })
  }

  const centered = { ...camera, center: [map.getCenter().lng, PATROL_OVERVIEW_LATITUDE] as LngLat }
  if (opts.reducedMotion || opts.reflow || opts.paused) map.jumpTo(centered)
  if (!opts.reducedMotion && !opts.paused) {
    // Input arrives before a gesture interrupts easeTo and emits its moveend.
    map.on('mousedown', cancel)
    map.on('touchstart', cancel)
    map.on('wheel', cancel)
    map.on('movestart', cancelForUser)
    if (opts.reflow) rotate()
    else {
      afterMove(rotate)
      map.easeTo({ ...centered, duration: 1000, essential: true })
    }
  }

  return cancel
}
