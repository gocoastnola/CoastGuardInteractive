import { Marker, type Map as MLMap } from 'maplibre-gl'
import type { LngLat } from '../journey/arc'
import { publicAsset } from './assets'
import '../styles/patrol-vessel.css'

export interface PatrolVesselHandle {
  update(point: LngLat, from: LngLat, to: LngLat): void
  remove(): void
}

/** Use the same neighboring samples as arcPrefix, without building another path. */
export function routeTangent(points: LngLat[], progress: number): { from: LngLat; to: LngLat } {
  if (points.length < 2) {
    const point: LngLat = points[0] ?? [0, 0]
    return { from: point, to: point }
  }
  const clamped = Number.isNaN(progress) ? 0 : Math.max(0, Math.min(1, progress))
  const index = Math.min(points.length - 2, Math.floor(clamped * (points.length - 1)))
  return { from: points[index], to: points[index + 1] }
}

type ScreenPoint = { x: number; y: number }
type VesselDirection = 1 | -1

/** Keep the toy upright; a near-vertical tangent retains its last facing direction. */
export function vesselOrientation(
  from: ScreenPoint,
  to: ScreenPoint,
  previousDirection: VesselDirection = 1,
): { direction: VesselDirection; tilt: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) {
    return { direction: previousDirection, tilt: 0 }
  }
  const direction = Math.abs(dx) > Math.max(0.75, Math.abs(dy) * 0.12)
    ? dx < 0 ? -1 : 1
    : previousDirection
  const angle = Math.atan2(dy * direction, Math.abs(dx)) * 180 / Math.PI
  return { direction, tilt: Math.max(-14, Math.min(14, angle)) }
}

/** A single native globe marker; the caller supplies the exact visible route head. */
export function createPatrolVessel(map: MLMap): PatrolVesselHandle {
  const element = document.createElement('div')
  element.className = 'patrol-vessel'
  element.dataset.testid = 'patrol-vessel'
  element.title = 'USCGC Polar Star · illustrative patrol'
  element.setAttribute('aria-hidden', 'true')

  // MapLibre positions the outer element; facing and bobbing each get a child.
  const orientation = document.createElement('span')
  orientation.className = 'patrol-vessel-orientation'
  const float = document.createElement('span')
  float.className = 'patrol-vessel-float'
  const image = document.createElement('img')
  image.className = 'patrol-vessel-art'
  image.alt = ''
  image.setAttribute('aria-hidden', 'true')
  image.draggable = false
  const fallback = document.createElement('span')
  fallback.className = 'patrol-vessel-fallback'
  fallback.setAttribute('aria-hidden', 'true')
  const onImageError = () => element.classList.add('is-art-unavailable')
  image.addEventListener('error', onImageError)
  image.src = publicAsset('/media/polar-star-mini.svg')
  float.append(image, fallback)
  orientation.append(float)
  element.append(orientation)

  const marker = new Marker({
    element,
    anchor: 'center',
    pitchAlignment: 'viewport',
    rotationAlignment: 'viewport',
    opacityWhenCovered: 0,
    subpixelPositioning: true,
  })
  let attached = false
  let removed = false
  let direction: VesselDirection = 1
  let tangent: { from: LngLat; to: LngLat } | null = null

  const orient = () => {
    if (removed || !tangent) return
    const facing = vesselOrientation(map.project(tangent.from), map.project(tangent.to), direction)
    direction = facing.direction
    orientation.style.transform = `rotate(${facing.tilt}deg) scaleX(${direction})`
  }
  map.on('move', orient)

  return {
    update(point, from, to) {
      if (removed) return
      tangent = { from, to }
      element.dataset.lng = String(point[0])
      element.dataset.lat = String(point[1])
      marker.setLngLat(point)
      if (!attached) {
        marker.addTo(map)
        attached = true
      }
      orient()
    },
    remove() {
      if (removed) return
      removed = true
      map.off('move', orient)
      image.removeEventListener('error', onImageError)
      marker.remove()
      tangent = null
    },
  }
}
