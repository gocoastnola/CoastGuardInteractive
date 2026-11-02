/**
 * Journey constants. Everything here is demo data — see SOURCES.md.
 */

export interface Waypoint {
  id: string
  name: string
  city: string
  state: string
  /** Two-letter postal code, used for short labels. */
  stateCode: string
  lat: number
  lng: number
  /** Always false in this build: coordinates are approximate / demo-unverified. */
  coordsVerified: false
}

/**
 * The Coast Guard's single enlisted boot camp is Training Center Cape May, Cape May, New Jersey
 * (public knowledge). Coordinates are approximate and demo-unverified.
 */
export const CAPE_MAY: Waypoint = {
  id: 'tracen-cape-may',
  name: 'Training Center Cape May',
  city: 'Cape May',
  state: 'New Jersey',
  stateCode: 'NJ',
  lat: 38.9325,
  lng: -74.915,
  coordsVerified: false,
}

/** Act 1 timing (seconds). Total ≈ 12 s before the orders board appears. */
export const ACT1 = {
  countdown: 3.2, // days counter ticks today → ship date while the camera begins its fly-in
  fly: 4.6, // slow cinematic flyTo national view → Cape May (overlaps countdown + weeks)
  weeks: 5.4, // Week 1 → Week 8 bar fills
  graduate: 2.6, // last beat holds before the board
} as const

/** Legacy ZIP-era Act 1 timing (hometown → Cape May arc); unused, kept with ZipEntry. */
export const ACT1_ARC = {
  frameBoth: 2.2,
  arc: 6.0,
  arrive: 2.6,
  graduate: 2.4,
} as const

/** Act 2 timing (seconds). */
export const ACT2 = {
  frameBoth: 2.0,
  arc: 5.0,
  arrive: 2.8, // matches the existing StationPanel flyTo duration
} as const

/** Number of vertices sampled along a great-circle arc. */
export const ARC_SAMPLES = 160

/** Number of unit cards in the orders deck. */
export const ORDERS_COUNT = 3
