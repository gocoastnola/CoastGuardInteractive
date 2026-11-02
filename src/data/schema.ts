import { z } from 'zod'

/**
 * Canonical data model for a Coast Guard unit record.
 * Every record in src/data/units.json must satisfy this schema.
 * `npm run validate:data` enforces it; Vitest also runs it.
 */

export const UNIT_TYPES = [
  'Sector',
  'Station',
  'Air Station',
  'Base',
  'Cutter',
  'Training Center',
  'District',
] as const

export const REGIONS = ['conus', 'alaska', 'puertorico', 'guam'] as const

export const CONTENT_REVIEW_STATUSES = [
  'demo-unverified',
  'in-review',
  'verified',
] as const

export const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string(),
})

export const UnitSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  unitType: z.enum(UNIT_TYPES),
  district: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  region: z.enum(REGIONS),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  coordsVerified: z.boolean(),
  missionSummary: z.string().min(1),
  history: z.string().min(1),
  sourceUrls: z.array(z.string().url()),
  lastVerified: z.string().nullable(),
  images: z.array(ImageSchema),
  narrationScript: z.string().min(1),
  narrationAudio: z.string().nullable(),
  contentReviewStatus: z.enum(CONTENT_REVIEW_STATUSES),
})

export const UnitsSchema = z.array(UnitSchema)

export type Unit = z.infer<typeof UnitSchema>
export type UnitType = Unit['unitType']
export type Region = Unit['region']
export type UnitImage = z.infer<typeof ImageSchema>

/** Rough bounding boxes per region, used for both validation and camera framing. */
export const REGION_BOUNDS: Record<Region, { west: number; south: number; east: number; north: number }> = {
  conus: { west: -125.5, south: 24.0, east: -66.5, north: 49.5 },
  alaska: { west: -172.0, south: 51.0, east: -129.5, north: 71.5 },
  puertorico: { west: -67.5, south: 17.7, east: -65.2, north: 18.6 },
  guam: { west: 144.5, south: 13.2, east: 145.0, north: 13.7 },
}

export interface ValidationIssue {
  index: number
  id?: string
  message: string
}

/**
 * Validates an unknown payload as a units array. Returns a list of issues
 * (empty when valid). Checks: schema, unique ids, coordinates inside
 * the declared region's bounding box.
 */
export function validateUnits(data: unknown): { units: Unit[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const parsed = UnitsSchema.safeParse(data)
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      const index = typeof err.path[0] === 'number' ? err.path[0] : -1
      issues.push({ index, message: `${err.path.join('.')}: ${err.message}` })
    }
    return { units: [], issues }
  }

  const seen = new Set<string>()
  parsed.data.forEach((u, index) => {
    if (seen.has(u.id)) issues.push({ index, id: u.id, message: `duplicate id "${u.id}"` })
    seen.add(u.id)

    const b = REGION_BOUNDS[u.region]
    if (u.lat < b.south || u.lat > b.north || u.lng < b.west || u.lng > b.east) {
      issues.push({
        index,
        id: u.id,
        message: `coordinates (${u.lat}, ${u.lng}) fall outside region "${u.region}" bounds`,
      })
    }
  })

  return { units: parsed.data, issues }
}
