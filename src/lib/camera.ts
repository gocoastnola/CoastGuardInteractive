import type { LngLatBoundsLike } from 'maplibre-gl'
import { REGION_BOUNDS, type Region } from '../data/schema'

export type JumpTarget = Region | 'gulf'

export const JUMP_LABELS: Record<JumpTarget, string> = {
  conus: 'National',
  gulf: 'Gulf Coast',
  alaska: 'Alaska',
  puertorico: 'Puerto Rico',
  guam: 'Guam',
}

export const JUMP_ORDER: JumpTarget[] = ['conus', 'gulf', 'alaska', 'puertorico', 'guam']

const GULF = { west: -97.8, south: 25.5, east: -82.0, north: 31.2 }

export function boundsFor(target: JumpTarget): LngLatBoundsLike {
  const b = target === 'gulf' ? GULF : REGION_BOUNDS[target]
  return [
    [b.west, b.south],
    [b.east, b.north],
  ]
}

/** Default national framing, used by the landing → map transition and "Back to map". */
export const NATIONAL_VIEW = {
  bounds: boundsFor('conus'),
  padding: { top: 90, bottom: 90, left: 60, right: 60 },
}

/** Pseudo-random but stable bearing per unit so each fly-in feels unique. */
export function bearingFor(id: string): number {
  let h = 0
  for (const ch of id) h = (h * 17 + ch.charCodeAt(0)) % 1000
  return (h / 1000) * 50 - 25 // -25 … +25 degrees
}
