/**
 * Offline ZIP → coordinates lookup.
 *
 * `public/data/zips.json` is built by `npm run build:zips` from the U.S. Census
 * 2020 ZCTA Gazetteer (public domain). It is fetched lazily on the first ZIP
 * submit and cached in memory. Coordinates are ZCTA internal points rounded to
 * 2 decimals (~1 km) — city-level, not street-level.
 *
 * The gazetteer carries no place names, so the state label comes from the
 * standard 3-digit ZIP-prefix → state table below (public knowledge).
 */

export type ZipTable = Record<string, [number, number]>

export interface ZipResult {
  zip: string
  lat: number
  lng: number
  /** Full state / territory name, or null if the prefix is unknown. */
  state: string | null
  /** e.g. "ZIP 70115 · Louisiana" */
  label: string
}

export const ZIPS_URL = '/data/zips.json'

let cache: ZipTable | null = null
let inflight: Promise<ZipTable> | null = null

export function isValidZipFormat(input: string): boolean {
  return /^\d{5}$/.test(input)
}

/** Loads the table once; concurrent callers share one request. */
export function loadZipTable(fetchImpl: typeof fetch = fetch): Promise<ZipTable> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetchImpl(ZIPS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`ZIP table unavailable (HTTP ${res.status})`)
        return res.json() as Promise<ZipTable>
      })
      .then((table) => {
        cache = table
        return table
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Test hook — forget the cached table. */
export function resetZipCache(): void {
  cache = null
  inflight = null
}

/** Resolves a 5-digit ZIP to coordinates + label, or null when unknown. */
export async function lookupZip(zip: string, fetchImpl: typeof fetch = fetch): Promise<ZipResult | null> {
  if (!isValidZipFormat(zip)) return null
  const table = await loadZipTable(fetchImpl)
  const hit = table[zip]
  if (!hit) return null
  const state = stateForZip(zip)
  return { zip, lat: hit[0], lng: hit[1], state, label: `ZIP ${zip} · ${state ?? 'United States'}` }
}

/* ------------------------------------------------------------------------ */
/* 3-digit prefix → state. Ranges are inclusive; first match wins.           */
/* ------------------------------------------------------------------------ */

type Range = [from: number, to: number, state: string]

const PREFIX_RANGES: Range[] = [
  [5, 5, 'New York'],
  [6, 7, 'Puerto Rico'],
  [8, 8, 'U.S. Virgin Islands'],
  [9, 9, 'Puerto Rico'],
  [10, 27, 'Massachusetts'],
  [28, 29, 'Rhode Island'],
  [30, 38, 'New Hampshire'],
  [39, 49, 'Maine'],
  [50, 59, 'Vermont'],
  [60, 69, 'Connecticut'],
  [70, 89, 'New Jersey'],
  [90, 99, 'Armed Forces Europe'],
  [100, 149, 'New York'],
  [150, 196, 'Pennsylvania'],
  [197, 199, 'Delaware'],
  [200, 200, 'District of Columbia'],
  [201, 201, 'Virginia'],
  [202, 205, 'District of Columbia'],
  [206, 219, 'Maryland'],
  [220, 246, 'Virginia'],
  [247, 268, 'West Virginia'],
  [270, 289, 'North Carolina'],
  [290, 299, 'South Carolina'],
  [300, 319, 'Georgia'],
  [320, 339, 'Florida'],
  [340, 340, 'Armed Forces Americas'],
  [341, 349, 'Florida'],
  [350, 369, 'Alabama'],
  [370, 385, 'Tennessee'],
  [386, 397, 'Mississippi'],
  [398, 399, 'Georgia'],
  [400, 427, 'Kentucky'],
  [430, 459, 'Ohio'],
  [460, 479, 'Indiana'],
  [480, 499, 'Michigan'],
  [500, 528, 'Iowa'],
  [530, 549, 'Wisconsin'],
  [550, 567, 'Minnesota'],
  [570, 577, 'South Dakota'],
  [580, 588, 'North Dakota'],
  [590, 599, 'Montana'],
  [600, 629, 'Illinois'],
  [630, 658, 'Missouri'],
  [660, 679, 'Kansas'],
  [680, 693, 'Nebraska'],
  [700, 715, 'Louisiana'],
  [716, 729, 'Arkansas'],
  [730, 732, 'Oklahoma'],
  [733, 733, 'Texas'],
  [734, 749, 'Oklahoma'],
  [750, 799, 'Texas'],
  [800, 816, 'Colorado'],
  [820, 831, 'Wyoming'],
  [832, 838, 'Idaho'],
  [840, 847, 'Utah'],
  [850, 865, 'Arizona'],
  [870, 884, 'New Mexico'],
  [885, 885, 'Texas'],
  [889, 898, 'Nevada'],
  [900, 961, 'California'],
  [962, 966, 'Armed Forces Pacific'],
  [967, 968, 'Hawaii'],
  [969, 969, 'Guam'],
  [970, 979, 'Oregon'],
  [980, 994, 'Washington'],
  [995, 999, 'Alaska'],
]

/** State / territory name for a ZIP (by 3-digit prefix), or null if unknown. */
export function stateForZip(zip: string): string | null {
  if (!/^\d{3}/.test(zip)) return null
  const prefix = Number(zip.slice(0, 3))
  for (const [from, to, state] of PREFIX_RANGES) {
    if (prefix >= from && prefix <= to) return state
  }
  return null
}
