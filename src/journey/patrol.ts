/**
 * USCGC Polar Star first-patrol route (owner-directed story beat; see
 * DECISIONS.md "World patrol exception"). Seattle → Honolulu → Hobart →
 * Wellington → Punta Arenas → Cape Horn → Rio de Janeiro → Panama Canal →
 * Seattle. Coordinates are approximate, sea-routed and demo-unverified;
 * `via` points exist only to keep arcs off land masses.
 *
 * Pure data + math — no map or React imports (testable in Vitest).
 */
import { greatCircleArc, haversineMiles, type LngLat } from './arc'

export const POLAR_STAR_ID = 'cutter-polar-star'

export interface PortStop {
  id: string
  /** Port name shown on the card. */
  name: string
  country: string
  flag: string
  lngLat: LngLat
  /** One-line vibe for the port card (demo copy). */
  blurb: string
  /** Image under public/media (DVIDS, public domain — see ASSET_LICENSES.md). */
  img: string
  /** Invisible waypoints between the PREVIOUS stop and this one (sea routing). */
  via?: LngLat[]
  /** Panama gets the lock animation. */
  special?: 'canal' | 'homecoming' | 'capeHorn'
}

export const SEATTLE: LngLat = [-122.3331, 47.5906]

export const PATROL_STOPS: PortStop[] = [
  {
    id: 'depart-seattle',
    name: 'Seattle',
    country: 'United States',
    flag: '🇺🇸',
    lngLat: SEATTLE,
    blurb: 'Lines in. The only heavy icebreaker in the fleet is underway — and you are on it.',
    img: '/media/port-seattle.jpg',
  },
  {
    id: 'honolulu',
    name: 'Honolulu',
    country: 'United States',
    flag: '🇺🇸',
    lngLat: [-157.8581, 21.3069],
    blurb: 'First port call: fuel, fresh stores, and your first liberty in paradise.',
    img: '/media/port-honolulu.jpg',
  },
  {
    id: 'hobart',
    name: 'Hobart, Tasmania',
    country: 'Australia',
    flag: '🇦🇺',
    lngLat: [147.3272, -42.8821],
    blurb: 'Across the entire Pacific. The last green hills before the Southern Ocean.',
    img: '/media/port-hobart.jpg',
  },
  {
    id: 'wellington',
    name: 'Wellington',
    country: 'New Zealand',
    flag: '🇳🇿',
    lngLat: [174.7762, -41.2866],
    blurb: 'Kiwi hospitality, one last mail call — then the roaring forties.',
    img: '/media/port-wellington.jpg',
  },
  {
    id: 'punta-arenas',
    name: 'Punta Arenas, Patagonia',
    country: 'Chile',
    flag: '🇨🇱',
    lngLat: [-70.9171, -53.1638],
    blurb: 'Glaciers to port, penguins to starboard. Patagonia earns its legend.',
    img: '/media/port-punta-arenas.jpg',
    via: [[-130, -55]],
  },
  {
    id: 'cape-horn',
    name: 'Cape Horn',
    country: 'Chile',
    flag: '🇨🇱',
    lngLat: [-67.2726, -55.9797],
    blurb: 'Rounding the Horn — the sailors\u2019 rite of passage at the bottom of the world.',
    img: '/media/port-cape-horn.jpg',
    special: 'capeHorn',
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    flag: '🇧🇷',
    lngLat: [-43.1729, -22.9068],
    blurb: 'Up the Atlantic coast. Liberty under Sugarloaf with partner navies.',
    img: '/media/port-rio.jpg',
    via: [
      [-55, -40],
      [-47, -30],
    ],
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    country: 'Panama',
    flag: '🇵🇦',
    lngLat: [-79.68, 9.1],
    blurb: '85 feet up and over the continental divide — lock by lock, ocean to ocean.',
    img: '/media/port-panama.jpg',
    special: 'canal',
    via: [
      [-34.5, -5.5],
      [-55, 12],
      [-70, 11.5],
    ],
  },
  {
    id: 'home-seattle',
    name: 'Seattle — Home',
    country: 'United States',
    flag: '🇺🇸',
    lngLat: SEATTLE,
    blurb: 'Families on the pier. You just circumnavigated South America on your first patrol.',
    img: '/media/port-homecoming.jpg',
    special: 'homecoming',
    via: [
      [-90, 10],
      [-110, 18],
      [-125, 32],
    ],
  },
]

export interface PatrolLeg {
  from: PortStop
  to: PortStop
  /** Sampled, antimeridian-unwrapped polyline (continuous with prior legs). */
  points: LngLat[]
  miles: number
}

/**
 * Chains `greatCircleArc` through each stop's `via` points, keeping longitudes
 * continuous across segment joins so the full path never jumps the antimeridian.
 */
export function buildPatrolLegs(stops: PortStop[] = PATROL_STOPS, samplesPerSegment = 48): PatrolLeg[] {
  const legs: PatrolLeg[] = []
  // Longitude offset carried forward so each leg starts where the last ended.
  let carry = 0
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1]
    const to = stops[i]
    const chain: LngLat[] = [from.lngLat, ...(to.via ?? []), to.lngLat]
    const pts: LngLat[] = []
    for (let s = 1; s < chain.length; s++) {
      const seg = greatCircleArc(chain[s - 1], chain[s], samplesPerSegment)
      if (s === 1) {
        pts.push(...seg)
        continue
      }
      // Re-anchor this segment onto the previous one: its first point is the
      // same geographic location as the previous segment's last point, so any
      // difference is a whole number of world wraps.
      const prevLast = pts[pts.length - 1][0]
      const segOffset = Math.round((prevLast - seg[0][0]) / 360) * 360
      pts.push(...seg.slice(1).map(([lng, lat]) => [lng + segOffset, lat] as LngLat))
    }
    // Re-anchor this leg's start near the previous leg's end (unwrap continuity).
    const prevEnd = legs.length ? legs[legs.length - 1].points[legs[legs.length - 1].points.length - 1][0] : pts[0][0] + carry
    let offset = carry
    while (pts[0][0] + offset - prevEnd > 180) offset -= 360
    while (pts[0][0] + offset - prevEnd < -180) offset += 360
    const shifted = pts.map(([lng, lat]) => [lng + offset, lat] as LngLat)
    carry = offset
    let miles = 0
    for (const [a, b] of chain.map((p, idx, arr) => [p, arr[idx + 1]] as const).slice(0, -1)) {
      miles += haversineMiles(a, b)
    }
    legs.push({ from, to, points: shifted, miles })
  }
  return legs
}

/** Total patrol distance (statute miles) across all legs. */
export function patrolMiles(legs: PatrolLeg[]): number {
  return legs.reduce((sum, l) => sum + l.miles, 0)
}

/** Seconds a leg's arc animation should take — longer hops read bigger. */
export function legDuration(leg: PatrolLeg): number {
  return Math.min(2.4, 0.9 + leg.miles / 5500)
}
