import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidZipFormat, loadZipTable, lookupZip, resetZipCache, stateForZip, ZIPS_URL } from './zips'

const TABLE = { '70115': [29.92, -90.1], '08204': [38.97, -74.92], '96910': [13.47, 144.75] }

function mockFetch(ok = true) {
  return vi.fn(async (url: string | URL | Request) => {
    expect(String(url)).toBe(ZIPS_URL)
    return { ok, status: ok ? 200 : 503, json: async () => TABLE } as Response
  }) as unknown as typeof fetch
}

beforeEach(() => resetZipCache())

describe('isValidZipFormat', () => {
  it('accepts exactly five digits', () => {
    expect(isValidZipFormat('70115')).toBe(true)
    expect(isValidZipFormat('7011')).toBe(false)
    expect(isValidZipFormat('701155')).toBe(false)
    expect(isValidZipFormat('7011a')).toBe(false)
  })
})

describe('lookupZip', () => {
  it('resolves a known ZIP with coordinates and a state label', async () => {
    const r = await lookupZip('70115', mockFetch())
    expect(r).toEqual({ zip: '70115', lat: 29.92, lng: -90.1, state: 'Louisiana', label: 'ZIP 70115 · Louisiana' })
  })
  it('returns null for an unknown ZIP and for a malformed one', async () => {
    expect(await lookupZip('00000', mockFetch())).toBeNull()
    const f = mockFetch()
    expect(await lookupZip('abc', f)).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  it('fetches the table once and caches it', async () => {
    const f = mockFetch()
    await Promise.all([loadZipTable(f), loadZipTable(f)])
    await lookupZip('08204', f)
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('rejects when the table cannot be loaded', async () => {
    await expect(lookupZip('70115', mockFetch(false))).rejects.toThrow(/unavailable/)
  })
})

describe('stateForZip', () => {
  it('maps common prefixes', () => {
    expect(stateForZip('70115')).toBe('Louisiana')
    expect(stateForZip('08204')).toBe('New Jersey')
    expect(stateForZip('10001')).toBe('New York')
    expect(stateForZip('90210')).toBe('California')
    expect(stateForZip('99501')).toBe('Alaska')
    expect(stateForZip('96910')).toBe('Guam')
    expect(stateForZip('00901')).toBe('Puerto Rico')
    expect(stateForZip('73301')).toBe('Texas')
    expect(stateForZip('20500')).toBe('District of Columbia')
  })
  it('returns null for unassigned prefixes', () => {
    expect(stateForZip('00001')).toBeNull()
    expect(stateForZip('42900')).toBeNull()
  })
})
