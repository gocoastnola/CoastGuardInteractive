/**
 * "Orders are in" — picks the three first-unit candidates for a ZIP.
 *
 * Deterministic: the ZIP seeds a small PRNG, so the same ZIP always yields the
 * same three ids. Guarantees three distinct unit types and at least two
 * distinct coasts. This is a game mechanic, NOT a real assignment process.
 */
import type { Unit } from '../data/schema'
import { haversineMiles } from './arc'
import { CAPE_MAY, ORDERS_COUNT } from './constants'

export type Coast = 'Gulf' | 'Atlantic' | 'Pacific' | 'Caribbean'

/** Rough coastal classification by region/longitude (demo heuristic). */
export function coastOf(unit: Pick<Unit, 'region' | 'lat' | 'lng'>): Coast {
  if (unit.region === 'alaska' || unit.region === 'guam') return 'Pacific'
  if (unit.region === 'puertorico') return 'Caribbean'
  if (unit.lng < -110) return 'Pacific'
  if (unit.lat < 31.5 && unit.lng < -80.5) return 'Gulf'
  return 'Atlantic'
}

/** FNV-1a 32-bit hash of a string. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** mulberry32 — tiny seeded PRNG, good enough for a deterministic shuffle. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface OrderCard {
  unit: Unit
  coast: Coast
  /** Great-circle miles from Training Center Cape May. */
  milesFromCapeMay: number
}

/**
 * Picks `count` units for a ZIP. Candidates exclude Training Centers (you just
 * left one). Falls back gracefully when the dataset is too small to satisfy
 * the variety rules.
 */
export function pickOrders(zip: string, units: Unit[], count = ORDERS_COUNT): OrderCard[] {
  const rng = mulberry32(hashString(`orders:${zip}`))
  const pool = units.filter((u) => u.unitType !== 'Training Center')
  // Fisher–Yates with the seeded PRNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const picks: Unit[] = []
  for (const u of pool) {
    if (picks.length >= count) break
    if (picks.some((p) => p.unitType === u.unitType)) continue
    picks.push(u)
  }
  // Not enough distinct types in the data: top up with anything left.
  for (const u of pool) {
    if (picks.length >= count) break
    if (!picks.includes(u)) picks.push(u)
  }

  // Coast variety: if all picks share one coast, swap the last pick for a
  // unit on another coast whose type is still unused.
  const coasts = new Set(picks.map(coastOf))
  if (picks.length === count && coasts.size < 2) {
    const usedTypes = new Set(picks.slice(0, -1).map((p) => p.unitType))
    const swap = pool.find(
      (u) => !picks.includes(u) && !usedTypes.has(u.unitType) && !coasts.has(coastOf(u)),
    )
    if (swap) picks[picks.length - 1] = swap
  }

  return picks.map((unit) => ({
    unit,
    coast: coastOf(unit),
    milesFromCapeMay: haversineMiles([CAPE_MAY.lng, CAPE_MAY.lat], [unit.lng, unit.lat]),
  }))
}
