/**
 * Great-circle maths for the journey arcs. Pure functions, no map dependency.
 * Coordinates are [lng, lat] (GeoJSON order) unless a name says otherwise.
 */

export type LngLat = [number, number]

const EARTH_RADIUS_MI = 3958.7613
const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Great-circle distance in statute miles (haversine). */
export function haversineMiles(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(s)))
}

/**
 * Point at fraction `t` (0..1) along the great circle from `a` to `b`
 * (spherical linear interpolation). Returns `a` when the points coincide.
 */
export function greatCirclePoint(a: LngLat, b: LngLat, t: number): LngLat {
  const φ1 = toRad(a[1])
  const λ1 = toRad(a[0])
  const φ2 = toRad(b[1])
  const λ2 = toRad(b[0])
  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
        ),
      ),
    )
  if (d < 1e-9) return [a[0], a[1]]
  const A = Math.sin((1 - t) * d) / Math.sin(d)
  const B = Math.sin(t * d) / Math.sin(d)
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
  const z = A * Math.sin(φ1) + B * Math.sin(φ2)
  return [toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]
}

/**
 * Samples `n` points (inclusive of both ends) along the great circle a→b.
 * Longitudes are unwrapped so the line never jumps across the antimeridian
 * (consecutive points always differ by < 180°); the map renders world copies.
 */
export function greatCircleArc(a: LngLat, b: LngLat, n = 128): LngLat[] {
  const count = Math.max(2, Math.round(n))
  const pts: LngLat[] = []
  for (let i = 0; i < count; i++) {
    pts.push(greatCirclePoint(a, b, i / (count - 1)))
  }
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1][0]
    let lng = pts[i][0]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    pts[i] = [lng, pts[i][1]]
  }
  return pts
}

/**
 * Returns the visible prefix of a sampled arc for progress `t` (0..1),
 * with the head point interpolated so motion is smooth between samples.
 */
export function arcPrefix(points: LngLat[], t: number): { line: LngLat[]; head: LngLat } {
  const clamped = Math.max(0, Math.min(1, t))
  if (points.length < 2) return { line: points.slice(), head: points[0] ?? [0, 0] }
  const scaled = clamped * (points.length - 1)
  const idx = Math.floor(scaled)
  const frac = scaled - idx
  const line = points.slice(0, idx + 1)
  const head: LngLat =
    idx >= points.length - 1
      ? points[points.length - 1]
      : [
          points[idx][0] + (points[idx + 1][0] - points[idx][0]) * frac,
          points[idx][1] + (points[idx + 1][1] - points[idx][1]) * frac,
        ]
  if (frac > 0 && idx < points.length - 1) line.push(head)
  return { line, head }
}

/** Axis-aligned bounds of a point list as [[west, south], [east, north]]. */
export function boundsOf(points: LngLat[]): [LngLat, LngLat] {
  let w = Infinity
  let s = Infinity
  let e = -Infinity
  let n = -Infinity
  for (const [lng, lat] of points) {
    if (lng < w) w = lng
    if (lng > e) e = lng
    if (lat < s) s = lat
    if (lat > n) n = lat
  }
  return [
    [w, s],
    [e, n],
  ]
}

/** "1,247" style rounding for the miles counter. */
export function formatMiles(miles: number): string {
  return Math.round(miles).toLocaleString('en-US')
}
