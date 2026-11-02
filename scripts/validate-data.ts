/**
 * npm run validate:data
 * Validates src/data/units.json against the zod schema plus cross-record rules.
 * Exits non-zero on any issue so it can gate CI / commits.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { validateUnits } from '../src/data/schema'

const here = dirname(fileURLToPath(import.meta.url))
const file = resolve(here, '../src/data/units.json')

let raw: unknown
try {
  raw = JSON.parse(readFileSync(file, 'utf8'))
} catch (err) {
  console.error(`✗ Could not read/parse ${file}:`, (err as Error).message)
  process.exit(1)
}

const { units, issues } = validateUnits(raw)

if (issues.length) {
  console.error(`✗ ${issues.length} issue(s) in units.json:`)
  for (const i of issues) {
    console.error(`  [${i.index}${i.id ? ` ${i.id}` : ''}] ${i.message}`)
  }
  process.exit(1)
}

const byRegion = units.reduce<Record<string, number>>((acc, u) => {
  acc[u.region] = (acc[u.region] ?? 0) + 1
  return acc
}, {})
const unverified = units.filter((u) => u.contentReviewStatus !== 'verified').length

console.log(`✓ ${units.length} unit(s) valid`)
console.log(`  regions: ${JSON.stringify(byRegion)}`)
console.log(`  content pending verification: ${unverified}/${units.length}`)
