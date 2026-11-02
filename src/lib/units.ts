import rawUnits from '../data/units.json'
import { validateUnits, type Unit, type UnitType, type Region } from '../data/schema'

const { units: validated, issues } = validateUnits(rawUnits)
if (issues.length) {
  // Fail loudly in dev so bad data never silently ships.
  console.error('[CoastGuard Interactive] units.json failed validation:', issues)
}

export const UNITS: Unit[] = validated

export const UNIT_TYPE_COLORS: Record<UnitType, string> = {
  Sector: 'var(--type-sector)',
  Station: 'var(--type-station)',
  'Air Station': 'var(--type-air-station)',
  Base: 'var(--type-base)',
  Cutter: 'var(--type-cutter)',
  'Training Center': 'var(--type-training-center)',
  District: 'var(--type-district)',
}

export const REGION_LABELS: Record<Region, string> = {
  conus: 'Continental U.S.',
  alaska: 'Alaska',
  puertorico: 'Puerto Rico',
  guam: 'Guam',
}

export function unitById(id: string | null): Unit | null {
  if (!id) return null
  return UNITS.find((u) => u.id === id) ?? null
}

export interface DirectoryQuery {
  text: string
  types: UnitType[]
}

/** Case-insensitive search over name/city/state/type, plus optional type filter. */
export function filterUnits(units: Unit[], q: DirectoryQuery): Unit[] {
  const needle = q.text.trim().toLowerCase()
  return units
    .filter((u) => (q.types.length ? q.types.includes(u.unitType) : true))
    .filter((u) => {
      if (!needle) return true
      const hay = `${u.name} ${u.city} ${u.state} ${u.unitType} ${u.district ?? ''}`.toLowerCase()
      return hay.includes(needle)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Deterministic hue (0–360) per unit for header art variation. */
export function hueFor(id: string): number {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}
