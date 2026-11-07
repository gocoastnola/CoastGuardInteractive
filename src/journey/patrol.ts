/**
 * USCGC Polar Star first-patrol route (owner-directed story beat; see
 * DECISIONS.md "World patrol exception"). Seattle → Honolulu → Hobart →
 * Wellington → McMurdo Station → Punta Arenas → Cape Horn → Rio de Janeiro → Panama Canal →
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
  /** Verified source for the existing port-call photograph. */
  photoSource?: string
  /** Optional multi-photo gallery, used for the Antarctic science mission. */
  gallery?: { img: string; caption: string; source: string }[]
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
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Panorama%20of%20Honolulu-Waikiki-Diamond%20Head%20(16773142068).jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Panorama%20of%20Honolulu-Waikiki-Diamond%20Head%20(16773142068).jpg',
  },
  {
    id: 'hobart',
    name: 'Hobart, Tasmania',
    country: 'Australia',
    flag: '🇦🇺',
    lngLat: [147.3272, -42.8821],
    blurb: 'Across the entire Pacific. The last green hills before the Southern Ocean.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mt%20Wellington%20looking%20down%20on%20Hobart%2C%20Tasmania.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Mt%20Wellington%20looking%20down%20on%20Hobart%2C%20Tasmania.jpg',
  },
  {
    id: 'wellington',
    name: 'Wellington',
    country: 'New Zealand',
    flag: '🇳🇿',
    lngLat: [174.7762, -41.2866],
    blurb: 'Kiwi hospitality, one last mail call — then the roaring forties.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Wellington%20Port%20from%20Mt%20Vic.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Wellington%20Port%20from%20Mt%20Vic.jpg',
  },
  {
    id: 'mcmurdo',
    name: 'McMurdo Station, Antarctica',
    country: 'Antarctica · Ross Island',
    flag: '🇦🇶',
    lngLat: [166.6682, -77.8463],
    blurb: 'Operation Deep Freeze: carve a channel through Antarctic sea ice, deliver vital supplies, and help keep a world-class scientific research station running.',
    img: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2602/9520592/1000w_q95.jpg',
    photoSource: 'https://www.dvidshub.net/image/9520592/uscg-polar-star-wagb-10-supports-mcmurdo-station-during-operation-deep-freeze-2026',
    gallery: [
      {
        img: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2602/9520592/1000w_q95.jpg',
        caption: 'POLAR STAR · MOORED AT McMURDO ICE PIER',
        source: 'https://www.dvidshub.net/image/9520592',
      },
      {
        img: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/1602/2400145/1000w_q95.jpg',
        caption: 'POLAR STAR · BREAKING ANTARCTIC ICE',
        source: 'https://www.dvidshub.net/image/2400145',
      },
      {
        img: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2601/9481427/1000w_q95.jpg',
        caption: 'POLAR STAR · FORGING THROUGH McMURDO SOUND',
        source: 'https://www.dvidshub.net/image/9481427',
      },
      {
        img: 'https://commons.wikimedia.org/wiki/Special:FilePath/McMurdo%20Station%20in%20Antarctica.jpg?width=1200',
        caption: 'McMURDO STATION · ANTARCTIC RESEARCH BASE',
        source: 'https://commons.wikimedia.org/wiki/File:McMurdo_Station_in_Antarctica.jpg',
      },
    ],
    via: [[174, -57], [173, -66], [168, -73]],
  },
  {
    id: 'punta-arenas',
    name: 'Punta Arenas, Patagonia',
    country: 'Chile',
    flag: '🇨🇱',
    lngLat: [-70.9171, -53.1638],
    blurb: 'Glaciers to port, penguins to starboard. Patagonia earns its legend.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Magellanic%20Penguins%2C%20Isla%20Magdalena.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Magellanic%20Penguins%2C%20Isla%20Magdalena.jpg',
    via: [[-170, -69], [-145, -63], [-115, -60], [-90, -58]],
  },
  {
    id: 'cape-horn',
    name: 'Cape Horn',
    country: 'Chile',
    flag: '🇨🇱',
    lngLat: [-67.2726, -55.9797],
    blurb: 'Rounding the Horn — the sailors\u2019 rite of passage at the bottom of the world.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/CapeHorn.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:CapeHorn.jpg',
    special: 'capeHorn',
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    flag: '🇧🇷',
    lngLat: [-43.1729, -22.9068],
    blurb: 'Up the Atlantic coast. Liberty under Sugarloaf with partner navies.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rio%20skyline%20and%20Cristo%20Redentor%20from%20Sugarloaf%20Mountain%2C%20Brazil.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Rio%20skyline%20and%20Cristo%20Redentor%20from%20Sugarloaf%20Mountain%2C%20Brazil.jpg',
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
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Miraflores%20Locks%2C%20Panama%20Canal%2C%20Panama.jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Miraflores%20Locks%2C%20Panama%20Canal%2C%20Panama.jpg',
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
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Seattle%20Skyline%20(52802453072).jpg?width=1200',
    photoSource: 'https://commons.wikimedia.org/wiki/File:The%20Seattle%20Skyline%20(52802453072).jpg',
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
