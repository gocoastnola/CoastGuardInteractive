/**
 * npm run build:zips
 *
 * Builds `public/data/zips.json` — a compact ZIP → [lat, lng] lookup — from the
 * U.S. Census Bureau 2020 ZCTA Gazetteer (public domain, U.S. federal work).
 *
 *   Source: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip
 *   Columns (tab-separated): GEOID ALAND AWATER ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG
 *
 * The raw zip is cached in `data-src/` (git-ignored). If it is missing the
 * script downloads it; with no network it fails loudly — it never invents data.
 *
 * Output format: {"70115":[29.92,-90.1], ...} — coordinates are the ZCTA's
 * internal point rounded to 2 decimals (~1 km), i.e. city-level accuracy.
 * ZCTAs are Census approximations of USPS ZIP delivery areas; a few ZIPs
 * (PO-box-only, very new) have no ZCTA and will not resolve.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

export const SOURCE_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const cacheDir = resolve(root, 'data-src')
const zipPath = resolve(cacheDir, '2020_Gaz_zcta_national.zip')
const outPath = resolve(root, 'public/data/zips.json')

/** Minimal reader for a single-entry, deflate-compressed zip (keeps the script dependency-free). */
export function readFirstZipEntry(buf: Buffer): Buffer {
  // End of central directory record → central directory → first local header.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('not a zip file (no end-of-central-directory record)')
  const cdOffset = buf.readUInt32LE(eocd + 16)
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) throw new Error('bad central directory')
  const method = buf.readUInt16LE(cdOffset + 10)
  const compSize = buf.readUInt32LE(cdOffset + 20)
  const localOffset = buf.readUInt32LE(cdOffset + 42)
  if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('bad local file header')
  const nameLen = buf.readUInt16LE(localOffset + 26)
  const extraLen = buf.readUInt16LE(localOffset + 28)
  const dataStart = localOffset + 30 + nameLen + extraLen
  const data = buf.subarray(dataStart, dataStart + compSize)
  if (method === 0) return Buffer.from(data)
  if (method === 8) return inflateRawSync(data)
  throw new Error(`unsupported zip compression method ${method}`)
}

/** Parses the gazetteer text into { zip: [lat, lng] } rounded to 2 decimals. */
export function parseGazetteer(text: string): Record<string, [number, number]> {
  const lines = text.split(/\r?\n/)
  const header = lines[0].split('\t').map((h) => h.trim())
  const iGeoid = header.indexOf('GEOID')
  const iLat = header.indexOf('INTPTLAT')
  const iLng = header.indexOf('INTPTLONG')
  if (iGeoid < 0 || iLat < 0 || iLng < 0) throw new Error(`unexpected header: ${header.join(',')}`)
  const out: Record<string, [number, number]> = {}
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (!row.trim()) continue
    const cols = row.split('\t')
    const zip = cols[iGeoid].trim()
    const lat = Number(cols[iLat])
    const lng = Number(cols[iLng])
    if (!/^\d{5}$/.test(zip) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    out[zip] = [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100]
  }
  return out
}

async function main() {
  mkdirSync(cacheDir, { recursive: true })
  if (!existsSync(zipPath)) {
    console.log(`↓ downloading ${SOURCE_URL}`)
    const res = await fetch(SOURCE_URL)
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`)
    writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))
  } else {
    console.log(`• using cached ${zipPath}`)
  }
  const text = readFirstZipEntry(readFileSync(zipPath)).toString('utf8')
  const zips = parseGazetteer(text)
  const count = Object.keys(zips).length
  if (count < 30000) throw new Error(`only ${count} ZCTAs parsed — refusing to write a suspicious file`)
  mkdirSync(dirname(outPath), { recursive: true })
  const json = JSON.stringify(zips)
  writeFileSync(outPath, json)
  console.log(`✓ wrote ${outPath}: ${count} ZIPs, ${(json.length / 1024).toFixed(0)} KB`)
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((err) => {
    console.error('✗ build-zips failed:', (err as Error).message)
    process.exit(1)
  })
}
